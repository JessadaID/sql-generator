import { useState } from 'react';
import type { Theme } from '../types/theme';

interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (sql: string) => void;
    theme: Theme;
}

export default function ImportModal({ isOpen, onClose, onImport, theme }: ImportModalProps) {
    const [sql, setSql] = useState('');

    if (!isOpen) return null;

    const overlayBg = theme === 'dark' ? 'bg-slate-950/80' : 'bg-slate-900/40';
    const modalBg = theme === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800';
    const headerBorder = theme === 'dark' ? 'border-slate-800' : 'border-slate-100';
    const textAreaColor = theme === 'dark' ? 'bg-slate-950 border-slate-700 text-slate-300 placeholder:text-slate-600' : 'bg-slate-50 border-slate-300 text-slate-700 placeholder:text-slate-400';

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm ${overlayBg}`}>
            <div className={`w-full max-w-3xl border shadow-2xl rounded-2xl overflow-hidden flex flex-col ${modalBg}`}>
                <div className={`flex items-center justify-between px-6 py-4 border-b ${headerBorder}`}>
                    <h2 className="text-lg font-bold tracking-tight">Import SQL Code</h2>
                    <button onClick={onClose} className="p-1.5 rounded-md opacity-60 hover:opacity-100 hover:bg-slate-500/10 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="p-6">
                    <textarea
                        className={`w-full h-80 p-4 font-mono text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none ${textAreaColor}`}
                        placeholder="Paste your CREATE TABLE statements here..."
                        value={sql}
                        onChange={(e) => setSql(e.target.value)}
                    />
                </div>
                <div className={`flex items-center justify-end gap-3 px-6 py-4 border-t bg-black/5 ${headerBorder}`}>
                    <button
                        onClick={onClose}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            if (sql.trim()) {
                                onImport(sql);
                                setSql('');
                            }
                        }}
                        className="px-5 py-2 text-sm font-semibold text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg shadow-md hover:shadow-lg transition-all"
                    >
                        Generate Diagram
                    </button>
                </div>
            </div>
        </div>
    );
}
