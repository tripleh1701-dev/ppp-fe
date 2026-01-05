'use client';

import React, {useState, useEffect} from 'react';
import {motion} from 'framer-motion';
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
} from 'lucide-react';
import {BuildRow} from './BuildsTable';

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

interface BuildDetailPanelProps {
    buildRow?: BuildRow | null;
    onClose: () => void;
    onRunBuild?: () => void;
    isOpen?: boolean;
    sidebarWidth?: number;
    renderInline?: boolean; // If true, render inline instead of using portal
}

export default function BuildDetailPanel({
    buildRow,
    onClose,
    onRunBuild,
    isOpen = true,
    sidebarWidth = 256,
    renderInline = false,
}: BuildDetailPanelProps) {
    const [isRunning, setIsRunning] = useState(false);
    const [showConfig, setShowConfig] = useState(true);
    const [showHistory, setShowHistory] = useState(true);
    
    // Form state for Build Configuration
    const [configData, setConfigData] = useState({
        jiraNumber: '',
        qaApprover: '',
        prodApprover: '',
        snowNPCM: '',
        snowCM: '',
    });

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

    // Initialize config data from buildRow when it changes
    useEffect(() => {
        if (buildRow) {
            // TODO: Load config data from buildRow if it exists
            // For now, use default values
            setConfigData({
                jiraNumber: 'JIRA1234',
                qaApprover: 'ABC Approver',
                prodApprover: 'DEF',
                snowNPCM: '',
                snowCM: '',
            });
        } else {
            setConfigData({
                jiraNumber: '',
                qaApprover: '',
                prodApprover: '',
                snowNPCM: '',
                snowCM: '',
            });
        }
    }, [buildRow]);

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

    const panelContent = (
        <>
            {/* Backdrop - Only show when not rendering inline */}
            {!renderInline && (
                <div
                    className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 ${
                        isOpen ? 'opacity-40' : 'opacity-0 pointer-events-none'
                    }`}
                    style={{
                        left: `${sidebarWidth}px`,
                    }}
                    onClick={onClose}
                />
            )}

            {/* Build Detail Panel */}
            <div
                className={`${renderInline ? 'relative h-full flex flex-col' : 'fixed top-0'} ${renderInline ? '' : 'bg-white shadow-2xl'} transform transition-all duration-300 ease-in-out ${renderInline ? '' : 'z-50'} ${renderInline ? '' : 'border-r border-slate-200'} ${
                    isOpen
                        ? 'translate-x-0 opacity-100'
                        : renderInline ? 'opacity-100' : 'translate-x-full opacity-0 pointer-events-none'
                }`}
                style={renderInline ? {} : {
                    left: `${sidebarWidth}px`,
                    width: '750px',
                }}
                aria-hidden={!isOpen}
            >
                <div className={`${renderInline ? 'h-full flex flex-col' : 'h-full flex flex-col bg-white'}`}>
                    {/* Header with Action Buttons */}
                    <div className={`flex items-center justify-between ${renderInline ? 'px-4' : 'px-4'} ${renderInline ? 'py-3' : 'py-3'} ${renderInline ? 'border-b border-blue-200 bg-blue-50' : 'border-b border-blue-200 bg-blue-50'} ${renderInline ? 'sticky top-0 z-30 shadow-sm' : ''}`}>
                        <h2 className={`${renderInline ? 'text-xs font-bold' : 'text-base font-semibold'} text-blue-900 truncate flex-1`}>
                            {currentBuildRow.connectorName || 'Build Details'}
                        </h2>
                        <div className='flex items-center gap-1.5'>
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
                    <div className='w-px h-5 bg-gray-300 mx-1' />
                    <button
                        onClick={onClose}
                        className='p-1.5 text-gray-500 hover:bg-gray-200 rounded transition-colors'
                        title='Close'
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* Build Configuration - Collapsible */}
            <div className='border-b border-gray-200'>
                <button
                    onClick={() => setShowConfig(!showConfig)}
                    className='w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors'
                >
                    <div className='flex items-center gap-2'>
                        <Settings size={16} className='text-gray-500' />
                        <span className='text-sm font-medium text-gray-900'>
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
                    <div className='px-4 py-3 bg-gray-50 space-y-2.5'>
                        <div className='grid grid-cols-2 gap-2.5'>
                            <div>
                                <label className='block text-xs font-medium text-gray-700 mb-1'>
                                    JIRA Number
                                </label>
                                <input
                                    type='text'
                                    value={configData.jiraNumber}
                                    onChange={(e) => setConfigData(prev => ({ ...prev, jiraNumber: e.target.value }))}
                                    className='w-full px-2.5 py-1.5 border border-green-400 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    placeholder='Enter JIRA number'
                                />
                            </div>
                            <div>
                                <label className='block text-xs font-medium text-gray-700 mb-1'>
                                    QA Sign Off (Approver)
                                </label>
                                <input
                                    type='text'
                                    value={configData.qaApprover}
                                    onChange={(e) => setConfigData(prev => ({ ...prev, qaApprover: e.target.value }))}
                                    className='w-full px-2.5 py-1.5 border border-green-400 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    placeholder='Enter QA approver'
                                />
                            </div>
                            <div>
                                <label className='block text-xs font-medium text-gray-700 mb-1'>
                                    Prod Approver
                                </label>
                                <input
                                    type='text'
                                    value={configData.prodApprover}
                                    onChange={(e) => setConfigData(prev => ({ ...prev, prodApprover: e.target.value }))}
                                    className='w-full px-2.5 py-1.5 border border-green-400 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    placeholder='Enter Prod approver'
                                />
                            </div>
                            <div>
                                <label className='block text-xs font-medium text-gray-700 mb-1'>
                                    SNOW NPCM
                                </label>
                                <input
                                    type='text'
                                    value={configData.snowNPCM}
                                    onChange={(e) => setConfigData(prev => ({ ...prev, snowNPCM: e.target.value }))}
                                    className='w-full px-2.5 py-1.5 border border-green-400 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    placeholder='Enter SNOW NPCM'
                                />
                            </div>
                            <div className='col-span-2'>
                                <label className='block text-xs font-medium text-gray-700 mb-1'>
                                    SNOW CM
                                </label>
                                <input
                                    type='text'
                                    value={configData.snowCM}
                                    onChange={(e) => setConfigData(prev => ({ ...prev, snowCM: e.target.value }))}
                                    className='w-full px-2.5 py-1.5 border border-green-400 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    placeholder='Enter SNOW CM'
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Build Execution History - Collapsible */}
            <div className='border-b border-gray-200'>
                <button
                    onClick={() => setShowHistory(!showHistory)}
                    className='w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors'
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
            </div>

            {/* Scrollable History Content */}
            {showHistory && (
                <div className='flex-1 overflow-y-auto'>
                    {buildExecutions.length > 0 ? (
                        <div className='divide-y divide-gray-200'>
                            {buildExecutions.map((execution) => (
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
                        </div>
                    )}
                </div>
            )}
                </div>
            </div>
        </>
    );

    if (renderInline) {
        return panelContent;
    }

    return createPortal(panelContent, document.body);
}
