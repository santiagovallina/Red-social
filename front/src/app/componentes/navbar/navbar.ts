import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { SoloAdministradorDirective } from '../../directivas/solo-administrador.directive';
import { Auth } from '../../servicios/auth';

@Component({
  imports: [MatButtonModule, RouterLink, RouterLinkActive, SoloAdministradorDirective],
  selector: 'app-navbar',
  styleUrl: './navbar.css',
  templateUrl: './navbar.html',
})
export class Navbar {
  protected auth = inject(Auth);
  private router = inject(Router);

  // En celular los enlaces quedan dentro de un menú que se abre con el botón de las tres rayas.
  menuAbierto = signal(false);

  alternarMenu() {
    this.menuAbierto.update((abierto) => !abierto);
  }

  cerrarMenu() {
    this.menuAbierto.set(false);
  }

  salir() {
    this.cerrarMenu();
    this.auth.salir();
    this.router.navigate(['/login']);
  }
}
