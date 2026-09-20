import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ItemPedido } from '../models/item-pedido.model';

export interface ItemPedidoDto {
  id_producto: number;
  cantidad_bolsones: number;
}

@Injectable({ providedIn: 'root' })
export class ItemPedidoApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  private base(idPedido: number): string {
    return `${this.baseUrl}/pedidos/${idPedido}/items`;
  }

  list(idPedido: number): Observable<ItemPedido[]> {
    return this.http.get<ItemPedido[]>(this.base(idPedido));
  }

  create(idPedido: number, dto: ItemPedidoDto): Observable<ItemPedido> {
    return this.http.post<ItemPedido>(this.base(idPedido), dto);
  }

  update(idPedido: number, idItem: number, dto: Partial<ItemPedidoDto>): Observable<ItemPedido> {
    return this.http.patch<ItemPedido>(`${this.base(idPedido)}/${idItem}`, dto);
  }

  remove(idPedido: number, idItem: number): Observable<void> {
    return this.http.delete<void>(`${this.base(idPedido)}/${idItem}`);
  }
}
