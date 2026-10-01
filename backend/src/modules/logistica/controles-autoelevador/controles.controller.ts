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
import { ControlesAutoelevadorService } from './controles.service.js';
import { CreateControlAutoelevadorDto } from './dto/create-control.dto.js';
import { UpdateControlAutoelevadorDto } from './dto/update-control.dto.js';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator.js';

@ApiTags('Controles Autoelevador')
@Controller('controles-autoelevador')
export class ControlesAutoelevadorController {
  constructor(
    private readonly controlesService: ControlesAutoelevadorService,
  ) {}

  @RequirePermissions('logistica.control_autoelevador.editar')
  @Post()
  create(@Body() dto: CreateControlAutoelevadorDto) {
    return this.controlesService.create(dto);
  }

  @RequirePermissions('logistica.control_autoelevador.editar')
  @Get()
  findAll() {
    return this.controlesService.findAll();
  }

  @RequirePermissions('logistica.control_autoelevador.editar')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.controlesService.findOne(id);
  }

  @RequirePermissions('logistica.control_autoelevador.editar')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateControlAutoelevadorDto,
  ) {
    return this.controlesService.update(id, dto);
  }

  @RequirePermissions('logistica.control_autoelevador.editar')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.controlesService.remove(id);
  }
}
