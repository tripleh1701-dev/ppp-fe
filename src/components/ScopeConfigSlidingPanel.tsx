'use client';

import React, {useState, useEffect} from 'react';
import './ScopeConfigSlidingPanel.css';

interface ScopeConfigSlidingPanelProps {
    isOpen: boolean;
    onClose: () => void;
    roleId: string;
    roleName: string;
    roleDescription: string;
    currentScope?: any;
    onSave: (scopeConfig: any) => void;
}

const ScopeConfigSlidingPanel: React.FC<ScopeConfigSlidingPanelProps> = ({
    isOpen,
    onClose,
    roleId,
    roleName,
    roleDescription,
    currentScope,
    onSave,
}) => {
    const [selectedCategory, setSelectedCategory] = useState('');
    const [rightPanelRef, setRightPanelRef] = useState<HTMLDivElement | null>(
        null,
    );
    const [permissions, setPermissions] = useState<Record<string, string[]>>(
        {},
    );

    // Same categories and data structure as the modal
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
                        d='M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z'
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
        try {
            console.log('🔄 Saving scope configuration for role:', roleId);

            // Transform permissions data for the API
            const scopeConfigData: any = {
                accountSettings: [],
                accessControl: [],
                securityGovernance: [],
                pipelines: [],
                builds: [],
                configured: true,
                createdAt: new Date().toISOString(),
            };

            // Map permissions to scope configuration structure
            Object.entries(permissions).forEach(
                ([categoryKey, categoryPermissions]) => {
                    const permissionObjects = categoryPermissions.map(
                        (permission) => ({
                            resource: permission,
                            view: true, // You can customize this based on actual permission types
                            create: false,
                            edit: false,
                            delete: false,
                        }),
                    );

                    switch (categoryKey) {
                        case 'account-settings':
                            scopeConfigData.accountSettings = permissionObjects;
                            break;
                        case 'access-control':
                            scopeConfigData.accessControl = permissionObjects;
                            break;
                        case 'security-governance':
                            scopeConfigData.securityGovernance =
                                permissionObjects;
                            break;
                        case 'pipelines':
                            scopeConfigData.pipelines = permissionObjects;
                            break;
                        case 'builds':
                            scopeConfigData.builds = permissionObjects;
                            break;
                    }
                },
            );

            // Make API call to save scope configuration
            const response = await fetch(
                `http://localhost:4000/api/roles/${roleId}/scope`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(scopeConfigData),
                },
            );

            if (!response.ok) {
                throw new Error(
                    `Failed to save scope configuration: ${response.status}`,
                );
            }

            const result = await response.json();
            console.log('✅ Scope configuration saved successfully:', result);

            // Call the original onSave callback
            onSave({
                category: selectedCategory,
                permissions,
                configuredAt: new Date().toISOString(),
                saved: true,
            });

            onClose();
        } catch (error) {
            console.error('❌ Error saving scope configuration:', error);
            alert('Error saving scope configuration. Please try again.');
        }
    };

    // Fetch existing scope configuration when component opens
    useEffect(() => {
        const fetchScopeConfig = async () => {
            if (isOpen && roleId) {
                try {
                    console.log(
                        '🔄 Fetching scope configuration for role:',
                        roleId,
                    );
                    const response = await fetch(
                        `http://localhost:4000/api/roles/${roleId}/scope`,
                    );

                    if (response.ok) {
                        const data = await response.json();
                        console.log('✅ Scope configuration loaded:', data);

                        // Transform the loaded data back to permissions format
                        const loadedPermissions: any = {};

                        // Process each category
                        Object.entries(data).forEach(
                            ([categoryKey, categoryData]: [string, any]) => {
                                if (Array.isArray(categoryData)) {
                                    categoryData.forEach((item: any) => {
                                        if (item.resource) {
                                            const permissionTypes = [];
                                            if (item.view)
                                                permissionTypes.push('View');
                                            if (item.create)
                                                permissionTypes.push('Create');
                                            if (item.edit)
                                                permissionTypes.push('Edit');
                                            if (item.delete)
                                                permissionTypes.push('Delete');

                                            loadedPermissions[item.resource] =
                                                permissionTypes;
                                        }
                                    });
                                }
                            },
                        );

                        console.log(
                            '🔄 Transformed permissions:',
                            loadedPermissions,
                        );
                        setPermissions(loadedPermissions);
                    } else {
                        console.log(
                            'ℹ️ No existing scope configuration found for this role',
                        );
                        // Reset permissions if no config found
                        setPermissions({});
                    }
                } catch (error) {
                    console.error(
                        '❌ Error fetching scope configuration:',
                        error,
                    );
                    // Reset permissions on error
                    setPermissions({});
                }
            }
        };

        fetchScopeConfig();
    }, [isOpen, roleId]);

    // Set up global callback for communication with parent
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            if ((window as any).setSlidingPaneOpen) {
                (window as any).setSlidingPaneOpen(true);
            }
            return () => {
                document.body.style.overflow = '';
                if ((window as any).setSlidingPaneOpen) {
                    (window as any).setSlidingPaneOpen(false);
                }
            };
        } else {
            if ((window as any).setSlidingPaneOpen) {
                (window as any).setSlidingPaneOpen(false);
            }
        }
    }, [isOpen]);

    const selectedCategoryData = categories.find(
        (cat) => cat.id === selectedCategory,
    );

    return (
        <div className='h-full flex flex-col overflow-hidden'>
            <div className='h-full flex flex-col overflow-hidden'>
                {/* Header */}
                <div className='bg-gradient-to-r from-slate-50 to-gray-100 border-b border-gray-200 p-6 flex justify-between items-start'>
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
                    </div>
                </div>

                <div className='flex flex-1 overflow-hidden'>
                    {/* Left Sidebar - Module Tiles */}
                    <div className='w-64 bg-gradient-to-b from-gray-50 to-white border-r border-gray-200 overflow-y-auto p-4'>
                        <h3 className='text-lg font-semibold text-gray-800 mb-4 text-center'>
                            System Modules
                        </h3>
                        <div className='grid grid-cols-1 gap-2'>
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
                                    className={`group px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 animate-slideInLeft ${
                                        selectedCategory === category.id
                                            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 shadow-sm'
                                            : 'bg-white hover:bg-gray-50 border border-gray-200 hover:border-blue-100'
                                    }`}
                                    style={{animationDelay: `${index * 50}ms`}}
                                >
                                    <div className='flex items-center space-x-3'>
                                        <div
                                            className={`p-1.5 rounded-md transition-all duration-200 group-hover:scale-110 group-hover:rotate-3 transform ${
                                                selectedCategory === category.id
                                                    ? 'bg-blue-100 scale-105'
                                                    : 'bg-gray-100 group-hover:bg-blue-50'
                                            }`}
                                        >
                                            <div
                                                className={`transition-all duration-200 group-hover:scale-110 transform ${
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
                                            className={`font-medium text-sm transition-colors duration-200 ${
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

                    {/* Right Panel - Detailed Permissions Configuration */}
                    <div
                        ref={setRightPanelRef}
                        className='scope-main-content flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-white'
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
                            <div className='space-y-3 max-w-5xl mx-auto'>
                                {categories.map((category, index) => (
                                    <div
                                        key={category.id}
                                        id={`category-${category.id}`}
                                        className='animate-slideInUp transform hover:scale-[1.01] transition-all duration-300'
                                        style={{
                                            animationDelay: `${index * 100}ms`,
                                        }}
                                    >
                                        <div
                                            className={`bg-white rounded-lg shadow-sm border overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-blue-200 ${
                                                selectedCategory === category.id
                                                    ? 'border-blue-300 shadow-md ring-1 ring-blue-100'
                                                    : 'border-gray-200'
                                            }`}
                                        >
                                            {/* Category Header */}
                                            <div
                                                className={`px-4 py-2.5 border-b transition-all duration-300 ${
                                                    selectedCategory ===
                                                    category.id
                                                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
                                                        : 'bg-gray-50 border-gray-200 hover:bg-blue-25'
                                                }`}
                                            >
                                                <div className='flex items-center gap-2.5'>
                                                    <div
                                                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 hover:rotate-3 ${
                                                            selectedCategory ===
                                                            category.id
                                                                ? 'bg-blue-100 shadow-sm scale-105'
                                                                : 'bg-gray-100 hover:bg-blue-50'
                                                        }`}
                                                    >
                                                        <div
                                                            className={`transition-all duration-300 text-sm ${
                                                                selectedCategory ===
                                                                category.id
                                                                    ? 'text-blue-600'
                                                                    : 'text-gray-600 hover:text-blue-500'
                                                            }`}
                                                        >
                                                            {category.icon}
                                                        </div>
                                                    </div>
                                                    <h4
                                                        className={`text-base font-semibold transition-colors duration-300 ${
                                                            selectedCategory ===
                                                            category.id
                                                                ? 'text-blue-800'
                                                                : 'text-gray-800 hover:text-blue-700'
                                                        }`}
                                                    >
                                                        {category.name}
                                                    </h4>
                                                </div>
                                            </div>

                                            {/* Feature Items List */}
                                            <div className='divide-y divide-gray-50'>
                                                {category.items.map(
                                                    (item, itemIndex) => (
                                                        <div
                                                            key={item.id}
                                                            className='px-4 py-3 hover:bg-gradient-to-r hover:from-gray-25 hover:to-blue-25 transition-all duration-200 group transform hover:scale-[1.005] hover:shadow-sm'
                                                            style={{
                                                                animationDelay: `${
                                                                    index *
                                                                        100 +
                                                                    itemIndex *
                                                                        30
                                                                }ms`,
                                                            }}
                                                        >
                                                            <div className='flex items-center justify-between'>
                                                                {/* Feature Name */}
                                                                <div className='flex-1'>
                                                                    <h5 className='text-sm font-medium text-gray-800 group-hover:text-gray-900 transition-all duration-200'>
                                                                        {
                                                                            item.name
                                                                        }
                                                                    </h5>
                                                                </div>

                                                                {/* Permission Checkboxes */}
                                                                <div className='flex items-center gap-6'>
                                                                    {permissionTypes.map(
                                                                        (
                                                                            type,
                                                                            typeIndex,
                                                                        ) => (
                                                                            <div
                                                                                key={
                                                                                    type
                                                                                }
                                                                                className='flex flex-col items-center gap-1.5 animate-fadeIn transform hover:scale-105 transition-all duration-200'
                                                                                style={{
                                                                                    animationDelay: `${
                                                                                        index *
                                                                                            100 +
                                                                                        itemIndex *
                                                                                            30 +
                                                                                        typeIndex *
                                                                                            20
                                                                                    }ms`,
                                                                                }}
                                                                            >
                                                                                <span className='text-xs font-medium text-gray-600 group-hover:text-gray-700 transition-colors duration-200'>
                                                                                    {
                                                                                        type
                                                                                    }
                                                                                </span>
                                                                                <label className='cursor-pointer relative group/checkbox'>
                                                                                    <input
                                                                                        type='checkbox'
                                                                                        className='w-4 h-4 text-blue-600 bg-white border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-1 transition-all duration-200 hover:border-blue-400 hover:scale-110 hover:shadow-sm'
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

export default ScopeConfigSlidingPanel;
