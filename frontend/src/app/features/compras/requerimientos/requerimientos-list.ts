import { Component, OnInit, inject, signal } from '@angular/core';
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
import { RequerimientosApiService } from '../../../core/api/requerimientos-api.service';
import { RequerimientoDetalleApiService } from '../../../core/api/requerimiento-detalle-api.service';
import { InsumosApiService } from '../../../core/api/insumos-api.service';
import { Requerimiento } from '../../../core/models/requerimiento.model';
import { RequerimientoDetalle } from '../../../core/models/requerimiento-detalle.model';
import { Insumo } from '../../../core/models/insumo.model';

interface ItemNuevo {
  id_insumo: number;
  codigo_insumo: string;
  nombre_insumo: string;
  cantidad: number;
}

@Component({
  selector: 'app-requerimientos-list',
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
  templateUrl: './requerimientos-list.html',
  styleUrl: './requerimientos-list.scss',
})
export class RequerimientosList implements OnInit {
  private readonly api = inject(RequerimientosApiService);
  private readonly detalleApi = inject(RequerimientoDetalleApiService);
  private readonly insumosApi = inject(InsumosApiService);
  private readonly fb = inject(FormBuilder);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  protected readonly requerimientos = signal<Requerimiento[]>([]);
  protected readonly insumos = signal<Insumo[]>([]);
  protected readonly loading = signal(false);

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    forkJoin({
      requerimientos: this.api.list(),
      insumos: this.insumosApi.list(),
    }).subscribe({
      next: ({ requerimientos, insumos }) => {
        this.requerimientos.set(requerimientos);
        this.insumos.set(insumos);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el listado' });
      },
    });
  }

  // ---- Nuevo requerimiento: formulario grande, se arma la lista de
  // insumos en memoria y recién se manda todo junto al presionar Guardar.
  // La fecha de carga y el estado los pone el sistema (no se piden acá).
  protected readonly createDialogVisible = signal(false);
  protected readonly creating = signal(false);
  protected readonly nuevosItems = signal<ItemNuevo[]>([]);

  protected readonly createForm = this.fb.nonNullable.group({
    fecha_necesidad: [null as Date | null, Validators.required],
    observaciones: [''],
  });

  protected readonly itemForm = this.fb.nonNullable.group({
    id_insumo: [null as number | null, Validators.required],
    cantidad: [null as number | null, [Validators.required, Validators.min(0.01)]],
  });

  openCreate(): void {
    this.createForm.reset();
    this.itemForm.reset();
    this.nuevosItems.set([]);
    this.createDialogVisible.set(true);
  }

  closeCreateDialog(): void {
    this.createDialogVisible.set(false);
  }

  agregarItemNuevo(): void {
    if (this.itemForm.invalid) {
      return;
    }
    const raw = this.itemForm.getRawValue();
    const insumo = this.insumos().find((i) => i.id_insumo === raw.id_insumo);
    if (!insumo) {
      return;
    }
    this.nuevosItems.update((items) => [
      ...items,
      { id_insumo: insumo.id_insumo, codigo_insumo: insumo.codigo_insumo, nombre_insumo: insumo.nombre_insumo, cantidad: raw.cantidad! },
    ]);
    this.itemForm.reset();
  }

  quitarItemNuevo(index: number): void {
    this.nuevosItems.update((items) => items.filter((_, i) => i !== index));
  }

  guardarRequerimiento(): void {
    if (this.createForm.invalid || this.nuevosItems().length === 0 || this.creating()) {
      if (this.nuevosItems().length === 0) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Faltan insumos',
          detail: 'Agregá al menos un insumo a la lista antes de guardar',
        });
      }
      return;
    }

    this.creating.set(true);
    const raw = this.createForm.getRawValue();
    this.api
      .create({
        fecha_necesidad: raw.fecha_necesidad!.toISOString().slice(0, 10),
        id_usuario: 1,
        ...(raw.observaciones ? { observaciones: raw.observaciones } : {}),
      })
      .subscribe({
        next: (requerimiento) => {
          forkJoin(
            this.nuevosItems().map((item) =>
              this.detalleApi.create(requerimiento.id_requerimiento, {
                id_insumo: item.id_insumo,
                cantidad: item.cantidad,
              }),
            ),
          ).subscribe({
            next: () => {
              this.creating.set(false);
              this.createDialogVisible.set(false);
              this.messageService.add({
                severity: 'success',
                summary: 'Enviado a compras',
                detail: 'El requerimiento se guardó correctamente',
              });
              this.load();
            },
            error: () => {
              this.creating.set(false);
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'El requerimiento se creó pero algunos insumos no se pudieron cargar. Completalos desde "Insumos".',
              });
              this.createDialogVisible.set(false);
              this.load();
            },
          });
        },
        error: () => {
          this.creating.set(false);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el requerimiento' });
        },
      });
  }

  // ---- Editar campos básicos de un requerimiento ya cargado (fecha de
  // necesidad y observaciones). El estado y la fecha de carga los maneja
  // el sistema y no se editan acá.
  protected readonly editDialogVisible = signal(false);
  protected readonly saving = signal(false);
  protected readonly editingId = signal<number | null>(null);

  protected readonly editForm = this.fb.nonNullable.group({
    fecha_necesidad: [null as Date | null, Validators.required],
    observaciones: [''],
  });

  openEdit(requerimiento: Requerimiento): void {
    this.editingId.set(requerimiento.id_requerimiento);
    this.editForm.setValue({
      fecha_necesidad: new Date(requerimiento.fecha_necesidad),
      observaciones: requerimiento.observaciones ?? '',
    });
    this.editDialogVisible.set(true);
  }

  closeEditDialog(): void {
    this.editDialogVisible.set(false);
  }

  saveEdit(): void {
    const id = this.editingId();
    if (this.editForm.invalid || this.saving() || !id) {
      return;
    }

    this.saving.set(true);
    const raw = this.editForm.getRawValue();
    this.api
      .update(id, {
        fecha_necesidad: raw.fecha_necesidad!.toISOString().slice(0, 10),
        ...(raw.observaciones ? { observaciones: raw.observaciones } : {}),
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.editDialogVisible.set(false);
          this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Se guardó correctamente' });
          this.load();
        },
        error: () => {
          this.saving.set(false);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar' });
        },
      });
  }

  confirmDelete(requerimiento: Requerimiento): void {
    this.confirmationService.confirm({
      header: 'Confirmar eliminación',
      message: `¿Eliminar el requerimiento #${requerimiento.id_requerimiento}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { severity: 'danger', label: 'Eliminar' },
      rejectButtonProps: { severity: 'secondary', label: 'Cancelar', outlined: true },
      accept: () => this.remove(requerimiento.id_requerimiento),
    });
  }

  private remove(id: number): void {
    this.api.remove(id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Requerimiento eliminado' });
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

  // ---- Insumos de un requerimiento ya cargado: acá cada alta/baja se
  // guarda al toque (a diferencia de la lista en memoria del alta nueva),
  // porque el requerimiento ya existe.
  protected readonly detalleDialogVisible = signal(false);
  protected readonly detalleLoading = signal(false);
  protected readonly detalleSaving = signal(false);
  protected readonly detalle = signal<RequerimientoDetalle[]>([]);
  protected readonly editingDetalleId = signal<number | null>(null);
  private requerimientoActivo: Requerimiento | null = null;

  protected readonly detalleForm = this.fb.nonNullable.group({
    id_insumo: [null as number | null, Validators.required],
    cantidad: [null as number | null, [Validators.required, Validators.min(0.01)]],
  });

  openDetalle(requerimiento: Requerimiento): void {
    this.requerimientoActivo = requerimiento;
    this.editingDetalleId.set(null);
    this.detalleForm.reset();
    this.detalleDialogVisible.set(true);
    this.loadDetalle();
  }

  private loadDetalle(): void {
    if (!this.requerimientoActivo) {
      return;
    }
    this.detalleLoading.set(true);
    this.detalleApi.list(this.requerimientoActivo.id_requerimiento).subscribe({
      next: (data) => {
        this.detalle.set(data);
        this.detalleLoading.set(false);
      },
      error: () => {
        this.detalleLoading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las líneas' });
      },
    });
  }

  editDetalle(linea: RequerimientoDetalle): void {
    this.editingDetalleId.set(linea.id_requerimiento_detalle);
    this.detalleForm.setValue({ id_insumo: linea.id_insumo, cantidad: linea.cantidad });
  }

  cancelDetalleEdit(): void {
    this.editingDetalleId.set(null);
    this.detalleForm.reset();
  }

  saveDetalle(): void {
    if (this.detalleForm.invalid || this.detalleSaving() || !this.requerimientoActivo) {
      return;
    }

    this.detalleSaving.set(true);
    const raw = this.detalleForm.getRawValue();
    const dto = { id_insumo: raw.id_insumo!, cantidad: raw.cantidad! };
    const idDetalle = this.editingDetalleId();
    const request$ = idDetalle
      ? this.detalleApi.update(this.requerimientoActivo.id_requerimiento, idDetalle, dto)
      : this.detalleApi.create(this.requerimientoActivo.id_requerimiento, dto);

    request$.subscribe({
      next: () => {
        this.detalleSaving.set(false);
        this.cancelDetalleEdit();
        this.loadDetalle();
      },
      error: () => {
        this.detalleSaving.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la línea' });
      },
    });
  }

  removeDetalle(linea: RequerimientoDetalle): void {
    if (!this.requerimientoActivo) {
      return;
    }
    this.detalleApi.remove(this.requerimientoActivo.id_requerimiento, linea.id_requerimiento_detalle).subscribe({
      next: () => this.loadDetalle(),
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la línea' });
      },
    });
  }
}
