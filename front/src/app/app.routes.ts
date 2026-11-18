import { Routes } from '@angular/router';
import { administradorGuard } from './guards/administrador.guard';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'publicaciones', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./componentes/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    loadComponent: () => import('./componentes/register/register').then((m) => m.Register),
  },
  {
    path: 'publicaciones',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./componentes/publicaciones/publicaciones').then((m) => m.Publicaciones),
  },
  {
    path: 'publicacion/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./componentes/detalle-publicacion/detalle-publicacion').then(
        (m) => m.DetallePublicacion,
      ),
  },
  {
    path: 'mi-perfil',
    canActivate: [authGuard],
    loadComponent: () => import('./componentes/mi-perfil/mi-perfil').then((m) => m.MiPerfil),
  },
  {
    path: 'dashboard',
    canActivate: [administradorGuard],
    loadComponent: () => import('./componentes/dashboard/dashboard').then((m) => m.Dashboard),
    children: [
      { path: '', redirectTo: 'usuarios', pathMatch: 'full' },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./componentes/dashboard-usuarios/dashboard-usuarios').then(
            (m) => m.DashboardUsuarios,
          ),
      },
      {
        path: 'estadisticas',
        loadComponent: () =>
          import('./componentes/dashboard-estadisticas/dashboard-estadisticas').then(
            (m) => m.DashboardEstadisticas,
          ),
      },
    ],
  },
  { path: '**', redirectTo: 'publicaciones' },
];
