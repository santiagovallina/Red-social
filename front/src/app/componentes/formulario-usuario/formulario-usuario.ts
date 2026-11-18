import { Component, ElementRef, input, output, signal, viewChild } from '@angular/core';
import {
  email,
  form,
  FormField,
  maxLength,
  minLength,
  pattern,
  required,
  submit,
  validate,
} from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { AutofocoDirective } from '../../directivas/autofoco.directive';
import { FormularioUsuarioData } from '../../modelos/registro-data';
import { validarImagen } from '../../utilidades/imagen';

function fechaDeHoy(): string {
  const ahora = new Date();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  return `${ahora.getFullYear()}-${mes}-${dia}`;
}

const DATOS_INICIALES: FormularioUsuarioData = {
  nombre: '',
  apellido: '',
  correo: '',
  usuario: '',
  password: '',
  repetirPassword: '',
  fechaNacimiento: '',
  descripcion: '',
  perfil: 'usuario',
};

// Formulario de datos de usuario que comparten el registro y el alta del administrador.
// No hace pedidos al servidor: arma el FormData y lo emite para que lo envíe quien lo usa.
@Component({
  imports: [AutofocoDirective, FormField, MatButtonModule],
  selector: 'app-formulario-usuario',
  styleUrl: './formulario-usuario.css',
  templateUrl: './formulario-usuario.html',
})
export class FormularioUsuario {
  conPerfil = input(false);
  textoBoton = input('Crear cuenta');
  textoEnviando = input('Creando cuenta...');
  enviando = input(false);
  datos = output<FormData>();

  private entradaFoto = viewChild<ElementRef<HTMLInputElement>>('entradaFoto');

  readonly hoy = fechaDeHoy();

  usuarioModel = signal<FormularioUsuarioData>({ ...DATOS_INICIALES });

  usuarioForm = form(this.usuarioModel, (campos) => {
    required(campos.nombre, { message: 'El nombre es obligatorio' });
    required(campos.apellido, { message: 'El apellido es obligatorio' });

    required(campos.correo, { message: 'El correo es obligatorio' });
    email(campos.correo, { message: 'Ingresá un correo válido' });

    required(campos.usuario, { message: 'El nombre de usuario es obligatorio' });
    minLength(campos.usuario, 3, { message: 'Debe tener al menos 3 caracteres' });

    required(campos.password, { message: 'La contraseña es obligatoria' });
    minLength(campos.password, 8, { message: 'Debe tener al menos 8 caracteres' });
    pattern(campos.password, /[A-Z]/, { message: 'Debe incluir una mayúscula' });
    pattern(campos.password, /\d/, { message: 'Debe incluir un número' });

    required(campos.repetirPassword, { message: 'Repetí la contraseña' });
    validate(campos.repetirPassword, ({ value, valueOf }) =>
      value() !== valueOf(campos.password)
        ? { kind: 'noCoincide', message: 'Las contraseñas no coinciden' }
        : undefined,
    );

    required(campos.fechaNacimiento, { message: 'La fecha de nacimiento es obligatoria' });
    validate(campos.fechaNacimiento, ({ value }) =>
      value() > fechaDeHoy()
        ? { kind: 'fechaFutura', message: 'La fecha no puede ser futura' }
        : undefined,
    );

    required(campos.descripcion, { message: 'Escribí una descripción breve' });
    maxLength(campos.descripcion, 200, { message: 'No puede superar los 200 caracteres' });
  });

  foto = signal<File | null>(null);
  vistaPrevia = signal<string | null>(null);
  errorFoto = signal<string | null>(null);

  seleccionarFoto(evento: Event) {
    const entrada = evento.target as HTMLInputElement;
    const archivo = entrada.files?.[0] ?? null;

    this.errorFoto.set(null);
    this.foto.set(null);
    this.vistaPrevia.set(null);

    if (!archivo) {
      return;
    }
    const errorImagen = validarImagen(archivo);
    if (errorImagen) {
      this.errorFoto.set(errorImagen);
      entrada.value = '';
      return;
    }

    this.foto.set(archivo);
    this.vistaPrevia.set(URL.createObjectURL(archivo));
  }

  enviar(evento: Event) {
    evento.preventDefault();

    submit(this.usuarioForm, async () => {
      const valores = this.usuarioModel();
      const formData = new FormData();
      formData.append('nombre', valores.nombre);
      formData.append('apellido', valores.apellido);
      formData.append('correo', valores.correo);
      formData.append('usuario', valores.usuario);
      formData.append('password', valores.password);
      formData.append('fechaNacimiento', valores.fechaNacimiento);
      formData.append('descripcion', valores.descripcion);
      if (this.conPerfil()) {
        formData.append('perfil', valores.perfil);
      }

      const foto = this.foto();
      if (foto) {
        formData.append('foto', foto);
      }

      this.datos.emit(formData);
    });
  }

  // Lo llama quien usa el formulario cuando el alta salió bien.
  reiniciar() {
    this.usuarioModel.set({ ...DATOS_INICIALES });
    this.usuarioForm().reset();
    this.foto.set(null);
    this.vistaPrevia.set(null);
    this.errorFoto.set(null);
    const entrada = this.entradaFoto();
    if (entrada) {
      entrada.nativeElement.value = '';
    }
  }
}
