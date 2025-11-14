'use client';

import React, {useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle, useCallback} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import './Manage_User/TableComponent.css';

import { generateId } from '@/utils/id-generator';
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
    AtSign,
    CheckCircle,
    Lock,
    Info,
    Eye,
    EyeOff,
} from 'lucide-react';
import {createPortal} from 'react-dom';
import {api} from '../utils/api';
import {accessControlApi} from '../services/accessControlApi';
import DateChipSelect from './DateChipSelect';
import ScopeConfigModal from './ScopeConfigModal';

// Utility function to generate consistent colors for user role data across the application
const getUserRoleColor = (userRoleName: string) => {
    const key = userRoleName.toLowerCase();
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
        hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    }
    
    // Blueish user role color palette - consistent across all components
    const userRoleColors = [
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
    
    return userRoleColors[hash % userRoleColors.length];
};

// Simple dropdown component for predefined values (like cloudType)
interface SimpleDropdownProps {
    value: string;
    options: Array<{ value: string; label: string }>;
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
    onTabPrev
}) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const [dropdownPosition, setDropdownPosition] = React.useState<{top: number; left: number; width: number} | null>(null);

    // Calculate dropdown position
    const calculatePosition = React.useCallback(() => {
        if (dropdownRef.current) {
            const rect = dropdownRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + 2,
                left: rect.left,
                width: Math.max(rect.width, 120)
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
    }, [isOpen]);

    // Close dropdown when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div ref={dropdownRef} className={`relative w-full ${className}`}>
            <button
                type="button"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
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
                            setHighlightedIndex(prev => 
                                prev < options.length - 1 ? prev + 1 : prev
                            );
                        }
                    } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        if (!isOpen) {
                            setIsOpen(true);
                            setHighlightedIndex(options.length - 1);
                        } else {
                            setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev);
                        }
                    } else if (e.key === 'Escape') {
                        e.preventDefault();
                        setIsOpen(false);
                        setHighlightedIndex(-1);
                    }
                }}
                className={`w-full text-left px-2 py-1 text-[11px] leading-[14px] rounded border ${isError ? 'border-red-500 bg-red-50 ring-2 ring-red-200' : 'border-blue-300 bg-white'} hover:bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 ${isError ? 'focus:ring-red-200 focus:border-red-500' : 'focus:ring-blue-200 focus:border-blue-500'} flex items-center justify-between min-h-[24px]`}
            >
                <span className="truncate flex-1 pr-1">
                    {selectedOption ? selectedOption.label : (
                        <span className="text-slate-400">{placeholder}</span>
                    )}
                </span>
                <ChevronDown 
                    size={12} 
                    className={`text-slate-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
                />
            </button>

            {isOpen && dropdownPosition && createPortal(
                <div 
                    className="fixed z-[99999] bg-white border border-gray-200 rounded-md shadow-xl"
                    style={{ 
                        top: `${dropdownPosition.top}px`,
                        left: `${dropdownPosition.left}px`,
                        width: `${dropdownPosition.width}px`,
                        maxHeight: '120px',
                        overflow: 'auto'
                    }}
                    onMouseDown={(e) => e.preventDefault()} // Prevent losing focus
                >
                    {options.map((option, index) => (
                        <button
                            key={option.value}
                            type="button"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                            }}
                            onMouseEnter={() => setHighlightedIndex(index)}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onChange(option.value);
                                setIsOpen(false);
                                setHighlightedIndex(-1);
                            }}
                            className={`w-full text-left px-2 py-1.5 text-[11px] hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors border-none ${
                                value === option.value ? 'bg-blue-100 text-blue-700' : 
                                highlightedIndex === index ? 'bg-blue-50 text-blue-700' : 'text-slate-700'
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>,
                document.body
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
            className={`w-full flex items-center px-2 py-1 text-xs font-medium ${colorClasses[color]} mr-1 mb-1 rounded`}
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
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
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

export interface userRole {
    id: string;
    roleName: string;
    description: string;
    entity: string;
    product: string;
    service: string;
    scope: string;
    isFromDatabase?: boolean; // Flag to indicate if this is an existing role from database (fields should be read-only)
}

export interface UserRoleRow {
    id: string;
    // User Role fields
    roleName: string;
    description?: string;
    entity: string;
    product: string;
    service: string;
    scope?: string;
}

// Validation functions for user group fields
const validateGroupName = (_value: string): string | null => {
    // Only required check handled during save flow; no inline validation
    return null;
};

// Real-time validation function to filter characters as user types
const filterGroupNameInput = (value: string): string => value; // No inline filtering

const validateDescription = (_value: string): string | null => {
    // No validation; field is optional
    return null;
};

// Real-time validation function to filter characters for description
const filterDescriptionInput = (value: string): string => value; // No inline filtering

const validateEntity = (_value: string): string | null => {
    // Only required check handled during save flow; no inline validation
    return null;
};

// Real-time validation function to filter characters for entity
const filterEntityInput = (value: string): string => value; // No inline filtering

const validateProduct = (_value: string): string | null => {
    // Only required check handled during save flow; no inline validation
    return null;
};

// Real-time validation function to filter characters for product
const filterProductInput = (value: string): string => value; // No inline filtering

const validateService = (_value: string): string | null => {
    // Only required check handled during save flow; no inline validation
    return null;
};

// Real-time validation function to filter characters for service
const filterServiceInput = (value: string): string => value; // No inline filtering

function InlineEditableText({
    value,
    onCommit,
    placeholder,
    isError = false,
    renderDisplay,
    className,
    dataAttr,
    type = 'text',
    onTabNext,
    onTabPrev,
    validateFn,
    errorMessage,
    filterFn,
}: {
    value: string;
    onCommit: (next: string) => void;
    placeholder?: string;
    isError?: boolean;
    renderDisplay?: (v: string) => React.ReactNode;
    className?: string;
    dataAttr?: string;
    type?: string;
    onTabNext?: () => void;
    onTabPrev?: () => void;
    validateFn?: (value: string) => string | null;
    errorMessage?: string;
    filterFn?: (value: string) => string;
}) {
    const [editing, setEditing] = React.useState(false);
    const [draft, setDraft] = React.useState<string>(value || '');
    const [validationError, setValidationError] = React.useState<string | null>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);
    
    React.useEffect(() => {
        if (!editing) {
            // Apply filter to initial value when not editing
            const filteredValue = filterFn ? filterFn(value || '') : (value || '');
            setDraft(filteredValue);
        }
    }, [value, editing]);
    React.useEffect(() => {
        if (editing) {
            inputRef.current?.focus();
            
            // Filter the draft value when entering edit mode
            if (filterFn && draft) {
                const filteredDraft = filterFn(draft);
                if (filteredDraft !== draft) {
                    setDraft(filteredDraft);
                }
            }
            
            // Validate immediately when entering edit mode if there's existing content
            if (draft && validateFn) {
                const error = validateFn(draft);
                if (error) {
                    setValidationError(error);
                }
            }
        }
    }, [editing]);

    // Clear validation error when user starts typing
    React.useEffect(() => {
        if (draft !== value && validationError) {
            setValidationError(null);
        }
    }, [draft, value, validationError]);

    const commit = () => {
        let next = (draft || '').trim();
        
        // Apply filter before validation and commit
        if (filterFn) {
            next = filterFn(next);
        }
        
        // Validate if validation function is provided
        if (validateFn) {
            const error = validateFn(next);
            if (error) {
                setValidationError(error);
                return; // Don't commit if validation fails
            }
        }
        
        if (next !== (value || '')) onCommit(next);
        setValidationError(null);
        setEditing(false);
    };
    const cancel = () => {
        setDraft(value || '');
        setEditing(false);
    };

    if (editing) {
        return (
            <div className="relative">
                <input
                    ref={inputRef}
                    type={type}
                    value={draft}
                    onInput={(e: React.FormEvent<HTMLInputElement>) => {
                        const target = e.target as HTMLInputElement;
                        const cursorPos = target.selectionStart;
                        const newValue = filterFn ? filterFn(target.value) : target.value;
                        setDraft(newValue);
                        
                        // Restore cursor position after filtering
                        setTimeout(() => {
                            if (target.selectionStart !== null && cursorPos !== null) {
                                const lengthDiff = target.value.length - newValue.length;
                                const newCursorPos = Math.max(0, cursorPos - lengthDiff);
                                target.setSelectionRange(newCursorPos, newCursorPos);
                            }
                        }, 0);
                    }}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        // Keep for compatibility but onInput should handle the filtering
                    }}
                    onBlur={() => {
                        let next = (draft || '').trim();
                        
                        // Apply filter before validation
                        if (filterFn) {
                            next = filterFn(next);
                            setDraft(next); // Update draft with filtered value
                        }
                        
                        // Validate on blur if validation function is provided
                        if (validateFn) {
                            const error = validateFn(next);
                            if (error) {
                                setValidationError(error);
                                return; // Keep editing mode if validation fails
                            }
                        }
                        
                        commit();
                    }}
                    onKeyDown={(e: any) => {
                        if (e.key === 'Enter') {
                            const next = (draft || '').trim();
                            
                            // Validate before committing on Enter
                            if (validateFn) {
                                const error = validateFn(next);
                                if (error) {
                                    setValidationError(error);
                                    return; // Don't commit if validation fails
                                }
                            }
                            
                            commit();
                        }
                        if (e.key === 'Escape') cancel();
                        if (e.key === 'Tab') {
                            e.preventDefault();
                            const next = (draft || '').trim();
                            
                            // Validate before moving to next field on Tab
                            if (validateFn) {
                                const error = validateFn(next);
                                if (error) {
                                    setValidationError(error);
                                    return; // Don't move to next field if validation fails
                                }
                            }
                            
                            if (next !== (value || '')) onCommit(next);
                            setValidationError(null);
                            setEditing(false);
                            if (e.shiftKey) onTabPrev && onTabPrev();
                            else onTabNext && onTabNext();
                        }
                    }}
                    placeholder={placeholder}
                    className={`min-w-0 w-full rounded-sm border ${(isError || validationError) ? 'border-red-500 bg-red-50 ring-2 ring-red-200' : 'border-blue-300 bg-white'} px-1 py-1 text-[12px] focus:outline-none focus:ring-2 ${(isError || validationError) ? 'focus:ring-red-200 focus:border-red-500' : 'focus:ring-blue-200 focus:border-blue-500'} ${
                        className || ''
                    }`}
                    data-inline={dataAttr || undefined}
                    title={validationError || undefined}
                />
                {validationError && (
                    <div className="absolute top-full left-0 z-50 mt-1 text-xs text-red-600 bg-white border border-red-300 rounded px-2 py-1 shadow-lg max-w-xs">
                        {validationError}
                    </div>
                )}
            </div>
        );
    }
    const isEmpty = !value || value.length === 0;
    
    // Show input immediately for empty fields (like Enterprise Configuration)
    if (editing || isEmpty) {
        return (
            <div className="relative">
                <input
                    ref={inputRef}
                    type={type}
                    value={draft}
                    onInput={(e: React.FormEvent<HTMLInputElement>) => {
                        const target = e.target as HTMLInputElement;
                        const cursorPos = target.selectionStart;
                        const newValue = filterFn ? filterFn(target.value) : target.value;
                        setDraft(newValue);
                        
                        // Restore cursor position after filtering
                        setTimeout(() => {
                            if (target.selectionStart !== null && cursorPos !== null) {
                                const lengthDiff = target.value.length - newValue.length;
                                const newCursorPos = Math.max(0, cursorPos - lengthDiff);
                                target.setSelectionRange(newCursorPos, newCursorPos);
                            }
                        }, 0);
                    }}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        // Keep for compatibility but onInput should handle the filtering
                    }}
                    onBlur={() => {
                        let next = (draft || '').trim();
                        
                        // Apply filter before validation
                        if (filterFn) {
                            next = filterFn(next);
                            setDraft(next); // Update draft with filtered value
                        }
                        
                        // Validate on blur if validation function is provided
                        if (validateFn) {
                            const error = validateFn(next);
                            if (error) {
                                setValidationError(error);
                                return; // Keep editing mode if validation fails
                            }
                        }
                        
                        commit();
                    }}
                    onFocus={() => setEditing(true)}
                    onKeyDown={(e: any) => {
                        if (e.key === 'Enter') {
                            const next = (draft || '').trim();
                            
                            // Validate before committing on Enter
                            if (validateFn) {
                                const error = validateFn(next);
                                if (error) {
                                    setValidationError(error);
                                    return; // Don't commit if validation fails
                                }
                            }
                            
                            commit();
                        }
                        if (e.key === 'Escape') cancel();
                        if (e.key === 'Tab') {
                            e.preventDefault();
                            const next = (draft || '').trim();
                            
                            // Validate before moving to next field on Tab
                            if (validateFn) {
                                const error = validateFn(next);
                                if (error) {
                                    setValidationError(error);
                                    return; // Don't move to next field if validation fails
                                }
                            }
                            
                            if (next !== (value || '')) onCommit(next);
                            setValidationError(null);
                            setEditing(false);
                            if (e.shiftKey) onTabPrev && onTabPrev();
                            else onTabNext && onTabNext();
                        }
                    }}
                    placeholder={placeholder}
                    className={`min-w-0 w-full rounded-sm border ${(isError || validationError) ? 'border-red-500 bg-red-50 ring-2 ring-red-200' : 'border-blue-300 bg-white'} px-1 py-1 text-[12px] focus:outline-none focus:ring-2 ${(isError || validationError) ? 'focus:ring-red-200 focus:border-red-500' : 'focus:ring-blue-200 focus:border-blue-500'} ${
                        className || ''
                    }`}
                    data-inline={dataAttr || undefined}
                    title={validationError || undefined}
                />
                {validationError && (
                    <div className="absolute top-full left-0 z-50 mt-1 text-xs text-red-600 bg-white border border-red-300 rounded px-2 py-1 shadow-lg max-w-xs">
                        {validationError}
                    </div>
                )}
            </div>
        );
    }
    
    // Show display mode for non-empty fields
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
            className={`w-full flex items-center gap-1 px-1.5 py-0.5 text-[11px] leading-[14px] bg-white text-black rounded-sm relative cursor-text ${
                className || ''
            }`}
            style={{width: '100%', minWidth: '100%'}}
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
                <span className='flex-1 truncate pointer-events-none'>{value || ''}</span>
            )}
        </motion.span>
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
                type="text"
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
                className="w-full flex items-center bg-white border border-blue-300 rounded-sm px-2 py-1 hover:bg-slate-50 hover:border-blue-400 transition-all duration-150 cursor-text min-h-[28px]"
                onDoubleClick={() => setEditing(true)}
                title="Double-click to enter value"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        setEditing(true);
                    }
                }}
            >
                <span className="text-[12px] text-slate-300 leading-[14px]">
                    {placeholder || ''}
                </span>
            </div>
        );
    }

    // Display the same as Enterprise Config table - simple span with hover effects
    return (
        <span
            className="group/ie inline-flex min-w-0 items-center truncate rounded-sm px-1 -mx-1 -my-0.5 hover:ring-1 hover:ring-slate-300 hover:bg-white/60 cursor-text"
            onDoubleClick={() => setEditing(true)}
            title="Double-click to edit"
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

type CatalogType = 'roleName' | 'description' | 'entity' | 'product' | 'service' | 'scope';

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
                <span className='relative z-10 block truncate pr-16'>{option.name}</span>
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

// Multi-select component specifically for user groups
function UserGroupMultiSelect({
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
        type: 'roleNames' | 'descriptions' | 'entities' | 'products' | 'services' | 'scope',
        action: 'update' | 'delete',
        oldName: string,
        newName?: string,
    ) => Promise<void>;
    onNewItemCreated?: (
        type: 'roleNames' | 'descriptions' | 'entities' | 'products' | 'services' | 'scope',
        item: {id: string; name: string},
    ) => void;
    accounts?: UserRoleRow[];
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

    // Helper function to check if a user group is in use
    const isUserGroupInUse = React.useCallback(
        (userGroupName: string): boolean => {
            if (!accounts || accounts.length === 0) return false;

            return accounts.some((account) => {
                // Since user groups are not restricted, always return false
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

    // Parse selected user groups from comma-separated string
    const selectedUserGroups = React.useMemo(() => {
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

    // Helper function to remove a user group
    const removeUserGroup = React.useCallback((userGroupToRemove: string) => {
        const newServices = selectedUserGroups.filter((s: string) => s !== userGroupToRemove);
        onChange(newServices.join(', '));
    }, [selectedUserGroups, onChange]);

    // Helper function to toggle a user group selection
    const toggleUserGroup = React.useCallback((userGroupName: string) => {
        const isSelected = selectedUserGroups.includes(userGroupName);
        let newServices;
        if (isSelected) {
            newServices = selectedUserGroups.filter((s: string) => s !== userGroupName);
        } else {
            newServices = [...selectedUserGroups, userGroupName];
        }
        onChange(newServices.join(', '));
    }, [selectedUserGroups, onChange]);

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
                `/api/userGroups${
                    query ? `?search=${encodeURIComponent(query)}` : ''
                }`,
            );
            // Filter out already selected user groups
            const filteredData = (data || []).filter(
                (option: any) => !selectedUserGroups.includes(option.name),
            );
            setOptions(filteredData);
        } catch (_e) {
            setOptions([]);
        } finally {
            setLoading(false);
        }
    }, [query, selectedUserGroups]);

    React.useEffect(() => {
        if (!open) return;
        loadOptions();
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect && typeof window !== 'undefined') {
            // Find table container for better positioning
            const tableContainer = containerRef.current?.closest('[role="table"]') || 
                                  containerRef.current?.closest('.overflow-auto') ||
                                  document.body;
            const tableRect = tableContainer.getBoundingClientRect();
            
            const width = 256;
            // Constrain within table bounds
            const tableRightBound = tableRect.right - width - 16;
            const maxLeft = Math.min(tableRightBound, window.innerWidth - width - 16);
            const minLeft = Math.max(tableRect.left + 16, 16);
            const left = Math.max(minLeft, Math.min(maxLeft, rect.left));
            
            const tableBottomBound = Math.min(tableRect.bottom - 50, window.innerHeight - 200);
            const top = Math.min(tableBottomBound, rect.bottom + 8);
            setDropdownPos({top, left, width});
        }
    }, [open, loadOptions]);

    // Position the more services dropdown
    React.useEffect(() => {
        if (showMoreServices && moreServicesRef.current) {
            const rect = moreServicesRef.current.getBoundingClientRect();
            
            // Find the table container to ensure dropdown stays within table bounds
            const tableContainer = moreServicesRef.current.closest('[role="table"]') || 
                                  moreServicesRef.current.closest('.overflow-auto') ||
                                  document.body;
            const tableRect = tableContainer.getBoundingClientRect();
            
            // Calculate width with stricter table container constraints
            const maxWidth = Math.min(280, tableRect.width * 0.4, window.innerWidth * 0.3);
            const width = Math.max(180, Math.min(maxWidth, rect.width));
            
            // Ensure dropdown stays strictly within table container horizontally
            const idealLeft = rect.left;
            const tableRightBound = tableRect.right - width - 16; // More margin from table edge
            const maxLeft = Math.min(tableRightBound, window.innerWidth - width - 16);
            const minLeft = Math.max(tableRect.left + 16, 16); // More margin from table edge
            const left = Math.max(minLeft, Math.min(maxLeft, idealLeft));
            
            // Ensure dropdown stays within both table and viewport vertically
            const tableBottomBound = Math.min(tableRect.bottom - 50, window.innerHeight - 200);
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
                    const nextRowDiv = document.querySelector(`[data-row-id="${nextRowId}"][data-col="enterprise"]`);
                    const nextInput = nextRowDiv?.querySelector('input') as HTMLInputElement;
                    
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
                    const currentRowDiv = currentElement.closest('[data-row-id]');
                    const currentRowId = currentRowDiv?.getAttribute('data-row-id');
                    
                    if (currentRowId) {
                        // Find the next row (increment the row number)
                        const currentRowNum = parseInt(currentRowId);
                        const nextRowId = (currentRowNum + 1).toString();
                        
                        // Find the enterprise column in the next row
                        const nextRowDiv = document.querySelector(`[data-row-id="${nextRowId}"][data-col="enterprise"]`);
                        const nextInput = nextRowDiv?.querySelector('input') as HTMLInputElement;
                        
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
                    toggleUserGroup(existingItem.name);
                    
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
                            const nextRowDiv = document.querySelector(`[data-row-id="${nextRowId}"][data-col="enterprise"]`);
                            const nextInput = nextRowDiv?.querySelector('input') as HTMLInputElement;
                            
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
        const isSelected = selectedUserGroups.includes(serviceName);
        let newServices;
        if (isSelected) {
            newServices = selectedUserGroups.filter((s: string) => s !== serviceName);
        } else {
            newServices = [...selectedUserGroups, serviceName];
        }
        onChange(newServices.join(', '));
    };

    const removeService = (serviceName: string) => {
        const newServices = selectedUserGroups.filter((s: string) => s !== serviceName);
        onChange(newServices.join(', '));
    };

    return (
        <div
            ref={containerRef}
            className='relative flex items-center gap-1 group/item'
        >
            <div className='flex items-center gap-1'>
                {selectedUserGroups
                    .slice(0, visibleCount)
                    .map((service: string, index: number) => {
                        // Use consistent color function
                        const colorTheme = getUserRoleColor(service);
                        
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
                                className='w-full flex items-center gap-1 px-1.5 py-0.5 text-[11px] leading-[14px] bg-white text-black rounded-sm relative'
                                title={service}
                            >
                                <span className='flex-1'>{service}</span>
                                <button
                                    onClick={() => removeService(service)}
                                    className='hover:text-slate-900 opacity-0 group-hover/item:opacity-100 transition-opacity flex-shrink-0 p-0.5 rounded-sm'
                                    aria-label='Remove'
                                    style={{minWidth: '20px', minHeight: '20px'}}
                                >
                                    <X size={12} />
                                </button>
                            </motion.span>
                        );
                    })}
                {selectedUserGroups.length > visibleCount && (
                    <div className='relative'>
                        <button
                            ref={moreServicesRef}
                            onClick={(e: any) => {
                                e.stopPropagation();
                                setShowMoreServices(!showMoreServices);
                            }}
                            className='w-full flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-semibold leading-tight border bg-slate-50 text-slate-600 border-slate-200 flex-shrink-0 cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition-colors min-w-[40px] justify-center'
                        >
                            +{selectedUserGroups.length - visibleCount}
                        </button>
                        
                        {/* Dropdown for additional services */}
                        {showMoreServices && moreServicesPos && 
                            createPortal(
                                <div
                                    className='bg-white border border-slate-200 rounded-lg shadow-lg max-w-xs min-w-48'
                                    onMouseDown={(e: any) => e.stopPropagation()}
                                    onClick={(e: any) => e.stopPropagation()}
                                    style={{
                                        position: 'fixed',
                                        top: Math.min(moreServicesPos.top, window.innerHeight - 200),
                                        left: Math.min(moreServicesPos.left, window.innerWidth - 250),
                                        width: Math.min(moreServicesPos.width, 240),
                                        maxWidth: '240px'
                                    }}
                                >
                                    <div className='p-3'>
                                        <div className='text-xs font-medium text-slate-700 mb-2'>
                                            Additional User Groups ({selectedUserGroups.length - visibleCount})
                                        </div>
                                        <div className='space-y-1 max-h-32 overflow-y-auto'>
                                            {selectedUserGroups.slice(visibleCount).map((userGroup, idx) => {
                                                const colorTheme = getUserRoleColor(userGroup);
                                                return (
                                                    <div 
                                                        key={`additional-${idx}`}
                                                        className='flex items-center group/additional w-full'
                                                    >
                                                        <span className='w-full flex items-center gap-1 px-1.5 py-0.5 text-[11px] leading-[14px] bg-white text-black rounded-sm relative'>
                                                            {userGroup}
                                                        </span>
                                                        <button
                                                            onClick={() => {
                                                                removeUserGroup(userGroup);
                                                                // Close dropdown if no more Additional User Groups
                                                                if (selectedUserGroups.length - 1 <= visibleCount) {
                                                                    setShowMoreServices(false);
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
                                document.body
                            )
                        }
                    </div>
                )}
                
                {/* Show input field when no services selected OR when actively adding more OR when there's an error */}
                {selectedUserGroups.length === 0 || open || isError ? (
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
                            const navigateToNextRow = (currentElement: HTMLInputElement) => {
                                // Find the closest div with data-col attribute (current column)
                                const currentColDiv = currentElement.closest('[data-col]');
                                const currentRowId = currentColDiv?.getAttribute('data-row-id');
                                
                                if (currentRowId) {
                                    // For services column, move to next row's first column (enterprise)
                                    // Find next row by looking for the next row ID
                                    const allRows = document.querySelectorAll('[data-row-id]');
                                    const currentRowIndex = Array.from(allRows).findIndex(row => 
                                        row.getAttribute('data-row-id') === currentRowId
                                    );
                                    
                                    // Find next row's enterprise column
                                    const nextRowElements = Array.from(allRows).slice(currentRowIndex + 1);
                                    const nextEnterpriseCol = nextRowElements.find(row => 
                                        row.getAttribute('data-col') === 'enterprise'
                                    );
                                    const nextInput = nextEnterpriseCol?.querySelector('input') as HTMLInputElement;
                                    
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
                                const exactMatch = options.find(opt => 
                                    opt.name.toLowerCase() === query.toLowerCase().trim()
                                );
                                
                                if (exactMatch) {
                                    // Add existing service and navigate
                                    toggleService(exactMatch.name);
                                    setQuery('');
                                    setOpen(false);
                                    navigateToNextRow(e.target as HTMLInputElement);
                                } else {
                                    // Create new service (same logic as addNew function)
                                    try {
                        const created = await api.post<{ id: string; name: string; }>('/api/userGroups', {
                            name: query.trim(),
                        });
                        if (created) {
                                            setOptions((prev) => {
                                                const exists = prev.some((o) => o.id === created!.id);
                                                return exists ? prev : [...prev, created!];
                                            });
                                            // Add the new service to selection
                                            toggleUserGroup(created.name);
                                            setQuery('');
                                            setOpen(false);
                                            
                                            // Navigate to next row
                                            navigateToNextRow(e.target as HTMLInputElement);

                                            // Notify parent component about the new item
                                            if (onNewItemCreated) {
                                                onNewItemCreated('services', created);
                                            }
                                        }
                                    } catch (error: any) {
                                        // Handle duplicate error from backend
                                        if (error?.message?.includes('already exists') || error?.message?.includes('duplicate')) {
                                            // Try to find the existing item and add it to selection
                                            const existingItem = options.find(
                                                (opt) => opt.name.toLowerCase() === query.toLowerCase(),
                                            );
                                            if (existingItem) {
                                                toggleUserGroup(existingItem.name);
                                                setQuery('');
                                                setOpen(false);
                                                navigateToNextRow(e.target as HTMLInputElement);
                                            }
                                        }
                                    }
                                }
                            } else if (e.key === 'Tab' && query.trim()) {
                                // Check for exact match in all options when Tab is pressed
                                const exactMatch = options.find(opt => 
                                    opt.name.toLowerCase() === query.toLowerCase().trim()
                                );
                                if (exactMatch) {
                                    e.preventDefault(); // Prevent default Tab behavior
                                    e.stopPropagation(); // Stop event bubbling
                                    
                                    // Add the service first
                                    toggleService(exactMatch.name);
                                    setQuery('');
                                    setOpen(false);
                                    
                                    // Navigate to next row
                                    navigateToNextRow(e.target as HTMLInputElement);
                                } else {
                                    // No exact match found - prevent Tab and show message to use Enter or Add button
                                    e.preventDefault(); // Prevent default Tab behavior
                                    e.stopPropagation(); // Stop event bubbling
                                    // Keep focus on current field
                                }
                            } else if (e.key === 'Escape') {
                                setOpen(false);
                                setQuery('');
                            }
                        }}
                        className={`w-32 text-left px-1 py-0.5 text-[12px] rounded border ${isError ? 'border-red-500 bg-red-50 ring-2 ring-red-200' : 'border-blue-300 bg-white hover:bg-slate-50'} focus:outline-none focus:ring-2 ${isError ? 'focus:ring-red-200 focus:border-red-500' : 'focus:ring-blue-200 focus:border-blue-500'} transition-colors`}
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
                        className={`w-full text-left px-2 py-1 text-[12px] rounded border ${isError ? 'border-red-500 bg-red-50 ring-2 ring-red-200' : 'border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100'} transition-colors ${isError ? 'text-red-700 hover:bg-red-100' : 'text-slate-500 hover:text-slate-700'}`}
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
                            maxWidth: '300px'
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
                                        query.trim() &&
                                        !hasExactMatch;

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
                                                        // Silently handle error
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
                                            selectedUserGroups.includes(opt.name);
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
                                                isInUse={isUserGroupInUse(
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
                                                            selectedUserGroups.includes(
                                                                opt.name,
                                                            )
                                                        ) {
                                                            const updatedServices =
                                                                selectedUserGroups.map(
                                                                    (s: string) =>
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
                                                        // Error updating service
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
                                                            selectedUserGroups.includes(
                                                                opt.name,
                                                            )
                                                        ) {
                                                            const updatedServices =
                                                                selectedUserGroups.filter(
                                                                    (s: string) =>
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
                                                        // Error deleting service
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
                                                        onChange={(e: any) =>
                                                            setAdding(
                                                                e.target.value,
                                                            )
                                                        }
                                                        onKeyDown={(e: any) => {
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
                        )}
                    </div>,
                    document.body,
                )}
        </div>
    );
}

// Chip component with X button on hover
function ChipDisplay({
    value,
    onRemove,
    onEdit,
    className,
}: {
    value: string;
    onRemove: () => void;
    onEdit?: () => void;
    className?: string;
}) {
    if (!value || value.length === 0) {
        return (
            <div 
                className={`w-full flex items-center px-2 py-1 text-[11px] leading-[14px] bg-white text-slate-300 rounded-sm border border-blue-300 cursor-text min-h-[28px] ${className || ''}`}
                onClick={onEdit}
            >
                <span>Double-click to enter value</span>
            </div>
        );
    }

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
            className={`group/chip w-full inline-flex items-center gap-1 px-2 py-1 text-[11px] leading-[14px] bg-white text-black rounded-sm relative ${className || ''}`}
            style={{width: '100%', minWidth: '100%'}}
            title={value}
            onDoubleClick={onEdit}
            tabIndex={0}
        >
            <span className='flex-1 truncate pointer-events-none'>{value}</span>
            <button
                onClick={(e: any) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onRemove();
                }}
                className='hover:text-slate-900 opacity-0 group-hover/chip:opacity-100 transition-opacity p-0.5 rounded-sm hover:bg-blue-100 flex-shrink-0'
                aria-label='Remove'
                style={{minWidth: '20px', minHeight: '20px'}}
            >
                <X size={12} />
            </button>
        </motion.span>
    );
}

// Editable Chip Input - simple input that converts to chip
function EditableChipInput({
    value,
    onCommit,
    onRemove,
    isError = false,
    className,
    dataAttr,
    placeholder,
    onTabNext,
    onTabPrev,
}: {
    value: string;
    onCommit: (next: string) => void;
    onRemove: () => void;
    isError?: boolean;
    className?: string;
    dataAttr?: string;
    placeholder?: string;
    onTabNext?: () => void;
    onTabPrev?: () => void;
}) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState<string>(value || '');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!editing) {
            setDraft(value || '');
        }
    }, [value, editing]);

    useEffect(() => {
        if (editing) {
            inputRef.current?.focus();
        }
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

    return (
        <div
            className='relative min-w-0 flex items-center gap-1 group/item'
            style={{maxWidth: '100%', width: '100%'}}
        >
            <div className='relative w-full flex items-center gap-1' style={{width: '100%', minWidth: '100%'}}>
                {(editing || !value || value.length === 0) ? (
                    <div className="relative w-full" style={{padding: '2px', margin: '-2px'}}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onBlur={commit}
                            onKeyDown={(e: any) => {
                                if (e.key === 'Enter') {
                                    commit();
                                } else if (e.key === 'Escape') {
                                    cancel();
                                } else if (e.key === 'Tab') {
                                    e.preventDefault();
                                    commit();
                                    if (e.shiftKey && onTabPrev) {
                                        onTabPrev();
                                    } else if (!e.shiftKey && onTabNext) {
                                        onTabNext();
                                    }
                                }
                            }}
                            className={`min-w-0 w-full rounded-sm border ${isError ? 'border-red-500 bg-red-50 ring-2 ring-red-200' : 'border-blue-300 bg-white'} px-1 py-1 text-[12px] focus:outline-none focus:ring-2 ${isError ? 'focus:ring-red-200 focus:border-red-500' : 'focus:ring-blue-200 focus:border-blue-500'} ${
                                className || ''
                            }`}
                            data-inline={dataAttr || undefined}
                            placeholder=""
                        />
                    </div>
                ) : (
                    <ChipDisplay
                        value={value}
                        onRemove={onRemove}
                        onEdit={() => setEditing(true)}
                        className={className}
                    />
                )}
            </div>
        </div>
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
    onFocus,
    inputType = 'text',
}: {
    type: CatalogType;
    value?: string;
    onChange: (next?: string) => void;
    placeholder?: string;
    isError?: boolean;
    compact?: boolean;
    onFocus?: () => void;
    inputType?: 'text' | 'password';
    onDropdownOptionUpdate?: (
        type: 'roleNames' | 'descriptions' | 'entities' | 'products' | 'services' | 'scope',
        action: 'update' | 'delete',
        oldName: string,
        newName?: string,
    ) => Promise<void>;
    onNewItemCreated?: (
        type: 'roleNames' | 'descriptions' | 'entities' | 'products' | 'services' | 'scope',
        item: {id: string; name: string},
    ) => void;
    accounts?: UserRoleRow[];
    currentRowId?: string;
    currentRowEnterprise?: string;
    currentRowProduct?: string;
    dropdownOptions?: {
        roleNames: Array<{id: string; name: string}>;
        descriptions: Array<{id: string; name: string}>;
        entities: Array<{id: string; name: string}>;
        products: Array<{id: string; name: string}>;
        services: Array<{id: string; name: string}>;
        scope: Array<{id: string; name: string}>;
    };
    onTabNext?: () => void;
    onTabPrev?: () => void;
}) {
    const [open, setOpen] = React.useState(false);
    const [current, setCurrent] = React.useState<string | undefined>(value);
    const [query, setQuery] = React.useState('');
    const [options, setOptions] = React.useState<{id: string; name: string}[]>(
        [],
    );
    const [allOptions, setAllOptions] = React.useState<{id: string; name: string}[]>(
        [],
    );
    const [loading, setLoading] = React.useState(false);
    const [adding, setAdding] = React.useState('');
    const [showAdder, setShowAdder] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Helper function to check if an option is in use (with composite key constraint)
    const isOptionInUse = React.useCallback(
        (optionName: string): boolean => {
            if (!accounts || accounts.length === 0) return false;

            return accounts.some((account) => {
                // Skip the current row being edited
                if (currentRowId && account.id === currentRowId) {
                    return false;
                }

                if (type === 'roleName') {
                    // Never filter group names - show all options
                    return false;
                } else if (type === 'entity') {
                    // Never filter entities - show all options
                    return false;
                } else if (type === 'product') {
                    // Never filter products - show all options
                    return false;
                } else if (type === 'service') {
                    // Never filter services - show all options
                    return false;
                }
                return false;
            });
        },
        [accounts, type, currentRowId],
    );

    const containerRef = React.useRef<HTMLDivElement>(null);
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const [dropdownPosition, setDropdownPosition] = React.useState<'below' | 'above'>('below');
    const [dropdownPortalPos, setDropdownPortalPos] = React.useState<{
        top: number;
        left: number;
        width: number;
    } | null>(null);
    // Portal-based dropdown to avoid table clipping

    // Function to calculate optimal dropdown position
    const calculateDropdownPosition = React.useCallback(() => {
        if (!containerRef.current) return;
        
        const containerRect = containerRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        const dropdownHeight = 300; // Max height of dropdown
        const spaceBelow = viewportHeight - containerRect.bottom;
        const spaceAbove = containerRect.top;
        
        // Find the table container to ensure dropdown stays within table bounds
        const tableContainer = containerRef.current.closest('.compact-table') ||
                              containerRef.current.closest('[role="table"]') || 
                              containerRef.current.closest('.rounded-xl') ||
                              containerRef.current.closest('.overflow-auto') ||
                              containerRef.current.closest('.w-full.compact-table') ||
                              document.querySelector('.compact-table') ||
                              document.body;
        const tableRect = tableContainer.getBoundingClientRect();
        
        // Calculate portal position with table container constraints
        const maxWidth = Math.min(120, tableRect.width - 64, viewportWidth - 64); // Reduced to match dropdown width
        const width = Math.max(100, Math.min(maxWidth, containerRect.width));
        
        // Ensure dropdown stays within table container horizontally with more padding
        const idealLeft = containerRect.left;
        const maxLeft = Math.min(tableRect.right - width - 32, viewportWidth - width - 32); // More padding
        const minLeft = Math.max(tableRect.left + 32, 32); // More padding
        const left = Math.max(minLeft, Math.min(maxLeft, idealLeft));
        
        // Prefer below if there's enough space, otherwise use above if there's really no space
        // For user group fields, always prefer below unless there's really no space
        let top;
        const forceBelow = type === 'entity' || type === 'product' || type === 'service' || type === 'description' || type === 'roleName' || type === 'scope';
        
        if (forceBelow && spaceBelow >= 100) {
            // For status fields, show below if there's at least 100px space
            setDropdownPosition('below');
            top = containerRect.bottom + 4;
        } else if (spaceBelow >= dropdownHeight || (spaceBelow >= spaceAbove && spaceBelow >= 150)) {
            setDropdownPosition('below');
            top = containerRect.bottom + 4;
            // Ensure it doesn't go below table bounds
            if (top + dropdownHeight > tableRect.bottom) {
                top = Math.max(tableRect.top + 10, containerRect.top - dropdownHeight - 4);
                setDropdownPosition('above');
            }
        } else {
            setDropdownPosition('above');
            top = Math.max(tableRect.top + 10, containerRect.top - dropdownHeight - 4);
        }
        
        // Final constraint to ensure dropdown is within table bounds
        top = Math.max(top, tableRect.top + 10);
        top = Math.min(top, tableRect.bottom - 100);
        
        setDropdownPortalPos({ top, left, width });
    }, [type]);

    // Calculate position when dropdown opens
    React.useEffect(() => {
        if (open) {
            calculateDropdownPosition();
            // Recalculate on scroll or resize
            const handleReposition = () => calculateDropdownPosition();
            window.addEventListener('scroll', handleReposition, true);
            window.addEventListener('resize', handleReposition);
            return () => {
                window.removeEventListener('scroll', handleReposition, true);
                window.removeEventListener('resize', handleReposition);
            };
        }
    }, [open, calculateDropdownPosition]);

    // Separate function to load all options (called once when dropdown opens)
    const loadAllOptions = React.useCallback(async () => {
        setLoading(true);
        try {
            let allData: Array<{id: string; name: string}> = [];
            
            // Use dropdownOptions if available for roleName
            if (type === 'roleName' && dropdownOptions?.roleNames) {
                allData = dropdownOptions.roleNames;
            } else if (type === 'description' && dropdownOptions?.descriptions) {
                allData = dropdownOptions.descriptions;
            } else if (type === 'entity' && dropdownOptions?.entities) {
                allData = dropdownOptions.entities;
            } else if (type === 'product' && dropdownOptions?.products) {
                allData = dropdownOptions.products;
            } else if (type === 'service' && dropdownOptions?.services) {
                allData = dropdownOptions.services;
            } else if (type === 'scope' && dropdownOptions?.scope) {
                allData = dropdownOptions.scope;
            } else if (type === 'roleName') {
                // Build groups URL with account filter (enterprise filter makes backend too restrictive)
                // Get values from localStorage
                const selectedAccountId = typeof window !== 'undefined' ? window.localStorage.getItem('selectedAccountId') : null;
                const selectedAccountName = typeof window !== 'undefined' ? window.localStorage.getItem('selectedAccountName') : null;
                const selectedEnterpriseId = typeof window !== 'undefined' ? window.localStorage.getItem('selectedEnterpriseId') : null;
                const selectedEnterprise = typeof window !== 'undefined' ? window.localStorage.getItem('selectedEnterpriseName') : null;
                
                let rolesUrl = '/api/user-management/roles';
                const params = new URLSearchParams();
                if (selectedAccountId) params.append('accountId', selectedAccountId);
                if (selectedAccountName) params.append('accountName', selectedAccountName);
                if (selectedEnterpriseId) params.append('enterpriseId', selectedEnterpriseId);
                if (selectedEnterprise) params.append('enterpriseName', selectedEnterprise);
                if (params.toString()) rolesUrl += `?${params.toString()}`;

                const response = await api.get<Array<{id: string; name: string; roleName?: string}>>(rolesUrl) || [];
                allData = response.map((item: any) => ({
                    id: item.id || item.roleId || String(Math.random()),
                    name: item.name || item.roleName || ''
                })).filter((item: any) => item.name);
            } else if (type === 'entity') {
                allData = await api.get<Array<{id: string; name: string}>>(
                    '/api/entities',
                ) || [];
            } else if (type === 'product') {
                allData = await api.get<Array<{id: string; name: string}>>(
                    '/api/products',
                ) || [];
            } else if (type === 'service') {
                allData = await api.get<Array<{id: string; name: string}>>(
                    '/api/services',
                ) || [];
            } else {
                // Default empty
                allData = [];
            }
            
            setAllOptions(allData);
        } catch (error) {
            setAllOptions([]);
        } finally {
            setLoading(false);
        }
    }, [type, dropdownOptions]);

    // Function to filter options based on current query and other criteria
    const filterOptions = React.useCallback(() => {
        if (allOptions.length === 0) return;

        let filtered = allOptions;

        // Apply search filter
        if (query) {
            const queryLower = query.toLowerCase();
            filtered = filtered.filter(opt => 
                opt.name.toLowerCase().startsWith(queryLower)
            );
            
            // Sort filtered results: exact matches first, then alphabetical
            filtered = filtered.sort((a, b) => {
                const aLower = a.name.toLowerCase();
                const bLower = b.name.toLowerCase();
                
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
    }, [allOptions, query]);

    // Load options when dropdown opens
    React.useEffect(() => {
        if (open && allOptions.length === 0) {
            loadAllOptions();
        }
    }, [open, allOptions.length, loadAllOptions]);

    // Load groupName options immediately on mount if needed
    React.useEffect(() => {
        if (type === 'roleName' && allOptions.length === 0) {
            loadAllOptions();
        }
    }, [type, allOptions.length, loadAllOptions]);

    // Remove unused effect for email filtering
    // React.useEffect was here for email/account filtering - no longer needed

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
            if (type === 'roleName') {
                // DON'T create database record immediately - just add to local dropdown options
                // The actual database record will be created when Save button is clicked
                created = { id: `temp-groupname-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, name };
            } else if (type === 'description') {
                // Description is free text, no API creation needed
                onChange(name);
                setShowAdder(false);
                setAdding('');
                setQuery('');
                setOpen(false);
                return;
            } else if (type === 'entity') {
                created = await api.post<{id: string; name: string}>(
                    '/api/entities',
                    {name},
                );
            } else if (type === 'product') {
                created = await api.post<{id: string; name: string}>(
                    '/api/products',
                    {name},
                );
            } else if (type === 'service') {
                created = await api.post<{id: string; name: string}>(
                    '/api/services',
                    {name},
                );
            } else if (type === 'scope') {
                // Roles are managed separately
                return;
            } else {
                // Default - just accept the value
                onChange(name);
                setShowAdder(false);
                setAdding('');
                setQuery('');
                setOpen(false);
                return;
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
                if (onNewItemCreated && created) {
                    const typeMap: Record<string, string> = {
                        'roleName': 'roleNames',
                        'description': 'descriptions',
                        'entity': 'entities',
                        'product': 'products',
                        'service': 'services',
                        'scope': 'scope'
                    };
                    
                    const dropdownType = typeMap[type as string] || 'roleNames';
                    onNewItemCreated(dropdownType as any, created);
                }
            }
        } catch (error: any) {
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
    }, [value]);

    // Debug logging for groupName
    React.useEffect(() => {
        if (type === 'roleName') {
        }
    }, [type, allOptions]);

    const sizeClass = compact ? 'text-[11px] py-0.5' : 'text-[12px] py-1';
    return (
        <div
            ref={containerRef}
            className='relative min-w-0 flex items-center gap-1 group/item'
            style={{maxWidth: '100%'}}
        >
            <div className='relative w-full flex items-center gap-1' style={{width: '100%'}}>
                {/* Show selected value as chip when there's a value and not actively typing */}
                {(current || value) && !open && (
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
                        className={`w-full flex items-center gap-1 px-2 py-1 text-[11px] leading-[14px] rounded-sm relative ${isError ? 'border border-red-500 bg-red-50 ring-2 ring-red-200 text-red-900' : 'bg-white text-black'}`}
                        style={{width: '100%', minWidth: '100%'}}
                        title={`Double-click to edit: ${current || value}`}
                        onDoubleClick={(e: any) => {
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
                    >
                        <span className='flex-1 truncate pointer-events-none'>
                            {current || value}
                        </span>
                        <button
                            onClick={(e: any) => {
                                e.stopPropagation();
                                e.preventDefault();
                                onChange('');
                                setCurrent('');
                                setQuery('');
                            }}
                            className='hover:text-slate-900 opacity-0 group-hover/item:opacity-100 transition-opacity p-0.5 rounded-sm hover:bg-blue-100 flex-shrink-0'
                            aria-label='Remove'
                            style={{minWidth: '20px', minHeight: '20px'}}
                        >
                            <X size={12} />
                        </button>
                    </motion.span>
                )}
                
                {/* Show input when no value selected or actively typing */}
                {(!current && !value) || open ? (
                    <div className="relative w-full">
                        <input
                            ref={inputRef}
                            type={inputType}
                            value={query}
                            onChange={(e: any) => {
                                const newValue = e.target.value;
                                setQuery(newValue);
                                
                                // Only open dropdown when typing if there are options to show
                                if (allOptions.length > 0) {
                                    setOpen(true);
                                }
                                
                                // Don't load options if dropdown is disabled (empty options array)
                                
                                // Clear current selection if user clears the input completely
                                if (newValue === '') {
                                    onChange('');
                                    setCurrent('');
                                }
                            }}
                            onBlur={(e: any) => {
                                // Create chip from entered text when focus is lost
                                const newValue = query.trim();
                                if (newValue) {
                                    onChange(newValue);
                                    setCurrent(newValue);
                                    setQuery('');
                                }
                                setOpen(false);
                            }}
                            onFocus={(e) => {
                                // Call custom focus handler first (for validation blocking)
                                if (onFocus) {
                                    // This will handle the focus validation and potentially show modal
                                    onFocus();
                                    // The modal handling will return focus to the appropriate field
                                }
                                
                                // Only open dropdown on focus if there are options to show
                                if (allOptions.length > 0) {
                                    setOpen(true);
                                }
                                
                                // Don't load options if dropdown is disabled (empty options array)
                                if (false) {
                                    loadAllOptions();
                                }
                            }}
                            onKeyDown={async (e: any) => {
                                if (e.key === 'Enter' || e.key === 'Tab') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    
                                    // Save current value immediately
                                    const newValue = query.trim();
                                    if (newValue) {
                                        onChange(newValue);
                                        setQuery('');
                                        setOpen(false);
                                    }
                                    
                                    // Use provided tab navigation functions
                                    setTimeout(() => {
                                        if (e.key === 'Tab' && e.shiftKey && onTabPrev) {
                                            onTabPrev(); // Previous field (Shift+Tab)
                                        } else if (onTabNext) {
                                            onTabNext(); // Next field (Tab or Enter)
                                        }
                                    }, 10);
                                } else if (e.key === 'Escape') {
                                    setOpen(false);
                                    setQuery('');
                                }
                            }}
                            className={`w-full text-left px-2 pr-8 ${sizeClass} rounded border ${isError ? 'border-red-500 bg-red-50 ring-2 ring-red-200' : 'border-blue-300 bg-white hover:bg-slate-50'} text-slate-700 focus:outline-none focus:ring-2 ${isError ? 'focus:ring-red-200 focus:border-red-500' : 'focus:ring-blue-200 focus:border-blue-500'} font-normal`}
                            style={{fontWeight: '400', fontFamily: 'inherit', fontStyle: 'normal'}}
                            placeholder=''
                        />
                    </div>
                ) : null}
            </div>
            
            {/* Full Autocomplete Dropdown - Portal Based */}
            {open && dropdownPortalPos && allOptions.length > 0 && createPortal(
                <div 
                    ref={dropdownRef}
                    className='rounded-xl border border-slate-200 bg-white shadow-2xl'
                    onMouseDown={(e: any) => e.stopPropagation()}
                    onClick={(e: any) => e.stopPropagation()}
                    style={{
                        position: 'fixed',
                        top: `${dropdownPortalPos.top}px`,
                        left: `${dropdownPortalPos.left}px`,
                        width: 'max-content',
                        minWidth: `${dropdownPortalPos.width}px`,
                        maxWidth: '500px',
                        zIndex: 10000
                    }}
                >
                    <div className="absolute -top-2 left-6 h-3 w-3 rotate-45 bg-white border-t border-l border-slate-200"></div>
                    <div className='relative z-10 flex flex-col'>
                        <div className='py-1 text-[12px] px-3 space-y-2 overflow-y-auto' style={{maxHeight: '200px'}}>
                            {loading ? (
                                <div className='px-3 py-2 text-slate-500 text-center'>
                                    Loading…
                                </div>
                            ) : (
                                (() => {
                                    // Filter options that match the query (show all if no query)
                                    const filteredOptions = query.trim() 
                                        ? options.filter(opt => 
                                            opt.name.toLowerCase().startsWith(query.toLowerCase()) ||
                                            opt.name.toLowerCase().includes(query.toLowerCase())
                                        ).sort((a, b) => {
                                            const aLower = a.name.toLowerCase();
                                            const bLower = b.name.toLowerCase();
                                            const queryLower = query.toLowerCase();
                                            
                                            // Prioritize starts with matches
                                            const aStartsWith = aLower.startsWith(queryLower);
                                            const bStartsWith = bLower.startsWith(queryLower);
                                            
                                            if (aStartsWith && !bStartsWith) return -1;
                                            if (bStartsWith && !aStartsWith) return 1;
                                            
                                            return aLower.localeCompare(bLower);
                                        })
                                        : options.slice(0, 50); // Show first 50 options if no query to avoid performance issues
                                    
                                    
                                    // Check if query exactly matches an existing option
                                    const exactMatch = query.trim() && allOptions.length > 0 ? allOptions.find(opt => 
                                        opt.name.toLowerCase() === query.toLowerCase().trim()
                                    ) : null;
                                    
                                    // Show + button if query is entered and no exact match
                                    const showCreateNew = query.trim() && (allOptions.length === 0 || !exactMatch);

                                    return (
                                        <>
                                            {filteredOptions.map((opt, idx) => {
                                                const palette = [
                                                    { bg: 'bg-blue-100', hover: 'hover:bg-blue-200', text: 'text-blue-700' },
                                                    { bg: 'bg-cyan-100', hover: 'hover:bg-cyan-200', text: 'text-cyan-700' },
                                                    { bg: 'bg-sky-100', hover: 'hover:bg-sky-200', text: 'text-sky-700' },
                                                    { bg: 'bg-indigo-100', hover: 'hover:bg-indigo-200', text: 'text-indigo-700' },
                                                ];
                                                const tone = palette[idx % palette.length];
                                                
                                                return (
                                                    <motion.div
                                                        key={opt.id}
                                                        initial={{scale: 0.98, opacity: 0}}
                                                        animate={{scale: 1, opacity: 1}}
                                                        whileHover={{scale: 1.02, y: -1}}
                                                        transition={{type: 'spring', stiffness: 400, damping: 25}}
                                                        className='relative group'
                                                    >
                                                        <div
                                                            className={`w-full rounded-lg px-3 py-2.5 ${tone.bg} ${tone.hover} ${tone.text} transition-all duration-200 font-medium shadow-sm hover:shadow-md relative overflow-visible flex items-center justify-between cursor-pointer`}
                                                            style={{wordBreak: 'keep-all', whiteSpace: 'nowrap'}}
                                                            onClick={() => {
                                                                onChange(opt.name);
                                                                setCurrent(opt.name);
                                                                setQuery('');
                                                                setOpen(false);
                                                            }}
                                                        >
                                                            <span className='relative z-10 flex-1'>{opt.name}</span>
                                                            <div className='absolute inset-0 bg-gradient-to-r from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200' />
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                            
                                            {/* Add button inside scrollable area */}
                                            {showCreateNew && (
                                                <motion.div
                                                    initial={{scale: 0.98, opacity: 0}}
                                                    animate={{scale: 1, opacity: 1}}
                                                    className='mt-2 border-t border-slate-200 pt-2'
                                                >
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            addNew();
                                                        }}
                                                        className='w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 transition-colors duration-150 rounded-lg'
                                                        type='button'
                                                    >
                                                        + Add &quot;{query.trim()}&quot;
                                                    </button>
                                                </motion.div>
                                            )}
                                            
                                            {/* Show "No results" message */}
                                            {filteredOptions.length === 0 && !showCreateNew && allOptions.length > 0 && (
                                                <div className='px-3 py-2 text-slate-500 text-center'>
                                                    No matches
                                                </div>
                                            )}
                                            
                                            {/* Show empty state */}
                                            {filteredOptions.length === 0 && !query.trim() && !loading && allOptions.length === 0 && (
                                                <div className='px-3 py-2 text-slate-500 text-center'>
                                                    No value found
                                                </div>
                                            )}
                                        </>
                                    );
                                })()
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )
        }
        </div>
    );
}

// AsyncChipSelect for Role Name with dropdown and + sign for new values
function AsyncChipSelectRoleName({
    value,
    onChange,
    placeholder = '',
    isError = false,
    userGroups = [],
    onNewItemCreated,
    selectedAccountId,
    selectedAccountName,
    selectedEnterpriseId,
    selectedEnterprise,
}: {
    value?: string;
    onChange: (next?: string) => void;
    placeholder?: string;
    isError?: boolean;
    userGroups?: UserRoleRow[];
    onNewItemCreated?: (item: {id: string; name: string}) => void;
    selectedAccountId?: string;
    selectedAccountName?: string;
    selectedEnterpriseId?: string;
    selectedEnterprise?: string;
}) {
    const [open, setOpen] = useState(false);
    const [current, setCurrent] = useState<string | undefined>(value);
    const [query, setQuery] = useState('');
    const [options, setOptions] = useState<Array<{id: string; name: string}>>([]);
    const [allOptions, setAllOptions] = useState<Array<{id: string; name: string}>>([]);
    const [loading, setLoading] = useState(false);
    const [hasPendingNewValue, setHasPendingNewValue] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [dropdownPortalPos, setDropdownPortalPos] = useState<{
        top: number;
        left: number;
        width: number;
    } | null>(null);

    // Load options from database API - exactly like AssignedUserGroupTable
    const loadAllOptions = useCallback(async () => {
        console.log('🔄 [RoleName] loadAllOptions called');
        setLoading(true);
        try {
            // Build URL with account/enterprise filters when available
            let rolesUrl = '/api/user-management/roles';
            const params = new URLSearchParams();
            if (selectedAccountId) params.append('accountId', selectedAccountId);
            if (selectedAccountName) params.append('accountName', selectedAccountName || '');
            if (selectedEnterpriseId) params.append('enterpriseId', selectedEnterpriseId);
            if (selectedEnterprise) params.append('enterpriseName', selectedEnterprise || '');
            if (params.toString()) rolesUrl += `?${params.toString()}`;

            console.log('📡 [RoleName] Calling API:', rolesUrl);
            const allData = await api.get<Array<{id: string; name: string}>>(rolesUrl) || [];
            console.log(`✅ [RoleName] API call successful, got ${allData.length} items:`, allData);
            // Transform the data to match expected format if needed
            const transformedData = allData.map((item: any) => ({
                id: item.id || item.roleId || String(Math.random()),
                name: item.name || item.roleName || item.role || ''
            })).filter((item: any) => item.name); // Filter out items without names
            
            // Get distinct role names only (remove duplicates)
            const uniqueRoleNames = new Map<string, {id: string; name: string}>();
            transformedData.forEach((item: any) => {
                const lowerName = item.name.toLowerCase();
                if (!uniqueRoleNames.has(lowerName)) {
                    uniqueRoleNames.set(lowerName, item);
                }
            });
            const distinctData = Array.from(uniqueRoleNames.values());
            
            // Filter out role names that are already used in the current table
            // This prevents duplicate role names within the same account/enterprise
            const usedRoleNames = new Set(
                userGroups
                    .map(ug => ug.roleName?.toLowerCase().trim())
                    .filter(name => name) // Remove empty/null names
            );
            
            const availableData = distinctData.filter(item => 
                !usedRoleNames.has(item.name.toLowerCase().trim())
            );
            
            console.log(`📋 [RoleName] Total roles: ${transformedData.length}, Distinct role names: ${distinctData.length}`);
            console.log(`📋 [RoleName] Already used in table: ${usedRoleNames.size}`);
            console.log(`📋 [RoleName] Available (unused) role names: ${availableData.length}`);
            console.log(`📋 [RoleName] Available role names for dropdown:`, availableData.map(d => d.name));
            setAllOptions(availableData);
        } catch (error) {
            console.error('❌ [RoleName] API call failed:', error);
            // Don't set empty array - keep previous data if any
            // This way, if API fails but user types, showCreateNew will still be true
            setAllOptions([]);
        } finally {
            setLoading(false);
            console.log('🏁 [RoleName] loadAllOptions completed, loading set to false');
        }
    }, [selectedAccountId, selectedAccountName, selectedEnterpriseId, selectedEnterprise, userGroups]);

    // Check if query is a new value
    const isNewValuePending = useCallback((queryValue: string): boolean => {
        if (!queryValue.trim()) return false;
        const exactMatch = allOptions.find(opt => 
            opt.name.toLowerCase() === queryValue.toLowerCase().trim()
        );
        return !exactMatch;
    }, [allOptions]);

    useEffect(() => {
        setHasPendingNewValue(isNewValuePending(query));
    }, [query, isNewValuePending]);

    // Calculate dropdown position - simple positioning
    const calculateDropdownPosition = useCallback(() => {
        if (!containerRef.current) return;
        
        const containerRect = containerRef.current.getBoundingClientRect();
        const width = Math.max(140, Math.min(200, containerRect.width));
        const top = containerRect.bottom + 2;
        const left = containerRect.left;
        
        setDropdownPortalPos({ top, left, width });
    }, []);

    useEffect(() => {
        if (open) {
            calculateDropdownPosition();
            const handleReposition = () => calculateDropdownPosition();
            window.addEventListener('scroll', handleReposition, true);
            window.addEventListener('resize', handleReposition);
            return () => {
                window.removeEventListener('scroll', handleReposition, true);
                window.removeEventListener('resize', handleReposition);
            };
        }
    }, [open, calculateDropdownPosition]);

    useEffect(() => {
        if (open && allOptions.length === 0) {
            loadAllOptions();
        }
    }, [open, allOptions.length, loadAllOptions]);

    useEffect(() => {
        setCurrent(value);
    }, [value]);

    useEffect(() => {
        const onDoc = (e: MouseEvent) => {
            const target = e.target as Node;
            const withinAnchor = !!containerRef.current?.contains(target);
            const withinDropdown = !!dropdownRef.current?.contains(target);
            if (!withinAnchor && !withinDropdown) {
                setOpen(false);
            }
        };
        document.addEventListener('click', onDoc, true);
        return () => document.removeEventListener('click', onDoc, true);
    }, []);

    // Filter options - exactly like AssignedUserGroupTable
    const filterOptions = useCallback(() => {
        console.log('🔍 [RoleName] filterOptions called', { allOptionsLength: allOptions.length, query });
        if (allOptions.length === 0) {
            console.log('⚠️ [RoleName] allOptions is empty, setting options to []');
            setOptions([]);
            return;
        }
        let filtered = allOptions;
        
        // Don't filter out already selected group names - allow users to select existing group names
        // Duplicate prevention happens during save validation (checking Group Name + Entity + Product + Service)
        console.log(`🔍 [RoleName] Starting with ${filtered.length} options from API`);
        
        // Apply search filter
        if (query) {
            const queryLower = query.toLowerCase();
            filtered = filtered.filter(opt => 
                opt.name.toLowerCase().startsWith(queryLower)
            );
            console.log(`🔍 [RoleName] After startsWith filter (${queryLower}): ${filtered.length} items`, filtered);
            
            // Sort filtered results: exact matches first, then alphabetical - exactly like AssignedUserGroupTable
            filtered = filtered.sort((a, b) => {
                const aLower = a.name.toLowerCase();
                const bLower = b.name.toLowerCase();
                
                // Exact match comes first
                if (aLower === queryLower && bLower !== queryLower) return -1;
                if (bLower === queryLower && aLower !== queryLower) return 1;
                
                // Otherwise alphabetical order
                return aLower.localeCompare(bLower);
            });
        }
        
        console.log(`✅ [RoleName] Setting options to ${filtered.length} filtered items`);
        setOptions(filtered);
    }, [allOptions, query]);

    useEffect(() => {
        filterOptions();
    }, [filterOptions]);

    const addNew = async () => {
        const name = (query || '').trim();
        if (!name) return;

        // Check if role name is already used in the current table (duplicate check)
        const isDuplicateInTable = userGroups.some(
            ug => ug.roleName?.toLowerCase().trim() === name.toLowerCase()
        );
        
        if (isDuplicateInTable) {
            console.log('❌ [RoleName] Duplicate role name detected in table:', name);
            alert(`Role name "${name}" already exists in the table. Please use a different name.`);
            return;
        }

        // Check for existing entries (case-insensitive) - exactly like AssignedUserGroupTable
        const existingMatch = allOptions.find(
            (opt) => opt.name.toLowerCase() === name.toLowerCase(),
        );

        if (existingMatch) {
            // If exact match exists, select it instead of creating new
            onChange(existingMatch.name);
            setCurrent(existingMatch.name);
            setQuery('');
            setOpen(false);
            setHasPendingNewValue(false);
            return;
        }

        try {
            // DO NOT create role in database immediately - just set the value locally
            // The role will be created when the full row is saved (with all mandatory fields)
            console.log('➕ [RoleName] Setting new role name (NOT creating in DB yet):', name);
            console.log('📦 [RoleName] Role will be created when row is saved with all mandatory fields');
            
            // Just set the value locally without creating in database
            onChange(name);
            setCurrent(name);
            setQuery('');
            setOpen(false);
            setHasPendingNewValue(false);
            
            // Focus the chip after setting value so Tab navigation works
            setTimeout(() => {
                try {
                    // Find the chip element (which now has tabIndex=0 and is focusable)
                    if (inputRef.current) {
                        // inputRef should now point to the chip (motion.span)
                        if (inputRef.current.tagName === 'SPAN' || inputRef.current.getAttribute('tabindex') !== null) {
                            inputRef.current.focus();
                            console.log('🎯 [RoleName] Focused chip after setting value');
                        } else {
                            // If inputRef is still the input, find the chip
                            const chipElement = containerRef.current?.querySelector('span[tabindex="0"]') as HTMLElement;
                            if (chipElement) {
                                chipElement.focus();
                                console.log('🎯 [RoleName] Focused chip after setting value (found via querySelector)');
                            }
                        }
                    }
                } catch (e) {
                    console.log('🎯 [RoleName] Error focusing chip after setting value:', e);
                }
            }, 100); // Small delay to ensure React state updates are complete
        } catch (error: any) {
            console.error('❌ [RoleName] Failed to set role name:', error);
            alert(`Failed to set role name: ${error.message || 'Unknown error'}`);
        }
    };

    return (
        <div
            ref={containerRef}
            className='relative min-w-0 flex items-center gap-1 group/item'
            style={{maxWidth: '100%', width: '100%'}}
        >
            <div className='relative w-full flex items-center gap-1' style={{width: '100%', minWidth: '100%'}}>
                {(current || value) && !open ? (
                    <motion.span
                        ref={inputRef}
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
                        className='w-full inline-flex items-center gap-1 px-2 py-1 text-[11px] leading-[14px] bg-white text-black rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500'
                        style={{width: '100%', minWidth: '100%', maxWidth: '100%'}}
                        title={current || value}
                        tabIndex={0}
                        onClick={(e: any) => {
                            if (!(e.target as HTMLElement).closest('button')) {
                                setQuery(current || value || '');
                                setOpen(true);
                            }
                        }}
                        onKeyDown={(e: any) => {
                            // Handle Tab navigation from the chip to next field (Description) - exactly like AssignedUserGroupTable
                            if (e.key === 'Tab') {
                                e.preventDefault();
                                e.stopPropagation();
                                
                                // Find the current row and navigate to Description field
                                const currentElement = e.target as HTMLElement;
                                const currentColDiv = currentElement.closest('[data-col]');
                                const currentRowId = currentColDiv?.getAttribute('data-row-id');
                                
                                if (currentRowId) {
                                    // Find the Description field in the same row
                                    const nextColDiv = document.querySelector(`[data-row-id="${currentRowId}"][data-col="description"]`);
                                    
                                    if (nextColDiv) {
                                        // Find the input or chip element in the Description field
                                        const descriptionInput = nextColDiv.querySelector('input') as HTMLInputElement;
                                        const descriptionChip = nextColDiv.querySelector('span[tabindex="0"]') as HTMLElement;
                                        
                                        // Focus the input if available, otherwise the chip
                                        const targetElement = descriptionInput || descriptionChip;
                                        
                                        if (targetElement) {
                                            setTimeout(() => {
                                                targetElement.focus();
                                            }, 10);
                                        }
                                    }
                                }
                            }
                        }}
                    >
                        <span className='flex-1 truncate pointer-events-none'>{current || value}</span>
                        <button
                            onClick={(e: any) => {
                                e.stopPropagation();
                                e.preventDefault();
                                onChange('');
                                setCurrent('');
                                setQuery('');
                            }}
                            className='hover:text-slate-900 opacity-0 group-hover/item:opacity-100 transition-opacity p-0.5 rounded-sm hover:bg-blue-100 flex-shrink-0'
                            aria-label='Remove'
                            style={{minWidth: '20px', minHeight: '20px'}}
                        >
                            <X size={12} />
                        </button>
                    </motion.span>
                ) : null}
                
                {(!current && !value) || open ? (
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={(e: any) => {
                            const newValue = e.target.value;
                            console.log('⌨️ [RoleName] onChange:', { newValue, allOptionsLength: allOptions.length, open });
                            setQuery(newValue);
                            // Always open dropdown when typing to show options or + button
                            console.log('📂 [RoleName] Setting open to true');
                            setOpen(true);
                            // Calculate position immediately
                            if (containerRef.current) {
                                const containerRect = containerRef.current.getBoundingClientRect();
                                const width = Math.max(140, Math.min(200, containerRect.width));
                                const top = containerRect.bottom + 2;
                                const left = containerRect.left;
                                console.log('📍 [RoleName] Setting dropdown position:', { top, left, width });
                                setDropdownPortalPos({ top, left, width });
                            }
                            // Reload options to exclude already-used group names
                            console.log('📥 [RoleName] Reloading options to filter out used group names');
                            loadAllOptions();
                            // Clear current selection if user clears the input completely
                            if (newValue === '') {
                                onChange('');
                                setCurrent('');
                            }
                        }}
                        onFocus={() => {
                            console.log('👁️ [RoleName] onFocus:', { allOptionsLength: allOptions.length, open, query });
                            setOpen(true);
                            // Calculate position immediately on focus
                            if (containerRef.current) {
                                const containerRect = containerRef.current.getBoundingClientRect();
                                const width = Math.max(140, Math.min(200, containerRect.width));
                                const top = containerRect.bottom + 2;
                                const left = containerRect.left;
                                console.log('📍 [RoleName] Setting dropdown position on focus:', { top, left, width });
                                setDropdownPortalPos({ top, left, width });
                            }
                            // Always reload options on focus to exclude already-used group names
                            console.log('📥 [RoleName] Reloading options on focus to filter out used group names');
                            loadAllOptions();
                        }}
                        onKeyDown={async (e: any) => {
                            if (e.key === 'Enter' && query.trim()) {
                                e.preventDefault(); // Prevent form submission
                                e.stopPropagation(); // Stop event bubbling
                                
                                // Check for exact match first - exactly like AssignedUserGroupTable
                                const exactMatch = allOptions.find(opt => 
                                    opt.name.toLowerCase() === query.toLowerCase().trim()
                                );
                                
                                if (exactMatch) {
                                    // Double-check for duplicate (safeguard)
                                    const isDuplicate = userGroups.some(
                                        ug => ug.roleName?.toLowerCase().trim() === exactMatch.name.toLowerCase().trim()
                                    );
                                    
                                    if (isDuplicate) {
                                        console.log('❌ [RoleName] Cannot select duplicate role name:', exactMatch.name);
                                        alert(`Group name "${exactMatch.name}" already exists in the table. Please use a different name.`);
                                        setQuery('');
                                        setOpen(false);
                                        return;
                                    }
                                    
                                    // Select existing value
                                    onChange(exactMatch.name);
                                    setCurrent(exactMatch.name);
                                    setQuery('');
                                    setOpen(false);
                                    setHasPendingNewValue(false);
                                    
                                    // Focus the chip after selecting existing value so Tab navigation works - exactly like AssignedUserGroupTable
                                    setTimeout(() => {
                                        try {
                                            // Find the chip element (which now has tabIndex=0 and is focusable)
                                            if (inputRef.current) {
                                                // inputRef should now point to the chip (motion.span)
                                                if (inputRef.current.tagName === 'SPAN' || inputRef.current.getAttribute('tabindex') !== null) {
                                                    inputRef.current.focus();
                                                    console.log('🎯 [RoleName] Focused chip after Enter on existing value');
                                                } else {
                                                    // If inputRef is still the input, find the chip
                                                    const chipElement = containerRef.current?.querySelector('span[tabindex="0"]') as HTMLElement;
                                                    if (chipElement) {
                                                        chipElement.focus();
                                                        console.log('🎯 [RoleName] Focused chip after Enter on existing value (found via querySelector)');
                                                    }
                                                }
                                            }
                                        } catch (e) {
                                            console.log('🎯 [RoleName] Error focusing chip after Enter on existing value:', e);
                                        }
                                    }, 100); // Small delay to ensure React state updates are complete
                                } else {
                                    // Create new entry (same logic as Add button) - exactly like AssignedUserGroupTable
                                    await addNew();
                                }
                            } else if (e.key === 'Escape') {
                                setOpen(false);
                                setQuery('');
                            } else if (e.key === 'Tab') {
                                // Check if user has entered a new value that doesn't exist - exactly like AssignedUserGroupTable
                                if (query.trim() && hasPendingNewValue) {
                                    // Prevent Tab navigation - user must click + button first
                                    e.preventDefault();
                                    e.stopPropagation();
                                    
                                    // Focus back on the input and show dropdown if not already open
                                    if (!open) {
                                        setOpen(true);
                                    }
                                    inputRef.current?.focus();
                                    return;
                                }
                                
                                // If existing value, allow Tab to navigate - exactly like AssignedUserGroupTable
                                if (query.trim()) {
                                    const exactMatch = allOptions.find(opt => 
                                        opt.name.toLowerCase() === query.toLowerCase().trim()
                                    );
                                    if (exactMatch) {
                                        // Double-check for duplicate (safeguard)
                                        const isDuplicate = userGroups.some(
                                            ug => ug.roleName?.toLowerCase().trim() === exactMatch.name.toLowerCase().trim()
                                        );
                                        
                                        if (isDuplicate) {
                                            console.log('❌ [RoleName] Cannot select duplicate role name:', exactMatch.name);
                                            alert(`Group name "${exactMatch.name}" already exists in the table. Please use a different name.`);
                                            e.preventDefault();
                                            setQuery('');
                                            setOpen(false);
                                            return;
                                        }
                                        
                                        onChange(exactMatch.name);
                                        setCurrent(exactMatch.name);
                                        setQuery('');
                                        setOpen(false);
                                        setHasPendingNewValue(false);
                                        
                                        // Focus the chip after selecting existing value so Tab navigation works - exactly like AssignedUserGroupTable
                                        setTimeout(() => {
                                            try {
                                                // Find the chip element (which now has tabIndex=0 and is focusable)
                                                const chipElement = containerRef.current?.querySelector('span[tabindex="0"]') as HTMLElement;
                                                if (chipElement) {
                                                    chipElement.focus();
                                                    console.log('🎯 [RoleName] Focused chip after Tab on existing value');
                                                    
                                                    // Now trigger Tab navigation to next field - exactly like AssignedUserGroupTable
                                                    setTimeout(() => {
                                                        const currentElement = chipElement;
                                                        const currentColDiv = currentElement.closest('[data-col]');
                                                        const currentRowId = currentColDiv?.getAttribute('data-row-id');
                                                        
                                                        if (currentRowId) {
                                                            // Find the Description field in the same row
                                                            const nextColDiv = document.querySelector(`[data-row-id="${currentRowId}"][data-col="description"]`);
                                                            
                                                            if (nextColDiv) {
                                                                // Find the input or chip element in the Description field
                                                                const descriptionInput = nextColDiv.querySelector('input') as HTMLInputElement;
                                                                const descriptionChip = nextColDiv.querySelector('span[tabindex="0"]') as HTMLElement;
                                                                
                                                                // Focus the input if available, otherwise the chip
                                                                const targetElement = descriptionInput || descriptionChip;
                                                                
                                                                if (targetElement) {
                                                                    targetElement.focus();
                                                                }
                                                            }
                                                        }
                                                    }, 50);
                                                }
                                            } catch (e) {
                                                console.log('🎯 [RoleName] Error focusing chip after Tab on existing value:', e);
                                            }
                                        }, 100);
                                    }
                                } else {
                                    setOpen(false);
                                    setHasPendingNewValue(false);
                                }
                            }
                        }}
                        onBlur={(e) => {
                            // Check if the blur is due to clicking within the dropdown - exactly like AssignedUserGroupTable
                            const relatedTarget = e.relatedTarget as HTMLElement;
                            const isClickingInDropdown = dropdownRef.current?.contains(relatedTarget);
                            
                            // If user has a pending new value and they're not clicking in dropdown, prevent blur
                            if (query.trim() && hasPendingNewValue && !isClickingInDropdown) {
                                // Prevent the field from losing focus if there's a pending new value
                                e.preventDefault();
                                e.stopPropagation();
                                
                                // Refocus the input after a short delay
                                setTimeout(() => {
                                    inputRef.current?.focus();
                                    // Ensure dropdown stays open to show the + button
                                    if (!open) {
                                        setOpen(true);
                                    }
                                }, 10);
                                return;
                            }
                            
                            setTimeout(() => {
                                if (!open) {
                                    const exactMatch = allOptions.find(opt => 
                                        opt.name.toLowerCase() === (query || '').toLowerCase().trim()
                                    );
                                    if (exactMatch) {
                                        onChange(exactMatch.name);
                                        setCurrent(exactMatch.name);
                                        setHasPendingNewValue(false);
                                    } else if (query && query !== (current || value)) {
                                        // Keep the typed value for potential creation
                                    } else if (!query) {
                                        setQuery('');
                                        setHasPendingNewValue(false);
                                    }
                                    setQuery('');
                                }
                            }, 150);
                        }}
                        className={`w-full text-left px-2 py-1 text-[12px] rounded border ${isError ? 'border-red-500 bg-red-50 ring-2 ring-red-200' : open ? 'border-blue-500 bg-white ring-2 ring-blue-200' : 'border-blue-300 bg-white hover:bg-slate-50'} text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 ${isError ? 'focus:ring-red-200 focus:border-red-500' : 'focus:ring-blue-200 focus:border-blue-500'}`}
                        placeholder={placeholder}
                    />
                ) : null}
            </div>
            
            {open && dropdownPortalPos && createPortal(
                <div 
                    ref={dropdownRef}
                    className='rounded-xl border border-slate-200 bg-white shadow-2xl'
                    onMouseDown={(e: any) => e.stopPropagation()}
                    onClick={(e: any) => e.stopPropagation()}
                    style={{
                        position: 'fixed',
                        top: `${dropdownPortalPos.top}px`,
                        left: `${dropdownPortalPos.left}px`,
                        width: 'max-content',
                        minWidth: `${dropdownPortalPos.width}px`,
                        maxWidth: '500px',
                        zIndex: 10000
                    }}
                >
                    <div className="absolute -top-2 left-6 h-3 w-3 rotate-45 bg-white border-t border-l border-slate-200"></div>
                    <div className='relative z-10 flex flex-col'>
                        <div className='py-1 text-[12px] px-3 space-y-2 overflow-y-auto' style={{maxHeight: '200px'}}>
                            {(() => {
                                console.log('🎨 [RoleName] Rendering dropdown content', {
                                    query: query.trim(),
                                    optionsLength: options.length,
                                    allOptionsLength: allOptions.length,
                                    loading
                                });
                                
                                // Filter options that match the query (show all if no query) - exactly like AssignedUserGroupTable
                                const filteredOptions = query.trim() 
                                    ? options.filter(opt => 
                                        opt.name.toLowerCase().startsWith(query.toLowerCase()) ||
                                        opt.name.toLowerCase().includes(query.toLowerCase())
                                    ).sort((a, b) => {
                                        const aLower = a.name.toLowerCase();
                                        const bLower = b.name.toLowerCase();
                                        const queryLower = query.toLowerCase();
                                        
                                        // Prioritize starts with matches
                                        const aStartsWith = aLower.startsWith(queryLower);
                                        const bStartsWith = bLower.startsWith(queryLower);
                                        
                                        if (aStartsWith && !bStartsWith) return -1;
                                        if (bStartsWith && !aStartsWith) return 1;
                                        
                                        return aLower.localeCompare(bLower);
                                    })
                                    : options.slice(0, 50); // Show first 50 options if no query to avoid performance issues
                                
                                console.log('🔍 [RoleName] filteredOptions:', filteredOptions);
                                
                                // Check if query exactly matches an existing option - always check allOptions when available (database source of truth)
                                const exactMatch = query.trim() && allOptions.length > 0 ? allOptions.find(opt => 
                                    opt.name.toLowerCase() === query.toLowerCase().trim()
                                ) : null;
                                
                                console.log('🎯 [RoleName] exactMatch check:', {
                                    query: query.trim(),
                                    allOptionsLength: allOptions.length,
                                    exactMatch: exactMatch?.name || null,
                                    allOptionsSample: allOptions.slice(0, 5).map(o => o.name)
                                });
                                
                                // Show + button if:
                                // 1. Query is entered
                                // 2. Either allOptions is empty (still loading) OR no exact match found in database
                                const showCreateNew = query.trim() && (allOptions.length === 0 || !exactMatch);
                                
                                console.log('➕ [RoleName] showCreateNew calculation:', {
                                    queryTrimmed: query.trim(),
                                    queryHasValue: !!query.trim(),
                                    allOptionsEmpty: allOptions.length === 0,
                                    exactMatchFound: !!exactMatch,
                                    showCreateNew
                                });
                                
                                // Show loading only if loading AND no query entered yet
                                if (loading && allOptions.length === 0 && !query.trim()) {
                                    console.log('⏳ [RoleName] Showing loading message');
                                    return (
                                        <div className='px-3 py-2 text-slate-500 text-center'>
                                            Loading…
                                        </div>
                                    );
                                }
                                
                                // Only show "No matches" if there are no filtered options AND no new value to create AND not loading AND allOptions is loaded
                                if (filteredOptions.length === 0 && !showCreateNew && !loading && allOptions.length > 0) {
                                    console.log('🚫 [RoleName] Showing "No matches" message');
                                    return (
                                        <div className='px-3 py-2 text-slate-500 text-center'>
                                            No matches
                                        </div>
                                    );
                                }
                                
                                // Show empty state when no values exist in database
                                if (filteredOptions.length === 0 && !query.trim() && !loading && allOptions.length === 0) {
                                    console.log('📭 [RoleName] Showing "No value found" message');
                                    return (
                                        <div className='px-3 py-2 text-slate-500 text-center'>
                                            No value found
                                        </div>
                                    );
                                }
                                
                                console.log('✅ [RoleName] Rendering dropdown items and + button', {
                                    filteredOptionsCount: filteredOptions.length,
                                    showCreateNew,
                                    showCreateNewType: typeof showCreateNew,
                                    showCreateNewValue: String(showCreateNew)
                                });

                                return (
                                    <>
                                        {filteredOptions.map((opt, idx) => {
                                            const palette = [
                                                { bg: 'bg-blue-100', hover: 'hover:bg-blue-200', text: 'text-blue-700' },
                                                { bg: 'bg-cyan-100', hover: 'hover:bg-cyan-200', text: 'text-cyan-700' },
                                                { bg: 'bg-sky-100', hover: 'hover:bg-sky-200', text: 'text-sky-700' },
                                                { bg: 'bg-indigo-100', hover: 'hover:bg-indigo-200', text: 'text-indigo-700' },
                                            ];
                                            const tone = palette[idx % palette.length];
                                            
                                            return (
                                                <motion.div
                                                    key={opt.id}
                                                    initial={{scale: 0.98, opacity: 0}}
                                                    animate={{scale: 1, opacity: 1}}
                                                    whileHover={{scale: 1.02, y: -1}}
                                                    transition={{type: 'spring', stiffness: 400, damping: 25}}
                                                    className='relative group'
                                                >
                                                    <div
                                                        className={`w-full rounded-lg px-3 py-2.5 ${tone.bg} ${tone.hover} ${tone.text} transition-all duration-200 font-medium shadow-sm hover:shadow-md relative overflow-visible flex items-center justify-between cursor-pointer`}
                                                        style={{wordBreak: 'keep-all', whiteSpace: 'nowrap'}}
                                                        onClick={() => {
                                                            // Double-check for duplicate (safeguard, shouldn't happen since list is already filtered)
                                                            const isDuplicate = userGroups.some(
                                                                ug => ug.roleName?.toLowerCase().trim() === opt.name.toLowerCase().trim()
                                                            );
                                                            
                                                            if (isDuplicate) {
                                                                console.log('❌ [RoleName] Cannot select duplicate role name:', opt.name);
                                                                alert(`Group name "${opt.name}" already exists in the table. Please use a different name.`);
                                                                return;
                                                            }
                                                            
                                                            onChange(opt.name);
                                                            setCurrent(opt.name);
                                                            setQuery('');
                                                            setOpen(false);
                                                            setHasPendingNewValue(false);
                                                            
                                                            // Focus the chip after selecting option so Tab navigation works - exactly like AssignedUserGroupTable
                                                            setTimeout(() => {
                                                                try {
                                                                    // Find the chip element (which now has tabIndex=0 and is focusable)
                                                                    const chipElement = containerRef.current?.querySelector('span[tabindex="0"]') as HTMLElement;
                                                                    if (chipElement) {
                                                                        chipElement.focus();
                                                                        console.log('🎯 [RoleName] Focused chip after dropdown selection');
                                                                    }
                                                                } catch (e) {
                                                                    console.log('🎯 [RoleName] Error focusing chip after dropdown selection:', e);
                                                                }
                                                            }, 100); // Small delay to ensure React state updates are complete
                                                        }}
                                                    >
                                                        <span className='relative z-10 flex-1'>{opt.name}</span>
                                                        <div className='absolute inset-0 bg-gradient-to-r from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200' />
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                        
                                        {/* Add button inside scrollable area - exactly like AssignedUserGroupTable */}
                                        {showCreateNew && (
                                            <motion.div
                                                initial={{scale: 0.98, opacity: 0}}
                                                animate={{scale: 1, opacity: 1}}
                                                className='mt-2 border-t border-slate-200 pt-2'
                                            >
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        console.log('🖱️ [RoleName] + button clicked for:', query.trim());
                                                        addNew();
                                                    }}
                                                    className='w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 transition-colors duration-150 rounded-lg'
                                                    type='button'
                                                >
                                                    + Add &quot;{query.trim()}&quot;
                                                </button>
                                            </motion.div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

// AsyncChipSelect for Entity with dropdown and filtering
function AsyncChipSelectEntity({
    value,
    onChange,
    placeholder = '',
    isError = false,
    accounts = [],
    onNewItemCreated,
    onTabNext,
    onTabPrev,
    selectedEnterprise = '',
    selectedEnterpriseId = '',
    selectedAccountId = '',
    selectedAccountName = '',
}: {
    value?: string;
    onChange: (next?: string) => void;
    placeholder?: string;
    isError?: boolean;
    accounts?: UserRoleRow[];
    onNewItemCreated?: (item: {id: string; name: string}) => void;
    onTabNext?: () => void;
    onTabPrev?: () => void;
    selectedEnterprise?: string;
    selectedEnterpriseId?: string;
    selectedAccountId?: string;
    selectedAccountName?: string;
}) {
    const [open, setOpen] = useState(false);
    const [current, setCurrent] = useState<string | undefined>(value);
    const [query, setQuery] = useState('');
    const [options, setOptions] = useState<Array<{id: string; name: string}>>([]);
    const [allOptions, setAllOptions] = useState<Array<{id: string; name: string}>>([]);
    const [loading, setLoading] = useState(false);
    const [hasPendingNewValue, setHasPendingNewValue] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [dropdownPortalPos, setDropdownPortalPos] = useState<{
        top: number;
        left: number;
        width: number;
    } | null>(null);

    // Load options from database API
    const loadAllOptions = useCallback(async () => {
        console.log('🔄 [Entity] loadAllOptions called', {
            selectedEnterprise,
            selectedAccountId
        });
        setLoading(true);
        try {
            if (!selectedAccountId || !selectedEnterprise) {
                console.log('⚠️ [Entity] Missing dependencies, clearing options', {
                    hasAccountId: !!selectedAccountId,
                    hasEnterprise: !!selectedEnterprise,
                    selectedAccountIdValue: selectedAccountId,
                    selectedEnterpriseValue: selectedEnterprise
                });
                
                // Try to get values directly from localStorage as fallback
                const directAccountId = typeof window !== 'undefined' ? window.localStorage.getItem('selectedAccountId') : null;
                const directEnterprise = typeof window !== 'undefined' ? window.localStorage.getItem('selectedEnterpriseName') : null;
                
                console.log('🔍 [Entity] Direct localStorage check:', {
                    directAccountId,
                    directEnterprise
                });
                
                if (directAccountId && directEnterprise) {
                    console.log('✅ [Entity] Found values in localStorage, proceeding with API call');
                    // Continue with the API call using direct values
                } else {
                    setAllOptions([]);
                    setLoading(false);
                    return;
                }
            }
            
            // Get actual values to use (props or localStorage fallback)
            const actualAccountId = selectedAccountId || (typeof window !== 'undefined' ? window.localStorage.getItem('selectedAccountId') : null);
            const actualEnterprise = selectedEnterprise || (typeof window !== 'undefined' ? window.localStorage.getItem('selectedEnterpriseName') : null);
            const actualAccountName = selectedAccountName || (typeof window !== 'undefined' ? window.localStorage.getItem('selectedAccountName') : null);
            
            // Get enterpriseId from localStorage
            const enterpriseId = window.localStorage.getItem('selectedEnterpriseId');
            if (!enterpriseId) {
                console.log('⚠️ [Entity] No enterpriseId in localStorage');
                setAllOptions([]);
                setLoading(false);
                return;
            }
            
            // Get exact same localStorage values for comparison
            const debugValues = {
                actualAccountId,
                actualEnterprise,
                actualAccountName,
                enterpriseId,
                directAccountName: typeof window !== 'undefined' ? window.localStorage.getItem('selectedAccountName') : null,
                directEnterpriseId: typeof window !== 'undefined' ? window.localStorage.getItem('selectedEnterpriseId') : null,
                directEnterpriseName: typeof window !== 'undefined' ? window.localStorage.getItem('selectedEnterpriseName') : null
            };
            
            console.log('📡 [Entity] Calling API: /api/global-settings with values:', debugValues);
            console.log('🔍 [Entity] Expected entity in DB:', {
                expectedAccountName: 'Accenture Digital',
                expectedAccountId: '143b655b-5d42-48c8-8343-c2177068fab5',
                expectedEnterpriseName: 'Enterprise Business Suite', 
                expectedEnterpriseId: '8d8c053a-bb38-48ba-8ea4-02695e319e9b',
                expectedEntityName: 'Finance'
            });
            
            const apiUrl = `/api/global-settings?accountId=${actualAccountId}&accountName=${encodeURIComponent(actualAccountName || '')}&enterpriseId=${enterpriseId}`;
            console.log('🌐 [Entity] Full API URL:', apiUrl);
            
            const response = await api.get<Array<{
                id?: string;
                entityName: string;
                enterprise?: string;
            }>>(apiUrl) || [];
            
            console.log('📦 [Entity] API response:', response);
            console.log('📦 [Entity] API response type:', typeof response);
            console.log('📦 [Entity] API response length:', Array.isArray(response) ? response.length : 'N/A');
            
            // Check if response is an error object
            if (response && typeof response === 'object' && 'error' in response) {
                console.error('❌ [Entity] API error:', response.error);
                console.log('🔍 [Entity] This suggests the API endpoint is receiving the request but has an internal error');
                setAllOptions([]);
                setLoading(false);
                return;
            }
            
            // Ensure response is an array before filtering
            if (!Array.isArray(response)) {
                console.error('❌ [Entity] Invalid response format - expected array:', response);
                console.log('🔍 [Entity] This suggests the API returned an unexpected format');
                setAllOptions([]);
                setLoading(false);
                return;
            }
            
            // If we get an empty array, the API call worked but no data was found
            if (response.length === 0) {
                console.log('⚠️ [Entity] API returned empty array - no entities found for this account/enterprise combination');
                console.log('🔍 [Entity] This suggests a mismatch between our parameters and the database query logic');
            }
            
            // Debug the response structure if we got data
            if (response.length > 0) {
                console.log('🎯 [Entity] Sample response item structure:', response[0]);
                console.log('🎯 [Entity] All response items:', response);
            }
            
            // Extract unique entity names filtered by Account and Enterprise
            const uniqueEntities = Array.from(new Set(
                response
                    .filter(item => item.entityName && item.entityName.trim() !== '')
                    .map(item => item.entityName)
            ));
            
            console.log('✅ [Entity] Filtered unique entities:', uniqueEntities);
            
            // Compare with expected result
            if (uniqueEntities.length === 0) {
                console.log('🔍 [Entity] DEBUGGING: Expected to find "Finance" entity but got none');
                console.log('🔍 [Entity] Database has: Accenture Digital + Enterprise Business Suite + Finance');
                console.log('🔍 [Entity] API called with:', {
                    accountId: actualAccountId,
                    accountName: actualEnterprise,
                    enterpriseId: enterpriseId
                });
                console.log('🔍 [Entity] Possible issues:');
                console.log('  1. API endpoint query logic mismatch');
                console.log('  2. Parameter encoding/format issues');
                console.log('  3. Database key structure mismatch');
                console.log('  4. Case sensitivity in query');
            }
            
            const allData = uniqueEntities.map((entity, index) => ({
                id: `entity-${index}`,
                name: entity
            }));
            
            console.log('✅ [Entity] Setting allOptions with', allData.length, 'items:', allData);
            setAllOptions(allData);
        } catch (error) {
            console.error('❌ [Entity] Failed to load entities:', error);
            setAllOptions([]);
        } finally {
            console.log('🏁 [Entity] loadAllOptions completed, loading set to false');
            setLoading(false);
        }
    }, [selectedEnterprise, selectedAccountId]);

    // Check if query is a new value
    const isNewValuePending = useCallback((queryValue: string): boolean => {
        if (!queryValue.trim()) return false;
        const exactMatch = allOptions.find(opt => 
            opt.name.toLowerCase() === queryValue.toLowerCase().trim()
        );
        return !exactMatch;
    }, [allOptions]);

    useEffect(() => {
        setHasPendingNewValue(isNewValuePending(query));
    }, [query, isNewValuePending]);

    // Calculate dropdown position
    const calculateDropdownPosition = useCallback(() => {
        if (!containerRef.current) return;
        
        const containerRect = containerRef.current.getBoundingClientRect();
        const width = Math.max(140, Math.min(200, containerRect.width));
        const top = containerRect.bottom + 2;
        const left = containerRect.left;
        
        setDropdownPortalPos({ top, left, width });
    }, []);

    useEffect(() => {
        if (open) {
            calculateDropdownPosition();
            const handleReposition = () => calculateDropdownPosition();
            window.addEventListener('scroll', handleReposition, true);
            window.addEventListener('resize', handleReposition);
            return () => {
                window.removeEventListener('scroll', handleReposition, true);
                window.removeEventListener('resize', handleReposition);
            };
        }
    }, [open, calculateDropdownPosition]);

    useEffect(() => {
        if (open && allOptions.length === 0) {
            loadAllOptions();
        }
    }, [open, allOptions.length, loadAllOptions]);

    useEffect(() => {
        setCurrent(value);
    }, [value]);

    useEffect(() => {
        const onDoc = (e: MouseEvent) => {
            const target = e.target as Node;
            const withinAnchor = !!containerRef.current?.contains(target);
            const withinDropdown = !!dropdownRef.current?.contains(target);
            if (!withinAnchor && !withinDropdown) {
                setOpen(false);
            }
        };
        document.addEventListener('click', onDoc, true);
        return () => document.removeEventListener('click', onDoc, true);
    }, []);

    // Filter options
    const filterOptions = useCallback(() => {
        if (allOptions.length === 0) {
            setOptions([]);
            return;
        }
        let filtered = allOptions;
        
        if (query) {
            const queryLower = query.toLowerCase();
            filtered = filtered.filter(opt => 
                opt.name.toLowerCase().startsWith(queryLower)
            );
            
            filtered = filtered.sort((a, b) => {
                const aLower = a.name.toLowerCase();
                const bLower = b.name.toLowerCase();
                if (aLower === queryLower && bLower !== queryLower) return -1;
                if (bLower === queryLower && aLower !== queryLower) return 1;
                return aLower.localeCompare(bLower);
            });
        }
        
        setOptions(filtered);
    }, [allOptions, query]);

    useEffect(() => {
        filterOptions();
    }, [filterOptions]);

    const addNew = async () => {
        const name = (query || '').trim();
        if (!name) return;

        const existingMatch = allOptions.find(
            (opt) => opt.name.toLowerCase() === name.toLowerCase(),
        );

        if (existingMatch) {
            onChange(existingMatch.name);
            setCurrent(existingMatch.name);
            setQuery('');
            setOpen(false);
            setHasPendingNewValue(false);
            return;
        }

        try {
            // Get actual values to use (props or localStorage fallback)
            const actualAccountId = selectedAccountId || (typeof window !== 'undefined' ? window.localStorage.getItem('selectedAccountId') : null);
            const actualEnterprise = selectedEnterprise || (typeof window !== 'undefined' ? window.localStorage.getItem('selectedEnterpriseName') : null);
            const actualAccountName = selectedAccountName || (typeof window !== 'undefined' ? window.localStorage.getItem('selectedAccountName') : null);
            
            // Create new entity via global-settings API to match AssignedUserGroupTable
            console.log('🆕 [Entity] Creating new entity:', name, 'with values:', {
                actualAccountId,
                actualEnterprise,
                actualAccountName,
                enterpriseId: window.localStorage.getItem('selectedEnterpriseId')
            });
            const created = await api.post<{id: string; entityName: string} | any>(
                '/api/global-settings',
                {
                    entityName: name,
                    accountId: actualAccountId,
                    accountName: actualAccountName,
                    enterpriseId: window.localStorage.getItem('selectedEnterpriseId')
                },
            );
            
            const formattedCreated = {
                id: created?.id || `entity-${Date.now()}`,
                name: created?.entityName || name
            };
            
            if (formattedCreated) {
                setOptions((prev) => {
                    const exists = prev.some((o) => o.id === formattedCreated.id);
                    return exists ? prev : [...prev, formattedCreated];
                });
                setAllOptions((prev) => {
                    const exists = prev.some((o) => o.id === formattedCreated.id);
                    return exists ? prev : [...prev, formattedCreated];
                });
                onChange(formattedCreated.name);
                setCurrent(formattedCreated.name);
                setQuery('');
                setOpen(false);
                setHasPendingNewValue(false);
                
                if (onNewItemCreated) {
                    onNewItemCreated(formattedCreated);
                }
            }
        } catch (error: any) {
            console.error('❌ [Entity] Failed to create entity:', error);
            if (
                error?.message?.includes('already exists') ||
                error?.message?.includes('duplicate')
            ) {
                const existingItem = allOptions.find(
                    (opt) => opt.name.toLowerCase() === name.toLowerCase(),
                );
                if (existingItem) {
                    onChange(existingItem.name);
                    setCurrent(existingItem.name);
                    setQuery('');
                    setOpen(false);
                    setHasPendingNewValue(false);
                }
            }
        }
    };

    return (
        <div
            ref={containerRef}
            className='relative min-w-0 flex items-center gap-1 group/item'
            style={{maxWidth: '100%', width: '100%'}}
        >
            <div className='relative w-full flex items-center gap-1' style={{width: '100%', minWidth: '100%'}}>
                {(current || value) && !open ? (
                    <motion.span
                        ref={inputRef}
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
                        className='w-full inline-flex items-center gap-1 px-2 py-1 text-[11px] leading-[14px] bg-white text-black rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500'
                        style={{width: '100%', minWidth: '100%', maxWidth: '100%'}}
                        title={current || value}
                        tabIndex={0}
                        onClick={(e: any) => {
                            if (!(e.target as HTMLElement).closest('button')) {
                                setQuery(current || value || '');
                                setOpen(true);
                            }
                        }}
                        onKeyDown={(e: any) => {
                            // Handle Tab navigation from the chip to next field (Product) - exactly like AssignedUserGroupTable
                            if (e.key === 'Tab') {
                                e.preventDefault();
                                e.stopPropagation();
                                
                                // Find the current row and navigate to Product field
                                const currentElement = e.target as HTMLElement;
                                const currentColDiv = currentElement.closest('[data-col]');
                                const currentRowId = currentColDiv?.getAttribute('data-row-id');
                                
                                if (currentRowId) {
                                    // Find the Product field in the same row
                                    const nextColDiv = document.querySelector(`[data-row-id="${currentRowId}"][data-col="product"]`);
                                    
                                    if (nextColDiv) {
                                        // Find the input or chip element in the Product field
                                        const productInput = nextColDiv.querySelector('input') as HTMLInputElement;
                                        const productChip = nextColDiv.querySelector('span[tabindex="0"]') as HTMLElement;
                                        
                                        // Focus the input if available, otherwise the chip
                                        const targetElement = productInput || productChip;
                                        
                                        if (targetElement) {
                                            setTimeout(() => {
                                                targetElement.focus();
                                            }, 10);
                                        }
                                    }
                                }
                            }
                        }}
                    >
                        <span className='flex-1 truncate pointer-events-none'>{current || value}</span>
                        <button
                            onClick={(e: any) => {
                                e.stopPropagation();
                                e.preventDefault();
                                onChange('');
                                setCurrent('');
                                setQuery('');
                            }}
                            className='hover:text-slate-900 opacity-0 group-hover/item:opacity-100 transition-opacity p-0.5 rounded-sm hover:bg-blue-100 flex-shrink-0'
                            aria-label='Remove'
                            style={{minWidth: '20px', minHeight: '20px'}}
                        >
                            <X size={12} />
                        </button>
                    </motion.span>
                ) : null}
                
                {(!current && !value) || open ? (
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={(e: any) => {
                            const newValue = e.target.value;
                            setQuery(newValue);
                            setOpen(true);
                            if (containerRef.current) {
                                const containerRect = containerRef.current.getBoundingClientRect();
                                const width = Math.max(140, Math.min(200, containerRect.width));
                                const top = containerRect.bottom + 2;
                                const left = containerRect.left;
                                setDropdownPortalPos({ top, left, width });
                            }
                            if (allOptions.length === 0) {
                                loadAllOptions();
                            }
                            if (newValue === '') {
                                onChange('');
                                setCurrent('');
                            }
                        }}
                        onFocus={() => {
                            setOpen(true);
                            if (containerRef.current) {
                                const containerRect = containerRef.current.getBoundingClientRect();
                                const width = Math.max(140, Math.min(200, containerRect.width));
                                const top = containerRect.bottom + 2;
                                const left = containerRect.left;
                                setDropdownPortalPos({ top, left, width });
                            }
                            if (allOptions.length === 0) {
                                loadAllOptions();
                            }
                        }}
                        onKeyDown={async (e: any) => {
                            if (e.key === 'Enter' && query.trim()) {
                                e.preventDefault();
                                e.stopPropagation();
                                const exactMatch = allOptions.find(opt => 
                                    opt.name.toLowerCase() === query.toLowerCase().trim()
                                );
                                if (exactMatch) {
                                    onChange(exactMatch.name);
                                    setCurrent(exactMatch.name);
                                    setQuery('');
                                    setOpen(false);
                                    setHasPendingNewValue(false);
                                    
                                    // Focus the chip after selecting existing value so Tab navigation works - exactly like AssignedUserGroupTable
                                    setTimeout(() => {
                                        try {
                                            if (inputRef.current) {
                                                inputRef.current.blur();
                                            }
                                            const currentElement = inputRef.current || (document.activeElement as HTMLElement);
                                            const currentColDiv = currentElement?.closest('[data-col]');
                                            const currentRowId = currentColDiv?.getAttribute('data-row-id');
                                            if (currentRowId) {
                                                const chipElement = document.querySelector(
                                                    `[data-row-id="${currentRowId}"][data-col="entity"] span[tabindex="0"]`
                                                ) as HTMLElement;
                                                if (chipElement) {
                                                    chipElement.focus();
                                                }
                                            }
                                        } catch (error) {
                                            console.error('Failed to focus chip after Enter:', error);
                                        }
                                    }, 50);
                                } else {
                                    await addNew();
                                }
                            } else if (e.key === 'Escape') {
                                setOpen(false);
                                setQuery('');
                            } else if (e.key === 'Tab') {
                                if (query.trim() && hasPendingNewValue) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (!open) {
                                        setOpen(true);
                                    }
                                    inputRef.current?.focus();
                                    return;
                                }
                                if (query.trim()) {
                                    const exactMatch = allOptions.find(opt => 
                                        opt.name.toLowerCase() === query.toLowerCase().trim()
                                    );
                                    if (exactMatch) {
                                        onChange(exactMatch.name);
                                        setCurrent(exactMatch.name);
                                        setQuery('');
                                        setOpen(false);
                                        setHasPendingNewValue(false);
                                    }
                                } else {
                                    setOpen(false);
                                    setHasPendingNewValue(false);
                                }
                                
                                // Handle tab navigation
                                if (!e.shiftKey && onTabNext) {
                                    onTabNext();
                                } else if (e.shiftKey && onTabPrev) {
                                    onTabPrev();
                                }
                            }
                        }}
                        onBlur={(e) => {
                            const relatedTarget = e.relatedTarget as HTMLElement;
                            const isClickingInDropdown = dropdownRef.current?.contains(relatedTarget);
                            if (query.trim() && hasPendingNewValue && !isClickingInDropdown) {
                                e.preventDefault();
                                e.stopPropagation();
                                setTimeout(() => {
                                    inputRef.current?.focus();
                                    if (!open) {
                                        setOpen(true);
                                    }
                                }, 10);
                                return;
                            }
                            setTimeout(() => {
                                if (!open) {
                                    const exactMatch = allOptions.find(opt => 
                                        opt.name.toLowerCase() === (query || '').toLowerCase().trim()
                                    );
                                    if (exactMatch) {
                                        onChange(exactMatch.name);
                                        setCurrent(exactMatch.name);
                                        setHasPendingNewValue(false);
                                    } else if (query && query !== (current || value)) {
                                        // Keep the typed value
                                    } else if (!query) {
                                        setQuery('');
                                        setHasPendingNewValue(false);
                                    }
                                    setQuery('');
                                }
                            }, 150);
                        }}
                        className={`w-full text-left px-2 py-1 text-[12px] rounded border ${isError ? 'border-red-500 bg-red-50 ring-2 ring-red-200' : open ? 'border-blue-500 bg-white ring-2 ring-blue-200' : 'border-blue-300 bg-white hover:bg-slate-50'} text-slate-700 focus:outline-none focus:ring-2 ${isError ? 'focus:ring-red-200 focus:border-red-500' : 'focus:ring-blue-200 focus:border-blue-500'}`}
                        placeholder=""
                    />
                ) : null}
            </div>
            
            {open && dropdownPortalPos && createPortal(
                <div 
                    ref={dropdownRef}
                    className='rounded-xl border border-slate-200 bg-white shadow-2xl'
                    onMouseDown={(e: any) => e.stopPropagation()}
                    onClick={(e: any) => e.stopPropagation()}
                    style={{
                        position: 'fixed',
                        top: `${dropdownPortalPos.top}px`,
                        left: `${dropdownPortalPos.left}px`,
                        width: 'max-content',
                        minWidth: `${dropdownPortalPos.width}px`,
                        maxWidth: '500px',
                        zIndex: 10000
                    }}
                >
                    <div className="absolute -top-2 left-6 h-3 w-3 rotate-45 bg-white border-t border-l border-slate-200"></div>
                    <div className='relative z-10 flex flex-col'>
                        <div className='py-1 text-[12px] px-3 space-y-2 overflow-y-auto' style={{maxHeight: '200px'}}>
                            {loading && allOptions.length === 0 && !query.trim() ? (
                                <div className='px-3 py-2 text-slate-500 text-center'>Loading…</div>
                            ) : (() => {
                                const filteredOptions = query.trim() 
                                    ? options.filter(opt => 
                                        opt.name.toLowerCase().startsWith(query.toLowerCase()) ||
                                        opt.name.toLowerCase().includes(query.toLowerCase())
                                    ).sort((a, b) => {
                                        const aLower = a.name.toLowerCase();
                                        const bLower = b.name.toLowerCase();
                                        const queryLower = query.toLowerCase();
                                        const aStartsWith = aLower.startsWith(queryLower);
                                        const bStartsWith = bLower.startsWith(queryLower);
                                        if (aStartsWith && !bStartsWith) return -1;
                                        if (bStartsWith && !aStartsWith) return 1;
                                        return aLower.localeCompare(bLower);
                                    })
                                    : options.slice(0, 50);
                                
                                const exactMatch = query.trim() && allOptions.length > 0 ? allOptions.find(opt => 
                                    opt.name.toLowerCase() === query.toLowerCase().trim()
                                ) : null;
                                
                                // Disable "Add new" functionality for Entity field
                                const showCreateNew = false;
                                
                                if (filteredOptions.length === 0 && !showCreateNew && !loading && allOptions.length > 0) {
                                    return (
                                        <div className='px-3 py-2 text-slate-500 text-center'>
                                            No matches
                                        </div>
                                    );
                                }
                                
                                if (filteredOptions.length === 0 && !query.trim() && !loading && allOptions.length === 0) {
                                    return (
                                        <div className='px-3 py-2 text-slate-500 text-center'>
                                            No value found
                                        </div>
                                    );
                                }

                                return (
                                    <>
                                        {filteredOptions.map((opt, idx) => {
                                            const palette = [
                                                { bg: 'bg-blue-100', hover: 'hover:bg-blue-200', text: 'text-blue-700' },
                                                { bg: 'bg-cyan-100', hover: 'hover:bg-cyan-200', text: 'text-cyan-700' },
                                                { bg: 'bg-sky-100', hover: 'hover:bg-sky-200', text: 'text-sky-700' },
                                                { bg: 'bg-indigo-100', hover: 'hover:bg-indigo-200', text: 'text-indigo-700' },
                                            ];
                                            const tone = palette[idx % palette.length];
                                            
                                            return (
                                                <motion.div
                                                    key={opt.id}
                                                    initial={{scale: 0.98, opacity: 0}}
                                                    animate={{scale: 1, opacity: 1}}
                                                    whileHover={{scale: 1.02, y: -1}}
                                                    transition={{type: 'spring', stiffness: 400, damping: 25}}
                                                    className='relative group'
                                                >
                                                    <div
                                                        className={`w-full rounded-lg px-3 py-2.5 ${tone.bg} ${tone.hover} ${tone.text} transition-all duration-200 font-medium shadow-sm hover:shadow-md relative overflow-visible flex items-center justify-between cursor-pointer`}
                                                        style={{wordBreak: 'keep-all', whiteSpace: 'nowrap'}}
                                                        onClick={() => {
                                                            onChange(opt.name);
                                                            setCurrent(opt.name);
                                                            setQuery('');
                                                            setOpen(false);
                                                            setHasPendingNewValue(false);
                                                            
                                                            // Focus the chip after clicking dropdown option so Tab navigation works
                                                            setTimeout(() => {
                                                                try {
                                                                    if (inputRef.current) {
                                                                        inputRef.current.blur();
                                                                    }
                                                                    const currentElement = inputRef.current || (document.activeElement as HTMLElement);
                                                                    const currentColDiv = currentElement?.closest('[data-col]');
                                                                    const currentRowId = currentColDiv?.getAttribute('data-row-id');
                                                                    if (currentRowId) {
                                                                        const chipElement = document.querySelector(
                                                                            `[data-row-id="${currentRowId}"][data-col="entity"] span[tabindex="0"]`
                                                                        ) as HTMLElement;
                                                                        if (chipElement) {
                                                                            chipElement.focus();
                                                                        }
                                                                    }
                                                                } catch (error) {
                                                                    console.error('Failed to focus chip after dropdown selection:', error);
                                                                }
                                                            }, 50);
                                                        }}
                                                    >
                                                        <span className='relative z-10 flex-1'>{opt.name}</span>
                                                        <div className='absolute inset-0 bg-gradient-to-r from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200' />
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                        
                                        {showCreateNew && (
                                            <motion.div
                                                initial={{scale: 0.98, opacity: 0}}
                                                animate={{scale: 1, opacity: 1}}
                                                className='mt-2 border-t border-slate-200 pt-2'
                                            >
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        addNew();
                                                    }}
                                                    className='w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 transition-colors duration-150 rounded-lg'
                                                    type='button'
                                                >
                                                    + Add &quot;{query.trim()}&quot;
                                                </button>
                                            </motion.div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

// AsyncChipSelect for Product with dropdown filtered by Enterprise (selection only, no new entries)
function AsyncChipSelectProduct({
    value,
    onChange,
    placeholder = '',
    isError = false,
    selectedEnterprise = '',
    selectedAccountId = '',
    selectedEnterpriseId = '',
    onNewItemCreated,
    onTabNext,
    onTabPrev,
}: {
    value?: string;
    onChange: (next?: string) => void;
    placeholder?: string;
    isError?: boolean;
    selectedEnterprise?: string;
    selectedAccountId?: string;
    selectedEnterpriseId?: string;
    onNewItemCreated?: (item: {id: string; name: string}) => void;
    onTabNext?: () => void;
    onTabPrev?: () => void;
}) {
    const [open, setOpen] = useState(false);
    const [current, setCurrent] = useState<string | undefined>(value);
    const [query, setQuery] = useState('');
    const [options, setOptions] = useState<Array<{id: string; name: string}>>([]);
    const [allOptions, setAllOptions] = useState<Array<{id: string; name: string}>>([]);
    const [loading, setLoading] = useState(false);
    const [hasPendingNewValue, setHasPendingNewValue] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [dropdownPortalPos, setDropdownPortalPos] = useState<{
        top: number;
        left: number;
        width: number;
    } | null>(null);

    // Load options from account licenses filtered by Account and Enterprise
    const loadAllOptions = useCallback(async () => {
        setLoading(true);
        try {
            if (!selectedAccountId) {
                console.log('🔍 [Product] No account selected, clearing options');
                setAllOptions([]);
                setLoading(false);
                return;
            }

            console.log('🔍 [Product] Loading products for account:', selectedAccountId, 'enterprise:', selectedEnterprise);

            // Get account data with licenses to find products for this account and enterprise
            const accountData = await api.get<{
                id: string;
                accountName: string;
                licenses: Array<{
                    id: string;
                    enterprise: string;
                    product: string;
                    service: string;
                }>;
            }>(`/api/accounts/${selectedAccountId}`) || null;
            
            if (!accountData || !accountData.licenses) {
                console.log('🔍 [Product] No account data or licenses found');
                setAllOptions([]);
                setLoading(false);
                return;
            }

            console.log('🔍 [Product] Account licenses:', accountData.licenses);
            
            // Extract unique product names from licenses that match the selected enterprise
            const uniqueProducts = Array.from(new Set(
                accountData.licenses
                    .filter(license => {
                        // Match by enterprise name if available, otherwise show all products for this account
                        return !selectedEnterprise || license.enterprise === selectedEnterprise;
                    })
                    .map(license => license.product)
                    .filter(product => product && product.trim() !== '')
            ));
            
            console.log('🔍 [Product] Filtered products:', uniqueProducts);
            
            // Convert to the expected format
            const allData = uniqueProducts.map((product, index) => ({
                id: `product-${product}-${index}`,
                name: product
            }));
            
            setAllOptions(allData);
        } catch (error) {
            console.error('❌ [Product] Failed to load products:', error);
            setAllOptions([]);
        } finally {
            setLoading(false);
        }
    }, [selectedAccountId, selectedEnterprise]);

    // Check if query is a new value
    const isNewValuePending = useCallback((queryValue: string): boolean => {
        if (!queryValue.trim()) return false;
        const exactMatch = allOptions.find(opt => 
            opt.name.toLowerCase() === queryValue.toLowerCase().trim()
        );
        return !exactMatch;
    }, [allOptions]);

    useEffect(() => {
        setHasPendingNewValue(isNewValuePending(query));
    }, [query, isNewValuePending]);

    // Calculate dropdown position
    const calculateDropdownPosition = useCallback(() => {
        if (!containerRef.current) return;
        
        const containerRect = containerRef.current.getBoundingClientRect();
        const width = Math.max(140, Math.min(200, containerRect.width));
        const top = containerRect.bottom + 2;
        const left = containerRect.left;
        
        setDropdownPortalPos({ top, left, width });
    }, []);

    useEffect(() => {
        if (open) {
            calculateDropdownPosition();
            const handleReposition = () => calculateDropdownPosition();
            window.addEventListener('scroll', handleReposition, true);
            window.addEventListener('resize', handleReposition);
            return () => {
                window.removeEventListener('scroll', handleReposition, true);
                window.removeEventListener('resize', handleReposition);
            };
        }
    }, [open, calculateDropdownPosition]);

    useEffect(() => {
        if (open && allOptions.length === 0 && selectedEnterprise) {
            loadAllOptions();
        }
    }, [open, allOptions.length, selectedEnterprise, loadAllOptions]);

    useEffect(() => {
        setCurrent(value);
    }, [value]);

    useEffect(() => {
        const onDoc = (e: MouseEvent) => {
            const target = e.target as Node;
            const withinAnchor = !!containerRef.current?.contains(target);
            const withinDropdown = !!dropdownRef.current?.contains(target);
            if (!withinAnchor && !withinDropdown) {
                setOpen(false);
            }
        };
        document.addEventListener('click', onDoc, true);
        return () => document.removeEventListener('click', onDoc, true);
    }, []);

    // Filter options
    const filterOptions = useCallback(() => {
        if (allOptions.length === 0) {
            setOptions([]);
            return;
        }
        let filtered = allOptions;
        
        if (query) {
            const queryLower = query.toLowerCase();
            filtered = filtered.filter(opt => 
                opt.name.toLowerCase().startsWith(queryLower)
            );
            
            filtered = filtered.sort((a, b) => {
                const aLower = a.name.toLowerCase();
                const bLower = b.name.toLowerCase();
                if (aLower === queryLower && bLower !== queryLower) return -1;
                if (bLower === queryLower && aLower !== queryLower) return 1;
                return aLower.localeCompare(bLower);
            });
        }
        
        setOptions(filtered);
    }, [allOptions, query]);

    useEffect(() => {
        filterOptions();
    }, [filterOptions]);

    const addNew = async () => {
        const name = (query || '').trim();
        if (!name) return;

        const existingMatch = allOptions.find(
            (opt) => opt.name.toLowerCase() === name.toLowerCase(),
        );

        if (existingMatch) {
            onChange(existingMatch.name);
            setCurrent(existingMatch.name);
            setQuery('');
            setOpen(false);
            setHasPendingNewValue(false);
            return;
        }

        try {
            // Create new product via API
            const created = await api.post<{id: string; name: string} | any>(
                '/api/products',
                {name},
            );
            
            const formattedCreated = {
                id: created?.id || String(Math.random()),
                name: created?.name || name
            };
            
            if (formattedCreated) {
                setOptions((prev) => {
                    const exists = prev.some((o) => o.id === formattedCreated.id);
                    return exists ? prev : [...prev, formattedCreated];
                });
                setAllOptions((prev) => {
                    const exists = prev.some((o) => o.id === formattedCreated.id);
                    return exists ? prev : [...prev, formattedCreated];
                });
                onChange(formattedCreated.name);
                setCurrent(formattedCreated.name);
                setQuery('');
                setOpen(false);
                setHasPendingNewValue(false);
                
                if (onNewItemCreated) {
                    onNewItemCreated(formattedCreated);
                }
            }
        } catch (error: any) {
            console.error('Failed to create product:', error);
            if (
                error?.message?.includes('already exists') ||
                error?.message?.includes('duplicate')
            ) {
                const existingItem = allOptions.find(
                    (opt) => opt.name.toLowerCase() === name.toLowerCase(),
                );
                if (existingItem) {
                    onChange(existingItem.name);
                    setCurrent(existingItem.name);
                    setQuery('');
                    setOpen(false);
                    setHasPendingNewValue(false);
                }
            }
        }
    };

    return (
        <div
            ref={containerRef}
            className='relative min-w-0 flex items-center gap-1 group/item'
            style={{maxWidth: '100%', width: '100%'}}
        >
            <div 
                className='relative w-full flex items-center gap-1' 
                style={{width: '100%', minWidth: '100%'}}
            >
                {(current || value) && !open ? (
                    <motion.span
                        ref={inputRef}
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
                        className='w-full inline-flex items-center gap-1 px-2 py-1 text-[11px] leading-[14px] bg-white text-black rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500'
                        style={{width: '100%', minWidth: '100%', maxWidth: '100%'}}
                        title={current || value}
                        tabIndex={0}
                        onClick={(e: any) => {
                            if (!(e.target as HTMLElement).closest('button')) {
                                setQuery(current || value || '');
                                setOpen(true);
                            }
                        }}
                        onKeyDown={(e: any) => {
                            // Handle Tab navigation from the chip to next field (Service) - exactly like AssignedUserGroupTable
                            if (e.key === 'Tab') {
                                e.preventDefault();
                                e.stopPropagation();
                                
                                // Find the current row and navigate to Service field
                                const currentElement = e.target as HTMLElement;
                                const currentColDiv = currentElement.closest('[data-col]');
                                const currentRowId = currentColDiv?.getAttribute('data-row-id');
                                
                                if (currentRowId) {
                                    // Find the Service field in the same row
                                    const nextColDiv = document.querySelector(`[data-row-id="${currentRowId}"][data-col="service"]`);
                                    
                                    if (nextColDiv) {
                                        // Find the input or chip element in the Service field
                                        const serviceInput = nextColDiv.querySelector('input') as HTMLInputElement;
                                        const serviceChip = nextColDiv.querySelector('span[tabindex="0"]') as HTMLElement;
                                        
                                        // Focus the input if available, otherwise the chip
                                        const targetElement = serviceInput || serviceChip;
                                        
                                        if (targetElement) {
                                            setTimeout(() => {
                                                targetElement.focus();
                                            }, 10);
                                        }
                                    }
                                }
                            }
                        }}
                    >
                        <span className='flex-1 truncate pointer-events-none'>{current || value}</span>
                        <button
                            onClick={(e: any) => {
                                e.stopPropagation();
                                e.preventDefault();
                                onChange('');
                                setCurrent('');
                                setQuery('');
                            }}
                            className='hover:text-slate-900 opacity-0 group-hover/item:opacity-100 transition-opacity p-0.5 rounded-sm hover:bg-blue-100 flex-shrink-0'
                            aria-label='Remove'
                            style={{minWidth: '20px', minHeight: '20px'}}
                        >
                            <X size={12} />
                        </button>
                    </motion.span>
                ) : null}
                
                {(!current && !value) || open ? (
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={(e: any) => {
                            const newValue = e.target.value;
                            setQuery(newValue);
                            setOpen(true);
                            if (containerRef.current) {
                                const containerRect = containerRef.current.getBoundingClientRect();
                                const width = Math.max(140, Math.min(200, containerRect.width));
                                const top = containerRect.bottom + 2;
                                const left = containerRect.left;
                                setDropdownPortalPos({ top, left, width });
                            }
                            if (allOptions.length === 0 && selectedEnterprise) {
                                loadAllOptions();
                            }
                            if (newValue === '') {
                                onChange('');
                                setCurrent('');
                            }
                        }}
                        onFocus={() => {
                            setOpen(true);
                            if (containerRef.current) {
                                const containerRect = containerRef.current.getBoundingClientRect();
                                const width = Math.max(140, Math.min(200, containerRect.width));
                                const top = containerRect.bottom + 2;
                                const left = containerRect.left;
                                setDropdownPortalPos({ top, left, width });
                            }
                            if (allOptions.length === 0 && selectedEnterprise) {
                                loadAllOptions();
                            }
                        }}
                        onKeyDown={async (e: any) => {
                            if (e.key === 'Enter' && query.trim()) {
                                e.preventDefault();
                                e.stopPropagation();
                                const exactMatch = allOptions.find(opt => 
                                    opt.name.toLowerCase() === query.toLowerCase().trim()
                                );
                                if (exactMatch) {
                                    onChange(exactMatch.name);
                                    setCurrent(exactMatch.name);
                                    setQuery('');
                                    setOpen(false);
                                    setHasPendingNewValue(false);
                                    
                                    // Focus the chip after selecting existing value so Tab navigation works - exactly like AssignedUserGroupTable
                                    setTimeout(() => {
                                        try {
                                            if (inputRef.current) {
                                                inputRef.current.blur();
                                            }
                                            const currentElement = inputRef.current || (document.activeElement as HTMLElement);
                                            const currentColDiv = currentElement?.closest('[data-col]');
                                            const currentRowId = currentColDiv?.getAttribute('data-row-id');
                                            if (currentRowId) {
                                                const chipElement = document.querySelector(
                                                    `[data-row-id="${currentRowId}"][data-col="product"] span[tabindex="0"]`
                                                ) as HTMLElement;
                                                if (chipElement) {
                                                    chipElement.focus();
                                                }
                                            }
                                        } catch (error) {
                                            console.error('Failed to focus chip after Enter:', error);
                                        }
                                    }, 50);
                                } else {
                                    await addNew();
                                }
                            } else if (e.key === 'Escape') {
                                setOpen(false);
                                setQuery('');
                            } else if (e.key === 'Tab') {
                                if (query.trim() && hasPendingNewValue) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (!open) {
                                        setOpen(true);
                                    }
                                    inputRef.current?.focus();
                                    return;
                                }
                                if (query.trim()) {
                                    const exactMatch = allOptions.find(opt => 
                                        opt.name.toLowerCase() === query.toLowerCase().trim()
                                    );
                                    if (exactMatch) {
                                        onChange(exactMatch.name);
                                        setCurrent(exactMatch.name);
                                        setQuery('');
                                        setOpen(false);
                                        setHasPendingNewValue(false);
                                    }
                                } else {
                                    setOpen(false);
                                    setHasPendingNewValue(false);
                                }
                                
                                // Handle tab navigation
                                if (!e.shiftKey && onTabNext) {
                                    onTabNext();
                                } else if (e.shiftKey && onTabPrev) {
                                    onTabPrev();
                                }
                            }
                        }}
                        onBlur={(e) => {
                            const relatedTarget = e.relatedTarget as HTMLElement;
                            const isClickingInDropdown = dropdownRef.current?.contains(relatedTarget);
                            if (query.trim() && hasPendingNewValue && !isClickingInDropdown) {
                                e.preventDefault();
                                e.stopPropagation();
                                setTimeout(() => {
                                    inputRef.current?.focus();
                                    if (!open) {
                                        setOpen(true);
                                    }
                                }, 10);
                                return;
                            }
                            setTimeout(() => {
                                if (!open) {
                                    const exactMatch = allOptions.find(opt => 
                                        opt.name.toLowerCase() === (query || '').toLowerCase().trim()
                                    );
                                    if (exactMatch) {
                                        onChange(exactMatch.name);
                                        setCurrent(exactMatch.name);
                                        setHasPendingNewValue(false);
                                    } else if (query && query !== (current || value)) {
                                        // Keep the typed value
                                    } else if (!query) {
                                        setQuery('');
                                        setHasPendingNewValue(false);
                                    }
                                    setQuery('');
                                }
                            }, 150);
                        }}
                        className={`w-full text-left px-2 py-1 text-[12px] rounded border ${isError ? 'border-red-500 bg-red-50 ring-2 ring-red-200' : open ? 'border-blue-500 bg-white ring-2 ring-blue-200' : 'border-blue-300 bg-white hover:bg-slate-50'} ${!selectedEnterprise ? 'opacity-50 cursor-not-allowed' : ''} text-slate-700 focus:outline-none focus:ring-2 ${isError ? 'focus:ring-red-200 focus:border-red-500' : 'focus:ring-blue-200 focus:border-blue-500'}`}
                        placeholder=""
                        disabled={!selectedEnterprise}
                        readOnly={!selectedEnterprise}
                    />
                ) : null}
            </div>
            
            {open && dropdownPortalPos && createPortal(
                <div 
                    ref={dropdownRef}
                    className='rounded-xl border border-slate-200 bg-white shadow-2xl'
                    onMouseDown={(e: any) => e.stopPropagation()}
                    onClick={(e: any) => e.stopPropagation()}
                    style={{
                        position: 'fixed',
                        top: `${dropdownPortalPos.top}px`,
                        left: `${dropdownPortalPos.left}px`,
                        width: 'max-content',
                        minWidth: `${dropdownPortalPos.width}px`,
                        maxWidth: '500px',
                        zIndex: 10000
                    }}
                >
                    <div className="absolute -top-2 left-6 h-3 w-3 rotate-45 bg-white border-t border-l border-slate-200"></div>
                    <div className='relative z-10 flex flex-col'>
                        <div className='py-1 text-[12px] px-3 space-y-2 overflow-y-auto' style={{maxHeight: '200px'}}>
                            {loading && allOptions.length === 0 && !query.trim() ? (
                                <div className='px-3 py-2 text-slate-500 text-center'>Loading…</div>
                            ) : !selectedEnterprise ? (
                                <div className='px-3 py-2 text-slate-500 text-center'>Please select Enterprise first</div>
                            ) : (() => {
                                const filteredOptions = query.trim() 
                                    ? options.filter(opt => 
                                        opt.name.toLowerCase().startsWith(query.toLowerCase()) ||
                                        opt.name.toLowerCase().includes(query.toLowerCase())
                                    ).sort((a, b) => {
                                        const aLower = a.name.toLowerCase();
                                        const bLower = b.name.toLowerCase();
                                        const queryLower = query.toLowerCase();
                                        const aStartsWith = aLower.startsWith(queryLower);
                                        const bStartsWith = bLower.startsWith(queryLower);
                                        if (aStartsWith && !bStartsWith) return -1;
                                        if (bStartsWith && !aStartsWith) return 1;
                                        return aLower.localeCompare(bLower);
                                    })
                                    : options.slice(0, 50);
                                
                                const exactMatch = query.trim() && allOptions.length > 0 ? allOptions.find(opt => 
                                    opt.name.toLowerCase() === query.toLowerCase().trim()
                                ) : null;
                                const showCreateNew = query.trim() && (allOptions.length === 0 || !exactMatch);
                                
                                if (filteredOptions.length === 0 && query.trim() && !loading) {
                                    return (
                                        <div className='px-3 py-2 text-slate-500 text-center'>No matches found</div>
                                    );
                                }

                                if (filteredOptions.length === 0 && !query.trim() && !loading && allOptions.length === 0) {
                                    return (
                                        <div className='px-3 py-2 text-slate-500 text-center'>No value found</div>
                                    );
                                }

                                return (
                                    <>
                                        {filteredOptions.map((opt, idx) => {
                                            const palette = [
                                                { bg: 'bg-blue-100', hover: 'hover:bg-blue-200', text: 'text-blue-700' },
                                                { bg: 'bg-cyan-100', hover: 'hover:bg-cyan-200', text: 'text-cyan-700' },
                                                { bg: 'bg-sky-100', hover: 'hover:bg-sky-200', text: 'text-sky-700' },
                                                { bg: 'bg-indigo-100', hover: 'hover:bg-indigo-200', text: 'text-indigo-700' },
                                            ];
                                            const tone = palette[idx % palette.length];
                                            
                                            return (
                                                <motion.div
                                                    key={opt.id}
                                                    initial={{scale: 0.98, opacity: 0}}
                                                    animate={{scale: 1, opacity: 1}}
                                                    whileHover={{scale: 1.02, y: -1}}
                                                    transition={{type: 'spring', stiffness: 400, damping: 25}}
                                                    className='relative group'
                                                >
                                                    <div
                                                        className={`w-full rounded-lg px-3 py-2.5 ${tone.bg} ${tone.hover} ${tone.text} transition-all duration-200 font-medium shadow-sm hover:shadow-md relative overflow-visible flex items-center justify-between cursor-pointer`}
                                                        style={{wordBreak: 'keep-all', whiteSpace: 'nowrap'}}
                                                        onClick={() => {
                                                            onChange(opt.name);
                                                            setCurrent(opt.name);
                                                            setQuery('');
                                                            setOpen(false);
                                                            setHasPendingNewValue(false);
                                                            
                                                            // Focus the chip after clicking dropdown option so Tab navigation works
                                                            setTimeout(() => {
                                                                try {
                                                                    if (inputRef.current) {
                                                                        inputRef.current.blur();
                                                                    }
                                                                    const currentElement = inputRef.current || (document.activeElement as HTMLElement);
                                                                    const currentColDiv = currentElement?.closest('[data-col]');
                                                                    const currentRowId = currentColDiv?.getAttribute('data-row-id');
                                                                    if (currentRowId) {
                                                                        const chipElement = document.querySelector(
                                                                            `[data-row-id="${currentRowId}"][data-col="product"] span[tabindex="0"]`
                                                                        ) as HTMLElement;
                                                                        if (chipElement) {
                                                                            chipElement.focus();
                                                                        }
                                                                    }
                                                                } catch (error) {
                                                                    console.error('Failed to focus chip after dropdown selection:', error);
                                                                }
                                                            }, 50);
                                                        }}
                                                    >
                                                        <span className='relative z-10 flex-1'>{opt.name}</span>
                                                        <div className='absolute inset-0 bg-gradient-to-r from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200' />
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                        
                                        {showCreateNew && (
                                            <motion.div
                                                initial={{scale: 0.98, opacity: 0}}
                                                animate={{scale: 1, opacity: 1}}
                                                className='mt-2 border-t border-slate-200 pt-2'
                                            >
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        addNew();
                                                    }}
                                                    className='w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 transition-colors duration-150 rounded-lg'
                                                    type='button'
                                                >
                                                    + Add &quot;{query.trim()}&quot;
                                                </button>
                                            </motion.div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

// AsyncChipSelect for Service with dropdown filtered by Account, Enterprise, and Product
function AsyncChipSelectService({
    value,
    onChange,
    placeholder = '',
    isError = false,
    selectedEnterprise = '',
    selectedProduct = '',
    selectedAccountId = '',
    selectedEnterpriseId = '',
    onNewItemCreated,
    onTabNext,
    onTabPrev,
}: {
    value?: string;
    onChange: (next?: string) => void;
    placeholder?: string;
    isError?: boolean;
    selectedEnterprise?: string;
    selectedProduct?: string;
    selectedAccountId?: string;
    selectedEnterpriseId?: string;
    onNewItemCreated?: (item: {id: string; name: string}) => void;
    onTabNext?: () => void;
    onTabPrev?: () => void;
}) {
    const [open, setOpen] = useState(false);
    const [current, setCurrent] = useState<string | undefined>(value);
    const [query, setQuery] = useState('');
    const [options, setOptions] = useState<Array<{id: string; name: string}>>([]);
    const [allOptions, setAllOptions] = useState<Array<{id: string; name: string}>>([]);
    const [loading, setLoading] = useState(false);
    const [hasPendingNewValue, setHasPendingNewValue] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [dropdownPortalPos, setDropdownPortalPos] = useState<{
        top: number;
        left: number;
        width: number;
    } | null>(null);

    // Load options from account licenses filtered by Account, Enterprise, and Product
    const loadAllOptions = useCallback(async (overrideProduct?: string) => {
        const productToUse = overrideProduct !== undefined ? overrideProduct : selectedProduct;
        
        setLoading(true);
        try {
            // Service field is disabled until Product is selected
            if (!selectedAccountId || !selectedEnterprise || !productToUse) {
                setAllOptions([]);
                setLoading(false);
                return;
            }

            // Get account data to find services from licenses
            const accountData = await api.get<{
                licenses: Array<{
                    enterprise: string;
                    product: string;
                    service: string;
                }>;
            }>(`/api/accounts/${selectedAccountId}`) || { licenses: [] };
            
            // Extract unique service names from licenses that match selected enterprise and product
            const uniqueServices = Array.from(new Set(
                accountData.licenses
                    .filter(license => 
                        license.enterprise === selectedEnterprise &&
                        license.product === productToUse &&
                        license.service && license.service.trim() !== ''
                    )
                    .map(license => license.service.trim())
            ));
            
            // Convert to the expected format
            const allData = uniqueServices.map((service, index) => ({
                id: `service-${index}`,
                name: service
            }));
            
            setAllOptions(allData);
        } catch (error) {
            console.error('Failed to load services:', error);
            setAllOptions([]);
        } finally {
            setLoading(false);
        }
    }, [selectedEnterprise, selectedProduct]);

    const isNewValuePending = useCallback((queryValue: string): boolean => {
        if (!queryValue.trim()) return false;
        const exactMatch = allOptions.find(opt => 
            opt.name.toLowerCase() === queryValue.toLowerCase().trim()
        );
        return !exactMatch;
    }, [allOptions]);

    useEffect(() => {
        setHasPendingNewValue(isNewValuePending(query));
    }, [query, isNewValuePending]);

    const calculateDropdownPosition = useCallback(() => {
        if (!containerRef.current) return;
        const containerRect = containerRef.current.getBoundingClientRect();
        const width = Math.max(140, Math.min(200, containerRect.width));
        const top = containerRect.bottom + 2;
        const left = containerRect.left;
        setDropdownPortalPos({ top, left, width });
    }, []);

    useEffect(() => {
        if (open) {
            calculateDropdownPosition();
            const handleReposition = () => calculateDropdownPosition();
            window.addEventListener('scroll', handleReposition, true);
            window.addEventListener('resize', handleReposition);
            return () => {
                window.removeEventListener('scroll', handleReposition, true);
                window.removeEventListener('resize', handleReposition);
            };
        }
    }, [open, calculateDropdownPosition]);

    useEffect(() => {
        if (open && allOptions.length === 0 && selectedEnterprise && selectedProduct) {
            loadAllOptions();
        }
    }, [open, allOptions.length, selectedEnterprise, selectedProduct, loadAllOptions]);
    
    useEffect(() => {
        if (selectedEnterprise && selectedProduct && allOptions.length === 0) {
            loadAllOptions();
        }
    }, [selectedProduct, selectedEnterprise, allOptions.length, loadAllOptions]);

    useEffect(() => {
        setCurrent(value);
    }, [value]);

    useEffect(() => {
        const onDoc = (e: MouseEvent) => {
            const target = e.target as Node;
            const withinAnchor = !!containerRef.current?.contains(target);
            const withinDropdown = !!dropdownRef.current?.contains(target);
            if (!withinAnchor && !withinDropdown) {
                setOpen(false);
            }
        };
        document.addEventListener('click', onDoc, true);
        return () => document.removeEventListener('click', onDoc, true);
    }, []);

    const filterOptions = useCallback(() => {
        if (allOptions.length === 0) {
            setOptions([]);
            return;
        }
        let filtered = allOptions;
        
        if (query) {
            const queryLower = query.toLowerCase();
            filtered = filtered.filter(opt => 
                opt.name.toLowerCase().startsWith(queryLower)
            );
            
            filtered = filtered.sort((a, b) => {
                const aLower = a.name.toLowerCase();
                const bLower = b.name.toLowerCase();
                if (aLower === queryLower && bLower !== queryLower) return -1;
                if (bLower === queryLower && aLower !== queryLower) return 1;
                return aLower.localeCompare(bLower);
            });
        }
        
        setOptions(filtered);
    }, [allOptions, query]);

    useEffect(() => {
        filterOptions();
    }, [filterOptions]);

    const addNew = async () => {
        const name = (query || '').trim();
        if (!name) return;

        const existingMatch = allOptions.find(
            (opt) => opt.name.toLowerCase() === name.toLowerCase(),
        );

        if (existingMatch) {
            onChange(existingMatch.name);
            setCurrent(existingMatch.name);
            setQuery('');
            setOpen(false);
            setHasPendingNewValue(false);
            return;
        }

        try {
            const created = await api.post<{id: string; name: string} | any>(
                '/api/services',
                {name},
            );
            
            const formattedCreated = {
                id: created?.id || String(Math.random()),
                name: created?.name || name
            };
            
            if (formattedCreated) {
                setOptions((prev) => {
                    const exists = prev.some((o) => o.id === formattedCreated.id);
                    return exists ? prev : [...prev, formattedCreated];
                });
                setAllOptions((prev) => {
                    const exists = prev.some((o) => o.id === formattedCreated.id);
                    return exists ? prev : [...prev, formattedCreated];
                });
                onChange(formattedCreated.name);
                setCurrent(formattedCreated.name);
                setQuery('');
                setOpen(false);
                setHasPendingNewValue(false);
                
                if (onNewItemCreated) {
                    onNewItemCreated(formattedCreated);
                }
            }
        } catch (error: any) {
            console.error('Failed to create service:', error);
            if (
                error?.message?.includes('already exists') ||
                error?.message?.includes('duplicate')
            ) {
                const existingItem = allOptions.find(
                    (opt) => opt.name.toLowerCase() === name.toLowerCase(),
                );
                if (existingItem) {
                    onChange(existingItem.name);
                    setCurrent(existingItem.name);
                    setQuery('');
                    setOpen(false);
                    setHasPendingNewValue(false);
                }
            }
        }
    };

    return (
        <div
            ref={containerRef}
            className='relative min-w-0 flex items-center gap-1 group/item'
            style={{maxWidth: '100%', width: '100%'}}
        >
            <div 
                className='relative w-full flex items-center gap-1' 
                style={{width: '100%', minWidth: '100%'}}
            >
                {(current || value) && !open ? (
                    <motion.span
                        ref={inputRef}
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
                        className='w-full inline-flex items-center gap-1 px-2 py-1 text-[11px] leading-[14px] bg-white text-black rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500'
                        style={{width: '100%', minWidth: '100%', maxWidth: '100%'}}
                        title={current || value}
                        tabIndex={0}
                        onClick={(e: any) => {
                            if (!(e.target as HTMLElement).closest('button')) {
                                setQuery(current || value || '');
                                setOpen(true);
                            }
                        }}
                        onKeyDown={(e: any) => {
                            // Handle Tab navigation from the chip to next field (Roles) - exactly like AssignedUserGroupTable
                            if (e.key === 'Tab') {
                                e.preventDefault();
                                e.stopPropagation();
                                
                                // Find the current row and navigate to Roles field
                                const currentElement = e.target as HTMLElement;
                                const currentColDiv = currentElement.closest('[data-col]');
                                const currentRowId = currentColDiv?.getAttribute('data-row-id');
                                
                                if (currentRowId) {
                                    // Find the Roles field in the same row
                                    const nextColDiv = document.querySelector(`[data-row-id="${currentRowId}"][data-col="roles"]`);
                                    
                                    if (nextColDiv) {
                                        // Find the SVG or focusable element in the Roles field
                                        const rolesElement = nextColDiv.querySelector('svg') as SVGSVGElement;
                                        
                                        if (rolesElement) {
                                            setTimeout(() => {
                                                rolesElement.focus();
                                            }, 10);
                                        }
                                    }
                                }
                            }
                        }}
                    >
                        <span className='flex-1 truncate pointer-events-none'>{current || value}</span>
                        <button
                            onClick={(e: any) => {
                                e.stopPropagation();
                                e.preventDefault();
                                onChange('');
                                setCurrent('');
                                setQuery('');
                            }}
                            className='hover:text-slate-900 opacity-0 group-hover/item:opacity-100 transition-opacity p-0.5 rounded-sm hover:bg-blue-100 flex-shrink-0'
                            aria-label='Remove'
                            style={{minWidth: '20px', minHeight: '20px'}}
                        >
                            <X size={12} />
                        </button>
                    </motion.span>
                ) : null}
                
                {(!current && !value) || open ? (
                    <input
                        ref={inputRef}
                        value={query}
                        disabled={!selectedProduct}
                        onChange={(e: any) => {
                            if (!selectedProduct) return; // Prevent changes when disabled
                            const newValue = e.target.value;
                            setQuery(newValue);
                            setOpen(true);
                            if (containerRef.current) {
                                const containerRect = containerRef.current.getBoundingClientRect();
                                const width = Math.max(140, Math.min(200, containerRect.width));
                                const top = containerRect.bottom + 2;
                                const left = containerRect.left;
                                setDropdownPortalPos({ top, left, width });
                            }
                            if (allOptions.length === 0 && selectedEnterprise && selectedProduct) {
                                loadAllOptions();
                            }
                            if (newValue === '') {
                                onChange('');
                                setCurrent('');
                            }
                        }}
                        onFocus={() => {
                            if (!selectedProduct) return; // Prevent focus when disabled
                            setOpen(true);
                            if (containerRef.current) {
                                const containerRect = containerRef.current.getBoundingClientRect();
                                const width = Math.max(140, Math.min(200, containerRect.width));
                                const top = containerRect.bottom + 2;
                                const left = containerRect.left;
                                setDropdownPortalPos({ top, left, width });
                            }
                            if (allOptions.length === 0 && selectedEnterprise && selectedProduct) {
                                loadAllOptions();
                            }
                        }}
                        onKeyDown={async (e: any) => {
                            if (e.key === 'Enter' && query.trim()) {
                                e.preventDefault();
                                e.stopPropagation();
                                const exactMatch = allOptions.find(opt => 
                                    opt.name.toLowerCase() === query.toLowerCase().trim()
                                );
                                if (exactMatch) {
                                    onChange(exactMatch.name);
                                    setCurrent(exactMatch.name);
                                    setQuery('');
                                    setOpen(false);
                                    setHasPendingNewValue(false);
                                    
                                    // Focus the chip after selecting existing value so Tab navigation works - exactly like AssignedUserGroupTable
                                    setTimeout(() => {
                                        try {
                                            if (inputRef.current) {
                                                inputRef.current.blur();
                                            }
                                            const currentElement = inputRef.current || (document.activeElement as HTMLElement);
                                            const currentColDiv = currentElement?.closest('[data-col]');
                                            const currentRowId = currentColDiv?.getAttribute('data-row-id');
                                            if (currentRowId) {
                                                const chipElement = document.querySelector(
                                                    `[data-row-id="${currentRowId}"][data-col="service"] span[tabindex="0"]`
                                                ) as HTMLElement;
                                                if (chipElement) {
                                                    chipElement.focus();
                                                }
                                            }
                                        } catch (error) {
                                            console.error('Failed to focus chip after Enter:', error);
                                        }
                                    }, 50);
                                } else {
                                    await addNew();
                                }
                            } else if (e.key === 'Escape') {
                                setOpen(false);
                                setQuery('');
                            } else if (e.key === 'Tab') {
                                if (query.trim() && hasPendingNewValue) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (!open) {
                                        setOpen(true);
                                    }
                                    inputRef.current?.focus();
                                    return;
                                }
                                if (query.trim()) {
                                    const exactMatch = allOptions.find(opt => 
                                        opt.name.toLowerCase() === query.toLowerCase().trim()
                                    );
                                    if (exactMatch) {
                                        onChange(exactMatch.name);
                                        setCurrent(exactMatch.name);
                                        setQuery('');
                                        setOpen(false);
                                        setHasPendingNewValue(false);
                                    }
                                } else {
                                    setOpen(false);
                                    setHasPendingNewValue(false);
                                }
                                
                                // Handle tab navigation
                                if (!e.shiftKey && onTabNext) {
                                    onTabNext();
                                } else if (e.shiftKey && onTabPrev) {
                                    onTabPrev();
                                }
                            }
                        }}
                        onBlur={(e) => {
                            const relatedTarget = e.relatedTarget as HTMLElement;
                            const isClickingInDropdown = dropdownRef.current?.contains(relatedTarget);
                            if (query.trim() && hasPendingNewValue && !isClickingInDropdown) {
                                e.preventDefault();
                                e.stopPropagation();
                                setTimeout(() => {
                                    inputRef.current?.focus();
                                    if (!open) {
                                        setOpen(true);
                                    }
                                }, 10);
                                return;
                            }
                            setTimeout(() => {
                                if (!open) {
                                    const exactMatch = allOptions.find(opt => 
                                        opt.name.toLowerCase() === (query || '').toLowerCase().trim()
                                    );
                                    if (exactMatch) {
                                        onChange(exactMatch.name);
                                        setCurrent(exactMatch.name);
                                        setHasPendingNewValue(false);
                                    } else if (query && query !== (current || value)) {
                                        // Keep the typed value
                                    } else if (!query) {
                                        setQuery('');
                                        setHasPendingNewValue(false);
                                    }
                                    setQuery('');
                                }
                            }, 150);
                        }}
                        className={`w-full text-left px-2 py-1 text-[12px] rounded border ${isError ? 'border-red-500 bg-red-50 ring-2 ring-red-200' : open ? 'border-blue-500 bg-white ring-2 ring-blue-200' : 'border-blue-300 bg-white hover:bg-slate-50'} ${!selectedEnterprise || !selectedProduct ? 'opacity-50 cursor-not-allowed' : ''} text-slate-700 focus:outline-none focus:ring-2 ${isError ? 'focus:ring-red-200 focus:border-red-500' : 'focus:ring-blue-200 focus:border-blue-500'}`}
                        placeholder=""
                        readOnly={!selectedEnterprise || !selectedProduct}
                    />
                ) : null}
            </div>
            
            {open && dropdownPortalPos && createPortal(
                <div 
                    ref={dropdownRef}
                    className='rounded-xl border border-slate-200 bg-white shadow-2xl'
                    onMouseDown={(e: any) => e.stopPropagation()}
                    onClick={(e: any) => e.stopPropagation()}
                    style={{
                        position: 'fixed',
                        top: `${dropdownPortalPos.top}px`,
                        left: `${dropdownPortalPos.left}px`,
                        width: 'max-content',
                        minWidth: `${dropdownPortalPos.width}px`,
                        maxWidth: '500px',
                        zIndex: 10000
                    }}
                >
                    <div className="absolute -top-2 left-6 h-3 w-3 rotate-45 bg-white border-t border-l border-slate-200"></div>
                    <div className='relative z-10 flex flex-col'>
                        <div className='py-1 text-[12px] px-3 space-y-2 overflow-y-auto' style={{maxHeight: '200px'}}>
                            {loading && allOptions.length === 0 && !query.trim() ? (
                                <div className='px-3 py-2 text-slate-500 text-center'>Loading…</div>
                            ) : !selectedEnterprise ? (
                                <div className='px-3 py-2 text-slate-500 text-center'>Please select Enterprise first</div>
                            ) : !selectedProduct ? (
                                <div className='px-3 py-2 text-slate-500 text-center'>Please select Product first</div>
                            ) : (() => {
                                const filteredOptions = query.trim() 
                                    ? options.filter(opt => 
                                        opt.name.toLowerCase().startsWith(query.toLowerCase()) ||
                                        opt.name.toLowerCase().includes(query.toLowerCase())
                                    ).sort((a, b) => {
                                        const aLower = a.name.toLowerCase();
                                        const bLower = b.name.toLowerCase();
                                        const queryLower = query.toLowerCase();
                                        const aStartsWith = aLower.startsWith(queryLower);
                                        const bStartsWith = bLower.startsWith(queryLower);
                                        if (aStartsWith && !bStartsWith) return -1;
                                        if (bStartsWith && !aStartsWith) return 1;
                                        return aLower.localeCompare(bLower);
                                    })
                                    : options.slice(0, 50);
                                
                                const exactMatch = query.trim() && allOptions.length > 0 ? allOptions.find(opt => 
                                    opt.name.toLowerCase() === query.toLowerCase().trim()
                                ) : null;
                                const showCreateNew = query.trim() && (allOptions.length === 0 || !exactMatch);
                                
                                if (filteredOptions.length === 0 && query.trim() && !loading) {
                                    return (
                                        <div className='px-3 py-2 text-slate-500 text-center'>No matches found</div>
                                    );
                                }

                                if (filteredOptions.length === 0 && !query.trim() && !loading && allOptions.length === 0) {
                                    return (
                                        <div className='px-3 py-2 text-slate-500 text-center'>No value found</div>
                                    );
                                }

                                return (
                                    <>
                                        {filteredOptions.map((opt, idx) => {
                                            const palette = [
                                                { bg: 'bg-blue-100', hover: 'hover:bg-blue-200', text: 'text-blue-700' },
                                                { bg: 'bg-cyan-100', hover: 'hover:bg-cyan-200', text: 'text-cyan-700' },
                                                { bg: 'bg-sky-100', hover: 'hover:bg-sky-200', text: 'text-sky-700' },
                                                { bg: 'bg-indigo-100', hover: 'hover:bg-indigo-200', text: 'text-indigo-700' },
                                            ];
                                            const tone = palette[idx % palette.length];
                                            
                                            return (
                                                <motion.div
                                                    key={opt.id}
                                                    initial={{scale: 0.98, opacity: 0}}
                                                    animate={{scale: 1, opacity: 1}}
                                                    whileHover={{scale: 1.02, y: -1}}
                                                    transition={{type: 'spring', stiffness: 400, damping: 25}}
                                                    className='relative group'
                                                >
                                                    <div
                                                        className={`w-full rounded-lg px-3 py-2.5 ${tone.bg} ${tone.hover} ${tone.text} transition-all duration-200 font-medium shadow-sm hover:shadow-md relative overflow-visible flex items-center justify-between cursor-pointer`}
                                                        style={{wordBreak: 'keep-all', whiteSpace: 'nowrap'}}
                                                        onClick={() => {
                                                            onChange(opt.name);
                                                            setCurrent(opt.name);
                                                            setQuery('');
                                                            setOpen(false);
                                                            setHasPendingNewValue(false);
                                                            
                                                            // Focus the chip after clicking dropdown option so Tab navigation works
                                                            setTimeout(() => {
                                                                try {
                                                                    if (inputRef.current) {
                                                                        inputRef.current.blur();
                                                                    }
                                                                    const currentElement = inputRef.current || (document.activeElement as HTMLElement);
                                                                    const currentColDiv = currentElement?.closest('[data-col]');
                                                                    const currentRowId = currentColDiv?.getAttribute('data-row-id');
                                                                    if (currentRowId) {
                                                                        const chipElement = document.querySelector(
                                                                            `[data-row-id="${currentRowId}"][data-col="service"] span[tabindex="0"]`
                                                                        ) as HTMLElement;
                                                                        if (chipElement) {
                                                                            chipElement.focus();
                                                                        }
                                                                    }
                                                                } catch (error) {
                                                                    console.error('Failed to focus chip after dropdown selection:', error);
                                                                }
                                                            }, 50);
                                                        }}
                                                    >
                                                        <span className='relative z-10 flex-1'>{opt.name}</span>
                                                        <div className='absolute inset-0 bg-gradient-to-r from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200' />
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                        
                                        {showCreateNew && (
                                            <motion.div
                                                initial={{scale: 0.98, opacity: 0}}
                                                animate={{scale: 1, opacity: 1}}
                                                className='mt-2 border-t border-slate-200 pt-2'
                                            >
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        addNew();
                                                    }}
                                                    className='w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 transition-colors duration-150 rounded-lg'
                                                    type='button'
                                                >
                                                    + Add &quot;{query.trim()}&quot;
                                                </button>
                                            </motion.div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

interface UserRolesTableProps {
    rows: UserRoleRow[];
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    title?: string;
    groupByExternal?: 'none' | 'roleName' | 'entity' | 'product' | 'service';
    onGroupByChange?: (
        g: 'none' | 'roleName' | 'entity' | 'product' | 'service',
    ) => void;
    hideControls?: boolean;
    visibleColumns?: Array<
        | 'roleName'
        | 'description'
        | 'entity'
        | 'product'
        | 'service'
        | 'scope'
        | 'actions'
    >;
    highlightQuery?: string;
    customColumnLabels?: Record<string, string>;
    enableDropdownChips?: boolean;
    dropdownOptions?: {
        roleNames?: Array<{id: string; name: string}>;
        descriptions?: Array<{id: string; name: string}>;
        entities?: Array<{id: string; name: string}>;
        products?: Array<{id: string; name: string}>;
        services?: Array<{id: string; name: string}>;
        scope?: Array<{id: string; name: string}>;
    };
    onUpdateField?: (rowId: string, field: string, value: any) => void;
    hideRowExpansion?: boolean;
    enableInlineEditing?: boolean;
    incompleteRowIds?: string[];
    showValidationErrors?: boolean;
    hasBlankRow?: boolean;
    externalFieldErrors?: {[key: string]: Record<string, string>}; // Per-row field errors from parent
    onDropdownOptionUpdate?: (
        type: 'roleNames' | 'descriptions' | 'entities' | 'products' | 'services' | 'scope',
        action: 'update' | 'delete',
        oldName: string,
        newName?: string,
    ) => Promise<void>;
    onNewItemCreated?: (
        type: 'roleNames' | 'descriptions' | 'entities' | 'products' | 'services' | 'scope',
        item: {id: string; name: string},
    ) => void;
    onShowAllColumns?: () => void;
    compressingRowId?: string | null;
    foldingRowId?: string | null;
    compressingLicenseId?: string | null;
    foldingLicenseId?: string | null;
    triggerValidation?: boolean; // Trigger validation highlighting
    selectedEnterprise?: string;
    selectedEnterpriseId?: string;
    selectedAccountId?: string;
    selectedAccountName?: string;
    onValidationComplete?: (errorRowIds: string[]) => void; // Callback with validation results
    onAddNewRow?: () => void; // Callback to add a new row
    externalSortColumn?: string; // External sort column from parent
    externalSortDirection?: 'asc' | 'desc' | ''; // External sort direction from parent
    onSortChange?: (column: string, direction: 'asc' | 'desc') => void; // Callback when sort changes from column headers
    isAIInsightsPanelOpen?: boolean; // Whether the AI insights panel is expanded
    onLicenseValidationChange?: (hasIncompleteLicenses: boolean, incompleteLicenseRows: string[]) => void; // Callback for license validation state
    onLicenseDelete?: (licenseId: string) => Promise<void>; // Callback for license deletion with animation
    onCompleteLicenseDeletion?: () => void; // Callback to complete license deletion after confirmation
    onOpenAddressModal?: (row: UserRoleRow) => void; // Callback to open address modal
    onOpenUserGroupModal?: (row: UserRoleRow) => void; // Callback to open user group modal
    onOpenScopeModal?: (row: UserRoleRow) => void; // Callback to open scope config modal
    onShowStartDateProtectionModal?: (message: string) => void; // Callback to show start date protection modal
    onDuplicateDetected?: (message: string) => void; // Callback to show duplicate entry modal
}

function SortableUserRoleRow({
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
    onOpenUserGroupModal,
    onOpenScopeModal,
    onShowStartDateProtectionModal,
    selectedEnterprise = '',
    selectedEnterpriseId = '',
    selectedAccountId = '',
    selectedAccountName = '',
    onShowGlobalValidationModal,
}: {
    row: UserRoleRow;
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
    onUpdateField: (rowId: string, key: keyof UserRoleRow, value: any) => void;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onStartFill: (rowId: string, col: keyof UserRoleRow, value: string) => void;
    inFillRange: boolean;
    pinFirst?: boolean;
    firstColWidth?: string;
    hideRowExpansion?: boolean;
    enableDropdownChips?: boolean;
    shouldShowHorizontalScroll?: boolean;
    onDropdownOptionUpdate?: (
        type: 'roleNames' | 'descriptions' | 'entities' | 'products' | 'services' | 'scope',
        action: 'update' | 'delete',
        oldName: string,
        newName?: string,
    ) => Promise<void>;
    onNewItemCreated?: (
        type: 'roleNames' | 'descriptions' | 'entities' | 'products' | 'services' | 'scope',
        item: {id: string; name: string},
    ) => void;
    isCellMissing?: (rowId: string, field: string) => boolean;
    compressingRowId?: string | null;
    foldingRowId?: string | null;
    allRows?: UserRoleRow[];
    onDeleteClick?: (rowId: string) => void;
    onOpenAddressModal?: (row: UserRoleRow) => void;
    onOpenUserGroupModal?: (row: UserRoleRow) => void;
    onOpenScopeModal?: (row: UserRoleRow) => void;
    onShowStartDateProtectionModal?: (message: string) => void;
    onShowGlobalValidationModal?: (rowId: string, field: string, message: string) => void;
    selectedEnterprise?: string;
    selectedEnterpriseId?: string;
    selectedAccountId?: string;
    selectedAccountName?: string;
}) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [menuUp, setMenuUp] = useState(false);
    const actionsRef = useRef<HTMLDivElement>(null);
    const [menuPos, setMenuPos] = useState<{top: number; left: number} | null>(
        null,
    );
    const [isRowHovered, setIsRowHovered] = useState(false);
    
    // Validation state management for each field
    const [fieldValidationErrors, setFieldValidationErrors] = useState<{
        groupName?: string;
        description?: string;
        entity?: string;
        product?: string;
        service?: string;
    }>({});

    // Helper functions for validation error management
    const setFieldError = (field: string, error: string | null) => {
        setFieldValidationErrors(prev => ({
            ...prev,
            [field]: error || undefined
        }));
    };

    const clearFieldError = (field: string) => {
        setFieldValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[field as keyof typeof newErrors];
            return newErrors;
        });
    };

    const showValidationModal = (field: string, message: string) => {
        onShowGlobalValidationModal?.(row.id, field, message);
    };

    // Check if the row has any validation errors
    const hasValidationErrors = () => {
        return Object.keys(fieldValidationErrors).length > 0;
    };

    // Check if a specific field has validation errors
    const hasFieldError = (field: string) => {
        return !!fieldValidationErrors[field as keyof typeof fieldValidationErrors];
    };

    // Block focus on fields when there are validation errors in other fields
    const handleFieldFocus = (targetField: string, originalFocusHandler?: () => void) => {
        // Find the first field with an error (if any)
        const errorFields = Object.keys(fieldValidationErrors);
        if (errorFields.length > 0) {
            const firstErrorField = errorFields[0];
            // If the field being focused is not the error field, show validation modal
            if (firstErrorField !== targetField) {
                const errorMessage = fieldValidationErrors[firstErrorField as keyof typeof fieldValidationErrors];
                if (errorMessage) {
                    showValidationModal(firstErrorField, errorMessage);
                }
                return; // Prevent focus - modal will handle returning focus to correct field
            }
        }
        
        // Allow focus if no errors or focusing the error field itself
        if (originalFocusHandler) {
            originalFocusHandler();
        }
    };

    // Tab navigation state and logic
    const editableCols = cols.filter((col) =>
        [
            'roleName',
            'description',
            'entity',
            'product',
            'service',
        ].includes(col),
    );

    const createTabNavigation = (currentCol: string) => {
        const currentIndex = editableCols.indexOf(currentCol);

        const onTabNext = () => {
            // Check if ANY field has validation errors (not just current field)
            const errorFields = Object.keys(fieldValidationErrors);
            if (errorFields.length > 0) {
                const firstErrorField = errorFields[0];
                const errorMessage = fieldValidationErrors[firstErrorField as keyof typeof fieldValidationErrors];
                if (errorMessage) {
                    showValidationModal(firstErrorField, errorMessage);
                }
                return; // Prevent navigation
            }

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
                }, 10);
            }
        };

        const onTabPrev = () => {
            // Check if ANY field has validation errors (not just current field)
            const errorFields = Object.keys(fieldValidationErrors);
            if (errorFields.length > 0) {
                const firstErrorField = errorFields[0];
                const errorMessage = fieldValidationErrors[firstErrorField as keyof typeof fieldValidationErrors];
                if (errorMessage) {
                    showValidationModal(firstErrorField, errorMessage);
                }
                return; // Prevent navigation
            }

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
        tone: 'slate' | 'blue' | 'sky' | 'indigo' | 'cyan';
    }) => {
        return (
            <motion.span
                initial={{scale: 0.95, opacity: 0}}
                animate={{scale: 1, opacity: 1}}
                whileHover={{y: -1, boxShadow: '0 1px 6px rgba(15,23,42,0.15)'}}
                transition={{type: 'spring', stiffness: 480, damping: 30}}
                className='w-full flex items-center gap-1 px-1.5 py-0.5 text-[11px] leading-[14px] bg-white text-black rounded-sm relative max-w-full min-w-0 overflow-hidden'
                title={text}
            >
                <span className='truncate'>{text}</span>
            </motion.span>
        );
    };

    return (
        <div
            id={row.id}
            data-account-id={row.id}
            onMouseEnter={() => setIsRowHovered(true)}
            onMouseLeave={() => setIsRowHovered(false)}
            className={`w-full grid items-center gap-0 border rounded-lg transition-all duration-200 ease-in-out h-11 mb-1 pb-1 ${
                isSelected 
                    ? 'border-blue-300 bg-blue-50 shadow-md ring-1 ring-blue-200' 
                    : 'border-slate-200 hover:bg-blue-50 hover:shadow-lg hover:ring-1 hover:ring-blue-200 hover:border-blue-300 hover:-translate-y-0.5'
            } ${index % 2 === 0 ? (isSelected ? '' : 'bg-white') : (isSelected ? '' : 'bg-slate-50/70')} ${
                inFillRange ? 'bg-primary-50/40' : ''
            } ${
                isExpanded
                    ? 'bg-primary-50'
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
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e: any) => {
                            e.stopPropagation();
                            if (onDeleteClick) {
                                onDeleteClick(row.id);
                            }
                        }}
                        className='group/delete flex items-center justify-center w-4 h-4 text-red-500 hover:text-white border border-red-300 hover:border-red-500 bg-white hover:bg-red-500 rounded-full transition-all duration-200 ease-out no-drag shadow-sm hover:shadow-md'
                        title='Delete row'
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
            {cols.includes('roleName') && (
                <div
                    className={`group flex items-center gap-1.5 border-r border-slate-200 px-2 py-1 w-full overflow-visible ${
                        pinFirst && !shouldShowHorizontalScroll
                            ? 'sticky left-0 z-10 shadow-[6px_0_8px_-6px_rgba(15,23,42,0.10)]'
                            : ''
                    }`}
                    style={{
                        backgroundColor: isSelected 
                            ? 'rgb(239 246 255)' // bg-blue-50
                            : (index % 2 === 0 ? 'white' : 'rgb(248 250 252 / 0.7)') // bg-white or bg-slate-50/70
                    }}
                >
                    <div
                        className='relative flex items-center text-slate-700 font-normal text-[12px] w-full flex-1'
                        data-row-id={row.id}
                        data-col='roleName'
                        style={{width: '100%', minWidth: '100%', maxWidth: '100%', overflow: 'visible'}}
                    >
                        {enableDropdownChips ? (
                            <AsyncChipSelectRoleName
                                value={row.roleName || ''}
                                onChange={(v) => {
                                    onUpdateField(row.id, 'roleName' as any, v || '');
                                }}
                                placeholder=''
                                isError={isCellMissing(row.id, 'roleName') || !!((fieldValidationErrors as any)[row.id] && (fieldValidationErrors as any)[row.id].groupName)}
                                userGroups={allRows}
                                onNewItemCreated={(item) => {
                                    if (onNewItemCreated) {
                                        onNewItemCreated('roleNames', item);
                                    }
                                }}
                                selectedAccountId={selectedAccountId}
                                selectedAccountName={selectedAccountName}
                                selectedEnterpriseId={selectedEnterpriseId}
                                selectedEnterprise={selectedEnterprise}
                            />
                        ) : (
                            <InlineEditableText
                                value={row.roleName || ''}
                                onCommit={(v) =>
                                    onUpdateField(row.id, 'roleName' as any, v)
                                }
                                className='text-[12px]'
                                dataAttr={`groupName-${row.id}`}
                                isError={isCellMissing(row.id, 'roleName')}
                                placeholder='Enter group name'
                                {...createTabNavigation('roleName')}
                            />
                        )}
                    </div>
                </div>
            )}

            {/* Description Column */}
            {cols.includes('description') && (
                <div
                    className={`group flex items-center gap-1.5 border-r border-slate-200 px-2 py-1 w-full overflow-visible`}
                    style={{
                        backgroundColor: isSelected 
                            ? 'rgb(239 246 255)' // bg-blue-50
                            : (index % 2 === 0 ? 'white' : 'rgb(248 250 252 / 0.7)') // bg-white or bg-slate-50/70
                    }}
                >
                    <div
                        className='relative flex items-center text-slate-700 font-normal text-[12px] w-full flex-1'
                        data-row-id={row.id}
                        data-col='description'
                        style={{width: '100%', overflow: 'visible'}}
                    >
                        <EditableChipInput
                            value={row.description || ''}
                            onCommit={(v) => onUpdateField(row.id, 'description' as any, v)}
                            onRemove={() => onUpdateField(row.id, 'description' as any, '')}
                            className='text-[12px]'
                            dataAttr={`description-${row.id}`}
                            isError={isCellMissing(row.id, 'description') || !!((fieldValidationErrors as any)[row.id] && (fieldValidationErrors as any)[row.id].description)}
                            placeholder='Enter description'
                            {...createTabNavigation('description')}
                        />
                    </div>
                </div>
            )}

            {/* Entity Column */}
            {cols.includes('entity') && (
                <div
                    className={`group flex items-center gap-1.5 border-r border-slate-200 px-2 py-1 w-full overflow-visible`}
                    style={{
                        backgroundColor: isSelected 
                            ? 'rgb(239 246 255)' // bg-blue-50
                            : (index % 2 === 0 ? 'white' : 'rgb(248 250 252 / 0.7)') // bg-white or bg-slate-50/70
                    }}
                >
                    <div
                        className='relative flex items-center text-slate-700 font-normal text-[12px] w-full flex-1'
                        data-row-id={row.id}
                        data-col='entity'
                        style={{width: '100%', overflow: 'visible'}}
                    >
                        {enableDropdownChips ? (
                            <AsyncChipSelectEntity
                                value={row.entity || ''}
                                onChange={(v) => {
                                    onUpdateField(row.id, 'entity' as any, v || '');
                                }}
                                placeholder='Enter entity'
                                isError={isCellMissing(row.id, 'entity') || !!((fieldValidationErrors as any)[row.id] && (fieldValidationErrors as any)[row.id].entity)}
                                accounts={allRows}
                                onNewItemCreated={(item) => {
                                    if (onNewItemCreated) {
                                        onNewItemCreated('entities', item);
                                    }
                                }}
                                selectedEnterprise={selectedEnterprise}
                                selectedEnterpriseId={selectedEnterpriseId}
                                selectedAccountId={selectedAccountId}
                                selectedAccountName={selectedAccountName}
                                {...createTabNavigation('entity')}
                            />
                        ) : (
                            <InlineEditableText
                                value={row.entity || ''}
                                onCommit={(v) =>
                                    onUpdateField(row.id, 'entity' as any, v)
                                }
                                className='text-[12px]'
                                dataAttr={`entity-${row.id}`}
                                isError={isCellMissing(row.id, 'entity')}
                                placeholder='Enter entity'
                                {...createTabNavigation('entity')}
                            />
                        )}
                    </div>
                </div>
            )}

            {/* Product Column */}
            {cols.includes('product') && (
                <div
                    className={`group flex items-center gap-1.5 border-r border-slate-200 px-2 py-1 w-full overflow-visible`}
                    style={{
                        backgroundColor: isSelected 
                            ? 'rgb(239 246 255)' // bg-blue-50
                            : (index % 2 === 0 ? 'white' : 'rgb(248 250 252 / 0.7)') // bg-white or bg-slate-50/70
                    }}
                >
                    <div
                        className='flex items-center text-slate-700 font-normal text-[12px] w-full flex-1'
                        data-row-id={row.id}
                        data-col='product'
                        style={{width: '100%', overflow: 'visible'}}
                    >
                        {enableDropdownChips ? (
                            <AsyncChipSelectProduct
                                value={row.product || ''}
                                onChange={(v) => {
                                    onUpdateField(row.id, 'product' as any, v || '');
                                }}
                                placeholder='Enter product'
                                isError={isCellMissing(row.id, 'product') || !!((fieldValidationErrors as any)[row.id] && (fieldValidationErrors as any)[row.id].product)}
                                selectedEnterprise={selectedEnterprise}
                                selectedAccountId={selectedAccountId}
                                selectedEnterpriseId={selectedEnterpriseId}
                                onNewItemCreated={(item) => {
                                    if (onNewItemCreated) {
                                        onNewItemCreated('products', item);
                                    }
                                }}
                                {...createTabNavigation('product')}
                            />
                        ) : (
                            <InlineEditableText
                                value={row.product || ''}
                                onCommit={(v) =>
                                    onUpdateField(row.id, 'product' as any, v)
                                }
                                className='text-[12px]'
                                dataAttr={`product-${row.id}`}
                                isError={isCellMissing(row.id, 'product') || !!((fieldValidationErrors as any)[row.id] && (fieldValidationErrors as any)[row.id].product)}
                                placeholder='Enter product'
                                {...createTabNavigation('product')}
                            />
                        )}
                    </div>
                </div>
            )}

            {/* Service Column */}
            {cols.includes('service') && (
                <div
                    className={`group flex items-center gap-1.5 border-r border-slate-200 px-2 py-1 w-full overflow-visible`}
                    style={{
                        backgroundColor: isSelected 
                            ? 'rgb(239 246 255)' // bg-blue-50
                            : (index % 2 === 0 ? 'white' : 'rgb(248 250 252 / 0.7)') // bg-white or bg-slate-50/70
                    }}
                >
                    <div
                        className='flex items-center text-slate-700 font-normal text-[12px] w-full flex-1'
                        data-row-id={row.id}
                        data-col='service'
                        style={{width: '100%', overflow: 'visible'}}
                    >
                        {enableDropdownChips ? (
                            <AsyncChipSelectService
                                value={row.service || ''}
                                onChange={(v) => {
                                    onUpdateField(row.id, 'service' as any, v || '');
                                }}
                                placeholder={row.product ? 'Select service' : 'Select product first'}
                                isError={isCellMissing(row.id, 'service') || !!((fieldValidationErrors as any)[row.id] && (fieldValidationErrors as any)[row.id].service)}
                                selectedEnterprise={selectedEnterprise}
                                selectedProduct={row.product || ''}
                                selectedAccountId={selectedAccountId}
                                selectedEnterpriseId={selectedEnterpriseId}
                                onNewItemCreated={(item) => {
                                    if (onNewItemCreated) {
                                        onNewItemCreated('services', item);
                                    }
                                }}
                                {...createTabNavigation('service')}
                            />
                        ) : (
                            <InlineEditableText
                                value={row.service || ''}
                                onCommit={(v) =>
                                    onUpdateField(row.id, 'service' as any, v)
                                }
                                className='text-[12px]'
                                dataAttr={`service-${row.id}`}
                                isError={isCellMissing(row.id, 'service') || !!((fieldValidationErrors as any)[row.id] && (fieldValidationErrors as any)[row.id].service)}
                                placeholder='Enter service'
                                {...createTabNavigation('service')}
                            />
                        )}
                    </div>
                </div>
            )}

            {/* Roles Column */}
            {cols.includes('scope') && (
                <div
                    className={`group flex items-center gap-1.5 border-r border-slate-200 px-2 py-1 w-full overflow-visible`}
                    style={{
                        backgroundColor: isSelected 
                            ? 'rgb(239 246 255)' // bg-blue-50
                            : (index % 2 === 0 ? 'white' : 'rgb(248 250 252 / 0.7)') // bg-white or bg-slate-50/70
                    }}
                >
                    <div
                        className='flex items-center justify-center text-slate-700 font-normal text-[12px] w-full flex-1'
                        data-row-id={row.id}
                        data-col='scope'
                        style={{width: '100%', overflow: 'visible'}}
                    >
                        <button
                            onClick={() => {
                                if (onOpenScopeModal) {
                                    onOpenScopeModal(row);
                                }
                            }}
                            className="relative flex items-center justify-center w-6 h-6 bg-blue-100 border border-blue-300 rounded-lg transition-colors duration-150 hover:bg-blue-200 hover:border-blue-400"
                            title={`Configure scope for ${row.roleName || 'this role'}`}
                            tabIndex={-1}
                        >
                            <Settings className="w-4 h-4 text-blue-600" />
                        </button>
                    </div>
                </div>
            )}


            {/* actions column removed */}
            {/* trailing add row removed; fill handle removed */}
        </div>
    );
}

const ManageUserRolesTable = forwardRef<any, UserRolesTableProps>(({
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
    externalFieldErrors = {},
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
    selectedEnterprise = '',
    selectedEnterpriseId = '',
    selectedAccountId = '',
    selectedAccountName = '',
    onLicenseValidationChange,
    onLicenseDelete,
    onCompleteLicenseDeletion,
    onOpenAddressModal,
    onOpenUserGroupModal,
    onOpenScopeModal,
    onShowStartDateProtectionModal,
    onDuplicateDetected,
}, ref) => {
    // Debug: Log received props
    console.log('🐛 [ManageUserGroupsTable] Props received:', {
        selectedEnterprise,
        selectedEnterpriseId,
        selectedAccountId,
        selectedAccountName,
        rowsLength: rows.length
    });

    // Local validation state to track rows with errors
    const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set());
    const [fieldValidationErrors, setFieldValidationErrors] = useState<{[key: string]: Record<string, string>}>({});
    
    // Global validation modal state
    const [globalValidationModal, setGlobalValidationModal] = useState<{
        open: boolean;
        field: string;
        message: string;
        rowId: string;
    }>({ open: false, field: '', message: '', rowId: '' });

    // Scope Config Modal state
    const [showScopeModal, setShowScopeModal] = useState(false);
    const [selectedRoleForScope, setSelectedRoleForScope] = useState<UserRoleRow | null>(null);

    // Global validation modal helper functions
    const showGlobalValidationModal = useCallback((rowId: string, field: string, message: string) => {
        setGlobalValidationModal({
            open: true,
            field,
            message,
            rowId
        });
    }, []);

    const hideGlobalValidationModal = useCallback(() => {
        // Ensure the field error remains set after modal closes
        if (globalValidationModal.field && globalValidationModal.message && globalValidationModal.rowId) {
            // Keep the validation error active so field stays red
            setFieldValidationErrors(prev => {
                const newErrors = { ...prev };
                if (!newErrors[globalValidationModal.rowId]) {
                    newErrors[globalValidationModal.rowId] = {};
                }
                newErrors[globalValidationModal.rowId][globalValidationModal.field] = globalValidationModal.message;
                return newErrors;
            });
        }

        // Return focus to the problematic field
        if (globalValidationModal.rowId && globalValidationModal.field) {
            setTimeout(() => {
                const fieldInput = document.querySelector(
                    `[data-row-id="${globalValidationModal.rowId}"][data-col="${globalValidationModal.field}"] input`
                ) as HTMLInputElement;
                
                if (fieldInput) {
                    fieldInput.focus();
                    fieldInput.select(); // Select all text to help user fix the issue
                }
            }, 100);
        }
        
        setGlobalValidationModal({ open: false, field: '', message: '', rowId: '' });
    }, [globalValidationModal.rowId, globalValidationModal.field, globalValidationModal.message]);

    // Enhanced validation functions (same as TechnicalUserModal)
    const validateName = useCallback((name: string, fieldName: string): { isValid: boolean; error?: string } => {
        const trimmed = name.trim();
        
        if (!trimmed) {
            return { isValid: false, error: `${fieldName} is required` };
        }
        
        if (trimmed.length < 2) {
            return { isValid: false, error: `${fieldName} must be at least 2 characters long` };
        }
        
        if (trimmed.length > 50) {
            return { isValid: false, error: `${fieldName} must not exceed 50 characters` };
        }
        
        // Allow letters, spaces, hyphens, and apostrophes
        const nameRegex = /^[a-zA-Z\s\-']+$/;
        if (!nameRegex.test(trimmed)) {
            return { isValid: false, error: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes` };
        }
        
        // Check for multiple consecutive spaces or special characters
        if (/\s{2,}|[-']{2,}/.test(trimmed)) {
            return { isValid: false, error: `${fieldName} cannot contain consecutive spaces or special characters` };
        }
        
        return { isValid: true };
    }, []);

    const validateEmail = useCallback((email: string): { isValid: boolean; error?: string } => {
        const trimmed = email.trim();
        
        if (!trimmed) {
            return { isValid: false, error: 'Email address is required' };
        }
        
        // More comprehensive email regex
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        
        if (!emailRegex.test(trimmed)) {
            return { isValid: false, error: 'Please enter a valid email address' };
        }
        
        if (trimmed.length > 254) {
            return { isValid: false, error: 'Email address is too long' };
        }
        
        return { isValid: true };
    }, []);

    const validatePassword = useCallback((password: string): { isValid: boolean; error?: string } => {
        if (!password) {
            return { isValid: false, error: 'Password is required' };
        }
        
        if (password.length < 8) {
            return { isValid: false, error: 'Password must be at least 8 characters long' };
        }
        
        if (password.length > 128) {
            return { isValid: false, error: 'Password must not exceed 128 characters' };
        }
        
        // Check for at least one uppercase letter
        if (!/[A-Z]/.test(password)) {
            return { isValid: false, error: 'Password must contain at least one uppercase letter' };
        }
        
        // Check for at least one lowercase letter
        if (!/[a-z]/.test(password)) {
            return { isValid: false, error: 'Password must contain at least one lowercase letter' };
        }
        
        // Check for at least one number
        if (!/\d/.test(password)) {
            return { isValid: false, error: 'Password must contain at least one number' };
        }
        
        // Check for at least one special character
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            return { isValid: false, error: 'Password must contain at least one special character (!@#$%^&*...)' };
        }
        
        // Check for common weak patterns
        const commonPatterns = [
            /(.)\1{2,}/, // Three or more consecutive identical characters
            /123|234|345|456|567|678|789|890/, // Sequential numbers
            /abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i, // Sequential letters
        ];
        
        for (const pattern of commonPatterns) {
            if (pattern.test(password)) {
                return { isValid: false, error: 'Password contains common patterns and is not secure enough' };
            }
        }
        
        return { isValid: true };
    }, []);

    // Field validation handlers
    const handleFieldValidation = useCallback((rowId: string, fieldName: string, value: string, validationFn: (val: string, fieldName?: string) => { isValid: boolean; error?: string }) => {
        const validation = fieldName.includes('Name') ? validationFn(value, fieldName) : validationFn(value);
        
        setFieldValidationErrors(prev => {
            const newErrors = { ...prev };
            if (!newErrors[rowId]) {
                newErrors[rowId] = {};
            }
            
            if (!validation.isValid) {
                newErrors[rowId][fieldName] = validation.error || `${fieldName} is invalid`;
            } else {
                delete newErrors[rowId][fieldName];
                if (Object.keys(newErrors[rowId]).length === 0) {
                    delete newErrors[rowId];
                }
            }
            
            return newErrors;
        });
        
        return validation.isValid;
    }, []);
    
    // State for license deletion
    const [pendingDeleteLicenseId, setPendingDeleteLicenseId] = useState<string | null>(null);
    const [pendingDeleteRowId, setPendingDeleteRowId] = useState<string | null>(null);
    
    // Temporary empty rowLicenses to prevent errors during cleanup
    const rowLicenses: Record<string, any[]> = {};
    const setRowLicenses = () => {}; // Placeholder
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set<string>());
    
    // Validation state

    // Use refs to track previous values and avoid infinite loops
    const prevRowsRef = useRef<UserRoleRow[]>([]);
    const orderRef = useRef<string[]>([]);
    
    // Keep local state for editing, but initialize it safely
    const [localEdits, setLocalEdits] = useState<Record<string, Partial<UserRoleRow>>>({});
    
    // Use useMemo for base derived state with stable comparison
    const { baseLocalRows, order } = useMemo(() => {
        // Check if rows array length or IDs have changed (shallow comparison)
        const currentIds = rows.map(r => r.id).join(',');
        const prevIds = prevRowsRef.current.map(r => r.id).join(',');
        
        if (currentIds === prevIds && 
            rows.length === prevRowsRef.current.length) {
            // No changes detected - return cached data
            return {
                baseLocalRows: prevRowsRef.current,
                order: orderRef.current
            };
        }
        
        // Update refs and create new state
        prevRowsRef.current = rows.map(r => ({ ...r }));
        const newOrder = rows.map(r => r.id);
        orderRef.current = newOrder;
        
        return {
            baseLocalRows: prevRowsRef.current,
            order: newOrder
        };
    }, [rows]);
    
    // Apply local edits to create final localRows with stable reference
    const localRows = useMemo(() => {
        return baseLocalRows.map(row => {
            const edits = localEdits[row.id];
            if (!edits || Object.keys(edits).length === 0) {
                return row; // Return same reference if no edits
            }
            return {
                ...row,
                ...edits
            };
        });
    }, [baseLocalRows, localEdits]);
    
    // Helper function to validate email format
    const isValidEmail = (email: string): boolean => {
        if (!email || !email.trim()) return false;
        
        const trimmed = email.trim();
        
        // Length validation
        if (trimmed.length < 5 || trimmed.length > 254) return false;
        
        // RFC 5322 compliant email regex
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        
        return emailRegex.test(trimmed);
    };
    
    // Helper function to check if a field is missing/invalid
    const isFieldMissing = (row: UserRoleRow, field: string): boolean => {
        switch (field) {
            case 'roleName':
                return !row.roleName || row.roleName.trim() === '';
            case 'entity':
                return !row.entity || row.entity.trim() === '';
            case 'product':
                return !row.product || row.product.trim() === '';
            case 'service':
                return !row.service || row.service.trim() === '';
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
        const hasValidationError = showValidationErrors && (incompleteRowIds.includes(rowId) || validationErrors.has(rowId));
        
        if (!hasValidationError) return false;

        // When validation is explicitly triggered (showValidationErrors=true), show errors for all incomplete fields
        // including completely blank rows
        return isFieldMissing(row, field);
    };

    // Function to validate all rows and highlight missing fields
    const validateAndHighlightErrors = () => {
        const errorRowIds = new Set<string>();
        
        localRows.forEach(row => {
            // Check if any required field is missing
            if (isFieldMissing(row, 'roleName') ||
                isFieldMissing(row, 'entity') ||
                isFieldMissing(row, 'product') ||
                isFieldMissing(row, 'service')) {
                errorRowIds.add(row.id);
            }
        });
        
        setValidationErrors(errorRowIds);
        return errorRowIds;
    };
    
    // Effect to trigger validation when requested
    useEffect(() => {
        if (triggerValidation) {
            const errorRowIds = new Set<string>();
            
            // Use baseLocalRows with localEdits applied inline to avoid dependency issues
            baseLocalRows.forEach(baseRow => {
                const row = { ...baseRow, ...(localEdits[baseRow.id] || {}) };
                // Check if any required field is missing
                if (isFieldMissing(row, 'roleName') ||
                    isFieldMissing(row, 'entity') ||
                    isFieldMissing(row, 'product') ||
                    isFieldMissing(row, 'service')) {
                    errorRowIds.add(row.id);
                }
            });
            
            setValidationErrors(errorRowIds);
            
            if (onValidationComplete) {
                onValidationComplete(Array.from(errorRowIds));
            }
        }
    }, [triggerValidation, baseLocalRows, localEdits, onValidationComplete]);

    // Effect to highlight errors when incompleteRowIds changes from parent
    useEffect(() => {
        const newValidationErrors = showValidationErrors && incompleteRowIds.length > 0 
            ? new Set<string>(incompleteRowIds) 
            : new Set<string>();
        
        // Only update if there's actually a change to prevent infinite loops
        setValidationErrors(prev => {
            const prevArray = Array.from(prev).sort();
            const newArray = Array.from(newValidationErrors).sort();
            
            if (prevArray.length !== newArray.length || 
                prevArray.some((id, index) => id !== newArray[index])) {
                return newValidationErrors;
            }
            return prev;
        });
    }, [incompleteRowIds, showValidationErrors]);

    // If parent provides external field-level errors (e.g. format validation), apply them
    useEffect(() => {
        try {
            if (externalFieldErrors && Object.keys(externalFieldErrors).length > 0) {
                const errorRowIds = new Set<string>(Object.keys(externalFieldErrors));
                
                setFieldValidationErrors(prev => {
                    const hasChanged = JSON.stringify(prev) !== JSON.stringify(externalFieldErrors);
                    return hasChanged ? (externalFieldErrors as any) : prev;
                });
                
                setValidationErrors(prev => {
                    const prevArray = Array.from(prev).sort();
                    const newArray = Array.from(errorRowIds).sort();
                    
                    if (prevArray.length !== newArray.length || 
                        prevArray.some((id, index) => id !== newArray[index])) {
                        return errorRowIds;
                    }
                    return prev;
                });
            } else if (!showValidationErrors) {
                // clear when validation UI not active
                setFieldValidationErrors(prev => Object.keys(prev).length > 0 ? {} : prev);
                setValidationErrors(prev => prev.size > 0 ? new Set<string>() : prev);
            }
        } catch (e) {
            console.warn('Error applying field errors:', e);
        }
    }, [externalFieldErrors, showValidationErrors]);

    const orderedItems = useMemo(
        () =>
            order
                .map((id) => localRows.find((r) => r.id === id))
                .filter(Boolean) as UserRoleRow[],
        [order, localRows],
    );

    // Persist helpers
    // Debounced autosave per-row to avoid excessive API traffic
    const saveTimersRef = useRef<Record<string, any>>({});
    const latestRowRef = useRef<Record<string, UserRoleRow>>({});
    function schedulePersist(row: UserRoleRow, delay = 600) {
        const rowId = String(row.id);
        latestRowRef.current[rowId] = row;
        if (saveTimersRef.current[rowId])
            clearTimeout(saveTimersRef.current[rowId]);
        saveTimersRef.current[rowId] = setTimeout(() => {
            const latest = latestRowRef.current[rowId];
            if (latest) void persistUserRoleRow(latest);
        }, delay);
    }
    useEffect(() => {
        return () => {
            // cleanup pending timers on unmount without forcing save
            const currentTimers = saveTimersRef.current;
            Object.values(currentTimers).forEach((t) =>
                clearTimeout(t),
            );
        };
    }, []);

    async function persistUserRoleRow(row: UserRoleRow) {
        try {
            // Skip auto-save for temporary rows - let the parent handle account linkage auto-save
            if (String(row.id || '').startsWith('tmp-')) {
                return;
            }
            const core = {
                // Core fields for user group management
                groupName: row.roleName,
                description: row.description,
                entity: row.entity,
                product: row.product,
                service: row.service,
            } as any;
            // Map UI state into backend details JSON expected by server
            const details = {
                // User role specific fields
                roleName: row.roleName || '',
                description: row.description || '',
                entity: row.entity || '',
                product: row.product || '',
                service: row.service || '',
                scope: row.scope || '',
            } as any;
            // Handle existing (non-temporary) rows
            // Check if we're on user group management page
            if (
                typeof window !== 'undefined' &&
                window.location.pathname.includes('/manage-user-groups')
            ) {
                // For user group management, update the data via the parent's onUpdateField
                // The parent component will handle the user group data updates
                return;
            }

            // For user group management, all persistence is handled by parent component
            return;
        } catch (_e) {
            // TODO: surface toast; keep silent here to avoid blocking UI
        }
    }

    // Helper function to check for duplicate combinations
    const checkForDuplicate = (rowId: string, updatedRow: UserRoleRow): boolean => {
        // Check if combination of roleName + entity + product + service already exists in another row
        const duplicateRow = localRows.find(row => 
            row.id !== rowId && // Exclude current row
            row.roleName?.trim().toLowerCase() === updatedRow.roleName?.trim().toLowerCase() &&
            row.entity?.trim().toLowerCase() === updatedRow.entity?.trim().toLowerCase() &&
            row.product?.trim().toLowerCase() === updatedRow.product?.trim().toLowerCase() &&
            row.service?.trim().toLowerCase() === updatedRow.service?.trim().toLowerCase() &&
            // Only check for duplicates if all key fields are filled
            updatedRow.roleName?.trim() && 
            updatedRow.entity?.trim() && 
            updatedRow.product?.trim() && 
            updatedRow.service?.trim()
        );
        
        return !!duplicateRow;
    };

    function updateRowField(rowId: string, key: keyof UserRoleRow, value: any) {
        let changed: UserRoleRow | null = null;
        
        // Update local edits instead of directly modifying localRows
        setLocalEdits(prev => {
            // Use baseLocalRows with current edits to avoid circular dependency
            const baseRow = baseLocalRows.find(r => r.id === rowId);
            if (baseRow) {
                const currentEdits = prev[rowId] || {};
                const currentRow = { ...baseRow, ...currentEdits };
                const next = {...currentRow, [key]: value} as UserRoleRow;
                
                // If product field is being cleared, also clear the service field
                if (key === 'product' && (!value || value.trim() === '')) {
                    next.service = '';
                }
                
                // Check for duplicates only for key fields
                if (['roleName', 'entity', 'product', 'service'].includes(key as string)) {
                    const isDuplicate = checkForDuplicate(rowId, next);
                    if (isDuplicate) {
                        // Show duplicate modal via callback instead of browser alert
                        const message = `This combination of Role Name (${next.roleName}), Entity (${next.entity}), Product (${next.product}), and Service (${next.service}) already exists in another row. Please use a different combination.`;
                        if (onDuplicateDetected) {
                            onDuplicateDetected(message);
                        } else {
                            console.error('❌ Duplicate detected but no callback provided:', message);
                        }
                        return prev; // Don't update if duplicate
                    }
                }
                
                changed = next;
                
                // Prepare the field updates
                let fieldUpdates: any = { [key]: value };
                
                // If product field is being cleared, also clear the service field
                if (key === 'product' && (!value || value.trim() === '')) {
                    fieldUpdates.service = '';
                }
                
                return {
                    ...prev,
                    [rowId]: {
                        ...(prev[rowId] || {}),
                        ...fieldUpdates
                    }
                };
            }
            return prev;
        });
        
        if (changed) schedulePersist(changed);

        // Also call the parent's onUpdateField function if provided
        if (onUpdateField) {
            onUpdateField(rowId, key as string, value);
        }
    }

    // Helper function to check if main row fields are complete
    const isMainRowComplete = (row: UserRoleRow): boolean => {
        return !!(row.roleName && row.roleName.trim() && 
                 row.entity && row.entity.trim() && 
                 row.product && row.product.trim() &&
                 row.service && row.service.trim());
    };

    // State for grouping
    const [groupBy, setGroupBy] = useState<
        'none' | 'roleName' | 'entity' | 'product' | 'service'
    >('none');
    
    // sync external groupBy
    React.useEffect(() => {
        if (groupByExternal) setGroupBy(groupByExternal);
    }, [groupByExternal]);

    // Clean break - license management removed
    const columnOrder: UserRolesTableProps['visibleColumns'] = useMemo(
        () => [
            // User group columns
            'roleName',
            'description',
            'entity',
            'product',
            'service',
            'scope',
        ],
        [],
    );
    
    // Continue with component structure
    const cols = useMemo(() => {
        const base = (columnOrder || []) as string[];
        if (!visibleColumns) return base; // Only fall back to base if visibleColumns is null/undefined
        if (visibleColumns.length === 0) return []; // If empty array, show no columns
        const allowed = new Set(visibleColumns as string[]);
        // Keep canonical order from columnOrder; filter by visibility
        return base.filter((c) => allowed.has(c));
    }, [visibleColumns, columnOrder]);

    const colSizes = useMemo(() => ({
        deleteButton: '8px', // Space for delete button with proper padding
        groupName: '200px', // Group Name column - increased for sort arrows
        description: '250px', // Description column - needs more space
        entity: '180px', // Entity column - increased for sort arrows
        product: '180px', // Product column - increased for sort arrows
        service: '180px', // Service column - increased for sort arrows
        roles: '100px', // Roles column - icon only
    } as Record<string, string>), []);
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
                groupName: { min: 160, max: 280 }, // Group Name - needs more space
                description: { min: 200, max: 350 }, // Description - needs even more space
                entity: { min: 140, max: 250 }, // Entity column
                product: { min: 140, max: 250 }, // Product column
                service: { min: 140, max: 250 }, // Service column
                roles: { min: 80, max: 120 } // Roles - icon only, smaller
            };
            
            const columnConstraints = constraints[c as keyof typeof constraints] || { min: 140, max: 250 };
            
            if (dynamicWidth && dynamicWidth > 0) {
                // Clamp the dynamic width within constraints for all columns
                const clampedWidth = Math.max(
                    columnConstraints.min, 
                    Math.min(columnConstraints.max, dynamicWidth)
                );
                return `${clampedWidth}px`;
            }
            
            // Use default size from colSizes or fallback to constraint minimum
            const defaultSize = colSizes[c];
            if (defaultSize) {
                const numericSize = parseInt(defaultSize.replace('px', ''));
                if (!isNaN(numericSize)) {
                    const clampedSize = Math.max(
                        columnConstraints.min,
                        Math.min(columnConstraints.max, numericSize)
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

    // removed fill down state

    const startResize = (
        colKey: string,
        e: any,
    ) => {
        e.preventDefault();
        e.stopPropagation();
        
        const tableContainer = e.currentTarget.closest('.grid');
        if (!tableContainer) return;
        
        const startX = e.clientX;
        const startWidth = colWidths[colKey] || parseInt(colSizes[colKey]?.replace('px', '') || '140') || 140;
        
        // Define column-specific constraints
        const constraints = {
            enterprise: { min: 140, max: 250 }, // Increased min to prevent arrow overlap
            product: { min: 140, max: 280 }, // Reduced max to prevent over-expansion
            services: { min: 500, max: 2000 } // Increased minimum to ensure Services content visibility when scrolled
        };
        
        const columnConstraints = constraints[colKey as keyof typeof constraints] || { min: 100, max: 250 };
        
        // Add visual feedback during resize
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        
        const onMove = (ev: MouseEvent) => {
            ev.preventDefault();
            const delta = ev.clientX - startX;
            const newWidth = Math.max(
                columnConstraints.min, 
                Math.min(columnConstraints.max, startWidth + delta)
            );
            
            setColWidths((prev) => ({
                ...prev,
                [colKey]: newWidth
            }));
            
            // Trigger scroll check during resize to detect Services column visibility
            setTimeout(() => {
                if (tableContainerRef.current) {
                    const contentWidth = tableContainerRef.current.scrollWidth;
                    const containerWidth = tableContainerRef.current.clientWidth;
                    
                    // Check if Services content is getting hidden
                    const servicesColumns = tableContainerRef.current.querySelectorAll('[data-col="services"]');
                    let servicesContentHidden = false;
                    
                    servicesColumns.forEach(serviceCol => {
                        const serviceElement = serviceCol as HTMLElement;
                        const serviceRect = serviceElement.getBoundingClientRect();
                        const containerRect = tableContainerRef.current!.getBoundingClientRect();
                        
                        // Enhanced threshold based on zoom and AI panel state
                        const currentZoom = window.devicePixelRatio || 1;
                        const isZoomedIn = currentZoom > 1.1;
                        let widthThreshold = 500; // Increased base threshold for better content visibility
                        if (isZoomedIn) widthThreshold += 50;
                        if (isAIInsightsPanelOpen) widthThreshold += 50;
                        
                        if (serviceRect.right > containerRect.right || serviceRect.width < widthThreshold) {
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
                        (contentWidth * zoomAdjustedThreshold > containerWidth) || 
                        servicesContentHidden ||
                        (isZoomedIn && contentWidth > availableWidth * 0.95) ||
                        (isAIInsightsPanelOpen && contentWidth > availableWidth * 0.9);
                    
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
                    const contentWidth = tableContainerRef.current.scrollWidth;
                    const containerWidth = tableContainerRef.current.clientWidth;
                    
                    // Check if Services content is hidden
                    const servicesColumns = tableContainerRef.current.querySelectorAll('[data-col="services"]');
                    let servicesContentHidden = false;
                    
                    servicesColumns.forEach(serviceCol => {
                        const serviceElement = serviceCol as HTMLElement;
                        const serviceRect = serviceElement.getBoundingClientRect();
                        const containerRect = tableContainerRef.current!.getBoundingClientRect();
                        
                        // Enhanced threshold based on zoom and AI panel state
                        const currentZoom = window.devicePixelRatio || 1;
                        const isZoomedIn = currentZoom > 1.1;
                        let widthThreshold = 500; // Increased base threshold for better content visibility
                        if (isZoomedIn) widthThreshold += 50;
                        if (isAIInsightsPanelOpen) widthThreshold += 50;
                        
                        if (serviceRect.right > containerRect.right || serviceRect.width < widthThreshold) {
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
                        (contentWidth * zoomAdjustedThreshold > containerWidth) || 
                        servicesContentHidden ||
                        (isZoomedIn && contentWidth > availableWidth * 0.95) ||
                        (isAIInsightsPanelOpen && contentWidth > availableWidth * 0.9);
                    
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

    // For compatibility with the component usage
    const toggleRowExpansion = toggleExpanded;

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
    const [internalSortDir, setInternalSortDir] = useState<'asc' | 'desc' | null>(null);

    // Listen for clear sorting events from parent component
    useEffect(() => {
        const handleClearSorting = () => {
            setInternalSortCol(null);
            setInternalSortDir(null);
        };
        
        window.addEventListener('clearTableSorting', handleClearSorting);
        
        return () => {
            window.removeEventListener('clearTableSorting', handleClearSorting);
        };
    }, []);

    // Use external sort state if available, otherwise use internal state
    const sortCol = externalSortColumn || internalSortCol;
    const sortDir = externalSortDirection || internalSortDir;

    const toggleSort = (
        col:
            | 'accountName'
            | 'email'
            | 'phone'
            | 'status'
            | 'servicesCount',
        direction?: 'asc' | 'desc'
    ) => {
        let nextDir: 'asc' | 'desc';
        
        // Check if external sorting is actively being used (both props provided and not empty)
        const isExternalSorting = externalSortColumn && externalSortDirection;
        
        if (isExternalSorting) {
            // When external sort is actively controlled, use external state for calculation
            nextDir = direction || 
                (sortCol === col && sortDir === 'asc' ? 'desc' : 'asc');
            
            // Notify parent to update external sort state
            if (onSortChange) {
                onSortChange(col, nextDir);
            }
        } else {
            // When using internal sort (including first time with no sorting)
            nextDir = direction ||
                (internalSortCol === col && internalSortDir === 'asc' ? 'desc' : 'asc');
            
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
    const notifyParentSortChange = (column: string, direction: 'asc' | 'desc') => {
        // Dispatch a custom event that the parent can listen to
        const event = new CustomEvent('enterpriseTableSortChange', {
            detail: {
                column,
                direction
            },
            bubbles: true
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
            return { 'All Records': displayItems };
        }

        const groups: Record<string, UserRoleRow[]> = {};
        
        displayItems.forEach((item) => {
            let groupKey = '';
            
            switch (groupBy) {
                case 'roleName':
                    groupKey = item.roleName || '(No Role Name)';
                    break;
                case 'entity':
                    groupKey = item.entity || '(No Entity)';
                    break;
                case 'product':
                    groupKey = item.product || '(No Product)';
                    break;
                case 'service':
                    groupKey = item.service || '(No Service)';
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
        const sortedGroups: Record<string, UserRoleRow[]> = {};
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

    // Hook to detect if horizontal scroll is needed based on zoom/viewport and column resizing
    const [shouldShowHorizontalScroll, setShouldShowHorizontalScroll] = useState(false);
    const tableContainerRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        const checkScrollNeed = () => {
            if (!tableContainerRef.current) return;
            
            // With 6+ columns, we likely always need horizontal scrolling
            // Simplified logic: if we have more than 6 columns, enable scrolling
            const totalColumns = 6; // groupName, description, entity, product, service, roles
            const shouldAlwaysScroll = totalColumns >= 6;
            
            if (shouldAlwaysScroll) {
                setShouldShowHorizontalScroll(true);
                return;
            }
            
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
            const isContentOverflowing = contentWidth > containerWidth + hoverBuffer;
            
            // Check if Services column content is actually being cut off
            const servicesColumns = tableContainerRef.current.querySelectorAll('[data-col="services"]');
            let servicesContentHidden = false;
            
            if (servicesColumns.length > 0) {
                servicesColumns.forEach(serviceCol => {
                    const serviceElement = serviceCol as HTMLElement;
                    const serviceRect = serviceElement.getBoundingClientRect();
                    const containerRect = tableContainerRef.current!.getBoundingClientRect();
                    
                    // More reasonable threshold - minimum 300px for services content
                    const minServicesWidth = 300;
                    const bufferZone = 15; // Additional buffer for hover effects
                    
                    // Only trigger if Services column is actually cut off or too narrow to display content properly
                    if (serviceRect.right > containerRect.right - bufferZone || serviceRect.width < minServicesWidth) {
                        // Additional check: see if there's actually content being cut off
                        const servicesChips = serviceElement.querySelectorAll('.bg-white, .bg-gray-100, .bg-blue-50');
                        if (servicesChips.length > 0) {
                            servicesChips.forEach(chip => {
                                const chipRect = chip.getBoundingClientRect();
                                // Account for hover effects in chip positioning
                                if (chipRect.right > serviceRect.right - bufferZone) {
                                    servicesContentHidden = true;
                                }
                            });
                        }
                    }
                });
            }
            
            // Show scrollbar only when there's genuine overflow or content is being cut off
            const needsScrollbar = isContentOverflowing || servicesContentHidden;
            
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
                    const servicesCol = mutation.target.closest('[data-col="services"]');
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
                attributeFilter: ['style', 'class']
            });
            
            // Also observe all column cells for resize changes
            const columnCells = tableContainerRef.current.querySelectorAll('[data-col]');
            columnCells.forEach(cell => {
                if (cell instanceof Element) {
                    resizeObserver.observe(cell);
                }
            });
        }
        
        // Also listen for window resize (zoom changes)
        window.addEventListener('resize', debouncedScrollCheck);
        
        // Listen for zoom via keyboard shortcuts and mouse wheel
        const handleKeyZoom = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '0')) {
                debouncedScrollCheck();
            }
        };
        
        const handleWheelZoom = (e: WheelEvent) => {
            if (e.ctrlKey || e.metaKey) {
                debouncedScrollCheck();
            }
        };
        
        window.addEventListener('keydown', handleKeyZoom);
        window.addEventListener('wheel', handleWheelZoom, { passive: true });
        
        // Call checkScrollNeed initially
        checkScrollNeed();
        
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
        <div className='compact-table safari-tight manage-user-groups-table' style={{ width: '100%', minWidth: 'max-content' }}>
            {/* Using browser default scrollbars only - remove internal scroll containers */}
            <style dangerouslySetInnerHTML={{
                __html: `
                    /* Use browser's natural scrolling - no internal scroll containers */
                    .manage-user-groups-table div[role="table"] {
                        overflow: visible !important;
                        position: relative;
                    }
                    
                    /* Ensure all field value containers span full width */
                    .manage-user-groups-table [data-col] .bg-white {
                        width: 100% !important;
                        min-width: 100% !important;
                        display: flex !important;
                    }
                    
                    /* Ensure AsyncChipSelect containers span full width */
                    .manage-user-groups-table .relative.min-w-0 {
                        width: 100% !important;
                    }
                    
                    /* Ensure all motion spans with white background span full width */
                    .manage-user-groups-table motion-span[style*="background"] {
                        width: 100% !important;
                        min-width: 100% !important;
                    }
                    
                    /* Force all motion spans in data cells to be full width */
                    .manage-user-groups-table [data-col] motion-span {
                        width: 100% !important;
                        display: flex !important;
                    }
                    
                    /* Table container with proper scrolling */
                    div[role="table"] {
                        position: relative;
                        overflow-y: visible !important;
                        overflow-x: ${shouldShowHorizontalScroll ? 'auto !important' : 'hidden !important'};
                    }
                    
                    /* Ensure the header row respects the container's rounded corners */
                    .manage-user-groups-table .rounded-xl > .bg-slate-50 {
                        border-top-left-radius: 0.75rem !important;  /* Match rounded-xl */
                        border-top-right-radius: 0.75rem !important; /* Match rounded-xl */
                        margin: 0 !important;
                        border-left: none !important;
                        border-right: none !important;
                        border-top: none !important;
                    }
                    
                    /* Allow chips to move freely on hover */
                    .manage-user-groups-table .rounded-xl {
                        overflow: visible !important;
                        border-radius: 0.75rem !important;
                    }
                    
                    /* Override any border-radius interference */
                    .manage-user-groups-table .bg-slate-50 > div.rounded-sm {
                        border-radius: 0.125rem !important;
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
                `
            }} />
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
                <div 
                    ref={tableContainerRef}
                    role='table' 
                    className='p-0 w-full'
                    style={{
                        maxWidth: '100%',
                        minHeight: '400px', // Ensure minimum height for proper modal display
                        boxSizing: 'border-box'
                    } as React.CSSProperties}
                >
                <div className='w-full relative' style={{ 
                    minWidth: 'max-content', // Let content determine the minimum width
                    width: '100%', // Respect container width
                    maxWidth: '100%' // Don't exceed container
                }}>
                    {(() => {
                        const defaultLabels: Record<string, string> = {
                            roleName: 'Role Name',
                            description: 'Description',
                            entity: 'Entity',
                            product: 'Product',
                            service: 'Service',
                            scope: 'Scope',
                        };

                        // Merge custom labels with defaults
                        const labelFor: Record<string, string> = {
                            ...defaultLabels,
                            ...customColumnLabels,
                        };

                        const iconFor: Record<string, React.ReactNode> = {
                            groupName: (
                                <Users size={14} />
                            ),
                            description: (
                                <FileText size={14} />
                            ),
                            entity: (
                                <Building2 size={14} />
                            ),
                            product: (
                                <Package size={14} />
                            ),
                            service: (
                                <Settings size={14} />
                            ),
                            roles: (
                                <Shield size={14} />
                            ),
                        };
                        return (
                            <div className='rounded-xl border border-slate-300 shadow-sm bg-white' style={{ 
                                minWidth: 'fit-content', 
                                width: '100%',
                                maxWidth: '100%',
                                overflow: 'visible' // Allow chips to move freely on hover
                            }}>
                                <div
                                    className='sticky top-0 z-30 grid w-full gap-0 px-0 py-3 text-xs font-bold text-slate-800 bg-slate-50 border-b border-slate-200 shadow-sm'
                                    style={{
                                        gridTemplateColumns: gridTemplate, 
                                        minWidth: 'max-content',
                                        width: '100%',
                                        display: 'grid'
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
                                                idx === 0 && pinFirst && !shouldShowHorizontalScroll
                                                    ? 'sticky left-0 z-20 bg-slate-50 backdrop-blur-sm shadow-[6px_0_8px_-6px_rgba(15,23,42,0.10)]'
                                                    : ''
                                            } ${
                                                c === 'scope' ? 'border-r-0' : 'border-r border-slate-200' // Remove right border for last column
                                            }`}
                                            style={c === 'scope' ? { minWidth: '100px' } : undefined} // Width for roles icon
                                        >
                                            <div className='flex items-center gap-2'>
                                                {iconFor[c] && iconFor[c]}
                                                <span>{labelFor[c] || c}</span>
                                            </div>
                                            {[
                                                'roleName',
                                                'description',
                                                'entity',
                                                'product',
                                                'service',
                                            ].includes(c) && (
                                                <div className={`inline-flex items-center ml-4 ${c === 'scope' ? '' : 'absolute right-8 top-1/2 -translate-y-1/2'}`}>
                                                    <button
                                                        onClick={() => toggleSort(c as any, 'asc')}
                                                        className={`${sortCol === c && sortDir === 'asc' ? 'text-blue-600 font-bold' : 'text-slate-400'} transition-all duration-200 hover:text-slate-600`}
                                                    >
                                                        <ArrowUp
                                                            size={sortCol === c && sortDir === 'asc' ? 20 : 16}
                                                        />
                                                    </button>
                                                    <button
                                                        onClick={() => toggleSort(c as any, 'desc')}
                                                        className={`${sortCol === c && sortDir === 'desc' ? 'text-blue-600 font-bold' : 'text-slate-400'} transition-all duration-200 hover:text-slate-600`}
                                                    >
                                                        <ArrowDown
                                                            size={sortCol === c && sortDir === 'desc' ? 20 : 16}
                                                        />
                                                    </button>
                                                </div>
                                            )}
                                            {/* Show resize handle for resizable columns but not for last column */}
                                            {['roleName', 'description', 'entity', 'product', 'service'].includes(c) && (
                                                <div
                                                    onMouseDown={(e: any) =>
                                                        startResize(c, e)
                                                    }
                                                    className='absolute -right-1 top-0 h-full w-3 cursor-col-resize z-30 flex items-center justify-center group/resize hover:bg-blue-100/50'
                                                    title={`Resize ${labelFor[c] || c} column`}
                                                >
                                                    <div className='h-6 w-0.5 bg-gradient-to-b from-blue-400 to-blue-500 rounded-full opacity-60 group-hover/resize:opacity-100 group-hover/resize:w-1 transition-all duration-150 shadow-sm' />
                                                </div>
                                            )}
                                            {c === 'roleName' && (
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
                        <div className='space-y-1 pt-2'>
                            {displayItems.map((r, idx) => (
                                <div key={r.id}>
                                    <SortableUserRoleRow
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
                                        isExpanded={expandedRows.has(r.id)}
                                        onToggle={toggleRowExpansion}
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
                                        onSelect={(id: string) => setSelectedRowId(id)}
                                        onStartFill={() => {}}
                                        inFillRange={false}
                                        onDeleteClick={handleDeleteClick}
                                        shouldShowHorizontalScroll={shouldShowHorizontalScroll}
                                        onOpenAddressModal={onOpenAddressModal}
                                        onOpenUserGroupModal={onOpenUserGroupModal}
                                        onOpenScopeModal={(row: UserRoleRow) => {
                                            setSelectedRoleForScope(row);
                                            setShowScopeModal(true);
                                        }}
                                        onShowStartDateProtectionModal={onShowStartDateProtectionModal}
                                        onShowGlobalValidationModal={showGlobalValidationModal}
                                        selectedEnterprise={selectedEnterprise}
                                        selectedEnterpriseId={selectedEnterpriseId}
                                        selectedAccountId={selectedAccountId}
                                        selectedAccountName={selectedAccountName}
                                    />
                                </div>
                            ))}
                            
                            {/* Add New Row Button */}
                            {onAddNewRow && (
                                <div 
                                    className="grid w-full gap-0 px-0 py-1 text-sm border-t border-slate-200 h-10 transition-colors duration-150 bg-slate-50/80 hover:bg-blue-50 cursor-pointer group"
                                    style={{
                                        gridTemplateColumns: gridTemplate, 
                                        minWidth: 'max-content',
                                        width: '100%'
                                    }}
                                    onClick={onAddNewRow}
                                    title="Add new account row"
                                >
                                    {/* Empty delete button space */}
                                    <div className='flex items-center justify-center px-2 py-1'>
                                        {/* No delete icon for add row */}
                                    </div>
                                    
                                    {/* Add new row content spanning all columns */}
                                    <div className="flex items-center justify-start gap-2 px-2 py-1 font-medium transition-colors duration-150 text-slate-500 group-hover:text-blue-600" style={{gridColumn: `span ${cols.length}`}}>
                                        <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
                                        </svg>
                                        <span className='italic'>Add New Row</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className='space-y-4 mt-2'>
                            {Object.entries(groupedItems).map(([groupName, groupRows]) => (
                                <div key={groupName} className='border border-slate-200 rounded-lg'>
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
                                    <div className='border-b border-slate-200 overflow-visible'>
                                        {groupRows.map((r, idx) => (
                                            <div key={r.id}>
                                                <SortableUserRoleRow
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
                                                    isExpanded={expandedRows.has(r.id)}
                                                    onToggle={toggleRowExpansion}
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
                                                    onSelect={(id: string) => setSelectedRowId(id)}
                                                    onStartFill={() => {}}
                                                    inFillRange={false}
                                                    onDeleteClick={handleDeleteClick}
                                                    shouldShowHorizontalScroll={shouldShowHorizontalScroll}
                                                    onOpenAddressModal={onOpenAddressModal}
                                                    onOpenUserGroupModal={onOpenUserGroupModal}
                                                    onOpenScopeModal={(row: UserRoleRow) => {
                                                        setSelectedRoleForScope(row);
                                                        setShowScopeModal(true);
                                                    }}
                                                    onShowStartDateProtectionModal={onShowStartDateProtectionModal}
                                                    onShowGlobalValidationModal={showGlobalValidationModal}
                                                    selectedEnterprise={selectedEnterprise}
                                                    selectedEnterpriseId={selectedEnterpriseId}
                                                    selectedAccountId={selectedAccountId}
                                                    selectedAccountName={selectedAccountName}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            
                            {/* Add New Row Button for grouped view */}
                            {onAddNewRow && (
                                <div className='border border-slate-200 rounded-lg overflow-visible mt-4'>
                                    <div 
                                        className="grid w-full gap-0 px-0 py-1 text-sm h-10 transition-colors duration-150 bg-slate-50/80 hover:bg-blue-50 cursor-pointer group"
                                        style={{
                                            gridTemplateColumns: gridTemplate, 
                                            minWidth: 'max-content',
                                            width: '100%'
                                        }}
                                        onClick={onAddNewRow}
                                        title="Add new account row"
                                    >
                                        {/* Empty delete button space */}
                                        <div className='flex items-center justify-center px-2 py-1'>
                                            {/* No delete icon for add row */}
                                        </div>
                                        
                                        {/* Add new row content spanning all columns */}
                                        <div className="flex items-center justify-start gap-2 px-2 py-1 font-medium transition-colors duration-150 text-slate-500 group-hover:text-blue-600" style={{gridColumn: `span ${cols.length}`}}>
                                            <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
                                            </svg>
                                            <span className='italic'>Add New Row</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    </div>
                </div>
            )}

            {/* Global Validation Modal */}
            {globalValidationModal.open && (
                <div className='fixed inset-0 z-50 overflow-y-auto'>
                    <div className='flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0'>
                        <div
                            className='fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity'
                            onClick={hideGlobalValidationModal}
                        ></div>

                        <motion.div
                            className='relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6'
                            initial={{opacity: 0, scale: 0.9}}
                            animate={{opacity: 1, scale: 1}}
                            exit={{opacity: 0, scale: 0.9}}
                            transition={{duration: 0.2}}
                        >
                            <div className='sm:flex sm:items-start'>
                                <div className='mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10'>
                                    <svg
                                        className='h-6 w-6 text-red-500'
                                        fill='currentColor'
                                        viewBox='0 0 24 24'
                                    >
                                        <path fillRule='evenodd' d='M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z' clipRule='evenodd' />
                                    </svg>
                                </div>
                                <div className='mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left'>
                                    <h3 className='text-base font-semibold leading-6 text-gray-900'>
                                        Information
                                    </h3>
                                    <div className='mt-2'>
                                        <p className='text-sm text-gray-900'>
                                            {globalValidationModal.message}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className='mt-5 sm:mt-4 sm:flex sm:flex-row-reverse'>
                                <button
                                    type='button'
                                    className='inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto'
                                    onClick={hideGlobalValidationModal}
                                >
                                    OK
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </div>
            )}

            {/* Scope Config Modal */}
            <ScopeConfigModal
                isOpen={showScopeModal}
                onClose={() => {
                    setShowScopeModal(false);
                    setSelectedRoleForScope(null);
                }}
                roleName={selectedRoleForScope?.roleName || ''}
                roleDescription={selectedRoleForScope?.description || ''}
                currentScope={selectedRoleForScope?.scope}
                onSave={async (scopeConfig: any) => {
                    console.log('💾 Scope config saved:', scopeConfig);
                    if (selectedRoleForScope) {
                        // Update the row with the new scope configuration
                        updateRowField(selectedRoleForScope.id, 'scope', JSON.stringify(scopeConfig));
                    }
                    // Don't close modal here - let the modal's handleSave close it after successful save
                }}
            />
        </div>
    );
});

// Set the display name for debugging
ManageUserRolesTable.displayName = 'ManageUserRolesTable';

export default ManageUserRolesTable;
