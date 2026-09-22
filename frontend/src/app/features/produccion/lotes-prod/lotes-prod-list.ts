import { Component, OnInit, computed, inject, signal } from '@angular/core';
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
import { LoteProdApiService } from '../../../core/api/lote-prod-api.service';
import { ItemProdApiService } from '../../../core/api/item-prod-api.service';
import { TurnosApiService } from '../../../core/api/turnos-api.service';
import { ProductosApiService } from '../../../core/api/productos-api.service';
import { LineasApiService } from '../../../core/api/lineas-api.service';
import { EstadosApiService } from '../../../core/api/estados-api.service';
import { LoteProd } from '../../../core/models/lote-prod.model';
import { ItemProd } from '../../../core/models/item-prod.model';
import { Turno } from '../../../core/models/turno.model';
import { Producto } from '../../../core/models/producto.model';
import { Linea } from '../../../core/models/linea.model';
import { Estado } from '../../../core/models/estado.model';

const ESTADOS_LOTE_PROD = new Set(['Activo', 'Anulado']);

@Component({
  selector: 'app-lotes-prod-list',
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
  templateUrl: './lotes-prod-list.html',
  styleUrl: './lotes-prod-list.scss',
})
export class LotesProdList implements OnInit {
  private readonly api = inject(LoteProdApiService);
  private readonly itemsApi = inject(ItemProdApiService);
  private readonly turnosApi = inject(TurnosApiService);
  private readonly productosApi = inject(ProductosApiService);
  private readonly lineasApi = inject(LineasApiService);
  private readonly estadosApi = inject(EstadosApiService);
  private readonly fb = inject(FormBuilder);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  protected readonly lotes = signal<LoteProd[]>([]);
  protected readonly turnos = signal<Turno[]>([]);
  protected readonly productos = signal<Producto[]>([]);
  protected readonly lineas = signal<Linea[]>([]);
  protected readonly estados = signal<Estado[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly dialogVisible = signal(false);
  protected readonly editingId = signal<number | null>(null);

  // Al crear no se elige estado: el sistema lo pone en "Activo". El
  // selector de estado solo se muestra al editar, y restringido a
  // Activo/Anulado.
  protected readonly estadosLoteProd = computed(() => this.estados().filter((e) => ESTADOS_LOTE_PROD.has(e.nombreEstado)));

  protected readonly form = this.fb.nonNullable.group({
    id_turno: [null as number | null, Validators.required],
    fecha_lote_prod: [null as Date | null, Validators.required],
    id_estado: [null as number | null],
  });

  protected readonly itemsDialogVisible = signal(false);
  protected readonly itemsLoading = signal(false);
  protected readonly itemsSaving = signal(false);
  protected readonly items = signal<ItemProd[]>([]);
  protected readonly editingItemId = signal<number | null>(null);
  private loteActivo: LoteProd | null = null;

  protected readonly itemForm = this.fb.nonNullable.group({
    id_producto: [null as number | null, Validators.required],
    id_lineas: [null as number | null, Validators.required],
    cantidad: [null as number | null, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    forkJoin({
      lotes: this.api.list(),
      turnos: this.turnosApi.list(),
      productos: this.productosApi.list(),
      lineas: this.lineasApi.list(),
      estados: this.estadosApi.list(),
    }).subscribe({
      next: ({ lotes, turnos, productos, lineas, estados }) => {
        this.lotes.set(lotes);
        this.turnos.set(turnos);
        this.productos.set(productos);
        this.lineas.set(lineas);
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

  openEdit(lote: LoteProd): void {
    this.editingId.set(lote.id_lote);
    this.form.setValue({
      id_turno: lote.id_turno,
      fecha_lote_prod: new Date(lote.fecha_lote_prod),
      id_estado: lote.id_estado,
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
      id_turno: raw.id_turno!,
      fecha_lote_prod: raw.fecha_lote_prod!.toISOString().slice(0, 10),
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

  confirmDelete(lote: LoteProd): void {
    this.confirmationService.confirm({
      header: 'Confirmar eliminación',
      message: `¿Eliminar el lote #${lote.id_lote}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { severity: 'danger', label: 'Eliminar' },
      rejectButtonProps: { severity: 'secondary', label: 'Cancelar', outlined: true },
      accept: () => this.remove(lote.id_lote),
    });
  }

  private remove(id: number): void {
    this.api.remove(id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Lote eliminado' });
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

  openItems(lote: LoteProd): void {
    this.loteActivo = lote;
    this.editingItemId.set(null);
    this.itemForm.reset();
    this.itemsDialogVisible.set(true);
    this.loadItems();
  }

  private loadItems(): void {
    if (!this.loteActivo) {
      return;
    }
    this.itemsLoading.set(true);
    this.itemsApi.list(this.loteActivo.id_lote).subscribe({
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

  editItem(item: ItemProd): void {
    this.editingItemId.set(item.id_item);
    this.itemForm.setValue({ id_producto: item.id_producto, id_lineas: item.id_lineas, cantidad: item.cantidad });
  }

  cancelItemEdit(): void {
    this.editingItemId.set(null);
    this.itemForm.reset();
  }

  saveItem(): void {
    if (this.itemForm.invalid || this.itemsSaving() || !this.loteActivo) {
      return;
    }

    this.itemsSaving.set(true);
    const raw = this.itemForm.getRawValue();
    const dto = { id_producto: raw.id_producto!, id_lineas: raw.id_lineas!, cantidad: raw.cantidad! };
    const idItem = this.editingItemId();
    const request$ = idItem
      ? this.itemsApi.update(this.loteActivo.id_lote, idItem, dto)
      : this.itemsApi.create(this.loteActivo.id_lote, dto);

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

  removeItem(item: ItemProd): void {
    if (!this.loteActivo) {
      return;
    }
    this.itemsApi.remove(this.loteActivo.id_lote, item.id_item).subscribe({
      next: () => this.loadItems(),
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el ítem' });
      },
    });
  }
}
