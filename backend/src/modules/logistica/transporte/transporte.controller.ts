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
import { TransporteService } from './transporte.service.js';
import { CreateTransporteDto } from './dto/create-transporte.dto.js';
import { UpdateTransporteDto } from './dto/update-transporte.dto.js';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator.js';

@ApiTags('Transporte')
@Controller('transporte')
export class TransporteController {
  constructor(private readonly transporteService: TransporteService) {}

  @RequirePermissions('logistica.editar')
  @Post()
  create(@Body() dto: CreateTransporteDto) {
    return this.transporteService.create(dto);
  }

  @RequirePermissions('logistica.ver')
  @Get()
  findAll() {
    return this.transporteService.findAll();
  }

  @RequirePermissions('logistica.ver')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.transporteService.findOne(id);
  }

  @RequirePermissions('logistica.editar')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTransporteDto,
  ) {
    return this.transporteService.update(id, dto);
  }

  @RequirePermissions('logistica.editar')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.transporteService.remove(id);
  }
}
