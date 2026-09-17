import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { TransporteService } from './transporte.service.js';
import { CreateTransporteDto } from './dto/create-transporte.dto.js';
import { UpdateTransporteDto } from './dto/update-transporte.dto.js';

@Controller('transporte')
export class TransporteController {
  constructor(private readonly transporteService: TransporteService) {}

  @Post()
  create(@Body() dto: CreateTransporteDto) {
    return this.transporteService.create(dto);
  }

  @Get()
  findAll() {
    return this.transporteService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.transporteService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTransporteDto) {
    return this.transporteService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.transporteService.remove(id);
  }
}
