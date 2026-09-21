export interface StockInsumo {
  id_insumo: number;
  codigo_insumo: string;
  nombre_insumo: string;
  stock_actual: number;
  stock_minimo: number;
}

export interface StockProducto {
  id_producto: number;
  codigo_producto: string;
  descripcion_producto: string;
  stock_actual: number;
  stock_minimo: number;
}
