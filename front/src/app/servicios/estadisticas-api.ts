import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_URL } from '../config';
import {
  Agrupacion,
  ComentariosDePublicacion,
  ComentariosEnElTiempo,
  PublicacionesDeUsuario,
} from '../modelos/estadisticas';

@Injectable({ providedIn: 'root' })
export class EstadisticasApi {
  private http = inject(HttpClient);
  private url = `${API_URL}/estadisticas`;

  private rango(desde: Date, hasta: Date) {
    return new HttpParams().set('desde', desde.toISOString()).set('hasta', hasta.toISOString());
  }

  publicacionesPorUsuario(desde: Date, hasta: Date) {
    return this.http.get<PublicacionesDeUsuario[]>(`${this.url}/publicaciones-por-usuario`, {
      params: this.rango(desde, hasta),
    });
  }

  comentarios(desde: Date, hasta: Date, agrupar: Agrupacion) {
    return this.http.get<ComentariosEnElTiempo>(`${this.url}/comentarios`, {
      params: this.rango(desde, hasta).set('agrupar', agrupar),
    });
  }

  comentariosPorPublicacion(desde: Date, hasta: Date) {
    return this.http.get<ComentariosDePublicacion[]>(`${this.url}/comentarios-por-publicacion`, {
      params: this.rango(desde, hasta),
    });
  }
}
