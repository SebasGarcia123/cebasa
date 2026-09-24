import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

// Datos fijos de la empresa para el encabezado del remito. Es una sola
// empresa y estos datos prácticamente no cambian, así que no amerita
// una tabla de configuración editable por ahora.
const EMPRESA = {
  razonSocial: 'Celulosa Baradero SA',
  domicilio: 'Marcelo T. de Alvear 4025, Caseros',
  telefono: '4025 4025',
  cuit: '30-64959269-8',
  iva: 'Responsable Inscripto',
};

const COPIA_LABELS: Record<number, string[]> = {
  2: ['ORIGINAL', 'DUPLICADO'],
  3: ['ORIGINAL', 'DUPLICADO', 'TRIPLICADO'],
};

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
    };
  }[];
}

@Injectable()
export class RemitoPdfService {
  // Genera un PDF con una página por copia (Original/Duplicado/[Triplicado]),
  // para que imprimir el archivo entero dé directamente el juego completo.
  generar(pedido: PedidoParaRemito, cantidadCopias: number): Promise<Buffer> {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
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

    doc.fontSize(16).font('Helvetica-Bold').text(EMPRESA.razonSocial, { continued: false });
    doc.fontSize(9).font('Helvetica');
    doc.text(EMPRESA.domicilio);
    doc.text(`Tel: ${EMPRESA.telefono}`);
    doc.text(`CUIT: ${EMPRESA.cuit} — IVA: ${EMPRESA.iva}`);

    doc.moveUp(4);
    doc.fontSize(18).font('Helvetica-Bold').text('REMITO', 0, doc.y, { align: 'right' });
    doc.fontSize(11).font('Helvetica-Bold').text(`N° ${numeroRemito}`, { align: 'right' });
    doc.fontSize(10).font('Helvetica-Bold').text(copiaLabel, { align: 'right' });

    doc.moveDown(2);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(1);

    const cliente = pedido.clientes;
    const direccion = cliente.direcciones;
    doc.fontSize(11).font('Helvetica-Bold').text('Cliente');
    doc.fontSize(10).font('Helvetica');
    doc.text(cliente.nombre_cli);
    doc.text(
      [direccion.calle, direccion.numero].filter(Boolean).join(' ') +
        `, ${direccion.localidad}, ${direccion.provincia}`,
    );
    if (cliente.telefono_cli) {
      doc.text(`Tel: ${cliente.telefono_cli}`);
    }

    doc.moveDown(0.5);
    const fecha = pedido.fecha_despacho ?? pedido.fecha_carga;
    doc.text(`Fecha de despacho: ${fecha.toLocaleDateString('es-AR')}`);

    doc.moveDown(1.5);

    const colX = { codigo: 40, descripcion: 130, bolsones: 400, pallets: 480 };
    const filaHeaderY = doc.y;
    doc.font('Helvetica-Bold').fontSize(10);
    doc.text('Código', colX.codigo, filaHeaderY, { width: 80 });
    doc.text('Producto', colX.descripcion, filaHeaderY, { width: 260 });
    doc.text('Bolsones', colX.bolsones, filaHeaderY, { width: 70, align: 'right' });
    doc.text('Pallets', colX.pallets, filaHeaderY, { width: 70, align: 'right' });
    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.3);

    doc.font('Helvetica').fontSize(10);
    for (const item of pedido.item_pedido) {
      const bpp = item.productos.bolsones_por_pallet;
      const pallets = bpp ? Math.round((item.cantidad_bolsones / bpp) * 100) / 100 : null;
      const filaY = doc.y;
      doc.text(item.productos.codigo_producto, colX.codigo, filaY, { width: 80 });
      doc.text(item.productos.descripcion_producto, colX.descripcion, filaY, { width: 260 });
      doc.text(String(item.cantidad_bolsones), colX.bolsones, filaY, { width: 70, align: 'right' });
      doc.text(pallets != null ? pallets.toFixed(2) : '—', colX.pallets, filaY, { width: 70, align: 'right' });
      doc.moveDown(0.6);
    }

    doc.moveDown(3);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(2);
    doc.fontSize(9).text('Recibí conforme: _______________________________', 40, doc.y);
    doc.moveDown(0.5);
    doc.text('Aclaración y DNI: _______________________________');
  }
}
