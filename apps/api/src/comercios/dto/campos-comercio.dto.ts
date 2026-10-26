import { ApiPropertyOptional } from '@nestjs/swagger';
import { Atendio, ControlStock, Facturacion, Interes } from '@prisma/client';
import { IsEnum, IsISO8601, IsNumber, IsOptional, Matches, Max, Min } from 'class-validator';
import { TextoOpcional } from '../../comun/validacion';

/**
 * Campos opcionales comunes al alta y a la edición. En la edición, mandar null borra el valor.
 * Las reglas que cruzan campos (nombre o dirección, lat con lng, código de área con número)
 * se validan en el servicio, porque en una edición dependen de lo que ya está guardado.
 */
export class CamposComercioDto {
  @TextoOpcional(150)
  nombre?: string | null;

  /** Calle y altura, o esquina. */
  @TextoOpcional(200)
  direccion?: string | null;

  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(-90)
  @Max(90)
  lat?: number | null;

  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(-180)
  @Max(180)
  lng?: number | null;

  @ApiPropertyOptional({ enum: Atendio, nullable: true })
  @IsOptional()
  @IsEnum(Atendio)
  atendio?: Atendio | null;

  /** Quién decide. */
  @TextoOpcional(120)
  contactoNombre?: string | null;

  /** Código de área, con o sin 0 (ej.: 381 o 0381). */
  @TextoOpcional(6)
  telefonoCodArea?: string | null;

  /** Número local, con o sin 15 (ej.: 155123456). */
  @TextoOpcional(20)
  telefonoNumero?: string | null;

  @ApiPropertyOptional({ enum: Facturacion, nullable: true })
  @IsOptional()
  @IsEnum(Facturacion)
  facturacion?: Facturacion | null;

  @ApiPropertyOptional({ enum: ControlStock, nullable: true })
  @IsOptional()
  @IsEnum(ControlStock)
  stock?: ControlStock | null;

  /** Si usa otro sistema, cuál. */
  @TextoOpcional(120)
  sistemaActual?: string | null;

  @ApiPropertyOptional({ enum: Interes, nullable: true })
  @IsOptional()
  @IsEnum(Interes)
  interes?: Interes | null;

  /** Fecha para volver, AAAA-MM-DD. */
  @ApiPropertyOptional({ example: '2026-11-15', nullable: true })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'volverEl debe tener el formato AAAA-MM-DD' })
  @IsISO8601({ strict: true })
  volverEl?: string | null;

  @TextoOpcional(5000)
  notas?: string | null;
}
