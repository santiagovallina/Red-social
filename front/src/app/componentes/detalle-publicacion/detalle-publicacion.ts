import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Publicacion } from '../../modelos/publicacion';
import { PublicacionesApi } from '../../servicios/publicaciones-api';
import { Spinner } from '../spinner/spinner';
import { TarjetaPublicacion } from '../tarjeta-publicacion/tarjeta-publicacion';

@Component({
  imports: [RouterLink, Spinner, TarjetaPublicacion],
  selector: 'app-detalle-publicacion',
  styleUrl: './detalle-publicacion.css',
  templateUrl: './detalle-publicacion.html',
})
export class DetallePublicacion implements OnInit {
  private publicacionesApi = inject(PublicacionesApi);
  private router = inject(Router);

  id = input.required<string>();

  publicacion = signal<Publicacion | null>(null);
  cargando = signal(true);
  noExiste = signal(false);
  errorCarga = signal(false);

  async ngOnInit() {
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

  alEliminarPublicacion() {
    this.router.navigate(['/publicaciones']);
  }
}
