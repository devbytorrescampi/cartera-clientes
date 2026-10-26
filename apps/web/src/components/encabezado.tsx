import Link from 'next/link';
import type { ReactNode } from 'react';
import { IconoUsuario, IconoVolver } from './iconos';

/** Barra superior de cada pantalla, con acceso a la cuenta o botón para volver atrás. */
export function Encabezado({
  titulo,
  atras,
  children,
}: {
  titulo: string;
  atras?: string;
  children?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 border-b-2 border-superficie-2 bg-fondo">
      <div className="mx-auto flex min-h-14 max-w-lg items-center gap-1 px-2">
        {atras && (
          <Link
            href={atras}
            aria-label="Volver"
            className="flex size-12 items-center justify-center"
          >
            <IconoVolver />
          </Link>
        )}
        <h1 className={`flex-1 truncate text-xl font-bold ${atras ? '' : 'pl-2'}`}>{titulo}</h1>
        <Link
          href="/cuenta"
          aria-label="Mi cuenta"
          className="flex size-12 items-center justify-center"
        >
          <IconoUsuario />
        </Link>
      </div>
      {children}
    </header>
  );
}
