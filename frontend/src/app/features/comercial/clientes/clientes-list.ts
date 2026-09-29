import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ClientesApiService } from '../../../core/api/clientes-api.service';
import { DireccionesApiService } from '../../../core/api/direcciones-api.service';
import { EstadosApiService } from '../../../core/api/estados-api.service';
import { CuentaCorrienteApiService } from '../../../core/api/cuenta-corriente-api.service';
import { MovimientosCtaCteApiService } from '../../../core/api/movimientos-cta-cte-api.service';
import { DocumentosApiService } from '../../../core/api/documentos-api.service';
import { Cliente } from '../../../core/models/cliente.model';
import { Estado } from '../../../core/models/estado.model';
import { CuentaCorriente } from '../../../core/models/cuenta-corriente.model';
import { MovimientoCuentaCorriente } from '../../../core/models/movimiento-cuenta-corriente.model';
import { Pedido } from '../../../core/models/pedido.model';

const ESTADOS_CLIENTE = new Set(['Activo', 'Cancelado']);

type TipoDocumentoGenerable = 'factura' | 'recibo' | 'nota_credito' | 'nota_debito';

const TIPOS_DOCUMENTO_GENERABLE: { label: string; value: TipoDocumentoGenerable }[] = [
  { label: 'Factura', value: 'factura' },
  { label: 'Recibo de pago', value: 'recibo' },
  { label: 'Nota de Crédito', value: 'nota_credito' },
  { label: 'Nota de Débito', value: 'nota_debito' },
];

const MEDIOS_PAGO = ['Efectivo', 'Transferencia', 'Cheque', 'Tarjeta'];

@Component({
  selector: 'app-clientes-list',
  imports: [
    DatePipe,
    DecimalPipe,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    TextareaModule,
    TooltipModule,
  ],
  templateUrl: './clientes-list.html',
  styleUrl: './clientes-list.scss',
})
export class ClientesList implements OnInit {
  private readonly clientesApi = inject(ClientesApiService);
  private readonly direccionesApi = inject(DireccionesApiService);
  private readonly estadosApi = inject(EstadosApiService);
  private readonly cuentaCorrienteApi = inject(CuentaCorrienteApiService);
  private readonly movimientosApi = inject(MovimientosCtaCteApiService);
  private readonly documentosApi = inject(DocumentosApiService);
  private readonly fb = inject(FormBuilder);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly estados = signal<Estado[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly dialogVisible = signal(false);
  protected readonly editingId = signal<number | null>(null);
  private clienteEnEdicion: Cliente | null = null;

  // Un cliente solo puede estar Activo o Cancelado (no el resto del
  // catálogo genérico de estados, que también sirve para reclamos,
  // pedidos, etc.).
  protected readonly estadosCliente = computed(() =>
    this.estados().filter((e) => ESTADOS_CLIENTE.has(e.nombreEstado)),
  );

  // Al crear no se elige estado: el sistema lo pone en "Activo" (ver
  // save()). El selector de estado solo se muestra al editar.
  protected readonly form = this.fb.nonNullable.group({
    nombre_cli: ['', Validators.required],
    telefono_cli: [''],
    email_cli: ['', Validators.email],
    id_estado: [null as number | null],
    direccion: this.fb.nonNullable.group({
      calle: ['', Validators.required],
      numero: [''],
      entrecalle1: [''],
      entrecalle2: [''],
      localidad: ['', Validators.required],
      provincia: ['', Validators.required],
    }),
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    forkJoin({
      clientes: this.clientesApi.list(),
      estados: this.estadosApi.list(),
    }).subscribe({
      next: ({ clientes, estados }) => {
        this.clientes.set(clientes);
        this.estados.set(estados);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar el listado de clientes',
        });
      },
    });
  }

  direccionLabel(direccion: { calle: string; numero: string | null; localidad: string }): string {
    return `${direccion.calle} ${direccion.numero ?? ''}, ${direccion.localidad}`.trim();
  }

  openCreate(): void {
    this.editingId.set(null);
    this.clienteEnEdicion = null;
    this.form.reset();
    this.dialogVisible.set(true);
  }

  openEdit(cliente: Cliente): void {
    this.editingId.set(cliente.id_cliente);
    this.clienteEnEdicion = cliente;
    this.form.setValue({
      nombre_cli: cliente.nombre_cli,
      telefono_cli: cliente.telefono_cli ?? '',
      email_cli: cliente.email_cli ?? '',
      id_estado: cliente.id_estado,
      direccion: {
        calle: cliente.direcciones?.calle ?? '',
        numero: cliente.direcciones?.numero ?? '',
        entrecalle1: cliente.direcciones?.entrecalle1 ?? '',
        entrecalle2: cliente.direcciones?.entrecalle2 ?? '',
        localidad: cliente.direcciones?.localidad ?? '',
        provincia: cliente.direcciones?.provincia ?? '',
      },
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
    const direccionDto = {
      calle: raw.direccion.calle,
      localidad: raw.direccion.localidad,
      provincia: raw.direccion.provincia,
      ...(raw.direccion.numero ? { numero: raw.direccion.numero } : {}),
      ...(raw.direccion.entrecalle1 ? { entrecalle1: raw.direccion.entrecalle1 } : {}),
      ...(raw.direccion.entrecalle2 ? { entrecalle2: raw.direccion.entrecalle2 } : {}),
    };
    const clienteBase = {
      nombre_cli: raw.nombre_cli,
      ...(raw.telefono_cli ? { telefono_cli: raw.telefono_cli } : {}),
      ...(raw.email_cli ? { email_cli: raw.email_cli } : {}),
    };

    const id = this.editingId();
    if (id && this.clienteEnEdicion) {
      forkJoin({
        cliente: this.clientesApi.update(id, { ...clienteBase, id_estado: raw.id_estado ?? undefined }),
        direccion: this.direccionesApi.update(this.clienteEnEdicion.id_direccion, direccionDto),
      }).subscribe({
        next: () => this.onSaveSuccess(),
        error: () => this.onSaveError(),
      });
      return;
    }

    const idEstadoActivo = this.estados().find((e) => e.nombreEstado === 'Activo')?.id_estado;
    this.direccionesApi.create({ ...direccionDto, id_estado: idEstadoActivo! }).subscribe({
      next: (direccion) => {
        this.clientesApi.create({ ...clienteBase, id_direccion: direccion.id_direccion }).subscribe({
          next: () => this.onSaveSuccess(),
          error: () => this.onSaveError(),
        });
      },
      error: () => this.onSaveError(),
    });
  }

  private onSaveSuccess(): void {
    this.saving.set(false);
    this.dialogVisible.set(false);
    this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'El cliente se guardó correctamente' });
    this.load();
  }

  private onSaveError(): void {
    this.saving.set(false);
    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar' });
  }

  confirmDelete(cliente: Cliente): void {
    this.confirmationService.confirm({
      header: 'Confirmar eliminación',
      message: `¿Eliminar el cliente "${cliente.nombre_cli}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { severity: 'danger', label: 'Eliminar' },
      rejectButtonProps: { severity: 'secondary', label: 'Cancelar', outlined: true },
      accept: () => this.remove(cliente.id_cliente),
    });
  }

  private remove(id: number): void {
    this.clientesApi.remove(id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Cliente eliminado' });
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

  // Cuenta corriente
  protected readonly ctaCteDialogVisible = signal(false);
  protected readonly ctaCteLoading = signal(false);
  protected readonly ctaCteSaving = signal(false);
  protected readonly cuentaCorriente = signal<CuentaCorriente | null>(null);
  protected readonly movimientos = signal<MovimientoCuentaCorriente[]>([]);
  private clienteActivo: Cliente | null = null;

  protected readonly limiteForm = this.fb.nonNullable.group({
    limite_credito: [0, Validators.required],
  });

  protected readonly tiposDocumentoGenerable = TIPOS_DOCUMENTO_GENERABLE;
  protected readonly mediosPago = MEDIOS_PAGO;
  protected readonly tipoDocumentoSeleccionado = signal<TipoDocumentoGenerable | null>(null);
  protected readonly pedidosFacturables = signal<Pedido[]>([]);
  protected readonly documentoSaving = signal(false);

  protected readonly documentoForm = this.fb.nonNullable.group({
    id_pedido: [null as number | null],
    monto: [null as number | null],
    medio_pago: [''],
    observaciones: [''],
    motivo: [''],
  });

  openCuentaCorriente(cliente: Cliente): void {
    this.clienteActivo = cliente;
    this.ctaCteDialogVisible.set(true);
    this.ctaCteLoading.set(true);
    this.cuentaCorriente.set(null);
    this.movimientos.set([]);
    this.tipoDocumentoSeleccionado.set(null);
    this.pedidosFacturables.set([]);
    this.documentoForm.reset({ id_pedido: null, monto: null, medio_pago: '', observaciones: '', motivo: '' });

    this.cuentaCorrienteApi.getByCliente(cliente.id_cliente).subscribe({
      next: (cuenta) => {
        this.cuentaCorriente.set(cuenta);
        // limite_credito es Decimal en la base: Prisma lo serializa como
        // string, no number, así que hay que convertirlo antes de cargarlo
        // en el form (si no, guardar sin tocar el campo manda el string de
        // vuelta y el backend lo rechaza).
        this.limiteForm.setValue({ limite_credito: Number(cuenta.limite_credito) });
        this.loadMovimientos(cliente.id_cliente);
        this.ctaCteLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.ctaCteLoading.set(false);
        if (error.status !== 404) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo cargar la cuenta corriente',
          });
        }
      },
    });
  }

  private loadMovimientos(idCliente: number): void {
    this.movimientosApi.list(idCliente).subscribe({
      next: (data) => this.movimientos.set(data),
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los movimientos' });
      },
    });
  }

  crearCuentaCorriente(): void {
    if (!this.clienteActivo) {
      return;
    }
    this.ctaCteSaving.set(true);
    this.cuentaCorrienteApi.create(this.clienteActivo.id_cliente, {}).subscribe({
      next: (cuenta) => {
        this.ctaCteSaving.set(false);
        this.cuentaCorriente.set(cuenta);
        this.limiteForm.setValue({ limite_credito: Number(cuenta.limite_credito) });
        this.messageService.add({ severity: 'success', summary: 'Creada', detail: 'Cuenta corriente creada' });
      },
      error: () => {
        this.ctaCteSaving.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear la cuenta corriente' });
      },
    });
  }

  guardarLimite(): void {
    if (!this.clienteActivo || this.limiteForm.invalid) {
      return;
    }
    this.ctaCteSaving.set(true);
    this.cuentaCorrienteApi
      .update(this.clienteActivo.id_cliente, { limite_credito: Number(this.limiteForm.getRawValue().limite_credito) })
      .subscribe({
        next: (cuenta) => {
          this.ctaCteSaving.set(false);
          this.cuentaCorriente.set(cuenta);
          this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Límite actualizado' });
        },
        error: () => {
          this.ctaCteSaving.set(false);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el límite' });
        },
      });
  }

  // Al elegir el tipo, cada uno pide cosas distintas (ver template): se
  // limpian los campos que no aplican para no arrastrar valores de un
  // tipo a otro, y si es Factura se traen los pedidos Pendientes del
  // cliente para elegir a cuál corresponde.
  seleccionarTipoDocumento(tipo: TipoDocumentoGenerable): void {
    this.tipoDocumentoSeleccionado.set(tipo);
    this.documentoForm.reset({ id_pedido: null, monto: null, medio_pago: '', observaciones: '', motivo: '' });
    if (tipo === 'factura' && this.clienteActivo) {
      this.documentosApi.pedidosFacturables(this.clienteActivo.id_cliente).subscribe({
        next: (pedidos) => this.pedidosFacturables.set(pedidos),
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los pedidos pendientes' });
        },
      });
    }
  }

  protected documentoValido(): boolean {
    const raw = this.documentoForm.getRawValue();
    switch (this.tipoDocumentoSeleccionado()) {
      case 'factura':
        return raw.id_pedido != null;
      case 'recibo':
        return !!raw.monto && raw.monto > 0 && !!raw.medio_pago;
      case 'nota_credito':
      case 'nota_debito':
        return !!raw.monto && raw.monto > 0 && !!raw.motivo;
      default:
        return false;
    }
  }

  generarDocumento(): void {
    const tipo = this.tipoDocumentoSeleccionado();
    if (!this.clienteActivo || !tipo || !this.documentoValido() || this.documentoSaving()) {
      return;
    }
    const idCliente = this.clienteActivo.id_cliente;
    const raw = this.documentoForm.getRawValue();

    this.documentoSaving.set(true);
    const request$ =
      tipo === 'factura'
        ? this.documentosApi.generarFactura(idCliente, { id_pedido: raw.id_pedido! })
        : tipo === 'recibo'
          ? this.documentosApi.generarRecibo(idCliente, {
              monto: raw.monto!,
              medio_pago: raw.medio_pago!,
              ...(raw.observaciones ? { observaciones: raw.observaciones } : {}),
            })
          : tipo === 'nota_credito'
            ? this.documentosApi.generarNotaCredito(idCliente, { monto: raw.monto!, motivo: raw.motivo! })
            : this.documentosApi.generarNotaDebito(idCliente, { monto: raw.monto!, motivo: raw.motivo! });

    request$.subscribe({
      next: (pdf) => {
        this.documentoSaving.set(false);
        window.open(URL.createObjectURL(pdf), '_blank');
        this.messageService.add({ severity: 'success', summary: 'Generado', detail: 'El documento se generó correctamente' });
        this.seleccionarTipoDocumento(tipo);
        this.loadMovimientos(idCliente);
        this.cuentaCorrienteApi.getByCliente(idCliente).subscribe({ next: (cuenta) => this.cuentaCorriente.set(cuenta) });
      },
      error: (error: HttpErrorResponse) => {
        this.documentoSaving.set(false);
        const detail = typeof error.error?.message === 'string' ? error.error.message : 'No se pudo generar el documento';
        this.messageService.add({ severity: 'error', summary: 'Error', detail });
      },
    });
  }

  // Solo los movimientos generados a mano (sin documento formal
  // asociado, de antes de este flujo) se pueden borrar: los que vienen
  // de un documento son inmutables, borrarlos desincronizaría el saldo
  // cacheado de la cuenta.
  protected esMovimientoManual(mov: MovimientoCuentaCorriente): boolean {
    return !mov.id_factura && !mov.id_recibo && !mov.id_nota_credito && !mov.id_nota_debito;
  }

  protected puedeVerDocumento(mov: MovimientoCuentaCorriente): boolean {
    return !this.esMovimientoManual(mov);
  }

  verDocumentoDeMovimiento(mov: MovimientoCuentaCorriente): void {
    if (!this.clienteActivo) {
      return;
    }
    const idCliente = this.clienteActivo.id_cliente;
    const request$ = mov.id_factura
      ? this.documentosApi.pdfFactura(idCliente, mov.id_factura)
      : mov.id_recibo
        ? this.documentosApi.pdfRecibo(idCliente, mov.id_recibo)
        : mov.id_nota_credito
          ? this.documentosApi.pdfNotaCredito(idCliente, mov.id_nota_credito)
          : mov.id_nota_debito
            ? this.documentosApi.pdfNotaDebito(idCliente, mov.id_nota_debito)
            : null;
    request$?.subscribe({
      next: (pdf) => window.open(URL.createObjectURL(pdf), '_blank'),
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo abrir el documento' });
      },
    });
  }

  eliminarMovimiento(movimiento: MovimientoCuentaCorriente): void {
    if (!this.clienteActivo) {
      return;
    }
    this.movimientosApi.remove(this.clienteActivo.id_cliente, movimiento.id_movimiento_cta_cte).subscribe({
      next: () => this.loadMovimientos(this.clienteActivo!.id_cliente),
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el movimiento' });
      },
    });
  }
}
