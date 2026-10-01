import { Body, Controller, Get, Param, ParseIntPipe, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../../auth/decorators/permissions.decorator.js';
import { DocumentosService } from './documentos.service.js';
import { CreateFacturaDto } from './dto/create-factura.dto.js';
import { CreateReciboDto } from './dto/create-recibo.dto.js';
import { CreateNotaDto } from './dto/create-nota.dto.js';

// Los cuatro documentos comerciales (Factura, Recibo, Nota de Crédito,
// Nota de Débito) se generan siempre desde la consulta de un cliente
// puntual: de ahí que todo cuelgue de /clientes/:idCliente/documentos
// en vez de ser un módulo suelto — mismo criterio que cuenta-corriente.
@ApiTags('Clientes - Documentos')
@Controller('clientes/:idCliente/documentos')
export class DocumentosController {
  constructor(private readonly documentosService: DocumentosService) {}

  @RequirePermissions('comercial.clientes.editar')
  @Get('facturables')
  pedidosFacturables(@Param('idCliente', ParseIntPipe) idCliente: number) {
    return this.documentosService.pedidosFacturables(idCliente);
  }

  @RequirePermissions('comercial.clientes.editar')
  @Post('factura')
  async generarFactura(
    @Param('idCliente', ParseIntPipe) idCliente: number,
    @Body() dto: CreateFacturaDto,
    @Res() res: Response,
  ) {
    const { buffer, factura } = await this.documentosService.generarFactura(idCliente, dto);
    this.enviarPdf(res, buffer, `factura-${factura.id_factura}.pdf`);
  }

  @RequirePermissions('comercial.clientes.editar')
  @Post('recibo')
  async generarRecibo(
    @Param('idCliente', ParseIntPipe) idCliente: number,
    @Body() dto: CreateReciboDto,
    @Res() res: Response,
  ) {
    const { buffer, recibo } = await this.documentosService.generarRecibo(idCliente, dto);
    this.enviarPdf(res, buffer, `recibo-${recibo.id_recibo}.pdf`);
  }

  @RequirePermissions('comercial.clientes.editar')
  @Post('nota-credito')
  async generarNotaCredito(
    @Param('idCliente', ParseIntPipe) idCliente: number,
    @Body() dto: CreateNotaDto,
    @Res() res: Response,
  ) {
    const { buffer, id } = await this.documentosService.generarNotaCredito(idCliente, dto);
    this.enviarPdf(res, buffer, `nota-credito-${id}.pdf`);
  }

  @RequirePermissions('comercial.clientes.editar')
  @Post('nota-debito')
  async generarNotaDebito(
    @Param('idCliente', ParseIntPipe) idCliente: number,
    @Body() dto: CreateNotaDto,
    @Res() res: Response,
  ) {
    const { buffer, id } = await this.documentosService.generarNotaDebito(idCliente, dto);
    this.enviarPdf(res, buffer, `nota-debito-${id}.pdf`);
  }

  @RequirePermissions('comercial.clientes.editar')
  @Get('factura/:id/pdf')
  async pdfFactura(
    @Param('idCliente', ParseIntPipe) idCliente: number,
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const { buffer, nombreArchivo } = await this.documentosService.obtenerPdfFactura(idCliente, id);
    this.enviarPdf(res, buffer, nombreArchivo);
  }

  @RequirePermissions('comercial.clientes.editar')
  @Get('recibo/:id/pdf')
  async pdfRecibo(
    @Param('idCliente', ParseIntPipe) idCliente: number,
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const { buffer, nombreArchivo } = await this.documentosService.obtenerPdfRecibo(idCliente, id);
    this.enviarPdf(res, buffer, nombreArchivo);
  }

  @RequirePermissions('comercial.clientes.editar')
  @Get('nota-credito/:id/pdf')
  async pdfNotaCredito(
    @Param('idCliente', ParseIntPipe) idCliente: number,
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const { buffer, nombreArchivo } = await this.documentosService.obtenerPdfNotaCredito(idCliente, id);
    this.enviarPdf(res, buffer, nombreArchivo);
  }

  @RequirePermissions('comercial.clientes.editar')
  @Get('nota-debito/:id/pdf')
  async pdfNotaDebito(
    @Param('idCliente', ParseIntPipe) idCliente: number,
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const { buffer, nombreArchivo } = await this.documentosService.obtenerPdfNotaDebito(idCliente, id);
    this.enviarPdf(res, buffer, nombreArchivo);
  }

  private enviarPdf(res: Response, buffer: Buffer, nombreArchivo: string): void {
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${nombreArchivo}"`,
    });
    res.send(buffer);
  }
}
