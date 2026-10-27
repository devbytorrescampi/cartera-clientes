import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Rubro, TipoVisita } from '@prisma/client';
import { ETIQUETAS } from '@tcshop/shared';
import { randomUUID } from 'node:crypto';
import { UsuarioSesion } from '../auth/usuario-sesion';
import {
  escribirCsv,
  leerCsv,
  neutralizarFormula,
  normalizarClave,
  restaurarFormula,
} from '../comun/csv';
import {
  dateAFecha,
  fechaADate,
  fechaHoraArgentina,
  hoyEnArgentina,
  leerFecha,
  leerFechaHora,
} from '../comun/fechas';
import { alcance, normalizarTelefono } from '../comercios/comercios.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  Columna,
  COLUMNAS,
  COLUMNAS_OBLIGATORIAS,
  leerEnum,
  opciones,
  ubicarColumnas,
} from './columnas';
import { FilaImportacionDto, ResultadoFila, ResultadoImportacionDto } from './dto/importar.dto';

export const MAXIMO_FILAS = 2000;

const LARGO_MAXIMO = {
  nombre: 150,
  direccion: 200,
  contactoNombre: 120,
  sistemaActual: 120,
  notas: 5000,
} as const;

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type DatosComercio = Omit<Prisma.ComercioCreateManyInput, 'creadoPorId'> & {
  id: string;
  zonaId: number;
  creadoEn: Date;
};

interface FilaAnalizada extends FilaImportacionDto {
  datos: DatosComercio | null;
}

interface ZonaImportable {
  id: number;
  numero: number;
  nombre: string;
}

@Injectable()
export class CsvService {
  constructor(private readonly prisma: PrismaService) {}

  async exportar(
    zonaId: number | undefined,
    usuario: UsuarioSesion,
  ): Promise<{ nombreArchivo: string; contenido: string }> {
    let sufijo = '';
    if (zonaId !== undefined) {
      const zona = await this.prisma.zona.findUnique({ where: { id: zonaId } });
      if (!zona) throw new NotFoundException('La zona no existe');
      sufijo = `-zona-${zona.numero}`;
    }

    const comercios = await this.prisma.comercio.findMany({
      where: { ...alcance(usuario), zonaId },
      include: { zona: { select: { nombre: true } } },
      orderBy: [{ zona: { numero: 'asc' } }, { nombre: 'asc' }, { creadoEn: 'asc' }],
    });

    const texto = (valor: string | null) => (valor === null ? '' : neutralizarFormula(valor));
    const etiqueta = <T extends string>(etiquetas: Record<T, string>, valor: T | null) =>
      valor === null ? '' : etiquetas[valor];

    const filas = comercios.map((c) => {
      const valores: Record<Columna, string> = {
        zona: texto(c.zona.nombre),
        nombre: texto(c.nombre),
        direccion: texto(c.direccion),
        rubro: ETIQUETAS.rubro[c.rubro],
        atendio: etiqueta(ETIQUETAS.atendio, c.atendio),
        contactoNombre: texto(c.contactoNombre),
        facturacion: etiqueta(ETIQUETAS.facturacion, c.facturacion),
        sistemaActual: texto(c.sistemaActual),
        stock: etiqueta(ETIQUETAS.stock, c.stock),
        interes: etiqueta(ETIQUETAS.interes, c.interes),
        estado: ETIQUETAS.estado[c.estado],
        telefonoCodArea: c.telefonoCodArea ?? '',
        telefonoNumero: c.telefonoNumero ?? '',
        volverEl: c.volverEl ? dateAFecha(c.volverEl) : '',
        notas: texto(c.notas),
        lat: c.lat?.toString() ?? '',
        lng: c.lng?.toString() ?? '',
        creadoEn: fechaHoraArgentina(c.creadoEn),
        id: c.id,
      };
      return (Object.keys(COLUMNAS) as Columna[]).map((columna) => valores[columna]);
    });

    return {
      nombreArchivo: `comercios${sufijo}-${hoyEnArgentina()}.csv`,
      contenido: escribirCsv([Object.values(COLUMNAS), ...filas]),
    };
  }

  /**
   * Analiza el CSV fila por fila. Sin `confirmar` es solo la vista previa; con `confirmar`
   * guarda las filas nuevas sin errores (las demás se omiten) en una sola transacción.
   */
  async importar(
    contenido: string,
    confirmar: boolean,
    usuario: UsuarioSesion,
  ): Promise<ResultadoImportacionDto> {
    const [encabezado, ...registros] = leerCsv(contenido);
    if (!encabezado) throw new BadRequestException('El archivo está vacío');

    const posiciones = ubicarColumnas(encabezado);
    const faltantes = COLUMNAS_OBLIGATORIAS.filter((columna) => posiciones[columna] === null);
    if (posiciones.nombre === null && posiciones.direccion === null) faltantes.push('nombre');
    if (faltantes.length > 0) {
      throw new BadRequestException(
        `Al archivo le falta la columna ${faltantes.map((c) => COLUMNAS[c]).join(', ')}. ` +
          'Usá como modelo un CSV exportado desde la app.',
      );
    }
    if (registros.length === 0) throw new BadRequestException('El archivo no tiene comercios');
    if (registros.length > MAXIMO_FILAS) {
      throw new BadRequestException(
        `El archivo tiene ${registros.length} filas; el máximo por importación es ${MAXIMO_FILAS}`,
      );
    }

    const zonas = await this.prisma.zona.findMany({
      where: { activa: true },
      select: { id: true, numero: true, nombre: true },
    });
    const ahora = new Date();
    const filas = registros.map((registro, i) =>
      analizarFila(registro, i + 2, posiciones, zonas, ahora),
    );

    await this.marcarExistentes(filas, usuario);
    await this.advertirDuplicados(filas, usuario);

    const aImportar = filas.filter((f) => f.resultado === ResultadoFila.NUEVO);
    if (confirmar && aImportar.length > 0) {
      await this.prisma.$transaction([
        this.prisma.comercio.createMany({
          data: aImportar.map((f) => ({ ...f.datos!, creadoPorId: usuario.id })),
        }),
        this.prisma.visita.createMany({
          data: aImportar.map((f) => ({
            comercioId: f.datos!.id,
            tipo: TipoVisita.RELEVAMIENTO,
            fecha: f.datos!.creadoEn,
            usuarioId: usuario.id,
          })),
        }),
      ]);
    }

    const contar = (resultado: ResultadoFila) =>
      filas.filter((f) => f.resultado === resultado).length;
    return {
      filas: filas.map(({ datos: _datos, ...fila }) => fila),
      nuevos: aImportar.length,
      existentes: contar(ResultadoFila.EXISTE),
      conErrores: contar(ResultadoFila.ERROR),
      importados: confirmar ? aImportar.length : 0,
    };
  }

  /**
   * Las filas con un Id que el usuario ya tiene cargado se omiten: así reimportar un CSV
   * exportado no duplica nada. Si el Id es de un comercio que no ve (de otro vendedor o
   * eliminado), la fila se importa con un Id nuevo, sin revelar que ese Id existe.
   */
  private async marcarExistentes(filas: FilaAnalizada[], usuario: UsuarioSesion): Promise<void> {
    const conId = filas.filter((f) => f.datos);
    if (conId.length === 0) return;

    const encontrados = await this.prisma.comercio.findMany({
      where: { id: { in: conId.map((f) => f.datos!.id) } },
      select: { id: true },
    });
    const existentes = new Set(encontrados.map((c) => c.id));
    const visibles = new Set(
      (
        await this.prisma.comercio.findMany({
          where: { ...alcance(usuario), id: { in: [...existentes] } },
          select: { id: true },
        })
      ).map((c) => c.id),
    );

    for (const fila of conId) {
      const id = fila.datos!.id;
      if (visibles.has(id)) {
        fila.resultado = ResultadoFila.EXISTE;
        fila.datos = null;
      } else if (existentes.has(id)) {
        fila.datos!.id = randomUUID();
      }
    }
  }

  /** Avisa si ya hay un comercio con el mismo nombre en la zona, cargado o más arriba en el archivo. */
  private async advertirDuplicados(filas: FilaAnalizada[], usuario: UsuarioSesion): Promise<void> {
    const nuevas = filas.filter((f) => f.resultado === ResultadoFila.NUEVO && f.datos?.nombre);
    if (nuevas.length === 0) return;

    const cargados = await this.prisma.comercio.findMany({
      where: {
        ...alcance(usuario),
        zonaId: { in: [...new Set(nuevas.map((f) => f.datos!.zonaId))] },
        nombre: { not: null },
      },
      select: { zonaId: true, nombre: true },
    });
    const clave = (zonaId: number, nombre: string) => `${zonaId}|${normalizarClave(nombre)}`;
    const enLaBase = new Set(cargados.map((c) => clave(c.zonaId, c.nombre!)));
    const enElArchivo = new Map<string, number>();

    for (const fila of nuevas) {
      const k = clave(fila.datos!.zonaId, fila.datos!.nombre!);
      if (enLaBase.has(k)) {
        fila.advertencias.push('Ya hay un comercio cargado con ese nombre en la zona');
      }
      const anterior = enElArchivo.get(k);
      if (anterior !== undefined) {
        fila.advertencias.push(`Mismo nombre y zona que la fila ${anterior}`);
      } else {
        enElArchivo.set(k, fila.fila);
      }
    }
  }
}

/** Convierte una fila del CSV en los datos del comercio, juntando todos los errores. */
export function analizarFila(
  registro: string[],
  numeroFila: number,
  posiciones: Record<Columna, number | null>,
  zonas: ZonaImportable[],
  ahora: Date,
): FilaAnalizada {
  const errores: string[] = [];
  const advertencias: string[] = [];
  const valor = (columna: Columna): string => {
    const indice = posiciones[columna];
    return indice === null ? '' : restaurarFormula((registro[indice] ?? '').trim());
  };
  const textoOpcional = (columna: keyof typeof LARGO_MAXIMO): string | null => {
    const texto = valor(columna);
    if (texto.length > LARGO_MAXIMO[columna]) {
      errores.push(`${COLUMNAS[columna]}: máximo ${LARGO_MAXIMO[columna]} caracteres`);
    }
    return texto || null;
  };
  const enumOpcional = <T extends string>(columna: Columna, etiquetas: Record<T, string>) => {
    const texto = valor(columna);
    if (!texto) return null;
    const codigo = leerEnum(etiquetas, texto);
    if (!codigo) {
      errores.push(`${COLUMNAS[columna]}: "${texto}" no es válido (${opciones(etiquetas)})`);
    }
    return codigo;
  };

  const nombre = textoOpcional('nombre');
  const direccion = textoOpcional('direccion');
  if (!nombre && !direccion) errores.push('Falta el nombre o la dirección');

  const textoZona = valor('zona');
  const zona = textoZona ? buscarZona(zonas, textoZona) : null;
  if (!textoZona) errores.push('Falta la zona');
  else if (!zona) errores.push(`Zona: "${textoZona}" no coincide con ninguna zona activa`);

  let rubro = enumOpcional('rubro', ETIQUETAS.rubro);
  if (!rubro && !valor('rubro')) {
    rubro = Rubro.OTRO;
    advertencias.push('Sin rubro: se carga como Otro');
  }

  let telefono: ReturnType<typeof normalizarTelefono> = {
    telefonoCodArea: null,
    telefonoNumero: null,
  };
  try {
    telefono = normalizarTelefono(valor('telefonoCodArea'), valor('telefonoNumero'));
  } catch (error) {
    errores.push(error instanceof Error ? error.message : 'Teléfono inválido');
  }

  const volverEl = leerFechaOpcional(valor('volverEl'), COLUMNAS.volverEl, errores);

  let creadoEn = ahora;
  const textoCreado = valor('creadoEn');
  if (textoCreado) {
    const fecha = leerFechaHora(textoCreado);
    if (!fecha) errores.push(`${COLUMNAS.creadoEn}: "${textoCreado}" no es una fecha válida`);
    else if (fecha > ahora) errores.push(`${COLUMNAS.creadoEn}: la fecha es futura`);
    else creadoEn = fecha;
  }

  const lat = leerCoordenada(valor('lat'), 90, COLUMNAS.lat, errores);
  const lng = leerCoordenada(valor('lng'), 180, COLUMNAS.lng, errores);
  if (!valor('lat') !== !valor('lng')) errores.push('La latitud y la longitud van juntas');

  const id = valor('id');
  const datos = {
    id: UUID_V4.test(id) ? id.toLowerCase() : randomUUID(),
    zonaId: zona?.id ?? 0,
    nombre,
    direccion,
    rubro: rubro ?? Rubro.OTRO,
    atendio: enumOpcional('atendio', ETIQUETAS.atendio),
    contactoNombre: textoOpcional('contactoNombre'),
    ...telefono,
    facturacion: enumOpcional('facturacion', ETIQUETAS.facturacion),
    stock: enumOpcional('stock', ETIQUETAS.stock),
    sistemaActual: textoOpcional('sistemaActual'),
    interes: enumOpcional('interes', ETIQUETAS.interes),
    estado: enumOpcional('estado', ETIQUETAS.estado) ?? undefined,
    volverEl: volverEl ? fechaADate(volverEl) : null,
    notas: textoOpcional('notas'),
    lat,
    lng,
    creadoEn,
  };

  return {
    fila: numeroFila,
    nombre,
    direccion,
    zona: zona?.nombre ?? (textoZona || null),
    resultado: errores.length > 0 ? ResultadoFila.ERROR : ResultadoFila.NUEVO,
    errores,
    advertencias,
    datos: errores.length > 0 ? null : datos,
  };
}

/** Por nombre exacto (sin importar mayúsculas ni acentos) o por número: "3", "Zona 3". */
function buscarZona(zonas: ZonaImportable[], texto: string): ZonaImportable | null {
  const clave = normalizarClave(texto);
  const porNombre = zonas.find((z) => normalizarClave(z.nombre) === clave);
  if (porNombre) return porNombre;
  const numero = /^(?:zona\s*)?(\d+)\b/i.exec(texto.trim());
  return numero ? (zonas.find((z) => z.numero === Number(numero[1])) ?? null) : null;
}

function leerFechaOpcional(texto: string, columna: string, errores: string[]): string | null {
  if (!texto) return null;
  const fecha = leerFecha(texto);
  if (!fecha) errores.push(`${columna}: "${texto}" no es una fecha válida (usá AAAA-MM-DD)`);
  return fecha;
}

/** Acepta coma o punto decimal (Excel en español escribe "-26,8"). Redondea a 6 decimales. */
function leerCoordenada(
  texto: string,
  limite: number,
  columna: string,
  errores: string[],
): number | null {
  if (!texto) return null;
  const numero = /^-?\d+([.,]\d+)?$/.test(texto) ? Number(texto.replace(',', '.')) : NaN;
  if (!Number.isFinite(numero) || Math.abs(numero) > limite) {
    errores.push(`${columna}: "${texto}" no es válida`);
    return null;
  }
  return Math.round(numero * 1e6) / 1e6;
}
