/** Punto [lat, lng] en grados. */
export type Punto = [number, number];

const RADIO_TIERRA_M = 6_371_000;
const aRadianes = (grados: number): number => (grados * Math.PI) / 180;

/** Distancia en metros entre dos puntos (fórmula de haversine). */
export function distanciaMetros([lat1, lng1]: Punto, [lat2, lng2]: Punto): number {
  const dLat = aRadianes(lat2 - lat1);
  const dLng = aRadianes(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aRadianes(lat1)) * Math.cos(aRadianes(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * RADIO_TIERRA_M * Math.asin(Math.sqrt(a));
}

/** Indica si el punto cae dentro del polígono (algoritmo de ray casting). */
export function puntoEnPoligono([lat, lng]: Punto, poligono: readonly Punto[]): boolean {
  let adentro = false;
  for (let i = 0, j = poligono.length - 1; i < poligono.length; j = i++) {
    const [latI, lngI] = poligono[i]!;
    const [latJ, lngJ] = poligono[j]!;
    const cruza =
      lngI > lng !== lngJ > lng && lat < ((latJ - latI) * (lng - lngI)) / (lngJ - lngI) + latI;
    if (cruza) adentro = !adentro;
  }
  return adentro;
}

/**
 * Distancia en metros del punto al recorrido (línea de A a B, con quiebres).
 * Proyecta en un plano local: el error es despreciable a escala de una ciudad.
 */
export function distanciaARecorridoMetros([lat, lng]: Punto, recorrido: readonly Punto[]): number {
  const escalaLng = Math.cos(aRadianes(lat));
  const aMetros = ([latP, lngP]: Punto): [number, number] => [
    aRadianes(lngP - lng) * escalaLng * RADIO_TIERRA_M,
    aRadianes(latP - lat) * RADIO_TIERRA_M,
  ];
  let minima = Infinity;
  for (let i = 0; i < recorrido.length; i++) {
    const [ax, ay] = aMetros(recorrido[i]!);
    const [bx, by] = aMetros(recorrido[Math.min(i + 1, recorrido.length - 1)]!);
    // Punto del tramo AB más cercano al origen (que es el punto consultado).
    const dx = bx - ax;
    const dy = by - ay;
    const largo2 = dx * dx + dy * dy;
    const t = largo2 === 0 ? 0 : Math.min(1, Math.max(0, -(ax * dx + ay * dy) / largo2));
    minima = Math.min(minima, Math.hypot(ax + t * dx, ay + t * dy));
  }
  return minima;
}

/** Distancia máxima a la línea de una ruta para sugerirla al guardar la ubicación de un comercio. */
export const RADIO_RUTA_M = 50;

/**
 * Qué tan bien le corresponde el punto a una zona o ruta, para sugerirla por GPS.
 * Ruta: la distancia a la línea, si está a menos de RADIO_RUTA_M. Zona: Infinity si cae adentro
 * (una ruta cercana es más precisa que el área que la contiene). null si no le corresponde.
 */
export function cercaniaAZona(
  punto: Punto,
  zona: { tipo: 'ZONA' | 'RUTA'; puntos: readonly Punto[] },
): number | null {
  if (zona.tipo === 'ZONA') return puntoEnPoligono(punto, zona.puntos) ? Infinity : null;
  const distancia = distanciaARecorridoMetros(punto, zona.puntos);
  return distancia <= RADIO_RUTA_M ? distancia : null;
}

/** Radio dentro del cual dos comercios se consideran posiblemente el mismo. */
export const RADIO_DUPLICADO_M = 30;
