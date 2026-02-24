import type { Theme } from '../types/theme';

interface SidebarProps {
    isOpen: boolean;
    theme: Theme;
    onImportClick: () => void;
}

export default function Sidebar({ isOpen, theme, onImportClick }: SidebarProps) {
    const bg = theme === 'dark' ? 'bg-slate-900 border-slate-700/60' : 'bg-white border-slate-200';
    const text = theme === 'dark' ? 'text-slate-300' : 'text-slate-700';
    const hover = theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-100';

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
                    <button
                        onClick={onImportClick}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left ${hover}`}
                    >
                        <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Import SQL Code
                    </button>
                </div>
            </div>
        </div>
    );
}
