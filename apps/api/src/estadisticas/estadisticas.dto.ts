export class EstadisticaZonaDto {
  zonaId!: number;
  numero!: number;
  nombre!: string;
  relevados!: number;
  interesAlto!: number;
  clientes!: number;
  /** clientes / relevados, entre 0 y 1. */
  conversion!: number;
}
