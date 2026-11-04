import {
  IsDate,
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RegistroDto {
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsString()
  @IsNotEmpty()
  apellido!: string;

  @IsEmail()
  correo!: string;

  @IsString()
  @MinLength(3)
  usuario!: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/[A-Z]/, { message: 'La contraseña debe tener una mayúscula' })
  @Matches(/\d/, { message: 'La contraseña debe tener un número' })
  password!: string;

  @Type(() => Date)
  @IsDate()
  fechaNacimiento!: Date;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  descripcion!: string;
}
