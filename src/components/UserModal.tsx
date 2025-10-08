'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Phone, Mail, User, Building, Save } from 'lucide-react';
import { createPortal } from 'react-dom';

export interface UserData {
    id?: string;
    name: string;
    email: string;
    phone: string;
    department: string;
    designation: string;
    company: string;
}

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (userData: UserData) => void;
    initialData?: UserData | null;
    title?: string;
    accountName?: string;
    masterAccount?: string;
}

const UserModal: React.FC<UserModalProps> = ({
    isOpen,
    onClose,
    onSave,
    initialData,
    title = "Contact Details",
    accountName = '',
    masterAccount = ''
}) => {
    const [userData, setUserData] = useState<UserData>({
        name: '',
        email: '',
        phone: '',
        department: '',
        designation: '',
        company: ''
    });
    
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
    const firstInputRef = useRef<HTMLInputElement>(null);

    // Initialize form data when modal opens or initial data changes
    useEffect(() => {
        if (isOpen && initialData) {
            setUserData({
                name: initialData.name || '',
                email: initialData.email || '',
                phone: initialData.phone || '',
                department: initialData.department || '',
                designation: initialData.designation || '',
                company: initialData.company || ''
            });
            setHasUnsavedChanges(false);
        } else if (isOpen && !initialData) {
            setUserData({
                name: '',
                email: '',
                phone: '',
                department: '',
                designation: '',
                company: ''
            });
            setHasUnsavedChanges(false);
        }
    }, [isOpen, initialData]);

    // Focus first input when modal opens
    useEffect(() => {
        if (isOpen && firstInputRef.current) {
            setTimeout(() => {
                firstInputRef.current?.focus();
            }, 100);
        }
    }, [isOpen]);

    const handleInputChange = (field: keyof UserData, value: string) => {
        setUserData(prev => ({
            ...prev,
            [field]: value
        }));
        setHasUnsavedChanges(true);
    };

    const handleSave = () => {
        onSave(userData);
        setHasUnsavedChanges(false);
        onClose();
    };

    const handleClose = () => {
        if (hasUnsavedChanges) {
            setShowUnsavedWarning(true);
        } else {
            onClose();
        }
    };

    const handleConfirmClose = () => {
        setHasUnsavedChanges(false);
        setShowUnsavedWarning(false);
        onClose();
    };

    const handleCancelClose = () => {
        setShowUnsavedWarning(false);
    };

    const isFormValid = userData.name.trim() !== '' || userData.email.trim() !== '' || userData.phone.trim() !== '';

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-end">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/30"
                onClick={handleClose}
            />

            {/* Modal */}
            <motion.div
                initial={{ x: '100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="relative w-[500px] h-full bg-white shadow-2xl flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
                    <div>
                        <div className="flex items-center space-x-2 mb-1">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            <h2 className="text-lg font-semibold">{title}</h2>
                        </div>
                        <p className="text-blue-100 text-sm">Configure contact information</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handleSave}
                            disabled={!isFormValid}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                isFormValid
                                    ? 'bg-white text-blue-600 hover:bg-blue-50'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                        >
                            Save
                        </button>
                        <button
                            onClick={handleClose}
                            className="text-white hover:text-blue-200 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Account Names */}
                <div className="p-4 bg-blue-50 border-b flex space-x-4">
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Account Name</label>
                        <div className="bg-white border border-gray-300 rounded px-3 py-2 text-sm text-gray-900">
                            {accountName}
                        </div>
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Master Account</label>
                        <div className="bg-white border border-gray-300 rounded px-3 py-2 text-sm text-gray-900">
                            {masterAccount}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-6">
                        {/* Name */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <User className="w-4 h-4 text-blue-600" />
                                Full Name
                            </label>
                            <input
                                ref={firstInputRef}
                                type="text"
                                value={userData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Mail className="w-4 h-4 text-blue-600" />
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={userData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            />
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Phone className="w-4 h-4 text-blue-600" />
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                value={userData.phone}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            />
                        </div>

                        {/* Department */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Building className="w-4 h-4 text-blue-600" />
                                Department
                            </label>
                            <input
                                type="text"
                                value={userData.department}
                                onChange={(e) => handleInputChange('department', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            />
                        </div>

                        {/* Designation */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <User className="w-4 h-4 text-blue-600" />
                                Designation
                            </label>
                            <input
                                type="text"
                                value={userData.designation}
                                onChange={(e) => handleInputChange('designation', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            />
                        </div>

                        {/* Company */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Building className="w-4 h-4 text-blue-600" />
                                Company
                            </label>
                            <input
                                type="text"
                                value={userData.company}
                                onChange={(e) => handleInputChange('company', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 bg-gray-50">
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={handleClose}
                            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        >
                            Cancel
                        </button>
                    </div>
                </div>

                {/* Unsaved Changes Warning */}
                <AnimatePresence>
                    {showUnsavedWarning && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/50 flex items-center justify-center"
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                className="bg-white rounded-lg p-6 mx-4 max-w-md w-full"
                            >
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Unsaved Changes
                                </h3>
                                <p className="text-gray-600 mb-4">
                                    You have unsaved changes. Are you sure you want to close without saving?
                                </p>
                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={handleCancelClose}
                                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Continue Editing
                                    </button>
                                    <button
                                        onClick={handleConfirmClose}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                    >
                                        Discard Changes
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>,
        document.body
    );
};

export default UserModal;