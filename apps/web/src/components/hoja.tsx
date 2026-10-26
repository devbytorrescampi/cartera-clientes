'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { IconoCerrar } from './iconos';

/** Panel que sube desde abajo (cómodo con una mano). Usa <dialog> para el foco y la tecla Esc. */
export function Hoja({
  abierta,
  titulo,
  onCerrar,
  children,
}: {
  abierta: boolean;
  titulo: string;
  onCerrar: () => void;
  children: ReactNode;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    if (abierta && !d.open) d.showModal();
    if (!abierta && d.open) d.close();
  }, [abierta]);

  return (
    <dialog
      ref={dialogo}
      onClose={onCerrar}
      onClick={(e) => e.target === dialogo.current && onCerrar()}
      className="m-0 mt-auto max-h-[85dvh] w-full max-w-none rounded-t-2xl bg-fondo p-0 text-texto backdrop:bg-black/60 sm:mx-auto sm:max-w-lg"
    >
      <div className="sticky top-0 flex items-center justify-between border-b border-superficie-2 bg-fondo px-4 py-2">
        <h2 className="text-lg font-bold">{titulo}</h2>
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar"
          className="flex size-12 items-center justify-center rounded-full"
        >
          <IconoCerrar />
        </button>
      </div>
      <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">{children}</div>
    </dialog>
  );
}
