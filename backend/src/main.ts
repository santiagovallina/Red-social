import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const origenes = (process.env.FRONTEND_URL ?? 'http://localhost:4200')
    .split(',')
    .map((origen) => origen.trim());
  app.enableCors({ origin: origenes });
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
