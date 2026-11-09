import { BadRequestException } from '@nestjs/common';

export const opcionesImagen = {
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (
    _req: unknown,
    file: Express.Multer.File,
    cb: (error: Error | null, aceptar: boolean) => void,
  ) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new BadRequestException('El archivo debe ser una imagen'), false);
    }
    cb(null, true);
  },
};
