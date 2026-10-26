import { Suspense } from 'react';
import { FormularioLogin } from './formulario-login';

export default function PaginaLogin() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-8">
      <h1 className="mb-1 text-3xl font-bold">Relevamiento TCShop</h1>
      <p className="mb-8 text-texto-suave">Ingresá con tu cuenta.</p>
      <Suspense>
        <FormularioLogin />
      </Suspense>
    </main>
  );
}
