import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { configurarApp } from './configurar-app';
import { nombreCookieSesion } from './auth/cookie';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  configurarApp(app);
  const config = app.get(ConfigService);

  // En producción la documentación queda desactivada salvo que se pida explícitamente.
  const swaggerHabilitado =
    config.get('NODE_ENV') !== 'production' || config.get('SWAGGER_ENABLED') === 'true';
  if (swaggerHabilitado) {
    const documento = new DocumentBuilder()
      .setTitle('Relevamiento TCShop API')
      .setVersion('0.1.0')
      .addCookieAuth(nombreCookieSesion())
      .build();
    SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, documento));
  }

  const puerto = config.getOrThrow<number>('PORT');
  await app.listen(puerto);
  Logger.log(`API escuchando en el puerto ${puerto}`, 'Bootstrap');
}

void bootstrap();
