export interface Factura {
  id_factura: number;
  fecha: string;
  id_cliente: number;
  id_pedido: number;
  monto: number;
  id_archivo: number | null;
}
