import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_URL } from '../config';
import { Comentario, PaginaComentarios } from '../modelos/comentario';

export interface FiltrosComentarios {
  offset?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class ComentariosApi {
  private http = inject(HttpClient);

  private url(publicacionId: string) {
    return `${API_URL}/publicaciones/${publicacionId}/comentarios`;
  }

  listar(publicacionId: string, filtros: FiltrosComentarios = {}) {
    let params = new HttpParams();
    for (const [clave, valor] of Object.entries(filtros)) {
      if (valor !== undefined) {
        params = params.set(clave, String(valor));
      }
    }
    return this.http.get<PaginaComentarios>(this.url(publicacionId), { params });
  }

  crear(publicacionId: string, mensaje: string) {
    return this.http.post<Comentario>(this.url(publicacionId), { mensaje });
  }

  editar(publicacionId: string, comentarioId: string, mensaje: string) {
    return this.http.put<Comentario>(`${this.url(publicacionId)}/${comentarioId}`, { mensaje });
  }
}
