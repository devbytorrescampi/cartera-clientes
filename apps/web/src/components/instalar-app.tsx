'use client';

import { instalar, useInstalacion } from '@/lib/instalacion';
import { useAvisos } from './avisos';
import { Boton } from './ui';

/** Apartado para instalar la web como app en el celular (PWA). */
export function InstalarApp() {
  const estado = useInstalacion();
  const avisar = useAvisos();

  return (
    <section className="flex flex-col gap-3 rounded-xl border-2 border-borde p-4">
      <h2 className="text-xl font-bold">Instalar en Android</h2>

      {estado === 'instalada' && (
        <p className="font-semibold text-exito">Ya estás usando la app instalada.</p>
      )}

      {estado === 'disponible' && (
        <>
          <p>
            Queda un ícono en la pantalla de inicio y se abre a pantalla completa, como cualquier
            app.
          </p>
          <Boton
            onClick={async () => {
              if (await instalar()) avisar('App instalada. Buscala en la pantalla de inicio.');
            }}
          >
            Instalar app
          </Boton>
        </>
      )}

      {estado === 'manual' && (
        <>
          <p>Queda un ícono en la pantalla de inicio y se abre a pantalla completa.</p>
          <ol className="list-decimal pl-5 leading-relaxed">
            <li>Abrí esta página en Chrome.</li>
            <li>
              Tocá el menú <strong>⋮</strong> (arriba a la derecha).
            </li>
            <li>
              Elegí <strong>«Instalar app»</strong> o{' '}
              <strong>«Agregar a la pantalla principal»</strong>.
            </li>
          </ol>
          <p className="text-sm text-texto-suave">
            En iPhone: en Safari, botón Compartir → «Agregar a inicio».
          </p>
        </>
      )}
    </section>
  );
}
