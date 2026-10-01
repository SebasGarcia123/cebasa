import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { EstadosLookupService } from '../../../prisma/estados-lookup.service.js';
import { LadoCamion, TipoPallet } from '../../../generated/prisma/client.js';
import { IniciarCargaDto } from './dto/iniciar-carga.dto.js';
import { PalletAArmar, ordenarLado, palletsDeItem, repartirEnMitades } from './orden-carga.util.js';

const ESTADO_FACTURADO = 'Facturado';
const ESTADO_CARGADO = 'Cargado';

const INCLUDE_PALLET = {
  item_pedido: { include: { productos: true } },
} as const;

// Pantalla del operario de Logística (clarkista), pensada para tablet:
// elige un día, ve los pedidos a cargar, y el sistema le sugiere en qué
// orden subir los pallets al camión (ver orden-carga.util.ts: mitades
// por lado y anchos intercalados con angostos). Cuando están todos
// cargados el pedido pasa a "Cargado" y queda listo para que el jefe lo
// despache.
@Injectable()
export class CargaPedidosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly estadosLookup: EstadosLookupService,
  ) {}

  // La fecha de salida la fija el Planificador de Entregas; si todavía
  // no pasó por ahí, vale la que se le prometió al cliente al cargar el
  // pedido (son la misma fecha, en dos momentos distintos).
  async findPedidosDelDia(fecha: string) {
    const dia = new Date(fecha);
    const pedidos = await this.prisma.pedidos.findMany({
      where: { estados: { nombreEstado: ESTADO_FACTURADO } },
      include: {
        clientes: true,
        estados: true,
        item_pedido: { include: { productos: true } },
        carga_pallet: true,
      },
      orderBy: { id_pedido: 'asc' },
    });

    return pedidos
      .filter((pedido) => {
        const efectiva = pedido.fecha_salida_planificada ?? pedido.fecha_prometido;
        return efectiva !== null && efectiva.getTime() === dia.getTime();
      })
      .map((pedido) => {
        const totalPallets = pedido.item_pedido.reduce(
          (acc, item) => acc + palletsDeItem(item.cantidad_bolsones, item.productos.bolsones_por_pallet),
          0,
        );
        return {
          id_pedido: pedido.id_pedido,
          fecha_efectiva: pedido.fecha_salida_planificada ?? pedido.fecha_prometido,
          clientes: pedido.clientes,
          estados: pedido.estados,
          total_pallets: totalPallets,
          pallets_cargados: pedido.carga_pallet.filter((p) => p.cargado).length,
          carga_iniciada: pedido.carga_pallet.length > 0,
        };
      });
  }

  listarPallets(idPedido: number) {
    return this.prisma.carga_pallet.findMany({
      where: { id_pedido: idPedido },
      include: INCLUDE_PALLET,
      orderBy: [{ lado: 'asc' }, { orden: 'asc' }, { id_carga_pallet: 'asc' }],
    });
  }

  // Materializa los pallets del pedido. Si ya se había arrancado la
  // carga devuelve lo que hay (para poder retomarla desde la tablet sin
  // perder lo ya cargado).
  async iniciar(idPedido: number, dto: IniciarCargaDto) {
    const pedido = await this.prisma.pedidos.findUnique({
      where: { id_pedido: idPedido },
      include: {
        estados: true,
        item_pedido: { include: { productos: true } },
        carga_pallet: true,
      },
    });
    if (!pedido) {
      throw new NotFoundException(`Pedido ${idPedido} no encontrado`);
    }
    if (pedido.carga_pallet.length > 0) {
      return this.listarPallets(idPedido);
    }
    if (pedido.estados.nombreEstado !== ESTADO_FACTURADO) {
      throw new BadRequestException('Solo se puede cargar un pedido Facturado');
    }
    if (pedido.item_pedido.length === 0) {
      throw new BadRequestException('El pedido no tiene productos para cargar');
    }

    const aArmar: PalletAArmar[] = [];
    for (const item of pedido.item_pedido) {
      const cantidad = palletsDeItem(item.cantidad_bolsones, item.productos.bolsones_por_pallet);
      for (let nro = 1; nro <= cantidad; nro++) {
        aArmar.push({
          id_item_pedido: item.id_item_pedido,
          nro_pallet: nro,
          // Un producto sin tipo de pallet se trata como angosto: es el
          // caso neutro para intercalar y no frena la carga.
          tipo: item.productos.tipo_pallet ?? TipoPallet.ANGOSTO,
        });
      }
    }

    // Sin sugerencia: los pallets quedan sin lado ni orden y el operario
    // los marca como quiera.
    if (!dto.sugerir_orden) {
      await this.prisma.carga_pallet.createMany({
        data: aArmar.map((p) => ({
          id_pedido: idPedido,
          id_item_pedido: p.id_item_pedido,
          nro_pallet: p.nro_pallet,
        })),
      });
      return this.listarPallets(idPedido);
    }

    const porLado = repartirEnMitades(aArmar);
    const filas: { id_pedido: number; id_item_pedido: number; nro_pallet: number; lado: LadoCamion; orden: number }[] = [];
    for (const [lado, delLado] of porLado) {
      ordenarLado(delLado).forEach((pallet, i) => {
        filas.push({
          id_pedido: idPedido,
          id_item_pedido: pallet.id_item_pedido,
          nro_pallet: pallet.nro_pallet,
          lado,
          orden: i + 1,
        });
      });
    }
    await this.prisma.carga_pallet.createMany({ data: filas });
    return this.listarPallets(idPedido);
  }

  // Marca un pallet como subido al camión. Cuando no queda ninguno
  // pendiente, el pedido pasa a "Cargado" y sale de esta pantalla.
  async cargarPallet(idCargaPallet: number, idUsuario: number) {
    const pallet = await this.prisma.carga_pallet.findUnique({ where: { id_carga_pallet: idCargaPallet } });
    if (!pallet) {
      throw new NotFoundException(`Pallet ${idCargaPallet} no encontrado`);
    }
    if (pallet.cargado) {
      throw new BadRequestException('Ese pallet ya figura cargado');
    }

    await this.prisma.carga_pallet.update({
      where: { id_carga_pallet: idCargaPallet },
      data: { cargado: true, fecha_carga: new Date(), id_usuario: idUsuario },
    });

    const pendientes = await this.prisma.carga_pallet.count({
      where: { id_pedido: pallet.id_pedido, cargado: false },
    });
    if (pendientes === 0) {
      const idEstadoCargado = await this.estadosLookup.getId(ESTADO_CARGADO);
      await this.prisma.pedidos.update({
        where: { id_pedido: pallet.id_pedido },
        data: { id_estado: idEstadoCargado },
      });
    }

    return { pallets: await this.listarPallets(pallet.id_pedido), pedido_completo: pendientes === 0 };
  }
}
