import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { EMPRESA } from './empresa-pdf.util.js';

export interface CampoRotulo {
  label: string;
  valor: string;
}

// Genérico a propósito: lo usa el rótulo de bobinas de Producción
// Baradero y el de pallets de Producción Caseros (mismo tamaño de
// página y mismo QR, solo cambian qué campos se le pasan). titulo es
// opcional: si no se pasa (como en bobinas) no se imprime, dejando más
// espacio para que el número y los campos se agranden. El QR no se
// arma a mano en cada caller: se genera acá mismo a partir de
// titulo+numero+campos, en texto plano con label/valor por línea (no
// JSON), para que se pueda leer a simple vista si alguien lo escanea
// con el celular sin ninguna app especial.
export interface RotuloParaPdf {
  titulo?: string;
  numero: string;
  campos: CampoRotulo[];
}

// Media hoja A4 = A5 (cortar un A4 al medio da dos A5), apaisado para
// que los datos y el QR entren cómodos uno al lado del otro.
const MARGEN = 28;
const FUENTE_NUMERO_MAX = 56;
const FUENTE_NUMERO_MIN = 20;
const FUENTE_CAMPOS_MAX = 40;
const FUENTE_CAMPOS_MIN = 11;

@Injectable()
export class RotuloPdfService {
  async generar(rotulo: RotuloParaPdf): Promise<Buffer> {
    const qrData = this.textoLegibleParaQr(rotulo);
    const qrPng = await QRCode.toBuffer(qrData, {
      type: 'png',
      margin: 1,
      width: 400,
      errorCorrectionLevel: 'M',
    });

    const doc = new PDFDocument({ size: 'A5', layout: 'landscape', margin: MARGEN });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    const listo = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    const anchoPagina = doc.page.width;
    const altoPagina = doc.page.height;
    const anchoUtil = anchoPagina - MARGEN * 2;
    const colIzqAncho = anchoUtil * 0.6;
    const colDerX = MARGEN + colIzqAncho + 20;
    const colDerAncho = anchoPagina - MARGEN - colDerX;

    // Empresa: solo de referencia, no le saca espacio a los datos.
    doc.fontSize(9).font('Helvetica').text(EMPRESA.razonSocial, MARGEN, MARGEN, { width: colIzqAncho });

    if (rotulo.titulo) {
      doc.fontSize(12).font('Helvetica-Bold').text(rotulo.titulo, MARGEN, doc.y + 4, { width: colIzqAncho });
    }

    // El número es el dato que más se necesita leer rápido de lejos:
    // se agranda hasta el máximo que entra en el ancho de la columna.
    let fontSizeNumero = FUENTE_NUMERO_MAX;
    while (
      fontSizeNumero > FUENTE_NUMERO_MIN &&
      doc.font('Helvetica-Bold').fontSize(fontSizeNumero).widthOfString(rotulo.numero) > colIzqAncho
    ) {
      fontSizeNumero -= 2;
    }
    doc.fontSize(fontSizeNumero).text(rotulo.numero, MARGEN, doc.y + 6, { width: colIzqAncho });

    let ejeY = doc.y + 10;
    doc.moveTo(MARGEN, ejeY).lineTo(MARGEN + colIzqAncho, ejeY).stroke();
    ejeY += 12;

    // Los campos se agrandan todo lo posible dentro del espacio
    // vertical que queda. Se mide de verdad (con wrap incluido) en vez
    // de estimar, porque un valor largo (p.ej. el producto) puede
    // ocupar más de una línea aunque la letra no sea tan grande.
    const alturaDisponible = altoPagina - MARGEN - ejeY;
    let fontSizeCampos = FUENTE_CAMPOS_MAX;
    let alturaUsada = this.alturaCampos(doc, rotulo.campos, fontSizeCampos, colIzqAncho);
    while (fontSizeCampos > FUENTE_CAMPOS_MIN && alturaUsada > alturaDisponible) {
      fontSizeCampos -= 1;
      alturaUsada = this.alturaCampos(doc, rotulo.campos, fontSizeCampos, colIzqAncho);
    }

    // El corte a números enteros de fuente casi nunca llena el espacio
    // disponible al 100% (una línea de más o de menos por el wrap del
    // texto más largo puede dejar un salto grande entre dos tamaños).
    // En vez de dejar ese resto como espacio muerto al final, se
    // reparte como aire extra entre los campos para aprovechar toda
    // la columna.
    const espacioExtra = rotulo.campos.length > 0 ? Math.max(0, alturaDisponible - alturaUsada) / rotulo.campos.length : 0;

    for (const campo of rotulo.campos) {
      doc.fontSize(fontSizeCampos).font('Helvetica-Bold').text(`${campo.label}: `, MARGEN, ejeY, {
        continued: true,
        width: colIzqAncho,
      });
      doc.font('Helvetica').text(campo.valor, { width: colIzqAncho });
      ejeY = doc.y + fontSizeCampos * 0.35 + espacioExtra;
    }

    // Columna derecha: QR, centrado verticalmente en la página.
    const qrTam = Math.min(colDerAncho, altoPagina - MARGEN * 2);
    const qrY = (altoPagina - qrTam) / 2;
    doc.image(qrPng, colDerX, qrY, { width: qrTam, height: qrTam });

    doc.end();
    return listo;
  }

  private textoLegibleParaQr(rotulo: RotuloParaPdf): string {
    const encabezado = [rotulo.titulo, rotulo.numero].filter(Boolean).join(' ');
    const lineas = rotulo.campos.map((campo) => `${campo.label}: ${campo.valor}`);
    return [encabezado, ...lineas].join('\n');
  }

  private alturaCampos(doc: PDFKit.PDFDocument, campos: CampoRotulo[], fontSize: number, ancho: number): number {
    doc.font('Helvetica-Bold').fontSize(fontSize);
    let total = 0;
    for (const campo of campos) {
      total += doc.heightOfString(`${campo.label}: ${campo.valor}`, { width: ancho });
      total += fontSize * 0.35;
    }
    return total;
  }
}
