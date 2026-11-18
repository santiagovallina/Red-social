import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { ArchivosService } from '../archivos/archivos.service.js';
import type { RegistroDto } from '../autenticacion/dto/registro.dto.js';
import { ActualizarPerfilDto } from './dto/actualizar-perfil.dto.js';
import { ListarUsuariosDto } from './dto/listar-usuarios.dto.js';
import { Usuario, UsuarioDocument } from './schemas/usuario.schema.js';

const LIMITE_POR_DEFECTO = 10;

@Injectable()
export class UsuariosService {
  constructor(
    @InjectModel(Usuario.name)
    private readonly usuarioModel: Model<UsuarioDocument>,
    private readonly archivosService: ArchivosService,
  ) {}

  async buscarPorCorreoOUsuario(correo: string, usuario: string) {
    return this.usuarioModel
      .findOne({ $or: [{ correo: correo.toLowerCase() }, { usuario }] })
      .exec();
  }

  async buscarPorIdentificador(identificador: string) {
    return this.usuarioModel
      .findOne({
        $or: [{ correo: identificador.toLowerCase() }, { usuario: identificador }],
      })
      .exec();
  }

  async buscarPorId(id: string) {
    return this.usuarioModel.findById(id).exec();
  }

  // Lo usan el registro público (perfil "usuario") y el alta del administrador.
  async registrar(
    dto: RegistroDto,
    foto?: Express.Multer.File,
    perfil: 'usuario' | 'administrador' = 'usuario',
  ) {
    const existente = await this.buscarPorCorreoOUsuario(dto.correo, dto.usuario);
    if (existente) {
      throw new ConflictException(
        'El correo o el nombre de usuario ya está registrado',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const imagenUrl = foto
      ? await this.archivosService.subirImagen(foto, 'usuarios')
      : undefined;

    return this.usuarioModel.create({
      ...dto,
      perfil,
      password: passwordHash,
      imagenUrl,
    });
  }

  async listar(consulta: ListarUsuariosDto) {
    const offset = consulta.offset ?? 0;
    const limit = consulta.limit ?? LIMITE_POR_DEFECTO;

    const [usuarios, total] = await Promise.all([
      this.usuarioModel
        .find()
        .select('-password')
        .sort({ createdAt: -1, _id: -1 })
        .skip(offset)
        .limit(limit)
        .exec(),
      this.usuarioModel.countDocuments().exec(),
    ]);

    return {
      items: usuarios.map((usuario) => usuario.toObject()),
      total,
      offset,
      limit,
    };
  }

  async actualizarPerfil(
    id: string,
    dto: ActualizarPerfilDto,
    foto?: Express.Multer.File,
  ) {
    const usuario = await this.usuarioModel.findById(id).exec();
    if (!usuario || !usuario.habilitado) {
      throw new NotFoundException('El usuario no existe');
    }

    if (dto.nombre !== undefined) usuario.nombre = dto.nombre;
    if (dto.apellido !== undefined) usuario.apellido = dto.apellido;
    if (dto.descripcion !== undefined) usuario.descripcion = dto.descripcion;
    if (foto) {
      usuario.imagenUrl = await this.archivosService.subirImagen(foto, 'usuarios');
    }

    await usuario.save();
    const { password, ...datos } = usuario.toObject();
    return datos;
  }

  async cambiarHabilitado(id: string, habilitado: boolean, administradorId: string) {
    if (!habilitado && id === administradorId) {
      throw new ForbiddenException('No podés deshabilitar tu propia cuenta');
    }

    const usuario = await this.usuarioModel
      .findByIdAndUpdate(id, { habilitado }, { returnDocument: 'after' })
      .select('-password')
      .exec();
    if (!usuario) {
      throw new NotFoundException('El usuario no existe');
    }
    return usuario.toObject();
  }
}
