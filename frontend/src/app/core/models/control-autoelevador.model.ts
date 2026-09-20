import { Usuario } from './usuario.model';
import { Autoelevador } from './autoelevador.model';
import { ItemControlAutoelevador } from './item-control-autoelevador.model';

export interface ControlAutoelevador {
  id_control_autoelevador: number;
  fecha: string;
  id_usuario: number;
  id_autoelevador: number;
  usuarios?: Usuario;
  autoelevadores?: Autoelevador;
  item_control_autoelevador?: ItemControlAutoelevador[];
}
