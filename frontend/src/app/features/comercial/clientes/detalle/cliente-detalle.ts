import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ClientesApiService } from '../../../../core/api/clientes-api.service';
import { CuentaCorrienteApiService } from '../../../../core/api/cuenta-corriente-api.service';
import { MovimientosCtaCteApiService } from '../../../../core/api/movimientos-cta-cte-api.service';
import { DocumentosApiService } from '../../../../core/api/documentos-api.service';
import { Cliente } from '../../../../core/models/cliente.model';
import { CuentaCorriente } from '../../../../core/models/cuenta-corriente.model';
import { MovimientoCuentaCorriente } from '../../../../core/models/movimiento-cuenta-corriente.model';
import { Pedido } from '../../../../core/models/pedido.model';
import { Factura } from '../../../../core/models/factura.model';

const ESTADO_PENDIENTE = 'Pendiente';

type Vista = 'pedidos' | 'cuenta';
type TipoDocumentoGenerable = 'factura' | 'recibo' | 'nota_credito' | 'nota_debito';

const TIPOS_DOCUMENTO: { label: string; value: TipoDocumentoGenerable }[] = [
  { label: 'Factura', value: 'factura' },
  { label: 'Recibo de pago', value: 'recibo' },
  { label: 'Nota de Crédito', value: 'nota_credito' },
  { label: 'Nota de Débito', value: 'nota_debito' },
];

const MEDIOS_PAGO = ['Efectivo', 'Transferencia', 'Cheque', 'Tarjeta'];

// Detalle de un cliente, con URL propia (/comercial/clientes/:id). Dos
// vistas: sus pedidos (de donde se factura) y su cuenta corriente (los
// documentos emitidos, el saldo y la emisión de documentos nuevos).
@Component({
  selector: 'app-cliente-detalle',
  imports: [
    DatePipe,
    DecimalPipe,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputNumberModule,
    SelectModule,
    SelectButtonModule,
    TextareaModule,
    TooltipModule,
  ],
  templateUrl: './cliente-detalle.html',
  styleUrl: './cliente-detalle.scss',
})
export class ClienteDetalle implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly clientesApi = inject(ClientesApiService);
  private readonly ctaCteApi = inject(CuentaCorrienteApiService);
  private readonly movimientosApi = inject(MovimientosCtaCteApiService);
  private readonly documentosApi = inject(DocumentosApiService);
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);

  protected readonly idCliente = Number(this.route.snapshot.paramMap.get('id'));

  protected readonly cliente = signal<Cliente | null>(null);
  protected readonly pedidos = signal<Pedido[]>([]);
  protected readonly loading = signal(false);

  protected readonly vista = signal<Vista>('pedidos');
  protected readonly vistas: { label: string; value: Vista }[] = [
    { label: 'Pedidos', value: 'pedidos' },
    { label: 'Cuenta corriente', value: 'cuenta' },
  ];

  // --- Cuenta corriente ---
  protected readonly cuentaCorriente = signal<CuentaCorriente | null>(null);
  protected readonly movimientos = signal<MovimientoCuentaCorriente[]>([]);
  protected readonly facturas = signal<Factura[]>([]);
  protected readonly pedidosFacturables = signal<Pedido[]>([]);
  protected readonly ctaCteSaving = signal(false);

  protected readonly limiteForm = this.fb.nonNullable.group({
    limite_credito: [null as number | null, [Validators.required, Validators.min(0)]],
  });

  // --- Nuevo documento ---
  protected readonly tiposDocumento = TIPOS_DOCUMENTO;
  protected readonly mediosPago = MEDIOS_PAGO;
  protected readonly docDialogVisible = signal(false);
  protected readonly docSaving = signal(false);
  protected readonly tipoDocumento = signal<TipoDocumentoGenerable | null>(null);

  protected readonly documentoForm = this.fb.nonNullable.group({
    id_pedido: [null as number | null],
    id_factura: [null as number | null],
    monto: [null as number | null],
    medio_pago: [''],
    observaciones: [''],
    motivo: [''],
  });

  // La nota no puede superar el monto de la factura que corrige; se
  // muestra el tope y además lo valida el backend.
  protected readonly facturaElegida = computed(() => {
    const id = this.documentoForm.controls.id_factura.value;
    return id == null ? null : (this.facturas().find((f) => f.id_factura === id) ?? null);
  });

  protected readonly verDialogVisible = signal(false);
  protected readonly pedidoAVer = signal<Pedido | null>(null);

  ngOnInit(): void {
    this.cargar();
  }

  private cargar(): void {
    this.loading.set(true);
    forkJoin({
      cliente: this.clientesApi.getOne(this.idCliente),
      pedidos: this.clientesApi.pedidos(this.idCliente),
    }).subscribe({
      next: ({ cliente, pedidos }) => {
        this.cliente.set(cliente);
        this.pedidos.set(pedidos);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el cliente' });
      },
    });
    this.cargarCuentaCorriente();
  }

  private cargarCuentaCorriente(): void {
    this.ctaCteApi.getByCliente(this.idCliente).subscribe({
      next: (cuenta) => {
        this.cuentaCorriente.set(cuenta);
        this.limiteForm.setValue({ limite_credito: Number(cuenta.limite_credito) });
        this.cargarMovimientos();
      },
      // Sin cuenta corriente todavía: la vista ofrece crearla.
      error: () => this.cuentaCorriente.set(null),
    });
  }

  private cargarMovimientos(): void {
    forkJoin({
      movimientos: this.movimientosApi.list(this.idCliente),
      facturas: this.documentosApi.facturas(this.idCliente),
      facturables: this.documentosApi.pedidosFacturables(this.idCliente),
    }).subscribe({
      next: ({ movimientos, facturas, facturables }) => {
        this.movimientos.set(movimientos);
        this.facturas.set(facturas);
        this.pedidosFacturables.set(facturables);
      },
    });
  }

  protected volver(): void {
    this.router.navigate(['/comercial/clientes']);
  }

  protected estadoDe(pedido: Pedido): string {
    return pedido.estados?.nombreEstado ?? '—';
  }

  protected puedeFacturar(pedido: Pedido): boolean {
    return this.estadoDe(pedido) === ESTADO_PENDIENTE;
  }

  // --- Ver pedido ---

  protected ver(pedido: Pedido): void {
    this.pedidoAVer.set(pedido);
    this.verDialogVisible.set(true);
  }

  protected cerrarVer(): void {
    this.verDialogVisible.set(false);
  }

  // --- Facturar un pedido ---

  protected facturar(pedido: Pedido): void {
    if (this.docSaving()) {
      return;
    }
    this.docSaving.set(true);
    this.documentosApi.generarFactura(this.idCliente, { id_pedido: pedido.id_pedido }).subscribe({
      next: (pdf) => {
        this.docSaving.set(false);
        window.open(URL.createObjectURL(pdf), '_blank');
        this.messageService.add({ severity: 'success', summary: 'Facturado', detail: 'Se emitió la factura del pedido' });
        this.cargar();
      },
      error: async (error: HttpErrorResponse) => {
        this.docSaving.set(false);
        const detail = await this.mensajeDeError(error, 'No se pudo facturar el pedido');
        this.messageService.add({ severity: 'error', summary: 'Error', detail });
      },
    });
  }

  // --- Cuenta corriente ---

  protected crearCuentaCorriente(): void {
    this.ctaCteSaving.set(true);
    this.ctaCteApi.create(this.idCliente, { limite_credito: 0 }).subscribe({
      next: () => {
        this.ctaCteSaving.set(false);
        this.cargarCuentaCorriente();
      },
      error: () => {
        this.ctaCteSaving.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear la cuenta corriente' });
      },
    });
  }

  protected guardarLimite(): void {
    if (this.limiteForm.invalid || this.ctaCteSaving()) {
      return;
    }
    this.ctaCteSaving.set(true);
    this.ctaCteApi.update(this.idCliente, { limite_credito: this.limiteForm.getRawValue().limite_credito! }).subscribe({
      next: (cuenta) => {
        this.ctaCteSaving.set(false);
        this.cuentaCorriente.set(cuenta);
        this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Se actualizó el límite' });
      },
      error: () => {
        this.ctaCteSaving.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el límite' });
      },
    });
  }

  // --- Nuevo documento ---

  protected abrirNuevoDocumento(): void {
    this.tipoDocumento.set(null);
    this.documentoForm.reset({ id_pedido: null, id_factura: null, monto: null, medio_pago: '', observaciones: '', motivo: '' });
    this.docDialogVisible.set(true);
  }

  protected cerrarNuevoDocumento(): void {
    this.docDialogVisible.set(false);
  }

  protected elegirTipo(tipo: TipoDocumentoGenerable | null): void {
    this.tipoDocumento.set(tipo);
    this.documentoForm.reset({ id_pedido: null, id_factura: null, monto: null, medio_pago: '', observaciones: '', motivo: '' });
  }

  protected documentoValido(): boolean {
    const raw = this.documentoForm.getRawValue();
    switch (this.tipoDocumento()) {
      case 'factura':
        return raw.id_pedido != null;
      case 'recibo':
        return raw.monto != null && raw.monto > 0 && !!raw.medio_pago;
      case 'nota_credito':
      case 'nota_debito': {
        const tope = this.facturaElegida();
        return (
          raw.id_factura != null &&
          raw.monto != null &&
          raw.monto > 0 &&
          !!raw.motivo.trim() &&
          (!tope || raw.monto <= Number(tope.monto))
        );
      }
      default:
        return false;
    }
  }

  protected generarDocumento(): void {
    const tipo = this.tipoDocumento();
    if (!tipo || !this.documentoValido() || this.docSaving()) {
      return;
    }
    const raw = this.documentoForm.getRawValue();
    this.docSaving.set(true);

    const peticion$ =
      tipo === 'factura'
        ? this.documentosApi.generarFactura(this.idCliente, { id_pedido: raw.id_pedido! })
        : tipo === 'recibo'
          ? this.documentosApi.generarRecibo(this.idCliente, {
              monto: raw.monto!,
              medio_pago: raw.medio_pago,
              ...(raw.observaciones ? { observaciones: raw.observaciones } : {}),
            })
          : tipo === 'nota_credito'
            ? this.documentosApi.generarNotaCredito(this.idCliente, {
                id_factura: raw.id_factura!,
                monto: raw.monto!,
                motivo: raw.motivo,
              })
            : this.documentosApi.generarNotaDebito(this.idCliente, {
                id_factura: raw.id_factura!,
                monto: raw.monto!,
                motivo: raw.motivo,
              });

    peticion$.subscribe({
      next: (pdf) => {
        this.docSaving.set(false);
        this.docDialogVisible.set(false);
        window.open(URL.createObjectURL(pdf), '_blank');
        this.messageService.add({ severity: 'success', summary: 'Emitido', detail: 'Se generó el documento' });
        this.cargar();
      },
      error: async (error: HttpErrorResponse) => {
        this.docSaving.set(false);
        const detail = await this.mensajeDeError(error, 'No se pudo generar el documento');
        this.messageService.add({ severity: 'error', summary: 'Error', detail });
      },
    });
  }

  // Solo los movimientos cargados a mano (sin documento formal
  // asociado, de antes de este flujo) se pueden borrar: los que vienen
  // de un documento son inmutables, borrarlos desincronizaría el saldo
  // cacheado de la cuenta.
  protected esMovimientoManual(mov: MovimientoCuentaCorriente): boolean {
    return !mov.id_factura && !mov.id_recibo && !mov.id_nota_credito && !mov.id_nota_debito;
  }

  protected verDocumento(mov: MovimientoCuentaCorriente): void {
    const peticion$ = mov.id_factura
      ? this.documentosApi.pdfFactura(this.idCliente, mov.id_factura)
      : mov.id_recibo
        ? this.documentosApi.pdfRecibo(this.idCliente, mov.id_recibo)
        : mov.id_nota_credito
          ? this.documentosApi.pdfNotaCredito(this.idCliente, mov.id_nota_credito)
          : mov.id_nota_debito
            ? this.documentosApi.pdfNotaDebito(this.idCliente, mov.id_nota_debito)
            : null;
    peticion$?.subscribe({
      next: (pdf) => window.open(URL.createObjectURL(pdf), '_blank'),
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo abrir el documento' });
      },
    });
  }

  protected eliminarMovimiento(mov: MovimientoCuentaCorriente): void {
    this.movimientosApi.remove(this.idCliente, mov.id_movimiento_cta_cte).subscribe({
      next: () => this.cargarMovimientos(),
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el movimiento' });
      },
    });
  }

  // Los endpoints de documentos responden con responseType blob, así que
  // el body de un error también llega como Blob y hay que leerlo como
  // texto para sacar el mensaje real del backend.
  private async mensajeDeError(error: HttpErrorResponse, porDefecto: string): Promise<string> {
    if (error.error instanceof Blob) {
      try {
        const json = JSON.parse(await error.error.text()) as { message?: string };
        if (typeof json.message === 'string') {
          return json.message;
        }
      } catch {
        return porDefecto;
      }
    }
    if (typeof error.error?.message === 'string') {
      return error.error.message;
    }
    return porDefecto;
  }
}
