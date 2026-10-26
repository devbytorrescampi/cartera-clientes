import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { crearApp } from './utils';

describe('Secreto entre front y API (e2e)', () => {
  let app: NestExpressApplication;
  const SECRETO = 'secreto-compartido-de-prueba-con-32-caracteres';

  beforeAll(async () => {
    process.env.PROXY_SECRET = SECRETO;
    ({ app } = await crearApp());
  });

  afterAll(async () => {
    delete process.env.PROXY_SECRET;
    await app.close();
  });

  it('rechaza las llamadas directas sin el secreto', async () => {
    await request(app.getHttpServer()).post('/auth/login').send({}).expect(403);
  });

  it('deja pasar las que traen el secreto', async () => {
    await request(app.getHttpServer()).get('/auth/me').set('x-proxy-secret', SECRETO).expect(401);
  });

  it('/health responde sin secreto, para el monitoreo', async () => {
    await request(app.getHttpServer()).get('/health').expect(200);
  });

  it('el límite de intentos se cuenta por la IP real informada por el front', async () => {
    const intentar = (ip: string) =>
      request(app.getHttpServer())
        .post('/auth/login')
        .set('x-proxy-secret', SECRETO)
        .set('x-client-ip', ip)
        .send({ email: 'nadie@tcshop.test', password: 'x' });

    const estadosA: number[] = [];
    for (let i = 0; i < 6; i++) estadosA.push((await intentar('190.0.0.1')).status);
    expect(estadosA.at(-1)).toBe(429);
    // Otra IP detrás del mismo proxy no queda bloqueada.
    expect((await intentar('190.0.0.2')).status).toBe(401);
  });
});
