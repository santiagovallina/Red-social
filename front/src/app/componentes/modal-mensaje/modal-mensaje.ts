import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

export interface DatosModal {
  titulo: string;
  mensaje: string;
}

@Component({
  imports: [MatDialogModule, MatButtonModule],
  selector: 'app-modal-mensaje',
  template: `
    <h2 mat-dialog-title>{{ datos.titulo }}</h2>
    <mat-dialog-content>{{ datos.mensaje }}</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button matButton="filled" mat-dialog-close type="button">Aceptar</button>
    </mat-dialog-actions>
  `,
})
export class ModalMensaje {
  protected datos = inject<DatosModal>(MAT_DIALOG_DATA);
}
