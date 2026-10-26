// Fuente única de los enums de dominio. Los valores coinciden con los enums de Prisma.

export const ROLES = ['ADMIN', 'VENDEDOR'] as const;
export type Rol = (typeof ROLES)[number];

export const RUBROS = ['ALMACEN', 'FERRETERIA', 'INDUMENTARIA', 'KIOSCO', 'OTRO'] as const;
export type Rubro = (typeof RUBROS)[number];

export const ATENDIO = ['DUENO', 'EMPLEADO'] as const;
export type Atendio = (typeof ATENDIO)[number];

export const FACTURACION = ['TALONARIO', 'WEB_ARCA', 'OTRO_SISTEMA', 'NO_FACTURA'] as const;
export type Facturacion = (typeof FACTURACION)[number];

export const CONTROL_STOCK = ['CUADERNO', 'EXCEL', 'SISTEMA', 'NO_CONTROLA'] as const;
export type ControlStock = (typeof CONTROL_STOCK)[number];

export const INTERES = ['ALTO', 'MEDIO', 'BAJO'] as const;
export type Interes = (typeof INTERES)[number];

export const ESTADOS_COMERCIO = [
  'RELEVADO',
  'DEMO_AGENDADA',
  'DEMO_HECHA',
  'CLIENTE',
  'DESCARTADO',
] as const;
export type EstadoComercio = (typeof ESTADOS_COMERCIO)[number];

export const TIPOS_VISITA = ['RELEVAMIENTO', 'DEMO', 'SEGUIMIENTO', 'LLAMADA_WHATSAPP'] as const;
export type TipoVisita = (typeof TIPOS_VISITA)[number];

export const ETIQUETAS = {
  rol: { ADMIN: 'Admin', VENDEDOR: 'Vendedor' },
  rubro: {
    ALMACEN: 'Almacén/autoservicio',
    FERRETERIA: 'Ferretería/corralón',
    INDUMENTARIA: 'Indumentaria/calzado',
    KIOSCO: 'Kiosco/librería/regalería',
    OTRO: 'Otro',
  },
  atendio: { DUENO: 'Dueño', EMPLEADO: 'Empleado' },
  facturacion: {
    TALONARIO: 'Talonario manual',
    WEB_ARCA: 'Web de ARCA',
    OTRO_SISTEMA: 'Otro sistema',
    NO_FACTURA: 'No factura',
  },
  stock: {
    CUADERNO: 'Cuaderno',
    EXCEL: 'Excel',
    SISTEMA: 'Sistema',
    NO_CONTROLA: 'No lo controla',
  },
  interes: { ALTO: 'Alto', MEDIO: 'Medio', BAJO: 'Bajo' },
  estado: {
    RELEVADO: 'Relevado',
    DEMO_AGENDADA: 'Demo agendada',
    DEMO_HECHA: 'Demo hecha',
    CLIENTE: 'Cliente',
    DESCARTADO: 'Descartado',
  },
  tipoVisita: {
    RELEVAMIENTO: 'Relevamiento',
    DEMO: 'Demo',
    SEGUIMIENTO: 'Seguimiento',
    LLAMADA_WHATSAPP: 'Llamada/WhatsApp',
  },
} as const satisfies {
  rol: Record<Rol, string>;
  rubro: Record<Rubro, string>;
  atendio: Record<Atendio, string>;
  facturacion: Record<Facturacion, string>;
  stock: Record<ControlStock, string>;
  interes: Record<Interes, string>;
  estado: Record<EstadoComercio, string>;
  tipoVisita: Record<TipoVisita, string>;
};
