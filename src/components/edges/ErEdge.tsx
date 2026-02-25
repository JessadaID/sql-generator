import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, type EdgeProps } from '@xyflow/react';
import type { Theme } from '../../types/theme';

type ErEdgeProps = EdgeProps & {
    data?: {
        label?: string;
        theme?: Theme;
    };
};

export default function ErEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style,
    data,
}: ErEdgeProps) {
    const [edgePath, labelX, labelY] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    const isDark = data?.theme === 'dark';
    const color = style?.stroke || (isDark ? '#818cf8' : '#6366f1');

    return (
        <>
            <BaseEdge id={id} path={edgePath} style={{ ...style, strokeWidth: 2, stroke: color }} />

            {/* The Many side (Source) */}
            <g transform={`translate(${sourceX}, ${sourceY})`}>
                <circle r={3} fill={color} cx={sourcePosition === 'right' ? -4 : 4} cy={0} />
                <path d={`M ${sourcePosition === 'right' ? 0 : 0} 0 L ${sourcePosition === 'right' ? -12 : 12} -8 M ${sourcePosition === 'right' ? 0 : 0} 0 L ${sourcePosition === 'right' ? -12 : 12} 8`} stroke={color} strokeWidth={2} fill="none" />
                <line x1={sourcePosition === 'right' ? -12 : 12} y1={-8} x2={sourcePosition === 'right' ? -12 : 12} y2={8} stroke={color} strokeWidth={2} />
            </g>

            {/* The One side (Target) */}
            <g transform={`translate(${targetX}, ${targetY})`}>
                <line x1={targetPosition === 'left' ? -6 : 6} y1={-8} x2={targetPosition === 'left' ? -6 : 6} y2={8} stroke={color} strokeWidth={2} />
                <line x1={targetPosition === 'left' ? -12 : 12} y1={-8} x2={targetPosition === 'left' ? -12 : 12} y2={8} stroke={color} strokeWidth={2} />
            </g>

            {data?.label && (
                <EdgeLabelRenderer>
                    <div
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                            background: isDark ? '#1e293b' : '#f1f5f9',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: 10,
                            fontWeight: 600,
                            color: isDark ? '#94a3b8' : '#64748b',
                            pointerEvents: 'all',
                        }}
                        className="nodrag nopan"
                    >
                        {data.label}
                    </div>
                </EdgeLabelRenderer>
            )}
        </>
    );
}
