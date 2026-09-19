import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { Shell } from './layout/shell/shell';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'catalogos/estados',
        loadComponent: () =>
          import('./features/catalogos/estados/estados-list').then((m) => m.EstadosList),
      },
      {
        path: 'comercial/clientes',
        loadComponent: () =>
          import('./features/comercial/clientes/clientes-list').then((m) => m.ClientesList),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
