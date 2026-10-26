-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN "sesionVersion" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "comercios_eliminadoEn_idx" ON "comercios"("eliminadoEn");
