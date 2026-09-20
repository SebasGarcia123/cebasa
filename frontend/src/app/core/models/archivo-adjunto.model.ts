export interface ArchivoAdjunto {
  id_archivo_adjunto: number;
  nombre_archivo: string;
  ruta_archivo: string;
  tipo_archivo: string | null;
  fecha_carga: string;
}
