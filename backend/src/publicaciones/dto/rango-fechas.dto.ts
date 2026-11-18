import { IsDateString, IsIn, IsOptional } from 'class-validator';

export class RangoFechasDto {
  @IsDateString({}, { message: 'desde debe ser una fecha válida (ISO 8601)' })
  desde!: string;

  @IsDateString({}, { message: 'hasta debe ser una fecha válida (ISO 8601)' })
  hasta!: string;
}

export class ComentariosPorTiempoDto extends RangoFechasDto {
  @IsOptional()
  @IsIn(['hora', 'dia', 'mes'], {
    message: 'agrupar debe ser "hora", "dia" o "mes"',
  })
  agrupar?: 'hora' | 'dia' | 'mes';
}
