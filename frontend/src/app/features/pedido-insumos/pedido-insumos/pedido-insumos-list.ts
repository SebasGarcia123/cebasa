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
import { SelectButtonModule } from 'primeng/selectbutton';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PedidoInsumosApiService } from '../../../core/api/pedido-insumos-api.service';
import { InsumosApiService } from '../../../core/api/insumos-api.service';
import { LineasApiService } from '../../../core/api/lineas-api.service';
import { PedidoInsumos } from '../../../core/models/pedido-insumos.model';
import { Insumo } from '../../../core/models/insumo.model';
import { Linea } from '../../../core/models/linea.model';

const ESTADO_PENDIENTE = 'Pendiente';
const ESTADO_CUMPLIDO = 'Cumplido';

// Mensaje fijo que manda el backend cuando no puede resolver la planta
// de quien solicitó el pedido (ej. un administrador sin sector real):
// en vez de mostrarlo sin más, se le ofrece a quien recibe elegirla a
// mano — mismo patrón que el despacho de pedidos con el depósito.
const MENSAJE_PLANTA_NO_RESUELTA = 'No se pudo determinar la planta de quien solicitó el pedido. Elegila manualmente.';
type Planta = 'CASEROS' | 'BARADERO';

type ItemForm = FormGroup<{
  id_insumo: FormControl<number | null>;
  id_lineas: FormControl<number | null>;
  cantidad_solicitada: FormControl<number | null>;
}>;

// Fecha "solo calendario" YYYY-MM-DD tomada de la hora local del
// navegador (todos los usuarios están en Argentina).
function soloFecha(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

// Pantalla de Producción: acá se cargan pedidos de insumos a
// Logística y se decide, una vez que Logística los cumplió, si se
// reciben (mueve el stock) o se devuelven "para revisar" con un
// motivo. Cumplir el pedido es tarea de la otra pantalla
// (Logística → Cumplir Pedidos de Insumos).
@Component({
  selector: 'app-pedido-insumos-list',
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
    SelectButtonModule,
    InputNumberModule,
    TextareaModule,
    TooltipModule,
  ],
  templateUrl: './pedido-insumos-list.html',
  styleUrl: './pedido-insumos-list.scss',
})
export class PedidoInsumosList implements OnInit {
  private readonly api = inject(PedidoInsumosApiService);
  private readonly insumosApi = inject(InsumosApiService);
  private readonly lineasApi = inject(LineasApiService);
  private readonly fb = inject(FormBuilder);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  protected readonly pedidos = signal<PedidoInsumos[]>([]);
  protected readonly insumos = signal<Insumo[]>([]);
  protected readonly lineas = signal<Linea[]>([]);
  protected readonly loading = signal(false);

  protected readonly desde = signal<Date | null>(null);
  protected readonly hasta = signal<Date | null>(null);
  protected readonly verTodos = signal(false);

  protected readonly nuevoDialogVisible = signal(false);
  protected readonly guardando = signal(false);
  protected readonly filas = new FormArray<ItemForm>([]);
  protected readonly fechaNecesidad = this.fb.control<Date | null>(null, Validators.required);

  protected readonly verDialogVisible = signal(false);
  protected readonly pedidoAVer = signal<PedidoInsumos | null>(null);

  protected readonly motivoDialogVisible = signal(false);
  protected readonly enviandoMotivo = signal(false);
  private pedidoParaMotivo: PedidoInsumos | null = null;
  protected readonly motivoForm = this.fb.nonNullable.group({
    motivo_rechazo: ['', [Validators.required, Validators.maxLength(255)]],
  });

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
      desde: this.desde() ? soloFecha(this.desde()!) : undefined,
      hasta: this.hasta() ? soloFecha(this.hasta()!) : undefined,
      verTodos: this.verTodos(),
    };
    this.api.listParaProduccion(filtros).subscribe({
      next: (pedidos) => {
        this.pedidos.set(pedidos);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el listado' });
      },
    });
  }

  protected onFiltroChange(): void {
    this.load();
  }

  protected estadoDe(pedido: PedidoInsumos): string {
    return pedido.estados?.nombreEstado ?? '—';
  }

  protected puedeAnular(pedido: PedidoInsumos): boolean {
    return this.estadoDe(pedido) === ESTADO_PENDIENTE;
  }

  protected puedeDecidir(pedido: PedidoInsumos): boolean {
    return this.estadoDe(pedido) === ESTADO_CUMPLIDO;
  }

  // --- Nuevo pedido ---

  protected abrirNuevo(): void {
    this.fechaNecesidad.reset();
    this.filas.clear();
    this.agregarFila();
    this.nuevoDialogVisible.set(true);
  }

  protected cerrarNuevo(): void {
    this.nuevoDialogVisible.set(false);
  }

  private crearFila(): ItemForm {
    return this.fb.group({
      id_insumo: this.fb.control<number | null>(null, Validators.required),
      id_lineas: this.fb.control<number | null>(null, Validators.required),
      cantidad_solicitada: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    });
  }

  protected agregarFila(): void {
    this.filas.push(this.crearFila());
  }

  protected quitarFila(index: number): void {
    this.filas.removeAt(index);
  }

  protected guardarNuevo(): void {
    if (this.guardando()) {
      return;
    }
    if (this.fechaNecesidad.invalid || this.filas.invalid || this.filas.length === 0) {
      this.fechaNecesidad.markAsTouched();
      this.filas.markAllAsTouched();
      this.messageService.add({ severity: 'warn', summary: 'Revisá los campos', detail: 'Completá la fecha de necesidad y todos los ítems (insumo, línea y cantidad)' });
      return;
    }

    this.guardando.set(true);
    const dto = {
      fecha_necesidad: soloFecha(this.fechaNecesidad.value!),
      items: this.filas.getRawValue().map((fila) => ({
        id_insumo: fila.id_insumo!,
        id_lineas: fila.id_lineas!,
        cantidad_solicitada: fila.cantidad_solicitada!,
      })),
    };

    this.api.create(dto).subscribe({
      next: () => {
        this.guardando.set(false);
        this.nuevoDialogVisible.set(false);
        this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Se creó el pedido de insumos' });
        this.load();
      },
      error: (error: HttpErrorResponse) => {
        this.guardando.set(false);
        const detail = typeof error.error?.message === 'string' ? error.error.message : 'No se pudo guardar el pedido';
        this.messageService.add({ severity: 'error', summary: 'Error', detail });
      },
    });
  }

  // --- Ver ---

  protected ver(pedido: PedidoInsumos): void {
    this.pedidoAVer.set(null);
    this.verDialogVisible.set(true);
    this.api.getOne(pedido.id_pedido_insumos).subscribe({
      next: (completo) => this.pedidoAVer.set(completo),
      error: () => {
        this.verDialogVisible.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el pedido' });
      },
    });
  }

  protected cerrarVer(): void {
    this.verDialogVisible.set(false);
  }

  // --- Anular ---

  protected confirmarAnular(pedido: PedidoInsumos): void {
    this.confirmationService.confirm({
      header: 'Anular pedido',
      message: `¿Anular el pedido de insumos #${pedido.id_pedido_insumos}? Todavía no fue tomado por Logística.`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { severity: 'danger', label: 'Anular' },
      rejectButtonProps: { severity: 'secondary', label: 'Cancelar', outlined: true },
      accept: () => {
        this.api.anular(pedido.id_pedido_insumos).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Anulado', detail: 'El pedido fue anulado' });
            this.load();
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo anular el pedido' });
          },
        });
      },
    });
  }

  // --- Recibir ---

  protected readonly recibirDialogVisible = signal(false);
  protected readonly recibiendo = signal(false);
  protected readonly pedidoARecibir = signal<PedidoInsumos | null>(null);
  protected readonly necesitaPlantaManual = signal(false);
  protected readonly plantaElegida = signal<Planta | null>(null);
  protected readonly plantasOpciones: { label: string; value: Planta }[] = [
    { label: 'Caseros', value: 'CASEROS' },
    { label: 'Baradero', value: 'BARADERO' },
  ];

  protected abrirRecibir(pedido: PedidoInsumos): void {
    this.pedidoARecibir.set(pedido);
    this.necesitaPlantaManual.set(false);
    this.plantaElegida.set(null);
    this.recibirDialogVisible.set(true);
  }

  protected cerrarRecibir(): void {
    this.recibirDialogVisible.set(false);
  }

  protected confirmarRecibir(): void {
    const pedido = this.pedidoARecibir();
    if (!pedido || this.recibiendo() || (this.necesitaPlantaManual() && !this.plantaElegida())) {
      return;
    }

    this.recibiendo.set(true);
    const dto = this.plantaElegida() ? { planta: this.plantaElegida()! } : {};
    this.api.recibir(pedido.id_pedido_insumos, dto).subscribe({
      next: () => {
        this.recibiendo.set(false);
        this.recibirDialogVisible.set(false);
        this.messageService.add({ severity: 'success', summary: 'Recibido', detail: 'El stock fue movido a Producción' });
        this.load();
      },
      error: (error: HttpErrorResponse) => {
        this.recibiendo.set(false);
        const detail = typeof error.error?.message === 'string' ? error.error.message : 'No se pudo recibir el pedido';
        if (detail === MENSAJE_PLANTA_NO_RESUELTA) {
          this.necesitaPlantaManual.set(true);
          return;
        }
        this.messageService.add({ severity: 'error', summary: 'Error', detail });
      },
    });
  }

  // --- Para revisar ---

  protected abrirParaRevisar(pedido: PedidoInsumos): void {
    this.pedidoParaMotivo = pedido;
    this.motivoForm.reset();
    this.motivoDialogVisible.set(true);
  }

  protected cerrarMotivo(): void {
    this.motivoDialogVisible.set(false);
  }

  protected confirmarParaRevisar(): void {
    if (this.motivoForm.invalid || this.enviandoMotivo() || !this.pedidoParaMotivo) {
      return;
    }
    this.enviandoMotivo.set(true);
    const dto = this.motivoForm.getRawValue();
    this.api.paraRevisar(this.pedidoParaMotivo.id_pedido_insumos, dto).subscribe({
      next: () => {
        this.enviandoMotivo.set(false);
        this.motivoDialogVisible.set(false);
        this.messageService.add({ severity: 'success', summary: 'Enviado', detail: 'El pedido vuelve a Logística para revisión' });
        this.load();
      },
      error: () => {
        this.enviandoMotivo.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo enviar a revisión' });
      },
    });
  }
}
