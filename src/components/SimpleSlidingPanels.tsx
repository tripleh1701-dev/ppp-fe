'use client';

import React, {useState, useEffect} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {
    UserGroupIcon,
    ShieldCheckIcon,
    CogIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import AssignUserGroupsTable from './AssignUserGroups/AssignUserGroupsTable';
import ScopeConfigSlidingPanel from './ScopeConfigSlidingPanel';
import ReusableTableComponent from './reusable/ReusableTableComponent';
import UserGroups_tableConfig from '../config/UserGroups_tableConfig';
import Roles_tableConfig from '../config/Roles_tableConfig';
import ScopeConfig_tableConfig from '../config/ScopeConfig_tableConfig';

interface SimpleSlidingPanelsProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser?: any;
    onAssignGroups?: (groups: any[]) => void;
    initialPanel?: 'userGroups' | 'roles' | 'scope';
}

type PanelType = 'userGroups' | 'roles' | 'scope';

const SimpleSlidingPanels: React.FC<SimpleSlidingPanelsProps> = ({
    isOpen,
    onClose,
    currentUser,
    onAssignGroups,
    initialPanel = 'userGroups',
}) => {
    const [activePanel, setActivePanel] = useState<PanelType>(initialPanel);
    const [selectedRole, setSelectedRole] = useState<any>(null);

    // State for API data
    const [userGroupsData, setUserGroupsData] = useState<any[]>([]);
    const [rolesData, setRolesData] = useState<any[]>([]);
    const [scopeConfigData, setScopeConfigData] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch user groups from API
    const fetchUserGroups = async () => {
        try {
            setLoading(true);
            setError(null);

            // Get enterpriseId from currentUser or use default
            const enterpriseId = currentUser?.enterpriseId || 1;
            const userId = currentUser?.id || '';

            const response = await fetch(
                `http://localhost:4000/api/user-groups?id=${userId}&enterpriseId=${enterpriseId}`,
            );

            if (!response.ok) {
                throw new Error(
                    `Failed to fetch user groups: ${response.status}`,
                );
            }

            const data = await response.json();
            setUserGroupsData(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching user groups:', err);
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to fetch user groups',
            );
            // Fallback to empty array
            setUserGroupsData([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch roles from API
    const fetchRoles = async () => {
        try {
            const enterpriseId = currentUser?.enterpriseId || 1;
            const response = await fetch(
                `http://localhost:4000/api/roles?enterpriseId=${enterpriseId}`,
            );

            if (response.ok) {
                const data = await response.json();
                setRolesData(Array.isArray(data) ? data : []);
            } else {
                console.warn('Failed to fetch roles, using empty array');
                setRolesData([]);
            }
        } catch (err) {
            console.error('Error fetching roles:', err);
            setRolesData([]);
        }
    };

    // Fetch scope configuration from API
    const fetchScopeConfig = async () => {
        try {
            const enterpriseId = currentUser?.enterpriseId || 1;
            const response = await fetch(
                `http://localhost:4000/api/scope-config?enterpriseId=${enterpriseId}`,
            );

            if (response.ok) {
                const data = await response.json();
                setScopeConfigData(Array.isArray(data) ? data : []);
            } else {
                console.warn('Failed to fetch scope config, using empty array');
                setScopeConfigData([]);
            }
        } catch (err) {
            console.error('Error fetching scope config:', err);
            setScopeConfigData([]);
        }
    };

    // Fetch data when component mounts or currentUser changes
    useEffect(() => {
        if (isOpen) {
            fetchUserGroups();
            fetchRoles();
            fetchScopeConfig();
        }
    }, [isOpen, currentUser]);

    // Roles data is now fetched from API in state

    // Scope configuration data is now fetched from API in state

    const panels = [
        {
            id: 'userGroups' as const,
            title: 'Assign User Groups',
            subtitle: 'Manage user group assignments',
            icon: <UserGroupIcon className='w-6 h-6' />,
            color: 'bg-blue-500',
            headerGradient: 'from-blue-500 to-blue-600',
        },
        {
            id: 'roles' as const,
            title: 'Assign Roles',
            subtitle: 'Configure user roles',
            icon: <ShieldCheckIcon className='w-6 h-6' />,
            color: 'bg-green-500',
            headerGradient: 'from-green-500 to-green-600',
        },
        {
            id: 'scope' as const,
            title: 'Configure Scope',
            subtitle: 'Define scope and permissions for selected roles',
            icon: <CogIcon className='w-6 h-6' />,
            color: 'bg-purple-500',
            headerGradient: 'from-purple-500 to-purple-600',
        },
    ];

    const handleRoleSelect = (role: any) => {
        setSelectedRole(role);
        setActivePanel('scope');
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'
                initial={{opacity: 0}}
                animate={{opacity: 1}}
                exit={{opacity: 0}}
                transition={{duration: 0.2}}
            >
                {/* Main Container */}
                <motion.div
                    className='flex h-[90vh] w-[95vw] max-w-7xl bg-white shadow-2xl overflow-hidden rounded-lg'
                    initial={{x: '100%', scale: 0.9}}
                    animate={{x: 0, scale: 1}}
                    exit={{x: '100%', scale: 0.9}}
                    transition={{duration: 0.4, ease: 'easeInOut'}}
                >
                    {/* Panel 1 - User Groups */}
                    <motion.div
                        className={`h-full border-r border-gray-200 overflow-hidden ${
                            activePanel === 'userGroups'
                                ? 'bg-white'
                                : 'bg-gray-50'
                        }`}
                        animate={{
                            width: activePanel === 'userGroups' ? '90%' : '5%',
                        }}
                        transition={{duration: 0.3, ease: 'easeInOut'}}
                    >
                        {/* Header */}
                        <div
                            className={`bg-gradient-to-r ${
                                panels[0].headerGradient
                            } text-white p-4 cursor-pointer ${
                                activePanel !== 'userGroups'
                                    ? 'h-full flex items-center justify-center'
                                    : ''
                            }`}
                            onClick={() => setActivePanel('userGroups')}
                        >
                            {activePanel === 'userGroups' ? (
                                <div className='flex items-center justify-between'>
                                    <div className='flex items-center space-x-3'>
                                        {panels[0].icon}
                                        <div>
                                            <h3 className='text-lg font-semibold'>
                                                {panels[0].title}
                                            </h3>
                                            <p className='text-sm opacity-90'>
                                                {panels[0].subtitle}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onClose();
                                        }}
                                        className='p-2 hover:bg-white/20 rounded-lg transition-colors'
                                    >
                                        <XMarkIcon className='w-5 h-5' />
                                    </button>
                                </div>
                            ) : (
                                <div className='transform -rotate-90 whitespace-nowrap'>
                                    <div className='flex items-center space-x-2'>
                                        {panels[0].icon}
                                        <span className='font-semibold'>
                                            User Groups
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        {activePanel === 'userGroups' && (
                            <div className='h-full overflow-hidden'>
                                {loading ? (
                                    <div className='flex items-center justify-center h-full'>
                                        <div className='text-gray-500'>
                                            Loading user groups...
                                        </div>
                                    </div>
                                ) : error ? (
                                    <div className='flex items-center justify-center h-full'>
                                        <div className='text-red-500'>
                                            Error: {error}
                                            <button
                                                onClick={fetchUserGroups}
                                                className='ml-2 px-3 py-1 bg-blue-500 text-white rounded text-sm'
                                            >
                                                Retry
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <ReusableTableComponent
                                        config={
                                            {
                                                ...UserGroups_tableConfig,
                                                initialData: userGroupsData,
                                                currentUser: currentUser, // Pass current user context for API calls
                                                onAction: (
                                                    action: string,
                                                    item: any,
                                                ) => {
                                                    if (
                                                        action === 'rolesCount'
                                                    ) {
                                                        setActivePanel('roles');
                                                    }
                                                },
                                                customRenderers: {},
                                            } as any
                                        }
                                    />
                                )}
                            </div>
                        )}
                    </motion.div>

                    {/* Panel 2 - Roles */}
                    <motion.div
                        className={`h-full border-r border-gray-200 overflow-hidden ${
                            activePanel === 'roles' ? 'bg-white' : 'bg-gray-50'
                        }`}
                        animate={{
                            width: activePanel === 'roles' ? '90%' : '5%',
                        }}
                        transition={{duration: 0.3, ease: 'easeInOut'}}
                    >
                        {/* Header */}
                        <div
                            className={`bg-gradient-to-r ${
                                panels[1].headerGradient
                            } text-white p-4 cursor-pointer ${
                                activePanel !== 'roles'
                                    ? 'h-full flex items-center justify-center'
                                    : ''
                            }`}
                            onClick={() => setActivePanel('roles')}
                        >
                            {activePanel === 'roles' ? (
                                <div className='flex items-center justify-between'>
                                    <div className='flex items-center space-x-3'>
                                        {panels[1].icon}
                                        <div>
                                            <h3 className='text-lg font-semibold'>
                                                {panels[1].title}
                                            </h3>
                                            <p className='text-sm opacity-90'>
                                                {panels[1].subtitle}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onClose();
                                        }}
                                        className='p-2 hover:bg-white/20 rounded-lg transition-colors'
                                    >
                                        <XMarkIcon className='w-5 h-5' />
                                    </button>
                                </div>
                            ) : (
                                <div className='transform -rotate-90 whitespace-nowrap'>
                                    <div className='flex items-center space-x-2'>
                                        {panels[1].icon}
                                        <span className='font-semibold'>
                                            Assign Roles
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        {activePanel === 'roles' && (
                            <div className='h-full overflow-hidden'>
                                {loading ? (
                                    <div className='flex items-center justify-center h-full'>
                                        <div className='text-gray-500'>
                                            Loading roles...
                                        </div>
                                    </div>
                                ) : error ? (
                                    <div className='flex items-center justify-center h-full'>
                                        <div className='text-red-500'>
                                            Error: {error}
                                            <button
                                                onClick={fetchRoles}
                                                className='ml-2 px-3 py-1 bg-blue-500 text-white rounded text-sm'
                                            >
                                                Retry
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <ReusableTableComponent
                                        config={
                                            {
                                                ...Roles_tableConfig,
                                                initialData: rolesData,
                                                currentUser: currentUser, // Pass current user context for API calls
                                                onAction: (
                                                    action: string,
                                                    item: any,
                                                ) => {
                                                    if (
                                                        action ===
                                                        'configureScope'
                                                    ) {
                                                        setSelectedRole(item);
                                                        setActivePanel('scope');
                                                    }
                                                },
                                                customRenderers: {},
                                            } as any
                                        }
                                    />
                                )}
                            </div>
                        )}
                    </motion.div>

                    {/* Panel 3 - Scope */}
                    <motion.div
                        className={`h-full overflow-hidden ${
                            activePanel === 'scope' ? 'bg-white' : 'bg-gray-50'
                        }`}
                        animate={{
                            width: activePanel === 'scope' ? '90%' : '5%',
                        }}
                        transition={{duration: 0.3, ease: 'easeInOut'}}
                    >
                        {/* Header */}
                        <div
                            className={`bg-gradient-to-r ${
                                panels[2].headerGradient
                            } text-white p-4 cursor-pointer ${
                                activePanel !== 'scope'
                                    ? 'h-full flex items-center justify-center'
                                    : ''
                            }`}
                            onClick={() => setActivePanel('scope')}
                        >
                            {activePanel === 'scope' ? (
                                <div className='flex items-center justify-between'>
                                    <div className='flex items-center space-x-3'>
                                        {panels[2].icon}
                                        <div>
                                            <h3 className='text-lg font-semibold'>
                                                {panels[2].title}
                                            </h3>
                                            <p className='text-sm opacity-90'>
                                                {panels[2].subtitle}
                                            </p>
                                        </div>
                                    </div>
                                    {selectedRole && (
                                        <span className='px-3 py-1 bg-white/20 rounded-full text-sm font-medium'>
                                            Role: {selectedRole.name}
                                        </span>
                                    )}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onClose();
                                        }}
                                        className='p-2 hover:bg-white/20 rounded-lg transition-colors'
                                    >
                                        <XMarkIcon className='w-5 h-5' />
                                    </button>
                                </div>
                            ) : (
                                <div className='transform -rotate-90 whitespace-nowrap'>
                                    <div className='flex items-center space-x-2'>
                                        {panels[2].icon}
                                        <span className='font-semibold'>
                                            Configure Scope
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        {activePanel === 'scope' && (
                            <div className='h-full overflow-hidden'>
                                {loading ? (
                                    <div className='flex items-center justify-center h-full'>
                                        <div className='text-gray-500'>
                                            Loading scope configuration...
                                        </div>
                                    </div>
                                ) : error ? (
                                    <div className='flex items-center justify-center h-full'>
                                        <div className='text-red-500'>
                                            Error: {error}
                                            <button
                                                onClick={fetchScopeConfig}
                                                className='ml-2 px-3 py-1 bg-blue-500 text-white rounded text-sm'
                                            >
                                                Retry
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <ScopeConfigSlidingPanel
                                        isOpen={true}
                                        onClose={() => setActivePanel('roles')}
                                        roleName={
                                            selectedRole?.roleName ||
                                            'Selected Role'
                                        }
                                        roleDescription={
                                            selectedRole?.description ||
                                            'Configure permissions for this role'
                                        }
                                        currentScope={selectedRole?.scope}
                                        onSave={(scopeConfig) => {
                                            console.log(
                                                'Scope configuration saved:',
                                                scopeConfig,
                                            );
                                            // Handle scope save logic here
                                            setActivePanel('roles');
                                        }}
                                    />
                                )}
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default SimpleSlidingPanels;
