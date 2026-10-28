'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ETIQUETAS } from '@tcshop/shared';
import { Suspense, useEffect, useState } from 'react';
import { EtiquetaEstado, EtiquetaInteres } from '@/components/etiquetas';
import { Boton, Cargando, MensajeError, unir } from '@/components/ui';
import { query } from '@/lib/api';
import { etiquetaZona, fechaCorta, hoyLocal, tituloComercio } from '@/lib/formato';
import type { Comercio, Pagina, Zona, UsuarioAdmin } from '@/lib/tipos';
import { useApi } from '@/lib/usar-api';

const POR_PAGINA = 50;
const FILTROS = ['q', 'zonaId', 'creadoPorId', 'rubro', 'interes', 'estado'] as const;

/** Columnas de la tabla. `orden` es el criterio que acepta la API para esa columna. */
const COLUMNAS = [
  { titulo: 'Comercio', orden: 'nombre' },
  { titulo: 'Zona / ruta', orden: 'zona' },
  { titulo: 'Rubro', orden: 'rubro' },
  { titulo: 'Interés', orden: 'interes' },
  { titulo: 'Estado', orden: 'estado' },
  { titulo: 'Contacto', orden: null },
  { titulo: 'Volver el', orden: 'volverEl' },
  { titulo: 'Cargó', orden: 'creadoPor' },
  { titulo: 'Modificado', orden: 'actualizadoEn' },
] as const;

export default function PaginaAdminComercios() {
  return (
    <Suspense fallback={<Cargando />}>
      <TablaComercios />
    </Suspense>
  );
}

function TablaComercios() {
  const router = useRouter();
  const ruta = usePathname();
  const parametros = useSearchParams();
  const zonas = useApi<Zona[]>('/zonas?incluirInactivas=true');
  const usuarios = useApi<UsuarioAdmin[]>('/usuarios');

  // Todo el estado vive en la URL: se puede volver atrás, recargar o compartir el link.
  const valor = (clave: string) => parametros.get(clave) ?? '';
  const pagina = Math.max(1, Number(parametros.get('pagina')) || 1);
  const orden = valor('orden') || 'actualizadoEn';
  const direccion = valor('direccion') || (orden === 'actualizadoEn' ? 'desc' : 'asc');

  const lista = useApi<Pagina<Comercio>>(
    `/comercios${query({
      ...Object.fromEntries(FILTROS.map((f) => [f, valor(f)])),
      orden,
      direccion,
      pagina,
      porPagina: POR_PAGINA,
    })}`,
  );

  function actualizarUrl(cambios: Record<string, string | null>, conservarPagina = false) {
    const nuevos = new URLSearchParams(parametros);
    for (const [clave, v] of Object.entries(cambios)) {
      if (v) nuevos.set(clave, v);
      else nuevos.delete(clave);
    }
    if (!conservarPagina) nuevos.delete('pagina');
    const texto = nuevos.toString();
    router.replace(texto ? `${ruta}?${texto}` : ruta, { scroll: false });
  }

  // Búsqueda con una pequeña espera, para no consultar en cada tecla.
  const [busqueda, setBusqueda] = useState(valor('q'));
  useEffect(() => {
    if (busqueda.trim() === valor('q')) return;
    const espera = setTimeout(() => actualizarUrl({ q: busqueda.trim() || null }), 350);
    return () => clearTimeout(espera);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda]);

  function ordenarPor(columna: string) {
    // Primer clic: el orden natural de la columna; segundo clic: al revés.
    const natural = columna === 'actualizadoEn' ? 'desc' : 'asc';
    const nueva = columna === orden ? (direccion === 'asc' ? 'desc' : 'asc') : natural;
    actualizarUrl({ orden: columna, direccion: nueva });
  }

  const total = lista.datos?.total ?? 0;
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const hayFiltros = FILTROS.some((f) => valor(f));
  const hoy = hoyLocal();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Comercios</h1>
          <p className="text-texto-suave">
            {lista.datos ? `${total} ${total === 1 ? 'comercio' : 'comercios'}` : 'Cargando…'}
            {hayFiltros && ' con estos filtros'}
          </p>
        </div>
        <Link
          href="/datos"
          className="flex min-h-10 items-center rounded-xl border-2 border-borde px-4 font-bold"
        >
          Exportar a CSV
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <label className="flex flex-col gap-1 sm:col-span-2 lg:col-span-4 xl:col-span-2">
          <span className="text-sm font-semibold">Buscar</span>
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Nombre, dirección, notas…"
            className={ESTILO_CONTROL}
          />
        </label>
        <Selector
          etiqueta="Zona o ruta"
          valor={valor('zonaId')}
          onCambio={(v) => actualizarUrl({ zonaId: v })}
          opciones={(zonas.datos ?? []).map((r) => [String(r.id), r.nombre])}
          todas="Todas"
        />
        <Selector
          etiqueta="Cargó"
          valor={valor('creadoPorId')}
          onCambio={(v) => actualizarUrl({ creadoPorId: v })}
          opciones={(usuarios.datos ?? []).map((u) => [u.id, u.nombre])}
          todas="Todos"
        />
        <Selector
          etiqueta="Rubro"
          valor={valor('rubro')}
          onCambio={(v) => actualizarUrl({ rubro: v })}
          opciones={Object.entries(ETIQUETAS.rubro)}
          todas="Todos"
        />
        <Selector
          etiqueta="Interés"
          valor={valor('interes')}
          onCambio={(v) => actualizarUrl({ interes: v })}
          opciones={Object.entries(ETIQUETAS.interes)}
          todas="Todos"
        />
        <Selector
          etiqueta="Estado"
          valor={valor('estado')}
          onCambio={(v) => actualizarUrl({ estado: v })}
          opciones={Object.entries(ETIQUETAS.estado)}
          todas="Todos"
        />
        <div className="flex items-end">
          <Boton
            variante="secundario"
            className="min-h-10 w-full"
            disabled={!hayFiltros}
            onClick={() => {
              setBusqueda('');
              actualizarUrl(Object.fromEntries(FILTROS.map((f) => [f, null])));
            }}
          >
            Limpiar
          </Boton>
        </div>
      </div>

      <MensajeError>{lista.error}</MensajeError>

      <div className="overflow-x-auto rounded-xl border-2 border-superficie-2">
        <table className={unir('w-full text-left text-sm', lista.cargando && 'opacity-60')}>
          <thead className="bg-superficie">
            <tr>
              {COLUMNAS.map((c) => (
                <th
                  key={c.titulo}
                  scope="col"
                  className="px-3 py-2 font-semibold whitespace-nowrap"
                  aria-sort={
                    c.orden === orden
                      ? direccion === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : undefined
                  }
                >
                  {c.orden ? (
                    <button
                      type="button"
                      onClick={() => ordenarPor(c.orden)}
                      className="inline-flex items-center gap-1 hover:underline"
                    >
                      {c.titulo}
                      <span aria-hidden className="w-3 text-texto-suave">
                        {c.orden === orden ? (direccion === 'asc' ? '▲' : '▼') : ''}
                      </span>
                    </button>
                  ) : (
                    c.titulo
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lista.datos?.items.map((c) => (
              <tr key={c.id} className="border-t border-superficie-2 align-top hover:bg-superficie">
                <td className="px-3 py-2">
                  <Link
                    href={`/comercios/${c.id}`}
                    className="font-bold text-primario hover:underline"
                  >
                    {tituloComercio(c)}
                  </Link>
                  {c.nombre && c.direccion && (
                    <span className="block text-texto-suave">{c.direccion}</span>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">{etiquetaZona(c.zona)}</td>
                <td className="px-3 py-2">{ETIQUETAS.rubro[c.rubro]}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <EtiquetaInteres interes={c.interes} />
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <EtiquetaEstado estado={c.estado} />
                </td>
                <td className="px-3 py-2">
                  {c.contactoNombre && <span className="block">{c.contactoNombre}</span>}
                  {c.telefonoNumero &&
                    (c.whatsapp ? (
                      <a
                        href={c.whatsapp}
                        target="_blank"
                        rel="noreferrer"
                        className="whitespace-nowrap text-primario hover:underline"
                      >
                        ({c.telefonoCodArea}) {c.telefonoNumero}
                      </a>
                    ) : (
                      <span className="whitespace-nowrap">
                        ({c.telefonoCodArea}) {c.telefonoNumero}
                      </span>
                    ))}
                </td>
                <td
                  className={unir(
                    'px-3 py-2 whitespace-nowrap',
                    c.volverEl && c.volverEl < hoy && 'font-bold text-peligro',
                  )}
                >
                  {c.volverEl ? fechaCorta(c.volverEl) : ''}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">{c.creadoPor.nombre}</td>
                <td className="px-3 py-2 whitespace-nowrap text-texto-suave">
                  {new Date(c.actualizadoEn).toLocaleDateString('es-AR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {lista.datos?.items.length === 0 && (
          <p className="p-6 text-center text-texto-suave">No hay comercios con estos filtros.</p>
        )}
        {!lista.datos && !lista.error && <Cargando />}
      </div>

      {paginas > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Boton
            variante="secundario"
            className="min-h-10"
            disabled={pagina <= 1}
            onClick={() => actualizarUrl({ pagina: String(pagina - 1) }, true)}
          >
            Anterior
          </Boton>
          <span className="font-semibold">
            Página {pagina} de {paginas}
          </span>
          <Boton
            variante="secundario"
            className="min-h-10"
            disabled={pagina >= paginas}
            onClick={() => actualizarUrl({ pagina: String(pagina + 1) }, true)}
          >
            Siguiente
          </Boton>
        </div>
      )}
    </div>
  );
}

const ESTILO_CONTROL =
  'min-h-10 w-full rounded-lg border-2 border-borde bg-fondo px-3 outline-none focus:border-primario';

function Selector({
  etiqueta,
  valor,
  onCambio,
  opciones,
  todas,
}: {
  etiqueta: string;
  valor: string;
  onCambio: (valor: string | null) => void;
  opciones: [string, string][];
  todas: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-semibold">{etiqueta}</span>
      <select
        value={valor}
        onChange={(e) => onCambio(e.target.value || null)}
        className={ESTILO_CONTROL}
      >
        <option value="">{todas}</option>
        {opciones.map(([clave, texto]) => (
          <option key={clave} value={clave}>
            {texto}
          </option>
        ))}
      </select>
    </label>
  );
}
