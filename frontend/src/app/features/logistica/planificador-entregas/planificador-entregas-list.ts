import { Component, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { TableModule, TableColumnReorderEvent } from 'primeng/table';
import { ContextMenu, ContextMenuModule } from 'primeng/contextmenu';
import { DialogModule } from 'primeng/dialog';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { MenuItem, MessageService } from 'primeng/api';
import { PlanificadorEntregasApiService } from '../../../core/api/planificador-entregas-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ColorPlanificador, PedidoPlanificador, ProductoPlanificador, TableroPlanificador } from '../../../core/models/planificador-entregas.model';

const COLOR_FONDO: Record<ColorPlanificador, string> = {
  verde: '#c8e6c9',
  amarillo: '#fff9c4',
  rojo: '#ffcdd2',
};
const COLOR_ASIGNADO = '#a5d6a7';

// Tablero del Planificador de Entregas (solo planta Caseros): una
// fila por producto (con su stock de Logística Caseros), una columna
// por pedido activo. El color de cada celda y del pedido se calcula
// en el backend con una cascada de stock (ver
// PlanificadorEntregasService.obtenerTablero) — acá solo se pinta.
@Component({
  selector: 'app-planificador-entregas-list',
  imports: [DatePipe, FormsModule, TableModule, ContextMenuModule, DialogModule, DatePickerModule, ButtonModule],
  templateUrl: './planificador-entregas-list.html',
  styleUrl: './planificador-entregas-list.scss',
})
export class PlanificadorEntregasList implements OnInit {
  private readonly api = inject(PlanificadorEntregasApiService);
  private readonly authService = inject(AuthService);
  private readonly messageService = inject(MessageService);

  @ViewChild('cm') contextMenu!: ContextMenu;

  protected readonly puedeEditar = computed(() => {
    const user = this.authService.currentUser();
    return !!user && (user.es_administrador || user.permisos.includes('planificador_entregas.editar'));
  });

  protected readonly loading = signal(false);
  protected readonly productos = signal<ProductoPlanificador[]>([]);
  protected readonly columnas = signal<PedidoPlanificador[]>([]);

  protected readonly pedidoSeleccionado = signal<PedidoPlanificador | null>(null);
  protected readonly menuItems: MenuItem[] = [
    {
      label: 'Asignar fecha de salida',
      icon: 'pi pi-calendar',
      command: () => this.abrirFecha(),
    },
    {
      label: 'Quitar fecha de salida',
      icon: 'pi pi-calendar-times',
      command: () => this.guardarFecha(null),
      visible: false,
    },
  ];

  protected readonly fechaDialogVisible = signal(false);
  protected readonly fechaSeleccionada = signal<Date | null>(null);
  protected readonly guardandoFecha = signal(false);

  ngOnInit(): void {
    this.cargar();
  }

  private cargar(): void {
    this.loading.set(true);
    this.api.tablero().subscribe({
      next: (tablero: TableroPlanificador) => {
        this.productos.set(tablero.productos);
        this.columnas.set(tablero.pedidos);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el planificador' });
      },
    });
  }

  protected itemDe(pedido: PedidoPlanificador, producto: ProductoPlanificador) {
    return pedido.items.find((i) => i.id_producto === producto.id_producto);
  }

  protected fondoCelda(pedido: PedidoPlanificador, producto: ProductoPlanificador): string {
    const item = this.itemDe(pedido, producto);
    return item ? COLOR_FONDO[item.color] : 'transparent';
  }

  protected fondoHeader(pedido: PedidoPlanificador): string {
    return pedido.fecha_salida_planificada ? COLOR_ASIGNADO : COLOR_FONDO[pedido.color];
  }

  protected onContextMenu(event: MouseEvent, pedido: PedidoPlanificador): void {
    if (!this.puedeEditar()) {
      return;
    }
    event.preventDefault();
    this.pedidoSeleccionado.set(pedido);
    this.menuItems[1].visible = !!pedido.fecha_salida_planificada;
    this.contextMenu.show(event);
  }

  private abrirFecha(): void {
    const pedido = this.pedidoSeleccionado();
    if (!pedido) {
      return;
    }
    this.fechaSeleccionada.set(pedido.fecha_salida_planificada ? new Date(pedido.fecha_salida_planificada) : null);
    this.fechaDialogVisible.set(true);
  }

  protected cerrarFecha(): void {
    this.fechaDialogVisible.set(false);
  }

  protected confirmarFecha(): void {
    const fecha = this.fechaSeleccionada();
    if (!fecha) {
      return;
    }
    this.guardarFecha(fecha.toISOString().slice(0, 10));
  }

  private guardarFecha(fecha: string | null): void {
    const pedido = this.pedidoSeleccionado();
    if (!pedido || this.guardandoFecha()) {
      return;
    }
    this.guardandoFecha.set(true);
    this.api.asignarFechaSalida(pedido.id_pedido, fecha).subscribe({
      next: () => {
        this.guardandoFecha.set(false);
        this.fechaDialogVisible.set(false);
        this.cargar();
      },
      error: (error: HttpErrorResponse) => {
        this.guardandoFecha.set(false);
        const detail = typeof error.error?.message === 'string' ? error.error.message : 'No se pudo guardar la fecha';
        this.messageService.add({ severity: 'error', summary: 'Error', detail });
      },
    });
  }

  // El arrastre de columnas solo tiene sentido dentro del mismo grupo
  // de fecha_prometido (el orden entre fechas distintas siempre lo
  // define fecha_prometido). Se recalcula el desempate manual tomando
  // el orden visual resultante del arrastre, agrupado por fecha —
  // así, aunque se arrastre "cruzando" una fecha distinta, al guardar
  // y recargar el tablero vuelve a acomodarse por fecha_prometido y
  // solo queda el nuevo orden relativo dentro de cada grupo.
  protected onColReorder(event: TableColumnReorderEvent): void {
    if (!this.puedeEditar() || event.dragIndex == null || event.dropIndex == null) {
      return;
    }
    const cols = [...this.columnas()];
    const [movido] = cols.splice(event.dragIndex, 1);
    cols.splice(event.dropIndex, 0, movido);
    this.columnas.set(cols);

    const contadores = new Map<string, number>();
    const ordenes = cols.map((col) => {
      const clave = col.fecha_prometido ?? 'sin-fecha';
      const siguiente = contadores.get(clave) ?? 0;
      contadores.set(clave, siguiente + 1);
      return { id_pedido: col.id_pedido, orden_planificador: siguiente };
    });

    this.api.reordenar(ordenes).subscribe({
      next: () => this.cargar(),
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el nuevo orden' });
        this.cargar();
      },
    });
  }
}
