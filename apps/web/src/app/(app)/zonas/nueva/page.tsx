'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Encabezado } from '@/components/encabezado';
import { FormularioZona } from '@/components/formulario-zona';
import { Cargando } from '@/components/ui';

export default function PaginaNuevaZona() {
  return (
    <Suspense fallback={<Cargando />}>
      <NuevaZona />
    </Suspense>
  );
}

/** ?tipo=RUTA abre el formulario con Ruta elegida; si no, Zona. */
function NuevaZona() {
  const tipo = useSearchParams().get('tipo') === 'RUTA' ? 'RUTA' : 'ZONA';
  return (
    <>
      <Encabezado titulo={tipo === 'RUTA' ? 'Nueva ruta' : 'Nueva zona'} atras="/zonas" />
      <main className="mx-auto max-w-lg p-4">
        <FormularioZona tipoInicial={tipo} />
      </main>
    </>
  );
}
