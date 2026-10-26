import { registerDecorator, ValidationOptions } from 'class-validator';

export const MIN_ESQUINAS = 3;
export const MAX_ESQUINAS = 50;

const esCoordenada = (valor: unknown, limite: number): boolean =>
  typeof valor === 'number' && Number.isFinite(valor) && Math.abs(valor) <= limite;

/** Lista de entre 3 y 50 esquinas [lat, lng] con coordenadas válidas. */
export function EsPoligono(opciones?: ValidationOptions) {
  return (objeto: object, propiedad: string) =>
    registerDecorator({
      name: 'esPoligono',
      target: objeto.constructor,
      propertyName: propiedad,
      options: {
        message: `${propiedad} debe ser una lista de ${MIN_ESQUINAS} a ${MAX_ESQUINAS} esquinas [lat, lng] válidas`,
        ...opciones,
      },
      validator: {
        validate: (valor: unknown) =>
          Array.isArray(valor) &&
          valor.length >= MIN_ESQUINAS &&
          valor.length <= MAX_ESQUINAS &&
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
