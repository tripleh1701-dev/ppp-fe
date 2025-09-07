import React, {useState, useEffect, useRef, useCallback} from 'react';
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
    openPasswordModal,
    showTooltip,
    hideTooltip,
    openModernUIFunc,
) => {
    const value = item[column.id] || '';

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
                        value === 'active'
                            ? 'status-active'
                            : value === 'inactive'
                            ? 'status-inactive'
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
        case 'datetime':
            return isEditing ? (
                <input
                    autoFocus
                    type={
                        column.type === 'datetime' ? 'datetime-local' : 'date'
                    }
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
                    {/* Calendar icon and + button for date/datetime fields */}
                    {(column.type === 'date' || column.type === 'datetime') && (
                        <>
                            <span className='calendar-icon'>📅</span>
                            <button
                                className='date-add-button'
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setEditing((s) => ({
                                        ...s,
                                        [column.id]: true,
                                    }));
                                }}
                            >
                                +
                            </button>
                        </>
                    )}
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

        case 'password':
            return (
                <div className='password-wrapper'>
                    <div
                        className={`password-key-icon ${
                            value ? 'password-set' : ''
                        }`}
                        onClick={(e) => {
                            e.stopPropagation();
                            openPasswordModal(item.id, column.id, e);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                        title={
                            value
                                ? 'Password is set - Click to change'
                                : 'Click to set password'
                        }
                    >
                        🔑
                    </div>
                </div>
            );

        case 'userGroup':
            const userGroups = value ? (Array.isArray(value) ? value : []) : [];
            return (
                <div
                    className='usergroup-wrapper'
                    onMouseEnter={(e) => showTooltip(e, item.id, column.id)}
                    onMouseLeave={hideTooltip}
                >
                    <div className='usergroup-display'>
                        <div className='usergroup-icon'>
                            <svg
                                width='16'
                                height='16'
                                viewBox='0 0 24 24'
                                fill='none'
                                xmlns='http://www.w3.org/2000/svg'
                            >
                                <path
                                    d='M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z'
                                    stroke='currentColor'
                                    strokeWidth='2'
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                />
                                <path
                                    d='M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z'
                                    stroke='currentColor'
                                    strokeWidth='2'
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                />
                            </svg>
                        </div>
                        <button
                            className='usergroup-add-button'
                            onClick={(e) => {
                                console.log('🔥 User group button clicked!', {
                                    itemId: item.id,
                                    columnId: column.id,
                                });
                                e.stopPropagation();
                                hideTooltip();
                                openModernUIFunc(
                                    item.id,
                                    column.id,
                                    'floating',
                                );
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            onPointerDown={(e) => e.stopPropagation()}
                            title='Add user group'
                        >
                            +
                        </button>
                    </div>
                </div>
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
        case 'datetime':
            return isEditing ? (
                <input
                    autoFocus
                    type={
                        column.type === 'datetime' ? 'datetime-local' : 'date'
                    }
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
                    {/* Calendar icon and + button for date/datetime fields */}
                    {(column.type === 'date' || column.type === 'datetime') && (
                        <>
                            <span className='calendar-icon'>📅</span>
                            <button
                                className='date-add-button'
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setEditing((s) => ({
                                        ...s,
                                        [column.id]: true,
                                    }));
                                }}
                            >
                                +
                            </button>
                        </>
                    )}
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

        case 'password':
            return (
                <div className='password-wrapper'>
                    <div
                        className={`password-key-icon ${
                            value ? 'password-set' : ''
                        }`}
                        onClick={(e) => {
                            e.stopPropagation();
                            openPasswordModal(item.id, column.id, e);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                        title={
                            value
                                ? 'Password is set - Click to change'
                                : 'Click to set password'
                        }
                    >
                        🔑
                    </div>
                </div>
            );

        case 'userGroup':
            const userGroups = value ? (Array.isArray(value) ? value : []) : [];
            return (
                <div
                    className='usergroup-wrapper'
                    onMouseEnter={(e) => showTooltip(e, item.id, column.id)}
                    onMouseLeave={hideTooltip}
                >
                    <div className='usergroup-display'>
                        <div className='usergroup-icon'>
                            <svg
                                width='16'
                                height='16'
                                viewBox='0 0 24 24'
                                fill='none'
                                xmlns='http://www.w3.org/2000/svg'
                            >
                                <path
                                    d='M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z'
                                    stroke='currentColor'
                                    strokeWidth='2'
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                />
                                <path
                                    d='M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z'
                                    stroke='currentColor'
                                    strokeWidth='2'
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                />
                            </svg>
                        </div>
                        <button
                            className='usergroup-add-button'
                            onClick={(e) => {
                                console.log('🔥 User group button clicked!', {
                                    itemId: item.id,
                                    columnId: column.id,
                                });
                                e.stopPropagation();
                                hideTooltip();
                                openModernUIFunc(
                                    item.id,
                                    column.id,
                                    'floating',
                                );
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            onPointerDown={(e) => e.stopPropagation()}
                            title='Add user group'
                        >
                            +
                        </button>
                    </div>
                </div>
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
    openPasswordModal,
    showTooltip,
    hideTooltip,
    openModernUI,
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
                    >
                        {renderMainTableColumnCell(
                            column,
                            item,
                            editing[column.id],
                            onFieldChange,
                            setEditing,
                            isExpanded,
                            onToggleExpand,
                            openPasswordModal,
                            showTooltip,
                            hideTooltip,
                            openModernUI,
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
    const [items, setItems] = useState([]);

    const [expanded, setExpanded] = useState(new Set());
    const [newSubitemNameByItem, setNewSubitemNameByItem] = useState({});
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [selectAll, setSelectAll] = useState(false);

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

    // Password modal state
    const [passwordModal, setPasswordModal] = useState({
        isOpen: false,
        itemId: null,
        columnId: null,
        position: {top: 0, left: 0},
    });
    const [passwordForm, setPasswordForm] = useState({
        newPassword: '',
        confirmPassword: '',
    });
    const [passwordValidation, setPasswordValidation] = useState({
        minLength: false,
        hasNumber: false,
        hasUppercase: false,
        hasLowercase: false,
        hasSpecialChar: false,
    });

    // Tooltip positioning state
    const [tooltipPosition, setTooltipPosition] = useState({
        top: 0,
        left: 0,
        visible: false,
        itemId: null,
        columnId: null,
    });

    // User group panel state
    // 🚀 Revolutionary Modern UI State
    const [modernUI, setModernUI] = useState({
        mode: 'command', // 'command', 'floating', 'timeline'
        isOpen: false,
        itemId: null,
        columnId: null,
        currentView: 'groups',
        selectedGroupIndex: null,
        selectedRoleIndex: null,
        breadcrumb: ['User Groups'],
        roleSearchQuery: '',
        attributeSearchQuery: '',
        commandPalette: {
            isOpen: false,
            query: '',
            suggestions: [],
            selectedIndex: 0,
        },
        floatingCards: {
            groups: {x: 100, y: 100, visible: false, minimized: false},
            roles: {x: 400, y: 100, visible: false, minimized: false},
            attributes: {x: 700, y: 100, visible: false, minimized: false},
        },
        timeline: {
            currentStep: 0,
            steps: [
                {id: 'user', label: '👤 User', icon: '👤', completed: false},
                {
                    id: 'groups',
                    label: '👥 Groups',
                    icon: '👥',
                    completed: false,
                },
                {id: 'roles', label: '🎭 Roles', icon: '🎭', completed: false},
                {
                    id: 'attributes',
                    label: '⚙️ Attributes',
                    icon: '⚙️',
                    completed: false,
                },
                {
                    id: 'complete',
                    label: '✅ Complete',
                    icon: '✅',
                    completed: false,
                },
            ],
        },
    });

    // User group panel data
    const [userGroupData, setUserGroupData] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [entities, setEntities] = useState([]);
    const [services, setServices] = useState([]);

    // Dropdown state management
    const [dropdownState, setDropdownState] = useState({
        entityDropdown: {isOpen: false, rowIndex: -1},
        servicesDropdown: {isOpen: false, rowIndex: -1},
    });

    // Roles modal state
    const [rolesModal, setRolesModal] = useState({
        isVisible: false,
        rowIndex: -1,
        position: {top: 0, left: 0},
    });

    // 🔄 Dynamic Data Loading Functions
    const loadUserGroups = useCallback(
        async (itemId, columnId) => {
            try {
                // Get account and enterprise IDs from breadcrumb
                const breadcrumbData = JSON.parse(
                    localStorage.getItem('breadcrumb') || '{}',
                );
                const accountId = breadcrumbData.accountId || '3';
                const enterpriseId = breadcrumbData.enterpriseId || '1';

                console.log('🔄 Loading user groups for:', {
                    itemId,
                    columnId,
                    accountId,
                    enterpriseId,
                });

                // Load user groups from API
                const userGroupsResponse = await fetch(
                    `http://localhost:4000/api/user-groups?accountId=${accountId}&enterpriseId=${enterpriseId}`,
                );
                let userGroups = [];

                if (userGroupsResponse.ok) {
                    userGroups = await userGroupsResponse.json();
                    console.log('✅ Loaded user groups from API:', userGroups);
                } else {
                    console.warn(
                        '⚠️ Failed to load user groups from API, using mock data',
                    );
                    // Provide mock data as fallback
                    userGroups = [
                        {
                            id: 'ug-1',
                            name: 'Admin Users',
                            description:
                                'System administrators with full access',
                            entities: [
                                {id: 'e1', name: 'Finance'},
                                {id: 'e2', name: 'HR'},
                            ],
                            services: [
                                {id: 's1', name: 'User Management'},
                                {id: 's2', name: 'System Config'},
                            ],
                            roles: [
                                {id: 'r1', name: 'Super Admin'},
                                {id: 'r2', name: 'System Admin'},
                            ],
                        },
                        {
                            id: 'ug-2',
                            name: 'Finance Team',
                            description:
                                'Financial operations and reporting team',
                            entities: [{id: 'e1', name: 'Finance'}],
                            services: [
                                {id: 's3', name: 'Financial Reports'},
                                {id: 's4', name: 'Budget Management'},
                            ],
                            roles: [
                                {id: 'r3', name: 'Finance Manager'},
                                {id: 'r4', name: 'Accountant'},
                            ],
                        },
                        {
                            id: 'ug-3',
                            name: 'HR Department',
                            description:
                                'Human resources and employee management',
                            entities: [{id: 'e2', name: 'HR'}],
                            services: [
                                {id: 's5', name: 'Employee Management'},
                                {id: 's6', name: 'Payroll'},
                            ],
                            roles: [
                                {id: 'r5', name: 'HR Manager'},
                                {id: 'r6', name: 'HR Specialist'},
                            ],
                        },
                    ];
                }

                // If no user groups exist, initialize with empty array
                setUserGroupData(userGroups);
            } catch (error) {
                console.error('❌ Error loading user groups:', error);
                // Provide mock data as fallback on error
                setUserGroupData([
                    {
                        id: 'ug-demo',
                        name: 'Demo User Group',
                        description: 'Sample user group for demonstration',
                        entities: [{id: 'e1', name: 'Demo Entity'}],
                        services: [{id: 's1', name: 'Demo Service'}],
                        roles: [{id: 'r1', name: 'Demo Role'}],
                    },
                ]);
            }
        },
        [setUserGroupData],
    );

    const loadRoles = useCallback(async (groupId) => {
        try {
            console.log('🔄 Loading roles for group:', groupId);

            const rolesResponse = await fetch(
                `http://localhost:4000/api/roles?groupId=${groupId}`,
            );
            let roles = [];

            if (rolesResponse.ok) {
                roles = await rolesResponse.json();
                console.log('✅ Loaded roles from API:', roles);
            } else {
                console.warn(
                    '⚠️ Failed to load roles from API, using empty array',
                );
                roles = [];
            }

            return roles;
        } catch (error) {
            console.error('❌ Error loading roles:', error);
            return [];
        }
    }, []);

    const loadAttributes = useCallback(async (roleId) => {
        try {
            console.log('🔄 Loading attributes for role:', roleId);

            const attributesResponse = await fetch(
                `http://localhost:4000/api/attributes?roleId=${roleId}`,
            );
            let attributes = [];

            if (attributesResponse.ok) {
                attributes = await attributesResponse.json();
                console.log('✅ Loaded attributes from API:', attributes);
            } else {
                console.warn(
                    '⚠️ Failed to load attributes from API, using empty array',
                );
                attributes = [];
            }

            return attributes;
        } catch (error) {
            console.error('❌ Error loading attributes:', error);
            return [];
        }
    }, []);

    const createUserGroup = useCallback(async (groupData) => {
        try {
            console.log('🔄 Creating new user group:', groupData);

            const response = await fetch(
                'http://localhost:4000/api/user-groups',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(groupData),
                },
            );

            if (response.ok) {
                const newGroup = await response.json();
                console.log('✅ Created user group:', newGroup);
                return newGroup;
            } else {
                console.error('❌ Failed to create user group');
                return null;
            }
        } catch (error) {
            console.error('❌ Error creating user group:', error);
            return null;
        }
    }, []);

    const updateUserGroup = useCallback(async (groupId, groupData) => {
        try {
            console.log('🔄 Updating user group:', {groupId, groupData});

            const response = await fetch(
                `http://localhost:4000/api/user-groups/${groupId}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(groupData),
                },
            );

            if (response.ok) {
                const updatedGroup = await response.json();
                console.log('✅ Updated user group:', updatedGroup);
                return updatedGroup;
            } else {
                console.error('❌ Failed to update user group');
                return null;
            }
        } catch (error) {
            console.error('❌ Error updating user group:', error);
            return null;
        }
    }, []);

    const deleteUserGroup = useCallback(async (groupId) => {
        try {
            console.log('🔄 Deleting user group:', groupId);

            const response = await fetch(
                `http://localhost:4000/api/user-groups/${groupId}`,
                {
                    method: 'DELETE',
                },
            );

            if (response.ok) {
                console.log('✅ Deleted user group:', groupId);
                return true;
            } else {
                console.error('❌ Failed to delete user group');
                return false;
            }
        } catch (error) {
            console.error('❌ Error deleting user group:', error);
            return false;
        }
    }, []);

    // Auto-save functionality with debouncing
    const autoSaveTimeouts = useRef({});

    const debouncedAutoSave = useCallback(
        (groupId, groupData, delay = 1000) => {
            // Clear existing timeout for this group
            if (autoSaveTimeouts.current[groupId]) {
                clearTimeout(autoSaveTimeouts.current[groupId]);
            }

            // Set new timeout for auto-save
            autoSaveTimeouts.current[groupId] = setTimeout(async () => {
                console.log('💾 Auto-saving user group:', groupId, groupData);

                try {
                    const result = await updateUserGroup(groupId, groupData);
                    if (result) {
                        console.log(
                            '✅ Auto-save successful for group:',
                            groupId,
                        );
                        // Optionally show a subtle success indicator
                    } else {
                        console.warn('⚠️ Auto-save failed for group:', groupId);
                    }
                } catch (error) {
                    console.error(
                        '❌ Auto-save error for group:',
                        groupId,
                        error,
                    );
                }

                // Clean up timeout reference
                delete autoSaveTimeouts.current[groupId];
            }, delay);
        },
        [updateUserGroup],
    );

    // Clean up timeouts on unmount
    useEffect(() => {
        return () => {
            Object.values(autoSaveTimeouts.current).forEach((timeout) => {
                clearTimeout(timeout);
            });
        };
    }, []);

    // 🚀 Revolutionary UI Functions (defined early to avoid temporal dead zone)
    const openModernUI = useCallback(
        (itemId, columnId, mode = 'command') => {
            console.log('🚀 openModernUI called with:', {
                itemId,
                columnId,
                mode,
            });
            setModernUI((prev) => {
                const newState = {
                    ...prev,
                    isOpen: true,
                    itemId,
                    columnId,
                    mode,
                    currentView: 'groups',
                    selectedGroupIndex: null,
                    selectedRoleIndex: null,
                    commandPalette: {
                        ...prev.commandPalette,
                        isOpen: mode === 'command',
                    },
                    floatingCards:
                        mode === 'floating'
                            ? {
                                  groups: {
                                      ...prev.floatingCards.groups,
                                      visible: true,
                                  },
                                  roles: {
                                      ...prev.floatingCards.roles,
                                      visible: false,
                                  },
                                  attributes: {
                                      ...prev.floatingCards.attributes,
                                      visible: false,
                                  },
                              }
                            : prev.floatingCards,
                };
                console.log('🎯 Setting modernUI state:', newState);
                return newState;
            });

            // Generate smart suggestions based on context
            if (mode === 'command') {
                generateSmartSuggestions(itemId, columnId);
            }

            // Load user groups dynamically
            loadUserGroups(itemId, columnId);
        },
        [setModernUI, loadUserGroups],
    );

    // 🎯 Smart Command Palette Functions
    const generateSmartSuggestions = useCallback(
        (itemId, columnId) => {
            const currentUser = items.find((item) => item.id === itemId);

            // Generate dynamic suggestions based on available user groups
            const suggestions = [];

            // Add suggestions for each available user group
            userGroupData.forEach((group, index) => {
                suggestions.push({
                    id: `assign-group-${group.id}`,
                    icon: '👥',
                    title: `Assign to ${group.name}`,
                    description:
                        group.description || `Add user to ${group.name} group`,
                    action: () =>
                        executeCommand('assign-group', {
                            group: group.name,
                            itemId,
                        }),
                    category: 'User Groups',
                    priority: index + 1,
                });
            });

            // Add generic configuration suggestion
            suggestions.push({
                id: 'configure-permissions',
                icon: '⚙️',
                title: 'Configure Permissions',
                description: 'Set up detailed attribute permissions',
                action: () => executeCommand('configure-attributes', {itemId}),
                category: 'Advanced',
                priority: 999,
            });

            setModernUI((prev) => ({
                ...prev,
                commandPalette: {
                    ...prev.commandPalette,
                    suggestions: suggestions.sort(
                        (a, b) => a.priority - b.priority,
                    ),
                },
            }));
        },
        [items, userGroupData, setModernUI],
    );

    const executeCommand = useCallback(
        (commandId, params) => {
            console.log(`🚀 Executing command: ${commandId}`, params);

            switch (commandId) {
                case 'assign-role':
                    toast.success(
                        `✅ ${params.role} role assigned successfully!`,
                    );
                    break;
                case 'assign-group':
                    toast.success(`✅ Added to ${params.group} group!`);
                    break;
                case 'configure-attributes':
                    setModernUI((prev) => ({
                        ...prev,
                        currentView: 'attributes',
                        mode: 'floating',
                    }));
                    break;
                default:
                    console.log('Unknown command:', commandId);
            }

            setModernUI((prev) => ({
                ...prev,
                commandPalette: {
                    ...prev.commandPalette,
                    isOpen: false,
                    query: '',
                },
            }));
        },
        [setModernUI],
    );

    // Tooltip positioning functions
    const showTooltip = (event, itemId, columnId) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setTooltipPosition({
            top: rect.top + rect.height / 2,
            left: rect.right + 8,
            visible: true,
            itemId,
            columnId,
        });
    };

    const hideTooltip = () => {
        setTooltipPosition((prev) => ({
            ...prev,
            visible: false,
        }));
    };

    const closeModernUI = () => {
        setModernUI((prev) => ({
            ...prev,
            isOpen: false,
            itemId: null,
            columnId: null,
            commandPalette: {...prev.commandPalette, isOpen: false, query: ''},
            floatingCards: {
                groups: {...prev.floatingCards.groups, visible: false},
                roles: {...prev.floatingCards.roles, visible: false},
                attributes: {...prev.floatingCards.attributes, visible: false},
            },
        }));
        setSearchTerm('');
    };

    // 🌊 Floating Workspace Functions
    const openFloatingCard = (cardType, data = {}) => {
        setModernUI((prev) => ({
            ...prev,
            floatingCards: {
                ...prev.floatingCards,
                [cardType]: {
                    ...prev.floatingCards[cardType],
                    visible: true,
                    data,
                },
            },
        }));
    };

    const closeFloatingCard = (cardType) => {
        setModernUI((prev) => ({
            ...prev,
            floatingCards: {
                ...prev.floatingCards,
                [cardType]: {
                    ...prev.floatingCards[cardType],
                    visible: false,
                    minimized: false,
                },
            },
        }));
    };

    const minimizeFloatingCard = (cardType) => {
        setModernUI((prev) => ({
            ...prev,
            floatingCards: {
                ...prev.floatingCards,
                [cardType]: {
                    ...prev.floatingCards[cardType],
                    minimized: !prev.floatingCards[cardType].minimized,
                },
            },
        }));
    };

    const moveFloatingCard = (cardType, x, y) => {
        setModernUI((prev) => ({
            ...prev,
            floatingCards: {
                ...prev.floatingCards,
                [cardType]: {
                    ...prev.floatingCards[cardType],
                    x,
                    y,
                },
            },
        }));
    };

    const connectCards = (fromCard, toCard) => {
        console.log(`🔗 Connecting ${fromCard} to ${toCard}`);
    };

    const handleCommandSearch = (query) => {
        setModernUI((prev) => ({
            ...prev,
            commandPalette: {
                ...prev.commandPalette,
                query,
                selectedIndex: 0,
            },
        }));
    };

    const handleCommandKeyDown = (e) => {
        const {suggestions, selectedIndex} = modernUI.commandPalette;
        const filteredSuggestions = suggestions.filter(
            (s) =>
                s.title
                    .toLowerCase()
                    .includes(modernUI.commandPalette.query.toLowerCase()) ||
                s.description
                    .toLowerCase()
                    .includes(modernUI.commandPalette.query.toLowerCase()),
        );

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setModernUI((prev) => ({
                    ...prev,
                    commandPalette: {
                        ...prev.commandPalette,
                        selectedIndex: Math.min(
                            selectedIndex + 1,
                            filteredSuggestions.length - 1,
                        ),
                    },
                }));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setModernUI((prev) => ({
                    ...prev,
                    commandPalette: {
                        ...prev.commandPalette,
                        selectedIndex: Math.max(selectedIndex - 1, 0),
                    },
                }));
                break;
            case 'Enter':
                e.preventDefault();
                if (filteredSuggestions[selectedIndex]) {
                    filteredSuggestions[selectedIndex].action();
                }
                break;
            case 'Escape':
                e.preventDefault();
                closeModernUI();
                break;
        }
    };

    // Enhanced navigation functions with smooth transitions
    const navigateToRoles = async (groupIndex) => {
        const groupName = userGroupData[groupIndex]?.name || 'Group';
        const groupId = userGroupData[groupIndex]?.id;

        // Load roles for the selected group
        if (groupId) {
            const roles = await loadRoles(groupId);

            // Update the user group data with loaded roles
            const updatedUserGroupData = [...userGroupData];
            if (updatedUserGroupData[groupIndex]) {
                updatedUserGroupData[groupIndex].roles = roles;
                setUserGroupData(updatedUserGroupData);
            }
        }

        // Add transition class for smooth animation
        const contentArea = document.querySelector('.smart-content-area');
        if (contentArea) {
            contentArea.classList.add('slide-in-right');
            setTimeout(
                () => contentArea.classList.remove('slide-in-right'),
                400,
            );
        }

        setModernUI((prev) => ({
            ...prev,
            currentView: 'roles',
            selectedGroupIndex: groupIndex,
            breadcrumb: ['User Groups', `${groupName} - Roles`],
            roleSearchQuery: '', // Reset search when navigating
        }));
    };

    const navigateToAttributes = async (roleIndex) => {
        const groupName =
            userGroupData[modernUI.selectedGroupIndex]?.name || 'Group';
        const role =
            userGroupData[modernUI.selectedGroupIndex]?.roles[roleIndex];
        const roleName = role?.name || 'Role';
        const roleId = role?.id;

        // Load attributes for the selected role
        if (roleId) {
            const attributes = await loadAttributes(roleId);

            // Update the user group data with loaded attributes
            const updatedUserGroupData = [...userGroupData];
            if (
                updatedUserGroupData[modernUI.selectedGroupIndex]?.roles[
                    roleIndex
                ]
            ) {
                updatedUserGroupData[modernUI.selectedGroupIndex].roles[
                    roleIndex
                ].attributes = attributes;
                setUserGroupData(updatedUserGroupData);
            }
        }

        // Add transition class for smooth animation
        const contentArea = document.querySelector('.smart-content-area');
        if (contentArea) {
            contentArea.classList.add('slide-in-right');
            setTimeout(
                () => contentArea.classList.remove('slide-in-right'),
                400,
            );
        }

        setModernUI((prev) => ({
            ...prev,
            currentView: 'attributes',
            selectedRoleIndex: roleIndex,
            breadcrumb: [
                'User Groups',
                `${groupName} - Roles`,
                `${roleName} - Attributes`,
            ],
            attributeSearchQuery: '', // Reset search when navigating
        }));
    };

    // Enhanced breadcrumb navigation with smooth transitions
    const navigateToBreadcrumb = (index) => {
        // Add transition class for smooth animation
        const contentArea = document.querySelector('.smart-content-area');
        if (contentArea) {
            contentArea.classList.add('slide-in-left');
            setTimeout(
                () => contentArea.classList.remove('slide-in-left'),
                400,
            );
        }

        // Add micro-interaction to clicked breadcrumb
        const breadcrumbPills = document.querySelectorAll('.breadcrumb-pill');
        if (breadcrumbPills[index]) {
            breadcrumbPills[index].classList.add('micro-bounce');
            setTimeout(
                () => breadcrumbPills[index].classList.remove('micro-bounce'),
                300,
            );
        }

        if (index === 0) {
            // Navigate back to groups
            setModernUI((prev) => ({
                ...prev,
                currentView: 'groups',
                selectedGroupIndex: null,
                selectedRoleIndex: null,
                breadcrumb: ['User Groups'],
            }));
        } else if (index === 1) {
            // Navigate back to roles
            const groupName =
                userGroupData[modernUI.selectedGroupIndex]?.name || 'Group';
            setModernUI((prev) => ({
                ...prev,
                currentView: 'roles',
                selectedRoleIndex: null,
                breadcrumb: ['User Groups', `${groupName} - Roles`],
            }));
        }
    };

    // 👆 Gesture Support for Swipe Navigation
    const [touchState, setTouchState] = useState({
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        isSwipe: false,
        threshold: 50, // Minimum distance for swipe
    });

    const handleTouchStart = useCallback(
        (e) => {
            if (!modernUI.isOpen) return;

            const touch = e.touches[0];
            setTouchState((prev) => ({
                ...prev,
                startX: touch.clientX,
                startY: touch.clientY,
                currentX: touch.clientX,
                currentY: touch.clientY,
                isSwipe: false,
            }));
        },
        [modernUI.isOpen],
    );

    const handleTouchMove = useCallback(
        (e) => {
            if (!modernUI.isOpen) return;

            const touch = e.touches[0];
            const deltaX = touch.clientX - touchState.startX;
            const deltaY = touch.clientY - touchState.startY;

            // Determine if this is a horizontal swipe
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
                setTouchState((prev) => ({
                    ...prev,
                    currentX: touch.clientX,
                    currentY: touch.clientY,
                    isSwipe: true,
                }));

                // Add visual feedback during swipe
                const contentArea = document.querySelector(
                    '.smart-content-area',
                );
                if (contentArea) {
                    const swipeProgress = Math.min(Math.abs(deltaX) / 200, 1);
                    contentArea.style.transform = `translateX(${
                        deltaX * 0.1
                    }px)`;
                    contentArea.style.opacity = `${1 - swipeProgress * 0.2}`;
                }
            }
        },
        [modernUI.isOpen, touchState.startX, touchState.startY],
    );

    const handleTouchEnd = useCallback(
        (e) => {
            if (!modernUI.isOpen || !touchState.isSwipe) {
                // Reset any visual feedback
                const contentArea = document.querySelector(
                    '.smart-content-area',
                );
                if (contentArea) {
                    contentArea.style.transform = '';
                    contentArea.style.opacity = '';
                }
                return;
            }

            const deltaX = touchState.currentX - touchState.startX;
            const deltaY = touchState.currentY - touchState.startY;

            // Reset visual feedback
            const contentArea = document.querySelector('.smart-content-area');
            if (contentArea) {
                contentArea.style.transform = '';
                contentArea.style.opacity = '';
            }

            // Check if swipe meets threshold
            if (
                Math.abs(deltaX) > touchState.threshold &&
                Math.abs(deltaX) > Math.abs(deltaY)
            ) {
                if (deltaX > 0) {
                    // Swipe right - go back
                    handleSwipeBack();
                } else {
                    // Swipe left - go forward (if possible)
                    handleSwipeForward();
                }
            }

            setTouchState((prev) => ({
                ...prev,
                isSwipe: false,
            }));
        },
        [modernUI.isOpen, touchState],
    );

    const handleSwipeBack = useCallback(() => {
        if (modernUI.currentView === 'attributes') {
            // Go back to roles
            navigateToBreadcrumb(1);
        } else if (modernUI.currentView === 'roles') {
            // Go back to groups
            navigateToBreadcrumb(0);
        } else if (modernUI.currentView === 'groups') {
            // Close the panel
            closeModernUI();
        }
    }, [modernUI.currentView]);

    const handleSwipeForward = useCallback(() => {
        if (
            modernUI.currentView === 'groups' &&
            modernUI.selectedGroupIndex !== null
        ) {
            // Go to roles if a group is selected
            navigateToRoles(modernUI.selectedGroupIndex);
        } else if (
            modernUI.currentView === 'roles' &&
            modernUI.selectedRoleIndex !== null
        ) {
            // Go to attributes if a role is selected
            navigateToAttributes(modernUI.selectedRoleIndex);
        }
    }, [
        modernUI.currentView,
        modernUI.selectedGroupIndex,
        modernUI.selectedRoleIndex,
    ]);

    // Keyboard shortcuts for navigation
    const handleKeyboardNavigation = useCallback(
        (e) => {
            if (!modernUI.isOpen) return;

            // Alt + Arrow keys for navigation
            if (e.altKey) {
                switch (e.key) {
                    case 'ArrowLeft':
                        e.preventDefault();
                        handleSwipeBack();
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        handleSwipeForward();
                        break;
                    case 'ArrowUp':
                        e.preventDefault();
                        // Navigate to parent breadcrumb
                        if (modernUI.breadcrumb.length > 1) {
                            navigateToBreadcrumb(
                                modernUI.breadcrumb.length - 2,
                            );
                        }
                        break;
                    case 'Escape':
                        e.preventDefault();
                        closeModernUI();
                        break;
                }
            }
        },
        [
            modernUI.isOpen,
            modernUI.breadcrumb.length,
            handleSwipeBack,
            handleSwipeForward,
        ],
    );

    // Add event listeners for gestures and keyboard
    useEffect(() => {
        if (modernUI.isOpen) {
            document.addEventListener('touchstart', handleTouchStart, {
                passive: false,
            });
            document.addEventListener('touchmove', handleTouchMove, {
                passive: false,
            });
            document.addEventListener('touchend', handleTouchEnd, {
                passive: false,
            });
            document.addEventListener('keydown', handleKeyboardNavigation);

            return () => {
                document.removeEventListener('touchstart', handleTouchStart);
                document.removeEventListener('touchmove', handleTouchMove);
                document.removeEventListener('touchend', handleTouchEnd);
                document.removeEventListener(
                    'keydown',
                    handleKeyboardNavigation,
                );
            };
        }
    }, [
        modernUI.isOpen,
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd,
        handleKeyboardNavigation,
    ]);

    // Dropdown management functions
    const openEntityDropdown = async (rowIndex) => {
        setDropdownState((prev) => ({
            ...prev,
            entityDropdown: {isOpen: true, rowIndex},
            servicesDropdown: {isOpen: false, rowIndex: -1},
        }));

        // Get account ID and enterprise ID from breadcrumb (localStorage)
        const accountId =
            typeof window !== 'undefined'
                ? window.localStorage.getItem('selectedAccountId') || '3'
                : '3';
        const enterpriseId =
            typeof window !== 'undefined'
                ? window.localStorage.getItem('selectedEnterpriseId') || '1'
                : '1';

        // Always fetch entities to ensure we have the latest data for the selected account/enterprise
        await fetchEntities(accountId, enterpriseId);
    };

    const openServicesDropdown = async (rowIndex) => {
        setDropdownState((prev) => ({
            ...prev,
            servicesDropdown: {isOpen: true, rowIndex},
            entityDropdown: {isOpen: false, rowIndex: -1},
        }));

        // Fetch services if not already loaded
        if (services.length === 0) {
            await fetchServices();
        }
    };

    const closeDropdowns = () => {
        setDropdownState({
            entityDropdown: {isOpen: false, rowIndex: -1},
            servicesDropdown: {isOpen: false, rowIndex: -1},
        });
    };

    // Add entity to user group
    const addEntityToGroup = (groupIndex, entity) => {
        const updatedData = [...userGroupData];
        if (!updatedData[groupIndex].entities.find((e) => e.id === entity.id)) {
            updatedData[groupIndex].entities.push(entity);
            setUserGroupData(updatedData);
        }
        closeDropdowns();
    };

    // Add service to user group
    const addServiceToGroup = (groupIndex, service) => {
        const updatedData = [...userGroupData];
        if (
            !updatedData[groupIndex].services.find((s) => s.id === service.id)
        ) {
            updatedData[groupIndex].services.push(service);
            setUserGroupData(updatedData);
        }
        closeDropdowns();
    };

    // Roles management functions
    const showRolesModal = (event, rowIndex) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setRolesModal({
            isVisible: true,
            rowIndex,
            position: {
                top: rect.bottom + 4,
                left: rect.left + rect.width / 2,
            },
        });
    };

    const hideRolesModal = () => {
        setRolesModal({
            isVisible: false,
            rowIndex: -1,
            position: {top: 0, left: 0},
        });
    };

    const removeRoleFromGroup = (groupIndex, roleIndex) => {
        const updatedData = [...userGroupData];
        updatedData[groupIndex].roles = updatedData[groupIndex].roles.filter(
            (_, i) => i !== roleIndex,
        );
        setUserGroupData(updatedData);
    };

    const addRoleToGroup = (groupIndex, roleName) => {
        const updatedData = [...userGroupData];
        if (!updatedData[groupIndex].roles.includes(roleName)) {
            updatedData[groupIndex].roles.push(roleName);
            setUserGroupData(updatedData);
        }
    };

    // API functions
    const fetchEntities = async (accountId, enterpriseId) => {
        try {
            console.log(
                `Fetching entities for accountId: ${accountId}, enterpriseId: ${enterpriseId}`,
            );

            // Try the business unit settings API endpoint first
            const response = await fetch(
                `http://localhost:4000/api/business-units/entities?accountId=${accountId}&enterpriseId=${enterpriseId}`,
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Entities fetched successfully:', data);

            // Ensure data is in the expected format
            const formattedEntities = Array.isArray(data)
                ? data
                : data.entities || [];
            setEntities(formattedEntities);
            return formattedEntities;
        } catch (error) {
            console.error(
                'Error fetching entities from business unit settings:',
                error,
            );

            // Mock data for development when API is not available
            const mockEntities = [
                {
                    id: 1,
                    name: 'Sales Department',
                    description: 'Sales operations',
                },
                {id: 2, name: 'HR Department', description: 'Human resources'},
                {
                    id: 3,
                    name: 'IT Department',
                    description: 'Information technology',
                },
                {
                    id: 4,
                    name: 'Finance Department',
                    description: 'Financial operations',
                },
                {
                    id: 5,
                    name: 'Marketing Department',
                    description: 'Marketing and promotion',
                },
            ];

            console.log('Using mock entities data:', mockEntities);
            setEntities(mockEntities);
            return mockEntities;
        }
    };

    const fetchServices = async () => {
        try {
            const response = await fetch('http://localhost:4000/api/services');
            const data = await response.json();
            setServices(data);
            return data;
        } catch (error) {
            console.error('Error fetching services:', error);
            // Mock data for development
            const mockServices = [
                {
                    id: 1,
                    name: 'User Management',
                    description: 'Manage user accounts',
                },
                {
                    id: 2,
                    name: 'Data Analytics',
                    description: 'Analytics and reporting',
                },
                {
                    id: 3,
                    name: 'File Storage',
                    description: 'Document management',
                },
                {
                    id: 4,
                    name: 'Email Service',
                    description: 'Email communications',
                },
                {
                    id: 5,
                    name: 'Backup Service',
                    description: 'Data backup and recovery',
                },
            ];
            setServices(mockServices);
            return mockServices;
        }
    };

    // Password validation functions
    const validatePassword = (password) => {
        const validation = {
            minLength: password.length >= 8,
            hasNumber: /\d/.test(password),
            hasUppercase: /[A-Z]/.test(password),
            hasLowercase: /[a-z]/.test(password),
            hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
                password,
            ),
        };
        setPasswordValidation(validation);
        return Object.values(validation).every(Boolean);
    };

    const openPasswordModal = (itemId, columnId, event) => {
        // Calculate position relative to the clicked key icon
        const rect = event.currentTarget.getBoundingClientRect();
        const position = {
            top: rect.bottom + window.scrollY + 4, // 4px below the key
            left: rect.left + window.scrollX - 160 + rect.width / 2, // Center modal under key (320px width / 2 = 160px)
        };

        // Ensure modal doesn't go off-screen
        const modalWidth = 320;
        const viewportWidth = window.innerWidth;
        if (position.left + modalWidth > viewportWidth) {
            position.left = viewportWidth - modalWidth - 16; // 16px margin from edge
        }
        if (position.left < 16) {
            position.left = 16; // 16px margin from left edge
        }

        setPasswordModal({isOpen: true, itemId, columnId, position});
        setPasswordForm({newPassword: '', confirmPassword: ''});
        setPasswordValidation({
            minLength: false,
            hasNumber: false,
            hasUppercase: false,
            hasLowercase: false,
            hasSpecialChar: false,
        });
    };

    const closePasswordModal = () => {
        setPasswordModal({
            isOpen: false,
            itemId: null,
            columnId: null,
            position: {top: 0, left: 0},
        });
        setPasswordForm({newPassword: '', confirmPassword: ''});
    };

    const handlePasswordChange = (field, value) => {
        setPasswordForm((prev) => ({...prev, [field]: value}));
        if (field === 'newPassword') {
            validatePassword(value);
        }
    };

    const handlePasswordUpdate = () => {
        const {newPassword, confirmPassword} = passwordForm;
        const {itemId, columnId} = passwordModal;

        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (!validatePassword(newPassword)) {
            toast.error('Password does not meet requirements');
            return;
        }

        // Update the item with password set indicator
        setItems((prev) =>
            prev.map((item) =>
                item.id === itemId
                    ? {...item, [columnId]: 'password_set'}
                    : item,
            ),
        );
        toast.success('Password updated successfully');
        closePasswordModal();
    };

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

        const {active, over} = event;

        console.log('🚀 Drag End Event:', {
            active: active?.id,
            over: over?.id,
            hasOver: !!over,
            sameElement: active?.id === over?.id,
            activeData: active?.data?.current,
            overData: over?.data?.current,
        });

        if (!over) {
            console.log('❌ Drag cancelled: no drop target found');
            return;
        }

        if (active.id === over.id) {
            console.log('❌ Drag cancelled: dropped on same element');
            return;
        }

        const activeId = active.id.toString();
        const overId = over.id.toString();

        console.log('📝 Processing drag:', {activeId, overId});

        // Handle item reordering (main items)
        if (activeId.startsWith('item:') && overId.startsWith('item:')) {
            console.log('✅ Processing main item reorder');
            // Extract the actual item ID (e.g., "item:item-2" -> "item-2")
            const activeItemIdStr = activeId.split(':')[1];
            const overItemIdStr = overId.split(':')[1];

            console.log('📦 Item ID strings:', {
                activeItemIdStr,
                overItemIdStr,
            });

            setItems((prevItems) => {
                const oldIndex = prevItems.findIndex(
                    (item) => item.id === activeItemIdStr,
                );
                const newIndex = prevItems.findIndex(
                    (item) => item.id === overItemIdStr,
                );

                console.log('📍 Indexes:', {oldIndex, newIndex});
                console.log('🔍 Looking for items:', {
                    activeItemIdStr,
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
        if (activeId.startsWith('sub:') && overId.startsWith('sub:')) {
            console.log('✅ Processing subitem reorder');
            const [, activeParentId, activeSubId] = activeId.split(':');
            const [, overParentId, overSubId] = overId.split(':');

            console.log('👥 Subitem details:', {
                activeParentId,
                activeSubId,
                overParentId,
                overSubId,
            });

            // Only allow reordering within the same parent
            if (activeParentId === overParentId) {
                console.log('✅ Same parent - proceeding with reorder');
                // Use string IDs directly instead of parsing as integers
                const parentIdStr = activeParentId;
                const activeSubitemIdStr = activeSubId;
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
                                        (sub) => sub.id === activeSubitemIdStr,
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
                                <div className='header-content'>
                                    <span className='header-title'>
                                        {column.title}
                                    </span>
                                </div>
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
                                    openPasswordModal={openPasswordModal}
                                    showTooltip={showTooltip}
                                    hideTooltip={hideTooltip}
                                    openModernUI={openModernUI}
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
                console.log('🎯 Drag Started:', event.active.id);
                document.body.style.cursor = 'grabbing';
            }}
            onDragOver={(event) => {
                console.log('🎯 Drag Over:', {
                    active: event.active?.id,
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

            {/* Password Modal */}
            {passwordModal.isOpen && (
                <>
                    <div
                        className='password-modal-backdrop'
                        onClick={closePasswordModal}
                    />
                    <div
                        className='password-modal'
                        style={{
                            top: `${passwordModal.position.top}px`,
                            left: `${passwordModal.position.left}px`,
                        }}
                    >
                        <h3 className='password-modal-title'>
                            Enter New Password
                        </h3>

                        <div className='password-input-group'>
                            <label className='password-input-label'>
                                New Password
                            </label>
                            <input
                                type='password'
                                className='password-input'
                                value={passwordForm.newPassword}
                                onChange={(e) =>
                                    handlePasswordChange(
                                        'newPassword',
                                        e.target.value,
                                    )
                                }
                                placeholder='Enter new password'
                                autoFocus
                            />
                        </div>

                        <div className='password-input-group'>
                            <label className='password-input-label'>
                                Confirm Password
                            </label>
                            <input
                                type='password'
                                className='password-input'
                                value={passwordForm.confirmPassword}
                                onChange={(e) =>
                                    handlePasswordChange(
                                        'confirmPassword',
                                        e.target.value,
                                    )
                                }
                                placeholder='Confirm new password'
                            />
                        </div>

                        <div className='password-validation'>
                            <div
                                className={`validation-rule ${
                                    passwordValidation.minLength ? 'valid' : ''
                                }`}
                            >
                                <div
                                    className={`validation-icon ${
                                        passwordValidation.minLength
                                            ? 'valid'
                                            : ''
                                    }`}
                                >
                                    {passwordValidation.minLength ? '✓' : 'i'}
                                </div>
                                Password must be at least 8 characters
                            </div>
                            <div
                                className={`validation-rule ${
                                    passwordValidation.hasNumber ? 'valid' : ''
                                }`}
                            >
                                <div
                                    className={`validation-icon ${
                                        passwordValidation.hasNumber
                                            ? 'valid'
                                            : ''
                                    }`}
                                >
                                    {passwordValidation.hasNumber ? '✓' : 'i'}
                                </div>
                                Must contain at least 1 number
                            </div>
                            <div
                                className={`validation-rule ${
                                    passwordValidation.hasUppercase
                                        ? 'valid'
                                        : ''
                                }`}
                            >
                                <div
                                    className={`validation-icon ${
                                        passwordValidation.hasUppercase
                                            ? 'valid'
                                            : ''
                                    }`}
                                >
                                    {passwordValidation.hasUppercase
                                        ? '✓'
                                        : 'i'}
                                </div>
                                Must contain at least 1 capital character
                            </div>
                            <div
                                className={`validation-rule ${
                                    passwordValidation.hasLowercase
                                        ? 'valid'
                                        : ''
                                }`}
                            >
                                <div
                                    className={`validation-icon ${
                                        passwordValidation.hasLowercase
                                            ? 'valid'
                                            : ''
                                    }`}
                                >
                                    {passwordValidation.hasLowercase
                                        ? '✓'
                                        : 'i'}
                                </div>
                                Must contain at least 1 small case
                            </div>
                            <div
                                className={`validation-rule ${
                                    passwordValidation.hasSpecialChar
                                        ? 'valid'
                                        : ''
                                }`}
                            >
                                <div
                                    className={`validation-icon ${
                                        passwordValidation.hasSpecialChar
                                            ? 'valid'
                                            : ''
                                    }`}
                                >
                                    {passwordValidation.hasSpecialChar
                                        ? '✓'
                                        : 'i'}
                                </div>
                                Must contain at least 1 special character
                            </div>
                        </div>

                        <button
                            className={`update-password-btn ${
                                Object.values(passwordValidation).every(
                                    Boolean,
                                ) &&
                                passwordForm.newPassword ===
                                    passwordForm.confirmPassword &&
                                passwordForm.newPassword.length > 0
                                    ? 'enabled'
                                    : ''
                            }`}
                            onClick={handlePasswordUpdate}
                            disabled={
                                !Object.values(passwordValidation).every(
                                    Boolean,
                                ) ||
                                passwordForm.newPassword !==
                                    passwordForm.confirmPassword ||
                                passwordForm.newPassword.length === 0
                            }
                        >
                            Update Password
                        </button>
                    </div>
                </>
            )}

            {/* Dynamic User Group Tooltip */}
            {tooltipPosition.visible && (
                <div
                    className='usergroup-tooltip'
                    style={{
                        position: 'fixed',
                        top: `${tooltipPosition.top}px`,
                        left: `${tooltipPosition.left}px`,
                        transform: 'translateY(-50%)',
                        zIndex: 99999,
                    }}
                >
                    <div className='usergroup-tooltip-title'>
                        Assigned User Groups
                    </div>
                    {(() => {
                        const currentItem = items.find(
                            (item) => item.id === tooltipPosition.itemId,
                        );
                        const userGroups =
                            currentItem?.[tooltipPosition.columnId] || [];
                        const groupsArray = Array.isArray(userGroups)
                            ? userGroups
                            : [];

                        return groupsArray.length > 0 ? (
                            groupsArray.map((group, index) => (
                                <div key={index} className='usergroup-item'>
                                    <span className='usergroup-name'>
                                        {group.name || group}
                                    </span>
                                    <button
                                        className='usergroup-remove'
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const updatedGroups =
                                                groupsArray.filter(
                                                    (_, i) => i !== index,
                                                );
                                            setItems((prev) =>
                                                prev.map((item) =>
                                                    item.id ===
                                                    tooltipPosition.itemId
                                                        ? {
                                                              ...item,
                                                              [tooltipPosition.columnId]:
                                                                  updatedGroups,
                                                          }
                                                        : item,
                                                ),
                                            );
                                        }}
                                        title='Remove user group'
                                    >
                                        ×
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className='usergroup-empty'>
                                No user groups assigned
                            </div>
                        );
                    })()}
                </div>
            )}

            {/* 🌊 Ultra-Modern Floating Workspace */}
            {modernUI.isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className='floating-workspace-backdrop'
                        onClick={closeModernUI}
                    />

                    {/* 🚀 Modern Smart Context Panel */}
                    <div className='smart-context-panel'>
                        {/* 🧭 Smart Breadcrumb Navigation */}
                        <div className='smart-breadcrumb'>
                            {modernUI.breadcrumb.map((crumb, index) => (
                                <React.Fragment key={index}>
                                    <button
                                        className={`breadcrumb-pill ${
                                            index ===
                                            modernUI.breadcrumb.length - 1
                                                ? 'active'
                                                : ''
                                        }`}
                                        onClick={() =>
                                            navigateToBreadcrumb(index)
                                        }
                                    >
                                        {index === 0 && '👥'}
                                        {index === 1 && '🎭'}
                                        {index === 2 && '⚙️'}
                                        {crumb}
                                    </button>
                                    {index < modernUI.breadcrumb.length - 1 && (
                                        <span className='breadcrumb-arrow'>
                                            ▶
                                        </span>
                                    )}
                                </React.Fragment>
                            ))}
                            <button
                                className='panel-close-btn'
                                onClick={closeModernUI}
                            >
                                ✕
                            </button>
                        </div>

                        {/* 🌊 Compact Progress */}
                        <div className='progress-container'>
                            <h3>Progress</h3>

                            <div className='progress-steps'>
                                {[
                                    {
                                        id: 'groups',
                                        label: 'Groups',
                                        icon: (
                                            <svg
                                                width='16'
                                                height='16'
                                                viewBox='0 0 24 24'
                                                fill='none'
                                                xmlns='http://www.w3.org/2000/svg'
                                            >
                                                <path
                                                    d='M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z'
                                                    stroke='currentColor'
                                                    strokeWidth='2'
                                                    strokeLinecap='round'
                                                    strokeLinejoin='round'
                                                />
                                                <path
                                                    d='M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z'
                                                    stroke='currentColor'
                                                    strokeWidth='2'
                                                    strokeLinecap='round'
                                                    strokeLinejoin='round'
                                                />
                                            </svg>
                                        ),
                                        view: 'groups',
                                    },
                                    {
                                        id: 'roles',
                                        label: 'Roles',
                                        icon: (
                                            <svg
                                                width='16'
                                                height='16'
                                                viewBox='0 0 24 24'
                                                fill='none'
                                                xmlns='http://www.w3.org/2000/svg'
                                            >
                                                <path
                                                    d='M12 15L8 12L12 9L16 12L12 15Z'
                                                    stroke='currentColor'
                                                    strokeWidth='2'
                                                    strokeLinecap='round'
                                                    strokeLinejoin='round'
                                                />
                                                <path
                                                    d='M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7Z'
                                                    stroke='currentColor'
                                                    strokeWidth='2'
                                                    strokeLinecap='round'
                                                    strokeLinejoin='round'
                                                />
                                            </svg>
                                        ),
                                        view: 'roles',
                                    },
                                    {
                                        id: 'attributes',
                                        label: 'Attributes',
                                        icon: (
                                            <svg
                                                width='16'
                                                height='16'
                                                viewBox='0 0 24 24'
                                                fill='none'
                                                xmlns='http://www.w3.org/2000/svg'
                                            >
                                                <path
                                                    d='M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z'
                                                    stroke='currentColor'
                                                    strokeWidth='2'
                                                    strokeLinecap='round'
                                                    strokeLinejoin='round'
                                                />
                                                <path
                                                    d='M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.2579 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.01127 9.77251C4.28054 9.5799 4.48571 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z'
                                                    stroke='currentColor'
                                                    strokeWidth='2'
                                                    strokeLinecap='round'
                                                    strokeLinejoin='round'
                                                />
                                            </svg>
                                        ),
                                        view: 'attributes',
                                    },
                                    {
                                        id: 'complete',
                                        label: 'Complete',
                                        icon: (
                                            <svg
                                                width='16'
                                                height='16'
                                                viewBox='0 0 24 24'
                                                fill='none'
                                                xmlns='http://www.w3.org/2000/svg'
                                            >
                                                <path
                                                    d='M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.7088 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4905 2.02168 11.3363C2.16356 9.18219 2.99721 7.13677 4.39828 5.49707C5.79935 3.85736 7.69279 2.71548 9.79619 2.24015C11.8996 1.76482 14.1003 1.98232 16.07 2.86'
                                                    stroke='currentColor'
                                                    strokeWidth='2'
                                                    strokeLinecap='round'
                                                    strokeLinejoin='round'
                                                />
                                                <path
                                                    d='M22 4L12 14.01L9 11.01'
                                                    stroke='currentColor'
                                                    strokeWidth='2'
                                                    strokeLinecap='round'
                                                    strokeLinejoin='round'
                                                />
                                            </svg>
                                        ),
                                        view: null,
                                    },
                                ].map((step, index) => {
                                    const isActive =
                                        step.view === modernUI.currentView;
                                    const isCompleted =
                                        (step.view === 'groups' &&
                                            userGroupData.length > 0) ||
                                        (step.view === 'roles' &&
                                            modernUI.selectedGroupIndex !==
                                                null) ||
                                        (step.view === 'attributes' &&
                                            modernUI.selectedRoleIndex !==
                                                null);

                                    return (
                                        <div
                                            key={step.id}
                                            className={`progress-step ${
                                                isActive ? 'active' : ''
                                            } ${
                                                isCompleted ? 'completed' : ''
                                            }`}
                                            onClick={() => {
                                                if (step.view) {
                                                    setModernUI((prev) => ({
                                                        ...prev,
                                                        currentView: step.view,
                                                    }));
                                                }
                                            }}
                                            title={step.label}
                                        >
                                            <div className='step-icon'>
                                                {step.icon}
                                            </div>
                                            <span className='step-label'>
                                                {step.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 🎯 Dynamic Content Area */}
                        <div className='smart-content-area'>
                            {/* 👥 USER GROUPS VIEW */}
                            {modernUI.currentView === 'groups' && (
                                <div className='groups-view'>
                                    <div className='view-header'>
                                        <h2>User Groups</h2>
                                        <div className='search-container'>
                                            <input
                                                type='text'
                                                placeholder='Search groups...'
                                                value={searchTerm}
                                                onChange={(e) =>
                                                    setSearchTerm(
                                                        e.target.value,
                                                    )
                                                }
                                                className='smart-search'
                                            />
                                        </div>
                                    </div>

                                    <div className='groups-table-container'>
                                        <table className='groups-table'>
                                            <thead>
                                                <tr>
                                                    <th>
                                                        <input type='checkbox' />
                                                    </th>
                                                    <th>Group Name</th>
                                                    <th>Description</th>
                                                    <th>Entities</th>
                                                    <th>Services</th>
                                                    <th>Roles</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {userGroupData
                                                    .filter(
                                                        (group) =>
                                                            group.name
                                                                .toLowerCase()
                                                                .includes(
                                                                    searchTerm.toLowerCase(),
                                                                ) ||
                                                            group.description
                                                                .toLowerCase()
                                                                .includes(
                                                                    searchTerm.toLowerCase(),
                                                                ),
                                                    )
                                                    .map((group, index) => (
                                                        <tr key={group.id}>
                                                            <td>
                                                                <input
                                                                    type='checkbox'
                                                                    className='group-checkbox'
                                                                />
                                                            </td>
                                                            <td className='group-name-cell'>
                                                                <input
                                                                    type='text'
                                                                    value={
                                                                        group.name
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) => {
                                                                        const updatedData =
                                                                            [
                                                                                ...userGroupData,
                                                                            ];
                                                                        updatedData[
                                                                            index
                                                                        ].name =
                                                                            e.target.value;
                                                                        setUserGroupData(
                                                                            updatedData,
                                                                        );

                                                                        // Auto-save after 1 second of inactivity
                                                                        if (
                                                                            group.id &&
                                                                            !group.id.startsWith(
                                                                                'temp-',
                                                                            )
                                                                        ) {
                                                                            debouncedAutoSave(
                                                                                group.id,
                                                                                {
                                                                                    name: e
                                                                                        .target
                                                                                        .value,
                                                                                    description:
                                                                                        group.description,
                                                                                    entities:
                                                                                        group.entities ||
                                                                                        [],
                                                                                    services:
                                                                                        group.services ||
                                                                                        [],
                                                                                    roles:
                                                                                        group.roles ||
                                                                                        [],
                                                                                },
                                                                            );
                                                                        }
                                                                    }}
                                                                    className='inline-edit-input name-input'
                                                                    placeholder='Enter group name'
                                                                />
                                                            </td>
                                                            <td className='group-description-cell'>
                                                                <input
                                                                    type='text'
                                                                    value={
                                                                        group.description ||
                                                                        ''
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) => {
                                                                        const updatedData =
                                                                            [
                                                                                ...userGroupData,
                                                                            ];
                                                                        updatedData[
                                                                            index
                                                                        ].description =
                                                                            e.target.value;
                                                                        setUserGroupData(
                                                                            updatedData,
                                                                        );

                                                                        // Auto-save after 1 second of inactivity
                                                                        if (
                                                                            group.id &&
                                                                            !group.id.startsWith(
                                                                                'temp-',
                                                                            )
                                                                        ) {
                                                                            debouncedAutoSave(
                                                                                group.id,
                                                                                {
                                                                                    name: group.name,
                                                                                    description:
                                                                                        e
                                                                                            .target
                                                                                            .value,
                                                                                    entities:
                                                                                        group.entities ||
                                                                                        [],
                                                                                    services:
                                                                                        group.services ||
                                                                                        [],
                                                                                    roles:
                                                                                        group.roles ||
                                                                                        [],
                                                                                },
                                                                            );
                                                                        }
                                                                    }}
                                                                    className='inline-edit-input description-input'
                                                                    placeholder='Enter description'
                                                                />
                                                            </td>
                                                            <td className='entities-cell'>
                                                                <div className='dropdown-container'>
                                                                    <select
                                                                        className='entity-dropdown'
                                                                        onChange={(
                                                                            e,
                                                                        ) => {
                                                                            if (
                                                                                e
                                                                                    .target
                                                                                    .value
                                                                            ) {
                                                                                const selectedEntity =
                                                                                    entities.find(
                                                                                        (
                                                                                            entity,
                                                                                        ) =>
                                                                                            entity.id ===
                                                                                            e
                                                                                                .target
                                                                                                .value,
                                                                                    );
                                                                                if (
                                                                                    selectedEntity
                                                                                ) {
                                                                                    const updatedData =
                                                                                        [
                                                                                            ...userGroupData,
                                                                                        ];
                                                                                    if (
                                                                                        !updatedData[
                                                                                            index
                                                                                        ]
                                                                                            .entities
                                                                                    ) {
                                                                                        updatedData[
                                                                                            index
                                                                                        ].entities =
                                                                                            [];
                                                                                    }
                                                                                    updatedData[
                                                                                        index
                                                                                    ].entities.push(
                                                                                        selectedEntity,
                                                                                    );
                                                                                    setUserGroupData(
                                                                                        updatedData,
                                                                                    );
                                                                                    e.target.value =
                                                                                        '';
                                                                                }
                                                                            }
                                                                        }}
                                                                        onFocus={() =>
                                                                            fetchEntities()
                                                                        }
                                                                    >
                                                                        <option value=''>
                                                                            Select
                                                                            Entity
                                                                        </option>
                                                                        {entities.map(
                                                                            (
                                                                                entity,
                                                                            ) => (
                                                                                <option
                                                                                    key={
                                                                                        entity.id
                                                                                    }
                                                                                    value={
                                                                                        entity.id
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        entity.name
                                                                                    }
                                                                                </option>
                                                                            ),
                                                                        )}
                                                                    </select>
                                                                    <div className='selected-items'>
                                                                        {group.entities?.map(
                                                                            (
                                                                                entity,
                                                                                entityIndex,
                                                                            ) => (
                                                                                <span
                                                                                    key={
                                                                                        entityIndex
                                                                                    }
                                                                                    className='item-chip'
                                                                                >
                                                                                    {
                                                                                        entity.name
                                                                                    }
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            const updatedData =
                                                                                                [
                                                                                                    ...userGroupData,
                                                                                                ];
                                                                                            updatedData[
                                                                                                index
                                                                                            ].entities.splice(
                                                                                                entityIndex,
                                                                                                1,
                                                                                            );
                                                                                            setUserGroupData(
                                                                                                updatedData,
                                                                                            );
                                                                                        }}
                                                                                        className='chip-remove'
                                                                                    >
                                                                                        ×
                                                                                    </button>
                                                                                </span>
                                                                            ),
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className='services-cell'>
                                                                <div className='dropdown-container'>
                                                                    <select
                                                                        className='service-dropdown'
                                                                        onChange={(
                                                                            e,
                                                                        ) => {
                                                                            if (
                                                                                e
                                                                                    .target
                                                                                    .value
                                                                            ) {
                                                                                const selectedService =
                                                                                    services.find(
                                                                                        (
                                                                                            service,
                                                                                        ) =>
                                                                                            service.id ===
                                                                                            e
                                                                                                .target
                                                                                                .value,
                                                                                    );
                                                                                if (
                                                                                    selectedService
                                                                                ) {
                                                                                    const updatedData =
                                                                                        [
                                                                                            ...userGroupData,
                                                                                        ];
                                                                                    if (
                                                                                        !updatedData[
                                                                                            index
                                                                                        ]
                                                                                            .services
                                                                                    ) {
                                                                                        updatedData[
                                                                                            index
                                                                                        ].services =
                                                                                            [];
                                                                                    }
                                                                                    updatedData[
                                                                                        index
                                                                                    ].services.push(
                                                                                        selectedService,
                                                                                    );
                                                                                    setUserGroupData(
                                                                                        updatedData,
                                                                                    );
                                                                                    e.target.value =
                                                                                        '';
                                                                                }
                                                                            }
                                                                        }}
                                                                        onFocus={() =>
                                                                            fetchServices()
                                                                        }
                                                                    >
                                                                        <option value=''>
                                                                            Select
                                                                            Service
                                                                        </option>
                                                                        {services.map(
                                                                            (
                                                                                service,
                                                                            ) => (
                                                                                <option
                                                                                    key={
                                                                                        service.id
                                                                                    }
                                                                                    value={
                                                                                        service.id
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        service.name
                                                                                    }
                                                                                </option>
                                                                            ),
                                                                        )}
                                                                    </select>
                                                                    <div className='selected-items'>
                                                                        {group.services?.map(
                                                                            (
                                                                                service,
                                                                                serviceIndex,
                                                                            ) => (
                                                                                <span
                                                                                    key={
                                                                                        serviceIndex
                                                                                    }
                                                                                    className='item-chip'
                                                                                >
                                                                                    {
                                                                                        service.name
                                                                                    }
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            const updatedData =
                                                                                                [
                                                                                                    ...userGroupData,
                                                                                                ];
                                                                                            updatedData[
                                                                                                index
                                                                                            ].services.splice(
                                                                                                serviceIndex,
                                                                                                1,
                                                                                            );
                                                                                            setUserGroupData(
                                                                                                updatedData,
                                                                                            );
                                                                                        }}
                                                                                        className='chip-remove'
                                                                                    >
                                                                                        ×
                                                                                    </button>
                                                                                </span>
                                                                            ),
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className='roles-cell'>
                                                                <button
                                                                    className='roles-btn'
                                                                    onClick={() =>
                                                                        navigateToRoles(
                                                                            index,
                                                                        )
                                                                    }
                                                                >
                                                                    <span className='roles-count'>
                                                                        {group
                                                                            .roles
                                                                            ?.length ||
                                                                            0}
                                                                    </span>
                                                                    <span className='roles-label'>
                                                                        roles
                                                                    </span>
                                                                </button>
                                                            </td>
                                                            <td className='actions-cell'>
                                                                <button
                                                                    className='action-btn delete'
                                                                    title='Delete User Group'
                                                                    onClick={async () => {
                                                                        if (
                                                                            window.confirm(
                                                                                'Are you sure you want to delete this user group?',
                                                                            )
                                                                        ) {
                                                                            const success =
                                                                                await deleteUserGroup(
                                                                                    group.id,
                                                                                );
                                                                            if (
                                                                                success
                                                                            ) {
                                                                                // Remove from local state
                                                                                const updatedData =
                                                                                    userGroupData.filter(
                                                                                        (
                                                                                            g,
                                                                                        ) =>
                                                                                            g.id !==
                                                                                            group.id,
                                                                                    );
                                                                                setUserGroupData(
                                                                                    updatedData,
                                                                                );
                                                                            }
                                                                        }
                                                                    }}
                                                                >
                                                                    <svg
                                                                        width='14'
                                                                        height='14'
                                                                        viewBox='0 0 24 24'
                                                                        fill='none'
                                                                        xmlns='http://www.w3.org/2000/svg'
                                                                    >
                                                                        <path
                                                                            d='M3 6H5H21'
                                                                            stroke='currentColor'
                                                                            strokeWidth='2'
                                                                            strokeLinecap='round'
                                                                            strokeLinejoin='round'
                                                                        />
                                                                        <path
                                                                            d='M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z'
                                                                            stroke='currentColor'
                                                                            strokeWidth='2'
                                                                            strokeLinecap='round'
                                                                            strokeLinejoin='round'
                                                                        />
                                                                        <path
                                                                            d='M10 11V17'
                                                                            stroke='currentColor'
                                                                            strokeWidth='2'
                                                                            strokeLinecap='round'
                                                                            strokeLinejoin='round'
                                                                        />
                                                                        <path
                                                                            d='M14 11V17'
                                                                            stroke='currentColor'
                                                                            strokeWidth='2'
                                                                            strokeLinecap='round'
                                                                            strokeLinejoin='round'
                                                                        />
                                                                    </svg>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Add New User Group Button */}
                                    <div className='add-user-group-container'>
                                        <button
                                            className='add-user-group-btn'
                                            onClick={async () => {
                                                const newGroupData = {
                                                    name: 'New User Group',
                                                    description: '',
                                                    entities: [],
                                                    services: [],
                                                    roles: [],
                                                };

                                                // Try to create via API first
                                                const createdGroup =
                                                    await createUserGroup(
                                                        newGroupData,
                                                    );
                                                if (createdGroup) {
                                                    // Add to local state
                                                    setUserGroupData([
                                                        ...userGroupData,
                                                        createdGroup,
                                                    ]);
                                                } else {
                                                    // Fallback: add locally with temporary ID
                                                    const tempGroup = {
                                                        id: `temp-${Date.now()}`,
                                                        ...newGroupData,
                                                    };
                                                    setUserGroupData([
                                                        ...userGroupData,
                                                        tempGroup,
                                                    ]);
                                                }
                                            }}
                                        >
                                            <svg
                                                width='16'
                                                height='16'
                                                viewBox='0 0 24 24'
                                                fill='none'
                                                xmlns='http://www.w3.org/2000/svg'
                                            >
                                                <path
                                                    d='M12 5V19'
                                                    stroke='currentColor'
                                                    strokeWidth='2'
                                                    strokeLinecap='round'
                                                    strokeLinejoin='round'
                                                />
                                                <path
                                                    d='M5 12H19'
                                                    stroke='currentColor'
                                                    strokeWidth='2'
                                                    strokeLinecap='round'
                                                    strokeLinejoin='round'
                                                />
                                            </svg>
                                            Add New User Group
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* 🎭 ENHANCED ROLES VIEW */}
                            {modernUI.currentView === 'roles' &&
                                modernUI.selectedGroupIndex !== null && (
                                    <div className='roles-view enhanced'>
                                        <div className='view-header'>
                                            <div className='header-title'>
                                                <h2>
                                                    Roles -{' '}
                                                    {
                                                        userGroupData[
                                                            modernUI
                                                                .selectedGroupIndex
                                                        ]?.name
                                                    }
                                                </h2>
                                                <div className='group-info'>
                                                    <span className='role-count'>
                                                        {userGroupData[
                                                            modernUI
                                                                .selectedGroupIndex
                                                        ]?.roles?.length ||
                                                            0}{' '}
                                                        roles
                                                    </span>
                                                </div>
                                            </div>
                                            <div className='search-assign-container'>
                                                <div className='search-wrapper'>
                                                    <input
                                                        type='text'
                                                        placeholder='Search roles by name, description, or attributes...'
                                                        className='smart-search enhanced'
                                                        value={
                                                            modernUI.roleSearchQuery ||
                                                            ''
                                                        }
                                                        onChange={(e) =>
                                                            setModernUI(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    roleSearchQuery:
                                                                        e.target
                                                                            .value,
                                                                }),
                                                            )
                                                        }
                                                    />
                                                    <div className='search-filters'>
                                                        <button className='filter-btn active'>
                                                            All
                                                        </button>
                                                        <button className='filter-btn'>
                                                            Admin
                                                        </button>
                                                        <button className='filter-btn'>
                                                            User
                                                        </button>
                                                        <button className='filter-btn'>
                                                            Custom
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className='action-buttons'>
                                                    <button className='assign-role-btn primary'>
                                                        <svg
                                                            width='16'
                                                            height='16'
                                                            viewBox='0 0 24 24'
                                                            fill='none'
                                                            xmlns='http://www.w3.org/2000/svg'
                                                        >
                                                            <path
                                                                d='M12 5V19'
                                                                stroke='currentColor'
                                                                strokeWidth='2'
                                                                strokeLinecap='round'
                                                                strokeLinejoin='round'
                                                            />
                                                            <path
                                                                d='M5 12H19'
                                                                stroke='currentColor'
                                                                strokeWidth='2'
                                                                strokeLinecap='round'
                                                                strokeLinejoin='round'
                                                            />
                                                        </svg>
                                                        Create New Role
                                                    </button>
                                                    <button className='assign-role-btn secondary'>
                                                        <svg
                                                            width='16'
                                                            height='16'
                                                            viewBox='0 0 24 24'
                                                            fill='none'
                                                            xmlns='http://www.w3.org/2000/svg'
                                                        >
                                                            <path
                                                                d='M9 12L11 14L15 10'
                                                                stroke='currentColor'
                                                                strokeWidth='2'
                                                                strokeLinecap='round'
                                                                strokeLinejoin='round'
                                                            />
                                                            <path
                                                                d='M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z'
                                                                stroke='currentColor'
                                                                strokeWidth='2'
                                                            />
                                                        </svg>
                                                        Bulk Assign
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className='roles-content'>
                                            <div className='roles-table-container'>
                                                <table className='modern-table enhanced'>
                                                    <thead>
                                                        <tr>
                                                            <th>
                                                                <input
                                                                    type='checkbox'
                                                                    className='select-all'
                                                                />
                                                            </th>
                                                            <th>
                                                                Role Details
                                                            </th>
                                                            <th>Type</th>
                                                            <th>Permissions</th>
                                                            <th>Status</th>
                                                            <th>Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {userGroupData[
                                                            modernUI
                                                                .selectedGroupIndex
                                                        ]?.roles
                                                            ?.filter(
                                                                (role) =>
                                                                    !modernUI.roleSearchQuery ||
                                                                    role.name
                                                                        .toLowerCase()
                                                                        .includes(
                                                                            modernUI.roleSearchQuery.toLowerCase(),
                                                                        ) ||
                                                                    role.description
                                                                        .toLowerCase()
                                                                        .includes(
                                                                            modernUI.roleSearchQuery.toLowerCase(),
                                                                        ),
                                                            )
                                                            ?.map(
                                                                (
                                                                    role,
                                                                    roleIndex,
                                                                ) => (
                                                                    <tr
                                                                        key={
                                                                            role.id
                                                                        }
                                                                        className={`role-row ${
                                                                            role.active
                                                                                ? 'active'
                                                                                : 'inactive'
                                                                        }`}
                                                                    >
                                                                        <td>
                                                                            <input
                                                                                type='checkbox'
                                                                                className='role-select'
                                                                            />
                                                                        </td>
                                                                        <td>
                                                                            <div className='role-details'>
                                                                                <div className='role-header'>
                                                                                    <div className='role-icon'>
                                                                                        {role.type ===
                                                                                        'admin'
                                                                                            ? '👑'
                                                                                            : role.type ===
                                                                                              'user'
                                                                                            ? '👤'
                                                                                            : '⚙️'}
                                                                                    </div>
                                                                                    <div className='role-info'>
                                                                                        <input
                                                                                            type='text'
                                                                                            value={
                                                                                                role.name
                                                                                            }
                                                                                            className='role-name-input'
                                                                                            placeholder='Role name...'
                                                                                        />
                                                                                        <textarea
                                                                                            value={
                                                                                                role.description
                                                                                            }
                                                                                            className='role-description-input'
                                                                                            placeholder='Role description...'
                                                                                            rows='2'
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                        <td>
                                                                            <select
                                                                                className='role-type-select'
                                                                                value={
                                                                                    role.type
                                                                                }
                                                                            >
                                                                                <option value='user'>
                                                                                    👤
                                                                                    User
                                                                                </option>
                                                                                <option value='admin'>
                                                                                    👑
                                                                                    Admin
                                                                                </option>
                                                                                <option value='custom'>
                                                                                    ⚙️
                                                                                    Custom
                                                                                </option>
                                                                            </select>
                                                                        </td>
                                                                        <td>
                                                                            <div className='permissions-cell'>
                                                                                <button
                                                                                    className='attributes-btn enhanced'
                                                                                    onClick={() =>
                                                                                        navigateToAttributes(
                                                                                            roleIndex,
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    <span className='attr-count'>
                                                                                        {role
                                                                                            .attributes
                                                                                            ?.length ||
                                                                                            0}
                                                                                    </span>
                                                                                    <span className='attr-label'>
                                                                                        attributes
                                                                                    </span>
                                                                                    <span className='attr-arrow'>
                                                                                        →
                                                                                    </span>
                                                                                </button>
                                                                                <div className='permission-tags'>
                                                                                    {role.attributes
                                                                                        ?.slice(
                                                                                            0,
                                                                                            3,
                                                                                        )
                                                                                        .map(
                                                                                            (
                                                                                                attr,
                                                                                            ) => (
                                                                                                <span
                                                                                                    key={
                                                                                                        attr.id
                                                                                                    }
                                                                                                    className='permission-tag'
                                                                                                >
                                                                                                    {
                                                                                                        attr.name
                                                                                                    }
                                                                                                </span>
                                                                                            ),
                                                                                        )}
                                                                                    {role
                                                                                        .attributes
                                                                                        ?.length >
                                                                                        3 && (
                                                                                        <span className='permission-tag more'>
                                                                                            +
                                                                                            {role
                                                                                                .attributes
                                                                                                .length -
                                                                                                3}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                        <td>
                                                                            <div className='status-cell'>
                                                                                <div
                                                                                    className={`status-indicator ${
                                                                                        role.active
                                                                                            ? 'active'
                                                                                            : 'inactive'
                                                                                    }`}
                                                                                >
                                                                                    <span className='status-dot'></span>
                                                                                    <span className='status-text'>
                                                                                        {role.active
                                                                                            ? 'Active'
                                                                                            : 'Inactive'}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                        <td>
                                                                            <div className='role-actions enhanced'>
                                                                                <button
                                                                                    className='action-btn edit'
                                                                                    title='Edit Role'
                                                                                >
                                                                                    <svg
                                                                                        width='14'
                                                                                        height='14'
                                                                                        viewBox='0 0 24 24'
                                                                                        fill='none'
                                                                                        xmlns='http://www.w3.org/2000/svg'
                                                                                    >
                                                                                        <path
                                                                                            d='M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13'
                                                                                            stroke='currentColor'
                                                                                            strokeWidth='2'
                                                                                            strokeLinecap='round'
                                                                                            strokeLinejoin='round'
                                                                                        />
                                                                                        <path
                                                                                            d='M18.5 2.50023C18.8978 2.1024 19.4374 1.87891 20 1.87891C20.5626 1.87891 21.1022 2.1024 21.5 2.50023C21.8978 2.89805 22.1213 3.43762 22.1213 4.00023C22.1213 4.56284 21.8978 5.1024 21.5 5.50023L12 15.0002L8 16.0002L9 12.0002L18.5 2.50023Z'
                                                                                            stroke='currentColor'
                                                                                            strokeWidth='2'
                                                                                            strokeLinecap='round'
                                                                                            strokeLinejoin='round'
                                                                                        />
                                                                                    </svg>
                                                                                </button>
                                                                                <button
                                                                                    className='action-btn duplicate'
                                                                                    title='Duplicate Role'
                                                                                >
                                                                                    <svg
                                                                                        width='14'
                                                                                        height='14'
                                                                                        viewBox='0 0 24 24'
                                                                                        fill='none'
                                                                                        xmlns='http://www.w3.org/2000/svg'
                                                                                    >
                                                                                        <path
                                                                                            d='M16 4H18C18.5304 4 19.0391 4.21071 19.4142 4.58579C19.7893 4.96086 20 5.46957 20 6V18C20 18.5304 19.7893 19.0391 19.4142 19.4142C19.0391 19.7893 18.5304 20 18 20H6C5.46957 20 4.96086 19.7893 4.58579 19.4142C4.21071 19.0391 4 18.5304 4 18V6C4 5.46957 4.21071 4.96086 4.58579 4.58579C4.96086 4.21071 5.46957 4 6 4H8'
                                                                                            stroke='currentColor'
                                                                                            strokeWidth='2'
                                                                                            strokeLinecap='round'
                                                                                            strokeLinejoin='round'
                                                                                        />
                                                                                        <path
                                                                                            d='M15 2H9C8.44772 2 8 2.44772 8 3V5C8 5.55228 8.44772 6 9 6H15C15.5523 6 16 5.55228 16 5V3C16 2.44772 15.5523 2 15 2Z'
                                                                                            stroke='currentColor'
                                                                                            strokeWidth='2'
                                                                                            strokeLinecap='round'
                                                                                            strokeLinejoin='round'
                                                                                        />
                                                                                    </svg>
                                                                                </button>
                                                                                <button
                                                                                    className={`action-btn toggle ${
                                                                                        role.active
                                                                                            ? 'active'
                                                                                            : 'inactive'
                                                                                    }`}
                                                                                    title={
                                                                                        role.active
                                                                                            ? 'Deactivate'
                                                                                            : 'Activate'
                                                                                    }
                                                                                >
                                                                                    {role.active ? (
                                                                                        <svg
                                                                                            width='14'
                                                                                            height='14'
                                                                                            viewBox='0 0 24 24'
                                                                                            fill='none'
                                                                                            xmlns='http://www.w3.org/2000/svg'
                                                                                        >
                                                                                            <path
                                                                                                d='M6 4H10V20H6V4Z'
                                                                                                fill='currentColor'
                                                                                            />
                                                                                            <path
                                                                                                d='M14 4H18V20H14V4Z'
                                                                                                fill='currentColor'
                                                                                            />
                                                                                        </svg>
                                                                                    ) : (
                                                                                        <svg
                                                                                            width='14'
                                                                                            height='14'
                                                                                            viewBox='0 0 24 24'
                                                                                            fill='none'
                                                                                            xmlns='http://www.w3.org/2000/svg'
                                                                                        >
                                                                                            <path
                                                                                                d='M8 5V19L19 12L8 5Z'
                                                                                                fill='currentColor'
                                                                                            />
                                                                                        </svg>
                                                                                    )}
                                                                                </button>
                                                                                <button
                                                                                    className='action-btn danger'
                                                                                    title='Delete Role'
                                                                                >
                                                                                    <svg
                                                                                        width='14'
                                                                                        height='14'
                                                                                        viewBox='0 0 24 24'
                                                                                        fill='none'
                                                                                        xmlns='http://www.w3.org/2000/svg'
                                                                                    >
                                                                                        <path
                                                                                            d='M3 6H5H21'
                                                                                            stroke='currentColor'
                                                                                            strokeWidth='2'
                                                                                            strokeLinecap='round'
                                                                                            strokeLinejoin='round'
                                                                                        />
                                                                                        <path
                                                                                            d='M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z'
                                                                                            stroke='currentColor'
                                                                                            strokeWidth='2'
                                                                                            strokeLinecap='round'
                                                                                            strokeLinejoin='round'
                                                                                        />
                                                                                        <path
                                                                                            d='M10 11V17'
                                                                                            stroke='currentColor'
                                                                                            strokeWidth='2'
                                                                                            strokeLinecap='round'
                                                                                            strokeLinejoin='round'
                                                                                        />
                                                                                        <path
                                                                                            d='M14 11V17'
                                                                                            stroke='currentColor'
                                                                                            strokeWidth='2'
                                                                                            strokeLinecap='round'
                                                                                            strokeLinejoin='round'
                                                                                        />
                                                                                    </svg>
                                                                                </button>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                ),
                                                            )}
                                                    </tbody>
                                                </table>
                                            </div>

                                            <div className='bulk-actions'>
                                                <button className='bulk-action-btn'>
                                                    <svg
                                                        width='16'
                                                        height='16'
                                                        viewBox='0 0 24 24'
                                                        fill='none'
                                                        xmlns='http://www.w3.org/2000/svg'
                                                    >
                                                        <path
                                                            d='M9 12L11 14L15 10'
                                                            stroke='currentColor'
                                                            strokeWidth='2'
                                                            strokeLinecap='round'
                                                            strokeLinejoin='round'
                                                        />
                                                        <path
                                                            d='M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z'
                                                            stroke='currentColor'
                                                            strokeWidth='2'
                                                        />
                                                    </svg>
                                                    Activate Selected
                                                </button>
                                                <button className='bulk-action-btn'>
                                                    <svg
                                                        width='16'
                                                        height='16'
                                                        viewBox='0 0 24 24'
                                                        fill='none'
                                                        xmlns='http://www.w3.org/2000/svg'
                                                    >
                                                        <path
                                                            d='M6 4H10V20H6V4Z'
                                                            fill='currentColor'
                                                        />
                                                        <path
                                                            d='M14 4H18V20H14V4Z'
                                                            fill='currentColor'
                                                        />
                                                    </svg>
                                                    Deactivate Selected
                                                </button>
                                                <button className='bulk-action-btn danger'>
                                                    <svg
                                                        width='16'
                                                        height='16'
                                                        viewBox='0 0 24 24'
                                                        fill='none'
                                                        xmlns='http://www.w3.org/2000/svg'
                                                    >
                                                        <path
                                                            d='M3 6H5H21'
                                                            stroke='currentColor'
                                                            strokeWidth='2'
                                                            strokeLinecap='round'
                                                            strokeLinejoin='round'
                                                        />
                                                        <path
                                                            d='M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z'
                                                            stroke='currentColor'
                                                            strokeWidth='2'
                                                            strokeLinecap='round'
                                                            strokeLinejoin='round'
                                                        />
                                                    </svg>
                                                    Delete Selected
                                                </button>
                                            </div>

                                            <div className='pagination'>
                                                <div className='pagination-info'>
                                                    <svg
                                                        width='16'
                                                        height='16'
                                                        viewBox='0 0 24 24'
                                                        fill='none'
                                                        xmlns='http://www.w3.org/2000/svg'
                                                    >
                                                        <path
                                                            d='M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21'
                                                            stroke='currentColor'
                                                            strokeWidth='2'
                                                            strokeLinecap='round'
                                                            strokeLinejoin='round'
                                                        />
                                                        <path
                                                            d='M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z'
                                                            stroke='currentColor'
                                                            strokeWidth='2'
                                                            strokeLinecap='round'
                                                            strokeLinejoin='round'
                                                        />
                                                        <path
                                                            d='M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13'
                                                            stroke='currentColor'
                                                            strokeWidth='2'
                                                            strokeLinecap='round'
                                                            strokeLinejoin='round'
                                                        />
                                                        <path
                                                            d='M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88'
                                                            stroke='currentColor'
                                                            strokeWidth='2'
                                                            strokeLinecap='round'
                                                            strokeLinejoin='round'
                                                        />
                                                    </svg>
                                                    Showing 1-10 of 25 roles
                                                </div>
                                                <div className='pagination-controls'>
                                                    <button
                                                        className='pagination-btn'
                                                        disabled
                                                    >
                                                        <svg
                                                            width='16'
                                                            height='16'
                                                            viewBox='0 0 24 24'
                                                            fill='none'
                                                            xmlns='http://www.w3.org/2000/svg'
                                                        >
                                                            <path
                                                                d='M15 18L9 12L15 6'
                                                                stroke='currentColor'
                                                                strokeWidth='2'
                                                                strokeLinecap='round'
                                                                strokeLinejoin='round'
                                                            />
                                                        </svg>
                                                        Previous
                                                    </button>
                                                    <span className='page-info'>
                                                        Page 1 of 3
                                                    </span>
                                                    <button className='pagination-btn'>
                                                        Next
                                                        <svg
                                                            width='16'
                                                            height='16'
                                                            viewBox='0 0 24 24'
                                                            fill='none'
                                                            xmlns='http://www.w3.org/2000/svg'
                                                        >
                                                            <path
                                                                d='M9 18L15 12L9 6'
                                                                stroke='currentColor'
                                                                strokeWidth='2'
                                                                strokeLinecap='round'
                                                                strokeLinejoin='round'
                                                            />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                            {/* ⚙️ ENHANCED ATTRIBUTES VIEW */}
                            {modernUI.currentView === 'attributes' &&
                                modernUI.selectedRoleIndex !== null && (
                                    <div className='attributes-view enhanced'>
                                        <div className='view-header'>
                                            <div className='header-title'>
                                                <h2>
                                                    Attributes -{' '}
                                                    {
                                                        userGroupData[
                                                            modernUI
                                                                .selectedGroupIndex
                                                        ]?.roles[
                                                            modernUI
                                                                .selectedRoleIndex
                                                        ]?.name
                                                    }
                                                </h2>
                                                <div className='role-info'>
                                                    <span className='attribute-count'>
                                                        {userGroupData[
                                                            modernUI
                                                                .selectedGroupIndex
                                                        ]?.roles[
                                                            modernUI
                                                                .selectedRoleIndex
                                                        ]?.attributes?.length ||
                                                            0}{' '}
                                                        attributes
                                                    </span>
                                                </div>
                                            </div>
                                            <div className='attributes-controls'>
                                                <div className='search-filter-container'>
                                                    <input
                                                        type='text'
                                                        placeholder='🔍 Search attributes by name, category, or description...'
                                                        className='attribute-search'
                                                        value={
                                                            modernUI.attributeSearchQuery ||
                                                            ''
                                                        }
                                                        onChange={(e) =>
                                                            setModernUI(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    attributeSearchQuery:
                                                                        e.target
                                                                            .value,
                                                                }),
                                                            )
                                                        }
                                                    />
                                                    <div className='filter-buttons'>
                                                        <button className='filter-btn active'>
                                                            All
                                                        </button>
                                                        <button className='filter-btn'>
                                                            Enabled
                                                        </button>
                                                        <button className='filter-btn'>
                                                            Disabled
                                                        </button>
                                                        <button className='filter-btn'>
                                                            Critical
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className='bulk-actions-header'>
                                                    <button className='bulk-btn primary'>
                                                        Enable Selected
                                                    </button>
                                                    <button className='bulk-btn secondary'>
                                                        Disable Selected
                                                    </button>
                                                    <button className='bulk-btn tertiary'>
                                                        ➕ Add Attribute
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className='attributes-content'>
                                            <div className='attributes-grid enhanced'>
                                                <div className='grid-header'>
                                                    <div className='select-all-container'>
                                                        <input
                                                            type='checkbox'
                                                            id='select-all-attributes'
                                                            className='select-all-checkbox'
                                                        />
                                                        <label htmlFor='select-all-attributes'>
                                                            Select All
                                                        </label>
                                                    </div>
                                                    <div className='view-options'>
                                                        <button
                                                            className='view-btn active'
                                                            title='Grid View'
                                                        >
                                                            ⊞
                                                        </button>
                                                        <button
                                                            className='view-btn'
                                                            title='List View'
                                                        >
                                                            ☰
                                                        </button>
                                                        <button
                                                            className='view-btn'
                                                            title='Compact View'
                                                        >
                                                            ⋯
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className='attributes-container'>
                                                    {userGroupData[
                                                        modernUI
                                                            .selectedGroupIndex
                                                    ]?.roles[
                                                        modernUI
                                                            .selectedRoleIndex
                                                    ]?.attributes
                                                        ?.filter(
                                                            (attribute) =>
                                                                !modernUI.attributeSearchQuery ||
                                                                attribute.name
                                                                    .toLowerCase()
                                                                    .includes(
                                                                        modernUI.attributeSearchQuery.toLowerCase(),
                                                                    ) ||
                                                                attribute.category
                                                                    ?.toLowerCase()
                                                                    .includes(
                                                                        modernUI.attributeSearchQuery.toLowerCase(),
                                                                    ) ||
                                                                attribute.description
                                                                    ?.toLowerCase()
                                                                    .includes(
                                                                        modernUI.attributeSearchQuery.toLowerCase(),
                                                                    ),
                                                        )
                                                        ?.map((attribute) => (
                                                            <div
                                                                key={
                                                                    attribute.id
                                                                }
                                                                className={`attribute-card enhanced ${
                                                                    attribute.enabled
                                                                        ? 'enabled'
                                                                        : 'disabled'
                                                                } ${
                                                                    attribute.critical
                                                                        ? 'critical'
                                                                        : ''
                                                                }`}
                                                            >
                                                                <div className='card-header'>
                                                                    <input
                                                                        type='checkbox'
                                                                        className='attribute-select'
                                                                        id={`attr-${attribute.id}`}
                                                                    />
                                                                    <div className='attribute-icon'>
                                                                        {attribute.icon ||
                                                                            '⚙️'}
                                                                    </div>
                                                                    <div className='attribute-category'>
                                                                        {attribute.category ||
                                                                            'General'}
                                                                    </div>
                                                                </div>

                                                                <div className='card-content'>
                                                                    <h4 className='attribute-name'>
                                                                        {
                                                                            attribute.name
                                                                        }
                                                                    </h4>
                                                                    <p className='attribute-description'>
                                                                        {attribute.description ||
                                                                            'No description available'}
                                                                    </p>

                                                                    <div className='attribute-details'>
                                                                        <div className='detail-row'>
                                                                            <span className='detail-label'>
                                                                                Access
                                                                                Level:
                                                                            </span>
                                                                            <select
                                                                                className='access-level-select'
                                                                                value={
                                                                                    attribute.accessLevel ||
                                                                                    'read'
                                                                                }
                                                                            >
                                                                                <option value='none'>
                                                                                    🚫
                                                                                    None
                                                                                </option>
                                                                                <option value='read'>
                                                                                    👁️
                                                                                    Read
                                                                                </option>
                                                                                <option value='write'>
                                                                                    ✏️
                                                                                    Write
                                                                                </option>
                                                                                <option value='admin'>
                                                                                    👑
                                                                                    Admin
                                                                                </option>
                                                                            </select>
                                                                        </div>

                                                                        <div className='detail-row'>
                                                                            <span className='detail-label'>
                                                                                Priority:
                                                                            </span>
                                                                            <div className='priority-selector'>
                                                                                <button
                                                                                    className={`priority-btn ${
                                                                                        attribute.priority ===
                                                                                        'low'
                                                                                            ? 'active'
                                                                                            : ''
                                                                                    }`}
                                                                                >
                                                                                    Low
                                                                                </button>
                                                                                <button
                                                                                    className={`priority-btn ${
                                                                                        attribute.priority ===
                                                                                        'medium'
                                                                                            ? 'active'
                                                                                            : ''
                                                                                    }`}
                                                                                >
                                                                                    Medium
                                                                                </button>
                                                                                <button
                                                                                    className={`priority-btn ${
                                                                                        attribute.priority ===
                                                                                        'high'
                                                                                            ? 'active'
                                                                                            : ''
                                                                                    }`}
                                                                                >
                                                                                    High
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div className='attribute-tags'>
                                                                        {attribute.tags?.map(
                                                                            (
                                                                                tag,
                                                                            ) => (
                                                                                <span
                                                                                    key={
                                                                                        tag
                                                                                    }
                                                                                    className='attribute-tag'
                                                                                >
                                                                                    {
                                                                                        tag
                                                                                    }
                                                                                </span>
                                                                            ),
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className='card-footer'>
                                                                    <div className='status-section'>
                                                                        <div
                                                                            className={`status-indicator ${
                                                                                attribute.enabled
                                                                                    ? 'enabled'
                                                                                    : 'disabled'
                                                                            }`}
                                                                        >
                                                                            <span className='status-dot'></span>
                                                                            <span className='status-text'>
                                                                                {attribute.enabled
                                                                                    ? 'Enabled'
                                                                                    : 'Disabled'}
                                                                            </span>
                                                                        </div>
                                                                        {attribute.critical && (
                                                                            <div className='critical-badge'>
                                                                                ⚠️
                                                                                Critical
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    <div className='attribute-actions'>
                                                                        <label className='toggle-switch enhanced'>
                                                                            <input
                                                                                type='checkbox'
                                                                                checked={
                                                                                    attribute.enabled
                                                                                }
                                                                                onChange={() => {
                                                                                    // Toggle attribute logic here
                                                                                }}
                                                                            />
                                                                            <span className='toggle-slider'></span>
                                                                        </label>
                                                                        <button
                                                                            className='action-btn edit'
                                                                            title='Edit Attribute'
                                                                        >
                                                                            ✏️
                                                                        </button>
                                                                        <button
                                                                            className='action-btn duplicate'
                                                                            title='Duplicate Attribute'
                                                                        >
                                                                            📋
                                                                        </button>
                                                                        <button
                                                                            className='action-btn danger'
                                                                            title='Remove Attribute'
                                                                        >
                                                                            🗑️
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>

                                            <div className='attributes-footer'>
                                                <div className='bulk-actions'>
                                                    <button className='bulk-btn'>
                                                        Enable Selected
                                                    </button>
                                                    <button className='bulk-btn'>
                                                        Disable Selected
                                                    </button>
                                                    <button className='bulk-btn'>
                                                        Set Priority
                                                    </button>
                                                    <button className='bulk-btn danger'>
                                                        Remove Selected
                                                    </button>
                                                </div>
                                                <div className='save-actions'>
                                                    <button className='action-btn secondary'>
                                                        🔄 Reset Changes
                                                    </button>
                                                    <button className='action-btn primary'>
                                                        💾 Save All Changes
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                        </div>
                    </div>
                </>
            )}
        </DndContext>
    );
};

export default ReusableTableComponent;
