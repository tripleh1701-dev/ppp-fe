'use client';

import React, {useState, useEffect, useCallback, useMemo, useRef} from 'react';
import {motion} from 'framer-motion';
import {BookmarkIcon} from '@heroicons/react/24/outline';
import ReusableTableComponent from '@/components/Manage_User/TableComponent';
import ManageRoles_tableConfig from '@/config/ManageRoles_tableConfig';
import ScopeConfigSlidingPanel from '@/components/ScopeConfigSlidingPanel';
import ScopeCell from '@/components/ScopeCell';
import AnimatedUserGroupIcon from '@/components/AnimatedUserGroupIcon';
import UserGroupsCountCell from '@/components/UserGroupsCountCell';
import SimpleSlidingPanels from '@/components/SimpleSlidingPanels';
import {useSelectedAccount} from '@/hooks/useSelectedAccount';

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
    assignedUserGroups?: Array<{id: string; name: string; groupName: string}>;
    isNew?: boolean;
}

// Reusable trash button (copied from enterprise configuration)
function ToolbarTrashButton({
    onClick,
    bounce = false,
}: {
    onClick?: () => void;
    bounce?: boolean;
}) {
    const [over, setOver] = useState(false);
    return (
        <motion.button
            id='roles-trash-target'
            type='button'
            onClick={onClick}
            aria-label='Trash'
            aria-dropeffect='move'
            className={`group relative ml-3 inline-flex items-center justify-center w-10 h-10 rounded-full border shadow-sm transition-all duration-300 transform ${
                over
                    ? 'bg-gradient-to-br from-red-400 to-red-600 border-red-500 ring-4 ring-red-300/50 scale-110 shadow-lg'
                    : 'bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:from-red-500 hover:to-red-600 hover:border-red-500 hover:shadow-lg hover:scale-105'
            } ${over ? 'drag-over' : ''}`}
            title='Trash'
            whileHover={{
                scale: 1.1,
                rotate: [0, -8, 8, 0],
                transition: {duration: 0.4},
            }}
            whileTap={{
                scale: 0.95,
                transition: {duration: 0.1},
            }}
            onDragOver={(e) => {
                e.preventDefault();
                try {
                    e.dataTransfer.dropEffect = 'move';
                } catch {}
                if (!over) setOver(true);
            }}
            onDragEnter={() => setOver(true)}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => {
                console.log('🎯 Drop event on trash button triggered');
                setOver(false);
                try {
                    const json = e.dataTransfer.getData('application/json');
                    console.log('📦 Drag data received:', json);
                    if (!json) {
                        console.warn('⚠️ No drag data found');
                        return;
                    }
                    const payload = JSON.parse(json);
                    console.log('📋 Parsed payload:', payload);
                    const rowId = payload?.rowId as string | undefined;
                    if (!rowId) {
                        console.warn('⚠️ No rowId in payload');
                        return;
                    }
                    console.log(
                        '🚀 Dispatching roles-row-drop-trash event for rowId:',
                        rowId,
                    );
                    const event = new CustomEvent('roles-row-drop-trash', {
                        detail: {rowId},
                    });
                    window.dispatchEvent(event);
                } catch (error) {
                    console.error('❌ Error in drop handler:', error);
                }
            }}
        >
            {/* Animated background glow */}
            <div className='absolute inset-0 bg-red-400 rounded-full opacity-0 group-hover:opacity-30 blur-md transition-opacity duration-300'></div>

            {/* Enhanced trash icon */}
            <svg
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
                className='w-5 h-5 text-red-700 group-hover:text-white transition-colors duration-200 z-10 relative'
            >
                <path
                    className='trash-lid'
                    d='M10 2v2m4-2v2M4 7h16l-1 12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 7Z'
                    fill='currentColor'
                    fillOpacity='0.3'
                />
                <path d='M4 7h16' />
                <path d='M10 11v6' />
                <path d='M14 11v6' />
            </svg>

            {/* Tooltip */}
            <span
                className={`pointer-events-none absolute -top-9 right-0 whitespace-nowrap rounded-md bg-slate-900 text-white text-xs px-2 py-1 shadow-lg transition-opacity duration-200 ${
                    over ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
            >
                Drag a row here to delete
            </span>

            {/* Ripple effect on click */}
            <div className='absolute inset-0 rounded-full opacity-0 group-active:opacity-40 bg-red-300 animate-ping'></div>
            <style jsx>{`
                .trash-lid {
                    transform-box: fill-box;
                    transform-origin: 60% 30%;
                }
                .group:hover .trash-lid,
                .drag-over .trash-lid {
                    animation: trash-lid-wiggle 0.55s ease-in-out;
                }
                @keyframes trash-lid-wiggle {
                    0% {
                        transform: rotate(0deg) translateY(0);
                    }
                    35% {
                        transform: rotate(-16deg) translateY(-1px);
                    }
                    65% {
                        transform: rotate(-6deg) translateY(-0.5px);
                    }
                    100% {
                        transform: rotate(0deg) translateY(0);
                    }
                }
            `}</style>
        </motion.button>
    );
}

export default function ManageRoles() {
    // Get selected account context
    const selectedAccount = useSelectedAccount();

    // State management
    const [tableData, setTableData] = useState<Role[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchVisible, setSearchVisible] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterVisible, setFilterVisible] = useState(false);
    const [groupByVisible, setGroupByVisible] = useState(false);
    const [selectedGroupBy, setSelectedGroupBy] = useState('');
    const [showScopePanel, setShowScopePanel] = useState(false);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [triggerScopeSave, setTriggerScopeSave] = useState(0);

    // State for group assignment panel
    const [showGroupPanel, setShowGroupPanel] = useState(false);
    const [selectedRoleForGroups, setSelectedRoleForGroups] =
        useState<Role | null>(null);

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

    // Auto-save timer states (10-second timer with countdown)
    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [autoSaveCountdown, setAutoSaveCountdown] = useState<number | null>(
        null,
    );
    const [isAutoSaving, setIsAutoSaving] = useState(false);
    const [showAutoSaveSuccess, setShowAutoSaveSuccess] = useState(false);
    const tableDataRef = useRef<Role[]>([]);
    const [savingStates, setSavingStates] = useState<
        Record<string, 'saving' | 'saved' | 'error'>
    >({});

    // Update tableDataRef whenever tableData changes
    useEffect(() => {
        tableDataRef.current = tableData;
    }, [tableData]);

    // Track the latest request to prevent race conditions
    const loadRolesRequestId = useRef(0);

    // Debug: Log whenever tableData changes
    useEffect(() => {
        console.log('🔄 tableData STATE CHANGED:', {
            count: tableData.length,
            data: tableData,
            hasData: tableData.length > 0,
        });
    }, [tableData]);

    // Note: We don't load on initial mount anymore
    // Instead, we rely on the account-change useEffect below
    // This ensures selectedAccount is properly loaded before calling the API

    // Load roles data from API
    const loadRoles = useCallback(async () => {
        setLoading(true);
        try {
            // Increment request ID to track this specific request
            const currentRequestId = ++loadRolesRequestId.current;

            console.log('🚀 Fetching roles from API with account context:', {
                requestId: currentRequestId,
                accountId: selectedAccount.id,
                accountName: selectedAccount.name,
                isSystiva: selectedAccount.isSystiva,
            });

            const apiBase =
                process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

            // Build URL with account parameters
            const params = new URLSearchParams();

            console.log('🔍 DEBUG - Account context check:', {
                isSystiva: selectedAccount.isSystiva,
                hasId: !!selectedAccount.id,
                hasName: !!selectedAccount.name,
                id: selectedAccount.id,
                name: selectedAccount.name,
                willAddParams:
                    !selectedAccount.isSystiva &&
                    selectedAccount.id &&
                    selectedAccount.name,
            });

            if (
                !selectedAccount.isSystiva &&
                selectedAccount.id &&
                selectedAccount.name
            ) {
                // For specific accounts, pass the account ID and name
                params.append('accountId', selectedAccount.id);
                params.append('accountName', selectedAccount.name);
                console.log('✅ Added account params to URL:', {
                    accountId: selectedAccount.id,
                    accountName: selectedAccount.name,
                });
            } else {
                console.log('⚠️  NOT adding account params because:', {
                    isSystiva: selectedAccount.isSystiva,
                    hasId: !!selectedAccount.id,
                    hasName: !!selectedAccount.name,
                });
            }
            // For Systiva, don't add any params - backend will default to Systiva

            const url = `${apiBase}/api/user-management/roles${
                params.toString() ? `?${params.toString()}` : ''
            }`;
            console.log('🌐 Fetching roles from:', url);
            console.log(
                '🌐 Query params string:',
                params.toString() || '(empty)',
            );

            // Fetch roles from the backend API
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch roles: ${response.status}`);
            }

            const rolesData = await response.json();

            console.log('📦 RAW API Response:', {
                requestId: currentRequestId,
                type: typeof rolesData,
                isArray: Array.isArray(rolesData),
                length: rolesData?.length,
                data: rolesData,
            });

            // Check if this is still the latest request
            if (currentRequestId !== loadRolesRequestId.current) {
                console.log(
                    `⚠️ Ignoring stale response (request ${currentRequestId}, current is ${loadRolesRequestId.current})`,
                );
                return;
            }

            console.log('📊 Roles fetched from API:', {
                requestId: currentRequestId,
                count: rolesData?.length || 0,
                roles: rolesData,
            });

            // Fetch all groups to determine which groups have each role assigned
            console.log('🚀 Fetching groups to determine role assignments...');
            let allGroups: any[] = [];
            try {
                // Build groups URL with same account context
                const groupsUrl = `${apiBase}/api/user-management/groups${
                    params.toString() ? `?${params.toString()}` : ''
                }`;
                console.log('🌐 Fetching groups from:', groupsUrl);

                const groupsResponse = await fetch(groupsUrl);
                if (groupsResponse.ok) {
                    allGroups = await groupsResponse.json();
                    console.log('📊 Groups fetched:', allGroups);
                }
            } catch (error) {
                console.error('❌ Error fetching groups:', error);
            }

            // Transform API data to match the table structure
            const transformedRoles = rolesData.map((role: any) => {
                // Find all groups that have this role assigned
                const groupsWithThisRole = allGroups.filter((group: any) => {
                    const assignedRoles = group.assignedRoles || [];
                    return assignedRoles.includes(role.id);
                });

                console.log(
                    `🔍 Role "${role.name}" is assigned to ${groupsWithThisRole.length} groups:`,
                    groupsWithThisRole.map((g: any) => g.name),
                );

                return {
                    id: role.id,
                    roleName: role.name,
                    description: role.description || 'No description provided',
                    permissions: Array.isArray(role.permissions)
                        ? role.permissions
                        : [],
                    category: 'General', // Default category
                    status: 'active', // Default status
                    createdDate: role.createdAt
                        ? new Date(role.createdAt).toISOString().split('T')[0]
                        : new Date().toISOString().split('T')[0],
                    lastModified:
                        role.updatedAt ||
                        role.createdAt ||
                        new Date().toISOString(),
                    assignedUsers: 0, // Will need separate API call to get this
                    scope: role.scopeConfig || {
                        configured: false,
                        permissions: {},
                        accountSettings: [],
                        accessControl: [],
                        securityGovernance: [],
                        pipelines: [],
                        builds: [],
                    },
                    assignedUserGroups: groupsWithThisRole.map((g: any) => ({
                        id: g.id,
                        name: g.name || g.group_name,
                        groupName: g.name || g.group_name,
                    })),
                };
            });

            console.log('✅ Transformed roles data:', {
                count: transformedRoles.length,
                roles: transformedRoles,
            });

            console.log('⚡ About to setTableData with:', transformedRoles);

            // Set only the API data
            setTableData(transformedRoles);

            console.log('✅ setTableData called successfully');
        } catch (error) {
            console.error('❌ Error loading roles:', error);
            // Set empty array if API fails
            setTableData([]);
        } finally {
            setLoading(false);
        }
    }, [selectedAccount]);

    // Reload roles when account changes
    useEffect(() => {
        console.log('🔄 Account changed, reloading roles...', {
            accountId: selectedAccount.id,
            accountName: selectedAccount.name,
            isSystiva: selectedAccount.isSystiva,
        });
        loadRoles();
    }, [selectedAccount.id, selectedAccount.name, loadRoles]);

    // Debounced auto-save (10-second timer with countdown)
    const debouncedAutoSave = useCallback(() => {
        console.log('🔄 Debounced auto-save triggered');

        // Clear any existing timers
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
        }
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
        }

        // Start countdown from 10
        setAutoSaveCountdown(10);
        setShowAutoSaveSuccess(false);

        let countdown = 10;
        countdownIntervalRef.current = setInterval(() => {
            countdown -= 1;
            setAutoSaveCountdown(countdown);
            if (countdown <= 0 && countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
            }
        }, 1000);

        // Set the actual save timer for 10 seconds
        autoSaveTimerRef.current = setTimeout(async () => {
            console.log(
                '⏰ Auto-save timer expired, processing all complete roles...',
            );
            setAutoSaveCountdown(null);
            if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
            }

            // Get current table data from ref
            const currentRoles = tableDataRef.current;
            console.log('📊 Current roles for auto-save:', currentRoles);

            // Filter for complete roles (have role name and description)
            const completeRoles = currentRoles.filter((role) => {
                const isComplete = role.roleName && role.description;
                console.log(`🔍 Role ${role.id} complete:`, isComplete, role);
                return isComplete;
            });

            console.log(
                `✅ Found ${completeRoles.length} complete roles to auto-save`,
            );

            if (completeRoles.length > 0) {
                setIsAutoSaving(true);

                // Save all complete roles
                for (const role of completeRoles) {
                    await autoSaveRole(role);
                }

                setIsAutoSaving(false);
                setShowAutoSaveSuccess(true);

                // Hide success message after 3 seconds
                setTimeout(() => {
                    setShowAutoSaveSuccess(false);
                }, 3000);
            }
        }, 10000);
    }, []);

    // Auto-save individual role
    const autoSaveRole = async (role: Role) => {
        const roleId = role.id;
        console.log('💾 Auto-saving role:', roleId, role);

        // Skip if already saving
        if (savingStates[roleId] === 'saving') {
            console.log('⏭️ Skipping role (already saving):', roleId);
            return;
        }

        // Mark as saving
        setSavingStates((prev) => ({...prev, [roleId]: 'saving'}));

        try {
            // Determine if this is a new role (temp ID starts with 'item-', 'new-', or 'temp-')
            const isNewRole =
                roleId.startsWith('item-') ||
                roleId.startsWith('new-') ||
                roleId.startsWith('temp-') ||
                role.isNew === true;
            console.log(`🔍 Role ${roleId} is new:`, isNewRole);

            const requestBody = {
                name: role.roleName,
                description: role.description,
                permissions: role.permissions || [],
                // Include account context so backend knows which account to save to
                selectedAccountId: selectedAccount.id,
                selectedAccountName: selectedAccount.name,
            };

            console.log('📤 Sending request body:', requestBody);
            console.log('📤 With account context:', {
                selectedAccountId: selectedAccount.id,
                selectedAccountName: selectedAccount.name,
                isSystiva: selectedAccount.isSystiva,
            });

            const apiBase =
                process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
            let response;
            if (isNewRole) {
                // Create new role
                console.log('🆕 Creating new role...');
                response = await fetch(`${apiBase}/api/user-management/roles`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(requestBody),
                });
            } else {
                // Update existing role
                console.log('📝 Updating existing role...');
                response = await fetch(
                    `${apiBase}/api/user-management/roles/${roleId}`,
                    {
                        method: 'PUT',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify(requestBody),
                    },
                );
            }

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Save failed:', response.status, errorText);
                throw new Error(`Failed to save role: ${response.status}`);
            }

            const responseText = await response.text();
            const savedRole = responseText ? JSON.parse(responseText) : null;
            console.log('✅ Role saved successfully:', savedRole);

            // If update returned null, the role doesn't exist in DB - create it instead
            if (!isNewRole && savedRole === null) {
                console.warn(
                    '⚠️ Role not found in database, creating it instead...',
                );
                console.log('📤 Creating with account context:', {
                    selectedAccountId: selectedAccount.id,
                    selectedAccountName: selectedAccount.name,
                });

                const createResponse = await fetch(
                    `${apiBase}/api/user-management/roles`,
                    {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify(requestBody), // requestBody already has account context
                    },
                );

                if (!createResponse.ok) {
                    throw new Error(
                        `Failed to create role: ${createResponse.status}`,
                    );
                }

                const newRole = await createResponse.json();
                console.log('✅ Created role (fallback):', newRole);

                // Update the role ID with the real backend ID
                setTableData((prev) =>
                    prev.map((r) =>
                        r.id === roleId
                            ? {
                                  ...r,
                                  id: newRole.id,
                                  isNew: false,
                              }
                            : r,
                    ),
                );

                setSavingStates((prev) => ({
                    ...prev,
                    [newRole.id]: 'saved',
                }));

                // Clear the old ID from saving states
                setSavingStates((prev) => {
                    const newStates = {...prev};
                    delete newStates[roleId];
                    return newStates;
                });
            } else {
                // Update the role in tableData with the real ID if it was new
                if (isNewRole && savedRole?.id) {
                    setTableData((prev) =>
                        prev.map((r) =>
                            r.id === roleId
                                ? {
                                      ...r,
                                      id: savedRole.id,
                                      isNew: false,
                                  }
                                : r,
                        ),
                    );
                }

                // Mark as saved
                setSavingStates((prev) => ({...prev, [roleId]: 'saved'}));
            }

            // Clear saved state after 3 seconds
            setTimeout(() => {
                setSavingStates((prev) => {
                    const newStates = {...prev};
                    delete newStates[roleId];
                    return newStates;
                });
            }, 3000);
        } catch (error) {
            console.error('❌ Error saving role:', error);
            setSavingStates((prev) => ({...prev, [roleId]: 'error'}));

            // Clear error state after 5 seconds
            setTimeout(() => {
                setSavingStates((prev) => {
                    const newStates = {...prev};
                    delete newStates[roleId];
                    return newStates;
                });
            }, 5000);
        }
    };

    // Handle data changes from table
    const handleDataChange = useCallback(
        (newData: Role[]) => {
            console.log('📝 Data changed in table:', newData);
            setTableData(newData);

            // CRITICAL: Also update the ref so autosave and manual save can access the latest data
            tableDataRef.current = newData;
            console.log('✅ Updated tableDataRef.current with new data');

            debouncedAutoSave();
        },
        [debouncedAutoSave],
    );

    // Manual save all
    const handleSaveAll = async () => {
        console.log('💾 Manual save all triggered');

        // Clear any pending auto-save timers
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
            autoSaveTimerRef.current = null;
        }
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
        }
        setAutoSaveCountdown(null);

        // Get current table data
        const currentRoles = tableDataRef.current;
        console.log('📊 Current roles for manual save:', currentRoles);

        // Filter for complete roles (have role name and description)
        const completeRoles = currentRoles.filter((role) => {
            const isComplete = role.roleName && role.description;
            console.log(`🔍 Role ${role.id} complete:`, isComplete, role);
            return isComplete;
        });

        console.log(`✅ Found ${completeRoles.length} complete roles to save`);

        if (completeRoles.length === 0) {
            console.log('⚠️ No complete roles to save');
            return;
        }

        setIsAutoSaving(true);

        // Save all complete roles
        for (const role of completeRoles) {
            await autoSaveRole(role);
        }

        setIsAutoSaving(false);
        setShowAutoSaveSuccess(true);

        // Hide success message after 3 seconds
        setTimeout(() => {
            setShowAutoSaveSuccess(false);
        }, 3000);
    };

    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }
            if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
            }
        };
    }, []);

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
        console.log('🔧 Configure scope for role:', roleData);
        setSelectedRole(roleData);
        setShowScopePanel(true);
    };

    const handleSaveScope = async (scopeConfig: any) => {
        console.log(
            '💾 Scope config saved callback for role:',
            selectedRole?.id,
            scopeConfig,
        );

        if (!selectedRole) {
            console.error('❌ No role selected for scope save');
            return;
        }

        // Note: The ScopeConfigSlidingPanel already makes the API call to save
        // This callback is just to update the local state and close the panel

        // Update the role in tableData with the new scope configuration
        setTableData((prevData) =>
            prevData.map((role) =>
                role.id === selectedRole.id
                    ? {
                          ...role,
                          scope: {
                              ...scopeConfig,
                              configured: true,
                              configuredAt:
                                  scopeConfig.configuredAt ||
                                  new Date().toISOString(),
                          },
                      }
                    : role,
            ),
        );

        // Close the panel
        setShowScopePanel(false);
        setSelectedRole(null);

        console.log('✅ Local state updated, panel closed');
    };

    const handleAssignUserGroups = (roleData: Role) => {
        console.log('🎭 Opening group assignment panel for role:', roleData);
        setSelectedRoleForGroups(roleData);
        setShowGroupPanel(true);
    };

    // Handle group assignment (when user selects groups and clicks assign)
    const handleGroupAssignment = async (roleId: string, groups: any[]) => {
        console.log('💾 Assigning groups to role:', roleId, groups);

        try {
            // Extract group IDs from the groups array
            const groupIds = groups.map((group) => group.id || group);

            // For each group, update its assignedRoles to include this role
            const apiBase =
                process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

            for (const groupId of groupIds) {
                console.log(
                    `📤 Updating group ${groupId} to include role ${roleId}`,
                );

                // First, fetch the current group data
                const groupResponse = await fetch(
                    `${apiBase}/api/user-management/groups/${groupId}`,
                );
                if (!groupResponse.ok) {
                    console.error(`❌ Failed to fetch group ${groupId}`);
                    continue;
                }

                const groupData = await groupResponse.json();
                const currentRoles = groupData.assignedRoles || [];

                // Add the role if it's not already assigned
                if (!currentRoles.includes(roleId)) {
                    const updatedRoles = [...currentRoles, roleId];

                    // Update the group with the new role assignment
                    const updateResponse = await fetch(
                        `${apiBase}/api/user-management/groups/${groupId}`,
                        {
                            method: 'PUT',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({
                                assignedRoles: updatedRoles,
                            }),
                        },
                    );

                    if (!updateResponse.ok) {
                        throw new Error(
                            `Failed to update group ${groupId}: ${updateResponse.status}`,
                        );
                    }

                    console.log(
                        `✅ Successfully assigned role to group ${groupId}`,
                    );
                }
            }

            console.log('✅ All groups updated successfully');

            // Reload roles to refresh the assigned groups display
            await loadRoles();

            // Close the panel
            setShowGroupPanel(false);
            setSelectedRoleForGroups(null);
        } catch (error) {
            console.error('❌ Error assigning groups to role:', error);
        }
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

                    {/* Save Button with Auto-save Timer */}
                    <button
                        onClick={handleSaveAll}
                        disabled={isAutoSaving}
                        className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            showAutoSaveSuccess
                                ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
                                : isAutoSaving
                                ? 'bg-gray-400 text-white cursor-not-allowed'
                                : autoSaveCountdown !== null
                                ? 'bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-500'
                                : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                        }`}
                    >
                        {showAutoSaveSuccess ? (
                            <>
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
                                Saved Successfully
                            </>
                        ) : isAutoSaving ? (
                            <>
                                <svg
                                    className='animate-spin h-4 w-4'
                                    xmlns='http://www.w3.org/2000/svg'
                                    fill='none'
                                    viewBox='0 0 24 24'
                                >
                                    <circle
                                        className='opacity-25'
                                        cx='12'
                                        cy='12'
                                        r='10'
                                        stroke='currentColor'
                                        strokeWidth='4'
                                    ></circle>
                                    <path
                                        className='opacity-75'
                                        fill='currentColor'
                                        d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                                    ></path>
                                </svg>
                                Saving...
                            </>
                        ) : autoSaveCountdown !== null ? (
                            <>
                                <BookmarkIcon className='w-4 h-4' />
                                Auto-save in {autoSaveCountdown}s
                            </>
                        ) : (
                            <>
                                <BookmarkIcon className='w-4 h-4' />
                                Save
                            </>
                        )}
                    </button>

                    <ToolbarTrashButton onClick={() => {}} />

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
                    {loading ? (
                        // Loading State
                        <div className='bg-white rounded-lg border border-slate-200 p-12 text-center'>
                            <div className='mx-auto max-w-md'>
                                <div className='mx-auto h-12 w-12 text-primary-600 animate-spin'>
                                    <svg
                                        className='h-full w-full'
                                        fill='none'
                                        viewBox='0 0 24 24'
                                    >
                                        <circle
                                            className='opacity-25'
                                            cx='12'
                                            cy='12'
                                            r='10'
                                            stroke='currentColor'
                                            strokeWidth='4'
                                        />
                                        <path
                                            className='opacity-75'
                                            fill='currentColor'
                                            d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                                        />
                                    </svg>
                                </div>
                                <h3 className='mt-4 text-lg font-semibold text-slate-900'>
                                    Loading Roles
                                </h3>
                                <p className='mt-2 text-sm text-slate-500'>
                                    Please wait while we fetch role data from
                                    the database...
                                </p>
                            </div>
                        </div>
                    ) : (
                        <ReusableTableComponent
                            // @ts-ignore - Complex table configuration type
                            config={{
                                ...ManageRoles_tableConfig,
                                initialData: processedTableData,
                                customHeaderRenderer: renderColumnHeader,

                                // Enable inline editing features
                                features: {
                                    inlineEditing: true,
                                    autoSave: true,
                                    hoverControls: true,
                                    dragAndDrop: true,
                                    columnResize: true,
                                    rowSelection: true,
                                },

                                // UI configuration
                                ui: {
                                    editTrigger: 'doubleClick',
                                    showRowNumbers: true,
                                    compactMode: false,
                                },

                                // Actions configuration
                                actions: {
                                    onDataChange: handleDataChange,
                                    customRenderers: {
                                        scopeConfig: (
                                            value: any,
                                            rowData: Role,
                                        ) => (
                                            <ScopeCell
                                                roleData={rowData}
                                                onConfigureScope={
                                                    handleConfigureScope
                                                }
                                            />
                                        ),
                                        animatedUserGroup: (
                                            value: any,
                                            rowData: Role,
                                        ) => (
                                            <UserGroupsCountCell
                                                roleData={rowData}
                                                groupCount={
                                                    rowData.assignedUserGroups
                                                        ?.length || 0
                                                }
                                                onManageGroups={
                                                    handleAssignUserGroups
                                                }
                                            />
                                        ),
                                    },
                                },

                                onAction: handleRoleAction,
                                loading: loading,
                                searchTerm: searchTerm,
                                groupBy: selectedGroupBy,
                                savingStates: savingStates,
                            }}
                            editTrigger='doubleClick'
                        />
                    )}
                </div>
            </div>

            {/* Scope Configuration Sliding Panel */}
            {selectedRole && (
                <ScopeConfigSlidingPanel
                    isOpen={showScopePanel}
                    onClose={() => {
                        setShowScopePanel(false);
                        setSelectedRole(null);
                    }}
                    roleId={selectedRole.id}
                    roleName={selectedRole.roleName || ''}
                    roleDescription={selectedRole.description || ''}
                    currentScope={selectedRole.scope}
                    onSave={handleSaveScope}
                    triggerSave={triggerScopeSave}
                />
            )}

            {/* Group Assignment Sliding Panel */}
            {selectedRoleForGroups && showGroupPanel && (
                <SimpleSlidingPanels
                    key={`group-panel-${selectedRoleForGroups.id}`}
                    isOpen={showGroupPanel}
                    onClose={() => {
                        setShowGroupPanel(false);
                        setSelectedRoleForGroups(null);
                    }}
                    currentUser={{
                        id: selectedRoleForGroups.id,
                        name: selectedRoleForGroups.roleName,
                        description: selectedRoleForGroups.description,
                        assignedUserGroups:
                            selectedRoleForGroups.assignedUserGroups || [],
                    }}
                    onAssignGroups={(groups) => {
                        handleGroupAssignment(selectedRoleForGroups.id, groups);
                    }}
                    initialPanel='userGroups'
                    visiblePanels={['userGroups']}
                />
            )}
        </div>
    );
}
