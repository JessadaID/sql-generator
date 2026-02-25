import type { SqlSchema } from '../types/schema';

// Generate a full SQL CREATE TABLE script from the current schema
export function generateSql(schema: SqlSchema): string {
    if (schema.tables.length === 0) return '-- No tables defined';

    const lines: string[] = [];
    lines.push('-- SQL Schema Export');
    lines.push(`-- Generated: ${new Date().toISOString()}`);
    lines.push('');

    schema.tables.forEach((table, idx) => {
        lines.push(`CREATE TABLE \`${table.name}\` (`);

        const columnDefs = table.columns.map((col) => {
            const parts: string[] = [`  \`${col.name}\` ${col.type}`];
            if (!col.nullable) parts.push('NOT NULL');
            if (col.unique && !col.isPrimaryKey) parts.push('UNIQUE');
            return parts.join(' ');
        });

        // Collect primary key columns
        const pkCols = table.columns.filter((c) => c.isPrimaryKey).map((c) => `\`${c.name}\``);

        // Collect foreign key constraints referencing this table
        const fkConstraints = schema.foreignKeys
            .filter((fk) => fk.fromTable === table.name)
            .map(
                (fk) =>
                    `  CONSTRAINT \`fk_${fk.fromTable}_${fk.fromColumn}\` FOREIGN KEY (\`${fk.fromColumn}\`) REFERENCES \`${fk.toTable}\` (\`${fk.toColumn}\`)`
            );

        const allDefs = [...columnDefs];
        if (pkCols.length > 0) {
            allDefs.push(`  PRIMARY KEY (${pkCols.join(', ')})`);
        }
        allDefs.push(...fkConstraints);

        lines.push(allDefs.join(',\n'));
        lines.push(');');

        // Add blank line between tables
        if (idx < schema.tables.length - 1) lines.push('');
    });

    return lines.join('\n');
}

/**
 * Generate ALTER TABLE migration SQL by diffing oldSchema vs newSchema.
 * Covers: CREATE TABLE (new tables), DROP TABLE (removed), ADD/DROP/MODIFY COLUMN, ADD/DROP FK constraints.
 */
export function generateAlterSql(oldSchema: SqlSchema, newSchema: SqlSchema): string {
    const lines: string[] = [];
    lines.push('-- Migration: ALTER TABLE Statements');
    lines.push(`-- Generated: ${new Date().toISOString()}`);
    lines.push('');

    const oldTableMap = new Map(oldSchema.tables.map((t) => [t.name, t]));
    const newTableMap = new Map(newSchema.tables.map((t) => [t.name, t]));

    // Tables removed → DROP TABLE
    for (const [name] of oldTableMap) {
        if (!newTableMap.has(name)) {
            lines.push(`DROP TABLE IF EXISTS \`${name}\`;`);
        }
    }

    // Tables added → CREATE TABLE (reuse generateSql logic for one table)
    for (const [name, table] of newTableMap) {
        if (!oldTableMap.has(name)) {
            lines.push('');
            const tempSchema = { tables: [table], foreignKeys: newSchema.foreignKeys.filter((fk) => fk.fromTable === name) };
            lines.push(generateSql(tempSchema));
        }
    }

    // Tables in both → diff columns & FKs
    for (const [name, newTable] of newTableMap) {
        const oldTable = oldTableMap.get(name);
        if (!oldTable) continue; // already handled as new table

        const oldColMap = new Map(oldTable.columns.map((c) => [c.name, c]));
        const newColMap = new Map(newTable.columns.map((c) => [c.name, c]));

        const tableLines: string[] = [];

        // Dropped columns
        for (const [colName] of oldColMap) {
            if (!newColMap.has(colName)) {
                tableLines.push(`ALTER TABLE \`${name}\` DROP COLUMN \`${colName}\`;`);
            }
        }

        // Added columns
        for (const [colName, newCol] of newColMap) {
            if (!oldColMap.has(colName)) {
                const parts = [`  \`${newCol.name}\` ${newCol.type}`];
                if (!newCol.nullable) parts.push('NOT NULL');
                if (newCol.unique && !newCol.isPrimaryKey) parts.push('UNIQUE');
                tableLines.push(`ALTER TABLE \`${name}\` ADD COLUMN ${parts.join(' ').trim()};`);
            }
        }

        // Modified columns (type or nullable changed)
        for (const [colName, newCol] of newColMap) {
            const oldCol = oldColMap.get(colName);
            if (!oldCol) continue;
            if (oldCol.type !== newCol.type || oldCol.nullable !== newCol.nullable) {
                const parts = [`\`${newCol.name}\` ${newCol.type}`];
                if (!newCol.nullable) parts.push('NOT NULL');
                if (newCol.unique && !newCol.isPrimaryKey) parts.push('UNIQUE');
                tableLines.push(`ALTER TABLE \`${name}\` MODIFY COLUMN ${parts.join(' ')};`);
            }
        }

        // FK diff
        const oldFks = oldSchema.foreignKeys.filter((fk) => fk.fromTable === name);
        const newFks = newSchema.foreignKeys.filter((fk) => fk.fromTable === name);
        const fkKey = (fk: { fromColumn: string; toTable: string; toColumn: string }) =>
            `${fk.fromColumn}->${fk.toTable}.${fk.toColumn}`;

        const oldFkSet = new Set(oldFks.map(fkKey));
        const newFkSet = new Set(newFks.map(fkKey));

        // FKs removed
        for (const fk of oldFks) {
            if (!newFkSet.has(fkKey(fk))) {
                tableLines.push(`ALTER TABLE \`${name}\` DROP FOREIGN KEY \`fk_${fk.fromTable}_${fk.fromColumn}\`;`);
            }
        }

        // FKs added
        for (const fk of newFks) {
            if (!oldFkSet.has(fkKey(fk))) {
                tableLines.push(
                    `ALTER TABLE \`${name}\` ADD CONSTRAINT \`fk_${fk.fromTable}_${fk.fromColumn}\` FOREIGN KEY (\`${fk.fromColumn}\`) REFERENCES \`${fk.toTable}\` (\`${fk.toColumn}\`);`
                );
            }
        }

        if (tableLines.length > 0) {
            lines.push('');
            lines.push(`-- Table: ${name}`);
            lines.push(...tableLines);
        }
    }

    const result = lines.join('\n');
    return result.trim() === '-- Migration: ALTER TABLE Statements' ||
        result.endsWith('Generated: ' + new Date().toISOString())
        ? '-- No changes detected between the two schemas.'
        : result;
}

// Generate DBML (Database Markup Language) from schema
export function generateDBML(schema: SqlSchema): string {
    if (schema.tables.length === 0) return '// No tables defined';

    const lines: string[] = [];
    lines.push('// DBML Export from SQL Diagram');
    lines.push(`// Generated: ${new Date().toISOString()}`);
    lines.push('');

    schema.tables.forEach((table, idx) => {
        lines.push(`Table ${table.name} {`);

        table.columns.forEach((col) => {
            const settings: string[] = [];
            if (col.isPrimaryKey) settings.push('primary key');
            if (col.unique && !col.isPrimaryKey) settings.push('unique');
            if (!col.nullable) settings.push('not null');

            const settingStr = settings.length > 0 ? ` [${settings.join(', ')}]` : '';
            lines.push(`  ${col.name} ${col.type}${settingStr}`);
        });

        lines.push('}');
        if (idx < schema.tables.length - 1) lines.push('');
    });

    if (schema.foreignKeys.length > 0) {
        lines.push('');
        lines.push('// Relationships');
    }

    schema.foreignKeys.forEach((fk) => {
        // Assumption: Typically FK signifies Many-to-One
        lines.push(`Ref: ${fk.fromTable}.${fk.fromColumn} > ${fk.toTable}.${fk.toColumn}`);
    });

    return lines.join('\n');
}

// Generate Mermaid.js erDiagram from schema
export function generateMermaidER(schema: SqlSchema): string {
    if (schema.tables.length === 0) return '%% No tables defined\nerDiagram';

    const lines: string[] = [];
    lines.push('erDiagram');

    schema.tables.forEach((table) => {
        lines.push(`    ${table.name} {`);

        table.columns.forEach((col) => {
            const keyStr = col.isPrimaryKey ? ' PK' : col.isForeignKey ? ' FK' : '';
            // Mermaid types shouldn't contain spaces to avoid syntax errors, replace spaces with underscores
            const safeType = col.type.replace(/\s+/g, '_');
            lines.push(`        ${safeType} ${col.name}${keyStr}`);
        });

        lines.push(`    }`);
    });

    if (schema.foreignKeys.length > 0) {
        lines.push('');
    }

    schema.foreignKeys.forEach((fk) => {
        // Mermaid format: A ||--o{ B : "comments"
        // Target (One) ||--o{ Source (Many)
        lines.push(`    ${fk.toTable} ||--o{ ${fk.fromTable} : "fk_${fk.fromColumn}"`);
    });

    return lines.join('\n');
}

// Trigger browser download of the generated SQL as a .sql file
export function downloadSqlFile(schema: SqlSchema, filename = 'schema.sql'): void {
    const sql = generateSql(schema);
    const blob = new Blob([sql], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    // Cleanup blob URL after download
    URL.revokeObjectURL(url);
}
