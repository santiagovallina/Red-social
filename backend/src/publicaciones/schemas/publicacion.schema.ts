import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PublicacionDocument = HydratedDocument<Publicacion>;

@Schema({ timestamps: true, collection: 'publicaciones' })
export class Publicacion {
  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true })
  autor!: Types.ObjectId;

  @Prop({ required: true })
  titulo!: string;

  @Prop({ required: true })
  mensaje!: string;

  @Prop()
  imagenUrl?: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Usuario' }], default: [] })
  meGusta!: Types.ObjectId[];

  @Prop({ default: 0 })
  cantidadMeGusta!: number;

  @Prop({ default: false })
  eliminada!: boolean;
}

export const PublicacionSchema = SchemaFactory.createForClass(Publicacion);
PublicacionSchema.index({ eliminada: 1, createdAt: -1 });
PublicacionSchema.index({ eliminada: 1, cantidadMeGusta: -1, createdAt: -1 });
