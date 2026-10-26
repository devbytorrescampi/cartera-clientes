import { IsString, MaxLength, MinLength } from 'class-validator';

export class CambiarPasswordDto {
  @IsString()
  @MinLength(1)
  @MaxLength(256)
  actual!: string;

  /** Mínimo 12 caracteres. */
  @IsString()
  @MinLength(12, { message: 'La contraseña nueva debe tener al menos 12 caracteres' })
  @MaxLength(256)
  nueva!: string;
}
