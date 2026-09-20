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
import { SectoresService } from './sectores.service.js';
import { CreateSectorDto } from './dto/create-sector.dto.js';
import { UpdateSectorDto } from './dto/update-sector.dto.js';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator.js';

@ApiTags('Sectores')
@Controller('sectores')
export class SectoresController {
  constructor(private readonly sectoresService: SectoresService) {}

  @RequirePermissions('catalogos.editar')
  @Post()
  create(@Body() dto: CreateSectorDto) {
    return this.sectoresService.create(dto);
  }

  @Get()
  findAll() {
    return this.sectoresService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.sectoresService.findOne(id);
  }

  @RequirePermissions('catalogos.editar')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSectorDto) {
    return this.sectoresService.update(id, dto);
  }

  @RequirePermissions('catalogos.editar')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.sectoresService.remove(id);
  }
}
