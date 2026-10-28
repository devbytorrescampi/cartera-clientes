'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { ProveedorAvisos } from '@/components/avisos';
import { ProveedorSesion, useUsuario } from '@/components/sesion';
import { MensajeError, unir } from '@/components/ui';

const SECCIONES = [
  { ruta: '/admin/comercios', texto: 'Comercios' },
  { ruta: '/admin/usuarios', texto: 'Usuarios' },
] as const;

/** Panel de administración, pensado para la computadora: menú al costado y tablas anchas. */
export default function LayoutAdmin({ children }: { children: ReactNode }) {
  return (
    <ProveedorSesion>
      <ProveedorAvisos>
        <SoloAdmin>{children}</SoloAdmin>
      </ProveedorAvisos>
    </ProveedorSesion>
  );
}

function SoloAdmin({ children }: { children: ReactNode }) {
  const usuario = useUsuario();
  const ruta = usePathname();

  // La API igual rechaza todo lo de admin; esto solo evita mostrar un panel vacío.
  if (usuario.rol !== 'ADMIN') {
    return (
      <main className="mx-auto flex max-w-lg flex-col gap-4 p-4">
        <MensajeError>El panel de administración es solo para el administrador.</MensajeError>
        <Link href="/cargar" className="font-bold text-primario underline">
          Volver a la app
        </Link>
      </main>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <aside className="flex shrink-0 flex-col gap-1 border-b-2 border-superficie-2 bg-superficie p-3 md:w-56 md:border-r-2 md:border-b-0">
        <p className="px-3 pb-2 text-lg font-bold">Administración</p>
        <nav className="flex gap-1 md:flex-col">
          {SECCIONES.map(({ ruta: destino, texto }) => (
            <Link
              key={destino}
              href={destino}
              aria-current={ruta.startsWith(destino) ? 'page' : undefined}
              className={unir(
                'rounded-lg px-3 py-2 font-semibold',
                ruta.startsWith(destino)
                  ? 'bg-primario text-primario-texto'
                  : 'hover:bg-superficie-2',
              )}
            >
              {texto}
            </Link>
          ))}
        </nav>
        <div className="mt-auto hidden flex-col gap-1 pt-6 text-sm md:flex">
          <span className="px-3 text-texto-suave">{usuario.nombre}</span>
          <Link href="/cargar" className="rounded-lg px-3 py-2 font-semibold hover:bg-superficie-2">
            ← Volver a la app
          </Link>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
    </div>
  );
}
