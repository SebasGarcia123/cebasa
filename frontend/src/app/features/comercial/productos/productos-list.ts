import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ProductosApiService } from '../../../core/api/productos-api.service';
import { ArchivoAdjuntoApiService } from '../../../core/api/archivo-adjunto-api.service';
import { EstadosApiService } from '../../../core/api/estados-api.service';
import { Producto } from '../../../core/models/producto.model';
import { ArchivoAdjunto } from '../../../core/models/archivo-adjunto.model';
import { Estado } from '../../../core/models/estado.model';

const ESTADOS_PRODUCTO = new Set(['Activo', 'Anulado']);

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
    SelectModule,
    CheckboxModule,
    IconFieldModule,
    InputIconModule,
    FormsModule,
  ],
  templateUrl: './productos-list.html',
  styleUrl: './productos-list.scss',
})
export class ProductosList implements OnInit {
  private readonly api = inject(ProductosApiService);
  protected readonly archivoAdjuntoApi = inject(ArchivoAdjuntoApiService);
  private readonly estadosApi = inject(EstadosApiService);
  private readonly fb = inject(FormBuilder);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  protected readonly productos = signal<Producto[]>([]);
  protected readonly estados = signal<Estado[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly dialogVisible = signal(false);
  protected readonly editingId = signal<number | null>(null);

  protected readonly fotoActual = signal<ArchivoAdjunto | null>(null);
  protected readonly fotoUploading = signal(false);

  // Al crear no se elige estado: el sistema lo pone en "Activo". El
  // selector de estado solo se muestra al editar, y restringido a
  // Activo/Anulado.
  protected readonly estadosProducto = computed(() => this.estados().filter((e) => ESTADOS_PRODUCTO.has(e.nombreEstado)));

  // Buscador (código/nombre) + checkbox "ver anulados": por default la
  // lista solo muestra productos Activos. Es la única forma de encontrar
  // (y desde ahí, reactivar) un producto anulado.
  protected readonly busqueda = signal('');
  protected readonly verAnulados = signal(false);

  protected readonly productosFiltrados = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    const verAnulados = this.verAnulados();
    return this.productos().filter((producto) => {
      if (!verAnulados && producto.estados?.nombreEstado === 'Anulado') {
        return false;
      }
      if (!texto) {
        return true;
      }
      return (
        producto.codigo_producto.toLowerCase().includes(texto) ||
        producto.descripcion_producto.toLowerCase().includes(texto)
      );
    });
  });

  protected readonly form = this.fb.nonNullable.group({
    codigo_producto: ['', Validators.required],
    descripcion_producto: ['', Validators.required],
    bolsones_por_pallet: [null as number | null],
    peso_por_bolson: [null as number | null],
    precio_venta: [null as number | null, Validators.required],
    stock_actual: [0 as number | null],
    stock_minimo: [0 as number | null],
    id_estado: [null as number | null],
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    forkJoin({
      productos: this.api.list(),
      estados: this.estadosApi.list(),
    }).subscribe({
      next: ({ productos, estados }) => {
        this.productos.set(productos);
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
    this.fotoActual.set(null);
    this.form.reset({ stock_actual: 0, stock_minimo: 0 });
    this.dialogVisible.set(true);
  }

  openEdit(producto: Producto): void {
    this.editingId.set(producto.id_producto);
    this.fotoActual.set(producto.archivo_adjunto);
    this.form.setValue({
      codigo_producto: producto.codigo_producto,
      descripcion_producto: producto.descripcion_producto,
      bolsones_por_pallet: producto.bolsones_por_pallet,
      // precio_venta y peso_por_bolson son Decimal en la base: Prisma los
      // serializa como string en el JSON, no como number. Si no se
      // convierten acá, un guardado sin tocar esos campos manda el string
      // de vuelta y el backend lo rechaza (@IsNumber real, no string).
      peso_por_bolson: producto.peso_por_bolson != null ? Number(producto.peso_por_bolson) : null,
      precio_venta: Number(producto.precio_venta),
      stock_actual: producto.stock_actual,
      stock_minimo: producto.stock_minimo,
      id_estado: producto.id_estado,
    });
    this.dialogVisible.set(true);
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
  }

  onFotoSeleccionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }

    const anterior = this.fotoActual();
    this.fotoUploading.set(true);
    this.archivoAdjuntoApi.upload(file).subscribe({
      next: (archivo) => {
        this.fotoUploading.set(false);
        this.fotoActual.set(archivo);
        if (anterior) {
          this.archivoAdjuntoApi.remove(anterior.id_archivo_adjunto).subscribe();
        }
      },
      error: (error: HttpErrorResponse) => {
        this.fotoUploading.set(false);
        const detail = typeof error.error?.message === 'string' ? error.error.message : 'No se pudo subir la foto';
        this.messageService.add({ severity: 'error', summary: 'Error', detail });
      },
    });
  }

  quitarFoto(): void {
    const actual = this.fotoActual();
    this.fotoActual.set(null);
    if (actual) {
      this.archivoAdjuntoApi.remove(actual.id_archivo_adjunto).subscribe();
    }
  }

  fotoUrl(): string | null {
    const archivo = this.fotoActual();
    return archivo ? this.archivoAdjuntoApi.fileUrl(archivo.id_archivo_adjunto) : null;
  }

  save(): void {
    if (this.form.invalid || this.saving()) {
      return;
    }

    this.saving.set(true);
    const raw = this.form.getRawValue();
    const foto = this.fotoActual();
    const dto = {
      codigo_producto: raw.codigo_producto,
      descripcion_producto: raw.descripcion_producto,
      precio_venta: Number(raw.precio_venta),
      id_archivo_adjunto: foto?.id_archivo_adjunto ?? null,
      ...(raw.bolsones_por_pallet != null ? { bolsones_por_pallet: raw.bolsones_por_pallet } : {}),
      ...(raw.peso_por_bolson != null ? { peso_por_bolson: Number(raw.peso_por_bolson) } : {}),
      ...(raw.stock_actual != null ? { stock_actual: raw.stock_actual } : {}),
      ...(raw.stock_minimo != null ? { stock_minimo: raw.stock_minimo } : {}),
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
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        const detail = typeof error.error?.message === 'string' ? error.error.message : 'No se pudo guardar';
        this.messageService.add({ severity: 'error', summary: 'Error', detail });
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
