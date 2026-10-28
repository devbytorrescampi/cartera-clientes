import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Rol } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsuarioActual } from '../auth/decorators/usuario-actual.decorator';
import { UsuarioSesion } from '../auth/usuario-sesion';
import { ActualizarUsuarioDto, ResetearPasswordDto } from './dto/actualizar-usuario.dto';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { UsuarioDto } from './dto/usuario.dto';
import { UsuariosService } from './usuarios.service';

const UUID = new ParseUUIDPipe({ version: '4' });

/** Administración de usuarios. Todo solo para el admin. */
@ApiTags('usuarios')
@ApiCookieAuth()
@Roles(Rol.ADMIN)
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuarios: UsuariosService) {}

  @Get()
  @ApiOkResponse({ type: [UsuarioDto] })
  listar(): Promise<UsuarioDto[]> {
    return this.usuarios.listar();
  }

  @Post()
  crear(@Body() dto: CrearUsuarioDto): Promise<UsuarioDto> {
    return this.usuarios.crear(dto);
  }

  /** Nombre, rol o baja/reactivación. No hay borrado: los comercios guardan quién los cargó. */
  @Patch(':id')
  actualizar(
    @Param('id', UUID) id: string,
    @Body() dto: ActualizarUsuarioDto,
    @UsuarioActual() actual: UsuarioSesion,
  ): Promise<UsuarioDto> {
    return this.usuarios.actualizar(id, dto, actual);
  }

  @Post(':id/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  resetearPassword(@Param('id', UUID) id: string, @Body() dto: ResetearPasswordDto): Promise<void> {
    return this.usuarios.resetearPassword(id, dto.nueva);
  }
}
