import type { SVGProps } from 'react';

// Íconos de trazo simples (24×24). Toman el color del texto.
function Icono({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

type P = SVGProps<SVGSVGElement>;

export const IconoMas = (p: P) => (
  <Icono {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icono>
);
export const IconoLista = (p: P) => (
  <Icono {...p}>
    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
  </Icono>
);
export const IconoReloj = (p: P) => (
  <Icono {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Icono>
);
export const IconoMapa = (p: P) => (
  <Icono {...p}>
    <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" />
    <path d="M9 4v14M15 6v14" />
  </Icono>
);
export const IconoPin = (p: P) => (
  <Icono {...p}>
    <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </Icono>
);
export const IconoBuscar = (p: P) => (
  <Icono {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Icono>
);
export const IconoFiltro = (p: P) => (
  <Icono {...p}>
    <path d="M3 5h18l-7 8v6l-4 2v-8L3 5Z" />
  </Icono>
);
export const IconoTelefono = (p: P) => (
  <Icono {...p}>
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
  </Icono>
);
export const IconoWhatsApp = (p: P) => (
  <Icono {...p}>
    <path d="M3.5 20.5 5 16a8.5 8.5 0 1 1 3 3l-4.5 1.5Z" />
    <path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.5-2-1-1 .8a4.5 4.5 0 0 1-2.3-2.3l.8-1-1-2L9 8.5Z" />
  </Icono>
);
export const IconoUsuario = (p: P) => (
  <Icono {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </Icono>
);
export const IconoCerrar = (p: P) => (
  <Icono {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icono>
);
export const IconoVolver = (p: P) => (
  <Icono {...p}>
    <path d="M15 18l-6-6 6-6" />
  </Icono>
);
export const IconoCambiar = (p: P) => (
  <Icono {...p}>
    <path d="M7 10l5-5 5 5M7 14l5 5 5-5" />
  </Icono>
);
