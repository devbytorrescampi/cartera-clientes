import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

/** Middlewares y pipes globales. Se comparte con los tests e2e para probar la app tal como corre. */
export function configurarApp(app: NestExpressApplication): INestApplication {
  const config = app.get(ConfigService);

  // Detrás del proxy de Render: necesario para que el rate limiting vea la IP real.
  if (config.get('NODE_ENV') === 'production') app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: config
      .getOrThrow<string>('CORS_ORIGIN')
      .split(',')
      .map((origen) => origen.trim())
      .filter(Boolean),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableShutdownHooks();
  return app;
}
