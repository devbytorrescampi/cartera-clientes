import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { PayloadJwt, UsuarioSesion } from './usuario-sesion';

@Injectable()
export class AuthService {
  // Hash de una contraseña descartable. Se verifica contra él cuando el email no existe,
  // para que la respuesta tarde lo mismo y no revele qué emails están registrados.
  private hashFicticio?: Promise<string>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async validarCredenciales(email: string, password: string): Promise<UsuarioSesion> {
    const usuario = await this.prisma.usuario.findUnique({ where: { email } });

    if (!usuario || !usuario.activo) {
      this.hashFicticio ??= argon2.hash('contraseña-ficticia-para-igualar-tiempos', {
        type: argon2.argon2id,
      });
      await argon2.verify(await this.hashFicticio, password);
      throw new UnauthorizedException('Email o contraseña incorrectos');
    }

    const valida = await argon2.verify(usuario.passwordHash, password);
    if (!valida) throw new UnauthorizedException('Email o contraseña incorrectos');

    return { id: usuario.id, email: usuario.email, nombre: usuario.nombre, rol: usuario.rol };
  }

  firmarToken(usuario: UsuarioSesion): Promise<string> {
    const payload: PayloadJwt = { sub: usuario.id, rol: usuario.rol };
    return this.jwt.signAsync(payload);
  }
}
