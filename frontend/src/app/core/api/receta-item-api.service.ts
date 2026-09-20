import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RecetaItem } from '../models/receta-item.model';

export interface RecetaItemDto {
  id_insumo: number;
  cantidad_utilizada: number;
}

@Injectable({ providedIn: 'root' })
export class RecetaItemApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  private base(idReceta: number): string {
    return `${this.baseUrl}/recetas/${idReceta}/items`;
  }

  list(idReceta: number): Observable<RecetaItem[]> {
    return this.http.get<RecetaItem[]>(this.base(idReceta));
  }

  create(idReceta: number, dto: RecetaItemDto): Observable<RecetaItem> {
    return this.http.post<RecetaItem>(this.base(idReceta), dto);
  }

  update(idReceta: number, idItem: number, dto: Partial<RecetaItemDto>): Observable<RecetaItem> {
    return this.http.patch<RecetaItem>(`${this.base(idReceta)}/${idItem}`, dto);
  }

  remove(idReceta: number, idItem: number): Observable<void> {
    return this.http.delete<void>(`${this.base(idReceta)}/${idItem}`);
  }
}
