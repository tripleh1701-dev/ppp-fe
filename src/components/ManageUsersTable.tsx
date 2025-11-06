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

// Utility function to generate consistent colors for user group data across the application
const getUserGroupColor = (userGroupName: string) => {
    const key = userGroupName.toLowerCase();
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
        hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    }
    
    // Blueish user group color palette - consistent across all components
    const userGroupColors = [
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
    
    return userGroupColors[hash % userGroupColors.length];
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
    }, [isOpen, calculatePosition]);

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
                    console.log('🔽 SimpleDropdown clicked, opening dropdown, current value:', value);
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
                                console.log('🚀 MOUSE DOWN on option:', option.value);
                            }}
                            onMouseEnter={() => setHighlightedIndex(index)}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('✅ Option selected:', option.value, 'calling onChange');
                                console.log('🎯 About to call onChange with:', option.value);
                                onChange(option.value);
                                console.log('🎯 onChange called, closing dropdown');
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

export interface UserGroup {
    id: string;
    groupName: string;
    description: string;
    entity: string;
    product: string;
    service: string;
    roles: string;
    isFromDatabase?: boolean; // Flag to indicate if this is an existing group from database (fields should be read-only)
}

export interface AccountRow {
    id: string;
    // User management fields
    firstName: string;
    middleName?: string;
    lastName: string;
    emailAddress: string;
    status: 'ACTIVE' | 'INACTIVE';
    startDate: string;
    endDate?: string;
    password?: string;
    technicalUser?: boolean;
    assignedUserGroups?: UserGroup[];
}

// Validation functions for user management fields
const validateFirstName = (_value: string): string | null => {
    // Only required check handled during save flow; no inline validation
    return null;
};

// Real-time validation function to filter characters as user types
const filterFirstNameInput = (value: string): string => value; // No inline filtering

const validateMiddleName = (_value: string): string | null => {
    // No validation; field is optional
    return null;
};

// Real-time validation function to filter characters for middle name
const filterMiddleNameInput = (value: string): string => value; // No inline filtering

const validateLastName = (_value: string): string | null => {
    // Only required check handled during save flow; no inline validation
    return null;
};

// Real-time validation function to filter characters for last name
const filterLastNameInput = (value: string): string => value; // No inline filtering

const validateEmail = (value: string): string | null => {
    if (!value || value.trim().length === 0) {
        return 'Email address is required';
    }
    
    const trimmedValue = value.trim();
    
    if (trimmedValue.length < 5) {
        return 'Email address must be at least 5 characters long';
    }
    
    if (trimmedValue.length > 254) {
        return 'Email address must not exceed 254 characters';
    }
    
    // RFC 5322 compliant email regex (simplified but comprehensive)
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (!emailRegex.test(trimmedValue)) {
        return 'Please enter a valid email address';
    }
    
    return null;
};

const validatePassword = (value: string): string | null => {
    // Only required check handled during save flow; no inline validation
    if (!value || value.trim().length === 0) {
        return 'Password is required';
    }
    return null;
};

// Helper function to get password requirements (same as TechnicalUserModal)
const getPasswordRequirements = (password: string) => {
    return [
        {
            text: "At least 8 characters long",
            met: password.length >= 8
        },
        {
            text: "Contains uppercase letter (A-Z)",
            met: /[A-Z]/.test(password)
        },
        {
            text: "Contains lowercase letter (a-z)",
            met: /[a-z]/.test(password)
        },
        {
            text: "Contains number (0-9)",
            met: /\d/.test(password)
        },
        {
            text: "Contains special character (!@#$%^&*...)",
            met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
        },
        {
            text: "No common patterns (123, abc, aaa)",
            met: !/(.)\1{2,}|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i.test(password)
        }
    ];
};

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
    console.log('🎯 InlineEditableText RENDERED with:', { value, placeholder, dataAttr, hasFilterFn: !!filterFn, hasValidateFn: !!validateFn });
    console.log('🎯 FILTER FUNCTION IS:', filterFn ? filterFn.toString().substring(0, 100) : 'NOT PROVIDED');
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
    }, [value, editing, filterFn]);
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
            console.log('Filtered value in commit:', next);
        }
        
        // Validate if validation function is provided
        if (validateFn) {
            const error = validateFn(next);
            if (error) {
                setValidationError(error);
                return; // Don't commit if validation fails
            }
        }
        
        console.log('Committing filtered value:', next);
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
                        console.log('🔥 ON INPUT TRIGGERED (first input) with value:', target.value);
                        const newValue = filterFn ? filterFn(target.value) : target.value;
                        console.log('🔥 ON INPUT Setting draft to (first input):', newValue);
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
                        console.log('onChange also triggered');
                    }}
                    onBlur={() => {
                        let next = (draft || '').trim();
                        console.log('onBlur (first input) triggered with draft:', draft);
                        
                        // Apply filter before validation
                        if (filterFn) {
                            next = filterFn(next);
                            console.log('Filtered value on blur (first input):', next);
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
                        console.log('🔥 ON INPUT TRIGGERED (second input) with value:', target.value);
                        const newValue = filterFn ? filterFn(target.value) : target.value;
                        console.log('🔥 ON INPUT Setting draft to (second input):', newValue);
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
                        console.log('onChange also triggered (second input)');
                    }}
                    onBlur={() => {
                        let next = (draft || '').trim();
                        console.log('onBlur (second input) triggered with draft:', draft, 'trimmed:', next);
                        
                        // Apply filter before validation
                        if (filterFn) {
                            next = filterFn(next);
                            console.log('Filtered value on blur (second input):', next);
                            setDraft(next); // Update draft with filtered value
                        }
                        
                        // Validate on blur if validation function is provided
                        if (validateFn) {
                            console.log('Running validation on (second input):', next);
                            const error = validateFn(next);
                            console.log('Validation result (second input):', error);
                            if (error) {
                                setValidationError(error);
                                console.log('Validation failed, staying in edit mode (second input)');
                                return; // Keep editing mode if validation fails
                            }
                        }
                        
                        console.log('Committing value (second input)');
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

type CatalogType = 'firstName' | 'middleName' | 'lastName' | 'emailAddress' | 'status' | 'startDate' | 'endDate' | 'password' | 'technicalUser' | 'assignedUserGroups';

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
        type: 'firstNames' | 'middleNames' | 'lastNames' | 'emails' | 'statusTypes' | 'passwords' | 'technicalUserTypes' | 'userGroups',
        action: 'update' | 'delete',
        oldName: string,
        newName?: string,
    ) => Promise<void>;
    onNewItemCreated?: (
        type: 'firstNames' | 'middleNames' | 'lastNames' | 'emails' | 'statusTypes' | 'passwords' | 'technicalUserTypes' | 'userGroups',
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
                    onNewItemCreated('userGroups', created);
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
                        const colorTheme = getUserGroupColor(service);
                        
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
                                                const colorTheme = getUserGroupColor(userGroup);
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
                                                onNewItemCreated('userGroups', created);
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
                                        } else {
                                            console.error('Failed to create service:', error);
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
                                    console.log('Tab blocked: Please press Enter or click Add button to create new service, or change the value');
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
                                                type='assignedUserGroups'
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
                                                                'userGroups',
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
                                                                'userGroups',
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
        type: 'firstNames' | 'middleNames' | 'lastNames' | 'statusTypes' | 'emails' | 'passwords' | 'technicalUserTypes' | 'userGroups',
        action: 'update' | 'delete',
        oldName: string,
        newName?: string,
    ) => Promise<void>;
    onNewItemCreated?: (
        type: 'firstNames' | 'middleNames' | 'lastNames' | 'statusTypes' | 'emails' | 'passwords' | 'technicalUserTypes' | 'userGroups',
        item: {id: string; name: string},
    ) => void;
    accounts?: AccountRow[];
    currentRowId?: string;
    currentRowEnterprise?: string;
    currentRowProduct?: string;
    dropdownOptions?: {
        firstNames: Array<{id: string; name: string}>;
        middleNames: Array<{id: string; name: string}>;
        lastNames: Array<{id: string; name: string}>;
        statusTypes: Array<{id: string; name: string}>;
        emails: Array<{id: string; name: string}>;
        passwords: Array<{id: string; name: string}>;
        technicalUserTypes: Array<{id: string; name: string}>;
        userGroups: Array<{id: string; name: string}>;
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

                if (type === 'firstName') {
                    // Never filter first names - show all options
                    return false;
                } else if (type === 'lastName') {
                    // Never filter last names - show all options
                    return false;
                } else if (type === 'emailAddress') {
                    // Never filter email addresses - show all options
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
        
        // Prefer below if there's enough space, otherwise use above if there's more space above
        // For user fields, always prefer below unless there's really no space
        let top;
        const forceBelow = type === 'status';
        
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
        console.log('📍 Dropdown position calculated:', { top, left, width, position: spaceBelow >= dropdownHeight ? 'below' : 'above', tableRect });
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
            
            console.log(`Loading options for type: ${type}`);
            
            // Use dropdownOptions if available for firstName
            if (type === 'firstName' && dropdownOptions?.firstNames) {
                allData = dropdownOptions.firstNames;
                console.log(`Using dropdownOptions for ${type}, got ${allData.length} items:`, allData);
            } else if (type === 'middleName' && dropdownOptions?.middleNames) {
                allData = dropdownOptions.middleNames;
                console.log(`Using dropdownOptions for ${type}, got ${allData.length} items:`, allData);
            } else if (type === 'lastName' && dropdownOptions?.lastNames) {
                allData = dropdownOptions.lastNames;
                console.log(`Using dropdownOptions for ${type}, got ${allData.length} items:`, allData);
            } else if (type === 'status') {
                // Always use predefined status options (prioritize dropdownOptions)
                if (dropdownOptions?.statusTypes && dropdownOptions.statusTypes.length > 0) {
                    allData = dropdownOptions.statusTypes;
                    console.log(`Using dropdownOptions for ${type}, got ${allData.length} items:`, allData);
                } else {
                    console.log('Using fallback predefined status options');
                    allData = [
                        { id: 'ACTIVE', name: 'Active' },
                        { id: 'INACTIVE', name: 'Inactive' }
                    ];
                }
            } else if (type === 'emailAddress') {
                console.log('Calling API: /api/emails');
                allData = await api.get<Array<{id: string; name: string}>>(
                    '/api/emails',
                ) || [];
            } else if (type === 'password' && dropdownOptions?.passwords) {
                allData = dropdownOptions.passwords;
                console.log(`Using dropdownOptions for ${type}, got ${allData.length} items:`, allData);
            } else if (type === 'technicalUser') {
                // Boolean field, no dropdown options needed
                allData = [];
            } else if (type === 'assignedUserGroups' && dropdownOptions?.userGroups) {
                allData = dropdownOptions.userGroups;
                console.log(`Using dropdownOptions for ${type}, got ${allData.length} items:`, allData);
            } else if (type === 'startDate' || type === 'endDate') {
                console.log('Date fields do not need dropdown options');
                allData = [];
            } else if (type === 'assignedUserGroups') {
                console.log('Calling API: /api/userGroups');
                allData = await api.get<Array<{id: string; name: string}>>(
                    '/api/userGroups',
                ) || [];
            } else {
                console.log('Calling API: /api/accountNames');
                allData = await api.get<Array<{id: string; name: string}>>(
                    '/api/accountNames',
                ) || [];
            }
            
            console.log(`API call successful for ${type}, got ${allData.length} items:`, allData);
            setAllOptions(allData);
        } catch (error) {
            console.error(`API call failed for ${type}:`, error);
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
    }, [filterOptions]);

    // Load options when dropdown opens
    React.useEffect(() => {
        if (open && allOptions.length === 0) {
            loadAllOptions();
        }
    }, [open, allOptions.length, loadAllOptions]);

    // Load status options immediately on mount since they're predefined
    React.useEffect(() => {
        if (type === 'status' && allOptions.length === 0) {
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
            if (type === 'firstName') {
                created = await api.post<{id: string; name: string}>(
                    '/api/firstNames',
                    {name},
                );
            } else if (type === 'middleName') {
                created = await api.post<{id: string; name: string}>(
                    '/api/middleNames',
                    {name},
                );
            } else if (type === 'lastName') {
                created = await api.post<{id: string; name: string}>(
                    '/api/lastNames',
                    {name},
                );
            } else if (type === 'status') {
                // Status has predefined options, don't create new ones
                console.log('Cannot create new status options - using predefined values only');
                return;
            } else if (type === 'emailAddress') {
                created = await api.post<{id: string; name: string}>(
                    '/api/emails',
                    {name},
                );
            } else if (type === 'password') {
                // Passwords are typically not saved as dropdown options for security
                console.log('Cannot create password options for security reasons');
                return;
            } else if (type === 'technicalUser') {
                // Boolean field, no creation needed
                console.log('Technical user is a boolean field');
                return;
            } else if (type === 'assignedUserGroups') {
                created = await api.post<{id: string; name: string}>(
                    '/api/userGroups',
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
                        case 'firstName':
                            dropdownType = 'firstNames';
                            break;
                        case 'middleName':
                            dropdownType = 'middleNames';
                            break;
                        case 'lastName':
                            dropdownType = 'lastNames';
                            break;
                        case 'emailAddress':
                            dropdownType = 'emails';
                            break;
                        case 'assignedUserGroups':
                            dropdownType = 'userGroups';
                            break;
                        default:
                            dropdownType = 'emails'; // fallback
                            break;
                    }
                    
                    // Only call if this is a supported type for the callback
                    if (type === 'firstName' || type === 'middleName' || type === 'lastName' || type === 'emailAddress' || type === 'assignedUserGroups') {
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
    }, [value]);

    // Debug logging for status
    React.useEffect(() => {
        if (type === 'status') {
            console.log(`Status AsyncChipSelect render - allOptions.length: ${allOptions.length}`, allOptions);
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
                        className={`w-full flex items-center gap-1 px-2 py-1 text-[11px] leading-[14px] rounded-sm relative ${isError ? 'border border-red-500 bg-red-50 ring-2 ring-red-200 text-red-900' : 'bg-white text-black'} ${type === 'password' ? 'pr-8' : ''}`}
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
                        onClick={(e: any) => {
                            // For status, also allow single click to open dropdown
                            if (type === 'status' && allOptions.length > 0) {
                                const target = e.target as HTMLElement;
                                if (!target.closest('button')) {
                                    setQuery('');
                                    setOpen(true);
                                    setTimeout(() => {
                                        if (inputRef.current) {
                                            inputRef.current.focus();
                                        }
                                    }, 10);
                                }
                            }
                        }}
                    >
                        <span className='flex-1 truncate pointer-events-none'>
                            {inputType === 'password' && (current || value)
                                ? '•'.repeat(Math.min((current || value || '').length, 20))
                                : (current || value)
                            }
                        </span>
                        {/* Dropdown arrow for status */}
                        {type === 'status' && (
                            <ChevronDown 
                                size={12} 
                                className="text-slate-400 flex-shrink-0 ml-1" 
                            />
                        )}
                        {/* Hide X button for password fields to avoid overlap with eye icon */}
                        {type !== 'password' && (
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
                        )}
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
                            className={`w-full text-left px-2 pr-8 ${sizeClass} rounded border ${isError ? 'border-red-500 bg-red-50 ring-2 ring-red-200' : 'border-blue-300 bg-white hover:bg-slate-50'} text-slate-700 placeholder:text-slate-300 placeholder:font-normal focus:outline-none focus:ring-2 ${isError ? 'focus:ring-red-200 focus:border-red-500' : 'focus:ring-blue-200 focus:border-blue-500'} font-normal`}
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
                    className='bg-white border border-gray-200 rounded-md shadow-md'
                    onMouseDown={(e: any) => e.stopPropagation()}
                    onClick={(e: any) => e.stopPropagation()}
                    style={{
                        position: 'fixed',
                        top: `${dropdownPortalPos.top}px`,
                        left: `${dropdownPortalPos.left}px`,
                        width: `${Math.min(dropdownPortalPos.width, 180)}px`,
                        maxWidth: '180px',
                        minWidth: '140px'
                    }}
                >
                        <div className='py-1'>
                            <div className='max-h-48 overflow-y-auto overflow-x-hidden'>
                            {loading ? (
                                <div className='px-3 py-2 text-slate-500'>
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
                                    
                                    console.log(`Dropdown for ${type}: filteredOptions.length=${filteredOptions.length}`, filteredOptions);

                                    return (
                                        <div>
                                            {/* Show existing matching options */}
                                            {filteredOptions.length > 0 && (
                                                <div>
                                                    {filteredOptions.map((opt, idx) => (
                                                        <div
                                                            key={opt.id}
                                                            onClick={() => {
                                                                onChange(opt.name);
                                                                setCurrent(opt.name);
                                                                setQuery('');
                                                                setOpen(false);
                                                            }}
                                                            className='w-full px-3 py-2.5 text-left text-sm cursor-pointer bg-blue-50 text-blue-800 hover:bg-blue-100 border-b border-blue-100 last:border-b-0 transition-colors duration-200 font-medium'
                                                        >
                                                            {opt.name}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            
                                            {/* Show "No results" message */}
                                            {filteredOptions.length === 0 && (
                                                <div className='px-3 py-2 text-center text-sm text-slate-500'>
                                                    {query.trim() ? (
                                                        <div>No {type}s found matching &quot;{query}&quot;</div>
                                                    ) : (
                                                        <div>No {type}s available</div>
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
                document.body
            )
        }
        </div>
    );
}

interface AccountsTableProps {
    rows: AccountRow[];
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    title?: string;
    groupByExternal?: 'none' | 'firstName' | 'lastName' | 'emailAddress' | 'status';
    onGroupByChange?: (
        g: 'none' | 'accountName' | 'email' | 'userGroup',
    ) => void;
    hideControls?: boolean;
    visibleColumns?: Array<
        | 'firstName'
        | 'middleName'
        | 'lastName'
        | 'emailAddress'
        | 'status'
        | 'startDate'
        | 'endDate'
        | 'password'
        | 'technicalUser'
        | 'assignedUserGroups'
        | 'actions'
    >;
    highlightQuery?: string;
    customColumnLabels?: Record<string, string>;
    enableDropdownChips?: boolean;
    dropdownOptions?: {
        accountNames?: Array<{id: string; name: string}>;
        cloudTypes?: Array<{id: string; name: string}>;
        emails?: Array<{id: string; name: string}>;
        userGroups?: Array<{id: string; name: string}>;
    };
    onUpdateField?: (rowId: string, field: string, value: any) => void;
    hideRowExpansion?: boolean;
    enableInlineEditing?: boolean;
    incompleteRowIds?: string[];
    showValidationErrors?: boolean;
    hasBlankRow?: boolean;
    externalFieldErrors?: {[key: string]: Record<string, string>}; // Per-row field errors from parent
    onDropdownOptionUpdate?: (
        type: 'emails' | 'userGroups',
        action: 'update' | 'delete',
        oldName: string,
        newName?: string,
    ) => Promise<void>;
    onNewItemCreated?: (
        type: 'emails' | 'userGroups',
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
    onLicenseValidationChange?: (hasIncompleteLicenses: boolean, incompleteLicenseRows: string[]) => void; // Callback for license validation state
    onLicenseDelete?: (licenseId: string) => Promise<void>; // Callback for license deletion with animation
    onCompleteLicenseDeletion?: () => void; // Callback to complete license deletion after confirmation
    onOpenAddressModal?: (row: AccountRow) => void; // Callback to open address modal
    onOpenUserGroupModal?: (row: AccountRow) => void; // Callback to open user group modal
    onShowStartDateProtectionModal?: (message: string) => void; // Callback to show start date protection modal
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
    onOpenUserGroupModal,
    onShowStartDateProtectionModal,
    onShowGlobalValidationModal,
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
        type: 'emails' | 'userGroups',
        action: 'update' | 'delete',
        oldName: string,
        newName?: string,
    ) => Promise<void>;
    onNewItemCreated?: (
        type: 'emails' | 'userGroups',
        item: {id: string; name: string},
    ) => void;
    isCellMissing?: (rowId: string, field: string) => boolean;
    compressingRowId?: string | null;
    foldingRowId?: string | null;
    allRows?: AccountRow[];
    onDeleteClick?: (rowId: string) => void;
    onOpenAddressModal?: (row: AccountRow) => void;
    onOpenUserGroupModal?: (row: AccountRow) => void;
    onShowStartDateProtectionModal?: (message: string) => void;
    onShowGlobalValidationModal?: (rowId: string, field: string, message: string) => void;
}) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [menuUp, setMenuUp] = useState(false);
    const actionsRef = useRef<HTMLDivElement>(null);
    const [menuPos, setMenuPos] = useState<{top: number; left: number} | null>(
        null,
    );
    const [isRowHovered, setIsRowHovered] = useState(false);
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const passwordFieldRef = useRef<HTMLDivElement>(null);
    const [passwordRequirementsPos, setPasswordRequirementsPos] = useState<{
        top: number;
        left: number;
        width: number;
    } | null>(null);
    const [currentPasswordValue, setCurrentPasswordValue] = useState<string>(row.password || '');
    
    // Update local password value when row password changes
    useEffect(() => {
        setCurrentPasswordValue(row.password || '');
    }, [row.password]);
    
    // Track password field focus state and calculate position
    useEffect(() => {
        const checkFocus = () => {
            const activeElement = document.activeElement;
            if (!activeElement) {
                setIsPasswordFocused(false);
                setPasswordRequirementsPos(null);
                return;
            }
            if (passwordFieldRef.current?.contains(activeElement)) {
                // Check if it's actually an input field (not a button or other element)
                if (activeElement instanceof HTMLInputElement || 
                    activeElement.tagName === 'INPUT' ||
                    activeElement.closest('[data-col="password"] input') === activeElement) {
                    setIsPasswordFocused(true);
                    // Calculate position for requirements box
                    if (passwordFieldRef.current) {
                        const rect = passwordFieldRef.current.getBoundingClientRect();
                        setPasswordRequirementsPos({
                            top: rect.bottom + 4,
                            left: rect.left,
                            width: Math.max(280, rect.width)
                        });
                    }
                }
            } else {
                setIsPasswordFocused(false);
                setPasswordRequirementsPos(null);
            }
        };
        
        const handleFocusIn = () => {
            setTimeout(checkFocus, 10);
        };
        
        const handleFocusOut = () => {
            setTimeout(() => {
                checkFocus();
                // Sync currentPasswordValue with row.password when field loses focus
                // in case the value wasn't committed (e.g., user pressed Escape)
                const activeElement = document.activeElement;
                if (!passwordFieldRef.current?.contains(activeElement)) {
                    setCurrentPasswordValue(row.password || '');
                    // Reset password visibility for security when field loses focus
                    setPasswordVisible(false);
                }
            }, 10);
        };
        
        // Update position on scroll/resize when password is focused
        const updatePosition = () => {
            if (isPasswordFocused && passwordFieldRef.current) {
                const rect = passwordFieldRef.current.getBoundingClientRect();
                setPasswordRequirementsPos({
                    top: rect.bottom + 4,
                    left: rect.left,
                    width: Math.max(280, rect.width)
                });
            }
        };
        
        // Track password input value in real-time for immediate requirement updates
        const handlePasswordInput = (e: Event) => {
            const target = e.target as HTMLInputElement;
            if (target && 
                passwordFieldRef.current?.contains(target) && 
                (target.type === 'password' || target.closest('[data-col="password"]'))) {
                setCurrentPasswordValue(target.value || '');
            }
        };
        
        document.addEventListener('focusin', handleFocusIn);
        document.addEventListener('focusout', handleFocusOut);
        document.addEventListener('input', handlePasswordInput);
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);
        
        // Initial check
        checkFocus();
        
        return () => {
            document.removeEventListener('focusin', handleFocusIn);
            document.removeEventListener('focusout', handleFocusOut);
            document.removeEventListener('input', handlePasswordInput);
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isPasswordFocused]);
    
    // Validation state management for each field
    const [fieldValidationErrors, setFieldValidationErrors] = useState<{
        firstName?: string;
        middleName?: string;
        lastName?: string;
        emailAddress?: string;
        password?: string;
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
            'firstName',
            'middleName',
            'lastName',
            'emailAddress',
            'password',
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
            {cols.includes('firstName') && (
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
                        data-col='firstName'
                        style={{width: '100%'}}
                    >
                        {enableDropdownChips ? (
                            <AsyncChipSelect
                                type='firstName'
                                value={row.firstName || ''}
                                onChange={(v) => {
                                    onUpdateField(row.id, 'firstName' as any, v || '');
                                }}
                                onFocus={() => handleFieldFocus('firstName')}
                                placeholder='Enter first name'
                                isError={isCellMissing(row.id, 'firstName') || !!((fieldValidationErrors as any)[row.id] && (fieldValidationErrors as any)[row.id].firstName)}
                                onDropdownOptionUpdate={onDropdownOptionUpdate as any}
                                onNewItemCreated={onNewItemCreated as any}
                                accounts={allRows}
                                currentRowId={row.id}
                                currentRowEnterprise={
                                    row.firstName || ''
                                }
                                currentRowProduct={
                                    row.firstName || ''
                                }
                                {...createTabNavigation('firstName')}
                            />
                        ) : (
                            <InlineEditableText
                                value={row.firstName || ''}
                                onCommit={(v) =>
                                    onUpdateField(row.id, 'firstName' as any, v)
                                }
                                className='text-[12px]'
                                dataAttr={`firstName-${row.id}`}
                                isError={isCellMissing(row.id, 'firstName')}
                                placeholder='Enter first name'
                                {...createTabNavigation('firstName')}
                            />
                        )}
                    </div>
                </div>
            )}

            {/* Middle Name Column */}
            {cols.includes('middleName') && (
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
                        data-col='middleName'
                        style={{width: '100%'}}
                    >
                        {enableDropdownChips ? (
                            <AsyncChipSelect
                                type='middleName'
                                value={row.middleName || ''}
                                onChange={(v) => {
                                    onUpdateField(row.id, 'middleName' as any, v || '');
                                }}
                                onFocus={() => handleFieldFocus('middleName')}
                                placeholder='Enter middle name'
                                isError={isCellMissing(row.id, 'middleName') || !!((fieldValidationErrors as any)[row.id] && (fieldValidationErrors as any)[row.id].middleName)}
                                onDropdownOptionUpdate={onDropdownOptionUpdate as any}
                                onNewItemCreated={onNewItemCreated as any}
                                accounts={allRows}
                                currentRowId={row.id}
                                currentRowEnterprise={
                                    row.middleName || ''
                                }
                                currentRowProduct={
                                    row.middleName || ''
                                }
                                {...createTabNavigation('middleName')}
                            />
                        ) : (
                            <InlineEditableText
                                value={row.middleName || ''}
                                onCommit={(v) =>
                                    onUpdateField(row.id, 'middleName' as any, v)
                                }
                                className='text-[12px]'
                                dataAttr={`middleName-${row.id}`}
                                isError={isCellMissing(row.id, 'middleName')}
                                placeholder='Enter middle name'
                                {...createTabNavigation('middleName')}
                            />
                        )}
                    </div>
                </div>
            )}

            {/* Last Name Column */}
            {cols.includes('lastName') && (
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
                        data-col='lastName'
                        style={{width: '100%'}}
                    >
                        {enableDropdownChips ? (
                            <AsyncChipSelect
                                type='lastName'
                                value={row.lastName || ''}
                                onChange={(v) => {
                                    onUpdateField(row.id, 'lastName' as any, v || '');
                                }}
                                onFocus={() => handleFieldFocus('lastName')}
                                placeholder='Enter last name'
                                isError={isCellMissing(row.id, 'lastName') || !!((fieldValidationErrors as any)[row.id] && (fieldValidationErrors as any)[row.id].lastName)}
                                onDropdownOptionUpdate={onDropdownOptionUpdate as any}
                                onNewItemCreated={onNewItemCreated as any}
                                accounts={allRows}
                                currentRowId={row.id}
                                currentRowEnterprise={
                                    row.lastName || ''
                                }
                                currentRowProduct={
                                    row.lastName || ''
                                }
                                {...createTabNavigation('lastName')}
                            />
                        ) : (
                            <InlineEditableText
                                value={row.lastName || ''}
                                onCommit={(v) =>
                                    onUpdateField(row.id, 'lastName' as any, v)
                                }
                                className='text-[12px]'
                                dataAttr={`lastName-${row.id}`}
                                isError={isCellMissing(row.id, 'lastName')}
                                placeholder='Enter last name'
                                {...createTabNavigation('lastName')}
                            />
                        )}
                    </div>
                </div>
            )}

            {/* Email Address Column */}
            {cols.includes('emailAddress') && (
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
                        data-col='emailAddress'
                        style={{width: '100%'}}
                    >
                        {enableDropdownChips ? (
                            <AsyncChipSelect
                                type='emailAddress'
                                value={row.emailAddress || ''}
                                onChange={(v) => {
                                    onUpdateField(row.id, 'emailAddress' as any, v || '');
                                }}
                                onFocus={() => handleFieldFocus('emailAddress')}
                                placeholder='Enter email address'
                                isError={isCellMissing(row.id, 'emailAddress') || !!((fieldValidationErrors as any)[row.id] && (fieldValidationErrors as any)[row.id].emailAddress)}
                                onDropdownOptionUpdate={onDropdownOptionUpdate as any}
                                onNewItemCreated={onNewItemCreated as any}
                                accounts={allRows}
                                currentRowId={row.id}
                                currentRowEnterprise={
                                    row.emailAddress || ''
                                }
                                currentRowProduct={
                                    row.emailAddress || ''
                                }
                                {...createTabNavigation('emailAddress')}
                            />
                        ) : (
                            <InlineEditableText
                                value={row.emailAddress || ''}
                                onCommit={(v) =>
                                    onUpdateField(row.id, 'emailAddress' as any, v)
                                }
                                className='text-[12px]'
                                dataAttr={`emailAddress-${row.id}`}
                                isError={isCellMissing(row.id, 'emailAddress') || !!((fieldValidationErrors as any)[row.id] && (fieldValidationErrors as any)[row.id].emailAddress)}
                                placeholder='Enter email address'
                                {...createTabNavigation('emailAddress')}
                            />
                        )}
                    </div>
                </div>
            )}

            {/* Status Column */}
            {cols.includes('status') && (
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
                        data-col='status'
                        style={{width: '100%'}}
                    >
                        <button
                            className={`status-cell-button ${
                                row.status === 'ACTIVE'
                                    ? 'status-cell-active'
                                    : row.status === 'INACTIVE'
                                    ? 'status-cell-inactive'
                                    : 'status-cell-active' // Default to Active for new records
                            }`}
                            onClick={(e) => {
                                e.stopPropagation();
                                // Toggle between Active and Inactive
                                const currentStatus = row.status || 'ACTIVE'; // Default to Active
                                const isCurrentlyActive = currentStatus === 'ACTIVE';
                                const newStatus = isCurrentlyActive ? 'INACTIVE' : 'ACTIVE';
                                
                                // Update status field
                                onUpdateField(row.id, 'status' as any, newStatus);
                                
                                // Auto-populate dates based on status change
                                if (newStatus === 'ACTIVE') {
                                    // Activating user - clear end date and set start date to today
                                    onUpdateField(row.id, 'endDate' as any, '');
                                    const today = new Date();
                                    const localToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                                    onUpdateField(row.id, 'startDate' as any, localToday);
                                } else if (newStatus === 'INACTIVE') {
                                    // User becoming inactive - set end date to today
                                    const today = new Date();
                                    const localToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                                    onUpdateField(row.id, 'endDate' as any, localToday);
                                }
                            }}
                            title={`Click to ${
                                row.status === 'ACTIVE' ? 'deactivate' : 'activate'
                            }`}
                        >
                            {row.status || 'ACTIVE'}
                        </button>
                    </div>
                </div>
            )}

            {/* Start Date Column */}
            {cols.includes('startDate') && (
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
                        data-col='startDate'
                        style={{width: '100%'}}
                    >
                        <DateChipSelect
                            value={row.startDate || ''}
                            onChange={(v) => {
                                // Check if trying to clear the start date
                                if (!v || v.trim() === '') {
                                    // If start date already exists, prevent clearing it
                                    if (row.startDate && row.startDate.trim() !== '') {
                                        // Show modal and revert to the existing start date
                                        if (onShowStartDateProtectionModal) {
                                            onShowStartDateProtectionModal('Start date cannot be removed once set. You can change it to a different date, but not clear it completely.');
                                        }
                                        return; // Don't update the field
                                    }
                                }
                                
                                // Check if the selected date is in the past
                                if (v && v.trim() !== '') {
                                    const selectedDate = new Date(v);
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0); // Set to start of day for comparison
                                    
                                    if (selectedDate < today) {
                                        // Show modal for past date selection
                                        if (onShowStartDateProtectionModal) {
                                            onShowStartDateProtectionModal('Start date cannot be set to a past date. Please select today or a future date.');
                                        }
                                        return; // Don't update the field
                                    }
                                }
                                
                                // Allow the change if it passes all validations
                                onUpdateField(row.id, 'startDate' as any, v);
                            }}
                            placeholder=''
                            isError={isCellMissing(row.id, 'startDate')}
                            minDate={(() => {
                                const today = new Date();
                                return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                            })()} // Today's date as minimum (local timezone)
                            {...createTabNavigation('startDate')}
                        />
                    </div>
                </div>
            )}

            {/* End Date Column */}
            {cols.includes('endDate') && (
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
                        data-col='endDate'
                        style={{width: '100%'}}
                    >
                        <DateChipSelect
                            value={row.endDate || ''}
                            onChange={(v) => {
                                // Check if the selected end date is in the past
                                if (v && v.trim() !== '') {
                                    const selectedDate = new Date(v);
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0); // Set to start of day for comparison
                                    
                                    if (selectedDate < today) {
                                        // Show modal for past date selection
                                        if (onShowStartDateProtectionModal) {
                                            onShowStartDateProtectionModal('End date cannot be set to a past date. Please select today or a future date.');
                                        }
                                        return; // Don't update the field
                                    }
                                }
                                
                                // Check if end date is before start date
                                if (v && v.trim() !== '' && row.startDate && row.startDate.trim() !== '') {
                                    const endDate = new Date(v);
                                    const startDate = new Date(row.startDate);
                                    
                                    if (endDate < startDate) {
                                        // Show modal for invalid end date selection
                                        if (onShowStartDateProtectionModal) {
                                            onShowStartDateProtectionModal('End date cannot be earlier than the start date. Please select a date equal to or after the start date.');
                                        }
                                        return; // Don't update the field
                                    }
                                }
                                
                                // Update the end date
                                onUpdateField(row.id, 'endDate' as any, v);
                                
                                // If end date is cleared (empty), automatically set status to Active
                                if (!v || v.trim() === '') {
                                    onUpdateField(row.id, 'status' as any, 'Active');
                                }
                            }}
                            placeholder=''
                            isError={isCellMissing(row.id, 'endDate')}
                            minDate={row.startDate || (() => {
                                const today = new Date();
                                return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                            })()} // Start date or today as minimum (local timezone)
                            {...createTabNavigation('endDate')}
                        />
                    </div>
                </div>
            )}

            {/* Password Column */}
            {cols.includes('password') && (
                <div
                    className={`group flex items-center gap-1.5 border-r border-slate-200 px-2 py-1 w-full overflow-visible`}
                    style={{
                        backgroundColor: isSelected 
                            ? 'rgb(239 246 255)' // bg-blue-50
                            : (index % 2 === 0 ? 'white' : 'rgb(248 250 252 / 0.7)') // bg-white or bg-slate-50/70
                    }}
                >
                    <div
                        ref={passwordFieldRef}
                        className='flex items-center text-slate-700 font-normal text-[12px] w-full flex-1 relative'
                        data-row-id={row.id}
                        data-col='password'
                        style={{width: '100%'}}
                    >
                        <div className='relative w-full'>
                            {enableDropdownChips ? (
                                <div className='relative'>
                                    <AsyncChipSelect
                                        type='password'
                                        inputType={passwordVisible ? 'text' : 'password'}
                                        value={row.password || ''}
                                        onChange={(v) => {
                                            const newValue = v || '';
                                            setCurrentPasswordValue(newValue); // Update local state immediately for real-time requirements
                                            onUpdateField(row.id, 'password' as any, newValue);
                                        }}
                                        onFocus={() => {
                                            handleFieldFocus('password');
                                            setIsPasswordFocused(true);
                                        }}
                                        placeholder='Enter password'
                                        isError={isCellMissing(row.id, 'password') || !!((fieldValidationErrors as any)[row.id] && (fieldValidationErrors as any)[row.id].password)}
                                        onDropdownOptionUpdate={onDropdownOptionUpdate as any}
                                        onNewItemCreated={onNewItemCreated as any}
                                        accounts={allRows}
                                        currentRowId={row.id}
                                        currentRowEnterprise={
                                            row.password || ''
                                        }
                                        currentRowProduct={
                                            row.password || ''
                                        }
                                        {...createTabNavigation('password')}
                                    />
                                    {/* Eye icon button for password visibility toggle - positioned outside AsyncChipSelect to avoid overlap */}
                                    {(isPasswordFocused || row.password || currentPasswordValue) && (
                                        <button
                                            type='button'
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                setPasswordVisible(!passwordVisible);
                                            }}
                                            className='absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none z-20 pointer-events-auto'
                                            tabIndex={-1}
                                            title={passwordVisible ? 'Hide password' : 'Show password'}
                                        >
                                            {passwordVisible ? (
                                                <EyeOff size={14} />
                                            ) : (
                                                <Eye size={14} />
                                            )}
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className='relative'>
                                    <InlineEditableText
                                        value={row.password || ''}
                                        onCommit={(v) =>
                                            onUpdateField(row.id, 'password' as any, v)
                                        }
                                        className='text-[12px] pr-6'
                                        dataAttr={`password-${row.id}`}
                                        isError={isCellMissing(row.id, 'password')}
                                        placeholder='Enter password'
                                        type={passwordVisible ? 'text' : 'password'}
                                        {...createTabNavigation('password')}
                                    />
                                    {/* Eye icon button for password visibility toggle */}
                                    {(isPasswordFocused || row.password || currentPasswordValue) && (
                                        <button
                                            type='button'
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setPasswordVisible(!passwordVisible);
                                            }}
                                            className='absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none z-10'
                                            tabIndex={-1}
                                            title={passwordVisible ? 'Hide password' : 'Show password'}
                                        >
                                            {passwordVisible ? (
                                                <EyeOff size={14} />
                                            ) : (
                                                <Eye size={14} />
                                            )}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                        {/* Password Requirements - shown when field is focused, positioned absolutely */}
                        {isPasswordFocused && passwordRequirementsPos && createPortal(
                            <div 
                                className="fixed z-[99999] p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-lg"
                                style={{
                                    top: `${passwordRequirementsPos.top}px`,
                                    left: `${passwordRequirementsPos.left}px`,
                                    width: `${passwordRequirementsPos.width}px`,
                                    maxWidth: '320px'
                                }}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <p className="text-xs font-medium text-gray-700 mb-2">Password Requirements:</p>
                                <div className="space-y-1">
                                    {getPasswordRequirements(currentPasswordValue).map((req, reqIndex) => (
                                        <div key={reqIndex} className="flex items-center text-xs">
                                            <div className={`w-2 h-2 rounded-full mr-2 flex-shrink-0 ${
                                                req.met ? 'bg-green-500' : 'bg-gray-300'
                                            }`} />
                                            <span className={req.met ? 'text-green-700' : 'text-gray-600'}>
                                                {req.text}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>,
                            document.body
                        )}
                    </div>
                </div>
            )}

            {/* Technical User Column */}
            {cols.includes('technicalUser') && (
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
                        data-col='technicalUser'
                        style={{width: '100%'}}
                    >
                        <div className="flex items-center justify-center">
                            <motion.input
                                type="checkbox"
                                checked={row.technicalUser || false}
                                onChange={(e) => {
                                    console.log('🔧 TechnicalUser checkbox changed:', {
                                        rowId: row.id,
                                        oldValue: row.technicalUser,
                                        newValue: e.target.checked,
                                        fullRow: row
                                    });
                                    onUpdateField(row.id, 'technicalUser' as any, e.target.checked);
                                }}
                                className="w-4 h-4 text-blue-600 border-blue-300 rounded focus:ring-blue-500 cursor-pointer transition-transform duration-200 hover:scale-110"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Assigned User Groups Column */}
            {cols.includes('assignedUserGroups') && (
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
                        data-col='assignedUserGroups'
                        style={{width: '100%'}}
                    >
                        {/* User Groups Icon - centered */}
                        <button
                            onClick={() => onOpenUserGroupModal?.(row)}
                            className="flex-shrink-0 p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors duration-200"
                            title="Assign User Groups"
                        >
                            <Users className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* actions column removed */}
            {/* trailing add row removed; fill handle removed */}
        </div>
    );
}

const ManageUsersTable = forwardRef<any, AccountsTableProps>(({
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
    onLicenseValidationChange,
    onLicenseDelete,
    onCompleteLicenseDeletion,
    onOpenAddressModal,
    onOpenUserGroupModal,
    onShowStartDateProtectionModal,
}, ref) => {
    // Log component data received
    console.log('🔍 ManageUsersTable received rows:', rows?.map(row => ({
        id: row.id,
        firstName: row.firstName,
        technicalUser: row.technicalUser,
        hasAllFields: !!row.firstName && !!row.lastName && !!row.emailAddress
    })));
    
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
    const prevRowsRef = useRef<AccountRow[]>([]);
    const orderRef = useRef<string[]>([]);
    
    // Keep local state for editing, but initialize it safely
    const [localEdits, setLocalEdits] = useState<Record<string, Partial<AccountRow>>>({});
    
    // Use useMemo for base derived state with stable comparison
    const { baseLocalRows, order } = useMemo(() => {
        // Check if rows array length or IDs have changed (shallow comparison)
        const currentIds = rows.map(r => r.id).join(',');
        const prevIds = prevRowsRef.current.map(r => r.id).join(',');
        
        if (currentIds === prevIds && rows.length === prevRowsRef.current.length) {
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
    const isFieldMissing = (row: AccountRow, field: string): boolean => {
        switch (field) {
            case 'firstName':
                return !row.firstName || row.firstName.trim() === '';
            case 'lastName':
                return !row.lastName || row.lastName.trim() === '';
            case 'emailAddress':
                // Check for both missing AND invalid email format
                return !row.emailAddress || row.emailAddress.trim() === '' || !isValidEmail(row.emailAddress);
            case 'startDate':
                return !row.startDate || row.startDate.trim() === '';
            case 'password':
                return !row.password || row.password.trim() === '';
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
            if (isFieldMissing(row, 'firstName') ||
                isFieldMissing(row, 'lastName') ||
                isFieldMissing(row, 'emailAddress') ||
                isFieldMissing(row, 'startDate') ||
                isFieldMissing(row, 'password')) {
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
                if (isFieldMissing(row, 'firstName') ||
                    isFieldMissing(row, 'lastName') ||
                    isFieldMissing(row, 'emailAddress') ||
                    isFieldMissing(row, 'startDate') ||
                    isFieldMissing(row, 'password')) {
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
        if (showValidationErrors && incompleteRowIds.length > 0) {
            // Simply set validation errors to the incomplete row IDs from parent
            // Don't do local validation here to avoid circular dependencies
            setValidationErrors(new Set(incompleteRowIds));
            console.log('🔴 ManageUsersTable: Setting validation errors for rows:', incompleteRowIds);
        } else {
            // Clear validation errors when not showing validation or no incomplete rows from parent
            setValidationErrors(new Set());
            console.log('🟢 ManageUsersTable: Clearing validation errors');
        }
    }, [incompleteRowIds, showValidationErrors]);

    // If parent provides external field-level errors (e.g. format validation), apply them
    useEffect(() => {
        try {
            if (externalFieldErrors && Object.keys(externalFieldErrors).length > 0) {
                setFieldValidationErrors(externalFieldErrors as any);
                setValidationErrors(new Set(Object.keys(externalFieldErrors)));
            } else if (!showValidationErrors) {
                // clear when validation UI not active
                setFieldValidationErrors({});
                setValidationErrors(new Set());
            }
        } catch (e) {
            console.error('Error applying externalFieldErrors to ManageUsersTable', e);
        }
    }, [externalFieldErrors, showValidationErrors]);

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
            Object.values(currentTimers).forEach((t) =>
                clearTimeout(t),
            );
        };
    }, []);

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
                // Core fields for user management
                firstName: row.firstName,
                lastName: row.lastName,
                emailAddress: row.emailAddress,
                status: row.status,
            } as any;
            // Map UI state into backend details JSON expected by server
            const details = {
                // User management specific fields
                firstName: row.firstName || '',
                lastName: row.lastName || '',
                emailAddress: row.emailAddress || '',
                status: row.status || '',
            } as any;
            // Handle existing (non-temporary) rows
            // Check if we're on user management page
            if (
                typeof window !== 'undefined' &&
                window.location.pathname.includes('/manage-users')
            ) {
                console.log(
                    '🔄 Updating user data instead of enterprise:',
                    row.id,
                );

                // For user management, update the data via the parent's onUpdateField
                // The parent component will handle the user data updates
                console.log(
                    '⏭️ Skipping direct API call for user management page',
                );
                return;
            }

            // For user management, all persistence is handled by parent component
            console.log(
                '⏭️ Skipping API call - user management handled by parent',
            );
            return;
        } catch (_e) {
            // TODO: surface toast; keep silent here to avoid blocking UI
        }
    }

    function updateRowField(rowId: string, key: keyof AccountRow, value: any) {
        let changed: AccountRow | null = null;
        
        // Update local edits instead of directly modifying localRows
        setLocalEdits(prev => {
            // Use baseLocalRows with current edits to avoid circular dependency
            const baseRow = baseLocalRows.find(r => r.id === rowId);
            if (baseRow) {
                const currentEdits = prev[rowId] || {};
                const currentRow = { ...baseRow, ...currentEdits };
                const next = {...currentRow, [key]: value} as AccountRow;
                changed = next;
                
                return {
                    ...prev,
                    [rowId]: {
                        ...(prev[rowId] || {}),
                        [key]: value
                    }
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

    // Helper function to check if main row fields are complete
    const isMainRowComplete = (row: AccountRow): boolean => {
        return !!(row.firstName && row.firstName.trim() && 
                 row.lastName && row.lastName.trim() && 
                 row.emailAddress && row.emailAddress.trim());
    };

    // State for grouping
    const [groupBy, setGroupBy] = useState<
        'none' | 'firstName' | 'lastName' | 'emailAddress' | 'status'
    >('none');
    
    // sync external groupBy
    React.useEffect(() => {
        if (groupByExternal) setGroupBy(groupByExternal);
    }, [groupByExternal]);

    // Clean break - license management removed
    const columnOrder: AccountsTableProps['visibleColumns'] = useMemo(
        () => [
            // User management columns
            'firstName',
            'middleName',
            'lastName',
            'emailAddress',
            'status',
            'startDate',
            'endDate',
            'password',
            'technicalUser',
            'assignedUserGroups',
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
        firstName: '180px', // First Name column - increased for sort arrows
        middleName: '200px', // Middle Name column - increased more for sort arrows
        lastName: '180px', // Last Name column - increased for sort arrows
        emailAddress: '220px', // Email Address column - adequate for sort arrows
        status: '140px', // Status column - increased for sort arrows
        startDate: '140px', // Start Date column - no sort arrows
        endDate: '140px', // End Date column - no sort arrows
        password: '120px', // Password column - no sort arrows
        technicalUser: '120px', // Technical User column - no sort arrows
        assignedUserGroups: '160px', // Assigned User Groups column - width to fit label + icon
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
                firstName: { min: 140, max: 250 }, // Increased to match Enterprise Config - prevents arrow overlap
                middleName: { min: 160, max: 250 }, // Increased even more for Middle Name - prevents arrow overlap  
                lastName: { min: 140, max: 250 }, // Increased to match Enterprise Config - prevents arrow overlap
                emailAddress: { min: 180, max: 300 }, // Email needs more space - prevents arrow overlap
                status: { min: 140, max: 200 }, // Increased to match Enterprise Config - prevents arrow overlap
                startDate: { min: 120, max: 180 }, // No sort arrows, can be smaller
                endDate: { min: 120, max: 180 }, // No sort arrows, can be smaller
                password: { min: 100, max: 150 }, // No sort arrows, can be smaller
                technicalUser: { min: 120, max: 180 }, // No sort arrows, can be smaller
                assignedUserGroups: { min: 160, max: 200 } // User Groups - width to fit label + icon
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

        const groups: Record<string, AccountRow[]> = {};
        
        displayItems.forEach((item) => {
            let groupKey = '';
            
            switch (groupBy) {
                case 'firstName':
                    groupKey = item.firstName || '(No First Name)';
                    break;
                case 'lastName':
                    groupKey = item.lastName || '(No Last Name)';
                    break;
                case 'emailAddress':
                    groupKey = item.emailAddress || '(No Email Address)';
                    break;
                case 'status':
                    groupKey = item.status || '(No Status)';
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
            
            // With 10+ columns, we likely always need horizontal scrolling
            // Simplified logic: if we have more than 6 columns, enable scrolling
            const totalColumns = 10; // firstName, middleName, lastName, emailAddress, status, startDate, endDate, password, technicalUser, assignedUserGroups
            const shouldAlwaysScroll = totalColumns > 6;
            
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
            
            // Debug logging (remove in production)
            console.log('Scroll Check:', {
                contentWidth,
                containerWidth,
                hoverBuffer,
                isContentOverflowing,
                servicesContentHidden,
                needsScrollbar,
                shouldAlwaysScroll
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
        <div className='compact-table safari-tight manage-users-table' style={{ width: 'max(100%, 1400px)', minWidth: 'max-content' }}>
            {/* Using browser default scrollbars only - remove internal scroll containers */}
            <style dangerouslySetInnerHTML={{
                __html: `
                    /* Use browser's natural scrolling - no internal scroll containers */
                    .manage-users-table div[role="table"] {
                        overflow: visible !important;
                        position: relative;
                    }
                    
                    /* Ensure all field value containers span full width */
                    .manage-users-table [data-col] .bg-white {
                        width: 100% !important;
                        min-width: 100% !important;
                        display: flex !important;
                    }
                    
                    /* Ensure AsyncChipSelect containers span full width */
                    .manage-users-table .relative.min-w-0 {
                        width: 100% !important;
                    }
                    
                    /* Ensure all motion spans with white background span full width */
                    .manage-users-table motion-span[style*="background"] {
                        width: 100% !important;
                        min-width: 100% !important;
                    }
                    
                    /* Force all motion spans in data cells to be full width */
                    .manage-users-table [data-col] motion-span {
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
                    .manage-users-table .rounded-xl > .bg-slate-50 {
                        border-top-left-radius: 0.75rem !important;  /* Match rounded-xl */
                        border-top-right-radius: 0.75rem !important; /* Match rounded-xl */
                        margin: 0 !important;
                        border-left: none !important;
                        border-right: none !important;
                        border-top: none !important;
                    }
                    
                    /* Ensure the header container clips content properly */
                    .manage-users-table .rounded-xl {
                        overflow: hidden !important;
                        border-radius: 0.75rem !important;
                    }
                    
                    /* Override any border-radius interference */
                    .manage-users-table .bg-slate-50 > div.rounded-sm {
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
                    width: 'max(100%, 1400px)' // Ensure wide enough to trigger browser horizontal scroll
                }}>
                    {(() => {
                        const defaultLabels: Record<string, string> = {
                            firstName: 'First Name',
                            middleName: 'Middle Name',
                            lastName: 'Last Name',
                            emailAddress: 'Email Address',
                            status: 'Status',
                            startDate: 'Start Date',
                            endDate: 'End Date',
                            password: 'Password',
                            technicalUser: 'Technical User',
                            assignedUserGroups: 'Assigned User Groups',
                        };

                        // Merge custom labels with defaults
                        const labelFor: Record<string, string> = {
                            ...defaultLabels,
                            ...customColumnLabels,
                        };

                        const iconFor: Record<string, React.ReactNode> = {
                            firstName: (
                                <User size={14} />
                            ),
                            middleName: (
                                <User size={14} />
                            ),
                            lastName: (
                                <User size={14} />
                            ),
                            emailAddress: (
                                <AtSign size={14} />
                            ),
                            status: (
                                <CheckCircle size={14} />
                            ),
                            startDate: (
                                <Calendar size={14} />
                            ),
                            endDate: (
                                <Calendar size={14} />
                            ),
                            password: (
                                <Lock size={14} />
                            ),
                            technicalUser: (
                                <Key size={14} />
                            ),
                            assignedUserGroups: (
                                <Users size={14} />
                            ),
                        };
                        return (
                            <div className='rounded-xl border border-slate-300 shadow-sm bg-white' style={{ 
                                minWidth: 'fit-content', 
                                width: '100%',
                                maxWidth: '100%',
                                overflow: 'hidden' // Ensure content doesn't escape the container
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
                                                c === 'assignedUserGroups' ? 'border-r-0' : 'border-r border-slate-200' // Remove right border for last column
                                            }`}
                                            style={c === 'assignedUserGroups' ? { minWidth: '160px' } : undefined} // Width to fit label + icon
                                        >
                                            <div className='flex items-center gap-2'>
                                                {iconFor[c] && iconFor[c]}
                                                <span>{labelFor[c] || c}</span>
                                            </div>
                                            {[
                                                'firstName',
                                                'middleName',
                                                'lastName',
                                                'emailAddress',
                                                'status',
                                            ].includes(c) && (
                                                <div className={`inline-flex items-center ml-4 ${c === 'assignedUserGroups' ? '' : 'absolute right-8 top-1/2 -translate-y-1/2'}`}>
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
                                            {['firstName', 'middleName', 'lastName', 'emailAddress', 'status', 'startDate', 'endDate', 'password', 'technicalUser'].includes(c) && (
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
                                            {c === 'firstName' && (
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
                                        onShowStartDateProtectionModal={onShowStartDateProtectionModal}
                                        onShowGlobalValidationModal={showGlobalValidationModal}
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
                                    <div className='border-b border-slate-200 overflow-hidden'>
                                        {groupRows.map((r, idx) => (
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
                                                    onShowStartDateProtectionModal={onShowStartDateProtectionModal}
                                                    onShowGlobalValidationModal={showGlobalValidationModal}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            
                            {/* Add New Row Button for grouped view */}
                            {onAddNewRow && (
                                <div className='border border-slate-200 rounded-lg overflow-hidden mt-4'>
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
        </div>
    );
});

// Set the display name for debugging
ManageUsersTable.displayName = 'ManageUsersTable';

export default ManageUsersTable;
