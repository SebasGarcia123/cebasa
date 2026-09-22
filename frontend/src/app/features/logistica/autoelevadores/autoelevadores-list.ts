import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AutoelevadoresApiService } from '../../../core/api/autoelevadores-api.service';
import { ServiceAutoelevadorApiService } from '../../../core/api/service-autoelevador-api.service';
import { EstadosApiService } from '../../../core/api/estados-api.service';
import { Autoelevador } from '../../../core/models/autoelevador.model';
import { ServiceAutoelevador } from '../../../core/models/service-autoelevador.model';
import { Estado } from '../../../core/models/estado.model';

const ESTADOS_AUTOELEVADOR = new Set(['Activo', 'Anulado']);

@Component({
  selector: 'app-autoelevadores-list',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    DatePickerModule,
    TooltipModule,
  ],
  templateUrl: './autoelevadores-list.html',
  styleUrl: './autoelevadores-list.scss',
})
export class AutoelevadoresList implements OnInit {
  private readonly api = inject(AutoelevadoresApiService);
  private readonly serviciosApi = inject(ServiceAutoelevadorApiService);
  private readonly estadosApi = inject(EstadosApiService);
  private readonly fb = inject(FormBuilder);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  protected readonly autoelevadores = signal<Autoelevador[]>([]);
  protected readonly estados = signal<Estado[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly dialogVisible = signal(false);
  protected readonly editingId = signal<number | null>(null);

  // Al crear no se elige estado: el sistema lo pone en "Activo". El
  // selector de estado solo se muestra al editar, y restringido a
  // Activo/Anulado.
  protected readonly estadosAutoelevador = computed(() =>
    this.estados().filter((e) => ESTADOS_AUTOELEVADOR.has(e.nombreEstado)),
  );

  protected readonly form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    fecha_alta: [null as Date | null, Validators.required],
    id_estado: [null as number | null],
  });

  protected readonly serviciosDialogVisible = signal(false);
  protected readonly serviciosLoading = signal(false);
  protected readonly serviciosSaving = signal(false);
  protected readonly servicios = signal<ServiceAutoelevador[]>([]);
  protected readonly editingServicioId = signal<number | null>(null);
  private autoelevadorActivo: Autoelevador | null = null;

  protected readonly servicioForm = this.fb.nonNullable.group({
    horas: [null as number | null, [Validators.required, Validators.min(0)]],
    detalle: [''],
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    forkJoin({
      autoelevadores: this.api.list(),
      estados: this.estadosApi.list(),
    }).subscribe({
      next: ({ autoelevadores, estados }) => {
        this.autoelevadores.set(autoelevadores);
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

  openEdit(autoelevador: Autoelevador): void {
    this.editingId.set(autoelevador.id_autoelevadores);
    this.form.setValue({
      nombre: autoelevador.nombre,
      fecha_alta: new Date(autoelevador.fecha_alta),
      id_estado: autoelevador.id_estado,
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
      nombre: raw.nombre,
      fecha_alta: raw.fecha_alta!.toISOString().slice(0, 10),
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

  confirmDelete(autoelevador: Autoelevador): void {
    this.confirmationService.confirm({
      header: 'Confirmar eliminación',
      message: `¿Eliminar "${autoelevador.nombre}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { severity: 'danger', label: 'Eliminar' },
      rejectButtonProps: { severity: 'secondary', label: 'Cancelar', outlined: true },
      accept: () => this.remove(autoelevador.id_autoelevadores),
    });
  }

  private remove(id: number): void {
    this.api.remove(id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Autoelevador eliminado' });
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

  openServicios(autoelevador: Autoelevador): void {
    this.autoelevadorActivo = autoelevador;
    this.editingServicioId.set(null);
    this.servicioForm.reset();
    this.serviciosDialogVisible.set(true);
    this.loadServicios();
  }

  private loadServicios(): void {
    if (!this.autoelevadorActivo) {
      return;
    }
    this.serviciosLoading.set(true);
    this.serviciosApi.list(this.autoelevadorActivo.id_autoelevadores).subscribe({
      next: (data) => {
        this.servicios.set(data);
        this.serviciosLoading.set(false);
      },
      error: () => {
        this.serviciosLoading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los servicios' });
      },
    });
  }

  editServicio(servicio: ServiceAutoelevador): void {
    this.editingServicioId.set(servicio.id_service_autoelevador);
    // horas es Decimal en la base: Prisma lo serializa como string, no
    // number. Sin convertir acá, guardar sin tocar el campo manda el
    // string de vuelta y el backend lo rechaza.
    this.servicioForm.setValue({ horas: Number(servicio.horas), detalle: servicio.detalle ?? '' });
  }

  cancelServicioEdit(): void {
    this.editingServicioId.set(null);
    this.servicioForm.reset();
  }

  saveServicio(): void {
    if (this.servicioForm.invalid || this.serviciosSaving() || !this.autoelevadorActivo) {
      return;
    }

    this.serviciosSaving.set(true);
    const raw = this.servicioForm.getRawValue();
    const dto = { horas: Number(raw.horas), ...(raw.detalle ? { detalle: raw.detalle } : {}) };
    const idServicio = this.editingServicioId();
    const request$ = idServicio
      ? this.serviciosApi.update(this.autoelevadorActivo.id_autoelevadores, idServicio, dto)
      : this.serviciosApi.create(this.autoelevadorActivo.id_autoelevadores, dto);

    request$.subscribe({
      next: () => {
        this.serviciosSaving.set(false);
        this.cancelServicioEdit();
        this.loadServicios();
      },
      error: () => {
        this.serviciosSaving.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el servicio' });
      },
    });
  }

  removeServicio(servicio: ServiceAutoelevador): void {
    if (!this.autoelevadorActivo) {
      return;
    }
    this.serviciosApi.remove(this.autoelevadorActivo.id_autoelevadores, servicio.id_service_autoelevador).subscribe({
      next: () => this.loadServicios(),
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el servicio' });
      },
    });
  }
}
