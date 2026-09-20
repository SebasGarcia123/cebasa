import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ProveedoresApiService } from '../../../core/api/proveedores-api.service';
import { EstadosApiService } from '../../../core/api/estados-api.service';
import { Proveedor } from '../../../core/models/proveedor.model';
import { Estado } from '../../../core/models/estado.model';
import { forkJoin } from 'rxjs';

const ESTADOS_PROVEEDOR = new Set(['Activo', 'Anulado']);

@Component({
  selector: 'app-proveedores-list',
  imports: [ReactiveFormsModule, TableModule, ButtonModule, DialogModule, InputTextModule, SelectModule],
  templateUrl: './proveedores-list.html',
  styleUrl: './proveedores-list.scss',
})
export class ProveedoresList implements OnInit {
  private readonly api = inject(ProveedoresApiService);
  private readonly estadosApi = inject(EstadosApiService);
  private readonly fb = inject(FormBuilder);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  protected readonly proveedores = signal<Proveedor[]>([]);
  protected readonly estados = signal<Estado[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly dialogVisible = signal(false);
  protected readonly editingId = signal<number | null>(null);

  // Al crear no se elige estado: el sistema lo pone en "Activo". El
  // selector de estado solo se muestra al editar, y restringido a
  // Activo/Anulado (no el resto del catálogo genérico).
  protected readonly estadosProveedor = computed(() => this.estados().filter((e) => ESTADOS_PROVEEDOR.has(e.nombreEstado)));

  protected readonly form = this.fb.nonNullable.group({
    nombre_proveedor: ['', Validators.required],
    direccion: [''],
    email: ['', Validators.email],
    nombre_contacto: [''],
    telefono: [''],
    cbu: [''],
    alias: [''],
    id_estado: [null as number | null],
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    forkJoin({
      proveedores: this.api.list(),
      estados: this.estadosApi.list(),
    }).subscribe({
      next: ({ proveedores, estados }) => {
        this.proveedores.set(proveedores);
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

  openEdit(proveedor: Proveedor): void {
    this.editingId.set(proveedor.id_proveedor);
    this.form.setValue({
      nombre_proveedor: proveedor.nombre_proveedor,
      direccion: proveedor.direccion ?? '',
      email: proveedor.email ?? '',
      nombre_contacto: proveedor.nombre_contacto ?? '',
      telefono: proveedor.telefono ?? '',
      cbu: proveedor.cbu ?? '',
      alias: proveedor.alias ?? '',
      id_estado: proveedor.id_estado,
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
      nombre_proveedor: raw.nombre_proveedor,
      ...(raw.direccion ? { direccion: raw.direccion } : {}),
      ...(raw.email ? { email: raw.email } : {}),
      ...(raw.nombre_contacto ? { nombre_contacto: raw.nombre_contacto } : {}),
      ...(raw.telefono ? { telefono: raw.telefono } : {}),
      ...(raw.cbu ? { cbu: raw.cbu } : {}),
      ...(raw.alias ? { alias: raw.alias } : {}),
    };
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

  confirmDelete(proveedor: Proveedor): void {
    this.confirmationService.confirm({
      header: 'Confirmar eliminación',
      message: `¿Eliminar el proveedor "${proveedor.nombre_proveedor}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { severity: 'danger', label: 'Eliminar' },
      rejectButtonProps: { severity: 'secondary', label: 'Cancelar', outlined: true },
      accept: () => this.remove(proveedor.id_proveedor),
    });
  }

  private remove(id: number): void {
    this.api.remove(id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Proveedor eliminado' });
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
