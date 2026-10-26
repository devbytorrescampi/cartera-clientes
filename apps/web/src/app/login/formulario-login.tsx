'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { api, ErrorApi } from '@/lib/api';
import { rutaInternaSegura } from '@/lib/redireccion';

export function FormularioLogin() {
  const router = useRouter();
  const parametros = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function ingresar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    setError(null);
    setEnviando(true);
    try {
      await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: datos.get('email'), password: datos.get('password') }),
      });
      router.replace(rutaInternaSegura(parametros.get('next')));
      router.refresh();
    } catch (e) {
      setError(
        e instanceof ErrorApi && e.estado === 429
          ? 'Demasiados intentos. Esperá un minuto y probá de nuevo.'
          : e instanceof ErrorApi && e.estado === 401
            ? 'Email o contraseña incorrectos.'
            : 'No se pudo conectar. Revisá la señal y probá de nuevo.',
      );
      setEnviando(false);
    }
  }

  const campo =
    'h-14 w-full rounded-xl border-2 border-borde bg-fondo px-4 text-lg outline-none focus:border-primario';

  return (
    <form onSubmit={ingresar} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 font-medium">
        Email
        <input name="email" type="email" autoComplete="username" required className={campo} />
      </label>
      <label className="flex flex-col gap-1 font-medium">
        Contraseña
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={campo}
        />
      </label>
      {error && (
        <p role="alert" className="font-medium text-peligro">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={enviando}
        className="mt-2 h-14 rounded-xl bg-primario text-lg font-bold text-primario-texto disabled:opacity-60"
      >
        {enviando ? 'Ingresando…' : 'Ingresar'}
      </button>
    </form>
  );
}
