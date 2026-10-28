import { ApiProperty } from '@nestjs/swagger';
import { Rol } from '@prisma/client';

export class UsuarioDto {
  id!: string;
  email!: string;
  nombre!: string;
  @ApiProperty({ enum: Rol }) rol!: Rol;
  activo!: boolean;
  creadoEn!: Date;
  /** Comercios cargados por el usuario (sin contar los eliminados). */
  comercios!: number;
}
