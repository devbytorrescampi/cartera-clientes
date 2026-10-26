import { ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoComercio, Rubro } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min, ValidateNested } from 'class-validator';
import { OpcionalNoNulo } from '../../comun/validacion';
import { CamposComercioDto } from './campos-comercio.dto';
import { NuevaVisitaDto } from './nueva-visita.dto';

export class ActualizarComercioDto extends CamposComercioDto {
  @OpcionalNoNulo()
  @IsInt()
  @Min(1)
  zonaId?: number;

  @ApiPropertyOptional({ enum: Rubro })
  @OpcionalNoNulo()
  @IsEnum(Rubro)
  rubro?: Rubro;

  @ApiPropertyOptional({ enum: EstadoComercio })
  @OpcionalNoNulo()
  @IsEnum(EstadoComercio)
  estado?: EstadoComercio;

  /** Visita a registrar en el mismo paso (por ejemplo, al cambiar el estado). */
  @IsOptional()
  @ValidateNested()
  @Type(() => NuevaVisitaDto)
  visita?: NuevaVisitaDto;
}
