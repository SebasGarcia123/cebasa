import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { CheckboxChangeEvent } from 'primeng/checkbox';

export interface AssignableItem {
  id: number;
  label: string;
}

/**
 * Dialog generico para relaciones N:M (usuario<->roles, rol<->permisos, etc.):
 * muestra una lista con checkbox por item, y avisa al padre cual se tildo/destildo
 * para que el padre haga el POST/DELETE real y actualice assignedIds.
 */
@Component({
  selector: 'app-assignment-dialog',
  imports: [FormsModule, DialogModule, CheckboxModule],
  templateUrl: './assignment-dialog.html',
  styleUrl: './assignment-dialog.scss',
})
export class AssignmentDialog {
  visible = input.required<boolean>();
  header = input<string>('Asignar');
  items = input.required<AssignableItem[]>();
  assignedIds = input.required<Set<number>>();
  busyIds = input<Set<number>>(new Set());

  visibleChange = output<boolean>();
  toggle = output<{ id: number; checked: boolean }>();

  onToggle(id: number, event: CheckboxChangeEvent): void {
    this.toggle.emit({ id, checked: !!event.checked });
  }
}
