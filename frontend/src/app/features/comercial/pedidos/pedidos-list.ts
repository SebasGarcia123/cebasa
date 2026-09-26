import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
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
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PedidosApiService } from '../../../core/api/pedidos-api.service';
import { ItemPedidoApiService } from '../../../core/api/item-pedido-api.service';
import { ClientesApiService } from '../../../core/api/clientes-api.service';
import { ProductosApiService } from '../../../core/api/productos-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Pedido } from '../../../core/models/pedido.model';
import { ItemPedido } from '../../../core/models/item-pedido.model';
import { Cliente } from '../../../core/models/cliente.model';
import { Producto } from '../../../core/models/producto.model';

const ESTADO_PENDIENTE = 'Pendiente';
const ESTADO_FACTURADO = 'Facturado';

type ItemPedidoForm = FormGroup<{
  id_item_pedido: FormControl<number | null>;
  id_producto: FormControl<number | null>;
  id_producto_codigo: FormControl<number | null>;
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
    TextareaModule,
    TooltipModule,
  ],
  templateUrl: './pedidos-list.html',
  styleUrl: './pedidos-list.scss',
})
export class PedidosList implements OnInit {
  private readonly api = inject(PedidosApiService);
  private readonly itemsApi = inject(ItemPedidoApiService);
  private readonly clientesApi = inject(ClientesApiService);
  private readonly productosApi = inject(ProductosApiService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  protected readonly pedidos = signal<Pedido[]>([]);
  protected readonly clientes = signal<Cliente[]>([]);
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

  // Facturar/anular es de Logística, no de quien carga el pedido: se
  // oculta client-side sin el permiso, la barrera real está en el backend.
  protected readonly puedeFacturar = computed(() => {
    const user = this.authService.currentUser();
    return !!user && (user.es_administrador || user.permisos.includes('comercial.pedidos_facturar'));
  });

  protected readonly saving = signal(false);
  protected readonly itemsLoading = signal(false);
  protected readonly dialogVisible = signal(false);
  protected readonly editingId = signal<number | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    id_cliente: [null as number | null, Validators.required],
    fecha_carga: [null as Date | null, Validators.required],
    fecha_prometido: [null as Date | null],
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
      productos: this.productosApi.list(),
    }).subscribe({
      next: ({ pedidos, clientes, productos }) => {
        this.pedidos.set(pedidos);
        this.clientes.set(clientes);
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
      // Selector duplicado (Código y Producto eligen el mismo id_producto,
      // pero son dos <p-select> con distinto optionLabel). Compartir un
      // único FormControl entre dos p-select no sincronizaba la vista del
      // otro de forma confiable, así que se mantienen dos controles
      // sincronizados a mano, igual que bolsones <-> pallets más abajo.
      id_producto_codigo: this.fb.control<number | null>(item?.id_producto ?? null),
      cantidad_bolsones: this.fb.control<number | null>(item?.cantidad_bolsones ?? null, [
        Validators.required,
        Validators.min(1),
      ]),
      cantidad_pallets: this.fb.control<number | null>(cantidadPallets),
    });

    const sincronizarProducto = (idProducto: number | null, origen: 'principal' | 'codigo') => {
      if (origen === 'principal') {
        fila.controls.id_producto_codigo.setValue(idProducto, { emitEvent: false });
      } else {
        fila.controls.id_producto.setValue(idProducto, { emitEvent: false });
      }
      const bpp = this.productoDe(idProducto)?.bolsones_por_pallet;
      const bolsones = fila.controls.cantidad_bolsones.value;
      if (bpp && bolsones != null) {
        fila.controls.cantidad_pallets.setValue(this.calcularPallets(bolsones, bpp), { emitEvent: false });
      }
    };

    // Bolsones <-> Pallets: cambiar uno recalcula el otro tomando como
    // referencia productos.bolsones_por_pallet del producto elegido en
    // la fila. emitEvent:false evita que el recálculo dispare este mismo
    // listener en bucle.
    fila.controls.id_producto.valueChanges.subscribe((idProducto) => sincronizarProducto(idProducto, 'principal'));
    fila.controls.id_producto_codigo.valueChanges.subscribe((idProducto) => sincronizarProducto(idProducto, 'codigo'));

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

  // No se puede editar un pedido una vez facturado (ver
  // PedidosService.assertEditable en el backend).
  protected puedeEditar(pedido: Pedido): boolean {
    return pedido.estados?.nombreEstado === ESTADO_PENDIENTE;
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
      id_usuario: this.authService.currentUser()?.id_usuario ?? 0,
      ...(raw.fecha_prometido ? { fecha_prometido: raw.fecha_prometido.toISOString().slice(0, 10) } : {}),
    };

    const id = this.editingId();
    if (id) {
      this.api.update(id, headerDto).subscribe({
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

  confirmFacturar(pedido: Pedido): void {
    this.confirmationService.confirm({
      header: 'Confirmar facturación',
      message: `¿Desea facturar el pedido #${pedido.id_pedido}? Esta acción enviará la factura al cliente.`,
      icon: 'pi pi-check-circle',
      acceptButtonProps: { label: 'Facturar' },
      rejectButtonProps: { severity: 'secondary', label: 'Cancelar', outlined: true },
      accept: () => {
        this.api.facturar(pedido.id_pedido).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Facturado', detail: 'El pedido fue facturado' });
            this.load();
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo facturar el pedido' });
          },
        });
      },
    });
  }

  protected readonly anularDialogVisible = signal(false);
  protected readonly anularSaving = signal(false);
  private pedidoAAnular: Pedido | null = null;

  protected readonly anularForm = this.fb.nonNullable.group({
    motivo: [''],
    nro_nota_debito: [''],
  });

  // Cargado: pide motivo. Facturado: pide n° de nota de débito (la nota
  // en sí se emite por fuera del sistema, acá solo queda la referencia).
  protected requiereNotaDebito(): boolean {
    return this.pedidoAAnular?.estados?.nombreEstado === ESTADO_FACTURADO;
  }

  abrirAnular(pedido: Pedido): void {
    this.pedidoAAnular = pedido;
    this.anularForm.reset();
    this.anularDialogVisible.set(true);
  }

  cerrarAnular(): void {
    this.anularDialogVisible.set(false);
  }

  confirmarAnular(): void {
    if (!this.pedidoAAnular || this.anularSaving()) {
      return;
    }
    const raw = this.anularForm.getRawValue();
    const dto = this.requiereNotaDebito() ? { nro_nota_debito: raw.nro_nota_debito } : { motivo: raw.motivo };
    if (!dto.motivo && !dto.nro_nota_debito) {
      return;
    }

    this.anularSaving.set(true);
    this.api.anular(this.pedidoAAnular.id_pedido, dto).subscribe({
      next: () => {
        this.anularSaving.set(false);
        this.anularDialogVisible.set(false);
        this.messageService.add({ severity: 'success', summary: 'Anulado', detail: 'El pedido fue anulado' });
        this.load();
      },
      error: (error: HttpErrorResponse) => {
        this.anularSaving.set(false);
        const detail = typeof error.error?.message === 'string' ? error.error.message : 'No se pudo anular el pedido';
        this.messageService.add({ severity: 'error', summary: 'Error', detail });
      },
    });
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
