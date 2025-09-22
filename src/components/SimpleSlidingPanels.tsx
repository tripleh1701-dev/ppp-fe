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

    // State for group selection and assignment
    const [selectedGroups, setSelectedGroups] = useState<Set<string>>(
        new Set(),
    );
    const [assignmentLoading, setAssignmentLoading] = useState<boolean>(false);

    // Fetch user groups from API
    const fetchUserGroups = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('🔄 Fetching groups from API...');
            const response = await fetch('http://localhost:4000/api/groups');

            if (!response.ok) {
                throw new Error(`Failed to fetch groups: ${response.status}`);
            }

            const data = await response.json();
            console.log('📊 Groups data received:', data);
            setUserGroupsData(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching groups:', err);
            setError(
                err instanceof Error ? err.message : 'Failed to fetch groups',
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
            console.log('🔄 Fetching roles from API...');
            const response = await fetch('http://localhost:4000/api/roles');

            if (response.ok) {
                const data = await response.json();
                console.log('📊 Roles data received:', data);
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
            console.log('🔄 Generating scope configuration data...');
            // For now, create mock scope configuration data
            // This would typically come from a backend API
            const mockScopeData = [
                {
                    id: 1,
                    module: 'Account Settings',
                    view: false,
                    create: false,
                    edit: false,
                    delete: false,
                },
                {
                    id: 2,
                    module: 'Access Control',
                    view: false,
                    create: false,
                    edit: false,
                    delete: false,
                },
                {
                    id: 3,
                    module: 'Security & Governance',
                    view: false,
                    create: false,
                    edit: false,
                    delete: false,
                },
                {
                    id: 4,
                    module: 'Pipelines',
                    view: false,
                    create: false,
                    edit: false,
                    delete: false,
                },
                {
                    id: 5,
                    module: 'Builds',
                    view: false,
                    create: false,
                    edit: false,
                    delete: false,
                },
            ];

            console.log('📊 Scope config data generated:', mockScopeData);
            setScopeConfigData(mockScopeData);
        } catch (err) {
            console.error('Error generating scope config:', err);
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

    // Pre-select assigned groups when currentUser changes
    useEffect(() => {
        if (currentUser?.assignedUserGroups) {
            console.log(
                '🔄 Pre-selecting assigned groups for user:',
                currentUser,
            );
            const assignedGroupIds = new Set<string>(
                currentUser.assignedUserGroups.map(
                    (group: any) => group.id as string,
                ),
            );
            console.log('📋 Assigned group IDs:', Array.from(assignedGroupIds));
            setSelectedGroups(assignedGroupIds);
        } else {
            // Clear selection if no user or no assigned groups
            setSelectedGroups(new Set());
        }
    }, [currentUser]);

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

    // Handle group selection
    const handleGroupSelection = (groupId: string, isSelected: boolean) => {
        const newSelection = new Set(selectedGroups);
        if (isSelected) {
            newSelection.add(groupId);
        } else {
            newSelection.delete(groupId);
        }
        setSelectedGroups(newSelection);
    };

    // Handle group assignment
    const handleAssignGroups = async () => {
        console.log('🚀 handleAssignGroups called', {
            currentUser,
            selectedGroupsSize: selectedGroups.size,
            selectedGroupsArray: Array.from(selectedGroups),
        });

        if (!currentUser) {
            console.error('❌ No current user provided');
            alert('Error: No user selected for group assignment');
            return;
        }

        if (selectedGroups.size === 0) {
            console.error('❌ No groups selected');
            alert('Please select at least one group to assign');
            return;
        }

        setAssignmentLoading(true);
        try {
            console.log(
                `🔄 Assigning ${selectedGroups.size} groups to user:`,
                currentUser,
            );

            // Convert selected groups to array
            const groupsToAssign = Array.from(selectedGroups).map((groupId) => {
                const group = userGroupsData.find((g) => g.id === groupId);
                console.log(`🔍 Found group for ID ${groupId}:`, group);
                return {id: groupId, name: group?.name || 'Unknown'};
            });

            console.log('📤 Groups to assign:', groupsToAssign);

            // Save to backend API using individual group assignments
            console.log('🌐 Assigning groups individually...');

            for (const group of groupsToAssign) {
                const apiUrl = `http://localhost:4000/api/users/${currentUser.id}/groups`;
                const payload = {groupId: group.id};

                console.log('🌐 Making API call:', {
                    url: apiUrl,
                    method: 'POST',
                    payload: payload,
                });

                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });

                console.log('📥 API Response:', {
                    status: response.status,
                    statusText: response.statusText,
                    ok: response.ok,
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('❌ API Error Response:', errorText);
                    throw new Error(
                        `Failed to assign group ${group.name}: ${response.status} ${response.statusText} - ${errorText}`,
                    );
                }
            }

            // Create a dummy response for the rest of the code
            const response = {
                ok: true,
                json: () => Promise.resolve({success: true}),
            };

            console.log('✅ All groups assigned successfully');

            const updatedUser = await response.json();
            console.log('✅ Backend updated successfully:', updatedUser);

            // Call the callback function if provided
            if (onAssignGroups) {
                console.log('📞 Calling onAssignGroups callback');
                onAssignGroups(groupsToAssign);
            } else {
                console.warn('⚠️ No onAssignGroups callback provided');
            }

            console.log('✅ Groups assigned successfully');
            alert(
                `Successfully assigned ${selectedGroups.size} groups to ${currentUser.firstName} ${currentUser.lastName}`,
            );

            // Clear selection and close panel
            setSelectedGroups(new Set());
            onClose();
        } catch (error) {
            console.error('❌ Error assigning groups:', error);
            alert(
                `Failed to assign groups: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        } finally {
            setAssignmentLoading(false);
        }
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
                            <div className='h-full flex flex-col'>
                                {/* User Info Section */}
                                {currentUser && (
                                    <div className='bg-blue-50 border-b border-blue-100 p-4'>
                                        <div className='flex items-center gap-3'>
                                            <div className='w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold'>
                                                {(currentUser.firstName?.[0] ||
                                                    'U') +
                                                    (currentUser
                                                        .lastName?.[0] || '')}
                                            </div>
                                            <div>
                                                <h4 className='font-semibold text-gray-900'>
                                                    {currentUser.firstName}{' '}
                                                    {currentUser.lastName}
                                                </h4>
                                                <p className='text-sm text-gray-600'>
                                                    {currentUser.emailAddress ||
                                                        'No email provided'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className='mt-3 text-sm text-blue-700 bg-blue-100 rounded-lg p-2'>
                                            💡 Select groups below to assign to
                                            this user
                                        </div>
                                    </div>
                                )}

                                {/* Groups Table */}
                                <div className='flex-1 overflow-auto'>
                                    {loading ? (
                                        <div className='flex items-center justify-center h-32'>
                                            <div className='text-gray-500'>
                                                Loading available groups...
                                            </div>
                                        </div>
                                    ) : error ? (
                                        <div className='flex items-center justify-center h-32'>
                                            <div className='text-red-500 text-center'>
                                                <div>Error: {error}</div>
                                                <button
                                                    onClick={fetchUserGroups}
                                                    className='mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600'
                                                >
                                                    Retry
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className='h-full'>
                                            <table className='w-full border-collapse'>
                                                <thead className='bg-gray-50 sticky top-0'>
                                                    <tr>
                                                        <th className='w-12 p-3 text-left border-b border-gray-200'>
                                                            <input
                                                                type='checkbox'
                                                                checked={
                                                                    selectedGroups.size ===
                                                                        userGroupsData.length &&
                                                                    userGroupsData.length >
                                                                        0
                                                                }
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    if (
                                                                        e.target
                                                                            .checked
                                                                    ) {
                                                                        setSelectedGroups(
                                                                            new Set(
                                                                                userGroupsData.map(
                                                                                    (
                                                                                        g,
                                                                                    ) =>
                                                                                        g.id,
                                                                                ),
                                                                            ),
                                                                        );
                                                                    } else {
                                                                        setSelectedGroups(
                                                                            new Set(),
                                                                        );
                                                                    }
                                                                }}
                                                                className='h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500'
                                                            />
                                                        </th>
                                                        <th className='p-3 text-left border-b border-gray-200 font-medium text-gray-900'>
                                                            Group Name
                                                        </th>
                                                        <th className='p-3 text-left border-b border-gray-200 font-medium text-gray-900'>
                                                            Description
                                                        </th>
                                                        <th className='p-3 text-left border-b border-gray-200 font-medium text-gray-900'>
                                                            Entity
                                                        </th>
                                                        <th className='p-3 text-left border-b border-gray-200 font-medium text-gray-900'>
                                                            Service
                                                        </th>
                                                        <th className='p-3 text-left border-b border-gray-200 font-medium text-gray-900'>
                                                            Roles
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {userGroupsData.map(
                                                        (group, index) => (
                                                            <tr
                                                                key={group.id}
                                                                className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                                                                    selectedGroups.has(
                                                                        group.id,
                                                                    )
                                                                        ? 'bg-blue-50'
                                                                        : ''
                                                                }`}
                                                                onClick={() =>
                                                                    handleGroupSelection(
                                                                        group.id,
                                                                        !selectedGroups.has(
                                                                            group.id,
                                                                        ),
                                                                    )
                                                                }
                                                            >
                                                                <td className='p-3 border-b border-gray-100'>
                                                                    <input
                                                                        type='checkbox'
                                                                        checked={selectedGroups.has(
                                                                            group.id,
                                                                        )}
                                                                        onChange={(
                                                                            e,
                                                                        ) => {
                                                                            e.stopPropagation();
                                                                            handleGroupSelection(
                                                                                group.id,
                                                                                e
                                                                                    .target
                                                                                    .checked,
                                                                            );
                                                                        }}
                                                                        className='h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500'
                                                                    />
                                                                </td>
                                                                <td className='p-3 border-b border-gray-100'>
                                                                    <div className='font-medium text-gray-900'>
                                                                        {
                                                                            group.name
                                                                        }
                                                                    </div>
                                                                </td>
                                                                <td className='p-3 border-b border-gray-100'>
                                                                    <div className='text-sm text-gray-600 max-w-xs truncate'>
                                                                        {group.description ||
                                                                            '-'}
                                                                    </div>
                                                                </td>
                                                                <td className='p-3 border-b border-gray-100'>
                                                                    <div className='text-sm'>
                                                                        <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                                                                            {group.entity ||
                                                                                'General'}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className='p-3 border-b border-gray-100'>
                                                                    <div className='text-sm'>
                                                                        <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                                                                            {group.service ||
                                                                                'General'}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className='p-3 border-b border-gray-100'>
                                                                    <div className='text-sm'>
                                                                        <button
                                                                            className='inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors'
                                                                            onClick={(
                                                                                e,
                                                                            ) => {
                                                                                e.stopPropagation();
                                                                                // This could open roles dialog for this group
                                                                                console.log(
                                                                                    'View roles for group:',
                                                                                    group.name,
                                                                                );
                                                                            }}
                                                                        >
                                                                            <span className='w-4 h-4 mr-1'>
                                                                                🛡️
                                                                            </span>
                                                                            {group.rolesCount ||
                                                                                0}
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ),
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons - Always Show */}
                                <div className='border-t border-gray-200 p-4 bg-gray-50 sticky bottom-0'>
                                    <div className='flex items-center justify-between'>
                                        <div className='text-sm text-gray-600'>
                                            {selectedGroups.size > 0 ? (
                                                <span className='font-medium text-blue-600'>
                                                    {selectedGroups.size} group
                                                    {selectedGroups.size !== 1
                                                        ? 's'
                                                        : ''}{' '}
                                                    selected
                                                </span>
                                            ) : (
                                                'No groups selected'
                                            )}
                                        </div>
                                        <div className='flex gap-2'>
                                            <button
                                                onClick={() =>
                                                    setSelectedGroups(new Set())
                                                }
                                                disabled={
                                                    selectedGroups.size === 0
                                                }
                                                className='px-3 py-2 text-sm text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed'
                                            >
                                                Clear
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    console.log(
                                                        '🎯 Assign Groups button clicked!',
                                                        {
                                                            selectedGroups:
                                                                Array.from(
                                                                    selectedGroups,
                                                                ),
                                                            currentUser,
                                                            selectedGroupsSize:
                                                                selectedGroups.size,
                                                        },
                                                    );

                                                    if (
                                                        selectedGroups.size ===
                                                        0
                                                    ) {
                                                        alert(
                                                            'Please select at least one group to assign.',
                                                        );
                                                        return;
                                                    }

                                                    try {
                                                        await handleAssignGroups();
                                                        console.log(
                                                            '✅ Assignment completed successfully',
                                                        );
                                                    } catch (error) {
                                                        console.error(
                                                            '❌ Assignment failed:',
                                                            error,
                                                        );
                                                        alert(
                                                            'Failed to assign groups. Please try again.',
                                                        );
                                                    }
                                                }}
                                                disabled={
                                                    selectedGroups.size === 0 ||
                                                    assignmentLoading
                                                }
                                                className='px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors border-2 border-green-800'
                                            >
                                                {assignmentLoading ? (
                                                    <span className='flex items-center gap-2'>
                                                        <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                                                        Assigning...
                                                    </span>
                                                ) : (
                                                    `Assign ${
                                                        selectedGroups.size > 0
                                                            ? selectedGroups.size
                                                            : ''
                                                    } Group${
                                                        selectedGroups.size !==
                                                        1
                                                            ? 's'
                                                            : ''
                                                    }`
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
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
