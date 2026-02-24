import { useCallback, useMemo } from 'react';
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
import type { SqlSchema } from '../types/schema';
import type { Theme, BackgroundType } from '../types/theme';

const nodeTypes = { tableNode: TableNode };

interface SqlDiagramProps {
    schema: SqlSchema;
    theme?: Theme;
    bgType?: BackgroundType;
}

const COLUMN_GAP = 360;
const ROW_GAP = 320;
const COLUMNS_PER_ROW = 3;

const SqlDiagram = ({ schema, theme = 'dark', bgType = 'dots' }: SqlDiagramProps) => {
    // Inject theme into node data
    const initialNodes: Node[] = useMemo(
        () =>
            schema.tables.map((table, idx) => ({
                id: table.id,
                type: 'tableNode',
                position: {
                    x: (idx % COLUMNS_PER_ROW) * COLUMN_GAP + 60,
                    y: Math.floor(idx / COLUMNS_PER_ROW) * ROW_GAP + 60,
                },
                data: { schema: table, theme } as TableNodeData,
            })),
        [schema.tables, theme]
    );

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);

    // Sync nodes when theme changes
    useMemo(() => {
        setNodes((nds) =>
            nds.map((n) => ({
                ...n,
                data: { ...n.data, theme } as TableNodeData,
            }))
        );
    }, [theme, setNodes]);

    const edgeColor = theme === 'dark' ? '#818cf8' : '#6366f1'; // Indigo 400 / Indigo 500
    const initialEdges: Edge[] = useMemo(
        () =>
            schema.foreignKeys.map((fk, idx) => ({
                id: `fk-${idx}`,
                source: fk.fromTable,
                target: fk.toTable,
                sourceHandle: `${fk.fromTable}-${fk.fromColumn}-source`,
                targetHandle: `${fk.toTable}-${fk.toColumn}-target`,
                type: 'smoothstep',
                animated: true,
                style: { stroke: edgeColor, strokeWidth: 2, opacity: 0.8 },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: edgeColor,
                    width: 16,
                    height: 16,
                },
                label: `${fk.fromColumn} → ${fk.toColumn}`,
                labelStyle: { fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 11, fontWeight: 500 },
                labelBgStyle: {
                    fill: theme === 'dark' ? '#1e293b' : '#f1f5f9',
                    fillOpacity: 0.9,
                },
                labelBgPadding: [6, 4] as [number, number],
                labelBgBorderRadius: 6,
            })),
        [schema.foreignKeys, theme, edgeColor]
    );

    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    // Sync edges on theme change
    useMemo(() => {
        setEdges(initialEdges);
    }, [initialEdges, setEdges]);

    const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

    const bgColorConfig = {
        dark: '#334155', // slate 700
        light: '#cbd5e1', // slate 300
    };

    const minimapNodeColor = (node: Node) => {
        const d = node.data as TableNodeData;
        const hasPk = d?.schema?.columns?.some((c) => c.isPrimaryKey);
        if (theme === 'dark') return hasPk ? '#6366f1' : '#334155';
        return hasPk ? '#4f46e5' : '#e2e8f0'; // Light theme
    };

    const minimapMaskColor = {
        dark: 'rgba(15,23,42, 0.7)',
        light: 'rgba(255,255,255, 0.6)',
    };

    return (
        <div className="w-full h-full pb-4">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
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
                    size={bgType === 'dots' ? 2.5 : 1} // Increased dot size to 2.5
                    color={bgColorConfig[theme]}
                />

                <Controls
                    className="!rounded-xl !shadow-xl !bg-white !border-slate-200 !text-slate-700 [&_path]:!fill-slate-700"
                    style={{ bottom: 24, left: 24 }}
                />

                <MiniMap
                    nodeColor={minimapNodeColor}
                    maskColor={minimapMaskColor[theme]}
                    className={`!border !rounded-xl !overflow-hidden ${theme === 'dark' ? '!bg-slate-900 !border-slate-800' : '!bg-slate-50 !border-slate-200'
                        }`}
                    style={{ bottom: 24, right: 24 }}
                />
            </ReactFlow>
        </div>
    );
};

export default SqlDiagram;
