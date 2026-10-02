import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ClientesApiService } from '../../../core/api/clientes-api.service';
import { DireccionesApiService } from '../../../core/api/direcciones-api.service';
import { EstadosApiService } from '../../../core/api/estados-api.service';
import { Cliente } from '../../../core/models/cliente.model';
import { Estado } from '../../../core/models/estado.model';

const ESTADOS_CLIENTE = new Set(['Activo', 'Cancelado']);


@Component({
  selector: 'app-clientes-list',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    CheckboxModule,
    TooltipModule,
  ],
  templateUrl: './clientes-list.html',
  styleUrl: './clientes-list.scss',
})
export class ClientesList implements OnInit {
  private readonly router = inject(Router);
  private readonly clientesApi = inject(ClientesApiService);
  private readonly direccionesApi = inject(DireccionesApiService);
  private readonly estadosApi = inject(EstadosApiService);
  private readonly fb = inject(FormBuilder);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly estados = signal<Estado[]>([]);
  protected readonly loading = signal(false);

  // Buscador por nombre y el tilde de "ver anulados": por default se
  // ocultan los Cancelados (no hace falta verlos para el uso diario),
  // pero hay que poder encontrarlos para reactivarlos editándolos.
  protected readonly busqueda = signal('');
  protected readonly verAnulados = signal(false);
  protected readonly clientesFiltrados = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    return this.clientes().filter((c) => {
      if (!this.verAnulados() && c.estados?.nombreEstado === 'Cancelado') {
        return false;
      }
      return !texto || c.nombre_cli.toLowerCase().includes(texto);
    });
  });

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

  // Clickear la fila abre el detalle del cliente (sus pedidos y su
  // cuenta corriente). Los botones de la fila cortan la propagación
  // para no abrir el detalle al editar o borrar.
  protected abrirDetalle(cliente: Cliente): void {
    this.router.navigate(['/comercial/clientes', cliente.id_cliente]);
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

}
