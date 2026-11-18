import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  selector: 'app-dashboard',
  styleUrl: './dashboard.css',
  templateUrl: './dashboard.html',
})
export class Dashboard {
  menuAbierto = signal(false);

  alternarMenu() {
    this.menuAbierto.update((abierto) => !abierto);
  }

  cerrarMenu() {
    this.menuAbierto.set(false);
  }
}
