import { ApiPropertyOptional } from '@nestjs/swagger';
import { Rol } from '@prisma/client';
import { IsBoolean, IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import { OpcionalNoNulo, RecortarTexto } from '../../comun/validacion';

export class ActualizarUsuarioDto {
  @RecortarTexto()
  @OpcionalNoNulo()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  nombre?: string;

  @ApiPropertyOptional({ enum: Rol })
  @OpcionalNoNulo()
  @IsEnum(Rol)
  rol?: Rol;

  /** false = baja: corta su sesión al instante. Sus comercios se conservan. */
  @OpcionalNoNulo()
  @IsBoolean()
  activo?: boolean;
}

export class ResetearPasswordDto {
  /** Mínimo 12 caracteres. Cierra todas las sesiones del usuario. */
  @IsString()
  @MinLength(12, { message: 'La contraseña debe tener al menos 12 caracteres' })
  @MaxLength(256)
  nueva!: string;
}
