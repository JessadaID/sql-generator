import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { TableSchema, ColumnDef } from '../types/schema';
import type { Theme } from '../types/theme';

export interface TableNodeData extends Record<string, unknown> {
    schema: TableSchema;
    theme?: Theme;
    onDelete?: (tableId: string) => void;
}

interface TableNodeProps {
    data: TableNodeData;
    isConnectable: boolean;
}

// Small badge (PK, FK, NN, UQ)
const Badge = ({ label, colorClass }: { label: string; colorClass: string }) => (
    <span className={`ml-1 text-[9px] font-semibold px-1 py-0.5 rounded uppercase tracking-wide ${colorClass}`}>
        {label}
    </span>
);

// Mono-spaced type label
const TypeBadge = ({ type, fontColorClass }: { type: string; fontColorClass: string }) => (
    <span className={`text-xs font-mono opacity-80 ${fontColorClass}`}>{type}</span>
);

// --- Theme style map ---
const THEME_STYLES = {
    dark: {
        cardBg: 'bg-slate-900 border-slate-700/60 text-slate-200',
        headerBg: 'bg-slate-800',
        headerText: 'text-white',
        rowBase: 'bg-slate-800/40 hover:bg-slate-700/50 border-slate-700/50',
        rowPk: 'bg-amber-950/20 hover:bg-amber-900/30',
        rowFk: 'bg-indigo-950/20 hover:bg-indigo-900/30',
        textNormal: 'text-slate-300',
        textPk: 'text-amber-400/90',
        textFk: 'text-indigo-400/90',
        typeColor: 'text-cyan-400',
        badgePk: 'bg-amber-500/10 text-amber-500',
        badgeFk: 'bg-indigo-500/10 text-indigo-400',
        badgeNn: 'bg-rose-500/10 text-rose-400',
        badgeUq: 'bg-emerald-500/10 text-emerald-500',
        handlePk: '!bg-amber-400 !border-slate-900',
        handleFk: '!bg-indigo-400 !border-slate-900',
    },
    light: {
        cardBg: 'bg-white border-slate-200 text-slate-700 shadow-sm',
        headerBg: 'bg-slate-100 border-b border-slate-200',
        headerText: 'text-slate-800',
        rowBase: 'bg-white hover:bg-slate-50 border-slate-100',
        rowPk: 'bg-amber-50 hover:bg-amber-100/50',
        rowFk: 'bg-indigo-50 hover:bg-indigo-100/50',
        textNormal: 'text-slate-600',
        textPk: 'text-amber-700',
        textFk: 'text-indigo-700',
        typeColor: 'text-slate-500',
        badgePk: 'bg-amber-100 text-amber-700 border border-amber-200',
        badgeFk: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
        badgeNn: 'bg-rose-50 text-rose-600 border border-rose-200',
        badgeUq: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
        handlePk: '!bg-amber-500 !border-white',
        handleFk: '!bg-indigo-500 !border-white',
    },
};

// Derive row background class based on column key type
const getRowBg = (col: ColumnDef, s: typeof THEME_STYLES.dark) => {
    if (col.isPrimaryKey) return s.rowPk;
    if (col.isForeignKey) return s.rowFk;
    return s.rowBase;
};

// Derive column name text color based on column key type
const getTextColor = (col: ColumnDef, s: typeof THEME_STYLES.dark) => {
    if (col.isPrimaryKey) return s.textPk;
    if (col.isForeignKey) return s.textFk;
    return s.textNormal;
};

// SVG key icon for PK columns
const KeyIcon = ({ className }: { className: string }) => (
    <svg className={`w-3.5 h-3.5 shrink-0 ${className}`} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm7-5H5C3.34 4 2 5.34 2 7v10c0 1.66 1.34 3 3 3h14c1.66 0 3-1.34 3-3V7c0-1.66-1.34-3-3-3z" />
    </svg>
);

// SVG link icon for FK columns
const LinkIcon = ({ className }: { className: string }) => (
    <svg className={`w-3.5 h-3.5 shrink-0 ${className}`} fill="currentColor" viewBox="0 0 24 24">
        <path d="M17 7H7C4.24 7 2 9.24 2 12s2.24 5 5 5h10c2.76 0 5-2.24 5-5s-2.24-5-5-5zm0 8H7c-1.66 0-3-1.34-3-3s1.34-3 3-3h10c1.66 0 3 1.34 3 3s-1.34 3-3 3zm-1-3c0 1.1-.9 2-2 2H10c-1.1 0-2-.9-2-2s.9-2 2-2h4c1.1 0 2 .9 2 2z" />
    </svg>
);

const TableNode = ({ data, isConnectable }: TableNodeProps) => {
    const { name, columns } = data.schema as TableSchema;
    const s = THEME_STYLES[data.theme ?? 'dark'];

    return (
        <div className={`min-w-[240px] rounded-xl overflow-hidden shadow-xl border backdrop-blur-sm transition-colors duration-300 group ${s.cardBg}`}>
            {/* Table Header */}
            <div className={`flex items-center gap-2 px-4 py-3 transition-colors duration-300 ${s.headerBg}`}>
                <svg className={`w-4 h-4 shrink-0 opacity-80 ${s.headerText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 6h18M3 14h18M3 18h18" />
                </svg>
                <span className={`font-semibold text-sm tracking-wide flex-1 ${s.headerText}`}>{name}</span>
                {/* Delete button — visible on hover */}
                {data.onDelete && (
                    <button
                        onClick={() => (data.onDelete as (id: string) => void)(data.schema.id)}
                        title={`Drop table ${name}`}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 shrink-0"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Column Rows */}
            <div className="flex flex-col">
                {columns.map((col, idx) => (
                    <div
                        key={idx}
                        className={`relative flex items-center justify-between px-4 py-2.5 border-t transition-colors duration-200 ${getRowBg(col, s)} ${s.rowBase.split(' ')[2]}`}
                    >
                        {/* FK source handle (right side) */}
                        {col.isForeignKey && (
                            <Handle
                                id={`${name}-${col.name}-source`}
                                type="source"
                                position={Position.Right}
                                isConnectable={isConnectable}
                                className={`!w-2.5 !h-2.5 !border-2 ${s.handleFk}`}
                                style={{ top: '50%', right: '-5px' }}
                            />
                        )}

                        {/* PK target handle (left side) */}
                        {col.isPrimaryKey && (
                            <Handle
                                id={`${name}-${col.name}-target`}
                                type="target"
                                position={Position.Left}
                                isConnectable={isConnectable}
                                className={`!w-2.5 !h-2.5 !border-2 ${s.handlePk}`}
                                style={{ top: '50%', left: '-5px' }}
                            />
                        )}

                        {/* Column name + icons + badges */}
                        <div className="flex items-center gap-1.5 min-w-0">
                            {col.isPrimaryKey && <KeyIcon className={s.textPk} />}
                            {col.isForeignKey && !col.isPrimaryKey && <LinkIcon className={s.textFk} />}

                            <span className={`text-[13px] font-medium truncate ${getTextColor(col, s)}`}>
                                {col.name}
                            </span>

                            {col.isPrimaryKey && <Badge label="PK" colorClass={s.badgePk} />}
                            {col.isForeignKey && <Badge label="FK" colorClass={s.badgeFk} />}
                            {col.nullable === false && <Badge label="NN" colorClass={s.badgeNn} />}
                            {col.unique && <Badge label="UQ" colorClass={s.badgeUq} />}
                        </div>

                        {/* Data type */}
                        <TypeBadge type={col.type} fontColorClass={s.typeColor} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default memo(TableNode);
