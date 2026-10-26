import { Injectable } from '@nestjs/common';
import { EstadoComercio, Interes } from '@prisma/client';
import { UsuarioSesion } from '../auth/usuario-sesion';
import { alcance } from '../comercios/comercios.service';
import { PrismaService } from '../prisma/prisma.service';
import { EstadisticaZonaDto } from './estadisticas.dto';

export const tasaConversion = (clientes: number, relevados: number): number =>
  relevados === 0 ? 0 : Math.round((clientes / relevados) * 10_000) / 10_000;

@Injectable()
export class EstadisticasService {
  constructor(private readonly prisma: PrismaService) {}

  /** Avance por zona activa, contando solo los comercios que el usuario puede ver. */
  async porZona(usuario: UsuarioSesion): Promise<EstadisticaZonaDto[]> {
    const where = alcance(usuario);
    const contarPorZona = (filtro: object) =>
      this.prisma.comercio.groupBy({
        by: ['zonaId'],
        where: { ...where, ...filtro },
        _count: true,
      });

    const [zonas, relevados, interesAlto, clientes] = await Promise.all([
      this.prisma.zona.findMany({ where: { activa: true }, orderBy: { numero: 'asc' } }),
      contarPorZona({}),
      contarPorZona({ interes: Interes.ALTO }),
      contarPorZona({ estado: EstadoComercio.CLIENTE }),
    ]);

    const aMapa = (grupos: { zonaId: number; _count: number }[]) =>
      new Map(grupos.map((g) => [g.zonaId, g._count]));
    const [mRelevados, mAlto, mClientes] = [relevados, interesAlto, clientes].map(aMapa);

    return zonas.map((zona) => {
      const r = mRelevados!.get(zona.id) ?? 0;
      const c = mClientes!.get(zona.id) ?? 0;
      return {
        zonaId: zona.id,
        numero: zona.numero,
        nombre: zona.nombre,
        relevados: r,
        interesAlto: mAlto!.get(zona.id) ?? 0,
        clientes: c,
        conversion: tasaConversion(c, r),
      };
    });
  }
}
