'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Plus, Shield, X } from 'lucide-react';
import { generateId } from '@/utils/id-generator';
import { api } from '@/utils/api';

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

interface AssignedUserGroupTableProps {
    userGroups: UserGroup[];
    onUpdateUserGroups: (groups: UserGroup[]) => void;
    searchQuery?: string;
    onDeleteClick?: (groupId: string) => void;
    compressingGroupId?: string | null;
    foldingGroupId?: string | null;
    selectedEnterprise?: string;
    selectedEnterpriseId?: string;
    selectedAccountId?: string;
    selectedAccountName?: string;
    validationErrors?: Set<string>;
    showValidationErrors?: boolean;
    onAddNewRow?: () => void;
    availableGroups?: UserGroup[]; // List of all available groups from database for reference
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
}: {
    value: string;
    onCommit: (next: string) => void;
    onRemove: () => void;
    isError?: boolean;
    className?: string;
    dataAttr?: string;
    placeholder?: string;
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

    if (editing || !value || value.length === 0) {
        return (
            <div className="relative" style={{padding: '2px', margin: '-2px'}}>
            <input
                ref={inputRef}
                type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={commit}
                    onKeyDown={(e: any) => {
                        if (e.key === 'Enter') {
                            commit();
                        }
                        if (e.key === 'Escape') cancel();
                    }}
                    className={`min-w-0 w-full rounded-sm border ${isError ? 'border-red-500 bg-red-50 ring-2 ring-red-200' : 'border-blue-300 bg-white'} px-1 py-1 text-[12px] focus:outline-none focus:ring-2 ${isError ? 'focus:ring-red-200 focus:border-red-500' : 'focus:ring-blue-200 focus:border-blue-500'} ${
                        className || ''
                    }`}
                    data-inline={dataAttr || undefined}
                placeholder={placeholder}
                />
            </div>
        );
    }
    
    return (
        <ChipDisplay
            value={value}
            onRemove={onRemove}
            onEdit={() => setEditing(true)}
            className={className}
        />
    );
}

// AsyncChipSelect for Group Name with dropdown and + sign for new values
function AsyncChipSelectGroupName({
    value,
    onChange,
    placeholder = '',
    isError = false,
    userGroups = [],
    availableGroups = [],
    selectedAccountId = '',
    selectedAccountName = '',
    selectedEnterpriseId = '',
    selectedEnterprise = '',
    onNewItemCreated,
}: {
    value?: string;
    onChange: (next?: string) => void;
    placeholder?: string;
    isError?: boolean;
    userGroups?: UserGroup[];
    availableGroups?: UserGroup[];
    selectedAccountId?: string;
    selectedAccountName?: string;
    selectedEnterpriseId?: string;
    selectedEnterprise?: string;
    onNewItemCreated?: (item: {id: string; name: string}) => void;
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

    // Load options from availableGroups prop (already filtered by account/enterprise)
    const loadAllOptions = useCallback(async () => {
        console.log('🔄 [GroupName] loadAllOptions called');
        console.log('📦 [GroupName] Using availableGroups prop (filtered by account/enterprise), count:', availableGroups.length);
        setLoading(true);
        try {
            // Transform availableGroups to dropdown format
            const transformedData = availableGroups.map((group: UserGroup) => ({
                id: group.id || String(Math.random()),
                name: group.groupName || ''
            })).filter((item: any) => item.name); // Filter out items without names
            
            // Filter out group names that are already used in the current modal table
            // This prevents duplicate group names within the same user's assigned groups
            const usedGroupNames = new Set(
                userGroups
                    .map(ug => ug.groupName?.toLowerCase().trim())
                    .filter(name => name) // Remove empty/null names
            );
            
            const availableData = transformedData.filter(item => 
                !usedGroupNames.has(item.name.toLowerCase().trim())
            );
            
            console.log(`📋 [GroupName] Total available groups: ${transformedData.length}`);
            console.log(`📋 [GroupName] Already used in modal table: ${usedGroupNames.size}`);
            console.log(`📋 [GroupName] Available (unused) group names: ${availableData.length}`);
            console.log(`📋 [GroupName] Available group names for dropdown:`, availableData.map(d => d.name));
            setAllOptions(availableData);
        } catch (error) {
            console.error('❌ [GroupName] Failed to load availableGroups:', error);
            setAllOptions([]);
        } finally {
            setLoading(false);
            console.log('🏁 [GroupName] loadAllOptions completed, loading set to false');
        }
    }, [availableGroups, userGroups]);

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

    // Filter options - exactly like Enterprise field
    const filterOptions = useCallback(() => {
        console.log('🔍 [GroupName] filterOptions called', { allOptionsLength: allOptions.length, query });
        if (allOptions.length === 0) {
            console.log('⚠️ [GroupName] allOptions is empty, setting options to []');
            setOptions([]);
            return;
        }
        let filtered = allOptions;
        
        // Filter out already selected group names (except current value)
        const selectedGroupNames = userGroups
            .map(g => g.groupName?.trim().toLowerCase())
            .filter(name => name && name !== value?.trim().toLowerCase()); // Exclude current value
        
        if (selectedGroupNames.length > 0) {
            filtered = filtered.filter(opt => 
                !selectedGroupNames.includes(opt.name.toLowerCase())
            );
            console.log(`🔍 [GroupName] After filtering already selected groups: ${filtered.length} items (excluded: ${selectedGroupNames.length})`);
        }
        
        // Apply search filter
        if (query) {
            const queryLower = query.toLowerCase();
            filtered = filtered.filter(opt => 
                opt.name.toLowerCase().startsWith(queryLower)
            );
            console.log(`🔍 [GroupName] After startsWith filter (${queryLower}): ${filtered.length} items`, filtered);
            
            // Sort filtered results: exact matches first, then alphabetical - exactly like Enterprise
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
        
        console.log(`✅ [GroupName] Setting options to ${filtered.length} filtered items`);
        setOptions(filtered);
    }, [allOptions, query, userGroups, value]);

    useEffect(() => {
        filterOptions();
    }, [filterOptions]);

    const addNew = async () => {
        const name = (query || '').trim();
        if (!name) return;

        // Check if group name is already used in the current modal table (duplicate check)
        const isDuplicateInTable = userGroups.some(
            ug => ug.groupName?.toLowerCase().trim() === name.toLowerCase()
        );
        
        if (isDuplicateInTable) {
            console.log('❌ [GroupName] Duplicate group name detected in modal table:', name);
            alert(`Group name "${name}" is already assigned to this user. Cannot assign the same group twice.`);
            return;
        }

        // Check for existing entries (case-insensitive) - exactly like Enterprise field
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
            // Create new user group in database via API with account/enterprise context
            console.log('➕ [GroupName] Creating new group:', name);
            console.log('📦 [GroupName] Account/Enterprise context:', {
                selectedAccountId,
                selectedAccountName,
                selectedEnterpriseId,
                selectedEnterprise
            });
            
            // Include account/enterprise context in request body - exactly like Manage User Groups Save All
            const groupData = {
                name,
                groupName: name,
                accountId: selectedAccountId,
                accountName: selectedAccountName,
                enterpriseId: selectedEnterpriseId,
                enterpriseName: selectedEnterprise
            };
            
            console.log('🌐 [GroupName] Creating group with context:', groupData);
            
            const created = await api.post<{id: string; name: string} | any>(
                '/api/user-management/groups',
                groupData
            );
            
            console.log('✅ [GroupName] Group created:', created);
            
            // Transform response to match expected format
            const formattedCreated = {
                id: created?.id || created?.groupId || String(Math.random()),
                name: created?.name || created?.groupName || name
            };
            
            if (formattedCreated) {
                // Add newly created to the dropdown list and select it
                setOptions((prev) => {
                    const exists = prev.some((o) => o.id === formattedCreated.id);
                    return exists ? prev : [...prev, formattedCreated];
                });
                // Also add to allOptions for future exact match checking
                setAllOptions((prev) => {
                    const exists = prev.some((o) => o.id === formattedCreated.id);
                    return exists ? prev : [...prev, formattedCreated];
                });
                onChange(formattedCreated.name);
                setCurrent(formattedCreated.name);
                setQuery('');
                setOpen(false);
                setHasPendingNewValue(false);
                
                // Focus the chip after creating new value so Tab navigation works
                setTimeout(() => {
                    try {
                        // Find the chip element (which now has tabIndex=0 and is focusable)
                        if (inputRef.current) {
                            // inputRef should now point to the chip (motion.span)
                            if (inputRef.current.tagName === 'SPAN' || inputRef.current.getAttribute('tabindex') !== null) {
                                inputRef.current.focus();
                                console.log('🎯 [GroupName] Focused chip after creation');
                            } else {
                                // If inputRef is still the input, find the chip
                                const chipElement = containerRef.current?.querySelector('span[tabindex="0"]') as HTMLElement;
                                if (chipElement) {
                                    chipElement.focus();
                                    console.log('🎯 [GroupName] Focused chip after creation (found via querySelector)');
                                }
                            }
                        }
                    } catch (e) {
                        console.log('🎯 [GroupName] Error focusing chip after creation:', e);
                    }
                }, 100); // Small delay to ensure React state updates are complete
                
                // Notify parent component about the new item
                if (onNewItemCreated) {
                    onNewItemCreated(formattedCreated);
                }
            }
        } catch (error: any) {
            console.error('Failed to create userGroup:', error);
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
                            // Handle Tab navigation from the chip to next field (Description)
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
                            console.log('⌨️ [GroupName] onChange:', { newValue, allOptionsLength: allOptions.length, open });
                            setQuery(newValue);
                            // Always open dropdown when typing to show options or + button
                            console.log('📂 [GroupName] Setting open to true');
                            setOpen(true);
                            // Calculate position immediately
                            if (containerRef.current) {
                                const containerRect = containerRef.current.getBoundingClientRect();
                                const width = Math.max(140, Math.min(200, containerRect.width));
                                const top = containerRect.bottom + 2;
                                const left = containerRect.left;
                                console.log('📍 [GroupName] Setting dropdown position:', { top, left, width });
                                setDropdownPortalPos({ top, left, width });
                            }
                            // Reload options to exclude already-used group names
                            console.log('📥 [GroupName] Reloading options to filter out used group names');
                            loadAllOptions();
                            // Clear current selection if user clears the input completely
                            if (newValue === '') {
                                onChange('');
                                setCurrent('');
                            }
                        }}
                        onFocus={() => {
                            console.log('👁️ [GroupName] onFocus:', { allOptionsLength: allOptions.length, open, query });
                            setOpen(true);
                            // Calculate position immediately on focus
                            if (containerRef.current) {
                                const containerRect = containerRef.current.getBoundingClientRect();
                                const width = Math.max(140, Math.min(200, containerRect.width));
                                const top = containerRect.bottom + 2;
                                const left = containerRect.left;
                                console.log('📍 [GroupName] Setting dropdown position on focus:', { top, left, width });
                                setDropdownPortalPos({ top, left, width });
                            }
                            // Always reload options on focus to exclude already-used group names
                            console.log('📥 [GroupName] Reloading options on focus to filter out used group names');
                            loadAllOptions();
                        }}
                        onKeyDown={async (e: any) => {
                            if (e.key === 'Enter' && query.trim()) {
                                e.preventDefault(); // Prevent form submission
                                e.stopPropagation(); // Stop event bubbling
                                
                                // Check for exact match first - exactly like Enterprise
                                const exactMatch = allOptions.find(opt => 
                                    opt.name.toLowerCase() === query.toLowerCase().trim()
                                );
                                
                                if (exactMatch) {
                                    // Double-check for duplicate (safeguard)
                                    const isDuplicate = userGroups.some(
                                        ug => ug.groupName?.toLowerCase().trim() === exactMatch.name.toLowerCase().trim()
                                    );
                                    
                                    if (isDuplicate) {
                                        console.log('❌ [GroupName] Cannot select duplicate group name:', exactMatch.name);
                                        alert(`Group name "${exactMatch.name}" is already assigned to this user. Cannot assign the same group twice.`);
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
                                    
                                    // Focus the chip after selecting existing value so Tab navigation works
                                    setTimeout(() => {
                                        try {
                                            // Find the chip element (which now has tabIndex=0 and is focusable)
                                            if (inputRef.current) {
                                                // inputRef should now point to the chip (motion.span)
                                                if (inputRef.current.tagName === 'SPAN' || inputRef.current.getAttribute('tabindex') !== null) {
                                                    inputRef.current.focus();
                                                    console.log('🎯 [GroupName] Focused chip after Enter on existing value');
                                                } else {
                                                    // If inputRef is still the input, find the chip
                                                    const chipElement = containerRef.current?.querySelector('span[tabindex="0"]') as HTMLElement;
                                                    if (chipElement) {
                                                        chipElement.focus();
                                                        console.log('🎯 [GroupName] Focused chip after Enter on existing value (found via querySelector)');
                                                    }
                                                }
                                            }
                                        } catch (e) {
                                            console.log('🎯 [GroupName] Error focusing chip after Enter on existing value:', e);
                                        }
                                    }, 100); // Small delay to ensure React state updates are complete
                                } else {
                                    // Create new entry (same logic as Add button) - exactly like Enterprise
                                    await addNew();
                                }
                            } else if (e.key === 'Escape') {
                                setOpen(false);
                                setQuery('');
                            } else if (e.key === 'Tab') {
                                // Check if user has entered a new value that doesn't exist - exactly like Enterprise
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
                                
                                // If existing value, allow Tab to navigate
                                if (query.trim()) {
                                    const exactMatch = allOptions.find(opt => 
                                        opt.name.toLowerCase() === query.toLowerCase().trim()
                                    );
                                    if (exactMatch) {
                                        // Double-check for duplicate (safeguard)
                                        const isDuplicate = userGroups.some(
                                            ug => ug.groupName?.toLowerCase().trim() === exactMatch.name.toLowerCase().trim()
                                        );
                                        
                                        if (isDuplicate) {
                                            console.log('❌ [GroupName] Cannot select duplicate group name:', exactMatch.name);
                                            alert(`Group name "${exactMatch.name}" is already assigned to this user. Cannot assign the same group twice.`);
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
                                        
                                        // Focus the chip after selecting existing value so Tab navigation works
                                        setTimeout(() => {
                                            try {
                                                // Find the chip element (which now has tabIndex=0 and is focusable)
                                                const chipElement = containerRef.current?.querySelector('span[tabindex="0"]') as HTMLElement;
                                                if (chipElement) {
                                                    chipElement.focus();
                                                    console.log('🎯 [GroupName] Focused chip after Tab on existing value');
                                                    
                                                    // Now trigger Tab navigation to next field
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
                                                console.log('🎯 [GroupName] Error focusing chip after Tab on existing value:', e);
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
                            // Check if the blur is due to clicking within the dropdown - exactly like Enterprise
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
            
            {(() => {
                console.log('🚪 [GroupName] Dropdown render check:', {
                    open,
                    hasDropdownPortalPos: !!dropdownPortalPos,
                    dropdownPortalPos
                });
                return null;
            })()}
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
                                console.log('🎨 [GroupName] Rendering dropdown content', {
                                    query: query.trim(),
                                    optionsLength: options.length,
                                    allOptionsLength: allOptions.length,
                                    loading
                                });
                                
                                // Filter options that match the query (show all if no query) - exactly like Enterprise
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
                                
                                console.log('🔍 [GroupName] filteredOptions:', filteredOptions);
                                
                                // Check if query exactly matches an existing option - always check allOptions when available (database source of truth)
                                const exactMatch = query.trim() && allOptions.length > 0 ? allOptions.find(opt => 
                                    opt.name.toLowerCase() === query.toLowerCase().trim()
                                ) : null;
                                
                                console.log('🎯 [GroupName] exactMatch check:', {
                                    query: query.trim(),
                                    allOptionsLength: allOptions.length,
                                    exactMatch: exactMatch?.name || null,
                                    allOptionsSample: allOptions.slice(0, 5).map(o => o.name)
                                });
                                
                                // Show + button if:
                                // 1. Query is entered
                                // 2. Either allOptions is empty (still loading) OR no exact match found in database
                                const showCreateNew = query.trim() && (allOptions.length === 0 || !exactMatch);
                                
                                console.log('➕ [GroupName] showCreateNew calculation:', {
                                    queryTrimmed: query.trim(),
                                    queryHasValue: !!query.trim(),
                                    allOptionsEmpty: allOptions.length === 0,
                                    exactMatchFound: !!exactMatch,
                                    showCreateNew
                                });
                                
                                // Show loading only if loading AND no query entered yet
                                if (loading && allOptions.length === 0 && !query.trim()) {
                                    console.log('⏳ [GroupName] Showing loading message');
                                    return (
                                        <div className='px-3 py-2 text-slate-500 text-center'>
                                            Loading…
                                        </div>
                                    );
                                }
                                
                                // Only show "No matches" if there are no filtered options AND no new value to create AND not loading AND allOptions is loaded
                                if (filteredOptions.length === 0 && !showCreateNew && !loading && allOptions.length > 0) {
                                    console.log('🚫 [GroupName] Showing "No matches" message');
                                    return (
                                        <div className='px-3 py-2 text-slate-500 text-center'>
                                            No matches
                                        </div>
                                    );
                                }
                                
                                // Show empty state when no values exist in database
                                if (filteredOptions.length === 0 && !query.trim() && !loading && allOptions.length === 0) {
                                    console.log('📭 [GroupName] Showing "No value found" message');
                                    return (
                                        <div className='px-3 py-2 text-slate-500 text-center'>
                                            No value found
                                        </div>
                                    );
                                }
                                
                                console.log('✅ [GroupName] Rendering dropdown items and + button', {
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
                                                                    ug => ug.groupName?.toLowerCase().trim() === opt.name.toLowerCase().trim()
                                                                );
                                                                
                                                                if (isDuplicate) {
                                                                    console.log('❌ [GroupName] Cannot select duplicate group name:', opt.name);
                                                                    alert(`Group name "${opt.name}" is already assigned to this user. Cannot assign the same group twice.`);
                                                                    return;
                                                                }
                                                                
                                                                onChange(opt.name);
                                                                setCurrent(opt.name);
                                                                setQuery('');
                                                                setOpen(false);
                                                                setHasPendingNewValue(false);
                                                                
                                                                // Focus the chip after selecting existing value so Tab navigation works
                                                                setTimeout(() => {
                                                                    try {
                                                                        // Find the chip element (which now has tabIndex=0 and is focusable)
                                                                        if (inputRef.current) {
                                                                            // inputRef should now point to the chip (motion.span)
                                                                            if (inputRef.current.tagName === 'SPAN' || inputRef.current.getAttribute('tabindex') !== null) {
                                                                                inputRef.current.focus();
                                                                                console.log('🎯 [GroupName] Focused chip after selecting existing value');
                                                                            } else {
                                                                                // If inputRef is still the input, find the chip
                                                                                const chipElement = containerRef.current?.querySelector('span[tabindex="0"]') as HTMLElement;
                                                                                if (chipElement) {
                                                                                    chipElement.focus();
                                                                                    console.log('🎯 [GroupName] Focused chip after selecting existing value (found via querySelector)');
                                                                                }
                                                                            }
                                                                        }
                                                                    } catch (e) {
                                                                        console.log('🎯 [GroupName] Error focusing chip after selecting existing value:', e);
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
                                            
                                            {/* Add button inside scrollable area - exactly like EnterpriseConfigTable */}
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
                                                            console.log('🖱️ [GroupName] + button clicked for:', query.trim());
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

// AsyncChipSelect for Product with dropdown filtered by Enterprise
function AsyncChipSelectProduct({
    value,
    onChange,
    placeholder = '',
    isError = false,
    selectedEnterprise = '',
    selectedAccountId = '',
    onNewItemCreated,
}: {
    value?: string;
    onChange: (next?: string) => void;
    placeholder?: string;
    isError?: boolean;
    selectedEnterprise?: string;
    selectedAccountId?: string;
    onNewItemCreated?: (item: {id: string; name: string}) => void;
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

    // Load options from account licenses filtered by Account and Enterprise - exactly like Manage User Groups
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
        if (open && allOptions.length === 0 && selectedAccountId) {
            loadAllOptions();
        }
    }, [open, allOptions.length, selectedAccountId, loadAllOptions]);

    // Reload options when account or enterprise changes - exactly like Manage User Groups
    useEffect(() => {
        if (selectedAccountId && selectedEnterprise) {
            console.log('🔄 [Product] Account or Enterprise changed, clearing and reloading options');
            setAllOptions([]);
            if (open) {
                loadAllOptions();
            }
        }
    }, [selectedAccountId, selectedEnterprise, open, loadAllOptions]);

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
                
                setTimeout(() => {
                    try {
                        if (inputRef.current) {
                            if (inputRef.current.tagName === 'SPAN' || inputRef.current.getAttribute('tabindex') !== null) {
                                inputRef.current.focus();
                            } else {
                                const chipElement = containerRef.current?.querySelector('span[tabindex="0"]') as HTMLElement;
                                if (chipElement) {
                                    chipElement.focus();
                                }
                            }
                        }
                    } catch (e) {
                        console.log('Error focusing chip after creation:', e);
                    }
                }, 100);
                
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
                            if (e.key === 'Tab' && !e.shiftKey) {
                                e.preventDefault();
                                e.stopPropagation();
                                
                                // Wait for state to update, then navigate to Service
                                setTimeout(() => {
                                    const currentElement = e.target as HTMLElement;
                                    const currentColDiv = currentElement.closest('[data-col]');
                                    const currentRowId = currentColDiv?.getAttribute('data-row-id');
                                    if (currentRowId) {
                                        const nextColDiv = document.querySelector(`[data-row-id="${currentRowId}"][data-col="service"]`);
                                        if (nextColDiv) {
                                            // Find any input (even if disabled, we'll handle it)
                                            const serviceInput = nextColDiv.querySelector('input') as HTMLInputElement;
                                            const serviceChip = nextColDiv.querySelector('span[tabindex="0"]') as HTMLElement;
                                            
                                            if (serviceInput) {
                                                // Try to focus and click, even if disabled
                                                const wasDisabled = serviceInput.disabled;
                                                
                                                // Get the Product value from the row to check if Service should be enabled
                                                const productColDiv = document.querySelector(`[data-row-id="${currentRowId}"][data-col="product"]`);
                                                const productChip = productColDiv?.querySelector('span[tabindex="0"]') as HTMLElement;
                                                const productInput = productColDiv?.querySelector('input') as HTMLInputElement;
                                                const productValue = productChip?.textContent?.trim() || productInput?.value?.trim() || '';
                                                
                                                // Enable if Product is selected
                                                if (productValue && selectedEnterprise) {
                                                    serviceInput.disabled = false;
                                                    serviceInput.focus();
                                                    serviceInput.click();
                                                } else if (!wasDisabled) {
                                                    serviceInput.focus();
                                                    serviceInput.click();
                                                }
                                            } else if (serviceChip) {
                                                serviceChip.focus();
                                                serviceChip.click();
                                            }
                                        }
                                    }
                                }, 100); // Longer delay to ensure React state has updated
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
                                    setTimeout(() => {
                                        try {
                                            if (inputRef.current) {
                                                if (inputRef.current.tagName === 'SPAN' || inputRef.current.getAttribute('tabindex') !== null) {
                                                    inputRef.current.focus();
                                                } else {
                                                    const chipElement = containerRef.current?.querySelector('span[tabindex="0"]') as HTMLElement;
                                                    if (chipElement) {
                                                        chipElement.focus();
                                                    }
                                                }
                                            }
                                        } catch (e) {
                                            console.log('Error focusing chip:', e);
                                        }
                                    }, 100);
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
                                    console.log('🔷 [Product] Selecting exact match:', exactMatch.name);
                                    onChange(exactMatch.name);
                                    setCurrent(exactMatch.name);
                                    setQuery('');
                                    setOpen(false);
                                    setHasPendingNewValue(false);
                                    // Wait for state to update before navigating
                                    setTimeout(() => {
                                        try {
                                            console.log('🔷 [Product] Tab pressed, navigating to Service field');
                                                const chipElement = containerRef.current?.querySelector('span[tabindex="0"]') as HTMLElement;
                                                if (chipElement) {
                                                    chipElement.focus();
                                                        setTimeout(() => {
                                                            const currentElement = chipElement;
                                                            const currentColDiv = currentElement.closest('[data-col]');
                                                            const currentRowId = currentColDiv?.getAttribute('data-row-id');
                                                            console.log('🔷 [Product] Looking for Service field in row:', currentRowId);
                                                            if (currentRowId) {
                                                                const nextColDiv = document.querySelector(`[data-row-id="${currentRowId}"][data-col="service"]`);
                                                                console.log('🔷 [Product] Service column div found:', !!nextColDiv);
                                                                if (nextColDiv) {
                                                                    // Try input first
                                                                    const serviceInput = nextColDiv.querySelector('input') as HTMLInputElement;
                                                                    const serviceChip = nextColDiv.querySelector('span[tabindex="0"]') as HTMLElement;
                                                                    console.log('🔷 [Product] Service input found:', !!serviceInput, 'Service chip found:', !!serviceChip);
                                                                    console.log('🔷 [Product] Service input disabled:', serviceInput?.disabled, 'Service input readOnly:', serviceInput?.readOnly);
                                                                    
                                                                    if (serviceInput) {
                                                                        // Check if it should be enabled (by checking if Product is selected)
                                                                        // Get the Product value from the row
                                                                        const productColDiv = document.querySelector(`[data-row-id="${currentRowId}"][data-col="product"]`);
                                                                        const productChip = productColDiv?.querySelector('span[tabindex="0"]') as HTMLElement;
                                                                        const productValue = productChip?.textContent?.trim() || '';
                                                                        console.log('🔷 [Product] Product value:', productValue, 'Selected Enterprise:', selectedEnterprise);
                                                                        
                                                                        // Enable if Product is selected
                                                                        const wasDisabled = serviceInput.disabled;
                                                                        if (productValue && selectedEnterprise) {
                                                                            console.log('🔷 [Product] Enabling Service input and focusing');
                                                                            serviceInput.disabled = false;
                                                                            serviceInput.readOnly = false;
                                                                            serviceInput.focus();
                                                                            console.log('🔷 [Product] Service input focused, clicking now');
                                                                            serviceInput.click();
                                                                        } else if (!wasDisabled) {
                                                                            console.log('🔷 [Product] Service input already enabled, focusing and clicking');
                                                                            serviceInput.focus();
                                                                            serviceInput.click();
                                                                        } else {
                                                                            console.log('⚠️ [Product] Service input is disabled and cannot be enabled');
                                                                        }
                                                                    } else if (serviceChip) {
                                                                        console.log('🔷 [Product] Service chip found, focusing and clicking');
                                                                        serviceChip.focus();
                                                                        serviceChip.click();
                                                                    } else {
                                                                        console.log('⚠️ [Product] Neither Service input nor chip found');
                                                                    }
                                                                } else {
                                                                    console.log('⚠️ [Product] Service column div not found');
                                                                }
                                                            }
                                                        }, 50);
                                                } else {
                                                    console.log('⚠️ [Product] Chip element not found');
                                                }
                                            } catch (e) {
                                                console.log('❌ [Product] Error in Tab navigation:', e);
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
                        className={`w-full text-left px-2 py-1 text-[12px] rounded border ${isError ? 'border-red-500 bg-red-50 ring-2 ring-red-200' : open ? 'border-blue-500 bg-white ring-2 ring-blue-200' : 'border-blue-300 bg-white hover:bg-slate-50'} ${!selectedEnterprise ? 'opacity-50 cursor-not-allowed' : ''} text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 ${isError ? 'focus:ring-red-200 focus:border-red-500' : 'focus:ring-blue-200 focus:border-blue-500'}`}
                        placeholder={placeholder}
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
                                
                                // Show "No matches found" when user has typed something but there are no filtered options
                                if (filteredOptions.length === 0 && query.trim() && !loading) {
                                    return (
                                        <div className='px-3 py-2 text-slate-500 text-center'>No matches found</div>
                                    );
                                }

                                // Show empty state when no options available and no query
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
                                                            setTimeout(() => {
                                                                try {
                                                                    if (inputRef.current) {
                                                                        if (inputRef.current.tagName === 'SPAN' || inputRef.current.getAttribute('tabindex') !== null) {
                                                                            inputRef.current.focus();
                                                                        } else {
                                                                            const chipElement = containerRef.current?.querySelector('span[tabindex="0"]') as HTMLElement;
                                                                            if (chipElement) {
                                                                                chipElement.focus();
                                                                            }
                                                                        }
                                                                    }
                                                                } catch (e) {
                                                                    console.log('Error focusing chip:', e);
                                                                }
                                                            }, 100);
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

// AsyncChipSelect for Service with dropdown filtered by Product
function AsyncChipSelectService({
    value,
    onChange,
    placeholder = '',
    isError = false,
    selectedEnterprise = '',
    selectedProduct = '',
    onNewItemCreated,
}: {
    value?: string;
    onChange: (next?: string) => void;
    placeholder?: string;
    isError?: boolean;
    selectedEnterprise?: string;
    selectedProduct?: string;
    onNewItemCreated?: (item: {id: string; name: string}) => void;
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

    // Load options from database API filtered by Product
    const loadAllOptions = useCallback(async (overrideProduct?: string) => {
        // Use overrideProduct if provided, otherwise use selectedProduct prop
        const productToUse = overrideProduct !== undefined ? overrideProduct : selectedProduct;
        
        console.log('🔄 [Service] loadAllOptions called', {
            selectedEnterprise,
            selectedProduct,
            overrideProduct,
            productToUse
        });
        setLoading(true);
        try {
            if (!selectedEnterprise || !productToUse) {
                console.log('⚠️ [Service] Missing dependencies, clearing options', {
                    hasEnterprise: !!selectedEnterprise,
                    hasProduct: !!productToUse
                });
                setAllOptions([]);
                setLoading(false);
                return;
            }

            // Get enterprise configuration data to find services for this enterprise/product combination
            console.log('📡 [Service] Calling API: /api/enterprise-products-services');
            const enterpriseConfigs = await api.get<Array<{
                enterprise: { name: string };
                product: { name: string };
                services: Array<{ name: string }>;
            }>>('/api/enterprise-products-services') || [];
            
            console.log('📦 [Service] API response:', enterpriseConfigs);
            
            // Extract unique service names for the selected enterprise/product combination
            const uniqueServices = Array.from(new Set(
                enterpriseConfigs
                    .filter(config => 
                        config.enterprise.name === selectedEnterprise &&
                        config.product.name === productToUse
                    )
                    .flatMap(config => config.services.map(s => s.name))
                    .filter(service => service && service.trim() !== '')
            ));
            
            console.log('✅ [Service] Filtered unique services:', uniqueServices);
            
            // Convert to the expected format
            const allData = uniqueServices.map((service, index) => ({
                id: `service-${index}`,
                name: service
            }));
            
            console.log('✅ [Service] Setting allOptions with', allData.length, 'items:', allData);
            setAllOptions(allData);
        } catch (error) {
            console.error('❌ [Service] Failed to load services:', error);
            setAllOptions([]);
        } finally {
            console.log('🏁 [Service] loadAllOptions completed, loading set to false');
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
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const dropdownHeight = 250; // Max height of dropdown
        
        // Calculate width with viewport constraints
        const idealWidth = Math.max(140, Math.min(200, containerRect.width));
        const maxWidth = Math.min(idealWidth, viewportWidth - 32); // Leave padding on sides
        const width = Math.max(140, maxWidth);
        
        // Calculate horizontal position - ensure dropdown doesn't go off-screen
        const idealLeft = containerRect.left;
        const maxLeft = viewportWidth - width - 16; // Ensure dropdown stays within viewport with padding
        const left = Math.max(16, Math.min(maxLeft, idealLeft));
        
        // Calculate vertical position - prefer below, but can use above if needed
        const spaceBelow = viewportHeight - containerRect.bottom;
        const spaceAbove = containerRect.top;
        
        let top;
        if (spaceBelow >= dropdownHeight || (spaceBelow >= spaceAbove && spaceBelow >= 150)) {
            // Position below
            top = containerRect.bottom + 2;
        } else {
            // Position above if there's more space
            top = Math.max(16, containerRect.top - dropdownHeight - 2);
        }
        
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
        console.log('🔄 [Service] useEffect triggered:', {
            open,
            allOptionsLength: allOptions.length,
            selectedEnterprise,
            selectedProduct,
            shouldLoad: open && allOptions.length === 0 && selectedEnterprise && selectedProduct
        });
        if (open && allOptions.length === 0 && selectedEnterprise && selectedProduct) {
            console.log('🔄 [Service] useEffect: Loading options');
            loadAllOptions();
        }
    }, [open, allOptions.length, selectedEnterprise, selectedProduct, loadAllOptions]);
    
    // Also reload when selectedProduct changes from empty to a value while component is mounted
    useEffect(() => {
        console.log('🔄 [Service] selectedProduct dependency changed:', {
            selectedEnterprise,
            selectedProduct,
            allOptionsLength: allOptions.length,
            shouldLoad: selectedEnterprise && selectedProduct && allOptions.length === 0
        });
        if (selectedEnterprise && selectedProduct && allOptions.length === 0) {
            console.log('🔄 [Service] selectedProduct changed effect: Loading options for product:', selectedProduct);
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
                
                setTimeout(() => {
                    try {
                        if (inputRef.current) {
                            if (inputRef.current.tagName === 'SPAN' || inputRef.current.getAttribute('tabindex') !== null) {
                                inputRef.current.focus();
                            } else {
                                const chipElement = containerRef.current?.querySelector('span[tabindex="0"]') as HTMLElement;
                                if (chipElement) {
                                    chipElement.focus();
                                }
                            }
                        }
                    } catch (e) {
                        console.log('Error focusing chip:', e);
                    }
                }, 100);
                
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

    // Helper function to get actual Product value from prop or DOM
    const getActualProduct = useCallback(() => {
        let actualProduct = selectedProduct;
        if (!actualProduct && containerRef.current) {
            const currentColDiv = containerRef.current.closest('[data-col]');
            const currentRowId = currentColDiv?.getAttribute('data-row-id');
            if (currentRowId) {
                const productColDiv = document.querySelector(`[data-row-id="${currentRowId}"][data-col="product"]`);
                const productChip = productColDiv?.querySelector('span[tabindex="0"]') as HTMLElement;
                const productInput = productColDiv?.querySelector('input') as HTMLInputElement;
                actualProduct = productChip?.textContent?.trim() || productInput?.value?.trim() || '';
                console.log('🔵 [Service] getActualProduct: Read from DOM:', actualProduct);
            }
        }
        return actualProduct;
    }, [selectedProduct]);

    return (
        <div
            ref={containerRef}
            className='relative min-w-0 flex items-center gap-1 group/item'
            style={{maxWidth: '100%', width: '100%'}}
        >
            <div 
                className='relative w-full flex items-center gap-1' 
                style={{width: '100%', minWidth: '100%'}}
                onClick={(e: any) => {
                    // Get actual Product value (from prop or DOM)
                    const actualProduct = getActualProduct();
                    
                    // Allow clicking the container to open Service dropdown if Enterprise and Product are selected
                    if (selectedEnterprise && actualProduct && !open && (!current && !value)) {
                        const target = e.target as HTMLElement;
                        if (!target.closest('button') && !target.closest('input') && !target.closest('span[tabindex]')) {
                            console.log('🔵 [Service] Container onClick: Opening dropdown', {
                                selectedEnterprise,
                                actualProduct,
                                allOptionsLength: allOptions.length
                            });
                            // Open the dropdown
                            setOpen(true);
                            if (containerRef.current) {
                                const containerRect = containerRef.current.getBoundingClientRect();
                                const width = Math.max(140, Math.min(200, containerRect.width));
                                const top = containerRect.bottom + 2;
                                const left = containerRect.left;
                                setDropdownPortalPos({ top, left, width });
                            }
                            if (allOptions.length === 0 || actualProduct !== selectedProduct) {
                                console.log('🔵 [Service] Container onClick: Loading options with product:', actualProduct);
                                loadAllOptions(actualProduct);
                            } else {
                                console.log('🔵 [Service] Container onClick: Options already loaded');
                            }
                        }
                    } else {
                        console.log('🔵 [Service] Container onClick: Cannot open', {
                            hasEnterprise: !!selectedEnterprise,
                            hasProduct: !!actualProduct,
                            isOpen: open,
                            hasValue: !!(current || value)
                        });
                    }
                }}
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
                        tabIndex={(() => {
                            const actualProduct = getActualProduct();
                            return selectedEnterprise && actualProduct ? 0 : -1;
                        })()}
                        onClick={(e: any) => {
                            // Get actual Product value (from prop or DOM)
                            const actualProduct = getActualProduct();
                            
                            console.log('🔵 [Service] Chip onClick triggered', {
                                selectedEnterprise,
                                selectedProduct,
                                actualProduct,
                                current,
                                value,
                                isButton: !!(e.target as HTMLElement).closest('button')
                            });
                            if (!(e.target as HTMLElement).closest('button')) {
                                // Only allow click if Enterprise and Product are selected (check DOM if prop is empty)
                                if (selectedEnterprise && actualProduct) {
                                    console.log('🔵 [Service] Opening dropdown on chip click');
                                    setQuery(current || value || '');
                                    setOpen(true);
                                    if (containerRef.current) {
                                        const containerRect = containerRef.current.getBoundingClientRect();
                                        const width = Math.max(140, Math.min(200, containerRect.width));
                                        const top = containerRect.bottom + 2;
                                        const left = containerRect.left;
                                        setDropdownPortalPos({ top, left, width });
                                    }
                                    if (allOptions.length === 0 || actualProduct !== selectedProduct) {
                                        console.log('🔵 [Service] Chip onClick: Loading options with product:', actualProduct);
                                        loadAllOptions(actualProduct);
                                    }
                                } else {
                                    console.log('⚠️ [Service] Cannot open dropdown - missing dependencies', {
                                        hasEnterprise: !!selectedEnterprise,
                                        hasProduct: !!actualProduct
                                    });
                                }
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
                                    const nextColDiv = document.querySelector(`[data-row-id="${currentRowId}"][data-col="roles"]`);
                                    if (nextColDiv) {
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
                            if (allOptions.length === 0 && selectedEnterprise && selectedProduct) {
                                loadAllOptions();
                            }
                            if (newValue === '') {
                                onChange('');
                                setCurrent('');
                            }
                        }}
                        onFocus={() => {
                            // Get actual Product value (from prop or DOM)
                            const actualProduct = getActualProduct();
                            
                            console.log('🔵 [Service] onFocus triggered', {
                                selectedEnterprise,
                                selectedProduct,
                                actualProduct,
                                allOptionsLength: allOptions.length,
                                currentOpen: open
                            });
                            setOpen(true);
                            if (containerRef.current) {
                                const containerRect = containerRef.current.getBoundingClientRect();
                                const width = Math.max(140, Math.min(200, containerRect.width));
                                const top = containerRect.bottom + 2;
                                const left = containerRect.left;
                                console.log('🔵 [Service] Setting dropdown position:', { top, left, width });
                                setDropdownPortalPos({ top, left, width });
                            }
                            
                            // Use actualProduct (from DOM if prop was empty)
                            if (selectedEnterprise && actualProduct) {
                                if (allOptions.length === 0 || actualProduct !== selectedProduct) {
                                    console.log('🔵 [Service] allOptions empty or product changed, calling loadAllOptions with product:', actualProduct);
                                    // Pass the actual product value to override the prop if it's empty
                                    loadAllOptions(actualProduct);
                                } else {
                                    console.log('🔵 [Service] Options already loaded:', allOptions.length);
                                }
                            } else {
                                console.log('🔵 [Service] Dependencies not met, cannot load options:', {
                                    allOptionsEmpty: allOptions.length === 0,
                                    hasEnterprise: !!selectedEnterprise,
                                    hasProduct: !!actualProduct,
                                    selectedEnterpriseValue: selectedEnterprise,
                                    selectedProductValue: selectedProduct,
                                    actualProductValue: actualProduct
                                });
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
                                    setTimeout(() => {
                                        try {
                                            if (inputRef.current) {
                                                if (inputRef.current.tagName === 'SPAN' || inputRef.current.getAttribute('tabindex') !== null) {
                                                    inputRef.current.focus();
                                                } else {
                                                    const chipElement = containerRef.current?.querySelector('span[tabindex="0"]') as HTMLElement;
                                                    if (chipElement) {
                                                        chipElement.focus();
                                                    }
                                                }
                                            }
                                        } catch (e) {
                                            console.log('Error focusing chip:', e);
                                        }
                                    }, 100);
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
                                        setTimeout(() => {
                                            try {
                                                const chipElement = containerRef.current?.querySelector('span[tabindex="0"]') as HTMLElement;
                                                if (chipElement) {
                                                    chipElement.focus();
                                                    setTimeout(() => {
                                                        const currentElement = chipElement;
                                                        const currentColDiv = currentElement.closest('[data-col]');
                                                        const currentRowId = currentColDiv?.getAttribute('data-row-id');
                                                        if (currentRowId) {
                                                            const nextColDiv = document.querySelector(`[data-row-id="${currentRowId}"][data-col="roles"]`);
                                                            if (nextColDiv) {
                                                                const rolesElement = nextColDiv.querySelector('svg') as SVGSVGElement;
                                                                if (rolesElement) {
                                                                    rolesElement.focus();
                                                                }
                                                            }
                                                        }
                                                    }, 50);
                                                }
                                            } catch (e) {
                                                console.log('Error:', e);
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
                        className={`w-full text-left px-2 py-1 text-[12px] rounded border ${isError ? 'border-red-500 bg-red-50 ring-2 ring-red-200' : open ? 'border-blue-500 bg-white ring-2 ring-blue-200' : 'border-blue-300 bg-white hover:bg-slate-50'} ${(() => {
                            const actualProduct = getActualProduct();
                            return !selectedEnterprise || !actualProduct ? 'opacity-50 cursor-not-allowed' : '';
                        })()} text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 ${isError ? 'focus:ring-red-200 focus:border-red-500' : 'focus:ring-blue-200 focus:border-blue-500'}`}
                        placeholder={placeholder}
                        disabled={(() => {
                            const actualProduct = getActualProduct();
                            return !selectedEnterprise || !actualProduct;
                        })()}
                        readOnly={(() => {
                            const actualProduct = getActualProduct();
                            return !selectedEnterprise || !actualProduct;
                        })()}
                        onClick={(e: any) => {
                            // Get actual Product value (from prop or DOM)
                            const actualProduct = getActualProduct();
                            
                            if (!selectedEnterprise || !actualProduct) {
                                console.log('🔵 [Service] Input onClick: Cannot open - missing dependencies', {
                                    hasEnterprise: !!selectedEnterprise,
                                    hasProduct: !!actualProduct
                                });
                                return;
                            }
                            
                            console.log('🔵 [Service] Input onClick: Opening dropdown', {
                                selectedEnterprise,
                                actualProduct,
                                allOptionsLength: allOptions.length
                            });
                            
                            setOpen(true);
                            if (containerRef.current) {
                                const containerRect = containerRef.current.getBoundingClientRect();
                                const width = Math.max(140, Math.min(200, containerRect.width));
                                const top = containerRect.bottom + 2;
                                const left = containerRect.left;
                                setDropdownPortalPos({ top, left, width });
                            }
                            
                            if (allOptions.length === 0 || actualProduct !== selectedProduct) {
                                console.log('🔵 [Service] Input onClick: Loading options with product:', actualProduct);
                                loadAllOptions(actualProduct);
                            } else {
                                console.log('🔵 [Service] Input onClick: Options already loaded');
                            }
                        }}
                    />
                ) : null}
            </div>
            
            {(() => {
                console.log('🚪 [Service] Dropdown render check:', {
                    open,
                    hasDropdownPortalPos: !!dropdownPortalPos,
                    dropdownPortalPos
                });
                return null;
            })()}
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
                                console.log('🎨 [Service] Rendering dropdown content', {
                                    query: query.trim(),
                                    optionsLength: options.length,
                                    allOptionsLength: allOptions.length,
                                    loading
                                });
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
                                
                                console.log('🔍 [Service] filteredOptions:', filteredOptions);
                                
                                // Show "No matches found" when user has typed something but there are no filtered options
                                if (filteredOptions.length === 0 && query.trim() && !loading) {
                                    console.log('🚫 [Service] Showing "No matches found" message');
                                    return (
                                        <div className='px-3 py-2 text-slate-500 text-center'>No matches found</div>
                                    );
                                }

                                // Show empty state when no options available and no query
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
                                                            setTimeout(() => {
                                                                try {
                                                                    if (inputRef.current) {
                                                                        if (inputRef.current.tagName === 'SPAN' || inputRef.current.getAttribute('tabindex') !== null) {
                                                                            inputRef.current.focus();
                                                                        } else {
                                                                            const chipElement = containerRef.current?.querySelector('span[tabindex="0"]') as HTMLElement;
                                                                            if (chipElement) {
                                                                                chipElement.focus();
                                                                            }
                                                                        }
                                                                    }
                                                                } catch (e) {
                                                                    console.log('Error focusing chip:', e);
                                                                }
                                                            }, 100);
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

// AsyncChipSelect for Entity with dropdown filtered by Account and Enterprise
function AsyncChipSelectEntity({
    value,
    onChange,
    placeholder = '',
    isError = false,
    selectedAccountId = '',
    selectedAccountName = '',
    selectedEnterprise = '',
    onNewItemCreated,
}: {
    value?: string;
    onChange: (next?: string) => void;
    placeholder?: string;
    isError?: boolean;
    selectedAccountId?: string;
    selectedAccountName?: string;
    selectedEnterprise?: string;
    onNewItemCreated?: (item: {id: string; name: string}) => void;
}) {
    
    const [current, setCurrent] = useState(value || '');
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const [options, setOptions] = useState<Array<{id: string; name: string}>>([]);
    const [allOptions, setAllOptions] = useState<Array<{id: string; name: string}>>([]);
    const [loading, setLoading] = useState(false);
    const [hasPendingNewValue, setHasPendingNewValue] = useState(false);
    const [dropdownPortalPos, setDropdownPortalPos] = useState<{top: number; left: number; width: number} | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const loadAllOptions = useCallback(async () => {
        console.log('🔄 [Entity] loadAllOptions called', {
            selectedAccountId,
            selectedAccountName,
            selectedEnterprise
        });
        setLoading(true);
        try {
            if (!selectedAccountId || !selectedAccountName || !selectedEnterprise) {
                console.log('⚠️ [Entity] Missing dependencies, clearing options', {
                    hasAccountId: !!selectedAccountId,
                    hasAccountName: !!selectedAccountName,
                    hasEnterprise: !!selectedEnterprise
                });
                setAllOptions([]);
                setLoading(false);
                return;
            }
            
            // Get enterpriseId from localStorage
            const enterpriseId = window.localStorage.getItem('selectedEnterpriseId');
            if (!enterpriseId) {
                console.log('⚠️ [Entity] No enterpriseId in localStorage');
                setAllOptions([]);
                setLoading(false);
                return;
            }
            
            console.log('📡 [Entity] Calling API: /api/global-settings');
            const response = await api.get<Array<{
                id?: string;
                entityName: string;
                enterprise?: string;
            }>>(
                `/api/global-settings?accountId=${selectedAccountId}&accountName=${encodeURIComponent(selectedAccountName)}&enterpriseId=${enterpriseId}`
            ) || [];
            
            console.log('📦 [Entity] API response:', response);
            
            // Extract unique entity names filtered by Account and Enterprise
            const uniqueEntities = Array.from(new Set(
                response
                    .filter(item => item.entityName && item.entityName.trim() !== '')
                    .map(item => item.entityName)
            ));
            
            console.log('✅ [Entity] Filtered unique entities:', uniqueEntities);
            
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
    }, [selectedAccountId, selectedAccountName, selectedEnterprise]);

    useEffect(() => {
        if (open && allOptions.length === 0 && selectedAccountId && selectedAccountName && selectedEnterprise) {
            console.log('🔄 [Entity] useEffect: Loading options');
            loadAllOptions();
        }
    }, [open, allOptions.length, selectedAccountId, selectedAccountName, selectedEnterprise, loadAllOptions]);

    useEffect(() => {
        setCurrent(value || '');
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
                opt.name.toLowerCase().startsWith(queryLower) ||
                opt.name.toLowerCase().includes(queryLower)
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

    const calculateDropdownPosition = useCallback(() => {
        if (!containerRef.current || !open) return;
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

    // Helper function to get actual Account/Enterprise values from props or localStorage
    const getActualDependencies = useCallback(() => {
        let actualAccountId = selectedAccountId;
        let actualAccountName = selectedAccountName;
        let actualEnterprise = selectedEnterprise;
        
        if (!actualAccountId && typeof window !== 'undefined') {
            actualAccountId = window.localStorage.getItem('selectedAccountId') || '';
        }
        if (!actualAccountName && typeof window !== 'undefined') {
            actualAccountName = window.localStorage.getItem('selectedAccountName') || '';
        }
        if (!actualEnterprise && typeof window !== 'undefined') {
            actualEnterprise = window.localStorage.getItem('selectedEnterpriseName') || '';
        }
        
        return { actualAccountId, actualAccountName, actualEnterprise };
    }, [selectedAccountId, selectedAccountName, selectedEnterprise]);

    return (
        <div
            ref={containerRef}
            className='relative min-w-0 flex items-center gap-1 group/item'
            style={{maxWidth: '100%', width: '100%'}}
        >
            <div 
                className='relative w-full flex items-center gap-1' 
                style={{width: '100%', minWidth: '100%'}}
                onClick={(e: any) => {
                    const { actualAccountId, actualAccountName, actualEnterprise } = getActualDependencies();
                    
                    if (actualAccountId && actualAccountName && actualEnterprise && !open && (!current && !value)) {
                        const target = e.target as HTMLElement;
                        if (!target.closest('button') && !target.closest('input') && !target.closest('span[tabindex]')) {
                            console.log('🟣 [Entity] Container onClick: Opening dropdown', {
                                actualAccountId,
                                actualAccountName,
                                actualEnterprise,
                                allOptionsLength: allOptions.length
                            });
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
                        }
                    }
                }}
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
                        tabIndex={(() => {
                            const { actualAccountId, actualAccountName, actualEnterprise } = getActualDependencies();
                            return actualAccountId && actualAccountName && actualEnterprise ? 0 : -1;
                        })()}
                        onClick={(e: any) => {
                            const { actualAccountId, actualAccountName, actualEnterprise } = getActualDependencies();
                            
                            if (!(e.target as HTMLElement).closest('button')) {
                                if (actualAccountId && actualAccountName && actualEnterprise) {
                                    console.log('🟣 [Entity] Opening dropdown on chip click');
                                    setQuery(current || value || '');
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
                                }
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
                                    const nextColDiv = document.querySelector(`[data-row-id="${currentRowId}"][data-col="product"]`);
                                    if (nextColDiv) {
                                        const productElement = nextColDiv.querySelector('input') as HTMLElement;
                                        if (productElement) {
                                            setTimeout(() => {
                                                productElement.focus();
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
                        }}
                        onFocus={() => {
                            const { actualAccountId, actualAccountName, actualEnterprise } = getActualDependencies();
                            
                            console.log('🟣 [Entity] onFocus triggered', {
                                actualAccountId,
                                actualAccountName,
                                actualEnterprise,
                                allOptionsLength: allOptions.length,
                                currentOpen: open
                            });
                            setOpen(true);
                            if (containerRef.current) {
                                const containerRect = containerRef.current.getBoundingClientRect();
                                const width = Math.max(140, Math.min(200, containerRect.width));
                                const top = containerRect.bottom + 2;
                                const left = containerRect.left;
                                setDropdownPortalPos({ top, left, width });
                            }
                            
                            if (actualAccountId && actualAccountName && actualEnterprise) {
                                if (allOptions.length === 0) {
                                    console.log('🟣 [Entity] allOptions empty, calling loadAllOptions');
                                    loadAllOptions();
                                } else {
                                    console.log('🟣 [Entity] Options already loaded:', allOptions.length);
                                }
                            }
                        }}
                        onBlur={(e) => {
                            const relatedTarget = e.relatedTarget as HTMLElement;
                            const isClickingInDropdown = dropdownRef.current?.contains(relatedTarget);
                            if (isClickingInDropdown) {
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
                                    } else if (!query) {
                                        setQuery('');
                                        setHasPendingNewValue(false);
                                    }
                                    setQuery('');
                                }
                            }, 150);
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
                                }
                            } else if (e.key === 'Tab') {
                                e.preventDefault();
                                e.stopPropagation();
                                const currentElement = e.target as HTMLElement;
                                const currentColDiv = currentElement.closest('[data-col]');
                                const currentRowId = currentColDiv?.getAttribute('data-row-id');
                                if (currentRowId) {
                                    const nextColDiv = document.querySelector(`[data-row-id="${currentRowId}"][data-col="product"]`);
                                    if (nextColDiv) {
                                        const productElement = nextColDiv.querySelector('input') as HTMLElement;
                                        if (productElement) {
                                            setTimeout(() => {
                                                productElement.focus();
                                            }, 10);
                                        }
                                    }
                                }
                            }
                        }}
                        className={`w-full text-left px-2 py-1 text-[12px] rounded border ${isError ? 'border-red-500 bg-red-50 ring-2 ring-red-200' : open ? 'border-blue-500 bg-white ring-2 ring-blue-200' : 'border-blue-300 bg-white hover:bg-slate-50'} ${(() => {
                            const { actualAccountId, actualAccountName, actualEnterprise } = getActualDependencies();
                            return !actualAccountId || !actualAccountName || !actualEnterprise ? 'opacity-50 cursor-not-allowed' : '';
                        })()} text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 ${isError ? 'focus:ring-red-200 focus:border-red-500' : 'focus:ring-blue-200 focus:border-blue-500'}`}
                        placeholder={placeholder}
                        disabled={(() => {
                            const { actualAccountId, actualAccountName, actualEnterprise } = getActualDependencies();
                            return !actualAccountId || !actualAccountName || !actualEnterprise;
                        })()}
                        readOnly={(() => {
                            const { actualAccountId, actualAccountName, actualEnterprise } = getActualDependencies();
                            return !actualAccountId || !actualAccountName || !actualEnterprise;
                        })()}
                        onClick={(e: any) => {
                            const { actualAccountId, actualAccountName, actualEnterprise } = getActualDependencies();
                            
                            if (!actualAccountId || !actualAccountName || !actualEnterprise) {
                                console.log('🟣 [Entity] Input onClick: Cannot open - missing dependencies');
                                return;
                            }
                            
                            console.log('🟣 [Entity] Input onClick: Opening dropdown');
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
                    />
                ) : null}
            </div>
            
            {open && dropdownPortalPos && createPortal(
                <div 
                    ref={dropdownRef}
                    className='rounded-xl border border-slate-200 bg-white shadow-2xl'
                    style={{
                        position: 'fixed',
                        top: `${dropdownPortalPos.top}px`,
                        left: `${dropdownPortalPos.left}px`,
                        width: `${dropdownPortalPos.width}px`,
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
                                const { actualAccountId, actualAccountName, actualEnterprise } = getActualDependencies();
                                
                                if (!actualAccountId || !actualAccountName || !actualEnterprise) {
                                    return (
                                        <div className='px-3 py-2 text-slate-500 text-center'>Please select Account and Enterprise first</div>
                                    );
                                }
                                
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
                                
                                // Show "No matches found" when user has typed something but there are no filtered options
                                if (filteredOptions.length === 0 && query.trim() && !loading) {
                                    return (
                                        <div className='px-3 py-2 text-slate-500 text-center'>No matches found</div>
                                    );
                                }

                                // Show empty state when no options available and no query
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
                                                            setTimeout(() => {
                                                                try {
                                                                    if (inputRef.current) {
                                                                        if (inputRef.current.tagName === 'SPAN' || inputRef.current.getAttribute('tabindex') !== null) {
                                                                            inputRef.current.focus();
                                                                        } else {
                                                                            const chipElement = containerRef.current?.querySelector('span[tabindex="0"]') as HTMLElement;
                                                                            if (chipElement) {
                                                                                chipElement.focus();
                                                                            }
                                                                        }
                                                                    }
                                                                } catch (e) {
                                                                    console.log('Error focusing chip:', e);
                                                                }
                                                            }, 100);
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

const AssignedUserGroupTable: React.FC<AssignedUserGroupTableProps> = ({
    userGroups,
    onUpdateUserGroups,
    searchQuery = '',
    onDeleteClick,
    compressingGroupId = null,
    foldingGroupId = null,
    selectedEnterprise = '',
    selectedEnterpriseId = '',
    selectedAccountId = '',
    selectedAccountName = '',
    validationErrors = new Set(),
    showValidationErrors = false,
    onAddNewRow,
    availableGroups = [],
}) => {
    
    // Helper function to check if a field is missing for a group
    const isFieldMissing = (group: UserGroup, field: keyof UserGroup): boolean => {
        if (!showValidationErrors || !validationErrors.has(group.id)) {
            return false;
        }
        
        const mandatoryFields: (keyof UserGroup)[] = ['groupName', 'entity', 'product', 'service'];
        if (!mandatoryFields.includes(field)) {
            return false;
        }
        
        const value = group[field];
        return !value || (typeof value === 'string' && value.trim() === '');
    };
    const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);

    // Filter user groups based on search query
    const filteredUserGroups = userGroups.filter(group =>
        (group.groupName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (group.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (group.entity || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (group.product || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (group.service || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (group.roles || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Add new user group
    const addNewUserGroup = () => {
        if (onAddNewRow) {
            onAddNewRow();
        } else {
            // Fallback if onAddNewRow not provided
            const newGroup: UserGroup = {
                id: generateId(),
                groupName: '',
                description: '',
                entity: '',
                product: '',
                service: '',
                roles: ''
            };
            onUpdateUserGroups([...userGroups, newGroup]);
        }
    };

    // Update user group field
    const updateUserGroup = (id: string, field: keyof UserGroup, value: string) => {
        console.log('📝 [updateUserGroup] Updating group:', { id, field, value, currentGroups: userGroups.length });
        const updatedGroups = userGroups.map(group => {
            if (group.id === id) {
                const updated = { ...group, [field]: value };
                console.log('📝 [updateUserGroup] Group before update:', group);
                console.log('📝 [updateUserGroup] Group after update:', updated);
                console.log('📝 [updateUserGroup] isFromDatabase preserved?', group.isFromDatabase, '->', updated.isFromDatabase);
                return updated;
            }
            return group;
        });
        const updatedGroup = updatedGroups.find(g => g.id === id);
        console.log('📝 [updateUserGroup] Final updated group:', updatedGroup);
        onUpdateUserGroups(updatedGroups);
    };


    return (
        <div className="flex-1 overflow-auto overflow-x-auto">
            <div className="min-w-full" style={{ minWidth: 'max-content' }}>
                {/* Table Header - Match ManageUsersTable exactly - Only show when rows exist */}
                {filteredUserGroups.length > 0 && (
                    <div 
                        className='sticky top-0 z-30 grid w-full gap-0 px-0 py-3 text-xs font-bold text-slate-800 bg-slate-50 border-b border-slate-200 shadow-sm'
                        style={{
                            gridTemplateColumns: '32px 180px 200px 150px 150px 150px 100px',
                            minWidth: 'max-content',
                            width: '100%',
                            display: 'grid'
                        }}
                    >
                        {/* Delete Button Column Header */}
                        <div className='relative flex items-center justify-center gap-1 px-2 py-1.5 border-r-0 min-w-0 overflow-hidden'>
                            {/* Empty header for delete column */}
                        </div>
                        
                        {/* Column Headers - Match ManageUsersTable format exactly */}
                        <div className="relative flex items-center gap-1 px-2 py-1.5 rounded-sm hover:bg-blue-50 transition-colors duration-150 group min-w-0 overflow-hidden border-r border-slate-200">
                            <div className='flex items-center gap-2'>
                                <span>Group Name</span>
                            </div>
                        </div>
                        <div className="relative flex items-center gap-1 px-2 py-1.5 rounded-sm hover:bg-blue-50 transition-colors duration-150 group min-w-0 overflow-hidden border-r border-slate-200">
                            <div className='flex items-center gap-2'>
                                <span>Description</span>
                            </div>
                        </div>
                        <div className="relative flex items-center gap-1 px-2 py-1.5 rounded-sm hover:bg-blue-50 transition-colors duration-150 group min-w-0 overflow-hidden border-r border-slate-200">
                            <div className='flex items-center gap-2'>
                                <span>Entity</span>
                            </div>
                    </div>
                        <div className="relative flex items-center gap-1 px-2 py-1.5 rounded-sm hover:bg-blue-50 transition-colors duration-150 group min-w-0 overflow-hidden border-r border-slate-200">
                            <div className='flex items-center gap-2'>
                                <span>Product</span>
                    </div>
                    </div>
                        <div className="relative flex items-center gap-1 px-2 py-1.5 rounded-sm hover:bg-blue-50 transition-colors duration-150 group min-w-0 overflow-hidden border-r border-slate-200">
                            <div className='flex items-center gap-2'>
                                <span>Service</span>
                    </div>
                    </div>
                        <div className="relative flex items-center gap-1 px-2 py-1.5 rounded-sm hover:bg-blue-50 transition-colors duration-150 group min-w-0 overflow-hidden border-r-0">
                            <div className='flex items-center gap-2'>
                                <span>Roles</span>
                    </div>
                    </div>
                    </div>
                )}
                
                {/* Table Rows - Match ManageUsersTable styling exactly */}
                <div className="space-y-1 pt-1">
                    {filteredUserGroups.map((group: UserGroup, index: number) => {
                        const isRowHovered = hoveredRowId === group.id;
                        
                        return (
                        <div
                            key={group.id}
                            onMouseEnter={() => setHoveredRowId(group.id)}
                            onMouseLeave={() => setHoveredRowId(null)}
                                className={`w-full grid items-center gap-0 border rounded-lg transition-all duration-200 ease-in-out h-11 mb-1 pb-1 border-slate-200 hover:bg-blue-50 hover:shadow-lg hover:ring-1 hover:ring-blue-200 hover:border-blue-300 hover:-translate-y-0.5 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'} ${
                                    compressingGroupId === group.id
                                        ? 'transform scale-x-75 transition-all duration-500 ease-out'
                                        : ''
                                } ${
                                    foldingGroupId === group.id
                                        ? 'opacity-0 transform scale-y-50 transition-all duration-300'
                                        : ''
                            }`}
                            style={{
                                    gridTemplateColumns: '32px 180px 200px 150px 150px 150px 100px',
                                willChange: 'transform',
                                display: 'grid',
                                minWidth: 'max-content',
                                width: '100%',
                                maxWidth: '100%',
                                overflow: 'hidden',
                                borderTop: index === 0 ? '1px solid rgb(226 232 240)' : 'none'
                            }}
                        >
                                {/* Delete Button Column - Match ManageUsersTable exactly */}
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
                                                    onDeleteClick(group.id);
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
                                
                                {/* Group Name - AsyncChipSelect with dropdown OR read-only chip */}
                                <div className={`group flex items-center gap-1.5 border-r border-slate-200 px-2 py-1 w-full ${group.isFromDatabase ? 'bg-slate-100' : ''}`}
                                     style={{
                                        backgroundColor: group.isFromDatabase ? 'rgb(241 245 249)' : (index % 2 === 0 ? 'white' : 'rgb(248 250 252 / 0.7)') // bg-slate-100 for database groups
                                     }}>
                                    <div className="relative flex items-center text-slate-700 font-normal text-[12px] w-full flex-1"
                                         data-row-id={group.id}
                                         data-col='groupName'
                                         style={{width: '100%', minWidth: '100%', maxWidth: '100%', overflow: 'visible'}}>
                                        {group.isFromDatabase ? (
                                            <span 
                                                className="w-full inline-flex items-center gap-1 px-2 py-1 text-[11px] leading-[14px] bg-white text-black rounded-sm cursor-not-allowed"
                                                style={{width: '100%', minWidth: '100%'}}
                                                title={`${group.groupName} (read-only - from database)`}
                                            >
                                                <span className='flex-1 truncate'>{group.groupName || ''}</span>
                                            </span>
                                        ) : (
                                            <AsyncChipSelectGroupName
                                                value={group.groupName || ''}
                                                onChange={(v) => updateUserGroup(group.id, 'groupName', v || '')}
                                                placeholder=''
                                                userGroups={userGroups}
                                                availableGroups={availableGroups}
                                                selectedAccountId={selectedAccountId}
                                                selectedAccountName={selectedAccountName}
                                                selectedEnterpriseId={selectedEnterpriseId}
                                                selectedEnterprise={selectedEnterprise}
                                                isError={isFieldMissing(group, 'groupName')}
                                            />
                                        )}
                                    </div>
                                </div>
                                
                                {/* Description - Chip with X button */}
                                <div className={`group flex items-center gap-1.5 border-r border-slate-200 px-2 py-1 w-full ${group.isFromDatabase ? 'bg-slate-100' : ''}`}
                                     style={{
                                        backgroundColor: group.isFromDatabase ? 'rgb(241 245 249)' : (index % 2 === 0 ? 'white' : 'rgb(248 250 252 / 0.7)') // bg-slate-100 for database groups
                                     }}>
                                    <div className="relative flex items-center text-slate-700 font-normal text-[12px] w-full flex-1"
                                         data-row-id={group.id}
                                         data-col='description'
                                         style={{width: '100%', overflow: 'visible'}}>
                                        {group.isFromDatabase ? (
                                            <span 
                                                className="w-full inline-flex items-center gap-1 px-2 py-1 text-[11px] leading-[14px] bg-white text-black rounded-sm cursor-not-allowed"
                                                style={{width: '100%', minWidth: '100%'}}
                                                title={`${group.description} (read-only - from database)`}
                                            >
                                                <span className='flex-1 truncate'>{group.description || ''}</span>
                                            </span>
                                        ) : (
                                            <EditableChipInput
                                                value={group.description || ''}
                                                onCommit={(v) => updateUserGroup(group.id, 'description', v)}
                                                onRemove={() => updateUserGroup(group.id, 'description', '')}
                                                className='text-[12px]'
                                                dataAttr={`description-${group.id}`}
                                            />
                                        )}
                                    </div>
                                </div>
                                
                                {/* Entity - Chip with X button */}
                                <div className={`group flex items-center gap-1.5 border-r border-slate-200 px-2 py-1 w-full ${group.isFromDatabase ? 'bg-slate-100' : ''}`}
                                     style={{
                                        backgroundColor: group.isFromDatabase ? 'rgb(241 245 249)' : (index % 2 === 0 ? 'white' : 'rgb(248 250 252 / 0.7)') // bg-slate-100 for database groups
                                     }}>
                                    <div className="relative flex items-center text-slate-700 font-normal text-[12px] w-full flex-1"
                                         data-row-id={group.id}
                                         data-col='entity'
                                         style={{width: '100%', overflow: 'visible'}}>
                                        {group.isFromDatabase ? (
                                            <span 
                                                className="w-full inline-flex items-center gap-1 px-2 py-1 text-[11px] leading-[14px] bg-white text-black rounded-sm cursor-not-allowed"
                                                style={{width: '100%', minWidth: '100%'}}
                                                title={`${group.entity} (read-only - from database)`}
                                            >
                                                <span className='flex-1 truncate'>{group.entity || ''}</span>
                                            </span>
                                        ) : (
                                            <AsyncChipSelectEntity
                                                value={group.entity || ''}
                                                onChange={(v) => updateUserGroup(group.id, 'entity', v || '')}
                                                placeholder=''
                                                selectedAccountId={selectedAccountId}
                                                selectedAccountName={selectedAccountName}
                                                selectedEnterprise={selectedEnterprise}
                                                isError={isFieldMissing(group, 'entity')}
                                            />
                                        )}
                                    </div>
                                </div>
                                
                                {/* Product - AsyncChipSelect with dropdown filtered by Enterprise */}
                                <div className={`group flex items-center gap-1.5 border-r border-slate-200 px-2 py-1 w-full ${group.isFromDatabase ? 'bg-slate-100' : ''}`}
                                     style={{
                                        backgroundColor: group.isFromDatabase ? 'rgb(241 245 249)' : (index % 2 === 0 ? 'white' : 'rgb(248 250 252 / 0.7)') // bg-slate-100 for database groups
                                     }}>
                                    <div className="relative flex items-center text-slate-700 font-normal text-[12px] w-full flex-1"
                                         data-row-id={group.id}
                                         data-col='product'
                                         style={{width: '100%', minWidth: '100%', maxWidth: '100%', overflow: 'visible'}}>
                                        {group.isFromDatabase ? (
                                            <span 
                                                className="w-full inline-flex items-center gap-1 px-2 py-1 text-[11px] leading-[14px] bg-white text-black rounded-sm cursor-not-allowed"
                                                style={{width: '100%', minWidth: '100%'}}
                                                title={`${group.product} (read-only - from database)`}
                                            >
                                                <span className='flex-1 truncate'>{group.product || ''}</span>
                                            </span>
                                        ) : (
                                            <AsyncChipSelectProduct
                                                value={group.product || ''}
                                                onChange={(v) => {
                                                    console.log('🟢 [Product] onChange called:', { value: v, groupId: group.id, currentProduct: group.product });
                                                    
                                                    // Update both product and service in a single state update to avoid race condition
                                                    const updatedGroups = userGroups.map(g => {
                                                        if (g.id === group.id) {
                                                            // If product is changing, clear the service field
                                                            if (v !== g.product) {
                                                                console.log('🟢 [Product] Clearing service because product changed');
                                                                return { ...g, product: v || '', service: '' };
                                                            }
                                                            return { ...g, product: v || '' };
                                                        }
                                                        return g;
                                                    });
                                                    
                                                    console.log('📝 [Product] Updated groups:', updatedGroups.find(g => g.id === group.id));
                                                    onUpdateUserGroups(updatedGroups);
                                                }}
                                                placeholder=''
                                                selectedEnterprise={selectedEnterprise}
                                                selectedAccountId={selectedAccountId}
                                                isError={isFieldMissing(group, 'product')}
                                            />
                                        )}
                                    </div>
                                </div>
                                
                                {/* Service - AsyncChipSelect with dropdown filtered by Product */}
                                <div className={`group flex items-center gap-1.5 border-r border-slate-200 px-2 py-1 w-full ${group.isFromDatabase ? 'bg-slate-100' : ''}`}
                                     style={{
                                        backgroundColor: group.isFromDatabase ? 'rgb(241 245 249)' : (index % 2 === 0 ? 'white' : 'rgb(248 250 252 / 0.7)') // bg-slate-100 for database groups
                                     }}>
                                    <div className="relative flex items-center text-slate-700 font-normal text-[12px] w-full flex-1"
                                         data-row-id={group.id}
                                         data-col='service'
                                         style={{width: '100%', minWidth: '100%', maxWidth: '100%', overflow: 'visible'}}>
                                        {group.isFromDatabase ? (
                                            <span 
                                                className="w-full inline-flex items-center gap-1 px-2 py-1 text-[11px] leading-[14px] bg-white text-black rounded-sm cursor-not-allowed"
                                                style={{width: '100%', minWidth: '100%'}}
                                                title={`${group.service} (read-only - from database)`}
                                            >
                                                <span className='flex-1 truncate'>{group.service || ''}</span>
                                            </span>
                                        ) : (
                                            <AsyncChipSelectService
                                                value={group.service || ''}
                                                onChange={(v) => updateUserGroup(group.id, 'service', v || '')}
                                                placeholder=''
                                                selectedEnterprise={selectedEnterprise}
                                                selectedProduct={group.product || ''}
                                                key={`service-${group.id}-${group.product || ''}`}
                                                isError={isFieldMissing(group, 'service')}
                                            />
                                        )}
                                        {(() => {
                                            console.log('🔧 [Service] Component props:', {
                                                groupId: group.id,
                                                product: group.product,
                                                selectedProduct: group.product || '',
                                                hasProduct: !!(group.product || '')
                                            });
                                            return null;
                                        })()}
                                    </div>
                                </div>
                                
                                {/* Roles - Show icon instead of field */}
                                <div className="group flex items-center justify-center gap-1.5 border-r-0 px-2 py-1"
                                     style={{
                                        backgroundColor: index % 2 === 0 ? 'white' : 'rgb(248 250 252 / 0.7)' // bg-white or bg-slate-50/70
                                     }}>
                                    <div className="relative flex items-center justify-center text-slate-700 font-normal text-[12px] min-w-0"
                                         data-row-id={group.id}
                                         data-col='roles'>
                                        <Shield className="h-5 w-5 text-slate-500 hover:text-blue-600 transition-colors" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    
                    {/* Add New Row Button - Match ManageUsersTable exactly - Only show when rows exist */}
                    {filteredUserGroups.length > 0 && (
                        <div 
                            className="grid w-full gap-0 px-0 py-1 text-sm border-t border-slate-200 h-10 transition-colors duration-150 bg-slate-50/80 hover:bg-blue-50 cursor-pointer group"
                                style={{
                                gridTemplateColumns: '32px 180px 200px 150px 150px 150px 100px',
                                minWidth: 'max-content',
                                width: '100%'
                            }}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                addNewUserGroup();
                            }}
                            title="Add new user group row"
                        >
                            {/* Empty delete button space */}
                            <div className='flex items-center justify-center px-2 py-1'>
                                {/* No delete icon for add row */}
                            </div>
                
                            {/* Add new row content spanning all columns */}
                            <div className="flex items-center justify-start gap-2 px-2 py-1 font-medium transition-colors duration-150 text-slate-500 group-hover:text-blue-600" style={{gridColumn: 'span 6'}}>
                                <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
                                </svg>
                                <span className='italic'>Add New Row</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AssignedUserGroupTable;

