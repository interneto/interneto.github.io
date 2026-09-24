// Shared types for the AI comparison tables (SortableTable.astro).

export interface SortableColumn {
  key: string;
  label: string;
  sortable?: boolean;
}

export interface SortableTableDef {
  title: string;
  columns: SortableColumn[];
  rows: Record<string, unknown>[];
}