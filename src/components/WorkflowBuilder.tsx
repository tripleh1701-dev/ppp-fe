'use client';

import {useCallback, useState, useRef, useEffect} from 'react';
import ReactFlow, {
    Node,
    Edge,
    addEdge,
    Connection,
    useNodesState,
    useEdgesState,
    Background,
    BackgroundVariant,
    ReactFlowProvider,
    ReactFlowProps,
    NodeProps,
    EdgeProps,
    NodeChange,
    EdgeChange,
    ReactFlowInstance,
    MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

import Sidebar from './Sidebar';
import ConnectorSlidingPanel from './ConnectorSlidingPanel';
import PipelineHeader from './PipelineHeader';
import WorkflowNode from './WorkflowNode';
import PipelinePanels from './PipelinePanels';
import PipelineCanvasToolbar from './PipelineCanvasToolbar';

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
    const [reactFlowInstance, setReactFlowInstance] =
        useState<ReactFlowInstance | null>(null);
    const [showPanels, setShowPanels] = useState(false);

    // State for toolbar functionality
    type BackgroundType = 'dots' | 'lines' | 'cross' | 'solid';
    const [backgroundType, setBackgroundType] =
        useState<BackgroundType>('dots');

    // Handle background type changes
    useEffect(() => {
        console.log('Background type changed to:', backgroundType);
        // Force a refresh of the canvas when background type changes
        if (reactFlowInstance) {
            // First, update the background element's visibility
            const bg = document.querySelector(
                '.react-flow__background',
            ) as HTMLElement;
            if (bg) {
                bg.style.display =
                    backgroundType === 'solid' ? 'none' : 'block';
                bg.style.opacity = backgroundType === 'dots' ? '0.4' : '0.3';
            }

            // Then, force a re-render by temporarily hiding and showing
            setTimeout(() => {
                if (bg) {
                    const currentDisplay = bg.style.display;
                    bg.style.display = 'none';
                    bg.offsetHeight; // Force reflow
                    bg.style.display = currentDisplay;
                }
                // Finally, fit view to ensure everything is properly positioned
                reactFlowInstance.fitView({padding: 0.1});
            }, 50);
        }
    }, [backgroundType, reactFlowInstance]);
    type LineStyle = {
        type: 'smoothstep' | 'straight' | 'bezier';
        pattern: 'solid' | 'dotted' | 'dashed';
        thickness: number;
        animated: boolean;
        color: string;
        showArrow: boolean;
        arrowPosition: 'start' | 'end' | 'both';
    };

    const [lineStyle, setLineStyle] = useState<LineStyle>({
        type: 'smoothstep', // smooth type
        pattern: 'solid', // solid pattern
        thickness: 1, // thin thickness
        animated: false, // static animation
        color: '#3b82f6', // default blue color
        showArrow: true, // show arrow
        arrowPosition: 'end', // arrow at end
    });
    const [history, setHistory] = useState<{nodes: Node[]; edges: Edge[]}[]>(
        [],
    );
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [clipboard, setClipboard] = useState<{
        nodes: Node[];
        edges: Edge[];
    } | null>(null);

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

        // Get viewport dimensions
        const {width} = reactFlowWrapper.current?.getBoundingClientRect() || {
            width: 1000,
        };
        const centerX = width / 2;

        // Create a map to store node dependencies
        const incomingEdges = new Map<string, string[]>();
        const outgoingEdges = new Map<string, string[]>();
        const nodeLevels = new Map<string, number>();

        // Initialize edge maps
        nodes.forEach((node) => {
            incomingEdges.set(node.id, []);
            outgoingEdges.set(node.id, []);
        });

        // Build edge relationships
        edges.forEach((edge) => {
            const sourceOutgoing = outgoingEdges.get(edge.source) || [];
            sourceOutgoing.push(edge.target);
            outgoingEdges.set(edge.source, sourceOutgoing);

            const targetIncoming = incomingEdges.get(edge.target) || [];
            targetIncoming.push(edge.source);
            incomingEdges.set(edge.target, targetIncoming);
        });

        // Find root nodes (no incoming edges)
        const rootNodes = nodes
            .filter((node) => (incomingEdges.get(node.id) || []).length === 0)
            .map((node) => node.id);

        // If no root nodes found, use nodes with fewest incoming edges
        if (rootNodes.length === 0) {
            let minIncoming = Infinity;
            nodes.forEach((node) => {
                const incoming = incomingEdges.get(node.id)?.length || 0;
                minIncoming = Math.min(minIncoming, incoming);
            });
            nodes.forEach((node) => {
                if ((incomingEdges.get(node.id)?.length || 0) === minIncoming) {
                    rootNodes.push(node.id);
                }
            });
        }

        // Calculate node levels using topological sort
        const visited = new Set<string>();
        const visiting = new Set<string>();

        const visit = (nodeId: string, level: number = 0) => {
            if (visiting.has(nodeId)) return; // Skip if in current path (cycle)
            if (visited.has(nodeId)) {
                // Update level if this node is reached through a longer path
                const currentLevel = nodeLevels.get(nodeId) || 0;
                nodeLevels.set(nodeId, Math.max(currentLevel, level));
                return;
            }

            visiting.add(nodeId);
            nodeLevels.set(nodeId, level);

            // Visit all children
            const children = outgoingEdges.get(nodeId) || [];
            children.forEach((childId) => {
                visit(childId, level + 1);
            });

            visiting.delete(nodeId);
            visited.add(nodeId);
        };

        // Process all root nodes
        rootNodes.forEach((nodeId) => visit(nodeId));

        // Handle any disconnected nodes or cycles
        nodes.forEach((node) => {
            if (!visited.has(node.id)) {
                const maxLevel = Math.max(
                    ...Array.from(nodeLevels.values()),
                    -1,
                );
                visit(node.id, maxLevel + 1);
            }
        });

        // Group nodes by level
        const nodesByLevel = new Map<number, string[]>();
        nodeLevels.forEach((level, nodeId) => {
            const nodesInLevel = nodesByLevel.get(level) || [];
            nodesInLevel.push(nodeId);
            nodesByLevel.set(level, nodesInLevel);
        });

        // Calculate positions with better spacing
        const verticalGap = 200; // Space between levels
        const horizontalGap = 250; // Space between nodes in the same level
        const startY = 100;

        const updatedNodes = nodes.map((node) => {
            const level = nodeLevels.get(node.id) || 0;
            const nodesInLevel = nodesByLevel.get(level) || [];
            const indexInLevel = nodesInLevel.indexOf(node.id);
            const totalNodesInLevel = nodesInLevel.length;

            // Center nodes horizontally within their level
            const levelWidth = (totalNodesInLevel - 1) * horizontalGap;
            const startX = centerX - levelWidth / 2;
            const x = startX + indexInLevel * horizontalGap;

            return {
                ...node,
                position: {
                    x,
                    y: startY + level * verticalGap,
                },
                style: {
                    ...node.style,
                    zIndex: 1,
                },
            };
        });

        setNodes(updatedNodes);

        // Update edges to be smoother
        const updatedEdges = edges.map((edge) => ({
            ...edge,
            type: lineStyle.type,
            animated: lineStyle.animated,
            style: {
                ...edge.style,
                strokeWidth: lineStyle.thickness,
                stroke: lineStyle.color,
                strokeDasharray:
                    lineStyle.pattern === 'dotted'
                        ? '2,4'
                        : lineStyle.pattern === 'dashed'
                        ? '6,3'
                        : undefined,
            },
        }));
        setEdges(updatedEdges);

        // Auto-fit view after formatting
        setTimeout(() => {
            reactFlowInstance.fitView({padding: 0.2});
        }, 100);
    }, [nodes, edges, setNodes, setEdges, reactFlowInstance, lineStyle]);

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
        (params: Edge | Connection) =>
            setEdges((eds: Edge[]) => {
                // Remove any suggested connections for these nodes
                const filteredEdges = eds.filter((edge: Edge) => {
                    if (edge.data?.suggested) {
                        return !(
                            (edge.source === params.source &&
                                edge.target === params.target) ||
                            (edge.target === params.source &&
                                edge.source === params.target)
                        );
                    }
                    return true;
                });

                // Add the new permanent connection
                return addEdge(
                    {
                        ...params,
                        type: lineStyle.type,
                        animated: lineStyle.animated,
                        style: {
                            stroke: lineStyle.color,
                            strokeWidth: lineStyle.thickness,
                            strokeDasharray:
                                lineStyle.pattern === 'dotted'
                                    ? '2,4'
                                    : lineStyle.pattern === 'dashed'
                                    ? '6,3'
                                    : undefined,
                            filter: 'drop-shadow(0 0 2px rgba(37, 99, 235, 0.3))',
                        },
                        className: 'permanent-connection',
                    },
                    filteredEdges,
                );
            }),
        [setEdges, lineStyle],
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

            // Get the raw position
            const rawPosition = reactFlowInstance.project({
                x: event.clientX - reactFlowBounds.left,
                y: event.clientY - reactFlowBounds.top,
            });

            // Snap to grid
            const position = {
                x: Math.round(rawPosition.x / 12) * 12,
                y: Math.round(rawPosition.y / 12) * 12,
            };

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

            // Add the new node
            setNodes((nds: Node<WorkflowNodeData>[]) => {
                const updatedNodes = nds.concat(newNode);

                // No auto-connect suggestions - just add the new node

                return updatedNodes;
            });
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

    // Update existing edges when line style changes
    useEffect(() => {
        setEdges((eds) =>
            eds.map((edge) => ({
                ...edge,
                type: lineStyle.type,
                animated: lineStyle.animated,
                style: {
                    ...edge.style,
                    stroke: lineStyle.color,
                    strokeWidth: lineStyle.thickness,
                    strokeDasharray:
                        lineStyle.pattern === 'dotted'
                            ? '2,4'
                            : lineStyle.pattern === 'dashed'
                            ? '6,3'
                            : undefined,
                },
                markerEnd:
                    lineStyle.showArrow &&
                    (lineStyle.arrowPosition === 'end' ||
                        lineStyle.arrowPosition === 'both')
                        ? {
                              type: MarkerType.Arrow,
                              color: lineStyle.color,
                              width: 8,
                              height: 8,
                              strokeWidth: 2,
                              className: 'modern-arrow',
                          }
                        : undefined,
                markerStart:
                    lineStyle.showArrow &&
                    (lineStyle.arrowPosition === 'start' ||
                        lineStyle.arrowPosition === 'both')
                        ? {
                              type: MarkerType.Arrow,
                              color: lineStyle.color,
                              width: 8,
                              height: 8,
                              strokeWidth: 2,
                              className: 'modern-arrow',
                          }
                        : undefined,
            })),
        );
    }, [lineStyle, setEdges]);

    // Add styles for suggested connections
    const modernArrowStyles = `
        @keyframes glowPulse {
            0% { filter: drop-shadow(0 0 3px rgba(59, 130, 246, 0.4)); }
            50% { filter: drop-shadow(0 0 6px rgba(59, 130, 246, 0.6)); }
            100% { filter: drop-shadow(0 0 3px rgba(59, 130, 246, 0.4)); }
        }
        @keyframes arrowFloat {
            0% { transform: translateX(0); }
            50% { transform: translateX(2px); }
            100% { transform: translateX(0); }
        }
        .react-flow__edge {
            transition: all 0.3s ease;
        }
        .react-flow__edge:hover {
            animation: glowPulse 1.5s infinite;
        }
        .react-flow__edge.selected {
            animation: glowPulse 1.5s infinite;
        }
        .react-flow__edge-path {
            transition: all 0.3s ease;
            stroke-linecap: round;
            stroke-linejoin: round;
        }
        .react-flow__edge:hover .react-flow__edge-path {
            stroke-width: 2.5px;
        }
        .react-flow__edge.selected .react-flow__edge-path {
            stroke-width: 2.5px;
        }
        .react-flow__arrowhead {
            transition: all 0.3s ease;
            stroke-linecap: round;
            stroke-linejoin: round;
            fill: currentColor;
            stroke: none;
            filter: drop-shadow(0 0 1px rgba(59, 130, 246, 0.3));
        }
        .react-flow__edge:hover .react-flow__arrowhead {
            transform: scale(1.05);
            animation: arrowFloat 1.2s ease-in-out infinite;
            filter: drop-shadow(0 0 2px rgba(59, 130, 246, 0.5));
        }
        .react-flow__edge.selected .react-flow__arrowhead {
            transform: scale(1.05);
            animation: arrowFloat 1.2s ease-in-out infinite;
            filter: drop-shadow(0 0 2px rgba(59, 130, 246, 0.5));
        }
    `;

    const connectionStyles = `
        .permanent-connection {
            transition: all 0.3s ease-in-out;
        }
        .permanent-connection:hover {
            filter: drop-shadow(0 0 4px rgba(37, 99, 235, 0.5)) !important;
        }
    `;

    return (
        <div className='flex flex-col h-full bg-gray-50'>
            <style>{modernArrowStyles + connectionStyles}</style>
            {/* Pipeline Header - Below Breadcrumbs */}
            <div className='bg-white border-b border-gray-200 px-4 py-2 flex-shrink-0 shadow-sm'>
                <div className='flex items-center justify-between gap-4'>
                    {/* Left: Pipeline Info with Better Spacing */}
                    <div className='flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl px-4 py-2 w-fit'>
                        {/* Pipeline Name Section */}
                        <div className='flex items-center gap-2 min-w-0'>
                            <div className='flex items-center gap-2'>
                                <div className='w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full flex-shrink-0'></div>
                                <span className='text-xs font-medium text-gray-600 whitespace-nowrap'>
                                    Pipeline:
                                </span>
                            </div>
                            <input
                                type='text'
                                value={pipelineName}
                                onChange={(
                                    e: React.ChangeEvent<HTMLInputElement>,
                                ) => setPipelineName(e.target.value)}
                                className='text-sm font-semibold text-gray-900 bg-white border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                placeholder='Enter pipeline name'
                                disabled={isReadOnly}
                                style={{minWidth: '150px', width: '150px'}}
                            />
                        </div>

                        {/* Gradient Separator */}
                        <div className='w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full'></div>

                        {/* Service Section */}
                        <div className='flex items-center gap-2'>
                            <span className='text-xs font-medium text-gray-600 whitespace-nowrap'>
                                Service:
                            </span>
                            <select
                                value={deploymentType}
                                onChange={(
                                    e: React.ChangeEvent<HTMLSelectElement>,
                                ) => setDeploymentType(e.target.value)}
                                className='text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer'
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

                        {/* Gradient Separator */}
                        <div className='w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full'></div>

                        {/* Entity Section */}
                        <div className='flex items-center gap-2'>
                            <span className='text-xs font-medium text-gray-600 whitespace-nowrap'>
                                Entity:
                            </span>
                            <select
                                value={entity}
                                onChange={(
                                    e: React.ChangeEvent<HTMLSelectElement>,
                                ) => setEntity(e.target.value)}
                                className='text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer'
                                disabled={isReadOnly}
                            >
                                <option value=''>Select Entity</option>
                                <option value='Customer'>Customer</option>
                                <option value='Product'>Product</option>
                                <option value='Order'>Order</option>
                                <option value='Invoice'>Invoice</option>
                                <option value='Employee'>Employee</option>
                                <option value='Vendor'>Vendor</option>
                                <option value='Contract'>Contract</option>
                                <option value='Asset'>Asset</option>
                            </select>
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
            <div
                className={`flex-1 relative ${
                    backgroundType === 'solid' ? 'bg-white' : 'bg-gray-50'
                }`}
            >
                <div
                    className='absolute inset-0'
                    ref={reactFlowWrapper}
                    onDrop={isReadOnly ? undefined : onDrop}
                    onDragOver={isReadOnly ? undefined : onDragOver}
                >
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={isReadOnly ? undefined : onNodesChange}
                        onEdgesChange={isReadOnly ? undefined : onEdgesChange}
                        onConnect={isReadOnly ? undefined : onConnect}
                        onInit={setReactFlowInstance}
                        onNodeClick={isReadOnly ? undefined : onNodeClick}
                        onNodeDoubleClick={
                            isReadOnly ? undefined : onNodeDoubleClick
                        }
                        nodeTypes={nodeTypes}
                        fitView
                        nodesDraggable={!isReadOnly}
                        nodesConnectable={!isReadOnly}
                        defaultEdgeOptions={{
                            type: 'smoothstep',
                            animated: false,
                            style: {
                                stroke: '#3b82f6',
                                strokeWidth: 1,
                                strokeDasharray: undefined,
                            },
                            markerEnd:
                                lineStyle.showArrow &&
                                (lineStyle.arrowPosition === 'end' ||
                                    lineStyle.arrowPosition === 'both')
                                    ? {
                                          type: MarkerType.Arrow,
                                          color: lineStyle.color,
                                          width: 8,
                                          height: 8,
                                          strokeWidth: 2,
                                          className: 'modern-arrow',
                                      }
                                    : undefined,
                            markerStart:
                                lineStyle.showArrow &&
                                (lineStyle.arrowPosition === 'start' ||
                                    lineStyle.arrowPosition === 'both')
                                    ? {
                                          type: MarkerType.Arrow,
                                          color: lineStyle.color,
                                          width: 8,
                                          height: 8,
                                          strokeWidth: 2,
                                          className: 'modern-arrow',
                                      }
                                    : undefined,
                        }}
                        snapToGrid={!isReadOnly}
                        snapGrid={[25, 25]}
                        connectionLineStyle={{
                            stroke: lineStyle.color,
                            strokeWidth: lineStyle.thickness,
                            strokeDasharray:
                                lineStyle.pattern === 'dotted'
                                    ? '2,4'
                                    : lineStyle.pattern === 'dashed'
                                    ? '6,3'
                                    : undefined,
                            markerEnd: {
                                type: MarkerType.Arrow,
                                color: lineStyle.color,
                                width: 8,
                                height: 8,
                                strokeWidth: 2,
                            },
                        }}
                        deleteKeyCode={
                            isReadOnly ? [] : ['Backspace', 'Delete']
                        }
                        elementsSelectable={!isReadOnly}
                    >
                        <Background
                            id='react-flow-background'
                            variant={
                                backgroundType === 'dots'
                                    ? BackgroundVariant.Dots
                                    : backgroundType === 'lines'
                                    ? BackgroundVariant.Lines
                                    : backgroundType === 'cross'
                                    ? BackgroundVariant.Cross
                                    : undefined
                            }
                            color={
                                backgroundType === 'solid'
                                    ? 'transparent'
                                    : '#475569'
                            }
                            gap={
                                backgroundType === 'dots'
                                    ? 20
                                    : backgroundType === 'lines'
                                    ? 30
                                    : backgroundType === 'cross'
                                    ? 30
                                    : 20
                            }
                            size={
                                backgroundType === 'dots'
                                    ? 1
                                    : backgroundType === 'lines'
                                    ? 1
                                    : backgroundType === 'cross'
                                    ? 1
                                    : 1
                            }
                            style={{
                                display:
                                    backgroundType === 'solid'
                                        ? 'none'
                                        : 'block',
                                opacity: backgroundType === 'dots' ? 0.4 : 0.3,
                            }}
                        />
                    </ReactFlow>

                    {/* Mural/Miro themed action toolbar */}
                    <PipelineCanvasToolbar
                        lineStyle={lineStyle}
                        backgroundType={backgroundType}
                        onBackgroundChange={setBackgroundType}
                        onLineStyleChange={(newStyle) => {
                            setLineStyle((prev) => ({...prev, ...newStyle}));
                            // Force a refresh of the edges
                            setTimeout(() => {
                                if (reactFlowInstance) {
                                    reactFlowInstance.fitView();
                                }
                            }, 0);
                        }}
                        onAddStickyNote={() => {
                            // Add a sticky note node to the canvas
                            const newNode = {
                                id: generateNodeId(),
                                type: 'workflowNode',
                                position: {
                                    x:
                                        Math.round(
                                            (Math.random() * 200 + 100) / 12,
                                        ) * 12,
                                    y:
                                        Math.round(
                                            (Math.random() * 200 + 100) / 12,
                                        ) * 12,
                                },
                                data: {
                                    type: 'note' as WorkflowNodeType,
                                    label: 'Sticky Note',
                                    status: 'pending' as const,
                                    identifier: 'sticky_note',
                                    stage: 'Note',
                                },
                            };
                            setNodes((nds) => [...nds, newNode]);
                        }}
                        onImportPipeline={async () => {
                            // Create file input for importing YAML
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = '.yaml,.yml';
                            input.onchange = async (e) => {
                                const target = e?.target as HTMLInputElement;
                                const file = target?.files?.[0];
                                if (file) {
                                    const text = await file.text();
                                    try {
                                        const data = convertFromYAML(text);
                                        // Set the imported pipeline data
                                        console.log('Imported pipeline:', data);
                                        alert(
                                            'Pipeline imported successfully!',
                                        );
                                    } catch (error) {
                                        console.error('Import error:', error);
                                        alert(
                                            'Failed to import pipeline. Please check the file format.',
                                        );
                                    }
                                }
                            };
                            input.click();
                        }}
                        onExportPipeline={async () => {
                            try {
                                // Validate that we have nodes to export
                                if (!nodes || nodes.length === 0) {
                                    alert(
                                        'No pipeline stages to export. Please add some stages first.',
                                    );
                                    return;
                                }

                                // Convert current pipeline to YAML and download
                                const metadata = {
                                    name: `Pipeline-${Date.now()}`,
                                    description: 'Exported pipeline',
                                    enterprise: enterprise || 'Default',
                                    entity: entity || 'Default',
                                    deploymentType: 'Integration' as const,
                                };

                                console.log(
                                    'Exporting pipeline with',
                                    nodes.length,
                                    'stages',
                                );
                                const yamlContent = convertToYAML(
                                    nodes,
                                    edges,
                                    metadata,
                                );

                                const blob = new Blob([yamlContent], {
                                    type: 'text/yaml',
                                });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `pipeline-${Date.now()}.yaml`;
                                a.click();
                                URL.revokeObjectURL(url);

                                // Show success message with details
                                const stageNames = nodes
                                    .map(
                                        (node) =>
                                            node.data.label ||
                                            `stage-${node.id}`,
                                    )
                                    .join(', ');
                                console.log(
                                    `Pipeline exported successfully with ${nodes.length} stages: ${stageNames}`,
                                );

                                // Optional: Show a brief success message (uncomment if desired)
                                // alert(`Pipeline exported successfully!\n\nStages included: ${stageNames}\nTotal stages: ${nodes.length}`);
                            } catch (error) {
                                console.error('Export error:', error);
                                alert(
                                    'Failed to export pipeline. Please check the console for details.',
                                );
                            }
                        }}
                        onSavePipeline={async () => {
                            try {
                                // Validate that we have nodes to save
                                if (!nodes || nodes.length === 0) {
                                    alert(
                                        'No pipeline stages to save. Please add some stages first.',
                                    );
                                    return;
                                }

                                const metadata = {
                                    name: `Pipeline-${Date.now()}`,
                                    description: 'Saved pipeline',
                                    enterprise: enterprise || 'Default',
                                    entity: entity || 'Default',
                                    deploymentType: 'Integration' as const,
                                };

                                console.log(
                                    'Saving pipeline with',
                                    nodes.length,
                                    'stages',
                                );
                                const yamlContent = convertToYAML(
                                    nodes,
                                    edges,
                                    metadata,
                                );

                                await savePipelineYAML(
                                    'current-pipeline',
                                    yamlContent,
                                );

                                // Show success message with more details
                                const stageNames = nodes
                                    .map(
                                        (node) =>
                                            node.data.label ||
                                            `stage-${node.id}`,
                                    )
                                    .join(', ');
                                alert(
                                    `Pipeline saved successfully!\n\nStages included: ${stageNames}\nTotal stages: ${nodes.length}`,
                                );
                            } catch (error) {
                                console.error('Save error:', error);
                                alert(
                                    'Failed to save pipeline. Please check the console for details.',
                                );
                            }
                        }}
                        onLoadPipeline={async () => {
                            try {
                                const savedPipelines =
                                    await getAllPipelineYAMLs();
                                const pipelineKeys =
                                    Object.keys(savedPipelines);
                                if (pipelineKeys.length > 0) {
                                    // For now, load the first saved pipeline
                                    // TODO: Show a selection dialog
                                    const yamlContent = await loadPipelineYAML(
                                        pipelineKeys[0],
                                    );
                                    if (yamlContent) {
                                        const pipelineData =
                                            convertFromYAML(yamlContent);
                                        // Set the loaded pipeline data - would need proper conversion
                                        console.log(
                                            'Loaded pipeline:',
                                            pipelineData,
                                        );
                                        alert('Pipeline loaded successfully!');
                                    } else {
                                        alert(
                                            'Failed to load pipeline content.',
                                        );
                                    }
                                } else {
                                    alert('No saved pipelines found.');
                                }
                            } catch (error) {
                                console.error('Load error:', error);
                                alert('Failed to load pipeline.');
                            }
                        }}
                        onAddComment={() => {
                            // Add a comment node to the canvas
                            const newNode = {
                                id: generateNodeId(),
                                type: 'workflowNode',
                                position: {
                                    x: Math.random() * 300 + 200,
                                    y: Math.random() * 300 + 100,
                                },
                                data: {
                                    type: 'comment' as WorkflowNodeType,
                                    label: 'Comment',
                                    status: 'pending' as const,
                                    identifier: 'comment',
                                    stage: 'Comment',
                                },
                            };
                            setNodes((nds) => [...nds, newNode]);
                        }}
                        onToggleGrid={() => {
                            // This is now handled by onBackgroundChange
                            console.log(
                                'Grid toggle is now handled by background menu',
                            );
                        }}
                        onUndo={() => {
                            // Simple undo functionality - remove last added node
                            if (nodes.length > 0) {
                                const lastNodeIndex = nodes.length - 1;
                                const newNodes = nodes.slice(0, lastNodeIndex);
                                setNodes(newNodes);
                                console.log('Undo: Removed last node');
                            }
                        }}
                        onRedo={() => {
                            // Simple redo functionality placeholder
                            console.log(
                                'Redo - Advanced history management coming soon',
                            );
                        }}
                        onCopySelection={() => {
                            if (reactFlowInstance) {
                                const selectedNodes = nodes.filter(
                                    (node) => node.selected,
                                );
                                const selectedEdges = edges.filter(
                                    (edge) => edge.selected,
                                );
                                if (
                                    selectedNodes.length > 0 ||
                                    selectedEdges.length > 0
                                ) {
                                    const clipboard = {
                                        nodes: selectedNodes,
                                        edges: selectedEdges,
                                    };
                                    navigator.clipboard.writeText(
                                        JSON.stringify(clipboard),
                                    );
                                    console.log(
                                        'Selection copied to clipboard',
                                    );
                                }
                            }
                        }}
                        onPasteSelection={async () => {
                            try {
                                // Try to get clipboard data
                                const clipboardText =
                                    await navigator.clipboard.readText();
                                const clipboardData = JSON.parse(clipboardText);

                                if (
                                    clipboardData.nodes &&
                                    Array.isArray(clipboardData.nodes)
                                ) {
                                    // Clear current selection
                                    const clearedNodes = nodes.map((node) => ({
                                        ...node,
                                        selected: false,
                                    }));

                                    // Create new nodes with offset position and new IDs
                                    const newNodes = clipboardData.nodes.map(
                                        (node: any) => ({
                                            ...node,
                                            id: generateNodeId(),
                                            position: {
                                                x: node.position.x + 50, // Offset by 50px
                                                y: node.position.y + 50,
                                            },
                                            selected: true, // Select the pasted nodes
                                        }),
                                    );

                                    setNodes([...clearedNodes, ...newNodes]);
                                    console.log('Pasted nodes from clipboard');
                                } else {
                                    console.log('No valid nodes in clipboard');
                                }
                            } catch (error) {
                                console.log(
                                    'No valid clipboard data or paste permission denied',
                                );
                            }
                        }}
                        isReadOnly={isReadOnly}
                    />
                </div>

                {/* Connector Sliding Panel - Hidden in read-only mode */}
                {!isReadOnly && (
                    <div className='absolute left-0 top-0 bottom-0 z-40'>
                        <ConnectorSlidingPanel
                            onConnectorSelect={(nodeType) => {
                                // Handle connector selection if needed
                                console.log('Connector selected:', nodeType);
                            }}
                            onDragStart={onDragStart}
                        />
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
