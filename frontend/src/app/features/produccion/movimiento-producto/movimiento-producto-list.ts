import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ConfirmationService, MessageService } from 'primeng/api';
import { MovimientoProductoApiService } from '../../../core/api/movimiento-producto-api.service';
import { ProductosApiService } from '../../../core/api/productos-api.service';
import { TipoMovimientoApiService } from '../../../core/api/tipo-movimiento-api.service';
import { DepositosApiService } from '../../../core/api/depositos-api.service';
import { EstadosApiService } from '../../../core/api/estados-api.service';
import { MovimientoProducto } from '../../../core/models/movimiento-producto.model';
import { Producto } from '../../../core/models/producto.model';
import { TipoMovimiento } from '../../../core/models/tipo-movimiento.model';
import { Deposito } from '../../../core/models/deposito.model';
import { Estado } from '../../../core/models/estado.model';

const ESTADOS_MOVIMIENTO_PRODUCTO = new Set(['Activo', 'Anulado']);

@Component({
  selector: 'app-movimiento-producto-list',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    DatePickerModule,
  ],
  templateUrl: './movimiento-producto-list.html',
  styleUrl: './movimiento-producto-list.scss',
})
export class MovimientoProductoList implements OnInit {
  private readonly api = inject(MovimientoProductoApiService);
  private readonly productosApi = inject(ProductosApiService);
  private readonly tipoMovimientoApi = inject(TipoMovimientoApiService);
  private readonly depositosApi = inject(DepositosApiService);
  private readonly estadosApi = inject(EstadosApiService);
  private readonly fb = inject(FormBuilder);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  protected readonly items = signal<MovimientoProducto[]>([]);
  protected readonly productos = signal<Producto[]>([]);
  protected readonly tiposMovimiento = signal<TipoMovimiento[]>([]);
  protected readonly depositos = signal<Deposito[]>([]);
  protected readonly estados = signal<Estado[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly dialogVisible = signal(false);
  protected readonly editingId = signal<number | null>(null);

  // Al crear no se elige estado: el sistema lo pone en "Activo". El
  // selector de estado solo se muestra al editar, y restringido a
  // Activo/Anulado.
  protected readonly estadosMovimientoProducto = computed(() =>
    this.estados().filter((e) => ESTADOS_MOVIMIENTO_PRODUCTO.has(e.nombreEstado)),
  );

  protected readonly form = this.fb.nonNullable.group({
    id_producto: [null as number | null, Validators.required],
    id_tipo_movimiento: [null as number | null, Validators.required],
    cantidad: [null as number | null, [Validators.required, Validators.min(1)]],
    fecha_movimiento: [null as Date | null, Validators.required],
    id_deposito_origen: [null as number | null],
    id_deposito_destino: [null as number | null],
    observaciones: [''],
    motivo: [''],
    id_estado: [null as number | null],
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    forkJoin({
      items: this.api.list(),
      productos: this.productosApi.list(),
      tiposMovimiento: this.tipoMovimientoApi.list(),
      depositos: this.depositosApi.list(),
      estados: this.estadosApi.list(),
    }).subscribe({
      next: ({ items, productos, tiposMovimiento, depositos, estados }) => {
        this.items.set(items);
        this.productos.set(productos);
        this.tiposMovimiento.set(tiposMovimiento);
        this.depositos.set(depositos);
        this.estados.set(estados);
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

  openEdit(item: MovimientoProducto): void {
    this.editingId.set(item.id_movimiento_producto);
    this.form.setValue({
      id_producto: item.id_producto,
      id_tipo_movimiento: item.id_tipo_movimiento,
      cantidad: item.cantidad,
      fecha_movimiento: new Date(item.fecha_movimiento),
      id_deposito_origen: item.id_deposito_origen,
      id_deposito_destino: item.id_deposito_destino,
      observaciones: item.observaciones ?? '',
      motivo: item.motivo ?? '',
      id_estado: item.id_estado,
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
      id_producto: raw.id_producto!,
      id_tipo_movimiento: raw.id_tipo_movimiento!,
      cantidad: raw.cantidad!,
      fecha_movimiento: raw.fecha_movimiento!.toISOString().slice(0, 10),
      ...(raw.id_deposito_origen ? { id_deposito_origen: raw.id_deposito_origen } : {}),
      ...(raw.id_deposito_destino ? { id_deposito_destino: raw.id_deposito_destino } : {}),
      ...(raw.observaciones ? { observaciones: raw.observaciones } : {}),
      ...(raw.motivo ? { motivo: raw.motivo } : {}),
    };
    const id = this.editingId();
    const request$ = id ? this.api.update(id, { ...dto, id_estado: raw.id_estado! }) : this.api.create(dto);

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

  confirmDelete(item: MovimientoProducto): void {
    this.confirmationService.confirm({
      header: 'Confirmar eliminación',
      message: `¿Eliminar el movimiento #${item.id_movimiento_producto}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { severity: 'danger', label: 'Eliminar' },
      rejectButtonProps: { severity: 'secondary', label: 'Cancelar', outlined: true },
      accept: () => this.remove(item.id_movimiento_producto),
    });
  }

  private remove(id: number): void {
    this.api.remove(id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Movimiento eliminado' });
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
