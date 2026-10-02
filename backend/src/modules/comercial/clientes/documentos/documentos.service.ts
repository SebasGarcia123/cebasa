import { randomUUID } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Prisma } from '../../../../generated/prisma/client.js';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { EstadosLookupService } from '../../../../prisma/estados-lookup.service.js';
import { EmailService } from '../../../../email/email.service.js';
import { UPLOADS_DIR } from '../../../compras/archivo-adjunto/archivo-adjunto.storage.js';
import { DocumentoPdfService } from './documento-pdf.service.js';
import { CreateFacturaDto } from './dto/create-factura.dto.js';
import { CreateReciboDto } from './dto/create-recibo.dto.js';
import { CreateNotaDto } from './dto/create-nota.dto.js';

const ESTADO_PENDIENTE = 'Pendiente';
const ESTADO_FACTURADO = 'Facturado';

const TIPO_DOC_FACTURA = 'Factura';
const TIPO_DOC_RECIBO = 'Recibo';
const TIPO_DOC_NOTA_CREDITO = 'Nota de Crédito';
const TIPO_DOC_NOTA_DEBITO = 'Nota de Débito';

const INCLUDE_CLIENTE = { include: { direcciones: true } } as const;

type PrismaTx = Prisma.TransactionClient;

@Injectable()
export class DocumentosService {
  private readonly logger = new Logger(DocumentosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly estadosLookup: EstadosLookupService,
    private readonly documentoPdfService: DocumentoPdfService,
    private readonly emailService: EmailService,
  ) {}

  // Cuenta corriente "on demand": a diferencia del alta manual desde el
  // ABM (que rechaza duplicados), acá conviene que el primer documento
  // de un cliente cree la cuenta sola en vez de bloquear la operación
  // comercial por un paso administrativo que nadie hizo todavía.
  private async cuentaDeCliente(tx: PrismaTx, idCliente: number) {
    const cliente = await tx.clientes.findUnique({ where: { id_cliente: idCliente } });
    if (!cliente) {
      throw new NotFoundException(`Cliente ${idCliente} no encontrado`);
    }
    const existente = await tx.cuenta_corriente.findUnique({ where: { id_cliente: idCliente } });
    if (existente) {
      return existente;
    }
    return tx.cuenta_corriente.create({ data: { id_cliente: idCliente } });
  }

  private async tipoDocumentoId(descripcion: string): Promise<number> {
    const tipo = await this.prisma.tipo_documento.findFirst({ where: { descripcion } });
    if (!tipo) {
      throw new BadRequestException(`No existe el tipo de documento "${descripcion}" en el catálogo`);
    }
    return tipo.id_tipo_documento;
  }

  // Registra el movimiento y actualiza el saldo cacheado en la misma
  // transacción que crea el documento. impacto > 0 aumenta la deuda
  // (Débito: Factura, Nota de Débito), impacto < 0 la reduce (Crédito:
  // Recibo, Nota de Crédito).
  private async registrarMovimiento(
    tx: PrismaTx,
    idCliente: number,
    idTipoDocumento: number,
    impacto: number,
    refs: {
      id_factura?: number;
      id_recibo?: number;
      id_nota_credito?: number;
      id_nota_debito?: number;
    },
  ) {
    const cuenta = await this.cuentaDeCliente(tx, idCliente);
    const saldoResultante = Number(cuenta.saldo_actual) + impacto;
    await tx.movimiento_cuenta_corriente.create({
      data: {
        fecha: new Date(),
        monto: Math.abs(impacto),
        id_tipo_documento: idTipoDocumento,
        saldo_resultante: saldoResultante,
        id_cuenta_corriente: cuenta.id_cuenta_corriente,
        ...refs,
      },
    });
    await tx.cuenta_corriente.update({
      where: { id_cuenta_corriente: cuenta.id_cuenta_corriente },
      data: { saldo_actual: saldoResultante },
    });
  }

  // El envío es "mejor esfuerzo": si el cliente no tiene email cargado,
  // o el mail falla (SMTP caído, credenciales vencidas, etc.), el
  // documento ya se generó y se guardó igual — no tiene sentido que
  // una falla de correo tire abajo una operación contable que ya está
  // firme en la base (mismo criterio que EmailService.send con las OC
  // de Compras).
  private async enviarEmailDocumento(
    cliente: { nombre_cli: string; email_cli: string | null },
    titulo: string,
    numero: string,
    monto: number,
    cuerpoExtra: string,
    pdf: Buffer,
    nombreArchivo: string,
  ): Promise<void> {
    if (!cliente.email_cli) {
      this.logger.warn(`${titulo} N° ${numero}: el cliente "${cliente.nombre_cli}" no tiene email cargado, no se envía`);
      return;
    }
    await this.emailService.send({
      to: cliente.email_cli,
      subject: `${titulo} N° ${numero} — Celulosa Baradero SA`,
      html: `
        <p>Estimado/a ${cliente.nombre_cli},</p>
        <p>Le adjuntamos ${titulo.toLowerCase()} N° ${numero} por un monto de $ ${monto.toFixed(2)}.</p>
        ${cuerpoExtra}
        <p>Saludos cordiales,<br>Celulosa Baradero SA</p>
      `,
      attachments: [{ filename: nombreArchivo, content: pdf }],
    });
  }

  private async guardarPdf(pdf: Buffer, nombre: string) {
    const nombreArchivo = `${randomUUID()}.pdf`;
    await writeFile(join(UPLOADS_DIR, nombreArchivo), pdf);
    return this.prisma.archivo_adjunto.create({
      data: {
        nombre_archivo: nombre,
        ruta_archivo: nombreArchivo,
        tipo_archivo: 'application/pdf',
        fecha_carga: new Date(),
      },
    });
  }

  // Factura: atada a un pedido Pendiente puntual del cliente. El monto
  // se calcula de los ítems del pedido al momento de facturar (precio
  // vigente del producto), y el pedido pasa a "Facturado" en la misma
  // transacción — recién ahí se puede despachar (ver PedidosService).
  async generarFactura(idCliente: number, dto: CreateFacturaDto) {
    const [idEstadoFacturado, idTipoDocumento] = await Promise.all([
      this.estadosLookup.getId(ESTADO_FACTURADO),
      this.tipoDocumentoId(TIPO_DOC_FACTURA),
    ]);

    const idFactura = await this.prisma.$transaction(async (tx) => {
      const pedido = await tx.pedidos.findUnique({
        where: { id_pedido: dto.id_pedido },
        include: { estados: true, item_pedido: { include: { productos: true } } },
      });
      if (!pedido) {
        throw new NotFoundException(`Pedido ${dto.id_pedido} no encontrado`);
      }
      if (pedido.id_cliente !== idCliente) {
        throw new BadRequestException('El pedido no pertenece a este cliente');
      }
      if (pedido.estados.nombreEstado !== ESTADO_PENDIENTE) {
        throw new BadRequestException('Solo se puede facturar un pedido Pendiente');
      }
      if (pedido.item_pedido.length === 0) {
        throw new BadRequestException('El pedido no tiene productos cargados');
      }

      const monto = pedido.item_pedido.reduce(
        (acc, item) => acc + item.cantidad_bolsones * Number(item.productos.precio_venta),
        0,
      );

      const factura = await tx.factura.create({
        data: { fecha: new Date(), id_cliente: idCliente, id_pedido: dto.id_pedido, monto },
      });
      await tx.pedidos.update({ where: { id_pedido: dto.id_pedido }, data: { id_estado: idEstadoFacturado } });
      await this.registrarMovimiento(tx, idCliente, idTipoDocumento, monto, { id_factura: factura.id_factura });

      return factura.id_factura;
    });

    return this.generarPdfFactura(idFactura);
  }

  private async generarPdfFactura(idFactura: number) {
    const factura = await this.prisma.factura.findUniqueOrThrow({
      where: { id_factura: idFactura },
      include: {
        clientes: INCLUDE_CLIENTE,
        pedidos: { include: { item_pedido: { include: { productos: { include: { tipo_producto: true } } } } } },
      },
    });

    const pdf = await this.documentoPdfService.generar({
      tipo: 'factura',
      numero: String(factura.id_factura).padStart(8, '0'),
      fecha: factura.fecha,
      cliente: factura.clientes,
      monto: Number(factura.monto),
      idPedido: factura.id_pedido,
      items: factura.pedidos.item_pedido.map((item) => ({
        cantidad_bolsones: item.cantidad_bolsones,
        productos: { ...item.productos, precio_venta: Number(item.productos.precio_venta) },
      })),
    });

    const nombreArchivo = `factura-${factura.id_factura}.pdf`;
    const archivo = await this.guardarPdf(pdf, nombreArchivo);
    await this.prisma.factura.update({ where: { id_factura: idFactura }, data: { id_archivo: archivo.id_archivo_adjunto } });

    await this.enviarEmailDocumento(
      factura.clientes,
      'Factura',
      String(factura.id_factura).padStart(8, '0'),
      Number(factura.monto),
      `<p>Corresponde al pedido N° ${factura.id_pedido}.</p>`,
      pdf,
      nombreArchivo,
    );

    return { buffer: pdf, factura };
  }

  // Recibo de pago: reduce la deuda del cliente (Crédito).
  async generarRecibo(idCliente: number, dto: CreateReciboDto) {
    const idTipoDocumento = await this.tipoDocumentoId(TIPO_DOC_RECIBO);

    const idRecibo = await this.prisma.$transaction(async (tx) => {
      const recibo = await tx.recibo.create({
        data: {
          fecha: new Date(),
          id_cliente: idCliente,
          monto: dto.monto,
          medio_pago: dto.medio_pago,
          observaciones: dto.observaciones,
        },
      });
      await this.registrarMovimiento(tx, idCliente, idTipoDocumento, -dto.monto, { id_recibo: recibo.id_recibo });
      return recibo.id_recibo;
    });

    return this.generarPdfRecibo(idRecibo);
  }

  private async generarPdfRecibo(idRecibo: number) {
    const recibo = await this.prisma.recibo.findUniqueOrThrow({
      where: { id_recibo: idRecibo },
      include: { clientes: INCLUDE_CLIENTE },
    });

    const pdf = await this.documentoPdfService.generar({
      tipo: 'recibo',
      numero: String(recibo.id_recibo).padStart(8, '0'),
      fecha: recibo.fecha,
      cliente: recibo.clientes,
      monto: Number(recibo.monto),
      medioPago: recibo.medio_pago,
      observaciones: recibo.observaciones,
    });

    const nombreArchivo = `recibo-${recibo.id_recibo}.pdf`;
    const archivo = await this.guardarPdf(pdf, nombreArchivo);
    await this.prisma.recibo.update({ where: { id_recibo: idRecibo }, data: { id_archivo: archivo.id_archivo_adjunto } });

    await this.enviarEmailDocumento(
      recibo.clientes,
      'Recibo',
      String(recibo.id_recibo).padStart(8, '0'),
      Number(recibo.monto),
      `<p>Medio de pago: ${recibo.medio_pago}.</p>`,
      pdf,
      nombreArchivo,
    );

    return { buffer: pdf, recibo };
  }

  // Nota de crédito: reduce la deuda del cliente (Crédito).
  // La factura que corrige la nota tiene que ser de este mismo cliente,
  // y la nota no puede superar lo que esa factura facturó.
  private async assertFacturaCorregible(idCliente: number, idFactura: number, monto: number): Promise<void> {
    const factura = await this.prisma.factura.findUnique({ where: { id_factura: idFactura } });
    if (!factura) {
      throw new NotFoundException(`Factura ${idFactura} no encontrada`);
    }
    if (factura.id_cliente !== idCliente) {
      throw new BadRequestException('La factura no pertenece a este cliente');
    }
    if (monto > Number(factura.monto)) {
      throw new BadRequestException(
        `La nota no puede superar el monto de la factura (${Number(factura.monto).toFixed(2)})`,
      );
    }
  }

  async generarNotaCredito(idCliente: number, dto: CreateNotaDto) {
    await this.assertFacturaCorregible(idCliente, dto.id_factura, dto.monto);
    const idTipoDocumento = await this.tipoDocumentoId(TIPO_DOC_NOTA_CREDITO);

    const idNota = await this.prisma.$transaction(async (tx) => {
      const nota = await tx.nota_credito.create({
        data: {
          fecha: new Date(),
          id_cliente: idCliente,
          id_factura: dto.id_factura,
          monto: dto.monto,
          motivo: dto.motivo,
        },
      });
      await this.registrarMovimiento(tx, idCliente, idTipoDocumento, -dto.monto, { id_nota_credito: nota.id_nota_credito });
      return nota.id_nota_credito;
    });

    return this.generarPdfNota('nota_credito', idNota);
  }

  // Nota de débito: aumenta la deuda del cliente (Débito).
  async generarNotaDebito(idCliente: number, dto: CreateNotaDto) {
    await this.assertFacturaCorregible(idCliente, dto.id_factura, dto.monto);
    const idTipoDocumento = await this.tipoDocumentoId(TIPO_DOC_NOTA_DEBITO);

    const idNota = await this.prisma.$transaction(async (tx) => {
      const nota = await tx.nota_debito.create({
        data: {
          fecha: new Date(),
          id_cliente: idCliente,
          id_factura: dto.id_factura,
          monto: dto.monto,
          motivo: dto.motivo,
        },
      });
      await this.registrarMovimiento(tx, idCliente, idTipoDocumento, dto.monto, { id_nota_debito: nota.id_nota_debito });
      return nota.id_nota_debito;
    });

    return this.generarPdfNota('nota_debito', idNota);
  }

  private async generarPdfNota(tipo: 'nota_credito' | 'nota_debito', idNota: number) {
    const nota =
      tipo === 'nota_credito'
        ? await this.prisma.nota_credito.findUniqueOrThrow({ where: { id_nota_credito: idNota }, include: { clientes: INCLUDE_CLIENTE } })
        : await this.prisma.nota_debito.findUniqueOrThrow({ where: { id_nota_debito: idNota }, include: { clientes: INCLUDE_CLIENTE } });

    const id = tipo === 'nota_credito' ? (nota as { id_nota_credito: number }).id_nota_credito : (nota as { id_nota_debito: number }).id_nota_debito;

    const pdf = await this.documentoPdfService.generar({
      tipo,
      numero: String(id).padStart(8, '0'),
      fecha: nota.fecha,
      cliente: nota.clientes,
      monto: Number(nota.monto),
      motivo: nota.motivo,
    });

    const nombreArchivo = `${tipo}-${id}.pdf`;
    const archivo = await this.guardarPdf(pdf, nombreArchivo);
    if (tipo === 'nota_credito') {
      await this.prisma.nota_credito.update({ where: { id_nota_credito: id }, data: { id_archivo: archivo.id_archivo_adjunto } });
    } else {
      await this.prisma.nota_debito.update({ where: { id_nota_debito: id }, data: { id_archivo: archivo.id_archivo_adjunto } });
    }

    await this.enviarEmailDocumento(
      nota.clientes,
      tipo === 'nota_credito' ? 'Nota de Crédito' : 'Nota de Débito',
      String(id).padStart(8, '0'),
      Number(nota.monto),
      `<p>Motivo: ${nota.motivo}.</p>`,
      pdf,
      nombreArchivo,
    );

    return { buffer: pdf, id, nota };
  }

  // Pedidos Pendientes del cliente: opciones para el desplegable de
  // "elegir pedido" cuando el tipo de documento es Factura.
  async pedidosFacturables(idCliente: number) {
    return this.prisma.pedidos.findMany({
      where: { id_cliente: idCliente, estados: { nombreEstado: ESTADO_PENDIENTE } },
      orderBy: { fecha_carga: 'desc' },
    });
  }

  // Facturas emitidas al cliente: opciones del desplegable cuando se
  // emite una nota de crédito o débito (que siempre corrigen una) y
  // referencia para mostrar el tope de monto en pantalla.
  async facturasDelCliente(idCliente: number) {
    return this.prisma.factura.findMany({
      where: { id_cliente: idCliente },
      orderBy: { fecha: 'desc' },
    });
  }

  async obtenerPdfFactura(idCliente: number, id: number) {
    const factura = await this.prisma.factura.findUnique({ where: { id_factura: id }, include: { archivo_adjunto: true } });
    return this.leerPdfExistente(factura, idCliente, `factura-${id}.pdf`, () => this.generarPdfFactura(id));
  }

  async obtenerPdfRecibo(idCliente: number, id: number) {
    const recibo = await this.prisma.recibo.findUnique({ where: { id_recibo: id }, include: { archivo_adjunto: true } });
    return this.leerPdfExistente(recibo, idCliente, `recibo-${id}.pdf`, () => this.generarPdfRecibo(id));
  }

  async obtenerPdfNotaCredito(idCliente: number, id: number) {
    const nota = await this.prisma.nota_credito.findUnique({ where: { id_nota_credito: id }, include: { archivo_adjunto: true } });
    return this.leerPdfExistente(nota, idCliente, `nota_credito-${id}.pdf`, () => this.generarPdfNota('nota_credito', id));
  }

  async obtenerPdfNotaDebito(idCliente: number, id: number) {
    const nota = await this.prisma.nota_debito.findUnique({ where: { id_nota_debito: id }, include: { archivo_adjunto: true } });
    return this.leerPdfExistente(nota, idCliente, `nota_debito-${id}.pdf`, () => this.generarPdfNota('nota_debito', id));
  }

  // Reimprime desde el archivo ya guardado en disco (no vuelve a
  // impactar la cuenta corriente); si por algún motivo el documento
  // quedó sin archivo generado, lo regenera ahora.
  private async leerPdfExistente(
    documento: { id_cliente: number; archivo_adjunto: { ruta_archivo: string } | null } | null,
    idCliente: number,
    nombreEsperado: string,
    regenerar: () => Promise<{ buffer: Buffer }>,
  ): Promise<{ buffer: Buffer; nombreArchivo: string }> {
    if (!documento) {
      throw new NotFoundException('Documento no encontrado');
    }
    if (documento.id_cliente !== idCliente) {
      throw new BadRequestException('El documento no pertenece a este cliente');
    }
    if (!documento.archivo_adjunto) {
      const { buffer } = await regenerar();
      return { buffer, nombreArchivo: nombreEsperado };
    }
    const buffer = await readFile(join(UPLOADS_DIR, documento.archivo_adjunto.ruta_archivo));
    return { buffer, nombreArchivo: nombreEsperado };
  }
}
