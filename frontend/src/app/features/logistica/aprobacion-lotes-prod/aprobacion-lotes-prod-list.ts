import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { LoteProdApiService } from '../../../core/api/lote-prod-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { LoteProd } from '../../../core/models/lote-prod.model';

const ESTADO_PENDIENTE = 'Pendiente de aprobación';

@Component({
  selector: 'app-aprobacion-lotes-prod-list',
  imports: [
    DatePipe,
    DecimalPipe,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    TextareaModule,
    TooltipModule,
  ],
  templateUrl: './aprobacion-lotes-prod-list.html',
  styleUrl: './aprobacion-lotes-prod-list.scss',
})
export class AprobacionLotesProdList implements OnInit {
  private readonly api = inject(LoteProdApiService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  protected readonly lotes = signal<LoteProd[]>([]);
  protected readonly loading = signal(false);

  protected readonly pendientes = computed(() =>
    this.lotes().filter((l) => l.estados?.nombreEstado === ESTADO_PENDIENTE),
  );

  // Aprobar/rechazar es exclusivo de Logística: se oculta client-side si
  // el usuario no tiene el permiso, la barrera real está en el backend.
  protected readonly puedeAprobar = computed(() => {
    const user = this.authService.currentUser();
    return !!user && (user.es_administrador || user.permisos.includes('produccion.lotes_aprobar'));
  });

  protected readonly verDialogVisible = signal(false);
  protected readonly loteActivo = signal<LoteProd | null>(null);
  protected readonly procesando = signal(false);
  protected readonly rechazando = signal(false);

  protected readonly rechazoForm = this.fb.nonNullable.group({
    motivo_rechazo: ['', [Validators.required, Validators.maxLength(255)]],
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.api.list().subscribe({
      next: (lotes) => {
        this.lotes.set(lotes);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el listado' });
      },
    });
  }

  protected totalPallets(lote: LoteProd): number {
    return (lote.item_prod ?? []).reduce((acc, item) => {
      const bpp = item.productos?.bolsones_por_pallet;
      return acc + (bpp ? Math.round((item.cantidad / bpp) * 100) / 100 : 0);
    }, 0);
  }

  ver(lote: LoteProd): void {
    this.rechazando.set(false);
    this.rechazoForm.reset();
    this.loteActivo.set(null);
    this.verDialogVisible.set(true);
    this.api.getOne(lote.id_lote).subscribe({
      next: (completo) => this.loteActivo.set(completo),
      error: () => {
        this.verDialogVisible.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el lote' });
      },
    });
  }

  cerrarVer(): void {
    this.verDialogVisible.set(false);
  }

  confirmarAprobar(): void {
    const lote = this.loteActivo();
    if (!lote) {
      return;
    }
    this.confirmationService.confirm({
      header: 'Confirmar aprobación',
      message: `¿Aprobar el lote #${lote.id_lote}? Las cantidades se sumarán al stock de cada producto.`,
      icon: 'pi pi-check-circle',
      acceptButtonProps: { label: 'Aprobar' },
      rejectButtonProps: { severity: 'secondary', label: 'Cancelar', outlined: true },
      accept: () => this.aprobar(lote.id_lote),
    });
  }

  private aprobar(id: number): void {
    this.procesando.set(true);
    this.api.aprobar(id).subscribe({
      next: () => {
        this.procesando.set(false);
        this.verDialogVisible.set(false);
        this.messageService.add({ severity: 'success', summary: 'Aprobado', detail: 'El lote fue aprobado y el stock se actualizó' });
        this.load();
      },
      error: (error: HttpErrorResponse) => {
        this.procesando.set(false);
        const detail = typeof error.error?.message === 'string' ? error.error.message : 'No se pudo aprobar el lote';
        this.messageService.add({ severity: 'error', summary: 'Error', detail });
      },
    });
  }

  abrirRechazo(): void {
    this.rechazando.set(true);
    this.rechazoForm.reset();
  }

  cancelarRechazo(): void {
    this.rechazando.set(false);
  }

  confirmarRechazar(): void {
    const lote = this.loteActivo();
    if (!lote || this.rechazoForm.invalid || this.procesando()) {
      return;
    }
    this.procesando.set(true);
    const motivo = this.rechazoForm.getRawValue().motivo_rechazo;
    this.api.rechazar(lote.id_lote, { motivo_rechazo: motivo }).subscribe({
      next: () => {
        this.procesando.set(false);
        this.verDialogVisible.set(false);
        this.messageService.add({ severity: 'success', summary: 'Rechazado', detail: 'El lote vuelve a Producción para su corrección' });
        this.load();
      },
      error: (error: HttpErrorResponse) => {
        this.procesando.set(false);
        const detail = typeof error.error?.message === 'string' ? error.error.message : 'No se pudo rechazar el lote';
        this.messageService.add({ severity: 'error', summary: 'Error', detail });
      },
    });
  }
}
