import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { map } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { RolesApiService } from '../../../core/api/roles-api.service';
import { PermisosApiService } from '../../../core/api/permisos-api.service';
import { RolPermisosApiService } from '../../../core/api/rol-permisos-api.service';
import { Rol } from '../../../core/models/rol.model';
import { AssignmentDialog, AssignableItem } from '../../../shared/assignment-dialog/assignment-dialog';

@Component({
  selector: 'app-roles-list',
  imports: [
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    TooltipModule,
    AssignmentDialog,
  ],
  templateUrl: './roles-list.html',
  styleUrl: './roles-list.scss',
})
export class RolesList implements OnInit {
  private readonly api = inject(RolesApiService);
  private readonly permisosApi = inject(PermisosApiService);
  private readonly rolPermisosApi = inject(RolPermisosApiService);
  private readonly fb = inject(FormBuilder);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  protected readonly roles = signal<Rol[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly dialogVisible = signal(false);
  protected readonly editingId = signal<number | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    nombre_rol: ['', Validators.required],
  });

  protected readonly permisosDialogVisible = signal(false);
  protected readonly permisosItems = signal<AssignableItem[]>([]);
  protected readonly permisosAsignados = signal<Set<number>>(new Set());
  protected readonly permisosBusy = signal<Set<number>>(new Set());
  private rolActivo: Rol | null = null;

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.api.list().subscribe({
      next: (data) => {
        this.roles.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar el listado de roles',
        });
      },
    });
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.reset();
    this.dialogVisible.set(true);
  }

  openEdit(rol: Rol): void {
    this.editingId.set(rol.id_rol);
    this.form.setValue({ nombre_rol: rol.nombre_rol });
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
          detail: 'El rol se guardó correctamente',
        });
        this.load();
      },
      error: () => {
        this.saving.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar' });
      },
    });
  }

  confirmDelete(rol: Rol): void {
    this.confirmationService.confirm({
      header: 'Confirmar eliminación',
      message: `¿Eliminar el rol "${rol.nombre_rol}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { severity: 'danger', label: 'Eliminar' },
      rejectButtonProps: { severity: 'secondary', label: 'Cancelar', outlined: true },
      accept: () => this.remove(rol.id_rol),
    });
  }

  private remove(id: number): void {
    this.api.remove(id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Rol eliminado' });
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

  openPermisos(rol: Rol): void {
    this.rolActivo = rol;
    this.permisosDialogVisible.set(true);

    this.permisosApi.list().subscribe({
      next: (permisos) => {
        this.permisosItems.set(
          permisos.map((p) => ({ id: p.id_permiso, label: p.nombre_permiso })),
        );
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar el listado de permisos',
        });
      },
    });

    this.rolPermisosApi.list(rol.id_rol).subscribe({
      next: (asignados) => {
        this.permisosAsignados.set(new Set(asignados.map((a) => a.id_permiso)));
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los permisos asignados',
        });
      },
    });
  }

  togglePermiso(event: { id: number; checked: boolean }): void {
    const rol = this.rolActivo;
    if (!rol) {
      return;
    }

    this.permisosBusy.update((busy) => new Set(busy).add(event.id));
    const request$ = event.checked
      ? this.rolPermisosApi.assign(rol.id_rol, event.id).pipe(map(() => undefined))
      : this.rolPermisosApi.remove(rol.id_rol, event.id);

    request$.subscribe({
      next: () => {
        this.permisosAsignados.update((current) => {
          const next = new Set(current);
          event.checked ? next.add(event.id) : next.delete(event.id);
          return next;
        });
        this.permisosBusy.update((busy) => {
          const next = new Set(busy);
          next.delete(event.id);
          return next;
        });
      },
      error: () => {
        this.permisosBusy.update((busy) => {
          const next = new Set(busy);
          next.delete(event.id);
          return next;
        });
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar el permiso',
        });
      },
    });
  }
}
