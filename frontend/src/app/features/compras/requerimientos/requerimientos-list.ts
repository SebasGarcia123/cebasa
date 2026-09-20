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
import { EstadosApiService } from '../../../core/api/estados-api.service';
import { InsumosApiService } from '../../../core/api/insumos-api.service';
import { Requerimiento } from '../../../core/models/requerimiento.model';
import { RequerimientoDetalle } from '../../../core/models/requerimiento-detalle.model';
import { Estado } from '../../../core/models/estado.model';
import { Insumo } from '../../../core/models/insumo.model';

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
  private readonly estadosApi = inject(EstadosApiService);
  private readonly insumosApi = inject(InsumosApiService);
  private readonly fb = inject(FormBuilder);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  protected readonly requerimientos = signal<Requerimiento[]>([]);
  protected readonly estados = signal<Estado[]>([]);
  protected readonly insumos = signal<Insumo[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly dialogVisible = signal(false);
  protected readonly editingId = signal<number | null>(null);

  // id_usuario: quien solicita. Por ahora se fija a 1 (usuario de prueba);
  // cuando haya un selector de "usuario actual" real, se reemplaza por el
  // id de la sesión.
  protected readonly form = this.fb.nonNullable.group({
    fecha_carga: [null as Date | null, Validators.required],
    fecha_necesidad: [null as Date | null, Validators.required],
    observaciones: [''],
    id_estado: [null as number | null, Validators.required],
  });

  // Diálogo de detalle (líneas de insumos requeridos)
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

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    forkJoin({
      requerimientos: this.api.list(),
      estados: this.estadosApi.list(),
      insumos: this.insumosApi.list(),
    }).subscribe({
      next: ({ requerimientos, estados, insumos }) => {
        this.requerimientos.set(requerimientos);
        this.estados.set(estados);
        this.insumos.set(insumos);
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

  openEdit(requerimiento: Requerimiento): void {
    this.editingId.set(requerimiento.id_requerimiento);
    this.form.setValue({
      fecha_carga: new Date(requerimiento.fecha_carga),
      fecha_necesidad: new Date(requerimiento.fecha_necesidad),
      observaciones: requerimiento.observaciones ?? '',
      id_estado: requerimiento.id_estado,
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
      id_estado: raw.id_estado!,
      id_usuario: 1,
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
