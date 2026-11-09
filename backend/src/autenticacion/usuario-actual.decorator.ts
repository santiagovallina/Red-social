import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { PayloadToken } from './payload-token.js';

export const UsuarioActual = createParamDecorator(
  (_dato: unknown, contexto: ExecutionContext): PayloadToken =>
    contexto.switchToHttp().getRequest<{ usuario: PayloadToken }>().usuario,
);
