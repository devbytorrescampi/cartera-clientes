import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Rol } from '@prisma/client';
import { RolesGuard } from './roles.guard';

const contexto = (rol?: Rol): ExecutionContext =>
  ({
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({
      getRequest: () => ({
        usuario: rol ? { id: '1', email: 'a@b.c', nombre: 'A', rol } : undefined,
      }),
    }),
  }) as unknown as ExecutionContext;

describe('RolesGuard', () => {
  const reflector = new Reflector();
  const guard = new RolesGuard(reflector);

  it('deja pasar cuando la ruta no exige rol', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(contexto(Rol.VENDEDOR))).toBe(true);
  });

  it('deja pasar al rol permitido', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Rol.ADMIN]);
    expect(guard.canActivate(contexto(Rol.ADMIN))).toBe(true);
  });

  it('bloquea a un rol no permitido', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Rol.ADMIN]);
    expect(() => guard.canActivate(contexto(Rol.VENDEDOR))).toThrow(ForbiddenException);
  });
});
