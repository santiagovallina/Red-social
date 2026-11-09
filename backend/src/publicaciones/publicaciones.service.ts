import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ArchivosService } from '../archivos/archivos.service.js';
import type { PayloadToken } from '../autenticacion/payload-token.js';
import { CrearPublicacionDto } from './dto/crear-publicacion.dto.js';
import { ListarPublicacionesDto } from './dto/listar-publicaciones.dto.js';
import {
  Publicacion,
  PublicacionDocument,
} from './schemas/publicacion.schema.js';

const CAMPOS_AUTOR = 'nombre apellido usuario imagenUrl';
const LIMITE_POR_DEFECTO = 10;

@Injectable()
export class PublicacionesService {
  constructor(
    @InjectModel(Publicacion.name)
    private readonly publicacionModel: Model<PublicacionDocument>,
    private readonly archivosService: ArchivosService,
  ) {}

  async crear(
    usuarioId: string,
    dto: CrearPublicacionDto,
    imagen?: Express.Multer.File,
  ) {
    const imagenUrl = imagen
      ? await this.archivosService.subirImagen(imagen, 'publicaciones')
      : undefined;

    const creada = await this.publicacionModel.create({
      autor: new Types.ObjectId(usuarioId),
      titulo: dto.titulo,
      mensaje: dto.mensaje,
      imagenUrl,
    });
    await creada.populate('autor', CAMPOS_AUTOR);
    return this.presentar(creada, usuarioId);
  }

  async listar(consulta: ListarPublicacionesDto, usuarioId: string) {
    const offset = consulta.offset ?? 0;
    const limit = consulta.limit ?? LIMITE_POR_DEFECTO;

    const filtro: Record<string, unknown> = { eliminada: false };
    if (consulta.usuario) {
      filtro['autor'] = new Types.ObjectId(consulta.usuario);
    }

    const orden: Record<string, 1 | -1> =
      consulta.orden === 'meGusta'
        ? { cantidadMeGusta: -1, createdAt: -1 }
        : { createdAt: -1 };

    const [publicaciones, total] = await Promise.all([
      this.publicacionModel
        .find(filtro)
        .sort(orden)
        .skip(offset)
        .limit(limit)
        .populate('autor', CAMPOS_AUTOR)
        .exec(),
      this.publicacionModel.countDocuments(filtro).exec(),
    ]);

    return {
      items: publicaciones.map((publicacion) =>
        this.presentar(publicacion, usuarioId),
      ),
      total,
      offset,
      limit,
    };
  }

  async eliminar(id: string, usuario: PayloadToken) {
    const publicacion = await this.publicacionModel
      .findOne({ _id: id, eliminada: false })
      .exec();
    if (!publicacion) {
      throw new NotFoundException('La publicación no existe');
    }

    const esAutor = publicacion.autor.toString() === usuario.sub;
    const esAdministrador = usuario.perfil === 'administrador';
    if (!esAutor && !esAdministrador) {
      throw new ForbiddenException(
        'Solo el autor o un administrador pueden eliminar la publicación',
      );
    }

    publicacion.eliminada = true;
    await publicacion.save();
    return { mensaje: 'La publicación fue eliminada' };
  }

  async darMeGusta(id: string, usuarioId: string) {
    const usuario = new Types.ObjectId(usuarioId);
    const resultado = await this.publicacionModel
      .updateOne(
        { _id: id, eliminada: false, meGusta: { $ne: usuario } },
        { $addToSet: { meGusta: usuario }, $inc: { cantidadMeGusta: 1 } },
      )
      .exec();

    if (resultado.modifiedCount === 0) {
      await this.verificarQueExiste(id);
      throw new ConflictException('Ya le diste me gusta a esta publicación');
    }
    return this.estadoMeGusta(id, usuarioId);
  }

  async quitarMeGusta(id: string, usuarioId: string) {
    const usuario = new Types.ObjectId(usuarioId);
    const resultado = await this.publicacionModel
      .updateOne(
        { _id: id, eliminada: false, meGusta: usuario },
        { $pull: { meGusta: usuario }, $inc: { cantidadMeGusta: -1 } },
      )
      .exec();

    if (resultado.modifiedCount === 0) {
      await this.verificarQueExiste(id);
      throw new ConflictException('No le habías dado me gusta a esta publicación');
    }
    return this.estadoMeGusta(id, usuarioId);
  }

  private async verificarQueExiste(id: string) {
    const existe = await this.publicacionModel
      .exists({ _id: id, eliminada: false })
      .exec();
    if (!existe) {
      throw new NotFoundException('La publicación no existe');
    }
  }

  private async estadoMeGusta(id: string, usuarioId: string) {
    const publicacion = await this.publicacionModel.findById(id).exec();
    return {
      cantidadMeGusta: publicacion?.cantidadMeGusta ?? 0,
      meGustaYo: this.leGusta(publicacion, usuarioId),
    };
  }

  private leGusta(publicacion: PublicacionDocument | null, usuarioId: string) {
    return (
      publicacion?.meGusta.some((id) => id.toString() === usuarioId) ?? false
    );
  }

  private presentar(publicacion: PublicacionDocument, usuarioId: string) {
    const { meGusta, ...datos } = publicacion.toObject();
    return { ...datos, meGustaYo: this.leGusta(publicacion, usuarioId) };
  }
}
