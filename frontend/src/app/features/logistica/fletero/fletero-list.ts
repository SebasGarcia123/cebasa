import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ConfirmationService, MessageService } from 'primeng/api';
import { FleteroApiService } from '../../../core/api/fletero-api.service';
import { EstadosApiService } from '../../../core/api/estados-api.service';
import { Fletero } from '../../../core/models/fletero.model';
import { Estado } from '../../../core/models/estado.model';

@Component({
  selector: 'app-fletero-list',
  imports: [ReactiveFormsModule, TableModule, ButtonModule, DialogModule, InputTextModule, SelectModule],
  templateUrl: './fletero-list.html',
  styleUrl: './fletero-list.scss',
})
export class FleteroList implements OnInit {
  private readonly api = inject(FleteroApiService);
  private readonly estadosApi = inject(EstadosApiService);
  private readonly fb = inject(FormBuilder);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  protected readonly fleteros = signal<Fletero[]>([]);
  protected readonly estados = signal<Estado[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly dialogVisible = signal(false);
  protected readonly editingId = signal<number | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    nombre_fletero: ['', Validators.required],
    cuit: [''],
    telefono: [''],
    id_estado: [null as number | null, Validators.required],
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    forkJoin({
      fleteros: this.api.list(),
      estados: this.estadosApi.list(),
    }).subscribe({
      next: ({ fleteros, estados }) => {
        this.fleteros.set(fleteros);
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

  openEdit(fletero: Fletero): void {
    this.editingId.set(fletero.id_fletero);
    this.form.setValue({
      nombre_fletero: fletero.nombre_fletero,
      cuit: fletero.cuit ?? '',
      telefono: fletero.telefono ?? '',
      id_estado: fletero.id_estado,
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
      nombre_fletero: raw.nombre_fletero,
      id_estado: raw.id_estado!,
      ...(raw.cuit ? { cuit: raw.cuit } : {}),
      ...(raw.telefono ? { telefono: raw.telefono } : {}),
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

  confirmDelete(fletero: Fletero): void {
    this.confirmationService.confirm({
      header: 'Confirmar eliminación',
      message: `¿Eliminar el fletero "${fletero.nombre_fletero}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { severity: 'danger', label: 'Eliminar' },
      rejectButtonProps: { severity: 'secondary', label: 'Cancelar', outlined: true },
      accept: () => this.remove(fletero.id_fletero),
    });
  }

  private remove(id: number): void {
    this.api.remove(id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Fletero eliminado' });
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
