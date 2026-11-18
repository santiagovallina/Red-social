import { Pipe, PipeTransform } from '@angular/core';

// Devuelve la cantidad con la palabra en singular o plural: "1 comentario", "5 comentarios".
@Pipe({ name: 'pluralizar' })
export class PluralizarPipe implements PipeTransform {
  transform(cantidad: number | null | undefined, singular: string, plural: string): string {
    const total = cantidad ?? 0;
    return `${total} ${total === 1 ? singular : plural}`;
  }
}
