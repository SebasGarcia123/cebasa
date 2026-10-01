import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { PedidoInsumosApiService } from '../../../core/api/pedido-insumos-api.service';
import { PedidoInsumos } from '../../../core/models/pedido-insumos.model';

const ESTADO_RECHAZADO = 'Rechazado';

type ItemForm = FormGroup<{
  id_item_pedido_insumo: FormControl<number>;
  cantidad_abastecida: FormControl<number | null>;
  observaciones: FormControl<string | null>;
}>;

// Pantalla de Logística (operario o jefe): acá se abastecen los
// pedidos de insumos que pidió Producción. "Cumplir" registra lo que
// realmente se mandó (puede diferir de lo solicitado, ej. sin stock)
// y deja el pedido esperando la decisión de Producción (Recibir /
// Para revisar) en la otra pantalla.
@Component({
  selector: 'app-cumplir-pedidos-insumos-list',
  imports: [DatePipe, ReactiveFormsModule, TableModule, ButtonModule, DialogModule, InputNumberModule, InputTextModule, TooltipModule],
  templateUrl: './cumplir-pedidos-insumos-list.html',
  styleUrl: './cumplir-pedidos-insumos-list.scss',
})
export class CumplirPedidosInsumosList implements OnInit {
  private readonly api = inject(PedidoInsumosApiService);
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);

  protected readonly pedidos = signal<PedidoInsumos[]>([]);
  protected readonly loading = signal(false);

  protected readonly cumplirDialogVisible = signal(false);
  protected readonly guardando = signal(false);
  protected readonly pedidoACumplir = signal<PedidoInsumos | null>(null);
  protected readonly filas = new FormArray<ItemForm>([]);

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.api.listParaLogistica().subscribe({
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

  protected esRechazado(pedido: PedidoInsumos): boolean {
    return pedido.estados?.nombreEstado === ESTADO_RECHAZADO;
  }

  protected abrirCumplir(pedido: PedidoInsumos): void {
    this.pedidoACumplir.set(pedido);
    this.filas.clear();
    for (const item of pedido.item_pedido_insumo ?? []) {
      this.filas.push(
        this.fb.group({
          id_item_pedido_insumo: this.fb.nonNullable.control(item.id_item_pedido_insumo),
          cantidad_abastecida: this.fb.control<number | null>(Number(item.cantidad_solicitada), [
            Validators.required,
            Validators.min(0),
          ]),
          observaciones: this.fb.control<string | null>(item.observaciones ?? null),
        }),
      );
    }
    this.cumplirDialogVisible.set(true);
  }

  protected cerrarCumplir(): void {
    this.cumplirDialogVisible.set(false);
  }

  protected guardarCumplir(): void {
    const pedido = this.pedidoACumplir();
    if (!pedido || this.guardando()) {
      return;
    }
    if (this.filas.invalid) {
      this.filas.markAllAsTouched();
      this.messageService.add({ severity: 'warn', summary: 'Revisá los campos', detail: 'Completá la cantidad abastecida de todos los ítems' });
      return;
    }

    this.guardando.set(true);
    const dto = {
      items: this.filas.getRawValue().map((fila) => ({
        id_item_pedido_insumo: fila.id_item_pedido_insumo,
        cantidad_abastecida: fila.cantidad_abastecida!,
        ...(fila.observaciones ? { observaciones: fila.observaciones } : {}),
      })),
    };

    this.api.cumplir(pedido.id_pedido_insumos, dto).subscribe({
      next: () => {
        this.guardando.set(false);
        this.cumplirDialogVisible.set(false);
        this.messageService.add({ severity: 'success', summary: 'Enviado', detail: 'El pedido queda pendiente de recepción por Producción' });
        this.load();
      },
      error: (error: HttpErrorResponse) => {
        this.guardando.set(false);
        const detail = typeof error.error?.message === 'string' ? error.error.message : 'No se pudo cumplir el pedido';
        this.messageService.add({ severity: 'error', summary: 'Error', detail });
      },
    });
  }
}
