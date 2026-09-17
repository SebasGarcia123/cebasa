import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ControlesAutoelevadorService } from './controles.service.js';
import { CreateControlAutoelevadorDto } from './dto/create-control.dto.js';
import { UpdateControlAutoelevadorDto } from './dto/update-control.dto.js';

@Controller('controles-autoelevador')
export class ControlesAutoelevadorController {
  constructor(private readonly controlesService: ControlesAutoelevadorService) {}

  @Post()
  create(@Body() dto: CreateControlAutoelevadorDto) {
    return this.controlesService.create(dto);
  }

  @Get()
  findAll() {
    return this.controlesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.controlesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateControlAutoelevadorDto) {
    return this.controlesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.controlesService.remove(id);
  }
}
