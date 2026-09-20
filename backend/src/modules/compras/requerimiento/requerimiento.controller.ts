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
import { RequerimientoService } from './requerimiento.service.js';
import { CreateRequerimientoDto } from './dto/create-requerimiento.dto.js';
import { UpdateRequerimientoDto } from './dto/update-requerimiento.dto.js';
import { GenerarOcDto } from './dto/generar-oc.dto.js';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Requerimiento')
@Controller('requerimientos')
export class RequerimientoController {
  constructor(private readonly requerimientoService: RequerimientoService) {}

  @Post()
  create(@Body() dto: CreateRequerimientoDto) {
    return this.requerimientoService.create(dto);
  }

  @Get()
  findAll() {
    return this.requerimientoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.requerimientoService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRequerimientoDto,
  ) {
    return this.requerimientoService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.requerimientoService.remove(id);
  }

  @Post(':id/generar-oc')
  generarOc(@Param('id', ParseIntPipe) id: number, @Body() dto: GenerarOcDto) {
    return this.requerimientoService.generarOc(id, dto);
  }
}
