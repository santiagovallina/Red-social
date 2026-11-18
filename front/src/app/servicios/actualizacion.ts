import { inject, Injectable } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';
import { Modal } from './modal';

// Avisa cuando el service worker descargó una versión nueva de la app y ofrece recargar.
@Injectable({ providedIn: 'root' })
export class Actualizacion {
  private actualizaciones = inject(SwUpdate);
  private modal = inject(Modal);
  private escuchando = false;

  iniciar() {
    if (this.escuchando || !this.actualizaciones.isEnabled) {
      return;
    }
    this.escuchando = true;

    this.actualizaciones.versionUpdates
      .pipe(filter((evento): evento is VersionReadyEvent => evento.type === 'VERSION_READY'))
      .subscribe(async () => {
        const aceptado = await this.modal.confirmar(
          'Hay una versión nueva',
          'Descargamos una versión nueva de Racingram. Actualizá para usarla.',
          'Actualizar',
          'Ahora no',
        );
        if (aceptado) {
          await this.actualizaciones.activateUpdate();
          document.location.reload();
        }
      });
  }
}
