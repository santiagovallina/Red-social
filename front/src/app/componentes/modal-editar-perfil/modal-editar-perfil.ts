import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { form, FormField, maxLength, required, submit } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { Auth } from '../../servicios/auth';
import { Modal } from '../../servicios/modal';
import { validarImagen } from '../../utilidades/imagen';

@Component({
  imports: [FormField, MatButtonModule, MatDialogModule],
  selector: 'app-modal-editar-perfil',
  styleUrl: './modal-editar-perfil.css',
  templateUrl: './modal-editar-perfil.html',
})
export class ModalEditarPerfil {
  private auth = inject(Auth);
  private modal = inject(Modal);
  private dialogo = inject<MatDialogRef<ModalEditarPerfil, boolean>>(MatDialogRef);

  private actual = this.auth.usuario();

  perfilModel = signal({
    nombre: this.actual?.nombre ?? '',
    apellido: this.actual?.apellido ?? '',
    descripcion: this.actual?.descripcion ?? '',
  });

  perfilForm = form(this.perfilModel, (campos) => {
    required(campos.nombre, { message: 'El nombre es obligatorio' });
    required(campos.apellido, { message: 'El apellido es obligatorio' });
    required(campos.descripcion, { message: 'Escribí una descripción breve' });
    maxLength(campos.descripcion, 200, { message: 'No puede superar los 200 caracteres' });
  });

  foto = signal<File | null>(null);
  vistaPrevia = signal<string | null>(null);
  errorFoto = signal<string | null>(null);

  // Muestra la foto nueva elegida; si no hay, la actual; si tampoco, la inicial del nombre.
  fotoAMostrar = computed(() => this.vistaPrevia() ?? this.actual?.imagenUrl ?? null);
  inicial = computed(() => (this.perfilModel().nombre || this.actual?.nombre || '?').charAt(0).toUpperCase());
  guardando = signal(false);

  seleccionarFoto(evento: Event) {
    const entrada = evento.target as HTMLInputElement;
    const archivo = entrada.files?.[0] ?? null;

    this.errorFoto.set(null);
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

  guardar(evento: Event) {
    evento.preventDefault();

    submit(this.perfilForm, async () => {
      const datos = this.perfilModel();
      const formData = new FormData();
      formData.append('nombre', datos.nombre.trim());
      formData.append('apellido', datos.apellido.trim());
      formData.append('descripcion', datos.descripcion.trim());
      const foto = this.foto();
      if (foto) {
        formData.append('foto', foto);
      }

      this.guardando.set(true);
      try {
        await firstValueFrom(this.auth.actualizarPerfil(formData));
        this.dialogo.close(true);
      } catch (error) {
        this.avisarError(error);
      } finally {
        this.guardando.set(false);
      }
    });
  }

  private avisarError(error: unknown) {
    const estado = error instanceof HttpErrorResponse ? error.status : 0;
    if (estado === 401) {
      return;
    }

    if (estado === 400 || estado === 413) {
      const mensaje = error instanceof HttpErrorResponse ? error.error?.message : null;
      const detalle = Array.isArray(mensaje) ? mensaje.join('. ') : mensaje;
      this.modal.mostrar('Revisá los datos', detalle ?? 'Alguno de los datos enviados no es válido.');
    } else if (estado === 404) {
      this.modal.mostrar('No pudimos guardar', 'Tu cuenta ya no está disponible.');
    } else {
      this.modal.mostrar('Error de conexión', 'No pudimos comunicarnos con el servidor. Intentá de nuevo en unos minutos.');
    }
  }
}
