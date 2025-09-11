import React, {useState, useEffect, useRef} from 'react';
import {
    DndContext,
    closestCenter,
    closestCorners,
    pointerWithin,
    rectIntersection,
    PointerSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import {toast} from 'react-toastify';
import './ReusableTableComponent.css';
import tableConfig from '../../config/tableConfig';

// Column type definitions for the add column modal
const COLUMN_TYPES = [
    {
        id: 'text',
        name: 'Text',
        icon: (
            <svg
                width='20'
                height='20'
                viewBox='0 0 24 24'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
            >
                <path d='M3 7H21L19 3H5L3 7Z' fill='currentColor' />
                <path
                    d='M3 7V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V7'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                />
                <path
                    d='M8 11H16'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                />
                <path
                    d='M8 15H13'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                />
            </svg>
        ),
        description: 'Single line of text',
        color: '#f59e0b',
        defaultWidth: 150,
    },
    {
        id: 'select',
        name: 'Status',
        icon: (
            <svg
                width='20'
                height='20'
                viewBox='0 0 24 24'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
            >
                <rect
                    x='3'
                    y='4'
                    width='18'
                    height='16'
                    rx='2'
                    fill='currentColor'
                    fillOpacity='0.2'
                />
                <rect
                    x='3'
                    y='4'
                    width='18'
                    height='16'
                    rx='2'
                    stroke='currentColor'
                    strokeWidth='2'
                />
                <path
                    d='M7 12L10 15L17 8'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                />
            </svg>
        ),
        description: 'Dropdown with predefined options',
        color: '#10b981',
        defaultWidth: 140,
        requiresOptions: true,
    },
    {
        id: 'date',
        name: 'Date',
        icon: (
            <svg
                width='20'
                height='20'
                viewBox='0 0 24 24'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
            >
                <rect
                    x='3'
                    y='4'
                    width='18'
                    height='18'
                    rx='2'
                    stroke='currentColor'
                    strokeWidth='2'
                />
                <path
                    d='M16 2V6'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                />
                <path
                    d='M8 2V6'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                />
                <path d='M3 10H21' stroke='currentColor' strokeWidth='2' />
                <circle cx='8' cy='14' r='1' fill='currentColor' />
                <circle cx='12' cy='14' r='1' fill='currentColor' />
                <circle cx='16' cy='14' r='1' fill='currentColor' />
                <circle cx='8' cy='18' r='1' fill='currentColor' />
                <circle cx='12' cy='18' r='1' fill='currentColor' />
            </svg>
        ),
        description: 'Date picker',
        color: '#8b5cf6',
        defaultWidth: 130,
    },
    {
        id: 'number',
        name: 'Numbers',
        icon: (
            <svg
                width='20'
                height='20'
                viewBox='0 0 24 24'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
            >
                <rect
                    x='3'
                    y='3'
                    width='18'
                    height='18'
                    rx='2'
                    stroke='currentColor'
                    strokeWidth='2'
                />
                <path
                    d='M8 8L8 16'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                />
                <path
                    d='M12 6L12 18'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                />
                <path
                    d='M16 10L16 14'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                />
                <circle cx='8' cy='8' r='1' fill='currentColor' />
                <circle cx='12' cy='6' r='1' fill='currentColor' />
                <circle cx='16' cy='10' r='1' fill='currentColor' />
            </svg>
        ),
        description: 'Numeric values',
        color: '#f59e0b',
        defaultWidth: 100,
    },
    {
        id: 'people',
        name: 'People',
        icon: (
            <svg
                width='20'
                height='20'
                viewBox='0 0 24 24'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
            >
                <circle
                    cx='9'
                    cy='7'
                    r='4'
                    stroke='currentColor'
                    strokeWidth='2'
                />
                <path
                    d='M1 21V19C1 16.7909 2.79086 15 5 15H13C15.2091 15 17 16.7909 17 19V21'
                    stroke='currentColor'
                    strokeWidth='2'
                />
                <circle
                    cx='17'
                    cy='7'
                    r='3'
                    stroke='currentColor'
                    strokeWidth='2'
                />
                <path
                    d='M23 21V19C23 17.3431 21.6569 16 20 16H19'
                    stroke='currentColor'
                    strokeWidth='2'
                />
            </svg>
        ),
        description: 'Person or team assignment',
        color: '#3b82f6',
        defaultWidth: 150,
    },
];

// Helper function to get intelligent placeholder text
const getIntelligentPlaceholder = (column, isInput = false) => {
    const title = column.title || 'value';

    switch (column.type) {
        case 'select':
            return `Select ${title}...`;
        case 'date':
            return `Select ${title}...`;
        case 'number':
            return `Add ${title}...`;
        case 'text':
        default:
            return `Add ${title}...`;
    }
};

// Render different column types for main table items
const renderMainTableColumnCell = (
    column,
    item,
    isEditing,
    onFieldChange,
    setEditing,
    isExpanded,
    onToggleExpand,
    customRenderers = {},
) => {
    const value = item[column.id] || '';

    // Check for custom renderer first
    if (
        column.type === 'custom' &&
        column.customRenderer &&
        customRenderers[column.customRenderer]
    ) {
        return customRenderers[column.customRenderer](value, item, column);
    }

    switch (column.type) {
        case 'checkbox':
            return null; // Handled separately

        case 'text':
            if (column.id === 'name') {
                // Special handling for name column with chevron
                return (
                    <>
                        <button
                            className='chevron'
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleExpand(item.id);
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            onPointerDown={(e) => e.stopPropagation()}
                            aria-expanded={isExpanded}
                            aria-label={isExpanded ? 'Collapse' : 'Expand'}
                        >
                            <svg
                                className={`chevron-icon ${
                                    isExpanded ? 'expanded' : ''
                                }`}
                                width='14'
                                height='14'
                                viewBox='0 0 24 24'
                                focusable='false'
                                aria-hidden='true'
                            >
                                <path
                                    d='M8 10l4 4 4-4'
                                    fill='none'
                                    stroke='currentColor'
                                    strokeWidth='2'
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                />
                            </svg>
                        </button>
                        {isEditing ? (
                            <input
                                autoFocus
                                className='add-task-input'
                                value={value}
                                placeholder={getIntelligentPlaceholder(
                                    column,
                                    true,
                                )}
                                onChange={(e) =>
                                    onFieldChange(column.id, e.target.value)
                                }
                                onBlur={() =>
                                    setEditing((s) => ({
                                        ...s,
                                        [column.id]: false,
                                    }))
                                }
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === 'Escape')
                                        setEditing((s) => ({
                                            ...s,
                                            [column.id]: false,
                                        }));
                                }}
                            />
                        ) : (
                            <span
                                className='task-text'
                                onDoubleClick={() =>
                                    setEditing((s) => ({
                                        ...s,
                                        [column.id]: true,
                                    }))
                                }
                                onMouseDown={(e) => e.stopPropagation()}
                                onPointerDown={(e) => e.stopPropagation()}
                            >
                                {value || getIntelligentPlaceholder(column)}
                            </span>
                        )}
                    </>
                );
            } else {
                // Regular text column
                return isEditing ? (
                    <input
                        autoFocus
                        className='add-task-input'
                        value={value}
                        placeholder={getIntelligentPlaceholder(column, true)}
                        onChange={(e) =>
                            onFieldChange(column.id, e.target.value)
                        }
                        onBlur={() =>
                            setEditing((s) => ({...s, [column.id]: false}))
                        }
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === 'Escape')
                                setEditing((s) => ({...s, [column.id]: false}));
                        }}
                    />
                ) : (
                    <span
                        className='task-text'
                        onDoubleClick={() =>
                            setEditing((s) => ({...s, [column.id]: true}))
                        }
                        onMouseDown={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        {value || getIntelligentPlaceholder(column)}
                    </span>
                );
            }

        case 'select':
            return isEditing ? (
                <select
                    autoFocus
                    className='add-task-input'
                    value={value}
                    onChange={(e) => onFieldChange(column.id, e.target.value)}
                    onBlur={() =>
                        setEditing((s) => ({...s, [column.id]: false}))
                    }
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === 'Escape')
                            setEditing((s) => ({...s, [column.id]: false}));
                    }}
                >
                    <option value=''>
                        {getIntelligentPlaceholder(column, true)}
                    </option>
                    {column.options?.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
            ) : (
                <span
                    className={`status-pill ${
                        value === 'Active'
                            ? 'status-Active'
                            : value === 'Inactive'
                            ? 'status-Inactive'
                            : 'status-default'
                    }`}
                    onDoubleClick={() =>
                        setEditing((s) => ({...s, [column.id]: true}))
                    }
                    onMouseDown={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    {value || getIntelligentPlaceholder(column)}
                </span>
            );

        case 'date':
            return isEditing ? (
                <input
                    autoFocus
                    type='date'
                    className='add-task-input'
                    value={value}
                    onChange={(e) => onFieldChange(column.id, e.target.value)}
                    onBlur={() =>
                        setEditing((s) => ({...s, [column.id]: false}))
                    }
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === 'Escape')
                            setEditing((s) => ({...s, [column.id]: false}));
                    }}
                />
            ) : (
                <div className='date-wrapper'>
                    {item.overdue && <span className='overdue-icon'>⚠️</span>}
                    <span
                        className='date-text'
                        onDoubleClick={() =>
                            setEditing((s) => ({...s, [column.id]: true}))
                        }
                        onMouseDown={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        {value || getIntelligentPlaceholder(column)}
                    </span>
                </div>
            );

        case 'number':
            return isEditing ? (
                <input
                    autoFocus
                    type='number'
                    className='add-task-input'
                    value={value}
                    placeholder={getIntelligentPlaceholder(column, true)}
                    onChange={(e) => onFieldChange(column.id, e.target.value)}
                    onBlur={() =>
                        setEditing((s) => ({...s, [column.id]: false}))
                    }
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === 'Escape')
                            setEditing((s) => ({...s, [column.id]: false}));
                    }}
                />
            ) : (
                <span
                    className='task-text'
                    onDoubleClick={() =>
                        setEditing((s) => ({...s, [column.id]: true}))
                    }
                    onMouseDown={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    {value || getIntelligentPlaceholder(column)}
                </span>
            );

        default:
            return isEditing ? (
                <input
                    autoFocus
                    className='add-task-input'
                    value={value}
                    placeholder={getIntelligentPlaceholder(column, true)}
                    onChange={(e) => onFieldChange(column.id, e.target.value)}
                    onBlur={() =>
                        setEditing((s) => ({...s, [column.id]: false}))
                    }
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === 'Escape')
                            setEditing((s) => ({...s, [column.id]: false}));
                    }}
                />
            ) : (
                <span
                    className='task-text'
                    onDoubleClick={() =>
                        setEditing((s) => ({...s, [column.id]: true}))
                    }
                    onMouseDown={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    {value || getIntelligentPlaceholder(column)}
                </span>
            );
    }
};

// Render different column types for subitems
const renderSubitemColumnCell = (
    column,
    subitem,
    isEditing,
    onFieldChange,
    setEditing,
) => {
    const value = subitem[column.id] || '';

    switch (column.type) {
        case 'text':
            return isEditing ? (
                <input
                    autoFocus
                    className='add-task-input'
                    value={value}
                    placeholder={getIntelligentPlaceholder(column, true)}
                    onChange={(e) => onFieldChange(column.id, e.target.value)}
                    onBlur={() =>
                        setEditing((s) => ({...s, [column.id]: false}))
                    }
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === 'Escape')
                            setEditing((s) => ({...s, [column.id]: false}));
                    }}
                />
            ) : (
                <span
                    className='task-text'
                    onDoubleClick={() =>
                        setEditing((s) => ({...s, [column.id]: true}))
                    }
                    onMouseDown={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    {value || getIntelligentPlaceholder(column)}
                </span>
            );

        case 'select':
            return isEditing ? (
                <select
                    autoFocus
                    className='add-task-input'
                    value={value}
                    onChange={(e) => onFieldChange(column.id, e.target.value)}
                    onBlur={() =>
                        setEditing((s) => ({...s, [column.id]: false}))
                    }
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === 'Escape')
                            setEditing((s) => ({...s, [column.id]: false}));
                    }}
                >
                    <option value=''>
                        {getIntelligentPlaceholder(column, true)}
                    </option>
                    {column.options?.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
            ) : (
                <span
                    className='task-text'
                    onDoubleClick={() =>
                        setEditing((s) => ({...s, [column.id]: true}))
                    }
                    onMouseDown={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    {value || getIntelligentPlaceholder(column)}
                </span>
            );

        case 'date':
            return isEditing ? (
                <input
                    autoFocus
                    type='date'
                    className='add-task-input'
                    value={value}
                    onChange={(e) => onFieldChange(column.id, e.target.value)}
                    onBlur={() =>
                        setEditing((s) => ({...s, [column.id]: false}))
                    }
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === 'Escape')
                            setEditing((s) => ({...s, [column.id]: false}));
                    }}
                />
            ) : (
                <span
                    className='task-text'
                    onDoubleClick={() =>
                        setEditing((s) => ({...s, [column.id]: true}))
                    }
                    onMouseDown={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    {value || getIntelligentPlaceholder(column)}
                </span>
            );

        case 'number':
            return isEditing ? (
                <input
                    autoFocus
                    type='number'
                    className='add-task-input'
                    value={value}
                    placeholder={getIntelligentPlaceholder(column, true)}
                    onChange={(e) => onFieldChange(column.id, e.target.value)}
                    onBlur={() =>
                        setEditing((s) => ({...s, [column.id]: false}))
                    }
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === 'Escape')
                            setEditing((s) => ({...s, [column.id]: false}));
                    }}
                />
            ) : (
                <span
                    className='task-text'
                    onDoubleClick={() =>
                        setEditing((s) => ({...s, [column.id]: true}))
                    }
                    onMouseDown={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    {value || getIntelligentPlaceholder(column)}
                </span>
            );

        default:
            return isEditing ? (
                <input
                    autoFocus
                    className='add-task-input'
                    value={value}
                    placeholder={getIntelligentPlaceholder(column, true)}
                    onChange={(e) => onFieldChange(column.id, e.target.value)}
                    onBlur={() =>
                        setEditing((s) => ({...s, [column.id]: false}))
                    }
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === 'Escape')
                            setEditing((s) => ({...s, [column.id]: false}));
                    }}
                />
            ) : (
                <span
                    className='task-text'
                    onDoubleClick={() =>
                        setEditing((s) => ({...s, [column.id]: true}))
                    }
                    onMouseDown={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    {value || getIntelligentPlaceholder(column)}
                </span>
            );
    }
};

function OwnerAvatar({name}) {
    return (
        <div className='owner-avatar'>
            <div className='unassigned-avatar'>👤</div>
        </div>
    );
}

// Resizable column header component
function ResizableHeader({
    column,
    onResize,
    onReorder,
    children,
    isResizing,
    setIsResizing,
    draggedColumn,
    setDraggedColumn,
}) {
    const handleMouseDown = (e) => {
        console.log('Resize handle mousedown', column.id);
        if (!column.resizable) return;
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(column.id);

        const startX = e.clientX;
        const startWidth = column.width;

        const handleMouseMove = (e) => {
            const diff = e.clientX - startX;
            const newWidth = startWidth + diff;
            console.log('Resizing', column.id, 'to', newWidth);
            onResize(column.id, newWidth);
        };

        const handleMouseUp = () => {
            console.log('Resize ended for', column.id);
            setIsResizing(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleDragStart = (e) => {
        // Prevent drag if clicking on resize handle
        if (
            e.target.classList.contains('resize-handle') ||
            e.target.closest('.resize-handle')
        ) {
            e.preventDefault();
            return false;
        }

        console.log('Drag start', column.id);
        setDraggedColumn(column.id);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', column.id);

        // Create a custom drag image
        const dragImage = e.currentTarget.cloneNode(true);
        dragImage.style.opacity = '0.8';
        dragImage.style.transform = 'rotate(2deg)';
        document.body.appendChild(dragImage);
        e.dataTransfer.setDragImage(dragImage, 50, 20);
        setTimeout(() => document.body.removeChild(dragImage), 0);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        if (draggedColumn && draggedColumn !== column.id) {
            e.currentTarget.setAttribute('data-drop-zone', 'true');
        }
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.currentTarget.removeAttribute('data-drop-zone');
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.currentTarget.removeAttribute('data-drop-zone');

        const draggedId = e.dataTransfer.getData('text/plain') || draggedColumn;
        console.log('Drop', draggedId, 'onto', column.id);

        if (draggedId && draggedId !== column.id) {
            console.log('Executing reorder:', draggedId, '->', column.id);
            onReorder(draggedId, column.id);
        } else {
            console.log('Drop cancelled - same column or no dragged column');
        }
        setDraggedColumn(null);
    };

    // Enhanced mouse-based column dragging
    const handleColumnMouseDown = (e) => {
        // Prevent drag if clicking on resize handle
        if (
            e.target.classList.contains('resize-handle') ||
            e.target.closest('.resize-handle')
        ) {
            return;
        }

        console.log('Column mouse down', column.id);
        e.preventDefault();

        const startX = e.clientX;
        const startY = e.clientY;
        const headerElement = e.currentTarget; // Store reference to header element
        let isDragging = false;
        let dragIndicator = null;

        const handleMouseMove = (e) => {
            const diffX = Math.abs(e.clientX - startX);
            const diffY = Math.abs(e.clientY - startY);

            if ((diffX > 5 || diffY > 5) && !isDragging) {
                isDragging = true;
                console.log('Column dragging started for', column.id);
                setDraggedColumn(column.id);

                // Create drag indicator
                dragIndicator = document.createElement('div');
                dragIndicator.style.cssText = `
                    position: fixed;
                    top: ${e.clientY - 10}px;
                    left: ${e.clientX + 10}px;
                    background: #4ba3ff;
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: bold;
                    z-index: 10000;
                    pointer-events: none;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                `;
                dragIndicator.textContent = `Moving: ${column.title}`;
                document.body.appendChild(dragIndicator);

                // Add visual feedback to current column using stored reference
                if (headerElement) {
                    headerElement.style.opacity = '0.5';
                    headerElement.style.transform = 'scale(1.05)';
                }
                document.body.style.cursor = 'grabbing';
            }

            if (isDragging && dragIndicator) {
                dragIndicator.style.top = `${e.clientY - 10}px`;
                dragIndicator.style.left = `${e.clientX + 10}px`;

                // Highlight drop zones
                const elementBelow = document.elementFromPoint(
                    e.clientX,
                    e.clientY,
                );
                const targetHeader = elementBelow?.closest('.resizable-header');

                // Clear all previous highlights
                document.querySelectorAll('.resizable-header').forEach((h) => {
                    h.style.borderLeft = '';
                    h.style.borderRight = '';
                });

                if (targetHeader && targetHeader !== headerElement) {
                    const targetId =
                        targetHeader.getAttribute('data-column-id');
                    if (targetId && targetId !== column.id) {
                        targetHeader.style.borderLeft = '3px solid #4ba3ff';
                        targetHeader.style.borderRight = '3px solid #4ba3ff';
                    }
                }
            }
        };

        const handleMouseUp = (e) => {
            console.log('Column mouse up', column.id);

            if (isDragging) {
                // Find the target column
                const elementBelow = document.elementFromPoint(
                    e.clientX,
                    e.clientY,
                );
                const targetHeader = elementBelow?.closest('.resizable-header');

                if (targetHeader) {
                    const targetId =
                        targetHeader.getAttribute('data-column-id');
                    console.log('Drop column', column.id, 'onto', targetId);

                    if (targetId && targetId !== column.id) {
                        onReorder(column.id, targetId);
                    }
                }

                // Clean up
                if (dragIndicator) {
                    document.body.removeChild(dragIndicator);
                }

                // Clear visual feedback
                document.querySelectorAll('.resizable-header').forEach((h) => {
                    h.style.opacity = '';
                    h.style.transform = '';
                    h.style.borderLeft = '';
                    h.style.borderRight = '';
                });

                document.body.style.cursor = '';
            }

            setDraggedColumn(null);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    return (
        <div
            className={`column-header resizable-header ${
                isResizing === column.id ? 'resizing' : ''
            } ${draggedColumn === column.id ? 'dragging' : ''}`}
            data-column-id={column.id}
            draggable={column.id !== 'checkbox'}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onMouseDown={handleColumnMouseDown}
        >
            {children}
            {column.resizable && (
                <div
                    className='resize-handle'
                    onMouseDown={handleMouseDown}
                    onDragStart={(e) => e.preventDefault()}
                    draggable={false}
                />
            )}
        </div>
    );
}

function SubitemRow({
    subitem,
    sortableId,
    onFieldChange,
    columns,
    selectedItems,
    handleItemSelect,
    gridTemplate,
    subitemColumns,
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
        isOver,
    } = useSortable({
        id: sortableId,
        data: {
            type: 'subitem',
            subitem,
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };
    // Create editing state for all configurable columns
    const initialEditingState = {};
    subitemColumns.forEach((column) => {
        initialEditingState[column.id] = false;
    });
    const [editing, setEditing] = useState(initialEditingState);

    return (
        <div
            ref={setNodeRef}
            style={{...style, gridTemplateColumns: gridTemplate}}
            className='subitems-row'
            title='Drag to reorder'
            data-is-dragging={isDragging}
            data-is-over={isOver}
            {...attributes}
            {...listeners}
        >
            <div className='task-cell checkbox-cell'>
                <input
                    type='checkbox'
                    className='task-checkbox'
                    checked={selectedItems.has(subitem.id)}
                    onChange={() => handleItemSelect(subitem.id)}
                />
            </div>
            {/* Render configurable columns for subitems */}
            {subitemColumns.map((column) => (
                <div key={column.id} className='task-cell'>
                    {renderSubitemColumnCell(
                        column,
                        subitem,
                        editing[column.id],
                        onFieldChange,
                        setEditing,
                    )}
                </div>
            ))}

            {/* Empty cell for + button column */}
            <div className='task-cell add-column-cell'></div>
        </div>
    );
}

function ItemRow({
    item,
    isExpanded,
    onToggleExpand,
    columns,
    sortableId,
    onFieldChange,
    selectedItems,
    handleItemSelect,
    gridTemplate,
    subitemTableCount,
    customRenderers,
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
        isOver,
    } = useSortable({
        id: sortableId,
        data: {
            type: 'item',
            item,
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };
    // Create editing state for all columns dynamically
    const initialEditingState = {};
    columns.forEach((column) => {
        if (column.type !== 'checkbox') {
            initialEditingState[column.id] = false;
        }
    });
    const [editing, setEditing] = useState(initialEditingState);
    return (
        <div
            ref={setNodeRef}
            style={{...style, gridTemplateColumns: gridTemplate}}
            className='task-row'
            title='Drag to reorder'
            data-is-dragging={isDragging}
            data-is-over={isOver}
            {...attributes}
            {...listeners}
        >
            {/* Render columns dynamically based on configuration */}
            {columns.map((column) => {
                if (column.type === 'checkbox') {
                    return (
                        <div
                            key={column.id}
                            className='task-cell checkbox-cell'
                        >
                            <input
                                type='checkbox'
                                className='task-checkbox'
                                data-item-id={item.id}
                                checked={selectedItems.has(item.id)}
                                onChange={() => handleItemSelect(item.id)}
                            />
                        </div>
                    );
                }

                return (
                    <div
                        key={column.id}
                        className={`task-cell ${column.id}-cell`}
                        data-column-type={column.type}
                    >
                        {renderMainTableColumnCell(
                            column,
                            item,
                            editing[column.id],
                            onFieldChange,
                            setEditing,
                            isExpanded,
                            onToggleExpand,
                            customRenderers,
                        )}
                        {/* Show subitem count only for name column */}
                        {column.id === 'name' &&
                            (() => {
                                let totalSubitems = 0;
                                let hasSubitems = false;
                                for (let i = 1; i <= subitemTableCount; i++) {
                                    const subitemArray = item[`subitems${i}`];
                                    if (
                                        subitemArray &&
                                        subitemArray.length > 0
                                    ) {
                                        totalSubitems += subitemArray.length;
                                        hasSubitems = true;
                                    }
                                }
                                return hasSubitems ? (
                                    <span className='sub-count'>
                                        {totalSubitems}
                                    </span>
                                ) : null;
                            })()}
                    </div>
                );
            })}

            {/* Empty cell for + button column */}
            <div className='task-cell add-column-cell'></div>
        </div>
    );
}

const ReusableTableComponent = ({config = null}) => {
    // Use provided config or fallback to default config file
    const configToUse = config || tableConfig;

    const {
        tableName,
        subitemTableCount,
        subitemTables,
        mainTableColumns,
        defaults,
        ui,
        customRenderers,
        initialData,
        onAction,
        loading,
        searchTerm,
        groupBy,
        customHeaderRenderer,
    } = configToUse;

    // Get subitem columns for a specific table
    const getSubitemColumns = (tableNumber) => {
        const tableKey = `table${tableNumber}`;
        return subitemTables[tableKey]?.columns || [];
    };

    // Get subitem table title
    const getSubitemTableTitle = (tableNumber) => {
        const tableKey = `table${tableNumber}`;
        return (
            subitemTables[tableKey]?.title || `Subitems Table ${tableNumber}`
        );
    };
    const [items, setItems] = useState(initialData || []);

    const [expanded, setExpanded] = useState(new Set());
    const [newSubitemNameByItem, setNewSubitemNameByItem] = useState({});
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [selectAll, setSelectAll] = useState(false);

    // Effect to update items when initialData changes
    useEffect(() => {
        if (initialData) {
            console.log(
                '🔄 Updating items with new data:',
                initialData.length,
                'items',
            );
            setItems(initialData);
        }
    }, [initialData]);

    // Debug effect to monitor selection changes
    useEffect(() => {
        console.log('🎯 Selection state changed:', {
            selectedCount: selectedItems.size,
            selectedItems: Array.from(selectedItems),
            selectAllState: selectAll,
            totalItems: items.length,
        });
    }, [selectedItems, selectAll, items.length]);

    // Column configuration state - initialize from config
    const [columns, setColumns] = useState(mainTableColumns);
    const [isResizing, setIsResizing] = useState(false);
    const [draggedColumn, setDraggedColumn] = useState(null);
    const [showAddColumnModal, setShowAddColumnModal] = useState(false);
    const [newColumnName, setNewColumnName] = useState('');
    const [selectedColumnType, setSelectedColumnType] = useState(null);
    const [columnOptions, setColumnOptions] = useState([]);

    // Ref to track task list container for connector height calculations
    const taskListRef = useRef(null);

    // Update vertical connector heights dynamically based on subitem tables
    useEffect(() => {
        const updateConnectorHeights = () => {
            if (!taskListRef.current) return;

            const taskRows = taskListRef.current.querySelectorAll('.task-row');
            taskRows.forEach((taskRow) => {
                const itemId = taskRow
                    .querySelector('.task-checkbox')
                    ?.getAttribute('data-item-id');
                if (!itemId) return;

                // Find all subitem containers for this task row
                let nextElement = taskRow.nextElementSibling;
                const subitemContainers = [];

                while (
                    nextElement &&
                    nextElement.classList.contains('subitems-container')
                ) {
                    subitemContainers.push(nextElement);
                    nextElement = nextElement.nextElementSibling;
                }

                if (subitemContainers.length > 0 && expanded.has(itemId)) {
                    // Calculate total height of all subitem containers including margins
                    const firstContainer = subitemContainers[0];
                    const lastContainer =
                        subitemContainers[subitemContainers.length - 1];

                    // Use offsetTop and offsetHeight for more accurate measurements
                    const totalHeight =
                        lastContainer.offsetTop +
                        lastContainer.offsetHeight -
                        firstContainer.offsetTop +
                        20;

                    // Set CSS custom property on the first container
                    firstContainer.style.setProperty(
                        '--connector-height',
                        `${totalHeight}px`,
                    );
                } else if (subitemContainers.length > 0) {
                    // Reset height when collapsed
                    subitemContainers[0].style.removeProperty(
                        '--connector-height',
                    );
                }
            });
        };

        // Update heights when expanded items change or when component mounts
        const timeoutId = setTimeout(updateConnectorHeights, 150);

        return () => clearTimeout(timeoutId);
    }, [expanded, items, subitemTableCount]);

    // Generate grid template from column configuration
    const getGridTemplate = () => {
        const sortedColumns = [...columns].sort((a, b) => a.order - b.order);
        const columnWidths = sortedColumns
            .map((col) => `${col.width}px`)
            .join(' ');
        return `${columnWidths} 60px`; // Add space for + button
    };

    // Generate grid template for subitem tables based on specific table's columns
    const getSubitemGridTemplate = (tableNumber) => {
        const subitemColumns = getSubitemColumns(tableNumber);
        const columnWidths = subitemColumns
            .map((col) => `${col.width}px`)
            .join(' ');
        return `60px ${columnWidths} 60px`; // checkbox + configured columns + add button
    };

    // Handle adding new column
    const handleAddColumn = () => {
        if (newColumnName.trim() && selectedColumnType) {
            const columnType = COLUMN_TYPES.find(
                (type) => type.id === selectedColumnType,
            );
            const newColumn = {
                id: `custom_${Date.now()}`,
                title: newColumnName.trim(),
                type: selectedColumnType,
                width: columnType.defaultWidth,
                resizable: true,
                order: columns.length,
                pinned: false,
            };

            // Add options for select type columns
            if (selectedColumnType === 'select' && columnOptions.length > 0) {
                newColumn.options = columnOptions;
            }

            setColumns([...columns, newColumn]);

            // Add empty values for the new column to all existing items and subitems
            const updatedItems = items.map((item) => {
                const updatedItem = {
                    ...item,
                    [newColumn.id]: '',
                };

                // Dynamically update all subitem tables
                for (let i = 1; i <= subitemTableCount; i++) {
                    const subitemKey = `subitems${i}`;
                    updatedItem[subitemKey] =
                        item[subitemKey]?.map((subitem) => ({
                            ...subitem,
                            [newColumn.id]: '',
                        })) || [];
                }

                return updatedItem;
            });
            setItems(updatedItems);

            setNewColumnName('');
            setSelectedColumnType(null);
            setColumnOptions([]);
            setShowAddColumnModal(false);
        }
    };

    // Handle column resize
    const handleColumnResize = (columnId, newWidth) => {
        setColumns((prev) =>
            prev.map((col) =>
                col.id === columnId
                    ? {...col, width: Math.max(50, newWidth)}
                    : col,
            ),
        );
    };

    // Handle column reorder
    const handleColumnReorder = (draggedId, targetId) => {
        console.log(
            'Reordering column:',
            draggedId,
            'to position of:',
            targetId,
        );
        const draggedCol = columns.find((col) => col.id === draggedId);
        const targetCol = columns.find((col) => col.id === targetId);

        if (!draggedCol || !targetCol) {
            console.log('Column not found:', draggedCol, targetCol);
            return;
        }

        setColumns((prev) => {
            const newColumns = [...prev];
            const draggedIndex = newColumns.findIndex(
                (col) => col.id === draggedId,
            );
            const targetIndex = newColumns.findIndex(
                (col) => col.id === targetId,
            );

            console.log(
                'Swapping orders:',
                draggedCol.order,
                '<->',
                targetCol.order,
            );

            // Swap orders
            newColumns[draggedIndex].order = targetCol.order;
            newColumns[targetIndex].order = draggedCol.order;

            console.log(
                'New column order:',
                newColumns.map((c) => `${c.id}:${c.order}`),
            );
            return newColumns;
        });
    };

    // Get all item IDs (including subitems)
    const getAllItemIds = () => {
        const ids = [];
        items.forEach((item) => {
            // Add main item ID
            ids.push(item.id);

            // Dynamically check all subitem tables
            for (let i = 1; i <= subitemTableCount; i++) {
                const subitemArray = item[`subitems${i}`];
                if (subitemArray && Array.isArray(subitemArray)) {
                    subitemArray.forEach((subitem) => {
                        if (subitem && subitem.id) {
                            ids.push(subitem.id);
                        }
                    });
                }
            }
        });

        console.log('📋 getAllItemIds:', {
            totalItems: items.length,
            subitemTableCount,
            allIds: ids,
            mainItemIds: items.map((item) => item.id),
            subitemCounts: items.map((item) => {
                const counts = {};
                for (let i = 1; i <= subitemTableCount; i++) {
                    const subitemArray = item[`subitems${i}`];
                    counts[`subitems${i}`] = subitemArray
                        ? subitemArray.length
                        : 0;
                }
                return counts;
            }),
        });

        return ids;
    };

    // Handle select all toggle
    const handleSelectAll = () => {
        console.log(
            '🔄 handleSelectAll called, current selectAll state:',
            selectAll,
        );

        if (selectAll) {
            // Deselect all
            console.log('❌ Deselecting all items');
            setSelectedItems(new Set());
            setSelectAll(false);
        } else {
            // Select all
            const allIds = getAllItemIds();
            console.log('✅ Selecting all items:', allIds);
            setSelectedItems(new Set(allIds));
            setSelectAll(true);
        }
    };

    // Helper function for bulk selection without cascading
    const handleBulkSelect = (itemIds, shouldSelect) => {
        setSelectedItems((prev) => {
            const next = new Set(prev);
            itemIds.forEach((id) => {
                if (shouldSelect) {
                    next.add(id);
                } else {
                    next.delete(id);
                }
            });

            // Update select all state
            const allIds = getAllItemIds();
            const newSelectAllState =
                allIds.length > 0 && allIds.every((id) => next.has(id));
            console.log('🔄 Bulk selection - updating select all state:', {
                allIdsCount: allIds.length,
                selectedCount: next.size,
                newSelectAllState,
                bulkItemsCount: itemIds.length,
            });
            setSelectAll(newSelectAllState);

            return next;
        });
    };

    // Handle individual item selection with cascading logic
    const handleItemSelect = (itemId) => {
        setSelectedItems((prev) => {
            const next = new Set(prev);

            // Find if this is a main item or subitem
            const mainItem = items.find((item) => item.id === itemId);

            if (mainItem) {
                // This is a main item - toggle it and all its subitems
                if (next.has(itemId)) {
                    // Deselecting main item - also deselect all its subitems
                    next.delete(itemId);
                    for (let i = 1; i <= subitemTableCount; i++) {
                        const subitemArray = mainItem[`subitems${i}`];
                        if (subitemArray) {
                            subitemArray.forEach((subitem) =>
                                next.delete(subitem.id),
                            );
                        }
                    }
                } else {
                    // Selecting main item - also select all its subitems
                    next.add(itemId);
                    for (let i = 1; i <= subitemTableCount; i++) {
                        const subitemArray = mainItem[`subitems${i}`];
                        if (subitemArray) {
                            subitemArray.forEach((subitem) =>
                                next.add(subitem.id),
                            );
                        }
                    }
                }
            } else {
                // This is a subitem - just toggle it
                if (next.has(itemId)) {
                    next.delete(itemId);
                } else {
                    next.add(itemId);
                }

                // Check if we should auto-select/deselect the parent item
                const parentItem = items.find((item) => {
                    for (let i = 1; i <= subitemTableCount; i++) {
                        const subitemArray = item[`subitems${i}`];
                        if (
                            subitemArray &&
                            subitemArray.some((sub) => sub.id === itemId)
                        ) {
                            return true;
                        }
                    }
                    return false;
                });

                if (parentItem) {
                    // Get all subitems of the parent
                    const allParentSubitems = [];
                    for (let i = 1; i <= subitemTableCount; i++) {
                        const subitemArray = parentItem[`subitems${i}`];
                        if (subitemArray) {
                            allParentSubitems.push(...subitemArray);
                        }
                    }

                    // Check if all subitems are selected
                    const allSubitemsSelected = allParentSubitems.every((sub) =>
                        next.has(sub.id),
                    );

                    if (allSubitemsSelected && allParentSubitems.length > 0) {
                        // All subitems are selected, select parent too
                        next.add(parentItem.id);
                    } else {
                        // Not all subitems are selected, deselect parent
                        next.delete(parentItem.id);
                    }
                }
            }

            // Update select all state
            const allIds = getAllItemIds();
            const newSelectAllState =
                allIds.length > 0 && allIds.every((id) => next.has(id));
            console.log(
                '🔄 Individual selection - updating select all state:',
                {
                    allIdsCount: allIds.length,
                    selectedCount: next.size,
                    newSelectAllState,
                    changedItemId: itemId,
                },
            );
            setSelectAll(newSelectAllState);

            return next;
        });
    };

    const handleToggleExpand = (itemId) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(itemId)) next.delete(itemId);
            else next.add(itemId);
            return next;
        });
    };

    // Handle drag end for reordering
    const handleDragEnd = (event) => {
        // Reset cursor
        document.body.style.cursor = '';

        const {Active, over} = event;

        console.log('🚀 Drag End Event:', {
            Active: Active?.id,
            over: over?.id,
            hasOver: !!over,
            sameElement: Active?.id === over?.id,
            ActiveData: Active?.data?.current,
            overData: over?.data?.current,
        });

        if (!over) {
            console.log('❌ Drag cancelled: no drop target found');
            return;
        }

        if (Active.id === over.id) {
            console.log('❌ Drag cancelled: dropped on same element');
            return;
        }

        const ActiveId = Active.id.toString();
        const overId = over.id.toString();

        console.log('📝 Processing drag:', {ActiveId, overId});

        // Handle item reordering (main items)
        if (ActiveId.startsWith('item:') && overId.startsWith('item:')) {
            console.log('✅ Processing main item reorder');
            // Extract the actual item ID (e.g., "item:item-2" -> "item-2")
            const ActiveItemIdStr = ActiveId.split(':')[1];
            const overItemIdStr = overId.split(':')[1];

            console.log('📦 Item ID strings:', {
                ActiveItemIdStr,
                overItemIdStr,
            });

            setItems((prevItems) => {
                const oldIndex = prevItems.findIndex(
                    (item) => item.id === ActiveItemIdStr,
                );
                const newIndex = prevItems.findIndex(
                    (item) => item.id === overItemIdStr,
                );

                console.log('📍 Indexes:', {oldIndex, newIndex});
                console.log('🔍 Looking for items:', {
                    ActiveItemIdStr,
                    overItemIdStr,
                });
                console.log(
                    '📋 Available items:',
                    prevItems.map((item) => item.id),
                );

                if (oldIndex !== -1 && newIndex !== -1) {
                    const newItems = arrayMove(prevItems, oldIndex, newIndex);
                    console.log('🎉 Successfully reordered main items');
                    return newItems;
                }
                console.log('❌ Failed to find items for reordering');
                return prevItems;
            });
        }

        // Handle subitem reordering (subitems within the same parent)
        if (ActiveId.startsWith('sub:') && overId.startsWith('sub:')) {
            console.log('✅ Processing subitem reorder');
            const [, ActiveParentId, ActiveSubId] = ActiveId.split(':');
            const [, overParentId, overSubId] = overId.split(':');

            console.log('👥 Subitem details:', {
                ActiveParentId,
                ActiveSubId,
                overParentId,
                overSubId,
            });

            // Only allow reordering within the same parent
            if (ActiveParentId === overParentId) {
                console.log('✅ Same parent - proceeding with reorder');
                // Use string IDs directly instead of parsing as integers
                const parentIdStr = ActiveParentId;
                const ActiveSubitemIdStr = ActiveSubId;
                const overSubitemIdStr = overSubId;

                setItems((prevItems) => {
                    return prevItems.map((item) => {
                        if (item.id === parentIdStr) {
                            // Check which table the subitems belong to
                            let tableType = null;
                            let oldIndex = -1;
                            let newIndex = -1;

                            // Dynamically check all subitem tables
                            for (let i = 1; i <= subitemTableCount; i++) {
                                const subitemKey = `subitems${i}`;
                                const subitemArray = item[subitemKey];

                                if (subitemArray) {
                                    const oldIdx = subitemArray.findIndex(
                                        (sub) => sub.id === ActiveSubitemIdStr,
                                    );
                                    const newIdx = subitemArray.findIndex(
                                        (sub) => sub.id === overSubitemIdStr,
                                    );

                                    if (oldIdx !== -1 && newIdx !== -1) {
                                        tableType = subitemKey;
                                        oldIndex = oldIdx;
                                        newIndex = newIdx;
                                        break; // Found the table, exit loop
                                    }
                                }
                            }

                            console.log('🔄 Reordering subitems:', {
                                tableType,
                                oldIndex,
                                newIndex,
                            });

                            if (
                                tableType &&
                                oldIndex !== -1 &&
                                newIndex !== -1
                            ) {
                                const newSubitems = arrayMove(
                                    item[tableType],
                                    oldIndex,
                                    newIndex,
                                );
                                console.log(
                                    '🎉 Successfully reordered subitems in',
                                    tableType,
                                );
                                return {...item, [tableType]: newSubitems};
                            }
                        }
                        return item;
                    });
                });
            } else {
                console.log('❌ Different parents - cannot reorder');
            }
        }
    };

    // Click-to-add: insert a blank item row without prompting for a name
    const addItemBlank = () => {
        const newItem = {
            id: `item-${Date.now()}`,
            ...defaults.mainItem,
        };

        // Dynamically create subitem arrays based on subitemTableCount
        for (let i = 1; i <= subitemTableCount; i++) {
            newItem[`subitems${i}`] = [];
        }

        setItems((prev) => [...prev, newItem]);
    };

    // Click-to-add: insert a blank subitem row without prompting for a name
    const addSubitemBlank = (itemId, tableType = 'subitems1') => {
        // Create new subitem with configured column structure
        const newSubitem = {
            id: `sub-${Date.now()}`,
        };

        // Extract table number from tableType (e.g., 'subitems1' -> 1)
        const tableNumber = parseInt(tableType.replace('subitems', ''));
        const subitemColumns = getSubitemColumns(tableNumber);

        // Initialize all configured columns with default values
        subitemColumns.forEach((column) => {
            switch (column.type) {
                case 'text':
                    newSubitem[column.id] = defaults.subitem[column.id] || '';
                    break;
                case 'select':
                    newSubitem[column.id] =
                        defaults.subitem[column.id] ||
                        column.options?.[0] ||
                        '';
                    break;
                case 'date':
                    newSubitem[column.id] = defaults.subitem[column.id] || '';
                    break;
                case 'number':
                    newSubitem[column.id] = defaults.subitem[column.id] || 0;
                    break;
                default:
                    newSubitem[column.id] = defaults.subitem[column.id] || '';
            }
        });

        setItems((prev) =>
            prev.map((it) =>
                it.id === itemId
                    ? {
                          ...it,
                          [tableType]: [...it[tableType], newSubitem],
                      }
                    : it,
            ),
        );
        setExpanded((prev) => new Set(prev).add(itemId));
    };

    const renderSubitemsTable = (
        item,
        tableType = 'subitems1',
        tableNumber = 1,
    ) => {
        const tableTitle = getSubitemTableTitle(tableNumber);
        const subitemColumns = getSubitemColumns(tableNumber);
        const newName = newSubitemNameByItem[item.id] || '';
        const visibleSubs = item[tableType] || [];
        return (
            <div className='subitems-container'>
                <div
                    className='subitems-header'
                    style={{
                        gridTemplateColumns:
                            getSubitemGridTemplate(tableNumber),
                    }}
                >
                    <div className='column-header checkbox-column'>
                        <input
                            type='checkbox'
                            checked={
                                visibleSubs &&
                                visibleSubs.length > 0 &&
                                visibleSubs.every((subitem) =>
                                    selectedItems.has(subitem.id),
                                )
                            }
                            onChange={() => {
                                if (visibleSubs) {
                                    const allSubitemsSelected =
                                        visibleSubs.every((subitem) =>
                                            selectedItems.has(subitem.id),
                                        );

                                    // Use bulk select to avoid cascading conflicts
                                    const subitemIds = visibleSubs.map(
                                        (sub) => sub.id,
                                    );
                                    handleBulkSelect(
                                        subitemIds,
                                        !allSubitemsSelected,
                                    );
                                }
                            }}
                        />
                    </div>

                    {/* Render configurable column headers */}
                    {subitemColumns.map((column) => (
                        <div key={column.id} className='column-header'>
                            <span>{column.title}</span>
                        </div>
                    ))}

                    {/* Empty cell for alignment with main table */}
                    <div className='add-column-cell'></div>
                </div>
                <SortableContext
                    items={visibleSubs.map((s) => `sub:${item.id}:${s.id}`)}
                    strategy={verticalListSortingStrategy}
                >
                    {visibleSubs.map((s) => (
                        <SubitemRow
                            key={s.id}
                            subitem={s}
                            sortableId={`sub:${item.id}:${s.id}`}
                            selectedItems={selectedItems}
                            handleItemSelect={handleItemSelect}
                            columns={columns}
                            subitemColumns={subitemColumns}
                            gridTemplate={getSubitemGridTemplate(tableNumber)}
                            onFieldChange={(field, value) => {
                                setItems((prev) =>
                                    prev.map((it) =>
                                        it.id === item.id
                                            ? {
                                                  ...it,
                                                  [tableType]: it[
                                                      tableType
                                                  ].map((x) =>
                                                      x.id === s.id
                                                          ? {
                                                                ...x,
                                                                [field]: value,
                                                            }
                                                          : x,
                                                  ),
                                              }
                                            : it,
                                    ),
                                );
                            }}
                        />
                    ))}
                </SortableContext>
                <div
                    className='add-subitem-row'
                    style={{
                        gridTemplateColumns:
                            getSubitemGridTemplate(tableNumber),
                    }}
                    onClick={() => addSubitemBlank(item.id, tableType)}
                >
                    <div className='task-cell checkbox-cell'></div>
                    {/* Empty cells for configured columns */}
                    {subitemColumns.map((column) => (
                        <div key={column.id} className='task-cell'>
                            {column.id === 'name' ? (
                                <span className='add-task-input'>
                                    + Add subitem
                                </span>
                            ) : null}
                        </div>
                    ))}
                    {/* Empty cell for alignment with main table */}
                    <div className='task-cell add-column-cell'></div>
                </div>
            </div>
        );
    };

    const visibleItems = items;

    const renderTable = () => {
        const sortedColumns = [...columns].sort((a, b) => a.order - b.order);

        return (
            <div className='task-group'>
                <div
                    className='table-header'
                    style={{gridTemplateColumns: getGridTemplate()}}
                >
                    {sortedColumns.map((column) => {
                        if (column.id === 'checkbox') {
                            return (
                                <ResizableHeader
                                    key={column.id}
                                    column={column}
                                    onResize={handleColumnResize}
                                    onReorder={handleColumnReorder}
                                    isResizing={isResizing}
                                    setIsResizing={setIsResizing}
                                    draggedColumn={draggedColumn}
                                    setDraggedColumn={setDraggedColumn}
                                >
                                    <div className='checkbox-cell'>
                                        <input
                                            type='checkbox'
                                            className='task-checkbox'
                                            checked={selectAll}
                                            onChange={handleSelectAll}
                                        />
                                    </div>
                                </ResizableHeader>
                            );
                        }

                        return (
                            <ResizableHeader
                                key={column.id}
                                column={column}
                                onResize={handleColumnResize}
                                onReorder={handleColumnReorder}
                                isResizing={isResizing}
                                setIsResizing={setIsResizing}
                                draggedColumn={draggedColumn}
                                setDraggedColumn={setDraggedColumn}
                            >
                                {customHeaderRenderer ? (
                                    customHeaderRenderer(column)
                                ) : (
                                    <div className='header-content'>
                                        <span className='header-title'>
                                            {column.title}
                                        </span>
                                    </div>
                                )}
                            </ResizableHeader>
                        );
                    })}

                    {/* Add Column Button */}
                    <div
                        className='add-column-button'
                        onClick={() => setShowAddColumnModal(true)}
                    >
                        <span className='add-column-icon'>+</span>
                    </div>
                </div>

                <SortableContext
                    items={visibleItems.map((it) => `item:${it.id}`)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className='task-list' ref={taskListRef}>
                        {visibleItems.map((item) => (
                            <React.Fragment key={item.id}>
                                <ItemRow
                                    item={item}
                                    sortableId={`item:${item.id}`}
                                    isExpanded={expanded.has(item.id)}
                                    onToggleExpand={handleToggleExpand}
                                    selectedItems={selectedItems}
                                    columns={columns}
                                    handleItemSelect={handleItemSelect}
                                    gridTemplate={getGridTemplate()}
                                    subitemTableCount={subitemTableCount}
                                    customRenderers={customRenderers}
                                    onFieldChange={(field, value) => {
                                        setItems((prev) =>
                                            prev.map((it) =>
                                                it.id === item.id
                                                    ? {...it, [field]: value}
                                                    : it,
                                            ),
                                        );
                                    }}
                                />
                                {expanded.has(item.id) && (
                                    <>
                                        {Array.from(
                                            {length: subitemTableCount},
                                            (_, index) => {
                                                const tableNumber = index + 1;
                                                const tableType = `subitems${tableNumber}`;
                                                return renderSubitemsTable(
                                                    item,
                                                    tableType,
                                                    tableNumber,
                                                );
                                            },
                                        )}
                                    </>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </SortableContext>

                <div
                    className={`add-task-row ${
                        visibleItems.length === 0 ? 'empty-state' : ''
                    }`}
                    style={{gridTemplateColumns: getGridTemplate()}}
                    onClick={() => addItemBlank()}
                >
                    <div className='task-cell checkbox-cell'></div>
                    <div className='task-cell task-name'>
                        <span className='add-task-input'>+ Add item</span>
                    </div>
                    {/* Empty cells for existing columns */}
                    {columns
                        .filter(
                            (col) =>
                                !col.id.startsWith('custom_') &&
                                col.id !== 'checkbox' &&
                                col.id !== 'name',
                        )
                        .map((column) => (
                            <div key={column.id} className='task-cell'></div>
                        ))}
                    {/* Empty cells for custom columns */}
                    {columns
                        .filter((col) => col.id.startsWith('custom_'))
                        .map((column) => (
                            <div key={column.id} className='task-cell'></div>
                        ))}
                    {/* Empty cell for + button */}
                    <div className='task-cell'></div>
                </div>
            </div>
        );
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor),
    );

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={pointerWithin}
            onDragStart={(event) => {
                console.log('🎯 Drag Started:', event.Active.id);
                document.body.style.cursor = 'grabbing';
            }}
            onDragOver={(event) => {
                console.log('🎯 Drag Over:', {
                    Active: event.Active?.id,
                    over: event.over?.id,
                    hasOver: !!event.over,
                });
                // Visual feedback for debugging
                if (event.over?.id) {
                    console.log('✅ DROP ZONE DETECTED:', event.over.id);
                }
            }}
            onDragEnd={handleDragEnd}
            onDragCancel={() => {
                console.log('🎯 Drag Cancelled');
                document.body.style.cursor = '';
            }}
        >
            <div className='task-board'>{renderTable()}</div>

            {/* Add Column Modal */}
            {showAddColumnModal && (
                <div
                    className='modal-overlay'
                    onClick={() => {
                        setShowAddColumnModal(false);
                        setSelectedColumnType(null);
                        setNewColumnName('');
                        setColumnOptions([]);
                    }}
                >
                    <div
                        className='modal-content column-type-modal'
                        onClick={(e) => e.stopPropagation()}
                    >
                        {!selectedColumnType ? (
                            <>
                                <h3>Add New Column</h3>
                                <div className='search-container'>
                                    <div className='search-input-wrapper'>
                                        <svg
                                            className='search-icon'
                                            width='16'
                                            height='16'
                                            viewBox='0 0 24 24'
                                            fill='none'
                                            xmlns='http://www.w3.org/2000/svg'
                                        >
                                            <circle
                                                cx='11'
                                                cy='11'
                                                r='8'
                                                stroke='currentColor'
                                                strokeWidth='2'
                                            />
                                            <path
                                                d='m21 21-4.35-4.35'
                                                stroke='currentColor'
                                                strokeWidth='2'
                                                strokeLinecap='round'
                                                strokeLinejoin='round'
                                            />
                                        </svg>
                                        <input
                                            type='text'
                                            placeholder='Search or describe your column'
                                            className='column-search'
                                        />
                                    </div>
                                </div>

                                <div className='column-types-section'>
                                    <h4>Essentials</h4>
                                    <div className='column-types-grid'>
                                        {COLUMN_TYPES.map((type) => (
                                            <div
                                                key={type.id}
                                                className='column-type-card'
                                                onClick={() =>
                                                    setSelectedColumnType(
                                                        type.id,
                                                    )
                                                }
                                            >
                                                <div
                                                    className='column-type-icon'
                                                    style={{
                                                        backgroundColor:
                                                            type.color,
                                                    }}
                                                >
                                                    {type.icon}
                                                </div>
                                                <div className='column-type-info'>
                                                    <h5>{type.name}</h5>
                                                    <p>{type.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className='modal-header'>
                                    <button
                                        className='back-button'
                                        onClick={() =>
                                            setSelectedColumnType(null)
                                        }
                                    >
                                        ← Back
                                    </button>
                                    <h3>
                                        Configure{' '}
                                        {
                                            COLUMN_TYPES.find(
                                                (t) =>
                                                    t.id === selectedColumnType,
                                            )?.name
                                        }{' '}
                                        Column
                                    </h3>
                                </div>

                                <div className='column-config'>
                                    <label>Column Name</label>
                                    <input
                                        type='text'
                                        placeholder='Enter column name...'
                                        value={newColumnName}
                                        onChange={(e) =>
                                            setNewColumnName(e.target.value)
                                        }
                                        autoFocus
                                    />

                                    {selectedColumnType === 'select' && (
                                        <div className='options-config'>
                                            <label>Options</label>
                                            <div className='options-list'>
                                                {columnOptions.map(
                                                    (option, index) => (
                                                        <div
                                                            key={index}
                                                            className='option-item'
                                                        >
                                                            <input
                                                                type='text'
                                                                value={option}
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    const newOptions =
                                                                        [
                                                                            ...columnOptions,
                                                                        ];
                                                                    newOptions[
                                                                        index
                                                                    ] =
                                                                        e.target.value;
                                                                    setColumnOptions(
                                                                        newOptions,
                                                                    );
                                                                }}
                                                                placeholder={`Option ${
                                                                    index + 1
                                                                }`}
                                                            />
                                                            <button
                                                                onClick={() => {
                                                                    const newOptions =
                                                                        columnOptions.filter(
                                                                            (
                                                                                _,
                                                                                i,
                                                                            ) =>
                                                                                i !==
                                                                                index,
                                                                        );
                                                                    setColumnOptions(
                                                                        newOptions,
                                                                    );
                                                                }}
                                                                className='remove-option'
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    ),
                                                )}
                                                <button
                                                    onClick={() =>
                                                        setColumnOptions([
                                                            ...columnOptions,
                                                            '',
                                                        ])
                                                    }
                                                    className='add-option'
                                                >
                                                    + Add Option
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className='modal-buttons'>
                                    <button
                                        onClick={() => {
                                            setShowAddColumnModal(false);
                                            setSelectedColumnType(null);
                                            setNewColumnName('');
                                            setColumnOptions([]);
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAddColumn}
                                        disabled={
                                            !newColumnName.trim() ||
                                            (selectedColumnType === 'select' &&
                                                columnOptions.filter((opt) =>
                                                    opt.trim(),
                                                ).length === 0)
                                        }
                                        className='primary-button'
                                    >
                                        Add Column
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </DndContext>
    );
};

export default ReusableTableComponent;
