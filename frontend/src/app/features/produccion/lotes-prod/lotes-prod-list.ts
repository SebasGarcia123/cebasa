import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { forkJoin } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { LoteProdApiService } from '../../../core/api/lote-prod-api.service';
import { ItemProdApiService } from '../../../core/api/item-prod-api.service';
import { TurnosApiService } from '../../../core/api/turnos-api.service';
import { ProductosApiService } from '../../../core/api/productos-api.service';
import { LineasApiService } from '../../../core/api/lineas-api.service';
import { LoteProd } from '../../../core/models/lote-prod.model';
import { ItemProd } from '../../../core/models/item-prod.model';
import { Turno } from '../../../core/models/turno.model';
import { Producto } from '../../../core/models/producto.model';
import { Linea } from '../../../core/models/linea.model';

const ESTADO_APROBADO = 'Aprobado';
const ESTADO_RECHAZADO = 'Rechazado';

type ItemProdForm = FormGroup<{
  id_item: FormControl<number | null>;
  id_lineas: FormControl<number | null>;
  id_producto: FormControl<number | null>;
  id_producto_codigo: FormControl<number | null>;
  cantidad: FormControl<number | null>;
  cantidad_pallets: FormControl<number | null>;
}>;

@Component({
  selector: 'app-lotes-prod-list',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    SelectModule,
    DatePickerModule,
    InputNumberModule,
    TooltipModule,
  ],
  templateUrl: './lotes-prod-list.html',
  styleUrl: './lotes-prod-list.scss',
})
export class LotesProdList implements OnInit {
  private readonly api = inject(LoteProdApiService);
  private readonly itemsApi = inject(ItemProdApiService);
  private readonly turnosApi = inject(TurnosApiService);
  private readonly productosApi = inject(ProductosApiService);
  private readonly lineasApi = inject(LineasApiService);
  private readonly fb = inject(FormBuilder);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  protected readonly lotes = signal<LoteProd[]>([]);
  protected readonly turnos = signal<Turno[]>([]);
  protected readonly productos = signal<Producto[]>([]);
  protected readonly lineas = signal<Linea[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly itemsLoading = signal(false);
  protected readonly dialogVisible = signal(false);
  protected readonly editingId = signal<number | null>(null);
  // Motivo del último rechazo del lote que se está editando (si lo hay),
  // para mostrárselo a Producción como contexto al corregirlo.
  protected readonly motivoRechazo = signal<string | null>(null);

  // Solo productos activos para elegir en un ítem nuevo.
  protected readonly productosActivos = computed(() =>
    this.productos().filter((p) => p.estados?.nombreEstado !== 'Anulado'),
  );

  protected readonly form = this.fb.nonNullable.group({
    id_turno: [null as number | null, Validators.required],
    fecha_lote_prod: [null as Date | null, Validators.required],
  });

  // Los ítems se arman en memoria (una fila por producto, con cálculo
  // bolsones <-> pallets en vivo) y recién se persisten todos juntos al
  // guardar el lote: se comparan contra itemsOriginales para saber qué
  // crear, actualizar o borrar.
  protected readonly itemsFormArray = new FormArray<ItemProdForm>([]);
  private itemsOriginales: ItemProd[] = [];

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    forkJoin({
      lotes: this.api.list(),
      turnos: this.turnosApi.list(),
      productos: this.productosApi.list(),
      lineas: this.lineasApi.list(),
    }).subscribe({
      next: ({ lotes, turnos, productos, lineas }) => {
        this.lotes.set(lotes);
        this.turnos.set(turnos);
        this.productos.set(productos);
        this.lineas.set(lineas);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el listado' });
      },
    });
  }

  protected productoDe(idProducto: number | null): Producto | undefined {
    if (idProducto == null) {
      return undefined;
    }
    return this.productos().find((p) => p.id_producto === idProducto);
  }

  private calcularPallets(bolsones: number, bolsonesPorPallet: number): number {
    return Math.round((bolsones / bolsonesPorPallet) * 100) / 100;
  }

  private calcularBolsones(pallets: number, bolsonesPorPallet: number): number {
    return Math.round(pallets * bolsonesPorPallet);
  }

  private crearFilaItem(item?: ItemProd): ItemProdForm {
    const bolsonesPorPallet = item ? this.productoDe(item.id_producto)?.bolsones_por_pallet : null;
    const cantidadPallets =
      item && bolsonesPorPallet ? this.calcularPallets(item.cantidad, bolsonesPorPallet) : null;

    const fila: ItemProdForm = this.fb.group({
      id_item: this.fb.control<number | null>(item?.id_item ?? null),
      id_lineas: this.fb.control<number | null>(item?.id_lineas ?? null, Validators.required),
      id_producto: this.fb.control<number | null>(item?.id_producto ?? null, Validators.required),
      // Selector duplicado (Código y Producto eligen el mismo id_producto,
      // pero son dos <p-select> con distinto optionLabel). Compartir un
      // único FormControl entre dos p-select no sincroniza de forma
      // confiable la vista del otro, así que se mantienen dos controles
      // sincronizados a mano (mismo criterio que en Pedidos).
      id_producto_codigo: this.fb.control<number | null>(item?.id_producto ?? null),
      cantidad: this.fb.control<number | null>(item?.cantidad ?? null, [Validators.required, Validators.min(1)]),
      cantidad_pallets: this.fb.control<number | null>(cantidadPallets),
    });

    const sincronizarProducto = (idProducto: number | null, origen: 'principal' | 'codigo') => {
      if (origen === 'principal') {
        fila.controls.id_producto_codigo.setValue(idProducto, { emitEvent: false });
      } else {
        fila.controls.id_producto.setValue(idProducto, { emitEvent: false });
      }
      const bpp = this.productoDe(idProducto)?.bolsones_por_pallet;
      const cantidad = fila.controls.cantidad.value;
      if (bpp && cantidad != null) {
        fila.controls.cantidad_pallets.setValue(this.calcularPallets(cantidad, bpp), { emitEvent: false });
      }
    };

    // Bolsones <-> Pallets: cambiar uno recalcula el otro tomando como
    // referencia productos.bolsones_por_pallet del producto elegido en
    // la fila. emitEvent:false evita que el recálculo dispare este mismo
    // listener en bucle.
    fila.controls.id_producto.valueChanges.subscribe((idProducto) => sincronizarProducto(idProducto, 'principal'));
    fila.controls.id_producto_codigo.valueChanges.subscribe((idProducto) => sincronizarProducto(idProducto, 'codigo'));

    fila.controls.cantidad.valueChanges.subscribe((cantidad) => {
      const bpp = this.productoDe(fila.controls.id_producto.value)?.bolsones_por_pallet;
      if (bpp && cantidad != null) {
        fila.controls.cantidad_pallets.setValue(this.calcularPallets(cantidad, bpp), { emitEvent: false });
      }
    });

    fila.controls.cantidad_pallets.valueChanges.subscribe((pallets) => {
      const bpp = this.productoDe(fila.controls.id_producto.value)?.bolsones_por_pallet;
      if (bpp && pallets != null) {
        fila.controls.cantidad.setValue(this.calcularBolsones(pallets, bpp), { emitEvent: false });
      }
    });

    return fila;
  }

  protected agregarItem(): void {
    this.itemsFormArray.push(this.crearFilaItem());
  }

  protected quitarItem(index: number): void {
    this.itemsFormArray.removeAt(index);
  }

  protected totalPallets(): number {
    return this.itemsFormArray.controls.reduce((acc, fila) => acc + (fila.controls.cantidad_pallets.value ?? 0), 0);
  }

  // No se puede editar un lote ya aprobado: el stock que generó ya
  // quedó asentado, y el backend lo rechaza igual (ver LoteProdService).
  protected puedeEditar(lote: LoteProd): boolean {
    return lote.estados?.nombreEstado !== ESTADO_APROBADO;
  }

  openCreate(): void {
    this.editingId.set(null);
    this.motivoRechazo.set(null);
    this.itemsOriginales = [];
    this.form.reset();
    this.itemsFormArray.clear();
    this.itemsFormArray.push(this.crearFilaItem());
    this.dialogVisible.set(true);
  }

  openEdit(lote: LoteProd): void {
    this.editingId.set(lote.id_lote);
    this.motivoRechazo.set(lote.estados?.nombreEstado === ESTADO_RECHAZADO ? (lote.motivo_rechazo ?? null) : null);
    this.form.setValue({
      id_turno: lote.id_turno,
      fecha_lote_prod: new Date(lote.fecha_lote_prod),
    });
    this.itemsFormArray.clear();
    this.itemsOriginales = [];
    this.itemsLoading.set(true);
    this.dialogVisible.set(true);

    this.itemsApi.list(lote.id_lote).subscribe({
      next: (items) => {
        this.itemsOriginales = items;
        items.forEach((item) => this.itemsFormArray.push(this.crearFilaItem(item)));
        if (this.itemsFormArray.length === 0) {
          this.itemsFormArray.push(this.crearFilaItem());
        }
        this.itemsLoading.set(false);
      },
      error: () => {
        this.itemsLoading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los ítems del lote' });
      },
    });
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
  }

  guardar(): void {
    if (this.form.invalid || this.itemsFormArray.invalid || this.saving()) {
      return;
    }
    if (this.itemsFormArray.length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Faltan productos', detail: 'Agregá al menos un producto al lote' });
      return;
    }

    this.saving.set(true);
    const raw = this.form.getRawValue();
    const headerDto = {
      id_turno: raw.id_turno!,
      fecha_lote_prod: raw.fecha_lote_prod!.toISOString().slice(0, 10),
    };

    const id = this.editingId();
    if (id) {
      this.api.update(id, headerDto).subscribe({
        next: () => this.guardarItems(id),
        error: () => this.onGuardarError(),
      });
    } else {
      this.api.create(headerDto).subscribe({
        next: (lote) => this.guardarItems(lote.id_lote),
        error: () => this.onGuardarError(),
      });
    }
  }

  private guardarItems(idLote: number): void {
    const filas = this.itemsFormArray.getRawValue();
    const idsActuales = new Set(filas.map((f) => f.id_item).filter((id): id is number => id != null));
    const aEliminar = this.itemsOriginales.filter((item) => !idsActuales.has(item.id_item));

    const operaciones = [
      ...aEliminar.map((item) => this.itemsApi.remove(idLote, item.id_item)),
      ...filas.map((fila) => {
        const dto = { id_producto: fila.id_producto!, id_lineas: fila.id_lineas!, cantidad: fila.cantidad! };
        return fila.id_item ? this.itemsApi.update(idLote, fila.id_item, dto) : this.itemsApi.create(idLote, dto);
      }),
    ];

    if (operaciones.length === 0) {
      this.onGuardarSuccess();
      return;
    }

    forkJoin(operaciones).subscribe({
      next: () => this.onGuardarSuccess(),
      error: () => this.onGuardarError(),
    });
  }

  private onGuardarSuccess(): void {
    this.saving.set(false);
    this.dialogVisible.set(false);
    this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Se guardó correctamente' });
    this.load();
  }

  private onGuardarError(): void {
    this.saving.set(false);
    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar' });
  }

  confirmDelete(lote: LoteProd): void {
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
}
