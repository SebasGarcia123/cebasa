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
import { DepositoService } from './deposito.service.js';
import { CreateDepositoDto } from './dto/create-deposito.dto.js';
import { UpdateDepositoDto } from './dto/update-deposito.dto.js';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator.js';

@ApiTags('Deposito')
@Controller('deposito')
export class DepositoController {
  constructor(private readonly depositoService: DepositoService) {}

  @RequirePermissions('produccion.editar')
  @Post()
  create(@Body() dto: CreateDepositoDto) {
    return this.depositoService.create(dto);
  }

  @RequirePermissions('produccion.ver')
  @Get()
  findAll() {
    return this.depositoService.findAll();
  }

  @RequirePermissions('produccion.ver')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.depositoService.findOne(id);
  }

  @RequirePermissions('produccion.editar')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDepositoDto,
  ) {
    return this.depositoService.update(id, dto);
  }

  @RequirePermissions('produccion.editar')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.depositoService.remove(id);
  }
}
