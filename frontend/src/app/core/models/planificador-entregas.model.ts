export type ColorPlanificador = 'verde' | 'amarillo' | 'rojo';

export interface ProductoPlanificador {
  id_producto: number;
  codigo_producto: string;
  descripcion_producto: string;
  stock: number;
}

export interface ItemPlanificador {
  id_producto: number;
  cantidad_bolsones: number;
  color: ColorPlanificador;
}

export interface PedidoPlanificador {
  id_pedido: number;
  nombre_cli: string;
  fecha_prometido: string | null;
  fecha_salida_planificada: string | null;
  orden_planificador: number | null;
  color: ColorPlanificador;
  items: ItemPlanificador[];
}

export interface TableroPlanificador {
  productos: ProductoPlanificador[];
  pedidos: PedidoPlanificador[];
}
