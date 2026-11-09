import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_URL } from '../config';
import {
  EstadoMeGusta,
  OrdenPublicaciones,
  PaginaPublicaciones,
  Publicacion,
} from '../modelos/publicacion';

export interface FiltrosPublicaciones {
  orden?: OrdenPublicaciones;
  usuario?: string;
  offset?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class PublicacionesApi {
  private http = inject(HttpClient);
  private url = `${API_URL}/publicaciones`;

  listar(filtros: FiltrosPublicaciones = {}) {
    let params = new HttpParams();
    for (const [clave, valor] of Object.entries(filtros)) {
      if (valor !== undefined) {
        params = params.set(clave, String(valor));
      }
    }
    return this.http.get<PaginaPublicaciones>(this.url, { params });
  }

  crear(datos: FormData) {
    return this.http.post<Publicacion>(this.url, datos);
  }

  eliminar(id: string) {
    return this.http.delete<{ mensaje: string }>(`${this.url}/${id}`);
  }

  darMeGusta(id: string) {
    return this.http.post<EstadoMeGusta>(`${this.url}/${id}/me-gusta`, {});
  }

  quitarMeGusta(id: string) {
    return this.http.delete<EstadoMeGusta>(`${this.url}/${id}/me-gusta`);
  }
}
