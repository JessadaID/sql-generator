import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { TableSchema } from '../types/schema';
import type { Theme } from '../types/theme';

export interface TableNodeData extends Record<string, unknown> {
    schema: TableSchema;
    theme?: Theme;
}

interface TableNodeProps {
    data: TableNodeData;
    isConnectable: boolean;
}

const Badge = ({ label, colorClass }: { label: string; colorClass: string }) => (
    <span className={`ml-1 text-[9px] font-semibold px-1 py-0.5 rounded uppercase tracking-wide ${colorClass}`}>
        {label}
    </span>
);

const TypeBadge = ({ type, fontColorClass }: { type: string; fontColorClass: string }) => (
    <span className={`text-xs font-mono opacity-80 ${fontColorClass}`}>{type}</span>
);

const TableNode = ({ data, isConnectable }: TableNodeProps) => {
    const schema = data.schema as TableSchema;
    const { name, columns } = schema;
    const theme = data.theme || 'dark';

    // --- Theme definitions ---
    // Minimal styles mapping (Removed Green, Removed Gradient)
    const styles = {
        dark: {
            cardBg: 'bg-slate-900 border-slate-700/60 text-slate-200',
            headerBg: 'bg-slate-800', // Changed from gradient to solid
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
            badgeNn: 'bg-slate-500/20 text-slate-400',
            badgeUq: 'bg-emerald-500/10 text-emerald-500',
        },
        light: {
            cardBg: 'bg-white border-slate-200 text-slate-700 shadow-sm',
            headerBg: 'bg-slate-100 border-b border-slate-200', // Solid light color
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
            badgeNn: 'bg-slate-100 text-slate-500 border border-slate-200',
            badgeUq: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
        }
    };

    const currentTheme = styles[theme];

    return (
        <div className={`min-w-[240px] rounded-xl overflow-hidden shadow-xl border backdrop-blur-sm transition-colors duration-300 ${currentTheme.cardBg}`}>
            {/* Table Header */}
            <div className={`flex items-center gap-2 px-4 py-3 transition-colors duration-300 ${currentTheme.headerBg}`}>
                <svg
                    className={`w-4 h-4 shrink-0 opacity-80 ${currentTheme.headerText}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 6h18M3 14h18M3 18h18" />
                </svg>
                <span className={`font-semibold text-sm tracking-wide ${currentTheme.headerText}`}>{name}</span>
            </div>

            {/* Column Rows */}
            <div className="flex flex-col">
                {columns.map((col, idx) => {
                    let rowBg = currentTheme.rowBase;
                    if (col.isPrimaryKey) rowBg = currentTheme.rowPk;
                    else if (col.isForeignKey) rowBg = currentTheme.rowFk;

                    let textColor = currentTheme.textNormal;
                    if (col.isPrimaryKey) textColor = currentTheme.textPk;
                    else if (col.isForeignKey) textColor = currentTheme.textFk;

                    return (
                        <div
                            key={idx}
                            className={`relative flex items-center justify-between px-4 py-2.5 border-t transition-colors duration-200 ${rowBg} ${currentTheme.rowBase.split(' ')[2] /* use border color */}`}
                        >
                            {/* Handles */}
                            {col.isForeignKey && (
                                <Handle
                                    id={`${name}-${col.name}-source`}
                                    type="source"
                                    position={Position.Right}
                                    isConnectable={isConnectable}
                                    className={`!w-2.5 !h-2.5 !border-2 ${theme === 'dark' ? '!bg-indigo-400 !border-slate-900' : '!bg-indigo-500 !border-white'}`}
                                    style={{ top: '50%', right: '-5px' }}
                                />
                            )}

                            {col.isPrimaryKey && (
                                <Handle
                                    id={`${name}-${col.name}-target`}
                                    type="target"
                                    position={Position.Left}
                                    isConnectable={isConnectable}
                                    className={`!w-2.5 !h-2.5 !border-2 ${theme === 'dark' ? '!bg-amber-400 !border-slate-900' : '!bg-amber-500 !border-white'}`}
                                    style={{ top: '50%', left: '-5px' }}
                                />
                            )}

                            {/* Column details */}
                            <div className="flex items-center gap-1.5 min-w-0">
                                {col.isPrimaryKey && (
                                    <svg className={`w-3.5 h-3.5 shrink-0 ${currentTheme.textPk}`} fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm7-5H5C3.34 4 2 5.34 2 7v10c0 1.66 1.34 3 3 3h14c1.66 0 3-1.34 3-3V7c0-1.66-1.34-3-3-3z" />
                                    </svg>
                                )}
                                {col.isForeignKey && !col.isPrimaryKey && (
                                    <svg className={`w-3.5 h-3.5 shrink-0 ${currentTheme.textFk}`} fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M17 7H7C4.24 7 2 9.24 2 12s2.24 5 5 5h10c2.76 0 5-2.24 5-5s-2.24-5-5-5zm0 8H7c-1.66 0-3-1.34-3-3s1.34-3 3-3h10c1.66 0 3 1.34 3 3s-1.34 3-3 3zm-1-3c0 1.1-.9 2-2 2H10c-1.1 0-2-.9-2-2s.9-2 2-2h4c1.1 0 2 .9 2 2z" />
                                    </svg>
                                )}
                                <span className={`text-[13px] font-medium truncate ${textColor}`}>
                                    {col.name}
                                </span>

                                {/* Badges */}
                                {col.isPrimaryKey && <Badge label="PK" colorClass={currentTheme.badgePk} />}
                                {col.isForeignKey && <Badge label="FK" colorClass={currentTheme.badgeFk} />}
                                {col.nullable === false && <Badge label="NN" colorClass={currentTheme.badgeNn} />}
                                {col.unique && <Badge label="UQ" colorClass={currentTheme.badgeUq} />}
                            </div>

                            {/* Type */}
                            <TypeBadge type={col.type} fontColorClass={currentTheme.typeColor} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default memo(TableNode);
