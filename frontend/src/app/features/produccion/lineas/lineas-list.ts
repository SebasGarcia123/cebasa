import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmationService, MessageService } from 'primeng/api';
import { LineasApiService } from '../../../core/api/lineas-api.service';
import { Linea } from '../../../core/models/linea.model';

@Component({
  selector: 'app-lineas-list',
  imports: [ReactiveFormsModule, TableModule, ButtonModule, DialogModule, InputTextModule],
  templateUrl: './lineas-list.html',
  styleUrl: './lineas-list.scss',
})
export class LineasList implements OnInit {
  private readonly api = inject(LineasApiService);
  private readonly fb = inject(FormBuilder);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  protected readonly items = signal<Linea[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly dialogVisible = signal(false);
  protected readonly editingId = signal<number | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    descripcion_lineas: ['', Validators.required],
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.api.list().subscribe({
      next: (data) => {
        this.items.set(data);
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

  openEdit(item: Linea): void {
    this.editingId.set(item.id_lineas);
    this.form.setValue({ descripcion_lineas: item.descripcion_lineas });
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
    const dto = this.form.getRawValue();
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

  confirmDelete(item: Linea): void {
    this.confirmationService.confirm({
      header: 'Confirmar eliminación',
      message: `¿Eliminar "${item.descripcion_lineas}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { severity: 'danger', label: 'Eliminar' },
      rejectButtonProps: { severity: 'secondary', label: 'Cancelar', outlined: true },
      accept: () => this.remove(item.id_lineas),
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
