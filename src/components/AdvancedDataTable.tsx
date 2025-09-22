'use client';

import React, {useState, useMemo, useRef, useEffect, useCallback} from 'react';
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
    MapPin,
    Home,
    User,
    Mail,
    Phone,
    Calendar,
    FileText,
    Users,
    Bell,
    Clock,
    Settings,
    PlusIcon,
    ChevronDown,
} from 'lucide-react';
import {api} from '@/utils/api';

// Dropdown types
type CatalogType = 'enterprise' | 'product' | 'service' | 'template';

// AsyncChipSelect component (copied from AccountsTable)
function AsyncChipSelect({
    type,
    value,
    onChange,
    placeholder,
    compact,
    multiSelect = false,
}: {
    type: CatalogType;
    value?: string | string[];
    onChange: (next?: string | string[]) => void;
    placeholder?: string;
    compact?: boolean;
    multiSelect?: boolean;
}) {
    const [open, setOpen] = React.useState(false);
    const [current, setCurrent] = React.useState<string | string[]>(
        multiSelect
            ? Array.isArray(value)
                ? value
                : value
                ? [value]
                : []
            : (value as string),
    );
    const [query, setQuery] = React.useState('');
    const [options, setOptions] = React.useState<{id: string; name: string}[]>(
        [],
    );
    const [loading, setLoading] = React.useState(false);
    const [adding, setAdding] = React.useState('');
    const [showAdder, setShowAdder] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const [dropdownPos, setDropdownPos] = React.useState<{
        top: number;
        left: number;
        width: number;
    } | null>(null);

    const loadOptions = React.useCallback(async () => {
        setLoading(true);
        try {
            if (type === 'product') {
                const data = await api.get<Array<{id: string; name: string}>>(
                    `/api/products${
                        query ? `?search=${encodeURIComponent(query)}` : ''
                    }`,
                );
                setOptions(data || []);
            } else if (type === 'service') {
                const data = await api.get<Array<{id: string; name: string}>>(
                    `/api/services${
                        query ? `?search=${encodeURIComponent(query)}` : ''
                    }`,
                );
                setOptions(data || []);
            } else if (type === 'template') {
                const data = await api.get<Array<{id: string; name: string}>>(
                    `/api/products${
                        query ? `?search=${encodeURIComponent(query)}` : ''
                    }`,
                );
                setOptions(data || []);
            } else {
                const ents = await api.get<Array<{id: string; name: string}>>(
                    '/api/enterprises',
                );
                const filtered = (ents || []).filter((e) =>
                    query
                        ? e.name.toLowerCase().includes(query.toLowerCase())
                        : true,
                );
                setOptions(filtered);
            }
        } catch (_e) {
            setOptions([]);
        } finally {
            setLoading(false);
        }
    }, [type, query]);

    React.useEffect(() => {
        if (!open) return;
        loadOptions();
    }, [open, loadOptions]);

    React.useEffect(() => {
        setCurrent(
            multiSelect
                ? Array.isArray(value)
                    ? value
                    : value
                    ? [value]
                    : []
                : (value as string),
        );
    }, [value, multiSelect]);

    React.useEffect(() => {
        if (!open) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
                setShowAdder(false);
                setAdding('');
                setQuery('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    const handleSelect = (option: {id: string; name: string}) => {
        if (multiSelect) {
            const currentArray = Array.isArray(current) ? current : [];
            if (currentArray.includes(option.name)) return; // Already selected
            const newSelection = [...currentArray, option.name];
            setCurrent(newSelection);
            onChange(newSelection);
        } else {
            setCurrent(option.name);
            onChange(option.name);
            setOpen(false);
        }
        setQuery('');
    };

    const handleRemove = (itemToRemove?: string) => {
        if (multiSelect && itemToRemove) {
            const currentArray = Array.isArray(current) ? current : [];
            const newSelection = currentArray.filter(
                (item) => item !== itemToRemove,
            );
            setCurrent(newSelection);
            onChange(newSelection.length > 0 ? newSelection : []);
        } else {
            setCurrent(multiSelect ? [] : '');
            onChange(multiSelect ? [] : '');
        }
    };

    const handleAdd = async () => {
        if (!adding.trim()) return;
        try {
            let endpoint = '';
            if (type === 'product') endpoint = '/api/products';
            else if (type === 'service') endpoint = '/api/services';
            else if (type === 'enterprise') endpoint = '/api/enterprises';

            await api.post(endpoint, {name: adding.trim()});

            if (multiSelect) {
                const currentArray = Array.isArray(current) ? current : [];
                const newSelection = [...currentArray, adding.trim()];
                setCurrent(newSelection);
                onChange(newSelection);
            } else {
                setCurrent(adding.trim());
                onChange(adding.trim());
                setOpen(false);
            }

            setAdding('');
            setShowAdder(false);
            loadOptions(); // Refresh options
        } catch (error) {
            console.error('Failed to create new item:', error);
        }
    };

    // Color schemes for different types
    const getChipColor = (type: CatalogType) => {
        switch (type) {
            case 'enterprise':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'product':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'service':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const selectedOption = options.find((opt) => opt.name === current);

    return (
        <div ref={containerRef} className='relative w-full'>
            {(
                multiSelect
                    ? Array.isArray(current) && current.length > 0
                    : current
            ) ? (
                <div className='flex items-start gap-1 p-1 flex-wrap min-h-[2rem]'>
                    {multiSelect ? (
                        (current as string[]).map((item, index) => (
                            <div
                                key={index}
                                className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border ${getChipColor(
                                    type,
                                )} group relative`}
                                title={item} // Tooltip for full name
                            >
                                <span className='truncate max-w-[80px]'>
                                    {item.length > 12
                                        ? `${item.substring(0, 12)}...`
                                        : item}
                                </span>
                                {/* Tooltip for full name on hover */}
                                {item.length > 12 && (
                                    <div className='absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50'>
                                        {item}
                                    </div>
                                )}
                                <button
                                    onClick={() => handleRemove(item)}
                                    className='hover:bg-opacity-20 hover:bg-black rounded p-0.5'
                                >
                                    <X className='h-3 w-3' />
                                </button>
                            </div>
                        ))
                    ) : (
                        <div
                            className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border ${getChipColor(
                                type,
                            )}`}
                        >
                            <span className='truncate max-w-[120px]'>
                                {current as string}
                            </span>
                            <button
                                onClick={() => handleRemove()}
                                className='hover:bg-opacity-20 hover:bg-black rounded p-0.5'
                            >
                                <X className='h-3 w-3' />
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div
                    onClick={() => setOpen(!open)}
                    className='cursor-pointer flex items-center justify-between p-2 border border-slate-200 rounded text-xs text-slate-500 hover:border-slate-300'
                >
                    <span>{placeholder || `Select ${type}`}</span>
                    <ChevronDown className='h-3 w-3' />
                </div>
            )}

            {open && (
                <div className='absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto'>
                    <div className='p-2 border-b border-slate-200'>
                        <input
                            type='text'
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={`Search ${type}s...`}
                            className='w-full px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500'
                        />
                    </div>

                    {loading ? (
                        <div className='p-3 text-center text-xs text-slate-500'>
                            Loading...
                        </div>
                    ) : (
                        <>
                            {options.map((option) => {
                                const isSelected = multiSelect
                                    ? Array.isArray(current) &&
                                      current.includes(option.name)
                                    : current === option.name;

                                return (
                                    <div
                                        key={option.id}
                                        onClick={() => handleSelect(option)}
                                        className={`px-3 py-2 text-xs hover:bg-slate-50 cursor-pointer flex items-center justify-between ${
                                            isSelected ? 'bg-slate-100' : ''
                                        }`}
                                    >
                                        <span>{option.name}</span>
                                        {isSelected && (
                                            <span className='text-green-600 text-xs'>
                                                ✓
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                            {options.length === 0 && !loading && (
                                <div className='p-3 text-center text-xs text-slate-500'>
                                    No {type}s found
                                </div>
                            )}
                        </>
                    )}

                    <div className='border-t border-slate-200 p-2'>
                        {!showAdder ? (
                            <button
                                onClick={() => setShowAdder(true)}
                                className='w-full flex items-center gap-2 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded'
                            >
                                <Plus className='h-3 w-3' />
                                Add new {type}
                            </button>
                        ) : (
                            <div className='flex gap-1'>
                                <input
                                    type='text'
                                    value={adding}
                                    onChange={(e) => setAdding(e.target.value)}
                                    placeholder={`Enter ${type} name`}
                                    className='flex-1 px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500'
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAdd();
                                        if (e.key === 'Escape') {
                                            setShowAdder(false);
                                            setAdding('');
                                        }
                                    }}
                                    autoFocus
                                />
                                <button
                                    onClick={handleAdd}
                                    className='px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700'
                                >
                                    Add
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// Advanced column definition with all AccountsTable features
export interface AdvancedColumn<T = any> {
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
    editable?: boolean;
    placeholder?: string;
    type?: 'text' | 'number' | 'email' | 'date' | 'select' | 'dropdown';
    options?: Array<{value: any; label: string}>;
    dropdownType?: CatalogType;
    multiSelect?: boolean;
}

// Advanced table props with all AccountsTable features
export interface AdvancedDataTableProps<T = any> {
    data: T[];
    columns: AdvancedColumn<T>[];
    onEdit?: (row: T) => void;
    onDelete?: (id: string) => void;
    onAdd?: () => void;
    onRowUpdate?: (id: string, field: string, value: any) => void;

    // Table features (same as AccountsTable)
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

    // Styling (same as AccountsTable)
    className?: string;
    rowClassName?: (row: T, index: number) => string;
    highlightQuery?: string;

    // Advanced features from AccountsTable
    showActions?: boolean;
    customActions?: Array<{
        icon: React.ReactNode;
        label: string;
        onClick: (row: T) => void;
        show?: (row: T) => boolean;
    }>;

    // AccountsTable specific features
    groupBy?: keyof T;
    hideColumns?: string[];
    pinnedColumns?: string[];
    resizableColumns?: boolean;
    virtualScrolling?: boolean;
    onQuickAddRow?: () => void;
    visibleColumns?: string[];
    hideRowExpansion?: boolean;
    hideControls?: boolean;

    // External control for action buttons
    externalSearchQuery?: string;
    externalSortConfig?: {
        key: string;
        direction: 'asc' | 'desc';
    } | null;
    externalFilters?: Record<string, any>;
    externalHiddenColumns?: string[];
}

// Inline editable text component (copied from AccountsTable)
const InlineEditableText = ({
    value,
    onCommit,
    placeholder = '',
    className = '',
    dataAttr = '',
    onTabNext,
    onTabPrev,
    type = 'text',
}: {
    value: string;
    onCommit: (value: string) => void;
    placeholder?: string;
    className?: string;
    dataAttr?: string;
    onTabNext?: () => void;
    onTabPrev?: () => void;
    type?: 'text' | 'email' | 'number';
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value || '');
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setEditValue(value || '');
    }, [value]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleSave = useCallback(() => {
        setIsEditing(false);
        setIsFocused(false);
        if (editValue !== value) {
            onCommit(editValue);
        }
    }, [editValue, value, onCommit]);

    const handleCancel = useCallback(() => {
        setIsEditing(false);
        setIsFocused(false);
        setEditValue(value || '');
    }, [value]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter') {
                handleSave();
            } else if (e.key === 'Escape') {
                handleCancel();
            } else if (e.key === 'Tab') {
                e.preventDefault();
                handleSave();
                if (e.shiftKey && onTabPrev) {
                    onTabPrev();
                } else if (!e.shiftKey && onTabNext) {
                    onTabNext();
                }
            }
        },
        [handleSave, handleCancel, onTabNext, onTabPrev],
    );

    const displayValue = value || placeholder;

    if (isEditing) {
        return (
            <input
                ref={inputRef}
                type={type}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className='w-full px-1 py-0.5 text-xs border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white'
                placeholder={placeholder}
            />
        );
    }

    return (
        <span
            data-inline={dataAttr}
            className='cursor-pointer block w-full px-1 py-0.5 rounded min-h-[20px] text-xs transition-colors text-slate-700 hover:bg-slate-50 focus:bg-blue-50 focus:ring-1 focus:ring-blue-500 focus:outline-none'
            onClick={() => setIsEditing(true)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            tabIndex={0}
        >
            {displayValue}
        </span>
    );
};

// Sortable row component matching AccountsTable styling exactly
const SortableRow = <T,>({
    row,
    index,
    columns,
    gridTemplate,
    onEdit,
    onDelete,
    onRowUpdate,
    isExpanded,
    onToggle,
    expandedContent,
    isSelected,
    onSelect,
    highlightQuery,
    hideRowExpansion = false,
    showActions = true,
    customActions = [],
    getRowId,
}: {
    row: T;
    index: number;
    columns: AdvancedColumn<T>[];
    gridTemplate: string;
    onEdit?: (row: T) => void;
    onDelete?: (id: string) => void;
    onRowUpdate?: (id: string, field: string, value: any) => void;
    isExpanded: boolean;
    onToggle: (id: string) => void;
    expandedContent?: React.ReactNode;
    isSelected: boolean;
    onSelect: (id: string) => void;
    highlightQuery?: string;
    hideRowExpansion?: boolean;
    showActions?: boolean;
    customActions?: Array<{
        icon: React.ReactNode;
        label: string;
        onClick: (row: T) => void;
        show?: (row: T) => boolean;
    }>;
    getRowId: (row: T) => string;
}) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const rowId = getRowId(row);

    // Tab navigation (simplified version)
    const createTabNavigation = (field: string) => ({
        onTabNext: () => {
            const nextCell = document
                .querySelector(`[data-inline="${rowId}-${field}"]`)
                ?.parentElement?.nextElementSibling?.querySelector(
                    '[data-inline]',
                );
            if (nextCell) {
                (nextCell as HTMLElement).click();
            }
        },
        onTabPrev: () => {
            const prevCell = document
                .querySelector(`[data-inline="${rowId}-${field}"]`)
                ?.parentElement?.previousElementSibling?.querySelector(
                    '[data-inline]',
                );
            if (prevCell) {
                (prevCell as HTMLElement).click();
            }
        },
    });

    return (
        <Reorder.Item
            value={row}
            id={rowId}
            className={`w-full grid items-start gap-0 overflow-visible border-b border-slate-200 transition-all duration-200 ease-in-out transform-gpu min-h-[2.5rem] py-1 mb-1 ${
                isDragging
                    ? 'cursor-grabbing ring-2 ring-blue-300/40 bg-white shadow-xl border-l-4 border-l-blue-500'
                    : 'cursor-grab hover:bg-slate-50 hover:shadow-sm hover:border-l-4 hover:border-l-blue-400'
            } ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'} ${
                isSelected
                    ? 'ring-2 ring-blue-300/60 bg-blue-50/60 border-l-4 border-l-blue-500'
                    : 'border-l-4 border-l-transparent'
            } ${isExpanded ? 'bg-blue-50 border-l-4 border-l-blue-400' : ''}`}
            style={{gridTemplateColumns: gridTemplate}}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={() => setIsDragging(false)}
            initial={false}
            animate={{opacity: 1, y: 0, scale: 1}}
            transition={{
                layout: {duration: 0.22, ease: [0.22, 1, 0.36, 1]},
                type: 'spring',
                stiffness: 460,
                damping: 30,
                mass: 0.6,
            }}
        >
            {/* Expansion toggle */}
            {!hideRowExpansion && (
                <div className='flex items-center justify-center'>
                    <motion.button
                        onClick={() => onToggle(rowId)}
                        className='h-5 w-5 rounded text-blue-600 hover:bg-blue-100 flex items-center justify-center group'
                        whileHover={{scale: 1.1}}
                        whileTap={{scale: 0.95}}
                    >
                        <motion.div
                            animate={{rotate: isExpanded ? 90 : 0}}
                            transition={{duration: 0.15}}
                        >
                            <ChevronRight
                                className={`h-4 w-4 transition-all duration-150 ${
                                    isExpanded
                                        ? 'opacity-100 text-sky-600'
                                        : 'opacity-0 group-hover:opacity-100'
                                }`}
                            />
                        </motion.div>
                    </motion.button>
                </div>
            )}

            {/* Row cells */}
            {columns.map((column, columnIndex) => {
                const value = (row as any)[column.key];
                const cellId = `${rowId}-${String(column.key)}`;

                return (
                    <div
                        key={String(column.key)}
                        className={`flex items-start px-1 py-1 min-h-[2rem] ${
                            column.align === 'center'
                                ? 'justify-center'
                                : column.align === 'right'
                                ? 'justify-end'
                                : 'justify-start'
                        } ${column.className || ''} ${
                            columnIndex < columns.length - 1
                                ? 'border-r border-slate-200'
                                : ''
                        }`}
                    >
                        {column.renderer ? (
                            column.renderer(value, row, index)
                        ) : column.type === 'dropdown' &&
                          column.dropdownType &&
                          onRowUpdate ? (
                            <AsyncChipSelect
                                type={column.dropdownType}
                                value={value || (column.multiSelect ? [] : '')}
                                onChange={(newValue) =>
                                    onRowUpdate(
                                        rowId,
                                        String(column.key),
                                        newValue ||
                                            (column.multiSelect ? [] : ''),
                                    )
                                }
                                placeholder={
                                    column.placeholder ||
                                    `Select ${column.dropdownType}`
                                }
                                compact={true}
                                multiSelect={column.multiSelect || false}
                            />
                        ) : column.editable && onRowUpdate ? (
                            <InlineEditableText
                                value={value || ''}
                                onCommit={(newValue) =>
                                    onRowUpdate(
                                        rowId,
                                        String(column.key),
                                        newValue,
                                    )
                                }
                                placeholder={column.placeholder || ''}
                                dataAttr={cellId}
                                type={column.type as any}
                                {...createTabNavigation(String(column.key))}
                            />
                        ) : (
                            <div className='text-xs text-slate-700 px-1 py-0.5 truncate'>
                                {highlightQuery && value ? (
                                    <span
                                        dangerouslySetInnerHTML={{
                                            __html: String(value).replace(
                                                new RegExp(
                                                    highlightQuery,
                                                    'gi',
                                                ),
                                                (match: string) =>
                                                    `<mark class="bg-yellow-200 px-0.5 rounded">${match}</mark>`,
                                            ),
                                        }}
                                    />
                                ) : (
                                    value || ''
                                )}
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Actions */}
            {showActions && (
                <div className='flex items-center justify-center gap-1 px-1'>
                    {onDelete && (
                        <motion.button
                            onClick={() => onDelete(rowId)}
                            className='p-1 text-slate-400 hover:text-red-600 rounded transition-colors'
                            title='Delete'
                            whileHover={{scale: 1.1}}
                            whileTap={{scale: 0.95}}
                        >
                            <Trash2 className='h-3 w-3' />
                        </motion.button>
                    )}
                </div>
            )}

            {/* Expanded content */}
            {!hideRowExpansion && isExpanded && expandedContent && (
                <motion.div
                    className='col-span-full'
                    initial={{opacity: 0, y: -4}}
                    animate={{opacity: 1, y: 0}}
                    transition={{duration: 0.18, ease: [0.22, 1, 0.36, 1]}}
                >
                    <div className='pt-2 pl-4 border-l-2 border-blue-200'>
                        {expandedContent}
                    </div>
                </motion.div>
            )}
        </Reorder.Item>
    );
};

// Main AdvancedDataTable component with AccountsTable styling
export default function AdvancedDataTable<T = any>({
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
    paginated = false,
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
    onQuickAddRow,
    visibleColumns,
    hideRowExpansion = false,
    hideControls = false,
    externalSearchQuery,
    externalSortConfig,
    externalFilters,
    externalHiddenColumns,
}: AdvancedDataTableProps<T>) {
    // State management (same as AccountsTable)
    // Use external props if provided, otherwise use internal state
    const effectiveSearchQuery = useMemo(
        () => externalSearchQuery ?? '',
        [externalSearchQuery],
    );
    const effectiveSortConfig = useMemo(
        () => externalSortConfig ?? null,
        [externalSortConfig],
    );
    const effectiveFilters = useMemo(
        () => externalFilters ?? {},
        [externalFilters],
    );
    const effectiveHiddenColumns = useMemo(
        () => new Set(externalHiddenColumns ?? hideColumns),
        [externalHiddenColumns, hideColumns],
    );

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
    const [order, setOrder] = useState<T[]>(data);

    // Get row ID
    const getRowId = (row: T): string => {
        if (typeof rowKey === 'function') {
            return rowKey(row);
        }
        return String((row as any)[rowKey] || Math.random());
    };

    // Visible columns
    const activeColumns = useMemo(() => {
        let cols = columns;
        if (visibleColumns) {
            cols = columns.filter((col) =>
                visibleColumns.includes(String(col.key)),
            );
        }
        return cols.filter(
            (col) => !effectiveHiddenColumns.has(String(col.key)),
        );
    }, [columns, visibleColumns, effectiveHiddenColumns]);

    // Filter and search data
    const filteredData = useMemo(() => {
        let result = [...order];

        // Apply search
        if (effectiveSearchQuery) {
            result = result.filter((row) => {
                return activeColumns.some((column) => {
                    if (!column.searchable) return false;
                    const value = (row as any)[column.key];
                    return String(value || '')
                        .toLowerCase()
                        .includes(effectiveSearchQuery.toLowerCase());
                });
            });
        }

        // Apply filters
        Object.entries(effectiveFilters).forEach(([key, value]) => {
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
    }, [order, effectiveSearchQuery, effectiveFilters, activeColumns]);

    // Sort data
    const sortedData = useMemo(() => {
        if (!effectiveSortConfig) return filteredData;

        return [...filteredData].sort((a, b) => {
            const aValue = (a as any)[effectiveSortConfig.key];
            const bValue = (b as any)[effectiveSortConfig.key];

            if (aValue < bValue)
                return effectiveSortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue)
                return effectiveSortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredData, effectiveSortConfig]);

    // Paginate data
    const paginatedData = useMemo(() => {
        if (!paginated) return sortedData;
        const start = (currentPage - 1) * pageSize;
        return sortedData.slice(start, start + pageSize);
    }, [sortedData, currentPage, pageSize, paginated]);

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

    // Calculate grid template - match AccountsTable exactly
    const gridTemplate = useMemo(() => {
        const colWidths = activeColumns.map((col) => col.width || '1fr');
        if (!hideRowExpansion && expandable) colWidths.unshift('32px');
        if (showActions) colWidths.push('60px');
        return colWidths.join(' ');
    }, [activeColumns, expandable, showActions, hideRowExpansion]);

    // Sync data changes
    useEffect(() => {
        setOrder(data);
    }, [data]);

    return (
        <div
            className={`rounded-xl border border-slate-300 shadow-sm bg-white pb-1 ${className}`}
        >
            {/* Header - exactly matching AccountsTable */}
            <div
                className='sticky top-0 z-30 grid w-full overflow-visible gap-0 px-0 py-2 text-xs font-semibold text-slate-900 bg-white/90 supports-[backdrop-filter]:backdrop-blur-sm border-b border-slate-200 divide-x divide-slate-200 shadow-sm'
                style={{gridTemplateColumns: gridTemplate}}
            >
                {!hideRowExpansion && expandable && (
                    <div className='px-2'></div>
                )}
                {activeColumns.map((column, columnIndex) => (
                    <div
                        key={String(column.key)}
                        className={`relative flex items-center gap-1 px-2 py-1.5 rounded-sm hover:bg-slate-50 transition-colors duration-150 group ${
                            columnIndex < activeColumns.length - 1
                                ? 'border-r border-slate-200'
                                : ''
                        }`}
                    >
                        {column.icon && (
                            <span className='text-blue-600'>{column.icon}</span>
                        )}
                        {column.headerRenderer ? (
                            column.headerRenderer()
                        ) : (
                            <motion.button
                                onClick={() =>
                                    column.sortable &&
                                    handleSort(String(column.key))
                                }
                                className={`flex items-center gap-1 font-semibold text-xs ${
                                    column.sortable
                                        ? 'hover:text-slate-700 cursor-pointer'
                                        : 'text-slate-900'
                                }`}
                                whileHover={
                                    column.sortable ? {scale: 1.02} : {}
                                }
                                whileTap={column.sortable ? {scale: 0.98} : {}}
                            >
                                <span>{column.label}</span>
                                {column.sortable &&
                                    effectiveSortConfig?.key ===
                                        String(column.key) && (
                                        <motion.div
                                            initial={{scale: 0}}
                                            animate={{scale: 1}}
                                            transition={{duration: 0.2}}
                                        >
                                            {effectiveSortConfig.direction ===
                                            'asc' ? (
                                                <SortAsc className='h-3 w-3 text-blue-600' />
                                            ) : (
                                                <SortDesc className='h-3 w-3 text-blue-600' />
                                            )}
                                        </motion.div>
                                    )}
                            </motion.button>
                        )}
                    </div>
                ))}
                {showActions && (
                    <div className='px-2 py-1.5 text-center font-semibold text-xs text-slate-900'>
                        Actions
                    </div>
                )}
            </div>

            {/* Body */}
            <div className='divide-y divide-slate-200'>
                <Reorder.Group
                    axis='y'
                    values={paginatedData}
                    onReorder={setOrder}
                    className='space-y-0 px-2 py-1'
                >
                    {paginatedData.map((row, index) => {
                        const rowId = getRowId(row);
                        const isExpanded = expandedRows.has(rowId);
                        const isSelected = selectedRows.has(rowId);

                        return (
                            <SortableRow
                                key={rowId}
                                row={row}
                                index={index}
                                columns={activeColumns}
                                gridTemplate={gridTemplate}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                onRowUpdate={onRowUpdate}
                                isExpanded={isExpanded}
                                onToggle={toggleRowExpansion}
                                expandedContent={
                                    expandedContent
                                        ? expandedContent(row)
                                        : undefined
                                }
                                isSelected={isSelected}
                                onSelect={(id) =>
                                    setSelectedRows((prev) => {
                                        const newSet = new Set(prev);
                                        if (newSet.has(id)) {
                                            newSet.delete(id);
                                        } else {
                                            newSet.add(id);
                                        }
                                        return newSet;
                                    })
                                }
                                highlightQuery={highlightQuery}
                                hideRowExpansion={hideRowExpansion}
                                showActions={showActions}
                                customActions={customActions}
                                getRowId={getRowId}
                            />
                        );
                    })}
                </Reorder.Group>
            </div>

            {/* Empty state */}
            {paginatedData.length === 0 && (
                <motion.div
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    className='px-6 py-12 text-center'
                >
                    <div className='text-slate-500 mb-2'>
                        <FileText className='h-12 w-12 mx-auto mb-4 text-slate-300' />
                        <p className='text-lg font-medium'>No data available</p>
                        {effectiveSearchQuery && (
                            <p className='mt-1 text-sm'>
                                Try adjusting your search or filters
                            </p>
                        )}
                    </div>
                    {onAdd && (
                        <motion.button
                            onClick={onAdd}
                            className='mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                            whileHover={{scale: 1.02}}
                            whileTap={{scale: 0.98}}
                        >
                            Add First Entry
                        </motion.button>
                    )}
                </motion.div>
            )}

            {/* Quick add row - matching AccountsTable */}
            {onQuickAddRow && paginatedData.length > 0 && (
                <motion.div
                    className='px-6 py-4 border-t border-slate-200 bg-slate-50/50'
                    whileHover={{backgroundColor: 'rgb(248 250 252)'}}
                >
                    <motion.button
                        onClick={onQuickAddRow}
                        className='flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm'
                        whileHover={{scale: 1.02}}
                        whileTap={{scale: 0.98}}
                    >
                        <PlusIcon className='h-4 w-4' />
                        Add new row
                    </motion.button>
                </motion.div>
            )}
        </div>
    );
}

// Interfaces are already exported above
