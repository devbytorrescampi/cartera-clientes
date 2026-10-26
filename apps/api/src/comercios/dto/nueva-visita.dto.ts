import { ApiProperty } from '@nestjs/swagger';
import { TipoVisita } from '@prisma/client';
import { IsEnum, IsISO8601, IsOptional } from 'class-validator';
import { TextoOpcional } from '../../comun/validacion';

export class NuevaVisitaDto {
  @ApiProperty({ enum: TipoVisita })
  @IsEnum(TipoVisita)
  tipo!: TipoVisita;

  /** Fecha y hora de la visita (ISO 8601). Por defecto, ahora. */
  @IsOptional()
  @IsISO8601({ strict: true })
  fecha?: string;

  @TextoOpcional(500)
  resultado?: string | null;

  @TextoOpcional(2000)
  notas?: string | null;
}
