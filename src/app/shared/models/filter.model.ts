export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterDefinition {
  key: string;
  options: FilterOption[];
  defaultValue: string | null;
}

export type ActiveFilters = Record<string, string>;

export interface ColumnDef<T = unknown> {
  key: keyof T & string;
  label: string;
  width?: string;
}

export interface BreadcrumbItem {
  label: string;
  route?: string;
}

export type FormMode = 'create' | 'edit';
