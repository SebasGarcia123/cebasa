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
import { TipoProductoService } from './tipo-producto.service.js';
import { CreateTipoProductoDto } from './dto/create-tipo-producto.dto.js';
import { UpdateTipoProductoDto } from './dto/update-tipo-producto.dto.js';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator.js';

@ApiTags('Tipo Producto')
@Controller('tipo-producto')
export class TipoProductoController {
  constructor(private readonly tipoProductoService: TipoProductoService) {}

  @RequirePermissions('comercial.editar')
  @Post()
  create(@Body() dto: CreateTipoProductoDto) {
    return this.tipoProductoService.create(dto);
  }

  @RequirePermissions('comercial.ver')
  @Get()
  findAll() {
    return this.tipoProductoService.findAll();
  }

  @RequirePermissions('comercial.ver')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tipoProductoService.findOne(id);
  }

  @RequirePermissions('comercial.editar')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTipoProductoDto,
  ) {
    return this.tipoProductoService.update(id, dto);
  }

  @RequirePermissions('comercial.editar')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tipoProductoService.remove(id);
  }
}
