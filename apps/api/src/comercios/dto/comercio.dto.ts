import { ApiProperty } from '@nestjs/swagger';
import {
  Atendio,
  ControlStock,
  EstadoComercio,
  Facturacion,
  Interes,
  Rubro,
  TipoVisita,
} from '@prisma/client';

export class ReferenciaZonaDto {
  id!: number;
  numero!: number;
  nombre!: string;
}

export class ReferenciaUsuarioDto {
  id!: string;
  nombre!: string;
}

export class ComercioDto {
  id!: string;
  zonaId!: number;
  zona!: ReferenciaZonaDto;
  nombre!: string | null;
  direccion!: string | null;
  lat!: number | null;
  lng!: number | null;
  @ApiProperty({ enum: Rubro }) rubro!: Rubro;
  @ApiProperty({ enum: Atendio, nullable: true }) atendio!: Atendio | null;
  contactoNombre!: string | null;
  telefonoCodArea!: string | null;
  telefonoNumero!: string | null;
  /** Link de WhatsApp (wa.me) si el teléfono es válido. */
  whatsapp!: string | null;
  @ApiProperty({ enum: Facturacion, nullable: true }) facturacion!: Facturacion | null;
  @ApiProperty({ enum: ControlStock, nullable: true }) stock!: ControlStock | null;
  sistemaActual!: string | null;
  @ApiProperty({ enum: Interes, nullable: true }) interes!: Interes | null;
  @ApiProperty({ enum: EstadoComercio }) estado!: EstadoComercio;
  /** AAAA-MM-DD */
  volverEl!: string | null;
  notas!: string | null;
  creadoPor!: ReferenciaUsuarioDto;
  creadoEn!: Date;
  actualizadoEn!: Date;
}

export class PaginaComerciosDto {
  @ApiProperty({ type: [ComercioDto] }) items!: ComercioDto[];
  total!: number;
  pagina!: number;
  porPagina!: number;
}

export enum SituacionVolver {
  VENCIDO = 'VENCIDO',
  HOY = 'HOY',
  PROXIMO = 'PROXIMO',
  SIN_FECHA = 'SIN_FECHA',
}

export class ComercioVolverDto extends ComercioDto {
  @ApiProperty({ enum: SituacionVolver }) situacion!: SituacionVolver;
}

export class ResumenVolverDto {
  /** Fecha para volver ya pasada. */
  vencidos!: number;
  /** Fecha para volver = hoy. */
  paraHoy!: number;
}

export class ListaVolverDto extends ResumenVolverDto {
  @ApiProperty({ type: [ComercioVolverDto] }) items!: ComercioVolverDto[];
}

export enum MotivoDuplicado {
  MISMO_NOMBRE = 'MISMO_NOMBRE',
  CERCANIA = 'CERCANIA',
}

export class PosibleDuplicadoDto {
  id!: string;
  nombre!: string | null;
  direccion!: string | null;
  zona!: ReferenciaZonaDto;
  @ApiProperty({ enum: MotivoDuplicado, isArray: true }) motivos!: MotivoDuplicado[];
  /** Distancia en metros, si los dos tienen GPS. */
  distanciaM!: number | null;
}

/** Lo mínimo para dibujar un comercio en el mapa. */
export class PuntoMapaDto {
  id!: string;
  zonaId!: number;
  nombre!: string | null;
  direccion!: string | null;
  lat!: number;
  lng!: number;
  @ApiProperty({ enum: Interes, nullable: true }) interes!: Interes | null;
  @ApiProperty({ enum: EstadoComercio }) estado!: EstadoComercio;
}

export class VisitaDto {
  id!: string;
  comercioId!: string;
  fecha!: Date;
  @ApiProperty({ enum: TipoVisita }) tipo!: TipoVisita;
  resultado!: string | null;
  notas!: string | null;
  usuario!: ReferenciaUsuarioDto;
}
