import { Component, inject } from '@angular/core';
import { Auth } from '../../servicios/auth';

@Component({
  imports: [],
  selector: 'app-publicaciones',
  styleUrl: './publicaciones.css',
  templateUrl: './publicaciones.html',
})
export class Publicaciones {
  protected auth = inject(Auth);
}
