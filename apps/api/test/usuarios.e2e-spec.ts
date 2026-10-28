import { NestExpressApplication } from '@nestjs/platform-express';
import { Rol } from '@prisma/client';
import request from 'supertest';
import TestAgent from 'supertest/lib/agent';
import { PrismaService } from '../src/prisma/prisma.service';
import { agenteConSesion, crearApp, crearUsuario, limpiarBase } from './utils';

describe('Usuarios (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let admin: TestAgent;
  let idAdmin: string;
  let vendedor: TestAgent;
  let idVendedor: string;
  const PASSWORD = 'una-clave-larga-de-prueba';

  beforeAll(async () => {
    ({ app, prisma } = await crearApp());
    await limpiarBase(prisma);
    idAdmin = (
      await crearUsuario(prisma, { email: 'admin@tcshop.test', password: PASSWORD, rol: Rol.ADMIN })
    ).id;
    idVendedor = (await crearUsuario(prisma, { email: 'vende@tcshop.test', password: PASSWORD }))
      .id;
    admin = await agenteConSesion(app, 'admin@tcshop.test', PASSWORD);
    vendedor = await agenteConSesion(app, 'vende@tcshop.test', PASSWORD);
  });

  afterAll(async () => {
    await limpiarBase(prisma);
    await app.close();
  });

  it('un vendedor no puede ver ni crear usuarios', async () => {
    await vendedor.get('/usuarios').expect(403);
    await vendedor
      .post('/usuarios')
      .send({ email: 'x@tcshop.test', nombre: 'X', rol: 'ADMIN', password: PASSWORD })
      .expect(403);
  });

  it('el admin crea un usuario que ya puede entrar, sin exponer el hash', async () => {
    const res = await admin
      .post('/usuarios')
      .send({
        email: '  Nuevo@TCShop.test ',
        nombre: ' Nuevo ',
        rol: 'VENDEDOR',
        password: PASSWORD,
      })
      .expect(201);
    expect(res.body).toMatchObject({
      email: 'nuevo@tcshop.test',
      nombre: 'Nuevo',
      rol: 'VENDEDOR',
      activo: true,
      comercios: 0,
    });
    expect(res.body.passwordHash).toBeUndefined();
    await agenteConSesion(app, 'nuevo@tcshop.test', PASSWORD);
  });

  it('rechaza un email repetido y una contraseña corta', async () => {
    await admin
      .post('/usuarios')
      .send({ email: 'nuevo@tcshop.test', nombre: 'N', rol: 'VENDEDOR', password: PASSWORD })
      .expect(409);
    await admin
      .post('/usuarios')
      .send({ email: 'otro@tcshop.test', nombre: 'N', rol: 'VENDEDOR', password: 'corta' })
      .expect(400);
  });

  it('lista los usuarios sin el hash', async () => {
    const res = await admin.get('/usuarios').expect(200);
    expect(res.body).toHaveLength(3);
    expect(res.body[0].passwordHash).toBeUndefined();
  });

  it('el admin no se puede dar de baja ni quitarse el rol', async () => {
    await admin.patch(`/usuarios/${idAdmin}`).send({ activo: false }).expect(400);
    await admin.patch(`/usuarios/${idAdmin}`).send({ rol: 'VENDEDOR' }).expect(400);
    await admin.patch(`/usuarios/${idAdmin}`).send({ nombre: 'Jefe' }).expect(200);
  });

  it('resetear la contraseña cierra la sesión abierta del usuario', async () => {
    const nueva = 'otra-clave-larga-de-prueba';
    await admin.post(`/usuarios/${idVendedor}/password`).send({ nueva }).expect(204);
    await vendedor.get('/auth/me').expect(401);
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'vende@tcshop.test', password: PASSWORD })
      .expect(401);
    vendedor = await agenteConSesion(app, 'vende@tcshop.test', nueva);
  });

  it('dar de baja corta la sesión al instante y reactivar la devuelve', async () => {
    await admin.patch(`/usuarios/${idVendedor}`).send({ activo: false }).expect(200);
    await vendedor.get('/auth/me').expect(401);
    await admin.patch(`/usuarios/${idVendedor}`).send({ activo: true }).expect(200);
    await vendedor.get('/auth/me').expect(200);
  });

  it('un id inexistente da 404', async () => {
    await admin
      .patch('/usuarios/0f8fad5b-d9cb-469f-a165-70867728950e')
      .send({ nombre: 'X' })
      .expect(404);
  });
});
