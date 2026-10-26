'use client';

import { Encabezado } from '@/components/encabezado';
import { TarjetaComercio } from '@/components/tarjeta-comercio';
import { Cargando, MensajeError, unir } from '@/components/ui';
import type { ListaVolver, SituacionVolver } from '@/lib/tipos';
import { useApi } from '@/lib/usar-api';

const SECCIONES: { situacion: SituacionVolver; titulo: string; clase: string }[] = [
  { situacion: 'VENCIDO', titulo: 'Vencidos', clase: 'text-peligro' },
  { situacion: 'HOY', titulo: 'Para hoy', clase: 'text-primario' },
  { situacion: 'PROXIMO', titulo: 'Próximos', clase: '' },
  { situacion: 'SIN_FECHA', titulo: 'Sin fecha', clase: 'text-texto-suave' },
];

/** Interesados (alto o medio) que todavía no son clientes ni descartados. */
export default function PaginaVolver() {
  const { datos, error } = useApi<ListaVolver>('/comercios/volver');

  return (
    <>
      <Encabezado titulo="Volver" />
      <main className="mx-auto flex max-w-lg flex-col gap-6 p-4">
        <MensajeError>{error}</MensajeError>
        {!datos && !error && <Cargando />}
        {datos && datos.items.length === 0 && (
          <p className="py-8 text-center text-texto-suave">
            No hay interesados pendientes. Los comercios con interés alto o medio que todavía no son
            clientes aparecen acá.
          </p>
        )}
        {datos &&
          SECCIONES.map(({ situacion, titulo, clase }) => {
            const items = datos.items.filter((c) => c.situacion === situacion);
            if (items.length === 0) return null;
            return (
              <section key={situacion} className="flex flex-col gap-3">
                <h2 className={unir('text-xl font-bold', clase)}>
                  {titulo} ({items.length})
                </h2>
                {items.map((comercio) => (
                  <TarjetaComercio
                    key={comercio.id}
                    comercio={comercio}
                    vencido={situacion === 'VENCIDO'}
                  />
                ))}
              </section>
            );
          })}
      </main>
    </>
  );
}
