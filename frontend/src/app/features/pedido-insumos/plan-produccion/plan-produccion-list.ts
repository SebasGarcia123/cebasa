import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PlanProduccionApiService } from '../../../core/api/plan-produccion-api.service';
import { ItemPlanProduccionApiService } from '../../../core/api/item-plan-produccion-api.service';
import { LineasApiService } from '../../../core/api/lineas-api.service';
import { ProductosApiService } from '../../../core/api/productos-api.service';
import { TurnosApiService } from '../../../core/api/turnos-api.service';
import { EstadosApiService } from '../../../core/api/estados-api.service';
import { PlanProduccion } from '../../../core/models/plan-produccion.model';
import { ItemPlanProduccion } from '../../../core/models/item-plan-produccion.model';
import { Linea } from '../../../core/models/linea.model';
import { Producto } from '../../../core/models/producto.model';
import { Turno } from '../../../core/models/turno.model';
import { Estado } from '../../../core/models/estado.model';

@Component({
  selector: 'app-plan-produccion-list',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    SelectModule,
    DatePickerModule,
    InputNumberModule,
    TooltipModule,
  ],
  templateUrl: './plan-produccion-list.html',
  styleUrl: './plan-produccion-list.scss',
})
export class PlanProduccionList implements OnInit {
  private readonly api = inject(PlanProduccionApiService);
  private readonly itemsApi = inject(ItemPlanProduccionApiService);
  private readonly lineasApi = inject(LineasApiService);
  private readonly productosApi = inject(ProductosApiService);
  private readonly turnosApi = inject(TurnosApiService);
  private readonly estadosApi = inject(EstadosApiService);
  private readonly fb = inject(FormBuilder);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  protected readonly planes = signal<PlanProduccion[]>([]);
  protected readonly lineas = signal<Linea[]>([]);
  protected readonly productos = signal<Producto[]>([]);
  protected readonly turnos = signal<Turno[]>([]);
  protected readonly estados = signal<Estado[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly dialogVisible = signal(false);
  protected readonly editingId = signal<number | null>(null);

  // id_usuario: quien arma el plan. Por ahora se fija a 1 (usuario de
  // prueba), igual que en el resto de la app.
  protected readonly form = this.fb.nonNullable.group({
    fecha_inicio_semana: [null as Date | null, Validators.required],
    id_estado: [null as number | null, Validators.required],
  });

  protected readonly itemsDialogVisible = signal(false);
  protected readonly itemsLoading = signal(false);
  protected readonly itemsSaving = signal(false);
  protected readonly items = signal<ItemPlanProduccion[]>([]);
  protected readonly editingItemId = signal<number | null>(null);
  private planActivo: PlanProduccion | null = null;

  protected readonly itemForm = this.fb.nonNullable.group({
    id_lineas: [null as number | null, Validators.required],
    id_producto: [null as number | null, Validators.required],
    id_turno: [null as number | null, Validators.required],
    fecha: [null as Date | null, Validators.required],
    cantidad: [null as number | null, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    forkJoin({
      planes: this.api.list(),
      lineas: this.lineasApi.list(),
      productos: this.productosApi.list(),
      turnos: this.turnosApi.list(),
      estados: this.estadosApi.list(),
    }).subscribe({
      next: ({ planes, lineas, productos, turnos, estados }) => {
        this.planes.set(planes);
        this.lineas.set(lineas);
        this.productos.set(productos);
        this.turnos.set(turnos);
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

  openEdit(plan: PlanProduccion): void {
    this.editingId.set(plan.id_plan_produccion);
    this.form.setValue({
      fecha_inicio_semana: new Date(plan.fecha_inicio_semana),
      id_estado: plan.id_estado,
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
      fecha_inicio_semana: raw.fecha_inicio_semana!.toISOString().slice(0, 10),
      id_estado: raw.id_estado!,
      id_usuario: 1,
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

  confirmDelete(plan: PlanProduccion): void {
    this.confirmationService.confirm({
      header: 'Confirmar eliminación',
      message: `¿Eliminar el plan #${plan.id_plan_produccion}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { severity: 'danger', label: 'Eliminar' },
      rejectButtonProps: { severity: 'secondary', label: 'Cancelar', outlined: true },
      accept: () => this.remove(plan.id_plan_produccion),
    });
  }

  private remove(id: number): void {
    this.api.remove(id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Plan eliminado' });
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

  openItems(plan: PlanProduccion): void {
    this.planActivo = plan;
    this.editingItemId.set(null);
    this.itemForm.reset();
    this.itemsDialogVisible.set(true);
    this.loadItems();
  }

  private loadItems(): void {
    if (!this.planActivo) {
      return;
    }
    this.itemsLoading.set(true);
    this.itemsApi.list(this.planActivo.id_plan_produccion).subscribe({
      next: (data) => {
        this.items.set(data);
        this.itemsLoading.set(false);
      },
      error: () => {
        this.itemsLoading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los ítems' });
      },
    });
  }

  editItem(item: ItemPlanProduccion): void {
    this.editingItemId.set(item.id_item_plan_produccion);
    this.itemForm.setValue({
      id_lineas: item.id_lineas,
      id_producto: item.id_producto,
      id_turno: item.id_turno,
      fecha: new Date(item.fecha),
      cantidad: item.cantidad,
    });
  }

  cancelItemEdit(): void {
    this.editingItemId.set(null);
    this.itemForm.reset();
  }

  saveItem(): void {
    if (this.itemForm.invalid || this.itemsSaving() || !this.planActivo) {
      return;
    }

    this.itemsSaving.set(true);
    const raw = this.itemForm.getRawValue();
    const dto = {
      id_lineas: raw.id_lineas!,
      id_producto: raw.id_producto!,
      id_turno: raw.id_turno!,
      fecha: raw.fecha!.toISOString().slice(0, 10),
      cantidad: raw.cantidad!,
    };
    const idItem = this.editingItemId();
    const request$ = idItem
      ? this.itemsApi.update(this.planActivo.id_plan_produccion, idItem, dto)
      : this.itemsApi.create(this.planActivo.id_plan_produccion, dto);

    request$.subscribe({
      next: () => {
        this.itemsSaving.set(false);
        this.cancelItemEdit();
        this.loadItems();
      },
      error: () => {
        this.itemsSaving.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el ítem' });
      },
    });
  }

  removeItem(item: ItemPlanProduccion): void {
    if (!this.planActivo) {
      return;
    }
    this.itemsApi.remove(this.planActivo.id_plan_produccion, item.id_item_plan_produccion).subscribe({
      next: () => this.loadItems(),
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el ítem' });
      },
    });
  }
}
