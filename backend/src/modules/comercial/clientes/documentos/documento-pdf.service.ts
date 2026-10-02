import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import {
  MARGEN_DER,
  MARGEN_IZQ,
  formatearFechaAR,
  montoEnLetras,
  renderEncabezadoEmpresa,
} from '../../../../pdf/empresa-pdf.util.js';

// Las bobinas se venden por peso, no por bolsón: se muestran en Kg en
// vez de Bolsones (mismo criterio en remito-pdf y en el frontend).
const TIPO_PRODUCTO_BOBINA = 'Bobina';

interface ClienteParaDocumento {
  nombre_cli: string;
  telefono_cli: string | null;
  direcciones: {
    calle: string;
    numero: string | null;
    localidad: string;
    provincia: string;
  };
}

interface ItemParaFactura {
  cantidad_bolsones: number;
  productos: {
    codigo_producto: string;
    descripcion_producto: string;
    precio_venta: number;
    tipo_producto: { descripcion: string } | null;
  };
}

interface DocumentoBase {
  numero: string;
  fecha: Date;
  cliente: ClienteParaDocumento;
  monto: number;
}

interface FacturaParaPdf extends DocumentoBase {
  tipo: 'factura';
  idPedido: number;
  items: ItemParaFactura[];
}

interface ReciboParaPdf extends DocumentoBase {
  tipo: 'recibo';
  medioPago: string;
  observaciones: string | null;
}

interface NotaParaPdf extends DocumentoBase {
  tipo: 'nota_credito' | 'nota_debito';
  motivo: string;
}

export type DocumentoParaPdf = FacturaParaPdf | ReciboParaPdf | NotaParaPdf;

const TITULOS: Record<DocumentoParaPdf['tipo'], string> = {
  factura: 'FACTURA',
  recibo: 'RECIBO',
  nota_credito: 'NOTA DE CRÉDITO',
  nota_debito: 'NOTA DE DÉBITO',
};

@Injectable()
export class DocumentoPdfService {
  generar(documento: DocumentoParaPdf): Promise<Buffer> {
    const doc = new PDFDocument({ size: 'A4', margin: MARGEN_IZQ });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    const listo = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    this.renderDocumento(doc, documento);
    doc.end();
    return listo;
  }

  private renderDocumento(doc: PDFKit.PDFDocument, documento: DocumentoParaPdf): void {
    const areaUtilY = doc.page.height - MARGEN_IZQ;
    let ejeY = renderEncabezadoEmpresa(doc, TITULOS[documento.tipo], documento.numero);

    const cliente = documento.cliente;
    const direccion = cliente.direcciones;
    doc.fontSize(11).font('Helvetica-Bold').text('Cliente', MARGEN_IZQ, ejeY);
    doc.fontSize(10).font('Helvetica');
    doc.text(cliente.nombre_cli, MARGEN_IZQ, doc.y);
    doc.text(
      [direccion.calle, direccion.numero].filter(Boolean).join(' ') +
        `, ${direccion.localidad}, ${direccion.provincia}`,
      MARGEN_IZQ,
      doc.y,
    );
    if (cliente.telefono_cli) {
      doc.text(`Tel: ${cliente.telefono_cli}`, MARGEN_IZQ, doc.y);
    }
    doc.text(`Fecha: ${formatearFechaAR(documento.fecha)}`, MARGEN_IZQ, doc.y + 8);

    ejeY = doc.y + 24;

    if (documento.tipo === 'factura') {
      ejeY = this.renderItemsFactura(doc, documento, ejeY, areaUtilY);
    } else {
      ejeY = this.renderConcepto(doc, documento, ejeY);
    }

    // Total: siempre después del contenido específico del documento,
    // nunca en una posición fija (para no pisar la tabla de ítems de
    // una factura larga).
    if (ejeY + 60 > areaUtilY) {
      doc.addPage();
      ejeY = MARGEN_IZQ;
    }
    doc.moveTo(MARGEN_IZQ, ejeY).lineTo(MARGEN_DER, ejeY).stroke();
    ejeY += 10;
    doc.fontSize(12).font('Helvetica-Bold').text(`Total: $ ${documento.monto.toFixed(2)}`, MARGEN_IZQ, ejeY, {
      width: MARGEN_DER - MARGEN_IZQ,
      align: 'right',
    });
    doc.fontSize(9).font('Helvetica').text(montoEnLetras(documento.monto), MARGEN_IZQ, doc.y + 6, {
      width: MARGEN_DER - MARGEN_IZQ,
      align: 'right',
    });
  }

  private renderConcepto(doc: PDFKit.PDFDocument, documento: ReciboParaPdf | NotaParaPdf, ejeY: number): number {
    doc.fontSize(11).font('Helvetica-Bold').text('Concepto', MARGEN_IZQ, ejeY);
    doc.fontSize(10).font('Helvetica');

    if (documento.tipo === 'recibo') {
      doc.text(`Medio de pago: ${documento.medioPago}`, MARGEN_IZQ, doc.y + 4);
      if (documento.observaciones) {
        doc.text(documento.observaciones, MARGEN_IZQ, doc.y + 4, { width: MARGEN_DER - MARGEN_IZQ });
      }
    } else {
      doc.text(`Motivo: ${documento.motivo}`, MARGEN_IZQ, doc.y + 4, { width: MARGEN_DER - MARGEN_IZQ });
    }

    return doc.y + 20;
  }

  private renderItemsFactura(
    doc: PDFKit.PDFDocument,
    documento: FacturaParaPdf,
    ejeY: number,
    areaUtilY: number,
  ): number {
    doc.fontSize(9).font('Helvetica').text(`Pedido N° ${documento.idPedido}`, MARGEN_IZQ, ejeY);
    ejeY = doc.y + 10;

    const colX = { codigo: MARGEN_IZQ, descripcion: 120, cantidad: 320, precio: 400, subtotal: 480 };
    ejeY = this.renderEncabezadoItems(doc, ejeY, colX);

    doc.font('Helvetica').fontSize(10);
    for (const item of documento.items) {
      if (ejeY + 16 > areaUtilY) {
        doc.addPage();
        ejeY = this.renderEncabezadoItems(doc, MARGEN_IZQ, colX);
        doc.font('Helvetica').fontSize(10);
      }

      const esBobina = item.productos.tipo_producto?.descripcion === TIPO_PRODUCTO_BOBINA;
      const cantidadTexto = `${item.cantidad_bolsones} ${esBobina ? 'kg' : 'bols.'}`;
      const subtotal = item.cantidad_bolsones * item.productos.precio_venta;

      doc.text(item.productos.codigo_producto, colX.codigo, ejeY, { width: 75 });
      doc.text(item.productos.descripcion_producto, colX.descripcion, ejeY, { width: 195 });
      doc.text(cantidadTexto, colX.cantidad, ejeY, { width: 75, align: 'right' });
      doc.text(item.productos.precio_venta.toFixed(2), colX.precio, ejeY, { width: 75, align: 'right' });
      doc.text(subtotal.toFixed(2), colX.subtotal, ejeY, { width: 75, align: 'right' });
      ejeY += 16;
    }

    return ejeY + 10;
  }

  private renderEncabezadoItems(
    doc: PDFKit.PDFDocument,
    ejeY: number,
    colX: { codigo: number; descripcion: number; cantidad: number; precio: number; subtotal: number },
  ): number {
    doc.font('Helvetica-Bold').fontSize(9);
    doc.text('Código', colX.codigo, ejeY, { width: 75 });
    doc.text('Producto', colX.descripcion, ejeY, { width: 195 });
    doc.text('Cantidad', colX.cantidad, ejeY, { width: 75, align: 'right' });
    doc.text('P. Unit.', colX.precio, ejeY, { width: 75, align: 'right' });
    doc.text('Subtotal', colX.subtotal, ejeY, { width: 75, align: 'right' });
    ejeY += 16;
    doc.moveTo(MARGEN_IZQ, ejeY).lineTo(MARGEN_DER, ejeY).stroke();
    return ejeY + 8;
  }
}
