import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

const quitarEspacios = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

// Solo estos campos se pueden editar: el correo, el usuario, la contraseña y el perfil no.
// Con forbidNonWhitelisted, enviar cualquier otro campo devuelve 400.
export class ActualizarPerfilDto {
  @IsOptional()
  @Transform(quitarEspacios)
  @IsString()
  @IsNotEmpty({ message: 'El nombre no puede estar vacío' })
  nombre?: string;

  @IsOptional()
  @Transform(quitarEspacios)
  @IsString()
  @IsNotEmpty({ message: 'El apellido no puede estar vacío' })
  apellido?: string;

  @IsOptional()
  @Transform(quitarEspacios)
  @IsString()
  @IsNotEmpty({ message: 'La descripción no puede estar vacía' })
  @MaxLength(200)
  descripcion?: string;
}
