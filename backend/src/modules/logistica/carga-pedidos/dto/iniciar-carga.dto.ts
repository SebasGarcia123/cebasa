import { IsBoolean } from 'class-validator';

export class IniciarCargaDto {
  // Si es true el sistema reparte los pallets entre los dos lados del
  // camión y sugiere el orden; si es false el operario los marca en el
  // orden que quiera.
  @IsBoolean()
  sugerir_orden: boolean;
}
