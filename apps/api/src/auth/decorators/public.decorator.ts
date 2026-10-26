import { SetMetadata } from '@nestjs/common';

export const ES_PUBLICA = 'esPublica';

/** Marca una ruta como accesible sin sesión. Todas las demás requieren autenticación. */
export const Public = () => SetMetadata(ES_PUBLICA, true);
