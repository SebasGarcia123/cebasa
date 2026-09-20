import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ItemPlanProduccion } from '../models/item-plan-produccion.model';

export interface ItemPlanProduccionDto {
  id_lineas: number;
  id_producto: number;
  id_turno: number;
  fecha: string;
  cantidad: number;
}

@Injectable({ providedIn: 'root' })
export class ItemPlanProduccionApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  private base(idPlan: number): string {
    return `${this.baseUrl}/planes-produccion/${idPlan}/items`;
  }

  list(idPlan: number): Observable<ItemPlanProduccion[]> {
    return this.http.get<ItemPlanProduccion[]>(this.base(idPlan));
  }

  create(idPlan: number, dto: ItemPlanProduccionDto): Observable<ItemPlanProduccion> {
    return this.http.post<ItemPlanProduccion>(this.base(idPlan), dto);
  }

  update(idPlan: number, idItem: number, dto: Partial<ItemPlanProduccionDto>): Observable<ItemPlanProduccion> {
    return this.http.patch<ItemPlanProduccion>(`${this.base(idPlan)}/${idItem}`, dto);
  }

  remove(idPlan: number, idItem: number): Observable<void> {
    return this.http.delete<void>(`${this.base(idPlan)}/${idItem}`);
  }
}
