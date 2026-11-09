import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { API_URL } from '../config';
import { Auth } from '../servicios/auth';

export const authInterceptor: HttpInterceptorFn = (peticion, siguiente) => {
  const auth = inject(Auth);
  const router = inject(Router);

  const token = auth.token();
  const conToken =
    token && peticion.url.startsWith(API_URL)
      ? peticion.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : peticion;

  return siguiente(conToken).pipe(
    catchError((error) => {
      const esDeAutenticacion = peticion.url.includes('/autenticacion/');
      if (error instanceof HttpErrorResponse && error.status === 401 && !esDeAutenticacion) {
        auth.salir();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    }),
  );
};
