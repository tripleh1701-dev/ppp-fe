'use client';

import React, {useState, useEffect} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {
    ChevronDownIcon,
    ChevronRightIcon,
    UserGroupIcon,
    UserIcon,
    CogIcon,
    ShieldCheckIcon,
    BuildingOfficeIcon,
    CommandLineIcon,
    SparklesIcon,
    UsersIcon,
    EyeIcon,
    PencilSquareIcon,
    TrashIcon,
    PlusIcon,
} from '@heroicons/react/24/outline';
import {
    UserGroupIcon as UserGroupSolidIcon,
    UserIcon as UserSolidIcon,
    CogIcon as CogSolidIcon,
    ShieldCheckIcon as ShieldSolidIcon,
} from '@heroicons/react/24/solid';

// Modern animated SVG icon components
const AnimatedTreeIcon = () => (
    <svg
        className='w-5 h-5'
        viewBox='0 0 24 24'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
    >
        <motion.path
            d='M12 2L8 6H11V12H8L12 16L16 12H13V6H16L12 2Z'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            initial={{pathLength: 0, opacity: 0}}
            animate={{pathLength: 1, opacity: 1}}
            transition={{duration: 1.5, ease: 'easeInOut'}}
        />
        <motion.circle
            cx='12'
            cy='2'
            r='1'
            fill='currentColor'
            animate={{scale: [1, 1.2, 1]}}
            transition={{duration: 2, repeat: Infinity, ease: 'easeInOut'}}
        />
    </svg>
);

const AnimatedFlowchartIcon = () => (
    <svg
        className='w-5 h-5'
        viewBox='0 0 24 24'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
    >
        <motion.rect
            x='3'
            y='3'
            width='6'
            height='4'
            rx='1'
            stroke='currentColor'
            strokeWidth='2'
            initial={{scale: 0, opacity: 0}}
            animate={{scale: 1, opacity: 1}}
            transition={{duration: 0.6, delay: 0.1}}
        />
        <motion.rect
            x='15'
            y='3'
            width='6'
            height='4'
            rx='1'
            stroke='currentColor'
            strokeWidth='2'
            initial={{scale: 0, opacity: 0}}
            animate={{scale: 1, opacity: 1}}
            transition={{duration: 0.6, delay: 0.3}}
        />
        <motion.rect
            x='9'
            y='17'
            width='6'
            height='4'
            rx='1'
            stroke='currentColor'
            strokeWidth='2'
            initial={{scale: 0, opacity: 0}}
            animate={{scale: 1, opacity: 1}}
            transition={{duration: 0.6, delay: 0.5}}
        />
        <motion.path
            d='M9 5H15M12 7V17'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            initial={{pathLength: 0}}
            animate={{pathLength: 1}}
            transition={{duration: 1, delay: 0.7}}
        />
        <motion.circle
            cx='12'
            cy='12'
            r='1'
            fill='currentColor'
            animate={{
                scale: [0, 1.5, 0],
                opacity: [0, 1, 0],
            }}
            transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 1.5,
            }}
        />
    </svg>
);

const AnimatedGroupsIcon = () => (
    <svg
        className='w-5 h-5'
        viewBox='0 0 24 24'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
    >
        <motion.circle
            cx='9'
            cy='7'
            r='4'
            stroke='currentColor'
            strokeWidth='2'
            initial={{scale: 0}}
            animate={{scale: 1}}
            transition={{duration: 0.5}}
        />
        <motion.path
            d='M3 21V19C3 16.7909 4.79086 15 7 15H11C13.2091 15 15 16.7909 15 19V21'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            initial={{pathLength: 0}}
            animate={{pathLength: 1}}
            transition={{duration: 0.8, delay: 0.3}}
        />
        <motion.circle
            cx='18'
            cy='9'
            r='3'
            stroke='currentColor'
            strokeWidth='2'
            initial={{scale: 0}}
            animate={{scale: 1}}
            transition={{duration: 0.5, delay: 0.6}}
        />
        <motion.path
            d='M16 21V20C16 18.3431 17.3431 17 19 17H19.5'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            initial={{pathLength: 0}}
            animate={{pathLength: 1}}
            transition={{duration: 0.6, delay: 0.9}}
        />
    </svg>
);

const AnimatedUsersIcon = () => (
    <svg
        className='w-5 h-5'
        viewBox='0 0 24 24'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
    >
        <motion.path
            d='M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            initial={{pathLength: 0}}
            animate={{pathLength: 1}}
            transition={{duration: 1, delay: 0.5}}
        />
        <motion.circle
            cx='12'
            cy='7'
            r='4'
            stroke='currentColor'
            strokeWidth='2'
            initial={{scale: 0, rotate: -180}}
            animate={{scale: 1, rotate: 0}}
            transition={{duration: 0.6, ease: 'easeOut'}}
        />
        <motion.circle
            cx='12'
            cy='7'
            r='2'
            fill='currentColor'
            opacity='0.3'
            animate={{scale: [1, 1.2, 1]}}
            transition={{duration: 2, repeat: Infinity, delay: 1}}
        />
    </svg>
);

const AnimatedRolesIcon = () => (
    <svg
        className='w-5 h-5'
        viewBox='0 0 24 24'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
    >
        <motion.path
            d='M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            initial={{pathLength: 0, rotate: -90}}
            animate={{pathLength: 1, rotate: 0}}
            transition={{duration: 1.2, ease: 'easeInOut'}}
        />
        <motion.path
            d='M9 12L11 14L15 10'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            initial={{pathLength: 0}}
            animate={{pathLength: 1}}
            transition={{duration: 0.6, delay: 0.8}}
        />
        <motion.circle
            cx='12'
            cy='12'
            r='8'
            stroke='currentColor'
            strokeWidth='1'
            opacity='0.2'
            animate={{scale: [1, 1.1, 1]}}
            transition={{duration: 3, repeat: Infinity, ease: 'easeInOut'}}
        />
    </svg>
);

const AnimatedSearchIcon = () => (
    <svg
        className='w-4 h-4'
        viewBox='0 0 24 24'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
    >
        <motion.circle
            cx='11'
            cy='11'
            r='8'
            stroke='currentColor'
            strokeWidth='2'
            initial={{scale: 0, opacity: 0}}
            animate={{scale: 1, opacity: 1}}
            transition={{duration: 0.6}}
        />
        <motion.path
            d='M21 21L16.65 16.65'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            initial={{pathLength: 0}}
            animate={{pathLength: 1}}
            transition={{duration: 0.4, delay: 0.4}}
        />
        <motion.circle
            cx='11'
            cy='11'
            r='4'
            stroke='currentColor'
            strokeWidth='1'
            opacity='0.3'
            animate={{scale: [1, 1.2, 1]}}
            transition={{duration: 2, repeat: Infinity, delay: 0.8}}
        />
    </svg>
);

const AnimatedAddIcon = () => (
    <svg
        className='w-4 h-4'
        viewBox='0 0 24 24'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
    >
        <motion.circle
            cx='12'
            cy='12'
            r='10'
            stroke='currentColor'
            strokeWidth='2'
            initial={{scale: 0}}
            animate={{scale: 1}}
            transition={{duration: 0.5, ease: 'easeOut'}}
        />
        <motion.path
            d='M12 8V16M8 12H16'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            initial={{pathLength: 0}}
            animate={{pathLength: 1}}
            transition={{duration: 0.6, delay: 0.3}}
        />
        <motion.circle
            cx='12'
            cy='12'
            r='6'
            fill='currentColor'
            opacity='0.1'
            animate={{scale: [0, 1, 0]}}
            transition={{duration: 2, repeat: Infinity, delay: 1}}
        />
    </svg>
);

// Types for our hierarchy structure
interface User {
    id: string;
    firstName: string;
    lastName: string;
    emailAddress: string;
    status: string;
    technicalUser: boolean;
    assignedUserGroups?: Group[];
}

interface Group {
    id: string;
    name: string;
    description?: string;
    roles?: Role[];
    users?: User[];
    memberCount?: number;
}

interface Role {
    id: string;
    name: string;
    description?: string;
    permissions: string[];
}

interface Service {
    id: string;
    name: string;
    description?: string;
}

interface TreeNode {
    id: string;
    label: string;
    type: 'organization' | 'group' | 'user' | 'role' | 'permission' | 'service';
    icon: React.ReactNode;
    children?: TreeNode[];
    data?: any;
    count?: number;
    status?: string;
}

export default function RoleUserHierarchy() {
    const [treeData, setTreeData] = useState<TreeNode[]>([]);
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
        new Set(['root']),
    );
    const [loading, setLoading] = useState(true);
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'groups' | 'users' | 'roles'>(
        'groups',
    );
    const [displayMode, setDisplayMode] = useState<'tree' | 'flowchart'>(
        'tree',
    );

    // Store raw data
    const [rawData, setRawData] = useState<{
        groups: any[];
        roles: any[];
        users: any[];
        services: any[];
    }>({groups: [], roles: [], users: [], services: []});

    // Load data from APIs
    useEffect(() => {
        const loadHierarchyData = async () => {
            setLoading(true);
            try {
                console.log('🌳 Loading hierarchy data...');

                // Fetch all data in parallel
                const [
                    groupsResponse,
                    rolesResponse,
                    usersResponse,
                    servicesResponse,
                ] = await Promise.all([
                    fetch('http://localhost:4000/api/groups'),
                    fetch('http://localhost:4000/api/roles'),
                    fetch('http://localhost:4000/api/users'),
                    fetch('http://localhost:4000/api/services'),
                ]);

                const [groups, roles, users, services] = await Promise.all([
                    groupsResponse.ok ? groupsResponse.json() : [],
                    rolesResponse.ok ? rolesResponse.json() : [],
                    usersResponse.ok ? usersResponse.json() : [],
                    servicesResponse.ok ? servicesResponse.json() : [],
                ]);

                console.log('📊 Loaded data:', {
                    groups,
                    roles,
                    users,
                    services,
                });

                // Store raw data
                setRawData({groups, roles, users, services});
            } catch (error) {
                console.error('❌ Error loading hierarchy data:', error);
                setRawData({groups: [], roles: [], users: [], services: []});
            } finally {
                setLoading(false);
            }
        };

        loadHierarchyData();
    }, []);

    // Rebuild tree when view mode or raw data changes
    useEffect(() => {
        const rebuildTree = async () => {
            if (rawData.groups.length > 0) {
                try {
                    console.log('🔄 Rebuilding tree for view mode:', viewMode);
                    const tree = await buildHierarchyTree(
                        rawData.groups,
                        rawData.roles,
                        rawData.users,
                        rawData.services,
                    );
                    setTreeData(tree);
                } catch (error) {
                    console.error('❌ Error rebuilding tree:', error);
                    setTreeData([]);
                }
            }
        };

        rebuildTree();
    }, [viewMode, rawData]);

    // Build the complete hierarchy tree
    const buildHierarchyTree = async (
        groups: Group[],
        roles: Role[],
        users: User[],
        services: Service[],
    ): Promise<TreeNode[]> => {
        try {
            // Fetch detailed group data with roles and users
            const enrichedGroups = await Promise.all(
                groups.map(async (group) => {
                    try {
                        // Get roles for this group
                        const rolesResponse = await fetch(
                            `http://localhost:4000/api/user-groups/${group.id}/roles`,
                        );
                        let groupRoles: Role[] = [];
                        if (rolesResponse.ok) {
                            const rolesData = await rolesResponse.json();
                            if (rolesData.success && rolesData.data?.roles) {
                                groupRoles = rolesData.data.roles;
                            }
                        }

                        // Get users for this group
                        const usersResponse = await fetch(
                            `http://localhost:4000/api/user-groups/${group.id}/users`,
                        );
                        let groupUsers: User[] = [];
                        if (usersResponse.ok) {
                            const usersData = await usersResponse.json();
                            if (usersData.success && usersData.data?.users) {
                                groupUsers = usersData.data.users;
                            }
                        }

                        return {
                            ...group,
                            roles: groupRoles,
                            users: groupUsers,
                            memberCount: groupUsers.length,
                        };
                    } catch (error) {
                        console.error(
                            `Error enriching group ${group.id}:`,
                            error,
                        );
                        return {...group, roles: [], users: [], memberCount: 0};
                    }
                }),
            );

            // Build the tree based on the current view mode
            const organizationNode: TreeNode = {
                id: 'root',
                label: 'Organization Hierarchy',
                type: 'organization',
                icon: <BuildingOfficeIcon className='h-5 w-5' />,
                children: [],
                count: enrichedGroups.length,
            };

            if (viewMode === 'groups') {
                // Group-centric view
                organizationNode.children = enrichedGroups.map((group) => ({
                    id: `group-${group.id}`,
                    label: group.name,
                    type: 'group',
                    icon: <UserGroupSolidIcon className='h-5 w-5' />,
                    data: group,
                    count: group.memberCount,
                    children: [
                        // Users in this group
                        ...(group.users && group.users.length > 0
                            ? [
                                  {
                                      id: `group-${group.id}-users`,
                                      label: `Users (${group.users.length})`,
                                      type: 'user' as const,
                                      icon: <UsersIcon className='h-5 w-5' />,
                                      children: group.users.map((user) => ({
                                          id: `user-${user.id}`,
                                          label: `${user.firstName} ${user.lastName}`,
                                          type: 'user' as const,
                                          icon: user.technicalUser ? (
                                              <CommandLineIcon className='h-4 w-4' />
                                          ) : (
                                              <UserSolidIcon className='h-4 w-4' />
                                          ),
                                          data: user,
                                          status: user.status,
                                      })),
                                  },
                              ]
                            : []),
                        // Roles in this group
                        ...(group.roles && group.roles.length > 0
                            ? [
                                  {
                                      id: `group-${group.id}-roles`,
                                      label: `Roles (${group.roles.length})`,
                                      type: 'role' as const,
                                      icon: (
                                          <CogSolidIcon className='h-5 w-5' />
                                      ),
                                      children: group.roles.map((role) => ({
                                          id: `role-${role.id}`,
                                          label: role.name,
                                          type: 'role' as const,
                                          icon: (
                                              <ShieldSolidIcon className='h-4 w-4' />
                                          ),
                                          data: role,
                                          children:
                                              role.permissions?.map(
                                                  (permission, index) => ({
                                                      id: `permission-${role.id}-${index}`,
                                                      label: permission,
                                                      type: 'permission' as const,
                                                      icon: (
                                                          <SparklesIcon className='h-3 w-3' />
                                                      ),
                                                  }),
                                              ) || [],
                                      })),
                                  },
                              ]
                            : []),
                    ],
                }));
            } else if (viewMode === 'users') {
                // User-centric view
                const allUsers = users.filter(
                    (user) =>
                        !searchTerm ||
                        `${user.firstName} ${user.lastName}`
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase()) ||
                        user.emailAddress
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase()),
                );

                organizationNode.children = [
                    {
                        id: 'all-users',
                        label: `All Users (${allUsers.length})`,
                        type: 'user',
                        icon: <UsersIcon className='h-5 w-5' />,
                        children: allUsers.map((user) => {
                            const userGroups = enrichedGroups.filter((group) =>
                                group.users?.some(
                                    (groupUser) => groupUser.id === user.id,
                                ),
                            );

                            return {
                                id: `user-${user.id}`,
                                label: `${user.firstName} ${user.lastName}`,
                                type: 'user' as const,
                                icon: user.technicalUser ? (
                                    <CommandLineIcon className='h-4 w-4' />
                                ) : (
                                    <UserSolidIcon className='h-4 w-4' />
                                ),
                                data: user,
                                status: user.status,
                                children:
                                    userGroups.length > 0
                                        ? [
                                              {
                                                  id: `user-${user.id}-groups`,
                                                  label: `Member of ${userGroups.length} group(s)`,
                                                  type: 'group' as const,
                                                  icon: (
                                                      <UserGroupIcon className='h-4 w-4' />
                                                  ),
                                                  children: userGroups.map(
                                                      (group) => ({
                                                          id: `user-${user.id}-group-${group.id}`,
                                                          label: group.name,
                                                          type: 'group' as const,
                                                          icon: (
                                                              <UserGroupSolidIcon className='h-4 w-4' />
                                                          ),
                                                          data: group,
                                                      }),
                                                  ),
                                              },
                                          ]
                                        : [],
                            };
                        }),
                    },
                ];
            } else {
                // Role-centric view
                organizationNode.children = [
                    {
                        id: 'all-roles',
                        label: `All Roles (${roles.length})`,
                        type: 'role',
                        icon: <CogIcon className='h-5 w-5' />,
                        children: roles.map((role) => {
                            const roleGroups = enrichedGroups.filter((group) =>
                                group.roles?.some(
                                    (groupRole) => groupRole.id === role.id,
                                ),
                            );

                            return {
                                id: `role-${role.id}`,
                                label: role.name,
                                type: 'role' as const,
                                icon: <ShieldSolidIcon className='h-4 w-4' />,
                                data: role,
                                children: [
                                    // Permissions
                                    ...(role.permissions &&
                                    role.permissions.length > 0
                                        ? [
                                              {
                                                  id: `role-${role.id}-permissions`,
                                                  label: `Permissions (${role.permissions.length})`,
                                                  type: 'permission' as const,
                                                  icon: (
                                                      <SparklesIcon className='h-4 w-4' />
                                                  ),
                                                  children:
                                                      role.permissions.map(
                                                          (
                                                              permission,
                                                              index,
                                                          ) => ({
                                                              id: `permission-${role.id}-${index}`,
                                                              label: permission,
                                                              type: 'permission' as const,
                                                              icon: (
                                                                  <SparklesIcon className='h-3 w-3' />
                                                              ),
                                                          }),
                                                      ),
                                              },
                                          ]
                                        : []),
                                    // Assigned to groups
                                    ...(roleGroups.length > 0
                                        ? [
                                              {
                                                  id: `role-${role.id}-groups`,
                                                  label: `Assigned to ${roleGroups.length} group(s)`,
                                                  type: 'group' as const,
                                                  icon: (
                                                      <UserGroupIcon className='h-4 w-4' />
                                                  ),
                                                  children: roleGroups.map(
                                                      (group) => ({
                                                          id: `role-${role.id}-group-${group.id}`,
                                                          label: group.name,
                                                          type: 'group' as const,
                                                          icon: (
                                                              <UserGroupSolidIcon className='h-4 w-4' />
                                                          ),
                                                          data: group,
                                                      }),
                                                  ),
                                              },
                                          ]
                                        : []),
                                ],
                            };
                        }),
                    },
                ];
            }

            return [organizationNode];
        } catch (error) {
            console.error('Error building hierarchy tree:', error);
            return [];
        }
    };

    // Toggle node expansion
    const toggleNode = (nodeId: string) => {
        setExpandedNodes((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(nodeId)) {
                newSet.delete(nodeId);
            } else {
                newSet.add(nodeId);
            }
            return newSet;
        });
    };

    // Render tree node
    const renderTreeNode = (node: TreeNode, level: number = 0) => {
        const isExpanded = expandedNodes.has(node.id);
        const hasChildren = node.children && node.children.length > 0;
        const isSelected = selectedNode === node.id;

        return (
            <motion.div
                key={node.id}
                initial={{opacity: 0, x: -20}}
                animate={{opacity: 1, x: 0}}
                transition={{duration: 0.3, delay: level * 0.05}}
                className='relative'
            >
                {/* Node Content */}
                <motion.div
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-300 ${
                        isSelected
                            ? 'bg-blue-100 border-2 border-blue-300 shadow-lg'
                            : 'hover:bg-slate-50 border-2 border-transparent hover:border-slate-200'
                    } ${level > 0 ? 'ml-6' : ''}`}
                    onClick={() => {
                        if (hasChildren) toggleNode(node.id);
                        setSelectedNode(node.id);
                    }}
                    whileHover={{scale: 1.02}}
                    whileTap={{scale: 0.98}}
                >
                    {/* Expand/Collapse Icon */}
                    {hasChildren && (
                        <motion.div
                            animate={{rotate: isExpanded ? 90 : 0}}
                            transition={{duration: 0.2}}
                            className='text-slate-400'
                        >
                            <ChevronRightIcon className='h-4 w-4' />
                        </motion.div>
                    )}

                    {/* Node Icon */}
                    <div
                        className={`p-2 rounded-lg ${getNodeIconColor(
                            node.type,
                        )} flex-shrink-0`}
                    >
                        {node.icon}
                    </div>

                    {/* Node Label and Info */}
                    <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2'>
                            <span
                                className={`font-medium truncate ${getNodeTextColor(
                                    node.type,
                                )}`}
                            >
                                {node.label}
                            </span>
                            {node.count !== undefined && (
                                <span className='px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium'>
                                    {node.count}
                                </span>
                            )}
                            {node.status && (
                                <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        node.status === 'ACTIVE' ||
                                        node.status === 'active'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-red-100 text-red-700'
                                    }`}
                                >
                                    {node.status}
                                </span>
                            )}
                        </div>
                        {node.data?.description && (
                            <p className='text-sm text-slate-500 truncate mt-1'>
                                {node.data.description}
                            </p>
                        )}
                        {node.data?.emailAddress && (
                            <p className='text-sm text-slate-500 truncate mt-1'>
                                {node.data.emailAddress}
                            </p>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className='flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity'>
                        <button className='p-1 hover:bg-blue-100 rounded-md'>
                            <EyeIcon className='h-4 w-4 text-blue-600' />
                        </button>
                        <button className='p-1 hover:bg-green-100 rounded-md'>
                            <PencilSquareIcon className='h-4 w-4 text-green-600' />
                        </button>
                    </div>
                </motion.div>

                {/* Children */}
                <AnimatePresence>
                    {isExpanded && hasChildren && (
                        <motion.div
                            initial={{opacity: 0, height: 0}}
                            animate={{opacity: 1, height: 'auto'}}
                            exit={{opacity: 0, height: 0}}
                            transition={{duration: 0.3}}
                            className='overflow-hidden'
                        >
                            <div className='ml-6 border-l-2 border-slate-200 pl-6 mt-2'>
                                {node.children?.map((child) =>
                                    renderTreeNode(child, level + 1),
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        );
    };

    // Get node icon color based on type
    const getNodeIconColor = (type: string) => {
        switch (type) {
            case 'organization':
                return 'bg-purple-100 text-purple-600';
            case 'group':
                return 'bg-blue-100 text-blue-600';
            case 'user':
                return 'bg-green-100 text-green-600';
            case 'role':
                return 'bg-orange-100 text-orange-600';
            case 'permission':
                return 'bg-yellow-100 text-yellow-600';
            case 'service':
                return 'bg-indigo-100 text-indigo-600';
            default:
                return 'bg-slate-100 text-slate-600';
        }
    };

    // Get node text color based on type
    const getNodeTextColor = (type: string) => {
        switch (type) {
            case 'organization':
                return 'text-purple-900';
            case 'group':
                return 'text-blue-900';
            case 'user':
                return 'text-green-900';
            case 'role':
                return 'text-orange-900';
            case 'permission':
                return 'text-yellow-900';
            case 'service':
                return 'text-indigo-900';
            default:
                return 'text-slate-900';
        }
    };

    // Render flowchart view
    const renderFlowchart = () => {
        if (loading) {
            return (
                <div className='text-center py-8'>
                    <p className='text-slate-600'>Loading flowchart...</p>
                </div>
            );
        }

        if (treeData.length === 0) {
            return (
                <div className='text-center py-8'>
                    <p className='text-slate-600'>
                        No data available for flowchart
                    </p>
                </div>
            );
        }

        const organizationNode = treeData[0];

        if (!organizationNode?.children) {
            return (
                <div className='text-center py-8'>
                    <p className='text-slate-600'>
                        No children found for organization node
                    </p>
                </div>
            );
        }

        return (
            <div className='w-full overflow-x-auto bg-slate-50 min-h-screen'>
                <div className='min-w-max px-8 py-6 relative'>
                    {/* Root Organization Node */}
                    <div className='flex flex-col items-center relative'>
                        <motion.div
                            initial={{opacity: 0, scale: 0.9, y: -20}}
                            animate={{opacity: 1, scale: 1, y: 0}}
                            transition={{duration: 0.5, ease: 'easeOut'}}
                            className='bg-white border border-blue-200/60 shadow-lg hover:shadow-xl px-8 py-4 rounded-xl mb-8 relative z-10 transition-all duration-300'
                        >
                            <div className='flex items-center gap-3'>
                                <div className='p-2 bg-blue-50 rounded-lg border border-blue-100'>
                                    <BuildingOfficeIcon className='h-5 w-5 text-blue-600' />
                                </div>
                                <span className='text-lg font-semibold text-slate-800'>
                                    {organizationNode.label}
                                </span>
                                {organizationNode.count && (
                                    <motion.span
                                        initial={{scale: 0}}
                                        animate={{scale: 1}}
                                        transition={{
                                            delay: 0.2,
                                            type: 'spring',
                                        }}
                                        className='bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium border border-blue-200'
                                    >
                                        {organizationNode.count}
                                    </motion.span>
                                )}
                            </div>
                        </motion.div>

                        {/* Main Vertical Connector */}
                        <motion.div
                            initial={{height: 0}}
                            animate={{height: 40}}
                            transition={{delay: 0.6, duration: 0.4}}
                            className='w-0.5 bg-slate-300 relative'
                        >
                            <motion.div
                                animate={{y: [0, 20, 0]}}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                }}
                                className='absolute top-0 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full'
                            />
                        </motion.div>

                        {/* Horizontal Connector Hub */}
                        <div className='relative'>
                            {/* Horizontal Line */}
                            <motion.div
                                initial={{width: 0}}
                                animate={{
                                    width:
                                        organizationNode.children.length * 288 +
                                        (organizationNode.children.length - 1) *
                                            24,
                                }}
                                transition={{delay: 0.8, duration: 0.6}}
                                className='h-0.5 bg-slate-300 absolute'
                                style={{
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                }}
                            />

                            {/* Groups Level */}
                            <div className='flex items-start gap-6 flex-wrap justify-center pt-6'>
                                {organizationNode.children.map(
                                    (groupNode, index) => (
                                        <motion.div
                                            key={groupNode.id}
                                            initial={{
                                                opacity: 0,
                                                y: 30,
                                                scale: 0.95,
                                            }}
                                            animate={{
                                                opacity: 1,
                                                y: 0,
                                                scale: 1,
                                            }}
                                            transition={{
                                                delay: 1.0 + index * 0.1,
                                                duration: 0.4,
                                                ease: 'easeOut',
                                            }}
                                            className='flex flex-col items-center relative'
                                        >
                                            {/* Vertical Connector from Horizontal Line */}
                                            <motion.div
                                                initial={{height: 0}}
                                                animate={{height: 24}}
                                                transition={{
                                                    delay: 0.9 + index * 0.05,
                                                    duration: 0.3,
                                                }}
                                                className='w-0.5 bg-slate-300 relative mb-2 -mt-6'
                                            >
                                                {/* Connection Point */}
                                                <div className='absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-slate-400 rounded-full' />
                                                <motion.div
                                                    animate={{
                                                        scale: [1, 1.3, 1],
                                                    }}
                                                    transition={{
                                                        duration: 2.5,
                                                        repeat: Infinity,
                                                        delay: index * 0.4,
                                                    }}
                                                    className='absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full'
                                                />
                                            </motion.div>

                                            {/* Professional Group Node */}
                                            <motion.div
                                                whileHover={{
                                                    scale: 1.02,
                                                    y: -2,
                                                }}
                                                whileTap={{scale: 0.98}}
                                                onClick={() =>
                                                    toggleNode(groupNode.id)
                                                }
                                                className={`bg-white border cursor-pointer transition-all duration-300 w-72 shadow-md hover:shadow-lg rounded-lg overflow-hidden ${
                                                    expandedNodes.has(
                                                        groupNode.id,
                                                    )
                                                        ? 'border-blue-300 ring-1 ring-blue-200'
                                                        : 'border-slate-200 hover:border-slate-300'
                                                }`}
                                            >
                                                {/* Header */}
                                                <div className='px-4 py-3 bg-slate-50 border-b border-slate-100'>
                                                    <div className='flex items-center justify-between'>
                                                        <div className='flex items-center gap-2'>
                                                            <div className='p-1.5 bg-blue-100 rounded-md'>
                                                                {groupNode.icon}
                                                            </div>
                                                            <span className='font-semibold text-slate-800 text-sm'>
                                                                {
                                                                    groupNode.label
                                                                }
                                                            </span>
                                                        </div>
                                                        <div className='flex items-center gap-2'>
                                                            {groupNode.count !==
                                                                undefined && (
                                                                <span className='bg-slate-200 text-slate-700 px-2 py-1 rounded text-xs font-medium'>
                                                                    {
                                                                        groupNode.count
                                                                    }
                                                                </span>
                                                            )}
                                                            <motion.div
                                                                animate={{
                                                                    rotate: expandedNodes.has(
                                                                        groupNode.id,
                                                                    )
                                                                        ? 180
                                                                        : 0,
                                                                }}
                                                                transition={{
                                                                    duration: 0.2,
                                                                }}
                                                                className='p-1'
                                                            >
                                                                <ChevronDownIcon className='h-3 w-3 text-slate-500' />
                                                            </motion.div>
                                                        </div>
                                                    </div>
                                                    {groupNode.data
                                                        ?.description && (
                                                        <p className='text-xs text-slate-600 mt-1 truncate'>
                                                            {
                                                                groupNode.data
                                                                    .description
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            </motion.div>

                                            {/* Children (Users & Roles) */}
                                            <AnimatePresence>
                                                {expandedNodes.has(
                                                    groupNode.id,
                                                ) &&
                                                    groupNode.children && (
                                                        <motion.div
                                                            initial={{
                                                                opacity: 0,
                                                                height: 0,
                                                            }}
                                                            animate={{
                                                                opacity: 1,
                                                                height: 'auto',
                                                            }}
                                                            exit={{
                                                                opacity: 0,
                                                                height: 0,
                                                            }}
                                                            transition={{
                                                                duration: 0.3,
                                                                ease: 'easeOut',
                                                            }}
                                                            className='mt-3 flex flex-col items-center w-72'
                                                        >
                                                            {/* Connection Line Down */}
                                                            <motion.div
                                                                initial={{
                                                                    height: 0,
                                                                }}
                                                                animate={{
                                                                    height: 20,
                                                                }}
                                                                exit={{
                                                                    height: 0,
                                                                }}
                                                                transition={{
                                                                    duration: 0.2,
                                                                }}
                                                                className='w-0.5 bg-slate-300 relative'
                                                            >
                                                                <motion.div
                                                                    animate={{
                                                                        y: [
                                                                            0,
                                                                            6,
                                                                            0,
                                                                        ],
                                                                    }}
                                                                    transition={{
                                                                        duration: 2,
                                                                        repeat: Infinity,
                                                                    }}
                                                                    className='absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full'
                                                                />
                                                            </motion.div>

                                                            {/* Compact Grid Layout */}
                                                            <div className='grid grid-cols-2 gap-3 w-full px-2'>
                                                                {groupNode.children.map(
                                                                    (
                                                                        childNode,
                                                                        childIndex,
                                                                    ) => (
                                                                        <motion.div
                                                                            key={
                                                                                childNode.id
                                                                            }
                                                                            initial={{
                                                                                opacity: 0,
                                                                                scale: 0.9,
                                                                            }}
                                                                            animate={{
                                                                                opacity: 1,
                                                                                scale: 1,
                                                                            }}
                                                                            transition={{
                                                                                delay:
                                                                                    childIndex *
                                                                                    0.1,
                                                                                duration: 0.3,
                                                                            }}
                                                                            className='w-full'
                                                                        >
                                                                            {/* Compact Professional Child Node */}
                                                                            <motion.div
                                                                                whileHover={{
                                                                                    scale: 1.01,
                                                                                    y: -1,
                                                                                }}
                                                                                onClick={() =>
                                                                                    toggleNode(
                                                                                        childNode.id,
                                                                                    )
                                                                                }
                                                                                className={`bg-white border rounded-md cursor-pointer transition-all duration-200 ${
                                                                                    childNode.type ===
                                                                                    'role'
                                                                                        ? 'border-orange-200 hover:border-orange-300 hover:bg-orange-50/30'
                                                                                        : 'border-green-200 hover:border-green-300 hover:bg-green-50/30'
                                                                                }`}
                                                                            >
                                                                                <div className='px-3 py-2'>
                                                                                    <div className='flex items-center gap-2'>
                                                                                        <div
                                                                                            className={`p-1 rounded ${
                                                                                                childNode.type ===
                                                                                                'role'
                                                                                                    ? 'bg-orange-100'
                                                                                                    : 'bg-green-100'
                                                                                            }`}
                                                                                        >
                                                                                            <div className='w-3 h-3 text-slate-600'>
                                                                                                {
                                                                                                    childNode.icon
                                                                                                }
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className='flex-1 min-w-0'>
                                                                                            <p className='text-xs font-medium text-slate-800 truncate'>
                                                                                                {
                                                                                                    childNode.label
                                                                                                }
                                                                                            </p>
                                                                                            <p
                                                                                                className={`text-xs ${
                                                                                                    childNode.type ===
                                                                                                    'role'
                                                                                                        ? 'text-orange-600'
                                                                                                        : 'text-green-600'
                                                                                                }`}
                                                                                            >
                                                                                                {childNode.type ===
                                                                                                'role'
                                                                                                    ? 'Role'
                                                                                                    : 'Users'}
                                                                                                {childNode.children &&
                                                                                                    ` (${childNode.children.length})`}
                                                                                            </p>
                                                                                        </div>
                                                                                        {childNode.children &&
                                                                                            childNode
                                                                                                .children
                                                                                                .length >
                                                                                                0 && (
                                                                                                <motion.div
                                                                                                    animate={{
                                                                                                        rotate: expandedNodes.has(
                                                                                                            childNode.id,
                                                                                                        )
                                                                                                            ? 180
                                                                                                            : 0,
                                                                                                    }}
                                                                                                    transition={{
                                                                                                        duration: 0.2,
                                                                                                    }}
                                                                                                >
                                                                                                    <ChevronDownIcon className='h-3 w-3 text-slate-400' />
                                                                                                </motion.div>
                                                                                            )}
                                                                                    </div>
                                                                                </div>

                                                                                {/* Sub-items (if expanded) */}
                                                                                <AnimatePresence>
                                                                                    {expandedNodes.has(
                                                                                        childNode.id,
                                                                                    ) &&
                                                                                        childNode.children && (
                                                                                            <motion.div
                                                                                                initial={{
                                                                                                    opacity: 0,
                                                                                                    height: 0,
                                                                                                }}
                                                                                                animate={{
                                                                                                    opacity: 1,
                                                                                                    height: 'auto',
                                                                                                }}
                                                                                                exit={{
                                                                                                    opacity: 0,
                                                                                                    height: 0,
                                                                                                }}
                                                                                                className='border-t border-slate-100 px-3 py-2 bg-slate-50/50'
                                                                                            >
                                                                                                <div className='space-y-1'>
                                                                                                    {childNode.children
                                                                                                        .slice(
                                                                                                            0,
                                                                                                            4,
                                                                                                        )
                                                                                                        .map(
                                                                                                            (
                                                                                                                subChild,
                                                                                                            ) => (
                                                                                                                <div
                                                                                                                    key={
                                                                                                                        subChild.id
                                                                                                                    }
                                                                                                                    className='flex items-center gap-1.5 text-xs'
                                                                                                                >
                                                                                                                    <div className='w-1.5 h-1.5 bg-slate-400 rounded-full' />
                                                                                                                    <span className='text-slate-600 truncate'>
                                                                                                                        {
                                                                                                                            subChild.label
                                                                                                                        }
                                                                                                                    </span>
                                                                                                                    {subChild.status && (
                                                                                                                        <span
                                                                                                                            className={`px-1 py-0.5 rounded text-xs ${
                                                                                                                                subChild.status ===
                                                                                                                                    'ACTIVE' ||
                                                                                                                                subChild.status ===
                                                                                                                                    'active'
                                                                                                                                    ? 'bg-green-100 text-green-600'
                                                                                                                                    : 'bg-red-100 text-red-600'
                                                                                                                            }`}
                                                                                                                        >
                                                                                                                            {
                                                                                                                                subChild.status
                                                                                                                            }
                                                                                                                        </span>
                                                                                                                    )}
                                                                                                                </div>
                                                                                                            ),
                                                                                                        )}
                                                                                                    {childNode
                                                                                                        .children
                                                                                                        .length >
                                                                                                        4 && (
                                                                                                        <div className='text-xs text-slate-500 italic'>
                                                                                                            +
                                                                                                            {childNode
                                                                                                                .children
                                                                                                                .length -
                                                                                                                4}{' '}
                                                                                                            more
                                                                                                        </div>
                                                                                                    )}
                                                                                                </div>
                                                                                            </motion.div>
                                                                                        )}
                                                                                </AnimatePresence>
                                                                            </motion.div>
                                                                        </motion.div>
                                                                    ),
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                            </AnimatePresence>
                                        </motion.div>
                                    ),
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6'>
            {/* Header */}
            <div className='bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 p-6 mb-6'>
                <div className='flex items-center justify-between mb-6'>
                    <div className='flex items-center gap-4'>
                        <div className='p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl'>
                            <BuildingOfficeIcon className='h-6 w-6 text-white' />
                        </div>
                        <div>
                            <h1 className='text-2xl font-bold text-slate-900'>
                                Role-User Hierarchy
                            </h1>
                            <p className='text-slate-600'>
                                Visualize organizational structure and access
                                control relationships
                            </p>
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className='flex items-center gap-4 flex-wrap'>
                    {/* Display Mode Selector */}
                    <div className='flex items-center gap-2 bg-slate-100 rounded-xl p-1'>
                        {[
                            {
                                key: 'tree',
                                label: 'Tree View',
                                icon: <AnimatedTreeIcon />,
                            },
                            {
                                key: 'flowchart',
                                label: 'Flowchart',
                                icon: <AnimatedFlowchartIcon />,
                            },
                        ].map((mode) => (
                            <button
                                key={mode.key}
                                onClick={() => {
                                    setDisplayMode(mode.key as any);
                                }}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                                    displayMode === mode.key
                                        ? 'bg-white text-purple-600 shadow-md'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <span>{mode.icon}</span>
                                {mode.label}
                            </button>
                        ))}
                    </div>

                    {/* View Mode Selector */}
                    <div className='flex items-center gap-2 bg-slate-100 rounded-xl p-1'>
                        {[
                            {
                                key: 'groups',
                                label: 'Groups',
                                icon: <AnimatedGroupsIcon />,
                            },
                            {
                                key: 'users',
                                label: 'Users',
                                icon: <AnimatedUsersIcon />,
                            },
                            {
                                key: 'roles',
                                label: 'Roles',
                                icon: <AnimatedRolesIcon />,
                            },
                        ].map((mode) => (
                            <button
                                key={mode.key}
                                onClick={() => setViewMode(mode.key as any)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                                    viewMode === mode.key
                                        ? 'bg-white text-blue-600 shadow-md'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                {mode.icon}
                                {mode.label}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className='flex-1 max-w-md relative'>
                        <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                            <AnimatedSearchIcon />
                        </div>
                        <input
                            type='text'
                            placeholder='Search hierarchy...'
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className='w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                        />
                    </div>

                    {/* Actions */}
                    <div className='flex items-center gap-2'>
                        <button className='flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors'>
                            <AnimatedAddIcon />
                            Add
                        </button>
                        <button
                            onClick={() => setExpandedNodes(new Set(['root']))}
                            className='px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors'
                        >
                            Collapse All
                        </button>
                        <button
                            onClick={() => {
                                const allNodeIds = new Set<string>();
                                const collectIds = (nodes: TreeNode[]) => {
                                    nodes.forEach((node) => {
                                        allNodeIds.add(node.id);
                                        if (node.children)
                                            collectIds(node.children);
                                    });
                                };
                                collectIds(treeData);
                                setExpandedNodes(allNodeIds);
                            }}
                            className='px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors'
                        >
                            Expand All
                        </button>
                    </div>
                </div>
            </div>

            {/* Tree Content */}
            <div className='bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 p-6'>
                {loading ? (
                    <div className='flex items-center justify-center py-20'>
                        <div className='text-center'>
                            <motion.div
                                animate={{rotate: 360}}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: 'linear',
                                }}
                                className='w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4'
                            />
                            <p className='text-slate-600'>
                                Loading hierarchy...
                            </p>
                        </div>
                    </div>
                ) : treeData.length === 0 ? (
                    <div className='text-center py-20'>
                        <BuildingOfficeIcon className='h-16 w-16 text-slate-300 mx-auto mb-4' />
                        <p className='text-slate-600'>
                            No hierarchy data available
                        </p>
                    </div>
                ) : displayMode === 'tree' ? (
                    <div className='space-y-2'>
                        {treeData.map((node) => renderTreeNode(node))}
                    </div>
                ) : (
                    renderFlowchart()
                )}
            </div>
        </div>
    );
}
