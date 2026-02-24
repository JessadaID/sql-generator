import { useState } from 'react';
import SqlDiagram from './components/SqlDiagram';
import { sampleSchema } from './data/sampleSchema';
import type { Theme, BackgroundType } from './types/theme';

function App() {
  const [theme, setTheme] = useState<Theme>('dark');
  const [bgType, setBgType] = useState<BackgroundType>('dots');

  // UI Colors matching theme
  const appStyles = {
    dark: 'bg-slate-950 text-slate-300 border-slate-700/60',
    light: 'bg-slate-50 text-slate-600 border-slate-200',
  };

  const headerStyles = {
    dark: 'bg-slate-900 border-slate-700/60',
    light: 'bg-white border-slate-200 shadow-sm',
  };

  const textHeadingStyles = {
    dark: 'text-white',
    light: 'text-slate-800',
  };

  // Switcher styling
  const btnBase = "px-3 py-1.5 text-xs font-semibold rounded-md transition-colors border";
  const btnActive = {
    dark: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    light: "bg-indigo-50 text-indigo-600 border-indigo-200",
  };
  const btnInactive = {
    dark: "bg-transparent text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-slate-200",
    light: "bg-transparent text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-800",
  };

  // Logo icon specific
  const logoColors = {
    dark: "bg-indigo-600",
    light: "bg-indigo-500 shadow-md shadow-indigo-200",
  };

  // Legend colors
  const legendPk = { dark: 'text-amber-400', light: 'text-amber-600' };
  const legendFk = { dark: 'text-indigo-400', light: 'text-indigo-600' };
  const legendNn = { dark: 'text-rose-400', light: 'text-slate-500' };
  const legendNnDot = { dark: 'bg-rose-400', light: 'bg-slate-400' };
  const legendTextDesc = { dark: 'text-slate-400', light: 'text-slate-500' };

  return (
    <div className={`w-screen h-screen flex flex-col transition-colors duration-300 ${appStyles[theme]}`}>
      {/* Top bar */}
      <header className={`flex items-center gap-4 px-6 py-3 transition-colors duration-300 border-b shrink-0 z-10 ${headerStyles[theme]}`}>
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${logoColors[theme]}`}>
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
          </div>
          <span className={`font-bold text-base tracking-tight ${textHeadingStyles[theme]}`}>
            SQL Diagram
          </span>
        </div>

        {/* Vertical divider */}
        <div className={`h-6 w-px mx-1 ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'}`} />

        {/* Legend */}
        <div className="flex items-center gap-5 text-xs font-medium">
          <div className={`flex items-center gap-1.5 ${legendPk[theme]}`}>
            <span className={`w-2 h-2 rounded-full inline-block ${theme === 'dark' ? 'bg-amber-400' : 'bg-amber-500'}`} />
            Primary Key
          </div>
          <div className={`flex items-center gap-1.5 ${legendFk[theme]}`}>
            <span className={`w-2 h-2 rounded-full inline-block ${theme === 'dark' ? 'bg-indigo-400' : 'bg-indigo-500'}`} />
            Foreign Key
          </div>
          <div className={`flex items-center gap-1.5 ${legendNn[theme]}`}>
            <span className={`w-1.5 h-1.5 rounded-full inline-block ${legendNnDot[theme]}`} />
            <span className={legendTextDesc[theme]}>
              NN = Not Null <span className="mx-1 opacity-50">·</span> UQ = Unique
            </span>
          </div>
        </div>

        <div className="flex-1" />

        {/* Background Pattern Switcher */}
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] uppercase font-bold tracking-wider mr-1 opacity-60 ${textHeadingStyles[theme]}`}>Pattern</span>
          <button
            onClick={() => setBgType('dots')}
            className={`${btnBase} ${bgType === 'dots' ? btnActive[theme] : btnInactive[theme]}`}
          >
            Dots
          </button>
          <button
            onClick={() => setBgType('lines')}
            className={`${btnBase} ${bgType === 'lines' ? btnActive[theme] : btnInactive[theme]}`}
          >
            Lines
          </button>
        </div>

        {/* Vertical divider */}
        <div className={`h-6 w-px mx-2 ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'}`} />

        {/* Theme Switcher */}
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] uppercase font-bold tracking-wider mr-1 opacity-60 ${textHeadingStyles[theme]}`}>Theme</span>
          {(['dark', 'light'] as Theme[]).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`${btnBase} capitalize ${theme === t ? btnActive[theme] : btnInactive[theme]}`}
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      {/* Diagram canvas */}
      <main className="flex-1 overflow-hidden">
        <SqlDiagram schema={sampleSchema} theme={theme} bgType={bgType} />
      </main>
    </div>
  );
}

export default App;
