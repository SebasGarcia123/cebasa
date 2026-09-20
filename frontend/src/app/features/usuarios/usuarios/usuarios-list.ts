import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { forkJoin, map } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { UsuariosApiService } from '../../../core/api/usuarios-api.service';
import { SectoresApiService } from '../../../core/api/sectores-api.service';
import { EstadosApiService } from '../../../core/api/estados-api.service';
import { RolesApiService } from '../../../core/api/roles-api.service';
import { UsuarioRolesApiService } from '../../../core/api/usuario-roles-api.service';
import { Usuario } from '../../../core/models/usuario.model';
import { Sector } from '../../../core/models/sector.model';
import { Estado } from '../../../core/models/estado.model';
import { AssignmentDialog, AssignableItem } from '../../../shared/assignment-dialog/assignment-dialog';

const ESTADOS_USUARIO = new Set(['Activo', 'Cancelado']);

@Component({
  selector: 'app-usuarios-list',
  imports: [
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    PasswordModule,
    SelectModule,
    TooltipModule,
    AssignmentDialog,
  ],
  templateUrl: './usuarios-list.html',
  styleUrl: './usuarios-list.scss',
})
export class UsuariosList implements OnInit {
  private readonly api = inject(UsuariosApiService);
  private readonly sectoresApi = inject(SectoresApiService);
  private readonly estadosApi = inject(EstadosApiService);
  private readonly rolesApi = inject(RolesApiService);
  private readonly usuarioRolesApi = inject(UsuarioRolesApiService);
  private readonly fb = inject(FormBuilder);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  protected readonly usuarios = signal<Usuario[]>([]);
  protected readonly sectores = signal<Sector[]>([]);
  protected readonly estados = signal<Estado[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly dialogVisible = signal(false);
  protected readonly editingId = signal<number | null>(null);

  // Al crear no se elige estado: el sistema lo pone en "Activo" (ver
  // save()). El selector de estado solo se muestra al editar, y
  // restringido a Activo/Cancelado (no el resto del catálogo genérico).
  protected readonly estadosUsuario = computed(() => this.estados().filter((e) => ESTADOS_USUARIO.has(e.nombreEstado)));

  protected readonly form = this.fb.nonNullable.group({
    nombre_usuario: ['', Validators.required],
    password: [''],
    email: ['', Validators.email],
    id_sector: [null as number | null, Validators.required],
    id_estado: [null as number | null],
  });

  protected readonly rolesDialogVisible = signal(false);
  protected readonly rolesItems = signal<AssignableItem[]>([]);
  protected readonly rolesAsignados = signal<Set<number>>(new Set());
  protected readonly rolesBusy = signal<Set<number>>(new Set());
  private usuarioActivo: Usuario | null = null;

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    forkJoin({
      usuarios: this.api.list(),
      sectores: this.sectoresApi.list(),
      estados: this.estadosApi.list(),
    }).subscribe({
      next: ({ usuarios, sectores, estados }) => {
        this.usuarios.set(usuarios);
        this.sectores.set(sectores);
        this.estados.set(estados);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar el listado de usuarios',
        });
      },
    });
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.reset();
    this.form.controls.password.setValidators([Validators.required, Validators.minLength(8)]);
    this.form.controls.password.updateValueAndValidity();
    this.dialogVisible.set(true);
  }

  openEdit(usuario: Usuario): void {
    this.editingId.set(usuario.id_usuario);
    this.form.setValue({
      nombre_usuario: usuario.nombre_usuario,
      password: '',
      email: usuario.email ?? '',
      id_sector: usuario.id_sector,
      id_estado: usuario.id_estado,
    });
    this.form.controls.password.setValidators([Validators.minLength(8)]);
    this.form.controls.password.updateValueAndValidity();
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
      ? this.api.update(id, {
          nombre_usuario: raw.nombre_usuario,
          id_sector: raw.id_sector!,
          id_estado: raw.id_estado!,
          email: raw.email || null,
          ...(raw.password ? { password: raw.password } : {}),
        })
      : this.api.create({
          nombre_usuario: raw.nombre_usuario,
          password: raw.password,
          id_sector: raw.id_sector!,
          ...(raw.email ? { email: raw.email } : {}),
        });

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogVisible.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Guardado',
          detail: 'El usuario se guardó correctamente',
        });
        this.load();
      },
      error: () => {
        this.saving.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar' });
      },
    });
  }

  confirmDelete(usuario: Usuario): void {
    this.confirmationService.confirm({
      header: 'Confirmar eliminación',
      message: `¿Eliminar el usuario "${usuario.nombre_usuario}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { severity: 'danger', label: 'Eliminar' },
      rejectButtonProps: { severity: 'secondary', label: 'Cancelar', outlined: true },
      accept: () => this.remove(usuario.id_usuario),
    });
  }

  private remove(id: number): void {
    this.api.remove(id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Usuario eliminado' });
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

  openRoles(usuario: Usuario): void {
    this.usuarioActivo = usuario;
    this.rolesDialogVisible.set(true);

    this.rolesApi.list().subscribe({
      next: (roles) => {
        this.rolesItems.set(roles.map((r) => ({ id: r.id_rol, label: r.nombre_rol })));
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el listado de roles' });
      },
    });

    this.usuarioRolesApi.list(usuario.id_usuario).subscribe({
      next: (asignados) => {
        this.rolesAsignados.set(new Set(asignados.map((a) => a.id_rol)));
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los roles asignados',
        });
      },
    });
  }

  toggleRol(event: { id: number; checked: boolean }): void {
    const usuario = this.usuarioActivo;
    if (!usuario) {
      return;
    }

    this.rolesBusy.update((busy) => new Set(busy).add(event.id));
    const request$ = event.checked
      ? this.usuarioRolesApi.assign(usuario.id_usuario, event.id).pipe(map(() => undefined))
      : this.usuarioRolesApi.remove(usuario.id_usuario, event.id);

    request$.subscribe({
      next: () => {
        this.rolesAsignados.update((current) => {
          const next = new Set(current);
          event.checked ? next.add(event.id) : next.delete(event.id);
          return next;
        });
        this.rolesBusy.update((busy) => {
          const next = new Set(busy);
          next.delete(event.id);
          return next;
        });
      },
      error: () => {
        this.rolesBusy.update((busy) => {
          const next = new Set(busy);
          next.delete(event.id);
          return next;
        });
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el rol' });
      },
    });
  }
}
