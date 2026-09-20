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
import { UnidadMedidaService } from './unidad-medida.service.js';
import { CreateUnidadMedidaDto } from './dto/create-unidad-medida.dto.js';
import { UpdateUnidadMedidaDto } from './dto/update-unidad-medida.dto.js';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator.js';

@ApiTags('Unidad Medida')
@Controller('unidad-medida')
export class UnidadMedidaController {
  constructor(private readonly unidadMedidaService: UnidadMedidaService) {}

  @RequirePermissions('produccion.editar')
  @Post()
  create(@Body() dto: CreateUnidadMedidaDto) {
    return this.unidadMedidaService.create(dto);
  }

  @RequirePermissions('produccion.ver')
  @Get()
  findAll() {
    return this.unidadMedidaService.findAll();
  }

  @RequirePermissions('produccion.ver')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.unidadMedidaService.findOne(id);
  }

  @RequirePermissions('produccion.editar')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUnidadMedidaDto,
  ) {
    return this.unidadMedidaService.update(id, dto);
  }

  @RequirePermissions('produccion.editar')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.unidadMedidaService.remove(id);
  }
}
