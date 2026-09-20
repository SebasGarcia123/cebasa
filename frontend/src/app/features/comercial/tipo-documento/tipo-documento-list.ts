import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TipoDocumentoApiService } from '../../../core/api/tipo-documento-api.service';
import { TipoImpactoApiService } from '../../../core/api/tipo-impacto-api.service';
import { TipoDocumento } from '../../../core/models/tipo-documento.model';
import { TipoImpacto } from '../../../core/models/tipo-impacto.model';

@Component({
  selector: 'app-tipo-documento-list',
  imports: [ReactiveFormsModule, TableModule, ButtonModule, DialogModule, InputTextModule, SelectModule],
  templateUrl: './tipo-documento-list.html',
  styleUrl: './tipo-documento-list.scss',
})
export class TipoDocumentoList implements OnInit {
  private readonly api = inject(TipoDocumentoApiService);
  private readonly tipoImpactoApi = inject(TipoImpactoApiService);
  private readonly fb = inject(FormBuilder);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  protected readonly items = signal<TipoDocumento[]>([]);
  protected readonly tiposImpacto = signal<TipoImpacto[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly dialogVisible = signal(false);
  protected readonly editingId = signal<number | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    descripcion: ['', Validators.required],
    id_tipo_impacto: [null as number | null, Validators.required],
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    forkJoin({
      items: this.api.list(),
      tiposImpacto: this.tipoImpactoApi.list(),
    }).subscribe({
      next: ({ items, tiposImpacto }) => {
        this.items.set(items);
        this.tiposImpacto.set(tiposImpacto);
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

  openEdit(item: TipoDocumento): void {
    this.editingId.set(item.id_tipo_documento);
    this.form.setValue({ descripcion: item.descripcion, id_tipo_impacto: item.id_tipo_impacto });
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
    const dto = { descripcion: raw.descripcion, id_tipo_impacto: raw.id_tipo_impacto! };
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

  confirmDelete(item: TipoDocumento): void {
    this.confirmationService.confirm({
      header: 'Confirmar eliminación',
      message: `¿Eliminar "${item.descripcion}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { severity: 'danger', label: 'Eliminar' },
      rejectButtonProps: { severity: 'secondary', label: 'Cancelar', outlined: true },
      accept: () => this.remove(item.id_tipo_documento),
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
