import type { Theme } from '../types/theme';

// --- Shared theme token maps ---

export const DIVIDER: Record<Theme, string> = {
    dark: 'bg-slate-700',
    light: 'bg-slate-200',
};

export const TEXT_HEADING: Record<Theme, string> = {
    dark: 'text-white',
    light: 'text-slate-800',
};

export const BTN_BASE = 'px-3 py-1.5 text-xs font-semibold rounded-md transition-colors border';

export const BTN_ACTIVE: Record<Theme, string> = {
    dark: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    light: 'bg-indigo-50 text-indigo-600 border-indigo-200',
};

export const BTN_INACTIVE: Record<Theme, string> = {
    dark: 'bg-transparent text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-slate-200',
    light: 'bg-transparent text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-800',
};
