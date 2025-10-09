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
import {useSelectedAccount} from '@/hooks/useSelectedAccount';

interface SimpleSlidingPanelsProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser?: any;
    onAssignGroups?: (groups: any[]) => void;
    initialPanel?: 'userGroups' | 'roles' | 'scope';
    visiblePanels?: ('userGroups' | 'roles' | 'scope')[];
}

type PanelType = 'userGroups' | 'roles' | 'scope';

const SimpleSlidingPanels: React.FC<SimpleSlidingPanelsProps> = ({
    isOpen,
    onClose,
    currentUser,
    onAssignGroups,
    initialPanel = 'userGroups',
    visiblePanels: visiblePanelsProp,
}) => {
    // Get selected account from breadcrumb
    const selectedAccount = useSelectedAccount();

    const [activePanel, setActivePanel] = useState<PanelType>(initialPanel);
    const [selectedRole, setSelectedRole] = useState<any>(null);
    const [visiblePanels, setVisiblePanels] = useState<Set<PanelType>>(
        new Set(visiblePanelsProp || (['userGroups'] as PanelType[])),
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

    // State for scope configuration save trigger
    const [triggerScopeSave, setTriggerScopeSave] = useState(0);
    const [selectedUserGroup, setSelectedUserGroup] = useState<any>(null);

    // Sync activePanel with initialPanel prop when it changes
    useEffect(() => {
        if (isOpen && initialPanel) {
            console.log('🔄 Setting active panel to:', initialPanel);
            setActivePanel(initialPanel);
        }
    }, [isOpen, initialPanel]);

    // Sync visiblePanels with visiblePanelsProp when it changes
    useEffect(() => {
        if (visiblePanelsProp) {
            console.log('🔄 Setting visible panels to:', visiblePanelsProp);
            setVisiblePanels(new Set(visiblePanelsProp));
        }
    }, [visiblePanelsProp]);

    // Fetch user groups from API with role counts
    const fetchUserGroups = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('🔄 Fetching groups from API for account:', {
                accountId: selectedAccount.id,
                accountName: selectedAccount.name,
                isSystiva: selectedAccount.isSystiva,
            });

            // Build API URL with account context
            const apiBase =
                process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
            const params = new URLSearchParams();

            // Only add account params if not Systiva account
            if (
                !selectedAccount.isSystiva &&
                selectedAccount.id &&
                selectedAccount.name
            ) {
                params.append('accountId', selectedAccount.id);
                params.append('accountName', selectedAccount.name);
            }

            const url = `${apiBase}/api/user-management/groups${
                params.toString() ? `?${params.toString()}` : ''
            }`;
            console.log('📡 Fetching groups from:', url);

            const response = await fetch(url);

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
                            `${apiBase}/api/user-management/groups/${group.id}/roles`,
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
            console.log('🔄 Fetching roles from API for account:', {
                accountId: selectedAccount.id,
                accountName: selectedAccount.name,
                isSystiva: selectedAccount.isSystiva,
            });

            // Build API URL with account context
            const apiBase =
                process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
            const params = new URLSearchParams();

            // Only add account params if not Systiva account
            if (
                !selectedAccount.isSystiva &&
                selectedAccount.id &&
                selectedAccount.name
            ) {
                params.append('accountId', selectedAccount.id);
                params.append('accountName', selectedAccount.name);
            }

            const url = `${apiBase}/api/user-management/roles${
                params.toString() ? `?${params.toString()}` : ''
            }`;
            console.log('📡 Fetching roles from:', url);

            const response = await fetch(url);

            if (response.ok) {
                const data = await response.json();
                console.log('📊 Roles data received:', data);

                // Check scope configuration for each role
                const rolesWithScopeStatus = await Promise.all(
                    (Array.isArray(data) ? data : []).map(async (role: any) => {
                        try {
                            const scopeResponse = await fetch(
                                `${apiBase}/api/user-management/roles/${role.id}/scope`,
                            );

                            if (scopeResponse.ok) {
                                const scopeData = await scopeResponse.json();
                                // Check if any category has configured permissions OR if configured flag is true
                                const hasPermissions = Object.values(
                                    scopeData,
                                ).some(
                                    (category: any) =>
                                        Array.isArray(category) &&
                                        category.length > 0,
                                );

                                const hasConfiguration =
                                    hasPermissions ||
                                    scopeData.configured === true;

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
            console.log('🔄 Loading scope configuration from API...');
            const response = await fetch(
                'http://localhost:4000/api/scope-config',
            );
            if (response.ok) {
                const scopeData = await response.json();
                console.log('📊 Scope config data loaded from API:', scopeData);
                setScopeConfigData(scopeData);
            } else {
                console.error('Failed to load scope config from API');
                setScopeConfigData([]);
            }
        } catch (err) {
            console.error('Error loading scope config from API:', err);
            setScopeConfigData([]);
        }
    };

    // Fetch data when component opens (but don't override panel settings)
    useEffect(() => {
        if (isOpen) {
            console.log('🔄 Panel opened, fetching data for account:', {
                accountId: selectedAccount.id,
                accountName: selectedAccount.name,
            });
            fetchUserGroups();
            fetchRoles();
            fetchScopeConfig();
        }
    }, [isOpen, currentUser, selectedAccount.id, selectedAccount.name]);

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

    const allPanels = [
        {
            id: 'userGroups' as const,
            title: 'Assign User Groups',
            subtitle: 'Manage user group assignments',
            icon: <UserGroupIcon className='w-6 h-6' />,
            color: 'bg-[#0171EC]',
            headerGradient: 'bg-[#0171EC]',
        },
        {
            id: 'roles' as const,
            title: 'Assign Roles',
            subtitle: selectedUserGroup
                ? `Assign roles to "${selectedUserGroup.name}" user group`
                : 'Configure user roles',
            icon: <ShieldCheckIcon className='w-6 h-6' />,
            color: 'bg-blue-400',
            headerGradient: 'bg-blue-400',
        },
        {
            id: 'scope' as const,
            title: 'Configure Scope',
            subtitle: 'Define scope and permissions for selected roles',
            icon: <CogIcon className='w-6 h-6' />,
            color: 'bg-blue-300',
            headerGradient: 'bg-blue-300',
        },
    ];

    // Filter panels based on visiblePanels prop
    const panels = allPanels.filter((panel) => visiblePanels.has(panel.id));

    const handleRoleSelect = (role: any) => {
        console.log('🔄 handleRoleSelect called with role:', role);
        setSelectedRole(role);
        // Reset trigger to prevent auto-save
        setTriggerScopeSave(0);
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
            return;
        }

        if (selectedGroups.size === 0) {
            console.error('❌ No groups selected');
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

            // Call the callback function if provided (let parent handle the API calls)
            if (onAssignGroups) {
                console.log(
                    '📞 Calling onAssignGroups callback with groups:',
                    groupsToAssign,
                );
                onAssignGroups(groupsToAssign);
                console.log('✅ onAssignGroups callback completed');
            } else {
                console.warn('⚠️ No onAssignGroups callback provided');

                // Fallback: Save to backend API using individual group assignments (for backward compatibility)
                console.log('🌐 Assigning groups individually via API...');

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

                console.log('✅ All groups assigned successfully via API');
            }

            console.log('✅ Groups assigned successfully');

            // Clear selection
            setSelectedGroups(new Set());
        } catch (error) {
            console.error('❌ Error assigning groups:', error);
        } finally {
            setAssignmentLoading(false);
        }
    };

    // Handle role assignment
    const handleAssignRoles = async () => {
        if (selectedRoles.size === 0) {
            console.error('❌ No roles selected');
            return;
        }

        // Check if we're assigning roles to a group (currentUser is actually a group)
        const targetEntity = selectedUserGroup || currentUser;

        if (!targetEntity) {
            console.error(
                '❌ No target entity (user/group) for role assignment',
            );
            return;
        }

        try {
            setRoleAssignmentLoading(true);

            console.log(
                `🔄 Assigning ${selectedRoles.size} roles to: ${targetEntity.name}`,
            );

            // Convert selected roles to array with full role data
            const rolesToAssign = Array.from(selectedRoles).map((roleId) => {
                const roleData = rolesData.find((role) => role.id === roleId);
                return {
                    id: roleId,
                    name:
                        roleData?.name || roleData?.roleName || 'Unknown Role',
                };
            });

            console.log('📤 Roles to assign:', rolesToAssign);

            // Call the callback function if provided (let parent handle the API calls)
            if (onAssignGroups) {
                console.log(
                    '📞 Calling onAssignGroups callback with roles:',
                    rolesToAssign,
                );
                onAssignGroups(rolesToAssign);
                console.log('✅ onAssignGroups callback completed');
            } else {
                console.warn('⚠️ No onAssignGroups callback provided');

                // Fallback: Use old API endpoint (for backward compatibility)
                console.log('🌐 Assigning roles individually via API...');

                const assignmentPromises = Array.from(selectedRoles).map(
                    async (roleId) => {
                        const roleData = rolesData.find(
                            (role) => role.id === roleId,
                        );
                        const response = await fetch(
                            `http://localhost:4000/api/user-groups/${targetEntity.id}/roles`,
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
                console.log('✅ All roles assigned successfully via API');

                // Refresh user groups data to update role counts
                await fetchUserGroups();
            }

            console.log('✅ Roles assigned successfully');

            // Clear selections
            setSelectedRoles(new Set());
        } catch (error) {
            console.error('❌ Error assigning roles:', error);
        } finally {
            setRoleAssignmentLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {/* Backdrop */}
            <motion.div
                key='backdrop'
                className='fixed inset-0 z-40 bg-black/50'
                initial={{opacity: 0}}
                animate={{opacity: 1}}
                exit={{opacity: 0}}
                transition={{duration: 0.2}}
                onClick={onClose}
            />

            {/* Sliding Panel Container */}
            <motion.div
                key='sliding-panel-container'
                className='fixed right-0 top-0 h-full z-50 bg-white shadow-2xl overflow-hidden'
                style={{width: '60vw', maxWidth: '1600px', minWidth: '800px'}}
                initial={{x: '100%'}}
                animate={{x: 0}}
                exit={{x: '100%'}}
                transition={{duration: 0.4, ease: 'easeInOut'}}
            >
                <div className='flex h-full'>
                    {/* Panel 1 - User Groups */}
                    {visiblePanels.has('userGroups') && (
                        <motion.div
                            className={`h-full border-r border-gray-200 overflow-hidden ${
                                activePanel === 'userGroups'
                                    ? 'bg-white'
                                    : 'bg-gray-50'
                            }`}
                            animate={{
                                width:
                                    activePanel === 'userGroups'
                                        ? '100%'
                                        : '5%',
                            }}
                            transition={{duration: 0.3, ease: 'easeInOut'}}
                        >
                            {/* Header */}
                            <div
                                className={`${
                                    activePanel === 'userGroups'
                                        ? 'bg-[#0171EC]' // Dark when expanded
                                        : 'bg-blue-400' // Lighter when collapsed
                                } text-white p-4 cursor-pointer ${
                                    activePanel !== 'userGroups'
                                        ? 'h-full flex items-center justify-center'
                                        : ''
                                }`}
                                onClick={() => handlePanelClick('userGroups')}
                            >
                                {activePanel === 'userGroups' ? (
                                    <div className='flex items-center justify-between'>
                                        <div className='flex items-center space-x-4'>
                                            {
                                                panels.find(
                                                    (p) =>
                                                        p.id === 'userGroups',
                                                )?.icon
                                            }
                                            <div>
                                                <h3 className='text-lg font-semibold'>
                                                    {
                                                        panels.find(
                                                            (p) =>
                                                                p.id ===
                                                                'userGroups',
                                                        )?.title
                                                    }
                                                </h3>
                                                <p className='text-sm opacity-90'>
                                                    {
                                                        panels.find(
                                                            (p) =>
                                                                p.id ===
                                                                'userGroups',
                                                        )?.subtitle
                                                    }
                                                </p>
                                            </div>

                                            {/* User Info with Animation */}
                                            {currentUser && (
                                                <motion.div
                                                    className='flex items-center gap-3 ml-6 pl-6 border-l border-white/30'
                                                    initial={{
                                                        opacity: 0,
                                                        x: -20,
                                                    }}
                                                    animate={{opacity: 1, x: 0}}
                                                    transition={{
                                                        duration: 0.5,
                                                        delay: 0.2,
                                                    }}
                                                >
                                                    <motion.div
                                                        className='w-8 h-8 bg-gradient-to-r from-[#0171EC] to-[#05E9FE] rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-lg'
                                                        whileHover={{
                                                            scale: 1.1,
                                                        }}
                                                        transition={{
                                                            type: 'spring',
                                                            stiffness: 300,
                                                        }}
                                                    >
                                                        {(
                                                            (currentUser
                                                                .firstName?.[0] ||
                                                                '') +
                                                            (currentUser
                                                                .lastName?.[0] ||
                                                                '')
                                                        ).toUpperCase() || 'U'}
                                                    </motion.div>
                                                    <motion.div
                                                        initial={{opacity: 0}}
                                                        animate={{opacity: 1}}
                                                        transition={{
                                                            duration: 0.5,
                                                            delay: 0.4,
                                                        }}
                                                    >
                                                        <div className='text-sm font-medium text-white'>
                                                            {
                                                                currentUser.firstName
                                                            }{' '}
                                                            {
                                                                currentUser.lastName
                                                            }
                                                        </div>
                                                        <div className='text-xs text-white/80'>
                                                            {currentUser.emailAddress ||
                                                                'No email provided'}
                                                        </div>
                                                    </motion.div>
                                                </motion.div>
                                            )}
                                        </div>

                                        <div className='flex items-center gap-2'>
                                            {/* Assign Groups Button */}
                                            {selectedGroups.size > 0 && (
                                                <motion.button
                                                    initial={{
                                                        opacity: 0,
                                                        scale: 0.8,
                                                    }}
                                                    animate={{
                                                        opacity: 1,
                                                        scale: 1,
                                                    }}
                                                    exit={{
                                                        opacity: 0,
                                                        scale: 0.8,
                                                    }}
                                                    onClick={handleAssignGroups}
                                                    disabled={assignmentLoading}
                                                    className='bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 backdrop-blur-sm border border-white/30 disabled:opacity-50'
                                                    whileHover={{scale: 1.05}}
                                                    whileTap={{scale: 0.95}}
                                                >
                                                    {assignmentLoading ? (
                                                        <div className='flex items-center gap-2'>
                                                            <div className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin'></div>
                                                            Assigning...
                                                        </div>
                                                    ) : (
                                                        `Assign ${
                                                            selectedGroups.size
                                                        } Group${
                                                            selectedGroups.size !==
                                                            1
                                                                ? 's'
                                                                : ''
                                                        }`
                                                    )}
                                                </motion.button>
                                            )}

                                            {/* Close Button */}
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
                                            {
                                                panels.find(
                                                    (p) =>
                                                        p.id === 'userGroups',
                                                )?.icon
                                            }
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
                                                        onClick={
                                                            fetchUserGroups
                                                        }
                                                        className='mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700'
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
                                                                            e
                                                                                .target
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
                                                                    key={
                                                                        group.id
                                                                    }
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
                                                                                    className='w-5 h-5 transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-md'
                                                                                    viewBox='0 0 24 24'
                                                                                    fill='none'
                                                                                    stroke='currentColor'
                                                                                    strokeWidth='2'
                                                                                    style={{
                                                                                        color:
                                                                                            group.rolesCount &&
                                                                                            group.rolesCount >
                                                                                                0
                                                                                                ? '#10b981'
                                                                                                : '#9ca3af',
                                                                                    }}
                                                                                >
                                                                                    <path
                                                                                        d='M12 2L3 7L12 22L21 7L12 2Z'
                                                                                        stroke='currentColor'
                                                                                        strokeWidth='2'
                                                                                        strokeLinecap='round'
                                                                                        strokeLinejoin='round'
                                                                                        fill='none'
                                                                                    />
                                                                                    <path
                                                                                        d='M12 7V17'
                                                                                        stroke='currentColor'
                                                                                        strokeWidth='1.5'
                                                                                        strokeLinecap='round'
                                                                                    />
                                                                                    <circle
                                                                                        cx='12'
                                                                                        cy='10'
                                                                                        r='2'
                                                                                        stroke='currentColor'
                                                                                        strokeWidth='1.5'
                                                                                        fill='none'
                                                                                    />
                                                                                </svg>
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
                                </div>
                            )}
                        </motion.div>
                    )}

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
                                className={`${
                                    activePanel === 'roles'
                                        ? 'bg-[#0171EC]' // Dark when expanded
                                        : 'bg-blue-400' // Lighter when collapsed
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
                                            {
                                                panels.find(
                                                    (p) => p.id === 'roles',
                                                )?.icon
                                            }
                                            <div>
                                                <h3 className='text-lg font-semibold'>
                                                    {
                                                        panels.find(
                                                            (p) =>
                                                                p.id ===
                                                                'roles',
                                                        )?.title
                                                    }
                                                </h3>
                                                <p className='text-sm opacity-90'>
                                                    {
                                                        panels.find(
                                                            (p) =>
                                                                p.id ===
                                                                'roles',
                                                        )?.subtitle
                                                    }
                                                </p>
                                            </div>
                                        </div>

                                        <div className='flex items-center gap-2'>
                                            {/* Assign Roles Button */}
                                            {selectedRoles.size > 0 && (
                                                <motion.button
                                                    initial={{
                                                        opacity: 0,
                                                        scale: 0.8,
                                                    }}
                                                    animate={{
                                                        opacity: 1,
                                                        scale: 1,
                                                    }}
                                                    exit={{
                                                        opacity: 0,
                                                        scale: 0.8,
                                                    }}
                                                    onClick={handleAssignRoles}
                                                    disabled={
                                                        roleAssignmentLoading
                                                    }
                                                    className='bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 backdrop-blur-sm border border-white/30 disabled:opacity-50'
                                                    whileHover={{scale: 1.05}}
                                                    whileTap={{scale: 0.95}}
                                                >
                                                    {roleAssignmentLoading ? (
                                                        <div className='flex items-center gap-2'>
                                                            <div className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin'></div>
                                                            Assigning...
                                                        </div>
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
                                                </motion.button>
                                            )}

                                            {/* Close Button */}
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
                                            {
                                                panels.find(
                                                    (p) => p.id === 'roles',
                                                )?.icon
                                            }
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
                                                    className='ml-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700'
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
                                className={`${
                                    activePanel === 'scope'
                                        ? 'bg-[#0171EC]' // Dark when expanded
                                        : 'bg-blue-400' // Lighter when collapsed
                                } text-white p-4 cursor-pointer ${
                                    activePanel !== 'scope'
                                        ? 'h-full flex items-center justify-center'
                                        : ''
                                }`}
                                onClick={() => handlePanelClick('scope')}
                            >
                                {activePanel === 'scope' ? (
                                    <div className='flex items-center justify-between'>
                                        <div className='flex items-center space-x-4'>
                                            {
                                                panels.find(
                                                    (p) => p.id === 'scope',
                                                )?.icon
                                            }
                                            <div>
                                                <h3 className='text-lg font-semibold'>
                                                    {
                                                        panels.find(
                                                            (p) =>
                                                                p.id ===
                                                                'scope',
                                                        )?.title
                                                    }
                                                </h3>
                                                <p className='text-sm opacity-90'>
                                                    Define permissions for:{' '}
                                                    <span className='font-medium'>
                                                        {selectedRole?.name ||
                                                            'Selected Role'}
                                                    </span>
                                                </p>
                                            </div>

                                            {/* Role Badge */}
                                            {selectedRole && (
                                                <motion.div
                                                    className='px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium border border-white/30'
                                                    initial={{
                                                        opacity: 0,
                                                        scale: 0.8,
                                                    }}
                                                    animate={{
                                                        opacity: 1,
                                                        scale: 1,
                                                    }}
                                                    transition={{duration: 0.3}}
                                                >
                                                    Role: {selectedRole.name}
                                                </motion.div>
                                            )}
                                        </div>

                                        <div className='flex items-center gap-2'>
                                            {/* Apply Changes Button */}
                                            <motion.button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    // Trigger save in ScopeConfigSlidingPanel
                                                    setTriggerScopeSave(
                                                        (prev) => prev + 1,
                                                    );
                                                }}
                                                className='bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 backdrop-blur-sm border border-white/30 flex items-center gap-2'
                                                whileHover={{scale: 1.05}}
                                                whileTap={{scale: 0.95}}
                                                initial={{opacity: 0, x: 20}}
                                                animate={{opacity: 1, x: 0}}
                                                transition={{
                                                    duration: 0.3,
                                                    delay: 0.2,
                                                }}
                                            >
                                                <svg
                                                    className='w-4 h-4'
                                                    fill='none'
                                                    stroke='currentColor'
                                                    viewBox='0 0 24 24'
                                                >
                                                    <path
                                                        strokeLinecap='round'
                                                        strokeLinejoin='round'
                                                        strokeWidth={2}
                                                        d='M5 13l4 4L19 7'
                                                    />
                                                </svg>
                                                Apply Changes
                                            </motion.button>

                                            {/* Close Button */}
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
                                            {
                                                panels.find(
                                                    (p) => p.id === 'scope',
                                                )?.icon
                                            }
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
                                                    className='ml-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700'
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
                                            triggerSave={triggerScopeSave}
                                            hideHeader={true}
                                            onSave={async (scopeConfig) => {
                                                console.log(
                                                    'Scope configuration saved:',
                                                    scopeConfig,
                                                );

                                                // Hide scope panel and show only userGroups and roles
                                                setVisiblePanels(
                                                    new Set([
                                                        'userGroups',
                                                        'roles',
                                                    ] as PanelType[]),
                                                );
                                                setActivePanel('roles');

                                                // Refresh roles data to update scope configuration status (icon color)
                                                await fetchRoles();

                                                console.log(
                                                    '✅ Navigated back to roles panel with updated scope icon',
                                                );
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
