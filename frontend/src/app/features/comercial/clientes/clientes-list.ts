import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ClientesApiService } from '../../../core/api/clientes-api.service';
import { DireccionesApiService } from '../../../core/api/direcciones-api.service';
import { EstadosApiService } from '../../../core/api/estados-api.service';
import { Cliente } from '../../../core/models/cliente.model';
import { Direccion } from '../../../core/models/direccion.model';
import { Estado } from '../../../core/models/estado.model';

@Component({
  selector: 'app-clientes-list',
  imports: [ReactiveFormsModule, TableModule, ButtonModule, DialogModule, InputTextModule, SelectModule],
  templateUrl: './clientes-list.html',
  styleUrl: './clientes-list.scss',
})
export class ClientesList implements OnInit {
  private readonly clientesApi = inject(ClientesApiService);
  private readonly direccionesApi = inject(DireccionesApiService);
  private readonly estadosApi = inject(EstadosApiService);
  private readonly fb = inject(FormBuilder);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly direcciones = signal<Direccion[]>([]);
  protected readonly estados = signal<Estado[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly dialogVisible = signal(false);
  protected readonly editingId = signal<number | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    nombre_cli: ['', Validators.required],
    id_direccion: [null as number | null, Validators.required],
    telefono_cli: [''],
    email_cli: ['', Validators.email],
    id_estado: [null as number | null, Validators.required],
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    forkJoin({
      clientes: this.clientesApi.list(),
      direcciones: this.direccionesApi.list(),
      estados: this.estadosApi.list(),
    }).subscribe({
      next: ({ clientes, direcciones, estados }) => {
        this.clientes.set(clientes);
        this.direcciones.set(direcciones);
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

  direccionLabel(direccion: Direccion): string {
    return `${direccion.calle} ${direccion.numero ?? ''}, ${direccion.localidad}`.trim();
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.reset();
    this.dialogVisible.set(true);
  }

  openEdit(cliente: Cliente): void {
    this.editingId.set(cliente.id_cliente);
    this.form.setValue({
      nombre_cli: cliente.nombre_cli,
      id_direccion: cliente.id_direccion,
      telefono_cli: cliente.telefono_cli ?? '',
      email_cli: cliente.email_cli ?? '',
      id_estado: cliente.id_estado,
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
    const dto = {
      nombre_cli: raw.nombre_cli,
      id_direccion: raw.id_direccion!,
      id_estado: raw.id_estado!,
      ...(raw.telefono_cli ? { telefono_cli: raw.telefono_cli } : {}),
      ...(raw.email_cli ? { email_cli: raw.email_cli } : {}),
    };
    const id = this.editingId();
    const request$ = id ? this.clientesApi.update(id, dto) : this.clientesApi.create(dto);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogVisible.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Guardado',
          detail: 'El cliente se guardó correctamente',
        });
        this.load();
      },
      error: () => {
        this.saving.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar' });
      },
    });
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
