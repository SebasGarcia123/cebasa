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
import { ProveedorService } from './proveedor.service.js';
import { CreateProveedorDto } from './dto/create-proveedor.dto.js';
import { UpdateProveedorDto } from './dto/update-proveedor.dto.js';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator.js';

@ApiTags('Proveedor')
@Controller('proveedores')
export class ProveedorController {
  constructor(private readonly proveedorService: ProveedorService) {}

  @RequirePermissions('compras.editar')
  @Post()
  create(@Body() dto: CreateProveedorDto) {
    return this.proveedorService.create(dto);
  }

  @RequirePermissions('compras.ver')
  @Get()
  findAll() {
    return this.proveedorService.findAll();
  }

  @RequirePermissions('compras.ver')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.proveedorService.findOne(id);
  }

  @RequirePermissions('compras.editar')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProveedorDto,
  ) {
    return this.proveedorService.update(id, dto);
  }

  @RequirePermissions('compras.editar')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.proveedorService.remove(id);
  }
}
