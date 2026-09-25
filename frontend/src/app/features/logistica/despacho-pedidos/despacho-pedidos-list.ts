import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { PedidosApiService } from '../../../core/api/pedidos-api.service';
import { Pedido } from '../../../core/models/pedido.model';

const ESTADO_FACTURADO = 'Facturado';
const ESTADO_PENDIENTE = 'Pendiente';

@Component({
  selector: 'app-despacho-pedidos-list',
  imports: [DatePipe, FormsModule, TableModule, ButtonModule, DialogModule, DatePickerModule, CheckboxModule, SelectButtonModule, TooltipModule],
  templateUrl: './despacho-pedidos-list.html',
  styleUrl: './despacho-pedidos-list.scss',
})
export class DespachoPedidosList implements OnInit {
  private readonly api = inject(PedidosApiService);
  private readonly messageService = inject(MessageService);

  protected readonly pedidos = signal<Pedido[]>([]);
  protected readonly loading = signal(false);

  protected readonly desde = signal<Date | null>(null);
  protected readonly hasta = signal<Date | null>(null);
  // Sin tildar: solo pedidos Pendientes, que es lo que Logística tiene
  // que revisar primero. Tildado: también muestra los Facturados (los
  // únicos que ya se pueden despachar).
  protected readonly verTodos = signal(false);

  protected readonly pedidosFiltrados = computed(() => {
    const desde = this.desde();
    const hasta = this.hasta();
    const verTodos = this.verTodos();
    const estadosVisibles = verTodos ? new Set([ESTADO_PENDIENTE, ESTADO_FACTURADO]) : new Set([ESTADO_PENDIENTE]);

    return this.pedidos().filter((pedido) => {
      const estado = pedido.estados?.nombreEstado;
      if (!estado || !estadosVisibles.has(estado)) {
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

  protected readonly despacharDialogVisible = signal(false);
  protected readonly despachando = signal(false);
  protected readonly pedidoADespachar = signal<Pedido | null>(null);
  protected readonly copiasOpciones: { label: string; value: 2 | 3 }[] = [
    { label: 'Duplicado', value: 2 },
    { label: 'Triplicado', value: 3 },
  ];
  protected readonly cantidadCopias = signal<2 | 3>(2);

  ngOnInit(): void {
    this.load();
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

  abrirDespachar(pedido: Pedido): void {
    this.pedidoADespachar.set(pedido);
    this.cantidadCopias.set(2);
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

    this.despachando.set(true);
    this.api.despachar(pedido.id_pedido, { cantidad_copias: this.cantidadCopias() }).subscribe({
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
        this.messageService.add({ severity: 'error', summary: 'Error', detail: await this.extraerMensajeError(error) });
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
