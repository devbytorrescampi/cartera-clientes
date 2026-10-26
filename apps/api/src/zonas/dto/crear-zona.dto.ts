import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import type { Punto } from '@tcshop/shared';
import { RecortarTexto, TextoOpcional } from '../../comun/validacion';
import { EsPoligono } from './poligono.validator';

export class CrearZonaDto {
  /** Número de zona, único (1, 2, 3…). */
  @IsInt()
  @Min(1)
  @Max(9999)
  numero!: number;

  /** Ej.: "Zona 1 – Oeste cercano". */
  @RecortarTexto()
  @IsString()
  @MaxLength(120)
  nombre!: string;

  /** Calles que encierran la zona. */
  @RecortarTexto()
  @IsString()
  @MaxLength(500)
  limites!: string;

  @ApiProperty({
    description: 'Esquinas en orden, como [lat, lng]',
    type: 'array',
    items: { type: 'array', items: { type: 'number' }, minItems: 2, maxItems: 2 },
    example: [
      [-26.816, -65.2154],
      [-26.8115, -65.2382],
      [-26.8231, -65.2412],
    ],
  })
  @EsPoligono()
  poligono!: Punto[];

  @TextoOpcional(500)
  nota?: string | null;

  @IsOptional()
  @IsBoolean()
  activa?: boolean;
}
