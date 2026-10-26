'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ETIQUETAS, type EstadoComercio, type Interes, type Rubro } from '@tcshop/shared';
import { Suspense, useEffect, useState } from 'react';
import { Encabezado } from '@/components/encabezado';
import { Hoja } from '@/components/hoja';
import { IconoBuscar, IconoFiltro } from '@/components/iconos';
import { TarjetaComercio } from '@/components/tarjeta-comercio';
import { Boton, Cargando, Chips, MensajeError } from '@/components/ui';
import { useZonas } from '@/components/zonas';
import { api, mensajeDeError, query } from '@/lib/api';
import type { Comercio, Pagina } from '@/lib/tipos';

const POR_PAGINA = 20;
const FILTROS = ['zonaId', 'rubro', 'interes', 'estado'] as const;

export default function PaginaComercios() {
  return (
    <Suspense fallback={<Cargando />}>
      <ListaComercios />
    </Suspense>
  );
}

function ListaComercios() {
  const router = useRouter();
  const ruta = usePathname();
  const parametros = useSearchParams();
  const { zonas } = useZonas();

  // Los filtros viven en la URL: al volver de una ficha, la lista queda como estaba.
  const filtros = {
    q: parametros.get('q') ?? '',
    zonaId: parametros.get('zonaId'),
    rubro: parametros.get('rubro') as Rubro | null,
    interes: parametros.get('interes') as Interes | null,
    estado: parametros.get('estado') as EstadoComercio | null,
  };
  const claveFiltros = parametros.toString();

  const [busqueda, setBusqueda] = useState(filtros.q);
  // La página va atada a los filtros: si cambian, se vuelve a la primera sin un pedido de más.
  const [paginacion, setPaginacion] = useState({ clave: claveFiltros, pagina: 1 });
  const pagina = paginacion.clave === claveFiltros ? paginacion.pagina : 1;
  const pedido = `${claveFiltros}|${pagina}`;

  // Resultado acumulado de las páginas pedidas con los filtros actuales.
  const [resultado, setResultado] = useState<{
    pedido: string;
    clave: string;
    items: Comercio[];
    total: number;
    error: string | null;
  } | null>(null);
  const [verFiltros, setVerFiltros] = useState(false);

  function actualizarUrl(cambios: Record<string, string | null>) {
    const nuevos = new URLSearchParams(parametros);
    for (const [clave, valor] of Object.entries(cambios)) {
      if (valor) nuevos.set(clave, valor);
      else nuevos.delete(clave);
    }
    const texto = nuevos.toString();
    router.replace(texto ? `${ruta}?${texto}` : ruta, { scroll: false });
  }

  // Búsqueda con una pequeña espera, para no consultar en cada tecla.
  useEffect(() => {
    if (busqueda === filtros.q) return;
    const espera = setTimeout(() => actualizarUrl({ q: busqueda.trim() || null }), 350);
    return () => clearTimeout(espera);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda]);

  useEffect(() => {
    let vigente = true;
    const filtrosApi = Object.fromEntries(new URLSearchParams(claveFiltros).entries());
    api<Pagina<Comercio>>(`/comercios${query({ ...filtrosApi, pagina, porPagina: POR_PAGINA })}`)
      .then((respuesta) => {
        if (!vigente) return;
        setResultado((anterior) => ({
          pedido,
          clave: claveFiltros,
          // Las páginas siguientes se suman a las anteriores de los mismos filtros.
          items:
            pagina > 1 && anterior?.clave === claveFiltros
              ? [...anterior.items, ...respuesta.items]
              : respuesta.items,
          total: respuesta.total,
          error: null,
        }));
      })
      .catch(
        (e: unknown) =>
          vigente &&
          setResultado((anterior) => ({
            pedido,
            clave: claveFiltros,
            items: anterior?.clave === claveFiltros ? anterior.items : [],
            total: anterior?.clave === claveFiltros ? anterior.total : 0,
            error: mensajeDeError(e),
          })),
      );
    return () => {
      vigente = false;
    };
  }, [claveFiltros, pagina, pedido]);

  const cargando = resultado?.pedido !== pedido;
  const vigentes = resultado?.clave === claveFiltros ? resultado : null;
  const items = vigentes?.items ?? [];
  const total = vigentes?.total ?? 0;
  const error = vigentes?.error ?? null;

  const filtrosActivos = FILTROS.filter((f) => filtros[f]).length;
  const zonaFiltrada = zonas.find((z) => String(z.id) === filtros.zonaId);

  return (
    <>
      <Encabezado titulo="Comercios">
        <div className="mx-auto flex max-w-lg gap-2 px-3 pb-3">
          <label className="relative flex-1">
            <span className="sr-only">Buscar</span>
            <IconoBuscar className="pointer-events-none absolute top-3 left-3 text-texto-suave" />
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Nombre, dirección, notas…"
              className="min-h-12 w-full rounded-xl border-2 border-borde bg-fondo pr-3 pl-11 text-lg outline-none focus:border-primario"
            />
          </label>
          <Boton
            variante={filtrosActivos ? 'primario' : 'secundario'}
            onClick={() => setVerFiltros(true)}
            aria-label="Filtros"
          >
            <IconoFiltro />
            {filtrosActivos > 0 && filtrosActivos}
          </Boton>
        </div>
      </Encabezado>

      <main className="mx-auto flex max-w-lg flex-col gap-3 p-4">
        {filtrosActivos > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
            {zonaFiltrada && <span>Zona {zonaFiltrada.numero}</span>}
            {filtros.rubro && <span>{ETIQUETAS.rubro[filtros.rubro]}</span>}
            {filtros.interes && <span>Interés {ETIQUETAS.interes[filtros.interes]}</span>}
            {filtros.estado && <span>{ETIQUETAS.estado[filtros.estado]}</span>}
            <button
              type="button"
              className="min-h-12 px-2 text-primario underline"
              onClick={() => actualizarUrl(Object.fromEntries(FILTROS.map((f) => [f, null])))}
            >
              Quitar filtros
            </button>
          </div>
        )}

        <MensajeError>{error}</MensajeError>
        {!cargando && !error && (
          <p className="text-texto-suave">
            {total === 0
              ? 'No hay comercios con estos criterios.'
              : `${total} ${total === 1 ? 'comercio' : 'comercios'}`}
          </p>
        )}

        {items.map((comercio) => (
          <TarjetaComercio key={comercio.id} comercio={comercio} />
        ))}

        {cargando && <Cargando />}
        {!cargando && items.length < total && (
          <Boton
            variante="secundario"
            onClick={() => setPaginacion({ clave: claveFiltros, pagina: pagina + 1 })}
          >
            Ver más ({total - items.length})
          </Boton>
        )}
      </main>

      <Hoja abierta={verFiltros} titulo="Filtros" onCerrar={() => setVerFiltros(false)}>
        <div className="flex flex-col gap-5">
          <Chips
            etiqueta="Zona"
            opciones={Object.fromEntries(zonas.map((z) => [String(z.id), `Zona ${z.numero}`]))}
            valor={filtros.zonaId}
            onCambio={(zonaId) => actualizarUrl({ zonaId })}
          />
          <Chips
            etiqueta="Rubro"
            opciones={ETIQUETAS.rubro}
            valor={filtros.rubro}
            onCambio={(rubro) => actualizarUrl({ rubro })}
          />
          <Chips
            etiqueta="Interés"
            opciones={ETIQUETAS.interes}
            valor={filtros.interes}
            onCambio={(interes) => actualizarUrl({ interes })}
          />
          <Chips
            etiqueta="Estado"
            opciones={ETIQUETAS.estado}
            valor={filtros.estado}
            onCambio={(estado) => actualizarUrl({ estado })}
          />
          <Boton onClick={() => setVerFiltros(false)}>
            Ver {total} {total === 1 ? 'comercio' : 'comercios'}
          </Boton>
        </div>
      </Hoja>
    </>
  );
}
