import { NestExpressApplication } from '@nestjs/platform-express';
import { ThrottlerStorage, ThrottlerStorageService } from '@nestjs/throttler';
import { Rol } from '@prisma/client';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { cookieDeSesion, crearApp, crearUsuario, limpiarBase } from './utils';

describe('Auth (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  const PASSWORD = 'una-clave-larga-de-prueba';

  beforeAll(async () => {
    ({ app, prisma } = await crearApp());
    await limpiarBase(prisma);
    await crearUsuario(prisma, { email: 'admin@tcshop.test', password: PASSWORD, rol: Rol.ADMIN });
    await crearUsuario(prisma, { email: 'baja@tcshop.test', password: PASSWORD, activo: false });
  });

  // Cada test arranca con el cupo de intentos de login completo.
  beforeEach(() => app.get<ThrottlerStorageService>(ThrottlerStorage).onApplicationShutdown());

  afterAll(async () => {
    await limpiarBase(prisma);
    await app.close();
  });

  const login = (email: string, password: string) =>
    request(app.getHttpServer()).post('/auth/login').send({ email, password });

  it('login correcto: devuelve el usuario y una cookie httpOnly', async () => {
    const res = await login('ADMIN@tcshop.test ', PASSWORD).expect(200);
    expect(res.body).toMatchObject({ email: 'admin@tcshop.test', rol: 'ADMIN' });
    expect(res.body).not.toHaveProperty('passwordHash');

    const cookie = ([] as string[]).concat(res.headers['set-cookie'] ?? []).join(';');
    expect(cookie).toMatch(/tcshop_session=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
  });

  it('login con contraseña incorrecta: 401 sin cookie', async () => {
    const res = await login('admin@tcshop.test', 'incorrecta').expect(401);
    expect(res.headers['set-cookie']).toBeUndefined();
  });

  it('login de usuario inactivo: 401', async () => {
    await login('baja@tcshop.test', PASSWORD).expect(401);
  });

  it('login con datos inválidos o campos extra: 400', async () => {
    await login('no-es-un-email', PASSWORD).expect(400);
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@tcshop.test', password: PASSWORD, rol: 'ADMIN' })
      .expect(400);
  });

  it('/auth/me sin sesión: 401', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);
  });

  it('/auth/me con un token adulterado: 401', async () => {
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Cookie', 'tcshop_session=eyJhbGciOiJub25lIn0.eyJzdWIiOiJ4In0.')
      .expect(401);
  });

  it('/auth/me con sesión: devuelve el usuario', async () => {
    const res = await login('admin@tcshop.test', PASSWORD).expect(200);
    const me = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Cookie', cookieDeSesion(res.headers['set-cookie']))
      .expect(200);
    expect(me.body).toMatchObject({ email: 'admin@tcshop.test', rol: 'ADMIN' });
  });

  it('una sesión deja de valer si el usuario se da de baja', async () => {
    await crearUsuario(prisma, { email: 'temporal@tcshop.test', password: PASSWORD });
    const res = await login('temporal@tcshop.test', PASSWORD).expect(200);
    const cookie = cookieDeSesion(res.headers['set-cookie']);
    await prisma.usuario.update({
      where: { email: 'temporal@tcshop.test' },
      data: { activo: false },
    });
    await request(app.getHttpServer()).get('/auth/me').set('Cookie', cookie).expect(401);
  });

  it('logout borra la cookie', async () => {
    const res = await request(app.getHttpServer()).post('/auth/logout').expect(204);
    const cookie = ([] as string[]).concat(res.headers['set-cookie'] ?? []).join(';');
    expect(cookie).toMatch(/tcshop_session=;/);
  });

  it('manda los headers de seguridad de helmet', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('rate limiting: bloquea el login después de 5 intentos por minuto', async () => {
    const estados: number[] = [];
    for (let i = 0; i < 7; i++) {
      estados.push((await login('admin@tcshop.test', 'incorrecta')).status);
    }
    expect(estados).toContain(429);
  });
});
