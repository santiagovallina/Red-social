export const TAMANO_MAXIMO_IMAGEN = 2 * 1024 * 1024;

export function validarImagen(archivo: File): string | null {
  if (!archivo.type.startsWith('image/')) {
    return 'El archivo debe ser una imagen';
  }
  if (archivo.size > TAMANO_MAXIMO_IMAGEN) {
    return 'La imagen no puede pesar más de 2 MB';
  }
  return null;
}
