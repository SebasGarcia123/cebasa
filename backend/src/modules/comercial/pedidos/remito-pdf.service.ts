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

const COPIA_LABELS: Record<number, string[]> = {
  2: ['ORIGINAL', 'DUPLICADO'],
  3: ['ORIGINAL', 'DUPLICADO', 'TRIPLICADO'],
};

// Las bobinas se venden por peso, no por bolsón: se muestran en Kg en
// vez de Bolsones (mismo criterio en PedidosList del frontend).
const TIPO_PRODUCTO_BOBINA = 'Bobina';

interface PedidoParaRemito {
  id_pedido: number;
  fecha_carga: Date;
  fecha_despacho: Date | null;
  clientes: {
    nombre_cli: string;
    telefono_cli: string | null;
    direcciones: {
      calle: string;
      numero: string | null;
      localidad: string;
      provincia: string;
    };
  };
  item_pedido: {
    cantidad_bolsones: number;
    productos: {
      codigo_producto: string;
      descripcion_producto: string;
      bolsones_por_pallet: number | null;
      tipo_producto: { descripcion: string } | null;
    };
  }[];
}

@Injectable()
export class RemitoPdfService {
  // Genera un PDF con una página por copia (Original/Duplicado/[Triplicado]),
  // para que imprimir el archivo entero dé directamente el juego completo.
  generar(pedido: PedidoParaRemito, cantidadCopias: number): Promise<Buffer> {
    const doc = new PDFDocument({ size: 'A4', margin: MARGEN_IZQ });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    const listo = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    const labels = COPIA_LABELS[cantidadCopias] ?? COPIA_LABELS[2];
    labels.forEach((label, index) => {
      if (index > 0) {
        doc.addPage();
      }
      this.renderPagina(doc, pedido, label);
    });

    doc.end();
    return listo;
  }

  private renderPagina(doc: PDFKit.PDFDocument, pedido: PedidoParaRemito, copiaLabel: string): void {
    const numeroRemito = String(pedido.id_pedido).padStart(8, '0');
    const anchoDerecha = MARGEN_DER - COL_DERECHA_X;

    let ejeY = renderEncabezadoEmpresa(doc, 'REMITO', numeroRemito, copiaLabel);

    const cliente = pedido.clientes;
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

    const fecha = pedido.fecha_despacho ?? pedido.fecha_carga;
    doc.text(`Fecha de despacho: ${formatearFechaAR(fecha)}`, MARGEN_IZQ, doc.y + 8);

    ejeY = doc.y + 20;
    const colX = { codigo: MARGEN_IZQ, descripcion: 130, cantidad: 400, pallets: 480 };
    const areaUtilY = doc.page.height - MARGEN_IZQ;
    ejeY = this.renderEncabezadoItems(doc, ejeY, colX);

    doc.font('Helvetica').fontSize(10);
    for (const item of pedido.item_pedido) {
      // Si no entra ni la fila, hoja nueva y se repite el encabezado de
      // la tabla (remitos con mucha mercadería).
      if (ejeY + 16 > areaUtilY) {
        doc.addPage();
        ejeY = this.renderEncabezadoItems(doc, MARGEN_IZQ, colX);
        doc.font('Helvetica').fontSize(10);
      }

      const bpp = item.productos.bolsones_por_pallet;
      const pallets = bpp ? Math.round((item.cantidad_bolsones / bpp) * 100) / 100 : null;
      const esBobina = item.productos.tipo_producto?.descripcion === TIPO_PRODUCTO_BOBINA;
      const cantidadTexto = `${item.cantidad_bolsones} ${esBobina ? 'kg' : 'bolsones'}`;
      doc.text(item.productos.codigo_producto, colX.codigo, ejeY, { width: 80 });
      doc.text(item.productos.descripcion_producto, colX.descripcion, ejeY, { width: 260 });
      doc.text(cantidadTexto, colX.cantidad, ejeY, { width: 70, align: 'right' });
      doc.text(pallets != null ? pallets.toFixed(2) : '—', colX.pallets, ejeY, { width: 70, align: 'right' });
      ejeY += 16;
    }

    // Firma y aclaración, una al lado de la otra: por default a 4cm del
    // pie de la hoja, pero nunca más arriba que el final de la tabla
    // (si hay mucha mercadería, se corren para abajo en vez de pisarla;
    // si ni así entran en la hoja actual, pasan a una hoja nueva).
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
    colX: { codigo: number; descripcion: number; cantidad: number; pallets: number },
  ): number {
    doc.font('Helvetica-Bold').fontSize(10);
    doc.text('Código', colX.codigo, ejeY, { width: 80 });
    doc.text('Producto', colX.descripcion, ejeY, { width: 260 });
    doc.text('Cantidad', colX.cantidad, ejeY, { width: 70, align: 'right' });
    doc.text('Pallets', colX.pallets, ejeY, { width: 70, align: 'right' });
    ejeY += 18;
    doc.moveTo(MARGEN_IZQ, ejeY).lineTo(MARGEN_DER, ejeY).stroke();
    return ejeY + 8;
  }
}
