import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DepositosApiService } from '../../../core/api/depositos-api.service';
import { EstadosApiService } from '../../../core/api/estados-api.service';
import { Deposito } from '../../../core/models/deposito.model';
import { Estado } from '../../../core/models/estado.model';

const ESTADOS_DEPOSITO = new Set(['Activo', 'Anulado']);

@Component({
  selector: 'app-depositos-list',
  imports: [ReactiveFormsModule, TableModule, ButtonModule, DialogModule, InputTextModule, SelectModule],
  templateUrl: './depositos-list.html',
  styleUrl: './depositos-list.scss',
})
export class DepositosList implements OnInit {
  private readonly api = inject(DepositosApiService);
  private readonly estadosApi = inject(EstadosApiService);
  private readonly fb = inject(FormBuilder);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  protected readonly depositos = signal<Deposito[]>([]);
  protected readonly estados = signal<Estado[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly dialogVisible = signal(false);
  protected readonly editingId = signal<number | null>(null);

  // Al crear no se elige estado: el sistema lo pone en "Activo". El
  // selector de estado solo se muestra al editar, y restringido a
  // Activo/Anulado (no el resto del catálogo genérico).
  protected readonly estadosDeposito = computed(() => this.estados().filter((e) => ESTADOS_DEPOSITO.has(e.nombreEstado)));

  protected readonly form = this.fb.nonNullable.group({
    nombre_deposito: ['', Validators.required],
    id_estado: [null as number | null],
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    forkJoin({
      depositos: this.api.list(),
      estados: this.estadosApi.list(),
    }).subscribe({
      next: ({ depositos, estados }) => {
        this.depositos.set(depositos);
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

  openEdit(deposito: Deposito): void {
    this.editingId.set(deposito.id_deposito);
    this.form.setValue({ nombre_deposito: deposito.nombre_deposito, id_estado: deposito.id_estado });
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
    const id = this.editingId();
    const request$ = id
      ? this.api.update(id, { nombre_deposito: raw.nombre_deposito, id_estado: raw.id_estado! })
      : this.api.create({ nombre_deposito: raw.nombre_deposito });

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

  confirmDelete(deposito: Deposito): void {
    this.confirmationService.confirm({
      header: 'Confirmar eliminación',
      message: `¿Eliminar el depósito "${deposito.nombre_deposito}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { severity: 'danger', label: 'Eliminar' },
      rejectButtonProps: { severity: 'secondary', label: 'Cancelar', outlined: true },
      accept: () => this.remove(deposito.id_deposito),
    });
  }

  private remove(id: number): void {
    this.api.remove(id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Depósito eliminado' });
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
