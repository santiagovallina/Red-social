import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ArchivosService } from '../archivos/archivos.service.js';
import { UsuarioDocument } from '../usuarios/schemas/usuario.schema.js';
import { UsuariosService } from '../usuarios/usuarios.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegistroDto } from './dto/registro.dto.js';
import type { PayloadToken } from './payload-token.js';

@Injectable()
export class AutenticacionService {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly archivosService: ArchivosService,
    private readonly jwtService: JwtService,
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

    return this.respuestaConToken(usuario);
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

    return this.respuestaConToken(usuario);
  }

  private async respuestaConToken(usuario: UsuarioDocument) {
    const payload: PayloadToken = {
      sub: usuario._id.toString(),
      usuario: usuario.usuario,
      perfil: usuario.perfil,
    };
    const token = await this.jwtService.signAsync(payload);

    const { password, ...datos } = usuario.toObject();
    return { ...datos, token };
  }
}
