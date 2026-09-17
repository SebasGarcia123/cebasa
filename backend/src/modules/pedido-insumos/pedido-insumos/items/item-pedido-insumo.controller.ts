import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ItemPedidoInsumoService } from './item-pedido-insumo.service.js';
import { CreateItemPedidoInsumoDto } from './dto/create-item-pedido-insumo.dto.js';
import { UpdateItemPedidoInsumoDto } from './dto/update-item-pedido-insumo.dto.js';

@Controller('pedidos-insumos/:idPedido/items')
export class ItemPedidoInsumoController {
  constructor(private readonly itemService: ItemPedidoInsumoService) {}

  @Get()
  findAll(@Param('idPedido', ParseIntPipe) idPedido: number) {
    return this.itemService.findAllForPedido(idPedido);
  }

  @Post()
  create(
    @Param('idPedido', ParseIntPipe) idPedido: number,
    @Body() dto: CreateItemPedidoInsumoDto,
  ) {
    return this.itemService.create(idPedido, dto);
  }

  @Get(':idItem')
  findOne(
    @Param('idPedido', ParseIntPipe) idPedido: number,
    @Param('idItem', ParseIntPipe) idItem: number,
  ) {
    return this.itemService.findOne(idPedido, idItem);
  }

  @Patch(':idItem')
  update(
    @Param('idPedido', ParseIntPipe) idPedido: number,
    @Param('idItem', ParseIntPipe) idItem: number,
    @Body() dto: UpdateItemPedidoInsumoDto,
  ) {
    return this.itemService.update(idPedido, idItem, dto);
  }

  @Delete(':idItem')
  remove(
    @Param('idPedido', ParseIntPipe) idPedido: number,
    @Param('idItem', ParseIntPipe) idItem: number,
  ) {
    return this.itemService.remove(idPedido, idItem);
  }
}
