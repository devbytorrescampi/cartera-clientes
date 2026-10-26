import { Rol } from '@prisma/client';

/** Datos del usuario autenticado que viajan en cada request. */
export interface UsuarioSesion {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
}

export interface PayloadJwt {
  sub: string;
  rol: Rol;
  /** Versión de sesión del usuario al emitir el token (ver Usuario.sesionVersion). */
  v: number;
}

/** Lo necesario para emitir un token. */
export interface UsuarioParaToken extends UsuarioSesion {
  sesionVersion: number;
}

declare module 'express' {
  interface Request {
    usuario?: UsuarioSesion;
  }
}
