'use client';

import { Encabezado } from '@/components/encabezado';
import { FormularioZona } from '@/components/formulario-zona';

export default function PaginaNuevaZona() {
  return (
    <>
      <Encabezado titulo="Nueva zona" atras="/zonas" />
      <main className="mx-auto max-w-lg p-4">
        <FormularioZona />
      </main>
    </>
  );
}
