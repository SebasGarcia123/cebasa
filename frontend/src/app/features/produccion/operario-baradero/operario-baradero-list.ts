import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
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
import { BobinaApiService } from '../../../core/api/bobina-api.service';
import { ProductosApiService } from '../../../core/api/productos-api.service';
import { TipoBobinaApiService } from '../../../core/api/tipo-bobina-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { LoteProd } from '../../../core/models/lote-prod.model';
import { Bobina } from '../../../core/models/bobina.model';
import { Producto } from '../../../core/models/producto.model';
import { TipoBobina } from '../../../core/models/tipo-bobina.model';

const ESTADO_ABIERTO = 'Pendiente';
const ESTADO_RECHAZADO = 'Rechazado';
const TIPO_PRODUCTO_BOBINA = 'Bobina';

interface ResumenTipo {
  descripcion: string;
  cantidad: number;
  kilos: number;
}

// Pantalla del Operario de Producción Baradero: pensada para
// PC o tablet en planta. Solo ve lotes activos (abiertos o rechazados,
// que son los editables) y carga bobinas ahí — abrir/cerrar el turno
// es tarea del Jefe (ver LotesBaraderoList).
@Component({
  selector: 'app-operario-baradero-list',
  imports: [
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    SelectModule,
    InputNumberModule,
  ],
  templateUrl: './operario-baradero-list.html',
  styleUrl: './operario-baradero-list.scss',
})
export class OperarioBaraderoList implements OnInit {
  private readonly api = inject(LoteProdApiService);
  private readonly bobinasApi = inject(BobinaApiService);
  private readonly productosApi = inject(ProductosApiService);
  private readonly tipoBobinaApi = inject(TipoBobinaApiService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);

  protected readonly lotesTodos = signal<LoteProd[]>([]);
  protected readonly lotesActivos = computed(() =>
    this.lotesTodos().filter(
      (l) =>
        l.deposito?.planta === 'BARADERO' &&
        (l.estados?.nombreEstado === ESTADO_ABIERTO || l.estados?.nombreEstado === ESTADO_RECHAZADO),
    ),
  );
  protected readonly productos = signal<Producto[]>([]);
  protected readonly tiposBobina = signal<TipoBobina[]>([]);
  protected readonly loading = signal(false);

  protected readonly productosBobina = computed(() =>
    this.productos().filter((p) => p.tipo_producto?.descripcion === TIPO_PRODUCTO_BOBINA),
  );

  protected readonly nombreOperario = computed(() => this.authService.currentUser()?.nombre_usuario ?? '—');
  protected readonly hoy = new Date();

  protected readonly loteActivo = signal<LoteProd | null>(null);
  protected readonly detalleVisible = signal(false);
  protected readonly bobinas = signal<Bobina[]>([]);
  protected readonly bobinasLoading = signal(false);

  // Si en el mismo lote se cargaron dos tipos de bobina distintos,
  // salen dos filas de resumen (una por tipo), cada una con su
  // cantidad y kilos totales — como pidió el usuario.
  protected readonly resumenPorTipo = computed<ResumenTipo[]>(() => {
    const mapa = new Map<string, ResumenTipo>();
    for (const b of this.bobinas()) {
      const descripcion = b.tipo_bobina?.descripcion ?? '—';
      const actual = mapa.get(descripcion) ?? { descripcion, cantidad: 0, kilos: 0 };
      actual.cantidad += 1;
      actual.kilos += Number(b.peso);
      mapa.set(descripcion, actual);
    }
    return [...mapa.values()];
  });
  protected readonly totalKilos = computed(() => this.bobinas().reduce((acc, b) => acc + Number(b.peso), 0));

  protected readonly formVisible = signal(false);
  protected readonly bobinaSaving = signal(false);
  protected readonly bobinaForm = this.fb.nonNullable.group({
    id_tipo_bobina: [null as number | null, Validators.required],
    id_producto: [null as number | null, Validators.required],
    // Selector duplicado (Producto y Código eligen el mismo id_producto,
    // pero son dos <p-select> con distinto optionLabel para que se vean
    // los dos datos). No pueden quedar desincronizados: elegir uno
    // autocompleta el otro, igual que en PedidosList.
    id_producto_codigo: [null as number | null],
    peso: [null as number | null, [Validators.required, Validators.min(0.01)]],
    gramaje: [null as number | null, [Validators.required, Validators.min(0.01)]],
  });

  ngOnInit(): void {
    this.load();
    const sincronizar = (idProducto: number | null, origen: 'producto' | 'codigo') => {
      const destino = origen === 'producto' ? this.bobinaForm.controls.id_producto_codigo : this.bobinaForm.controls.id_producto;
      destino.setValue(idProducto, { emitEvent: false });
    };
    this.bobinaForm.controls.id_producto.valueChanges.subscribe((v) => sincronizar(v, 'producto'));
    this.bobinaForm.controls.id_producto_codigo.valueChanges.subscribe((v) => sincronizar(v, 'codigo'));
  }

  private load(): void {
    this.loading.set(true);
    forkJoin({
      lotes: this.api.list(),
      productos: this.productosApi.list(),
      tiposBobina: this.tipoBobinaApi.list(),
    }).subscribe({
      next: ({ lotes, productos, tiposBobina }) => {
        this.lotesTodos.set(lotes);
        this.productos.set(productos);
        this.tiposBobina.set(tiposBobina);
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
    this.loadBobinas();
  }

  cerrarDetalle(): void {
    this.detalleVisible.set(false);
  }

  private loadBobinas(): void {
    const lote = this.loteActivo();
    if (!lote) {
      return;
    }
    this.bobinasLoading.set(true);
    this.bobinasApi.list(lote.id_lote).subscribe({
      next: (data) => {
        this.bobinas.set(data);
        this.bobinasLoading.set(false);
      },
      error: () => {
        this.bobinasLoading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las bobinas' });
      },
    });
  }

  abrirForm(): void {
    this.bobinaForm.reset();
    this.formVisible.set(true);
  }

  cancelarForm(): void {
    this.formVisible.set(false);
  }

  generarBobina(): void {
    const lote = this.loteActivo();
    if (this.bobinaForm.invalid || this.bobinaSaving() || !lote) {
      return;
    }
    this.bobinaSaving.set(true);
    const raw = this.bobinaForm.getRawValue();
    const dto = {
      id_tipo_bobina: raw.id_tipo_bobina!,
      id_producto: raw.id_producto!,
      peso: raw.peso!,
      gramaje: raw.gramaje!,
    };

    this.bobinasApi.create(lote.id_lote, dto).subscribe({
      next: (bobina) => {
        this.bobinaSaving.set(false);
        this.formVisible.set(false);
        this.loadBobinas();
        this.verRotulo(bobina);
        this.messageService.add({
          severity: 'success',
          summary: 'Bobina generada',
          detail: `N° ${bobina.numero_bobina}`,
        });
      },
      error: (error: HttpErrorResponse) => {
        this.bobinaSaving.set(false);
        const detail = typeof error.error?.message === 'string' ? error.error.message : 'No se pudo generar la bobina';
        this.messageService.add({ severity: 'error', summary: 'Error', detail });
      },
    });
  }

  verRotulo(bobina: Bobina): void {
    const lote = this.loteActivo();
    if (!lote) {
      return;
    }
    this.bobinasApi.rotulo(lote.id_lote, bobina.id_bobina).subscribe({
      next: (pdf) => window.open(URL.createObjectURL(pdf), '_blank'),
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo abrir el rótulo' });
      },
    });
  }

  eliminarBobina(bobina: Bobina): void {
    const lote = this.loteActivo();
    if (!lote) {
      return;
    }
    this.bobinasApi.remove(lote.id_lote, bobina.id_bobina).subscribe({
      next: () => this.loadBobinas(),
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la bobina' });
      },
    });
  }
}
