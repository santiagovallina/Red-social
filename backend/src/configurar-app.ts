import { INestApplication, ValidationPipe } from '@nestjs/common';

export function configurarApp(app: INestApplication) {
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
}
