import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ComentarioDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  mensaje!: string;
}
