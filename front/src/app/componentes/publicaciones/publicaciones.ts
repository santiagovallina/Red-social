import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { form, FormField, maxLength, required, submit } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { firstValueFrom } from 'rxjs';
import { OrdenPublicaciones, Publicacion } from '../../modelos/publicacion';
import { Auth } from '../../servicios/auth';
import { Modal } from '../../servicios/modal';
import { PublicacionesApi } from '../../servicios/publicaciones-api';
import { validarImagen } from '../../utilidades/imagen';
import { Spinner } from '../spinner/spinner';
import { TarjetaPublicacion } from '../tarjeta-publicacion/tarjeta-publicacion';

const PUBLICACIONES_POR_PAGINA = 5;

@Component({
  imports: [FormField, MatButtonModule, Spinner, TarjetaPublicacion],
  selector: 'app-publicaciones',
  styleUrl: './publicaciones.css',
  templateUrl: './publicaciones.html',
})
export class Publicaciones implements OnInit {
  protected auth = inject(Auth);
  private api = inject(PublicacionesApi);
  private modal = inject(Modal);

  items = signal<Publicacion[]>([]);
  total = signal(0);
  pagina = signal(1);
  orden = signal<OrdenPublicaciones>('fecha');
  cargando = signal(false);

  totalPaginas = computed(() => Math.max(1, Math.ceil(this.total() / PUBLICACIONES_POR_PAGINA)));

  mostrarFormulario = signal(false);
  publicacionModel = signal({ titulo: '', mensaje: '' });
  publicacionForm = form(this.publicacionModel, (campos) => {
    required(campos.titulo, { message: 'El título es obligatorio' });
    maxLength(campos.titulo, 100, { message: 'No puede superar los 100 caracteres' });
    required(campos.mensaje, { message: 'El mensaje es obligatorio' });
    maxLength(campos.mensaje, 1000, { message: 'No puede superar los 1000 caracteres' });
  });

  imagen = signal<File | null>(null);
  vistaPrevia = signal<string | null>(null);
  errorImagen = signal<string | null>(null);

  ngOnInit() {
    this.cargar();
  }

  async cargar() {
    this.cargando.set(true);
    try {
      const resultado = await firstValueFrom(
        this.api.listar({
          orden: this.orden(),
          offset: (this.pagina() - 1) * PUBLICACIONES_POR_PAGINA,
          limit: PUBLICACIONES_POR_PAGINA,
        }),
      );

      if (resultado.items.length === 0 && resultado.total > 0 && this.pagina() > 1) {
        this.pagina.update((pagina) => pagina - 1);
        await this.cargar();
        return;
      }

      this.items.set(resultado.items);
      this.total.set(resultado.total);
    } catch (error) {
      if (!(error instanceof HttpErrorResponse && error.status === 401)) {
        this.modal.mostrar('No pudimos cargar las publicaciones', 'Intentá de nuevo en unos minutos.');
      }
    } finally {
      this.cargando.set(false);
    }
  }

  cambiarOrden(evento: Event) {
    this.orden.set((evento.target as HTMLSelectElement).value as OrdenPublicaciones);
    this.pagina.set(1);
    this.cargar();
  }

  irAPagina(pagina: number) {
    this.pagina.set(pagina);
    this.cargar();
  }

  alternarFormulario() {
    const abrir = !this.mostrarFormulario();
    if (abrir) {
      this.limpiarFormulario();
    }
    this.mostrarFormulario.set(abrir);
  }

  seleccionarImagen(evento: Event) {
    const entrada = evento.target as HTMLInputElement;
    const archivo = entrada.files?.[0] ?? null;

    this.errorImagen.set(null);
    this.imagen.set(null);
    this.vistaPrevia.set(null);

    if (!archivo) {
      return;
    }
    const error = validarImagen(archivo);
    if (error) {
      this.errorImagen.set(error);
      entrada.value = '';
      return;
    }

    this.imagen.set(archivo);
    this.vistaPrevia.set(URL.createObjectURL(archivo));
  }

  enviarPublicacion(evento: Event) {
    evento.preventDefault();

    submit(this.publicacionForm, async () => {
      const datos = this.publicacionModel();
      const formData = new FormData();
      formData.append('titulo', datos.titulo);
      formData.append('mensaje', datos.mensaje);

      const imagen = this.imagen();
      if (imagen) {
        formData.append('imagen', imagen);
      }

      try {
        await firstValueFrom(this.api.crear(formData));
        this.mostrarFormulario.set(false);
        this.limpiarFormulario();
        this.orden.set('fecha');
        this.pagina.set(1);
        await this.cargar();
      } catch (error) {
        this.mostrarErrorAlCrear(error);
      }
    });
  }

  private limpiarFormulario() {
    this.publicacionModel.set({ titulo: '', mensaje: '' });
    this.publicacionForm().reset();
    this.imagen.set(null);
    this.vistaPrevia.set(null);
    this.errorImagen.set(null);
  }

  private mostrarErrorAlCrear(error: unknown) {
    const estado = error instanceof HttpErrorResponse ? error.status : 0;
    if (estado === 401) {
      return;
    }
    if (estado === 400 || estado === 413) {
      const mensaje = error instanceof HttpErrorResponse ? error.error?.message : null;
      const detalle = Array.isArray(mensaje) ? mensaje.join('. ') : mensaje;
      this.modal.mostrar('Revisá los datos', detalle ?? 'Alguno de los datos enviados no es válido.');
    } else {
      this.modal.mostrar('No pudimos publicar', 'No pudimos comunicarnos con el servidor. Intentá de nuevo en unos minutos.');
    }
  }
}
