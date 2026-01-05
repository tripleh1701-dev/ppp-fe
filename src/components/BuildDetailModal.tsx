'use client';

import React, {useState, useEffect} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {createPortal} from 'react-dom';
import {
    X,
    Play,
    Trash2,
    Clock,
    GitBranch,
    Edit,
    Copy,
    ChevronDown,
    ChevronUp,
    Settings,
    Terminal,
    Hammer,
    Search,
} from 'lucide-react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import {BuildRow} from './BuildsTable';
import {api} from '../utils/api';
import {convertFromYAML, PipelineYAML} from '../utils/yamlPipelineUtils';
import yaml from 'js-yaml';

interface BuildExecution {
    id: string;
    buildNumber: number;
    branch: string;
    status: 'success' | 'failed' | 'running' | 'pending';
    timestamp: string;
    duration: string;
    jiraNumber?: string;
    qaApprover?: string;
    prodApprover?: string;
    snowNPCM?: string;
    snowCM?: string;
}

interface BuildDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRunBuild?: () => void;
    buildRow?: BuildRow | null;
    selectedEnterprise?: string;
    selectedEnterpriseId?: string;
    selectedAccountId?: string;
    selectedAccountName?: string;
}

interface ConfigField {
    key: string;
    label: string;
    value: string;
    type: 'plan' | 'approval' | 'release';
    nodeName?: string;
    toolName?: string;
}

export default function BuildDetailModal({
    isOpen,
    onClose,
    onRunBuild,
    buildRow,
    selectedEnterprise = '',
    selectedEnterpriseId = '',
    selectedAccountId = '',
    selectedAccountName = '',
}: BuildDetailModalProps) {
    const [isRunning, setIsRunning] = useState(false);
    const [showConfig, setShowConfig] = useState(true);
    const [showHistory, setShowHistory] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [configFields, setConfigFields] = useState<ConfigField[]>([]);
    const [configData, setConfigData] = useState<Record<string, string>>({});

    // Create a default buildRow if none provided (for new builds)
    const defaultBuildRow: BuildRow = {
        id: `tmp-${Date.now()}`,
        connectorName: '',
        description: '',
        entity: '',
        product: 'DevOps',
        service: 'Integration',
        status: 'ACTIVE',
        scope: '',
    };

    const currentBuildRow = buildRow || defaultBuildRow;

    // Extract tool name from stage type (e.g., "plan_jira" -> "JIRA", "release_servicenow" -> "ServiceNow")
    const getToolNameFromStageType = (stageType: string): string => {
        const parts = stageType.split('_');
        if (parts.length > 1) {
            const toolPart = parts.slice(1).join('_');
            // Capitalize first letter and handle camelCase/snake_case
            return toolPart
                .split(/[_\s]+/)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
        }
        return '';
    };

    // Fetch and parse pipeline YAML to generate config fields
    useEffect(() => {
        const fetchPipelineConfig = async () => {
            if (!buildRow?.pipeline || !selectedAccountId || !selectedEnterpriseId) {
                setConfigFields([]);
                setConfigData({});
                return;
            }

            try {
                // Fetch pipeline data
                const apiUrl = `/api/pipeline-canvas?accountId=${selectedAccountId}&enterpriseId=${selectedEnterpriseId}`;
                const response: any = await api.get(apiUrl);
                const pipelines = Array.isArray(response) ? response : response.data || [];
                
                const pipeline = pipelines.find((p: any) => p.pipelineName === buildRow.pipeline);
                if (!pipeline || !pipeline.yamlContent) {
                    console.warn(`Pipeline "${buildRow.pipeline}" not found or has no YAML content`);
                    setConfigFields([]);
                    setConfigData({});
                    return;
                }

                // Parse YAML
                const pipelineYAML = yaml.load(pipeline.yamlContent) as PipelineYAML;
                if (!pipelineYAML || pipelineYAML.kind !== 'Pipeline') {
                    console.warn(`Invalid pipeline YAML format for "${buildRow.pipeline}"`);
                    setConfigFields([]);
                    setConfigData({});
                    return;
                }

                // Convert to nodes and edges
                const {nodes, edges} = convertFromYAML(pipeline.yamlContent);
                
                console.log('🔍 [BuildDetailModal] Parsed nodes and edges:', {
                    nodesCount: nodes.length,
                    edgesCount: edges.length,
                    nodes: nodes.map(n => ({ id: n.id, type: n.data.type, label: n.data.label })),
                    edges: edges.map(e => ({ source: e.source, target: e.target }))
                });
                
                // Group stages by nodes
                const nodeMap = new Map<string, Array<{name: string; type: string}>>();
                
                // Identify node stages (environments)
                const nodeStages = nodes.filter(n => 
                    n.data.type === 'node_dev' || 
                    n.data.type === 'node_qa' || 
                    n.data.type === 'node_prod'
                );

                // Helper function to find which node (Development, QA, Prod) a stage belongs to via incoming edges
                const findNodeForStage = (stageNodeId: string, visited: Set<string> = new Set()): any => {
                    if (visited.has(stageNodeId)) return null;
                    visited.add(stageNodeId);
                    
                    const incomingEdges = edges.filter(e => e.target === stageNodeId);
                    if (incomingEdges.length === 0) {
                        return null; // No incoming edges, can't determine node
                    }
                    
                    // Check all source nodes
                    for (const edge of incomingEdges) {
                        const sourceNode = nodes.find(n => n.id === edge.source);
                        if (!sourceNode) continue;
                        
                        // If source is a node (Development, QA, Prod), return it
                        if (sourceNode.data.type === 'node_dev' || 
                            sourceNode.data.type === 'node_qa' || 
                            sourceNode.data.type === 'node_prod') {
                            return sourceNode;
                        }
                        
                        // Otherwise, recursively check the source node's incoming edges
                        const parentNode = findNodeForStage(edge.source, visited);
                        if (parentNode) {
                            return parentNode;
                        }
                    }
                    
                    return null;
                };

                // Group stages by which node they belong to
                nodes.forEach(node => {
                    // Skip node stages themselves (Development, QA, Prod)
                    if (node.data.type === 'node_dev' || 
                        node.data.type === 'node_qa' || 
                        node.data.type === 'node_prod') {
                        return;
                    }

                    // Skip stages with categories Code, Test, Build, Deploy
                    const stageType = node.data.type || '';
                    if (stageType.startsWith('code_') || 
                        stageType.startsWith('test_') || 
                        stageType.startsWith('build_') || 
                        stageType.startsWith('deploy_')) {
                        return; // Ignore these categories
                    }

                    // Find which node (Development, QA, Prod) this stage belongs to via incoming edges
                    const nodeStage = findNodeForStage(node.id);
                    
                    if (nodeStage) {
                        const nodeName = nodeStage.data.label || nodeStage.data.type;
                        if (!nodeMap.has(nodeName)) {
                            nodeMap.set(nodeName, []);
                        }
                        nodeMap.get(nodeName)!.push({
                            name: node.data.label || node.data.type,
                            type: node.data.type
                        });
                        console.log(`✅ [BuildDetailModal] Added stage ${node.data.label || node.data.type} (${stageType}) to node ${nodeName}`);
                    } else {
                        console.log(`⚠️ [BuildDetailModal] Could not determine node for stage ${node.data.label || node.data.type} (${stageType})`);
                    }
                });

                // Generate config fields from parsed stages
                const fields: ConfigField[] = [];
                const initialData: Record<string, string> = {};

                console.log('🔍 [BuildDetailModal] Final nodeMap:', Array.from(nodeMap.entries()));

                // Process all nodes (Development, QA, Prod) and their stages
                Array.from(nodeMap.entries()).forEach(([nodeName, stages]) => {
                    console.log(`🔍 [BuildDetailModal] Processing node "${nodeName}" with ${stages.length} stages:`, stages);
                    
                    // Process Plan stages (category, not node) - show as "ToolName#" without node prefix
                    const planStages = stages.filter(s => s.type.startsWith('plan_'));
                    planStages.forEach(stage => {
                        const toolName = getToolNameFromStageType(stage.type);
                        console.log('🔍 [BuildDetailModal] Processing Plan stage:', { stageType: stage.type, toolName, nodeName });
                        if (toolName) {
                            const fieldKey = `plan_${toolName.toLowerCase().replace(/\s+/g, '_')}`;
                            const fieldLabel = `${toolName}#`;
                            // Check if this field already exists (Plan stages from different nodes should share the same field)
                            if (!fields.find(f => f.key === fieldKey)) {
                                fields.push({
                                    key: fieldKey,
                                    label: fieldLabel,
                                    value: '',
                                    type: 'plan',
                                    toolName: toolName
                                });
                                initialData[fieldKey] = '';
                                console.log('✅ [BuildDetailModal] Added Plan field:', { fieldKey, fieldLabel });
                            }
                        }
                    });

                    // Process Approval stages (category) - show as "NodeName Sign off(Approver)"
                    const approvalStages = stages.filter(s => s.type === 'approval' || s.type.includes('approval'));
                    if (approvalStages.length > 0) {
                        const fieldKey = `approval_${nodeName.toLowerCase().replace(/\s+/g, '_')}`;
                        const fieldLabel = `${nodeName} Sign off(Approver)`;
                        fields.push({
                            key: fieldKey,
                            label: fieldLabel,
                            value: '',
                            type: 'approval',
                            nodeName: nodeName
                        });
                        initialData[fieldKey] = '';
                        console.log('✅ [BuildDetailModal] Added Approval field:', { fieldKey, fieldLabel, nodeName });
                    }

                    // Process Release stages (category) - show as "NodeName ToolName#"
                    const releaseStages = stages.filter(s => s.type.startsWith('release_'));
                    releaseStages.forEach(stage => {
                        const toolName = getToolNameFromStageType(stage.type);
                        console.log('🔍 [BuildDetailModal] Processing Release stage:', { stageType: stage.type, toolName, nodeName });
                        if (toolName) {
                            const fieldKey = `release_${nodeName.toLowerCase().replace(/\s+/g, '_')}_${toolName.toLowerCase().replace(/\s+/g, '_')}`;
                            const fieldLabel = `${nodeName} ${toolName}#`;
                            fields.push({
                                key: fieldKey,
                                label: fieldLabel,
                                value: '',
                                type: 'release',
                                nodeName: nodeName,
                                toolName: toolName
                            });
                            initialData[fieldKey] = '';
                            console.log('✅ [BuildDetailModal] Added Release field:', { fieldKey, fieldLabel, nodeName });
                        }
                    });
                });
                
                console.log('🔍 [BuildDetailModal] Generated config fields:', fields);

                setConfigFields(fields);
                setConfigData(initialData);
            } catch (error) {
                console.error(`❌ [BuildDetailModal] Error fetching pipeline config for "${buildRow.pipeline}":`, error);
                setConfigFields([]);
                setConfigData({});
            }
        };

        if (isOpen && buildRow?.pipeline) {
            fetchPipelineConfig();
        } else {
            setConfigFields([]);
            setConfigData({});
        }
    }, [isOpen, buildRow?.pipeline, selectedAccountId, selectedEnterpriseId]);

    // Mock build executions data - replace with actual API call
    const [buildExecutions] = useState<BuildExecution[]>([
        {
            id: '1',
            buildNumber: 3,
            branch: 'main',
            status: 'success',
            timestamp: 'May 2, 2025, 1:43:39 PM',
            duration: '3 min 28',
            jiraNumber: 'JIRA1234',
            qaApprover: 'ABC Approver',
            prodApprover: 'DEF',
        },
        {
            id: '2',
            buildNumber: 2,
            branch: 'main',
            status: 'success',
            timestamp: 'Apr 23, 2025, 11:37:28 AM',
            duration: '3 min 35',
            jiraNumber: 'JIRA1234',
            qaApprover: 'ABC Approver',
            prodApprover: 'DEF',
        },
    ]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'success':
                return 'text-green-600 bg-green-50';
            case 'failed':
                return 'text-red-600 bg-red-50';
            case 'running':
                return 'text-blue-600 bg-blue-50';
            case 'pending':
                return 'text-yellow-600 bg-yellow-50';
            default:
                return 'text-gray-600 bg-gray-50';
        }
    };

    const handleRun = () => {
        setIsRunning(true);
        // Open the execution panel
        onRunBuild?.();
        // Simulate build execution
        setTimeout(() => {
            setIsRunning(false);
        }, 2000);
    };

    const handleResume = (buildId: string) => {
        console.log('Resume build:', buildId);
        // TODO: Implement resume logic
    };

    const handleDelete = (buildId: string) => {
        console.log('Delete build:', buildId);
        // TODO: Implement delete logic
    };

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] overflow-hidden">
                    {/* Backdrop */}
                    <motion.div 
                        className="absolute inset-0 bg-black bg-opacity-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    
                    {/* Modal Panel */}
                    <motion.div 
                        className="absolute right-0 top-0 h-screen w-[750px] shadow-2xl border-l border-gray-200 flex overflow-hidden"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ 
                            type: "spring",
                            stiffness: 300,
                            damping: 30
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Left Panel - Sidebar Image */}
                        <div className="w-10 bg-slate-800 text-white flex flex-col relative h-screen">
                            <img 
                                src="/images/logos/sidebar.png" 
                                alt="Sidebar" 
                                className="w-full h-full object-cover"
                            />
                            
                            {/* Middle Text - Rotated and Bold */}
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -rotate-90 origin-center z-10">
                                <div className="flex items-center space-x-2 text-sm font-bold text-white whitespace-nowrap tracking-wide">
                                    <Hammer className="h-4 w-4" />
                                    <span>Manage Build</span>
                                </div>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 flex flex-col bg-white">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 px-6 py-4 border-b border-blue-500/20 flex-shrink-0">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-blue-100 text-base">Build Details</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={onClose}
                                            className="p-2 text-white/70 hover:text-white hover:bg-white/10 transition-colors rounded-lg"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                                
                                {/* Build Info - Job Name, Pipeline Name, Description */}
                                <div className="mt-4 flex gap-3">
                                    <div className="flex-1 max-w-xs">
                                        <div className="text-blue-100 text-sm font-medium mb-1">Job Name</div>
                                        <div className="bg-white/10 rounded px-2 py-1 backdrop-blur-sm border border-white/20 min-h-[28px] flex items-center">
                                            <div className="text-white font-medium truncate text-xs">{currentBuildRow.connectorName || '\u00A0'}</div>
                                        </div>
                                    </div>
                                    <div className="flex-1 max-w-xs">
                                        <div className="text-blue-100 text-sm font-medium mb-1">Pipeline Name</div>
                                        <div className="bg-white/10 rounded px-2 py-1 backdrop-blur-sm border border-white/20 min-h-[28px] flex items-center">
                                            <div className="text-white font-medium truncate text-xs">{currentBuildRow.pipeline || '\u00A0'}</div>
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-blue-100 text-sm font-medium mb-1">Description</div>
                                        <div className="bg-white/10 rounded px-2 py-1 backdrop-blur-sm border border-white/20 min-h-[28px] flex items-center">
                                            <div className="text-white font-medium truncate text-xs">{currentBuildRow.description || '\u00A0'}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Toolbar - Match AssignedUserGroupModal exactly */}
                            <div className="p-4 border-b border-gray-200 bg-white">
                                <div className="flex items-center justify-between gap-4">
                                    {/* Left side - Global Search */}
                                    <div className="flex items-center">
                                        <div className="relative w-60">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <MagnifyingGlassIcon className="h-5 w-5 text-secondary" />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Global Search"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="search-placeholder block w-full pl-10 pr-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-sm"
                                                style={{ fontSize: '14px' }}
                                            />
                                            {searchTerm && (
                                                <button
                                                    onClick={() => setSearchTerm('')}
                                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                                    title="Clear search"
                                                >
                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Right side - Action Buttons */}
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={handleRun}
                                            disabled={isRunning}
                                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                                                isRunning
                                                    ? 'bg-blue-400 text-white cursor-not-allowed'
                                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                            }`}
                                            title='Run build'
                                        >
                                            <Play size={14} />
                                            Run
                                        </button>
                                        <button
                                            onClick={() => {
                                                // TODO: Implement edit functionality
                                                console.log('Edit build:', currentBuildRow.id);
                                            }}
                                            className='p-1.5 text-gray-600 hover:bg-gray-200 rounded transition-colors'
                                            title='Edit'
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                // TODO: Implement copy functionality
                                                console.log('Copy build:', currentBuildRow.id);
                                            }}
                                            className='p-1.5 text-gray-600 hover:bg-gray-200 rounded transition-colors'
                                            title='Copy'
                                        >
                                            <Copy size={16} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm('Are you sure you want to delete this build?')) {
                                                    // TODO: Implement delete functionality
                                                    console.log('Delete build:', currentBuildRow.id);
                                                    onClose();
                                                }
                                            }}
                                            className='p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors'
                                            title='Delete'
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Content Area - Fixed height and proper overflow */}
                            <div className="flex-1 bg-gray-50 overflow-hidden">
                                <div className="h-full overflow-y-auto px-6 py-6">
                                    <div className="space-y-6">

                                        {/* Build Configuration - Collapsible */}
                                        <div className='bg-white border border-gray-200 rounded-lg'>
                                            <button
                                                onClick={() => setShowConfig(!showConfig)}
                                                className='w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors rounded-t-lg'
                                            >
                                                <div className='flex items-center gap-2'>
                                                    <Settings size={16} className='text-gray-500' />
                                                    <span className='text-base font-semibold text-gray-900'>
                                                        Build Configuration
                                                    </span>
                                                </div>
                                                {showConfig ? (
                                                    <ChevronUp size={16} className='text-gray-500' />
                                                ) : (
                                                    <ChevronDown size={16} className='text-gray-500' />
                                                )}
                                            </button>
                                            {showConfig && (
                                                <div className='px-4 py-3 border-t border-gray-200 space-y-2.5'>
                                                    {configFields.length > 0 ? (
                                                        <div className='grid grid-cols-2 gap-2.5'>
                                                            {configFields.map((field) => (
                                                                <div key={field.key}>
                                                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                                                        {field.label}
                                                                    </label>
                                                                    <input
                                                                        type={field.type === 'approval' ? 'email' : 'text'}
                                                                        value={configData[field.key] || ''}
                                                                        onChange={(e) => setConfigData(prev => ({ ...prev, [field.key]: e.target.value }))}
                                                                        className='w-full px-2.5 py-1.5 border border-blue-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white'
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className='text-sm text-gray-500 text-center py-4'>
                                                            {buildRow?.pipeline 
                                                                ? 'No configuration fields found for this pipeline'
                                                                : 'Select a pipeline to see configuration options'}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Build Execution History - Collapsible */}
                                        <div className='bg-white border border-gray-200 rounded-lg'>
                                            <button
                                                onClick={() => setShowHistory(!showHistory)}
                                                className='w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors rounded-t-lg'
                                            >
                                                <div className='flex items-center gap-2'>
                                                    <Terminal size={16} className='text-gray-500' />
                                                    <span className='text-sm font-medium text-gray-900'>
                                                        Build History ({buildExecutions.length})
                                                    </span>
                                                </div>
                                                {showHistory ? (
                                                    <ChevronUp size={16} className='text-gray-500' />
                                                ) : (
                                                    <ChevronDown size={16} className='text-gray-500' />
                                                )}
                                            </button>
                                            
                                            {/* Scrollable History Content */}
                                            {showHistory && (
                                                <div className='border-t border-gray-200'>
                                                    <div className='max-h-96 overflow-y-auto'>
                                                        {(() => {
                                                            const filteredExecutions = buildExecutions.filter((execution) => {
                                                                if (!searchTerm.trim()) return true;
                                                                const search = searchTerm.toLowerCase();
                                                                return (
                                                                    execution.buildNumber.toString().includes(search) ||
                                                                    execution.branch.toLowerCase().includes(search) ||
                                                                    execution.status.toLowerCase().includes(search) ||
                                                                    execution.jiraNumber?.toLowerCase().includes(search) ||
                                                                    execution.qaApprover?.toLowerCase().includes(search) ||
                                                                    execution.prodApprover?.toLowerCase().includes(search) ||
                                                                    execution.timestamp.toLowerCase().includes(search)
                                                                );
                                                            });
                                                            
                                                            return filteredExecutions.length > 0 ? (
                                                                <div className='divide-y divide-gray-200'>
                                                                    {filteredExecutions.map((execution) => (
                                                                <motion.div
                                                                    key={execution.id}
                                                                    initial={{opacity: 0}}
                                                                    animate={{opacity: 1}}
                                                                    className='p-3 hover:bg-gray-50 transition-colors'
                                                                >
                                                                    <div className='flex items-center justify-between mb-2'>
                                                                        <div className='flex items-center gap-2'>
                                                                            <GitBranch
                                                                                size={14}
                                                                                className='text-gray-400'
                                                                            />
                                                                            <span className='text-xs font-semibold text-gray-700'>
                                                                                #{execution.buildNumber}
                                                                            </span>
                                                                            <span className='text-xs text-gray-500'>
                                                                                Branch {execution.branch}
                                                                            </span>
                                                                            <span
                                                                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                                                                    execution.status,
                                                                                )}`}
                                                                            >
                                                                                {execution.status}
                                                                            </span>
                                                                        </div>
                                                                        <div className='flex items-center gap-1'>
                                                                            <button
                                                                                onClick={() =>
                                                                                    handleResume(execution.id)
                                                                                }
                                                                                className='px-2.5 py-1 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 rounded transition-colors'
                                                                            >
                                                                                Resume
                                                                            </button>
                                                                            <button
                                                                                onClick={() =>
                                                                                    handleDelete(execution.id)
                                                                                }
                                                                                className='p-1 text-red-500 hover:bg-red-50 rounded transition-colors'
                                                                                title='Delete'
                                                                            >
                                                                                <Trash2 size={14} />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                    <div className='flex items-center gap-2 text-xs text-gray-500 mb-2'>
                                                                        <Clock size={12} />
                                                                        <span>{execution.duration}</span>
                                                                        <span>·</span>
                                                                        <span>{execution.timestamp}</span>
                                                                    </div>
                                                                    {/* Build Details Expandable */}
                                                                    <details className='text-xs'>
                                                                        <summary className='cursor-pointer text-blue-600 hover:text-blue-700'>
                                                                            View details
                                                                        </summary>
                                                                        <div className='mt-2 pl-4 border-l-2 border-blue-200 space-y-1'>
                                                                            <div className='flex gap-2'>
                                                                                <span className='text-gray-500 w-24'>
                                                                                    JIRA:
                                                                                </span>
                                                                                <span className='text-gray-700'>
                                                                                    {execution.jiraNumber ||
                                                                                        'N/A'}
                                                                                </span>
                                                                            </div>
                                                                            <div className='flex gap-2'>
                                                                                <span className='text-gray-500 w-24'>
                                                                                    QA Approver:
                                                                                </span>
                                                                                <span className='text-gray-700'>
                                                                                    {execution.qaApprover ||
                                                                                        'N/A'}
                                                                                </span>
                                                                            </div>
                                                                            <div className='flex gap-2'>
                                                                                <span className='text-gray-500 w-24'>
                                                                                    Prod Approver:
                                                                                </span>
                                                                                <span className='text-gray-700'>
                                                                                    {execution.prodApprover ||
                                                                                        'N/A'}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </details>
                                                                    </motion.div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div className='text-center py-12 text-gray-500'>
                                                                    {searchTerm.trim() ? (
                                                                        <>
                                                                            <Search size={48} className='mx-auto text-gray-300 mb-3' />
                                                                            <p className='text-sm font-medium'>
                                                                                No results found
                                                                            </p>
                                                                            <p className='text-xs mt-1'>
                                                                                Try adjusting your search terms
                                                                            </p>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Terminal
                                                                                size={48}
                                                                                className='mx-auto text-gray-300 mb-3'
                                                                            />
                                                                            <p className='text-sm font-medium'>
                                                                                No build executions yet
                                                                            </p>
                                                                            <p className='text-xs mt-1'>
                                                                                Click the Run button to start your first build
                                                                            </p>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}

