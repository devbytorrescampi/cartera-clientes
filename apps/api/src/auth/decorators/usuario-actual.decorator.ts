import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { UsuarioSesion } from '../usuario-sesion';

export const UsuarioActual = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UsuarioSesion => {
    const usuario = ctx.switchToHttp().getRequest<Request>().usuario;
    if (!usuario) throw new UnauthorizedException();
    return usuario;
  },
);
