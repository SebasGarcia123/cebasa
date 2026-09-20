import { TipoImpacto } from './tipo-impacto.model';

export interface TipoDocumento {
  id_tipo_documento: number;
  descripcion: string;
  id_tipo_impacto: number;
  tipo_impacto?: TipoImpacto;
}
