import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Base para los servicios de API de cada entidad. Cada entidad extiende
 * esta clase con 3 líneas (ver estados-api.service.ts como ejemplo) en
 * vez de reescribir list/get/create/update/remove 54 veces.
 */
export abstract class CrudApi<T, CreateDto = Partial<T>, UpdateDto = Partial<CreateDto>> {
  protected readonly http = inject(HttpClient);
  protected abstract readonly resourcePath: string;

  private get baseUrl(): string {
    return `${environment.apiUrl}/${this.resourcePath}`;
  }

  list(): Observable<T[]> {
    return this.http.get<T[]>(this.baseUrl);
  }

  getOne(id: number | string): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}/${id}`);
  }

  create(dto: CreateDto): Observable<T> {
    return this.http.post<T>(this.baseUrl, dto);
  }

  update(id: number | string, dto: UpdateDto): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}/${id}`, dto);
  }

  remove(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
