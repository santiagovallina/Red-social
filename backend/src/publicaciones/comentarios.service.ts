import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ComentarioDto } from './dto/comentario.dto.js';
import { ListarComentariosDto } from './dto/listar-comentarios.dto.js';
import { Comentario, ComentarioDocument } from './schemas/comentario.schema.js';
import {
  Publicacion,
  PublicacionDocument,
} from './schemas/publicacion.schema.js';

const CAMPOS_AUTOR = 'nombre apellido usuario imagenUrl';
const LIMITE_POR_DEFECTO = 5;

@Injectable()
export class ComentariosService {
  constructor(
    @InjectModel(Comentario.name)
    private readonly comentarioModel: Model<ComentarioDocument>,
    @InjectModel(Publicacion.name)
    private readonly publicacionModel: Model<PublicacionDocument>,
  ) {}

  async crear(publicacionId: string, usuarioId: string, dto: ComentarioDto) {
    await this.verificarQueExiste(publicacionId);

    const creado = await this.comentarioModel.create({
      publicacion: new Types.ObjectId(publicacionId),
      autor: new Types.ObjectId(usuarioId),
      mensaje: dto.mensaje.trim(),
    });
    await creado.populate('autor', CAMPOS_AUTOR);
    return creado.toObject();
  }

  async listar(publicacionId: string, consulta: ListarComentariosDto) {
    await this.verificarQueExiste(publicacionId);

    const offset = consulta.offset ?? 0;
    const limit = consulta.limit ?? LIMITE_POR_DEFECTO;
    const filtro = { publicacion: new Types.ObjectId(publicacionId) };

    const [comentarios, total] = await Promise.all([
      this.comentarioModel
        .find(filtro)
        .sort({ createdAt: -1, _id: -1 })
        .skip(offset)
        .limit(limit)
        .populate('autor', CAMPOS_AUTOR)
        .exec(),
      this.comentarioModel.countDocuments(filtro).exec(),
    ]);

    return {
      items: comentarios.map((comentario) => comentario.toObject()),
      total,
      offset,
      limit,
    };
  }

  async editar(
    publicacionId: string,
    comentarioId: string,
    usuarioId: string,
    dto: ComentarioDto,
  ) {
    await this.verificarQueExiste(publicacionId);

    const comentario = await this.comentarioModel
      .findOne({
        _id: comentarioId,
        publicacion: new Types.ObjectId(publicacionId),
      })
      .exec();
    if (!comentario) {
      throw new NotFoundException('El comentario no existe');
    }
    if (comentario.autor.toString() !== usuarioId) {
      throw new ForbiddenException('Solo el autor puede editar el comentario');
    }

    comentario.mensaje = dto.mensaje.trim();
    comentario.modificado = true;
    await comentario.save();
    await comentario.populate('autor', CAMPOS_AUTOR);
    return comentario.toObject();
  }

  private async verificarQueExiste(publicacionId: string) {
    const existe = await this.publicacionModel
      .exists({ _id: publicacionId, eliminada: false })
      .exec();
    if (!existe) {
      throw new NotFoundException('La publicación no existe');
    }
  }
}
