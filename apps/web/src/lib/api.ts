import type { Rol } from '@tcshop/shared';

export interface UsuarioSesion {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
}

export class ErrorApi extends Error {
  constructor(
    readonly estado: number,
    mensaje: string,
  ) {
    super(mensaje);
  }
}

/** Llama a la API a través del proxy /api del propio front. */
export async function api<T>(ruta: string, init?: RequestInit): Promise<T> {
  const respuesta = await fetch(`/api${ruta}`, {
    ...init,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });

  if (!respuesta.ok) {
    const cuerpo = (await respuesta.json().catch(() => null)) as { message?: unknown } | null;
    const mensaje = Array.isArray(cuerpo?.message)
      ? cuerpo.message.join('. ')
      : typeof cuerpo?.message === 'string'
        ? cuerpo.message
        : 'Error inesperado';
    throw new ErrorApi(respuesta.status, mensaje);
  }
  return respuesta.status === 204 ? (undefined as T) : ((await respuesta.json()) as T);
}
