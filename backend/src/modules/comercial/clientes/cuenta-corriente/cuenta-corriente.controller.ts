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
import { CuentaCorrienteService } from './cuenta-corriente.service.js';
import { CreateCuentaCorrienteDto } from './dto/create-cuenta-corriente.dto.js';
import { UpdateCuentaCorrienteDto } from './dto/update-cuenta-corriente.dto.js';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Clientes - Cuenta Corriente')
@Controller('clientes/:idCliente/cuenta-corriente')
export class CuentaCorrienteController {
  constructor(
    private readonly cuentaCorrienteService: CuentaCorrienteService,
  ) {}

  @Post()
  create(
    @Param('idCliente', ParseIntPipe) idCliente: number,
    @Body() dto: CreateCuentaCorrienteDto,
  ) {
    return this.cuentaCorrienteService.create(idCliente, dto);
  }

  @Get()
  findOne(@Param('idCliente', ParseIntPipe) idCliente: number) {
    return this.cuentaCorrienteService.findByCliente(idCliente);
  }

  @Patch()
  update(
    @Param('idCliente', ParseIntPipe) idCliente: number,
    @Body() dto: UpdateCuentaCorrienteDto,
  ) {
    return this.cuentaCorrienteService.update(idCliente, dto);
  }

  @Delete()
  remove(@Param('idCliente', ParseIntPipe) idCliente: number) {
    return this.cuentaCorrienteService.remove(idCliente);
  }
}
