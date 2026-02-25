import { useRef, useState } from 'react';
import type { Theme } from '../types/theme';

interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (sql: string) => void;
    theme: Theme;
}

const MODAL_STYLES = {
    overlay: { dark: 'bg-slate-950/80', light: 'bg-slate-900/40' },
    modal: {
        dark: 'bg-slate-900 border-slate-700 text-slate-200',
        light: 'bg-white border-slate-200 text-slate-800',
    },
    divider: { dark: 'border-slate-800', light: 'border-slate-100' },
    textarea: {
        dark: 'bg-slate-950 border-slate-700 text-slate-300 placeholder:text-slate-600',
        light: 'bg-slate-50 border-slate-300 text-slate-700 placeholder:text-slate-400',
    },
    fileBtn: {
        dark: 'border-slate-700 text-slate-400 hover:border-indigo-500 hover:text-indigo-400 hover:bg-indigo-500/10',
        light: 'border-slate-300 text-slate-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50',
    },
    cancelBtn: {
        dark: 'hover:bg-slate-800 text-slate-300',
        light: 'hover:bg-slate-100 text-slate-600',
    },
};

export default function ImportModal({ isOpen, onClose, onImport, theme }: ImportModalProps) {
    const [sql, setSql] = useState('');
    const [fileName, setFileName] = useState<string | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    // Read a .sql file and populate the textarea
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file extension
        if (!file.name.toLowerCase().endsWith('.sql')) {
            setFileError('Please select a valid .sql file.');
            setFileName(null);
            return;
        }

        setFileError(null);
        setFileName(file.name);

        const reader = new FileReader();
        reader.onload = (ev) => {
            const content = ev.target?.result as string;
            setSql(content);
        };
        reader.readAsText(file);

        // Reset input so the same file can be re-selected
        e.target.value = '';
    };

    const handleGenerate = () => {
        if (sql.trim()) {
            onImport(sql);
            setSql('');
            setFileName(null);
        }
    };

    const s = {
        overlay: MODAL_STYLES.overlay[theme],
        modal: MODAL_STYLES.modal[theme],
        divider: MODAL_STYLES.divider[theme],
        textarea: MODAL_STYLES.textarea[theme],
        fileBtn: MODAL_STYLES.fileBtn[theme],
        cancelBtn: MODAL_STYLES.cancelBtn[theme],
    };

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm ${s.overlay}`}>
            <div className={`w-full max-w-3xl border shadow-2xl rounded-2xl overflow-hidden flex flex-col ${s.modal}`}>
                {/* Header */}
                <div className={`flex items-center justify-between px-6 py-4 border-b ${s.divider}`}>
                    <div>
                        <h2 className="text-lg font-bold tracking-tight">Import SQL</h2>
                        <p className="text-xs opacity-50 mt-0.5">รองรับ CREATE TABLE และ ALTER TABLE</p>
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

                {/* Body */}
                <div className="p-6 flex flex-col gap-4">
                    {/* File upload button */}
                    <div className="flex items-center gap-3">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".sql"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${s.fileBtn}`}
                        >
                            {/* Upload icon */}
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            Upload .sql File
                        </button>

                        {/* Selected file name */}
                        {fileName && (
                            <span className="flex items-center gap-1.5 text-xs text-indigo-400 font-medium">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                {fileName}
                            </span>
                        )}

                        {/* File error */}
                        {fileError && (
                            <span className="text-xs text-rose-400 font-medium">{fileError}</span>
                        )}
                    </div>

                    {/* Divider with "or" label */}
                    <div className="flex items-center gap-3">
                        <div className={`flex-1 h-px ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'}`} />
                        <span className={`text-xs font-medium ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                            or paste SQL below
                        </span>
                        <div className={`flex-1 h-px ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'}`} />
                    </div>

                    {/* SQL textarea */}
                    <textarea
                        className={`w-full h-72 p-4 font-mono text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none ${s.textarea}`}
                        placeholder={`-- CREATE TABLE (เพิ่มตารางใหม่)\nCREATE TABLE users (\n  id INT PRIMARY KEY,\n  name VARCHAR(100)\n);\n\n-- หรือ ALTER TABLE (แก้ไขตารางที่มีอยู่)\nALTER TABLE users ADD COLUMN phone VARCHAR(20) NULL;\nALTER TABLE users DROP COLUMN address;`}
                        value={sql}
                        onChange={(e) => setSql(e.target.value)}
                    />
                </div>

                {/* Footer */}
                <div className={`flex items-center justify-end gap-3 px-6 py-4 border-t bg-black/5 ${s.divider}`}>
                    <button
                        onClick={onClose}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${s.cancelBtn}`}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleGenerate}
                        disabled={!sql.trim()}
                        className="px-5 py-2 text-sm font-semibold text-white bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg shadow-md hover:shadow-lg transition-all"
                    >
                        Generate Diagram
                    </button>
                </div>
            </div>
        </div>
    );
}
