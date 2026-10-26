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

/** Radio dentro del cual dos comercios se consideran posiblemente el mismo. */
export const RADIO_DUPLICADO_M = 30;
