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
import './TableComponent.css';
import tableConfig from '../../config/tableConfig';
import AssignUserGroupsTable from '../AssignUserGroups/AssignUserGroupsTable';

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
                                className={`task-text ${
                                    !value ? 'placeholder-text' : ''
                                }`}
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
                        className={`task-text ${
                            !value ? 'placeholder-text' : ''
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
                    className={`task-text ${!value ? 'placeholder-text' : ''}`}
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
                        <svg
                            width='20'
                            height='20'
                            viewBox='0 0 24 24'
                            fill='none'
                            xmlns='http://www.w3.org/2000/svg'
                            className='password-icon'
                        >
                            <circle
                                cx='8'
                                cy='8'
                                r='6'
                                stroke='currentColor'
                                strokeWidth='2'
                                fill='none'
                            />
                            <path
                                d='M14 8L22 16'
                                stroke='currentColor'
                                strokeWidth='2'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                            />
                            <path
                                d='M18 12L20 14'
                                stroke='currentColor'
                                strokeWidth='2'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                            />
                            <path
                                d='M16 14L18 16'
                                stroke='currentColor'
                                strokeWidth='2'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                            />
                            <circle cx='8' cy='8' r='2' fill='currentColor' />
                        </svg>
                    </div>
                </div>
            );

        case 'userGroup':
            const userGroups = value ? (Array.isArray(value) ? value : []) : [];

            // Determine button state based on saved vs pending groups AND password
            const hasSavedGroups = userGroups.length > 0;
            const hasPendingGroups =
                item.pendingGroupAssignments &&
                item.pendingGroupAssignments.length > 0;

            // Check if user has an actual password set (not just placeholder)
            const hasPassword =
                item.password &&
                item.password !== '••••••••' &&
                item.password.trim() !== '';

            // Button state logic:
            // - grey (default): no groups and no pending
            // - grey with count: has pending assignments but not saved, OR groups saved but no password
            // - green with count: has saved groups AND password is set
            const buttonState =
                hasSavedGroups && hasPassword
                    ? 'saved'
                    : hasPendingGroups || hasSavedGroups
                    ? 'pending'
                    : 'default';
            const displayCount = hasSavedGroups
                ? userGroups.length
                : hasPendingGroups
                ? item.pendingGroupAssignments.length
                : 0;
            return (
                <div
                    className='usergroup-wrapper'
                    onMouseEnter={(e) => showTooltip(e, item.id, column.id)}
                    onMouseLeave={hideTooltip}
                >
                    <div className='usergroup-display'>
                        <div className='usergroup-count-badge'>
                            <div className='usergroup-icon-container'>
                                <svg
                                    width='18'
                                    height='18'
                                    viewBox='0 0 24 24'
                                    fill='none'
                                    xmlns='http://www.w3.org/2000/svg'
                                    className={`usergroup-icon ${buttonState}`}
                                >
                                    <path
                                        d='M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21'
                                        stroke='currentColor'
                                        strokeWidth='1.5'
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                    />
                                    <path
                                        d='M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z'
                                        stroke='currentColor'
                                        strokeWidth='1.5'
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                    />
                                    <path
                                        d='M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13'
                                        stroke='currentColor'
                                        strokeWidth='1.5'
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                    />
                                    <path
                                        d='M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88'
                                        stroke='currentColor'
                                        strokeWidth='1.5'
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                    />
                                </svg>
                                {displayCount > 0 && (
                                    <span
                                        className={`usergroup-count-notification ${buttonState}`}
                                    >
                                        {displayCount}
                                    </span>
                                )}
                            </div>
                        </div>
                        <button
                            className={`usergroup-add-button ${buttonState}`}
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
                            title={
                                buttonState === 'saved'
                                    ? `${displayCount} group(s) assigned & password set`
                                    : buttonState === 'pending'
                                    ? hasSavedGroups && !hasPassword
                                        ? `${displayCount} group(s) assigned (password required)`
                                        : `${displayCount} group(s) pending assignment`
                                    : 'Assign user groups'
                            }
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
                    className={`task-text ${!value ? 'placeholder-text' : ''}`}
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
                    className={`task-text ${!value ? 'placeholder-text' : ''}`}
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
                    className={`task-text ${!value ? 'placeholder-text' : ''}`}
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
                    className={`task-text ${!value ? 'placeholder-text' : ''}`}
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
                        <svg
                            width='20'
                            height='20'
                            viewBox='0 0 24 24'
                            fill='none'
                            xmlns='http://www.w3.org/2000/svg'
                            className='password-icon'
                        >
                            <circle
                                cx='8'
                                cy='8'
                                r='6'
                                stroke='currentColor'
                                strokeWidth='2'
                                fill='none'
                            />
                            <path
                                d='M14 8L22 16'
                                stroke='currentColor'
                                strokeWidth='2'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                            />
                            <path
                                d='M18 12L20 14'
                                stroke='currentColor'
                                strokeWidth='2'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                            />
                            <path
                                d='M16 14L18 16'
                                stroke='currentColor'
                                strokeWidth='2'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                            />
                            <circle cx='8' cy='8' r='2' fill='currentColor' />
                        </svg>
                    </div>
                </div>
            );

        case 'userGroup':
            const userGroups = value ? (Array.isArray(value) ? value : []) : [];

            // Determine button state based on saved vs pending groups AND password
            const hasSavedGroups = userGroups.length > 0;
            const hasPendingGroups =
                item.pendingGroupAssignments &&
                item.pendingGroupAssignments.length > 0;

            // Check if user has an actual password set (not just placeholder)
            const hasPassword =
                item.password &&
                item.password !== '••••••••' &&
                item.password.trim() !== '';

            // Button state logic:
            // - grey (default): no groups and no pending
            // - grey with count: has pending assignments but not saved, OR groups saved but no password
            // - green with count: has saved groups AND password is set
            const buttonState =
                hasSavedGroups && hasPassword
                    ? 'saved'
                    : hasPendingGroups || hasSavedGroups
                    ? 'pending'
                    : 'default';
            const displayCount = hasSavedGroups
                ? userGroups.length
                : hasPendingGroups
                ? item.pendingGroupAssignments.length
                : 0;
            return (
                <div
                    className='usergroup-wrapper'
                    onMouseEnter={(e) => showTooltip(e, item.id, column.id)}
                    onMouseLeave={hideTooltip}
                >
                    <div className='usergroup-display'>
                        <div className='usergroup-count-badge'>
                            <div className='usergroup-icon-container'>
                                <svg
                                    width='18'
                                    height='18'
                                    viewBox='0 0 24 24'
                                    fill='none'
                                    xmlns='http://www.w3.org/2000/svg'
                                    className={`usergroup-icon ${buttonState}`}
                                >
                                    <path
                                        d='M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21'
                                        stroke='currentColor'
                                        strokeWidth='1.5'
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                    />
                                    <path
                                        d='M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z'
                                        stroke='currentColor'
                                        strokeWidth='1.5'
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                    />
                                    <path
                                        d='M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13'
                                        stroke='currentColor'
                                        strokeWidth='1.5'
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                    />
                                    <path
                                        d='M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88'
                                        stroke='currentColor'
                                        strokeWidth='1.5'
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                    />
                                </svg>
                                {displayCount > 0 && (
                                    <span
                                        className={`usergroup-count-notification ${buttonState}`}
                                    >
                                        {displayCount}
                                    </span>
                                )}
                            </div>
                        </div>
                        <button
                            className={`usergroup-add-button ${buttonState}`}
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
                            title={
                                buttonState === 'saved'
                                    ? `${displayCount} group(s) assigned & password set`
                                    : buttonState === 'pending'
                                    ? hasSavedGroups && !hasPassword
                                        ? `${displayCount} group(s) assigned (password required)`
                                        : `${displayCount} group(s) pending assignment`
                                    : 'Assign user groups'
                            }
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
                    className={`task-text ${!value ? 'placeholder-text' : ''}`}
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
        actions,
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
    const [items, setItems] = useState(configToUse.initialData || []);

    // Helper function to update items and notify parent component
    const updateItems = useCallback(
        (newItems) => {
            console.log('🔄 updateItems called with:', newItems);
            setItems(newItems);

            // Call the parent's onDataChange callback if provided
            if (actions?.onDataChange) {
                console.log('📢 Calling parent onDataChange callback');
                actions.onDataChange(newItems);
            } else {
                console.log('⚠️ No onDataChange callback provided');
            }
        },
        [actions],
    );

    const [expanded, setExpanded] = useState(new Set());
    const [newSubitemNameByItem, setNewSubitemNameByItem] = useState({});
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [selectAll, setSelectAll] = useState(false);

    // Update items when initialData changes
    useEffect(() => {
        if (configToUse.initialData && configToUse.initialData.length > 0) {
            console.log(
                '🔄 Initial data received, updating items:',
                configToUse.initialData,
            );
            setItems(configToUse.initialData); // Don't trigger callback for initial load
        }
    }, [configToUse.initialData]);

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

    // State for user group assignment functionality
    const [availableUserGroups, setAvailableUserGroups] = useState([]);
    const [selectedUserGroups, setSelectedUserGroups] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [assignmentMode, setAssignmentMode] = useState(false);
    const [bulkSelectedGroups, setBulkSelectedGroups] = useState([]);

    // State for roles management
    const [availableRoles, setAvailableRoles] = useState([]);

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

                // Load dynamic data from our API endpoints
                let userGroups = [];
                try {
                    // Load all dynamic data in parallel using backend APIs
                    const baseUrl =
                        process.env.NEXT_PUBLIC_API_BASE ||
                        'http://localhost:4000';
                    const [entitiesRes, servicesRes, rolesRes, userGroupsRes] =
                        await Promise.all([
                            fetch(
                                `${baseUrl}/api/business-units/entities?accountId=4&enterpriseId=7`,
                            ),
                            fetch(`${baseUrl}/api/services`),
                            fetch(`${baseUrl}/api/roles?groupId=1`), // Default groupId
                            fetch(
                                `${baseUrl}/api/user-groups?accountId=4&enterpriseId=7`,
                            ),
                        ]);

                    const entities = entitiesRes.ok
                        ? await entitiesRes.json()
                        : [];
                    const services = servicesRes.ok
                        ? await servicesRes.json()
                        : [];
                    const roles = rolesRes.ok ? await rolesRes.json() : [];
                    const groups = userGroupsRes.ok
                        ? await userGroupsRes.json()
                        : [];

                    // Store for user assignment functionality
                    setAvailableUserGroups(groups);

                    // Transform to expected format with dynamic data
                    userGroups = groups.map((group, index) => ({
                        id: `ug-${group.id}`,
                        name: group.name,
                        description: group.description || '',
                        entities: entities
                            .slice(0, 2)
                            .map((e) => ({id: `e${e.id}`, name: e.name})),
                        services: services
                            .slice(index * 2, index * 2 + 2)
                            .map((s) => ({id: `s${s.id}`, name: s.name})),
                        roles: roles
                            .slice(0, 2)
                            .map((r) => ({id: `r${r.id}`, name: r.name})),
                    }));

                    console.log(
                        '✅ Loaded dynamic user groups data:',
                        userGroups,
                    );
                } catch (apiError) {
                    console.error('❌ Failed to load dynamic data:', apiError);
                    // NO FALLBACK DATA - only show data from database
                    userGroups = [];
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

    // 🎯 User Assignment Functions
    const assignUserToGroups = useCallback(
        async (userId, groupsData) => {
            try {
                // Extract group IDs from group data objects and ensure they're integers
                const groupIds = Array.isArray(groupsData)
                    ? groupsData
                          .map((group) => {
                              const id = group.id || group.groupId || group;
                              return parseInt(id, 10);
                          })
                          .filter((id) => !isNaN(id)) // Filter out invalid IDs
                    : [
                          parseInt(
                              groupsData.id || groupsData.groupId || groupsData,
                              10,
                          ),
                      ].filter((id) => !isNaN(id));

                console.log('🔄 Assigning user to groups:', {
                    userId,
                    groupIds,
                    groupsData,
                    userIdType: typeof userId,
                    groupIdsTypes: groupIds.map((id) => typeof id),
                });

                // Ensure userId is an integer
                const userIdInt = parseInt(userId, 10);
                if (isNaN(userIdInt)) {
                    throw new Error(`Invalid user ID: ${userId}`);
                }

                if (groupIds.length === 0) {
                    throw new Error('No valid group IDs provided');
                }

                const response = await fetch(
                    `http://localhost:4000/api/users/${userIdInt}/assign-groups`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            groupIds: groupIds, // This will be stored as integer[] in acme.fnd_users.assigned_user_group
                            userId: userIdInt,
                        }),
                    },
                );

                if (response.ok) {
                    const responseData = await response.json();
                    console.log(
                        '✅ User assigned to groups successfully:',
                        responseData,
                    );

                    // Update current user data if it matches
                    if (currentUser && currentUser.id == userId) {
                        setCurrentUser((prev) => ({
                            ...prev,
                            assignedUserGroup: groupsData,
                            assignedGroupIds: groupIds,
                        }));
                    }

                    // Trigger a callback to notify parent component of the assignment
                    if (window.userGroupAssignmentCallback) {
                        window.userGroupAssignmentCallback(
                            userId,
                            groupsData,
                            groupIds,
                        );
                    }

                    return true;
                } else {
                    const errorData = await response.text();
                    console.error(
                        '❌ Failed to assign user to groups:',
                        errorData,
                    );
                    return false;
                }
            } catch (error) {
                console.error('❌ Error assigning user to groups:', error);
                return false;
            }
        },
        [currentUser],
    );

    const removeUserFromGroup = useCallback(async (userId, groupId) => {
        try {
            console.log('🔄 Removing user from group:', {userId, groupId});

            const response = await fetch(
                `http://localhost:4000/api/users/${userId}/remove-group/${groupId}`,
                {
                    method: 'DELETE',
                },
            );

            if (response.ok) {
                console.log('✅ User removed from group successfully');
                return true;
            } else {
                console.error('❌ Failed to remove user from group');
                return false;
            }
        } catch (error) {
            console.error('❌ Error removing user from group:', error);
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

            // Determine if this is user assignment mode
            const isUserAssignment =
                columnId === 'assignedUserGroup' || columnId === 'userGroups';
            console.log('🎯 Checking assignment mode:', {
                columnId,
                isUserAssignment,
            });

            if (isUserAssignment) {
                console.log('✅ Setting assignment mode to true');
                setAssignmentMode(true);
                // Find the current user data
                const user = items.find((item) => item.id === itemId);
                console.log('👤 Found user:', user);
                setCurrentUser(user);
                // Get already assigned groups for this user
                setSelectedUserGroups(user?.assignedUserGroup || []);
                setBulkSelectedGroups([]);
                // Load entities and services for assignment
                fetchEntities('4', '7');
                fetchServices();
            } else {
                console.log('❌ Not assignment mode, setting to false');
                setAssignmentMode(false);
                setCurrentUser(null);
                setBulkSelectedGroups([]);
            }

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
        // Add slide-out class for animation
        const panel = document.querySelector('.smart-context-panel');
        if (panel) {
            panel.classList.add('slide-out');
            // Wait for animation to complete before hiding
            setTimeout(() => {
                setModernUI((prev) => ({
                    ...prev,
                    isOpen: false,
                    itemId: null,
                    columnId: null,
                    commandPalette: {
                        ...prev.commandPalette,
                        isOpen: false,
                        query: '',
                    },
                    floatingCards: {
                        groups: {...prev.floatingCards.groups, visible: false},
                        roles: {...prev.floatingCards.roles, visible: false},
                        attributes: {
                            ...prev.floatingCards.attributes,
                            visible: false,
                        },
                    },
                }));
                setSearchTerm('');
            }, 400); // Match the animation duration
        } else {
            // Fallback if panel not found
            setModernUI((prev) => ({
                ...prev,
                isOpen: false,
                itemId: null,
                columnId: null,
                commandPalette: {
                    ...prev.commandPalette,
                    isOpen: false,
                    query: '',
                },
                floatingCards: {
                    groups: {...prev.floatingCards.groups, visible: false},
                    roles: {...prev.floatingCards.roles, visible: false},
                    attributes: {
                        ...prev.floatingCards.attributes,
                        visible: false,
                    },
                },
            }));
            setSearchTerm('');
        }
    };

    // 🧭 Breadcrumb Navigation Function
    const navigateToBreadcrumbView = (view) => {
        setModernUI((prevUI) => ({
            ...prevUI,
            view: view,
            currentView: view,
        }));
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

            // Use backend entities API endpoint
            const baseUrl =
                process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
            const response = await fetch(
                `${baseUrl}/api/business-units/entities?accountId=4&enterpriseId=7`,
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

            // NO FALLBACK DATA - only show data from database
            console.error('❌ API failed, no fallback data provided');
            setEntities([]);
            return [];
        }
    };

    const fetchServices = async () => {
        try {
            const baseUrl =
                process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
            const response = await fetch(`${baseUrl}/api/services`);
            const data = await response.json();
            setServices(data);
            return data;
        } catch (error) {
            console.error('Error fetching services:', error);
            // NO FALLBACK DATA - only show data from database
            console.error('❌ API failed, no fallback data provided');
            setServices([]);
            return [];
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

        const newItems = [...items, newItem];
        updateItems(newItems);
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
            <div className='task-group advanced-table-features modern-ui-enabled compact-mode'>
                <div
                    className='table-header sortable-header-container modern-header'
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
                                        {configToUse.customHeaderRenderer
                                            ? configToUse.customHeaderRenderer(
                                                  column,
                                              )
                                            : column.title}
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
                                        console.log('📝 Field changed:', {
                                            field,
                                            value,
                                            itemId: item.id,
                                        });
                                        const newItems = items.map((it) =>
                                            it.id === item.id
                                                ? {...it, [field]: value}
                                                : it,
                                        );
                                        updateItems(newItems);
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

            {/* Enhanced User Group Tooltip with Remove Functionality */}
            {tooltipPosition.visible &&
                tooltipPosition.columnId === 'assignedUserGroup' && (
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
                                    <div
                                        key={group.id || index}
                                        className='usergroup-item'
                                    >
                                        <span className='usergroup-name'>
                                            {group.name ||
                                                group.group ||
                                                `Group ${group.id}`}
                                        </span>
                                        <button
                                            className='usergroup-remove'
                                            onClick={async (e) => {
                                                e.stopPropagation();

                                                // Use the global remove function if available
                                                if (
                                                    window.removeGroupFromUserCallback
                                                ) {
                                                    const groupId =
                                                        group.id ||
                                                        group.groupId;
                                                    const groupName =
                                                        group.name ||
                                                        group.group ||
                                                        `Group ${groupId}`;

                                                    if (groupId) {
                                                        console.log(
                                                            '🔄 Removing group via API:',
                                                            {
                                                                userId: tooltipPosition.itemId,
                                                                groupId,
                                                                groupName,
                                                            },
                                                        );

                                                        const success =
                                                            await window.removeGroupFromUserCallback(
                                                                tooltipPosition.itemId,
                                                                parseInt(
                                                                    groupId,
                                                                    10,
                                                                ),
                                                                groupName,
                                                            );

                                                        if (success) {
                                                            console.log(
                                                                '✅ Group removed successfully via API',
                                                            );
                                                            // The callback will update the UI, so we don't need to do it here
                                                        } else {
                                                            console.error(
                                                                '❌ Failed to remove group via API',
                                                            );
                                                        }
                                                    } else {
                                                        console.error(
                                                            '❌ No group ID found for removal',
                                                        );
                                                    }
                                                } else {
                                                    console.warn(
                                                        '⚠️ No remove callback available, falling back to local removal',
                                                    );
                                                    // Fallback to local removal
                                                    const updatedGroups =
                                                        groupsArray.filter(
                                                            (_, i) =>
                                                                i !== index,
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
                                                }
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
                    {/* 🚀 Modern Smart Context Panel */}
                    <div className='smart-context-panel'>
                        {/* Close Button */}
                        <button
                            className='panel-close-btn'
                            onClick={closeModernUI}
                            aria-label='Close panel'
                        >
                            <svg
                                width='20'
                                height='20'
                                viewBox='0 0 24 24'
                                fill='none'
                                stroke='currentColor'
                                strokeWidth='2'
                            >
                                <line x1='18' y1='6' x2='6' y2='18'></line>
                                <line x1='6' y1='6' x2='18' y2='18'></line>
                            </svg>
                        </button>

                        {/* 🧭 Breadcrumb Navigation */}
                        <div className='panel-breadcrumb-container'>
                            <nav
                                className='panel-breadcrumb-nav'
                                aria-label='Panel Breadcrumb'
                            >
                                <div
                                    className='breadcrumb-item'
                                    onClick={closeModernUI}
                                >
                                    <svg
                                        className='breadcrumb-icon'
                                        viewBox='0 0 24 24'
                                        fill='none'
                                    >
                                        <circle
                                            cx='12'
                                            cy='7'
                                            r='4'
                                            stroke='currentColor'
                                            strokeWidth='1.5'
                                        />
                                        <path
                                            d='M6 21V19C6 16.7909 7.79086 15 10 15H14C16.2091 15 18 16.7909 18 19V21'
                                            stroke='currentColor'
                                            strokeWidth='1.5'
                                            strokeLinecap='round'
                                        />
                                    </svg>
                                    <span>Manage Users</span>
                                </div>

                                <svg
                                    className='breadcrumb-separator'
                                    viewBox='0 0 24 24'
                                    fill='none'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M9 5l7 7-7 7'
                                    />
                                </svg>

                                <div
                                    className={`breadcrumb-item ${
                                        modernUI.view === 'groups'
                                            ? 'Active'
                                            : ''
                                    }`}
                                    onClick={() =>
                                        navigateToBreadcrumbView('groups')
                                    }
                                >
                                    <svg
                                        className='breadcrumb-icon'
                                        viewBox='0 0 24 24'
                                        fill='none'
                                    >
                                        <path
                                            d='M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21'
                                            stroke='currentColor'
                                            strokeWidth='1.5'
                                        />
                                        <path
                                            d='M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z'
                                            stroke='currentColor'
                                            strokeWidth='1.5'
                                        />
                                        <path
                                            d='M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13'
                                            stroke='currentColor'
                                            strokeWidth='1.5'
                                        />
                                        <path
                                            d='M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88'
                                            stroke='currentColor'
                                            strokeWidth='1.5'
                                        />
                                    </svg>
                                    <span>Assign User Groups</span>
                                </div>

                                {modernUI.view === 'roles' && (
                                    <>
                                        <svg
                                            className='breadcrumb-separator'
                                            viewBox='0 0 24 24'
                                            fill='none'
                                        >
                                            <path
                                                strokeLinecap='round'
                                                strokeLinejoin='round'
                                                strokeWidth={2}
                                                d='M9 5l7 7-7 7'
                                            />
                                        </svg>

                                        <div
                                            className='breadcrumb-item Active'
                                            onClick={() =>
                                                navigateToBreadcrumbView(
                                                    'roles',
                                                )
                                            }
                                        >
                                            <svg
                                                className='breadcrumb-icon'
                                                viewBox='0 0 24 24'
                                                fill='none'
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
                                            <span>Select Roles</span>
                                        </div>
                                    </>
                                )}

                                {modernUI.view === 'scope' && (
                                    <>
                                        <svg
                                            className='breadcrumb-separator'
                                            viewBox='0 0 24 24'
                                            fill='none'
                                        >
                                            <path
                                                strokeLinecap='round'
                                                strokeLinejoin='round'
                                                strokeWidth={2}
                                                d='M9 5l7 7-7 7'
                                            />
                                        </svg>

                                        <div
                                            className='breadcrumb-item'
                                            onClick={() =>
                                                navigateToBreadcrumbView(
                                                    'roles',
                                                )
                                            }
                                        >
                                            <svg
                                                className='breadcrumb-icon'
                                                viewBox='0 0 24 24'
                                                fill='none'
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
                                            <span>Select Roles</span>
                                        </div>

                                        <svg
                                            className='breadcrumb-separator'
                                            viewBox='0 0 24 24'
                                            fill='none'
                                        >
                                            <path
                                                strokeLinecap='round'
                                                strokeLinejoin='round'
                                                strokeWidth={2}
                                                d='M9 5l7 7-7 7'
                                            />
                                        </svg>

                                        <div
                                            className='breadcrumb-item Active'
                                            onClick={() =>
                                                navigateToBreadcrumbView(
                                                    'scope',
                                                )
                                            }
                                        >
                                            <svg
                                                className='breadcrumb-icon'
                                                viewBox='0 0 24 24'
                                                fill='none'
                                            >
                                                <circle
                                                    cx='12'
                                                    cy='12'
                                                    r='3'
                                                    stroke='currentColor'
                                                    strokeWidth='1.5'
                                                />
                                                <path
                                                    d='M21 12C21 12 18 18 12 18S3 12 3 12S6 6 12 6S21 12 21 12Z'
                                                    stroke='currentColor'
                                                    strokeWidth='1.5'
                                                />
                                            </svg>
                                            <span>Configure Attributes</span>
                                        </div>
                                    </>
                                )}
                            </nav>
                            <button
                                className='panel-close-btn'
                                onClick={closeModernUI}
                            >
                                <svg
                                    width='14'
                                    height='14'
                                    viewBox='0 0 24 24'
                                    fill='none'
                                >
                                    <line
                                        x1='18'
                                        y1='6'
                                        x2='6'
                                        y2='18'
                                        stroke='currentColor'
                                        strokeWidth='2'
                                    ></line>
                                    <line
                                        x1='6'
                                        y1='6'
                                        x2='18'
                                        y2='18'
                                        stroke='currentColor'
                                        strokeWidth='2'
                                    ></line>
                                </svg>
                            </button>
                        </div>

                        {/* 🎯 New AssignUserGroupsTable Component */}
                        <AssignUserGroupsTable
                            currentUser={currentUser}
                            onAssignGroups={assignUserToGroups}
                            onClose={closeModernUI}
                            isVisible={modernUI.isOpen && assignmentMode}
                            embedded={true}
                        />

                        {/* 🎯 Dynamic Content Area */}
                        <div
                            className='smart-content-area'
                            style={{display: assignmentMode ? 'none' : 'block'}}
                        >
                            {/* 👥 USER GROUPS VIEW */}
                            {modernUI.currentView === 'groups' && (
                                <div className='groups-view'>
                                    <div className='view-header'>
                                        {assignmentMode && currentUser ? (
                                            <>
                                                <h2>
                                                    <svg
                                                        width='20'
                                                        height='20'
                                                        viewBox='0 0 24 24'
                                                        fill='none'
                                                        xmlns='http://www.w3.org/2000/svg'
                                                        style={{
                                                            marginRight: '8px',
                                                            color: '#3b82f6',
                                                        }}
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
                                                    Assign Groups to User
                                                </h2>
                                                <div className='user-info-card'>
                                                    <div className='user-avatar'>
                                                        <svg
                                                            width='24'
                                                            height='24'
                                                            viewBox='0 0 24 24'
                                                            fill='none'
                                                            xmlns='http://www.w3.org/2000/svg'
                                                        >
                                                            <path
                                                                d='M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21'
                                                                stroke='currentColor'
                                                                strokeWidth='2'
                                                                strokeLinecap='round'
                                                                strokeLinejoin='round'
                                                            />
                                                            <path
                                                                d='M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 10 4.79086 10 7C10 9.20914 9.79086 11 12 11Z'
                                                                stroke='currentColor'
                                                                strokeWidth='2'
                                                                strokeLinecap='round'
                                                                strokeLinejoin='round'
                                                            />
                                                        </svg>
                                                    </div>
                                                    <div className='user-details'>
                                                        <div className='user-name'>
                                                            {
                                                                currentUser.firstName
                                                            }{' '}
                                                            {
                                                                currentUser.lastName
                                                            }
                                                        </div>
                                                        <div className='user-email'>
                                                            {
                                                                currentUser.emailAddress
                                                            }
                                                        </div>
                                                        <div className='assigned-count'>
                                                            {
                                                                selectedUserGroups.length
                                                            }{' '}
                                                            groups assigned
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
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
                                        )}
                                    </div>

                                    {assignmentMode ? (
                                        <div className='assignment-table-container'>
                                            <table className='assignment-table'>
                                                <thead>
                                                    <tr>
                                                        <th>
                                                            <input
                                                                type='checkbox'
                                                                className='bulk-select-checkbox'
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    if (
                                                                        e.target
                                                                            .checked
                                                                    ) {
                                                                        setBulkSelectedGroups(
                                                                            availableUserGroups.map(
                                                                                (
                                                                                    g,
                                                                                ) =>
                                                                                    g.id,
                                                                            ),
                                                                        );
                                                                    } else {
                                                                        setBulkSelectedGroups(
                                                                            [],
                                                                        );
                                                                    }
                                                                }}
                                                                checked={
                                                                    bulkSelectedGroups.length ===
                                                                        availableUserGroups.length &&
                                                                    availableUserGroups.length >
                                                                        0
                                                                }
                                                            />
                                                        </th>
                                                        <th>Group</th>
                                                        <th>Description</th>
                                                        <th>Entity</th>
                                                        <th>Service</th>
                                                        <th>Roles</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {availableUserGroups.map(
                                                        (group, index) => (
                                                            <tr
                                                                key={group.id}
                                                                className={
                                                                    bulkSelectedGroups.includes(
                                                                        group.id,
                                                                    )
                                                                        ? 'selected'
                                                                        : ''
                                                                }
                                                            >
                                                                <td>
                                                                    <input
                                                                        type='checkbox'
                                                                        className='bulk-select-checkbox'
                                                                        checked={bulkSelectedGroups.includes(
                                                                            group.id,
                                                                        )}
                                                                        onChange={(
                                                                            e,
                                                                        ) => {
                                                                            if (
                                                                                e
                                                                                    .target
                                                                                    .checked
                                                                            ) {
                                                                                setBulkSelectedGroups(
                                                                                    [
                                                                                        ...bulkSelectedGroups,
                                                                                        group.id,
                                                                                    ],
                                                                                );
                                                                            } else {
                                                                                setBulkSelectedGroups(
                                                                                    bulkSelectedGroups.filter(
                                                                                        (
                                                                                            id,
                                                                                        ) =>
                                                                                            id !==
                                                                                            group.id,
                                                                                    ),
                                                                                );
                                                                            }
                                                                        }}
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <div
                                                                        style={{
                                                                            fontWeight: 600,
                                                                            color: '#1e40af',
                                                                        }}
                                                                    >
                                                                        {
                                                                            group.name
                                                                        }
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <div
                                                                        style={{
                                                                            fontSize:
                                                                                '13px',
                                                                            color: '#64748b',
                                                                        }}
                                                                    >
                                                                        {group.description ||
                                                                            'No description provided'}
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <select
                                                                        className='assignment-dropdown'
                                                                        value={
                                                                            group.selectedEntity ||
                                                                            ''
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) => {
                                                                            const updatedGroups =
                                                                                availableUserGroups.map(
                                                                                    (
                                                                                        g,
                                                                                    ) =>
                                                                                        g.id ===
                                                                                        group.id
                                                                                            ? {
                                                                                                  ...g,
                                                                                                  selectedEntity:
                                                                                                      e
                                                                                                          .target
                                                                                                          .value,
                                                                                              }
                                                                                            : g,
                                                                                );
                                                                            setAvailableUserGroups(
                                                                                updatedGroups,
                                                                            );
                                                                        }}
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
                                                                </td>
                                                                <td>
                                                                    <select
                                                                        className='assignment-dropdown'
                                                                        value={
                                                                            group.selectedService ||
                                                                            ''
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) => {
                                                                            const updatedGroups =
                                                                                availableUserGroups.map(
                                                                                    (
                                                                                        g,
                                                                                    ) =>
                                                                                        g.id ===
                                                                                        group.id
                                                                                            ? {
                                                                                                  ...g,
                                                                                                  selectedService:
                                                                                                      e
                                                                                                          .target
                                                                                                          .value,
                                                                                              }
                                                                                            : g,
                                                                                );
                                                                            setAvailableUserGroups(
                                                                                updatedGroups,
                                                                            );
                                                                        }}
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
                                                                </td>
                                                                <td>
                                                                    <button
                                                                        className='roles-hyperlink-btn'
                                                                        onClick={() => {
                                                                            // Navigate to roles view and set selected group
                                                                            setModernUI(
                                                                                (
                                                                                    prev,
                                                                                ) => ({
                                                                                    ...prev,
                                                                                    currentView:
                                                                                        'roles',
                                                                                    selectedGroupIndex:
                                                                                        availableUserGroups.findIndex(
                                                                                            (
                                                                                                g,
                                                                                            ) =>
                                                                                                g.id ===
                                                                                                group.id,
                                                                                        ),
                                                                                    selectedGroup:
                                                                                        group,
                                                                                }),
                                                                            );
                                                                        }}
                                                                        style={{
                                                                            display:
                                                                                'flex',
                                                                            alignItems:
                                                                                'center',
                                                                            gap: '6px',
                                                                            fontSize:
                                                                                '12px',
                                                                            color: '#3b82f6',
                                                                            background:
                                                                                'none',
                                                                            border: 'none',
                                                                            cursor: 'pointer',
                                                                            padding:
                                                                                '4px 8px',
                                                                            borderRadius:
                                                                                '6px',
                                                                            transition:
                                                                                'all 0.2s ease',
                                                                        }}
                                                                        onMouseOver={(
                                                                            e,
                                                                        ) => {
                                                                            e.currentTarget.style.background =
                                                                                'rgba(59, 130, 246, 0.1)';
                                                                            e.currentTarget.style.color =
                                                                                '#1d4ed8';
                                                                        }}
                                                                        onMouseOut={(
                                                                            e,
                                                                        ) => {
                                                                            e.currentTarget.style.background =
                                                                                'none';
                                                                            e.currentTarget.style.color =
                                                                                '#3b82f6';
                                                                        }}
                                                                    >
                                                                        <svg
                                                                            width='14'
                                                                            height='14'
                                                                            viewBox='0 0 24 24'
                                                                            fill='none'
                                                                        >
                                                                            <path
                                                                                d='M16 21V5C16 4.46957 15.7893 3.96086 15.4142 3.58579C15.0391 3.21071 14.5304 3 14 3H6C5.46957 3 4.96086 3.21071 4.58579 3.58579C4.21071 3.96086 4 4.46957 4 5V21L8 19L12 21L16 19L20 21V5C20 4.46957 19.7893 3.96086 19.4142 3.58579C19.0391 3.21071 18.5304 3 18 3H16'
                                                                                stroke='currentColor'
                                                                                strokeWidth='1.5'
                                                                            />
                                                                            <path
                                                                                d='M8 7H12'
                                                                                stroke='currentColor'
                                                                                strokeWidth='1.5'
                                                                            />
                                                                            <path
                                                                                d='M8 11H12'
                                                                                stroke='currentColor'
                                                                                strokeWidth='1.5'
                                                                            />
                                                                        </svg>
                                                                        {group
                                                                            .roles
                                                                            ?.length ||
                                                                            0}{' '}
                                                                        roles
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ),
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
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
                                    )}

                                    {/* Add New User Group Button (only in management mode) */}
                                    {!assignmentMode && (
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
                                    )}

                                    {/* Simple Assignment Actions for Assignment Mode */}
                                    {assignmentMode && (
                                        <div className='simple-assignment-actions'>
                                            <div className='assignment-info'>
                                                <span>
                                                    Select groups and assign to{' '}
                                                    {currentUser?.firstName}{' '}
                                                    {currentUser?.lastName}
                                                </span>
                                            </div>
                                            <div className='assignment-buttons'>
                                                <button
                                                    className='assign-to-btn'
                                                    disabled={
                                                        bulkSelectedGroups.length ===
                                                        0
                                                    }
                                                    onClick={async () => {
                                                        if (
                                                            currentUser &&
                                                            bulkSelectedGroups.length >
                                                                0
                                                        ) {
                                                            // Filter only groups with selected entity and service
                                                            const validGroups =
                                                                availableUserGroups.filter(
                                                                    (g) =>
                                                                        bulkSelectedGroups.includes(
                                                                            g.id,
                                                                        ) &&
                                                                        g.selectedEntity &&
                                                                        g.selectedService,
                                                                );

                                                            if (
                                                                validGroups.length ===
                                                                0
                                                            ) {
                                                                alert(
                                                                    'Please select entities and services for the selected groups before assignment.',
                                                                );
                                                                return;
                                                            }

                                                            const success =
                                                                await assignUserToGroups(
                                                                    currentUser.id,
                                                                    validGroups.map(
                                                                        (g) =>
                                                                            g.id,
                                                                    ),
                                                                );
                                                            if (success) {
                                                                const updatedItems =
                                                                    items.map(
                                                                        (
                                                                            item,
                                                                        ) =>
                                                                            item.id ===
                                                                            currentUser.id
                                                                                ? {
                                                                                      ...item,
                                                                                      assignedUserGroup:
                                                                                          [
                                                                                              ...(item.assignedUserGroup ||
                                                                                                  []),
                                                                                              ...validGroups,
                                                                                          ],
                                                                                  }
                                                                                : item,
                                                                    );
                                                                setItems(
                                                                    updatedItems,
                                                                );
                                                                setBulkSelectedGroups(
                                                                    [],
                                                                );
                                                                alert(
                                                                    `Successfully assigned ${validGroups.length} groups to ${currentUser.firstName}`,
                                                                );
                                                            }
                                                        }
                                                    }}
                                                >
                                                    <svg
                                                        width='16'
                                                        height='16'
                                                        viewBox='0 0 24 24'
                                                        fill='none'
                                                    >
                                                        <path
                                                            d='M5 13L9 17L19 7'
                                                            stroke='currentColor'
                                                            strokeWidth='2'
                                                            strokeLinecap='round'
                                                            strokeLinejoin='round'
                                                        />
                                                    </svg>
                                                    Assign To User (
                                                    {bulkSelectedGroups.length}{' '}
                                                    selected)
                                                </button>
                                                <button
                                                    className='configure-roles-btn'
                                                    onClick={() => {
                                                        // Navigate to roles view and update breadcrumb
                                                        setModernUI((prev) => ({
                                                            ...prev,
                                                            currentView:
                                                                'roles',
                                                            view: 'roles',
                                                            selectedGroupIndex: 0, // Show first group by default
                                                        }));
                                                    }}
                                                >
                                                    <svg
                                                        width='16'
                                                        height='16'
                                                        viewBox='0 0 24 24'
                                                        fill='none'
                                                    >
                                                        <path
                                                            d='M16 21V5C16 4.46957 15.7893 3.96086 15.4142 3.58579C15.0391 3.21071 14.5304 3 14 3H6C5.46957 3 4.96086 3.21071 4.58579 3.58579C4.21071 3.96086 4 4.46957 4 5V21L8 19L12 21L16 19L20 21V5C20 4.46957 19.7893 3.96086 19.4142 3.58579C19.0391 3.21071 18.5304 3 18 3H16'
                                                            stroke='currentColor'
                                                            strokeWidth='1.5'
                                                        />
                                                        <path
                                                            d='M8 7H12'
                                                            stroke='currentColor'
                                                            strokeWidth='1.5'
                                                        />
                                                        <path
                                                            d='M8 11H12'
                                                            stroke='currentColor'
                                                            strokeWidth='1.5'
                                                        />
                                                    </svg>
                                                    Select Roles & Scope
                                                </button>
                                                <button
                                                    className='close-panel-btn'
                                                    onClick={closeModernUI}
                                                >
                                                    <svg
                                                        width='16'
                                                        height='16'
                                                        viewBox='0 0 24 24'
                                                        fill='none'
                                                    >
                                                        <path
                                                            d='M6 18L18 6M6 6L18 18'
                                                            stroke='currentColor'
                                                            strokeWidth='2'
                                                        />
                                                    </svg>
                                                    Close
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* 🎭 ROLES VIEW */}
                            {modernUI.currentView === 'roles' && (
                                <div className='roles-view'>
                                    <div className='view-header'>
                                        <h2>
                                            <svg
                                                width='20'
                                                height='20'
                                                viewBox='0 0 24 24'
                                                fill='none'
                                                style={{
                                                    marginRight: '8px',
                                                    color: '#3b82f6',
                                                }}
                                            >
                                                <path
                                                    d='M16 21V5C16 4.46957 15.7893 3.96086 15.4142 3.58579C15.0391 3.21071 14.5304 3 14 3H6C5.46957 3 4.96086 3.21071 4.58579 3.58579C4.21071 3.96086 4 4.46957 4 5V21L8 19L12 21L16 19L20 21V5C20 4.46957 19.7893 3.96086 19.4142 3.58579C19.0391 3.21071 18.5304 3 18 3H16'
                                                    stroke='currentColor'
                                                    strokeWidth='1.5'
                                                />
                                                <path
                                                    d='M8 7H12'
                                                    stroke='currentColor'
                                                    strokeWidth='1.5'
                                                />
                                                <path
                                                    d='M8 11H12'
                                                    stroke='currentColor'
                                                    strokeWidth='1.5'
                                                />
                                            </svg>
                                            Roles Management
                                        </h2>
                                        <div className='search-container'>
                                            <input
                                                type='text'
                                                placeholder='Search roles...'
                                                value={
                                                    modernUI.roleSearchQuery ||
                                                    ''
                                                }
                                                onChange={(e) =>
                                                    setModernUI((prev) => ({
                                                        ...prev,
                                                        roleSearchQuery:
                                                            e.target.value,
                                                    }))
                                                }
                                                className='smart-search'
                                            />
                                        </div>
                                    </div>

                                    <div className='roles-table-container'>
                                        <table className='roles-table'>
                                            <thead>
                                                <tr>
                                                    <th>
                                                        <input
                                                            type='checkbox'
                                                            className='bulk-select-checkbox'
                                                            onChange={(e) => {
                                                                if (
                                                                    e.target
                                                                        .checked
                                                                ) {
                                                                    setBulkSelectedGroups(
                                                                        availableRoles?.map(
                                                                            (
                                                                                r,
                                                                            ) =>
                                                                                r.id,
                                                                        ) || [],
                                                                    );
                                                                } else {
                                                                    setBulkSelectedGroups(
                                                                        [],
                                                                    );
                                                                }
                                                            }}
                                                            checked={
                                                                availableRoles?.length >
                                                                    0 &&
                                                                bulkSelectedGroups.length ===
                                                                    availableRoles?.length
                                                            }
                                                        />
                                                    </th>
                                                    <th>Role Name</th>
                                                    <th>Description</th>
                                                    <th>Attributes</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(
                                                    availableRoles || [
                                                        {
                                                            id: 1,
                                                            name: 'Administrator',
                                                            description:
                                                                'Full system access and control',
                                                            attributes: [
                                                                'read',
                                                                'write',
                                                                'delete',
                                                                'admin',
                                                            ],
                                                        },
                                                        {
                                                            id: 2,
                                                            name: 'Editor',
                                                            description:
                                                                'Content creation and editing privileges',
                                                            attributes: [
                                                                'read',
                                                                'write',
                                                            ],
                                                        },
                                                        {
                                                            id: 3,
                                                            name: 'Viewer',
                                                            description:
                                                                'Read-only access to content',
                                                            attributes: [
                                                                'read',
                                                            ],
                                                        },
                                                        {
                                                            id: 4,
                                                            name: 'Moderator',
                                                            description:
                                                                'Content moderation and user management',
                                                            attributes: [
                                                                'read',
                                                                'write',
                                                                'moderate',
                                                            ],
                                                        },
                                                    ]
                                                ).map((role, index) => (
                                                    <tr
                                                        key={role.id}
                                                        className={
                                                            bulkSelectedGroups.includes(
                                                                role.id,
                                                            )
                                                                ? 'selected'
                                                                : ''
                                                        }
                                                    >
                                                        <td>
                                                            <input
                                                                type='checkbox'
                                                                className='bulk-select-checkbox'
                                                                checked={bulkSelectedGroups.includes(
                                                                    role.id,
                                                                )}
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    if (
                                                                        e.target
                                                                            .checked
                                                                    ) {
                                                                        setBulkSelectedGroups(
                                                                            [
                                                                                ...bulkSelectedGroups,
                                                                                role.id,
                                                                            ],
                                                                        );
                                                                    } else {
                                                                        setBulkSelectedGroups(
                                                                            bulkSelectedGroups.filter(
                                                                                (
                                                                                    id,
                                                                                ) =>
                                                                                    id !==
                                                                                    role.id,
                                                                            ),
                                                                        );
                                                                    }
                                                                }}
                                                            />
                                                        </td>
                                                        <td>
                                                            <div
                                                                style={{
                                                                    fontWeight: 600,
                                                                    color: '#1e40af',
                                                                    fontSize:
                                                                        '13px',
                                                                }}
                                                            >
                                                                {role.name}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div
                                                                style={{
                                                                    fontSize:
                                                                        '12px',
                                                                    color: '#64748b',
                                                                }}
                                                            >
                                                                {role.description ||
                                                                    'No description provided'}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <button
                                                                className='attributes-hyperlink-btn'
                                                                onClick={() => {
                                                                    alert(
                                                                        `Navigate to attributes configuration for role: ${role.name}`,
                                                                    );
                                                                }}
                                                                style={{
                                                                    display:
                                                                        'flex',
                                                                    alignItems:
                                                                        'center',
                                                                    gap: '6px',
                                                                    fontSize:
                                                                        '12px',
                                                                    color: '#3b82f6',
                                                                    background:
                                                                        'none',
                                                                    border: 'none',
                                                                    cursor: 'pointer',
                                                                    padding:
                                                                        '4px 8px',
                                                                    borderRadius:
                                                                        '6px',
                                                                    transition:
                                                                        'all 0.2s ease',
                                                                }}
                                                                onMouseOver={(
                                                                    e,
                                                                ) => {
                                                                    e.currentTarget.style.background =
                                                                        'rgba(59, 130, 246, 0.1)';
                                                                    e.currentTarget.style.color =
                                                                        '#1d4ed8';
                                                                }}
                                                                onMouseOut={(
                                                                    e,
                                                                ) => {
                                                                    e.currentTarget.style.background =
                                                                        'none';
                                                                    e.currentTarget.style.color =
                                                                        '#3b82f6';
                                                                }}
                                                            >
                                                                <svg
                                                                    width='14'
                                                                    height='14'
                                                                    viewBox='0 0 24 24'
                                                                    fill='none'
                                                                >
                                                                    <path
                                                                        d='M12 2L2 7L12 12L22 7L12 2Z'
                                                                        stroke='currentColor'
                                                                        strokeWidth='1.5'
                                                                    />
                                                                    <path
                                                                        d='M2 17L12 22L22 17'
                                                                        stroke='currentColor'
                                                                        strokeWidth='1.5'
                                                                    />
                                                                    <path
                                                                        d='M2 12L12 17L22 12'
                                                                        stroke='currentColor'
                                                                        strokeWidth='1.5'
                                                                    />
                                                                </svg>
                                                                {role.attributes
                                                                    ?.length ||
                                                                    0}{' '}
                                                                attributes
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className='simple-assignment-actions'>
                                        <div className='assignment-info'>
                                            <span>
                                                Select roles to assign to user
                                                group
                                            </span>
                                        </div>
                                        <div className='assignment-buttons'>
                                            <button
                                                className='assign-to-btn'
                                                disabled={
                                                    bulkSelectedGroups.length ===
                                                    0
                                                }
                                                onClick={async () => {
                                                    if (
                                                        bulkSelectedGroups.length >
                                                        0
                                                    ) {
                                                        alert(
                                                            `Assign ${bulkSelectedGroups.length} selected roles to user group`,
                                                        );
                                                        setBulkSelectedGroups(
                                                            [],
                                                        );
                                                    }
                                                }}
                                            >
                                                <svg
                                                    width='16'
                                                    height='16'
                                                    viewBox='0 0 24 24'
                                                    fill='none'
                                                >
                                                    <path
                                                        d='M5 13L9 17L19 7'
                                                        stroke='currentColor'
                                                        strokeWidth='2'
                                                        strokeLinecap='round'
                                                        strokeLinejoin='round'
                                                    />
                                                </svg>
                                                Assign Role to User Group (
                                                {bulkSelectedGroups.length}{' '}
                                                selected)
                                            </button>
                                            <button
                                                className='configure-roles-btn'
                                                onClick={() => {
                                                    // Navigate to scope view and update breadcrumb
                                                    setModernUI((prev) => ({
                                                        ...prev,
                                                        currentView: 'scope',
                                                        view: 'scope',
                                                    }));
                                                }}
                                            >
                                                <svg
                                                    width='16'
                                                    height='16'
                                                    viewBox='0 0 24 24'
                                                    fill='none'
                                                >
                                                    <path
                                                        d='M12 2L2 7L12 12L22 7L12 2Z'
                                                        stroke='currentColor'
                                                        strokeWidth='1.5'
                                                    />
                                                    <path
                                                        d='M2 17L12 22L22 17'
                                                        stroke='currentColor'
                                                        strokeWidth='1.5'
                                                    />
                                                    <path
                                                        d='M2 12L12 17L22 12'
                                                        stroke='currentColor'
                                                        strokeWidth='1.5'
                                                    />
                                                </svg>
                                                Configure Attributes
                                            </button>
                                            <button
                                                className='close-panel-btn'
                                                onClick={() => {
                                                    setModernUI((prev) => ({
                                                        ...prev,
                                                        currentView: 'groups',
                                                    }));
                                                }}
                                            >
                                                <svg
                                                    width='16'
                                                    height='16'
                                                    viewBox='0 0 24 24'
                                                    fill='none'
                                                >
                                                    <path
                                                        d='M15 18L9 12L15 6'
                                                        stroke='currentColor'
                                                        strokeWidth='2'
                                                        strokeLinecap='round'
                                                        strokeLinejoin='round'
                                                    />
                                                </svg>
                                                Back to Groups
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ⚙️ SCOPE VIEW - Coming Soon */}
                            {modernUI.currentView === 'scope' && (
                                <div className='scope-view'>
                                    <div className='view-header'>
                                        <h2>
                                            Scope Configuration - Coming Soon
                                        </h2>
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
