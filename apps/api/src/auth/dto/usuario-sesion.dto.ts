import { ApiProperty } from '@nestjs/swagger';
import { Rol } from '@prisma/client';

export class UsuarioSesionDto {
  id!: string;
  email!: string;
  nombre!: string;

  @ApiProperty({ enum: Rol })
  rol!: Rol;
}
