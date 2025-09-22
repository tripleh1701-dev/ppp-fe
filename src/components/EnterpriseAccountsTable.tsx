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
    FileText,
    MapPin,
    Home,
    Globe,
    User,
    Mail,
    Activity,
    Calendar,
    Shield,
    Key,
    Settings,
    Package,
    Cpu,
    CreditCard,
    Users,
    Bell,
    Phone,
    Clock,
} from 'lucide-react';
import {createPortal} from 'react-dom';
import {api} from '../utils/api';

// Chip component for dropdown selections
const SelectionChip = ({
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
            className={`inline-flex items-center px-2 py-1 text-xs font-medium border ${colorClasses[color]} mr-1 mb-1`}
            style={{borderRadius: '0px !important'}}
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

// Dropdown with chip selection
const ChipDropdown = ({
    options,
    selected,
    onSelect,
    onDeselect,
    placeholder,
    color = 'blue',
    multiple = false,
}: {
    options: Array<{id: string; name: string}>;
    selected: string[];
    onSelect: (id: string, name: string) => void;
    onDeselect: (id: string) => void;
    placeholder: string;
    color?: 'blue' | 'green' | 'purple';
    multiple?: boolean;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
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
                setSearchTerm('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
                            <SelectionChip
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
                </div>
            )}
        </div>
    );
};

export interface AccountRow {
    id: string;
    accountName: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    status?: 'Active' | 'Inactive' | '';
    servicesCount: number;
    enterpriseName?: string;
    productName?: string;
    serviceName?: string;
    servicesSummary?: string;
    globalClientName?: string;
    masterAccount?: string;
    address?: {
        addressLine1?: string;
        addressLine2?: string;
        country?: string;
        state?: string;
        city?: string;
        pincode?: string;
    };
    technical?: {
        firstName?: string;
        middleName?: string;
        lastName?: string;
        email?: string;
        status?: string;
        startDate?: string;
        endDate?: string;
        password?: string;
        technicalUser?: string;
        // legacy fields for backward compatibility
        username?: string;
    };
    licenses?: Array<{
        enterprise?: string;
        product?: string;
        service?: string;
        licenseStart?: string;
        licenseEnd?: string;
        users?: number;
        renewalNotice?: boolean;
        noticeDays?: number;
        emailTemplate?: string;
        contacts?: Array<{
            contact?: string;
            title?: string;
            email?: string;
            phone?: string;
        }>;
    }>;
}

function InlineEditableText({
    value,
    onCommit,
    placeholder,
    renderDisplay,
    className,
    dataAttr,
    onTabNext,
    onTabPrev,
}: {
    value: string;
    onCommit: (next: string) => void;
    placeholder?: string;
    renderDisplay?: (v: string) => React.ReactNode;
    className?: string;
    dataAttr?: string;
    onTabNext?: () => void;
    onTabPrev?: () => void;
}) {
    const [editing, setEditing] = React.useState(false);
    const [draft, setDraft] = React.useState<string>(value || '');
    const inputRef = React.useRef<HTMLInputElement>(null);
    React.useEffect(() => {
        if (!editing) setDraft(value || '');
    }, [value, editing]);
    React.useEffect(() => {
        if (editing) inputRef.current?.focus();
    }, [editing]);

    const commit = () => {
        const next = (draft || '').trim();
        if (next !== (value || '')) onCommit(next);
        setEditing(false);
    };
    const cancel = () => {
        setDraft(value || '');
        setEditing(false);
    };

    if (editing) {
        return (
            <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') commit();
                    if (e.key === 'Escape') cancel();
                    if (e.key === 'Tab') {
                        e.preventDefault();
                        const next = (draft || '').trim();
                        if (next !== (value || '')) onCommit(next);
                        setEditing(false);
                        if (e.shiftKey) onTabPrev && onTabPrev();
                        else onTabNext && onTabNext();
                    }
                }}
                placeholder={placeholder}
                className={`min-w-0 w-full rounded-sm border border-slate-300 bg-white px-1 py-0.5 text-[12px] focus:outline-none focus:ring-2 focus:ring-sky-200 ${
                    className || ''
                }`}
                data-inline={dataAttr || undefined}
            />
        );
    }
    const isEmpty = !value || value.length === 0;
    return (
        <span
            className={`group/ie inline-flex min-w-0 items-center truncate rounded-sm px-1 -mx-1 -my-0.5 hover:ring-1 hover:ring-slate-300 hover:bg-white/60 cursor-text ${
                className || ''
            }`}
            onClick={() => setEditing(true)}
            title={(value || '').toString()}
            data-inline={dataAttr || undefined}
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    setEditing(true);
                }
                if (e.key === 'Tab') {
                    // Let browser move focus naturally between cells when not editing
                }
            }}
        >
            {renderDisplay ? (
                renderDisplay(value || '')
            ) : isEmpty && placeholder ? (
                <span className='text-slate-400 italic'>{placeholder}</span>
            ) : (
                value || ''
            )}
        </span>
    );
}

type CatalogType = 'enterprise' | 'product' | 'service' | 'template';

// Modern dropdown option component with edit/delete functionality
function DropdownOption({
    option,
    tone,
    type,
    onSelect,
    onEdit,
    onDelete,
    isInUse = false,
}: {
    option: {id: string; name: string};
    tone: {bg: string; hover: string; text: string};
    type: CatalogType;
    onSelect: () => void;
    onEdit: (newName: string) => Promise<void>;
    onDelete: () => Promise<void>;
    isInUse?: boolean;
}) {
    const [isEditing, setIsEditing] = React.useState(false);
    const [editValue, setEditValue] = React.useState(option.name);
    const [isHovered, setIsHovered] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleSave = async () => {
        if (editValue.trim() && editValue.trim() !== option.name) {
            await onEdit(editValue.trim());
        }
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditValue(option.name);
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <motion.div
                initial={{scale: 0.98, opacity: 0}}
                animate={{scale: 1, opacity: 1}}
                className='w-full p-2 bg-white border border-blue-200 rounded-lg shadow-sm'
            >
                <div className='flex items-center gap-2'>
                    <input
                        ref={inputRef}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave();
                            if (e.key === 'Escape') handleCancel();
                        }}
                        className='flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
                        placeholder={`Edit ${type} name`}
                    />
                    <button
                        onClick={handleSave}
                        className='p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors'
                        title='Save'
                    >
                        <svg
                            className='w-4 h-4'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M5 13l4 4L19 7'
                            />
                        </svg>
                    </button>
                    <button
                        onClick={handleCancel}
                        className='p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors'
                        title='Cancel'
                    >
                        <svg
                            className='w-4 h-4'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M6 18L18 6M6 6l12 12'
                            />
                        </svg>
                    </button>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{scale: 0.98, opacity: 0}}
            animate={{scale: 1, opacity: 1}}
            whileHover={{scale: 1.02, y: -1}}
            transition={{type: 'spring', stiffness: 400, damping: 25}}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className='relative group'
        >
            <button
                onClick={onSelect}
                className={`w-full rounded-lg px-3 py-2.5 ${tone.bg} ${tone.hover} ${tone.text} transition-all duration-200 text-left font-medium shadow-sm hover:shadow-md relative overflow-hidden`}
            >
                <span className='relative z-10'>{option.name}</span>
                <div className='absolute inset-0 bg-gradient-to-r from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200' />
            </button>

            {/* Edit/Delete buttons - appear on hover */}
            <motion.div
                initial={{opacity: 0, scale: 0.9}}
                animate={{
                    opacity: isHovered ? 1 : 0,
                    scale: isHovered ? 1 : 0.9,
                }}
                transition={{duration: 0.15}}
                className='absolute top-1 right-1 flex gap-1'
            >
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsEditing(true);
                    }}
                    className='p-1 bg-white/90 hover:bg-white text-gray-600 hover:text-blue-600 rounded shadow-sm hover:shadow transition-all duration-150'
                    title='Edit'
                >
                    <svg
                        className='w-3 h-3'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                    >
                        <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                        />
                    </svg>
                </button>
                <motion.button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (isInUse) {
                            alert(
                                `Cannot delete "${option.name}" because it is currently being used in one or more table rows.`,
                            );
                            return;
                        }
                        if (
                            confirm(
                                `Are you sure you want to delete "${option.name}"? This will affect all rows using this ${type}.`,
                            )
                        ) {
                            onDelete();
                        }
                    }}
                    className={`group relative p-1.5 rounded-lg shadow-sm transition-all duration-300 transform ${
                        isInUse
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                            : 'bg-gradient-to-br from-red-50 to-red-100 hover:from-red-500 hover:to-red-600 text-red-500 hover:text-white hover:shadow-lg hover:scale-105 active:scale-95'
                    }`}
                    title={
                        isInUse
                            ? `Cannot delete - "${option.name}" is in use`
                            : 'Delete'
                    }
                    whileHover={
                        isInUse
                            ? {}
                            : {
                                  scale: 1.1,
                                  rotate: [0, -5, 5, 0],
                                  transition: {duration: 0.3},
                              }
                    }
                    whileTap={
                        isInUse
                            ? {}
                            : {
                                  scale: 0.9,
                                  transition: {duration: 0.1},
                              }
                    }
                    disabled={isInUse}
                >
                    {/* Animated background glow */}
                    <div className='absolute inset-0 bg-red-400 rounded-lg opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-300'></div>

                    {/* Enhanced trash icon with animation */}
                    <svg
                        className='w-3.5 h-3.5 relative z-10 transition-transform duration-300 group-hover:animate-pulse'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                    >
                        {/* Trash lid */}
                        <motion.path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2.5}
                            d='M4 7h16'
                            initial={{pathLength: 0}}
                            animate={{pathLength: 1}}
                            transition={{duration: 0.5, delay: 0.1}}
                        />
                        {/* Trash handle */}
                        <motion.path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2.5}
                            d='M10 11v6m4-6v6'
                            initial={{pathLength: 0}}
                            animate={{pathLength: 1}}
                            transition={{duration: 0.5, delay: 0.2}}
                        />
                        {/* Trash body */}
                        <motion.path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2.5}
                            d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7'
                            initial={{pathLength: 0}}
                            animate={{pathLength: 1}}
                            transition={{duration: 0.5, delay: 0.3}}
                        />
                        {/* Trash top */}
                        <motion.path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2.5}
                            d='M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3'
                            initial={{pathLength: 0}}
                            animate={{pathLength: 1}}
                            transition={{duration: 0.5, delay: 0.4}}
                        />
                    </svg>

                    {/* Ripple effect on click */}
                    <div className='absolute inset-0 rounded-lg opacity-0 group-active:opacity-30 bg-red-300 animate-ping'></div>
                </motion.button>
            </motion.div>
        </motion.div>
    );
}

// Multi-select component specifically for services
function ServicesMultiSelect({
    value,
    onChange,
    placeholder = 'Select Services',
    onDropdownOptionUpdate,
    onNewItemCreated,
    accounts = [],
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    onDropdownOptionUpdate?: (
        type: 'enterprises' | 'products' | 'services',
        action: 'update' | 'delete',
        oldName: string,
        newName?: string,
    ) => Promise<void>;
    onNewItemCreated?: (
        type: 'enterprises' | 'products' | 'services',
        item: {id: string; name: string},
    ) => void;
    accounts?: AccountRow[];
}) {
    const [open, setOpen] = React.useState(false);
    const [query, setQuery] = React.useState('');
    const [options, setOptions] = React.useState<{id: string; name: string}[]>(
        [],
    );
    const [loading, setLoading] = React.useState(false);
    const [adding, setAdding] = React.useState('');
    const [showAdder, setShowAdder] = React.useState(false);

    // Helper function to check if a service is in use
    const isServiceInUse = React.useCallback(
        (serviceName: string): boolean => {
            if (!accounts || accounts.length === 0) return false;

            return accounts.some((account) => {
                const services =
                    account.address?.country?.split(', ').filter(Boolean) || [];
                return services.includes(serviceName);
            });
        },
        [accounts],
    );

    const containerRef = React.useRef<HTMLDivElement>(null);
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const [dropdownPos, setDropdownPos] = React.useState<{
        top: number;
        left: number;
        width: number;
    } | null>(null);

    // Parse selected services from comma-separated string
    const selectedServices = React.useMemo(() => {
        return value
            ? value
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean)
            : [];
    }, [value]);

    // Responsive display logic
    const [visibleCount, setVisibleCount] = React.useState(2);

    React.useEffect(() => {
        const updateVisibleCount = () => {
            if (typeof window === 'undefined') return;
            const width = window.innerWidth;
            if (width >= 1280) {
                // xl screens
                setVisibleCount(4);
            } else if (width >= 768) {
                // md screens
                setVisibleCount(3);
            } else {
                // sm screens
                setVisibleCount(2);
            }
        };

        updateVisibleCount();
        if (typeof window !== 'undefined') {
            window.addEventListener('resize', updateVisibleCount);
            return () =>
                window.removeEventListener('resize', updateVisibleCount);
        }
    }, []);

    const loadOptions = React.useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.get<Array<{id: string; name: string}>>(
                `/api/services${
                    query ? `?search=${encodeURIComponent(query)}` : ''
                }`,
            );
            // Filter out already selected services
            const filteredData = (data || []).filter(
                (option) => !selectedServices.includes(option.name),
            );
            setOptions(filteredData);
        } catch (_e) {
            setOptions([]);
        } finally {
            setLoading(false);
        }
    }, [query, selectedServices]);

    React.useEffect(() => {
        if (!open) return;
        loadOptions();
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect && typeof window !== 'undefined') {
            const width = 256;
            const left = Math.max(
                8,
                Math.min(window.innerWidth - width - 8, rect.left),
            );
            const top = Math.min(window.innerHeight - 16, rect.bottom + 8);
            setDropdownPos({top, left, width});
        }
    }, [open, loadOptions]);

    React.useEffect(() => {
        const onDoc = (e: MouseEvent) => {
            const target = e.target as Node;
            const withinAnchor = !!containerRef.current?.contains(target);
            const withinDropdown = !!dropdownRef.current?.contains(target);
            if (!withinAnchor && !withinDropdown) {
                setOpen(false);
                setShowAdder(false);
                setAdding('');
            }
        };
        document.addEventListener('click', onDoc, true);
        return () => document.removeEventListener('click', onDoc, true);
    }, []);

    const addNew = async () => {
        const name = (adding || query || '').trim();
        if (!name) return;

        // Check for existing entries (case-insensitive)
        const existingMatch = options.find(
            (opt) => opt.name.toLowerCase() === name.toLowerCase(),
        );

        if (existingMatch) {
            // If exact match exists, add it to selection instead of creating new
            toggleService(existingMatch.name);
            setShowAdder(false);
            setAdding('');
            setQuery('');
            return;
        }

        try {
            const created = await api.post<{id: string; name: string}>(
                '/api/services',
                {name},
            );
            if (created) {
                setOptions((prev) => {
                    const exists = prev.some((o) => o.id === created!.id);
                    return exists ? prev : [...prev, created!];
                });
                // Automatically add the new service to selection
                toggleService(created.name);
                setShowAdder(false);
                setAdding('');
                setQuery('');

                // Notify parent component about the new item
                if (onNewItemCreated) {
                    onNewItemCreated('services', created);
                }
            }
        } catch (error: any) {
            // Handle duplicate error from backend
            if (
                error?.message?.includes('already exists') ||
                error?.message?.includes('duplicate')
            ) {
                // Try to find the existing item and add it to selection
                const existingItem = options.find(
                    (opt) => opt.name.toLowerCase() === name.toLowerCase(),
                );
                if (existingItem) {
                    toggleService(existingItem.name);
                }
            }
            setShowAdder(false);
            setAdding('');
            setQuery('');
        }
    };

    const toggleService = (serviceName: string) => {
        const isSelected = selectedServices.includes(serviceName);
        let newServices;
        if (isSelected) {
            newServices = selectedServices.filter((s) => s !== serviceName);
        } else {
            newServices = [...selectedServices, serviceName];
        }
        onChange(newServices.join(', '));
    };

    const removeService = (serviceName: string) => {
        const newServices = selectedServices.filter((s) => s !== serviceName);
        onChange(newServices.join(', '));
    };

    return (
        <div
            ref={containerRef}
            className='relative min-w-0 flex items-center gap-1 group/item'
            style={{maxWidth: '100%'}}
        >
            <div className='flex items-center gap-1 min-w-0 overflow-hidden'>
                {selectedServices
                    .slice(0, visibleCount)
                    .map((service, index) => (
                        <motion.span
                            key={service}
                            initial={{scale: 0.95, opacity: 0}}
                            animate={{scale: 1, opacity: 1}}
                            whileHover={{
                                y: -1,
                                boxShadow: '0 1px 6px rgba(15,23,42,0.15)',
                            }}
                            transition={{
                                type: 'spring',
                                stiffness: 480,
                                damping: 30,
                            }}
                            className='inline-flex items-center gap-1 px-1.5 py-[2px] text-[10px] leading-[12px] border max-w-full min-w-0 overflow-hidden whitespace-nowrap text-ellipsis bg-rose-50 text-rose-800 border-rose-200 flex-shrink-0'
                            style={{borderRadius: '0px !important'}}
                            title={service}
                        >
                            <span className='h-1.5 w-1.5 rounded-full flex-shrink-0 bg-rose-400'></span>
                            <span className='truncate'>{service}</span>
                            <button
                                onClick={() => removeService(service)}
                                className='ml-1 hover:text-slate-900 opacity-0 group-hover/item:opacity-100 transition-opacity'
                                aria-label='Remove'
                            >
                                <X className='h-3 w-3' />
                            </button>
                        </motion.span>
                    ))}
                {selectedServices.length > visibleCount && (
                    <span
                        className='inline-flex items-center gap-1 rounded-full px-1.5 py-[2px] text-[10px] leading-[12px] border bg-slate-50 text-slate-600 border-slate-200 flex-shrink-0 cursor-help'
                        title={`+${
                            selectedServices.length - visibleCount
                        } more: ${selectedServices
                            .slice(visibleCount)
                            .join(', ')}`}
                    >
                        +{selectedServices.length - visibleCount}
                    </span>
                )}
                <button
                    onClick={() => setOpen((s) => !s)}
                    className='text-left px-2 py-0.5 text-[12px] rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-500'
                >
                    {selectedServices.length === 0 ? placeholder : '+ Add more'}
                </button>
            </div>

            {open &&
                dropdownPos &&
                createPortal(
                    <div
                        ref={dropdownRef}
                        className='z-[9999] rounded-xl border border-slate-200 bg-white shadow-2xl'
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            position: 'fixed',
                            top: dropdownPos.top,
                            left: dropdownPos.left,
                            width: dropdownPos.width,
                        }}
                    >
                        <div className='absolute -top-2 left-6 h-3 w-3 rotate-45 bg-white border-t border-l border-slate-200'></div>
                        <div className='p-2 border-b border-slate-200'>
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={async (e) => {
                                    if (e.key === 'Enter' && query.trim()) {
                                        const hasExactMatch = options.some(
                                            (opt) =>
                                                opt.name.toLowerCase() ===
                                                query.toLowerCase(),
                                        );

                                        if (!hasExactMatch) {
                                            try {
                                                const created = await api.post<{
                                                    id: string;
                                                    name: string;
                                                }>('/api/services', {
                                                    name: query.trim(),
                                                });
                                                if (created) {
                                                    setOptions((prev) => [
                                                        ...prev,
                                                        created,
                                                    ]);
                                                    toggleService(created.name);
                                                    setQuery('');
                                                    setOpen(false);
                                                }
                                            } catch (error) {
                                                console.error(
                                                    'Failed to create service:',
                                                    error,
                                                );
                                            }
                                        }
                                    }
                                }}
                                placeholder='Search services (Press Enter to add new)'
                                className='w-full rounded border border-slate-300 px-2 py-1 text-[12px]'
                            />
                        </div>
                        <div className='max-h-60 overflow-auto text-[12px] px-3 py-2 space-y-2'>
                            {loading ? (
                                <div className='px-3 py-2 text-slate-500'>
                                    Loading…
                                </div>
                            ) : (
                                (() => {
                                    const filteredOptions = options.filter(
                                        (opt) =>
                                            query
                                                ? opt.name
                                                      .toLowerCase()
                                                      .includes(
                                                          query.toLowerCase(),
                                                      )
                                                : true,
                                    );

                                    const hasExactMatch =
                                        query &&
                                        options.some(
                                            (opt) =>
                                                opt.name.toLowerCase() ===
                                                query.toLowerCase(),
                                        );

                                    const showAddNew =
                                        query.trim() &&
                                        !hasExactMatch &&
                                        filteredOptions.length === 0;

                                    if (showAddNew) {
                                        return (
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const created =
                                                            await api.post<{
                                                                id: string;
                                                                name: string;
                                                            }>(
                                                                '/api/services',
                                                                {
                                                                    name: query.trim(),
                                                                },
                                                            );
                                                        if (created) {
                                                            setOptions(
                                                                (prev) => [
                                                                    ...prev,
                                                                    created,
                                                                ],
                                                            );
                                                            toggleService(
                                                                created.name,
                                                            );
                                                            setQuery('');
                                                            setOpen(false);
                                                        }
                                                    } catch (error) {
                                                        console.error(
                                                            'Failed to create service:',
                                                            error,
                                                        );
                                                    }
                                                }}
                                                className='w-full flex items-center gap-2 px-3 py-2 text-left rounded-md hover:bg-slate-50 border border-dashed border-slate-300 hover:border-blue-400 transition-all'
                                            >
                                                <div className='flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white'>
                                                    <Plus className='h-3 w-3' />
                                                </div>
                                                <div className='flex-1'>
                                                    <span className='text-sm text-blue-600 font-medium'>
                                                        Add &quot;{query}&quot;
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    }

                                    if (filteredOptions.length === 0) {
                                        return (
                                            <div className='px-3 py-2 text-slate-500 text-center'>
                                                No matches
                                            </div>
                                        );
                                    }

                                    return filteredOptions.map((opt, idx) => {
                                        const isSelected =
                                            selectedServices.includes(opt.name);
                                        const palette = [
                                            {
                                                bg: 'bg-rose-500',
                                                hover: 'hover:bg-rose-400',
                                                text: 'text-white',
                                            },
                                            {
                                                bg: 'bg-indigo-500',
                                                hover: 'hover:bg-indigo-400',
                                                text: 'text-white',
                                            },
                                            {
                                                bg: 'bg-teal-500',
                                                hover: 'hover:bg-teal-400',
                                                text: 'text-white',
                                            },
                                            {
                                                bg: 'bg-fuchsia-500',
                                                hover: 'hover:bg-fuchsia-400',
                                                text: 'text-white',
                                            },
                                        ];
                                        const tone =
                                            palette[idx % palette.length];

                                        return (
                                            <DropdownOption
                                                key={opt.id}
                                                option={opt}
                                                tone={tone}
                                                type='service'
                                                isInUse={isServiceInUse(
                                                    opt.name,
                                                )}
                                                onSelect={() =>
                                                    toggleService(opt.name)
                                                }
                                                onEdit={async (newName) => {
                                                    try {
                                                        // Update via API
                                                        await api.put(
                                                            `/api/services/${opt.id}`,
                                                            {
                                                                name: newName,
                                                            },
                                                        );

                                                        // Update local options
                                                        setOptions((prev) =>
                                                            prev.map((o) =>
                                                                o.id === opt.id
                                                                    ? {
                                                                          ...o,
                                                                          name: newName,
                                                                      }
                                                                    : o,
                                                            ),
                                                        );

                                                        // Update selected services if this one was selected
                                                        if (
                                                            selectedServices.includes(
                                                                opt.name,
                                                            )
                                                        ) {
                                                            const updatedServices =
                                                                selectedServices.map(
                                                                    (s) =>
                                                                        s ===
                                                                        opt.name
                                                                            ? newName
                                                                            : s,
                                                                );
                                                            onChange(
                                                                updatedServices.join(
                                                                    ', ',
                                                                ),
                                                            );
                                                        }

                                                        // Notify parent component to update all rows
                                                        if (
                                                            onDropdownOptionUpdate
                                                        ) {
                                                            await onDropdownOptionUpdate(
                                                                'services',
                                                                'update',
                                                                opt.name,
                                                                newName,
                                                            );
                                                        }
                                                    } catch (error) {
                                                        console.error(
                                                            'Failed to update service:',
                                                            error,
                                                        );
                                                    }
                                                }}
                                                onDelete={async () => {
                                                    try {
                                                        // Delete via API
                                                        await api.del(
                                                            `/api/services/${opt.id}`,
                                                        );

                                                        // Remove from local options
                                                        setOptions((prev) =>
                                                            prev.filter(
                                                                (o) =>
                                                                    o.id !==
                                                                    opt.id,
                                                            ),
                                                        );

                                                        // Remove from selected services if it was selected
                                                        if (
                                                            selectedServices.includes(
                                                                opt.name,
                                                            )
                                                        ) {
                                                            const updatedServices =
                                                                selectedServices.filter(
                                                                    (s) =>
                                                                        s !==
                                                                        opt.name,
                                                                );
                                                            onChange(
                                                                updatedServices.join(
                                                                    ', ',
                                                                ),
                                                            );
                                                        }

                                                        // Notify parent component to update all rows
                                                        if (
                                                            onDropdownOptionUpdate
                                                        ) {
                                                            await onDropdownOptionUpdate(
                                                                'services',
                                                                'delete',
                                                                opt.name,
                                                            );
                                                        }
                                                    } catch (error) {
                                                        console.error(
                                                            'Failed to delete service:',
                                                            error,
                                                        );
                                                    }
                                                }}
                                            />
                                        );
                                    });
                                })()
                            )}
                        </div>
                        <div className='border-t border-slate-200 px-3 py-2'>
                            <button
                                onClick={() => {
                                    setAdding('');
                                    setShowAdder(true);
                                }}
                                className='group w-full text-left text-[12px] text-slate-700 hover:text-slate-900 flex items-center gap-2'
                            >
                                <Plus className='h-3.5 w-3.5' />
                                <span className='inline-block max-w-0 overflow-hidden whitespace-nowrap -translate-x-1 opacity-0 group-hover:max-w-xs group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-200'>
                                    Add new service
                                </span>
                            </button>
                            {showAdder && (
                                <div className='mt-2 overflow-hidden'>
                                    {(() => {
                                        const similarMatch = adding.trim()
                                            ? options.find(
                                                  (opt) =>
                                                      opt.name.toLowerCase() ===
                                                      adding
                                                          .trim()
                                                          .toLowerCase(),
                                              )
                                            : null;

                                        return (
                                            <>
                                                <div className='flex items-center gap-2'>
                                                    <motion.input
                                                        initial={{
                                                            x: -12,
                                                            opacity: 0,
                                                        }}
                                                        animate={{
                                                            x: 0,
                                                            opacity: 1,
                                                        }}
                                                        transition={{
                                                            type: 'spring',
                                                            stiffness: 420,
                                                            damping: 28,
                                                        }}
                                                        value={adding}
                                                        onChange={(e) =>
                                                            setAdding(
                                                                e.target.value,
                                                            )
                                                        }
                                                        onKeyDown={(e) => {
                                                            if (
                                                                e.key ===
                                                                'Enter'
                                                            )
                                                                addNew();
                                                            if (
                                                                e.key ===
                                                                'Escape'
                                                            )
                                                                setShowAdder(
                                                                    false,
                                                                );
                                                        }}
                                                        placeholder='Enter service name'
                                                        className={`flex-1 rounded border px-2 py-1 text-[12px] ${
                                                            similarMatch
                                                                ? 'border-amber-400 bg-amber-50'
                                                                : 'border-slate-300'
                                                        }`}
                                                    />
                                                    <button
                                                        onClick={addNew}
                                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[12px] ${
                                                            similarMatch
                                                                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                                                : 'bg-violet-600 hover:bg-violet-700 text-white'
                                                        }`}
                                                    >
                                                        {similarMatch
                                                            ? 'Add Existing'
                                                            : 'Add'}
                                                    </button>
                                                </div>
                                                {similarMatch && (
                                                    <motion.div
                                                        initial={{
                                                            opacity: 0,
                                                            height: 0,
                                                        }}
                                                        animate={{
                                                            opacity: 1,
                                                            height: 'auto',
                                                        }}
                                                        className='mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-800'
                                                    >
                                                        <span className='font-medium'>
                                                            ⚠️ Similar service
                                                            exists:
                                                        </span>{' '}
                                                        &quot;
                                                        {similarMatch.name}
                                                        &quot;
                                                        <br />
                                                        <span className='text-amber-600'>
                                                            Click &quot;Add
                                                            Existing&quot; to
                                                            select it instead of
                                                            creating a
                                                            duplicate.
                                                        </span>
                                                    </motion.div>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>
                    </div>,
                    document.body,
                )}
        </div>
    );
}

function AsyncChipSelect({
    type,
    value,
    onChange,
    placeholder,
    compact,
    onDropdownOptionUpdate,
    onNewItemCreated,
    accounts = [],
}: {
    type: CatalogType;
    value?: string;
    onChange: (next?: string) => void;
    placeholder?: string;
    compact?: boolean;
    onDropdownOptionUpdate?: (
        type: 'enterprises' | 'products' | 'services',
        action: 'update' | 'delete',
        oldName: string,
        newName?: string,
    ) => Promise<void>;
    onNewItemCreated?: (
        type: 'enterprises' | 'products' | 'services',
        item: {id: string; name: string},
    ) => void;
    accounts?: AccountRow[];
}) {
    const [open, setOpen] = React.useState(false);
    const [current, setCurrent] = React.useState<string | undefined>(value);
    const [query, setQuery] = React.useState('');
    const [options, setOptions] = React.useState<{id: string; name: string}[]>(
        [],
    );
    const [loading, setLoading] = React.useState(false);
    const [adding, setAdding] = React.useState('');
    const [showAdder, setShowAdder] = React.useState(false);

    // Helper function to check if an option is in use
    const isOptionInUse = React.useCallback(
        (optionName: string): boolean => {
            if (!accounts || accounts.length === 0) return false;

            return accounts.some((account) => {
                if (type === 'enterprise') {
                    return (
                        account.masterAccount === optionName ||
                        account.enterpriseName === optionName
                    );
                } else if (type === 'product') {
                    return (
                        account.accountName === optionName ||
                        account.productName === optionName
                    );
                } else if (type === 'service') {
                    const services =
                        account.address?.country?.split(', ').filter(Boolean) ||
                        [];
                    return services.includes(optionName);
                }
                return false;
            });
        },
        [accounts, type],
    );

    const containerRef = React.useRef<HTMLDivElement>(null);
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const [dropdownPos, setDropdownPos] = React.useState<{
        top: number;
        left: number;
        width: number;
    } | null>(null);
    // Inline adder inside dropdown (no separate portal positioning)

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
                // reuse products API for templates, or switch to dedicated endpoint if available
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
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect && typeof window !== 'undefined') {
            const width = 256;
            const left = Math.max(
                8,
                Math.min(window.innerWidth - width - 8, rect.left),
            );
            const top = Math.min(window.innerHeight - 16, rect.bottom + 8);
            setDropdownPos({top, left, width});
        }
    }, [open, loadOptions]);
    // Note: search filters locally; do not refetch on query

    React.useEffect(() => {
        const onDoc = (e: MouseEvent) => {
            const target = e.target as Node;
            const withinAnchor = !!containerRef.current?.contains(target);
            const withinDropdown = !!dropdownRef.current?.contains(target);
            if (!withinAnchor && !withinDropdown) {
                setOpen(false);
                setShowAdder(false);
                setAdding('');
            }
        };
        document.addEventListener('click', onDoc, true);
        return () => document.removeEventListener('click', onDoc, true);
    }, []);

    const addNew = async () => {
        const name = (adding || query || '').trim();
        if (!name) return;

        // Check for existing entries (case-insensitive)
        const existingMatch = options.find(
            (opt) => opt.name.toLowerCase() === name.toLowerCase(),
        );

        if (existingMatch) {
            // If exact match exists, select it instead of creating new
            onChange(existingMatch.name);
            setShowAdder(false);
            setAdding('');
            setQuery('');
            setOpen(false);
            return;
        }

        try {
            let created: {id: string; name: string} | null = null;
            if (type === 'product') {
                created = await api.post<{id: string; name: string}>(
                    '/api/products',
                    {name},
                );
            } else if (type === 'service') {
                created = await api.post<{id: string; name: string}>(
                    '/api/services',
                    {name},
                );
            } else if (type === 'template') {
                created = await api.post<{id: string; name: string}>(
                    '/api/products',
                    {name},
                );
            } else {
                created = await api.post<{id: string; name: string}>(
                    '/api/enterprises',
                    {name},
                );
            }
            if (created) {
                // Inject newly created into the current dropdown list and select it
                setOptions((prev) => {
                    const exists = prev.some((o) => o.id === created!.id);
                    return exists ? prev : [...prev, created!];
                });
                onChange(created.name);
                setShowAdder(false);
                setAdding('');
                setQuery('');
                setOpen(false);

                // Notify parent component about the new item
                if (onNewItemCreated) {
                    const dropdownType =
                        type === 'enterprise'
                            ? 'enterprises'
                            : type === 'product'
                            ? 'products'
                            : 'services';
                    onNewItemCreated(dropdownType, created);
                }
            }
        } catch (error: any) {
            // Handle duplicate error from backend
            if (
                error?.message?.includes('already exists') ||
                error?.message?.includes('duplicate')
            ) {
                // Try to find the existing item and select it
                const existingItem = options.find(
                    (opt) => opt.name.toLowerCase() === name.toLowerCase(),
                );
                if (existingItem) {
                    onChange(existingItem.name);
                    setOpen(false);
                }
            }
            setShowAdder(false);
            setAdding('');
            setQuery('');
        }
    };

    React.useEffect(() => {
        setCurrent(value);
    }, [value]);

    const sizeClass = compact ? 'text-[11px] py-0.5' : 'text-[12px] py-1';
    return (
        <div
            ref={containerRef}
            className='relative min-w-0 flex items-center gap-1 group/item'
            style={{maxWidth: '100%'}}
        >
            {current || value ? (
                (() => {
                    const key = (current || value || '').toLowerCase();
                    let hash = 0;
                    for (let i = 0; i < key.length; i++) {
                        hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
                    }
                    const palettes: Record<
                        CatalogType,
                        {
                            bg: string;
                            text: string;
                            border: string;
                            dot: string;
                        }[]
                    > = {
                        product: [
                            {
                                bg: 'bg-violet-50',
                                text: 'text-violet-800',
                                border: 'border-violet-200',
                                dot: 'bg-violet-400',
                            },
                            {
                                bg: 'bg-sky-50',
                                text: 'text-sky-800',
                                border: 'border-sky-200',
                                dot: 'bg-sky-400',
                            },
                            {
                                bg: 'bg-emerald-50',
                                text: 'text-emerald-800',
                                border: 'border-emerald-200',
                                dot: 'bg-emerald-400',
                            },
                            {
                                bg: 'bg-amber-50',
                                text: 'text-amber-800',
                                border: 'border-amber-200',
                                dot: 'bg-amber-400',
                            },
                        ],
                        service: [
                            {
                                bg: 'bg-rose-50',
                                text: 'text-rose-800',
                                border: 'border-rose-200',
                                dot: 'bg-rose-400',
                            },
                            {
                                bg: 'bg-indigo-50',
                                text: 'text-indigo-800',
                                border: 'border-indigo-200',
                                dot: 'bg-indigo-400',
                            },
                            {
                                bg: 'bg-teal-50',
                                text: 'text-teal-800',
                                border: 'border-teal-200',
                                dot: 'bg-teal-400',
                            },
                            {
                                bg: 'bg-fuchsia-50',
                                text: 'text-fuchsia-800',
                                border: 'border-fuchsia-200',
                                dot: 'bg-fuchsia-400',
                            },
                        ],
                        enterprise: [
                            {
                                bg: 'bg-cyan-50',
                                text: 'text-cyan-800',
                                border: 'border-cyan-200',
                                dot: 'bg-cyan-400',
                            },
                            {
                                bg: 'bg-lime-50',
                                text: 'text-lime-800',
                                border: 'border-lime-200',
                                dot: 'bg-lime-400',
                            },
                            {
                                bg: 'bg-orange-50',
                                text: 'text-orange-800',
                                border: 'border-orange-200',
                                dot: 'bg-orange-400',
                            },
                            {
                                bg: 'bg-purple-50',
                                text: 'text-purple-800',
                                border: 'border-purple-200',
                                dot: 'bg-purple-400',
                            },
                        ],
                        template: [
                            {
                                bg: 'bg-slate-50',
                                text: 'text-slate-800',
                                border: 'border-slate-200',
                                dot: 'bg-slate-400',
                            },
                            {
                                bg: 'bg-blue-50',
                                text: 'text-blue-800',
                                border: 'border-blue-200',
                                dot: 'bg-blue-400',
                            },
                            {
                                bg: 'bg-emerald-50',
                                text: 'text-emerald-800',
                                border: 'border-emerald-200',
                                dot: 'bg-emerald-400',
                            },
                            {
                                bg: 'bg-amber-50',
                                text: 'text-amber-800',
                                border: 'border-amber-200',
                                dot: 'bg-amber-400',
                            },
                        ],
                    };
                    const palette = palettes[type];
                    const tone = palette[hash % palette.length];
                    return (
                        <motion.span
                            initial={{scale: 0.95, opacity: 0}}
                            animate={{scale: 1, opacity: 1}}
                            whileHover={{
                                y: -1,
                                boxShadow: '0 1px 6px rgba(15,23,42,0.15)',
                            }}
                            transition={{
                                type: 'spring',
                                stiffness: 480,
                                damping: 30,
                            }}
                            className={`inline-flex items-center gap-1 px-1.5 py-[2px] text-[10px] leading-[12px] border max-w-full min-w-0 overflow-hidden whitespace-nowrap text-ellipsis ${tone.bg} ${tone.text} ${tone.border}`}
                            style={{borderRadius: '0px !important'}}
                            title={current || value || ''}
                        >
                            <span
                                className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${tone.dot}`}
                            ></span>
                            <span className='truncate'>{current || value}</span>
                            <button
                                onClick={() => {
                                    setCurrent(undefined);
                                    onChange(undefined);
                                }}
                                className='ml-1 hover:text-slate-900 opacity-0 group-hover/item:opacity-100 transition-opacity'
                                aria-label='Clear'
                            >
                                <X className='h-3 w-3' />
                            </button>
                        </motion.span>
                    );
                })()
            ) : (
                <button
                    onClick={() => setOpen((s) => !s)}
                    className={`w-full text-left px-2 ${sizeClass} rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-500`}
                >
                    {placeholder || 'Select'}
                </button>
            )}
            {/* plus button removed per request */}
            {open &&
                dropdownPos &&
                createPortal(
                    <motion.div
                        ref={dropdownRef}
                        initial={{opacity: 0, scale: 0.95, y: -10}}
                        animate={{opacity: 1, scale: 1, y: 0}}
                        exit={{opacity: 0, scale: 0.95, y: -10}}
                        transition={{duration: 0.15, ease: 'easeOut'}}
                        className='z-[9999] rounded-xl border border-slate-200 bg-white shadow-2xl backdrop-blur-sm'
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            position: 'fixed',
                            top: dropdownPos.top,
                            left: dropdownPos.left,
                            width: dropdownPos.width,
                        }}
                    >
                        <div className='absolute -top-2 left-6 h-3 w-3 rotate-45 bg-white border-t border-l border-slate-200'></div>
                        <div className='p-2 border-b border-slate-200'>
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={async (e) => {
                                    if (e.key === 'Enter' && query.trim()) {
                                        const hasExactMatch = options.some(
                                            (opt) =>
                                                opt.name.toLowerCase() ===
                                                query.toLowerCase(),
                                        );

                                        if (!hasExactMatch) {
                                            try {
                                                let created: {
                                                    id: string;
                                                    name: string;
                                                } | null = null;

                                                if (type === 'enterprise') {
                                                    created = await api.post<{
                                                        id: string;
                                                        name: string;
                                                    }>('/api/enterprises', {
                                                        name: query.trim(),
                                                    });
                                                } else if (type === 'product') {
                                                    created = await api.post<{
                                                        id: string;
                                                        name: string;
                                                    }>('/api/products', {
                                                        name: query.trim(),
                                                    });
                                                } else if (type === 'service') {
                                                    created = await api.post<{
                                                        id: string;
                                                        name: string;
                                                    }>('/api/services', {
                                                        name: query.trim(),
                                                    });
                                                }

                                                if (created) {
                                                    setOptions((prev) => [
                                                        ...prev,
                                                        created!,
                                                    ]);
                                                    onChange(created.name);
                                                    setQuery('');
                                                    setOpen(false);
                                                }
                                            } catch (error) {
                                                console.error(
                                                    `Failed to create ${type}:`,
                                                    error,
                                                );
                                            }
                                        }
                                    }
                                }}
                                placeholder={`Search ${type}s (Press Enter to add new)`}
                                className='w-full rounded border border-slate-300 px-2 py-1 text-[12px]'
                            />
                        </div>
                        <div className='max-h-64 overflow-auto p-2 space-y-1'>
                            {loading ? (
                                <div className='px-3 py-2 text-slate-500'>
                                    Loading…
                                </div>
                            ) : (
                                (() => {
                                    const filteredOptions = options.filter(
                                        (opt) =>
                                            query
                                                ? opt.name
                                                      .toLowerCase()
                                                      .includes(
                                                          query.toLowerCase(),
                                                      )
                                                : true,
                                    );

                                    const hasExactMatch =
                                        query &&
                                        options.some(
                                            (opt) =>
                                                opt.name.toLowerCase() ===
                                                query.toLowerCase(),
                                        );

                                    const showAddNew =
                                        query.trim() &&
                                        !hasExactMatch &&
                                        filteredOptions.length === 0;

                                    if (showAddNew) {
                                        return (
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        let created: {
                                                            id: string;
                                                            name: string;
                                                        } | null = null;

                                                        if (
                                                            type ===
                                                            'enterprise'
                                                        ) {
                                                            created =
                                                                await api.post<{
                                                                    id: string;
                                                                    name: string;
                                                                }>(
                                                                    '/api/enterprises',
                                                                    {
                                                                        name: query.trim(),
                                                                    },
                                                                );
                                                        } else if (
                                                            type === 'product'
                                                        ) {
                                                            created =
                                                                await api.post<{
                                                                    id: string;
                                                                    name: string;
                                                                }>(
                                                                    '/api/products',
                                                                    {
                                                                        name: query.trim(),
                                                                    },
                                                                );
                                                        } else if (
                                                            type === 'service'
                                                        ) {
                                                            created =
                                                                await api.post<{
                                                                    id: string;
                                                                    name: string;
                                                                }>(
                                                                    '/api/services',
                                                                    {
                                                                        name: query.trim(),
                                                                    },
                                                                );
                                                        }

                                                        if (created) {
                                                            setOptions(
                                                                (prev) => [
                                                                    ...prev,
                                                                    created!,
                                                                ],
                                                            );
                                                            onChange(
                                                                created.name,
                                                            );
                                                            setQuery('');
                                                            setOpen(false);
                                                        }
                                                    } catch (error) {
                                                        console.error(
                                                            `Failed to create ${type}:`,
                                                            error,
                                                        );
                                                    }
                                                }}
                                                className='w-full flex items-center gap-2 px-3 py-2 text-left rounded-md hover:bg-slate-50 border border-dashed border-slate-300 hover:border-blue-400 transition-all'
                                            >
                                                <div className='flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white'>
                                                    <Plus className='h-3 w-3' />
                                                </div>
                                                <div className='flex-1'>
                                                    <span className='text-sm text-blue-600 font-medium'>
                                                        Add &quot;{query}&quot;
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    }

                                    if (filteredOptions.length === 0) {
                                        return (
                                            <div className='px-3 py-2 text-slate-500 text-center'>
                                                No matches
                                            </div>
                                        );
                                    }

                                    return filteredOptions.map((opt, idx) => {
                                        const palette = [
                                            {
                                                bg: 'bg-pink-500',
                                                hover: 'hover:bg-pink-400',
                                                text: 'text-white',
                                            },
                                            {
                                                bg: 'bg-sky-500',
                                                hover: 'hover:bg-sky-400',
                                                text: 'text-white',
                                            },
                                            {
                                                bg: 'bg-slate-400',
                                                hover: 'hover:bg-slate-300',
                                                text: 'text-white',
                                            },
                                            {
                                                bg: 'bg-emerald-500',
                                                hover: 'hover:bg-emerald-400',
                                                text: 'text-white',
                                            },
                                            {
                                                bg: 'bg-violet-500',
                                                hover: 'hover:bg-violet-400',
                                                text: 'text-white',
                                            },
                                            {
                                                bg: 'bg-amber-500',
                                                hover: 'hover:bg-amber-400',
                                                text: 'text-white',
                                            },
                                        ];
                                        const tone =
                                            palette[idx % palette.length];
                                        return (
                                            <DropdownOption
                                                key={opt.id}
                                                option={opt}
                                                tone={tone}
                                                type={type}
                                                isInUse={isOptionInUse(
                                                    opt.name,
                                                )}
                                                onSelect={() => {
                                                    setCurrent(opt.name);
                                                    onChange(opt.name);
                                                    setOpen(false);
                                                }}
                                                onEdit={async (newName) => {
                                                    try {
                                                        // Update via API
                                                        await api.put(
                                                            `/api/${type}s/${opt.id}`,
                                                            {
                                                                name: newName,
                                                            },
                                                        );

                                                        // Update local options
                                                        setOptions((prev) =>
                                                            prev.map((o) =>
                                                                o.id === opt.id
                                                                    ? {
                                                                          ...o,
                                                                          name: newName,
                                                                      }
                                                                    : o,
                                                            ),
                                                        );

                                                        // If this option is currently selected, update it
                                                        if (
                                                            current === opt.name
                                                        ) {
                                                            setCurrent(newName);
                                                            onChange(newName);
                                                        }

                                                        // Notify parent component to update all rows
                                                        if (
                                                            onDropdownOptionUpdate
                                                        ) {
                                                            const dropdownType =
                                                                type ===
                                                                'enterprise'
                                                                    ? 'enterprises'
                                                                    : type ===
                                                                      'product'
                                                                    ? 'products'
                                                                    : 'services';
                                                            await onDropdownOptionUpdate(
                                                                dropdownType,
                                                                'update',
                                                                opt.name,
                                                                newName,
                                                            );
                                                        }
                                                    } catch (error) {
                                                        console.error(
                                                            `Failed to update ${type}:`,
                                                            error,
                                                        );
                                                    }
                                                }}
                                                onDelete={async () => {
                                                    try {
                                                        // Delete via API
                                                        await api.del(
                                                            `/api/${type}s/${opt.id}`,
                                                        );

                                                        // Remove from local options
                                                        setOptions((prev) =>
                                                            prev.filter(
                                                                (o) =>
                                                                    o.id !==
                                                                    opt.id,
                                                            ),
                                                        );

                                                        // If this option is currently selected, clear it
                                                        if (
                                                            current === opt.name
                                                        ) {
                                                            setCurrent(
                                                                undefined,
                                                            );
                                                            onChange(undefined);
                                                        }

                                                        // Notify parent component to update all rows
                                                        if (
                                                            onDropdownOptionUpdate
                                                        ) {
                                                            const dropdownType =
                                                                type ===
                                                                'enterprise'
                                                                    ? 'enterprises'
                                                                    : type ===
                                                                      'product'
                                                                    ? 'products'
                                                                    : 'services';
                                                            await onDropdownOptionUpdate(
                                                                dropdownType,
                                                                'delete',
                                                                opt.name,
                                                            );
                                                        }
                                                    } catch (error) {
                                                        console.error(
                                                            `Failed to delete ${type}:`,
                                                            error,
                                                        );
                                                    }
                                                }}
                                            />
                                        );
                                    });
                                })()
                            )}
                        </div>
                        <div className='border-t border-slate-200 px-3 py-2'>
                            <button
                                onClick={() => {
                                    setAdding('');
                                    setShowAdder(true);
                                }}
                                className='group w-full text-left text-[12px] text-slate-700 hover:text-slate-900 flex items-center gap-2'
                            >
                                <Plus className='h-3.5 w-3.5' />
                                <span className='inline-block max-w-0 overflow-hidden whitespace-nowrap -translate-x-1 opacity-0 group-hover:max-w-xs group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-200'>
                                    Add new {type}
                                </span>
                            </button>
                            {showAdder && (
                                <div className='mt-2 overflow-hidden'>
                                    {(() => {
                                        const similarMatch = adding.trim()
                                            ? options.find(
                                                  (opt) =>
                                                      opt.name.toLowerCase() ===
                                                      adding
                                                          .trim()
                                                          .toLowerCase(),
                                              )
                                            : null;

                                        return (
                                            <>
                                                <div className='flex items-center gap-2'>
                                                    <motion.input
                                                        initial={{
                                                            x: -12,
                                                            opacity: 0,
                                                        }}
                                                        animate={{
                                                            x: 0,
                                                            opacity: 1,
                                                        }}
                                                        transition={{
                                                            type: 'spring',
                                                            stiffness: 420,
                                                            damping: 28,
                                                        }}
                                                        value={adding}
                                                        onChange={(e) =>
                                                            setAdding(
                                                                e.target.value,
                                                            )
                                                        }
                                                        onKeyDown={(e) => {
                                                            if (
                                                                e.key ===
                                                                'Enter'
                                                            )
                                                                addNew();
                                                            if (
                                                                e.key ===
                                                                'Escape'
                                                            )
                                                                setShowAdder(
                                                                    false,
                                                                );
                                                        }}
                                                        placeholder={`Enter ${type} name`}
                                                        className={`flex-1 rounded border px-2 py-1 text-[12px] ${
                                                            similarMatch
                                                                ? 'border-amber-400 bg-amber-50'
                                                                : 'border-slate-300'
                                                        }`}
                                                    />
                                                    <button
                                                        onClick={async () => {
                                                            await addNew();
                                                        }}
                                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[12px] ${
                                                            similarMatch
                                                                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                                                : 'bg-violet-600 hover:bg-violet-700 text-white'
                                                        }`}
                                                    >
                                                        {similarMatch
                                                            ? 'Select Existing'
                                                            : 'Add'}
                                                    </button>
                                                </div>
                                                {similarMatch && (
                                                    <motion.div
                                                        initial={{
                                                            opacity: 0,
                                                            height: 0,
                                                        }}
                                                        animate={{
                                                            opacity: 1,
                                                            height: 'auto',
                                                        }}
                                                        className='mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-800'
                                                    >
                                                        <span className='font-medium'>
                                                            ⚠️ Similar entry
                                                            exists:
                                                        </span>{' '}
                                                        &quot;
                                                        {similarMatch.name}
                                                        &quot;
                                                        <br />
                                                        <span className='text-amber-600'>
                                                            Click &quot;Select
                                                            Existing&quot; to
                                                            use it instead of
                                                            creating a
                                                            duplicate.
                                                        </span>
                                                    </motion.div>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>
                    </motion.div>,
                    document.body,
                )}
            {/* removed old portal-based adder */}
        </div>
    );
}

interface AccountsTableProps {
    rows: AccountRow[];
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    title?: string;
    groupByExternal?: 'none' | 'enterpriseName' | 'productName' | 'serviceName';
    onGroupByChange?: (
        g: 'none' | 'enterpriseName' | 'productName' | 'serviceName',
    ) => void;
    hideControls?: boolean;
    visibleColumns?: Array<
        | 'masterAccount'
        | 'accountName'
        | 'country'
        | 'addressLine1'
        | 'addressLine2'
        | 'city'
        | 'state'
        | 'pincode'
        | 'actions'
    >;
    highlightQuery?: string;
    onQuickAddRow?: () => void;
    customColumnLabels?: Record<string, string>;
    enableDropdownChips?: boolean;
    dropdownOptions?: {
        enterprises?: Array<{id: string; name: string}>;
        products?: Array<{id: string; name: string}>;
        services?: Array<{id: string; name: string}>;
    };
    onUpdateField?: (rowId: string, field: string, value: any) => void;
    hideRowExpansion?: boolean;
    incompleteRowIds?: string[];
    hasBlankRow?: boolean;
    onDropdownOptionUpdate?: (
        type: 'enterprises' | 'products' | 'services',
        action: 'update' | 'delete',
        oldName: string,
        newName?: string,
    ) => Promise<void>;
    onNewItemCreated?: (
        type: 'enterprises' | 'products' | 'services',
        item: {id: string; name: string},
    ) => void;
    compressingRowId?: string | null;
    foldingRowId?: string | null;
}

function SortableAccountRow({
    row,
    index,
    onEdit,
    onDelete,
    cols,
    gridTemplate,
    highlightQuery,
    onQuickAddRow,
    customColumns = [],
    isExpanded,
    onToggle,
    expandedContent,
    onUpdateField,
    isSelected,
    onSelect,
    onStartFill,
    inFillRange,
    pinFirst,
    firstColWidth,
    hideRowExpansion = false,
    enableDropdownChips = false,
    onDropdownOptionUpdate,
    onNewItemCreated,
    isCellMissing = () => false,
    compressingRowId = null,
    foldingRowId = null,
    allRows = [],
}: {
    row: AccountRow;
    index: number;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    cols: string[];
    gridTemplate: string;
    highlightQuery?: string;
    onQuickAddRow?: () => void;
    customColumns?: string[];
    isExpanded: boolean;
    onToggle: (id: string) => void;
    expandedContent?: React.ReactNode;
    onUpdateField: (rowId: string, key: keyof AccountRow, value: any) => void;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onStartFill: (rowId: string, col: keyof AccountRow, value: string) => void;
    inFillRange: boolean;
    pinFirst?: boolean;
    firstColWidth?: string;
    hideRowExpansion?: boolean;
    enableDropdownChips?: boolean;
    onDropdownOptionUpdate?: (
        type: 'enterprises' | 'products' | 'services',
        action: 'update' | 'delete',
        oldName: string,
        newName?: string,
    ) => Promise<void>;
    onNewItemCreated?: (
        type: 'enterprises' | 'products' | 'services',
        item: {id: string; name: string},
    ) => void;
    isCellMissing?: (rowId: string, field: string) => boolean;
    compressingRowId?: string | null;
    foldingRowId?: string | null;
    allRows?: AccountRow[];
}) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [menuUp, setMenuUp] = useState(false);
    const actionsRef = useRef<HTMLDivElement>(null);
    const [menuPos, setMenuPos] = useState<{top: number; left: number} | null>(
        null,
    );
    const [isDragging, setIsDragging] = useState(false);

    // Tab navigation state and logic
    const editableCols = cols.filter((col) =>
        [
            'masterAccount',
            'accountName',
            'email',
            'phone',
            'country',
            'addressLine1',
            'addressLine2',
            'city',
            'state',
            'pincode',
        ].includes(col),
    );

    const createTabNavigation = (currentCol: string) => {
        const currentIndex = editableCols.indexOf(currentCol);

        const onTabNext = () => {
            const nextIndex = currentIndex + 1;
            if (nextIndex < editableCols.length) {
                const nextCol = editableCols[nextIndex];
                // Focus the next cell
                setTimeout(() => {
                    // First try to find an existing input (if already in edit mode)
                    let nextInput = document.querySelector(
                        `[data-row-id="${row.id}"][data-col="${nextCol}"] input`,
                    ) as HTMLInputElement;

                    if (nextInput) {
                        nextInput.focus();
                    } else {
                        // If no input found, trigger edit mode by clicking the InlineEditableText span
                        const nextCellSpan = document.querySelector(
                            `[data-row-id="${row.id}"][data-col="${nextCol}"] span[data-inline]`,
                        ) as HTMLElement;
                        if (nextCellSpan) {
                            nextCellSpan.click();
                            // After click, try to find the input again
                            setTimeout(() => {
                                nextInput = document.querySelector(
                                    `[data-row-id="${row.id}"][data-col="${nextCol}"] input`,
                                ) as HTMLInputElement;
                                if (nextInput) {
                                    nextInput.focus();
                                    nextInput.select(); // Select all text for immediate editing
                                }
                            }, 50);
                        }
                    }
                }, 10);
            }
        };

        const onTabPrev = () => {
            const prevIndex = currentIndex - 1;
            if (prevIndex >= 0) {
                const prevCol = editableCols[prevIndex];
                // Focus the previous cell
                setTimeout(() => {
                    // First try to find an existing input (if already in edit mode)
                    let prevInput = document.querySelector(
                        `[data-row-id="${row.id}"][data-col="${prevCol}"] input`,
                    ) as HTMLInputElement;

                    if (prevInput) {
                        prevInput.focus();
                    } else {
                        // If no input found, trigger edit mode by clicking the InlineEditableText span
                        const prevCellSpan = document.querySelector(
                            `[data-row-id="${row.id}"][data-col="${prevCol}"] span[data-inline]`,
                        ) as HTMLElement;
                        if (prevCellSpan) {
                            prevCellSpan.click();
                            // After click, try to find the input again
                            setTimeout(() => {
                                prevInput = document.querySelector(
                                    `[data-row-id="${row.id}"][data-col="${prevCol}"] input`,
                                ) as HTMLInputElement;
                                if (prevInput) {
                                    prevInput.focus();
                                    prevInput.select(); // Select all text for immediate editing
                                }
                            }, 50);
                        }
                    }
                }, 10);
            }
        };

        return {onTabNext, onTabPrev};
    };

    // Tab navigation for subtables (Technical User and License Details)
    const createSubtableTabNavigation = (
        rowId: string,
        subtableType: 'technical' | 'license',
        currentField: string,
        licenseIndex?: number,
    ) => {
        const technicalFields = [
            'firstName',
            'middleName',
            'lastName',
            'email',
            'status',
            'startDate',
            'endDate',
            'password',
            'technicalUser',
        ];
        const licenseFields = [
            'product',
            'service',
            'licenseStart',
            'licenseEnd',
            'users',
            'renewalNotice',
            'noticeDays',
        ];

        const fields =
            subtableType === 'technical' ? technicalFields : licenseFields;
        const currentIndex = fields.indexOf(currentField);

        const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const nextIndex = e.shiftKey
                    ? currentIndex - 1
                    : currentIndex + 1;

                if (nextIndex >= 0 && nextIndex < fields.length) {
                    const nextField = fields[nextIndex];
                    setTimeout(() => {
                        let selector: string;
                        if (subtableType === 'technical') {
                            selector = `[data-tech-row="${rowId}"][data-tech-field="${nextField}"] input`;
                        } else {
                            selector = `[data-license-row="${rowId}"][data-license-index="${licenseIndex}"][data-license-field="${nextField}"] input, [data-license-row="${rowId}"][data-license-index="${licenseIndex}"][data-license-field="${nextField}"] select`;
                        }
                        const nextInput = document.querySelector(
                            selector,
                        ) as HTMLInputElement;
                        if (nextInput) {
                            nextInput.focus();
                        }
                    }, 10);
                }
            }
        };

        return {onKeyDown};
    };

    const toggleMenu = () => {
        const rect = actionsRef.current?.getBoundingClientRect();
        if (rect) {
            const spaceBelow = window.innerHeight - rect.bottom;
            setMenuUp(spaceBelow < 160);
            const dropdownHeight = 120;
            const width = 112; // w-28
            const top =
                spaceBelow < 160
                    ? rect.top - 8 - dropdownHeight
                    : rect.bottom + 8;
            const left = Math.max(8, rect.right - width);
            setMenuPos({top, left});
        }
        setMenuOpen((s) => !s);
    };
    const highlightText = (text: string) => {
        const q = (highlightQuery || '').trim();
        if (!q) return <>{text}</>;
        try {
            const esc = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const re = new RegExp(`(${esc})`, 'ig');
            const parts = text.split(re);
            return (
                <>
                    {parts.map((part, i) =>
                        re.test(part) ? (
                            <mark
                                key={i}
                                className='bg-yellow-200 px-0.5 rounded'
                            >
                                {part}
                            </mark>
                        ) : (
                            <span key={i}>{part}</span>
                        ),
                    )}
                </>
            );
        } catch {
            return <>{text}</>;
        }
    };
    const Chip = ({
        text,
        tone,
    }: {
        text: string;
        tone: 'slate' | 'sky' | 'violet' | 'emerald' | 'amber';
    }) => {
        const toneMap: Record<
            string,
            {bg: string; text: string; border: string; dot: string}
        > = {
            sky: {
                bg: 'bg-sky-50',
                text: 'text-sky-800',
                border: 'border-sky-200',
                dot: 'bg-sky-400',
            },
            slate: {
                bg: 'bg-slate-100',
                text: 'text-slate-800',
                border: 'border-slate-200',
                dot: 'bg-slate-400',
            },
            violet: {
                bg: 'bg-violet-50',
                text: 'text-violet-800',
                border: 'border-violet-200',
                dot: 'bg-violet-400',
            },
            emerald: {
                bg: 'bg-emerald-50',
                text: 'text-emerald-800',
                border: 'border-emerald-200',
                dot: 'bg-emerald-400',
            },
            amber: {
                bg: 'bg-amber-50',
                text: 'text-amber-800',
                border: 'border-amber-200',
                dot: 'bg-amber-400',
            },
        };
        const t = toneMap[tone] || toneMap.slate;
        return (
            <motion.span
                initial={{scale: 0.95, opacity: 0}}
                animate={{scale: 1, opacity: 1}}
                whileHover={{y: -1, boxShadow: '0 1px 6px rgba(15,23,42,0.15)'}}
                transition={{type: 'spring', stiffness: 480, damping: 30}}
                className={`inline-flex items-center gap-1 px-1.5 py-[2px] text-[10px] leading-[12px] border max-w-full min-w-0 overflow-hidden whitespace-nowrap text-ellipsis ${t.bg} ${t.text} ${t.border}`}
                style={{borderRadius: '0px !important'}}
                title={text}
            >
                <span
                    className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${t.dot}`}
                ></span>
                <span className='truncate'>{text}</span>
            </motion.span>
        );
    };

    const cssTemplate = gridTemplate.split('_').join(' ');
    return (
        <div
            id={row.id}
            data-account-id={row.id}
            draggable
            onDragStartCapture={(e: React.DragEvent<HTMLDivElement>) => {
                try {
                    e.dataTransfer.effectAllowed = 'move';
                    const rowEl = (e.currentTarget as HTMLElement).closest(
                        '[data-account-id]',
                    ) as HTMLElement | null;
                    if (rowEl) {
                        const rect = rowEl.getBoundingClientRect();
                        const proxy = rowEl.cloneNode(true) as HTMLElement;
                        proxy.style.position = 'fixed';
                        proxy.style.top = `${rect.top}px`;
                        proxy.style.left = `${rect.left}px`;
                        proxy.style.width = `${rect.width}px`;
                        proxy.style.maxWidth = `${rect.width}px`;
                        proxy.style.pointerEvents = 'none';
                        proxy.style.background = 'white';
                        proxy.style.border = '1px solid rgba(148,163,184,0.6)';
                        proxy.style.boxShadow =
                            '0 16px 40px rgba(15,23,42,0.2)';
                        proxy.style.borderRadius = '8px';
                        proxy.style.zIndex = '9999';
                        document.body.appendChild(proxy);
                        e.dataTransfer.setDragImage(proxy, 12, 12);
                        const cleanup = () => {
                            try {
                                document.body.removeChild(proxy);
                            } catch {}
                            window.removeEventListener('dragend', cleanup);
                        };
                        window.addEventListener('dragend', cleanup, {
                            once: true,
                        });
                    }
                    e.dataTransfer.setData(
                        'application/json',
                        JSON.stringify({rowId: String(row.id)}),
                    );
                } catch {}
            }}
            onDragOverCapture={(e: React.DragEvent<HTMLDivElement>) => {
                // Keep HTML5 DnD Active so the outer trash target accepts the drop
                e.preventDefault();
            }}
            className={`w-full grid items-center gap-0 rounded-md overflow-visible border border-slate-200 transition-all duration-200 ease-in-out transform-gpu h-10 ${
                isDragging
                    ? 'cursor-grabbing ring-2 ring-primary-300/40 bg-white shadow-xl'
                    : 'cursor-grab hover:bg-slate-50 hover:shadow-sm hover:ring-1 hover:ring-slate-200'
            } ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'} ${
                isSelected ? 'ring-2 ring-primary-300/60 bg-primary-50/60' : ''
            } ${inFillRange ? 'bg-primary-50/40' : ''} ${
                isExpanded
                    ? 'bg-primary-50 border-l-4 border-l-primary-400'
                    : ''
            } ${
                compressingRowId === row.id
                    ? 'animate-pulse transform scale-x-50 opacity-75'
                    : ''
            } ${
                foldingRowId === row.id
                    ? 'transform scale-y-0 opacity-0 transition-all duration-300'
                    : ''
            }`}
            style={{
                gridTemplateColumns: cssTemplate,
                willChange: 'transform',
                zIndex: isDragging ? 20 : 'auto',
            }}
            onPointerDown={(e: React.PointerEvent<HTMLDivElement>) => {
                onSelect(row.id);
                // If pointerdown starts on non-draggable interActive elements, don't begin HTML5 drag
                const target = e.target as HTMLElement;
                if (
                    target.closest(
                        'input,textarea,select,button,[contenteditable="true"]',
                    )
                ) {
                    (e.currentTarget as HTMLElement).draggable = false;
                } else {
                    (e.currentTarget as HTMLElement).draggable = true;
                }
            }}
        >
            {cols.includes('masterAccount') && (
                <div
                    className={`group flex items-center gap-1.5 border-r border-slate-200 px-2 py-1 ${
                        pinFirst
                            ? 'sticky left-0 z-10 shadow-[6px_0_8px_-6px_rgba(15,23,42,0.10)]'
                            : ''
                    } ${
                        index % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'
                    } border-l-4 ${
                        isSelected ? 'border-l-sky-400' : 'border-l-slate-200'
                    } ${
                        isCellMissing(row.id, 'masterAccount')
                            ? 'bg-red-50 border-red-200 ring-1 ring-red-300'
                            : ''
                    }`}
                    style={{
                        width: firstColWidth,
                        minWidth: firstColWidth,
                        maxWidth: firstColWidth,
                    }}
                >
                    {/* Drag handle for HTML5 DnD to toolbar trash */}
                    <span
                        className='mr-1 inline-flex h-5 w-3 items-center justify-center cursor-grab Active:cursor-grabbing select-none text-slate-400 hover:text-blue-600 opacity-60 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-150'
                        title='Drag row to trash'
                        draggable
                        onMouseDown={(e: React.MouseEvent) => {
                            // Prevent framer-motion row drag from hijacking
                            e.stopPropagation();
                        }}
                        onDragStart={(e: React.DragEvent<HTMLSpanElement>) => {
                            console.log(
                                '🚀 Drag start triggered for row:',
                                row.id,
                            );
                            try {
                                e.dataTransfer.effectAllowed = 'move';
                                // Visible floating proxy so the row appears above headers while dragging
                                const rowEl = (
                                    e.currentTarget as HTMLElement
                                ).closest(
                                    '[data-account-id]',
                                ) as HTMLElement | null;
                                if (rowEl) {
                                    const rect = rowEl.getBoundingClientRect();

                                    // Create a compact, animated drag preview
                                    const proxy = document.createElement('div');
                                    proxy.style.position = 'fixed';
                                    proxy.style.top = `${rect.top}px`;
                                    proxy.style.left = `${rect.left}px`;
                                    proxy.style.width = '280px'; // Much smaller than original
                                    proxy.style.height = '40px';
                                    proxy.style.pointerEvents = 'none';
                                    proxy.style.background =
                                        'linear-gradient(135deg, #fef7f0 0%, #fed7aa 100%)';
                                    proxy.style.border = '2px solid #fb923c';
                                    proxy.style.boxShadow =
                                        '0 20px 50px rgba(251,146,60,0.4), 0 0 0 1px rgba(251,146,60,0.1)';
                                    proxy.style.borderRadius = '12px';
                                    proxy.style.zIndex = '9999';
                                    proxy.style.display = 'flex';
                                    proxy.style.alignItems = 'center';
                                    proxy.style.padding = '8px 12px';
                                    proxy.style.gap = '8px';
                                    proxy.style.overflow = 'hidden';
                                    proxy.style.transform =
                                        'scale(0.95) rotate(-2deg)';
                                    proxy.style.transition =
                                        'all 0.2s ease-out';
                                    proxy.style.animation =
                                        'dragPulse 1s ease-in-out infinite alternate';

                                    // Add drag icon
                                    const dragIcon =
                                        document.createElement('div');
                                    dragIcon.innerHTML = `
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fb923c" stroke-width="2">
                                            <path d="M3 6h18M3 12h18M3 18h18"/>
                                        </svg>
                                    `;
                                    dragIcon.style.flexShrink = '0';
                                    proxy.appendChild(dragIcon);

                                    // Add compact row info
                                    const rowInfo =
                                        document.createElement('div');
                                    rowInfo.style.display = 'flex';
                                    rowInfo.style.alignItems = 'center';
                                    rowInfo.style.gap = '6px';
                                    rowInfo.style.fontSize = '12px';
                                    rowInfo.style.fontWeight = '600';
                                    rowInfo.style.color = '#ea580c';
                                    rowInfo.style.overflow = 'hidden';
                                    rowInfo.style.whiteSpace = 'nowrap';

                                    // Extract key info from the row
                                    const enterprise =
                                        row.masterAccount || 'Enterprise';
                                    const product =
                                        row.accountName || 'Product';
                                    const services = row.address?.country
                                        ? row.address.country.split(',').length
                                        : 0;

                                    rowInfo.innerHTML = `
                                        <span style="background: rgba(251,146,60,0.2); padding: 2px 6px; border-radius: 4px; font-size: 10px;">
                                            ${
                                                enterprise.length > 12
                                                    ? enterprise.substring(
                                                          0,
                                                          12,
                                                      ) + '...'
                                                    : enterprise
                                            }
                                        </span>
                                        <span style="color: #9ca3af;">→</span>
                                        <span style="background: rgba(251,146,60,0.2); padding: 2px 6px; border-radius: 4px; font-size: 10px;">
                                            ${
                                                product.length > 10
                                                    ? product.substring(0, 10) +
                                                      '...'
                                                    : product
                                            }
                                        </span>
                                        <span style="color: #9ca3af;">•</span>
                                        <span style="background: rgba(251,146,60,0.2); padding: 2px 6px; border-radius: 4px; font-size: 10px;">
                                            ${services} service${
                                        services !== 1 ? 's' : ''
                                    }
                                        </span>
                                    `;
                                    proxy.appendChild(rowInfo);

                                    // Add trash target indicator
                                    const trashIndicator =
                                        document.createElement('div');
                                    trashIndicator.innerHTML = `
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2">
                                            <path d="M3 6h18"/>
                                            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
                                        </svg>
                                    `;
                                    trashIndicator.style.marginLeft = 'auto';
                                    trashIndicator.style.opacity = '0.7';
                                    trashIndicator.style.animation =
                                        'bounce 1s ease-in-out infinite';
                                    proxy.appendChild(trashIndicator);

                                    // Add CSS animations
                                    if (
                                        !document.getElementById(
                                            'drag-animations',
                                        )
                                    ) {
                                        const style =
                                            document.createElement('style');
                                        style.id = 'drag-animations';
                                        style.textContent = `
                                            @keyframes dragPulse {
                                                0% { box-shadow: 0 20px 50px rgba(251,146,60,0.4), 0 0 0 1px rgba(251,146,60,0.1); }
                                                100% { box-shadow: 0 25px 60px rgba(251,146,60,0.6), 0 0 0 2px rgba(251,146,60,0.2); }
                                            }
                                            @keyframes bounce {
                                                0%, 100% { transform: translateY(0); }
                                                50% { transform: translateY(-2px); }
                                            }
                                        `;
                                        document.head.appendChild(style);
                                    }

                                    document.body.appendChild(proxy);
                                    e.dataTransfer.setDragImage(proxy, 140, 20);
                                    // Cleanup when drag ends
                                    const cleanup = () => {
                                        try {
                                            document.body.removeChild(proxy);
                                        } catch {}
                                        window.removeEventListener(
                                            'dragend',
                                            cleanup,
                                        );
                                    };
                                    window.addEventListener(
                                        'dragend',
                                        cleanup,
                                        {once: true},
                                    );
                                }
                                const dragData = JSON.stringify({
                                    rowId: String(row.id),
                                });
                                e.dataTransfer.setData(
                                    'application/json',
                                    dragData,
                                );
                            } catch {}
                        }}
                    >
                        <svg viewBox='0 0 8 16' className='h-3 w-2 opacity-70'>
                            <circle cx='2' cy='2' r='1' fill='currentColor' />
                            <circle cx='6' cy='2' r='1' fill='currentColor' />
                            <circle cx='2' cy='6' r='1' fill='currentColor' />
                            <circle cx='6' cy='6' r='1' fill='currentColor' />
                            <circle cx='2' cy='10' r='1' fill='currentColor' />
                            <circle cx='6' cy='10' r='1' fill='currentColor' />
                            <circle cx='2' cy='14' r='1' fill='currentColor' />
                            <circle cx='6' cy='14' r='1' fill='currentColor' />
                        </svg>
                    </span>
                    {!hideRowExpansion && (
                        <button
                            className={`h-5 w-5 rounded text-blue-600 hover:bg-slate-100 ${
                                isExpanded ? '' : ''
                            }`}
                            onClick={() => onToggle(row.id)}
                            title='Toggle subitems'
                        >
                            <motion.span
                                initial={false}
                                animate={{rotate: isExpanded ? 90 : 0}}
                                transition={{
                                    type: 'spring',
                                    stiffness: 520,
                                    damping: 30,
                                }}
                                className='inline-flex'
                            >
                                <ChevronRight
                                    className={`h-4 w-4 transition-all duration-150 ${
                                        isExpanded
                                            ? 'opacity-100 text-sky-600'
                                            : 'opacity-0 group-hover:opacity-100'
                                    }`}
                                />
                            </motion.span>
                        </button>
                    )}
                    <div
                        className='font-medium text-slate-900 text-[12px] min-w-0 truncate'
                        data-row-id={row.id}
                        data-col='masterAccount'
                    >
                        {enableDropdownChips ? (
                            <AsyncChipSelect
                                type='enterprise'
                                value={(row as any).masterAccount || ''}
                                onChange={(v) => {
                                    onUpdateField(
                                        row.id,
                                        'masterAccount' as any,
                                        v || '',
                                    );
                                }}
                                placeholder='Select Enterprise'
                                compact={true}
                                onDropdownOptionUpdate={onDropdownOptionUpdate}
                                onNewItemCreated={onNewItemCreated}
                                accounts={allRows}
                            />
                        ) : (
                            <InlineEditableText
                                value={(row as any).masterAccount || ''}
                                onCommit={(v) => {
                                    onUpdateField(
                                        row.id,
                                        'masterAccount' as any,
                                        v,
                                    );
                                }}
                                className='text-[12px]'
                                placeholder=''
                                dataAttr={`${row.id}-masterAccount`}
                                {...createTabNavigation('masterAccount')}
                            />
                        )}
                    </div>
                </div>
            )}
            {cols.includes('accountName') && (
                <div
                    className={`text-slate-700 text-[12px] min-w-0 truncate border-r border-slate-200 px-2 py-1 ${
                        isCellMissing(row.id, 'accountName')
                            ? 'bg-red-50 border-red-200 ring-1 ring-red-300'
                            : ''
                    }`}
                    data-row-id={row.id}
                    data-col='accountName'
                >
                    {enableDropdownChips ? (
                        <AsyncChipSelect
                            type='product'
                            value={row.accountName}
                            onChange={(v) =>
                                onUpdateField(row.id, 'accountName', v || '')
                            }
                            placeholder='Select Product'
                            compact={true}
                            onDropdownOptionUpdate={onDropdownOptionUpdate}
                            onNewItemCreated={onNewItemCreated}
                            accounts={allRows}
                        />
                    ) : (
                        <InlineEditableText
                            value={row.accountName}
                            onCommit={(v) =>
                                onUpdateField(row.id, 'accountName', v)
                            }
                            className='text-[12px]'
                            dataAttr={`account-${row.id}`}
                            placeholder=''
                            {...createTabNavigation('accountName')}
                        />
                    )}
                </div>
            )}
            {cols.includes('email') && (
                <div
                    className='text-blue-600 text-[12px] min-w-0 truncate border-r border-slate-200 px-2 py-1'
                    data-row-id={row.id}
                    data-col='email'
                >
                    <InlineEditableText
                        value={row.email}
                        onCommit={(v) => onUpdateField(row.id, 'email', v)}
                        className='text-[12px]'
                        placeholder='email@company.com'
                        dataAttr={`${row.id}-email`}
                        {...createTabNavigation('email')}
                    />
                </div>
            )}
            {cols.includes('phone') && (
                <div
                    className='text-blue-600 text-[12px] min-w-0 truncate border-r border-slate-200 px-2 py-1'
                    data-row-id={row.id}
                    data-col='phone'
                >
                    <InlineEditableText
                        value={row.phone}
                        onCommit={(v) => onUpdateField(row.id, 'phone', v)}
                        className='text-[12px]'
                        placeholder='Phone number'
                        dataAttr={`${row.id}-phone`}
                        {...createTabNavigation('phone')}
                    />
                </div>
            )}
            {cols.includes('country') && (
                <div
                    className={`text-blue-600 text-[12px] min-w-0 truncate border-r border-slate-200 px-2 py-1 ${
                        isCellMissing(row.id, 'country')
                            ? 'bg-red-50 border-red-200 ring-1 ring-red-300'
                            : ''
                    }`}
                    data-row-id={row.id}
                    data-col='country'
                >
                    {enableDropdownChips ? (
                        <ServicesMultiSelect
                            value={(row as any).address?.country || ''}
                            onChange={(v) =>
                                onUpdateField(row.id, 'address' as any, {
                                    ...((row as any).address || {}),
                                    country: v || '',
                                })
                            }
                            placeholder='Select Services'
                            onDropdownOptionUpdate={onDropdownOptionUpdate}
                            onNewItemCreated={onNewItemCreated}
                            accounts={allRows}
                        />
                    ) : (
                        <InlineEditableText
                            value={(row as any).address?.country || ''}
                            onCommit={(v) =>
                                onUpdateField(row.id, 'address' as any, {
                                    ...((row as any).address || {}),
                                    country: v,
                                })
                            }
                            className='text-[12px]'
                            placeholder=''
                            dataAttr={`${row.id}-country`}
                            {...createTabNavigation('country')}
                        />
                    )}
                </div>
            )}
            {cols.includes('addressLine1') && (
                <div
                    className='text-blue-600 text-[12px] min-w-0 truncate border-r border-slate-200 px-2 py-1'
                    data-row-id={row.id}
                    data-col='addressLine1'
                >
                    <InlineEditableText
                        value={(row as any).address?.addressLine1 || ''}
                        onCommit={(v) =>
                            onUpdateField(row.id, 'address' as any, {
                                ...((row as any).address || {}),
                                addressLine1: v,
                            })
                        }
                        className='text-[12px]'
                        placeholder='Address Line 1'
                        dataAttr={`${row.id}-addressLine1`}
                        {...createTabNavigation('addressLine1')}
                    />
                </div>
            )}
            {cols.includes('addressLine2') && (
                <div
                    className='text-blue-600 text-[12px] min-w-0 truncate border-r border-slate-200 px-2 py-1'
                    data-row-id={row.id}
                    data-col='addressLine2'
                >
                    <InlineEditableText
                        value={(row as any).address?.addressLine2 || ''}
                        onCommit={(v) =>
                            onUpdateField(row.id, 'address' as any, {
                                ...((row as any).address || {}),
                                addressLine2: v,
                            })
                        }
                        className='text-[12px]'
                        placeholder='Address Line 2'
                        dataAttr={`${row.id}-addressLine2`}
                        {...createTabNavigation('addressLine2')}
                    />
                </div>
            )}
            {cols.includes('city') && (
                <div
                    className='text-blue-600 text-[12px] min-w-0 truncate border-r border-slate-200 px-2 py-1'
                    data-row-id={row.id}
                    data-col='city'
                >
                    <InlineEditableText
                        value={(row as any).address?.city || ''}
                        onCommit={(v) =>
                            onUpdateField(row.id, 'address' as any, {
                                ...((row as any).address || {}),
                                city: v,
                            })
                        }
                        className='text-[12px]'
                        placeholder='City'
                        dataAttr={`${row.id}-city`}
                        {...createTabNavigation('city')}
                    />
                </div>
            )}
            {cols.includes('state') && (
                <div
                    className='text-blue-600 text-[12px] min-w-0 truncate border-r border-slate-200 px-2 py-1'
                    data-row-id={row.id}
                    data-col='state'
                >
                    <InlineEditableText
                        value={(row as any).address?.state || ''}
                        onCommit={(v) =>
                            onUpdateField(row.id, 'address' as any, {
                                ...((row as any).address || {}),
                                state: v,
                            })
                        }
                        className='text-[12px]'
                        placeholder='State'
                        dataAttr={`${row.id}-state`}
                        {...createTabNavigation('state')}
                    />
                </div>
            )}
            {cols.includes('pincode') && (
                <div
                    className='text-blue-600 text-[12px] min-w-0 truncate border-r border-slate-200 px-2 py-1'
                    data-row-id={row.id}
                    data-col='pincode'
                >
                    <InlineEditableText
                        value={(row as any).address?.pincode || ''}
                        onCommit={(v) =>
                            onUpdateField(row.id, 'address' as any, {
                                ...((row as any).address || {}),
                                pincode: v,
                            })
                        }
                        className='text-[12px]'
                        placeholder='PIN/ZIP'
                        dataAttr={`${row.id}-pincode`}
                        {...createTabNavigation('pincode')}
                    />
                </div>
            )}
            {cols.includes('enterpriseName') && (
                <div className='text-blue-600 text-[12px] min-w-0 truncate border-r border-slate-200 px-2 py-1'>
                    <AsyncChipSelect
                        type='enterprise'
                        value={row.enterpriseName}
                        onChange={(v) =>
                            onUpdateField(row.id, 'enterpriseName', v || '')
                        }
                        placeholder='Select enterprise'
                        compact
                        onDropdownOptionUpdate={onDropdownOptionUpdate}
                        onNewItemCreated={onNewItemCreated}
                    />
                </div>
            )}
            {cols.includes('productName') && (
                <div className='text-blue-600 text-[12px] min-w-0 truncate border-r border-slate-200 px-2 py-1'>
                    <AsyncChipSelect
                        type='product'
                        value={row.productName}
                        onChange={(v) =>
                            onUpdateField(row.id, 'productName', v || '')
                        }
                        placeholder='Select product'
                        compact
                        onDropdownOptionUpdate={onDropdownOptionUpdate}
                        onNewItemCreated={onNewItemCreated}
                    />
                </div>
            )}
            {cols.includes('serviceName') && (
                <div className='text-blue-600 text-[12px] min-w-0 truncate border-r border-slate-200 px-2 py-1'>
                    <AsyncChipSelect
                        type='service'
                        value={row.serviceName}
                        onChange={(v) =>
                            onUpdateField(row.id, 'serviceName', v || '')
                        }
                        placeholder='Select service'
                        compact
                        onDropdownOptionUpdate={onDropdownOptionUpdate}
                        onNewItemCreated={onNewItemCreated}
                    />
                </div>
            )}
            {cols.includes('status') && (
                <div className='relative border-r border-slate-200 px-0 py-0'>
                    <div
                        id={`status-${row.id}`}
                        className={`group relative w-full h-full min-h-[32px] flex items-center justify-center px-3 cursor-pointer select-none rounded-md overflow-hidden shadow-[inset_0_-1px_0_rgba(0,0,0,0.08)] transition-colors ${
                            row.status === 'Active'
                                ? 'bg-emerald-500'
                                : row.status === 'Inactive'
                                ? 'bg-rose-500'
                                : 'bg-slate-200'
                        }`}
                        style={{perspective: '600px'}}
                        onClick={(e) => {
                            const rect = (
                                e.currentTarget as HTMLDivElement
                            ).getBoundingClientRect();
                            const menu = document.createElement('div');
                            menu.style.position = 'fixed';
                            menu.style.top = `${rect.bottom + 6}px`;
                            menu.style.left = `${rect.left}px`;
                            menu.style.zIndex = '9999';
                            menu.style.minWidth = `${rect.width}px`;
                            menu.className =
                                'origin-top rounded-lg border border-slate-200 bg-white shadow-xl text-[12px] transition transform duration-150 ease-out';
                            menu.style.transform = 'scale(0.96)';
                            menu.style.opacity = '0';
                            menu.innerHTML = `
                                <div class="py-1">
                                    <button data-val="Active" class="flex items-center gap-2 w-full px-3 py-2 text-left rounded-md text-emerald-700 hover:bg-emerald-50">
                                        <span class="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                                        Active
                                    </button>
                                    <button data-val="Inactive" class="flex items-center gap-2 w-full px-3 py-2 text-left rounded-md text-rose-700 hover:bg-rose-50">
                                        <span class="inline-block w-2 h-2 rounded-full bg-rose-500"></span>
                                        Inactive
                                    </button>
                                </div>
                            `;
                            const handler = (ev: any) => {
                                const btn =
                                    ev.target?.closest?.('button[data-val]');
                                const val = btn?.getAttribute?.('data-val');
                                if (val) {
                                    onUpdateField(
                                        row.id,
                                        'status',
                                        val as 'Active' | 'Inactive',
                                    );
                                    document.body.removeChild(menu);
                                    document.removeEventListener(
                                        'click',
                                        outside,
                                    );
                                }
                            };
                            const outside = (ev: any) => {
                                if (!menu.contains(ev.target)) {
                                    document.body.removeChild(menu);
                                    document.removeEventListener(
                                        'click',
                                        outside,
                                    );
                                }
                            };
                            menu.addEventListener('click', handler);
                            document.body.appendChild(menu);
                            setTimeout(
                                () =>
                                    document.addEventListener('click', outside),
                                0,
                            );
                            requestAnimationFrame(() => {
                                menu.style.transform = 'scale(1)';
                                menu.style.opacity = '1';
                            });
                        }}
                    >
                        <span
                            className={`font-semibold text-[12px] tracking-wide capitalize ${
                                row.status ? 'text-white' : 'text-slate-700'
                            }`}
                        >
                            {row.status
                                ? row.status === 'Active'
                                    ? 'Active'
                                    : 'Inactive'
                                : 'Set status'}
                        </span>
                    </div>
                </div>
            )}
            {/* actions column removed */}
            {/* trailing add row removed; fill handle removed */}
            {!hideRowExpansion && isExpanded && expandedContent && (
                <motion.div
                    className='col-span-full'
                    initial={{opacity: 0, y: -4}}
                    animate={{opacity: 1, y: 0}}
                    transition={{duration: 0.18, ease: [0.22, 1, 0.36, 1]}}
                >
                    {expandedContent}
                </motion.div>
            )}
        </div>
    );
}

export default function EnterpriseAccountsTable({
    rows,
    onEdit,
    onDelete,
    title,
    groupByExternal,
    onGroupByChange,
    hideControls,
    visibleColumns,
    highlightQuery,
    onQuickAddRow,
    customColumnLabels,
    enableDropdownChips = false,
    dropdownOptions = {},
    onUpdateField,
    hideRowExpansion = false,
    incompleteRowIds = [],
    hasBlankRow = false,
    onDropdownOptionUpdate,
    onNewItemCreated,
    compressingRowId = null,
    foldingRowId = null,
}: AccountsTableProps) {
    // Helper function to check if a cell should be highlighted as missing
    const isCellMissing = (rowId: string, field: string) => {
        if (!incompleteRowIds.includes(rowId)) return false;

        const row = localRows.find((r) => r.id === rowId);
        if (!row) return false;

        switch (field) {
            case 'masterAccount':
                return !row.masterAccount && !row.enterpriseName;
            case 'accountName':
                return !row.accountName && !row.productName;
            case 'country':
                return !row.address?.country && !row.serviceName;
            default:
                return false;
        }
    };

    // Keep a local order for drag-and-drop. Sync when rows change
    const [order, setOrder] = useState<string[]>(() => rows.map((r) => r.id));
    const [localRows, setLocalRows] = useState<AccountRow[]>(rows);
    useEffect(() => {
        // Preserve existing order; append any new ids
        const existing = new Set(order);
        const merged = [
            ...order.filter((id) => rows.some((r) => r.id === id)),
            ...rows.filter((r) => !existing.has(r.id)).map((r) => r.id),
        ];
        setOrder(merged);
        // Deep copy licenses so new references are created
        const cloned = rows.map((r) => ({
            ...r,
            licenses: (r as any).licenses
                ? (r as any).licenses.map((l: any) => ({...l}))
                : [],
        })) as AccountRow[];
        setLocalRows(cloned);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rows.map((r) => r.id).join(',')]);

    const orderedItems = useMemo(
        () =>
            order
                .map((id) => localRows.find((r) => r.id === id))
                .filter(Boolean) as AccountRow[],
        [order, localRows],
    );

    // Persist helpers
    // Debounced autosave per-row to avoid excessive API traffic
    const saveTimersRef = useRef<Record<string, any>>({});
    const latestRowRef = useRef<Record<string, AccountRow>>({});
    function schedulePersist(row: AccountRow, delay = 600) {
        const rowId = String(row.id);
        latestRowRef.current[rowId] = row;
        if (saveTimersRef.current[rowId])
            clearTimeout(saveTimersRef.current[rowId]);
        saveTimersRef.current[rowId] = setTimeout(() => {
            const latest = latestRowRef.current[rowId];
            if (latest) void persistAccountRow(latest);
        }, delay);
    }
    useEffect(() => {
        return () => {
            // cleanup pending timers on unmount without forcing save
            Object.values(saveTimersRef.current).forEach((t) =>
                clearTimeout(t),
            );
        };
    }, []);
    async function persistAccountRow(row: AccountRow) {
        try {
            // Skip auto-save for temporary rows - let the parent handle enterprise linkage auto-save
            if (String(row.id || '').startsWith('tmp-')) {
                console.log(
                    '⏭️ Skipping old auto-save for temporary row, letting linkage auto-save handle it:',
                    row.id,
                );
                return;
            }
            const core = {
                accountName: row.accountName,
                email: row.email,
                phone: row.phone,
            } as any;
            // Map UI state into backend details JSON expected by server
            const addr = (row as any).address || {};
            const tech = (row as any).technical || {};
            const licenses = (((row as any).licenses as any[]) || []).map(
                (lic) => ({
                    enterprise: lic.enterprise || null,
                    product: lic.product || null,
                    service: lic.service || null,
                    category: lic.service || null,
                    licenseDate: lic.licenseStart || null,
                    expirationDate: lic.licenseEnd || null,
                    users:
                        typeof lic.users === 'number'
                            ? lic.users
                            : lic.users
                            ? parseInt(String(lic.users), 10)
                            : 0,
                    renewalNotice:
                        typeof lic.renewalNotice === 'boolean'
                            ? lic.renewalNotice
                            : !!lic.renewalNotice,
                    renewalNoticePeriod:
                        typeof lic.noticeDays === 'number'
                            ? lic.noticeDays
                            : lic.noticeDays
                            ? parseInt(String(lic.noticeDays), 10)
                            : null,
                    contacts: Array.isArray(lic.contacts)
                        ? lic.contacts.map((c: any) => ({
                              contact: c.contact || '',
                              title: c.title || '',
                              email: c.email || '',
                              phone: c.phone || '',
                          }))
                        : [],
                }),
            );
            const details = {
                firstName: row.firstName,
                lastName: row.lastName,
                globalClientName: (row as any).globalClientName || '',
                status: row.status,
                enterpriseName: row.enterpriseName,
                productName: row.productName,
                serviceName: row.serviceName,
                // Address fields are expected at the top-level of details
                addressLine1: addr.addressLine1 || '',
                addressLine2: addr.addressLine2 || '',
                country: addr.country || '',
                state: addr.state || '',
                city: addr.city || '',
                pincode: addr.pincode || '',
                // Technical user is expected as technicalUserDetails or technicalUsername
                technicalUserDetails: {
                    username: tech.username || '',
                    email: tech.email || '',
                    firstName: tech.firstName || '',
                },
                technicalUsername: tech.username || '',
                // Licenses are expected in details.services
                services: licenses,
            } as any;
            // Handle existing (non-temporary) rows
            // Check if we're on enterprise configuration page
            if (
                typeof window !== 'undefined' &&
                window.location.pathname.includes('/enterprise-configuration')
            ) {
                console.log(
                    '🔄 Updating enterprise linkage instead of account:',
                    row.id,
                );

                // For enterprise configuration, update the linkage via the parent's onUpdateField
                // The parent component will handle the enterprise linkage updates
                console.log(
                    '⏭️ Skipping direct API call for enterprise configuration page',
                );
                return;
            }

            // For other pages, use the original account API
            await api.put<AccountRow>('/api/accounts', {
                id: row.id,
                ...core,
                ...details,
            });
            // Related tables handled server-side from details
        } catch (_e) {
            // TODO: surface toast; keep silent here to avoid blocking UI
        }
    }

    function updateRowField(rowId: string, key: keyof AccountRow, value: any) {
        let changed: AccountRow | null = null;
        setLocalRows((prev) =>
            prev.map((r) => {
                if (r.id !== rowId) return r;
                const next = {...r, [key]: value} as AccountRow;
                changed = next;
                return next;
            }),
        );
        if (changed) schedulePersist(changed);

        // Also call the parent's onUpdateField function if provided
        if (onUpdateField) {
            console.log('🔗 Calling parent onUpdateField:', {
                rowId,
                key,
                value,
            });
            onUpdateField(rowId, key as string, value);
        }
    }

    function updateRowNested(
        rowId: string,
        path: ['address' | 'technical', string],
        value: any,
    ) {
        let changed: AccountRow | null = null;
        setLocalRows((prev) =>
            prev.map((r) => {
                if (r.id !== rowId) return r;
                const [root, field] = path;
                let next: AccountRow;
                if (root === 'address') {
                    next = {
                        ...r,
                        address: {
                            ...((r as any).address || {}),
                            [field]: value,
                        },
                    } as AccountRow;
                } else {
                    next = {
                        ...r,
                        technical: {
                            ...((r as any).technical || {}),
                            [field]: value,
                        },
                    } as AccountRow;
                }
                changed = next;
                return next;
            }),
        );
        if (changed) schedulePersist(changed);
    }

    function updateLicenseField(
        rowId: string,
        index: number,
        key:
            | 'enterprise'
            | 'product'
            | 'service'
            | 'licenseStart'
            | 'licenseEnd'
            | 'users'
            | 'renewalNotice'
            | 'noticeDays',
        value: any,
    ) {
        let changed: AccountRow | null = null;
        setLocalRows((prev) =>
            prev.map((r) => {
                if (r.id !== rowId) return r;
                const list = [...(((r as any).licenses as any[]) || [])];
                const curr = {...(list[index] || {})} as any;
                curr[key] = value;
                list[index] = curr;
                const next = {...r, licenses: list} as AccountRow;
                changed = next;
                return next;
            }),
        );
        if (changed) schedulePersist(changed);
    }
    // removed license contact chevron state
    function updateLicenseContactField(
        rowId: string,
        licIndex: number,
        contactIndex: number,
        key: 'contact' | 'title' | 'email' | 'phone',
        value: any,
    ) {
        let changed: AccountRow | null = null;
        setLocalRows((prev) =>
            prev.map((r) => {
                if (r.id !== rowId) return r;
                const licenses = [...(((r as any).licenses as any[]) || [])];
                const lic = {...(licenses[licIndex] || {})} as any;
                const contacts = [...((lic.contacts as any[]) || [])];
                const curr = {...(contacts[contactIndex] || {})};
                (curr as any)[key] = value;
                contacts[contactIndex] = curr;
                lic.contacts = contacts;
                licenses[licIndex] = lic;
                const next = {...r, licenses} as AccountRow;
                changed = next;
                return next;
            }),
        );
        if (changed) schedulePersist(changed);
    }
    function addLicenseContactRow(rowId: string, licIndex: number) {
        setLocalRows((prev) =>
            prev.map((r) => {
                if (r.id !== rowId) return r;
                const licenses = [...(((r as any).licenses as any[]) || [])];
                const lic = {...(licenses[licIndex] || {})} as any;
                const contacts = [...((lic.contacts as any[]) || [])];
                contacts.push({contact: '', title: '', email: '', phone: ''});
                lic.contacts = contacts;
                licenses[licIndex] = lic;
                return {...r, licenses} as AccountRow;
            }),
        );
    }
    const [groupBy, setGroupBy] = useState<
        'none' | 'enterpriseName' | 'productName' | 'serviceName'
    >('none');
    // sync external groupBy
    React.useEffect(() => {
        if (groupByExternal) setGroupBy(groupByExternal);
    }, [groupByExternal]);

    const columnOrder: AccountsTableProps['visibleColumns'] = useMemo(
        () => [
            // Parent table columns per request
            'masterAccount',
            'accountName',
            'country',
            'addressLine1',
            'addressLine2',
            'city',
            'state',
            'pincode',
        ],
        [],
    );
    const cols = useMemo(() => {
        const base = (columnOrder || []) as string[];
        if (!visibleColumns || visibleColumns.length === 0) return base;
        const allowed = new Set(visibleColumns as string[]);
        // Keep canonical order from columnOrder; filter by visibility
        return base.filter((c) => allowed.has(c));
    }, [visibleColumns, columnOrder]);

    const colSizes: Record<string, string> = {
        masterAccount: '140px',
        accountName: 'minmax(100px,0.8fr)', // Reduced from 1.1fr to 0.8fr (Product column)
        country: 'minmax(150px,1.4fr)', // Increased from 0.9fr to 1.4fr (Services column)
        addressLine1: 'minmax(160px,1.2fr)',
        addressLine2: 'minmax(160px,1.1fr)',
        city: 'minmax(100px,0.9fr)',
        state: 'minmax(100px,0.9fr)',
        pincode: 'minmax(100px,0.8fr)',
    };
    const [customColumns, setCustomColumns] = useState<string[]>([]);
    const [colWidths, setColWidths] = useState<Record<string, number>>({});
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [subItems, setSubItems] = useState<Record<string, string[]>>({});
    const [sectionOpen, setSectionOpen] = useState<
        Record<string, {address: boolean; technical: boolean; license: boolean}>
    >({});
    const [pinFirst, setPinFirst] = useState(true);
    const firstColWidth = '140px'; // enforce fixed width for first column
    const gridTemplate = useMemo(() => {
        const base = cols.map((c) => colSizes[c]).join('_');
        const custom = customColumns.map(() => 'minmax(110px,1fr)').join('_');
        return [base, custom].filter(Boolean).join('_');
    }, [cols, customColumns, colWidths]);

    const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

    const [contactModal, setContactModal] = useState<{
        open: boolean;
        rowId: string | null;
        licIndex: number | null;
    }>({open: false, rowId: null, licIndex: null});
    const [contactDrafts, setContactDrafts] = useState<
        Array<{contact: string; title: string; email: string; phone: string}>
    >([{contact: '', title: '', email: '', phone: ''}]);

    useEffect(() => {
        const handler = (e: any) => {
            const d = e?.detail || {};
            setContactDrafts([{contact: '', title: '', email: '', phone: ''}]);
            setContactModal({
                open: true,
                rowId: d.rowId || null,
                licIndex: d.licIndex ?? null,
            });
        };
        document.addEventListener('contact-modal-open', handler as any);
        return () =>
            document.removeEventListener('contact-modal-open', handler as any);
    }, []);

    const contactModalPortal = React.useMemo(() => {
        if (!contactModal.open) return null;
        const onClose = () =>
            setContactModal({open: false, rowId: null, licIndex: null});
        const onAddRow = () =>
            setContactDrafts((v) => [
                ...v,
                {contact: '', title: '', email: '', phone: ''},
            ]);
        const onRemoveRow = (idx: number) =>
            setContactDrafts((v) => v.filter((_, i) => i !== idx));
        const emailOk = (e: string) => !e || /.+@.+\..+/.test(String(e).trim());
        const phoneOk = (p: string) =>
            !p || /[0-9()+\-\s]{6,}/.test(String(p).trim());
        const nonEmpty = (d: {
            contact: string;
            title: string;
            email: string;
            phone: string;
        }) => (d.contact || d.title || d.email || d.phone).trim?.() !== '';
        const validDrafts = contactDrafts
            .filter(nonEmpty)
            .filter((d) => emailOk(d.email) && phoneOk(d.phone));
        const canSave = validDrafts.length > 0;
        const onSave = () => {
            if (!contactModal.rowId || contactModal.licIndex == null)
                return onClose();
            const rowId = contactModal.rowId;
            const licIndex = contactModal.licIndex;
            // append each draft as a new contact then persist via existing helpers
            let baseCount = 0;
            const row = localRows.find((r) => r.id === rowId) as any;
            if (row && Array.isArray(row.licenses) && row.licenses[licIndex]) {
                baseCount = (row.licenses[licIndex].contacts || []).length;
            }
            validDrafts.forEach((d, idx) => {
                addLicenseContactRow(rowId, licIndex);
                const ci = baseCount + idx;
                updateLicenseContactField(
                    rowId,
                    licIndex,
                    ci,
                    'contact',
                    d.contact || '',
                );
                updateLicenseContactField(
                    rowId,
                    licIndex,
                    ci,
                    'title',
                    d.title || '',
                );
                updateLicenseContactField(
                    rowId,
                    licIndex,
                    ci,
                    'email',
                    d.email || '',
                );
                updateLicenseContactField(
                    rowId,
                    licIndex,
                    ci,
                    'phone',
                    d.phone || '',
                );
            });
            onClose();
        };
        return createPortal(
            <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'>
                <div className='bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden'>
                    <div className='px-4 py-3 border-b border-slate-200 flex items-center justify-between'>
                        <div className='text-[14px] font-semibold text-slate-800'>
                            Contact details
                        </div>
                        <button
                            className='p-1 rounded hover:bg-slate-100'
                            onClick={onClose}
                        >
                            <X className='w-4 h-4' />
                        </button>
                    </div>
                    <div className='p-4 space-y-3'>
                        <div className='max-h-[52vh] overflow-y-auto pr-1 space-y-2'>
                            <AnimatePresence initial={false}>
                                {contactDrafts.map((d, idx) => {
                                    const emailValid = emailOk(d.email);
                                    const phoneValid = phoneOk(d.phone);
                                    return (
                                        <motion.div
                                            key={`ct-${idx}`}
                                            initial={{
                                                opacity: 0,
                                                y: 6,
                                                scale: 0.98,
                                            }}
                                            animate={{
                                                opacity: 1,
                                                y: 0,
                                                scale: 1,
                                            }}
                                            exit={{
                                                opacity: 0,
                                                y: -6,
                                                scale: 0.98,
                                            }}
                                            className='rounded-md border border-slate-200 bg-slate-50/40 px-3 py-2'
                                        >
                                            <div className='grid grid-cols-2 gap-2'>
                                                <input
                                                    className='border border-slate-300 rounded px-2 py-1 text-[12px]'
                                                    placeholder='Contact name'
                                                    value={d.contact}
                                                    onChange={(e) =>
                                                        setContactDrafts((v) =>
                                                            v.map((x, i) =>
                                                                i === idx
                                                                    ? {
                                                                          ...x,
                                                                          contact:
                                                                              e
                                                                                  .target
                                                                                  .value,
                                                                      }
                                                                    : x,
                                                            ),
                                                        )
                                                    }
                                                />
                                                <input
                                                    className='border border-slate-300 rounded px-2 py-1 text-[12px]'
                                                    placeholder='Title'
                                                    value={d.title}
                                                    onChange={(e) =>
                                                        setContactDrafts((v) =>
                                                            v.map((x, i) =>
                                                                i === idx
                                                                    ? {
                                                                          ...x,
                                                                          title: e
                                                                              .target
                                                                              .value,
                                                                      }
                                                                    : x,
                                                            ),
                                                        )
                                                    }
                                                />
                                                <input
                                                    className={`border rounded px-2 py-1 text-[12px] ${
                                                        emailValid
                                                            ? 'border-slate-300'
                                                            : 'border-rose-400 bg-rose-50/30'
                                                    }`}
                                                    placeholder='Email'
                                                    value={d.email}
                                                    onChange={(e) =>
                                                        setContactDrafts((v) =>
                                                            v.map((x, i) =>
                                                                i === idx
                                                                    ? {
                                                                          ...x,
                                                                          email: e
                                                                              .target
                                                                              .value,
                                                                      }
                                                                    : x,
                                                            ),
                                                        )
                                                    }
                                                />
                                                <input
                                                    className={`border rounded px-2 py-1 text-[12px] ${
                                                        phoneValid
                                                            ? 'border-slate-300'
                                                            : 'border-rose-400 bg-rose-50/30'
                                                    }`}
                                                    placeholder='Phone'
                                                    value={d.phone}
                                                    onChange={(e) =>
                                                        setContactDrafts((v) =>
                                                            v.map((x, i) =>
                                                                i === idx
                                                                    ? {
                                                                          ...x,
                                                                          phone: e
                                                                              .target
                                                                              .value,
                                                                      }
                                                                    : x,
                                                            ),
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div className='flex justify-end pt-2'>
                                                {contactDrafts.length > 1 && (
                                                    <button
                                                        className='text-[11px] px-2 py-1 rounded border border-slate-300 hover:bg-slate-100'
                                                        onClick={() =>
                                                            onRemoveRow(idx)
                                                        }
                                                        title='Remove contact'
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                        <div className='flex justify-between items-center'>
                            <button
                                className='text-[12px] px-2 py-1 rounded border border-slate-300 hover:bg-slate-50'
                                onClick={onAddRow}
                            >
                                Add another
                            </button>
                            <div className='space-x-2'>
                                <button
                                    className='text-[12px] px-3 py-1 rounded border border-slate-300 hover:bg-slate-50'
                                    onClick={onClose}
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={!canSave}
                                    className={`text-[12px] px-3 py-1 rounded ${
                                        canSave
                                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                            : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                                    }`}
                                    onClick={onSave}
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>,
            document.body,
        );
    }, [contactModal, contactDrafts, localRows]);
    // removed fill down state

    const startResize = (
        colKey: string,
        e: React.MouseEvent<HTMLDivElement>,
    ) => {
        e.preventDefault();
        e.stopPropagation();
        const parent = (e.currentTarget as HTMLDivElement).parentElement;
        const startX = e.clientX;
        const startWidth = parent ? parent.getBoundingClientRect().width : 120;
        const onMove = (ev: MouseEvent) => {
            const delta = ev.clientX - startX;
            const next = Math.max(70, startWidth + delta);
            setColWidths((m) => ({...m, [colKey]: next}));
        };
        const onUp = () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    };

    // removed fill handlers

    const toggleExpanded = (id: string) => {
        setExpandedRows((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const isSectionOpen = (
        id: string,
        key: 'address' | 'technical' | 'license',
    ): boolean => {
        const o = sectionOpen[id];
        return o ? !!o[key] : false;
    };
    const toggleSection = (
        id: string,
        key: 'address' | 'technical' | 'license',
    ) => {
        setSectionOpen((prev) => {
            const base = prev[id] || {
                address: false,
                technical: false,
                license: false,
            };
            return {
                ...prev,
                [id]: {...base, [key]: !base[key]},
            };
        });
    };

    const highlightText = (text: string) => {
        const q = (highlightQuery || '').trim();
        if (!q) return <>{text}</>;
        try {
            const esc = q.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
            const re = new RegExp(`(${esc})`, 'ig');
            const parts = text.split(re);
            return (
                <>
                    {parts.map((part, i) =>
                        re.test(part) ? (
                            <mark
                                key={i}
                                className='bg-yellow-200 px-0.5 rounded'
                            >
                                {part}
                            </mark>
                        ) : (
                            <span key={i}>{part}</span>
                        ),
                    )}
                </>
            );
        } catch {
            return <>{text}</>;
        }
    };
    const [sortCol, setSortCol] = useState<
        | 'accountName'
        | 'email'
        | 'status'
        | 'servicesCount'
        | 'enterpriseName'
        | 'servicesSummary'
        | null
    >(null);
    const [sortDir, setSortDir] = useState<'asc' | 'desc' | null>(null);

    const toggleSort = (
        col:
            | 'accountName'
            | 'email'
            | 'status'
            | 'servicesCount'
            | 'enterpriseName'
            | 'servicesSummary',
    ) => {
        const nextDir: 'asc' | 'desc' =
            sortCol === col && sortDir === 'asc' ? 'desc' : 'asc';
        setSortCol(col);
        setSortDir(nextDir);
    };

    const displayItems = useMemo(() => {
        const base = [...orderedItems];
        if (!sortCol || !sortDir) return base;
        base.sort((a, b) => {
            const av = String((a as any)[sortCol] ?? '');
            const bv = String((b as any)[sortCol] ?? '');
            const comp = av.localeCompare(bv, undefined, {
                numeric: true,
                sensitivity: 'base',
            });
            return sortDir === 'asc' ? comp : -comp;
        });
        return base;
    }, [orderedItems, sortCol, sortDir]);

    return (
        <div className='w-full compact-table safari-tight'>
            <div className='flex items-center justify-between mb-2'>
                <h3 className='text-sm font-semibold text-slate-800'>
                    {title ?? 'Enterprise Configurations Details'}
                </h3>
            </div>
            <div role='table' className='p-0 overflow-x-auto'>
                <div className='w-full relative'>
                    {(() => {
                        const cssTemplate = gridTemplate.split('_').join(' ');
                        const defaultLabels: Record<string, string> = {
                            masterAccount: 'Master Account',
                            accountName: 'Account',
                            country: 'Country',
                            addressLine1: 'Address Line 1',
                            addressLine2: 'Address Line 2',
                            city: 'City',
                            state: 'State',
                            pincode: 'Pin/Zip',
                        };

                        // Merge custom labels with defaults
                        const labelFor: Record<string, string> = {
                            ...defaultLabels,
                            ...customColumnLabels,
                        };

                        const iconFor: Record<string, React.ReactNode> = {
                            masterAccount: (
                                <Building2 className='h-3.5 w-3.5 text-blue-600' />
                            ),
                            accountName: (
                                <FileText className='h-3.5 w-3.5 text-blue-600' />
                            ),
                            country: (
                                <Globe className='h-3.5 w-3.5 text-blue-600' />
                            ),
                            addressLine1: (
                                <MapPin className='h-3.5 w-3.5 text-blue-600' />
                            ),
                            addressLine2: (
                                <Home className='h-3.5 w-3.5 text-blue-600' />
                            ),
                            city: (
                                <MapPin className='h-3.5 w-3.5 text-blue-600' />
                            ),
                            state: (
                                <MapPin className='h-3.5 w-3.5 text-blue-600' />
                            ),
                            pincode: (
                                <MapPin className='h-3.5 w-3.5 text-blue-600' />
                            ),
                        };
                        return (
                            <div className='rounded-xl border border-slate-300 shadow-sm bg-white pb-1'>
                                <div
                                    className='sticky top-0 z-30 grid w-full overflow-visible gap-0 px-0 py-2 text-xs font-semibold text-slate-900 bg-white/90 supports-[backdrop-filter]:backdrop-blur-sm border-b border-slate-200 divide-x divide-slate-200 shadow-sm'
                                    style={{gridTemplateColumns: cssTemplate}}
                                >
                                    {cols.map((c, idx) => (
                                        <div
                                            key={c}
                                            className={`relative flex items-center gap-1 px-2 py-1.5 rounded-sm hover:bg-slate-50 transition-colors duration-150 group ${
                                                idx === 0 && pinFirst
                                                    ? 'sticky left-0 z-20 bg-sky-50/80 backdrop-blur-sm border-l-4 border-l-slate-200 shadow-[6px_0_8px_-6px_rgba(15,23,42,0.10)] after:content-[" "] after:absolute after:top-0 after:right-0 after:h-full after:w-px after:bg-slate-200'
                                                    : ''
                                            }`}
                                            style={
                                                idx === 0
                                                    ? {
                                                          width: firstColWidth,
                                                          minWidth:
                                                              firstColWidth,
                                                          maxWidth:
                                                              firstColWidth,
                                                      }
                                                    : undefined
                                            }
                                        >
                                            <div className='flex items-center gap-2'>
                                                {iconFor[c] && iconFor[c]}
                                                <span>{labelFor[c] || c}</span>
                                            </div>
                                            {idx === 0 && (
                                                <button
                                                    className='ml-1 p-1 rounded hover:bg-slate-100 text-blue-600'
                                                    onClick={() =>
                                                        setPinFirst((v) => !v)
                                                    }
                                                    title={
                                                        pinFirst
                                                            ? 'Unfreeze column'
                                                            : 'Freeze column'
                                                    }
                                                >
                                                    {pinFirst ? (
                                                        <Pin className='w-3.5 h-3.5' />
                                                    ) : (
                                                        <PinOff className='w-3.5 h-3.5' />
                                                    )}
                                                </button>
                                            )}
                                            {[
                                                'accountName',
                                                'email',
                                                'enterpriseName',
                                            ].includes(c) && (
                                                <button
                                                    onClick={() =>
                                                        toggleSort(c as any)
                                                    }
                                                    className='inline-flex items-center -mr-1'
                                                >
                                                    <ArrowUp
                                                        className={`w-3 h-3 ${
                                                            sortCol ===
                                                                (c as any) &&
                                                            sortDir === 'asc'
                                                                ? 'text-sky-600'
                                                                : 'text-slate-400'
                                                        }`}
                                                    />
                                                    <ArrowDown
                                                        className={`w-3 h-3 ${
                                                            sortCol ===
                                                                (c as any) &&
                                                            sortDir === 'desc'
                                                                ? 'text-sky-600'
                                                                : 'text-slate-400'
                                                        }`}
                                                    />
                                                </button>
                                            )}
                                            <div
                                                onMouseDown={(e) =>
                                                    startResize(c, e)
                                                }
                                                className='ml-auto h-4 w-1.5 cursor-col-resize bg-gradient-to-b from-slate-300 to-slate-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150'
                                                title='Resize column'
                                            />
                                            {c === 'accountName' && (
                                                <span
                                                    aria-hidden
                                                    className='pointer-events-none absolute right-0 top-0 h-full w-px bg-slate-200/80'
                                                />
                                            )}
                                        </div>
                                    ))}
                                    {customColumns.map((name, idx) => (
                                        <div
                                            key={`custom-${idx}`}
                                            className='min-w-0'
                                        >
                                            {name}
                                        </div>
                                    ))}
                                    {/* trailing add column removed */}
                                </div>
                            </div>
                        );
                    })()}
                    {groupBy === 'none' ? (
                        <div className='space-y-0 divide-y divide-slate-200'>
                            {displayItems.map((r, idx) => (
                                <React.Fragment key={r.id}>
                                    <SortableAccountRow
                                        key={r.id}
                                        row={r}
                                        index={idx}
                                        cols={cols}
                                        gridTemplate={gridTemplate}
                                        highlightQuery={highlightQuery}
                                        onEdit={onEdit}
                                        onDelete={onDelete}
                                        onQuickAddRow={onQuickAddRow}
                                        customColumns={customColumns}
                                        pinFirst={pinFirst}
                                        firstColWidth={firstColWidth}
                                        isExpanded={expandedRows.has(r.id)}
                                        onToggle={toggleExpanded}
                                        hideRowExpansion={hideRowExpansion}
                                        enableDropdownChips={
                                            enableDropdownChips
                                        }
                                        onDropdownOptionUpdate={
                                            onDropdownOptionUpdate
                                        }
                                        onNewItemCreated={onNewItemCreated}
                                        isCellMissing={isCellMissing}
                                        compressingRowId={compressingRowId}
                                        foldingRowId={foldingRowId}
                                        allRows={rows}
                                        expandedContent={
                                            hideRowExpansion ? null : (
                                                <div className='relative bg-white px-2 py-3 pl-6 rounded-md border border-slate-200 shadow-sm'>
                                                    <motion.div
                                                        layout
                                                        initial={{
                                                            scaleY: 0,
                                                            opacity: 0,
                                                        }}
                                                        animate={{
                                                            scaleY: 1,
                                                            opacity: 1,
                                                        }}
                                                        transition={{
                                                            duration: 0.28,
                                                            ease: [
                                                                0.22, 1, 0.36,
                                                                1,
                                                            ],
                                                        }}
                                                        className='absolute left-3 top-0 bottom-0 w-px bg-gradient-to-b from-sky-400 via-emerald-400 to-violet-400 origin-top'
                                                    />
                                                    {/* Address section removed in favor of parent columns */}
                                                    {/* Technical */}
                                                    <div className='relative mb-4'>
                                                        <motion.div
                                                            layout
                                                            initial={{
                                                                scaleX: 0,
                                                                opacity: 0,
                                                            }}
                                                            animate={{
                                                                scaleX: isSectionOpen(
                                                                    r.id,
                                                                    'technical',
                                                                )
                                                                    ? [0, 1]
                                                                    : [1, 0.6],
                                                                opacity:
                                                                    isSectionOpen(
                                                                        r.id,
                                                                        'technical',
                                                                    )
                                                                        ? [
                                                                              0.4,
                                                                              1,
                                                                          ]
                                                                        : [
                                                                              1,
                                                                              0.6,
                                                                          ],
                                                            }}
                                                            viewport={{
                                                                once: true,
                                                            }}
                                                            transition={{
                                                                duration: 0.25,
                                                                ease: 'easeOut',
                                                            }}
                                                            className='absolute -left-3 top-4 w-3 h-px bg-gradient-to-r from-sky-400 to-emerald-400 origin-left'
                                                        />
                                                        <motion.div
                                                            layout
                                                            initial={{
                                                                scale: 0.6,
                                                                opacity: 0.6,
                                                            }}
                                                            animate={
                                                                isSectionOpen(
                                                                    r.id,
                                                                    'technical',
                                                                )
                                                                    ? {
                                                                          scale: [
                                                                              0.7,
                                                                              1.1,
                                                                              1,
                                                                          ],
                                                                          opacity:
                                                                              [
                                                                                  0.7,
                                                                                  1,
                                                                                  1,
                                                                              ],
                                                                      }
                                                                    : {
                                                                          scale: 0.8,
                                                                          opacity: 0.7,
                                                                      }
                                                            }
                                                            transition={{
                                                                times: [
                                                                    0, 0.5, 0.8,
                                                                    1,
                                                                ],
                                                                duration: 0.45,
                                                                ease: 'easeOut',
                                                            }}
                                                            className='absolute -left-3 top-3 h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_2px_#fff]'
                                                        />
                                                        <div className='flex items-center gap-1 text-[11px] font-semibold text-slate-700 mb-1'>
                                                            <button
                                                                className='p-0.5 rounded hover:bg-slate-100'
                                                                onClick={() =>
                                                                    toggleSection(
                                                                        r.id,
                                                                        'technical',
                                                                    )
                                                                }
                                                                title='Toggle technical user'
                                                            >
                                                                <motion.span
                                                                    initial={
                                                                        false
                                                                    }
                                                                    animate={{
                                                                        rotate: isSectionOpen(
                                                                            r.id,
                                                                            'technical',
                                                                        )
                                                                            ? 90
                                                                            : 0,
                                                                    }}
                                                                    transition={{
                                                                        type: 'spring',
                                                                        stiffness: 520,
                                                                        damping: 30,
                                                                    }}
                                                                    className='inline-flex'
                                                                >
                                                                    <ChevronRight className='h-3.5 w-3.5 text-blue-600' />
                                                                </motion.span>
                                                            </button>
                                                            Technical User
                                                        </div>
                                                        {isSectionOpen(
                                                            r.id,
                                                            'technical',
                                                        ) && (
                                                            <div className='border rounded-md overflow-hidden'>
                                                                <div
                                                                    className='grid text-[10px] bg-slate-50 text-slate-700 px-2 py-1 divide-x divide-slate-200'
                                                                    style={{
                                                                        gridTemplateColumns:
                                                                            'repeat(9,minmax(100px,1fr))',
                                                                    }}
                                                                >
                                                                    <div className='flex items-center gap-2'>
                                                                        <User className='h-3 w-3 text-blue-600' />
                                                                        <span>
                                                                            First
                                                                            Name
                                                                        </span>
                                                                    </div>
                                                                    <div className='flex items-center gap-2'>
                                                                        <User className='h-3 w-3 text-blue-600' />
                                                                        <span>
                                                                            Middle
                                                                            Name
                                                                        </span>
                                                                    </div>
                                                                    <div className='flex items-center gap-2'>
                                                                        <User className='h-3 w-3 text-blue-600' />
                                                                        <span>
                                                                            Last
                                                                            Name
                                                                        </span>
                                                                    </div>
                                                                    <div className='flex items-center gap-2'>
                                                                        <Mail className='h-3 w-3 text-blue-600' />
                                                                        <span>
                                                                            Email
                                                                            Address
                                                                        </span>
                                                                    </div>
                                                                    <div className='flex items-center gap-2'>
                                                                        <Activity className='h-3 w-3 text-blue-600' />
                                                                        <span>
                                                                            Status
                                                                        </span>
                                                                    </div>
                                                                    <div className='flex items-center gap-2'>
                                                                        <Calendar className='h-3 w-3 text-blue-600' />
                                                                        <span>
                                                                            Start
                                                                            Date
                                                                        </span>
                                                                    </div>
                                                                    <div className='flex items-center gap-2'>
                                                                        <Calendar className='h-3 w-3 text-blue-600' />
                                                                        <span>
                                                                            End
                                                                            Date
                                                                        </span>
                                                                    </div>
                                                                    <div className='flex items-center gap-2'>
                                                                        <Key className='h-3 w-3 text-blue-600' />
                                                                        <span>
                                                                            Password
                                                                        </span>
                                                                    </div>
                                                                    <div className='flex items-center gap-2'>
                                                                        <Settings className='h-3 w-3 text-blue-600' />
                                                                        <span>
                                                                            Technical
                                                                            User
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div
                                                                    className='grid text-[12px] text-slate-800 px-0 py-0 border-t border-slate-200'
                                                                    style={{
                                                                        gridTemplateColumns:
                                                                            'repeat(9,minmax(100px,1fr))',
                                                                    }}
                                                                >
                                                                    <div className='px-2 py-2 border-r border-slate-200'>
                                                                        <InlineEditableText
                                                                            value={
                                                                                r
                                                                                    .technical
                                                                                    ?.firstName ||
                                                                                ''
                                                                            }
                                                                            onCommit={(
                                                                                v,
                                                                            ) =>
                                                                                updateRowNested(
                                                                                    r.id,
                                                                                    [
                                                                                        'technical',
                                                                                        'firstName',
                                                                                    ],
                                                                                    v,
                                                                                )
                                                                            }
                                                                            placeholder='First Name'
                                                                        />
                                                                    </div>
                                                                    <div className='px-2 py-2 border-r border-slate-200'>
                                                                        <InlineEditableText
                                                                            value={
                                                                                r
                                                                                    .technical
                                                                                    ?.middleName ||
                                                                                ''
                                                                            }
                                                                            onCommit={(
                                                                                v,
                                                                            ) =>
                                                                                updateRowNested(
                                                                                    r.id,
                                                                                    [
                                                                                        'technical',
                                                                                        'middleName',
                                                                                    ],
                                                                                    v,
                                                                                )
                                                                            }
                                                                            placeholder='Middle Name'
                                                                        />
                                                                    </div>
                                                                    <div className='px-2 py-2 border-r border-slate-200'>
                                                                        <InlineEditableText
                                                                            value={
                                                                                r
                                                                                    .technical
                                                                                    ?.lastName ||
                                                                                ''
                                                                            }
                                                                            onCommit={(
                                                                                v,
                                                                            ) =>
                                                                                updateRowNested(
                                                                                    r.id,
                                                                                    [
                                                                                        'technical',
                                                                                        'lastName',
                                                                                    ],
                                                                                    v,
                                                                                )
                                                                            }
                                                                            placeholder='Last Name'
                                                                        />
                                                                    </div>
                                                                    <div className='px-2 py-2 border-r border-slate-200'>
                                                                        <InlineEditableText
                                                                            value={
                                                                                r
                                                                                    .technical
                                                                                    ?.email ||
                                                                                ''
                                                                            }
                                                                            onCommit={(
                                                                                v,
                                                                            ) =>
                                                                                updateRowNested(
                                                                                    r.id,
                                                                                    [
                                                                                        'technical',
                                                                                        'email',
                                                                                    ],
                                                                                    v,
                                                                                )
                                                                            }
                                                                            placeholder='Email Address'
                                                                        />
                                                                    </div>
                                                                    <div className='px-2 py-2 border-r border-slate-200'>
                                                                        <InlineEditableText
                                                                            value={
                                                                                r
                                                                                    .technical
                                                                                    ?.status ||
                                                                                ''
                                                                            }
                                                                            onCommit={(
                                                                                v,
                                                                            ) =>
                                                                                updateRowNested(
                                                                                    r.id,
                                                                                    [
                                                                                        'technical',
                                                                                        'status',
                                                                                    ],
                                                                                    v,
                                                                                )
                                                                            }
                                                                            placeholder='Status'
                                                                        />
                                                                    </div>
                                                                    <div className='px-2 py-2 border-r border-slate-200'>
                                                                        <InlineEditableText
                                                                            value={
                                                                                r
                                                                                    .technical
                                                                                    ?.startDate ||
                                                                                ''
                                                                            }
                                                                            onCommit={(
                                                                                v,
                                                                            ) =>
                                                                                updateRowNested(
                                                                                    r.id,
                                                                                    [
                                                                                        'technical',
                                                                                        'startDate',
                                                                                    ],
                                                                                    v,
                                                                                )
                                                                            }
                                                                            placeholder='Start Date'
                                                                        />
                                                                    </div>
                                                                    <div className='px-2 py-2 border-r border-slate-200'>
                                                                        <InlineEditableText
                                                                            value={
                                                                                r
                                                                                    .technical
                                                                                    ?.endDate ||
                                                                                ''
                                                                            }
                                                                            onCommit={(
                                                                                v,
                                                                            ) =>
                                                                                updateRowNested(
                                                                                    r.id,
                                                                                    [
                                                                                        'technical',
                                                                                        'endDate',
                                                                                    ],
                                                                                    v,
                                                                                )
                                                                            }
                                                                            placeholder='End Date'
                                                                        />
                                                                    </div>
                                                                    <div className='px-2 py-2 border-r border-slate-200'>
                                                                        <InlineEditableText
                                                                            value={
                                                                                r
                                                                                    .technical
                                                                                    ?.password ||
                                                                                ''
                                                                            }
                                                                            onCommit={(
                                                                                v,
                                                                            ) =>
                                                                                updateRowNested(
                                                                                    r.id,
                                                                                    [
                                                                                        'technical',
                                                                                        'password',
                                                                                    ],
                                                                                    v,
                                                                                )
                                                                            }
                                                                            placeholder='Password'
                                                                        />
                                                                    </div>
                                                                    <div className='px-2 py-2'>
                                                                        <InlineEditableText
                                                                            value={
                                                                                r
                                                                                    .technical
                                                                                    ?.technicalUser ||
                                                                                ''
                                                                            }
                                                                            onCommit={(
                                                                                v,
                                                                            ) =>
                                                                                updateRowNested(
                                                                                    r.id,
                                                                                    [
                                                                                        'technical',
                                                                                        'technicalUser',
                                                                                    ],
                                                                                    v,
                                                                                )
                                                                            }
                                                                            placeholder='Technical User'
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {/* License */}
                                                    <div className='relative'>
                                                        <motion.div
                                                            layout
                                                            initial={{
                                                                scaleX: 0,
                                                                opacity: 0,
                                                            }}
                                                            whileInView={{
                                                                scaleX: 1,
                                                                opacity: 1,
                                                            }}
                                                            viewport={{
                                                                once: true,
                                                            }}
                                                            transition={{
                                                                duration: 0.25,
                                                            }}
                                                            className='absolute -left-3 top-4 w-3 h-px bg-gradient-to-r from-violet-400 to-amber-400 origin-left'
                                                        />
                                                        <motion.div
                                                            layout
                                                            initial={{
                                                                scale: 0,
                                                                opacity: 0,
                                                            }}
                                                            animate={{
                                                                scale: 1,
                                                                opacity: 1,
                                                            }}
                                                            transition={{
                                                                type: 'spring',
                                                                stiffness: 420,
                                                                damping: 24,
                                                            }}
                                                            className='absolute -left-3 top-3 h-2 w-2 rounded-full bg-violet-500 shadow-[0_0_0_2px_#fff]'
                                                        />
                                                        <div className='flex items-center gap-1 text-[11px] font-semibold text-slate-700 mb-1'>
                                                            <button
                                                                className='p-0.5 rounded hover:bg-slate-100'
                                                                onClick={() =>
                                                                    toggleSection(
                                                                        r.id,
                                                                        'license',
                                                                    )
                                                                }
                                                                title='Toggle license details'
                                                            >
                                                                <motion.span
                                                                    initial={
                                                                        false
                                                                    }
                                                                    animate={{
                                                                        rotate: isSectionOpen(
                                                                            r.id,
                                                                            'license',
                                                                        )
                                                                            ? 90
                                                                            : 0,
                                                                    }}
                                                                    transition={{
                                                                        type: 'spring',
                                                                        stiffness: 520,
                                                                        damping: 30,
                                                                    }}
                                                                    className='inline-flex'
                                                                >
                                                                    <ChevronRight className='h-3.5 w-3.5 text-blue-600' />
                                                                </motion.span>
                                                            </button>
                                                            License Details
                                                        </div>
                                                        {isSectionOpen(
                                                            r.id,
                                                            'license',
                                                        ) && (
                                                            <div className='border rounded-md overflow-hidden bg-gradient-to-b from-white to-slate-50'>
                                                                {(() => {
                                                                    const hasRenewal =
                                                                        (
                                                                            r.licenses ||
                                                                            []
                                                                        ).some(
                                                                            (
                                                                                l,
                                                                            ) =>
                                                                                !!l.renewalNotice,
                                                                        );
                                                                    return (
                                                                        <div
                                                                            className='grid text-[10px] bg-slate-100/90 text-slate-800 px-2 py-1 divide-x divide-slate-200'
                                                                            style={{
                                                                                gridTemplateColumns:
                                                                                    'repeat(8,minmax(100px,1fr))',
                                                                            }}
                                                                        >
                                                                            <div className='flex items-center gap-2'>
                                                                                <Package className='h-3 w-3 text-blue-600' />
                                                                                <span>
                                                                                    Product
                                                                                </span>
                                                                            </div>
                                                                            <div className='flex items-center gap-2'>
                                                                                <Cpu className='h-3 w-3 text-blue-600' />
                                                                                <span>
                                                                                    Service
                                                                                </span>
                                                                            </div>
                                                                            <div className='flex items-center gap-2'>
                                                                                <Calendar className='h-3 w-3 text-blue-600' />
                                                                                <span>
                                                                                    License
                                                                                    Start
                                                                                    Date
                                                                                </span>
                                                                            </div>
                                                                            <div className='flex items-center gap-2'>
                                                                                <Calendar className='h-3 w-3 text-blue-600' />
                                                                                <span>
                                                                                    License
                                                                                    End
                                                                                    Date
                                                                                </span>
                                                                            </div>
                                                                            <div className='flex items-center gap-2'>
                                                                                <Users className='h-3 w-3 text-blue-600' />
                                                                                <span>
                                                                                    Number
                                                                                    of
                                                                                    Users
                                                                                </span>
                                                                            </div>
                                                                            <div className='flex items-center gap-2'>
                                                                                <Bell className='h-3 w-3 text-blue-600' />
                                                                                <span>
                                                                                    Renewal
                                                                                    Notice
                                                                                </span>
                                                                            </div>
                                                                            <div className='flex items-center gap-2'>
                                                                                <Phone className='h-3 w-3 text-blue-600' />
                                                                                <span>
                                                                                    Contact
                                                                                    Details
                                                                                </span>
                                                                            </div>
                                                                            <div className='flex items-center gap-2'>
                                                                                <Clock className='h-3 w-3 text-blue-600' />
                                                                                <span>
                                                                                    Notice
                                                                                    Period
                                                                                    (Days)
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })()}
                                                                {(
                                                                    r.licenses ||
                                                                    []
                                                                ).length > 0 ? (
                                                                    <div className='divide-y divide-slate-200'>
                                                                        {(() => {
                                                                            const hasRenewal =
                                                                                (
                                                                                    r.licenses ||
                                                                                    []
                                                                                ).some(
                                                                                    (
                                                                                        l,
                                                                                    ) =>
                                                                                        !!l.renewalNotice,
                                                                                );
                                                                            return (
                                                                                <>
                                                                                    {(
                                                                                        r.licenses ||
                                                                                        []
                                                                                    ).map(
                                                                                        (
                                                                                            lic,
                                                                                            i,
                                                                                        ) => (
                                                                                            <div
                                                                                                key={
                                                                                                    i
                                                                                                }
                                                                                                className={`grid text-[12px] text-slate-800 px-0 py-0 border-t border-slate-200 ${
                                                                                                    i %
                                                                                                        2 ===
                                                                                                    0
                                                                                                        ? 'bg-white'
                                                                                                        : 'bg-slate-50/60'
                                                                                                }`}
                                                                                                style={{
                                                                                                    gridTemplateColumns:
                                                                                                        'repeat(8,minmax(100px,1fr))',
                                                                                                }}
                                                                                            >
                                                                                                <div className='px-2 py-2 border-r border-slate-200 min-w-0 overflow-hidden'>
                                                                                                    <AsyncChipSelect
                                                                                                        type='product'
                                                                                                        value={
                                                                                                            lic.product ||
                                                                                                            ''
                                                                                                        }
                                                                                                        onChange={(
                                                                                                            v,
                                                                                                        ) =>
                                                                                                            updateLicenseField(
                                                                                                                r.id,
                                                                                                                i,
                                                                                                                'product',
                                                                                                                v ||
                                                                                                                    '',
                                                                                                            )
                                                                                                        }
                                                                                                        placeholder='Select product'
                                                                                                    />
                                                                                                </div>
                                                                                                <div className='px-2 py-2 border-r border-slate-200 min-w-0 overflow-hidden'>
                                                                                                    <AsyncChipSelect
                                                                                                        type='service'
                                                                                                        value={
                                                                                                            lic.service ||
                                                                                                            ''
                                                                                                        }
                                                                                                        onChange={(
                                                                                                            v,
                                                                                                        ) =>
                                                                                                            updateLicenseField(
                                                                                                                r.id,
                                                                                                                i,
                                                                                                                'service',
                                                                                                                v ||
                                                                                                                    '',
                                                                                                            )
                                                                                                        }
                                                                                                        placeholder='Select service'
                                                                                                    />
                                                                                                </div>
                                                                                                <div className='px-2 py-2 border-r border-slate-200'>
                                                                                                    <input
                                                                                                        type='date'
                                                                                                        value={
                                                                                                            lic.licenseStart ||
                                                                                                            ''
                                                                                                        }
                                                                                                        onChange={(
                                                                                                            e,
                                                                                                        ) =>
                                                                                                            updateLicenseField(
                                                                                                                r.id,
                                                                                                                i,
                                                                                                                'licenseStart',
                                                                                                                e
                                                                                                                    .target
                                                                                                                    .value,
                                                                                                            )
                                                                                                        }
                                                                                                        className='w-full bg-white/80 focus:bg-white focus:outline-none'
                                                                                                    />
                                                                                                </div>
                                                                                                <div className='px-2 py-2 border-r border-slate-200'>
                                                                                                    <input
                                                                                                        type='date'
                                                                                                        value={
                                                                                                            lic.licenseEnd ||
                                                                                                            ''
                                                                                                        }
                                                                                                        onChange={(
                                                                                                            e,
                                                                                                        ) =>
                                                                                                            updateLicenseField(
                                                                                                                r.id,
                                                                                                                i,
                                                                                                                'licenseEnd',
                                                                                                                e
                                                                                                                    .target
                                                                                                                    .value,
                                                                                                            )
                                                                                                        }
                                                                                                        className='w-full bg-white/80 focus:bg-white focus:outline-none'
                                                                                                    />
                                                                                                </div>
                                                                                                <div className='px-2 py-2 border-r border-slate-200'>
                                                                                                    <InlineEditableText
                                                                                                        value={
                                                                                                            typeof lic.users ===
                                                                                                            'number'
                                                                                                                ? String(
                                                                                                                      lic.users,
                                                                                                                  )
                                                                                                                : ''
                                                                                                        }
                                                                                                        onCommit={(
                                                                                                            v,
                                                                                                        ) =>
                                                                                                            updateLicenseField(
                                                                                                                r.id,
                                                                                                                i,
                                                                                                                'users',
                                                                                                                parseInt(
                                                                                                                    v ||
                                                                                                                        '0',
                                                                                                                    10,
                                                                                                                ),
                                                                                                            )
                                                                                                        }
                                                                                                        placeholder='Users'
                                                                                                        className='w-full'
                                                                                                    />
                                                                                                </div>
                                                                                                <div className='px-2 py-2 border-r border-slate-200'>
                                                                                                    <label className='inline-flex items-center gap-1 text-[12px] text-slate-700'>
                                                                                                        <input
                                                                                                            type='checkbox'
                                                                                                            defaultChecked={
                                                                                                                !!lic.renewalNotice
                                                                                                            }
                                                                                                            onChange={(
                                                                                                                e,
                                                                                                            ) =>
                                                                                                                updateLicenseField(
                                                                                                                    r.id,
                                                                                                                    i,
                                                                                                                    'renewalNotice',
                                                                                                                    e
                                                                                                                        .target
                                                                                                                        .checked,
                                                                                                                )
                                                                                                            }
                                                                                                        />
                                                                                                        <span>
                                                                                                            Notify
                                                                                                        </span>
                                                                                                    </label>
                                                                                                </div>
                                                                                                <div className='px-2 py-2 border-r border-slate-200'>
                                                                                                    <button
                                                                                                        className={`inline-flex items-center justify-center w-7 h-7 rounded-full border hover:bg-slate-50 ${
                                                                                                            (
                                                                                                                lic.contacts ||
                                                                                                                []
                                                                                                            )
                                                                                                                .length >
                                                                                                            0
                                                                                                                ? 'border-emerald-400 text-emerald-600'
                                                                                                                : 'border-slate-300'
                                                                                                        }`}
                                                                                                        title='Contact details'
                                                                                                        onClick={() => {
                                                                                                            if (
                                                                                                                typeof document !==
                                                                                                                'undefined'
                                                                                                            ) {
                                                                                                                document.dispatchEvent(
                                                                                                                    new CustomEvent(
                                                                                                                        'contact-modal-open',
                                                                                                                        {
                                                                                                                            detail: {
                                                                                                                                rowId: r.id,
                                                                                                                                licIndex:
                                                                                                                                    i,
                                                                                                                            },
                                                                                                                        },
                                                                                                                    ),
                                                                                                                );
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
                                                                                                                d='M12 12c2.761 0 5-2.239 5-5S14.761 2 12 2 7 4.239 7 7s2.239 5 5 5Zm0 2c-3.33 0-10 1.667-10 5v2h20v-2c0-3.333-6.67-5-10-5Z'
                                                                                                                stroke='currentColor'
                                                                                                                strokeWidth='1.5'
                                                                                                                strokeLinecap='round'
                                                                                                                strokeLinejoin='round'
                                                                                                            />
                                                                                                        </svg>
                                                                                                    </button>
                                                                                                </div>
                                                                                                <div className='px-2 py-2'>
                                                                                                    <InlineEditableText
                                                                                                        value={
                                                                                                            lic.noticeDays
                                                                                                                ? String(
                                                                                                                      lic.noticeDays,
                                                                                                                  )
                                                                                                                : ''
                                                                                                        }
                                                                                                        onCommit={(
                                                                                                            v,
                                                                                                        ) =>
                                                                                                            updateLicenseField(
                                                                                                                r.id,
                                                                                                                i,
                                                                                                                'noticeDays',
                                                                                                                parseInt(
                                                                                                                    v ||
                                                                                                                        '0',
                                                                                                                    10,
                                                                                                                ),
                                                                                                            )
                                                                                                        }
                                                                                                        placeholder='Notice Period (Days)'
                                                                                                        className='w-full'
                                                                                                    />
                                                                                                </div>
                                                                                                {/* Per-license Contacts toggle and panel */}
                                                                                                <div className='col-span-full border-t px-2 py-1'>
                                                                                                    {/* Contact details chevron and panel removed */}
                                                                                                    {false && (
                                                                                                        <div className='mt-2 border rounded-md overflow-hidden'>
                                                                                                            <div
                                                                                                                className='grid text-[10px] bg-slate-50 text-slate-700 px-2 py-1 divide-x divide-slate-200'
                                                                                                                style={{
                                                                                                                    gridTemplateColumns:
                                                                                                                        'repeat(4,minmax(140px,1fr))',
                                                                                                                }}
                                                                                                            >
                                                                                                                <div>
                                                                                                                    Contact
                                                                                                                </div>
                                                                                                                <div>
                                                                                                                    Title
                                                                                                                </div>
                                                                                                                <div>
                                                                                                                    Email
                                                                                                                </div>
                                                                                                                <div>
                                                                                                                    Phone
                                                                                                                </div>
                                                                                                            </div>
                                                                                                            <div className='divide-y border-t border-slate-200'>
                                                                                                                {(
                                                                                                                    lic.contacts ||
                                                                                                                    []
                                                                                                                ).map(
                                                                                                                    (
                                                                                                                        c,
                                                                                                                        ci,
                                                                                                                    ) => (
                                                                                                                        <div
                                                                                                                            key={
                                                                                                                                ci
                                                                                                                            }
                                                                                                                            className='grid text-[12px] text-slate-800 px-0 py-0'
                                                                                                                            style={{
                                                                                                                                gridTemplateColumns:
                                                                                                                                    'repeat(4,minmax(140px,1fr))',
                                                                                                                            }}
                                                                                                                        >
                                                                                                                            <div className='px-2 py-2 border-r border-slate-200'>
                                                                                                                                <InlineEditableText
                                                                                                                                    value={
                                                                                                                                        c.contact ||
                                                                                                                                        ''
                                                                                                                                    }
                                                                                                                                    onCommit={(
                                                                                                                                        v,
                                                                                                                                    ) =>
                                                                                                                                        updateLicenseContactField(
                                                                                                                                            r.id,
                                                                                                                                            i,
                                                                                                                                            ci,
                                                                                                                                            'contact',
                                                                                                                                            v,
                                                                                                                                        )
                                                                                                                                    }
                                                                                                                                    placeholder='Contact name'
                                                                                                                                />
                                                                                                                            </div>
                                                                                                                            <div className='px-2 py-2 border-r border-slate-200'>
                                                                                                                                <InlineEditableText
                                                                                                                                    value={
                                                                                                                                        c.title ||
                                                                                                                                        ''
                                                                                                                                    }
                                                                                                                                    onCommit={(
                                                                                                                                        v,
                                                                                                                                    ) =>
                                                                                                                                        updateLicenseContactField(
                                                                                                                                            r.id,
                                                                                                                                            i,
                                                                                                                                            ci,
                                                                                                                                            'title',
                                                                                                                                            v,
                                                                                                                                        )
                                                                                                                                    }
                                                                                                                                    placeholder='Title'
                                                                                                                                />
                                                                                                                            </div>
                                                                                                                            <div className='px-2 py-2 border-r border-slate-200'>
                                                                                                                                <InlineEditableText
                                                                                                                                    value={
                                                                                                                                        c.email ||
                                                                                                                                        ''
                                                                                                                                    }
                                                                                                                                    onCommit={(
                                                                                                                                        v,
                                                                                                                                    ) =>
                                                                                                                                        updateLicenseContactField(
                                                                                                                                            r.id,
                                                                                                                                            i,
                                                                                                                                            ci,
                                                                                                                                            'email',
                                                                                                                                            v,
                                                                                                                                        )
                                                                                                                                    }
                                                                                                                                    placeholder='email@company.com'
                                                                                                                                />
                                                                                                                            </div>
                                                                                                                            <div className='px-2 py-2'>
                                                                                                                                <InlineEditableText
                                                                                                                                    value={
                                                                                                                                        c.phone ||
                                                                                                                                        ''
                                                                                                                                    }
                                                                                                                                    onCommit={(
                                                                                                                                        v,
                                                                                                                                    ) =>
                                                                                                                                        updateLicenseContactField(
                                                                                                                                            r.id,
                                                                                                                                            i,
                                                                                                                                            ci,
                                                                                                                                            'phone',
                                                                                                                                            v,
                                                                                                                                        )
                                                                                                                                    }
                                                                                                                                    placeholder='Phone number'
                                                                                                                                />
                                                                                                                            </div>
                                                                                                                        </div>
                                                                                                                    ),
                                                                                                                )}
                                                                                                                <div className='px-2 py-2'>
                                                                                                                    <button
                                                                                                                        className='inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded-md border border-slate-300 bg-white hover:bg-slate-50'
                                                                                                                        onClick={() =>
                                                                                                                            addLicenseContactRow(
                                                                                                                                r.id,
                                                                                                                                i,
                                                                                                                            )
                                                                                                                        }
                                                                                                                    >
                                                                                                                        +
                                                                                                                        Add
                                                                                                                        contact
                                                                                                                    </button>
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    )}
                                                                                                </div>
                                                                                            </div>
                                                                                        ),
                                                                                    )}
                                                                                </>
                                                                            );
                                                                        })()}
                                                                        <div className='px-2 py-2'>
                                                                            <button
                                                                                className='inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded-md border border-slate-300 bg-white hover:bg-slate-50'
                                                                                onClick={() => {
                                                                                    setLocalRows(
                                                                                        (
                                                                                            prev,
                                                                                        ) =>
                                                                                            prev.map(
                                                                                                (
                                                                                                    row,
                                                                                                ) => {
                                                                                                    if (
                                                                                                        row.id !==
                                                                                                        r.id
                                                                                                    )
                                                                                                        return row;
                                                                                                    const list =
                                                                                                        [
                                                                                                            ...(((
                                                                                                                row as any
                                                                                                            )
                                                                                                                .licenses as any[]) ||
                                                                                                                []),
                                                                                                        ];
                                                                                                    list.push(
                                                                                                        {
                                                                                                            enterprise:
                                                                                                                '',
                                                                                                            product:
                                                                                                                '',
                                                                                                            service:
                                                                                                                '',
                                                                                                            licenseStart:
                                                                                                                '',
                                                                                                            licenseEnd:
                                                                                                                '',
                                                                                                            users: 0,
                                                                                                            renewalNotice:
                                                                                                                false,
                                                                                                            noticeDays: 0,
                                                                                                        } as any,
                                                                                                    );
                                                                                                    return {
                                                                                                        ...(row as any),
                                                                                                        licenses:
                                                                                                            list,
                                                                                                    } as AccountRow;
                                                                                                },
                                                                                            ),
                                                                                    );
                                                                                }}
                                                                            >
                                                                                +
                                                                                Add
                                                                                license
                                                                                row
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className='border-t'>
                                                                        {/* Placeholder editable row index 0 */}
                                                                        <div
                                                                            className='grid text-[12px] text-slate-800 px-0 py-0'
                                                                            style={{
                                                                                gridTemplateColumns: `repeat(${
                                                                                    (
                                                                                        r.licenses ||
                                                                                        []
                                                                                    ).some(
                                                                                        (
                                                                                            l,
                                                                                        ) =>
                                                                                            !!l.renewalNotice,
                                                                                    )
                                                                                        ? 8
                                                                                        : 7
                                                                                },minmax(88px,1fr))`,
                                                                            }}
                                                                        >
                                                                            <div className='px-2 py-2 border-r border-slate-200'>
                                                                                <AsyncChipSelect
                                                                                    type='enterprise'
                                                                                    value={
                                                                                        ''
                                                                                    }
                                                                                    onChange={(
                                                                                        v,
                                                                                    ) =>
                                                                                        updateLicenseField(
                                                                                            r.id,
                                                                                            0,
                                                                                            'enterprise',
                                                                                            v ||
                                                                                                '',
                                                                                        )
                                                                                    }
                                                                                    placeholder='Select enterprise'
                                                                                />
                                                                            </div>
                                                                            <div className='px-2 py-2 border-r border-slate-200'>
                                                                                <AsyncChipSelect
                                                                                    type='product'
                                                                                    value={
                                                                                        ''
                                                                                    }
                                                                                    onChange={(
                                                                                        v,
                                                                                    ) =>
                                                                                        updateLicenseField(
                                                                                            r.id,
                                                                                            0,
                                                                                            'product',
                                                                                            v ||
                                                                                                '',
                                                                                        )
                                                                                    }
                                                                                    placeholder='Select product'
                                                                                />
                                                                            </div>
                                                                            <div className='px-2 py-2 border-r border-slate-200'>
                                                                                <AsyncChipSelect
                                                                                    type='service'
                                                                                    value={
                                                                                        ''
                                                                                    }
                                                                                    onChange={(
                                                                                        v,
                                                                                    ) =>
                                                                                        updateLicenseField(
                                                                                            r.id,
                                                                                            0,
                                                                                            'service',
                                                                                            v ||
                                                                                                '',
                                                                                        )
                                                                                    }
                                                                                    placeholder='Select service'
                                                                                />
                                                                            </div>
                                                                            <div className='px-2 py-2 border-r border-slate-200'>
                                                                                <input
                                                                                    type='date'
                                                                                    defaultValue=''
                                                                                    onChange={(
                                                                                        e,
                                                                                    ) =>
                                                                                        updateLicenseField(
                                                                                            r.id,
                                                                                            0,
                                                                                            'licenseStart',
                                                                                            e
                                                                                                .target
                                                                                                .value,
                                                                                        )
                                                                                    }
                                                                                    className='w-full bg-white/80 focus:bg-white focus:outline-none'
                                                                                />
                                                                            </div>
                                                                            <div className='px-2 py-2 border-r border-slate-200'>
                                                                                <input
                                                                                    type='date'
                                                                                    defaultValue=''
                                                                                    onChange={(
                                                                                        e,
                                                                                    ) =>
                                                                                        updateLicenseField(
                                                                                            r.id,
                                                                                            0,
                                                                                            'licenseEnd',
                                                                                            e
                                                                                                .target
                                                                                                .value,
                                                                                        )
                                                                                    }
                                                                                    className='w-full bg-white/80 focus:bg-white focus:outline-none'
                                                                                />
                                                                            </div>
                                                                            <div className='px-2 py-2 border-r border-slate-200'>
                                                                                <input
                                                                                    defaultValue=''
                                                                                    onBlur={(
                                                                                        e,
                                                                                    ) =>
                                                                                        updateLicenseField(
                                                                                            r.id,
                                                                                            0,
                                                                                            'users',
                                                                                            parseInt(
                                                                                                e
                                                                                                    .target
                                                                                                    .value ||
                                                                                                    '0',
                                                                                                10,
                                                                                            ),
                                                                                        )
                                                                                    }
                                                                                    placeholder='Users'
                                                                                    className='w-full'
                                                                                />
                                                                            </div>
                                                                            <div className='px-2 py-2 border-r border-slate-200'>
                                                                                <label className='inline-flex items-center gap-1 text-[12px] text-slate-700'>
                                                                                    <input
                                                                                        type='checkbox'
                                                                                        defaultChecked={
                                                                                            false
                                                                                        }
                                                                                        onChange={(
                                                                                            e,
                                                                                        ) =>
                                                                                            updateLicenseField(
                                                                                                r.id,
                                                                                                0,
                                                                                                'renewalNotice',
                                                                                                e
                                                                                                    .target
                                                                                                    .checked,
                                                                                            )
                                                                                        }
                                                                                    />
                                                                                    <span>
                                                                                        Notify
                                                                                    </span>
                                                                                </label>
                                                                            </div>
                                                                            {(
                                                                                r.licenses ||
                                                                                []
                                                                            ).some(
                                                                                (
                                                                                    l,
                                                                                ) =>
                                                                                    !!l.renewalNotice,
                                                                            ) && (
                                                                                <div className='px-2 py-2'>
                                                                                    <InlineEditableText
                                                                                        value={
                                                                                            ''
                                                                                        }
                                                                                        onCommit={(
                                                                                            v,
                                                                                        ) =>
                                                                                            updateLicenseField(
                                                                                                r.id,
                                                                                                0,
                                                                                                'noticeDays',
                                                                                                parseInt(
                                                                                                    v ||
                                                                                                        '0',
                                                                                                    10,
                                                                                                ),
                                                                                            )
                                                                                        }
                                                                                        placeholder='Days'
                                                                                        className='w-full'
                                                                                    />
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div className='px-2 py-2'>
                                                                            <button
                                                                                className='inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded-md border border-slate-300 bg-white hover:bg-slate-50'
                                                                                onClick={() => {
                                                                                    setLocalRows(
                                                                                        (
                                                                                            prev,
                                                                                        ) =>
                                                                                            prev.map(
                                                                                                (
                                                                                                    row,
                                                                                                ) => {
                                                                                                    if (
                                                                                                        row.id !==
                                                                                                        r.id
                                                                                                    )
                                                                                                        return row;
                                                                                                    const list =
                                                                                                        [
                                                                                                            ...(((
                                                                                                                row as any
                                                                                                            )
                                                                                                                .licenses as any[]) ||
                                                                                                                []),
                                                                                                        ];
                                                                                                    list.push(
                                                                                                        {
                                                                                                            enterprise:
                                                                                                                '',
                                                                                                            product:
                                                                                                                '',
                                                                                                            service:
                                                                                                                '',
                                                                                                            licenseStart:
                                                                                                                '',
                                                                                                            licenseEnd:
                                                                                                                '',
                                                                                                            users: 0,
                                                                                                            renewalNotice:
                                                                                                                false,
                                                                                                            noticeDays: 0,
                                                                                                        } as any,
                                                                                                    );
                                                                                                    return {
                                                                                                        ...(row as any),
                                                                                                        licenses:
                                                                                                            list,
                                                                                                    } as AccountRow;
                                                                                                },
                                                                                            ),
                                                                                    );
                                                                                }}
                                                                            >
                                                                                +
                                                                                Add
                                                                                license
                                                                                row
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        }
                                        onUpdateField={updateRowField}
                                        isSelected={selectedRowId === r.id}
                                        onSelect={(id) => setSelectedRowId(id)}
                                        onStartFill={() => {}}
                                        inFillRange={false}
                                    />
                                    {expandedRows.has(r.id) && (
                                        <div className='group relative bg-white border-t border-slate-200 px-2 py-3 pl-6'>
                                            <div className='absolute left-3 top-0 bottom-0 w-px bg-slate-500 transition-colors duration-300 group-hover:bg-sky-500'></div>
                                            {/* Technical User Subtable */}
                                            <div className='relative mb-4'>
                                                <div className='absolute -left-3 top-4 w-3 h-px bg-slate-500 transition-colors duration-300 group-hover:bg-sky-500'></div>
                                                <div className='absolute -left-3 top-3 h-2 w-2 rounded-full bg-white border border-slate-300'></div>
                                                <div className='text-[11px] font-semibold text-slate-800 mb-1'>
                                                    Technical User
                                                </div>
                                                <div className='border rounded-md overflow-hidden'>
                                                    <div
                                                        className='grid text-[10px] bg-slate-50 text-slate-700 px-2 py-1 divide-x divide-slate-200'
                                                        style={{
                                                            gridTemplateColumns:
                                                                'repeat(9,minmax(100px,1fr))',
                                                        }}
                                                    >
                                                        <div className='flex items-center gap-2'>
                                                            <User className='h-3 w-3 text-blue-600' />
                                                            <span>
                                                                First Name
                                                            </span>
                                                        </div>
                                                        <div className='flex items-center gap-2'>
                                                            <User className='h-3 w-3 text-blue-600' />
                                                            <span>
                                                                Middle Name
                                                            </span>
                                                        </div>
                                                        <div className='flex items-center gap-2'>
                                                            <User className='h-3 w-3 text-blue-600' />
                                                            <span>
                                                                Last Name
                                                            </span>
                                                        </div>
                                                        <div className='flex items-center gap-2'>
                                                            <Mail className='h-3 w-3 text-blue-600' />
                                                            <span>
                                                                Email Address
                                                            </span>
                                                        </div>
                                                        <div className='flex items-center gap-2'>
                                                            <Activity className='h-3 w-3 text-blue-600' />
                                                            <span>Status</span>
                                                        </div>
                                                        <div className='flex items-center gap-2'>
                                                            <Calendar className='h-3 w-3 text-blue-600' />
                                                            <span>
                                                                Start Date
                                                            </span>
                                                        </div>
                                                        <div className='flex items-center gap-2'>
                                                            <Calendar className='h-3 w-3 text-blue-600' />
                                                            <span>
                                                                End Date
                                                            </span>
                                                        </div>
                                                        <div className='flex items-center gap-2'>
                                                            <Key className='h-3 w-3 text-blue-600' />
                                                            <span>
                                                                Password
                                                            </span>
                                                        </div>
                                                        <div className='flex items-center gap-2'>
                                                            <Settings className='h-3 w-3 text-blue-600' />
                                                            <span>
                                                                Technical User
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div
                                                        className='grid text-[12px] text-slate-800 px-0 py-0 border-t border-slate-200'
                                                        style={{
                                                            gridTemplateColumns:
                                                                'repeat(9,minmax(100px,1fr))',
                                                        }}
                                                    >
                                                        <div
                                                            className='px-2 py-2 border-r border-slate-200'
                                                            data-tech-row={r.id}
                                                            data-tech-field='firstName'
                                                        >
                                                            <input
                                                                defaultValue={
                                                                    r.technical
                                                                        ?.firstName ||
                                                                    ''
                                                                }
                                                                onBlur={(e) =>
                                                                    updateRowNested(
                                                                        r.id,
                                                                        [
                                                                            'technical',
                                                                            'firstName',
                                                                        ],
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                onKeyDown={(
                                                                    e,
                                                                ) => {
                                                                    if (
                                                                        e.key ===
                                                                        'Tab'
                                                                    ) {
                                                                        e.preventDefault();
                                                                        const technicalFields =
                                                                            [
                                                                                'firstName',
                                                                                'middleName',
                                                                                'lastName',
                                                                                'email',
                                                                                'status',
                                                                                'startDate',
                                                                                'endDate',
                                                                                'password',
                                                                                'technicalUser',
                                                                            ];
                                                                        const currentIndex =
                                                                            technicalFields.indexOf(
                                                                                'firstName',
                                                                            );
                                                                        const nextIndex =
                                                                            e.shiftKey
                                                                                ? currentIndex -
                                                                                  1
                                                                                : currentIndex +
                                                                                  1;

                                                                        if (
                                                                            nextIndex >=
                                                                                0 &&
                                                                            nextIndex <
                                                                                technicalFields.length
                                                                        ) {
                                                                            const nextField =
                                                                                technicalFields[
                                                                                    nextIndex
                                                                                ];
                                                                            setTimeout(
                                                                                () => {
                                                                                    const nextInput =
                                                                                        document.querySelector(
                                                                                            `[data-tech-row="${r.id}"][data-tech-field="${nextField}"] input`,
                                                                                        ) as HTMLInputElement;
                                                                                    if (
                                                                                        nextInput
                                                                                    ) {
                                                                                        nextInput.focus();
                                                                                    }
                                                                                },
                                                                                10,
                                                                            );
                                                                        }
                                                                    }
                                                                }}
                                                                className='w-full bg-white/80 focus:bg-white focus:outline-none'
                                                                placeholder='First Name'
                                                            />
                                                        </div>
                                                        <div
                                                            className='px-2 py-2 border-r border-slate-200'
                                                            data-tech-row={r.id}
                                                            data-tech-field='middleName'
                                                        >
                                                            <input
                                                                defaultValue={
                                                                    r.technical
                                                                        ?.middleName ||
                                                                    ''
                                                                }
                                                                onBlur={(e) =>
                                                                    updateRowNested(
                                                                        r.id,
                                                                        [
                                                                            'technical',
                                                                            'middleName',
                                                                        ],
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                onKeyDown={(
                                                                    e,
                                                                ) => {
                                                                    if (
                                                                        e.key ===
                                                                        'Tab'
                                                                    ) {
                                                                        e.preventDefault();
                                                                        const technicalFields =
                                                                            [
                                                                                'firstName',
                                                                                'middleName',
                                                                                'lastName',
                                                                                'email',
                                                                                'status',
                                                                                'startDate',
                                                                                'endDate',
                                                                                'password',
                                                                                'technicalUser',
                                                                            ];
                                                                        const currentIndex =
                                                                            technicalFields.indexOf(
                                                                                'middleName',
                                                                            );
                                                                        const nextIndex =
                                                                            e.shiftKey
                                                                                ? currentIndex -
                                                                                  1
                                                                                : currentIndex +
                                                                                  1;

                                                                        if (
                                                                            nextIndex >=
                                                                                0 &&
                                                                            nextIndex <
                                                                                technicalFields.length
                                                                        ) {
                                                                            const nextField =
                                                                                technicalFields[
                                                                                    nextIndex
                                                                                ];
                                                                            setTimeout(
                                                                                () => {
                                                                                    const nextInput =
                                                                                        document.querySelector(
                                                                                            `[data-tech-row="${r.id}"][data-tech-field="${nextField}"] input`,
                                                                                        ) as HTMLInputElement;
                                                                                    if (
                                                                                        nextInput
                                                                                    ) {
                                                                                        nextInput.focus();
                                                                                    }
                                                                                },
                                                                                10,
                                                                            );
                                                                        }
                                                                    }
                                                                }}
                                                                className='w-full bg-white/80 focus:bg-white focus:outline-none'
                                                                placeholder='Middle Name'
                                                            />
                                                        </div>
                                                        <div className='px-2 py-2 border-r border-slate-200'>
                                                            <input
                                                                defaultValue={
                                                                    r.technical
                                                                        ?.lastName ||
                                                                    ''
                                                                }
                                                                onBlur={(e) =>
                                                                    updateRowNested(
                                                                        r.id,
                                                                        [
                                                                            'technical',
                                                                            'lastName',
                                                                        ],
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                className='w-full bg-white/80 focus:bg-white focus:outline-none'
                                                                placeholder='Last Name'
                                                            />
                                                        </div>
                                                        <div className='px-2 py-2 border-r border-slate-200'>
                                                            <input
                                                                defaultValue={
                                                                    r.technical
                                                                        ?.email ||
                                                                    ''
                                                                }
                                                                onBlur={(e) =>
                                                                    updateRowNested(
                                                                        r.id,
                                                                        [
                                                                            'technical',
                                                                            'email',
                                                                        ],
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                className='w-full bg-white/80 focus:bg-white focus:outline-none'
                                                                placeholder='Email Address'
                                                            />
                                                        </div>
                                                        <div className='px-2 py-2 border-r border-slate-200'>
                                                            <input
                                                                defaultValue={
                                                                    r.technical
                                                                        ?.status ||
                                                                    ''
                                                                }
                                                                onBlur={(e) =>
                                                                    updateRowNested(
                                                                        r.id,
                                                                        [
                                                                            'technical',
                                                                            'status',
                                                                        ],
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                className='w-full bg-white/80 focus:bg-white focus:outline-none'
                                                                placeholder='Status'
                                                            />
                                                        </div>
                                                        <div className='px-2 py-2 border-r border-slate-200'>
                                                            <input
                                                                type='date'
                                                                defaultValue={
                                                                    r.technical
                                                                        ?.startDate ||
                                                                    ''
                                                                }
                                                                onBlur={(e) =>
                                                                    updateRowNested(
                                                                        r.id,
                                                                        [
                                                                            'technical',
                                                                            'startDate',
                                                                        ],
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                className='w-full bg-white/80 focus:bg-white focus:outline-none'
                                                            />
                                                        </div>
                                                        <div className='px-2 py-2 border-r border-slate-200'>
                                                            <input
                                                                type='date'
                                                                defaultValue={
                                                                    r.technical
                                                                        ?.endDate ||
                                                                    ''
                                                                }
                                                                onBlur={(e) =>
                                                                    updateRowNested(
                                                                        r.id,
                                                                        [
                                                                            'technical',
                                                                            'endDate',
                                                                        ],
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                className='w-full bg-white/80 focus:bg-white focus:outline-none'
                                                            />
                                                        </div>
                                                        <div className='px-2 py-2 border-r border-slate-200'>
                                                            <input
                                                                type='password'
                                                                defaultValue={
                                                                    r.technical
                                                                        ?.password ||
                                                                    ''
                                                                }
                                                                onBlur={(e) =>
                                                                    updateRowNested(
                                                                        r.id,
                                                                        [
                                                                            'technical',
                                                                            'password',
                                                                        ],
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                className='w-full bg-white/80 focus:bg-white focus:outline-none'
                                                                placeholder='Password'
                                                            />
                                                        </div>
                                                        <div className='px-2 py-2'>
                                                            <input
                                                                defaultValue={
                                                                    r.technical
                                                                        ?.technicalUser ||
                                                                    ''
                                                                }
                                                                onBlur={(e) =>
                                                                    updateRowNested(
                                                                        r.id,
                                                                        [
                                                                            'technical',
                                                                            'technicalUser',
                                                                        ],
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                className='w-full bg-white/80 focus:bg-white focus:outline-none'
                                                                placeholder='Technical User'
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* License Details Subtable */}
                                            <div className='relative'>
                                                <div className='absolute -left-3 top-4 w-3 h-px bg-slate-400'></div>
                                                <div className='absolute -left-3 top-3 h-2 w-2 rounded-full bg-white border border-slate-300'></div>
                                                <div className='text-[11px] font-semibold text-slate-800 mb-1'>
                                                    License Details
                                                </div>
                                                <div className='border rounded-md overflow-hidden bg-gradient-to-b from-white to-slate-50'>
                                                    {(() => {
                                                        const hasRenewal = (
                                                            r.licenses || []
                                                        ).some(
                                                            (l) =>
                                                                !!l.renewalNotice,
                                                        );
                                                        return (
                                                            <div
                                                                className='grid text-[10px] bg-slate-100/90 text-slate-800 px-2 py-1 divide-x divide-slate-200'
                                                                style={{
                                                                    gridTemplateColumns:
                                                                        'repeat(8,minmax(100px,1fr))',
                                                                }}
                                                            >
                                                                <div className='flex items-center gap-2'>
                                                                    <Package className='h-3 w-3 text-blue-600' />
                                                                    <span>
                                                                        Product
                                                                    </span>
                                                                </div>
                                                                <div className='flex items-center gap-2'>
                                                                    <Cpu className='h-3 w-3 text-blue-600' />
                                                                    <span>
                                                                        Service
                                                                    </span>
                                                                </div>
                                                                <div className='flex items-center gap-2'>
                                                                    <Calendar className='h-3 w-3 text-blue-600' />
                                                                    <span>
                                                                        License
                                                                        Start
                                                                        Date
                                                                    </span>
                                                                </div>
                                                                <div className='flex items-center gap-2'>
                                                                    <Calendar className='h-3 w-3 text-blue-600' />
                                                                    <span>
                                                                        License
                                                                        End Date
                                                                    </span>
                                                                </div>
                                                                <div className='flex items-center gap-2'>
                                                                    <Users className='h-3 w-3 text-blue-600' />
                                                                    <span>
                                                                        Number
                                                                        of Users
                                                                    </span>
                                                                </div>
                                                                <div className='flex items-center gap-2'>
                                                                    <Bell className='h-3 w-3 text-blue-600' />
                                                                    <span>
                                                                        Renewal
                                                                        Notice
                                                                    </span>
                                                                </div>
                                                                <div className='flex items-center gap-2'>
                                                                    <Phone className='h-3 w-3 text-blue-600' />
                                                                    <span>
                                                                        Contact
                                                                        Details
                                                                    </span>
                                                                </div>
                                                                <div className='flex items-center gap-2'>
                                                                    <Clock className='h-3 w-3 text-blue-600' />
                                                                    <span>
                                                                        Notice
                                                                        Period
                                                                        (Days)
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                    {(r.licenses || []).length >
                                                    0 ? (
                                                        <div className='divide-y divide-slate-200'>
                                                            {(() => {
                                                                const hasRenewal =
                                                                    (
                                                                        r.licenses ||
                                                                        []
                                                                    ).some(
                                                                        (l) =>
                                                                            !!l.renewalNotice,
                                                                    );
                                                                return (
                                                                    <>
                                                                        {(
                                                                            r.licenses ||
                                                                            []
                                                                        ).map(
                                                                            (
                                                                                lic,
                                                                                i,
                                                                            ) => (
                                                                                <div
                                                                                    key={
                                                                                        i
                                                                                    }
                                                                                    className={`grid text-[12px] text-slate-800 px-0 py-0 border-t border-slate-200 ${
                                                                                        i %
                                                                                            2 ===
                                                                                        0
                                                                                            ? 'bg-white'
                                                                                            : 'bg-slate-50/60'
                                                                                    }`}
                                                                                    style={{
                                                                                        gridTemplateColumns: `repeat(${
                                                                                            hasRenewal
                                                                                                ? 8
                                                                                                : 7
                                                                                        },minmax(88px,1fr))`,
                                                                                    }}
                                                                                >
                                                                                    <div className='px-2 py-2 border-r border-slate-200'>
                                                                                        <AsyncChipSelect
                                                                                            type='enterprise'
                                                                                            value={
                                                                                                lic.enterprise ||
                                                                                                ''
                                                                                            }
                                                                                            onChange={(
                                                                                                v,
                                                                                            ) =>
                                                                                                updateLicenseField(
                                                                                                    r.id,
                                                                                                    i,
                                                                                                    'enterprise',
                                                                                                    v ||
                                                                                                        '',
                                                                                                )
                                                                                            }
                                                                                            placeholder='Select enterprise'
                                                                                        />
                                                                                    </div>
                                                                                    <div className='px-2 py-2 border-r border-slate-200'>
                                                                                        <AsyncChipSelect
                                                                                            type='product'
                                                                                            value={
                                                                                                lic.product ||
                                                                                                ''
                                                                                            }
                                                                                            onChange={(
                                                                                                v,
                                                                                            ) =>
                                                                                                updateLicenseField(
                                                                                                    r.id,
                                                                                                    i,
                                                                                                    'product',
                                                                                                    v ||
                                                                                                        '',
                                                                                                )
                                                                                            }
                                                                                            placeholder='Select product'
                                                                                        />
                                                                                    </div>
                                                                                    <div className='px-2 py-2 border-r border-slate-200'>
                                                                                        <AsyncChipSelect
                                                                                            type='service'
                                                                                            value={
                                                                                                lic.service ||
                                                                                                ''
                                                                                            }
                                                                                            onChange={(
                                                                                                v,
                                                                                            ) =>
                                                                                                updateLicenseField(
                                                                                                    r.id,
                                                                                                    i,
                                                                                                    'service',
                                                                                                    v ||
                                                                                                        '',
                                                                                                )
                                                                                            }
                                                                                            placeholder='Select service'
                                                                                        />
                                                                                    </div>
                                                                                    <div className='px-2 py-2 border-r border-slate-200'>
                                                                                        <input
                                                                                            type='date'
                                                                                            value={
                                                                                                lic.licenseStart ||
                                                                                                ''
                                                                                            }
                                                                                            onChange={(
                                                                                                e,
                                                                                            ) =>
                                                                                                updateLicenseField(
                                                                                                    r.id,
                                                                                                    i,
                                                                                                    'licenseStart',
                                                                                                    e
                                                                                                        .target
                                                                                                        .value,
                                                                                                )
                                                                                            }
                                                                                            className='w-full bg-white/80 focus:bg-white focus:outline-none'
                                                                                        />
                                                                                    </div>
                                                                                    <div className='px-2 py-2 border-r border-slate-200'>
                                                                                        <input
                                                                                            type='date'
                                                                                            value={
                                                                                                lic.licenseEnd ||
                                                                                                ''
                                                                                            }
                                                                                            onChange={(
                                                                                                e,
                                                                                            ) =>
                                                                                                updateLicenseField(
                                                                                                    r.id,
                                                                                                    i,
                                                                                                    'licenseEnd',
                                                                                                    e
                                                                                                        .target
                                                                                                        .value,
                                                                                                )
                                                                                            }
                                                                                            className='w-full bg-white/80 focus:bg-white focus:outline-none'
                                                                                        />
                                                                                    </div>
                                                                                    <div className='px-2 py-2 border-r border-slate-200'>
                                                                                        <InlineEditableText
                                                                                            value={
                                                                                                typeof lic.users ===
                                                                                                'number'
                                                                                                    ? String(
                                                                                                          lic.users,
                                                                                                      )
                                                                                                    : ''
                                                                                            }
                                                                                            onCommit={(
                                                                                                v,
                                                                                            ) =>
                                                                                                updateLicenseField(
                                                                                                    r.id,
                                                                                                    i,
                                                                                                    'users',
                                                                                                    parseInt(
                                                                                                        v ||
                                                                                                            '0',
                                                                                                        10,
                                                                                                    ),
                                                                                                )
                                                                                            }
                                                                                            placeholder='Users'
                                                                                            className='w-full'
                                                                                        />
                                                                                    </div>
                                                                                    <div className='px-2 py-2 border-r border-slate-200'>
                                                                                        <label className='inline-flex items-center gap-1 text-[12px] text-slate-700'>
                                                                                            <input
                                                                                                type='checkbox'
                                                                                                defaultChecked={
                                                                                                    !!lic.renewalNotice
                                                                                                }
                                                                                                onChange={(
                                                                                                    e,
                                                                                                ) =>
                                                                                                    updateLicenseField(
                                                                                                        r.id,
                                                                                                        i,
                                                                                                        'renewalNotice',
                                                                                                        e
                                                                                                            .target
                                                                                                            .checked,
                                                                                                    )
                                                                                                }
                                                                                            />
                                                                                            <span>
                                                                                                Notify
                                                                                            </span>
                                                                                        </label>
                                                                                    </div>
                                                                                    {hasRenewal && (
                                                                                        <div className='px-2 py-2'>
                                                                                            {lic.renewalNotice ? (
                                                                                                <InlineEditableText
                                                                                                    value={
                                                                                                        lic.noticeDays
                                                                                                            ? String(
                                                                                                                  lic.noticeDays,
                                                                                                              )
                                                                                                            : ''
                                                                                                    }
                                                                                                    onCommit={(
                                                                                                        v,
                                                                                                    ) =>
                                                                                                        updateLicenseField(
                                                                                                            r.id,
                                                                                                            i,
                                                                                                            'noticeDays',
                                                                                                            parseInt(
                                                                                                                v ||
                                                                                                                    '0',
                                                                                                                10,
                                                                                                            ),
                                                                                                        )
                                                                                                    }
                                                                                                    placeholder='Days'
                                                                                                    className='w-full'
                                                                                                />
                                                                                            ) : (
                                                                                                <span className='text-slate-300'>
                                                                                                    —
                                                                                                </span>
                                                                                            )}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            ),
                                                                        )}
                                                                    </>
                                                                );
                                                            })()}
                                                            <div className='px-2 py-2'>
                                                                <button
                                                                    className='inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded-md border border-slate-300 bg-white hover:bg-slate-50'
                                                                    onClick={() => {
                                                                        setLocalRows(
                                                                            (
                                                                                prev,
                                                                            ) =>
                                                                                prev.map(
                                                                                    (
                                                                                        row,
                                                                                    ) => {
                                                                                        if (
                                                                                            row.id !==
                                                                                            r.id
                                                                                        )
                                                                                            return row;
                                                                                        const list =
                                                                                            [
                                                                                                ...(((
                                                                                                    row as any
                                                                                                )
                                                                                                    .licenses as any[]) ||
                                                                                                    []),
                                                                                            ];
                                                                                        list.push(
                                                                                            {
                                                                                                enterprise:
                                                                                                    '',
                                                                                                product:
                                                                                                    '',
                                                                                                service:
                                                                                                    '',
                                                                                                licenseStart:
                                                                                                    '',
                                                                                                licenseEnd:
                                                                                                    '',
                                                                                                users: 0,
                                                                                                renewalNotice:
                                                                                                    false,
                                                                                                noticeDays: 0,
                                                                                            } as any,
                                                                                        );
                                                                                        return {
                                                                                            ...(row as any),
                                                                                            licenses:
                                                                                                list,
                                                                                        } as AccountRow;
                                                                                    },
                                                                                ),
                                                                        );
                                                                    }}
                                                                >
                                                                    + Add
                                                                    license row
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className='border-t'>
                                                            {/* Placeholder editable row index 0 */}
                                                            <div
                                                                className='grid text-[12px] text-slate-800 px-0 py-0'
                                                                style={{
                                                                    gridTemplateColumns: `repeat(${
                                                                        (
                                                                            r.licenses ||
                                                                            []
                                                                        ).some(
                                                                            (
                                                                                l,
                                                                            ) =>
                                                                                !!l.renewalNotice,
                                                                        )
                                                                            ? 8
                                                                            : 7
                                                                    },minmax(88px,1fr))`,
                                                                }}
                                                            >
                                                                <div className='px-2 py-2 border-r border-slate-200'>
                                                                    <AsyncChipSelect
                                                                        type='enterprise'
                                                                        value={
                                                                            ''
                                                                        }
                                                                        onChange={(
                                                                            v,
                                                                        ) =>
                                                                            updateLicenseField(
                                                                                r.id,
                                                                                0,
                                                                                'enterprise',
                                                                                v ||
                                                                                    '',
                                                                            )
                                                                        }
                                                                        placeholder='Select enterprise'
                                                                    />
                                                                </div>
                                                                <div className='px-2 py-2 border-r border-slate-200'>
                                                                    <AsyncChipSelect
                                                                        type='product'
                                                                        value={
                                                                            ''
                                                                        }
                                                                        onChange={(
                                                                            v,
                                                                        ) =>
                                                                            updateLicenseField(
                                                                                r.id,
                                                                                0,
                                                                                'product',
                                                                                v ||
                                                                                    '',
                                                                            )
                                                                        }
                                                                        placeholder='Select product'
                                                                    />
                                                                </div>
                                                                <div className='px-2 py-2 border-r border-slate-200'>
                                                                    <AsyncChipSelect
                                                                        type='service'
                                                                        value={
                                                                            ''
                                                                        }
                                                                        onChange={(
                                                                            v,
                                                                        ) =>
                                                                            updateLicenseField(
                                                                                r.id,
                                                                                0,
                                                                                'service',
                                                                                v ||
                                                                                    '',
                                                                            )
                                                                        }
                                                                        placeholder='Select service'
                                                                    />
                                                                </div>
                                                                <div className='px-2 py-2 border-r border-slate-200'>
                                                                    <input
                                                                        type='date'
                                                                        defaultValue=''
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            updateLicenseField(
                                                                                r.id,
                                                                                0,
                                                                                'licenseStart',
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                        className='w-full bg-white/80 focus:bg-white focus:outline-none'
                                                                    />
                                                                </div>
                                                                <div className='px-2 py-2 border-r border-slate-200'>
                                                                    <input
                                                                        type='date'
                                                                        defaultValue=''
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            updateLicenseField(
                                                                                r.id,
                                                                                0,
                                                                                'licenseEnd',
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                        className='w-full bg-white/80 focus:bg-white focus:outline-none'
                                                                    />
                                                                </div>
                                                                <div className='px-2 py-2 border-r border-slate-200'>
                                                                    <input
                                                                        defaultValue=''
                                                                        onBlur={(
                                                                            e,
                                                                        ) =>
                                                                            updateLicenseField(
                                                                                r.id,
                                                                                0,
                                                                                'users',
                                                                                parseInt(
                                                                                    e
                                                                                        .target
                                                                                        .value ||
                                                                                        '0',
                                                                                    10,
                                                                                ),
                                                                            )
                                                                        }
                                                                        placeholder='Users'
                                                                        className='w-full'
                                                                    />
                                                                </div>
                                                                <div className='px-2 py-2 border-r border-slate-200'>
                                                                    <label className='inline-flex items-center gap-1 text-[12px] text-slate-700'>
                                                                        <input
                                                                            type='checkbox'
                                                                            defaultChecked={
                                                                                false
                                                                            }
                                                                            onChange={(
                                                                                e,
                                                                            ) =>
                                                                                updateLicenseField(
                                                                                    r.id,
                                                                                    0,
                                                                                    'renewalNotice',
                                                                                    e
                                                                                        .target
                                                                                        .checked,
                                                                                )
                                                                            }
                                                                        />
                                                                        <span>
                                                                            Notify
                                                                        </span>
                                                                    </label>
                                                                </div>
                                                                {(
                                                                    r.licenses ||
                                                                    []
                                                                ).some(
                                                                    (l) =>
                                                                        !!l.renewalNotice,
                                                                ) && (
                                                                    <div className='px-2 py-2'>
                                                                        <InlineEditableText
                                                                            value={
                                                                                ''
                                                                            }
                                                                            onCommit={(
                                                                                v,
                                                                            ) =>
                                                                                updateLicenseField(
                                                                                    r.id,
                                                                                    0,
                                                                                    'noticeDays',
                                                                                    parseInt(
                                                                                        v ||
                                                                                            '0',
                                                                                        10,
                                                                                    ),
                                                                                )
                                                                            }
                                                                            placeholder='Days'
                                                                            className='w-full'
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className='px-2 py-2'>
                                                                <button
                                                                    className='inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded-md border border-slate-300 bg-white hover:bg-slate-50'
                                                                    onClick={() => {
                                                                        setLocalRows(
                                                                            (
                                                                                prev,
                                                                            ) =>
                                                                                prev.map(
                                                                                    (
                                                                                        row,
                                                                                    ) => {
                                                                                        if (
                                                                                            row.id !==
                                                                                            r.id
                                                                                        )
                                                                                            return row;
                                                                                        const list =
                                                                                            [
                                                                                                ...(((
                                                                                                    row as any
                                                                                                )
                                                                                                    .licenses as any[]) ||
                                                                                                    []),
                                                                                            ];
                                                                                        list.push(
                                                                                            {
                                                                                                enterprise:
                                                                                                    '',
                                                                                                product:
                                                                                                    '',
                                                                                                service:
                                                                                                    '',
                                                                                                licenseStart:
                                                                                                    '',
                                                                                                licenseEnd:
                                                                                                    '',
                                                                                                users: 0,
                                                                                                renewalNotice:
                                                                                                    false,
                                                                                                noticeDays: 0,
                                                                                            } as any,
                                                                                        );
                                                                                        return {
                                                                                            ...(row as any),
                                                                                            licenses:
                                                                                                list,
                                                                                        } as AccountRow;
                                                                                    },
                                                                                ),
                                                                        );
                                                                    }}
                                                                >
                                                                    + Add
                                                                    license row
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {idx === displayItems.length - 1 &&
                                        onQuickAddRow && (
                                            <div className='w-full'>
                                                <motion.div
                                                    key={'quick-add-row'}
                                                    initial={{opacity: 0}}
                                                    animate={{opacity: 1}}
                                                    whileHover={
                                                        hasBlankRow
                                                            ? {}
                                                            : {scale: 1.002}
                                                    }
                                                    className={`w-full grid items-center gap-0 rounded-md border border-dashed ${
                                                        hasBlankRow
                                                            ? 'border-orange-300 bg-orange-50/40 cursor-not-allowed'
                                                            : 'border-slate-300 bg-slate-50/40 hover:bg-slate-100/70 cursor-pointer'
                                                    }`}
                                                    style={{
                                                        gridTemplateColumns:
                                                            gridTemplate
                                                                .split('_')
                                                                .join(' '),
                                                    }}
                                                    onClick={
                                                        hasBlankRow
                                                            ? undefined
                                                            : onQuickAddRow
                                                    }
                                                    title={
                                                        hasBlankRow
                                                            ? 'Complete the existing blank row first'
                                                            : 'Add new row'
                                                    }
                                                >
                                                    <div
                                                        className={`col-span-full flex items-center gap-2 px-3 py-2 text-[12px] border-t border-dashed ${
                                                            hasBlankRow
                                                                ? 'text-orange-600 border-orange-300'
                                                                : 'text-slate-500 border-slate-300'
                                                        }`}
                                                    >
                                                        <Plus className='w-3.5 h-3.5' />
                                                        <span>
                                                            {hasBlankRow
                                                                ? 'Complete the existing blank row first'
                                                                : 'Add new row'}
                                                        </span>
                                                    </div>
                                                </motion.div>
                                            </div>
                                        )}
                                </React.Fragment>
                            ))}
                        </div>
                    ) : (
                        <div className='space-y-2 w-max'>
                            {Object.entries(
                                orderedItems.reduce(
                                    (acc: Record<string, AccountRow[]>, it) => {
                                        const key = String(
                                            (it as any)[groupBy] ||
                                                'Unassigned',
                                        );
                                        acc[key] = acc[key] || [];
                                        acc[key].push(it);
                                        return acc;
                                    },
                                    {},
                                ),
                            ).map(([grp, list]) => (
                                <div
                                    key={grp}
                                    className='rounded-lg border border-slate-100'
                                >
                                    <div className='px-2 py-1.5 text-[11px] font-medium text-blue-600 bg-slate-50 border-b'>
                                        {grp} • {list.length}
                                    </div>
                                    <div className='space-y-0 divide-y divide-slate-200'>
                                        {list.map((r, idx) => (
                                            <>
                                                <SortableAccountRow
                                                    key={r.id}
                                                    row={r}
                                                    index={idx}
                                                    cols={cols}
                                                    gridTemplate={gridTemplate}
                                                    highlightQuery={
                                                        highlightQuery
                                                    }
                                                    onEdit={onEdit}
                                                    onDelete={onDelete}
                                                    onQuickAddRow={
                                                        onQuickAddRow
                                                    }
                                                    customColumns={
                                                        customColumns
                                                    }
                                                    isExpanded={expandedRows.has(
                                                        r.id,
                                                    )}
                                                    onToggle={toggleExpanded}
                                                    hideRowExpansion={
                                                        hideRowExpansion
                                                    }
                                                    enableDropdownChips={
                                                        enableDropdownChips
                                                    }
                                                    onDropdownOptionUpdate={
                                                        onDropdownOptionUpdate
                                                    }
                                                    onNewItemCreated={
                                                        onNewItemCreated
                                                    }
                                                    isCellMissing={
                                                        isCellMissing
                                                    }
                                                    compressingRowId={
                                                        compressingRowId
                                                    }
                                                    foldingRowId={foldingRowId}
                                                    allRows={rows}
                                                    expandedContent={null}
                                                    onUpdateField={
                                                        updateRowField
                                                    }
                                                    isSelected={
                                                        selectedRowId === r.id
                                                    }
                                                    onSelect={(id) =>
                                                        setSelectedRowId(id)
                                                    }
                                                    onStartFill={() => {}}
                                                    inFillRange={false}
                                                />
                                                {expandedRows.has(r.id) && (
                                                    <div
                                                        className='grid bg-white'
                                                        style={{
                                                            gridTemplateColumns:
                                                                gridTemplate
                                                                    .split('_')
                                                                    .join(' '),
                                                        }}
                                                    >
                                                        {(
                                                            subItems[r.id] || [
                                                                '',
                                                                '',
                                                            ]
                                                        ).map((_, i) => (
                                                            <>
                                                                <div className='relative h-full py-2'>
                                                                    <div className='absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-slate-400'></div>
                                                                    <div className='absolute left-1/2 -translate-x-1/2 top-0 w-3 h-px bg-slate-400'></div>
                                                                </div>
                                                                {cols.map(
                                                                    (c, ci) => (
                                                                        <div
                                                                            key={`sub-${r.id}-${i}-${c}`}
                                                                            className='py-2 px-2 bg-white border-t border-slate-200'
                                                                        >
                                                                            {ci ===
                                                                            0 ? (
                                                                                <input
                                                                                    value={
                                                                                        (subItems[
                                                                                            r
                                                                                                .id
                                                                                        ] || [
                                                                                            '',
                                                                                            '',
                                                                                        ])[
                                                                                            i
                                                                                        ] ||
                                                                                        ''
                                                                                    }
                                                                                    onChange={(
                                                                                        e,
                                                                                    ) =>
                                                                                        setSubItems(
                                                                                            (
                                                                                                m,
                                                                                            ) => {
                                                                                                const arr =
                                                                                                    [
                                                                                                        ...(m[
                                                                                                            r
                                                                                                                .id
                                                                                                        ] || [
                                                                                                            '',
                                                                                                            '',
                                                                                                        ]),
                                                                                                    ];
                                                                                                arr[
                                                                                                    i
                                                                                                ] =
                                                                                                    e.target.value;
                                                                                                return {
                                                                                                    ...m,
                                                                                                    [r.id]:
                                                                                                        arr,
                                                                                                };
                                                                                            },
                                                                                        )
                                                                                    }
                                                                                    onKeyDown={(
                                                                                        e,
                                                                                    ) => {
                                                                                        if (
                                                                                            e.key ===
                                                                                            'Enter'
                                                                                        ) {
                                                                                            setSubItems(
                                                                                                (
                                                                                                    m,
                                                                                                ) => ({
                                                                                                    ...m,
                                                                                                    [r.id]:
                                                                                                        [
                                                                                                            ...(m[
                                                                                                                r
                                                                                                                    .id
                                                                                                            ] || [
                                                                                                                '',
                                                                                                                '',
                                                                                                            ]),
                                                                                                            '',
                                                                                                        ],
                                                                                                }),
                                                                                            );
                                                                                        }
                                                                                    }}
                                                                                    placeholder='+ Add subitem'
                                                                                    className='w-full rounded border border-slate-300 px-2 py-1 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-200'
                                                                                />
                                                                            ) : (
                                                                                <div className='text-slate-400 text-sm'></div>
                                                                            )}
                                                                        </div>
                                                                    ),
                                                                )}
                                                                {customColumns.map(
                                                                    (_, ci) => (
                                                                        <div
                                                                            key={`subc-${r.id}-${i}-${ci}`}
                                                                            className='py-2 px-3 bg-white border-t border-slate-200 text-slate-400'
                                                                        ></div>
                                                                    ),
                                                                )}
                                                                <div className='flex items-center justify-center border-t border-slate-200'>
                                                                    {i ===
                                                                    (
                                                                        subItems[
                                                                            r.id
                                                                        ] || [
                                                                            '',
                                                                            '',
                                                                        ]
                                                                    ).length -
                                                                        1 ? (
                                                                        <button
                                                                            className='h-5 w-5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700'
                                                                            title='Add subitem'
                                                                            onClick={() =>
                                                                                setSubItems(
                                                                                    (
                                                                                        m,
                                                                                    ) => ({
                                                                                        ...m,
                                                                                        [r.id]:
                                                                                            [
                                                                                                ...(m[
                                                                                                    r
                                                                                                        .id
                                                                                                ] || [
                                                                                                    '',
                                                                                                    '',
                                                                                                ]),
                                                                                                '',
                                                                                            ],
                                                                                    }),
                                                                                )
                                                                            }
                                                                        >
                                                                            +
                                                                        </button>
                                                                    ) : (
                                                                        <div />
                                                                    )}
                                                                </div>
                                                            </>
                                                        ))}
                                                    </div>
                                                )}
                                                {idx === list.length - 1 &&
                                                    onQuickAddRow && (
                                                        <div className='w-full'>
                                                            <motion.div
                                                                key={`quick-add-${grp}`}
                                                                initial={{
                                                                    opacity: 0,
                                                                }}
                                                                animate={{
                                                                    opacity: 1,
                                                                }}
                                                                whileHover={
                                                                    hasBlankRow
                                                                        ? {}
                                                                        : {
                                                                              scale: 1.002,
                                                                          }
                                                                }
                                                                className={`w-full grid items-center gap-0 rounded-md border border-dashed ${
                                                                    hasBlankRow
                                                                        ? 'border-orange-300 bg-orange-50/40 cursor-not-allowed'
                                                                        : 'border-slate-300 bg-slate-50/40 hover:bg-slate-100/70 cursor-pointer'
                                                                }`}
                                                                style={{
                                                                    gridTemplateColumns:
                                                                        gridTemplate
                                                                            .split(
                                                                                '_',
                                                                            )
                                                                            .join(
                                                                                ' ',
                                                                            ),
                                                                }}
                                                                onClick={
                                                                    hasBlankRow
                                                                        ? undefined
                                                                        : onQuickAddRow
                                                                }
                                                                title={
                                                                    hasBlankRow
                                                                        ? 'Complete the existing blank row first'
                                                                        : 'Add new row'
                                                                }
                                                            >
                                                                <div
                                                                    className={`col-span-full flex items-center gap-2 px-3 py-2 text-[12px] border-t border-dashed ${
                                                                        hasBlankRow
                                                                            ? 'text-orange-600 border-orange-300'
                                                                            : 'text-slate-500 border-slate-300'
                                                                    }`}
                                                                >
                                                                    <Plus className='w-3.5 h-3.5' />
                                                                    <span>
                                                                        {hasBlankRow
                                                                            ? 'Complete the existing blank row first'
                                                                            : 'Add new row'}
                                                                    </span>
                                                                </div>
                                                            </motion.div>
                                                        </div>
                                                    )}
                                            </>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            {contactModalPortal}
        </div>
    );
}

function DropdownWithCreate({
    value,
    placeholder,
    fetchUrl,
    labelKey,
    onChange,
}: {
    value: string;
    placeholder: string;
    fetchUrl: string;
    labelKey: string;
    onChange: (v: string) => void;
}) {
    const [open, setOpen] = React.useState(false);
    const [items, setItems] = React.useState<
        Array<{id?: string; name: string}>
    >([]);
    const [adding, setAdding] = React.useState(false);
    const [newVal, setNewVal] = React.useState('');
    const ref = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
        (async () => {
            try {
                const data = await api.get<any[]>(fetchUrl);
                setItems(
                    (data || []).map((d) => ({id: d.id, name: d[labelKey]})),
                );
            } catch {}
        })();
    }, [fetchUrl, labelKey]);
    React.useEffect(() => {
        const onDoc = (e: MouseEvent) => {
            if (!ref.current) return;
            if (!ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, []);
    const selected = value || '';
    return (
        <div className='relative' ref={ref}>
            <button
                type='button'
                className='w-full text-left px-2 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-[12px] flex items-center justify-between'
                onClick={() => setOpen((v) => !v)}
                title={placeholder}
            >
                <span
                    className={selected ? 'text-slate-800' : 'text-slate-400'}
                >
                    {selected || placeholder}
                </span>
                <span className='ml-2 text-slate-400'>▾</span>
            </button>
            {open && (
                <div className='absolute z-50 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg'>
                    <div className='max-h-48 overflow-auto py-1 text-[12px]'>
                        {items.map((it) => (
                            <button
                                key={it.id || it.name}
                                className='block w-full text-left px-3 py-1.5 hover:bg-slate-50'
                                onClick={() => {
                                    onChange(it.name);
                                    setOpen(false);
                                }}
                            >
                                {it.name}
                            </button>
                        ))}
                    </div>
                    <div className='border-t p-2'>
                        {!adding ? (
                            <button
                                className='text-[12px] text-blue-600 hover:text-slate-800'
                                onClick={() => setAdding(true)}
                            >
                                + Add new
                            </button>
                        ) : (
                            <div className='flex items-center gap-2'>
                                <input
                                    value={newVal}
                                    onChange={(e) => setNewVal(e.target.value)}
                                    className='flex-1 px-2 py-1 text-[12px] rounded border border-slate-300'
                                    placeholder={`New ${placeholder.toLowerCase()}`}
                                />
                                <button
                                    className='px-2 py-1 text-[12px] rounded bg-sky-600 text-white hover:bg-sky-700'
                                    onClick={() => {
                                        if (!newVal.trim()) return;
                                        const name = newVal.trim();
                                        setItems((prev) => [...prev, {name}]);
                                        onChange(name);
                                        setNewVal('');
                                        setAdding(false);
                                        setOpen(false);
                                    }}
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
