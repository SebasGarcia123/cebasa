import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CrudApi } from './crud-api.service';
import { Compra } from '../models/compra.model';
import { components } from './schema';

type CreateCompraDto = components['schemas']['CreateCompraDto'];

@Injectable({ providedIn: 'root' })
export class ComprasApiService extends CrudApi<Compra, CreateCompraDto> {
  protected override readonly resourcePath = 'compras';

  private base(id: number): string {
    return `${environment.apiUrl}/compras/${id}`;
  }

  // Una OC generada como "Autorizado" queda a la espera de este envío.
  enviarProveedor(id: number): Observable<Compra> {
    return this.http.post<Compra>(`${this.base(id)}/enviar-proveedor`, {});
  }

  // El jefe de logística confirma que la mercadería ingresó.
  recibir(id: number): Observable<Compra> {
    return this.http.post<Compra>(`${this.base(id)}/recibir`, {});
  }

  anular(id: number): Observable<Compra> {
    return this.http.post<Compra>(`${this.base(id)}/anular`, {});
  }
}
