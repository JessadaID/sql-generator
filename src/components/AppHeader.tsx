import type { Theme, BackgroundType } from '../types/theme';
import { BTN_ACTIVE, BTN_BASE, BTN_INACTIVE, DIVIDER, TEXT_HEADING } from '../constants/themeStyles';

interface AppHeaderProps {
    theme: Theme;
    bgType: BackgroundType;
    isSidebarOpen: boolean;
    isAiOpen: boolean;
    onToggleSidebar: () => void;
    onToggleAi: () => void;
    onSetTheme: (t: Theme) => void;
    onSetBgType: (b: BackgroundType) => void;
}

// Legend item with colored dot
const LegendItem = ({
    dotClass,
    textClass,
    children,
}: {
    dotClass: string;
    textClass: string;
    children: React.ReactNode;
}) => (
    <div className={`flex items-center gap-1.5 ${textClass}`}>
        <span className={`rounded-full inline-block ${dotClass}`} />
        {children}
    </div>
);

// Switcher group label
const SwitcherLabel = ({ theme, children }: { theme: Theme; children: React.ReactNode }) => (
    <span className={`text-[10px] uppercase font-bold tracking-wider mr-1 opacity-60 ${TEXT_HEADING[theme]}`}>
        {children}
    </span>
);

const HEADER_STYLES: Record<Theme, string> = {
    dark: 'bg-slate-900 border-slate-700/60',
    light: 'bg-white border-slate-200 shadow-sm',
};

const LOGO_COLORS: Record<Theme, string> = {
    dark: 'bg-indigo-600',
    light: 'bg-indigo-500 shadow-md shadow-indigo-200',
};

const LEGEND_STYLES = {
    pk: { dark: 'text-amber-400', light: 'text-amber-600' },
    fk: { dark: 'text-indigo-400', light: 'text-indigo-600' },
    nn: { dark: 'text-rose-400', light: 'text-rose-600' },
    nnDot: { dark: 'bg-rose-400 w-1.5 h-1.5', light: 'bg-rose-500 w-1.5 h-1.5' },
    pkDot: { dark: 'bg-amber-400 w-2 h-2', light: 'bg-amber-500 w-2 h-2' },
    fkDot: { dark: 'bg-indigo-400 w-2 h-2', light: 'bg-indigo-500 w-2 h-2' },
    desc: { dark: 'text-slate-400', light: 'text-slate-500' },
};

export default function AppHeader({
    theme,
    bgType,
    isAiOpen,
    onToggleSidebar,
    onToggleAi,
    onSetTheme,
    onSetBgType,
}: AppHeaderProps) {
    const btnClass = (active: boolean) =>
        `${BTN_BASE} ${active ? BTN_ACTIVE[theme] : BTN_INACTIVE[theme]}`;

    return (
        <header
            className={`flex items-center gap-4 px-6 py-3 transition-colors duration-300 border-b shrink-0 z-30 ${HEADER_STYLES[theme]}`}
        >
            {/* Toggle Sidebar & Logo */}
            <div className="flex items-center gap-3">
                <button
                    onClick={onToggleSidebar}
                    className={`p-1.5 -ml-2 rounded-lg transition-colors ${theme === 'dark'
                        ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                        : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'
                        }`}
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>

                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${LOGO_COLORS[theme]}`}>
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                        />
                    </svg>
                </div>
                <span className={`font-bold text-base tracking-tight ${TEXT_HEADING[theme]}`}>SQL Diagram</span>
            </div>

            {/* Divider */}
            <div className={`h-6 w-px mx-1 ${DIVIDER[theme]}`} />

            {/* Legend */}
            <div className="flex items-center gap-5 text-xs font-medium">
                <LegendItem dotClass={LEGEND_STYLES.pkDot[theme]} textClass={LEGEND_STYLES.pk[theme]}>
                    Primary Key
                </LegendItem>
                <LegendItem dotClass={LEGEND_STYLES.fkDot[theme]} textClass={LEGEND_STYLES.fk[theme]}>
                    Foreign Key
                </LegendItem>
                <LegendItem dotClass={LEGEND_STYLES.nnDot[theme]} textClass={LEGEND_STYLES.nn[theme]}>
                    NN = Not Null
                    <span className={LEGEND_STYLES.desc[theme]}>
                        <span className="mx-1 opacity-50">·</span> UQ = Unique
                    </span>
                </LegendItem>
            </div>

            <div className="flex-1" />

            {/* Background Pattern Switcher */}
            <div className="flex items-center gap-1.5">
                <SwitcherLabel theme={theme}>Pattern</SwitcherLabel>
                {(['dots', 'lines'] as BackgroundType[]).map((b) => (
                    <button key={b} onClick={() => onSetBgType(b)} className={`${btnClass(bgType === b)} capitalize`}>
                        {b}
                    </button>
                ))}
            </div>

            {/* Divider */}
            <div className={`h-6 w-px mx-2 ${DIVIDER[theme]}`} />

            {/* Theme Switcher */}
            <div className="flex items-center gap-1.5">
                <SwitcherLabel theme={theme}>Theme</SwitcherLabel>
                {(['dark', 'light'] as Theme[]).map((t) => (
                    <button key={t} onClick={() => onSetTheme(t)} className={`${btnClass(theme === t)} capitalize`}>
                        {t}
                    </button>
                ))}
            </div>

            {/* Divider */}
            <div className={`h-6 w-px mx-2 ${DIVIDER[theme]}`} />

            {/* AI Assistant toggle button */}
            <button
                onClick={onToggleAi}
                title={isAiOpen ? 'ปิด AI Assistant' : 'เปิด AI Assistant'}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${isAiOpen
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                    : theme === 'dark'
                        ? 'bg-slate-800 text-slate-300 hover:bg-indigo-600/20 hover:text-indigo-300'
                        : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
                    }`}
            >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4z" />
                </svg>
                AI
            </button>
        </header>
    );
}
