import { Directive, EmbeddedViewRef, TemplateRef, ViewContainerRef, effect, inject } from '@angular/core';
import { Auth } from '../servicios/auth';

// Directiva estructural: muestra el elemento solo si el usuario logueado es administrador.
// Uso: <a *appSoloAdministrador routerLink="/dashboard">Administración</a>
@Directive({ selector: '[appSoloAdministrador]' })
export class SoloAdministradorDirective {
  private auth = inject(Auth);
  private plantilla = inject(TemplateRef<unknown>);
  private contenedor = inject(ViewContainerRef);
  private vista: EmbeddedViewRef<unknown> | null = null;

  constructor() {
    effect(() => {
      const esAdministrador = this.auth.usuario()?.perfil === 'administrador';

      if (esAdministrador && !this.vista) {
        this.vista = this.contenedor.createEmbeddedView(this.plantilla);
      } else if (!esAdministrador && this.vista) {
        this.contenedor.clear();
        this.vista = null;
      }
    });
  }
}
