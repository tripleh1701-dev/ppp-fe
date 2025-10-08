import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, MapPin, Save, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateId } from '@/utils/id-generator';

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
        id: generateId(),
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
    }]);
    const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

    // Reset addresses when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            if (initialAddresses.length > 0) {
                setAddresses(initialAddresses);
            } else {
                setAddresses([{
                    id: generateId(),
                    addressLine1: '',
                    addressLine2: '',
                    city: '',
                    state: '',
                    zipCode: '',
                    country: ''
                }]);
            }
        }
    }, [isOpen, initialAddresses]);

    const addNewAddress = () => {
        setAddresses(prev => [
            ...prev,
            {
                id: generateId(),
                addressLine1: '',
                addressLine2: '',
                city: '',
                state: '',
                zipCode: '',
                country: ''
            }
        ]);
    };

    const updateAddress = useCallback((id: string, field: keyof Omit<Address, 'id'>, value: string) => {
        console.log('Updating address:', { id, field, value }); // Debug log
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

    const removeAddress = (id: string) => {
        if (addresses.length > 1) {
            setAddresses(prev => prev.filter(addr => addr.id !== id));
        }
    };

    const handleSave = () => {
        const validAddresses = addresses.filter(addr => 
            addr.addressLine1.trim() || addr.city.trim() || addr.state.trim() || addr.zipCode.trim()
        );
        onSave(validAddresses);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] overflow-hidden">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black bg-opacity-50"
                onClick={onClose}
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
                                <p className="text-blue-100 text-sm">Configure delivery and billing addresses</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={handleSave}
                                className="flex items-center space-x-2 px-4 py-2 bg-white text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-50 transition-colors shadow-sm"
                            >
                                <Save className="h-4 w-4" />
                                <span>Save Changes</span>
                            </button>
                            <button
                                onClick={onClose}
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
                                            {(address.addressLine1 || address.city || address.state || address.zipCode) && (
                                                <button
                                                    onClick={() => setEditingAddressId(editingAddressId === address.id ? null : address.id)}
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
                                    
                                    {/* Address Form Fields - Always show for new addresses or when editing */}
                                    {(!address.addressLine1 && !address.city && !address.state && !address.zipCode) || editingAddressId === address.id ? (
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
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                                                    autoComplete="address-line1"
                                                />
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
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                                                        autoComplete="address-level2"
                                                    />
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
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                                                        autoComplete="address-level1"
                                                    />
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
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                                                        autoComplete="postal-code"
                                                    />
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
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                                                        autoComplete="country"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        /* Show address summary when not editing */
                                        <div className="space-y-2 text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">
                                            {address.addressLine1 && <div className="font-medium">{address.addressLine1}</div>}
                                            {address.addressLine2 && <div>{address.addressLine2}</div>}
                                            {(address.city || address.state || address.zipCode) && (
                                                <div>
                                                    {address.city}{address.city && address.state && ', '}{address.state} {address.zipCode}
                                                </div>
                                            )}
                                            {address.country && <div className="text-gray-600">{address.country}</div>}
                                        </div>
                                    )}
                                </div>
                            ))}
                            
                            {/* Add New Address Button - Styled exactly like Add New License */}
                            {(() => {
                                // Check if the first address has ALL required fields filled
                                const firstAddress = addresses[0];
                                const isFirstAddressComplete = firstAddress && 
                                    firstAddress.addressLine1?.trim() && 
                                    firstAddress.city?.trim() && 
                                    firstAddress.state?.trim() && 
                                    firstAddress.zipCode?.trim() && 
                                    firstAddress.country?.trim();
                                
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
        </div>
    );
};

export default AddressModal;