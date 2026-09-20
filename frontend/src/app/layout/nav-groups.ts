export interface NavItem {
  label: string;
  icon: string;
  route: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/**
 * Agrupado según los 6 módulos del backend. Se va completando a medida
 * que se arman las pantallas de cada entidad, siguiendo el mismo patrón
 * que Estados/Clientes.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Catálogos',
    items: [
      { label: 'Estados', icon: 'pi pi-flag', route: '/catalogos/estados' },
      { label: 'Sectores', icon: 'pi pi-sitemap', route: '/catalogos/sectores' },
      { label: 'Unidad de Medida', icon: 'pi pi-arrows-h', route: '/catalogos/unidad-medida' },
    ],
  },
  {
    label: 'Comercial',
    items: [
      { label: 'Clientes', icon: 'pi pi-users', route: '/comercial/clientes' },
      { label: 'Productos', icon: 'pi pi-box', route: '/comercial/productos' },
      { label: 'Pedidos', icon: 'pi pi-shopping-cart', route: '/comercial/pedidos' },
      { label: 'Reclamos', icon: 'pi pi-exclamation-circle', route: '/comercial/reclamos' },
      { label: 'Tipo de Impacto', icon: 'pi pi-bolt', route: '/comercial/tipo-impacto' },
      { label: 'Tipo de Documento', icon: 'pi pi-file', route: '/comercial/tipo-documento' },
    ],
  },
  {
    label: 'Compras',
    items: [
      { label: 'Proveedores', icon: 'pi pi-truck', route: '/compras/proveedores' },
      { label: 'Insumos', icon: 'pi pi-inbox', route: '/compras/insumos' },
      { label: 'Requerimientos', icon: 'pi pi-file-edit', route: '/compras/requerimientos' },
      { label: 'Cotizaciones', icon: 'pi pi-percentage', route: '/compras/cotizaciones' },
      { label: 'Compras', icon: 'pi pi-shopping-bag', route: '/compras/compras' },
    ],
  },
  {
    label: 'Usuarios',
    items: [
      { label: 'Usuarios', icon: 'pi pi-user', route: '/usuarios/usuarios' },
      { label: 'Roles', icon: 'pi pi-id-card', route: '/usuarios/roles' },
      { label: 'Permisos', icon: 'pi pi-key', route: '/usuarios/permisos' },
    ],
  },
];
