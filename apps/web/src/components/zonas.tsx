'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { CLAVES, guardarLocal, leerLocal } from '@/lib/almacen-local';
import type { Zona } from '@/lib/tipos';
import { useApi } from '@/lib/usar-api';

interface ContextoZonas {
  zonas: Zona[];
  zonaActual: Zona | null;
  elegirZona: (id: number) => void;
  recargarZonas: () => void;
}

const Contexto = createContext<ContextoZonas | null>(null);

/** Zonas activas y la zona en la que se está trabajando, recordada entre visitas. */
export function ProveedorZonas({ children }: { children: ReactNode }) {
  const { datos, recargar } = useApi<Zona[]>('/zonas');
  const [idElegido, setIdElegido] = useState<number | null>(() => {
    const guardado = leerLocal(CLAVES.zonaActual);
    return guardado ? Number(guardado) : null;
  });

  const zonas = useMemo(() => datos ?? [], [datos]);
  const zonaActual = zonas.find((z) => z.id === idElegido) ?? zonas[0] ?? null;

  const elegirZona = useCallback((id: number) => {
    setIdElegido(id);
    guardarLocal(CLAVES.zonaActual, String(id));
  }, []);

  const valor = useMemo(
    () => ({ zonas, zonaActual, elegirZona, recargarZonas: recargar }),
    [zonas, zonaActual, elegirZona, recargar],
  );
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useZonas(): ContextoZonas {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error('useZonas fuera de ProveedorZonas');
  return contexto;
}
