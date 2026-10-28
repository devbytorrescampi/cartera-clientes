import { registerDecorator, ValidationOptions } from 'class-validator';

/** Una ruta necesita al menos A y B; una zona, al menos 3 esquinas (lo valida el servicio). */
export const MIN_PUNTOS = 2;
export const MIN_ESQUINAS_ZONA = 3;
export const MAX_PUNTOS = 50;

const esCoordenada = (valor: unknown, limite: number): boolean =>
  typeof valor === 'number' && Number.isFinite(valor) && Math.abs(valor) <= limite;

/** Lista de entre 2 y 50 puntos [lat, lng] con coordenadas válidas. */
export function EsListaDePuntos(opciones?: ValidationOptions) {
  return (objeto: object, propiedad: string) =>
    registerDecorator({
      name: 'esListaDePuntos',
      target: objeto.constructor,
      propertyName: propiedad,
      options: {
        message: `${propiedad} debe ser una lista de ${MIN_PUNTOS} a ${MAX_PUNTOS} puntos [lat, lng] válidos`,
        ...opciones,
      },
      validator: {
        validate: (valor: unknown) =>
          Array.isArray(valor) &&
          valor.length >= MIN_PUNTOS &&
          valor.length <= MAX_PUNTOS &&
          valor.every(
            (punto: unknown) =>
              Array.isArray(punto) &&
              punto.length === 2 &&
              esCoordenada(punto[0], 90) &&
              esCoordenada(punto[1], 180),
          ),
      },
    });
}
