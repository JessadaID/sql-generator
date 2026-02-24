import type { SqlSchema, TableSchema, ColumnDef, ForeignKey } from '../types/schema';

export function parseSqlToSchema(sql: string): SqlSchema {
    const tables: TableSchema[] = [];
    const foreignKeys: ForeignKey[] = [];

    // Remove comments
    const cleanSql = sql.replace(/--.*$|^\s*#.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');

    const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_`"'.]+)\s*\(([\s\S]+)\)/i;

    // Split by statement to prevent greedy `[\s\S]+` from swallowing the next table
    const statements = cleanSql.split(';');

    for (let stmt of statements) {
        stmt = stmt.trim();
        if (!stmt) continue;

        const match = stmt.match(createTableRegex);
        if (!match) continue;

        const rawTableName = match[1];
        const tableName = rawTableName.replace(/[`"']/g, '').split('.').pop() || 'Untitled';
        const body = match[2];

        const columns: ColumnDef[] = [];
        const tablePk: string[] = [];

        // Split body by commas, but ignore commas inside parentheses (e.g. DECIMAL(10,2))
        const lines = splitByCommaOutsideParens(body);

        for (let line of lines) {
            line = line.trim();
            if (!line) continue;

            const upLine = line.toUpperCase();

            // Check for table-level PRIMARY KEY
            if (upLine.startsWith('PRIMARY KEY') || (upLine.startsWith('CONSTRAINT') && upLine.includes('PRIMARY KEY'))) {
                const pkMatch = line.match(/PRIMARY\s+KEY\s*\(([^)]+)\)/i);
                if (pkMatch) {
                    const keys = pkMatch[1].split(',').map(k => k.replace(/[`"'\s]/g, ''));
                    tablePk.push(...keys);
                }
                continue;
            }

            // Check for table-level FOREIGN KEY
            if (upLine.startsWith('FOREIGN KEY') || (upLine.startsWith('CONSTRAINT') && upLine.includes('FOREIGN KEY'))) {
                const fkMatch = line.match(/FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+([a-zA-Z0-9_`"'.]+)\s*\(([^)]+)\)/i);
                if (fkMatch) {
                    const fromCols = fkMatch[1].split(',').map(k => k.replace(/[`"'\s]/g, ''));
                    const toTable = fkMatch[2].replace(/[`"']/g, '').split('.').pop() || '';
                    const toCols = fkMatch[3].split(',').map(k => k.replace(/[`"'\s]/g, ''));

                    fromCols.forEach((col, idx) => {
                        foreignKeys.push({
                            fromTable: tableName,
                            fromColumn: col,
                            toTable: toTable,
                            toColumn: toCols[idx] || toCols[0],
                        });
                    });
                }
                continue;
            }

            // It's a column definition
            const parts = line.split(/\s+/);
            if (parts.length < 2) continue;

            const colName = parts[0].replace(/[`"']/g, '');

            // Attempt to extract type including lengths e.g. VARCHAR(255)
            const typeMatch = line.match(/^\S+\s+([a-zA-Z0-9_]+(?:\s*\([^)]+\))?)/);
            const colType = typeMatch ? typeMatch[1] : parts[1];

            const isPk = upLine.includes('PRIMARY KEY');
            if (isPk && !tablePk.includes(colName)) tablePk.push(colName);

            const isUnique = upLine.includes('UNIQUE');
            const isNotNull = upLine.includes('NOT NULL') || isPk;

            columns.push({
                name: colName,
                type: colType,
                isPrimaryKey: false, // will be resolved later
                isForeignKey: false, // will be resolved later
                nullable: !isNotNull,
                unique: isUnique || isPk
            });

            // Inline FOREIGN KEY
            const refMatch = line.match(/REFERENCES\s+([a-zA-Z0-9_`"'.]+)\s*\(([^)]+)\)/i);
            if (refMatch) {
                const toTable = refMatch[1].replace(/[`"']/g, '').split('.').pop() || '';
                const toCol = refMatch[2].replace(/[`"'\s]/g, '');
                foreignKeys.push({
                    fromTable: tableName,
                    fromColumn: colName,
                    toTable: toTable,
                    toColumn: toCol
                });
            }
        }

        // Set PK flags
        columns.forEach(col => {
            if (tablePk.includes(col.name)) {
                col.isPrimaryKey = true;
            }
        });

        tables.push({
            id: tableName,
            name: tableName,
            columns
        });
    }

    // Set FK flags
    foreignKeys.forEach(fk => {
        const table = tables.find(t => t.name === fk.fromTable);
        if (table) {
            const col = table.columns.find(c => c.name === fk.fromColumn);
            if (col) col.isForeignKey = true;
        }
    });

    return { tables, foreignKeys };
}

function splitByCommaOutsideParens(str: string): string[] {
    const result: string[] = [];
    let current = '';
    let depth = 0;

    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        if (char === '(') depth++;
        else if (char === ')') depth--;

        if (char === ',' && depth === 0) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    if (current) result.push(current);
    return result;
}
