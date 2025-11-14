'use client';

import React, {useState} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck } from 'lucide-react';
import { BookmarkIcon } from '@heroicons/react/24/outline';

// Add custom animations via style tag
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(-20px) scale(0.95);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        @keyframes slideInLeft {
            from {
                opacity: 0;
                transform: translateX(-30px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        @keyframes slideInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .animate-fadeIn {
            animation: fadeIn 0.6s ease-out;
        }

        .animate-slideIn {
            animation: slideIn 0.6s ease-out;
        }

        .animate-slideInLeft {
            animation: slideInLeft 0.5s ease-out;
        }

        .animate-slideInUp {
            animation: slideInUp 0.5s ease-out;
        }
    `;
    document.head.appendChild(style);
}

interface ScopeConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    roleName: string;
    roleDescription: string;
    currentScope?: any;
    onSave: (scopeConfig: any) => void;
    stackLevel?: number;
}

const ScopeConfigModal: React.FC<ScopeConfigModalProps> = ({
    isOpen,
    onClose,
    roleName,
    roleDescription,
    currentScope,
    onSave,
    stackLevel = 2,
}) => {
    const [selectedCategory, setSelectedCategory] = useState('');
    const [rightPanelRef, setRightPanelRef] = useState<HTMLDivElement | null>(
        null,
    );
    const [selectedSubItem, setSelectedSubItem] = useState('');
    const [permissions, setPermissions] = useState<Record<string, string[]>>(
        {},
    );
    const [isSaving, setIsSaving] = useState(false);

    const categories = [
        {
            id: 'account-settings',
            name: 'Account Settings',
            icon: (
                <svg width='20' height='20' viewBox='0 0 24 24' fill='none'>
                    <circle
                        cx='12'
                        cy='12'
                        r='3'
                        stroke='currentColor'
                        strokeWidth='2'
                    />
                    <path
                        d='M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z'
                        stroke='currentColor'
                        strokeWidth='2'
                    />
                </svg>
            ),
            items: [
                {id: 'user-profile', name: 'User Profile'},
                {id: 'billing', name: 'Billing'},
                {id: 'notifications', name: 'Notifications'},
                {id: 'api-keys', name: 'API Keys'},
            ],
        },
        {
            id: 'access-control',
            name: 'Access Control',
            icon: (
                <svg width='20' height='20' viewBox='0 0 24 24' fill='none'>
                    <rect
                        x='3'
                        y='11'
                        width='18'
                        height='11'
                        rx='2'
                        ry='2'
                        stroke='currentColor'
                        strokeWidth='2'
                    />
                    <circle
                        cx='12'
                        cy='16'
                        r='1'
                        stroke='currentColor'
                        strokeWidth='2'
                    />
                    <path
                        d='M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11'
                        stroke='currentColor'
                        strokeWidth='2'
                    />
                </svg>
            ),
            items: [
                {id: 'users', name: 'Users'},
                {id: 'roles', name: 'Roles'},
                {id: 'permissions', name: 'Permissions'},
                {id: 'groups', name: 'Groups'},
            ],
        },
        {
            id: 'security-governance',
            name: 'Security & Governance',
            icon: (
                <svg width='20' height='20' viewBox='0 0 24 24' fill='none'>
                    <path
                        d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'
                        stroke='currentColor'
                        strokeWidth='2'
                    />
                    <path
                        d='M9 12l2 2 4-4'
                        stroke='currentColor'
                        strokeWidth='2'
                    />
                </svg>
            ),
            items: [
                {id: 'audit-logs', name: 'Audit Logs'},
                {id: 'compliance', name: 'Compliance'},
                {id: 'policies', name: 'Policies'},
                {id: 'certificates', name: 'Certificates'},
            ],
        },
        {
            id: 'pipelines',
            name: 'Pipelines',
            icon: (
                <svg width='20' height='20' viewBox='0 0 24 24' fill='none'>
                    <path
                        d='M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01'
                        stroke='currentColor'
                        strokeWidth='2'
                    />
                </svg>
            ),
            items: [
                {id: 'pipeline-templates', name: 'Pipeline Templates'},
                {id: 'execution-history', name: 'Execution History'},
                {id: 'variables', name: 'Variables'},
                {id: 'triggers', name: 'Triggers'},
            ],
        },
        {
            id: 'builds',
            name: 'Builds',
            icon: (
                <svg width='20' height='20' viewBox='0 0 24 24' fill='none'>
                    <path
                        d='M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z'
                        stroke='currentColor'
                        strokeWidth='2'
                    />
                </svg>
            ),
            items: [
                {id: 'build-configs', name: 'Build Configurations'},
                {id: 'artifacts', name: 'Artifacts'},
                {id: 'deployment', name: 'Deployment'},
                {id: 'monitoring', name: 'Monitoring'},
            ],
        },
    ];

    const permissionTypes = ['View', 'Create', 'Edit', 'Delete'];

    const handlePermissionChange = (
        item: string,
        permissionType: string,
        checked: boolean,
    ) => {
        setPermissions((prev) => {
            const itemPermissions = prev[item] || [];
            if (checked) {
                return {
                    ...prev,
                    [item]: [...itemPermissions, permissionType],
                };
            } else {
                return {
                    ...prev,
                    [item]: itemPermissions.filter((p) => p !== permissionType),
                };
            }
        });
    };

    const handleSave = async () => {
        console.log('💾 Save button clicked');
        console.log('📊 Current permissions:', permissions);
        
        setIsSaving(true);
        try {
            await onSave({
                category: selectedCategory,
                permissions,
                configuredAt: new Date().toISOString(),
            });
            console.log('✅ Successfully saved scope configuration');
            onClose();
        } catch (error) {
            console.error('❌ Error saving scope configuration:', error);
            alert('Failed to save scope configuration. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const PANEL_BASE_WIDTH = 920;
    const SIDE_PANEL_WIDTH = 40;
    const MIN_PANEL_WIDTH = 640;
    const normalizedStackLevel = Math.max(0, stackLevel);
    const panelOffset = Math.min(normalizedStackLevel * SIDE_PANEL_WIDTH, PANEL_BASE_WIDTH - MIN_PANEL_WIDTH);
    const modalWidth = PANEL_BASE_WIDTH - panelOffset;
    const overlayZIndex = 11000 + normalizedStackLevel;
    const isTopLevelModal = normalizedStackLevel === 0;

    if (!isOpen) return null;

    const selectedCategoryData = categories.find(
        (cat) => cat.id === selectedCategory,
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <div
                    className={`fixed inset-0 overflow-hidden ${!isTopLevelModal ? 'pointer-events-none' : ''}`}
                    style={{ zIndex: overlayZIndex }}
                >
                    {/* Backdrop */}
                    {isTopLevelModal && (
                        <motion.div 
                            className="absolute inset-0 bg-black bg-opacity-50"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                        />
                    )}
                    
                    {/* Modal Panel - Slide in from right like AssignedUserGroupModal */}
                    <motion.div 
                        className="absolute right-0 top-0 h-screen shadow-2xl border-l border-gray-200 flex overflow-hidden pointer-events-auto bg-white"
                        style={{ width: `${modalWidth}px` }}
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
                        {/* Left Panel - Sidebar Image with Rotated Text */}
                        <div className="w-10 bg-slate-800 text-white flex flex-col relative h-screen">
                            <img 
                                src="/images/logos/sidebar.png" 
                                alt="Sidebar" 
                                className="w-full h-full object-cover"
                            />
                            
                            {/* Middle Text - Rotated and Bold */}
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -rotate-90 origin-center z-10">
                                <div className="flex items-center space-x-2 text-sm font-bold text-white whitespace-nowrap tracking-wide">
                                    <ShieldCheck className="h-4 w-4" />
                                    <span>Configure Scope</span>
                                </div>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 flex flex-col bg-white overflow-hidden">
                            {/* Header - Match AssignedUserGroupModal style */}
                            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 px-6 py-4 border-b border-blue-500/20 flex-shrink-0">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-blue-100 text-base">Configure Role Scope</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={onClose}
                                            className="p-2 text-white/70 hover:text-white hover:bg-white/10 transition-colors rounded-lg"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                                
                                {/* Role Info */}
                                <div className="mt-4 flex gap-3">
                                    <div className="flex-1 max-w-xs">
                                        <div className="text-blue-100 text-sm font-medium mb-1">Role Name</div>
                                        <div className="bg-white/10 rounded px-2 py-1 backdrop-blur-sm border border-white/20 min-h-[28px] flex items-center">
                                            <div className="text-white font-medium truncate text-xs">{roleName || '\u00A0'}</div>
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-blue-100 text-sm font-medium mb-1">Description</div>
                                        <div className="bg-white/10 rounded px-2 py-1 backdrop-blur-sm border border-white/20 min-h-[28px] flex items-center">
                                            <div className="text-white font-medium truncate text-xs">{roleDescription || '\u00A0'}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Toolbar - Save Button */}
                            <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
                                <div className="flex items-center justify-end gap-4">
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className={`flex items-center space-x-2 px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors shadow-sm ${
                                            isSaving 
                                                ? 'bg-blue-400 cursor-not-allowed' 
                                                : 'bg-blue-600 hover:bg-blue-700'
                                        }`}
                                    >
                                        <BookmarkIcon className="h-4 w-4" />
                                        <span>{isSaving ? 'Saving...' : 'Save'}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Content Area - Two Column Layout */}
                            <div className='flex flex-1 overflow-hidden'>
                                {/* Left Sidebar - Module Navigation Tiles */}
                                <div className='w-80 bg-gradient-to-b from-gray-50 to-white border-r border-gray-200 overflow-y-auto p-6'>
                                    <h3 className='text-lg font-semibold text-gray-800 mb-6 text-center'>
                                        System Modules
                                    </h3>
                                    <div className='grid grid-cols-1 gap-3'>
                                        {categories.map((category, index) => (
                                            <div
                                                key={category.id}
                                                onClick={() => {
                                                    setSelectedCategory(category.id);
                                                    // Scroll to the specific category section
                                                    setTimeout(() => {
                                                        const categoryElement = document.getElementById(`category-${category.id}`);
                                                        if (categoryElement) {
                                                            console.log('📍 Scrolling to category:', category.id);
                                                            categoryElement.scrollIntoView({
                                                                behavior: 'smooth',
                                                                block: 'start',
                                                                inline: 'nearest'
                                                            });
                                                        } else {
                                                            console.warn('⚠️ Category element not found:', `category-${category.id}`);
                                                        }
                                                    }, 100); // Small delay to ensure DOM is ready
                                                }}
                                                className={`group p-4 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg animate-slideInLeft ${
                                                    selectedCategory === category.id
                                                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-md'
                                                        : 'bg-white hover:bg-gray-50 border border-gray-200 hover:border-blue-100'
                                                }`}
                                                style={{animationDelay: `${index * 100}ms`}}
                                            >
                                                <div className='flex flex-col items-center text-center space-y-3'>
                                                    <div
                                                        className={`p-3 rounded-full transition-all duration-300 group-hover:scale-110 ${
                                                            selectedCategory === category.id
                                                                ? 'bg-blue-100 shadow-sm'
                                                                : 'bg-gray-100 group-hover:bg-blue-50'
                                                        }`}
                                                    >
                                                        <div
                                                            className={`transition-colors duration-300 ${
                                                                selectedCategory ===
                                                                category.id
                                                                    ? 'text-blue-600'
                                                                    : 'text-gray-600 group-hover:text-blue-500'
                                                            }`}
                                                        >
                                                            {category.icon}
                                                        </div>
                                                    </div>
                                                    <span
                                                        className={`font-medium text-sm transition-colors duration-300 ${
                                                            selectedCategory === category.id
                                                                ? 'text-blue-700'
                                                                : 'text-gray-700 group-hover:text-blue-600'
                                                        }`}
                                                    >
                                                        {category.name}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Right Panel - Permissions Configuration */}
                                <div
                                    ref={setRightPanelRef}
                                    className='flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-white'
                                >
                                    <div className='p-6'>
                                        <div className='mb-8 text-center animate-fadeIn'>
                                            <h3 className='text-2xl font-bold text-gray-800 mb-2'>
                                                System Permissions Configuration
                                            </h3>
                                            <p className='text-gray-600'>
                                                Configure access permissions for all system
                                                modules and features
                                            </p>
                                        </div>

                                        {/* All Categories - Vertical Layout */}
                                        <div className='space-y-6 max-w-5xl mx-auto'>
                                            {categories.map((category, index) => (
                                                <div
                                                    key={category.id}
                                                    id={`category-${category.id}`}
                                                    className='animate-slideInUp'
                                                    style={{
                                                        animationDelay: `${index * 150}ms`,
                                                    }}
                                                >
                                                    <div
                                                        className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden transition-all duration-500 hover:shadow-md ${
                                                            selectedCategory === category.id
                                                                ? 'border-blue-300 shadow-lg ring-2 ring-blue-100'
                                                                : 'border-gray-200 hover:border-gray-300'
                                                        }`}
                                                    >
                                                        {/* Category Header */}
                                                        <div
                                                            className={`px-6 py-4 border-b transition-all duration-300 ${
                                                                selectedCategory ===
                                                                category.id
                                                                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
                                                                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                                            }`}
                                                        >
                                                            <div className='flex items-center gap-3'>
                                                                <div
                                                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                                                                        selectedCategory ===
                                                                        category.id
                                                                            ? 'bg-blue-100 shadow-sm'
                                                                            : 'bg-gray-100 group-hover:bg-blue-50'
                                                                    }`}
                                                                >
                                                                    <div
                                                                        className={`transition-colors duration-300 ${
                                                                            selectedCategory ===
                                                                            category.id
                                                                                ? 'text-blue-600'
                                                                                : 'text-gray-600'
                                                                        }`}
                                                                    >
                                                                        {category.icon}
                                                                    </div>
                                                                </div>
                                                                <h4
                                                                    className={`text-lg font-semibold transition-colors duration-300 ${
                                                                        selectedCategory ===
                                                                        category.id
                                                                            ? 'text-blue-800'
                                                                            : 'text-gray-800'
                                                                    }`}
                                                                >
                                                                    {category.name}
                                                                </h4>
                                                            </div>
                                                        </div>

                                                        {/* Feature Items List */}
                                                        <div className='divide-y divide-gray-100'>
                                                            {category.items.map(
                                                                (item, itemIndex) => (
                                                                    <div
                                                                        key={item.id}
                                                                        className='px-6 py-5 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-all duration-300 group'
                                                                        style={{
                                                                            animationDelay: `${
                                                                                index *
                                                                                    150 +
                                                                                itemIndex *
                                                                                    50
                                                                            }ms`,
                                                                        }}
                                                                    >
                                                                        <div className='flex items-center justify-between'>
                                                                            {/* Feature Name */}
                                                                            <div className='flex-1'>
                                                                                <h5 className='text-base font-medium text-gray-800 mb-1 group-hover:text-gray-900 transition-colors duration-300'>
                                                                                    {item.name}
                                                                                </h5>
                                                                            </div>

                                                                            {/* Permission Checkboxes */}
                                                                            <div className='flex items-center gap-8'>
                                                                                {permissionTypes.map(
                                                                                    (
                                                                                        type,
                                                                                        typeIndex,
                                                                                    ) => (
                                                                                        <div
                                                                                            key={type}
                                                                                            className='flex flex-col items-center gap-2 animate-fadeIn'
                                                                                            style={{
                                                                                                animationDelay: `${
                                                                                                    index *
                                                                                                        150 +
                                                                                                    itemIndex *
                                                                                                        50 +
                                                                                                    typeIndex *
                                                                                                        25
                                                                                                }ms`,
                                                                                            }}
                                                                                        >
                                                                                            <span className='text-sm font-medium text-gray-600 group-hover:text-gray-700 transition-colors duration-300'>
                                                                                                {type}
                                                                                            </span>
                                                                                            <label className='cursor-pointer relative group/checkbox'>
                                                                                                <input
                                                                                                    type='checkbox'
                                                                                                    className='w-5 h-5 text-blue-600 bg-white border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 transition-all duration-300 hover:border-blue-400 hover:scale-110'
                                                                                                    checked={
                                                                                                        permissions[
                                                                                                            item.id
                                                                                                        ]?.includes(
                                                                                                            type,
                                                                                                        ) ||
                                                                                                        false
                                                                                                    }
                                                                                                    onChange={(e) =>
                                                                                                        handlePermissionChange(
                                                                                                            item.id,
                                                                                                            type,
                                                                                                            e.target.checked,
                                                                                                        )
                                                                                                    }
                                                                                                />
                                                                                                {/* Hover effect overlay */}
                                                                                                <div className='absolute inset-0 rounded bg-blue-100 opacity-0 group-hover/checkbox:opacity-20 transition-opacity duration-300'></div>
                                                                                            </label>
                                                                                        </div>
                                                                                    ),
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ),
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ScopeConfigModal;
