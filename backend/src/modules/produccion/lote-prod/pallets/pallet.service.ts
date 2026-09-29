import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { RotuloPdfService } from '../../../../pdf/rotulo-pdf.service.js';
import { formatearFechaAR } from '../../../../pdf/empresa-pdf.util.js';
import { CreatePalletDto } from './dto/create-pallet.dto.js';

const ESTADOS_EDITABLES = new Set(['Pendiente', 'Rechazado']);
const INCLUDE_PALLET = { productos: true, lineas: true, usuarios: true } as const;

@Injectable()
export class PalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rotuloPdfService: RotuloPdfService,
  ) {}

  private async assertLoteEditable(idLote: number) {
    const lote = await this.prisma.lote_prod.findUnique({ where: { id_lote: idLote }, include: { estados: true } });
    if (!lote) {
      throw new NotFoundException(`Lote de producción ${idLote} no encontrado`);
    }
    if (!ESTADOS_EDITABLES.has(lote.estados.nombreEstado)) {
      throw new BadRequestException('Los pallets solo se pueden generar mientras el lote está abierto o rechazado');
    }
    return lote;
  }

  findAllForLote(idLote: number) {
    return this.prisma.pallet.findMany({ where: { id_lote: idLote }, include: INCLUDE_PALLET, orderBy: { id_pallet: 'desc' } });
  }

  // "270926-3007": fecha del lote (DDMMAA) + código del producto. Es un
  // código de trazabilidad del lote de fabricación (día + producto), no
  // un serial único por pallet: se repite a propósito en todos los
  // pallets del mismo producto cargados en el mismo lote.
  private numeroLote(fechaLote: Date, codigoProducto: string): string {
    const dia = String(fechaLote.getUTCDate()).padStart(2, '0');
    const mes = String(fechaLote.getUTCMonth() + 1).padStart(2, '0');
    const anio = String(fechaLote.getUTCFullYear() % 100).padStart(2, '0');
    return `${dia}${mes}${anio}-${codigoProducto}`;
  }

  async create(idLote: number, dto: CreatePalletDto, idUsuario: number) {
    const lote = await this.assertLoteEditable(idLote);
    const producto = await this.prisma.productos.findUnique({ where: { id_producto: dto.id_producto } });
    if (!producto) {
      throw new NotFoundException(`Producto ${dto.id_producto} no encontrado`);
    }

    return this.prisma.pallet.create({
      data: {
        ...dto,
        id_lote: idLote,
        id_usuario: idUsuario,
        numero_lote: this.numeroLote(lote.fecha_lote_prod, producto.codigo_producto),
      },
      include: INCLUDE_PALLET,
    });
  }

  async findOne(idLote: number, idPallet: number) {
    const pallet = await this.prisma.pallet.findFirst({
      where: { id_pallet: idPallet, id_lote: idLote },
      include: INCLUDE_PALLET,
    });
    if (!pallet) {
      throw new NotFoundException(`Pallet ${idPallet} no encontrado en el lote ${idLote}`);
    }
    return pallet;
  }

  async remove(idLote: number, idPallet: number) {
    await this.assertLoteEditable(idLote);
    await this.findOne(idLote, idPallet);
    return this.prisma.pallet.delete({ where: { id_pallet: idPallet } });
  }

  async generarRotulo(idLote: number, idPallet: number): Promise<Buffer> {
    const pallet = await this.findOne(idLote, idPallet);
    const lote = await this.prisma.lote_prod.findUniqueOrThrow({ where: { id_lote: idLote }, include: { turnos: true } });
    const fecha = formatearFechaAR(pallet.fecha_elaboracion);

    return this.rotuloPdfService.generar({
      numero: pallet.numero_lote,
      campos: [
        { label: 'Producto', valor: `${pallet.productos.codigo_producto} — ${pallet.productos.descripcion_producto}` },
        { label: 'Línea', valor: pallet.lineas.descripcion_lineas },
        { label: 'Turno', valor: lote.turnos.descripcion_turnos },
        { label: 'Bolsones por pallet', valor: String(pallet.cantidad_bolsones) },
        { label: 'Operario', valor: pallet.usuarios.nombre_usuario },
        { label: 'Fecha', valor: fecha },
      ],
    });
  }
}
