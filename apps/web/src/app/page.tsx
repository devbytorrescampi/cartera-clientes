'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ETIQUETAS } from '@tcshop/shared';
import { api, ErrorApi, type UsuarioSesion } from '@/lib/api';

// Pantalla provisoria de la fase 1: confirma que la sesión funciona de punta a punta.
export default function Inicio() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<UsuarioSesion>('/auth/me')
      .then(setUsuario)
      .catch((e: unknown) => {
        if (e instanceof ErrorApi && e.estado === 401) router.replace('/login');
        else setError('No se pudo conectar con la API.');
      });
  }, [router]);

  async function salir() {
    await api('/auth/logout', { method: 'POST' });
    router.replace('/login');
  }

  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <h1 className="mb-4 text-2xl font-bold">Relevamiento TCShop</h1>
      {error && <p className="text-peligro">{error}</p>}
      {usuario && (
        <div className="rounded-xl bg-superficie p-4">
          <p className="text-lg font-medium">{usuario.nombre}</p>
          <p className="text-texto-suave">
            {usuario.email} · {ETIQUETAS.rol[usuario.rol]}
          </p>
          <button
            onClick={salir}
            className="mt-4 h-12 w-full rounded-xl border-2 border-borde font-bold"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </main>
  );
}
