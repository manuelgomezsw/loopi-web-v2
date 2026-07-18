import { TestBed } from '@angular/core/testing';
import { ErrorMapperService, ErrorResponse } from './error-mapper.service';

describe('ErrorMapperService', () => {
  let service: ErrorMapperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ErrorMapperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('extractErrorMessage - iniciar conteo errors', () => {
    it('should map conteo_duplicado error', () => {
      const error = {
        error: { error: 'conteo_duplicado', mensaje: 'Ya existe...' }
      };
      const msg = service.extractErrorMessage(error);
      expect(msg).toContain('Ya existe un conteo en progreso');
      expect(msg).toContain('Reanudar');
    });

    it('should map tienda_no_autorizada error', () => {
      const error = {
        error: { error: 'tienda_no_autorizada', mensaje: 'No tienes permiso...' }
      };
      const msg = service.extractErrorMessage(error);
      expect(msg).toContain('No tienes permiso');
      expect(msg).toContain('tienda');
    });

    it('should map invalid_tipo error', () => {
      const error = {
        error: { error: 'invalid_tipo', mensaje: 'tipo debe ser...' }
      };
      const msg = service.extractErrorMessage(error);
      expect(msg).toContain('tipo de conteo');
      expect(msg).toContain('Diario, Semanal, Mensual o Inicial');
    });

    it('should map horario_required error', () => {
      const error = {
        error: { error: 'horario_required', mensaje: 'horario es requerido...' }
      };
      const msg = service.extractErrorMessage(error);
      expect(msg).toContain('horario es obligatorio');
      expect(msg).toContain('diarios');
    });

    it('should map invalid_horario error', () => {
      const error = {
        error: { error: 'invalid_horario', mensaje: 'horario debe ser...' }
      };
      const msg = service.extractErrorMessage(error);
      expect(msg).toContain('horario');
      expect(msg).toContain('Apertura, Mediodía o Cierre');
    });

    it('should map horario_not_allowed error', () => {
      const error = {
        error: { error: 'horario_not_allowed', mensaje: 'horario no debe...' }
      };
      const msg = service.extractErrorMessage(error);
      expect(msg).toContain('No debes especificar horario');
    });
  });

  describe('extractErrorMessage - registrar valor errors', () => {
    it('should map conteo_bloqueado error for registrar', () => {
      const error = {
        error: { error: 'conteo_bloqueado', mensaje: 'solo se pueden registrar...' }
      };
      const msg = service.extractErrorMessage(error);
      expect(msg).toContain('bloqueado');
      expect(msg).toContain('responsable');
    });

    it('should map not_found error', () => {
      const error = {
        error: { error: 'not_found', mensaje: 'inventario no encontrado' }
      };
      const msg = service.extractErrorMessage(error);
      expect(msg).toContain('conteo no fue encontrado');
    });
  });

  describe('extractErrorMessage - confirmar errors', () => {
    it('should map ya_completado error', () => {
      const error = {
        error: { error: 'ya_completado', mensaje: 'conteo ya está completado' }
      };
      const msg = service.extractErrorMessage(error);
      expect(msg).toContain('ya fue completado');
      expect(msg).toContain('modificado');
    });

    it('should map items_sin_registrar error', () => {
      const error = {
        error: { error: 'items_sin_registrar', mensaje: 'todos los items deben...' }
      };
      const msg = service.extractErrorMessage(error);
      expect(msg).toContain('todos los items tienen valores');
    });
  });

  describe('extractErrorMessage - fallbacks', () => {
    it('should use mensaje from error response when error code unknown', () => {
      const error = {
        error: { error: 'unknown_code', mensaje: 'Custom error message' }
      };
      const msg = service.extractErrorMessage(error);
      expect(msg).toBe('Custom error message');
    });

    it('should use message field when error field missing', () => {
      const error = {
        error: { message: 'Alternative message format' }
      };
      const msg = service.extractErrorMessage(error);
      expect(msg).toBe('Alternative message format');
    });

    it('should use error.message when error.error missing', () => {
      const error = { message: 'HTTP error message' };
      const msg = service.extractErrorMessage(error);
      expect(msg).toBe('HTTP error message');
    });

    it('should return generic message when no error info available', () => {
      const msg = service.extractErrorMessage({});
      expect(msg).toContain('desconocido');
    });

    it('should handle null/undefined error', () => {
      const msg = service.extractErrorMessage(null);
      expect(msg).toContain('desconocido');
    });
  });

  describe('mapErrorCode', () => {
    it('should map known error code', () => {
      const msg = service.mapErrorCode('conteo_duplicado');
      expect(msg).toContain('Ya existe un conteo en progreso');
    });

    it('should return prefixed message for unknown code', () => {
      const msg = service.mapErrorCode('unknown_error');
      expect(msg).toBe('Error: unknown_error');
    });
  });

  describe('getKnownErrors', () => {
    it('should return array of known error codes', () => {
      const errors = service.getKnownErrors();
      expect(Array.isArray(errors)).toBe(true);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors).toContain('conteo_duplicado');
      expect(errors).toContain('tienda_no_autorizada');
      expect(errors).toContain('items_sin_registrar');
    });

    it('should contain all critical error codes', () => {
      const errors = service.getKnownErrors();
      const criticalErrors = [
        'conteo_duplicado',
        'tienda_no_autorizada',
        'conteo_bloqueado',
        'not_found',
        'ya_completado',
        'items_sin_registrar',
        'unauthorized'
      ];
      criticalErrors.forEach(code => {
        expect(errors).toContain(code, `Missing error code: ${code}`);
      });
    });
  });

  describe('authorization errors', () => {
    it('should map unauthorized error', () => {
      const error = {
        error: { error: 'unauthorized', mensaje: 'Token inválido' }
      };
      const msg = service.extractErrorMessage(error);
      expect(msg).toContain('sesión ha expirado');
    });

    it('should map sin_permiso error', () => {
      const error = {
        error: { error: 'sin_permiso', mensaje: 'sin permiso' }
      };
      const msg = service.extractErrorMessage(error);
      expect(msg).toContain('No tienes permiso');
    });
  });

  describe('validation errors', () => {
    it('should map validation_error', () => {
      const error = {
        error: { error: 'validation_error', mensaje: 'datos inválidos' }
      };
      const msg = service.extractErrorMessage(error);
      expect(msg).toContain('datos ingresados');
      expect(msg).toContain('válidos');
    });

    it('should map invalid_request error', () => {
      const error = {
        error: { error: 'invalid_request', mensaje: 'request inválido' }
      };
      const msg = service.extractErrorMessage(error);
      expect(msg).toContain('solicitud');
      expect(msg).toContain('datos inválidos');
    });
  });
});
