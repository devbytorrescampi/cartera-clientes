import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoComercio, Rubro } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import { OpcionalNoNulo } from '../../comun/validacion';
import { CamposComercioDto } from './campos-comercio.dto';

export class CrearComercioDto extends CamposComercioDto {
  /**
   * Id generado por el cliente (uuid v4). Si se reenvía el mismo alta, por ejemplo al
   * sincronizar una carga sin conexión, se devuelve el comercio existente en vez de duplicarlo.
   */
  @IsOptional()
  @IsUUID('4')
  id?: string;

  @IsInt()
  @Min(1)
  zonaId!: number;

  @ApiProperty({ enum: Rubro })
  @IsEnum(Rubro)
  rubro!: Rubro;

  @ApiPropertyOptional({ enum: EstadoComercio, default: EstadoComercio.RELEVADO })
  @OpcionalNoNulo()
  @IsEnum(EstadoComercio)
  estado?: EstadoComercio;
}
