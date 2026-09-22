import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TurnosApiService } from '../../../core/api/turnos-api.service';
import { EstadosApiService } from '../../../core/api/estados-api.service';
import { Turno } from '../../../core/models/turno.model';
import { Estado } from '../../../core/models/estado.model';

const ESTADOS_TURNO = new Set(['Activo', 'Anulado']);

@Component({
  selector: 'app-turnos-list',
  imports: [ReactiveFormsModule, TableModule, ButtonModule, DialogModule, InputTextModule, SelectModule],
  templateUrl: './turnos-list.html',
  styleUrl: './turnos-list.scss',
})
export class TurnosList implements OnInit {
  private readonly api = inject(TurnosApiService);
  private readonly estadosApi = inject(EstadosApiService);
  private readonly fb = inject(FormBuilder);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  protected readonly turnos = signal<Turno[]>([]);
  protected readonly estados = signal<Estado[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly dialogVisible = signal(false);
  protected readonly editingId = signal<number | null>(null);

  // Al crear no se elige estado: el sistema lo pone en "Activo". El
  // selector de estado solo se muestra al editar, y restringido a
  // Activo/Anulado.
  protected readonly estadosTurno = computed(() => this.estados().filter((e) => ESTADOS_TURNO.has(e.nombreEstado)));

  protected readonly form = this.fb.nonNullable.group({
    descripcion_turnos: ['', Validators.required],
    id_estado: [null as number | null],
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    forkJoin({
      turnos: this.api.list(),
      estados: this.estadosApi.list(),
    }).subscribe({
      next: ({ turnos, estados }) => {
        this.turnos.set(turnos);
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

  openEdit(turno: Turno): void {
    this.editingId.set(turno.id_turno);
    this.form.setValue({ descripcion_turnos: turno.descripcion_turnos, id_estado: turno.id_estado });
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
    const dto = { descripcion_turnos: raw.descripcion_turnos };
    const id = this.editingId();
    const request$ = id ? this.api.update(id, { ...dto, id_estado: raw.id_estado! }) : this.api.create(dto);

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

  confirmDelete(turno: Turno): void {
    this.confirmationService.confirm({
      header: 'Confirmar eliminación',
      message: `¿Eliminar el turno "${turno.descripcion_turnos}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { severity: 'danger', label: 'Eliminar' },
      rejectButtonProps: { severity: 'secondary', label: 'Cancelar', outlined: true },
      accept: () => this.remove(turno.id_turno),
    });
  }

  private remove(id: number): void {
    this.api.remove(id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Turno eliminado' });
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
