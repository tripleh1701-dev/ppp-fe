'use client';

import React, {useState, useEffect, useCallback, useMemo, useRef} from 'react';
import {motion} from 'framer-motion';
import {BookmarkIcon} from '@heroicons/react/24/outline';
import ReusableTableComponent from '@/components/Manage_User/TableComponent';
import ManageUserGroups_tableConfig from '@/config/ManageUserGroups_tableConfig';
import RolesCountCell from '@/components/RolesCountCell';
import SimpleSlidingPanels from '@/components/SimpleSlidingPanels';

// Define types for better TypeScript support
interface UserGroup {
    id: string;
    groupName: string;
    description: string;
    entity: string;
    service: string;
    roles: string[];
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
            id='usergroups-trash-target'
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
                        '🚀 Dispatching usergroups-row-drop-trash event for rowId:',
                        rowId,
                    );
                    const event = new CustomEvent('usergroups-row-drop-trash', {
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

    // Auto-save timer states (10-second timer with countdown)
    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [autoSaveCountdown, setAutoSaveCountdown] = useState<number | null>(
        null,
    );
    const [isAutoSaving, setIsAutoSaving] = useState(false);
    const [showAutoSaveSuccess, setShowAutoSaveSuccess] = useState(false);
    const tableDataRef = useRef<UserGroup[]>([]);
    const [savingStates, setSavingStates] = useState<
        Record<string, 'saving' | 'saved' | 'error'>
    >({});

    // State for role assignment sliding panel
    const [showRolePanel, setShowRolePanel] = useState(false);
    const [selectedGroupForRoles, setSelectedGroupForRoles] =
        useState<UserGroup | null>(null);

    // Update ref to track current tableData state
    useEffect(() => {
        tableDataRef.current = tableData;
    }, [tableData]);

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
        console.log('🔵 ========================================');
        console.log('🔵 loadUserGroups FUNCTION CALLED');
        console.log('🔵 ========================================');
        setLoading(true);
        try {
            // Get selected account from localStorage
            const selectedAccountId =
                typeof window !== 'undefined'
                    ? window.localStorage.getItem('selectedAccountId')
                    : null;
            const selectedAccountName =
                typeof window !== 'undefined'
                    ? window.localStorage.getItem('selectedAccountName')
                    : null;

            console.log(
                '🚀 Fetching user groups from API with account context:',
                {
                    accountId: selectedAccountId,
                    accountName: selectedAccountName,
                    accountIdType: typeof selectedAccountId,
                    accountNameType: typeof selectedAccountName,
                },
            );

            // Build API URL with account parameters
            const apiBase =
                process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
            const params = new URLSearchParams();

            // Only add params if we have a non-Systiva account
            const hasValidAccountId =
                selectedAccountId &&
                selectedAccountId !== 'null' &&
                selectedAccountId !== '';
            const hasValidAccountName =
                selectedAccountName &&
                selectedAccountName !== 'null' &&
                selectedAccountName !== '';

            console.log('🔍 Account validation:', {
                hasValidAccountId,
                hasValidAccountName,
                willAddParams: hasValidAccountId && hasValidAccountName,
            });

            if (hasValidAccountId && hasValidAccountName) {
                params.append('accountId', selectedAccountId);
                params.append('accountName', selectedAccountName);
                console.log('✅ Added account params to URL');
            } else {
                console.log(
                    'ℹ️ No account params added (Systiva or invalid account)',
                );
            }

            const queryString = params.toString();
            const url = queryString
                ? `${apiBase}/api/user-management/groups?${queryString}`
                : `${apiBase}/api/user-management/groups`;

            console.log('🌐 Final API URL:', url);
            console.log('🌐 Query string:', queryString || '(empty)');

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch groups: ${response.status}`);
            }

            const groupsData = await response.json();
            console.log('📊 Groups fetched from API:', groupsData);
            console.log(
                '📊 Number of groups fetched:',
                groupsData?.length || 0,
            );

            // Handle case where API returns non-array
            if (!Array.isArray(groupsData)) {
                console.warn('⚠️ API returned non-array response:', groupsData);
                throw new Error('Invalid response format from API');
            }

            // Transform API data to match the table structure
            console.log('🔄 Transforming groups to table format...');
            const transformedGroups = groupsData.map((group: any) => {
                console.log('🔄 Transforming group:', group);
                return {
                    id: group.id,
                    groupName: group.name,
                    description: group.description || 'No description provided',
                    entity: group.entity || 'General',
                    service: group.service || 'General',
                    roles: group.assignedRoles || [],
                    createdDate: group.createdAt
                        ? new Date(group.createdAt).toISOString().split('T')[0]
                        : new Date().toISOString().split('T')[0],
                    lastModified:
                        group.updatedAt ||
                        group.createdAt ||
                        new Date().toISOString(),
                    memberCount: 0, // Will be populated later if needed
                };
            });

            console.log('✅ Transformed groups data:', transformedGroups);
            console.log('✅ Sample group structure:', transformedGroups[0]);
            console.log(
                `✅ Successfully loaded ${transformedGroups.length} groups from systiva DB`,
            );

            // Set only the API data, no fallback to mock data
            console.log(
                '📝 About to call setTableData with:',
                transformedGroups,
            );
            setTableData(transformedGroups);
            console.log(
                '✅ setTableData called with',
                transformedGroups.length,
                'groups',
            );
            console.log('🎉 Groups are now visible in the table!');
            console.log('🔵 ========================================');
            console.log('🔵 loadUserGroups COMPLETED SUCCESSFULLY');
            console.log('🔵 ========================================');
        } catch (error) {
            console.error('❌ Error loading user groups:', error);
            // Set empty array if API fails
            setTableData([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        console.log('🟢 Component mounted - calling loadUserGroups...');
        loadUserGroups();
        fetchEntities();
        fetchServices();
    }, [loadUserGroups, fetchEntities, fetchServices]);

    // Listen for account changes and reload groups
    useEffect(() => {
        const handleAccountChange = () => {
            console.log('🔄 Account changed, reloading groups...');
            loadUserGroups();
        };

        // Listen for the custom accountChanged event
        window.addEventListener('accountChanged', handleAccountChange);

        return () => {
            window.removeEventListener('accountChanged', handleAccountChange);
        };
    }, [loadUserGroups]);

    // Debug: Log when tableData changes
    useEffect(() => {
        console.log('🟡 tableData STATE CHANGED:', {
            length: tableData.length,
            data: tableData,
        });
    }, [tableData]);

    // Debounced auto-save function (10-second timer with countdown)
    const debouncedAutoSave = useCallback(async () => {
        console.log(
            '🕐 debouncedAutoSave called - clearing existing timer and starting new one',
        );

        // Clear existing timer
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
        }
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
        }

        // Start countdown
        setAutoSaveCountdown(10);

        // Countdown interval
        const countdownInterval = setInterval(() => {
            setAutoSaveCountdown((prev) => {
                if (prev === null || prev <= 1) {
                    clearInterval(countdownInterval);
                    return null;
                }
                return prev - 1;
            });
        }, 1000);
        countdownIntervalRef.current = countdownInterval;

        // Set new timer for 10 seconds
        const timer = setTimeout(async () => {
            try {
                console.log(
                    '🔥 10-second timer triggered - starting auto-save process',
                );
                setIsAutoSaving(true);
                setAutoSaveCountdown(null);
                if (countdownIntervalRef.current) {
                    clearInterval(countdownIntervalRef.current);
                }

                // Get all groups that need to be saved (temp groups with complete data)
                const groupsToSave = tableDataRef.current.filter((group) => {
                    const isTemp =
                        group.id.toString().startsWith('temp-') ||
                        group.id.toString().startsWith('new-') ||
                        group.isNew === true;

                    if (!isTemp) return false;

                    // Check if group has all required fields
                    const hasGroupName = group.groupName?.trim();
                    const hasDescription = group.description?.trim();

                    const isComplete = hasGroupName && hasDescription;

                    if (isTemp && !isComplete) {
                        console.log(
                            `🚫 Skipping incomplete temporary group ${group.id}:`,
                            {
                                hasGroupName: !!hasGroupName,
                                hasDescription: !!hasDescription,
                                groupNameValue: group.groupName,
                                descriptionValue: group.description,
                            },
                        );
                    }

                    return isComplete;
                });

                console.log(
                    `📊 Found ${groupsToSave.length} complete groups to auto-save`,
                );

                if (groupsToSave.length > 0) {
                    console.log(
                        '💾 Auto-saving groups after 10 seconds of inactivity...',
                        groupsToSave.map((g) => g.id),
                    );

                    for (const group of groupsToSave) {
                        await autoSaveGroup(group, true);
                    }

                    // Show success animation
                    console.log('✨ Showing auto-save success animation');
                    setShowAutoSaveSuccess(true);

                    setTimeout(() => {
                        console.log('✨ Hiding auto-save success animation');
                        setShowAutoSaveSuccess(false);
                    }, 3000);

                    console.log(
                        `✅ Auto-saved ${groupsToSave.length} groups successfully`,
                    );
                } else {
                    console.log('ℹ️ No groups found to auto-save');
                }
            } catch (error) {
                console.error('❌ Auto-save failed:', error);
            } finally {
                setIsAutoSaving(false);
            }
        }, 10000); // 10 seconds delay

        autoSaveTimerRef.current = timer;
        console.log('⏰ Auto-save timer set for 10 seconds');
    }, []);

    // Auto-save individual group function
    const autoSaveGroup = useCallback(
        async (groupData: UserGroup, isNewGroup: boolean = false) => {
            const groupId = groupData.id;
            console.log(
                `🎯 ${isNewGroup ? 'Creating' : 'Updating'} group: ${
                    groupData.groupName
                } (${groupId})`,
            );

            // Set saving state
            setSavingStates((prev) => ({...prev, [groupId]: 'saving'}));

            try {
                if (
                    isNewGroup ||
                    groupData.id.toString().startsWith('temp-') ||
                    groupData.id.toString().startsWith('new-') ||
                    groupData.id.toString().startsWith('item-') ||
                    groupData.isNew
                ) {
                    // Validate required fields
                    const hasRequiredFields =
                        groupData.groupName?.trim() &&
                        groupData.description?.trim();

                    if (!hasRequiredFields) {
                        console.log(
                            '⚠️ Skipping auto-save: Required fields missing',
                            {
                                groupName: groupData.groupName,
                                description: groupData.description,
                            },
                        );
                        setSavingStates((prev) => ({
                            ...prev,
                            [groupId]: 'error',
                        }));
                        return;
                    }

                    // Create new group via userManagement API
                    console.log('🆕 Auto-saving new group:', groupData);

                    // Get selected account from localStorage
                    const selectedAccountId =
                        typeof window !== 'undefined'
                            ? window.localStorage.getItem('selectedAccountId')
                            : null;
                    const selectedAccountName =
                        typeof window !== 'undefined'
                            ? window.localStorage.getItem('selectedAccountName')
                            : null;

                    const requestBody: any = {
                        name: groupData.groupName,
                        description: groupData.description,
                        entity: groupData.entity || '',
                        service: groupData.service || '',
                        assignedRoles: groupData.roles || [],
                    };

                    // Add account context if not Systiva
                    if (selectedAccountId && selectedAccountId !== 'null') {
                        requestBody.selectedAccountId = selectedAccountId;
                    }
                    if (selectedAccountName && selectedAccountName !== 'null') {
                        requestBody.selectedAccountName = selectedAccountName;
                    }

                    console.log('📤 POST Request Body:', requestBody);

                    const apiBase =
                        process.env.NEXT_PUBLIC_API_BASE ||
                        'http://localhost:4000';
                    const response = await fetch(
                        `${apiBase}/api/user-management/groups`,
                        {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify(requestBody),
                        },
                    );

                    console.log(
                        '📥 POST Response Status:',
                        response.status,
                        response.statusText,
                    );

                    if (!response.ok) {
                        throw new Error(
                            `Failed to create group: ${response.status}`,
                        );
                    }

                    const newGroup = await response.json();
                    console.log('📦 Created group response:', newGroup);

                    // Update the group ID with the real backend ID
                    setTableData((prevData) =>
                        prevData.map((g) =>
                            g.id === groupId
                                ? {
                                      ...g,
                                      id: newGroup.id,
                                      isNew: false,
                                      lastModified:
                                          newGroup.updatedAt ||
                                          new Date().toISOString(),
                                  }
                                : g,
                        ),
                    );

                    setSavingStates((prev) => ({
                        ...prev,
                        [newGroup.id]: 'saved',
                    }));
                    console.log(`🎉 Created group: ${groupData.groupName}`);

                    // Clear the temp ID from saving states
                    setSavingStates((prev) => {
                        const newStates = {...prev};
                        delete newStates[groupId];
                        return newStates;
                    });
                } else {
                    // Update existing group
                    console.log(
                        '🔄 Auto-saving existing group:',
                        groupId,
                        groupData,
                    );

                    // Get selected account from localStorage
                    const selectedAccountId =
                        typeof window !== 'undefined'
                            ? window.localStorage.getItem('selectedAccountId')
                            : null;
                    const selectedAccountName =
                        typeof window !== 'undefined'
                            ? window.localStorage.getItem('selectedAccountName')
                            : null;

                    const updateBody: any = {
                        name: groupData.groupName,
                        description: groupData.description,
                        entity: groupData.entity || '',
                        service: groupData.service || '',
                        assignedRoles: groupData.roles || [],
                    };

                    // Add account context if not Systiva
                    if (selectedAccountId && selectedAccountId !== 'null') {
                        updateBody.selectedAccountId = selectedAccountId;
                    }
                    if (selectedAccountName && selectedAccountName !== 'null') {
                        updateBody.selectedAccountName = selectedAccountName;
                    }

                    console.log('📤 PUT Request Body:', updateBody);

                    const apiBase =
                        process.env.NEXT_PUBLIC_API_BASE ||
                        'http://localhost:4000';
                    const response = await fetch(
                        `${apiBase}/api/user-management/groups/${groupId}`,
                        {
                            method: 'PUT',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify(updateBody),
                        },
                    );

                    console.log(
                        '📥 PUT Response Status:',
                        response.status,
                        response.statusText,
                    );

                    if (!response.ok) {
                        throw new Error(
                            `Failed to update group: ${response.status}`,
                        );
                    }

                    // Handle empty response body (backend might return 200 OK with no body)
                    const responseText = await response.text();
                    const updatedGroup = responseText
                        ? JSON.parse(responseText)
                        : null;
                    console.log('📦 Updated group response:', updatedGroup);

                    // If update returned null, the group doesn't exist in DB - create it instead
                    if (updatedGroup === null) {
                        console.warn(
                            '⚠️ Group not found in database, creating it instead...',
                        );
                        const createBody: any = {
                            name: groupData.groupName,
                            description: groupData.description,
                            entity: groupData.entity || '',
                            service: groupData.service || '',
                            assignedRoles: groupData.roles || [],
                        };

                        // Add account context if not Systiva
                        if (selectedAccountId && selectedAccountId !== 'null') {
                            createBody.selectedAccountId = selectedAccountId;
                        }
                        if (
                            selectedAccountName &&
                            selectedAccountName !== 'null'
                        ) {
                            createBody.selectedAccountName =
                                selectedAccountName;
                        }

                        const createResponse = await fetch(
                            `${apiBase}/api/user-management/groups`,
                            {
                                method: 'POST',
                                headers: {'Content-Type': 'application/json'},
                                body: JSON.stringify(createBody),
                            },
                        );

                        if (!createResponse.ok) {
                            throw new Error(
                                `Failed to create group: ${createResponse.status}`,
                            );
                        }

                        const newGroup = await createResponse.json();
                        console.log('✅ Created group (fallback):', newGroup);

                        // Update the group ID with the real backend ID
                        setTableData((prevData) =>
                            prevData.map((g) =>
                                g.id === groupId
                                    ? {
                                          ...g,
                                          id: newGroup.id,
                                          isNew: false,
                                          lastModified:
                                              newGroup.updatedAt ||
                                              new Date().toISOString(),
                                      }
                                    : g,
                            ),
                        );

                        setSavingStates((prev) => ({
                            ...prev,
                            [newGroup.id]: 'saved',
                        }));

                        // Clear the old ID from saving states
                        setSavingStates((prev) => {
                            const newStates = {...prev};
                            delete newStates[groupId];
                            return newStates;
                        });
                    } else {
                        setSavingStates((prev) => ({
                            ...prev,
                            [groupId]: 'saved',
                        }));
                        console.log(`💾 Updated group: ${groupData.groupName}`);
                    }
                }

                // Clear saved state after 2 seconds
                setTimeout(() => {
                    setSavingStates((prev) => {
                        const newStates = {...prev};
                        delete newStates[groupId];
                        return newStates;
                    });
                }, 2000);
            } catch (error) {
                console.error('❌ Auto-save failed for group:', groupId, error);
                setSavingStates((prev) => ({...prev, [groupId]: 'error'}));

                // Clear error state after 5 seconds
                setTimeout(() => {
                    setSavingStates((prev) => {
                        const newStates = {...prev};
                        delete newStates[groupId];
                        return newStates;
                    });
                }, 5000);
            }
        },
        [],
    );

    // Manual Save All function
    const handleSaveAll = async () => {
        console.log('='.repeat(80));
        console.log('💾 SAVE BUTTON CLICKED');
        console.log('='.repeat(80));
        console.log('📊 Current tableData state:', tableData);
        console.log('📊 Current tableDataRef.current:', tableDataRef.current);
        console.log('📊 Number of groups in tableData:', tableData.length);
        console.log(
            '📊 Number of groups in tableDataRef:',
            tableDataRef.current.length,
        );

        // Clear auto-save timer
        if (autoSaveTimerRef.current) {
            console.log('🛑 Manual save clicked - clearing auto-save timer');
            clearTimeout(autoSaveTimerRef.current);
            autoSaveTimerRef.current = null;
            setAutoSaveCountdown(null);
        }
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
        }

        // Get all groups with complete data (both temp and existing)
        console.log('🔍 Filtering groups from tableDataRef.current...');
        const groupsToSave = tableDataRef.current.filter((group) => {
            // Check if this is a temp/new group
            const isTemp =
                group.id.toString().startsWith('temp-') ||
                group.id.toString().startsWith('new-') ||
                group.isNew === true;

            // Validate required fields
            const hasGroupName = group.groupName?.trim();
            const hasDescription = group.description?.trim();
            const isComplete = hasGroupName && hasDescription;

            console.log(`🔍 Checking group ${group.id}:`, {
                id: group.id,
                groupName: group.groupName,
                description: group.description,
                entity: group.entity,
                service: group.service,
                isTemp,
                hasGroupName: !!hasGroupName,
                hasDescription: !!hasDescription,
                isComplete,
                willBeSaved: isComplete ? '✅ YES' : '❌ NO',
            });

            // Save if it has complete data (regardless of temp or existing)
            return isComplete;
        });

        console.log(
            `📊 Found ${groupsToSave.length} groups to save manually:`,
            groupsToSave.map((g) => ({
                id: g.id,
                name: g.groupName,
                isNew: g.isNew,
            })),
        );

        if (groupsToSave.length === 0) {
            console.log(
                'ℹ️ No groups to save - all groups are either incomplete or unchanged',
            );
            return;
        }

        setIsAutoSaving(true);

        try {
            for (const group of groupsToSave) {
                // Determine if this is a new group based on ID pattern
                const isNewGroup =
                    group.id.toString().startsWith('temp-') ||
                    group.id.toString().startsWith('new-') ||
                    group.id.toString().startsWith('item-') ||
                    group.isNew === true;

                console.log(
                    `💾 Saving group ${group.groupName} (isNew: ${isNewGroup})`,
                );
                await autoSaveGroup(group, isNewGroup);
            }

            // Show success animation
            setShowAutoSaveSuccess(true);

            setTimeout(() => {
                setShowAutoSaveSuccess(false);
            }, 3000);

            console.log(
                `✅ Manually saved ${groupsToSave.length} groups successfully`,
            );
        } catch (error) {
            console.error('❌ Manual save failed:', error);
        } finally {
            setIsAutoSaving(false);
        }
    };

    // Enhanced onDataChange with 10-second debounced auto-save
    const handleDataChange = useCallback(
        (newData: UserGroup[]) => {
            console.log('🚀 HANDLE_DATA_CHANGE CALLED for groups!');
            console.log(
                '📝 Data changed, starting 10-second auto-save timer...',
                {
                    newDataLength: newData.length,
                    newData: newData.map((g) => ({
                        id: g.id,
                        groupName: g.groupName,
                        description: g.description,
                    })),
                },
            );

            // Check if data has actually changed to prevent infinite loops
            const hasChanged =
                JSON.stringify(newData) !== JSON.stringify(tableData);
            if (!hasChanged) {
                console.log('⏭️ Data unchanged, skipping auto-save timer');
                return;
            }

            // Update table data immediately for UI responsiveness
            setTableData(newData);

            // CRITICAL: Also update the ref so autosave and manual save can access the latest data
            tableDataRef.current = newData;
            console.log('✅ Updated tableDataRef.current with new data');

            // Trigger debounced auto-save timer (10 seconds)
            debouncedAutoSave();
        },
        [tableData, debouncedAutoSave],
    );

    // Cleanup timeouts on unmount
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
        console.log('🔄 processedTableData useMemo triggered');
        console.log('📊 tableData length:', tableData.length);
        console.log('📊 tableData:', tableData);
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

        console.log('✅ processedTableData result:', processed);
        console.log('✅ processedTableData length:', processed.length);
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
        console.log('🎭 Opening role assignment panel for group:', groupData);
        setSelectedGroupForRoles(groupData);
        setShowRolePanel(true);
    };

    // Handle role assignment callback from sliding panel
    const handleRoleAssignment = async (groupId: string, roles: any[]) => {
        console.log('💾 Assigning roles to group:', groupId, roles);

        try {
            // Extract role IDs from the roles array
            const roleIds = roles.map((role) => role.id || role);

            // Update the group with assigned roles
            const response = await fetch(
                `http://localhost:4000/api/user-management/groups/${groupId}`,
                {
                    method: 'PUT',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        assignedRoles: roleIds,
                    }),
                },
            );

            if (!response.ok) {
                throw new Error(`Failed to assign roles: ${response.status}`);
            }

            console.log('✅ Roles assigned successfully');

            // Update local state
            setTableData((prevData) =>
                prevData.map((group) =>
                    group.id === groupId ? {...group, roles: roleIds} : group,
                ),
            );

            // Close the panel
            setShowRolePanel(false);
            setSelectedGroupForRoles(null);
        } catch (error) {
            console.error('❌ Error assigning roles:', error);
        }
    };

    // Use the base configuration - API integration is handled by ReusableTableComponent
    const dynamicTableConfig = useMemo(() => {
        console.log('📋 Using base table configuration with API integration');
        console.log('🔧 Injecting fetched services into config:', services);

        // Clone the config and inject the fetched services into the service column
        const configWithServices = {
            ...ManageUserGroups_tableConfig,
            mainTableColumns: ManageUserGroups_tableConfig.mainTableColumns.map(
                (col) => {
                    if (col.id === 'service') {
                        // Extract just the string values for the dropdown (TableComponent expects array of strings)
                        const serviceValues =
                            services.length > 0
                                ? services.map((s) => s.value || s.label || s)
                                : col.options;
                        console.log(
                            '🔧 Service dropdown values:',
                            serviceValues,
                        );
                        return {
                            ...col,
                            options: serviceValues,
                        };
                    }
                    if (col.id === 'entity') {
                        // Extract just the string values for the dropdown (TableComponent expects array of strings)
                        const entityValues =
                            entities.length > 0
                                ? entities.map((e) => e.value || e.label || e)
                                : col.options;
                        console.log('🔧 Entity dropdown values:', entityValues);
                        return {
                            ...col,
                            options: entityValues,
                        };
                    }
                    return col;
                },
            ),
        };

        console.log('✅ Config with services:', configWithServices);
        return configWithServices;
    }, [services, entities]);

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

                        {/* Save Button with countdown timer */}
                        <button
                            onClick={handleSaveAll}
                            disabled={isAutoSaving}
                            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-md shadow-sm transition-all duration-300 relative overflow-hidden ${
                                isAutoSaving
                                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                    : showAutoSaveSuccess
                                    ? 'bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 text-white shadow-lg animate-pulse'
                                    : autoSaveCountdown
                                    ? 'bg-gradient-to-r from-blue-300 to-blue-500 text-white shadow-md'
                                    : 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-md'
                            }`}
                        >
                            {/* Animated saving icon */}
                            {isAutoSaving && (
                                <svg
                                    className='animate-spin h-4 w-4 text-white'
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
                            )}

                            {/* Save icon or checkmark */}
                            {!isAutoSaving && (
                                <>
                                    {showAutoSaveSuccess ? (
                                        <svg
                                            className='h-4 w-4'
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
                                    ) : (
                                        <BookmarkIcon className='h-4 w-4' />
                                    )}
                                </>
                            )}

                            {/* Button text with countdown */}
                            <span className='font-medium'>
                                {isAutoSaving
                                    ? 'Saving...'
                                    : showAutoSaveSuccess
                                    ? 'Saved!'
                                    : autoSaveCountdown
                                    ? `Auto-save in ${autoSaveCountdown}s`
                                    : 'Save'}
                            </span>
                        </button>

                        <ToolbarTrashButton onClick={() => {}} />

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
                            {loading || entitiesLoading || servicesLoading ? (
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
                                            Loading User Groups
                                        </h3>
                                        <p className='mt-2 text-sm text-slate-500'>
                                            Please wait while we fetch user
                                            group data from the database...
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <ReusableTableComponent
                                    config={
                                        {
                                            ...dynamicTableConfig,
                                            initialData: processedTableData,
                                            savingStates: savingStates,
                                            customHeaderRenderer:
                                                renderColumnHeader,

                                            // FORCE ALL ADVANCED FEATURES ON
                                            features: {
                                                ...dynamicTableConfig.features,
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
                                                ...dynamicTableConfig.ui,
                                                enableAdvancedFeatures: true,
                                                showDragHandles: true,
                                                enableHoverControls: true,
                                                enableSortableHeaders: true,
                                                enableCompactMode: true,
                                                showModernIcons: true,
                                                enableMicroInteractions: true,
                                                modernTableStyling: true,
                                                editTrigger: 'doubleClick', // Double-click to edit cells
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
                                            editTrigger: 'doubleClick', // Double-click to edit

                                            // Pass current user context for API calls
                                            currentUser: {
                                                accountId: 1,
                                                enterpriseId: 1,
                                            },

                                            actions: {
                                                ...dynamicTableConfig.actions,
                                                onDataChange: handleDataChange,
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
                                                                rowData.roles
                                                                    ?.length ||
                                                                0
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
                                            },

                                            onAction: handleGroupAction,
                                            loading:
                                                loading ||
                                                entitiesLoading ||
                                                servicesLoading,
                                            searchTerm: searchTerm,
                                            groupBy: selectedGroupBy,
                                        } as any
                                    }
                                    onGroupAssignment={() => {}}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Role Assignment Sliding Panel */}
            {selectedGroupForRoles && showRolePanel && (
                <SimpleSlidingPanels
                    key={`role-panel-${selectedGroupForRoles.id}`}
                    isOpen={showRolePanel}
                    onClose={() => {
                        setShowRolePanel(false);
                        setSelectedGroupForRoles(null);
                    }}
                    currentUser={{
                        id: selectedGroupForRoles.id,
                        name: selectedGroupForRoles.groupName,
                        description: selectedGroupForRoles.description,
                        assignedRoles: selectedGroupForRoles.roles || [],
                    }}
                    onAssignGroups={(roles) => {
                        handleRoleAssignment(selectedGroupForRoles.id, roles);
                    }}
                    initialPanel='roles'
                    visiblePanels={['roles']}
                />
            )}
        </div>
    );
}
