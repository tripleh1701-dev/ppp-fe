import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, User, Save, Edit2, XCircle } from 'lucide-react';
import { BookmarkIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { generateId } from '@/utils/id-generator';

interface Contact {
    id: string;
    name: string;
    email: string;
    phone: string;
    department: string;
    designation: string;
    company: string;
}

interface ContactModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (contacts: Contact[]) => void;
    accountName: string;
    masterAccount: string;
    initialContacts?: Contact[];
}

const ContactModal: React.FC<ContactModalProps> = ({
    isOpen,
    onClose,
    onSave,
    accountName,
    masterAccount,
    initialContacts = []
}) => {
    const [contacts, setContacts] = useState<Contact[]>([{
        id: generateId(),
        name: '',
        email: '',
        phone: '',
        department: '',
        designation: '',
        company: ''
    }]);
    const [editingContactId, setEditingContactId] = useState<string | null>(null);
    const [activelyEditingNewContact, setActivelyEditingNewContact] = useState<Set<string>>(new Set());
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
    const [originalContacts, setOriginalContacts] = useState<Contact[]>([]);
    const [validationErrors, setValidationErrors] = useState<{[key: string]: string[]}>({});

    // Helper function to check if a contact is complete
    const isContactComplete = (contact: Contact): boolean => {
        return !!(contact.name?.trim() && 
                 contact.email?.trim() && 
                 contact.phone?.trim() && 
                 contact.department?.trim() && 
                 contact.designation?.trim() && 
                 contact.company?.trim());
    };

    // Validation functions
    const validateEmail = (email: string): boolean => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    };

    const validatePhone = (phone: string): boolean => {
        return /^\d+$/.test(phone.trim());
    };

    const validateContact = (contact: Contact): string[] => {
        const errors: string[] = [];
        
        if (!contact.name?.trim()) {
            errors.push('name');
        }
        if (!contact.email?.trim()) {
            errors.push('email');
        } else if (!validateEmail(contact.email)) {
            errors.push('email');
        }
        if (!contact.phone?.trim()) {
            errors.push('phone');
        } else if (!validatePhone(contact.phone)) {
            errors.push('phone');
        }
        if (!contact.department?.trim()) {
            errors.push('department');
        }
        if (!contact.designation?.trim()) {
            errors.push('designation');
        }
        if (!contact.company?.trim()) {
            errors.push('company');
        }
        
        return errors;
    };

    const validateAllContacts = (): boolean => {
        const errors: {[key: string]: string[]} = {};
        let hasErrors = false;

        contacts.forEach(contact => {
            const contactErrors = validateContact(contact);
            if (contactErrors.length > 0) {
                errors[contact.id] = contactErrors;
                hasErrors = true;
            }
        });

        setValidationErrors(errors);
        return !hasErrors;
    };

    // Reset contacts when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            if (initialContacts.length > 0) {
                setContacts(initialContacts);
                setOriginalContacts(JSON.parse(JSON.stringify(initialContacts))); // Deep copy
                setActivelyEditingNewContact(new Set());
            } else {
                const newId = generateId();
                const newContacts = [{
                    id: newId,
                    name: '',
                    email: '',
                    phone: '',
                    department: '',
                    designation: '',
                    company: ''
                }];
                setContacts(newContacts);
                setOriginalContacts(JSON.parse(JSON.stringify(newContacts))); // Deep copy
                // Mark this new contact as actively being edited
                setActivelyEditingNewContact(new Set([newId]));
            }
            setHasUnsavedChanges(false);
        }
    }, [isOpen, initialContacts]);

    // Track changes to detect unsaved changes
    useEffect(() => {
        if (isOpen && originalContacts.length > 0) {
            const hasChanges = JSON.stringify(contacts) !== JSON.stringify(originalContacts);
            setHasUnsavedChanges(hasChanges);
        }
    }, [contacts, originalContacts, isOpen]);

    const addNewContact = () => {
        const newId = generateId();
        setContacts(prev => [
            ...prev,
            {
                id: newId,
                name: '',
                email: '',
                phone: '',
                department: '',
                designation: '',
                company: ''
            }
        ]);
        // Mark this new contact as actively being edited
        setActivelyEditingNewContact(prev => {
            const newSet = new Set(prev);
            newSet.add(newId);
            return newSet;
        });
    };

    const updateContact = useCallback((id: string, field: keyof Omit<Contact, 'id'>, value: string) => {
        console.log('Updating contact:', { id, field, value }); // Debug log
        
        // Mark this contact as actively being edited if it wasn't already
        setActivelyEditingNewContact(prev => {
            const newSet = new Set(prev);
            newSet.add(id);
            return newSet;
        });
        
        // Clear validation errors for this field when user starts typing
        setValidationErrors(prev => {
            const newErrors = { ...prev };
            if (newErrors[id]) {
                newErrors[id] = newErrors[id].filter(error => error !== field);
                if (newErrors[id].length === 0) {
                    delete newErrors[id];
                }
            }
            return newErrors;
        });
        
        setContacts(prev => {
            const updated = prev.map(contact => 
                contact.id === id 
                    ? { ...contact, [field]: value }
                    : contact
            );
            console.log('Updated contacts:', updated); // Debug log
            return updated;
        });
    }, []);

    const handleEmailBlur = useCallback((contactId: string, email: string, inputElement: HTMLInputElement) => {
        if (email.trim() && !validateEmail(email)) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                if (!newErrors[contactId]) {
                    newErrors[contactId] = [];
                }
                if (!newErrors[contactId].includes('email')) {
                    newErrors[contactId].push('email');
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

    const handleEmailKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, contactId: string) => {
        if (e.key === 'Tab') {
            const email = e.currentTarget.value;
            if (email.trim() && !validateEmail(email)) {
                e.preventDefault(); // Prevent tab navigation
                setValidationErrors(prev => {
                    const newErrors = { ...prev };
                    if (!newErrors[contactId]) {
                        newErrors[contactId] = [];
                    }
                    if (!newErrors[contactId].includes('email')) {
                        newErrors[contactId].push('email');
                    }
                    return newErrors;
                });
            }
        }
    }, []);

    const removeContact = (id: string) => {
        if (contacts.length > 1) {
            setContacts(prev => prev.filter(contact => contact.id !== id));
        }
    };

    const handleSave = () => {
        // Validate all contacts before saving
        if (!validateAllContacts()) {
            return; // Don't save if validation fails
        }

        const validContacts = contacts.filter(contact => 
            contact.name.trim() || contact.email.trim() || contact.phone.trim() || contact.department.trim()
        );
        onSave(validContacts);
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
                {/* Left Panel - Pipeline Canvas Style (Narrow) */}
                <div className="w-10 bg-slate-800 text-white flex flex-col relative h-screen">
                    {/* Panel Content - Empty (no icons) */}
                    <div className="flex-1 relative z-10">
                        {/* Empty space - no content */}
                    </div>
                    
                    {/* Middle Text - Rotated and Bold */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -rotate-90 origin-center z-10">
                        <div className="flex items-center space-x-2 text-sm font-bold text-white whitespace-nowrap tracking-wide">
                            <User className="h-4 w-4" />
                            <span>Manage Contact</span>
                        </div>
                    </div>
                    
                    {/* Logo Watermark - Bottom of Panel */}
                    <div className="absolute bottom-2 left-1 right-1 h-16">
                        <img 
                            src="/images/logos/logo.svg" 
                            alt="Logo" 
                            className="w-full h-full object-contain opacity-20"
                        />
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col bg-white">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 px-6 py-4 border-b border-blue-500/20 flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-base">Configure contact information</p>
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
                            {/* Contact Cards */}
                            {contacts.map((contact, index) => (
                                <div 
                                    key={contact.id} 
                                    className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-blue-100 rounded-lg">
                                                <User className="h-4 w-4 text-blue-600" />
                                            </div>
                                            <h3 className="text-base font-semibold text-gray-900">
                                                Contact {index + 1}
                                            </h3>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            {isContactComplete(contact) && activelyEditingNewContact.has(contact.id) && (
                                                <button
                                                    onClick={() => {
                                                        // Remove from actively editing when user is done
                                                        setActivelyEditingNewContact(prev => {
                                                            const newSet = new Set(prev);
                                                            newSet.delete(contact.id);
                                                            return newSet;
                                                        });
                                                        // Also clear the editingContactId if this contact was being edited
                                                        if (editingContactId === contact.id) {
                                                            setEditingContactId(null);
                                                        }
                                                    }}
                                                    className="flex items-center space-x-1 px-3 py-1.5 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                                                >
                                                    <span>✓ Done</span>
                                                </button>
                                            )}
                                            {isContactComplete(contact) && !activelyEditingNewContact.has(contact.id) && (
                                                <button
                                                    onClick={() => {
                                                        if (editingContactId === contact.id) {
                                                            setEditingContactId(null);
                                                        } else {
                                                            setEditingContactId(contact.id);
                                                            // Add back to actively editing when clicking Edit from summary
                                                            setActivelyEditingNewContact(prev => {
                                                                const newSet = new Set(prev);
                                                                newSet.add(contact.id);
                                                                return newSet;
                                                            });
                                                        }
                                                    }}
                                                    className="flex items-center space-x-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    <Edit2 className="h-3 w-3" />
                                                    <span>{editingContactId === contact.id ? 'Cancel' : 'Edit'}</span>
                                                </button>
                                            )}
                                            {contacts.length > 1 && (
                                                <button
                                                    onClick={() => removeContact(contact.id)}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm transition-colors"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Contact Form Fields - Always show for incomplete contacts, actively editing contacts, or when explicitly editing */}
                                    {(!isContactComplete(contact) || activelyEditingNewContact.has(contact.id) || editingContactId === contact.id) ? (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Full Name *
                                                </label>
                                                <input
                                                    id={`name-${contact.id}`}
                                                    name={`name-${contact.id}`}
                                                    type="text"
                                                    value={contact.name || ''}
                                                    onChange={(e) => updateContact(contact.id, 'name', e.target.value)}
                                                    className={`w-full px-2 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors bg-white min-h-[28px] ${
                                                        validationErrors[contact.id]?.includes('name')
                                                            ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                                                            : 'border-blue-300 focus:ring-blue-200 focus:border-blue-500'
                                                    }`}
                                                    autoComplete="name"
                                                />
                                                {validationErrors[contact.id]?.includes('name') && (
                                                    <p className="text-red-500 text-xs mt-1">Full Name is required</p>
                                                )}
                                            </div>
                                            
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Email Address *
                                                </label>
                                                <input
                                                    id={`email-${contact.id}`}
                                                    name={`email-${contact.id}`}
                                                    type="email"
                                                    value={contact.email || ''}
                                                    onChange={(e) => updateContact(contact.id, 'email', e.target.value)}
                                                    onBlur={(e) => handleEmailBlur(contact.id, e.target.value, e.target)}
                                                    onKeyDown={(e) => handleEmailKeyDown(e, contact.id)}
                                                    className={`w-full px-2 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors bg-white min-h-[28px] ${
                                                        validationErrors[contact.id]?.includes('email')
                                                            ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                                                            : 'border-blue-300 focus:ring-blue-200 focus:border-blue-500'
                                                    }`}
                                                    autoComplete="email"
                                                />
                                                {validationErrors[contact.id]?.includes('email') && (
                                                    <p className="text-red-500 text-xs mt-1">
                                                        {!contact.email?.trim() ? 'Email Address is required' : 'Please enter a valid email address'}
                                                    </p>
                                                )}
                                            </div>
                                            
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Phone Number *
                                                </label>
                                                <input
                                                    id={`phone-${contact.id}`}
                                                    name={`phone-${contact.id}`}
                                                    type="tel"
                                                    value={contact.phone || ''}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        updateContact(contact.id, 'phone', value);
                                                    }}
                                                    onBlur={(e) => {
                                                        const value = e.target.value.trim();
                                                        if (value && !/^\d+$/.test(value)) {
                                                            // Invalid phone number, keep focus and show validation error
                                                            setTimeout(() => {
                                                                e.target.focus();
                                                            }, 0);
                                                            // Update validation errors to show phone error
                                                            setValidationErrors(prev => ({
                                                                ...prev,
                                                                [contact.id]: [...(prev[contact.id] || []).filter(err => err !== 'phone'), 'phone']
                                                            }));
                                                        } else if (value && /^\d+$/.test(value)) {
                                                            // Valid phone number, clear validation error
                                                            setValidationErrors(prev => ({
                                                                ...prev,
                                                                [contact.id]: (prev[contact.id] || []).filter(err => err !== 'phone')
                                                            }));
                                                        }
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Tab') {
                                                            const value = e.currentTarget.value.trim();
                                                            if (value && !/^\d+$/.test(value)) {
                                                                e.preventDefault();
                                                                // Show validation error
                                                                setValidationErrors(prev => ({
                                                                    ...prev,
                                                                    [contact.id]: [...(prev[contact.id] || []).filter(err => err !== 'phone'), 'phone']
                                                                }));
                                                                return false;
                                                            }
                                                        }
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                        }
                                                    }}
                                                    className={`w-full px-2 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors bg-white min-h-[28px] ${
                                                        validationErrors[contact.id]?.includes('phone')
                                                            ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                                                            : 'border-blue-300 focus:ring-blue-200 focus:border-blue-500'
                                                    }`}
                                                    autoComplete="tel"
                                                />
                                                {validationErrors[contact.id]?.includes('phone') && (
                                                    <p className="text-red-500 text-xs mt-1">
                                                        {!contact.phone?.trim() ? 'Phone Number is required' : 'Please enter numbers only in this field'}
                                                    </p>
                                                )}
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Department *
                                                    </label>
                                                    <input
                                                        id={`department-${contact.id}`}
                                                        name={`department-${contact.id}`}
                                                        type="text"
                                                        value={contact.department || ''}
                                                        onChange={(e) => updateContact(contact.id, 'department', e.target.value)}
                                                        className={`w-full px-2 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors bg-white min-h-[28px] ${
                                                            validationErrors[contact.id]?.includes('department')
                                                                ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                                                                : 'border-blue-300 focus:ring-blue-200 focus:border-blue-500'
                                                        }`}
                                                        autoComplete="organization-title"
                                                    />
                                                    {validationErrors[contact.id]?.includes('department') && (
                                                        <p className="text-red-500 text-xs mt-1">Department is required</p>
                                                    )}
                                                </div>
                                                
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Designation *
                                                    </label>
                                                    <input
                                                        id={`designation-${contact.id}`}
                                                        name={`designation-${contact.id}`}
                                                        type="text"
                                                        value={contact.designation || ''}
                                                        onChange={(e) => updateContact(contact.id, 'designation', e.target.value)}
                                                        className={`w-full px-2 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors bg-white min-h-[28px] ${
                                                            validationErrors[contact.id]?.includes('designation')
                                                                ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                                                                : 'border-blue-300 focus:ring-blue-200 focus:border-blue-500'
                                                        }`}
                                                        autoComplete="organization-title"
                                                    />
                                                    {validationErrors[contact.id]?.includes('designation') && (
                                                        <p className="text-red-500 text-xs mt-1">Designation is required</p>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Company *
                                                </label>
                                                <input
                                                    id={`company-${contact.id}`}
                                                    name={`company-${contact.id}`}
                                                    type="text"
                                                    value={contact.company || ''}
                                                    onChange={(e) => updateContact(contact.id, 'company', e.target.value)}
                                                    className={`w-full px-2 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors bg-white min-h-[28px] ${
                                                        validationErrors[contact.id]?.includes('company')
                                                            ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                                                            : 'border-blue-300 focus:ring-blue-200 focus:border-blue-500'
                                                    }`}
                                                    autoComplete="organization"
                                                />
                                                {validationErrors[contact.id]?.includes('company') && (
                                                    <p className="text-red-500 text-xs mt-1">Company is required</p>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        /* Show contact summary when not editing */
                                        <div className="bg-white border border-slate-300 rounded-lg p-5 shadow-sm">
                                            <div className="flex items-center space-x-2 mb-4 pb-3 border-b border-slate-200">
                                                <User className="h-4 w-4 text-slate-600" />
                                                <span className="text-sm font-semibold text-slate-800">Contact Information</span>
                                            </div>
                                            
                                            <div className="space-y-4">
                                                {/* Name and Email */}
                                                <div className="grid grid-cols-2 gap-4">
                                                    {contact.name && (
                                                        <div>
                                                            <div className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">Full Name</div>
                                                            <div className="text-sm text-slate-600 font-medium">{contact.name}</div>
                                                        </div>
                                                    )}
                                                    
                                                    {contact.email && (
                                                        <div>
                                                            <div className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">Email</div>
                                                            <div className="text-sm text-slate-600">{contact.email}</div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Phone and Company */}
                                                <div className="grid grid-cols-2 gap-4">
                                                    {contact.phone && (
                                                        <div>
                                                            <div className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">Phone</div>
                                                            <div className="text-sm text-slate-600 font-mono">{contact.phone}</div>
                                                        </div>
                                                    )}

                                                    {contact.company && (
                                                        <div>
                                                            <div className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">Company</div>
                                                            <div className="text-sm text-slate-600">{contact.company}</div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Department and Designation */}
                                                <div className="grid grid-cols-2 gap-4">
                                                    {contact.department && (
                                                        <div>
                                                            <div className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">Department</div>
                                                            <div className="text-sm text-slate-600">{contact.department}</div>
                                                        </div>
                                                    )}

                                                    {contact.designation && (
                                                        <div>
                                                            <div className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">Designation</div>
                                                            <div className="text-sm text-slate-600">{contact.designation}</div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                            
                            {/* Add New Contact Button */}
                            {(() => {
                                // Check if the first contact is complete
                                const firstContact = contacts[0];
                                const isFirstContactComplete = isContactComplete(firstContact);
                                
                                return (
                                    <div className="relative">
                                        <motion.button
                                            onClick={isFirstContactComplete ? addNewContact : undefined}
                                            disabled={!isFirstContactComplete}
                                            className={`w-full group relative overflow-hidden rounded-xl p-6 transition-all duration-300 ease-out ${
                                                isFirstContactComplete 
                                                    ? 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-dashed border-blue-300 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/20 cursor-pointer'
                                                    : 'bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 border-2 border-dashed border-gray-300 cursor-not-allowed opacity-50'
                                            }`}
                                            whileHover={isFirstContactComplete ? { 
                                                scale: 1.01,
                                                y: -2
                                            } : {}}
                                            whileTap={isFirstContactComplete ? { scale: 0.99 } : {}}
                                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                        >
                                            {/* Animated background gradient */}
                                            {isFirstContactComplete && (
                                                <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 via-indigo-100/50 to-purple-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                                            )}
                                            
                                            <div className="relative flex items-center justify-center space-x-3">
                                                <motion.div
                                                    className={`p-2.5 rounded-lg shadow-lg ${
                                                        isFirstContactComplete 
                                                            ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                                                            : 'bg-gradient-to-br from-gray-400 to-gray-500'
                                                    }`}
                                                    whileHover={isFirstContactComplete ? { 
                                                        rotate: 90,
                                                        scale: 1.1
                                                    } : {}}
                                                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                                                >
                                                    <Plus className="h-5 w-5 text-white" />
                                                </motion.div>
                                                <div className="text-left">
                                                    <div className={`font-semibold text-base transition-colors duration-200 ${
                                                        isFirstContactComplete 
                                                            ? 'text-gray-800 group-hover:text-blue-700'
                                                            : 'text-gray-500'
                                                    }`}>
                                                        Add New Contact
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Subtle shine effect - only when enabled */}
                                            {isFirstContactComplete && (
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

export default ContactModal;