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
    const texts = fixture.nativeElement.querySelectorAll('ul li a span');
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

  it('cada ítem de menú usa app-icon en lugar de texto emoji', () => {
    const icons = fixture.nativeElement.querySelectorAll('ul li a app-icon');
    expect(icons.length).toBe(ITEMS_ADMIN.length);
  });

  it('cada enlace tiene aria-label con el nombre del módulo', () => {
    const links = fixture.nativeElement.querySelectorAll('ul li a');
    const labels = Array.from(links).map((el) => (el as Element).getAttribute('aria-label'));
    expect(labels).toContain('Tiendas');
    expect(labels).toContain('Empleados');
  });

  it('cada enlace tiene title con el nombre del módulo', () => {
    const links = fixture.nativeElement.querySelectorAll('ul li a');
    const titles = Array.from(links).map((el) => (el as Element).getAttribute('title'));
    expect(titles).toContain('Tiendas');
    expect(titles).toContain('Empleados');
  });

  describe('collapsed input (HU-2)', () => {
    it('el texto del ítem es visible por defecto (collapsed=false)', () => {
      component.collapsed = false;
      fixture.detectChanges();
      const span = fixture.nativeElement.querySelector('ul li a span');
      expect(span.classList.contains('lg:hidden')).toBeFalse();
    });

    it('el texto del ítem tiene lg:hidden cuando collapsed=true', () => {
      component.collapsed = true;
      fixture.detectChanges();
      const span = fixture.nativeElement.querySelector('ul li a span');
      expect(span.classList.contains('lg:hidden')).toBeTrue();
    });

    it('el botón chevron emite collapseToggled al hacer clic', () => {
      let emitted = false;
      component.collapseToggled.subscribe(() => (emitted = true));
      const btn = fixture.nativeElement.querySelector('button[aria-label="Colapsar menú"]');
      btn?.click();
      expect(emitted).toBeTrue();
    });

    it('el botón chevron muestra aria-label "Expandir menú" cuando collapsed=true', () => {
      component.collapsed = true;
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('button[aria-label="Expandir menú"]');
      expect(btn).toBeTruthy();
    });
  });
});
