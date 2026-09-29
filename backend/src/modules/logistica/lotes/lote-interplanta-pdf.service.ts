import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import {
  FIRMA_DESDE_ABAJO,
  MARGEN_DER,
  MARGEN_IZQ,
  COL_DERECHA_X,
  formatearFechaAR,
  renderEncabezadoEmpresa,
} from '../../../pdf/empresa-pdf.util.js';

interface LoteParaPdf {
  id_lote: number;
  fecha_lote: Date;
  fecha_despacho: Date | null;
  chofer: { nombre_chofer: string; dni: string };
  camion: { dominio_chasis: string; dominio_semi: string | null };
  deposito_origen: { nombre_deposito: string } | null;
  deposito_destino: { nombre_deposito: string } | null;
  observaciones: string | null;
  item_lote: {
    cantidad: number;
    productos: { codigo_producto: string; descripcion_producto: string } | null;
    insumo: { codigo_insumo: string; nombre_insumo: string } | null;
  }[];
}

@Injectable()
export class LoteInterplantaPdfService {
  generar(lote: LoteParaPdf): Promise<Buffer> {
    const doc = new PDFDocument({ size: 'A4', margin: MARGEN_IZQ });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    const listo = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    this.renderPagina(doc, lote);
    doc.end();
    return listo;
  }

  private renderPagina(doc: PDFKit.PDFDocument, lote: LoteParaPdf): void {
    const numero = String(lote.id_lote).padStart(8, '0');
    const anchoDerecha = MARGEN_DER - COL_DERECHA_X;
    const areaUtilY = doc.page.height - MARGEN_IZQ;

    let ejeY = renderEncabezadoEmpresa(doc, 'LOTE INTERPLANTA', numero);

    doc.fontSize(11).font('Helvetica-Bold').text('Traslado', MARGEN_IZQ, ejeY);
    doc.fontSize(10).font('Helvetica');
    doc.text(`Origen: ${lote.deposito_origen?.nombre_deposito ?? '—'}`, MARGEN_IZQ, doc.y);
    doc.text(`Destino: ${lote.deposito_destino?.nombre_deposito ?? '—'}`, MARGEN_IZQ, doc.y);
    const fecha = lote.fecha_despacho ?? lote.fecha_lote;
    doc.text(`Fecha: ${formatearFechaAR(fecha)}`, MARGEN_IZQ, doc.y + 4);

    doc.fontSize(11).font('Helvetica-Bold').text('Transporte', COL_DERECHA_X, ejeY, { width: anchoDerecha });
    doc.fontSize(10).font('Helvetica');
    doc.text(`Chofer: ${lote.chofer.nombre_chofer}`, COL_DERECHA_X, doc.y, { width: anchoDerecha });
    doc.text(`DNI: ${lote.chofer.dni}`, COL_DERECHA_X, doc.y, { width: anchoDerecha });
    const dominio = [lote.camion.dominio_chasis, lote.camion.dominio_semi].filter(Boolean).join(' / ');
    doc.text(`Camión: ${dominio}`, COL_DERECHA_X, doc.y, { width: anchoDerecha });

    if (lote.observaciones) {
      doc.fontSize(9).text(`Observaciones: ${lote.observaciones}`, MARGEN_IZQ, doc.y + 10, {
        width: MARGEN_DER - MARGEN_IZQ,
      });
    }

    ejeY = doc.y + 20;
    const colX = { codigo: MARGEN_IZQ, descripcion: 130, cantidad: 460 };
    ejeY = this.renderEncabezadoItems(doc, ejeY, colX);

    doc.font('Helvetica').fontSize(10);
    for (const item of lote.item_lote) {
      if (ejeY + 16 > areaUtilY) {
        doc.addPage();
        ejeY = this.renderEncabezadoItems(doc, MARGEN_IZQ, colX);
        doc.font('Helvetica').fontSize(10);
      }

      const codigo = item.productos?.codigo_producto ?? item.insumo?.codigo_insumo ?? '—';
      const descripcion = item.productos?.descripcion_producto ?? item.insumo?.nombre_insumo ?? '—';
      doc.text(codigo, colX.codigo, ejeY, { width: 80 });
      doc.text(descripcion, colX.descripcion, ejeY, { width: 320 });
      doc.text(item.cantidad.toFixed(2), colX.cantidad, ejeY, { width: 65, align: 'right' });
      ejeY += 16;
    }

    const yFirmaPorDefecto = doc.page.height - FIRMA_DESDE_ABAJO;
    let yFirma = Math.max(ejeY + 30, yFirmaPorDefecto);
    if (yFirma > areaUtilY) {
      doc.addPage();
      yFirma = yFirmaPorDefecto;
    }

    doc.moveTo(MARGEN_IZQ, yFirma - 15).lineTo(MARGEN_DER, yFirma - 15).stroke();
    doc.fontSize(9).font('Helvetica');
    doc.text('Recibí conforme: ___________________________', MARGEN_IZQ, yFirma, { width: 240 });
    doc.text('Aclaración y DNI: _____________________', COL_DERECHA_X, yFirma, { width: anchoDerecha });
  }

  private renderEncabezadoItems(
    doc: PDFKit.PDFDocument,
    ejeY: number,
    colX: { codigo: number; descripcion: number; cantidad: number },
  ): number {
    doc.font('Helvetica-Bold').fontSize(10);
    doc.text('Código', colX.codigo, ejeY, { width: 80 });
    doc.text('Producto / Insumo', colX.descripcion, ejeY, { width: 320 });
    doc.text('Cantidad', colX.cantidad, ejeY, { width: 65, align: 'right' });
    ejeY += 18;
    doc.moveTo(MARGEN_IZQ, ejeY).lineTo(MARGEN_DER, ejeY).stroke();
    return ejeY + 8;
  }
}
