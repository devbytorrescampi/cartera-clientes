import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Rol, Zona } from '@prisma/client';
import type { Punto } from '@tcshop/shared';
import { UsuarioSesion } from '../auth/usuario-sesion';
import { PrismaService } from '../prisma/prisma.service';
import { ActualizarZonaDto } from './dto/actualizar-zona.dto';
import { CrearZonaDto } from './dto/crear-zona.dto';
import { ZonaDto } from './dto/zona.dto';

const aDto = ({ creadoEn: _c, actualizadoEn: _a, poligono, ...zona }: Zona): ZonaDto => ({
  ...zona,
  poligono: poligono as Punto[],
});

@Injectable()
export class ZonasService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(usuario: UsuarioSesion, incluirInactivas = false): Promise<ZonaDto[]> {
    const verInactivas = incluirInactivas && usuario.rol === Rol.ADMIN;
    const zonas = await this.prisma.zona.findMany({
      where: verInactivas ? {} : { activa: true },
      orderBy: { numero: 'asc' },
    });
    return zonas.map(aDto);
  }

  async obtener(id: number): Promise<ZonaDto> {
    const zona = await this.prisma.zona.findUnique({ where: { id } });
    if (!zona) throw new NotFoundException('Zona no encontrada');
    return aDto(zona);
  }

  async crear(dto: CrearZonaDto): Promise<ZonaDto> {
    return aDto(await this.conNumeroUnico(() => this.prisma.zona.create({ data: dto })));
  }

  async actualizar(id: number, dto: ActualizarZonaDto): Promise<ZonaDto> {
    await this.obtener(id);
    return aDto(
      await this.conNumeroUnico(() => this.prisma.zona.update({ where: { id }, data: dto })),
    );
  }

  /** Baja lógica: la zona deja de ofrecerse pero conserva sus comercios. */
  async darDeBaja(id: number): Promise<ZonaDto> {
    await this.obtener(id);
    return aDto(await this.prisma.zona.update({ where: { id }, data: { activa: false } }));
  }

  private async conNumeroUnico(operacion: () => Promise<Zona>): Promise<Zona> {
    try {
      return await operacion();
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Ya existe una zona con ese número');
      }
      throw error;
    }
  }
}
