import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { firstValueFrom } from 'rxjs';
import { Comentario } from '../../modelos/comentario';
import { Auth } from '../../servicios/auth';
import { ComentariosApi } from '../../servicios/comentarios-api';
import { Modal } from '../../servicios/modal';

const MAXIMO_CARACTERES = 500;

@Component({
  imports: [DatePipe, MatButtonModule],
  selector: 'app-tarjeta-comentario',
  styleUrl: './tarjeta-comentario.css',
  templateUrl: './tarjeta-comentario.html',
})
export class TarjetaComentario {
  private auth = inject(Auth);
  private api = inject(ComentariosApi);
  private modal = inject(Modal);

  comentario = input.required<Comentario>();
  publicacionId = input.required<string>();
  duenoPublicacionId = input<string>();
  actualizado = output<Comentario>();
  eliminado = output<string>();

  readonly maximo = MAXIMO_CARACTERES;
  editando = signal(false);
  borrador = signal('');
  guardando = signal(false);

  esMio = computed(() => this.auth.usuario()?._id === this.comentario().autor._id);
  puedeEliminar = computed(
    () => this.esMio() || this.auth.usuario()?._id === this.duenoPublicacionId(),
  );
  inicial = computed(() => this.comentario().autor.nombre.charAt(0).toUpperCase());
  errorBorrador = computed(() => {
    const texto = this.borrador().trim();
    if (!this.editando()) {
      return null;
    }
    if (!texto) {
      return 'El comentario no puede estar vacío';
    }
    if (texto.length > MAXIMO_CARACTERES) {
      return `No puede superar los ${MAXIMO_CARACTERES} caracteres`;
    }
    return null;
  });

  editar() {
    this.borrador.set(this.comentario().mensaje);
    this.editando.set(true);
  }

  cancelar() {
    this.editando.set(false);
  }

  escribir(evento: Event) {
    this.borrador.set((evento.target as HTMLTextAreaElement).value);
  }

  async guardar() {
    if (this.errorBorrador() || this.guardando()) {
      return;
    }

    const texto = this.borrador().trim();
    if (texto === this.comentario().mensaje) {
      this.editando.set(false);
      return;
    }

    this.guardando.set(true);
    try {
      const editado = await firstValueFrom(
        this.api.editar(this.publicacionId(), this.comentario()._id, texto),
      );
      this.actualizado.emit(editado);
      this.editando.set(false);
    } catch (error) {
      this.avisarError(error);
    } finally {
      this.guardando.set(false);
    }
  }

  async eliminar() {
    const confirmado = await this.modal.confirmar(
      'Eliminar comentario',
      '¿Querés eliminar este comentario? Esta acción no se puede deshacer.',
      'Eliminar',
    );
    if (!confirmado) {
      return;
    }

    try {
      await firstValueFrom(this.api.eliminar(this.publicacionId(), this.comentario()._id));
      this.eliminado.emit(this.comentario()._id);
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 404) {
        this.eliminado.emit(this.comentario()._id);
        return;
      }
      this.avisarError(error, 'No pudimos eliminar el comentario');
    }
  }

  private avisarError(error: unknown, titulo = 'No pudimos editar el comentario') {
    const estado = error instanceof HttpErrorResponse ? error.status : 0;
    if (estado === 401) {
      return;
    }

    const mensajes: Record<number, string> = {
      403: 'No tenés permiso para hacer esto con este comentario.',
      404: 'El comentario ya no existe.',
    };
    this.modal.mostrar(
      titulo,
      mensajes[estado] ?? 'No pudimos comunicarnos con el servidor. Intentá de nuevo en unos minutos.',
    );
  }
}
