import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ItemPlanProduccion } from '../models/item-plan-produccion.model';

export interface CreateItemPlanProduccionDto {
  fecha: string;
  id_lineas: number;
  id_producto: number;
  id_turno: number;
  cantidad: number;
}

export type UpdateItemPlanProduccionDto = Partial<Omit<CreateItemPlanProduccionDto, 'fecha'>>;

@Injectable({ providedIn: 'root' })
export class ItemPlanProduccionApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/planes-produccion/items`;

  create(dto: CreateItemPlanProduccionDto): Observable<ItemPlanProduccion> {
    return this.http.post<ItemPlanProduccion>(this.baseUrl, dto);
  }

  update(idItem: number, dto: UpdateItemPlanProduccionDto): Observable<ItemPlanProduccion> {
    return this.http.patch<ItemPlanProduccion>(`${this.baseUrl}/${idItem}`, dto);
  }

  remove(idItem: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${idItem}`);
  }
}
