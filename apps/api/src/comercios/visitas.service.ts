import { Injectable } from '@nestjs/common';
import { UsuarioSesion } from '../auth/usuario-sesion';
import { PrismaService } from '../prisma/prisma.service';
import { ComerciosService } from './comercios.service';
import { VisitaDto } from './dto/comercio.dto';
import { NuevaVisitaDto } from './dto/nueva-visita.dto';

const INCLUIR_USUARIO = { usuario: { select: { id: true, nombre: true } } } as const;

@Injectable()
export class VisitasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly comercios: ComerciosService,
  ) {}

  async listar(comercioId: string, usuario: UsuarioSesion): Promise<VisitaDto[]> {
    await this.comercios.buscarVisible(comercioId, usuario);
    const visitas = await this.prisma.visita.findMany({
      where: { comercioId },
      include: INCLUIR_USUARIO,
      orderBy: { fecha: 'desc' },
    });
    return visitas.map(({ usuarioId: _u, creadoEn: _c, ...visita }) => visita);
  }

  async crear(comercioId: string, dto: NuevaVisitaDto, usuario: UsuarioSesion): Promise<VisitaDto> {
    await this.comercios.buscarVisible(comercioId, usuario);
    this.comercios.validarFechaVisita(dto.fecha);
    const {
      usuarioId: _u,
      creadoEn: _c,
      ...visita
    } = await this.prisma.visita.create({
      data: {
        comercioId,
        tipo: dto.tipo,
        fecha: dto.fecha ? new Date(dto.fecha) : undefined,
        resultado: dto.resultado ?? null,
        notas: dto.notas ?? null,
        usuarioId: usuario.id,
      },
      include: INCLUIR_USUARIO,
    });
    return visita;
  }
}
