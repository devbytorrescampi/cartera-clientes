import { ApiProperty } from '@nestjs/swagger';
import { TipoZona } from '@prisma/client';
import type { Punto } from '@tcshop/shared';

export class ZonaDto {
  id!: number;
  @ApiProperty({ enum: TipoZona }) tipo!: TipoZona;
  numero!: number;
  nombre!: string;
  descripcion!: string;

  @ApiProperty({ type: 'array', items: { type: 'array', items: { type: 'number' } } })
  puntos!: Punto[];

  nota!: string | null;
  activa!: boolean;
}
