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
  let respuesta: Response;
  try {
    respuesta = await fetch(`/api${ruta}`, {
      ...init,
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
  } catch {
    throw new ErrorApi(0, 'No hay conexión. Revisá la señal y probá de nuevo.');
  }

  // Sesión vencida o cerrada en otro dispositivo: volver al login, salvo en el propio login.
  if (respuesta.status === 401 && !ruta.startsWith('/auth/login')) {
    const destino = window.location.pathname + window.location.search;
    // Recarga completa a propósito: descarta el estado de la sesión vencida.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = `/login?next=${encodeURIComponent(destino)}`;
  }

  if (!respuesta.ok) {
    const cuerpo = (await respuesta.json().catch(() => null)) as { message?: unknown } | null;
    const mensaje = Array.isArray(cuerpo?.message)
      ? cuerpo.message.join('. ')
      : typeof cuerpo?.message === 'string'
        ? cuerpo.message
        : respuesta.status >= 500
          ? 'Error del servidor. Probá de nuevo en un momento.'
          : 'Error inesperado';
    throw new ErrorApi(respuesta.status, mensaje);
  }
  return respuesta.status === 204 ? (undefined as T) : ((await respuesta.json()) as T);
}

export const enviar = <T>(metodo: 'POST' | 'PATCH' | 'DELETE', ruta: string, cuerpo?: unknown) =>
  api<T>(ruta, { method: metodo, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) });

/** Arma un query string ignorando los valores vacíos. */
export function query(parametros: Record<string, string | number | undefined | null>): string {
  const busqueda = new URLSearchParams();
  for (const [clave, valor] of Object.entries(parametros)) {
    if (valor !== undefined && valor !== null && valor !== '') busqueda.set(clave, String(valor));
  }
  const texto = busqueda.toString();
  return texto ? `?${texto}` : '';
}

export const mensajeDeError = (error: unknown): string =>
  error instanceof Error ? error.message : 'Error inesperado';
