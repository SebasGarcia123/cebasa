import { Estado } from './estado.model';

export interface Autoelevador {
  id_autoelevadores: number;
  nombre: string;
  fecha_alta: string;
  id_estado: number;
  estados?: Estado;
}
