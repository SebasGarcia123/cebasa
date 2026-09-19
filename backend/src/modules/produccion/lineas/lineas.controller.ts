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
import { LineasService } from './lineas.service.js';
import { CreateLineaDto } from './dto/create-linea.dto.js';
import { UpdateLineaDto } from './dto/update-linea.dto.js';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Lineas')
@Controller('lineas')
export class LineasController {
  constructor(private readonly lineasService: LineasService) {}

  @Post()
  create(@Body() dto: CreateLineaDto) {
    return this.lineasService.create(dto);
  }

  @Get()
  findAll() {
    return this.lineasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.lineasService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLineaDto) {
    return this.lineasService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.lineasService.remove(id);
  }
}
