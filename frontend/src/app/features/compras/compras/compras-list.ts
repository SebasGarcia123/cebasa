import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
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
import { ComprasApiService } from '../../../core/api/compras-api.service';
import { CompraDetalleApiService } from '../../../core/api/compra-detalle-api.service';
import { RequerimientoDetalleApiService } from '../../../core/api/requerimiento-detalle-api.service';
import { ProveedoresApiService } from '../../../core/api/proveedores-api.service';
import { EstadosApiService } from '../../../core/api/estados-api.service';
import { RequerimientosApiService } from '../../../core/api/requerimientos-api.service';
import { ArchivoAdjuntoApiService } from '../../../core/api/archivo-adjunto-api.service';
import { Compra } from '../../../core/models/compra.model';
import { CompraDetalle } from '../../../core/models/compra-detalle.model';
import { RequerimientoDetalle } from '../../../core/models/requerimiento-detalle.model';
import { Proveedor } from '../../../core/models/proveedor.model';
import { Estado } from '../../../core/models/estado.model';
import { Requerimiento } from '../../../core/models/requerimiento.model';
import { ArchivoAdjunto } from '../../../core/models/archivo-adjunto.model';

@Component({
  selector: 'app-compras-list',
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
  templateUrl: './compras-list.html',
  styleUrl: './compras-list.scss',
})
export class ComprasList implements OnInit {
  private readonly api = inject(ComprasApiService);
  private readonly detalleApi = inject(CompraDetalleApiService);
  private readonly requerimientoDetalleApi = inject(RequerimientoDetalleApiService);
  private readonly proveedoresApi = inject(ProveedoresApiService);
  private readonly estadosApi = inject(EstadosApiService);
  private readonly requerimientosApi = inject(RequerimientosApiService);
  private readonly archivoAdjuntoApi = inject(ArchivoAdjuntoApiService);
  private readonly fb = inject(FormBuilder);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  protected readonly compras = signal<Compra[]>([]);
  protected readonly proveedores = signal<Proveedor[]>([]);
  protected readonly estados = signal<Estado[]>([]);
  protected readonly requerimientos = signal<Requerimiento[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly dialogVisible = signal(false);
  protected readonly editingId = signal<number | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    id_proveedor: [null as number | null, Validators.required],
    fecha_compra: [null as Date | null, Validators.required],
    id_estado: [null as number | null, Validators.required],
    id_archivo_adjunto: [null as number | null],
  });

  // Adjunto (foto o PDF) que documenta la cotización que dio origen a la
  // compra. Se sube apenas se elige el archivo (no se espera a "Guardar"),
  // así el id ya está disponible para mandarlo junto con el resto del form.
  protected readonly archivoActual = signal<ArchivoAdjunto | null>(null);
  protected readonly archivoUploading = signal(false);

  // Diálogo de detalle (líneas compradas). id_requerimiento es un campo
  // auxiliar solo para filtrar el segundo select (no se manda al backend);
  // id_insumo se completa solo a partir de la línea de requerimiento
  // elegida (compra_detalle lo exige aparte por esquema, pero siempre
  // tiene que coincidir con el insumo de esa línea).
  protected readonly detalleDialogVisible = signal(false);
  protected readonly detalleLoading = signal(false);
  protected readonly detalleSaving = signal(false);
  protected readonly detalle = signal<CompraDetalle[]>([]);
  protected readonly lineasDisponibles = signal<RequerimientoDetalle[]>([]);
  protected readonly lineasLoading = signal(false);
  protected readonly editingDetalleId = signal<number | null>(null);
  private compraActiva: Compra | null = null;

  protected readonly detalleForm = this.fb.nonNullable.group({
    id_requerimiento: [null as number | null, Validators.required],
    id_requerimiento_detalle: [null as number | null, Validators.required],
    cantidad: [null as number | null, [Validators.required, Validators.min(0.01)]],
    precio_compra: [null as number | null, [Validators.required, Validators.min(0)]],
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
      compras: this.api.list(),
      proveedores: this.proveedoresApi.list(),
      estados: this.estadosApi.list(),
      requerimientos: this.requerimientosApi.list(),
    }).subscribe({
      next: ({ compras, proveedores, estados, requerimientos }) => {
        this.compras.set(compras);
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
    this.archivoActual.set(null);
    this.dialogVisible.set(true);
  }

  openEdit(compra: Compra): void {
    this.editingId.set(compra.id_compra);
    this.form.setValue({
      id_proveedor: compra.id_proveedor,
      fecha_compra: new Date(compra.fecha_compra),
      id_estado: compra.id_estado,
      id_archivo_adjunto: compra.id_archivo_adjunto,
    });
    this.archivoActual.set(compra.archivo_adjunto ?? null);
    this.dialogVisible.set(true);
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
  }

  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }

    const anterior = this.archivoActual();
    this.archivoUploading.set(true);
    this.archivoAdjuntoApi.upload(file).subscribe({
      next: (archivo) => {
        this.archivoUploading.set(false);
        this.archivoActual.set(archivo);
        this.form.controls.id_archivo_adjunto.setValue(archivo.id_archivo_adjunto);
        if (anterior) {
          this.archivoAdjuntoApi.remove(anterior.id_archivo_adjunto).subscribe();
        }
      },
      error: () => {
        this.archivoUploading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo subir el archivo' });
      },
    });
  }

  quitarArchivo(): void {
    const actual = this.archivoActual();
    this.archivoActual.set(null);
    this.form.controls.id_archivo_adjunto.setValue(null);
    if (actual) {
      this.archivoAdjuntoApi.remove(actual.id_archivo_adjunto).subscribe();
    }
  }

  verArchivoUrl(): string | null {
    const archivo = this.archivoActual();
    return archivo ? this.archivoAdjuntoApi.fileUrl(archivo.id_archivo_adjunto) : null;
  }

  save(): void {
    if (this.form.invalid || this.saving()) {
      return;
    }

    this.saving.set(true);
    const raw = this.form.getRawValue();
    const dto = {
      id_proveedor: raw.id_proveedor!,
      fecha_compra: raw.fecha_compra!.toISOString().slice(0, 10),
      id_estado: raw.id_estado!,
      ...(raw.id_archivo_adjunto ? { id_archivo_adjunto: raw.id_archivo_adjunto } : {}),
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

  confirmDelete(compra: Compra): void {
    this.confirmationService.confirm({
      header: 'Confirmar eliminación',
      message: `¿Eliminar la compra #${compra.id_compra}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { severity: 'danger', label: 'Eliminar' },
      rejectButtonProps: { severity: 'secondary', label: 'Cancelar', outlined: true },
      accept: () => this.remove(compra.id_compra),
    });
  }

  private remove(id: number): void {
    this.api.remove(id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Compra eliminada' });
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

  openDetalle(compra: Compra): void {
    this.compraActiva = compra;
    this.editingDetalleId.set(null);
    this.detalleForm.reset();
    this.lineasDisponibles.set([]);
    this.detalleDialogVisible.set(true);
    this.loadDetalle();
  }

  private loadDetalle(): void {
    if (!this.compraActiva) {
      return;
    }
    this.detalleLoading.set(true);
    this.detalleApi.list(this.compraActiva.id_compra).subscribe({
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

  editDetalle(linea: CompraDetalle): void {
    this.editingDetalleId.set(linea.id_compra_detalle);
    this.detalleForm.setValue({
      id_requerimiento: linea.requerimiento_detalle?.id_requerimiento ?? null,
      id_requerimiento_detalle: linea.id_requerimiento_detalle,
      cantidad: linea.cantidad,
      precio_compra: linea.precio_compra,
    });
  }

  cancelDetalleEdit(): void {
    this.editingDetalleId.set(null);
    this.detalleForm.reset();
    this.lineasDisponibles.set([]);
  }

  saveDetalle(): void {
    if (this.detalleForm.invalid || this.detalleSaving() || !this.compraActiva) {
      return;
    }

    const idRequerimientoDetalle = this.detalleForm.getRawValue().id_requerimiento_detalle!;
    const lineaSeleccionada = this.lineasDisponibles().find(
      (l) => l.id_requerimiento_detalle === idRequerimientoDetalle,
    );
    if (!lineaSeleccionada?.id_insumo) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo determinar el insumo de la línea seleccionada',
      });
      return;
    }

    this.detalleSaving.set(true);
    const raw = this.detalleForm.getRawValue();
    const dto = {
      id_requerimiento_detalle: idRequerimientoDetalle,
      id_insumo: lineaSeleccionada.id_insumo,
      cantidad: raw.cantidad!,
      precio_compra: raw.precio_compra!,
    };
    const idDetalle = this.editingDetalleId();
    const request$ = idDetalle
      ? this.detalleApi.update(this.compraActiva.id_compra, idDetalle, dto)
      : this.detalleApi.create(this.compraActiva.id_compra, dto);

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

  removeDetalle(linea: CompraDetalle): void {
    if (!this.compraActiva) {
      return;
    }
    this.detalleApi.remove(this.compraActiva.id_compra, linea.id_compra_detalle).subscribe({
      next: () => this.loadDetalle(),
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la línea' });
      },
    });
  }
}
