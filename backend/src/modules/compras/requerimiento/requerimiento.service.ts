import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { EstadosLookupService } from '../../../prisma/estados-lookup.service.js';
import { EmailService } from '../../../email/email.service.js';
import { CreateRequerimientoDto } from './dto/create-requerimiento.dto.js';
import { UpdateRequerimientoDto } from './dto/update-requerimiento.dto.js';
import { GenerarOcDto } from './dto/generar-oc.dto.js';

const ESTADO_ACTIVO = 'Activo';
const ESTADO_PROCESADO = 'Procesado';
const ESTADO_AUTORIZADO = 'Autorizado';
const ESTADO_ENVIADO_PROVEEDOR = 'Enviado a Proveedor';

@Injectable()
export class RequerimientoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly estadosLookup: EstadosLookupService,
    private readonly emailService: EmailService,
  ) {}

  async create(dto: CreateRequerimientoDto) {
    const idEstadoActivo = await this.estadosLookup.getId(ESTADO_ACTIVO);
    return this.prisma.requerimiento.create({
      data: {
        ...dto,
        fecha_carga: new Date(),
        fecha_necesidad: new Date(dto.fecha_necesidad),
        id_estado: idEstadoActivo,
      },
    });
  }

  findAll() {
    return this.prisma.requerimiento.findMany({
      include: { usuarios: true, estados: true },
    });
  }

  async findOne(id: number) {
    const requerimiento = await this.prisma.requerimiento.findUnique({
      where: { id_requerimiento: id },
      include: {
        usuarios: true,
        estados: true,
        requerimiento_detalle: { include: { insumo: true } },
      },
    });
    if (!requerimiento) {
      throw new NotFoundException(`Requerimiento ${id} no encontrado`);
    }
    return requerimiento;
  }

  async update(id: number, dto: UpdateRequerimientoDto) {
    await this.findOne(id);
    return this.prisma.requerimiento.update({
      where: { id_requerimiento: id },
      data: {
        ...dto,
        fecha_necesidad: dto.fecha_necesidad
          ? new Date(dto.fecha_necesidad)
          : undefined,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.requerimiento.delete({
      where: { id_requerimiento: id },
    });
  }

  // Compras abre un requerimiento activo, carga el precio cotizado por el
  // proveedor para cada línea y adjunta el comprobante: esto genera una
  // nueva orden de compra (tabla `compra`) y marca el requerimiento como
  // Procesado. Si se elige mandarla ya al proveedor, queda "Enviado a
  // Proveedor"; si no, "Autorizado" a la espera de que alguien la envíe
  // después (ver CompraService.enviarProveedor).
  async generarOc(id: number, dto: GenerarOcDto) {
    const requerimiento = await this.findOne(id);
    if (requerimiento.estados.nombreEstado !== ESTADO_ACTIVO) {
      throw new BadRequestException('Este requerimiento ya fue procesado');
    }

    const detallesPorId = new Map(
      requerimiento.requerimiento_detalle.map((d) => [d.id_requerimiento_detalle, d]),
    );
    for (const item of dto.items) {
      if (!detallesPorId.has(item.id_requerimiento_detalle)) {
        throw new BadRequestException(
          `La línea ${item.id_requerimiento_detalle} no pertenece a este requerimiento`,
        );
      }
    }
    if (dto.items.length !== detallesPorId.size) {
      throw new BadRequestException('Hay que cargar el precio de todos los insumos del requerimiento');
    }

    const idEstadoCompra = await this.estadosLookup.getId(
      dto.enviar_a_proveedor ? ESTADO_ENVIADO_PROVEEDOR : ESTADO_AUTORIZADO,
    );

    const compra = await this.prisma.compra.create({
      data: {
        fecha_compra: new Date(),
        id_proveedor: dto.id_proveedor,
        id_estado: idEstadoCompra,
        id_archivo_adjunto: dto.id_archivo_adjunto,
        compra_detalle: {
          create: dto.items.map((item) => {
            const detalle = detallesPorId.get(item.id_requerimiento_detalle)!;
            return {
              id_requerimiento_detalle: item.id_requerimiento_detalle,
              id_insumo: detalle.id_insumo,
              cantidad: detalle.cantidad,
              precio_compra: item.precio_compra,
            };
          }),
        },
      },
      include: {
        compra_detalle: { include: { insumo: true } },
        proveedor: true,
        estados: true,
        archivo_adjunto: true,
      },
    });

    const idEstadoProcesado = await this.estadosLookup.getId(ESTADO_PROCESADO);
    await this.prisma.requerimiento.update({
      where: { id_requerimiento: id },
      data: { id_estado: idEstadoProcesado },
    });

    if (requerimiento.usuarios.email) {
      await this.emailService.send({
        to: requerimiento.usuarios.email,
        subject: `Tu requerimiento #${id} fue procesado`,
        html: `<p>Se generó la orden de compra <strong>#${compra.id_compra}</strong> a partir del requerimiento que cargaste.</p>`,
      });
    }

    if (dto.enviar_a_proveedor && compra.proveedor.email) {
      await this.emailService.send({
        to: compra.proveedor.email,
        subject: `Nueva orden de compra #${compra.id_compra}`,
        html: `<p>Les enviamos la orden de compra <strong>#${compra.id_compra}</strong>.</p>`,
      });
    }

    return compra;
  }
}
