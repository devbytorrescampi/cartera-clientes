import { NestExpressApplication } from '@nestjs/platform-express';
import { Rol } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import TestAgent from 'supertest/lib/agent';
import { PrismaService } from '../src/prisma/prisma.service';
import { agenteConSesion, crearApp, crearUsuario, limpiarBase } from './utils';

describe('Zonas, comercios y visitas (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let admin: TestAgent;
  let vendedor: TestAgent;
  let otroVendedor: TestAgent;
  let zona1: number;
  let zona2: number;
  const PASSWORD = 'una-clave-larga-de-prueba';

  // Esquinas de la zona 1 del seed y un punto dentro de ella.
  const POLIGONO = [
    [-26.816, -65.2154],
    [-26.8115, -65.2382],
    [-26.8231, -65.2412],
    [-26.8282, -65.2186],
  ];
  const PUNTO = { lat: -26.82, lng: -65.228 };

  beforeAll(async () => {
    ({ app, prisma } = await crearApp());
    await limpiarBase(prisma);
    await crearUsuario(prisma, { email: 'admin@tcshop.test', password: PASSWORD, rol: Rol.ADMIN });
    await crearUsuario(prisma, { email: 'vende@tcshop.test', password: PASSWORD });
    await crearUsuario(prisma, { email: 'otro@tcshop.test', password: PASSWORD });
    admin = await agenteConSesion(app, 'admin@tcshop.test', PASSWORD);
    vendedor = await agenteConSesion(app, 'vende@tcshop.test', PASSWORD);
    otroVendedor = await agenteConSesion(app, 'otro@tcshop.test', PASSWORD);
  });

  afterAll(async () => {
    await limpiarBase(prisma);
    await app.close();
  });

  describe('zonas', () => {
    it('solo el admin crea zonas', async () => {
      const zona = { numero: 1, nombre: 'Zona 1', limites: 'Calles', poligono: POLIGONO };
      await vendedor.post('/zonas').send(zona).expect(403);
      zona1 = (await admin.post('/zonas').send(zona).expect(201)).body.id;
      zona2 = (
        await admin
          .post('/zonas')
          .send({ ...zona, numero: 2, nombre: 'Zona 2' })
          .expect(201)
      ).body.id;
    });

    it('rechaza un número repetido y un polígono inválido', async () => {
      await admin
        .post('/zonas')
        .send({ numero: 1, nombre: 'X', limites: 'X', poligono: POLIGONO })
        .expect(409);
      await admin
        .post('/zonas')
        .send({ numero: 9, nombre: 'X', limites: 'X', poligono: [[-26.8, -65.2]] })
        .expect(400);
      await admin
        .post('/zonas')
        .send({
          numero: 9,
          nombre: 'X',
          limites: 'X',
          poligono: [
            [100, 0],
            [0, 0],
            [0, 1],
          ],
        })
        .expect(400);
    });

    it('el admin corrige una esquina; el vendedor ve la lista', async () => {
      const nuevo = [...POLIGONO.slice(0, 3), [-26.829, -65.219]];
      const res = await admin.patch(`/zonas/${zona2}`).send({ poligono: nuevo }).expect(200);
      expect(res.body.poligono[3]).toEqual([-26.829, -65.219]);
      const lista = await vendedor.get('/zonas').expect(200);
      expect(lista.body.map((z: { numero: number }) => z.numero)).toEqual([1, 2]);
    });
  });

  describe('alta de comercios', () => {
    let idComercio: string;

    it('crea el comercio con su primera visita de Relevamiento', async () => {
      const res = await vendedor
        .post('/comercios')
        .send({
          zonaId: zona1,
          nombre: '  Almacén Don Pepe ',
          rubro: 'ALMACEN',
          interes: 'ALTO',
          telefonoCodArea: '0381',
          telefonoNumero: '15 512 3456',
          ...PUNTO,
        })
        .expect(201);
      idComercio = res.body.id;
      expect(res.body).toMatchObject({
        nombre: 'Almacén Don Pepe',
        estado: 'RELEVADO',
        telefonoCodArea: '381',
        telefonoNumero: '5123456',
        whatsapp: 'https://wa.me/5493815123456',
        lat: PUNTO.lat,
        zona: { numero: 1 },
        creadoPor: { nombre: 'vende' },
      });
      const visitas = await vendedor.get(`/comercios/${idComercio}/visitas`).expect(200);
      expect(visitas.body).toHaveLength(1);
      expect(visitas.body[0]).toMatchObject({ tipo: 'RELEVAMIENTO', usuario: { nombre: 'vende' } });
    });

    it('exige nombre o dirección, y rechaza campos desconocidos', async () => {
      await vendedor.post('/comercios').send({ zonaId: zona1, rubro: 'OTRO' }).expect(400);
      await vendedor
        .post('/comercios')
        .send({ zonaId: zona1, rubro: 'OTRO', nombre: 'X', creadoPorId: 'hack' })
        .expect(400);
    });

    it('un id generado en el cliente reenviado no duplica', async () => {
      const id = randomUUID();
      const alta = { id, zonaId: zona1, direccion: 'Mendoza 1200', rubro: 'KIOSCO' };
      await vendedor.post('/comercios').send(alta).expect(201);
      const segunda = await vendedor.post('/comercios').send(alta).expect(201);
      expect(segunda.body.id).toBe(id);
      expect(await prisma.comercio.count({ where: { id } })).toBe(1);
      expect(await prisma.visita.count({ where: { comercioId: id } })).toBe(1);
      // El mismo id usado por otra persona es un conflicto, no una lectura del ajeno.
      await otroVendedor.post('/comercios').send(alta).expect(409);
    });

    it('avisa de posibles duplicados por nombre en la zona y por cercanía', async () => {
      const porNombre = await vendedor
        .get('/comercios/duplicados')
        .query({ zonaId: zona1, nombre: 'almacén don pepe' })
        .expect(200);
      expect(porNombre.body[0]).toMatchObject({ id: idComercio, motivos: ['MISMO_NOMBRE'] });

      const cerca = await vendedor
        .get('/comercios/duplicados')
        .query({ lat: PUNTO.lat + 0.0001, lng: PUNTO.lng })
        .expect(200);
      expect(cerca.body[0].motivos).toEqual(['CERCANIA']);
      expect(cerca.body[0].distanciaM).toBeLessThan(15);

      const lejos = await vendedor
        .get('/comercios/duplicados')
        .query({ lat: PUNTO.lat + 0.001, lng: PUNTO.lng })
        .expect(200);
      expect(lejos.body).toEqual([]);
    });

    describe('autorización', () => {
      it('otro vendedor no lo ve, ni lo edita, ni le carga visitas (404)', async () => {
        await otroVendedor.get(`/comercios/${idComercio}`).expect(404);
        await otroVendedor.patch(`/comercios/${idComercio}`).send({ notas: 'x' }).expect(404);
        await otroVendedor
          .post(`/comercios/${idComercio}/visitas`)
          .send({ tipo: 'DEMO' })
          .expect(404);
        await otroVendedor.delete(`/comercios/${idComercio}`).expect(404);
        const lista = await otroVendedor.get('/comercios').expect(200);
        expect(lista.body.total).toBe(0);
      });

      it('el admin ve los comercios de todos', async () => {
        await admin.get(`/comercios/${idComercio}`).expect(200);
        const lista = await admin.get('/comercios').expect(200);
        expect(lista.body.total).toBe(2);
      });

      it('rechaza ids que no son uuid', async () => {
        await admin.get('/comercios/1').expect(400);
      });
    });

    describe('edición', () => {
      it('cambia el estado y registra la visita en el mismo paso', async () => {
        const res = await vendedor
          .patch(`/comercios/${idComercio}`)
          .send({
            estado: 'DEMO_AGENDADA',
            volverEl: '2026-11-05',
            visita: { tipo: 'SEGUIMIENTO', resultado: 'Agendamos demo para el jueves' },
          })
          .expect(200);
        expect(res.body).toMatchObject({ estado: 'DEMO_AGENDADA', volverEl: '2026-11-05' });
        const visitas = await vendedor.get(`/comercios/${idComercio}/visitas`).expect(200);
        expect(visitas.body[0]).toMatchObject({
          tipo: 'SEGUIMIENTO',
          resultado: 'Agendamos demo para el jueves',
        });
      });

      it('null borra un campo opcional pero no un obligatorio', async () => {
        const res = await vendedor
          .patch(`/comercios/${idComercio}`)
          .send({ telefonoCodArea: null, telefonoNumero: null })
          .expect(200);
        expect(res.body.whatsapp).toBeNull();
        await vendedor.patch(`/comercios/${idComercio}`).send({ rubro: null }).expect(400);
        await vendedor.patch(`/comercios/${idComercio}`).send({ estado: null }).expect(400);
      });

      it('no deja al comercio sin nombre ni dirección', async () => {
        await vendedor.patch(`/comercios/${idComercio}`).send({ nombre: '' }).expect(400);
      });

      it('rechaza una visita con fecha futura', async () => {
        await vendedor
          .post(`/comercios/${idComercio}/visitas`)
          .send({ tipo: 'DEMO', fecha: '2099-01-01T10:00:00Z' })
          .expect(400);
      });
    });
  });

  describe('búsqueda, filtros y paginación', () => {
    beforeAll(async () => {
      const altas = [
        { nombre: 'Ferretería El Tornillo', rubro: 'FERRETERIA', interes: 'MEDIO' },
        { nombre: 'Kiosco Lulú', rubro: 'KIOSCO', notas: 'El dueño pidió precio por WhatsApp' },
        {
          nombre: 'Zapatería Paso',
          rubro: 'INDUMENTARIA',
          interes: 'BAJO',
          contactoNombre: 'Pedro',
        },
      ];
      for (const alta of altas) {
        await admin
          .post('/comercios')
          .send({ zonaId: zona2, ...alta })
          .expect(201);
      }
    });

    it('busca sin distinguir mayúsculas en nombre, notas y contacto', async () => {
      const porNombre = await admin.get('/comercios').query({ q: 'tornillo' }).expect(200);
      expect(porNombre.body.items.map((c: { nombre: string }) => c.nombre)).toEqual([
        'Ferretería El Tornillo',
      ]);
      expect((await admin.get('/comercios').query({ q: 'WHATSAPP' })).body.total).toBe(1);
      expect((await admin.get('/comercios').query({ q: 'pedro' })).body.total).toBe(1);
    });

    it('filtra por zona, rubro e interés', async () => {
      expect((await admin.get('/comercios').query({ zonaId: zona2 })).body.total).toBe(3);
      expect((await admin.get('/comercios').query({ rubro: 'KIOSCO' })).body.total).toBe(2);
      expect((await admin.get('/comercios').query({ interes: 'ALTO' })).body.total).toBe(1);
      await admin.get('/comercios').query({ rubro: 'NO_EXISTE' }).expect(400);
    });

    it('pagina los resultados', async () => {
      const res = await admin.get('/comercios').query({ porPagina: 2, pagina: 2 }).expect(200);
      expect(res.body).toMatchObject({ total: 5, pagina: 2, porPagina: 2 });
      expect(res.body.items).toHaveLength(2);
      await admin.get('/comercios').query({ porPagina: 500 }).expect(400);
    });
  });

  describe('volver y estadísticas', () => {
    it('lista interesados abiertos: con fecha primero, sin fecha al final', async () => {
      const ferreteria = (await admin.get('/comercios').query({ q: 'tornillo' })).body.items[0];
      await admin.patch(`/comercios/${ferreteria.id}`).send({ volverEl: '2020-01-01' }).expect(200);

      const res = await admin.get('/comercios/volver').expect(200);
      const nombres = res.body.items.map((c: { nombre: string }) => c.nombre);
      expect(nombres).toEqual(['Ferretería El Tornillo', 'Almacén Don Pepe']);
      expect(res.body.items[0].situacion).toBe('VENCIDO');
      expect(res.body.vencidos).toBe(1);

      const resumen = await admin.get('/comercios/volver/resumen').expect(200);
      expect(resumen.body).toMatchObject({ vencidos: 1 });
    });

    it('un cliente sale de la lista para volver', async () => {
      const ferreteria = (await admin.get('/comercios').query({ q: 'tornillo' })).body.items[0];
      await admin.patch(`/comercios/${ferreteria.id}`).send({ estado: 'CLIENTE' }).expect(200);
      const res = await admin.get('/comercios/volver').expect(200);
      expect(res.body.vencidos).toBe(0);
    });

    it('estadísticas por zona con tasa de conversión', async () => {
      const res = await admin.get('/estadisticas/zonas').expect(200);
      expect(res.body).toEqual([
        expect.objectContaining({
          numero: 1,
          relevados: 2,
          interesAlto: 1,
          clientes: 0,
          conversion: 0,
        }),
        expect.objectContaining({ numero: 2, relevados: 3, clientes: 1, conversion: 0.3333 }),
      ]);
      // El vendedor solo cuenta lo suyo.
      const propias = await vendedor.get('/estadisticas/zonas').expect(200);
      expect(propias.body[1]).toMatchObject({ relevados: 0 });
    });
  });

  describe('baja lógica', () => {
    it('el comercio eliminado desaparece de listas pero sigue en la base', async () => {
      const kiosco = (await admin.get('/comercios').query({ q: 'lulú' })).body.items[0];
      await admin.delete(`/comercios/${kiosco.id}`).expect(204);
      await admin.get(`/comercios/${kiosco.id}`).expect(404);
      expect((await admin.get('/comercios').query({ q: 'lulú' })).body.total).toBe(0);
      const enBase = await prisma.comercio.findUnique({ where: { id: kiosco.id } });
      expect(enBase?.eliminadoEn).not.toBeNull();
    });

    it('la zona dada de baja ya no se ofrece ni acepta altas', async () => {
      await admin.delete(`/zonas/${zona2}`).expect(200);
      expect((await vendedor.get('/zonas')).body).toHaveLength(1);
      expect((await admin.get('/zonas').query({ incluirInactivas: true })).body).toHaveLength(2);
      await vendedor
        .post('/comercios')
        .send({ zonaId: zona2, nombre: 'X', rubro: 'OTRO' })
        .expect(400);
    });
  });
});
