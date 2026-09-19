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
import { MovimientosCuentaCorrienteService } from './movimientos.service.js';
import { CreateMovimientoCuentaCorrienteDto } from './dto/create-movimiento.dto.js';
import { UpdateMovimientoCuentaCorrienteDto } from './dto/update-movimiento.dto.js';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Clientes - Cuenta Corriente - Movimientos')
@Controller('clientes/:idCliente/cuenta-corriente/movimientos')
export class MovimientosCuentaCorrienteController {
  constructor(
    private readonly movimientosService: MovimientosCuentaCorrienteService,
  ) {}

  @Get()
  findAll(@Param('idCliente', ParseIntPipe) idCliente: number) {
    return this.movimientosService.findAll(idCliente);
  }

  @Post()
  create(
    @Param('idCliente', ParseIntPipe) idCliente: number,
    @Body() dto: CreateMovimientoCuentaCorrienteDto,
  ) {
    return this.movimientosService.create(idCliente, dto);
  }

  @Get(':idMovimiento')
  findOne(
    @Param('idCliente', ParseIntPipe) idCliente: number,
    @Param('idMovimiento', ParseIntPipe) idMovimiento: number,
  ) {
    return this.movimientosService.findOne(idCliente, idMovimiento);
  }

  @Patch(':idMovimiento')
  update(
    @Param('idCliente', ParseIntPipe) idCliente: number,
    @Param('idMovimiento', ParseIntPipe) idMovimiento: number,
    @Body() dto: UpdateMovimientoCuentaCorrienteDto,
  ) {
    return this.movimientosService.update(idCliente, idMovimiento, dto);
  }

  @Delete(':idMovimiento')
  remove(
    @Param('idCliente', ParseIntPipe) idCliente: number,
    @Param('idMovimiento', ParseIntPipe) idMovimiento: number,
  ) {
    return this.movimientosService.remove(idCliente, idMovimiento);
  }
}
