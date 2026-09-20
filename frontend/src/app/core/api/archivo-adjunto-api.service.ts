import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ArchivoAdjunto } from '../models/archivo-adjunto.model';

@Injectable({ providedIn: 'root' })
export class ArchivoAdjuntoApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/archivos-adjuntos`;

  upload(file: File): Observable<ArchivoAdjunto> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ArchivoAdjunto>(`${this.baseUrl}/upload`, formData);
  }

  getOne(id: number): Observable<ArchivoAdjunto> {
    return this.http.get<ArchivoAdjunto>(`${this.baseUrl}/${id}`);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  fileUrl(id: number): string {
    return `${this.baseUrl}/${id}/file`;
  }
}
