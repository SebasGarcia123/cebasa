import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TipoMovimientoApiService } from '../../../core/api/tipo-movimiento-api.service';
import { NaturalezaApiService } from '../../../core/api/naturaleza-api.service';
import { EstadosApiService } from '../../../core/api/estados-api.service';
import { TipoMovimiento } from '../../../core/models/tipo-movimiento.model';
import { Naturaleza } from '../../../core/models/naturaleza.model';
import { Estado } from '../../../core/models/estado.model';

@Component({
  selector: 'app-tipo-movimiento-list',
  imports: [ReactiveFormsModule, TableModule, ButtonModule, DialogModule, InputTextModule, SelectModule],
  templateUrl: './tipo-movimiento-list.html',
  styleUrl: './tipo-movimiento-list.scss',
})
export class TipoMovimientoList implements OnInit {
  private readonly api = inject(TipoMovimientoApiService);
  private readonly naturalezaApi = inject(NaturalezaApiService);
  private readonly estadosApi = inject(EstadosApiService);
  private readonly fb = inject(FormBuilder);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  protected readonly items = signal<TipoMovimiento[]>([]);
  protected readonly naturalezas = signal<Naturaleza[]>([]);
  protected readonly estados = signal<Estado[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly dialogVisible = signal(false);
  protected readonly editingId = signal<number | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    nombre_movimiento: ['', Validators.required],
    id_naturaleza: [null as number | null, Validators.required],
    id_estado: [null as number | null, Validators.required],
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    forkJoin({
      items: this.api.list(),
      naturalezas: this.naturalezaApi.list(),
      estados: this.estadosApi.list(),
    }).subscribe({
      next: ({ items, naturalezas, estados }) => {
        this.items.set(items);
        this.naturalezas.set(naturalezas);
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

  openEdit(item: TipoMovimiento): void {
    this.editingId.set(item.id_tipo_movimiento);
    this.form.setValue({
      nombre_movimiento: item.nombre_movimiento,
      id_naturaleza: item.id_naturaleza,
      id_estado: item.id_estado,
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
    const dto = { nombre_movimiento: raw.nombre_movimiento, id_naturaleza: raw.id_naturaleza!, id_estado: raw.id_estado! };
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

  confirmDelete(item: TipoMovimiento): void {
    this.confirmationService.confirm({
      header: 'Confirmar eliminación',
      message: `¿Eliminar "${item.nombre_movimiento}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { severity: 'danger', label: 'Eliminar' },
      rejectButtonProps: { severity: 'secondary', label: 'Cancelar', outlined: true },
      accept: () => this.remove(item.id_tipo_movimiento),
    });
  }

  private remove(id: number): void {
    this.api.remove(id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Eliminado correctamente' });
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
