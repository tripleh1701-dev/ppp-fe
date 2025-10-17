'use client';

import React, {useState} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
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
    buildRow: BuildRow;
    onClose: () => void;
    onRunBuild?: () => void;
}

export default function BuildDetailPanel({
    buildRow,
    onClose,
    onRunBuild,
}: BuildDetailPanelProps) {
    const [isRunning, setIsRunning] = useState(false);
    const [showConfig, setShowConfig] = useState(true);
    const [showHistory, setShowHistory] = useState(true);

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

    return (
        <div className='h-full flex flex-col bg-white'>
            {/* Header with Action Buttons */}
            <div className='flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50'>
                <h2 className='text-base font-semibold text-gray-900 truncate flex-1'>
                    {buildRow.buildName || 'Build Details'}
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
                            /* TODO: Edit */
                        }}
                        className='p-1.5 text-gray-600 hover:bg-gray-200 rounded transition-colors'
                        title='Edit'
                    >
                        <Edit size={16} />
                    </button>
                    <button
                        onClick={() => {
                            /* TODO: Copy */
                        }}
                        className='p-1.5 text-gray-600 hover:bg-gray-200 rounded transition-colors'
                        title='Copy'
                    >
                        <Copy size={16} />
                    </button>
                    <button
                        onClick={() => {
                            /* TODO: Delete */
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
                                    defaultValue='JIRA1234'
                                    className='w-full px-2.5 py-1.5 border border-green-400 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500'
                                />
                            </div>
                            <div>
                                <label className='block text-xs font-medium text-gray-700 mb-1'>
                                    QA Sign Off (Approver)
                                </label>
                                <input
                                    type='text'
                                    defaultValue='ABC Approver'
                                    className='w-full px-2.5 py-1.5 border border-green-400 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500'
                                />
                            </div>
                            <div>
                                <label className='block text-xs font-medium text-gray-700 mb-1'>
                                    Prod Approver
                                </label>
                                <input
                                    type='text'
                                    defaultValue='DEF'
                                    className='w-full px-2.5 py-1.5 border border-green-400 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500'
                                />
                            </div>
                            <div>
                                <label className='block text-xs font-medium text-gray-700 mb-1'>
                                    SNOW NPCM
                                </label>
                                <input
                                    type='text'
                                    className='w-full px-2.5 py-1.5 border border-green-400 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500'
                                />
                            </div>
                            <div className='col-span-2'>
                                <label className='block text-xs font-medium text-gray-700 mb-1'>
                                    SNOW CM
                                </label>
                                <input
                                    type='text'
                                    className='w-full px-2.5 py-1.5 border border-green-400 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500'
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
    );
}
