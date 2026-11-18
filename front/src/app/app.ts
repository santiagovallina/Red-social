import { HttpErrorResponse } from '@angular/common/http';
import { Component, effect, inject, OnInit, signal, untracked } from '@angular/core';
import { Location } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Navbar } from './componentes/navbar/navbar';
import { PantallaCarga } from './componentes/pantalla-carga/pantalla-carga';
import { Actualizacion } from './servicios/actualizacion';
import { Auth } from './servicios/auth';
import { Sesion } from './servicios/sesion';

const RUTAS_SIN_SESION = ['', '/', '/login', '/register'];

@Component({
  selector: 'app-root',
  imports: [Navbar, PantallaCarga, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected auth = inject(Auth);
  private sesion = inject(Sesion);
  private actualizacion = inject(Actualizacion);
  private router = inject(Router);
  private location = inject(Location);

  protected iniciando = signal(true);

  constructor() {
    effect(() => {
      this.auth.token();
      const logueado = this.auth.logueado();
      untracked(() => (logueado ? this.sesion.iniciar() : this.sesion.detener()));
    });
  }

  async ngOnInit() {
    this.actualizacion.iniciar();
    await this.validarSesion();
    this.iniciando.set(false);
  }

  private async validarSesion() {
    if (!this.auth.logueado()) {
      return;
    }

    try {
      await firstValueFrom(this.auth.autorizar());
      if (RUTAS_SIN_SESION.includes(this.location.path())) {
        this.router.navigate(['/publicaciones']);
      }
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        this.auth.salir();
        this.router.navigate(['/login']);
      }
    }
  }
}
