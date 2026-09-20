import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ReclamosApiService } from '../../../core/api/reclamos-api.service';
import { ClientesApiService } from '../../../core/api/clientes-api.service';
import { EstadosApiService } from '../../../core/api/estados-api.service';
import { Reclamo } from '../../../core/models/reclamo.model';
import { Cliente } from '../../../core/models/cliente.model';
import { Estado } from '../../../core/models/estado.model';

@Component({
  selector: 'app-reclamos-list',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    DatePickerModule,
  ],
  templateUrl: './reclamos-list.html',
  styleUrl: './reclamos-list.scss',
})
export class ReclamosList implements OnInit {
  private readonly api = inject(ReclamosApiService);
  private readonly clientesApi = inject(ClientesApiService);
  private readonly estadosApi = inject(EstadosApiService);
  private readonly fb = inject(FormBuilder);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  protected readonly reclamos = signal<Reclamo[]>([]);
  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly estados = signal<Estado[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly dialogVisible = signal(false);
  protected readonly editingId = signal<number | null>(null);

  // id_usuario: el reclamo lo registra el usuario logueado. Por ahora se
  // fija a 1 (el usuario de prueba); cuando haya un selector de "usuario
  // actual" real, se reemplaza por el id de la sesión.
  protected readonly form = this.fb.nonNullable.group({
    fecha: [null as Date | null, Validators.required],
    descripcion: [''],
    id_cliente: [null as number | null, Validators.required],
    id_estado: [null as number | null, Validators.required],
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    forkJoin({
      reclamos: this.api.list(),
      clientes: this.clientesApi.list(),
      estados: this.estadosApi.list(),
    }).subscribe({
      next: ({ reclamos, clientes, estados }) => {
        this.reclamos.set(reclamos);
        this.clientes.set(clientes);
        this.estados.set(estados);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el listado' });
      },
    });
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.reset();
    this.dialogVisible.set(true);
  }

  openEdit(reclamo: Reclamo): void {
    this.editingId.set(reclamo.id_reclamo);
    this.form.setValue({
      fecha: new Date(reclamo.fecha),
      descripcion: reclamo.descripcion ?? '',
      id_cliente: reclamo.id_cliente,
      id_estado: reclamo.id_estado,
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
      fecha: raw.fecha!.toISOString().slice(0, 10),
      id_cliente: raw.id_cliente!,
      id_estado: raw.id_estado!,
      id_usuario: 1,
      ...(raw.descripcion ? { descripcion: raw.descripcion } : {}),
    };
    const id = this.editingId();
    const request$ = id ? this.api.update(id, dto) : this.api.create(dto);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogVisible.set(false);
        this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Se guardó correctamente' });
        this.load();
      },
      error: () => {
        this.saving.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar' });
      },
    });
  }

  confirmDelete(reclamo: Reclamo): void {
    this.confirmationService.confirm({
      header: 'Confirmar eliminación',
      message: '¿Eliminar este reclamo?',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { severity: 'danger', label: 'Eliminar' },
      rejectButtonProps: { severity: 'secondary', label: 'Cancelar', outlined: true },
      accept: () => this.remove(reclamo.id_reclamo),
    });
  }

  private remove(id: number): void {
    this.api.remove(id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Reclamo eliminado' });
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
