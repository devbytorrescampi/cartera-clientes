'use client';

import { ETIQUETAS, type Punto, type TipoZona } from '@tcshop/shared';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { enviar, mensajeDeError } from '@/lib/api';
import type { Zona } from '@/lib/tipos';
import { useApi } from '@/lib/usar-api';
import { useAvisos } from './avisos';
import { EditorZona } from './editor-zona';
import { Hoja } from './hoja';
import { useUsuario } from './sesion';
import { AreaTexto, Boton, Campo, Chips, MensajeError } from './ui';
import { useZonas } from './zonas';

/** Mínimo de puntos: una zona es un área (3 esquinas); a una ruta le alcanzan A y B. */
const MIN_PUNTOS: Record<TipoZona, number> = { ZONA: 3, RUTA: 2 };

const TIPOS: Record<TipoZona, string> = { ZONA: 'Zona (área)', RUTA: 'Ruta (línea de A a B)' };

/** Alta (sin `zona`) o edición de una zona o ruta. Solo para el admin. */
export function FormularioZona({
  zona,
  tipoInicial = 'ZONA',
}: {
  zona?: Zona;
  tipoInicial?: TipoZona;
}) {
  const router = useRouter();
  const avisar = useAvisos();
  const usuario = useUsuario();
  const { recargarZonas } = useZonas();
  const todas = useApi<Zona[]>('/zonas?incluirInactivas=true');

  const [tipo, setTipo] = useState<TipoZona>(zona?.tipo ?? tipoInicial);
  const [numero, setNumero] = useState(zona ? String(zona.numero) : '');
  const [nombre, setNombre] = useState(zona?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(zona?.descripcion ?? '');
  const [nota, setNota] = useState(zona?.nota ?? '');
  const [activa, setActiva] = useState(zona?.activa ?? true);
  const [puntos, setPuntos] = useState<Punto[]>(zona?.puntos ?? []);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [confirmarBaja, setConfirmarBaja] = useState(false);

  if (usuario.rol !== 'ADMIN') {
    return <MensajeError>Solo el administrador puede crear o editar zonas y rutas.</MensajeError>;
  }

  // Para sugerir el número de una zona o ruta nueva (la numeración es una sola para las dos).
  const palabra = ETIQUETAS.tipoZona[tipo].toLowerCase();
  const siguienteNumero = Math.max(0, ...(todas.datos ?? []).map((z) => z.numero)) + 1;
  const otrasZonas = (todas.datos ?? []).filter((z) => z.id !== zona?.id);

  async function guardar() {
    setError(null);
    const numeroFinal = Number(numero || siguienteNumero);
    if (!Number.isInteger(numeroFinal) || numeroFinal < 1)
      return setError('El número no es válido.');
    if (!nombre.trim() || !descripcion.trim()) {
      return setError(
        tipo === 'RUTA'
          ? 'Completá el nombre y por dónde va.'
          : 'Completá el nombre y los límites.',
      );
    }
    if (puntos.length < MIN_PUNTOS[tipo]) {
      return setError(
        tipo === 'RUTA'
          ? 'Marcá en el mapa al menos el inicio (A) y el final (B).'
          : `Marcá al menos ${MIN_PUNTOS.ZONA} esquinas en el mapa.`,
      );
    }
    const cuerpo = {
      tipo,
      numero: numeroFinal,
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      nota: nota.trim() || null,
      activa,
      puntos,
    };
    setGuardando(true);
    try {
      if (zona) await enviar('PATCH', `/zonas/${zona.id}`, cuerpo);
      else await enviar('POST', '/zonas', cuerpo);
      recargarZonas();
      avisar(`${ETIQUETAS.tipoZona[tipo]} ${zona ? 'actualizada' : 'creada'}`);
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
      avisar(`${ETIQUETAS.tipoZona[tipo]} dada de baja`);
      router.push('/zonas');
    } catch (e) {
      setError(mensajeDeError(e));
      setConfirmarBaja(false);
      setGuardando(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Chips
        etiqueta="Tipo"
        obligatorio
        opciones={TIPOS}
        valor={tipo}
        onCambio={(v) => v && setTipo(v)}
      />
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
          placeholder={
            tipo === 'RUTA'
              ? `Ruta ${siguienteNumero} – Av. Aconquija`
              : `Zona ${siguienteNumero} – Norte`
          }
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          maxLength={120}
        />
      </div>
      <AreaTexto
        etiqueta={tipo === 'RUTA' ? 'Por dónde va' : 'Límites'}
        placeholder={
          tipo === 'RUTA'
            ? 'Ej.: Av. Mate de Luna, desde Av. Mitre hasta Av. Perón'
            : 'Calles que encierran la zona'
        }
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
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
        <legend className="mb-2 font-semibold">
          {tipo === 'RUTA' ? 'Recorrido' : 'Esquinas'} ({puntos.length})
        </legend>
        <EditorZona tipo={tipo} puntos={puntos} onCambio={setPuntos} otrasZonas={otrasZonas} />
      </fieldset>

      {zona && (
        <Chips
          etiqueta={`Estado de la ${palabra}`}
          obligatorio
          opciones={{ si: 'Activa', no: 'Dada de baja' }}
          valor={activa ? 'si' : 'no'}
          onCambio={(v) => v && setActiva(v === 'si')}
        />
      )}

      <MensajeError>{error}</MensajeError>
      <Boton onClick={guardar} disabled={guardando}>
        {guardando ? 'Guardando…' : zona ? 'Guardar cambios' : `Crear ${palabra}`}
      </Boton>
      {zona?.activa && (
        <Boton variante="peligro" onClick={() => setConfirmarBaja(true)}>
          Dar de baja la {palabra}
        </Boton>
      )}

      <Hoja
        abierta={confirmarBaja}
        titulo={`¿Dar de baja la ${palabra}?`}
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
