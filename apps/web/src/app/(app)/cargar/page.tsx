'use client';

import Link from 'next/link';
import { cercaniaAZona, RADIO_RUTA_M } from '@tcshop/shared';
import { useRef, useState } from 'react';
import { useAvisos } from '@/components/avisos';
import { Encabezado } from '@/components/encabezado';
import { FormularioComercio } from '@/components/formulario-comercio';
import { Hoja } from '@/components/hoja';
import { SelectorZona } from '@/components/selector-zona';
import { Boton, MensajeError } from '@/components/ui';
import type { Ubicacion } from '@/components/ubicacion-gps';
import { useZonas } from '@/components/zonas';
import { api, enviar, mensajeDeError, query } from '@/lib/api';
import { etiquetaZona, tituloComercio } from '@/lib/formato';
import {
  cuerpoAlta,
  formularioVacio,
  tieneNombreODireccion,
  type DatosComercio,
} from '@/lib/formulario-comercio';
import type { Comercio, PosibleDuplicado, Zona } from '@/lib/tipos';

export default function PaginaCargar() {
  const { zonas, zonaActual, elegirZona } = useZonas();
  const avisar = useAvisos();
  const [datos, setDatos] = useState<DatosComercio>(() => formularioVacio(null));
  // Id generado acá: si se reintenta el guardado (por ejemplo, tras un corte), no se duplica.
  const idAlta = useRef<string>(crypto.randomUUID());
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zonaSugerida, setZonaSugerida] = useState<Zona | null>(null);
  const [fueraDeZonas, setFueraDeZonas] = useState(false);
  const [duplicados, setDuplicados] = useState<PosibleDuplicado[]>([]);
  const [ultimo, setUltimo] = useState<Comercio | null>(null);

  const cambiar = (cambio: Partial<DatosComercio>) => setDatos((d) => ({ ...d, ...cambio }));

  // Sugiere según el GPS, sin cambiarla sola: primero la ruta más cercana (a menos de 50 m)
  // y si no hay, la zona que contiene el punto. Si la elegida también corresponde, no molesta.
  function alObtenerUbicacion(ubicacion: Ubicacion | null) {
    setZonaSugerida(null);
    setFueraDeZonas(false);
    if (!ubicacion) return;
    const punto: [number, number] = [ubicacion.lat, ubicacion.lng];
    const cercanas = zonas
      .map((z) => ({ zona: z, distancia: cercaniaAZona(punto, z) }))
      .filter((c): c is { zona: Zona; distancia: number } => c.distancia !== null)
      .sort((a, b) => a.distancia - b.distancia);
    if (cercanas.length === 0) setFueraDeZonas(true);
    else if (!cercanas.some((c) => c.zona.id === zonaActual?.id))
      setZonaSugerida(cercanas[0]!.zona);
  }

  async function intentarGuardar() {
    setError(null);
    if (!zonaActual) return setError('Elegí una zona o ruta arriba.');
    if (!tieneNombreODireccion(datos)) return setError('Cargá al menos el nombre o la dirección.');

    setGuardando(true);
    try {
      const posibles = await api<PosibleDuplicado[]>(
        `/comercios/duplicados${query({
          zonaId: zonaActual.id,
          nombre: datos.nombre.trim(),
          lat: datos.lat,
          lng: datos.lng,
        })}`,
      );
      if (posibles.length > 0) {
        setDuplicados(posibles);
        setGuardando(false);
        return;
      }
      await guardar();
    } catch (e) {
      setError(mensajeDeError(e));
      setGuardando(false);
    }
  }

  async function guardar() {
    if (!zonaActual) return;
    setDuplicados([]);
    setGuardando(true);
    try {
      const creado = await enviar<Comercio>(
        'POST',
        '/comercios',
        cuerpoAlta({ ...datos, zonaId: zonaActual.id }, idAlta.current),
      );
      avisar(`Guardado: ${tituloComercio(creado)}`);
      setUltimo(creado);
      setDatos(formularioVacio(null));
      setZonaSugerida(null);
      setFueraDeZonas(false);
      idAlta.current = crypto.randomUUID();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <Encabezado titulo="Cargar comercio">
        <SelectorZona />
      </Encabezado>

      <main className="mx-auto flex max-w-lg flex-col gap-4 p-4">
        {ultimo && (
          <p className="rounded-xl bg-superficie p-3">
            Último cargado: <strong>{tituloComercio(ultimo)}</strong>.{' '}
            <Link href={`/comercios/${ultimo.id}`} className="font-bold text-primario underline">
              Ver ficha
            </Link>
          </p>
        )}

        {zonaSugerida && (
          <div className="flex flex-col gap-2 rounded-xl border-2 border-alerta p-3">
            <p className="font-semibold">
              Esta ubicación corresponde a la <strong>{zonaSugerida.nombre}</strong>, no a la
              elegida.
            </p>
            <div className="flex gap-2">
              <Boton
                className="flex-1"
                onClick={() => {
                  elegirZona(zonaSugerida.id);
                  setZonaSugerida(null);
                }}
              >
                Cambiar a {etiquetaZona(zonaSugerida)}
              </Boton>
              <Boton variante="secundario" onClick={() => setZonaSugerida(null)}>
                Dejar
              </Boton>
            </div>
          </div>
        )}
        {fueraDeZonas && (
          <p className="rounded-xl border-2 border-alerta p-3 font-semibold">
            Esta ubicación no cae dentro de ninguna zona ni a menos de {RADIO_RUTA_M} m de ninguna
            ruta.
          </p>
        )}

        <FormularioComercio datos={datos} onCambio={cambiar} onUbicacion={alObtenerUbicacion} />

        <MensajeError>{error}</MensajeError>
      </main>

      {/* Botón fijo arriba de la navegación: guardar siempre a un toque. */}
      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t-2 border-superficie-2 bg-fondo p-3">
        <Boton
          className="mx-auto flex w-full max-w-lg text-lg"
          onClick={intentarGuardar}
          disabled={guardando}
        >
          {guardando ? 'Guardando…' : 'Guardar comercio'}
        </Boton>
      </div>

      <Hoja
        abierta={duplicados.length > 0}
        titulo="¿Ya está cargado?"
        onCerrar={() => setDuplicados([])}
      >
        <p className="mb-3">Encontré comercios parecidos:</p>
        <ul className="mb-4 flex flex-col gap-2">
          {duplicados.map((d) => (
            <li key={d.id} className="rounded-xl bg-superficie p-3">
              <Link href={`/comercios/${d.id}`} className="block">
                <span className="block font-bold">{tituloComercio(d)}</span>
                {d.nombre && d.direccion && (
                  <span className="block text-texto-suave">{d.direccion}</span>
                )}
                <span className="block text-sm font-semibold">
                  {[
                    d.motivos.includes('MISMO_NOMBRE') && `Mismo nombre en ${etiquetaZona(d.zona)}`,
                    d.motivos.includes('CERCANIA') && `A ${d.distanciaM} m`,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-2">
          <Boton onClick={guardar} disabled={guardando}>
            Es otro, guardar igual
          </Boton>
          <Boton variante="secundario" onClick={() => setDuplicados([])}>
            Cancelar
          </Boton>
        </div>
      </Hoja>
    </>
  );
}
