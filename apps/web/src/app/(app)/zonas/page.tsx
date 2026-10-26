'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Encabezado } from '@/components/encabezado';
import { LeyendaMapa, MapaZonas } from '@/components/mapa-zonas';
import { useUsuario } from '@/components/sesion';
import { Cargando, MensajeError, unir } from '@/components/ui';
import type { EstadisticaZona, PuntoMapa, Zona } from '@/lib/tipos';
import { useApi } from '@/lib/usar-api';

const porcentaje = (valor: number) => `${Math.round(valor * 100)}%`;

export default function PaginaZonas() {
  const usuario = useUsuario();
  const esAdmin = usuario.rol === 'ADMIN';
  // El admin ve también las zonas dadas de baja, para poder reactivarlas.
  const zonas = useApi<Zona[]>(esAdmin ? '/zonas?incluirInactivas=true' : '/zonas');
  const estadisticas = useApi<EstadisticaZona[]>('/estadisticas/zonas');
  const puntos = useApi<PuntoMapa[]>('/comercios/mapa');
  const [enfocada, setEnfocada] = useState<number | null>(null);

  const error = zonas.error ?? estadisticas.error ?? puntos.error;
  const porZona = new Map(estadisticas.datos?.map((e) => [e.zonaId, e]));
  const totales = (estadisticas.datos ?? []).reduce(
    (t, e) => ({
      relevados: t.relevados + e.relevados,
      interesAlto: t.interesAlto + e.interesAlto,
      clientes: t.clientes + e.clientes,
    }),
    { relevados: 0, interesAlto: 0, clientes: 0 },
  );

  return (
    <>
      <Encabezado titulo="Zonas" />
      <main className="mx-auto flex max-w-lg flex-col gap-4 p-4">
        <MensajeError>{error}</MensajeError>

        {zonas.datos && puntos.datos ? (
          <>
            <MapaZonas zonas={zonas.datos} puntos={puntos.datos} zonaEnfocada={enfocada} />
            <LeyendaMapa />
          </>
        ) : (
          !error && <Cargando texto="Cargando mapa…" />
        )}

        {estadisticas.datos && (
          <section className="grid grid-cols-3 gap-2 rounded-2xl bg-superficie p-3 text-center">
            <Dato valor={totales.relevados} texto="Relevados" />
            <Dato valor={totales.interesAlto} texto="Interés alto" />
            <Dato
              valor={totales.clientes}
              texto={`Clientes · ${porcentaje(totales.relevados ? totales.clientes / totales.relevados : 0)}`}
            />
          </section>
        )}

        {esAdmin && (
          <Link
            href="/zonas/nueva"
            className="flex min-h-12 items-center justify-center rounded-xl border-2 border-borde font-bold"
          >
            Nueva zona
          </Link>
        )}

        <ul className="flex flex-col gap-3">
          {zonas.datos?.map((zona) => {
            const e = porZona.get(zona.id);
            return (
              <li
                key={zona.id}
                className={unir(
                  'flex flex-col gap-3 rounded-2xl border-2 bg-superficie p-3',
                  enfocada === zona.id ? 'border-primario' : 'border-transparent',
                  !zona.activa && 'opacity-70',
                )}
              >
                <button
                  type="button"
                  className="flex flex-col gap-1 text-left"
                  onClick={() => {
                    setEnfocada(zona.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <span className="text-lg font-bold">
                    {zona.nombre}
                    {!zona.activa && (
                      <span className="ml-2 text-sm font-semibold text-peligro">Dada de baja</span>
                    )}
                  </span>
                  <span className="text-sm text-texto-suave">{zona.limites}</span>
                  {zona.nota && <span className="text-sm font-semibold">{zona.nota}</span>}
                </button>
                {e && (
                  <div className="grid grid-cols-4 gap-1 text-center">
                    <Dato valor={e.relevados} texto="Relevados" chico />
                    <Dato valor={e.interesAlto} texto="Int. alto" chico />
                    <Dato valor={e.clientes} texto="Clientes" chico />
                    <Dato valor={porcentaje(e.conversion)} texto="Conversión" chico />
                  </div>
                )}
                <div className="flex gap-2">
                  <Link
                    href={`/comercios?zonaId=${zona.id}`}
                    className="flex min-h-12 flex-1 items-center justify-center rounded-xl border-2 border-borde font-bold"
                  >
                    Ver comercios
                  </Link>
                  {esAdmin && (
                    <Link
                      href={`/zonas/${zona.id}`}
                      className="flex min-h-12 flex-1 items-center justify-center rounded-xl border-2 border-borde font-bold"
                    >
                      Editar
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </main>
    </>
  );
}

function Dato({
  valor,
  texto,
  chico = false,
}: {
  valor: number | string;
  texto: string;
  chico?: boolean;
}) {
  return (
    <div>
      <p className={unir('font-extrabold', chico ? 'text-xl' : 'text-2xl')}>{valor}</p>
      <p className="text-xs font-semibold text-texto-suave">{texto}</p>
    </div>
  );
}
