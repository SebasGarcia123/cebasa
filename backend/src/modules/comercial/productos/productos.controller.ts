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
import { ProductosService } from './productos.service.js';
import { CreateProductoDto } from './dto/create-producto.dto.js';
import { UpdateProductoDto } from './dto/update-producto.dto.js';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator.js';

@ApiTags('Productos')
@Controller('productos')
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  @RequirePermissions('comercial.editar')
  @Post()
  create(@Body() dto: CreateProductoDto) {
    return this.productosService.create(dto);
  }

  @RequirePermissions('comercial.ver')
  @Get()
  findAll() {
    return this.productosService.findAll();
  }

  @RequirePermissions('comercial.ver')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productosService.findOne(id);
  }

  @RequirePermissions('comercial.editar')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductoDto,
  ) {
    return this.productosService.update(id, dto);
  }

  @RequirePermissions('comercial.editar')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productosService.remove(id);
  }
}
