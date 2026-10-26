import { linkMaps } from '@/lib/formato';
import type { Comercio } from '@/lib/tipos';
import { IconoMapa, IconoTelefono, IconoWhatsApp } from './iconos';

// En fila (lista): ícono y texto lado a lado. Apilado (ficha, con llamada): ícono arriba,
// para que entren tres botones en el ancho de un celular.
const ESTILO_FILA =
  'inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border-2 px-3 font-bold';
const ESTILO_APILADO =
  'flex min-h-16 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl border-2 px-1 text-sm font-bold';

/** Accesos directos a WhatsApp, llamada y Google Maps. Solo muestra los que tienen datos. */
export function AccionesContacto({
  comercio,
  conLlamada = false,
}: {
  comercio: Comercio;
  conLlamada?: boolean;
}) {
  const maps = linkMaps(comercio);
  const telefono = comercio.whatsapp?.replace('https://wa.me/', '+');
  if (!comercio.whatsapp && !maps) return null;
  const ESTILO = conLlamada ? ESTILO_APILADO : ESTILO_FILA;

  return (
    <div className="flex gap-2">
      {comercio.whatsapp && (
        <a
          href={comercio.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className={`${ESTILO} border-whatsapp text-whatsapp`}
        >
          <IconoWhatsApp /> WhatsApp
        </a>
      )}
      {conLlamada && telefono && (
        <a href={`tel:${telefono}`} className={`${ESTILO} border-borde text-texto`}>
          <IconoTelefono /> Llamar
        </a>
      )}
      {maps && (
        <a
          href={maps}
          target="_blank"
          rel="noopener noreferrer"
          className={`${ESTILO} border-borde text-texto`}
        >
          <IconoMapa /> Mapa
        </a>
      )}
    </div>
  );
}
