const UNIDADES: Record<string, number> = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 };

/** Convierte duraciones como "7d", "12h" o "30m" a milisegundos. */
export function duracionEnMs(duracion: string): number {
  const coincidencia = /^(\d+)([smhd])$/.exec(duracion.trim());
  if (!coincidencia) throw new Error(`Duración inválida: "${duracion}" (usar p. ej. 7d, 12h, 30m)`);
  const [, cantidad, unidad] = coincidencia;
  return Number(cantidad) * UNIDADES[unidad!]!;
}
