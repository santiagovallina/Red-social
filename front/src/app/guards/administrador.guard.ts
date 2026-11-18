import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../servicios/auth';

export const administradorGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (!auth.logueado()) {
    return router.createUrlTree(['/login']);
  }
  return auth.usuario()?.perfil === 'administrador' ? true : router.createUrlTree(['/publicaciones']);
};
