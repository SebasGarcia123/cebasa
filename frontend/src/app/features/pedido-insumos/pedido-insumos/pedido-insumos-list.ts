import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PedidoInsumosApiService } from '../../../core/api/pedido-insumos-api.service';
import { ItemPedidoInsumoApiService } from '../../../core/api/item-pedido-insumo-api.service';
import { InsumosApiService } from '../../../core/api/insumos-api.service';
import { EstadosApiService } from '../../../core/api/estados-api.service';
import { PedidoInsumos } from '../../../core/models/pedido-insumos.model';
import { ItemPedidoInsumo } from '../../../core/models/item-pedido-insumo.model';
import { Insumo } from '../../../core/models/insumo.model';
import { Estado } from '../../../core/models/estado.model';

const ESTADOS_PEDIDO_INSUMOS = new Set(['Activo', 'Anulado']);

@Component({
  selector: 'app-pedido-insumos-list',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    DatePickerModule,
    InputNumberModule,
    TooltipModule,
  ],
  templateUrl: './pedido-insumos-list.html',
  styleUrl: './pedido-insumos-list.scss',
})
export class PedidoInsumosList implements OnInit {
  private readonly api = inject(PedidoInsumosApiService);
  private readonly itemsApi = inject(ItemPedidoInsumoApiService);
  private readonly insumosApi = inject(InsumosApiService);
  private readonly estadosApi = inject(EstadosApiService);
  private readonly fb = inject(FormBuilder);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  protected readonly pedidos = signal<PedidoInsumos[]>([]);
  protected readonly insumos = signal<Insumo[]>([]);
  protected readonly estados = signal<Estado[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly dialogVisible = signal(false);
  protected readonly editingId = signal<number | null>(null);

  // id_usuario: quien solicita. Por ahora se fija a 1 (usuario de prueba),
  // igual que en el resto de la app.
  // Al crear no se elige estado: el sistema lo pone en "Activo". El
  // selector de estado solo se muestra al editar, y restringido a
  // Activo/Anulado.
  protected readonly estadosPedidoInsumos = computed(() =>
    this.estados().filter((e) => ESTADOS_PEDIDO_INSUMOS.has(e.nombreEstado)),
  );

  protected readonly form = this.fb.nonNullable.group({
    fecha_carga: [null as Date | null, Validators.required],
    fecha_necesidad: [null as Date | null, Validators.required],
    id_estado: [null as number | null],
    motivo_rechazo: [''],
  });

  protected readonly itemsDialogVisible = signal(false);
  protected readonly itemsLoading = signal(false);
  protected readonly itemsSaving = signal(false);
  protected readonly items = signal<ItemPedidoInsumo[]>([]);
  protected readonly editingItemId = signal<number | null>(null);
  private pedidoActivo: PedidoInsumos | null = null;

  protected readonly itemForm = this.fb.nonNullable.group({
    id_insumo: [null as number | null, Validators.required],
    cantidad_solicitada: [null as number | null, [Validators.required, Validators.min(0.01)]],
    cantidad_abastecida: [0 as number | null],
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    forkJoin({
      pedidos: this.api.list(),
      insumos: this.insumosApi.list(),
      estados: this.estadosApi.list(),
    }).subscribe({
      next: ({ pedidos, insumos, estados }) => {
        this.pedidos.set(pedidos);
        this.insumos.set(insumos);
        this.estados.set(estados);
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

  openEdit(pedido: PedidoInsumos): void {
    this.editingId.set(pedido.id_pedido_insumos);
    this.form.setValue({
      fecha_carga: new Date(pedido.fecha_carga),
      fecha_necesidad: new Date(pedido.fecha_necesidad),
      id_estado: pedido.id_estado,
      motivo_rechazo: pedido.motivo_rechazo ?? '',
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
      fecha_carga: raw.fecha_carga!.toISOString().slice(0, 10),
      fecha_necesidad: raw.fecha_necesidad!.toISOString().slice(0, 10),
      id_usuario: 1,
      ...(raw.motivo_rechazo ? { motivo_rechazo: raw.motivo_rechazo } : {}),
    };
    const id = this.editingId();
    const request$ = id ? this.api.update(id, { ...dto, id_estado: raw.id_estado! }) : this.api.create(dto);

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

  confirmDelete(pedido: PedidoInsumos): void {
    this.confirmationService.confirm({
      header: 'Confirmar eliminación',
      message: `¿Eliminar el pedido de insumos #${pedido.id_pedido_insumos}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { severity: 'danger', label: 'Eliminar' },
      rejectButtonProps: { severity: 'secondary', label: 'Cancelar', outlined: true },
      accept: () => this.remove(pedido.id_pedido_insumos),
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

  openItems(pedido: PedidoInsumos): void {
    this.pedidoActivo = pedido;
    this.editingItemId.set(null);
    this.itemForm.reset({ cantidad_abastecida: 0 });
    this.itemsDialogVisible.set(true);
    this.loadItems();
  }

  private loadItems(): void {
    if (!this.pedidoActivo) {
      return;
    }
    this.itemsLoading.set(true);
    this.itemsApi.list(this.pedidoActivo.id_pedido_insumos).subscribe({
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

  editItem(item: ItemPedidoInsumo): void {
    this.editingItemId.set(item.id_item_pedido_insumo);
    // cantidad_solicitada/cantidad_abastecida son Decimal en la base:
    // Prisma las serializa como string, no number. Sin convertir acá,
    // guardar sin tocar el campo manda el string de vuelta y el backend
    // lo rechaza.
    this.itemForm.setValue({
      id_insumo: item.id_insumo,
      cantidad_solicitada: Number(item.cantidad_solicitada),
      cantidad_abastecida: Number(item.cantidad_abastecida),
    });
  }

  cancelItemEdit(): void {
    this.editingItemId.set(null);
    this.itemForm.reset({ cantidad_abastecida: 0 });
  }

  saveItem(): void {
    if (this.itemForm.invalid || this.itemsSaving() || !this.pedidoActivo) {
      return;
    }

    this.itemsSaving.set(true);
    const raw = this.itemForm.getRawValue();
    const dto = {
      id_insumo: raw.id_insumo!,
      cantidad_solicitada: Number(raw.cantidad_solicitada),
      cantidad_abastecida: Number(raw.cantidad_abastecida ?? 0),
    };
    const idItem = this.editingItemId();
    const request$ = idItem
      ? this.itemsApi.update(this.pedidoActivo.id_pedido_insumos, idItem, dto)
      : this.itemsApi.create(this.pedidoActivo.id_pedido_insumos, dto);

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

  removeItem(item: ItemPedidoInsumo): void {
    if (!this.pedidoActivo) {
      return;
    }
    this.itemsApi.remove(this.pedidoActivo.id_pedido_insumos, item.id_item_pedido_insumo).subscribe({
      next: () => this.loadItems(),
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el ítem' });
      },
    });
  }
}
