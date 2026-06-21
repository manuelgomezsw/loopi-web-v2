import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal, WritableSignal } from '@angular/core';

import { SidebarComponent } from './sidebar.component';
import { NavConfigService } from '../../../services/nav-config.service';
import { NavItem } from '../../../models/nav.types';

const ITEMS_ADMIN: NavItem[] = [
  { id: 'tiendas', label: 'Tiendas', icon: 'building-storefront', route: '/tiendas', roles: ['admin'], orden: 1 },
  { id: 'empleados', label: 'Empleados', icon: 'users', route: '/empleados', roles: ['admin'], orden: 2 },
];

const ITEMS_LIDER: NavItem[] = [
  { id: 'inventario', label: 'Inventario', icon: 'clipboard-document-list', route: '/inventario', roles: ['lider_tienda'], orden: 1 },
];

describe('SidebarComponent', () => {
  let fixture: ComponentFixture<SidebarComponent>;
  let component: SidebarComponent;
  let navItemsSignal: WritableSignal<NavItem[]>;

  beforeEach(async () => {
    navItemsSignal = signal<NavItem[]>(ITEMS_ADMIN);

    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        provideRouter([]),
        {
          provide: NavConfigService,
          useValue: { navItems: navItemsSignal },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('renderiza los ítems del servicio', () => {
    const links = fixture.nativeElement.querySelectorAll('ul li a');
    expect(links.length).toBe(2);
  });

  it('muestra las etiquetas correctas de los ítems', () => {
    const texts = fixture.nativeElement.querySelectorAll('ul li a span:last-child');
    const labels = Array.from(texts).map((el) => (el as Element).textContent?.trim());
    expect(labels).toContain('Tiendas');
    expect(labels).toContain('Empleados');
  });

  it('cuando cambia a ítems de lider_tienda solo muestra los suyos', () => {
    navItemsSignal.set(ITEMS_LIDER);
    fixture.detectChanges();
    const links = fixture.nativeElement.querySelectorAll('ul li a');
    expect(links.length).toBe(1);
  });

  it('emite closed al hacer clic en el overlay', () => {
    component.isOpen = true;
    fixture.detectChanges();
    let emitted = false;
    component.closed.subscribe(() => (emitted = true));
    const overlay = fixture.nativeElement.querySelector('[aria-hidden="true"]');
    overlay?.click();
    expect(emitted).toBeTrue();
  });

  it('emite closed al hacer clic en el botón de cerrar (mobile)', () => {
    component.isOpen = true;
    fixture.detectChanges();
    let emitted = false;
    component.closed.subscribe(() => (emitted = true));
    const btn = fixture.nativeElement.querySelector('button[aria-label="Cerrar menú"]');
    btn?.click();
    expect(emitted).toBeTrue();
  });

  it('el nav tiene role=navigation y aria-label correcto', () => {
    const nav = fixture.nativeElement.querySelector('nav');
    expect(nav.getAttribute('role')).toBe('navigation');
    expect(nav.getAttribute('aria-label')).toBe('Menú principal');
  });

  it('iconEmoji retorna un valor para cada ícono conocido', () => {
    const icons = ['home', 'building-storefront', 'users', 'squares-2x2',
      'book-open', 'clipboard-document-list', 'trash', 'shopping-cart',
      'banknotes', 'chart-bar', 'presentation-chart-line'];
    icons.forEach((icon) => {
      expect(component.iconEmoji(icon)).toBeTruthy();
    });
  });

  it('iconEmoji retorna ● para ícono desconocido', () => {
    expect(component.iconEmoji('unknown-icon')).toBe('●');
  });
});
