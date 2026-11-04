import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { form, FormField, minLength, pattern, required, submit } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { LoginData } from '../../modelos/login-data';
import { Auth } from '../../servicios/auth';
import { Modal } from '../../servicios/modal';

@Component({
  imports: [FormField, MatButtonModule, RouterLink],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  private auth = inject(Auth);
  private router = inject(Router);
  private modal = inject(Modal);

  loginModel = signal<LoginData>({
    identificador: '',
    password: '',
  });

  loginForm = form(this.loginModel, (campos) => {
    required(campos.identificador, { message: 'Ingresá tu usuario o correo' });
    required(campos.password, { message: 'La contraseña es obligatoria' });
    minLength(campos.password, 8, { message: 'Debe tener al menos 8 caracteres' });
    pattern(campos.password, /[A-Z]/, { message: 'Debe incluir una mayúscula' });
    pattern(campos.password, /\d/, { message: 'Debe incluir un número' });
  });

  enviar(evento: Event) {
    evento.preventDefault();

    submit(this.loginForm, async () => {
      try {
        await firstValueFrom(this.auth.ingresar(this.loginModel()));
        this.router.navigate(['/publicaciones']);
      } catch (error) {
        const estado = error instanceof HttpErrorResponse ? error.status : 0;
        if (estado === 401) {
          this.modal.mostrar('No pudimos ingresar', 'El usuario o la contraseña son incorrectos.');
        } else if (estado === 403) {
          this.modal.mostrar('Cuenta deshabilitada', 'Tu cuenta está deshabilitada. Contactá a un administrador.');
        } else {
          this.modal.mostrar('Error de conexión', 'No pudimos comunicarnos con el servidor. Intentá de nuevo en unos minutos.');
        }
      }
    });
  }
}
