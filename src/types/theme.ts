// Theme and Background Types
export type Theme = 'dark' | 'light';
export type BackgroundType = 'dots' | 'lines';

// Type alias re-exports from schema.ts for backward compatibility
export type { ColumnDef, ForeignKey, TableSchema, SqlSchema } from './schema';
