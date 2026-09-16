/**
 * Vercel Serverless Entry Point for NestJS
 * @vercel/node compiles this TypeScript file directly.
 * The app is cached across warm invocations to avoid cold-start overhead.
 */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import type { INestApplication } from '@nestjs/common';
import type { IncomingMessage, ServerResponse } from 'http';

let cachedApp: INestApplication;

async function bootstrap(): Promise<INestApplication> {
  if (cachedApp) return cachedApp;

  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });

  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigin = process.env.FRONTEND_URL ?? 'http://localhost:5173';
      if (
        !origin ||
        origin === allowedOrigin ||
        /^https:\/\/.*\.vercel\.app$/.test(origin) ||
        origin === 'http://localhost:5173'
      ) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: (errors) => {
        const messages = errors.map((e) =>
          Object.values(e.constraints ?? {}).join(', '),
        );
        return new BadRequestException(messages);
      },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  await app.init();
  cachedApp = app;
  return app;
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  const app = await bootstrap();
  const expressApp = app.getHttpAdapter().getInstance();
  return expressApp(req, res);
}
