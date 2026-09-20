import { Estado } from './estado.model';
import { UnidadMedida } from './unidad-medida.model';

export interface Insumo {
  id_insumo: number;
  codigo_insumo: string;
  nombre_insumo: string;
  id_unidad_medida: number;
  stock_minimo: number;
  stock_actual: number;
  id_estado: number;
  unidad_medida?: UnidadMedida;
  estados?: Estado;
}
