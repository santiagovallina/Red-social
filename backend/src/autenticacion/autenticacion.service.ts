import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsuarioDocument } from '../usuarios/schemas/usuario.schema.js';
import { UsuariosService } from '../usuarios/usuarios.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegistroDto } from './dto/registro.dto.js';
import type { PayloadToken } from './payload-token.js';

@Injectable()
export class AutenticacionService {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly jwtService: JwtService,
  ) {}

  async registro(dto: RegistroDto, foto?: Express.Multer.File) {
    const usuario = await this.usuariosService.registrar(dto, foto);
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

  async autorizar(payload: PayloadToken) {
    const usuario = await this.usuariosService.buscarPorId(payload.sub);
    if (!usuario || !usuario.habilitado) {
      throw new UnauthorizedException('La sesión ya no es válida');
    }

    const { password, ...datos } = usuario.toObject();
    return datos;
  }

  async refrescar(payload: PayloadToken) {
    const token = await this.jwtService.signAsync({
      sub: payload.sub,
      usuario: payload.usuario,
      perfil: payload.perfil,
    });
    return { token };
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
