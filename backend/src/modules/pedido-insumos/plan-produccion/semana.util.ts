// Fechas de plan_produccion/item_plan_produccion/dia_no_laborable
// llegan desde Prisma como Date en medianoche UTC (@db.Date) — todo acá
// opera en UTC a propósito, para no correrse de día según el huso
// horario del server (mismo criterio que formatearFechaAR).

// Lunes de la semana de `fecha`, a medianoche UTC.
export function lunesDe(fecha: Date): Date {
  const dia = fecha.getUTCDay(); // 0=domingo … 6=sábado
  const diff = dia === 0 ? -6 : 1 - dia;
  const lunes = new Date(fecha);
  lunes.setUTCDate(lunes.getUTCDate() + diff);
  lunes.setUTCHours(0, 0, 0, 0);
  return lunes;
}

// Lunes a viernes, como fechas UTC-medianoche.
export function esDiaHabil(fecha: Date): boolean {
  const dia = fecha.getUTCDay();
  return dia >= 1 && dia <= 5;
}

// Argentina es UTC-3 fijo (sin horario de verano). "Hoy" para este
// negocio es el día calendario en Argentina, no el del server ni el de
// UTC — si se calculara con new Date() + setUTCHours a secas, entre
// las 21:00 y medianoche hora Argentina (cuando en UTC ya es el día
// siguiente) un día de hoy quedaría mal marcado como pasado.
const OFFSET_ARGENTINA_MS = 3 * 60 * 60 * 1000;

function hoyArgentina(): Date {
  const ahora = new Date(Date.now() - OFFSET_ARGENTINA_MS);
  ahora.setUTCHours(0, 0, 0, 0);
  return ahora;
}

// Editable si es hoy o una fecha futura (nunca un día ya pasado),
// comparando solo la parte de fecha (no hora), en el día calendario
// de Argentina.
export function esEditable(fecha: Date): boolean {
  const soloFecha = new Date(fecha);
  soloFecha.setUTCHours(0, 0, 0, 0);
  return soloFecha.getTime() >= hoyArgentina().getTime();
}

export function diasDeLaSemana(lunes: Date): Date[] {
  return Array.from({ length: 5 }, (_, i) => {
    const dia = new Date(lunes);
    dia.setUTCDate(dia.getUTCDate() + i);
    return dia;
  });
}
