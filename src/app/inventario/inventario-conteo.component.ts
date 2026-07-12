import { Component, OnInit } from '@angular/core';
import { InventarioService, SugerenciaResp, InventarioResp } from './inventario.service';

@Component({
  selector: 'app-inventario-conteo',
  templateUrl: './inventario-conteo.component.html',
  styleUrls: []
})
export class InventarioConteoComponent implements OnInit {
  sugerencia: SugerenciaResp | null = null;
  inventarioActual: InventarioResp | null = null;
  step: 'select' | 'register' | 'confirm' | 'complete' = 'select';

  formData = {
    tienda_id: 1,
    tipo: '',
    horario: ''
  };

  valoresRegistrados: Map<number, number> = new Map();

  constructor(private inventarioService: InventarioService) { }

  ngOnInit(): void {
    this.loadSugerencia();
  }

  loadSugerencia(): void {
    this.inventarioService.getSugerencia().subscribe({
      next: (data) => {
        this.sugerencia = data;
        this.formData.tipo = data.tipo;
        this.formData.horario = data.horario;
      },
      error: (err) => console.error('Error al obtener sugerencia:', err)
    });
  }

  iniciarConteo(): void {
    this.inventarioService.iniciarConteo({
      tienda_id: this.formData.tienda_id,
      tipo: this.formData.tipo,
      horario: this.formData.horario
    }).subscribe({
      next: (data) => {
        this.inventarioActual = data;
        this.step = 'register';
      },
      error: (err) => console.error('Error al iniciar conteo:', err)
    });
  }

  registrarValor(itemId: number, valor: number): void {
    if (!this.inventarioActual) return;

    this.inventarioService.registrarValorReal(this.inventarioActual.id, itemId, valor).subscribe({
      next: (data) => {
        this.valoresRegistrados.set(itemId, valor);
        // Actualizar el item en la lista local
        const item = this.inventarioActual!.items.find(i => i.item_id === itemId);
        if (item) {
          item.valor_real = data.valor_real;
          item.diferencia = data.diferencia;
        }
      },
      error: (err) => console.error('Error al registrar valor:', err)
    });
  }

  confirmarConteo(): void {
    if (!this.inventarioActual) return;

    this.inventarioService.confirmarConteo(this.inventarioActual.id).subscribe({
      next: (data) => {
        this.inventarioActual = data;
        this.step = 'complete';
      },
      error: (err) => console.error('Error al confirmar conteo:', err)
    });
  }

  todosRegistrados(): boolean {
    if (!this.inventarioActual) return false;
    return this.inventarioActual.items.every(item => item.valor_real !== null && item.valor_real !== undefined);
  }

  volver(): void {
    if (this.step === 'register') {
      this.step = 'select';
    } else if (this.step === 'confirm') {
      this.step = 'register';
    }
  }
}
