import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, ElementRef, inject, input, OnInit, output, signal, viewChild } from '@angular/core';
import { form, FormField, maxLength, required, submit } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { firstValueFrom } from 'rxjs';
import { AutofocoDirective } from '../../directivas/autofoco.directive';
import { Comentario } from '../../modelos/comentario';
import { ComentariosApi } from '../../servicios/comentarios-api';
import { Modal } from '../../servicios/modal';
import { Spinner } from '../spinner/spinner';
import { TarjetaComentario } from '../tarjeta-comentario/tarjeta-comentario';

const COMENTARIOS_POR_TANDA = 5;

@Component({
  imports: [AutofocoDirective, FormField, MatButtonModule, Spinner, TarjetaComentario],
  selector: 'app-comentarios-publicacion',
  styleUrl: './comentarios-publicacion.css',
  templateUrl: './comentarios-publicacion.html',
})
export class ComentariosPublicacion implements OnInit {
  private api = inject(ComentariosApi);
  private modal = inject(Modal);

  publicacionId = input.required<string>();
  duenoId = input.required<string>();
  enfocar = input(false);
  totalCambio = output<number>();

  private caja = viewChild<ElementRef<HTMLTextAreaElement>>('caja');

  comentarios = signal<Comentario[]>([]);
  total = signal(0);
  cargando = signal(false);
  restantes = computed(() => Math.max(this.total() - this.comentarios().length, 0));

  comentarioModel = signal({ mensaje: '' });
  comentarioForm = form(this.comentarioModel, (campos) => {
    required(campos.mensaje, { message: 'Escribí un comentario antes de enviarlo' });
    maxLength(campos.mensaje, 500, { message: 'No puede superar los 500 caracteres' });
  });

  async ngOnInit() {
    await this.cargar();
  }

  enfocarCaja() {
    this.caja()?.nativeElement.focus();
  }

  async cargar() {
    this.cargando.set(true);
    try {
      const pagina = await firstValueFrom(
        this.api.listar(this.publicacionId(), {
          offset: this.comentarios().length,
          limit: COMENTARIOS_POR_TANDA,
        }),
      );
      const conocidos = new Set(this.comentarios().map((comentario) => comentario._id));
      this.comentarios.update((actuales) => [
        ...actuales,
        ...pagina.items.filter((comentario) => !conocidos.has(comentario._id)),
      ]);
      this.cambiarTotal(pagina.total);
    } catch (error) {
      if (!(error instanceof HttpErrorResponse && error.status === 401)) {
        this.modal.mostrar('No pudimos cargar los comentarios', 'Intentá de nuevo en unos minutos.');
      }
    } finally {
      this.cargando.set(false);
    }
  }

  enviar(evento: Event) {
    evento.preventDefault();

    submit(this.comentarioForm, async () => {
      try {
        const nuevo = await firstValueFrom(
          this.api.crear(this.publicacionId(), this.comentarioModel().mensaje.trim()),
        );
        this.comentarios.update((actuales) => [nuevo, ...actuales]);
        this.cambiarTotal(this.total() + 1);
        this.comentarioModel.set({ mensaje: '' });
        this.comentarioForm().reset();
      } catch (error) {
        this.avisarErrorAlComentar(error);
      }
    });
  }

  reemplazar(editado: Comentario) {
    this.comentarios.update((actuales) =>
      actuales.map((comentario) => (comentario._id === editado._id ? editado : comentario)),
    );
  }

  quitar(id: string) {
    this.comentarios.update((actuales) => actuales.filter((comentario) => comentario._id !== id));
    this.cambiarTotal(Math.max(this.total() - 1, 0));
  }

  private cambiarTotal(total: number) {
    this.total.set(total);
    this.totalCambio.emit(total);
  }

  private avisarErrorAlComentar(error: unknown) {
    const estado = error instanceof HttpErrorResponse ? error.status : 0;
    if (estado === 401) {
      return;
    }

    if (estado === 404) {
      this.modal.mostrar('No pudimos comentar', 'La publicación ya no existe.');
    } else if (estado === 400) {
      const mensaje = error instanceof HttpErrorResponse ? error.error?.message : null;
      const detalle = Array.isArray(mensaje) ? mensaje.join('. ') : mensaje;
      this.modal.mostrar('Revisá el comentario', detalle ?? 'El comentario no es válido.');
    } else {
      this.modal.mostrar('No pudimos comentar', 'No pudimos comunicarnos con el servidor. Intentá de nuevo en unos minutos.');
    }
  }
}
