export interface Direccion {
  id_direccion: number;
  calle: string;
  numero: string | null;
  entrecalle1: string | null;
  entrecalle2: string | null;
  localidad: string;
  provincia: string;
  id_estado: number;
}
