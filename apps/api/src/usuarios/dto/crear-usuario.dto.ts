import { ApiProperty } from '@nestjs/swagger';
import { Rol } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import { RecortarTexto } from '../../comun/validacion';

export class CrearUsuarioDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'El email no es válido' })
  @MaxLength(254)
  email!: string;

  @RecortarTexto()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  nombre!: string;

  @ApiProperty({ enum: Rol })
  @IsEnum(Rol)
  rol!: Rol;

  /** Contraseña inicial, mínimo 12 caracteres. El usuario la puede cambiar desde Mi cuenta. */
  @IsString()
  @MinLength(12, { message: 'La contraseña debe tener al menos 12 caracteres' })
  @MaxLength(256)
  password!: string;
}
