# Relevamiento TCShop

Web para registrar los comercios visitados, hacer el seguimiento de los interesados y ver el avance por zona. La especificación completa está en [spec-relevamiento-tcshop.md](spec-relevamiento-tcshop.md).

## Estructura

```
apps/api         API REST (NestJS + Prisma + PostgreSQL)
apps/web         Front (Next.js App Router), mobile-first
packages/shared  Enums, etiquetas y utilidades compartidas entre API y front
```

El navegador solo habla con el front: Next reenvía `/api/*` a la API (`API_URL`). Así la cookie de sesión es del mismo origen que la página (`httpOnly`, `sameSite=lax` y `secure` en producción).

## Requisitos

- Node.js 20 o superior (desarrollado con Node 24) y npm 11.
- PostgreSQL 15 o superior, local o Supabase. Con Docker no hace falta instalarlo.

## Levantar el entorno local

### Opción A: Docker Compose (un solo comando)

```bash
cp .env.example .env             # completar JWT_SECRET, ADMIN_EMAIL y ADMIN_PASSWORD
docker compose up --build        # base, API (aplica migraciones al arrancar) y front
docker compose exec api npm run db:seed   # zonas y usuario admin, solo la primera vez
```

- Front: http://localhost:3000
- API: http://localhost:3001 (Swagger en http://localhost:3001/docs)

### Opción B: sin Docker

```bash
npm install
cp apps/api/.env.example apps/api/.env          # completar las variables
cp apps/web/.env.example apps/web/.env.local
npm run build -w @tcshop/shared                 # el paquete compartido se compila una vez
npm run db:deploy                               # aplicar migraciones
npm run db:seed                                 # zonas y usuario admin
npm run dev:api                                 # en una terminal
npm run dev:web                                 # en otra
```

## Variables de entorno

### API (`apps/api/.env`)

| Variable                                        | Descripción                                                                                                                 |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                                  | Conexión que usa la app. En Supabase: el pooler en modo transacción (puerto 6543) con `?pgbouncer=true&connection_limit=1`. |
| `DIRECT_URL`                                    | Conexión directa, la usan las migraciones. En local es igual a `DATABASE_URL`.                                              |
| `JWT_SECRET`                                    | Secreto para firmar la sesión, mínimo 32 caracteres. Generarlo con `openssl rand -base64 48`.                               |
| `JWT_EXPIRES_IN`                                | Duración de la sesión (`7d`, `12h`…). Por defecto `7d`.                                                                     |
| `CORS_ORIGIN`                                   | URL del front. Si hay varias, van separadas por coma.                                                                       |
| `SWAGGER_ENABLED`                               | En producción Swagger está apagado. Con `true` se habilita.                                                                 |
| `PORT`, `NODE_ENV`                              | Puerto (por defecto 3001) y entorno.                                                                                        |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NOMBRE` | Solo los usa el seed para crear el admin inicial. La contraseña debe tener al menos 12 caracteres.                          |

La API valida las variables al arrancar y no levanta si falta alguna o es inválida.

### Front (`apps/web/.env.local`)

| Variable  | Descripción                                                                                                                        |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `API_URL` | URL de la API a la que Next reenvía `/api/*`. **Se toma al compilar**, así que en Vercel tiene que estar definida antes del build. |

## Migraciones y seed

```bash
npm run db:migrate    # desarrollo: crea una migración nueva a partir de cambios en schema.prisma
npm run db:deploy     # aplica las migraciones pendientes (producción, CI, base nueva)
npm run db:seed       # crea las zonas que falten y el admin si no existe
```

El seed se puede correr más de una vez: no pisa zonas que ya existan (por ejemplo, esquinas corregidas desde la app) ni modifica un admin existente.

## Tests

```bash
npm test              # unitarios (API y paquete compartido)
npm run test:e2e      # e2e de la API contra una base de prueba
```

Los e2e necesitan `apps/api/.env.test` (copiarlo de `.env.test.example`) apuntando a una base **exclusiva para tests**, porque borran sus datos. `npm run test:e2e` le aplica las migraciones pendientes antes de correr.

## Calidad

```bash
npm run lint          # ESLint en todos los paquetes
npm run format        # Prettier
```

## Seguridad

- Todas las rutas requieren sesión salvo `POST /auth/login`, `POST /auth/logout` y `GET /health`. Los roles se verifican en el backend con `@Roles(...)`.
- Contraseñas con argon2id. Cuando el email no existe, el login tarda lo mismo, para no revelar qué cuentas existen.
- Rate limiting de 5 intentos por minuto en el login y 300 por minuto en general, por IP.
- helmet, CORS restringido, validación estricta: se rechazan los campos que no están en el DTO.
- En cada request se verifica que el usuario siga activo, así que dar de baja a alguien corta su sesión al instante.
- Prisma no registra las queries en los logs.
- Los scripts de instalación de dependencias están restringidos a los aprobados en `allowScripts` (`package.json`).
