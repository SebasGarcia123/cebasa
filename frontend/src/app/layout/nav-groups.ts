export interface NavItem {
  label: string;
  icon: string;
  route: string;
  /**
   * Permiso requerido para ver el item (coincide con lo que exige el
   * endpoint GET real detrás de la pantalla, no con el agrupamiento
   * visual — p.ej. "Insumos" vive bajo Compras en el menú pero pega
   * contra /insumos, que es de Producción). Sin permiso => visible para
   * cualquier usuario autenticado (igual que los catálogos genéricos en
   * el backend).
   */
  permission?: string;
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
    label: 'Stock',
    items: [
      // Sin permission: el stock es de consulta libre para toda la
      // organización (el ajuste en sí queda protegido por stock.ajustar
      // en el backend, y el lápiz se oculta client-side sin ese permiso).
      { label: 'Stock', icon: 'pi pi-warehouse', route: '/stock' },
    ],
  },
  {
    label: 'Catálogos',
    items: [
      { label: 'Estados', icon: 'pi pi-flag', route: '/catalogos/estados' },
      { label: 'Sectores', icon: 'pi pi-sitemap', route: '/catalogos/sectores' },
      {
        label: 'Unidad de Medida',
        icon: 'pi pi-arrows-h',
        route: '/catalogos/unidad-medida',
        permission: 'produccion.ver',
      },
    ],
  },
  {
    label: 'Comercial',
    items: [
      { label: 'Clientes', icon: 'pi pi-users', route: '/comercial/clientes', permission: 'comercial.ver' },
      { label: 'Productos', icon: 'pi pi-box', route: '/comercial/productos', permission: 'comercial.ver' },
      { label: 'Pedidos', icon: 'pi pi-shopping-cart', route: '/comercial/pedidos', permission: 'comercial.ver' },
      {
        label: 'Reclamos',
        icon: 'pi pi-exclamation-circle',
        route: '/comercial/reclamos',
        permission: 'comercial.ver',
      },
      { label: 'Tipo de Impacto', icon: 'pi pi-bolt', route: '/comercial/tipo-impacto', permission: 'comercial.ver' },
      { label: 'Tipo de Documento', icon: 'pi pi-file', route: '/comercial/tipo-documento', permission: 'comercial.ver' },
    ],
  },
  {
    label: 'Compras',
    items: [
      { label: 'Proveedores', icon: 'pi pi-truck', route: '/compras/proveedores', permission: 'compras.ver' },
      { label: 'Insumos', icon: 'pi pi-inbox', route: '/compras/insumos', permission: 'produccion.ver' },
      {
        label: 'Requerimientos',
        icon: 'pi pi-file-edit',
        route: '/compras/requerimientos',
        permission: 'compras.ver',
      },
      {
        label: 'Gestión de Compras',
        icon: 'pi pi-shopping-bag',
        route: '/compras/gestion',
        permission: 'compras.ver',
      },
    ],
  },
  {
    label: 'Producción',
    items: [
      { label: 'Depósitos', icon: 'pi pi-building', route: '/produccion/depositos', permission: 'produccion.ver' },
      {
        label: 'Naturaleza de Movimiento',
        icon: 'pi pi-directions',
        route: '/produccion/naturaleza',
        permission: 'produccion.ver',
      },
      {
        label: 'Líneas de Producción',
        icon: 'pi pi-sitemap',
        route: '/produccion/lineas',
        permission: 'produccion.ver',
      },
      { label: 'Turnos', icon: 'pi pi-clock', route: '/produccion/turnos', permission: 'produccion.ver' },
      {
        label: 'Tipo de Movimiento',
        icon: 'pi pi-sync',
        route: '/produccion/tipo-movimiento',
        permission: 'produccion.ver',
      },
      {
        label: 'Movimientos de Insumo',
        icon: 'pi pi-arrow-right-arrow-left',
        route: '/produccion/movimientos-insumo',
        permission: 'produccion.ver',
      },
      {
        label: 'Movimientos de Producto',
        icon: 'pi pi-arrow-right-arrow-left',
        route: '/produccion/movimientos-producto',
        permission: 'produccion.ver',
      },
      { label: 'Recetas', icon: 'pi pi-book', route: '/produccion/recetas', permission: 'produccion.ver' },
      {
        label: 'Lotes de Producción',
        icon: 'pi pi-th-large',
        route: '/produccion/lotes',
        permission: 'produccion.ver',
      },
    ],
  },
  {
    label: 'Logística',
    items: [
      { label: 'Fleteros', icon: 'pi pi-user', route: '/logistica/fletero', permission: 'logistica.ver' },
      { label: 'Tipo de Lote', icon: 'pi pi-tag', route: '/logistica/tipo-lote', permission: 'logistica.ver' },
      {
        label: 'Autoelevadores',
        icon: 'pi pi-cog',
        route: '/logistica/autoelevadores',
        permission: 'logistica.ver',
      },
      {
        label: 'Control de Autoelevador',
        icon: 'pi pi-check-square',
        route: '/logistica/control-autoelevador',
        permission: 'logistica.ver',
      },
      { label: 'Transportes', icon: 'pi pi-car', route: '/logistica/transporte', permission: 'logistica.ver' },
      { label: 'Lotes', icon: 'pi pi-box', route: '/logistica/lotes', permission: 'logistica.ver' },
    ],
  },
  {
    label: 'Pedido de Insumos',
    items: [
      {
        label: 'Pedido de Insumos',
        icon: 'pi pi-inbox',
        route: '/pedido-insumos/pedido-insumos',
        permission: 'pedido_insumos.ver',
      },
      {
        label: 'Plan de Producción',
        icon: 'pi pi-calendar',
        route: '/pedido-insumos/plan-produccion',
        permission: 'pedido_insumos.ver',
      },
    ],
  },
  {
    label: 'Usuarios',
    items: [
      { label: 'Usuarios', icon: 'pi pi-user', route: '/usuarios/usuarios', permission: 'usuarios.ver' },
      { label: 'Roles', icon: 'pi pi-id-card', route: '/usuarios/roles', permission: 'usuarios.ver' },
      { label: 'Permisos', icon: 'pi pi-key', route: '/usuarios/permisos', permission: 'usuarios.ver' },
    ],
  },
];
