import { ApiProperty } from '@nestjs/swagger';
import { TipoZona } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import type { Punto } from '@tcshop/shared';
import { RecortarTexto, TextoOpcional } from '../../comun/validacion';
import { EsListaDePuntos } from './puntos.validator';

export class CrearZonaDto {
  /** Zona (área) o ruta (línea de A a B). Por defecto, zona. */
  @ApiProperty({ enum: TipoZona, required: false })
  @IsOptional()
  @IsEnum(TipoZona)
  tipo?: TipoZona;

  /** Número único entre zonas y rutas (1, 2, 3…), para que "3" no sea ambiguo. */
  @IsInt()
  @Min(1)
  @Max(9999)
  numero!: number;

  /** Ej.: "Zona 1 – Oeste cercano" o "Ruta 6 – Av. Aconquija". */
  @RecortarTexto()
  @IsString()
  @MaxLength(120)
  nombre!: string;

  /** Zona: las calles que la encierran. Ruta: por dónde va (calle, desde y hasta). */
  @RecortarTexto()
  @IsString()
  @MaxLength(500)
  descripcion!: string;

  @ApiProperty({
    description:
      'En orden, como [lat, lng]. Zona: las esquinas (mínimo 3). Ruta: de A a B con sus quiebres (mínimo 2).',
    type: 'array',
    items: { type: 'array', items: { type: 'number' }, minItems: 2, maxItems: 2 },
    example: [
      [-26.816, -65.2154],
      [-26.8115, -65.2382],
    ],
  })
  @EsListaDePuntos()
  puntos!: Punto[];

  @TextoOpcional(500)
  nota?: string | null;

  @IsOptional()
  @IsBoolean()
  activa?: boolean;
}
