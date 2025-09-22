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
    const [visiblePanels, setVisiblePanels] = useState<Set<PanelType>>(
        new Set(['userGroups'] as PanelType[]),
    );

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

    // State for role selection and assignment
    const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());
    const [roleAssignmentLoading, setRoleAssignmentLoading] =
        useState<boolean>(false);
    const [selectedUserGroup, setSelectedUserGroup] = useState<any>(null);

    // Fetch user groups from API with role counts
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
            console.log(
                '📊 Data type:',
                typeof data,
                'IsArray:',
                Array.isArray(data),
            );

            // Fetch role counts for each user group
            const groupsWithRoleCounts = await Promise.all(
                (Array.isArray(data) ? data : []).map(async (group: any) => {
                    try {
                        const rolesResponse = await fetch(
                            `http://localhost:4000/api/user-groups/${group.id}/roles`,
                        );
                        if (rolesResponse.ok) {
                            const rolesData = await rolesResponse.json();
                            const roleCount =
                                rolesData?.data?.roles?.length || 0;
                            return {...group, rolesCount: roleCount};
                        } else {
                            return {...group, rolesCount: 0};
                        }
                    } catch (error) {
                        console.error(
                            `Error fetching roles for group ${group.id}:`,
                            error,
                        );
                        return {...group, rolesCount: 0};
                    }
                }),
            );

            setUserGroupsData(groupsWithRoleCounts);
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

    // Fetch roles from API with scope configuration status
    const fetchRoles = async () => {
        try {
            console.log('🔄 Fetching roles from API...');
            const response = await fetch('http://localhost:4000/api/roles');

            if (response.ok) {
                const data = await response.json();
                console.log('📊 Roles data received:', data);

                // Check scope configuration for each role
                const rolesWithScopeStatus = await Promise.all(
                    (Array.isArray(data) ? data : []).map(async (role: any) => {
                        try {
                            const scopeResponse = await fetch(
                                `http://localhost:4000/api/roles/${role.id}/scope`,
                            );

                            if (scopeResponse.ok) {
                                const scopeData = await scopeResponse.json();
                                // Check if any category has configured permissions
                                const hasConfiguration = Object.values(
                                    scopeData,
                                ).some(
                                    (category: any) =>
                                        Array.isArray(category) &&
                                        category.length > 0,
                                );

                                return {
                                    ...role,
                                    hasScopeConfig: hasConfiguration,
                                };
                            } else {
                                return {
                                    ...role,
                                    hasScopeConfig: false,
                                };
                            }
                        } catch (error) {
                            console.error(
                                `Error checking scope for role ${role.id}:`,
                                error,
                            );
                            return {
                                ...role,
                                hasScopeConfig: false,
                            };
                        }
                    }),
                );

                setRolesData(rolesWithScopeStatus);
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

    // Reset visible panels and active panel when component opens
    useEffect(() => {
        if (isOpen) {
            setVisiblePanels(new Set(['userGroups'] as PanelType[]));
            setActivePanel('userGroups');
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
            subtitle: selectedUserGroup
                ? `Assign roles to "${selectedUserGroup.name}" user group`
                : 'Configure user roles',
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
        console.log('🔄 handleRoleSelect called with role:', role);
        setSelectedRole(role);
        // Show all panels but make scope the active one
        console.log('🔄 Setting all panels visible with scope as active');
        setVisiblePanels(
            new Set(['userGroups', 'roles', 'scope'] as PanelType[]),
        );
        setActivePanel('scope');
        console.log('✅ Panel switch completed');
    };

    // Handle panel click to collapse current and switch to new panel
    const handlePanelClick = (panelType: PanelType) => {
        setActivePanel(panelType);
        // Only show the selected panel (collapse and switch behavior)
        setVisiblePanels(new Set([panelType]));
    };

    // Show roles panel after successful group assignment
    const showRolesPanel = async (userGroup?: any) => {
        // Store the selected user group for role assignment
        if (userGroup) {
            setSelectedUserGroup(userGroup);

            // Fetch currently assigned roles for this user group
            try {
                console.log(
                    `🔄 Fetching assigned roles for group: ${userGroup.name}`,
                );
                const response = await fetch(
                    `http://localhost:4000/api/user-groups/${userGroup.id}/roles`,
                );

                if (response.ok) {
                    const data = await response.json();
                    const assignedRoleIds =
                        data?.data?.roles?.map((role: any) => role.id) || [];
                    console.log(
                        `✅ Found ${assignedRoleIds.length} assigned roles:`,
                        assignedRoleIds,
                    );

                    // Pre-select the assigned roles
                    setSelectedRoles(new Set(assignedRoleIds));
                } else {
                    console.warn(
                        'Failed to fetch assigned roles:',
                        response.status,
                    );
                    setSelectedRoles(new Set());
                }
            } catch (error) {
                console.error('Error fetching assigned roles:', error);
                setSelectedRoles(new Set());
            }
        }

        // Show all panels but make roles the active one
        setVisiblePanels(new Set(['userGroups', 'roles'] as PanelType[]));
        setActivePanel('roles');

        // Refresh roles data to ensure scope configuration status is up to date
        fetchRoles();
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

    // Handle role selection
    const handleRoleSelection = (roleId: string, isSelected: boolean) => {
        const newSelection = new Set(selectedRoles);
        if (isSelected) {
            newSelection.add(roleId);
        } else {
            newSelection.delete(roleId);
        }
        setSelectedRoles(newSelection);
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

            // Clear selection and show roles panel for next step
            setSelectedGroups(new Set());
            showRolesPanel();
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

    // Handle role assignment
    const handleAssignRoles = async () => {
        if (selectedRoles.size === 0) {
            alert('Please select at least one role to assign.');
            return;
        }

        if (!selectedUserGroup) {
            alert('No user group selected for role assignment.');
            return;
        }

        try {
            setRoleAssignmentLoading(true);

            console.log(
                `🔄 Assigning ${selectedRoles.size} roles to user group: ${selectedUserGroup.name}`,
            );

            // Assign each selected role to the user group
            const assignmentPromises = Array.from(selectedRoles).map(
                async (roleId) => {
                    const roleData = rolesData.find(
                        (role) => role.id === roleId,
                    );
                    const response = await fetch(
                        `http://localhost:4000/api/user-groups/${selectedUserGroup.id}/roles`,
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                roleId: roleId,
                                roleName:
                                    roleData?.name ||
                                    roleData?.roleName ||
                                    'Unknown Role',
                            }),
                        },
                    );

                    if (!response.ok) {
                        throw new Error(
                            `Failed to assign role ${
                                roleData?.name || roleId
                            }: ${response.status}`,
                        );
                    }

                    return response.json();
                },
            );

            await Promise.all(assignmentPromises);

            console.log('✅ All roles assigned successfully');
            alert(
                `Successfully assigned ${selectedRoles.size} role${
                    selectedRoles.size !== 1 ? 's' : ''
                } to "${selectedUserGroup.name}" user group`,
            );

            // Clear selections and refresh data
            setSelectedRoles(new Set());

            // Refresh user groups data to update role counts
            await fetchUserGroups();
        } catch (error) {
            console.error('❌ Error assigning roles:', error);
            alert(
                `Failed to assign roles: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        } finally {
            setRoleAssignmentLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {/* Backdrop */}
            <motion.div
                className='fixed inset-0 z-40 bg-black/50'
                initial={{opacity: 0}}
                animate={{opacity: 1}}
                exit={{opacity: 0}}
                transition={{duration: 0.2}}
                onClick={onClose}
            />

            {/* Sliding Panel Container */}
            <motion.div
                className='fixed right-0 top-0 h-full z-50 bg-white shadow-2xl overflow-hidden'
                style={{width: '60vw', maxWidth: '1600px', minWidth: '800px'}}
                initial={{x: '100%'}}
                animate={{x: 0}}
                exit={{x: '100%'}}
                transition={{duration: 0.4, ease: 'easeInOut'}}
            >
                <div className='flex h-full'>
                    {/* Panel 1 - User Groups */}
                    <motion.div
                        className={`h-full border-r border-gray-200 overflow-hidden ${
                            activePanel === 'userGroups'
                                ? 'bg-white'
                                : 'bg-gray-50'
                        }`}
                        animate={{
                            width: activePanel === 'userGroups' ? '100%' : '5%',
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
                            onClick={() => handlePanelClick('userGroups')}
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
                                <div
                                    className='transform -rotate-90 whitespace-nowrap cursor-pointer h-full flex items-center justify-center'
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handlePanelClick('userGroups');
                                    }}
                                    style={{pointerEvents: 'auto'}}
                                >
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
                                                    {userGroupsData.length ===
                                                        0 && (
                                                        <tr>
                                                            <td
                                                                colSpan={6}
                                                                className='p-4 text-center text-gray-500'
                                                            >
                                                                {loading
                                                                    ? 'Loading groups...'
                                                                    : 'No user groups found'}
                                                            </td>
                                                        </tr>
                                                    )}
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
                                                                            className='inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-all duration-300 hover:shadow-md hover:scale-105 group'
                                                                            onClick={async (
                                                                                e,
                                                                            ) => {
                                                                                e.stopPropagation();
                                                                                console.log(
                                                                                    '🎯 Role button clicked for group:',
                                                                                    group.name,
                                                                                );
                                                                                await showRolesPanel(
                                                                                    group,
                                                                                );
                                                                            }}
                                                                        >
                                                                            <svg
                                                                                className='w-4 h-4 mr-1 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:drop-shadow-md'
                                                                                viewBox='0 0 24 24'
                                                                                fill='none'
                                                                                stroke='currentColor'
                                                                                strokeWidth='2'
                                                                            >
                                                                                <path
                                                                                    d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'
                                                                                    className='transition-all duration-300 group-hover:fill-blue-200 group-hover:stroke-blue-600'
                                                                                />
                                                                                <circle
                                                                                    cx='12'
                                                                                    cy='11'
                                                                                    r='3'
                                                                                    className='transition-all duration-300 group-hover:fill-blue-500 group-hover:animate-pulse'
                                                                                />
                                                                            </svg>
                                                                            <span className='transition-all duration-300 group-hover:font-bold'>
                                                                                {group.rolesCount ||
                                                                                    0}
                                                                            </span>
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
                    {visiblePanels.has('roles') && (
                        <motion.div
                            className={`h-full border-r border-gray-200 overflow-hidden ${
                                activePanel === 'roles'
                                    ? 'bg-white'
                                    : 'bg-gray-50'
                            }`}
                            animate={{
                                width: activePanel === 'roles' ? '100%' : '5%',
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
                                onClick={() => handlePanelClick('roles')}
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
                                    <div
                                        className='transform -rotate-90 whitespace-nowrap cursor-pointer h-full flex items-center justify-center'
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handlePanelClick('roles');
                                        }}
                                        style={{pointerEvents: 'auto'}}
                                    >
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
                                        <div className='h-full flex flex-col'>
                                            <div className='flex-1 overflow-auto'>
                                                <ReusableTableComponent
                                                    config={
                                                        {
                                                            ...Roles_tableConfig,
                                                            initialData:
                                                                rolesData,
                                                            currentUser:
                                                                currentUser, // Pass current user context for API calls
                                                            externalSelectedItems:
                                                                selectedRoles,
                                                            onSelectionChange:
                                                                setSelectedRoles,
                                                            onAction: (
                                                                action: string,
                                                                item: any,
                                                            ) => {
                                                                console.log(
                                                                    '🔧 onAction called with:',
                                                                    action,
                                                                    item,
                                                                );
                                                                if (
                                                                    action ===
                                                                    'configureScope'
                                                                ) {
                                                                    console.log(
                                                                        '🎯 Scope configuration triggered for role:',
                                                                        item,
                                                                    );
                                                                    handleRoleSelect(
                                                                        item,
                                                                    );
                                                                }
                                                            },
                                                            customRenderers: {},
                                                        } as any
                                                    }
                                                />
                                            </div>

                                            {/* Role Assignment Actions - Fixed at bottom */}
                                            {selectedRoles.size > 0 && (
                                                <div
                                                    className='border-t border-gray-200 p-4 bg-green-50 flex-shrink-0'
                                                    style={{zIndex: 100}}
                                                >
                                                    <div className='flex items-center justify-between'>
                                                        <div className='text-sm text-gray-600'>
                                                            {selectedRoles.size}{' '}
                                                            role
                                                            {selectedRoles.size !==
                                                            1
                                                                ? 's'
                                                                : ''}{' '}
                                                            selected
                                                        </div>
                                                        <div className='flex items-center gap-3'>
                                                            <button
                                                                onClick={() =>
                                                                    setSelectedRoles(
                                                                        new Set(),
                                                                    )
                                                                }
                                                                disabled={
                                                                    selectedRoles.size ===
                                                                    0
                                                                }
                                                                className='px-3 py-2 text-sm text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed'
                                                            >
                                                                Clear
                                                            </button>
                                                            <button
                                                                onClick={async () => {
                                                                    if (
                                                                        selectedRoles.size ===
                                                                        0
                                                                    ) {
                                                                        alert(
                                                                            'Please select at least one role to assign.',
                                                                        );
                                                                        return;
                                                                    }

                                                                    try {
                                                                        await handleAssignRoles();
                                                                    } catch (error) {
                                                                        console.error(
                                                                            'Role assignment failed:',
                                                                            error,
                                                                        );
                                                                        alert(
                                                                            'Failed to assign roles. Please try again.',
                                                                        );
                                                                    }
                                                                }}
                                                                disabled={
                                                                    selectedRoles.size ===
                                                                        0 ||
                                                                    roleAssignmentLoading
                                                                }
                                                                className='px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors border-2 border-green-800'
                                                            >
                                                                {roleAssignmentLoading ? (
                                                                    <span className='flex items-center gap-2'>
                                                                        <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                                                                        Assigning...
                                                                    </span>
                                                                ) : (
                                                                    `Assign ${
                                                                        selectedRoles.size
                                                                    } Role${
                                                                        selectedRoles.size !==
                                                                        1
                                                                            ? 's'
                                                                            : ''
                                                                    }`
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Role Assignment Actions */}
                                            {selectedRoles.size > 0 && (
                                                <div
                                                    className='border-t border-gray-200 p-4 bg-green-50'
                                                    style={{
                                                        zIndex: 100,
                                                        position: 'relative',
                                                    }}
                                                >
                                                    <div className='flex items-center justify-between'>
                                                        <div className='text-sm text-gray-600'>
                                                            {selectedRoles.size}{' '}
                                                            role
                                                            {selectedRoles.size !==
                                                            1
                                                                ? 's'
                                                                : ''}{' '}
                                                            selected
                                                        </div>
                                                        <div className='flex items-center gap-3'>
                                                            <button
                                                                onClick={() =>
                                                                    setSelectedRoles(
                                                                        new Set(),
                                                                    )
                                                                }
                                                                disabled={
                                                                    selectedRoles.size ===
                                                                    0
                                                                }
                                                                className='px-3 py-2 text-sm text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed'
                                                            >
                                                                Clear
                                                            </button>
                                                            <button
                                                                onClick={async () => {
                                                                    if (
                                                                        selectedRoles.size ===
                                                                        0
                                                                    ) {
                                                                        alert(
                                                                            'Please select at least one role to assign.',
                                                                        );
                                                                        return;
                                                                    }

                                                                    try {
                                                                        await handleAssignRoles();
                                                                    } catch (error) {
                                                                        console.error(
                                                                            'Role assignment failed:',
                                                                            error,
                                                                        );
                                                                        alert(
                                                                            'Failed to assign roles. Please try again.',
                                                                        );
                                                                    }
                                                                }}
                                                                disabled={
                                                                    selectedRoles.size ===
                                                                        0 ||
                                                                    roleAssignmentLoading
                                                                }
                                                                className='px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors border-2 border-green-800'
                                                            >
                                                                {roleAssignmentLoading ? (
                                                                    <span className='flex items-center gap-2'>
                                                                        <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                                                                        Assigning...
                                                                    </span>
                                                                ) : (
                                                                    `Assign ${
                                                                        selectedRoles.size
                                                                    } Role${
                                                                        selectedRoles.size !==
                                                                        1
                                                                            ? 's'
                                                                            : ''
                                                                    }`
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Panel 3 - Scope */}
                    {visiblePanels.has('scope') && (
                        <motion.div
                            className={`h-full overflow-hidden ${
                                activePanel === 'scope'
                                    ? 'bg-white'
                                    : 'bg-gray-50'
                            }`}
                            animate={{
                                width: activePanel === 'scope' ? '100%' : '5%',
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
                                onClick={() => handlePanelClick('scope')}
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
                                    <div
                                        className='transform -rotate-90 whitespace-nowrap cursor-pointer h-full flex items-center justify-center'
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handlePanelClick('scope');
                                        }}
                                        style={{pointerEvents: 'auto'}}
                                    >
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
                                            onClose={() =>
                                                setActivePanel('roles')
                                            }
                                            roleId={
                                                selectedRole?.id ||
                                                selectedRole?.roleId ||
                                                ''
                                            }
                                            roleName={
                                                selectedRole?.roleName ||
                                                selectedRole?.name ||
                                                'Selected Role'
                                            }
                                            roleDescription={
                                                selectedRole?.description ||
                                                'Configure permissions for this role'
                                            }
                                            currentScope={selectedRole?.scope}
                                            onSave={async (scopeConfig) => {
                                                console.log(
                                                    'Scope configuration saved:',
                                                    scopeConfig,
                                                );
                                                // Refresh roles data to update scope configuration status
                                                await fetchRoles();
                                                setActivePanel('roles');
                                            }}
                                        />
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default SimpleSlidingPanels;
