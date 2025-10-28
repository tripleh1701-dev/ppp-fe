'use client';

import React, {useState, useEffect} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {
    XMarkIcon,
    PlayIcon,
    DocumentTextIcon,
} from '@heroicons/react/24/outline';
import BuildDetailPanel from './BuildDetailPanel';
import PipelineExecutionView from './PipelineExecutionView';

interface BuildSlidingPanelsProps {
    isOpen: boolean;
    onClose: () => void;
    buildData?: any;
    onRunBuild?: (buildId: string) => void;
    initialPanel?: 'details' | 'execution';
    selectedAccountId?: string | null;
    selectedAccountName?: string | null;
    selectedEnterpriseId?: string | null;
    selectedEnterpriseName?: string | null;
}

type PanelType = 'details' | 'execution';

const BuildSlidingPanels: React.FC<BuildSlidingPanelsProps> = ({
    isOpen,
    onClose,
    buildData,
    onRunBuild,
    initialPanel = 'details',
    selectedAccountId,
    selectedAccountName,
    selectedEnterpriseId,
    selectedEnterpriseName,
}) => {
    const [activePanel, setActivePanel] = useState<PanelType>(initialPanel);
    const [visiblePanels, setVisiblePanels] = useState<Set<PanelType>>(
        new Set([initialPanel]),
    );
    const [executionData, setExecutionData] = useState<any>(null);

    // Reset state when panel opens
    useEffect(() => {
        if (isOpen) {
            setActivePanel(initialPanel);
            setVisiblePanels(new Set([initialPanel]));
            setExecutionData(null);
        }
    }, [isOpen, initialPanel]);

    const handlePanelChange = (panel: PanelType) => {
        console.log('📱 Switching to panel:', panel);
        setVisiblePanels((prev) => {
            const newSet = new Set(prev);
            newSet.add(panel);
            return newSet;
        });
        setActivePanel(panel);
    };

    const handleRunBuild = () => {
        console.log('▶️ Running build:', buildData?.id);
        if (onRunBuild && buildData?.id) {
            onRunBuild(buildData.id);
        }
        // Switch to execution panel
        handlePanelChange('execution');
    };

    const panelConfig: Record<
        PanelType,
        {
            title: string;
            icon: React.ComponentType<any>;
            width: string;
        }
    > = {
        details: {
            title: 'Build Details',
            icon: DocumentTextIcon,
            width: '750px',
        },
        execution: {
            title: 'Build Execution',
            icon: PlayIcon,
            width: '900px',
        },
    };

    const panelOrder: PanelType[] = ['details', 'execution'];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        exit={{opacity: 0}}
                        transition={{duration: 0.2}}
                        className='fixed inset-0 bg-black/50 z-[100]'
                        onClick={onClose}
                    />

                    {/* Sliding Panels */}
                    {panelOrder.map((panelType, index) => {
                        if (!visiblePanels.has(panelType)) return null;

                        const isActive = activePanel === panelType;
                        const config = panelConfig[panelType];
                        const IconComponent = config.icon;

                        // All inactive panels show as collapsed sidebar adjacent to active panel
                        const isCollapsed = !isActive;

                        // Calculate position: collapsed panels stack to the left of active panel
                        const activePanelWidth = panelConfig[activePanel].width;
                        const collapsedPanels = panelOrder.filter(
                            (pt) => visiblePanels.has(pt) && pt !== activePanel,
                        );
                        const collapsedIndex =
                            collapsedPanels.indexOf(panelType);

                        return (
                            <motion.div
                                key={panelType}
                                initial={{x: '100%', opacity: 0}}
                                animate={{
                                    x: 0,
                                    opacity: 1,
                                }}
                                exit={{x: '100%', opacity: 0}}
                                transition={{
                                    type: 'spring',
                                    damping: 30,
                                    stiffness: 300,
                                }}
                                className={`fixed top-0 h-full shadow-2xl flex ${
                                    isCollapsed
                                        ? 'cursor-pointer border-r border-slate-800/50'
                                        : 'flex-col'
                                }`}
                                style={{
                                    width: isCollapsed ? '60px' : config.width,
                                    zIndex: isActive ? 103 : 101 + index,
                                    right: isCollapsed
                                        ? `calc(${activePanelWidth} + ${
                                              collapsedIndex * 60
                                          }px)`
                                        : '0',
                                    background: isCollapsed
                                        ? '#0a1a2f'
                                        : 'white',
                                }}
                                onClick={() => {
                                    if (!isActive) {
                                        // Remove the currently active panel and show only the clicked one
                                        setVisiblePanels(new Set([panelType]));
                                        setActivePanel(panelType);
                                    }
                                }}
                            >
                                {/* Collapsed Sidebar View */}
                                {isCollapsed && (
                                    <div
                                        className='w-full h-full flex flex-col items-center justify-center relative'
                                        style={{
                                            backgroundColor: '#0a1a2f',
                                            backgroundImage:
                                                'url(/images/logos/sidebar.png)',
                                            backgroundSize: 'contain',
                                            backgroundPosition: 'center bottom',
                                            backgroundRepeat: 'no-repeat',
                                        }}
                                    >
                                        {/* Vertical Text */}
                                        <div
                                            className='relative z-10 text-xs text-white font-bold tracking-wider px-2 text-center'
                                            style={{
                                                writingMode: 'vertical-rl',
                                                textOrientation: 'mixed',
                                                transform: 'rotate(180deg)',
                                            }}
                                        >
                                            {panelType === 'execution' &&
                                            buildData?.buildName
                                                ? `Build Execution for ${buildData.buildName}`
                                                : config.title}
                                        </div>

                                        {/* Logo at bottom */}
                                        <div className='absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10'>
                                            <div className='w-10 h-10 flex items-center justify-center rounded-full bg-blue-600/80 hover:bg-blue-600 transition-colors'>
                                                <svg
                                                    className='w-5 h-5 text-white'
                                                    viewBox='0 0 24 24'
                                                    fill='none'
                                                    stroke='currentColor'
                                                    strokeWidth='2.5'
                                                >
                                                    <path
                                                        strokeLinecap='round'
                                                        strokeLinejoin='round'
                                                        d='M12 4v16m8-8H4'
                                                    />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Full Panel View */}
                                {!isCollapsed && (
                                    <>
                                        {/* Panel Header */}
                                        <div className='flex items-center justify-between px-6 py-4 border-b border-blue-300 bg-gradient-to-r from-blue-600 to-blue-500'>
                                            <div className='flex items-center gap-3'>
                                                <div>
                                                    <h2 className='text-lg font-semibold text-white'>
                                                        {config.title}
                                                    </h2>
                                                    {buildData && (
                                                        <p className='text-sm text-blue-100'>
                                                            {buildData.buildName ||
                                                                'Build Configuration'}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className='flex items-center gap-2'>
                                                {/* Run Build Button (only in details panel) */}
                                                {panelType === 'details' &&
                                                    buildData &&
                                                    !buildData.isTemporary && (
                                                        <button
                                                            onClick={
                                                                handleRunBuild
                                                            }
                                                            className='flex items-center gap-2 px-4 py-2 text-sm bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors shadow-sm'
                                                        >
                                                            <PlayIcon className='w-4 h-4' />
                                                            Run
                                                        </button>
                                                    )}

                                                {/* Close Button */}
                                                <button
                                                    onClick={onClose}
                                                    className='p-2 hover:bg-white/20 rounded-lg transition-colors'
                                                    aria-label='Close panel'
                                                >
                                                    <XMarkIcon className='w-5 h-5 text-white' />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Panel Content */}
                                        <div className='flex-1 overflow-auto'>
                                            {panelType === 'details' && (
                                                <div className='p-6'>
                                                    {buildData ? (
                                                        <BuildDetailPanel
                                                            buildRow={buildData}
                                                            onClose={() => {}}
                                                            onRunBuild={
                                                                handleRunBuild
                                                            }
                                                        />
                                                    ) : (
                                                        <div className='text-center text-slate-500'>
                                                            No build data
                                                            available
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {panelType === 'execution' && (
                                                <div className='flex flex-col h-full'>
                                                    {/* Pipeline Execution View - Takes full space */}
                                                    <div className='flex-1 overflow-auto p-6'>
                                                        <PipelineExecutionView
                                                            pipelineName={
                                                                buildData?.pipeline
                                                            }
                                                            buildId={
                                                                buildData?.id
                                                            }
                                                            accountId={
                                                                selectedAccountId ||
                                                                undefined
                                                            }
                                                            enterpriseId={
                                                                selectedEnterpriseId ||
                                                                undefined
                                                            }
                                                        />
                                                    </div>

                                                    {/* Compact Bottom Info Bar */}
                                                    <div className='border-t border-slate-200 bg-gradient-to-r from-slate-50 to-white p-4'>
                                                        <div className='grid grid-cols-3 gap-3'>
                                                            {/* Quick Stats */}
                                                            <div className='flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200'>
                                                                <div className='w-8 h-8 bg-blue-100 rounded flex items-center justify-center'>
                                                                    <svg
                                                                        className='w-4 h-4 text-blue-600'
                                                                        fill='none'
                                                                        viewBox='0 0 24 24'
                                                                        stroke='currentColor'
                                                                    >
                                                                        <path
                                                                            strokeLinecap='round'
                                                                            strokeLinejoin='round'
                                                                            strokeWidth={
                                                                                2
                                                                            }
                                                                            d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
                                                                        />
                                                                    </svg>
                                                                </div>
                                                                <div className='flex-1 min-w-0'>
                                                                    <p className='text-xs text-slate-600 truncate'>
                                                                        Tests
                                                                    </p>
                                                                    <p className='text-sm font-semibold text-slate-800'>
                                                                        124
                                                                        passed
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className='flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200'>
                                                                <div className='w-8 h-8 bg-green-100 rounded flex items-center justify-center'>
                                                                    <svg
                                                                        className='w-4 h-4 text-green-600'
                                                                        fill='none'
                                                                        viewBox='0 0 24 24'
                                                                        stroke='currentColor'
                                                                    >
                                                                        <path
                                                                            strokeLinecap='round'
                                                                            strokeLinejoin='round'
                                                                            strokeWidth={
                                                                                2
                                                                            }
                                                                            d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                                                                        />
                                                                    </svg>
                                                                </div>
                                                                <div className='flex-1 min-w-0'>
                                                                    <p className='text-xs text-slate-600 truncate'>
                                                                        Coverage
                                                                    </p>
                                                                    <p className='text-sm font-semibold text-green-600'>
                                                                        87.5%
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className='flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200'>
                                                                <div className='w-8 h-8 bg-purple-100 rounded flex items-center justify-center'>
                                                                    <svg
                                                                        className='w-4 h-4 text-purple-600'
                                                                        fill='none'
                                                                        viewBox='0 0 24 24'
                                                                        stroke='currentColor'
                                                                    >
                                                                        <path
                                                                            strokeLinecap='round'
                                                                            strokeLinejoin='round'
                                                                            strokeWidth={
                                                                                2
                                                                            }
                                                                            d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12'
                                                                        />
                                                                    </svg>
                                                                </div>
                                                                <div className='flex-1 min-w-0'>
                                                                    <p className='text-xs text-slate-600 truncate'>
                                                                        Artifacts
                                                                    </p>
                                                                    <p className='text-sm font-semibold text-slate-800'>
                                                                        3 files
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Expandable Details */}
                                                        <details className='mt-3'>
                                                            <summary className='cursor-pointer text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1'>
                                                                <span>
                                                                    Show more
                                                                    details
                                                                </span>
                                                                <svg
                                                                    className='w-4 h-4'
                                                                    fill='none'
                                                                    viewBox='0 0 24 24'
                                                                    stroke='currentColor'
                                                                >
                                                                    <path
                                                                        strokeLinecap='round'
                                                                        strokeLinejoin='round'
                                                                        strokeWidth={
                                                                            2
                                                                        }
                                                                        d='M19 9l-7 7-7-7'
                                                                    />
                                                                </svg>
                                                            </summary>
                                                            <div className='mt-3 space-y-3'>
                                                                {/* Build Config */}
                                                                <div className='p-3 bg-white rounded-lg border border-slate-200'>
                                                                    <h4 className='text-xs font-semibold text-slate-700 mb-2'>
                                                                        Build
                                                                        Configuration
                                                                    </h4>
                                                                    <div className='grid grid-cols-2 gap-2 text-xs'>
                                                                        <div>
                                                                            <span className='text-slate-600'>
                                                                                JIRA:
                                                                            </span>
                                                                            <span className='ml-1 font-medium text-slate-800'>
                                                                                JIRA1234
                                                                            </span>
                                                                        </div>
                                                                        <div>
                                                                            <span className='text-slate-600'>
                                                                                QA:
                                                                            </span>
                                                                            <span className='ml-1 font-medium text-slate-800'>
                                                                                ABC
                                                                                Approver
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Source Info */}
                                                                <div className='p-3 bg-white rounded-lg border border-slate-200'>
                                                                    <h4 className='text-xs font-semibold text-slate-700 mb-2'>
                                                                        Source
                                                                    </h4>
                                                                    <div className='space-y-1 text-xs'>
                                                                        <div className='flex items-center gap-2'>
                                                                            <span className='text-slate-600'>
                                                                                Branch:
                                                                            </span>
                                                                            <span className='font-mono text-slate-800'>
                                                                                main
                                                                            </span>
                                                                        </div>
                                                                        <div className='flex items-center gap-2'>
                                                                            <span className='text-slate-600'>
                                                                                Commit:
                                                                            </span>
                                                                            <span className='font-mono text-slate-800'>
                                                                                a3f2b1c
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </details>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        );
                    })}
                </>
            )}
        </AnimatePresence>
    );
};

export default BuildSlidingPanels;
