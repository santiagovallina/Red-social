import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

export interface DatosConfirmacion {
  titulo: string;
  mensaje: string;
  textoAceptar: string;
}

@Component({
  imports: [MatDialogModule, MatButtonModule],
  selector: 'app-modal-confirmacion',
  template: `
    <h2 mat-dialog-title>{{ datos.titulo }}</h2>
    <mat-dialog-content>{{ datos.mensaje }}</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button matButton [mat-dialog-close]="false" type="button">Cancelar</button>
      <button matButton="filled" [mat-dialog-close]="true" type="button">{{ datos.textoAceptar }}</button>
    </mat-dialog-actions>
  `,
})
export class ModalConfirmacion {
  protected datos = inject<DatosConfirmacion>(MAT_DIALOG_DATA);
}
