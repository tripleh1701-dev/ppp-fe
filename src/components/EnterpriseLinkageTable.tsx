'use client';

import React, {useState, useEffect, useMemo, useRef} from 'react';
import {
    Building2,
    Package,
    Globe,
    Plus,
    Trash2,
    Save,
    X,
    Edit3,
    Check,
    Search,
    Filter,
    ArrowUpDown,
    Eye,
    EyeOff,
    Users,
    ChevronDown,
    SortAsc,
    SortDesc,
    MoreHorizontal,
    Database,
} from 'lucide-react';
import {api} from '@/utils/api';

// Types for the new DynamoDB structure
interface Enterprise {
    id: string; // UUID string
    name: string;
}

interface Product {
    id: string; // UUID string
    name: string;
}

interface Service {
    id: string; // UUID string
    name: string;
}

interface EnterpriseLinkage {
    id: string; // UUID string
    enterprise: {
        id: string;
        name: string;
    };
    product: {
        id: string;
        name: string;
    };
    services: Array<{
        id: string;
        name: string;
    }>;
}

interface EnterpriseLinkageRow {
    id: string;
    enterprise: string;
    enterpriseId: string;
    product: string;
    productId: string;
    services: string[]; // Selected service names
    serviceIds: string[]; // Selected service IDs
    isEditing?: boolean;
    isNew?: boolean;
    isSaving?: boolean;
}

interface Props {
    title?: string;
    onDataChange?: () => void;
}

// Advanced Dropdown component with create functionality
const AdvancedDropdown = ({
    options,
    value,
    onChange,
    onCreateNew,
    placeholder,
    disabled = false,
    icon,
}: {
    options: Array<{id: string; name: string}>;
    value: string;
    onChange: (id: string, name: string) => void;
    onCreateNew: (name: string) => Promise<void>;
    placeholder: string;
    disabled?: boolean;
    icon?: React.ReactNode;
}) => {
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [dropdownPosition, setDropdownPosition] = useState<{
        top: number;
        left: number;
        width: number;
    } | null>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
                setIsCreating(false);
                setSearchTerm('');
                setNewName('');
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () =>
                document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    const handleCreateNew = async () => {
        if (newName.trim()) {
            try {
                await onCreateNew(newName.trim());
                setNewName('');
                setIsCreating(false);
                setIsOpen(false);
                setSearchTerm('');
            } catch (error) {
                console.error('Failed to create new item:', error);
            }
        }
    };

    const selectedOption = options.find((opt) => opt.id === value);

    // Filter options based on search term
    const filteredOptions = options.filter((option) =>
        option.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    const handleButtonClick = () => {
        if (disabled) return;

        if (!isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width,
            });
        }
        setIsOpen(!isOpen);
    };

    return (
        <div className='relative z-[1]' ref={dropdownRef}>
            <button
                ref={buttonRef}
                type='button'
                onClick={handleButtonClick}
                disabled={disabled}
                className='w-full px-3 py-2.5 border border-gray-300 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 bg-white hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow-md relative z-[2]'
            >
                <div className='flex items-center justify-between gap-2'>
                    <div className='flex items-center gap-2 flex-1 min-w-0'>
                        {icon && <div className='flex-shrink-0'>{icon}</div>}
                        <span
                            className={`truncate ${
                                selectedOption
                                    ? 'text-gray-900 font-medium'
                                    : 'text-gray-500'
                            }`}
                        >
                            {selectedOption ? selectedOption.name : placeholder}
                        </span>
                    </div>
                    <ChevronDown
                        size={16}
                        className={`text-gray-400 transition-transform duration-200 ${
                            isOpen ? 'rotate-180' : ''
                        }`}
                    />
                </div>
            </button>

            {isOpen && dropdownPosition && (
                <div
                    className='fixed z-[9999] bg-white border border-gray-200 rounded-lg shadow-xl max-h-80 overflow-hidden'
                    style={{
                        top: dropdownPosition.top + 4,
                        left: dropdownPosition.left,
                        width: dropdownPosition.width,
                    }}
                >
                    {/* Search input */}
                    <div className='p-3 border-b border-gray-100'>
                        <div className='relative'>
                            <Search
                                size={16}
                                className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'
                            />
                            <input
                                type='text'
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder='Search options...'
                                className='w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                            />
                        </div>
                    </div>

                    {/* Create new option */}
                    <div className='p-2 border-b border-gray-100 bg-gray-50'>
                        {isCreating ? (
                            <div className='flex items-center gap-2'>
                                <input
                                    type='text'
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder='Enter name...'
                                    className='flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter')
                                            handleCreateNew();
                                        if (e.key === 'Escape') {
                                            setIsCreating(false);
                                            setNewName('');
                                        }
                                    }}
                                />
                                <button
                                    onClick={handleCreateNew}
                                    className='px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 flex items-center gap-1'
                                    disabled={!newName.trim()}
                                >
                                    <Check size={14} />
                                    Save
                                </button>
                                <button
                                    onClick={() => {
                                        setIsCreating(false);
                                        setNewName('');
                                    }}
                                    className='px-3 py-2 text-sm bg-gray-400 text-white rounded-md hover:bg-gray-500 transition-colors duration-200'
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsCreating(true)}
                                className='flex items-center gap-2 w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors duration-200 font-medium'
                            >
                                <Plus size={14} />
                                <span>Create New</span>
                            </button>
                        )}
                    </div>

                    {/* Options list */}
                    <div className='max-h-48 overflow-y-auto'>
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => {
                                        onChange(option.id, option.name);
                                        setIsOpen(false);
                                        setSearchTerm('');
                                    }}
                                    className={`w-full px-4 py-3 text-left text-sm hover:bg-blue-50 transition-colors duration-200 flex items-center gap-2 ${
                                        value === option.id
                                            ? 'bg-blue-100 text-blue-700 font-medium'
                                            : 'text-gray-700'
                                    }`}
                                >
                                    {value === option.id && (
                                        <Check
                                            size={16}
                                            className='text-blue-600'
                                        />
                                    )}
                                    <span className='flex-1'>
                                        {option.name}
                                    </span>
                                </button>
                            ))
                        ) : searchTerm ? (
                            <div className='px-4 py-6 text-center text-gray-500'>
                                <Search
                                    size={20}
                                    className='mx-auto mb-2 text-gray-400'
                                />
                                <p className='text-sm'>
                                    No results found for &quot;{searchTerm}
                                    &quot;
                                </p>
                                <button
                                    onClick={() => {
                                        setNewName(searchTerm);
                                        setIsCreating(true);
                                        setSearchTerm('');
                                    }}
                                    className='mt-2 text-sm text-blue-600 hover:text-blue-700'
                                >
                                    Create &quot;{searchTerm}&quot;
                                </button>
                            </div>
                        ) : (
                            <div className='px-4 py-6 text-center text-gray-500'>
                                <Database
                                    size={20}
                                    className='mx-auto mb-2 text-gray-400'
                                />
                                <p className='text-sm'>No options available</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// Multi-select component for services with create functionality
const AdvancedMultiSelect = ({
    options,
    selectedIds,
    onChange,
    onCreateNew,
    disabled = false,
    icon,
}: {
    options: Service[];
    selectedIds: string[];
    onChange: (serviceIds: string[], serviceNames: string[]) => void;
    onCreateNew: (name: string) => Promise<void>;
    disabled?: boolean;
    icon?: React.ReactNode;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [dropdownPosition, setDropdownPosition] = useState<{
        top: number;
        left: number;
        width: number;
    } | null>(null);

    const selectedServices = options.filter((service) =>
        selectedIds.includes(service.id),
    );

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
                setIsCreating(false);
                setSearchTerm('');
                setNewName('');
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () =>
                document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    const handleToggle = (service: Service) => {
        const newIds = selectedIds.includes(service.id)
            ? selectedIds.filter((id) => id !== service.id)
            : [...selectedIds, service.id];

        const newNames = options
            .filter((s) => newIds.includes(s.id))
            .map((s) => s.name);

        onChange(newIds, newNames);
    };

    const handleCreateNew = async () => {
        if (newName.trim()) {
            try {
                await onCreateNew(newName.trim());
                setNewName('');
                setIsCreating(false);
                setSearchTerm('');
            } catch (error) {
                console.error('Failed to create new service:', error);
            }
        }
    };

    // Filter options based on search term
    const filteredOptions = options.filter((option) =>
        option.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    const handleRemoveService = (serviceId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newIds = selectedIds.filter((id) => id !== serviceId);
        const newNames = options
            .filter((s) => newIds.includes(s.id))
            .map((s) => s.name);
        onChange(newIds, newNames);
    };

    const handleButtonClick = () => {
        if (disabled) return;

        if (!isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width,
            });
        }
        setIsOpen(!isOpen);
    };

    return (
        <div className='relative z-[1]' ref={dropdownRef}>
            <button
                ref={buttonRef}
                type='button'
                onClick={handleButtonClick}
                disabled={disabled}
                className='w-full px-3 py-2.5 border border-gray-300 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 bg-white hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow-md min-h-[42px] relative z-[2]'
            >
                <div className='flex items-center justify-between gap-2'>
                    <div className='flex items-center gap-2 flex-1 min-w-0'>
                        {icon && <div className='flex-shrink-0'>{icon}</div>}
                        {selectedServices.length === 0 ? (
                            <span className='text-gray-500'>
                                Select services...
                            </span>
                        ) : (
                            <div className='flex flex-wrap gap-1.5 max-h-20 overflow-y-auto'>
                                {selectedServices.map((service) => (
                                    <span
                                        key={service.id}
                                        className='inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border border-purple-300 group'
                                    >
                                        <span className='truncate max-w-24'>
                                            {service.name}
                                        </span>
                                        <button
                                            onClick={(e) =>
                                                handleRemoveService(
                                                    service.id,
                                                    e,
                                                )
                                            }
                                            className='ml-1 flex-shrink-0 h-3.5 w-3.5 rounded-full flex items-center justify-center hover:bg-purple-300 transition-colors duration-200'
                                        >
                                            <X
                                                size={10}
                                                className='text-purple-600'
                                            />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className='flex items-center gap-1'>
                        {selectedServices.length > 0 && (
                            <span className='text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full'>
                                {selectedServices.length}
                            </span>
                        )}
                        <ChevronDown
                            size={16}
                            className={`text-gray-400 transition-transform duration-200 flex-shrink-0 ${
                                isOpen ? 'rotate-180' : ''
                            }`}
                        />
                    </div>
                </div>
            </button>

            {isOpen && dropdownPosition && (
                <div
                    className='fixed z-[9999] bg-white border border-gray-200 rounded-lg shadow-xl max-h-80 overflow-hidden'
                    style={{
                        top: dropdownPosition.top + 4,
                        left: dropdownPosition.left,
                        width: dropdownPosition.width,
                    }}
                >
                    {/* Search input */}
                    <div className='p-3 border-b border-gray-100'>
                        <div className='relative'>
                            <Search
                                size={16}
                                className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'
                            />
                            <input
                                type='text'
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder='Search services...'
                                className='w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                            />
                        </div>
                    </div>

                    {/* Create new option */}
                    <div className='p-2 border-b border-gray-100 bg-gray-50'>
                        {isCreating ? (
                            <div className='flex items-center gap-2'>
                                <input
                                    type='text'
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder='Enter service name...'
                                    className='flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter')
                                            handleCreateNew();
                                        if (e.key === 'Escape') {
                                            setIsCreating(false);
                                            setNewName('');
                                        }
                                    }}
                                />
                                <button
                                    onClick={handleCreateNew}
                                    className='px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 flex items-center gap-1'
                                    disabled={!newName.trim()}
                                >
                                    <Check size={14} />
                                    Save
                                </button>
                                <button
                                    onClick={() => {
                                        setIsCreating(false);
                                        setNewName('');
                                    }}
                                    className='px-3 py-2 text-sm bg-gray-400 text-white rounded-md hover:bg-gray-500 transition-colors duration-200'
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsCreating(true)}
                                className='flex items-center gap-2 w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors duration-200 font-medium'
                            >
                                <Plus size={14} />
                                <span>Create New Service</span>
                            </button>
                        )}
                    </div>

                    {/* Options list */}
                    <div className='max-h-48 overflow-y-auto'>
                        {filteredOptions.length > 0 ? (
                            <>
                                {/* Select All / Deselect All */}
                                <div className='px-3 py-2 border-b border-gray-100 bg-gray-50'>
                                    <button
                                        onClick={() => {
                                            const allFilteredIds =
                                                filteredOptions.map(
                                                    (s) => s.id,
                                                );
                                            const allSelected =
                                                allFilteredIds.every((id) =>
                                                    selectedIds.includes(id),
                                                );

                                            if (allSelected) {
                                                // Deselect all filtered
                                                const newIds =
                                                    selectedIds.filter(
                                                        (id) =>
                                                            !allFilteredIds.includes(
                                                                id,
                                                            ),
                                                    );
                                                const newNames = options
                                                    .filter((s) =>
                                                        newIds.includes(s.id),
                                                    )
                                                    .map((s) => s.name);
                                                onChange(newIds, newNames);
                                            } else {
                                                // Select all filtered
                                                const newIds = Array.from(
                                                    new Set([
                                                        ...selectedIds,
                                                        ...allFilteredIds,
                                                    ]),
                                                );
                                                const newNames = options
                                                    .filter((s) =>
                                                        newIds.includes(s.id),
                                                    )
                                                    .map((s) => s.name);
                                                onChange(newIds, newNames);
                                            }
                                        }}
                                        className='text-sm text-blue-600 hover:text-blue-700 font-medium'
                                    >
                                        {filteredOptions.every((s) =>
                                            selectedIds.includes(s.id),
                                        )
                                            ? 'Deselect All'
                                            : 'Select All'}
                                    </button>
                                </div>

                                {filteredOptions.map((service) => (
                                    <div
                                        key={service.id}
                                        className='flex items-center px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors duration-200'
                                        onClick={() => handleToggle(service)}
                                    >
                                        <div className='relative flex items-center'>
                                            <input
                                                type='checkbox'
                                                checked={selectedIds.includes(
                                                    service.id,
                                                )}
                                                onChange={() => {}} // Handled by parent onClick
                                                className='h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
                                            />
                                            {selectedIds.includes(
                                                service.id,
                                            ) && (
                                                <Check
                                                    size={12}
                                                    className='absolute inset-0 text-blue-600 pointer-events-none'
                                                />
                                            )}
                                        </div>
                                        <span className='ml-3 text-sm text-gray-700 flex-1'>
                                            {service.name}
                                        </span>
                                    </div>
                                ))}
                            </>
                        ) : searchTerm ? (
                            <div className='px-4 py-6 text-center text-gray-500'>
                                <Search
                                    size={20}
                                    className='mx-auto mb-2 text-gray-400'
                                />
                                <p className='text-sm'>
                                    No services found for &quot;{searchTerm}
                                    &quot;
                                </p>
                                <button
                                    onClick={() => {
                                        setNewName(searchTerm);
                                        setIsCreating(true);
                                        setSearchTerm('');
                                    }}
                                    className='mt-2 text-sm text-blue-600 hover:text-blue-700'
                                >
                                    Create &quot;{searchTerm}&quot;
                                </button>
                            </div>
                        ) : (
                            <div className='px-4 py-6 text-center text-gray-500'>
                                <Database
                                    size={20}
                                    className='mx-auto mb-2 text-gray-400'
                                />
                                <p className='text-sm'>No services available</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// Editable chip component for single selection (Enterprise/Product)
const EditableChip = ({
    value,
    selectedId,
    options,
    placeholder,
    icon,
    onSelect,
    onRemove,
    onCreateNew,
    chipColor = 'blue',
}: {
    value: string;
    selectedId: string;
    options: Array<{id: string; name: string}>;
    placeholder: string;
    icon?: React.ReactNode;
    onSelect: (id: string, name: string) => void;
    onRemove: () => void;
    onCreateNew: (name: string) => Promise<void>;
    chipColor: 'blue' | 'green' | 'purple';
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const chipRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [dropdownPosition, setDropdownPosition] = useState<{
        top: number;
        left: number;
        width: number;
    } | null>(null);

    const colorClasses = {
        blue: {
            chip: 'bg-blue-100 text-blue-800 border-blue-200',
            hover: 'hover:bg-blue-200',
            cross: 'hover:bg-blue-200',
        },
        green: {
            chip: 'bg-green-100 text-green-800 border-green-200',
            hover: 'hover:bg-green-200',
            cross: 'hover:bg-green-200',
        },
        purple: {
            chip: 'bg-purple-100 text-purple-800 border-purple-200',
            hover: 'hover:bg-purple-200',
            cross: 'hover:bg-purple-200',
        },
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
                setIsCreating(false);
                setSearchTerm('');
                setNewName('');
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () =>
                document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    const handleCreateNew = async () => {
        if (newName.trim()) {
            try {
                await onCreateNew(newName.trim());
                setNewName('');
                setIsCreating(false);
                setIsOpen(false);
                setSearchTerm('');
            } catch (error) {
                console.error('Failed to create new item:', error);
            }
        }
    };

    const filteredOptions = options.filter((option) =>
        option.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    const handleChipClick = () => {
        const element = chipRef.current || buttonRef.current;
        if (element) {
            const rect = element.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY + 4,
                left: rect.left + window.scrollX,
                width: Math.max(rect.width, 300),
            });
        }
        setIsOpen(!isOpen);
    };

    return (
        <div className='relative' ref={dropdownRef}>
            {value ? (
                <div
                    ref={chipRef}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 border text-sm font-medium cursor-pointer transition-all duration-200 ${colorClasses[chipColor].chip} ${colorClasses[chipColor].hover}`}
                    style={{borderRadius: '0px !important'}}
                    onClick={handleChipClick}
                >
                    {icon}
                    <span>{value}</span>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove();
                        }}
                        className={`ml-1 p-0.5 rounded-full transition-colors duration-200 ${colorClasses[chipColor].cross}`}
                    >
                        <X size={12} />
                    </button>
                </div>
            ) : (
                <button
                    ref={buttonRef}
                    onClick={handleChipClick}
                    className='inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-500 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200'
                >
                    {icon}
                    <span>{placeholder}</span>
                    <Plus size={12} />
                </button>
            )}

            {isOpen && dropdownPosition && (
                <div
                    className='fixed z-[9999] bg-white border border-gray-200 rounded-lg shadow-xl max-h-80 overflow-hidden'
                    style={{
                        top: dropdownPosition.top,
                        left: dropdownPosition.left,
                        width: dropdownPosition.width,
                    }}
                >
                    {/* Search input */}
                    <div className='p-3 border-b border-gray-100'>
                        <div className='relative'>
                            <Search
                                size={16}
                                className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'
                            />
                            <input
                                type='text'
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder='Search options...'
                                className='w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Create new option */}
                    <div className='p-2 border-b border-gray-100 bg-gray-50'>
                        {isCreating ? (
                            <div className='flex items-center gap-2'>
                                <input
                                    type='text'
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder='Enter name...'
                                    className='flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter')
                                            handleCreateNew();
                                        if (e.key === 'Escape') {
                                            setIsCreating(false);
                                            setNewName('');
                                        }
                                    }}
                                />
                                <button
                                    onClick={handleCreateNew}
                                    className='px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 flex items-center gap-1'
                                    disabled={!newName.trim()}
                                >
                                    <Check size={14} />
                                </button>
                                <button
                                    onClick={() => {
                                        setIsCreating(false);
                                        setNewName('');
                                    }}
                                    className='px-3 py-2 text-sm bg-gray-400 text-white rounded-md hover:bg-gray-500 transition-colors duration-200'
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsCreating(true)}
                                className='flex items-center gap-2 w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors duration-200 font-medium'
                            >
                                <Plus size={14} />
                                <span>Create New</span>
                            </button>
                        )}
                    </div>

                    {/* Options list */}
                    <div className='max-h-48 overflow-y-auto'>
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => {
                                        onSelect(option.id, option.name);
                                        setIsOpen(false);
                                        setSearchTerm('');
                                    }}
                                    className={`w-full px-4 py-3 text-left text-sm hover:bg-blue-50 transition-colors duration-200 flex items-center gap-2 ${
                                        selectedId === option.id
                                            ? 'bg-blue-100 text-blue-700 font-medium'
                                            : 'text-gray-700'
                                    }`}
                                >
                                    {selectedId === option.id && (
                                        <Check
                                            size={16}
                                            className='text-blue-600'
                                        />
                                    )}
                                    <span className='flex-1'>
                                        {option.name}
                                    </span>
                                </button>
                            ))
                        ) : searchTerm ? (
                            <div className='px-4 py-6 text-center text-gray-500'>
                                <Search
                                    size={20}
                                    className='mx-auto mb-2 text-gray-400'
                                />
                                <p className='text-sm'>
                                    No results found for &quot;{searchTerm}
                                    &quot;
                                </p>
                                <button
                                    onClick={() => {
                                        setNewName(searchTerm);
                                        setIsCreating(true);
                                        setSearchTerm('');
                                    }}
                                    className='mt-2 text-sm text-blue-600 hover:text-blue-700'
                                >
                                    Create &quot;{searchTerm}&quot;
                                </button>
                            </div>
                        ) : (
                            <div className='px-4 py-6 text-center text-gray-500'>
                                <Database
                                    size={20}
                                    className='mx-auto mb-2 text-gray-400'
                                />
                                <p className='text-sm'>No options available</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// Editable multi-chip component for services
const EditableMultiChips = ({
    values,
    selectedIds,
    options,
    placeholder,
    icon,
    onServicesChange,
    onRemoveService,
    onCreateNew,
    chipColor = 'purple',
}: {
    values: string[];
    selectedIds: string[];
    options: Array<{id: string; name: string}>;
    placeholder: string;
    icon?: React.ReactNode;
    onServicesChange: (serviceIds: string[], serviceNames: string[]) => void;
    onRemoveService: (serviceId: string) => void;
    onCreateNew: (name: string) => Promise<void>;
    chipColor: 'blue' | 'green' | 'purple';
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dropdownPosition, setDropdownPosition] = useState<{
        top: number;
        left: number;
        width: number;
    } | null>(null);

    const colorClasses = {
        blue: {
            chip: 'bg-blue-100 text-blue-800 border-blue-200',
            hover: 'hover:bg-blue-200',
            cross: 'hover:bg-blue-200',
        },
        green: {
            chip: 'bg-green-100 text-green-800 border-green-200',
            hover: 'hover:bg-green-200',
            cross: 'hover:bg-green-200',
        },
        purple: {
            chip: 'bg-purple-100 text-purple-800 border-purple-200',
            hover: 'hover:bg-purple-200',
            cross: 'hover:bg-purple-200',
        },
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
                setIsCreating(false);
                setSearchTerm('');
                setNewName('');
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () =>
                document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    const handleCreateNew = async () => {
        if (newName.trim()) {
            try {
                await onCreateNew(newName.trim());
                setNewName('');
                setIsCreating(false);
                setIsOpen(false);
                setSearchTerm('');
            } catch (error) {
                console.error('Failed to create new service:', error);
            }
        }
    };

    const filteredOptions = options.filter(
        (option) =>
            option.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !selectedIds.includes(option.id),
    );

    const handleAddButtonClick = () => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY + 4,
                left: rect.left + window.scrollX,
                width: Math.max(rect.width, 300),
            });
        }
        setIsOpen(!isOpen);
    };

    const handleRemoveService = (serviceId: string) => {
        onRemoveService(serviceId);
    };

    return (
        <div className='relative' ref={dropdownRef}>
            <div
                ref={containerRef}
                className='flex flex-wrap gap-1 items-center'
            >
                {values.map((serviceName, idx) => {
                    const serviceId = selectedIds[idx];
                    return (
                        <div
                            key={serviceId || idx}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 border text-xs font-medium transition-all duration-200 ${colorClasses[chipColor].chip}`}
                            style={{borderRadius: '0px !important'}}
                        >
                            <span>{serviceName}</span>
                            <button
                                onClick={() => handleRemoveService(serviceId)}
                                className={`p-0.5 rounded-full transition-colors duration-200 ${colorClasses[chipColor].cross}`}
                            >
                                <X size={10} />
                            </button>
                        </div>
                    );
                })}

                <button
                    onClick={handleAddButtonClick}
                    className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-none border border-dashed border-gray-300 text-xs text-gray-500 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200'
                >
                    {icon}
                    <span>
                        {values.length === 0 ? placeholder : 'Add Service'}
                    </span>
                    <Plus size={10} />
                </button>
            </div>

            {isOpen && dropdownPosition && (
                <div
                    className='fixed z-[9999] bg-white border border-gray-200 rounded-lg shadow-xl max-h-80 overflow-hidden'
                    style={{
                        top: dropdownPosition.top,
                        left: dropdownPosition.left,
                        width: dropdownPosition.width,
                    }}
                >
                    {/* Search input */}
                    <div className='p-3 border-b border-gray-100'>
                        <div className='relative'>
                            <Search
                                size={16}
                                className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'
                            />
                            <input
                                type='text'
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder='Search services...'
                                className='w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Create new service */}
                    <div className='p-2 border-b border-gray-100 bg-gray-50'>
                        {isCreating ? (
                            <div className='flex items-center gap-2'>
                                <input
                                    type='text'
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder='Enter service name...'
                                    className='flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter')
                                            handleCreateNew();
                                        if (e.key === 'Escape') {
                                            setIsCreating(false);
                                            setNewName('');
                                        }
                                    }}
                                />
                                <button
                                    onClick={handleCreateNew}
                                    className='px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 flex items-center gap-1'
                                    disabled={!newName.trim()}
                                >
                                    <Check size={14} />
                                </button>
                                <button
                                    onClick={() => {
                                        setIsCreating(false);
                                        setNewName('');
                                    }}
                                    className='px-3 py-2 text-sm bg-gray-400 text-white rounded-md hover:bg-gray-500 transition-colors duration-200'
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsCreating(true)}
                                className='flex items-center gap-2 w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors duration-200 font-medium'
                            >
                                <Plus size={14} />
                                <span>Create New Service</span>
                            </button>
                        )}
                    </div>

                    {/* Services list */}
                    <div className='max-h-48 overflow-y-auto'>
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => {
                                        const newServiceIds = [
                                            ...selectedIds,
                                            option.id,
                                        ];
                                        const newServiceNames = [
                                            ...values,
                                            option.name,
                                        ];
                                        onServicesChange(
                                            newServiceIds,
                                            newServiceNames,
                                        );
                                        setIsOpen(false);
                                        setSearchTerm('');
                                    }}
                                    className='w-full px-4 py-3 text-left text-sm hover:bg-blue-50 transition-colors duration-200 flex items-center gap-2 text-gray-700'
                                >
                                    <span className='flex-1'>
                                        {option.name}
                                    </span>
                                    <Plus size={14} className='text-blue-600' />
                                </button>
                            ))
                        ) : searchTerm ? (
                            <div className='px-4 py-6 text-center text-gray-500'>
                                <Search
                                    size={20}
                                    className='mx-auto mb-2 text-gray-400'
                                />
                                <p className='text-sm'>
                                    No results found for &quot;{searchTerm}
                                    &quot;
                                </p>
                                <button
                                    onClick={() => {
                                        setNewName(searchTerm);
                                        setIsCreating(true);
                                        setSearchTerm('');
                                    }}
                                    className='mt-2 text-sm text-blue-600 hover:text-blue-700'
                                >
                                    Create &quot;{searchTerm}&quot;
                                </button>
                            </div>
                        ) : (
                            <div className='px-4 py-6 text-center text-gray-500'>
                                <Database
                                    size={20}
                                    className='mx-auto mb-2 text-gray-400'
                                />
                                <p className='text-sm'>
                                    No more services available
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default function EnterpriseLinkageTable({
    title = 'Enterprise Configuration',
    onDataChange,
}: Props) {
    const [rows, setRows] = useState<EnterpriseLinkageRow[]>([]);
    const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);

    // Advanced table features state
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{
        key: keyof EnterpriseLinkageRow | null;
        direction: 'asc' | 'desc';
    }>({key: null, direction: 'asc'});
    const [filterConfig, setFilterConfig] = useState<{
        enterprise: string;
        product: string;
        services: string[];
    }>({enterprise: '', product: '', services: []});
    const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
    const [groupBy, setGroupBy] = useState<keyof EnterpriseLinkageRow | null>(
        null,
    );
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isColumnVisibilityOpen, setIsColumnVisibilityOpen] = useState(false);
    const [isGroupByOpen, setIsGroupByOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // Load dropdown options
    const loadDropdownOptions = async () => {
        try {
            const [enterprisesRes, productsRes, servicesRes] =
                await Promise.all([
                    api.get<Enterprise[]>('/api/enterprises'),
                    api.get<Product[]>('/api/products'),
                    api.get<Service[]>('/api/services'),
                ]);

            setEnterprises(enterprisesRes || []);
            setProducts(productsRes || []);
            setServices(servicesRes || []);
        } catch (error) {
            console.error('Failed to load dropdown options:', error);
        }
    };

    // Create new enterprise
    const createEnterprise = async (name: string) => {
        try {
            const newEnterprise = await api.post<Enterprise>(
                '/api/enterprises',
                {name},
            );
            await loadDropdownOptions(); // Reload to get the new enterprise
        } catch (error) {
            console.error('Failed to create enterprise:', error);
            throw error;
        }
    };

    // Create new product
    const createProduct = async (name: string) => {
        try {
            const newProduct = await api.post<Product>('/api/products', {name});
            await loadDropdownOptions(); // Reload to get the new product
        } catch (error) {
            console.error('Failed to create product:', error);
            throw error;
        }
    };

    // Create new service
    const createService = async (name: string) => {
        try {
            const newService = await api.post<Service>('/api/services', {name});
            await loadDropdownOptions(); // Reload to get the new service
        } catch (error) {
            console.error('Failed to create service:', error);
            throw error;
        }
    };

    // Convert backend response to table row format - now with names included!
    const convertToTableRow = (
        linkage: EnterpriseLinkage,
    ): EnterpriseLinkageRow => {
        return {
            id: linkage.id,
            enterprise: linkage.enterprise.name,
            enterpriseId: linkage.enterprise.id,
            product: linkage.product.name,
            productId: linkage.product.id,
            services: linkage.services.map((s) => s.name),
            serviceIds: linkage.services.map((s) => s.id),
        };
    };

    // Load existing linkages - now with names from backend!
    const loadLinkages = async () => {
        try {
            // Load linkages from API - backend now returns names!
            const linkagesRes = await api.get<EnterpriseLinkage[]>(
                '/api/enterprise-products-services',
            );

            // Convert to table row format - simple mapping since names are included
            const linkageRows: EnterpriseLinkageRow[] = (linkagesRes || []).map(
                convertToTableRow,
            );

            // Remove duplicates based on enterprise + product + services combination
            const uniqueRows = linkageRows.filter((row, index, self) => {
                const rowKey = `${row.enterpriseId}-${
                    row.productId
                }-${row.serviceIds.sort().join(',')}`;
                return (
                    index ===
                    self.findIndex((r) => {
                        const rKey = `${r.enterpriseId}-${
                            r.productId
                        }-${r.serviceIds.sort().join(',')}`;
                        return rKey === rowKey;
                    })
                );
            });

            setRows(uniqueRows);
        } catch (error) {
            console.error('Failed to load linkages:', error);
            setRows([]);
        }
    };

    // Save a linkage (backend expects IDs, returns names)
    const saveLinkage = async (row: EnterpriseLinkageRow) => {
        try {
            const payload = {
                enterpriseId: row.enterpriseId,
                productId: row.productId,
                serviceIds: row.serviceIds, // Always an array
            };

            let savedLinkage: {id: string} | null = null;

            // Check if there's already a record for this enterprise-product combination
            const existingRecord = rows.find(
                (r) =>
                    r.enterpriseId === row.enterpriseId &&
                    r.productId === row.productId &&
                    r.id !== row.id &&
                    !r.isNew,
            );

            if (existingRecord) {
                console.log(
                    '🔄 Found existing enterprise-product record, updating services:',
                    {
                        existingId: existingRecord.id,
                        currentServices: existingRecord.serviceIds,
                        newServices: row.serviceIds,
                    },
                );

                // Merge the services from both records
                const mergedServiceIds = Array.from(
                    new Set([...existingRecord.serviceIds, ...row.serviceIds]),
                );

                const mergedServiceNames = mergedServiceIds.map((serviceId) => {
                    // Find the service name from either the existing or new row
                    const existingServiceIndex =
                        existingRecord.serviceIds.indexOf(serviceId);
                    const newServiceIndex = row.serviceIds.indexOf(serviceId);

                    if (existingServiceIndex !== -1) {
                        return existingRecord.services[existingServiceIndex];
                    } else if (newServiceIndex !== -1) {
                        return row.services[newServiceIndex];
                    } else {
                        // Fallback: find from services list
                        const service = services.find(
                            (s) => s.id === serviceId,
                        );
                        return service ? service.name : serviceId;
                    }
                });

                // Update the existing record with merged services
                savedLinkage = await api.put<{id: string}>(
                    `/api/enterprise-products-services/${existingRecord.id}`,
                    {
                        enterpriseId: row.enterpriseId,
                        productId: row.productId,
                        serviceIds: mergedServiceIds,
                    },
                );

                console.log(
                    '✅ Updated existing enterprise-product record with merged services:',
                    {
                        id: existingRecord.id,
                        serviceIds: mergedServiceIds,
                    },
                );

                // Update both rows in the UI: merge into existing, remove the current row
                setRows((prevRows) => {
                    return prevRows
                        .map((r) => {
                            if (r.id === existingRecord.id) {
                                // Update the existing record with merged services
                                return {
                                    ...r,
                                    serviceIds: mergedServiceIds,
                                    services: mergedServiceNames,
                                    isSaving: false,
                                };
                            }
                            return r;
                        })
                        .filter((r) => r.id !== row.id); // Remove the duplicate row
                });
            } else {
                // No existing record, proceed with normal create/update logic
                if (row.isNew || row.id.startsWith('temp-')) {
                    // Create new linkage
                    savedLinkage = await api.post<{id: string}>(
                        '/api/enterprise-products-services',
                        payload,
                    );
                    console.log('✅ Created new linkage:', payload);
                } else {
                    // Update existing linkage
                    savedLinkage = await api.put<{id: string}>(
                        `/api/enterprise-products-services/${row.id}`,
                        payload,
                    );
                    console.log('✅ Updated existing linkage:', payload);
                }

                // Update the row state
                if (savedLinkage && savedLinkage.id) {
                    setRows((prevRows) =>
                        prevRows.map((r) =>
                            r.id === row.id
                                ? {
                                      ...r,
                                      id: savedLinkage!.id,
                                      isNew: false,
                                      isEditing: false,
                                      isSaving: false,
                                  }
                                : r,
                        ),
                    );
                } else {
                    // Fallback: just mark as saved without updating ID
                    setRows((prevRows) =>
                        prevRows.map((r) =>
                            r.id === row.id
                                ? {
                                      ...r,
                                      isNew: false,
                                      isEditing: false,
                                      isSaving: false,
                                  }
                                : r,
                        ),
                    );
                }
            }

            onDataChange?.();
        } catch (error) {
            console.error('Failed to save linkage:', error);
            // Reset the saving state on error
            setRows((prevRows) =>
                prevRows.map((r) =>
                    r.id === row.id
                        ? {
                              ...r,
                              isSaving: false,
                          }
                        : r,
                ),
            );
            throw error;
        }
    };

    // Delete a linkage
    const deleteLinkage = async (linkageId: string) => {
        try {
            await api.del(`/api/enterprise-products-services/${linkageId}`);

            // Remove the row from local state instead of reloading
            setRows((prevRows) =>
                prevRows.filter((row) => row.id !== linkageId),
            );
            onDataChange?.();
        } catch (error) {
            console.error('Failed to delete linkage:', error);
        }
    };

    // Check if there's a blank row that needs to be completed
    const hasBlankRow = useMemo(() => {
        return rows.some(
            (row) =>
                row.isNew &&
                (!row.enterpriseId ||
                    !row.productId ||
                    row.serviceIds.length === 0),
        );
    }, [rows]);

    // Add new row at the bottom
    const addNewRow = () => {
        // Check if there's already a blank row (new row without all required fields)
        const existingBlankRow = rows.find(
            (row) =>
                row.isNew &&
                (!row.enterpriseId ||
                    !row.productId ||
                    row.serviceIds.length === 0),
        );

        if (existingBlankRow) {
            console.log('⚠️ Cannot add new row: Blank row already exists', {
                blankRowId: existingBlankRow.id,
                enterprise: existingBlankRow.enterprise,
                product: existingBlankRow.product,
                services: existingBlankRow.services,
            });
            return; // Prevent adding new row
        }

        console.log('✅ Adding new blank row');
        const newRow: EnterpriseLinkageRow = {
            id: `new-${Date.now()}`,
            enterprise: '',
            enterpriseId: '',
            product: '',
            productId: '',
            services: [],
            serviceIds: [],
            isEditing: true,
            isNew: true,
        };
        setRows([...rows, newRow]);
    };

    // Update row field with autosave
    const updateRow = (
        rowId: string,
        updates: Partial<EnterpriseLinkageRow>,
    ) => {
        console.log('🔧 updateRow called:', {
            rowId,
            updates,
            timestamp: new Date().toISOString(),
        });

        setRows((prevRows) => {
            return prevRows.map((row) => {
                if (row.id === rowId) {
                    const updatedRow = {...row, ...updates};

                    console.log('📝 Row updated:', {
                        id: updatedRow.id,
                        isNew: updatedRow.isNew,
                        enterpriseId: updatedRow.enterpriseId,
                        productId: updatedRow.productId,
                        serviceIds: updatedRow.serviceIds,
                        isSaving: updatedRow.isSaving,
                    });

                    // Check for duplicate enterprise-product combination before saving
                    if (updatedRow.enterpriseId && updatedRow.productId) {
                        const duplicateRow = prevRows.find(
                            (r) =>
                                r.enterpriseId === updatedRow.enterpriseId &&
                                r.productId === updatedRow.productId &&
                                r.id !== updatedRow.id &&
                                !r.isNew,
                        );

                        if (duplicateRow) {
                            console.log(
                                '⚠️ Duplicate enterprise-product combination detected:',
                                {
                                    existingRowId: duplicateRow.id,
                                    currentRowId: updatedRow.id,
                                    enterprise: updatedRow.enterprise,
                                    product: updatedRow.product,
                                },
                            );

                            // If services are being added, trigger merge process
                            if (updatedRow.serviceIds.length > 0) {
                                console.log(
                                    '🔄 Will merge services into existing record',
                                );
                            }
                        }
                    }

                    // Auto-save if all required fields are filled (for both new and existing rows)
                    if (
                        updatedRow.enterpriseId &&
                        updatedRow.productId &&
                        updatedRow.serviceIds.length > 0 &&
                        !updatedRow.isSaving // Prevent multiple saves
                    ) {
                        console.log(
                            '💾 Triggering auto-save for row:',
                            updatedRow.id,
                        );

                        // Mark as saving to prevent duplicate saves
                        const savingRow = {
                            ...updatedRow,
                            isSaving: true,
                        };

                        // Auto-save after a delay
                        setTimeout(() => autoSave(savingRow), 500);
                        return savingRow;
                    }

                    return updatedRow;
                }
                return row;
            });
        });
    };

    // Autosave functionality
    const autoSave = async (row: EnterpriseLinkageRow) => {
        console.log('🔄 Auto-save triggered for row:', {
            id: row.id,
            isNew: row.isNew,
            enterprise: row.enterprise,
            product: row.product,
            services: row.services,
            enterpriseId: row.enterpriseId,
            productId: row.productId,
            serviceIds: row.serviceIds,
        });

        try {
            await saveLinkage(row);
            console.log('✅ Auto-save completed successfully for row:', row.id);
        } catch (error) {
            console.error('❌ Auto-save failed for row:', row.id, error);
        }
    };

    // Filtering, sorting, and search logic
    const filteredAndSortedRows = useMemo(() => {
        let filtered = rows.filter((row) => {
            // Search filter
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                const matchesSearch =
                    row.enterprise.toLowerCase().includes(searchLower) ||
                    row.product.toLowerCase().includes(searchLower) ||
                    row.services.some((service) =>
                        service.toLowerCase().includes(searchLower),
                    );
                if (!matchesSearch) return false;
            }

            // Column filters
            if (
                filterConfig.enterprise &&
                row.enterprise !== filterConfig.enterprise
            )
                return false;
            if (filterConfig.product && row.product !== filterConfig.product)
                return false;
            if (filterConfig.services.length > 0) {
                const hasMatchingService = filterConfig.services.some(
                    (filterService) => row.services.includes(filterService),
                );
                if (!hasMatchingService) return false;
            }

            return true;
        });

        // Sorting
        if (sortConfig.key) {
            filtered = [...filtered].sort((a, b) => {
                const aVal = a[sortConfig.key!];
                const bVal = b[sortConfig.key!];

                let comparison = 0;
                if (Array.isArray(aVal) && Array.isArray(bVal)) {
                    comparison = aVal.length - bVal.length;
                } else if (
                    typeof aVal === 'string' &&
                    typeof bVal === 'string'
                ) {
                    comparison = aVal.localeCompare(bVal);
                }

                return sortConfig.direction === 'desc'
                    ? -comparison
                    : comparison;
            });
        }

        return filtered;
    }, [rows, searchTerm, sortConfig, filterConfig]);

    // Column management
    const columns = [
        {
            key: 'enterprise' as keyof EnterpriseLinkageRow,
            label: 'Enterprise',
            icon: Building2,
        },
        {
            key: 'product' as keyof EnterpriseLinkageRow,
            label: 'Product',
            icon: Package,
        },
        {
            key: 'services' as keyof EnterpriseLinkageRow,
            label: 'Services',
            icon: Globe,
        },
    ];

    const visibleColumns = columns.filter(
        (col) => !hiddenColumns.includes(col.key),
    );

    // Sorting functions
    const handleSort = (key: keyof EnterpriseLinkageRow) => {
        setSortConfig((current) => ({
            key,
            direction:
                current.key === key && current.direction === 'asc'
                    ? 'desc'
                    : 'asc',
        }));
    };

    // Column visibility toggle
    const toggleColumnVisibility = (columnKey: string) => {
        setHiddenColumns((current) =>
            current.includes(columnKey)
                ? current.filter((key) => key !== columnKey)
                : [...current, columnKey],
        );
    };

    // Cancel editing
    const cancelEdit = (rowId: string) => {
        setRows(rows.filter((row) => !(row.id === rowId && row.isNew)));
    };

    // Save row
    const saveRow = async (rowId: string) => {
        const row = rows.find((r) => r.id === rowId);
        if (
            !row ||
            !row.enterpriseId ||
            !row.productId ||
            row.serviceIds.length === 0
        ) {
            alert('Please fill all required fields');
            return;
        }

        try {
            await saveLinkage(row);
        } catch (error) {
            alert('Failed to save linkage');
        }
    };

    // Load data - now much simpler since backend returns names!
    useEffect(() => {
        const loadData = async () => {
            try {
                // Load dropdown options for the selection dropdowns
                await loadDropdownOptions();

                // Load linkages (which now include names from backend)
                await loadLinkages();
            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    if (loading) {
        return (
            <div className='flex items-center justify-center p-8'>
                <div className='text-gray-500'>Loading...</div>
            </div>
        );
    }

    return (
        <div className='bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden'>
            {/* Account Settings Style Toolbar - Only show if there are rows */}
            {rows.length > 0 && (
                <div className='px-6 py-3 bg-white border-b border-gray-200'>
                    <div className='flex items-center gap-3'>
                        {/* Create New Enterprise Button */}
                        <button
                            onClick={addNewRow}
                            disabled={hasBlankRow}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md shadow-sm transition-all duration-200 ${
                                hasBlankRow
                                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                    : 'text-white bg-blue-600 hover:bg-blue-700'
                            }`}
                            title={
                                hasBlankRow
                                    ? 'Complete the current row before adding a new one'
                                    : 'Create New Enterprise'
                            }
                        >
                            <Plus size={16} />
                            Create New Enterprise
                        </button>

                        {/* Search Button */}
                        <div className='relative'>
                            <button
                                onClick={() => setIsSearchOpen(!isSearchOpen)}
                                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md border transition-colors ${
                                    isSearchOpen || searchTerm
                                        ? 'bg-blue-50 text-blue-700 border-blue-300'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                <Search size={16} />
                                <span>Search</span>
                            </button>

                            {isSearchOpen && (
                                <div className='absolute top-full left-0 mt-1 w-72 bg-white border border-gray-300 rounded-lg shadow-lg z-20 p-3'>
                                    <input
                                        type='text'
                                        placeholder='Search configurations...'
                                        value={searchTerm}
                                        onChange={(e) =>
                                            setSearchTerm(e.target.value)
                                        }
                                        className='w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                        autoFocus
                                    />
                                </div>
                            )}
                        </div>

                        {/* Filter Button */}
                        <div className='relative'>
                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md border transition-colors ${
                                    isFilterOpen ||
                                    filterConfig.enterprise ||
                                    filterConfig.product ||
                                    filterConfig.services.length > 0
                                        ? 'bg-blue-50 text-blue-700 border-blue-300'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                <Filter size={16} />
                                <span>Filter</span>
                            </button>

                            {isFilterOpen && (
                                <div className='absolute top-full left-0 mt-1 w-80 bg-white border border-gray-300 rounded-lg shadow-lg z-20 p-4'>
                                    <div className='space-y-4'>
                                        <div>
                                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                                                Enterprise
                                            </label>
                                            <select
                                                value={filterConfig.enterprise}
                                                onChange={(e) =>
                                                    setFilterConfig((prev) => ({
                                                        ...prev,
                                                        enterprise:
                                                            e.target.value,
                                                    }))
                                                }
                                                className='w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500'
                                            >
                                                <option value=''>
                                                    All Enterprises
                                                </option>
                                                {enterprises.map(
                                                    (enterprise) => (
                                                        <option
                                                            key={enterprise.id}
                                                            value={
                                                                enterprise.name
                                                            }
                                                        >
                                                            {enterprise.name}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                        </div>
                                        <div>
                                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                                                Product
                                            </label>
                                            <select
                                                value={filterConfig.product}
                                                onChange={(e) =>
                                                    setFilterConfig((prev) => ({
                                                        ...prev,
                                                        product: e.target.value,
                                                    }))
                                                }
                                                className='w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500'
                                            >
                                                <option value=''>
                                                    All Products
                                                </option>
                                                {products.map((product) => (
                                                    <option
                                                        key={product.id}
                                                        value={product.name}
                                                    >
                                                        {product.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className='flex gap-2 pt-2 border-t'>
                                            <button
                                                onClick={() =>
                                                    setFilterConfig({
                                                        enterprise: '',
                                                        product: '',
                                                        services: [],
                                                    })
                                                }
                                                className='px-3 py-1 text-sm text-gray-600 hover:text-gray-800'
                                            >
                                                Clear
                                            </button>
                                            <button
                                                onClick={() =>
                                                    setIsFilterOpen(false)
                                                }
                                                className='px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700'
                                            >
                                                Apply
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sort Button */}
                        <button
                            onClick={() => handleSort('enterprise')}
                            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md border transition-colors ${
                                sortConfig.key
                                    ? 'bg-blue-50 text-blue-700 border-blue-300'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            <ArrowUpDown size={16} />
                            <span>Sort</span>
                        </button>

                        {/* Hide Button */}
                        <div className='relative'>
                            <button
                                onClick={() =>
                                    setIsColumnVisibilityOpen(
                                        !isColumnVisibilityOpen,
                                    )
                                }
                                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md border transition-colors ${
                                    hiddenColumns.length > 0
                                        ? 'bg-orange-50 text-orange-700 border-orange-300'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                {hiddenColumns.length > 0 ? (
                                    <EyeOff size={16} />
                                ) : (
                                    <Eye size={16} />
                                )}
                                <span>Hide</span>
                            </button>

                            {isColumnVisibilityOpen && (
                                <div className='absolute top-full left-0 mt-1 w-48 bg-white border border-gray-300 rounded-lg shadow-lg z-20 p-2'>
                                    {columns.map((column) => (
                                        <label
                                            key={column.key}
                                            className='flex items-center gap-2 px-2 py-1 hover:bg-gray-50 rounded cursor-pointer'
                                        >
                                            <input
                                                type='checkbox'
                                                checked={
                                                    !hiddenColumns.includes(
                                                        column.key,
                                                    )
                                                }
                                                onChange={() =>
                                                    toggleColumnVisibility(
                                                        column.key,
                                                    )
                                                }
                                                className='w-4 h-4 text-blue-600'
                                            />
                                            <column.icon
                                                size={14}
                                                className='text-gray-500'
                                            />
                                            <span className='text-sm'>
                                                {column.label}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Group by Button */}
                        <div className='relative'>
                            <button
                                onClick={() => setIsGroupByOpen(!isGroupByOpen)}
                                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md border transition-colors ${
                                    groupBy
                                        ? 'bg-purple-50 text-purple-700 border-purple-300'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                <Users size={16} />
                                <span>Group by</span>
                            </button>

                            {isGroupByOpen && (
                                <div className='absolute top-full left-0 mt-1 w-48 bg-white border border-gray-300 rounded-lg shadow-lg z-20 p-2'>
                                    <button
                                        onClick={() => {
                                            setGroupBy(null);
                                            setIsGroupByOpen(false);
                                        }}
                                        className={`w-full text-left px-2 py-1 text-sm hover:bg-gray-50 rounded ${
                                            !groupBy
                                                ? 'bg-blue-50 text-blue-700'
                                                : ''
                                        }`}
                                    >
                                        No Grouping
                                    </button>
                                    {columns.map((column) => (
                                        <button
                                            key={column.key}
                                            onClick={() => {
                                                setGroupBy(column.key);
                                                setIsGroupByOpen(false);
                                            }}
                                            className={`w-full text-left px-2 py-1 text-sm hover:bg-gray-50 rounded flex items-center gap-2 ${
                                                groupBy === column.key
                                                    ? 'bg-blue-50 text-blue-700'
                                                    : ''
                                            }`}
                                        >
                                            <column.icon size={14} />
                                            <span>{column.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Views Button */}
                        <button className='flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors'>
                            <span>Views</span>
                        </button>

                        {/* More options */}
                        <button className='p-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors'>
                            <MoreHorizontal size={16} />
                        </button>

                        {/* Configuration count on the right */}
                        <div className='ml-auto text-sm text-gray-500 font-medium'>
                            {
                                filteredAndSortedRows.filter(
                                    (row) => !row.isNew,
                                ).length
                            }{' '}
                            configurations
                        </div>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {rows.length === 0 && !loading && (
                <div className='bg-white border border-gray-200 rounded-lg p-12'>
                    <div className='text-center'>
                        <div className='mx-auto w-24 h-24 bg-blue-100 rounded-2xl flex items-center justify-center mb-6'>
                            <Building2 size={48} className='text-blue-600' />
                        </div>
                        <h3 className='text-xl font-semibold text-gray-900 mb-2'>
                            No Enterprise Configurations
                        </h3>
                        <p className='text-gray-500 mb-6 max-w-md mx-auto'>
                            Create your first enterprise-product-service
                            configuration to get started.
                        </p>
                        <button
                            onClick={addNewRow}
                            disabled={hasBlankRow}
                            className={`inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-lg shadow-md transition-all duration-200 ${
                                hasBlankRow
                                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed shadow-sm'
                                    : 'text-white bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
                            }`}
                            title={
                                hasBlankRow
                                    ? 'Complete the current row before adding a new one'
                                    : 'Create New Enterprise'
                            }
                        >
                            <Plus size={16} />
                            Create New Enterprise
                        </button>
                    </div>
                </div>
            )}

            {/* Account Details Style Table - Only show if there are rows */}
            {rows.length > 0 && (
                <div className='bg-white border border-gray-200 rounded-lg overflow-visible'>
                    <div className='px-6 py-4 border-b border-gray-200 bg-gray-50'>
                        <h2 className='text-base font-semibold text-gray-900'>
                            Enterprise Details
                        </h2>
                    </div>

                    <div className='overflow-visible'>
                        <table className='w-full border-collapse relative'>
                            <thead className='bg-gray-50'>
                                <tr>
                                    {!hiddenColumns.includes('enterprise') && (
                                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                            <div className='flex items-center gap-2'>
                                                <Building2
                                                    size={16}
                                                    className='text-blue-600'
                                                />
                                                <span>Enterprise</span>
                                            </div>
                                        </th>
                                    )}
                                    {!hiddenColumns.includes('product') && (
                                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                            <div className='flex items-center gap-2'>
                                                <Package
                                                    size={16}
                                                    className='text-green-600'
                                                />
                                                <span>Product</span>
                                            </div>
                                        </th>
                                    )}
                                    {!hiddenColumns.includes('services') && (
                                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                            <div className='flex items-center gap-2'>
                                                <Globe
                                                    size={16}
                                                    className='text-purple-600'
                                                />
                                                <span>Services</span>
                                            </div>
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className='bg-white divide-y divide-gray-200'>
                                {filteredAndSortedRows.map((row, index) => (
                                    <tr
                                        key={row.id}
                                        className={`
                                            ${
                                                index % 2 === 0
                                                    ? 'bg-white'
                                                    : 'bg-gray-50'
                                            } hover:bg-gray-100 transition-colors duration-150
                                            ${
                                                row.isNew
                                                    ? 'bg-blue-50 hover:bg-blue-100'
                                                    : ''
                                            }
                                        `}
                                    >
                                        {!hiddenColumns.includes(
                                            'enterprise',
                                        ) && (
                                            <td className='px-6 py-4 text-sm text-gray-900 relative'>
                                                <EditableChip
                                                    value={row.enterprise}
                                                    selectedId={
                                                        row.enterpriseId
                                                    }
                                                    options={enterprises}
                                                    placeholder='Select Enterprise'
                                                    icon={
                                                        <Building2
                                                            size={14}
                                                            className='text-blue-600'
                                                        />
                                                    }
                                                    onSelect={(id, name) => {
                                                        updateRow(row.id, {
                                                            enterpriseId: id,
                                                            enterprise: name,
                                                        });
                                                    }}
                                                    onRemove={() => {
                                                        updateRow(row.id, {
                                                            enterpriseId: '',
                                                            enterprise: '',
                                                        });
                                                    }}
                                                    onCreateNew={
                                                        createEnterprise
                                                    }
                                                    chipColor='blue'
                                                />
                                            </td>
                                        )}

                                        {!hiddenColumns.includes('product') && (
                                            <td className='px-6 py-4 text-sm text-gray-900 relative'>
                                                <EditableChip
                                                    value={row.product}
                                                    selectedId={row.productId}
                                                    options={products}
                                                    placeholder='Select Product'
                                                    icon={
                                                        <Package
                                                            size={14}
                                                            className='text-green-600'
                                                        />
                                                    }
                                                    onSelect={(id, name) => {
                                                        updateRow(row.id, {
                                                            productId: id,
                                                            product: name,
                                                        });
                                                    }}
                                                    onRemove={() => {
                                                        updateRow(row.id, {
                                                            productId: '',
                                                            product: '',
                                                        });
                                                    }}
                                                    onCreateNew={createProduct}
                                                    chipColor='green'
                                                />
                                            </td>
                                        )}

                                        {!hiddenColumns.includes(
                                            'services',
                                        ) && (
                                            <td className='px-6 py-4 text-sm text-gray-900 relative'>
                                                <EditableMultiChips
                                                    values={row.services}
                                                    selectedIds={row.serviceIds}
                                                    options={services}
                                                    placeholder='Select Services'
                                                    icon={
                                                        <Globe
                                                            size={14}
                                                            className='text-purple-600'
                                                        />
                                                    }
                                                    onServicesChange={(
                                                        serviceIds,
                                                        serviceNames,
                                                    ) => {
                                                        updateRow(row.id, {
                                                            serviceIds,
                                                            services:
                                                                serviceNames,
                                                        });
                                                    }}
                                                    onRemoveService={(
                                                        serviceIdToRemove,
                                                    ) => {
                                                        const newServiceIds =
                                                            row.serviceIds.filter(
                                                                (id) =>
                                                                    id !==
                                                                    serviceIdToRemove,
                                                            );
                                                        const newServiceNames =
                                                            row.services.filter(
                                                                (_, idx) =>
                                                                    row
                                                                        .serviceIds[
                                                                        idx
                                                                    ] !==
                                                                    serviceIdToRemove,
                                                            );
                                                        updateRow(row.id, {
                                                            serviceIds:
                                                                newServiceIds,
                                                            services:
                                                                newServiceNames,
                                                        });
                                                    }}
                                                    onCreateNew={createService}
                                                    chipColor='purple'
                                                />
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Add New Row Button - Account Details Style */}
                    <div className='px-6 py-3 border-t border-gray-200 bg-white'>
                        <button
                            onClick={addNewRow}
                            disabled={hasBlankRow}
                            className={`flex items-center gap-2 text-sm font-medium transition-colors duration-150 ${
                                hasBlankRow
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : 'text-blue-600 hover:text-blue-800'
                            }`}
                            title={
                                hasBlankRow
                                    ? 'Complete the current row before adding a new one'
                                    : 'Add new row'
                            }
                        >
                            <Plus size={16} />
                            Add new row
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
