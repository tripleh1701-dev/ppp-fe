'use client';

import React, {useState, useEffect, useCallback, useMemo} from 'react';
import ReusableTableComponent from '@/components/reusable/ReusableTableComponent';
import ManageRoles_tableConfig from '@/config/ManageRoles_tableConfig';
import ScopeConfigModal from '@/components/ScopeConfigModal';
import ScopeCell from '@/components/ScopeCell';
import AnimatedUserGroupIcon from '@/components/AnimatedUserGroupIcon';

// Define types for better TypeScript support
interface RoleScope {
    configured: boolean;
    permissions: Record<string, any>;
    configuredAt?: string;
}

interface Role {
    id: string;
    roleName: string;
    description: string;
    permissions: string[];
    category: string;
    status: string;
    createdDate: string;
    lastModified: string;
    assignedUsers: number;
    scope: RoleScope;
    assignedGroups?: Array<{id: string; name: string}>;
    isNew?: boolean;
}

export default function ManageRoles() {
    // State management
    const [tableData, setTableData] = useState<Role[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchVisible, setSearchVisible] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterVisible, setFilterVisible] = useState(false);
    const [groupByVisible, setGroupByVisible] = useState(false);
    const [selectedGroupBy, setSelectedGroupBy] = useState('');
    const [showScopeModal, setShowScopeModal] = useState(false);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);

    // Action button states
    const [sortVisible, setSortVisible] = useState(false);
    const [hideColumnsVisible, setHideColumnsVisible] = useState(false);

    // Functionality states
    const [sortConfig, setSortConfig] = useState<{
        column: string;
        direction: 'asc' | 'desc';
    } | null>(null);
    const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
    const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);

    // Load initial data
    useEffect(() => {
        loadRoles();
    }, []);

    // Load roles data
    const loadRoles = async () => {
        setLoading(true);
        try {
            // Mock data for demonstration - replace with actual API call
            const mockRoles = [
                {
                    id: '1',
                    roleName: 'Admin',
                    description: 'Full system administrator access',
                    permissions: [
                        'read',
                        'write',
                        'delete',
                        'admin',
                        'manage_users',
                        'manage_roles',
                    ],
                    category: 'system',
                    status: 'active',
                    createdDate: '2024-01-15',
                    lastModified: '2024-01-15T10:30:00Z',
                    assignedUsers: 5,
                },
                {
                    id: '2',
                    roleName: 'Editor',
                    description: 'Content editing and management',
                    permissions: ['read', 'write', 'view_reports'],
                    category: 'business',
                    status: 'active',
                    createdDate: '2024-01-20',
                    lastModified: '2024-01-20T14:15:00Z',
                    assignedUsers: 12,
                },
                {
                    id: '3',
                    roleName: 'Viewer',
                    description: 'Read-only access to content',
                    permissions: ['read'],
                    category: 'user',
                    status: 'active',
                    createdDate: '2024-01-25',
                    lastModified: '2024-01-25T09:00:00Z',
                    assignedUsers: 25,
                },
                {
                    id: '4',
                    roleName: 'Manager',
                    description: 'Team management and reporting',
                    permissions: [
                        'read',
                        'write',
                        'manage_users',
                        'view_reports',
                    ],
                    category: 'business',
                    status: 'active',
                    createdDate: '2024-02-01',
                    lastModified: '2024-02-01T16:45:00Z',
                    assignedUsers: 8,
                },
                {
                    id: '5',
                    roleName: 'Developer',
                    description: 'Development and system configuration',
                    permissions: [
                        'read',
                        'write',
                        'system_config',
                        'export_data',
                    ],
                    category: 'system',
                    status: 'draft',
                    createdDate: '2024-02-05',
                    lastModified: '2024-02-05T11:20:00Z',
                    assignedUsers: 0,
                },
            ];

            // Ensure all roles start with unconfigured scope
            const rolesWithScope = mockRoles.map((role) => ({
                ...role,
                scope: {
                    configured: false, // Explicitly set as not configured
                    permissions: {},
                },
            }));

            setTableData(rolesWithScope);
        } catch (error) {
            console.error('Error loading roles:', error);
        } finally {
            setLoading(false);
        }
    };

    // Handler functions for action buttons
    const handleSort = (column: string) => {
        setSortConfig((prev) => {
            if (prev?.column === column) {
                return {
                    column,
                    direction: prev.direction === 'asc' ? 'desc' : 'asc',
                };
            }
            return {column, direction: 'asc'};
        });
        setSortVisible(false);
    };

    const handleFilter = (column: string, value: any) => {
        setActiveFilters((prev) => ({
            ...prev,
            [column]: value,
        }));
    };

    const clearFilters = () => {
        setActiveFilters({});
    };

    const toggleColumnVisibility = (columnId: string) => {
        setHiddenColumns((prev) => {
            if (prev.includes(columnId)) {
                return prev.filter((id) => id !== columnId);
            } else {
                return [...prev, columnId];
            }
        });
    };

    const handleGroupByAction = (groupByColumn: string) => {
        setSelectedGroupBy((prev) =>
            prev === groupByColumn ? '' : groupByColumn,
        );
    };

    // Process data with filters and sorting
    const processedTableData = useMemo(() => {
        let processed = [...tableData];

        // Apply filters
        Object.entries(activeFilters).forEach(([column, value]) => {
            if (value) {
                processed = processed.filter((row) => {
                    const cellValue = row[column as keyof Role];
                    if (typeof cellValue === 'string') {
                        return cellValue
                            .toLowerCase()
                            .includes(value.toLowerCase());
                    }
                    return cellValue === value;
                });
            }
        });

        // Apply sorting
        if (sortConfig) {
            processed.sort((a, b) => {
                const aVal = a[sortConfig.column as keyof Role];
                const bVal = b[sortConfig.column as keyof Role];

                if (!aVal && !bVal) return 0;
                if (!aVal) return 1;
                if (!bVal) return -1;

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return processed;
    }, [tableData, activeFilters, sortConfig]);

    // Handle role creation
    const handleCreateRole = () => {
        // Create a new blank row with unique ID
        const newRole: Role = {
            id: `new-${Date.now()}`, // Temporary ID for new rows
            roleName: '',
            description: '',
            permissions: [],
            category: 'custom',
            status: 'active',
            assignedUsers: 0,
            scope: {
                configured: false,
                permissions: {},
            },
            createdDate: new Date().toISOString().split('T')[0],
            lastModified: new Date().toISOString(),
            isNew: true, // Flag to identify new rows
        };

        // Add the new row at the top of the table
        setTableData((prevData) => [newRole, ...prevData]);
        console.log('✅ Added new blank role row at top of table');
    };

    // Toggle search visibility
    const toggleSearch = () => {
        setSearchVisible(!searchVisible);
        if (!searchVisible) {
            setFilterVisible(false);
            setGroupByVisible(false);
        }
    };

    // Toggle filter visibility
    const toggleFilter = () => {
        setFilterVisible(!filterVisible);
        if (!filterVisible) {
            setSearchVisible(false);
            setGroupByVisible(false);
        }
    };

    // Toggle group by visibility
    const toggleGroupBy = () => {
        setGroupByVisible(!groupByVisible);
        if (!groupByVisible) {
            setSearchVisible(false);
            setFilterVisible(false);
        }
    };

    // Handle role actions
    const handleRoleAction = (
        action: string,
        roleId: string,
        roleData: Role | null = null,
    ) => {
        console.log('Role action:', action, roleId, roleData);
        switch (action) {
            case 'save':
                // Handle saving new or edited roles
                if (roleData?.isNew) {
                    // Generate a real ID for the new role
                    const savedRole = {
                        ...roleData,
                        id: `role-${Date.now()}`,
                        isNew: false,
                        lastModified: new Date().toISOString(),
                    };

                    setTableData((prev) =>
                        prev.map((role) =>
                            role.id === roleId ? savedRole : role,
                        ),
                    );
                    console.log('✅ Saved new role:', savedRole);
                } else {
                    // Update existing role
                    setTableData((prev) =>
                        prev.map((role) =>
                            role.id === roleId && roleData
                                ? ({
                                      ...roleData,
                                      lastModified: new Date().toISOString(),
                                  } as Role)
                                : role,
                        ),
                    );
                    console.log('✅ Updated existing role:', roleData);
                }
                break;
            case 'cancel':
                // Cancel editing new row
                if (roleData?.isNew) {
                    setTableData((prev) =>
                        prev.filter((role) => role.id !== roleId),
                    );
                    console.log('✅ Cancelled new role creation');
                }
                break;
            case 'edit':
                console.log('Edit role:', roleId);
                // Implement edit logic
                break;
            case 'duplicate':
                console.log('Duplicate role:', roleId);
                // Duplicate role
                const currentRole = tableData.find(
                    (role) => role.id === roleId,
                );
                if (currentRole) {
                    const duplicatedRole = {
                        ...currentRole,
                        id: `new-${Date.now()}`,
                        roleName: `${currentRole.roleName} (Copy)`,
                        isNew: true,
                        createdDate: new Date().toISOString().split('T')[0],
                        lastModified: new Date().toISOString(),
                    };
                    setTableData((prev) => [duplicatedRole, ...prev]);
                    console.log('✅ Duplicated role:', duplicatedRole);
                }
                break;
            case 'delete':
                console.log('Delete role:', roleId);
                // Implement delete logic
                setTableData((prev) =>
                    prev.filter((role) => role.id !== roleId),
                );
                console.log('✅ Deleted role:', roleId);
                break;
            default:
                console.log('Unknown action:', action);
        }
    };

    const handleConfigureScope = (roleData: Role) => {
        console.log('Configure scope for role:', roleData);
        setSelectedRole(roleData);
        setShowScopeModal(true);
    };

    const handleSaveScope = (scopeConfig: any) => {
        console.log('Save scope config:', scopeConfig);
        if (selectedRole) {
            setTableData((prevData) =>
                prevData.map((role) =>
                    role.id === selectedRole.id
                        ? {
                              ...role,
                              scope: {
                                  ...scopeConfig,
                                  configured: true, // Mark as configured after Apply Changes
                                  configuredAt: new Date().toISOString(), // Timestamp for tracking
                              },
                          }
                        : role,
                ),
            );
        }
        setShowScopeModal(false);
        setSelectedRole(null);
    };

    const handleAssignUserGroups = (roleData: Role) => {
        console.log('Assign user groups for role:', roleData);
        // This could open a user group assignment modal
        // For now, we'll simulate assigning groups
        setTableData((prevData) =>
            prevData.map((role) =>
                role.id === roleData.id
                    ? {
                          ...role,
                          assignedGroups: role.assignedGroups?.length
                              ? role.assignedGroups
                              : [{id: '1', name: 'Admin Group'}],
                      }
                    : role,
            ),
        );
    };

    // Enhanced Column Header Renderer with Icons
    const renderColumnHeader = (column: any) => {
        const getColumnIcon = (columnId: string) => {
            const icons = {
                roleName: (
                    <svg
                        width='14'
                        height='14'
                        viewBox='0 0 24 24'
                        fill='none'
                        className='cell-icon'
                    >
                        <path
                            d='M12 15L8 11H16L12 15Z'
                            stroke='currentColor'
                            strokeWidth='2'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                        />
                        <path
                            d='M2.5 16.88C2.5 16.88 4 15 8 15S13.5 16.88 13.5 16.88'
                            stroke='currentColor'
                            strokeWidth='2'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                        />
                        <circle
                            cx='8'
                            cy='6'
                            r='4'
                            stroke='currentColor'
                            strokeWidth='2'
                        />
                        <circle
                            cx='18'
                            cy='8'
                            r='3'
                            stroke='currentColor'
                            strokeWidth='2'
                        />
                    </svg>
                ),
                description: (
                    <svg
                        width='14'
                        height='14'
                        viewBox='0 0 24 24'
                        fill='none'
                        className='cell-icon'
                    >
                        <path
                            d='M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z'
                            stroke='currentColor'
                            strokeWidth='2'
                        />
                        <polyline
                            points='14,2 14,8 20,8'
                            stroke='currentColor'
                            strokeWidth='2'
                        />
                        <line
                            x1='16'
                            y1='13'
                            x2='8'
                            y2='13'
                            stroke='currentColor'
                            strokeWidth='2'
                        />
                        <line
                            x1='16'
                            y1='17'
                            x2='8'
                            y2='17'
                            stroke='currentColor'
                            strokeWidth='2'
                        />
                    </svg>
                ),
                scope: (
                    <svg
                        width='14'
                        height='14'
                        viewBox='0 0 24 24'
                        fill='none'
                        className='cell-icon'
                    >
                        <circle
                            cx='12'
                            cy='12'
                            r='10'
                            stroke='currentColor'
                            strokeWidth='2'
                        />
                        <circle
                            cx='12'
                            cy='12'
                            r='6'
                            stroke='currentColor'
                            strokeWidth='2'
                        />
                        <circle
                            cx='12'
                            cy='12'
                            r='2'
                            stroke='currentColor'
                            strokeWidth='2'
                        />
                    </svg>
                ),
                assignedUserGroups: (
                    <svg
                        width='14'
                        height='14'
                        viewBox='0 0 24 24'
                        fill='none'
                        className='cell-icon'
                    >
                        <path
                            d='M16 21V19C16 16.7909 14.2091 15 12 15C9.79086 15 8 16.7909 8 19V21'
                            stroke='currentColor'
                            strokeWidth='2'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                        />
                        <circle
                            cx='12'
                            cy='7'
                            r='4'
                            stroke='currentColor'
                            strokeWidth='2'
                        />
                        <path
                            d='M6 21V19C6 18.1645 6.2845 17.3694 6.7906 16.7338C7.2967 16.0982 8.0014 15.6577 8.8 15.4773'
                            stroke='currentColor'
                            strokeWidth='2'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                        />
                        <circle
                            cx='20'
                            cy='8'
                            r='2'
                            stroke='currentColor'
                            strokeWidth='2'
                        />
                        <path
                            d='M20 15C20.7956 15.1851 21.4743 15.6429 22 16.2857'
                            stroke='currentColor'
                            strokeWidth='2'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                        />
                    </svg>
                ),
            };
            return icons[columnId as keyof typeof icons] || null;
        };

        const icon = getColumnIcon(column.id);

        return (
            <div className='flex items-center gap-1'>
                {icon}
                <span>{column.title}</span>
            </div>
        );
    };

    return (
        <div className='h-full bg-white'>
            {/* Header Section */}
            <div className='border-b border-gray-200 bg-white px-6 py-4'>
                <div className='flex items-center justify-between'>
                    <div>
                        <h1 className='text-2xl font-bold text-gray-900'>
                            Manage Roles
                        </h1>
                        <p className='mt-1 text-sm text-gray-500'>
                            Create, edit, and manage system roles and
                            permissions
                        </p>
                    </div>
                </div>
            </div>

            {/* Action Bar */}
            <div className='border-b border-gray-200 bg-gray-50 px-6 py-4'>
                <div className='flex items-center gap-4'>
                    {/* Create button */}
                    <button
                        onClick={handleCreateRole}
                        className='inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200'
                    >
                        <svg
                            width='16'
                            height='16'
                            viewBox='0 0 24 24'
                            fill='none'
                        >
                            <path
                                d='M12 5V19M5 12H19'
                                stroke='currentColor'
                                strokeWidth='2'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                            />
                        </svg>
                        Create New Role
                    </button>

                    {/* Left-aligned Action Buttons immediately after Create button */}
                    <div className='flex items-center gap-3'>
                        {/* Collapsible Search */}
                        <div
                            className={`flex items-center transition-all duration-300 ${
                                searchVisible ? 'w-80' : 'w-auto'
                            }`}
                        >
                            {searchVisible && (
                                <input
                                    type='text'
                                    placeholder='Search roles...'
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    className='w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 mr-2'
                                    autoFocus
                                />
                            )}
                            <button
                                onClick={toggleSearch}
                                className={`group relative flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-medium transition-all duration-300 transform hover:scale-105 ${
                                    searchVisible
                                        ? 'border-blue-300 bg-blue-50 text-blue-600 shadow-blue-200 shadow-lg'
                                        : 'border-gray-200 bg-white text-gray-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 hover:shadow-lg'
                                }`}
                            >
                                <svg
                                    className={`w-4 h-4 transition-transform duration-300 ${
                                        searchVisible
                                            ? 'rotate-90'
                                            : 'group-hover:scale-110'
                                    }`}
                                    fill='none'
                                    viewBox='0 0 24 24'
                                    stroke='currentColor'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                                    />
                                </svg>
                                <span className='text-sm'>Search</span>
                                {searchVisible && (
                                    <div className='absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-blue-500 rounded-full animate-pulse'></div>
                                )}
                            </button>
                        </div>

                        {/* Filter Button */}
                        <button
                            onClick={() => setFilterVisible(!filterVisible)}
                            className={`group relative flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-medium transition-all duration-300 transform hover:scale-105 ${
                                Object.keys(activeFilters).length > 0
                                    ? 'border-purple-300 bg-purple-50 text-purple-600 shadow-purple-200 shadow-lg'
                                    : 'border-gray-200 bg-white text-gray-600 hover:border-purple-200 hover:bg-purple-50 hover:text-purple-600 hover:shadow-lg'
                            }`}
                        >
                            <svg
                                className='w-4 h-4 transition-transform duration-300 group-hover:scale-110'
                                fill='none'
                                viewBox='0 0 24 24'
                                stroke='currentColor'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z'
                                />
                            </svg>
                            <span className='text-sm'>Filter</span>
                            {Object.keys(activeFilters).length > 0 && (
                                <div className='absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full animate-bounce'></div>
                            )}
                            <div className='absolute inset-0 rounded-lg bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 group-hover:opacity-10 transition-opacity duration-300 -z-10'></div>
                        </button>

                        {/* Sort Button */}
                        <button
                            onClick={() => handleSort('roleName')}
                            className={`group relative flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-medium transition-all duration-300 transform hover:scale-105 ${
                                sortConfig
                                    ? 'border-green-300 bg-green-50 text-green-600 shadow-green-200 shadow-lg'
                                    : 'border-gray-200 bg-white text-gray-600 hover:border-green-200 hover:bg-green-50 hover:text-green-600 hover:shadow-lg'
                            }`}
                        >
                            <svg
                                className='w-4 h-4 transition-transform duration-300 group-hover:rotate-180'
                                fill='none'
                                viewBox='0 0 24 24'
                                stroke='currentColor'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12'
                                />
                            </svg>
                            <span className='text-sm'>
                                Sort {sortConfig && `(${sortConfig.direction})`}
                            </span>
                            {sortConfig && (
                                <div className='absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-bounce'></div>
                            )}
                            <div className='absolute inset-0 rounded-lg bg-gradient-to-r from-green-400 to-blue-400 opacity-0 group-hover:opacity-10 transition-opacity duration-300 -z-10'></div>
                        </button>

                        {/* Group By */}
                        <div className='relative'>
                            <button
                                onClick={() => handleGroupByAction('category')}
                                className={`group relative flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-medium transition-all duration-300 transform hover:scale-105 ${
                                    groupByVisible || selectedGroupBy
                                        ? 'border-orange-300 bg-orange-50 text-orange-600 shadow-orange-200 shadow-lg'
                                        : 'border-gray-200 bg-white text-gray-600 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 hover:shadow-lg'
                                }`}
                            >
                                <svg
                                    className={`w-4 h-4 transition-transform duration-300 ${
                                        groupByVisible || selectedGroupBy
                                            ? 'rotate-45'
                                            : 'group-hover:scale-110'
                                    }`}
                                    fill='none'
                                    viewBox='0 0 24 24'
                                    stroke='currentColor'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M19 11H5m14-7H5m14 14H5'
                                    />
                                </svg>
                                <span className='text-sm'>Group by</span>
                                {selectedGroupBy && (
                                    <div className='absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-bounce'></div>
                                )}
                                <div className='absolute inset-0 rounded-lg bg-gradient-to-r from-orange-400 to-red-400 opacity-0 group-hover:opacity-10 transition-opacity duration-300 -z-10'></div>
                            </button>

                            {groupByVisible && (
                                <div className='absolute right-0 top-12 w-48 rounded-lg bg-white shadow-lg border border-gray-200 py-2 z-10'>
                                    <div className='px-3 py-2 text-xs font-semibold text-gray-500 uppercase'>
                                        Group By
                                    </div>
                                    {ManageRoles_tableConfig.grouping.options.map(
                                        (option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => {
                                                    setSelectedGroupBy(
                                                        selectedGroupBy ===
                                                            option.value
                                                            ? ''
                                                            : option.value,
                                                    );
                                                    setGroupByVisible(false);
                                                }}
                                                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                                                    selectedGroupBy ===
                                                    option.value
                                                        ? 'bg-blue-50 text-blue-600'
                                                        : 'text-gray-700'
                                                }`}
                                            >
                                                {option.label}
                                            </button>
                                        ),
                                    )}
                                    {selectedGroupBy && (
                                        <>
                                            <hr className='my-2' />
                                            <button
                                                onClick={() => {
                                                    setSelectedGroupBy('');
                                                    setGroupByVisible(false);
                                                }}
                                                className='w-full text-left px-3 py-2 text-sm text-gray-500 hover:bg-gray-50'
                                            >
                                                Clear Grouping
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Hide/Show Columns */}
                        <button
                            className='p-2 rounded-lg bg-white text-gray-600 hover:bg-gray-100 transition-all duration-200'
                            title='Hide/Show Columns'
                        >
                            <svg
                                width='18'
                                height='18'
                                viewBox='0 0 24 24'
                                fill='none'
                            >
                                <path
                                    d='M1 3H23V5H1V3ZM1 19H23V21H1V19ZM1 11H23V13H1V11Z'
                                    fill='currentColor'
                                />
                                <circle
                                    cx='18'
                                    cy='12'
                                    r='2'
                                    fill='currentColor'
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className='flex-1 p-6 max-w-[calc(100vw-450px)] overflow-x-auto'>
                <div className='w-full max-w-full'>
                    <ReusableTableComponent
                        // @ts-ignore - Complex table configuration type
                        config={{
                            ...ManageRoles_tableConfig,
                            initialData: processedTableData,
                            customHeaderRenderer: renderColumnHeader,
                            customRenderers: {
                                scopeConfig: (value: any, rowData: Role) => (
                                    <ScopeCell
                                        roleData={rowData}
                                        onConfigureScope={handleConfigureScope}
                                    />
                                ),
                                animatedUserGroup: (
                                    value: any,
                                    rowData: Role,
                                ) => (
                                    <AnimatedUserGroupIcon
                                        roleData={rowData}
                                        onAssignGroups={handleAssignUserGroups}
                                        hasGroups={
                                            (rowData.assignedGroups?.length ??
                                                0) > 0
                                        }
                                    />
                                ),
                            },
                            onAction: handleRoleAction,
                            loading: loading,
                            searchTerm: searchTerm,
                            groupBy: selectedGroupBy,
                        }}
                    />
                </div>
            </div>

            {/* Scope Configuration Modal */}
            {showScopeModal && selectedRole && (
                <ScopeConfigModal
                    isOpen={showScopeModal}
                    onClose={() => {
                        setShowScopeModal(false);
                        setSelectedRole(null);
                    }}
                    roleName={selectedRole.roleName || ''}
                    roleDescription={selectedRole.description || ''}
                    currentScope={selectedRole.scope}
                    onSave={handleSaveScope}
                />
            )}
        </div>
    );
}
