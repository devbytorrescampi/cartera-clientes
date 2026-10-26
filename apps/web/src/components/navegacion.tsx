'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import type { ResumenVolver } from '@/lib/tipos';
import { useApi } from '@/lib/usar-api';
import { IconoLista, IconoMapa, IconoMas, IconoReloj } from './iconos';
import { unir } from './ui';

const SECCIONES = [
  { ruta: '/cargar', texto: 'Cargar', Icono: IconoMas },
  { ruta: '/comercios', texto: 'Comercios', Icono: IconoLista },
  { ruta: '/volver', texto: 'Volver', Icono: IconoReloj },
  { ruta: '/zonas', texto: 'Zonas', Icono: IconoMapa },
] as const;

/** Navegación inferior fija con las cuatro secciones y el contador de vencidos. */
export function Navegacion() {
  const ruta = usePathname();
  const { datos: resumen, recargar } = useApi<ResumenVolver>('/comercios/volver/resumen');

  // El contador se actualiza al cambiar de sección (por ejemplo, después de cargar o editar).
  useEffect(() => recargar(), [ruta, recargar]);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-superficie-2 bg-fondo pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto grid max-w-lg grid-cols-4">
        {SECCIONES.map(({ ruta: destino, texto, Icono }) => {
          const activa = ruta === destino || ruta.startsWith(`${destino}/`);
          const vencidos = destino === '/volver' ? (resumen?.vencidos ?? 0) : 0;
          return (
            <li key={destino}>
              <Link
                href={destino}
                aria-current={activa ? 'page' : undefined}
                className={unir(
                  'relative flex min-h-16 flex-col items-center justify-center gap-0.5 text-sm font-semibold',
                  activa ? 'text-primario' : 'text-texto-suave',
                )}
              >
                <Icono width={26} height={26} strokeWidth={activa ? 2.5 : 2} />
                {texto}
                {vencidos > 0 && (
                  <span
                    aria-label={`${vencidos} vencidos`}
                    className="absolute top-1.5 left-1/2 ml-2 min-w-6 rounded-full bg-peligro px-1.5 text-center text-xs leading-6 font-bold text-fondo"
                  >
                    {vencidos}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
