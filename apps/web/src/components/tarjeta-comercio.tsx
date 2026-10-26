import Link from 'next/link';
import { ETIQUETAS } from '@tcshop/shared';
import { fechaCorta, tituloComercio } from '@/lib/formato';
import type { Comercio } from '@/lib/tipos';
import { AccionesContacto } from './acciones-contacto';
import { EtiquetaEstado, EtiquetaInteres } from './etiquetas';
import { unir } from './ui';

/** Resumen de un comercio para las listas. Tocar el bloque superior abre la ficha. */
export function TarjetaComercio({
  comercio,
  vencido = false,
}: {
  comercio: Comercio;
  vencido?: boolean;
}) {
  return (
    <article
      className={unir(
        'flex flex-col gap-3 rounded-2xl border-2 bg-superficie p-3',
        vencido ? 'border-peligro' : 'border-transparent',
      )}
    >
      <Link href={`/comercios/${comercio.id}`} className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-lg leading-tight font-bold">{tituloComercio(comercio)}</h2>
          <span className="shrink-0 text-sm font-semibold text-texto-suave">
            Zona {comercio.zona.numero}
          </span>
        </div>
        {comercio.nombre && comercio.direccion && (
          <p className="text-texto-suave">{comercio.direccion}</p>
        )}
        <p className="text-texto-suave">
          {ETIQUETAS.rubro[comercio.rubro]}
          {comercio.contactoNombre && ` · ${comercio.contactoNombre}`}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <EtiquetaEstado estado={comercio.estado} />
          <EtiquetaInteres interes={comercio.interes} />
          {comercio.volverEl && (
            <span className={unir('text-sm font-bold', vencido ? 'text-peligro' : 'text-texto')}>
              Volver {fechaCorta(comercio.volverEl)}
            </span>
          )}
        </div>
      </Link>
      <AccionesContacto comercio={comercio} />
    </article>
  );
}
