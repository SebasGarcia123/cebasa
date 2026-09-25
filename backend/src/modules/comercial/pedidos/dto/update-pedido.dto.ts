import { PartialType } from '@nestjs/mapped-types';
import { CreatePedidoDto } from './create-pedido.dto.js';

// El estado ya no se edita a mano: el alta arranca siempre "Pendiente"
// y de ahí en más solo avanza vía facturar()/despachar(), o se corta
// vía anular() (ver PedidosService). Editar el pedido en sí (este DTO)
// solo es posible mientras está "Pendiente".
export class UpdatePedidoDto extends PartialType(CreatePedidoDto) {}
