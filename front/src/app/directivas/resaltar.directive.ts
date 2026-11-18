import { Directive, ElementRef, HostListener, inject, input } from '@angular/core';

// Directiva de atributo: cambia el fondo del elemento mientras el mouse está encima.
// Uso: <tr appResaltar> o <tr appResaltar="#eef7fd">
@Directive({ selector: '[appResaltar]' })
export class ResaltarDirective {
  private elemento = inject<ElementRef<HTMLElement>>(ElementRef);

  appResaltar = input('');

  @HostListener('mouseenter')
  alEntrar() {
    this.elemento.nativeElement.style.backgroundColor = this.appResaltar() || 'var(--rc-fondo)';
  }

  @HostListener('mouseleave')
  alSalir() {
    this.elemento.nativeElement.style.backgroundColor = '';
  }
}
