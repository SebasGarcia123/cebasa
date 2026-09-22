import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TransporteApiService } from '../../../core/api/transporte-api.service';
import { CamionApiService, CamionDto } from '../../../core/api/camion-api.service';
import { ChoferApiService, ChoferDto } from '../../../core/api/chofer-api.service';
import { DireccionesApiService } from '../../../core/api/direcciones-api.service';
import { EstadosApiService } from '../../../core/api/estados-api.service';
import { Transporte } from '../../../core/models/transporte.model';
import { Camion } from '../../../core/models/camion.model';
import { Chofer } from '../../../core/models/chofer.model';
import { Estado } from '../../../core/models/estado.model';

const ESTADOS_TRANSPORTE = new Set(['Activo', 'Anulado']);

@Component({
  selector: 'app-transporte-list',
  imports: [ReactiveFormsModule, TableModule, ButtonModule, DialogModule, InputTextModule, SelectModule, TooltipModule],
  templateUrl: './transporte-list.html',
  styleUrl: './transporte-list.scss',
})
export class TransporteList implements OnInit {
  private readonly api = inject(TransporteApiService);
  private readonly camionApi = inject(CamionApiService);
  private readonly choferApi = inject(ChoferApiService);
  private readonly direccionesApi = inject(DireccionesApiService);
  private readonly estadosApi = inject(EstadosApiService);
  private readonly fb = inject(FormBuilder);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  protected readonly transportes = signal<Transporte[]>([]);
  protected readonly estados = signal<Estado[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly dialogVisible = signal(false);
  protected readonly editingId = signal<number | null>(null);
  private transporteEnEdicion: Transporte | null = null;

  // Al crear no se elige estado: el sistema lo pone en "Activo". El
  // selector de estado solo se muestra al editar, y restringido a
  // Activo/Anulado. Vale igual para Transporte que para Chofer.
  protected readonly estadosPermitidos = computed(() =>
    this.estados().filter((e) => ESTADOS_TRANSPORTE.has(e.nombreEstado)),
  );

  protected readonly form = this.fb.nonNullable.group({
    nombre_transporte: ['', Validators.required],
    cuit: ['', Validators.required],
    nombre_contacto: [''],
    telefono: [''],
    cbu_cuenta_bancaria: [''],
    alias_cuenta_bancaria: [''],
    id_estado: [null as number | null],
    direccion: this.fb.nonNullable.group({
      calle: ['', Validators.required],
      numero: [''],
      entrecalle1: [''],
      entrecalle2: [''],
      localidad: ['', Validators.required],
      provincia: ['', Validators.required],
    }),
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    forkJoin({
      transportes: this.api.list(),
      estados: this.estadosApi.list(),
    }).subscribe({
      next: ({ transportes, estados }) => {
        this.transportes.set(transportes);
        this.estados.set(estados);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el listado' });
      },
    });
  }

  direccionLabel(direccion: { calle: string; numero: string | null; localidad: string }): string {
    return `${direccion.calle} ${direccion.numero ?? ''}, ${direccion.localidad}`.trim();
  }

  openCreate(): void {
    this.editingId.set(null);
    this.transporteEnEdicion = null;
    this.form.reset();
    this.dialogVisible.set(true);
  }

  openEdit(transporte: Transporte): void {
    this.editingId.set(transporte.id_transporte);
    this.transporteEnEdicion = transporte;
    this.form.setValue({
      nombre_transporte: transporte.nombre_transporte,
      cuit: transporte.cuit,
      nombre_contacto: transporte.nombre_contacto ?? '',
      telefono: transporte.telefono ?? '',
      cbu_cuenta_bancaria: transporte.cbu_cuenta_bancaria ?? '',
      alias_cuenta_bancaria: transporte.alias_cuenta_bancaria ?? '',
      id_estado: transporte.id_estado,
      direccion: {
        calle: transporte.direcciones?.calle ?? '',
        numero: transporte.direcciones?.numero ?? '',
        entrecalle1: transporte.direcciones?.entrecalle1 ?? '',
        entrecalle2: transporte.direcciones?.entrecalle2 ?? '',
        localidad: transporte.direcciones?.localidad ?? '',
        provincia: transporte.direcciones?.provincia ?? '',
      },
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
    const direccionDto = {
      calle: raw.direccion.calle,
      localidad: raw.direccion.localidad,
      provincia: raw.direccion.provincia,
      ...(raw.direccion.numero ? { numero: raw.direccion.numero } : {}),
      ...(raw.direccion.entrecalle1 ? { entrecalle1: raw.direccion.entrecalle1 } : {}),
      ...(raw.direccion.entrecalle2 ? { entrecalle2: raw.direccion.entrecalle2 } : {}),
    };
    const transporteBase = {
      nombre_transporte: raw.nombre_transporte,
      cuit: raw.cuit,
      ...(raw.nombre_contacto ? { nombre_contacto: raw.nombre_contacto } : {}),
      ...(raw.telefono ? { telefono: raw.telefono } : {}),
      ...(raw.cbu_cuenta_bancaria ? { cbu_cuenta_bancaria: raw.cbu_cuenta_bancaria } : {}),
      ...(raw.alias_cuenta_bancaria ? { alias_cuenta_bancaria: raw.alias_cuenta_bancaria } : {}),
    };

    const id = this.editingId();
    if (id && this.transporteEnEdicion) {
      forkJoin({
        transporte: this.api.update(id, { ...transporteBase, id_estado: raw.id_estado! }),
        direccion: this.direccionesApi.update(this.transporteEnEdicion.id_direccion, direccionDto),
      }).subscribe({
        next: () => this.onSaveSuccess(),
        error: () => this.onSaveError(),
      });
      return;
    }

    const idEstadoActivo = this.estados().find((e) => e.nombreEstado === 'Activo')?.id_estado;
    this.direccionesApi.create({ ...direccionDto, id_estado: idEstadoActivo! }).subscribe({
      next: (direccion) => {
        this.api.create({ ...transporteBase, id_direccion: direccion.id_direccion }).subscribe({
          next: () => this.onSaveSuccess(),
          error: () => this.onSaveError(),
        });
      },
      error: () => this.onSaveError(),
    });
  }

  private onSaveSuccess(): void {
    this.saving.set(false);
    this.dialogVisible.set(false);
    this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Se guardó correctamente' });
    this.load();
  }

  private onSaveError(): void {
    this.saving.set(false);
    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar' });
  }

  confirmDelete(transporte: Transporte): void {
    this.confirmationService.confirm({
      header: 'Confirmar eliminación',
      message: `¿Eliminar el transporte "${transporte.nombre_transporte}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { severity: 'danger', label: 'Eliminar' },
      rejectButtonProps: { severity: 'secondary', label: 'Cancelar', outlined: true },
      accept: () => this.remove(transporte.id_transporte),
    });
  }

  private remove(id: number): void {
    this.api.remove(id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Transporte eliminado' });
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

  // ---- Camiones ----
  protected readonly camionesDialogVisible = signal(false);
  protected readonly camionesLoading = signal(false);
  protected readonly camionesSaving = signal(false);
  protected readonly camiones = signal<Camion[]>([]);
  protected readonly editingCamionId = signal<number | null>(null);
  private transporteActivo: Transporte | null = null;

  protected readonly camionForm = this.fb.nonNullable.group({
    marca: [''],
    modelo: [''],
    dominio_chasis: ['', Validators.required],
    dominio_semi: [''],
  });

  openCamiones(transporte: Transporte): void {
    this.transporteActivo = transporte;
    this.editingCamionId.set(null);
    this.camionForm.reset();
    this.camionesDialogVisible.set(true);
    this.loadCamiones();
  }

  private loadCamiones(): void {
    if (!this.transporteActivo) {
      return;
    }
    this.camionesLoading.set(true);
    this.camionApi.list(this.transporteActivo.id_transporte).subscribe({
      next: (data) => {
        this.camiones.set(data);
        this.camionesLoading.set(false);
      },
      error: () => {
        this.camionesLoading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los camiones' });
      },
    });
  }

  editCamion(camion: Camion): void {
    this.editingCamionId.set(camion.id_camion);
    this.camionForm.setValue({
      marca: camion.marca ?? '',
      modelo: camion.modelo ?? '',
      dominio_chasis: camion.dominio_chasis,
      dominio_semi: camion.dominio_semi ?? '',
    });
  }

  cancelCamionEdit(): void {
    this.editingCamionId.set(null);
    this.camionForm.reset();
  }

  saveCamion(): void {
    if (this.camionForm.invalid || this.camionesSaving() || !this.transporteActivo) {
      return;
    }

    this.camionesSaving.set(true);
    const raw = this.camionForm.getRawValue();
    const dto: CamionDto = {
      dominio_chasis: raw.dominio_chasis,
      ...(raw.marca ? { marca: raw.marca } : {}),
      ...(raw.modelo ? { modelo: raw.modelo } : {}),
      ...(raw.dominio_semi ? { dominio_semi: raw.dominio_semi } : {}),
    };
    const idCamion = this.editingCamionId();
    const request$ = idCamion
      ? this.camionApi.update(this.transporteActivo.id_transporte, idCamion, dto)
      : this.camionApi.create(this.transporteActivo.id_transporte, dto);

    request$.subscribe({
      next: () => {
        this.camionesSaving.set(false);
        this.cancelCamionEdit();
        this.loadCamiones();
      },
      error: () => {
        this.camionesSaving.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el camión' });
      },
    });
  }

  removeCamion(camion: Camion): void {
    if (!this.transporteActivo) {
      return;
    }
    this.camionApi.remove(this.transporteActivo.id_transporte, camion.id_camion).subscribe({
      next: () => this.loadCamiones(),
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el camión' });
      },
    });
  }

  // ---- Choferes ----
  protected readonly choferesDialogVisible = signal(false);
  protected readonly choferesLoading = signal(false);
  protected readonly choferesSaving = signal(false);
  protected readonly choferes = signal<Chofer[]>([]);
  protected readonly editingChoferId = signal<number | null>(null);
  private choferEnEdicion: Chofer | null = null;

  protected readonly choferForm = this.fb.nonNullable.group({
    nombre_chofer: ['', Validators.required],
    dni: ['', Validators.required],
    id_estado: [null as number | null],
    direccion: this.fb.nonNullable.group({
      calle: ['', Validators.required],
      numero: [''],
      entrecalle1: [''],
      entrecalle2: [''],
      localidad: ['', Validators.required],
      provincia: ['', Validators.required],
    }),
  });

  openChoferes(transporte: Transporte): void {
    this.transporteActivo = transporte;
    this.editingChoferId.set(null);
    this.choferEnEdicion = null;
    this.choferForm.reset();
    this.choferesDialogVisible.set(true);
    this.loadChoferes();
  }

  private loadChoferes(): void {
    if (!this.transporteActivo) {
      return;
    }
    this.choferesLoading.set(true);
    this.choferApi.list(this.transporteActivo.id_transporte).subscribe({
      next: (data) => {
        this.choferes.set(data);
        this.choferesLoading.set(false);
      },
      error: () => {
        this.choferesLoading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los choferes' });
      },
    });
  }

  editChofer(chofer: Chofer): void {
    this.editingChoferId.set(chofer.id_chofer);
    this.choferEnEdicion = chofer;
    this.choferForm.setValue({
      nombre_chofer: chofer.nombre_chofer,
      dni: chofer.dni,
      id_estado: chofer.id_estado,
      direccion: {
        calle: chofer.direcciones?.calle ?? '',
        numero: chofer.direcciones?.numero ?? '',
        entrecalle1: chofer.direcciones?.entrecalle1 ?? '',
        entrecalle2: chofer.direcciones?.entrecalle2 ?? '',
        localidad: chofer.direcciones?.localidad ?? '',
        provincia: chofer.direcciones?.provincia ?? '',
      },
    });
  }

  cancelChoferEdit(): void {
    this.editingChoferId.set(null);
    this.choferEnEdicion = null;
    this.choferForm.reset();
  }

  saveChofer(): void {
    if (this.choferForm.invalid || this.choferesSaving() || !this.transporteActivo) {
      return;
    }

    this.choferesSaving.set(true);
    const raw = this.choferForm.getRawValue();
    const direccionDto = {
      calle: raw.direccion.calle,
      localidad: raw.direccion.localidad,
      provincia: raw.direccion.provincia,
      ...(raw.direccion.numero ? { numero: raw.direccion.numero } : {}),
      ...(raw.direccion.entrecalle1 ? { entrecalle1: raw.direccion.entrecalle1 } : {}),
      ...(raw.direccion.entrecalle2 ? { entrecalle2: raw.direccion.entrecalle2 } : {}),
    };
    const choferBase = { nombre_chofer: raw.nombre_chofer, dni: raw.dni };

    const idChofer = this.editingChoferId();
    if (idChofer && this.choferEnEdicion) {
      forkJoin({
        chofer: this.choferApi.update(this.transporteActivo.id_transporte, idChofer, {
          ...choferBase,
          id_estado: raw.id_estado!,
        }),
        direccion: this.direccionesApi.update(this.choferEnEdicion.id_direccion, direccionDto),
      }).subscribe({
        next: () => this.onChoferSaved(),
        error: () => this.onChoferSaveError(),
      });
      return;
    }

    const idEstadoActivo = this.estados().find((e) => e.nombreEstado === 'Activo')?.id_estado;
    this.direccionesApi.create({ ...direccionDto, id_estado: idEstadoActivo! }).subscribe({
      next: (direccion) => {
        const dto: ChoferDto = { ...choferBase, id_direccion: direccion.id_direccion };
        this.choferApi.create(this.transporteActivo!.id_transporte, dto).subscribe({
          next: () => this.onChoferSaved(),
          error: () => this.onChoferSaveError(),
        });
      },
      error: () => this.onChoferSaveError(),
    });
  }

  private onChoferSaved(): void {
    this.choferesSaving.set(false);
    this.cancelChoferEdit();
    this.loadChoferes();
  }

  private onChoferSaveError(): void {
    this.choferesSaving.set(false);
    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el chofer' });
  }

  removeChofer(chofer: Chofer): void {
    if (!this.transporteActivo) {
      return;
    }
    this.choferApi.remove(this.transporteActivo.id_transporte, chofer.id_chofer).subscribe({
      next: () => this.loadChoferes(),
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el chofer' });
      },
    });
  }
}
