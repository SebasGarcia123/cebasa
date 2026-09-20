import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ItemPedidoService } from './item-pedido.service.js';
import { CreateItemPedidoDto } from './dto/create-item-pedido.dto.js';
import { UpdateItemPedidoDto } from './dto/update-item-pedido.dto.js';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../../auth/decorators/permissions.decorator.js';

@ApiTags('Pedidos - Items')
@Controller('pedidos/:idPedido/items')
export class ItemPedidoController {
  constructor(private readonly itemPedidoService: ItemPedidoService) {}

  @RequirePermissions('comercial.ver')
  @Get()
  findAll(@Param('idPedido', ParseIntPipe) idPedido: number) {
    return this.itemPedidoService.findAllForPedido(idPedido);
  }

  @RequirePermissions('comercial.editar')
  @Post()
  create(
    @Param('idPedido', ParseIntPipe) idPedido: number,
    @Body() dto: CreateItemPedidoDto,
  ) {
    return this.itemPedidoService.create(idPedido, dto);
  }

  @RequirePermissions('comercial.ver')
  @Get(':idItem')
  findOne(
    @Param('idPedido', ParseIntPipe) idPedido: number,
    @Param('idItem', ParseIntPipe) idItem: number,
  ) {
    return this.itemPedidoService.findOne(idPedido, idItem);
  }

  @RequirePermissions('comercial.editar')
  @Patch(':idItem')
  update(
    @Param('idPedido', ParseIntPipe) idPedido: number,
    @Param('idItem', ParseIntPipe) idItem: number,
    @Body() dto: UpdateItemPedidoDto,
  ) {
    return this.itemPedidoService.update(idPedido, idItem, dto);
  }

  @RequirePermissions('comercial.editar')
  @Delete(':idItem')
  remove(
    @Param('idPedido', ParseIntPipe) idPedido: number,
    @Param('idItem', ParseIntPipe) idItem: number,
  ) {
    return this.itemPedidoService.remove(idPedido, idItem);
  }
}
