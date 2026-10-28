import { ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoComercio, Interes, Rubro } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';
import { PaginacionDto } from '../../comun/dto/paginacion.dto';
import { RecortarTexto } from '../../comun/validacion';

/** Columnas por las que se puede ordenar la lista. */
export const ORDENES = [
  'actualizadoEn',
  'creadoEn',
  'nombre',
  'zona',
  'rubro',
  'interes',
  'estado',
  'volverEl',
  'creadoPor',
] as const;
export type Orden = (typeof ORDENES)[number];

export class FiltrosComerciosDto extends PaginacionDto {
  /** Busca en nombre, dirección, notas y contacto. */
  @RecortarTexto()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  zonaId?: number;

  @ApiPropertyOptional({ enum: Rubro })
  @IsOptional()
  @IsEnum(Rubro)
  rubro?: Rubro;

  @ApiPropertyOptional({ enum: Interes })
  @IsOptional()
  @IsEnum(Interes)
  interes?: Interes;

  @ApiPropertyOptional({ enum: EstadoComercio })
  @IsOptional()
  @IsEnum(EstadoComercio)
  estado?: EstadoComercio;

  /** Solo los cargados por este usuario. Para un vendedor no cambia nada: ya ve solo los suyos. */
  @IsOptional()
  @IsUUID('4')
  creadoPorId?: string;

  /** Por defecto, los modificados más recientemente primero. */
  @ApiPropertyOptional({ enum: ORDENES })
  @IsOptional()
  @IsIn(ORDENES)
  orden?: Orden;

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  direccion?: 'asc' | 'desc';
}
