/** Solo acepta rutas internas, para que ?next= no sirva como redirección abierta a otro sitio. */
export function rutaInternaSegura(destino: string | null | undefined): string {
  if (!destino || !destino.startsWith('/') || destino.startsWith('//') || destino.includes('\\')) {
    return '/';
  }
  return destino;
}
