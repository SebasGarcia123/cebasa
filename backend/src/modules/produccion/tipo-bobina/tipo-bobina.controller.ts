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
import { TipoBobinaService } from './tipo-bobina.service.js';
import { CreateTipoBobinaDto } from './dto/create-tipo-bobina.dto.js';
import { UpdateTipoBobinaDto } from './dto/update-tipo-bobina.dto.js';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator.js';

@ApiTags('Tipo Bobina')
@Controller('tipo-bobina')
export class TipoBobinaController {
  constructor(private readonly tipoBobinaService: TipoBobinaService) {}

  @RequirePermissions('produccion.editar')
  @Post()
  create(@Body() dto: CreateTipoBobinaDto) {
    return this.tipoBobinaService.create(dto);
  }

  @RequirePermissions('produccion.ver')
  @Get()
  findAll() {
    return this.tipoBobinaService.findAll();
  }

  @RequirePermissions('produccion.ver')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tipoBobinaService.findOne(id);
  }

  @RequirePermissions('produccion.editar')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTipoBobinaDto) {
    return this.tipoBobinaService.update(id, dto);
  }

  @RequirePermissions('produccion.editar')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tipoBobinaService.remove(id);
  }
}
