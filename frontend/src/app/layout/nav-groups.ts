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
    items: [{ label: 'Estados', icon: 'pi pi-flag', route: '/catalogos/estados' }],
  },
  {
    label: 'Comercial',
    items: [{ label: 'Clientes', icon: 'pi pi-users', route: '/comercial/clientes' }],
  },
];
