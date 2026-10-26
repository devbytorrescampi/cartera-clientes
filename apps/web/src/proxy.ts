import { NextResponse, type NextRequest } from 'next/server';

const COOKIES_SESION = ['__Host-tcshop_session', 'tcshop_session'];

// Redirige al login si no hay cookie de sesión. Es solo para la navegación:
// la validación real del token la hace la API en cada request.
export function proxy(request: NextRequest) {
  const tieneSesion = COOKIES_SESION.some((nombre) => request.cookies.has(nombre));
  if (tieneSesion) return NextResponse.next();

  const login = new URL('/login', request.url);
  const destino = request.nextUrl.pathname + request.nextUrl.search;
  if (destino !== '/') login.searchParams.set('next', destino);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: [
    '/((?!api|login|_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|ico|webmanifest)$).*)',
  ],
};
