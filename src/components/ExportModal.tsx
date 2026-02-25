import { useState } from 'react';
import type { Theme } from '../types/theme';
import type { SqlSchema } from '../types/schema';
import { generateSql, downloadSqlFile } from '../utils/sqlExporter';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    schema: SqlSchema;
    theme: Theme;
}

const MODAL_STYLES = {
    overlay: { dark: 'bg-slate-950/80', light: 'bg-slate-900/40' },
    modal: { dark: 'bg-slate-900 border-slate-700 text-slate-200', light: 'bg-white border-slate-200 text-slate-800' },
    divider: { dark: 'border-slate-800', light: 'border-slate-100' },
    code: { dark: 'bg-slate-950 border-slate-700 text-emerald-300', light: 'bg-slate-50 border-slate-300 text-emerald-700' },
    copyBtn: { dark: 'bg-slate-700 hover:bg-slate-600 text-slate-200', light: 'bg-slate-200 hover:bg-slate-300 text-slate-700' },
};

export default function ExportModal({ isOpen, onClose, schema, theme }: ExportModalProps) {
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const sql = generateSql(schema);
    const s = {
        overlay: MODAL_STYLES.overlay[theme],
        modal: MODAL_STYLES.modal[theme],
        divider: MODAL_STYLES.divider[theme],
        code: MODAL_STYLES.code[theme],
        copyBtn: MODAL_STYLES.copyBtn[theme],
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(sql);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for browsers without clipboard API
            const el = document.createElement('textarea');
            el.value = sql;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDownload = () => {
        downloadSqlFile(schema);
    };

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm ${s.overlay}`}>
            <div className={`w-full max-w-3xl border shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[85vh] ${s.modal}`}>
                {/* Header */}
                <div className={`flex items-center justify-between px-6 py-4 border-b shrink-0 ${s.divider}`}>
                    <div className="flex items-center gap-3">
                        {/* Export icon */}
                        <div className="w-8 h-8 rounded-lg bg-emerald-600/20 flex items-center justify-center">
                            <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-base font-bold tracking-tight">Export SQL</h2>
                            <p className="text-[11px] opacity-50">{schema.tables.length} table{schema.tables.length !== 1 ? 's' : ''} · {sql.split('\n').length} lines</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-md opacity-60 hover:opacity-100 hover:bg-slate-500/10 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* SQL Code preview area */}
                <div className="flex-1 overflow-hidden flex flex-col p-6 gap-3 min-h-0">
                    {/* Toolbar */}
                    <div className="flex items-center justify-between shrink-0">
                        <span className="text-xs font-mono opacity-50">schema.sql</span>
                        {/* Copy button */}
                        <button
                            onClick={handleCopy}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${s.copyBtn}`}
                        >
                            {copied ? (
                                <>
                                    <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    Copy
                                </>
                            )}
                        </button>
                    </div>

                    {/* Code block */}
                    <div className={`flex-1 overflow-auto rounded-xl border ${s.code}`}>
                        <pre className="p-5 text-xs font-mono leading-relaxed whitespace-pre min-w-max">
                            {sql}
                        </pre>
                    </div>
                </div>

                {/* Footer actions */}
                <div className={`flex items-center justify-end gap-3 px-6 py-4 border-t bg-black/5 shrink-0 ${s.divider}`}>
                    <button
                        onClick={onClose}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`}
                    >
                        Close
                    </button>
                    {/* Download .sql file button */}
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-md hover:shadow-lg transition-all"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download .sql
                    </button>
                </div>
            </div>
        </div>
    );
}
