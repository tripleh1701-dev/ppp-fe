import React, {useState, useEffect, useRef, useCallback} from 'react';
import {ModernDatePicker} from '../ModernDatePicker';
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
import UserManagementButtons from '../UserManagementButtons';
import SimpleSlidingPanels from '../SimpleSlidingPanels';

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
    // Return empty string to remove all placeholder text
    return '';
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
    setSelectedUserForPanels,
    setSlidingPanelsOpen,
    setCalendarPopup,
    actions = {},
) => {
    const value = item[column.id] || '';

    // Debug: Log actions configuration for all columns (reduced logging)
    if (column.id === 'firstName') {
        console.log(`🔍 Actions config sample:`, actions);
    }

    // Helper function to get the appropriate event handler based on editTrigger
    const getEditEventHandler = (columnId) => {
        const editTrigger = actions.editTrigger || 'doubleClick';
        const handler = (e) => {
            console.log(
                `🖱️ CLICK DETECTED on ${columnId}! EditTrigger: ${editTrigger}`,
            );
            console.log('Event details:', e);
            console.log('Current editing state before:', isEditing);
            setEditing((s) => {
                const newState = {...s, [columnId]: true};
                console.log('Setting editing state to:', newState);
                return newState;
            });
        };

        switch (editTrigger) {
            case 'click':
                if (columnId === 'firstName')
                    console.log(`🔧 Attaching CLICK handler for ${columnId}`);
                return {onClick: handler};
            case 'hover':
                if (columnId === 'firstName')
                    console.log(`🔧 Attaching HOVER handler for ${columnId}`);
                return {onMouseEnter: handler};
            case 'doubleClick':
            default:
                if (columnId === 'firstName')
                    console.log(
                        `🔧 Attaching DOUBLE-CLICK handler for ${columnId}`,
                    );
                return {onDoubleClick: handler};
        }
    };

    switch (column.type) {
        case 'checkbox':
            if (column.id === 'checkbox') {
                return null; // Selection checkbox handled separately
            } else {
                // Data checkbox (like technicalUser)
                return (
                    <input
                        type='checkbox'
                        className='data-checkbox'
                        checked={!!value}
                        onChange={(e) => {
                            onFieldChange(column.id, e.target.checked);
                        }}
                    />
                );
            }

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
                        {...getEditEventHandler(column.id)}
                        onMouseDown={(e) => {
                            console.log(`🖱️ MouseDown on ${column.id}`);
                            e.stopPropagation();
                        }}
                        onPointerDown={(e) => {
                            console.log(`🖱️ PointerDown on ${column.id}`);
                            e.stopPropagation();
                        }}
                        style={{
                            pointerEvents: 'auto',
                            cursor: 'pointer',
                            zIndex: 10,
                            position: 'relative',
                            display: 'block',
                            minHeight: '20px',
                            width: '100%',
                        }}
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
                    {...getEditEventHandler(column.id)}
                    onMouseDown={(e) => {
                        console.log(`🖱️ MouseDown on ${column.id}`);
                        e.stopPropagation();
                    }}
                    onPointerDown={(e) => {
                        console.log(`🖱️ PointerDown on ${column.id}`);
                        e.stopPropagation();
                    }}
                    style={{
                        pointerEvents: 'auto',
                        cursor: 'pointer',
                        zIndex: 10,
                        position: 'relative',
                        display: 'block',
                        minHeight: '20px',
                        width: '100%',
                    }}
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
                    {/* Modern SVG calendar icon and + button for date/datetime fields */}
                    {(column.type === 'date' || column.type === 'datetime') && (
                        <div className='date-controls'>
                            <svg
                                className='calendar-icon-svg'
                                width='20'
                                height='20'
                                viewBox='0 0 32 32'
                                fill='none'
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const rect =
                                        e.currentTarget.getBoundingClientRect();
                                    setCalendarPopup({
                                        isOpen: true,
                                        columnId: column.id,
                                        itemId: item.id,
                                        position: {
                                            left: rect.left,
                                            top: rect.bottom + 8,
                                        },
                                        includeTime: column.type === 'datetime',
                                    });
                                }}
                            >
                                {/* Calendar background with gradient */}
                                <rect
                                    x='4'
                                    y='6'
                                    width='24'
                                    height='22'
                                    rx='3'
                                    ry='3'
                                    fill='url(#calendarGradient)'
                                    stroke='#2563eb'
                                    strokeWidth='1'
                                />

                                {/* Calendar header */}
                                <rect
                                    x='4'
                                    y='6'
                                    width='24'
                                    height='6'
                                    rx='3'
                                    ry='3'
                                    fill='#3b82f6'
                                />

                                {/* Calendar rings */}
                                <rect
                                    x='9'
                                    y='2'
                                    width='2'
                                    height='8'
                                    rx='1'
                                    fill='#6b7280'
                                />
                                <rect
                                    x='21'
                                    y='2'
                                    width='2'
                                    height='8'
                                    rx='1'
                                    fill='#6b7280'
                                />

                                {/* Ring holes */}
                                <circle cx='10' cy='4' r='1.5' fill='white' />
                                <circle cx='22' cy='4' r='1.5' fill='white' />

                                {/* Calendar grid - week days */}
                                <text
                                    x='8'
                                    y='18'
                                    fontSize='3'
                                    fill='#374151'
                                    fontWeight='600'
                                >
                                    S
                                </text>
                                <text
                                    x='11'
                                    y='18'
                                    fontSize='3'
                                    fill='#374151'
                                    fontWeight='600'
                                >
                                    M
                                </text>
                                <text
                                    x='14'
                                    y='18'
                                    fontSize='3'
                                    fill='#374151'
                                    fontWeight='600'
                                >
                                    T
                                </text>
                                <text
                                    x='17'
                                    y='18'
                                    fontSize='3'
                                    fill='#374151'
                                    fontWeight='600'
                                >
                                    W
                                </text>
                                <text
                                    x='20'
                                    y='18'
                                    fontSize='3'
                                    fill='#374151'
                                    fontWeight='600'
                                >
                                    T
                                </text>
                                <text
                                    x='23'
                                    y='18'
                                    fontSize='3'
                                    fill='#374151'
                                    fontWeight='600'
                                >
                                    F
                                </text>
                                <text
                                    x='26'
                                    y='18'
                                    fontSize='3'
                                    fill='#374151'
                                    fontWeight='600'
                                >
                                    S
                                </text>

                                {/* Calendar dates */}
                                <text
                                    x='8'
                                    y='22'
                                    fontSize='2.5'
                                    fill='#6b7280'
                                >
                                    1
                                </text>
                                <text
                                    x='11'
                                    y='22'
                                    fontSize='2.5'
                                    fill='#6b7280'
                                >
                                    2
                                </text>
                                <text
                                    x='14'
                                    y='22'
                                    fontSize='2.5'
                                    fill='#6b7280'
                                >
                                    3
                                </text>
                                <text
                                    x='17'
                                    y='22'
                                    fontSize='2.5'
                                    fill='#6b7280'
                                >
                                    4
                                </text>
                                <text
                                    x='20'
                                    y='22'
                                    fontSize='2.5'
                                    fill='#6b7280'
                                >
                                    5
                                </text>
                                <text
                                    x='23'
                                    y='22'
                                    fontSize='2.5'
                                    fill='#6b7280'
                                >
                                    6
                                </text>
                                <text
                                    x='26'
                                    y='22'
                                    fontSize='2.5'
                                    fill='#6b7280'
                                >
                                    7
                                </text>

                                <text
                                    x='8'
                                    y='25'
                                    fontSize='2.5'
                                    fill='#6b7280'
                                >
                                    8
                                </text>
                                <text
                                    x='11'
                                    y='25'
                                    fontSize='2.5'
                                    fill='#6b7280'
                                >
                                    9
                                </text>
                                <text
                                    x='14'
                                    y='25'
                                    fontSize='2.5'
                                    fill='#6b7280'
                                >
                                    10
                                </text>
                                <text
                                    x='17'
                                    y='25'
                                    fontSize='2.5'
                                    fill='#6b7280'
                                >
                                    11
                                </text>
                                <text
                                    x='20'
                                    y='25'
                                    fontSize='2.5'
                                    fill='#6b7280'
                                >
                                    12
                                </text>
                                <text
                                    x='23'
                                    y='25'
                                    fontSize='2.5'
                                    fill='#6b7280'
                                >
                                    13
                                </text>
                                <text
                                    x='26'
                                    y='25'
                                    fontSize='2.5'
                                    fill='#6b7280'
                                >
                                    14
                                </text>

                                {/* Highlighted today */}
                                <circle
                                    cx='17'
                                    cy='23.5'
                                    r='2'
                                    fill='#ef4444'
                                />
                                <text
                                    x='17'
                                    y='25'
                                    fontSize='2.5'
                                    fill='white'
                                    fontWeight='bold'
                                    textAnchor='middle'
                                >
                                    15
                                </text>

                                {/* Gradient definition */}
                                <defs>
                                    <linearGradient
                                        id='calendarGradient'
                                        x1='0%'
                                        y1='0%'
                                        x2='0%'
                                        y2='100%'
                                    >
                                        <stop offset='0%' stopColor='#f8fafc' />
                                        <stop
                                            offset='100%'
                                            stopColor='#e2e8f0'
                                        />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <button
                                className='date-add-button'
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setEditing((s) => ({
                                        ...s,
                                        [column.id]: true,
                                    }));
                                }}
                                title='Set date'
                            >
                                <svg
                                    width='12'
                                    height='12'
                                    viewBox='0 0 24 24'
                                    fill='none'
                                    stroke='currentColor'
                                    strokeWidth='2'
                                >
                                    <line x1='12' y1='5' x2='12' y2='19' />
                                    <line x1='5' y1='12' x2='19' y2='12' />
                                </svg>
                            </button>
                        </div>
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
                    {...getEditEventHandler(column.id)}
                    onMouseDown={(e) => {
                        console.log(`🖱️ MouseDown on ${column.id}`);
                        e.stopPropagation();
                    }}
                    onPointerDown={(e) => {
                        console.log(`🖱️ PointerDown on ${column.id}`);
                        e.stopPropagation();
                    }}
                    style={{
                        pointerEvents: 'auto',
                        cursor: 'pointer',
                        zIndex: 10,
                        position: 'relative',
                        display: 'block',
                        minHeight: '20px',
                        width: '100%',
                    }}
                >
                    {value || getIntelligentPlaceholder(column)}
                </span>
            );

        case 'password':
            return (
                <div className='password-wrapper'>
                    <div
                        className={`password-key-icon ${
                            // Check if password hash actually exists in database
                            item.hasPasswordHash ||
                            item.passwordSet === true ||
                            (value &&
                                value !== '••••••••' &&
                                value !== 'No password set' &&
                                value.trim() !== '' &&
                                value !== 'Click to set password')
                                ? 'password-set'
                                : ''
                        }`}
                        onClick={(e) => {
                            e.stopPropagation();
                            openPasswordModal(item.id, column.id, e);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                        title={
                            // Check if password hash actually exists in database
                            item.hasPasswordHash ||
                            item.passwordSet === true ||
                            (value &&
                                value !== '••••••••' &&
                                value !== 'No password set' &&
                                value.trim() !== '' &&
                                value !== 'Click to set password')
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
                item.hasPasswordHash || // Preferred: separate boolean field from backend
                item.passwordSet === true || // Alternative: explicit boolean field
                (item.password &&
                    item.password !== '••••••••' &&
                    item.password !== 'No password set' &&
                    item.password.trim() !== '' &&
                    item.password !== 'Click to set password');

            // Button state logic:
            // - grey (default): no groups assigned
            // - orange (pending): has pending assignments but not saved
            // - green (saved): has saved groups (regardless of password)
            const buttonState = hasSavedGroups
                ? 'saved'
                : hasPendingGroups
                ? 'pending'
                : 'default';
            return (
                <div
                    className='usergroup-wrapper'
                    onMouseEnter={(e) => showTooltip(e, item.id, column.id)}
                    onMouseLeave={hideTooltip}
                >
                    <div className='usergroup-display'>
                        <button
                            className={`usergroup-clickable-icon ${buttonState}`}
                            data-debug={`state:${buttonState},groups:${
                                userGroups.length
                            },pending:${
                                item.pendingGroupAssignments?.length || 0
                            },password:${hasPassword}`}
                            onClick={(e) => {
                                console.log('🔥 User group button clicked!', {
                                    itemId: item.id,
                                    columnId: column.id,
                                });
                                e.stopPropagation();
                                hideTooltip();
                                // Open sliding panels directly instead of old UI
                                console.log(
                                    '🎯 Opening sliding panels for user:',
                                    item,
                                );
                                setSelectedUserForPanels(item);
                                setSlidingPanelsOpen(true);
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            onPointerDown={(e) => e.stopPropagation()}
                            title={
                                buttonState === 'saved'
                                    ? `${userGroups.length} user group${
                                          userGroups.length !== 1 ? 's' : ''
                                      } assigned successfully - click to manage`
                                    : buttonState === 'pending'
                                    ? item.pendingGroupAssignments?.length > 0
                                        ? `${
                                              item.pendingGroupAssignments
                                                  .length
                                          } user group${
                                              item.pendingGroupAssignments
                                                  .length !== 1
                                                  ? 's'
                                                  : ''
                                          } pending approval - click to complete`
                                        : 'User groups pending approval'
                                    : 'No user groups assigned - click to assign groups'
                            }
                        >
                            <svg
                                width='20'
                                height='20'
                                viewBox='0 0 24 24'
                                fill='none'
                                xmlns='http://www.w3.org/2000/svg'
                                className={`usergroup-svg-icon ${buttonState}`}
                                style={{
                                    color:
                                        buttonState === 'saved'
                                            ? '#10b981'
                                            : buttonState === 'pending'
                                            ? '#f59e0b'
                                            : '#9ca3af',
                                    transition:
                                        'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                                    filter:
                                        buttonState === 'saved'
                                            ? 'drop-shadow(0 1px 3px rgba(16, 185, 129, 0.3))'
                                            : buttonState === 'pending'
                                            ? 'drop-shadow(0 1px 3px rgba(245, 158, 11, 0.3))'
                                            : 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))',
                                    opacity:
                                        buttonState === 'default' ? 0.7 : 1,
                                }}
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
                        </button>
                    </div>
                </div>
            );

        case 'toggle':
            const toggleConfig = column.toggleConfig || {};
            const isActive = value === (toggleConfig.ActiveValue || 'Active');
            const activeColor = toggleConfig.ActiveColor || '#22c55e';
            const inactiveColor = toggleConfig.InactiveColor || '#ef4444';
            const textColor = toggleConfig.textColor || '#ffffff';

            return (
                <div
                    className={`status-cell-toggle ${
                        isActive ? 'active' : 'inactive'
                    }`}
                    onClick={(e) => {
                        e.stopPropagation();
                        const wasInactive = !isActive;
                        const newValue = isActive
                            ? toggleConfig.InactiveValue || 'Inactive'
                            : toggleConfig.ActiveValue || 'Active';

                        // Trigger celebration effect BEFORE changing the value if going from inactive to active
                        if (wasInactive) {
                            const cellElement = e.currentTarget;
                            // Force remove any existing celebration class
                            cellElement.classList.remove('celebrate');
                            // Use requestAnimationFrame to ensure the class is properly removed before adding
                            requestAnimationFrame(() => {
                                cellElement.classList.add('celebrate');
                                // Remove celebration class after animation
                                setTimeout(() => {
                                    cellElement.classList.remove('celebrate');
                                }, 1200);
                            });
                        }

                        onFieldChange(column.id, newValue);
                    }}
                    onMouseDown={(e) => {
                        console.log(`🖱️ MouseDown on ${column.id}`);
                        e.stopPropagation();
                    }}
                    onPointerDown={(e) => {
                        console.log(`🖱️ PointerDown on ${column.id}`);
                        e.stopPropagation();
                    }}
                    style={{
                        backgroundColor: isActive ? activeColor : inactiveColor,
                        color: textColor,
                    }}
                    title={`Click to ${isActive ? 'deactivate' : 'activate'}`}
                >
                    {isActive
                        ? toggleConfig.ActiveLabel || 'ACTIVE'
                        : toggleConfig.InactiveLabel || 'INACTIVE'}
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
                    {...getEditEventHandler(column.id)}
                    onMouseDown={(e) => {
                        console.log(`🖱️ MouseDown on ${column.id}`);
                        e.stopPropagation();
                    }}
                    onPointerDown={(e) => {
                        console.log(`🖱️ PointerDown on ${column.id}`);
                        e.stopPropagation();
                    }}
                    style={{
                        pointerEvents: 'auto',
                        cursor: 'pointer',
                        zIndex: 10,
                        position: 'relative',
                        display: 'block',
                        minHeight: '20px',
                        width: '100%',
                    }}
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
    setCalendarPopup,
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
                    {...getEditEventHandler(column.id)}
                    onMouseDown={(e) => {
                        console.log(`🖱️ MouseDown on ${column.id}`);
                        e.stopPropagation();
                    }}
                    onPointerDown={(e) => {
                        console.log(`🖱️ PointerDown on ${column.id}`);
                        e.stopPropagation();
                    }}
                    style={{
                        pointerEvents: 'auto',
                        cursor: 'pointer',
                        zIndex: 10,
                        position: 'relative',
                        display: 'block',
                        minHeight: '20px',
                        width: '100%',
                    }}
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
                    {...getEditEventHandler(column.id)}
                    onMouseDown={(e) => {
                        console.log(`🖱️ MouseDown on ${column.id}`);
                        e.stopPropagation();
                    }}
                    onPointerDown={(e) => {
                        console.log(`🖱️ PointerDown on ${column.id}`);
                        e.stopPropagation();
                    }}
                    style={{
                        pointerEvents: 'auto',
                        cursor: 'pointer',
                        zIndex: 10,
                        position: 'relative',
                        display: 'block',
                        minHeight: '20px',
                        width: '100%',
                    }}
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
                    {/* Modern SVG calendar icon and + button for date/datetime fields */}
                    {(column.type === 'date' || column.type === 'datetime') && (
                        <div className='date-controls'>
                            <svg
                                className='calendar-icon-svg'
                                width='20'
                                height='20'
                                viewBox='0 0 32 32'
                                fill='none'
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const rect =
                                        e.currentTarget.getBoundingClientRect();
                                    setCalendarPopup({
                                        isOpen: true,
                                        columnId: column.id,
                                        itemId: item.id,
                                        position: {
                                            left: rect.left,
                                            top: rect.bottom + 8,
                                        },
                                        includeTime: column.type === 'datetime',
                                    });
                                }}
                            >
                                {/* Calendar background with gradient */}
                                <rect
                                    x='4'
                                    y='6'
                                    width='24'
                                    height='22'
                                    rx='3'
                                    ry='3'
                                    fill='url(#calendarGradient)'
                                    stroke='#2563eb'
                                    strokeWidth='1'
                                />

                                {/* Calendar header */}
                                <rect
                                    x='4'
                                    y='6'
                                    width='24'
                                    height='6'
                                    rx='3'
                                    ry='3'
                                    fill='#3b82f6'
                                />

                                {/* Calendar rings */}
                                <rect
                                    x='9'
                                    y='2'
                                    width='2'
                                    height='8'
                                    rx='1'
                                    fill='#6b7280'
                                />
                                <rect
                                    x='21'
                                    y='2'
                                    width='2'
                                    height='8'
                                    rx='1'
                                    fill='#6b7280'
                                />

                                {/* Ring holes */}
                                <circle cx='10' cy='4' r='1.5' fill='white' />
                                <circle cx='22' cy='4' r='1.5' fill='white' />

                                {/* Calendar grid - week days */}
                                <text
                                    x='8'
                                    y='18'
                                    fontSize='3'
                                    fill='#374151'
                                    fontWeight='600'
                                >
                                    S
                                </text>
                                <text
                                    x='11'
                                    y='18'
                                    fontSize='3'
                                    fill='#374151'
                                    fontWeight='600'
                                >
                                    M
                                </text>
                                <text
                                    x='14'
                                    y='18'
                                    fontSize='3'
                                    fill='#374151'
                                    fontWeight='600'
                                >
                                    T
                                </text>
                                <text
                                    x='17'
                                    y='18'
                                    fontSize='3'
                                    fill='#374151'
                                    fontWeight='600'
                                >
                                    W
                                </text>
                                <text
                                    x='20'
                                    y='18'
                                    fontSize='3'
                                    fill='#374151'
                                    fontWeight='600'
                                >
                                    T
                                </text>
                                <text
                                    x='23'
                                    y='18'
                                    fontSize='3'
                                    fill='#374151'
                                    fontWeight='600'
                                >
                                    F
                                </text>
                                <text
                                    x='26'
                                    y='18'
                                    fontSize='3'
                                    fill='#374151'
                                    fontWeight='600'
                                >
                                    S
                                </text>

                                {/* Calendar dates */}
                                <text
                                    x='8'
                                    y='22'
                                    fontSize='2.5'
                                    fill='#6b7280'
                                >
                                    1
                                </text>
                                <text
                                    x='11'
                                    y='22'
                                    fontSize='2.5'
                                    fill='#6b7280'
                                >
                                    2
                                </text>
                                <text
                                    x='14'
                                    y='22'
                                    fontSize='2.5'
                                    fill='#6b7280'
                                >
                                    3
                                </text>
                                <text
                                    x='17'
                                    y='22'
                                    fontSize='2.5'
                                    fill='#6b7280'
                                >
                                    4
                                </text>
                                <text
                                    x='20'
                                    y='22'
                                    fontSize='2.5'
                                    fill='#6b7280'
                                >
                                    5
                                </text>
                                <text
                                    x='23'
                                    y='22'
                                    fontSize='2.5'
                                    fill='#6b7280'
                                >
                                    6
                                </text>
                                <text
                                    x='26'
                                    y='22'
                                    fontSize='2.5'
                                    fill='#6b7280'
                                >
                                    7
                                </text>

                                <text
                                    x='8'
                                    y='25'
                                    fontSize='2.5'
                                    fill='#6b7280'
                                >
                                    8
                                </text>
                                <text
                                    x='11'
                                    y='25'
                                    fontSize='2.5'
                                    fill='#6b7280'
                                >
                                    9
                                </text>
                                <text
                                    x='14'
                                    y='25'
                                    fontSize='2.5'
                                    fill='#6b7280'
                                >
                                    10
                                </text>
                                <text
                                    x='17'
                                    y='25'
                                    fontSize='2.5'
                                    fill='#6b7280'
                                >
                                    11
                                </text>
                                <text
                                    x='20'
                                    y='25'
                                    fontSize='2.5'
                                    fill='#6b7280'
                                >
                                    12
                                </text>
                                <text
                                    x='23'
                                    y='25'
                                    fontSize='2.5'
                                    fill='#6b7280'
                                >
                                    13
                                </text>
                                <text
                                    x='26'
                                    y='25'
                                    fontSize='2.5'
                                    fill='#6b7280'
                                >
                                    14
                                </text>

                                {/* Highlighted today */}
                                <circle
                                    cx='17'
                                    cy='23.5'
                                    r='2'
                                    fill='#ef4444'
                                />
                                <text
                                    x='17'
                                    y='25'
                                    fontSize='2.5'
                                    fill='white'
                                    fontWeight='bold'
                                    textAnchor='middle'
                                >
                                    15
                                </text>

                                {/* Gradient definition */}
                                <defs>
                                    <linearGradient
                                        id='calendarGradient'
                                        x1='0%'
                                        y1='0%'
                                        x2='0%'
                                        y2='100%'
                                    >
                                        <stop offset='0%' stopColor='#f8fafc' />
                                        <stop
                                            offset='100%'
                                            stopColor='#e2e8f0'
                                        />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <button
                                className='date-add-button'
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setEditing((s) => ({
                                        ...s,
                                        [column.id]: true,
                                    }));
                                }}
                                title='Set date'
                            >
                                <svg
                                    width='12'
                                    height='12'
                                    viewBox='0 0 24 24'
                                    fill='none'
                                    stroke='currentColor'
                                    strokeWidth='2'
                                >
                                    <line x1='12' y1='5' x2='12' y2='19' />
                                    <line x1='5' y1='12' x2='19' y2='12' />
                                </svg>
                            </button>
                        </div>
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
                    {...getEditEventHandler(column.id)}
                    onMouseDown={(e) => {
                        console.log(`🖱️ MouseDown on ${column.id}`);
                        e.stopPropagation();
                    }}
                    onPointerDown={(e) => {
                        console.log(`🖱️ PointerDown on ${column.id}`);
                        e.stopPropagation();
                    }}
                    style={{
                        pointerEvents: 'auto',
                        cursor: 'pointer',
                        zIndex: 10,
                        position: 'relative',
                        display: 'block',
                        minHeight: '20px',
                        width: '100%',
                    }}
                >
                    {value || getIntelligentPlaceholder(column)}
                </span>
            );

        case 'password':
            return (
                <div className='password-wrapper'>
                    <div
                        className={`password-key-icon ${
                            // Check if password hash actually exists in database
                            item.hasPasswordHash ||
                            item.passwordSet === true ||
                            (value &&
                                value !== '••••••••' &&
                                value !== 'No password set' &&
                                value.trim() !== '' &&
                                value !== 'Click to set password')
                                ? 'password-set'
                                : ''
                        }`}
                        onClick={(e) => {
                            e.stopPropagation();
                            openPasswordModal(item.id, column.id, e);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                        title={
                            // Check if password hash actually exists in database
                            item.hasPasswordHash ||
                            item.passwordSet === true ||
                            (value &&
                                value !== '••••••••' &&
                                value !== 'No password set' &&
                                value.trim() !== '' &&
                                value !== 'Click to set password')
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
                item.hasPasswordHash || // Preferred: separate boolean field from backend
                item.passwordSet === true || // Alternative: explicit boolean field
                (item.password &&
                    item.password !== '••••••••' &&
                    item.password !== 'No password set' &&
                    item.password.trim() !== '' &&
                    item.password !== 'Click to set password');

            // Button state logic:
            // - grey (default): no groups assigned
            // - orange (pending): has pending assignments but not saved
            // - green (saved): has saved groups (regardless of password)
            const buttonState = hasSavedGroups
                ? 'saved'
                : hasPendingGroups
                ? 'pending'
                : 'default';
            return (
                <div
                    className='usergroup-wrapper'
                    onMouseEnter={(e) => showTooltip(e, item.id, column.id)}
                    onMouseLeave={hideTooltip}
                >
                    <div className='usergroup-display'>
                        <button
                            className={`usergroup-clickable-icon ${buttonState}`}
                            data-debug={`state:${buttonState},groups:${
                                userGroups.length
                            },pending:${
                                item.pendingGroupAssignments?.length || 0
                            },password:${hasPassword}`}
                            onClick={(e) => {
                                console.log('🔥 User group button clicked!', {
                                    itemId: item.id,
                                    columnId: column.id,
                                });
                                e.stopPropagation();
                                hideTooltip();
                                // Open sliding panels directly instead of old UI
                                console.log(
                                    '🎯 Opening sliding panels for user:',
                                    item,
                                );
                                setSelectedUserForPanels(item);
                                setSlidingPanelsOpen(true);
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            onPointerDown={(e) => e.stopPropagation()}
                            title={
                                buttonState === 'saved'
                                    ? `${userGroups.length} user group${
                                          userGroups.length !== 1 ? 's' : ''
                                      } assigned successfully - click to manage`
                                    : buttonState === 'pending'
                                    ? item.pendingGroupAssignments?.length > 0
                                        ? `${
                                              item.pendingGroupAssignments
                                                  .length
                                          } user group${
                                              item.pendingGroupAssignments
                                                  .length !== 1
                                                  ? 's'
                                                  : ''
                                          } pending approval - click to complete`
                                        : 'User groups pending approval'
                                    : 'No user groups assigned - click to assign groups'
                            }
                        >
                            <svg
                                width='20'
                                height='20'
                                viewBox='0 0 24 24'
                                fill='none'
                                xmlns='http://www.w3.org/2000/svg'
                                className={`usergroup-svg-icon ${buttonState}`}
                                style={{
                                    color:
                                        buttonState === 'saved'
                                            ? '#10b981'
                                            : buttonState === 'pending'
                                            ? '#f59e0b'
                                            : '#9ca3af',
                                    transition:
                                        'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                                    filter:
                                        buttonState === 'saved'
                                            ? 'drop-shadow(0 1px 3px rgba(16, 185, 129, 0.3))'
                                            : buttonState === 'pending'
                                            ? 'drop-shadow(0 1px 3px rgba(245, 158, 11, 0.3))'
                                            : 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))',
                                    opacity:
                                        buttonState === 'default' ? 0.7 : 1,
                                }}
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
                    {...getEditEventHandler(column.id)}
                    onMouseDown={(e) => {
                        console.log(`🖱️ MouseDown on ${column.id}`);
                        e.stopPropagation();
                    }}
                    onPointerDown={(e) => {
                        console.log(`🖱️ PointerDown on ${column.id}`);
                        e.stopPropagation();
                    }}
                    style={{
                        pointerEvents: 'auto',
                        cursor: 'pointer',
                        zIndex: 10,
                        position: 'relative',
                        display: 'block',
                        minHeight: '20px',
                        width: '100%',
                    }}
                >
                    {value || getIntelligentPlaceholder(column)}
                </span>
            );
    }
};

function OwnerAvatar({name}) {
    // Function to generate user initials
    const getUserInitials = (fullName) => {
        if (!fullName || typeof fullName !== 'string') return '👤';

        const nameParts = fullName.trim().split(' ');
        if (nameParts.length === 1) {
            return nameParts[0].charAt(0).toUpperCase();
        }

        const firstInitial = nameParts[0]?.charAt(0)?.toUpperCase() || '';
        const lastInitial =
            nameParts[nameParts.length - 1]?.charAt(0)?.toUpperCase() || '';
        return firstInitial + lastInitial;
    };

    const initials = getUserInitials(name);
    const isInitials = initials !== '👤';

    return (
        <div className='owner-avatar'>
            <div
                className={`${
                    isInitials ? 'initials-avatar' : 'unassigned-avatar'
                }`}
            >
                {initials}
            </div>
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
    setCalendarPopup,
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
                        setCalendarPopup,
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
    setSelectedUserForPanels,
    setSlidingPanelsOpen,
    setCalendarPopup,
    actions,
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
        >
            {/* Render columns dynamically based on configuration */}
            {columns.map((column) => {
                if (column.type === 'checkbox' && column.id === 'checkbox') {
                    // This is the selection checkbox
                    return (
                        <div
                            key={column.id}
                            className='task-cell checkbox-cell'
                            {...listeners}
                            style={{cursor: isDragging ? 'grabbing' : 'grab'}}
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
                } else if (column.type === 'checkbox') {
                    // This is a data checkbox (like technicalUser)
                    return (
                        <div
                            key={column.id}
                            className={`task-cell ${column.id}-cell`}
                        >
                            <input
                                type='checkbox'
                                className='data-checkbox'
                                checked={!!item[column.id]}
                                onChange={(e) => {
                                    onFieldChange(column.id, e.target.checked);
                                }}
                            />
                        </div>
                    );
                }

                return (
                    <div
                        key={column.id}
                        className={`task-cell ${column.id}-cell`}
                        onClick={(e) => {
                            console.log(`🎯 CELL CLICKED: ${column.id}`);
                            // If this is a text field and not already editing, trigger edit mode
                            if (
                                (column.type === 'text' || !column.type) &&
                                !editing[column.id]
                            ) {
                                console.log(
                                    `🔄 Forcing edit mode for ${column.id}`,
                                );
                                setEditing((s) => ({...s, [column.id]: true}));
                                e.stopPropagation();
                            }
                        }}
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
                            setSelectedUserForPanels,
                            setSlidingPanelsOpen,
                            setCalendarPopup,
                            actions,
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

const ReusableTableComponent = ({config = null, onGroupAssignment}) => {
    // Use provided config - no fallback to reduce bundle size
    const configToUse = config;

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
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Calendar popup state
    const [calendarPopup, setCalendarPopup] = useState({
        isOpen: false,
        columnId: null,
        itemId: null,
        position: {left: 0, top: 0},
        includeTime: false,
    });

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
    const [slidingPanelsOpen, setSlidingPanelsOpen] = useState(false);
    const [selectedUserForPanels, setSelectedUserForPanels] = useState(null);

    // Set up window callback for opening sliding panels from userGroup + button
    useEffect(() => {
        console.log('Setting up window.openUserGroupPanels callback');
        window.openUserGroupPanels = (user) => {
            console.log('🎯 Opening sliding panels for user:', user);
            setSelectedUserForPanels(user);
            setSlidingPanelsOpen(true);
        };

        // Cleanup on unmount
        return () => {
            console.log('Cleaning up window.openUserGroupPanels callback');
            delete window.openUserGroupPanels;
        };
    }, []);

    // Fetch users from API on component mount
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);
                setError(null);
                console.log('🔄 Fetching users from API...');

                const response = await fetch('http://localhost:4000/api/users');
                if (!response.ok) {
                    throw new Error(
                        `Failed to fetch users: ${response.status} ${response.statusText}`,
                    );
                }

                const userData = await response.json();
                console.log('✅ Users fetched successfully:', userData);

                // Transform API data to match table structure
                const transformedUsers = userData.map((user, index) => ({
                    id: user.id || `user-${index + 1}`,
                    firstName: user.firstName || user.first_name || '',
                    middleName: user.middleName || user.middle_name || '',
                    lastName: user.lastName || user.last_name || '',
                    emailAddress:
                        user.emailAddress ||
                        user.email ||
                        user.email_address ||
                        '',
                    status: user.status || 'Active',
                    startDate: user.startDate || user.start_date || '',
                    endDate: user.endDate || user.end_date || '',
                    password: '••••••••', // Don't show actual passwords
                    technicalUser:
                        user.technicalUser || user.technical_user || false,
                    assignedUserGroups:
                        user.assignedUserGroups || user.user_groups || [],
                }));

                setItems(transformedUsers);
                console.log(
                    '🎯 Transformed users set to state:',
                    transformedUsers,
                );
            } catch (err) {
                console.error('❌ Error fetching users:', err);
                setError(err.message);
                // Set fallback data if API fails
                setItems([]);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

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
    // Assignment mode removed - now using simple button interface
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
                // No fallback data - only database data
                setUserGroupData([]);
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
                            groupIds: groupIds, // This will be stored as integer[] in Systiva.fnd_users.assigned_user_group
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
                            assignedUserGroups: groupsData,
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
            console.log(
                '🚀 openModernUI disabled - using button interface instead',
            );
            // Disabled old UI - now using UserManagementButtons
            return;
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
                columnId === 'assignedUserGroups' || columnId === 'userGroups';
            console.log('🎯 Checking assignment mode:', {
                columnId,
                isUserAssignment,
            });

            if (isUserAssignment) {
                console.log('✅ User assignment - setting current user');
                // Find the current user data
                const user = items.find((item) => item.id === itemId);
                console.log('👤 Found user:', user);
                setCurrentUser(user);
                // Get already assigned groups for this user
                setSelectedUserGroups(user?.assignedUserGroups || []);
                setBulkSelectedGroups([]);
                // Load entities and services for assignment
                fetchEntities('4', '7');
                fetchServices();
            } else {
                console.log('❌ Not user assignment');
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
        console.log('🎯 showTooltip called:', {itemId, columnId});
        const rect = event.currentTarget.getBoundingClientRect();
        const tooltipData = {
            top: rect.top + rect.height / 2,
            left: rect.right + 8,
            visible: true,
            itemId,
            columnId,
        };
        console.log('📍 Setting tooltip position:', tooltipData);
        setTooltipPosition(tooltipData);
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

    // Old event listeners disabled - using new button interface
    useEffect(() => {
        // Disabled old touch and keyboard handlers
        return;
    }, []);

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
                                                  ].map((x) => {
                                                      if (x.id === s.id) {
                                                          const updatedSubitem =
                                                              {
                                                                  ...x,
                                                                  [field]:
                                                                      value,
                                                              };

                                                          // Auto-update dates based on status changes for subitems
                                                          if (
                                                              field === 'status'
                                                          ) {
                                                              // Set end date when changing from Active to Inactive
                                                              if (
                                                                  x.status ===
                                                                      'Active' &&
                                                                  value ===
                                                                      'Inactive'
                                                              ) {
                                                                  const now =
                                                                      new Date();
                                                                  const currentDateTime = `${now.getFullYear()}-${String(
                                                                      now.getMonth() +
                                                                          1,
                                                                  ).padStart(
                                                                      2,
                                                                      '0',
                                                                  )}-${String(
                                                                      now.getDate(),
                                                                  ).padStart(
                                                                      2,
                                                                      '0',
                                                                  )} ${String(
                                                                      now.getHours(),
                                                                  ).padStart(
                                                                      2,
                                                                      '0',
                                                                  )}:${String(
                                                                      now.getMinutes(),
                                                                  ).padStart(
                                                                      2,
                                                                      '0',
                                                                  )}`;
                                                                  updatedSubitem.endDate =
                                                                      currentDateTime;

                                                                  console.log(
                                                                      '🔄 Subitem status changed to Inactive - Auto-setting end date:',
                                                                      currentDateTime,
                                                                  );
                                                              }
                                                              // Clear end date and set start date when changing from Inactive to Active
                                                              else if (
                                                                  x.status ===
                                                                      'Inactive' &&
                                                                  value ===
                                                                      'Active'
                                                              ) {
                                                                  const now =
                                                                      new Date();
                                                                  const currentDateTime = `${now.getFullYear()}-${String(
                                                                      now.getMonth() +
                                                                          1,
                                                                  ).padStart(
                                                                      2,
                                                                      '0',
                                                                  )}-${String(
                                                                      now.getDate(),
                                                                  ).padStart(
                                                                      2,
                                                                      '0',
                                                                  )} ${String(
                                                                      now.getHours(),
                                                                  ).padStart(
                                                                      2,
                                                                      '0',
                                                                  )}:${String(
                                                                      now.getMinutes(),
                                                                  ).padStart(
                                                                      2,
                                                                      '0',
                                                                  )}`;

                                                                  updatedSubitem.endDate =
                                                                      '';
                                                                  updatedSubitem.startDate =
                                                                      currentDateTime;

                                                                  console.log(
                                                                      '🔄 Subitem status changed to Active - Clearing end date and setting start date:',
                                                                      currentDateTime,
                                                                  );
                                                              }
                                                          }

                                                          return updatedSubitem;
                                                      }
                                                      return x;
                                                  }),
                                              }
                                            : it,
                                    ),
                                );
                            }}
                            setCalendarPopup={setCalendarPopup}
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

                                        const newItems = items.map((it) => {
                                            if (it.id === item.id) {
                                                const updatedItem = {
                                                    ...it,
                                                    [field]: value,
                                                };

                                                // Auto-update dates based on status changes
                                                if (field === 'status') {
                                                    // Set end date when changing from Active to Inactive
                                                    if (
                                                        it.status ===
                                                            'Active' &&
                                                        value === 'Inactive'
                                                    ) {
                                                        const now = new Date();
                                                        const currentDateTime = `${now.getFullYear()}-${String(
                                                            now.getMonth() + 1,
                                                        ).padStart(
                                                            2,
                                                            '0',
                                                        )}-${String(
                                                            now.getDate(),
                                                        ).padStart(
                                                            2,
                                                            '0',
                                                        )} ${String(
                                                            now.getHours(),
                                                        ).padStart(
                                                            2,
                                                            '0',
                                                        )}:${String(
                                                            now.getMinutes(),
                                                        ).padStart(2, '0')}`;
                                                        updatedItem.endDate =
                                                            currentDateTime;

                                                        console.log(
                                                            '🔄 Status changed to Inactive - Auto-setting end date:',
                                                            currentDateTime,
                                                        );
                                                    }
                                                    // Clear end date and set start date when changing from Inactive to Active
                                                    else if (
                                                        it.status ===
                                                            'Inactive' &&
                                                        value === 'Active'
                                                    ) {
                                                        const now = new Date();
                                                        const currentDateTime = `${now.getFullYear()}-${String(
                                                            now.getMonth() + 1,
                                                        ).padStart(
                                                            2,
                                                            '0',
                                                        )}-${String(
                                                            now.getDate(),
                                                        ).padStart(
                                                            2,
                                                            '0',
                                                        )} ${String(
                                                            now.getHours(),
                                                        ).padStart(
                                                            2,
                                                            '0',
                                                        )}:${String(
                                                            now.getMinutes(),
                                                        ).padStart(2, '0')}`;

                                                        updatedItem.endDate =
                                                            '';
                                                        updatedItem.startDate =
                                                            currentDateTime;

                                                        console.log(
                                                            '🔄 Status changed to Active - Clearing end date and setting start date:',
                                                            currentDateTime,
                                                        );
                                                    }
                                                }

                                                return updatedItem;
                                            }
                                            return it;
                                        });
                                        updateItems(newItems);
                                    }}
                                    setSelectedUserForPanels={
                                        setSelectedUserForPanels
                                    }
                                    setSlidingPanelsOpen={setSlidingPanelsOpen}
                                    setCalendarPopup={setCalendarPopup}
                                    actions={actions}
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

    // Loading state handled by parent component - removed duplicate loader

    // Show error state
    if (error) {
        return (
            <div className='task-board-container'>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '200px',
                        fontSize: '16px',
                        color: '#dc2626',
                    }}
                >
                    <div style={{textAlign: 'center'}}>
                        <div style={{marginBottom: '10px'}}>❌</div>
                        Error loading users: {error}
                        <br />
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                marginTop: '10px',
                                padding: '8px 16px',
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                            }}
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

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
            {(() => {
                console.log('🔍 Tooltip render check:', {
                    visible: tooltipPosition.visible,
                    columnId: tooltipPosition.columnId,
                    shouldShow:
                        tooltipPosition.visible &&
                        tooltipPosition.columnId === 'assignedUserGroups',
                });
                return (
                    tooltipPosition.visible &&
                    tooltipPosition.columnId === 'assignedUserGroups'
                );
            })() && (
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
                        console.log('🔍 Tooltip current item:', currentItem);
                        const userGroups =
                            currentItem?.[tooltipPosition.columnId] || [];
                        console.log('🔍 User groups data:', userGroups);

                        const groupsArray = Array.isArray(userGroups)
                            ? userGroups
                            : [];
                        console.log('🔍 Groups array:', groupsArray);

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
                                        className='usergroup-remove-btn'
                                        onClick={async (e) => {
                                            e.stopPropagation();

                                            // Use the global remove function if available
                                            if (
                                                window.removeGroupFromUserCallback
                                            ) {
                                                const groupId =
                                                    group.id || group.groupId;
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
                                                            groupId,
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

            {/* 🎯 Clean 3-Button Interface - Hidden per user request */}
            {/* <UserManagementButtons
                            currentUser={currentUser}
                            onAssignGroups={assignUserToGroups}
            /> */}

            {/* SimpleSlidingPanels - Opens when + button is clicked in Assigned User Group column */}
            {slidingPanelsOpen && (
                <SimpleSlidingPanels
                    isOpen={slidingPanelsOpen}
                    onClose={() => setSlidingPanelsOpen(false)}
                    currentUser={selectedUserForPanels}
                    onAssignGroups={(groups) => {
                        console.log('Assigning groups:', groups);
                        // Call parent callback if provided
                        if (onGroupAssignment && selectedUserForPanels) {
                            onGroupAssignment(selectedUserForPanels.id, groups);
                        }
                        setSlidingPanelsOpen(false);
                    }}
                    initialPanel='userGroups'
                />
            )}

            {/* Modern Calendar Popup */}
            {calendarPopup.isOpen && (
                <ModernDatePicker
                    value={(() => {
                        const item = items.find(
                            (i) => i.id === calendarPopup.itemId,
                        );
                        return item ? item[calendarPopup.columnId] : '';
                    })()}
                    includeTime={calendarPopup.includeTime}
                    position={calendarPopup.position}
                    onClose={() =>
                        setCalendarPopup((prev) => ({...prev, isOpen: false}))
                    }
                    onDateChange={(date, time) => {
                        // Update the item with the new date/time
                        const newValue =
                            calendarPopup.includeTime && time
                                ? `${date} ${time}`
                                : date;

                        setItems((prevItems) =>
                            prevItems.map((item) =>
                                item.id === calendarPopup.itemId
                                    ? {
                                          ...item,
                                          [calendarPopup.columnId]: newValue,
                                      }
                                    : item,
                            ),
                        );

                        // Close the popup
                        setCalendarPopup((prev) => ({...prev, isOpen: false}));

                        console.log(
                            `Updated ${calendarPopup.columnId} for item ${calendarPopup.itemId}:`,
                            newValue,
                        );
                    }}
                    onTimeToggle={() => {
                        setCalendarPopup((prev) => ({
                            ...prev,
                            includeTime: !prev.includeTime,
                        }));
                    }}
                />
            )}
        </DndContext>
    );
};

export default ReusableTableComponent;
