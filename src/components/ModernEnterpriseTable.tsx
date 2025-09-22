'use client';

import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Reorder, motion, AnimatePresence} from 'framer-motion';
import {
    ArrowUp,
    ArrowDown,
    Trash2,
    Pencil,
    MoreVertical,
    ChevronRight,
    Plus,
    X,
    Pin,
    PinOff,
    Building2,
    Package,
    Cpu,
} from 'lucide-react';
import {createPortal} from 'react-dom';
import {api} from '../utils/api';

export interface EnterpriseRow {
    id: string;
    enterpriseId: string;
    enterpriseName: string;
    productId: string;
    productName: string;
    serviceIds: string[];
    serviceNames: string[];
}

export interface EnterpriseTableProps {
    rows: EnterpriseRow[];
    onUpdateRow: (id: string, updates: Partial<EnterpriseRow>) => void;
    onDeleteRow: (id: string) => void;
    onAddRow: () => void;
    cols: Array<'enterprise' | 'product' | 'services' | 'actions'>;
    colSizes: Record<string, string>;
    visibleColumns: Array<'enterprise' | 'product' | 'services' | 'actions'>;
    sortColumn?: string;
    sortDirection?: 'asc' | 'desc';
    searchTerm?: string;
    hiddenColumns?: string[];
    pinnedRows?: string[];
    onTogglePin?: (id: string) => void;
    onMoveRow?: (fromIndex: number, toIndex: number) => void;
    groupBy?: string;
}

interface DropdownOption {
    id: string;
    name: string;
}

// Chip component for displaying selected items
const Chip = ({
    label,
    onRemove,
    color = 'blue',
}: {
    label: string;
    onRemove: () => void;
    color?: 'blue' | 'green' | 'purple';
}) => {
    const colorClasses = {
        blue: 'bg-blue-100 text-blue-800 border-blue-200',
        green: 'bg-green-100 text-green-800 border-green-200',
        purple: 'bg-purple-100 text-purple-800 border-purple-200',
    };

    return (
        <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${colorClasses[color]} mr-1 mb-1`}
        >
            {label}
            <button
                onClick={onRemove}
                className='ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-opacity-20 hover:bg-gray-500'
            >
                <X size={10} />
            </button>
        </span>
    );
};

// Dropdown component with search and create functionality
const SmartDropdown = ({
    options,
    selected,
    onSelect,
    onDeselect,
    multiple = false,
    placeholder,
    apiEndpoint,
    color = 'blue',
    onCreateNew,
}: {
    options: DropdownOption[];
    selected: string[];
    onSelect: (id: string, name: string) => void;
    onDeselect: (id: string) => void;
    multiple?: boolean;
    placeholder: string;
    apiEndpoint: string;
    color?: 'blue' | 'green' | 'purple';
    onCreateNew: (name: string) => Promise<void>;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [creating, setCreating] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const filteredOptions = options.filter((option) =>
        option.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
                setCreating(false);
                setNewItemName('');
                setSearchTerm('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleCreateNew = async () => {
        if (!newItemName.trim()) return;

        try {
            await onCreateNew(newItemName.trim());
            setNewItemName('');
            setCreating(false);
        } catch (error) {
            console.error('Failed to create new item:', error);
        }
    };

    const selectedOptions = options.filter((opt) => selected.includes(opt.id));

    return (
        <div className='relative w-full' ref={dropdownRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className='min-h-[2.5rem] p-2 border border-gray-300 rounded-md cursor-pointer bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            >
                {selectedOptions.length > 0 ? (
                    <div className='flex flex-wrap gap-1'>
                        {selectedOptions.map((option) => (
                            <Chip
                                key={option.id}
                                label={option.name}
                                color={color}
                                onRemove={() => onDeselect(option.id)}
                            />
                        ))}
                    </div>
                ) : (
                    <span className='text-gray-500 text-sm'>{placeholder}</span>
                )}
            </div>

            {isOpen && (
                <div className='absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto'>
                    <div className='p-2 border-b'>
                        <input
                            type='text'
                            placeholder='Search...'
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className='w-full p-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500'
                            autoFocus
                        />
                    </div>

                    <div className='max-h-40 overflow-y-auto'>
                        {filteredOptions.map((option) => {
                            const isSelected = selected.includes(option.id);
                            return (
                                <div
                                    key={option.id}
                                    onClick={() => {
                                        if (isSelected) {
                                            onDeselect(option.id);
                                        } else {
                                            onSelect(option.id, option.name);
                                            if (!multiple) {
                                                setIsOpen(false);
                                            }
                                        }
                                    }}
                                    className={`p-2 text-sm cursor-pointer hover:bg-gray-100 flex items-center justify-between ${
                                        isSelected
                                            ? 'bg-blue-50 text-blue-600'
                                            : ''
                                    }`}
                                >
                                    <span>{option.name}</span>
                                    {isSelected && (
                                        <span className='text-blue-600'>✓</span>
                                    )}
                                </div>
                            );
                        })}

                        {filteredOptions.length === 0 && searchTerm && (
                            <div className='p-2 text-sm text-gray-500'>
                                No options found
                            </div>
                        )}
                    </div>

                    <div className='border-t p-2'>
                        {creating ? (
                            <div className='flex gap-2'>
                                <input
                                    type='text'
                                    placeholder='Enter name...'
                                    value={newItemName}
                                    onChange={(e) =>
                                        setNewItemName(e.target.value)
                                    }
                                    className='flex-1 p-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500'
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            handleCreateNew();
                                        }
                                    }}
                                    autoFocus
                                />
                                <button
                                    onClick={handleCreateNew}
                                    className='px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700'
                                >
                                    Add
                                </button>
                                <button
                                    onClick={() => {
                                        setCreating(false);
                                        setNewItemName('');
                                    }}
                                    className='px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400'
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setCreating(true)}
                                className='w-full flex items-center justify-center gap-1 p-1 text-sm text-blue-600 hover:bg-blue-50 rounded'
                            >
                                <Plus size={14} />
                                Create New
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// Main table component
export default function ModernEnterpriseTable({
    rows,
    onUpdateRow,
    onDeleteRow,
    onAddRow,
    cols,
    colSizes,
    visibleColumns,
    sortColumn,
    sortDirection,
    searchTerm = '',
    hiddenColumns = [],
    pinnedRows = [],
    onTogglePin,
    onMoveRow,
    groupBy,
}: EnterpriseTableProps) {
    const [enterprises, setEnterprises] = useState<DropdownOption[]>([]);
    const [products, setProducts] = useState<DropdownOption[]>([]);
    const [services, setServices] = useState<DropdownOption[]>([]);
    const [loading, setLoading] = useState(true);

    // Load dropdown options
    useEffect(() => {
        const loadData = async () => {
            try {
                const [enterprisesRes, productsRes, servicesRes] =
                    await Promise.all([
                        api.get<{id: string | number; name: string}[]>(
                            '/api/enterprises',
                        ),
                        api.get<{id: string | number; name: string}[]>(
                            '/api/products',
                        ),
                        api.get<{id: string | number; name: string}[]>(
                            '/api/services',
                        ),
                    ]);

                setEnterprises(
                    enterprisesRes?.map((e) => ({
                        id: e.id.toString(),
                        name: e.name,
                    })) || [],
                );
                setProducts(
                    productsRes?.map((p) => ({
                        id: p.id.toString(),
                        name: p.name,
                    })) || [],
                );
                setServices(
                    servicesRes?.map((s) => ({
                        id: s.id.toString(),
                        name: s.name,
                    })) || [],
                );
            } catch (error) {
                console.error('Failed to load dropdown data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // Create new enterprise
    const handleCreateEnterprise = async (name: string) => {
        try {
            const response = await api.post<{
                id: string | number;
                name: string;
            }>('/api/enterprises', {name});
            const newEnterprise = {
                id: response.id.toString(),
                name: response.name,
            };
            setEnterprises((prev) => [...prev, newEnterprise]);
        } catch (error) {
            console.error('Failed to create enterprise:', error);
            throw error;
        }
    };

    // Create new product
    const handleCreateProduct = async (name: string) => {
        try {
            const response = await api.post<{
                id: string | number;
                name: string;
            }>('/api/products', {name});
            const newProduct = {
                id: response.id.toString(),
                name: response.name,
            };
            setProducts((prev) => [...prev, newProduct]);
        } catch (error) {
            console.error('Failed to create product:', error);
            throw error;
        }
    };

    // Create new service
    const handleCreateService = async (name: string) => {
        try {
            const response = await api.post<{
                id: string | number;
                name: string;
            }>('/api/services', {name});
            const newService = {
                id: response.id.toString(),
                name: response.name,
            };
            setServices((prev) => [...prev, newService]);
        } catch (error) {
            console.error('Failed to create service:', error);
            throw error;
        }
    };

    // Filter and sort rows
    const processedRows = useMemo(() => {
        let filtered = rows.filter((row) => {
            if (!searchTerm) return true;
            return (
                row.enterpriseName
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                row.productName
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                row.serviceNames.some((name) =>
                    name.toLowerCase().includes(searchTerm.toLowerCase()),
                )
            );
        });

        if (sortColumn && sortDirection) {
            filtered.sort((a, b) => {
                let aVal: any = '';
                let bVal: any = '';

                switch (sortColumn) {
                    case 'enterprise':
                        aVal = a.enterpriseName;
                        bVal = b.enterpriseName;
                        break;
                    case 'product':
                        aVal = a.productName;
                        bVal = b.productName;
                        break;
                    case 'services':
                        aVal = a.serviceNames.join(', ');
                        bVal = b.serviceNames.join(', ');
                        break;
                }

                if (typeof aVal === 'string') {
                    return sortDirection === 'asc'
                        ? aVal.localeCompare(bVal)
                        : bVal.localeCompare(aVal);
                }

                return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
            });
        }

        return filtered;
    }, [rows, searchTerm, sortColumn, sortDirection]);

    const columnOrder = cols.filter(
        (col) => visibleColumns.includes(col) && !hiddenColumns.includes(col),
    );

    const iconFor = {
        enterprise: <Building2 className='h-3.5 w-3.5 text-blue-600' />,
        product: <Package className='h-3.5 w-3.5 text-blue-600' />,
        services: <Cpu className='h-3.5 w-3.5 text-blue-600' />,
    };

    const labelFor = {
        enterprise: 'Enterprise',
        product: 'Product',
        services: 'Services',
        actions: 'Actions',
    };

    if (loading) {
        return (
            <div className='flex items-center justify-center p-8'>
                <div className='text-gray-500'>Loading...</div>
            </div>
        );
    }

    return (
        <div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
            {/* Header */}
            <div
                className='grid gap-4 p-4 bg-gray-50 border-b font-medium text-sm text-gray-700'
                style={{
                    gridTemplateColumns: columnOrder
                        .map((col) => colSizes[col] || 'auto')
                        .join(' '),
                }}
            >
                {columnOrder.map((col) => (
                    <div key={col} className='flex items-center gap-2'>
                        {iconFor[col as keyof typeof iconFor]}
                        <span>{labelFor[col as keyof typeof labelFor]}</span>
                    </div>
                ))}
            </div>

            {/* Add new row button */}
            <div className='p-4 border-b bg-gray-50'>
                <button
                    onClick={onAddRow}
                    className='flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md border border-blue-200'
                >
                    <Plus size={16} />
                    Add New Configuration
                </button>
            </div>

            {/* Rows */}
            <div className='divide-y divide-gray-200'>
                {processedRows.map((row) => (
                    <div
                        key={row.id}
                        className='grid gap-4 p-4 hover:bg-gray-50 transition-colors'
                        style={{
                            gridTemplateColumns: columnOrder
                                .map((col) => colSizes[col] || 'auto')
                                .join(' '),
                        }}
                    >
                        {columnOrder.includes('enterprise') && (
                            <div className='min-h-[2.5rem] flex items-center'>
                                <SmartDropdown
                                    options={enterprises}
                                    selected={
                                        row.enterpriseId
                                            ? [row.enterpriseId]
                                            : []
                                    }
                                    onSelect={(id, name) => {
                                        onUpdateRow(row.id, {
                                            enterpriseId: id,
                                            enterpriseName: name,
                                        });
                                    }}
                                    onDeselect={() => {
                                        onUpdateRow(row.id, {
                                            enterpriseId: '',
                                            enterpriseName: '',
                                        });
                                    }}
                                    placeholder='Select Enterprise'
                                    apiEndpoint='/api/enterprises'
                                    color='blue'
                                    onCreateNew={handleCreateEnterprise}
                                />
                            </div>
                        )}

                        {columnOrder.includes('product') && (
                            <div className='min-h-[2.5rem] flex items-center'>
                                <SmartDropdown
                                    options={products}
                                    selected={
                                        row.productId ? [row.productId] : []
                                    }
                                    onSelect={(id, name) => {
                                        onUpdateRow(row.id, {
                                            productId: id,
                                            productName: name,
                                        });
                                    }}
                                    onDeselect={() => {
                                        onUpdateRow(row.id, {
                                            productId: '',
                                            productName: '',
                                        });
                                    }}
                                    placeholder='Select Product'
                                    apiEndpoint='/api/products'
                                    color='green'
                                    onCreateNew={handleCreateProduct}
                                />
                            </div>
                        )}

                        {columnOrder.includes('services') && (
                            <div className='min-h-[2.5rem] flex items-center'>
                                <SmartDropdown
                                    options={services}
                                    selected={row.serviceIds}
                                    onSelect={(id, name) => {
                                        const newServiceIds = [
                                            ...row.serviceIds,
                                            id,
                                        ];
                                        const newServiceNames = [
                                            ...row.serviceNames,
                                            name,
                                        ];
                                        onUpdateRow(row.id, {
                                            serviceIds: newServiceIds,
                                            serviceNames: newServiceNames,
                                        });
                                    }}
                                    onDeselect={(id) => {
                                        const index =
                                            row.serviceIds.indexOf(id);
                                        if (index > -1) {
                                            const newServiceIds = [
                                                ...row.serviceIds,
                                            ];
                                            const newServiceNames = [
                                                ...row.serviceNames,
                                            ];
                                            newServiceIds.splice(index, 1);
                                            newServiceNames.splice(index, 1);
                                            onUpdateRow(row.id, {
                                                serviceIds: newServiceIds,
                                                serviceNames: newServiceNames,
                                            });
                                        }
                                    }}
                                    multiple={true}
                                    placeholder='Select Services'
                                    apiEndpoint='/api/services'
                                    color='purple'
                                    onCreateNew={handleCreateService}
                                />
                            </div>
                        )}

                        {columnOrder.includes('actions') && (
                            <div className='flex items-center gap-2'>
                                <button
                                    onClick={() => onDeleteRow(row.id)}
                                    className='p-1 text-red-600 hover:bg-red-50 rounded'
                                    title='Delete'
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {processedRows.length === 0 && (
                <div className='p-8 text-center text-gray-500'>
                    No configurations found. Add your first configuration to get
                    started.
                </div>
            )}
        </div>
    );
}
