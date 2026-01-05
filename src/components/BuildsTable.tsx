'use client';

import React, {useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle, useCallback} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import './Manage_User/TableComponent.css';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

import { generateId } from '@/utils/id-generator';
import {
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
    Plug,
    AlertTriangle,
    Briefcase,
    Hammer,
    Boxes,
} from 'lucide-react';
import { Icon } from '@/components/Icons';
import {createPortal} from 'react-dom';
import {api} from '../utils/api';
import {accessControlApi} from '../services/accessControlApi';
import DateChipSelect from './DateChipSelect';
import ScopeConfigModal from './ScopeConfigModal';
import {convertFromYAML, PipelineYAML} from '../utils/yamlPipelineUtils';
import yaml from 'js-yaml';
import ConnectorDetailsModal, { Connector } from '@/components/ConnectorDetailsModal';
import { ConnectorRow } from '@/components/ManageConnectorsTable';
import EnvironmentModal from '@/components/EnvironmentModal';
import { EnvironmentRow } from '@/components/EnvironmentsTable';
import { getToolConfig, TOOLS_CONFIG } from '@/config/toolsConfig';

// Utility function to generate consistent colors for build data across the application
const getBuildColor = (connectorName: string) => {
    const key = connectorName.toLowerCase();
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
        hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    }
    
    // Blueish build color palette - consistent across all components
    const buildColors = [
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
    
    return buildColors[hash % buildColors.length];
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
    noBorder?: boolean; // If true, removes border and background for use inside a container
    disabled?: boolean; // If true, disables the dropdown
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
    noBorder = false,
    disabled = false
}) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const dropdownMenuRef = React.useRef<HTMLDivElement>(null);
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
            const target = event.target as Node;
            const isInsideDropdown = dropdownRef.current?.contains(target);
            const isInsideMenu = dropdownMenuRef.current?.contains(target);
            
            if (!isInsideDropdown && !isInsideMenu) {
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
                disabled={disabled}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!disabled) {
                        setIsOpen(!isOpen);
                    }
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
                className={`w-full text-left ${noBorder ? 'px-0 py-0' : 'px-2 py-1'} text-[11px] leading-[14px] ${noBorder ? '' : 'rounded'} ${noBorder ? 'border-0 bg-transparent hover:bg-transparent' : `border ${isError ? 'border-red-500 bg-red-50 ring-2 ring-red-200' : 'border-blue-300 bg-white'} ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:bg-slate-50'}`} ${disabled ? 'text-slate-400' : 'text-slate-700'} focus:outline-none ${noBorder ? '' : `focus:ring-2 ${isError ? 'focus:ring-red-200 focus:border-red-500' : 'focus:ring-blue-200 focus:border-blue-500'}`} flex items-center justify-between ${noBorder ? '' : 'min-h-[24px]'}`}
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
                    ref={dropdownMenuRef}
                    className="fixed z-[99999] bg-white border border-gray-200 rounded-md shadow-xl"
                    style={{ 
                        top: `${dropdownPosition.top}px`,
                        left: `${dropdownPosition.left}px`,
                        width: `${dropdownPosition.width}px`,
                        maxHeight: '120px',
                        overflow: 'auto',
                        pointerEvents: 'auto' // Ensure pointer events are enabled for scrollbar
                    }}
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

export interface build {
    id: string;
    connectorName: string;
    description: string;
    entity: string;
    product: string;
    service: string;
    scope: string;
    isFromDatabase?: boolean; // Flag to indicate if this is an existing build from database (fields should be read-only)
}

export interface BuildRow {
    id: string;
    // Build fields
    connectorName: string;
    description?: string;
    entity: string;
    product: string; // Fixed to "DevOps"
    service: string; // Fixed to "Integration"
    pipeline?: string; // Pipeline name from pipeline canvas
    status?: 'ACTIVE' | 'INACTIVE'; // Status toggle
    scope?: string;
    connectorIconName?: string; // Icon name for the build tool
    connectors?: Array<{
        id: string;
        category: string;
        connector: string;
        connectorIconName?: string;
        authenticationType: string;
        url?: string; // URL field for connectivity
        // GitHub (Code) specific fields
        urlType?: string; // 'Account' | 'Repository'
        connectionType?: string; // 'HTTP' | 'SSH'
        githubAccountUrl?: string; // GitHub URL used for connectivity when build is GitHub under Code
        credentialName?: string; // Credential name from Manage Credentials
        username?: string;
        usernameEncryption?: string;
        apiKey?: string;
        apiKeyEncryption?: string;
        personalAccessToken?: string;
        tokenEncryption?: string;
        githubInstallationId?: string;
        githubInstallationIdEncryption?: string;
        githubApplicationId?: string;
        githubApplicationIdEncryption?: string;
        githubPrivateKey?: string;
        status: boolean;
        description: string;
    }>; // Full connector data for this build
    // Pipeline stages subrow data
    pipelineStagesState?: {
        selectedConnectors: Record<string, string>;
        selectedEnvironments: Record<string, string>;
        selectedRepositoryUrls: Record<string, string>;
        connectorUrlTypes: Record<string, string>;
        connectorRepositoryUrls: Record<string, string>;
        selectedBranches: Record<string, string>;
    };
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

type CatalogType = 'connectorName' | 'description' | 'entity' | 'product' | 'service' | 'scope' | 'connectivityStatus';

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
        type: 'connectorNames' | 'descriptions' | 'entities' | 'products' | 'services' | 'scope',
        action: 'update' | 'delete',
        oldName: string,
        newName?: string,
    ) => Promise<void>;
    onNewItemCreated?: (
        type: 'connectorNames' | 'descriptions' | 'entities' | 'products' | 'services' | 'scope',
        item: {id: string; name: string},
    ) => void;
    accounts?: BuildRow[];
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
                        const colorTheme = getBuildColor(service);
                        
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
                                                const colorTheme = getBuildColor(userGroup);
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
        type: 'connectorNames' | 'descriptions' | 'entities' | 'products' | 'services' | 'scope',
        action: 'update' | 'delete',
        oldName: string,
        newName?: string,
    ) => Promise<void>;
    onNewItemCreated?: (
        type: 'connectorNames' | 'descriptions' | 'entities' | 'products' | 'services' | 'scope',
        item: {id: string; name: string},
    ) => void;
    accounts?: BuildRow[];
    currentRowId?: string;
    currentRowEnterprise?: string;
    currentRowProduct?: string;
    dropdownOptions?: {
        connectorNames: Array<{id: string; name: string}>;
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

                if (type === 'connectorName') {
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
        const forceBelow = type === 'entity' || type === 'product' || type === 'service' || type === 'description' || type === 'connectorName' || type === 'scope';
        
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
            
            // Use dropdownOptions if available for connectorName
            if (type === 'connectorName' && dropdownOptions?.connectorNames) {
                allData = dropdownOptions.connectorNames;
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
            } else if (type === 'connectorName') {
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

                const response = await api.get<Array<{id: string; name: string; connectorName?: string}>>(rolesUrl) || [];
                allData = response.map((item: any) => ({
                    id: item.id || item.roleId || String(Math.random()),
                    name: item.name || item.connectorName || ''
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
        if (type === 'connectorName' && allOptions.length === 0) {
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
            if (type === 'connectorName') {
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
                        'connectorName': 'connectorNames',
                        'description': 'descriptions',
                        'entity': 'entities',
                        'product': 'products',
                        'service': 'services',
                        'scope': 'scope'
                    };
                    
                    const dropdownType = typeMap[type as string] || 'connectorNames';
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
        if (type === 'connectorName') {
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

// AsyncChipSelect for Build Name with dropdown and + sign for new values
function AsyncChipSelectBuildName({
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
    userGroups?: BuildRow[];
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
        console.log('🔄 [BuildName] loadAllOptions called');
        setLoading(true);
        try {
            // Build URL with account/enterprise filters when available
            let buildsUrl = '/api/builds';
            const params = new URLSearchParams();
            if (selectedAccountId) params.append('accountId', selectedAccountId);
            if (selectedAccountName) params.append('accountName', selectedAccountName || '');
            if (selectedEnterpriseId) params.append('enterpriseId', selectedEnterpriseId);
            if (selectedEnterprise) params.append('enterpriseName', selectedEnterprise || '');
            if (params.toString()) buildsUrl += `?${params.toString()}`;

            console.log('📡 [BuildName] Calling API:', buildsUrl);
            const allData = await api.get<Array<{id: string; name: string}>>(buildsUrl) || [];
            console.log(`✅ [BuildName] API call successful, got ${allData.length} items:`, allData);
            // Transform the data to match expected format if needed
            const transformedData = allData.map((item: any) => ({
                id: item.id || item.connectorId || String(Math.random()),
                name: item.name || item.connectorName || ''
            })).filter((item: any) => item.name); // Filter out items without names
            
            // Get distinct build names only (remove duplicates)
            const uniqueConnectorNames = new Map<string, {id: string; name: string}>();
            transformedData.forEach((item: any) => {
                const lowerName = item.name.toLowerCase();
                if (!uniqueConnectorNames.has(lowerName)) {
                    uniqueConnectorNames.set(lowerName, item);
                }
            });
            const distinctData = Array.from(uniqueConnectorNames.values());
            
            // Filter out connector names that are already used in the current table
            // This prevents duplicate connector names within the same account/enterprise
            const usedConnectorNames = new Set(
                userGroups
                    .map(ug => ug.connectorName?.toLowerCase().trim())
                    .filter(name => name) // Remove empty/null names
            );
            
            const availableData = distinctData.filter(item => 
                !usedConnectorNames.has(item.name.toLowerCase().trim())
            );
            
            console.log(`📋 [ConnectorName] Total connectors: ${transformedData.length}, Distinct connector names: ${distinctData.length}`);
            console.log(`📋 [ConnectorName] Already used in table: ${usedConnectorNames.size}`);
            console.log(`📋 [ConnectorName] Available (unused) connector names: ${availableData.length}`);
            console.log(`📋 [ConnectorName] Available connector names for dropdown:`, availableData.map(d => d.name));
            setAllOptions(availableData);
        } catch (error) {
            console.error('❌ [ConnectorName] API call failed:', error);
            // Don't set empty array - keep previous data if any
            // This way, if API fails but user types, showCreateNew will still be true
            setAllOptions([]);
        } finally {
            setLoading(false);
            console.log('🏁 [ConnectorName] loadAllOptions completed, loading set to false');
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
        console.log('🔍 [ConnectorName] filterOptions called', { allOptionsLength: allOptions.length, query });
        if (allOptions.length === 0) {
            console.log('⚠️ [ConnectorName] allOptions is empty, setting options to []');
            setOptions([]);
            return;
        }
        let filtered = allOptions;
        
        // Don't filter out already selected group names - allow users to select existing group names
        // Duplicate prevention happens during save validation (checking Group Name + Entity + Product + Service)
        console.log(`🔍 [ConnectorName] Starting with ${filtered.length} options from API`);
        
        // Apply search filter
        if (query) {
            const queryLower = query.toLowerCase();
            filtered = filtered.filter(opt => 
                opt.name.toLowerCase().startsWith(queryLower)
            );
            console.log(`🔍 [ConnectorName] After startsWith filter (${queryLower}): ${filtered.length} items`, filtered);
            
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
        
        console.log(`✅ [ConnectorName] Setting options to ${filtered.length} filtered items`);
        setOptions(filtered);
    }, [allOptions, query]);

    useEffect(() => {
        filterOptions();
    }, [filterOptions]);

    const addNew = async () => {
        const name = (query || '').trim();
        if (!name) return;

        // Check if connector name is already used in the current table (duplicate check)
        const isDuplicateInTable = userGroups.some(
            ug => ug.connectorName?.toLowerCase().trim() === name.toLowerCase()
        );
        
        if (isDuplicateInTable) {
            console.log('❌ [ConnectorName] Duplicate connector name detected in table:', name);
            alert(`Connector name "${name}" already exists in the table. Please use a different name.`);
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
            // DO NOT create connector in database immediately - just set the value locally
            // The connector will be created when the full row is saved (with all mandatory fields)
            console.log('➕ [ConnectorName] Setting new connector name (NOT creating in DB yet):', name);
            console.log('📦 [ConnectorName] Connector will be created when row is saved with all mandatory fields');
            
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
                            console.log('🎯 [ConnectorName] Focused chip after setting value');
                        } else {
                            // If inputRef is still the input, find the chip
                            const chipElement = containerRef.current?.querySelector('span[tabindex="0"]') as HTMLElement;
                            if (chipElement) {
                                chipElement.focus();
                                console.log('🎯 [ConnectorName] Focused chip after setting value (found via querySelector)');
                            }
                        }
                    }
                } catch (e) {
                    console.log('🎯 [ConnectorName] Error focusing chip after setting value:', e);
                }
            }, 100); // Small delay to ensure React state updates are complete
        } catch (error: any) {
            console.error('❌ [ConnectorName] Failed to set connector name:', error);
            alert(`Failed to set connector name: ${error.message || 'Unknown error'}`);
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
                            console.log('⌨️ [ConnectorName] onChange:', { newValue, allOptionsLength: allOptions.length, open });
                            setQuery(newValue);
                            // Always open dropdown when typing to show options or + button
                            console.log('📂 [ConnectorName] Setting open to true');
                            setOpen(true);
                            // Calculate position immediately
                            if (containerRef.current) {
                                const containerRect = containerRef.current.getBoundingClientRect();
                                const width = Math.max(140, Math.min(200, containerRect.width));
                                const top = containerRect.bottom + 2;
                                const left = containerRect.left;
                                console.log('📍 [ConnectorName] Setting dropdown position:', { top, left, width });
                                setDropdownPortalPos({ top, left, width });
                            }
                            // Reload options to exclude already-used group names
                            console.log('📥 [ConnectorName] Reloading options to filter out used group names');
                            loadAllOptions();
                            // Clear current selection if user clears the input completely
                            if (newValue === '') {
                                onChange('');
                                setCurrent('');
                            }
                        }}
                        onFocus={() => {
                            console.log('👁️ [ConnectorName] onFocus:', { allOptionsLength: allOptions.length, open, query });
                            setOpen(true);
                            // Calculate position immediately on focus
                            if (containerRef.current) {
                                const containerRect = containerRef.current.getBoundingClientRect();
                                const width = Math.max(140, Math.min(200, containerRect.width));
                                const top = containerRect.bottom + 2;
                                const left = containerRect.left;
                                console.log('📍 [ConnectorName] Setting dropdown position on focus:', { top, left, width });
                                setDropdownPortalPos({ top, left, width });
                            }
                            // Always reload options on focus to exclude already-used group names
                            console.log('📥 [ConnectorName] Reloading options on focus to filter out used group names');
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
                                        ug => ug.connectorName?.toLowerCase().trim() === exactMatch.name.toLowerCase().trim()
                                    );
                                    
                                    if (isDuplicate) {
                                        console.log('❌ [ConnectorName] Cannot select duplicate connector name:', exactMatch.name);
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
                                                    console.log('🎯 [ConnectorName] Focused chip after Enter on existing value');
                                                } else {
                                                    // If inputRef is still the input, find the chip
                                                    const chipElement = containerRef.current?.querySelector('span[tabindex="0"]') as HTMLElement;
                                                    if (chipElement) {
                                                        chipElement.focus();
                                                        console.log('🎯 [ConnectorName] Focused chip after Enter on existing value (found via querySelector)');
                                                    }
                                                }
                                            }
                                        } catch (e) {
                                            console.log('🎯 [ConnectorName] Error focusing chip after Enter on existing value:', e);
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
                                            ug => ug.connectorName?.toLowerCase().trim() === exactMatch.name.toLowerCase().trim()
                                        );
                                        
                                        if (isDuplicate) {
                                            console.log('❌ [ConnectorName] Cannot select duplicate connector name:', exactMatch.name);
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
                                                    console.log('🎯 [ConnectorName] Focused chip after Tab on existing value');
                                                    
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
                                                console.log('🎯 [ConnectorName] Error focusing chip after Tab on existing value:', e);
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
                                console.log('🎨 [ConnectorName] Rendering dropdown content', {
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
                                
                                console.log('🔍 [ConnectorName] filteredOptions:', filteredOptions);
                                
                                // Check if query exactly matches an existing option - always check allOptions when available (database source of truth)
                                const exactMatch = query.trim() && allOptions.length > 0 ? allOptions.find(opt => 
                                    opt.name.toLowerCase() === query.toLowerCase().trim()
                                ) : null;
                                
                                console.log('🎯 [ConnectorName] exactMatch check:', {
                                    query: query.trim(),
                                    allOptionsLength: allOptions.length,
                                    exactMatch: exactMatch?.name || null,
                                    allOptionsSample: allOptions.slice(0, 5).map(o => o.name)
                                });
                                
                                // Show + button if:
                                // 1. Query is entered
                                // 2. Either allOptions is empty (still loading) OR no exact match found in database
                                const showCreateNew = query.trim() && (allOptions.length === 0 || !exactMatch);
                                
                                console.log('➕ [ConnectorName] showCreateNew calculation:', {
                                    queryTrimmed: query.trim(),
                                    queryHasValue: !!query.trim(),
                                    allOptionsEmpty: allOptions.length === 0,
                                    exactMatchFound: !!exactMatch,
                                    showCreateNew
                                });
                                
                                // Show loading only if loading AND no query entered yet
                                if (loading && allOptions.length === 0 && !query.trim()) {
                                    console.log('⏳ [ConnectorName] Showing loading message');
                                    return (
                                        <div className='px-3 py-2 text-slate-500 text-center'>
                                            Loading…
                                        </div>
                                    );
                                }
                                
                                // Only show "No matches" if there are no filtered options AND no new value to create AND not loading AND allOptions is loaded
                                if (filteredOptions.length === 0 && !showCreateNew && !loading && allOptions.length > 0) {
                                    console.log('🚫 [ConnectorName] Showing "No matches" message');
                                    return (
                                        <div className='px-3 py-2 text-slate-500 text-center'>
                                            No matches
                                        </div>
                                    );
                                }
                                
                                // Show empty state when no values exist in database
                                if (filteredOptions.length === 0 && !query.trim() && !loading && allOptions.length === 0) {
                                    console.log('📭 [ConnectorName] Showing "No value found" message');
                                    return (
                                        <div className='px-3 py-2 text-slate-500 text-center'>
                                            No value found
                                        </div>
                                    );
                                }
                                
                                console.log('✅ [ConnectorName] Rendering dropdown items and + button', {
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
                                                                ug => ug.connectorName?.toLowerCase().trim() === opt.name.toLowerCase().trim()
                                                            );
                                                            
                                                            if (isDuplicate) {
                                                                console.log('❌ [ConnectorName] Cannot select duplicate connector name:', opt.name);
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
                                                                        console.log('🎯 [ConnectorName] Focused chip after dropdown selection');
                                                                    }
                                                                } catch (e) {
                                                                    console.log('🎯 [ConnectorName] Error focusing chip after dropdown selection:', e);
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
                                                        console.log('🖱️ [ConnectorName] + button clicked for:', query.trim());
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
    accounts?: BuildRow[];
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
            
            // Get enterpriseId from props or localStorage
            const enterpriseId = selectedEnterpriseId || (typeof window !== 'undefined' ? window.localStorage.getItem('selectedEnterpriseId') : null);
            if (!enterpriseId) {
                console.log('⚠️ [Entity] No enterpriseId available');
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
                accountId?: string;
                enterpriseId?: string;
                accountName?: string;
                enterpriseName?: string;
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
            // First filter by matching accountId and enterpriseId to ensure we only get entities for the selected account/enterprise
            const filteredByAccountAndEnterprise = response.filter(item => {
                const matchesAccount = item.accountId === actualAccountId;
                const matchesEnterprise = item.enterpriseId === enterpriseId;
                const hasEntityName = item.entityName && item.entityName.trim() !== '';
                
                if (!matchesAccount || !matchesEnterprise) {
                    console.log('🔍 [Entity] Filtering out item - does not match account/enterprise:', {
                        entityName: item.entityName,
                        itemAccountId: item.accountId,
                        itemEnterpriseId: item.enterpriseId,
                        expectedAccountId: actualAccountId,
                        expectedEnterpriseId: enterpriseId,
                        matchesAccount,
                        matchesEnterprise
                    });
                }
                
                return matchesAccount && matchesEnterprise && hasEntityName;
            });
            
            // Then extract unique entity names
            const uniqueEntities = Array.from(new Set(
                filteredByAccountAndEnterprise.map(item => item.entityName)
            ));
            
            console.log('✅ [Entity] Filtered unique entities for account/enterprise:', uniqueEntities);
            console.log('🔍 [Entity] Filtered from', response.length, 'total items to', filteredByAccountAndEnterprise.length, 'matching items');
            
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
    }, [selectedEnterprise, selectedAccountId, selectedAccountName, selectedEnterpriseId]);

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
                            // Handle Tab navigation from the chip to next field (Pipeline) - exactly like AssignedUserGroupTable
                            if (e.key === 'Tab') {
                                e.preventDefault();
                                e.stopPropagation();
                                
                                // Find the current row and navigate to Pipeline field
                                const currentElement = e.target as HTMLElement;
                                const currentColDiv = currentElement.closest('[data-col]');
                                const currentRowId = currentColDiv?.getAttribute('data-row-id');
                                
                                if (currentRowId) {
                                    // Find the Pipeline field in the same row
                                    const nextColDiv = document.querySelector(`[data-row-id="${currentRowId}"][data-col="pipeline"]`);
                                    
                                    if (nextColDiv) {
                                        // Find the input or chip element in the Pipeline field
                                        const pipelineInput = nextColDiv.querySelector('input') as HTMLInputElement;
                                        const pipelineChip = nextColDiv.querySelector('span[tabindex="0"]') as HTMLElement;
                                        
                                        // Focus the input if available, otherwise the chip
                                        const targetElement = pipelineInput || pipelineChip;
                                        
                                        if (targetElement) {
                                            setTimeout(() => {
                                                targetElement.focus();
                                                // If it's the chip, click it to open the dropdown
                                                if (pipelineChip && !pipelineInput) {
                                                    pipelineChip.click();
                                                }
                                                // If it's the input, ensure dropdown opens
                                                if (pipelineInput) {
                                                    pipelineInput.focus();
                                                    pipelineInput.dispatchEvent(new Event('focus', { bubbles: true }));
                                                }
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

// AsyncChipSelect for Pipeline with dropdown filtered by Account, Enterprise, and Workstream
function AsyncChipSelectPipeline({
    value,
    onChange,
    placeholder = '',
    isError = false,
    selectedEnterprise = '',
    selectedAccountId = '',
    selectedEnterpriseId = '',
    selectedAccountName = '',
    workstream = '',
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
    selectedAccountName?: string;
    workstream?: string;
    onTabNext?: () => void;
    onTabPrev?: () => void;
}) {
    const [open, setOpen] = useState(false);
    const [current, setCurrent] = useState<string | undefined>(value);
    const [query, setQuery] = useState('');
    const [options, setOptions] = useState<Array<{id: string; name: string}>>([]);
    const [allOptions, setAllOptions] = useState<Array<{id: string; name: string}>>([]);
    const [loading, setLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [dropdownPortalPos, setDropdownPortalPos] = useState<{
        top: number;
        left: number;
        width: number;
    } | null>(null);

    // Load pipelines from pipeline canvas API filtered by Account, Enterprise, and Workstream
    const loadAllOptions = useCallback(async () => {
        setLoading(true);
        try {
            if (!selectedAccountId || !selectedEnterpriseId) {
                console.log('🔍 [Pipeline] Missing account or enterprise, clearing options');
                setAllOptions([]);
                setLoading(false);
                return;
            }

            console.log('🔍 [Pipeline] Loading pipelines for account:', selectedAccountId, 'enterprise:', selectedEnterpriseId, 'workstream:', workstream);

            // Build API URL with filters
            let apiUrl = `/api/pipeline-canvas?accountId=${selectedAccountId}&enterpriseId=${selectedEnterpriseId}`;
            if (selectedAccountName) {
                apiUrl += `&accountName=${encodeURIComponent(selectedAccountName)}`;
            }
            if (workstream) {
                apiUrl += `&workstream=${encodeURIComponent(workstream)}`;
            }

            const response = await api.get<Array<{
                id: string;
                pipelineName: string;
                entity?: string;
                accountId?: string;
                enterpriseId?: string;
            }>>(apiUrl) || [];
            
            console.log('📦 [Pipeline] API response:', response);
            
            // Filter pipelines by workstream if provided
            let filteredPipelines = response;
            if (workstream) {
                filteredPipelines = response.filter(p => 
                    !p.entity || p.entity.toLowerCase() === workstream.toLowerCase()
                );
            }
            
            // Extract unique pipeline names
            const uniquePipelines = Array.from(new Set(
                filteredPipelines.map(p => p.pipelineName).filter(name => name && name.trim() !== '')
            ));
            
            console.log('✅ [Pipeline] Filtered unique pipelines:', uniquePipelines);
            
            // Convert to the expected format
            const allData = uniquePipelines.map((pipelineName, index) => ({
                id: `pipeline-${pipelineName}-${index}`,
                name: pipelineName
            }));
            
            setAllOptions(allData);
        } catch (error) {
            console.error('❌ [Pipeline] Failed to load pipelines:', error);
            setAllOptions([]);
        } finally {
            setLoading(false);
        }
    }, [selectedAccountId, selectedEnterpriseId, selectedAccountName, workstream]);

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
        if (open && allOptions.length === 0 && selectedAccountId && selectedEnterpriseId) {
            loadAllOptions();
        }
    }, [open, allOptions.length, selectedAccountId, selectedEnterpriseId, loadAllOptions]);

    useEffect(() => {
        setCurrent(value);
    }, [value]);

    // Reload when workstream changes
    useEffect(() => {
        if (selectedAccountId && selectedEnterpriseId) {
            loadAllOptions();
        }
    }, [workstream, selectedAccountId, selectedEnterpriseId, loadAllOptions]);

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
                opt.name.toLowerCase().startsWith(queryLower) ||
                opt.name.toLowerCase().includes(queryLower)
            );
            
            filtered = filtered.sort((a, b) => {
                const aLower = a.name.toLowerCase();
                const bLower = b.name.toLowerCase();
                const queryLower = query.toLowerCase();
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
                            if (e.key === 'Tab') {
                                e.preventDefault();
                                e.stopPropagation();
                                
                                const currentElement = e.target as HTMLElement;
                                const currentColDiv = currentElement.closest('[data-col]');
                                const currentRowId = currentColDiv?.getAttribute('data-row-id');
                                
                                if (currentRowId) {
                                    const nextColDiv = document.querySelector(`[data-row-id="${currentRowId}"][data-col="status"]`);
                                    
                                    if (nextColDiv) {
                                        const statusButton = nextColDiv.querySelector('button') as HTMLElement;
                                        if (statusButton) {
                                            setTimeout(() => {
                                                statusButton.focus();
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
                            if (allOptions.length === 0 && selectedAccountId && selectedEnterpriseId) {
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
                            if (allOptions.length === 0 && selectedAccountId && selectedEnterpriseId) {
                                loadAllOptions();
                            }
                            // If there's a current value, set query to it so dropdown shows options
                            if (current || value) {
                                setQuery(current || value || '');
                            }
                        }}
                        onKeyDown={(e: any) => {
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
                                                    `[data-row-id="${currentRowId}"][data-col="pipeline"] span[tabindex="0"]`
                                                ) as HTMLElement;
                                                if (chipElement) {
                                                    chipElement.focus();
                                                }
                                            }
                                        } catch (error) {
                                            console.error('Failed to focus chip after Enter:', error);
                                        }
                                    }, 50);
                                }
                            } else if (e.key === 'Escape') {
                                setOpen(false);
                                setQuery('');
                            } else if (e.key === 'Tab') {
                                // Don't prevent default if we want to allow normal tab navigation
                                // Just close dropdown and let onTabNext handle navigation
                                if (query.trim()) {
                                    const exactMatch = allOptions.find(opt => 
                                        opt.name.toLowerCase() === query.toLowerCase().trim()
                                    );
                                    if (exactMatch) {
                                        onChange(exactMatch.name);
                                        setCurrent(exactMatch.name);
                                        setQuery('');
                                        setOpen(false);
                                    }
                                } else {
                                    setOpen(false);
                                }
                                
                                // Use onTabNext for proper navigation
                                if (!e.shiftKey && onTabNext) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onTabNext();
                                } else if (e.shiftKey && onTabPrev) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onTabPrev();
                                }
                            }
                        }}
                        onBlur={(e) => {
                            setTimeout(() => {
                                if (!open) {
                                    const exactMatch = allOptions.find(opt => 
                                        opt.name.toLowerCase() === (query || '').toLowerCase().trim()
                                    );
                                    if (exactMatch) {
                                        onChange(exactMatch.name);
                                        setCurrent(exactMatch.name);
                                    } else if (query && query !== (current || value)) {
                                        // Keep the typed value
                                    } else if (!query) {
                                        setQuery('');
                                    }
                                    setQuery('');
                                }
                            }, 150);
                        }}
                        className={`w-full text-left px-2 py-1 text-[12px] rounded border ${isError ? 'border-red-500 bg-red-50 ring-2 ring-red-200' : open ? 'border-blue-500 bg-white ring-2 ring-blue-200' : 'border-blue-300 bg-white hover:bg-slate-50'} ${!selectedAccountId || !selectedEnterpriseId ? 'opacity-50 cursor-not-allowed' : ''} text-slate-700 focus:outline-none focus:ring-2 ${isError ? 'focus:ring-red-200 focus:border-red-500' : 'focus:ring-blue-200 focus:border-blue-500'}`}
                        placeholder={placeholder || ''}
                        disabled={!selectedAccountId || !selectedEnterpriseId}
                        readOnly={!selectedAccountId || !selectedEnterpriseId}
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
                            ) : !selectedAccountId || !selectedEnterpriseId ? (
                                <div className='px-3 py-2 text-slate-500 text-center'>Please select Account and Enterprise first</div>
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
                                
                                if (filteredOptions.length === 0 && query.trim() && !loading) {
                                    return (
                                        <div className='px-3 py-2 text-slate-500 text-center'>No matches found</div>
                                    );
                                }

                                if (filteredOptions.length === 0 && !query.trim() && !loading && allOptions.length === 0) {
                                    return (
                                        <div className='px-3 py-2 text-slate-500 text-center'>No pipelines found</div>
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
                                                                            `[data-row-id="${currentRowId}"][data-col="pipeline"] span[tabindex="0"]`
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
    
    // Track previous product to detect changes
    const prevProductRef = useRef<string>(selectedProduct);

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
    }, [selectedEnterprise, selectedProduct, selectedAccountId]);

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

    // Reload options when product changes - this is critical for showing correct services
    useEffect(() => {
        const productChanged = prevProductRef.current !== selectedProduct;
        
        if (productChanged && selectedEnterprise && selectedProduct && selectedAccountId) {
            console.log('🔄 [Service] Product changed from', prevProductRef.current, 'to', selectedProduct, '- reloading services');
            // Update the ref
            prevProductRef.current = selectedProduct;
            // Clear existing options first
            setAllOptions([]);
            setOptions([]);
            // Clear the current value when product changes since services are product-specific
            if (value) {
                onChange('');
            }
            // Reload options for the new product
            loadAllOptions();
        } else if (!productChanged && selectedEnterprise && selectedProduct && selectedAccountId && allOptions.length === 0) {
            // Initial load when product is first selected (no previous product)
            loadAllOptions();
        } else if (!selectedProduct) {
            // Clear options if product is cleared
            prevProductRef.current = '';
            setAllOptions([]);
            setOptions([]);
        } else {
            // Update ref even if no reload needed
            prevProductRef.current = selectedProduct;
        }
    }, [selectedProduct, selectedEnterprise, selectedAccountId, loadAllOptions, value, onChange, allOptions.length]);
    
    useEffect(() => {
        if (open && allOptions.length === 0 && selectedEnterprise && selectedProduct && selectedAccountId) {
            loadAllOptions();
        }
    }, [open, allOptions.length, selectedEnterprise, selectedProduct, selectedAccountId, loadAllOptions]);

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

// Connectivity Status Cell Component
interface ConnectivityStatusCellProps {
    connectorName: string;
    rowId: string;
    row: BuildRow;
    selectedAccountId?: string;
    selectedAccountName?: string;
    selectedEnterpriseId?: string;
    selectedEnterprise?: string;
    workstream?: string;
    product?: string;
    service?: string;
    onOpenBuildDetail?: (row: BuildRow) => void;
}

interface TestResult {
    status: 'success' | 'failed';
    timestamp: number;
}

function ConnectivityStatusCell({ connectorName, rowId, row, selectedAccountId, selectedAccountName, selectedEnterpriseId, selectedEnterprise, workstream, product, service, onOpenBuildDetail }: ConnectivityStatusCellProps) {
    const [isTesting, setIsTesting] = useState(false);
    const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'failed'>('idle');
    const [testTime, setTestTime] = useState<Date | null>(null);
    const [timeAgo, setTimeAgo] = useState<string>('');

    // Track connector data changes to ensure we always use the latest data
    useEffect(() => {
        if (row.connectors && row.connectors.length > 0) {
            const connector = row.connectors.find(
                c => c.connector === connectorName || c.connector.toLowerCase() === connectorName.toLowerCase()
            ) || row.connectors[0];
            
            console.log('🔄 [ConnectivityStatusCell] Row connectors updated:', {
                rowId,
                connectorName,
                connectorCount: row.connectors.length,
                connector: {
                    connector: connector.connector,
                    url: connector.url,
                    credentialName: connector.credentialName,
                    authenticationType: connector.authenticationType
                },
                allConnectors: row.connectors.map(c => ({
                    connector: c.connector,
                    credentialName: c.credentialName
                }))
            });
        }
    }, [row.connectors, rowId, connectorName]);

    // Load stored test result from localStorage on mount and when storage changes
    const loadTestResult = useCallback(() => {
        if (!selectedAccountId || !selectedEnterpriseId) return;
        
        try {
            const STORAGE_KEY = `connector_test_results_${selectedAccountId}_${selectedEnterpriseId}`;
            const stored = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
            if (stored) {
                const results: Record<string, TestResult> = JSON.parse(stored);
                const result = results[rowId];
                if (result) {
                    setTestStatus(result.status);
                    setTestTime(new Date(result.timestamp));
                } else {
                    // Clear status if result was removed
                    setTestStatus('idle');
                    setTestTime(null);
                }
            } else {
                setTestStatus('idle');
                setTestTime(null);
            }
        } catch (error) {
            console.error('❌ [ConnectivityStatusCell] Error loading test result:', error);
        }
    }, [rowId, selectedAccountId, selectedEnterpriseId]);

    useEffect(() => {
        loadTestResult();
    }, [loadTestResult]);

    // Listen for test result updates from ConnectorDetailsModal
    useEffect(() => {
        const handleTestResultUpdate = () => {
            loadTestResult();
        };

        window.addEventListener('connectorTestResultUpdated', handleTestResultUpdate);
        return () => {
            window.removeEventListener('connectorTestResultUpdated', handleTestResultUpdate);
        };
    }, [loadTestResult]);

    // Calculate time ago string
    const getTimeAgo = (date: Date): string => {
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        
        if (seconds < 60) {
            return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
        }
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) {
            return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
        }
        const hours = Math.floor(minutes / 60);
        if (hours < 24) {
            return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        }
        const days = Math.floor(hours / 24);
        return `${days} day${days !== 1 ? 's' : ''} ago`;
    };

    // Update time ago in background (updates less frequently to avoid constant UI changes)
    useEffect(() => {
        if (!testTime) {
            setTimeAgo('');
            return;
        }

        // Initial update
        setTimeAgo(getTimeAgo(testTime));

        // Update every minute (not continuously) - timer runs in background
        const interval = setInterval(() => {
            setTimeAgo(getTimeAgo(testTime));
        }, 60000); // Update every minute

        return () => clearInterval(interval);
    }, [testTime]);

    const testConnectivity = async () => {
        if (!selectedAccountId || !selectedEnterpriseId) {
            console.error('❌ [ConnectivityStatusCell] Missing accountId or enterpriseId');
            return;
        }

        // Read connector data directly from localStorage to ensure we have the latest saved data
        // This is important because the row prop might be stale after a save operation
        let connector = null;
        try {
            const LOCAL_STORAGE_CONNECTORS_KEY = 'connectors_connectors_data';
            const storageKey = `${LOCAL_STORAGE_CONNECTORS_KEY}_${selectedAccountId}_${selectedEnterpriseId}`;
            const stored = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) : null;
            
            if (stored) {
                const allRows: BuildRow[] = JSON.parse(stored);
                const savedRow = allRows.find(r => r.id === rowId);
                
                if (savedRow && savedRow.connectors && savedRow.connectors.length > 0) {
                    // Find connector matching the connectorName prop
                    connector = savedRow.connectors.find(
                        c => c.connector === connectorName || c.connector.toLowerCase() === connectorName.toLowerCase()
                    );
                    // Fallback to first connector if no match found
                    if (!connector) {
                        connector = savedRow.connectors[0];
                        console.warn('⚠️ [ConnectivityStatusCell] Connector name mismatch - using first connector:', {
                            expectedConnectorName: connectorName,
                            foundConnectorName: connector.connector,
                            availableConnectors: savedRow.connectors.map(c => c.connector)
                        });
                    }
                    console.log('✅ [ConnectivityStatusCell] Loaded connector from localStorage:', {
                        rowId,
                        connectorName: connector.connector,
                        credentialName: connector.credentialName,
                        url: connector.url,
                        authenticationType: connector.authenticationType
                    });
                } else {
                    console.warn('⚠️ [ConnectivityStatusCell] Row not found in localStorage or has no connectors:', {
                        rowId,
                        foundRow: !!savedRow,
                        connectorsCount: savedRow?.connectors?.length || 0
                    });
                }
            } else {
                console.warn('⚠️ [ConnectivityStatusCell] No connectors found in localStorage for storage key:', storageKey);
            }
        } catch (error) {
            console.error('❌ [ConnectivityStatusCell] Error loading connector from localStorage:', error);
        }
        
        // Fallback to row prop if localStorage read failed
        if (!connector && row.connectors && row.connectors.length > 0) {
            connector = row.connectors.find(
                c => c.connector === connectorName || c.connector.toLowerCase() === connectorName.toLowerCase()
            ) || row.connectors[0];
            console.warn('⚠️ [ConnectivityStatusCell] Using fallback connector from row prop:', {
                connectorName: connector.connector,
                credentialName: connector.credentialName
            });
        }
        
        if (!connector) {
            console.warn('⚠️ [ConnectivityStatusCell] No connector found:', {
                rowId,
                connectorName,
                hasRowConnectors: !!(row.connectors && row.connectors.length > 0),
                connectorsCount: row.connectors?.length || 0
            });
            alert('Cannot test connectivity. No connector details found for this row.');
            return;
        }

        // Determine URL value for logging
        const urlValueForLog = connector.category === 'code' && connector.connector === 'GitHub'
            ? connector.githubAccountUrl
            : connector.url;

        console.log('🔍 [ConnectivityStatusCell] Using connector (from localStorage):', {
            rowId,
            connectorName: connector.connector,
            category: connector.category,
            url: urlValueForLog,
            githubAccountUrl: connector.githubAccountUrl,
            credentialName: connector.credentialName,
            authenticationType: connector.authenticationType,
            connectorId: connector.id,
            timestamp: new Date().toISOString(),
            source: 'localStorage'
        });

        // Check if required fields are filled
        // For GitHub Code connector, check githubAccountUrl; for others, check url
        const hasUrl = connector.category === 'code' && connector.connector === 'GitHub'
            ? connector.githubAccountUrl
            : connector.url;

        if (!connector.connector || !connector.credentialName || !hasUrl) {
            console.warn('⚠️ [ConnectivityStatusCell] Cannot test connectivity - missing required fields:', {
                hasConnector: !!connector.connector,
                hasCredentialName: !!connector.credentialName,
                hasUrl: !!hasUrl,
                connector: connector.connector || '(empty)',
                credentialName: connector.credentialName || '(empty)',
                url: hasUrl || '(empty)',
                category: connector.category || '(empty)',
                isGitHub: connector.category === 'code' && connector.connector === 'GitHub',
                githubAccountUrl: connector.githubAccountUrl || '(empty)'
            });
            alert('Cannot test connectivity. Please ensure URL and Credential Name are filled in the connector details.');
            return;
        }

        // Ensure accountId and enterpriseId are present
        if (!selectedAccountId || !selectedEnterpriseId) {
            console.error('❌ [ConnectivityStatusCell] Cannot test connectivity - missing accountId or enterpriseId');
            setTestStatus('failed');
            setTestTime(new Date());
            return;
        }

        setIsTesting(true);
        setTestStatus('idle');
        setTestTime(null);

        // Simulate minimum test duration (2-3 seconds) for better UX
        const minTestDuration = 2500; // 2.5 seconds minimum
        const testStartTime = Date.now();

        try {
            // Load credential details from localStorage to get username and API token
            let username = '';
            let apiToken = '';
            let foundCredentialConnector: any = null;
            let authType = connector.authenticationType || '';
            
            // Determine URL value for logging
            const urlValueForLog = connector.category === 'code' && connector.connector === 'GitHub'
                ? connector.githubAccountUrl
                : connector.url;
            
            console.log('🔑 [ConnectivityStatusCell] Starting connectivity test:', {
                connectorName: connector.connector,
                category: connector.category,
                url: urlValueForLog,
                githubAccountUrl: connector.githubAccountUrl,
                credentialName: connector.credentialName,
                authenticationType: connector.authenticationType,
                hasAccountId: !!selectedAccountId,
                hasEnterpriseId: !!selectedEnterpriseId
            });
            
            if (connector.credentialName && selectedAccountId && selectedEnterpriseId) {
                try {
                    const LOCAL_STORAGE_CREDENTIALS_KEY = 'credentials_credentials_data';
                    const storageKey = `${LOCAL_STORAGE_CREDENTIALS_KEY}_${selectedAccountId}_${selectedEnterpriseId}`;
                    const stored = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) : null;
                    
                    if (stored) {
                        const allCredentials: any[] = JSON.parse(stored);
                        console.log('🔑 [ConnectivityStatusCell] Loaded', allCredentials.length, 'credentials from localStorage');
                        
                        const credential = allCredentials.find(
                            cred => cred.credentialName === connector.credentialName
                        );
                        
                        // Validate that credential exists
                        if (!credential) {
                            console.error('❌ [ConnectivityStatusCell] Credential not found:', connector.credentialName);
                            throw new Error(`Credential "${connector.credentialName}" not found. It may have been deleted. Please update the connector with a valid credential name.`);
                        }
                        
                        // Validate that credential matches current workstream/product/service
                        const currentWorkstream = workstream || row.entity || '';
                        const currentProduct = product || row.product || '';
                        const currentService = service || row.service || '';
                        
                        const entityMatch = !currentWorkstream || !credential.entity || 
                            credential.entity.toLowerCase() === currentWorkstream.toLowerCase();
                        const productMatch = !currentProduct || !credential.product || 
                            credential.product.toLowerCase() === currentProduct.toLowerCase();
                        const serviceMatch = !currentService || !credential.service || 
                            credential.service.toLowerCase() === currentService.toLowerCase();
                        
                        if (!entityMatch || !productMatch || !serviceMatch) {
                            console.error('❌ [ConnectivityStatusCell] Credential does not match current workstream/product/service:', {
                                credentialName: connector.credentialName,
                                credentialWorkstream: credential.entity,
                                credentialProduct: credential.product,
                                credentialService: credential.service,
                                currentWorkstream: currentWorkstream,
                                currentProduct: currentProduct,
                                currentService: currentService,
                                entityMatch,
                                productMatch,
                                serviceMatch
                            });
                            throw new Error(`Credential "${connector.credentialName}" does not match the current workstream/product/service combination. The credential's workstream/product/service may have been changed in Manage Credentials. Please update the connector with a valid credential name.`);
                        }
                        
                        if (credential && credential.connectors && credential.connectors.length > 0) {
                            console.log('🔑 [ConnectivityStatusCell] Found credential:', credential.credentialName, 'with', credential.connectors.length, 'connectors');
                            
                            // Find connector matching the current connector name
                            foundCredentialConnector = credential.connectors.find(
                                (c: { connector: string; [key: string]: any }) => c.connector === connector.connector || c.connector.toLowerCase() === connector.connector.toLowerCase()
                            );
                            
                            if (foundCredentialConnector) {
                                console.log('🔑 [ConnectivityStatusCell] Found credential connector:', {
                                    credentialConnector: foundCredentialConnector.connector,
                                    authenticationType: foundCredentialConnector.authenticationType,
                                    hasUsername: !!foundCredentialConnector.username,
                                    hasApiKey: !!foundCredentialConnector.apiKey,
                                    hasPersonalAccessToken: !!foundCredentialConnector.personalAccessToken
                                });
                                
                                // Determine authentication type from credential connector if not set in connector
                                authType = connector.authenticationType || foundCredentialConnector.authenticationType || '';
                                
                                // For JIRA with Username and API Key authentication
                                if (authType === 'Username and API Key' || (!authType && foundCredentialConnector.username && foundCredentialConnector.apiKey)) {
                                    username = foundCredentialConnector.username || connector.username || '';
                                    apiToken = foundCredentialConnector.apiKey || connector.apiKey || '';
                                } else if (authType === 'Username and Token' || (!authType && foundCredentialConnector.username && foundCredentialConnector.personalAccessToken)) {
                                    // For GitHub: Username and Token (Personal Access Token)
                                    username = foundCredentialConnector.username || connector.username || '';
                                    apiToken = foundCredentialConnector.personalAccessToken || connector.personalAccessToken || '';
                                } else if (authType === 'Personal Access Token' || (!authType && foundCredentialConnector.personalAccessToken)) {
                                    apiToken = foundCredentialConnector.personalAccessToken || connector.personalAccessToken || '';
                                } else if (authType === 'OAuth') {
                                    // For OAuth, OAuth is already configured in Manage Credentials
                                    // The backend will use the OAuth token associated with this credential name
                                    console.log('🔑 [ConnectivityStatusCell] Using OAuth authentication for credential:', connector.credentialName);
                                }
                                
                                console.log('🔑 [ConnectivityStatusCell] Extracted credential details:', {
                                    credentialName: connector.credentialName,
                                    authenticationType: authType,
                                    hasUsername: !!username,
                                    hasApiToken: !!apiToken,
                                    username: username ? `${username.substring(0, 5)}...` : 'none',
                                    apiTokenLength: apiToken ? apiToken.length : 0,
                                    apiTokenPreview: apiToken ? `${apiToken.substring(0, 10)}...${apiToken.substring(apiToken.length - 5)}` : 'none'
                                });
                                
                                // Log full values for verification
                                console.log('✅ [ConnectivityStatusCell] FULL VALUES EXTRACTED (for verification):', {
                                    credentialName: connector.credentialName,
                                    connectorName: connector.connector,
                                    username: username || '(empty)',
                                    apiToken: apiToken ? `${apiToken.substring(0, 20)}...${apiToken.substring(apiToken.length - 10)}` : '(empty)',
                                    apiTokenLength: apiToken ? apiToken.length : 0,
                                    authenticationType: authType || '(empty)',
                                    source: 'credentialConnector',
                                    credentialConnectorFound: true
                                });
                            } else {
                                console.error('❌ [ConnectivityStatusCell] No matching connector found in credential:', {
                                    credentialName: connector.credentialName,
                                    connectorName: connector.connector,
                                    availableConnectors: credential.connectors.map((c: any) => c.connector)
                                });
                                throw new Error(`Credential "${connector.credentialName}" does not have connector "${connector.connector}". Please update the connector with a valid credential.`);
                            }
                        } else {
                            console.error('❌ [ConnectivityStatusCell] Credential found but no connectors array:', {
                                credentialName: connector.credentialName,
                                hasConnectors: !!(credential && credential.connectors),
                                connectorsLength: credential?.connectors?.length || 0
                            });
                            throw new Error(`Credential "${connector.credentialName}" has no connectors configured. Please update the connector with a valid credential.`);
                        }
                    } else {
                        console.error('❌ [ConnectivityStatusCell] No credentials found in localStorage for storage key:', storageKey);
                        throw new Error(`Credential "${connector.credentialName}" not found. It may have been deleted. Please update the connector with a valid credential name.`);
                    }
                } catch (error: any) {
                    console.error('❌ [ConnectivityStatusCell] Error loading credential from localStorage:', error);
                    // Re-throw credential validation errors so they fail the test
                    if (error?.message && (
                        error.message.includes('not found') || 
                        error.message.includes('deleted') ||
                        error.message.includes('no connectors') ||
                        error.message.includes('does not match')
                    )) {
                        throw error; // Re-throw to fail the test
                    }
                }
            } else {
                console.warn('⚠️ [ConnectivityStatusCell] Cannot load credentials - missing credentialName, accountId, or enterpriseId:', {
                    hasCredentialName: !!connector.credentialName,
                    hasAccountId: !!selectedAccountId,
                    hasEnterpriseId: !!selectedEnterpriseId
                });
            }

            // Validate that credential was found and has the required connector
            // For OAuth, we still need the credential to exist (even if no username/token)
            if (authType !== 'OAuth' && !foundCredentialConnector && connector.credentialName) {
                throw new Error(`Credential "${connector.credentialName}" not found or does not have connector "${connector.connector}". It may have been deleted. Please update the connector with a valid credential name.`);
            }
            
            // For OAuth, validate that credential exists and matches filters (even if connector details aren't needed)
            if (authType === 'OAuth' && connector.credentialName && !foundCredentialConnector) {
                // Check if credential exists and matches workstream/product/service
                try {
                    const LOCAL_STORAGE_CREDENTIALS_KEY = 'credentials_credentials_data';
                    const storageKey = `${LOCAL_STORAGE_CREDENTIALS_KEY}_${selectedAccountId}_${selectedEnterpriseId}`;
                    const stored = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) : null;
                    if (stored) {
                        const allCredentials: any[] = JSON.parse(stored);
                        const credential = allCredentials.find(
                            cred => cred.credentialName === connector.credentialName
                        );
                        if (!credential) {
                            throw new Error(`Credential "${connector.credentialName}" not found. It may have been deleted. Please update the connector with a valid credential name.`);
                        }
                        
                        // Validate that credential matches current workstream/product/service
                        const currentWorkstream = workstream || row.entity || '';
                        const currentProduct = product || row.product || '';
                        const currentService = service || row.service || '';
                        
                        const entityMatch = !currentWorkstream || !credential.entity || 
                            credential.entity.toLowerCase() === currentWorkstream.toLowerCase();
                        const productMatch = !currentProduct || !credential.product || 
                            credential.product.toLowerCase() === currentProduct.toLowerCase();
                        const serviceMatch = !currentService || !credential.service || 
                            credential.service.toLowerCase() === currentService.toLowerCase();
                        
                        if (!entityMatch || !productMatch || !serviceMatch) {
                            throw new Error(`Credential "${connector.credentialName}" does not match the current workstream/product/service combination. The credential's workstream/product/service may have been changed in Manage Credentials. Please update the connector with a valid credential name.`);
                        }
                    } else {
                        throw new Error(`Credential "${connector.credentialName}" not found. It may have been deleted. Please update the connector with a valid credential name.`);
                    }
                } catch (error: any) {
                    // Re-throw credential validation errors
                    if (error?.message && (
                        error.message.includes('not found') || 
                        error.message.includes('does not match')
                    )) {
                        throw error;
                    }
                }
            }

            // Build test connection payload
            // For GitHub Code connector, use githubAccountUrl; for others, use url
            const urlValue = connector.category === 'code' && connector.connector === 'GitHub'
                ? connector.githubAccountUrl || ''
                : connector.url || '';
            
            // Build test payload with only provided values (no hardcoded defaults)
            const testPayload: any = {
                connectorName: connector.connector,
                url: urlValue,
                credentialName: connector.credentialName,
            };
            
            // Add context parameters only if they exist (no hardcoded values)
            if (selectedAccountId) testPayload.accountId = selectedAccountId;
            if (selectedAccountName) testPayload.accountName = selectedAccountName;
            if (selectedEnterpriseId) testPayload.enterpriseId = selectedEnterpriseId;
            if (selectedEnterprise) testPayload.enterpriseName = selectedEnterprise;
            if (workstream || row.entity) testPayload.workstream = workstream || row.entity || '';
            if (product || row.product) testPayload.product = product || row.product || '';
            if (service || row.service) testPayload.service = service || row.service || '';

            // Add authentication details based on authentication type
            // For JIRA: Username and API Key (API Token)
            if (authType === 'Username and API Key' || (!authType && username && apiToken)) {
                testPayload.username = username || connector.username || '';
                testPayload.apiToken = apiToken || connector.apiKey || ''; // JIRA uses API Token, not API Key
            } else if (authType === 'Username and Token' || (!authType && username && apiToken)) {
                // For GitHub: Username and Token (Personal Access Token)
                testPayload.username = username || connector.username || '';
                testPayload.personalAccessToken = apiToken || connector.personalAccessToken || '';
            } else if (authType === 'Personal Access Token' || (!authType && apiToken && !username)) {
                testPayload.personalAccessToken = apiToken || connector.personalAccessToken || '';
            } else if (authType === 'OAuth') {
                // For OAuth authentication, include OAuth status
                testPayload.authenticationType = 'OAuth';
                console.log('🔑 [ConnectivityStatusCell] Using OAuth authentication for credential:', connector.credentialName);
            }
            
            console.log('🧪 [ConnectivityStatusCell] Sending test request:', {
                connector: connector.connector,
                url: urlValue,
                credentialName: connector.credentialName,
                authenticationType: authType,
                accountId: testPayload.accountId,
                accountName: testPayload.accountName,
                enterpriseId: testPayload.enterpriseId,
                enterpriseName: testPayload.enterpriseName,
                workstream: testPayload.workstream,
                product: testPayload.product,
                service: testPayload.service,
                hasUsername: !!testPayload.username,
                hasApiToken: !!testPayload.apiToken,
                hasPersonalAccessToken: !!testPayload.personalAccessToken,
                username: testPayload.username ? `${testPayload.username.substring(0, 5)}...` : 'none',
                apiTokenLength: testPayload.apiToken ? testPayload.apiToken.length : 0,
                apiTokenPreview: testPayload.apiToken ? `${testPayload.apiToken.substring(0, 10)}...${testPayload.apiToken.substring(testPayload.apiToken.length - 5)}` : 'none',
                payloadKeys: Object.keys(testPayload)
            });
            
            // Log full payload values for verification
            console.log('📤 [ConnectivityStatusCell] FULL PAYLOAD VALUES (for verification):', {
                connectorName: testPayload.connectorName,
                url: testPayload.url,
                credentialName: testPayload.credentialName,
                accountId: testPayload.accountId,
                accountName: testPayload.accountName,
                enterpriseId: testPayload.enterpriseId,
                enterpriseName: testPayload.enterpriseName,
                workstream: testPayload.workstream,
                product: testPayload.product,
                service: testPayload.service,
                username: testPayload.username || '(empty)',
                apiToken: testPayload.apiToken ? `[MASKED - Length: ${testPayload.apiToken.length}]` : '(empty)',
                apiTokenLength: testPayload.apiToken ? testPayload.apiToken.length : 0,
                personalAccessToken: testPayload.personalAccessToken ? `[MASKED - Length: ${testPayload.personalAccessToken.length}]` : '(empty)',
                authenticationType: authType || '(empty)',
                fullPayload: {
                    ...testPayload,
                    // Mask sensitive values in full payload log
                    apiToken: testPayload.apiToken ? `[MASKED - Length: ${testPayload.apiToken.length}]` : undefined,
                    personalAccessToken: testPayload.personalAccessToken ? `[MASKED - Length: ${testPayload.personalAccessToken.length}]` : undefined
                }
            });
            
            // Validate that we have the required fields (skip validation for OAuth as it's handled above)
            if (authType !== 'OAuth' && !testPayload.username && !testPayload.apiToken && !testPayload.personalAccessToken) {
                throw new Error('Missing authentication credentials. Please ensure the credential contains username and API token.');
            }

            // Call connectivity test API endpoint
            // For JIRA: /api/connectors/jira/test-connection
            const connectorNameLower = connector.connector.toLowerCase().replace(/\s+/g, '-');
            const response = await api.post<{success?: boolean; status?: string; connected?: boolean; message?: string}>(
                `/api/connectors/${connectorNameLower}/test-connection`,
                testPayload
            );

            console.log('🧪 [ConnectivityStatusCell] Response received:', response);

            // Ensure minimum test duration has passed
            const elapsedTime = Date.now() - testStartTime;
            const remainingTime = Math.max(0, minTestDuration - elapsedTime);
            
            if (remainingTime > 0) {
                await new Promise(resolve => setTimeout(resolve, remainingTime));
            }

            // Check if response indicates success
            const success = response && (response.success || response.status === 'success' || response.connected);
            const timestamp = Date.now();
            setTestStatus(success ? 'success' : 'failed');
            setTestTime(new Date(timestamp));
            
            console.log('✅ [ConnectivityStatusCell] Test completed:', {
                success,
                status: success ? 'success' : 'failed',
                timestamp: new Date(timestamp).toISOString()
            });

            // Store test result in localStorage
            try {
                const STORAGE_KEY = `connector_test_results_${selectedAccountId}_${selectedEnterpriseId}`;
                const stored = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
                const results: Record<string, TestResult> = stored ? JSON.parse(stored) : {};
                results[rowId] = {
                    status: success ? 'success' : 'failed',
                    timestamp: timestamp
                };
                if (typeof window !== 'undefined') {
                    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
                }
            } catch (error) {
                console.error('❌ [ConnectivityStatusCell] Error saving test result:', error);
            }
        } catch (error) {
            // Ensure minimum test duration even on error
            const elapsedTime = Date.now() - testStartTime;
            const remainingTime = Math.max(0, minTestDuration - elapsedTime);
            
            if (remainingTime > 0) {
                await new Promise(resolve => setTimeout(resolve, remainingTime));
            }

            const timestamp = Date.now();
            setTestStatus('failed');
            setTestTime(new Date(timestamp));

            // Store failed test result in localStorage
            try {
                const STORAGE_KEY = `connector_test_results_${selectedAccountId}_${selectedEnterpriseId}`;
                const stored = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
                const results: Record<string, TestResult> = stored ? JSON.parse(stored) : {};
                results[rowId] = {
                    status: 'failed',
                    timestamp: timestamp
                };
                if (typeof window !== 'undefined') {
                    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
                }
            } catch (error) {
                console.error('❌ [ConnectivityStatusCell] Error saving test result:', error);
            }

            console.error('Connectivity test failed:', error);
        } finally {
            setIsTesting(false);
        }
    };

    // Calculate build count from connectors array
    const buildCount = row.connectors?.length || 0;
    
    return (
        <div className="flex items-center w-full px-1">
            {/* Build count with icon */}
            <div className="flex items-center gap-1 flex-shrink-0 mr-2">
                <Package className="w-4 h-4 text-slate-600" />
                <span className="text-base font-bold text-slate-800">
                    {buildCount}
                </span>
            </div>
            
            {/* Separation bar */}
            <div className="h-4 w-px bg-slate-300 flex-shrink-0 mr-2" />
            
            {/* + Button to open BuildDetailPanel */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    console.log('🔵 [ConnectivityStatusCell] Plus button clicked next to build count, onOpenBuildDetail:', !!onOpenBuildDetail, 'row:', row);
                    if (onOpenBuildDetail) {
                        console.log('🔵 [ConnectivityStatusCell] Calling onOpenBuildDetail with row:', row);
                        onOpenBuildDetail(row);
                    } else {
                        console.warn('⚠️ [ConnectivityStatusCell] onOpenBuildDetail is not defined!');
                    }
                }}
                className="flex items-center justify-center w-6 h-6 rounded-md bg-blue-100 hover:bg-blue-200 border border-blue-300 text-blue-600 transition-colors duration-150 flex-shrink-0 cursor-pointer"
                title="Open Build Detail Panel"
            >
                <Plus className="w-4 h-4" />
            </button>
        </div>
    );
}

interface BuildsTableProps {
    rows: BuildRow[];
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    title?: string;
    groupByExternal?: 'none' | 'connectorName' | 'description' | 'entity' | 'pipeline';
    onGroupByChange?: (
        g: 'none' | 'connectorName' | 'description' | 'entity' | 'pipeline',
    ) => void;
    hideControls?: boolean;
    visibleColumns?: Array<
        | 'connectorName'
        | 'description'
        | 'entity'
        | 'pipeline'
        | 'status'
        | 'scope'
        | 'connectivityStatus'
        | 'actions'
    >;
    highlightQuery?: string;
    customColumnLabels?: Record<string, string>;
    enableDropdownChips?: boolean;
    dropdownOptions?: {
        connectorNames?: Array<{id: string; name: string}>;
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
        type: 'connectorNames' | 'descriptions' | 'entities' | 'products' | 'services' | 'scope',
        action: 'update' | 'delete',
        oldName: string,
        newName?: string,
    ) => Promise<void>;
    onNewItemCreated?: (
        type: 'connectorNames' | 'descriptions' | 'entities' | 'products' | 'services' | 'scope',
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
    onOpenAddressModal?: (row: BuildRow) => void; // Callback to open address modal
    onOpenUserGroupModal?: (row: BuildRow) => void; // Callback to open user group modal
    onOpenScopeModal?: (row: BuildRow) => void; // Callback to open scope config modal
    onShowStartDateProtectionModal?: (message: string) => void; // Callback to show start date protection modal
    onDuplicateDetected?: (message: string) => void; // Callback to show duplicate entry modal
    onOpenBuildDetail?: (row: BuildRow) => void; // Callback to open build detail panel in split view
}

function SortableBuildRow({
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
    onOpenBuildDetail,
}: {
    row: BuildRow;
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
    onUpdateField: (rowId: string, key: keyof BuildRow, value: any) => void;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onStartFill: (rowId: string, col: keyof BuildRow, value: string) => void;
    inFillRange: boolean;
    pinFirst?: boolean;
    firstColWidth?: string;
    hideRowExpansion?: boolean;
    enableDropdownChips?: boolean;
    shouldShowHorizontalScroll?: boolean;
    onDropdownOptionUpdate?: (
        type: 'connectorNames' | 'descriptions' | 'entities' | 'products' | 'services' | 'scope',
        action: 'update' | 'delete',
        oldName: string,
        newName?: string,
    ) => Promise<void>;
    onNewItemCreated?: (
        type: 'connectorNames' | 'descriptions' | 'entities' | 'products' | 'services' | 'scope',
        item: {id: string; name: string},
    ) => void;
    isCellMissing?: (rowId: string, field: string) => boolean;
    compressingRowId?: string | null;
    foldingRowId?: string | null;
    allRows?: BuildRow[];
    onDeleteClick?: (rowId: string) => void;
    onOpenAddressModal?: (row: BuildRow) => void;
    onOpenUserGroupModal?: (row: BuildRow) => void;
    onOpenScopeModal?: (row: BuildRow) => void;
    onShowStartDateProtectionModal?: (message: string) => void;
    onShowGlobalValidationModal?: (rowId: string, field: string, message: string) => void;
    selectedEnterprise?: string;
    selectedEnterpriseId?: string;
    selectedAccountId?: string;
    selectedAccountName?: string;
    onOpenBuildDetail?: (row: BuildRow) => void;
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
            'connectorName',
            'description',
            'entity',
            'pipeline',
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
                        // For pipeline field, ensure dropdown opens on focus
                        if (nextCol === 'pipeline') {
                            nextInput.dispatchEvent(new Event('focus', { bubbles: true }));
                        }
                    } else {
                        // Try to find a button (for dropdowns like SimpleDropdown)
                        const nextButton = document.querySelector(
                            `[data-row-id="${row.id}"][data-col="${nextCol}"] button`,
                        ) as HTMLButtonElement;
                        
                        if (nextButton) {
                            nextButton.focus();
                        } else {
                            // For pipeline field, try to find the chip and click it to open dropdown
                            if (nextCol === 'pipeline') {
                                const pipelineChip = document.querySelector(
                                    `[data-row-id="${row.id}"][data-col="${nextCol}"] span[tabindex="0"]`
                                ) as HTMLElement;
                                if (pipelineChip) {
                                    pipelineChip.click();
                                    setTimeout(() => {
                                        const pipelineInput = document.querySelector(
                                            `[data-row-id="${row.id}"][data-col="${nextCol}"] input`
                                        ) as HTMLInputElement;
                                        if (pipelineInput) {
                                            pipelineInput.focus();
                                        }
                                    }, 50);
                                    return;
                                }
                            }
                            
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
                                        // For pipeline field, ensure dropdown opens
                                        if (nextCol === 'pipeline') {
                                            nextInput.dispatchEvent(new Event('focus', { bubbles: true }));
                                        }
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
            className={`w-full grid items-center gap-0 border rounded-lg transition-all duration-200 ease-in-out ${isExpanded ? '' : 'h-11'} mb-1 pb-1 ${
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
                overflow: isExpanded ? 'visible' : 'hidden',
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
            {cols.includes('connectorName') && (
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
                                className={`inline-flex ${isExpanded ? 'font-bold' : ''}`}
                            >
                                <ChevronRight
                                    size={16}
                                    strokeWidth={isExpanded ? 3 : 2}
                                />
                            </motion.span>
                        </button>
                    )}
                    <div
                        className='relative flex items-center text-slate-700 font-normal text-[12px] w-full flex-1'
                        data-row-id={row.id}
                        data-col='connectorName'
                        style={{width: '100%', minWidth: '100%', maxWidth: '100%', overflow: 'visible'}}
                    >
                        <EditableChipInput
                            value={row.connectorName || ''}
                            onCommit={(v) =>
                                onUpdateField(row.id, 'connectorName' as any, v)
                            }
                            onRemove={() => onUpdateField(row.id, 'connectorName' as any, '')}
                            className='text-[12px]'
                            dataAttr={`connectorName-${row.id}`}
                            isError={isCellMissing(row.id, 'connectorName')}
                            placeholder=''
                            {...createTabNavigation('connectorName')}
                        />
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
                                placeholder='Enter workstream'
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
                                placeholder='Enter workstream'
                                {...createTabNavigation('entity')}
                            />
                        )}
                    </div>
                </div>
            )}

            {/* Pipeline Column */}
            {cols.includes('pipeline') && (
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
                        data-col='pipeline'
                        style={{width: '100%', overflow: 'visible'}}
                    >
                        {enableDropdownChips ? (
                            <AsyncChipSelectPipeline
                                value={row.pipeline || ''}
                                onChange={(v) => {
                                    onUpdateField(row.id, 'pipeline' as any, v || '');
                                }}
                                placeholder=''
                                isError={isCellMissing(row.id, 'pipeline') || !!((fieldValidationErrors as any)[row.id] && (fieldValidationErrors as any)[row.id].pipeline)}
                                selectedEnterprise={selectedEnterprise}
                                selectedAccountId={selectedAccountId}
                                selectedAccountName={selectedAccountName}
                                selectedEnterpriseId={selectedEnterpriseId}
                                workstream={row.entity}
                                {...createTabNavigation('pipeline')}
                            />
                        ) : (
                            <InlineEditableText
                                value={row.pipeline || ''}
                                onCommit={(v) =>
                                    onUpdateField(row.id, 'pipeline' as any, v)
                                }
                                className='text-[12px]'
                                dataAttr={`pipeline-${row.id}`}
                                placeholder=''
                                {...createTabNavigation('pipeline')}
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
                        className='flex items-center justify-center text-slate-700 font-normal text-[12px] w-full flex-1'
                        data-row-id={row.id}
                        data-col='status'
                        style={{width: '100%', overflow: 'visible'}}
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
                            }}
                            title={`Click to toggle status: ${row.status === 'ACTIVE' ? 'Active' : 'Inactive'}`}
                        >
                            {row.status === 'ACTIVE' ? 'Active' : row.status === 'INACTIVE' ? 'Inactive' : 'Active'}
                        </button>
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
                            title={`Configure integrations for ${row.connectorName || 'this job'}`}
                            tabIndex={-1}
                        >
                            {/* CPI icon */}
                            <img 
                                src="/images/logos/CPI icon.png" 
                                alt="CPI Icon" 
                                className="w-4 h-4 object-contain"
                            />
                        </button>
                    </div>
                </div>
            )}

            {/* Connectivity Status Column */}
            {cols.includes('connectivityStatus') && (
                <div
                    className={`group flex items-center gap-1.5 border-r border-slate-200 px-2 py-1 w-full overflow-visible`}
                    style={{
                        backgroundColor: isSelected 
                            ? 'rgb(239 246 255)' // bg-blue-50
                            : (index % 2 === 0 ? 'white' : 'rgb(248 250 252 / 0.7)') // bg-white or bg-slate-50/70
                    }}
                >
                    <div
                        className='flex items-center justify-start text-slate-700 font-normal text-[12px] w-full flex-1'
                        data-row-id={row.id}
                        data-col='connectivityStatus'
                        style={{width: '100%', overflow: 'visible'}}
                    >
                        <ConnectivityStatusCell 
                            key={`${row.id}-${row.connectors?.map(c => `${c.connector}-${c.credentialName}`).join('-') || 'no-connectors'}`}
                            connectorName={row.connectorName || 'Connector'} 
                            rowId={row.id}
                            row={row}
                            selectedAccountId={selectedAccountId}
                            selectedAccountName={selectedAccountName}
                            selectedEnterpriseId={selectedEnterpriseId}
                            selectedEnterprise={selectedEnterprise}
                            workstream={row.entity}
                            product={row.product}
                            service={row.service}
                            onOpenBuildDetail={onOpenBuildDetail}
                        />
                    </div>
                </div>
            )}

            {/* Expanded Content - Pipeline Stages */}
            {(() => {
                const shouldShow = !hideRowExpansion && isExpanded && expandedContent;
                return shouldShow ? (
                    <motion.div
                        className='col-span-full w-full'
                        style={{ gridColumn: '1 / -1' }}
                        initial={{opacity: 0, y: -4}}
                        animate={{opacity: 1, y: 0}}
                        transition={{duration: 0.18, ease: [0.22, 1, 0.36, 1]}}
                    >
                        {expandedContent}
                    </motion.div>
                ) : null;
            })()}

            {/* actions column removed */}
            {/* trailing add row removed; fill handle removed */}
        </div>
    );
}

// Pipeline Stages SubRow Component
function PipelineStagesSubRow({
    stagesData,
    rowId,
    buildRow,
    selectedAccountId = '',
    selectedEnterpriseId = '',
    selectedAccountName = '',
    selectedEnterprise = '',
    initialPipelineStagesState,
    onStateChange,
}: {
    stagesData: {
        nodes: Array<{
            nodeName: string;
            nodeType: string;
            stages: Array<{
                name: string;
                type: string;
            }>;
        }>;
    };
    rowId: string;
    buildRow?: BuildRow;
    selectedAccountId?: string;
    selectedEnterpriseId?: string;
    selectedAccountName?: string;
    selectedEnterprise?: string;
    initialPipelineStagesState?: {
        selectedConnectors: Record<string, string>;
        selectedEnvironments: Record<string, string>;
        selectedRepositoryUrls: Record<string, string>;
        connectorUrlTypes: Record<string, string>;
        connectorRepositoryUrls: Record<string, string>;
        selectedBranches: Record<string, string>;
    };
    onStateChange?: (state: {
        selectedConnectors: Record<string, string>;
        selectedEnvironments: Record<string, string>;
        selectedRepositoryUrls: Record<string, string>;
        connectorUrlTypes: Record<string, string>;
        connectorRepositoryUrls: Record<string, string>;
        selectedBranches: Record<string, string>;
    }) => void;
}) {
    // Initialize state from saved data if available
    const [selectedConnectors, setSelectedConnectors] = useState<Record<string, string>>(
        initialPipelineStagesState?.selectedConnectors || {}
    );
    const [selectedEnvironments, setSelectedEnvironments] = useState<Record<string, string>>(
        initialPipelineStagesState?.selectedEnvironments || {}
    );
    const [githubUrls, setGithubUrls] = useState<Record<string, string[]>>({});
    const [selectedRepositoryUrls, setSelectedRepositoryUrls] = useState<Record<string, string>>(
        initialPipelineStagesState?.selectedRepositoryUrls || {}
    );
    const [connectorUrlTypes, setConnectorUrlTypes] = useState<Record<string, string>>(
        initialPipelineStagesState?.connectorUrlTypes || {}
    ); // Store URL Type per connector
    const [connectorRepositoryUrls, setConnectorRepositoryUrls] = useState<Record<string, string>>(
        initialPipelineStagesState?.connectorRepositoryUrls || {}
    ); // Store Repository URL per connector
    const [githubBranches, setGithubBranches] = useState<Record<string, Array<{value: string; label: string}>>>({}); // Store branches per stage
    const [loadingBranches, setLoadingBranches] = useState<Record<string, boolean>>({}); // Loading state for branches
    const [selectedBranches, setSelectedBranches] = useState<Record<string, string>>(
        initialPipelineStagesState?.selectedBranches || {}
    ); // Selected branch per stage
    const [loadingUrls, setLoadingUrls] = useState<Record<string, boolean>>({});
    const [isConnectorModalOpen, setIsConnectorModalOpen] = useState(false);
    const [isEnvironmentModalOpen, setIsEnvironmentModalOpen] = useState(false);
    const [selectedStageForConnector, setSelectedStageForConnector] = useState<{stageKey: string; category: string; connector: string} | null>(null);
    const [selectedStageForEnvironment, setSelectedStageForEnvironment] = useState<{stageKey: string; category: string; connector: string} | null>(null);
    const [connectorRefreshKey, setConnectorRefreshKey] = useState(0);
    const [environmentRefreshKey, setEnvironmentRefreshKey] = useState(0);

    // Use refs to track previous values and prevent infinite loops
    const prevInitialStateRef = useRef<string | null>(null);
    const prevStateRef = useRef<string | null>(null);
    const onStateChangeRef = useRef(onStateChange);
    const isInitialMountRef = useRef(true);
    
    // Update ref when onStateChange changes
    useEffect(() => {
        onStateChangeRef.current = onStateChange;
    }, [onStateChange]);

    // Sync local state with initialPipelineStagesState when it changes (e.g., when row is reopened)
    // Only update if the state actually changed (deep comparison)
    useEffect(() => {
        const currentStateStr = initialPipelineStagesState ? JSON.stringify(initialPipelineStagesState) : null;
        // Only sync if the state actually changed (and it's not the initial mount with no saved state)
        if (currentStateStr !== prevInitialStateRef.current) {
            prevInitialStateRef.current = currentStateStr;
            if (initialPipelineStagesState) {
                setSelectedConnectors(initialPipelineStagesState.selectedConnectors || {});
                setSelectedEnvironments(initialPipelineStagesState.selectedEnvironments || {});
                setSelectedRepositoryUrls(initialPipelineStagesState.selectedRepositoryUrls || {});
                setConnectorUrlTypes(initialPipelineStagesState.connectorUrlTypes || {});
                setConnectorRepositoryUrls(initialPipelineStagesState.connectorRepositoryUrls || {});
                setSelectedBranches(initialPipelineStagesState.selectedBranches || {});
            }
        }
    }, [initialPipelineStagesState]);

    // Notify parent of state changes for saving
    // Only notify if the state actually changed (deep comparison) and skip initial mount if no saved state
    useEffect(() => {
        const stateToSave = {
            selectedConnectors,
            selectedEnvironments,
            selectedRepositoryUrls,
            connectorUrlTypes,
            connectorRepositoryUrls,
            selectedBranches,
        };
        
        const currentStateStr = JSON.stringify(stateToSave);
        
        // On initial mount, if there's no saved state, don't notify (to prevent loop)
        if (isInitialMountRef.current && !initialPipelineStagesState) {
            prevStateRef.current = currentStateStr;
            isInitialMountRef.current = false;
            return;
        }
        
        // Mark that initial mount is complete
        if (isInitialMountRef.current) {
            isInitialMountRef.current = false;
        }
        
        // Only notify if the state actually changed
        if (currentStateStr !== prevStateRef.current && onStateChangeRef.current) {
            prevStateRef.current = currentStateStr;
            onStateChangeRef.current(stateToSave);
        }
    }, [selectedConnectors, selectedEnvironments, selectedRepositoryUrls, connectorUrlTypes, connectorRepositoryUrls, selectedBranches, rowId]);

    // Map stage type to category
    const getCategoryFromStageType = (stageType: string): string => {
        if (stageType.startsWith('code_')) return 'Code';
        if (stageType.startsWith('build_')) return 'Build';
        if (stageType.startsWith('test_')) return 'Test';
        if (stageType.startsWith('deploy_')) return 'Deploy';
        if (stageType.startsWith('plan_')) return 'Plan';
        if (stageType.startsWith('release_')) return 'Release';
        return 'Other';
    };

    // Extract tool name from stage type (e.g., "code_github" -> "GitHub")
    const getToolNameFromStageType = (stageType: string): string => {
        const parts = stageType.split('_');
        if (parts.length > 1) {
            const toolPart = parts.slice(1).join('_');
            // Capitalize first letter and handle camelCase/snake_case
            return toolPart
                .split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
        }
        return stageType;
    };

    // Get connector for a stage based on category
    const getConnectorForStage = (stageType: string): { category: string; connector: string } | null => {
        const category = getCategoryFromStageType(stageType);
        
        // First try to get from build row connectors
        if (buildRow?.connectors && buildRow.connectors.length > 0) {
            const connector = buildRow.connectors.find(c => c.category?.toLowerCase() === category.toLowerCase());
            if (connector && connector.connector) {
                return {
                    category: category,
                    connector: connector.connector
                };
            }
        }
        
        // Fallback: extract tool name from stage type
        const toolName = getToolNameFromStageType(stageType);
        if (toolName && toolName !== stageType) {
            return {
                category: category,
                connector: toolName
            };
        }
        
        return null;
    };

    // Load connectors filtered by account, enterprise, workstream, product, service
    const loadConnectors = useCallback((category: string, connector: string): Array<{value: string; label: string}> => {
        // Use connectorRefreshKey to force refresh when connectors are added
        void connectorRefreshKey;
        if (!selectedAccountId || !selectedEnterpriseId) {
            return [];
        }

        try {
            const LOCAL_STORAGE_CONNECTORS_KEY = 'connectors_connectors_data';
            const storageKey = `${LOCAL_STORAGE_CONNECTORS_KEY}_${selectedAccountId}_${selectedEnterpriseId}`;
            const stored = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) : null;
            
            if (!stored) {
                return [];
            }

            const allConnectors: any[] = JSON.parse(stored);
            const workstream = buildRow?.entity || '';
            const product = buildRow?.product || '';
            const service = buildRow?.service || '';

            // Filter connectors by account, enterprise, entity (workstream), product, service, and connector/category
            const filteredConnectors = allConnectors.filter((connectorRow) => {
                const entityMatch = !workstream || !connectorRow.entity || 
                    connectorRow.entity.toLowerCase() === workstream.toLowerCase();
                const productMatch = !product || !connectorRow.product || 
                    connectorRow.product.toLowerCase() === product.toLowerCase();
                const serviceMatch = !service || !connectorRow.service || 
                    connectorRow.service.toLowerCase() === service.toLowerCase();

                // Match connector/category - show connectors that have a matching connector entry
                // IMPORTANT: Only show connector names that have at least one connector entry matching the category and connector
                let connectorMatch = false;
                if (connectorRow.connectors && connectorRow.connectors.length > 0) {
                    connectorMatch = connectorRow.connectors.some((c: any) => {
                        // Must match category exactly
                        const matchesCategory = c.category && c.category.toLowerCase() === category.toLowerCase();
                        if (!matchesCategory) {
                            return false; // Category must match
                        }
                        
                        // If connector is specified, it must also match
                        if (connector && connector.trim()) {
                            const matchesConnector = c.connector && (
                                c.connector.toLowerCase() === connector.toLowerCase() ||
                                c.connector.toLowerCase().includes(connector.toLowerCase()) ||
                                connector.toLowerCase().includes(c.connector.toLowerCase())
                            );
                            return matchesConnector; // Both category and connector must match
                        }
                        // If no connector specified, just match by category
                        return true; // Category already matched above
                    });
                }
                // If connector row has no connectors array, don't show it (connectorMatch remains false)
                // This ensures we only show connector names that have the correct category and connector configured

                return entityMatch && productMatch && serviceMatch && connectorMatch;
            });

            return filteredConnectors.map(conn => ({
                value: conn.connectorName || '',
                label: conn.connectorName || ''
            }));
        } catch (error) {
            console.error('❌ [PipelineStagesSubRow] Error loading connectors:', error);
            return [];
        }
    }, [selectedAccountId, selectedEnterpriseId, buildRow, connectorRefreshKey]);

    // Load environments from localStorage for Deploy category
    const loadEnvironments = useCallback((): Array<{value: string; label: string}> => {
        try {
            if (!selectedAccountId || !selectedEnterpriseId) {
                return [];
            }

            const LOCAL_STORAGE_ENVIRONMENTS_KEY = 'environments_environments_data';
            const storageKey = `${LOCAL_STORAGE_ENVIRONMENTS_KEY}_${selectedAccountId}_${selectedEnterpriseId}`;
            const stored = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) : null;
            
            if (!stored) {
                return [];
            }

            const allEnvironments: EnvironmentRow[] = JSON.parse(stored);
            const workstream = buildRow?.entity || '';
            const product = buildRow?.product || '';
            const service = buildRow?.service || '';

            // Filter environments by account, enterprise, entity (workstream), product, and service
            const filteredEnvironments = allEnvironments.filter((envRow) => {
                const entityMatch = !workstream || !envRow.entity || 
                    envRow.entity.toLowerCase() === workstream.toLowerCase();
                const productMatch = !product || !envRow.product || 
                    envRow.product.toLowerCase() === product.toLowerCase();
                const serviceMatch = !service || !envRow.service || 
                    envRow.service.toLowerCase() === service.toLowerCase();

                return entityMatch && productMatch && serviceMatch;
            });

            return filteredEnvironments.map(env => ({
                value: env.connectorName || '',
                label: env.connectorName || ''
            }));
        } catch (error) {
            console.error('❌ [PipelineStagesSubRow] Error loading environments:', error);
            return [];
        }
    }, [selectedAccountId, selectedEnterpriseId, buildRow, environmentRefreshKey]);

    // Fetch GitHub repos based on connector
    const fetchGitHubRepos = useCallback(async (connectorName: string, stageKey: string) => {
        if (!connectorName || !selectedAccountId || !selectedEnterpriseId) {
            console.warn('⚠️ [fetchGitHubRepos] Missing required parameters:', { connectorName, selectedAccountId, selectedEnterpriseId });
            return;
        }

        console.log('🚀 [fetchGitHubRepos] Starting fetch for connector:', connectorName, 'stageKey:', stageKey);
        setLoadingUrls(prev => ({ ...prev, [stageKey]: true }));

        try {
            const LOCAL_STORAGE_CONNECTORS_KEY = 'connectors_connectors_data';
            const storageKey = `${LOCAL_STORAGE_CONNECTORS_KEY}_${selectedAccountId}_${selectedEnterpriseId}`;
            const stored = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) : null;
            
            if (!stored) {
                setGithubUrls(prev => ({ ...prev, [stageKey]: [] }));
                setLoadingUrls(prev => ({ ...prev, [stageKey]: false }));
                return;
            }

            const allConnectors: any[] = JSON.parse(stored);
            const connectorRow = allConnectors.find(conn => conn.connectorName === connectorName);
            
            if (!connectorRow || !connectorRow.connectors || connectorRow.connectors.length === 0) {
                setGithubUrls(prev => ({ ...prev, [stageKey]: [] }));
                setLoadingUrls(prev => ({ ...prev, [stageKey]: false }));
                return;
            }

            // Find GitHub connector
            const githubConnector = connectorRow.connectors.find((c: any) => 
                c.connector?.toLowerCase() === 'github' && c.category?.toLowerCase() === 'code'
            );

            if (!githubConnector) {
                setGithubUrls(prev => ({ ...prev, [stageKey]: [] }));
                setLoadingUrls(prev => ({ ...prev, [stageKey]: false }));
                return;
            }

            // Store URL Type and Repository URL for this connector
            const urlType = githubConnector.urlType || 'Account';
            setConnectorUrlTypes(prev => ({ ...prev, [connectorName]: urlType }));
            
            if (urlType === 'Repository' && githubConnector.url) {
                // If Repository type, store the repository URL directly - NO API CALL
                setConnectorRepositoryUrls(prev => ({ ...prev, [connectorName]: githubConnector.url }));
                setGithubUrls(prev => ({ ...prev, [stageKey]: [] }));
                setLoadingUrls(prev => ({ ...prev, [stageKey]: false }));
                return;
            }

            // Only proceed with API call if URL Type is "Account"
            if (urlType !== 'Account') {
                setGithubUrls(prev => ({ ...prev, [stageKey]: [] }));
                setLoadingUrls(prev => ({ ...prev, [stageKey]: false }));
                return;
            }

            // For Account type only, fetch repos from GitHub API
            // Get authentication type and credentials
            const authType = githubConnector.authenticationType || '';
            let accessToken = '';
            let githubAccountName = '';

            // Extract GitHub account name from URL
            if (githubConnector.githubAccountUrl) {
                const urlMatch = githubConnector.githubAccountUrl.match(/github\.com\/([^\/]+)/);
                if (urlMatch) {
                    githubAccountName = urlMatch[1];
                }
            }
            
            // If no account name found, cannot fetch repos
            if (!githubAccountName) {
                setGithubUrls(prev => ({ ...prev, [stageKey]: [] }));
                setLoadingUrls(prev => ({ ...prev, [stageKey]: false }));
                return;
            }

            // If connector has credentialName, try to fetch from credentials first
            if (githubConnector.credentialName) {
                try {
                    const LOCAL_STORAGE_CREDENTIALS_KEY = 'credentials_credentials_data';
                    const credStorageKey = `${LOCAL_STORAGE_CREDENTIALS_KEY}_${selectedAccountId}_${selectedEnterpriseId}`;
                    const credStored = typeof window !== 'undefined' ? window.localStorage.getItem(credStorageKey) : null;
                    
                    if (credStored) {
                        const allCredentials: any[] = JSON.parse(credStored);
                        const credential = allCredentials.find(cred => cred.credentialName === githubConnector.credentialName);
                        
                        if (credential && credential.connectors && credential.connectors.length > 0) {
                            const credGitHubConnector = credential.connectors.find((c: any) => 
                                c.connector?.toLowerCase() === 'github' && c.category?.toLowerCase() === 'code'
                            );
                            
                            if (credGitHubConnector) {
                                // Use credential's connector details
                                const credAuthType = credGitHubConnector.authenticationType || '';
                                console.log('🔑 [fetchGitHubRepos] Using credential authentication type:', credAuthType, 'for credential:', githubConnector.credentialName);
                                
                                if (credAuthType === 'OAuth') {
                                    try {
                                        // Extract username from githubAccountUrl
                                        let username = '';
                                        if (githubConnector.githubAccountUrl) {
                                            const urlMatch = githubConnector.githubAccountUrl.match(/github\.com\/([^\/]+)/);
                                            if (urlMatch) {
                                                username = urlMatch[1];
                                            }
                                        }
                                        
                                        if (!username) {
                                            console.error('❌ [fetchGitHubRepos] Cannot extract username from GitHub Account URL:', githubConnector.githubAccountUrl);
                                            setGithubUrls(prev => ({ ...prev, [stageKey]: [] }));
                                            setLoadingUrls(prev => ({ ...prev, [stageKey]: false }));
                                            return;
                                        }
                                        
                                        console.log('🔑 [fetchGitHubRepos] Making OAuth API call with credential:', githubConnector.credentialName, 'username:', username);
                                        const apiUrl = `/api/github/repos?credentialName=${encodeURIComponent(githubConnector.credentialName)}&username=${encodeURIComponent(username)}&accountId=${selectedAccountId}&enterpriseId=${selectedEnterpriseId}`;
                                        console.log('🔑 [fetchGitHubRepos] API URL:', apiUrl);
                                        
                                        const response = await api.get(apiUrl);
                                        if (response && Array.isArray(response)) {
                                            // Extract clone_url from response as per user requirement
                                            const repos = response.map((repo: any) => repo.clone_url || '').filter(Boolean);
                                            console.log('✅ [fetchGitHubRepos] Fetched', repos.length, 'repositories via OAuth');
                                            setGithubUrls(prev => ({ ...prev, [stageKey]: repos }));
                                            setLoadingUrls(prev => ({ ...prev, [stageKey]: false }));
                                            return;
                                        } else {
                                            console.warn('⚠️ [fetchGitHubRepos] Invalid response format from OAuth API:', response);
                                        }
                                    } catch (error: any) {
                                        console.error('❌ [fetchGitHubRepos] Error fetching GitHub repos from credential (OAuth):', error);
                                        
                                        // Check if it's a 404 error (endpoint not implemented)
                                        if (error.message && error.message.includes('404')) {
                                            console.error('❌ [fetchGitHubRepos] API endpoint /api/github/repos is not implemented on backend');
                                            console.error('❌ [fetchGitHubRepos] Backend needs to implement endpoint that retrieves OAuth token and fetches repos from GitHub API');
                                            console.error('❌ [fetchGitHubRepos] See BACKEND_GITHUB_REPOS_API_IMPLEMENTATION.md for implementation guide');
                                        } else {
                                            console.error('❌ [fetchGitHubRepos] Error details:', error.message || error);
                                        }
                                        
                                        setGithubUrls(prev => ({ ...prev, [stageKey]: [] }));
                                        setLoadingUrls(prev => ({ ...prev, [stageKey]: false }));
                                    }
                                } else if (credAuthType === 'Username and Token' && credGitHubConnector.personalAccessToken) {
                                    const token = credGitHubConnector.personalAccessToken;
                                    // Use username from credential first, fallback to extracting from githubAccountUrl
                                    let username = credGitHubConnector.username || '';
                                    if (!username && githubConnector.githubAccountUrl) {
                                        const urlMatch = githubConnector.githubAccountUrl.match(/github\.com\/([^\/]+)/);
                                        if (urlMatch) {
                                            username = urlMatch[1];
                                        }
                                    }
                                    
                                    if (token && username) {
                                        try {
                                            console.log('🔑 [fetchGitHubRepos] Making PAT API call for username:', username, 'from credential:', githubConnector.credentialName);
                                            const response = await fetch(`https://api.github.com/users/${username}/repos`, {
                                                headers: {
                                                    'Authorization': `token ${token}`,
                                                    'Accept': 'application/vnd.github.v3+json'
                                                }
                                            });

                                            if (response.ok) {
                                                const repos = await response.json();
                                                // Extract clone_url from response as per user requirement
                                                const repoUrls = repos.map((repo: any) => repo.clone_url || '').filter(Boolean);
                                                console.log('✅ [fetchGitHubRepos] Fetched', repoUrls.length, 'repositories via PAT from credential');
                                                setGithubUrls(prev => ({ ...prev, [stageKey]: repoUrls }));
                                                setLoadingUrls(prev => ({ ...prev, [stageKey]: false }));
                                                return;
                                            } else {
                                                console.error('❌ [fetchGitHubRepos] GitHub API error:', response.status, response.statusText);
                                            }
                                        } catch (error) {
                                            console.error('❌ [fetchGitHubRepos] Error fetching GitHub repos from credential (PAT):', error);
                                        }
                                    } else {
                                        console.warn('⚠️ [fetchGitHubRepos] Missing token or username for PAT authentication. Token:', !!token, 'Username:', username);
                                    }
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error loading credential for connector:', error);
                }
            }

            // Fallback to connector's own authentication details
            if (authType === 'OAuth') {
                // For OAuth, we need to get the access token from the backend
                // Extract username from githubAccountUrl
                let username = '';
                if (githubConnector.githubAccountUrl) {
                    const urlMatch = githubConnector.githubAccountUrl.match(/github\.com\/([^\/]+)/);
                    if (urlMatch) {
                        username = urlMatch[1];
                    }
                }
                
                if (!username) {
                    console.error('❌ [fetchGitHubRepos] Cannot extract username from GitHub Account URL:', githubConnector.githubAccountUrl);
                    setGithubUrls(prev => ({ ...prev, [stageKey]: [] }));
                    setLoadingUrls(prev => ({ ...prev, [stageKey]: false }));
                    return;
                }
                
                console.log('🔑 [fetchGitHubRepos] Making OAuth API call (connector auth) for username:', username);
                try {
                    // Call backend API endpoint that handles OAuth token retrieval
                    const response = await api.get(`/api/github/repos?connectorName=${encodeURIComponent(connectorName)}&username=${encodeURIComponent(username)}&accountId=${selectedAccountId}&enterpriseId=${selectedEnterpriseId}`);
                    if (response && Array.isArray(response)) {
                        // Extract clone_url from response as per user requirement
                        const repos = response.map((repo: any) => repo.clone_url || '').filter(Boolean);
                        console.log('✅ [fetchGitHubRepos] Fetched', repos.length, 'repositories via OAuth (connector auth)');
                        setGithubUrls(prev => ({ ...prev, [stageKey]: repos }));
                    } else {
                        console.warn('⚠️ [fetchGitHubRepos] Invalid response format from OAuth API:', response);
                        setGithubUrls(prev => ({ ...prev, [stageKey]: [] }));
                    }
                } catch (error: any) {
                    console.error('❌ [fetchGitHubRepos] Error fetching GitHub repos (OAuth connector auth):', error);
                    
                    // Check if it's a 404 error (endpoint not implemented)
                    if (error.message && error.message.includes('404')) {
                        console.error('❌ [fetchGitHubRepos] API endpoint /api/github/repos is not implemented on backend');
                        console.error('❌ [fetchGitHubRepos] Backend needs to implement endpoint that retrieves OAuth token and fetches repos from GitHub API');
                        console.error('❌ [fetchGitHubRepos] See BACKEND_GITHUB_REPOS_API_IMPLEMENTATION.md for implementation guide');
                    } else {
                        console.error('❌ [fetchGitHubRepos] Error details:', error.message || error);
                    }
                    
                    setGithubUrls(prev => ({ ...prev, [stageKey]: [] }));
                } finally {
                    setLoadingUrls(prev => ({ ...prev, [stageKey]: false }));
                }
            } else if (authType === 'Username and Token' && githubConnector.personalAccessToken) {
                // For PAT, fetch repos directly (fallback if no credentialName)
                try {
                    const token = githubConnector.personalAccessToken;
                    const username = githubConnector.username || githubAccountName;
                    
                    if (token && username) {
                        console.log('🔑 [fetchGitHubRepos] Making PAT API call (connector auth) for username:', username);
                        // Fetch repos using GitHub API
                        const response = await fetch(`https://api.github.com/users/${username}/repos`, {
                            headers: {
                                'Authorization': `token ${token}`,
                                'Accept': 'application/vnd.github.v3+json'
                            }
                        });

                        if (response.ok) {
                            const repos = await response.json();
                            // Extract clone_url from response as per user requirement
                            const repoUrls = repos.map((repo: any) => repo.clone_url || '').filter(Boolean);
                            console.log('✅ [fetchGitHubRepos] Fetched', repoUrls.length, 'repositories via PAT (connector auth)');
                            setGithubUrls(prev => ({ ...prev, [stageKey]: repoUrls }));
                        } else {
                            console.error('❌ [fetchGitHubRepos] Failed to fetch GitHub repos:', response.status, response.statusText);
                            setGithubUrls(prev => ({ ...prev, [stageKey]: [] }));
                        }
                    } else {
                        console.warn('⚠️ [fetchGitHubRepos] Missing token or username for PAT (connector auth). Token:', !!token, 'Username:', username);
                        setGithubUrls(prev => ({ ...prev, [stageKey]: [] }));
                    }
                } catch (error) {
                    console.error('❌ [fetchGitHubRepos] Error fetching GitHub repos (connector auth):', error);
                    setGithubUrls(prev => ({ ...prev, [stageKey]: [] }));
                }
            } else {
                console.warn('⚠️ [fetchGitHubRepos] No valid authentication method found. AuthType:', authType, 'Has credentialName:', !!githubConnector.credentialName);
                setGithubUrls(prev => ({ ...prev, [stageKey]: [] }));
            }
        } catch (error) {
            console.error('Error fetching GitHub repos:', error);
            setGithubUrls(prev => ({ ...prev, [stageKey]: [] }));
        } finally {
            setLoadingUrls(prev => ({ ...prev, [stageKey]: false }));
        }
    }, [selectedAccountId, selectedEnterpriseId]);

    // Fetch GitHub branches for a selected repository
    const fetchGitHubBranches = useCallback(async (repositoryUrl: string, stageKey: string, connectorName: string) => {
        if (!repositoryUrl || !stageKey || !connectorName) {
            console.warn('⚠️ [fetchGitHubBranches] Missing required parameters:', { repositoryUrl, stageKey, connectorName });
            return;
        }

        console.log('🌿 [fetchGitHubBranches] Starting fetch for repository:', repositoryUrl, 'stageKey:', stageKey);
        setLoadingBranches(prev => ({ ...prev, [stageKey]: true }));

        try {
            // Extract owner and repo name from repository URL
            // Format: https://github.com/owner/repo.git or https://github.com/owner/repo
            const urlMatch = repositoryUrl.match(/github\.com[/:]([^\/]+)\/([^\/]+?)(?:\.git)?$/);
            if (!urlMatch || urlMatch.length < 3) {
                console.error('❌ [fetchGitHubBranches] Invalid repository URL format:', repositoryUrl);
                setGithubBranches(prev => ({ ...prev, [stageKey]: [] }));
                setLoadingBranches(prev => ({ ...prev, [stageKey]: false }));
                return;
            }

            const owner = urlMatch[1];
            const repo = urlMatch[2];
            console.log('🌿 [fetchGitHubBranches] Extracted owner:', owner, 'repo:', repo);

            // Get OAuth token from connector
            const LOCAL_STORAGE_CONNECTORS_KEY = 'connectors_connectors_data';
            const storageKey = `${LOCAL_STORAGE_CONNECTORS_KEY}_${selectedAccountId}_${selectedEnterpriseId}`;
            const stored = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) : null;
            
            if (!stored) {
                console.error('❌ [fetchGitHubBranches] No connectors found in localStorage');
                setGithubBranches(prev => ({ ...prev, [stageKey]: [] }));
                setLoadingBranches(prev => ({ ...prev, [stageKey]: false }));
                return;
            }

            const allConnectors: any[] = JSON.parse(stored);
            const connectorRow = allConnectors.find(conn => conn.connectorName === connectorName);
            
            if (!connectorRow || !connectorRow.connectors || connectorRow.connectors.length === 0) {
                console.error('❌ [fetchGitHubBranches] Connector not found:', connectorName);
                setGithubBranches(prev => ({ ...prev, [stageKey]: [] }));
                setLoadingBranches(prev => ({ ...prev, [stageKey]: false }));
                return;
            }

            // Find GitHub connector
            const githubConnector = connectorRow.connectors.find((c: any) => 
                c.connector?.toLowerCase() === 'github' && c.category?.toLowerCase() === 'code'
            );

            if (!githubConnector) {
                console.error('❌ [fetchGitHubBranches] GitHub connector not found in connector row');
                setGithubBranches(prev => ({ ...prev, [stageKey]: [] }));
                setLoadingBranches(prev => ({ ...prev, [stageKey]: false }));
                return;
            }

            // Try to get OAuth token from credential if available
            let accessToken = '';
            let tokenType = 'bearer';

            if (githubConnector.credentialName) {
                try {
                    const LOCAL_STORAGE_CREDENTIALS_KEY = 'credentials_credentials_data';
                    const credStorageKey = `${LOCAL_STORAGE_CREDENTIALS_KEY}_${selectedAccountId}_${selectedEnterpriseId}`;
                    const credStored = typeof window !== 'undefined' ? window.localStorage.getItem(credStorageKey) : null;
                    
                    if (credStored) {
                        const allCredentials: any[] = JSON.parse(credStored);
                        const credential = allCredentials.find(cred => cred.credentialName === githubConnector.credentialName);
                        
                        if (credential && credential.connectors && credential.connectors.length > 0) {
                            const credGitHubConnector = credential.connectors.find((c: any) => 
                                c.connector?.toLowerCase() === 'github' && c.category?.toLowerCase() === 'code'
                            );
                            
                            if (credGitHubConnector && credGitHubConnector.authenticationType === 'OAuth') {
                                // For OAuth, we need to call backend API to get branches
                                console.log('🌿 [fetchGitHubBranches] Using OAuth authentication, calling backend API');
                                try {
                                    const response = await api.get(`/api/github/branches?credentialName=${encodeURIComponent(githubConnector.credentialName)}&owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}&accountId=${selectedAccountId}&enterpriseId=${selectedEnterpriseId}`);
                                    if (response && Array.isArray(response)) {
                                        const branches = response.map((branch: any) => ({
                                            value: branch.name || branch,
                                            label: branch.name || branch
                                        })).filter((b: any) => b.value);
                                        console.log('✅ [fetchGitHubBranches] Fetched', branches.length, 'branches via OAuth');
                                        setGithubBranches(prev => ({ ...prev, [stageKey]: branches }));
                                        setLoadingBranches(prev => ({ ...prev, [stageKey]: false }));
                                        return;
                                    }
                                } catch (error: any) {
                                    console.error('❌ [fetchGitHubBranches] Error fetching branches from backend API:', error);
                                    if (error.message && error.message.includes('404')) {
                                        console.error('❌ [fetchGitHubBranches] Backend endpoint /api/github/branches is not implemented');
                                        console.error('❌ [fetchGitHubBranches] See BACKEND_GITHUB_BRANCHES_API_IMPLEMENTATION.md for implementation guide');
                                    }
                                    setGithubBranches(prev => ({ ...prev, [stageKey]: [] }));
                                    setLoadingBranches(prev => ({ ...prev, [stageKey]: false }));
                                }
                            } else if (credGitHubConnector && credGitHubConnector.authenticationType === 'Username and Token' && credGitHubConnector.personalAccessToken) {
                                // Use PAT from credential
                                accessToken = credGitHubConnector.personalAccessToken;
                                tokenType = 'token';
                            }
                        }
                    }
                } catch (error) {
                    console.error('❌ [fetchGitHubBranches] Error loading credential:', error);
                }
            }

            // Fallback to connector's own authentication
            if (!accessToken && githubConnector.authenticationType === 'Username and Token' && githubConnector.personalAccessToken) {
                accessToken = githubConnector.personalAccessToken;
                tokenType = 'token';
            }

            // If we have a token, fetch branches directly from GitHub API
            if (accessToken) {
                console.log('🌿 [fetchGitHubBranches] Making direct GitHub API call with PAT');
                try {
                    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches`, {
                        headers: {
                            'Authorization': `${tokenType} ${accessToken}`,
                            'Accept': 'application/vnd.github.v3+json'
                        }
                    });

                    if (response.ok) {
                        const branches = await response.json();
                        const branchOptions = branches.map((branch: any) => ({
                            value: branch.name || branch,
                            label: branch.name || branch
                        })).filter((b: any) => b.value);
                        console.log('✅ [fetchGitHubBranches] Fetched', branchOptions.length, 'branches via PAT');
                        setGithubBranches(prev => ({ ...prev, [stageKey]: branchOptions }));
                    } else {
                        console.error('❌ [fetchGitHubBranches] GitHub API error:', response.status, response.statusText);
                        setGithubBranches(prev => ({ ...prev, [stageKey]: [] }));
                    }
                } catch (error) {
                    console.error('❌ [fetchGitHubBranches] Error fetching branches from GitHub API:', error);
                    setGithubBranches(prev => ({ ...prev, [stageKey]: [] }));
                }
            } else {
                console.warn('⚠️ [fetchGitHubBranches] No access token available. OAuth requires backend API endpoint /api/github/branches');
                setGithubBranches(prev => ({ ...prev, [stageKey]: [] }));
            }
        } catch (error) {
            console.error('❌ [fetchGitHubBranches] Unexpected error:', error);
            setGithubBranches(prev => ({ ...prev, [stageKey]: [] }));
        } finally {
            setLoadingBranches(prev => ({ ...prev, [stageKey]: false }));
        }
    }, [selectedAccountId, selectedEnterpriseId]);

    // Restore repository list and branches when subrow is reopened with saved state
    // This runs after state is restored from initialPipelineStagesState and after functions are declared
    useEffect(() => {
        if (!stagesData?.nodes || !initialPipelineStagesState) return;
        
        const restoreSavedData = () => {
            stagesData.nodes.forEach(node => {
                node.stages?.forEach(stage => {
                    const stageKey = `${node.nodeType}_${stage.type}`;
                    const selectedConnector = selectedConnectors[stageKey];
                    const savedRepoUrl = initialPipelineStagesState?.selectedRepositoryUrls?.[stageKey] || selectedRepositoryUrls[stageKey];
                    const savedBranch = initialPipelineStagesState?.selectedBranches?.[stageKey] || selectedBranches[stageKey];
                    const urlType = initialPipelineStagesState?.connectorUrlTypes?.[selectedConnector] || connectorUrlTypes[selectedConnector];
                    
                    // Only process if we have a saved connector
                    if (!selectedConnector) return;
                    
                    // Check if this is a GitHub connector
                    const category = getCategoryFromStageType(stage.type);
                    const connector = getToolNameFromStageType(stage.type);
                    
                    if (category === 'Code' && connector && connector.toLowerCase().includes('github')) {
                        // Load connector details to restore connectorRepositoryUrls for Repository type
                        if (selectedConnector && !connectorRepositoryUrls[selectedConnector]) {
                            try {
                                const LOCAL_STORAGE_CONNECTORS_KEY = 'connectors_connectors_data';
                                const storageKey = `${LOCAL_STORAGE_CONNECTORS_KEY}_${selectedAccountId}_${selectedEnterpriseId}`;
                                const stored = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) : null;
                                
                                if (stored) {
                                    const allConnectors: any[] = JSON.parse(stored);
                                    const connectorRow = allConnectors.find(conn => conn.connectorName === selectedConnector);
                                    
                                    if (connectorRow && connectorRow.connectors && connectorRow.connectors.length > 0) {
                                        const githubConnector = connectorRow.connectors.find((c: any) => 
                                            c.connector?.toLowerCase() === 'github' && c.category?.toLowerCase() === 'code'
                                        );
                                        
                                        if (githubConnector) {
                                            const restoredUrlType = githubConnector.urlType || 'Account';
                                            setConnectorUrlTypes(prev => ({ ...prev, [selectedConnector]: restoredUrlType }));
                                            
                                            if (restoredUrlType === 'Repository' && (githubConnector.githubAccountUrl || githubConnector.url)) {
                                                const repositoryUrl = githubConnector.githubAccountUrl || githubConnector.url;
                                                setConnectorRepositoryUrls(prev => ({ ...prev, [selectedConnector]: repositoryUrl }));
                                            }
                                        }
                                    }
                                }
                            } catch (error) {
                                console.error('Error loading connector details for restore:', error);
                            }
                        }
                        
                        // If URL Type is "Account" and we don't have the repository list, fetch it
                        const currentUrlType = connectorUrlTypes[selectedConnector] || urlType;
                        if (currentUrlType === 'Account' && !githubUrls[stageKey]?.length && selectedConnector) {
                            console.log('🔄 [PipelineStagesSubRow] Restoring repository list for saved connector:', selectedConnector, 'stageKey:', stageKey);
                            fetchGitHubRepos(selectedConnector, stageKey);
                        }
                        
                        // Determine the repository URL to use for fetching branches
                        let repoUrlForBranches = savedRepoUrl;
                        if (currentUrlType === 'Repository' && !savedRepoUrl) {
                            // For Repository type, get URL from connectorRepositoryUrls
                            repoUrlForBranches = connectorRepositoryUrls[selectedConnector] || '';
                        }
                        
                        // If we have a repository URL, fetch branches (even if branch isn't saved yet, we need the list)
                        // Also fetch if we have a saved branch but no branches loaded
                        if (repoUrlForBranches && (!githubBranches[stageKey]?.length || (savedBranch && !githubBranches[stageKey]?.find(b => b.value === savedBranch)))) {
                            console.log('🔄 [PipelineStagesSubRow] Restoring branches for saved repository:', repoUrlForBranches, 'savedBranch:', savedBranch, 'stageKey:', stageKey);
                            fetchGitHubBranches(repoUrlForBranches, stageKey, selectedConnector);
                        }
                    }
                });
            });
        };
        
        // Only restore if we have saved state
        if (initialPipelineStagesState && Object.keys(initialPipelineStagesState.selectedConnectors || {}).length > 0) {
            // Small delay to ensure state has been restored
            const timer = setTimeout(restoreSavedData, 200);
            return () => clearTimeout(timer);
        }
    }, [initialPipelineStagesState, stagesData, selectedConnectors, selectedRepositoryUrls, selectedBranches, githubBranches, githubUrls, connectorUrlTypes, fetchGitHubBranches, fetchGitHubRepos]);

    // Handle connector selection
    const handleConnectorChange = (stageKey: string, connectorName: string) => {
        // Reset repository and branch fields when connector changes
        setSelectedRepositoryUrls(prev => {
            const updated = { ...prev };
            delete updated[stageKey];
            return updated;
        });
        setGithubBranches(prev => ({ ...prev, [stageKey]: [] }));
        setSelectedBranches(prev => {
            const updated = { ...prev };
            delete updated[stageKey];
            return updated;
        });
        setGithubUrls(prev => ({ ...prev, [stageKey]: [] }));
        setLoadingUrls(prev => ({ ...prev, [stageKey]: false }));
        setLoadingBranches(prev => ({ ...prev, [stageKey]: false }));
        
        setSelectedConnectors(prev => ({ ...prev, [stageKey]: connectorName }));
        if (connectorName) {
            // Load connector details to get URL Type and Repository URL
            try {
                const LOCAL_STORAGE_CONNECTORS_KEY = 'connectors_connectors_data';
                const storageKey = `${LOCAL_STORAGE_CONNECTORS_KEY}_${selectedAccountId}_${selectedEnterpriseId}`;
                const stored = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) : null;
                
                if (stored) {
                    const allConnectors: any[] = JSON.parse(stored);
                    const connectorRow = allConnectors.find(conn => conn.connectorName === connectorName);
                    
                    if (connectorRow && connectorRow.connectors && connectorRow.connectors.length > 0) {
                        const githubConnector = connectorRow.connectors.find((c: any) => 
                            c.connector?.toLowerCase() === 'github' && c.category?.toLowerCase() === 'code'
                        );
                        
                        if (githubConnector) {
                            const urlType = githubConnector.urlType || 'Account';
                            setConnectorUrlTypes(prev => ({ ...prev, [connectorName]: urlType }));
                            
                            if (urlType === 'Repository' && (githubConnector.githubAccountUrl || githubConnector.url)) {
                                const repositoryUrl = githubConnector.githubAccountUrl || githubConnector.url;
                                setConnectorRepositoryUrls(prev => ({ ...prev, [connectorName]: repositoryUrl }));
                                setGithubUrls(prev => ({ ...prev, [stageKey]: [] }));
                                // Fetch branches for Repository type
                                if (repositoryUrl) {
                                    setTimeout(() => {
                                        fetchGitHubBranches(repositoryUrl, stageKey, connectorName);
                                    }, 100);
                                }
                                return;
                            } else if (urlType === 'Account') {
                                // Fetch repos for Account type
                                fetchGitHubRepos(connectorName, stageKey);
                                return;
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error loading connector details:', error);
            }
            
            // Fallback: only fetch repos if URL Type is unknown (assume Account)
            // This handles cases where connector might not be fully configured yet
            // fetchGitHubRepos will check URL Type internally and only proceed if Account
            fetchGitHubRepos(connectorName, stageKey);
        } else {
            setGithubUrls(prev => ({ ...prev, [stageKey]: [] }));
        }
    };

    if (!stagesData || !stagesData.nodes || stagesData.nodes.length === 0) {
        return (
            <div className="relative bg-gradient-to-r from-blue-50/80 to-transparent border-l-4 border-blue-400 ml-20 mt-1 mb-2 p-3">
                <div className="text-sm text-gray-500">No pipeline stages available</div>
            </div>
        );
    }

    // Map node types to display names
    const getNodeDisplayName = (nodeType: string, nodeName: string) => {
        if (nodeType === 'node_dev') return 'Development';
        if (nodeType === 'node_qa') return 'QA';
        if (nodeType === 'node_prod') return 'Production';
        return nodeName;
    };

    // Map stage types to display names
    const getStageDisplayName = (stageType: string) => {
        if (stageType.startsWith('code_')) {
            const name = stageType.replace('code_', '').replace(/_/g, ' ');
            return name.charAt(0).toUpperCase() + name.slice(1);
        }
        if (stageType.startsWith('build_')) {
            const name = stageType.replace('build_', '').replace(/_/g, ' ');
            return name.charAt(0).toUpperCase() + name.slice(1);
        }
        if (stageType.startsWith('test_')) {
            const name = stageType.replace('test_', '').replace(/_/g, ' ');
            return name.charAt(0).toUpperCase() + name.slice(1);
        }
        if (stageType.startsWith('deploy_')) {
            const name = stageType.replace('deploy_', '').replace(/_/g, ' ');
            return name.charAt(0).toUpperCase() + name.slice(1);
        }
        return stageType;
    };

    return (
        <div className="relative bg-gradient-to-r from-blue-50/80 to-transparent border-l-4 border-blue-400 ml-20 mt-1 mb-4 w-full overflow-visible z-10">
            {/* Vertical connection line from chevron */}
            <div className="absolute -left-2 top-0 bottom-0 w-px bg-blue-400"></div>
            
            {/* Pipeline stages section header */}
            <div className="p-3 pb-2">
                <h4 className="text-sm font-semibold text-black mb-3 flex items-center gap-2">
                    <Hammer className="w-4 h-4" />
                    Pipeline Stages
                </h4>
                
                {/* Stages Container */}
                <div className="ml-6 relative space-y-4">
                    {stagesData.nodes.map((node, nodeIndex) => (
                        <div key={`${rowId}-node-${nodeIndex}`} className="border border-blue-200 rounded-lg bg-white">
                            {/* Node Section Header */}
                            <div className="bg-blue-100/70 px-3 py-2 border-b border-blue-300 rounded-t-lg">
                                <h5 className="text-xs font-semibold text-black">
                                    {getNodeDisplayName(node.nodeType, node.nodeName)}
                                </h5>
                            </div>
                            
                            {/* Stages Table */}
                            {node.stages.length > 0 ? (
                                <div className="p-2">
                                    {/* Table Header - Only show Category */}
                                    <div className="grid gap-2 p-2 bg-blue-50/50 border border-blue-200 rounded font-medium text-xs text-black mb-2"
                                        style={{ gridTemplateColumns: '150px 150px 200px 250px 200px' }}>
                                        <div>Category</div>
                                        <div></div>
                                        <div></div>
                                        <div></div>
                                        <div></div>
                                    </div>
                                    
                                    {/* Stage Rows */}
                                    {node.stages.map((stage, stageIndex) => {
                                        const stageKey = `${rowId}-stage-${nodeIndex}-${stageIndex}`;
                                        const connectorInfo = getConnectorForStage(stage.type);
                                        const category = connectorInfo?.category || getCategoryFromStageType(stage.type);
                                        let connector = connectorInfo?.connector || getToolNameFromStageType(stage.type);
                                        
                                        // Normalize connector name to match TOOLS_CONFIG keys (e.g., "Github" -> "GitHub")
                                        if (connector) {
                                            // First try exact match
                                            if (!getToolConfig(connector)) {
                                                // Try case-insensitive match
                                                const toolConfigKeys = Object.keys(TOOLS_CONFIG);
                                                const matched = toolConfigKeys.find(key => 
                                                    key.toLowerCase() === connector.toLowerCase()
                                                );
                                                if (matched) {
                                                    connector = matched;
                                                }
                                            }
                                        }
                                        
                                        // Normalize stage name from YAML to match TOOLS_CONFIG keys
                                        let stageName = stage.name || connector || '-';
                                        let toolConfig = null;
                                        
                                        // Try to find tool config using stage name first (from YAML)
                                        if (stage.name) {
                                            // First try exact match
                                            toolConfig = getToolConfig(stage.name);
                                            if (!toolConfig) {
                                                // Try case-insensitive match
                                                const toolConfigKeys = Object.keys(TOOLS_CONFIG);
                                                const matched = toolConfigKeys.find(key => 
                                                    key.toLowerCase() === stage.name.toLowerCase()
                                                );
                                                if (matched) {
                                                    toolConfig = getToolConfig(matched);
                                                    stageName = matched; // Use normalized name
                                                }
                                            } else {
                                                stageName = stage.name; // Use exact match
                                            }
                                        }
                                        
                                        // If no tool config found from stage name, use connector
                                        if (!toolConfig && connector) {
                                            toolConfig = getToolConfig(connector);
                                            if (!stage.name) {
                                                stageName = connector; // Use connector if no stage name
                                            }
                                        }
                                        
                                        const isDeploy = category.toLowerCase() === 'deploy';
                                        // Load connectors for all categories including Plan, even if connector is not specified
                                        const connectorOptions = loadConnectors(category.toLowerCase(), connector || '');
                                        const environmentOptions = isDeploy ? loadEnvironments() : [];
                                        const selectedConnector = selectedConnectors[stageKey] || '';
                                        const selectedEnvironment = selectedEnvironments[stageKey] || '';
                                        const urls = githubUrls[stageKey] || [];
                                        const isLoading = loadingUrls[stageKey] || false;
                                        const isGitHub = connector?.toLowerCase() === 'github' || stage.type.includes('github');

                                        return (
                                            <div key={stageKey}
                                            className={`grid gap-2 p-2 border border-blue-200 rounded transition-colors duration-150 ${
                                                stageIndex === node.stages.length - 1 ? 'rounded-b-lg' : ''
                                            }`}
                                                style={{ gridTemplateColumns: '150px 150px 200px 250px 200px' }}>
                                                <div className="text-xs text-slate-700 flex items-center">
                                                    {category}
                                            </div>
                                                <div className="text-xs text-slate-700 flex items-center gap-2">
                                                    {toolConfig && (
                                                        <Icon name={toolConfig.iconName} size={16} className="text-gray-600 flex-shrink-0" />
                                                    )}
                                                    <span>{stageName}</span>
                                        </div>
                                                <div className="text-xs flex items-center gap-1">
                                                    <div className="flex-1">
                                                        {isDeploy ? (
                                                            <SimpleDropdown
                                                                value={selectedEnvironment}
                                                                options={environmentOptions}
                                                                onChange={(value) => setSelectedEnvironments(prev => ({ ...prev, [stageKey]: value }))}
                                                                placeholder="Select environment..."
                                                            />
                                                        ) : (
                                                            <SimpleDropdown
                                                                value={selectedConnector}
                                                                options={connectorOptions}
                                                                onChange={(value) => handleConnectorChange(stageKey, value)}
                                                                placeholder="Select connector..."
                                                            />
                                                        )}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (isDeploy) {
                                                                setSelectedStageForEnvironment({ stageKey, category, connector });
                                                                setIsEnvironmentModalOpen(true);
                                                            } else {
                                                                setSelectedStageForConnector({ stageKey, category, connector });
                                                                setIsConnectorModalOpen(true);
                                                            }
                                                        }}
                                                        className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-colors"
                                                        title={isDeploy ? "Add new environment" : "Add new connector"}
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                </div>
                                                <div className="text-xs">
                                                    {isGitHub ? (() => {
                                                        // Always show repository dropdown for GitHub connectors
                                                        const urlType = selectedConnector ? (connectorUrlTypes[selectedConnector] || 'Account') : 'Account';
                                                        const repositoryUrl = selectedConnector ? (connectorRepositoryUrls[selectedConnector] || '') : '';
                                                        
                                                        // For Repository type, show the repository URL in this column (same position as Account type repos)
                                                        if (urlType === 'Repository' && repositoryUrl) {
                                                            return (
                                                                <div className="text-left px-2 py-1 text-[11px] leading-[14px] rounded border border-blue-300 bg-white text-slate-700 min-h-[24px] flex items-center">
                                                                    <span className="truncate" title={repositoryUrl}>
                                                                        {repositoryUrl}
                                                                    </span>
                                                                </div>
                                                            );
                                                        } else {
                                                            // Show dropdown with repos for Account type or when no connector selected
                                                            const selectedRepo = selectedRepositoryUrls[stageKey] || '';
                                                            
                                                            // Ensure selected repo is in options list even if list is empty (for display purposes)
                                                            const repoOptions = urls.length > 0 
                                                                ? urls.map(url => ({ value: url, label: url }))
                                                                : (selectedRepo ? [{ value: selectedRepo, label: selectedRepo }] : []);
                                                            
                                                            if (isLoading) {
                                                                // Show selected repo in options even while loading so it can be displayed
                                                                const loadingOptions = selectedRepo ? [{ value: selectedRepo, label: selectedRepo }] : [];
                                                                return (
                                                                    <SimpleDropdown
                                                                        value={selectedRepo}
                                                                        options={loadingOptions}
                                                                        onChange={() => {}}
                                                                        placeholder="Loading..."
                                                                        disabled={true}
                                                                    />
                                                                );
                                                            } else if (urls.length > 0 || selectedRepo) {
                                                                return (
                                                                    <SimpleDropdown
                                                                        value={selectedRepo}
                                                                        options={repoOptions}
                                                                        onChange={(value) => {
                                                                            setSelectedRepositoryUrls(prev => ({ ...prev, [stageKey]: value }));
                                                                            // Fetch branches when repository is selected
                                                                            if (value && selectedConnector) {
                                                                                console.log('🌿 [PipelineStagesSubRow] Repository selected, fetching branches:', value);
                                                                                fetchGitHubBranches(value, stageKey, selectedConnector);
                                                                            } else {
                                                                                // Clear branches if repository is cleared
                                                                                setGithubBranches(prev => ({ ...prev, [stageKey]: [] }));
                                                                                setSelectedBranches(prev => {
                                                                                    const updated = { ...prev };
                                                                                    delete updated[stageKey];
                                                                                    return updated;
                                                                                });
                                                                            }
                                                                        }}
                                                                        placeholder="Select repository..."
                                                                    />
                                                                );
                                                            } else {
                                                                // Show dropdown with "No repositories found" message
                                                                return (
                                                                    <SimpleDropdown
                                                                        value={selectedRepo}
                                                                        options={[]}
                                                                        onChange={() => {}}
                                                                        placeholder={selectedConnector ? "No repositories found" : "Select connector first..."}
                                                                        disabled={!selectedConnector}
                                                                    />
                                                                );
                                                            }
                                                        }
                                                    })() : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </div>
                                                <div className="text-xs">
                                                    {isGitHub ? (() => {
                                                        // Always show branch dropdown for GitHub connectors
                                                        const urlType = selectedConnector ? (connectorUrlTypes[selectedConnector] || 'Account') : 'Account';
                                                        const repositoryUrl = selectedConnector ? (connectorRepositoryUrls[selectedConnector] || '') : '';
                                                        const selectedRepo = selectedRepositoryUrls[stageKey] || repositoryUrl;
                                                        const branches = githubBranches[stageKey] || [];
                                                        const isLoadingBranches = loadingBranches[stageKey] || false;
                                                        const selectedBranch = selectedBranches[stageKey] || '';
                                                        
                                                        if (isLoadingBranches) {
                                                            // Show selected branch in options even while loading so it can be displayed
                                                            const loadingOptions = selectedBranch ? [{ value: selectedBranch, label: selectedBranch }] : [];
                                                            return (
                                                                <SimpleDropdown
                                                                    value={selectedBranch}
                                                                    options={loadingOptions}
                                                                    onChange={() => {}}
                                                                    placeholder="Loading branches..."
                                                                    disabled={true}
                                                                />
                                                            );
                                                        } else if (branches.length > 0) {
                                                            // Ensure selected branch is in the options list (in case it was deleted/renamed)
                                                            const branchOptions = [...branches];
                                                            if (selectedBranch && !branches.find(b => b.value === selectedBranch)) {
                                                                branchOptions.push({ value: selectedBranch, label: selectedBranch });
                                                            }
                                                            return (
                                                                <SimpleDropdown
                                                                    value={selectedBranch}
                                                                    options={branchOptions}
                                                                    onChange={(value) => setSelectedBranches(prev => ({ ...prev, [stageKey]: value }))}
                                                                    placeholder="Select branch..."
                                                                />
                                                            );
                                                        } else {
                                                            // If we have a selected branch but no branches loaded yet, show it as an option
                                                            const branchOptions = selectedBranch ? [{ value: selectedBranch, label: selectedBranch }] : [];
                                                            return (
                                                                <SimpleDropdown
                                                                    value={selectedBranch}
                                                                    options={branchOptions}
                                                                    onChange={(value) => setSelectedBranches(prev => ({ ...prev, [stageKey]: value }))}
                                                                    placeholder={selectedRepo ? (isLoadingBranches ? "Loading branches..." : "No branches found") : "Select repository first..."}
                                                                    disabled={!selectedRepo || isLoadingBranches}
                                                                />
                                                            );
                                                        }
                                                    })() : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="p-3 text-xs text-gray-500 text-center">
                                    No stages configured
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Connector Details Modal - Rendered via Portal to document.body */}
            {selectedStageForConnector && typeof window !== 'undefined' && createPortal(
                <ConnectorDetailsModal
                    isOpen={isConnectorModalOpen}
                    onClose={() => {
                        setIsConnectorModalOpen(false);
                        setSelectedStageForConnector(null);
                    }}
                    onSave={(connectors: Connector[]) => {
                        // Handle bulk save
                        console.log('💾 [PipelineStagesSubRow] Saving connectors:', connectors);
                    }}
                    onSaveIndividual={(connectors: Connector[], connectorNameFromModal?: string, descriptionFromModal?: string) => {
                        // Handle individual save - create new connector row
                        console.log('💾 [PipelineStagesSubRow] ========== SAVE BUTTON CLICKED ==========');
                        console.log('💾 [PipelineStagesSubRow] onSaveIndividual called from ConnectorDetailsModal');
                        console.log('💾 [PipelineStagesSubRow] Connector Name from modal header:', connectorNameFromModal);
                        console.log('💾 [PipelineStagesSubRow] Description from modal header:', descriptionFromModal);
                        console.log('💾 [PipelineStagesSubRow] Connectors array:', connectors);
                        console.log('💾 [PipelineStagesSubRow] Build Row context:', {
                            entity: buildRow?.entity,
                            product: buildRow?.product,
                            service: buildRow?.service,
                            accountId: selectedAccountId,
                            enterpriseId: selectedEnterpriseId
                        });
                        
                        if (connectors.length === 0) {
                            console.warn('⚠️ [PipelineStagesSubRow] No connectors to save, returning early');
                            return;
                        }

                        const connector = connectors[0];
                        console.log('💾 [PipelineStagesSubRow] First connector details:', {
                            id: connector.id,
                            category: connector.category,
                            connector: connector.connector,
                            urlType: connector.urlType,
                            githubAccountUrl: connector.githubAccountUrl,
                            url: connector.url,
                            credentialName: connector.credentialName,
                            authenticationType: connector.authenticationType
                        });
                        
                        const workstream = buildRow?.entity || '';
                        const product = buildRow?.product || '';
                        const service = buildRow?.service || '';

                        // Use connector name from modal header, fallback to connector type
                        const connectorName = connectorNameFromModal?.trim() || connector.connector || 'New Connector';
                        console.log('💾 [PipelineStagesSubRow] Final connector name to save:', connectorName);

                        try {
                            const LOCAL_STORAGE_CONNECTORS_KEY = 'connectors_connectors_data';
                            const storageKey = `${LOCAL_STORAGE_CONNECTORS_KEY}_${selectedAccountId}_${selectedEnterpriseId}`;
                            const stored = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) : null;
                            
                            let allConnectors: ConnectorRow[] = [];
                            if (stored) {
                                allConnectors = JSON.parse(stored);
                            }

                            // Check if connector with same name already exists
                            const existingConnector = allConnectors.find(
                                conn => conn.connectorName === connectorName &&
                                conn.entity === workstream &&
                                conn.product === product &&
                                conn.service === service
                            );

                            let connectorRowId: string;
                            if (existingConnector) {
                                // Update existing connector
                                console.log('💾 [PipelineStagesSubRow] Updating existing connector:', existingConnector.connectorName);
                                existingConnector.connectors = connectors;
                                existingConnector.connectorIconName = connector.connectorIconName;
                                if (descriptionFromModal) {
                                    existingConnector.description = descriptionFromModal;
                                    console.log('💾 [PipelineStagesSubRow] Updated description:', descriptionFromModal);
                                }
                                console.log('💾 [PipelineStagesSubRow] Updated connector with', connectors.length, 'connector(s)');
                                connectorRowId = existingConnector.id;
                            } else {
                                // Create new connector row
                                console.log('💾 [PipelineStagesSubRow] Creating new connector row:', connectorName);
                                const newConnectorRow: ConnectorRow = {
                                    id: generateId(),
                                    connectorName: connectorName,
                                    description: descriptionFromModal || connector.description || '',
                                    entity: workstream,
                                    product: product,
                                    service: service,
                                    connectorIconName: connector.connectorIconName,
                                    connectors: connectors
                                };
                                console.log('💾 [PipelineStagesSubRow] New connector row created:', {
                                    id: newConnectorRow.id,
                                    connectorName: newConnectorRow.connectorName,
                                    description: newConnectorRow.description,
                                    entity: newConnectorRow.entity,
                                    product: newConnectorRow.product,
                                    service: newConnectorRow.service
                                });
                                allConnectors.push(newConnectorRow);
                                console.log('💾 [PipelineStagesSubRow] Total connectors after add:', allConnectors.length);
                                connectorRowId = newConnectorRow.id;
                            }

                            // Save to localStorage
                            if (typeof window !== 'undefined') {
                                console.log('💾 [PipelineStagesSubRow] Saving to localStorage...');
                                window.localStorage.setItem(storageKey, JSON.stringify(allConnectors));
                                console.log('✅ [PipelineStagesSubRow] Successfully saved connector to localStorage');
                                console.log('💾 [PipelineStagesSubRow] Total connectors saved:', allConnectors.length);
                                
                                // Migrate test results from temporary key to connector row ID
                                const tempTestResultKey = `temp_${connectorName}_${workstream}_${product}_${service}`;
                                const TEST_RESULTS_STORAGE_KEY = `connector_test_results_${selectedAccountId}_${selectedEnterpriseId}`;
                                const testResultsStored = window.localStorage.getItem(TEST_RESULTS_STORAGE_KEY);
                                if (testResultsStored) {
                                    try {
                                        const testResults: Record<string, { status: 'success' | 'failed'; timestamp: number }> = JSON.parse(testResultsStored);
                                        if (testResults[tempTestResultKey]) {
                                            // Migrate test result from temp key to connector row ID
                                            testResults[connectorRowId] = testResults[tempTestResultKey];
                                            delete testResults[tempTestResultKey];
                                            window.localStorage.setItem(TEST_RESULTS_STORAGE_KEY, JSON.stringify(testResults));
                                            console.log('💾 [PipelineStagesSubRow] Migrated test result from temp key to connector row ID:', connectorRowId);
                                            // Dispatch event to notify Status column to refresh
                                            window.dispatchEvent(new Event('connectorTestResultUpdated'));
                                        }
                                    } catch (error) {
                                        console.error('❌ [PipelineStagesSubRow] Error migrating test result:', error);
                                    }
                                }
                                
                                // Get the stage key for this connector
                                const stageKey = selectedStageForConnector?.stageKey || '';
                                console.log('💾 [PipelineStagesSubRow] Stage key:', stageKey);
                                
                                // Set the connector name as selected in the dropdown immediately
                                if (stageKey) {
                                    console.log('💾 [PipelineStagesSubRow] Setting selected connector in dropdown:', connectorName, 'for stage:', stageKey);
                                    setSelectedConnectors(prev => {
                                        const updated = { ...prev, [stageKey]: connectorName };
                                        console.log('✅ [PipelineStagesSubRow] Updated selectedConnectors state:', updated);
                                        return updated;
                                    });
                                } else {
                                    console.warn('⚠️ [PipelineStagesSubRow] No stage key found, cannot set selected connector');
                                }
                                
                                // Refresh connector options by triggering a re-render
                                console.log('💾 [PipelineStagesSubRow] Refreshing connector options dropdown...');
                                setConnectorRefreshKey(prev => {
                                    const newKey = prev + 1;
                                    console.log('💾 [PipelineStagesSubRow] Connector refresh key updated:', newKey);
                                    return newKey;
                                });
                                
                                // If GitHub connector, handle URL Type and Repository URL
                                if (connector.category?.toLowerCase() === 'code' && connector.connector?.toLowerCase() === 'github') {
                                    console.log('🔍 [PipelineStagesSubRow] Processing GitHub connector...');
                                    const urlType = connector.urlType || 'Account';
                                    console.log('🔍 [PipelineStagesSubRow] URL Type:', urlType);
                                    setConnectorUrlTypes(prev => ({ ...prev, [connectorName]: urlType }));
                                    
                                    if (urlType === 'Repository') {
                                        // Repository type - store URL directly and fetch branches
                                        // When URL Type is Repository, the repository URL is stored in githubAccountUrl field
                                        const repositoryUrl = connector.githubAccountUrl || connector.url || '';
                                        if (repositoryUrl) {
                                            console.log('📦 [PipelineStagesSubRow] Repository type detected, storing URL directly:', repositoryUrl);
                                            setConnectorRepositoryUrls(prev => ({ ...prev, [connectorName]: repositoryUrl }));
                                            
                                            // Also set it in selectedRepositoryUrls for this stage to trigger branch fetching
                                            if (stageKey) {
                                                setSelectedRepositoryUrls(prev => ({ ...prev, [stageKey]: repositoryUrl }));
                                                
                                                // Fetch branches for this repository
                                                console.log('🌿 [PipelineStagesSubRow] Fetching branches for repository:', repositoryUrl);
                                                setTimeout(() => {
                                                    fetchGitHubBranches(repositoryUrl, stageKey, connectorName);
                                                }, 200);
                                            }
                                        } else {
                                            console.warn('⚠️ [PipelineStagesSubRow] Repository type but no repository URL found. githubAccountUrl:', connector.githubAccountUrl, 'url:', connector.url);
                                        }
                                    } else if (urlType === 'Account' && connector.githubAccountUrl) {
                                        // Only make API call for Account type
                                        console.log('🔍 [PipelineStagesSubRow] Account type detected, preparing API call...');
                                        console.log('🔍 [PipelineStagesSubRow] GitHub Account URL:', connector.githubAccountUrl);
                                        console.log('🔍 [PipelineStagesSubRow] Credential Name:', connector.credentialName);
                                        console.log('🔍 [PipelineStagesSubRow] Authentication Type:', connector.authenticationType);
                                        
                                        if (stageKey) {
                                            // Use setTimeout to ensure localStorage is updated and state is set before API call
                                            console.log('⏳ [PipelineStagesSubRow] Scheduling API call in 200ms...');
                                            setTimeout(() => {
                                                console.log('🚀 [PipelineStagesSubRow] Executing API call now for connector:', connectorName);
                                                fetchGitHubRepos(connectorName, stageKey);
                                            }, 200);
                                        } else {
                                            console.warn('⚠️ [PipelineStagesSubRow] No stage key, cannot trigger API call');
                                        }
                                    } else {
                                        console.warn('⚠️ [PipelineStagesSubRow] Missing required fields for GitHub connector:', {
                                            urlType,
                                            hasGithubAccountUrl: !!connector.githubAccountUrl,
                                            hasUrl: !!connector.url
                                        });
                                    }
                                } else {
                                    console.log('ℹ️ [PipelineStagesSubRow] Not a GitHub connector, skipping repository fetch');
                                }
                                
                                console.log('✅ [PipelineStagesSubRow] Save process completed successfully');
                            } else {
                                console.error('❌ [PipelineStagesSubRow] window is undefined, cannot save to localStorage');
                            }

                            // Close modal
                            console.log('💾 [PipelineStagesSubRow] Closing modal...');
                            setIsConnectorModalOpen(false);
                            setSelectedStageForConnector(null);
                            console.log('✅ [PipelineStagesSubRow] ========== SAVE PROCESS COMPLETE ==========');
                        } catch (error) {
                            console.error('❌ [PipelineStagesSubRow] Error saving connector:', error);
                        }
                    }}
                    connectorName={selectedStageForConnector.connector || 'New Connector'}
                    initialConnectors={(() => {
                        // Pre-fill category and connector based on the stage row
                        const category = selectedStageForConnector.category.toLowerCase();
                        let connector = selectedStageForConnector.connector;
                        
                        // Normalize connector name to match TOOLS_CONFIG keys (e.g., "Github" -> "GitHub")
                        if (connector) {
                            // First try exact match
                            if (!getToolConfig(connector)) {
                                // Try case-insensitive match
                                const toolConfigKeys = Object.keys(TOOLS_CONFIG);
                                const matched = toolConfigKeys.find(key => 
                                    key.toLowerCase() === connector.toLowerCase()
                                );
                                if (matched) {
                                    connector = matched;
                                }
                            }
                        }
                        
                        const toolConfig = connector ? getToolConfig(connector) : null;
                        
                        return [{
                            id: generateId(),
                            category: category,
                            connector: connector,
                            connectorIconName: toolConfig?.iconName,
                            authenticationType: '',
                            url: '',
                            credentialName: '',
                            username: '',
                            usernameEncryption: 'Plaintext',
                            apiKey: '',
                            apiKeyEncryption: 'Encrypted',
                            personalAccessToken: '',
                            tokenEncryption: 'Plaintext',
                            githubInstallationId: '',
                            githubInstallationIdEncryption: 'Plaintext',
                            githubApplicationId: '',
                            githubApplicationIdEncryption: 'Plaintext',
                            githubPrivateKey: '',
                            urlType: category === 'code' && connector?.toLowerCase() === 'github' ? 'Account' : undefined,
                            connectionType: category === 'code' && connector?.toLowerCase() === 'github' ? 'HTTP' : undefined,
                            githubAccountUrl: '',
                            status: true,
                            description: ''
                        }];
                    })()}
                    fixedCategoryAndConnector={true}
                    selectedEnterprise={selectedEnterprise}
                    selectedEnterpriseId={selectedEnterpriseId}
                    selectedAccountId={selectedAccountId}
                    selectedAccountName={selectedAccountName}
                    workstream={buildRow?.entity || ''}
                    product={buildRow?.product || ''}
                    service={buildRow?.service || ''}
                    fromBuilds={true}
                />,
                document.body
            )}

            {/* Environment Modal - Rendered via Portal to document.body for Deploy stages */}
            {selectedStageForEnvironment && typeof window !== 'undefined' && createPortal(
                <EnvironmentModal
                    isOpen={isEnvironmentModalOpen}
                    onClose={() => {
                        setIsEnvironmentModalOpen(false);
                        setSelectedStageForEnvironment(null);
                    }}
                    onSave={(connectors: any[]) => {
                        // Handle bulk save
                        console.log('💾 [PipelineStagesSubRow] Saving environments:', connectors);
                    }}
                    onSaveIndividual={(connectors: any[], environmentNameFromModal?: string, descriptionFromModal?: string) => {
                        // Handle individual save - create new environment row
                        console.log('💾 [PipelineStagesSubRow] ========== SAVE BUTTON CLICKED ==========');
                        console.log('💾 [PipelineStagesSubRow] onSaveIndividual called from EnvironmentModal');
                        console.log('💾 [PipelineStagesSubRow] Environment Name from modal header:', environmentNameFromModal);
                        console.log('💾 [PipelineStagesSubRow] Description from modal header:', descriptionFromModal);
                        console.log('💾 [PipelineStagesSubRow] Connectors array:', connectors);
                        
                        if (connectors.length === 0) return;

                        const connector = connectors[0];
                        const workstream = buildRow?.entity || '';
                        const product = buildRow?.product || '';
                        const service = buildRow?.service || '';

                        // Use environment name from modal header
                        const environmentName = environmentNameFromModal?.trim() || connector.connector || 'New Environment';
                        console.log('💾 [PipelineStagesSubRow] Final environment name to save:', environmentName);

                        try {
                            const LOCAL_STORAGE_ENVIRONMENTS_KEY = 'environments_environments_data';
                            const storageKey = `${LOCAL_STORAGE_ENVIRONMENTS_KEY}_${selectedAccountId}_${selectedEnterpriseId}`;
                            const stored = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) : null;
                            
                            let allEnvironments: EnvironmentRow[] = [];
                            if (stored) {
                                allEnvironments = JSON.parse(stored);
                            }

                            // Check if environment with same name already exists
                            const existingEnvironment = allEnvironments.find(
                                env => env.connectorName === environmentName &&
                                env.entity === workstream &&
                                env.product === product &&
                                env.service === service
                            );

                            let environmentRowId: string;
                            if (existingEnvironment) {
                                // Update existing environment
                                existingEnvironment.connectors = connectors;
                                existingEnvironment.connectorIconName = connector.connectorIconName;
                                existingEnvironment.description = descriptionFromModal || '';
                                environmentRowId = existingEnvironment.id;
                            } else {
                                // Create new environment row
                                const newEnvironmentRow: EnvironmentRow = {
                                    id: generateId(),
                                    connectorName: environmentName,
                                    entity: workstream,
                                    product: product,
                                    service: service,
                                    connectorIconName: connector.connectorIconName,
                                    connectors: connectors,
                                    description: descriptionFromModal || ''
                                };
                                allEnvironments.push(newEnvironmentRow);
                                environmentRowId = newEnvironmentRow.id;
                            }

                            // Save to localStorage
                            if (typeof window !== 'undefined') {
                                window.localStorage.setItem(storageKey, JSON.stringify(allEnvironments));
                                console.log('💾 [PipelineStagesSubRow] Saved environment to localStorage');
                                
                                // Migrate test results from temporary key to environment row ID
                                const tempTestResultKey = `temp_${environmentName}_${workstream}_${product}_${service}`;
                                const TEST_RESULTS_STORAGE_KEY = `environment_test_results_${selectedAccountId}_${selectedEnterpriseId}`;
                                const testResultsStored = window.localStorage.getItem(TEST_RESULTS_STORAGE_KEY);
                                if (testResultsStored) {
                                    try {
                                        const testResults: Record<string, { status: 'success' | 'failed'; timestamp: number }> = JSON.parse(testResultsStored);
                                        if (testResults[tempTestResultKey]) {
                                            // Migrate test result from temp key to environment row ID
                                            testResults[environmentRowId] = testResults[tempTestResultKey];
                                            delete testResults[tempTestResultKey];
                                            window.localStorage.setItem(TEST_RESULTS_STORAGE_KEY, JSON.stringify(testResults));
                                            console.log('💾 [PipelineStagesSubRow] Migrated environment test result from temp key to environment row ID:', environmentRowId);
                                            // Dispatch event to notify Status column to refresh
                                            window.dispatchEvent(new Event('environmentTestResultUpdated'));
                                        }
                                    } catch (error) {
                                        console.error('❌ [PipelineStagesSubRow] Error migrating environment test result:', error);
                                    }
                                }
                                
                                // Get the stage key for this environment
                                const stageKey = selectedStageForEnvironment?.stageKey || '';
                                if (stageKey) {
                                    // Set the environment name as selected in the dropdown
                                    console.log('💾 [PipelineStagesSubRow] Setting selected environment in dropdown:', environmentName, 'for stage:', stageKey);
                                    setSelectedEnvironments(prev => ({ ...prev, [stageKey]: environmentName }));
                                }
                                
                                // Refresh environment options by triggering a re-render
                                setEnvironmentRefreshKey(prev => prev + 1);
                            }

                            // Close modal
                            setIsEnvironmentModalOpen(false);
                            setSelectedStageForEnvironment(null);
                            console.log('✅ [PipelineStagesSubRow] ========== SAVE PROCESS COMPLETE ==========');
                        } catch (error) {
                            console.error('❌ [PipelineStagesSubRow] Error saving environment:', error);
                        }
                    }}
                    connectorName={selectedStageForEnvironment.connector || 'New Environment'}
                    initialConnectors={(() => {
                        // Pre-fill category and connector based on the stage row (Deploy/Cloud Foundry)
                        const category = 'deploy';
                        const connector = 'Cloud Foundry';
                        const toolConfig = getToolConfig(connector);
                        
                        return [{
                            id: generateId(),
                            category: category,
                            connector: connector,
                            connectorIconName: toolConfig?.iconName,
                            environmentType: undefined,
                            apiUrl: '',
                            apiCredentialName: '',
                            iflowUrl: '',
                            iflowCredentialName: '',
                            hostUrl: '',
                            authenticationType: '',
                            url: '',
                            credentialName: '',
                            username: '',
                            usernameEncryption: 'Plaintext',
                            apiKey: '',
                            apiKeyEncryption: 'Encrypted',
                            personalAccessToken: '',
                            tokenEncryption: 'Plaintext',
                            status: true,
                            description: ''
                        }];
                    })()}
                    selectedEnterprise={selectedEnterprise}
                    selectedEnterpriseId={selectedEnterpriseId}
                    selectedAccountId={selectedAccountId}
                    selectedAccountName={selectedAccountName}
                    workstream={buildRow?.entity || ''}
                    product={buildRow?.product || ''}
                    service={buildRow?.service || ''}
                    alwaysShowEditForm={true}
                    fromBuilds={true}
                />,
                document.body
            )}
        </div>
    );
}

const BuildsTable = forwardRef<any, BuildsTableProps>(({
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
    onOpenBuildDetail,
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
    const [selectedRoleForScope, setSelectedRoleForScope] = useState<BuildRow | null>(null);

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
    
    // Pipeline stages data per row
    const [pipelineStagesData, setPipelineStagesData] = useState<Record<string, {
        nodes: Array<{
            nodeName: string;
            nodeType: string;
            stages: Array<{
                name: string;
                type: string;
            }>;
        }>;
    }>>({});
    
    // Track pipeline stages state for each row (connectors, environments, repos, branches, etc.)
    const [pipelineStagesState, setPipelineStagesState] = useState<Record<string, {
        selectedConnectors: Record<string, string>;
        selectedEnvironments: Record<string, string>;
        selectedRepositoryUrls: Record<string, string>;
        connectorUrlTypes: Record<string, string>;
        connectorRepositoryUrls: Record<string, string>;
        selectedBranches: Record<string, string>;
    }>>({});
    
    // Validation state

    // Use refs to track previous values and avoid infinite loops
    const prevRowsRef = useRef<BuildRow[]>([]);
    const orderRef = useRef<string[]>([]);
    
    // Keep local state for editing, but initialize it safely
    const [localEdits, setLocalEdits] = useState<Record<string, Partial<BuildRow>>>({});
    
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
    const isFieldMissing = (row: BuildRow, field: string): boolean => {
        switch (field) {
            case 'connectorName':
                return !row.connectorName || row.connectorName.trim() === '';
            case 'entity':
                return !row.entity || row.entity.trim() === '';
            case 'pipeline':
                return !row.pipeline || row.pipeline.trim() === '';
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
            if (isFieldMissing(row, 'connectorName') ||
                isFieldMissing(row, 'entity') ||
                isFieldMissing(row, 'pipeline') ||
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
                if (isFieldMissing(row, 'connectorName') ||
                    isFieldMissing(row, 'entity') ||
                    isFieldMissing(row, 'pipeline') ||
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
                .filter(Boolean) as BuildRow[],
        [order, localRows],
    );

    // Persist helpers
    // Debounced autosave per-row to avoid excessive API traffic
    const saveTimersRef = useRef<Record<string, any>>({});
    const latestRowRef = useRef<Record<string, BuildRow>>({});
    function schedulePersist(row: BuildRow, delay = 600) {
        const rowId = String(row.id);
        latestRowRef.current[rowId] = row;
        if (saveTimersRef.current[rowId])
            clearTimeout(saveTimersRef.current[rowId]);
        saveTimersRef.current[rowId] = setTimeout(() => {
            const latest = latestRowRef.current[rowId];
            if (latest) void persistBuildRow(latest);
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

    async function persistBuildRow(row: BuildRow) {
        try {
            // Skip auto-save for temporary rows - let the parent handle account linkage auto-save
            if (String(row.id || '').startsWith('tmp-')) {
                return;
            }
            const core = {
                // Core fields for user group management
                groupName: row.connectorName,
                description: row.description,
                entity: row.entity,
                product: row.product,
                service: row.service,
            } as any;
            // Map UI state into backend details JSON expected by server
            const details = {
                // Connector specific fields
                connectorName: row.connectorName || '',
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
    const checkForDuplicate = (rowId: string, updatedRow: BuildRow): boolean => {
        // Check if combination of connectorName + entity + product + service already exists in another row
        const duplicateRow = localRows.find(row => 
            row.id !== rowId && // Exclude current row
            row.connectorName?.trim().toLowerCase() === updatedRow.connectorName?.trim().toLowerCase() &&
            row.entity?.trim().toLowerCase() === updatedRow.entity?.trim().toLowerCase() &&
            row.product?.trim().toLowerCase() === updatedRow.product?.trim().toLowerCase() &&
            row.service?.trim().toLowerCase() === updatedRow.service?.trim().toLowerCase() &&
            // Only check for duplicates if all key fields are filled
            updatedRow.connectorName?.trim() && 
            updatedRow.entity?.trim() && 
            updatedRow.product?.trim() && 
            updatedRow.service?.trim()
        );
        
        return !!duplicateRow;
    };

    function updateRowField(rowId: string, key: keyof BuildRow, value: any) {
        let changed: BuildRow | null = null;
        
        // Update local edits instead of directly modifying localRows
        setLocalEdits(prev => {
            // Use baseLocalRows with current edits to avoid circular dependency
            const baseRow = baseLocalRows.find(r => r.id === rowId);
            if (baseRow) {
                const currentEdits = prev[rowId] || {};
                const currentRow = { ...baseRow, ...currentEdits };
                const next = {...currentRow, [key]: value} as BuildRow;
                
                // If product field is being cleared, also clear the service field
                if (key === 'product' && (!value || value.trim() === '')) {
                    next.service = '';
                }
                
                // Check for duplicates only for key fields
                if (['connectorName', 'entity', 'product', 'service'].includes(key as string)) {
                    const isDuplicate = checkForDuplicate(rowId, next);
                    if (isDuplicate) {
                        // Show duplicate modal via callback instead of browser alert
                        const message = `This combination of Job Name (${next.connectorName}), Entity (${next.entity}), Product (${next.product}), and Service (${next.service}) already exists in another row. Please use a different combination.`;
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
    const isMainRowComplete = (row: BuildRow): boolean => {
        return !!(row.connectorName && row.connectorName.trim() && 
                 row.entity && row.entity.trim() && 
                 row.product && row.product.trim() &&
                 row.service && row.service.trim());
    };

    // State for grouping
    const [groupBy, setGroupBy] = useState<
        'none' | 'connectorName' | 'entity' | 'pipeline'
    >('none');
    
    // sync external groupBy
    React.useEffect(() => {
        if (groupByExternal && groupByExternal !== 'description') {
            setGroupBy(groupByExternal as 'none' | 'connectorName' | 'entity' | 'pipeline');
        }
    }, [groupByExternal]);

    // Clean break - license management removed
    const columnOrder: BuildsTableProps['visibleColumns'] = useMemo(
        () => [
            // Build columns
            'connectorName',
            'description',
            'entity',
            'pipeline',
            'status',
            'scope',
            'connectivityStatus',
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
        connectorName: '220px', // Job Name column
        description: '250px', // Description column - needs more space
        entity: '180px', // Entity column - increased for sort arrows
        pipeline: '180px', // Pipeline column
        status: '120px', // Status column (Active/Inactive)
        roles: '70px', // Roles column - icon only (reduced size)
        scope: '100px', // Scope/Integrations column - enough for label visibility
        connectivityStatus: '150px', // Build column
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
        connectorName: { min: 200, max: 350 }, // Job Name - increased size
        description: { min: 200, max: 350 }, // Description - needs even more space
        entity: { min: 140, max: 250 }, // Entity column
        pipeline: { min: 140, max: 250 }, // Pipeline column
        status: { min: 100, max: 150 }, // Status column (Active/Inactive)
        roles: { min: 60, max: 90 }, // Roles - icon only, smaller
        scope: { min: 90, max: 120 }, // Scope/Integrations - enough for label visibility
        connectivityStatus: { min: 140, max: 200 } // Build column
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

    // Function to fetch and parse pipeline stages data
    const fetchPipelineStages = useCallback(async (pipelineName: string, rowId: string) => {
        console.log('🔍 [PipelineStages] fetchPipelineStages called:', { pipelineName, rowId, selectedAccountId, selectedEnterpriseId });
        if (!pipelineName || !selectedAccountId || !selectedEnterpriseId) {
            console.warn('⚠️ [PipelineStages] Missing required data:', { pipelineName, selectedAccountId, selectedEnterpriseId });
            return;
        }

        try {
            // Fetch pipeline data
            const apiUrl = `/api/pipeline-canvas?accountId=${selectedAccountId}&enterpriseId=${selectedEnterpriseId}`;
            const response: any = await api.get(apiUrl);
            const pipelines = Array.isArray(response) ? response : response.data || [];
            
            const pipeline = pipelines.find((p: any) => p.pipelineName === pipelineName);
            if (!pipeline || !pipeline.yamlContent) {
                console.warn(`Pipeline "${pipelineName}" not found or has no YAML content`);
                return;
            }

            // Parse YAML
            const pipelineYAML = yaml.load(pipeline.yamlContent) as PipelineYAML;
            if (!pipelineYAML || pipelineYAML.kind !== 'Pipeline') {
                console.warn(`Invalid pipeline YAML format for "${pipelineName}"`);
                return;
            }

            // Convert to nodes and edges
            const {nodes, edges} = convertFromYAML(pipeline.yamlContent);
            
            console.log('📊 [PipelineStages] Parsed nodes and edges:', {
                nodesCount: nodes.length,
                edgesCount: edges.length,
                nodes: nodes.map(n => ({ id: n.id, type: n.data.type, label: n.data.label })),
                edges: edges.map(e => ({ source: e.source, target: e.target }))
            });

            // Group stages by nodes
            const nodeMap = new Map<string, Array<{name: string; type: string}>>();
            
            // First, identify node stages (environments)
            const nodeStages = nodes.filter(n => 
                n.data.type === 'node_dev' || 
                n.data.type === 'node_qa' || 
                n.data.type === 'node_prod'
            );
            
            console.log('🔍 [PipelineStages] Found node stages:', nodeStages.map(n => ({ 
                id: n.id, 
                type: n.data.type, 
                label: n.data.label 
            })));

            // Group stages by which node they belong to
            // A stage belongs to a node if there's an edge from the node to the stage
            nodes.forEach(node => {
                // Skip node stages themselves
                if (node.data.type === 'node_dev' || 
                    node.data.type === 'node_qa' || 
                    node.data.type === 'node_prod') {
                    return;
                }

                // Find which node this stage belongs to by checking edges
                const incomingEdges = edges.filter(e => e.target === node.id);
                console.log(`🔗 [PipelineStages] Stage ${node.id} (${node.data.type}) has ${incomingEdges.length} incoming edges:`, 
                    incomingEdges.map(e => ({ source: e.source, target: e.target })));
                
                if (incomingEdges.length > 0) {
                    // Try to find a node stage in the path
                    // Check all source nodes recursively to find the root node stage
                    const findRootNode = (nodeId: string, visited: Set<string> = new Set()): any => {
                        if (visited.has(nodeId)) return null;
                        visited.add(nodeId);
                        
                        const currentNode = nodes.find(n => n.id === nodeId);
                        if (!currentNode) return null;
                        
                        // If this is a node stage, return it
                        if (currentNode.data.type === 'node_dev' || 
                            currentNode.data.type === 'node_qa' || 
                            currentNode.data.type === 'node_prod') {
                            return currentNode;
                        }
                        
                        // Otherwise, check incoming edges
                        const incoming = edges.filter(e => e.target === nodeId);
                        for (const edge of incoming) {
                            const root = findRootNode(edge.source, visited);
                            if (root) return root;
                        }
                        
                        return null;
                    };
                    
                    // Find root node for the first incoming edge
                    const rootNode = findRootNode(incomingEdges[0].source);
                    
                    if (rootNode) {
                        const nodeName = rootNode.data.label || rootNode.data.type;
                        if (!nodeMap.has(nodeName)) {
                            nodeMap.set(nodeName, []);
                        }
                        nodeMap.get(nodeName)!.push({
                            name: node.data.label || node.data.type,
                            type: node.data.type
                        });
                        console.log(`✅ [PipelineStages] Added stage ${node.data.label || node.data.type} to node ${nodeName}`);
                    } else {
                        console.log(`⚠️ [PipelineStages] Could not find root node for stage ${node.data.label || node.data.type}`);
                    }
                } else {
                    // Handle stages without incoming edges (e.g., Plan stages that might be at the root)
                    // Check if this is a Plan stage or other root-level stage
                    if (node.data.type.startsWith('plan_')) {
                        // Plan stages can be root-level, add them to a special "Plan" node
                        const planNodeName = 'Plan';
                        if (!nodeMap.has(planNodeName)) {
                            nodeMap.set(planNodeName, []);
                        }
                        nodeMap.get(planNodeName)!.push({
                            name: node.data.label || node.data.type,
                            type: node.data.type
                        });
                        console.log(`✅ [PipelineStages] Added Plan stage ${node.data.label || node.data.type} to Plan node`);
                    } else {
                        console.log(`⚠️ [PipelineStages] Stage ${node.data.label || node.data.type} has no incoming edges`);
                    }
                }
            });
            
            console.log('📋 [PipelineStages] Final nodeMap:', Array.from(nodeMap.entries()));

            // Convert to array format
            const nodesArray = Array.from(nodeMap.entries()).map(([nodeName, stages]) => {
                // Determine node type from first stage's source node
                const nodeStage = nodeStages.find(n => 
                    (n.data.label || n.data.type) === nodeName
                );
                return {
                    nodeName,
                    nodeType: nodeStage?.data.type || 'unknown',
                    stages
                };
            });

            // Update state
            console.log('✅ [PipelineStages] Setting pipeline stages data:', { rowId, nodesArray });
            setPipelineStagesData(prev => ({
                ...prev,
                [rowId]: { nodes: nodesArray }
            }));
        } catch (error) {
            console.error(`❌ [PipelineStages] Error fetching pipeline stages for "${pipelineName}":`, error);
        }
    }, [selectedAccountId, selectedEnterpriseId]);

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

    // Memoize pipeline keys to track when pipelines change
    const pipelineKeys = useMemo(() => {
        return displayItems.map(r => `${r.id}:${r.pipeline || ''}`).join('|');
    }, [displayItems]);

    // Effect to pre-fetch pipeline stages when pipeline is selected/changed (for instant expansion)
    useEffect(() => {
        displayItems.forEach(row => {
            const hasPipeline = !!row.pipeline;
            const hasData = !!pipelineStagesData[row.id];
            // Pre-fetch stages for any row with a pipeline that doesn't have data yet
            if (hasPipeline && !hasData && row.pipeline) {
                console.log(`🚀 [PipelineStages] Pre-fetching stages for row ${row.id} with pipeline "${row.pipeline}"`);
                fetchPipelineStages(row.pipeline, row.id);
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pipelineKeys, fetchPipelineStages]);

    // Effect to fetch pipeline stages when row is expanded (fallback for any missed pre-fetches)
    useEffect(() => {
        console.log('🔄 [PipelineStages] useEffect triggered:', { 
            expandedRows: Array.from(expandedRows), 
            displayItemsCount: displayItems.length,
            pipelineStagesDataKeys: Object.keys(pipelineStagesData)
        });
        displayItems.forEach(row => {
            const isExpanded = expandedRows.has(row.id);
            const hasPipeline = !!row.pipeline;
            const hasData = !!pipelineStagesData[row.id];
            console.log(`🔍 [PipelineStages] Checking row ${row.id}:`, { 
                isExpanded, 
                hasPipeline, 
                pipeline: row.pipeline,
                hasData 
            });
            if (isExpanded && hasPipeline && !hasData && row.pipeline) {
                console.log(`🚀 [PipelineStages] Fetching stages for row ${row.id} with pipeline "${row.pipeline}"`);
                fetchPipelineStages(row.pipeline, row.id);
            }
        });
    }, [expandedRows, displayItems, fetchPipelineStages, pipelineStagesData]);

    // Group data based on groupBy setting
    const groupedItems = useMemo(() => {
        if (groupBy === 'none') {
            return { 'All Records': displayItems };
        }

        const groups: Record<string, BuildRow[]> = {};
        
        displayItems.forEach((item) => {
            let groupKey = '';
            
            switch (groupBy) {
                case 'connectorName':
                    groupKey = item.connectorName || '(No Job Name)';
                    break;
                case 'entity':
                    groupKey = item.entity || '(No Entity)';
                    break;
                case 'pipeline':
                    groupKey = item.pipeline || '(No Pipeline)';
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
        const sortedGroups: Record<string, BuildRow[]> = {};
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
                            connectorName: 'Job Name',
                            description: 'Description',
                            entity: 'Workstream',
                            pipeline: 'Pipeline Name',
                            status: 'Status',
                            scope: 'Artifacts',
                            connectivityStatus: 'Builds',
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
                            connectorName: (
                                <Briefcase size={14} />
                            ),
                            description: (
                                <FileText size={14} />
                            ),
                            entity: (
                                <Building2 size={14} />
                            ),
                            pipeline: (
                                <Hammer size={14} />
                            ),
                            status: (
                                <Activity size={14} />
                            ),
                            product: (
                                <Package size={14} />
                            ),
                            service: (
                                <Settings size={14} />
                            ),
                            scope: (
                                <Layers size={14} />
                            ),
                            connectivityStatus: (
                                <Boxes size={14} />
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
                                                (c === 'scope' || c === 'connectivityStatus') && idx === cols.length - 1 ? 'border-r-0' : 'border-r border-slate-200' // Remove right border for last column
                                            }`}
                                            style={c === 'scope' ? { minWidth: '100px' } : undefined} // Width for scope/connector - enough for label
                                        >
                                            <div className='flex items-center gap-2 pr-12'>
                                                {iconFor[c] && iconFor[c]}
                                                <span>{labelFor[c] || c}</span>
                                            </div>
                                            {[
                                                'connectorName',
                                                'description',
                                                'entity',
                                                'product',
                                                'service',
                                            ].includes(c) && (
                                                <div className="inline-flex items-center absolute right-8 top-1/2 -translate-y-1/2">
                                                    <div className="relative inline-flex items-center justify-center" style={{ width: '24px', height: '24px' }}>
                                                        {/* Base combined icon - use separate arrows to allow individual coloring */}
                                                        <div className="relative inline-flex items-center justify-center" style={{ width: '24px', height: '24px' }}>
                                                            <ArrowUpIcon 
                                                                className={`absolute h-4 w-4 transition-all duration-300 ${(sortCol === c && sortDir === 'asc') ? 'text-green-600 font-bold' : 'text-slate-600'}`}
                                                                style={{ 
                                                                    top: '2px',
                                                                    left: '1px',
                                                                    strokeWidth: (sortCol === c && sortDir === 'asc') ? '2.5' : '2'
                                                                }}
                                                            />
                                                            <ArrowDownIcon 
                                                                className={`absolute h-4 w-4 transition-all duration-300 ${(sortCol === c && sortDir === 'desc') ? 'text-green-600 font-bold' : 'text-slate-600'}`}
                                                                style={{ 
                                                                    bottom: '3px',
                                                                    right: '2px',
                                                                    strokeWidth: (sortCol === c && sortDir === 'desc') ? '2.5' : '2'
                                                                }}
                                                            />
                                                        </div>
                                                        {/* Clickable areas for up and down arrows */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleSort(c as any, 'asc');
                                                            }}
                                                            className={`absolute top-0 left-0 w-full h-1/2 cursor-pointer hover:bg-green-50/30`}
                                                            aria-label="Sort ascending"
                                                            title="Sort ascending"
                                                        />
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleSort(c as any, 'desc');
                                                            }}
                                                            className={`absolute bottom-0 left-0 w-full h-1/2 cursor-pointer hover:bg-green-50/30`}
                                                            aria-label="Sort descending"
                                                            title="Sort descending"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            {/* Show resize handle for resizable columns but not for last column */}
                                            {['connectorName', 'description', 'entity', 'product', 'service'].includes(c) && (
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
                                            {c === 'connectorName' && (
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
                                <div key={r.id} className={expandedRows.has(r.id) ? 'mb-2' : ''}>
                                    <SortableBuildRow
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
                                        expandedContent={
                                            (() => {
                                                const isExpanded = expandedRows.has(r.id);
                                                const hasData = !!pipelineStagesData[r.id];
                                                console.log(`📋 [PipelineStages] Rendering row ${r.id}:`, { 
                                                    isExpanded, 
                                                    hasData, 
                                                    pipeline: r.pipeline,
                                                    pipelineStagesData: pipelineStagesData[r.id]
                                                });
                                                return isExpanded && hasData ? (
                                                    <PipelineStagesSubRow
                                                        stagesData={pipelineStagesData[r.id]}
                                                        rowId={r.id}
                                                        buildRow={r}
                                                        selectedAccountId={selectedAccountId}
                                                        selectedEnterpriseId={selectedEnterpriseId}
                                                        selectedAccountName={selectedAccountName}
                                                        selectedEnterprise={selectedEnterprise}
                                                        initialPipelineStagesState={r.pipelineStagesState}
                                                        onStateChange={(state) => {
                                                            // Only update if state actually changed (deep comparison)
                                                            const currentStateStr = JSON.stringify(r.pipelineStagesState || {});
                                                            const newStateStr = JSON.stringify(state);
                                                            if (currentStateStr !== newStateStr) {
                                                                // Update the row's pipelineStagesState
                                                                updateRowField(r.id, 'pipelineStagesState', state);
                                                                // Also update local tracking
                                                                setPipelineStagesState(prev => ({ ...prev, [r.id]: state }));
                                                            }
                                                        }}
                                                    />
                                                ) : null;
                                            })()
                                        }
                                        onUpdateField={updateRowField}
                                        isSelected={selectedRowId === r.id}
                                        onSelect={(id: string) => setSelectedRowId(id)}
                                        onStartFill={() => {}}
                                        inFillRange={false}
                                        onDeleteClick={handleDeleteClick}
                                        shouldShowHorizontalScroll={shouldShowHorizontalScroll}
                                        onOpenAddressModal={onOpenAddressModal}
                                        onOpenUserGroupModal={onOpenUserGroupModal}
                                        onOpenScopeModal={onOpenScopeModal || ((row: BuildRow) => {
                                            setSelectedRoleForScope(row);
                                            setShowScopeModal(true);
                                        })}
                                        onShowStartDateProtectionModal={onShowStartDateProtectionModal}
                                        onShowGlobalValidationModal={showGlobalValidationModal}
                                        selectedEnterprise={selectedEnterprise}
                                        selectedEnterpriseId={selectedEnterpriseId}
                                        selectedAccountId={selectedAccountId}
                                        selectedAccountName={selectedAccountName}
                                        onOpenBuildDetail={onOpenBuildDetail}
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
                                    title="Add new build row"
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
                                                <SortableBuildRow
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
                                                    expandedContent={
                                                        expandedRows.has(r.id) && pipelineStagesData[r.id] ? (
                                                            <PipelineStagesSubRow
                                                                stagesData={pipelineStagesData[r.id]}
                                                                rowId={r.id}
                                                                buildRow={r}
                                                                selectedAccountId={selectedAccountId}
                                                                selectedEnterpriseId={selectedEnterpriseId}
                                                                selectedAccountName={selectedAccountName}
                                                                selectedEnterprise={selectedEnterprise}
                                                                initialPipelineStagesState={r.pipelineStagesState}
                                                                onStateChange={(state) => {
                                                                    // Only update if state actually changed (deep comparison)
                                                                    const currentStateStr = JSON.stringify(r.pipelineStagesState || {});
                                                                    const newStateStr = JSON.stringify(state);
                                                                    if (currentStateStr !== newStateStr) {
                                                                        // Update the row's pipelineStagesState
                                                                        updateRowField(r.id, 'pipelineStagesState', state);
                                                                        // Also update local tracking
                                                                        setPipelineStagesState(prev => ({ ...prev, [r.id]: state }));
                                                                    }
                                                                }}
                                                            />
                                                        ) : null
                                                    }
                                                    onUpdateField={updateRowField}
                                                    isSelected={selectedRowId === r.id}
                                                    onSelect={(id: string) => setSelectedRowId(id)}
                                                    onStartFill={() => {}}
                                                    inFillRange={false}
                                                    onDeleteClick={handleDeleteClick}
                                                    shouldShowHorizontalScroll={shouldShowHorizontalScroll}
                                                    onOpenAddressModal={onOpenAddressModal}
                                                    onOpenUserGroupModal={onOpenUserGroupModal}
                                                    onOpenScopeModal={onOpenScopeModal || ((row: BuildRow) => {
                                                        setSelectedRoleForScope(row);
                                                        setShowScopeModal(true);
                                                    })}
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
                                        title="Add new build row"
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

            {/* Scope Config Modal - Only show if onOpenScopeModal prop is not provided */}
            {!onOpenScopeModal && (
                <ScopeConfigModal
                    isOpen={showScopeModal}
                    onClose={() => {
                        setShowScopeModal(false);
                        setSelectedRoleForScope(null);
                    }}
                    roleName={selectedRoleForScope?.connectorName || ''}
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
            )}
        </div>
    );
});

// Set the display name for debugging
BuildsTable.displayName = 'BuildsTable';

export default BuildsTable;
