'use client';

import React, {useState, useEffect} from 'react';
import ReactFlow, {
    Node,
    Edge,
    Background,
    Panel,
    ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {api} from '@/utils/api';
import {convertFromYAML} from '@/utils/yamlPipelineUtils';
import WorkflowNode from './WorkflowNode';
import {PipelineProvider} from '@/contexts/PipelineContext';

// Define node types for ReactFlow to render custom nodes with icons
const nodeTypes = {
    workflowNode: WorkflowNode,
};

interface PipelineExecutionViewProps {
    pipelineName?: string;
    buildId?: string;
    accountId?: string;
    enterpriseId?: string;
}

interface NodeExecutionDetails {
    nodeId: string;
    nodeName: string;
    status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
    startTime?: string;
    endTime?: string;
    duration?: string;
    logs: string[];
    metrics?: {
        cpuUsage?: string;
        memoryUsage?: string;
        artifacts?: number;
    };
}

export default function PipelineExecutionView({
    pipelineName,
    buildId,
    accountId,
    enterpriseId,
}: PipelineExecutionViewProps) {
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isRealData, setIsRealData] = useState(false);
    const [pipelineMetadata, setPipelineMetadata] = useState<any>(null);
    const [selectedNode, setSelectedNode] =
        useState<NodeExecutionDetails | null>(null);
    const [showDetailsPanel, setShowDetailsPanel] = useState(false);

    // Generate mock execution details for a node
    const getNodeExecutionDetails = (node: Node): NodeExecutionDetails => {
        const nodeIndex = nodes.findIndex((n) => n.id === node.id);
        const status =
            nodeIndex < 1 ? 'success' : nodeIndex === 1 ? 'running' : 'pending';

        const mockLogs = [
            `[${new Date().toISOString()}] Starting ${
                node.data.label
            } execution...`,
            `[${new Date().toISOString()}] Initializing environment...`,
            `[${new Date().toISOString()}] Loading configuration...`,
            `[${new Date().toISOString()}] Executing build steps...`,
            status === 'running'
                ? `[${new Date().toISOString()}] Build in progress...`
                : status === 'success'
                ? `[${new Date().toISOString()}] ✓ Build completed successfully`
                : `[${new Date().toISOString()}] Waiting to start...`,
        ];

        return {
            nodeId: node.id,
            nodeName: node.data.label || 'Unknown Stage',
            status,
            startTime:
                status !== 'pending'
                    ? new Date(Date.now() - 120000).toISOString()
                    : undefined,
            endTime:
                status === 'success' ? new Date().toISOString() : undefined,
            duration:
                status === 'success'
                    ? '2m 15s'
                    : status === 'running'
                    ? '1m 30s'
                    : undefined,
            logs: mockLogs,
            metrics:
                status !== 'pending'
                    ? {
                          cpuUsage: '45%',
                          memoryUsage: '62%',
                          artifacts: status === 'success' ? 3 : 0,
                      }
                    : undefined,
        };
    };

    // Handle node click
    const onNodeClick = (_event: React.MouseEvent, node: Node) => {
        console.log('🔵 Node clicked:', node);
        const details = getNodeExecutionDetails(node);
        setSelectedNode(details);
        setShowDetailsPanel(true);
    };

    useEffect(() => {
        const fetchPipelineData = async () => {
            console.log('🚀 PipelineExecutionView props:', {
                pipelineName,
                buildId,
                accountId,
                enterpriseId,
            });

            if (!pipelineName || !accountId || !enterpriseId) {
                console.log(
                    '⚠️ Missing required data, skipping pipeline fetch',
                );
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const apiUrl = `/api/pipeline-canvas?accountId=${accountId}&enterpriseId=${enterpriseId}`;
                console.log('🌐 API URL:', apiUrl);

                const response: any = await api.get(apiUrl);
                console.log('📡 API Response:', response);
                console.log('📦 Response data:', response.data);
                console.log(
                    '📦 Response data type:',
                    response.data,
                    Array.isArray(response),
                );

                // API returns array directly, not wrapped in .data
                const pipelines = Array.isArray(response)
                    ? response
                    : response.data || [];
                console.log('📋 Found pipelines:', pipelines.length, pipelines);
                console.log('🔎 Looking for pipeline named:', pipelineName);
                console.log(
                    '📝 Pipeline names in DB:',
                    pipelines.map((p: any) => p.pipelineName),
                );

                const pipeline = pipelines.find(
                    (p: any) => p.pipelineName === pipelineName,
                );

                console.log(
                    '🎯 Found matching pipeline?',
                    !!pipeline,
                    pipeline,
                );

                if (pipeline && pipeline.yamlContent) {
                    console.log('✅ Pipeline has YAML content, parsing...');
                    const {
                        nodes: parsedNodes,
                        edges: parsedEdges,
                        metadata,
                    } = convertFromYAML(pipeline.yamlContent);

                    console.log('📊 Parsed nodes:', parsedNodes.length);
                    console.log('🔗 Parsed edges:', parsedEdges.length);

                    setNodes(parsedNodes);
                    setEdges(parsedEdges);
                    setPipelineMetadata(metadata);
                    setIsRealData(true);
                } else {
                    console.log('⚠️ Pipeline not found or has no YAML content');
                    setIsRealData(false);
                }

                setLoading(false);
            } catch (err) {
                console.error('❌ Error fetching pipeline:', err);
                setError('Failed to load pipeline data');
                setLoading(false);
                setIsRealData(false);
            }
        };

        fetchPipelineData();
    }, [pipelineName, accountId, enterpriseId]);

    if (loading) {
        return (
            <div className='flex items-center justify-center h-96 bg-slate-50 rounded-lg'>
                <div className='text-center'>
                    <div className='w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
                    <p className='text-slate-600'>Loading pipeline...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className='flex items-center justify-center h-96 bg-red-50 rounded-lg border-2 border-red-200'>
                <div className='text-center p-8'>
                    <svg
                        className='w-16 h-16 text-red-400 mx-auto mb-4'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                    >
                        <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                        />
                    </svg>
                    <h3 className='text-lg font-semibold text-red-700 mb-2'>
                        Error Loading Pipeline
                    </h3>
                    <p className='text-red-600'>{error}</p>
                </div>
            </div>
        );
    }

    if (!isRealData || nodes.length === 0) {
        return (
            <div className='flex items-center justify-center h-96 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300'>
                <div className='text-center p-8'>
                    <svg
                        className='w-16 h-16 text-slate-400 mx-auto mb-4'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                    >
                        <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                        />
                    </svg>
                    <h3 className='text-lg font-semibold text-slate-700 mb-2'>
                        No Pipeline Found
                    </h3>
                    <p className='text-slate-500 mb-4'>
                        {pipelineName
                            ? `Pipeline "${pipelineName}" not found or has no stages.`
                            : 'No pipeline selected for this build.'}
                    </p>
                    <p className='text-xs text-slate-400'>
                        Create a pipeline in the Pipeline Canvas first.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className='relative'>
            {/* Split View Layout */}
            <div
                className={`flex gap-4 transition-all duration-300 ${
                    showDetailsPanel ? 'mr-96' : ''
                }`}
            >
                {/* Main Canvas Area */}
                <div className='flex-1'>
                    {/* Compact Info Bar */}
                    <div className='mb-3 p-2 bg-white rounded-lg border border-slate-200 shadow-sm'>
                        <div className='flex items-center justify-between text-xs'>
                            <div className='flex items-center gap-3'>
                                <div className='flex items-center gap-2'>
                                    <div className='w-2 h-2 bg-blue-500 rounded-full animate-pulse' />
                                    <span className='font-medium text-slate-700'>
                                        {nodes.length} stages
                                    </span>
                                </div>
                                <div className='w-px h-4 bg-slate-300' />
                                <span className='text-slate-600'>
                                    {edges.length} connections
                                </span>
                                <div className='w-px h-4 bg-slate-300' />
                                <span className='text-green-600 font-medium'>
                                    1/{nodes.length} complete
                                </span>
                            </div>
                            <div className='flex items-center gap-2'>
                                {pipelineMetadata?.deploymentType && (
                                    <span className='px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium'>
                                        {pipelineMetadata.deploymentType}
                                    </span>
                                )}
                                <span className='text-slate-500'>
                                    Click stages for details →
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* React Flow Canvas */}
                    <div
                        className='bg-slate-50 rounded-lg border-2 border-slate-200 shadow-inner'
                        style={{height: '500px'}}
                    >
                        <ReactFlowProvider>
                            <PipelineProvider>
                                <ReactFlow
                                    nodes={nodes}
                                    edges={edges}
                                    nodeTypes={nodeTypes}
                                    onNodeClick={onNodeClick}
                                    fitView
                                >
                                    <Background color='#94a3b8' gap={16} />
                                    <Panel
                                        position='top-left'
                                        className='bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-lg text-xs border border-slate-200'
                                    >
                                        <div className='flex items-center gap-2 text-slate-700'>
                                            <svg
                                                className='w-4 h-4 text-blue-600'
                                                fill='none'
                                                viewBox='0 0 24 24'
                                                stroke='currentColor'
                                            >
                                                <path
                                                    strokeLinecap='round'
                                                    strokeLinejoin='round'
                                                    strokeWidth={2}
                                                    d='M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122'
                                                />
                                            </svg>
                                            <span className='font-medium'>
                                                Interactive Pipeline
                                            </span>
                                        </div>
                                    </Panel>
                                </ReactFlow>
                            </PipelineProvider>
                        </ReactFlowProvider>
                    </div>
                </div>
            </div>

            {/* Side Drawer for Stage Details */}
            {showDetailsPanel && selectedNode && (
                <>
                    {/* Backdrop */}
                    <div
                        className='fixed inset-0 bg-black/20 z-40'
                        onClick={() => setShowDetailsPanel(false)}
                    />

                    {/* Sliding Panel */}
                    <div className='fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right border-l-2 border-slate-200'>
                        {/* Header */}
                        <div className='px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-white'>
                            <div className='flex items-center justify-between'>
                                <div className='flex items-center gap-2'>
                                    <div
                                        className={`w-2 h-2 rounded-full ${
                                            selectedNode.status === 'success'
                                                ? 'bg-green-500'
                                                : selectedNode.status ===
                                                  'running'
                                                ? 'bg-blue-500 animate-pulse'
                                                : selectedNode.status ===
                                                  'failed'
                                                ? 'bg-red-500'
                                                : 'bg-slate-400'
                                        }`}
                                    />
                                    <h3 className='text-sm font-semibold text-slate-800'>
                                        {selectedNode.nodeName}
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setShowDetailsPanel(false)}
                                    className='p-1 hover:bg-slate-100 rounded transition-colors'
                                >
                                    <svg
                                        className='w-5 h-5 text-slate-600'
                                        fill='none'
                                        viewBox='0 0 24 24'
                                        stroke='currentColor'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M6 18L18 6M6 6l12 12'
                                        />
                                    </svg>
                                </button>
                            </div>
                            <div className='mt-2 flex items-center gap-3 text-xs'>
                                <span
                                    className={`px-2 py-0.5 rounded font-medium ${
                                        selectedNode.status === 'success'
                                            ? 'bg-green-100 text-green-700'
                                            : selectedNode.status === 'running'
                                            ? 'bg-blue-100 text-blue-700'
                                            : selectedNode.status === 'failed'
                                            ? 'bg-red-100 text-red-700'
                                            : 'bg-slate-100 text-slate-600'
                                    }`}
                                >
                                    {selectedNode.status.toUpperCase()}
                                </span>
                                {selectedNode.duration && (
                                    <span className='text-slate-600'>
                                        ⏱ {selectedNode.duration}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Scrollable Content */}
                        <div className='flex-1 overflow-y-auto p-4 space-y-4'>
                            {/* Timeline */}
                            {selectedNode.startTime && (
                                <div className='space-y-2'>
                                    <div className='flex items-center justify-between text-xs'>
                                        <span className='text-slate-600'>
                                            Started
                                        </span>
                                        <span className='font-medium text-slate-800'>
                                            {new Date(
                                                selectedNode.startTime,
                                            ).toLocaleTimeString()}
                                        </span>
                                    </div>
                                    {selectedNode.endTime && (
                                        <div className='flex items-center justify-between text-xs'>
                                            <span className='text-slate-600'>
                                                Completed
                                            </span>
                                            <span className='font-medium text-slate-800'>
                                                {new Date(
                                                    selectedNode.endTime,
                                                ).toLocaleTimeString()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Metrics */}
                            {selectedNode.metrics && (
                                <div>
                                    <h4 className='text-xs font-semibold text-slate-700 mb-2'>
                                        Metrics
                                    </h4>
                                    <div className='grid grid-cols-3 gap-2'>
                                        <div className='p-2 bg-blue-50 rounded text-center'>
                                            <p className='text-lg font-bold text-blue-700'>
                                                {selectedNode.metrics.cpuUsage}
                                            </p>
                                            <p className='text-xs text-blue-600'>
                                                CPU
                                            </p>
                                        </div>
                                        <div className='p-2 bg-purple-50 rounded text-center'>
                                            <p className='text-lg font-bold text-purple-700'>
                                                {
                                                    selectedNode.metrics
                                                        .memoryUsage
                                                }
                                            </p>
                                            <p className='text-xs text-purple-600'>
                                                Memory
                                            </p>
                                        </div>
                                        <div className='p-2 bg-green-50 rounded text-center'>
                                            <p className='text-lg font-bold text-green-700'>
                                                {selectedNode.metrics.artifacts}
                                            </p>
                                            <p className='text-xs text-green-600'>
                                                Files
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Logs */}
                            <div>
                                <div className='flex items-center justify-between mb-2'>
                                    <h4 className='text-xs font-semibold text-slate-700'>
                                        Execution Logs
                                    </h4>
                                    <button className='text-xs text-blue-600 hover:text-blue-700 font-medium'>
                                        Export
                                    </button>
                                </div>
                                <div className='bg-slate-900 rounded p-3 font-mono text-xs text-green-400 max-h-96 overflow-y-auto'>
                                    {selectedNode.logs.map((log, index) => (
                                        <div
                                            key={index}
                                            className='mb-1 hover:bg-slate-800 px-1 py-0.5 rounded transition-colors'
                                        >
                                            {log}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className='flex gap-2'>
                                <button className='flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-xs'>
                                    Rerun Stage
                                </button>
                                <button className='flex-1 px-3 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium text-xs'>
                                    View Files
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            <style jsx global>{`
                @keyframes slide-in-right {
                    from {
                        transform: translateX(100%);
                    }
                    to {
                        transform: translateX(0);
                    }
                }
                .animate-slide-in-right {
                    animation: slide-in-right 0.3s ease-out;
                }
            `}</style>
        </div>
    );
}
