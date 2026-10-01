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
import { AutoelevadoresService } from './autoelevadores.service.js';
import { CreateAutoelevadorDto } from './dto/create-autoelevador.dto.js';
import { UpdateAutoelevadorDto } from './dto/update-autoelevador.dto.js';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator.js';

@ApiTags('Autoelevadores')
@Controller('autoelevadores')
export class AutoelevadoresController {
  constructor(private readonly autoelevadoresService: AutoelevadoresService) {}

  @RequirePermissions('logistica.autoelevadores.editar')
  @Post()
  create(@Body() dto: CreateAutoelevadorDto) {
    return this.autoelevadoresService.create(dto);
  }

  @Get()
  findAll() {
    return this.autoelevadoresService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.autoelevadoresService.findOne(id);
  }

  @RequirePermissions('logistica.autoelevadores.editar')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAutoelevadorDto,
  ) {
    return this.autoelevadoresService.update(id, dto);
  }

  @RequirePermissions('logistica.autoelevadores.editar')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.autoelevadoresService.remove(id);
  }
}
