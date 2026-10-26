'use client';

import { ETIQUETAS } from '@tcshop/shared';
import { useState, type FormEvent } from 'react';
import { useAvisos } from '@/components/avisos';
import { Encabezado } from '@/components/encabezado';
import { InstalarApp } from '@/components/instalar-app';
import { useUsuario } from '@/components/sesion';
import { Boton, Campo, Chips, MensajeError } from '@/components/ui';
import { CLAVES, guardarLocal, leerLocal } from '@/lib/almacen-local';
import { enviar, mensajeDeError } from '@/lib/api';

const TEMAS = { sistema: 'Como el celular', claro: 'Claro', oscuro: 'Oscuro' } as const;
type Tema = keyof typeof TEMAS;

export default function PaginaCuenta() {
  const usuario = useUsuario();
  const avisar = useAvisos();
  const [tema, setTema] = useState<Tema>(() => {
    const guardado = leerLocal(CLAVES.tema);
    return guardado === 'claro' || guardado === 'oscuro' ? guardado : 'sistema';
  });
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  function elegirTema(nuevo: Tema) {
    setTema(nuevo);
    if (nuevo === 'sistema') {
      guardarLocal(CLAVES.tema, null);
      delete document.documentElement.dataset.tema;
    } else {
      guardarLocal(CLAVES.tema, nuevo);
      document.documentElement.dataset.tema = nuevo;
    }
  }

  async function cambiarPassword(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const datos = new FormData(formulario);
    const nueva = String(datos.get('nueva'));
    if (nueva !== datos.get('repetir')) return setError('Las contraseñas nuevas no coinciden.');
    setError(null);
    setGuardando(true);
    try {
      await enviar('POST', '/auth/password', { actual: datos.get('actual'), nueva });
      formulario.reset();
      avisar('Contraseña cambiada. Se cerraron las otras sesiones.');
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setGuardando(false);
    }
  }

  async function salir() {
    await enviar('POST', '/auth/logout').catch(() => undefined);
    // Recarga completa a propósito: descarta todo el estado de la sesión anterior.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = '/login';
  }

  return (
    <>
      <Encabezado titulo="Mi cuenta" />
      <main className="mx-auto flex max-w-lg flex-col gap-6 p-4">
        <section className="rounded-xl bg-superficie p-4">
          <p className="text-lg font-bold">{usuario.nombre}</p>
          <p className="text-texto-suave">
            {usuario.email} · {ETIQUETAS.rol[usuario.rol]}
          </p>
        </section>

        <InstalarApp />

        <Chips
          etiqueta="Tema"
          obligatorio
          opciones={TEMAS}
          valor={tema}
          onCambio={(t) => t && elegirTema(t)}
        />

        <form onSubmit={cambiarPassword} className="flex flex-col gap-4">
          <h2 className="text-xl font-bold">Cambiar contraseña</h2>
          <Campo
            etiqueta="Contraseña actual"
            name="actual"
            type="password"
            autoComplete="current-password"
            required
          />
          <Campo
            etiqueta="Contraseña nueva"
            name="nueva"
            type="password"
            autoComplete="new-password"
            minLength={12}
            required
            ayuda="Mínimo 12 caracteres."
          />
          <Campo
            etiqueta="Repetir la nueva"
            name="repetir"
            type="password"
            autoComplete="new-password"
            minLength={12}
            required
          />
          <MensajeError>{error}</MensajeError>
          <Boton type="submit" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Cambiar contraseña'}
          </Boton>
        </form>

        <Boton variante="peligro" onClick={salir}>
          Cerrar sesión
        </Boton>
      </main>
    </>
  );
}
