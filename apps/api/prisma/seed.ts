import { PrismaClient, Rol } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

// Esquinas en orden [lat, lng]. Las marcadas como aproximadas se corrigen desde la app.
const ZONAS = [
  {
    numero: 1,
    nombre: 'Zona 1 – Oeste cercano',
    limites: 'Av. Mitre, Av. Belgrano, Viamonte y Av. Mate de Luna.',
    poligono: [
      [-26.816, -65.2154],
      [-26.8115, -65.2382],
      [-26.8231, -65.2412],
      [-26.8282, -65.2186],
    ],
  },
  {
    numero: 2,
    nombre: 'Zona 2 – Oeste',
    limites:
      'Viamonte, Av. Belgrano, Av. Mate de Luna, hasta la altura del 4700 de Mate de Luna (donde Belgrano pasa a ser Av. Perón).',
    poligono: [
      [-26.8115, -65.2382],
      [-26.8065, -65.2617],
      [-26.8187, -65.2646],
      [-26.8231, -65.2412],
    ],
  },
  {
    numero: 3,
    nombre: 'Zona 3 – Suroeste',
    limites: 'Av. Mate de Luna, Av. Alem, Av. Kirchner y la prolongación de Viamonte.',
    poligono: [
      [-26.8231, -65.2412],
      [-26.8282, -65.2186],
      [-26.8404, -65.2215],
      [-26.8365, -65.2447],
    ],
    nota: 'La esquina [-26.8365, -65.2447] es aproximada.',
  },
  {
    numero: 4,
    nombre: 'Zona 4 – Centro norte / Barrio Norte',
    limites: 'Av. Sarmiento, Av. Avellaneda, Av. 24 de Septiembre y Av. Mitre.',
    poligono: [
      [-26.816, -65.2154],
      [-26.8201, -65.1941],
      [-26.8328, -65.1968],
      [-26.8282, -65.2186],
    ],
    nota: 'La esquina [-26.8328, -65.1968] es aproximada.',
  },
  {
    numero: 5,
    nombre: 'Zona 5 – Centro sur / microcentro',
    limites: 'Av. 24 de Septiembre, Av. Avellaneda, Av. Roca y Av. Alem.',
    poligono: [
      [-26.8282, -65.2186],
      [-26.8328, -65.1968],
      [-26.8455, -65.1985],
      [-26.8404, -65.2215],
    ],
    nota: 'Conviene recorrerla a pie. Las esquinas [-26.8328, -65.1968] y [-26.8455, -65.1985] son aproximadas.',
  },
];

async function main(): Promise<void> {
  // Solo se crean las zonas que faltan: volver a correr el seed no pisa las correcciones hechas desde la app.
  for (const zona of ZONAS) {
    await prisma.zona.upsert({ where: { numero: zona.numero }, update: {}, create: zona });
  }
  console.log(`Zonas: ${ZONAS.length} verificadas.`);

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error('Faltan ADMIN_EMAIL y ADMIN_PASSWORD en el entorno.');
  }
  if (password.length < 12) {
    throw new Error('ADMIN_PASSWORD debe tener al menos 12 caracteres.');
  }

  const existente = await prisma.usuario.findUnique({ where: { email } });
  if (existente) {
    console.log('Admin: ya existe, no se modifica.');
    return;
  }
  await prisma.usuario.create({
    data: {
      email,
      nombre: process.env.ADMIN_NOMBRE?.trim() || 'Administrador',
      passwordHash: await argon2.hash(password, { type: argon2.argon2id }),
      rol: Rol.ADMIN,
    },
  });
  console.log('Admin: creado.');
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => void prisma.$disconnect());
