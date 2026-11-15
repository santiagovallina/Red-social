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
    await this.obtenerPublicacion(publicacionId);

    const creado = await this.comentarioModel.create({
      publicacion: new Types.ObjectId(publicacionId),
      autor: new Types.ObjectId(usuarioId),
      mensaje: dto.mensaje.trim(),
    });
    await creado.populate('autor', CAMPOS_AUTOR);
    return creado.toObject();
  }

  async listar(publicacionId: string, consulta: ListarComentariosDto) {
    await this.obtenerPublicacion(publicacionId);

    const offset = consulta.offset ?? 0;
    const limit = consulta.limit ?? LIMITE_POR_DEFECTO;
    const filtro = {
      publicacion: new Types.ObjectId(publicacionId),
      eliminado: { $ne: true },
    };

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
    await this.obtenerPublicacion(publicacionId);
    const comentario = await this.obtenerComentario(publicacionId, comentarioId);

    if (comentario.autor.toString() !== usuarioId) {
      throw new ForbiddenException('Solo el autor puede editar el comentario');
    }

    comentario.mensaje = dto.mensaje.trim();
    comentario.modificado = true;
    await comentario.save();
    await comentario.populate('autor', CAMPOS_AUTOR);
    return comentario.toObject();
  }

  async eliminar(publicacionId: string, comentarioId: string, usuarioId: string) {
    const publicacion = await this.obtenerPublicacion(publicacionId);
    const comentario = await this.obtenerComentario(publicacionId, comentarioId);

    const esAutorDelComentario = comentario.autor.toString() === usuarioId;
    const esDuenoDeLaPublicacion = publicacion.autor.toString() === usuarioId;
    if (!esAutorDelComentario && !esDuenoDeLaPublicacion) {
      throw new ForbiddenException(
        'Solo quien escribió el comentario o el dueño de la publicación pueden eliminarlo',
      );
    }

    comentario.eliminado = true;
    await comentario.save();
    return { mensaje: 'El comentario fue eliminado' };
  }

  private async obtenerPublicacion(publicacionId: string) {
    const publicacion = await this.publicacionModel
      .findOne({ _id: publicacionId, eliminada: false })
      .exec();
    if (!publicacion) {
      throw new NotFoundException('La publicación no existe');
    }
    return publicacion;
  }

  private async obtenerComentario(publicacionId: string, comentarioId: string) {
    const comentario = await this.comentarioModel
      .findOne({
        _id: comentarioId,
        publicacion: new Types.ObjectId(publicacionId),
        eliminado: { $ne: true },
      })
      .exec();
    if (!comentario) {
      throw new NotFoundException('El comentario no existe');
    }
    return comentario;
  }
}
