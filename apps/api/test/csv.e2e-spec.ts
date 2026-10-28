import { NestExpressApplication } from '@nestjs/platform-express';
import { Rol } from '@prisma/client';
import TestAgent from 'supertest/lib/agent';
import { PrismaService } from '../src/prisma/prisma.service';
import { agenteConSesion, crearApp, crearUsuario, limpiarBase } from './utils';

describe('Exportar e importar CSV (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let admin: TestAgent;
  let vendedor: TestAgent;
  let otroVendedor: TestAgent;
  let zona1: number;
  let zona2: number;
  let idDelOtro: string;
  const PASSWORD = 'una-clave-larga-de-prueba';
  const POLIGONO = [
    [-26.816, -65.2154],
    [-26.8115, -65.2382],
    [-26.8231, -65.2412],
  ];

  const importar = (agente: TestAgent, csv: string, confirmar = false) =>
    agente
      .post(`/importar/comercios${confirmar ? '?confirmar=true' : ''}`)
      .set('Content-Type', 'text/csv')
      .send(csv);

  beforeAll(async () => {
    ({ app, prisma } = await crearApp());
    await limpiarBase(prisma);
    await crearUsuario(prisma, { email: 'admin@tcshop.test', password: PASSWORD, rol: Rol.ADMIN });
    await crearUsuario(prisma, { email: 'vende@tcshop.test', password: PASSWORD });
    await crearUsuario(prisma, { email: 'otro@tcshop.test', password: PASSWORD });
    admin = await agenteConSesion(app, 'admin@tcshop.test', PASSWORD);
    vendedor = await agenteConSesion(app, 'vende@tcshop.test', PASSWORD);
    otroVendedor = await agenteConSesion(app, 'otro@tcshop.test', PASSWORD);

    const datosZona = { descripcion: 'Calles', puntos: POLIGONO };
    zona1 = (
      await prisma.zona.create({ data: { ...datosZona, numero: 1, nombre: 'Zona 1 – Oeste' } })
    ).id;
    zona2 = (
      await prisma.zona.create({ data: { ...datosZona, numero: 2, nombre: 'Zona 2 – Sur' } })
    ).id;

    await vendedor
      .post('/comercios')
      .send({
        zonaId: zona1,
        nombre: '=Kiosco "Pepe"',
        rubro: 'KIOSCO',
        interes: 'ALTO',
        telefonoCodArea: '381',
        telefonoNumero: '5123456',
        volverEl: '2026-11-15',
        lat: -26.82,
        lng: -65.228,
        notas: 'Dos líneas;\ncon punto y coma',
      })
      .expect(201);
    idDelOtro = (
      await otroVendedor
        .post('/comercios')
        .send({ zonaId: zona2, nombre: 'Del otro', rubro: 'OTRO' })
        .expect(201)
    ).body.id;
  });

  afterAll(async () => {
    await limpiarBase(prisma);
    await app.close();
  });

  describe('exportar', () => {
    it('devuelve un CSV para Excel solo con los comercios propios', async () => {
      const respuesta = await vendedor.get('/exportar/comercios.csv').buffer(true).expect(200);
      expect(respuesta.headers['content-type']).toBe('text/csv; charset=utf-8');
      expect(respuesta.headers['content-disposition']).toMatch(
        /^attachment; filename="comercios-\d{4}-\d{2}-\d{2}\.csv"$/,
      );
      const texto = respuesta.text;
      expect(texto.startsWith('﻿Zona;Nombre;Dirección;Rubro;')).toBe(true);
      const lineas = texto.slice(1).trimEnd().split('\r\n');
      expect(lineas).toHaveLength(2);
      expect(lineas[1]).toContain(`Zona 1 – Oeste;"'=Kiosco ""Pepe""";;Kiosco/librería/regalería;`);
      expect(lineas[1]).toContain(';381;5123456;2026-11-15;');
      expect(texto).not.toContain('Del otro');
    });

    it('el admin ve todo y puede filtrar por zona', async () => {
      const todo = (await admin.get('/exportar/comercios.csv').buffer(true).expect(200)).text;
      expect(todo).toContain('Del otro');
      const respuesta = await admin
        .get(`/exportar/comercios.csv?zonaId=${zona2}`)
        .buffer(true)
        .expect(200);
      expect(respuesta.text).toContain('Del otro');
      expect(respuesta.text).not.toContain('Pepe');
      expect(respuesta.headers['content-disposition']).toContain('comercios-zona-2-');
      await admin.get('/exportar/comercios.csv?zonaId=9999').expect(404);
    });

    it('pide sesión', async () => {
      const { default: request } = await import('supertest');
      await request(app.getHttpServer()).get('/exportar/comercios.csv').expect(401);
    });
  });

  describe('importar', () => {
    it('reimportar lo exportado no duplica nada', async () => {
      const csv = (await vendedor.get('/exportar/comercios.csv').buffer(true)).text;
      const { body } = await importar(vendedor, csv, true).expect(200);
      expect(body).toMatchObject({ nuevos: 0, existentes: 1, conErrores: 0, importados: 0 });
      expect(body.filas[0]).toMatchObject({
        fila: 2,
        nombre: '=Kiosco "Pepe"',
        resultado: 'EXISTE',
      });
    });

    it('la vista previa muestra los errores fila por fila y no guarda nada', async () => {
      const csv = [
        'Zona;Nombre;Dirección;Rubro;Interés;Cód. área;Teléfono;Latitud;Longitud;Id',
        `1;Almacén Nuevo;;Almacén;Medio;0381;155998877;-26,82;-65,23;`,
        `Zona 2 – Sur;;Laprida 50;;;;;;;${idDelOtro}`,
        `7;Sin zona;;Kiosco;Altísimo;;;;;`,
        `1;=kiosco pepe;;Kiosco;;;;;;`,
      ].join('\n');
      const antes = await prisma.comercio.count();
      const { body } = await importar(vendedor, csv).expect(200);
      expect(await prisma.comercio.count()).toBe(antes);
      expect(body).toMatchObject({ nuevos: 3, existentes: 0, conErrores: 1, importados: 0 });
      expect(body.filas[1]).toMatchObject({
        resultado: 'NUEVO',
        advertencias: ['Sin rubro: se carga como Otro'],
      });
      expect(body.filas[2]).toMatchObject({ fila: 4, resultado: 'ERROR' });
      expect(body.filas[2].errores).toHaveLength(2);
      expect(body.filas[3].advertencias).toEqual([
        'Ya hay un comercio cargado con ese nombre en la zona',
      ]);
    });

    it('al confirmar guarda las filas válidas con su visita de relevamiento', async () => {
      const csv = [
        'Zona;Nombre;Dirección;Rubro;Interés;Cód. área;Teléfono;Latitud;Longitud;Creado;Id',
        `1;Almacén Nuevo;;Almacén;Medio;0381;155998877;-26,82;-65,23;2026-10-01 09:30;`,
        `2;;Laprida 50;Otro;;;;;;;${idDelOtro}`,
        `7;Con error;;Kiosco;;;;;;;`,
      ].join('\r\n');
      const { body } = await importar(vendedor, csv, true).expect(200);
      expect(body).toMatchObject({ nuevos: 2, conErrores: 1, importados: 2 });

      const lista = (await vendedor.get('/comercios?porPagina=100').expect(200)).body;
      expect(lista.total).toBe(3);
      const nuevo = lista.items.find((c: { nombre: string }) => c.nombre === 'Almacén Nuevo');
      expect(nuevo).toMatchObject({
        rubro: 'ALMACEN',
        interes: 'MEDIO',
        telefonoCodArea: '381',
        telefonoNumero: '5998877',
        lat: -26.82,
        lng: -65.23,
        creadoEn: '2026-10-01T12:30:00.000Z',
      });
      const visitas = (await vendedor.get(`/comercios/${nuevo.id}/visitas`).expect(200)).body;
      expect(visitas).toEqual([
        expect.objectContaining({ tipo: 'RELEVAMIENTO', fecha: '2026-10-01T12:30:00.000Z' }),
      ]);

      // El Id era de un comercio ajeno: se importó como uno nuevo y el ajeno quedó intacto.
      const laprida = lista.items.find((c: { direccion: string }) => c.direccion === 'Laprida 50');
      expect(laprida.id).not.toBe(idDelOtro);
      await otroVendedor.get(`/comercios/${idDelOtro}`).expect(200);
    });

    it('rechaza archivos sin las columnas necesarias, vacíos o en JSON', async () => {
      const sinRubro = await importar(vendedor, 'Zona;Nombre\n1;A').expect(400);
      expect(sinRubro.body.message).toContain('Rubro');
      await importar(vendedor, 'Zona;Rubro;Nombre\n').expect(400);
      await importar(vendedor, '').expect(400);
      await vendedor.post('/importar/comercios').send({ contenido: 'x' }).expect(400);
    });
  });
});
