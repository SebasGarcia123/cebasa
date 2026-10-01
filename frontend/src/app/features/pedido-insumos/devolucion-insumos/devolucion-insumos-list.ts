import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormArray, FormGroup, FormControl, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { DevolucionInsumosApiService } from '../../../core/api/devolucion-insumos-api.service';
import { InsumosApiService } from '../../../core/api/insumos-api.service';
import { LineasApiService } from '../../../core/api/lineas-api.service';
import { DevolucionInsumos } from '../../../core/models/devolucion-insumos.model';
import { Insumo } from '../../../core/models/insumo.model';
import { Linea } from '../../../core/models/linea.model';

const ESTADOS_EDITABLES = new Set(['Pendiente', 'Rechazado']);

type ItemForm = FormGroup<{
  id_insumo: FormControl<number | null>;
  id_lineas: FormControl<number | null>;
  cantidad: FormControl<number | null>;
}>;

// Pantalla de Producción (operario o jefe): acá se carga lo que sobró
// y se devuelve a Logística de la misma planta. El jefe de Logística
// aprueba (mueve el stock) o rechaza con un motivo — un rechazo vuelve
// a quedar editable acá para corregir y volver a mandar.
@Component({
  selector: 'app-devolucion-insumos-list',
  imports: [
    DatePipe,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    DatePickerModule,
    CheckboxModule,
    SelectModule,
    InputNumberModule,
    TooltipModule,
  ],
  templateUrl: './devolucion-insumos-list.html',
  styleUrl: './devolucion-insumos-list.scss',
})
export class DevolucionInsumosList implements OnInit {
  private readonly api = inject(DevolucionInsumosApiService);
  private readonly insumosApi = inject(InsumosApiService);
  private readonly lineasApi = inject(LineasApiService);
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);

  protected readonly devoluciones = signal<DevolucionInsumos[]>([]);
  protected readonly insumos = signal<Insumo[]>([]);
  protected readonly lineas = signal<Linea[]>([]);
  protected readonly loading = signal(false);

  protected readonly desde = signal<Date | null>(null);
  protected readonly hasta = signal<Date | null>(null);
  protected readonly verTodos = signal(false);

  protected readonly formDialogVisible = signal(false);
  protected readonly guardando = signal(false);
  protected readonly editingId = signal<number | null>(null);
  protected readonly filas = new FormArray<ItemForm>([]);

  protected readonly verDialogVisible = signal(false);
  protected readonly devolucionAVer = signal<DevolucionInsumos | null>(null);

  ngOnInit(): void {
    forkJoin({ insumos: this.insumosApi.list(), lineas: this.lineasApi.list() }).subscribe({
      next: ({ insumos, lineas }) => {
        this.insumos.set(insumos);
        this.lineas.set(lineas);
      },
    });
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    const filtros = {
      desde: this.desde() ? this.soloFecha(this.desde()!) : undefined,
      hasta: this.hasta() ? this.soloFecha(this.hasta()!) : undefined,
      verTodos: this.verTodos(),
    };
    this.api.listParaProduccion(filtros).subscribe({
      next: (devoluciones) => {
        this.devoluciones.set(devoluciones);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el listado' });
      },
    });
  }

  private soloFecha(fecha: Date): string {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  protected onFiltroChange(): void {
    this.load();
  }

  protected estadoDe(devolucion: DevolucionInsumos): string {
    return devolucion.estados?.nombreEstado ?? '—';
  }

  protected puedeEditar(devolucion: DevolucionInsumos): boolean {
    return ESTADOS_EDITABLES.has(this.estadoDe(devolucion));
  }

  // --- Nuevo / Editar ---

  private crearFila(item?: { id_insumo: number; id_lineas: number; cantidad: number }): ItemForm {
    return this.fb.group({
      id_insumo: this.fb.control<number | null>(item?.id_insumo ?? null, Validators.required),
      id_lineas: this.fb.control<number | null>(item?.id_lineas ?? null, Validators.required),
      cantidad: this.fb.control<number | null>(item?.cantidad ?? null, [Validators.required, Validators.min(0.01)]),
    });
  }

  protected abrirNuevo(): void {
    this.editingId.set(null);
    this.filas.clear();
    this.agregarFila();
    this.formDialogVisible.set(true);
  }

  protected abrirEditar(devolucion: DevolucionInsumos): void {
    this.editingId.set(devolucion.id_devolucion_insumos);
    this.filas.clear();
    this.formDialogVisible.set(true);
    this.api.getOne(devolucion.id_devolucion_insumos).subscribe({
      next: (completa) => {
        for (const item of completa.item_devolucion_insumo ?? []) {
          this.filas.push(this.crearFila({ id_insumo: item.id_insumo, id_lineas: item.id_lineas, cantidad: Number(item.cantidad) }));
        }
        if (this.filas.length === 0) {
          this.agregarFila();
        }
      },
      error: () => {
        this.formDialogVisible.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la devolución' });
      },
    });
  }

  protected cerrarForm(): void {
    this.formDialogVisible.set(false);
  }

  protected agregarFila(): void {
    this.filas.push(this.crearFila());
  }

  protected quitarFila(index: number): void {
    this.filas.removeAt(index);
  }

  protected guardar(): void {
    if (this.guardando()) {
      return;
    }
    if (this.filas.invalid || this.filas.length === 0) {
      this.filas.markAllAsTouched();
      this.messageService.add({ severity: 'warn', summary: 'Revisá los campos', detail: 'Completá todos los ítems (insumo, línea y cantidad)' });
      return;
    }

    this.guardando.set(true);
    const dto = {
      items: this.filas.getRawValue().map((fila) => ({
        id_insumo: fila.id_insumo!,
        id_lineas: fila.id_lineas!,
        cantidad: fila.cantidad!,
      })),
    };
    const id = this.editingId();
    const request$ = id ? this.api.update(id, dto) : this.api.create(dto);

    request$.subscribe({
      next: () => {
        this.guardando.set(false);
        this.formDialogVisible.set(false);
        this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Se guardó la devolución de insumos' });
        this.load();
      },
      error: (error: HttpErrorResponse) => {
        this.guardando.set(false);
        const detail = typeof error.error?.message === 'string' ? error.error.message : 'No se pudo guardar la devolución';
        this.messageService.add({ severity: 'error', summary: 'Error', detail });
      },
    });
  }

  // --- Ver ---

  protected ver(devolucion: DevolucionInsumos): void {
    this.devolucionAVer.set(null);
    this.verDialogVisible.set(true);
    this.api.getOne(devolucion.id_devolucion_insumos).subscribe({
      next: (completa) => this.devolucionAVer.set(completa),
      error: () => {
        this.verDialogVisible.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la devolución' });
      },
    });
  }

  protected cerrarVer(): void {
    this.verDialogVisible.set(false);
  }
}
