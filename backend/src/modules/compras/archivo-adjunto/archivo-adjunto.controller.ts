import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { join } from 'node:path';
import { ArchivoAdjuntoService } from './archivo-adjunto.service.js';
import { CreateArchivoAdjuntoDto } from './dto/create-archivo-adjunto.dto.js';
import { UpdateArchivoAdjuntoDto } from './dto/update-archivo-adjunto.dto.js';
import { archivoAdjuntoMulterOptions, UPLOADS_DIR } from './archivo-adjunto.storage.js';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Archivo Adjunto')
@Controller('archivos-adjuntos')
export class ArchivoAdjuntoController {
  constructor(private readonly archivoAdjuntoService: ArchivoAdjuntoService) {}

  @Post()
  create(@Body() dto: CreateArchivoAdjuntoDto) {
    return this.archivoAdjuntoService.create(dto);
  }

  // Recibe el archivo real (imagen o PDF), lo guarda en uploads/ y crea el
  // registro con la ruta generada. Separado de POST / (que solo guarda
  // metadatos) porque este espera multipart/form-data, no JSON.
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', archivoAdjuntoMulterOptions))
  upload(@UploadedFile() file: Express.Multer.File) {
    return this.archivoAdjuntoService.createFromUpload(file);
  }

  @Get()
  findAll() {
    return this.archivoAdjuntoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.archivoAdjuntoService.findOne(id);
  }

  // Sirve el archivo físico detrás del mismo login de siempre (JwtAuthGuard
  // global), en vez de exponer uploads/ como estático sin autenticación.
  @Get(':id/file')
  async getFile(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const archivo = await this.archivoAdjuntoService.findOne(id);
    res.sendFile(join(UPLOADS_DIR, archivo.ruta_archivo), {
      headers: { 'Content-Type': archivo.tipo_archivo ?? 'application/octet-stream' },
    });
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateArchivoAdjuntoDto,
  ) {
    return this.archivoAdjuntoService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.archivoAdjuntoService.remove(id);
  }
}
