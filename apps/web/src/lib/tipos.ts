import type {
  Atendio,
  ControlStock,
  EstadoComercio,
  Facturacion,
  Interes,
  Punto,
  Rol,
  Rubro,
  TipoVisita,
} from '@tcshop/shared';

// Formas de las respuestas de la API (ver Swagger en /docs).

export interface UsuarioSesion {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
}

export interface Zona {
  id: number;
  numero: number;
  nombre: string;
  limites: string;
  poligono: Punto[];
  nota: string | null;
  activa: boolean;
}

export interface Referencia<T = string> {
  id: T;
  nombre: string;
}

export interface Comercio {
  id: string;
  zonaId: number;
  zona: Referencia<number> & { numero: number };
  nombre: string | null;
  direccion: string | null;
  lat: number | null;
  lng: number | null;
  rubro: Rubro;
  atendio: Atendio | null;
  contactoNombre: string | null;
  telefonoCodArea: string | null;
  telefonoNumero: string | null;
  whatsapp: string | null;
  facturacion: Facturacion | null;
  stock: ControlStock | null;
  sistemaActual: string | null;
  interes: Interes | null;
  estado: EstadoComercio;
  volverEl: string | null;
  notas: string | null;
  creadoPor: Referencia;
  creadoEn: string;
  actualizadoEn: string;
}

export interface Pagina<T> {
  items: T[];
  total: number;
  pagina: number;
  porPagina: number;
}

export interface Visita {
  id: string;
  comercioId: string;
  fecha: string;
  tipo: TipoVisita;
  resultado: string | null;
  notas: string | null;
  usuario: Referencia;
}

export interface PosibleDuplicado {
  id: string;
  nombre: string | null;
  direccion: string | null;
  zona: Referencia<number> & { numero: number };
  motivos: ('MISMO_NOMBRE' | 'CERCANIA')[];
  distanciaM: number | null;
}

export interface ResumenVolver {
  vencidos: number;
  paraHoy: number;
}

export interface PuntoMapa {
  id: string;
  zonaId: number;
  nombre: string | null;
  direccion: string | null;
  lat: number;
  lng: number;
  interes: Interes | null;
  estado: EstadoComercio;
}

export interface EstadisticaZona {
  zonaId: number;
  numero: number;
  nombre: string;
  relevados: number;
  interesAlto: number;
  clientes: number;
  conversion: number;
}

export type SituacionVolver = 'VENCIDO' | 'HOY' | 'PROXIMO' | 'SIN_FECHA';

export interface ListaVolver extends ResumenVolver {
  items: (Comercio & { situacion: SituacionVolver })[];
}

export interface FilaImportacion {
  fila: number;
  nombre: string | null;
  direccion: string | null;
  zona: string | null;
  resultado: 'NUEVO' | 'EXISTE' | 'ERROR';
  errores: string[];
  advertencias: string[];
}

export interface ResultadoImportacion {
  filas: FilaImportacion[];
  nuevos: number;
  existentes: number;
  conErrores: number;
  importados: number;
}
