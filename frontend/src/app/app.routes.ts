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
        path: 'catalogos/sectores',
        loadComponent: () =>
          import('./features/catalogos/sectores/sectores-list').then((m) => m.SectoresList),
      },
      {
        path: 'comercial/clientes',
        loadComponent: () =>
          import('./features/comercial/clientes/clientes-list').then((m) => m.ClientesList),
      },
      {
        path: 'comercial/productos',
        loadComponent: () =>
          import('./features/comercial/productos/productos-list').then((m) => m.ProductosList),
      },
      {
        path: 'comercial/pedidos',
        loadComponent: () =>
          import('./features/comercial/pedidos/pedidos-list').then((m) => m.PedidosList),
      },
      {
        path: 'comercial/reclamos',
        loadComponent: () =>
          import('./features/comercial/reclamos/reclamos-list').then((m) => m.ReclamosList),
      },
      {
        path: 'comercial/tipo-impacto',
        loadComponent: () =>
          import('./features/comercial/tipo-impacto/tipo-impacto-list').then((m) => m.TipoImpactoList),
      },
      {
        path: 'comercial/tipo-documento',
        loadComponent: () =>
          import('./features/comercial/tipo-documento/tipo-documento-list').then(
            (m) => m.TipoDocumentoList,
          ),
      },
      {
        path: 'usuarios/usuarios',
        loadComponent: () =>
          import('./features/usuarios/usuarios/usuarios-list').then((m) => m.UsuariosList),
      },
      {
        path: 'usuarios/roles',
        loadComponent: () => import('./features/usuarios/roles/roles-list').then((m) => m.RolesList),
      },
      {
        path: 'usuarios/permisos',
        loadComponent: () =>
          import('./features/usuarios/permisos/permisos-list').then((m) => m.PermisosList),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
