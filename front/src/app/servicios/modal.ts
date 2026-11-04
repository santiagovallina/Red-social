import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
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
}
