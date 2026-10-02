import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DatePickerModule } from 'primeng/datepicker';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../core/auth/auth.service';
import { CargaPedidosApiService } from '../../../core/api/carga-pedidos-api.service';
import { PedidosApiService } from '../../../core/api/pedidos-api.service';
import { ArchivoAdjuntoApiService } from '../../../core/api/archivo-adjunto-api.service';
import { CargaPallet, LadoCamion, PedidoACargar } from '../../../core/models/carga-pedido.model';
import { Pedido } from '../../../core/models/pedido.model';

const ETIQUETA_TIPO_PALLET: Record<string, string> = {
  ANGOSTO: 'Angosto',
  ANCHO_PESADO: 'Ancho y pesado',
  ANCHO_LIVIANO: 'Ancho y liviano',
};

// Pantalla del clarkista, pensada para tablet: elige el día, ve los
// pedidos a cargar y el sistema le sugiere en qué orden subir los
// pallets de cada lado del camión, mostrando la foto del producto en
// grande. Cuando termina todos, el pedido pasa a Cargado y el jefe de
// Logística lo despacha desde su pantalla.
@Component({
  selector: 'app-carga-pedidos-list',
  imports: [DatePipe, FormsModule, TableModule, ButtonModule, DialogModule, DatePickerModule, TooltipModule],
  templateUrl: './carga-pedidos-list.html',
  styleUrl: './carga-pedidos-list.scss',
})
export class CargaPedidosList implements OnInit {
  private readonly api = inject(CargaPedidosApiService);
  private readonly pedidosApi = inject(PedidosApiService);
  private readonly messageService = inject(MessageService);
  private readonly authService = inject(AuthService);
  protected readonly archivoAdjuntoApi = inject(ArchivoAdjuntoApiService);

  protected readonly puedeCargar = computed(() => {
    const user = this.authService.currentUser();
    return !!user && (user.es_administrador || user.permisos.includes('logistica.carga_pedidos.cargar'));
  });

  protected readonly fecha = signal<Date>(new Date());
  protected readonly pedidos = signal<PedidoACargar[]>([]);
  protected readonly loading = signal(false);

  // La pantalla solo lista pedidos Facturados: el pedido se factura
  // antes de subirlo al camión. Que la leyenda lo diga evita que uno
  // crea que la pantalla está fallando cuando en realidad el pedido
  // todavía no se facturó.
  protected readonly leyendaVacia = computed(() => {
    const elegida = this.fecha();
    const hoy = new Date();
    const esHoy =
      elegida.getFullYear() === hoy.getFullYear() &&
      elegida.getMonth() === hoy.getMonth() &&
      elegida.getDate() === hoy.getDate();
    const cuando = esHoy
      ? 'hoy'
      : `el ${String(elegida.getDate()).padStart(2, '0')}/${String(elegida.getMonth() + 1).padStart(2, '0')}/${elegida.getFullYear()}`;
    return `No hay pedidos facturados prometidos para ${cuando}.`;
  });

  // --- Modo carga ---
  protected readonly pedidoEnCarga = signal<PedidoACargar | null>(null);
  protected readonly pallets = signal<CargaPallet[]>([]);
  protected readonly ladoElegido = signal<LadoCamion | null>(null);
  protected readonly cargando = signal(false);

  protected readonly sugerirDialogVisible = signal(false);
  private pedidoAIniciar: PedidoACargar | null = null;

  protected readonly verDialogVisible = signal(false);
  protected readonly pedidoAVer = signal<Pedido | null>(null);

  // Con sugerencia de orden los pallets vienen con lado asignado; sin
  // sugerencia van todos juntos y el operario elige cuál marcar.
  protected readonly tieneSugerencia = computed(() => this.pallets().some((p) => p.lado !== null));

  protected readonly palletsDelLado = computed(() => {
    const lado = this.ladoElegido();
    const todos = this.pallets();
    if (!this.tieneSugerencia()) {
      return todos;
    }
    return todos.filter((p) => p.lado === lado);
  });

  protected readonly pendientesDelLado = computed(() => this.palletsDelLado().filter((p) => !p.cargado));
  protected readonly siguiente = computed(() => this.pendientesDelLado()[0] ?? null);

  protected readonly totalPendientes = computed(() => this.pallets().filter((p) => !p.cargado).length);

  protected pendientesDe(lado: LadoCamion): number {
    return this.pallets().filter((p) => p.lado === lado && !p.cargado).length;
  }

  protected totalDe(lado: LadoCamion): number {
    return this.pallets().filter((p) => p.lado === lado).length;
  }

  ngOnInit(): void {
    this.load();
  }

  private soloFecha(fecha: Date): string {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  protected load(): void {
    this.loading.set(true);
    this.api.pedidosDelDia(this.soloFecha(this.fecha())).subscribe({
      next: (pedidos) => {
        this.pedidos.set(pedidos);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los pedidos del día' });
      },
    });
  }

  protected onFechaChange(fecha: Date | null): void {
    if (!fecha) {
      return;
    }
    this.fecha.set(fecha);
    this.load();
  }

  // --- Ver pedido ---

  protected ver(pedido: PedidoACargar): void {
    this.pedidoAVer.set(null);
    this.verDialogVisible.set(true);
    this.pedidosApi.getOne(pedido.id_pedido).subscribe({
      next: (completo) => this.pedidoAVer.set(completo),
      error: () => {
        this.verDialogVisible.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el pedido' });
      },
    });
  }

  protected cerrarVer(): void {
    this.verDialogVisible.set(false);
  }

  // --- Comenzar carga ---

  protected comenzar(pedido: PedidoACargar): void {
    this.pedidoAIniciar = pedido;
    // Si la carga ya estaba arrancada no vuelve a preguntar: retoma.
    if (pedido.carga_iniciada) {
      this.iniciar(true);
      return;
    }
    this.sugerirDialogVisible.set(true);
  }

  protected iniciar(sugerirOrden: boolean): void {
    const pedido = this.pedidoAIniciar;
    if (!pedido) {
      return;
    }
    this.sugerirDialogVisible.set(false);
    this.api.iniciar(pedido.id_pedido, sugerirOrden).subscribe({
      next: (pallets) => {
        this.pallets.set(pallets);
        this.pedidoEnCarga.set(pedido);
        this.ladoElegido.set(null);
      },
      error: (error: HttpErrorResponse) => {
        const detail = typeof error.error?.message === 'string' ? error.error.message : 'No se pudo iniciar la carga';
        this.messageService.add({ severity: 'error', summary: 'Error', detail });
      },
    });
  }

  protected elegirLado(lado: LadoCamion): void {
    this.ladoElegido.set(lado);
  }

  protected volverAlListado(): void {
    this.pedidoEnCarga.set(null);
    this.pallets.set([]);
    this.ladoElegido.set(null);
    this.load();
  }

  protected etiquetaTipo(tipo: string | null | undefined): string {
    return tipo ? (ETIQUETA_TIPO_PALLET[tipo] ?? tipo) : 'Sin clasificar';
  }

  protected cargar(pallet: CargaPallet): void {
    if (this.cargando()) {
      return;
    }
    this.cargando.set(true);
    this.api.cargarPallet(pallet.id_carga_pallet).subscribe({
      next: ({ pallets, pedido_completo }) => {
        this.cargando.set(false);
        this.pallets.set(pallets);
        if (pedido_completo) {
          this.messageService.add({
            severity: 'success',
            summary: 'Pedido cargado',
            detail: 'Quedó listo para que Logística lo despache',
          });
          this.volverAlListado();
        }
      },
      error: (error: HttpErrorResponse) => {
        this.cargando.set(false);
        const detail = typeof error.error?.message === 'string' ? error.error.message : 'No se pudo marcar el pallet';
        this.messageService.add({ severity: 'error', summary: 'Error', detail });
      },
    });
  }
}
