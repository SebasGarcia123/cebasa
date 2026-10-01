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
import { NaturalezaService } from './naturaleza.service.js';
import { CreateNaturalezaDto } from './dto/create-naturaleza.dto.js';
import { UpdateNaturalezaDto } from './dto/update-naturaleza.dto.js';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator.js';

@ApiTags('Naturaleza')
@Controller('naturaleza')
export class NaturalezaController {
  constructor(private readonly naturalezaService: NaturalezaService) {}

  @RequirePermissions('produccion.naturaleza.editar')
  @Post()
  create(@Body() dto: CreateNaturalezaDto) {
    return this.naturalezaService.create(dto);
  }

  @Get()
  findAll() {
    return this.naturalezaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.naturalezaService.findOne(id);
  }

  @RequirePermissions('produccion.naturaleza.editar')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateNaturalezaDto,
  ) {
    return this.naturalezaService.update(id, dto);
  }

  @RequirePermissions('produccion.naturaleza.editar')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.naturalezaService.remove(id);
  }
}
