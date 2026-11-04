import { Module } from '@nestjs/common';
import { ArchivosModule } from '../archivos/archivos.module.js';
import { UsuariosModule } from '../usuarios/usuarios.module.js';
import { AutenticacionController } from './autenticacion.controller.js';
import { AutenticacionService } from './autenticacion.service.js';

@Module({
  imports: [UsuariosModule, ArchivosModule],
  controllers: [AutenticacionController],
  providers: [AutenticacionService],
})
export class AutenticacionModule {}
