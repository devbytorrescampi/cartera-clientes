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
