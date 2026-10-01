import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { LotesApiService } from '../../../core/api/lotes-api.service';
import { ItemLoteApiService, ItemLoteDto } from '../../../core/api/item-lote-api.service';
import { TransporteApiService } from '../../../core/api/transporte-api.service';
import { TipoLoteApiService } from '../../../core/api/tipo-lote-api.service';
import { DepositosApiService } from '../../../core/api/depositos-api.service';
import { ProductosApiService } from '../../../core/api/productos-api.service';
import { InsumosApiService } from '../../../core/api/insumos-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Lote } from '../../../core/models/lote.model';
import { ItemLote } from '../../../core/models/item-lote.model';
import { Transporte } from '../../../core/models/transporte.model';
import { TipoLote } from '../../../core/models/tipo-lote.model';
import { Deposito } from '../../../core/models/deposito.model';
import { Producto } from '../../../core/models/producto.model';
import { Insumo } from '../../../core/models/insumo.model';

const TIPO_INTERPLANTA = 'Interplanta';
const ESTADO_PENDIENTE = 'Pendiente';
const ESTADO_PENDIENTE_APROBACION = 'Pendiente de aprobación';
const ESTADO_RECHAZADO = 'Rechazado';

type TipoItem = 'producto' | 'insumo';

@Component({
  selector: 'app-lotes-list',
  imports: [
    DatePipe,
    DecimalPipe,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    DatePickerModule,
    InputNumberModule,
    TextareaModule,
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
  private readonly depositosApi = inject(DepositosApiService);
  private readonly productosApi = inject(ProductosApiService);
  private readonly insumosApi = inject(InsumosApiService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  protected readonly lotes = signal<Lote[]>([]);
  protected readonly transportes = signal<Transporte[]>([]);
  protected readonly tiposLote = signal<TipoLote[]>([]);
  protected readonly depositos = signal<Deposito[]>([]);
  protected readonly productos = signal<Producto[]>([]);
  protected readonly insumos = signal<Insumo[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly dialogVisible = signal(false);
  protected readonly editingId = signal<number | null>(null);

  protected readonly choferes = computed(() =>
    this.transportes().flatMap((t) => (t.chofer ?? []).map((c) => ({ ...c, transporteNombre: t.nombre_transporte }))),
  );
  protected readonly camiones = computed(() =>
    this.transportes().flatMap((t) => (t.camion ?? []).map((c) => ({ ...c, transporteNombre: t.nombre_transporte }))),
  );

  protected readonly puedeAprobar = computed(() => {
    const user = this.authService.currentUser();
    return !!user && (user.es_administrador || user.permisos.includes('logistica.lotes.aprobar'));
  });

  protected readonly puedeOperar = computed(() => {
    const user = this.authService.currentUser();
    return !!user && (user.es_administrador || user.permisos.includes('logistica.lotes.editar'));
  });

  protected readonly form = this.fb.nonNullable.group({
    fecha_lote: [null as Date | null, Validators.required],
    id_chofer: [null as number | null, Validators.required],
    id_camion: [null as number | null, Validators.required],
    id_tipo_lote: [null as number | null, Validators.required],
    id_deposito_origen: [null as number | null],
    id_deposito_destino: [null as number | null],
    observaciones: [''],
  });

  // form.controls.id_tipo_lote.value no es una signal: leerlo dentro de
  // un computed() no crea ninguna dependencia reactiva, así que el
  // computed nunca se volvería a evaluar al cambiar el select. Se
  // convierte valueChanges a signal con toSignal() para que sí lo haga.
  private readonly idTipoLoteSeleccionado = toSignal(this.form.controls.id_tipo_lote.valueChanges, {
    initialValue: null as number | null,
  });

  // Solo se piden depósitos de origen/destino cuando el tipo elegido es
  // Interplanta (el resto de tipo_lote no los necesita).
  protected readonly tipoLoteEsInterplanta = computed(() => {
    const id = this.idTipoLoteSeleccionado();
    return this.tiposLote().find((t) => t.id_tipo_lote === id)?.descripcion_lote === TIPO_INTERPLANTA;
  });

  protected readonly itemsDialogVisible = signal(false);
  protected readonly itemsLoading = signal(false);
  protected readonly itemsSaving = signal(false);
  protected readonly accionSaving = signal(false);
  protected readonly items = signal<ItemLote[]>([]);
  protected readonly editingItemId = signal<number | null>(null);
  protected readonly loteActivo = signal<Lote | null>(null);

  protected readonly loteEditable = computed(() => {
    const estado = this.loteActivo()?.estados?.nombreEstado;
    return this.puedeOperar() && (estado === ESTADO_PENDIENTE || estado === ESTADO_RECHAZADO);
  });
  protected readonly loteEnRevision = computed(() => this.loteActivo()?.estados?.nombreEstado === ESTADO_PENDIENTE_APROBACION);

  protected readonly tipoItemSeleccionado = signal<TipoItem>('producto');
  protected readonly itemForm = this.fb.nonNullable.group({
    id_producto: [null as number | null],
    id_insumo: [null as number | null],
    cantidad: [null as number | null, [Validators.required, Validators.min(0.01)]],
  });

  protected readonly rechazoDialogVisible = signal(false);
  protected readonly rechazoForm = this.fb.nonNullable.group({
    motivo_rechazo: ['', [Validators.required, Validators.maxLength(255)]],
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
      depositos: this.depositosApi.list(),
      productos: this.productosApi.list(),
      insumos: this.insumosApi.list(),
    }).subscribe({
      next: ({ lotes, transportes, tiposLote, depositos, productos, insumos }) => {
        this.lotes.set(lotes);
        this.transportes.set(transportes);
        this.tiposLote.set(tiposLote);
        this.depositos.set(depositos);
        this.productos.set(productos);
        this.insumos.set(insumos);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el listado' });
      },
    });
  }

  protected puedeEditar(lote: Lote): boolean {
    return (
      this.puedeOperar() &&
      (lote.estados?.nombreEstado === ESTADO_PENDIENTE || lote.estados?.nombreEstado === ESTADO_RECHAZADO)
    );
  }

  protected puedeDespachar(lote: Lote): boolean {
    return lote.estados?.nombreEstado === ESTADO_PENDIENTE;
  }

  protected puedeEliminar(lote: Lote): boolean {
    return lote.estados?.nombreEstado === ESTADO_PENDIENTE;
  }

  protected puedeRevisar(lote: Lote): boolean {
    return this.puedeAprobar() && lote.estados?.nombreEstado === ESTADO_PENDIENTE_APROBACION;
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
      id_deposito_origen: lote.id_deposito_origen,
      id_deposito_destino: lote.id_deposito_destino,
      observaciones: lote.observaciones ?? '',
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
    if (this.tipoLoteEsInterplanta() && (!this.form.value.id_deposito_origen || !this.form.value.id_deposito_destino)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Faltan datos',
        detail: 'Un lote Interplanta necesita depósito de origen y de destino',
      });
      return;
    }

    this.saving.set(true);
    const raw = this.form.getRawValue();
    const dto = {
      fecha_lote: raw.fecha_lote!.toISOString().slice(0, 10),
      id_chofer: raw.id_chofer!,
      id_camion: raw.id_camion!,
      id_tipo_lote: raw.id_tipo_lote!,
      ...(raw.id_deposito_origen ? { id_deposito_origen: raw.id_deposito_origen } : {}),
      ...(raw.id_deposito_destino ? { id_deposito_destino: raw.id_deposito_destino } : {}),
      ...(raw.observaciones ? { observaciones: raw.observaciones } : {}),
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
      error: (error: HttpErrorResponse) => this.onAccionError(error, 'No se pudo guardar', () => this.saving.set(false)),
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

  confirmDespachar(lote: Lote): void {
    this.confirmationService.confirm({
      header: 'Confirmar despacho',
      message: `¿Despachar el lote #${lote.id_lote}? Una vez despachado no se puede editar hasta que se revise.`,
      icon: 'pi pi-send',
      acceptButtonProps: { label: 'Despachar' },
      rejectButtonProps: { severity: 'secondary', label: 'Cancelar', outlined: true },
      accept: () => {
        this.api.despachar(lote.id_lote).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Despachado', detail: 'El lote fue despachado' });
            this.load();
          },
          error: (error: HttpErrorResponse) => this.onAccionError(error, 'No se pudo despachar el lote'),
        });
      },
    });
  }

  verPdf(lote: Lote): void {
    this.api.pdf(lote.id_lote).subscribe({
      next: (pdf) => window.open(URL.createObjectURL(pdf), '_blank'),
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo abrir el PDF' });
      },
    });
  }

  // Ítems / revisión (mismo diálogo sirve para editar ítems cuando el
  // lote está Pendiente/Rechazado, y para revisar+aprobar/rechazar
  // cuando está Pendiente de aprobación.
  openDetalle(lote: Lote): void {
    this.loteActivo.set(lote);
    this.editingItemId.set(null);
    this.itemForm.reset();
    this.tipoItemSeleccionado.set('producto');
    this.itemsDialogVisible.set(true);
    this.loadItems();
  }

  private loadItems(): void {
    const lote = this.loteActivo();
    if (!lote) {
      return;
    }
    this.itemsLoading.set(true);
    this.itemsApi.list(lote.id_lote).subscribe({
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

  protected seleccionarTipoItem(tipo: TipoItem): void {
    this.tipoItemSeleccionado.set(tipo);
    this.itemForm.reset();
  }

  editItem(item: ItemLote): void {
    this.editingItemId.set(item.id_item_lote);
    this.tipoItemSeleccionado.set(item.id_producto != null ? 'producto' : 'insumo');
    this.itemForm.setValue({
      id_producto: item.id_producto,
      id_insumo: item.id_insumo,
      cantidad: Number(item.cantidad),
    });
  }

  cancelItemEdit(): void {
    this.editingItemId.set(null);
    this.itemForm.reset();
    this.tipoItemSeleccionado.set('producto');
  }

  saveItem(): void {
    const lote = this.loteActivo();
    if (this.itemForm.invalid || this.itemsSaving() || !lote) {
      return;
    }
    const raw = this.itemForm.getRawValue();
    const tipo = this.tipoItemSeleccionado();
    if ((tipo === 'producto' && !raw.id_producto) || (tipo === 'insumo' && !raw.id_insumo)) {
      this.messageService.add({ severity: 'warn', summary: 'Faltan datos', detail: 'Elegí un producto o insumo' });
      return;
    }

    this.itemsSaving.set(true);
    const dto: ItemLoteDto =
      tipo === 'producto' ? { id_producto: raw.id_producto!, cantidad: raw.cantidad! } : { id_insumo: raw.id_insumo!, cantidad: raw.cantidad! };
    const idItem = this.editingItemId();
    const request$ = idItem ? this.itemsApi.update(lote.id_lote, idItem, dto) : this.itemsApi.create(lote.id_lote, dto);

    request$.subscribe({
      next: () => {
        this.itemsSaving.set(false);
        this.cancelItemEdit();
        this.loadItems();
      },
      error: (error: HttpErrorResponse) => this.onAccionError(error, 'No se pudo guardar el ítem', () => this.itemsSaving.set(false)),
    });
  }

  removeItem(item: ItemLote): void {
    const lote = this.loteActivo();
    if (!lote) {
      return;
    }
    this.itemsApi.remove(lote.id_lote, item.id_item_lote).subscribe({
      next: () => this.loadItems(),
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el ítem' });
      },
    });
  }

  confirmAprobar(): void {
    const lote = this.loteActivo();
    if (!lote || this.accionSaving()) {
      return;
    }
    this.confirmationService.confirm({
      header: 'Confirmar aprobación',
      message: `¿Aprobar el lote #${lote.id_lote}? El stock se trasladará entre depósitos.`,
      icon: 'pi pi-check-circle',
      acceptButtonProps: { label: 'Aprobar' },
      rejectButtonProps: { severity: 'secondary', label: 'Cancelar', outlined: true },
      accept: () => {
        this.accionSaving.set(true);
        this.api.aprobar(lote.id_lote).subscribe({
          next: () => {
            this.accionSaving.set(false);
            this.itemsDialogVisible.set(false);
            this.messageService.add({ severity: 'success', summary: 'Aprobado', detail: 'El lote fue aprobado y el stock trasladado' });
            this.load();
          },
          error: (error: HttpErrorResponse) => this.onAccionError(error, 'No se pudo aprobar el lote', () => this.accionSaving.set(false)),
        });
      },
    });
  }

  abrirRechazo(): void {
    this.rechazoForm.reset();
    this.rechazoDialogVisible.set(true);
  }

  cerrarRechazo(): void {
    this.rechazoDialogVisible.set(false);
  }

  confirmarRechazo(): void {
    const lote = this.loteActivo();
    if (!lote || this.rechazoForm.invalid || this.accionSaving()) {
      return;
    }
    this.accionSaving.set(true);
    this.api.rechazar(lote.id_lote, this.rechazoForm.getRawValue()).subscribe({
      next: () => {
        this.accionSaving.set(false);
        this.rechazoDialogVisible.set(false);
        this.itemsDialogVisible.set(false);
        this.messageService.add({ severity: 'success', summary: 'Rechazado', detail: 'El lote fue rechazado' });
        this.load();
      },
      error: (error: HttpErrorResponse) => this.onAccionError(error, 'No se pudo rechazar el lote', () => this.accionSaving.set(false)),
    });
  }

  private onAccionError(error: HttpErrorResponse, fallback: string, onDone?: () => void): void {
    onDone?.();
    const detail = typeof error.error?.message === 'string' ? error.error.message : fallback;
    this.messageService.add({ severity: 'error', summary: 'Error', detail });
  }
}
