import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { form, FormField, maxLength, required, submit } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Comentario } from '../../modelos/comentario';
import { Publicacion } from '../../modelos/publicacion';
import { ComentariosApi } from '../../servicios/comentarios-api';
import { Modal } from '../../servicios/modal';
import { PublicacionesApi } from '../../servicios/publicaciones-api';
import { Spinner } from '../spinner/spinner';
import { TarjetaComentario } from '../tarjeta-comentario/tarjeta-comentario';
import { TarjetaPublicacion } from '../tarjeta-publicacion/tarjeta-publicacion';

const COMENTARIOS_POR_TANDA = 5;

@Component({
  imports: [FormField, MatButtonModule, RouterLink, Spinner, TarjetaComentario, TarjetaPublicacion],
  selector: 'app-detalle-publicacion',
  styleUrl: './detalle-publicacion.css',
  templateUrl: './detalle-publicacion.html',
})
export class DetallePublicacion implements OnInit {
  private publicacionesApi = inject(PublicacionesApi);
  private comentariosApi = inject(ComentariosApi);
  private modal = inject(Modal);
  private router = inject(Router);

  id = input.required<string>();

  publicacion = signal<Publicacion | null>(null);
  cargando = signal(true);
  noExiste = signal(false);
  errorCarga = signal(false);

  comentarios = signal<Comentario[]>([]);
  totalComentarios = signal(0);
  cargandoComentarios = signal(false);
  restantes = computed(() => Math.max(this.totalComentarios() - this.comentarios().length, 0));

  comentarioModel = signal({ mensaje: '' });
  comentarioForm = form(this.comentarioModel, (campos) => {
    required(campos.mensaje, { message: 'Escribí un comentario antes de enviarlo' });
    maxLength(campos.mensaje, 500, { message: 'No puede superar los 500 caracteres' });
  });

  async ngOnInit() {
    await this.cargarPublicacion();
    if (this.publicacion()) {
      await this.cargarComentarios();
    }
  }

  async cargarPublicacion() {
    this.cargando.set(true);
    try {
      this.publicacion.set(await firstValueFrom(this.publicacionesApi.obtener(this.id())));
    } catch (error) {
      const estado = error instanceof HttpErrorResponse ? error.status : 0;
      if (estado === 404 || estado === 400) {
        this.noExiste.set(true);
      } else if (estado !== 401) {
        this.errorCarga.set(true);
      }
    } finally {
      this.cargando.set(false);
    }
  }

  async cargarComentarios() {
    this.cargandoComentarios.set(true);
    try {
      const pagina = await firstValueFrom(
        this.comentariosApi.listar(this.id(), {
          offset: this.comentarios().length,
          limit: COMENTARIOS_POR_TANDA,
        }),
      );
      const conocidos = new Set(this.comentarios().map((comentario) => comentario._id));
      this.comentarios.update((actuales) => [
        ...actuales,
        ...pagina.items.filter((comentario) => !conocidos.has(comentario._id)),
      ]);
      this.totalComentarios.set(pagina.total);
    } catch (error) {
      if (!(error instanceof HttpErrorResponse && error.status === 401)) {
        this.modal.mostrar('No pudimos cargar los comentarios', 'Intentá de nuevo en unos minutos.');
      }
    } finally {
      this.cargandoComentarios.set(false);
    }
  }

  enviarComentario(evento: Event) {
    evento.preventDefault();

    submit(this.comentarioForm, async () => {
      try {
        const nuevo = await firstValueFrom(
          this.comentariosApi.crear(this.id(), this.comentarioModel().mensaje.trim()),
        );
        this.comentarios.update((actuales) => [nuevo, ...actuales]);
        this.totalComentarios.update((total) => total + 1);
        this.comentarioModel.set({ mensaje: '' });
        this.comentarioForm().reset();
      } catch (error) {
        this.avisarErrorAlComentar(error);
      }
    });
  }

  reemplazarComentario(editado: Comentario) {
    this.comentarios.update((actuales) =>
      actuales.map((comentario) => (comentario._id === editado._id ? editado : comentario)),
    );
  }

  alEliminarPublicacion() {
    this.router.navigate(['/publicaciones']);
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
