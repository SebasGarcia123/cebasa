import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageService } from 'primeng/api';
import { LoteProdApiService } from '../../../core/api/lote-prod-api.service';
import { PalletApiService } from '../../../core/api/pallet-api.service';
import { ProductosApiService } from '../../../core/api/productos-api.service';
import { LineasApiService } from '../../../core/api/lineas-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { LoteProd } from '../../../core/models/lote-prod.model';
import { Pallet } from '../../../core/models/pallet.model';
import { Producto } from '../../../core/models/producto.model';
import { Linea } from '../../../core/models/linea.model';

const ESTADO_ABIERTO = 'Pendiente';
const ESTADO_RECHAZADO = 'Rechazado';
const TIPO_PRODUCTO_BOBINA = 'Bobina';

interface ResumenProducto {
  descripcion: string;
  pallets: number;
  bolsones: number;
}

// Pantalla del Operario de Producción Caseros: pensada para PC o
// tablet en planta. Solo ve lotes activos (abiertos o rechazados, que
// son los editables) y carga pallets ahí — abrir/cerrar el turno sigue
// siendo tarea del Jefe (ver LotesProdList), que además conserva su
// forma de cargar productos a mano (item_prod) para lo que no pase por
// pallets individuales.
@Component({
  selector: 'app-operario-caseros-list',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    SelectModule,
    InputNumberModule,
  ],
  templateUrl: './operario-caseros-list.html',
  styleUrl: './operario-caseros-list.scss',
})
export class OperarioCaserosList implements OnInit {
  private readonly api = inject(LoteProdApiService);
  private readonly palletsApi = inject(PalletApiService);
  private readonly productosApi = inject(ProductosApiService);
  private readonly lineasApi = inject(LineasApiService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);

  protected readonly lotesTodos = signal<LoteProd[]>([]);
  protected readonly lotesActivos = computed(() =>
    this.lotesTodos().filter(
      (l) =>
        l.deposito?.planta === 'CASEROS' &&
        (l.estados?.nombreEstado === ESTADO_ABIERTO || l.estados?.nombreEstado === ESTADO_RECHAZADO),
    ),
  );
  protected readonly productos = signal<Producto[]>([]);
  protected readonly lineas = signal<Linea[]>([]);
  protected readonly loading = signal(false);

  // Las bobinas son un producto exclusivo de Baradero: no se cargan
  // desde esta pantalla.
  protected readonly productosPallet = computed(() =>
    this.productos().filter((p) => p.tipo_producto?.descripcion !== TIPO_PRODUCTO_BOBINA),
  );

  protected readonly nombreOperario = computed(() => this.authService.currentUser()?.nombre_usuario ?? '—');
  protected readonly hoy = new Date();

  protected readonly loteActivo = signal<LoteProd | null>(null);
  protected readonly detalleVisible = signal(false);
  protected readonly pallets = signal<Pallet[]>([]);
  protected readonly palletsLoading = signal(false);

  // Si en el mismo lote se cargaron pallets de más de un producto,
  // salen varias filas de resumen (una por producto), cada una con su
  // cantidad de pallets y bolsones totales.
  protected readonly resumenPorProducto = computed<ResumenProducto[]>(() => {
    const mapa = new Map<string, ResumenProducto>();
    for (const p of this.pallets()) {
      const descripcion = p.productos?.descripcion_producto ?? '—';
      const actual = mapa.get(descripcion) ?? { descripcion, pallets: 0, bolsones: 0 };
      actual.pallets += 1;
      actual.bolsones += p.cantidad_bolsones;
      mapa.set(descripcion, actual);
    }
    return [...mapa.values()];
  });
  protected readonly totalBolsones = computed(() => this.pallets().reduce((acc, p) => acc + p.cantidad_bolsones, 0));

  protected readonly formVisible = signal(false);
  protected readonly palletSaving = signal(false);
  protected readonly palletForm = this.fb.nonNullable.group({
    id_producto: [null as number | null, Validators.required],
    // Selector duplicado (Producto y Código eligen el mismo id_producto,
    // pero son dos <p-select> con distinto optionLabel para que se vean
    // los dos datos). No pueden quedar desincronizados: elegir uno
    // autocompleta el otro, igual que en OperarioBaraderoList.
    id_producto_codigo: [null as number | null],
    id_lineas: [null as number | null, Validators.required],
    cantidad_bolsones: [null as number | null, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    this.load();
    const sincronizarProducto = (idProducto: number | null, origen: 'producto' | 'codigo') => {
      const destino = origen === 'producto' ? this.palletForm.controls.id_producto_codigo : this.palletForm.controls.id_producto;
      destino.setValue(idProducto, { emitEvent: false });
      // Un pallet completo trae, por catálogo, esta cantidad de
      // bolsones — se sugiere como default pero se puede pisar a mano
      // si el pallet quedó incompleto.
      const bolsonesPorPallet = this.productos().find((p) => p.id_producto === idProducto)?.bolsones_por_pallet;
      if (bolsonesPorPallet) {
        this.palletForm.controls.cantidad_bolsones.setValue(bolsonesPorPallet, { emitEvent: false });
      }
    };
    this.palletForm.controls.id_producto.valueChanges.subscribe((v) => sincronizarProducto(v, 'producto'));
    this.palletForm.controls.id_producto_codigo.valueChanges.subscribe((v) => sincronizarProducto(v, 'codigo'));
  }

  private load(): void {
    this.loading.set(true);
    forkJoin({
      lotes: this.api.list(),
      productos: this.productosApi.list(),
      lineas: this.lineasApi.list(),
    }).subscribe({
      next: ({ lotes, productos, lineas }) => {
        this.lotesTodos.set(lotes);
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

  abrirLote(lote: LoteProd): void {
    this.loteActivo.set(lote);
    this.formVisible.set(false);
    this.detalleVisible.set(true);
    this.loadPallets();
  }

  cerrarDetalle(): void {
    this.detalleVisible.set(false);
  }

  private loadPallets(): void {
    const lote = this.loteActivo();
    if (!lote) {
      return;
    }
    this.palletsLoading.set(true);
    this.palletsApi.list(lote.id_lote).subscribe({
      next: (data) => {
        this.pallets.set(data);
        this.palletsLoading.set(false);
      },
      error: () => {
        this.palletsLoading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los pallets' });
      },
    });
  }

  abrirForm(): void {
    this.palletForm.reset();
    this.formVisible.set(true);
  }

  cancelarForm(): void {
    this.formVisible.set(false);
  }

  generarPallet(): void {
    const lote = this.loteActivo();
    if (this.palletForm.invalid || this.palletSaving() || !lote) {
      return;
    }
    this.palletSaving.set(true);
    const raw = this.palletForm.getRawValue();
    const dto = {
      id_producto: raw.id_producto!,
      id_lineas: raw.id_lineas!,
      cantidad_bolsones: raw.cantidad_bolsones!,
    };

    this.palletsApi.create(lote.id_lote, dto).subscribe({
      next: (pallet) => {
        this.palletSaving.set(false);
        this.formVisible.set(false);
        this.loadPallets();
        this.verRotulo(pallet);
        this.messageService.add({
          severity: 'success',
          summary: 'Pallet generado',
          detail: `Lote ${pallet.numero_lote}`,
        });
      },
      error: (error: HttpErrorResponse) => {
        this.palletSaving.set(false);
        const detail = typeof error.error?.message === 'string' ? error.error.message : 'No se pudo generar el pallet';
        this.messageService.add({ severity: 'error', summary: 'Error', detail });
      },
    });
  }

  verRotulo(pallet: Pallet): void {
    const lote = this.loteActivo();
    if (!lote) {
      return;
    }
    this.palletsApi.rotulo(lote.id_lote, pallet.id_pallet).subscribe({
      next: (pdf) => window.open(URL.createObjectURL(pdf), '_blank'),
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo abrir el rótulo' });
      },
    });
  }

  eliminarPallet(pallet: Pallet): void {
    const lote = this.loteActivo();
    if (!lote) {
      return;
    }
    this.palletsApi.remove(lote.id_lote, pallet.id_pallet).subscribe({
      next: () => this.loadPallets(),
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el pallet' });
      },
    });
  }
}
