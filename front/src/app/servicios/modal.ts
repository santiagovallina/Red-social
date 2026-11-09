import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { ModalConfirmacion } from '../componentes/modal-confirmacion/modal-confirmacion';
import { ModalMensaje } from '../componentes/modal-mensaje/modal-mensaje';

@Injectable({ providedIn: 'root' })
export class Modal {
  private dialog = inject(MatDialog);

  mostrar(titulo: string, mensaje: string) {
    return this.dialog.open(ModalMensaje, {
      data: { titulo, mensaje },
      width: '26rem',
      maxWidth: '90vw',
    });
  }

  async confirmar(titulo: string, mensaje: string, textoAceptar = 'Aceptar') {
    const dialogo = this.dialog.open(ModalConfirmacion, {
      data: { titulo, mensaje, textoAceptar },
      width: '26rem',
      maxWidth: '90vw',
    });
    return (await firstValueFrom(dialogo.afterClosed())) === true;
  }
}
