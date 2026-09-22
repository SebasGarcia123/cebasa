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
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PedidosApiService } from '../../../core/api/pedidos-api.service';
import { ItemPedidoApiService } from '../../../core/api/item-pedido-api.service';
import { ClientesApiService } from '../../../core/api/clientes-api.service';
import { EstadosApiService } from '../../../core/api/estados-api.service';
import { ProductosApiService } from '../../../core/api/productos-api.service';
import { Pedido } from '../../../core/models/pedido.model';
import { ItemPedido } from '../../../core/models/item-pedido.model';
import { Cliente } from '../../../core/models/cliente.model';
import { Estado } from '../../../core/models/estado.model';
import { Producto } from '../../../core/models/producto.model';

const ESTADOS_PEDIDO = new Set(['Activo', 'Anulado']);

type ItemPedidoForm = FormGroup<{
  id_item_pedido: FormControl<number | null>;
  id_producto: FormControl<number | null>;
  cantidad_bolsones: FormControl<number | null>;
  cantidad_pallets: FormControl<number | null>;
}>;

@Component({
  selector: 'app-pedidos-list',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    SelectModule,
    DatePickerModule,
    InputTextModule,
    InputNumberModule,
    TooltipModule,
  ],
  templateUrl: './pedidos-list.html',
  styleUrl: './pedidos-list.scss',
})
export class PedidosList implements OnInit {
  private readonly api = inject(PedidosApiService);
  private readonly itemsApi = inject(ItemPedidoApiService);
  private readonly clientesApi = inject(ClientesApiService);
  private readonly estadosApi = inject(EstadosApiService);
  private readonly productosApi = inject(ProductosApiService);
  private readonly fb = inject(FormBuilder);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  protected readonly pedidos = signal<Pedido[]>([]);
  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly estados = signal<Estado[]>([]);
  protected readonly productos = signal<Producto[]>([]);
  protected readonly loading = signal(false);

  // Un cliente cancelado no puede recibir pedidos nuevos (el backend lo
  // rechaza igual, pero ni se lo ofrecemos en el selector).
  protected readonly clientesActivos = computed(() =>
    this.clientes().filter((c) => c.estados?.nombreEstado !== 'Cancelado'),
  );
  // Solo productos activos para elegir en un ítem nuevo.
  protected readonly productosActivos = computed(() =>
    this.productos().filter((p) => p.estados?.nombreEstado !== 'Anulado'),
  );

  protected readonly saving = signal(false);
  protected readonly itemsLoading = signal(false);
  protected readonly dialogVisible = signal(false);
  protected readonly editingId = signal<number | null>(null);

  // Al crear no se elige estado: el sistema lo pone en "Activo". El
  // selector de estado solo se muestra al editar, y restringido a
  // Activo/Anulado.
  protected readonly estadosPedido = computed(() => this.estados().filter((e) => ESTADOS_PEDIDO.has(e.nombreEstado)));

  protected readonly form = this.fb.nonNullable.group({
    id_cliente: [null as number | null, Validators.required],
    fecha_carga: [null as Date | null, Validators.required],
    fecha_prometido: [null as Date | null],
    id_estado: [null as number | null],
  });

  // Los ítems se arman en memoria (una fila por producto, con cálculo
  // bolsones <-> pallets en vivo) y recién se persisten todos juntos al
  // guardar el pedido: se comparan contra itemsOriginales para saber qué
  // crear, actualizar o borrar.
  protected readonly itemsFormArray = new FormArray<ItemPedidoForm>([]);
  private itemsOriginales: ItemPedido[] = [];

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    forkJoin({
      pedidos: this.api.list(),
      clientes: this.clientesApi.list(),
      estados: this.estadosApi.list(),
      productos: this.productosApi.list(),
    }).subscribe({
      next: ({ pedidos, clientes, estados, productos }) => {
        this.pedidos.set(pedidos);
        this.clientes.set(clientes);
        this.estados.set(estados);
        this.productos.set(productos);
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

  private crearFilaItem(item?: ItemPedido): ItemPedidoForm {
    const bolsonesPorPallet = item ? this.productoDe(item.id_producto)?.bolsones_por_pallet : null;
    const cantidadPallets =
      item && bolsonesPorPallet ? this.calcularPallets(item.cantidad_bolsones, bolsonesPorPallet) : null;

    const fila: ItemPedidoForm = this.fb.group({
      id_item_pedido: this.fb.control<number | null>(item?.id_item_pedido ?? null),
      id_producto: this.fb.control<number | null>(item?.id_producto ?? null, Validators.required),
      cantidad_bolsones: this.fb.control<number | null>(item?.cantidad_bolsones ?? null, [
        Validators.required,
        Validators.min(1),
      ]),
      cantidad_pallets: this.fb.control<number | null>(cantidadPallets),
    });

    // Bolsones <-> Pallets: cambiar uno recalcula el otro tomando como
    // referencia productos.bolsones_por_pallet del producto elegido en
    // la fila. emitEvent:false evita que el recálculo dispare este mismo
    // listener en bucle.
    fila.controls.id_producto.valueChanges.subscribe((idProducto) => {
      const bpp = this.productoDe(idProducto)?.bolsones_por_pallet;
      const bolsones = fila.controls.cantidad_bolsones.value;
      if (bpp && bolsones != null) {
        fila.controls.cantidad_pallets.setValue(this.calcularPallets(bolsones, bpp), { emitEvent: false });
      }
    });

    fila.controls.cantidad_bolsones.valueChanges.subscribe((bolsones) => {
      const bpp = this.productoDe(fila.controls.id_producto.value)?.bolsones_por_pallet;
      if (bpp && bolsones != null) {
        fila.controls.cantidad_pallets.setValue(this.calcularPallets(bolsones, bpp), { emitEvent: false });
      }
    });

    fila.controls.cantidad_pallets.valueChanges.subscribe((pallets) => {
      const bpp = this.productoDe(fila.controls.id_producto.value)?.bolsones_por_pallet;
      if (bpp && pallets != null) {
        fila.controls.cantidad_bolsones.setValue(this.calcularBolsones(pallets, bpp), { emitEvent: false });
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

  openCreate(): void {
    this.editingId.set(null);
    this.itemsOriginales = [];
    // La fecha de carga no se elige: siempre es la de hoy.
    this.form.reset({ fecha_carga: new Date() });
    this.itemsFormArray.clear();
    this.itemsFormArray.push(this.crearFilaItem());
    this.dialogVisible.set(true);
  }

  openEdit(pedido: Pedido): void {
    this.editingId.set(pedido.id_pedido);
    this.form.setValue({
      id_cliente: pedido.id_cliente,
      fecha_carga: new Date(pedido.fecha_carga),
      fecha_prometido: pedido.fecha_prometido ? new Date(pedido.fecha_prometido) : null,
      id_estado: pedido.id_estado,
    });
    this.itemsFormArray.clear();
    this.itemsOriginales = [];
    this.itemsLoading.set(true);
    this.dialogVisible.set(true);

    this.itemsApi.list(pedido.id_pedido).subscribe({
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
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los productos del pedido' });
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
      this.messageService.add({ severity: 'warn', summary: 'Faltan productos', detail: 'Agregá al menos un producto al pedido' });
      return;
    }

    this.saving.set(true);
    const raw = this.form.getRawValue();
    const headerDto = {
      id_cliente: raw.id_cliente!,
      fecha_carga: raw.fecha_carga!.toISOString().slice(0, 10),
      id_usuario: 1,
      ...(raw.fecha_prometido ? { fecha_prometido: raw.fecha_prometido.toISOString().slice(0, 10) } : {}),
    };

    const id = this.editingId();
    if (id) {
      this.api.update(id, { ...headerDto, id_estado: raw.id_estado! }).subscribe({
        next: () => this.guardarItems(id),
        error: () => this.onGuardarError(),
      });
    } else {
      this.api.create(headerDto).subscribe({
        next: (pedido) => this.guardarItems(pedido.id_pedido),
        error: () => this.onGuardarError(),
      });
    }
  }

  private guardarItems(idPedido: number): void {
    const filas = this.itemsFormArray.getRawValue();
    const idsActuales = new Set(filas.map((f) => f.id_item_pedido).filter((id): id is number => id != null));
    const aEliminar = this.itemsOriginales.filter((item) => !idsActuales.has(item.id_item_pedido));

    const operaciones = [
      ...aEliminar.map((item) => this.itemsApi.remove(idPedido, item.id_item_pedido)),
      ...filas.map((fila) => {
        const dto = { id_producto: fila.id_producto!, cantidad_bolsones: fila.cantidad_bolsones! };
        return fila.id_item_pedido
          ? this.itemsApi.update(idPedido, fila.id_item_pedido, dto)
          : this.itemsApi.create(idPedido, dto);
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

  confirmDelete(pedido: Pedido): void {
    this.confirmationService.confirm({
      header: 'Confirmar eliminación',
      message: `¿Eliminar el pedido #${pedido.id_pedido}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { severity: 'danger', label: 'Eliminar' },
      rejectButtonProps: { severity: 'secondary', label: 'Cancelar', outlined: true },
      accept: () => this.remove(pedido.id_pedido),
    });
  }

  private remove(id: number): void {
    this.api.remove(id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Pedido eliminado' });
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
