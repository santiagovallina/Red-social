import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../autenticacion/jwt-auth.guard.js';
import type { PayloadToken } from '../autenticacion/payload-token.js';
import { UsuarioActual } from '../autenticacion/usuario-actual.decorator.js';
import { ComentariosService } from './comentarios.service.js';
import { ComentarioDto } from './dto/comentario.dto.js';
import { ListarComentariosDto } from './dto/listar-comentarios.dto.js';
import { ParseObjectIdPipe } from './parse-object-id.pipe.js';

@Controller('publicaciones/:publicacionId/comentarios')
@UseGuards(JwtAuthGuard)
export class ComentariosController {
  constructor(private readonly comentariosService: ComentariosService) {}

  @Post()
  crear(
    @Param('publicacionId', ParseObjectIdPipe) publicacionId: string,
    @UsuarioActual() usuario: PayloadToken,
    @Body() dto: ComentarioDto,
  ) {
    return this.comentariosService.crear(publicacionId, usuario.sub, dto);
  }

  @Get()
  listar(
    @Param('publicacionId', ParseObjectIdPipe) publicacionId: string,
    @Query() consulta: ListarComentariosDto,
  ) {
    return this.comentariosService.listar(publicacionId, consulta);
  }

  @Put(':comentarioId')
  editar(
    @Param('publicacionId', ParseObjectIdPipe) publicacionId: string,
    @Param('comentarioId', ParseObjectIdPipe) comentarioId: string,
    @UsuarioActual() usuario: PayloadToken,
    @Body() dto: ComentarioDto,
  ) {
    return this.comentariosService.editar(
      publicacionId,
      comentarioId,
      usuario.sub,
      dto,
    );
  }
}
