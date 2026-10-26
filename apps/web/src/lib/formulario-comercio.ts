import type {
  Atendio,
  ControlStock,
  EstadoComercio,
  Facturacion,
  Interes,
  Rubro,
} from '@tcshop/shared';
import type { Comercio } from './tipos';

/** Estado del formulario: textos como string (vacío = sin dato), opciones como valor o null. */
export interface DatosComercio {
  zonaId: number | null;
  nombre: string;
  direccion: string;
  lat: number | null;
  lng: number | null;
  rubro: Rubro | null;
  atendio: Atendio | null;
  contactoNombre: string;
  telefonoCodArea: string;
  telefonoNumero: string;
  facturacion: Facturacion | null;
  stock: ControlStock | null;
  sistemaActual: string;
  interes: Interes | null;
  estado: EstadoComercio;
  volverEl: string;
  notas: string;
}

/** Característica de San Miguel de Tucumán, precargada para ahorrar tiempo. */
export const COD_AREA_POR_DEFECTO = '381';

export const formularioVacio = (zonaId: number | null): DatosComercio => ({
  zonaId,
  nombre: '',
  direccion: '',
  lat: null,
  lng: null,
  rubro: null,
  atendio: null,
  contactoNombre: '',
  telefonoCodArea: COD_AREA_POR_DEFECTO,
  telefonoNumero: '',
  facturacion: null,
  stock: null,
  sistemaActual: '',
  interes: null,
  estado: 'RELEVADO',
  volverEl: '',
  notas: '',
});

export const desdeComercio = (c: Comercio): DatosComercio => ({
  zonaId: c.zonaId,
  nombre: c.nombre ?? '',
  direccion: c.direccion ?? '',
  lat: c.lat,
  lng: c.lng,
  rubro: c.rubro,
  atendio: c.atendio,
  contactoNombre: c.contactoNombre ?? '',
  telefonoCodArea: c.telefonoCodArea ?? COD_AREA_POR_DEFECTO,
  telefonoNumero: c.telefonoNumero ?? '',
  facturacion: c.facturacion,
  stock: c.stock,
  sistemaActual: c.sistemaActual ?? '',
  interes: c.interes,
  estado: c.estado,
  volverEl: c.volverEl ?? '',
  notas: c.notas ?? '',
});

const texto = (valor: string): string | null => valor.trim() || null;

/** Lo que se manda a la API, con textos vacíos como null y el teléfono solo si hay número. */
function normalizar(d: DatosComercio) {
  const conTelefono = d.telefonoNumero.trim() !== '';
  return {
    zonaId: d.zonaId,
    nombre: texto(d.nombre),
    direccion: texto(d.direccion),
    lat: d.lat,
    lng: d.lng,
    // El rubro es obligatorio en la base, pero para cargar rápido se puede dejar sin elegir.
    rubro: d.rubro ?? 'OTRO',
    atendio: d.atendio,
    contactoNombre: texto(d.contactoNombre),
    telefonoCodArea: conTelefono ? texto(d.telefonoCodArea) : null,
    telefonoNumero: conTelefono ? texto(d.telefonoNumero) : null,
    facturacion: d.facturacion,
    stock: d.stock,
    sistemaActual: texto(d.sistemaActual),
    interes: d.interes,
    estado: d.estado,
    volverEl: d.volverEl || null,
    notas: texto(d.notas),
  };
}

export type CuerpoComercio = ReturnType<typeof normalizar>;

/** Cuerpo para el alta: se omiten los campos vacíos. */
export function cuerpoAlta(d: DatosComercio, id: string): Partial<CuerpoComercio> & { id: string } {
  const cuerpo = Object.fromEntries(
    Object.entries(normalizar(d)).filter(([, valor]) => valor !== null),
  ) as Partial<CuerpoComercio>;
  return { id, ...cuerpo };
}

/** Cuerpo para la edición: solo lo que cambió (null = borrar el dato). */
export function cuerpoCambios(
  original: DatosComercio,
  actual: DatosComercio,
): Partial<CuerpoComercio> {
  const antes = normalizar(original);
  const despues = normalizar(actual);
  const cambios: Partial<CuerpoComercio> = {};
  for (const clave of Object.keys(despues) as (keyof CuerpoComercio)[]) {
    if (antes[clave] !== despues[clave]) {
      (cambios as Record<string, unknown>)[clave] = despues[clave];
    }
  }
  // El teléfono viaja siempre de a par: la API lo valida como conjunto.
  if ('telefonoCodArea' in cambios || 'telefonoNumero' in cambios) {
    cambios.telefonoCodArea = despues.telefonoCodArea;
    cambios.telefonoNumero = despues.telefonoNumero;
  }
  return cambios;
}

export const tieneNombreODireccion = (d: DatosComercio): boolean =>
  d.nombre.trim() !== '' || d.direccion.trim() !== '';
