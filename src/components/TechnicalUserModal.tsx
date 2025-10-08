import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, User, Save, Edit2, XCircle, Mail, Calendar, Lock, Users, Shield } from 'lucide-react';
import { BookmarkIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

export interface TechnicalUser {
    id: string;
    firstName: string;
    middleName: string;
    lastName: string;
    emailAddress: string;
    status: boolean; // true = Active, false = Inactive
    startDate: string;
    endDate: string;
    password: string;
    assignedUserGroup: string;
    assignedRole: string;
}

interface TechnicalUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (users: TechnicalUser[]) => void;
    accountName: string;
    masterAccount: string;
    initialUsers?: TechnicalUser[];
}

const TechnicalUserModal: React.FC<TechnicalUserModalProps> = ({
    isOpen,
    onClose,
    onSave,
    accountName,
    masterAccount,
    initialUsers = []
}) => {
    const [users, setUsers] = useState<TechnicalUser[]>([{
        id: crypto.randomUUID(),
        firstName: '',
        middleName: '',
        lastName: '',
        emailAddress: '',
        status: true, // Default to Active (true)
        startDate: '',
        endDate: '',
        password: '',
        assignedUserGroup: 'TechnicalUserGrp',
        assignedRole: 'TechnicalUserRole'
    }]);
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [activelyEditingNewUser, setActivelyEditingNewUser] = useState<Set<string>>(new Set());
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
    const [originalUsers, setOriginalUsers] = useState<TechnicalUser[]>([]);
    const [validationErrors, setValidationErrors] = useState<{[key: string]: string[]}>({});

    // Helper function to check if a user is complete
    const isUserComplete = (user: TechnicalUser): boolean => {
        return !!(user.firstName?.trim() && 
                 user.lastName?.trim() && 
                 user.emailAddress?.trim() && 
                 user.startDate?.trim() && 
                 user.endDate?.trim() && 
                 user.password?.trim());
    };

    // Validation functions
    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email.trim());
    };

    const validateDate = (date: string): boolean => {
        if (!date.trim()) return false;
        const dateObj = new Date(date);
        return !isNaN(dateObj.getTime());
    };

    const validateUser = (user: TechnicalUser): string[] => {
        const errors: string[] = [];
        
        if (!user.firstName?.trim()) {
            errors.push('firstName');
        }
        if (!user.lastName?.trim()) {
            errors.push('lastName');
        }
        if (!user.emailAddress?.trim()) {
            errors.push('emailAddress');
        } else if (!validateEmail(user.emailAddress)) {
            errors.push('emailAddress');
        }
        if (!user.startDate?.trim()) {
            errors.push('startDate');
        } else if (!validateDate(user.startDate)) {
            errors.push('startDate');
        }
        if (!user.endDate?.trim()) {
            errors.push('endDate');
        } else if (!validateDate(user.endDate)) {
            errors.push('endDate');
        }
        if (!user.password?.trim()) {
            errors.push('password');
        }
        
        // Validate date range
        if (user.startDate && user.endDate && validateDate(user.startDate) && validateDate(user.endDate)) {
            const startDate = new Date(user.startDate);
            const endDate = new Date(user.endDate);
            if (startDate >= endDate) {
                errors.push('dateRange');
            }
        }
        
        return errors;
    };

    const validateAllUsers = (): boolean => {
        const errors: {[key: string]: string[]} = {};
        let hasErrors = false;

        users.forEach(user => {
            const userErrors = validateUser(user);
            if (userErrors.length > 0) {
                errors[user.id] = userErrors;
                hasErrors = true;
            }
        });

        setValidationErrors(errors);
        return !hasErrors;
    };

    // Reset users when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            if (initialUsers.length > 0) {
                setUsers(initialUsers);
                setOriginalUsers(JSON.parse(JSON.stringify(initialUsers))); // Deep copy
                setActivelyEditingNewUser(new Set());
            } else {
                const newId = crypto.randomUUID();
                const newUsers = [{
                    id: newId,
                    firstName: '',
                    middleName: '',
                    lastName: '',
                    emailAddress: '',
                    status: true, // Default to Active (true)
                    startDate: '',
                    endDate: '',
                    password: '',
                    assignedUserGroup: 'TechnicalUserGrp',
                    assignedRole: 'TechnicalUserRole'
                }];
                setUsers(newUsers);
                setOriginalUsers(JSON.parse(JSON.stringify(newUsers))); // Deep copy
                // Mark this new user as actively being edited
                setActivelyEditingNewUser(new Set([newId]));
            }
            setHasUnsavedChanges(false);
        }
    }, [isOpen, initialUsers]);

    // Track changes to detect unsaved changes
    useEffect(() => {
        if (isOpen && originalUsers.length > 0) {
            const hasChanges = JSON.stringify(users) !== JSON.stringify(originalUsers);
            setHasUnsavedChanges(hasChanges);
        }
    }, [users, originalUsers, isOpen]);

    const addNewUser = () => {
        const newId = crypto.randomUUID();
        setUsers(prev => [
            ...prev,
            {
                id: newId,
                firstName: '',
                middleName: '',
                lastName: '',
                emailAddress: '',
                status: true, // Default to Active (true)
                startDate: '',
                endDate: '',
                password: '',
                assignedUserGroup: 'TechnicalUserGrp',
                assignedRole: 'TechnicalUserRole'
            }
        ]);
        // Mark this new user as actively being edited
        setActivelyEditingNewUser(prev => {
            const newSet = new Set(prev);
            newSet.add(newId);
            return newSet;
        });
    };

    const updateUser = useCallback((id: string, field: keyof Omit<TechnicalUser, 'id'>, value: string | boolean) => {
        console.log('Updating user:', { id, field, value }); // Debug log
        
        // Mark this user as actively being edited if it wasn't already
        setActivelyEditingNewUser(prev => {
            const newSet = new Set(prev);
            newSet.add(id);
            return newSet;
        });
        
        // Clear validation errors for this field when user starts typing
        setValidationErrors(prev => {
            const newErrors = { ...prev };
            if (newErrors[id]) {
                newErrors[id] = newErrors[id].filter(error => error !== field && error !== 'dateRange');
                if (newErrors[id].length === 0) {
                    delete newErrors[id];
                }
            }
            return newErrors;
        });
        
        setUsers(prev => {
            const updated = prev.map(user => 
                user.id === id 
                    ? { ...user, [field]: value }
                    : user
            );
            console.log('Updated users:', updated); // Debug log
            return updated;
        });
    }, []);

    const handleEmailBlur = useCallback((userId: string, email: string, inputElement: HTMLInputElement) => {
        if (email.trim() && !validateEmail(email)) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                if (!newErrors[userId]) {
                    newErrors[userId] = [];
                }
                if (!newErrors[userId].includes('emailAddress')) {
                    newErrors[userId].push('emailAddress');
                }
                return newErrors;
            });
            // Prevent navigation by returning focus to the email field
            setTimeout(() => {
                inputElement.focus();
            }, 0);
            return false; // Indicate validation failed
        }
        return true; // Indicate validation passed
    }, []);

    const handleDateBlur = useCallback((userId: string, field: 'startDate' | 'endDate', date: string, inputElement: HTMLInputElement) => {
        if (date.trim() && !validateDate(date)) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                if (!newErrors[userId]) {
                    newErrors[userId] = [];
                }
                if (!newErrors[userId].includes(field)) {
                    newErrors[userId].push(field);
                }
                return newErrors;
            });
            // Prevent navigation by returning focus to the date field
            setTimeout(() => {
                inputElement.focus();
            }, 0);
            return false; // Indicate validation failed
        }
        return true; // Indicate validation passed
    }, []);

    const removeUser = (id: string) => {
        if (users.length > 1) {
            setUsers(prev => prev.filter(user => user.id !== id));
        }
    };

    const handleSave = () => {
        // Validate all users before saving
        if (!validateAllUsers()) {
            return; // Don't save if validation fails
        }

        const validUsers = users.filter(user => 
            user.firstName.trim() || user.lastName.trim() || user.emailAddress.trim()
        );
        onSave(validUsers);
        setHasUnsavedChanges(false);
        setValidationErrors({}); // Clear validation errors on successful save
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
                className="absolute right-0 top-0 h-full w-[600px] bg-white shadow-2xl border-l border-gray-200 flex flex-col"
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
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 px-6 py-4 border-b border-blue-500/20 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                                <User className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white">Manage Technical Users</h2>
                                <p className="text-blue-100 text-sm">Configure technical user accounts</p>
                            </div>
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
                    
                    {/* Account Info */}
                    <div className="mt-4 grid grid-cols-2 gap-4">
                        <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm border border-white/20">
                            <div className="text-blue-100 text-xs font-medium mb-1">Account Name</div>
                            <div className="text-white font-semibold truncate">{accountName}</div>
                        </div>
                        <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm border border-white/20">
                            <div className="text-blue-100 text-xs font-medium mb-1">Master Account</div>
                            <div className="text-white font-semibold truncate">{masterAccount}</div>
                        </div>
                    </div>
                </div>

                {/* Content Area - Fixed height and proper overflow */}
                <div className="flex-1 bg-gray-50 overflow-hidden">
                    <div className="h-full overflow-y-auto px-6 py-6">
                        <div className="space-y-6">
                            {/* Technical User Cards */}
                            {users.map((user, index) => (
                                <div 
                                    key={user.id} 
                                    className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-blue-100 rounded-lg">
                                                <User className="h-4 w-4 text-blue-600" />
                                            </div>
                                            <h3 className="text-base font-semibold text-gray-900">
                                                Technical User {index + 1}
                                            </h3>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            {isUserComplete(user) && activelyEditingNewUser.has(user.id) && (
                                                <button
                                                    onClick={() => {
                                                        // Remove from actively editing when user is done
                                                        setActivelyEditingNewUser(prev => {
                                                            const newSet = new Set(prev);
                                                            newSet.delete(user.id);
                                                            return newSet;
                                                        });
                                                        // Also clear the editingUserId if this user was being edited
                                                        if (editingUserId === user.id) {
                                                            setEditingUserId(null);
                                                        }
                                                    }}
                                                    className="flex items-center space-x-1 px-3 py-1.5 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                                                >
                                                    <span>✓ Done</span>
                                                </button>
                                            )}
                                            {isUserComplete(user) && !activelyEditingNewUser.has(user.id) && (
                                                <button
                                                    onClick={() => {
                                                        if (editingUserId === user.id) {
                                                            setEditingUserId(null);
                                                        } else {
                                                            setEditingUserId(user.id);
                                                            // Add back to actively editing when clicking Edit from summary
                                                            setActivelyEditingNewUser(prev => {
                                                                const newSet = new Set(prev);
                                                                newSet.add(user.id);
                                                                return newSet;
                                                            });
                                                        }
                                                    }}
                                                    className="flex items-center space-x-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    <Edit2 className="h-3 w-3" />
                                                    <span>{editingUserId === user.id ? 'Cancel' : 'Edit'}</span>
                                                </button>
                                            )}
                                            {users.length > 1 && (
                                                <button
                                                    onClick={() => removeUser(user.id)}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm transition-colors"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* User Form Fields - Always show for incomplete users, actively editing users, or when explicitly editing */}
                                    {(!isUserComplete(user) || activelyEditingNewUser.has(user.id) || editingUserId === user.id) ? (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        First Name *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={user.firstName || ''}
                                                        onChange={(e) => updateUser(user.id, 'firstName', e.target.value)}
                                                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors bg-white ${
                                                            validationErrors[user.id]?.includes('firstName')
                                                                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                                                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                                        }`}
                                                    />
                                                    {validationErrors[user.id]?.includes('firstName') && (
                                                        <p className="text-red-500 text-xs mt-1">First name is required</p>
                                                    )}
                                                </div>
                                                
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Middle Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={user.middleName || ''}
                                                        onChange={(e) => updateUser(user.id, 'middleName', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                                                    />
                                                </div>
                                                
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Last Name *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={user.lastName || ''}
                                                        onChange={(e) => updateUser(user.id, 'lastName', e.target.value)}
                                                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors bg-white ${
                                                            validationErrors[user.id]?.includes('lastName')
                                                                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                                                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                                        }`}
                                                    />
                                                    {validationErrors[user.id]?.includes('lastName') && (
                                                        <p className="text-red-500 text-xs mt-1">Last name is required</p>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Email Address *
                                                </label>
                                                <input
                                                    type="email"
                                                    value={user.emailAddress || ''}
                                                    onChange={(e) => updateUser(user.id, 'emailAddress', e.target.value)}
                                                    onBlur={(e) => handleEmailBlur(user.id, e.target.value, e.target)}
                                                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors bg-white ${
                                                        validationErrors[user.id]?.includes('emailAddress')
                                                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                                            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                                    }`}
                                                />
                                                {validationErrors[user.id]?.includes('emailAddress') && (
                                                    <p className="text-red-500 text-xs mt-1">
                                                        {!user.emailAddress?.trim() ? 'Email address is required' : 'Please enter a valid email address'}
                                                    </p>
                                                )}
                                            </div>
                                            
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Status
                                                </label>
                                                <div className="flex items-center space-x-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateUser(user.id, 'status', !user.status)}
                                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                                            user.status ? 'bg-green-600' : 'bg-gray-300'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                                user.status ? 'translate-x-6' : 'translate-x-1'
                                                            }`}
                                                        />
                                                    </button>
                                                    <span className={`text-sm font-medium ${
                                                        user.status ? 'text-green-700' : 'text-gray-500'
                                                    }`}>
                                                        {user.status ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Start Date *
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={user.startDate || ''}
                                                        onChange={(e) => updateUser(user.id, 'startDate', e.target.value)}
                                                        onBlur={(e) => handleDateBlur(user.id, 'startDate', e.target.value, e.target)}
                                                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors bg-white ${
                                                            validationErrors[user.id]?.includes('startDate')
                                                                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                                                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                                        }`}
                                                    />
                                                    {validationErrors[user.id]?.includes('startDate') && (
                                                        <p className="text-red-500 text-xs mt-1">
                                                            {!user.startDate?.trim() ? 'Start date is required' : 'Please enter a valid date'}
                                                        </p>
                                                    )}
                                                </div>
                                                
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        End Date *
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={user.endDate || ''}
                                                        onChange={(e) => updateUser(user.id, 'endDate', e.target.value)}
                                                        onBlur={(e) => handleDateBlur(user.id, 'endDate', e.target.value, e.target)}
                                                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors bg-white ${
                                                            validationErrors[user.id]?.includes('endDate') || validationErrors[user.id]?.includes('dateRange')
                                                                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                                                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                                        }`}
                                                    />
                                                    {validationErrors[user.id]?.includes('endDate') && (
                                                        <p className="text-red-500 text-xs mt-1">
                                                            {!user.endDate?.trim() ? 'End date is required' : 'Please enter a valid date'}
                                                        </p>
                                                    )}
                                                    {validationErrors[user.id]?.includes('dateRange') && (
                                                        <p className="text-red-500 text-xs mt-1">End date must be after start date</p>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Password *
                                                </label>
                                                <input
                                                    type="password"
                                                    value={user.password || ''}
                                                    onChange={(e) => updateUser(user.id, 'password', e.target.value)}
                                                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors bg-white ${
                                                        validationErrors[user.id]?.includes('password')
                                                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                                            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                                    }`}
                                                />
                                                {validationErrors[user.id]?.includes('password') && (
                                                    <p className="text-red-500 text-xs mt-1">Password is required</p>
                                                )}
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Assigned User Group
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={user.assignedUserGroup}
                                                        readOnly
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
                                                    />
                                                </div>
                                                
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Assigned Role
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={user.assignedRole}
                                                        readOnly
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        /* Show user summary when not editing */
                                        <div className="bg-white border border-slate-300 rounded-lg p-5 shadow-sm">
                                            <div className="flex items-center space-x-2 mb-4 pb-3 border-b border-slate-200">
                                                <User className="h-4 w-4 text-slate-600" />
                                                <span className="text-sm font-semibold text-slate-800">Technical User Information</span>
                                            </div>
                                            
                                            <div className="space-y-4">
                                                {/* Name */}
                                                <div>
                                                    <div className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">Full Name</div>
                                                    <div className="text-sm text-slate-600">
                                                        <div className="font-medium">
                                                            {[user.firstName, user.middleName, user.lastName].filter(Boolean).join(' ')}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Email and Status in a row */}
                                                <div className="grid grid-cols-2 gap-4">
                                                    {user.emailAddress && (
                                                        <div>
                                                            <div className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">Email</div>
                                                            <div className="text-sm font-normal text-slate-600">{user.emailAddress}</div>
                                                        </div>
                                                    )}
                                                    
                                                    <div>
                                                        <div className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">Status</div>
                                                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                                            user.status ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                            {user.status ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Dates */}
                                                <div className="grid grid-cols-2 gap-4">
                                                    {user.startDate && (
                                                        <div>
                                                            <div className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">Start Date</div>
                                                            <div className="text-sm font-normal text-slate-600 font-mono">
                                                                {new Date(user.startDate).toLocaleDateString()}
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    {user.endDate && (
                                                        <div>
                                                            <div className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">End Date</div>
                                                            <div className="text-sm font-normal text-slate-600 font-mono">
                                                                {new Date(user.endDate).toLocaleDateString()}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Access Control */}
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <div className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">User Group</div>
                                                        <div className="text-sm font-normal text-slate-600">{user.assignedUserGroup}</div>
                                                    </div>
                                                    
                                                    <div>
                                                        <div className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">Role</div>
                                                        <div className="text-sm font-normal text-slate-600">{user.assignedRole}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                            
                            {/* Add New User Button */}
                            {(() => {
                                // Check if the first user is complete
                                const firstUser = users[0];
                                const isFirstUserComplete = isUserComplete(firstUser);
                                
                                return (
                                    <div className="relative">
                                        <motion.button
                                            onClick={isFirstUserComplete ? addNewUser : undefined}
                                            disabled={!isFirstUserComplete}
                                            className={`w-full group relative overflow-hidden rounded-xl p-6 transition-all duration-300 ease-out ${
                                                isFirstUserComplete 
                                                    ? 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-dashed border-blue-300 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/20 cursor-pointer'
                                                    : 'bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 border-2 border-dashed border-gray-300 cursor-not-allowed opacity-50'
                                            }`}
                                            whileHover={isFirstUserComplete ? { 
                                                scale: 1.01,
                                                y: -2
                                            } : {}}
                                            whileTap={isFirstUserComplete ? { scale: 0.99 } : {}}
                                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                        >
                                            {/* Animated background gradient */}
                                            {isFirstUserComplete && (
                                                <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 via-indigo-100/50 to-purple-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                                            )}
                                            
                                            <div className="relative flex items-center justify-center space-x-3">
                                                <motion.div
                                                    className={`p-2.5 rounded-lg shadow-lg ${
                                                        isFirstUserComplete 
                                                            ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                                                            : 'bg-gradient-to-br from-gray-400 to-gray-500'
                                                    }`}
                                                    whileHover={isFirstUserComplete ? { 
                                                        rotate: 90,
                                                        scale: 1.1
                                                    } : {}}
                                                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                                                >
                                                    <Plus className="h-5 w-5 text-white" />
                                                </motion.div>
                                                <div className="text-left">
                                                    <div className={`font-semibold text-base transition-colors duration-200 ${
                                                        isFirstUserComplete 
                                                            ? 'text-gray-800 group-hover:text-blue-700'
                                                            : 'text-gray-500'
                                                    }`}>
                                                        Add New Technical User
                                                    </div>
                                                    <div className={`text-sm transition-colors duration-200 ${
                                                        isFirstUserComplete 
                                                            ? 'text-gray-500 group-hover:text-blue-500'
                                                            : 'text-gray-400'
                                                    }`}>
                                                        {isFirstUserComplete 
                                                            ? 'Click to add another technical user'
                                                            : 'Complete all required fields in Technical User 1 first'
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Subtle shine effect - only when enabled */}
                                            {isFirstUserComplete && (
                                                <motion.div
                                                    className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500"
                                                    style={{
                                                        background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.8) 50%, transparent 70%)'
                                                    }}
                                                    animate={{
                                                        x: [-100, 200]
                                                    }}
                                                    transition={{
                                                        duration: 1.5,
                                                        repeat: Infinity,
                                                        repeatDelay: 3
                                                    }}
                                                />
                                            )}
                                        </motion.button>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
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

export default TechnicalUserModal;