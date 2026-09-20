import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { RecetasApiService } from '../../../core/api/recetas-api.service';
import { RecetaItemApiService } from '../../../core/api/receta-item-api.service';
import { ProductosApiService } from '../../../core/api/productos-api.service';
import { InsumosApiService } from '../../../core/api/insumos-api.service';
import { EstadosApiService } from '../../../core/api/estados-api.service';
import { Receta } from '../../../core/models/receta.model';
import { RecetaItem } from '../../../core/models/receta-item.model';
import { Producto } from '../../../core/models/producto.model';
import { Insumo } from '../../../core/models/insumo.model';
import { Estado } from '../../../core/models/estado.model';

@Component({
  selector: 'app-recetas-list',
  imports: [ReactiveFormsModule, TableModule, ButtonModule, DialogModule, SelectModule, InputNumberModule, TooltipModule],
  templateUrl: './recetas-list.html',
  styleUrl: './recetas-list.scss',
})
export class RecetasList implements OnInit {
  private readonly api = inject(RecetasApiService);
  private readonly itemsApi = inject(RecetaItemApiService);
  private readonly productosApi = inject(ProductosApiService);
  private readonly insumosApi = inject(InsumosApiService);
  private readonly estadosApi = inject(EstadosApiService);
  private readonly fb = inject(FormBuilder);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  protected readonly recetas = signal<Receta[]>([]);
  protected readonly productos = signal<Producto[]>([]);
  protected readonly insumos = signal<Insumo[]>([]);
  protected readonly estados = signal<Estado[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly dialogVisible = signal(false);
  protected readonly editingId = signal<number | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    id_producto: [null as number | null, Validators.required],
    id_estado: [null as number | null, Validators.required],
  });

  protected readonly itemsDialogVisible = signal(false);
  protected readonly itemsLoading = signal(false);
  protected readonly itemsSaving = signal(false);
  protected readonly items = signal<RecetaItem[]>([]);
  protected readonly editingItemId = signal<number | null>(null);
  private recetaActiva: Receta | null = null;

  protected readonly itemForm = this.fb.nonNullable.group({
    id_insumo: [null as number | null, Validators.required],
    cantidad_utilizada: [null as number | null, [Validators.required, Validators.min(0.01)]],
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    forkJoin({
      recetas: this.api.list(),
      productos: this.productosApi.list(),
      insumos: this.insumosApi.list(),
      estados: this.estadosApi.list(),
    }).subscribe({
      next: ({ recetas, productos, insumos, estados }) => {
        this.recetas.set(recetas);
        this.productos.set(productos);
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

  openEdit(receta: Receta): void {
    this.editingId.set(receta.id_receta);
    this.form.setValue({ id_producto: receta.id_producto, id_estado: receta.id_estado });
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
    const dto = { id_producto: raw.id_producto!, id_estado: raw.id_estado! };
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

  confirmDelete(receta: Receta): void {
    this.confirmationService.confirm({
      header: 'Confirmar eliminación',
      message: `¿Eliminar la receta #${receta.id_receta}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { severity: 'danger', label: 'Eliminar' },
      rejectButtonProps: { severity: 'secondary', label: 'Cancelar', outlined: true },
      accept: () => this.remove(receta.id_receta),
    });
  }

  private remove(id: number): void {
    this.api.remove(id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Receta eliminada' });
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

  openItems(receta: Receta): void {
    this.recetaActiva = receta;
    this.editingItemId.set(null);
    this.itemForm.reset();
    this.itemsDialogVisible.set(true);
    this.loadItems();
  }

  private loadItems(): void {
    if (!this.recetaActiva) {
      return;
    }
    this.itemsLoading.set(true);
    this.itemsApi.list(this.recetaActiva.id_receta).subscribe({
      next: (data) => {
        this.items.set(data);
        this.itemsLoading.set(false);
      },
      error: () => {
        this.itemsLoading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los insumos' });
      },
    });
  }

  editItem(item: RecetaItem): void {
    this.editingItemId.set(item.id_receta_item);
    this.itemForm.setValue({ id_insumo: item.id_insumo, cantidad_utilizada: item.cantidad_utilizada });
  }

  cancelItemEdit(): void {
    this.editingItemId.set(null);
    this.itemForm.reset();
  }

  saveItem(): void {
    if (this.itemForm.invalid || this.itemsSaving() || !this.recetaActiva) {
      return;
    }

    this.itemsSaving.set(true);
    const raw = this.itemForm.getRawValue();
    const dto = { id_insumo: raw.id_insumo!, cantidad_utilizada: raw.cantidad_utilizada! };
    const idItem = this.editingItemId();
    const request$ = idItem
      ? this.itemsApi.update(this.recetaActiva.id_receta, idItem, dto)
      : this.itemsApi.create(this.recetaActiva.id_receta, dto);

    request$.subscribe({
      next: () => {
        this.itemsSaving.set(false);
        this.cancelItemEdit();
        this.loadItems();
      },
      error: () => {
        this.itemsSaving.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el insumo' });
      },
    });
  }

  removeItem(item: RecetaItem): void {
    if (!this.recetaActiva) {
      return;
    }
    this.itemsApi.remove(this.recetaActiva.id_receta, item.id_receta_item).subscribe({
      next: () => this.loadItems(),
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el insumo' });
      },
    });
  }
}
