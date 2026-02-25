import Groq from 'groq-sdk';
import type { SqlSchema } from '../types/schema';

// Initialize Groq client with API key from environment variable
const groq = new Groq({
    apiKey: import.meta.env.VITE_GROQ_API_KEY,
    dangerouslyAllowBrowser: true,
});

// Build a text representation of the current schema for AI context
function buildSchemaContext(schema: SqlSchema): string {
    if (schema.tables.length === 0) return 'No tables defined yet.';

    const tableDescriptions = schema.tables.map((table) => {
        const columns = table.columns
            .map((col) => {
                const flags: string[] = [];
                if (col.isPrimaryKey) flags.push('PRIMARY KEY');
                if (col.isForeignKey) flags.push('FOREIGN KEY');
                if (!col.nullable) flags.push('NOT NULL');
                if (col.unique) flags.push('UNIQUE');
                return `  - ${col.name} ${col.type}${flags.length ? ' (' + flags.join(', ') + ')' : ''}`;
            })
            .join('\n');
        return `Table: ${table.name}\n${columns}`;
    });

    const foreignKeyDescriptions = schema.foreignKeys.map(
        (fk) => `  ${fk.fromTable}.${fk.fromColumn} → ${fk.toTable}.${fk.toColumn}`
    );

    let context = `Current Database Schema:\n\n${tableDescriptions.join('\n\n')}`;
    if (foreignKeyDescriptions.length > 0) {
        context += `\n\nForeign Key Relationships:\n${foreignKeyDescriptions.join('\n')}`;
    }
    return context;
}

// System prompt instructing AI to act as a SQL schema advisor
const SYSTEM_PROMPT = (schemaContext: string) => `
You are an expert SQL database architect and advisor. You help users design and improve their database schemas.

${schemaContext}

Guidelines:
- Always provide practical, well-structured SQL code when recommending table structures
- When suggesting new tables, include appropriate primary keys, foreign keys, indexes, and constraints
- Explain your design decisions briefly
- Format SQL code in standard SQL (compatible with MySQL/PostgreSQL)
- When you provide SQL CREATE TABLE statements, wrap them in a markdown code block with \`\`\`sql tag
- When the user asks to ADD, DROP, MODIFY, or RENAME a column/table, or add/remove a foreign key or primary key, generate ALTER TABLE statements wrapped in a \`\`\`sql block
- You CAN generate ALTER TABLE statements for: ADD COLUMN, DROP COLUMN, MODIFY COLUMN, RENAME COLUMN, RENAME TO, ADD CONSTRAINT (FOREIGN KEY / PRIMARY KEY), DROP FOREIGN KEY, DROP CONSTRAINT
- Be concise but thorough
- Respond in the same language the user writes in (Thai or English)
`.trim();


export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

// Send messages to Groq and get AI response
export async function chatWithGroq(
    messages: ChatMessage[],
    schema: SqlSchema
): Promise<string> {
    const schemaContext = buildSchemaContext(schema);

    const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
            { role: 'system', content: SYSTEM_PROMPT(schemaContext) },
            ...messages,
        ],
        temperature: 0.7,
        max_tokens: 2048,
    });

    return completion.choices[0]?.message?.content ?? 'No response from AI.';
}
