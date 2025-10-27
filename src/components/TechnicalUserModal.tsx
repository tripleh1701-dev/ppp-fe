import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, User, Save, Edit2, XCircle, Mail, Calendar, Lock, Users, Shield, Eye, EyeOff } from 'lucide-react';
import { BookmarkIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { generateId } from '@/utils/id-generator';
import DateChipSelect from './DateChipSelect';

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
        id: generateId(),
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
    const [validationMessages, setValidationMessages] = useState<{[key: string]: Record<string, string>}>({});
    const [passwordVisibility, setPasswordVisibility] = useState<{[key: string]: boolean}>({});

    // Helper function to check if a user is complete
    const isUserComplete = (user: TechnicalUser): boolean => {
        // For database records, just check basic identifying fields
        // For UI validation, we can be more strict in other validation functions
        return !!(user.firstName?.trim() && 
                 user.lastName?.trim() && 
                 user.emailAddress?.trim());
    };

    // Enhanced validation functions
    const validateName = (name: string, fieldName: string): { isValid: boolean; error?: string } => {
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
    };

    const validateEmail = (email: string): { isValid: boolean; error?: string } => {
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
    };

    const validatePassword = (password: string): { isValid: boolean; error?: string } => {
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
    };

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

    const togglePasswordVisibility = (userId: string) => {
        setPasswordVisibility(prev => ({
            ...prev,
            [userId]: !prev[userId]
        }));
    };

    const validateDate = (date: string): boolean => {
        if (!date.trim()) return false;
        const dateObj = new Date(date);
        return !isNaN(dateObj.getTime());
    };

    const validateUser = (user: TechnicalUser): { errors: string[]; messages: Record<string, string> } => {
        const errors: string[] = [];
        const messages: Record<string, string> = {};
        
        // Validate First Name
        const firstNameValidation = validateName(user.firstName || '', 'First name');
        if (!firstNameValidation.isValid) {
            errors.push('firstName');
            messages.firstName = firstNameValidation.error || 'First name is invalid';
        }
        
        // Validate Middle Name (optional, but if provided should be valid)
        if (user.middleName && user.middleName.trim()) {
            const middleNameValidation = validateName(user.middleName, 'Middle name');
            if (!middleNameValidation.isValid) {
                errors.push('middleName');
                messages.middleName = middleNameValidation.error || 'Middle name is invalid';
            }
        }
        
        // Validate Last Name
        const lastNameValidation = validateName(user.lastName || '', 'Last name');
        if (!lastNameValidation.isValid) {
            errors.push('lastName');
            messages.lastName = lastNameValidation.error || 'Last name is invalid';
        }
        
        // Validate Email Address
        const emailValidation = validateEmail(user.emailAddress || '');
        if (!emailValidation.isValid) {
            errors.push('emailAddress');
            messages.emailAddress = emailValidation.error || 'Email address is invalid';
        }
        
        // Validate Password
        const passwordValidation = validatePassword(user.password || '');
        if (!passwordValidation.isValid) {
            errors.push('password');
            messages.password = passwordValidation.error || 'Password is invalid';
        }
        
        // Validate Start Date
        if (!user.startDate?.trim()) {
            errors.push('startDate');
            messages.startDate = 'Start date is required';
        } else if (!validateDate(user.startDate)) {
            errors.push('startDate');
            messages.startDate = 'Please enter a valid start date';
        }
        
        // Validate End Date
        if (!user.endDate?.trim()) {
            errors.push('endDate');
            messages.endDate = 'End date is required';
        } else if (!validateDate(user.endDate)) {
            errors.push('endDate');
            messages.endDate = 'Please enter a valid end date';
        }
        
        // Validate date range
        if (user.startDate && user.endDate && validateDate(user.startDate) && validateDate(user.endDate)) {
            const startDate = new Date(user.startDate);
            const endDate = new Date(user.endDate);
            if (startDate >= endDate) {
                errors.push('dateRange');
                messages.dateRange = 'End date must be after start date';
            }
        }
        
        return { errors, messages };
    };

    const validateAllUsers = (): boolean => {
        const errors: {[key: string]: string[]} = {};
        const messages: {[key: string]: Record<string, string>} = {};
        let hasErrors = false;

        users.forEach(user => {
            const validation = validateUser(user);
            if (validation.errors.length > 0) {
                errors[user.id] = validation.errors;
                messages[user.id] = validation.messages;
                hasErrors = true;
            }
        });

        setValidationErrors(errors);
        setValidationMessages(messages);
        return !hasErrors;
    };

    // Reset users when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            console.log('🔍 TechnicalUserModal opened with initialUsers:', initialUsers);
            if (initialUsers.length > 0) {
                console.log('👥 Loading initial users:', initialUsers);
                setUsers(initialUsers);
                setOriginalUsers(JSON.parse(JSON.stringify(initialUsers))); // Deep copy
                setActivelyEditingNewUser(new Set());
                
                // Debug: Check completion status of each user
                initialUsers.forEach((user, index) => {
                    const isComplete = !!(user.firstName?.trim() && user.lastName?.trim() && user.emailAddress?.trim());
                    console.log(`👤 User ${index + 1} completion check:`, {
                        firstName: user.firstName,
                        lastName: user.lastName,
                        emailAddress: user.emailAddress,
                        isComplete,
                        fullUser: user
                    });
                });
            } else {
                const newId = generateId();
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
        const newId = generateId();
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
        
        // Clear validation errors and messages for this field when user starts typing
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
        
        setValidationMessages(prev => {
            const newMessages = { ...prev };
            if (newMessages[id]) {
                const fieldMessages = { ...newMessages[id] };
                delete fieldMessages[field as string];
                delete fieldMessages.dateRange; // Also clear dateRange message
                if (Object.keys(fieldMessages).length === 0) {
                    delete newMessages[id];
                } else {
                    newMessages[id] = fieldMessages;
                }
            }
            return newMessages;
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

    const handleNameBlur = useCallback((userId: string, fieldName: 'firstName' | 'middleName' | 'lastName', value: string) => {
        const displayName = fieldName === 'firstName' ? 'First name' : fieldName === 'middleName' ? 'Middle name' : 'Last name';
        
        // Skip validation for optional middle name if it's empty
        if (fieldName === 'middleName' && !value.trim()) {
            return true;
        }
        
        const validation = validateName(value, displayName);
        
        if (!validation.isValid) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                if (!newErrors[userId]) {
                    newErrors[userId] = [];
                }
                if (!newErrors[userId].includes(fieldName)) {
                    newErrors[userId].push(fieldName);
                }
                return newErrors;
            });
            
            setValidationMessages(prev => {
                const newMessages = { ...prev };
                if (!newMessages[userId]) {
                    newMessages[userId] = {};
                }
                newMessages[userId][fieldName] = validation.error || `${displayName} is invalid`;
                return newMessages;
            });
            
            return false; // Indicate validation failed
        } else {
            // Clear validation error if it passes
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                if (newErrors[userId]) {
                    newErrors[userId] = newErrors[userId].filter(error => error !== fieldName);
                    if (newErrors[userId].length === 0) {
                        delete newErrors[userId];
                    }
                }
                return newErrors;
            });
            
            setValidationMessages(prev => {
                const newMessages = { ...prev };
                if (newMessages[userId] && newMessages[userId][fieldName]) {
                    delete newMessages[userId][fieldName];
                    if (Object.keys(newMessages[userId]).length === 0) {
                        delete newMessages[userId];
                    }
                }
                return newMessages;
            });
        }
        
        return true; // Indicate validation passed
    }, []);

    const handleEmailBlur = useCallback((userId: string, email: string) => {
        const validation = validateEmail(email);
        
        if (!validation.isValid) {
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
            
            setValidationMessages(prev => {
                const newMessages = { ...prev };
                if (!newMessages[userId]) {
                    newMessages[userId] = {};
                }
                newMessages[userId].emailAddress = validation.error || 'Email address is invalid';
                return newMessages;
            });
            
            return false; // Indicate validation failed
        } else {
            // Clear validation error if it passes
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                if (newErrors[userId]) {
                    newErrors[userId] = newErrors[userId].filter(error => error !== 'emailAddress');
                    if (newErrors[userId].length === 0) {
                        delete newErrors[userId];
                    }
                }
                return newErrors;
            });
            
            setValidationMessages(prev => {
                const newMessages = { ...prev };
                if (newMessages[userId] && newMessages[userId].emailAddress) {
                    delete newMessages[userId].emailAddress;
                    if (Object.keys(newMessages[userId]).length === 0) {
                        delete newMessages[userId];
                    }
                }
                return newMessages;
            });
        }
        
        return true; // Indicate validation passed
    }, []);

    const handlePasswordBlur = useCallback((userId: string, password: string) => {
        const validation = validatePassword(password);
        
        if (!validation.isValid) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                if (!newErrors[userId]) {
                    newErrors[userId] = [];
                }
                if (!newErrors[userId].includes('password')) {
                    newErrors[userId].push('password');
                }
                return newErrors;
            });
            
            setValidationMessages(prev => {
                const newMessages = { ...prev };
                if (!newMessages[userId]) {
                    newMessages[userId] = {};
                }
                newMessages[userId].password = validation.error || 'Password is invalid';
                return newMessages;
            });
            
            return false; // Indicate validation failed
        } else {
            // Clear validation error if it passes
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                if (newErrors[userId]) {
                    newErrors[userId] = newErrors[userId].filter(error => error !== 'password');
                    if (newErrors[userId].length === 0) {
                        delete newErrors[userId];
                    }
                }
                return newErrors;
            });
            
            setValidationMessages(prev => {
                const newMessages = { ...prev };
                if (newMessages[userId] && newMessages[userId].password) {
                    delete newMessages[userId].password;
                    if (Object.keys(newMessages[userId]).length === 0) {
                        delete newMessages[userId];
                    }
                }
                return newMessages;
            });
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
        setValidationMessages({}); // Clear validation messages on successful save
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
                className="absolute right-0 top-0 h-screen w-[500px] shadow-2xl border-l border-gray-200 flex overflow-hidden"
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
                            <span>Manage Tech User</span>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col bg-white">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 px-6 py-4 border-b border-blue-500/20 flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-base">Configure Technical User</p>
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
                        <div className="mt-4 flex gap-3">
                            <div className="flex-1 max-w-xs">
                                <div className="text-blue-100 text-sm font-medium mb-1">Account Name</div>
                                <div className="bg-white/10 rounded px-2 py-1 backdrop-blur-sm border border-white/20 min-h-[28px] flex items-center">
                                    <div className="text-white font-medium truncate text-xs">{accountName || '\u00A0'}</div>
                                </div>
                            </div>
                            <div className="flex-1 max-w-xs">
                                <div className="text-blue-100 text-sm font-medium mb-1">Master Account</div>
                                <div className="bg-white/10 rounded px-2 py-1 backdrop-blur-sm border border-white/20 min-h-[28px] flex items-center">
                                    <div className="text-white font-medium truncate text-xs">{masterAccount || '\u00A0'}</div>
                                </div>
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
                                                        // Validate the user before allowing Done
                                                        const validation = validateUser(user);
                                                        if (validation.errors.length > 0) {
                                                            // Update validation errors to show the errors for this user
                                                            setValidationErrors(prev => ({
                                                                ...prev,
                                                                [user.id]: validation.errors
                                                            }));
                                                            setValidationMessages(prev => ({
                                                                ...prev,
                                                                [user.id]: validation.messages
                                                            }));
                                                            return; // Don't proceed if there are validation errors
                                                        }

                                                        // Clear any existing validation errors for this user
                                                        setValidationErrors(prev => {
                                                            const newErrors = { ...prev };
                                                            delete newErrors[user.id];
                                                            return newErrors;
                                                        });
                                                        setValidationMessages(prev => {
                                                            const newMessages = { ...prev };
                                                            delete newMessages[user.id];
                                                            return newMessages;
                                                        });

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
                                    {(() => {
                                        const isComplete = isUserComplete(user);
                                        const isActivelyEditing = activelyEditingNewUser.has(user.id);
                                        const isExplicitlyEditing = editingUserId === user.id;
                                        const showEditForm = (!isComplete || isActivelyEditing || isExplicitlyEditing);
                                        
                                        console.log(`🎯 User ${user.id} view decision:`, {
                                            isComplete,
                                            isActivelyEditing,
                                            isExplicitlyEditing,
                                            showEditForm,
                                            userData: user
                                        });
                                        
                                        return showEditForm;
                                    })() ? (
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
                                                        onBlur={(e) => handleNameBlur(user.id, 'firstName', e.target.value)}
                                                        className={`w-full px-2 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors bg-white min-h-[28px] ${
                                                            validationErrors[user.id]?.includes('firstName')
                                                                ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                                                                : 'border-blue-300 focus:ring-blue-200 focus:border-blue-500'
                                                        }`}
                                                    />
                                                    {validationErrors[user.id]?.includes('firstName') && (
                                                        <p className="text-red-500 text-xs mt-1">
                                                            {validationMessages[user.id]?.firstName || 'First name is required'}
                                                        </p>
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
                                                        onBlur={(e) => handleNameBlur(user.id, 'middleName', e.target.value)}
                                                        className={`w-full px-2 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors bg-white min-h-[28px] ${
                                                            validationErrors[user.id]?.includes('middleName')
                                                                ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                                                                : 'border-blue-300 focus:ring-blue-200 focus:border-blue-500'
                                                        }`}
                                                    />
                                                    {validationErrors[user.id]?.includes('middleName') && (
                                                        <p className="text-red-500 text-xs mt-1">
                                                            {validationMessages[user.id]?.middleName || 'Middle name is invalid'}
                                                        </p>
                                                    )}
                                                </div>
                                                
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Last Name *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={user.lastName || ''}
                                                        onChange={(e) => updateUser(user.id, 'lastName', e.target.value)}
                                                        onBlur={(e) => handleNameBlur(user.id, 'lastName', e.target.value)}
                                                        className={`w-full px-2 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors bg-white min-h-[28px] ${
                                                            validationErrors[user.id]?.includes('lastName')
                                                                ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                                                                : 'border-blue-300 focus:ring-blue-200 focus:border-blue-500'
                                                        }`}
                                                    />
                                                    {validationErrors[user.id]?.includes('lastName') && (
                                                        <p className="text-red-500 text-xs mt-1">
                                                            {validationMessages[user.id]?.lastName || 'Last name is required'}
                                                        </p>
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
                                                    onBlur={(e) => handleEmailBlur(user.id, e.target.value)}
                                                    className={`w-full px-2 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors bg-white min-h-[28px] ${
                                                        validationErrors[user.id]?.includes('emailAddress')
                                                            ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                                                            : 'border-blue-300 focus:ring-blue-200 focus:border-blue-500'
                                                    }`}
                                                />
                                                {validationErrors[user.id]?.includes('emailAddress') && (
                                                    <p className="text-red-500 text-xs mt-1">
                                                        {validationMessages[user.id]?.emailAddress || 'Email address is invalid'}
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
                                                    <DateChipSelect
                                                        value={user.startDate || ''}
                                                        onChange={(value) => updateUser(user.id, 'startDate', value)}
                                                        placeholder=""
                                                        isError={validationErrors[user.id]?.includes('startDate')}
                                                        compact={true}
                                                    />
                                                    {validationErrors[user.id]?.includes('startDate') && (
                                                        <p className="text-red-500 text-xs mt-1">
                                                            {validationMessages[user.id]?.startDate || 'Start date is required'}
                                                        </p>
                                                    )}
                                                </div>
                                                
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        End Date *
                                                    </label>
                                                    <DateChipSelect
                                                        value={user.endDate || ''}
                                                        onChange={(value) => updateUser(user.id, 'endDate', value)}
                                                        placeholder=""
                                                        isError={validationErrors[user.id]?.includes('endDate') || validationErrors[user.id]?.includes('dateRange')}
                                                        compact={true}
                                                        minDate={user.startDate ? (() => {
                                                            const startDate = new Date(user.startDate);
                                                            startDate.setDate(startDate.getDate() + 1);
                                                            return startDate.toISOString().split('T')[0];
                                                        })() : undefined}
                                                    />
                                                    {validationErrors[user.id]?.includes('endDate') && (
                                                        <p className="text-red-500 text-xs mt-1">
                                                            {validationMessages[user.id]?.endDate || 'End date is required'}
                                                        </p>
                                                    )}
                                                    {validationErrors[user.id]?.includes('dateRange') && (
                                                        <p className="text-red-500 text-xs mt-1">
                                                            {validationMessages[user.id]?.dateRange || 'End date must be after start date'}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Password *
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type={passwordVisibility[user.id] ? "text" : "password"}
                                                        value={user.password || ''}
                                                        onChange={(e) => updateUser(user.id, 'password', e.target.value)}
                                                        onBlur={(e) => handlePasswordBlur(user.id, e.target.value)}
                                                        className={`w-full px-2 py-1 pr-8 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors bg-white min-h-[28px] ${
                                                            validationErrors[user.id]?.includes('password')
                                                                ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                                                                : 'border-blue-300 focus:ring-blue-200 focus:border-blue-500'
                                                        }`}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => togglePasswordVisibility(user.id)}
                                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                                    >
                                                        {passwordVisibility[user.id] ? (
                                                            <EyeOff className="h-4 w-4" />
                                                        ) : (
                                                            <Eye className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                </div>
                                                
                                                {/* Password Requirements */}
                                                <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
                                                    <p className="text-xs font-medium text-gray-700 mb-2">Password Requirements:</p>
                                                    <div className="space-y-1">
                                                        {getPasswordRequirements(user.password || '').map((req, index) => (
                                                            <div key={index} className="flex items-center text-xs">
                                                                <div className={`w-2 h-2 rounded-full mr-2 flex-shrink-0 ${
                                                                    req.met ? 'bg-green-500' : 'bg-gray-300'
                                                                }`} />
                                                                <span className={req.met ? 'text-green-700' : 'text-gray-600'}>
                                                                    {req.text}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                
                                                {validationErrors[user.id]?.includes('password') && (
                                                    <p className="text-red-500 text-xs mt-1">
                                                        {validationMessages[user.id]?.password || 'Password is required'}
                                                    </p>
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
                                                        className="w-full px-2 py-1 border border-blue-300 rounded-lg text-sm bg-gray-100 text-gray-500 cursor-not-allowed min-h-[28px]"
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
                                                        className="w-full px-2 py-1 border border-blue-300 rounded-lg text-sm bg-gray-100 text-gray-500 cursor-not-allowed min-h-[28px]"
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