import { Pipe, PipeTransform } from '@angular/core';

const MINUTO = 60;
const HORA = 60 * MINUTO;
const DIA = 24 * HORA;

function conUnidad(cantidad: number, singular: string, plural: string) {
  return `hace ${cantidad} ${cantidad === 1 ? singular : plural}`;
}

// Convierte una fecha en un texto relativo: "hace un momento", "hace 5 minutos", "hace 2 días"...
@Pipe({ name: 'tiempoTranscurrido' })
export class TiempoTranscurridoPipe implements PipeTransform {
  transform(valor: string | Date | null | undefined, ahora: number = Date.now()): string {
    if (!valor) {
      return '';
    }
    const momento = new Date(valor).getTime();
    if (Number.isNaN(momento)) {
      return '';
    }

    const segundos = Math.max(Math.floor((ahora - momento) / 1000), 0);
    if (segundos < MINUTO) {
      return 'hace un momento';
    }
    if (segundos < HORA) {
      return conUnidad(Math.floor(segundos / MINUTO), 'minuto', 'minutos');
    }
    if (segundos < DIA) {
      return conUnidad(Math.floor(segundos / HORA), 'hora', 'horas');
    }

    const dias = Math.floor(segundos / DIA);
    if (dias < 30) {
      return conUnidad(dias, 'día', 'días');
    }
    if (dias < 365) {
      return conUnidad(Math.floor(dias / 30), 'mes', 'meses');
    }
    return conUnidad(Math.floor(dias / 365), 'año', 'años');
  }
}
