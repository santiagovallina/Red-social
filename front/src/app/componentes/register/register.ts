import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
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
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { RegistroData } from '../../modelos/registro-data';
import { Auth } from '../../servicios/auth';
import { Modal } from '../../servicios/modal';

const TAMANO_MAXIMO_FOTO = 2 * 1024 * 1024;

function fechaDeHoy(): string {
  const ahora = new Date();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  return `${ahora.getFullYear()}-${mes}-${dia}`;
}

@Component({
  imports: [FormField, MatButtonModule, RouterLink],
  selector: 'app-register',
  styleUrl: './register.css',
  templateUrl: './register.html',
})
export class Register {
  private auth = inject(Auth);
  private router = inject(Router);
  private modal = inject(Modal);

  readonly hoy = fechaDeHoy();

  registroModel = signal<RegistroData>({
    nombre: '',
    apellido: '',
    correo: '',
    usuario: '',
    password: '',
    repetirPassword: '',
    fechaNacimiento: '',
    descripcion: '',
  });

  registroForm = form(this.registroModel, (campos) => {
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
    if (!archivo.type.startsWith('image/')) {
      this.errorFoto.set('El archivo debe ser una imagen');
      entrada.value = '';
      return;
    }
    if (archivo.size > TAMANO_MAXIMO_FOTO) {
      this.errorFoto.set('La imagen no puede pesar más de 2 MB');
      entrada.value = '';
      return;
    }

    this.foto.set(archivo);
    this.vistaPrevia.set(URL.createObjectURL(archivo));
  }

  enviar(evento: Event) {
    evento.preventDefault();

    submit(this.registroForm, async () => {
      const datos = this.registroModel();
      const formData = new FormData();
      formData.append('nombre', datos.nombre);
      formData.append('apellido', datos.apellido);
      formData.append('correo', datos.correo);
      formData.append('usuario', datos.usuario);
      formData.append('password', datos.password);
      formData.append('fechaNacimiento', datos.fechaNacimiento);
      formData.append('descripcion', datos.descripcion);

      const foto = this.foto();
      if (foto) {
        formData.append('foto', foto);
      }

      try {
        await firstValueFrom(this.auth.registrar(formData));
        this.modal
          .mostrar('¡Registro exitoso!', 'Tu cuenta fue creada. Ya podés iniciar sesión.')
          .afterClosed()
          .subscribe(() => this.router.navigate(['/login']));
      } catch (error) {
        this.mostrarError(error);
      }
    });
  }

  private mostrarError(error: unknown) {
    const estado = error instanceof HttpErrorResponse ? error.status : 0;

    if (estado === 409) {
      this.modal.mostrar('No pudimos registrarte', 'El correo o el nombre de usuario ya está registrado.');
    } else if (estado === 400 || estado === 413) {
      const mensaje = error instanceof HttpErrorResponse ? error.error?.message : null;
      const detalle = Array.isArray(mensaje) ? mensaje.join('. ') : mensaje;
      this.modal.mostrar('Revisá los datos', detalle ?? 'Alguno de los datos enviados no es válido.');
    } else {
      this.modal.mostrar('Error de conexión', 'No pudimos comunicarnos con el servidor. Intentá de nuevo en unos minutos.');
    }
  }
}
