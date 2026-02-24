// Types for SQL schema definition
export interface ColumnDef {
    name: string;
    type: string;
    isPrimaryKey?: boolean;
    isForeignKey?: boolean;
    nullable?: boolean;
    unique?: boolean;
}

export interface ForeignKey {
    fromTable: string;
    fromColumn: string;
    toTable: string;
    toColumn: string;
}

export interface TableSchema {
    id: string;
    name: string;
    columns: ColumnDef[];
}

export interface SqlSchema {
    tables: TableSchema[];
    foreignKeys: ForeignKey[];
}
