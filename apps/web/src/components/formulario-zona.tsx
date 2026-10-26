'use client';

import type { Punto } from '@tcshop/shared';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { enviar, mensajeDeError } from '@/lib/api';
import type { Zona } from '@/lib/tipos';
import { useApi } from '@/lib/usar-api';
import { useAvisos } from './avisos';
import { EditorPoligono } from './editor-poligono';
import { Hoja } from './hoja';
import { useUsuario } from './sesion';
import { AreaTexto, Boton, Campo, Chips, MensajeError } from './ui';
import { useZonas } from './zonas';

const MIN_ESQUINAS = 3;

/** Alta (sin `zona`) o edición de una zona. Solo para el admin. */
export function FormularioZona({ zona }: { zona?: Zona }) {
  const router = useRouter();
  const avisar = useAvisos();
  const usuario = useUsuario();
  const { recargarZonas } = useZonas();
  const todas = useApi<Zona[]>('/zonas?incluirInactivas=true');

  const [numero, setNumero] = useState(zona ? String(zona.numero) : '');
  const [nombre, setNombre] = useState(zona?.nombre ?? '');
  const [limites, setLimites] = useState(zona?.limites ?? '');
  const [nota, setNota] = useState(zona?.nota ?? '');
  const [activa, setActiva] = useState(zona?.activa ?? true);
  const [esquinas, setEsquinas] = useState<Punto[]>(zona?.poligono ?? []);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [confirmarBaja, setConfirmarBaja] = useState(false);

  if (usuario.rol !== 'ADMIN') {
    return <MensajeError>Solo el administrador puede crear o editar zonas.</MensajeError>;
  }

  // Para sugerir el número de una zona nueva.
  const siguienteNumero = Math.max(0, ...(todas.datos ?? []).map((z) => z.numero)) + 1;
  const otrasZonas = (todas.datos ?? []).filter((z) => z.id !== zona?.id);

  async function guardar() {
    setError(null);
    const numeroFinal = Number(numero || siguienteNumero);
    if (!Number.isInteger(numeroFinal) || numeroFinal < 1)
      return setError('El número no es válido.');
    if (!nombre.trim() || !limites.trim()) return setError('Completá el nombre y los límites.');
    if (esquinas.length < MIN_ESQUINAS) {
      return setError(`Marcá al menos ${MIN_ESQUINAS} esquinas en el mapa.`);
    }
    const cuerpo = {
      numero: numeroFinal,
      nombre: nombre.trim(),
      limites: limites.trim(),
      nota: nota.trim() || null,
      activa,
      poligono: esquinas,
    };
    setGuardando(true);
    try {
      if (zona) await enviar('PATCH', `/zonas/${zona.id}`, cuerpo);
      else await enviar('POST', '/zonas', cuerpo);
      recargarZonas();
      avisar(zona ? 'Zona actualizada' : 'Zona creada');
      router.push('/zonas');
    } catch (e) {
      setError(mensajeDeError(e));
      setGuardando(false);
    }
  }

  async function darDeBaja() {
    if (!zona) return;
    setGuardando(true);
    try {
      await enviar('DELETE', `/zonas/${zona.id}`);
      recargarZonas();
      avisar('Zona dada de baja');
      router.push('/zonas');
    } catch (e) {
      setError(mensajeDeError(e));
      setConfirmarBaja(false);
      setGuardando(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-2">
        <Campo
          etiqueta="Número"
          className="w-28 shrink-0"
          inputMode="numeric"
          value={numero}
          placeholder={String(siguienteNumero)}
          onChange={(e) => setNumero(e.target.value.replace(/\D/g, ''))}
        />
        <Campo
          etiqueta="Nombre"
          className="flex-1"
          placeholder="Zona 6 – Norte"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          maxLength={120}
        />
      </div>
      <AreaTexto
        etiqueta="Límites"
        placeholder="Calles que encierran la zona"
        value={limites}
        onChange={(e) => setLimites(e.target.value)}
        maxLength={500}
      />
      <Campo
        etiqueta="Nota (opcional)"
        placeholder="Ej.: conviene recorrerla a pie"
        value={nota}
        onChange={(e) => setNota(e.target.value)}
        maxLength={500}
      />

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-semibold">Esquinas ({esquinas.length})</legend>
        <EditorPoligono esquinas={esquinas} onCambio={setEsquinas} otrasZonas={otrasZonas} />
      </fieldset>

      {zona && (
        <Chips
          etiqueta="Estado de la zona"
          obligatorio
          opciones={{ si: 'Activa', no: 'Dada de baja' }}
          valor={activa ? 'si' : 'no'}
          onCambio={(v) => v && setActiva(v === 'si')}
        />
      )}

      <MensajeError>{error}</MensajeError>
      <Boton onClick={guardar} disabled={guardando}>
        {guardando ? 'Guardando…' : zona ? 'Guardar cambios' : 'Crear zona'}
      </Boton>
      {zona?.activa && (
        <Boton variante="peligro" onClick={() => setConfirmarBaja(true)}>
          Dar de baja la zona
        </Boton>
      )}

      <Hoja
        abierta={confirmarBaja}
        titulo="¿Dar de baja la zona?"
        onCerrar={() => setConfirmarBaja(false)}
      >
        <p className="mb-4">
          <strong>{zona?.nombre}</strong> deja de ofrecerse para cargar comercios. Los comercios que
          ya tiene se conservan, y se puede reactivar cuando quieras.
        </p>
        <div className="flex flex-col gap-2">
          <Boton variante="peligroLleno" onClick={darDeBaja} disabled={guardando}>
            Sí, dar de baja
          </Boton>
          <Boton variante="secundario" onClick={() => setConfirmarBaja(false)}>
            Cancelar
          </Boton>
        </div>
      </Hoja>
    </div>
  );
}
