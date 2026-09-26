import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
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

// assets/ vive en la raíz del backend, junto a uploads/ (ver
// archivo-adjunto.storage.ts, mismo criterio de path relativo).
const LOGO_PATH = join(
  fileURLToPath(new URL('.', import.meta.url)),
  '../../../../assets/logo-celulosa-baradero.png',
);

const COPIA_LABELS: Record<number, string[]> = {
  2: ['ORIGINAL', 'DUPLICADO'],
  3: ['ORIGINAL', 'DUPLICADO', 'TRIPLICADO'],
};

const MARGEN_IZQ = 40;
const MARGEN_DER = 555;
const COL_DERECHA_X = 350;

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

    // Logo arriba a la izquierda, y debajo los datos de la empresa,
    // todos alineados al mismo margen izquierdo que el resto del
    // documento (cliente, fecha, ítems).
    const inicioY = doc.y;
    try {
      doc.image(LOGO_PATH, MARGEN_IZQ, inicioY, { width: 140 });
    } catch {
      // Si por algún motivo no está el archivo del logo, el remito se
      // sigue generando igual, solo sin la imagen.
    }

    let ejeY = inicioY + 48;
    doc.fontSize(13).font('Helvetica-Bold').text(EMPRESA.razonSocial, MARGEN_IZQ, ejeY, { width: 260 });
    doc.fontSize(9).font('Helvetica');
    doc.text(EMPRESA.domicilio, MARGEN_IZQ, doc.y, { width: 260 });
    doc.text(`Tel: ${EMPRESA.telefono}`, MARGEN_IZQ, doc.y, { width: 260 });
    doc.text(`CUIT: ${EMPRESA.cuit} — IVA: ${EMPRESA.iva}`, MARGEN_IZQ, doc.y, { width: 260 });
    const finIzquierda = doc.y;

    // Título del remito arriba a la derecha, arrancando a la misma
    // altura que el logo.
    doc.fontSize(18).font('Helvetica-Bold').text('REMITO', COL_DERECHA_X, inicioY, { width: anchoDerecha, align: 'right' });
    doc.fontSize(11).font('Helvetica-Bold').text(`N° ${numeroRemito}`, COL_DERECHA_X, doc.y, { width: anchoDerecha, align: 'right' });
    doc.fontSize(10).font('Helvetica-Bold').text(copiaLabel, COL_DERECHA_X, doc.y, { width: anchoDerecha, align: 'right' });
    const finDerecha = doc.y;

    ejeY = Math.max(finIzquierda, finDerecha) + 12;
    doc.moveTo(MARGEN_IZQ, ejeY).lineTo(MARGEN_DER, ejeY).stroke();
    ejeY += 16;

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
    doc.text(`Fecha de despacho: ${fecha.toLocaleDateString('es-AR')}`, MARGEN_IZQ, doc.y + 8);

    ejeY = doc.y + 20;
    const colX = { codigo: MARGEN_IZQ, descripcion: 130, cantidad: 400, pallets: 480 };
    doc.font('Helvetica-Bold').fontSize(10);
    doc.text('Código', colX.codigo, ejeY, { width: 80 });
    doc.text('Producto', colX.descripcion, ejeY, { width: 260 });
    doc.text('Cantidad', colX.cantidad, ejeY, { width: 70, align: 'right' });
    doc.text('Pallets', colX.pallets, ejeY, { width: 70, align: 'right' });
    ejeY += 18;
    doc.moveTo(MARGEN_IZQ, ejeY).lineTo(MARGEN_DER, ejeY).stroke();
    ejeY += 8;

    doc.font('Helvetica').fontSize(10);
    for (const item of pedido.item_pedido) {
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

    ejeY += 40;
    doc.moveTo(MARGEN_IZQ, ejeY).lineTo(MARGEN_DER, ejeY).stroke();
    ejeY += 30;

    // Firma y aclaración una al lado de la otra, no una debajo de la otra.
    doc.fontSize(9);
    doc.text('Recibí conforme: ___________________________', MARGEN_IZQ, ejeY, { width: 240 });
    doc.text('Aclaración y DNI: _____________________', COL_DERECHA_X, ejeY, { width: anchoDerecha });
  }
}
