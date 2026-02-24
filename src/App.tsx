import { useState } from 'react';
import SqlDiagram from './components/SqlDiagram';
import Sidebar from './components/Sidebar';
import ImportModal from './components/ImportModal';
import AppHeader from './components/AppHeader';
import { sampleSchema } from './data/sampleSchema';
import type { Theme, BackgroundType } from './types/theme';
import type { ForeignKey, SqlSchema } from './types/schema';
import { parseSqlToSchema } from './utils/sqlParser';

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [schema, setSchema] = useState<SqlSchema>(sampleSchema);

  const handleImportSql = (sql: string) => {
    try {
      const newSchema = parseSqlToSchema(sql);
      if (newSchema.tables.length === 0) {
        alert('No tables found in the provided SQL. Please check your syntax.');
        return;
      }
      setSchema((prev) => mergeSchemas(prev, newSchema));
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Failed to parse SQL.');
    }
  };

  const handleTableDelete = (deletedIds: Set<string>) => {
    setSchema((prev) => ({
      // Remove deleted tables from schema
      tables: prev.tables.filter((t) => !deletedIds.has(t.id)),
      // Remove foreign keys that reference deleted tables
      foreignKeys: prev.foreignKeys.filter(
        (fk) => !deletedIds.has(fk.fromTable) && !deletedIds.has(fk.toTable)
      ),
    }));
  };

  return (
    <div className={`w-screen h-screen flex flex-col transition-colors duration-300 ${APP_STYLES[theme]}`}>
      <AppHeader
        theme={theme}
        bgType={bgType}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
        onSetTheme={setTheme}
        onSetBgType={setBgType}
      />

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex flex-row relative">
        <Sidebar isOpen={isSidebarOpen} theme={theme} onImportClick={() => setIsModalOpen(true)} />

        {/* Diagram canvas */}
        <main className="flex-1 h-full overflow-hidden">
          <SqlDiagram schema={schema} theme={theme} bgType={bgType} onTableDelete={handleTableDelete} />
        </main>
      </div>

      <ImportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onImport={handleImportSql}
        theme={theme}
      />
    </div>
  );
}

export default App;
