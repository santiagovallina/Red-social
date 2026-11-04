import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { tap } from 'rxjs';
import { API_URL } from '../config';
import { LoginData } from '../modelos/login-data';
import { Usuario } from '../modelos/usuario';

const CLAVE = 'usuario';

@Injectable({ providedIn: 'root' })
export class Auth {
  private http = inject(HttpClient);

  private usuarioActual = signal<Usuario | null>(this.leerGuardado());
  usuario = this.usuarioActual.asReadonly();
  logueado = computed(() => this.usuarioActual() !== null);

  ingresar(datos: LoginData) {
    return this.http
      .post<Usuario>(`${API_URL}/autenticacion/login`, datos)
      .pipe(tap((usuario) => this.guardar(usuario)));
  }

  registrar(datos: FormData) {
    return this.http.post<Usuario>(`${API_URL}/autenticacion/registro`, datos);
  }

  salir() {
    localStorage.removeItem(CLAVE);
    this.usuarioActual.set(null);
  }

  private guardar(usuario: Usuario) {
    localStorage.setItem(CLAVE, JSON.stringify(usuario));
    this.usuarioActual.set(usuario);
  }

  private leerGuardado(): Usuario | null {
    const guardado = localStorage.getItem(CLAVE);
    return guardado ? (JSON.parse(guardado) as Usuario) : null;
  }
}
