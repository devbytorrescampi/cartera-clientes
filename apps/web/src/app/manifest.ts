import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Relevamiento TCShop',
    short_name: 'TCShop',
    description: 'Registro de comercios visitados y seguimiento de interesados',
    lang: 'es-AR',
    start_url: '/cargar',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0b5cd5',
    theme_color: '#0b5cd5',
    icons: [
      { src: '/iconos/icono-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/iconos/icono-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      {
        src: '/iconos/icono-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
