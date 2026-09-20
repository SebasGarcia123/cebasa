import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { catchError, forkJoin, of } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CotizacionesApiService } from '../../../core/api/cotizaciones-api.service';
import { CotizacionDetalleApiService } from '../../../core/api/cotizacion-detalle-api.service';
import { RequerimientoDetalleApiService } from '../../../core/api/requerimiento-detalle-api.service';
import { ProveedoresApiService } from '../../../core/api/proveedores-api.service';
import { EstadosApiService } from '../../../core/api/estados-api.service';
import { RequerimientosApiService } from '../../../core/api/requerimientos-api.service';
import { Cotizacion } from '../../../core/models/cotizacion.model';
import { CotizacionDetalle } from '../../../core/models/cotizacion-detalle.model';
import { RequerimientoDetalle } from '../../../core/models/requerimiento-detalle.model';
import { Proveedor } from '../../../core/models/proveedor.model';
import { Estado } from '../../../core/models/estado.model';
import { Requerimiento } from '../../../core/models/requerimiento.model';

@Component({
  selector: 'app-cotizaciones-list',
  imports: [
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    SelectModule,
    DatePickerModule,
    InputNumberModule,
    TooltipModule,
  ],
  templateUrl: './cotizaciones-list.html',
  styleUrl: './cotizaciones-list.scss',
})
export class CotizacionesList implements OnInit {
  private readonly api = inject(CotizacionesApiService);
  private readonly detalleApi = inject(CotizacionDetalleApiService);
  private readonly requerimientoDetalleApi = inject(RequerimientoDetalleApiService);
  private readonly proveedoresApi = inject(ProveedoresApiService);
  private readonly estadosApi = inject(EstadosApiService);
  private readonly requerimientosApi = inject(RequerimientosApiService);
  private readonly fb = inject(FormBuilder);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  protected readonly cotizaciones = signal<Cotizacion[]>([]);
  protected readonly proveedores = signal<Proveedor[]>([]);
  protected readonly estados = signal<Estado[]>([]);
  protected readonly requerimientos = signal<Requerimiento[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly dialogVisible = signal(false);
  protected readonly editingId = signal<number | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    id_proveedor: [null as number | null, Validators.required],
    fecha_cotizacion: [null as Date | null, Validators.required],
    id_estado: [null as number | null, Validators.required],
  });

  // Diálogo de detalle (líneas cotizadas). id_requerimiento es un campo
  // auxiliar solo para filtrar el segundo select (no se manda al backend):
  // cada línea cotizada apunta a una línea puntual de un requerimiento.
  protected readonly detalleDialogVisible = signal(false);
  protected readonly detalleLoading = signal(false);
  protected readonly detalleSaving = signal(false);
  protected readonly detalle = signal<CotizacionDetalle[]>([]);
  // Cotizacion-detalle solo trae requerimiento_detalle "plano" (sin el
  // insumo anidado); para mostrar el nombre del insumo en la tabla se
  // completa esta tabla auxiliar id_requerimiento_detalle -> nombre_insumo.
  protected readonly nombreInsumoPorLinea = signal<Map<number, string>>(new Map());
  protected readonly lineasDisponibles = signal<RequerimientoDetalle[]>([]);
  protected readonly lineasLoading = signal(false);
  protected readonly editingDetalleId = signal<number | null>(null);
  private cotizacionActiva: Cotizacion | null = null;

  protected readonly detalleForm = this.fb.nonNullable.group({
    id_requerimiento: [null as number | null, Validators.required],
    id_requerimiento_detalle: [null as number | null, Validators.required],
    cantidad: [null as number | null, [Validators.required, Validators.min(0.01)]],
    precio_cotizado: [null as number | null, [Validators.required, Validators.min(0)]],
  });

  ngOnInit(): void {
    this.load();

    this.detalleForm.controls.id_requerimiento.valueChanges.subscribe((idRequerimiento) => {
      this.detalleForm.controls.id_requerimiento_detalle.setValue(null);
      this.lineasDisponibles.set([]);
      if (!idRequerimiento) {
        return;
      }
      this.lineasLoading.set(true);
      this.requerimientoDetalleApi.list(idRequerimiento).subscribe({
        next: (data) => {
          this.lineasDisponibles.set(data);
          this.lineasLoading.set(false);
        },
        error: () => {
          this.lineasLoading.set(false);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las líneas del requerimiento' });
        },
      });
    });
  }

  private load(): void {
    this.loading.set(true);
    forkJoin({
      cotizaciones: this.api.list(),
      proveedores: this.proveedoresApi.list(),
      estados: this.estadosApi.list(),
      requerimientos: this.requerimientosApi.list(),
    }).subscribe({
      next: ({ cotizaciones, proveedores, estados, requerimientos }) => {
        this.cotizaciones.set(cotizaciones);
        this.proveedores.set(proveedores);
        this.estados.set(estados);
        this.requerimientos.set(requerimientos);
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

  openEdit(cotizacion: Cotizacion): void {
    this.editingId.set(cotizacion.id_cotizacion);
    this.form.setValue({
      id_proveedor: cotizacion.id_proveedor,
      fecha_cotizacion: new Date(cotizacion.fecha_cotizacion),
      id_estado: cotizacion.id_estado,
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
      id_proveedor: raw.id_proveedor!,
      fecha_cotizacion: raw.fecha_cotizacion!.toISOString().slice(0, 10),
      id_estado: raw.id_estado!,
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

  confirmDelete(cotizacion: Cotizacion): void {
    this.confirmationService.confirm({
      header: 'Confirmar eliminación',
      message: `¿Eliminar la cotización #${cotizacion.id_cotizacion}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { severity: 'danger', label: 'Eliminar' },
      rejectButtonProps: { severity: 'secondary', label: 'Cancelar', outlined: true },
      accept: () => this.remove(cotizacion.id_cotizacion),
    });
  }

  private remove(id: number): void {
    this.api.remove(id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Cotización eliminada' });
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

  openDetalle(cotizacion: Cotizacion): void {
    this.cotizacionActiva = cotizacion;
    this.editingDetalleId.set(null);
    this.detalleForm.reset();
    this.lineasDisponibles.set([]);
    this.detalleDialogVisible.set(true);
    this.loadDetalle();
  }

  private loadDetalle(): void {
    if (!this.cotizacionActiva) {
      return;
    }
    this.detalleLoading.set(true);
    this.detalleApi.list(this.cotizacionActiva.id_cotizacion).subscribe({
      next: (data) => {
        this.detalle.set(data);
        this.detalleLoading.set(false);
        this.cargarNombresInsumo(data);
      },
      error: () => {
        this.detalleLoading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las líneas' });
      },
    });
  }

  private cargarNombresInsumo(lineas: CotizacionDetalle[]): void {
    const idsRequerimiento = [
      ...new Set(lineas.map((l) => l.requerimiento_detalle?.id_requerimiento).filter((id): id is number => !!id)),
    ];
    if (idsRequerimiento.length === 0) {
      return;
    }
    forkJoin(
      idsRequerimiento.map((id) => this.requerimientoDetalleApi.list(id).pipe(catchError(() => of([])))),
    ).subscribe((resultados) => {
      const mapa = new Map<number, string>();
      for (const lineasReq of resultados) {
        for (const linea of lineasReq) {
          mapa.set(linea.id_requerimiento_detalle, linea.insumo?.nombre_insumo ?? '—');
        }
      }
      this.nombreInsumoPorLinea.set(mapa);
    });
  }

  editDetalle(linea: CotizacionDetalle): void {
    this.editingDetalleId.set(linea.id_cotizacion_detalle);
    this.detalleForm.setValue({
      id_requerimiento: linea.requerimiento_detalle?.id_requerimiento ?? null,
      id_requerimiento_detalle: linea.id_requerimiento_detalle,
      cantidad: linea.cantidad,
      precio_cotizado: linea.precio_cotizado,
    });
  }

  cancelDetalleEdit(): void {
    this.editingDetalleId.set(null);
    this.detalleForm.reset();
    this.lineasDisponibles.set([]);
  }

  saveDetalle(): void {
    if (this.detalleForm.invalid || this.detalleSaving() || !this.cotizacionActiva) {
      return;
    }

    this.detalleSaving.set(true);
    const raw = this.detalleForm.getRawValue();
    const dto = {
      id_requerimiento_detalle: raw.id_requerimiento_detalle!,
      cantidad: raw.cantidad!,
      precio_cotizado: raw.precio_cotizado!,
    };
    const idDetalle = this.editingDetalleId();
    const request$ = idDetalle
      ? this.detalleApi.update(this.cotizacionActiva.id_cotizacion, idDetalle, dto)
      : this.detalleApi.create(this.cotizacionActiva.id_cotizacion, dto);

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

  removeDetalle(linea: CotizacionDetalle): void {
    if (!this.cotizacionActiva) {
      return;
    }
    this.detalleApi.remove(this.cotizacionActiva.id_cotizacion, linea.id_cotizacion_detalle).subscribe({
      next: () => this.loadDetalle(),
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la línea' });
      },
    });
  }
}
