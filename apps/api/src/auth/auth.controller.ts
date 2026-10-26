import { Body, Controller, Get, HttpCode, HttpStatus, Post, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiCookieAuth, ApiOkResponse, ApiTags, ApiTooManyRequestsResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { nombreCookieSesion, opcionesCookieSesion } from './cookie';
import { Public } from './decorators/public.decorator';
import { UsuarioActual } from './decorators/usuario-actual.decorator';
import { CambiarPasswordDto } from './dto/cambiar-password.dto';
import { LoginDto } from './dto/login.dto';
import { UsuarioSesionDto } from './dto/usuario-sesion.dto';
import { duracionEnMs } from './duracion';
import { UsuarioParaToken, UsuarioSesion } from './usuario-sesion';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly duracionSesionMs: number;

  constructor(
    private readonly auth: AuthService,
    config: ConfigService,
  ) {
    this.duracionSesionMs = duracionEnMs(config.getOrThrow<string>('JWT_EXPIRES_IN'));
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: UsuarioSesionDto })
  @ApiTooManyRequestsResponse({ description: 'Demasiados intentos, esperar un minuto' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UsuarioSesionDto> {
    const usuario = await this.auth.validarCredenciales(dto.email, dto.password);
    await this.emitirSesion(res, usuario);
    const { sesionVersion: _version, ...sesion } = usuario;
    return sesion;
  }

  /** Cambia la contraseña. Cierra las demás sesiones y renueva la cookie de esta. */
  @ApiCookieAuth()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async cambiarPassword(
    @UsuarioActual() usuario: UsuarioSesion,
    @Body() dto: CambiarPasswordDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const actualizado = await this.auth.cambiarPassword(usuario.id, dto.actual, dto.nueva);
    await this.emitirSesion(res, actualizado);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Res({ passthrough: true }) res: Response): void {
    const { maxAge: _maxAge, ...opciones } = opcionesCookieSesion(0);
    res.clearCookie(nombreCookieSesion(), opciones);
  }

  private async emitirSesion(res: Response, usuario: UsuarioParaToken): Promise<void> {
    const token = await this.auth.firmarToken(usuario);
    res.cookie(nombreCookieSesion(), token, opcionesCookieSesion(this.duracionSesionMs));
  }

  @ApiCookieAuth()
  @Get('me')
  @ApiOkResponse({ type: UsuarioSesionDto })
  me(@UsuarioActual() usuario: UsuarioSesion): UsuarioSesionDto {
    return usuario;
  }
}
