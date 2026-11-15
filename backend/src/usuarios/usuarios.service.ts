import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Usuario, UsuarioDocument } from './schemas/usuario.schema.js';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectModel(Usuario.name)
    private readonly usuarioModel: Model<UsuarioDocument>,
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

  async crear(datos: Partial<Usuario>) {
    return this.usuarioModel.create(datos);
  }
}
