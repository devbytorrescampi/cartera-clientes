'use client';

import { useParams } from 'next/navigation';
import { Encabezado } from '@/components/encabezado';
import { FormularioZona } from '@/components/formulario-zona';
import { Cargando, MensajeError } from '@/components/ui';
import type { Zona } from '@/lib/tipos';
import { useApi } from '@/lib/usar-api';

export default function PaginaEditarZona() {
  const { id } = useParams<{ id: string }>();
  const { datos: zona, error } = useApi<Zona>(`/zonas/${id}`);

  return (
    <>
      <Encabezado titulo={zona ? `Editar ${zona.nombre}` : 'Editar zona'} atras="/zonas" />
      <main className="mx-auto max-w-lg p-4">
        <MensajeError>{error}</MensajeError>
        {zona ? <FormularioZona key={zona.id} zona={zona} /> : !error && <Cargando />}
      </main>
    </>
  );
}
