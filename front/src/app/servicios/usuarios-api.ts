import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_URL } from '../config';
import { PaginaUsuarios, Usuario } from '../modelos/usuario';

@Injectable({ providedIn: 'root' })
export class UsuariosApi {
  private http = inject(HttpClient);
  private url = `${API_URL}/usuarios`;

  listar(offset: number, limit: number) {
    const params = new HttpParams().set('offset', offset).set('limit', limit);
    return this.http.get<PaginaUsuarios>(this.url, { params });
  }

  crear(datos: FormData) {
    return this.http.post<Usuario>(this.url, datos);
  }

  deshabilitar(id: string) {
    return this.http.delete<Usuario>(`${this.url}/${id}`);
  }

  habilitar(id: string) {
    return this.http.post<Usuario>(`${this.url}/${id}/habilitar`, {});
  }
}
