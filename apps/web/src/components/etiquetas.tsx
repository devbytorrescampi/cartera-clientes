import { ETIQUETAS, type EstadoComercio, type Interes } from '@tcshop/shared';
import { unir } from './ui';

const COLOR_INTERES: Record<Interes, string> = {
  ALTO: 'border-exito text-exito',
  MEDIO: 'border-alerta text-alerta',
  BAJO: 'border-borde text-texto-suave',
};

export function EtiquetaInteres({ interes }: { interes: Interes | null }) {
  if (!interes) return null;
  return (
    <span
      className={unir(
        'rounded-full border-2 px-2 text-sm leading-6 font-bold',
        COLOR_INTERES[interes],
      )}
    >
      Interés {ETIQUETAS.interes[interes].toLowerCase()}
    </span>
  );
}

export function EtiquetaEstado({ estado }: { estado: EstadoComercio }) {
  const destacado = estado === 'CLIENTE';
  return (
    <span
      className={unir(
        'rounded-full px-2 text-sm leading-7 font-bold',
        destacado ? 'bg-exito text-fondo' : 'bg-superficie-2 text-texto',
      )}
    >
      {ETIQUETAS.estado[estado]}
    </span>
  );
}
