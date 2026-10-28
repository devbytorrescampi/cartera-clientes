'use client';

import { ETIQUETAS } from '@tcshop/shared';
import { useEffect, useRef } from 'react';
import { tituloComercio } from '@/lib/formato';
import type { PuntoMapa, Zona } from '@/lib/tipos';
import { COLORES_MAPA, dibujarZona, useMapa, type FormaZona } from './mapa-base';

/** Contenido de la burbuja de un comercio. Se arma con nodos de texto: el nombre es dato del usuario. */
function burbuja(punto: PuntoMapa): HTMLElement {
  const contenedor = document.createElement('div');
  const enlace = document.createElement('a');
  enlace.href = `/comercios/${punto.id}`;
  enlace.textContent = tituloComercio(punto);
  enlace.style.fontWeight = '700';
  enlace.style.fontSize = '16px';
  const detalle = document.createElement('div');
  detalle.textContent = [
    ETIQUETAS.estado[punto.estado],
    punto.interes && `Interés ${ETIQUETAS.interes[punto.interes].toLowerCase()}`,
  ]
    .filter(Boolean)
    .join(' · ');
  contenedor.append(enlace, detalle);
  return contenedor;
}

/** Mapa con las zonas (áreas), las rutas (líneas) y los comercios como puntos coloreados por interés. */
export function MapaZonas({
  zonas,
  puntos,
  zonaEnfocada,
}: {
  zonas: Zona[];
  puntos: PuntoMapa[];
  zonaEnfocada: number | null;
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const listo = useMapa(contenedor);
  const capas = useRef<Map<number, FormaZona>>(new Map());

  useEffect(() => {
    if (!listo) return;
    const { L, mapa } = listo;
    const grupo = L.layerGroup().addTo(mapa);
    capas.current.clear();
    // Los comercios van en una capa propia por encima de los números de zona,
    // para que ningún punto quede tapado y todos se puedan tocar.
    if (!mapa.getPane('comercios')) mapa.createPane('comercios').style.zIndex = '660';

    for (const zona of zonas) {
      const forma = dibujarZona(L, zona, { color: COLORES_MAPA.zona });
      // Dadas de baja: punteadas y más claras.
      if (!zona.activa) forma.setStyle({ dashArray: '8 8', opacity: 0.4, fillOpacity: 0.02 });
      forma
        .bindTooltip(String(zona.numero), {
          permanent: true,
          direction: 'center',
          className: 'etiqueta-zona',
        })
        .addTo(grupo);
      capas.current.set(zona.id, forma);
    }

    for (const punto of puntos) {
      L.circleMarker([punto.lat, punto.lng], {
        pane: 'comercios',
        radius: 9,
        color: '#ffffff',
        weight: 2,
        fillColor: COLORES_MAPA[punto.interes ?? 'SIN_DATO'],
        fillOpacity: 1,
      })
        .bindPopup(() => burbuja(punto))
        .addTo(grupo);
    }

    // Encuadra todas las zonas la primera vez.
    const todas = zonas.flatMap((z) => z.puntos);
    if (todas.length > 0) mapa.fitBounds(L.latLngBounds(todas), { padding: [16, 16] });

    return () => {
      grupo.remove();
    };
  }, [listo, zonas, puntos]);

  useEffect(() => {
    if (!listo || zonaEnfocada === null) return;
    const forma = capas.current.get(zonaEnfocada);
    if (forma) listo.mapa.fitBounds(forma.getBounds(), { padding: [32, 32], maxZoom: 17 });
  }, [listo, zonaEnfocada]);

  return (
    <div
      ref={contenedor}
      role="region"
      aria-label="Mapa de zonas y comercios"
      className="mapa h-[45dvh] min-h-72 w-full rounded-2xl border-2 border-superficie-2"
    />
  );
}

export function LeyendaMapa() {
  const items = [
    ['Interés alto', COLORES_MAPA.ALTO],
    ['Medio', COLORES_MAPA.MEDIO],
    ['Bajo', COLORES_MAPA.BAJO],
    ['Sin dato', COLORES_MAPA.SIN_DATO],
  ] as const;
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold">
      {items.map(([texto, color]) => (
        <li key={texto} className="flex items-center gap-1.5">
          <span
            className="inline-block size-4 rounded-full border-2 border-white"
            style={{ background: color }}
          />
          {texto}
        </li>
      ))}
    </ul>
  );
}
