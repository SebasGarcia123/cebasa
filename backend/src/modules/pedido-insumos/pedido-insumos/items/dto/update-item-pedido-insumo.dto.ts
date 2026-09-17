import { PartialType } from '@nestjs/mapped-types';
import { CreateItemPedidoInsumoDto } from './create-item-pedido-insumo.dto.js';

export class UpdateItemPedidoInsumoDto extends PartialType(CreateItemPedidoInsumoDto) {}
