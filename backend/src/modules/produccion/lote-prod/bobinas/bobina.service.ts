import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '../../../../generated/prisma/client.js';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { RotuloPdfService } from '../../../../pdf/rotulo-pdf.service.js';
import { formatearFechaAR } from '../../../../pdf/empresa-pdf.util.js';
import { CreateBobinaDto } from './dto/create-bobina.dto.js';

const ESTADOS_EDITABLES = new Set(['Pendiente', 'Rechazado']);
const INCLUDE_BOBINA = { tipo_bobina: true, productos: true, usuarios: true } as const;
const NUMERO_MAXIMO = 9999;
const ID_SECUENCIA = 1;

@Injectable()
export class BobinaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rotuloPdfService: RotuloPdfService,
  ) {}

  private async assertLoteEditable(idLote: number): Promise<void> {
    const lote = await this.prisma.lote_prod.findUnique({ where: { id_lote: idLote }, include: { estados: true } });
    if (!lote) {
      throw new NotFoundException(`Lote de producción ${idLote} no encontrado`);
    }
    if (!ESTADOS_EDITABLES.has(lote.estados.nombreEstado)) {
      throw new BadRequestException('Las bobinas solo se pueden generar mientras el lote está abierto o rechazado');
    }
  }

  findAllForLote(idLote: number) {
    return this.prisma.bobina.findMany({ where: { id_lote: idLote }, include: INCLUDE_BOBINA, orderBy: { id_bobina: 'desc' } });
  }

  // Prefijo de 2 letras tratado como contador base-26 (AA, AB, ... AZ,
  // BA, ...). Con 676 prefijos × 10000 números, alcanza y sobra.
  private siguientePrefijo(prefijo: string): string {
    const [a, b] = prefijo;
    if (b !== 'Z') {
      return a + String.fromCharCode(b.charCodeAt(0) + 1);
    }
    if (a !== 'Z') {
      return String.fromCharCode(a.charCodeAt(0) + 1) + 'A';
    }
    throw new BadRequestException('Se agotó la numeración de bobinas disponible (contactar a sistemas)');
  }

  // El UPDATE sobre la fila única de bobina_secuencia toma row lock en
  // InnoDB: dos altas concurrentes (dos operarios en dos tablets al
  // mismo tiempo) se serializan solas, sin pisarse el número.
  private async siguienteNumero(tx: Prisma.TransactionClient): Promise<string> {
    await tx.$executeRaw`UPDATE bobina_secuencia SET numero = numero + 1 WHERE id = ${ID_SECUENCIA}`;
    let secuencia = await tx.bobina_secuencia.findUniqueOrThrow({ where: { id: ID_SECUENCIA } });

    if (secuencia.numero > NUMERO_MAXIMO) {
      secuencia = await tx.bobina_secuencia.update({
        where: { id: ID_SECUENCIA },
        data: { prefijo: this.siguientePrefijo(secuencia.prefijo), numero: 1 },
      });
    }

    return `${secuencia.prefijo}${String(secuencia.numero).padStart(4, '0')}`;
  }

  async create(idLote: number, dto: CreateBobinaDto, idUsuario: number) {
    await this.assertLoteEditable(idLote);
    return this.prisma.$transaction(async (tx) => {
      const numeroBobina = await this.siguienteNumero(tx);
      return tx.bobina.create({
        data: { ...dto, id_lote: idLote, id_usuario: idUsuario, numero_bobina: numeroBobina },
        include: INCLUDE_BOBINA,
      });
    });
  }

  async findOne(idLote: number, idBobina: number) {
    const bobina = await this.prisma.bobina.findFirst({
      where: { id_bobina: idBobina, id_lote: idLote },
      include: INCLUDE_BOBINA,
    });
    if (!bobina) {
      throw new NotFoundException(`Bobina ${idBobina} no encontrada en el lote ${idLote}`);
    }
    return bobina;
  }

  async remove(idLote: number, idBobina: number) {
    await this.assertLoteEditable(idLote);
    await this.findOne(idLote, idBobina);
    return this.prisma.bobina.delete({ where: { id_bobina: idBobina } });
  }

  async generarRotulo(idLote: number, idBobina: number): Promise<Buffer> {
    const bobina = await this.findOne(idLote, idBobina);
    const fecha = formatearFechaAR(bobina.fecha_elaboracion);

    return this.rotuloPdfService.generar({
      numero: bobina.numero_bobina,
      campos: [
        { label: 'Tipo', valor: bobina.tipo_bobina.descripcion },
        { label: 'Producto', valor: `${bobina.productos.codigo_producto} — ${bobina.productos.descripcion_producto}` },
        { label: 'Peso', valor: `${Number(bobina.peso).toFixed(2)} kg` },
        { label: 'Gramaje', valor: `${Number(bobina.gramaje).toFixed(2)} g/m²` },
        { label: 'Operario', valor: bobina.usuarios.nombre_usuario },
        { label: 'Fecha', valor: fecha },
      ],
    });
  }
}
