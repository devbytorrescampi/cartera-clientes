# Relevamiento TCShop – Especificación para Claude Code

## Tu rol

Sos el desarrollador a cargo de construir esta aplicación de punta a punta. Antes de escribir código, leé toda la especificación, armá un plan por fases y mostrámelo para que lo apruebe. Si algo es ambiguo o hay que elegir entre opciones, preguntame en lugar de asumir. Trabajá por fases, y al terminar cada una dejá la app corriendo y contame qué hiciste y cómo probarlo.

## Contexto

Soy el fundador de TorresCampi Soft, en San Miguel de Tucumán, Argentina. Vendo TCShop, un sistema de punto de venta, stock y facturación electrónica (ARCA) para pequeños comercios: almacenes, ferreterías, locales de indumentaria y calzado, kioscos, librerías y regalerías.

Para conseguir clientes recorro la ciudad en moto, zona por zona, entrando a cada comercio. Necesito una web para registrar cada local que visito, hacer el seguimiento de los interesados y ver mi avance por zona. La voy a usar sobre todo desde el celular, en la calle, con poco tiempo entre una parada y otra.

## Stack

- **Backend:** Node.js con NestJS (API REST).
- **Frontend:** Next.js (App Router) con TypeScript.
- **Base de datos:** PostgreSQL, con Prisma como ORM y migraciones versionadas.
- **Entorno local:** Docker Compose con la base, la API y el front, levantable con un solo comando.
- TypeScript estricto en todo el proyecto. Validación de entrada en la API con class-validator (o Zod si lo justificás).

Organizalo como monorepo (por ejemplo `apps/api`, `apps/web`) salvo que tengas una razón concreta para otra estructura.

## Usuarios y acceso

- Por ahora el único usuario soy yo, pero quiero poder sumar vendedores más adelante sin rehacer nada.
- Login con email y contraseña. Contraseñas con hash (argon2 o bcrypt), sesión con JWT en cookie httpOnly.
- Roles: `admin` (ve y edita todo) y `vendedor` (ve y edita solo sus comercios). Implementá el modelo de roles desde el principio aunque al inicio haya un solo usuario.
- Cada comercio y cada visita registra qué usuario la cargó.

## Modelo de datos

### Zona

| Campo | Tipo | Notas |
|---|---|---|
| id | int | |
| numero | int | Único (1, 2, 3…) |
| nombre | texto | Ej.: "Zona 1 – Oeste cercano" |
| limites | texto | Descripción de las calles que la encierran |
| poligono | JSON (lista de [lat, lng]) | Esquinas de la zona, para mostrarla en el mapa y detectar la zona por GPS |
| nota | texto, opcional | Ej.: "Conviene recorrerla a pie" |
| activa | booleano | |

Las zonas se administran desde la app (alta, edición, baja lógica), porque voy a ir agregando más.

### Comercio

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | |
| zonaId | relación | Obligatorio |
| nombre | texto, opcional | Al menos uno entre nombre y dirección es obligatorio |
| direccion | texto, opcional | Calle y altura, o esquina |
| lat, lng | decimal, opcional | Del GPS del celular |
| rubro | enum | Almacén/autoservicio, Ferretería/corralón, Indumentaria/calzado, Kiosco/librería/regalería, Otro |
| atendio | enum, opcional | Dueño, Empleado |
| contactoNombre | texto, opcional | Quién decide |
| telefono | texto, opcional | Para WhatsApp |
| facturacion | enum, opcional | Talonario manual, Web de ARCA, Otro sistema, No factura |
| stock | enum, opcional | Cuaderno, Excel, Sistema, No lo controla |
| sistemaActual | texto, opcional | Si usa otro sistema, cuál |
| interes | enum, opcional | Alto, Medio, Bajo |
| estado | enum | Relevado, Demo agendada, Demo hecha, Cliente, Descartado. Por defecto: Relevado |
| volverEl | fecha, opcional | |
| notas | texto largo, opcional | |
| creadoPor | relación a usuario | |
| creadoEn, actualizadoEn | timestamp | |

### Visita

Historial de cada contacto con un comercio, para no perder lo que pasó en cada pasada.

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | |
| comercioId | relación | |
| fecha | timestamp | |
| tipo | enum | Relevamiento, Demo, Seguimiento, Llamada/WhatsApp |
| resultado | texto, opcional | |
| notas | texto, opcional | |
| usuarioId | relación | |

Al crear un comercio se crea automáticamente su primera visita de tipo Relevamiento. Cuando cambia el estado de un comercio, quiero poder registrar una visita en el mismo paso.

## Datos iniciales (seed)

Cargá estas cinco zonas. Las coordenadas son las esquinas en orden; las marcadas como aproximadas hay que poder corregirlas desde la app.

1. **Zona 1 – Oeste cercano.** Av. Mitre, Av. Belgrano, Viamonte y Av. Mate de Luna.
   Esquinas: [-26.8160, -65.2154], [-26.8115, -65.2382], [-26.8231, -65.2412], [-26.8282, -65.2186].
2. **Zona 2 – Oeste.** Viamonte, Av. Belgrano, Av. Mate de Luna, hasta la altura del 4700 de Mate de Luna (donde Belgrano pasa a ser Av. Perón).
   Esquinas: [-26.8115, -65.2382], [-26.8065, -65.2617], [-26.8187, -65.2646], [-26.8231, -65.2412].
3. **Zona 3 – Suroeste.** Av. Mate de Luna, Av. Alem, Av. Kirchner y la prolongación de Viamonte.
   Esquinas: [-26.8231, -65.2412], [-26.8282, -65.2186], [-26.8404, -65.2215], [-26.8365, -65.2447] (esta última aproximada).
4. **Zona 4 – Centro norte / Barrio Norte.** Av. Sarmiento, Av. Avellaneda, Av. 24 de Septiembre y Av. Mitre.
   Esquinas: [-26.8160, -65.2154], [-26.8201, -65.1941], [-26.8328, -65.1968] (aproximada), [-26.8282, -65.2186].
5. **Zona 5 – Centro sur / microcentro.** Av. 24 de Septiembre, Av. Avellaneda, Av. Roca y Av. Alem. Nota: conviene recorrerla a pie.
   Esquinas: [-26.8282, -65.2186], [-26.8328, -65.1968] (aproximada), [-26.8455, -65.1985] (aproximada), [-26.8404, -65.2215].

Creá también un usuario admin a partir de variables de entorno (`ADMIN_EMAIL`, `ADMIN_PASSWORD`). Nunca hardcodees credenciales.

## Pantallas

Diseño mobile-first: botones grandes (mínimo 48 px de alto), alto contraste para usar al sol, modo claro y oscuro. Navegación inferior fija con cuatro secciones.

### 1. Cargar

- Zona actual visible arriba en todo momento, con un toque para cambiarla. La app recuerda la última zona elegida.
- Botón "Guardar mi ubicación" que toma el GPS. Si la ubicación cae dentro del polígono de una zona, se la sugiere automáticamente (sin cambiarla sin avisar).
- Campos del modelo Comercio. Los enums se eligen con botones tipo chip, no con selects, para cargar con un toque.
- Guardar en menos de 30 segundos tiene que ser realista: solo nombre o dirección son obligatorios.
- Antes de guardar, avisar si ya existe un comercio muy parecido (mismo nombre en la misma zona, o a menos de 30 m por GPS) para no duplicar.

### 2. Comercios

- Lista con buscador (nombre, dirección, notas, contacto) y filtros por zona, rubro, interés y estado.
- Cada tarjeta muestra lo principal y tiene accesos directos a WhatsApp (link `wa.me` con el número normalizado a formato argentino, código 549 + característica, sin 0 ni 15) y a Google Maps (por coordenadas si hay, si no por dirección).
- Al tocar un comercio se abre su ficha: datos editables, historial de visitas y botón "Registrar visita".

### 3. Volver

- Comercios con interés alto o medio que no son clientes ni descartados, ordenados por `volverEl` (los vencidos primero, marcados en rojo).
- Contador de vencidos en la navegación.

### 4. Zonas

- Lista de zonas con: cantidad de comercios relevados, cuántos con interés alto, cuántos clientes y tasa de conversión (clientes / relevados).
- Mapa con los polígonos de las zonas y los comercios como puntos coloreados por interés. Usá Leaflet con OpenStreetMap (sin API key).
- Alta y edición de zonas, incluyendo editar las esquinas del polígono en el mapa.

## Exportar e importar

- Exportar comercios a CSV (separador `;`, UTF-8 con BOM para que Excel lo abra bien), con filtro opcional por zona.
- Importar el CSV que ya genera mi página actual, con estas columnas: Zona, Nombre, Dirección, Rubro, Atendió, Decide, Factura, Stock, Interés, Estado, Teléfono, Volver el, Notas, Latitud, Longitud, Creado. Mostrar una vista previa y los errores fila por fila antes de confirmar.

## Uso sin señal (fase 2)

En la calle a veces no hay datos. Convertí la web en PWA instalable y, en una segunda fase, permití cargar comercios sin conexión: se guardan en IndexedDB y se sincronizan solos al volver la señal, con un indicador visible de "pendientes de sincronizar". Usá IDs generados en el cliente (uuid) para que la sincronización no genere duplicados.

## API

Diseñá los endpoints REST que haga falta. Como mínimo:

- `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`
- `GET/POST /zonas`, `PATCH/DELETE /zonas/:id`
- `GET /comercios` (con filtros y paginación), `POST /comercios`, `GET/PATCH/DELETE /comercios/:id`
- `GET/POST /comercios/:id/visitas`
- `GET /comercios/volver`
- `GET /estadisticas/zonas`
- `GET /exportar/comercios.csv`, `POST /importar/comercios`

Documentá la API con Swagger (OpenAPI) desde NestJS.

## Seguridad

Me dedico también a ciberseguridad, así que esto es parte del alcance, no un extra:

- Toda ruta de la API protegida por autenticación, salvo login. Autorización por rol y por dueño del registro en cada endpoint, verificada en el backend.
- Validación y sanitización de toda entrada. Consultas solo a través de Prisma, nada de SQL armado a mano con strings.
- Rate limiting en login. Headers de seguridad (helmet), CORS restringido al dominio del front, cookies `httpOnly`, `secure` y `sameSite`.
- Secretos solo en variables de entorno, con un `.env.example` documentado.
- Logs sin datos sensibles (ni contraseñas, ni tokens).

## Calidad

- Tests unitarios de los servicios principales y tests e2e de los endpoints de comercios y auth.
- ESLint y Prettier configurados.
- README con: cómo levantar el entorno local, variables de entorno, cómo correr migraciones y seed, y cómo correr los tests.

## Fases sugeridas

1. Monorepo, Docker Compose, Prisma con el modelo y el seed, auth.
2. API de zonas, comercios y visitas, con Swagger y tests.
3. Front: Cargar, Comercios y ficha con historial.
4. Volver, Zonas con estadísticas y mapa.
5. Exportar e importar CSV.
6. PWA y carga sin conexión.

Proponé ajustes a este orden si ves algo mejor, y avisame antes de pasar de una fase a la siguiente.

## Decisiones abiertas

Preguntame sobre estos puntos cuando lleguemos a ellos:

- Dónde voy a desplegarlo (VPS propio, Railway, Render, otro).
- Si quiero subir fotos del frente de cada comercio y dónde guardarlas.
- Si agrego más vendedores, si cada uno tiene zonas asignadas.
