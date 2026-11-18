import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { Publicacion } from '../../modelos/publicacion';
import { EdadPipe } from '../../pipes/edad.pipe';
import { PluralizarPipe } from '../../pipes/pluralizar.pipe';
import { Auth } from '../../servicios/auth';
import { Modal } from '../../servicios/modal';
import { PublicacionesApi } from '../../servicios/publicaciones-api';
import { ModalEditarPerfil } from '../modal-editar-perfil/modal-editar-perfil';
import { Spinner } from '../spinner/spinner';
import { TarjetaPublicacion } from '../tarjeta-publicacion/tarjeta-publicacion';

@Component({
  imports: [DatePipe, EdadPipe, MatButtonModule, PluralizarPipe, Spinner, TarjetaPublicacion],
  selector: 'app-mi-perfil',
  styleUrl: './mi-perfil.css',
  templateUrl: './mi-perfil.html',
})
export class MiPerfil implements OnInit {
  protected auth = inject(Auth);
  private api = inject(PublicacionesApi);
  private dialogo = inject(MatDialog);
  private modal = inject(Modal);

  ultimas = signal<Publicacion[]>([]);
  cargando = signal(false);
  errorCarga = signal(false);

  ngOnInit() {
    this.cargarUltimas();
  }

  async editarPerfil() {
    const ventana = this.dialogo.open(ModalEditarPerfil, { width: '34rem', maxWidth: '92vw' });
    const guardado = (await firstValueFrom(ventana.afterClosed())) === true;
    if (guardado) {
      this.modal.mostrar('Perfil actualizado', 'Tus cambios se guardaron correctamente.');
    }
  }

  async cargarUltimas() {
    const usuario = this.auth.usuario();
    if (!usuario) {
      return;
    }

    this.cargando.set(true);
    this.errorCarga.set(false);
    try {
      const resultado = await firstValueFrom(
        this.api.listar({ usuario: usuario._id, orden: 'fecha', limit: 3 }),
      );
      this.ultimas.set(resultado.items);
    } catch (error) {
      this.errorCarga.set(!(error instanceof HttpErrorResponse && error.status === 401));
    } finally {
      this.cargando.set(false);
    }
  }
}
