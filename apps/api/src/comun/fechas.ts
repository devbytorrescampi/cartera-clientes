// Las fechas sin hora (como volverEl) se guardan como DATE y viajan como "AAAA-MM-DD".
// "Hoy" se calcula en la hora de Argentina, no en la del servidor (Render corre en UTC).

const ZONA_HORARIA = 'America/Argentina/Buenos_Aires';

export function hoyEnArgentina(ahora: Date = new Date()): string {
  // en-CA formatea como AAAA-MM-DD.
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_HORARIA }).format(ahora);
}

export function fechaADate(fecha: string): Date {
  return new Date(`${fecha}T00:00:00.000Z`);
}

export function dateAFecha(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

/** Fecha y hora en Argentina, "AAAA-MM-DD HH:mm". */
export function fechaHoraArgentina(fecha: Date): string {
  // sv-SE formatea como AAAA-MM-DD HH:mm.
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: ZONA_HORARIA,
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(fecha);
}

/** Acepta AAAA-MM-DD y DD/MM/AAAA (como la reescribe Excel). Devuelve AAAA-MM-DD o null. */
export function leerFecha(texto: string): string | null {
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(texto);
  const local = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(texto);
  const partes = iso ? [iso[1], iso[2], iso[3]] : local ? [local[3], local[2], local[1]] : null;
  if (!partes) return null;
  const [anio, mes, dia] = partes.map(Number) as [number, number, number];
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  // Descarta fechas que no existen, como 31/02.
  if (fecha.getUTCFullYear() !== anio || fecha.getUTCMonth() !== mes - 1) return null;
  if (fecha.getUTCDate() !== dia) return null;
  return dateAFecha(fecha);
}

/** Fecha con hora opcional ("AAAA-MM-DD HH:mm" o "DD/MM/AAAA HH:mm"), en hora de Argentina. */
export function leerFechaHora(texto: string): Date | null {
  const partes = /^(\S+)(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/.exec(texto);
  const fecha = partes && leerFecha(partes[1]!);
  if (!partes || !fecha) return null;
  const [hora, minuto, segundo] = [partes[2], partes[3], partes[4]].map((p) => Number(p ?? 0));
  if (hora! > 23 || minuto! > 59 || segundo! > 59) return null;
  const dosDigitos = (n: number) => String(n).padStart(2, '0');
  // Argentina no tiene horario de verano: siempre UTC-3.
  return new Date(
    `${fecha}T${dosDigitos(hora!)}:${dosDigitos(minuto!)}:${dosDigitos(segundo!)}-03:00`,
  );
}
