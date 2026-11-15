import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Auth } from './auth';
import { Modal } from './modal';

const MINUTOS_DE_AVISO_ANTES_DE_VENCER = 5;

@Injectable({ providedIn: 'root' })
export class Sesion {
  private auth = inject(Auth);
  private modal = inject(Modal);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  private temporizadorAviso?: ReturnType<typeof setTimeout>;
  private temporizadorVencimiento?: ReturnType<typeof setTimeout>;

  iniciar() {
    this.detener();

    const vencimiento = this.auth.expiraEn();
    if (vencimiento === null) {
      return;
    }

    const ahora = Date.now();
    const avisarEn = vencimiento - MINUTOS_DE_AVISO_ANTES_DE_VENCER * 60 * 1000 - ahora;
    this.temporizadorAviso = setTimeout(() => this.avisar(), Math.max(avisarEn, 0));
    this.temporizadorVencimiento = setTimeout(() => this.vencer(), Math.max(vencimiento - ahora, 0));
  }

  detener() {
    clearTimeout(this.temporizadorAviso);
    clearTimeout(this.temporizadorVencimiento);
  }

  private async avisar() {
    const vencimiento = this.auth.expiraEn() ?? Date.now();
    const minutos = Math.max(Math.ceil((vencimiento - Date.now()) / 60000), 1);
    const restante = minutos === 1 ? '1 minuto' : `${minutos} minutos`;

    const extender = await this.modal.confirmar(
      'Tu sesión está por vencer',
      `Te quedan ${restante} de sesión. ¿Querés extenderla?`,
      'Extender sesión',
      'Ahora no',
    );
    if (!extender) {
      return;
    }

    try {
      await firstValueFrom(this.auth.refrescar());
    } catch {
      this.cerrarPorVencimiento();
    }
  }

  private vencer() {
    this.dialog.closeAll();
    this.cerrarPorVencimiento();
  }

  private cerrarPorVencimiento() {
    this.detener();
    this.auth.salir();
    this.router.navigate(['/login']);
    this.modal.mostrar('Sesión vencida', 'Tu sesión venció. Iniciá sesión de nuevo para continuar.');
  }
}
