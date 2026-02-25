import { useRef, useState } from 'react';
import SqlDiagram, { type SqlDiagramHandle } from './components/SqlDiagram';
import Sidebar from './components/Sidebar';
import AiChatSidebar from './components/AiChatSidebar';
import ImportModal from './components/ImportModal';
import ExportModal from './components/ExportModal';
import AppHeader from './components/AppHeader';
import { sampleSchema } from './data/sampleSchema';
import type { Theme, BackgroundType } from './types/theme';
import type { ForeignKey, SqlSchema } from './types/schema';
import type { ExportFormat } from './utils/imageExporter';
import { parseSqlToSchema, applyAlterStatements } from './utils/sqlParser';

// Generate a unique key for deduplicating foreign keys
const fkKey = (fk: ForeignKey) => `${fk.fromTable}.${fk.fromColumn}->${fk.toTable}.${fk.toColumn}`;

// Merge an incoming schema into the existing one, skipping duplicates
function mergeSchemas(prev: SqlSchema, incoming: SqlSchema): SqlSchema {
  const existingTableIds = new Set(prev.tables.map((t) => t.id));
  const existingFkKeys = new Set(prev.foreignKeys.map(fkKey));

  return {
    tables: [...prev.tables, ...incoming.tables.filter((t) => !existingTableIds.has(t.id))],
    foreignKeys: [...prev.foreignKeys, ...incoming.foreignKeys.filter((fk) => !existingFkKeys.has(fkKey(fk)))],
  };
}

const APP_STYLES: Record<Theme, string> = {
  dark: 'bg-slate-950 text-slate-300 border-slate-700/60',
  light: 'bg-slate-50 text-slate-600 border-slate-200',
};

function App() {
  const [theme, setTheme] = useState<Theme>('dark');
  const [bgType, setBgType] = useState<BackgroundType>('dots');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [schema, setSchema] = useState<SqlSchema>(sampleSchema);
  const diagramRef = useRef<SqlDiagramHandle>(null);

  // Capture the diagram image via the ref exposed by SqlDiagram
  const handleCaptureImage = (format: ExportFormat, bg?: string) =>
    diagramRef.current?.captureImage(format, bg) ?? Promise.reject(new Error('Diagram not ready'));

  const handleImportSql = (sql: string) => {
    try {
      // Detect SQL statement types
      const hasAlter = /^\s*ALTER\s+TABLE/im.test(sql);
      const hasCreate = /^\s*CREATE\s+TABLE/im.test(sql);
      const hasDrop = /^\s*DROP\s+TABLE/im.test(sql);

      if (hasDrop && !hasCreate && !hasAlter) {
        // Pure DROP TABLE — extract table names and remove from schema
        const dropMatches = [...sql.matchAll(/DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?([a-zA-Z0-9_`"'.]+)/gi)];
        const dropIds = new Set(dropMatches.map((m) => m[1].replace(/[`"']/g, '').split('.').pop() ?? ''));
        if (dropIds.size > 0) handleTableDelete(dropIds);
        setIsModalOpen(false);
      } else if (hasAlter && !hasCreate) {
        // Pure ALTER TABLE — apply to existing schema
        const newSchema = applyAlterStatements(schema, sql);
        setSchema(newSchema);
        setIsModalOpen(false);
      } else if (hasAlter && hasCreate) {
        // Mixed: apply CREATE TABLE first, then ALTER TABLE on top
        const created = parseSqlToSchema(sql);
        const merged = mergeSchemas(schema, created);
        const altered = applyAlterStatements(merged, sql);
        setSchema(altered);
        setIsModalOpen(false);
      } else {
        // Pure CREATE TABLE
        const newSchema = parseSqlToSchema(sql);
        if (newSchema.tables.length === 0) {
          alert('No tables found in the provided SQL. Please check your syntax.');
          return;
        }
        setSchema((prev) => mergeSchemas(prev, newSchema));
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to parse SQL.');
    }
  };

  const handleTableDelete = (deletedIds: Set<string>) => {
    // 1. Check for foreign key constraints before deleting
    for (const fk of schema.foreignKeys) {
      // If the target table is being deleted, BUT the source table is NOT being deleted
      // -> This violates the constraint, just like in a real database.
      if (deletedIds.has(fk.toTable) && !deletedIds.has(fk.fromTable)) {
        alert(
          `Cannot drop table '${fk.toTable}' referenced by a foreign key constraint from table '${fk.fromTable}'.\n\nYou must drop the foreign key or table '${fk.fromTable}' first.`
        );
        return; // Block the deletion entirely
      }
    }

    // 2. Safe to delete
    setSchema((prev) => ({
      // Remove deleted tables from schema
      tables: prev.tables.filter((t) => !deletedIds.has(t.id)),
      // Remove foreign keys that reference or are sourced from deleted tables
      foreignKeys: prev.foreignKeys.filter(
        (fk) => !deletedIds.has(fk.fromTable) && !deletedIds.has(fk.toTable)
      ),
    }));
  };

  const handleClearAll = () => {
    if (window.confirm('ต้องการลบตารางทั้งหมดออกจาก diagram ใช่ไหม?')) {
      setSchema({ tables: [], foreignKeys: [] });
    }
  };

  // Apply ALTER TABLE statements to current schema
  const handleApplyAlter = (newSchema: SqlSchema) => {
    setSchema(newSchema);
  };

  return (
    <div className={`w-screen h-screen flex flex-col transition-colors duration-300 ${APP_STYLES[theme]}`}>
      <AppHeader
        theme={theme}
        bgType={bgType}
        isSidebarOpen={isSidebarOpen}
        isAiOpen={isAiSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
        onToggleAi={() => setIsAiSidebarOpen((open) => !open)}
        onSetTheme={setTheme}
        onSetBgType={setBgType}
      />

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex flex-row relative">
        <Sidebar isOpen={isSidebarOpen} theme={theme} onImportClick={() => setIsModalOpen(true)} onExportClick={() => setIsExportModalOpen(true)} onClearClick={handleClearAll} />

        {/* Diagram canvas */}
        <main className="flex-1 h-full overflow-hidden">
          <SqlDiagram ref={diagramRef} schema={schema} theme={theme} bgType={bgType} onTableDelete={handleTableDelete} />
        </main>

        {/* AI Chat Sidebar (right) */}
        <AiChatSidebar
          isOpen={isAiSidebarOpen}
          schema={schema}
          theme={theme}
          onClose={() => setIsAiSidebarOpen(false)}
          onImportSql={handleImportSql}
          onApplyAlter={handleApplyAlter}
          onDropTable={handleTableDelete}
        />
      </div>

      <ImportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onImport={handleImportSql}
        theme={theme}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        schema={schema}
        theme={theme}
        onCaptureImage={handleCaptureImage}
      />
    </div>
  );
}

export default App;
