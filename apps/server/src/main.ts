import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';
import session from 'express-session';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const defaultOrigins = ['http://localhost:3000'];
  const configuredOrigins = process.env.CORS_ORIGIN ?? process.env.FRONTEND_ORIGIN;
  const origins = configuredOrigins
    ? configuredOrigins
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
    : defaultOrigins;

  app.enableCors({
    origin: origins,
    credentials: true,
  });

  app.use(helmet());

  // Required for Passport OAuth state parameter (Google, etc.)
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'blink-dev-session-secret',
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
