import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IconComponent, IconName } from './icon.component';

const REGISTERED_ICONS: IconName[] = [
  'home',
  'building-storefront',
  'users',
  'squares-2x2',
  'book-open',
  'clipboard-document-list',
  'trash',
  'shopping-cart',
  'banknotes',
  'chart-bar',
  'presentation-chart-line',
  'chevron-left',
  'chevron-right',
];

describe('IconComponent', () => {
  let fixture: ComponentFixture<IconComponent>;
  let component: IconComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(IconComponent);
    component = fixture.componentInstance;
  });

  it('debe crearse correctamente', () => {
    component.name = 'home';
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('renderiza un elemento <svg> con aria-hidden="true"', () => {
    component.name = 'home';
    fixture.detectChanges();
    const svg = fixture.nativeElement.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg.getAttribute('aria-hidden')).toBe('true');
  });

  REGISTERED_ICONS.forEach((iconName) => {
    it(`renderiza <path> para el ícono "${iconName}"`, () => {
      component.name = iconName;
      fixture.detectChanges();
      const path = fixture.nativeElement.querySelector('svg path');
      expect(path).withContext(`El ícono "${iconName}" debe producir un <path>`).toBeTruthy();
    });
  });

  it('renderiza el fallback (<circle>) para un nombre desconocido', () => {
    component.name = 'icono-que-no-existe';
    fixture.detectChanges();
    const circle = fixture.nativeElement.querySelector('svg circle');
    expect(circle).withContext('Nombre inválido debe producir el fallback <circle>').toBeTruthy();
  });

  it('el fallback no rompe el componente', () => {
    component.name = '';
    fixture.detectChanges();
    expect(component).toBeTruthy();
    const svg = fixture.nativeElement.querySelector('svg');
    expect(svg).toBeTruthy();
  });
});
