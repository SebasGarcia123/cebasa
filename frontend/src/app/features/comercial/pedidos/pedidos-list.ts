import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PedidosApiService } from '../../../core/api/pedidos-api.service';
import { ItemPedidoApiService } from '../../../core/api/item-pedido-api.service';
import { ClientesApiService } from '../../../core/api/clientes-api.service';
import { EstadosApiService } from '../../../core/api/estados-api.service';
import { ProductosApiService } from '../../../core/api/productos-api.service';
import { Pedido } from '../../../core/models/pedido.model';
import { ItemPedido } from '../../../core/models/item-pedido.model';
import { Cliente } from '../../../core/models/cliente.model';
import { Estado } from '../../../core/models/estado.model';
import { Producto } from '../../../core/models/producto.model';

@Component({
  selector: 'app-pedidos-list',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    SelectModule,
    DatePickerModule,
    InputNumberModule,
    TooltipModule,
  ],
  templateUrl: './pedidos-list.html',
  styleUrl: './pedidos-list.scss',
})
export class PedidosList implements OnInit {
  private readonly api = inject(PedidosApiService);
  private readonly itemsApi = inject(ItemPedidoApiService);
  private readonly clientesApi = inject(ClientesApiService);
  private readonly estadosApi = inject(EstadosApiService);
  private readonly productosApi = inject(ProductosApiService);
  private readonly fb = inject(FormBuilder);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  protected readonly pedidos = signal<Pedido[]>([]);
  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly estados = signal<Estado[]>([]);
  protected readonly productos = signal<Producto[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly dialogVisible = signal(false);
  protected readonly editingId = signal<number | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    id_cliente: [null as number | null, Validators.required],
    fecha_carga: [null as Date | null, Validators.required],
    fecha_prometido: [null as Date | null],
    id_estado: [null as number | null, Validators.required],
  });

  // Diálogo de ítems del pedido
  protected readonly itemsDialogVisible = signal(false);
  protected readonly itemsLoading = signal(false);
  protected readonly itemsSaving = signal(false);
  protected readonly items = signal<ItemPedido[]>([]);
  protected readonly editingItemId = signal<number | null>(null);
  private pedidoActivo: Pedido | null = null;

  protected readonly itemForm = this.fb.nonNullable.group({
    id_producto: [null as number | null, Validators.required],
    cantidad_bolsones: [null as number | null, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    forkJoin({
      pedidos: this.api.list(),
      clientes: this.clientesApi.list(),
      estados: this.estadosApi.list(),
      productos: this.productosApi.list(),
    }).subscribe({
      next: ({ pedidos, clientes, estados, productos }) => {
        this.pedidos.set(pedidos);
        this.clientes.set(clientes);
        this.estados.set(estados);
        this.productos.set(productos);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el listado' });
      },
    });
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.reset();
    this.dialogVisible.set(true);
  }

  openEdit(pedido: Pedido): void {
    this.editingId.set(pedido.id_pedido);
    this.form.setValue({
      id_cliente: pedido.id_cliente,
      fecha_carga: new Date(pedido.fecha_carga),
      fecha_prometido: pedido.fecha_prometido ? new Date(pedido.fecha_prometido) : null,
      id_estado: pedido.id_estado,
    });
    this.dialogVisible.set(true);
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
  }

  save(): void {
    if (this.form.invalid || this.saving()) {
      return;
    }

    this.saving.set(true);
    const raw = this.form.getRawValue();
    const dto = {
      id_cliente: raw.id_cliente!,
      fecha_carga: raw.fecha_carga!.toISOString().slice(0, 10),
      id_estado: raw.id_estado!,
      id_usuario: 1,
      ...(raw.fecha_prometido ? { fecha_prometido: raw.fecha_prometido.toISOString().slice(0, 10) } : {}),
    };
    const id = this.editingId();
    const request$ = id ? this.api.update(id, dto) : this.api.create(dto);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogVisible.set(false);
        this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Se guardó correctamente' });
        this.load();
      },
      error: () => {
        this.saving.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar' });
      },
    });
  }

  confirmDelete(pedido: Pedido): void {
    this.confirmationService.confirm({
      header: 'Confirmar eliminación',
      message: `¿Eliminar el pedido #${pedido.id_pedido}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { severity: 'danger', label: 'Eliminar' },
      rejectButtonProps: { severity: 'secondary', label: 'Cancelar', outlined: true },
      accept: () => this.remove(pedido.id_pedido),
    });
  }

  private remove(id: number): void {
    this.api.remove(id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Pedido eliminado' });
        this.load();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo eliminar (puede tener datos relacionados)',
        });
      },
    });
  }

  openItems(pedido: Pedido): void {
    this.pedidoActivo = pedido;
    this.editingItemId.set(null);
    this.itemForm.reset();
    this.itemsDialogVisible.set(true);
    this.loadItems();
  }

  private loadItems(): void {
    if (!this.pedidoActivo) {
      return;
    }
    this.itemsLoading.set(true);
    this.itemsApi.list(this.pedidoActivo.id_pedido).subscribe({
      next: (data) => {
        this.items.set(data);
        this.itemsLoading.set(false);
      },
      error: () => {
        this.itemsLoading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los ítems' });
      },
    });
  }

  editItem(item: ItemPedido): void {
    this.editingItemId.set(item.id_item_pedido);
    this.itemForm.setValue({
      id_producto: item.id_producto,
      cantidad_bolsones: item.cantidad_bolsones,
    });
  }

  cancelItemEdit(): void {
    this.editingItemId.set(null);
    this.itemForm.reset();
  }

  saveItem(): void {
    if (this.itemForm.invalid || this.itemsSaving() || !this.pedidoActivo) {
      return;
    }

    this.itemsSaving.set(true);
    const raw = this.itemForm.getRawValue();
    const dto = { id_producto: raw.id_producto!, cantidad_bolsones: raw.cantidad_bolsones! };
    const idItem = this.editingItemId();
    const request$ = idItem
      ? this.itemsApi.update(this.pedidoActivo.id_pedido, idItem, dto)
      : this.itemsApi.create(this.pedidoActivo.id_pedido, dto);

    request$.subscribe({
      next: () => {
        this.itemsSaving.set(false);
        this.cancelItemEdit();
        this.loadItems();
      },
      error: () => {
        this.itemsSaving.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el ítem' });
      },
    });
  }

  removeItem(item: ItemPedido): void {
    if (!this.pedidoActivo) {
      return;
    }
    this.itemsApi.remove(this.pedidoActivo.id_pedido, item.id_item_pedido).subscribe({
      next: () => this.loadItems(),
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el ítem' });
      },
    });
  }
}
