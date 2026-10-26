import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { Rol } from '@prisma/client';
import * as argon2 from 'argon2';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/configurar-app';
import { PrismaService } from '../src/prisma/prisma.service';

export async function crearApp(): Promise<{ app: NestExpressApplication; prisma: PrismaService }> {
  const modulo = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = modulo.createNestApplication<NestExpressApplication>();
  configurarApp(app);
  await app.init();
  return { app, prisma: app.get(PrismaService) };
}

export async function limpiarBase(prisma: PrismaService): Promise<void> {
  // Última barrera: solo se borra si la conexión apunta explícitamente a una base o schema de test.
  const url = new URL(process.env.DATABASE_URL ?? 'postgresql://sin-configurar');
  if (!/test/i.test(url.pathname + url.search)) {
    throw new Error('DATABASE_URL no apunta a una base de test: no se borra nada.');
  }
  await prisma.visita.deleteMany();
  await prisma.comercio.deleteMany();
  await prisma.usuario.deleteMany();
}

export async function crearUsuario(
  prisma: PrismaService,
  datos: { email: string; password: string; rol?: Rol; activo?: boolean },
) {
  return prisma.usuario.create({
    data: {
      email: datos.email,
      nombre: datos.email.split('@')[0]!,
      passwordHash: await argon2.hash(datos.password, { type: argon2.argon2id }),
      rol: datos.rol ?? Rol.VENDEDOR,
      activo: datos.activo ?? true,
    },
  });
}

/** Extrae la cookie de sesión de la respuesta del login, lista para mandar en el header Cookie. */
export function cookieDeSesion(setCookie: string | string[] | undefined): string {
  const cookies = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
  const sesion = cookies.find((c) => c.startsWith('tcshop_session='));
  if (!sesion) throw new Error('El login no devolvió la cookie de sesión');
  return sesion.split(';')[0]!;
}
