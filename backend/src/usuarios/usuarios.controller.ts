import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
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
import { ActualizarPerfilDto } from './dto/actualizar-perfil.dto.js';
import { CrearUsuarioDto } from './dto/crear-usuario.dto.js';
import { ListarUsuariosDto } from './dto/listar-usuarios.dto.js';
import { UsuariosService } from './usuarios.service.js';

// Todas las rutas exigen un token válido. Las de gestión de usuarios, además, perfil de administrador.
@Controller('usuarios')
@UseGuards(JwtAuthGuard)
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  // Edición del perfil propio (cualquier usuario logueado). Va antes de las rutas con :id.
  @Patch('perfil')
  @UseInterceptors(FileInterceptor('foto', opcionesImagen))
  actualizarPerfil(
    @UsuarioActual() usuario: PayloadToken,
    @Body() dto: ActualizarPerfilDto,
    @UploadedFile() foto?: Express.Multer.File,
  ) {
    return this.usuariosService.actualizarPerfil(usuario.sub, dto, foto);
  }

  @Get()
  @UseGuards(AdministradorGuard)
  listar(@Query() consulta: ListarUsuariosDto) {
    return this.usuariosService.listar(consulta);
  }

  @Post()
  @UseGuards(AdministradorGuard)
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
  @UseGuards(AdministradorGuard)
  @HttpCode(HttpStatus.OK)
  deshabilitar(
    @Param('id', ParseObjectIdPipe) id: string,
    @UsuarioActual() administrador: PayloadToken,
  ) {
    return this.usuariosService.cambiarHabilitado(id, false, administrador.sub);
  }

  @Post(':id/habilitar')
  @UseGuards(AdministradorGuard)
  @HttpCode(HttpStatus.OK)
  habilitar(
    @Param('id', ParseObjectIdPipe) id: string,
    @UsuarioActual() administrador: PayloadToken,
  ) {
    return this.usuariosService.cambiarHabilitado(id, true, administrador.sub);
  }
}
