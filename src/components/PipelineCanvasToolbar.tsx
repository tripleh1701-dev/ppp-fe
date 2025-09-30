'use client';

import React, {useState, useRef, useEffect} from 'react';
import {useReactFlow} from 'reactflow';

type LineStyle = {
    type: 'smoothstep' | 'straight' | 'bezier';
    pattern: 'solid' | 'dotted' | 'dashed';
    thickness: number;
    animated: boolean;
    color: string;
};

interface PipelineCanvasToolbarProps {
    backgroundType?: 'dots' | 'lines' | 'cross' | 'solid';
    onBackgroundChange?: (type: 'dots' | 'lines' | 'cross' | 'solid') => void;
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
    lineStyle?: LineStyle;
    onLineStyleChange?: (newStyle: Partial<LineStyle>) => void;
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
    lineStyle,
    onLineStyleChange,
    backgroundType = 'dots',
    onBackgroundChange,
}: PipelineCanvasToolbarProps) {
    const [showTooltip, setShowTooltip] = useState<string | null>(null);
    const [showLineStyleMenu, setShowLineStyleMenu] = useState(false);
    const [showBackgroundMenu, setShowBackgroundMenu] = useState(false);
    const lineStyleMenuRef = useRef<HTMLDivElement>(null);
    const backgroundMenuRef = useRef<HTMLDivElement>(null);

    // Handle click outside to close menus
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;

            // Close line style menu
            if (
                showLineStyleMenu &&
                lineStyleMenuRef.current &&
                !lineStyleMenuRef.current.contains(target as Node) &&
                !target.closest('[data-line-style-button="true"]')
            ) {
                setShowLineStyleMenu(false);
            }

            // Close background menu
            if (
                showBackgroundMenu &&
                backgroundMenuRef.current &&
                !backgroundMenuRef.current.contains(target as Node) &&
                !target.closest('[data-background-button="true"]')
            ) {
                setShowBackgroundMenu(false);
            }
        };

        if (showLineStyleMenu || showBackgroundMenu) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [showLineStyleMenu, showBackgroundMenu]);
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

        // Line Style Button
        {
            id: 'line-style',
            label: 'Line Style',
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
                        d={
                            lineStyle?.pattern === 'dotted'
                                ? 'M17 12H3m18 0h-2m-2 0h-2' // Dotted line
                                : lineStyle?.pattern === 'dashed'
                                ? 'M3 12h6m6 0h6' // Dashed line
                                : 'M3 12h18' // Solid line
                        }
                    />
                    {lineStyle?.animated && (
                        <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M13 17l5-5-5-5'
                            className='animate-pulse'
                        />
                    )}
                </svg>
            ),
            onClick: () => setShowLineStyleMenu(!showLineStyleMenu),
            section: 'view',
        },
        // View Options Section
        {
            id: 'background',
            label: 'Canvas Background',
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
                        d={
                            backgroundType === 'dots'
                                ? 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z'
                                : backgroundType === 'lines'
                                ? 'M4 5h16M4 12h16M4 19h16'
                                : backgroundType === 'cross'
                                ? 'M4 6h16M4 18h16M6 4v16M18 4v16'
                                : 'M4 4h16v16H4z'
                        }
                    />
                </svg>
            ),
            onClick: () => {
                setShowBackgroundMenu(!showBackgroundMenu);
            },
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

    type LineStyleOption<T> = {
        value: T;
        label: string;
        icon: string;
    };

    type LineStyleControl<T> = {
        id: string;
        label: string;
        options: LineStyleOption<T>[];
        current: T;
        onChange: (value: T) => void;
    };

    // Line style buttons
    const colors = [
        '#3b82f6', // blue
        '#10b981', // green
        '#f59e0b', // yellow
        '#ef4444', // red
        '#8b5cf6', // purple
        '#ec4899', // pink
        '#6b7280', // gray
        '#000000', // black
    ];

    const lineStyleButtons: LineStyleControl<any>[] = [
        {
            id: 'line-type',
            label: 'Line Type',
            options: [
                {value: 'straight', label: 'Straight', icon: '─'},
                {value: 'smoothstep', label: 'Smooth', icon: '⟿'},
                {value: 'bezier', label: 'Curved', icon: '⌇'},
            ],
            current: lineStyle?.type || 'smoothstep',
            onChange: (value: 'straight' | 'smoothstep' | 'bezier') =>
                onLineStyleChange?.({type: value}),
        },
        {
            id: 'line-pattern',
            label: 'Line Pattern',
            options: [
                {value: 'solid', label: 'Solid', icon: '━'},
                {value: 'dashed', label: 'Dashed', icon: '┄'},
                {value: 'dotted', label: 'Dotted', icon: '⋯'},
            ],
            current: lineStyle?.pattern || 'solid',
            onChange: (value: 'solid' | 'dotted' | 'dashed') =>
                onLineStyleChange?.({pattern: value}),
        },
        {
            id: 'line-thickness',
            label: 'Line Thickness',
            options: [
                {value: 1, label: 'Thin', icon: '─'},
                {value: 2, label: 'Medium', icon: '━'},
                {value: 3, label: 'Thick', icon: '▬'},
            ],
            current: lineStyle?.thickness || 2,
            onChange: (value: number) =>
                onLineStyleChange?.({thickness: value}),
        },
        {
            id: 'line-animated',
            label: 'Animation',
            options: [
                {value: true, label: 'Animated', icon: '⇢'},
                {value: false, label: 'Static', icon: '→'},
            ],
            current: lineStyle?.animated ?? true,
            onChange: (value: boolean) =>
                onLineStyleChange?.({animated: value}),
        },
        {
            id: 'line-color',
            label: 'Line Color',
            options: colors.map((color) => ({
                value: color,
                label: color,
                icon: '⬤',
            })),
            current: lineStyle?.color || '#3b82f6',
            onChange: (value: string) => onLineStyleChange?.({color: value}),
        },
    ];

    const sectionOrder = [
        'zoom',
        'annotation',
        'edit',
        'pipeline',
        'line-style',
        'view',
    ];

    return (
        <div className='absolute top-4 right-4 z-[60]'>
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
                                    <div
                                        key={button.id}
                                        className='relative'
                                        style={{position: 'relative'}}
                                    >
                                        <button
                                            onClick={button.onClick}
                                            disabled={button.disabled}
                                            data-line-style-button={
                                                button.id === 'line-style'
                                                    ? 'true'
                                                    : undefined
                                            }
                                            data-background-button={
                                                button.id === 'background'
                                                    ? 'true'
                                                    : undefined
                                            }
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

                    {/* Background Menu */}
                    {showBackgroundMenu && (
                        <div
                            ref={backgroundMenuRef}
                            className={`
                                absolute right-full bottom-0 mr-3 bg-white rounded-xl shadow-xl border border-gray-200 p-3 w-48 z-[100]
                                transform transition-all duration-300 ease-in-out
                                ${
                                    showBackgroundMenu
                                        ? 'translate-x-0 opacity-100'
                                        : 'translate-x-4 opacity-0'
                                }
                            `}
                        >
                            <div className='flex flex-col space-y-2'>
                                <div className='text-xs text-gray-500 mb-1.5 font-medium'>
                                    Canvas Background
                                </div>
                                <div className='grid grid-cols-2 gap-2'>
                                    {[
                                        {
                                            type: 'dots',
                                            label: 'Dots',
                                            icon: (
                                                <div className='w-8 h-8 grid grid-cols-3 gap-1 place-items-center'>
                                                    {[...Array(9)].map(
                                                        (_, i) => (
                                                            <div
                                                                key={i}
                                                                className='w-1 h-1 rounded-full bg-current'
                                                            />
                                                        ),
                                                    )}
                                                </div>
                                            ),
                                        },
                                        {
                                            type: 'lines',
                                            label: 'Lines',
                                            icon: (
                                                <div className='w-8 h-8 flex flex-col justify-between'>
                                                    {[...Array(3)].map(
                                                        (_, i) => (
                                                            <div
                                                                key={i}
                                                                className='w-full h-0.5 bg-current'
                                                            />
                                                        ),
                                                    )}
                                                </div>
                                            ),
                                        },
                                        {
                                            type: 'cross',
                                            label: 'Cross',
                                            icon: (
                                                <div className='w-8 h-8 relative'>
                                                    <div className='absolute inset-0 flex flex-col justify-between'>
                                                        {[...Array(3)].map(
                                                            (_, i) => (
                                                                <div
                                                                    key={i}
                                                                    className='w-full h-0.5 bg-current'
                                                                />
                                                            ),
                                                        )}
                                                    </div>
                                                    <div className='absolute inset-0 flex justify-between'>
                                                        {[...Array(3)].map(
                                                            (_, i) => (
                                                                <div
                                                                    key={i}
                                                                    className='w-0.5 h-full bg-current'
                                                                />
                                                            ),
                                                        )}
                                                    </div>
                                                </div>
                                            ),
                                        },
                                        {
                                            type: 'solid',
                                            label: 'Solid',
                                            icon: (
                                                <div className='w-8 h-8 bg-current rounded'></div>
                                            ),
                                        },
                                    ].map((option) => (
                                        <button
                                            key={option.type}
                                            onClick={() => {
                                                onBackgroundChange?.(
                                                    option.type as
                                                        | 'dots'
                                                        | 'lines'
                                                        | 'cross'
                                                        | 'solid',
                                                );
                                                setShowBackgroundMenu(false);
                                            }}
                                            className={`
                                                flex flex-col items-center justify-center p-2 rounded-lg
                                                transition-all duration-200
                                                ${
                                                    backgroundType ===
                                                    option.type
                                                        ? 'bg-blue-500 text-white shadow-md scale-105'
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105'
                                                }
                                            `}
                                        >
                                            {option.icon}
                                            <span className='text-xs mt-1'>
                                                {option.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Line Style Popup Menu */}
                    {!isReadOnly && showLineStyleMenu && (
                        <div
                            ref={lineStyleMenuRef}
                            className={`
                                absolute right-full bottom-0 mr-3 bg-white rounded-xl shadow-xl border border-gray-200 p-3 w-48 z-[100]
                                transform transition-all duration-300 ease-in-out
                                ${
                                    showLineStyleMenu
                                        ? 'translate-x-0 opacity-100'
                                        : 'translate-x-4 opacity-0'
                                }
                            `}
                            tabIndex={0}
                            onBlur={(e: React.FocusEvent<HTMLDivElement>) => {
                                // Check if the new focus target is outside the menu
                                if (
                                    !lineStyleMenuRef.current?.contains(
                                        e.relatedTarget,
                                    )
                                ) {
                                    setShowLineStyleMenu(false);
                                }
                            }}
                        >
                            <div className='flex flex-col space-y-3'>
                                {lineStyleButtons.map((control) => (
                                    <div key={control.id}>
                                        <div className='text-xs text-gray-500 mb-1.5 font-medium'>
                                            {control.label}
                                        </div>
                                        <div className='flex flex-wrap gap-1'>
                                            {control.options.map((option) => (
                                                <button
                                                    key={String(option.value)}
                                                    data-line-style-option='true'
                                                    onClick={() => {
                                                        // Type-safe way to handle different value types
                                                        switch (control.id) {
                                                            case 'line-type':
                                                                control.onChange(
                                                                    option.value as
                                                                        | 'straight'
                                                                        | 'smoothstep'
                                                                        | 'bezier',
                                                                );
                                                                break;
                                                            case 'line-pattern':
                                                                control.onChange(
                                                                    option.value as
                                                                        | 'solid'
                                                                        | 'dotted'
                                                                        | 'dashed',
                                                                );
                                                                break;
                                                            case 'line-thickness':
                                                                control.onChange(
                                                                    option.value as number,
                                                                );
                                                                break;
                                                            case 'line-animated':
                                                                control.onChange(
                                                                    option.value as boolean,
                                                                );
                                                                break;
                                                            case 'line-color':
                                                                control.onChange(
                                                                    option.value as string,
                                                                );
                                                                break;
                                                        }
                                                    }}
                                                    className={`
                                                        ${
                                                            control.id ===
                                                            'line-color'
                                                                ? 'w-6 h-6'
                                                                : 'flex-1 px-2 py-1.5'
                                                        }
                                                        rounded-lg text-sm font-medium
                                                        transition-all duration-200
                                                        ${
                                                            control.current ===
                                                            option.value
                                                                ? control.id ===
                                                                  'line-color'
                                                                    ? 'ring-2 ring-offset-2 ring-blue-500 scale-110'
                                                                    : 'bg-blue-500 text-white shadow-md scale-105'
                                                                : control.id ===
                                                                  'line-color'
                                                                ? 'hover:scale-110'
                                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105'
                                                        }
                                                    `}
                                                    title={option.label}
                                                    style={
                                                        control.id ===
                                                        'line-color'
                                                            ? {
                                                                  backgroundColor:
                                                                      option.value,
                                                                  color:
                                                                      option.value ===
                                                                      '#000000'
                                                                          ? '#ffffff'
                                                                          : '#000000',
                                                              }
                                                            : undefined
                                                    }
                                                >
                                                    {control.id === 'line-color'
                                                        ? null
                                                        : option.icon}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
