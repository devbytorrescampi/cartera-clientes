import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Rol } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsuarioActual } from '../auth/decorators/usuario-actual.decorator';
import { UsuarioSesion } from '../auth/usuario-sesion';
import { ActualizarZonaDto } from './dto/actualizar-zona.dto';
import { CrearZonaDto } from './dto/crear-zona.dto';
import { ListarZonasDto } from './dto/listar-zonas.dto';
import { ZonaDto } from './dto/zona.dto';
import { ZonasService } from './zonas.service';

@ApiTags('zonas')
@ApiCookieAuth()
@Controller('zonas')
export class ZonasController {
  constructor(private readonly zonas: ZonasService) {}

  @Get()
  listar(
    @UsuarioActual() usuario: UsuarioSesion,
    @Query() filtros: ListarZonasDto,
  ): Promise<ZonaDto[]> {
    return this.zonas.listar(usuario, filtros.incluirInactivas);
  }

  @Get(':id')
  obtener(@Param('id', ParseIntPipe) id: number): Promise<ZonaDto> {
    return this.zonas.obtener(id);
  }

  @Roles(Rol.ADMIN)
  @Post()
  crear(@Body() dto: CrearZonaDto): Promise<ZonaDto> {
    return this.zonas.crear(dto);
  }

  @Roles(Rol.ADMIN)
  @Patch(':id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarZonaDto,
  ): Promise<ZonaDto> {
    return this.zonas.actualizar(id, dto);
  }

  /** Baja lógica. Para reactivarla: PATCH con activa = true. */
  @Roles(Rol.ADMIN)
  @Delete(':id')
  darDeBaja(@Param('id', ParseIntPipe) id: number): Promise<ZonaDto> {
    return this.zonas.darDeBaja(id);
  }
}
