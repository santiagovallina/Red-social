import { afterNextRender, Directive, ElementRef, inject, input } from '@angular/core';

// Directiva de atributo: al mostrarse el elemento, le da el foco.
// Uso: <input appAutofoco /> o <textarea [appAutofoco]="condicion"></textarea>
@Directive({ selector: '[appAutofoco]' })
export class AutofocoDirective {
  private elemento = inject<ElementRef<HTMLElement>>(ElementRef);

  appAutofoco = input<boolean | ''>(true);

  constructor() {
    afterNextRender(() => {
      // El atributo sin valor (<input appAutofoco>) llega como '' y cuenta como activado.
      if (this.appAutofoco() !== false) {
        this.elemento.nativeElement.focus();
      }
    });
  }
}
