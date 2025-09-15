'use client';

import React, {useState, useEffect, useRef, useCallback, useMemo} from 'react';
import {
    DndContext,
    closestCenter,
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
import {
    ChevronRightIcon,
    ChevronDownIcon,
    ArrowsUpDownIcon,
    ArrowUpIcon,
    ArrowDownIcon,
    XMarkIcon,
    CheckIcon,
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
} from '@heroicons/react/24/outline';
import {
    ADVANCED_TABLE_CONFIG,
    DEFAULT_ACTIONS,
} from '@/config/AdvancedTableConfig';

// Types
interface TableColumn {
    id: string;
    title: string;
    type: string;
    width: number;
    resizable: boolean;
    sortable: boolean;
    filterable: boolean;
    editable: boolean;
    order: number;
    pinned?: boolean;
    required?: boolean;
    options?: any[];
    validation?: any;
    [key: string]: any;
}

interface TableRow {
    id: string;
    parentId?: string;
    isExpanded?: boolean;
    level?: number;
    children?: TableRow[];
    [key: string]: any;
}

interface AdvancedTableProps {
    tableName: string;
    columns: TableColumn[];
    data: TableRow[];
    config?: any;
    onDataChange?: (data: TableRow[]) => void;
    onRowAction?: (action: string, row: TableRow) => void;
    onBulkAction?: (action: string, rows: TableRow[]) => void;
    onInlineEdit?: (rowId: string, field: string, value: any) => void;
    onColumnResize?: (columnId: string, width: number) => void;
    onColumnReorder?: (fromId: string, toId: string) => void;
    onSort?: (columnId: string, direction: 'asc' | 'desc' | 'off') => void;
    selectedRows?: string[];
    onSelectedRowsChange?: (selectedRows: string[]) => void;
    isLoading?: boolean;
    className?: string;
}

// Sortable Row Component
const SortableRow: React.FC<{
    row: TableRow;
    index: number;
    columns: TableColumn[];
    isSelected: boolean;
    onSelect: (rowId: string, selected: boolean) => void;
    onEdit: (rowId: string, field: string, value: any) => void;
    onToggleExpand: (rowId: string) => void;
    onRowAction: (action: string, row: TableRow) => void;
    config: any;
}> = ({
    row,
    index,
    columns,
    isSelected,
    onSelect,
    onEdit,
    onToggleExpand,
    onRowAction,
    config,
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({id: row.id});

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const [editingCell, setEditingCell] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<string>('');

    const handleCellDoubleClick = (columnId: string, currentValue: any) => {
        if (!columns.find((col) => col.id === columnId)?.editable) return;
        setEditingCell(columnId);
        setEditValue(currentValue || '');
    };

    const handleCellSave = (columnId: string) => {
        onEdit(row.id, columnId, editValue);
        setEditingCell(null);
        setEditValue('');
    };

    const handleCellCancel = () => {
        setEditingCell(null);
        setEditValue('');
    };

    const renderCell = (column: TableColumn) => {
        const value = row[column.id];
        const isEditing = editingCell === column.id;

        if (isEditing) {
            return (
                <input
                    type='text'
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => handleCellSave(column.id)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCellSave(column.id);
                        if (e.key === 'Escape') handleCellCancel();
                    }}
                    className='w-full px-2 py-1 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500'
                    autoFocus
                />
            );
        }

        if (column.type === 'checkbox') {
            return (
                <input
                    type='checkbox'
                    checked={isSelected}
                    onChange={(e) => onSelect(row.id, e.target.checked)}
                    className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                />
            );
        }

        if (column.type === 'select' && value) {
            return (
                <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        value === 'Active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                    }`}
                >
                    {value}
                </span>
            );
        }

        return (
            <span
                className='text-sm text-gray-900 cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded'
                onDoubleClick={() => handleCellDoubleClick(column.id, value)}
                title='Double-click to edit'
            >
                {value || '—'}
            </span>
        );
    };

    const hasChildren = row.children && row.children.length > 0;
    const level = row.level || 0;
    const indent = level * (config.ui.treeIndentSize || 20);

    return (
        <tr
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`
                transition-all duration-200 hover:bg-indigo-50/40 hover:shadow-[0_2px_12px_-6px_rgba(79,70,229,0.35)]
                relative group
                ${isSelected ? 'bg-blue-50' : ''}
                ${isDragging ? 'z-50' : ''}
            `}
            onMouseEnter={() => {
                // Add visual feedback on hover
            }}
        >
            {/* Blue line indicator */}
            <td className='w-1 p-0'>
                <div
                    className={`w-1 h-full transition-all duration-200 ${
                        isSelected ? 'bg-blue-500' : 'bg-transparent'
                    }`}
                />
            </td>

            {columns.map((column, colIndex) => (
                <td
                    key={column.id}
                    className='px-6 py-4 whitespace-nowrap text-sm'
                    style={{
                        width: column.width,
                        minWidth: column.width,
                        maxWidth: column.width,
                    }}
                >
                    {colIndex === 1 && level > 0 && (
                        <div
                            style={{marginLeft: indent}}
                            className='flex items-center'
                        >
                            {/* Tree connector */}
                            <div className='mr-2 flex items-center'>
                                <div className='w-4 h-0.5 bg-gray-300'></div>
                            </div>
                        </div>
                    )}

                    {colIndex === 1 && hasChildren && (
                        <button
                            onClick={() => onToggleExpand(row.id)}
                            className='mr-2 p-0.5 hover:bg-gray-200 rounded transition-colors'
                        >
                            {row.isExpanded ? (
                                <ChevronDownIcon className='h-4 w-4 text-gray-500' />
                            ) : (
                                <ChevronRightIcon className='h-4 w-4 text-gray-500' />
                            )}
                        </button>
                    )}

                    <div className={colIndex === 1 && level > 0 ? 'ml-6' : ''}>
                        {renderCell(column)}
                    </div>
                </td>
            ))}

            {/* Actions column */}
            <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                <div className='flex items-center justify-end space-x-2'>
                    <button
                        onClick={() => onRowAction('edit', row)}
                        className='text-indigo-600 hover:text-indigo-900 p-1 rounded-md hover:bg-indigo-50 transition-colors'
                        title='Edit'
                    >
                        <PencilSquareIcon className='h-4 w-4' />
                    </button>
                    <button
                        onClick={() => onRowAction('delete', row)}
                        className='text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50 transition-colors'
                        title='Delete'
                    >
                        <TrashIcon className='h-4 w-4' />
                    </button>
                </div>
            </td>
        </tr>
    );
};

// Sort Pill Component
const SortPill: React.FC<{
    column: TableColumn;
    sortState: 'off' | 'asc' | 'desc';
    onSort: (columnId: string, direction: 'asc' | 'desc' | 'off') => void;
}> = ({column, sortState, onSort}) => {
    const [isVisible, setIsVisible] = useState(false);

    const getNextSortState = (): 'asc' | 'desc' | 'off' => {
        switch (sortState) {
            case 'off':
                return 'asc';
            case 'asc':
                return 'desc';
            case 'desc':
                return 'off';
            default:
                return 'asc';
        }
    };

    const handleSort = () => {
        const nextState = getNextSortState();
        onSort(column.id, nextState);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSort(column.id, 'off');
    };

    return (
        <div
            className='relative inline-block'
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {(isVisible || sortState !== 'off') && (
                <div className='absolute top-0 right-0 flex items-center space-x-1 bg-white border border-gray-200 rounded px-2 py-1 shadow-sm z-10'>
                    <button
                        onClick={handleSort}
                        className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                            sortState !== 'off'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        {sortState === 'asc' ? (
                            <ArrowUpIcon className='h-3 w-3' />
                        ) : sortState === 'desc' ? (
                            <ArrowDownIcon className='h-3 w-3' />
                        ) : (
                            <ArrowsUpDownIcon className='h-3 w-3' />
                        )}
                        <span>
                            {sortState === 'off'
                                ? 'Sort'
                                : sortState.toUpperCase()}
                        </span>
                    </button>

                    {sortState !== 'off' && (
                        <button
                            onClick={handleClear}
                            className='p-1 text-gray-400 hover:text-gray-600 transition-colors'
                            title='Clear sort'
                        >
                            <XMarkIcon className='h-3 w-3' />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

// Main AdvancedTable Component
const AdvancedTable: React.FC<AdvancedTableProps> = ({
    tableName,
    columns: initialColumns,
    data: initialData,
    config: userConfig = {},
    onDataChange,
    onRowAction,
    onBulkAction,
    onInlineEdit,
    onColumnResize,
    onColumnReorder,
    onSort,
    selectedRows = [],
    onSelectedRowsChange,
    isLoading = false,
    className = '',
}) => {
    // Merge user config with default config
    const config = useMemo(
        () => ({
            ...ADVANCED_TABLE_CONFIG,
            ...userConfig,
            ui: {
                ...ADVANCED_TABLE_CONFIG.ui,
                ...userConfig.ui,
            },
        }),
        [userConfig],
    );

    // State management
    const [columns, setColumns] = useState(initialColumns);
    const [data, setData] = useState(initialData);
    const [sortStates, setSortStates] = useState<
        Record<string, 'off' | 'asc' | 'desc'>
    >({});
    const [globalSearch, setGlobalSearch] = useState('');
    const [isResizing, setIsResizing] = useState<string | null>(null);

    // Sensors for drag and drop
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor),
    );

    // Update data when props change
    useEffect(() => {
        setData(initialData);
    }, [initialData]);

    // Flatten tree data for rendering
    const flattenedData = useMemo(() => {
        const flatten = (rows: TableRow[], level = 0): TableRow[] => {
            let result: TableRow[] = [];

            for (const row of rows) {
                result.push({...row, level});

                if (row.isExpanded && row.children) {
                    result.push(...flatten(row.children, level + 1));
                }
            }

            return result;
        };

        return flatten(data);
    }, [data]);

    // Filter data based on global search
    const filteredData = useMemo(() => {
        if (!globalSearch.trim()) return flattenedData;

        return flattenedData.filter((row) =>
            Object.values(row).some((value) =>
                String(value)
                    .toLowerCase()
                    .includes(globalSearch.toLowerCase()),
            ),
        );
    }, [flattenedData, globalSearch]);

    // Handle row selection
    const handleRowSelect = useCallback(
        (rowId: string, selected: boolean) => {
            const newSelection = selected
                ? [...selectedRows, rowId]
                : selectedRows.filter((id) => id !== rowId);
            onSelectedRowsChange?.(newSelection);
        },
        [selectedRows, onSelectedRowsChange],
    );

    // Handle select all
    const handleSelectAll = useCallback(
        (selected: boolean) => {
            const newSelection = selected
                ? filteredData.map((row) => row.id)
                : [];
            onSelectedRowsChange?.(newSelection);
        },
        [filteredData, onSelectedRowsChange],
    );

    // Handle expand/collapse
    const handleToggleExpand = useCallback(
        (rowId: string) => {
            const updateData = (rows: TableRow[]): TableRow[] => {
                return rows.map((row) => {
                    if (row.id === rowId) {
                        return {...row, isExpanded: !row.isExpanded};
                    }
                    if (row.children) {
                        return {...row, children: updateData(row.children)};
                    }
                    return row;
                });
            };

            const newData = updateData(data);
            setData(newData);
            onDataChange?.(newData);
        },
        [data, onDataChange],
    );

    // Handle inline edit
    const handleInlineEdit = useCallback(
        (rowId: string, field: string, value: any) => {
            const updateRowData = (rows: TableRow[]): TableRow[] => {
                return rows.map((row) => {
                    if (row.id === rowId) {
                        return {...row, [field]: value};
                    }
                    if (row.children) {
                        return {...row, children: updateRowData(row.children)};
                    }
                    return row;
                });
            };

            const newData = updateRowData(data);
            setData(newData);
            onDataChange?.(newData);
            onInlineEdit?.(rowId, field, value);
        },
        [data, onDataChange, onInlineEdit],
    );

    // Handle sort
    const handleSort = useCallback(
        (columnId: string, direction: 'asc' | 'desc' | 'off') => {
            setSortStates((prev) => ({
                ...prev,
                [columnId]: direction,
            }));
            onSort?.(columnId, direction);
        },
        [onSort],
    );

    // Handle drag end for row reordering
    const handleDragEnd = useCallback(
        (event: any) => {
            const {Active, over} = event;

            if (Active.id !== over?.id) {
                const oldIndex = filteredData.findIndex(
                    (item) => item.id === Active.id,
                );
                const newIndex = filteredData.findIndex(
                    (item) => item.id === over.id,
                );

                const newData = arrayMove(filteredData, oldIndex, newIndex);
                setData(newData);
                onDataChange?.(newData);
            }
        },
        [filteredData, onDataChange],
    );

    // Handle column resize
    const handleColumnResize = useCallback(
        (columnId: string, newWidth: number) => {
            setColumns((prev) =>
                prev.map((col) =>
                    col.id === columnId
                        ? {...col, width: Math.max(50, newWidth)}
                        : col,
                ),
            );
            onColumnResize?.(columnId, newWidth);
        },
        [onColumnResize],
    );

    const allSelected =
        selectedRows.length === filteredData.length && filteredData.length > 0;
    const someSelected =
        selectedRows.length > 0 && selectedRows.length < filteredData.length;

    if (isLoading) {
        return (
            <div className='flex items-center justify-center h-64'>
                <div className='text-gray-500'>Loading...</div>
            </div>
        );
    }

    return (
        <div
            className={`bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full ${className}`}
        >
            {/* Header */}
            <div className='px-6 py-4 border-b border-gray-200 flex-shrink-0'>
                <div className='flex items-center justify-between'>
                    <h3 className='text-lg font-semibold text-gray-900'>
                        {tableName}
                    </h3>

                    <div className='flex items-center space-x-4'>
                        {/* Global Search */}
                        <div className='relative'>
                            <MagnifyingGlassIcon className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                            <input
                                type='text'
                                placeholder='Search...'
                                value={globalSearch}
                                onChange={(e) =>
                                    setGlobalSearch(e.target.value)
                                }
                                className='pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                            />
                        </div>

                        {/* Add Button */}
                        <button
                            onClick={() =>
                                onRowAction?.('create', {} as TableRow)
                            }
                            className='inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                        >
                            <PlusIcon className='h-4 w-4 mr-2' />
                            Add New
                        </button>
                    </div>
                </div>
            </div>

            {/* Table - Scrollable Container */}
            <div className='flex-1 overflow-auto'>
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <table className='min-w-full divide-y divide-gray-200'>
                        <thead className='bg-gray-50'>
                            <tr>
                                {/* Blue line indicator column */}
                                <th className='w-1 p-0'></th>

                                {columns.map((column) => (
                                    <th
                                        key={column.id}
                                        className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative group'
                                        style={{
                                            width: column.width,
                                            minWidth: column.width,
                                            maxWidth: column.width,
                                        }}
                                    >
                                        <div className='flex items-center justify-between'>
                                            <span>{column.title}</span>

                                            {column.sortable && (
                                                <SortPill
                                                    column={column}
                                                    sortState={
                                                        sortStates[column.id] ||
                                                        'off'
                                                    }
                                                    onSort={handleSort}
                                                />
                                            )}
                                        </div>

                                        {/* Resize handle */}
                                        {column.resizable && (
                                            <div
                                                className='absolute right-0 top-0 w-1 h-full cursor-col-resize bg-transparent hover:bg-blue-300 transition-colors'
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    setIsResizing(column.id);

                                                    const startX = e.clientX;
                                                    const startWidth =
                                                        column.width;

                                                    const handleMouseMove = (
                                                        e: MouseEvent,
                                                    ) => {
                                                        const diff =
                                                            e.clientX - startX;
                                                        const newWidth =
                                                            startWidth + diff;
                                                        handleColumnResize(
                                                            column.id,
                                                            newWidth,
                                                        );
                                                    };

                                                    const handleMouseUp =
                                                        () => {
                                                            setIsResizing(null);
                                                            document.removeEventListener(
                                                                'mousemove',
                                                                handleMouseMove,
                                                            );
                                                            document.removeEventListener(
                                                                'mouseup',
                                                                handleMouseUp,
                                                            );
                                                        };

                                                    document.addEventListener(
                                                        'mousemove',
                                                        handleMouseMove,
                                                    );
                                                    document.addEventListener(
                                                        'mouseup',
                                                        handleMouseUp,
                                                    );
                                                }}
                                            />
                                        )}
                                    </th>
                                ))}

                                {/* Actions column */}
                                <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody className='bg-white divide-y divide-gray-200'>
                            <SortableContext
                                items={filteredData.map((row) => row.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {filteredData.map((row, index) => (
                                    <SortableRow
                                        key={row.id}
                                        row={row}
                                        index={index}
                                        columns={columns}
                                        isSelected={selectedRows.includes(
                                            row.id,
                                        )}
                                        onSelect={handleRowSelect}
                                        onEdit={handleInlineEdit}
                                        onToggleExpand={handleToggleExpand}
                                        onRowAction={onRowAction || (() => {})}
                                        config={config}
                                    />
                                ))}
                            </SortableContext>
                        </tbody>
                    </table>
                </DndContext>
            </div>

            {/* Footer */}
            {selectedRows.length > 0 && (
                <div className='px-6 py-3 bg-gray-50 border-t border-gray-200 flex-shrink-0'>
                    <div className='flex items-center justify-between'>
                        <span className='text-sm text-gray-700'>
                            {selectedRows.length} item
                            {selectedRows.length === 1 ? '' : 's'} selected
                        </span>

                        <div className='flex space-x-2'>
                            <button
                                onClick={() =>
                                    onBulkAction?.(
                                        'delete',
                                        filteredData.filter((row) =>
                                            selectedRows.includes(row.id),
                                        ),
                                    )
                                }
                                className='inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
                            >
                                <TrashIcon className='h-4 w-4 mr-1' />
                                Delete Selected
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdvancedTable;
