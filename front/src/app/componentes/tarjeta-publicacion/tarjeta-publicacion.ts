import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, linkedSignal, output, signal, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Publicacion } from '../../modelos/publicacion';
import { PluralizarPipe } from '../../pipes/pluralizar.pipe';
import { TiempoTranscurridoPipe } from '../../pipes/tiempo-transcurrido.pipe';
import { Auth } from '../../servicios/auth';
import { Modal } from '../../servicios/modal';
import { PublicacionesApi } from '../../servicios/publicaciones-api';
import { ComentariosPublicacion } from '../comentarios-publicacion/comentarios-publicacion';

@Component({
  imports: [ComentariosPublicacion, DatePipe, MatButtonModule, PluralizarPipe, RouterLink, TiempoTranscurridoPipe],
  selector: 'app-tarjeta-publicacion',
  styleUrl: './tarjeta-publicacion.css',
  templateUrl: './tarjeta-publicacion.html',
})
export class TarjetaPublicacion {
  private auth = inject(Auth);
  private api = inject(PublicacionesApi);
  private modal = inject(Modal);

  publicacion = input.required<Publicacion>();
  abrirComentarios = input(false);
  grande = input(false);
  enlace = input(true);
  eliminada = output<void>();

  private seccionComentarios = viewChild(ComentariosPublicacion);

  cantidadMeGusta = linkedSignal(() => this.publicacion().cantidadMeGusta);
  meGustaYo = linkedSignal(() => this.publicacion().meGustaYo);
  totalComentarios = linkedSignal(() => this.publicacion().cantidadComentarios ?? 0);
  comentariosAbiertos = linkedSignal(() => this.abrirComentarios());
  enfocarAlAbrir = signal(false);
  trabajando = signal(false);

  esMia = computed(() => this.auth.usuario()?._id === this.publicacion().autor._id);
  esAdministrador = computed(() => this.auth.usuario()?.perfil === 'administrador');
  puedeEliminar = computed(() => this.esMia() || this.esAdministrador());
  inicial = computed(() => this.publicacion().autor.nombre.charAt(0).toUpperCase());

  alternarComentarios() {
    this.enfocarAlAbrir.set(false);
    this.comentariosAbiertos.update((abiertos) => !abiertos);
  }

  comentar() {
    if (this.comentariosAbiertos()) {
      this.seccionComentarios()?.enfocarCaja();
      return;
    }
    this.enfocarAlAbrir.set(true);
    this.comentariosAbiertos.set(true);
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
    const comoAdministrador = !this.esMia();
    const confirmado = await this.modal.confirmar(
      'Eliminar publicación',
      comoAdministrador
        ? `Vas a eliminar, como administrador, la publicación de @${this.publicacion().autor.usuario}. También dejarán de estar disponibles sus comentarios. Esta acción no se puede deshacer.`
        : '¿Querés eliminar esta publicación? Esta acción no se puede deshacer.',
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
