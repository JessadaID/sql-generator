import { useCallback, useEffect, useMemo } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    addEdge,
    useNodesState,
    useEdgesState,
    BackgroundVariant,
    MarkerType,
} from '@xyflow/react';
import type { Connection, Edge, Node } from '@xyflow/react';
import TableNode from './TableNode';
import type { TableNodeData } from './TableNode';
import type { ForeignKey, SqlSchema, TableSchema } from '../types/schema';
import type { Theme, BackgroundType } from '../types/theme';

const nodeTypes = { tableNode: TableNode };

const COLUMN_GAP = 360;
const ROW_GAP = 320;
const COLUMNS_PER_ROW = 3;

// Calculate grid position for a node at the given index
const gridPosition = (idx: number) => ({
    x: (idx % COLUMNS_PER_ROW) * COLUMN_GAP + 60,
    y: Math.floor(idx / COLUMNS_PER_ROW) * ROW_GAP + 60,
});

// Build a ReactFlow node from a table schema
const buildNode = (table: TableSchema, idx: number, theme: Theme): Node => ({
    id: table.id,
    type: 'tableNode' as const,
    position: gridPosition(idx),
    data: { schema: table, theme } as TableNodeData,
});

// Build a ReactFlow edge from a foreign key definition
const buildEdge = (fk: ForeignKey, idx: number, edgeColor: string, theme: Theme): Edge => ({
    id: `fk-${idx}`,
    source: fk.fromTable,
    target: fk.toTable,
    sourceHandle: `${fk.fromTable}-${fk.fromColumn}-source`,
    targetHandle: `${fk.toTable}-${fk.toColumn}-target`,
    type: 'smoothstep',
    animated: true,
    style: { stroke: edgeColor, strokeWidth: 2, opacity: 0.8 },
    markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor, width: 16, height: 16 },
    label: `${fk.fromColumn} → ${fk.toColumn}`,
    labelStyle: { fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 11, fontWeight: 500 },
    labelBgStyle: { fill: theme === 'dark' ? '#1e293b' : '#f1f5f9', fillOpacity: 0.9 },
    labelBgPadding: [6, 4] as [number, number],
    labelBgBorderRadius: 6,
});

const BG_COLOR: Record<Theme, string> = { dark: '#334155', light: '#cbd5e1' };
const EDGE_COLOR: Record<Theme, string> = { dark: '#818cf8', light: '#6366f1' };
const MINIMAP_MASK: Record<Theme, string> = {
    dark: 'rgba(15,23,42, 0.7)',
    light: 'rgba(255,255,255, 0.6)',
};

interface SqlDiagramProps {
    schema: SqlSchema;
    theme?: Theme;
    bgType?: BackgroundType;
    onTableDelete?: (deletedTableIds: Set<string>) => void;
}

const SqlDiagram = ({ schema, theme = 'dark', bgType = 'dots', onTableDelete }: SqlDiagramProps) => {
    const edgeColor = EDGE_COLOR[theme];

    // Build initial edges (memoized — rebuilds when schema or theme changes)
    const edgesFromSchema: Edge[] = useMemo(
        () => schema.foreignKeys.map((fk, idx) => buildEdge(fk, idx, edgeColor, theme)),
        [schema.foreignKeys, theme, edgeColor]
    );

    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState(edgesFromSchema);

    // Sync nodes: preserve user-dragged positions for existing nodes; append new ones
    useEffect(() => {
        setNodes((prev) => {
            const existingMap = new Map(prev.map((n) => [n.id, n]));
            const newTables = schema.tables.filter((t) => !existingMap.has(t.id));

            return schema.tables.map((table) => {
                const existing = existingMap.get(table.id);
                if (existing) {
                    // Refresh data/theme without moving the node
                    return { ...existing, data: { schema: table, theme } as TableNodeData };
                }
                // New node — place after current nodes
                const newIdx = prev.length + newTables.indexOf(table);
                return buildNode(table, newIdx, theme);
            });
        });
    }, [schema.tables, theme, setNodes]);

    // Sync edges whenever schema or theme changes
    useEffect(() => {
        setEdges(edgesFromSchema);
    }, [edgesFromSchema, setEdges]);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    const handleNodesDelete = useCallback(
        (deletedNodes: Node[]) => {
            if (onTableDelete && deletedNodes.length > 0) {
                onTableDelete(new Set(deletedNodes.map((n) => n.id)));
            }
        },
        [onTableDelete]
    );

    const minimapNodeColor = useCallback(
        (node: Node) => {
            const d = node.data as TableNodeData;
            const hasPk = d?.schema?.columns?.some((c) => c.isPrimaryKey);
            return theme === 'dark'
                ? hasPk ? '#6366f1' : '#334155'
                : hasPk ? '#4f46e5' : '#e2e8f0';
        },
        [theme]
    );

    return (
        <div className="w-full h-full pb-4">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodesDelete={handleNodesDelete}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.2}
                maxZoom={1.5}
                defaultEdgeOptions={{ type: 'smoothstep' }}
            >
                <Background
                    variant={bgType === 'dots' ? BackgroundVariant.Dots : BackgroundVariant.Lines}
                    gap={40}
                    size={bgType === 'dots' ? 2.5 : 1}
                    color={BG_COLOR[theme]}
                />

                <Controls
                    className="!rounded-xl !shadow-xl !bg-white !border-slate-200 !text-slate-700 [&_path]:!fill-slate-700"
                    style={{ bottom: 24, left: 24 }}
                />

                <MiniMap
                    nodeColor={minimapNodeColor}
                    maskColor={MINIMAP_MASK[theme]}
                    className={`!border !rounded-xl !overflow-hidden ${theme === 'dark'
                            ? '!bg-slate-900 !border-slate-800'
                            : '!bg-slate-50 !border-slate-200'
                        }`}
                    style={{ bottom: 24, right: 24 }}
                />
            </ReactFlow>
        </div>
    );
};

export default SqlDiagram;
