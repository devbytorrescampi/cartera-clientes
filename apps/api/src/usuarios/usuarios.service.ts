import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Rol } from '@prisma/client';
import { hashearPassword } from '../auth/auth.service';
import { UsuarioSesion } from '../auth/usuario-sesion';
import { PrismaService } from '../prisma/prisma.service';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { UsuarioDto } from './dto/usuario.dto';

const SELECCION = {
  id: true,
  email: true,
  nombre: true,
  rol: true,
  activo: true,
  creadoEn: true,
  _count: { select: { comercios: { where: { eliminadoEn: null } } } },
} satisfies Prisma.UsuarioSelect;

type UsuarioSeleccionado = Prisma.UsuarioGetPayload<{ select: typeof SELECCION }>;

const aDto = ({ _count, ...usuario }: UsuarioSeleccionado): UsuarioDto => ({
  ...usuario,
  comercios: _count.comercios,
});

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(): Promise<UsuarioDto[]> {
    const usuarios = await this.prisma.usuario.findMany({
      select: SELECCION,
      orderBy: [{ activo: 'desc' }, { nombre: 'asc' }],
    });
    return usuarios.map(aDto);
  }

  async crear(dto: CrearUsuarioDto): Promise<UsuarioDto> {
    const { password, ...datos } = dto;
    try {
      return aDto(
        await this.prisma.usuario.create({
          data: { ...datos, passwordHash: await hashearPassword(password) },
          select: SELECCION,
        }),
      );
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Ya existe un usuario con ese email');
      }
      throw error;
    }
  }

  async actualizar(
    id: string,
    dto: ActualizarUsuarioDto,
    actual: UsuarioSesion,
  ): Promise<UsuarioDto> {
    await this.existente(id);
    // Así el admin no se puede dejar afuera a sí mismo por error.
    if (id === actual.id && (dto.activo === false || (dto.rol && dto.rol !== Rol.ADMIN))) {
      throw new BadRequestException('No podés darte de baja ni quitarte el rol de administrador');
    }
    return aDto(await this.prisma.usuario.update({ where: { id }, data: dto, select: SELECCION }));
  }

  /** Pone una contraseña nueva y cierra todas las sesiones abiertas del usuario. */
  async resetearPassword(id: string, nueva: string): Promise<void> {
    await this.existente(id);
    await this.prisma.usuario.update({
      where: { id },
      data: { passwordHash: await hashearPassword(nueva), sesionVersion: { increment: 1 } },
    });
  }

  private async existente(id: string): Promise<void> {
    const usuario = await this.prisma.usuario.findUnique({ where: { id }, select: { id: true } });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
  }
}
