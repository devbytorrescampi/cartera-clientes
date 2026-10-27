import { normalizarClave } from '../comun/csv';

/** Columnas del CSV, en el orden en que se exportan. El importador las busca por nombre. */
export const COLUMNAS = {
  zona: 'Zona',
  nombre: 'Nombre',
  direccion: 'Dirección',
  rubro: 'Rubro',
  atendio: 'Atendió',
  contactoNombre: 'Decide',
  facturacion: 'Factura',
  sistemaActual: 'Sistema actual',
  stock: 'Stock',
  interes: 'Interés',
  estado: 'Estado',
  telefonoCodArea: 'Cód. área',
  telefonoNumero: 'Teléfono',
  volverEl: 'Volver el',
  notas: 'Notas',
  lat: 'Latitud',
  lng: 'Longitud',
  creadoEn: 'Creado',
  id: 'Id',
} as const;

export type Columna = keyof typeof COLUMNAS;

/** Columnas sin las que no se puede importar. */
export const COLUMNAS_OBLIGATORIAS: Columna[] = ['zona', 'rubro'];

/** Mapea cada columna a su posición en el encabezado del archivo (null si no está). */
export function ubicarColumnas(encabezado: string[]): Record<Columna, number | null> {
  const posiciones = encabezado.map(normalizarClave);
  return Object.fromEntries(
    Object.entries(COLUMNAS).map(([clave, titulo]) => {
      const indice = posiciones.indexOf(normalizarClave(titulo));
      return [clave, indice === -1 ? null : indice];
    }),
  ) as Record<Columna, number | null>;
}

/**
 * Busca un valor de enum por su código (ALMACEN) o su etiqueta (Almacén/autoservicio),
 * sin importar mayúsculas ni acentos. Devuelve null si no coincide con ninguno.
 */
export function leerEnum<T extends string>(etiquetas: Record<T, string>, texto: string): T | null {
  const buscado = normalizarClave(texto);
  for (const [codigo, etiqueta] of Object.entries(etiquetas) as [T, string][]) {
    if (normalizarClave(codigo) === buscado || normalizarClave(etiqueta) === buscado) {
      return codigo;
    }
  }
  return null;
}

/** Las etiquetas válidas de un enum, para los mensajes de error. */
export const opciones = (etiquetas: Record<string, string>): string =>
  Object.values(etiquetas).join(', ');
