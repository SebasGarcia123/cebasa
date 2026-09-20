import { Injectable } from '@angular/core';
import { CrudApi } from './crud-api.service';
import { Producto } from '../models/producto.model';
import { components } from './schema';

// id_archivo_adjunto admite null para poder desvincular la foto (el
// schema generado lo tipa como number opcional nada más, pero el backend
// acepta null vía @IsOptional()).
type CreateProductoDto = Omit<components['schemas']['CreateProductoDto'], 'id_archivo_adjunto'> & {
  id_archivo_adjunto?: number | null;
};

@Injectable({ providedIn: 'root' })
export class ProductosApiService extends CrudApi<Producto, CreateProductoDto> {
  protected override readonly resourcePath = 'productos';
}
