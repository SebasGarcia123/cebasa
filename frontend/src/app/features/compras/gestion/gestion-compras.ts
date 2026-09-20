import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { RequerimientosApiService } from '../../../core/api/requerimientos-api.service';
import { ComprasApiService } from '../../../core/api/compras-api.service';
import { ProveedoresApiService } from '../../../core/api/proveedores-api.service';
import { ArchivoAdjuntoApiService } from '../../../core/api/archivo-adjunto-api.service';
import { Requerimiento } from '../../../core/models/requerimiento.model';
import { Compra } from '../../../core/models/compra.model';
import { Proveedor } from '../../../core/models/proveedor.model';
import { ArchivoAdjunto } from '../../../core/models/archivo-adjunto.model';

type Vista = 'requerimientos' | 'oc';

interface ItemOc {
  id_requerimiento_detalle: number;
  codigo_insumo: string;
  nombre_insumo: string;
  cantidad: number;
  precio_compra: number | null;
}

const ESTADOS_OC_DEFINITIVOS = new Set(['Recibido', 'Anulado']);

@Component({
  selector: 'app-gestion-compras',
  imports: [
    DatePipe,
    DecimalPipe,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    SelectModule,
    DatePickerModule,
    InputNumberModule,
    CheckboxModule,
    TooltipModule,
  ],
  templateUrl: './gestion-compras.html',
  styleUrl: './gestion-compras.scss',
})
export class GestionCompras implements OnInit {
  private readonly requerimientosApi = inject(RequerimientosApiService);
  private readonly comprasApi = inject(ComprasApiService);
  private readonly proveedoresApi = inject(ProveedoresApiService);
  private readonly archivoAdjuntoApi = inject(ArchivoAdjuntoApiService);
  private readonly fb = inject(FormBuilder);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  protected readonly loading = signal(false);
  protected readonly requerimientos = signal<Requerimiento[]>([]);
  protected readonly compras = signal<Compra[]>([]);
  protected readonly proveedores = signal<Proveedor[]>([]);

  protected readonly vista = signal<Vista>('requerimientos');

  // Filtros: fecha desde/hasta (sobre la fecha de carga/compra) y "ver
  // todas" para además traer las que ya están en un estado definitivo.
  protected readonly fechaDesdeControl = new FormControl<Date | null>(null);
  protected readonly fechaHastaControl = new FormControl<Date | null>(null);
  protected readonly verTodasControl = new FormControl(false, { nonNullable: true });

  private readonly fechaDesde = toSignal(this.fechaDesdeControl.valueChanges, { initialValue: null });
  private readonly fechaHasta = toSignal(this.fechaHastaControl.valueChanges, { initialValue: null });
  private readonly verTodas = toSignal(this.verTodasControl.valueChanges, { initialValue: false });

  protected readonly requerimientosFiltrados = computed(() => {
    const verTodas = this.verTodas();
    return this.requerimientos()
      .filter((r) => verTodas || r.estados?.nombreEstado === 'Activo')
      .filter((r) => this.dentroDeRango(r.fecha_carga));
  });

  protected readonly ocFiltradas = computed(() => {
    const verTodas = this.verTodas();
    return this.compras()
      .filter((c) => verTodas || !ESTADOS_OC_DEFINITIVOS.has(c.estados?.nombreEstado ?? ''))
      .filter((c) => this.dentroDeRango(c.fecha_compra));
  });

  private dentroDeRango(fechaIso: string): boolean {
    const desde = this.fechaDesde();
    const hasta = this.fechaHasta();
    if (!desde && !hasta) {
      return true;
    }
    const fecha = new Date(fechaIso);
    if (desde && fecha < desde) {
      return false;
    }
    if (hasta) {
      const finDia = new Date(hasta);
      finDia.setHours(23, 59, 59, 999);
      if (fecha > finDia) {
        return false;
      }
    }
    return true;
  }

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    forkJoin({
      requerimientos: this.requerimientosApi.list(),
      compras: this.comprasApi.list(),
      proveedores: this.proveedoresApi.list(),
    }).subscribe({
      next: ({ requerimientos, compras, proveedores }) => {
        this.requerimientos.set(requerimientos);
        this.compras.set(compras);
        this.proveedores.set(proveedores);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el listado' });
      },
    });
  }

  // ---- Generar OC a partir de un requerimiento activo ----
  protected readonly generarOcDialogVisible = signal(false);
  protected readonly generarOcLoading = signal(false);
  protected readonly generarOcSaving = signal(false);
  protected readonly requerimientoParaOc = signal<Requerimiento | null>(null);
  protected readonly itemsOc = signal<ItemOc[]>([]);
  protected readonly archivoActual = signal<ArchivoAdjunto | null>(null);
  protected readonly archivoUploading = signal(false);

  protected readonly ocForm = this.fb.nonNullable.group({
    id_proveedor: [null as number | null, Validators.required],
  });

  protected readonly itemsOcCompletos = computed(() =>
    this.itemsOc().length > 0 && this.itemsOc().every((i) => i.precio_compra !== null && i.precio_compra >= 0),
  );

  openGenerarOc(requerimiento: Requerimiento): void {
    this.ocForm.reset();
    this.archivoActual.set(null);
    this.itemsOc.set([]);
    this.requerimientoParaOc.set(requerimiento);
    this.generarOcDialogVisible.set(true);
    this.generarOcLoading.set(true);

    this.requerimientosApi.getOne(requerimiento.id_requerimiento).subscribe({
      next: (completo) => {
        this.requerimientoParaOc.set(completo);
        this.itemsOc.set(
          (completo.requerimiento_detalle ?? []).map((linea) => ({
            id_requerimiento_detalle: linea.id_requerimiento_detalle,
            codigo_insumo: linea.insumo?.codigo_insumo ?? '—',
            nombre_insumo: linea.insumo?.nombre_insumo ?? '—',
            cantidad: linea.cantidad,
            precio_compra: null,
          })),
        );
        this.generarOcLoading.set(false);
      },
      error: () => {
        this.generarOcLoading.set(false);
        this.generarOcDialogVisible.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los insumos del requerimiento' });
      },
    });
  }

  closeGenerarOcDialog(): void {
    this.generarOcDialogVisible.set(false);
  }

  actualizarPrecioItem(index: number, precio: number | null): void {
    this.itemsOc.update((items) => items.map((item, i) => (i === index ? { ...item, precio_compra: precio } : item)));
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
    if (actual) {
      this.archivoAdjuntoApi.remove(actual.id_archivo_adjunto).subscribe();
    }
  }

  verArchivoUrl(): string | null {
    const archivo = this.archivoActual();
    return archivo ? this.archivoAdjuntoApi.fileUrl(archivo.id_archivo_adjunto) : null;
  }

  guardarOc(enviarAProveedor: boolean): void {
    const requerimiento = this.requerimientoParaOc();
    if (this.ocForm.invalid || !this.itemsOcCompletos() || !requerimiento || this.generarOcSaving()) {
      return;
    }

    this.generarOcSaving.set(true);
    const archivo = this.archivoActual();
    this.requerimientosApi
      .generarOc(requerimiento.id_requerimiento, {
        id_proveedor: this.ocForm.getRawValue().id_proveedor!,
        enviar_a_proveedor: enviarAProveedor,
        items: this.itemsOc().map((item) => ({
          id_requerimiento_detalle: item.id_requerimiento_detalle,
          precio_compra: item.precio_compra!,
        })),
        ...(archivo ? { id_archivo_adjunto: archivo.id_archivo_adjunto } : {}),
      })
      .subscribe({
        next: () => {
          this.generarOcSaving.set(false);
          this.generarOcDialogVisible.set(false);
          this.messageService.add({
            severity: 'success',
            summary: enviarAProveedor ? 'Enviada al proveedor' : 'Autorizada',
            detail: `Se generó la orden de compra${enviarAProveedor ? ' y se envió al proveedor' : ''}`,
          });
          this.load();
        },
        error: () => {
          this.generarOcSaving.set(false);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo generar la orden de compra' });
        },
      });
  }

  // ---- Detalle y acciones de una OC ----
  protected readonly ocDetalleDialogVisible = signal(false);
  protected readonly ocDetalleLoading = signal(false);
  protected readonly ocDetalleActionBusy = signal(false);
  protected readonly ocDetalle = signal<Compra | null>(null);

  verOc(compra: Compra): void {
    this.ocDetalle.set(null);
    this.ocDetalleDialogVisible.set(true);
    this.ocDetalleLoading.set(true);
    this.comprasApi.getOne(compra.id_compra).subscribe({
      next: (completa) => {
        this.ocDetalle.set(completa);
        this.ocDetalleLoading.set(false);
      },
      error: () => {
        this.ocDetalleLoading.set(false);
        this.ocDetalleDialogVisible.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la orden de compra' });
      },
    });
  }

  ocArchivoUrl(): string | null {
    const compra = this.ocDetalle();
    return compra?.id_archivo_adjunto ? this.archivoAdjuntoApi.fileUrl(compra.id_archivo_adjunto) : null;
  }

  enviarProveedor(): void {
    const compra = this.ocDetalle();
    if (!compra || this.ocDetalleActionBusy()) {
      return;
    }
    this.ocDetalleActionBusy.set(true);
    this.comprasApi.enviarProveedor(compra.id_compra).subscribe({
      next: (actualizada) => {
        this.ocDetalleActionBusy.set(false);
        this.ocDetalle.set(actualizada);
        this.messageService.add({ severity: 'success', summary: 'Enviada', detail: 'Orden de compra enviada al proveedor' });
        this.load();
      },
      error: () => {
        this.ocDetalleActionBusy.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo enviar al proveedor' });
      },
    });
  }

  recibir(): void {
    const compra = this.ocDetalle();
    if (!compra || this.ocDetalleActionBusy()) {
      return;
    }
    this.ocDetalleActionBusy.set(true);
    this.comprasApi.recibir(compra.id_compra).subscribe({
      next: (actualizada) => {
        this.ocDetalleActionBusy.set(false);
        this.ocDetalle.set(actualizada);
        this.messageService.add({ severity: 'success', summary: 'Recibida', detail: 'Mercadería ingresada' });
        this.load();
      },
      error: () => {
        this.ocDetalleActionBusy.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo confirmar el ingreso' });
      },
    });
  }

  confirmAnular(): void {
    const compra = this.ocDetalle();
    if (!compra) {
      return;
    }
    this.confirmationService.confirm({
      header: 'Confirmar anulación',
      message: `¿Anular la orden de compra #${compra.id_compra}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { severity: 'danger', label: 'Anular' },
      rejectButtonProps: { severity: 'secondary', label: 'Cancelar', outlined: true },
      accept: () => this.anular(),
    });
  }

  private anular(): void {
    const compra = this.ocDetalle();
    if (!compra) {
      return;
    }
    this.ocDetalleActionBusy.set(true);
    this.comprasApi.anular(compra.id_compra).subscribe({
      next: (actualizada) => {
        this.ocDetalleActionBusy.set(false);
        this.ocDetalle.set(actualizada);
        this.messageService.add({ severity: 'success', summary: 'Anulada', detail: 'Orden de compra anulada' });
        this.load();
      },
      error: () => {
        this.ocDetalleActionBusy.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo anular' });
      },
    });
  }
}
