import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { AppModule } from '../dist/app.module.js';
import { configurarApp } from '../dist/configurar-app.js';

let servidor;

async function crearServidor() {
  const express_app = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(express_app));
  configurarApp(app);
  await app.init();
  return express_app;
}

export default async function handler(req, res) {
  servidor ??= crearServidor().catch((error) => {
    servidor = undefined;
    throw error;
  });
  const app = await servidor;
  return app(req, res);
}
