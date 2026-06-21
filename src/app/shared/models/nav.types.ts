export type Rol = 'admin' | 'lider_compras' | 'lider_tienda' | 'barista';

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  roles: Rol[];
  orden: number;
}

export interface StoreContext {
  tienda_id: number | null;
  nombre: string | null;
}

export interface TiendaOpcion {
  id: number;
  nombre: string;
  codigo: string;
}
