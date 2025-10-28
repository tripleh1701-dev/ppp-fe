'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { generateId } from '@/utils/id-generator';

export interface UserGroup {
    id: string;
    groupName: string;
    description: string;
    entity: string;
    service: string;
    roles: string;
}

interface AssignedUserGroupTableProps {
    userGroups: UserGroup[];
    onUpdateUserGroups: (groups: UserGroup[]) => void;
    selectedUserGroups: UserGroup[];
    onSelectionChange: (groups: UserGroup[]) => void;
    searchQuery?: string;
}

// Chip component matching ManageUsersTable exactly
const Chip = ({
    text,
}: {
    text: string;
}) => {
    return (
        <motion.span
            initial={{scale: 0.95, opacity: 0}}
            animate={{scale: 1, opacity: 1}}
            whileHover={{y: -1, boxShadow: '0 1px 6px rgba(15,23,42,0.15)'}}
            transition={{type: 'spring', stiffness: 480, damping: 30}}
            className='w-full flex items-center gap-1 px-2 py-1 text-[11px] leading-[14px] bg-white text-black rounded-sm relative max-w-full min-w-0 overflow-hidden'
            title={text}
        >
            <span className='truncate'>{text}</span>
        </motion.span>
    );
};

// Editable text component that shows as chip when not editing
const EditableChipField = ({
    value,
    onChange,
    placeholder,
    isEditing,
    onStartEdit,
    onStopEdit,
    className = '',
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    isEditing: boolean;
    onStartEdit: () => void;
    onStopEdit: () => void;
    className?: string;
}) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === 'Tab') {
            onStopEdit();
        }
        if (e.key === 'Escape') {
            onStopEdit();
        }
    };

    if (isEditing) {
        return (
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onBlur={onStopEdit}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className={`w-full h-8 px-2 text-[12px] text-slate-700 bg-white border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400 ${className}`}
            />
        );
    }

    return (
        <div
            onClick={onStartEdit}
            className="w-full h-8 flex items-center cursor-text"
        >
            {value ? (
                <Chip text={value} />
            ) : (
                <span className="text-[12px] text-slate-400 px-2">{placeholder}</span>
            )}
        </div>
    );
};

const AssignedUserGroupTable: React.FC<AssignedUserGroupTableProps> = ({
    userGroups,
    onUpdateUserGroups,
    selectedUserGroups,
    onSelectionChange,
    searchQuery = '',
}) => {
    const [editingCell, setEditingCell] = useState<{rowId: string, field: keyof UserGroup} | null>(null);
    const [selectAll, setSelectAll] = useState(false);
    const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);

    // Filter user groups based on search query
    const filteredUserGroups = userGroups.filter(group =>
        group.groupName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.entity.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.roles.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Check if a group is selected
    const isGroupSelected = (groupId: string) => {
        return selectedUserGroups.some(group => group.id === groupId);
    };

    // Toggle individual group selection
    const toggleGroupSelection = (group: UserGroup) => {
        const isSelected = isGroupSelected(group.id);
        
        if (isSelected) {
            onSelectionChange(selectedUserGroups.filter(g => g.id !== group.id));
        } else {
            onSelectionChange([...selectedUserGroups, group]);
        }
    };

    // Handle select all functionality
    const handleSelectAll = () => {
        if (selectAll) {
            onSelectionChange([]);
        } else {
            onSelectionChange([...filteredUserGroups]);
        }
        setSelectAll(!selectAll);
    };

    // Update select all state when selection changes
    useEffect(() => {
        const allFiltered = filteredUserGroups.every(group => isGroupSelected(group.id));
        setSelectAll(allFiltered && filteredUserGroups.length > 0);
    }, [selectedUserGroups, filteredUserGroups]);

    // Add new user group
    const addNewUserGroup = () => {
        const newGroup: UserGroup = {
            id: generateId(),
            groupName: '',
            description: '',
            entity: '',
            service: '',
            roles: ''
        };
        onUpdateUserGroups([...userGroups, newGroup]);
    };

    // Update user group field
    const updateUserGroup = (id: string, field: keyof UserGroup, value: string) => {
        const updatedGroups = userGroups.map(group => 
            group.id === id ? { ...group, [field]: value } : group
        );
        onUpdateUserGroups(updatedGroups);
    };

    // Delete user group
    const deleteUserGroup = (id: string) => {
        const updatedGroups = userGroups.filter(group => group.id !== id);
        onUpdateUserGroups(updatedGroups);
        onSelectionChange(selectedUserGroups.filter(group => group.id !== id));
    };

    // Start editing a cell
    const startEditing = (rowId: string, field: keyof UserGroup) => {
        setEditingCell({ rowId, field });
    };

    // Stop editing
    const stopEditing = () => {
        setEditingCell(null);
    };

    // Check if a cell is being edited
    const isCellEditing = (rowId: string, field: keyof UserGroup) => {
        return editingCell?.rowId === rowId && editingCell?.field === field;
    };

    return (
        <div className="flex-1 overflow-auto">
            <div className="min-w-full">
                {/* Table Header - Match ManageUsersTable exactly */}
                <div className="grid grid-cols-[40px_1fr_1fr_120px_120px_1fr_40px] gap-0 text-sm bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                    {/* Select All Header */}
                    <div className="flex items-center justify-center px-2 py-3 border-r border-slate-200">
                        <input
                            type="checkbox"
                            checked={selectAll}
                            onChange={handleSelectAll}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                    </div>
                    
                    {/* Column Headers */}
                    <div className="flex items-center px-3 py-3 border-r border-slate-200">
                        <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">Group Name</span>
                    </div>
                    <div className="flex items-center px-3 py-3 border-r border-slate-200">
                        <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">Description</span>
                    </div>
                    <div className="flex items-center px-3 py-3 border-r border-slate-200">
                        <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">Entity</span>
                    </div>
                    <div className="flex items-center px-3 py-3 border-r border-slate-200">
                        <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">Service</span>
                    </div>
                    <div className="flex items-center px-3 py-3 border-r border-slate-200">
                        <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">Roles</span>
                    </div>
                    <div className="flex items-center justify-center px-2 py-3">
                        <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">Actions</span>
                    </div>
                </div>
                
                {/* Table Rows - Match ManageUsersTable styling exactly */}
                <div className="space-y-1 pt-1">
                    {filteredUserGroups.map((group: UserGroup, index: number) => (
                        <div
                            key={group.id}
                            onMouseEnter={() => setHoveredRowId(group.id)}
                            onMouseLeave={() => setHoveredRowId(null)}
                            className={`w-full grid items-center gap-0 border border-slate-200 rounded-lg transition-all duration-200 ease-in-out h-11 mb-1 pb-1 ${
                                isGroupSelected(group.id) 
                                    ? 'bg-blue-50 border-blue-300 shadow-md ring-1 ring-blue-200' 
                                    : 'hover:bg-blue-50 hover:shadow-lg hover:ring-1 hover:ring-blue-200 hover:border-blue-300 hover:-translate-y-0.5'
                            } ${index % 2 === 0 ? (isGroupSelected(group.id) ? '' : 'bg-white') : (isGroupSelected(group.id) ? '' : 'bg-slate-50/70')} ${
                                isGroupSelected(group.id) ? 'border-blue-300' : 'border-slate-200'
                            }`}
                            style={{
                                gridTemplateColumns: '40px 1fr 1fr 120px 120px 1fr 40px',
                                willChange: 'transform',
                                display: 'grid',
                                minWidth: 'max-content',
                                width: '100%',
                                maxWidth: '100%',
                                overflow: 'hidden',
                                borderTop: index === 0 ? '1px solid rgb(226 232 240)' : 'none'
                            }}
                        >
                                {/* Select Checkbox */}
                                <div className="flex items-center justify-center px-2 py-1">
                                    <input
                                        type="checkbox"
                                        checked={isGroupSelected(group.id)}
                                        onChange={() => toggleGroupSelection(group)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                </div>
                                
                                {/* Group Name - Editable with Chip Display */}
                                <div className="group flex items-center gap-1.5 border-r border-slate-200 px-2 py-1 w-full overflow-visible"
                                     style={{
                                        backgroundColor: isGroupSelected(group.id) 
                                            ? 'rgb(239 246 255)' // bg-blue-50
                                            : (index % 2 === 0 ? 'white' : 'rgb(248 250 252 / 0.7)') // bg-white or bg-slate-50/70
                                     }}>
                                    <div className="relative flex items-center text-slate-700 font-normal text-[12px] w-full flex-1"
                                         style={{width: '100%'}}>
                                        <EditableChipField
                                            value={group.groupName}
                                            onChange={(value) => updateUserGroup(group.id, 'groupName', value)}
                                            placeholder="Enter group name"
                                            isEditing={isCellEditing(group.id, 'groupName')}
                                            onStartEdit={() => startEditing(group.id, 'groupName')}
                                            onStopEdit={stopEditing}
                                        />
                                    </div>
                                </div>
                                
                                {/* Description - Editable with Chip Display */}
                                <div className="group flex items-center gap-1.5 border-r border-slate-200 px-2 py-1 w-full overflow-visible"
                                     style={{
                                        backgroundColor: isGroupSelected(group.id) 
                                            ? 'rgb(239 246 255)' // bg-blue-50
                                            : (index % 2 === 0 ? 'white' : 'rgb(248 250 252 / 0.7)') // bg-white or bg-slate-50/70
                                     }}>
                                    <div className="relative flex items-center text-slate-700 font-normal text-[12px] w-full flex-1"
                                         style={{width: '100%'}}>
                                        <EditableChipField
                                            value={group.description}
                                            onChange={(value) => updateUserGroup(group.id, 'description', value)}
                                            placeholder="Enter description"
                                            isEditing={isCellEditing(group.id, 'description')}
                                            onStartEdit={() => startEditing(group.id, 'description')}
                                            onStopEdit={stopEditing}
                                        />
                                    </div>
                                </div>
                                
                                {/* Entity - Editable with Chip Display */}
                                <div className="group flex items-center gap-1.5 border-r border-slate-200 px-2 py-1 w-full overflow-visible"
                                     style={{
                                        backgroundColor: isGroupSelected(group.id) 
                                            ? 'rgb(239 246 255)' // bg-blue-50
                                            : (index % 2 === 0 ? 'white' : 'rgb(248 250 252 / 0.7)') // bg-white or bg-slate-50/70
                                     }}>
                                    <div className="relative flex items-center text-slate-700 font-normal text-[12px] w-full flex-1"
                                         style={{width: '100%'}}>
                                        <EditableChipField
                                            value={group.entity}
                                            onChange={(value) => updateUserGroup(group.id, 'entity', value)}
                                            placeholder="Entity"
                                            isEditing={isCellEditing(group.id, 'entity')}
                                            onStartEdit={() => startEditing(group.id, 'entity')}
                                            onStopEdit={stopEditing}
                                        />
                                    </div>
                                </div>
                                
                                {/* Service - Editable with Chip Display */}
                                <div className="group flex items-center gap-1.5 border-r border-slate-200 px-2 py-1 w-full overflow-visible"
                                     style={{
                                        backgroundColor: isGroupSelected(group.id) 
                                            ? 'rgb(239 246 255)' // bg-blue-50
                                            : (index % 2 === 0 ? 'white' : 'rgb(248 250 252 / 0.7)') // bg-white or bg-slate-50/70
                                     }}>
                                    <div className="relative flex items-center text-slate-700 font-normal text-[12px] w-full flex-1"
                                         style={{width: '100%'}}>
                                        <EditableChipField
                                            value={group.service}
                                            onChange={(value) => updateUserGroup(group.id, 'service', value)}
                                            placeholder="Service"
                                            isEditing={isCellEditing(group.id, 'service')}
                                            onStartEdit={() => startEditing(group.id, 'service')}
                                            onStopEdit={stopEditing}
                                        />
                                    </div>
                                </div>
                                
                                {/* Roles - Editable with Chip Display */}
                                <div className="group flex items-center gap-1.5 border-r border-slate-200 px-2 py-1 w-full overflow-visible"
                                     style={{
                                        backgroundColor: isGroupSelected(group.id) 
                                            ? 'rgb(239 246 255)' // bg-blue-50
                                            : (index % 2 === 0 ? 'white' : 'rgb(248 250 252 / 0.7)') // bg-white or bg-slate-50/70
                                     }}>
                                    <div className="relative flex items-center text-slate-700 font-normal text-[12px] w-full flex-1"
                                         style={{width: '100%'}}>
                                        <EditableChipField
                                            value={group.roles}
                                            onChange={(value) => updateUserGroup(group.id, 'roles', value)}
                                            placeholder="Roles"
                                            isEditing={isCellEditing(group.id, 'roles')}
                                            onStartEdit={() => startEditing(group.id, 'roles')}
                                            onStopEdit={stopEditing}
                                        />
                                    </div>
                                </div>
                                
                                {/* Actions - Delete Button */}
                                <div className="flex items-center justify-center px-2 py-1">
                                    {hoveredRowId === group.id && (
                                        <motion.button
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => deleteUserGroup(group.id)}
                                            className="group/delete flex items-center justify-center w-4 h-4 text-red-500 hover:text-white border border-red-300 hover:border-red-500 bg-white hover:bg-red-500 rounded-full transition-all duration-200 ease-out shadow-sm hover:shadow-md"
                                            title="Delete User Group"
                                        >
                                            <X className="w-2 h-2 transition-transform duration-200" />
                                        </motion.button>
                                    )}
                                </div>
                            </div>
                        ))}
                </div>
                
                {/* Add New Row Button - Match ManageUsersTable style */}
                <div className="mt-2 px-2">
                    <button
                        onClick={addNewUserGroup}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add New Row</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AssignedUserGroupTable;