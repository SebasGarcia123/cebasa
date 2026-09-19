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

@ApiTags('Unidad Medida')
@Controller('unidad-medida')
export class UnidadMedidaController {
  constructor(private readonly unidadMedidaService: UnidadMedidaService) {}

  @Post()
  create(@Body() dto: CreateUnidadMedidaDto) {
    return this.unidadMedidaService.create(dto);
  }

  @Get()
  findAll() {
    return this.unidadMedidaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.unidadMedidaService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUnidadMedidaDto,
  ) {
    return this.unidadMedidaService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.unidadMedidaService.remove(id);
  }
}
