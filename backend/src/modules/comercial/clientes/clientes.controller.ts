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
import { ClientesService } from './clientes.service.js';
import { CreateClienteDto } from './dto/create-cliente.dto.js';
import { UpdateClienteDto } from './dto/update-cliente.dto.js';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator.js';

@ApiTags('Clientes')
@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @RequirePermissions('comercial.editar')
  @Post()
  create(@Body() dto: CreateClienteDto) {
    return this.clientesService.create(dto);
  }

  @RequirePermissions('comercial.ver')
  @Get()
  findAll() {
    return this.clientesService.findAll();
  }

  @RequirePermissions('comercial.ver')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.clientesService.findOne(id);
  }

  @RequirePermissions('comercial.editar')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateClienteDto) {
    return this.clientesService.update(id, dto);
  }

  @RequirePermissions('comercial.editar')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.clientesService.remove(id);
  }
}
