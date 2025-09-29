'use client';

import React, {useState} from 'react';
import {useReactFlow} from 'reactflow';

interface PipelineCanvasToolbarProps {
    onAddStickyNote?: () => void;
    onImportPipeline?: () => void;
    onExportPipeline?: () => void;
    onSavePipeline?: () => void;
    onLoadPipeline?: () => void;
    onAddComment?: () => void;
    onToggleGrid?: () => void;
    onUndo?: () => void;
    onRedo?: () => void;
    onCopySelection?: () => void;
    onPasteSelection?: () => void;
    isReadOnly?: boolean;
}

export default function PipelineCanvasToolbar({
    onAddStickyNote,
    onImportPipeline,
    onExportPipeline,
    onSavePipeline,
    onLoadPipeline,
    onAddComment,
    onToggleGrid,
    onUndo,
    onRedo,
    onCopySelection,
    onPasteSelection,
    isReadOnly = false,
}: PipelineCanvasToolbarProps) {
    const [showTooltip, setShowTooltip] = useState<string | null>(null);
    const reactFlowInstance = useReactFlow();

    const handleZoomIn = () => {
        reactFlowInstance.zoomIn();
    };

    const handleZoomOut = () => {
        reactFlowInstance.zoomOut();
    };

    const handleFitView = () => {
        reactFlowInstance.fitView();
    };

    const handleZoomToFit = () => {
        reactFlowInstance.fitView({padding: 0.2});
    };

    const toolbarButtons = [
        // Zoom Controls Section
        {
            id: 'zoom-in',
            label: 'Zoom In',
            icon: (
                <svg
                    className='w-5 h-5'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                >
                    <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M12 6v6m0 0v6m0-6h6m-6 0H6'
                    />
                </svg>
            ),
            onClick: handleZoomIn,
            section: 'zoom',
        },
        {
            id: 'zoom-out',
            label: 'Zoom Out',
            icon: (
                <svg
                    className='w-5 h-5'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                >
                    <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M18 12H6'
                    />
                </svg>
            ),
            onClick: handleZoomOut,
            section: 'zoom',
        },
        {
            id: 'fit-view',
            label: 'Fit to Screen',
            icon: (
                <svg
                    className='w-5 h-5'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                >
                    <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4'
                    />
                </svg>
            ),
            onClick: handleFitView,
            section: 'zoom',
        },

        // Annotation Section
        {
            id: 'sticky-note',
            label: 'Add Sticky Note',
            icon: (
                <svg
                    className='w-5 h-5'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                >
                    <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z'
                    />
                </svg>
            ),
            onClick: onAddStickyNote,
            disabled: isReadOnly,
            section: 'annotation',
            color: 'bg-yellow-500 hover:bg-yellow-600',
        },
        {
            id: 'comment',
            label: 'Add Comment',
            icon: (
                <svg
                    className='w-5 h-5'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                >
                    <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
                    />
                </svg>
            ),
            onClick: onAddComment,
            disabled: isReadOnly,
            section: 'annotation',
            color: 'bg-blue-500 hover:bg-blue-600',
        },

        // Edit Actions Section
        {
            id: 'undo',
            label: 'Undo',
            icon: (
                <svg
                    className='w-5 h-5'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                >
                    <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6'
                    />
                </svg>
            ),
            onClick: onUndo,
            disabled: isReadOnly,
            section: 'edit',
        },
        {
            id: 'redo',
            label: 'Redo',
            icon: (
                <svg
                    className='w-5 h-5'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                >
                    <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6'
                    />
                </svg>
            ),
            onClick: onRedo,
            disabled: isReadOnly,
            section: 'edit',
        },
        {
            id: 'copy',
            label: 'Copy Selection',
            icon: (
                <svg
                    className='w-5 h-5'
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
            ),
            onClick: onCopySelection,
            disabled: isReadOnly,
            section: 'edit',
        },
        {
            id: 'paste',
            label: 'Paste',
            icon: (
                <svg
                    className='w-5 h-5'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                >
                    <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
                    />
                </svg>
            ),
            onClick: onPasteSelection,
            disabled: isReadOnly,
            section: 'edit',
        },

        // Pipeline Actions Section
        {
            id: 'save',
            label: 'Save Pipeline',
            icon: (
                <svg
                    className='w-5 h-5'
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
            ),
            onClick: onSavePipeline,
            disabled: isReadOnly,
            section: 'pipeline',
            color: 'bg-green-500 hover:bg-green-600',
        },
        {
            id: 'load',
            label: 'Load Pipeline',
            icon: (
                <svg
                    className='w-5 h-5'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                >
                    <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10'
                    />
                </svg>
            ),
            onClick: onLoadPipeline,
            section: 'pipeline',
        },
        {
            id: 'import',
            label: 'Import Pipeline',
            icon: (
                <svg
                    className='w-5 h-5'
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
            ),
            onClick: onImportPipeline,
            section: 'pipeline',
        },
        {
            id: 'export',
            label: 'Export Pipeline',
            icon: (
                <svg
                    className='w-5 h-5'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                >
                    <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 7l3-3m0 0l3 3m-3-3v12'
                    />
                </svg>
            ),
            onClick: onExportPipeline,
            section: 'pipeline',
        },

        // View Options Section
        {
            id: 'grid',
            label: 'Toggle Grid',
            icon: (
                <svg
                    className='w-5 h-5'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                >
                    <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z'
                    />
                </svg>
            ),
            onClick: onToggleGrid,
            section: 'view',
        },
    ];

    const groupedButtons = toolbarButtons.reduce((acc, button) => {
        if (!acc[button.section]) {
            acc[button.section] = [];
        }
        acc[button.section].push(button);
        return acc;
    }, {} as Record<string, typeof toolbarButtons>);

    const sectionOrder = ['zoom', 'annotation', 'edit', 'pipeline', 'view'];

    return (
        <div className='absolute top-4 right-4 z-50'>
            <div className='bg-white/95 backdrop-blur-md border border-gray-200 rounded-2xl shadow-xl p-2'>
                {/* Main Toolbar */}
                <div className='flex flex-col space-y-2'>
                    {sectionOrder.map((sectionKey) => {
                        const section = groupedButtons[sectionKey];
                        if (!section) return null;

                        return (
                            <div
                                key={sectionKey}
                                className='flex flex-col space-y-1'
                            >
                                {section.map((button) => (
                                    <div key={button.id} className='relative'>
                                        <button
                                            onClick={button.onClick}
                                            disabled={button.disabled}
                                            className={`
                                                w-10 h-10 rounded-xl flex items-center justify-center
                                                transition-all duration-200 text-white font-medium
                                                ${
                                                    button.color ||
                                                    'bg-gray-600 hover:bg-gray-700'
                                                }
                                                ${
                                                    button.disabled
                                                        ? 'opacity-50 cursor-not-allowed'
                                                        : 'hover:scale-110 hover:shadow-lg active:scale-95'
                                                }
                                                group relative
                                            `}
                                            onMouseEnter={() =>
                                                setShowTooltip(button.id)
                                            }
                                            onMouseLeave={() =>
                                                setShowTooltip(null)
                                            }
                                            title={button.label}
                                        >
                                            {button.icon}

                                            {/* Tooltip */}
                                            {showTooltip === button.id && (
                                                <div className='absolute right-full mr-3 top-1/2 transform -translate-y-1/2 z-60'>
                                                    <div className='bg-gray-900 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap shadow-lg'>
                                                        {button.label}
                                                        <div className='absolute left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-gray-900 border-t-2 border-b-2 border-t-transparent border-b-transparent'></div>
                                                    </div>
                                                </div>
                                            )}
                                        </button>
                                    </div>
                                ))}

                                {/* Section Separator */}
                                {sectionKey !== 'view' && (
                                    <div className='h-px bg-gray-200 mx-2'></div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
