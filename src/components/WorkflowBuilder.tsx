'use client';

import {useCallback, useState, useRef, useEffect} from 'react';
import ReactFlow, {
    Node,
    Edge,
    addEdge,
    Connection,
    useNodesState,
    useEdgesState,
    Controls,
    MiniMap,
    Background,
    ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';

import Sidebar from './Sidebar';
import ModernConnectorToolbar from './ModernConnectorToolbar';
import PipelineHeader from './PipelineHeader';
import WorkflowNode from './WorkflowNode';
import PipelinePanels from './PipelinePanels';

import {usePipeline} from '@/contexts/PipelineContext';
import {
    WorkflowNodeType,
    WorkflowNodeData,
    PipelineConfig,
} from '@/types/workflow';
import {
    PIPELINE_DEFAULTS,
    PIPELINE_MODES,
    DEPLOYMENT_TYPES,
    TEMPLATE_FLOWS,
    AUTO_SAVE_CONFIG,
} from '@/constants/pipeline';
import {
    parseURLParams,
    createPipelineStateFromParams,
    createPipelineStateFromTemplate,
    generateNodeId,
    getNodeTypeFromStepType,
    getNodeLabel,
    logPipelineDebug,
    type TemplateData,
} from '@/utils/pipelineUtils';
import {
    convertToYAML,
    convertFromYAML,
    savePipelineYAML,
    loadPipelineYAML,
    getAllPipelineYAMLs,
} from '@/utils/yamlPipelineUtils';
import {api} from '@/utils/api';

// Component configuration
const nodeTypes = {
    workflowNode: WorkflowNode,
};

// Empty initial state - users will build their own pipelines
const initialNodes: Node<WorkflowNodeData>[] = [];
const initialEdges: Edge[] = [];

// Template flow data is now imported from constants

// Convert template pipeline to nodes and edges
const convertTemplateToFlow = (templateData: any[]) => {
    const nodes: Node<WorkflowNodeData>[] = [];
    const edges: Edge[] = [];

    templateData.forEach((step, index) => {
        const nodeType = getNodeTypeFromStepType(step.type);
        const nodeId = generateNodeId();

        // Create node
        const node: Node<WorkflowNodeData> = {
            id: nodeId,
            type: 'workflowNode',
            position: {x: 250, y: index * 150 + 100},
            data: {
                type: nodeType,
                label: step.title || getNodeLabel(nodeType),
                status: 'pending',
                identifier: `${step.type}_${index + 1}`,
                stage: step.title || getNodeLabel(nodeType),
            },
        };
        nodes.push(node);

        // Create edge to connect to previous node
        if (index > 0) {
            const previousNodeId = nodes[index - 1].id;
            const edge: Edge = {
                id: `edge-${previousNodeId}-${nodeId}`,
                source: previousNodeId,
                target: nodeId,
                type: 'smoothstep',
            };
            edges.push(edge);
        }
    });

    return {nodes, edges};
};

interface WorkflowBuilderProps {
    templateId?: string | null;
    templateData?: TemplateData | null;
}

function WorkflowBuilderContent({
    templateId,
    templateData,
}: WorkflowBuilderProps) {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
    const [showPanels, setShowPanels] = useState(false);

    // URL parameters state
    const [urlParams, setUrlParams] = useState<URLSearchParams>(
        new URLSearchParams(),
    );
    const [mode, setMode] = useState<string>(PIPELINE_DEFAULTS.MODE);
    const [templateName, setTemplateName] = useState('');
    const [enterprise, setEnterprise] = useState('');
    const [entity, setEntity] = useState('');
    const [deploymentTypeFromUrl, setDeploymentTypeFromUrl] = useState<string>(
        PIPELINE_DEFAULTS.DEPLOYMENT_TYPE,
    );

    useEffect(() => {
        if (templateData) {
            // Use provided template data (for embedded view)
            setMode(templateData.mode || PIPELINE_MODES.PREVIEW);
            setTemplateName(templateData.name);
            setEnterprise(templateData.enterprise);
            setEntity(templateData.entity);
            setDeploymentTypeFromUrl(templateData.deploymentType);

            // Update pipeline state with template data
            const pipelineState = createPipelineStateFromTemplate(templateData);
            setPipelineName(
                pipelineState.pipelineName || PIPELINE_DEFAULTS.PIPELINE_NAME,
            );
            setDeploymentType(pipelineState.deploymentType);
            setDescription(pipelineState.description);

            logPipelineDebug('Using provided template data', templateData);
        } else if (typeof window !== 'undefined') {
            // Use URL parameters (for direct navigation)
            const urlParamsData = parseURLParams(window.location.search);
            const params = new URLSearchParams(window.location.search);

            setUrlParams(params);
            setMode(urlParamsData.mode);
            setTemplateName(urlParamsData.templateName);
            setEnterprise(urlParamsData.enterprise);
            setEntity(urlParamsData.entity);
            setDeploymentTypeFromUrl(urlParamsData.deploymentType);

            // Update pipeline state with URL parameters
            const pipelineState = createPipelineStateFromParams(urlParamsData);
            setPipelineName(
                pipelineState.pipelineName || PIPELINE_DEFAULTS.PIPELINE_NAME,
            );
            setDeploymentType(pipelineState.deploymentType);
            setDescription(pipelineState.description);

            // Debug URL parameters
            logPipelineDebug('Current URL', window.location.href);
            logPipelineDebug('Parsed URL params', urlParamsData);
        }
    }, [templateData]);

    const isReadOnly = mode === PIPELINE_MODES.PREVIEW;

    // Pipeline metadata state
    const [pipelineName, setPipelineName] = useState<string>(
        PIPELINE_DEFAULTS.PIPELINE_NAME,
    );

    // Debug logging
    useEffect(() => {
        console.log('Pipeline name changed to:', pipelineName);
    }, [pipelineName]);

    // Ensure pipeline name is never empty
    useEffect(() => {
        if (!pipelineName || pipelineName.trim() === '') {
            console.log('Pipeline name is empty, setting default');
            setPipelineName(PIPELINE_DEFAULTS.PIPELINE_NAME);
        }
    }, [pipelineName]);
    const [deploymentType, setDeploymentType] = useState<string>(
        PIPELINE_DEFAULTS.DEPLOYMENT_TYPE,
    );
    const [description, setDescription] = useState('');
    const [pipelineState, setPipelineState] = useState(true);
    const [showSaveDropdown, setShowSaveDropdown] = useState(false);

    // Save pipeline as template
    const savePipelineAsTemplate = async (saveAs = false) => {
        try {
            const templateId = saveAs
                ? `template-${Date.now()}`
                : urlParams.get('templateId') || `template-${Date.now()}`;

            const templateData = {
                id: templateId,
                name: pipelineName || PIPELINE_DEFAULTS.PIPELINE_NAME,
                description:
                    description ||
                    `${deploymentType} pipeline for ${enterprise} ${entity}`,
                details: {
                    enterprise: enterprise || 'Unknown',
                    entity: entity || 'Unknown',
                },
                deploymentType: deploymentType as 'Integration' | 'Extension',
                creationDate: new Date().toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                }),
                status: 'Active' as const,
            };

            // Get existing templates from storage
            // Persist template via backend
            const existingTemplates: any[] = await api
                .get<any[]>('/api/templates')
                .catch<any[]>(() => []);

            if (
                saveAs ||
                !existingTemplates.find((t: any) => t.id === templateId)
            ) {
                // Add new template
                existingTemplates.push(templateData);
                logPipelineDebug('Adding new template', templateData);
            } else {
                // Update existing template
                const index = existingTemplates.findIndex(
                    (t: any) => t.id === templateId,
                );
                if (index !== -1) {
                    existingTemplates[index] = templateData;
                    logPipelineDebug(
                        'Updating existing template',
                        templateData,
                    );
                }
            }

            // Save or update template
            const exists = existingTemplates.find(
                (t: any) => t.id === templateId,
            );
            if (exists) {
                await api.put(
                    `/api/templates/${encodeURIComponent(templateId)}`,
                    templateData,
                );
            } else {
                await api.post(`/api/templates`, templateData);
            }

            // Generate and save YAML for the pipeline
            const yamlContent = convertToYAML(nodes, edges, {
                name: templateData.name,
                description: templateData.description,
                enterprise: templateData.details.enterprise,
                entity: templateData.details.entity,
                deploymentType: templateData.deploymentType,
            });
            await savePipelineYAML(templateId, yamlContent);

            // Show success message
            logPipelineDebug(
                saveAs
                    ? 'Pipeline saved as new template with YAML!'
                    : 'Pipeline template updated successfully with YAML!',
                {
                    ...templateData,
                    yamlLength: yamlContent.length,
                },
            );
            setShowSaveDropdown(false);

            // Show YAML in console for debugging
            console.log(
                `Generated YAML for ${templateData.name}:`,
                yamlContent,
            );

            // Optionally redirect back to templates page after a delay
            setTimeout(() => {
                if (
                    window.confirm(
                        'Template saved successfully! Would you like to go back to the templates page?',
                    )
                ) {
                    window.location.href = '/pipelines/templates';
                }
            }, 500);
        } catch (error) {
            console.error('Error saving pipeline template:', error);
            alert('Failed to save pipeline template. Please try again.');
        }
    };

    const [pipelineConfig, setPipelineConfig] = useState<PipelineConfig>({
        variables: [],
        notifications: {
            email: [],
            slack: [],
            teams: [],
        },
        triggers: {
            push: false,
            pullRequest: false,
            schedule: undefined,
        },
    });

    const {setRunPipeline, isRunning, setIsRunning} = usePipeline();

    // Template copy modal state
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);

    // Load available templates
    useEffect(() => {
        const loadTemplates = () => {
            try {
                (async () => {
                    const templates = await api.get<any[]>('/api/templates');
                    if (templates) setAvailableTemplates(templates);
                })();
            } catch (error) {
                console.error('Error loading templates:', error);
            }
        };

        loadTemplates();
    }, []);

    // Load template when templateId changes
    useEffect(() => {
        if (!templateId) return;
        (async () => {
            const yamlContent = await loadPipelineYAML(templateId);
            if (yamlContent) {
                try {
                    const {
                        nodes: yamlNodes,
                        edges: yamlEdges,
                        metadata,
                    } = convertFromYAML(yamlContent);
                    setNodes(yamlNodes);
                    setEdges(yamlEdges);
                    if (metadata?.name) setPipelineName(metadata.name);
                    if (metadata?.deploymentType)
                        setDeploymentType(metadata.deploymentType);
                    logPipelineDebug('Template loaded from YAML', {
                        templateId,
                        nodesLoaded: yamlNodes.length,
                        edgesLoaded: yamlEdges.length,
                        metadata,
                    });
                } catch (error) {
                    console.error('Error loading YAML template:', error);
                    if (TEMPLATE_FLOWS[templateId]) {
                        const {nodes: templateNodes, edges: templateEdges} =
                            convertTemplateToFlow(TEMPLATE_FLOWS[templateId]);
                        setNodes(templateNodes);
                        setEdges(templateEdges);
                    }
                }
            } else if (TEMPLATE_FLOWS[templateId]) {
                const {nodes: templateNodes, edges: templateEdges} =
                    convertTemplateToFlow(TEMPLATE_FLOWS[templateId]);
                setNodes(templateNodes);
                setEdges(templateEdges);
            }
        })();
    }, [templateId, setNodes, setEdges]);

    // Format canvas functionality
    const formatCanvas = useCallback(() => {
        if (!reactFlowInstance) return;

        const updatedNodes = nodes.map((node, index) => ({
            ...node,
            position: {
                x: 300 + (index % 3) * 250,
                y: 100 + Math.floor(index / 3) * 150,
            },
        }));

        setNodes(updatedNodes);

        // Auto-fit view after formatting
        setTimeout(() => {
            reactFlowInstance.fitView({padding: 0.1});
        }, 100);
    }, [nodes, setNodes, reactFlowInstance]);

    // Handle copy from template using YAML
    const handleCopyFromTemplate = useCallback(
        async (templateId: string) => {
            try {
                const yamlContent = await loadPipelineYAML(templateId);
                if (yamlContent) {
                    const {
                        nodes: yamlNodes,
                        edges: yamlEdges,
                        metadata,
                    } = convertFromYAML(yamlContent);
                    setPipelineName(metadata.name + ' (Copy)');
                    setDeploymentType(metadata.deploymentType);
                    setDescription(metadata.description || '');
                    setNodes(yamlNodes);
                    setEdges(yamlEdges);
                    setTimeout(() => {
                        if (reactFlowInstance) {
                            reactFlowInstance.fitView({padding: 0.1});
                        }
                    }, 100);
                    logPipelineDebug('Template copied successfully from YAML', {
                        templateId,
                        templateName: metadata.name,
                        nodesCreated: yamlNodes.length,
                        edgesCreated: yamlEdges.length,
                        yamlLength: yamlContent.length,
                    });
                } else {
                    const templates = await api.get<any[]>('/api/templates');
                    if (templates) {
                        const selectedTemplate = templates.find(
                            (t: any) => t.id === templateId,
                        );
                        if (selectedTemplate) {
                            setPipelineName(selectedTemplate.name + ' (Copy)');
                            setDeploymentType(selectedTemplate.deploymentType);
                            setDescription(selectedTemplate.description);
                            if (
                                selectedTemplate.flowTemplateId &&
                                TEMPLATE_FLOWS[selectedTemplate.flowTemplateId]
                            ) {
                                const templateFlow =
                                    TEMPLATE_FLOWS[
                                        selectedTemplate.flowTemplateId
                                    ];
                                const newNodes: Node<WorkflowNodeData>[] = [];
                                const newEdges: Edge[] = [];
                                templateFlow.forEach((step, index) => {
                                    const nodeId = generateNodeId();
                                    const nodeType = getNodeTypeFromStepType(
                                        step.type,
                                    );
                                    const node: Node<WorkflowNodeData> = {
                                        id: nodeId,
                                        type: 'workflowNode',
                                        position: {
                                            x: 300 + index * 250,
                                            y: 100,
                                        },
                                        data: {
                                            type: nodeType,
                                            label: getNodeLabel(nodeType),
                                            config: step.config || {},
                                        },
                                    };
                                    newNodes.push(node);
                                });
                                for (let i = 0; i < newNodes.length - 1; i++) {
                                    newEdges.push({
                                        id: `edge-${i}`,
                                        source: newNodes[i].id,
                                        target: newNodes[i + 1].id,
                                        type: 'smoothstep',
                                    });
                                }
                                setNodes(newNodes);
                                setEdges(newEdges);
                                setTimeout(() => {
                                    if (reactFlowInstance) {
                                        reactFlowInstance.fitView({
                                            padding: 0.1,
                                        });
                                    }
                                }, 100);
                                logPipelineDebug(
                                    'Template copied successfully (fallback)',
                                    {
                                        templateId,
                                        templateName: selectedTemplate.name,
                                        nodesCreated: newNodes.length,
                                        edgesCreated: newEdges.length,
                                    },
                                );
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error copying template:', error);
                alert('Failed to copy template. Please try again.');
            }
        },
        [
            reactFlowInstance,
            setNodes,
            setEdges,
            setPipelineName,
            setDeploymentType,
            setDescription,
        ],
    );

    const onConnect = useCallback(
        (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges],
    );

    const onDragStart = (
        event: React.DragEvent,
        nodeType: WorkflowNodeType,
        toolName?: string,
    ) => {
        const dragData = JSON.stringify({nodeType, toolName});
        event.dataTransfer.setData('application/reactflow', dragData);
        event.dataTransfer.effectAllowed = 'move';
    };

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const reactFlowBounds =
                reactFlowWrapper.current?.getBoundingClientRect();
            const dragDataStr = event.dataTransfer.getData(
                'application/reactflow',
            );

            if (
                typeof dragDataStr === 'undefined' ||
                !dragDataStr ||
                !reactFlowInstance ||
                !reactFlowBounds
            ) {
                return;
            }

            let dragData;
            try {
                dragData = JSON.parse(dragDataStr);
            } catch {
                // Fallback for old format
                dragData = {nodeType: dragDataStr, toolName: dragDataStr};
            }

            const {nodeType, toolName} = dragData;

            const position = reactFlowInstance.project({
                x: event.clientX - reactFlowBounds.left,
                y: event.clientY - reactFlowBounds.top,
            });

            const newNode: Node<WorkflowNodeData> = {
                id: generateNodeId(),
                type: 'workflowNode',
                position,
                data: {
                    type: nodeType as WorkflowNodeType,
                    label:
                        toolName || getNodeLabel(nodeType as WorkflowNodeType),
                    status: 'pending',
                    identifier: `${nodeType}_${nodes.length + 1}`,
                    stage:
                        toolName ||
                        (nodeType as string).charAt(0).toUpperCase() +
                            (nodeType as string).slice(1),
                },
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [reactFlowInstance, setNodes, nodes.length],
    );

    const onNodeClick = useCallback(
        (event: React.MouseEvent, node: Node<WorkflowNodeData>) => {
            // Handle node click events here
        },
        [],
    );

    const onNodeDoubleClick = useCallback(
        (event: React.MouseEvent, node: Node<WorkflowNodeData>) => {
            const statusCycle = [
                'pending',
                'running',
                'completed',
                'failed',
            ] as const;
            const currentIndex = statusCycle.indexOf(
                node.data.status || 'pending',
            );
            const nextStatus =
                statusCycle[(currentIndex + 1) % statusCycle.length];

            setNodes((nds) =>
                nds.map((n) =>
                    n.id === node.id
                        ? {
                              ...n,
                              data: {
                                  ...n.data,
                                  status: nextStatus,
                              },
                          }
                        : n,
                ),
            );
        },
        [setNodes],
    );

    const runPipeline = useCallback(async () => {
        if (isRunning) return;

        setIsRunning(true);

        // Reset all nodes to pending status
        setNodes((nds) =>
            nds.map((node) => ({
                ...node,
                data: {
                    ...node.data,
                    status: 'pending',
                },
            })),
        );

        // Get connected nodes in execution order by following the edges
        const getExecutionOrder = () => {
            const visited = new Set<string>();
            const executionOrder: string[] = [];

            // Find nodes with no incoming edges (starting nodes)
            const hasIncomingEdge = new Set(edges.map((edge) => edge.target));
            const startingNodes = nodes.filter(
                (node) => !hasIncomingEdge.has(node.id),
            );

            const traverse = (nodeId: string) => {
                if (visited.has(nodeId)) return;
                visited.add(nodeId);
                executionOrder.push(nodeId);

                // Find connected nodes
                const outgoingEdges = edges.filter(
                    (edge) => edge.source === nodeId,
                );
                outgoingEdges.forEach((edge) => traverse(edge.target));
            };

            startingNodes.forEach((node) => traverse(node.id));
            return executionOrder;
        };

        const executionOrder = getExecutionOrder();

        // Execute nodes sequentially
        for (const nodeId of executionOrder) {
            // Set current node to running
            setNodes((nds) =>
                nds.map((node) =>
                    node.id === nodeId
                        ? {
                              ...node,
                              data: {
                                  ...node.data,
                                  status: 'running',
                              },
                          }
                        : node,
                ),
            );

            // Simulate execution time
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Set current node to completed
            setNodes((nds) =>
                nds.map((node) =>
                    node.id === nodeId
                        ? {
                              ...node,
                              data: {
                                  ...node.data,
                                  status: 'completed',
                              },
                          }
                        : node,
                ),
            );
        }

        setIsRunning(false);
    }, [isRunning, nodes, edges, setNodes, setIsRunning]);

    // Use ref to store the latest runPipeline function
    const runPipelineRef = useRef(runPipeline);
    runPipelineRef.current = runPipeline;

    // Register the runPipeline function with the context only once
    useEffect(() => {
        const wrappedRunPipeline = () => runPipelineRef.current();
        setRunPipeline(wrappedRunPipeline);
        return () => setRunPipeline(null);
    }, [setRunPipeline]);

    return (
        <div className='flex flex-col h-full bg-gray-50'>
            {/* Pipeline Header - Below Breadcrumbs */}
            <div className='bg-white border-b border-gray-200 px-6 py-3 flex-shrink-0 shadow-sm'>
                <div className='flex items-center justify-between gap-6'>
                    {/* Left: Pipeline Info with Better Spacing */}
                    <div className='flex items-center gap-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl px-6 py-3 min-w-0 flex-1 max-w-4xl'>
                        {/* Pipeline Name Section */}
                        <div className='flex items-center gap-3 min-w-0'>
                            <div className='flex items-center gap-2'>
                                <div className='w-2 h-2 bg-blue-500 rounded-full flex-shrink-0'></div>
                                <span className='text-xs font-medium text-gray-600 whitespace-nowrap'>
                                    Pipeline Name:
                                </span>
                            </div>
                            <input
                                type='text'
                                value={pipelineName}
                                onChange={(e) =>
                                    setPipelineName(e.target.value)
                                }
                                className='text-sm font-semibold text-gray-900 bg-white border border-gray-200 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                placeholder='Enter pipeline name'
                                disabled={isReadOnly}
                                style={{minWidth: '200px', width: '200px'}}
                            />
                        </div>

                        {/* Visual Separator */}
                        <div className='flex items-center'>
                            <div className='w-px h-8 bg-blue-300'></div>
                            <div className='w-2 h-2 bg-blue-400 rounded-full mx-2'></div>
                            <div className='w-px h-8 bg-blue-300'></div>
                        </div>

                        {/* Deployment Type Section */}
                        <div className='flex items-center gap-3'>
                            <span className='text-xs font-medium text-gray-600 whitespace-nowrap'>
                                Deployment Type:
                            </span>
                            <select
                                value={deploymentType}
                                onChange={(e) =>
                                    setDeploymentType(e.target.value)
                                }
                                className='text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer'
                                disabled={isReadOnly}
                            >
                                {DEPLOYMENT_TYPES.map((option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Visual Separator */}
                        <div className='flex items-center'>
                            <div className='w-px h-8 bg-blue-300'></div>
                            <div className='w-2 h-2 bg-blue-400 rounded-full mx-2'></div>
                            <div className='w-px h-8 bg-blue-300'></div>
                        </div>

                        {/* State Section */}
                        <div className='flex items-center gap-3'>
                            <span className='text-xs font-medium text-gray-600 whitespace-nowrap'>
                                State:
                            </span>
                            <div className='flex items-center gap-2'>
                                <button
                                    onClick={() =>
                                        setPipelineState(!pipelineState)
                                    }
                                    disabled={isReadOnly}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                        pipelineState
                                            ? 'bg-green-500 focus:ring-green-500'
                                            : 'bg-gray-300 focus:ring-gray-500'
                                    } ${
                                        isReadOnly
                                            ? 'opacity-50 cursor-not-allowed'
                                            : 'cursor-pointer'
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-md ${
                                            pipelineState
                                                ? 'translate-x-6'
                                                : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                                <span
                                    className={`text-sm font-semibold ${
                                        pipelineState
                                            ? 'text-green-600'
                                            : 'text-gray-500'
                                    }`}
                                >
                                    {pipelineState ? 'ON' : 'OFF'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Center: Compact Action Buttons (Edit Mode Only) */}
                    {!isReadOnly && (
                        <div className='flex items-center gap-2'>
                            <button
                                onClick={() => setShowTemplateModal(true)}
                                className='inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 hover:border-orange-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500'
                            >
                                <svg
                                    className='w-3.5 h-3.5'
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z'
                                    />
                                </svg>
                                Copy Template
                            </button>

                            <button className='inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500'>
                                <svg
                                    className='w-3.5 h-3.5'
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12'
                                    />
                                </svg>
                                Publish
                            </button>

                            <div className='relative'>
                                <button
                                    onClick={() =>
                                        setShowSaveDropdown(!showSaveDropdown)
                                    }
                                    className='inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 hover:border-green-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500'
                                >
                                    <svg
                                        className='w-3.5 h-3.5'
                                        fill='none'
                                        stroke='currentColor'
                                        viewBox='0 0 24 24'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4'
                                        />
                                    </svg>
                                    Save
                                    <svg
                                        className='w-3 h-3'
                                        fill='currentColor'
                                        viewBox='0 0 20 20'
                                    >
                                        <path
                                            fillRule='evenodd'
                                            d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z'
                                            clipRule='evenodd'
                                        />
                                    </svg>
                                </button>
                                {showSaveDropdown && (
                                    <div className='absolute top-full mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-20'>
                                        <button
                                            onClick={() =>
                                                savePipelineAsTemplate(false)
                                            }
                                            className='w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 rounded-t-lg transition-colors'
                                        >
                                            <span className='inline-flex items-center gap-1'>
                                                <svg
                                                    className='w-3.5 h-3.5'
                                                    fill='none'
                                                    stroke='currentColor'
                                                    viewBox='0 0 24 24'
                                                >
                                                    <path
                                                        strokeLinecap='round'
                                                        strokeLinejoin='round'
                                                        strokeWidth={2}
                                                        d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v3'
                                                    />
                                                </svg>
                                                Save Pipeline
                                            </span>
                                        </button>
                                        <button
                                            onClick={() =>
                                                savePipelineAsTemplate(true)
                                            }
                                            className='w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 rounded-b-lg transition-colors'
                                        >
                                            <span className='inline-flex items-center gap-1'>
                                                <svg
                                                    className='w-3.5 h-3.5'
                                                    fill='none'
                                                    stroke='currentColor'
                                                    viewBox='0 0 24 24'
                                                >
                                                    <path
                                                        strokeLinecap='round'
                                                        strokeLinejoin='round'
                                                        strokeWidth={2}
                                                        d='M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-3M8 7V5a2 2 0 012-2h6l4 4v6a2 2 0 01-2 2h-2'
                                                    />
                                                </svg>
                                                Save As Copy
                                            </span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={formatCanvas}
                                className='inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 hover:border-purple-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500'
                            >
                                <svg
                                    className='w-3.5 h-3.5'
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
                                    />
                                </svg>
                                Format
                            </button>
                        </div>
                    )}

                    {/* Right: Enhanced Title */}
                    <div className='flex items-center gap-3'>
                        <div className='flex items-center gap-2'>
                            <div className='w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full'></div>
                            <h1 className='text-sm font-bold text-gray-900 tracking-tight'>
                                {isReadOnly
                                    ? 'Pipeline Preview'
                                    : 'Pipeline Canvas'}
                            </h1>
                        </div>
                        {isReadOnly && (
                            <span className='inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full border border-blue-200'>
                                <svg
                                    className='w-3 h-3'
                                    fill='currentColor'
                                    viewBox='0 0 20 20'
                                >
                                    <path
                                        fillRule='evenodd'
                                        d='M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z'
                                        clipRule='evenodd'
                                    />
                                </svg>
                                Read Only
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Canvas Area */}
            <div className='flex-1 relative bg-gray-50'>
                <div className='absolute inset-0' ref={reactFlowWrapper}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={isReadOnly ? undefined : onNodesChange}
                        onEdgesChange={isReadOnly ? undefined : onEdgesChange}
                        onConnect={isReadOnly ? undefined : onConnect}
                        onInit={setReactFlowInstance}
                        onDrop={isReadOnly ? undefined : onDrop}
                        onDragOver={isReadOnly ? undefined : onDragOver}
                        onNodeClick={isReadOnly ? undefined : onNodeClick}
                        onNodeDoubleClick={
                            isReadOnly ? undefined : onNodeDoubleClick
                        }
                        nodeTypes={nodeTypes}
                        fitView
                        className={`bg-gradient-to-br from-slate-50 to-blue-50 ${
                            isReadOnly ? 'pointer-events-none' : ''
                        }`}
                        defaultEdgeOptions={{
                            animated: !isReadOnly,
                            style: {stroke: '#3b82f6', strokeWidth: 3},
                        }}
                        snapToGrid={!isReadOnly}
                        snapGrid={[25, 25]}
                        connectionLineStyle={{
                            stroke: '#3b82f6',
                            strokeWidth: 3,
                            strokeDasharray: '5,5',
                        }}
                        deleteKeyCode={
                            isReadOnly ? [] : ['Backspace', 'Delete']
                        }
                        nodesDraggable={!isReadOnly}
                        nodesConnectable={!isReadOnly}
                        elementsSelectable={!isReadOnly}
                    >
                        <Controls
                            position='bottom-left'
                            showZoom={true}
                            showFitView={true}
                            showInteractive={true}
                            className='bg-card/95 backdrop-blur-md border border-light rounded-xl shadow-xl'
                        />
                        <MiniMap
                            nodeStrokeColor='#4f46e5'
                            nodeColor='#f1f5f9'
                            nodeBorderRadius={12}
                            position='bottom-right'
                            className='bg-card/95 backdrop-blur-md border border-light rounded-xl shadow-xl'
                            pannable
                            zoomable
                        />
                        <Background color='#e2e8f0' gap={25} size={1.5} />
                    </ReactFlow>
                </div>

                {/* Modern Connector Toolbar (Top) - Hidden in read-only mode */}
                {!isReadOnly && (
                    <div className='absolute top-0 left-0 right-0 z-40'>
                        <ModernConnectorToolbar onDragStart={onDragStart} />
                    </div>
                )}
            </div>

            {/* Right Panels */}
            {showPanels && (
                <PipelinePanels
                    config={pipelineConfig}
                    onConfigChange={setPipelineConfig}
                />
            )}

            {/* Copy from Template Modal */}
            {showTemplateModal && (
                <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
                    <div className='bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden'>
                        <div className='p-6 border-b border-gray-200'>
                            <div className='flex items-center justify-between'>
                                <h2 className='text-xl font-semibold text-gray-900'>
                                    Copy from Existing Pipeline
                                </h2>
                                <button
                                    onClick={() => setShowTemplateModal(false)}
                                    className='text-gray-400 hover:text-gray-600 transition-colors'
                                >
                                    <svg
                                        className='w-6 h-6'
                                        fill='none'
                                        stroke='currentColor'
                                        viewBox='0 0 24 24'
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
                            <p className='text-gray-600 mt-2'>
                                Select a pipeline template to copy its
                                configuration to your current pipeline.
                            </p>
                        </div>

                        <div className='p-6 overflow-y-auto max-h-[60vh]'>
                            {availableTemplates.length === 0 ? (
                                <div className='text-center py-12'>
                                    <svg
                                        className='w-16 h-16 text-gray-300 mx-auto mb-4'
                                        fill='none'
                                        stroke='currentColor'
                                        viewBox='0 0 24 24'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={1}
                                            d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                                        />
                                    </svg>
                                    <h3 className='text-lg font-medium text-gray-900 mb-2'>
                                        No Templates Available
                                    </h3>
                                    <p className='text-gray-600'>
                                        Create some pipeline templates first to
                                        copy from them.
                                    </p>
                                </div>
                            ) : (
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                    {availableTemplates.map((template) => (
                                        <div
                                            key={template.id}
                                            className='border border-gray-200 rounded-lg p-4 hover:border-orange-500 hover:shadow-md transition-all duration-200 cursor-pointer'
                                            onClick={() => {
                                                handleCopyFromTemplate(
                                                    template.id,
                                                );
                                                setShowTemplateModal(false);
                                            }}
                                        >
                                            <div className='flex items-start justify-between'>
                                                <div className='flex-1'>
                                                    <h3 className='font-semibold text-gray-900 mb-1'>
                                                        {template.name}
                                                    </h3>
                                                    <p className='text-sm text-gray-600 mb-2'>
                                                        {template.description}
                                                    </p>
                                                    <div className='flex items-center space-x-4 text-xs text-gray-500'>
                                                        <span>
                                                            <strong>
                                                                Type:
                                                            </strong>{' '}
                                                            {
                                                                template.deploymentType
                                                            }
                                                        </span>
                                                        <span>
                                                            <strong>
                                                                Created:
                                                            </strong>{' '}
                                                            {
                                                                template.creationDate
                                                            }
                                                        </span>
                                                    </div>
                                                    {template.details && (
                                                        <div className='mt-2 text-xs text-gray-500'>
                                                            <span>
                                                                <strong>
                                                                    Enterprise:
                                                                </strong>{' '}
                                                                {
                                                                    template
                                                                        .details
                                                                        .enterprise
                                                                }{' '}
                                                                |
                                                                <strong>
                                                                    {' '}
                                                                    Entity:
                                                                </strong>{' '}
                                                                {
                                                                    template
                                                                        .details
                                                                        .entity
                                                                }
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div
                                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        template.status ===
                                                        'Active'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                    }`}
                                                >
                                                    {template.status}
                                                </div>
                                            </div>
                                            <div className='mt-3 flex items-center justify-between'>
                                                <div className='flex items-center text-orange-600'>
                                                    <svg
                                                        className='w-4 h-4 mr-1'
                                                        fill='none'
                                                        stroke='currentColor'
                                                        viewBox='0 0 24 24'
                                                    >
                                                        <path
                                                            strokeLinecap='round'
                                                            strokeLinejoin='round'
                                                            strokeWidth={2}
                                                            d='M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z'
                                                        />
                                                    </svg>
                                                    <span className='text-sm font-medium'>
                                                        Click to Copy
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function WorkflowBuilder({
    templateId,
    templateData,
}: WorkflowBuilderProps) {
    return (
        <ReactFlowProvider>
            <WorkflowBuilderContent
                templateId={templateId}
                templateData={templateData}
            />
        </ReactFlowProvider>
    );
}
