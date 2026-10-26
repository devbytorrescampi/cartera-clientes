import { NextResponse, type NextRequest } from 'next/server';

const COOKIES_SESION = ['__Host-tcshop_session', 'tcshop_session'];

export function proxy(request: NextRequest) {
  return request.nextUrl.pathname.startsWith('/api/')
    ? reenviarALaApi(request)
    : exigirSesion(request);
}

/**
 * Reenvía /api/* a la API. El navegador nunca habla con la API directamente: así la cookie
 * de sesión es del mismo origen que la página. Se agregan dos headers que la API verifica:
 * el secreto compartido (para rechazar llamadas que no vengan de acá) y la IP real del cliente
 * (para el límite de intentos). Los que mande el navegador con esos nombres se descartan.
 */
function reenviarALaApi(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const destino = new URL(pathname.slice('/api'.length) + search, process.env.API_URL);

  const headers = new Headers(request.headers);
  headers.delete('x-proxy-secret');
  headers.delete('x-client-ip');
  if (process.env.PROXY_SECRET) headers.set('x-proxy-secret', process.env.PROXY_SECRET);
  // En Vercel, x-real-ip la pone la plataforma con la IP del cliente (no la puede falsear el navegador).
  const ip = request.headers.get('x-real-ip');
  if (ip) headers.set('x-client-ip', ip);

  return NextResponse.rewrite(destino, { request: { headers } });
}

/** Redirige al login si no hay cookie. La validación real del token la hace la API en cada request. */
function exigirSesion(request: NextRequest) {
  const tieneSesion = COOKIES_SESION.some((nombre) => request.cookies.has(nombre));
  if (tieneSesion) return NextResponse.next();

  const login = new URL('/login', request.url);
  const destino = request.nextUrl.pathname + request.nextUrl.search;
  if (destino !== '/') login.searchParams.set('next', destino);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: [
    '/((?!login|_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|ico|webmanifest)$).*)',
  ],
};
