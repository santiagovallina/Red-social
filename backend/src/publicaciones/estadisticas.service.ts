import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Usuario, UsuarioDocument } from '../usuarios/schemas/usuario.schema.js';
import {
  ComentariosPorTiempoDto,
  RangoFechasDto,
} from './dto/rango-fechas.dto.js';
import { Comentario, ComentarioDocument } from './schemas/comentario.schema.js';
import {
  Publicacion,
  PublicacionDocument,
} from './schemas/publicacion.schema.js';

type Agrupacion = 'hora' | 'dia' | 'mes';

const ZONA_HORARIA = 'America/Argentina/Buenos_Aires';
const FORMATOS_MONGO: Record<Agrupacion, string> = {
  hora: '%Y-%m-%d %H:00',
  dia: '%Y-%m-%d',
  mes: '%Y-%m',
};
const MAXIMO_PUNTOS = 400;
const TOP_PUBLICACIONES = 5;
const HORA_EN_MS = 60 * 60 * 1000;
const DIA_EN_MS = 24 * HORA_EN_MS;

@Injectable()
export class EstadisticasService {
  constructor(
    @InjectModel(Publicacion.name)
    private readonly publicacionModel: Model<PublicacionDocument>,
    @InjectModel(Comentario.name)
    private readonly comentarioModel: Model<ComentarioDocument>,
    @InjectModel(Usuario.name)
    private readonly usuarioModel: Model<UsuarioDocument>,
  ) {}

  async publicacionesPorUsuario(consulta: RangoFechasDto) {
    const { desde, hasta } = this.leerRango(consulta);

    return this.publicacionModel
      .aggregate<{
        usuarioId: string;
        usuario: string;
        nombre: string;
        cantidad: number;
      }>([
        {
          $match: {
            eliminada: false,
            createdAt: { $gte: desde, $lte: hasta },
          },
        },
        { $group: { _id: '$autor', cantidad: { $sum: 1 } } },
        {
          $lookup: {
            from: this.usuarioModel.collection.name,
            localField: '_id',
            foreignField: '_id',
            as: 'autor',
          },
        },
        { $unwind: '$autor' },
        {
          $project: {
            _id: 0,
            usuarioId: { $toString: '$_id' },
            usuario: '$autor.usuario',
            nombre: { $concat: ['$autor.nombre', ' ', '$autor.apellido'] },
            cantidad: 1,
          },
        },
        { $sort: { cantidad: -1, usuario: 1 } },
      ])
      .exec();
  }

  async comentariosPorTiempo(consulta: ComentariosPorTiempoDto) {
    const { desde, hasta } = this.leerRango(consulta);
    const agrupar = consulta.agrupar ?? 'dia';

    // Hay que armar todos los puntos del período, incluso los que no tuvieron comentarios.
    const claves = this.clavesDelPeriodo(desde, hasta, agrupar);
    if (claves.length > MAXIMO_PUNTOS) {
      throw new BadRequestException(
        'El período es demasiado largo para esa agrupación. Elegí una más amplia.',
      );
    }

    const filas = await this.comentariosVisibles(desde, hasta)
      .group({
        _id: {
          $dateToString: {
            format: FORMATOS_MONGO[agrupar],
            date: '$createdAt',
            timezone: ZONA_HORARIA,
          },
        },
        cantidad: { $sum: 1 },
      })
      .exec();

    const porClave = new Map(
      (filas as { _id: string; cantidad: number }[]).map((fila) => [
        fila._id,
        fila.cantidad,
      ]),
    );
    const serie = claves.map((clave) => ({
      fecha: clave,
      cantidad: porClave.get(clave) ?? 0,
    }));

    return {
      total: serie.reduce((suma, punto) => suma + punto.cantidad, 0),
      agrupar,
      serie,
    };
  }

  async comentariosPorPublicacion(consulta: RangoFechasDto) {
    const { desde, hasta } = this.leerRango(consulta);

    const filas = await this.comentariosVisibles(desde, hasta)
      .group({
        _id: '$publicacion',
        titulo: { $first: '$datosPublicacion.titulo' },
        cantidad: { $sum: 1 },
      })
      .sort({ cantidad: -1, titulo: 1 })
      .limit(TOP_PUBLICACIONES)
      .exec();

    return (
      filas as { _id: { toString(): string }; titulo: string; cantidad: number }[]
    ).map((fila) => ({
      publicacionId: fila._id.toString(),
      titulo: fila.titulo,
      cantidad: fila.cantidad,
    }));
  }

  // Comentarios del período que no se dieron de baja y cuya publicación sigue disponible.
  private comentariosVisibles(desde: Date, hasta: Date) {
    return this.comentarioModel.aggregate([
      {
        $match: {
          eliminado: { $ne: true },
          createdAt: { $gte: desde, $lte: hasta },
        },
      },
      {
        $lookup: {
          from: this.publicacionModel.collection.name,
          localField: 'publicacion',
          foreignField: '_id',
          as: 'datosPublicacion',
        },
      },
      { $unwind: '$datosPublicacion' },
      { $match: { 'datosPublicacion.eliminada': false } },
    ]);
  }

  private leerRango(consulta: RangoFechasDto) {
    const desde = new Date(consulta.desde);
    const hasta = new Date(consulta.hasta);
    if (desde > hasta) {
      throw new BadRequestException('La fecha "desde" no puede ser posterior a "hasta"');
    }
    return { desde, hasta };
  }

  private clavesDelPeriodo(desde: Date, hasta: Date, agrupar: Agrupacion) {
    const paso = agrupar === 'hora' ? HORA_EN_MS : DIA_EN_MS;
    const claves = new Set<string>();

    for (let t = desde.getTime(); t <= hasta.getTime(); t += paso) {
      claves.add(this.clave(new Date(t), agrupar));
      if (claves.size > MAXIMO_PUNTOS) {
        return [...claves];
      }
    }
    claves.add(this.clave(hasta, agrupar));
    return [...claves];
  }

  private clave(fecha: Date, agrupar: Agrupacion) {
    const partes = Object.fromEntries(
      new Intl.DateTimeFormat('en-CA', {
        timeZone: ZONA_HORARIA,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        hourCycle: 'h23',
      })
        .formatToParts(fecha)
        .map((parte) => [parte.type, parte.value]),
    );
    if (agrupar === 'mes') {
      return `${partes.year}-${partes.month}`;
    }
    const dia = `${partes.year}-${partes.month}-${partes.day}`;
    return agrupar === 'dia' ? dia : `${dia} ${partes.hour}:00`;
  }
}
