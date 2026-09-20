import { Injectable } from '@angular/core';
import { CrudApi } from './crud-api.service';
import { TipoDocumento } from '../models/tipo-documento.model';
import { components } from './schema';

type CreateTipoDocumentoDto = components['schemas']['CreateTipoDocumentoDto'];

@Injectable({ providedIn: 'root' })
export class TipoDocumentoApiService extends CrudApi<TipoDocumento, CreateTipoDocumentoDto> {
  protected override readonly resourcePath = 'tipo-documento';
}
