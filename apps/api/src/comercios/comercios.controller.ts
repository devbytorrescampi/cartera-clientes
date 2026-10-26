import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UsuarioActual } from '../auth/decorators/usuario-actual.decorator';
import { UsuarioSesion } from '../auth/usuario-sesion';
import { ComerciosService } from './comercios.service';
import { ActualizarComercioDto } from './dto/actualizar-comercio.dto';
import { BuscarDuplicadosDto } from './dto/buscar-duplicados.dto';
import {
  ComercioDto,
  ListaVolverDto,
  PaginaComerciosDto,
  PosibleDuplicadoDto,
  ResumenVolverDto,
  VisitaDto,
} from './dto/comercio.dto';
import { CrearComercioDto } from './dto/crear-comercio.dto';
import { FiltrosComerciosDto } from './dto/filtros-comercios.dto';
import { NuevaVisitaDto } from './dto/nueva-visita.dto';
import { VisitasService } from './visitas.service';

const UUID = new ParseUUIDPipe({ version: '4' });

@ApiTags('comercios')
@ApiCookieAuth()
@Controller('comercios')
export class ComerciosController {
  constructor(
    private readonly comercios: ComerciosService,
    private readonly visitas: VisitasService,
  ) {}

  @Get()
  @ApiOkResponse({ type: PaginaComerciosDto })
  listar(
    @Query() filtros: FiltrosComerciosDto,
    @UsuarioActual() usuario: UsuarioSesion,
  ): Promise<PaginaComerciosDto> {
    return this.comercios.listar(filtros, usuario);
  }

  /** Comercios parecidos al que se va a cargar: mismo nombre en la zona o a menos de 30 m. */
  @Get('duplicados')
  @ApiOkResponse({ type: [PosibleDuplicadoDto] })
  duplicados(
    @Query() consulta: BuscarDuplicadosDto,
    @UsuarioActual() usuario: UsuarioSesion,
  ): Promise<PosibleDuplicadoDto[]> {
    return this.comercios.buscarDuplicados(consulta, usuario);
  }

  @Get('volver')
  @ApiOkResponse({ type: ListaVolverDto })
  volver(@UsuarioActual() usuario: UsuarioSesion): Promise<ListaVolverDto> {
    return this.comercios.paraVolver(usuario);
  }

  @Get('volver/resumen')
  @ApiOkResponse({ type: ResumenVolverDto })
  resumenVolver(@UsuarioActual() usuario: UsuarioSesion): Promise<ResumenVolverDto> {
    return this.comercios.resumenVolver(usuario);
  }

  /** Alta. Crea también la primera visita (Relevamiento). Reenviar el mismo id no duplica. */
  @Post()
  crear(
    @Body() dto: CrearComercioDto,
    @UsuarioActual() usuario: UsuarioSesion,
  ): Promise<ComercioDto> {
    return this.comercios.crear(dto, usuario);
  }

  @Get(':id')
  obtener(
    @Param('id', UUID) id: string,
    @UsuarioActual() usuario: UsuarioSesion,
  ): Promise<ComercioDto> {
    return this.comercios.obtener(id, usuario);
  }

  /** Edición parcial. Con `visita` se registra una visita en el mismo paso. */
  @Patch(':id')
  actualizar(
    @Param('id', UUID) id: string,
    @Body() dto: ActualizarComercioDto,
    @UsuarioActual() usuario: UsuarioSesion,
  ): Promise<ComercioDto> {
    return this.comercios.actualizar(id, dto, usuario);
  }

  /** Baja lógica. */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(@Param('id', UUID) id: string, @UsuarioActual() usuario: UsuarioSesion): Promise<void> {
    return this.comercios.eliminar(id, usuario);
  }

  @Get(':id/visitas')
  @ApiOkResponse({ type: [VisitaDto] })
  listarVisitas(
    @Param('id', UUID) id: string,
    @UsuarioActual() usuario: UsuarioSesion,
  ): Promise<VisitaDto[]> {
    return this.visitas.listar(id, usuario);
  }

  @Post(':id/visitas')
  crearVisita(
    @Param('id', UUID) id: string,
    @Body() dto: NuevaVisitaDto,
    @UsuarioActual() usuario: UsuarioSesion,
  ): Promise<VisitaDto> {
    return this.visitas.crear(id, dto, usuario);
  }
}
