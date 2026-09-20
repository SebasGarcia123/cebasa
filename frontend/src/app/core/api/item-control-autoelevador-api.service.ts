import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ItemControlAutoelevador } from '../models/item-control-autoelevador.model';

export interface ItemControlAutoelevadorDto {
  item_nombre: string;
  estado_ok: boolean;
  observacion?: string;
}

@Injectable({ providedIn: 'root' })
export class ItemControlAutoelevadorApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  private base(idControl: number): string {
    return `${this.baseUrl}/controles-autoelevador/${idControl}/items`;
  }

  list(idControl: number): Observable<ItemControlAutoelevador[]> {
    return this.http.get<ItemControlAutoelevador[]>(this.base(idControl));
  }

  create(idControl: number, dto: ItemControlAutoelevadorDto): Observable<ItemControlAutoelevador> {
    return this.http.post<ItemControlAutoelevador>(this.base(idControl), dto);
  }

  update(
    idControl: number,
    idItem: number,
    dto: Partial<ItemControlAutoelevadorDto>,
  ): Observable<ItemControlAutoelevador> {
    return this.http.patch<ItemControlAutoelevador>(`${this.base(idControl)}/${idItem}`, dto);
  }

  remove(idControl: number, idItem: number): Observable<void> {
    return this.http.delete<void>(`${this.base(idControl)}/${idItem}`);
  }
}
