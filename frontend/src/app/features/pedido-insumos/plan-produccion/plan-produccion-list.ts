import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin, Observable } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PlanProduccionApiService } from '../../../core/api/plan-produccion-api.service';
import { ItemPlanProduccionApiService } from '../../../core/api/item-plan-produccion-api.service';
import { DiaNoLaborableApiService } from '../../../core/api/dia-no-laborable-api.service';
import { LineasApiService } from '../../../core/api/lineas-api.service';
import { ProductosApiService } from '../../../core/api/productos-api.service';
import { TurnosApiService } from '../../../core/api/turnos-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { SemanaPlanProduccion, DiaPlanProduccion } from '../../../core/models/semana-plan-produccion.model';
import { ItemPlanProduccion } from '../../../core/models/item-plan-produccion.model';
import { Linea } from '../../../core/models/linea.model';
import { Producto } from '../../../core/models/producto.model';
import { Turno } from '../../../core/models/turno.model';

type ItemForm = FormGroup<{
  id_item_plan_produccion: FormControl<number | null>;
  id_lineas: FormControl<number | null>;
  id_producto: FormControl<number | null>;
  id_producto_codigo: FormControl<number | null>;
  id_turno: FormControl<number | null>;
  cantidad: FormControl<number | null>;
}>;

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

// Fecha "solo calendario" en formato YYYY-MM-DD, tomada de la hora
// local del navegador (los usuarios están todos en Argentina, así que
// la hora local del navegador ya es la hora Argentina que importa acá
// — no hace falta el ajuste UTC-3 fijo que sí usa el backend, que no
// puede asumir en qué huso horario corre el server).
function soloFecha(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

function lunesDeLocal(fecha: Date): Date {
  const dia = fecha.getDay();
  const diff = dia === 0 ? -6 : 1 - dia;
  const lunes = new Date(fecha);
  lunes.setDate(lunes.getDate() + diff);
  lunes.setHours(0, 0, 0, 0);
  return lunes;
}

// El plan de producción se carga por semana (lunes a viernes). Solo el
// Jefe de Producción (permiso produccion.editar) puede cargar/editar,
// y solo mientras el día sea hoy o futuro — un día ya pasado, o
// cualquier otro rol, queda de solo lectura. Marcar un día como no
// laborable (feriado, limpieza, etc.) es una acción aparte e
// inmediata, no pasa por el botón Guardar general.
@Component({
  selector: 'app-plan-produccion-list',
  imports: [
    DatePipe,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    SelectModule,
    DatePickerModule,
    InputNumberModule,
    TextareaModule,
  ],
  templateUrl: './plan-produccion-list.html',
  styleUrl: './plan-produccion-list.scss',
})
export class PlanProduccionList implements OnInit {
  private readonly api = inject(PlanProduccionApiService);
  private readonly itemsApi = inject(ItemPlanProduccionApiService);
  private readonly diaNoLaborableApi = inject(DiaNoLaborableApiService);
  private readonly lineasApi = inject(LineasApiService);
  private readonly productosApi = inject(ProductosApiService);
  private readonly turnosApi = inject(TurnosApiService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  protected readonly diasSemana = DIAS_SEMANA;

  protected readonly puedeEditar = computed(() => {
    const user = this.authService.currentUser();
    return !!user && (user.es_administrador || user.permisos.includes('produccion.editar'));
  });

  protected readonly lunesActual = signal<Date>(lunesDeLocal(new Date()));
  protected readonly fechaBusqueda = signal<Date | null>(null);
  protected readonly semana = signal<SemanaPlanProduccion | null>(null);
  protected readonly loading = signal(false);
  protected readonly guardando = signal(false);

  protected readonly lineas = signal<Linea[]>([]);
  protected readonly productos = signal<Producto[]>([]);
  protected readonly turnos = signal<Turno[]>([]);
  protected readonly productosActivos = computed(() =>
    this.productos().filter((p) => p.estados?.nombreEstado !== 'Anulado'),
  );
  protected readonly turnosActivos = computed(() =>
    this.turnos().filter((t) => t.estados?.nombreEstado !== 'Anulado'),
  );

  // Un FormArray por día (lunes=0 … viernes=4), con las filas de
  // producto/línea/turno/cantidad de ese día. Se reconstruyen enteros
  // cada vez que se carga una semana nueva.
  protected readonly filasPorDia: FormArray<ItemForm>[] = Array.from({ length: 5 }, () => new FormArray<ItemForm>([]));
  private originalesPorDia: ItemPlanProduccion[][] = [[], [], [], [], []];

  protected readonly rangoSemana = computed(() => {
    const lunes = this.lunesActual();
    const viernes = new Date(lunes);
    viernes.setDate(viernes.getDate() + 4);
    return { desde: lunes, hasta: viernes };
  });

  protected readonly hoyStr = soloFecha(new Date());

  protected readonly motivoDialogVisible = signal(false);
  protected readonly motivoSaving = signal(false);
  private diaParaMotivo: DiaPlanProduccion | null = null;
  protected readonly motivoForm = this.fb.nonNullable.group({
    motivo: ['', [Validators.required, Validators.maxLength(255)]],
  });

  ngOnInit(): void {
    forkJoin({
      lineas: this.lineasApi.list(),
      productos: this.productosApi.list(),
      turnos: this.turnosApi.list(),
    }).subscribe({
      next: ({ lineas, productos, turnos }) => {
        this.lineas.set(lineas);
        this.productos.set(productos);
        this.turnos.set(turnos);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los catálogos' });
      },
    });
    this.cargarSemana();
  }

  private cargarSemana(): void {
    this.loading.set(true);
    this.api.semana(soloFecha(this.lunesActual())).subscribe({
      next: (semana) => {
        this.semana.set(semana);
        this.reconstruirFormularios(semana);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el plan de producción' });
      },
    });
  }

  private reconstruirFormularios(semana: SemanaPlanProduccion): void {
    semana.dias.forEach((dia, i) => {
      const array = this.filasPorDia[i];
      array.clear();
      this.originalesPorDia[i] = dia.items;
      dia.items.forEach((item) => array.push(this.crearFilaItem(item)));
    });
  }

  private crearFilaItem(item?: ItemPlanProduccion): ItemForm {
    const fila: ItemForm = this.fb.group({
      id_item_plan_produccion: this.fb.control<number | null>(item?.id_item_plan_produccion ?? null),
      id_lineas: this.fb.control<number | null>(item?.id_lineas ?? null, Validators.required),
      id_producto: this.fb.control<number | null>(item?.id_producto ?? null, Validators.required),
      id_producto_codigo: this.fb.control<number | null>(item?.id_producto ?? null),
      id_turno: this.fb.control<number | null>(item?.id_turno ?? null, Validators.required),
      cantidad: this.fb.control<number | null>(item?.cantidad ?? null, [Validators.required, Validators.min(1)]),
    });

    const sincronizarProducto = (idProducto: number | null, origen: 'principal' | 'codigo') => {
      if (origen === 'principal') {
        fila.controls.id_producto_codigo.setValue(idProducto, { emitEvent: false });
      } else {
        fila.controls.id_producto.setValue(idProducto, { emitEvent: false });
      }
    };
    fila.controls.id_producto.valueChanges.subscribe((v) => sincronizarProducto(v, 'principal'));
    fila.controls.id_producto_codigo.valueChanges.subscribe((v) => sincronizarProducto(v, 'codigo'));

    return fila;
  }

  // Editable si hay permiso Y la fecha es hoy o futura. Un día pasado,
  // o cualquier rol sin produccion.editar, queda de solo lectura.
  protected diaEditable(fecha: string): boolean {
    return this.puedeEditar() && fecha.slice(0, 10) >= this.hoyStr;
  }

  protected turnoDe(id: number | null): Turno | undefined {
    return id == null ? undefined : this.turnos().find((t) => t.id_turno === id);
  }

  protected lineaDe(id: number | null): Linea | undefined {
    return id == null ? undefined : this.lineas().find((l) => l.id_lineas === id);
  }

  protected productoDe(id: number | null): Producto | undefined {
    return id == null ? undefined : this.productos().find((p) => p.id_producto === id);
  }

  // Si toda la semana que se está viendo quedó en el pasado, no tiene
  // sentido mostrar un botón "Guardar" activo (no habría nada que
  // guardar aunque se tocara algo — guardar() ya lo ignora por día,
  // pero mostrar el botón igual sería confuso).
  protected readonly haySemanaEditable = computed(() => {
    const semana = this.semana();
    return !!semana && semana.dias.some((dia) => this.diaEditable(dia.fecha));
  });

  protected agregarFila(diaIndex: number): void {
    this.filasPorDia[diaIndex].push(this.crearFilaItem());
  }

  protected quitarFila(diaIndex: number, filaIndex: number): void {
    this.filasPorDia[diaIndex].removeAt(filaIndex);
  }

  protected semanaAnterior(): void {
    const nueva = new Date(this.lunesActual());
    nueva.setDate(nueva.getDate() - 7);
    this.lunesActual.set(nueva);
    this.cargarSemana();
  }

  protected semanaSiguiente(): void {
    const nueva = new Date(this.lunesActual());
    nueva.setDate(nueva.getDate() + 7);
    this.lunesActual.set(nueva);
    this.cargarSemana();
  }

  protected buscarPorFecha(fecha: Date | null): void {
    if (!fecha) {
      return;
    }
    this.lunesActual.set(lunesDeLocal(fecha));
    this.cargarSemana();
  }

  protected guardar(): void {
    if (this.guardando()) {
      return;
    }
    if (this.filasPorDia.some((array) => array.invalid)) {
      this.messageService.add({ severity: 'warn', summary: 'Revisá los campos', detail: 'Hay filas incompletas' });
      return;
    }

    const operaciones: Observable<unknown>[] = [];
    const semana = this.semana();
    this.filasPorDia.forEach((array, i) => {
      const fecha = semana?.dias[i]?.fecha;
      if (!fecha || !this.diaEditable(fecha)) {
        return;
      }
      const filas = array.getRawValue();
      const idsActuales = new Set(
        filas.map((f) => f.id_item_plan_produccion).filter((id): id is number => id != null),
      );
      const aEliminar = this.originalesPorDia[i].filter((item) => !idsActuales.has(item.id_item_plan_produccion));

      operaciones.push(
        ...aEliminar.map((item) => this.itemsApi.remove(item.id_item_plan_produccion)),
        ...filas.map((fila) => {
          const dto = { id_lineas: fila.id_lineas!, id_producto: fila.id_producto!, id_turno: fila.id_turno!, cantidad: fila.cantidad! };
          return fila.id_item_plan_produccion
            ? this.itemsApi.update(fila.id_item_plan_produccion, dto)
            : this.itemsApi.create({ ...dto, fecha });
        }),
      );
    });

    if (operaciones.length === 0) {
      this.messageService.add({ severity: 'info', summary: 'Sin cambios', detail: 'No hay nada nuevo para guardar' });
      return;
    }

    this.guardando.set(true);
    forkJoin(operaciones).subscribe({
      next: () => {
        this.guardando.set(false);
        this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Se guardó el plan de producción' });
        this.cargarSemana();
      },
      error: (error: HttpErrorResponse) => {
        this.guardando.set(false);
        const detail = typeof error.error?.message === 'string' ? error.error.message : 'No se pudo guardar';
        this.messageService.add({ severity: 'error', summary: 'Error', detail });
        this.cargarSemana();
      },
    });
  }

  protected abrirMotivo(dia: DiaPlanProduccion): void {
    this.diaParaMotivo = dia;
    this.motivoForm.reset();
    this.motivoDialogVisible.set(true);
  }

  protected cerrarMotivo(): void {
    this.motivoDialogVisible.set(false);
  }

  protected confirmarNoLaborable(): void {
    if (this.motivoForm.invalid || this.motivoSaving() || !this.diaParaMotivo) {
      return;
    }
    this.motivoSaving.set(true);
    const motivo = this.motivoForm.getRawValue().motivo;
    this.diaNoLaborableApi.create({ fecha: this.diaParaMotivo.fecha, motivo }).subscribe({
      next: () => {
        this.motivoSaving.set(false);
        this.motivoDialogVisible.set(false);
        this.cargarSemana();
      },
      error: (error: HttpErrorResponse) => {
        this.motivoSaving.set(false);
        const detail = typeof error.error?.message === 'string' ? error.error.message : 'No se pudo marcar el día';
        this.messageService.add({ severity: 'error', summary: 'Error', detail });
      },
    });
  }

  protected deshacerNoLaborable(dia: DiaPlanProduccion): void {
    if (!dia.no_laborable) {
      return;
    }
    this.confirmationService.confirm({
      header: 'Deshacer día no laborable',
      message: `¿Volver a habilitar ${dia.fecha.slice(0, 10)} para cargar plan de producción?`,
      icon: 'pi pi-question-circle',
      acceptButtonProps: { label: 'Deshacer' },
      rejectButtonProps: { severity: 'secondary', label: 'Cancelar', outlined: true },
      accept: () => {
        this.diaNoLaborableApi.remove(dia.no_laborable!.id_dia_no_laborable).subscribe({
          next: () => this.cargarSemana(),
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo deshacer' });
          },
        });
      },
    });
  }
}
