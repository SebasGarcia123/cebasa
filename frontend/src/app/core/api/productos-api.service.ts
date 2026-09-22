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
// id_estado no está en el alta (arranca Activo), pero sí se puede
// editar después entre Activo/Anulado.
type UpdateProductoDto = Partial<CreateProductoDto> & { id_estado?: number };

@Injectable({ providedIn: 'root' })
export class ProductosApiService extends CrudApi<Producto, CreateProductoDto, UpdateProductoDto> {
  protected override readonly resourcePath = 'productos';
}
