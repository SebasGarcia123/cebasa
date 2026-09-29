import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

// Datos fijos de la empresa para el encabezado de cualquier documento
// imprimible (remito, factura, recibo, notas). Es una sola empresa y
// estos datos prácticamente no cambian, así que no amerita una tabla
// de configuración editable por ahora.
export const EMPRESA = {
  razonSocial: 'Celulosa Baradero SA',
  domicilio: 'Marcelo T. de Alvear 4025, Caseros',
  telefono: '4025 4025',
  cuit: '30-64959269-8',
  iva: 'Responsable Inscripto',
};

// assets/ vive en la raíz del backend, junto a uploads/ (ver
// archivo-adjunto.storage.ts, mismo criterio de path relativo).
export const LOGO_PATH = join(
  fileURLToPath(new URL('.', import.meta.url)),
  '../../assets/logo-celulosa-baradero.png',
);

export const MARGEN_IZQ = 40;
export const MARGEN_DER = 555;
export const COL_DERECHA_X = 350;
export const PT_POR_CM = 28.3465;
// Firma y aclaración van, por default, a esta distancia del final de
// la hoja. Si el contenido del documento es largo y eso se pisaría,
// se corren más abajo (o a una hoja nueva) — mismo criterio en cada
// *-pdf.service.ts que use esta constante.
export const FIRMA_DESDE_ABAJO = 4 * PT_POR_CM;

/**
 * Logo + datos de la empresa a la izquierda, título del documento y
 * número a la derecha, arrancando ambos a la misma altura. Devuelve el
 * eje Y (ya con el separador dibujado) desde donde seguir escribiendo
 * el resto del documento.
 */
export function renderEncabezadoEmpresa(
  doc: PDFKit.PDFDocument,
  titulo: string,
  numero: string,
  subtitulo?: string,
): number {
  const anchoDerecha = MARGEN_DER - COL_DERECHA_X;
  const inicioY = doc.y;

  try {
    doc.image(LOGO_PATH, MARGEN_IZQ, inicioY, { width: 140 });
  } catch {
    // Si por algún motivo no está el archivo del logo, el documento se
    // sigue generando igual, solo sin la imagen.
  }

  let ejeY = inicioY + 48;
  doc.fontSize(13).font('Helvetica-Bold').text(EMPRESA.razonSocial, MARGEN_IZQ, ejeY, { width: 260 });
  doc.fontSize(9).font('Helvetica');
  doc.text(EMPRESA.domicilio, MARGEN_IZQ, doc.y, { width: 260 });
  doc.text(`Tel: ${EMPRESA.telefono}`, MARGEN_IZQ, doc.y, { width: 260 });
  doc.text(`CUIT: ${EMPRESA.cuit} — IVA: ${EMPRESA.iva}`, MARGEN_IZQ, doc.y, { width: 260 });
  const finIzquierda = doc.y;

  doc.fontSize(18).font('Helvetica-Bold').text(titulo, COL_DERECHA_X, inicioY, { width: anchoDerecha, align: 'right' });
  doc.fontSize(11).font('Helvetica-Bold').text(`N° ${numero}`, COL_DERECHA_X, doc.y, { width: anchoDerecha, align: 'right' });
  if (subtitulo) {
    doc.fontSize(10).font('Helvetica-Bold').text(subtitulo, COL_DERECHA_X, doc.y, { width: anchoDerecha, align: 'right' });
  }
  const finDerecha = doc.y;

  ejeY = Math.max(finIzquierda, finDerecha) + 12;
  doc.moveTo(MARGEN_IZQ, ejeY).lineTo(MARGEN_DER, ejeY).stroke();
  return ejeY + 16;
}

// Los campos @db.Date llegan desde Prisma como Date en medianoche UTC.
// `toLocaleDateString` los renderiza en la zona horaria local del
// servidor, así que en Argentina (UTC-3) una fecha así muestra el día
// anterior. Se arma el string a mano con los getters UTC para evitar
// ese corrimiento.
export function formatearFechaAR(fecha: Date): string {
  const dia = String(fecha.getUTCDate()).padStart(2, '0');
  const mes = String(fecha.getUTCMonth() + 1).padStart(2, '0');
  return `${dia}/${mes}/${fecha.getUTCFullYear()}`;
}

const UNIDADES = ['', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez',
  'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
const DECENAS = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const CENTENAS = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos',
  'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

function trescientosEnLetras(n: number): string {
  if (n === 0) return '';
  if (n === 100) return 'cien';
  if (n < 20) return UNIDADES[n];
  if (n < 100) {
    const d = Math.floor(n / 10);
    const u = n % 10;
    if (d === 2) return u === 0 ? 'veinte' : `veinti${UNIDADES[u]}`;
    return u === 0 ? DECENAS[d] : `${DECENAS[d]} y ${UNIDADES[u]}`;
  }
  const c = Math.floor(n / 100);
  const resto = n % 100;
  return resto === 0 ? CENTENAS[c] : `${CENTENAS[c]} ${trescientosEnLetras(resto)}`;
}

function enterosEnLetras(n: number): string {
  if (n === 0) return 'cero';
  const millones = Math.floor(n / 1_000_000);
  const miles = Math.floor((n % 1_000_000) / 1000);
  const resto = n % 1000;

  const partes: string[] = [];
  if (millones > 0) {
    partes.push(millones === 1 ? 'un millón' : `${trescientosEnLetras(millones)} millones`);
  }
  if (miles > 0) {
    partes.push(miles === 1 ? 'mil' : `${trescientosEnLetras(miles)} mil`);
  }
  if (resto > 0) {
    partes.push(trescientosEnLetras(resto));
  }
  return partes.join(' ');
}

// Convención argentina para documentos comerciales: el monto va
// expresado en números Y en letras. Devuelve algo como
// "Son pesos: cuatro mil quinientos con 50/100".
export function montoEnLetras(monto: number): string {
  const entero = Math.floor(monto);
  const centavos = Math.round((monto - entero) * 100);
  const letras = enterosEnLetras(entero);
  const capitalizada = letras.charAt(0).toUpperCase() + letras.slice(1);
  return `Son pesos: ${capitalizada} con ${String(centavos).padStart(2, '0')}/100`;
}
