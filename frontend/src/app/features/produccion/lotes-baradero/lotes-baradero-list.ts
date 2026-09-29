import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { LoteProdApiService } from '../../../core/api/lote-prod-api.service';
import { BobinaApiService } from '../../../core/api/bobina-api.service';
import { TurnosApiService } from '../../../core/api/turnos-api.service';
import { DepositosApiService } from '../../../core/api/depositos-api.service';
import { LoteProd } from '../../../core/models/lote-prod.model';
import { Bobina } from '../../../core/models/bobina.model';
import { Turno } from '../../../core/models/turno.model';
import { Deposito } from '../../../core/models/deposito.model';

const ESTADO_ABIERTO = 'Pendiente';
const ESTADO_RECHAZADO = 'Rechazado';
// El backend deriva el depósito del sector del usuario y lo prioriza
// siempre que pueda resolverlo (ver LoteProdService.resolverDepositoDeCreacion),
// así que esto no es una elección real — es solo el valor de respaldo
// para administradores, cuyo sector no tiene planta asociada y que si
// no, se quedan sin poder crear ningún lote.
const PLANTA_RESPALDO = 'BARADERO';
const ROL_DEPOSITO_RESPALDO = 'LOGISTICA';

// Esta pantalla es del Jefe de Producción: abre/cierra el turno y ve
// (solo lectura) las bobinas que va cargando el operario desde su
// propia pantalla (ver OperarioBaraderoList). Generar bobinas no vive
// acá para no tener dos lugares donde hacer lo mismo.
@Component({
  selector: 'app-lotes-baradero-list',
  imports: [
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    SelectModule,
    DatePickerModule,
    TooltipModule,
  ],
  templateUrl: './lotes-baradero-list.html',
  styleUrl: './lotes-baradero-list.scss',
})
export class LotesBaraderoList implements OnInit {
  private readonly api = inject(LoteProdApiService);
  private readonly bobinasApi = inject(BobinaApiService);
  private readonly turnosApi = inject(TurnosApiService);
  private readonly depositosApi = inject(DepositosApiService);
  private readonly fb = inject(FormBuilder);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  protected readonly lotesTodos = signal<LoteProd[]>([]);
  protected readonly lotes = computed(() =>
    this.lotesTodos().filter((l) => l.deposito?.planta === 'BARADERO'),
  );
  protected readonly turnos = signal<Turno[]>([]);
  protected readonly depositos = signal<Deposito[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly dialogVisible = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    id_turno: [null as number | null, Validators.required],
    fecha_lote_prod: [null as Date | null, Validators.required],
  });

  protected readonly detalleDialogVisible = signal(false);
  protected readonly bobinas = signal<Bobina[]>([]);
  protected readonly bobinasLoading = signal(false);
  protected readonly loteActivo = signal<LoteProd | null>(null);

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    forkJoin({
      lotes: this.api.list(),
      turnos: this.turnosApi.list(),
      depositos: this.depositosApi.list(),
    }).subscribe({
      next: ({ lotes, turnos, depositos }) => {
        this.lotesTodos.set(lotes);
        this.turnos.set(turnos);
        this.depositos.set(depositos);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el listado' });
      },
    });
  }

  protected puedeCerrar(lote: LoteProd): boolean {
    return lote.estados?.nombreEstado === ESTADO_ABIERTO || lote.estados?.nombreEstado === ESTADO_RECHAZADO;
  }

  protected puedeEliminar(lote: LoteProd): boolean {
    return lote.estados?.nombreEstado === ESTADO_ABIERTO || lote.estados?.nombreEstado === ESTADO_RECHAZADO;
  }

  openCreate(): void {
    this.form.reset();
    this.dialogVisible.set(true);
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
  }

  guardar(): void {
    if (this.form.invalid || this.saving()) {
      return;
    }

    this.saving.set(true);
    const raw = this.form.getRawValue();
    const idDepositoRespaldo = this.depositos().find(
      (d) => d.planta === PLANTA_RESPALDO && d.rol_deposito === ROL_DEPOSITO_RESPALDO,
    )?.id_deposito;
    const dto = {
      id_turno: raw.id_turno!,
      fecha_lote_prod: raw.fecha_lote_prod!.toISOString().slice(0, 10),
      id_deposito: idDepositoRespaldo,
    };

    this.api.create(dto).subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogVisible.set(false);
        this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Lote creado' });
        this.load();
      },
      error: () => {
        this.saving.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el lote' });
      },
    });
  }

  confirmCerrar(lote: LoteProd): void {
    this.confirmationService.confirm({
      header: 'Confirmar cierre',
      message: `¿Cerrar el lote #${lote.id_lote}? Una vez cerrado no se puede editar hasta que Logística Baradero lo revise.`,
      icon: 'pi pi-lock',
      acceptButtonProps: { label: 'Cerrar' },
      rejectButtonProps: { severity: 'secondary', label: 'Cancelar', outlined: true },
      accept: () => {
        this.api.cerrar(lote.id_lote).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Cerrado', detail: 'El lote fue enviado a Logística' });
            this.load();
          },
          error: (error: HttpErrorResponse) => {
            const detail = typeof error.error?.message === 'string' ? error.error.message : 'No se pudo cerrar el lote';
            this.messageService.add({ severity: 'error', summary: 'Error', detail });
          },
        });
      },
    });
  }

  confirmDelete(lote: LoteProd): void {
    this.confirmationService.confirm({
      header: 'Confirmar eliminación',
      message: `¿Eliminar el lote #${lote.id_lote}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { severity: 'danger', label: 'Eliminar' },
      rejectButtonProps: { severity: 'secondary', label: 'Cancelar', outlined: true },
      accept: () => {
        this.api.remove(lote.id_lote).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Lote eliminado' });
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
      },
    });
  }

  openDetalle(lote: LoteProd): void {
    this.loteActivo.set(lote);
    this.detalleDialogVisible.set(true);
    this.loadBobinas();
  }

  private loadBobinas(): void {
    const lote = this.loteActivo();
    if (!lote) {
      return;
    }
    this.bobinasLoading.set(true);
    this.bobinasApi.list(lote.id_lote).subscribe({
      next: (data) => {
        this.bobinas.set(data);
        this.bobinasLoading.set(false);
      },
      error: () => {
        this.bobinasLoading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las bobinas' });
      },
    });
  }

  verRotulo(bobina: Bobina): void {
    const lote = this.loteActivo();
    if (!lote) {
      return;
    }
    this.bobinasApi.rotulo(lote.id_lote, bobina.id_bobina).subscribe({
      next: (pdf) => window.open(URL.createObjectURL(pdf), '_blank'),
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo abrir el rótulo' });
      },
    });
  }
}
