'use client';

import 'leaflet/dist/leaflet.css';
import type { Punto, TipoZona } from '@tcshop/shared';
import type * as Leaflet from 'leaflet';
import { useEffect, useState, type RefObject } from 'react';

export type L = typeof Leaflet;

/** Centro de San Miguel de Tucumán (plaza Independencia). */
export const CENTRO_TUCUMAN: [number, number] = [-26.8306, -65.2038];

/**
 * Crea un mapa de Leaflet con OpenStreetMap (sin API key) dentro del contenedor.
 * Leaflet usa `window` al cargarse, por eso se importa recién en el navegador.
 */
export function useMapa(contenedor: RefObject<HTMLDivElement | null>) {
  const [mapa, setMapa] = useState<{ L: L; mapa: Leaflet.Map } | null>(null);

  useEffect(() => {
    let creado: Leaflet.Map | undefined;
    let cancelado = false;
    void import('leaflet').then((modulo) => {
      const L = (modulo as unknown as { default?: L }).default ?? modulo;
      if (cancelado || !contenedor.current) return;
      // zoomSnap fino: así las zonas llenan el mapa en vez de quedar chicas por redondeo.
      creado = L.map(contenedor.current, { zoomSnap: 0.25 }).setView([-26.826, -65.222], 14);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(creado);
      setMapa({ L, mapa: creado });
    });
    return () => {
      cancelado = true;
      creado?.remove();
    };
  }, [contenedor]);

  return mapa;
}

/** Colores fijos (Leaflet dibuja en SVG y no lee las variables CSS del tema). */
export const COLORES_MAPA = {
  zona: '#0b5cd5',
  ALTO: '#15803d',
  MEDIO: '#d97706',
  BAJO: '#6b7280',
  SIN_DATO: '#7c3aed',
} as const;

/** Lo que dibuja `dibujarZona`: un polígono (zona) o una línea (ruta). */
export type FormaZona = Leaflet.Polyline<
  GeoJSON.LineString | GeoJSON.MultiLineString | GeoJSON.Polygon | GeoJSON.MultiPolygon
>;

/**
 * Dibuja una zona como área o una ruta como línea gruesa.
 * `tenue` es para referencia (otras zonas en el editor, zonas dadas de baja): sin clics.
 */
export function dibujarZona(
  L: L,
  zona: { tipo: TipoZona; puntos: Punto[] },
  { color, tenue = false }: { color: string; tenue?: boolean },
): FormaZona {
  if (zona.tipo === 'RUTA') {
    return L.polyline(zona.puntos, {
      color,
      weight: tenue ? 4 : 7,
      opacity: tenue ? 0.45 : 0.85,
      interactive: !tenue,
    });
  }
  return L.polygon(zona.puntos, {
    color,
    weight: tenue ? 1 : 3,
    fillOpacity: tenue ? 0.04 : 0.1,
    interactive: !tenue,
  });
}
