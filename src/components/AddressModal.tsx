import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, MapPin, Save, Edit2, XCircle } from 'lucide-react';
import { BookmarkIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

interface Address {
    id: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
}

interface AddressModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (addresses: Address[]) => void;
    accountName: string;
    masterAccount: string;
    initialAddresses?: Address[];
}

const AddressModal: React.FC<AddressModalProps> = ({
    isOpen,
    onClose,
    onSave,
    accountName,
    masterAccount,
    initialAddresses = []
}) => {
    const [addresses, setAddresses] = useState<Address[]>([{
        id: crypto.randomUUID(),
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
    }]);
    const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
    const [activelyEditingNewAddress, setActivelyEditingNewAddress] = useState<Set<string>>(new Set());
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
    const [originalAddresses, setOriginalAddresses] = useState<Address[]>([]);
    const [validationErrors, setValidationErrors] = useState<{[key: string]: string[]}>({});

    // Helper function to check if an address is complete
    const isAddressComplete = (address: Address): boolean => {
        return !!(address.addressLine1?.trim() && 
                 address.city?.trim() && 
                 address.state?.trim() && 
                 address.zipCode?.trim() && 
                 address.country?.trim());
    };

    // Validation functions
    const validateZipCode = (zipCode: string): boolean => {
        return /^\d+$/.test(zipCode.trim());
    };

    const validateAddress = (address: Address): string[] => {
        const errors: string[] = [];
        
        if (!address.addressLine1?.trim()) {
            errors.push('addressLine1');
        }
        if (!address.city?.trim()) {
            errors.push('city');
        }
        if (!address.state?.trim()) {
            errors.push('state');
        }
        if (!address.zipCode?.trim()) {
            errors.push('zipCode');
        } else if (!validateZipCode(address.zipCode)) {
            errors.push('zipCode');
        }
        if (!address.country?.trim()) {
            errors.push('country');
        }
        
        return errors;
    };

    const validateAllAddresses = (): boolean => {
        const errors: {[key: string]: string[]} = {};
        let hasErrors = false;

        addresses.forEach(address => {
            const addressErrors = validateAddress(address);
            if (addressErrors.length > 0) {
                errors[address.id] = addressErrors;
                hasErrors = true;
            }
        });

        setValidationErrors(errors);
        return !hasErrors;
    };

    // Reset addresses when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            if (initialAddresses.length > 0) {
                setAddresses(initialAddresses);
                setOriginalAddresses(JSON.parse(JSON.stringify(initialAddresses))); // Deep copy
                setActivelyEditingNewAddress(new Set());
            } else {
                const newId = crypto.randomUUID();
                const newAddresses = [{
                    id: newId,
                    addressLine1: '',
                    addressLine2: '',
                    city: '',
                    state: '',
                    zipCode: '',
                    country: ''
                }];
                setAddresses(newAddresses);
                setOriginalAddresses(JSON.parse(JSON.stringify(newAddresses))); // Deep copy
                // Mark this new address as actively being edited
                setActivelyEditingNewAddress(new Set([newId]));
            }
            setHasUnsavedChanges(false);
        }
    }, [isOpen, initialAddresses]);

    // Track changes to detect unsaved changes
    useEffect(() => {
        if (isOpen && originalAddresses.length > 0) {
            const hasChanges = JSON.stringify(addresses) !== JSON.stringify(originalAddresses);
            setHasUnsavedChanges(hasChanges);
        }
    }, [addresses, originalAddresses, isOpen]);

    const addNewAddress = () => {
        const newId = crypto.randomUUID();
        setAddresses(prev => [
            ...prev,
            {
                id: newId,
                addressLine1: '',
                addressLine2: '',
                city: '',
                state: '',
                zipCode: '',
                country: ''
            }
        ]);
        // Mark this new address as actively being edited
        setActivelyEditingNewAddress(prev => {
            const newSet = new Set(prev);
            newSet.add(newId);
            return newSet;
        });
    };

    const updateAddress = useCallback((id: string, field: keyof Omit<Address, 'id'>, value: string) => {
        console.log('Updating address:', { id, field, value }); // Debug log
        
        // Remove the zip code input filtering - allow all characters
        // Validation will happen on blur/tab instead
        
        // Mark this address as actively being edited if it wasn't already
        setActivelyEditingNewAddress(prev => {
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
        
        setAddresses(prev => {
            const updated = prev.map(addr => 
                addr.id === id 
                    ? { ...addr, [field]: value }
                    : addr
            );
            console.log('Updated addresses:', updated); // Debug log
            return updated;
        });
    }, []);

    const handleZipCodeBlur = useCallback((addressId: string, zipCode: string, inputElement: HTMLInputElement) => {
        if (zipCode.trim() && !validateZipCode(zipCode)) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                if (!newErrors[addressId]) {
                    newErrors[addressId] = [];
                }
                if (!newErrors[addressId].includes('zipCode')) {
                    newErrors[addressId].push('zipCode');
                }
                return newErrors;
            });
            // Prevent navigation by returning focus to the zip code field
            setTimeout(() => {
                inputElement.focus();
            }, 0);
            return false; // Indicate validation failed
        }
        return true; // Indicate validation passed
    }, []);

    const handleZipCodeKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, addressId: string) => {
        if (e.key === 'Tab') {
            const zipCode = e.currentTarget.value;
            if (zipCode.trim() && !validateZipCode(zipCode)) {
                e.preventDefault(); // Prevent tab navigation
                setValidationErrors(prev => {
                    const newErrors = { ...prev };
                    if (!newErrors[addressId]) {
                        newErrors[addressId] = [];
                    }
                    if (!newErrors[addressId].includes('zipCode')) {
                        newErrors[addressId].push('zipCode');
                    }
                    return newErrors;
                });
            }
        }
    }, []);

    const removeAddress = (id: string) => {
        if (addresses.length > 1) {
            setAddresses(prev => prev.filter(addr => addr.id !== id));
        }
    };

    const handleSave = () => {
        // Validate all addresses before saving
        if (!validateAllAddresses()) {
            return; // Don't save if validation fails
        }

        const validAddresses = addresses.filter(addr => 
            addr.addressLine1.trim() || addr.city.trim() || addr.state.trim() || addr.zipCode.trim()
        );
        onSave(validAddresses);
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
                className="absolute right-0 top-0 h-full w-[500px] bg-white shadow-2xl border-l border-gray-200 flex flex-col"
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
                                <MapPin className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white">Manage Addresses</h2>
                                <p className="text-blue-100 text-sm">Configure Account addresses</p>
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
                            {/* Address Cards */}
                            {addresses.map((address, index) => (
                                <div 
                                    key={address.id} 
                                    className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-blue-100 rounded-lg">
                                                <MapPin className="h-4 w-4 text-blue-600" />
                                            </div>
                                            <h3 className="text-base font-semibold text-gray-900">
                                                Address {index + 1}
                                            </h3>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            {isAddressComplete(address) && activelyEditingNewAddress.has(address.id) && (
                                                <button
                                                    onClick={() => {
                                                        // Remove from actively editing when user is done
                                                        setActivelyEditingNewAddress(prev => {
                                                            const newSet = new Set(prev);
                                                            newSet.delete(address.id);
                                                            return newSet;
                                                        });
                                                        // Also clear the editingAddressId if this address was being edited
                                                        if (editingAddressId === address.id) {
                                                            setEditingAddressId(null);
                                                        }
                                                    }}
                                                    className="flex items-center space-x-1 px-3 py-1.5 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                                                >
                                                    <span>✓ Done</span>
                                                </button>
                                            )}
                                            {isAddressComplete(address) && !activelyEditingNewAddress.has(address.id) && (
                                                <button
                                                    onClick={() => {
                                                        if (editingAddressId === address.id) {
                                                            setEditingAddressId(null);
                                                        } else {
                                                            setEditingAddressId(address.id);
                                                            // Add back to actively editing when clicking Edit from summary
                                                            setActivelyEditingNewAddress(prev => {
                                                                const newSet = new Set(prev);
                                                                newSet.add(address.id);
                                                                return newSet;
                                                            });
                                                        }
                                                    }}
                                                    className="flex items-center space-x-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    <Edit2 className="h-3 w-3" />
                                                    <span>{editingAddressId === address.id ? 'Cancel' : 'Edit'}</span>
                                                </button>
                                            )}
                                            {addresses.length > 1 && (
                                                <button
                                                    onClick={() => removeAddress(address.id)}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm transition-colors"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Address Form Fields - Always show for incomplete addresses, actively editing addresses, or when explicitly editing */}
                                    {(!isAddressComplete(address) || activelyEditingNewAddress.has(address.id) || editingAddressId === address.id) ? (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Address Line 1 *
                                                </label>
                                                <input
                                                    id={`address-line1-${address.id}`}
                                                    name={`addressLine1-${address.id}`}
                                                    type="text"
                                                    value={address.addressLine1 || ''}
                                                    onChange={(e) => updateAddress(address.id, 'addressLine1', e.target.value)}
                                                    className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors bg-white ${
                                                        validationErrors[address.id]?.includes('addressLine1')
                                                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                                            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                                    }`}
                                                    autoComplete="address-line1"
                                                />
                                                {validationErrors[address.id]?.includes('addressLine1') && (
                                                    <p className="text-red-500 text-xs mt-1">Address Line 1 is required</p>
                                                )}
                                            </div>
                                            
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Address Line 2
                                                </label>
                                                <input
                                                    id={`address-line2-${address.id}`}
                                                    name={`addressLine2-${address.id}`}
                                                    type="text"
                                                    value={address.addressLine2 || ''}
                                                    onChange={(e) => updateAddress(address.id, 'addressLine2', e.target.value)}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                                                    autoComplete="address-line2"
                                                />
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        City *
                                                    </label>
                                                    <input
                                                        id={`city-${address.id}`}
                                                        name={`city-${address.id}`}
                                                        type="text"
                                                        value={address.city || ''}
                                                        onChange={(e) => updateAddress(address.id, 'city', e.target.value)}
                                                        className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors bg-white ${
                                                            validationErrors[address.id]?.includes('city')
                                                                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                                                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                                        }`}
                                                        autoComplete="address-level2"
                                                    />
                                                    {validationErrors[address.id]?.includes('city') && (
                                                        <p className="text-red-500 text-xs mt-1">City is required</p>
                                                    )}
                                                </div>
                                                
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        State *
                                                    </label>
                                                    <input
                                                        id={`state-${address.id}`}
                                                        name={`state-${address.id}`}
                                                        type="text"
                                                        value={address.state || ''}
                                                        onChange={(e) => updateAddress(address.id, 'state', e.target.value)}
                                                        className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors bg-white ${
                                                            validationErrors[address.id]?.includes('state')
                                                                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                                                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                                        }`}
                                                        autoComplete="address-level1"
                                                    />
                                                    {validationErrors[address.id]?.includes('state') && (
                                                        <p className="text-red-500 text-xs mt-1">State is required</p>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        ZIP Code *
                                                    </label>
                                                    <input
                                                        id={`zipcode-${address.id}`}
                                                        name={`zipCode-${address.id}`}
                                                        type="text"
                                                        value={address.zipCode || ''}
                                                        onChange={(e) => updateAddress(address.id, 'zipCode', e.target.value)}
                                                        onBlur={(e) => handleZipCodeBlur(address.id, e.target.value, e.target)}
                                                        onKeyDown={(e) => handleZipCodeKeyDown(e, address.id)}
                                                        className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors bg-white ${
                                                            validationErrors[address.id]?.includes('zipCode')
                                                                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                                                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                                        }`}
                                                        autoComplete="postal-code"
                                                    />
                                                    {validationErrors[address.id]?.includes('zipCode') && (
                                                        <p className="text-red-500 text-xs mt-1">
                                                            {!address.zipCode?.trim() ? 'ZIP Code is required' : 'ZIP Code must contain only numbers'}
                                                        </p>
                                                    )}
                                                </div>
                                                
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Country *
                                                    </label>
                                                    <input
                                                        id={`country-${address.id}`}
                                                        name={`country-${address.id}`}
                                                        type="text"
                                                        value={address.country || ''}
                                                        onChange={(e) => updateAddress(address.id, 'country', e.target.value)}
                                                        className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors bg-white ${
                                                            validationErrors[address.id]?.includes('country')
                                                                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                                                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                                        }`}
                                                        autoComplete="country"
                                                    />
                                                    {validationErrors[address.id]?.includes('country') && (
                                                        <p className="text-red-500 text-xs mt-1">Country is required</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        /* Show address summary when not editing */
                                        <div className="bg-white border border-slate-300 rounded-lg p-5 shadow-sm">
                                            <div className="flex items-center space-x-2 mb-4 pb-3 border-b border-slate-200">
                                                <MapPin className="h-4 w-4 text-slate-600" />
                                                <span className="text-sm font-semibold text-slate-800">Address Information</span>
                                            </div>
                                            
                                            <div className="space-y-4">
                                                {/* Street Address */}
                                                {address.addressLine1 && (
                                                    <div>
                                                        <div className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">Street Address</div>
                                                        <div className="text-sm text-slate-600">
                                                            <div className="font-normal">{address.addressLine1}</div>
                                                            {address.addressLine2 && (
                                                                <div className="mt-1">{address.addressLine2}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* City, State, ZIP in a row */}
                                                <div className="grid grid-cols-3 gap-4">
                                                    {address.city && (
                                                        <div>
                                                            <div className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">City</div>
                                                            <div className="text-sm font-normal text-slate-600">{address.city}</div>
                                                        </div>
                                                    )}
                                                    
                                                    {address.state && (
                                                        <div>
                                                            <div className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">State</div>
                                                            <div className="text-sm font-normal text-slate-600">{address.state}</div>
                                                        </div>
                                                    )}

                                                    {address.zipCode && (
                                                        <div>
                                                            <div className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">ZIP Code</div>
                                                            <div className="text-sm font-normal text-slate-600 font-mono">{address.zipCode}</div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Country */}
                                                {address.country && (
                                                    <div>
                                                        <div className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">Country</div>
                                                        <div className="text-sm font-normal text-slate-600">{address.country}</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                            
                            {/* Add New Address Button */}
                            {(() => {
                                // Check if the first address is complete
                                const firstAddress = addresses[0];
                                const isFirstAddressComplete = isAddressComplete(firstAddress);
                                
                                return (
                                    <div className="relative">
                                        <motion.button
                                            onClick={isFirstAddressComplete ? addNewAddress : undefined}
                                            disabled={!isFirstAddressComplete}
                                            className={`w-full group relative overflow-hidden rounded-xl p-6 transition-all duration-300 ease-out ${
                                                isFirstAddressComplete 
                                                    ? 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-dashed border-blue-300 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/20 cursor-pointer'
                                                    : 'bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 border-2 border-dashed border-gray-300 cursor-not-allowed opacity-50'
                                            }`}
                                            whileHover={isFirstAddressComplete ? { 
                                                scale: 1.01,
                                                y: -2
                                            } : {}}
                                            whileTap={isFirstAddressComplete ? { scale: 0.99 } : {}}
                                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                        >
                                            {/* Animated background gradient */}
                                            {isFirstAddressComplete && (
                                                <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 via-indigo-100/50 to-purple-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                                            )}
                                            
                                            <div className="relative flex items-center justify-center space-x-3">
                                                <motion.div
                                                    className={`p-2.5 rounded-lg shadow-lg ${
                                                        isFirstAddressComplete 
                                                            ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                                                            : 'bg-gradient-to-br from-gray-400 to-gray-500'
                                                    }`}
                                                    whileHover={isFirstAddressComplete ? { 
                                                        rotate: 90,
                                                        scale: 1.1
                                                    } : {}}
                                                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                                                >
                                                    <Plus className="h-5 w-5 text-white" />
                                                </motion.div>
                                                <div className="text-left">
                                                    <div className={`font-semibold text-base transition-colors duration-200 ${
                                                        isFirstAddressComplete 
                                                            ? 'text-gray-800 group-hover:text-blue-700'
                                                            : 'text-gray-500'
                                                    }`}>
                                                        Add New Address
                                                    </div>
                                                    <div className={`text-sm transition-colors duration-200 ${
                                                        isFirstAddressComplete 
                                                            ? 'text-gray-500 group-hover:text-blue-500'
                                                            : 'text-gray-400'
                                                    }`}>
                                                        {isFirstAddressComplete 
                                                            ? 'Click to add another delivery address'
                                                            : 'Complete all required fields in Address 1 first'
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Subtle shine effect - only when enabled */}
                                            {isFirstAddressComplete && (
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

export default AddressModal;