'use client';

import type { Punto, TipoZona } from '@tcshop/shared';
import { useEffect, useRef } from 'react';
import type { Zona } from '@/lib/tipos';
import { COLORES_MAPA, dibujarZona, useMapa } from './mapa-base';
import { Boton } from './ui';

/**
 * Editor de una zona o ruta sobre el mapa: tocar el mapa agrega un punto al final y arrastrar
 * uno lo mueve. Una zona se cierra como área (esquinas 1, 2, 3…); una ruta queda como línea de
 * A a B, con los quiebres numerados. Las demás zonas y rutas se ven tenues como referencia.
 */
export function EditorZona({
  tipo,
  puntos,
  onCambio,
  otrasZonas,
}: {
  tipo: TipoZona;
  puntos: Punto[];
  onCambio: (puntos: Punto[]) => void;
  otrasZonas: Zona[];
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const listo = useMapa(contenedor);
  // El manejador del clic se registra una vez; lee siempre los puntos actuales desde acá.
  const actuales = useRef({ puntos, onCambio });
  useEffect(() => {
    actuales.current = { puntos, onCambio };
  });
  const encuadrado = useRef(false);

  useEffect(() => {
    if (!listo) return;
    const alTocar = (e: { latlng: { lat: number; lng: number } }) => {
      const { puntos: lista, onCambio: cambiar } = actuales.current;
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
      dibujarZona(L, zona, { color: COLORES_MAPA.BAJO, tenue: true }).addTo(grupo);
    }
    if (puntos.length >= 2) {
      dibujarZona(L, { tipo, puntos }, { color: COLORES_MAPA.zona }).addTo(grupo);
    }
    puntos.forEach((punto, indice) => {
      const marcador = L.marker(punto, {
        draggable: true,
        icon: L.divIcon({
          className: '',
          html: `<span class="vertice">${nombrePunto(tipo, indice, puntos.length)}</span>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        }),
      }).addTo(grupo);
      marcador.on('dragend', () => {
        const { lat, lng } = marcador.getLatLng();
        const copia = [...actuales.current.puntos];
        copia[indice] = [redondear(lat), redondear(lng)];
        actuales.current.onCambio(copia);
      });
    });

    if (!encuadrado.current) {
      const referencia = puntos.length > 0 ? puntos : otrasZonas.flatMap((z) => z.puntos);
      if (referencia.length > 0) mapa.fitBounds(L.latLngBounds(referencia), { padding: [24, 24] });
      encuadrado.current = true;
    }

    return () => {
      grupo.remove();
    };
  }, [listo, tipo, puntos, otrasZonas]);

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={contenedor}
        role="region"
        aria-label={
          tipo === 'RUTA' ? 'Editor del recorrido de la ruta' : 'Editor de las esquinas de la zona'
        }
        className="mapa h-[50dvh] min-h-72 w-full rounded-2xl border-2 border-superficie-2"
      />
      <p className="text-sm text-texto-suave">
        {tipo === 'RUTA'
          ? 'Tocá el mapa en el inicio (A) y en el final (B). Si la calle dobla, tocá también en cada quiebre, en orden.'
          : 'Tocá el mapa en cada esquina de la zona, en orden alrededor del área.'}{' '}
        Arrastrá un punto para moverlo.
      </p>
      {puntos.length > 0 && (
        <ol className="flex flex-col gap-2">
          {puntos.map(([lat, lng], indice) => (
            <li
              key={`${indice}-${lat}-${lng}`}
              className="flex items-center gap-2 rounded-xl bg-superficie p-2 pl-3"
            >
              <span className="vertice shrink-0">{nombrePunto(tipo, indice, puntos.length)}</span>
              <span className="flex-1 font-mono text-sm">
                {lat.toFixed(5)}, {lng.toFixed(5)}
              </span>
              <Boton
                variante="fantasma"
                className="px-3"
                onClick={() => onCambio(puntos.filter((_, i) => i !== indice))}
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

/**
 * Zona: esquinas 1, 2, 3… Ruta: A el primero, B el último (desde que hay dos)
 * y números los quiebres del medio.
 */
function nombrePunto(tipo: TipoZona, indice: number, total: number): string {
  if (tipo === 'ZONA') return String(indice + 1);
  return indice === 0 ? 'A' : indice === total - 1 ? 'B' : String(indice);
}
