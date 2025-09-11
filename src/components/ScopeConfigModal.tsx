'use client';

import React, {useState} from 'react';

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
}

const ScopeConfigModal: React.FC<ScopeConfigModalProps> = ({
    isOpen,
    onClose,
    roleName,
    roleDescription,
    currentScope,
    onSave,
}) => {
    const [selectedCategory, setSelectedCategory] = useState('');
    const [rightPanelRef, setRightPanelRef] = useState<HTMLDivElement | null>(
        null,
    );
    const [selectedSubItem, setSelectedSubItem] = useState('');
    const [permissions, setPermissions] = useState<Record<string, string[]>>(
        {},
    );

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

    const handleSave = () => {
        onSave({
            category: selectedCategory,
            permissions,
            configuredAt: new Date().toISOString(),
        });
        onClose();
    };

    if (!isOpen) return null;

    const selectedCategoryData = categories.find(
        (cat) => cat.id === selectedCategory,
    );

    return (
        <div className='fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm animate-fadeIn'>
            <div className='bg-white rounded-xl shadow-2xl w-[90vw] h-[80vh] max-w-6xl overflow-hidden animate-slideIn'>
                {/* Header */}
                <div className='bg-gradient-to-r from-slate-50 to-gray-100 border-b border-gray-200 text-gray-800 p-6'>
                    <div className='flex justify-between items-center'>
                        <div className='flex-1'>
                            <h2 className='text-2xl font-bold text-gray-900'>
                                Configure Role Scope
                            </h2>
                            <p className='text-gray-600 mt-1'>
                                Define permissions for:{' '}
                                <span className='font-semibold text-blue-600'>
                                    {roleName}
                                </span>
                            </p>
                            <p className='text-gray-500 text-sm mt-1'>
                                {roleDescription}
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className='flex items-center gap-3 ml-6'>
                            <button
                                onClick={onClose}
                                className='flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 rounded-lg transition-all duration-300 font-medium transform hover:scale-105 hover:shadow-md'
                            >
                                <svg
                                    width='18'
                                    height='18'
                                    viewBox='0 0 24 24'
                                    fill='none'
                                    className='transition-transform duration-300 group-hover:-translate-x-1'
                                >
                                    <path
                                        d='M19 12H5M12 19l-7-7 7-7'
                                        stroke='currentColor'
                                        strokeWidth='2'
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                    />
                                </svg>
                                Back to Roles
                            </button>

                            <button
                                onClick={handleSave}
                                className='flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 hover:-translate-y-0.5'
                            >
                                <svg
                                    width='18'
                                    height='18'
                                    viewBox='0 0 24 24'
                                    fill='none'
                                    className='transition-transform duration-300 group-hover:rotate-12'
                                >
                                    <path
                                        d='M19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16L21 8V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21Z'
                                        stroke='currentColor'
                                        strokeWidth='2'
                                    />
                                    <polyline
                                        points='17,21 17,13 7,13 7,21'
                                        stroke='currentColor'
                                        strokeWidth='2'
                                    />
                                    <polyline
                                        points='7,3 7,8 15,8'
                                        stroke='currentColor'
                                        strokeWidth='2'
                                    />
                                </svg>
                                Apply Changes
                            </button>

                            <button
                                onClick={onClose}
                                className='p-2 hover:bg-gray-100 rounded-lg transition-all duration-300 text-gray-500 hover:text-gray-700 transform hover:scale-110 hover:rotate-90'
                            >
                                <svg
                                    width='24'
                                    height='24'
                                    viewBox='0 0 24 24'
                                    fill='none'
                                >
                                    <path
                                        d='M18 6L6 18M6 6l12 12'
                                        stroke='currentColor'
                                        strokeWidth='2'
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div className='flex h-[calc(100%-140px)]'>
                    {/* Left Sidebar - Module Tiles */}
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
                                        const categoryElement =
                                            document.getElementById(
                                                `category-${category.id}`,
                                            );
                                        if (categoryElement && rightPanelRef) {
                                            const offsetTop =
                                                categoryElement.offsetTop -
                                                rightPanelRef.offsetTop -
                                                20;
                                            rightPanelRef.scrollTo({
                                                top: offsetTop,
                                                behavior: 'smooth',
                                            });
                                        }
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

                    {/* Main Content - Option Tiles */}
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
                                                                        {
                                                                            item.name
                                                                        }
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
                                                                                key={
                                                                                    type
                                                                                }
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
                                                                                    {
                                                                                        type
                                                                                    }
                                                                                </span>
                                                                                <label className='cursor-pointer relative group/checkbox'>
                                                                                    <input
                                                                                        type='checkbox'
                                                                                        className='w-5 h-5 text-blue-600 bg-white border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 transition-all duration-300 hover:border-blue-400 hover:scale-110'
                                                                                        checked={
                                                                                            permissions[
                                                                                                item
                                                                                                    .id
                                                                                            ]?.includes(
                                                                                                type,
                                                                                            ) ||
                                                                                            false
                                                                                        }
                                                                                        onChange={(
                                                                                            e,
                                                                                        ) =>
                                                                                            handlePermissionChange(
                                                                                                item.id,
                                                                                                type,
                                                                                                e
                                                                                                    .target
                                                                                                    .checked,
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
        </div>
    );
};

export default ScopeConfigModal;
