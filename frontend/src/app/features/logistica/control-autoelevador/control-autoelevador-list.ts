import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ControlAutoelevadorApiService } from '../../../core/api/control-autoelevador-api.service';
import { ItemControlAutoelevadorApiService } from '../../../core/api/item-control-autoelevador-api.service';
import { AutoelevadoresApiService } from '../../../core/api/autoelevadores-api.service';
import { ControlAutoelevador } from '../../../core/models/control-autoelevador.model';
import { ItemControlAutoelevador } from '../../../core/models/item-control-autoelevador.model';
import { Autoelevador } from '../../../core/models/autoelevador.model';

@Component({
  selector: 'app-control-autoelevador-list',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    DatePickerModule,
    CheckboxModule,
    TooltipModule,
  ],
  templateUrl: './control-autoelevador-list.html',
  styleUrl: './control-autoelevador-list.scss',
})
export class ControlAutoelevadorList implements OnInit {
  private readonly api = inject(ControlAutoelevadorApiService);
  private readonly itemsApi = inject(ItemControlAutoelevadorApiService);
  private readonly autoelevadoresApi = inject(AutoelevadoresApiService);
  private readonly fb = inject(FormBuilder);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  protected readonly controles = signal<ControlAutoelevador[]>([]);
  protected readonly autoelevadores = signal<Autoelevador[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly dialogVisible = signal(false);
  protected readonly editingId = signal<number | null>(null);

  // id_usuario: quien hace el control. Por ahora se fija a 1 (usuario de
  // prueba), igual que en el resto de la app.
  protected readonly form = this.fb.nonNullable.group({
    fecha: [null as Date | null, Validators.required],
    id_autoelevador: [null as number | null, Validators.required],
  });

  protected readonly itemsDialogVisible = signal(false);
  protected readonly itemsLoading = signal(false);
  protected readonly itemsSaving = signal(false);
  protected readonly items = signal<ItemControlAutoelevador[]>([]);
  protected readonly editingItemId = signal<number | null>(null);
  private controlActivo: ControlAutoelevador | null = null;

  protected readonly itemForm = this.fb.nonNullable.group({
    item_nombre: ['', Validators.required],
    estado_ok: [true],
    observacion: [''],
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    forkJoin({
      controles: this.api.list(),
      autoelevadores: this.autoelevadoresApi.list(),
    }).subscribe({
      next: ({ controles, autoelevadores }) => {
        this.controles.set(controles);
        this.autoelevadores.set(autoelevadores);
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

  openEdit(control: ControlAutoelevador): void {
    this.editingId.set(control.id_control_autoelevador);
    this.form.setValue({ fecha: new Date(control.fecha), id_autoelevador: control.id_autoelevador });
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
      fecha: raw.fecha!.toISOString().slice(0, 10),
      id_autoelevador: raw.id_autoelevador!,
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

  confirmDelete(control: ControlAutoelevador): void {
    this.confirmationService.confirm({
      header: 'Confirmar eliminación',
      message: `¿Eliminar el control #${control.id_control_autoelevador}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { severity: 'danger', label: 'Eliminar' },
      rejectButtonProps: { severity: 'secondary', label: 'Cancelar', outlined: true },
      accept: () => this.remove(control.id_control_autoelevador),
    });
  }

  private remove(id: number): void {
    this.api.remove(id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Control eliminado' });
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

  openItems(control: ControlAutoelevador): void {
    this.controlActivo = control;
    this.editingItemId.set(null);
    this.itemForm.reset({ item_nombre: '', estado_ok: true, observacion: '' });
    this.itemsDialogVisible.set(true);
    this.loadItems();
  }

  private loadItems(): void {
    if (!this.controlActivo) {
      return;
    }
    this.itemsLoading.set(true);
    this.itemsApi.list(this.controlActivo.id_control_autoelevador).subscribe({
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

  editItem(item: ItemControlAutoelevador): void {
    this.editingItemId.set(item.id_item_control);
    this.itemForm.setValue({
      item_nombre: item.item_nombre,
      estado_ok: item.estado_ok,
      observacion: item.observacion ?? '',
    });
  }

  cancelItemEdit(): void {
    this.editingItemId.set(null);
    this.itemForm.reset({ item_nombre: '', estado_ok: true, observacion: '' });
  }

  saveItem(): void {
    if (this.itemForm.invalid || this.itemsSaving() || !this.controlActivo) {
      return;
    }

    this.itemsSaving.set(true);
    const raw = this.itemForm.getRawValue();
    const dto = {
      item_nombre: raw.item_nombre,
      estado_ok: raw.estado_ok,
      ...(raw.observacion ? { observacion: raw.observacion } : {}),
    };
    const idItem = this.editingItemId();
    const request$ = idItem
      ? this.itemsApi.update(this.controlActivo.id_control_autoelevador, idItem, dto)
      : this.itemsApi.create(this.controlActivo.id_control_autoelevador, dto);

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

  removeItem(item: ItemControlAutoelevador): void {
    if (!this.controlActivo) {
      return;
    }
    this.itemsApi.remove(this.controlActivo.id_control_autoelevador, item.id_item_control).subscribe({
      next: () => this.loadItems(),
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el ítem' });
      },
    });
  }
}
