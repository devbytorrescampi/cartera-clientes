import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { ComerciosModule } from './comercios/comercios.module';
import { CsvModule } from './csv/csv.module';
import { validarEntorno } from './config/env.validation';
import { EstadisticasModule } from './estadisticas/estadisticas.module';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { ZonasModule } from './zonas/zonas.module';
import { UsuariosModule } from './usuarios/usuarios.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validarEntorno,
      cache: true,
      // En tests solo valen las variables de .env.test: nunca se lee el .env con la base real.
      ignoreEnvFile: process.env.NODE_ENV === 'test',
    }),
    // Límite general amplio; el login tiene uno propio mucho más estricto.
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 300 }]),
    PrismaModule,
    AuthModule,
    ZonasModule,
    ComerciosModule,
    EstadisticasModule,
    CsvModule,
    UsuariosModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
