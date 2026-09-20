import { Estado } from './estado.model';

export interface Turno {
  id_turno: number;
  descripcion_turnos: string;
  id_estado: number;
  estados?: Estado;
}
