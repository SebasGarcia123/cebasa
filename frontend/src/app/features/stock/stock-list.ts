import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { StockApiService } from '../../core/api/stock-api.service';
import { AuthService } from '../../core/auth/auth.service';
import { StockInsumo, StockProducto } from '../../core/models/stock-item.model';

type Vista = 'productos' | 'insumos';

interface FilaStock {
  id: number;
  codigo: string;
  descripcion: string;
  stock_actual: number;
  stock_minimo: number;
}

@Component({
  selector: 'app-stock-list',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputNumberModule,
    TextareaModule,
    SelectButtonModule,
    TooltipModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
  ],
  templateUrl: './stock-list.html',
  styleUrl: './stock-list.scss',
})
export class StockList implements OnInit {
  private readonly api = inject(StockApiService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);

  protected readonly vistaOpciones: { label: string; value: Vista }[] = [
    { label: 'Productos', value: 'productos' },
    { label: 'Insumos', value: 'insumos' },
  ];
  protected readonly vista = signal<Vista>('productos');

  protected readonly productos = signal<StockProducto[]>([]);
  protected readonly insumos = signal<StockInsumo[]>([]);
  protected readonly loading = signal(false);

  protected readonly filas = computed<FilaStock[]>(() =>
    this.vista() === 'productos'
      ? this.productos().map((p) => ({
          id: p.id_producto,
          codigo: p.codigo_producto,
          descripcion: p.descripcion_producto,
          stock_actual: p.stock_actual,
          stock_minimo: p.stock_minimo,
        }))
      : this.insumos().map((i) => ({
          id: i.id_insumo,
          codigo: i.codigo_insumo,
          descripcion: i.nombre_insumo,
          stock_actual: i.stock_actual,
          stock_minimo: i.stock_minimo,
        })),
  );

  protected readonly busqueda = signal('');

  protected readonly filasFiltradas = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    if (!texto) {
      return this.filas();
    }
    return this.filas().filter(
      (fila) => fila.codigo.toLowerCase().includes(texto) || fila.descripcion.toLowerCase().includes(texto),
    );
  });

  // "Todos pueden consultar" el stock, pero el ajuste (el lápiz) es
  // responsabilidad de Logística: se oculta client-side si el usuario no
  // tiene el permiso, aunque la barrera real está en el backend.
  protected readonly puedeAjustar = computed(() => {
    const user = this.authService.currentUser();
    return !!user && (user.es_administrador || user.permisos.includes('stock.ajustar'));
  });

  protected readonly ajusteDialogVisible = signal(false);
  protected readonly ajusteSaving = signal(false);
  protected readonly filaActiva = signal<FilaStock | null>(null);

  protected readonly ajusteForm = this.fb.nonNullable.group({
    cantidad_nueva: [0, [Validators.required, Validators.min(0)]],
    motivo: ['', [Validators.required, Validators.maxLength(255)]],
  });

  ngOnInit(): void {
    this.load();
  }

  cambiarVista(vista: Vista): void {
    this.vista.set(vista);
  }

  private load(): void {
    this.loading.set(true);
    this.api.listProductos().subscribe({
      next: (data) => {
        this.productos.set(data);
        this.cargarInsumos();
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el stock de productos' });
      },
    });
  }

  private cargarInsumos(): void {
    this.api.listInsumos().subscribe({
      next: (data) => {
        this.insumos.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el stock de insumos' });
      },
    });
  }

  abrirAjuste(fila: FilaStock): void {
    this.filaActiva.set(fila);
    this.ajusteForm.reset({ cantidad_nueva: fila.stock_actual, motivo: '' });
    this.ajusteDialogVisible.set(true);
  }

  cerrarAjuste(): void {
    this.ajusteDialogVisible.set(false);
  }

  guardarAjuste(): void {
    const fila = this.filaActiva();
    if (this.ajusteForm.invalid || this.ajusteSaving() || !fila) {
      return;
    }

    this.ajusteSaving.set(true);
    const dto = this.ajusteForm.getRawValue();
    const request$ =
      this.vista() === 'productos' ? this.api.ajustarProducto(fila.id, dto) : this.api.ajustarInsumo(fila.id, dto);

    request$.subscribe({
      next: () => {
        this.ajusteSaving.set(false);
        this.ajusteDialogVisible.set(false);
        this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Stock ajustado correctamente' });
        this.load();
      },
      error: (error: HttpErrorResponse) => {
        this.ajusteSaving.set(false);
        const detail = typeof error.error?.message === 'string' ? error.error.message : 'No se pudo ajustar el stock';
        this.messageService.add({ severity: 'error', summary: 'Error', detail });
      },
    });
  }
}
