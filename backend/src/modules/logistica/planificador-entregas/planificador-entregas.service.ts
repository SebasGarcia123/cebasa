import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { EstadosLookupService } from '../../../prisma/estados-lookup.service.js';
import { Planta, RolDeposito } from '../../../generated/prisma/client.js';
import { AsignarFechaSalidaDto } from './dto/asignar-fecha-salida.dto.js';
import { ReordenarPedidosDto } from './dto/reordenar-pedidos.dto.js';

const ESTADO_DESPACHADO = 'Despachado';
const ESTADO_ANULADO = 'Anulado';
const ESTADO_PRODUCTO_ANULADO = 'Anulado';

type ColorCelda = 'verde' | 'amarillo' | 'rojo';
// Para quedarse con el peor color de un pedido (si tiene una celda
// roja, el pedido es rojo aunque el resto esté en verde).
const PRIORIDAD_COLOR: Record<ColorCelda, number> = { verde: 0, amarillo: 1, rojo: 2 };

@Injectable()
export class PlanificadorEntregasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly estadosLookup: EstadosLookupService,
  ) {}

  // Esta pantalla solo es operativa para la planta Caseros: el stock
  // que se muestra y descuenta (visualmente) es siempre el de
  // "Logística Caseros", sin importar quién la esté mirando.
  private async resolverDepositoLogisticaCaseros(): Promise<number> {
    const deposito = await this.prisma.deposito.findFirst({
      where: { planta: Planta.CASEROS, rol_deposito: RolDeposito.LOGISTICA },
    });
    if (!deposito) {
      throw new BadRequestException('No se encontró el depósito de Logística Caseros');
    }
    return deposito.id_deposito;
  }

  async obtenerTablero() {
    const [idDeposito, idEstadoDespachado, idEstadoAnulado] = await Promise.all([
      this.resolverDepositoLogisticaCaseros(),
      this.estadosLookup.getId(ESTADO_DESPACHADO),
      this.estadosLookup.getId(ESTADO_ANULADO),
    ]);

    const [productos, stockPorDeposito, pedidos] = await Promise.all([
      this.prisma.productos.findMany({
        where: { estados: { nombreEstado: { not: ESTADO_PRODUCTO_ANULADO } } },
        orderBy: { descripcion_producto: 'asc' },
      }),
      this.prisma.stock_producto_deposito.findMany({ where: { id_deposito: idDeposito } }),
      this.prisma.pedidos.findMany({
        where: { id_estado: { notIn: [idEstadoDespachado, idEstadoAnulado] } },
        include: { clientes: true, item_pedido: true },
      }),
    ]);

    const stockPorProducto = new Map(stockPorDeposito.map((s) => [s.id_producto, s.cantidad]));

    // Orden de las columnas: fecha_prometido primero (sin fecha, al
    // final), y dentro de la misma fecha_prometido, orden_planificador
    // (el desempate manual de arrastrar) — nunca al revés, así el
    // arrastre jamás cruza el límite de una fecha a otra.
    const pedidosOrdenados = [...pedidos].sort((a, b) => {
      const fa = a.fecha_prometido?.getTime() ?? Infinity;
      const fb = b.fecha_prometido?.getTime() ?? Infinity;
      if (fa !== fb) return fa - fb;
      const oa = a.orden_planificador ?? Infinity;
      const ob = b.orden_planificador ?? Infinity;
      if (oa !== ob) return oa - ob;
      const ca = a.fecha_carga.getTime();
      const cb = b.fecha_carga.getTime();
      if (ca !== cb) return ca - cb;
      return a.id_pedido - b.id_pedido;
    });

    // Cascada de stock: por cada producto, se recorren los pedidos en
    // el orden de arriba, restando (solo en memoria, nunca en la base)
    // lo que cada uno pide. No alcanza -> amarillo (parcial) o rojo
    // (nada); si alcanza, verde. El color del pedido es el peor color
    // entre sus celdas.
    const colorCelda = new Map<string, ColorCelda>();
    const colorPedido = new Map<number, ColorCelda>();
    for (const producto of productos) {
      let restante = stockPorProducto.get(producto.id_producto) ?? 0;
      for (const pedido of pedidosOrdenados) {
        const item = pedido.item_pedido.find((i) => i.id_producto === producto.id_producto);
        if (!item) continue;

        let color: ColorCelda;
        if (restante >= item.cantidad_bolsones) {
          color = 'verde';
          restante -= item.cantidad_bolsones;
        } else if (restante > 0) {
          color = 'amarillo';
          restante = 0;
        } else {
          color = 'rojo';
        }
        colorCelda.set(`${pedido.id_pedido}-${producto.id_producto}`, color);

        const actual = colorPedido.get(pedido.id_pedido);
        if (!actual || PRIORIDAD_COLOR[color] > PRIORIDAD_COLOR[actual]) {
          colorPedido.set(pedido.id_pedido, color);
        }
      }
    }

    return {
      productos: productos.map((p) => ({
        id_producto: p.id_producto,
        codigo_producto: p.codigo_producto,
        descripcion_producto: p.descripcion_producto,
        stock: stockPorProducto.get(p.id_producto) ?? 0,
      })),
      pedidos: pedidosOrdenados.map((pedido) => ({
        id_pedido: pedido.id_pedido,
        nombre_cli: pedido.clientes.nombre_cli,
        fecha_prometido: pedido.fecha_prometido,
        fecha_salida_planificada: pedido.fecha_salida_planificada,
        orden_planificador: pedido.orden_planificador,
        color: colorPedido.get(pedido.id_pedido) ?? 'verde',
        items: pedido.item_pedido.map((item) => ({
          id_producto: item.id_producto,
          cantidad_bolsones: item.cantidad_bolsones,
          color: colorCelda.get(`${pedido.id_pedido}-${item.id_producto}`)!,
        })),
      })),
    };
  }

  async asignarFechaSalida(idPedido: number, dto: AsignarFechaSalidaDto) {
    const pedido = await this.prisma.pedidos.findUnique({ where: { id_pedido: idPedido } });
    if (!pedido) {
      throw new NotFoundException(`Pedido ${idPedido} no encontrado`);
    }
    return this.prisma.pedidos.update({
      where: { id_pedido: idPedido },
      data: { fecha_salida_planificada: dto.fecha_salida ? new Date(dto.fecha_salida) : null },
    });
  }

  async reordenar(dto: ReordenarPedidosDto) {
    await this.prisma.$transaction(
      dto.ordenes.map((o) =>
        this.prisma.pedidos.update({
          where: { id_pedido: o.id_pedido },
          data: { orden_planificador: o.orden_planificador },
        }),
      ),
    );
  }
}
