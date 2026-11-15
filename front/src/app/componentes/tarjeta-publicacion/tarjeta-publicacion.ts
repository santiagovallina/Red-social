import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, linkedSignal, OnInit, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Comentario } from '../../modelos/comentario';
import { Publicacion } from '../../modelos/publicacion';
import { Auth } from '../../servicios/auth';
import { ComentariosApi } from '../../servicios/comentarios-api';
import { Modal } from '../../servicios/modal';
import { PublicacionesApi } from '../../servicios/publicaciones-api';

const COMENTARIOS_EN_RESUMEN = 3;

@Component({
  imports: [DatePipe, MatButtonModule, RouterLink],
  selector: 'app-tarjeta-publicacion',
  styleUrl: './tarjeta-publicacion.css',
  templateUrl: './tarjeta-publicacion.html',
})
export class TarjetaPublicacion implements OnInit {
  private auth = inject(Auth);
  private api = inject(PublicacionesApi);
  private comentariosApi = inject(ComentariosApi);
  private modal = inject(Modal);

  publicacion = input.required<Publicacion>();
  mostrarComentarios = input(false);
  grande = input(false);
  enlace = input(true);
  eliminada = output<void>();

  comentarios = signal<Comentario[]>([]);
  totalComentarios = signal(0);
  cargandoComentarios = signal(false);
  errorComentarios = signal(false);

  cantidadMeGusta = linkedSignal(() => this.publicacion().cantidadMeGusta);
  meGustaYo = linkedSignal(() => this.publicacion().meGustaYo);
  trabajando = signal(false);

  esMia = computed(() => this.auth.usuario()?._id === this.publicacion().autor._id);
  inicial = computed(() => this.publicacion().autor.nombre.charAt(0).toUpperCase());

  async ngOnInit() {
    if (!this.mostrarComentarios()) {
      return;
    }

    this.cargandoComentarios.set(true);
    try {
      const pagina = await firstValueFrom(
        this.comentariosApi.listar(this.publicacion()._id, { limit: COMENTARIOS_EN_RESUMEN }),
      );
      this.comentarios.set(pagina.items);
      this.totalComentarios.set(pagina.total);
    } catch {
      this.errorComentarios.set(true);
    } finally {
      this.cargandoComentarios.set(false);
    }
  }

  async alternarMeGusta() {
    if (this.trabajando()) {
      return;
    }
    this.trabajando.set(true);

    const id = this.publicacion()._id;
    try {
      const estado = await firstValueFrom(
        this.meGustaYo() ? this.api.quitarMeGusta(id) : this.api.darMeGusta(id),
      );
      this.cantidadMeGusta.set(estado.cantidadMeGusta);
      this.meGustaYo.set(estado.meGustaYo);
    } catch (error) {
      this.avisarError(error, 'No pudimos registrar tu me gusta');
    } finally {
      this.trabajando.set(false);
    }
  }

  async eliminar() {
    const confirmado = await this.modal.confirmar(
      'Eliminar publicación',
      '¿Querés eliminar esta publicación? Esta acción no se puede deshacer.',
      'Eliminar',
    );
    if (!confirmado) {
      return;
    }

    try {
      await firstValueFrom(this.api.eliminar(this.publicacion()._id));
      this.eliminada.emit();
    } catch (error) {
      this.avisarError(error, 'No pudimos eliminar la publicación');
    }
  }

  private avisarError(error: unknown, titulo: string) {
    const estado = error instanceof HttpErrorResponse ? error.status : 0;

    if (estado === 404) {
      this.modal.mostrar(titulo, 'La publicación ya no existe.');
      this.eliminada.emit();
    } else if (estado === 403) {
      this.modal.mostrar(titulo, 'No tenés permiso para hacer esto.');
    } else if (estado === 409) {
      this.modal.mostrar(titulo, 'La acción ya estaba hecha. Actualizá la página para ver el estado real.');
    } else if (estado === 401) {
      return;
    } else {
      this.modal.mostrar(titulo, 'No pudimos comunicarnos con el servidor. Intentá de nuevo en unos minutos.');
    }
  }
}
