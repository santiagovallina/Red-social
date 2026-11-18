import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Auth } from '../../servicios/auth';
import { Modal } from '../../servicios/modal';
import { FormularioUsuario } from '../formulario-usuario/formulario-usuario';

@Component({
  imports: [FormularioUsuario, RouterLink],
  selector: 'app-register',
  styleUrl: './register.css',
  templateUrl: './register.html',
})
export class Register {
  private auth = inject(Auth);
  private router = inject(Router);
  private modal = inject(Modal);

  enviando = signal(false);

  async registrar(datos: FormData) {
    this.enviando.set(true);
    try {
      await firstValueFrom(this.auth.registrar(datos));
      this.modal
        .mostrar('¡Registro exitoso!', 'Tu cuenta fue creada. Ya podés iniciar sesión.')
        .afterClosed()
        .subscribe(() => this.router.navigate(['/login']));
    } catch (error) {
      this.mostrarError(error);
    } finally {
      this.enviando.set(false);
    }
  }

  private mostrarError(error: unknown) {
    const estado = error instanceof HttpErrorResponse ? error.status : 0;

    if (estado === 409) {
      this.modal.mostrar('No pudimos registrarte', 'El correo o el nombre de usuario ya está registrado.');
    } else if (estado === 400 || estado === 413) {
      const mensaje = error instanceof HttpErrorResponse ? error.error?.message : null;
      const detalle = Array.isArray(mensaje) ? mensaje.join('. ') : mensaje;
      this.modal.mostrar('Revisá los datos', detalle ?? 'Alguno de los datos enviados no es válido.');
    } else {
      this.modal.mostrar('Error de conexión', 'No pudimos comunicarnos con el servidor. Intentá de nuevo en unos minutos.');
    }
  }
}
