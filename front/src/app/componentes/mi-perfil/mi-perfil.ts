import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Publicacion } from '../../modelos/publicacion';
import { Auth } from '../../servicios/auth';
import { PublicacionesApi } from '../../servicios/publicaciones-api';
import { Spinner } from '../spinner/spinner';
import { TarjetaPublicacion } from '../tarjeta-publicacion/tarjeta-publicacion';

@Component({
  imports: [DatePipe, Spinner, TarjetaPublicacion],
  selector: 'app-mi-perfil',
  styleUrl: './mi-perfil.css',
  templateUrl: './mi-perfil.html',
})
export class MiPerfil implements OnInit {
  protected auth = inject(Auth);
  private api = inject(PublicacionesApi);

  ultimas = signal<Publicacion[]>([]);
  cargando = signal(false);
  errorCarga = signal(false);

  ngOnInit() {
    this.cargarUltimas();
  }

  async cargarUltimas() {
    const usuario = this.auth.usuario();
    if (!usuario) {
      return;
    }

    this.cargando.set(true);
    this.errorCarga.set(false);
    try {
      const resultado = await firstValueFrom(
        this.api.listar({ usuario: usuario._id, orden: 'fecha', limit: 3 }),
      );
      this.ultimas.set(resultado.items);
    } catch (error) {
      this.errorCarga.set(!(error instanceof HttpErrorResponse && error.status === 401));
    } finally {
      this.cargando.set(false);
    }
  }
}
