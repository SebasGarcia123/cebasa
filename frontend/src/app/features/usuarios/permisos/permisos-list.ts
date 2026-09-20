import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PermisosApiService } from '../../../core/api/permisos-api.service';
import { PermissionsCatalogApiService } from '../../../core/api/permissions-catalog-api.service';
import { Permiso } from '../../../core/models/permiso.model';

@Component({
  selector: 'app-permisos-list',
  imports: [ReactiveFormsModule, TableModule, ButtonModule, DialogModule, InputTextModule, MessageModule],
  templateUrl: './permisos-list.html',
  styleUrl: './permisos-list.scss',
})
export class PermisosList implements OnInit {
  private readonly api = inject(PermisosApiService);
  private readonly catalogApi = inject(PermissionsCatalogApiService);
  private readonly fb = inject(FormBuilder);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  protected readonly permisos = signal<Permiso[]>([]);
  protected readonly catalogo = signal<string[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly dialogVisible = signal(false);
  protected readonly editingId = signal<number | null>(null);

  protected readonly faltantes = computed(() => {
    const existentes = new Set(this.permisos().map((p) => p.nombre_permiso));
    return this.catalogo().filter((nombre) => !existentes.has(nombre));
  });

  protected readonly form = this.fb.nonNullable.group({
    nombre_permiso: ['', Validators.required],
  });

  ngOnInit(): void {
    this.load();
    this.catalogApi.list().subscribe({
      next: (nombres) => this.catalogo.set(nombres),
      error: () => {
        // El catalogo es informativo; si falla, la pantalla sigue funcionando sin el aviso.
      },
    });
  }

  private load(): void {
    this.loading.set(true);
    this.api.list().subscribe({
      next: (data) => {
        this.permisos.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar el listado de permisos',
        });
      },
    });
  }

  openCreate(nombreSugerido?: string): void {
    this.editingId.set(null);
    this.form.reset();
    if (nombreSugerido) {
      this.form.setValue({ nombre_permiso: nombreSugerido });
    }
    this.dialogVisible.set(true);
  }

  openEdit(permiso: Permiso): void {
    this.editingId.set(permiso.id_permiso);
    this.form.setValue({ nombre_permiso: permiso.nombre_permiso });
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
        this.messageService.add({
          severity: 'success',
          summary: 'Guardado',
          detail: 'El permiso se guardó correctamente',
        });
        this.load();
      },
      error: () => {
        this.saving.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar' });
      },
    });
  }

  confirmDelete(permiso: Permiso): void {
    this.confirmationService.confirm({
      header: 'Confirmar eliminación',
      message: `¿Eliminar el permiso "${permiso.nombre_permiso}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { severity: 'danger', label: 'Eliminar' },
      rejectButtonProps: { severity: 'secondary', label: 'Cancelar', outlined: true },
      accept: () => this.remove(permiso.id_permiso),
    });
  }

  private remove(id: number): void {
    this.api.remove(id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Permiso eliminado' });
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
