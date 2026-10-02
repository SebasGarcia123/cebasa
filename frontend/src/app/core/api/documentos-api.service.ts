import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Pedido } from '../models/pedido.model';
import { Factura } from '../models/factura.model';
import { components } from './schema';

export type CreateFacturaDto = components['schemas']['CreateFacturaDto'];
export type CreateReciboDto = components['schemas']['CreateReciboDto'];
export type CreateNotaDto = components['schemas']['CreateNotaDto'];

// Los cuatro documentos comerciales (Factura, Recibo, Nota de Crédito,
// Nota de Débito): cada POST devuelve directamente el PDF generado
// (se abre en una pestaña nueva, mismo criterio que el remito de
// pedidos), y las notas comparten el mismo DTO/endpoint shape salvo
// la ruta, que decide el signo del impacto en la cuenta corriente.
@Injectable({ providedIn: 'root' })
export class DocumentosApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  private base(idCliente: number): string {
    return `${this.baseUrl}/clientes/${idCliente}/documentos`;
  }

  // Facturas emitidas: opciones del desplegable cuando se emite una
  // nota de crédito o débito, que siempre corrigen una factura.
  facturas(idCliente: number): Observable<Factura[]> {
    return this.http.get<Factura[]>(`${this.base(idCliente)}/facturas`);
  }

  pedidosFacturables(idCliente: number): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(`${this.base(idCliente)}/facturables`);
  }

  generarFactura(idCliente: number, dto: CreateFacturaDto): Observable<Blob> {
    return this.http.post(`${this.base(idCliente)}/factura`, dto, { responseType: 'blob' });
  }

  generarRecibo(idCliente: number, dto: CreateReciboDto): Observable<Blob> {
    return this.http.post(`${this.base(idCliente)}/recibo`, dto, { responseType: 'blob' });
  }

  generarNotaCredito(idCliente: number, dto: CreateNotaDto): Observable<Blob> {
    return this.http.post(`${this.base(idCliente)}/nota-credito`, dto, { responseType: 'blob' });
  }

  generarNotaDebito(idCliente: number, dto: CreateNotaDto): Observable<Blob> {
    return this.http.post(`${this.base(idCliente)}/nota-debito`, dto, { responseType: 'blob' });
  }

  pdfFactura(idCliente: number, id: number): Observable<Blob> {
    return this.http.get(`${this.base(idCliente)}/factura/${id}/pdf`, { responseType: 'blob' });
  }

  pdfRecibo(idCliente: number, id: number): Observable<Blob> {
    return this.http.get(`${this.base(idCliente)}/recibo/${id}/pdf`, { responseType: 'blob' });
  }

  pdfNotaCredito(idCliente: number, id: number): Observable<Blob> {
    return this.http.get(`${this.base(idCliente)}/nota-credito/${id}/pdf`, { responseType: 'blob' });
  }

  pdfNotaDebito(idCliente: number, id: number): Observable<Blob> {
    return this.http.get(`${this.base(idCliente)}/nota-debito/${id}/pdf`, { responseType: 'blob' });
  }
}
