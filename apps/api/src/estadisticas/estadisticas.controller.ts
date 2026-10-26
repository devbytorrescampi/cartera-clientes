import { Controller, Get } from '@nestjs/common';
import { ApiCookieAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UsuarioActual } from '../auth/decorators/usuario-actual.decorator';
import { UsuarioSesion } from '../auth/usuario-sesion';
import { EstadisticaZonaDto } from './estadisticas.dto';
import { EstadisticasService } from './estadisticas.service';

@ApiTags('estadisticas')
@ApiCookieAuth()
@Controller('estadisticas')
export class EstadisticasController {
  constructor(private readonly estadisticas: EstadisticasService) {}

  @Get('zonas')
  @ApiOkResponse({ type: [EstadisticaZonaDto] })
  zonas(@UsuarioActual() usuario: UsuarioSesion): Promise<EstadisticaZonaDto[]> {
    return this.estadisticas.porZona(usuario);
  }
}
