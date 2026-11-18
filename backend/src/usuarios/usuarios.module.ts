import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ArchivosModule } from '../archivos/archivos.module.js';
import { UsuariosController } from './usuarios.controller.js';
import { UsuariosService } from './usuarios.service.js';
import { Usuario, UsuarioSchema } from './schemas/usuario.schema.js';

@Module({
  imports: [
    ArchivosModule,
    MongooseModule.forFeature([{ name: Usuario.name, schema: UsuarioSchema }]),
  ],
  controllers: [UsuariosController],
  providers: [UsuariosService],
  exports: [UsuariosService],
})
export class UsuariosModule {}
