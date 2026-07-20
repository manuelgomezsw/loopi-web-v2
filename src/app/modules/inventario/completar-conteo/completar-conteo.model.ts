export interface ConfirmarRequest {
  confirmar: boolean;
}

export interface ResumenConfirmacion {
  total_items: number;
  items_correctos: number;
  items_faltantes: number;
  items_exceso: number;
  diferencia_negativa: number;
  diferencia_positiva: number;
  porcentaje_variacion: number;
}

export interface ConfirmarResponse {
  id: number;
  tienda_id: number;
  estado: 'en_progreso' | 'completado';
  completado_en: string;
  items_ajustados: number;
  resumen: ResumenConfirmacion;
  timestamp: string;
}

export interface InventarioDetalle {
  id: number;
  tienda_id: number;
  estado: 'en_progreso' | 'completado';
  items: ItemDetalle[];
  iniciado_en: string;
  completado_en?: string;
}

export interface ItemDetalle {
  id: number;
  item_id: number;
  nombre: string;
  valor_esperado: number;
  valor_real?: number;
  diferencia?: number;
  completado: boolean;
}

export interface ErrorResponse {
  error: string;
  mensaje: string;
  campo?: string;
}
