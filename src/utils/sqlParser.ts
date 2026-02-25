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

/**
 * Apply a set of ALTER TABLE statements to an existing schema.
 * Returns a new schema (immutable) with the changes applied.
 */
export function applyAlterStatements(schema: SqlSchema, sql: string): SqlSchema {
    // Deep clone to avoid mutation
    let tables: TableSchema[] = schema.tables.map((t) => ({
        ...t,
        columns: t.columns.map((c) => ({ ...c })),
    }));
    let foreignKeys: ForeignKey[] = [...schema.foreignKeys];

    // Remove SQL comments then split by semicolons
    const clean = sql.replace(/--.*$|^\s*#.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    const statements = clean.split(';').map((s) => s.trim()).filter(Boolean);

    for (const stmt of statements) {
        // Match: ALTER TABLE <tableName> <action...>
        const headerMatch = stmt.match(/^ALTER\s+TABLE\s+([a-zA-Z0-9_`"'.]+)\s+(.+)/is);
        if (!headerMatch) continue;

        const tableName = headerMatch[1].replace(/[`"']/g, '').split('.').pop() || '';
        const action = headerMatch[2].trim();

        const tableIdx = tables.findIndex((t) => t.name === tableName);

        // ── ADD COLUMN ─────────────────────────────────────────────
        if (/^ADD\s+COLUMN\s+/i.test(action) || /^ADD\s+(?!CONSTRAINT|PRIMARY|FOREIGN|UNIQUE|INDEX|KEY)/i.test(action)) {
            if (tableIdx === -1) continue;
            // Strip 'ADD COLUMN' or 'ADD' prefix
            const colDef = action.replace(/^ADD\s+COLUMN\s+/i, '').replace(/^ADD\s+/i, '').trim();
            const newCol = parseColumnDef(colDef);
            if (!newCol) continue;
            // Avoid duplicate
            if (!tables[tableIdx].columns.find((c) => c.name === newCol.name)) {
                tables[tableIdx].columns.push(newCol);
            }
            continue;
        }

        // ── DROP COLUMN ────────────────────────────────────────────
        if (/^DROP\s+COLUMN\s+/i.test(action) || /^DROP\s+(?!FOREIGN|PRIMARY|CONSTRAINT|INDEX|KEY)/i.test(action)) {
            if (tableIdx === -1) continue;
            const colName = action.replace(/^DROP\s+COLUMN\s+/i, '').replace(/^DROP\s+/i, '').replace(/[`"']/g, '').trim();
            tables[tableIdx].columns = tables[tableIdx].columns.filter((c) => c.name !== colName);
            // Remove FKs that use this column
            foreignKeys = foreignKeys.filter(
                (fk) => !(fk.fromTable === tableName && fk.fromColumn === colName)
            );
            continue;
        }

        // ── MODIFY/ALTER COLUMN ────────────────────────────────────
        if (/^MODIFY\s+COLUMN\s+/i.test(action) || /^MODIFY\s+/i.test(action) || /^ALTER\s+COLUMN\s+/i.test(action)) {
            if (tableIdx === -1) continue;
            const colDef = action
                .replace(/^MODIFY\s+COLUMN\s+/i, '')
                .replace(/^MODIFY\s+/i, '')
                .replace(/^ALTER\s+COLUMN\s+/i, '')
                .trim();
            const updated = parseColumnDef(colDef);
            if (!updated) continue;
            const colIdx = tables[tableIdx].columns.findIndex((c) => c.name === updated.name);
            if (colIdx !== -1) {
                // Preserve PK/FK flags, override rest
                tables[tableIdx].columns[colIdx] = {
                    ...tables[tableIdx].columns[colIdx],
                    type: updated.type,
                    nullable: updated.nullable,
                    unique: updated.unique || tables[tableIdx].columns[colIdx].unique,
                };
            }
            continue;
        }

        // ── RENAME COLUMN <old> TO <new> ───────────────────────────
        if (/^RENAME\s+COLUMN\s+/i.test(action)) {
            if (tableIdx === -1) continue;
            const renameMatch = action.match(/RENAME\s+COLUMN\s+([a-zA-Z0-9_`"']+)\s+TO\s+([a-zA-Z0-9_`"']+)/i);
            if (!renameMatch) continue;
            const oldName = renameMatch[1].replace(/[`"']/g, '');
            const newName = renameMatch[2].replace(/[`"']/g, '');
            const colIdx = tables[tableIdx].columns.findIndex((c) => c.name === oldName);
            if (colIdx !== -1) {
                tables[tableIdx].columns[colIdx].name = newName;
            }
            // Update FK references
            foreignKeys = foreignKeys.map((fk) => {
                if (fk.fromTable === tableName && fk.fromColumn === oldName)
                    return { ...fk, fromColumn: newName };
                if (fk.toTable === tableName && fk.toColumn === oldName)
                    return { ...fk, toColumn: newName };
                return fk;
            });
            continue;
        }

        // ── ADD CONSTRAINT ... PRIMARY KEY ─────────────────────────
        if (/^ADD\s+CONSTRAINT\s+.+\s+PRIMARY\s+KEY/i.test(action) || /^ADD\s+PRIMARY\s+KEY/i.test(action)) {
            if (tableIdx === -1) continue;
            const pkMatch = action.match(/PRIMARY\s+KEY\s*\(([^)]+)\)/i);
            if (!pkMatch) continue;
            const pkCols = pkMatch[1].split(',').map((k) => k.replace(/[`"'\s]/g, ''));
            tables[tableIdx].columns.forEach((col) => {
                if (pkCols.includes(col.name)) {
                    col.isPrimaryKey = true;
                    col.nullable = false;
                }
            });
            continue;
        }

        // ── ADD CONSTRAINT ... FOREIGN KEY ─────────────────────────
        if (/^ADD\s+CONSTRAINT\s+.+\s+FOREIGN\s+KEY/i.test(action) || /^ADD\s+FOREIGN\s+KEY/i.test(action)) {
            if (tableIdx === -1) continue;
            const fkMatch = action.match(/FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+([a-zA-Z0-9_`"'.]+)\s*\(([^)]+)\)/i);
            if (!fkMatch) continue;
            const fromCols = fkMatch[1].split(',').map((k) => k.replace(/[`"'\s]/g, ''));
            const toTable = fkMatch[2].replace(/[`"']/g, '').split('.').pop() || '';
            const toCols = fkMatch[3].split(',').map((k) => k.replace(/[`"'\s]/g, ''));
            fromCols.forEach((col, idx) => {
                const fk: ForeignKey = { fromTable: tableName, fromColumn: col, toTable, toColumn: toCols[idx] || toCols[0] };
                const key = `${fk.fromTable}.${fk.fromColumn}->${fk.toTable}.${fk.toColumn}`;
                if (!foreignKeys.find((f) => `${f.fromTable}.${f.fromColumn}->${f.toTable}.${f.toColumn}` === key)) {
                    foreignKeys.push(fk);
                    // Mark column as FK
                    const c = tables[tableIdx].columns.find((c) => c.name === col);
                    if (c) c.isForeignKey = true;
                }
            });
            continue;
        }

        // ── DROP FOREIGN KEY / DROP CONSTRAINT ─────────────────────
        if (/^DROP\s+FOREIGN\s+KEY/i.test(action) || /^DROP\s+CONSTRAINT/i.test(action)) {
            // Extract constraint/FK name and try to match
            const nameMatch = action.match(/(?:DROP\s+FOREIGN\s+KEY|DROP\s+CONSTRAINT)\s+([a-zA-Z0-9_`"']+)/i);
            if (!nameMatch) continue;
            const constraintName = nameMatch[1].replace(/[`"']/g, '');
            // Remove FKs whose generated name matches (fk_fromTable_fromColumn pattern)
            foreignKeys = foreignKeys.filter(
                (fk) => `fk_${fk.fromTable}_${fk.fromColumn}` !== constraintName
            );
            continue;
        }

        // ── RENAME TABLE ────────────────────────────────────────────
        if (/^RENAME\s+TO\s+/i.test(action)) {
            if (tableIdx === -1) continue;
            const newName = action.replace(/^RENAME\s+TO\s+/i, '').replace(/[`"']/g, '').trim();
            const oldName = tables[tableIdx].name;
            tables[tableIdx].name = newName;
            tables[tableIdx].id = newName;
            // Update FK references
            foreignKeys = foreignKeys.map((fk) => ({
                ...fk,
                fromTable: fk.fromTable === oldName ? newName : fk.fromTable,
                toTable: fk.toTable === oldName ? newName : fk.toTable,
            }));
            continue;
        }
    }

    return { tables, foreignKeys };
}

/** Parse a single column definition line into a ColumnDef */
function parseColumnDef(line: string): ColumnDef | null {
    line = line.trim();
    if (!line) return null;
    const parts = line.split(/\s+/);
    if (parts.length < 2) return null;

    const name = parts[0].replace(/[`"']/g, '');
    const typeMatch = line.match(/^\S+\s+([a-zA-Z0-9_]+(?:\s*\([^)]+\))?)/);
    const type = typeMatch ? typeMatch[1] : parts[1];
    const upLine = line.toUpperCase();
    const isPrimaryKey = upLine.includes('PRIMARY KEY');
    const isUnique = upLine.includes('UNIQUE');
    const isNotNull = upLine.includes('NOT NULL') || isPrimaryKey;

    return { name, type, isPrimaryKey, isForeignKey: false, nullable: !isNotNull, unique: isUnique || isPrimaryKey };
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
