import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { firstValueFrom } from 'rxjs';
import { ResaltarDirective } from '../../directivas/resaltar.directive';
import { Usuario } from '../../modelos/usuario';
import { EdadPipe } from '../../pipes/edad.pipe';
import { PluralizarPipe } from '../../pipes/pluralizar.pipe';
import { Auth } from '../../servicios/auth';
import { Modal } from '../../servicios/modal';
import { UsuariosApi } from '../../servicios/usuarios-api';
import { FormularioUsuario } from '../formulario-usuario/formulario-usuario';
import { Spinner } from '../spinner/spinner';

const USUARIOS_POR_PAGINA = 10;

@Component({
  imports: [EdadPipe, FormularioUsuario, MatButtonModule, PluralizarPipe, ResaltarDirective, Spinner],
  selector: 'app-dashboard-usuarios',
  styleUrl: './dashboard-usuarios.css',
  templateUrl: './dashboard-usuarios.html',
})
export class DashboardUsuarios implements OnInit {
  private api = inject(UsuariosApi);
  private auth = inject(Auth);
  private modal = inject(Modal);

  private formulario = viewChild(FormularioUsuario);

  items = signal<Usuario[]>([]);
  total = signal(0);
  pagina = signal(1);
  cargando = signal(true);
  errorCarga = signal(false);
  creando = signal(false);
  trabajandoId = signal<string | null>(null);

  totalPaginas = computed(() => Math.max(Math.ceil(this.total() / USUARIOS_POR_PAGINA), 1));

  ngOnInit() {
    this.cargar();
  }

  esYo(usuario: Usuario) {
    return usuario._id === this.auth.usuario()?._id;
  }

  inicial(usuario: Usuario) {
    return usuario.nombre.charAt(0).toUpperCase();
  }

  async cargar() {
    this.cargando.set(true);
    this.errorCarga.set(false);
    try {
      const pagina = await firstValueFrom(
        this.api.listar((this.pagina() - 1) * USUARIOS_POR_PAGINA, USUARIOS_POR_PAGINA),
      );
      this.items.set(pagina.items);
      this.total.set(pagina.total);

      // Si la página quedó vacía (por ejemplo tras un cambio), volvemos a la última que exista.
      if (pagina.items.length === 0 && this.pagina() > 1) {
        this.pagina.set(this.totalPaginas());
        await this.cargar();
        return;
      }
    } catch (error) {
      if (!(error instanceof HttpErrorResponse && error.status === 401)) {
        this.errorCarga.set(true);
      }
    } finally {
      this.cargando.set(false);
    }
  }

  irAPagina(numero: number) {
    this.pagina.set(numero);
    this.cargar();
  }

  async alternarHabilitado(usuario: Usuario) {
    if (this.trabajandoId()) {
      return;
    }

    const deshabilitar = usuario.habilitado;
    const confirmado = await this.modal.confirmar(
      deshabilitar ? 'Deshabilitar usuario' : 'Habilitar usuario',
      deshabilitar
        ? `@${usuario.usuario} no va a poder ingresar a la aplicación hasta que lo vuelvas a habilitar.`
        : `@${usuario.usuario} va a poder volver a ingresar a la aplicación.`,
      deshabilitar ? 'Deshabilitar' : 'Habilitar',
    );
    if (!confirmado) {
      return;
    }

    this.trabajandoId.set(usuario._id);
    try {
      const actualizado = await firstValueFrom(
        deshabilitar ? this.api.deshabilitar(usuario._id) : this.api.habilitar(usuario._id),
      );
      this.items.update((actuales) =>
        actuales.map((fila) => (fila._id === actualizado._id ? actualizado : fila)),
      );
    } catch (error) {
      this.avisarErrorDeEstado(error, deshabilitar);
    } finally {
      this.trabajandoId.set(null);
    }
  }

  async crear(datos: FormData) {
    this.creando.set(true);
    try {
      const nuevo = await firstValueFrom(this.api.crear(datos));
      this.formulario()?.reiniciar();
      this.pagina.set(1);
      await this.cargar();
      this.modal.mostrar(
        'Usuario creado',
        `Se creó @${nuevo.usuario} con perfil ${nuevo.perfil}. Ya puede iniciar sesión.`,
      );
    } catch (error) {
      this.avisarErrorDeAlta(error);
    } finally {
      this.creando.set(false);
    }
  }

  private avisarErrorDeEstado(error: unknown, deshabilitar: boolean) {
    const estado = error instanceof HttpErrorResponse ? error.status : 0;
    if (estado === 401) {
      return;
    }

    const titulo = deshabilitar ? 'No pudimos deshabilitar al usuario' : 'No pudimos habilitar al usuario';
    const mensajes: Record<number, string> = {
      403: 'No podés deshabilitar tu propia cuenta ni hacer esto sin ser administrador.',
      404: 'El usuario ya no existe. Actualizamos el listado.',
    };
    this.modal.mostrar(
      titulo,
      mensajes[estado] ?? 'No pudimos comunicarnos con el servidor. Intentá de nuevo en unos minutos.',
    );
    if (estado === 404) {
      this.cargar();
    }
  }

  private avisarErrorDeAlta(error: unknown) {
    const estado = error instanceof HttpErrorResponse ? error.status : 0;
    if (estado === 401) {
      return;
    }

    if (estado === 409) {
      this.modal.mostrar('No pudimos crear el usuario', 'El correo o el nombre de usuario ya está registrado.');
    } else if (estado === 400 || estado === 413) {
      const mensaje = error instanceof HttpErrorResponse ? error.error?.message : null;
      const detalle = Array.isArray(mensaje) ? mensaje.join('. ') : mensaje;
      this.modal.mostrar('Revisá los datos', detalle ?? 'Alguno de los datos enviados no es válido.');
    } else if (estado === 403) {
      this.modal.mostrar('No pudimos crear el usuario', 'Solo un administrador puede crear usuarios.');
    } else {
      this.modal.mostrar('Error de conexión', 'No pudimos comunicarnos con el servidor. Intentá de nuevo en unos minutos.');
    }
  }
}
