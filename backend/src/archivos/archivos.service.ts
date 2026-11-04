import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { randomUUID } from 'node:crypto';

@Injectable()
export class ArchivosService {
  constructor(config: ConfigService) {
    cloudinary.config({
      cloud_name: config.getOrThrow<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: config.getOrThrow<string>('CLOUDINARY_API_KEY'),
      api_secret: config.getOrThrow<string>('CLOUDINARY_API_SECRET'),
    });
  }

  subirImagen(file: Express.Multer.File, carpeta: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: carpeta, public_id: randomUUID(), resource_type: 'image' },
        (error, result) => {
          if (error || !result?.secure_url) {
            reject(
              new InternalServerErrorException('No se pudo subir la imagen'),
            );
          } else {
            resolve(result.secure_url);
          }
        },
      );
      stream.end(file.buffer);
    });
  }
}
