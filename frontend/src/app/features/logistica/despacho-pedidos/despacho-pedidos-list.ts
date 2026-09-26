import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { PedidosApiService } from '../../../core/api/pedidos-api.service';
import { DepositosApiService } from '../../../core/api/depositos-api.service';
import { Pedido } from '../../../core/models/pedido.model';
import { Deposito } from '../../../core/models/deposito.model';

const ESTADO_FACTURADO = 'Facturado';
const ESTADO_DESPACHADO = 'Despachado';
// Coincide con PedidosService.DEPOSITO_NO_RESUELTO en el backend: si el
// error de despachar trae exactamente este texto, en vez de mostrarlo
// sin más se le ofrece a quien despacha elegir el depósito a mano.
const MENSAJE_DEPOSITO_NO_RESUELTO = 'No se pudo determinar el depósito de logística automáticamente. Elegilo manualmente.';

@Component({
  selector: 'app-despacho-pedidos-list',
  imports: [
    DatePipe,
    DecimalPipe,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    DatePickerModule,
    CheckboxModule,
    SelectModule,
    SelectButtonModule,
    TooltipModule,
  ],
  templateUrl: './despacho-pedidos-list.html',
  styleUrl: './despacho-pedidos-list.scss',
})
export class DespachoPedidosList implements OnInit {
  private readonly api = inject(PedidosApiService);
  private readonly depositosApi = inject(DepositosApiService);
  private readonly messageService = inject(MessageService);

  protected readonly pedidos = signal<Pedido[]>([]);
  protected readonly loading = signal(false);
  protected readonly depositos = signal<Deposito[]>([]);
  // Solo depósitos de logística (no los de producción) para el
  // selector manual de respaldo.
  protected readonly depositosLogistica = computed(() =>
    this.depositos().filter((d) => d.nombre_deposito.toLowerCase().includes('log')),
  );

  protected readonly desde = signal<Date | null>(null);
  protected readonly hasta = signal<Date | null>(null);
  // Sin tildar: todos los pedidos menos los ya Despachados (es la
  // bandeja de trabajo). Tildado: literalmente todos, incluidos los ya
  // despachados, para consultar el historial completo.
  protected readonly verTodos = signal(false);

  protected readonly pedidosFiltrados = computed(() => {
    const desde = this.desde();
    const hasta = this.hasta();
    const verTodos = this.verTodos();

    return this.pedidos().filter((pedido) => {
      const estado = pedido.estados?.nombreEstado;
      if (!verTodos && estado === ESTADO_DESPACHADO) {
        return false;
      }
      const fecha = this.soloFecha(new Date(pedido.fecha_carga));
      if (desde && fecha < this.soloFecha(desde)) {
        return false;
      }
      if (hasta && fecha > this.soloFecha(hasta)) {
        return false;
      }
      return true;
    });
  });

  protected readonly verDialogVisible = signal(false);
  protected readonly pedidoAVer = signal<Pedido | null>(null);

  protected readonly despacharDialogVisible = signal(false);
  protected readonly despachando = signal(false);
  protected readonly pedidoADespachar = signal<Pedido | null>(null);
  protected readonly copiasOpciones: { label: string; value: 2 | 3 }[] = [
    { label: 'Duplicado', value: 2 },
    { label: 'Triplicado', value: 3 },
  ];
  protected readonly cantidadCopias = signal<2 | 3>(2);
  // Se activa cuando el backend no pudo resolver el depósito solo con
  // el sector de quien despacha (ej. una cuenta admin sin sector real):
  // recién ahí aparece el selector para elegirlo a mano.
  protected readonly necesitaDepositoManual = signal(false);
  protected readonly depositoElegido = signal<number | null>(null);

  ngOnInit(): void {
    this.load();
    this.depositosApi.list().subscribe({ next: (depositos) => this.depositos.set(depositos) });
  }

  private load(): void {
    this.loading.set(true);
    this.api.list().subscribe({
      next: (pedidos) => {
        this.pedidos.set(pedidos);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el listado' });
      },
    });
  }

  private soloFecha(fecha: Date): number {
    return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()).getTime();
  }

  puedeDespachar(pedido: Pedido): boolean {
    return pedido.estados?.nombreEstado === ESTADO_FACTURADO;
  }

  ver(pedido: Pedido): void {
    this.pedidoAVer.set(null);
    this.verDialogVisible.set(true);
    this.api.getOne(pedido.id_pedido).subscribe({
      next: (completo) => this.pedidoAVer.set(completo),
      error: () => {
        this.verDialogVisible.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el pedido' });
      },
    });
  }

  cerrarVer(): void {
    this.verDialogVisible.set(false);
  }

  abrirDespachar(pedido: Pedido): void {
    this.pedidoADespachar.set(pedido);
    this.cantidadCopias.set(2);
    this.necesitaDepositoManual.set(false);
    this.depositoElegido.set(null);
    this.despacharDialogVisible.set(true);
  }

  cerrarDespachar(): void {
    this.despacharDialogVisible.set(false);
  }

  confirmarDespachar(): void {
    const pedido = this.pedidoADespachar();
    if (!pedido || this.despachando()) {
      return;
    }
    if (this.necesitaDepositoManual() && !this.depositoElegido()) {
      return;
    }

    this.despachando.set(true);
    const dto = {
      cantidad_copias: this.cantidadCopias(),
      ...(this.depositoElegido() ? { id_deposito: this.depositoElegido()! } : {}),
    };
    this.api.despachar(pedido.id_pedido, dto).subscribe({
      next: (pdf) => {
        this.despachando.set(false);
        this.despacharDialogVisible.set(false);
        const url = URL.createObjectURL(pdf);
        window.open(url, '_blank');
        this.messageService.add({
          severity: 'success',
          summary: 'Despachado',
          detail: 'El pedido fue despachado y se generó el remito',
        });
        this.load();
      },
      error: async (error: HttpErrorResponse) => {
        this.despachando.set(false);
        const detail = await this.extraerMensajeError(error);
        if (detail === MENSAJE_DEPOSITO_NO_RESUELTO) {
          this.necesitaDepositoManual.set(true);
          return;
        }
        this.messageService.add({ severity: 'error', summary: 'Error', detail });
      },
    });
  }

  // responseType:'blob' hace que el body de un error también llegue
  // como Blob (no como JSON parseado): hay que leerlo como texto para
  // sacar el mensaje real que mandó el backend.
  private async extraerMensajeError(error: HttpErrorResponse): Promise<string> {
    if (error.error instanceof Blob) {
      try {
        const texto = await error.error.text();
        const json = JSON.parse(texto) as { message?: string };
        if (typeof json.message === 'string') {
          return json.message;
        }
      } catch {
        // sigue al mensaje genérico de abajo
      }
    }
    return 'No se pudo despachar el pedido';
  }
}
