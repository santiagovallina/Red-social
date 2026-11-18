import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ArchivosModule } from '../archivos/archivos.module.js';
import { Usuario, UsuarioSchema } from '../usuarios/schemas/usuario.schema.js';
import { ComentariosController } from './comentarios.controller.js';
import { ComentariosService } from './comentarios.service.js';
import { EstadisticasController } from './estadisticas.controller.js';
import { EstadisticasService } from './estadisticas.service.js';
import { PublicacionesController } from './publicaciones.controller.js';
import { PublicacionesService } from './publicaciones.service.js';
import { Publicacion, PublicacionSchema } from './schemas/publicacion.schema.js';
import { Comentario, ComentarioSchema } from './schemas/comentario.schema.js';

@Module({
  imports: [
    ArchivosModule,
    MongooseModule.forFeature([
      { name: Publicacion.name, schema: PublicacionSchema },
      { name: Comentario.name, schema: ComentarioSchema },
      { name: Usuario.name, schema: UsuarioSchema },
    ]),
  ],
  controllers: [
    PublicacionesController,
    ComentariosController,
    EstadisticasController,
  ],
  providers: [PublicacionesService, ComentariosService, EstadisticasService],
})
export class PublicacionesModule {}
