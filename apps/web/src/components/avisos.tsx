'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

type Tipo = 'exito' | 'error';
interface Aviso {
  id: number;
  texto: string;
  tipo: Tipo;
}

const Contexto = createContext<(texto: string, tipo?: Tipo) => void>(() => {});

/** Mensajes breves que aparecen arriba de la navegación y se van solos. */
export function ProveedorAvisos({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);

  const avisar = useCallback((texto: string, tipo: Tipo = 'exito') => {
    const id = Date.now() + Math.random();
    setAvisos((actuales) => [...actuales, { id, texto, tipo }]);
    setTimeout(() => setAvisos((actuales) => actuales.filter((a) => a.id !== id)), 3500);
  }, []);

  return (
    <Contexto.Provider value={avisar}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-50 flex flex-col items-center gap-2 px-4"
      >
        {avisos.map((aviso) => (
          <p
            key={aviso.id}
            className={`max-w-md rounded-xl px-4 py-3 text-base font-bold shadow-lg ${
              aviso.tipo === 'exito' ? 'bg-exito text-fondo' : 'bg-peligro text-fondo'
            }`}
          >
            {aviso.texto}
          </p>
        ))}
      </div>
    </Contexto.Provider>
  );
}

export const useAvisos = () => useContext(Contexto);
