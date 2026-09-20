import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ConfirmationService, MessageService } from 'primeng/api';
import { InsumosApiService } from '../../../core/api/insumos-api.service';
import { UnidadMedidaApiService } from '../../../core/api/unidad-medida-api.service';
import { EstadosApiService } from '../../../core/api/estados-api.service';
import { Insumo } from '../../../core/models/insumo.model';
import { UnidadMedida } from '../../../core/models/unidad-medida.model';
import { Estado } from '../../../core/models/estado.model';

@Component({
  selector: 'app-insumos-list',
  imports: [
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
  ],
  templateUrl: './insumos-list.html',
  styleUrl: './insumos-list.scss',
})
export class InsumosList implements OnInit {
  private readonly api = inject(InsumosApiService);
  private readonly unidadMedidaApi = inject(UnidadMedidaApiService);
  private readonly estadosApi = inject(EstadosApiService);
  private readonly fb = inject(FormBuilder);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  protected readonly insumos = signal<Insumo[]>([]);
  protected readonly unidadesMedida = signal<UnidadMedida[]>([]);
  protected readonly estados = signal<Estado[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly dialogVisible = signal(false);
  protected readonly editingId = signal<number | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    codigo_insumo: ['', Validators.required],
    nombre_insumo: ['', Validators.required],
    id_unidad_medida: [null as number | null, Validators.required],
    stock_minimo: [0 as number | null],
    stock_actual: [0 as number | null],
    id_estado: [null as number | null, Validators.required],
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    forkJoin({
      insumos: this.api.list(),
      unidadesMedida: this.unidadMedidaApi.list(),
      estados: this.estadosApi.list(),
    }).subscribe({
      next: ({ insumos, unidadesMedida, estados }) => {
        this.insumos.set(insumos);
        this.unidadesMedida.set(unidadesMedida);
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
    this.form.reset({ stock_minimo: 0, stock_actual: 0 });
    this.dialogVisible.set(true);
  }

  openEdit(insumo: Insumo): void {
    this.editingId.set(insumo.id_insumo);
    this.form.setValue({
      codigo_insumo: insumo.codigo_insumo,
      nombre_insumo: insumo.nombre_insumo,
      id_unidad_medida: insumo.id_unidad_medida,
      stock_minimo: insumo.stock_minimo,
      stock_actual: insumo.stock_actual,
      id_estado: insumo.id_estado,
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
      codigo_insumo: raw.codigo_insumo,
      nombre_insumo: raw.nombre_insumo,
      id_unidad_medida: raw.id_unidad_medida!,
      id_estado: raw.id_estado!,
      stock_minimo: raw.stock_minimo ?? 0,
      stock_actual: raw.stock_actual ?? 0,
    };
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

  confirmDelete(insumo: Insumo): void {
    this.confirmationService.confirm({
      header: 'Confirmar eliminación',
      message: `¿Eliminar el insumo "${insumo.nombre_insumo}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { severity: 'danger', label: 'Eliminar' },
      rejectButtonProps: { severity: 'secondary', label: 'Cancelar', outlined: true },
      accept: () => this.remove(insumo.id_insumo),
    });
  }

  private remove(id: number): void {
    this.api.remove(id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Insumo eliminado' });
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
