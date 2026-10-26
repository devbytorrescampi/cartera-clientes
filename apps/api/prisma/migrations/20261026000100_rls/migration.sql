-- Supabase publica las tablas del schema por su API REST (PostgREST) con la clave anon.
-- RLS activado y sin políticas = esa API no puede leer ni escribir nada.
-- La app no se ve afectada: Prisma se conecta como dueño de las tablas, que no está sujeto a RLS.
ALTER TABLE "usuarios" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "zonas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "comercios" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "visitas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
