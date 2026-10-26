import { ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoComercio, Interes, Rubro } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { PaginacionDto } from '../../comun/dto/paginacion.dto';
import { RecortarTexto } from '../../comun/validacion';

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
}
