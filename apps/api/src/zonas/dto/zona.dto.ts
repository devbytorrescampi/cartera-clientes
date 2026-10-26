import { ApiProperty } from '@nestjs/swagger';
import type { Punto } from '@tcshop/shared';

export class ZonaDto {
  id!: number;
  numero!: number;
  nombre!: string;
  limites!: string;

  @ApiProperty({ type: 'array', items: { type: 'array', items: { type: 'number' } } })
  poligono!: Punto[];

  nota!: string | null;
  activa!: boolean;
}
