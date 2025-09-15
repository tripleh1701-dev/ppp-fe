'use client';

import React, {useState, useEffect} from 'react';
import './ScopeConfigSlidingPanel.css';

interface ScopeConfigSlidingPanelProps {
    isOpen: boolean;
    onClose: () => void;
    roleName: string;
    roleDescription: string;
    currentScope?: any;
    onSave: (scopeConfig: any) => void;
}

const ScopeConfigSlidingPanel: React.FC<ScopeConfigSlidingPanelProps> = ({
    isOpen,
    onClose,
    roleName,
    roleDescription,
    currentScope,
    onSave,
}) => {
    const [selectedCategory, setSelectedCategory] = useState('');
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

    const handleSave = () => {
        onSave({
            category: selectedCategory,
            permissions,
            configuredAt: new Date().toISOString(),
        });
        onClose();
    };

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

    if (!isOpen) return null;

    const selectedCategoryData = categories.find(
        (cat) => cat.id === selectedCategory,
    );

    return (
        <div className='scope-config-sliding-panel'>
            <div className='scope-panel-content'>
                {/* Header */}
                <div className='scope-panel-header'>
                    <div className='header-content'>
                        <h2 className='text-xl font-bold text-gray-900'>
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
                    <div className='header-actions'>
                        <button onClick={onClose} className='btn-secondary'>
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
                            Back
                        </button>

                        <button onClick={handleSave} className='btn-primary'>
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

                        <button onClick={onClose} className='btn-close'>
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

                <div className='scope-panel-body'>
                    {/* Left Sidebar - Module Tiles */}
                    <div className='scope-sidebar'>
                        <h3 className='sidebar-title'>System Modules</h3>
                        <div className='modules-grid'>
                            {categories.map((category, index) => (
                                <div
                                    key={category.id}
                                    onClick={() =>
                                        setSelectedCategory(category.id)
                                    }
                                    className={`module-tile ${
                                        selectedCategory === category.id
                                            ? 'module-tile-selected'
                                            : ''
                                    }`}
                                >
                                    <div className='module-tile-content'>
                                        <div className='module-icon'>
                                            {category.icon}
                                        </div>
                                        <span className='module-name'>
                                            {category.name}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Panel - Permissions Configuration */}
                    <div className='scope-main-content'>
                        <div className='permissions-header'>
                            <h3 className='text-lg font-semibold text-gray-800 mb-6'>
                                System Permissions Configuration
                            </h3>
                            <p className='text-gray-600 mb-8'>
                                Configure access permissions for all system
                                modules and features
                            </p>
                        </div>

                        <div className='permissions-content'>
                            {categories.map((category) => (
                                <div
                                    key={category.id}
                                    id={`category-${category.id}`}
                                    className={`permission-section ${
                                        selectedCategory === category.id
                                            ? 'permission-section-highlighted'
                                            : ''
                                    }`}
                                >
                                    <div className='permission-section-header'>
                                        <div className='section-icon'>
                                            {category.icon}
                                        </div>
                                        <h4 className='section-title'>
                                            {category.name}
                                        </h4>
                                    </div>

                                    <div className='permissions-grid'>
                                        {category.items.map((item) => (
                                            <div
                                                key={item.id}
                                                className='permission-row'
                                            >
                                                <div className='permission-item-name'>
                                                    {item.name}
                                                </div>
                                                <div className='permission-controls'>
                                                    {permissionTypes.map(
                                                        (permType) => (
                                                            <label
                                                                key={permType}
                                                                className='permission-checkbox'
                                                            >
                                                                <input
                                                                    type='checkbox'
                                                                    checked={
                                                                        permissions[
                                                                            item
                                                                                .id
                                                                        ]?.includes(
                                                                            permType,
                                                                        ) ||
                                                                        false
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        handlePermissionChange(
                                                                            item.id,
                                                                            permType,
                                                                            e
                                                                                .target
                                                                                .checked,
                                                                        )
                                                                    }
                                                                />
                                                                <span className='permission-label'>
                                                                    {permType}
                                                                </span>
                                                            </label>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScopeConfigSlidingPanel;
