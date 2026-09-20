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
import { RequirePermissions } from '../../../../auth/decorators/permissions.decorator.js';

@ApiTags('Clientes - Cuenta Corriente')
@Controller('clientes/:idCliente/cuenta-corriente')
export class CuentaCorrienteController {
  constructor(
    private readonly cuentaCorrienteService: CuentaCorrienteService,
  ) {}

  @RequirePermissions('comercial.editar')
  @Post()
  create(
    @Param('idCliente', ParseIntPipe) idCliente: number,
    @Body() dto: CreateCuentaCorrienteDto,
  ) {
    return this.cuentaCorrienteService.create(idCliente, dto);
  }

  @RequirePermissions('comercial.ver')
  @Get()
  findOne(@Param('idCliente', ParseIntPipe) idCliente: number) {
    return this.cuentaCorrienteService.findByCliente(idCliente);
  }

  @RequirePermissions('comercial.editar')
  @Patch()
  update(
    @Param('idCliente', ParseIntPipe) idCliente: number,
    @Body() dto: UpdateCuentaCorrienteDto,
  ) {
    return this.cuentaCorrienteService.update(idCliente, dto);
  }

  @RequirePermissions('comercial.editar')
  @Delete()
  remove(@Param('idCliente', ParseIntPipe) idCliente: number) {
    return this.cuentaCorrienteService.remove(idCliente);
  }
}
