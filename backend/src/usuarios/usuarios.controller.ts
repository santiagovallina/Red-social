import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { opcionesImagen } from '../archivos/opciones-imagen.js';
import { AdministradorGuard } from '../autenticacion/administrador.guard.js';
import { JwtAuthGuard } from '../autenticacion/jwt-auth.guard.js';
import type { PayloadToken } from '../autenticacion/payload-token.js';
import { UsuarioActual } from '../autenticacion/usuario-actual.decorator.js';
import { ParseObjectIdPipe } from '../publicaciones/parse-object-id.pipe.js';
import { CrearUsuarioDto } from './dto/crear-usuario.dto.js';
import { ListarUsuariosDto } from './dto/listar-usuarios.dto.js';
import { UsuariosService } from './usuarios.service.js';

@Controller('usuarios')
@UseGuards(JwtAuthGuard, AdministradorGuard)
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  listar(@Query() consulta: ListarUsuariosDto) {
    return this.usuariosService.listar(consulta);
  }

  @Post()
  @UseInterceptors(FileInterceptor('foto', opcionesImagen))
  async crear(
    @Body() dto: CrearUsuarioDto,
    @UploadedFile() foto?: Express.Multer.File,
  ) {
    const usuario = await this.usuariosService.registrar(dto, foto, dto.perfil);
    const { password, ...datos } = usuario.toObject();
    return datos;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  deshabilitar(
    @Param('id', ParseObjectIdPipe) id: string,
    @UsuarioActual() administrador: PayloadToken,
  ) {
    return this.usuariosService.cambiarHabilitado(id, false, administrador.sub);
  }

  @Post(':id/habilitar')
  @HttpCode(HttpStatus.OK)
  habilitar(
    @Param('id', ParseObjectIdPipe) id: string,
    @UsuarioActual() administrador: PayloadToken,
  ) {
    return this.usuariosService.cambiarHabilitado(id, true, administrador.sub);
  }
}
