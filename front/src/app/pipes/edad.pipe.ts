import { Pipe, PipeTransform } from '@angular/core';

// Calcula los años cumplidos a partir de una fecha de nacimiento.
@Pipe({ name: 'edad' })
export class EdadPipe implements PipeTransform {
  transform(nacimiento: string | Date | null | undefined, hoy: Date = new Date()): number | null {
    if (!nacimiento) {
      return null;
    }
    const fecha = new Date(nacimiento);
    if (Number.isNaN(fecha.getTime())) {
      return null;
    }

    // La fecha de nacimiento se guarda a medianoche UTC, por eso se lee en UTC.
    let edad = hoy.getFullYear() - fecha.getUTCFullYear();
    const mes = hoy.getMonth() - fecha.getUTCMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < fecha.getUTCDate())) {
      edad--;
    }
    return Math.max(edad, 0);
  }
}
