import { CookieOptions } from 'express';

const esProduccion = (): boolean => process.env.NODE_ENV === 'production';

// El prefijo __Host- obliga al navegador a exigir secure, path=/ y sin dominio.
// Solo funciona sobre HTTPS, por eso en desarrollo se usa el nombre plano.
export const nombreCookieSesion = (): string =>
  esProduccion() ? '__Host-tcshop_session' : 'tcshop_session';

export const opcionesCookieSesion = (maxAgeMs: number): CookieOptions => ({
  httpOnly: true,
  secure: esProduccion(),
  sameSite: 'lax',
  path: '/',
  maxAge: maxAgeMs,
});
