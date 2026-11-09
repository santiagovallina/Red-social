import { Type } from 'class-transformer';
import { IsIn, IsInt, IsMongoId, IsOptional, Max, Min } from 'class-validator';

export class ListarPublicacionesDto {
  @IsOptional()
  @IsIn(['fecha', 'meGusta'], {
    message: 'El orden debe ser "fecha" o "meGusta"',
  })
  orden?: 'fecha' | 'meGusta';

  @IsOptional()
  @IsMongoId({ message: 'El usuario no es un identificador válido' })
  usuario?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
