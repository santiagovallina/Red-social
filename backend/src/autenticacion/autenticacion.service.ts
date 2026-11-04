import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ArchivosService } from '../archivos/archivos.service.js';
import { UsuariosService } from '../usuarios/usuarios.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegistroDto } from './dto/registro.dto.js';

@Injectable()
export class AutenticacionService {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly archivosService: ArchivosService,
  ) {}

  async registro(dto: RegistroDto, foto?: Express.Multer.File) {
    const existente = await this.usuariosService.buscarPorCorreoOUsuario(
      dto.correo,
      dto.usuario,
    );
    if (existente) {
      throw new ConflictException(
        'El correo o el nombre de usuario ya está registrado',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const imagenUrl = foto
      ? await this.archivosService.subirImagen(foto, 'usuarios')
      : undefined;
    const usuario = await this.usuariosService.crear({
      ...dto,
      password: passwordHash,
      imagenUrl,
    });

    const { password, ...datos } = usuario.toObject();
    return datos;
  }

  async login(dto: LoginDto) {
    const usuario = await this.usuariosService.buscarPorIdentificador(
      dto.identificador,
    );
    const passwordValida = usuario
      ? await bcrypt.compare(dto.password, usuario.password)
      : false;
    if (!usuario || !passwordValida) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos');
    }
    if (!usuario.habilitado) {
      throw new ForbiddenException('Tu cuenta está deshabilitada');
    }

    const { password, ...datos } = usuario.toObject();
    return datos;
  }
}
