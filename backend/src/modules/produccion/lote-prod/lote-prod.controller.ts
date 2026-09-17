import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { LoteProdService } from './lote-prod.service.js';
import { CreateLoteProdDto } from './dto/create-lote-prod.dto.js';
import { UpdateLoteProdDto } from './dto/update-lote-prod.dto.js';

@Controller('lotes-prod')
export class LoteProdController {
  constructor(private readonly loteProdService: LoteProdService) {}

  @Post()
  create(@Body() dto: CreateLoteProdDto) {
    return this.loteProdService.create(dto);
  }

  @Get()
  findAll() {
    return this.loteProdService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.loteProdService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLoteProdDto) {
    return this.loteProdService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.loteProdService.remove(id);
  }
}
