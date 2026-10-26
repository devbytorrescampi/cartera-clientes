import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { PayloadJwt, UsuarioParaToken } from './usuario-sesion';

const OPCIONES_HASH = { type: argon2.argon2id } as const;

@Injectable()
export class AuthService {
  // Hash de una contraseña descartable. Se verifica contra él cuando el email no existe,
  // para que la respuesta tarde lo mismo y no revele qué emails están registrados.
  private hashFicticio?: Promise<string>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async validarCredenciales(email: string, password: string): Promise<UsuarioParaToken> {
    const usuario = await this.prisma.usuario.findUnique({ where: { email } });

    if (!usuario || !usuario.activo) {
      this.hashFicticio ??= argon2.hash('contraseña-ficticia-para-igualar-tiempos', OPCIONES_HASH);
      await argon2.verify(await this.hashFicticio, password);
      throw new UnauthorizedException('Email o contraseña incorrectos');
    }

    const valida = await argon2.verify(usuario.passwordHash, password);
    if (!valida) throw new UnauthorizedException('Email o contraseña incorrectos');

    return {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol,
      sesionVersion: usuario.sesionVersion,
    };
  }

  /** Cambia la contraseña y cierra todas las demás sesiones. Devuelve los datos para un token nuevo. */
  async cambiarPassword(
    usuarioId: string,
    actual: string,
    nueva: string,
  ): Promise<UsuarioParaToken> {
    const usuario = await this.prisma.usuario.findUniqueOrThrow({ where: { id: usuarioId } });
    // 400 y no 401: el front interpreta 401 como sesión vencida.
    if (!(await argon2.verify(usuario.passwordHash, actual))) {
      throw new BadRequestException('La contraseña actual no es correcta');
    }
    if (actual === nueva) {
      throw new BadRequestException('La contraseña nueva tiene que ser distinta de la actual');
    }
    const actualizado = await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: {
        passwordHash: await argon2.hash(nueva, OPCIONES_HASH),
        sesionVersion: { increment: 1 },
      },
    });
    return {
      id: actualizado.id,
      email: actualizado.email,
      nombre: actualizado.nombre,
      rol: actualizado.rol,
      sesionVersion: actualizado.sesionVersion,
    };
  }

  firmarToken(usuario: UsuarioParaToken): Promise<string> {
    const payload: PayloadJwt = { sub: usuario.id, rol: usuario.rol, v: usuario.sesionVersion };
    return this.jwt.signAsync(payload);
  }
}
