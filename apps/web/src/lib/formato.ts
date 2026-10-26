import type { Comercio } from './tipos';

const CIUDAD = 'San Miguel de Tucumán, Tucumán';

/** Link a Google Maps: por coordenadas si las hay, si no por dirección. */
export function linkMaps(comercio: Pick<Comercio, 'lat' | 'lng' | 'direccion'>): string | null {
  if (comercio.lat !== null && comercio.lng !== null) {
    return `https://www.google.com/maps/search/?api=1&query=${comercio.lat},${comercio.lng}`;
  }
  if (comercio.direccion) {
    const consulta = encodeURIComponent(`${comercio.direccion}, ${CIUDAD}`);
    return `https://www.google.com/maps/search/?api=1&query=${consulta}`;
  }
  return null;
}

export const tituloComercio = (comercio: Pick<Comercio, 'nombre' | 'direccion'>): string =>
  comercio.nombre ?? comercio.direccion ?? 'Sin nombre';

/** "2026-11-05" → "jue 5 nov". */
export function fechaCorta(fecha: string): string {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  return new Date(anio!, mes! - 1, dia!).toLocaleDateString('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

/** Fecha y hora de una visita en hora local. */
export function fechaHora(iso: string): string {
  return new Date(iso).toLocaleString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Fecha de hoy en el celular, como AAAA-MM-DD. */
export function hoyLocal(): string {
  const ahora = new Date();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  return `${ahora.getFullYear()}-${mes}-${dia}`;
}
