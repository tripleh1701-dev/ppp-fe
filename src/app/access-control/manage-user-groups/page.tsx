'use client';

import React, {useState, useEffect, useCallback, useMemo, useRef} from 'react';
import ReusableTableComponent from '@/components/reusable/ReusableTableComponent';
import ManageUserGroups_tableConfig from '@/config/ManageUserGroups_tableConfig';
import RolesCountCell from '@/components/RolesCountCell';

// Define types for better TypeScript support
interface UserGroup {
    id: string;
    groupName: string;
    description: string;
    entity: string;
    service: string;
    roles: string[];
    status: string;
    createdDate: string;
    lastModified: string;
    memberCount: number;
    isNew?: boolean;
}

interface DropdownOption {
    value: string;
    label: string;
    id?: string;
}

export default function ManageUserGroups() {
    // State management
    const [tableData, setTableData] = useState<UserGroup[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchVisible, setSearchVisible] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedGroupBy, setSelectedGroupBy] = useState('');

    // State for action buttons
    const [filterVisible, setFilterVisible] = useState(false);
    const [sortVisible, setSortVisible] = useState(false);
    const [groupByVisible, setGroupByVisible] = useState(false);
    const [hideColumnsVisible, setHideColumnsVisible] = useState(false);

    // Refs for dialog containers to detect outside clicks
    const filterRef = useRef<HTMLDivElement>(null);
    const sortRef = useRef<HTMLDivElement>(null);
    const groupByRef = useRef<HTMLDivElement>(null);
    const hideColumnsRef = useRef<HTMLDivElement>(null);

    // State for sorting, filtering, and column visibility
    const [sortConfig, setSortConfig] = useState<{
        column: string;
        direction: 'asc' | 'desc';
    } | null>(null);
    const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
    const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);

    // State for dropdown options
    const [entities, setEntities] = useState<DropdownOption[]>([]);
    const [services, setServices] = useState<DropdownOption[]>([]);
    const [entitiesLoading, setEntitiesLoading] = useState(false);
    const [servicesLoading, setServicesLoading] = useState(false);

    // Fetch entities from backend API
    const fetchEntities = useCallback(async () => {
        console.log('🚀 Starting to fetch entities from API...');
        setEntitiesLoading(true);
        try {
            const response = await fetch(
                'http://localhost:4000/api/business-units/entities?accountId=1&enterpriseId=1',
            );
            console.log('📡 Entities API response status:', response.status);
            if (response.ok) {
                const data = await response.json();
                console.log('📦 Entities fetched from API:', data);

                // Transform entities data to dropdown options format
                const entityOptions = data.map((entity: any) => {
                    // Handle both string arrays and object arrays
                    if (typeof entity === 'string') {
                        return {
                            value: entity,
                            label: entity,
                            id: entity,
                        };
                    } else {
                        return {
                            value:
                                entity.name || entity.entityName || entity.id,
                            label:
                                entity.name || entity.entityName || entity.id,
                            id: entity.id,
                        };
                    }
                });

                console.log('✅ Setting entities state with:', entityOptions);
                setEntities(entityOptions);
            } else {
                console.warn(
                    '⚠️ Entities API returned non-OK status:',
                    response.status,
                );
                // Fallback to default entities
                setEntities([
                    {value: 'Finance', label: 'Finance'},
                    {value: 'HR', label: 'HR'},
                    {value: 'IT Operations', label: 'IT Operations'},
                    {value: 'Sales', label: 'Sales'},
                    {value: 'Marketing', label: 'Marketing'},
                    {value: 'Engineering', label: 'Engineering'},
                ]);
            }
        } catch (error) {
            console.error('❌ Error fetching entities:', error);
            // Fallback to default entities
            setEntities([
                {value: 'Finance', label: 'Finance'},
                {value: 'HR', label: 'HR'},
                {value: 'IT Operations', label: 'IT Operations'},
                {value: 'Sales', label: 'Sales'},
                {value: 'Marketing', label: 'Marketing'},
                {value: 'Engineering', label: 'Engineering'},
            ]);
        } finally {
            setEntitiesLoading(false);
        }
    }, []);

    // Fetch services from backend API
    const fetchServices = useCallback(async () => {
        console.log('🚀 Starting to fetch services from API...');
        setServicesLoading(true);
        try {
            const response = await fetch('http://localhost:4000/api/services');
            console.log('📡 Services API response status:', response.status);
            if (response.ok) {
                const data = await response.json();
                console.log('📦 Services fetched from API:', data);

                // Transform services data to dropdown options format
                const serviceOptions = data.map((service: any) => {
                    // Handle both string arrays and object arrays
                    if (typeof service === 'string') {
                        return {
                            value: service,
                            label: service,
                            id: service,
                        };
                    } else {
                        return {
                            value:
                                service.name ||
                                service.serviceName ||
                                service.id,
                            label:
                                service.name ||
                                service.serviceName ||
                                service.id,
                            id: service.id,
                        };
                    }
                });

                console.log('✅ Setting services state with:', serviceOptions);
                setServices(serviceOptions);
            } else {
                console.warn(
                    '⚠️ Services API returned non-OK status:',
                    response.status,
                );
                // Fallback to default services
                setServices([
                    {value: 'Budget Management', label: 'Budget Management'},
                    {value: 'Employee Relations', label: 'Employee Relations'},
                    {value: 'Infrastructure', label: 'Infrastructure'},
                    {
                        value: 'Strategy Management',
                        label: 'Strategy Management',
                    },
                    {value: 'Communications', label: 'Communications'},
                    {value: 'Quality Control', label: 'Quality Control'},
                ]);
            }
        } catch (error) {
            console.error('❌ Error fetching services:', error);
            // Fallback to default services
            setServices([
                {value: 'Budget Management', label: 'Budget Management'},
                {value: 'Employee Relations', label: 'Employee Relations'},
                {value: 'Infrastructure', label: 'Infrastructure'},
                {value: 'Strategy Management', label: 'Strategy Management'},
                {value: 'Communications', label: 'Communications'},
                {value: 'Quality Control', label: 'Quality Control'},
            ]);
        } finally {
            setServicesLoading(false);
        }
    }, []);

    // Load user groups data
    const loadUserGroups = useCallback(async () => {
        setLoading(true);
        try {
            // Mock data for demonstration - replace with actual API call
            const mockUserGroups = [
                {
                    id: '1',
                    groupName: 'Finance Team',
                    description:
                        'Finance department users with budget management access',
                    entity: 'Finance',
                    service: 'Budget Management',
                    roles: ['Financial Analyst', 'Budget Manager'],
                    status: 'active',
                    createdDate: '2024-01-15',
                    lastModified: '2024-01-20T14:30:00Z',
                    memberCount: 12,
                },
                {
                    id: '2',
                    groupName: 'HR Administrators',
                    description:
                        'Human Resources management and employee relations',
                    entity: 'HR',
                    service: 'Employee Relations',
                    roles: ['HR Manager', 'Recruiter'],
                    status: 'active',
                    createdDate: '2024-01-16',
                    lastModified: '2024-01-22T11:15:00Z',
                    memberCount: 8,
                },
                {
                    id: '3',
                    groupName: 'IT Support',
                    description:
                        'Technical support team for infrastructure maintenance',
                    entity: 'IT Operations',
                    service: 'Infrastructure',
                    roles: [
                        'System Administrator',
                        'Network Engineer',
                        'Support Specialist',
                    ],
                    status: 'active',
                    createdDate: '2024-01-17',
                    lastModified: '2024-01-23T16:45:00Z',
                    memberCount: 15,
                },
                {
                    id: '4',
                    groupName: 'Sales Directors',
                    description: 'Sales leadership and strategy management',
                    entity: 'Sales',
                    service: 'Strategy Management',
                    roles: ['Sales Director'],
                    status: 'inactive',
                    createdDate: '2024-01-18',
                    lastModified: '2024-01-24T12:00:00Z',
                    memberCount: 5,
                },
                {
                    id: '5',
                    groupName: 'Marketing Team',
                    description: 'Marketing and communications specialists',
                    entity: 'Marketing',
                    service: 'Communications',
                    roles: ['Marketing Manager', 'Content Specialist'],
                    status: 'active',
                    createdDate: '2024-01-19',
                    lastModified: '2024-01-25T09:30:00Z',
                    memberCount: 7,
                },
                {
                    id: '6',
                    groupName: 'Quality Assurance',
                    description: 'Software testing and quality control',
                    entity: 'Engineering',
                    service: 'Quality Control',
                    roles: ['QA Engineer', 'Test Manager'],
                    status: 'active',
                    createdDate: '2024-01-20',
                    lastModified: '2024-01-26T15:30:00Z',
                    memberCount: 10,
                },
            ];

            setTableData(mockUserGroups);
        } catch (error) {
            console.error('Error loading user groups:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUserGroups();
        fetchEntities();
        fetchServices();
    }, [loadUserGroups, fetchEntities, fetchServices]);

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
                    const cellValue = row[column as keyof UserGroup];
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
                const aVal = a[sortConfig.column as keyof UserGroup];
                const bVal = b[sortConfig.column as keyof UserGroup];

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

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;

            // Check if click is outside filter dialog
            if (
                filterVisible &&
                filterRef.current &&
                !filterRef.current.contains(target)
            ) {
                setFilterVisible(false);
            }

            // Check if click is outside sort dialog
            if (
                sortVisible &&
                sortRef.current &&
                !sortRef.current.contains(target)
            ) {
                setSortVisible(false);
            }

            // Check if click is outside group by dialog
            if (
                groupByVisible &&
                groupByRef.current &&
                !groupByRef.current.contains(target)
            ) {
                setGroupByVisible(false);
            }

            // Check if click is outside hide columns dialog
            if (
                hideColumnsVisible &&
                hideColumnsRef.current &&
                !hideColumnsRef.current.contains(target)
            ) {
                setHideColumnsVisible(false);
            }
        };

        // Add event listener when any dialog is open
        if (
            filterVisible ||
            sortVisible ||
            groupByVisible ||
            hideColumnsVisible
        ) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        // Cleanup event listener
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [filterVisible, sortVisible, groupByVisible, hideColumnsVisible]);

    // Handle user group creation
    const handleCreateUserGroup = () => {
        // Create a new blank row with unique ID
        const newUserGroup = {
            id: `new-${Date.now()}`, // Temporary ID for new rows
            groupName: '',
            description: '',
            entity: '',
            service: '',
            roles: [],
            status: 'active',
            createdDate: new Date().toISOString().split('T')[0],
            lastModified: new Date().toISOString(),
            memberCount: 0,
            isNew: true, // Flag to identify new rows
        };

        // Add the new row at the top of the table
        setTableData((prevData) => [newUserGroup, ...prevData]);
        console.log('✅ Added new blank row at top of table');
    };

    // Handle role management for a user group
    const handleManageRoles = (groupData: UserGroup) => {
        console.log('Manage roles for group:', groupData);
        // This could open a roles assignment modal or navigate to a roles page
    };

    // Use the base configuration - API integration is handled by ReusableTableComponent
    const dynamicTableConfig = useMemo(() => {
        console.log('📋 Using base table configuration with API integration');
        return ManageUserGroups_tableConfig;
    }, []);

    // Handle user group actions
    const handleGroupAction = (
        action: string,
        groupId: string,
        groupData: UserGroup,
    ) => {
        console.log('Group action:', action, groupId, groupData);
        switch (action) {
            case 'save':
                // Handle saving new or edited groups
                if (groupData.isNew) {
                    // Generate a real ID for the new group
                    const savedGroup = {
                        ...groupData,
                        id: `group-${Date.now()}`,
                        isNew: false,
                        lastModified: new Date().toISOString(),
                    };

                    setTableData((prev) =>
                        prev.map((group) =>
                            group.id === groupId ? savedGroup : group,
                        ),
                    );
                    console.log('✅ Saved new group:', savedGroup);
                } else {
                    // Update existing group
                    setTableData((prev) =>
                        prev.map((group) =>
                            group.id === groupId
                                ? {
                                      ...groupData,
                                      lastModified: new Date().toISOString(),
                                  }
                                : group,
                        ),
                    );
                    console.log('✅ Updated existing group:', groupData);
                }
                break;
            case 'edit':
                // Open edit modal
                console.log('Edit group:', groupId);
                break;
            case 'duplicate':
                // Duplicate group
                const duplicatedGroup = {
                    ...groupData,
                    id: `new-${Date.now()}`,
                    groupName: `${groupData.groupName} (Copy)`,
                    isNew: true,
                    createdDate: new Date().toISOString().split('T')[0],
                    lastModified: new Date().toISOString(),
                };
                setTableData((prev) => [duplicatedGroup, ...prev]);
                console.log('✅ Duplicated group:', duplicatedGroup);
                break;
            case 'delete':
                // Implement delete logic
                setTableData((prev) =>
                    prev.filter((group) => group.id !== groupId),
                );
                console.log('✅ Deleted group:', groupId);
                break;
            case 'cancel':
                // Cancel editing new row
                if (groupData.isNew) {
                    setTableData((prev) =>
                        prev.filter((group) => group.id !== groupId),
                    );
                    console.log('✅ Cancelled new group creation');
                }
                break;
            default:
                console.log('Unknown action:', action);
        }
    };

    // Toggle search visibility
    const toggleSearch = () => {
        setSearchVisible(!searchVisible);
        if (searchVisible) {
            setSearchTerm('');
        }
    };

    // Handle group by selection
    const handleGroupByChange = (groupBy: string) => {
        setSelectedGroupBy(groupBy);
    };

    // Enhanced Column Header Renderer with Icons
    const renderColumnHeader = (column: any) => {
        const getColumnIcon = (columnId: string) => {
            const icons = {
                groupName: (
                    <svg
                        width='12'
                        height='12'
                        viewBox='0 0 24 24'
                        fill='none'
                        className='cell-icon'
                    >
                        {/* Users/Group icon */}
                        <path
                            d='M17 21V19C17 15.1340 14.8660 12 11 12C7.13401 12 5 15.1340 5 19V21'
                            stroke='#4ba3ff'
                            strokeWidth='1.8'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                        />
                        <circle
                            cx='11'
                            cy='7'
                            r='4'
                            stroke='#4ba3ff'
                            strokeWidth='1.8'
                        />
                        <path
                            d='M22 21V19C22 15.1340 19.8660 12 16 12C17.5 12 19 13.5 19 15.5'
                            stroke='#4ba3ff'
                            strokeWidth='1.8'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                        />
                    </svg>
                ),
                description: (
                    <svg
                        width='12'
                        height='12'
                        viewBox='0 0 24 24'
                        fill='none'
                        className='cell-icon'
                    >
                        {/* Text/Description icon */}
                        <path
                            d='M4 7H20'
                            stroke='#4ba3ff'
                            strokeWidth='1.8'
                            strokeLinecap='round'
                        />
                        <path
                            d='M4 12H16'
                            stroke='#4ba3ff'
                            strokeWidth='1.8'
                            strokeLinecap='round'
                        />
                        <path
                            d='M4 17H12'
                            stroke='#4ba3ff'
                            strokeWidth='1.8'
                            strokeLinecap='round'
                        />
                    </svg>
                ),
                entity: (
                    <svg
                        width='12'
                        height='12'
                        viewBox='0 0 24 24'
                        fill='none'
                        className='cell-icon'
                    >
                        {/* Building/Organization icon */}
                        <path
                            d='M3 21H21M5 21V7L12 3L19 7V21'
                            stroke='#4ba3ff'
                            strokeWidth='1.8'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                        />
                        <path
                            d='M9 9H11M9 12H11M9 15H11M13 9H15M13 12H15M13 15H15'
                            stroke='#4ba3ff'
                            strokeWidth='1.8'
                            strokeLinecap='round'
                        />
                    </svg>
                ),
                service: (
                    <svg
                        width='12'
                        height='12'
                        viewBox='0 0 24 24'
                        fill='none'
                        className='cell-icon'
                    >
                        {/* Gear/Settings icon */}
                        <circle
                            cx='12'
                            cy='12'
                            r='3'
                            stroke='#4ba3ff'
                            strokeWidth='1.8'
                        />
                        <path
                            d='M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22'
                            stroke='#4ba3ff'
                            strokeWidth='1.8'
                            strokeLinecap='round'
                        />
                    </svg>
                ),
                roles: (
                    <svg
                        width='12'
                        height='12'
                        viewBox='0 0 24 24'
                        fill='none'
                        className='cell-icon'
                    >
                        {/* Compact Document/Roles icon */}
                        <path
                            d='M4 4H16L20 8V20C20 20.5304 19.7893 21.0391 19.4142 21.4142C19.0391 21.7893 18.5304 22 18 22H6C5.46957 22 4.96086 21.7893 4.58579 21.4142C4.21071 21.0391 4 20.5304 4 20V4Z'
                            stroke='#4ba3ff'
                            strokeWidth='2'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                        />
                        <path
                            d='M8 12H12M8 16H16'
                            stroke='#4ba3ff'
                            strokeWidth='2'
                            strokeLinecap='round'
                        />
                        <circle
                            cx='16'
                            cy='18'
                            r='2'
                            stroke='#4ba3ff'
                            strokeWidth='1.8'
                        />
                    </svg>
                ),
            };

            return icons[columnId as keyof typeof icons] || null;
        };

        if (column.id === 'checkbox') {
            return null; // No icon for checkbox column
        }

        return (
            <div className='header-content modern-header'>
                <div className='header-text-with-icon'>
                    {getColumnIcon(column.id)}
                    <span>{column.title}</span>
                </div>
            </div>
        );
    };

    return (
        <div className='min-h-screen bg-gray-50'>
            {/* Page Header */}
            <div className='bg-white border-b border-gray-200'>
                <div className='px-6 py-4'>
                    <div>
                        <h1 className='text-2xl font-bold text-gray-900'>
                            Manage User Groups
                        </h1>
                        <p className='mt-1 text-sm text-gray-500'>
                            Create, edit, and manage user groups and their role
                            assignments
                        </p>
                    </div>
                </div>
            </div>

            {/* Actions Bar */}
            <div className='bg-white border-b border-gray-200'>
                <div className='px-6 py-4'>
                    <div className='flex items-center space-x-4'>
                        {/* Create button */}
                        <button
                            onClick={handleCreateUserGroup}
                            className='inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                        >
                            <svg
                                className='w-4 h-4 mr-2'
                                fill='none'
                                viewBox='0 0 24 24'
                                stroke='currentColor'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M12 4v16m8-8H4'
                                />
                            </svg>
                            Create New User Group
                        </button>

                        {/* Search Input - appears when search is active */}
                        {searchVisible && (
                            <div className='flex items-center'>
                                <input
                                    type='text'
                                    placeholder='Search user groups...'
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    className='w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                                    autoFocus
                                />
                            </div>
                        )}

                        {/* Action Buttons - left-aligned after Create button */}
                        <div className='flex items-center space-x-3'>
                            {/* Search Button */}
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

                            {/* Filter Button */}
                            <div className='relative' ref={filterRef}>
                                <button
                                    onClick={() =>
                                        setFilterVisible(!filterVisible)
                                    }
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
                            </div>

                            {/* Sort Button */}
                            <div className='relative' ref={sortRef}>
                                <button
                                    onClick={() => handleSort('groupName')}
                                    className={`group relative flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-medium transition-all duration-300 transform hover:scale-105 ${
                                        sortConfig
                                            ? 'border-green-300 bg-green-50 text-green-600 shadow-green-200 shadow-lg'
                                            : 'border-gray-200 bg-white text-gray-600 hover:border-green-200 hover:bg-green-50 hover:text-green-600 hover:shadow-lg'
                                    }`}
                                >
                                    <svg
                                        className={`w-4 h-4 transition-transform duration-300 ${
                                            sortConfig
                                                ? 'rotate-180'
                                                : 'group-hover:rotate-180'
                                        }`}
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
                                        Sort{' '}
                                        {sortConfig &&
                                            `(${sortConfig.direction})`}
                                    </span>
                                    {sortConfig && (
                                        <div className='absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-bounce'></div>
                                    )}
                                    <div className='absolute inset-0 rounded-lg bg-gradient-to-r from-green-400 to-blue-400 opacity-0 group-hover:opacity-10 transition-opacity duration-300 -z-10'></div>
                                </button>
                            </div>

                            {/* Group By Button */}
                            <div className='relative' ref={groupByRef}>
                                <button
                                    onClick={() =>
                                        handleGroupByAction('entity')
                                    }
                                    className={`group relative flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-medium transition-all duration-300 transform hover:scale-105 ${
                                        selectedGroupBy
                                            ? 'border-orange-300 bg-orange-50 text-orange-600 shadow-orange-200 shadow-lg'
                                            : 'border-gray-200 bg-white text-gray-600 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 hover:shadow-lg'
                                    }`}
                                >
                                    <svg
                                        className={`w-4 h-4 transition-transform duration-300 ${
                                            selectedGroupBy
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
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Container */}
            <div className='p-6'>
                <div className='bg-white rounded-lg shadow'>
                    <div className='max-w-[calc(100vw-450px)] overflow-x-auto'>
                        <div className='w-full max-w-full'>
                            <ReusableTableComponent
                                config={{
                                    ...dynamicTableConfig,
                                    initialData: processedTableData,
                                    customHeaderRenderer: renderColumnHeader,
                                    // Pass current user context for API calls
                                    currentUser: {
                                        accountId: 1,
                                        enterpriseId: 1,
                                    },
                                    customRenderers: {
                                        rolesCount: (
                                            value: any,
                                            rowData: UserGroup,
                                        ) => (
                                            <RolesCountCell
                                                groupData={rowData}
                                                onManageRoles={
                                                    handleManageRoles
                                                }
                                                roleCount={
                                                    rowData.roles?.length || 0
                                                }
                                            />
                                        ),
                                        entity: (
                                            value: any,
                                            rowData: UserGroup,
                                        ) => {
                                            // For existing records, show as non-editable chip
                                            if (!rowData.isNew) {
                                                return (
                                                    <div className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200'>
                                                        {value}
                                                    </div>
                                                );
                                            }
                                            // For new records, return null to use default dropdown
                                            return null;
                                        },
                                        service: (
                                            value: any,
                                            rowData: UserGroup,
                                        ) => {
                                            // For existing records, show as non-editable chip
                                            if (!rowData.isNew) {
                                                return (
                                                    <div className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200'>
                                                        {value}
                                                    </div>
                                                );
                                            }
                                            // For new records, return null to use default dropdown
                                            return null;
                                        },
                                    },
                                    onAction: handleGroupAction,
                                    loading:
                                        loading ||
                                        entitiesLoading ||
                                        servicesLoading,
                                    searchTerm: searchTerm,
                                    groupBy: selectedGroupBy,
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
