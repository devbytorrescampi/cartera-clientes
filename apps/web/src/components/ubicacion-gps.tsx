'use client';

import { useState } from 'react';
import { IconoPin } from './iconos';
import { Boton } from './ui';

export interface Ubicacion {
  lat: number;
  lng: number;
  precisionM: number;
}

const MENSAJES_ERROR: Record<number, string> = {
  1: 'Sin permiso para usar la ubicación. Habilitalo en el navegador.',
  2: 'No se pudo obtener la ubicación. Probá al aire libre.',
  3: 'El GPS tardó demasiado. Probá de nuevo.',
};

/** Botón "Guardar mi ubicación" con la precisión obtenida y opción de quitarla. */
export function UbicacionGps({
  lat,
  lng,
  onCambio,
}: {
  lat: number | null;
  lng: number | null;
  onCambio: (ubicacion: Ubicacion | null) => void;
}) {
  const [buscando, setBuscando] = useState(false);
  const [precision, setPrecision] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function tomarUbicacion() {
    if (!('geolocation' in navigator)) {
      setError('Este navegador no tiene GPS.');
      return;
    }
    setBuscando(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const ubicacion = {
          lat: Number(coords.latitude.toFixed(6)),
          lng: Number(coords.longitude.toFixed(6)),
          precisionM: Math.round(coords.accuracy),
        };
        setPrecision(ubicacion.precisionM);
        setBuscando(false);
        onCambio(ubicacion);
      },
      (e) => {
        setError(MENSAJES_ERROR[e.code] ?? 'No se pudo obtener la ubicación.');
        setBuscando(false);
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    );
  }

  const tieneUbicacion = lat !== null && lng !== null;

  return (
    <div className="flex flex-col gap-2">
      {tieneUbicacion ? (
        <div className="flex items-center gap-1 rounded-xl border-2 border-exito py-1 pl-3">
          <IconoPin className="shrink-0 text-exito" />
          <p className="flex-1 leading-tight font-semibold">
            Ubicación guardada
            {precision !== null && (
              <span className="block text-sm text-texto-suave">Precisión ±{precision} m</span>
            )}
          </p>
          <Boton variante="fantasma" className="px-2" onClick={tomarUbicacion} disabled={buscando}>
            {buscando ? 'Buscando…' : 'Actualizar'}
          </Boton>
          <Boton
            variante="fantasma"
            className="px-2"
            onClick={() => {
              setPrecision(null);
              onCambio(null);
            }}
          >
            Quitar
          </Boton>
        </div>
      ) : (
        <Boton variante="secundario" onClick={tomarUbicacion} disabled={buscando}>
          <IconoPin />
          {buscando ? 'Buscando ubicación…' : 'Guardar mi ubicación'}
        </Boton>
      )}
      {error && <p className="font-medium text-peligro">{error}</p>}
    </div>
  );
}
