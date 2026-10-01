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
import { TipoImpactoService } from './tipo-impacto.service.js';
import { CreateTipoImpactoDto } from './dto/create-tipo-impacto.dto.js';
import { UpdateTipoImpactoDto } from './dto/update-tipo-impacto.dto.js';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator.js';

@ApiTags('Tipo Impacto')
@Controller('tipo-impacto')
export class TipoImpactoController {
  constructor(private readonly tipoImpactoService: TipoImpactoService) {}

  @RequirePermissions('comercial.tipo_impacto.editar')
  @Post()
  create(@Body() dto: CreateTipoImpactoDto) {
    return this.tipoImpactoService.create(dto);
  }

  @Get()
  findAll() {
    return this.tipoImpactoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tipoImpactoService.findOne(id);
  }

  @RequirePermissions('comercial.tipo_impacto.editar')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTipoImpactoDto,
  ) {
    return this.tipoImpactoService.update(id, dto);
  }

  @RequirePermissions('comercial.tipo_impacto.editar')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tipoImpactoService.remove(id);
  }
}
