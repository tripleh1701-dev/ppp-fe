'use client';

import React, {
    useEffect,
    useMemo,
    useRef,
    useState,
    forwardRef,
    useImperativeHandle,
    useCallback,
} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {generateId} from '@/utils/id-generator';
import {
    ArrowUp,
    ArrowDown,
    Trash2,
    Pencil,
    MoreVertical,
    ChevronRight,
    ChevronDown,
    ChevronUp,
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
    Maximize2,
    Minimize2,
    Expand,
    ChevronsDown,
    ChevronsUp,
    Layers,
    FoldVertical,
    UnfoldVertical,
} from 'lucide-react';
import {createPortal} from 'react-dom';
import {api} from '../utils/api';
import {accessControlApi} from '../services/accessControlApi';
import DateChipSelect from './DateChipSelect';
import ContactModal from './ContactModal';

// Utility function to generate consistent colors for account data across the application
const getAccountColor = (accountName: string) => {
    const key = accountName.toLowerCase();
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
        hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    }

    // Blueish account color palette - consistent across all components
    const accountColors = [
        {
            bg: 'bg-blue-50',
            text: 'text-blue-800',
            border: 'border-blue-200',
            tone: 'blue' as const,
        },
        {
            bg: 'bg-sky-50',
            text: 'text-sky-800',
            border: 'border-sky-200',
            tone: 'sky' as const,
        },
        {
            bg: 'bg-indigo-50',
            text: 'text-indigo-800',
            border: 'border-indigo-200',
            tone: 'indigo' as const,
        },
        {
            bg: 'bg-cyan-50',
            text: 'text-cyan-800',
            border: 'border-cyan-200',
            tone: 'cyan' as const,
        },
        {
            bg: 'bg-slate-50',
            text: 'text-slate-800',
            border: 'border-slate-200',
            tone: 'slate' as const,
        },
    ];

    return accountColors[hash % accountColors.length];
};

// Simple dropdown component for predefined values (like cloudType)
interface SimpleDropdownProps {
    value: string;
    options: Array<{value: string; label: string}>;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    isError?: boolean;
    onTabNext?: () => void;
    onTabPrev?: () => void;
}

const SimpleDropdown: React.FC<SimpleDropdownProps> = ({
    value,
    options,
    onChange,
    placeholder = 'Select option',
    className = '',
    isError = false,
    onTabNext,
    onTabPrev,
}) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const [dropdownPosition, setDropdownPosition] = React.useState<{
        top: number;
        left: number;
        width: number;
    } | null>(null);

    // Calculate dropdown position
    const calculatePosition = React.useCallback(() => {
        if (dropdownRef.current) {
            const rect = dropdownRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + 2,
                left: rect.left,
                width: Math.max(rect.width, 120),
            });
        }
    }, []);

    // Update position when opening
    React.useEffect(() => {
        if (isOpen) {
            calculatePosition();
            window.addEventListener('resize', calculatePosition);
            window.addEventListener('scroll', calculatePosition, true);
            return () => {
                window.removeEventListener('resize', calculatePosition);
                window.removeEventListener('scroll', calculatePosition, true);
            };
        }
    }, [isOpen, calculatePosition]);

    // Close dropdown when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find((opt) => opt.value === value);

    return (
        <div ref={dropdownRef} className={`relative w-full ${className}`}>
            <button
                type='button'
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log(
                        '🔽 SimpleDropdown clicked, opening dropdown, current value:',
                        value,
                    );
                    setIsOpen(!isOpen);
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Tab') {
                        if (e.shiftKey && onTabPrev) {
                            e.preventDefault();
                            onTabPrev();
                        } else if (!e.shiftKey && onTabNext) {
                            e.preventDefault();
                            onTabNext();
                        }
                    } else if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (isOpen && highlightedIndex >= 0) {
                            // Select the highlighted option
                            const selectedOption = options[highlightedIndex];
                            onChange(selectedOption.value);
                            setIsOpen(false);
                            setHighlightedIndex(-1);
                        } else {
                            // Open dropdown
                            setIsOpen(!isOpen);
                            setHighlightedIndex(-1);
                        }
                    } else if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        if (!isOpen) {
                            setIsOpen(true);
                            setHighlightedIndex(0);
                        } else {
                            setHighlightedIndex((prev) =>
                                prev < options.length - 1 ? prev + 1 : prev,
                            );
                        }
                    } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        if (!isOpen) {
                            setIsOpen(true);
                            setHighlightedIndex(options.length - 1);
                        } else {
                            setHighlightedIndex((prev) =>
                                prev > 0 ? prev - 1 : prev,
                            );
                        }
                    } else if (e.key === 'Escape') {
                        e.preventDefault();
                        setIsOpen(false);
                        setHighlightedIndex(-1);
                    } else if (e.key === 'P' || e.key === 'p') {
                        e.preventDefault();
                        if (!isOpen) {
                            setIsOpen(true);
                            setHighlightedIndex(-1);
                        }
                    }
                }}
                className={`w-full text-left px-2 py-1 text-[11px] leading-[14px] rounded border ${
                    isError
                        ? 'border-red-500 bg-red-50 ring-2 ring-red-200'
                        : 'border-blue-300 bg-white'
                } hover:bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 ${
                    isError
                        ? 'focus:ring-red-200 focus:border-red-500'
                        : 'focus:ring-blue-200 focus:border-blue-500'
                } flex items-center justify-between min-h-[24px]`}
            >
                <span className='truncate flex-1 pr-1'>
                    {selectedOption ? (
                        selectedOption.label
                    ) : (
                        <span className='text-slate-400'>{placeholder}</span>
                    )}
                </span>
                <ChevronDown
                    size={12}
                    className={`text-slate-400 flex-shrink-0 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                    }`}
                />
            </button>

            {isOpen &&
                dropdownPosition &&
                createPortal(
                    <div
                        className='fixed z-[99999] bg-white border border-gray-200 rounded-md shadow-xl'
                        style={{
                            top: `${dropdownPosition.top}px`,
                            left: `${dropdownPosition.left}px`,
                            width: `${dropdownPosition.width}px`,
                            maxHeight: '120px',
                            overflow: 'auto',
                        }}
                        onMouseDown={(e) => e.preventDefault()} // Prevent losing focus
                    >
                        {options.map((option, index) => (
                            <button
                                key={option.value}
                                type='button'
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log(
                                        '🚀 MOUSE DOWN on option:',
                                        option.value,
                                    );
                                }}
                                onMouseEnter={() => setHighlightedIndex(index)}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log(
                                        '✅ Option selected:',
                                        option.value,
                                        'calling onChange',
                                    );
                                    console.log(
                                        '🎯 About to call onChange with:',
                                        option.value,
                                    );
                                    onChange(option.value);
                                    console.log(
                                        '🎯 onChange called, closing dropdown',
                                    );
                                    setIsOpen(false);
                                    setHighlightedIndex(-1);
                                }}
                                className={`w-full text-left px-2 py-1.5 text-[11px] hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors border-none ${
                                    value === option.value
                                        ? 'bg-blue-100 text-blue-700'
                                        : highlightedIndex === index
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-slate-700'
                                }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>,
                    document.body,
                )}
        </div>
    );
};

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
        blue: 'bg-white text-black',
        green: 'bg-green-100 text-green-800 border-green-200',
        purple: 'bg-purple-100 text-purple-800 border-purple-200',
    };

    return (
        <span
            className={`inline-flex items-center px-2 py-1 text-xs font-medium ${colorClasses[color]} mr-1 mb-1 rounded`}
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

    // Ensure options is always an array
    const safeOptions = Array.isArray(options) ? options : [];

    const filteredOptions = safeOptions.filter(
        (option) =>
            option?.name
                ?.toLowerCase?.()
                ?.includes?.(searchTerm.toLowerCase()) ?? false,
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

    const selectedOptions = safeOptions.filter((opt) =>
        selected.includes(opt?.id),
    );

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
                <div className='absolute w-full mt-1 bg-gray-50 border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-auto before:content-[""] before:absolute before:-top-2 before:left-4 before:w-0 before:h-0 before:border-l-[8px] before:border-l-transparent before:border-r-[8px] before:border-r-transparent before:border-b-[8px] before:border-b-gray-50 after:content-[""] after:absolute after:-top-[10px] after:left-[14px] after:w-0 after:h-0 after:border-l-[10px] after:border-l-transparent after:border-r-[10px] after:border-r-transparent after:border-b-[10px] after:border-b-gray-200'>
                    <div className='p-3 border-b border-gray-200 bg-gray-50'>
                        <input
                            type='text'
                            placeholder='Search...'
                            value={searchTerm}
                            onChange={(
                                e: React.ChangeEvent<HTMLInputElement>,
                            ) => setSearchTerm(e.target.value)}
                            className='w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white'
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
                                    className={`p-3 text-sm cursor-pointer hover:bg-blue-50 flex items-center justify-between transition-colors duration-150 ${
                                        isSelected
                                            ? 'bg-blue-100 text-blue-700 font-medium'
                                            : 'text-gray-700'
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
                            <div className='p-3 text-sm text-gray-500 text-center italic'>
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
    // New simplified fields - primary data model
    accountName: string;
    masterAccount: string;
    cloudType: string;
    address: string;
    country?: string; // Add country field
    technicalUsers?: any[]; // Add technical users field
    // Add licenses array for expandable sub-rows
    licenses?: License[];
    // Audit columns from DynamoDB
    createdBy?: string | number;
    creationDate?: string;
    lastUpdatedBy?: string | number;
    lastUpdateDate?: string;
}

// License interface for sub-rows
interface Contact {
    id: string;
    name: string;
    email: string;
    phone: string;
    department: string;
    designation: string;
}

export interface License {
    id: string;
    enterprise: string;
    product: string;
    service: string;
    licenseStartDate: string;
    licenseEndDate: string;
    numberOfUsers: string;
    contactDetails: Contact;
    renewalNotice: boolean;
    noticePeriodDays?: string;
    stableId?: string; // Add stableId field
}

function InlineEditableText({
    value,
    onCommit,
    placeholder,
    isError = false,
    renderDisplay,
    className,
    dataAttr,
    onTabNext,
    onTabPrev,
}: {
    value: string;
    onCommit: (next: string) => void;
    placeholder?: string;
    isError?: boolean;
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setDraft(e.target.value)
                }
                onBlur={commit}
                onKeyDown={(e: any) => {
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
                className={`min-w-0 w-full rounded-sm border ${
                    isError
                        ? 'border-red-500 bg-red-50 ring-2 ring-red-200'
                        : 'border-blue-300 bg-white'
                } px-1 py-1 text-[12px] focus:outline-none focus:ring-2 ${
                    isError
                        ? 'focus:ring-red-200 focus:border-red-500'
                        : 'focus:ring-blue-200 focus:border-blue-500'
                } ${className || ''}`}
                data-inline={dataAttr || undefined}
            />
        );
    }
    const isEmpty = !value || value.length === 0;

    // Show input immediately for empty fields (like Enterprise Configuration)
    if (editing || isEmpty) {
        return (
            <input
                ref={inputRef}
                value={draft}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setDraft(e.target.value)
                }
                onBlur={commit}
                onFocus={() => setEditing(true)}
                onKeyDown={(e: any) => {
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
                className={`min-w-0 w-full rounded-sm border ${
                    isError
                        ? 'border-red-500 bg-red-50 ring-2 ring-red-200'
                        : 'border-blue-300 bg-white'
                } px-1 py-1 text-[12px] focus:outline-none focus:ring-2 ${
                    isError
                        ? 'focus:ring-red-200 focus:border-red-500'
                        : 'focus:ring-blue-200 focus:border-blue-500'
                } ${className || ''}`}
                data-inline={dataAttr || undefined}
            />
        );
    }

    // Show display mode for non-empty fields
    return (
        <span
            className={`group/ie inline-flex min-w-0 items-center truncate rounded-sm px-1 -mx-1 -my-0.5 hover:ring-1 hover:ring-slate-300 hover:bg-white/60 cursor-text ${
                className || ''
            }`}
            onDoubleClick={() => setEditing(true)}
            title={`Double-click to edit: ${(value || '').toString()}`}
            data-inline={dataAttr || undefined}
            tabIndex={0}
            onKeyDown={(e: any) => {
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
            ) : (
                <span>{value || ''}</span>
            )}
        </span>
    );
}

type CatalogType =
    | 'accountName'
    | 'masterAccount'
    | 'cloudType'
    | 'address'
    | 'template'
    | 'enterprise'
    | 'product'
    | 'service';

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
                        onChange={(e: any) => setEditValue(e.target.value)}
                        onKeyDown={(e: any) => {
                            if (e.key === 'Enter') handleSave();
                            if (e.key === 'Escape') handleCancel();
                        }}
                        className='flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
                        placeholder=''
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
                style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}
            >
                <span className='relative z-10 block truncate pr-16'>
                    {option.name}
                </span>
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
                    onClick={(e: any) => {
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
                    onClick={(e: any) => {
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

// Multi-select component specifically for phone numbers
function PhoneMultiSelect({
    value,
    onChange,
    placeholder = 'Select Services',
    isError = false,
    onDropdownOptionUpdate,
    onNewItemCreated,
    accounts = [],
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    isError?: boolean;
    onDropdownOptionUpdate?: (
        type: 'accountNames' | 'emails' | 'phones',
        action: 'update' | 'delete',
        oldName: string,
        newName?: string,
    ) => Promise<void>;
    onNewItemCreated?: (
        type: 'accountNames' | 'emails' | 'phones',
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
    const [showMoreServices, setShowMoreServices] = React.useState(false);
    const [moreServicesPos, setMoreServicesPos] = React.useState<{
        top: number;
        left: number;
        width: number;
    } | null>(null);
    const moreServicesRef = React.useRef<HTMLButtonElement>(null);

    // Helper function to check if a phone number is in use
    const isPhoneInUse = React.useCallback(
        (phoneNumber: string): boolean => {
            if (!accounts || accounts.length === 0) return false;

            return accounts.some((account) => {
                // Since phone is no longer used, always return false
                return false;
            });
        },
        [accounts],
    );

    const containerRef = React.useRef<HTMLDivElement>(null);
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [dropdownPos, setDropdownPos] = React.useState<{
        top: number;
        left: number;
        width: number;
    } | null>(null);

    // Parse selected phones from comma-separated string
    const selectedPhones = React.useMemo(() => {
        return value
            ? value
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean)
            : [];
    }, [value]);

    // Responsive display logic
    // Show maximum 4 value chips, with count indicator for additional chips
    const [visibleCount, setVisibleCount] = React.useState(4);

    // Helper function to remove a phone number
    const removePhone = React.useCallback(
        (phoneToRemove: string) => {
            const newServices = selectedPhones.filter(
                (s: string) => s !== phoneToRemove,
            );
            onChange(newServices.join(', '));
        },
        [selectedPhones, onChange],
    );

    // Helper function to toggle a phone number selection
    const togglePhone = React.useCallback(
        (phoneName: string) => {
            const isSelected = selectedPhones.includes(phoneName);
            let newServices;
            if (isSelected) {
                newServices = selectedPhones.filter(
                    (s: string) => s !== phoneName,
                );
            } else {
                newServices = [...selectedPhones, phoneName];
            }
            onChange(newServices.join(', '));
        },
        [selectedPhones, onChange],
    );

    React.useEffect(() => {
        const updateVisibleCount = () => {
            if (typeof window === 'undefined') return;
            // Always show maximum 4 chips regardless of screen size
            setVisibleCount(4);
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
                `/api/phones${
                    query ? `?search=${encodeURIComponent(query)}` : ''
                }`,
            );
            // Filter out already selected phones
            const filteredData = (data || []).filter(
                (option: any) => !selectedPhones.includes(option.name),
            );
            setOptions(filteredData);
        } catch (_e) {
            setOptions([]);
        } finally {
            setLoading(false);
        }
    }, [query, selectedPhones]);

    React.useEffect(() => {
        if (!open) return;
        loadOptions();
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect && typeof window !== 'undefined') {
            // Find table container for better positioning
            const tableContainer =
                containerRef.current?.closest('[role="table"]') ||
                containerRef.current?.closest('.overflow-auto') ||
                document.body;
            const tableRect = tableContainer.getBoundingClientRect();

            const width = 256;
            // Constrain within table bounds
            const tableRightBound = tableRect.right - width - 16;
            const maxLeft = Math.min(
                tableRightBound,
                window.innerWidth - width - 16,
            );
            const minLeft = Math.max(tableRect.left + 16, 16);
            const left = Math.max(minLeft, Math.min(maxLeft, rect.left));

            const tableBottomBound = Math.min(
                tableRect.bottom - 50,
                window.innerHeight - 200,
            );
            const top = Math.min(tableBottomBound, rect.bottom + 8);
            setDropdownPos({top, left, width});
        }
    }, [open, loadOptions]);

    // Position the more services dropdown
    React.useEffect(() => {
        if (showMoreServices && moreServicesRef.current) {
            const rect = moreServicesRef.current.getBoundingClientRect();

            // Find the table container to ensure dropdown stays within table bounds
            const tableContainer =
                moreServicesRef.current.closest('[role="table"]') ||
                moreServicesRef.current.closest('.overflow-auto') ||
                document.body;
            const tableRect = tableContainer.getBoundingClientRect();

            // Calculate width with stricter table container constraints
            const maxWidth = Math.min(
                280,
                tableRect.width * 0.4,
                window.innerWidth * 0.3,
            );
            const width = Math.max(180, Math.min(maxWidth, rect.width));

            // Ensure dropdown stays strictly within table container horizontally
            const idealLeft = rect.left;
            const tableRightBound = tableRect.right - width - 16; // More margin from table edge
            const maxLeft = Math.min(
                tableRightBound,
                window.innerWidth - width - 16,
            );
            const minLeft = Math.max(tableRect.left + 16, 16); // More margin from table edge
            const left = Math.max(minLeft, Math.min(maxLeft, idealLeft));

            // Ensure dropdown stays within both table and viewport vertically
            const tableBottomBound = Math.min(
                tableRect.bottom - 50,
                window.innerHeight - 200,
            );
            const top = Math.min(tableBottomBound, rect.bottom + 8);
            setMoreServicesPos({top, left, width});
        }
    }, [showMoreServices]);

    React.useEffect(() => {
        const onDoc = (e: MouseEvent) => {
            const target = e.target as Node;
            const withinAnchor = !!containerRef.current?.contains(target);
            const withinDropdown = !!dropdownRef.current?.contains(target);
            if (!withinAnchor && !withinDropdown) {
                setOpen(false);
                setShowAdder(false);
                setAdding('');
                setShowMoreServices(false);
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

            // Focus next row's first field (Enterprise) after selecting existing service
            const currentElement = inputRef?.current;
            if (currentElement) {
                // Find the closest div with data-row-id attribute
                const currentRowDiv = currentElement.closest('[data-row-id]');
                const currentRowId = currentRowDiv?.getAttribute('data-row-id');

                if (currentRowId) {
                    // Find the next row (increment the row number)
                    const currentRowNum = parseInt(currentRowId);
                    const nextRowId = (currentRowNum + 1).toString();

                    // Find the enterprise column in the next row
                    const nextRowDiv = document.querySelector(
                        `[data-row-id="${nextRowId}"][data-col="enterprise"]`,
                    );
                    const nextInput = nextRowDiv?.querySelector(
                        'input',
                    ) as HTMLInputElement;

                    if (nextInput) {
                        // Use requestAnimationFrame to ensure DOM is updated
                        requestAnimationFrame(() => {
                            nextInput.focus();
                            nextInput.click();
                        });
                    }
                }
            }
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

                // Focus next row's first field (Enterprise) after adding new service
                const currentElement = inputRef?.current;
                if (currentElement) {
                    // Find the closest div with data-row-id attribute
                    const currentRowDiv =
                        currentElement.closest('[data-row-id]');
                    const currentRowId =
                        currentRowDiv?.getAttribute('data-row-id');

                    if (currentRowId) {
                        // Find the next row (increment the row number)
                        const currentRowNum = parseInt(currentRowId);
                        const nextRowId = (currentRowNum + 1).toString();

                        // Find the enterprise column in the next row
                        const nextRowDiv = document.querySelector(
                            `[data-row-id="${nextRowId}"][data-col="enterprise"]`,
                        );
                        const nextInput = nextRowDiv?.querySelector(
                            'input',
                        ) as HTMLInputElement;

                        if (nextInput) {
                            // Use requestAnimationFrame to ensure DOM is updated
                            requestAnimationFrame(() => {
                                nextInput.focus();
                                nextInput.click();
                            });
                        }
                    }
                }

                // Notify parent component about the new item
                if (onNewItemCreated) {
                    onNewItemCreated('phones', created);
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
                    togglePhone(existingItem.name);

                    // Focus next row's first field (Enterprise) after selecting existing service
                    const currentElement = inputRef?.current;
                    if (currentElement) {
                        // Find the closest div with data-row-id attribute
                        const currentRowDiv =
                            currentElement.closest('[data-row-id]');
                        const currentRowId =
                            currentRowDiv?.getAttribute('data-row-id');

                        if (currentRowId) {
                            // Find the next row (increment the row number)
                            const currentRowNum = parseInt(currentRowId);
                            const nextRowId = (currentRowNum + 1).toString();

                            // Find the enterprise column in the next row
                            const nextRowDiv = document.querySelector(
                                `[data-row-id="${nextRowId}"][data-col="enterprise"]`,
                            );
                            const nextInput = nextRowDiv?.querySelector(
                                'input',
                            ) as HTMLInputElement;

                            if (nextInput) {
                                // Use requestAnimationFrame to ensure DOM is updated
                                requestAnimationFrame(() => {
                                    nextInput.focus();
                                    nextInput.click();
                                });
                            }
                        }
                    }
                }
            }
            setShowAdder(false);
            setAdding('');
            setQuery('');
        }
    };

    const toggleService = (serviceName: string) => {
        const isSelected = selectedPhones.includes(serviceName);
        let newServices;
        if (isSelected) {
            newServices = selectedPhones.filter(
                (s: string) => s !== serviceName,
            );
        } else {
            newServices = [...selectedPhones, serviceName];
        }
        onChange(newServices.join(', '));
    };

    const removeService = (serviceName: string) => {
        const newServices = selectedPhones.filter(
            (s: string) => s !== serviceName,
        );
        onChange(newServices.join(', '));
    };

    return (
        <div
            ref={containerRef}
            className='relative flex items-center gap-1 group/item'
        >
            <div className='flex items-center gap-1'>
                {selectedPhones
                    .slice(0, visibleCount)
                    .map((service: string, index: number) => {
                        // Use consistent color function
                        const colorTheme = getAccountColor(service);

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
                                className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] leading-[14px] border rounded ${colorTheme.bg} ${colorTheme.text} ${colorTheme.border}`}
                                title={service}
                            >
                                <span className='flex-1'>{service}</span>
                                <button
                                    onClick={() => removeService(service)}
                                    className='hover:text-slate-900 opacity-0 group-hover/item:opacity-100 transition-opacity flex-shrink-0 p-0.5 rounded-sm'
                                    aria-label='Remove'
                                    style={{
                                        minWidth: '20px',
                                        minHeight: '20px',
                                    }}
                                >
                                    <X size={12} />
                                </button>
                            </motion.span>
                        );
                    })}
                {selectedPhones.length > visibleCount && (
                    <div className='relative'>
                        <button
                            ref={moreServicesRef}
                            onClick={(e: any) => {
                                e.stopPropagation();
                                setShowMoreServices(!showMoreServices);
                            }}
                            className='inline-flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-semibold leading-tight border bg-slate-50 text-slate-600 border-slate-200 flex-shrink-0 cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition-colors min-w-[40px] justify-center'
                        >
                            +{selectedPhones.length - visibleCount}
                        </button>

                        {/* Dropdown for additional services */}
                        {showMoreServices &&
                            moreServicesPos &&
                            createPortal(
                                <div
                                    className='bg-white border border-slate-200 rounded-lg shadow-lg max-w-xs min-w-48'
                                    onMouseDown={(e: any) =>
                                        e.stopPropagation()
                                    }
                                    onClick={(e: any) => e.stopPropagation()}
                                    style={{
                                        position: 'fixed',
                                        top: Math.min(
                                            moreServicesPos.top,
                                            window.innerHeight - 200,
                                        ),
                                        left: Math.min(
                                            moreServicesPos.left,
                                            window.innerWidth - 250,
                                        ),
                                        width: Math.min(
                                            moreServicesPos.width,
                                            240,
                                        ),
                                        maxWidth: '240px',
                                    }}
                                >
                                    <div className='p-3'>
                                        <div className='text-xs font-medium text-slate-700 mb-2'>
                                            Additional Phones (
                                            {selectedPhones.length -
                                                visibleCount}
                                            )
                                        </div>
                                        <div className='space-y-1 max-h-32 overflow-y-auto'>
                                            {selectedPhones
                                                .slice(visibleCount)
                                                .map((phone, idx) => {
                                                    const colorTheme =
                                                        getAccountColor(phone);
                                                    return (
                                                        <div
                                                            key={`additional-${idx}`}
                                                            className='flex items-center justify-between group/additional'
                                                        >
                                                            <span
                                                                className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] leading-[12px] border rounded whitespace-nowrap ${colorTheme.bg} ${colorTheme.text} ${colorTheme.border}`}
                                                            >
                                                                {phone}
                                                            </span>
                                                            <button
                                                                onClick={() => {
                                                                    removePhone(
                                                                        phone,
                                                                    );
                                                                    // Close dropdown if no more additional phones
                                                                    if (
                                                                        selectedPhones.length -
                                                                            1 <=
                                                                        visibleCount
                                                                    ) {
                                                                        setShowMoreServices(
                                                                            false,
                                                                        );
                                                                    }
                                                                }}
                                                                className='opacity-0 group-hover/additional:opacity-100 transition-opacity p-1 rounded-sm hover:bg-slate-100'
                                                                aria-label='Remove'
                                                            >
                                                                <X size={12} />
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    </div>
                                </div>,
                                document.body,
                            )}
                    </div>
                )}

                {/* Show input field when no services selected OR when actively adding more OR when there's an error */}
                {selectedPhones.length === 0 || open || isError ? (
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={(e: any) => {
                            setQuery(e.target.value);
                            setOpen(true);
                        }}
                        onFocus={() => {
                            setOpen(true);
                            setShowMoreServices(false); // Close the more services dropdown
                        }}
                        onKeyDown={async (e: any) => {
                            // Helper function to navigate to next row's enterprise field
                            const navigateToNextRow = (
                                currentElement: HTMLInputElement,
                            ) => {
                                // Find the closest div with data-col attribute (current column)
                                const currentColDiv =
                                    currentElement.closest('[data-col]');
                                const currentRowId =
                                    currentColDiv?.getAttribute('data-row-id');

                                if (currentRowId) {
                                    // For services column, move to next row's first column (enterprise)
                                    // Find next row by looking for the next row ID
                                    const allRows =
                                        document.querySelectorAll(
                                            '[data-row-id]',
                                        );
                                    const currentRowIndex = Array.from(
                                        allRows,
                                    ).findIndex(
                                        (row) =>
                                            row.getAttribute('data-row-id') ===
                                            currentRowId,
                                    );

                                    // Find next row's enterprise column
                                    const nextRowElements = Array.from(
                                        allRows,
                                    ).slice(currentRowIndex + 1);
                                    const nextEnterpriseCol =
                                        nextRowElements.find(
                                            (row) =>
                                                row.getAttribute('data-col') ===
                                                'enterprise',
                                        );
                                    const nextInput =
                                        nextEnterpriseCol?.querySelector(
                                            'input',
                                        ) as HTMLInputElement;

                                    if (nextInput) {
                                        // Use requestAnimationFrame to ensure DOM is updated
                                        requestAnimationFrame(() => {
                                            nextInput.focus();
                                            nextInput.click();
                                        });
                                    }
                                }
                            };

                            if (e.key === 'Enter' && query.trim()) {
                                e.preventDefault(); // Prevent form submission
                                e.stopPropagation(); // Stop event bubbling

                                // Check for exact match first
                                const exactMatch = options.find(
                                    (opt) =>
                                        opt.name.toLowerCase() ===
                                        query.toLowerCase().trim(),
                                );

                                if (exactMatch) {
                                    // Add existing service and navigate
                                    toggleService(exactMatch.name);
                                    setQuery('');
                                    setOpen(false);
                                    navigateToNextRow(
                                        e.target as HTMLInputElement,
                                    );
                                } else {
                                    // Create new service (same logic as addNew function)
                                    try {
                                        const created = await api.post<{
                                            id: string;
                                            name: string;
                                        }>('/api/phones', {
                                            name: query.trim(),
                                        });
                                        if (created) {
                                            setOptions((prev) => {
                                                const exists = prev.some(
                                                    (o) => o.id === created!.id,
                                                );
                                                return exists
                                                    ? prev
                                                    : [...prev, created!];
                                            });
                                            // Add the new service to selection
                                            togglePhone(created.name);
                                            setQuery('');
                                            setOpen(false);

                                            // Navigate to next row
                                            navigateToNextRow(
                                                e.target as HTMLInputElement,
                                            );

                                            // Notify parent component about the new item
                                            if (onNewItemCreated) {
                                                onNewItemCreated(
                                                    'phones',
                                                    created,
                                                );
                                            }
                                        }
                                    } catch (error: any) {
                                        // Handle duplicate error from backend
                                        if (
                                            error?.message?.includes(
                                                'already exists',
                                            ) ||
                                            error?.message?.includes(
                                                'duplicate',
                                            )
                                        ) {
                                            // Try to find the existing item and add it to selection
                                            const existingItem = options.find(
                                                (opt) =>
                                                    opt.name.toLowerCase() ===
                                                    query.toLowerCase(),
                                            );
                                            if (existingItem) {
                                                togglePhone(existingItem.name);
                                                setQuery('');
                                                setOpen(false);
                                                navigateToNextRow(
                                                    e.target as HTMLInputElement,
                                                );
                                            }
                                        } else {
                                            console.error(
                                                'Failed to create service:',
                                                error,
                                            );
                                        }
                                    }
                                }
                            } else if (e.key === 'Tab' && query.trim()) {
                                // Check for exact match in all options when Tab is pressed
                                const exactMatch = options.find(
                                    (opt) =>
                                        opt.name.toLowerCase() ===
                                        query.toLowerCase().trim(),
                                );
                                if (exactMatch) {
                                    e.preventDefault(); // Prevent default Tab behavior
                                    e.stopPropagation(); // Stop event bubbling

                                    // Add the service first
                                    toggleService(exactMatch.name);
                                    setQuery('');
                                    setOpen(false);

                                    // Navigate to next row
                                    navigateToNextRow(
                                        e.target as HTMLInputElement,
                                    );
                                } else {
                                    // No exact match found - prevent Tab and show message to use Enter or Add button
                                    e.preventDefault(); // Prevent default Tab behavior
                                    e.stopPropagation(); // Stop event bubbling
                                    console.log(
                                        'Tab blocked: Please press Enter or click Add button to create new service, or change the value',
                                    );
                                    // Keep focus on current field
                                }
                            } else if (e.key === 'Escape') {
                                setOpen(false);
                                setQuery('');
                            }
                        }}
                        className={`w-32 text-left px-1 py-0.5 text-[12px] rounded border ${
                            isError
                                ? 'border-red-500 bg-red-50 ring-2 ring-red-200'
                                : 'border-blue-300 bg-white hover:bg-slate-50'
                        } focus:outline-none focus:ring-2 ${
                            isError
                                ? 'focus:ring-red-200 focus:border-red-500'
                                : 'focus:ring-blue-200 focus:border-blue-500'
                        } transition-colors`}
                        placeholder=''
                    />
                ) : (
                    /* Show "Add more" button when services are selected and not actively typing */
                    <button
                        onClick={() => {
                            setOpen(true);
                            setQuery('');
                            setShowMoreServices(false); // Close the more services dropdown
                            // Focus the input field when "Add more" is clicked
                            setTimeout(() => {
                                inputRef.current?.focus();
                            }, 10);
                        }}
                        className={`w-full text-left px-2 py-1 text-[12px] rounded border ${
                            isError
                                ? 'border-red-500 bg-red-50 ring-2 ring-red-200'
                                : 'border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100'
                        } transition-colors ${
                            isError
                                ? 'text-red-700 hover:bg-red-100'
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        + Add more
                    </button>
                )}
            </div>

            {open &&
                dropdownPos &&
                createPortal(
                    <div
                        ref={dropdownRef}
                        className='rounded-xl border border-slate-200 bg-white shadow-2xl max-h-60'
                        onMouseDown={(e: any) => e.stopPropagation()}
                        onClick={(e: any) => e.stopPropagation()}
                        style={{
                            position: 'fixed',
                            top: dropdownPos.top,
                            left: dropdownPos.left,
                            width: dropdownPos.width,
                            maxWidth: '300px',
                        }}
                    >
                        <div className='absolute -top-2 left-6 h-3 w-3 rotate-45 bg-white border-t border-l border-slate-200'></div>
                        <div className='py-1 text-[12px] px-3 space-y-2'>
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
                                                query.toLowerCase().trim(),
                                        );

                                    const showAddNew =
                                        query.trim() && !hasExactMatch;

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
                                                    <Plus size={12} />
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
                                            selectedPhones.includes(opt.name);
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
                                                type='template'
                                                isInUse={isPhoneInUse(opt.name)}
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
                                                            selectedPhones.includes(
                                                                opt.name,
                                                            )
                                                        ) {
                                                            const updatedServices =
                                                                selectedPhones.map(
                                                                    (
                                                                        s: string,
                                                                    ) =>
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
                                                                'phones',
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
                                                            selectedPhones.includes(
                                                                opt.name,
                                                            )
                                                        ) {
                                                            const updatedServices =
                                                                selectedPhones.filter(
                                                                    (
                                                                        s: string,
                                                                    ) =>
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
                                                                'phones',
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
                        {/* Only show bottom Add button when dropdown is open but no query is typed */}
                        {!query.trim() && (
                            <div className='border-t border-slate-200 px-3 py-2'>
                                <button
                                    onClick={() => {
                                        setAdding('');
                                        setShowAdder(true);
                                    }}
                                    className='group w-full text-left text-[12px] text-slate-700 hover:text-slate-900 flex items-center gap-2'
                                >
                                    <Plus size={14} />
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
                                                            onChange={(
                                                                e: any,
                                                            ) =>
                                                                setAdding(
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            onKeyDown={(
                                                                e: any,
                                                            ) => {
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
                                                            placeholder=''
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
                                                                ⚠️ Similar
                                                                service exists:
                                                            </span>{' '}
                                                            &quot;
                                                            {similarMatch.name}
                                                            &quot;
                                                            <br />
                                                            <span className='text-amber-600'>
                                                                Click &quot;Add
                                                                Existing&quot;
                                                                to select it
                                                                instead of
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
                        )}
                    </div>,
                    document.body,
                )}
        </div>
    );
}

// Simple chip input component without dropdown functionality
function SimpleChipInput({
    value,
    onChange,
    placeholder = '',
    isError = false,
    onTabNext,
    onTabPrev,
}: {
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    isError?: boolean;
    onTabNext?: () => void;
    onTabPrev?: () => void;
}) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value || '');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!editing) setDraft(value || '');
    }, [value, editing]);

    useEffect(() => {
        if (editing) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [editing]);

    const commit = () => {
        const trimmed = draft.trim();
        if (trimmed !== (value || '')) {
            onChange(trimmed);
        }
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
                type='text'
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Tab') {
                        e.preventDefault();
                        commit();
                        if (e.key === 'Tab' && e.shiftKey) {
                            onTabPrev && onTabPrev();
                        } else {
                            onTabNext && onTabNext();
                        }
                    } else if (e.key === 'Escape') {
                        cancel();
                    }
                }}
                onBlur={commit}
                placeholder={placeholder}
                className={`min-w-0 w-full rounded-sm border ${
                    isError
                        ? 'border-red-500 bg-red-50 ring-2 ring-red-200'
                        : 'border-blue-300 bg-white'
                } px-1 py-1 text-[12px] focus:outline-none focus:ring-2 ${
                    isError
                        ? 'focus:ring-red-200 focus:border-red-500'
                        : 'focus:ring-blue-200 focus:border-blue-500'
                }`}
            />
        );
    }

    const isEmpty = !value || value.length === 0;
    const displayValue = value || '';

    if (isEmpty) {
        return (
            <div
                className='w-full flex items-center bg-white border border-blue-300 rounded-sm px-2 py-1 hover:bg-slate-50 hover:border-blue-400 transition-all duration-150 cursor-text min-h-[28px]'
                onDoubleClick={() => setEditing(true)}
                title='Double-click to enter value'
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        setEditing(true);
                    }
                }}
            >
                <span className='text-[12px] text-slate-300 leading-[14px]'>
                    {placeholder || ''}
                </span>
            </div>
        );
    }

    // Display the same as Enterprise Config table - simple span with hover effects
    return (
        <span
            className='group/ie inline-flex min-w-0 items-center truncate rounded-sm px-1 -mx-1 -my-0.5 hover:ring-1 hover:ring-slate-300 hover:bg-white/60 cursor-text'
            onDoubleClick={() => setEditing(true)}
            title='Double-click to edit'
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    setEditing(true);
                }
            }}
        >
            {displayValue}
        </span>
    );
}

function AsyncChipSelect({
    type,
    value,
    onChange,
    placeholder,
    isError = false,
    compact,
    onDropdownOptionUpdate,
    onNewItemCreated,
    accounts = [],
    currentRowId,
    currentRowEnterprise,
    currentRowProduct,
    dropdownOptions,
    onTabNext,
    onTabPrev,
    disabled = false,
}: {
    type: CatalogType;
    value?: string;
    onChange: (next?: string) => void;
    placeholder?: string;
    isError?: boolean;
    compact?: boolean;
    disabled?: boolean;
    onDropdownOptionUpdate?: (
        type:
            | 'accountNames'
            | 'masterAccounts'
            | 'cloudTypes'
            | 'addresses'
            | 'emails'
            | 'phones',
        action: 'update' | 'delete',
        oldName: string,
        newName?: string,
    ) => Promise<void>;
    onNewItemCreated?: (
        type:
            | 'accountNames'
            | 'masterAccounts'
            | 'cloudTypes'
            | 'addresses'
            | 'emails'
            | 'phones',
        item: {id: string; name: string},
    ) => void;
    accounts?: AccountRow[];
    currentRowId?: string;
    currentRowEnterprise?: string;
    currentRowProduct?: string;
    dropdownOptions?: {
        accountNames: Array<{id: string; name: string}>;
        cloudTypes: Array<{id: string; name: string}>;
        addresses: Array<{id: string; name: string}>;
    };
    onTabNext?: () => void;
    onTabPrev?: () => void;
}) {
    const [open, setOpen] = React.useState(false);

    // Debug wrapper for setOpen to track all state changes
    const [current, setCurrent] = React.useState<string | undefined>(value);
    const [query, setQuery] = React.useState('');
    const [options, setOptions] = React.useState<{id: string; name: string}[]>(
        [],
    );
    const [allOptions, setAllOptions] = React.useState<
        {id: string; name: string}[]
    >([]);
    const [loading, setLoading] = React.useState(false);
    const [adding, setAdding] = React.useState('');
    const [showAdder, setShowAdder] = React.useState(false);
    const [reopening, setReopening] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const blurTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
    const preventBlurRef = React.useRef(false);
    const documentClickHandlerRef = React.useRef(false); // Prevent rapid successive document clicks

    // Cleanup blur timeout on unmount
    React.useEffect(() => {
        return () => {
            if (blurTimeoutRef.current) {
                clearTimeout(blurTimeoutRef.current);
            }
            // Also cleanup reopening state
            setReopening(false);
        };
    }, []);

    // Debug: Log all state changes
    React.useEffect(() => {
        console.log(
            `🐛 [${type}] State changed - open: ${open}, reopening: ${reopening}, current: "${current}", query: "${query}"`,
        );
    }, [open, reopening, current, query, type]);

    // Check if this is a static enterprise field (should use the selected enterprise from top-right)
    const displayValue = React.useMemo(
        () => current || value,
        [current, value],
    );

    // Synchronize current state with value prop changes
    React.useEffect(() => {
        if (value !== current) {
            console.log(
                `🔄 VALUE SYNC for ${type}: "${current}" -> "${value}"`,
            );
            setCurrent(value);
        }
    }, [value, type]); // Remove current from deps to avoid infinite loops

    // Helper function to check if an option is in use (with composite key constraint)
    const isOptionInUse = React.useCallback(
        (optionName: string): boolean => {
            if (!accounts || accounts.length === 0) return false;

            return accounts.some((account) => {
                // Skip the current row being edited
                if (currentRowId && account.id === currentRowId) {
                    return false;
                }

                if (type === 'accountName') {
                    // Never filter account names - show all options
                    return false;
                } else if (type === 'address') {
                    // For addresses, show all options (no filtering needed)
                    return false;
                }
                return false;
            });
        },
        [accounts, type, currentRowId],
    );

    const containerRef = React.useRef<HTMLDivElement>(null);
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    // Simple dropdown positioning - let browser handle it naturally
    const [dropdownPosition, setDropdownPosition] = React.useState<
        'below' | 'above'
    >('below');
    const [dropdownPortalPos, setDropdownPortalPos] = React.useState<{
        top: number;
        left: number;
        width: number;
        height?: number;
        arrowOffset?: number;
    } | null>(null);

    // Simple positioning function - just set basic position below field
    const calculateDropdownPosition = React.useCallback(() => {
        if (!containerRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();

        // Always position below field - let browser handle viewport constraints
        setDropdownPosition('below');

        // Simple positioning - just below the field
        const top = containerRect.bottom + 2;
        const left = containerRect.left;
        const width = Math.max(200, containerRect.width);
        const arrowOffset = 20;

        setDropdownPortalPos({top, left, width, arrowOffset});
    }, [type]);

    // Calculate position when dropdown opens
    React.useEffect(() => {
        if (open) {
            calculateDropdownPosition();

            // Debounced reposition handler to prevent flickering
            let repositionTimeout: NodeJS.Timeout;
            const debouncedReposition = () => {
                clearTimeout(repositionTimeout);
                repositionTimeout = setTimeout(() => {
                    calculateDropdownPosition();
                }, 50); // 50ms debounce
            };

            window.addEventListener('scroll', debouncedReposition, true);
            window.addEventListener('resize', debouncedReposition);
            return () => {
                clearTimeout(repositionTimeout);
                window.removeEventListener('scroll', debouncedReposition, true);
                window.removeEventListener('resize', debouncedReposition);
            };
        }
    }, [open, calculateDropdownPosition]);

    // Separate function to load all options (called once when dropdown opens)
    const loadAllOptions = React.useCallback(async () => {
        setLoading(true);
        try {
            let allData: Array<{id: string; name: string}> = [];

            console.log(`Loading options for type: ${type}`);

            // Use dropdownOptions if available for accountName
            if (type === 'accountName' && dropdownOptions?.accountNames) {
                allData = dropdownOptions.accountNames;
            } else if (type === 'address' && dropdownOptions?.addresses) {
                allData = dropdownOptions.addresses;
            } else if (type === 'template' && dropdownOptions?.accountNames) {
                // For template type, use the provided accountNames dropdown options (which contain enterprises, products, or services)
                allData = dropdownOptions.accountNames;
            } else if (type === 'cloudType') {
                // Always use predefined cloudType options (prioritize dropdownOptions)
                if (
                    dropdownOptions?.cloudTypes &&
                    dropdownOptions.cloudTypes.length > 0
                ) {
                    allData = dropdownOptions.cloudTypes;
                } else {
                    allData = [
                        {id: 'private-cloud', name: 'Private Cloud'},
                        {id: 'public-cloud', name: 'Public Cloud'},
                    ];
                }
            } else if (type === 'masterAccount') {
                allData =
                    (await api.get<Array<{id: string; name: string}>>(
                        '/api/masterAccounts',
                    )) || [];
            } else if (type === 'address') {
                allData =
                    (await api.get<Array<{id: string; name: string}>>(
                        '/api/addresses',
                    )) || [];
            } else if (type === 'template') {
                allData =
                    (await api.get<Array<{id: string; name: string}>>(
                        '/api/templates',
                    )) || [];
            } else if (type === 'enterprise') {
                allData =
                    (await api.get<Array<{id: string; name: string}>>(
                        '/api/enterprises',
                    )) || [];
            } else if (type === 'product') {
                // Filter products based on selected enterprise
                if (currentRowEnterprise) {
                    console.log(
                        `🔍 Filtering products for enterprise: ${currentRowEnterprise}`,
                    );

                    // Get enterprise configuration data to find products for this enterprise
                    try {
                        const enterpriseConfigs =
                            (await api.get<
                                Array<{
                                    enterprise: {name: string};
                                    product: {name: string};
                                    services: Array<{name: string}>;
                                }>
                            >('/api/enterprise-products-services')) || [];

                        // Extract unique product names for the selected enterprise
                        const uniqueProducts = Array.from(
                            new Set(
                                enterpriseConfigs
                                    .filter(
                                        (config) =>
                                            config.enterprise.name ===
                                            currentRowEnterprise,
                                    )
                                    .map((config) => config.product.name)
                                    .filter(
                                        (product) =>
                                            product && product.trim() !== '',
                                    ),
                            ),
                        );

                        // Convert to the expected format
                        allData = uniqueProducts.map((product, index) => ({
                            id: `product-${index}`,
                            name: product,
                        }));

                        console.log(
                            `📊 Found ${allData.length} products for enterprise "${currentRowEnterprise}":`,
                            allData.map((p) => p.name),
                        );
                    } catch (error) {
                        console.error(
                            'Failed to load enterprise configs:',
                            error,
                        );
                        // Fallback to all products if API fails
                        allData =
                            (await api.get<Array<{id: string; name: string}>>(
                                '/api/products',
                            )) || [];
                    }
                } else {
                    // No enterprise selected, show all products
                    allData =
                        (await api.get<Array<{id: string; name: string}>>(
                            '/api/products',
                        )) || [];
                }
            } else if (type === 'service') {
                // Filter services based on selected enterprise and product
                if (currentRowEnterprise && currentRowProduct) {
                    console.log(
                        `🔍 Filtering services for enterprise: ${currentRowEnterprise}, product: ${currentRowProduct}`,
                    );

                    // Get enterprise configuration data to find services for this enterprise+product combination
                    try {
                        const enterpriseConfigs =
                            (await api.get<
                                Array<{
                                    enterprise: {name: string};
                                    product: {name: string};
                                    services: Array<{name: string}>;
                                }>
                            >('/api/enterprise-products-services')) || [];

                        // Extract unique service names for the selected enterprise+product combination
                        const uniqueServices = Array.from(
                            new Set(
                                enterpriseConfigs
                                    .filter(
                                        (config) =>
                                            config.enterprise.name ===
                                                currentRowEnterprise &&
                                            config.product.name ===
                                                currentRowProduct,
                                    )
                                    .flatMap((config) =>
                                        config.services.map(
                                            (service) => service.name,
                                        ),
                                    )
                                    .filter(
                                        (service) =>
                                            service && service.trim() !== '',
                                    ),
                            ),
                        );

                        // Convert to the expected format
                        allData = uniqueServices.map((service, index) => ({
                            id: `service-${index}`,
                            name: service,
                        }));

                        console.log(
                            `📊 Found ${allData.length} services for enterprise "${currentRowEnterprise}" + product "${currentRowProduct}":`,
                            allData.map((s) => s.name),
                        );
                    } catch (error) {
                        console.error(
                            'Failed to load enterprise configs:',
                            error,
                        );
                        // Fallback to all services if API fails
                        allData =
                            (await api.get<Array<{id: string; name: string}>>(
                                '/api/services',
                            )) || [];
                    }
                } else {
                    // No enterprise+product selected, show all services
                    allData =
                        (await api.get<Array<{id: string; name: string}>>(
                            '/api/services',
                        )) || [];
                }
            } else {
                allData =
                    (await api.get<Array<{id: string; name: string}>>(
                        '/api/accountNames',
                    )) || [];
            }

            // Ensure allData is always an array before setting
            setAllOptions(Array.isArray(allData) ? allData : []);
        } catch (error) {
            console.error(`Error loading options for ${type}:`, error);
            setAllOptions([]);
        } finally {
            setLoading(false);
        }
    }, [type, dropdownOptions, currentRowEnterprise, currentRowProduct]);

    // Function to filter options based on current query and other criteria
    const filterOptions = React.useCallback(() => {
        // Ensure allOptions is an array before filtering
        const safeOptions = Array.isArray(allOptions) ? allOptions : [];
        if (safeOptions.length === 0) return;

        let filtered = safeOptions;

        // Apply search filter
        if (query) {
            const queryLower = query.toLowerCase();
            filtered = filtered.filter(
                (opt) =>
                    opt?.name?.toLowerCase?.()?.startsWith?.(queryLower) ??
                    false,
            );

            // Sort filtered results: exact matches first, then alphabetical
            filtered = filtered.sort((a, b) => {
                const aLower = a?.name?.toLowerCase?.() || '';
                const bLower = b?.name?.toLowerCase?.() || '';

                // Exact match comes first
                if (aLower === queryLower && bLower !== queryLower) return -1;
                if (bLower === queryLower && aLower !== queryLower) return 1;

                // Otherwise alphabetical order
                return aLower.localeCompare(bLower);
            });
        }

        // Apply usage filter - no filtering needed for accountName or address
        setOptions(filtered);
    }, [allOptions, query]);

    // Filter options when query or allOptions change
    React.useEffect(() => {
        filterOptions();
    }, [filterOptions]);

    // Load options when dropdown opens
    React.useEffect(() => {
        console.log(
            `🔍 AsyncChipSelect useEffect: type=${type}, open=${open}, allOptions.length=${allOptions.length}`,
        );
        if (open && allOptions.length === 0) {
            console.log(`📞 Triggering loadAllOptions for type: ${type}`);
            loadAllOptions();
        }
    }, [open, allOptions.length, loadAllOptions]);

    // Load cloudType options immediately on mount since they're predefined
    React.useEffect(() => {
        if (type === 'cloudType' && allOptions.length === 0) {
            loadAllOptions();
        }
    }, [type, allOptions.length, loadAllOptions]);

    // Handle cascading dropdown validation - clear field if current value is no longer valid
    React.useEffect(() => {
        if (allOptions.length > 0 && current) {
            const isCurrentValueValid = allOptions.some(
                (option) => option.name === current,
            );
            if (!isCurrentValueValid) {
                console.log(
                    `🚫 Current value "${current}" is no longer valid for ${type}, clearing field`,
                );
                setCurrent(undefined);
                onChange(undefined);
            }
        }
    }, [allOptions, current, type, onChange]);

    // Reload options when enterprise or product selection changes for cascading dropdowns
    React.useEffect(() => {
        if (type === 'product' || type === 'service') {
            // Reset options to trigger reload
            setAllOptions([]);
        }
    }, [currentRowEnterprise, currentRowProduct, type]);

    // Remove unused effect for email filtering
    // React.useEffect was here for email/account filtering - no longer needed

    React.useEffect(() => {
        const onDoc = (e: MouseEvent) => {
            // Prevent rapid successive calls
            if (documentClickHandlerRef.current) return;
            documentClickHandlerRef.current = true;

            // Reset the guard after a brief delay
            setTimeout(() => {
                documentClickHandlerRef.current = false;
            }, 10);

            const target = e.target as Node;
            const withinAnchor = !!containerRef.current?.contains(target);
            const withinDropdown = !!dropdownRef.current?.contains(target);
            if (!withinAnchor && !withinDropdown) {
                setOpen((prev) => {
                    return prev ? false : prev;
                });
                setShowAdder(false);
                setAdding('');
            }
        };
        document.addEventListener('click', onDoc, true);
        return () => document.removeEventListener('click', onDoc, true);
    }, []); // No dependencies to prevent re-attachment

    const addNew = async () => {
        const name = (adding || query || '').trim();
        if (!name) return;

        // Check for existing entries (case-insensitive)
        const existingMatch = allOptions.find(
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
            if (type === 'masterAccount') {
                created = await api.post<{id: string; name: string}>(
                    '/api/masterAccounts',
                    {name},
                );
            } else if (type === 'cloudType') {
                // Cloud Type has predefined options, don't create new ones
                console.log(
                    'Cannot create new cloudType options - using predefined values only',
                );
                return;
            } else if (type === 'address') {
                created = await api.post<{id: string; name: string}>(
                    '/api/addresses',
                    {name},
                );
            } else if (type === 'template') {
                created = await api.post<{id: string; name: string}>(
                    '/api/templates',
                    {name},
                );
            } else {
                created = await api.post<{id: string; name: string}>(
                    '/api/accountNames',
                    {name},
                );
            }
            if (created) {
                // Inject newly created into the current dropdown list and select it
                setOptions((prev) => {
                    const exists = prev.some((o) => o.id === created!.id);
                    return exists ? prev : [...prev, created!];
                });
                // Also add to allOptions for future exact match checking
                setAllOptions((prev) => {
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
                    let dropdownType: string;

                    switch (type) {
                        case 'accountName':
                            dropdownType = 'accountNames';
                            break;
                        case 'masterAccount':
                            dropdownType = 'masterAccounts';
                            break;
                        case 'address':
                            dropdownType = 'addresses';
                            break;
                        default:
                            dropdownType = 'emails'; // fallback
                            break;
                    }

                    // Only call if this is a supported type for the callback
                    if (
                        type === 'accountName' ||
                        type === 'masterAccount' ||
                        type === 'address'
                    ) {
                        onNewItemCreated(dropdownType as any, created);
                    }
                }
            }
        } catch (error: any) {
            console.error(`Failed to create ${type}:`, error);
            // Handle duplicate error from backend
            if (
                error?.message?.includes('already exists') ||
                error?.message?.includes('duplicate')
            ) {
                // Try to find the existing item and select it
                const existingItem = allOptions.find(
                    (opt) => opt.name.toLowerCase() === name.toLowerCase(),
                );
                if (existingItem) {
                    onChange(existingItem.name);
                    setOpen(false);
                }
            }
        } finally {
            setShowAdder(false);
            setAdding('');
            setQuery('');
        }
    };

    React.useEffect(() => {
        setCurrent(value);
    }, [value, onChange]);

    // Debug logging for cloudType
    React.useEffect(() => {
        if (type === 'cloudType') {
            console.log(
                `CloudType AsyncChipSelect render - allOptions.length: ${allOptions.length}`,
                allOptions,
            );
        }
    }, [type, allOptions]);

    const sizeClass = compact ? 'text-[11px] py-0.5' : 'text-[12px] py-1';

    // Debug display logic
    const shouldShowChip = current?.trim() || value?.trim();
    const shouldShowInput = !shouldShowChip || open;

    if (type === 'enterprise' || type === 'product' || type === 'service') {
        console.log(
            `🎨 DISPLAY for ${type}: current="${current}", value="${value}", open=${open}, shouldShowChip=${shouldShowChip}, shouldShowInput=${shouldShowInput}`,
        );
    }

    return (
        <div
            ref={containerRef}
            className='relative min-w-0 flex items-center gap-1 group/item'
            style={{maxWidth: '100%'}}
        >
            <div
                className='relative w-full flex items-center gap-1'
                style={{width: '100%'}}
            >
                {/* Show selected value as chip when there's a non-empty value and not actively typing */}
                {shouldShowChip && !open && (
                    <motion.span
                        ref={inputRef} // Use the same ref so our focus logic works (like EnterpriseConfigTable)
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
                        className={`w-full inline-flex items-center gap-1 px-2 py-1 text-[11px] leading-[14px] rounded-sm relative focus:outline-none ${
                            disabled
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white text-black focus:ring-2 focus:ring-blue-200 focus:border-blue-500'
                        }`}
                        style={{width: '100%', minWidth: '100%'}}
                        title={
                            disabled
                                ? 'Field disabled'
                                : `Double-click to edit: ${current || value}`
                        }
                        tabIndex={disabled ? -1 : 0}
                        onFocus={(e) => {
                            console.log(
                                '🎯 Chip focused:',
                                type,
                                current || value,
                            );
                        }}
                        onBlur={(e) => {
                            console.log(
                                '🎯 Chip blurred:',
                                type,
                                current || value,
                            );
                        }}
                        onKeyDown={(e: any) => {
                            console.log(
                                '🎯 Chip keydown:',
                                e.key,
                                type,
                                current || value,
                            );
                            // Handle Tab navigation from the chip
                            if (e.key === 'Tab') {
                                e.preventDefault();
                                e.stopPropagation();
                                if (e.stopImmediatePropagation) {
                                    e.stopImmediatePropagation();
                                }

                                // Navigate to next field directly (like EnterpriseConfigTable)
                                const currentElement = e.target as HTMLElement;
                                const currentColDiv =
                                    currentElement.closest(
                                        '[data-license-col]',
                                    );
                                const currentLicenseId =
                                    currentColDiv?.getAttribute(
                                        'data-license-id',
                                    );

                                console.log('🎯 Tab from license chip:', {
                                    currentLicenseId,
                                    currentCol:
                                        currentColDiv?.getAttribute(
                                            'data-license-col',
                                        ),
                                    type,
                                });

                                if (currentLicenseId && currentColDiv) {
                                    const currentCol =
                                        currentColDiv.getAttribute(
                                            'data-license-col',
                                        );
                                    let targetCol = '';

                                    if (e.shiftKey) {
                                        // Shift+Tab: go to previous column
                                        if (currentCol === 'product') {
                                            targetCol = 'enterprise';
                                        } else if (currentCol === 'service') {
                                            targetCol = 'product';
                                        } else if (
                                            currentCol === 'licenseStartDate'
                                        ) {
                                            targetCol = 'service';
                                        } else if (
                                            currentCol === 'licenseEndDate'
                                        ) {
                                            targetCol = 'licenseStartDate';
                                        } else if (
                                            currentCol === 'numberOfUsers'
                                        ) {
                                            targetCol = 'licenseEndDate';
                                        } else if (
                                            currentCol === 'noticePeriodDays'
                                        ) {
                                            targetCol = 'numberOfUsers';
                                        }
                                    } else {
                                        // Tab: go to next column
                                        if (currentCol === 'enterprise') {
                                            targetCol = 'product';
                                        } else if (currentCol === 'product') {
                                            targetCol = 'service';
                                        } else if (currentCol === 'service') {
                                            targetCol = 'licenseStartDate';
                                        } else if (
                                            currentCol === 'licenseStartDate'
                                        ) {
                                            targetCol = 'licenseEndDate';
                                        } else if (
                                            currentCol === 'licenseEndDate'
                                        ) {
                                            targetCol = 'numberOfUsers';
                                        } else if (
                                            currentCol === 'numberOfUsers'
                                        ) {
                                            targetCol = 'noticePeriodDays';
                                        }
                                    }

                                    console.log(
                                        '🎯 Navigating from license chip to:',
                                        targetCol,
                                    );

                                    if (targetCol) {
                                        // Find the target column in the same license row
                                        const targetColDiv =
                                            document.querySelector(
                                                `[data-license-id="${currentLicenseId}"][data-license-col="${targetCol}"]`,
                                            );
                                        const targetInput =
                                            targetColDiv?.querySelector(
                                                'input',
                                            ) as HTMLInputElement;

                                        console.log(
                                            '🎯 Target input found:',
                                            !!targetInput,
                                        );

                                        if (targetInput) {
                                            targetInput.focus();
                                            targetInput.select();
                                            console.log(
                                                `🎯 ${targetCol} input focused from license chip`,
                                            );
                                        }
                                    }
                                }
                            } else if (e.key === 'Enter' || e.key === ' ') {
                                // Enter or Space opens the dropdown for editing
                                e.preventDefault();
                                setQuery(current || value || '');
                                setOpen(true);
                                setTimeout(() => {
                                    if (inputRef.current) {
                                        inputRef.current.focus();
                                        inputRef.current.select();
                                    }
                                }, 100);
                            }
                        }}
                        onDoubleClick={(e: any) => {
                            console.log(
                                `🖱️🖱️ Double-click on field: type=${type}, value=${
                                    current || value
                                }`,
                            );
                            const target = e.target as HTMLElement;
                            if (!target.closest('button')) {
                                // Always allow editing by setting the query and opening input
                                setQuery(current || value || '');
                                setOpen(true);
                                // Focus the input after opening
                                setTimeout(() => {
                                    if (inputRef.current) {
                                        inputRef.current.focus();
                                        inputRef.current.select(); // Select all text for easy editing
                                    }
                                }, 10);
                            }
                        }}
                        onMouseDown={(e: any) => {
                            console.log(
                                `🖱️ [${type}] CHIP MOUSEDOWN - disabled: ${disabled}`,
                            );
                            if (disabled) return;
                            // Prevent blur by preventing the mousedown default behavior
                            e.preventDefault();
                            console.log(
                                `🖱️ [${type}] Chip mousedown - preventDefault called`,
                            );
                        }}
                        onClick={(e: any) => {
                            console.log(
                                `🖱️ [${type}] CHIP CLICK - disabled: ${disabled}, open: ${open}, allOptions.length: ${allOptions.length}`,
                            );
                            if (disabled) return; // Don't handle clicks when disabled

                            // Set reopening state to prevent blur from closing dropdown
                            setReopening(true);
                            console.log(
                                `🔄 [${type}] Setting reopening state to TRUE`,
                            );

                            // Prevent any pending or immediate blur events
                            preventBlurRef.current = true;
                            console.log(
                                `🔄 [${type}] Setting preventBlurRef to TRUE`,
                            );

                            // Cancel any pending blur timeout
                            if (blurTimeoutRef.current) {
                                clearTimeout(blurTimeoutRef.current);
                                blurTimeoutRef.current = null;
                                console.log(
                                    `🚫 [${type}] Cancelled pending blur timeout`,
                                );
                            }

                            console.log(
                                `🖱️ [${type}] Processing chip click...`,
                            );
                            // For clickable fields (cloudType, enterprise, product, service, accountName, masterAccount), allow single click to open/edit
                            if (
                                (type === 'cloudType' ||
                                    type === 'enterprise' ||
                                    type === 'product' ||
                                    type === 'service' ||
                                    type === 'accountName' ||
                                    type === 'masterAccount') &&
                                (allOptions.length > 0 ||
                                    [
                                        'enterprise',
                                        'product',
                                        'service',
                                        'accountName',
                                        'masterAccount',
                                    ].includes(type))
                            ) {
                                const target = e.target as HTMLElement;
                                if (!target.closest('button')) {
                                    console.log(
                                        `🎯 [${type}] Opening input for editing from chip click`,
                                    );
                                    // For accountName and masterAccount, set the current value as the query so user can edit it
                                    if (
                                        type === 'accountName' ||
                                        type === 'masterAccount'
                                    ) {
                                        setQuery(current || value || '');
                                    } else {
                                        setQuery('');
                                    }
                                    setOpen(true);
                                    console.log(
                                        `🎯 [${type}] setOpen(true) called from chip click`,
                                    );

                                    // Clear reopening state after dropdown is opened
                                    setTimeout(() => {
                                        setReopening(false);
                                        console.log(
                                            `✅ [${type}] Cleared reopening state (set to FALSE)`,
                                        );
                                    }, 200);

                                    setTimeout(() => {
                                        if (inputRef.current) {
                                            inputRef.current.focus();
                                            // For accountName and masterAccount, select all text for easy editing
                                            if (
                                                type === 'accountName' ||
                                                type === 'masterAccount'
                                            ) {
                                                inputRef.current.select();
                                            }
                                            console.log(
                                                `🎯 [${type}] Input focused from chip click`,
                                            );
                                        }
                                    }, 10);
                                }
                            }
                        }}
                    >
                        <span className='flex-1 truncate pointer-events-none'>
                            {current || value}
                        </span>
                        {/* Dropdown arrow for cloudType */}
                        {type === 'cloudType' && (
                            <ChevronDown
                                size={12}
                                className='text-slate-400 flex-shrink-0 ml-1'
                            />
                        )}
                        {!disabled && (
                            <button
                                onClick={(e: any) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    setCurrent('');
                                    setQuery('');
                                    onChange('');
                                }}
                                className='hover:text-slate-900 opacity-0 group-hover/item:opacity-100 transition-opacity p-0.5 rounded-sm hover:bg-blue-100 flex-shrink-0'
                                aria-label='Remove'
                                style={{minWidth: '20px', minHeight: '20px'}}
                            >
                                <X size={12} />
                            </button>
                        )}
                    </motion.span>
                )}

                {/* Show input when no value selected or actively typing */}
                {shouldShowInput ? (
                    <div className='relative w-full'>
                        <input
                            ref={inputRef}
                            value={query}
                            disabled={disabled}
                            onChange={(e: any) => {
                                if (disabled) return; // Don't handle changes when disabled

                                const newValue = e.target.value;
                                setQuery(newValue);

                                // Only open dropdown when typing if there are options to show
                                if (allOptions.length > 0) {
                                    setOpen(true);
                                    console.log(
                                        `📝 [${type}] Opening dropdown from onChange - allOptions: ${allOptions.length}`,
                                    );
                                } // Don't load options if dropdown is disabled (empty options array)

                                // Clear current selection if user clears the input completely
                                if (newValue === '') {
                                    setCurrent('');
                                    onChange('');
                                }
                            }}
                            onBlur={(e: any) => {
                                console.log(
                                    `🔴 [${type}] BLUR EVENT - disabled: ${disabled}, preventBlur: ${preventBlurRef.current}, reopening: ${reopening}`,
                                );

                                if (disabled) {
                                    console.log(
                                        `🔴 [${type}] Blur ignored - field disabled`,
                                    );
                                    return; // Don't handle blur when disabled
                                }

                                // Check if we're preventing blur (when intentionally opening dropdown)
                                if (preventBlurRef.current || reopening) {
                                    console.log(
                                        `🚫 [${type}] Preventing blur - dropdown being opened intentionally (reopening: ${reopening})`,
                                    );
                                    preventBlurRef.current = false;
                                    return;
                                }

                                console.log(
                                    `🔵 [${type}] Blur proceeding - setting 150ms timeout`,
                                );
                                // Add small delay to prevent dropdown from closing immediately when clicking options
                                blurTimeoutRef.current = setTimeout(() => {
                                    // Double check reopening state before actually closing
                                    if (reopening) {
                                        console.log(
                                            `🚫 [${type}] Cancelling blur timeout - reopening in progress`,
                                        );
                                        return;
                                    }

                                    console.log(
                                        `🔵 [${type}] Blur timeout executing - query: "${query.trim()}"`,
                                    );

                                    // Create chip from entered text when focus is lost
                                    const newValue = query.trim();
                                    if (newValue) {
                                        console.log(
                                            `🔵 [${type}] Creating chip from query: "${newValue}"`,
                                        );
                                        setCurrent(newValue);
                                        onChange(newValue);
                                        setQuery('');
                                    }
                                    setOpen(false);
                                    console.log(
                                        `🔵 [${type}] Blur timeout executed - dropdown closed`,
                                    );
                                }, 150);
                            }}
                            onFocus={() => {
                                console.log(
                                    `🟢 [${type}] FOCUS EVENT - disabled: ${disabled}, reopening: ${reopening}, open: ${open}, allOptions.length: ${allOptions.length}`,
                                );

                                // Cancel any pending blur timeout
                                if (blurTimeoutRef.current) {
                                    clearTimeout(blurTimeoutRef.current);
                                    blurTimeoutRef.current = null;
                                    console.log(
                                        `🚫 [${type}] Cancelled pending blur timeout`,
                                    );
                                }

                                // Reset prevent blur flag for clean state
                                preventBlurRef.current = false;
                                console.log(
                                    `🟢 [${type}] Reset preventBlurRef to false`,
                                );

                                if (disabled) {
                                    console.log(
                                        `🚫 [${type}] Skipping focus - field is disabled`,
                                    );
                                    return; // Don't open dropdown when disabled
                                }

                                // For license fields (enterprise, product, service), open dropdown to trigger API loading
                                // For other fields, only open if there are already options to show
                                if (
                                    allOptions.length > 0 ||
                                    [
                                        'enterprise',
                                        'product',
                                        'service',
                                    ].includes(type)
                                ) {
                                    console.log(
                                        `🟢 [${type}] Condition met for opening dropdown - allOptions: ${
                                            allOptions.length
                                        }, isLicenseField: ${[
                                            'enterprise',
                                            'product',
                                            'service',
                                        ].includes(type)}`,
                                    );
                                    setOpen(true);
                                    console.log(
                                        `🟢 [${type}] setOpen(true) called`,
                                    );
                                } else {
                                    console.log(
                                        `🔍 [${type}] No options available, not opening dropdown - allOptions: ${allOptions.length}`,
                                    );
                                }
                            }}
                            onKeyDown={async (e: any) => {
                                if (e.key === 'Enter' || e.key === 'Tab') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (e.stopImmediatePropagation) {
                                        e.stopImmediatePropagation();
                                    }

                                    // Save current value immediately
                                    const newValue = query.trim();
                                    if (newValue) {
                                        setCurrent(newValue);
                                        onChange(newValue);
                                        setQuery('');
                                        setOpen(false);
                                    }

                                    // Direct navigation like EnterpriseConfigTable
                                    if (e.key === 'Tab') {
                                        const currentElement =
                                            e.target as HTMLElement;
                                        const currentColDiv =
                                            currentElement.closest(
                                                '[data-license-col]',
                                            );
                                        const currentLicenseId =
                                            currentColDiv?.getAttribute(
                                                'data-license-id',
                                            );

                                        if (currentLicenseId && currentColDiv) {
                                            // License field navigation
                                            const currentCol =
                                                currentColDiv.getAttribute(
                                                    'data-license-col',
                                                );
                                            let targetCol = '';

                                            if (e.shiftKey) {
                                                // Shift+Tab: go to previous column
                                                if (currentCol === 'product') {
                                                    targetCol = 'enterprise';
                                                } else if (
                                                    currentCol === 'service'
                                                ) {
                                                    targetCol = 'product';
                                                } else if (
                                                    currentCol ===
                                                    'licenseStartDate'
                                                ) {
                                                    targetCol = 'service';
                                                } else if (
                                                    currentCol ===
                                                    'licenseEndDate'
                                                ) {
                                                    targetCol =
                                                        'licenseStartDate';
                                                } else if (
                                                    currentCol ===
                                                    'numberOfUsers'
                                                ) {
                                                    targetCol =
                                                        'licenseEndDate';
                                                } else if (
                                                    currentCol ===
                                                    'noticePeriodDays'
                                                ) {
                                                    targetCol = 'numberOfUsers';
                                                }
                                            } else {
                                                // Tab: go to next column
                                                if (
                                                    currentCol === 'enterprise'
                                                ) {
                                                    targetCol = 'product';
                                                } else if (
                                                    currentCol === 'product'
                                                ) {
                                                    targetCol = 'service';
                                                } else if (
                                                    currentCol === 'service'
                                                ) {
                                                    targetCol =
                                                        'licenseStartDate';
                                                } else if (
                                                    currentCol ===
                                                    'licenseStartDate'
                                                ) {
                                                    targetCol =
                                                        'licenseEndDate';
                                                } else if (
                                                    currentCol ===
                                                    'licenseEndDate'
                                                ) {
                                                    targetCol = 'numberOfUsers';
                                                } else if (
                                                    currentCol ===
                                                    'numberOfUsers'
                                                ) {
                                                    targetCol =
                                                        'noticePeriodDays';
                                                }
                                            }

                                            if (targetCol) {
                                                // Find the target column in the same license row
                                                const targetColDiv =
                                                    document.querySelector(
                                                        `[data-license-id="${currentLicenseId}"][data-license-col="${targetCol}"]`,
                                                    );
                                                const targetInput =
                                                    targetColDiv?.querySelector(
                                                        'input',
                                                    ) as HTMLInputElement;

                                                if (targetInput) {
                                                    targetInput.focus();
                                                    targetInput.select();
                                                }
                                            }
                                        } else {
                                            // Main account row navigation - use provided navigation functions
                                            if (e.shiftKey && onTabPrev) {
                                                setTimeout(() => {
                                                    onTabPrev();
                                                }, 100);
                                            } else if (
                                                !e.shiftKey &&
                                                onTabNext
                                            ) {
                                                setTimeout(() => {
                                                    onTabNext();
                                                }, 100);
                                            }
                                        }
                                    } else if (e.key === 'Enter' && onTabNext) {
                                        // Enter still uses the provided navigation function
                                        setTimeout(() => {
                                            onTabNext();
                                        }, 100);
                                    }
                                } else if (e.key === 'Escape') {
                                    setOpen(false);
                                    setQuery('');
                                }
                            }}
                            className={`w-full text-left px-2 pr-8 ${sizeClass} rounded border ${
                                disabled
                                    ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : isError
                                    ? 'border-red-500 bg-red-50 ring-2 ring-red-200'
                                    : open
                                    ? 'border-blue-500 bg-white ring-2 ring-blue-200'
                                    : 'border-blue-300 bg-white hover:bg-slate-50'
                            } text-slate-700 placeholder:text-slate-300 focus:outline-none ${
                                disabled
                                    ? ''
                                    : 'focus:ring-2 ' +
                                      (isError
                                          ? 'focus:ring-red-200 focus:border-red-500'
                                          : 'focus:ring-blue-200 focus:border-blue-500')
                            }`}
                            placeholder=''
                        />
                        {/* Dropdown arrow for cloudType */}
                        {type === 'cloudType' && (
                            <button
                                type='button'
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (allOptions.length > 0) {
                                        setOpen(!open);
                                        if (!open && inputRef.current) {
                                            inputRef.current.focus();
                                        }
                                    } else {
                                        // Force load options
                                        loadAllOptions();
                                    }
                                }}
                                className='absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 z-10'
                            >
                                <ChevronDown size={14} />
                            </button>
                        )}
                    </div>
                ) : null}
            </div>

            {/* Full Autocomplete Dropdown - Portal Based */}
            {open &&
                dropdownPortalPos &&
                (allOptions.length > 0 ||
                    loading ||
                    ['enterprise', 'product', 'service'].includes(type)) &&
                (() => {
                    console.log(
                        `🔍 DROPDOWN RENDER: ${type} - options:${allOptions.length}, loading:${loading}, portalPos:`,
                        dropdownPortalPos,
                    );

                    // Use fixed height for simplicity
                    const maxHeight = 240;

                    return createPortal(
                        <div
                            ref={dropdownRef}
                            className='rounded-xl border border-slate-200 bg-white shadow-2xl'
                            style={{
                                position: 'fixed',
                                top: `${dropdownPortalPos.top}px`,
                                left: `${dropdownPortalPos.left}px`,
                                width: 'max-content',
                                minWidth: `${dropdownPortalPos.width}px`,
                                maxWidth: '500px',
                                maxHeight: `${maxHeight}px`,
                                zIndex: 9999,
                            }}
                            onMouseDown={(e: any) => {
                                // Prevent blur when clicking in dropdown area
                                preventBlurRef.current = true;
                                console.log(
                                    `🖱️ Dropdown mousedown - preventing blur for ${type}`,
                                );

                                // Allow button clicks but prevent closing the dropdown
                                const target = e.target as HTMLElement;
                                if (!target.closest('button')) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }

                                // Reset prevent blur after a short delay
                                setTimeout(() => {
                                    preventBlurRef.current = false;
                                }, 100);
                            }}
                        >
                            {/* Simple pointer - always points up into field */}
                            <div
                                className='absolute -top-2 h-3 w-3 rotate-45 bg-white border-t border-l border-slate-200'
                                style={{
                                    left: `${
                                        dropdownPortalPos.arrowOffset || 20
                                    }px`,
                                }}
                            ></div>
                            <div className='relative z-10'>
                                <div
                                    className='py-1 text-[12px] px-3 space-y-2 overflow-y-auto'
                                    style={{maxHeight: `${maxHeight - 40}px`}} // Subtract padding/borders
                                >
                                    {loading ? (
                                        <div className='px-3 py-2 text-slate-500'>
                                            Loading…
                                        </div>
                                    ) : (
                                        (() => {
                                            // Filter options that match the query (show all if no query)
                                            const filteredOptions = query.trim()
                                                ? options
                                                      .filter(
                                                          (opt) =>
                                                              opt.name
                                                                  .toLowerCase()
                                                                  .startsWith(
                                                                      query.toLowerCase(),
                                                                  ) ||
                                                              opt.name
                                                                  .toLowerCase()
                                                                  .includes(
                                                                      query.toLowerCase(),
                                                                  ),
                                                      )
                                                      .sort((a, b) => {
                                                          const aLower =
                                                              a.name.toLowerCase();
                                                          const bLower =
                                                              b.name.toLowerCase();
                                                          const queryLower =
                                                              query.toLowerCase();

                                                          // Prioritize starts with matches
                                                          const aStartsWith =
                                                              aLower.startsWith(
                                                                  queryLower,
                                                              );
                                                          const bStartsWith =
                                                              bLower.startsWith(
                                                                  queryLower,
                                                              );

                                                          if (
                                                              aStartsWith &&
                                                              !bStartsWith
                                                          )
                                                              return -1;
                                                          if (
                                                              bStartsWith &&
                                                              !aStartsWith
                                                          )
                                                              return 1;

                                                          return aLower.localeCompare(
                                                              bLower,
                                                          );
                                                      })
                                                : options.slice(0, 50); // Show first 50 options if no query to avoid performance issues

                                            // Check if query exactly matches an existing option
                                            const exactMatch = query.trim()
                                                ? options.find(
                                                      (opt) =>
                                                          opt.name.toLowerCase() ===
                                                          query
                                                              .toLowerCase()
                                                              .trim(),
                                                  )
                                                : null;

                                            const showCreateNew =
                                                query.trim() &&
                                                !exactMatch &&
                                                type !== 'enterprise' &&
                                                type !== 'product' &&
                                                type !== 'service';

                                            return (
                                                <div>
                                                    {/* Show existing matching options */}
                                                    {filteredOptions.length >
                                                        0 && (
                                                        <div>
                                                            {filteredOptions.map(
                                                                (opt, idx) => {
                                                                    const palette =
                                                                        [
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
                                                                        palette[
                                                                            idx %
                                                                                palette.length
                                                                        ];

                                                                    return (
                                                                        <motion.div
                                                                            key={
                                                                                opt.id
                                                                            }
                                                                            initial={{
                                                                                scale: 0.98,
                                                                                opacity: 0,
                                                                            }}
                                                                            animate={{
                                                                                scale: 1,
                                                                                opacity: 1,
                                                                            }}
                                                                            whileHover={{
                                                                                scale: 1.02,
                                                                                y: -1,
                                                                            }}
                                                                            transition={{
                                                                                type: 'spring',
                                                                                stiffness: 400,
                                                                                damping: 25,
                                                                            }}
                                                                            className='relative group'
                                                                        >
                                                                            <button
                                                                                onMouseDown={(
                                                                                    e,
                                                                                ) => {
                                                                                    console.log(
                                                                                        `🖱️ Button mousedown: ${type} - "${opt.name}"`,
                                                                                    );
                                                                                    e.preventDefault();
                                                                                    e.stopPropagation();
                                                                                }}
                                                                                onClick={(
                                                                                    e,
                                                                                ) => {
                                                                                    console.log(
                                                                                        `🎯 SELECTION CLICK: ${type} - Selecting "${opt.name}" for license`,
                                                                                    );
                                                                                    e.preventDefault();
                                                                                    e.stopPropagation();

                                                                                    // Update local state immediately for instant UI feedback
                                                                                    setCurrent(
                                                                                        opt.name,
                                                                                    );
                                                                                    setQuery(
                                                                                        '',
                                                                                    );
                                                                                    setOpen(
                                                                                        false,
                                                                                    );

                                                                                    // Call parent onChange
                                                                                    try {
                                                                                        const success =
                                                                                            onChange(
                                                                                                opt.name,
                                                                                            );
                                                                                        console.log(
                                                                                            `✅ SELECTION SUCCESS: onChange called for ${type}, result:`,
                                                                                            success,
                                                                                        );

                                                                                        // After selection, focus the chip so Tab navigation works
                                                                                        setTimeout(
                                                                                            () => {
                                                                                                try {
                                                                                                    // Use currentRowId and type to find the specific chip that was just created
                                                                                                    let licenseId =
                                                                                                        '';
                                                                                                    if (
                                                                                                        currentRowId
                                                                                                    ) {
                                                                                                        licenseId =
                                                                                                            currentRowId;
                                                                                                    }

                                                                                                    const chipSelector = `[data-license-id="${licenseId}"][data-license-col="${type}"] span[tabindex="0"]`;
                                                                                                    const chipElement =
                                                                                                        document.querySelector(
                                                                                                            chipSelector,
                                                                                                        ) as HTMLElement;
                                                                                                    if (
                                                                                                        chipElement
                                                                                                    ) {
                                                                                                        console.log(
                                                                                                            `🎯 Auto-focusing chip after selection: ${type} for license ${licenseId}`,
                                                                                                        );
                                                                                                        chipElement.focus();
                                                                                                    } else {
                                                                                                        console.log(
                                                                                                            `🔍 Chip not found with selector: ${chipSelector}`,
                                                                                                        );
                                                                                                        // Fallback: try to find any chip in the license container
                                                                                                        const containerSelector = `[data-license-id="${licenseId}"][data-license-col="${type}"]`;
                                                                                                        const container =
                                                                                                            document.querySelector(
                                                                                                                containerSelector,
                                                                                                            );
                                                                                                        if (
                                                                                                            container
                                                                                                        ) {
                                                                                                            const fallbackChip =
                                                                                                                container.querySelector(
                                                                                                                    'span[tabindex="0"]',
                                                                                                                ) as HTMLElement;
                                                                                                            if (
                                                                                                                fallbackChip
                                                                                                            ) {
                                                                                                                console.log(
                                                                                                                    `🎯 Fallback focus successful for ${type}`,
                                                                                                                );
                                                                                                                fallbackChip.focus();
                                                                                                            }
                                                                                                        }
                                                                                                    }
                                                                                                } catch (error) {
                                                                                                    console.log(
                                                                                                        '🔍 Chip focus failed:',
                                                                                                        error,
                                                                                                    );
                                                                                                }
                                                                                            },
                                                                                            150,
                                                                                        );
                                                                                    } catch (error) {
                                                                                        console.error(
                                                                                            `❌ SELECTION ERROR: onChange failed for ${type}:`,
                                                                                            error,
                                                                                        );
                                                                                    }
                                                                                }}
                                                                                className={`w-full rounded-lg px-3 py-2.5 ${tone.bg} ${tone.hover} ${tone.text} transition-all duration-200 text-left font-medium shadow-sm hover:shadow-md relative overflow-visible flex items-center justify-between`}
                                                                                style={{
                                                                                    wordBreak:
                                                                                        'keep-all',
                                                                                    whiteSpace:
                                                                                        'nowrap',
                                                                                }}
                                                                            >
                                                                                <span className='relative z-10 flex-1'>
                                                                                    {
                                                                                        opt.name
                                                                                    }
                                                                                </span>
                                                                                {/* Show trash icon for non-enterprise/product/service types only */}
                                                                                {type !==
                                                                                    'enterprise' &&
                                                                                    type !==
                                                                                        'product' &&
                                                                                    type !==
                                                                                        'service' && (
                                                                                        <button
                                                                                            onClick={async (
                                                                                                e,
                                                                                            ) => {
                                                                                                e.stopPropagation();
                                                                                                e.preventDefault();

                                                                                                if (
                                                                                                    confirm(
                                                                                                        `Are you sure you want to delete "${opt.name}"? This action cannot be undone.`,
                                                                                                    )
                                                                                                ) {
                                                                                                    try {
                                                                                                        const endpoint =
                                                                                                            type ===
                                                                                                            'accountName'
                                                                                                                ? '/api/accountNames'
                                                                                                                : type ===
                                                                                                                  'masterAccount'
                                                                                                                ? '/api/masterAccounts'
                                                                                                                : type ===
                                                                                                                  'address'
                                                                                                                ? '/api/addresses'
                                                                                                                : '/api/templates';
                                                                                                        await api.del(
                                                                                                            `${endpoint}/${opt.id}`,
                                                                                                        );

                                                                                                        // Remove from local options
                                                                                                        setOptions(
                                                                                                            (
                                                                                                                prev,
                                                                                                            ) =>
                                                                                                                prev.filter(
                                                                                                                    (
                                                                                                                        o,
                                                                                                                    ) =>
                                                                                                                        o.id !==
                                                                                                                        opt.id,
                                                                                                                ),
                                                                                                        );
                                                                                                        setAllOptions(
                                                                                                            (
                                                                                                                prev,
                                                                                                            ) =>
                                                                                                                prev.filter(
                                                                                                                    (
                                                                                                                        o,
                                                                                                                    ) =>
                                                                                                                        o.id !==
                                                                                                                        opt.id,
                                                                                                                ),
                                                                                                        );

                                                                                                        console.log(
                                                                                                            `🗑️ Deleted ${type}: ${opt.name}`,
                                                                                                        );
                                                                                                    } catch (error) {
                                                                                                        console.error(
                                                                                                            `Failed to delete ${type}:`,
                                                                                                            error,
                                                                                                        );
                                                                                                        alert(
                                                                                                            `Failed to delete ${opt.name}. Please try again.`,
                                                                                                        );
                                                                                                    }
                                                                                                }
                                                                                            }}
                                                                                            className='opacity-50 group-hover:opacity-100 bg-white border border-gray-300 hover:bg-red-500 hover:border-red-500 rounded-full transition-all duration-150 flex-shrink-0 w-5 h-5 flex items-center justify-center z-20 group/btn'
                                                                                            title={`Delete ${opt.name}`}
                                                                                        >
                                                                                            <Trash2
                                                                                                size={
                                                                                                    12
                                                                                                }
                                                                                                className='text-gray-600 group-hover/btn:text-white'
                                                                                            />
                                                                                        </button>
                                                                                    )}
                                                                                <div className='absolute inset-0 bg-gradient-to-r from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200' />
                                                                            </button>
                                                                        </motion.div>
                                                                    );
                                                                },
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Show "Create New" option */}
                                                    {showCreateNew && (
                                                        <motion.div
                                                            initial={{
                                                                scale: 0.98,
                                                                opacity: 0,
                                                            }}
                                                            animate={{
                                                                scale: 1,
                                                                opacity: 1,
                                                            }}
                                                            className='mt-2 border-t border-slate-200 pt-2'
                                                        >
                                                            <button
                                                                onClick={async () => {
                                                                    try {
                                                                        let created: {
                                                                            id: string;
                                                                            name: string;
                                                                        } | null =
                                                                            null;

                                                                        if (
                                                                            type ===
                                                                            'accountName'
                                                                        ) {
                                                                            created =
                                                                                await api.post<{
                                                                                    id: string;
                                                                                    name: string;
                                                                                }>(
                                                                                    '/api/accountNames',
                                                                                    {
                                                                                        name: query.trim(),
                                                                                    },
                                                                                );
                                                                        } else if (
                                                                            type ===
                                                                            'masterAccount'
                                                                        ) {
                                                                            created =
                                                                                await api.post<{
                                                                                    id: string;
                                                                                    name: string;
                                                                                }>(
                                                                                    '/api/masterAccounts',
                                                                                    {
                                                                                        name: query.trim(),
                                                                                    },
                                                                                );
                                                                        } else if (
                                                                            type ===
                                                                            'cloudType'
                                                                        ) {
                                                                            // Cloud Type has predefined options, don't create new ones
                                                                            console.log(
                                                                                'Cannot create new cloudType options - using predefined values only',
                                                                            );
                                                                            return;
                                                                        } else if (
                                                                            type ===
                                                                            'address'
                                                                        ) {
                                                                            created =
                                                                                await api.post<{
                                                                                    id: string;
                                                                                    name: string;
                                                                                }>(
                                                                                    '/api/addresses',
                                                                                    {
                                                                                        name: query.trim(),
                                                                                    },
                                                                                );
                                                                        } else if (
                                                                            type ===
                                                                            'template'
                                                                        ) {
                                                                            created =
                                                                                await api.post<{
                                                                                    id: string;
                                                                                    name: string;
                                                                                }>(
                                                                                    '/api/templates',
                                                                                    {
                                                                                        name: query.trim(),
                                                                                    },
                                                                                );
                                                                        }
                                                                        // Note: Enterprise, Product, and Service creation removed - only selection from existing values allowed

                                                                        if (
                                                                            created
                                                                        ) {
                                                                            // Update options list
                                                                            setOptions(
                                                                                (
                                                                                    prev,
                                                                                ) => [
                                                                                    ...prev,
                                                                                    created!,
                                                                                ],
                                                                            );
                                                                            setAllOptions(
                                                                                (
                                                                                    prev,
                                                                                ) => [
                                                                                    ...prev,
                                                                                    created!,
                                                                                ],
                                                                            );

                                                                            // Set the new value
                                                                            setCurrent(
                                                                                created.name,
                                                                            );
                                                                            onChange(
                                                                                created.name,
                                                                            );
                                                                            setQuery(
                                                                                '',
                                                                            );
                                                                            setOpen(
                                                                                false,
                                                                            );

                                                                            // Notify parent component
                                                                            if (
                                                                                onNewItemCreated
                                                                            ) {
                                                                                let dropdownType: string;

                                                                                switch (
                                                                                    type
                                                                                ) {
                                                                                    case 'accountName':
                                                                                        dropdownType =
                                                                                            'accountNames';
                                                                                        break;
                                                                                    case 'masterAccount':
                                                                                        dropdownType =
                                                                                            'masterAccounts';
                                                                                        break;
                                                                                    case 'address':
                                                                                        dropdownType =
                                                                                            'addresses';
                                                                                        break;
                                                                                    case 'template':
                                                                                        dropdownType =
                                                                                            'templates';
                                                                                        break;
                                                                                    default:
                                                                                        dropdownType =
                                                                                            'emails'; // fallback
                                                                                        break;
                                                                                }

                                                                                // Only call if this is a supported type for the callback (excluding enterprise, product, service)
                                                                                if (
                                                                                    [
                                                                                        'accountName',
                                                                                        'masterAccount',
                                                                                        'address',
                                                                                        'template',
                                                                                    ].includes(
                                                                                        type,
                                                                                    )
                                                                                ) {
                                                                                    onNewItemCreated(
                                                                                        dropdownType as any,
                                                                                        created,
                                                                                    );
                                                                                }
                                                                            }
                                                                        }
                                                                    } catch (error) {
                                                                        console.log(
                                                                            `API creation failed for ${type}, creating local entry`,
                                                                        );

                                                                        // Fallback: create a local entry when API fails
                                                                        const newId = `local-${Date.now()}-${Math.random()
                                                                            .toString(
                                                                                36,
                                                                            )
                                                                            .substr(
                                                                                2,
                                                                                9,
                                                                            )}`;
                                                                        const created =
                                                                            {
                                                                                id: newId,
                                                                                name: query.trim(),
                                                                            };

                                                                        // Update options list
                                                                        setOptions(
                                                                            (
                                                                                prev,
                                                                            ) => [
                                                                                ...prev,
                                                                                created,
                                                                            ],
                                                                        );
                                                                        setAllOptions(
                                                                            (
                                                                                prev,
                                                                            ) => [
                                                                                ...prev,
                                                                                created,
                                                                            ],
                                                                        );

                                                                        // Set the new value
                                                                        setCurrent(
                                                                            created.name,
                                                                        );
                                                                        onChange(
                                                                            created.name,
                                                                        );
                                                                        setQuery(
                                                                            '',
                                                                        );
                                                                        setOpen(
                                                                            false,
                                                                        );

                                                                        // Notify parent component
                                                                        if (
                                                                            onNewItemCreated
                                                                        ) {
                                                                            const dropdownType =
                                                                                type ===
                                                                                'accountName'
                                                                                    ? 'accountNames'
                                                                                    : type ===
                                                                                      'masterAccount'
                                                                                    ? 'masterAccounts'
                                                                                    : type ===
                                                                                      'cloudType'
                                                                                    ? 'cloudTypes'
                                                                                    : type ===
                                                                                      'address'
                                                                                    ? 'addresses'
                                                                                    : 'emails';
                                                                            onNewItemCreated(
                                                                                dropdownType,
                                                                                created,
                                                                            );
                                                                        }
                                                                    }
                                                                }}
                                                                className='w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 transition-colors duration-150 rounded-lg'
                                                            >
                                                                + Create &quot;
                                                                {query.trim()}
                                                                &quot;
                                                            </button>
                                                        </motion.div>
                                                    )}

                                                    {/* Show "No results" message */}
                                                    {filteredOptions.length ===
                                                        0 &&
                                                        !showCreateNew && (
                                                            <div className='px-3 py-2 text-center text-sm text-slate-500'>
                                                                {query.trim() ? (
                                                                    <div>
                                                                        No{' '}
                                                                        {type}s
                                                                        found
                                                                        matching
                                                                        &quot;
                                                                        {query}
                                                                        &quot;
                                                                    </div>
                                                                ) : (
                                                                    <div>
                                                                        No{' '}
                                                                        {type}s
                                                                        available
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                </div>
                                            );
                                        })()
                                    )}
                                </div>
                            </div>
                        </div>,
                        document.body,
                    );
                })()}
        </div>
    );
}

interface AccountsTableProps {
    rows: AccountRow[];
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    title?: string;
    groupByExternal?:
        | 'none'
        | 'accountName'
        | 'masterAccount'
        | 'cloudType'
        | 'address';
    onGroupByChange?: (g: 'none' | 'accountName' | 'email' | 'phone') => void;
    hideControls?: boolean;
    visibleColumns?: Array<
        | 'accountName'
        | 'masterAccount'
        | 'cloudType'
        | 'address'
        | 'technicalUser'
        | 'createdBy'
        | 'creationDate'
        | 'lastUpdatedBy'
        | 'lastUpdateDate'
        | 'actions'
    >;
    highlightQuery?: string;
    customColumnLabels?: Record<string, string>;
    enableDropdownChips?: boolean;
    dropdownOptions?: {
        accountNames?: Array<{id: string; name: string}>;
        cloudTypes?: Array<{id: string; name: string}>;
        emails?: Array<{id: string; name: string}>;
        phones?: Array<{id: string; name: string}>;
    };
    onUpdateField?: (rowId: string, field: string, value: any) => void;
    hideRowExpansion?: boolean;
    enableInlineEditing?: boolean;
    incompleteRowIds?: string[];
    showValidationErrors?: boolean;
    hasBlankRow?: boolean;
    onDropdownOptionUpdate?: (
        type: 'accountNames' | 'emails' | 'phones',
        action: 'update' | 'delete',
        oldName: string,
        newName?: string,
    ) => Promise<void>;
    onNewItemCreated?: (
        type: 'accountNames' | 'emails' | 'phones',
        item: {id: string; name: string},
    ) => void;
    onShowAllColumns?: () => void;
    compressingRowId?: string | null;
    foldingRowId?: string | null;
    compressingLicenseId?: string | null;
    foldingLicenseId?: string | null;
    triggerValidation?: boolean; // Trigger validation highlighting
    onValidationComplete?: (errorRowIds: string[]) => void; // Callback with validation results
    onAddNewRow?: () => void; // Callback to add a new row
    externalSortColumn?: string; // External sort column from parent
    externalSortDirection?: 'asc' | 'desc' | ''; // External sort direction from parent
    onSortChange?: (column: string, direction: 'asc' | 'desc') => void; // Callback when sort changes from column headers
    isAIInsightsPanelOpen?: boolean; // Whether the AI insights panel is expanded
    onLicenseValidationChange?: (
        hasIncompleteLicenses: boolean,
        incompleteLicenseRows: string[],
    ) => void; // Callback for license validation state
    onLicenseDelete?: (licenseId: string) => Promise<void>; // Callback for license deletion with animation
    onCompleteLicenseDeletion?: () => void; // Callback to complete license deletion after confirmation
    onOpenAddressModal?: (row: AccountRow) => void; // Callback to open address modal
    onOpenTechnicalUserModal?: (row: AccountRow) => void; // Callback to open technical user modal
}

// License Sub Row Component
function LicenseSubRow({
    license,
    rowId,
    onUpdate,
    onDelete,
    showValidationErrors,
    isLicenseFieldMissing,
    isLicenseDuplicate,
    compressingLicenseId,
    foldingLicenseId,
    onDeleteClick,
    onDropdownOptionUpdate,
    onNewItemCreated,
    onOpenContactModal,
    accounts = [],
    isTableRow = false,
    isLastRow = false,
    dropdownOptions = {enterprises: [], products: [], services: []},
}: {
    license: License;
    rowId: string;
    onUpdate: (
        licenseId: string,
        field: keyof License,
        value: string | boolean,
    ) => void;
    onDelete: (licenseId: string) => void;
    showValidationErrors: boolean;
    isLicenseFieldMissing: (license: License, field: keyof License) => boolean;
    isLicenseDuplicate: (license: License, rowId: string) => boolean;
    compressingLicenseId?: string | null;
    foldingLicenseId?: string | null;
    onDeleteClick?: (licenseId: string) => void;
    onDropdownOptionUpdate?: (
        type: 'accountNames' | 'emails' | 'phones',
        action: 'update' | 'delete',
        oldName: string,
        newName?: string,
    ) => Promise<void>;
    onNewItemCreated?: (
        type: 'accountNames' | 'emails' | 'phones',
        item: {id: string; name: string},
    ) => void;
    onOpenContactModal: (
        rowId: string,
        licenseId: string,
        initialData?: Contact,
    ) => void;
    accounts?: AccountRow[];
    isTableRow?: boolean;
    isLastRow?: boolean;
    dropdownOptions?: {
        enterprises: Array<{id: string; name: string}>;
        products: Array<{id: string; name: string}>;
        services: Array<{id: string; name: string}>;
    };
}) {
    const [isRowHovered, setIsRowHovered] = useState(false);

    // Helper function to validate numeric input
    const validateNumericInput = (value: string): string => {
        if (!value) return '';
        // Remove any non-numeric characters
        const numericValue = value.replace(/[^0-9]/g, '');
        return numericValue;
    };

    // Helper functions to check if selected values are valid from dropdown options
    const isValidEnterprise = (enterpriseName: string | undefined): boolean => {
        if (!enterpriseName || !enterpriseName.trim()) return false;
        return dropdownOptions.enterprises.some(
            (e) => e.name === enterpriseName.trim(),
        );
    };

    const isValidProduct = (productName: string | undefined): boolean => {
        if (!productName || !productName.trim()) return false;
        return dropdownOptions.products.some(
            (p) => p.name === productName.trim(),
        );
    };

    const isValidService = (serviceName: string | undefined): boolean => {
        if (!serviceName || !serviceName.trim()) return false;
        return dropdownOptions.services.some(
            (s) => s.name === serviceName.trim(),
        );
    };

    // Helper function to check license status based on end date
    const getLicenseStatus = (): 'active' | 'expired' | 'unknown' => {
        if (!license.licenseEndDate) return 'unknown';

        try {
            const endDate = new Date(license.licenseEndDate);
            const today = new Date();
            // Reset time to compare just dates
            today.setHours(0, 0, 0, 0);
            endDate.setHours(0, 0, 0, 0);

            return endDate >= today ? 'active' : 'expired';
        } catch {
            return 'unknown';
        }
    };

    const licenseStatus = getLicenseStatus();

    // Tab navigation for license fields
    const createLicenseTabNavigation = (currentCol: string) => {
        const editableCols = [
            'enterprise',
            'product',
            'service',
            'licenseStartDate',
            'licenseEndDate',
            'numberOfUsers',
            'noticePeriodDays',
        ];
        const currentIndex = editableCols.indexOf(currentCol);

        const onTabNext = () => {
            const nextIndex = currentIndex + 1;
            if (nextIndex < editableCols.length) {
                const nextCol = editableCols[nextIndex];
                setTimeout(() => {
                    const nextInput = document.querySelector(
                        `[data-license-id="${license.id}"][data-license-col="${nextCol}"] input`,
                    ) as HTMLInputElement;
                    if (nextInput) {
                        nextInput.focus();
                        nextInput.select();
                    }
                }, 100);
            }
        };

        const onTabPrev = () => {
            const prevIndex = currentIndex - 1;
            if (prevIndex >= 0) {
                const prevCol = editableCols[prevIndex];
                setTimeout(() => {
                    const prevInput = document.querySelector(
                        `[data-license-id="${license.id}"][data-license-col="${prevCol}"] input`,
                    ) as HTMLInputElement;
                    if (prevInput) {
                        prevInput.focus();
                        prevInput.select();
                    }
                }, 100);
            }
        };

        return {onTabNext, onTabPrev};
    };

    return (
        <div
            className={`relative transition-all duration-200 ${
                isTableRow ? '' : 'ml-6 my-1'
            } ${
                compressingLicenseId === license.id
                    ? 'transform scale-x-75 transition-all duration-500 ease-out'
                    : ''
            } ${
                foldingLicenseId === license.id
                    ? 'opacity-0 transform scale-y-50 transition-all duration-300'
                    : ''
            }`}
            onMouseEnter={() => setIsRowHovered(true)}
            onMouseLeave={() => setIsRowHovered(false)}
        >
            {/* Connection line from parent row - only show for non-table rows */}
            {!isTableRow && (
                <div className='absolute -left-6 top-0 bottom-0 w-6 flex'>
                    {/* Vertical line continuing from parent */}
                    <div className='w-px h-full bg-blue-300 ml-3'></div>
                    {/* Horizontal connector to this row */}
                    <div className='absolute top-1/2 left-3 w-3 h-px bg-blue-300'></div>
                </div>
            )}

            {/* License row content with grid structure */}
            <div
                className={`grid gap-2 p-2 transition-all duration-200 ${
                    isTableRow
                        ? `border-l border-r border-blue-200 hover:bg-blue-50/50 ${
                              isLastRow ? 'rounded-b-lg border-b' : 'border-b'
                          }`
                        : 'bg-blue-50/50 border border-blue-200 rounded-lg hover:bg-blue-100/50 hover:border-blue-300 hover:border-2 hover:shadow-md'
                }`}
                style={{
                    gridTemplateColumns:
                        '24px 24px minmax(60px, 1fr) minmax(60px, 1fr) minmax(60px, 1fr) minmax(70px, 0.8fr) minmax(70px, 0.8fr) minmax(45px, 0.5fr) 40px minmax(55px, 0.5fr) minmax(60px, 0.6fr)',
                }}
            >
                {/* Delete Button Column - First in grid */}
                <div className='flex items-center justify-center'>
                    {isRowHovered && (
                        <motion.button
                            initial={{opacity: 0, scale: 0.8}}
                            animate={{opacity: 1, scale: 1}}
                            exit={{opacity: 0, scale: 0.8}}
                            whileHover={{scale: 1.1}}
                            whileTap={{scale: 0.95}}
                            onClick={(e: any) => {
                                e.stopPropagation();
                                if (onDelete) {
                                    onDelete(license.id);
                                }
                            }}
                            className='group/delete flex items-center justify-center w-4 h-4 text-red-500 hover:text-white border border-red-300 hover:border-red-500 bg-white hover:bg-red-500 rounded-full transition-all duration-200 ease-out shadow-sm hover:shadow-md'
                            title='Delete License'
                        >
                            <svg
                                className='w-2 h-2 transition-transform duration-200'
                                fill='none'
                                stroke='currentColor'
                                strokeWidth='2.5'
                                viewBox='0 0 24 24'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    d='M6 12h12'
                                />
                            </svg>
                        </motion.button>
                    )}

                    {/* Duplicate License Warning */}
                    {showValidationErrors &&
                        isLicenseDuplicate(license, rowId) && (
                            <div
                                className='flex items-center justify-center w-4 h-4 bg-red-100 border border-red-300 rounded-full ml-1'
                                title='Duplicate license entry detected. Please modify at least one field to make this entry unique.'
                            >
                                <svg
                                    className='w-2.5 h-2.5 text-red-600'
                                    fill='currentColor'
                                    viewBox='0 0 20 20'
                                >
                                    <path
                                        fillRule='evenodd'
                                        d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                                        clipRule='evenodd'
                                    />
                                </svg>
                            </div>
                        )}
                </div>

                {/* License Status Indicator Column */}
                <div className='flex items-center justify-center'>
                    {licenseStatus === 'active' && (
                        <div
                            className='group relative flex items-center justify-center'
                            title='Active - License is valid'
                        >
                            <span className='relative flex h-3 w-3'>
                                <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75'></span>
                                <span className='relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-sm shadow-emerald-200'></span>
                            </span>
                        </div>
                    )}
                    {licenseStatus === 'expired' && (
                        <div
                            className='group relative flex items-center justify-center'
                            title='Expired - License has ended'
                        >
                            <span className='relative flex h-3 w-3'>
                                <span className='animate-pulse absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-60'></span>
                                <span className='relative inline-flex rounded-full h-3 w-3 bg-red-500 shadow-sm shadow-red-200'></span>
                            </span>
                        </div>
                    )}
                    {licenseStatus === 'unknown' && (
                        <div
                            className='flex items-center justify-center'
                            title='Status unknown - No end date set'
                        >
                            <span className='inline-flex rounded-full h-3 w-3 bg-slate-300 border border-slate-400'></span>
                        </div>
                    )}
                </div>
                <div
                    className='flex flex-col'
                    data-license-id={license.id}
                    data-license-col='enterprise'
                >
                    {!isTableRow && (
                        <label className='text-xs font-medium text-black mb-1'>
                            Enterprise
                        </label>
                    )}
                    <AsyncChipSelect
                        type='enterprise'
                        value={license.enterprise}
                        onChange={(value) =>
                            onUpdate(license.id, 'enterprise', value || '')
                        }
                        placeholder='Enter enterprise'
                        isError={
                            showValidationErrors &&
                            (isLicenseFieldMissing(license, 'enterprise') ||
                                isLicenseDuplicate(license, rowId))
                        }
                        compact={true}
                        onDropdownOptionUpdate={onDropdownOptionUpdate as any}
                        onNewItemCreated={onNewItemCreated as any}
                        accounts={accounts}
                        currentRowId={license.id}
                        currentRowEnterprise={license.enterprise}
                        currentRowProduct={license.product}
                        {...createLicenseTabNavigation('enterprise')}
                    />
                </div>

                <div
                    className='flex flex-col'
                    data-license-id={license.id}
                    data-license-col='product'
                >
                    {!isTableRow && (
                        <label className='text-xs font-medium text-black mb-1'>
                            Product
                        </label>
                    )}
                    <AsyncChipSelect
                        type='product'
                        value={license.product}
                        onChange={(value) =>
                            onUpdate(license.id, 'product', value || '')
                        }
                        placeholder={
                            !isValidEnterprise(license.enterprise)
                                ? 'Select valid Enterprise first'
                                : 'Enter product'
                        }
                        isError={
                            showValidationErrors &&
                            (isLicenseFieldMissing(license, 'product') ||
                                isLicenseDuplicate(license, rowId))
                        }
                        compact={true}
                        onDropdownOptionUpdate={onDropdownOptionUpdate as any}
                        onNewItemCreated={onNewItemCreated as any}
                        accounts={accounts}
                        currentRowId={license.id}
                        currentRowEnterprise={license.enterprise}
                        currentRowProduct={license.product}
                        disabled={!isValidEnterprise(license.enterprise)}
                        {...createLicenseTabNavigation('product')}
                    />
                </div>

                <div
                    className='flex flex-col'
                    data-license-id={license.id}
                    data-license-col='service'
                >
                    {!isTableRow && (
                        <label className='text-xs font-medium text-black mb-1'>
                            Service
                        </label>
                    )}
                    <AsyncChipSelect
                        type='service'
                        value={license.service}
                        onChange={(value) =>
                            onUpdate(license.id, 'service', value || '')
                        }
                        placeholder={
                            !isValidEnterprise(license.enterprise)
                                ? 'Select valid Enterprise first'
                                : !isValidProduct(license.product)
                                ? 'Select valid Product first'
                                : 'Enter service'
                        }
                        isError={
                            showValidationErrors &&
                            (isLicenseFieldMissing(license, 'service') ||
                                isLicenseDuplicate(license, rowId))
                        }
                        compact={true}
                        onDropdownOptionUpdate={onDropdownOptionUpdate as any}
                        onNewItemCreated={onNewItemCreated as any}
                        accounts={accounts}
                        currentRowId={license.id}
                        currentRowEnterprise={license.enterprise}
                        currentRowProduct={license.product}
                        disabled={
                            !isValidEnterprise(license.enterprise) ||
                            !isValidProduct(license.product)
                        }
                        {...createLicenseTabNavigation('service')}
                    />
                </div>

                <div
                    className='flex flex-col'
                    data-license-id={license.id}
                    data-license-col='licenseStartDate'
                >
                    {!isTableRow && (
                        <label className='text-xs font-medium text-black mb-1'>
                            License Start Date
                        </label>
                    )}
                    <DateChipSelect
                        value={license.licenseStartDate}
                        onChange={(value) => {
                            onUpdate(
                                license.id,
                                'licenseStartDate',
                                value || '',
                            );
                            // If end date is earlier than new start date, clear it
                            if (
                                value &&
                                license.licenseEndDate &&
                                new Date(license.licenseEndDate) <
                                    new Date(value)
                            ) {
                                onUpdate(license.id, 'licenseEndDate', '');
                            }
                        }}
                        placeholder=''
                        isError={
                            showValidationErrors &&
                            (isLicenseFieldMissing(
                                license,
                                'licenseStartDate',
                            ) ||
                                isLicenseDuplicate(license, rowId))
                        }
                        compact={true}
                        className='text-xs min-h-[20px] py-0.5'
                        minDate={(() => {
                            // Get current date in YYYY-MM-DD format, ensuring we use the current system date
                            const today = new Date();
                            const year = today.getFullYear();
                            const month = String(today.getMonth() + 1).padStart(
                                2,
                                '0',
                            );
                            const day = String(today.getDate()).padStart(
                                2,
                                '0',
                            );
                            const currentDateString = `${year}-${month}-${day}`;
                            console.log(
                                '🗓️ License Start Date minDate set to:',
                                currentDateString,
                            );
                            return currentDateString;
                        })()}
                    />
                </div>

                <div
                    className='flex flex-col'
                    data-license-id={license.id}
                    data-license-col='licenseEndDate'
                >
                    {!isTableRow && (
                        <label className='text-xs font-medium text-black mb-1'>
                            License End Date
                        </label>
                    )}
                    <DateChipSelect
                        value={license.licenseEndDate}
                        onChange={(value) =>
                            onUpdate(license.id, 'licenseEndDate', value || '')
                        }
                        placeholder=''
                        isError={
                            showValidationErrors &&
                            (isLicenseFieldMissing(license, 'licenseEndDate') ||
                                isLicenseDuplicate(license, rowId))
                        }
                        compact={true}
                        className='text-xs min-h-[20px] py-0.5'
                        minDate={license.licenseStartDate || undefined}
                    />
                </div>

                <div
                    className='flex flex-col'
                    data-license-id={license.id}
                    data-license-col='numberOfUsers'
                >
                    {!isTableRow && (
                        <label className='text-xs font-medium text-black mb-1'>
                            No. of Users
                        </label>
                    )}
                    <AsyncChipSelect
                        type='template'
                        value={license.numberOfUsers}
                        onChange={(value) =>
                            onUpdate(
                                license.id,
                                'numberOfUsers',
                                validateNumericInput(value || ''),
                            )
                        }
                        placeholder='Count'
                        isError={
                            showValidationErrors &&
                            (isLicenseFieldMissing(license, 'numberOfUsers') ||
                                isLicenseDuplicate(license, rowId))
                        }
                        compact={true}
                        onDropdownOptionUpdate={onDropdownOptionUpdate as any}
                        onNewItemCreated={onNewItemCreated as any}
                        accounts={accounts}
                        currentRowId={license.id}
                        currentRowEnterprise={license.enterprise}
                        currentRowProduct={license.product}
                        {...createLicenseTabNavigation('numberOfUsers')}
                    />
                </div>

                <div
                    className='flex flex-col'
                    data-license-id={license.id}
                    data-license-col='contactDetails'
                >
                    {!isTableRow && (
                        <label className='text-xs font-medium text-black mb-1'>
                            Contact
                        </label>
                    )}
                    <div
                        className={`flex items-start justify-center pt-0.5 ${
                            isTableRow ? 'h-full' : 'h-8'
                        }`}
                    >
                        <button
                            onClick={() => {
                                console.log(
                                    '📞 Contact icon clicked for license:',
                                    license,
                                );
                                console.log(
                                    '📞 License ID being passed:',
                                    license.id,
                                );
                                console.log(
                                    '📞 License contactDetails from render:',
                                    license.contactDetails,
                                );
                                // Pass the license contact details as initialData
                                // handleOpenContactModal will always prioritize ref data over this
                                onOpenContactModal(
                                    rowId,
                                    license.id,
                                    license.contactDetails,
                                );
                            }}
                            className='flex items-center justify-center w-6 h-6 bg-blue-100 border border-blue-300 rounded-md hover:bg-blue-200 hover:border-blue-400 transition-all duration-200 group shadow-sm hover:shadow-md'
                            title='Edit contact details'
                        >
                            <svg
                                className='w-4 h-4 text-blue-600 group-hover:text-blue-700'
                                fill='none'
                                viewBox='0 0 24 24'
                                stroke='currentColor'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                                />
                            </svg>
                        </button>
                    </div>
                </div>

                <div
                    className='flex flex-col'
                    data-license-id={license.id}
                    data-license-col='renewalNotice'
                >
                    {!isTableRow && (
                        <label className='text-xs font-medium text-blue-700 mb-1'>
                            Renewal Notice
                        </label>
                    )}
                    <div
                        className={`flex items-start space-x-1 pt-0.5 ${
                            isTableRow ? 'h-full' : 'h-8'
                        }`}
                    >
                        <input
                            type='checkbox'
                            checked={license.renewalNotice}
                            onChange={(e) =>
                                onUpdate(
                                    license.id,
                                    'renewalNotice',
                                    e.target.checked,
                                )
                            }
                            className='w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
                        />
                        <span className='text-xs text-gray-600'>Notify</span>
                    </div>
                </div>

                <div
                    className='flex flex-col min-w-0'
                    data-license-id={license.id}
                    data-license-col='noticePeriodDays'
                >
                    {!isTableRow && (
                        <label className='text-xs font-medium text-blue-700 mb-1 whitespace-nowrap overflow-hidden text-ellipsis'>
                            Notice (days)
                        </label>
                    )}
                    <AsyncChipSelect
                        type='template'
                        value={license.noticePeriodDays || ''}
                        onChange={(value) =>
                            onUpdate(
                                license.id,
                                'noticePeriodDays',
                                validateNumericInput(value || ''),
                            )
                        }
                        placeholder='Days'
                        isError={
                            showValidationErrors &&
                            license.renewalNotice &&
                            !license.noticePeriodDays
                        }
                        compact={true}
                        onDropdownOptionUpdate={onDropdownOptionUpdate as any}
                        onNewItemCreated={onNewItemCreated as any}
                        accounts={accounts}
                        currentRowId={license.id}
                        currentRowEnterprise={license.enterprise}
                        currentRowProduct={license.product}
                        disabled={!license.renewalNotice}
                        {...createLicenseTabNavigation('noticePeriodDays')}
                    />
                </div>
            </div>
        </div>
    );
}

function SortableAccountRow({
    row,
    index,
    onEdit,
    onDelete,
    cols,
    gridTemplate,
    highlightQuery,
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
    shouldShowHorizontalScroll = false,
    onDropdownOptionUpdate,
    onNewItemCreated,
    isCellMissing = () => false,
    compressingRowId = null,
    foldingRowId = null,
    allRows = [],
    onDeleteClick,
    onOpenAddressModal,
    onOpenTechnicalUserModal,
    selectedEnterpriseName = '',
    showValidationErrors = false,
    incompleteRowIds = [],
}: {
    row: AccountRow;
    index: number;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    cols: string[];
    gridTemplate: string;
    highlightQuery?: string;
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
    shouldShowHorizontalScroll?: boolean;
    onDropdownOptionUpdate?: (
        type: 'accountNames' | 'emails' | 'phones',
        action: 'update' | 'delete',
        oldName: string,
        newName?: string,
    ) => Promise<void>;
    onNewItemCreated?: (
        type: 'accountNames' | 'emails' | 'phones',
        item: {id: string; name: string},
    ) => void;
    isCellMissing?: (rowId: string, field: string) => boolean;
    compressingRowId?: string | null;
    foldingRowId?: string | null;
    allRows?: AccountRow[];
    onDeleteClick?: (rowId: string) => void;
    onOpenAddressModal?: (row: AccountRow) => void;
    onOpenTechnicalUserModal?: (row: AccountRow) => void;
    selectedEnterpriseName?: string;
    showValidationErrors?: boolean;
    incompleteRowIds?: string[];
}) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [menuUp, setMenuUp] = useState(false);
    const actionsRef = useRef<HTMLDivElement>(null);
    const [menuPos, setMenuPos] = useState<{top: number; left: number} | null>(
        null,
    );
    const [isRowHovered, setIsRowHovered] = useState(false);

    // Tab navigation state and logic
    const editableCols = cols.filter((col) =>
        ['accountName', 'masterAccount', 'cloudType'].includes(col),
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
                        // Try to find a button (for dropdowns like SimpleDropdown)
                        const nextButton = document.querySelector(
                            `[data-row-id="${row.id}"][data-col="${nextCol}"] button`,
                        ) as HTMLButtonElement;

                        if (nextButton) {
                            nextButton.focus();
                        } else {
                            // If no input or button found, trigger edit mode by clicking the InlineEditableText span
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
                    }
                }, 100);
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
                        // Try to find a button (for dropdowns like SimpleDropdown)
                        const prevButton = document.querySelector(
                            `[data-row-id="${row.id}"][data-col="${prevCol}"] button`,
                        ) as HTMLButtonElement;

                        if (prevButton) {
                            prevButton.focus();
                        } else {
                            // If no input or button found, trigger edit mode by clicking the InlineEditableText span
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
                    }
                }, 100);
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
        tone: 'slate' | 'blue' | 'sky' | 'indigo' | 'cyan';
    }) => {
        const toneMap: Record<
            string,
            {bg: string; text: string; border: string; dot: string}
        > = {
            blue: {
                bg: 'bg-white',
                text: 'text-black',
                border: '',
                dot: 'bg-blue-400',
            },
            sky: {
                bg: 'bg-sky-50',
                text: 'text-sky-800',
                border: 'border-sky-200',
                dot: 'bg-sky-400',
            },
            indigo: {
                bg: 'bg-indigo-50',
                text: 'text-indigo-800',
                border: 'border-indigo-200',
                dot: 'bg-indigo-400',
            },
            cyan: {
                bg: 'bg-cyan-50',
                text: 'text-cyan-800',
                border: 'border-cyan-200',
                dot: 'bg-cyan-400',
            },
            slate: {
                bg: 'bg-slate-50',
                text: 'text-slate-800',
                border: 'border-slate-200',
                dot: 'bg-slate-400',
            },
        };
        const t = toneMap[tone] || toneMap.slate;
        return (
            <motion.span
                initial={{scale: 0.95, opacity: 0}}
                animate={{scale: 1, opacity: 1}}
                whileHover={{y: -1, boxShadow: '0 1px 6px rgba(15,23,42,0.15)'}}
                transition={{type: 'spring', stiffness: 480, damping: 30}}
                className={`inline-flex items-center gap-1 px-1.5 py-[2px] text-[10px] leading-[12px] max-w-full min-w-0 overflow-hidden whitespace-nowrap text-ellipsis rounded ${t.bg} ${t.text} ${t.border}`}
                title={text}
            >
                <span className='truncate'>{text}</span>
            </motion.span>
        );
    };

    // Check if this row has validation errors (incomplete licenses or other fields)
    const hasRowValidationError =
        showValidationErrors &&
        (incompleteRowIds.includes(row.id) ||
            isCellMissing(row.id, 'accountName') ||
            isCellMissing(row.id, 'masterAccount') ||
            isCellMissing(row.id, 'cloudType'));

    return (
        <div
            id={row.id}
            data-account-id={row.id}
            onMouseEnter={() => setIsRowHovered(true)}
            onMouseLeave={() => setIsRowHovered(false)}
            className={`w-full grid items-center gap-0 border rounded-lg transition-all duration-200 ease-in-out h-11 mb-1 pb-1 ${
                hasRowValidationError
                    ? 'border-red-500 bg-red-50 shadow-md ring-2 ring-red-200'
                    : isSelected
                    ? 'border-blue-300 bg-blue-50 shadow-md ring-1 ring-blue-200'
                    : 'border-slate-200 hover:bg-blue-50 hover:shadow-lg hover:ring-1 hover:ring-blue-200 hover:border-blue-300 hover:-translate-y-0.5'
            } ${
                index % 2 === 0
                    ? isSelected || hasRowValidationError
                        ? ''
                        : 'bg-white'
                    : isSelected || hasRowValidationError
                    ? ''
                    : 'bg-slate-50/70'
            } ${inFillRange ? 'bg-primary-50/40' : ''} ${
                isExpanded ? 'bg-primary-50' : ''
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
                gridTemplateColumns: gridTemplate,
                willChange: 'transform',
                display: 'grid',
                minWidth: 'max-content',
                width: '100%',
                maxWidth: '100%',
                overflow: 'hidden',
                borderTop: index === 0 ? '1px solid rgb(226 232 240)' : 'none', // Top border for first row only
            }}
            onPointerDown={(e: React.PointerEvent<HTMLDivElement>) => {
                onSelect(row.id);
            }}
        >
            {/* Delete Button Column - Always first */}
            <div className='flex items-center justify-center px-2 py-1'>
                {isRowHovered && (
                    <motion.button
                        initial={{opacity: 0, scale: 0.8}}
                        animate={{opacity: 1, scale: 1}}
                        exit={{opacity: 0, scale: 0.8}}
                        whileHover={{scale: 1.02}}
                        whileTap={{scale: 0.95}}
                        onClick={(e: any) => {
                            e.stopPropagation();
                            if (onDeleteClick) {
                                onDeleteClick(row.id);
                            }
                        }}
                        className='group/delete flex items-center justify-center w-4 h-4 text-red-500 hover:text-white border border-red-300 hover:border-red-500 bg-white hover:bg-red-500 rounded-full transition-all duration-200 ease-out no-drag shadow-sm hover:shadow-md'
                        title='Delete account & offload infrastructure'
                        tabIndex={-1}
                    >
                        <svg
                            className='w-2 h-2 transition-transform duration-200'
                            fill='none'
                            stroke='currentColor'
                            strokeWidth='2.5'
                            viewBox='0 0 24 24'
                            xmlns='http://www.w3.org/2000/svg'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                d='M6 12h12'
                            />
                        </svg>
                    </motion.button>
                )}
            </div>
            {cols.includes('accountName') && (
                <div
                    className={`group flex items-center gap-1.5 border-r border-slate-200 px-2 py-1 w-full ${
                        pinFirst && !shouldShowHorizontalScroll
                            ? 'sticky left-0 z-10 shadow-[6px_0_8px_-6px_rgba(15,23,42,0.10)]'
                            : ''
                    }`}
                    style={{
                        backgroundColor: isSelected
                            ? 'rgb(239 246 255)' // bg-blue-50
                            : index % 2 === 0
                            ? 'white'
                            : 'rgb(248 250 252 / 0.7)', // bg-white or bg-slate-50/70
                    }}
                >
                    {!hideRowExpansion && (
                        <button
                            className={`h-5 w-5 rounded transition-all duration-200 ${
                                isExpanded
                                    ? 'text-white bg-primary-600 ring-2 ring-primary-500 shadow-md font-bold hover:bg-primary-700'
                                    : 'text-primary-600 hover:bg-primary-100 hover:text-primary-700'
                            }`}
                            onClick={() => onToggle(row.id)}
                            title='Toggle subitems'
                            tabIndex={-1}
                        >
                            <motion.span
                                initial={false}
                                animate={{rotate: isExpanded ? 90 : 0}}
                                transition={{
                                    type: 'spring',
                                    stiffness: 520,
                                    damping: 30,
                                }}
                                className={`inline-flex ${
                                    isExpanded ? 'font-bold' : ''
                                }`}
                            >
                                <ChevronRight
                                    size={16}
                                    strokeWidth={isExpanded ? 3 : 2}
                                />
                            </motion.span>
                        </button>
                    )}
                    <div
                        className='text-slate-700 text-[12px] w-full flex-1'
                        data-row-id={row.id}
                        data-col='accountName'
                        style={{width: '100%'}}
                    >
                        {enableDropdownChips ? (
                            <AsyncChipSelect
                                type='accountName'
                                value={(row as any).accountName || ''}
                                onChange={(v) => {
                                    onUpdateField(
                                        row.id,
                                        'accountName' as any,
                                        v || '',
                                    );
                                }}
                                placeholder=''
                                isError={isCellMissing(row.id, 'accountName')}
                                onDropdownOptionUpdate={
                                    onDropdownOptionUpdate as any
                                }
                                onNewItemCreated={onNewItemCreated as any}
                                accounts={allRows}
                                currentRowId={row.id}
                                currentRowEnterprise={row.accountName || ''}
                                currentRowProduct={row.masterAccount || ''}
                                {...createTabNavigation('accountName')}
                            />
                        ) : (
                            <InlineEditableText
                                value={row.accountName || ''}
                                onCommit={(v) => {
                                    onUpdateField(
                                        row.id,
                                        'accountName' as any,
                                        v,
                                    );
                                }}
                                className='text-[12px]'
                                placeholder=''
                                isError={isCellMissing(row.id, 'accountName')}
                                dataAttr={`${row.id}-accountName`}
                                {...createTabNavigation('accountName')}
                            />
                        )}
                    </div>
                </div>
            )}
            {cols.includes('masterAccount') && (
                <div
                    className={`text-slate-700 text-[12px] w-full border-r border-slate-200 px-2 py-1 ${
                        isSelected
                            ? 'bg-blue-50'
                            : index % 2 === 0
                            ? 'bg-white'
                            : 'bg-slate-50/70'
                    }`}
                    data-row-id={row.id}
                    data-col='masterAccount'
                    style={{width: '100%'}}
                >
                    {enableDropdownChips ? (
                        <AsyncChipSelect
                            type='masterAccount'
                            value={(row as any).masterAccount || ''}
                            onChange={(v) =>
                                onUpdateField(
                                    row.id,
                                    'masterAccount' as any,
                                    v || '',
                                )
                            }
                            placeholder='Enter master account'
                            isError={isCellMissing(row.id, 'masterAccount')}
                            onDropdownOptionUpdate={
                                onDropdownOptionUpdate as any
                            }
                            onNewItemCreated={onNewItemCreated as any}
                            accounts={allRows}
                            currentRowId={row.id}
                            currentRowEnterprise={row.accountName || ''}
                            currentRowProduct={(row as any).masterAccount || ''}
                            {...createTabNavigation('masterAccount')}
                        />
                    ) : (
                        <InlineEditableText
                            value={(row as any).masterAccount || ''}
                            onCommit={(v) =>
                                onUpdateField(row.id, 'masterAccount' as any, v)
                            }
                            className='text-[12px]'
                            dataAttr={`masterAccount-${row.id}`}
                            isError={isCellMissing(row.id, 'masterAccount')}
                            placeholder='Enter master account'
                            {...createTabNavigation('masterAccount')}
                        />
                    )}
                </div>
            )}
            {cols.includes('cloudType') && (
                <div
                    className={`text-slate-700 text-[12px] w-full border-r border-slate-200 px-2 py-1 ${
                        isSelected
                            ? 'bg-blue-50'
                            : index % 2 === 0
                            ? 'bg-white'
                            : 'bg-slate-50/70'
                    }`}
                    data-row-id={row.id}
                    data-col='cloudType'
                    style={{width: '100%'}}
                >
                    {enableDropdownChips ? (
                        <SimpleDropdown
                            value={(row as any).cloudType || ''}
                            options={[
                                {
                                    value: 'Private Cloud',
                                    label: 'Private Cloud',
                                },
                                {value: 'Public Cloud', label: 'Public Cloud'},
                            ]}
                            onChange={(v) => {
                                console.log(
                                    '🔥 CRITICAL: CloudType dropdown onChange called:',
                                    v,
                                    'for row:',
                                    row.id,
                                );
                                console.log(
                                    '🔥 CRITICAL: Current row.cloudType before update:',
                                    (row as any).cloudType,
                                );
                                console.log(
                                    '🔥 CRITICAL: Calling onUpdateField with:',
                                    row.id,
                                    'cloudType',
                                    v || '',
                                );
                                onUpdateField(
                                    row.id,
                                    'cloudType' as any,
                                    v || '',
                                );
                            }}
                            placeholder='Select...'
                            className=''
                            isError={isCellMissing(row.id, 'cloudType')}
                            {...createTabNavigation('cloudType')}
                        />
                    ) : (
                        <InlineEditableText
                            value={(row as any).cloudType || ''}
                            onCommit={(v) =>
                                onUpdateField(row.id, 'cloudType' as any, v)
                            }
                            className='text-[12px]'
                            dataAttr={`cloudType-${row.id}`}
                            isError={isCellMissing(row.id, 'cloudType')}
                            placeholder='Select cloud type'
                            {...createTabNavigation('cloudType')}
                        />
                    )}
                </div>
            )}
            {cols.includes('address') && (
                <div
                    className={`relative flex items-center justify-center text-slate-700 text-[12px] w-full border-r border-slate-200 px-2 py-1 ${
                        isSelected
                            ? 'bg-blue-50'
                            : index % 2 === 0
                            ? 'bg-white'
                            : 'bg-slate-50/70'
                    }`}
                    data-row-id={row.id}
                    data-col='address'
                    style={{width: '100%'}}
                >
                    <button
                        onClick={() => onOpenAddressModal?.(row)}
                        className='group relative flex items-center justify-center w-6 h-6 bg-blue-100 border border-blue-300 rounded-lg transition-all duration-200 hover:bg-blue-200 hover:border-blue-400 hover:scale-110 shadow-sm hover:shadow-md'
                        title={`Manage address for ${
                            row.accountName || 'this account'
                        }`}
                        tabIndex={-1}
                    >
                        <MapPin className='w-5 h-5 text-blue-600 group-hover:text-blue-700' />
                        {!!(row as any).address && (
                            <div className='absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full border border-white'></div>
                        )}
                    </button>
                </div>
            )}
            {cols.includes('technicalUser') && (
                <div
                    className={`relative flex items-center justify-center text-slate-700 text-[12px] w-full border-r border-slate-200 px-2 py-1 ${
                        isSelected
                            ? 'bg-blue-50'
                            : index % 2 === 0
                            ? 'bg-white'
                            : 'bg-slate-50/70'
                    }`}
                    data-row-id={row.id}
                    data-col='technicalUser'
                    style={{width: '100%'}}
                >
                    <button
                        onClick={() => onOpenTechnicalUserModal?.(row)}
                        className='group relative flex items-center justify-center w-6 h-6 bg-blue-100 border border-blue-300 rounded-lg transition-all duration-200 hover:bg-blue-200 hover:border-blue-400 hover:scale-110 shadow-sm hover:shadow-md'
                        title={`Manage technical users for ${
                            row.accountName || 'this account'
                        }`}
                        tabIndex={-1}
                    >
                        <User className='w-5 h-5 text-blue-600 group-hover:text-blue-700' />
                        {row.technicalUsers &&
                            row.technicalUsers.length > 0 && (
                                <div className='absolute -top-1 -right-1 w-3 h-3 bg-blue-800 rounded-full flex items-center justify-center'>
                                    <span className='text-[8px] text-white font-bold'>
                                        {row.technicalUsers.length}
                                    </span>
                                </div>
                            )}
                    </button>
                </div>
            )}
            {/* Audit Columns - Read Only */}
            {cols.includes('createdBy') && (
                <div
                    className={`relative flex items-center text-slate-600 text-[11px] w-full border-r border-slate-200 px-2 py-1 ${
                        isSelected
                            ? 'bg-blue-50'
                            : index % 2 === 0
                            ? 'bg-white'
                            : 'bg-slate-50/70'
                    }`}
                    data-row-id={row.id}
                    data-col='createdBy'
                    style={{width: '100%'}}
                    title={`Created by: ${row.createdBy || 'N/A'}`}
                >
                    <span className='truncate'>{row.createdBy || '-'}</span>
                </div>
            )}
            {cols.includes('creationDate') && (
                <div
                    className={`relative flex items-center text-slate-600 text-[11px] w-full border-r border-slate-200 px-2 py-1 ${
                        isSelected
                            ? 'bg-blue-50'
                            : index % 2 === 0
                            ? 'bg-white'
                            : 'bg-slate-50/70'
                    }`}
                    data-row-id={row.id}
                    data-col='creationDate'
                    style={{width: '100%'}}
                    title={`Created: ${row.creationDate || 'N/A'}`}
                >
                    <span className='truncate'>
                        {row.creationDate
                            ? new Date(row.creationDate).toLocaleDateString()
                            : '-'}
                    </span>
                </div>
            )}
            {cols.includes('lastUpdatedBy') && (
                <div
                    className={`relative flex items-center text-slate-600 text-[11px] w-full border-r border-slate-200 px-2 py-1 ${
                        isSelected
                            ? 'bg-blue-50'
                            : index % 2 === 0
                            ? 'bg-white'
                            : 'bg-slate-50/70'
                    }`}
                    data-row-id={row.id}
                    data-col='lastUpdatedBy'
                    style={{width: '100%'}}
                    title={`Last updated by: ${row.lastUpdatedBy || 'N/A'}`}
                >
                    <span className='truncate'>{row.lastUpdatedBy || '-'}</span>
                </div>
            )}
            {cols.includes('lastUpdateDate') && (
                <div
                    className={`relative flex items-center text-slate-600 text-[11px] w-full border-r border-slate-200 px-2 py-1 ${
                        isSelected
                            ? 'bg-blue-50'
                            : index % 2 === 0
                            ? 'bg-white'
                            : 'bg-slate-50/70'
                    }`}
                    data-row-id={row.id}
                    data-col='lastUpdateDate'
                    style={{width: '100%'}}
                    title={`Last updated: ${row.lastUpdateDate || 'N/A'}`}
                >
                    <span className='truncate'>
                        {row.lastUpdateDate
                            ? new Date(row.lastUpdateDate).toLocaleDateString()
                            : '-'}
                    </span>
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

const AccountsTable = forwardRef<any, AccountsTableProps>(
    (
        {
            rows,
            onEdit,
            onDelete,
            title,
            groupByExternal,
            onGroupByChange,
            hideControls,
            visibleColumns,
            highlightQuery,
            customColumnLabels,
            enableDropdownChips = false,
            dropdownOptions = {},
            onUpdateField,
            hideRowExpansion = false,
            enableInlineEditing = true,
            incompleteRowIds = [],
            showValidationErrors = false,
            hasBlankRow = false,
            onDropdownOptionUpdate,
            onNewItemCreated,
            onShowAllColumns,
            compressingRowId = null,
            foldingRowId = null,
            compressingLicenseId = null,
            foldingLicenseId = null,
            triggerValidation = false,
            onValidationComplete,
            onAddNewRow,
            externalSortColumn,
            externalSortDirection,
            onSortChange,
            isAIInsightsPanelOpen = false,
            onLicenseValidationChange,
            onLicenseDelete,
            onCompleteLicenseDeletion,
            onOpenAddressModal,
            onOpenTechnicalUserModal,
        },
        ref,
    ) => {
        // Local validation state to track rows with errors
        const [validationErrors, setValidationErrors] = useState<Set<string>>(
            new Set(),
        );

        // State for license deletion
        const [pendingDeleteLicenseId, setPendingDeleteLicenseId] = useState<
            string | null
        >(null);
        const [pendingDeleteRowId, setPendingDeleteRowId] = useState<
            string | null
        >(null);

        // State for expanded rows and licenses
        const [expandedRows, setExpandedRows] = useState<Set<string>>(
            new Set(),
        );
        const [rowLicenses, setRowLicenses] = useState<
            Record<string, License[]>
        >({});
        const rowLicensesRef = useRef<Record<string, License[]>>({});
        const [pendingLicenseRows, setPendingLicenseRows] = useState<
            Set<string>
        >(new Set());
        const [licenseValidationTriggered, setLicenseValidationTriggered] =
            useState<Set<string>>(new Set());

        // State for selected enterprise (from top-right breadcrumb)
        const [selectedEnterpriseName, setSelectedEnterpriseName] =
            useState<string>('');

        // ContactModal state for license contact details
        const [contactModalData, setContactModalData] = useState<Contact[]>([]);
        const [showContactModal, setShowContactModal] = useState(false);
        const [contactModalRowId, setContactModalRowId] = useState<
            string | null
        >(null);
        const [contactModalLicenseId, setContactModalLicenseId] = useState<
            string | null
        >(null);
        const [contactModalAccountName, setContactModalAccountName] =
            useState<string>('');
        const [contactModalMasterAccount, setContactModalMasterAccount] =
            useState<string>('');

        // Monitor rowLicenses state changes for debugging
        useEffect(() => {
            console.log('🔄 rowLicenses state changed:', rowLicenses);
            // Keep ref in sync with state for latest access
            rowLicensesRef.current = rowLicenses;
            // Log contact details for the license that was just updated
            Object.entries(rowLicenses).forEach(([accountId, licenses]) => {
                licenses.forEach((license) => {
                    if (
                        license.contactDetails &&
                        (license.contactDetails.name ||
                            license.contactDetails.email)
                    ) {
                        console.log(
                            `🔄 Account ${accountId} License ${license.id} contact:`,
                            license.contactDetails,
                        );
                    }
                });
            });
        }, [rowLicenses]);

        // Use refs to track previous values and avoid infinite loops
        const prevRowsRef = useRef<AccountRow[]>([]);
        const orderRef = useRef<string[]>([]);

        // Keep local state for editing, but initialize it safely
        const [localEdits, setLocalEdits] = useState<
            Record<string, Partial<AccountRow>>
        >({});

        // Use useMemo for base derived state with stable comparison
        const {baseLocalRows, order} = useMemo(() => {
            // Check if rows array length or IDs have changed (shallow comparison)
            const currentIds = rows.map((r) => r.id).join(',');
            const prevIds = prevRowsRef.current.map((r) => r.id).join(',');

            if (
                currentIds === prevIds &&
                rows.length === prevRowsRef.current.length
            ) {
                return {
                    baseLocalRows: prevRowsRef.current,
                    order: orderRef.current,
                };
            }

            // Update refs and create new state
            prevRowsRef.current = rows.map((r) => ({...r}));
            const newOrder = rows.map((r) => r.id);
            orderRef.current = newOrder;

            return {
                baseLocalRows: prevRowsRef.current,
                order: newOrder,
            };
        }, [rows]);

        // Apply local edits to create final localRows with stable reference
        const localRows = useMemo(() => {
            return baseLocalRows.map((row) => {
                const edits = localEdits[row.id];
                if (!edits || Object.keys(edits).length === 0) {
                    return row; // Return same reference if no edits
                }
                return {
                    ...row,
                    ...edits,
                };
            });
        }, [baseLocalRows, localEdits]);

        // Initialize rowLicenses from rows prop only once
        const [hasInitializedLicenses, setHasInitializedLicenses] =
            useState(false);

        // Expose methods to parent component via ref
        useImperativeHandle(
            ref,
            () => ({
                completeLicenseDeletion: () => {
                    if (pendingDeleteLicenseId && pendingDeleteRowId) {
                        console.log(
                            '🗑️ Completing license deletion via ref:',
                            pendingDeleteLicenseId,
                        );
                        setRowLicenses((prev) => ({
                            ...prev,
                            [pendingDeleteRowId]: (
                                prev[pendingDeleteRowId] || []
                            ).filter(
                                (license) =>
                                    license.id !== pendingDeleteLicenseId,
                            ),
                        }));
                        setPendingDeleteLicenseId(null);
                        setPendingDeleteRowId(null);
                        console.log(
                            '✅ License removed from rowLicenses state via ref',
                        );
                    }
                },
                getCurrentLicenseState: () => {
                    return rowLicenses;
                },
                expandAllRows: () => {
                    const allRowIds = rows.map((row) => row.id);
                    setExpandedRows(new Set(allRowIds));

                    // Initialize licenses for all rows that don't have them
                    setRowLicenses((prevLicenses) => {
                        const newLicenses = {...prevLicenses};
                        allRowIds.forEach((rowId) => {
                            if (!newLicenses[rowId]) {
                                newLicenses[rowId] = [];
                            }
                        });
                        return newLicenses;
                    });
                },
                collapseAllRows: () => {
                    setExpandedRows(new Set());
                },
            }),
            [pendingDeleteLicenseId, pendingDeleteRowId, rowLicenses, rows],
        );

        // Helper function to check if a field is missing/invalid
        const isFieldMissing = (row: AccountRow, field: string): boolean => {
            switch (field) {
                case 'accountName':
                    return !row.accountName || row.accountName.trim() === '';
                case 'masterAccount':
                    return (
                        !row.masterAccount || row.masterAccount.trim() === ''
                    );
                case 'cloudType':
                    return !row.cloudType || row.cloudType.trim() === '';
                case 'address':
                    return !row.address || row.address.trim() === '';
                default:
                    return false;
            }
        };

        // Enhanced helper function to check if a cell should be highlighted as missing
        const isCellMissing = (rowId: string, field: string) => {
            const row = localRows.find((r) => r.id === rowId);
            if (!row) return false;

            // Don't show validation errors for new rows that were just added (not part of the incomplete rows list)
            // This prevents new rows from inheriting validation styling from previous validation sessions
            if (showValidationErrors && !incompleteRowIds.includes(rowId)) {
                return false;
            }

            // Check if this row has validation errors (either from parent or local validation)
            const hasValidationError =
                showValidationErrors &&
                (incompleteRowIds.includes(rowId) ||
                    validationErrors.has(rowId));

            if (!hasValidationError) return false;

            // When validation is explicitly triggered (showValidationErrors=true), show errors for all incomplete fields
            // including completely blank rows
            return isFieldMissing(row, field);
        };

        // Function to validate all rows and highlight missing fields
        const validateAndHighlightErrors = () => {
            const errorRowIds = new Set<string>();

            localRows.forEach((row) => {
                // Check if any required field is missing
                if (
                    isFieldMissing(row, 'accountName') ||
                    isFieldMissing(row, 'email') ||
                    isFieldMissing(row, 'phone')
                ) {
                    errorRowIds.add(row.id);
                }
            });

            setValidationErrors(errorRowIds);
            return errorRowIds;
        };

        useEffect(() => {
            if (!hasInitializedLicenses) {
                const initialLicenses: Record<string, License[]> = {};
                rows.forEach((row) => {
                    if (row.licenses && row.licenses.length > 0) {
                        console.log(
                            `🔍 Initializing licenses for account ${row.accountName}:`,
                            {
                                accountId: row.id,
                                licensesCount: row.licenses.length,
                                licenses: row.licenses,
                                licenseIds: row.licenses.map((l) => l.id),
                                actualLicenseIdsWithDetails: row.licenses.map(
                                    (l) => ({
                                        id: l.id,
                                        enterprise: l.enterprise,
                                        product: l.product,
                                        service: l.service,
                                    }),
                                ),
                            },
                        );

                        // Check for duplicate license IDs within the same account
                        const licenseIds = row.licenses.map((l) => l.id);
                        const uniqueLicenseIds = Array.from(
                            new Set(licenseIds),
                        );
                        if (licenseIds.length !== uniqueLicenseIds.length) {
                            console.error(
                                `❌ Duplicate license IDs found in account ${row.accountName}:`,
                                {
                                    total: licenseIds.length,
                                    unique: uniqueLicenseIds.length,
                                    duplicates: licenseIds.filter(
                                        (id: string, index: number) =>
                                            licenseIds.indexOf(id) !== index,
                                    ),
                                },
                            );
                        }

                        initialLicenses[row.id] = row.licenses;
                    }
                });

                if (Object.keys(initialLicenses).length > 0) {
                    console.log(
                        '🔍 Setting initial rowLicenses:',
                        initialLicenses,
                    );
                    setRowLicenses(initialLicenses);
                }
                setHasInitializedLicenses(true);
            }
        }, [rows, hasInitializedLicenses]);

        // Sync rowLicenses when rows change (e.g., after autosave converts tmp-* IDs to real IDs)
        // This ensures licenses are properly associated with their new account IDs
        useEffect(() => {
            if (!hasInitializedLicenses) return;

            setRowLicenses((prevLicenses) => {
                const updatedLicenses = {...prevLicenses};
                let hasChanges = false;

                rows.forEach((row) => {
                    // If this row has licenses from props but not in state, add them
                    if (
                        row.licenses &&
                        row.licenses.length > 0 &&
                        !updatedLicenses[row.id]
                    ) {
                        console.log(
                            `🔄 Syncing licenses for account ${row.accountName} (ID: ${row.id})`,
                            row.licenses.length,
                        );
                        updatedLicenses[row.id] = row.licenses;
                        hasChanges = true;
                    }
                    // If this row has licenses in props that are different from state, update them
                    else if (
                        row.licenses &&
                        row.licenses.length > 0 &&
                        updatedLicenses[row.id]
                    ) {
                        // Check if props licenses have more/different data than state
                        const propsLicenseIds = new Set(
                            row.licenses.map((l) => l.id),
                        );
                        const stateLicenseIds = new Set(
                            updatedLicenses[row.id].map((l) => l.id),
                        );

                        // If all licenses are the same IDs, check if any have more complete data
                        if (propsLicenseIds.size === stateLicenseIds.size) {
                            const rowLicenses = row.licenses || []; // Safe reference for use in callback
                            const mergedLicenses = updatedLicenses[row.id].map(
                                (stateLicense) => {
                                    const propsLicense = rowLicenses.find(
                                        (l) => l.id === stateLicense.id,
                                    );
                                    if (propsLicense) {
                                        // Merge props into state, preferring state values where they exist
                                        return {
                                            ...propsLicense,
                                            ...stateLicense,
                                            // But keep contactDetails from state if it exists and is more complete
                                            contactDetails:
                                                stateLicense.contactDetails ||
                                                propsLicense.contactDetails,
                                        };
                                    }
                                    return stateLicense;
                                },
                            );
                            updatedLicenses[row.id] = mergedLicenses;
                        }
                    }
                });

                // Also handle ID migrations (tmp-* to real ID)
                // Find any licenses that are keyed by tmp-* IDs that no longer exist in rows
                const currentRowIds = new Set(rows.map((r) => r.id));
                const orphanedTmpIds = Object.keys(updatedLicenses).filter(
                    (id) => id.startsWith('tmp-') && !currentRowIds.has(id),
                );

                if (orphanedTmpIds.length > 0) {
                    console.log(
                        '🔄 Found orphaned tmp licenses to migrate:',
                        orphanedTmpIds,
                    );
                    // Try to match orphaned licenses to new rows by accountName
                    orphanedTmpIds.forEach((tmpId) => {
                        // Find the row that was previously this tmp ID by matching license content
                        const orphanedLicenses = updatedLicenses[tmpId];
                        if (orphanedLicenses && orphanedLicenses.length > 0) {
                            // Look for a row that has licenses with matching IDs
                            const matchingRow = rows.find((row) =>
                                row.licenses?.some((l) =>
                                    orphanedLicenses.some(
                                        (ol) => ol.id === l.id,
                                    ),
                                ),
                            );
                            if (matchingRow && matchingRow.id !== tmpId) {
                                console.log(
                                    `🔄 Migrating licenses from ${tmpId} to ${matchingRow.id}`,
                                );
                                updatedLicenses[matchingRow.id] =
                                    orphanedLicenses;
                                delete updatedLicenses[tmpId];
                                hasChanges = true;
                            }
                        }
                    });
                }

                if (hasChanges) {
                    rowLicensesRef.current = updatedLicenses;
                }

                return updatedLicenses;
            });
        }, [rows, hasInitializedLicenses]);

        // Load selected enterprise from localStorage and listen for changes
        useEffect(() => {
            const loadSelectedEnterprise = () => {
                try {
                    const savedName = window.localStorage.getItem(
                        'selectedEnterpriseName',
                    );
                    if (savedName) {
                        setSelectedEnterpriseName(savedName);
                        console.log(
                            `🏢 Loaded selected enterprise: ${savedName}`,
                        );
                    }
                } catch (error) {
                    console.warn('Failed to load selected enterprise:', error);
                }
            };

            // Load on mount
            loadSelectedEnterprise();

            // Listen for enterprise changes
            const handleEnterpriseChange = () => {
                loadSelectedEnterprise();
            };

            window.addEventListener(
                'enterpriseChanged',
                handleEnterpriseChange,
            );
            window.addEventListener('storage', handleEnterpriseChange);

            return () => {
                window.removeEventListener(
                    'enterpriseChanged',
                    handleEnterpriseChange,
                );
                window.removeEventListener('storage', handleEnterpriseChange);
            };
        }, []);

        // No useEffect needed - using useMemo for derived state above

        // Effect to trigger validation when requested
        useEffect(() => {
            if (triggerValidation) {
                const errorRowIds = new Set<string>();

                // Use baseLocalRows with localEdits applied inline to avoid dependency issues
                baseLocalRows.forEach((baseRow) => {
                    const row = {...baseRow, ...(localEdits[baseRow.id] || {})};
                    // Check if any required field is missing
                    if (
                        isFieldMissing(row, 'accountName') ||
                        isFieldMissing(row, 'email') ||
                        isFieldMissing(row, 'phone')
                    ) {
                        errorRowIds.add(row.id);
                    }
                });

                setValidationErrors(errorRowIds);

                if (onValidationComplete) {
                    onValidationComplete(Array.from(errorRowIds));
                }
            }
        }, [
            triggerValidation,
            baseLocalRows,
            localEdits,
            onValidationComplete,
        ]);

        // Effect to highlight errors when incompleteRowIds changes from parent
        // TEMPORARILY DISABLED to fix infinite re-render loop
        // useEffect(() => {
        //     if (showValidationErrors && incompleteRowIds.length > 0) {
        //         // Simply set validation errors to the incomplete row IDs from parent
        //         // Don't do local validation here to avoid circular dependencies
        //         setValidationErrors(new Set(incompleteRowIds));
        //     } else {
        //         // Clear validation errors when not showing validation or no incomplete rows from parent
        //         setValidationErrors(new Set());
        //     }
        // }, [incompleteRowIds, showValidationErrors]);

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
                const currentTimers = saveTimersRef.current;
                Object.values(currentTimers).forEach((t) => clearTimeout(t));
            };
        }, []);

        // Only show license validation during explicit save attempts with incomplete licenses
        const prevShowValidationErrors = useRef(false);
        useEffect(() => {
            // Only trigger license validation when showValidationErrors changes from false to true (save attempt)
            if (showValidationErrors && !prevShowValidationErrors.current) {
                const rowsWithIncompleteLicenses = new Set<string>();
                Object.keys(rowLicenses).forEach((rowId) => {
                    const licenses = rowLicenses[rowId] || [];
                    const hasIncompleteLicense = licenses.some(
                        (license) =>
                            !license.enterprise?.trim() ||
                            !license.product?.trim() ||
                            !license.service?.trim() ||
                            !license.licenseStartDate?.trim() ||
                            !license.licenseEndDate?.trim() ||
                            !license.numberOfUsers?.trim() ||
                            (license.renewalNotice &&
                                !license.noticePeriodDays?.trim()),
                    );
                    // Include any row that has licenses with incomplete data
                    if (hasIncompleteLicense) {
                        rowsWithIncompleteLicenses.add(rowId);
                    }
                });
                console.log(
                    '🔍 License validation triggered for rows:',
                    Array.from(rowsWithIncompleteLicenses),
                );
                setLicenseValidationTriggered(rowsWithIncompleteLicenses);
            } else if (!showValidationErrors) {
                setLicenseValidationTriggered(new Set());
            }
            prevShowValidationErrors.current = showValidationErrors;
        }, [showValidationErrors, rowLicenses]);
        async function persistAccountRow(row: AccountRow) {
            try {
                // Skip auto-save for temporary rows - let the parent handle account linkage auto-save
                if (String(row.id || '').startsWith('tmp-')) {
                    console.log(
                        '⏭️ Skipping old auto-save for temporary row, letting linkage auto-save handle it:',
                        row.id,
                    );
                    return;
                }
                const core = {
                    // Core fields for account configuration
                    accountName: row.accountName,
                    masterAccount: row.masterAccount,
                    cloudType: row.cloudType,
                    address: row.address,
                } as any;
                // Map UI state into backend details JSON expected by server
                const details = {
                    // Account configuration specific fields
                    accountName: row.accountName || '',
                    masterAccount: row.masterAccount || '',
                    cloudType: row.cloudType || '',
                    address: row.address || '',
                } as any;
                // Handle existing (non-temporary) rows
                // Check if we're on account management page
                if (
                    typeof window !== 'undefined' &&
                    window.location.pathname.includes('/manage-accounts')
                ) {
                    console.log(
                        '🔄 Updating account linkage instead of enterprise:',
                        row.id,
                    );

                    // For account management, update the linkage via the parent's onUpdateField
                    // The parent component will handle the account linkage updates
                    console.log(
                        '⏭️ Skipping direct API call for account management page',
                    );
                    return;
                }

                // For account management, all persistence is handled by parent component
                console.log(
                    '⏭️ Skipping API call - account management handled by parent',
                );
                return;
            } catch (_e) {
                // TODO: surface toast; keep silent here to avoid blocking UI
            }
        }

        function updateRowField(
            rowId: string,
            key: keyof AccountRow,
            value: any,
        ) {
            let changed: AccountRow | null = null;

            // Update local edits instead of directly modifying localRows
            setLocalEdits((prev) => {
                // Use baseLocalRows with current edits to avoid circular dependency
                const baseRow = baseLocalRows.find((r) => r.id === rowId);
                if (baseRow) {
                    const currentEdits = prev[rowId] || {};
                    const currentRow = {...baseRow, ...currentEdits};
                    const next = {...currentRow, [key]: value} as AccountRow;
                    changed = next;

                    return {
                        ...prev,
                        [rowId]: {
                            ...(prev[rowId] || {}),
                            [key]: value,
                        },
                    };
                }
                return prev;
            });

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

        // License management functions
        const toggleRowExpansion = (rowId: string) => {
            setExpandedRows((prev) => {
                const newSet = new Set(prev);
                if (newSet.has(rowId)) {
                    newSet.delete(rowId);
                } else {
                    newSet.add(rowId);
                    // Initialize licenses if not exist
                    if (!rowLicenses[rowId]) {
                        setRowLicenses((prevLicenses) => ({
                            ...prevLicenses,
                            [rowId]: [],
                        }));
                    }
                }
                return newSet;
            });
        };

        // Expand all rows function
        const expandAllRows = () => {
            const allRowIds = orderedItems.map((row) => row.id);
            setExpandedRows(new Set(allRowIds));

            // Initialize licenses for all rows that don't have them
            setRowLicenses((prevLicenses) => {
                const newLicenses = {...prevLicenses};
                allRowIds.forEach((rowId) => {
                    if (!newLicenses[rowId]) {
                        newLicenses[rowId] = [];
                    }
                });
                return newLicenses;
            });
        };

        // Collapse all rows function
        const collapseAllRows = () => {
            setExpandedRows(new Set());
        };

        // Helper function to check if main row fields are complete
        const isMainRowComplete = (row: AccountRow): boolean => {
            return !!(
                row.accountName &&
                row.accountName.trim() &&
                row.masterAccount &&
                row.masterAccount.trim() &&
                row.cloudType &&
                row.cloudType.trim()
            );
        };

        const addNewLicense = (rowId: string) => {
            const newLicenseId = `license-${rowId}-${Date.now()}`;
            const newLicense: License = {
                id: newLicenseId,
                enterprise: '',
                product: '',
                service: '',
                licenseStartDate: '',
                licenseEndDate: '',
                numberOfUsers: '',
                contactDetails: {
                    id: generateId(),
                    name: '',
                    email: '',
                    phone: '',
                    department: '',
                    designation: '',
                },
                renewalNotice: false,
                noticePeriodDays: '',
            };

            // Ensure the row is expanded when adding a license
            setExpandedRows((prev) => {
                const newSet = new Set(prev);
                newSet.add(rowId);
                return newSet;
            });

            setRowLicenses((prev) => ({
                ...prev,
                [rowId]: [...(prev[rowId] || []), newLicense],
            }));

            // Clear license validation for this row when adding new license
            setLicenseValidationTriggered((prev) => {
                const newSet = new Set(prev);
                newSet.delete(rowId);
                return newSet;
            });

            // Mark this row as having pending licenses for validation
            setPendingLicenseRows((prev) => {
                const newSet = new Set(prev);
                newSet.add(rowId);
                return newSet;
            });

            // Don't trigger auto-save for adding empty license - only when fields are filled
            // But still update parent state so validation can see the empty license
            if (onUpdateField) {
                const currentLicenses = rowLicenses[rowId] || [];
                const updatedLicenses = [...currentLicenses, newLicense];
                onUpdateField(rowId, 'licenses', updatedLicenses);
            }

            // Don't clear validation errors when adding new license - let existing validation state persist
            // This allows multiple accounts to maintain their validation highlighting

            console.log(
                '➕ Added new empty license, updated parent state but preserved validation state:',
                {
                    rowId,
                    licenseId: newLicenseId,
                },
            );
        };

        const updateLicense = (
            rowId: string,
            licenseId: string,
            field: keyof License,
            value: string | boolean,
        ) => {
            setRowLicenses((prev) => {
                const updatedLicenses = {
                    ...prev,
                    [rowId]: (prev[rowId] || []).map((license) => {
                        if (license.id === licenseId) {
                            const updatedLicense = {...license, [field]: value};

                            // Clear dependent fields when parent fields change
                            if (field === 'enterprise') {
                                // When Enterprise changes, clear Product and Service
                                updatedLicense.product = '';
                                updatedLicense.service = '';
                            } else if (field === 'product') {
                                // When Product changes, clear Service
                                updatedLicense.service = '';
                            }

                            return updatedLicense;
                        }
                        return license;
                    }),
                };

                // Check if the license is now complete using the updated state
                const updatedLicense = updatedLicenses[rowId]?.find(
                    (l) => l.id === licenseId,
                );
                if (
                    updatedLicense &&
                    updatedLicense.enterprise &&
                    updatedLicense.product &&
                    updatedLicense.service &&
                    updatedLicense.licenseStartDate &&
                    updatedLicense.licenseEndDate &&
                    updatedLicense.numberOfUsers &&
                    (!updatedLicense.renewalNotice ||
                        updatedLicense.noticePeriodDays)
                ) {
                    // License is complete, check if all licenses in row are complete
                    const allLicenses = updatedLicenses[rowId] || [];
                    const allComplete = allLicenses.every(
                        (l) =>
                            l.enterprise &&
                            l.product &&
                            l.service &&
                            l.licenseStartDate &&
                            l.licenseEndDate &&
                            l.numberOfUsers &&
                            (!l.renewalNotice || l.noticePeriodDays),
                    );
                    if (allComplete) {
                        // Use setTimeout to avoid state update during render
                        setTimeout(() => {
                            setPendingLicenseRows((prev) => {
                                const newSet = new Set(prev);
                                newSet.delete(rowId);
                                return newSet;
                            });
                        }, 0);
                    }
                } else if (updatedLicense) {
                    // License is incomplete, ensure it's marked as pending
                    setTimeout(() => {
                        setPendingLicenseRows((prev) => {
                            const newSet = new Set(prev);
                            newSet.add(rowId);
                            return newSet;
                        });
                    }, 0);
                }

                return updatedLicenses;
            });

            // Only trigger auto-save for license updates if ALL mandatory fields are complete
            // This prevents auto-save from triggering on partial license completion
            const isValueEmpty =
                typeof value === 'boolean'
                    ? false
                    : !value || value.trim() === '';

            if (!isValueEmpty && onUpdateField) {
                // Get the updated licenses for this row
                const updatedRowLicenses =
                    rowLicenses[rowId]?.map((license) =>
                        license.id === licenseId
                            ? {...license, [field]: value}
                            : license,
                    ) || [];

                // Check if this specific license now has all mandatory fields completed
                const updatedLicense = updatedRowLicenses.find(
                    (license) => license.id === licenseId,
                );
                const hasAllFields =
                    updatedLicense &&
                    updatedLicense.enterprise?.trim() &&
                    updatedLicense.product?.trim() &&
                    updatedLicense.service?.trim() &&
                    updatedLicense.licenseStartDate?.trim() &&
                    updatedLicense.licenseEndDate?.trim() &&
                    updatedLicense.numberOfUsers?.trim() &&
                    (!updatedLicense.renewalNotice ||
                        updatedLicense.noticePeriodDays?.trim());

                // Check if this license is a duplicate (using the temporarily updated license data)
                const isDuplicate =
                    hasAllFields &&
                    updatedRowLicenses.filter((otherLicense) => {
                        if (otherLicense.id === updatedLicense.id) return false; // Don't compare with self

                        return (
                            otherLicense.enterprise ===
                                updatedLicense.enterprise &&
                            otherLicense.product === updatedLicense.product &&
                            otherLicense.service === updatedLicense.service &&
                            otherLicense.licenseStartDate ===
                                updatedLicense.licenseStartDate &&
                            otherLicense.licenseEndDate ===
                                updatedLicense.licenseEndDate &&
                            otherLicense.numberOfUsers ===
                                updatedLicense.numberOfUsers &&
                            otherLicense.renewalNotice ===
                                updatedLicense.renewalNotice &&
                            otherLicense.noticePeriodDays ===
                                updatedLicense.noticePeriodDays
                        );
                    }).length > 0;

                if (hasAllFields && !isDuplicate) {
                    console.log(
                        '🔄 Triggering auto-save for complete license:',
                        {
                            rowId,
                            licenseId,
                            field,
                            value,
                            hasAllFields,
                            isDuplicate,
                            licenseData: updatedLicense,
                        },
                    );
                    onUpdateField(rowId, 'licenses', updatedRowLicenses);
                } else {
                    console.log(
                        '⏳ License incomplete or duplicate, not triggering auto-save yet:',
                        {
                            rowId,
                            licenseId,
                            field,
                            value,
                            hasAllFields,
                            isDuplicate,
                            licenseData: updatedLicense,
                            missing: {
                                enterprise: !updatedLicense?.enterprise?.trim(),
                                product: !updatedLicense?.product?.trim(),
                                service: !updatedLicense?.service?.trim(),
                                licenseStartDate:
                                    !updatedLicense?.licenseStartDate?.trim(),
                                licenseEndDate:
                                    !updatedLicense?.licenseEndDate?.trim(),
                                numberOfUsers:
                                    !updatedLicense?.numberOfUsers?.trim(),
                                noticePeriodDays:
                                    updatedLicense?.renewalNotice &&
                                    !updatedLicense?.noticePeriodDays?.trim(),
                            },
                        },
                    );
                }
            } else if (isValueEmpty) {
                console.log(
                    '❌ Not triggering auto-save for empty license field:',
                    {
                        rowId,
                        licenseId,
                        field,
                        value,
                        isValueEmpty,
                    },
                );
            }
        };

        const deleteLicense = async (rowId: string, licenseId: string) => {
            // Store the deletion context for completion after confirmation
            setPendingDeleteLicenseId(licenseId);
            setPendingDeleteRowId(rowId);

            if (onLicenseDelete) {
                // Use the parent's animation callback
                await onLicenseDelete(licenseId);
            } else {
                // Direct deletion if no animation callback
                setRowLicenses((prev) => ({
                    ...prev,
                    [rowId]: (prev[rowId] || []).filter(
                        (license) => license.id !== licenseId,
                    ),
                }));

                // Trigger auto-save for license deletion
                if (onUpdateField) {
                    const updatedLicenses = (rowLicenses[rowId] || []).filter(
                        (license) => license.id !== licenseId,
                    );
                    onUpdateField(rowId, 'licenses', updatedLicenses);
                }
            }
        };

        // Complete the license deletion when animation and confirmation are done
        const completeLicenseDeletion = () => {
            if (pendingDeleteLicenseId && pendingDeleteRowId) {
                const rowId = pendingDeleteRowId;
                const licenseId = pendingDeleteLicenseId;

                setRowLicenses((prev) => {
                    const updatedLicenses = {
                        ...prev,
                        [rowId]: (prev[rowId] || []).filter(
                            (license) => license.id !== licenseId,
                        ),
                    };

                    // Trigger auto-save for license deletion after animation
                    if (onUpdateField) {
                        onUpdateField(
                            rowId,
                            'licenses',
                            updatedLicenses[rowId] || [],
                        );
                    }

                    return updatedLicenses;
                });

                setPendingDeleteLicenseId(null);
                setPendingDeleteRowId(null);
            }
        };

        // Complete license deletion when animations and confirmation are done
        useEffect(() => {
            if (onCompleteLicenseDeletion) {
                onCompleteLicenseDeletion();
            }
        }, [onCompleteLicenseDeletion]);

        // Expose the completion function to parent via callback
        useEffect(() => {
            if (pendingDeleteLicenseId && pendingDeleteRowId) {
                // Register the completion function
                window.completeLicenseDeletion = () => {
                    console.log(
                        '🗑️ Completing license deletion in AccountsTable:',
                        pendingDeleteLicenseId,
                    );
                    setRowLicenses((prev) => ({
                        ...prev,
                        [pendingDeleteRowId]: (
                            prev[pendingDeleteRowId] || []
                        ).filter(
                            (license) => license.id !== pendingDeleteLicenseId,
                        ),
                    }));
                    setPendingDeleteLicenseId(null);
                    setPendingDeleteRowId(null);
                    console.log('✅ License removed from rowLicenses state');
                };
            }
        }, [pendingDeleteLicenseId, pendingDeleteRowId]);

        const isLicenseFieldMissing = (
            license: License,
            field: keyof License,
        ): boolean => {
            let isMissing = false;
            switch (field) {
                case 'enterprise':
                case 'product':
                case 'service':
                case 'licenseStartDate':
                case 'licenseEndDate':
                case 'numberOfUsers':
                    isMissing = !license[field] || license[field].trim() === '';
                    break;
                case 'noticePeriodDays':
                    // Only required if renewalNotice is enabled
                    isMissing =
                        license.renewalNotice &&
                        (!license.noticePeriodDays ||
                            license.noticePeriodDays.trim() === '');
                    break;
                default:
                    isMissing = false;
            }

            // Debug logging for missing fields
            if (isMissing && showValidationErrors) {
                console.log(
                    `🔴 License field missing - License ID: ${
                        license.id
                    }, Field: ${field}, Value: "${
                        license[field] || ''
                    }", showValidationErrors: ${showValidationErrors}`,
                );
            }

            return isMissing;
        };

        // Check if a license entry is a duplicate within the same account row
        const isLicenseDuplicate = React.useCallback(
            (license: License, rowId: string): boolean => {
                const rowLicenseArray = rowLicenses[rowId] || [];

                // Only check for duplicates if all required fields are filled
                if (
                    !license.enterprise ||
                    !license.product ||
                    !license.service ||
                    !license.licenseStartDate ||
                    !license.licenseEndDate ||
                    !license.numberOfUsers
                ) {
                    return false;
                }

                // Count how many licenses have the exact same values
                const duplicateCount = rowLicenseArray.filter(
                    (otherLicense) => {
                        if (otherLicense.id === license.id) return false; // Don't compare with self

                        return (
                            otherLicense.enterprise === license.enterprise &&
                            otherLicense.product === license.product &&
                            otherLicense.service === license.service &&
                            otherLicense.licenseStartDate ===
                                license.licenseStartDate &&
                            otherLicense.licenseEndDate ===
                                license.licenseEndDate &&
                            otherLicense.numberOfUsers ===
                                license.numberOfUsers &&
                            otherLicense.renewalNotice ===
                                license.renewalNotice &&
                            otherLicense.noticePeriodDays ===
                                license.noticePeriodDays
                        );
                    },
                ).length;

                const isDuplicate = duplicateCount > 0;

                // Debug logging for duplicate detection
                if (isDuplicate && showValidationErrors) {
                    console.log(
                        `🔴 Duplicate license detected - License ID: ${license.id}, Row ID: ${rowId}`,
                    );
                    console.log(`🔴 Duplicate details:`, {
                        enterprise: license.enterprise,
                        product: license.product,
                        service: license.service,
                        startDate: license.licenseStartDate,
                        endDate: license.licenseEndDate,
                        numberOfUsers: license.numberOfUsers,
                        renewalNotice: license.renewalNotice,
                        noticePeriodDays: license.noticePeriodDays,
                    });
                }

                return isDuplicate;
            },
            [rowLicenses, showValidationErrors],
        );

        // License validation effect - notify parent when license validation state changes
        React.useEffect(() => {
            if (onLicenseValidationChange) {
                const incompleteLicenseRows: string[] = [];
                let hasIncompleteLicenses = false;

                Object.entries(rowLicenses).forEach(([rowId, licenses]) => {
                    const hasIncomplete = licenses.some((license) => {
                        // Only check for missing required fields (not duplicates)
                        // Duplicates should be visually indicated but shouldn't prevent adding new rows
                        const hasMissingFields =
                            !license.enterprise ||
                            !license.product ||
                            !license.service ||
                            !license.licenseStartDate ||
                            !license.licenseEndDate ||
                            !license.numberOfUsers ||
                            (license.renewalNotice &&
                                !license.noticePeriodDays);

                        return hasMissingFields;
                    });

                    if (hasIncomplete) {
                        incompleteLicenseRows.push(rowId);
                        hasIncompleteLicenses = true;
                    }
                });

                onLicenseValidationChange(
                    hasIncompleteLicenses,
                    incompleteLicenseRows,
                );
            }
        }, [rowLicenses, onLicenseValidationChange]);

        // Auto-expand rows with incomplete licenses when validation errors are shown
        React.useEffect(() => {
            if (
                showValidationErrors &&
                incompleteRowIds &&
                incompleteRowIds.length > 0
            ) {
                setExpandedRows((prev) => {
                    const newExpanded = new Set(prev);
                    incompleteRowIds.forEach((rowId) => {
                        newExpanded.add(rowId);
                    });
                    return newExpanded;
                });
            }
        }, [showValidationErrors, incompleteRowIds]);

        // Function to check if there are any incomplete licenses
        const hasIncompleteLicenses = () => {
            return Object.entries(rowLicenses).some(([rowId, licenses]) =>
                licenses.some((license) => {
                    // Check for missing required fields
                    const hasMissingFields =
                        !license.enterprise ||
                        !license.product ||
                        !license.service ||
                        !license.licenseStartDate ||
                        !license.licenseEndDate ||
                        !license.numberOfUsers ||
                        (license.renewalNotice && !license.noticePeriodDays);

                    // Check for duplicates
                    const isDuplicate = isLicenseDuplicate(license, rowId);

                    return hasMissingFields || isDuplicate;
                }),
            );
        };

        const [groupBy, setGroupBy] = useState<
            'none' | 'accountName' | 'masterAccount' | 'cloudType' | 'address'
        >('none');
        // sync external groupBy
        React.useEffect(() => {
            if (groupByExternal) setGroupBy(groupByExternal);
        }, [groupByExternal]);

        const columnOrder: AccountsTableProps['visibleColumns'] = useMemo(
            () => [
                // Required columns
                'accountName',
                'masterAccount',
                'cloudType',
                'address',
                'technicalUser',
                // Audit columns from DynamoDB
                'createdBy',
                'creationDate',
                'lastUpdatedBy',
                'lastUpdateDate',
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

        const colSizes = useMemo(
            () =>
                ({
                    deleteButton: '8px', // Space for delete button with proper padding
                    accountName: '200px', // Account name column - increased for label + arrows + resize handle
                    masterAccount: '200px', // Master Account column
                    cloudType: '160px', // Cloud Type column
                    address: '120px', // Address column - increased width for icon + text alignment
                    technicalUser: '140px', // Technical User column - increased width for icon + text alignment
                    createdBy: '130px', // Created By column
                    creationDate: '150px', // Creation Date column
                    lastUpdatedBy: '130px', // Last Updated By column
                    lastUpdateDate: '150px', // Last Update Date column
                    email: '220px', // Email column - increased for label + arrows + resize handle
                    phone: 'minmax(650px, 1fr)', // Phone column with flexible width - increased minimum
                } as Record<string, string>),
            [],
        );
        const [customColumns, setCustomColumns] = useState<string[]>([]);
        const [colWidths, setColWidths] = useState<Record<string, number>>({});
        const [subItems, setSubItems] = useState<Record<string, string[]>>({});

        const [pinFirst, setPinFirst] = useState(true);
        const firstColWidth = '140px'; // enforce fixed width for first column
        const gridTemplate = useMemo(() => {
            // Always include delete button column first with fixed width
            const deleteCol = '32px'; // Fixed width for delete button

            const base = cols.map((c, index) => {
                // Use dynamic width if available, otherwise fall back to default
                const dynamicWidth = colWidths[c];

                // Define minimum and maximum widths per column
                const constraints = {
                    accountName: {min: 180, max: 300}, // Increased min width to prevent arrow overlap
                    masterAccount: {min: 190, max: 310}, // Master Account column constraints
                    cloudType: {min: 160, max: 280}, // Cloud Type column constraints
                    address: {min: 120, max: 200}, // Address column constraints - increased for icon + text
                    technicalUser: {min: 140, max: 220}, // Technical User column constraints - increased for icon + text
                };

                const columnConstraints = constraints[
                    c as keyof typeof constraints
                ] || {min: 150, max: 300};

                if (dynamicWidth && dynamicWidth > 0) {
                    // For Services column, use minmax to fill remaining space
                    if (c === 'services') {
                        return `minmax(${Math.max(
                            columnConstraints.min,
                            dynamicWidth,
                        )}px, 1fr)`;
                    }
                    // Clamp the dynamic width within constraints for other columns
                    const clampedWidth = Math.max(
                        columnConstraints.min,
                        Math.min(columnConstraints.max, dynamicWidth),
                    );
                    return `${clampedWidth}px`;
                }

                // Use default size from colSizes or fallback to constraint minimum
                const defaultSize = colSizes[c];
                if (defaultSize) {
                    // For Services column, use flexible sizing to fill remaining space
                    if (c === 'services' && defaultSize === '1fr') {
                        return `minmax(${columnConstraints.min}px, 1fr)`;
                    }
                    const numericSize = parseInt(defaultSize.replace('px', ''));
                    if (!isNaN(numericSize)) {
                        const clampedSize = Math.max(
                            columnConstraints.min,
                            Math.min(columnConstraints.max, numericSize),
                        );
                        return `${clampedSize}px`;
                    }
                    return defaultSize;
                }

                // Final fallback - Services gets remaining space
                if (c === 'services') {
                    return `minmax(${columnConstraints.min}px, 1fr)`;
                }
                return `${columnConstraints.min}px`;
            });

            const custom = customColumns.map(() => '110px');
            const parts = [deleteCol, ...base, ...custom].filter(Boolean);
            return parts.join(' ');
        }, [cols, customColumns, colWidths, colSizes]);

        const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

        const handleDeleteClick = (rowId: string) => {
            if (onDelete) {
                onDelete(rowId);
            }
        };

        // ContactModal handlers for license contact details
        const handleOpenContactModal = useCallback(
            (rowId: string, licenseId: string, initialData?: Contact) => {
                console.log('📞 Opening ContactModal:', {
                    rowId,
                    licenseId,
                    initialData,
                });
                console.log('📞 Contact data in initialData:', initialData);

                // Use a function to get the current state at the time of execution
                // This ensures we get the most up-to-date state each time the function is called
                const getCurrentLicenseData = () => {
                    const currentRowLicenses =
                        rowLicensesRef.current[rowId] || [];
                    const currentLicense = currentRowLicenses.find(
                        (license) => license.id === licenseId,
                    );
                    return {
                        currentRowLicenses,
                        currentLicense,
                        mostCurrentContactData: currentLicense?.contactDetails,
                    };
                };

                const {
                    currentRowLicenses,
                    currentLicense,
                    mostCurrentContactData,
                } = getCurrentLicenseData();

                console.log(
                    '🔍 Current rowLicenses state snapshot (from ref):',
                    JSON.stringify(rowLicensesRef.current, null, 2),
                );
                console.log(
                    '🔍 Current license from rowLicenses state (immediate):',
                    currentLicense,
                );
                console.log(
                    '🔍 Most current contact data (immediate):',
                    mostCurrentContactData,
                );
                console.log('🔍 Passed initialData (immediate):', initialData);

                // CRITICAL FIX: Always prioritize ref data first, then fall back to initialData
                // This ensures we use the most up-to-date saved state, not stale render data
                let contactDataToUse: Contact;

                if (
                    mostCurrentContactData &&
                    (mostCurrentContactData.name ||
                        mostCurrentContactData.email ||
                        mostCurrentContactData.phone ||
                        mostCurrentContactData.department ||
                        mostCurrentContactData.designation)
                ) {
                    contactDataToUse = mostCurrentContactData;
                    console.log(
                        '🔍 Using most current contact data from ref state (priority #1)',
                    );
                } else if (
                    initialData &&
                    (initialData.name ||
                        initialData.email ||
                        initialData.phone ||
                        initialData.department ||
                        initialData.designation)
                ) {
                    contactDataToUse = initialData;
                    console.log(
                        '🔍 Using initialData from render (fallback #2)',
                    );
                } else {
                    contactDataToUse = {
                        id: '',
                        name: '',
                        email: '',
                        phone: '',
                        department: '',
                        designation: '',
                    };
                    console.log('🔍 Using empty defaults (fallback #3)');
                }

                console.log(
                    '🔍 Final contact data being used (immediate):',
                    contactDataToUse,
                );

                const row = localRows.find((r) => r.id === rowId);

                // Set all modal state including data before opening the modal
                // Use React 18's batching to ensure all updates happen together
                setContactModalRowId(rowId);
                setContactModalLicenseId(licenseId);
                setContactModalAccountName(row?.accountName || '');
                setContactModalMasterAccount(row?.masterAccount || '');

                // CRITICAL FIX: Ensure modal data is set with the most current contact data
                // before opening the modal to prevent stale data from being displayed
                setContactModalData([contactDataToUse]);

                // Small delay to ensure state updates are processed before opening modal
                setTimeout(() => {
                    console.log(
                        '🔍 Opening modal with contactDataToUse:',
                        contactDataToUse,
                    );
                    setShowContactModal(true);
                }, 1);
            },
            [localRows],
        ); // Remove rowLicensesRef dependency since we're using ref directly

        const handleCloseContactModal = () => {
            setShowContactModal(false);
            setContactModalData([]);
            setContactModalRowId(null);
            setContactModalLicenseId(null);
            setContactModalAccountName('');
            setContactModalMasterAccount('');
        };

        const handleContactModalSave = (contacts: Contact[]) => {
            if (!contactModalRowId || !contactModalLicenseId) return;

            // Update the license's contact details with the first contact
            const contactData =
                contacts.length > 0
                    ? contacts[0]
                    : {
                          id: generateId(),
                          name: '',
                          email: '',
                          phone: '',
                          department: '',
                          designation: '',
                      };

            setRowLicenses((prev) => {
                const rowLicenses = prev[contactModalRowId] || [];
                const updatedLicenses = rowLicenses.map((license) => {
                    if (license.id === contactModalLicenseId) {
                        return {
                            ...license,
                            contactDetails: contactData,
                        };
                    }
                    return license;
                });

                return {
                    ...prev,
                    [contactModalRowId]: updatedLicenses,
                };
            });

            handleCloseContactModal();
        };

        const handleContactModalSaveIndividual = async (
            contacts: Contact[],
        ) => {
            console.log(
                '🔍 AccountsTable: handleContactModalSaveIndividual called',
            );
            console.log('🔍 AccountsTable: contacts received:', contacts);
            console.log(
                '🔍 AccountsTable: contactModalRowId:',
                contactModalRowId,
            );
            console.log(
                '🔍 AccountsTable: contactModalLicenseId:',
                contactModalLicenseId,
            );

            if (
                !contactModalRowId ||
                !contactModalLicenseId ||
                contacts.length === 0
            ) {
                console.error(
                    '❌ AccountsTable: Missing required data for individual save',
                );
                return;
            }

            let contact = contacts[0]; // Individual save only handles one contact
            console.log(
                '💾 Saving individual contact for license:',
                contactModalLicenseId,
                'Contact:',
                contact,
            );

            try {
                // Find the current row data to preserve other fields
                const currentRow = localRows.find(
                    (r) => r.id === contactModalRowId,
                );
                if (!currentRow) {
                    console.error(
                        '❌ Current row not found for individual contact save',
                    );
                    return;
                }

                // Skip API call for temporary rows (not yet in database)
                if (!contactModalRowId.startsWith('tmp-')) {
                    // Get all licenses for this row to construct the full update
                    const currentRowLicenses =
                        rowLicenses[contactModalRowId] || [];
                    const updatedLicenses = currentRowLicenses.map(
                        (license) => {
                            if (license.id === contactModalLicenseId) {
                                return {
                                    ...license,
                                    contactDetails: contact,
                                };
                            }
                            return license;
                        },
                    );

                    // CRITICAL FIX: Update ref immediately with the saved contact data BEFORE API call
                    // This ensures the ref has the latest data if user clicks contact icon immediately after save
                    const licenseIndex =
                        rowLicensesRef.current[contactModalRowId]?.findIndex(
                            (l) => l.id === contactModalLicenseId,
                        ) ?? -1;
                    if (licenseIndex !== -1) {
                        const currentRefLicenses = [
                            ...rowLicensesRef.current[contactModalRowId],
                        ];
                        currentRefLicenses[licenseIndex] = {
                            ...currentRefLicenses[licenseIndex],
                            contactDetails: contact,
                        };

                        console.log(
                            '🔄 Pre-emptively updating ref with contact data for immediate access:',
                            contact,
                        );
                        rowLicensesRef.current = {
                            ...rowLicensesRef.current,
                            [contactModalRowId]: currentRefLicenses,
                        };
                    }

                    // Prepare the full account data for API
                    const requestData = {
                        id: contactModalRowId,
                        accountName: currentRow.accountName || '',
                        masterAccount: currentRow.masterAccount || '',
                        cloudType: currentRow.cloudType || '',
                        address: currentRow.address || '',
                        licenses: updatedLicenses,
                        technicalUsers: currentRow.technicalUsers || [],
                    };

                    console.log('🔍 Individual Contact API Request Data:', {
                        url: '/api/accounts',
                        method: 'PUT',
                        data: requestData,
                        updatedContact: contact,
                    });

                    const apiBase =
                        process.env.NEXT_PUBLIC_API_BASE ||
                        'http://localhost:4000';
                    const response = await fetch(`${apiBase}/api/accounts`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(requestData),
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error(
                            '❌ Individual Contact API Error Response:',
                            {
                                status: response.status,
                                statusText: response.statusText,
                                errorText: errorText,
                            },
                        );
                        throw new Error(
                            `Failed to save contact to API: ${response.statusText} - ${errorText}`,
                        );
                    }

                    const responseData = await response.json();
                    console.log(
                        '✅ Individual contact saved to API successfully',
                        {
                            response: responseData,
                            contactInResponse:
                                responseData?.licenses?.find(
                                    (l: any) => l.id === contactModalLicenseId,
                                )?.contactDetails || 'Not present',
                        },
                    );

                    // Check if API response contains updated contact data
                    const apiUpdatedContact = responseData?.licenses?.find(
                        (l: any) => l.id === contactModalLicenseId,
                    )?.contactDetails;
                    if (apiUpdatedContact) {
                        console.log(
                            '✅ Using API response contact data as source of truth:',
                            apiUpdatedContact,
                        );
                        contact = apiUpdatedContact; // Use API response as the authoritative data
                    }

                    // Clear localStorage backup since API now has the latest data
                    const currentLicense = currentRowLicenses.find(
                        (l) => l.id === contactModalLicenseId,
                    );
                    if (currentLicense?.stableId) {
                        const stableKey = `contact-${currentLicense.stableId}`;
                        localStorage.removeItem(stableKey);
                        console.log(
                            '🧹 Cleared localStorage backup for stable key:',
                            stableKey,
                        );
                    }
                } else {
                    console.log(
                        '⏭️ Skipping API save for temporary row:',
                        contactModalRowId,
                    );
                }
            } catch (error) {
                console.error(
                    '❌ Error saving individual contact to API:',
                    error,
                );
                // Continue with local save even if API fails
            }

            // Update local state (this is the same as the existing handleContactModalSave)
            const updatePromise = new Promise<Contact>((resolve) => {
                setRowLicenses((prev) => {
                    const rowLicenses = prev[contactModalRowId] || [];
                    const updatedLicenses = rowLicenses.map((license) => {
                        if (license.id === contactModalLicenseId) {
                            return {
                                ...license,
                                contactDetails: contact,
                            };
                        }
                        return license;
                    });

                    const newState = {
                        ...prev,
                        [contactModalRowId]: updatedLicenses,
                    };

                    // IMMEDIATELY update the ref with the new state - don't wait for useEffect
                    rowLicensesRef.current = newState;

                    console.log(
                        '🔄 setRowLicenses called, returning new state:',
                        newState,
                    );
                    console.log(
                        '🔄 Updated license with contact:',
                        updatedLicenses.find(
                            (l) => l.id === contactModalLicenseId,
                        ),
                    );
                    console.log('🔄 Ref immediately updated with new state');

                    // Save to localStorage only as backup for temporary rows or if API save might have failed
                    try {
                        const licenseToUpdate = updatedLicenses.find(
                            (l) => l.id === contactModalLicenseId,
                        );
                        if (
                            licenseToUpdate &&
                            licenseToUpdate.stableId &&
                            contactModalRowId?.startsWith('temp-')
                        ) {
                            const contactKey = `contact-${licenseToUpdate.stableId}`;
                            localStorage.setItem(
                                contactKey,
                                JSON.stringify(contact),
                            );
                            console.log(
                                '💾 Saved contact to localStorage as backup for temp row:',
                                {key: contactKey, contact},
                            );
                        } else {
                            console.log(
                                '⏭️ Skipped localStorage backup - API is source of truth for permanent rows',
                            );
                        }
                    } catch (error) {
                        console.error(
                            '❌ Error saving contact to localStorage:',
                            error,
                        );
                    }

                    // Resolve the promise with the updated contact data
                    resolve(contact);

                    return newState;
                });
            });

            // Wait for the state update to complete, then update the ref with the exact contact data
            updatePromise.then((updatedContact) => {
                console.log(
                    '🔄 Promise resolved with updated contact:',
                    updatedContact,
                );
                // Force the ref to have the updated data immediately
                if (rowLicensesRef.current[contactModalRowId]) {
                    const licenseIndex = rowLicensesRef.current[
                        contactModalRowId
                    ].findIndex((l) => l.id === contactModalLicenseId);
                    if (licenseIndex >= 0) {
                        rowLicensesRef.current[contactModalRowId][
                            licenseIndex
                        ].contactDetails = updatedContact;
                        console.log(
                            '🔄 Force-updated ref with contact data:',
                            updatedContact,
                        );
                    }
                }

                // Force a re-render by updating state again to ensure UI reflects the changes
                setTimeout(() => {
                    setRowLicenses((prev) => ({...prev}));
                    console.log('🔄 Forced re-render after contact save');
                }, 10);
            });

            // Use setTimeout to log when the state should be available and force a re-render
            setTimeout(() => {
                console.log(
                    '🔄 State should be updated now, checking rowLicenses...',
                );
                const currentLicenses = rowLicenses[contactModalRowId] || [];
                const updatedLicense = currentLicenses.find(
                    (l) => l.id === contactModalLicenseId,
                );
                console.log('🔄 License after state update:', updatedLicense);

                // Force a state update to ensure React knows about the change
                setRowLicenses((prev) => ({...prev}));

                // Additional force update to ensure all components re-render with latest data
                setTimeout(() => {
                    console.log(
                        '🔄 Second state verification after forced update...',
                    );
                    const finalCurrentLicenses =
                        rowLicenses[contactModalRowId] || [];
                    const finalUpdatedLicense = finalCurrentLicenses.find(
                        (l) => l.id === contactModalLicenseId,
                    );
                    console.log(
                        '🔄 Final license state after all updates:',
                        finalUpdatedLicense,
                    );
                }, 100);
            }, 50); // Increased timeout to ensure state is committed

            // Don't close the modal for individual saves - user might want to continue editing
            console.log('✅ Individual contact saved locally');
        };

        // removed fill down state

        const startResize = (colKey: string, e: any) => {
            e.preventDefault();
            e.stopPropagation();

            const tableContainer = e.currentTarget.closest('.grid');
            if (!tableContainer) return;

            const startX = e.clientX;
            const startWidth =
                colWidths[colKey] ||
                parseInt(colSizes[colKey]?.replace('px', '') || '140') ||
                140;

            // Define column-specific constraints
            const constraints = {
                enterprise: {min: 140, max: 250}, // Increased min to prevent arrow overlap
                product: {min: 140, max: 280}, // Reduced max to prevent over-expansion
                services: {min: 500, max: 2000}, // Increased minimum to ensure Services content visibility when scrolled
            };

            const columnConstraints = constraints[
                colKey as keyof typeof constraints
            ] || {min: 100, max: 250};

            // Add visual feedback during resize
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';

            const onMove = (ev: MouseEvent) => {
                ev.preventDefault();
                const delta = ev.clientX - startX;
                const newWidth = Math.max(
                    columnConstraints.min,
                    Math.min(columnConstraints.max, startWidth + delta),
                );

                setColWidths((prev) => ({
                    ...prev,
                    [colKey]: newWidth,
                }));

                // Trigger scroll check during resize to detect Services column visibility
                setTimeout(() => {
                    if (tableContainerRef.current) {
                        const contentWidth =
                            tableContainerRef.current.scrollWidth;
                        const containerWidth =
                            tableContainerRef.current.clientWidth;

                        // Check if Services content is getting hidden
                        const servicesColumns =
                            tableContainerRef.current.querySelectorAll(
                                '[data-col="services"]',
                            );
                        let servicesContentHidden = false;

                        servicesColumns.forEach((serviceCol) => {
                            const serviceElement = serviceCol as HTMLElement;
                            const serviceRect =
                                serviceElement.getBoundingClientRect();
                            const containerRect =
                                tableContainerRef.current!.getBoundingClientRect();

                            // Enhanced threshold based on zoom and AI panel state
                            const currentZoom = window.devicePixelRatio || 1;
                            const isZoomedIn = currentZoom > 1.1;
                            let widthThreshold = 500; // Increased base threshold for better content visibility
                            if (isZoomedIn) widthThreshold += 50;
                            if (isAIInsightsPanelOpen) widthThreshold += 50;

                            if (
                                serviceRect.right > containerRect.right ||
                                serviceRect.width < widthThreshold
                            ) {
                                servicesContentHidden = true;
                            }
                        });

                        // Enhanced scrollbar logic with zoom and AI panel considerations
                        const currentZoom = window.devicePixelRatio || 1;
                        const isZoomedIn = currentZoom > 1.1;
                        const viewportWidth = window.innerWidth;
                        const aiPanelWidth = isAIInsightsPanelOpen ? 400 : 0;
                        const availableWidth = viewportWidth - aiPanelWidth;
                        const zoomAdjustedThreshold = isZoomedIn ? 0.9 : 1.0;

                        const needsScrollbar =
                            contentWidth * zoomAdjustedThreshold >
                                containerWidth ||
                            servicesContentHidden ||
                            (isZoomedIn &&
                                contentWidth > availableWidth * 0.95) ||
                            (isAIInsightsPanelOpen &&
                                contentWidth > availableWidth * 0.9);

                        setShouldShowHorizontalScroll(needsScrollbar);
                    }
                }, 10);
            };

            const onUp = () => {
                // Remove visual feedback
                document.body.style.cursor = '';
                document.body.style.userSelect = '';

                // Final check for scrollbar need after resize is complete
                setTimeout(() => {
                    if (tableContainerRef.current) {
                        const contentWidth =
                            tableContainerRef.current.scrollWidth;
                        const containerWidth =
                            tableContainerRef.current.clientWidth;

                        // Check if Services content is hidden
                        const servicesColumns =
                            tableContainerRef.current.querySelectorAll(
                                '[data-col="services"]',
                            );
                        let servicesContentHidden = false;

                        servicesColumns.forEach((serviceCol) => {
                            const serviceElement = serviceCol as HTMLElement;
                            const serviceRect =
                                serviceElement.getBoundingClientRect();
                            const containerRect =
                                tableContainerRef.current!.getBoundingClientRect();

                            // Enhanced threshold based on zoom and AI panel state
                            const currentZoom = window.devicePixelRatio || 1;
                            const isZoomedIn = currentZoom > 1.1;
                            let widthThreshold = 500; // Increased base threshold for better content visibility
                            if (isZoomedIn) widthThreshold += 50;
                            if (isAIInsightsPanelOpen) widthThreshold += 50;

                            if (
                                serviceRect.right > containerRect.right ||
                                serviceRect.width < widthThreshold
                            ) {
                                servicesContentHidden = true;
                            }
                        });

                        // Enhanced scrollbar logic with zoom and AI panel considerations
                        const currentZoom = window.devicePixelRatio || 1;
                        const isZoomedIn = currentZoom > 1.1;
                        const viewportWidth = window.innerWidth;
                        const aiPanelWidth = isAIInsightsPanelOpen ? 400 : 0;
                        const availableWidth = viewportWidth - aiPanelWidth;
                        const zoomAdjustedThreshold = isZoomedIn ? 0.9 : 1.0;

                        const needsScrollbar =
                            contentWidth * zoomAdjustedThreshold >
                                containerWidth ||
                            servicesContentHidden ||
                            (isZoomedIn &&
                                contentWidth > availableWidth * 0.95) ||
                            (isAIInsightsPanelOpen &&
                                contentWidth > availableWidth * 0.9);

                        setShouldShowHorizontalScroll(needsScrollbar);
                    }
                }, 50);

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

        // Handle delete click - directly call parent's onDelete function

        // Use external sort state if provided, otherwise fall back to internal state
        const [internalSortCol, setInternalSortCol] = useState<
            | 'accountName'
            | 'email'
            | 'phone'
            | 'status'
            | 'servicesCount'
            | null
        >(null);
        const [internalSortDir, setInternalSortDir] = useState<
            'asc' | 'desc' | null
        >(null);

        // Listen for clear sorting events from parent component
        useEffect(() => {
            const handleClearSorting = () => {
                setInternalSortCol(null);
                setInternalSortDir(null);
            };

            window.addEventListener('clearTableSorting', handleClearSorting);

            return () => {
                window.removeEventListener(
                    'clearTableSorting',
                    handleClearSorting,
                );
            };
        }, []);

        // Use external sort state if available, otherwise use internal state
        const sortCol = externalSortColumn || internalSortCol;
        const sortDir = externalSortDirection || internalSortDir;

        const toggleSort = (
            col: 'accountName' | 'email' | 'phone' | 'status' | 'servicesCount',
            direction?: 'asc' | 'desc',
        ) => {
            let nextDir: 'asc' | 'desc';

            // Check if external sorting is actively being used (both props provided and not empty)
            const isExternalSorting =
                externalSortColumn && externalSortDirection;

            if (isExternalSorting) {
                // When external sort is actively controlled, use external state for calculation
                nextDir =
                    direction ||
                    (sortCol === col && sortDir === 'asc' ? 'desc' : 'asc');

                // Notify parent to update external sort state
                if (onSortChange) {
                    onSortChange(col, nextDir);
                }
            } else {
                // When using internal sort (including first time with no sorting)
                nextDir =
                    direction ||
                    (internalSortCol === col && internalSortDir === 'asc'
                        ? 'desc'
                        : 'asc');

                // Update internal state first (this actually sorts the table)
                setInternalSortCol(col);
                setInternalSortDir(nextDir);

                // Then notify parent to update Sort panel (for toolbar sync)
                if (onSortChange) {
                    onSortChange(col, nextDir);
                }
            }

            // Always dispatch custom event for parent component to listen to
            notifyParentSortChange(col, nextDir);
        };

        // Function to notify parent component about sort changes via custom event
        const notifyParentSortChange = (
            column: string,
            direction: 'asc' | 'desc',
        ) => {
            // Dispatch a custom event that the parent can listen to
            const event = new CustomEvent('enterpriseTableSortChange', {
                detail: {
                    column,
                    direction,
                },
                bubbles: true,
            });

            // Dispatch the event from the document to ensure it reaches the parent
            document.dispatchEvent(event);
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
                return {'All Records': displayItems};
            }

            const groups: Record<string, AccountRow[]> = {};

            displayItems.forEach((item) => {
                let groupKey = '';

                switch (groupBy) {
                    case 'accountName':
                        groupKey = item.accountName || '(No Account Name)';
                        break;
                    case 'masterAccount':
                        groupKey = item.masterAccount || '(No Master Account)';
                        break;
                    case 'cloudType':
                        groupKey = item.cloudType || '(No Cloud Type)';
                        break;
                    case 'address':
                        groupKey = item.address || '(No Address)';
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
            const sortedGroups: Record<string, AccountRow[]> = {};
            const sortedKeys = Object.keys(groups).sort((a, b) => {
                const aIsEmpty = a.startsWith('(No ');
                const bIsEmpty = b.startsWith('(No ');
                if (aIsEmpty && !bIsEmpty) return 1;
                if (!aIsEmpty && bIsEmpty) return -1;
                return a.localeCompare(b);
            });

            sortedKeys.forEach((key) => {
                sortedGroups[key] = groups[key];
            });

            return sortedGroups;
        }, [displayItems, groupBy]);

        // Hook to detect if horizontal scroll is needed based on zoom/viewport and column resizing
        const [shouldShowHorizontalScroll, setShouldShowHorizontalScroll] =
            useState(false);
        const tableContainerRef = useRef<HTMLDivElement>(null);

        useEffect(() => {
            const checkScrollNeed = () => {
                if (!tableContainerRef.current) return;

                // Get current zoom level
                const currentZoom = window.devicePixelRatio || 1;
                const baseZoom = 1;
                const zoomFactor = currentZoom / baseZoom;

                // Get viewport dimensions accounting for AI insights panel
                const viewportWidth = window.innerWidth;
                const aiPanelWidth = isAIInsightsPanelOpen ? 400 : 0; // Estimated AI panel width
                const availableWidth = viewportWidth - aiPanelWidth;

                // Check if content width exceeds container width with a larger buffer for hover effects
                const contentWidth = tableContainerRef.current.scrollWidth;
                const containerWidth = tableContainerRef.current.clientWidth;

                // Increased buffer to account for hover scale effects (scale: 1.02 = 2% increase)
                const hoverBuffer = Math.max(20, containerWidth * 0.025); // 2.5% of container width or 20px minimum

                // Only show scrollbar when content genuinely exceeds container accounting for hover effects
                const isContentOverflowing =
                    contentWidth > containerWidth + hoverBuffer;

                // Check if Services column content is actually being cut off
                const servicesColumns =
                    tableContainerRef.current.querySelectorAll(
                        '[data-col="services"]',
                    );
                let servicesContentHidden = false;

                if (servicesColumns.length > 0) {
                    servicesColumns.forEach((serviceCol) => {
                        const serviceElement = serviceCol as HTMLElement;
                        const serviceRect =
                            serviceElement.getBoundingClientRect();
                        const containerRect =
                            tableContainerRef.current!.getBoundingClientRect();

                        // More reasonable threshold - minimum 300px for services content
                        const minServicesWidth = 300;
                        const bufferZone = 15; // Additional buffer for hover effects

                        // Only trigger if Services column is actually cut off or too narrow to display content properly
                        if (
                            serviceRect.right >
                                containerRect.right - bufferZone ||
                            serviceRect.width < minServicesWidth
                        ) {
                            // Additional check: see if there's actually content being cut off
                            const servicesChips =
                                serviceElement.querySelectorAll('.inline-flex');
                            if (servicesChips.length > 0) {
                                servicesChips.forEach((chip) => {
                                    const chipRect =
                                        chip.getBoundingClientRect();
                                    // Account for hover effects in chip positioning
                                    if (
                                        chipRect.right >
                                        serviceRect.right - bufferZone
                                    ) {
                                        servicesContentHidden = true;
                                    }
                                });
                            }
                        }
                    });
                }

                // Show scrollbar only when there's genuine overflow or content is being cut off
                const needsScrollbar =
                    isContentOverflowing || servicesContentHidden;

                // Debug logging (remove in production)
                console.log('Scroll Check:', {
                    contentWidth,
                    containerWidth,
                    hoverBuffer,
                    isContentOverflowing,
                    servicesContentHidden,
                    needsScrollbar,
                });

                setShouldShowHorizontalScroll(needsScrollbar);
            };

            // Check on mount and when table structure changes
            let scrollCheckTimeout: NodeJS.Timeout;
            const debouncedScrollCheck = () => {
                clearTimeout(scrollCheckTimeout);
                scrollCheckTimeout = setTimeout(checkScrollNeed, 200); // Debounce to prevent flickering
            };

            checkScrollNeed();

            // Use ResizeObserver for better performance
            const resizeObserver = new ResizeObserver(() => {
                debouncedScrollCheck(); // Use debounced version
            });

            // Use MutationObserver to detect when Services content changes
            const mutationObserver = new MutationObserver((mutations) => {
                let shouldCheck = false;
                mutations.forEach((mutation) => {
                    // Check if Services column content changed
                    if (mutation.target instanceof Element) {
                        const servicesCol = mutation.target.closest(
                            '[data-col="services"]',
                        );
                        if (servicesCol) {
                            shouldCheck = true;
                        }
                    }
                });
                if (shouldCheck) {
                    debouncedScrollCheck(); // Use debounced version
                }
            });

            if (tableContainerRef.current) {
                resizeObserver.observe(tableContainerRef.current);
                mutationObserver.observe(tableContainerRef.current, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    attributeFilter: ['style', 'class'],
                });

                // Also observe all column cells for resize changes
                const columnCells =
                    tableContainerRef.current.querySelectorAll('[data-col]');
                columnCells.forEach((cell) => {
                    if (cell instanceof Element) {
                        resizeObserver.observe(cell);
                    }
                });
            }

            // Also listen for window resize (zoom changes)
            window.addEventListener('resize', debouncedScrollCheck);

            // Listen for zoom via keyboard shortcuts and mouse wheel
            const handleKeyZoom = (e: KeyboardEvent) => {
                if (
                    (e.ctrlKey || e.metaKey) &&
                    (e.key === '+' || e.key === '-' || e.key === '0')
                ) {
                    debouncedScrollCheck();
                }
            };

            const handleWheelZoom = (e: WheelEvent) => {
                if (e.ctrlKey || e.metaKey) {
                    debouncedScrollCheck();
                }
            };

            window.addEventListener('keydown', handleKeyZoom);
            window.addEventListener('wheel', handleWheelZoom, {passive: true});

            return () => {
                resizeObserver.disconnect();
                mutationObserver.disconnect();
                window.removeEventListener('resize', debouncedScrollCheck);
                window.removeEventListener('keydown', handleKeyZoom);
                window.removeEventListener('wheel', handleWheelZoom);
                clearTimeout(scrollCheckTimeout);
            };
        }, [gridTemplate, colWidths, isAIInsightsPanelOpen]); // Re-check when table structure or AI panel state changes

        return (
            <div className='w-full compact-table safari-tight'>
                {/* Using browser default scrollbars only */}
                <style
                    dangerouslySetInnerHTML={{
                        __html: `
                    /* Table container with proper scrolling */
                    div[role="table"] {
                        position: relative;
                        overflow-y: visible;
                        overflow-x: ${
                            shouldShowHorizontalScroll ? 'auto' : 'hidden'
                        };
                    }

                    /* Prevent horizontal scrollbars on table cells and headers (except services) */
                    [data-col]:not([data-col="services"]) {
                        overflow-x: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }

                    /* Specifically prevent scrollbars in column headers */
                    .bg-slate-50[data-col] {
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }

                    /* Header row should not have scrollbars */
                    .bg-slate-50 > div {
                        overflow: hidden !important;
                        text-overflow: ellipsis;
                    }

                    /* Ensure header content fits properly */
                    .bg-slate-50 .relative {
                        overflow: hidden;
                        min-width: 0;
                    }

                    /* Ensure proper grid layout */
                    .grid {
                        display: grid;
                    }

                    /* Services column should allow content display within bounds */
                    [data-col="services"] {
                        overflow: visible;
                        white-space: normal;
                        text-overflow: unset;
                        position: relative;
                        max-width: 600px;
                    }

                    /* Services column chips should display full text */
                    [data-col="services"] .inline-flex {
                        white-space: nowrap;
                        text-overflow: unset;
                        overflow: visible;
                        min-width: max-content;
                        flex-shrink: 0;
                    }

                    /* Services column chip text should not be truncated */
                    [data-col="services"] .inline-flex span {
                        white-space: nowrap;
                        overflow: visible;
                        text-overflow: unset;
                    }

                    /* Services column container should wrap content */
                    [data-col="services"] > div {
                        white-space: normal;
                        overflow: visible;
                        display: flex;
                        flex-wrap: wrap;
                        gap: 0.5rem;
                        position: relative;
                        max-width: 100%;
                    }

                    /* Ensure dropdowns within Services column stay within bounds */
                    [data-col="services"] .absolute {
                        max-width: 100%;
                        right: auto !important;
                    }
                    }
                        display: flex;
                        flex-wrap: wrap;
                        gap: 0.5rem;
                        max-width: 100%;
                        box-sizing: border-box;
                    }

                    /* Ensure dropdowns don't extend beyond table container */
                    .z-\\[9999\\] {
                        max-width: calc(100vw - 32px) !important;
                        max-height: calc(100vh - 100px) !important;
                        overflow: auto !important;
                    }

                    /* Table container should contain overflow */
                    [role="table"] {
                        position: relative;
                        contain: layout style;
                    }

                    /* Hide any scrollbars that might appear in header elements */
                    .bg-slate-50 {
                        overflow: hidden;
                    }
                `,
                    }}
                />

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
                                    All columns have been hidden. Use the
                                    Show/Hide button in the toolbar to select
                                    which columns to display, or click the
                                    button below to show all columns.
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
                    <div
                        ref={tableContainerRef}
                        role='table'
                        className='p-0 w-full'
                        style={{
                            overflowX: shouldShowHorizontalScroll
                                ? 'auto'
                                : 'visible',
                            overflowY: 'visible',
                            maxWidth: '100%',
                            boxSizing: 'border-box',
                        }}
                    >
                        <div
                            className='w-full relative'
                            style={{
                                minWidth: 'max(100%, 800px)', // Reduced minimum width for more compact table
                                width: '100%',
                            }}
                        >
                            {(() => {
                                const defaultLabels: Record<string, string> = {
                                    accountName: 'Account Name',
                                    masterAccount: 'Master Account',
                                    cloudType: 'Cloud Type',
                                    address: 'Address',
                                    technicalUser: 'Technical User',
                                    createdBy: 'Created By',
                                    creationDate: 'Creation Date',
                                    lastUpdatedBy: 'Last Updated By',
                                    lastUpdateDate: 'Last Update Date',
                                };

                                // Merge custom labels with defaults
                                const labelFor: Record<string, string> = {
                                    ...defaultLabels,
                                    ...customColumnLabels,
                                };

                                const iconFor: Record<string, React.ReactNode> =
                                    {
                                        accountName: <User size={14} />,
                                        masterAccount: <Building2 size={14} />,
                                        cloudType: <FileText size={14} />,
                                        address: <MapPin size={14} />,
                                        technicalUser: <User size={14} />,
                                        createdBy: <User size={14} />,
                                        creationDate: <Clock size={14} />,
                                        lastUpdatedBy: <User size={14} />,
                                        lastUpdateDate: <Clock size={14} />,
                                    };
                                return (
                                    <div
                                        className='rounded-xl border border-slate-300 shadow-sm bg-white'
                                        style={{
                                            minWidth: 'fit-content',
                                            width: '100%',
                                            maxWidth: '100%',
                                            overflow: 'hidden', // Ensure content doesn't escape the container
                                        }}
                                    >
                                        <div
                                            className='sticky top-0 z-30 grid w-full gap-0 px-0 py-3 text-xs font-bold text-slate-800 bg-slate-50 border-b border-slate-200 shadow-sm'
                                            style={{
                                                gridTemplateColumns:
                                                    gridTemplate,
                                                minWidth: 'max-content',
                                                width: '100%',
                                                display: 'grid',
                                            }}
                                        >
                                            {/* Delete Button Column Header */}
                                            <div className='relative flex items-center justify-center gap-1 px-2 py-1.5 border-r-0 min-w-0 overflow-hidden'>
                                                {/* Empty header for delete column */}
                                            </div>

                                            {cols.map((c, idx) => (
                                                <div
                                                    key={c}
                                                    className={`relative flex items-center gap-1 px-2 py-1.5 rounded-sm hover:bg-blue-50 transition-colors duration-150 group min-w-0 overflow-hidden ${
                                                        idx === 0
                                                            ? 'border-l-0'
                                                            : ''
                                                    } ${
                                                        idx === 0 &&
                                                        pinFirst &&
                                                        !shouldShowHorizontalScroll
                                                            ? 'sticky left-0 z-20 bg-slate-50 backdrop-blur-sm shadow-[6px_0_8px_-6px_rgba(15,23,42,0.10)]'
                                                            : ''
                                                    } ${
                                                        c === 'phone'
                                                            ? 'border-r-0'
                                                            : 'border-r border-slate-200' // Remove right border for Phone column
                                                    }`}
                                                    style={
                                                        c === 'phone'
                                                            ? {
                                                                  minWidth:
                                                                      '400px',
                                                              }
                                                            : undefined
                                                    } // Match Phone column minimum width
                                                >
                                                    <div className='flex items-center gap-2'>
                                                        {iconFor[c] &&
                                                            iconFor[c]}
                                                        <span>
                                                            {labelFor[c] || c}
                                                        </span>
                                                    </div>
                                                    {[
                                                        'accountName',
                                                        'masterAccount',
                                                        'cloudType',
                                                        'email',
                                                        'phone',
                                                    ].includes(c) && (
                                                        <div
                                                            className={`inline-flex items-center -space-x-1 ml-4 ${
                                                                c === 'phone'
                                                                    ? ''
                                                                    : 'absolute right-8 top-1/2 -translate-y-1/2'
                                                            }`}
                                                        >
                                                            <button
                                                                onClick={() =>
                                                                    toggleSort(
                                                                        c as any,
                                                                        'asc',
                                                                    )
                                                                }
                                                                className={`${
                                                                    sortCol ===
                                                                        c &&
                                                                    sortDir ===
                                                                        'asc'
                                                                        ? 'text-green-600 font-bold'
                                                                        : 'text-slate-400'
                                                                } transition-all duration-200 hover:text-slate-600`}
                                                            >
                                                                <ArrowUp
                                                                    size={
                                                                        sortCol ===
                                                                            c &&
                                                                        sortDir ===
                                                                            'asc'
                                                                            ? 14
                                                                            : 12
                                                                    }
                                                                />
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    toggleSort(
                                                                        c as any,
                                                                        'desc',
                                                                    )
                                                                }
                                                                className={`${
                                                                    sortCol ===
                                                                        c &&
                                                                    sortDir ===
                                                                        'desc'
                                                                        ? 'text-green-600 font-bold'
                                                                        : 'text-slate-400'
                                                                } transition-all duration-200 hover:text-slate-600`}
                                                            >
                                                                <ArrowDown
                                                                    size={
                                                                        sortCol ===
                                                                            c &&
                                                                        sortDir ===
                                                                            'desc'
                                                                            ? 14
                                                                            : 12
                                                                    }
                                                                />
                                                            </button>
                                                        </div>
                                                    )}
                                                    {/* Show resize handle for resizable columns but not for Phone (last column) */}
                                                    {[
                                                        'accountName',
                                                        'masterAccount',
                                                        'cloudType',
                                                        'address',
                                                        'email',
                                                    ].includes(c) && (
                                                        <div
                                                            onMouseDown={(
                                                                e: any,
                                                            ) =>
                                                                startResize(
                                                                    c,
                                                                    e,
                                                                )
                                                            }
                                                            className='absolute -right-1 top-0 h-full w-3 cursor-col-resize z-30 flex items-center justify-center group/resize hover:bg-blue-100/50'
                                                            title={`Resize ${
                                                                labelFor[c] || c
                                                            } column`}
                                                        >
                                                            <div className='h-6 w-0.5 bg-gradient-to-b from-blue-400 to-blue-500 rounded-full opacity-60 group-hover/resize:opacity-100 group-hover/resize:w-1 transition-all duration-150 shadow-sm' />
                                                        </div>
                                                    )}
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
                                <div className='mt-2'>
                                    {displayItems.map((r, idx) => (
                                        <div key={r.id}>
                                            <SortableAccountRow
                                                row={r}
                                                index={idx}
                                                cols={cols}
                                                gridTemplate={gridTemplate}
                                                highlightQuery={highlightQuery}
                                                onEdit={onEdit}
                                                onDelete={onDelete}
                                                customColumns={customColumns}
                                                pinFirst={pinFirst}
                                                firstColWidth={firstColWidth}
                                                isExpanded={expandedRows.has(
                                                    r.id,
                                                )}
                                                onToggle={toggleRowExpansion}
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
                                                isCellMissing={isCellMissing}
                                                compressingRowId={
                                                    compressingRowId
                                                }
                                                foldingRowId={foldingRowId}
                                                allRows={rows}
                                                expandedContent={null}
                                                onUpdateField={updateRowField}
                                                isSelected={
                                                    selectedRowId === r.id
                                                }
                                                onSelect={(id: string) =>
                                                    setSelectedRowId(id)
                                                }
                                                onStartFill={() => {}}
                                                inFillRange={false}
                                                onDeleteClick={
                                                    handleDeleteClick
                                                }
                                                shouldShowHorizontalScroll={
                                                    shouldShowHorizontalScroll
                                                }
                                                onOpenAddressModal={
                                                    onOpenAddressModal
                                                }
                                                onOpenTechnicalUserModal={
                                                    onOpenTechnicalUserModal
                                                }
                                                showValidationErrors={
                                                    showValidationErrors
                                                }
                                                incompleteRowIds={
                                                    incompleteRowIds
                                                }
                                            />
                                            {expandedRows.has(r.id) && (
                                                <div className='relative bg-gradient-to-r from-blue-50/80 to-transparent border-l-4 border-blue-400 ml-20 mt-1 mb-2'>
                                                    {/* Vertical connection line from chevron */}
                                                    <div className='absolute -left-2 top-0 bottom-0 w-px bg-blue-400'></div>

                                                    {/* License section header */}
                                                    <div className='p-3 pb-2'>
                                                        <h4 className='text-sm font-semibold text-black mb-3 flex items-center gap-2'>
                                                            <FileText className='w-4 h-4' />
                                                            Licenses for{' '}
                                                            {r.accountName ||
                                                                'Account'}
                                                        </h4>

                                                        {/* License Table Container */}
                                                        <div className='ml-6 relative overflow-x-auto'>
                                                            {/* Table Header */}
                                                            <div
                                                                className='grid gap-2 p-2 bg-blue-100/70 border border-blue-300 rounded-t-lg font-medium text-xs text-black min-w-fit'
                                                                style={{
                                                                    gridTemplateColumns:
                                                                        '24px 24px minmax(60px, 1fr) minmax(60px, 1fr) minmax(60px, 1fr) minmax(70px, 0.8fr) minmax(70px, 0.8fr) minmax(45px, 0.5fr) 40px minmax(55px, 0.5fr) minmax(60px, 0.6fr)',
                                                                }}
                                                            >
                                                                <div></div>
                                                                <div
                                                                    className='flex items-center justify-center'
                                                                    title='License Status'
                                                                >
                                                                    <Activity className='w-3 h-3 text-slate-600' />
                                                                </div>
                                                                <div>
                                                                    Enterprise
                                                                </div>
                                                                <div>
                                                                    Product
                                                                </div>
                                                                <div>
                                                                    Service
                                                                </div>
                                                                <div>
                                                                    Start Date
                                                                </div>
                                                                <div>
                                                                    End Date
                                                                </div>
                                                                <div>Users</div>
                                                                <div>
                                                                    Contact
                                                                </div>
                                                                <div>
                                                                    Renewal
                                                                </div>
                                                                <div>
                                                                    Notice
                                                                    (days)
                                                                </div>
                                                            </div>

                                                            {/* Existing License Rows */}
                                                            {(() => {
                                                                // Deduplicate licenses to prevent duplicate rendering
                                                                const allLicenses =
                                                                    rowLicenses[
                                                                        r.id
                                                                    ] || [];
                                                                const uniqueLicenses =
                                                                    allLicenses.filter(
                                                                        (
                                                                            license,
                                                                            index,
                                                                            array,
                                                                        ) =>
                                                                            array.findIndex(
                                                                                (
                                                                                    l,
                                                                                ) =>
                                                                                    l.id ===
                                                                                    license.id,
                                                                            ) ===
                                                                            index,
                                                                    );

                                                                console.log(
                                                                    `🔍 License rendering for ${r.accountName}:`,
                                                                    {
                                                                        originalCount:
                                                                            allLicenses.length,
                                                                        uniqueCount:
                                                                            uniqueLicenses.length,
                                                                        licenseIds:
                                                                            uniqueLicenses.map(
                                                                                (
                                                                                    l,
                                                                                ) =>
                                                                                    l.id,
                                                                            ),
                                                                    },
                                                                );

                                                                return uniqueLicenses.map(
                                                                    (
                                                                        license,
                                                                        index,
                                                                    ) => {
                                                                        console.log(
                                                                            `🔍 Rendering license ${index} for account ${r.accountName}:`,
                                                                            {
                                                                                licenseId:
                                                                                    license.id,
                                                                                enterprise:
                                                                                    license.enterprise,
                                                                                product:
                                                                                    license.product,
                                                                                service:
                                                                                    license.service,
                                                                            },
                                                                        );
                                                                        return (
                                                                            <div
                                                                                key={
                                                                                    license.id
                                                                                }
                                                                                className={`relative ${
                                                                                    index ===
                                                                                    uniqueLicenses.length -
                                                                                        1
                                                                                        ? 'rounded-b-lg'
                                                                                        : ''
                                                                                }`}
                                                                            >
                                                                                {/* Connection line from license row to left blue panel */}
                                                                                <div className='absolute -left-6 top-1/2 w-6 h-px bg-blue-300'></div>
                                                                                <div className='absolute -left-6 top-1/2 w-px h-4 -mt-2 bg-blue-300'></div>
                                                                                <LicenseSubRow
                                                                                    license={
                                                                                        license
                                                                                    }
                                                                                    rowId={
                                                                                        r.id
                                                                                    }
                                                                                    onUpdate={(
                                                                                        licenseId,
                                                                                        field,
                                                                                        value,
                                                                                    ) =>
                                                                                        updateLicense(
                                                                                            r.id,
                                                                                            licenseId,
                                                                                            field,
                                                                                            value,
                                                                                        )
                                                                                    }
                                                                                    onDelete={(
                                                                                        licenseId,
                                                                                    ) =>
                                                                                        deleteLicense(
                                                                                            r.id,
                                                                                            licenseId,
                                                                                        )
                                                                                    }
                                                                                    showValidationErrors={
                                                                                        showValidationErrors &&
                                                                                        licenseValidationTriggered.has(
                                                                                            r.id,
                                                                                        )
                                                                                    }
                                                                                    isLicenseFieldMissing={
                                                                                        isLicenseFieldMissing
                                                                                    }
                                                                                    isLicenseDuplicate={
                                                                                        isLicenseDuplicate
                                                                                    }
                                                                                    compressingLicenseId={
                                                                                        compressingLicenseId
                                                                                    }
                                                                                    foldingLicenseId={
                                                                                        foldingLicenseId
                                                                                    }
                                                                                    onDeleteClick={
                                                                                        onLicenseDelete
                                                                                    }
                                                                                    onDropdownOptionUpdate={
                                                                                        onDropdownOptionUpdate as any
                                                                                    }
                                                                                    onNewItemCreated={
                                                                                        onNewItemCreated as any
                                                                                    }
                                                                                    onOpenContactModal={
                                                                                        handleOpenContactModal
                                                                                    }
                                                                                    accounts={
                                                                                        rows
                                                                                    }
                                                                                    isTableRow={
                                                                                        true
                                                                                    }
                                                                                    isLastRow={
                                                                                        index ===
                                                                                        uniqueLicenses.length -
                                                                                            1
                                                                                    }
                                                                                    dropdownOptions={
                                                                                        dropdownOptions as any
                                                                                    }
                                                                                />
                                                                            </div>
                                                                        );
                                                                    },
                                                                );
                                                            })()}

                                                            {/* Add New License Button */}
                                                            <div
                                                                className='grid w-full gap-0 px-0 py-1 text-sm border-t border-slate-200 h-10 transition-colors duration-150 bg-slate-50/80 hover:bg-blue-50 cursor-pointer group'
                                                                style={{
                                                                    gridTemplateColumns:
                                                                        '30px minmax(90px, 0.6fr) minmax(90px, 0.6fr) minmax(90px, 0.6fr) minmax(80px, 0.6fr) minmax(80px, 0.6fr) 80px 50px 90px 120px',
                                                                    minWidth:
                                                                        'max-content',
                                                                    width: '100%',
                                                                }}
                                                                onClick={() => {
                                                                    // Check if main row is complete and all existing licenses are complete
                                                                    if (
                                                                        isMainRowComplete(
                                                                            r,
                                                                        ) &&
                                                                        !(
                                                                            rowLicenses[
                                                                                r
                                                                                    .id
                                                                            ] ||
                                                                            []
                                                                        ).some(
                                                                            (
                                                                                license,
                                                                            ) =>
                                                                                !license.enterprise ||
                                                                                !license.product ||
                                                                                !license.service ||
                                                                                !license.licenseStartDate ||
                                                                                !license.licenseEndDate ||
                                                                                !license.numberOfUsers ||
                                                                                (license.renewalNotice &&
                                                                                    !license.noticePeriodDays),
                                                                        )
                                                                    ) {
                                                                        addNewLicense(
                                                                            r.id,
                                                                        );
                                                                    }
                                                                }}
                                                                title={
                                                                    !isMainRowComplete(
                                                                        r,
                                                                    )
                                                                        ? 'Complete main row fields first'
                                                                        : (
                                                                              rowLicenses[
                                                                                  r
                                                                                      .id
                                                                              ] ||
                                                                              []
                                                                          ).some(
                                                                              (
                                                                                  license,
                                                                              ) =>
                                                                                  !license.enterprise ||
                                                                                  !license.product ||
                                                                                  !license.service ||
                                                                                  !license.licenseStartDate ||
                                                                                  !license.licenseEndDate ||
                                                                                  !license.numberOfUsers ||
                                                                                  (license.renewalNotice &&
                                                                                      !license.noticePeriodDays),
                                                                          )
                                                                        ? 'Complete existing licenses first'
                                                                        : 'Add new license'
                                                                }
                                                            >
                                                                {/* Empty delete button space */}
                                                                <div className='flex items-center justify-center px-2 py-1'>
                                                                    {/* No delete icon for add license row */}
                                                                </div>

                                                                {/* Add new license content spanning all columns */}
                                                                <div
                                                                    className={`flex items-center justify-start gap-2 px-2 py-1 font-medium transition-colors duration-150 ${
                                                                        !isMainRowComplete(
                                                                            r,
                                                                        ) ||
                                                                        (
                                                                            rowLicenses[
                                                                                r
                                                                                    .id
                                                                            ] ||
                                                                            []
                                                                        ).some(
                                                                            (
                                                                                license,
                                                                            ) =>
                                                                                !license.enterprise ||
                                                                                !license.product ||
                                                                                !license.service ||
                                                                                !license.licenseStartDate ||
                                                                                !license.licenseEndDate ||
                                                                                !license.numberOfUsers ||
                                                                                (license.renewalNotice &&
                                                                                    !license.noticePeriodDays),
                                                                        )
                                                                            ? 'text-slate-400 cursor-not-allowed'
                                                                            : 'text-slate-500 group-hover:text-blue-600'
                                                                    }`}
                                                                    style={{
                                                                        gridColumn: `span ${
                                                                            (
                                                                                rowLicenses[
                                                                                    r
                                                                                        .id
                                                                                ] ||
                                                                                []
                                                                            ).some(
                                                                                (
                                                                                    license,
                                                                                ) =>
                                                                                    license.renewalNotice,
                                                                            )
                                                                                ? '9'
                                                                                : '8'
                                                                        }`,
                                                                    }}
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
                                                                            strokeWidth={
                                                                                2
                                                                            }
                                                                            d='M12 4v16m8-8H4'
                                                                        />
                                                                    </svg>
                                                                    <span className='italic'>
                                                                        Add New
                                                                        License
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {/* Add New Row Button */}
                                    {onAddNewRow && (
                                        <div
                                            className='grid w-full gap-0 px-0 py-1 text-sm border-t border-slate-200 h-10 transition-colors duration-150 bg-slate-50/80 hover:bg-blue-50 cursor-pointer group'
                                            style={{
                                                gridTemplateColumns:
                                                    gridTemplate,
                                                minWidth: 'max-content',
                                                width: '100%',
                                            }}
                                            onClick={onAddNewRow}
                                            title='Add new account row'
                                        >
                                            {/* Empty delete button space */}
                                            <div className='flex items-center justify-center px-2 py-1'>
                                                {/* No delete icon for add row */}
                                            </div>

                                            {/* Add new row content spanning all columns */}
                                            <div
                                                className='flex items-center justify-start gap-2 px-2 py-1 font-medium transition-colors duration-150 text-slate-500 group-hover:text-blue-600'
                                                style={{
                                                    gridColumn: `span ${cols.length}`,
                                                }}
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
                                                        d='M12 4v16m8-8H4'
                                                    />
                                                </svg>
                                                <span className='italic'>
                                                    Add New Row
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className='space-y-4 mt-2'>
                                    {Object.entries(groupedItems).map(
                                        ([groupName, groupRows]) => (
                                            <div
                                                key={groupName}
                                                className='border border-slate-200 rounded-lg'
                                            >
                                                {/* Group Header */}
                                                <div className='bg-slate-50 px-4 py-3 border-b border-slate-200'>
                                                    <h4 className='font-semibold text-slate-900 flex items-center gap-2'>
                                                        <span>{groupName}</span>
                                                        <span className='inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-700'>
                                                            {groupRows.length}{' '}
                                                            record
                                                            {groupRows.length !==
                                                            1
                                                                ? 's'
                                                                : ''}
                                                        </span>
                                                    </h4>
                                                </div>

                                                {/* Group Rows */}
                                                <div className='border-b border-slate-200 overflow-hidden'>
                                                    {groupRows.map((r, idx) => (
                                                        <div key={r.id}>
                                                            <SortableAccountRow
                                                                row={r}
                                                                index={idx}
                                                                cols={cols}
                                                                gridTemplate={
                                                                    gridTemplate
                                                                }
                                                                highlightQuery={
                                                                    highlightQuery
                                                                }
                                                                onEdit={onEdit}
                                                                onDelete={
                                                                    onDelete
                                                                }
                                                                customColumns={
                                                                    customColumns
                                                                }
                                                                pinFirst={
                                                                    pinFirst
                                                                }
                                                                firstColWidth={
                                                                    firstColWidth
                                                                }
                                                                isExpanded={expandedRows.has(
                                                                    r.id,
                                                                )}
                                                                onToggle={
                                                                    toggleRowExpansion
                                                                }
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
                                                                foldingRowId={
                                                                    foldingRowId
                                                                }
                                                                allRows={rows}
                                                                expandedContent={
                                                                    null
                                                                }
                                                                onUpdateField={
                                                                    updateRowField
                                                                }
                                                                isSelected={
                                                                    selectedRowId ===
                                                                    r.id
                                                                }
                                                                onSelect={(
                                                                    id: string,
                                                                ) =>
                                                                    setSelectedRowId(
                                                                        id,
                                                                    )
                                                                }
                                                                onStartFill={() => {}}
                                                                inFillRange={
                                                                    false
                                                                }
                                                                onDeleteClick={
                                                                    handleDeleteClick
                                                                }
                                                                shouldShowHorizontalScroll={
                                                                    shouldShowHorizontalScroll
                                                                }
                                                                onOpenAddressModal={
                                                                    onOpenAddressModal
                                                                }
                                                                onOpenTechnicalUserModal={
                                                                    onOpenTechnicalUserModal
                                                                }
                                                                showValidationErrors={
                                                                    showValidationErrors
                                                                }
                                                                incompleteRowIds={
                                                                    incompleteRowIds
                                                                }
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ),
                                    )}

                                    {/* Add New Row Button for grouped view */}
                                    {onAddNewRow && (
                                        <div className='border border-slate-200 rounded-lg overflow-hidden mt-4'>
                                            <div
                                                className='grid w-full gap-0 px-0 py-1 text-sm h-10 transition-colors duration-150 bg-slate-50/80 hover:bg-blue-50 cursor-pointer group'
                                                style={{
                                                    gridTemplateColumns:
                                                        gridTemplate,
                                                    minWidth: 'max-content',
                                                    width: '100%',
                                                }}
                                                onClick={onAddNewRow}
                                                title='Add new account row'
                                            >
                                                {/* Empty delete button space */}
                                                <div className='flex items-center justify-center px-2 py-1'>
                                                    {/* No delete icon for add row */}
                                                </div>

                                                {/* Add new row content spanning all columns */}
                                                <div
                                                    className='flex items-center justify-start gap-2 px-2 py-1 font-medium transition-colors duration-150 text-slate-500 group-hover:text-blue-600'
                                                    style={{
                                                        gridColumn: `span ${cols.length}`,
                                                    }}
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
                                                            d='M12 4v16m8-8H4'
                                                        />
                                                    </svg>
                                                    <span className='italic'>
                                                        Add New Row
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ContactModal for license contact details */}
                <ContactModal
                    isOpen={showContactModal}
                    onClose={handleCloseContactModal}
                    onSave={handleContactModalSave}
                    onSaveIndividual={handleContactModalSaveIndividual}
                    accountName={contactModalAccountName}
                    masterAccount={contactModalMasterAccount}
                    initialContacts={contactModalData}
                />
            </div>
        );
    },
);

// Set the display name for debugging
AccountsTable.displayName = 'AccountsTable';

export default AccountsTable;
