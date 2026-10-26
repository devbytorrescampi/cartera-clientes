'use client';

import type { Punto } from '@tcshop/shared';
import { useEffect, useRef } from 'react';
import type { Zona } from '@/lib/tipos';
import { COLORES_MAPA, useMapa } from './mapa-base';
import { Boton } from './ui';

/**
 * Editor de las esquinas de una zona sobre el mapa:
 * tocar el mapa agrega una esquina al final; arrastrar un número la mueve.
 * Las demás zonas se ven tenues como referencia.
 */
export function EditorPoligono({
  esquinas,
  onCambio,
  otrasZonas,
}: {
  esquinas: Punto[];
  onCambio: (esquinas: Punto[]) => void;
  otrasZonas: Zona[];
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const listo = useMapa(contenedor);
  // El manejador del clic se registra una vez; lee siempre las esquinas actuales desde acá.
  const actuales = useRef({ esquinas, onCambio });
  useEffect(() => {
    actuales.current = { esquinas, onCambio };
  });
  const encuadrado = useRef(false);

  useEffect(() => {
    if (!listo) return;
    const alTocar = (e: { latlng: { lat: number; lng: number } }) => {
      const { esquinas: lista, onCambio: cambiar } = actuales.current;
      cambiar([...lista, [redondear(e.latlng.lat), redondear(e.latlng.lng)]]);
    };
    listo.mapa.on('click', alTocar);
    return () => {
      listo.mapa.off('click', alTocar);
    };
  }, [listo]);

  useEffect(() => {
    if (!listo) return;
    const { L, mapa } = listo;
    const grupo = L.layerGroup().addTo(mapa);

    for (const zona of otrasZonas) {
      L.polygon(zona.poligono, {
        color: COLORES_MAPA.BAJO,
        weight: 1,
        fillOpacity: 0.04,
        interactive: false,
      }).addTo(grupo);
    }
    if (esquinas.length >= 2) {
      L.polygon(esquinas, { color: COLORES_MAPA.zona, weight: 3, fillOpacity: 0.12 }).addTo(grupo);
    }
    esquinas.forEach((esquina, indice) => {
      const marcador = L.marker(esquina, {
        draggable: true,
        icon: L.divIcon({
          className: '',
          html: `<span class="vertice">${indice + 1}</span>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        }),
      }).addTo(grupo);
      marcador.on('dragend', () => {
        const { lat, lng } = marcador.getLatLng();
        const copia = [...actuales.current.esquinas];
        copia[indice] = [redondear(lat), redondear(lng)];
        actuales.current.onCambio(copia);
      });
    });

    if (!encuadrado.current) {
      const referencia = esquinas.length > 0 ? esquinas : otrasZonas.flatMap((z) => z.poligono);
      if (referencia.length > 0) mapa.fitBounds(L.latLngBounds(referencia), { padding: [24, 24] });
      encuadrado.current = true;
    }

    return () => {
      grupo.remove();
    };
  }, [listo, esquinas, otrasZonas]);

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={contenedor}
        role="region"
        aria-label="Editor de esquinas de la zona"
        className="mapa h-[50dvh] min-h-72 w-full rounded-2xl border-2 border-superficie-2"
      />
      <p className="text-sm text-texto-suave">
        Tocá el mapa para agregar una esquina. Arrastrá un número para moverla.
      </p>
      {esquinas.length > 0 && (
        <ol className="flex flex-col gap-2">
          {esquinas.map(([lat, lng], indice) => (
            <li
              key={`${indice}-${lat}-${lng}`}
              className="flex items-center gap-2 rounded-xl bg-superficie p-2 pl-3"
            >
              <span className="vertice shrink-0">{indice + 1}</span>
              <span className="flex-1 font-mono text-sm">
                {lat.toFixed(5)}, {lng.toFixed(5)}
              </span>
              <Boton
                variante="fantasma"
                className="px-3"
                onClick={() => onCambio(esquinas.filter((_, i) => i !== indice))}
              >
                Quitar
              </Boton>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

const redondear = (valor: number) => Number(valor.toFixed(6));
