import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { EstadosLookupService } from '../../../prisma/estados-lookup.service.js';
import { PlantaLookupService, type Planta } from '../../../prisma/planta-lookup.service.js';
import { RolDeposito } from '../../../generated/prisma/client.js';
import type { JwtPayload } from '../../../auth/types/jwt-payload.interface.js';
import { CreateLoteProdDto } from './dto/create-lote-prod.dto.js';
import { UpdateLoteProdDto } from './dto/update-lote-prod.dto.js';
import { RechazarLoteProdDto } from './dto/rechazar-lote-prod.dto.js';

// Abierto: recién creado, Producción todavía le puede seguir cargando
// ítems/bobinas (ver cerrar()). Pendiente de aprobación: ya cerrado,
// en revisión de Logística — a partir de ahí no se puede tocar más.
const ESTADO_ABIERTO = 'Pendiente';
const ESTADO_PENDIENTE = 'Pendiente de aprobación';
const ESTADO_APROBADO = 'Aprobado';
const ESTADO_RECHAZADO = 'Rechazado';
const ESTADO_ACTIVO = 'Activo';
const ESTADO_RECETA_ACTIVA = 'Activo';
const TIPO_MOVIMIENTO_INGRESO_PRODUCCION = 'Ingreso por producción';
const TIPO_MOVIMIENTO_CONSUMO_PRODUCCION = 'Consumo produccion';

// Rol de depósito contra el que se crea el lote, según la planta del
// sector del usuario logueado — no lo elige a mano (ver
// resolverDepositoDeCreacion). Baradero apunta a Logística porque así
// se viene usando desde que se armó ese circuito (el consumo de
// insumos de la receta descuenta de acá); Caseros apunta a Producción
// porque así lo pidió el usuario explícitamente.
const ROL_DEPOSITO_CREACION_POR_PLANTA: Record<Planta, RolDeposito> = {
  BARADERO: RolDeposito.LOGISTICA,
  CASEROS: RolDeposito.PRODUCCION,
};

@Injectable()
export class LoteProdService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly estadosLookup: EstadosLookupService,
    private readonly plantaLookup: PlantaLookupService,
  ) {}

  async create(dto: CreateLoteProdDto, user: JwtPayload) {
    const [idEstadoAbierto, idDeposito] = await Promise.all([
      this.estadosLookup.getId(ESTADO_ABIERTO),
      this.resolverDepositoDeCreacion(user, dto.id_deposito),
    ]);
    return this.prisma.lote_prod.create({
      data: {
        id_turno: dto.id_turno,
        fecha_lote_prod: new Date(dto.fecha_lote_prod),
        id_deposito: idDeposito,
        id_estado: idEstadoAbierto,
      },
    });
  }

  // Si el sector del usuario resuelve a una planta, el depósito sale
  // de ahí directo y se ignora cualquier id_deposito que haya mandado
  // el cliente (evita que un Jefe de Producción de una planta termine
  // creando un lote de la otra). Solo se recurre al id_deposito
  // recibido cuando no hay planta que resolver (ej. un administrador).
  private async resolverDepositoDeCreacion(user: JwtPayload, idDepositoElegido?: number): Promise<number> {
    if (!user.es_administrador) {
      const usuario = await this.prisma.usuarios.findUnique({
        where: { id_usuario: user.sub },
        include: { sectores: true },
      });
      const planta = usuario ? this.plantaLookup.plantaDeSector(usuario.sectores) : null;
      if (planta) {
        const rolDeposito = ROL_DEPOSITO_CREACION_POR_PLANTA[planta];
        const deposito = await this.prisma.deposito.findFirst({ where: { planta, rol_deposito: rolDeposito } });
        if (!deposito) {
          throw new BadRequestException(`No se encontró un depósito de planta ${planta} y rol ${rolDeposito} para crear el lote`);
        }
        return deposito.id_deposito;
      }
    }
    if (idDepositoElegido) {
      return idDepositoElegido;
    }
    throw new BadRequestException('No se pudo determinar el depósito del lote automáticamente; elegí uno a mano');
  }

  findAll() {
    return this.prisma.lote_prod.findMany({
      include: { turnos: true, estados: true, deposito: true },
    });
  }

  async findOne(id: number) {
    const lote = await this.prisma.lote_prod.findUnique({
      where: { id_lote: id },
      include: {
        turnos: true,
        estados: true,
        deposito: true,
        item_prod: { include: { productos: true, lineas: true } },
        bobina: { include: { tipo_bobina: true, productos: true, usuarios: true } },
        pallet: { include: { productos: true, lineas: true, usuarios: true } },
      },
    });
    if (!lote) {
      throw new NotFoundException(`Lote de producción ${id} no encontrado`);
    }
    return lote;
  }

  // El estado ya no se edita a mano (ver UpdateLoteProdDto): lo maneja
  // este método según en qué estado esté el lote al momento de guardar.
  // Editable mientras está Abierto o Rechazado; una vez cerrado
  // (Pendiente de aprobación) o Aprobado, no se toca más.
  async update(id: number, dto: UpdateLoteProdDto) {
    const lote = await this.findOne(id);

    if (lote.estados.nombreEstado !== ESTADO_ABIERTO && lote.estados.nombreEstado !== ESTADO_RECHAZADO) {
      throw new BadRequestException('Un lote de producción solo se puede editar mientras está abierto o rechazado');
    }

    // Si Producción reedita un lote que Logística rechazó, vuelve a
    // quedar abierto (hay que volver a cerrarlo a mano) y se limpia el
    // motivo del rechazo anterior.
    const data: { id_estado?: number; motivo_rechazo?: null } = {};
    if (lote.estados.nombreEstado === ESTADO_RECHAZADO) {
      data.id_estado = await this.estadosLookup.getId(ESTADO_ABIERTO);
      data.motivo_rechazo = null;
    }

    return this.prisma.lote_prod.update({
      where: { id_lote: id },
      data: {
        ...dto,
        ...data,
        fecha_lote_prod: dto.fecha_lote_prod ? new Date(dto.fecha_lote_prod) : undefined,
      },
    });
  }

  // Producción cierra el turno: el lote deja de ser editable y pasa a
  // manos de Logística para revisión. También se puede cerrar
  // directamente desde Rechazado (para pantallas como Baradero, que no
  // tienen un "editar header" que reabra el lote a mano — corregir las
  // bobinas y volver a cerrar alcanza).
  async cerrar(id: number) {
    const lote = await this.findOne(id);
    if (lote.estados.nombreEstado !== ESTADO_ABIERTO && lote.estados.nombreEstado !== ESTADO_RECHAZADO) {
      throw new BadRequestException('Solo se puede cerrar un lote de producción abierto o rechazado');
    }
    if (lote.item_prod.length === 0 && lote.bobina.length === 0 && lote.pallet.length === 0) {
      throw new BadRequestException('El lote no tiene ítems, bobinas ni pallets cargados');
    }

    const idEstadoPendiente = await this.estadosLookup.getId(ESTADO_PENDIENTE);
    return this.prisma.lote_prod.update({
      where: { id_lote: id },
      data: { id_estado: idEstadoPendiente, motivo_rechazo: null },
    });
  }

  // Logística aprueba: el lote pasa a "Aprobado", cada ítem suma su
  // cantidad al stock del producto (con su movimiento de ingreso), y
  // además se descuentan del depósito del lote los insumos que marque
  // la receta activa de cada producto, cantidad_utilizada × cantidad
  // producida (con su propio movimiento de consumo).
  async aprobar(id: number, user: JwtPayload) {
    const lote = await this.findOne(id);

    if (lote.estados.nombreEstado !== ESTADO_PENDIENTE) {
      throw new BadRequestException('Solo se puede aprobar un lote pendiente de aprobación');
    }
    await this.assertMismaPlanta(user, lote.deposito);

    // Las bobinas y los pallets no son cantidad agregada como item_prod:
    // cada fila es una unidad física con su propia cantidad (peso o
    // bolsones), así que se suman por producto antes de tratarlas igual
    // que el resto del stock que entra por este lote — y eso incluye el
    // consumo de insumos de la receta, no solo el ingreso (antes solo se
    // calculaba a partir de item_prod, así que un lote cargado solo con
    // bobinas o pallets no descontaba ningún insumo).
    const pesoPorProducto = new Map<number, number>();
    for (const bobina of lote.bobina) {
      const idProducto = bobina.id_producto;
      pesoPorProducto.set(idProducto, (pesoPorProducto.get(idProducto) ?? 0) + Number(bobina.peso));
    }
    const ingresoBobinas = [...pesoPorProducto.entries()].map(([id_producto, peso]) => ({
      id_producto,
      cantidad: Math.round(peso),
    }));

    const bolsonesPorProducto = new Map<number, number>();
    for (const pallet of lote.pallet) {
      const idProducto = pallet.id_producto;
      bolsonesPorProducto.set(idProducto, (bolsonesPorProducto.get(idProducto) ?? 0) + pallet.cantidad_bolsones);
    }
    const ingresoPallets = [...bolsonesPorProducto.entries()].map(([id_producto, cantidad]) => ({
      id_producto,
      cantidad,
    }));

    const ingresosProducto = [
      ...lote.item_prod.map((item) => ({ id_producto: item.id_producto, cantidad: item.cantidad })),
      ...ingresoBobinas,
      ...ingresoPallets,
    ];

    const [idEstadoAprobado, idEstadoActivo, tipoMovimientoIngreso, tipoMovimientoConsumo, consumoInsumos, idDepositoIngreso] =
      await Promise.all([
        this.estadosLookup.getId(ESTADO_APROBADO),
        this.estadosLookup.getId(ESTADO_ACTIVO),
        this.prisma.tipo_movimiento.findFirst({
          where: { nombre_movimiento: TIPO_MOVIMIENTO_INGRESO_PRODUCCION },
        }),
        this.prisma.tipo_movimiento.findFirst({
          where: { nombre_movimiento: TIPO_MOVIMIENTO_CONSUMO_PRODUCCION },
        }),
        this.calcularConsumoInsumos(ingresosProducto),
        this.resolverDepositoLogistica(lote.deposito),
      ]);
    if (!tipoMovimientoIngreso) {
      throw new BadRequestException(
        `No existe el tipo de movimiento "${TIPO_MOVIMIENTO_INGRESO_PRODUCCION}" en el catálogo`,
      );
    }
    if (consumoInsumos.length > 0 && !tipoMovimientoConsumo) {
      throw new BadRequestException(
        `No existe el tipo de movimiento "${TIPO_MOVIMIENTO_CONSUMO_PRODUCCION}" en el catálogo`,
      );
    }

    const fechaMovimiento = new Date();
    await this.prisma.$transaction([
      ...ingresosProducto.map((item) =>
        this.prisma.productos.update({
          where: { id_producto: item.id_producto },
          data: { stock_actual: { increment: item.cantidad } },
        }),
      ),
      ...ingresosProducto.map((item) =>
        this.prisma.stock_producto_deposito.upsert({
          where: { id_producto_id_deposito: { id_producto: item.id_producto, id_deposito: idDepositoIngreso } },
          create: { id_producto: item.id_producto, id_deposito: idDepositoIngreso, cantidad: item.cantidad },
          update: { cantidad: { increment: item.cantidad } },
        }),
      ),
      ...ingresosProducto.map((item) =>
        this.prisma.movimiento_producto.create({
          data: {
            id_producto: item.id_producto,
            id_tipo_movimiento: tipoMovimientoIngreso.id_tipo_movimiento,
            cantidad: item.cantidad,
            fecha_movimiento: fechaMovimiento,
            id_deposito_destino: idDepositoIngreso,
            id_estado: idEstadoActivo,
            motivo: `Ingreso por aprobación del lote de producción #${id}`,
          },
        }),
      ),
      ...consumoInsumos.map((consumo) =>
        this.prisma.insumo.update({
          where: { id_insumo: consumo.id_insumo },
          data: { stock_actual: { decrement: consumo.cantidadEntera } },
        }),
      ),
      ...consumoInsumos.map((consumo) =>
        this.prisma.stock_insumo_deposito.upsert({
          where: {
            id_insumo_id_deposito: { id_insumo: consumo.id_insumo, id_deposito: lote.id_deposito },
          },
          create: {
            id_insumo: consumo.id_insumo,
            id_deposito: lote.id_deposito,
            cantidad: -consumo.cantidadEntera,
          },
          update: { cantidad: { decrement: consumo.cantidadEntera } },
        }),
      ),
      ...consumoInsumos.map((consumo) =>
        this.prisma.movimiento_insumo.create({
          data: {
            id_insumo: consumo.id_insumo,
            id_tipo_movimiento: tipoMovimientoConsumo!.id_tipo_movimiento,
            cantidad: consumo.cantidad,
            fecha_movimiento: fechaMovimiento,
            id_deposito_origen: lote.id_deposito,
            id_estado: idEstadoActivo,
            motivo: `Consumo por aprobación del lote de producción #${id}`,
          },
        }),
      ),
      this.prisma.lote_prod.update({
        where: { id_lote: id },
        data: { id_estado: idEstadoAprobado },
      }),
    ]);

    return this.findOne(id);
  }

  // El producto terminado se acredita en el depósito de Logística de
  // la misma planta que el lote, no en el depósito del propio lote:
  // así lo puede ver Despacho de Pedidos, que solo mira depósitos de
  // Logística (ver PedidosService.resolverDepositoDeUsuario, mismo
  // criterio). El consumo de insumos, en cambio, sigue descontando del
  // depósito del lote (planta de producción), porque es ahí donde
  // físicamente se usan. Para Baradero esto no cambia nada (el lote ya
  // se crea con "Logística Baradero" como depósito propio); para
  // Caseros es lo que hace que el ingreso llegue a "Logística Caseros"
  // aunque el lote se haya cargado contra "Producción Caseros".
  private async resolverDepositoLogistica(depositoLote: { nombre_deposito: string; planta: Planta | null }): Promise<number> {
    const planta = this.plantaLookup.plantaDeDeposito(depositoLote);
    const deposito = await this.prisma.deposito.findFirst({ where: { planta, rol_deposito: RolDeposito.LOGISTICA } });
    if (!deposito) {
      throw new BadRequestException(`No se encontró un depósito de Logística para la planta del depósito "${depositoLote.nombre_deposito}"`);
    }
    return deposito.id_deposito;
  }

  // Suma, insumo por insumo, cuánto consume todo el lote según la
  // receta activa de cada producto (cantidad_utilizada × cantidad
  // producida en cada ítem). Los productos sin receta activa no
  // descuentan nada. Los insumos no "stockeable" (servicios,
  // intangibles) tampoco, igual que en el resto del sistema.
  private async calcularConsumoInsumos(
    items: { id_producto: number; cantidad: number }[],
  ): Promise<{ id_insumo: number; cantidad: number; cantidadEntera: number }[]> {
    const idsProducto = [...new Set(items.map((item) => item.id_producto))];
    const recetas = await this.prisma.receta.findMany({
      where: { id_producto: { in: idsProducto }, estados: { nombreEstado: ESTADO_RECETA_ACTIVA } },
      include: { receta_item: true },
    });
    const recetaPorProducto = new Map(recetas.map((receta) => [receta.id_producto, receta.receta_item]));

    const consumoPorInsumo = new Map<number, number>();
    for (const item of items) {
      const recetaItems = recetaPorProducto.get(item.id_producto) ?? [];
      for (const recetaItem of recetaItems) {
        const consumo = Number(recetaItem.cantidad_utilizada) * item.cantidad;
        consumoPorInsumo.set(recetaItem.id_insumo, (consumoPorInsumo.get(recetaItem.id_insumo) ?? 0) + consumo);
      }
    }
    if (consumoPorInsumo.size === 0) {
      return [];
    }

    const insumos = await this.prisma.insumo.findMany({
      where: { id_insumo: { in: [...consumoPorInsumo.keys()] } },
    });
    const stockeablePorInsumo = new Map(insumos.map((insumo) => [insumo.id_insumo, insumo.stockeable]));

    return [...consumoPorInsumo.entries()]
      .filter(([idInsumo]) => stockeablePorInsumo.get(idInsumo))
      .map(([idInsumo, cantidad]) => ({
        id_insumo: idInsumo,
        cantidad: Math.round(cantidad * 10000) / 10000,
        cantidadEntera: Math.round(cantidad),
      }));
  }

  // Logística rechaza: el lote vuelve a la pantalla de Producción en
  // estado "Rechazado" con el motivo, para que se corrija y se
  // reenvíe (ver update() de más arriba).
  async rechazar(id: number, dto: RechazarLoteProdDto, user: JwtPayload) {
    const lote = await this.findOne(id);

    if (lote.estados.nombreEstado !== ESTADO_PENDIENTE) {
      throw new BadRequestException('Solo se puede rechazar un lote pendiente de aprobación');
    }
    await this.assertMismaPlanta(user, lote.deposito);

    const idEstadoRechazado = await this.estadosLookup.getId(ESTADO_RECHAZADO);
    return this.prisma.lote_prod.update({
      where: { id_lote: id },
      data: { id_estado: idEstadoRechazado, motivo_rechazo: dto.motivo_rechazo },
    });
  }

  // Un Jefe de Logística solo puede aprobar/rechazar lotes de su propia
  // planta (según su sector), no los de la otra. Los administradores
  // no tienen planta asignada, así que quedan exceptuados.
  private async assertMismaPlanta(user: JwtPayload, depositoLote: { planta: Planta | null }): Promise<void> {
    if (user.es_administrador) {
      return;
    }
    const usuario = await this.prisma.usuarios.findUnique({
      where: { id_usuario: user.sub },
      include: { sectores: true },
    });
    const plantaUsuario = usuario ? this.plantaLookup.plantaDeSector(usuario.sectores) : null;
    const plantaLote = this.plantaLookup.plantaDeDeposito(depositoLote);
    if (!plantaUsuario || !plantaLote || plantaUsuario !== plantaLote) {
      throw new BadRequestException('No podés aprobar ni rechazar lotes de producción de otra planta');
    }
  }

  async remove(id: number) {
    const lote = await this.findOne(id);
    if (lote.estados.nombreEstado === ESTADO_APROBADO) {
      throw new BadRequestException('No se puede eliminar un lote de producción ya aprobado');
    }
    return this.prisma.lote_prod.delete({ where: { id_lote: id } });
  }
}
