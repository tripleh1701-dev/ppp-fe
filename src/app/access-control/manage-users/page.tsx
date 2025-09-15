'use client';

import {useEffect, useMemo, useRef, useState, useCallback} from 'react';
import ConfirmModal from '@/components/ConfirmModal';
// @ts-ignore
import * as XLSX from 'xlsx';
import ReusableTableComponent from '@/components/Manage_User/TableComponent';
import ManageUsers_tableConfig from '@/config/ManageUsers_tableConfig';
import {
    EllipsisVerticalIcon,
    EyeIcon,
    PencilSquareIcon,
    TrashIcon,
    UserGroupIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    ArrowsUpDownIcon,
    Squares2X2Icon,
    LockClosedIcon,
    LockOpenIcon,
    KeyIcon,
    InformationCircleIcon,
} from '@heroicons/react/24/outline';
import {api} from '@/utils/api';
import {getActiveUserGroups} from '@/utils/dynamicData';
import {UserGroup} from '@/constants/formOptions';
import userService from '@/services/userService';

interface UserRecord {
    id: string;
    username: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    email: string;
    startDate: string; // ISO yyyy-mm-dd
    endDate?: string; // ISO yyyy-mm-dd
    groupName: string; // assigned to
    updatedAt: string; // ISO timestamp
    status?: 'Active' | 'Inactive' | '';
    locked?: boolean;
    assignedUserGroup?: Array<{id: string; name: string}>;
}

// Dynamic user groups - will be loaded from database

export default function ManageUsers() {
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<UserRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [viewing, setViewing] = useState<UserRecord | null>(null);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const [showSearchBar, setShowSearchBar] = useState(false);
    const [showCreateInline, setShowCreateInline] = useState(false);
    const [showUserTable, setShowUserTable] = useState(false);
    const [tableData, setTableData] = useState<any[]>([]);
    const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
    const [savingStates, setSavingStates] = useState<
        Record<string, 'saving' | 'saved' | 'error'>
    >({});
    const [autoSaveTimeouts, setAutoSaveTimeouts] = useState<
        Record<string, NodeJS.Timeout>
    >({});

    // New state for animated buttons
    const [filterVisible, setFilterVisible] = useState(false);
    const [selectedGroupBy, setSelectedGroupBy] = useState('');
    const [sortVisible, setSortVisible] = useState(false);
    const [hideColumnsVisible, setHideColumnsVisible] = useState(false);
    const [groupByVisible, setGroupByVisible] = useState(false);

    // Refs for dialog containers to detect outside clicks
    const filterRef = useRef<HTMLDivElement>(null);
    const sortRef = useRef<HTMLDivElement>(null);
    const groupByRef = useRef<HTMLDivElement>(null);
    const hideColumnsRef = useRef<HTMLDivElement>(null);

    // State for sorting
    const [sortConfig, setSortConfig] = useState<{
        column: string;
        direction: 'asc' | 'desc';
    } | null>(null);

    // State for filtering
    const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});

    // State for column visibility
    const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);

    // State for sliding pane backdrop
    const [slidingPaneOpen, setSlidingPaneOpen] = useState(false);

    // Set up global callback for sliding pane state
    useEffect(() => {
        // Set up global callback for sliding pane visibility
        (window as any).setSlidingPaneOpen = setSlidingPaneOpen;

        // Cleanup on unmount
        return () => {
            delete (window as any).setSlidingPaneOpen;
        };
    }, []);

    // Load users from backend on component mount
    // Function to fetch group names from IDs
    const fetchGroupNames = async (groupIds: number[]): Promise<any[]> => {
        if (!groupIds || groupIds.length === 0) return [];

        try {
            console.log('🔄 Fetching group names for IDs:', groupIds);
            const response = await fetch(
                'http://localhost:4000/api/user-groups',
            );

            if (!response.ok) {
                console.error('❌ Failed to fetch user groups');
                return [];
            }

            const allGroups = await response.json();
            console.log('📋 All available groups:', allGroups);

            // Filter groups that match the provided IDs
            const matchingGroups = allGroups.filter((group: any) =>
                groupIds.includes(parseInt(group.id, 10)),
            );

            console.log('✅ Matching groups found:', matchingGroups);
            return matchingGroups;
        } catch (error) {
            console.error('❌ Error fetching group names:', error);
            return [];
        }
    };

    // Function to remove a group from user
    const removeGroupFromUser = async (
        userId: string,
        groupId: number,
        groupName: string,
    ): Promise<boolean> => {
        try {
            console.log(
                `🔄 Removing group ${groupName} (ID: ${groupId}) from user ${userId}`,
            );

            const response = await fetch(
                `http://localhost:4000/api/users/${userId}/remove-group/${groupId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            );

            if (response.ok) {
                console.log(
                    `✅ Successfully removed group ${groupName} from user`,
                );

                // Update UI - remove the group from both tableData and users state
                setTableData((prevData) =>
                    prevData.map((user) =>
                        user.id === userId
                            ? {
                                  ...user,
                                  assignedUserGroup:
                                      user.assignedUserGroup.filter(
                                          (group: any) => group.id !== groupId,
                                      ),
                                  assignedGroupIds:
                                      user.assignedGroupIds.filter(
                                          (id: number) => id !== groupId,
                                      ),
                              }
                            : user,
                    ),
                );

                setUsers((prevUsers) =>
                    prevUsers.map((user) =>
                        user.id === userId
                            ? {
                                  ...user,
                                  assignedUserGroup:
                                      user.assignedUserGroup?.filter(
                                          (group: any) => group.id !== groupId,
                                      ) || [],
                              }
                            : user,
                    ),
                );

                return true;
            } else {
                console.error('❌ Failed to remove group from user');
                return false;
            }
        } catch (error) {
            console.error('❌ Error removing group from user:', error);
            return false;
        }
    };

    useEffect(() => {
        const loadUsers = async () => {
            try {
                setLoading(true);
                console.log('🔄 Loading users from API...');

                // Direct API call to match your backend response structure
                const response = await fetch('http://localhost:4000/api/user', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        // Add auth header if needed
                        // Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const usersData = await response.json();
                console.log('✅ Users data received:', usersData);

                // Handle direct array response from your API
                if (Array.isArray(usersData) && usersData.length >= 0) {
                    console.log('🔄 Processing users with assigned groups...');

                    // Transform backend data to match advanced table column structure exactly
                    const transformedUsers = await Promise.all(
                        usersData.map(async (user, index) => {
                            // Get assigned group IDs from the database column
                            const assignedGroupIds =
                                user.assigned_user_group || [];
                            console.log(
                                `👤 User ${user.firstName} ${user.lastName} has assigned groups:`,
                                assignedGroupIds,
                            );

                            // Fetch group names for assigned group IDs
                            let assignedGroups: any[] = [];
                            if (
                                assignedGroupIds &&
                                assignedGroupIds.length > 0
                            ) {
                                assignedGroups = await fetchGroupNames(
                                    assignedGroupIds,
                                );
                            }

                            return {
                                // Required for table functionality
                                id: user.id
                                    ? user.id.toString()
                                    : `temp-${Date.now()}-${index}`,

                                // Main table columns (matching ManageUsers_tableConfig.js)
                                firstName: user.firstName || '',
                                middleName: user.middleName || '',
                                lastName: user.lastName || '',
                                emailAddress: user.emailAddress || '',
                                status: '',
                                startDate: user.startDate
                                    ? user.startDate.split('T')[0]
                                    : '', // Convert to YYYY-MM-DD
                                endDate: user.endDate
                                    ? user.endDate.split('T')[0]
                                    : '',
                                password: '••••••••', // Placeholder for security
                                technicalUser: user.technicalUser || false,
                                assignedUserGroup: assignedGroups, // Loaded with group names
                                assignedGroupIds: assignedGroupIds, // Keep IDs for reference

                                // Additional metadata for table functionality
                                createdAt: user.createdAt || '',
                                updatedAt: user.updatedAt || '',

                                // Table interaction properties
                                selected: false,
                                expanded: false,
                                editing: false,
                            };
                        }),
                    );

                    console.log(
                        '🔄 Transformed users with assigned groups:',
                        transformedUsers,
                    );
                    setTableData(transformedUsers);

                    // Also update the main users state for compatibility
                    setUsers(
                        transformedUsers.map((user) => ({
                            id: user.id,
                            username: user.emailAddress, // Use email as username
                            firstName: user.firstName,
                            lastName: user.lastName,
                            email: user.emailAddress,
                            startDate: user.startDate,
                            endDate: user.endDate,
                            technicalUser: user.technicalUser,
                            groupName: '', // Will be populated when user groups are loaded
                            updatedAt: user.updatedAt,
                            status: '',
                        })),
                    );

                    console.log(
                        '✅ Users loaded successfully:',
                        transformedUsers.length,
                        'users',
                    );
                } else {
                    console.warn(
                        '⚠️ Unexpected API response format:',
                        usersData,
                    );
                    setTableData([]);
                    setUsers([]);
                }
            } catch (error) {
                console.error('❌ Error loading users:', error);
                setTableData([]);
                setUsers([]);
                // You might want to show a toast notification here
            } finally {
                setLoading(false);
            }
        };

        loadUsers();

        // Set up callback for user group assignment updates
        (window as any).userGroupAssignmentCallback = (
            userId: string,
            groupsData: any[],
            groupIds: number[],
        ) => {
            console.log('📋 Updating table data with group assignment:', {
                userId,
                groupsData,
                groupIds,
            });

            // Update table data with the assigned groups (mark as saved)
            setTableData((prevData) =>
                prevData.map((row) =>
                    row.id == userId || row.id === userId.toString()
                        ? {
                              ...row,
                              assignedUserGroup: groupsData,
                              assignedGroupIds: groupIds,
                              pendingGroupAssignments: null, // Clear pending state on save
                              // Add group count for UI display
                              groupCount: groupIds.length,
                          }
                        : row,
                ),
            );

            // Also update the main users state for consistency
            setUsers((prevUsers) =>
                prevUsers.map((user) =>
                    user.id == userId || user.id === userId.toString()
                        ? {
                              ...user,
                              assignedUserGroup: groupsData,
                              assignedGroupIds: groupIds,
                              pendingGroupAssignments: null,
                              groupCount: groupIds.length,
                          }
                        : user,
                ),
            );

            console.log(
                `✅ Updated UI with ${groupIds.length} assigned groups for user ${userId}`,
            );
        };

        // Set up callback for pending group selections (not yet saved)
        (window as any).setPendingGroupAssignments = (
            userId: string,
            pendingGroups: any[],
        ) => {
            console.log('⏳ Setting pending group assignments:', {
                userId,
                pendingGroups,
            });

            setTableData((prevData) =>
                prevData.map((row) =>
                    row.id == userId || row.id === userId.toString()
                        ? {
                              ...row,
                              pendingGroupAssignments: pendingGroups,
                          }
                        : row,
                ),
            );
        };

        // Set up callback for removing groups from users
        (window as any).removeGroupFromUserCallback = removeGroupFromUser;

        // Cleanup callback on unmount
        return () => {
            delete (window as any).userGroupAssignmentCallback;
            delete (window as any).setPendingGroupAssignments;
            delete (window as any).removeGroupFromUserCallback;
        };
    }, []);

    // Handler functions for action buttons
    const handleSort = (column: string) => {
        setSortConfig((prev) => {
            if (prev?.column === column) {
                // Toggle direction
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

    const handleGroupBy = (groupByColumn: string) => {
        setSelectedGroupBy((prev) =>
            prev === groupByColumn ? '' : groupByColumn,
        );
    };

    // Filter and sort data based on current settings
    const processedTableData = useMemo(() => {
        let processed = [...tableData];

        // Apply filters
        Object.entries(activeFilters).forEach(([column, value]) => {
            if (value) {
                processed = processed.filter((row) => {
                    const cellValue = row[column];
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
                const aVal = a[sortConfig.column];
                const bVal = b[sortConfig.column];

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

    // Auto-save function with debouncing
    const autoSaveUser = useCallback(
        async (userData: any, isNewUser: boolean = false) => {
            const userId = userData.id;

            // Clear existing timeout for this user
            if (autoSaveTimeouts[userId]) {
                clearTimeout(autoSaveTimeouts[userId]);
            }

            // Set saving state
            setSavingStates((prev) => ({...prev, [userId]: 'saving'}));

            // Create debounced save function
            const timeoutId = setTimeout(async () => {
                try {
                    console.log('🔄 Processing auto-save for user:', {
                        userId,
                        isNewUser,
                        userData: {
                            id: userData.id,
                            firstName: userData.firstName,
                            lastName: userData.lastName,
                            emailAddress: userData.emailAddress,
                            status: userData.status,
                        },
                    });

                    // Transform data to backend format
                    const backendData =
                        userService.transformToBackendFormat(userData);

                    console.log('📤 Backend data to be sent:', backendData);

                    if (
                        isNewUser ||
                        userData.id.toString().startsWith('temp-') ||
                        userData.id.toString().startsWith('item-') ||
                        isNaN(parseInt(userData.id.toString(), 10))
                    ) {
                        // Create new user
                        console.log('🆕 Auto-saving new user:', backendData);
                        const response = await userService.createUser(
                            backendData as any,
                        );

                        // Handle different response formats
                        const responseData = (response as any).data || response;
                        const userId_new = responseData.id;

                        if (userId_new) {
                            // Update the user ID with the real backend ID
                            setTableData((prevData) =>
                                prevData.map((user) =>
                                    user.id === userId
                                        ? {
                                              ...user,
                                              id: userId_new.toString(),
                                          }
                                        : user,
                                ),
                            );

                            setSavingStates((prev) => ({
                                ...prev,
                                [userId_new.toString()]: 'saved',
                            }));

                            // Clear the temp ID from saving states
                            setSavingStates((prev) => {
                                const newStates = {...prev};
                                delete newStates[userId];
                                return newStates;
                            });

                            console.log(
                                '✅ New user created successfully:',
                                userId_new,
                            );
                        }
                    } else {
                        // Update existing user
                        console.log(
                            '🔄 Auto-saving existing user:',
                            userId,
                            backendData,
                        );

                        // Validate userId before converting to number
                        const numericUserId = parseInt(userId.toString(), 10);
                        if (isNaN(numericUserId)) {
                            console.error(
                                '❌ Invalid user ID for update:',
                                userId,
                            );
                            setSavingStates((prev) => ({
                                ...prev,
                                [userId]: 'error',
                            }));
                            return;
                        }

                        const response = await userService.updateUser(
                            numericUserId,
                            backendData as any,
                        );

                        // Handle different response formats
                        const responseData = (response as any).data || response;

                        if (responseData) {
                            setSavingStates((prev) => ({
                                ...prev,
                                [userId]: 'saved',
                            }));
                            console.log(
                                '✅ User updated successfully:',
                                userId,
                            );
                        }
                    }

                    // Clear saved state after 2 seconds
                    setTimeout(() => {
                        setSavingStates((prev) => {
                            const newStates = {...prev};
                            delete newStates[userId];
                            return newStates;
                        });
                    }, 2000);
                } catch (error) {
                    console.error(
                        '❌ Auto-save failed for user:',
                        userId,
                        error,
                    );
                    setSavingStates((prev) => ({...prev, [userId]: 'error'}));

                    // Clear error state after 5 seconds
                    setTimeout(() => {
                        setSavingStates((prev) => {
                            const newStates = {...prev};
                            delete newStates[userId];
                            return newStates;
                        });
                    }, 5000);
                }
            }, 1000); // 1 second debounce

            // Store the timeout ID
            setAutoSaveTimeouts((prev) => ({...prev, [userId]: timeoutId}));
        },
        [autoSaveTimeouts],
    );

    // Enhanced onDataChange with auto-save
    const handleDataChange = useCallback(
        (newData: any[]) => {
            console.log(
                '🚀 HANDLE_DATA_CHANGE CALLED!',
                'This function is being triggered',
            );
            console.log('📝 Data changed, processing auto-save...', {
                newDataLength: newData.length,
                newData: newData.map((u) => ({
                    id: u.id,
                    firstName: u.firstName,
                    lastName: u.lastName,
                    emailAddress: u.emailAddress,
                })),
            });

            // Update table data immediately for UI responsiveness
            setTableData(newData);

            // Find changed users and auto-save them
            newData.forEach((user, index) => {
                const isNewUser =
                    user.id.toString().startsWith('temp-') ||
                    user.id.toString().startsWith('item-') ||
                    !user.id ||
                    isNaN(parseInt(user.id.toString(), 10));
                // Only auto-save if we have meaningful data
                const hasBasicInfo = user.firstName && user.lastName;
                const hasValidEmail =
                    user.emailAddress &&
                    user.emailAddress.includes('@') &&
                    user.emailAddress.includes('.');
                const shouldAutoSave = hasBasicInfo && hasValidEmail;

                console.log(`🔍 User ${index}:`, {
                    id: user.id,
                    idType: typeof user.id,
                    isNewUser,
                    shouldAutoSave,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    emailAddress: user.emailAddress,
                    isNumericId: !isNaN(parseInt(user.id.toString(), 10)),
                    parsedId: parseInt(user.id.toString(), 10),
                });

                if (shouldAutoSave) {
                    console.log(`💾 Triggering auto-save for user ${user.id}`);
                    autoSaveUser(user, isNewUser);
                } else {
                    console.log(
                        `⏭️ Skipping auto-save for user ${user.id} - no data`,
                    );
                }
            });
        },
        [autoSaveUser],
    );

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            Object.values(autoSaveTimeouts).forEach((timeout) => {
                if (timeout) clearTimeout(timeout);
            });
        };
    }, [autoSaveTimeouts]);

    // Test function to manually trigger auto-save (for debugging)
    const testAutoSave = async () => {
        console.log('🧪 MANUAL AUTO-SAVE TEST');
        const testUser = {
            id: 'temp-test-123',
            firstName: 'Test',
            lastName: 'AutoSave',
            emailAddress: 'test-autosave@example.com',
            status: '',
            startDate: '2024-12-31',
            technicalUser: false,
        };

        try {
            await autoSaveUser(testUser, true);
            console.log('✅ Manual auto-save test completed');
        } catch (error) {
            console.error('❌ Manual auto-save test failed:', error);
        }
    };

    // Auto-save status display component
    const AutoSaveStatus = ({userId}: {userId: string}) => {
        const status = savingStates[userId];
        if (!status) return null;

        const statusConfig = {
            saving: {
                text: 'Saving...',
                color: '#f59e0b',
                icon: '⏳',
            },
            saved: {
                text: 'Saved',
                color: '#10b981',
                icon: '✓',
            },
            error: {
                text: 'Error',
                color: '#ef4444',
                icon: '⚠',
            },
        };

        const config = statusConfig[status];

        return (
            <div
                style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    background: config.color,
                    color: 'white',
                    fontSize: '8px',
                    padding: '1px 4px',
                    borderRadius: '2px',
                    zIndex: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                    animation:
                        status === 'saving'
                            ? 'pulse 1.5s infinite'
                            : status === 'saved'
                            ? 'fadeIn 0.3s ease'
                            : 'shake 0.5s ease',
                }}
                title={`Auto-save: ${config.text}`}
            >
                <span>{config.icon}</span>
                <span>{config.text}</span>
            </div>
        );
    };

    // Enhanced Column Header Renderer with Icons
    const renderColumnHeader = (column: any) => {
        const getColumnIcon = (columnId: string) => {
            const icons: Record<string, JSX.Element> = {
                firstName: (
                    <svg
                        width='14'
                        height='14'
                        viewBox='0 0 24 24'
                        fill='none'
                        className='cell-icon'
                    >
                        <path
                            d='M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21'
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
                    </svg>
                ),
                lastName: (
                    <svg
                        width='14'
                        height='14'
                        viewBox='0 0 24 24'
                        fill='none'
                        className='cell-icon'
                    >
                        <path
                            d='M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21'
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
                    </svg>
                ),
                emailAddress: (
                    <svg
                        width='14'
                        height='14'
                        viewBox='0 0 24 24'
                        fill='none'
                        className='cell-icon'
                    >
                        <path
                            d='M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z'
                            stroke='currentColor'
                            strokeWidth='2'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                        />
                        <polyline
                            points='22,6 12,13 2,6'
                            stroke='currentColor'
                            strokeWidth='2'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                        />
                    </svg>
                ),
                password: (
                    <svg
                        width='14'
                        height='14'
                        viewBox='0 0 24 24'
                        fill='none'
                        className='cell-icon'
                    >
                        {/* Modern Key Icon - Clean and Small */}
                        <circle
                            cx='8'
                            cy='8'
                            r='4'
                            stroke='currentColor'
                            strokeWidth='2'
                        />
                        <path
                            d='M12 12L20 20'
                            stroke='currentColor'
                            strokeWidth='2'
                            strokeLinecap='round'
                        />
                        <path
                            d='M16 16L18 14'
                            stroke='currentColor'
                            strokeWidth='2'
                            strokeLinecap='round'
                        />
                        <path
                            d='M18 18L20 16'
                            stroke='currentColor'
                            strokeWidth='2'
                            strokeLinecap='round'
                        />
                    </svg>
                ),
                assignedUserGroup: (
                    <svg
                        width='14'
                        height='14'
                        viewBox='0 0 24 24'
                        fill='none'
                        className='user-group-icon'
                    >
                        <path
                            d='M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21'
                            stroke='currentColor'
                            strokeWidth='2'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                        />
                        <circle
                            cx='9'
                            cy='7'
                            r='4'
                            stroke='currentColor'
                            strokeWidth='2'
                        />
                        <path
                            d='M23 21V19C23 18.1645 22.7155 17.3694 22.2094 16.7338C21.7033 16.0982 20.9986 15.6577 20.2 15.4773'
                            stroke='currentColor'
                            strokeWidth='2'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                        />
                        <path
                            d='M16 3.46875C16.7986 3.64917 17.5033 4.08967 18.0094 4.72527C18.5155 5.36087 18.8 6.15595 18.8 6.99142C18.8 7.82689 18.5155 8.62197 18.0094 9.25757C17.5033 9.89317 16.7986 10.3337 16 10.5141'
                            stroke='currentColor'
                            strokeWidth='2'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                        />
                    </svg>
                ),
                startDate: (
                    <svg
                        width='14'
                        height='14'
                        viewBox='0 0 24 24'
                        fill='none'
                        className='cell-icon'
                    >
                        <rect
                            x='3'
                            y='4'
                            width='18'
                            height='18'
                            rx='2'
                            ry='2'
                            stroke='currentColor'
                            strokeWidth='2'
                        />
                        <line
                            x1='16'
                            y1='2'
                            x2='16'
                            y2='6'
                            stroke='currentColor'
                            strokeWidth='2'
                            strokeLinecap='round'
                        />
                        <line
                            x1='8'
                            y1='2'
                            x2='8'
                            y2='6'
                            stroke='currentColor'
                            strokeWidth='2'
                            strokeLinecap='round'
                        />
                        <line
                            x1='3'
                            y1='10'
                            x2='21'
                            y2='10'
                            stroke='currentColor'
                            strokeWidth='2'
                        />
                    </svg>
                ),
                endDate: (
                    <svg
                        width='14'
                        height='14'
                        viewBox='0 0 24 24'
                        fill='none'
                        className='cell-icon'
                    >
                        <rect
                            x='3'
                            y='4'
                            width='18'
                            height='18'
                            rx='2'
                            ry='2'
                            stroke='currentColor'
                            strokeWidth='2'
                        />
                        <line
                            x1='16'
                            y1='2'
                            x2='16'
                            y2='6'
                            stroke='currentColor'
                            strokeWidth='2'
                            strokeLinecap='round'
                        />
                        <line
                            x1='8'
                            y1='2'
                            x2='8'
                            y2='6'
                            stroke='currentColor'
                            strokeWidth='2'
                            strokeLinecap='round'
                        />
                        <line
                            x1='3'
                            y1='10'
                            x2='21'
                            y2='10'
                            stroke='currentColor'
                            strokeWidth='2'
                        />
                        <path
                            d='M8 14L10 16L16 10'
                            stroke='currentColor'
                            strokeWidth='2'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                        />
                    </svg>
                ),
                status: (
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
                        <path
                            d='M8 12L11 15L16 9'
                            stroke='currentColor'
                            strokeWidth='2'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                        />
                    </svg>
                ),
                technicalUser: (
                    <svg
                        width='14'
                        height='14'
                        viewBox='0 0 24 24'
                        fill='none'
                        className='cell-icon'
                    >
                        <rect
                            x='2'
                            y='5'
                            width='20'
                            height='14'
                            rx='2'
                            stroke='currentColor'
                            strokeWidth='2'
                        />
                        <line
                            x1='2'
                            y1='10'
                            x2='22'
                            y2='10'
                            stroke='currentColor'
                            strokeWidth='2'
                        />
                        <circle cx='6' cy='15' r='1' fill='currentColor' />
                        <path
                            d='M18 15H10'
                            stroke='currentColor'
                            strokeWidth='2'
                            strokeLinecap='round'
                        />
                    </svg>
                ),
            };
            return icons[columnId] || null;
        };

        const icon = getColumnIcon(column.id);

        return (
            <div className='flex items-center gap-1'>
                {icon}
                <span>{column.title}</span>
            </div>
        );
    };

    type NewUserDraft = {
        firstName: string;
        middleName: string;
        lastName: string;
        email: string;
        status: 'Active' | 'Inactive' | '';
        locked: boolean;
        startDate: string; // yyyy-mm-dd
        startTime?: string; // HH:mm
        startUseTime: boolean;
        endDate?: string; // yyyy-mm-dd
        endTime?: string; // HH:mm
        endUseTime: boolean;
        password?: string;
        passwordSet: boolean;
        assignedGroups: string[];
    };
    type DraftRow = NewUserDraft & {key: string};
    const todayIso = (() => {
        const d = new Date();
        const tzOffsetMs = d.getTimezoneOffset() * 60 * 1000;
        const local = new Date(d.getTime() - tzOffsetMs);
        return local.toISOString().slice(0, 10);
    })();
    const makeBlankDraft = (): DraftRow => ({
        key: `draft-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        firstName: '',
        middleName: '',
        lastName: '',
        email: '',
        status: '',
        locked: false,
        startDate: '',
        startTime: undefined,
        startUseTime: false,
        endDate: undefined,
        endTime: undefined,
        endUseTime: false,
        password: undefined,
        passwordSet: false,
        assignedGroups: [],
    });
    const [newUser, setNewUser] = useState<NewUserDraft>({
        firstName: '',
        middleName: '',
        lastName: '',
        email: '',
        status: '',
        locked: false,
        startDate: '',
        startTime: undefined,
        startUseTime: false,
        endDate: undefined,
        endTime: undefined,
        endUseTime: false,
        password: undefined,
        passwordSet: false,
        assignedGroups: [],
    });
    const [confirmPassword, setConfirmPassword] = useState('');
    const assignableGroups = useMemo(
        () =>
            userGroups.filter((g) => !newUser.assignedGroups.includes(g.name)),
        [userGroups, newUser.assignedGroups],
    );
    const allPasswordValid = useMemo(() => {
        const pwd = newUser.password || '';
        return (
            pwd.length >= 8 &&
            /\d/.test(pwd) &&
            /[A-Z]/.test(pwd) &&
            /[a-z]/.test(pwd) &&
            /[^A-Za-z0-9]/.test(pwd)
        );
    }, [newUser.password]);
    const passwordsMatch = useMemo(
        () => (newUser.password || '') === confirmPassword,
        [newUser.password, confirmPassword],
    );
    const [draftRows, setDraftRows] = useState<DraftRow[]>([]);
    const [openPasswordPopover, setOpenPasswordPopover] = useState(false);
    const [passwordAnchor, setPasswordAnchor] = useState<HTMLElement | null>(
        null,
    );
    const [passwordKey, setPasswordKey] = useState<string | null>(null);
    const [openDatePopover, setOpenDatePopover] = useState<null | {
        field: 'start' | 'end';
        anchor: HTMLElement;
        key: string;
    }>(null);
    const [groupsHoverOpen, setGroupsHoverOpen] = useState(false);
    const [groupsAnchor, setGroupsAnchor] = useState<HTMLElement | null>(null);
    const [groupsKey, setGroupsKey] = useState<string | null>(null);
    const [assignGroupsOpen, setAssignGroupsOpen] = useState(false);
    const [assignGroupsAnchor, setAssignGroupsAnchor] =
        useState<HTMLElement | null>(null);

    const loadUsers = async () => {
        const data = await api.get<UserRecord[]>('/api/user');
        setUsers(data);
    };

    const loadUserGroups = async () => {
        setLoading(true);
        try {
            const groups = await getActiveUserGroups();
            setUserGroups(groups);
        } catch (error) {
            console.error('Failed to load user groups:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers().catch(() => {});
        loadUserGroups().catch(() => {});
    }, []);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return users;
        return users.filter((u) =>
            [u.username, u.firstName, u.lastName, u.email, u.groupName]
                .join(' ')
                .toLowerCase()
                .includes(q),
        );
    }, [users, search]);

    const exportToXls = () => {
        const data = filtered.map((u) => ({
            Username: u.username,
            'First name': u.firstName,
            'Middle name': u.middleName || '-',
            'Last name': u.lastName,
            Email: u.email,
            'Last updated': new Date(u.updatedAt).toLocaleString(),
            'End date': u.endDate || '-',
            'Assigned to': u.groupName,
            Status: u.status ?? '',
            Locked: u.locked ? 'Yes' : 'No',
        }));
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
        const wbout = XLSX.write(workbook, {bookType: 'xlsx', type: 'array'});
        const blob = new Blob([wbout], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'users_export.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const saveVariant = () => {
        alert('View variants will be saved server-side in a future update.');
    };

    const isDraftSavable = (d: DraftRow) => {
        const fnOk =
            d.firstName.trim().length > 0 && d.firstName.trim().length <= 50;
        const lnOk =
            d.lastName.trim().length > 0 && d.lastName.trim().length <= 50;
        const mnOk = d.middleName.trim().length <= 50;
        const emailOk = !!d.email.trim();
        const startOk = !!d.startDate;
        return fnOk && lnOk && mnOk && emailOk && startOk;
    };

    // Autosave per draft row
    const autosaveTimersRef = useRef<Record<string, any>>({});
    const autosavingKeysRef = useRef<Set<string>>(new Set());
    const scheduleAutosave = (key: string) => {
        const t = autosaveTimersRef.current[key];
        if (t) clearTimeout(t);
        autosaveTimersRef.current[key] = setTimeout(async () => {
            const d = draftRows.find((r) => r.key === key);
            if (!d || !isDraftSavable(d) || autosavingKeysRef.current.has(key))
                return;
            autosavingKeysRef.current.add(key);
            try {
                const username = (d.email || '').split('@')[0] || d.email;
                const payload = {
                    username,
                    firstName: d.firstName.trim(),
                    middleName: d.middleName.trim() || undefined,
                    lastName: d.lastName.trim(),
                    email: d.email.trim(),
                    startDate: d.startDate,
                    endDate: d.endDate || undefined,
                    groupName:
                        d.assignedGroups[0] || userGroups[0]?.name || 'Default',
                } as Omit<UserRecord, 'id' | 'updatedAt'>;
                await api.post<UserRecord>('/api/users', payload);
                await loadUsers();
                // Replace the saved draft with a new blank draft to keep adding quickly
                setDraftRows((prev) =>
                    prev.map((r) => (r.key === key ? makeBlankDraft() : r)),
                );
            } catch {
            } finally {
                autosavingKeysRef.current.delete(key);
            }
        }, 600);
    };

    const handleCreateClick = () => {
        // Create a blank user row with default values
        const newUserId = `user-${Date.now()}`;
        const blankUser = {
            id: newUserId,
            firstName: '',
            middleName: '',
            lastName: '',
            emailAddress: '',
            status: '',
            locked: false,
            startDate: '',
            endDate: '',
            password: '••••••••',
            technicalUser: false,
            assignedUserGroup: [],
            // Table interaction properties for advanced table
            selected: false,
            expanded: false,
            editing: false,
        };

        // Add the new user at the top of the existing users
        setTableData((prevData) => [blankUser, ...prevData]);

        // Show a brief success animation on the button
        const button = document.querySelector(
            '.inline-flex.items-center.px-4.py-2\\.5',
        );
        if (button) {
            button.classList.add('animate-pulse', 'bg-green-600');
            setTimeout(() => {
                button.classList.remove('animate-pulse', 'bg-green-600');
            }, 1000);
        }
        setShowUserTable(true);
        setShowCreateInline(false);
        setOpenDatePopover(null);
        setOpenPasswordPopover(false);
        setGroupsHoverOpen(false);
    };
    const [confirmByKey, setConfirmByKey] = useState<Record<string, string>>(
        {},
    );

    const upsertUser = async (
        data: Omit<UserRecord, 'id' | 'updatedAt'>,
        id?: string,
    ) => {
        try {
            setLoading(true);

            // Transform data to backend format
            const userData = {
                firstName: data.firstName,
                middleName: data.middleName || null,
                lastName: data.lastName,
                emailAddress: data.email,
                status: data.status || '',
                startDate: data.startDate,
                endDate: data.endDate || null,
                password: 'TempPassword123!', // Should be handled differently in real app
                technicalUser: (data as any).technicalUser || false,
                assignedUserGroups: (data as any).assignedGroupIds || [], // Include assigned group IDs
            };

            if (id) {
                // Update existing user
                const numericId = parseInt(id.toString(), 10);
                if (isNaN(numericId)) {
                    throw new Error(`Invalid user ID for update: ${id}`);
                }
                await userService.updateUser(numericId, userData as any);
            } else {
                // Create new user
                await userService.createUser(userData as any);
            }

            // Reload users from backend
            const response = await userService.getUsers({limit: 100});
            if (response.success) {
                const transformedUsers = response.data.users.map((user: any) =>
                    userService.transformToFrontendFormat(user),
                );
                setTableData(transformedUsers);
                setUsers(
                    transformedUsers.map((user: any) => ({
                        id: user.id.toString(),
                        username: user.emailAddress,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.emailAddress,
                        startDate: user.startDate,
                        endDate: user.endDate,
                        technicalUser: user.technicalUser,
                        groupName: Array.isArray(user.assignedUserGroup)
                            ? user.assignedUserGroup
                                  .map((g: any) => g.groupName || g)
                                  .join(', ')
                            : user.assignedUserGroup || '',
                        updatedAt: user.updatedAt,
                        status: user.status,
                    })),
                );
            }

            setShowModal(false);
            setEditing(null);
        } catch (error) {
            console.error('Error saving user:', error);
            alert(`Failed to save user: ${(error as any).message || error}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id: string) => {
        setPendingDeleteId(id);
    };

    return (
        <div className='h-full bg-secondary flex flex-col relative'>
            {/* Backdrop for sliding pane */}
            {slidingPaneOpen && (
                <div
                    className='fixed inset-0 bg-black bg-opacity-20 z-40 transition-all duration-300'
                    style={{left: '0', top: '0', right: '0', bottom: '0'}}
                />
            )}

            <div className='bg-card border-b border-light px-6 py-4'>
                <div className='flex items-center justify-between'>
                    <div>
                        <h1 className='text-xl font-bold text-primary'>
                            Manage Users
                        </h1>
                        {/* DEBUG: Test Auto-Save Button */}
                        <p className='text-sm text-secondary mt-1'>
                            Create and manage user accounts with roles,
                            permissions, groups, access levels, and secure
                            password policies.
                        </p>
                    </div>
                </div>
            </div>

            <div className='bg-card border-b border-light px-6 py-4'>
                <div className='flex items-center justify-start gap-2'>
                    <button
                        onClick={handleCreateClick}
                        className='inline-flex items-center px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-inverse bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200'
                    >
                        <PlusIcon className='h-5 w-5 mr-2' />
                        Create New user
                    </button>

                    {/* Search Button */}
                    <div className='flex items-center'>
                        {showSearchBar && (
                            <div className='relative w-72 mr-3'>
                                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                                    <MagnifyingGlassIcon className='h-5 w-5 text-secondary' />
                                </div>
                                <input
                                    type='text'
                                    placeholder='Search users...'
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className='block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400'
                                    autoFocus
                                />
                            </div>
                        )}
                        <button
                            onClick={() => setShowSearchBar((v) => !v)}
                            className={`group relative flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-medium transition-all duration-300 transform hover:scale-105 ${
                                showSearchBar
                                    ? 'border-blue-300 bg-blue-50 text-blue-600 shadow-blue-200 shadow-lg'
                                    : 'border-gray-200 bg-white text-gray-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 hover:shadow-lg'
                            }`}
                        >
                            <svg
                                className={`w-4 h-4 transition-transform duration-300 ${
                                    showSearchBar
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
                            {showSearchBar && (
                                <div className='absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-blue-500 rounded-full animate-pulse'></div>
                            )}
                        </button>
                    </div>

                    {/* Filter Button */}
                    <div className='relative' ref={filterRef}>
                        <button
                            onClick={() => setFilterVisible(!filterVisible)}
                            className={`group relative flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-medium transition-all duration-300 transform hover:scale-105 ${
                                filterVisible ||
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

                        {/* Filter Dropdown */}
                        {filterVisible && (
                            <div className='absolute top-full mt-2 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-80'>
                                <div className='p-4'>
                                    <div className='text-sm font-medium text-gray-700 mb-3'>
                                        Apply Filters:
                                    </div>

                                    {/* Status Filter */}
                                    <div className='mb-3'>
                                        <label className='block text-xs font-medium text-gray-600 mb-1'>
                                            Status:
                                        </label>
                                        <select
                                            value={activeFilters.status || ''}
                                            onChange={(e) =>
                                                handleFilter(
                                                    'status',
                                                    e.target.value,
                                                )
                                            }
                                            className='w-full p-2 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                                        >
                                            <option value=''>
                                                All Statuses
                                            </option>
                                            <option value='Active'>
                                                Active
                                            </option>
                                            <option value='Inactive'>
                                                Inactive
                                            </option>
                                        </select>
                                    </div>

                                    {/* First Name Filter */}
                                    <div className='mb-3'>
                                        <label className='block text-xs font-medium text-gray-600 mb-1'>
                                            First Name:
                                        </label>
                                        <input
                                            type='text'
                                            value={
                                                activeFilters.firstName || ''
                                            }
                                            onChange={(e) =>
                                                handleFilter(
                                                    'firstName',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder='Search by first name...'
                                            className='w-full p-2 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                                        />
                                    </div>

                                    {/* Email Filter */}
                                    <div className='mb-4'>
                                        <label className='block text-xs font-medium text-gray-600 mb-1'>
                                            Email:
                                        </label>
                                        <input
                                            type='text'
                                            value={
                                                activeFilters.emailAddress || ''
                                            }
                                            onChange={(e) =>
                                                handleFilter(
                                                    'emailAddress',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder='Search by email...'
                                            className='w-full p-2 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                                        />
                                    </div>

                                    {/* Action Buttons */}
                                    <div className='flex gap-2'>
                                        <button
                                            onClick={clearFilters}
                                            className='px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded border border-red-200'
                                        >
                                            Clear All
                                        </button>
                                        <button
                                            onClick={() =>
                                                setFilterVisible(false)
                                            }
                                            className='px-3 py-1 text-sm text-purple-600 hover:bg-purple-50 rounded border border-purple-200'
                                        >
                                            Apply
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sort Button */}
                    <div className='relative' ref={sortRef}>
                        <button
                            onClick={() => setSortVisible(!sortVisible)}
                            className={`group relative flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-medium transition-all duration-300 transform hover:scale-105 ${
                                sortVisible || sortConfig
                                    ? 'border-green-300 bg-green-50 text-green-600 shadow-green-200 shadow-lg'
                                    : 'border-gray-200 bg-white text-gray-600 hover:border-green-200 hover:bg-green-50 hover:text-green-600 hover:shadow-lg'
                            }`}
                        >
                            <svg
                                className={`w-4 h-4 transition-transform duration-300 ${
                                    sortVisible
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
                            <span className='text-sm'>Sort</span>
                            {sortConfig && (
                                <div className='absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-bounce'></div>
                            )}
                            <div className='absolute inset-0 rounded-lg bg-gradient-to-r from-green-400 to-blue-400 opacity-0 group-hover:opacity-10 transition-opacity duration-300 -z-10'></div>
                        </button>

                        {/* Sort Dropdown */}
                        {sortVisible && (
                            <div className='absolute top-full mt-2 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-48'>
                                <div className='p-2'>
                                    <div className='text-xs font-medium text-gray-500 px-2 py-1 mb-1'>
                                        Sort by:
                                    </div>
                                    {[
                                        'firstName',
                                        'lastName',
                                        'emailAddress',
                                        'status',
                                        'startDate',
                                    ].map((column) => (
                                        <button
                                            key={column}
                                            onClick={() => handleSort(column)}
                                            className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 flex items-center justify-between ${
                                                sortConfig?.column === column
                                                    ? 'bg-green-50 text-green-600'
                                                    : 'text-gray-700'
                                            }`}
                                        >
                                            <span className='capitalize'>
                                                {column
                                                    .replace(/([A-Z])/g, ' $1')
                                                    .trim()}
                                            </span>
                                            {sortConfig?.column === column && (
                                                <span className='text-xs'>
                                                    {sortConfig.direction ===
                                                    'asc'
                                                        ? '↑'
                                                        : '↓'}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                    {sortConfig && (
                                        <div className='border-t border-gray-100 mt-1 pt-1'>
                                            <button
                                                onClick={() => {
                                                    setSortConfig(null);
                                                    setSortVisible(false);
                                                }}
                                                className='w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded'
                                            >
                                                Clear sorting
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Group By Button */}
                    <div className='relative' ref={groupByRef}>
                        <button
                            onClick={() => setGroupByVisible(!groupByVisible)}
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

                        {/* Group By Dropdown */}
                        {groupByVisible && (
                            <div className='absolute top-full mt-2 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-48'>
                                <div className='p-2'>
                                    <div className='text-xs font-medium text-gray-500 px-2 py-1 mb-1'>
                                        Group by:
                                    </div>
                                    {[
                                        {id: 'status', label: 'Status'},
                                        {id: 'groupName', label: 'Group Name'},
                                        {id: 'startDate', label: 'Start Date'},
                                        {id: 'department', label: 'Department'},
                                    ].map((option) => (
                                        <button
                                            key={option.id}
                                            onClick={() => {
                                                handleGroupBy(option.id);
                                                setGroupByVisible(false);
                                            }}
                                            className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 ${
                                                selectedGroupBy === option.id
                                                    ? 'bg-orange-50 text-orange-600'
                                                    : 'text-gray-700'
                                            }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                    {selectedGroupBy && (
                                        <div className='border-t border-gray-100 mt-1 pt-1'>
                                            <button
                                                onClick={() => {
                                                    setSelectedGroupBy('');
                                                    setGroupByVisible(false);
                                                }}
                                                className='w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded'
                                            >
                                                Clear grouping
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Hide Columns Button */}
                    <div className='relative' ref={hideColumnsRef}>
                        <button
                            onClick={() =>
                                setHideColumnsVisible(!hideColumnsVisible)
                            }
                            className={`group relative flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-medium transition-all duration-300 transform hover:scale-105 ${
                                hiddenColumns.length > 0
                                    ? 'border-red-300 bg-red-50 text-red-600 shadow-red-200 shadow-lg'
                                    : 'border-gray-200 bg-white text-gray-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600 hover:shadow-lg'
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
                                    d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21'
                                />
                            </svg>
                            <span className='text-sm'>Hide</span>
                            {hiddenColumns.length > 0 && (
                                <div className='absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-bounce'></div>
                            )}
                            <div className='absolute inset-0 rounded-lg bg-gradient-to-r from-red-400 to-orange-400 opacity-0 group-hover:opacity-10 transition-opacity duration-300 -z-10'></div>
                        </button>

                        {/* Hide Columns Dropdown */}
                        {hideColumnsVisible && (
                            <div className='absolute top-full mt-2 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-64'>
                                <div className='p-3'>
                                    <div className='text-sm font-medium text-gray-700 mb-3'>
                                        Show/Hide Columns:
                                    </div>
                                    {[
                                        {id: 'firstName', label: 'First Name'},
                                        {id: 'lastName', label: 'Last Name'},
                                        {id: 'emailAddress', label: 'Email'},
                                        {id: 'startDate', label: 'Start Date'},
                                        {id: 'endDate', label: 'End Date'},
                                        {id: 'status', label: 'Status'},
                                        {
                                            id: 'assignedUserGroup',
                                            label: 'User Groups',
                                        },
                                        {id: 'password', label: 'Password'},
                                    ].map((column) => (
                                        <label
                                            key={column.id}
                                            className='flex items-center justify-between px-2 py-2 hover:bg-gray-50 rounded cursor-pointer'
                                        >
                                            <span className='text-sm text-gray-700'>
                                                {column.label}
                                            </span>
                                            <input
                                                type='checkbox'
                                                checked={
                                                    !hiddenColumns.includes(
                                                        column.id,
                                                    )
                                                }
                                                onChange={() =>
                                                    toggleColumnVisibility(
                                                        column.id,
                                                    )
                                                }
                                                className='w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500'
                                            />
                                        </label>
                                    ))}
                                    {hiddenColumns.length > 0 && (
                                        <div className='border-t border-gray-100 mt-2 pt-2'>
                                            <button
                                                onClick={() => {
                                                    setHiddenColumns([]);
                                                    setHideColumnsVisible(
                                                        false,
                                                    );
                                                }}
                                                className='w-full text-left px-2 py-1 text-sm text-green-600 hover:bg-green-50 rounded'
                                            >
                                                Show All Columns
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* inline expanding search input is above; no dropdown */}
            </div>

            {/* ReusableTableComponent for Creating New Users */}
            {showUserTable && (
                <div className='bg-card border-b border-light px-6 py-4'>
                    <div className='mb-4'>
                        <div>
                            <h2 className='text-lg font-semibold text-primary'>
                                User Details
                            </h2>
                            <p className='text-sm text-secondary'></p>
                        </div>
                    </div>
                </div>
            )}
            {showUserTable && (
                <div
                    className='bg-card w-full overflow-x-auto overflow-y-visible table-container'
                    style={
                        {
                            maxWidth: '100vw',
                            minWidth: '100%',
                            '--column-header-height': '32px',
                            '--row-height': '36px',
                            padding: '0',
                            margin: '0',
                            overflowX: 'auto',
                            overflowY: 'visible',
                            whiteSpace: 'nowrap',
                        } as React.CSSProperties
                    }
                >
                    <div
                        className='min-w-max advanced-table-container compact-mode modern-table-wrapper'
                        style={{
                            minWidth: '1200px',
                            width: 'max-content',
                            margin: 0,
                            padding: 0,
                            overflowX: 'visible',
                        }}
                        data-advanced-features='true'
                        data-compact-mode='true'
                        data-modern-ui='true'
                    >
                        {loading ? (
                            <div className='flex justify-center items-center py-8'>
                                <div className='text-center'>
                                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2'></div>
                                    <p className='text-gray-600'>
                                        Loading users...
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div
                                className='advanced-table-container compact-mode modern-table-wrapper'
                                data-advanced-features='true'
                                data-compact-mode='true'
                                data-modern-ui='true'
                            >
                                <ReusableTableComponent
                                    config={
                                        {
                                            ...ManageUsers_tableConfig,
                                            initialData: processedTableData,
                                            savingStates: savingStates,
                                            customHeaderRenderer:
                                                renderColumnHeader,

                                            // FORCE ALL ADVANCED FEATURES ON
                                            features: {
                                                ...ManageUsers_tableConfig.features,
                                                dragAndDrop: true,
                                                hoverControls: true,
                                                inlineEditing: true,
                                                compactRows: true,
                                                modernMicroInteractions: true,
                                                animatedTransitions: true,
                                                sortableColumns: true,
                                                rowHoverEffect: true,
                                                selectionHighlight: true,
                                                modernIcons: true,
                                                svgIcons: true,
                                                autoSave: true,
                                                virtualScrolling: false,
                                                optimizedRendering: true,
                                            },

                                            ui: {
                                                ...ManageUsers_tableConfig.ui,
                                                enableAdvancedFeatures: true,
                                                showDragHandles: true,
                                                enableHoverControls: true,
                                                enableSortableHeaders: true,
                                                enableCompactMode: true,
                                                showModernIcons: true,
                                                enableMicroInteractions: true,
                                                modernTableStyling: true,
                                            },

                                            theme: {
                                                ...ManageUsers_tableConfig.theme,
                                                modernIcons: true,
                                                svgIcons: true,
                                                rowHeight: 'compact',
                                                iconSize: '14px',
                                            },

                                            // Direct prop overrides
                                            enableDragAndDrop: true,
                                            enableHoverControls: true,
                                            enableSortableHeaders: true,
                                            enableCompactMode: true,
                                            enableModernUI: true,
                                            showAdvancedFeatures: true,
                                            modernIcons: true,
                                            svgIcons: true,

                                            actions: {
                                                ...ManageUsers_tableConfig.actions,
                                                onSave: async (data: any) => {
                                                    console.log(
                                                        'Saving user data:',
                                                        data,
                                                    );

                                                    try {
                                                        // Transform data to backend format
                                                        const userData =
                                                            userService.transformToBackendFormat(
                                                                data,
                                                            );

                                                        if (data.id) {
                                                            // Update existing user
                                                            const numericId =
                                                                parseInt(
                                                                    data.id.toString(),
                                                                    10,
                                                                );
                                                            if (
                                                                isNaN(numericId)
                                                            ) {
                                                                throw new Error(
                                                                    `Invalid user ID for update: ${data.id}`,
                                                                );
                                                            }
                                                            const response =
                                                                await userService.updateUser(
                                                                    numericId,
                                                                    userData as any,
                                                                );
                                                            console.log(
                                                                'User updated successfully:',
                                                                response,
                                                            );
                                                        } else {
                                                            // Create new user
                                                            const response =
                                                                await userService.createUser(
                                                                    userData as any,
                                                                );
                                                            console.log(
                                                                'User created successfully:',
                                                                response,
                                                            );

                                                            // Update the data with the new ID
                                                            data.id = (
                                                                response as any
                                                            ).data.id;
                                                        }

                                                        // Show success message
                                                        alert(
                                                            'User saved successfully!',
                                                        );
                                                    } catch (error) {
                                                        console.error(
                                                            'Error saving user:',
                                                            error,
                                                        );
                                                        alert(
                                                            `Failed to save user: ${
                                                                (error as any)
                                                                    .message ||
                                                                error
                                                            }`,
                                                        );
                                                    }
                                                },
                                                onDataChange: handleDataChange,
                                            },
                                        } as any
                                    }
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* FORCE ADVANCED TABLE STYLING */}
            <style jsx>{`
                /* Force Advanced Table Features - HIGH SPECIFICITY */
                .advanced-table-container .task-group {
                    display: flex !important;
                    flex-direction: column !important;
                    gap: 4px !important;
                    background: #ffffff !important;
                    border-radius: 8px !important;
                    padding: 8px !important;
                    border: 1px solid #e5e7eb !important;
                }

                .advanced-table-container .task-group.compact-mode {
                    padding: 4px !important;
                    gap: 2px !important;
                }

                /* Modern Header Styling */
                .advanced-table-container .table-header,
                .advanced-table-container .sortable-header-container {
                    background: linear-gradient(
                        90deg,
                        #f8fafc 0%,
                        #f1f5f9 100%
                    ) !important;
                    border-left: 4px solid #4ba3ff !important;
                    border-bottom: 1px solid #e1ecf7 !important;
                    display: grid !important;
                    grid-template-columns: 40px 120px 110px 120px 140px 50px 120px 120px 80px 50px 150px !important;
                    align-items: center !important;
                    padding: 2px 8px !important;
                    margin: 0 !important;
                    min-height: 24px !important;
                    height: 24px !important;
                }

                /* Column Headers */
                .advanced-table-container .column-header {
                    display: flex !important;
                    align-items: center !important;
                    gap: 4px !important;
                    padding: 2px 8px !important;
                    font-size: 11px !important;
                    font-weight: 600 !important;
                    color: #374151 !important;
                    text-transform: none !important;
                    line-height: 1.2 !important;
                    border-right: 1px solid #e5e7eb !important;
                }

                /* SVG Icons in Headers */
                .advanced-table-container .cell-icon {
                    width: 14px !important;
                    height: 14px !important;
                    color: #6b7280 !important;
                    flex-shrink: 0 !important;
                    opacity: 0.8 !important;
                }

                /* Task Rows - Advanced Features */
                .advanced-table-container .task-row {
                    display: grid !important;
                    grid-template-columns: 40px 120px 110px 120px 140px 50px 120px 120px 80px 50px 150px !important;
                    align-items: center !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    border-left: 4px solid #4ba3ff !important;
                    border-bottom: 1px solid #f3f4f6 !important;
                    background: #ffffff !important;
                    transition: all 0.2s ease !important;
                    position: relative !important;
                    min-height: 32px !important;
                }

                .advanced-table-container .task-row:first-child {
                    margin-top: 0 !important;
                    border-top: none !important;
                    padding-top: 0 !important;
                }

                /* Hover Effects */
                .advanced-table-container .task-row:hover {
                    background: linear-gradient(
                        90deg,
                        #f8fafc 0%,
                        #ffffff 100%
                    ) !important;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
                    transform: translateX(2px) !important;
                }

                /* Drag Handle - Show on hover */
                .advanced-table-container .task-row::before {
                    content: '⋮⋮' !important;
                    position: absolute !important;
                    left: -20px !important;
                    top: 50% !important;
                    transform: translateY(-50%) !important;
                    font-size: 12px !important;
                    color: #9ca3af !important;
                    cursor: grab !important;
                    opacity: 0 !important;
                    transition: opacity 0.2s ease !important;
                    background: #ffffff !important;
                    padding: 2px 4px !important;
                    border-radius: 2px !important;
                    border: 1px solid #e5e7eb !important;
                    font-family: monospace !important;
                    line-height: 1 !important;
                }

                .advanced-table-container .task-row:hover::before {
                    opacity: 1 !important;
                }

                /* Dragging State */
                .advanced-table-container .task-row.dragging {
                    opacity: 0.5 !important;
                    transform: rotate(5deg) !important;
                    z-index: 1000 !important;
                }

                /* Drop Target */
                .advanced-table-container .task-row.drop-target::after {
                    content: '' !important;
                    position: absolute !important;
                    top: -2px !important;
                    left: 0 !important;
                    right: 0 !important;
                    height: 4px !important;
                    background: #4ba3ff !important;
                    border-radius: 2px !important;
                }

                /* Task Cells */
                .advanced-table-container .task-cell {
                    padding: 4px 8px !important;
                    font-size: 12px !important;
                    color: #374151 !important;
                    border-right: 1px solid #f3f4f6 !important;
                    display: flex !important;
                    align-items: center !important;
                    min-height: 32px !important;
                    line-height: 1.3 !important;
                }

                /* Cell Inputs for Inline Editing */
                .advanced-table-container .task-cell input,
                .advanced-table-container .task-cell select {
                    width: 100% !important;
                    border: 1px solid #d1d5db !important;
                    border-radius: 3px !important;
                    padding: 2px 6px !important;
                    font-size: 12px !important;
                    background: #ffffff !important;
                    transition: border-color 0.2s ease !important;
                }

                .advanced-table-container .task-cell input:focus,
                .advanced-table-container .task-cell select:focus {
                    border-color: #4ba3ff !important;
                    outline: none !important;
                    box-shadow: 0 0 0 2px rgba(75, 163, 255, 0.1) !important;
                }

                /* Checkbox Styling */
                .advanced-table-container input[type='checkbox'] {
                    width: 16px !important;
                    height: 16px !important;
                    accent-color: #4ba3ff !important;
                    cursor: pointer !important;
                }

                /* Status Toggle Button */
                .advanced-table-container .status-toggle-button {
                    padding: 2px 8px !important;
                    border-radius: 12px !important;
                    font-size: 10px !important;
                    font-weight: 600 !important;
                    border: none !important;
                    cursor: pointer !important;
                    transition: all 0.2s ease !important;
                    min-width: 50px !important;
                    max-width: 50px !important;
                    width: 50px !important;
                    text-align: center !important;
                }

                .advanced-table-container .status-toggle-button.active {
                    background: #dcfce7 !important;
                    color: #16a34a !important;
                }

                .advanced-table-container .status-toggle-button.inactive {
                    background: #fef2f2 !important;
                    color: #dc2626 !important;
                }

                /* Auto-save Indicators */
                .advanced-table-container .auto-save-indicator {
                    position: absolute !important;
                    top: 2px !important;
                    right: 4px !important;
                    font-size: 10px !important;
                    padding: 1px 4px !important;
                    border-radius: 2px !important;
                    font-weight: 500 !important;
                }

                .advanced-table-container .auto-save-indicator.saving {
                    background: #fef3c7 !important;
                    color: #d97706 !important;
                    animation: pulse 1s infinite !important;
                }

                .advanced-table-container .auto-save-indicator.saved {
                    background: #dcfce7 !important;
                    color: #16a34a !important;
                }

                .advanced-table-container .auto-save-indicator.error {
                    background: #fef2f2 !important;
                    color: #dc2626 !important;
                }

                /* Row Selection */
                .advanced-table-container .task-row.selected {
                    background: linear-gradient(
                        90deg,
                        #eff6ff 0%,
                        #f0f9ff 100%
                    ) !important;
                    border-left-color: #2563eb !important;
                }

                /* Hover Controls */
                .advanced-table-container .hover-controls {
                    position: absolute !important;
                    right: 8px !important;
                    top: 50% !important;
                    transform: translateY(-50%) !important;
                    display: flex !important;
                    gap: 4px !important;
                    opacity: 0 !important;
                    transition: opacity 0.2s ease !important;
                    background: #ffffff !important;
                    border: 1px solid #e5e7eb !important;
                    border-radius: 4px !important;
                    padding: 2px !important;
                }

                .advanced-table-container .task-row:hover .hover-controls {
                    opacity: 1 !important;
                }

                .advanced-table-container .hover-control-btn {
                    padding: 2px 4px !important;
                    border: none !important;
                    background: transparent !important;
                    cursor: pointer !important;
                    border-radius: 2px !important;
                    font-size: 10px !important;
                    color: #6b7280 !important;
                    transition: all 0.15s ease !important;
                }

                .advanced-table-container .hover-control-btn:hover {
                    background: #f3f4f6 !important;
                    color: #374151 !important;
                }

                /* Add Button Styling */
                .advanced-table-container .add-column-button {
                    background: none !important;
                    border: none !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    box-shadow: none !important;
                    border-radius: 0 !important;
                    font-size: 14px !important;
                    color: #4ba3ff !important;
                    cursor: pointer !important;
                    transition: color 0.2s ease !important;
                }

                .advanced-table-container .add-column-button:hover {
                    color: #2563eb !important;
                    background: none !important;
                    border: none !important;
                    box-shadow: none !important;
                }

                /* Compact Mode Overrides */
                .advanced-table-container.compact-mode .task-row {
                    min-height: 28px !important;
                }

                .advanced-table-container.compact-mode .task-cell {
                    padding: 2px 6px !important;
                    min-height: 28px !important;
                }

                .advanced-table-container.compact-mode .column-header {
                    padding: 1px 6px !important;
                }

                /* Force visibility of advanced features */
                .advanced-table-container[data-advanced-features='true']
                    .task-group {
                    display: flex !important;
                }

                .advanced-table-container[data-modern-ui='true']
                    .task-row::before {
                    display: block !important;
                }

                /* Animations */
                @keyframes pulse {
                    0%,
                    100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.5;
                    }
                }

                /* Force show drag handles and modern features */
                .advanced-table-container
                    .task-group.advanced-table-features
                    .task-row::before,
                .advanced-table-container
                    .task-group.modern-ui-enabled
                    .task-row::before {
                    display: block !important;
                }

                /* Ensure table container takes full width and handles overflow */
                .advanced-table-container {
                    width: 100% !important;
                    max-width: 100vw !important;
                    overflow-x: auto !important;
                    overflow-y: visible !important;
                }

                /* Responsive table adjustments */
                .advanced-table-container .task-group {
                    min-width: 900px !important;
                    max-width: 100% !important;
                }

                /* Ensure columns don't exceed container */
                .advanced-table-container .task-row,
                .advanced-table-container .table-header {
                    max-width: 100% !important;
                }

                /* Add scrollbar styling for better UX */
                .advanced-table-container::-webkit-scrollbar {
                    height: 6px !important;
                }

                .advanced-table-container::-webkit-scrollbar-track {
                    background: #f1f1f1 !important;
                    border-radius: 3px !important;
                }

                .advanced-table-container::-webkit-scrollbar-thumb {
                    background: #c1c1c1 !important;
                    border-radius: 3px !important;
                }

                .advanced-table-container::-webkit-scrollbar-thumb:hover {
                    background: #a8a8a8 !important;
                }

                /* Additional Table Container Styles */
                .table-container :global(.column-header) {
                    padding: 4px 8px !important;
                    min-height: 32px !important;
                    height: 32px !important;
                    font-size: 11px !important;
                    font-weight: 700 !important;
                    color: #1f2937 !important;
                }

                .table-container :global(.task-row) {
                    min-height: 36px !important;
                    height: 36px !important;
                    cursor: grab !important;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
                    transform-origin: center !important;
                    will-change: transform, opacity, box-shadow !important;
                }

                .table-container :global(.task-row:hover) {
                    cursor: grab !important;
                    background-color: #f0f8ff !important;
                    transform: translateY(-1px) !important;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
                }

                .table-container :global(.task-row[data-is-dragging='true']) {
                    cursor: grabbing !important;
                    opacity: 0.9 !important;
                    transform: rotate(-1deg) scale(1.01) translateY(-4px) !important;
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15),
                        0 4px 10px rgba(0, 0, 0, 0.1) !important;
                    z-index: 1000 !important;
                    transition: none !important;
                    border-radius: 4px !important;
                    background-color: #ffffff !important;
                }

                .table-container :global(.task-cell) {
                    padding: 4px 8px !important;
                    min-height: 36px !important;
                    height: 36px !important;
                }

                /* Performance optimizations for smooth drag and drop */
                .table-container :global(.task-list) {
                    transform: translateZ(0) !important;
                    backface-visibility: hidden !important;
                }
            `}</style>

            <div className='flex-1 p-6'>
                {showCreateInline && (
                    <div className='mb-6 overflow-x-auto bg-white border border-slate-200 rounded-2xl shadow-sm'>
                        <table className='min-w-full divide-y divide-slate-100'>
                            <thead className='bg-tertiary/40'>
                                <tr>
                                    <th className='px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider'>
                                        First name *
                                    </th>
                                    <th className='px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider'>
                                        Middle name
                                    </th>
                                    <th className='px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider'>
                                        Last name *
                                    </th>
                                    <th className='px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider'>
                                        Email address *
                                    </th>
                                    <th className='px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider'>
                                        Status *
                                    </th>
                                    <th className='px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider'>
                                        Lock/Unlock
                                    </th>
                                    <th className='px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider'>
                                        Start date *
                                    </th>
                                    <th className='px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider'>
                                        End date
                                    </th>
                                    <th className='px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider'>
                                        Password
                                    </th>
                                    <th className='px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider'>
                                        Assigned user group
                                    </th>
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-slate-100'>
                                {draftRows.map((row) => (
                                    <tr key={row.key}>
                                        <td className='px-4 py-3'>
                                            <input
                                                value={row.firstName}
                                                maxLength={50}
                                                onChange={(e) => {
                                                    setDraftRows((prev) =>
                                                        prev.map((r) =>
                                                            r.key === row.key
                                                                ? {
                                                                      ...r,
                                                                      firstName:
                                                                          e
                                                                              .target
                                                                              .value,
                                                                  }
                                                                : r,
                                                        ),
                                                    );
                                                    scheduleAutosave(row.key);
                                                }}
                                                className='w-full px-2 py-1.5 border border-light rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-brand'
                                            />
                                        </td>
                                        <td className='px-4 py-3'>
                                            <input
                                                value={row.middleName}
                                                maxLength={50}
                                                onChange={(e) => {
                                                    setDraftRows((prev) =>
                                                        prev.map((r) =>
                                                            r.key === row.key
                                                                ? {
                                                                      ...r,
                                                                      middleName:
                                                                          e
                                                                              .target
                                                                              .value,
                                                                  }
                                                                : r,
                                                        ),
                                                    );
                                                    scheduleAutosave(row.key);
                                                }}
                                                className='w-full px-2 py-1.5 border border-light rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-brand'
                                            />
                                        </td>
                                        <td className='px-4 py-3'>
                                            <input
                                                value={row.lastName}
                                                maxLength={50}
                                                onChange={(e) => {
                                                    setDraftRows((prev) =>
                                                        prev.map((r) =>
                                                            r.key === row.key
                                                                ? {
                                                                      ...r,
                                                                      lastName:
                                                                          e
                                                                              .target
                                                                              .value,
                                                                  }
                                                                : r,
                                                        ),
                                                    );
                                                    scheduleAutosave(row.key);
                                                }}
                                                className='w-full px-2 py-1.5 border border-light rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-brand'
                                            />
                                        </td>
                                        <td className='px-4 py-3'>
                                            <input
                                                type='email'
                                                value={row.email}
                                                onChange={(e) => {
                                                    setDraftRows((prev) =>
                                                        prev.map((r) =>
                                                            r.key === row.key
                                                                ? {
                                                                      ...r,
                                                                      email: e
                                                                          .target
                                                                          .value,
                                                                  }
                                                                : r,
                                                        ),
                                                    );
                                                    scheduleAutosave(row.key);
                                                }}
                                                className='w-full px-2 py-1.5 border border-light rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-brand'
                                            />
                                        </td>
                                        <td className='px-4 py-3'>
                                            <button
                                                onClick={() => {
                                                    setDraftRows((prev) =>
                                                        prev.map((r) =>
                                                            r.key === row.key
                                                                ? {
                                                                      ...r,
                                                                      status:
                                                                          r.status ===
                                                                          'Active'
                                                                              ? 'Inactive'
                                                                              : 'Active',
                                                                  }
                                                                : r,
                                                        ),
                                                    );
                                                    scheduleAutosave(row.key);
                                                }}
                                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                                                    row.status === 'Active'
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        : 'bg-slate-100 text-slate-600 border-slate-200'
                                                }`}
                                            >
                                                {row.status}
                                            </button>
                                        </td>
                                        <td className='px-4 py-3'>
                                            <button
                                                onClick={() => {
                                                    setDraftRows((prev) =>
                                                        prev.map((r) =>
                                                            r.key === row.key
                                                                ? {
                                                                      ...r,
                                                                      locked: !r.locked,
                                                                  }
                                                                : r,
                                                        ),
                                                    );
                                                    scheduleAutosave(row.key);
                                                }}
                                                className={`inline-flex items-center px-2.5 py-1.5 rounded-md border transition ${
                                                    row.locked
                                                        ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                                }`}
                                                title={
                                                    row.locked
                                                        ? 'Unlock'
                                                        : 'Lock'
                                                }
                                            >
                                                {row.locked ? (
                                                    <LockClosedIcon className='w-5 h-5' />
                                                ) : (
                                                    <LockOpenIcon className='w-5 h-5' />
                                                )}
                                            </button>
                                        </td>
                                        <td className='px-4 py-3'>
                                            <div className='relative inline-flex items-center gap-2 group'>
                                                <div className='relative'>
                                                    <input
                                                        readOnly
                                                        value={
                                                            row.startUseTime &&
                                                            row.startTime
                                                                ? `${row.startDate} ${row.startTime}`
                                                                : row.startDate
                                                        }
                                                        className='w-40 px-2 py-1.5 border border-light rounded-md bg-white'
                                                    />
                                                    <div className='absolute inset-y-0 right-1 flex items-center opacity-0 group-hover:opacity-100 transition-opacity'>
                                                        <button
                                                            onClick={(e) => {
                                                                setOpenDatePopover(
                                                                    {
                                                                        field: 'start',
                                                                        anchor: e.currentTarget as unknown as HTMLElement,
                                                                        key: row.key,
                                                                    },
                                                                );
                                                            }}
                                                            className='inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border border-light bg-tertiary hover:bg-slate-200'
                                                        >
                                                            <svg
                                                                className='w-4 h-4'
                                                                viewBox='0 0 24 24'
                                                                fill='none'
                                                                stroke='currentColor'
                                                                strokeWidth='2'
                                                            >
                                                                <rect
                                                                    x='3'
                                                                    y='4'
                                                                    width='18'
                                                                    height='18'
                                                                    rx='2'
                                                                />
                                                                <path d='M16 2v4M8 2v4M3 10h18' />
                                                            </svg>
                                                            +
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className='px-4 py-3'>
                                            <div className='relative inline-flex items-center gap-2 group'>
                                                <div className='relative'>
                                                    <input
                                                        readOnly
                                                        value={
                                                            row.endDate
                                                                ? row.endUseTime &&
                                                                  row.endTime
                                                                    ? `${row.endDate} ${row.endTime}`
                                                                    : row.endDate
                                                                : ''
                                                        }
                                                        placeholder='Select date'
                                                        className='w-40 px-2 py-1.5 border border-light rounded-md bg-white'
                                                    />
                                                    <div className='absolute inset-y-0 right-1 flex items-center opacity-0 group-hover:opacity-100 transition-opacity'>
                                                        <button
                                                            onClick={(e) => {
                                                                setOpenDatePopover(
                                                                    {
                                                                        field: 'end',
                                                                        anchor: e.currentTarget as unknown as HTMLElement,
                                                                        key: row.key,
                                                                    },
                                                                );
                                                            }}
                                                            className='inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border border-light bg-tertiary hover:bg-slate-200'
                                                        >
                                                            <svg
                                                                className='w-4 h-4'
                                                                viewBox='0 0 24 24'
                                                                fill='none'
                                                                stroke='currentColor'
                                                                strokeWidth='2'
                                                            >
                                                                <rect
                                                                    x='3'
                                                                    y='4'
                                                                    width='18'
                                                                    height='18'
                                                                    rx='2'
                                                                />
                                                                <path d='M16 2v4M8 2v4M3 10h18' />
                                                            </svg>
                                                            +
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className='px-4 py-3'>
                                            <div className='relative group'>
                                                <button
                                                    ref={(el) =>
                                                        setPasswordAnchor(el)
                                                    }
                                                    onClick={(e) => {
                                                        setPasswordAnchor(
                                                            e.currentTarget,
                                                        );
                                                        setPasswordKey(row.key);
                                                        setOpenPasswordPopover(
                                                            (v) => !v,
                                                        );
                                                    }}
                                                    className={`inline-flex items-center p-2 rounded-md border border-light transition ${
                                                        row.passwordSet
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                            : 'hover:bg-tertiary/60'
                                                    }`}
                                                    title={
                                                        row.passwordSet
                                                            ? 'Password set'
                                                            : 'Set password'
                                                    }
                                                >
                                                    <KeyIcon className='w-5 h-5' />
                                                </button>
                                            </div>
                                        </td>
                                        <td className='px-4 py-3'>
                                            <div className='relative inline-flex items-center gap-2 group'>
                                                <span className='inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-indigo-50 text-indigo-700 border-indigo-200'>
                                                    <UserGroupIcon className='w-4 h-4 mr-1' />
                                                    {row.assignedGroups.length >
                                                    0
                                                        ? row.assignedGroups.join(
                                                              ', ',
                                                          )
                                                        : 'None'}
                                                </span>
                                                <button
                                                    className='opacity-0 translate-x-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all inline-flex items-center px-2 py-1 text-xs rounded-md border border-light bg-tertiary hover:bg-slate-200'
                                                    onClick={(e) => {
                                                        setAssignGroupsAnchor(
                                                            e.currentTarget as unknown as HTMLElement,
                                                        );
                                                        setGroupsKey(row.key);
                                                        setAssignGroupsOpen(
                                                            true,
                                                        );
                                                    }}
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className='flex items-center justify-start px-4 py-3 border-t border-slate-100'>
                            <button
                                onClick={() => {
                                    setDraftRows((prev) => [
                                        ...prev,
                                        makeBlankDraft(),
                                    ]);
                                }}
                                className='inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg border border-light bg-tertiary hover:bg-slate-200 text-primary'
                            >
                                + Add new row
                            </button>
                        </div>
                    </div>
                )}
                {!showCreateInline &&
                !showUserTable &&
                filtered.length === 0 ? (
                    <div className='text-center py-16'>
                        <div className='w-16 h-16 bg-tertiary rounded-full flex items-center justify-center mx-auto mb-4'>
                            <svg
                                className='w-8 h-8 text-secondary'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'
                                />
                            </svg>
                        </div>
                        <h3 className='text-lg font-medium text-primary mb-1'>
                            No users yet
                        </h3>
                        <p className='text-secondary'>
                            Create your first user to get started.
                        </p>
                    </div>
                ) : !showCreateInline && !showUserTable ? (
                    <div className='w-full overflow-x-auto'>
                        <div
                            className='advanced-table-container compact-mode modern-table-wrapper'
                            data-advanced-features='true'
                            data-compact-mode='true'
                            data-modern-ui='true'
                            style={{
                                minWidth: '900px',
                                maxWidth: 'none',
                            }}
                        >
                            <ReusableTableComponent
                                config={
                                    {
                                        ...ManageUsers_tableConfig,
                                        initialData: processedTableData,
                                        savingStates: savingStates,
                                        customHeaderRenderer:
                                            renderColumnHeader,

                                        // FORCE ALL ADVANCED FEATURES ON
                                        features: {
                                            ...ManageUsers_tableConfig.features,
                                            dragAndDrop: true,
                                            hoverControls: true,
                                            inlineEditing: true,
                                            compactRows: true,
                                            modernMicroInteractions: true,
                                            animatedTransitions: true,
                                            sortableColumns: true,
                                            rowHoverEffect: true,
                                            selectionHighlight: true,
                                            modernIcons: true,
                                            svgIcons: true,
                                            autoSave: true,
                                            virtualScrolling: false,
                                            optimizedRendering: true,
                                        },

                                        ui: {
                                            ...ManageUsers_tableConfig.ui,
                                            enableAdvancedFeatures: true,
                                            showDragHandles: true,
                                            enableHoverControls: true,
                                            enableSortableHeaders: true,
                                            enableCompactMode: true,
                                            showModernIcons: true,
                                            enableMicroInteractions: true,
                                            modernTableStyling: true,
                                        },

                                        theme: {
                                            ...ManageUsers_tableConfig.theme,
                                            modernIcons: true,
                                            svgIcons: true,
                                            rowHeight: 'compact',
                                            iconSize: '14px',
                                        },

                                        // Direct prop overrides
                                        enableDragAndDrop: true,
                                        enableHoverControls: true,
                                        enableSortableHeaders: true,
                                        enableCompactMode: true,
                                        enableModernUI: true,
                                        showAdvancedFeatures: true,
                                        modernIcons: true,
                                        svgIcons: true,

                                        actions: {
                                            ...ManageUsers_tableConfig.actions,
                                            onSave: async (data: any) => {
                                                console.log(
                                                    'Saving user data:',
                                                    data,
                                                );

                                                try {
                                                    // Transform data to backend format
                                                    const userData =
                                                        userService.transformToBackendFormat(
                                                            data as any,
                                                        );

                                                    if (data.id) {
                                                        // Update existing user
                                                        const numericId =
                                                            parseInt(
                                                                data.id.toString(),
                                                                10,
                                                            );
                                                        if (isNaN(numericId)) {
                                                            throw new Error(
                                                                `Invalid user ID for update: ${data.id}`,
                                                            );
                                                        }
                                                        const response =
                                                            await userService.updateUser(
                                                                numericId,
                                                                userData as any,
                                                            );
                                                        console.log(
                                                            'User updated successfully:',
                                                            response,
                                                        );
                                                    } else {
                                                        // Create new user
                                                        const response =
                                                            await userService.createUser(
                                                                userData as any,
                                                            );
                                                        console.log(
                                                            'User created successfully:',
                                                            response,
                                                        );

                                                        // Update the data with the new ID
                                                        data.id = (
                                                            response as any
                                                        ).data.id;
                                                    }

                                                    // Show success message
                                                    alert(
                                                        'User saved successfully!',
                                                    );
                                                } catch (error) {
                                                    console.error(
                                                        'Error saving user:',
                                                        error,
                                                    );
                                                    alert(
                                                        `Failed to save user: ${
                                                            (error as any)
                                                                .message ||
                                                            error
                                                        }`,
                                                    );
                                                }
                                            },
                                            onDataChange: handleDataChange,
                                        },
                                    } as any
                                }
                            />
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
