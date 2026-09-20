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
import { TipoDocumentoService } from './tipo-documento.service.js';
import { CreateTipoDocumentoDto } from './dto/create-tipo-documento.dto.js';
import { UpdateTipoDocumentoDto } from './dto/update-tipo-documento.dto.js';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator.js';

@ApiTags('Tipo Documento')
@Controller('tipo-documento')
export class TipoDocumentoController {
  constructor(private readonly tipoDocumentoService: TipoDocumentoService) {}

  @RequirePermissions('comercial.editar')
  @Post()
  create(@Body() dto: CreateTipoDocumentoDto) {
    return this.tipoDocumentoService.create(dto);
  }

  @RequirePermissions('comercial.ver')
  @Get()
  findAll() {
    return this.tipoDocumentoService.findAll();
  }

  @RequirePermissions('comercial.ver')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tipoDocumentoService.findOne(id);
  }

  @RequirePermissions('comercial.editar')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTipoDocumentoDto,
  ) {
    return this.tipoDocumentoService.update(id, dto);
  }

  @RequirePermissions('comercial.editar')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tipoDocumentoService.remove(id);
  }
}
