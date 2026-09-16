import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigin =
        process.env.FRONTEND_URL ?? 'http://localhost:5173';
      // Allow: no origin (mobile/curl), configured frontend, any Vercel preview URL
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

  // Strips unknown fields and auto-converts types (e.g. query string -> number)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: (errors) => {
        const messages = errors.map((e) =>
          Object.values(e.constraints ?? {}).join(', '),
        );
        return new (require('@nestjs/common').BadRequestException)(messages);
      },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`PMS backend running on http://localhost:${port}`);
}
bootstrap();
