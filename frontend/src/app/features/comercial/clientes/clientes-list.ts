import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ClientesApiService } from '../../../core/api/clientes-api.service';
import { DireccionesApiService } from '../../../core/api/direcciones-api.service';
import { EstadosApiService } from '../../../core/api/estados-api.service';
import { CuentaCorrienteApiService } from '../../../core/api/cuenta-corriente-api.service';
import { MovimientosCtaCteApiService } from '../../../core/api/movimientos-cta-cte-api.service';
import { TipoDocumentoApiService } from '../../../core/api/tipo-documento-api.service';
import { Cliente } from '../../../core/models/cliente.model';
import { Estado } from '../../../core/models/estado.model';
import { CuentaCorriente } from '../../../core/models/cuenta-corriente.model';
import { MovimientoCuentaCorriente } from '../../../core/models/movimiento-cuenta-corriente.model';
import { TipoDocumento } from '../../../core/models/tipo-documento.model';

const ESTADOS_CLIENTE = new Set(['Activo', 'Cancelado']);

@Component({
  selector: 'app-clientes-list',
  imports: [
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    DatePickerModule,
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
  private readonly tipoDocumentoApi = inject(TipoDocumentoApiService);
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
  protected readonly tiposDocumento = signal<TipoDocumento[]>([]);
  private clienteActivo: Cliente | null = null;

  protected readonly limiteForm = this.fb.nonNullable.group({
    limite_credito: [0, Validators.required],
  });

  protected readonly movimientoForm = this.fb.nonNullable.group({
    fecha: [null as Date | null, Validators.required],
    monto: [null as number | null, Validators.required],
    id_tipo_documento: [null as number | null, Validators.required],
    saldo_resultante: [null as number | null, Validators.required],
  });

  openCuentaCorriente(cliente: Cliente): void {
    this.clienteActivo = cliente;
    this.ctaCteDialogVisible.set(true);
    this.ctaCteLoading.set(true);
    this.cuentaCorriente.set(null);
    this.movimientos.set([]);

    this.tipoDocumentoApi.list().subscribe({ next: (data) => this.tiposDocumento.set(data) });

    this.cuentaCorrienteApi.getByCliente(cliente.id_cliente).subscribe({
      next: (cuenta) => {
        this.cuentaCorriente.set(cuenta);
        this.limiteForm.setValue({ limite_credito: cuenta.limite_credito });
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
        this.limiteForm.setValue({ limite_credito: cuenta.limite_credito });
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
      .update(this.clienteActivo.id_cliente, { limite_credito: this.limiteForm.getRawValue().limite_credito })
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

  agregarMovimiento(): void {
    if (!this.clienteActivo || this.movimientoForm.invalid) {
      return;
    }
    const raw = this.movimientoForm.getRawValue();
    this.ctaCteSaving.set(true);
    this.movimientosApi
      .create(this.clienteActivo.id_cliente, {
        fecha: raw.fecha!.toISOString().slice(0, 10),
        monto: raw.monto!,
        id_tipo_documento: raw.id_tipo_documento!,
        saldo_resultante: raw.saldo_resultante!,
      })
      .subscribe({
        next: () => {
          this.ctaCteSaving.set(false);
          this.movimientoForm.reset();
          this.loadMovimientos(this.clienteActivo!.id_cliente);
        },
        error: () => {
          this.ctaCteSaving.set(false);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo agregar el movimiento' });
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
