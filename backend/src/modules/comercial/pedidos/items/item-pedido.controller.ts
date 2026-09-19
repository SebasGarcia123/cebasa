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

@ApiTags('Pedidos - Items')
@Controller('pedidos/:idPedido/items')
export class ItemPedidoController {
  constructor(private readonly itemPedidoService: ItemPedidoService) {}

  @Get()
  findAll(@Param('idPedido', ParseIntPipe) idPedido: number) {
    return this.itemPedidoService.findAllForPedido(idPedido);
  }

  @Post()
  create(
    @Param('idPedido', ParseIntPipe) idPedido: number,
    @Body() dto: CreateItemPedidoDto,
  ) {
    return this.itemPedidoService.create(idPedido, dto);
  }

  @Get(':idItem')
  findOne(
    @Param('idPedido', ParseIntPipe) idPedido: number,
    @Param('idItem', ParseIntPipe) idItem: number,
  ) {
    return this.itemPedidoService.findOne(idPedido, idItem);
  }

  @Patch(':idItem')
  update(
    @Param('idPedido', ParseIntPipe) idPedido: number,
    @Param('idItem', ParseIntPipe) idItem: number,
    @Body() dto: UpdateItemPedidoDto,
  ) {
    return this.itemPedidoService.update(idPedido, idItem, dto);
  }

  @Delete(':idItem')
  remove(
    @Param('idPedido', ParseIntPipe) idPedido: number,
    @Param('idItem', ParseIntPipe) idItem: number,
  ) {
    return this.itemPedidoService.remove(idPedido, idItem);
  }
}
