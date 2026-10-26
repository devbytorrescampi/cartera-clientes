import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Rol } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let hash: string;
  const findUnique = jest.fn();
  const prisma = { usuario: { findUnique } } as unknown as PrismaService;
  const jwt = new JwtService({ secret: 'secreto-de-prueba-con-mas-de-32-caracteres' });
  const servicio = new AuthService(prisma, jwt);

  beforeAll(async () => {
    hash = await argon2.hash('clave-correcta-123', { type: argon2.argon2id });
  });

  beforeEach(() => findUnique.mockReset());

  const usuario = () => ({
    id: '6f1c2c1e-5d2a-4a43-9a43-1b2c3d4e5f60',
    email: 'admin@tcshop.test',
    nombre: 'Admin',
    passwordHash: hash,
    rol: Rol.ADMIN,
    activo: true,
  });

  it('devuelve el usuario sin el hash cuando la contraseña es correcta', async () => {
    findUnique.mockResolvedValue(usuario());
    const resultado = await servicio.validarCredenciales('admin@tcshop.test', 'clave-correcta-123');
    expect(resultado).toEqual({
      id: usuario().id,
      email: 'admin@tcshop.test',
      nombre: 'Admin',
      rol: Rol.ADMIN,
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

  it('firma un token con el id y el rol', async () => {
    const { passwordHash: _hash, activo: _activo, ...sesion } = usuario();
    const token = await servicio.firmarToken(sesion);
    const payload = await jwt.verifyAsync<{ sub: string; rol: Rol }>(token);
    expect(payload).toMatchObject({ sub: sesion.id, rol: Rol.ADMIN });
  });
});
