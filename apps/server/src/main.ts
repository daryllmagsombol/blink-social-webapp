import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';
import session from 'express-session';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configuredOrigins = process.env.FRONTEND_URL ?? process.env.FRONTEND_ORIGIN;
  if (!configuredOrigins) {
    throw new Error('FRONTEND_URL or FRONTEND_ORIGIN environment variable is required');
  }
  const origins = configuredOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: origins,
    credentials: true,
  });

  app.use(
    helmet({
      crossOriginResourcePolicy: {
        policy: process.env.NODE_ENV === 'production' ? 'same-origin' : 'cross-origin',
      },
    }),
  );

  // Required for Passport OAuth state parameter (Google, etc.)
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    throw new Error('SESSION_SECRET environment variable is required');
  }
  app.use(
    session({
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 1000 * 60 * 10, // 10 min — only needed during OAuth handshake
        sameSite: 'lax',
      },
    }),
  );

  app.enableShutdownHooks();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port, '0.0.0.0');
  console.log(`Server running on port ${port}`);
}
bootstrap();
