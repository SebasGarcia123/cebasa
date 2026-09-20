import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ItemProd } from '../models/item-prod.model';

export interface ItemProdDto {
  id_producto: number;
  cantidad: number;
  id_lineas: number;
}

@Injectable({ providedIn: 'root' })
export class ItemProdApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  private base(idLote: number): string {
    return `${this.baseUrl}/lotes-prod/${idLote}/items`;
  }

  list(idLote: number): Observable<ItemProd[]> {
    return this.http.get<ItemProd[]>(this.base(idLote));
  }

  create(idLote: number, dto: ItemProdDto): Observable<ItemProd> {
    return this.http.post<ItemProd>(this.base(idLote), dto);
  }

  update(idLote: number, idItem: number, dto: Partial<ItemProdDto>): Observable<ItemProd> {
    return this.http.patch<ItemProd>(`${this.base(idLote)}/${idItem}`, dto);
  }

  remove(idLote: number, idItem: number): Observable<void> {
    return this.http.delete<void>(`${this.base(idLote)}/${idItem}`);
  }
}
