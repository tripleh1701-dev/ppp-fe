'use client';

import React, {useEffect, useMemo, useRef, useState} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
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

export interface EnterpriseConfigRow {
    id: string;
    // New simplified fields - primary data model
    enterprise: string;
    product: string;
    services: string;
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
    accounts?: EnterpriseConfigRow[];
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
                    account.services?.split(', ').filter(Boolean) || [];
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
                    .map((service, index) => {
                        // Generate consistent color for each service
                        const key = service.toLowerCase();
                        let hash = 0;
                        for (let i = 0; i < key.length; i++) {
                            hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
                        }
                        
                        // Service color palette (same as in AsyncChipSelect)
                        const serviceColors = [
                            {
                                bg: 'bg-rose-50',
                                text: 'text-rose-800',
                                border: 'border-rose-200',
                            },
                            {
                                bg: 'bg-indigo-50',
                                text: 'text-indigo-800',
                                border: 'border-indigo-200',
                            },
                            {
                                bg: 'bg-teal-50',
                                text: 'text-teal-800',
                                border: 'border-teal-200',
                            },
                            {
                                bg: 'bg-fuchsia-50',
                                text: 'text-fuchsia-800',
                                border: 'border-fuchsia-200',
                            },
                        ];
                        
                        const colorTheme = serviceColors[hash % serviceColors.length];
                        
                        return (
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
                                className={`inline-flex items-center gap-1 px-1.5 py-[2px] text-[10px] leading-[12px] border max-w-full min-w-0 overflow-hidden whitespace-nowrap text-ellipsis ${colorTheme.bg} ${colorTheme.text} ${colorTheme.border} flex-shrink-0`}
                                style={{borderRadius: '0px !important'}}
                                title={service}
                            >
                                <span className='truncate'>{service}</span>
                                <button
                                    onClick={() => removeService(service)}
                                    className='ml-1 hover:text-slate-900 opacity-0 group-hover/item:opacity-100 transition-opacity'
                                    aria-label='Remove'
                                >
                                    <X className='h-3 w-3' />
                                </button>
                            </motion.span>
                        );
                    })}
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
                                        (opt) => {
                                            // First apply search filter
                                            const matchesSearch = query
                                                ? opt.name
                                                      .toLowerCase()
                                                      .includes(
                                                          query.toLowerCase(),
                                                      )
                                                : true;

                                            return matchesSearch;
                                        },
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
                                                bg: 'bg-blue-100',
                                                hover: 'hover:bg-blue-200',
                                                text: 'text-blue-700',
                                            },
                                            {
                                                bg: 'bg-cyan-100',
                                                hover: 'hover:bg-cyan-200',
                                                text: 'text-cyan-700',
                                            },
                                            {
                                                bg: 'bg-sky-100',
                                                hover: 'hover:bg-sky-200',
                                                text: 'text-sky-700',
                                            },
                                            {
                                                bg: 'bg-indigo-100',
                                                hover: 'hover:bg-indigo-200',
                                                text: 'text-indigo-700',
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
    currentRowId,
    currentRowEnterprise,
    currentRowProduct,
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
    accounts?: EnterpriseConfigRow[];
    currentRowId?: string;
    currentRowEnterprise?: string;
    currentRowProduct?: string;
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

    // Helper function to check if an option is in use (with composite key constraint)
    const isOptionInUse = React.useCallback(
        (optionName: string): boolean => {
            if (!accounts || accounts.length === 0) return false;

            return accounts.some((account) => {
                // Skip the current row being edited
                if (currentRowId && account.id === currentRowId) {
                    return false;
                }

                if (type === 'enterprise') {
                    // Never filter enterprises - show all options
                    return false;
                } else if (type === 'product') {
                    // For products, check if this product is already paired with the current enterprise
                    const currentEnterprise = currentRowEnterprise || '';

                    if (currentEnterprise) {
                        // Check if this product is already used with the selected enterprise
                        const isUsedWithCurrentEnterprise =
                            (account.enterprise === currentEnterprise &&
                                account.product === optionName);

                        return isUsedWithCurrentEnterprise;
                    }
                    // If no enterprise is selected yet, don't filter anything
                    return false;
                } else if (type === 'service') {
                    const services =
                        account.services?.split(', ').filter(Boolean) ||
                        [];
                    return services.includes(optionName);
                }
                return false;
            });
        },
        [accounts, type, currentRowId, currentRowEnterprise],
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
                // Filter out products that are already paired with the current enterprise
                const filteredData = (data || []).filter(
                    (product) => !isOptionInUse(product.name),
                );
                setOptions(filteredData);
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
    }, [type, query, currentRowEnterprise]);

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

    // Reload options when currentRowEnterprise changes (for product filtering)
    React.useEffect(() => {
        if (type === 'product' && currentRowEnterprise) {
            loadOptions();
        }
    }, [currentRowEnterprise, type, loadOptions]);

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
                                bg: 'bg-white',
                                text: 'text-slate-700',
                                border: 'border-slate-200',
                                dot: 'bg-slate-400',
                            },
                            {
                                bg: 'bg-white',
                                text: 'text-gray-700',
                                border: 'border-gray-200',
                                dot: 'bg-gray-400',
                            },
                            {
                                bg: 'bg-white',
                                text: 'text-stone-700',
                                border: 'border-stone-200',
                                dot: 'bg-stone-400',
                            },
                            {
                                bg: 'bg-white',
                                text: 'text-neutral-700',
                                border: 'border-neutral-200',
                                dot: 'bg-neutral-400',
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
                                bg: 'bg-white',
                                text: 'text-slate-700',
                                border: 'border-slate-200',
                                dot: 'bg-slate-400',
                            },
                            {
                                bg: 'bg-white',
                                text: 'text-gray-700',
                                border: 'border-gray-200',
                                dot: 'bg-gray-400',
                            },
                            {
                                bg: 'bg-white',
                                text: 'text-stone-700',
                                border: 'border-stone-200',
                                dot: 'bg-stone-400',
                            },
                            {
                                bg: 'bg-white',
                                text: 'text-neutral-700',
                                border: 'border-neutral-200',
                                dot: 'bg-neutral-400',
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
                                        (opt) => {
                                            // First apply search filter
                                            const matchesSearch = query
                                                ? opt.name
                                                      .toLowerCase()
                                                      .includes(
                                                          query.toLowerCase(),
                                                      )
                                                : true;

                                            return matchesSearch;
                                        },
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
                                                bg: 'bg-blue-100',
                                                hover: 'hover:bg-blue-200',
                                                text: 'text-blue-700',
                                            },
                                            {
                                                bg: 'bg-cyan-100',
                                                hover: 'hover:bg-cyan-200',
                                                text: 'text-cyan-700',
                                            },
                                            {
                                                bg: 'bg-sky-100',
                                                hover: 'hover:bg-sky-200',
                                                text: 'text-sky-700',
                                            },
                                            {
                                                bg: 'bg-indigo-100',
                                                hover: 'hover:bg-indigo-200',
                                                text: 'text-indigo-700',
                                            },
                                            {
                                                bg: 'bg-slate-100',
                                                hover: 'hover:bg-slate-200',
                                                text: 'text-slate-700',
                                            },
                                            {
                                                bg: 'bg-stone-100',
                                                hover: 'hover:bg-stone-200',
                                                text: 'text-stone-700',
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

interface EnterpriseConfigTableProps {
    rows: EnterpriseConfigRow[];
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    title?: string;
    groupByExternal?: 'none' | 'enterpriseName' | 'productName' | 'serviceName';
    onGroupByChange?: (
        g: 'none' | 'enterpriseName' | 'productName' | 'serviceName',
    ) => void;
    hideControls?: boolean;
    visibleColumns?: Array<
        | 'enterprise'
        | 'product'
        | 'services'
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
    enableInlineEditing?: boolean;
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
    onShowAllColumns?: () => void;
    compressingRowId?: string | null;
    foldingRowId?: string | null;
}

function SortableEnterpriseConfigRow({
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
    row: EnterpriseConfigRow;
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
    onUpdateField: (rowId: string, key: keyof EnterpriseConfigRow, value: any) => void;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onStartFill: (rowId: string, col: keyof EnterpriseConfigRow, value: string) => void;
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
    allRows?: EnterpriseConfigRow[];
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
            'enterprise',
            'product',
            'services',
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

                        // Simple squeezed drag image
                        proxy.style.position = 'fixed';
                        proxy.style.top = `${rect.top}px`;
                        proxy.style.left = `${rect.left}px`;
                        proxy.style.pointerEvents = 'none';
                        proxy.style.zIndex = '9999';

                        // Squeeze effect - compress horizontally to 70% width
                        proxy.style.width = `${rect.width * 0.7}px`;
                        proxy.style.height = `${rect.height}px`;
                        proxy.style.overflow = 'hidden';
                        proxy.style.transform = 'scaleX(0.7)';

                        // Clean visual styling
                        proxy.style.background = '#ffffff';
                        proxy.style.border =
                            '2px solid rgba(59, 130, 246, 0.6)';
                        proxy.style.boxShadow =
                            '0 8px 25px rgba(0, 0, 0, 0.15)';
                        proxy.style.borderRadius = '8px';
                        proxy.style.opacity = '0.9';

                        // Simple squeeze animation
                        proxy.classList.add('drag-squeezed-row');
                        proxy.style.animation =
                            'dragSqueeze 0.3s ease-out forwards';

                        // Apply compression transforms to child elements
                        const cells = proxy.querySelectorAll(
                            'div[style*="grid-column"]',
                        );
                        cells.forEach((cell: Element, cellIndex: number) => {
                            const cellEl = cell as HTMLElement;
                            cellEl.style.transform = 'scale(0.95)';
                            // Show first 3 columns normally, add ellipsis indicator for hidden content
                            if (cellIndex > 2) {
                                cellEl.style.opacity = '0.3';
                                cellEl.style.filter = 'blur(1px)';
                            } else {
                                cellEl.style.opacity = '1';
                            }
                            cellEl.style.transition = 'all 0.2s ease-out';
                        });

                        // Add visual indicator for hidden columns
                        if (cells.length > 3) {
                            const hiddenIndicator =
                                document.createElement('div');
                            hiddenIndicator.style.cssText = `
                                position: absolute;
                                top: 50%;
                                right: 30px;
                                transform: translateY(-50%);
                                background: linear-gradient(90deg, transparent 0%, rgba(59, 130, 246, 0.8) 20%, rgba(59, 130, 246, 1) 100%);
                                color: white;
                                font-size: 11px;
                                padding: 3px 8px;
                                border-radius: 12px;
                                font-weight: 700;
                                z-index: 15;
                                box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
                                display: flex;
                                align-items: center;
                                gap: 4px;
                            `;
                            hiddenIndicator.innerHTML = `
                                <span style="font-size: 8px;">●●●</span>
                                <span>+${cells.length - 3} more</span>
                            `;
                            proxy.appendChild(hiddenIndicator);
                        }

                        // Pulsing effect is now part of the combined animation above

                        // Add row selection border effect
                        const selectionBorder = document.createElement('div');
                        selectionBorder.style.cssText = `
                            position: absolute;
                            inset: -2px;
                            background: linear-gradient(45deg, #3b82f6, #8b5cf6, #ec4899, #f59e0b);
                            border-radius: 14px;
                            z-index: -1;
                            animation: selectionGlow 2s ease-in-out infinite;
                        `;
                        proxy.appendChild(selectionBorder);

                        // Remove text badges - keep only visual effects

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
                    ? 'transform scale-x-75 transition-all duration-500 ease-out'
                    : ''
            } ${
                foldingRowId === row.id
                    ? 'opacity-0 transform scale-y-50 transition-all duration-300'
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
            {cols.includes('enterprise') && (
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
                        isCellMissing(row.id, 'enterprise')
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
                                        row.enterprise || 'Enterprise';
                                    const product =
                                        row.product || 'Product';
                                    const services = row.services
                                        ? row.services.split(',').length
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
                                        <span style="color: #9ca3af;"> | </span>
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
                        data-col='enterprise'
                    >
                        {enableDropdownChips ? (
                            <AsyncChipSelect
                                type='enterprise'
                                value={(row as any).enterprise || ''}
                                onChange={(v) => {
                                    onUpdateField(
                                        row.id,
                                        'enterprise' as any,
                                        v || '',
                                    );
                                }}
                                placeholder='Select Enterprise'
                                compact={true}
                                onDropdownOptionUpdate={onDropdownOptionUpdate}
                                onNewItemCreated={onNewItemCreated}
                                accounts={allRows}
                                currentRowId={row.id}
                                currentRowEnterprise={
                                    row.enterprise ||
                                    ''
                                }
                                currentRowProduct={
                                    row.product || ''
                                }
                            />
                        ) : (
                            <InlineEditableText
                                value={row.enterprise || ''}
                                onCommit={(v) => {
                                    onUpdateField(
                                        row.id,
                                        'enterprise' as any,
                                        v,
                                    );
                                }}
                                className='text-[12px]'
                                placeholder='Enter Enterprise'
                                dataAttr={`${row.id}-enterprise`}
                                {...createTabNavigation('enterprise')}
                            />
                        )}
                    </div>
                </div>
            )}
            {cols.includes('product') && (
                <div
                    className={`text-slate-700 text-[12px] min-w-0 truncate border-r border-slate-200 px-2 py-1 ${
                        isCellMissing(row.id, 'product')
                            ? 'bg-red-50 border-red-200 ring-1 ring-red-300'
                            : ''
                    }`}
                    data-row-id={row.id}
                    data-col='product'
                >
                    {enableDropdownChips ? (
                        <AsyncChipSelect
                            type='product'
                            value={row.product}
                            onChange={(v) =>
                                onUpdateField(row.id, 'product', v || '')
                            }
                            placeholder='Select Product'
                            compact={true}
                            onDropdownOptionUpdate={onDropdownOptionUpdate}
                            onNewItemCreated={onNewItemCreated}
                            accounts={allRows}
                            currentRowId={row.id}
                            currentRowEnterprise={row.enterprise}
                        />
                    ) : (
                        <InlineEditableText
                            value={row.product || ''}
                            onCommit={(v) =>
                                onUpdateField(row.id, 'product', v)
                            }
                            className='text-[12px]'
                            dataAttr={`product-${row.id}`}
                            placeholder='Enter Product'
                            {...createTabNavigation('product')}
                        />
                    )}
                </div>
            )}
            {cols.includes('services') && (
                <div
                    className={`text-slate-700 text-[12px] min-w-0 truncate border-r border-slate-200 px-2 py-1 ${
                        isCellMissing(row.id, 'services')
                            ? 'bg-red-50 border-red-200 ring-1 ring-red-300'
                            : ''
                    }`}
                    data-row-id={row.id}
                    data-col='services'
                >
                    <ServicesMultiSelect
                        value={row.services || ''}
                        onChange={(v) =>
                            onUpdateField(row.id, 'services', v || '')
                        }
                        placeholder='Select Services'
                        onDropdownOptionUpdate={onDropdownOptionUpdate}
                        onNewItemCreated={onNewItemCreated}
                        accounts={allRows}
                    />
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

export default function EnterpriseConfigTable({
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
    enableInlineEditing = true,
    incompleteRowIds = [],
    hasBlankRow = false,
    onDropdownOptionUpdate,
    onNewItemCreated,
    onShowAllColumns,
    compressingRowId = null,
    foldingRowId = null,
}: EnterpriseConfigTableProps) {
    // Helper function to check if a cell should be highlighted as missing
    const isCellMissing = (rowId: string, field: string) => {
        if (!incompleteRowIds.includes(rowId)) return false;

        const row = localRows.find((r) => r.id === rowId);
        if (!row) return false;

        switch (field) {
            case 'enterprise':
                return !row.enterprise;
            case 'product':
                return !row.product;
            case 'services':
                return !row.services;
            default:
                return false;
        }
    };

    // Keep a local order for drag-and-drop. Sync when rows change
    const [order, setOrder] = useState<string[]>(() => rows.map((r) => r.id));
    const [localRows, setLocalRows] = useState<EnterpriseConfigRow[]>(rows);
    useEffect(() => {
        // Preserve existing order; append any new ids
        const existing = new Set(order);
        const merged = [
            ...order.filter((id) => rows.some((r) => r.id === id)),
            ...rows.filter((r) => !existing.has(r.id)).map((r) => r.id),
        ];
        setOrder(merged);
        // Deep copy rows to create new references for React updates
        const cloned = rows.map((r) => ({
            ...r,
        })) as EnterpriseConfigRow[];
        setLocalRows(cloned);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rows.map((r) => r.id).join(',')]);

    const orderedItems = useMemo(
        () =>
            order
                .map((id) => localRows.find((r) => r.id === id))
                .filter(Boolean) as EnterpriseConfigRow[],
        [order, localRows],
    );

    // Persist helpers
    // Debounced autosave per-row to avoid excessive API traffic
    const saveTimersRef = useRef<Record<string, any>>({});
    const latestRowRef = useRef<Record<string, EnterpriseConfigRow>>({});
    function schedulePersist(row: EnterpriseConfigRow, delay = 600) {
        const rowId = String(row.id);
        latestRowRef.current[rowId] = row;
        if (saveTimersRef.current[rowId])
            clearTimeout(saveTimersRef.current[rowId]);
        saveTimersRef.current[rowId] = setTimeout(() => {
            const latest = latestRowRef.current[rowId];
            if (latest) void persistEnterpriseConfigRow(latest);
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
    async function persistEnterpriseConfigRow(row: EnterpriseConfigRow) {
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
                // Core fields for enterprise configuration
                enterprise: row.enterprise,
                product: row.product,
                services: row.services,
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
                // Enterprise configuration specific fields
                enterprise: row.enterprise || '',
                product: row.product || '',
                services: row.services || '',
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

            // For enterprise configuration, all persistence is handled by parent component
            console.log(
                '⏭️ Skipping API call - enterprise configuration handled by parent',
            );
            return;
        } catch (_e) {
            // TODO: surface toast; keep silent here to avoid blocking UI
        }
    }

    function updateRowField(rowId: string, key: keyof EnterpriseConfigRow, value: any) {
        let changed: EnterpriseConfigRow | null = null;
        setLocalRows((prev) =>
            prev.map((r) => {
                if (r.id !== rowId) return r;
                const next = {...r, [key]: value} as EnterpriseConfigRow;
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
        let changed: EnterpriseConfigRow | null = null;
        setLocalRows((prev) =>
            prev.map((r) => {
                if (r.id !== rowId) return r;
                const [root, field] = path;
                let next: EnterpriseConfigRow;
                if (root === 'address') {
                    next = {
                        ...r,
                        address: {
                            ...((r as any).address || {}),
                            [field]: value,
                        },
                    } as EnterpriseConfigRow;
                } else {
                    next = {
                        ...r,
                        technical: {
                            ...((r as any).technical || {}),
                            [field]: value,
                        },
                    } as EnterpriseConfigRow;
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
        let changed: EnterpriseConfigRow | null = null;
        setLocalRows((prev) =>
            prev.map((r) => {
                if (r.id !== rowId) return r;
                const list = [...(((r as any).licenses as any[]) || [])];
                const curr = {...(list[index] || {})} as any;
                curr[key] = value;
                list[index] = curr;
                const next = {...r, licenses: list} as EnterpriseConfigRow;
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
        let changed: EnterpriseConfigRow | null = null;
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
                const next = {...r, licenses} as EnterpriseConfigRow;
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
                return {...r, licenses} as EnterpriseConfigRow;
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

    const columnOrder: EnterpriseConfigTableProps['visibleColumns'] = useMemo(
        () => [
            // Only the three required columns
            'enterprise',
            'product',
            'services',
        ],
        [],
    );
    const cols = useMemo(() => {
        const base = (columnOrder || []) as string[];
        if (!visibleColumns) return base; // Only fall back to base if visibleColumns is null/undefined
        if (visibleColumns.length === 0) return []; // If empty array, show no columns
        const allowed = new Set(visibleColumns as string[]);
        // Keep canonical order from columnOrder; filter by visibility
        return base.filter((c) => allowed.has(c));
    }, [visibleColumns, columnOrder]);

    const colSizes: Record<string, string> = {
        enterprise: '140px',
        product: 'minmax(100px,0.8fr)',
        services: 'minmax(150px,1.4fr)',
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

    // Group data based on groupBy setting
    const groupedItems = useMemo(() => {
        if (groupBy === 'none') {
            return { 'All Records': displayItems };
        }

        const groups: Record<string, EnterpriseConfigRow[]> = {};
        
        displayItems.forEach((item) => {
            let groupKey = '';
            
            switch (groupBy) {
                case 'enterpriseName':
                    groupKey = item.enterprise || '(No Enterprise)';
                    break;
                case 'productName':
                    groupKey = item.product || '(No Product)';
                    break;
                case 'serviceName':
                    // For services, we need to handle multiple services per row
                    if (item.services) {
                        const services = item.services.split(',').map(s => s.trim()).filter(Boolean);
                        if (services.length > 0) {
                            services.forEach(service => {
                                const serviceKey = service || '(No Service)';
                                if (!groups[serviceKey]) {
                                    groups[serviceKey] = [];
                                }
                                groups[serviceKey].push(item);
                            });
                            return; // Don't add to default group
                        }
                    }
                    groupKey = '(No Service)';
                    break;
                default:
                    groupKey = 'All Records';
            }
            
            if (!groups[groupKey]) {
                groups[groupKey] = [];
            }
            groups[groupKey].push(item);
        });

        // Sort group keys alphabetically, but keep "(No ...)" groups at the end
        const sortedGroups: Record<string, EnterpriseConfigRow[]> = {};
        const sortedKeys = Object.keys(groups).sort((a, b) => {
            const aIsEmpty = a.startsWith('(No ');
            const bIsEmpty = b.startsWith('(No ');
            if (aIsEmpty && !bIsEmpty) return 1;
            if (!aIsEmpty && bIsEmpty) return -1;
            return a.localeCompare(b);
        });

        sortedKeys.forEach(key => {
            sortedGroups[key] = groups[key];
        });

        return sortedGroups;
    }, [displayItems, groupBy]);

    return (
        <div className='w-full compact-table safari-tight'>
            <div className='flex items-center justify-between mb-2'>
                <h3 className='text-sm font-semibold text-slate-800'>
                    {title ?? 'Enterprise Configuration Details'}
                </h3>
            </div>
            {cols.length === 0 ? (
                <div className='bg-white border border-slate-200 rounded-lg p-8 text-center'>
                    <div className='flex flex-col items-center space-y-4'>
                        <svg
                            className='w-12 h-12 text-slate-400'
                            fill='none'
                            viewBox='0 0 24 24'
                            stroke='currentColor'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={1.5}
                                d='M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z'
                            />
                        </svg>
                        <div className='space-y-2'>
                            <h3 className='text-lg font-medium text-slate-900'>
                                No columns are visible
                            </h3>
                            <p className='text-sm text-slate-500 max-w-sm'>
                                All columns have been hidden. Use the Show/Hide button in the toolbar to select which columns to display, or click the button below to show all columns.
                            </p>
                        </div>
                        {onShowAllColumns && (
                            <button
                                onClick={onShowAllColumns}
                                className='inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200'
                            >
                                <svg
                                    className='w-4 h-4'
                                    fill='none'
                                    viewBox='0 0 24 24'
                                    stroke='currentColor'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                                    />
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                                    />
                                </svg>
                                Show All Columns
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div role='table' className='p-0 overflow-x-auto'>
                <div className='w-full relative'>
                    {(() => {
                        const cssTemplate = gridTemplate.split('_').join(' ');
                        const defaultLabels: Record<string, string> = {
                            enterprise: 'Enterprise',
                            product: 'Product', 
                            services: 'Services',
                        };

                        // Merge custom labels with defaults
                        const labelFor: Record<string, string> = {
                            ...defaultLabels,
                            ...customColumnLabels,
                        };

                        const iconFor: Record<string, React.ReactNode> = {
                            enterprise: (
                                <Building2 className='h-3.5 w-3.5 text-blue-600' />
                            ),
                            product: (
                                <Package className='h-3.5 w-3.5 text-blue-600' />
                            ),
                            services: (
                                <Globe className='h-3.5 w-3.5 text-blue-600' />
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
                                    <SortableEnterpriseConfigRow
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
                                        expandedContent={null}
                                        onUpdateField={updateRowField}
                                        isSelected={selectedRowId === r.id}
                                        onSelect={(id) => setSelectedRowId(id)}
                                        onStartFill={() => {}}
                                        inFillRange={false}
                                    />
                                    {expandedRows.has(r.id) && (
                                        <div className='group relative bg-white border-t border-slate-200 px-2 py-3 pl-6'>
                                            <div className='absolute left-3 top-0 bottom-0 w-px bg-slate-500 transition-colors duration-300 group-hover:bg-sky-500'></div>
                                            <div className='text-sm text-slate-600'>
                                                Expanded content has been simplified for the 3-field enterprise configuration model.
                                            </div>
                                        </div>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    ) : (
                        <div className='space-y-4'>
                            {Object.entries(groupedItems).map(([groupName, groupRows]) => (
                                <div key={groupName} className='border border-slate-200 rounded-lg overflow-hidden'>
                                    {/* Group Header */}
                                    <div className='bg-slate-50 px-4 py-3 border-b border-slate-200'>
                                        <h4 className='font-semibold text-slate-900 flex items-center gap-2'>
                                            <span>{groupName}</span>
                                            <span className='inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-700'>
                                                {groupRows.length} record{groupRows.length !== 1 ? 's' : ''}
                                            </span>
                                        </h4>
                                    </div>
                                    
                                    {/* Group Rows */}
                                    <div className='divide-y divide-slate-200'>
                                        {groupRows.map((r, idx) => (
                                            <React.Fragment key={r.id}>
                                                <SortableEnterpriseConfigRow
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
                                                    expandedContent={null}
                                                    onUpdateField={updateRowField}
                                                    isSelected={selectedRowId === r.id}
                                                    onSelect={(id) => setSelectedRowId(id)}
                                                    onStartFill={() => {}}
                                                    inFillRange={false}
                                                />
                                                {expandedRows.has(r.id) && (
                                                    <div className='group relative bg-white border-t border-slate-200 px-2 py-3 pl-6'>
                                                        <div className='absolute left-3 top-0 bottom-0 w-px bg-slate-500 transition-colors duration-300 group-hover:bg-sky-500'></div>
                                                        <div className='text-sm text-slate-600'>
                                                            Expanded content has been simplified for the 3-field enterprise configuration model.
                                                        </div>
                                                    </div>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                {/* Add New Row Button - Similar to AdvancedDataTable pattern */}
                {onQuickAddRow && (
                    <motion.div
                        className='border-t border-slate-200 bg-slate-50/50 p-3 rounded-b-xl'
                        whileHover={{backgroundColor: 'rgb(248 250 252)'}}
                    >
                        <motion.button
                            onClick={onQuickAddRow}
                            className='flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm'
                            whileHover={{scale: 1.02}}
                            whileTap={{scale: 0.98}}
                        >
                            <Plus className='h-4 w-4' />
                            Add new row
                        </motion.button>
                    </motion.div>
                )}
            </div>
            )}
        </div>
    );
}
