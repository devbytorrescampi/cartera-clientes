'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { UsuarioSesion } from '@/lib/tipos';
import { useApi } from '@/lib/usar-api';
import { Cargando, MensajeError } from './ui';

const Contexto = createContext<UsuarioSesion | null>(null);

/** Carga el usuario de la sesión. Si la sesión venció, `api` ya redirige al login. */
export function ProveedorSesion({ children }: { children: ReactNode }) {
  const { datos: usuario, error } = useApi<UsuarioSesion>('/auth/me');
  if (error) {
    return (
      <main className="p-4">
        <MensajeError>{error}</MensajeError>
      </main>
    );
  }
  if (!usuario) return <Cargando />;
  return <Contexto.Provider value={usuario}>{children}</Contexto.Provider>;
}

export function useUsuario(): UsuarioSesion {
  const usuario = useContext(Contexto);
  if (!usuario) throw new Error('useUsuario fuera de ProveedorSesion');
  return usuario;
}
