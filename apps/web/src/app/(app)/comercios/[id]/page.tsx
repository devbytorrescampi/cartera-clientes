'use client';

import { useParams, useRouter } from 'next/navigation';
import { ETIQUETAS, type EstadoComercio, type TipoVisita } from '@tcshop/shared';
import { useMemo, useState } from 'react';
import { AccionesContacto } from '@/components/acciones-contacto';
import { useAvisos } from '@/components/avisos';
import {
  CamposVisita,
  cuerpoVisita,
  visitaVacia,
  type DatosVisita,
} from '@/components/campos-visita';
import { Encabezado } from '@/components/encabezado';
import { EtiquetaEstado, EtiquetaInteres } from '@/components/etiquetas';
import { FormularioComercio } from '@/components/formulario-comercio';
import { Hoja } from '@/components/hoja';
import { useUsuario } from '@/components/sesion';
import { Boton, Cargando, MensajeError } from '@/components/ui';
import { useZonas } from '@/components/zonas';
import { enviar, mensajeDeError } from '@/lib/api';
import { fechaHora, tituloComercio } from '@/lib/formato';
import {
  cuerpoCambios,
  desdeComercio,
  tieneNombreODireccion,
  type DatosComercio,
} from '@/lib/formulario-comercio';
import type { Comercio, Visita } from '@/lib/tipos';
import { useApi } from '@/lib/usar-api';

/** Tipo de visita que corresponde a pasar a cada estado. */
const TIPO_POR_ESTADO: Partial<Record<EstadoComercio, TipoVisita>> = {
  DEMO_HECHA: 'DEMO',
};

export default function PaginaFicha() {
  const { id } = useParams<{ id: string }>();
  const comercio = useApi<Comercio>(`/comercios/${id}`);
  const visitas = useApi<Visita[]>(`/comercios/${id}/visitas`);

  if (comercio.error) {
    return (
      <>
        <Encabezado titulo="Comercio" atras="/comercios" />
        <main className="mx-auto max-w-lg p-4">
          <MensajeError>{comercio.error}</MensajeError>
        </main>
      </>
    );
  }
  if (!comercio.datos) return <Cargando />;

  return (
    // Cuando el comercio se recarga (después de guardar), la ficha se remonta con los datos nuevos.
    <Ficha
      key={comercio.datos.actualizadoEn}
      comercio={comercio.datos}
      visitas={visitas.datos}
      alGuardar={() => {
        comercio.recargar();
        visitas.recargar();
      }}
    />
  );
}

function Ficha({
  comercio,
  visitas,
  alGuardar,
}: {
  comercio: Comercio;
  visitas: Visita[] | null;
  alGuardar: () => void;
}) {
  const router = useRouter();
  const avisar = useAvisos();
  const usuario = useUsuario();
  const { zonas } = useZonas();

  const original = useMemo(() => desdeComercio(comercio), [comercio]);
  const [datos, setDatos] = useState<DatosComercio>(original);
  const [visitaDelCambio, setVisitaDelCambio] = useState<DatosVisita | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nuevaVisita, setNuevaVisita] = useState<DatosVisita | null>(null);
  const [confirmarBaja, setConfirmarBaja] = useState(false);

  const cambios = cuerpoCambios(original, datos);
  const hayCambios = Object.keys(cambios).length > 0;
  const cambioDeEstado = datos.estado !== original.estado;

  function cambiar(cambio: Partial<DatosComercio>) {
    setDatos((d) => ({ ...d, ...cambio }));
    // Al cambiar el estado se ofrece registrar la visita en el mismo paso.
    if (cambio.estado && cambio.estado !== original.estado) {
      setVisitaDelCambio(visitaVacia(TIPO_POR_ESTADO[cambio.estado] ?? 'SEGUIMIENTO'));
    }
    if (cambio.estado === original.estado) setVisitaDelCambio(null);
  }

  async function guardarCambios() {
    setError(null);
    if (!tieneNombreODireccion(datos)) return setError('Dejá al menos el nombre o la dirección.');
    setGuardando(true);
    try {
      await enviar('PATCH', `/comercios/${comercio.id}`, {
        ...cambios,
        ...(cambioDeEstado && visitaDelCambio && { visita: cuerpoVisita(visitaDelCambio) }),
      });
      avisar('Cambios guardados');
      setVisitaDelCambio(null);
      alGuardar();
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setGuardando(false);
    }
  }

  async function registrarVisita() {
    if (!nuevaVisita) return;
    setGuardando(true);
    try {
      await enviar('POST', `/comercios/${comercio.id}/visitas`, cuerpoVisita(nuevaVisita));
      avisar('Visita registrada');
      setNuevaVisita(null);
      alGuardar();
    } catch (e) {
      setError(mensajeDeError(e));
      setNuevaVisita(null);
    } finally {
      setGuardando(false);
    }
  }

  async function darDeBaja() {
    setGuardando(true);
    try {
      await enviar('DELETE', `/comercios/${comercio.id}`);
      avisar('Comercio eliminado');
      router.replace('/comercios');
    } catch (e) {
      setError(mensajeDeError(e));
      setConfirmarBaja(false);
      setGuardando(false);
    }
  }

  return (
    <>
      <Encabezado titulo={tituloComercio(comercio)} atras="/comercios" />

      <main className="mx-auto flex max-w-lg flex-col gap-5 p-4">
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{comercio.zona.nombre}</span>
            <EtiquetaEstado estado={comercio.estado} />
            <EtiquetaInteres interes={comercio.interes} />
          </div>
          <AccionesContacto comercio={comercio} conLlamada />
          <Boton onClick={() => setNuevaVisita(visitaVacia())}>Registrar visita</Boton>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-bold">Historial</h2>
          {visitas === null ? (
            <Cargando />
          ) : (
            <ol className="flex flex-col gap-2">
              {visitas.map((v) => (
                <li key={v.id} className="rounded-xl border-l-4 border-primario bg-superficie p-3">
                  <p className="font-bold">
                    {ETIQUETAS.tipoVisita[v.tipo]}
                    <span className="font-normal text-texto-suave"> · {fechaHora(v.fecha)}</span>
                  </p>
                  {v.resultado && <p>{v.resultado}</p>}
                  {v.notas && <p className="whitespace-pre-line text-texto-suave">{v.notas}</p>}
                  {usuario.rol === 'ADMIN' && (
                    <p className="text-sm text-texto-suave">Por {v.usuario.nombre}</p>
                  )}
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-bold">Datos</h2>
          <FormularioComercio datos={datos} onCambio={cambiar} zonas={zonas} />

          {cambioDeEstado && (
            <div className="flex flex-col gap-3 rounded-xl border-2 border-primario p-3">
              <p className="font-bold">
                Cambia a «{ETIQUETAS.estado[datos.estado]}». ¿Registrás la visita?
              </p>
              {visitaDelCambio ? (
                <>
                  <CamposVisita
                    datos={visitaDelCambio}
                    onCambio={(c) => setVisitaDelCambio((v) => v && { ...v, ...c })}
                  />
                  <Boton variante="secundario" onClick={() => setVisitaDelCambio(null)}>
                    No registrar visita
                  </Boton>
                </>
              ) : (
                <Boton variante="secundario" onClick={() => setVisitaDelCambio(visitaVacia())}>
                  Sí, registrar visita
                </Boton>
              )}
            </div>
          )}

          <MensajeError>{error}</MensajeError>
        </section>

        <section className="flex flex-col gap-2 border-t-2 border-superficie-2 pt-4 text-sm text-texto-suave">
          <p>
            Cargado por {comercio.creadoPor.nombre} el {fechaHora(comercio.creadoEn)}
          </p>
          <Boton variante="peligro" onClick={() => setConfirmarBaja(true)}>
            Eliminar comercio
          </Boton>
        </section>
      </main>

      {hayCambios && (
        <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 flex gap-2 border-t-2 border-superficie-2 bg-fondo p-3">
          <div className="mx-auto flex w-full max-w-lg gap-2">
            <Boton
              variante="secundario"
              onClick={() => {
                setDatos(original);
                setVisitaDelCambio(null);
              }}
            >
              Descartar
            </Boton>
            <Boton className="flex-1 text-lg" onClick={guardarCambios} disabled={guardando}>
              {guardando ? 'Guardando…' : 'Guardar cambios'}
            </Boton>
          </div>
        </div>
      )}

      <Hoja
        abierta={nuevaVisita !== null}
        titulo="Registrar visita"
        onCerrar={() => setNuevaVisita(null)}
      >
        {nuevaVisita && (
          <div className="flex flex-col gap-4">
            <CamposVisita
              datos={nuevaVisita}
              onCambio={(c) => setNuevaVisita((v) => v && { ...v, ...c })}
            />
            <Boton onClick={registrarVisita} disabled={guardando}>
              {guardando ? 'Guardando…' : 'Guardar visita'}
            </Boton>
          </div>
        )}
      </Hoja>

      <Hoja
        abierta={confirmarBaja}
        titulo="¿Eliminar comercio?"
        onCerrar={() => setConfirmarBaja(false)}
      >
        <p className="mb-4">
          <strong>{tituloComercio(comercio)}</strong> deja de aparecer en las listas y las
          estadísticas. El historial se conserva.
        </p>
        <div className="flex flex-col gap-2">
          <Boton variante="peligroLleno" onClick={darDeBaja} disabled={guardando}>
            Sí, eliminar
          </Boton>
          <Boton variante="secundario" onClick={() => setConfirmarBaja(false)}>
            Cancelar
          </Boton>
        </div>
      </Hoja>
    </>
  );
}
