import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ItemPedidoInsumo } from '../models/item-pedido-insumo.model';

export interface ItemPedidoInsumoDto {
  id_insumo: number;
  cantidad_solicitada: number;
  cantidad_abastecida?: number;
}

@Injectable({ providedIn: 'root' })
export class ItemPedidoInsumoApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  private base(idPedido: number): string {
    return `${this.baseUrl}/pedidos-insumos/${idPedido}/items`;
  }

  list(idPedido: number): Observable<ItemPedidoInsumo[]> {
    return this.http.get<ItemPedidoInsumo[]>(this.base(idPedido));
  }

  create(idPedido: number, dto: ItemPedidoInsumoDto): Observable<ItemPedidoInsumo> {
    return this.http.post<ItemPedidoInsumo>(this.base(idPedido), dto);
  }

  update(idPedido: number, idItem: number, dto: Partial<ItemPedidoInsumoDto>): Observable<ItemPedidoInsumo> {
    return this.http.patch<ItemPedidoInsumo>(`${this.base(idPedido)}/${idItem}`, dto);
  }

  remove(idPedido: number, idItem: number): Observable<void> {
    return this.http.delete<void>(`${this.base(idPedido)}/${idItem}`);
  }
}
