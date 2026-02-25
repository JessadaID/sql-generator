import { useState } from 'react';
import type { Theme } from '../types/theme';
import type { SqlSchema } from '../types/schema';
import { generateSql, downloadSqlFile } from '../utils/sqlExporter';
import { toast } from 'sonner';
import type { ExportFormat } from '../utils/imageExporter';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    schema: SqlSchema;
    theme: Theme;
    onCaptureImage: (format: ExportFormat, backgroundColor?: string) => Promise<void>;
}

const MODAL_STYLES = {
    overlay: { dark: 'bg-slate-950/80', light: 'bg-slate-900/40' },
    modal: { dark: 'bg-slate-900 border-slate-700 text-slate-200', light: 'bg-white border-slate-200 text-slate-800' },
    divider: { dark: 'border-slate-800', light: 'border-slate-100' },
    code: { dark: 'bg-slate-950 border-slate-700 text-emerald-300', light: 'bg-slate-50 border-slate-300 text-emerald-700' },
    copyBtn: { dark: 'bg-slate-700 hover:bg-slate-600 text-slate-200', light: 'bg-slate-200 hover:bg-slate-300 text-slate-700' },
    tab: {
        active: { dark: 'border-indigo-500 text-indigo-400', light: 'border-indigo-500 text-indigo-600' },
        inactive: { dark: 'border-transparent text-slate-500 hover:text-slate-300', light: 'border-transparent text-slate-400 hover:text-slate-700' },
    },
    imgCard: { dark: 'bg-slate-800 border-slate-700 hover:border-indigo-500', light: 'bg-slate-50 border-slate-200 hover:border-indigo-400' },
};

// Background color presets for image export (empty string = transparent for PNG)
const BG_PRESETS = [
    { label: 'Transparent', value: '' },
    { label: 'Dark', value: '#0f172a' },
    { label: 'Slate', value: '#1e293b' },
    { label: 'White', value: '#ffffff' },
    { label: 'Light Gray', value: '#f1f5f9' },
];

type TabType = 'sql' | 'image';
type ImageFormat = 'png' | 'jpg' | 'pdf';

// Default bg per format: PNG = transparent, others = dark
const DEFAULT_BG: Record<ImageFormat, string> = {
    png: '',
    jpg: '#0f172a',
    pdf: '#0f172a',
};
export default function ExportModal({ isOpen, onClose, schema, theme, onCaptureImage }: ExportModalProps) {
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('sql');
    const [selectedFormat, setSelectedFormat] = useState<ImageFormat>('png');
    const [selectedBg, setSelectedBg] = useState(''); // empty = transparent (PNG only)
    const [isExporting, setIsExporting] = useState(false);

    if (!isOpen) return null;

    const sql = generateSql(schema);
    const s = {
        overlay: MODAL_STYLES.overlay[theme],
        modal: MODAL_STYLES.modal[theme],
        divider: MODAL_STYLES.divider[theme],
        code: MODAL_STYLES.code[theme],
        copyBtn: MODAL_STYLES.copyBtn[theme],
    };

    const tabActive = (t: TabType) =>
        activeTab === t ? MODAL_STYLES.tab.active[theme] : MODAL_STYLES.tab.inactive[theme];

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(sql);
            setCopied(true);
            toast.success('คัดลอก SQL เรียบร้อยแล้ว');
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback copy via execCommand
            const el = document.createElement('textarea');
            el.value = sql;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            setCopied(true);
            toast.success('คัดลอก SQL เรียบร้อยแล้ว');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDownloadSql = () => downloadSqlFile(schema);

    const handleExportImage = async () => {
        setIsExporting(true);
        // Treat empty string as transparent (undefined) for PNG
        const bg = selectedBg || undefined;
        try {
            await onCaptureImage(selectedFormat, bg);
            onClose();
        } catch (err) {
            console.error('Export image error:', err);
            toast.error('ไม่สามารถ export ได้ กรุณาตรวจสอบว่า diagram มีตารางอยู่');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm ${s.overlay}`}>
            <div className={`w-full max-w-3xl border shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[85vh] ${s.modal}`}>

                {/* Header */}
                <div className={`flex items-center justify-between px-6 py-4 border-b shrink-0 ${s.divider}`}>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-600/20 flex items-center justify-center">
                            <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        </div>
                        <h2 className="text-base font-bold tracking-tight">Export</h2>
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

                {/* Tabs */}
                <div className={`flex border-b shrink-0 ${s.divider}`}>
                    <button
                        onClick={() => setActiveTab('sql')}
                        className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${tabActive('sql')}`}
                    >
                        SQL Code
                    </button>
                    <button
                        onClick={() => setActiveTab('image')}
                        className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${tabActive('image')}`}
                    >
                        Image / PDF
                    </button>
                </div>

                {/* SQL Tab */}
                {activeTab === 'sql' && (
                    <>
                        <div className="flex-1 overflow-hidden flex flex-col p-6 gap-3 min-h-0">
                            <div className="flex items-center justify-between shrink-0">
                                <span className="text-xs font-mono opacity-50">schema.sql · {schema.tables.length} tables · {sql.split('\n').length} lines</span>
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
                            <div className={`flex-1 overflow-auto rounded-xl border ${s.code}`}>
                                <pre className="p-5 text-xs font-mono leading-relaxed whitespace-pre min-w-max">{sql}</pre>
                            </div>
                        </div>
                        <div className={`flex items-center justify-end gap-3 px-6 py-4 border-t bg-black/5 shrink-0 ${s.divider}`}>
                            <button
                                onClick={onClose}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`}
                            >
                                Close
                            </button>
                            <button
                                onClick={handleDownloadSql}
                                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-md hover:shadow-lg transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download .sql
                            </button>
                        </div>
                    </>
                )}

                {/* Image Tab */}
                {activeTab === 'image' && (
                    <>
                        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">

                            {/* Format selector */}
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider opacity-50 mb-3">Format</p>
                                <div className="grid grid-cols-3 gap-3">
                                    {(['png', 'jpg', 'pdf'] as ImageFormat[]).map((fmt) => (
                                        <button
                                            key={fmt}
                                            onClick={() => {
                                                setSelectedFormat(fmt);
                                                // Reset background to format default when switching
                                                setSelectedBg(DEFAULT_BG[fmt]);
                                            }}
                                            className={`flex flex-col items-center justify-center gap-2 py-4 rounded-xl border text-sm font-semibold transition-all ${selectedFormat === fmt
                                                ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                                                : MODAL_STYLES.imgCard[theme]
                                                }`}
                                        >
                                            {/* Format icon */}
                                            <svg className="w-6 h-6 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                {fmt === 'pdf' ? (
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                ) : (
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                )}
                                            </svg>
                                            {fmt.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Background color selector (only relevant for image formats) */}
                            {selectedFormat !== 'pdf' && (
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider opacity-50 mb-3">Background Color</p>
                                    <div className="flex gap-2 flex-wrap">
                                        {/* Transparent only available for PNG */}
                                        {BG_PRESETS.filter(p => p.value !== '' || selectedFormat === 'png').map((preset) => (
                                            <button
                                                key={preset.value}
                                                onClick={() => setSelectedBg(preset.value)}
                                                title={preset.label}
                                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${selectedBg === preset.value
                                                    ? 'border-indigo-500 ring-1 ring-indigo-500'
                                                    : theme === 'dark' ? 'border-slate-700' : 'border-slate-200'
                                                    }`}
                                            >
                                                {/* Color swatch */}
                                                <span
                                                    className="w-3.5 h-3.5 rounded-sm border border-white/20 shrink-0"
                                                    style={{ backgroundColor: preset.value }}
                                                />
                                                {preset.label}
                                            </button>
                                        ))}
                                        {/* Custom color input */}
                                        <label className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-all ${theme === 'dark' ? 'border-slate-700 hover:border-slate-500' : 'border-slate-200 hover:border-slate-400'}`}>
                                            <input
                                                type="color"
                                                value={selectedBg}
                                                onChange={(e) => setSelectedBg(e.target.value)}
                                                className="w-3.5 h-3.5 rounded-sm cursor-pointer border-0 bg-transparent p-0"
                                            />
                                            Custom
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* Info note */}
                            <div className={`rounded-lg px-4 py-3 text-xs leading-relaxed opacity-70 ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                The full diagram will be captured automatically — all tables will be included regardless of current zoom or scroll position.
                            </div>
                        </div>

                        {/* Footer */}
                        <div className={`flex items-center justify-end gap-3 px-6 py-4 border-t bg-black/5 shrink-0 ${s.divider}`}>
                            <button
                                onClick={onClose}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`}
                            >
                                Close
                            </button>
                            <button
                                onClick={handleExportImage}
                                disabled={isExporting}
                                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-md hover:shadow-lg transition-all"
                            >
                                {isExporting ? (
                                    <>
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                        </svg>
                                        Exporting...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Download {selectedFormat.toUpperCase()}
                                    </>
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
