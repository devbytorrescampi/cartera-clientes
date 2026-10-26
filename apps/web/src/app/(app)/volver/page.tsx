import { Encabezado } from '@/components/encabezado';

// Provisoria: la lista para volver llega en la fase 4.
export default function PaginaVolver() {
  return (
    <>
      <Encabezado titulo="Volver" />
      <main className="mx-auto max-w-lg p-4 text-texto-suave">
        Próximamente: los interesados a los que hay que volver, con los vencidos primero.
      </main>
    </>
  );
}
