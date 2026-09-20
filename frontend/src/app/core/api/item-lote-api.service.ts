import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ItemLote } from '../models/item-lote.model';

export interface ItemLoteDto {
  descripcion_item: string;
  id_unidad_medida: number;
  cantidad_item_lote: number;
}

@Injectable({ providedIn: 'root' })
export class ItemLoteApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  private base(idLote: number): string {
    return `${this.baseUrl}/lotes/${idLote}/items`;
  }

  list(idLote: number): Observable<ItemLote[]> {
    return this.http.get<ItemLote[]>(this.base(idLote));
  }

  create(idLote: number, dto: ItemLoteDto): Observable<ItemLote> {
    return this.http.post<ItemLote>(this.base(idLote), dto);
  }

  update(idLote: number, idItem: number, dto: Partial<ItemLoteDto>): Observable<ItemLote> {
    return this.http.patch<ItemLote>(`${this.base(idLote)}/${idItem}`, dto);
  }

  remove(idLote: number, idItem: number): Observable<void> {
    return this.http.delete<void>(`${this.base(idLote)}/${idItem}`);
  }
}
