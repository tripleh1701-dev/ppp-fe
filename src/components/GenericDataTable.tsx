'use client';

import React, {useState, useMemo, useRef, useEffect} from 'react';
import {motion, Reorder} from 'framer-motion';
import {
    Search,
    Filter,
    SortAsc,
    SortDesc,
    Plus,
    Trash2,
    MoreVertical,
    Eye,
    EyeOff,
    X,
    ChevronRight,
    Building2,
    Package,
    Globe,
} from 'lucide-react';

// Generic column definition
export interface TableColumn<T = any> {
    key: keyof T | string;
    label: string;
    width?: string;
    minWidth?: string;
    sortable?: boolean;
    filterable?: boolean;
    searchable?: boolean;
    icon?: React.ReactNode;
    renderer?: (value: any, row: T, index: number) => React.ReactNode;
    headerRenderer?: () => React.ReactNode;
    className?: string;
    align?: 'left' | 'center' | 'right';
}

// Generic table props
export interface GenericDataTableProps<T = any> {
    data: T[];
    columns: TableColumn<T>[];
    onEdit?: (row: T) => void;
    onDelete?: (id: string) => void;
    onAdd?: () => void;
    onRowUpdate?: (id: string, field: string, value: any) => void;

    // Table features
    title?: string;
    searchable?: boolean;
    sortable?: boolean;
    filterable?: boolean;
    paginated?: boolean;
    pageSize?: number;

    // Row features
    rowKey?: keyof T | ((row: T) => string);
    selectable?: boolean;
    expandable?: boolean;
    expandedContent?: (row: T) => React.ReactNode;

    // Styling
    className?: string;
    rowClassName?: (row: T, index: number) => string;
    highlightQuery?: string;

    // Actions
    showActions?: boolean;
    customActions?: Array<{
        icon: React.ReactNode;
        label: string;
        onClick: (row: T) => void;
        show?: (row: T) => boolean;
    }>;

    // Additional features
    groupBy?: keyof T;
    hideColumns?: string[];
    pinnedColumns?: string[];
    resizableColumns?: boolean;
    virtualScrolling?: boolean;
}

// Editable cell component
const EditableCell = <T,>({
    value,
    onSave,
    placeholder = '',
    className = '',
    multiline = false,
    type = 'text',
}: {
    value: any;
    onSave: (value: any) => void;
    placeholder?: string;
    className?: string;
    multiline?: boolean;
    type?: 'text' | 'number' | 'email' | 'date';
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value || '');
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

    useEffect(() => {
        setEditValue(value || '');
    }, [value]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            if (inputRef.current instanceof HTMLInputElement) {
                inputRef.current.select();
            }
        }
    }, [isEditing]);

    const handleSave = () => {
        setIsEditing(false);
        setIsFocused(false);
        if (editValue !== value) {
            onSave(editValue);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setIsFocused(false);
        setEditValue(value || '');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !multiline) {
            handleSave();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    };

    if (isEditing) {
        const InputComponent = multiline ? 'textarea' : 'input';
        return (
            <InputComponent
                ref={inputRef as any}
                type={multiline ? undefined : type}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className={`w-full px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${className}`}
                placeholder={placeholder}
                rows={multiline ? 3 : undefined}
            />
        );
    }

    return (
        <div
            className={`cursor-pointer p-2 rounded min-h-[2rem] flex items-center hover:bg-gray-50 transition-colors ${
                isFocused ? 'ring-1 ring-blue-500' : ''
            } ${className}`}
            onClick={() => setIsEditing(true)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            tabIndex={0}
        >
            <span
                className={`text-sm ${
                    !value && placeholder ? 'text-gray-400' : 'text-gray-900'
                }`}
            >
                {value || placeholder}
            </span>
        </div>
    );
};

// Search component
const TableSearch = ({
    value,
    onChange,
    placeholder = 'Search...',
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}) => (
    <div className='relative'>
        <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
        <input
            type='text'
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className='pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm'
        />
        {value && (
            <button
                onClick={() => onChange('')}
                className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
            >
                <X className='h-4 w-4' />
            </button>
        )}
    </div>
);

// Filter component
const TableFilter = <T,>({
    columns,
    filters,
    onFilterChange,
}: {
    columns: TableColumn<T>[];
    filters: Record<string, any>;
    onFilterChange: (key: string, value: any) => void;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const filterableColumns = columns.filter((col) => col.filterable);

    if (filterableColumns.length === 0) return null;

    return (
        <div className='relative'>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className='flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50'
            >
                <Filter className='h-4 w-4' />
                <span className='text-sm'>Filter</span>
                {Object.keys(filters).length > 0 && (
                    <span className='bg-blue-500 text-white text-xs rounded-full px-2 py-0.5'>
                        {Object.keys(filters).length}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className='absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4'>
                    <div className='space-y-3'>
                        {filterableColumns.map((column) => (
                            <div key={String(column.key)}>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>
                                    {column.label}
                                </label>
                                <input
                                    type='text'
                                    value={filters[String(column.key)] || ''}
                                    onChange={(e) =>
                                        onFilterChange(
                                            String(column.key),
                                            e.target.value,
                                        )
                                    }
                                    className='w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-sm'
                                    placeholder={`Filter by ${column.label.toLowerCase()}`}
                                />
                            </div>
                        ))}
                        {Object.keys(filters).length > 0 && (
                            <button
                                onClick={() => {
                                    Object.keys(filters).forEach((key) =>
                                        onFilterChange(key, ''),
                                    );
                                    setIsOpen(false);
                                }}
                                className='w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-800'
                            >
                                Clear all filters
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// Main GenericDataTable component
export default function GenericDataTable<T = any>({
    data,
    columns,
    onEdit,
    onDelete,
    onAdd,
    onRowUpdate,
    title,
    searchable = true,
    sortable = true,
    filterable = true,
    paginated = true,
    pageSize = 10,
    rowKey = 'id' as keyof T,
    selectable = false,
    expandable = false,
    expandedContent,
    className = '',
    rowClassName,
    highlightQuery,
    showActions = true,
    customActions = [],
    groupBy,
    hideColumns = [],
    pinnedColumns = [],
}: GenericDataTableProps<T>) {
    // State management
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState<{
        key: string;
        direction: 'asc' | 'desc';
    } | null>(null);
    const [filters, setFilters] = useState<Record<string, any>>({});
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(
        new Set(hideColumns),
    );

    // Get row ID
    const getRowId = (row: T): string => {
        if (typeof rowKey === 'function') {
            return rowKey(row);
        }
        return String((row as any)[rowKey] || Math.random());
    };

    // Filter and search data
    const filteredData = useMemo(() => {
        let result = [...data];

        // Apply search
        if (searchQuery) {
            result = result.filter((row) => {
                return columns.some((column) => {
                    if (!column.searchable) return false;
                    const value = (row as any)[column.key];
                    return String(value || '')
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase());
                });
            });
        }

        // Apply filters
        Object.entries(filters).forEach(([key, value]) => {
            if (value) {
                result = result.filter((row) => {
                    const rowValue = (row as any)[key];
                    return String(rowValue || '')
                        .toLowerCase()
                        .includes(value.toLowerCase());
                });
            }
        });

        return result;
    }, [data, searchQuery, filters, columns]);

    // Sort data
    const sortedData = useMemo(() => {
        if (!sortConfig) return filteredData;

        return [...filteredData].sort((a, b) => {
            const aValue = (a as any)[sortConfig.key];
            const bValue = (b as any)[sortConfig.key];

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredData, sortConfig]);

    // Paginate data
    const paginatedData = useMemo(() => {
        if (!paginated) return sortedData;
        const start = (currentPage - 1) * pageSize;
        return sortedData.slice(start, start + pageSize);
    }, [sortedData, currentPage, pageSize, paginated]);

    // Visible columns
    const visibleColumns = useMemo(() => {
        return columns.filter((col) => !hiddenColumns.has(String(col.key)));
    }, [columns, hiddenColumns]);

    // Handle sorting
    const handleSort = (key: string) => {
        if (!sortable) return;

        setSortConfig((prev) => {
            if (prev?.key === key) {
                return prev.direction === 'asc'
                    ? {key, direction: 'desc'}
                    : null;
            }
            return {key, direction: 'asc'};
        });
    };

    // Handle row expansion
    const toggleRowExpansion = (rowId: string) => {
        if (!expandable) return;

        setExpandedRows((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(rowId)) {
                newSet.delete(rowId);
            } else {
                newSet.add(rowId);
            }
            return newSet;
        });
    };

    // Handle cell update
    const handleCellUpdate = (rowId: string, field: string, value: any) => {
        if (onRowUpdate) {
            onRowUpdate(rowId, field, value);
        }
    };

    // Calculate grid template
    const gridTemplate = useMemo(() => {
        const colWidths = visibleColumns.map((col) => col.width || '1fr');
        if (expandable) colWidths.unshift('40px');
        if (showActions) colWidths.push('80px');
        return colWidths.join(' ');
    }, [visibleColumns, expandable, showActions]);

    return (
        <div
            className={`bg-white rounded-lg border border-gray-200 ${className}`}
        >
            {/* Header */}
            {(title || searchable || filterable || onAdd) && (
                <div className='px-6 py-4 border-b border-gray-200'>
                    <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-4'>
                            {title && (
                                <h2 className='text-lg font-semibold text-gray-900'>
                                    {title}
                                </h2>
                            )}
                            {searchable && (
                                <TableSearch
                                    value={searchQuery}
                                    onChange={setSearchQuery}
                                    placeholder='Search table...'
                                />
                            )}
                            {filterable && (
                                <TableFilter
                                    columns={columns}
                                    filters={filters}
                                    onFilterChange={(key, value) =>
                                        setFilters((prev) => ({
                                            ...prev,
                                            [key]: value,
                                        }))
                                    }
                                />
                            )}
                        </div>

                        <div className='flex items-center gap-2'>
                            {onAdd && (
                                <button
                                    onClick={onAdd}
                                    className='flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                                >
                                    <Plus className='h-4 w-4' />
                                    Add New
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className='overflow-x-auto'>
                <div className='min-w-full'>
                    {/* Header */}
                    <div
                        className='grid gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-700'
                        style={{gridTemplateColumns: gridTemplate}}
                    >
                        {expandable && <div></div>}
                        {visibleColumns.map((column) => (
                            <div
                                key={String(column.key)}
                                className={`flex items-center gap-2 ${
                                    column.align === 'center'
                                        ? 'justify-center'
                                        : column.align === 'right'
                                        ? 'justify-end'
                                        : 'justify-start'
                                }`}
                            >
                                {column.icon && (
                                    <span className='text-blue-600'>
                                        {column.icon}
                                    </span>
                                )}
                                {column.headerRenderer ? (
                                    column.headerRenderer()
                                ) : (
                                    <button
                                        onClick={() =>
                                            column.sortable &&
                                            handleSort(String(column.key))
                                        }
                                        className={`flex items-center gap-1 ${
                                            column.sortable
                                                ? 'hover:text-gray-900 cursor-pointer'
                                                : ''
                                        }`}
                                    >
                                        <span>{column.label}</span>
                                        {column.sortable &&
                                            sortConfig?.key ===
                                                String(column.key) &&
                                            (sortConfig.direction === 'asc' ? (
                                                <SortAsc className='h-4 w-4' />
                                            ) : (
                                                <SortDesc className='h-4 w-4' />
                                            ))}
                                    </button>
                                )}
                            </div>
                        ))}
                        {showActions && (
                            <div className='text-center'>Actions</div>
                        )}
                    </div>

                    {/* Body */}
                    <div className='divide-y divide-gray-200'>
                        {paginatedData.map((row, index) => {
                            const rowId = getRowId(row);
                            const isExpanded = expandedRows.has(rowId);
                            const isSelected = selectedRows.has(rowId);

                            return (
                                <div key={rowId}>
                                    <div
                                        className={`grid gap-4 px-6 py-4 hover:bg-gray-50 transition-colors ${
                                            isSelected ? 'bg-blue-50' : ''
                                        } ${
                                            rowClassName
                                                ? rowClassName(row, index)
                                                : ''
                                        }`}
                                        style={{
                                            gridTemplateColumns: gridTemplate,
                                        }}
                                    >
                                        {expandable && (
                                            <button
                                                onClick={() =>
                                                    toggleRowExpansion(rowId)
                                                }
                                                className='flex items-center justify-center text-gray-400 hover:text-gray-600'
                                            >
                                                <ChevronRight
                                                    className={`h-4 w-4 transition-transform ${
                                                        isExpanded
                                                            ? 'rotate-90'
                                                            : ''
                                                    }`}
                                                />
                                            </button>
                                        )}

                                        {visibleColumns.map((column) => {
                                            const value = (row as any)[
                                                column.key
                                            ];

                                            return (
                                                <div
                                                    key={String(column.key)}
                                                    className={`${
                                                        column.className || ''
                                                    } ${
                                                        column.align ===
                                                        'center'
                                                            ? 'text-center'
                                                            : column.align ===
                                                              'right'
                                                            ? 'text-right'
                                                            : 'text-left'
                                                    }`}
                                                >
                                                    {column.renderer ? (
                                                        column.renderer(
                                                            value,
                                                            row,
                                                            index,
                                                        )
                                                    ) : onRowUpdate ? (
                                                        <EditableCell
                                                            value={value}
                                                            onSave={(
                                                                newValue,
                                                            ) =>
                                                                handleCellUpdate(
                                                                    rowId,
                                                                    String(
                                                                        column.key,
                                                                    ),
                                                                    newValue,
                                                                )
                                                            }
                                                            placeholder={`Enter ${column.label.toLowerCase()}`}
                                                        />
                                                    ) : (
                                                        <div className='p-2 text-sm text-gray-900'>
                                                            {value}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}

                                        {showActions && (
                                            <div className='flex items-center justify-center gap-1'>
                                                {customActions.map(
                                                    (action, actionIndex) =>
                                                        (!action.show ||
                                                            action.show(
                                                                row,
                                                            )) && (
                                                            <button
                                                                key={
                                                                    actionIndex
                                                                }
                                                                onClick={() =>
                                                                    action.onClick(
                                                                        row,
                                                                    )
                                                                }
                                                                className='p-1 text-gray-400 hover:text-gray-600 rounded'
                                                                title={
                                                                    action.label
                                                                }
                                                            >
                                                                {action.icon}
                                                            </button>
                                                        ),
                                                )}
                                                {onEdit && (
                                                    <button
                                                        onClick={() =>
                                                            onEdit(row)
                                                        }
                                                        className='p-1 text-gray-400 hover:text-blue-600 rounded'
                                                        title='Edit'
                                                    >
                                                        <MoreVertical className='h-4 w-4' />
                                                    </button>
                                                )}
                                                {onDelete && (
                                                    <button
                                                        onClick={() =>
                                                            onDelete(rowId)
                                                        }
                                                        className='p-1 text-gray-400 hover:text-red-600 rounded'
                                                        title='Delete'
                                                    >
                                                        <Trash2 className='h-4 w-4' />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Expanded content */}
                                    {expandable &&
                                        isExpanded &&
                                        expandedContent && (
                                            <div className='px-6 py-4 bg-gray-50 border-t border-gray-200'>
                                                {expandedContent(row)}
                                            </div>
                                        )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Empty state */}
                    {paginatedData.length === 0 && (
                        <div className='px-6 py-12 text-center text-gray-500'>
                            <p>No data available</p>
                            {searchQuery && (
                                <p className='mt-1 text-sm'>
                                    Try adjusting your search or filters
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Pagination */}
            {paginated && sortedData.length > pageSize && (
                <div className='px-6 py-4 border-t border-gray-200 flex items-center justify-between'>
                    <div className='text-sm text-gray-700'>
                        Showing {(currentPage - 1) * pageSize + 1} to{' '}
                        {Math.min(currentPage * pageSize, sortedData.length)} of{' '}
                        {sortedData.length} results
                    </div>
                    <div className='flex items-center gap-2'>
                        <button
                            onClick={() =>
                                setCurrentPage((prev) => Math.max(1, prev - 1))
                            }
                            disabled={currentPage === 1}
                            className='px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
                        >
                            Previous
                        </button>
                        <span className='px-3 py-1 text-sm'>
                            Page {currentPage} of{' '}
                            {Math.ceil(sortedData.length / pageSize)}
                        </span>
                        <button
                            onClick={() =>
                                setCurrentPage((prev) =>
                                    Math.min(
                                        Math.ceil(sortedData.length / pageSize),
                                        prev + 1,
                                    ),
                                )
                            }
                            disabled={
                                currentPage >=
                                Math.ceil(sortedData.length / pageSize)
                            }
                            className='px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Interfaces are already exported above
