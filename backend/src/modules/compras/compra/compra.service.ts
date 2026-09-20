import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { EstadosLookupService } from '../../../prisma/estados-lookup.service.js';
import { EmailService } from '../../../email/email.service.js';
import { CreateCompraDto } from './dto/create-compra.dto.js';
import { UpdateCompraDto } from './dto/update-compra.dto.js';

const ESTADO_AUTORIZADO = 'Autorizado';
const ESTADO_ENVIADO_PROVEEDOR = 'Enviado a Proveedor';
const ESTADO_RECIBIDO = 'Recibido';
const ESTADO_ANULADO = 'Anulado';

const INCLUDE_COMPLETO = {
  proveedor: true,
  estados: true,
  archivo_adjunto: true,
  compra_detalle: { include: { insumo: true } },
} as const;

@Injectable()
export class CompraService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly estadosLookup: EstadosLookupService,
    private readonly emailService: EmailService,
  ) {}

  create(dto: CreateCompraDto) {
    return this.prisma.compra.create({
      data: { ...dto, fecha_compra: new Date(dto.fecha_compra) },
    });
  }

  findAll() {
    return this.prisma.compra.findMany({
      include: { proveedor: true, estados: true, archivo_adjunto: true },
    });
  }

  async findOne(id: number) {
    const compra = await this.prisma.compra.findUnique({
      where: { id_compra: id },
      include: INCLUDE_COMPLETO,
    });
    if (!compra) {
      throw new NotFoundException(`Compra ${id} no encontrada`);
    }
    return compra;
  }

  async update(id: number, dto: UpdateCompraDto) {
    await this.findOne(id);
    return this.prisma.compra.update({
      where: { id_compra: id },
      data: {
        ...dto,
        fecha_compra: dto.fecha_compra ? new Date(dto.fecha_compra) : undefined,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.compra.delete({ where: { id_compra: id } });
  }

  // Una OC recién generada puede quedar "Autorizado" (a la espera de que
  // alguien la mande) en vez de enviarse de una: esta acción es ese envío
  // diferido, disponible desde la propia OC.
  async enviarProveedor(id: number) {
    const compra = await this.findOne(id);
    if (compra.estados.nombreEstado !== ESTADO_AUTORIZADO) {
      throw new BadRequestException('Solo se puede enviar al proveedor una OC que esté Autorizada');
    }

    const idEstado = await this.estadosLookup.getId(ESTADO_ENVIADO_PROVEEDOR);
    const actualizada = await this.prisma.compra.update({
      where: { id_compra: id },
      data: { id_estado: idEstado },
      include: INCLUDE_COMPLETO,
    });

    if (compra.proveedor.email) {
      await this.emailService.send({
        to: compra.proveedor.email,
        subject: `Nueva orden de compra #${id}`,
        html: `<p>Les enviamos la orden de compra <strong>#${id}</strong>.</p>`,
      });
    }

    return actualizada;
  }

  // El jefe de logística confirma que la mercadería ingresó: cierra la OC.
  async recibir(id: number) {
    const compra = await this.findOne(id);
    if (compra.estados.nombreEstado !== ESTADO_ENVIADO_PROVEEDOR) {
      throw new BadRequestException('Solo se puede recibir una OC que esté Enviada a Proveedor');
    }

    const idEstado = await this.estadosLookup.getId(ESTADO_RECIBIDO);
    return this.prisma.compra.update({
      where: { id_compra: id },
      data: { id_estado: idEstado },
      include: INCLUDE_COMPLETO,
    });
  }

  async anular(id: number) {
    const compra = await this.findOne(id);
    if (![ESTADO_AUTORIZADO, ESTADO_ENVIADO_PROVEEDOR].includes(compra.estados.nombreEstado)) {
      throw new BadRequestException('Solo se puede anular una OC Autorizada o Enviada a Proveedor');
    }

    const idEstado = await this.estadosLookup.getId(ESTADO_ANULADO);
    return this.prisma.compra.update({
      where: { id_compra: id },
      data: { id_estado: idEstado },
      include: INCLUDE_COMPLETO,
    });
  }
}
