import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Rol } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let hash: string;
  const findUnique = jest.fn();
  const findUniqueOrThrow = jest.fn();
  const update = jest.fn();
  const prisma = { usuario: { findUnique, findUniqueOrThrow, update } } as unknown as PrismaService;
  const jwt = new JwtService({ secret: 'secreto-de-prueba-con-mas-de-32-caracteres' });
  const servicio = new AuthService(prisma, jwt);

  beforeAll(async () => {
    hash = await argon2.hash('clave-correcta-123', { type: argon2.argon2id });
  });

  beforeEach(() => jest.resetAllMocks());

  const usuario = () => ({
    id: '6f1c2c1e-5d2a-4a43-9a43-1b2c3d4e5f60',
    email: 'admin@tcshop.test',
    nombre: 'Admin',
    passwordHash: hash,
    rol: Rol.ADMIN,
    activo: true,
    sesionVersion: 3,
  });

  it('devuelve el usuario sin el hash cuando la contraseña es correcta', async () => {
    findUnique.mockResolvedValue(usuario());
    const resultado = await servicio.validarCredenciales('admin@tcshop.test', 'clave-correcta-123');
    expect(resultado).toEqual({
      id: usuario().id,
      email: 'admin@tcshop.test',
      nombre: 'Admin',
      rol: Rol.ADMIN,
      sesionVersion: 3,
    });
    expect(resultado).not.toHaveProperty('passwordHash');
  });

  it('rechaza una contraseña incorrecta', async () => {
    findUnique.mockResolvedValue(usuario());
    await expect(servicio.validarCredenciales('admin@tcshop.test', 'otra')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rechaza un email inexistente con el mismo mensaje', async () => {
    findUnique.mockResolvedValue(null);
    await expect(servicio.validarCredenciales('nadie@tcshop.test', 'x')).rejects.toThrow(
      'Email o contraseña incorrectos',
    );
  });

  it('rechaza un usuario inactivo aunque la contraseña sea correcta', async () => {
    findUnique.mockResolvedValue({ ...usuario(), activo: false });
    await expect(
      servicio.validarCredenciales('admin@tcshop.test', 'clave-correcta-123'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('firma un token con el id, el rol y la versión de sesión', async () => {
    const { passwordHash: _hash, activo: _activo, ...sesion } = usuario();
    const token = await servicio.firmarToken(sesion);
    const payload = await jwt.verifyAsync<{ sub: string; rol: Rol; v: number }>(token);
    expect(payload).toMatchObject({ sub: sesion.id, rol: Rol.ADMIN, v: 3 });
  });

  describe('cambiarPassword', () => {
    it('rechaza si la contraseña actual no coincide', async () => {
      findUniqueOrThrow.mockResolvedValue(usuario());
      await expect(
        servicio.cambiarPassword(usuario().id, 'incorrecta', 'una-clave-nueva-larga'),
      ).rejects.toThrow('La contraseña actual no es correcta');
      expect(update).not.toHaveBeenCalled();
    });

    it('rechaza si la nueva es igual a la actual', async () => {
      findUniqueOrThrow.mockResolvedValue(usuario());
      await expect(
        servicio.cambiarPassword(usuario().id, 'clave-correcta-123', 'clave-correcta-123'),
      ).rejects.toThrow('distinta');
    });

    it('guarda un hash nuevo e incrementa la versión de sesión', async () => {
      findUniqueOrThrow.mockResolvedValue(usuario());
      update.mockImplementation(({ data }: { data: { passwordHash: string } }) =>
        Promise.resolve({ ...usuario(), passwordHash: data.passwordHash, sesionVersion: 4 }),
      );
      const resultado = await servicio.cambiarPassword(
        usuario().id,
        'clave-correcta-123',
        'una-clave-nueva-larga',
      );
      const { data } = update.mock.calls[0][0];
      expect(data.sesionVersion).toEqual({ increment: 1 });
      expect(await argon2.verify(data.passwordHash, 'una-clave-nueva-larga')).toBe(true);
      expect(resultado.sesionVersion).toBe(4);
    });
  });
});
