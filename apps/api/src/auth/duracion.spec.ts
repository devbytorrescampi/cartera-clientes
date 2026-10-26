import { duracionEnMs } from './duracion';

describe('duracionEnMs', () => {
  it('convierte las unidades soportadas', () => {
    expect(duracionEnMs('30s')).toBe(30_000);
    expect(duracionEnMs('15m')).toBe(900_000);
    expect(duracionEnMs('12h')).toBe(43_200_000);
    expect(duracionEnMs('7d')).toBe(604_800_000);
  });

  it('rechaza formatos inválidos', () => {
    expect(() => duracionEnMs('7 días')).toThrow();
    expect(() => duracionEnMs('')).toThrow();
  });
});
