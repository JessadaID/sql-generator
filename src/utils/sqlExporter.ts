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
