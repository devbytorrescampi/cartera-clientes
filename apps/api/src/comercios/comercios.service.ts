import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EstadoComercio, Interes, Prisma, Rol, TipoVisita } from '@prisma/client';
import {
  distanciaMetros,
  linkWhatsApp,
  normalizarCodArea,
  normalizarNumeroLocal,
  RADIO_DUPLICADO_M,
} from '@tcshop/shared';
import { UsuarioSesion } from '../auth/usuario-sesion';
import { dateAFecha, fechaADate, hoyEnArgentina } from '../comun/fechas';
import { Pagina } from '../comun/dto/paginacion.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ActualizarComercioDto } from './dto/actualizar-comercio.dto';
import { BuscarDuplicadosDto } from './dto/buscar-duplicados.dto';
import {
  ComercioDto,
  ComercioVolverDto,
  ListaVolverDto,
  MotivoDuplicado,
  PosibleDuplicadoDto,
  PuntoMapaDto,
  ResumenVolverDto,
  SituacionVolver,
} from './dto/comercio.dto';
import { CrearComercioDto } from './dto/crear-comercio.dto';
import { FiltrosComerciosDto, Orden } from './dto/filtros-comercios.dto';

const INCLUIR = {
  zona: { select: { id: true, tipo: true, numero: true, nombre: true } },
  creadoPor: { select: { id: true, nombre: true } },
} satisfies Prisma.ComercioInclude;

type ComercioConRelaciones = Prisma.ComercioGetPayload<{ include: typeof INCLUIR }>;

export function aComercioDto(comercio: ComercioConRelaciones): ComercioDto {
  const {
    eliminadoEn: _eliminadoEn,
    creadoPorId: _creadoPorId,
    lat,
    lng,
    volverEl,
    ...resto
  } = comercio;
  return {
    ...resto,
    lat: lat === null ? null : lat.toNumber(),
    lng: lng === null ? null : lng.toNumber(),
    volverEl: volverEl === null ? null : dateAFecha(volverEl),
    whatsapp:
      resto.telefonoCodArea && resto.telefonoNumero
        ? linkWhatsApp(resto.telefonoCodArea, resto.telefonoNumero)
        : null,
  };
}

/** Comercios que el usuario puede ver: el admin, todos; el vendedor, los suyos. Nunca los eliminados. */
export function alcance(usuario: UsuarioSesion): Prisma.ComercioWhereInput {
  return usuario.rol === Rol.ADMIN
    ? { eliminadoEn: null }
    : { eliminadoEn: null, creadoPorId: usuario.id };
}

/** Criterio de orden de la lista. Los campos vacíos van siempre al final. */
export function ordenar(
  orden: Orden = 'actualizadoEn',
  direccion: 'asc' | 'desc' = orden === 'actualizadoEn' || orden === 'creadoEn' ? 'desc' : 'asc',
): Prisma.ComercioOrderByWithRelationInput {
  switch (orden) {
    case 'zona':
      return { zona: { numero: direccion } };
    case 'creadoPor':
      return { creadoPor: { nombre: direccion } };
    case 'nombre':
    case 'interes':
    case 'volverEl':
      return { [orden]: { sort: direccion, nulls: 'last' } };
    default:
      return { [orden]: direccion };
  }
}

export function situacionVolver(volverEl: string | null, hoy: string): SituacionVolver {
  if (volverEl === null) return SituacionVolver.SIN_FECHA;
  if (volverEl < hoy) return SituacionVolver.VENCIDO;
  if (volverEl === hoy) return SituacionVolver.HOY;
  return SituacionVolver.PROXIMO;
}

/** Normaliza el teléfono: código de área sin 0 y número sin 15. Los dos van juntos o ninguno. */
export function normalizarTelefono(
  codArea: string | null | undefined,
  numero: string | null | undefined,
): { telefonoCodArea: string | null; telefonoNumero: string | null } {
  if (!codArea && !numero) return { telefonoCodArea: null, telefonoNumero: null };
  if (!codArea || !numero) {
    throw new BadRequestException('El teléfono necesita código de área y número');
  }
  const area = normalizarCodArea(codArea);
  const local = area ? normalizarNumeroLocal(numero, area) : null;
  if (!area || !local) {
    throw new BadRequestException(
      'Teléfono inválido: revisá el código de área (ej.: 381) y el número (ej.: 155123456)',
    );
  }
  return { telefonoCodArea: area, telefonoNumero: local };
}

const INTERES_PARA_VOLVER: Interes[] = [Interes.ALTO, Interes.MEDIO];
const ESTADOS_CERRADOS: EstadoComercio[] = [EstadoComercio.CLIENTE, EstadoComercio.DESCARTADO];
const METROS_POR_GRADO_LAT = 111_320;

@Injectable()
export class ComerciosService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(filtros: FiltrosComerciosDto, usuario: UsuarioSesion): Promise<Pagina<ComercioDto>> {
    const { pagina, porPagina, q, zonaId, rubro, interes, estado, creadoPorId } = filtros;
    const where: Prisma.ComercioWhereInput = {
      // AND y no spread: el filtro por usuario nunca puede pisar el alcance del vendedor.
      AND: [alcance(usuario), creadoPorId ? { creadoPorId } : {}],
      zonaId,
      rubro,
      interes,
      estado,
      ...(q && {
        OR: (['nombre', 'direccion', 'notas', 'contactoNombre'] as const).map((campo) => ({
          [campo]: { contains: q, mode: 'insensitive' },
        })),
      }),
    };

    const [total, comercios] = await this.prisma.$transaction([
      this.prisma.comercio.count({ where }),
      this.prisma.comercio.findMany({
        where,
        include: INCLUIR,
        orderBy: [ordenar(filtros.orden, filtros.direccion), { id: 'asc' }],
        skip: (pagina - 1) * porPagina,
        take: porPagina,
      }),
    ]);
    return { items: comercios.map(aComercioDto), total, pagina, porPagina };
  }

  async obtener(id: string, usuario: UsuarioSesion): Promise<ComercioDto> {
    return aComercioDto(await this.buscarVisible(id, usuario));
  }

  async crear(dto: CrearComercioDto, usuario: UsuarioSesion): Promise<ComercioDto> {
    if (dto.id) {
      const existente = await this.existentePorId(dto.id, usuario);
      if (existente) return existente;
    }

    const { telefonoCodArea, telefonoNumero, volverEl, ...resto } = dto;
    if (!resto.nombre && !resto.direccion) {
      throw new BadRequestException('Cargá al menos el nombre o la dirección');
    }
    this.validarCoordenadas(resto.lat, resto.lng);
    await this.validarZonaActiva(resto.zonaId);

    const data: Prisma.ComercioUncheckedCreateInput = {
      ...resto,
      ...normalizarTelefono(telefonoCodArea, telefonoNumero),
      volverEl: volverEl ? fechaADate(volverEl) : null,
      creadoPorId: usuario.id,
    };

    try {
      const comercio = await this.prisma.$transaction(async (tx) => {
        const creado = await tx.comercio.create({ data, include: INCLUIR });
        await tx.visita.create({
          data: { comercioId: creado.id, tipo: TipoVisita.RELEVAMIENTO, usuarioId: usuario.id },
        });
        return creado;
      });
      return aComercioDto(comercio);
    } catch (error) {
      // Dos envíos simultáneos del mismo alta: el segundo choca con el id y devuelve el primero.
      if (dto.id && esViolacionDeUnicidad(error)) {
        const existente = await this.existentePorId(dto.id, usuario);
        if (existente) return existente;
      }
      throw error;
    }
  }

  async actualizar(
    id: string,
    dto: ActualizarComercioDto,
    usuario: UsuarioSesion,
  ): Promise<ComercioDto> {
    const actual = await this.buscarVisible(id, usuario);
    const { visita, telefonoCodArea, telefonoNumero, volverEl, ...resto } = dto;

    const nombre = resto.nombre !== undefined ? resto.nombre : actual.nombre;
    const direccion = resto.direccion !== undefined ? resto.direccion : actual.direccion;
    if (!nombre && !direccion) {
      throw new BadRequestException('El comercio tiene que conservar el nombre o la dirección');
    }
    if (resto.lat !== undefined || resto.lng !== undefined) {
      this.validarCoordenadas(resto.lat, resto.lng);
    }
    if (resto.zonaId !== undefined && resto.zonaId !== actual.zonaId) {
      await this.validarZonaActiva(resto.zonaId);
    }

    const data: Prisma.ComercioUncheckedUpdateInput = { ...resto };
    if (telefonoCodArea !== undefined || telefonoNumero !== undefined) {
      Object.assign(
        data,
        normalizarTelefono(
          telefonoCodArea !== undefined ? telefonoCodArea : actual.telefonoCodArea,
          telefonoNumero !== undefined ? telefonoNumero : actual.telefonoNumero,
        ),
      );
    }
    if (volverEl !== undefined) data.volverEl = volverEl ? fechaADate(volverEl) : null;
    if (visita) this.validarFechaVisita(visita.fecha);

    const comercio = await this.prisma.$transaction(async (tx) => {
      const actualizado = await tx.comercio.update({ where: { id }, data, include: INCLUIR });
      if (visita) {
        await tx.visita.create({
          data: {
            comercioId: id,
            tipo: visita.tipo,
            fecha: visita.fecha ? new Date(visita.fecha) : undefined,
            resultado: visita.resultado ?? null,
            notas: visita.notas ?? null,
            usuarioId: usuario.id,
          },
        });
      }
      return actualizado;
    });
    return aComercioDto(comercio);
  }

  /** Baja lógica: deja de aparecer en listas y estadísticas, pero se conserva con su historial. */
  async eliminar(id: string, usuario: UsuarioSesion): Promise<void> {
    await this.buscarVisible(id, usuario);
    await this.prisma.comercio.update({ where: { id }, data: { eliminadoEn: new Date() } });
  }

  async buscarDuplicados(
    consulta: BuscarDuplicadosDto,
    usuario: UsuarioSesion,
  ): Promise<PosibleDuplicadoDto[]> {
    const { zonaId, nombre, lat, lng, excluirId } = consulta;
    const tieneGps = lat !== undefined && lng !== undefined;
    const criterios: Prisma.ComercioWhereInput[] = [];

    if (nombre && zonaId) {
      criterios.push({ zonaId, nombre: { equals: nombre, mode: 'insensitive' } });
    }
    if (tieneGps) {
      // Primero un recuadro de ~30 m alrededor del punto (usa índices); después la distancia real.
      const dLat = RADIO_DUPLICADO_M / METROS_POR_GRADO_LAT;
      const dLng = RADIO_DUPLICADO_M / (METROS_POR_GRADO_LAT * Math.cos((lat * Math.PI) / 180));
      criterios.push({
        lat: { gte: lat - dLat, lte: lat + dLat },
        lng: { gte: lng - dLng, lte: lng + dLng },
      });
    }
    if (criterios.length === 0) return [];

    const candidatos = await this.prisma.comercio.findMany({
      where: {
        ...alcance(usuario),
        OR: criterios,
        ...(excluirId && { id: { not: excluirId } }),
      },
      include: { zona: INCLUIR.zona },
      take: 20,
    });

    return candidatos
      .map((candidato) => {
        const motivos: MotivoDuplicado[] = [];
        if (
          nombre &&
          candidato.zonaId === zonaId &&
          candidato.nombre?.toLocaleLowerCase('es') === nombre.toLocaleLowerCase('es')
        ) {
          motivos.push(MotivoDuplicado.MISMO_NOMBRE);
        }
        let distanciaM: number | null = null;
        if (tieneGps && candidato.lat !== null && candidato.lng !== null) {
          distanciaM = Math.round(
            distanciaMetros([lat, lng], [candidato.lat.toNumber(), candidato.lng.toNumber()]),
          );
          if (distanciaM <= RADIO_DUPLICADO_M) motivos.push(MotivoDuplicado.CERCANIA);
        }
        return {
          id: candidato.id,
          nombre: candidato.nombre,
          direccion: candidato.direccion,
          zona: candidato.zona,
          motivos,
          distanciaM,
        };
      })
      .filter((posible) => posible.motivos.length > 0);
  }

  /** Interesados (alto o medio) que no son clientes ni descartados, los vencidos primero. */
  async paraVolver(usuario: UsuarioSesion): Promise<ListaVolverDto> {
    const comercios = await this.prisma.comercio.findMany({
      where: this.filtroVolver(usuario),
      include: INCLUIR,
      orderBy: [
        { volverEl: { sort: 'asc', nulls: 'last' } },
        { interes: 'asc' },
        { actualizadoEn: 'desc' },
      ],
      take: 500,
    });
    const hoy = hoyEnArgentina();
    const items: ComercioVolverDto[] = comercios.map((comercio) => {
      const dto = aComercioDto(comercio);
      return { ...dto, situacion: situacionVolver(dto.volverEl, hoy) };
    });
    return {
      items,
      vencidos: items.filter((i) => i.situacion === SituacionVolver.VENCIDO).length,
      paraHoy: items.filter((i) => i.situacion === SituacionVolver.HOY).length,
    };
  }

  /** Solo los contadores, para el aviso en la navegación. */
  async resumenVolver(usuario: UsuarioSesion): Promise<ResumenVolverDto> {
    const hoy = fechaADate(hoyEnArgentina());
    const where = this.filtroVolver(usuario);
    const [vencidos, paraHoy] = await this.prisma.$transaction([
      this.prisma.comercio.count({ where: { ...where, volverEl: { lt: hoy } } }),
      this.prisma.comercio.count({ where: { ...where, volverEl: hoy } }),
    ]);
    return { vencidos, paraHoy };
  }

  /** Comercios con GPS, para el mapa. */
  async puntosMapa(usuario: UsuarioSesion): Promise<PuntoMapaDto[]> {
    const comercios = await this.prisma.comercio.findMany({
      where: { ...alcance(usuario), lat: { not: null }, lng: { not: null } },
      select: {
        id: true,
        zonaId: true,
        nombre: true,
        direccion: true,
        lat: true,
        lng: true,
        interes: true,
        estado: true,
      },
      take: 5000,
    });
    return comercios.map(({ lat, lng, ...resto }) => ({
      ...resto,
      lat: lat!.toNumber(),
      lng: lng!.toNumber(),
    }));
  }

  /** Busca un comercio que el usuario puede ver. Si no puede, responde 404 sin revelar si existe. */
  async buscarVisible(id: string, usuario: UsuarioSesion): Promise<ComercioConRelaciones> {
    const comercio = await this.prisma.comercio.findFirst({
      where: { id, ...alcance(usuario) },
      include: INCLUIR,
    });
    if (!comercio) throw new NotFoundException('Comercio no encontrado');
    return comercio;
  }

  validarFechaVisita(fecha: string | undefined): void {
    // Se tolera un pequeño desfase entre el reloj del celular y el del servidor.
    if (fecha && new Date(fecha).getTime() > Date.now() + 5 * 60_000) {
      throw new BadRequestException('La fecha de la visita no puede ser futura');
    }
  }

  private filtroVolver(usuario: UsuarioSesion): Prisma.ComercioWhereInput {
    return {
      ...alcance(usuario),
      interes: { in: INTERES_PARA_VOLVER },
      estado: { notIn: ESTADOS_CERRADOS },
    };
  }

  /** Alta repetida con el mismo id: devuelve el comercio si es del mismo usuario. */
  private async existentePorId(id: string, usuario: UsuarioSesion): Promise<ComercioDto | null> {
    const existente = await this.prisma.comercio.findUnique({ where: { id }, include: INCLUIR });
    if (!existente) return null;
    if (existente.creadoPorId !== usuario.id || existente.eliminadoEn) {
      throw new ConflictException('Ya existe un comercio con ese id');
    }
    return aComercioDto(existente);
  }

  private validarCoordenadas(lat: number | null | undefined, lng: number | null | undefined) {
    const conLat = lat !== undefined && lat !== null;
    const conLng = lng !== undefined && lng !== null;
    if (conLat !== conLng) {
      throw new BadRequestException('La latitud y la longitud van juntas');
    }
  }

  private async validarZonaActiva(zonaId: number): Promise<void> {
    const zona = await this.prisma.zona.findUnique({ where: { id: zonaId } });
    if (!zona?.activa) throw new BadRequestException('La zona no existe o está dada de baja');
  }
}

function esViolacionDeUnicidad(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}
