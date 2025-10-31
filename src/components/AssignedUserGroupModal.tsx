import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, Users, Save, Search, XCircle } from 'lucide-react';
import { BookmarkIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { generateId } from '@/utils/id-generator';
import AssignedUserGroupTable from './AssignedUserGroupTable';

export interface UserGroup {
    id: string;
    groupName: string;
    description: string;
    entity: string;
    service: string;
    roles: string;
}

interface AssignedUserGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (userGroups: UserGroup[]) => void;
    firstName: string;
    lastName: string;
    initialUserGroups?: UserGroup[];
}

const AssignedUserGroupModal: React.FC<AssignedUserGroupModalProps> = ({
    isOpen,
    onClose,
    onSave,
    firstName,
    lastName,
    initialUserGroups = []
}) => {
    // State management
    const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
    const [selectedUserGroups, setSelectedUserGroups] = useState<UserGroup[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
    const [originalUserGroups, setOriginalUserGroups] = useState<UserGroup[]>([]);

    // Reset when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            console.log('🔍 UserGroupModal opened with initialUserGroups:', initialUserGroups);
            setSelectedUserGroups(initialUserGroups);
            setOriginalUserGroups(JSON.parse(JSON.stringify(initialUserGroups))); // Deep copy
            setHasUnsavedChanges(false);
            setSearchQuery('');
        }
    }, [isOpen, initialUserGroups]);

    // Track changes to detect unsaved changes
    useEffect(() => {
        if (isOpen && originalUserGroups.length >= 0) {
            const hasChanges = JSON.stringify(selectedUserGroups.map(g => g.id).sort()) !== 
                             JSON.stringify(originalUserGroups.map(g => g.id).sort());
            setHasUnsavedChanges(hasChanges);
        }
    }, [selectedUserGroups, originalUserGroups, isOpen]);

    // Add new user group - called from toolbar button
    const addNewUserGroup = () => {
        const newGroup: UserGroup = {
            id: generateId(),
            groupName: '',
            description: '',
            entity: '',
            service: '',
            roles: ''
        };
        setUserGroups(prev => [...prev, newGroup]);
    };

    const handleSave = () => {
        onSave(selectedUserGroups);
        setHasUnsavedChanges(false);
        onClose();
    };

    const handleClose = () => {
        if (hasUnsavedChanges) {
            setShowUnsavedChangesDialog(true);
        } else {
            onClose();
        }
    };

    const handleDiscardChanges = () => {
        setHasUnsavedChanges(false);
        setShowUnsavedChangesDialog(false);
        onClose();
    };

    const handleKeepEditing = () => {
        setShowUnsavedChangesDialog(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] overflow-hidden">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black bg-opacity-50"
                onClick={handleClose}
            />
            
            {/* Modal Panel */}
            <motion.div 
                className="absolute right-0 top-0 h-screen w-[700px] shadow-2xl border-l border-gray-200 flex overflow-hidden"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ 
                    type: "spring",
                    stiffness: 300,
                    damping: 30
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Left Panel - Sidebar Image */}
                <div className="w-10 bg-slate-800 text-white flex flex-col relative h-screen">
                    <img 
                        src="/images/logos/sidebar.png" 
                        alt="Sidebar" 
                        className="w-full h-full object-cover"
                    />
                    
                    {/* Middle Text - Rotated and Bold */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -rotate-90 origin-center z-10">
                        <div className="flex items-center space-x-2 text-sm font-bold text-white whitespace-nowrap tracking-wide">
                            <Users className="h-4 w-4" />
                            <span>Assign User Groups</span>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col bg-white">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 px-6 py-4 border-b border-blue-500/20 flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-base">Configure User Groups</p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={handleSave}
                                    className="flex items-center space-x-2 px-4 py-2 bg-white text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-50 transition-colors shadow-sm"
                                >
                                    <BookmarkIcon className="h-4 w-4" />
                                    <span>Save</span>
                                </button>
                                <button
                                    onClick={handleClose}
                                    className="p-2 text-white/70 hover:text-white hover:bg-white/10 transition-colors rounded-lg"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                        
                        {/* User Info */}
                        <div className="mt-4 flex gap-3">
                            <div className="flex-1 max-w-xs">
                                <div className="text-blue-100 text-sm font-medium mb-1">First Name</div>
                                <div className="bg-white/10 rounded px-2 py-1 backdrop-blur-sm border border-white/20 min-h-[28px] flex items-center">
                                    <div className="text-white font-medium truncate text-xs">{firstName || '\u00A0'}</div>
                                </div>
                            </div>
                            <div className="flex-1 max-w-xs">
                                <div className="text-blue-100 text-sm font-medium mb-1">Last Name</div>
                                <div className="bg-white/10 rounded px-2 py-1 backdrop-blur-sm border border-white/20 min-h-[28px] flex items-center">
                                    <div className="text-white font-medium truncate text-xs">{lastName || '\u00A0'}</div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Selected Groups Count */}
                        <div className="mt-3">
                            <div className="text-blue-100 text-sm">
                                Selected Groups: <span className="font-semibold text-white">{selectedUserGroups.length}</span>
                            </div>
                        </div>
                    </div>

                    {/* Toolbar - Similar to ManageUsersTable */}
                    <div className="p-4 border-b border-gray-200 bg-white">
                        <div className="flex items-center justify-between gap-4">
                            {/* Left side - Create New User Group Button */}
                            <button
                                onClick={addNewUserGroup}
                                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                            >
                                <Plus className="h-4 w-4" />
                                <span>Create New User Group</span>
                            </button>
                            
                            {/* Right side - Search and Assign Button */}
                            <div className="flex items-center gap-3">
                                {/* Global Search */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Global Search"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    />
                                </div>
                                
                                {/* Assign Selected Groups Button */}
                                <button
                                    onClick={handleSave}
                                    className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors text-sm"
                                >
                                    Assign Selected Groups
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* AssignedUserGroupTable Component */}
                    <AssignedUserGroupTable
                        userGroups={userGroups}
                        onUpdateUserGroups={setUserGroups}
                        selectedUserGroups={selectedUserGroups}
                        onSelectionChange={setSelectedUserGroups}
                        searchQuery={searchQuery}
                    />

                    {/* Empty State */}
                    {userGroups.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500 bg-white">
                            <Users className="h-12 w-12 text-gray-300 mb-4" />
                            <p className="text-lg font-medium">No user groups found</p>
                            <p className="text-sm">Create your first user group to get started</p>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Unsaved Changes Confirmation Dialog */}
            <AnimatePresence>
                {showUnsavedChangesDialog && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
                    >
                        <div className="absolute inset-0 bg-black bg-opacity-60" />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
                        >
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="p-2 bg-amber-100 rounded-full">
                                    <XCircle className="h-5 w-5 text-amber-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900">Unsaved Changes</h3>
                            </div>
                            
                            <p className="text-slate-600 mb-6">
                                You have unsaved changes. Would you like to save them before closing?
                            </p>
                            
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={handleDiscardChanges}
                                    className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium transition-colors"
                                >
                                    No, Discard
                                </button>
                                <button
                                    onClick={handleKeepEditing}
                                    className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Yes, Keep Editing
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AssignedUserGroupModal;