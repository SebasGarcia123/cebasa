import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ReclamosApiService } from '../../../core/api/reclamos-api.service';
import { ClientesApiService } from '../../../core/api/clientes-api.service';
import { SectoresApiService } from '../../../core/api/sectores-api.service';
import { Reclamo } from '../../../core/models/reclamo.model';
import { Cliente } from '../../../core/models/cliente.model';
import { Sector } from '../../../core/models/sector.model';

type TipoRechazo = 'redireccion' | 'no_corresponde';

@Component({
  selector: 'app-reclamos-list',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    DatePickerModule,
    TooltipModule,
  ],
  templateUrl: './reclamos-list.html',
  styleUrl: './reclamos-list.scss',
})
export class ReclamosList implements OnInit {
  private readonly api = inject(ReclamosApiService);
  private readonly clientesApi = inject(ClientesApiService);
  private readonly sectoresApi = inject(SectoresApiService);
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);

  protected readonly reclamos = signal<Reclamo[]>([]);
  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly sectores = signal<Sector[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);

  protected readonly createDialogVisible = signal(false);
  protected readonly resolverDialogVisible = signal(false);
  protected readonly rechazarDialogVisible = signal(false);
  protected readonly activeReclamo = signal<Reclamo | null>(null);
  protected readonly tipoRechazo = signal<TipoRechazo>('no_corresponde');

  // id_usuario: el reclamo lo registra el usuario logueado. Por ahora se
  // fija a 1 (el usuario de prueba); cuando haya un selector de "usuario
  // actual" real, se reemplaza por el id de la sesión.
  // No hay campo de estado: un reclamo nuevo siempre arranca "Activo", lo
  // asigna el sistema.
  protected readonly form = this.fb.nonNullable.group({
    fecha: [null as Date | null, Validators.required],
    descripcion: [''],
    id_cliente: [null as number | null, Validators.required],
    id_sector: [null as number | null, Validators.required],
  });

  protected readonly resolverForm = this.fb.nonNullable.group({
    solucion: ['', [Validators.required, Validators.maxLength(500)]],
  });

  protected readonly rechazarForm = this.fb.nonNullable.group({
    motivo_rechazo: ['', [Validators.required, Validators.maxLength(500)]],
    id_sector_nuevo: [null as number | null],
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    forkJoin({
      reclamos: this.api.list(),
      clientes: this.clientesApi.list(),
      sectores: this.sectoresApi.list(),
    }).subscribe({
      next: ({ reclamos, clientes, sectores }) => {
        this.reclamos.set(reclamos);
        this.clientes.set(clientes);
        this.sectores.set(sectores);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el listado' });
      },
    });
    this.api.refreshPendientesCount();
  }

  openCreate(): void {
    this.form.reset();
    this.createDialogVisible.set(true);
  }

  closeCreateDialog(): void {
    this.createDialogVisible.set(false);
  }

  save(): void {
    if (this.form.invalid || this.saving()) {
      return;
    }

    this.saving.set(true);
    const raw = this.form.getRawValue();
    const dto = {
      fecha: raw.fecha!.toISOString().slice(0, 10),
      id_cliente: raw.id_cliente!,
      id_sector: raw.id_sector!,
      id_usuario: 1,
      ...(raw.descripcion ? { descripcion: raw.descripcion } : {}),
    };

    this.api.create(dto).subscribe({
      next: () => {
        this.saving.set(false);
        this.createDialogVisible.set(false);
        this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Reclamo registrado' });
        this.load();
      },
      error: () => {
        this.saving.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar' });
      },
    });
  }

  openResolver(reclamo: Reclamo): void {
    this.activeReclamo.set(reclamo);
    this.resolverForm.reset({ solucion: '' });
    this.resolverDialogVisible.set(true);
  }

  closeResolverDialog(): void {
    this.resolverDialogVisible.set(false);
    this.activeReclamo.set(null);
  }

  resolver(): void {
    const reclamo = this.activeReclamo();
    if (!reclamo || this.resolverForm.invalid || this.saving()) {
      return;
    }

    this.saving.set(true);
    const raw = this.resolverForm.getRawValue();
    this.api.resolver(reclamo.id_reclamo, { solucion: raw.solucion }).subscribe({
      next: () => {
        this.saving.set(false);
        this.resolverDialogVisible.set(false);
        this.activeReclamo.set(null);
        this.messageService.add({ severity: 'success', summary: 'Resuelto', detail: 'Reclamo resuelto' });
        this.load();
      },
      error: () => {
        this.saving.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo resolver el reclamo' });
      },
    });
  }

  openRechazar(reclamo: Reclamo): void {
    this.activeReclamo.set(reclamo);
    this.tipoRechazo.set('no_corresponde');
    this.rechazarForm.reset({ motivo_rechazo: '', id_sector_nuevo: null });
    this.rechazarDialogVisible.set(true);
  }

  closeRechazarDialog(): void {
    this.rechazarDialogVisible.set(false);
    this.activeReclamo.set(null);
  }

  // Cuando el motivo es "mal direccionamiento", el reclamo se reasigna a
  // otro sector y sigue activo (no se rechaza en sí, solo cambia de
  // bandeja). Con "no corresponde" sí se rechaza definitivamente.
  protected rechazarInvalido(): boolean {
    if (this.rechazarForm.invalid) {
      return true;
    }
    return this.tipoRechazo() === 'redireccion' && !this.rechazarForm.getRawValue().id_sector_nuevo;
  }

  rechazar(): void {
    const reclamo = this.activeReclamo();
    if (!reclamo || this.rechazarInvalido() || this.saving()) {
      return;
    }

    this.saving.set(true);
    const raw = this.rechazarForm.getRawValue();
    const tipo = this.tipoRechazo();
    this.api
      .rechazar(reclamo.id_reclamo, {
        motivo_rechazo: raw.motivo_rechazo,
        tipo_rechazo: tipo,
        ...(tipo === 'redireccion' ? { id_sector_nuevo: raw.id_sector_nuevo! } : {}),
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.rechazarDialogVisible.set(false);
          this.activeReclamo.set(null);
          const detail = tipo === 'redireccion' ? 'Reclamo reasignado a otro sector' : 'Reclamo rechazado';
          this.messageService.add({ severity: 'success', summary: 'Listo', detail });
          this.load();
        },
        error: () => {
          this.saving.set(false);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo rechazar el reclamo' });
        },
      });
  }
}
