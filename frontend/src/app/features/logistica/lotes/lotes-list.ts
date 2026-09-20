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
import { LotesApiService } from '../../../core/api/lotes-api.service';
import { ItemLoteApiService } from '../../../core/api/item-lote-api.service';
import { TransporteApiService } from '../../../core/api/transporte-api.service';
import { TipoLoteApiService } from '../../../core/api/tipo-lote-api.service';
import { UnidadMedidaApiService } from '../../../core/api/unidad-medida-api.service';
import { EstadosApiService } from '../../../core/api/estados-api.service';
import { Lote } from '../../../core/models/lote.model';
import { ItemLote } from '../../../core/models/item-lote.model';
import { Transporte } from '../../../core/models/transporte.model';
import { TipoLote } from '../../../core/models/tipo-lote.model';
import { UnidadMedida } from '../../../core/models/unidad-medida.model';
import { Estado } from '../../../core/models/estado.model';

@Component({
  selector: 'app-lotes-list',
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
  templateUrl: './lotes-list.html',
  styleUrl: './lotes-list.scss',
})
export class LotesList implements OnInit {
  private readonly api = inject(LotesApiService);
  private readonly itemsApi = inject(ItemLoteApiService);
  private readonly transporteApi = inject(TransporteApiService);
  private readonly tipoLoteApi = inject(TipoLoteApiService);
  private readonly unidadMedidaApi = inject(UnidadMedidaApiService);
  private readonly estadosApi = inject(EstadosApiService);
  private readonly fb = inject(FormBuilder);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  protected readonly lotes = signal<Lote[]>([]);
  protected readonly transportes = signal<Transporte[]>([]);
  protected readonly tiposLote = signal<TipoLote[]>([]);
  protected readonly unidadesMedida = signal<UnidadMedida[]>([]);
  protected readonly estados = signal<Estado[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly dialogVisible = signal(false);
  protected readonly editingId = signal<number | null>(null);

  // Chofer y camión son sub-recursos de Transporte (no hay endpoint plano
  // para listarlos todos), así que se arman acá juntando lo que ya trae
  // cada transporte, mostrando a qué transporte pertenece cada uno.
  protected readonly choferes = computed(() =>
    this.transportes().flatMap((t) =>
      (t.chofer ?? []).map((c) => ({ ...c, transporteNombre: t.nombre_transporte })),
    ),
  );
  protected readonly camiones = computed(() =>
    this.transportes().flatMap((t) =>
      (t.camion ?? []).map((c) => ({ ...c, transporteNombre: t.nombre_transporte })),
    ),
  );

  protected readonly form = this.fb.nonNullable.group({
    fecha_lote: [null as Date | null, Validators.required],
    id_chofer: [null as number | null, Validators.required],
    id_camion: [null as number | null, Validators.required],
    id_tipo_lote: [null as number | null, Validators.required],
    id_estado: [null as number | null, Validators.required],
    observaciones: [''],
    motivo: [''],
  });

  protected readonly itemsDialogVisible = signal(false);
  protected readonly itemsLoading = signal(false);
  protected readonly itemsSaving = signal(false);
  protected readonly items = signal<ItemLote[]>([]);
  protected readonly editingItemId = signal<number | null>(null);
  private loteActivo: Lote | null = null;

  protected readonly itemForm = this.fb.nonNullable.group({
    descripcion_item: ['', Validators.required],
    id_unidad_medida: [null as number | null, Validators.required],
    cantidad_item_lote: [null as number | null, [Validators.required, Validators.min(0.01)]],
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    forkJoin({
      lotes: this.api.list(),
      transportes: this.transporteApi.list(),
      tiposLote: this.tipoLoteApi.list(),
      unidadesMedida: this.unidadMedidaApi.list(),
      estados: this.estadosApi.list(),
    }).subscribe({
      next: ({ lotes, transportes, tiposLote, unidadesMedida, estados }) => {
        this.lotes.set(lotes);
        this.transportes.set(transportes);
        this.tiposLote.set(tiposLote);
        this.unidadesMedida.set(unidadesMedida);
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

  openEdit(lote: Lote): void {
    this.editingId.set(lote.id_lote);
    this.form.setValue({
      fecha_lote: new Date(lote.fecha_lote),
      id_chofer: lote.id_chofer,
      id_camion: lote.id_camion,
      id_tipo_lote: lote.id_tipo_lote,
      id_estado: lote.id_estado,
      observaciones: lote.observaciones ?? '',
      motivo: lote.motivo ?? '',
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
      fecha_lote: raw.fecha_lote!.toISOString().slice(0, 10),
      id_chofer: raw.id_chofer!,
      id_camion: raw.id_camion!,
      id_tipo_lote: raw.id_tipo_lote!,
      id_estado: raw.id_estado!,
      ...(raw.observaciones ? { observaciones: raw.observaciones } : {}),
      ...(raw.motivo ? { motivo: raw.motivo } : {}),
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

  confirmDelete(lote: Lote): void {
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

  openItems(lote: Lote): void {
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

  editItem(item: ItemLote): void {
    this.editingItemId.set(item.id_item_lote);
    this.itemForm.setValue({
      descripcion_item: item.descripcion_item,
      id_unidad_medida: item.id_unidad_medida,
      cantidad_item_lote: item.cantidad_item_lote,
    });
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
    const dto = {
      descripcion_item: raw.descripcion_item,
      id_unidad_medida: raw.id_unidad_medida!,
      cantidad_item_lote: raw.cantidad_item_lote!,
    };
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

  removeItem(item: ItemLote): void {
    if (!this.loteActivo) {
      return;
    }
    this.itemsApi.remove(this.loteActivo.id_lote, item.id_item_lote).subscribe({
      next: () => this.loadItems(),
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el ítem' });
      },
    });
  }
}
