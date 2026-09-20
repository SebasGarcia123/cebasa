import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ProductosApiService } from '../../../core/api/productos-api.service';
import { Producto } from '../../../core/models/producto.model';

@Component({
  selector: 'app-productos-list',
  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
  ],
  templateUrl: './productos-list.html',
  styleUrl: './productos-list.scss',
})
export class ProductosList implements OnInit {
  private readonly api = inject(ProductosApiService);
  private readonly fb = inject(FormBuilder);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  protected readonly productos = signal<Producto[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly dialogVisible = signal(false);
  protected readonly editingId = signal<number | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    codigo_producto: ['', Validators.required],
    descripcion_producto: ['', Validators.required],
    bolsones_por_pallet: [null as number | null],
    peso_por_bolson: [null as number | null],
    precio_venta: [null as number | null, Validators.required],
    stock_actual: [0 as number | null],
    stock_minimo: [0 as number | null],
    id_estado: [1],
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.api.list().subscribe({
      next: (data) => {
        this.productos.set(data);
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
    this.form.reset({ stock_actual: 0, stock_minimo: 0, id_estado: 1 });
    this.dialogVisible.set(true);
  }

  openEdit(producto: Producto): void {
    this.editingId.set(producto.id_producto);
    this.form.setValue({
      codigo_producto: producto.codigo_producto,
      descripcion_producto: producto.descripcion_producto,
      bolsones_por_pallet: producto.bolsones_por_pallet,
      peso_por_bolson: producto.peso_por_bolson,
      precio_venta: producto.precio_venta,
      stock_actual: producto.stock_actual,
      stock_minimo: producto.stock_minimo,
      id_estado: producto.id_estado,
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
      codigo_producto: raw.codigo_producto,
      descripcion_producto: raw.descripcion_producto,
      precio_venta: raw.precio_venta!,
      id_estado: raw.id_estado,
      ...(raw.bolsones_por_pallet != null ? { bolsones_por_pallet: raw.bolsones_por_pallet } : {}),
      ...(raw.peso_por_bolson != null ? { peso_por_bolson: raw.peso_por_bolson } : {}),
      ...(raw.stock_actual != null ? { stock_actual: raw.stock_actual } : {}),
      ...(raw.stock_minimo != null ? { stock_minimo: raw.stock_minimo } : {}),
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

  confirmDelete(producto: Producto): void {
    this.confirmationService.confirm({
      header: 'Confirmar eliminación',
      message: `¿Eliminar el producto "${producto.descripcion_producto}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { severity: 'danger', label: 'Eliminar' },
      rejectButtonProps: { severity: 'secondary', label: 'Cancelar', outlined: true },
      accept: () => this.remove(producto.id_producto),
    });
  }

  private remove(id: number): void {
    this.api.remove(id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Producto eliminado' });
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
