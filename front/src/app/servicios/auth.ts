import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { tap } from 'rxjs';
import { API_URL } from '../config';
import { LoginData } from '../modelos/login-data';
import { Usuario } from '../modelos/usuario';

const CLAVE_USUARIO = 'usuario';
const CLAVE_TOKEN = 'token';

type RespuestaAuth = Usuario & { token: string };

@Injectable({ providedIn: 'root' })
export class Auth {
  private http = inject(HttpClient);

  private usuarioActual = signal<Usuario | null>(this.leerUsuario());
  private tokenActual = signal<string | null>(localStorage.getItem(CLAVE_TOKEN));

  usuario = this.usuarioActual.asReadonly();
  token = this.tokenActual.asReadonly();
  logueado = computed(() => this.usuarioActual() !== null && this.tokenActual() !== null);

  ingresar(datos: LoginData) {
    return this.http
      .post<RespuestaAuth>(`${API_URL}/autenticacion/login`, datos)
      .pipe(tap((respuesta) => this.guardar(respuesta)));
  }

  registrar(datos: FormData) {
    return this.http.post<Usuario>(`${API_URL}/autenticacion/registro`, datos);
  }

  autorizar() {
    return this.http
      .post<Usuario>(`${API_URL}/autenticacion/autorizar`, {})
      .pipe(tap((usuario) => this.guardarUsuario(usuario)));
  }

  actualizarPerfil(datos: FormData) {
    return this.http
      .patch<Usuario>(`${API_URL}/usuarios/perfil`, datos)
      .pipe(tap((usuario) => this.guardarUsuario(usuario)));
  }

  refrescar() {
    return this.http
      .post<{ token: string }>(`${API_URL}/autenticacion/refrescar`, {})
      .pipe(tap((respuesta) => this.guardarToken(respuesta.token)));
  }

  salir() {
    localStorage.removeItem(CLAVE_USUARIO);
    localStorage.removeItem(CLAVE_TOKEN);
    this.usuarioActual.set(null);
    this.tokenActual.set(null);
  }

  expiraEn(): number | null {
    const partes = this.tokenActual()?.split('.');
    if (partes?.length !== 3) {
      return null;
    }
    try {
      const payload = JSON.parse(atob(partes[1].replace(/-/g, '+').replace(/_/g, '/')));
      return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
    } catch {
      return null;
    }
  }

  private guardar(respuesta: RespuestaAuth) {
    const { token, ...usuario } = respuesta;
    this.guardarToken(token);
    this.guardarUsuario(usuario);
  }

  private guardarToken(token: string) {
    localStorage.setItem(CLAVE_TOKEN, token);
    this.tokenActual.set(token);
  }

  private guardarUsuario(usuario: Usuario) {
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
    this.usuarioActual.set(usuario);
  }

  private leerUsuario(): Usuario | null {
    const guardado = localStorage.getItem(CLAVE_USUARIO);
    return guardado ? (JSON.parse(guardado) as Usuario) : null;
  }
}
