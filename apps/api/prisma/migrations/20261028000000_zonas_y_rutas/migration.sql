-- Además de zonas (polígonos) ahora hay rutas (líneas de A a B). Las zonas existentes quedan como zonas.
CREATE TYPE "TipoZona" AS ENUM ('ZONA', 'RUTA');

ALTER TABLE "zonas" ADD COLUMN "tipo" "TipoZona" NOT NULL DEFAULT 'ZONA';
ALTER TABLE "zonas" RENAME COLUMN "limites" TO "descripcion";
ALTER TABLE "zonas" RENAME COLUMN "poligono" TO "puntos";
