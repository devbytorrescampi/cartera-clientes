-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'VENDEDOR');

-- CreateEnum
CREATE TYPE "Rubro" AS ENUM ('ALMACEN', 'FERRETERIA', 'INDUMENTARIA', 'KIOSCO', 'OTRO');

-- CreateEnum
CREATE TYPE "Atendio" AS ENUM ('DUENO', 'EMPLEADO');

-- CreateEnum
CREATE TYPE "Facturacion" AS ENUM ('TALONARIO', 'WEB_ARCA', 'OTRO_SISTEMA', 'NO_FACTURA');

-- CreateEnum
CREATE TYPE "ControlStock" AS ENUM ('CUADERNO', 'EXCEL', 'SISTEMA', 'NO_CONTROLA');

-- CreateEnum
CREATE TYPE "Interes" AS ENUM ('ALTO', 'MEDIO', 'BAJO');

-- CreateEnum
CREATE TYPE "EstadoComercio" AS ENUM ('RELEVADO', 'DEMO_AGENDADA', 'DEMO_HECHA', 'CLIENTE', 'DESCARTADO');

-- CreateEnum
CREATE TYPE "TipoVisita" AS ENUM ('RELEVAMIENTO', 'DEMO', 'SEGUIMIENTO', 'LLAMADA_WHATSAPP');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'VENDEDOR',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zonas" (
    "id" SERIAL NOT NULL,
    "numero" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "limites" TEXT NOT NULL,
    "poligono" JSONB NOT NULL,
    "nota" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "zonas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comercios" (
    "id" UUID NOT NULL,
    "zonaId" INTEGER NOT NULL,
    "nombre" TEXT,
    "direccion" TEXT,
    "lat" DECIMAL(9,6),
    "lng" DECIMAL(9,6),
    "rubro" "Rubro" NOT NULL,
    "atendio" "Atendio",
    "contactoNombre" TEXT,
    "telefonoCodArea" TEXT,
    "telefonoNumero" TEXT,
    "facturacion" "Facturacion",
    "stock" "ControlStock",
    "sistemaActual" TEXT,
    "interes" "Interes",
    "estado" "EstadoComercio" NOT NULL DEFAULT 'RELEVADO',
    "volverEl" DATE,
    "notas" TEXT,
    "creadoPorId" UUID NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "eliminadoEn" TIMESTAMP(3),

    CONSTRAINT "comercios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitas" (
    "id" UUID NOT NULL,
    "comercioId" UUID NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo" "TipoVisita" NOT NULL,
    "resultado" TEXT,
    "notas" TEXT,
    "usuarioId" UUID NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visitas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "zonas_numero_key" ON "zonas"("numero");

-- CreateIndex
CREATE INDEX "comercios_zonaId_idx" ON "comercios"("zonaId");

-- CreateIndex
CREATE INDEX "comercios_creadoPorId_idx" ON "comercios"("creadoPorId");

-- CreateIndex
CREATE INDEX "comercios_estado_idx" ON "comercios"("estado");

-- CreateIndex
CREATE INDEX "comercios_volverEl_idx" ON "comercios"("volverEl");

-- CreateIndex
CREATE INDEX "visitas_comercioId_fecha_idx" ON "visitas"("comercioId", "fecha");

-- AddForeignKey
ALTER TABLE "comercios" ADD CONSTRAINT "comercios_zonaId_fkey" FOREIGN KEY ("zonaId") REFERENCES "zonas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comercios" ADD CONSTRAINT "comercios_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitas" ADD CONSTRAINT "visitas_comercioId_fkey" FOREIGN KEY ("comercioId") REFERENCES "comercios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitas" ADD CONSTRAINT "visitas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

