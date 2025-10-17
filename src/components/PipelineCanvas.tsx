'use client';

import React, {useState} from 'react';
import {motion, AnimatePresence} from 'framer-motion';

interface PipelineStage {
    id: string;
    name: string;
    status: 'success' | 'failed' | 'running' | 'pending';
    duration?: string;
    startTime?: string;
    endTime?: string;
    substeps?: Array<{name: string; status: string}>;
}

interface PipelineCanvasProps {
    selectedStage: string | null;
    onStageClick: (stageId: string) => void;
}

const stages: PipelineStage[] = [
    {
        id: 'initialize',
        name: 'Initialize',
        status: 'success',
        duration: '12s',
        startTime: '14:30:12',
        endTime: '14:30:24',
    },
    {
        id: 'development',
        name: 'Development',
        status: 'success',
        duration: '2m 15s',
        startTime: '14:30:24',
        endTime: '14:32:39',
        substeps: [
            {name: 'Deploy', status: 'success'},
            {name: 'Unit Tests', status: 'success'},
            {name: 'Build', status: 'success'},
            {name: 'Init', status: 'success'},
        ],
    },
    {
        id: 'qa',
        name: 'QA',
        status: 'running',
        duration: '1m 30s',
        startTime: '14:32:39',
        substeps: [
            {name: 'QA Sign Off', status: 'pending'},
            {name: 'TR Import', status: 'pending'},
            {name: 'Approval', status: 'pending'},
            {name: 'Add NPCM', status: 'pending'},
            {name: 'TR Upload', status: 'pending'},
        ],
    },
    {
        id: 'production',
        name: 'Production',
        status: 'pending',
        substeps: [
            {name: 'TR Import', status: 'pending'},
            {name: 'Approval', status: 'pending'},
            {name: 'Add CM', status: 'pending'},
            {name: 'TR Upload', status: 'pending'},
        ],
    },
    {
        id: 'finish',
        name: 'Finish',
        status: 'pending',
    },
];

export default function PipelineCanvas({
    selectedStage,
    onStageClick,
}: PipelineCanvasProps) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'success':
                return 'bg-blue-500 border-blue-600';
            case 'failed':
                return 'bg-red-500 border-red-600';
            case 'running':
                return 'bg-blue-400 border-blue-500 animate-pulse';
            case 'pending':
                return 'bg-gray-300 border-gray-400';
            default:
                return 'bg-gray-300 border-gray-400';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'success':
                return (
                    <svg
                        className='w-4 h-4 text-white'
                        fill='currentColor'
                        viewBox='0 0 20 20'
                    >
                        <path
                            fillRule='evenodd'
                            d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                            clipRule='evenodd'
                        />
                    </svg>
                );
            case 'failed':
                return (
                    <svg
                        className='w-4 h-4 text-white'
                        fill='currentColor'
                        viewBox='0 0 20 20'
                    >
                        <path
                            fillRule='evenodd'
                            d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
                            clipRule='evenodd'
                        />
                    </svg>
                );
            case 'running':
                return (
                    <div className='w-2 h-2 bg-white rounded-full animate-ping'></div>
                );
            default:
                return null;
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'success':
                return (
                    <span className='text-blue-600 font-semibold'>Success</span>
                );
            case 'failed':
                return (
                    <span className='text-red-600 font-semibold'>Failed</span>
                );
            case 'running':
                return (
                    <span className='text-blue-600 font-semibold'>
                        In Progress
                    </span>
                );
            case 'pending':
                return (
                    <span className='text-gray-500 font-semibold'>Pending</span>
                );
            default:
                return null;
        }
    };

    return (
        <div className='px-4 py-4'>
            {/* Pipeline Flow Visualization */}
            <div className='flex items-start justify-between gap-2 mb-6'>
                {stages.map((stage, index) => (
                    <React.Fragment key={stage.id}>
                        {/* Stage Node */}
                        <motion.button
                            onClick={() => onStageClick(stage.id)}
                            className={`relative flex flex-col items-center p-3 rounded-lg border-2 transition-all cursor-pointer ${
                                selectedStage === stage.id
                                    ? 'ring-2 ring-blue-500 ring-offset-2 scale-105'
                                    : 'hover:scale-105'
                            } ${getStatusColor(stage.status)}`}
                            whileHover={{scale: 1.05}}
                            whileTap={{scale: 0.95}}
                        >
                            {/* Status Icon */}
                            <div className='w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mb-2'>
                                {getStatusIcon(stage.status)}
                            </div>

                            {/* Stage Name */}
                            <span className='text-xs font-semibold text-white mb-1'>
                                {stage.name}
                            </span>

                            {/* Duration */}
                            {stage.duration && (
                                <span className='text-[10px] text-white/80'>
                                    {stage.duration}
                                </span>
                            )}
                        </motion.button>

                        {/* Connector Arrow */}
                        {index < stages.length - 1 && (
                            <div className='flex items-center pt-6 flex-shrink-0'>
                                <svg
                                    className='w-4 h-4 text-gray-400'
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M9 5l7 7-7 7'
                                    />
                                </svg>
                            </div>
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Stage Details */}
            <AnimatePresence mode='wait'>
                {selectedStage && (
                    <motion.div
                        key={selectedStage}
                        initial={{opacity: 0, y: -10}}
                        animate={{opacity: 1, y: 0}}
                        exit={{opacity: 0, y: -10}}
                        className='bg-white border border-gray-200 rounded-lg p-4'
                    >
                        {stages
                            .filter((s) => s.id === selectedStage)
                            .map((stage) => (
                                <div key={stage.id}>
                                    <div className='flex items-center justify-between mb-3'>
                                        <h4 className='text-sm font-semibold text-gray-900'>
                                            {stage.name} Stage
                                        </h4>
                                        {getStatusText(stage.status)}
                                    </div>

                                    <div className='grid grid-cols-2 gap-3 mb-4 text-xs'>
                                        {stage.startTime && (
                                            <div>
                                                <span className='text-gray-500'>
                                                    Start Time:
                                                </span>
                                                <p className='text-gray-900 font-medium'>
                                                    {stage.startTime}
                                                </p>
                                            </div>
                                        )}
                                        {stage.endTime && (
                                            <div>
                                                <span className='text-gray-500'>
                                                    End Time:
                                                </span>
                                                <p className='text-gray-900 font-medium'>
                                                    {stage.endTime}
                                                </p>
                                            </div>
                                        )}
                                        {stage.duration && (
                                            <div>
                                                <span className='text-gray-500'>
                                                    Duration:
                                                </span>
                                                <p className='text-gray-900 font-medium'>
                                                    {stage.duration}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Sub-steps */}
                                    {stage.substeps &&
                                        stage.substeps.length > 0 && (
                                            <div>
                                                <h5 className='text-xs font-semibold text-gray-700 mb-2'>
                                                    Steps:
                                                </h5>
                                                <div className='space-y-1'>
                                                    {stage.substeps.map(
                                                        (substep, idx) => (
                                                            <div
                                                                key={idx}
                                                                className='flex items-center gap-2 text-xs'
                                                            >
                                                                {substep.status ===
                                                                'success' ? (
                                                                    <svg
                                                                        className='w-3 h-3 text-blue-600'
                                                                        fill='currentColor'
                                                                        viewBox='0 0 20 20'
                                                                    >
                                                                        <path
                                                                            fillRule='evenodd'
                                                                            d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                                                                            clipRule='evenodd'
                                                                        />
                                                                    </svg>
                                                                ) : (
                                                                    <div className='w-3 h-3 rounded-full border-2 border-blue-300'></div>
                                                                )}
                                                                <span className='text-gray-700'>
                                                                    {
                                                                        substep.name
                                                                    }
                                                                </span>
                                                                {substep.status ===
                                                                    'pending' && (
                                                                    <span className='text-gray-400 text-[10px]'>
                                                                        (pending)
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                    {/* Stage Logs Preview */}
                                    <div className='mt-4'>
                                        <h5 className='text-xs font-semibold text-gray-700 mb-2'>
                                            Console Output:
                                        </h5>
                                        <div className='bg-gray-900 text-blue-300 p-3 rounded text-[10px] font-mono h-32 overflow-y-auto'>
                                            <div>
                                                [{stage.startTime}] Starting{' '}
                                                {stage.name} stage...
                                            </div>
                                            <div>
                                                [{stage.startTime}] Initializing
                                                environment...
                                            </div>
                                            {stage.status === 'success' && (
                                                <>
                                                    <div>
                                                        [{stage.endTime}] ✓{' '}
                                                        {stage.name} completed
                                                        successfully
                                                    </div>
                                                    <div className='text-blue-400'>
                                                        [{stage.endTime}]
                                                        Duration:{' '}
                                                        {stage.duration}
                                                    </div>
                                                </>
                                            )}
                                            {stage.status === 'running' && (
                                                <div className='animate-pulse'>
                                                    [
                                                    {new Date().toLocaleTimeString()}
                                                    ] Processing...
                                                </div>
                                            )}
                                            {stage.status === 'failed' && (
                                                <>
                                                    <div className='text-red-400'>
                                                        [ERROR] {stage.name}{' '}
                                                        stage failed
                                                    </div>
                                                    <div className='text-red-400'>
                                                        [ERROR] Exit code: 1
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
