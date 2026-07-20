export interface RegistrarValorRequest {
  valor_real: number;
}

export interface RegistrarValorResponse {
  success: boolean;
  item_id: number;
  item_codigo: string;
  item_descripcion: string;
  valor_esperado: number;
  valor_real: number;
  diferencia: number;
  diferencia_porcentaje: number;
  unidad: string;
  timestamp: string;
}

export interface ItemDetalle {
  item_id: number;
  item_codigo: string;
  item_descripcion: string;
  unidad_medida_id?: number;
  unidad: string;
  valor_esperado: number;
  valor_real: number | null;
  diferencia: number | null;
  completado: boolean;
}

export interface PrecargaResponse {
  inventario_id: number;
  tienda_id: number;
  estado: string;
  items: ItemDetalle[];
  resumen: ResumenProgreso;
}

export interface ResumenProgreso {
  total_items: number;
  completados: number;
  pendientes: number;
  porcentaje_progreso: number;
}
