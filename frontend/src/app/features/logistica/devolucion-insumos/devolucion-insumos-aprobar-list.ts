import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../core/auth/auth.service';
import { DevolucionInsumosApiService } from '../../../core/api/devolucion-insumos-api.service';
import { DevolucionInsumos } from '../../../core/models/devolucion-insumos.model';

const ESTADOS_ACCIONABLES = new Set(['Pendiente', 'Rechazado']);

// Mensaje fijo que manda el backend cuando no puede resolver la planta
// de quien solicitó la devolución (ej. un administrador sin sector
// real): en vez de mostrarlo sin más, se le ofrece a quien aprueba
// elegirla a mano — mismo patrón que la recepción de pedidos de insumos.
const MENSAJE_PLANTA_NO_RESUELTA = 'No se pudo determinar la planta de quien solicitó la devolución. Elegila manualmente.';
type Planta = 'CASEROS' | 'BARADERO';

// Pantalla del jefe de Logística: misma vista que la de Producción
// (Devolución de Insumos), pero con botonera para ver, aprobar o
// rechazar. Aprobar mueve el stock de Producción a Logística de esa
// misma planta; rechazar pide un motivo y la devuelve a Producción
// para corregir.
@Component({
  selector: 'app-devolucion-insumos-aprobar-list',
  imports: [
    DatePipe,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    DatePickerModule,
    CheckboxModule,
    SelectButtonModule,
    TextareaModule,
    TooltipModule,
  ],
  templateUrl: './devolucion-insumos-aprobar-list.html',
  styleUrl: './devolucion-insumos-aprobar-list.scss',
})
export class DevolucionInsumosAprobarList implements OnInit {
  private readonly api = inject(DevolucionInsumosApiService);
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly authService = inject(AuthService);

  protected readonly puedeAprobar = computed(() => {
    const user = this.authService.currentUser();
    return !!user && (user.es_administrador || user.permisos.includes('logistica.devolucion_insumos.aprobar'));
  });

  protected readonly devoluciones = signal<DevolucionInsumos[]>([]);
  protected readonly loading = signal(false);

  protected readonly desde = signal<Date | null>(null);
  protected readonly hasta = signal<Date | null>(null);
  protected readonly verTodos = signal(false);

  protected readonly verDialogVisible = signal(false);
  protected readonly devolucionAVer = signal<DevolucionInsumos | null>(null);

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    const filtros = {
      desde: this.desde() ? this.soloFecha(this.desde()!) : undefined,
      hasta: this.hasta() ? this.soloFecha(this.hasta()!) : undefined,
      verTodos: this.verTodos(),
    };
    this.api.listParaLogistica(filtros).subscribe({
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

  protected puedeDecidir(devolucion: DevolucionInsumos): boolean {
    return this.puedeAprobar() && ESTADOS_ACCIONABLES.has(this.estadoDe(devolucion));
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

  // --- Aprobar ---

  protected readonly aprobarDialogVisible = signal(false);
  protected readonly aprobando = signal(false);
  protected readonly devolucionAAprobar = signal<DevolucionInsumos | null>(null);
  protected readonly necesitaPlantaManual = signal(false);
  protected readonly plantaElegida = signal<Planta | null>(null);
  protected readonly plantasOpciones: { label: string; value: Planta }[] = [
    { label: 'Caseros', value: 'CASEROS' },
    { label: 'Baradero', value: 'BARADERO' },
  ];

  protected abrirAprobar(devolucion: DevolucionInsumos): void {
    this.devolucionAAprobar.set(devolucion);
    this.necesitaPlantaManual.set(false);
    this.plantaElegida.set(null);
    this.aprobarDialogVisible.set(true);
  }

  protected cerrarAprobar(): void {
    this.aprobarDialogVisible.set(false);
  }

  protected confirmarAprobar(): void {
    const devolucion = this.devolucionAAprobar();
    if (!devolucion || this.aprobando() || (this.necesitaPlantaManual() && !this.plantaElegida())) {
      return;
    }

    this.aprobando.set(true);
    const dto = this.plantaElegida() ? { planta: this.plantaElegida()! } : {};
    this.api.aprobar(devolucion.id_devolucion_insumos, dto).subscribe({
      next: () => {
        this.aprobando.set(false);
        this.aprobarDialogVisible.set(false);
        this.messageService.add({ severity: 'success', summary: 'Aprobada', detail: 'El stock fue movido a Logística' });
        this.load();
      },
      error: (error: HttpErrorResponse) => {
        this.aprobando.set(false);
        const detail = typeof error.error?.message === 'string' ? error.error.message : 'No se pudo aprobar la devolución';
        if (detail === MENSAJE_PLANTA_NO_RESUELTA) {
          this.necesitaPlantaManual.set(true);
          return;
        }
        this.messageService.add({ severity: 'error', summary: 'Error', detail });
      },
    });
  }

  // --- Rechazar ---

  protected readonly rechazarDialogVisible = signal(false);
  protected readonly rechazando = signal(false);
  private devolucionARechazar: DevolucionInsumos | null = null;
  protected readonly rechazarForm = this.fb.nonNullable.group({
    motivo_rechazo: ['', [Validators.required, Validators.maxLength(255)]],
  });

  protected abrirRechazar(devolucion: DevolucionInsumos): void {
    this.devolucionARechazar = devolucion;
    this.rechazarForm.reset();
    this.rechazarDialogVisible.set(true);
  }

  protected cerrarRechazar(): void {
    this.rechazarDialogVisible.set(false);
  }

  protected confirmarRechazar(): void {
    if (this.rechazarForm.invalid || this.rechazando() || !this.devolucionARechazar) {
      return;
    }
    this.rechazando.set(true);
    const dto = this.rechazarForm.getRawValue();
    this.api.rechazar(this.devolucionARechazar.id_devolucion_insumos, dto).subscribe({
      next: () => {
        this.rechazando.set(false);
        this.rechazarDialogVisible.set(false);
        this.messageService.add({ severity: 'success', summary: 'Rechazada', detail: 'La devolución vuelve a Producción para corregir' });
        this.load();
      },
      error: () => {
        this.rechazando.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo rechazar la devolución' });
      },
    });
  }
}
