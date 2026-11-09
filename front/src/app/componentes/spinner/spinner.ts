import { Component, input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  imports: [MatProgressSpinnerModule],
  selector: 'app-spinner',
  styleUrl: './spinner.css',
  templateUrl: './spinner.html',
})
export class Spinner {
  mensaje = input('Cargando...');
}
