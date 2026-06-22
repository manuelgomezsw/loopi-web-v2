export type TipoMedida = 'peso' | 'volumen' | 'unidad';

export interface UnidadMedida {
  id: number;
  codigo: string;
  nombre: string;
  tipo_medida: TipoMedida;
  factor_conversion: number;
  unidad_base: boolean;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
}

export interface UnidadMedidaDetalle extends UnidadMedida {
  items_con_unidad_canonica: number;
}

export interface ListarUnidadesMedidaResponse {
  unidades_medida: UnidadMedida[];
  total: number;
  page: number;
  limit: number;
}

export interface CrearUnidadMedidaRequest {
  codigo: string;
  nombre: string;
  tipo_medida: TipoMedida;
  factor_conversion: number;
}

export interface EditarUnidadMedidaRequest {
  nombre?: string;
  factor_conversion?: number;
}

export interface ImpactoInactivacionResponse {
  unidad_id: number;
  items_con_unidad_canonica: number;
  advertencia: string | null;
}

export interface InactivarUnidadResponse {
  id: number;
  activo: boolean;
  mensaje: string;
}

export interface ApiError {
  error: string;
  mensaje: string;
  campo?: string;
  detalles: unknown[];
}
