'use client';

import { useState } from 'react';
import { Hoja } from './hoja';
import { IconoCambiar } from './iconos';
import { useZonas } from './zonas';
import { unir } from './ui';

/** Barra con la zona actual. Un toque abre la lista para cambiarla. */
export function SelectorZona() {
  const { zonas, zonaActual, elegirZona } = useZonas();
  const [abierta, setAbierta] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierta(true)}
        className="flex min-h-12 w-full items-center gap-2 bg-primario px-4 text-left text-primario-texto"
      >
        <span className="flex-1 truncate text-base font-bold">
          {zonaActual ? zonaActual.nombre : 'Elegí una zona o ruta'}
        </span>
        <span className="flex items-center gap-1 text-sm font-semibold">
          Cambiar <IconoCambiar width={20} height={20} />
        </span>
      </button>
      <Hoja abierta={abierta} titulo="Dónde estás cargando" onCerrar={() => setAbierta(false)}>
        <ul className="flex flex-col gap-2">
          {zonas.map((zona) => (
            <li key={zona.id}>
              <button
                type="button"
                onClick={() => {
                  elegirZona(zona.id);
                  setAbierta(false);
                }}
                className={unir(
                  'w-full rounded-xl border-2 p-3 text-left',
                  zona.id === zonaActual?.id ? 'border-primario' : 'border-borde',
                )}
              >
                <span className="block text-lg font-bold">{zona.nombre}</span>
                <span className="block text-sm text-texto-suave">{zona.descripcion}</span>
                {zona.nota && <span className="mt-1 block text-sm font-semibold">{zona.nota}</span>}
              </button>
            </li>
          ))}
        </ul>
      </Hoja>
    </>
  );
}
