import type { Theme } from '../types/theme';

interface SidebarProps {
    isOpen: boolean;
    theme: Theme;
    onImportClick: () => void;
    onExportClick: () => void;
    onClearClick: () => void;
}

export default function Sidebar({ isOpen, theme, onImportClick, onExportClick, onClearClick }: SidebarProps) {
    const bg = theme === 'dark' ? 'bg-slate-900 border-slate-700/60' : 'bg-white border-slate-200';
    const text = theme === 'dark' ? 'text-slate-300' : 'text-slate-700';
    const hover = theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-100';
    const exportHover = theme === 'dark' ? 'hover:bg-emerald-600/10 hover:text-emerald-400' : 'hover:bg-emerald-50 hover:text-emerald-700';
    const clearHover = theme === 'dark' ? 'hover:bg-rose-600/10 hover:text-rose-400 text-slate-500' : 'hover:bg-rose-50 hover:text-rose-600 text-slate-400';

    return (
        <div
            className={`border-r flex flex-col transition-all duration-300 overflow-hidden z-20 shrink-0 shadow-lg ${bg} ${text}`}
            style={{ width: isOpen ? 240 : 0, minWidth: isOpen ? 240 : 0 }}
        >
            <div className="p-4 w-[240px]">
                <div className="uppercase text-[10px] font-bold tracking-wider opacity-60 mb-2 px-1">
                    Menu
                </div>
                <div className="flex flex-col gap-1">
                    {/* Import SQL button */}
                    <button
                        onClick={onImportClick}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left ${hover}`}
                    >
                        <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Import SQL Code
                    </button>

                    {/* Export SQL button */}
                    <button
                        onClick={onExportClick}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left ${exportHover}`}
                    >
                        <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export SQL Code
                    </button>

                    {/* Divider */}
                    <div className={`my-1 h-px ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`} />

                    {/* Clear all tables button */}
                    <button
                        onClick={onClearClick}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left ${clearHover}`}
                    >
                        <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Clear All Tables
                    </button>
                </div>
            </div>
        </div>
    );
}
