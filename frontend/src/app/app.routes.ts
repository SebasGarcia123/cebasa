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
        path: 'stock',
        loadComponent: () => import('./features/stock/stock-list').then((m) => m.StockList),
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
        path: 'catalogos/unidad-medida',
        loadComponent: () =>
          import('./features/catalogos/unidad-medida/unidad-medida-list').then((m) => m.UnidadMedidaList),
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
        path: 'compras/proveedores',
        loadComponent: () =>
          import('./features/compras/proveedores/proveedores-list').then((m) => m.ProveedoresList),
      },
      {
        path: 'compras/insumos',
        loadComponent: () => import('./features/compras/insumos/insumos-list').then((m) => m.InsumosList),
      },
      {
        path: 'compras/requerimientos',
        loadComponent: () =>
          import('./features/compras/requerimientos/requerimientos-list').then((m) => m.RequerimientosList),
      },
      {
        path: 'compras/gestion',
        loadComponent: () =>
          import('./features/compras/gestion/gestion-compras').then((m) => m.GestionCompras),
      },
      {
        path: 'produccion/depositos',
        loadComponent: () =>
          import('./features/produccion/depositos/depositos-list').then((m) => m.DepositosList),
      },
      {
        path: 'produccion/naturaleza',
        loadComponent: () =>
          import('./features/produccion/naturaleza/naturaleza-list').then((m) => m.NaturalezaList),
      },
      {
        path: 'produccion/lineas',
        loadComponent: () => import('./features/produccion/lineas/lineas-list').then((m) => m.LineasList),
      },
      {
        path: 'produccion/turnos',
        loadComponent: () => import('./features/produccion/turnos/turnos-list').then((m) => m.TurnosList),
      },
      {
        path: 'produccion/tipo-movimiento',
        loadComponent: () =>
          import('./features/produccion/tipo-movimiento/tipo-movimiento-list').then((m) => m.TipoMovimientoList),
      },
      {
        path: 'produccion/movimientos-insumo',
        loadComponent: () =>
          import('./features/produccion/movimiento-insumo/movimiento-insumo-list').then(
            (m) => m.MovimientoInsumoList,
          ),
      },
      {
        path: 'produccion/movimientos-producto',
        loadComponent: () =>
          import('./features/produccion/movimiento-producto/movimiento-producto-list').then(
            (m) => m.MovimientoProductoList,
          ),
      },
      {
        path: 'produccion/recetas',
        loadComponent: () => import('./features/produccion/recetas/recetas-list').then((m) => m.RecetasList),
      },
      {
        path: 'produccion/lotes',
        loadComponent: () =>
          import('./features/produccion/lotes-prod/lotes-prod-list').then((m) => m.LotesProdList),
      },
      {
        path: 'logistica/fletero',
        loadComponent: () => import('./features/logistica/fletero/fletero-list').then((m) => m.FleteroList),
      },
      {
        path: 'logistica/tipo-lote',
        loadComponent: () => import('./features/logistica/tipo-lote/tipo-lote-list').then((m) => m.TipoLoteList),
      },
      {
        path: 'logistica/autoelevadores',
        loadComponent: () =>
          import('./features/logistica/autoelevadores/autoelevadores-list').then((m) => m.AutoelevadoresList),
      },
      {
        path: 'logistica/control-autoelevador',
        loadComponent: () =>
          import('./features/logistica/control-autoelevador/control-autoelevador-list').then(
            (m) => m.ControlAutoelevadorList,
          ),
      },
      {
        path: 'logistica/transporte',
        loadComponent: () =>
          import('./features/logistica/transporte/transporte-list').then((m) => m.TransporteList),
      },
      {
        path: 'logistica/lotes',
        loadComponent: () => import('./features/logistica/lotes/lotes-list').then((m) => m.LotesList),
      },
      {
        path: 'logistica/aprobacion-lotes-prod',
        loadComponent: () =>
          import('./features/logistica/aprobacion-lotes-prod/aprobacion-lotes-prod-list').then(
            (m) => m.AprobacionLotesProdList,
          ),
      },
      {
        path: 'pedido-insumos/pedido-insumos',
        loadComponent: () =>
          import('./features/pedido-insumos/pedido-insumos/pedido-insumos-list').then(
            (m) => m.PedidoInsumosList,
          ),
      },
      {
        path: 'pedido-insumos/plan-produccion',
        loadComponent: () =>
          import('./features/pedido-insumos/plan-produccion/plan-produccion-list').then(
            (m) => m.PlanProduccionList,
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
