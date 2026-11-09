import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { opcionesImagen } from '../archivos/opciones-imagen.js';
import { JwtAuthGuard } from '../autenticacion/jwt-auth.guard.js';
import type { PayloadToken } from '../autenticacion/payload-token.js';
import { UsuarioActual } from '../autenticacion/usuario-actual.decorator.js';
import { CrearPublicacionDto } from './dto/crear-publicacion.dto.js';
import { ListarPublicacionesDto } from './dto/listar-publicaciones.dto.js';
import { ParseObjectIdPipe } from './parse-object-id.pipe.js';
import { PublicacionesService } from './publicaciones.service.js';

@Controller('publicaciones')
@UseGuards(JwtAuthGuard)
export class PublicacionesController {
  constructor(private readonly publicacionesService: PublicacionesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('imagen', opcionesImagen))
  crear(
    @UsuarioActual() usuario: PayloadToken,
    @Body() dto: CrearPublicacionDto,
    @UploadedFile() imagen?: Express.Multer.File,
  ) {
    return this.publicacionesService.crear(usuario.sub, dto, imagen);
  }

  @Get()
  listar(
    @UsuarioActual() usuario: PayloadToken,
    @Query() consulta: ListarPublicacionesDto,
  ) {
    return this.publicacionesService.listar(consulta, usuario.sub);
  }

  @Delete(':id')
  eliminar(
    @Param('id', ParseObjectIdPipe) id: string,
    @UsuarioActual() usuario: PayloadToken,
  ) {
    return this.publicacionesService.eliminar(id, usuario);
  }

  @Post(':id/me-gusta')
  darMeGusta(
    @Param('id', ParseObjectIdPipe) id: string,
    @UsuarioActual() usuario: PayloadToken,
  ) {
    return this.publicacionesService.darMeGusta(id, usuario.sub);
  }

  @Delete(':id/me-gusta')
  quitarMeGusta(
    @Param('id', ParseObjectIdPipe) id: string,
    @UsuarioActual() usuario: PayloadToken,
  ) {
    return this.publicacionesService.quitarMeGusta(id, usuario.sub);
  }
}
