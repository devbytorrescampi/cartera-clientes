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
}

declare module 'express' {
  interface Request {
    usuario?: UsuarioSesion;
  }
}
