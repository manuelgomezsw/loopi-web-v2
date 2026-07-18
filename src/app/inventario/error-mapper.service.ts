import { Injectable } from '@angular/core';

export interface ErrorResponse {
  error?: string;
  mensaje?: string;
  error_message?: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorMapperService {
  private readonly errorMessages: Record<string, string> = {
    // Errores de iniciar conteo (POST /inventarios)
    conteo_duplicado: 'Ya existe un conteo en progreso para esta tienda, tipo y horario. Usa la opción Reanudar si deseas continuar.',
    sin_items_contabilizar: 'No hay items activos para contabilizar en esta tienda para el tipo seleccionado. Verifica que haya items con la frecuencia de inventario correcta.',
    tienda_no_autorizada: 'No tienes permiso para iniciar conteos en esta tienda.',
    invalid_tipo: 'El tipo de conteo seleccionado no es válido. Selecciona: Diario, Semanal, Mensual o Inicial.',
    horario_required: 'El horario es obligatorio para conteos diarios.',
    invalid_horario: 'El horario seleccionado no es válido. Selecciona: Apertura, Mediodía o Cierre.',
    horario_not_allowed: 'No debes especificar horario para conteos semanales, mensuales o iniciales.',

    // Errores de registrar valor (PATCH /inventarios/{id}/items/{item_id})
    conteo_bloqueado: 'Este conteo está bloqueado. Solo el responsable puede registrar valores.',
    not_found: 'El conteo no fue encontrado o ya no existe.',
    ya_completado: 'Este conteo ya fue completado anteriormente y no puede ser modificado.',

    // Errores de confirmar (POST /inventarios/{id}/confirmar)
    items_sin_registrar: 'No todos los items tienen valores registrados. Completa todos antes de confirmar.',

    // Errores de autorización
    sin_permiso: 'No tienes permiso para realizar esta acción.',
    sin_tienda: 'Tu usuario no tiene una tienda asignada.',
    unauthorized: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',

    // Errores de validación
    validation_error: 'Los datos ingresados no son válidos.',
    invalid_request: 'La solicitud contiene datos inválidos.',

    // Errores de modificación
    estado_invalido: 'El estado del conteo no permite esta acción.',
    eliminacion_no_permitida: 'Solo se pueden eliminar conteos en progreso.'
  };

  /**
   * Extrae el mensaje de error más específico disponible
   */
  extractErrorMessage(error: any): string {
    if (!error) {
      return 'Ocurrió un error desconocido. Por favor intenta de nuevo.';
    }

    const errorResponse = error.error as ErrorResponse;

    // Intentar obtener el código de error (en diferentes formatos)
    const errorCode = errorResponse?.error || errorResponse?.error_message;

    // Si tenemos un código de error, usamos el mapeo
    if (errorCode && this.errorMessages[errorCode]) {
      return this.errorMessages[errorCode];
    }

    // Si tenemos un mensaje directo del servidor, usamos ese
    if (errorResponse?.mensaje) {
      return errorResponse.mensaje;
    }
    if (errorResponse?.message) {
      return errorResponse.message;
    }

    // Fallback: usar el mensaje de HTTP
    if (error.message) {
      return error.message;
    }

    return 'Ocurrió un error. Por favor intenta de nuevo.';
  }

  /**
   * Mapea un código de error a su mensaje descriptivo
   */
  mapErrorCode(errorCode: string): string {
    return this.errorMessages[errorCode] || `Error: ${errorCode}`;
  }

  /**
   * Obtiene todos los códigos de error conocidos (útil para testing/debugging)
   */
  getKnownErrors(): string[] {
    return Object.keys(this.errorMessages);
  }
}
