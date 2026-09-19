import { PartialType } from '@nestjs/mapped-types';
import { CreatePedidoInsumosDto } from './create-pedido-insumos.dto.js';

export class UpdatePedidoInsumosDto extends PartialType(
  CreatePedidoInsumosDto,
) {}
