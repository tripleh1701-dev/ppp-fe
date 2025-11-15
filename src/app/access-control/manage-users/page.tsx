'use client';

// Extend window interface for license deletion completion
declare global {
    interface Window {
        completeLicenseDeletion?: () => void;
    }
}

import React, {useState, useEffect, useRef, useCallback} from 'react';
import {motion} from 'framer-motion';
import {useRouter} from 'next/navigation';
import {
    PlusIcon,
    MagnifyingGlassIcon,
    ArrowsUpDownIcon,
    EyeSlashIcon,
    EyeIcon,
    RectangleStackIcon,
    BookmarkIcon,
} from '@heroicons/react/24/outline';
import ConfirmModal from '@/components/ConfirmModal';
import ManageUsersTable, {AccountRow} from '@/components/ManageUsersTable';
import AddressModal from '@/components/AddressModal';
import AssignedUserGroupModal, { UserGroup } from '@/components/AssignedUserGroupModal';
import { UserRole } from '@/components/AssignedUserRoleModal';
import TechnicalUserModal, { TechnicalUser } from '@/components/TechnicalUserModal';
import {api} from '@/utils/api';
import {generateId} from '@/utils/id-generator';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const looksLikeUuid = (value?: string | null) =>
    typeof value === 'string' && UUID_REGEX.test(value.trim());

const mapApiRoleToUserRole = (role: any): UserRole => {
    const normalizedRoleId = role?.roleId ?? role?.id ?? role?.roleID;
    return {
        id: role?.id?.toString() || role?.roleAssignmentId?.toString() || generateId(),
        roleId: normalizedRoleId ? normalizedRoleId.toString() : undefined,
        roleName: role?.name || role?.roleName || '',
        description: role?.description || '',
        entity: role?.entity || '',
        product: role?.product || '',
        service: role?.service || '',
        scope: role?.scope || '',
        isFromDatabase: role?.isFromDatabase ?? true,
    };
};

const rolesNeedHydration = (roles: UserRole[]) => {
    return roles.some((role) => {
        if (!role) {
            return true;
        }

        const trimmedName = role.roleName?.trim() || '';
        const matchesRoleId =
            trimmedName.length > 0 &&
            role.roleId &&
            trimmedName.toLowerCase() === role.roleId.toLowerCase();

        const missingName = trimmedName.length === 0;
        const looksLikeId = looksLikeUuid(trimmedName);
        const missingDetails = !role.description && !role.entity && !role.product && !role.service;

        return missingName || looksLikeId || matchesRoleId || missingDetails;
    });
};



export default function ManageUsers() {
    // Router for navigation interception
    const router = useRouter();
    
    // Component mounting debug (temporarily disabled)
    // console.log('🏗️ ManageUsers component mounting...');
    
    // Debug: Track re-renders
    const renderCountRef = useRef(0);
    renderCountRef.current += 1;

    // Account data state
    const [accounts, setAccounts] = useState<any[]>([]);
    
    // Client-side display order tracking - independent of API timestamps
    const displayOrderRef = useRef<Map<string, number>>(new Map());

    // Function to sort configs by client-side display order for stable UI
    const sortConfigsByDisplayOrder = useCallback((configs: any[]) => {
        return [...configs].sort((a, b) => {
            const orderA = displayOrderRef.current.get(a.id) ?? Number.MAX_SAFE_INTEGER;
            const orderB = displayOrderRef.current.get(b.id) ?? Number.MAX_SAFE_INTEGER;
            return orderA - orderB;
        });
    }, []);
    const [isLoading, setIsLoading] = useState(true);
    const [editingConfig, setEditingConfig] = useState<any>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const [tableVersion, setTableVersion] = useState(0);
    const [savingRows, setSavingRows] = useState<Set<string>>(new Set());

    // Navigation warning state
    const [showNavigationWarning, setShowNavigationWarning] = useState(false);
    const [incompleteRows, setIncompleteRows] = useState<string[]>([]);
    const [pendingNavigation, setPendingNavigation] = useState<
        (() => void) | null
    >(null);
    const [pendingNavigationUrl, setPendingNavigationUrl] = useState<string | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [preventNavigation, setPreventNavigation] = useState(false);
    const [userConfirmedLeave, setUserConfirmedLeave] = useState(false);

    // Notification state
    const [notificationMessage, setNotificationMessage] = useState<string>('');
    const [showNotification, setShowNotification] = useState(false);

    // Delete confirmation modal state
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [showValidationModal, setShowValidationModal] = useState(false);
    const [showValidationErrors, setShowValidationErrors] = useState(false);
    const [validationMessage, setValidationMessage] = useState('');
    const [externalFieldErrors, setExternalFieldErrors] = useState<{[key:string]: Record<string,string>}>({});
    
    // Start date protection modal state
    const [showStartDateProtectionModal, setShowStartDateProtectionModal] = useState(false);
    const [startDateProtectionMessage, setStartDateProtectionMessage] = useState('');
    
    // User Group modal state
    const [showUserGroupModal, setShowUserGroupModal] = useState(false);
    const [selectedUserForGroups, setSelectedUserForGroups] = useState<AccountRow | null>(null);
    
    // Selected Account and Enterprise from top right corner - exactly like Manage User Groups
    const [selectedEnterprise, setSelectedEnterprise] = useState<string>('');
    const [selectedEnterpriseId, setSelectedEnterpriseId] = useState<string>('');
    const [selectedAccountId, setSelectedAccountId] = useState<string>('');
    const [selectedAccountName, setSelectedAccountName] = useState<string>('');
    const [isInitialized, setIsInitialized] = useState<boolean>(false);
    
    // Load selected enterprise and account from localStorage and listen for changes
    useEffect(() => {
        const loadSelectedValues = () => {
            try {
                console.log('🐛 [ManageUsers Page] Loading localStorage values...');
                
                const savedEnterpriseName = window.localStorage.getItem('selectedEnterpriseName');
                const savedEnterpriseId = window.localStorage.getItem('selectedEnterpriseId');
                const savedAccountId = window.localStorage.getItem('selectedAccountId');
                const savedAccountName = window.localStorage.getItem('selectedAccountName');
                
                console.log('🐛 [ManageUsers Page] localStorage values:', {
                    selectedEnterpriseName: savedEnterpriseName,
                    selectedEnterpriseId: savedEnterpriseId,
                    selectedAccountId: savedAccountId,
                    selectedAccountName: savedAccountName
                });
                
                if (savedEnterpriseName) {
                    setSelectedEnterprise(savedEnterpriseName);
                }
                if (savedEnterpriseId && savedEnterpriseId !== 'null') {
                    setSelectedEnterpriseId(savedEnterpriseId);
                }
                if (savedAccountId && savedAccountId !== 'null') {
                    setSelectedAccountId(savedAccountId);
                }
                if (savedAccountName && savedAccountName !== 'null') {
                    setSelectedAccountName(savedAccountName);
                }
                
                console.log('🐛 [ManageUsers Page] State updated');
                setIsInitialized(true);
            } catch (error) {
                console.warn('Failed to load selected values:', error);
                setIsInitialized(true);
            }
        };

        // Load on mount
        loadSelectedValues();

        // Listen for changes
        const handleValuesChange = () => {
            loadSelectedValues();
        };

        window.addEventListener('enterpriseChanged', handleValuesChange);
        window.addEventListener('accountChanged', handleValuesChange);
        window.addEventListener('storage', handleValuesChange);

        return () => {
            window.removeEventListener('enterpriseChanged', handleValuesChange);
            window.removeEventListener('accountChanged', handleValuesChange);
            window.removeEventListener('storage', handleValuesChange);
        };
    }, []);
    
    const [pendingDeleteRowId, setPendingDeleteRowId] = useState<string | null>(
        null,
    );
    const [pendingDeleteLicenseId, setPendingDeleteLicenseId] = useState<string | null>(null);
    const [deleteType, setDeleteType] = useState<'account' | 'license'>('account');
    const [deletingRow, setDeletingRow] = useState(false);

    // Auto-save related state - use useRef to persist through re-renders
    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const accountsRef = useRef<any[]>([]);
    const modifiedExistingRecordsRef = useRef<Set<string>>(new Set());
    const originalRouterRef = useRef<{ push: any; replace: any } | null>(null);
    const [isAutoSaving, setIsAutoSaving] = useState(false);
    const [showAutoSaveSuccess, setShowAutoSaveSuccess] = useState(false);
    const [autoSaveCountdown, setAutoSaveCountdown] = useState<number | null>(null);
    const [modifiedExistingRecords, setModifiedExistingRecords] = useState<Set<string>>(new Set());
    
    // Debug auto-save state (temporarily disabled to reduce re-renders)
    // console.log(`🔄 Render #${renderCountRef.current} - Auto-save timer exists:`, !!autoSaveTimerRef.current, 'Countdown:', autoSaveCountdown);

    // Update ref to track current accounts state
    useEffect(() => {
        accountsRef.current = accounts;
    }, [accounts]);

    // Update ref to track current modifiedExistingRecords state
    useEffect(() => {
        modifiedExistingRecordsRef.current = modifiedExistingRecords;
    }, [modifiedExistingRecords]);

    // Helper function to show notifications - exactly like Manage User Groups
    const showBlueNotification = (message: string, duration: number = 3000, showCheckmark: boolean = true) => {
        console.log('📢 Showing notification:', message);
        setNotificationMessage(showCheckmark ? `✅ ${message}` : message);
        setShowNotification(true);
        setTimeout(() => {
            setShowNotification(false);
        }, duration);
    };

    // State to track user's pending local changes that haven't been saved yet
    const [pendingLocalChanges, setPendingLocalChanges] = useState<Record<string, any>>({});

    // State to track AI panel collapse state for notification positioning
    const [isAIPanelCollapsed, setIsAIPanelCollapsed] = useState(false);

    // Row animation states
    const [compressingRowId, setCompressingRowId] = useState<string | null>(
        null,
    );
    const [foldingRowId, setFoldingRowId] = useState<string | null>(null);

    // License animation states  
    const [compressingLicenseId, setCompressingLicenseId] = useState<string | null>(null);
    const [foldingLicenseId, setFoldingLicenseId] = useState<string | null>(null);

    // Dropdown options for chips and filters
    const [dropdownOptions, setDropdownOptions] = useState({
        enterprises: [] as Array<{id: string; name: string}>,
        products: [] as Array<{id: string; name: string}>,
        services: [] as Array<{id: string; name: string}>,
        cloudTypes: [
            { id: 'private-cloud', name: 'Private Cloud' },
            { id: 'public-cloud', name: 'Public Cloud' }
        ] as Array<{id: string; name: string}>,
        addresses: [] as Array<{id: string; name: string}>,
        firstNames: [] as Array<{id: string; name: string}>,
        lastNames: [] as Array<{id: string; name: string}>,
        emails: [] as Array<{id: string; name: string}>,
    });

    // Toolbar controls state
    const [showSearchBar, setShowSearchBar] = useState(true); // Always show search
    const [searchTerm, setSearchTerm] = useState('');
    const [appliedSearchTerm, setAppliedSearchTerm] = useState(''); // Applied search term
    const [filterVisible, setFilterVisible] = useState(false);
    const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
    const [sortOpen, setSortOpen] = useState(false);
    const [sortColumn, setSortColumn] = useState('');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | ''>('');
    const [hideOpen, setHideOpen] = useState(false);
    const [hideQuery, setHideQuery] = useState('');
    const [groupOpen, setGroupOpen] = useState(false);
    const [ActiveGroupLabel, setActiveGroupLabel] = useState<
        'None' | 'First Name' | 'Last Name' | 'Email Address' | 'Status'
    >('None');
    const [visibleCols, setVisibleCols] = useState<ColumnType[]>([
        'firstName',
        'middleName',
        'lastName',
        'emailAddress',
        'status',
        'startDate',
        'endDate',
        'password',
        'technicalUser',
        'assignedUserGroups',
    ]);

    // License validation state
    const [hasIncompleteLicenses, setHasIncompleteLicenses] = useState(false);
    const [incompleteLicenseRows, setIncompleteLicenseRows] = useState<string[]>([]);


    // Refs for dropdowns
    const searchRef = useRef<HTMLDivElement>(null);
    const filterRef = useRef<HTMLDivElement>(null);
    const sortRef = useRef<HTMLDivElement>(null);
    const hideRef = useRef<HTMLDivElement>(null);
    const groupRef = useRef<HTMLDivElement>(null);

    // Ref to track current filter form values for outside click handler - exactly like Manage User Groups
    const filterFormRef = useRef({
        firstName: '',
        lastName: '',
        emailAddress: '',
        status: '',
    });

    // Ref to track if "Clear All" was clicked in filter panel
    const filterClearedRef = useRef(false);

    // Click outside handler to close toolbar dialogs - exactly like Manage User Groups
    // Filter panel closes on outside click if: all fields are empty OR Clear All was clicked
    // Filter panel stays open if any field has a value (to prevent accidental closure while typing)
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            
            // Check if any dialog is open
            if (!filterVisible && !sortOpen && !hideOpen && !groupOpen) {
                return; // No dialog is open
            }
            
            // Check if click is outside dialog containers
            const isOutsideFilter = filterRef.current && !filterRef.current.contains(target);
            const isOutsideSort = sortRef.current && !sortRef.current.contains(target);
            const isOutsideHide = hideRef.current && !hideRef.current.contains(target);
            const isOutsideGroup = groupRef.current && !groupRef.current.contains(target);
            
            // Close Filter panel if:
            // 1. Clear All was clicked, OR
            // 2. All filter fields are empty (no values entered)
            if (filterVisible && isOutsideFilter) {
                const currentForm = filterFormRef.current;
                const isFilterEmpty = !currentForm.firstName && !currentForm.lastName && !currentForm.emailAddress && !currentForm.status;
                
                if (filterClearedRef.current || isFilterEmpty) {
                    setFilterVisible(false);
                    filterClearedRef.current = false; // Reset flag
                }
            }
            
            // Close Sort, Hide, Group panels immediately on outside click
            if (sortOpen && isOutsideSort) {
                setSortOpen(false);
            }
            if (hideOpen && isOutsideHide) {
                setHideOpen(false);
            }
            if (groupOpen && isOutsideGroup) {
                setGroupOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [filterVisible, sortOpen, hideOpen, groupOpen]);

    // Filter form state - exactly like Manage User Groups
    const [filterForm, setFilterForm] = useState({
        firstName: '',
        lastName: '',
        emailAddress: '',
        status: '',
    });

    // Update filterFormRef whenever filterForm changes - exactly like Manage User Groups
    useEffect(() => {
        filterFormRef.current = filterForm;
    }, [filterForm]);

    // Filter dropdown suggestions state - exactly like Manage User Groups
    const [showFirstNameSuggestions, setShowFirstNameSuggestions] = useState(false);
    const [showLastNameSuggestions, setShowLastNameSuggestions] = useState(false);
    const [showEmailSuggestions, setShowEmailSuggestions] = useState(false);
    const [showStatusSuggestions, setShowStatusSuggestions] = useState(false);
    
    const [filteredFirstNames, setFilteredFirstNames] = useState<Array<{id: string; name: string}>>([]);
    const [filteredLastNames, setFilteredLastNames] = useState<Array<{id: string; name: string}>>([]);
    const [filteredEmails, setFilteredEmails] = useState<Array<{id: string; name: string}>>([]);
    const [filteredStatuses, setFilteredStatuses] = useState<Array<{id: string; name: string}>>([]);
    
    const [selectedFirstNameIndex, setSelectedFirstNameIndex] = useState(-1);
    const [selectedLastNameIndex, setSelectedLastNameIndex] = useState(-1);
    const [selectedEmailIndex, setSelectedEmailIndex] = useState(-1);
    const [selectedStatusIndex, setSelectedStatusIndex] = useState(-1);

    // Apply and clear filter handlers - exactly like Manage User Groups
    const handleApplyFilters = () => {
        const filters: Record<string, any> = {};
        if (filterForm.firstName) filters.firstName = filterForm.firstName;
        if (filterForm.lastName) filters.lastName = filterForm.lastName;
        if (filterForm.emailAddress) filters.emailAddress = filterForm.emailAddress;
        if (filterForm.status) filters.status = filterForm.status;
        
        setActiveFilters(filters);
        setFilterVisible(false);
        
        // Reset the cleared flag when panel is closed via Apply
        filterClearedRef.current = false;
    };

    const handleClearFilters = () => {
        setFilterForm({
            firstName: '',
            lastName: '',
            emailAddress: '',
            status: '',
        });
        setActiveFilters({});
        
        // Mark that filters were cleared - allow closing on outside click
        filterClearedRef.current = true;
    };

    // Load users from API with account/enterprise filters - exactly like Manage User Groups
    const loadUsers = useCallback(async () => {
        try {
            console.log('🔄 [ManageUsers] loadUsers called with context:', {
                selectedAccountId,
                selectedAccountName,
                selectedEnterprise,
                selectedEnterpriseId,
                hasAccountId: !!selectedAccountId,
                hasEnterpriseId: !!selectedEnterpriseId,
                isInitialized
            });

            // Only load data if we have both account and enterprise selected
            if (!selectedAccountId || !selectedEnterpriseId) {
                console.log('🔄 [ManageUsers] Waiting for initialization...');
                return;
            }

            // Show loading indicator - exactly like Manage User Groups
            setIsLoading(true);
            console.log('✅ [ManageUsers] Both Account and Enterprise selected, loading filtered data');

            // Build query parameters - exactly like Manage User Groups
            const queryParams = new URLSearchParams({
                accountId: selectedAccountId,
                accountName: selectedAccountName,
                enterpriseId: selectedEnterpriseId,
                enterpriseName: selectedEnterprise
            });

            console.log('🌐 [API Call] Making request to:', `/api/user-management/users?${queryParams.toString()}`);
            console.log('🔍 [API Call] Filters applied:', {
                accountId: selectedAccountId,
                accountName: selectedAccountName,
                enterpriseId: selectedEnterpriseId,
                enterpriseName: selectedEnterprise
            });

            const response = await api.get<any[]>(`/api/user-management/users?${queryParams.toString()}`);
            console.log('📊 Loaded users from database:', response?.length || 0);
            console.log('🔍 Raw API response:', response);

            const groupRoleCache = new Map<string, UserRole[]>();

            const fetchAssignedRolesForGroup = async (groupId?: string): Promise<UserRole[]> => {
                if (!groupId) {
                    return [];
                }

                if (groupRoleCache.has(groupId)) {
                    return groupRoleCache.get(groupId)!;
                }

                try {
                    const params = new URLSearchParams({
                        accountId: selectedAccountId,
                        accountName: selectedAccountName,
                        enterpriseId: selectedEnterpriseId,
                        enterpriseName: selectedEnterprise,
                    });

                    const apiUrl = `/api/user-management/groups/${groupId}/roles?${params.toString()}`;
                    const response = await api.get<any>(apiUrl);

                    let rolesData = response;
                    if (rolesData && typeof rolesData === 'object' && 'data' in rolesData) {
                        rolesData = rolesData.data;
                        if (rolesData && typeof rolesData === 'object' && 'roles' in rolesData) {
                            rolesData = rolesData.roles;
                        }
                    }

                    if (Array.isArray(rolesData)) {
                        const formattedRoles: UserRole[] = rolesData.map((role: any) => mapApiRoleToUserRole(role));
                        groupRoleCache.set(groupId, formattedRoles);
                        return formattedRoles;
                    }
                } catch (error) {
                    console.warn('⚠️ Failed to load assigned roles for group:', groupId, error);
                }

                groupRoleCache.set(groupId, []);
                return [];
            };

            const normalizeUserGroup = async (group: any): Promise<UserGroup> => {
                if (typeof group === 'object' && group !== null) {
                    const hasInlineRoleObjects =
                        Array.isArray(group.assignedRoles) &&
                        group.assignedRoles.length > 0;

                    const inlineAssignedRoles: UserRole[] = hasInlineRoleObjects
                        ? (group.assignedRoles as any[]).map((role: any) => mapApiRoleToUserRole(role))
                        : [];

                    const normalized: UserGroup = {
                        id: group.id || group.groupId || generateId(),
                        groupId: group.groupId || group.id,
                        groupName: group.groupName || group.name || '',
                        description: group.description || '',
                        entity: group.entity || '',
                        product: group.product || '',
                        service: group.service || '',
                        roles: typeof group.roles === 'string' ? group.roles : '',
                        assignedRoles: inlineAssignedRoles,
                        isFromDatabase: group.isFromDatabase ?? true,
                    };

                    const requiresHydration = rolesNeedHydration(inlineAssignedRoles);
                    if (requiresHydration) {
                        console.log('⚠️ Inline assigned roles missing metadata, hydrating from API for group:', normalized.groupName || normalized.groupId);
                    }

                    const assignedRoles = (!inlineAssignedRoles.length || requiresHydration)
                        ? await fetchAssignedRolesForGroup(normalized.groupId)
                        : inlineAssignedRoles;

                    return {
                        ...normalized,
                        assignedRoles,
                        roles: assignedRoles.length > 0
                            ? assignedRoles.map((role) => role.roleName).join(', ')
                            : normalized.roles,
                    };
                }

                // Legacy string format
                const fallbackGroup: UserGroup = {
                    id: generateId(),
                    groupId: undefined,
                    groupName: typeof group === 'string' ? group : '',
                    description: '',
                    entity: '',
                    product: '',
                    service: '',
                    roles: '',
                    assignedRoles: [],
                };

                return fallbackGroup;
            };

            if (response && Array.isArray(response)) {
                // Transform the data to match the component's expected format
                const transformedData = await Promise.all(response.map(async (item: any, index: number) => {
                    const displayOrder = Date.now() + index;
                    displayOrderRef.current.set(item.id, displayOrder);
                    
                    console.log('🔍 [Transform] User item from API:', {
                        id: item.id,
                        firstName: item.firstName,
                        assignedUserGroups: item.assignedUserGroups,
                        assignedUserGroupsType: typeof item.assignedUserGroups,
                        assignedUserGroupsIsArray: Array.isArray(item.assignedUserGroups),
                        assignedUserGroupsLength: item.assignedUserGroups?.length
                    });
                    
                    const normalizedGroups = await Promise.all(
                        (item.assignedUserGroups || []).map((group: any) => normalizeUserGroup(group)),
                    );

                    return {
                        id: item.id || `user-${Date.now()}-${index}`,
                        firstName: item.firstName || '',
                        middleName: item.middleName || '',
                        lastName: item.lastName || '',
                        emailAddress: item.emailAddress || '',
                        status: item.status || 'ACTIVE',
                        startDate: item.startDate || '',
                        endDate: item.endDate || '',
                        // Display actual password from database
                        password: item.password || '',
                        technicalUser: item.technicalUser || false,
                        assignedUserGroups: normalizedGroups,
                        createdAt: item.createdAt,
                        updatedAt: item.updatedAt
                    };
                }));

                console.log('✅ Users loaded and transformed:', transformedData.length);

                // Sort by display order before setting
                const finalSortedConfigs = sortConfigsByDisplayOrder(transformedData);

                setAccounts(finalSortedConfigs);
                console.log('✅ Users loaded and transformed successfully');
            } else {
                console.log('ℹ️ No users returned from API, starting with empty array');
                setAccounts([]);
            }
        } catch (error) {
            console.error('❌ Failed to load users:', error);
            setAccounts([]);
        } finally {
            // Hide loading indicator
            setIsLoading(false);
        }
    }, [selectedAccountId, selectedAccountName, selectedEnterprise, selectedEnterpriseId, isInitialized, sortConfigsByDisplayOrder]);

    // Auto-reload users when account or enterprise changes
    useEffect(() => {
        if (isInitialized && selectedAccountId && selectedEnterpriseId) {
            console.log('🔄 [ManageUsers] Reloading users due to account/enterprise change');
            loadUsers();
        }
    }, [selectedAccountId, selectedEnterpriseId, isInitialized, loadUsers]);

    // Auto-save new user when all required fields are filled - exactly like Manage User Groups
    const autoSaveNewAccount = async (tempRowId: string, updatedAccount?: any) => {
        try {
            console.log('🚀 autoSaveNewAccount function called with tempRowId:', tempRowId);

            // Mark row as saving
            setSavingRows((prev) => new Set([...Array.from(prev), tempRowId]));

            // Use the provided updated account or find it from current ref state
            const account = updatedAccount || accountsRef.current.find((a) => a.id === tempRowId);
            if (!account) {
                console.error('❌ User not found for auto-save:', tempRowId);
                setSavingRows((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(tempRowId);
                    return newSet;
                });
                return;
            }

            console.log('💾 Auto-saving new user:', account);

            // Build user data with account/enterprise context - exactly like Manage User Groups
            const userData = {
                firstName: account.firstName || '',
                lastName: account.lastName || '',
                middleName: account.middleName || '',
                emailAddress: account.emailAddress || '',
                status: account.status || 'ACTIVE',
                startDate: account.startDate || '',
                endDate: account.endDate || '',
                password: account.password || '',
                technicalUser: account.technicalUser || false,
                assignedUserGroups: account.assignedUserGroups || [],
                // Include account/enterprise context
                accountId: selectedAccountId,
                accountName: selectedAccountName,
                enterpriseId: selectedEnterpriseId,
                enterpriseName: selectedEnterprise
            };

            console.log('💾 Creating new user with data (including context):', userData);

            try {
                // Save user to database via API
                const response = await api.post<{id?: string}>('/api/user-management/users', userData);
                console.log('✅ User saved to database via API:', response);

                // Update the account with the real ID from the API response
                const savedUserId = response?.id || `user-${Date.now()}`;

                // Preserve display order for the new ID
                const oldDisplayOrder = displayOrderRef.current.get(tempRowId);

                // Update the account with the real ID
                setAccounts((prev) => {
                    const updated = prev.map((acc) =>
                        acc.id === tempRowId
                            ? {...acc, id: savedUserId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()}
                            : acc,
                    );
                    // Apply stable sorting to maintain display order
                    return sortConfigsByDisplayOrder(updated);
                });

                // Update display order reference with the new ID
                if (oldDisplayOrder !== undefined) {
                    displayOrderRef.current.delete(tempRowId); // Remove old reference
                    displayOrderRef.current.set(savedUserId, oldDisplayOrder); // Add new reference
                    console.log(`📍 Preserved display order ${oldDisplayOrder} for new user ID ${savedUserId}`);
                }

                console.log('🎉 New user saved successfully to database!');
            } catch (apiError) {
                console.error('❌ Failed to save user to database:', apiError);
                throw apiError;
            }
        } catch (error) {
            console.error('❌ Auto-save failed:', error);
        } finally {
            // Remove from saving state
            setSavingRows((prev) => {
                const newSet = new Set(Array.from(prev));
                newSet.delete(tempRowId);
                return newSet;
            });
        }
    };

    // Debounced auto-save function - exactly like Manage User Groups
    const debouncedAutoSave = useCallback(() => {
        // Clear any existing timer and countdown
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
            console.log('⏱️ Cleared previous auto-save timer');
        }
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            console.log('⏱️ Cleared previous countdown interval');
        }

        // Start countdown from 10 seconds
        setAutoSaveCountdown(10);

        // Update countdown every second
        let countdown = 10;
        const countdownInterval = setInterval(() => {
            countdown--;
            setAutoSaveCountdown(countdown);
            
            if (countdown <= 0) {
                clearInterval(countdownInterval);
            }
        }, 1000);
        
        // Store countdown interval in ref so it can be cleared externally (e.g., manual save)
        countdownIntervalRef.current = countdownInterval;

        // Set new timer for 10 seconds
        autoSaveTimerRef.current = setTimeout(async () => {
            // Clear countdown immediately when execution starts
            clearInterval(countdownInterval);
            countdownIntervalRef.current = null;
            setAutoSaveCountdown(null);
            autoSaveTimerRef.current = null;

            try {
                setIsAutoSaving(true);
                console.log('⏰ Auto-save triggered after 10 seconds!');

                // Get all temporary rows (new users not yet saved)
                const temporaryRows = accountsRef.current.filter((acc: any) => 
                    acc.id.startsWith('tmp-')
                );

                // Get all modified existing rows
                const modifiedRowIds = Array.from(modifiedExistingRecordsRef.current);
                const modifiedRows = accountsRef.current.filter((acc: any) => 
                    modifiedRowIds.includes(acc.id)
                );

                console.log('📊 Auto-save summary:', {
                    temporaryCount: temporaryRows.length,
                    modifiedCount: modifiedRows.length,
                    temporaryIds: temporaryRows.map((r: any) => r.id),
                    modifiedIds: modifiedRowIds
                });

                // Save new users via POST
                for (const tempRow of temporaryRows) {
                    console.log('💾 Auto-saving new user:', tempRow.id);
                    await autoSaveNewAccount(tempRow.id, tempRow);
                }

                // Save modified users via PUT
                for (const modifiedRow of modifiedRows) {
                    console.log('💾 Auto-updating modified user:', modifiedRow.id);
                    
                    const updateData = {
                        firstName: modifiedRow.firstName || '',
                        lastName: modifiedRow.lastName || '',
                        middleName: modifiedRow.middleName || '',
                        emailAddress: modifiedRow.emailAddress || '',
                        status: modifiedRow.status || 'ACTIVE',
                        startDate: modifiedRow.startDate || '',
                        endDate: modifiedRow.endDate || '',
                        password: modifiedRow.password || '',
                        technicalUser: modifiedRow.technicalUser || false,
                        assignedUserGroups: modifiedRow.assignedUserGroups || [],
                        // Include account/enterprise context
                        accountId: selectedAccountId,
                        accountName: selectedAccountName,
                        enterpriseId: selectedEnterpriseId,
                        enterpriseName: selectedEnterprise
                    };

                    console.log('🔄 Updating user with data (including context):', updateData);

                    await api.put(`/api/user-management/users/${modifiedRow.id}`, updateData);
                    console.log('✅ User updated successfully:', modifiedRow.id);
                }

                // Clear modified records after successful save
                modifiedExistingRecordsRef.current.clear();
                setModifiedExistingRecords(new Set());

                // Reload users from database to get latest data and clear temporary IDs
                console.log('🔄 Reloading users after successful autosave...');
                await loadUsers();
                
                // Show success notification
                showBlueNotification('Changes saved successfully!', 3000, true);
                setShowAutoSaveSuccess(true);
                setTimeout(() => setShowAutoSaveSuccess(false), 2000);

                console.log('✅ Auto-save completed successfully!');
            } catch (error) {
                console.error('❌ Auto-save failed:', error);
                showBlueNotification('Failed to save changes. Please try again.', 5000, false);
            } finally {
                setIsAutoSaving(false);
            }
        }, 10000);

        console.log('⏱️ Auto-save timer started - will execute in 10 seconds');
    }, [selectedAccountId, selectedAccountName, selectedEnterprise, selectedEnterpriseId, loadUsers, showBlueNotification, sortConfigsByDisplayOrder]);

    // Load dropdown options from API
    const loadDropdownOptions = useCallback(async () => {
        try {
            console.log('🔄 Loading dropdown options from accounts:', accounts.length);
            
            const [enterprisesRes, productsRes, servicesRes] =
                await Promise.all([
                    api.get<Array<{id: string; name: string}>>(
                        '/api/enterprises',
                    ),
                    api.get<Array<{id: string; name: string}>>('/api/products'),
                    api.get<Array<{id: string; name: string}>>('/api/services'),
                ]);

            // Extract unique first names from existing accounts
            const uniqueFirstNames = Array.from(new Set(accounts
                .map(account => account.firstName)
                .filter(Boolean)
            )).map((name, index) => ({
                id: `firstname-${name}-${index}`,
                name: name
            }));
            
            // Extract unique last names from existing accounts
            const uniqueLastNames = Array.from(new Set(accounts
                .map(account => account.lastName)
                .filter(Boolean)
            )).map((name, index) => ({
                id: `lastname-${name}-${index}`,
                name: name
            }));
            
            // Extract unique emails from existing accounts
            const uniqueEmails = Array.from(new Set(accounts
                .map(account => account.emailAddress)
                .filter(Boolean)
            )).map((email, index) => ({
                id: `email-${email}-${index}`,
                name: email
            }));

            console.log('✅ Extracted dropdown options:', {
                firstNames: uniqueFirstNames.map(f => f.name),
                lastNames: uniqueLastNames.map(l => l.name),
                emails: uniqueEmails.map(e => e.name)
            });

            setDropdownOptions({
                enterprises: enterprisesRes || [],
                products: productsRes || [],
                services: servicesRes || [],
                firstNames: uniqueFirstNames,
                lastNames: uniqueLastNames,
                emails: uniqueEmails,
                cloudTypes: [
                    { id: 'private-cloud', name: 'Private Cloud' },
                    { id: 'public-cloud', name: 'Public Cloud' }
                ],
                addresses: [],
            });
        } catch (error) {
            console.error('Failed to load dropdown options:', error);
        }
    }, [accounts]);

    // Helper function to close all dialogs
    const closeAllDialogs = () => {
        setFilterVisible(false);
        setSortOpen(false);
        setHideOpen(false);
        setGroupOpen(false);
    };


    // Listen for sort changes from the AccountsTable
    useEffect(() => {
        const handleTableSortChange = (event: CustomEvent) => {
            const { column, direction } = event.detail;
            
            // Update the Sort panel state to reflect the table's sort change
            setSortColumn(column);
            setSortDirection(direction);
        };

        // Add event listener for custom enterprise table sort events
        document.addEventListener('enterpriseTableSortChange', handleTableSortChange as EventListener);
        
        // Cleanup
        return () => {
            document.removeEventListener('enterpriseTableSortChange', handleTableSortChange as EventListener);
        };
    }, []);

    // Helper function to toggle a specific dialog (closes others)
    const toggleDialog = (dialogType: 'filter' | 'sort' | 'hide' | 'group') => {
        closeAllDialogs();
        switch (dialogType) {
            case 'filter':
                setFilterVisible(true);
                break;
            case 'sort':
                setSortOpen(true);
                break;
            case 'hide':
                setHideOpen(true);
                break;
            case 'group':
                setGroupOpen(true);
                break;
        }
    };

    // All available columns
    type ColumnType = 'firstName' | 'middleName' | 'lastName' | 'emailAddress' | 'status' | 'startDate' | 'endDate' | 'password' | 'technicalUser' | 'assignedUserGroups' | 'actions';
    const allCols: ColumnType[] = ['firstName', 'middleName', 'lastName', 'emailAddress', 'status', 'startDate', 'endDate', 'password', 'technicalUser', 'assignedUserGroups'];
    
    // Columns available for sorting - only the requested user fields
    const sortableCols: ColumnType[] = ['firstName', 'middleName', 'lastName', 'emailAddress', 'status'];

    // Process account data with filtering, sorting, and search
    const processedConfigs = React.useMemo(() => {
        let filtered = [...accounts];

        // Apply search filter
        if (appliedSearchTerm.trim()) {
            filtered = filtered.filter((config) => {
                const searchLower = appliedSearchTerm.toLowerCase();
                return (
                    config.firstName?.toLowerCase().includes(searchLower) ||
                    config.lastName?.toLowerCase().includes(searchLower) ||
                    config.emailAddress?.toLowerCase().includes(searchLower) ||
                    config.status?.toLowerCase().includes(searchLower) ||
                    (config.technicalUser && 'technical'.includes(searchLower)) ||
                    (!config.technicalUser && 'regular'.includes(searchLower))
                );
            });
        }

        // Apply filters
        if (activeFilters.firstName) {
            filtered = filtered.filter(
                (config) => config.firstName?.toLowerCase().includes(activeFilters.firstName.toLowerCase()),
            );
        }
        if (activeFilters.lastName) {
            filtered = filtered.filter(
                (config) => config.lastName?.toLowerCase().includes(activeFilters.lastName.toLowerCase()),
            );
        }
        if (activeFilters.emailAddress) {
            filtered = filtered.filter(
                (config) => config.emailAddress?.toLowerCase().includes(activeFilters.emailAddress.toLowerCase()),
            );
        }
        if (activeFilters.status) {
            filtered = filtered.filter(
                (config) => config.status === activeFilters.status,
            );
        }

        // Apply sorting only when both column and direction are explicitly set
        if (sortColumn && sortDirection && (sortDirection === 'asc' || sortDirection === 'desc')) {
            filtered.sort((a, b) => {
                let valueA = '';
                let valueB = '';

                switch (sortColumn) {
                    case 'firstName':
                        valueA = (a.firstName || '').toString().toLowerCase();
                        valueB = (b.firstName || '').toString().toLowerCase();
                        break;
                    case 'middleName':
                        valueA = (a.middleName || '').toString().toLowerCase();
                        valueB = (b.middleName || '').toString().toLowerCase();
                        break;
                    case 'lastName':
                        valueA = (a.lastName || '').toString().toLowerCase();
                        valueB = (b.lastName || '').toString().toLowerCase();
                        break;
                    case 'emailAddress':
                        valueA = (a.emailAddress || '').toString().toLowerCase();
                        valueB = (b.emailAddress || '').toString().toLowerCase();
                        break;
                    case 'status':
                        valueA = (a.status || '').toString().toLowerCase();
                        valueB = (b.status || '').toString().toLowerCase();
                        break;
                    case 'startDate':
                        valueA = (a.startDate || '').toString();
                        valueB = (b.startDate || '').toString();
                        break;
                    case 'endDate':
                        valueA = (a.endDate || '').toString();
                        valueB = (b.endDate || '').toString();
                        break;
                    case 'technicalUser':
                        valueA = a.technicalUser ? 'true' : 'false';
                        valueB = b.technicalUser ? 'true' : 'false';
                        break;
                    default:
                        valueA = '';
                        valueB = '';
                        break;
                }

                if (valueA < valueB) {
                    return sortDirection === 'asc' ? -1 : 1;
                }
                if (valueA > valueB) {
                    return sortDirection === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }

        return filtered;
    }, [
        accounts, 
        appliedSearchTerm, 
        activeFilters, 
        sortColumn,
        sortDirection
    ]);

    // Helper functions for filter management
    const applyFilters = (filters: Record<string, any>) => {
        setActiveFilters(filters);
        closeAllDialogs();
    };

    // Column label mapping
    const columnLabels: Record<string, string> = {
        firstName: 'First Name',
        middleName: 'Middle Name',
        lastName: 'Last Name',
        emailAddress: 'Email Address',
        status: 'Status',
        startDate: 'Start Date',
        endDate: 'End Date',
        password: 'Password',
        technicalUser: 'Technical User',
        assignedUserGroups: 'Assigned User Groups'
    };

    // Sort functions
    const applySorting = (column: string, direction: 'asc' | 'desc') => {
        setSortColumn(column);
        setSortDirection(direction);
        // Don't close dialog to allow multiple adjustments
    };

    const applySortAndClose = (column: string, direction: 'asc' | 'desc') => {
        setSortColumn(column);
        setSortDirection(direction);
        closeAllDialogs();
    };

    const clearSorting = () => {
        setSortColumn('');
        setSortDirection('');
        
        // Dispatch custom event to clear table sorting
        const clearEvent = new CustomEvent('clearTableSorting');
        window.dispatchEvent(clearEvent);
    };

    const clearGroupBy = () => {
        setActiveGroupLabel('None');
        closeAllDialogs();
    };

    const clearAllFilters = () => {
        setActiveFilters({});
        closeAllDialogs();
    };

    const setGroupByFromLabel = (label: string) => {
        const l = label as 'None' | 'First Name' | 'Last Name' | 'Email Address' | 'Status';
        setActiveGroupLabel(l);
    };

    const groupByProp =
        ActiveGroupLabel === 'First Name'
            ? 'firstName'
            : ActiveGroupLabel === 'Last Name'
            ? 'lastName'
            : ActiveGroupLabel === 'Email Address'
            ? 'emailAddress'
            : ActiveGroupLabel === 'Status'
            ? 'status'
            : 'none';

    // Helper function to save accounts to localStorage
    const saveAccountsToStorage = (accountsData: any[]) => {
        try {
            // Filter out completely blank temporary rows before saving
            const accountsToSave = accountsData.filter(account => {
                // Keep all non-temporary rows (already saved to database)
                if (!String(account.id).startsWith('tmp-')) {
                    return true;
                }
                
                // For temporary rows, only save if they have at least one user field filled
                const hasAnyData = !!(
                    account.firstName?.trim() ||
                    account.lastName?.trim() ||
                    account.emailAddress?.trim() ||
                    account.password?.trim() ||
                    account.middleName?.trim()
                );
                
                return hasAnyData;
            });
            
            localStorage.setItem('accounts-data', JSON.stringify(accountsToSave));
            console.log('💾 Accounts saved to localStorage (filtered out blank temporary rows):', {
                total: accountsData.length,
                saved: accountsToSave.length,
                filtered: accountsData.length - accountsToSave.length
            });
        } catch (error) {
            console.error('Error saving accounts to localStorage:', error);
        }
    };

    // Create missing entities (enterprises, products, services) when they don't exist
    const createMissingEntities = async (
        enterpriseName: string,
        productName: string,
        serviceNames: string[],
        existingEnterprise?: any,
        existingProduct?: any,
        existingServices?: any[],
    ) => {
        const result = {
            enterprise: existingEnterprise,
            product: existingProduct,
            services: existingServices || [],
        };

        try {
            // Reload dropdown options first to ensure we have the latest data
            await loadDropdownOptions();

            // Re-check if entities exist after reload
            let foundEnterprise =
                existingEnterprise ||
                dropdownOptions.enterprises.find(
                    (e: {id: string; name: string}) => e.name === enterpriseName,
                );
            let foundProduct =
                existingProduct ||
                dropdownOptions.products.find((p: {id: string; name: string}) => p.name === productName);
            let foundServices = serviceNames
                .map((serviceName) =>
                    dropdownOptions.services.find(
                        (s: {id: string; name: string}) => s.name === serviceName,
                    ),
                )
                .filter(Boolean);

            // Create enterprise if still missing
            if (!foundEnterprise && enterpriseName) {
                console.log('🏢 Creating new enterprise:', enterpriseName);
                const newEnterprise = await api.post<{
                    id: string;
                    name: string;
                }>('/api/enterprises', {name: enterpriseName});
                if (newEnterprise) {
                    foundEnterprise = newEnterprise;
                    // Update dropdown options
                    setDropdownOptions((prev: any) => ({
                        ...prev,
                        enterprises: [...prev.enterprises, newEnterprise],
                    }));
                }
            }

            // Create product if still missing
            if (!foundProduct && productName) {
                console.log('📦 Creating new product:', productName);
                const newProduct = await api.post<{id: string; name: string}>(
                    '/api/products',
                    {name: productName},
                );
                if (newProduct) {
                    foundProduct = newProduct;
                    // Update dropdown options
                    setDropdownOptions((prev) => ({
                        ...prev,
                        products: [...prev.products, newProduct],
                    }));
                }
            }

            // Create missing services
            const missingServiceNames = serviceNames.filter(
                (serviceName) =>
                    !foundServices.some((s) => s && s.name === serviceName),
            );

            if (missingServiceNames.length > 0) {
                console.log('🔧 Creating new services:', missingServiceNames);
                const newServices: {id: string; name: string}[] = [];

                for (const serviceName of missingServiceNames) {
                    const newService = await api.post<{
                        id: string;
                        name: string;
                    }>('/api/services', {
                        name: serviceName,
                    });
                    if (newService) {
                        newServices.push(newService);
                        foundServices.push(newService);
                    }
                }

                // Update dropdown options
                if (newServices.length > 0) {
                    setDropdownOptions((prev) => ({
                        ...prev,
                        services: [...prev.services, ...newServices],
                    }));
                }
            }

            // Update result with found/created entities
            result.enterprise = foundEnterprise;
            result.product = foundProduct;
            result.services = foundServices;

            console.log('✅ Entity creation completed:', {
                enterprise: result.enterprise?.name,
                product: result.product?.name,
                services: result.services.map((s) => s?.name).filter(Boolean),
            });

            return result;
        } catch (error) {
            console.error('❌ Error creating missing entities:', error);
            return result;
        }
    };

    // Function to check if there's a completely blank row
    const hasBlankRow = () => {
        return accounts.some((config) => {
            const isTemporary = String(config.id).startsWith('tmp-');
            const isEmpty =
                !config.firstName &&
                !config.lastName &&
                !config.emailAddress;
            return isTemporary && isEmpty;
        });
    };

    // Function to validate incomplete rows and return validation details
    const validateIncompleteRows = () => {
        const effectiveConfigs = getEffectiveAccounts();
        
        // Get all temporary (unsaved) rows using effective configs
        const temporaryRows = effectiveConfigs.filter((config: any) => 
            String(config.id).startsWith('tmp-')
        );

        // Get all existing rows that might have incomplete data using effective configs
        const existingRows = effectiveConfigs.filter((config: any) => 
            !String(config.id).startsWith('tmp-')
        );

        // Check for incomplete temporary rows (exclude completely blank rows)
        const incompleteTemporaryRows = temporaryRows.filter((config: any) => {
            const hasAccountName = config.accountName?.trim();
            const hasMasterAccount = config.masterAccount?.trim();
            const hasCloudType = config.cloudType?.trim();

            // Don't include completely blank rows (new rows that haven't been touched)
            const isCompletelyBlank = !hasAccountName && !hasMasterAccount && !hasCloudType;
            if (isCompletelyBlank) return false;

            // Row is incomplete if it has some data but not all required fields (Account Name, Master Account, Cloud Type)
            return !hasAccountName || !hasMasterAccount || !hasCloudType;
        });

        // Check for incomplete existing rows (exclude completely blank rows)
        const incompleteExistingRows = existingRows.filter((config: any) => {
            const hasAccountName = config.accountName?.trim();
            const hasMasterAccount = config.masterAccount?.trim();
            const hasCloudType = config.cloudType?.trim();

            // Don't include completely blank rows (existing rows shouldn't be blank, but just in case)
            const isCompletelyBlank = !hasAccountName && !hasMasterAccount && !hasCloudType;
            if (isCompletelyBlank) return false;

            // Row is incomplete if it has some data but not all required fields (Account Name, Master Account, Cloud Type)
            return !hasAccountName || !hasMasterAccount || !hasCloudType;
        });

        // Combine all incomplete rows
        const incompleteRows = [...incompleteTemporaryRows, ...incompleteExistingRows];
        
        if (incompleteRows.length > 0) {
            const missingFields = new Set<string>();
            incompleteRows.forEach((config) => {
                if (!config.accountName?.trim()) missingFields.add('Account Name');
                if (!config.masterAccount?.trim()) missingFields.add('Master Account');
                if (!config.cloudType?.trim()) missingFields.add('Cloud Type');
            });
            
            const incompleteCount = incompleteRows.length;
            const message = `Found ${incompleteCount} incomplete record${incompleteCount > 1 ? 's' : ''}. Please complete all required fields (${Array.from(missingFields).join(', ')}) before adding a new row.`;
            
            return {
                hasIncomplete: true,
                incompleteRows,
                message
            };
        }
        
        return {
            hasIncomplete: false,
            incompleteRows: [],
            message: ''
        };
    };

    // Helper function for email validation
    const isValidEmail = useCallback((email: string): boolean => {
        if (!email || !email.trim()) return false;
        
        const trimmed = email.trim();
        
        // Length validation
        if (trimmed.length < 5 || trimmed.length > 254) return false;
        
        // RFC 5322 compliant email regex
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        
        return emailRegex.test(trimmed);
    }, []);

    // Debounced auto-save function with countdown
    // Function to merge server data with pending local changes
    const getEffectiveAccounts = useCallback(() => {
        return accounts.map(config => {
            const pendingChanges = pendingLocalChanges[config.id];
            
            if (pendingChanges) {
                console.log(`🔄 Applying pending changes to record ${config.id}:`, pendingChanges);
                // Apply pending changes, ensuring field names match the config structure
                const mergedConfig = { ...config };
                
                Object.keys(pendingChanges).forEach(key => {
                    const value = pendingChanges[key];
                    // Apply the change directly to the config
                    mergedConfig[key] = value;
                    
                    // Also handle alternate field names for consistency
                    if (key === 'enterprise') {
                        mergedConfig.enterpriseName = value;
                    } else if (key === 'product') {
                        mergedConfig.productName = value;
                    } else if (key === 'services') {
                        mergedConfig.serviceName = value;
                    }
                });
                
                console.log(`✅ Merged config for ${config.id}:`, {
                    original: config,
                    pending: pendingChanges,
                    merged: mergedConfig
                });
                return mergedConfig;
            }
            
            return config;
        });
    }, [accounts, pendingLocalChanges]);

    // Memoized license validation change handler to prevent infinite re-renders
    const handleLicenseValidationChange = useCallback((hasIncomplete: boolean, incompleteRows: string[]) => {
        setHasIncompleteLicenses(hasIncomplete);
        setIncompleteLicenseRows(incompleteRows);
    }, []);

    // Function to check for incomplete rows
    const getIncompleteRows = () => {
        const effectiveConfigs = getEffectiveAccounts();
        
        const incompleteRows = effectiveConfigs
            .filter((config: any) => {
                const hasFirstName = config.firstName?.trim();
                const hasLastName = config.lastName?.trim();
                const hasEmail = config.emailAddress?.trim();
                const hasStartDate = config.startDate?.trim();
                const hasPassword = config.password?.trim();

                // Include completely blank rows only when validation is explicitly shown
                const isCompletelyBlank = !hasFirstName && !hasLastName && !hasEmail && !hasStartDate && !hasPassword;
                if (isCompletelyBlank && !showValidationErrors) return false;

                // Row is incomplete if any required user field is missing
                const isIncomplete = !hasFirstName || !hasLastName || !hasEmail || !hasStartDate || !hasPassword;
                
                console.log('🔍 Row validation check:', {
                    id: config.id,
                    hasFirstName,
                    hasLastName,
                    hasEmail,
                    hasStartDate,
                    hasPassword,
                    technicalUser: config.technicalUser,
                    isIncomplete
                });
                
                return isIncomplete;
            })
            .map((config: any) => config.id);
            
        // Only log when showValidationErrors is true to prevent infinite loops
        if (showValidationErrors && incompleteRows.length > 0) {
            console.log('🔍 getIncompleteRows result:', {
                incompleteRowIds: incompleteRows,
                totalConfigs: effectiveConfigs.length,
                showValidationErrors,
                sampleConfigIds: effectiveConfigs.slice(0, 3).map(c => c.id)
            });
        }
        
        return incompleteRows;
    };

    // Extract auto-save logic into a separate function for reuse
    const executeAutoSave = async () => {
        console.log('🔥 Executing auto-save process');
        setIsAutoSaving(true);
        
        try {
            // Get all temporary (unsaved) rows that are complete using current ref
            const temporaryRows = accountsRef.current.filter((config) => {
                const isTemp = String(config.id).startsWith('tmp-');
                if (!isTemp) return false;
                
                const hasAccountName = config.accountName?.trim();
                const hasMasterAccount = config.masterAccount?.trim();
                const hasCloudType = config.cloudType?.trim();
                
                return hasAccountName && hasMasterAccount && hasCloudType;
            });
            
            // Get all modified existing records that are still complete
            const modifiedRows = accountsRef.current.filter((config) => {
                const isExisting = !String(config.id).startsWith('tmp-');
                const isModified = modifiedExistingRecordsRef.current.has(String(config.id));
                
                if (isExisting && isModified) {
                    // Double-check that the record still has all required fields
                    const hasAccountName = config.accountName?.trim();
                    const hasMasterAccount = config.masterAccount?.trim();
                    const hasCloudType = config.cloudType?.trim();
                    
                    const isComplete = hasAccountName && hasMasterAccount && hasCloudType;
                    
                    console.log(`🔍 Checking modified account ${config.id}: isComplete=${isComplete}`, {
                        hasAccountName: !!hasAccountName,
                        hasMasterAccount: !!hasMasterAccount,
                        hasCloudType: !!hasCloudType,
                        accountNameValue: config.accountName,
                        masterAccountValue: config.masterAccount,
                        cloudTypeValue: config.cloudType,
                        addressValue: config.address
                    });
                    
                    return isComplete;
                }
                
                console.log(`🔍 Checking account ${config.id}: isExisting=${isExisting}, isModified=${isModified}`);
                return false;
            });
            
            console.log(`📊 Found ${temporaryRows.length} complete temporary accounts to auto-save`);
            console.log(`📊 Found ${modifiedRows.length} modified existing accounts to auto-save`);
            console.log('🔍 Current modifiedExistingRecords set (from ref):', Array.from(modifiedExistingRecordsRef.current));

            const totalRowsToSave = temporaryRows.length + modifiedRows.length;
            if (totalRowsToSave > 0) {
                console.log('💾 Auto-saving accounts...', temporaryRows.map(r => r.id));
                
                for (const tempRow of temporaryRows) {
                    console.log(`💾 Auto-saving user: ${tempRow.id}`);
                    await autoSaveNewAccount(tempRow.id);
                }
                
                // Save modified existing users to database via API
                for (const modifiedRow of modifiedRows) {
                    console.log(`💾 Saving modified existing user: ${modifiedRow.id}`);
                    try {
                        // Update user in database via API
                        const userData = {
                            firstName: modifiedRow.firstName || '',
                            lastName: modifiedRow.lastName || '',
                            middleName: modifiedRow.middleName || '',
                            emailAddress: modifiedRow.emailAddress || '',
                            status: modifiedRow.status || 'ACTIVE',
                            startDate: modifiedRow.startDate || '',
                            endDate: modifiedRow.endDate || '',
                            password: modifiedRow.password || '',
                            technicalUser: modifiedRow.technicalUser || false,
                            assignedUserGroups: modifiedRow.assignedUserGroups || [],
                        };
                        
                        await api.put(`/api/user-management/users/${modifiedRow.id}`, userData);
                        console.log(`✅ Modified user ${modifiedRow.id} saved to database`);
                        } catch (error) {
                        console.error(`❌ Error updating user ${modifiedRow.id}:`, error);
                    }
                }
                
                // Clear the modified records set
                const modifiedRecordIds = modifiedRows.map(row => String(row.id));
                console.log('🧹 Clearing modified records set. Keeping only complete records:', modifiedRecordIds);
                setModifiedExistingRecords(new Set());
                
                // Show success animation for all auto-saved entries
                console.log('✨ Showing auto-save success animation for all entries');
                setShowAutoSaveSuccess(true);
                
                setTimeout(() => {
                    console.log('✨ Hiding auto-save success animation');
                    setShowAutoSaveSuccess(false);
                }, 3000); // Show for 3 seconds
                
                console.log(`✅ Auto-saved ${totalRowsToSave} entries successfully`);
                
                // Clear navigation warning flags on successful auto-save
                setHasUnsavedChanges(false);
                setPreventNavigation(false);
                setUserConfirmedLeave(false);
                
                return totalRowsToSave;
            } else {
                console.log('ℹ️ No rows found to auto-save');
                return 0;
            }
        } catch (error) {
            console.error('❌ Auto-save failed:', error);
            throw error;
        } finally {
            setIsAutoSaving(false);
        }
    };
    
    const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Clear auto-save timer on component unmount
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

    // Show all columns handler
    const showAllColumns = () => {
        setVisibleCols(allCols);
    };

    // Handle save all entries with validation
    const handleSaveAll = async () => {
        const effectiveConfigs = getEffectiveAccounts();
        
        // Get current license state from AccountsTable to ensure we have the latest data
        const currentLicenseState = accountsTableRef.current?.getCurrentLicenseState?.() || {};
        
        // Update effectiveConfigs with current license state
        const configsWithCurrentLicenses = effectiveConfigs.map((config: any) => {
            const currentLicenses = currentLicenseState[config.id];
            if (currentLicenses) {
                return { ...config, licenses: currentLicenses };
            }
            return config;
        });
        
        console.log('💾 Save button clicked - effective accounts state:'); 
        configsWithCurrentLicenses.forEach((c: any, index: number) => {
            console.log(`  Record ${index + 1}:`, {
                id: c.id,
                enterprise: c.enterprise || c.enterpriseName,
                product: c.product || c.productName,  
                services: c.services || c.serviceName,
                hasEnterprise: !!(c.enterprise || c.enterpriseName)?.trim(),
                hasProduct: !!(c.product || c.productName)?.trim(),
                hasServices: !!(c.services || c.serviceName)?.trim(),
                hasPendingChanges: !!pendingLocalChanges[c.id]
            });
        });

        // Clear auto-save timer and countdown since user is manually saving
        if (autoSaveTimerRef.current) {
            console.log('🛑 Manual save clicked - clearing auto-save timer');
            clearTimeout(autoSaveTimerRef.current);
            autoSaveTimerRef.current = null;
        }
        if (countdownIntervalRef.current) {
            console.log('🛑 Manual save clicked - clearing countdown interval');
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
        }
        setAutoSaveCountdown(null);
        
        // Clear any pending auto-save data from localStorage
        localStorage.removeItem('accountsAutoSave');
        console.log('🧹 Cleared auto-save data from localStorage due to manual save');

        // Get all temporary (unsaved) rows using effective configs with current licenses
        const temporaryRows = configsWithCurrentLicenses.filter((config: any) => 
            String(config.id).startsWith('tmp-')
        );

        // Get all existing rows that might have incomplete data using effective configs with current licenses
        const existingRows = configsWithCurrentLicenses.filter((config: any) => 
            !String(config.id).startsWith('tmp-')
        );

        // Check for incomplete temporary rows (including completely blank ones)
        const incompleteTemporaryRows = temporaryRows.filter((config: any) => {
            const hasFirstName = config.firstName?.trim();
            const hasLastName = config.lastName?.trim();
            const hasValidEmail = config.emailAddress?.trim() && isValidEmail(config.emailAddress);
            const hasStartDate = config.startDate?.trim();
            const hasPassword = config.password?.trim();

            return !hasFirstName || !hasLastName || !hasValidEmail || !hasStartDate || !hasPassword;
        });

        // Check for incomplete existing rows (including completely blank ones)
        const incompleteExistingRows = existingRows.filter((config: any) => {
            const hasFirstName = config.firstName?.trim();
            const hasLastName = config.lastName?.trim();
            const hasValidEmail = config.emailAddress?.trim() && isValidEmail(config.emailAddress);
            const hasStartDate = config.startDate?.trim();
            const hasPassword = config.password?.trim();

            return !hasFirstName || !hasLastName || !hasValidEmail || !hasStartDate || !hasPassword;
        });

        // Combine all incomplete rows
        const incompleteRows = [...incompleteTemporaryRows, ...incompleteExistingRows];

        // Check if there are any pending changes (auto-save timer or modified records)
        const hasActiveAutoSave = autoSaveTimerRef.current !== null;
        const hasModifiedExistingRecords = modifiedExistingRecordsRef.current.size > 0;
        const hasPendingChanges = hasActiveAutoSave || hasModifiedExistingRecords;

        console.log('🔍 Save button validation check:', {
            temporaryRowsCount: temporaryRows.length,
            incompleteTemporaryRowsCount: incompleteTemporaryRows.length,
            incompleteExistingRowsCount: incompleteExistingRows.length,
            hasActiveAutoSave,
            hasModifiedExistingRecords,
            hasPendingChanges,
            allExistingRows: existingRows.map((r: any) => ({
                id: r.id,
                accountName: r.accountName,
                email: r.email,
                phone: r.phone,
                hasAccountName: !!r.accountName?.trim(),
                hasEmail: !!r.email?.trim(),
                hasPhone: !!r.phone?.trim()
            })),
            incompleteExistingRows: incompleteExistingRows.map((r: any) => ({
                id: r.id,
                accountName: r.accountName,
                email: r.email,
                phone: r.phone
            }))
        });

        // Check for incomplete licenses in real-time by examining current data
        const currentIncompleteLicenseData: string[] = [];
        const allLicenseMissingFields = new Set<string>();
        let singleLicenseSpecificFields = new Set<string>();
        let hasSingleIncompleteAccount = false;
        
        const currentHasIncompleteLicenses = configsWithCurrentLicenses.some((config: any) => {
            if (config.licenses && config.licenses.length > 0) {
                const hasIncompleteInThisRow = config.licenses.some((license: any) => {
                    const hasEnterprise = license.enterprise?.trim();
                    const hasProduct = license.product?.trim();
                    const hasService = license.service?.trim();
                    const hasLicenseStartDate = license.licenseStartDate?.trim();
                    const hasLicenseEndDate = license.licenseEndDate?.trim();
                    const hasNumberOfUsers = license.numberOfUsers?.trim();
                    const hasValidNoticePeriod = !license.renewalNotice || license.noticePeriodDays?.trim();
                    
                    return !hasEnterprise || !hasProduct || !hasService || !hasLicenseStartDate || 
                           !hasLicenseEndDate || !hasNumberOfUsers || !hasValidNoticePeriod;
                });
                if (hasIncompleteInThisRow) {
                    currentIncompleteLicenseData.push(config.id);
                }
                return hasIncompleteInThisRow;
            }
            return false;
        });

        // Collect missing fields from all incomplete licenses
        if (currentHasIncompleteLicenses) {
            const accountsWithIncompleteLicenses: Array<{
                accountId: string;
                accountName: string;
                incompleteLicenses: number;
                totalLicenses: number;
            }> = [];
            
            configsWithCurrentLicenses.forEach((config: any) => {
                if (config.licenses && config.licenses.length > 0) {
                    const incompleteLicenses = config.licenses.filter((license: any) => {
                        const hasEnterprise = license.enterprise?.trim();
                        const hasProduct = license.product?.trim();
                        const hasService = license.service?.trim();
                        const hasLicenseStartDate = license.licenseStartDate?.trim();
                        const hasLicenseEndDate = license.licenseEndDate?.trim();
                        const hasNumberOfUsers = license.numberOfUsers?.trim();
                        const hasValidNoticePeriod = !license.renewalNotice || license.noticePeriodDays?.trim();
                        
                        return !hasEnterprise || !hasProduct || !hasService || !hasLicenseStartDate || 
                               !hasLicenseEndDate || !hasNumberOfUsers || !hasValidNoticePeriod;
                    });
                    
                    if (incompleteLicenses.length > 0) {
                        accountsWithIncompleteLicenses.push({
                            accountId: config.id,
                            accountName: config.accountName || '',
                            totalLicenses: config.licenses.length,
                            incompleteLicenses: incompleteLicenses.length
                        });
                        
                        incompleteLicenses.forEach((license: any) => {
                            const hasEnterprise = license.enterprise?.trim();
                            const hasProduct = license.product?.trim();
                            const hasService = license.service?.trim();
                            const hasLicenseStartDate = license.licenseStartDate?.trim();
                            const hasLicenseEndDate = license.licenseEndDate?.trim();
                            const hasNumberOfUsers = license.numberOfUsers?.trim();
                            const hasValidNoticePeriod = !license.renewalNotice || license.noticePeriodDays?.trim();
                            
                            if (!hasEnterprise) allLicenseMissingFields.add('Enterprise');
                            if (!hasProduct) allLicenseMissingFields.add('Product');
                            if (!hasService) allLicenseMissingFields.add('Service');
                            if (!hasLicenseStartDate) allLicenseMissingFields.add('License Start Date');
                            if (!hasLicenseEndDate) allLicenseMissingFields.add('License End Date');
                            if (!hasNumberOfUsers) allLicenseMissingFields.add('No. of Users');
                            if (!hasValidNoticePeriod) allLicenseMissingFields.add('Notice Period (days)');
                        });
                    }
                }
            });
            
            // Check if there's only one account with exactly one incomplete license
            if (accountsWithIncompleteLicenses.length === 1 && 
                accountsWithIncompleteLicenses[0].totalLicenses === 1 && 
                accountsWithIncompleteLicenses[0].incompleteLicenses === 1) {
                hasSingleIncompleteAccount = true;
                singleLicenseSpecificFields = new Set(allLicenseMissingFields);
            }
        }

        console.log('🔍 License validation check:', {
            totalConfigs: configsWithCurrentLicenses.length,
            configsWithLicenses: configsWithCurrentLicenses.filter(c => c.licenses?.length > 0).length,
            currentHasIncompleteLicenses,
            allLicenseMissingFields: Array.from(allLicenseMissingFields),
            singleLicenseSpecificFields: Array.from(singleLicenseSpecificFields),
            hasSingleIncompleteAccount,
            incompleteLicenseAccountCount: currentIncompleteLicenseData.length,
            incompleteLicenseAccounts: currentIncompleteLicenseData,
            detailedLicenseCheck: configsWithCurrentLicenses.filter(c => c.licenses?.length > 0).map(c => ({
                id: c.id,
                totalLicenses: c.licenses.length,
                licenses: c.licenses.map((l: any) => ({
                    id: l.id,
                    enterprise: `"${l.enterprise}"`,
                    product: `"${l.product}"`,
                    service: `"${l.service}"`,
                    licenseStartDate: `"${l.licenseStartDate}"`,
                    licenseEndDate: `"${l.licenseEndDate}"`,
                    numberOfUsers: `"${l.numberOfUsers}"`,
                    renewalNotice: l.renewalNotice,
                    noticePeriodDays: `"${l.noticePeriodDays || ''}"`,
                    hasEnterprise: !!l.enterprise?.trim(),
                    hasProduct: !!l.product?.trim(),
                    hasService: !!l.service?.trim(),
                    hasLicenseStartDate: !!l.licenseStartDate?.trim(),
                    hasLicenseEndDate: !!l.licenseEndDate?.trim(),
                    hasNumberOfUsers: !!l.numberOfUsers?.trim(),
                    hasValidNoticePeriod: !l.renewalNotice || !!l.noticePeriodDays?.trim(),
                    isComplete: !!(l.enterprise?.trim() && l.product?.trim() && l.service?.trim() && 
                                  l.licenseStartDate?.trim() && l.licenseEndDate?.trim() && l.numberOfUsers?.trim() &&
                                  (!l.renewalNotice || l.noticePeriodDays?.trim()))
                }))
            }))
        });

        if (temporaryRows.length === 0 && incompleteExistingRows.length === 0 && !hasPendingChanges && !currentHasIncompleteLicenses) {
            showBlueNotification('No unsaved entries to save.', 3000, false);
            
            // Clear all pending changes when there's nothing to save
            setPendingLocalChanges({});
            setHasUnsavedChanges(false);
            setPreventNavigation(false);
            setUserConfirmedLeave(false);
            setIncompleteRows([]);
            return;
        }

        if (incompleteRows.length > 0 || currentHasIncompleteLicenses) {
            const allMissingFields = new Set<string>();
            const allInvalidFields = new Set<string>();
            let totalIncompleteCount = 0;
            
            // Check main row field issues (user fields)
            if (incompleteRows.length > 0) {
                console.log('🔍 Checking missing and invalid fields for incomplete rows:', incompleteRows);
                incompleteRows.forEach((config) => {
                    console.log('📋 Checking config:', {
                        id: config.id,
                        firstName: config.firstName || '(empty)',
                        lastName: config.lastName || '(empty)',
                        emailAddress: config.emailAddress || '(empty)',
                        startDate: config.startDate || '(empty)',
                        password: config.password || '(empty)'
                    });
                    
                    // Check for missing fields
                    if (!config.firstName?.trim()) allMissingFields.add('First Name');
                    if (!config.lastName?.trim()) allMissingFields.add('Last Name');
                    if (!config.emailAddress?.trim()) allMissingFields.add('Email Address');
                    if (!config.startDate?.trim()) allMissingFields.add('Start Date');
                    if (!config.password?.trim()) allMissingFields.add('Password');
                    
                    // Check for invalid fields (present but invalid format)
                    if (config.emailAddress?.trim() && !isValidEmail(config.emailAddress)) {
                        allInvalidFields.add('Email Address');
                    }
                });
                console.log('📝 All missing fields:', Array.from(allMissingFields));
                console.log('📝 All invalid fields:', Array.from(allInvalidFields));
                totalIncompleteCount += incompleteRows.length;
            }
            
            // Check license field issues using real-time data with specific missing fields
            if (currentHasIncompleteLicenses) {
                if (hasSingleIncompleteAccount) {
                    // Single license subrow - show specific field names
                    singleLicenseSpecificFields.forEach(field => allMissingFields.add(field));
                } else {
                    // Multiple license subrows - use generic message
                    allMissingFields.add('License fields');
                }
                totalIncompleteCount += currentIncompleteLicenseData.length;
            }
            
            // Create comprehensive validation message
            let message = '';
            const hasMissingFields = allMissingFields.size > 0;
            const hasInvalidFields = allInvalidFields.size > 0;
            
            // Build validation message based on field issues
            let validationIssues: string[] = [];
            if (hasMissingFields) {
                validationIssues.push(`Missing required fields: ${Array.from(allMissingFields).join(', ')}`);
            }
            if (hasInvalidFields) {
                validationIssues.push(`Invalid field format: ${Array.from(allInvalidFields).join(', ')}`);
            }
            
            if (incompleteRows.length > 0 && currentHasIncompleteLicenses) {
                if (hasSingleIncompleteAccount) {
                    message = `Found ${incompleteRows.length} incomplete record${incompleteRows.length > 1 ? 's' : ''} and incomplete licenses in ${currentIncompleteLicenseData.length} account${currentIncompleteLicenseData.length > 1 ? 's' : ''}.\n${validationIssues.join('\n')}`;
                } else {
                    message = `Found ${incompleteRows.length} incomplete record${incompleteRows.length > 1 ? 's' : ''} and incomplete licenses in ${currentIncompleteLicenseData.length} account${currentIncompleteLicenseData.length > 1 ? 's' : ''}.\nSome required fields have issues.`;
                }
            } else if (incompleteRows.length > 0) {
                message = `Found ${incompleteRows.length} incomplete record${incompleteRows.length > 1 ? 's' : ''}.\n${validationIssues.join('\n')}`;
            } else if (currentHasIncompleteLicenses) {
                if (hasSingleIncompleteAccount) {
                    message = `Found incomplete licenses in ${currentIncompleteLicenseData.length} account${currentIncompleteLicenseData.length > 1 ? 's' : ''}.\nMissing required fields: ${Array.from(allMissingFields).join(', ')}`;
                } else {
                    message = `Found incomplete licenses in ${currentIncompleteLicenseData.length} account${currentIncompleteLicenseData.length > 1 ? 's' : ''}.\nSome required fields are missing.`;
                }
            }
            
            setValidationMessage(message);
            setShowValidationErrors(true); // Enable red border highlighting for validation errors
            
            // Set incomplete row IDs for highlighting
            const incompleteRowIds = incompleteRows.map(r => r.id);
            console.log('🎯 Setting incomplete row IDs for highlighting:', incompleteRowIds);
            setIncompleteRows(incompleteRowIds); // Store incomplete row IDs for highlighting

            // Build per-row field error map (e.g. invalid email format) to pass to table
            const fieldErrors: {[key:string]: Record<string,string>} = {};
            incompleteRows.forEach((cfg) => {
                if (cfg.emailAddress?.trim() && !isValidEmail(cfg.emailAddress)) {
                    fieldErrors[cfg.id] = {
                        ...(fieldErrors[cfg.id] || {}),
                        emailAddress: 'Please enter a valid email address'
                    };
                }
                // Add other format checks here in future (e.g. password strength)
            });
            setExternalFieldErrors(fieldErrors);
            
            console.log('📝 Final validation message and counts:', {
                message,
                incompleteMainRows: incompleteRows.length,
                incompleteLicenseAccounts: currentIncompleteLicenseData.length,
                hasSingleIncompleteAccount,
                totalIncompleteCount,
                allMissingFieldsArray: Array.from(allMissingFields),
                incompleteRowIds
            });
            setShowValidationModal(true);
            return;
        }

        // Save all complete temporary rows and handle pending changes
        try {
            let savedCount = 0;
            let hasError = false;
            const completeTemporaryRows = temporaryRows.filter((config: any) => {
                const hasFirstName = config.firstName?.trim();
                const hasLastName = config.lastName?.trim();
                const hasEmail = config.emailAddress?.trim();
                const hasStartDate = config.startDate?.trim();
                const hasPassword = config.password?.trim();
                return hasFirstName && hasLastName && hasEmail && hasStartDate && hasPassword;
            });
            
            console.log('✅ Complete temporary rows to save:', completeTemporaryRows.length, completeTemporaryRows);
            
            // Save temporary rows
            for (const tempRow of completeTemporaryRows) {
                try {
                    await autoSaveNewAccount(tempRow.id);
                    savedCount++;
                } catch (error) {
                    console.error(`❌ Error saving temporary user ${tempRow.id}:`, error);
                    hasError = true;
                }
            }
            
            // Save modified existing users to database
            const modifiedExistingUserIds = Array.from(modifiedExistingRecordsRef.current);
            if (modifiedExistingUserIds.length > 0) {
                console.log('💾 Saving modified existing users:', modifiedExistingUserIds);
                
                for (const userId of modifiedExistingUserIds) {
                    const user = accounts.find(acc => acc.id === userId);
                    if (user && !String(user.id).startsWith('tmp-')) {
                        try {
                            // Include account/enterprise context - exactly like autosave
                            const userData = {
                                firstName: user.firstName || '',
                                lastName: user.lastName || '',
                                middleName: user.middleName || '',
                                emailAddress: user.emailAddress || '',
                                status: user.status || 'ACTIVE',
                                startDate: user.startDate || '',
                                endDate: user.endDate || '',
                                password: user.password || '',
                                technicalUser: user.technicalUser || false,
                                assignedUserGroups: user.assignedUserGroups || [],
                                // Include account/enterprise context
                                accountId: selectedAccountId,
                                accountName: selectedAccountName,
                                enterpriseId: selectedEnterpriseId,
                                enterpriseName: selectedEnterprise
                            };
                            
                            console.log(`🔄 Updating user ${user.id} with context:`, userData);
                            await api.put(`/api/user-management/users/${user.id}`, userData);
                            console.log(`✅ Modified user ${user.id} saved to database`);
                            savedCount++;
                        } catch (error) {
                            console.error(`❌ Error saving modified user ${user.id}:`, error);
                            hasError = true;
                        }
                    }
                }
                
                // Clear modified records set after saving
                modifiedExistingRecordsRef.current.clear();
                setModifiedExistingRecords(new Set());
            }
            
            // Handle any remaining pending changes from auto-save timer
            if (hasActiveAutoSave) {
                console.log('💾 Processing pending auto-save changes');
                const pendingSavedCount = await executeAutoSave();
                if (pendingSavedCount > 0) {
                    savedCount += pendingSavedCount;
                }
            }
            
            if (savedCount > 0) {
                // Reload data from database to get latest state
                console.log('🔄 Reloading users after successful manual save...');
                await loadUsers();
                
                // Show success notification
                if (hasError) {
                    showBlueNotification(`Successfully saved ${savedCount} entries in database. Some entries had errors.`);
                } else {
                    showBlueNotification(`Successfully saved ${savedCount} entries in database.`);
                }
                setShowValidationErrors(false); // Clear validation errors on successful save
                setExternalFieldErrors({});
                
                // Clear all pending changes and navigation warning flags on successful save
                setPendingLocalChanges({});
                setHasUnsavedChanges(false);
                setPreventNavigation(false);
                setUserConfirmedLeave(false);
                setIncompleteRows([]);
            } else if (hasPendingChanges) {
                showBlueNotification('No changes to save.');
                setShowValidationErrors(false); // Clear validation errors on successful save
                setExternalFieldErrors({});
                
                // Clear all pending changes and navigation warning flags on successful save
                setPendingLocalChanges({});
                setHasUnsavedChanges(false);
                setPreventNavigation(false);
                setUserConfirmedLeave(false);
                setIncompleteRows([]);
            } else {
                showBlueNotification('No complete entries to save.', 3000, false);
            }
        } catch (error) {
            console.error('Failed to save entries:', error);
            showBlueNotification('Failed to save some entries. Please try again.', 3000, false);
        }
    };

    // Navigation warning handler
    const handleNavigationAttempt = (navigationFn: () => void) => {
        const incomplete = getIncompleteRows();
        const hasChanges = getUnsavedChanges();
        
        console.log('🚨 Navigation attempt blocked check:', {
            incompleteCount: incomplete.length,
            incompleteIds: incomplete,
            hasChanges,
            pendingLocalChangesKeys: Object.keys(pendingLocalChanges),
            modifiedExistingRecordsArray: Array.from(modifiedExistingRecords),
            autoSaveTimerActive: !!autoSaveTimerRef.current
        });
        
        if (incomplete.length > 0 || hasChanges) {
            setIncompleteRows(incomplete);
            setPendingNavigation(() => navigationFn);
            setShowNavigationWarning(true);
        } else {
            navigationFn();
        }
    };

    // Enhanced unsaved changes detection function
    const getUnsavedChanges = useCallback(() => {
        const effectiveConfigs = accounts;
        
        // Check for pending local changes
        const hasPendingLocalChanges = Object.keys(pendingLocalChanges).length > 0;
        
        // Check for modified existing records
        const hasModifiedExistingRecords = modifiedExistingRecords.size > 0;
        
        // Check for new rows with any data
        const hasPartialNewRows = effectiveConfigs.some((config: any) => {
            const isNewRow = String(config.id).startsWith('tmp-');
            if (!isNewRow) return false;
            
            // Check if there's any data in the new row
            const hasFirstName = config.firstName?.trim();
            const hasLastName = config.lastName?.trim();
            const hasEmail = config.emailAddress?.trim();
            const hasStartDate = config.startDate?.trim();
            const hasPassword = config.password?.trim();
            const hasTechnicalUser = config.technicalUser;
            const hasUserGroups = config.assignedUserGroups?.length > 0;
            
            return hasFirstName || hasLastName || hasEmail || hasStartDate || hasPassword || hasTechnicalUser || hasUserGroups;
        });
        
        const hasChanges = hasPendingLocalChanges || hasModifiedExistingRecords || hasPartialNewRows;
        
        console.log('🔍 getUnsavedChanges check:', {
            hasPendingLocalChanges,
            hasModifiedExistingRecords,
            hasPartialNewRows,
            pendingLocalChangesKeys: Object.keys(pendingLocalChanges),
            modifiedExistingRecordsArray: Array.from(modifiedExistingRecords),
            hasChanges
        });
        
        return hasChanges;
    }, [accounts, pendingLocalChanges, modifiedExistingRecords]);

    // Update unsaved changes state when data changes
    useEffect(() => {
        const hasChanges = getUnsavedChanges();
        setHasUnsavedChanges(hasChanges);
        setPreventNavigation(hasChanges);
    }, [getUnsavedChanges]);

    // Add beforeunload event listener for browser navigation and auto-save on exit
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            // If user has already confirmed they want to leave, don't show browser warning
            if (userConfirmedLeave) {
                return;
            }
            
            const incomplete = getIncompleteRows();
            const hasChanges = getUnsavedChanges();
            
            // Check for pending auto-save and execute synchronously
            const storedData = localStorage.getItem('accountsAutoSave');
            if (storedData) {
                console.log('⚠️ Pending auto-save detected on page unload');
                // We can't await in beforeunload, but we can trigger the save
                // The user will see a warning if there are incomplete rows
            }
            
            if (incomplete.length > 0 || hasChanges) {
                e.preventDefault();
                e.returnValue = incomplete.length > 0 
                    ? `You have ${incomplete.length} incomplete user ${incomplete.length === 1 ? 'entry' : 'entries'}. Your changes will be lost if you leave.`
                    : 'You have unsaved changes that will be lost if you leave.';
                return e.returnValue;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        
        // Also handle when user switches tabs or minimizes window
        const handleVisibilityChange = async () => {
            if (document.hidden) {
                console.log('📱 Page hidden - checking for pending auto-save');
                const storedData = localStorage.getItem('enterpriseAutoSave');
                if (storedData) {
                    console.log('⚡ Executing auto-save due to page visibility change');
                    // Execute auto-save inline since we can't access the function
                    try {
                        setIsAutoSaving(true);
                        
                        const temporaryRows = accountsRef.current.filter((config) => {
                            const isTemp = String(config.id).startsWith('tmp-');
                            if (!isTemp) return false;
                            
                            const hasAccountName = config.accountName?.trim();
                            const hasMasterAccount = config.masterAccount?.trim();
                            const hasCloudType = config.cloudType?.trim();
                            
                            return hasAccountName && hasMasterAccount && hasCloudType;
                        });
                        
                        let savedCount = 0;
                        for (const tempRow of temporaryRows) {
                            try {
                                await autoSaveNewAccount(tempRow.id);
                                savedCount++;
                            } catch (error) {
                                console.error(`❌ Failed to auto-save account ${tempRow.id}:`, error);
                            }
                        }
                        
                        if (savedCount > 0) {
                            showBlueNotification(`Auto-saved ${savedCount} entries before leaving page`);
                            console.log(`✅ Auto-saved ${savedCount} entries on page hide`);
                        }
                        
                        localStorage.removeItem('enterpriseAutoSave');
                    } catch (error) {
                        console.error('❌ Auto-save on visibility change failed:', error);
                    } finally {
                        setIsAutoSaving(false);
                    }
                }
            }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [accounts]);

    // Router navigation guard - comprehensive navigation interception
    useEffect(() => {
        // Store reference to original methods
        const originalPush = router.push;
        const originalReplace = router.replace;
        
        // Store original methods in ref so modal can access them
        originalRouterRef.current = { push: originalPush, replace: originalReplace };
        
        router.push = (href: string, options?: any) => {
            // Check for unsaved changes but allow navigation if user has confirmed
            const currentUnsavedChanges = getUnsavedChanges();
            const currentIncompleteRows = getIncompleteRows();
            
            if (typeof href === 'string' && (currentUnsavedChanges || currentIncompleteRows.length > 0) && !userConfirmedLeave) {
                console.log('🚨 Navigation intercepted - push method:', {
                    hasUnsavedChanges: currentUnsavedChanges,
                    incompleteRows: currentIncompleteRows.length,
                    pendingLocalChanges: Object.keys(pendingLocalChanges),
                    modifiedExistingRecords: Array.from(modifiedExistingRecords),
                    userConfirmedLeave
                });
                
                if (currentIncompleteRows.length > 0 || currentUnsavedChanges) {
                    setIncompleteRows(currentIncompleteRows);
                    setPendingNavigationUrl(href);
                    setShowNavigationWarning(true);
                    return Promise.resolve(true); // Return resolved promise to prevent error
                }
            }
            return originalPush(href, options);
        };

        router.replace = (href: string, options?: any) => {
            // Check for unsaved changes but allow navigation if user has confirmed
            const currentUnsavedChanges = getUnsavedChanges();
            const currentIncompleteRows = getIncompleteRows();
            
            if (typeof href === 'string' && (currentUnsavedChanges || currentIncompleteRows.length > 0) && !userConfirmedLeave) {
                console.log('🚨 Navigation intercepted - replace method:', {
                    hasUnsavedChanges: currentUnsavedChanges,
                    incompleteRows: currentIncompleteRows.length,
                    pendingLocalChanges: Object.keys(pendingLocalChanges),
                    modifiedExistingRecords: Array.from(modifiedExistingRecords),
                    userConfirmedLeave
                });
                
                if (currentIncompleteRows.length > 0 || currentUnsavedChanges) {
                    setIncompleteRows(currentIncompleteRows);
                    setPendingNavigationUrl(href);
                    setShowNavigationWarning(true);
                    return Promise.resolve(true); // Return resolved promise to prevent error
                }
            }
            return originalReplace(href, options);
        };

        // Handle browser history navigation (back/forward buttons)
        const handlePopState = (event: PopStateEvent) => {
            const currentUnsavedChanges = getUnsavedChanges();
            const currentIncompleteRows = getIncompleteRows();
            
            if ((currentUnsavedChanges || currentIncompleteRows.length > 0) && !userConfirmedLeave) {
                event.preventDefault();
                // Push current state back to prevent navigation
                window.history.pushState(null, '', window.location.href);
                setIncompleteRows(currentIncompleteRows);
                setShowNavigationWarning(true);
            }
        };

        // Add history listener for browser navigation
        window.addEventListener('popstate', handlePopState);

        // Clean up by restoring original router methods and removing listeners
        return () => {
            router.push = originalPush;
            router.replace = originalReplace;
            window.removeEventListener('popstate', handlePopState);
        };
    }, [router, hasUnsavedChanges, getIncompleteRows, userConfirmedLeave, pendingLocalChanges, modifiedExistingRecords]);

    // Effect to detect AI panel collapse state by observing its width
    useEffect(() => {
        const detectAIPanelState = () => {
            // Look for the AI panel by finding the motion.div with width animations
            const aiPanel = document.querySelector('[class*="w-\\[300px\\]"], [class*="w-16"]') as HTMLElement;
            if (aiPanel) {
                const computedStyle = window.getComputedStyle(aiPanel);
                const width = parseInt(computedStyle.width);
                const isCollapsed = width <= 80; // 64px + some margin for safety
                setIsAIPanelCollapsed(isCollapsed);
                console.log('🤖 AI Panel width detected:', width, 'Collapsed:', isCollapsed);
            }
        };

        // Create a ResizeObserver to watch for AI panel width changes
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const width = entry.contentRect.width;
                const isCollapsed = width <= 80;
                setIsAIPanelCollapsed(isCollapsed);
                console.log('🤖 AI Panel resized to:', width, 'Collapsed:', isCollapsed);
            }
        });

        // Find and observe the AI panel
        const findAndObserveAIPanel = () => {
            // Look for the AI panel container
            const aiPanelContainer = document.querySelector('.order-1.lg\\:order-2') as HTMLElement;
            if (aiPanelContainer) {
                const aiPanel = aiPanelContainer.querySelector('div') as HTMLElement;
                if (aiPanel) {
                    resizeObserver.observe(aiPanel);
                    detectAIPanelState(); // Initial detection
                    console.log('🤖 AI Panel observer attached');
                    return true;
                }
            }
            return false;
        };

        // Try to find the panel immediately
        if (!findAndObserveAIPanel()) {
            // If not found, try again after a short delay
            const timeoutId = setTimeout(() => {
                findAndObserveAIPanel();
            }, 500);

            return () => {
                clearTimeout(timeoutId);
                resizeObserver.disconnect();
            };
        }

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    // Add test functions (temporary for debugging)
    if (typeof window !== 'undefined') {
        (window as any).addTestRow = () => {
            const newId = `tmp-${Date.now()}`;
            const testRow = {
                id: newId,
                accountName: '',
                email: '',
                phone: '',
            } as any;
            setAccounts((prev) => {
                const updated = [...prev, testRow];
                // Apply stable sorting to maintain display order
                return sortConfigsByDisplayOrder(updated);
            });
            console.log('🧪 Added test row:', newId);
        };
        (window as any).testAutoSave = (tempRowId?: string) => {
            const rowId = tempRowId || `tmp-${Date.now()}`;
            console.log('🧪 Testing auto-save for account:', rowId);
            autoSaveNewAccount(rowId);
        };
        (window as any).showAccounts = () => {
            console.log('📋 Current enterprise configs:', accounts);
            console.log('📊 Current dropdown options:', dropdownOptions);
        };
        (window as any).testNavigationWarning = () => {
            const incomplete = getIncompleteRows();
            console.log(
                '🧪 Testing navigation warning, incomplete rows:',
                incomplete,
            );
            if (incomplete.length > 0) {
                setIncompleteRows(incomplete);
                setShowNavigationWarning(true);
            } else {
                console.log('No incomplete rows found');
            }
        };

        // Test animation function
        (window as any).testAnimation = (rowId?: string) => {
            const testRowId =
                rowId || (accounts.length > 0 ? accounts[0].id : 'test-id');
            console.log('🧪 Testing animation for row:', testRowId);
            startRowCompressionAnimation(testRowId);
        };
    }

    // Load data on component mount - DISABLED: Now using loadUsers() with account/enterprise filters
    // The new loadUsers() function (line 271) handles data loading with proper account/enterprise context
    // This legacy code loads all users without filters and is no longer needed
    useEffect(() => {
        // Skip legacy data loading - now handled by loadUsers() with account/enterprise filters
        console.log('ℹ️ [ManageUsers] Legacy useEffect skipped - using new loadUsers() with filters');
        setIsLoading(false);
        return;
        
        /* LEGACY CODE - DISABLED
        let mounted = true; // Prevent state updates if component unmounted
        
        (async () => {
            try {
                setIsLoading(true);
                console.log('🔄 Loading enterprise linkages...');

                // Load user data from database API
                console.log('🔄 Loading users from database API...');
                
                let accountsData: any[] = [];
                
                try {
                    // Fetch users from database
                    const response = await api.get<any[]>('/api/user-management/users');
                    console.log('📊 Loaded users from database:', response?.length || 0);
                    console.log('🔍 Raw API response:', response);
                    
                    if (response && Array.isArray(response)) {
                        accountsData = response.map((user: any) => ({
                            id: user.id?.toString() || `user-${Date.now()}`,
                            firstName: user.firstName || '',
                            middleName: user.middleName || '',
                            lastName: user.lastName || '',
                            emailAddress: user.emailAddress || '',
                            status: user.status || 'ACTIVE',
                            startDate: user.startDate || '',
                            endDate: user.endDate || '',
                            // Display actual password from database
                            password: user.password || '',
                            technicalUser: user.technicalUser || false,
                            assignedUserGroups: user.assignedUserGroups || [],
                            createdAt: user.createdAt || new Date().toISOString(),
                            updatedAt: user.updatedAt || new Date().toISOString(),
                        }));
                        console.log('✅ Users loaded and transformed:', accountsData.length);
                        console.log('🔍 Transformed user data:', accountsData);
                    } else {
                        console.log('ℹ️ No users returned from API, starting with empty array');
                        accountsData = [];
                    }
                    } catch (error) {
                    console.error('❌ Error loading users from database:', error);
                    console.log('ℹ️ Starting with empty array');
                        accountsData = [];
                }

                // Only update state if component is still mounted
                if (!mounted) {
                    console.log('⚠️ Component unmounted during data load, skipping state update');
                    return;
                }

                console.log(
                    '📊 Loaded accounts:',
                    accountsData?.length || 0,
                );

                if (!accountsData || accountsData.length === 0) {
                    console.log('ℹ️ No accounts found');
                    setAccounts([]);
                    setIsLoading(false);
                    return;
                }

                // Transform account data to AccountRow format (preserve all user management fields)
                const transformedAccounts = accountsData
                    .map((account: any, index: number) => ({
                        id: account.id,
                        // User management fields - preserve all fields from stored data
                        firstName: account.firstName || '',
                        middleName: account.middleName || '',
                        lastName: account.lastName || '',
                        emailAddress: account.emailAddress || '',
                        status: account.status || 'ACTIVE',
                        startDate: account.startDate || '', // Preserve start date
                        endDate: account.endDate || '',
                        password: account.password || '',
                        technicalUser: account.technicalUser || false,
                        assignedUserGroups: account.assignedUserGroups || [],
                        // Store creation time and display order for stable sorting
                        createdAt: account.createdAt,
                        updatedAt: account.updatedAt,
                        displayOrder: index, // Preserve original order
                    }))
                    // Sort by creation time first, then by display order for stable ordering
                    .sort((a: any, b: any) => {
                        const timeA = new Date(a.createdAt).getTime();
                        const timeB = new Date(b.createdAt).getTime();
                        if (timeA !== timeB) {
                            return timeA - timeB;
                        }
                        // If creation times are equal, use display order
                        return a.displayOrder - b.displayOrder;
                    });

                // Initialize client-side display order tracking
                transformedAccounts.forEach((config: any, index: number) => {
                    displayOrderRef.current.set(config.id, index);
                });

                console.log('📊 Applied stable sorting by creation time and display order to maintain row order');
                console.log('📊 Initialized client-side display order tracking:', Object.fromEntries(displayOrderRef.current));
                
                // Apply final stable sort by display order
                const finalSortedConfigs = sortConfigsByDisplayOrder(transformedAccounts);
                
                // Only set initial state if no configs exist yet (to prevent overwriting user changes)
                setAccounts((prevConfigs) => {
                    // If user has already added temporary rows, preserve them
                    const hasTemporaryRows = prevConfigs.some(config => String(config.id).startsWith('tmp-'));
                    if (hasTemporaryRows) {
                        console.log('⚠️ Preserving temporary rows, not overwriting with API data');
                        return prevConfigs; // Keep existing state with temporary rows
                    }
                    return finalSortedConfigs; // Initial load
                });
                
                console.log(
                    '✅ Enterprise linkages loaded and transformed successfully',
                );
            } catch (error) {
                console.error('❌ Failed to load enterprise linkages:', error);
                if (mounted) {
                    setAccounts([]);
                }
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        })();

        // Cleanup function
        return () => {
            mounted = false;
        };
        END OF LEGACY CODE */
    }, []); // Empty dependency array - only run once on mount

    // Force table re-render when accounts data changes
    useEffect(() => {
        console.log(
            '📋 Accounts data changed, current count:',
            accounts.length,
        );
        console.log('📋 Current accounts state:', 
            accounts.map(c => ({
                id: c.id,
                accountName: c.accountName || c.name,
                email: c.email,
                phone: c.phone,
                hasAccountName: !!(c.accountName || c.name)?.trim(),
                displayOrder: displayOrderRef.current.get(c.id)
            }))
        );
        
        // Update dropdown options when accounts change
        if (accounts.length > 0) {
            loadDropdownOptions();
        }
    }, [accounts, loadDropdownOptions]);

    // Ref for AccountsTable to access its methods
    const accountsTableRef = useRef<any>(null);

    // Function to delete license from the table
    const deleteLicenseFromTable = async (licenseId: string) => {
        console.log('🗑️ Deleting license from all accounts:', licenseId);
        
        // Find and remove the license from accounts state and localStorage
        setAccounts((prevAccounts) => {
            const updatedAccounts = prevAccounts.map(account => {
                if (account.licenses && account.licenses.length > 0) {
                    // Remove the license from this account if it exists
                    const updatedLicenses = account.licenses.filter((license: any) => license.id !== licenseId);
                    if (updatedLicenses.length !== account.licenses.length) {
                        console.log(`� Removing license ${licenseId} from account ${account.id}`);
                        return { ...account, licenses: updatedLicenses };
                    }
                }
                return account;
            });
            
            // Update localStorage with the modified accounts
            localStorage.setItem('accounts-data', JSON.stringify(updatedAccounts));
            console.log('✅ License deleted from accounts and localStorage');
            
            return updatedAccounts;
        });
    };



    // Row squeeze animation sequence
    const startRowCompressionAnimation = async (rowId: string) => {
        console.log('🎬 Starting squeeze animation for row:', rowId);

        // Step 1: Squeeze the row horizontally with animation
        setCompressingRowId(rowId);

        // Wait for squeeze animation
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Step 2: Fade out the row
        setFoldingRowId(rowId);
        setCompressingRowId(null);

        // Wait for fade animation
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Step 3: Show confirmation modal
        setPendingDeleteRowId(rowId);
        setDeleteType('account');
        setShowDeleteConfirmation(true);
        setFoldingRowId(null);
    };

    // License squeeze animation sequence
    const startLicenseCompressionAnimation = async (licenseId: string) => {
        console.log('🎬 Starting license squeeze animation for:', licenseId);

        // Step 1: Squeeze the license horizontally with animation
        setCompressingLicenseId(licenseId);

        // Wait for squeeze animation
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Step 2: Fade out the license
        setFoldingLicenseId(licenseId);
        setCompressingLicenseId(null);

        // Wait for fade animation
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Step 3: Show confirmation modal for license
        setPendingDeleteLicenseId(licenseId);
        setDeleteType('license');
        setShowDeleteConfirmation(true);
        setFoldingLicenseId(null);
    };

    // Handle delete confirmation
    const handleDeleteConfirm = async () => {
        if (deleteType === 'account' && !pendingDeleteRowId) return;
        if (deleteType === 'license' && !pendingDeleteLicenseId) return;

        setDeletingRow(true);
        try {
            if (deleteType === 'account') {
                console.log('🗑️ Deleting account:', pendingDeleteRowId);
                
                // Add a small delay to show the loading state
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Find the user to be deleted for debugging
                const userToDelete = accounts.find(acc => acc.id === pendingDeleteRowId);
                console.log('📄 User data to delete:', userToDelete);

                // Delete from database via API (only if not a temporary row)
                if (!String(pendingDeleteRowId).startsWith('tmp-')) {
                    try {
                        // Build query parameters with account/enterprise context - exactly like Manage User Groups
                        const deleteParams = new URLSearchParams({
                            accountId: selectedAccountId,
                            accountName: selectedAccountName,
                            enterpriseId: selectedEnterpriseId,
                            enterpriseName: selectedEnterprise
                        });
                        
                        console.log('🗑️ Deleting user with context:', {
                            userId: pendingDeleteRowId,
                            accountId: selectedAccountId,
                            accountName: selectedAccountName,
                            enterpriseId: selectedEnterpriseId,
                            enterpriseName: selectedEnterprise
                        });
                        
                        await api.del(`/api/user-management/users/${pendingDeleteRowId}?${deleteParams.toString()}`);
                        console.log('✅ User deleted from database via API');
                    } catch (error) {
                        console.error('❌ Error deleting user from database:', error);
                        throw new Error('Failed to delete user from database');
                    }
                } else {
                    console.log('ℹ️ Temporary row - only removing from frontend state and localStorage');
                    // Remove temporary row from localStorage
                const storedAccounts = localStorage.getItem('accounts-data');
                if (storedAccounts) {
                    try {
                        const accountsData = JSON.parse(storedAccounts);
                        const updatedAccountsData = accountsData.filter((acc: any) => acc.id !== pendingDeleteRowId);
                        localStorage.setItem('accounts-data', JSON.stringify(updatedAccountsData));
                            console.log('✅ Temporary user deleted from localStorage');
                    } catch (error) {
                        console.error('Error updating localStorage:', error);
                        }
                    }
                }

                // Remove from local state
                setAccounts((prev) => {
                    const updated = prev.filter((config) => config.id !== pendingDeleteRowId);
                    // Apply stable sorting to maintain display order
                    return sortConfigsByDisplayOrder(updated);
                });

                console.log('✅ User deleted successfully');
                
                // Show success notification
                showBlueNotification('Successfully deleted 1 entries.');
            } else if (deleteType === 'license') {
                console.log('🗑️ Deleting license:', pendingDeleteLicenseId);

                // Find the row that contains this license and delete it
                if (pendingDeleteLicenseId) {
                    // Add a small delay to show the loading state
                    await new Promise(resolve => setTimeout(resolve, 1200));
                    
                    // Call the completion function directly via ref
                    if (accountsTableRef.current && accountsTableRef.current.completeLicenseDeletion) {
                        accountsTableRef.current.completeLicenseDeletion();
                    }
                    
                    // Also call the table function for any additional cleanup
                    await deleteLicenseFromTable(pendingDeleteLicenseId);
                }
                
                console.log('✅ License deletion confirmed');
            }

            // Close modal and reset state
            setShowDeleteConfirmation(false);
            setPendingDeleteRowId(null);
            setPendingDeleteLicenseId(null);

            // Trigger table re-render
            setTableVersion((prev) => prev + 1);
        } catch (error) {
            console.error(`❌ Failed to delete ${deleteType}:`, error);
            console.error('❌ Full error details:', {
                error,
                deleteType,
                pendingDeleteRowId,
                pendingDeleteLicenseId,
                storageType: 'database'
            });
            
            // Log the specific error message if available
            if (error instanceof Error) {
                console.error('❌ Error message:', error.message);
            }
            
            // Show error notification
            showBlueNotification(`Failed to delete ${deleteType}. Please try again.`, 5000, false);
        } finally {
            setDeletingRow(false);
        }
    };

    const handleDeleteCancel = () => {
        setShowDeleteConfirmation(false);
        setPendingDeleteRowId(null);
        setPendingDeleteLicenseId(null);
        setDeleteType('account');
    };

    // Start date protection modal handlers
    const handleShowStartDateProtectionModal = (message: string) => {
        setStartDateProtectionMessage(message);
        setShowStartDateProtectionModal(true);
    };

    const handleStartDateProtectionClose = () => {
        setShowStartDateProtectionModal(false);
        setStartDateProtectionMessage('');
    };

    // User Group modal handlers
    const handleOpenUserGroupModal = (row: AccountRow) => {
        console.log('🔵 handleOpenUserGroupModal called with row:', row);
        console.log('🔵 row.assignedUserGroups:', row.assignedUserGroups);
        console.log('🔵 row.id:', row.id);
        
        // CRITICAL FIX: Always use the account from the accounts state instead of the row from the table
        // This ensures we have the most up-to-date data, including any recent saves
        const actualAccount = accounts.find(a => a.id === row.id);
        console.log('🔍 Account from accounts state:', actualAccount);
        console.log('🔍 Account assignedUserGroups:', actualAccount?.assignedUserGroups);
        
        if (actualAccount) {
            // Use the account from state, not the row from the table
            setSelectedUserForGroups(actualAccount as AccountRow);
        } else {
            // Fallback to row if account not found (shouldn't happen)
            console.warn('⚠️ Account not found in state, falling back to row');
            setSelectedUserForGroups(row);
        }
        setShowUserGroupModal(true);
    };

    const handleCloseUserGroupModal = () => {
        setShowUserGroupModal(false);
        setSelectedUserForGroups(null);
    };

    const handleRolesUpdated = useCallback((updatedGroups: UserGroup[]) => {
        if (!selectedUserForGroups) return;

        setAccounts(prevAccounts => {
            const updated = prevAccounts.map(account =>
                account.id === selectedUserForGroups.id
                    ? { ...account, assignedUserGroups: updatedGroups as any }
                    : account
            );
            return sortConfigsByDisplayOrder(updated);
        });

        setSelectedUserForGroups(prev =>
            prev ? ({ ...prev, assignedUserGroups: updatedGroups as any } as AccountRow) : prev
        );
    }, [selectedUserForGroups, sortConfigsByDisplayOrder]);

    const handleSaveUserGroups = (selectedUserGroups: UserGroup[]) => {
        console.log('💾 handleSaveUserGroups called with:', selectedUserGroups);
        if (selectedUserForGroups) {
            // Store complete UserGroup objects in assignedUserGroups
            // This preserves all the data (groupName, entity, product, service, etc.)
            
            // Update the user's assigned groups
            setAccounts(prevAccounts => {
                const updated = prevAccounts.map(account => 
                    account.id === selectedUserForGroups.id 
                        ? { ...account, assignedUserGroups: selectedUserGroups as any }
                        : account
                );
                const updatedAccount = updated.find(a => a.id === selectedUserForGroups.id);
                console.log('📝 Updated accounts with user groups:', updatedAccount);
                console.log('📝 Specifically assignedUserGroups property:', updatedAccount?.assignedUserGroups);
                return sortConfigsByDisplayOrder(updated);
            });
            
            // DO NOT mark as modified - the modal already saved changes to the database
            // Marking as modified would trigger the unsaved changes navigation guard incorrectly
            console.log('ℹ️ User groups saved via modal (already in DB) - not marking as modified');
            
            // REMOVED: Don't mark as modified for auto-save since modal already saved to DB
            // if (selectedUserForGroups.id !== 'new') {
            //     setModifiedExistingRecords(prev => {
            //         const newSet = new Set(prev);
            //         newSet.add(selectedUserForGroups.id);
            //         return newSet;
            //     });
            //     modifiedExistingRecordsRef.current.add(selectedUserForGroups.id);
            // }
            
            handleCloseUserGroupModal();
        }
    };

    // Reusable function to add new row (used by both toolbar button and table add row button)
    const handleAddNewRow = () => {
        console.log('➕ Add new row requested');
        
        // Clear any pending autosave to prevent blank rows from being saved
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
            autoSaveTimerRef.current = null;
        }
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
        }
        setAutoSaveCountdown(null);
        setIsAutoSaving(false);
        
        // Check if there's already a blank row
        if (hasBlankRow()) {
            showBlueNotification(
                'Please complete the existing blank row before adding a new one.',
                3000,
                false // No checkmark for error message
            );
            return;
        }

        // Check for incomplete licenses
        if (hasIncompleteLicenses) {
            setValidationMessage('Please complete all license fields before adding a new row.');
            setShowValidationErrors(true); // Enable red border highlighting for validation errors
            setShowValidationModal(true);
            return;
        }

        // Check for incomplete rows before adding new row
        const validation = validateIncompleteRows();
        if (validation.hasIncomplete) {
            setValidationMessage(validation.message);
            setShowValidationErrors(true); // Enable red border highlighting for validation errors
            setShowValidationModal(true);
            return;
        }

        const newId = `tmp-${Date.now()}`;
        const today = new Date();
        const localToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`; // Get YYYY-MM-DD format (local timezone)
        const newAccount = {
            id: newId,
            firstName: '',
            middleName: '',
            lastName: '',
            emailAddress: '',
            status: 'ACTIVE', // Default status is Active for new users
            startDate: localToday, // Auto-populate start date with system date
            endDate: '',
            password: '',
            technicalUser: false,
            assignedUserGroups: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        } as any;
        
        setAccounts((prev) => {
            const updated = [...prev, newAccount];
            // Apply stable sorting to maintain display order
            const sorted = sortConfigsByDisplayOrder(updated);
            // Don't save blank rows to localStorage - they'll be saved when fields are filled or on manual save
            console.log('➕ New row added (not saved to localStorage yet - will save when complete)');
            return sorted;
        });
        
        // Clear validation errors when adding a new row to ensure new rows start with normal styling
        if (showValidationErrors) {
            setShowValidationErrors(false);
            setExternalFieldErrors({});
        }
        
        console.log('➕ Added new blank row:', newId);
        
        // Scroll to bottom where the new row is rendered
        setTimeout(() => {
            window.scrollTo({
                top: document.body.scrollHeight,
                behavior: 'smooth',
            });
        }, 100);
    };

    return (
        <div className='h-full bg-secondary flex flex-col'>
            {/* Header Section */}
            <div className='bg-white px-3 py-4 border-b border-slate-200'>
                <div className='w-full'>
                    <h1 className='text-2xl font-bold text-slate-900'>
                        Manage Users
                    </h1>
                    <p className='mt-2 text-sm text-slate-600 leading-relaxed'>
                        Create, organize, and govern user accounts through a unified access and identity framework.
                    </p>
                </div>
            </div>

            {/* Toolbar Section */}
            <div className='bg-sap-light-gray px-3 py-3 text-primary border-y border-light'>
                <div className='flex items-center justify-between gap-3'>
                    <div className='flex items-center gap-3 flex-wrap'>
                        {/* Create New User Button */}
                        <button
                            onClick={handleAddNewRow}
                            disabled={isLoading}
                            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-md shadow-sm ${
                                isLoading
                                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                    : 'bg-primary-600 text-white hover:bg-primary-700'
                            }`}
                        >
                            {isLoading ? (
                                <div className='h-4 w-4 animate-spin'>
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
                            ) : (
                                <PlusIcon className='h-4 w-4' />
                            )}
                            <span className='text-sm'>
                                {isLoading ? 'Loading...' : 'Create New User'}
                            </span>
                        </button>

                        {/* Search Input - Always Visible */}
                        <div ref={searchRef} className='flex items-center'>
                            <div className='relative w-60'>
                                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                                    <MagnifyingGlassIcon className='h-5 w-5 text-secondary' />
                                </div>
                                <input
                                    type='text'
                                    placeholder='Global Search'
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setAppliedSearchTerm(e.target.value);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            setAppliedSearchTerm(searchTerm);
                                        }
                                    }}
                                    className='search-placeholder block w-full pl-10 pr-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-sm'
                                    style={{ fontSize: '14px' }}
                                />
                                {appliedSearchTerm && (
                                    <button
                                        onClick={() => {
                                            setSearchTerm('');
                                            setAppliedSearchTerm('');
                                        }}
                                        className='absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600'
                                        title='Clear search'
                                    >
                                        <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Filter Button */}
                        {/* Filter Button */}
                        <div ref={filterRef} className='relative'>
                            <button
                                onClick={() =>
                                    filterVisible
                                        ? closeAllDialogs()
                                        : toggleDialog('filter')
                                }
                                className={`group relative flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-medium transition-all duration-300 transform hover:scale-105 ${
                                    filterVisible ||
                                    Object.keys(activeFilters).length > 0
                                        ? 'border-purple-300 bg-purple-50 text-purple-600 shadow-purple-200 shadow-lg'
                                        : 'border-blue-200 bg-white text-gray-600 hover:border-purple-200 hover:bg-purple-50 hover:text-purple-600 hover:shadow-lg'
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
                            </button>

                            {/* Filter Dropdown */}
                            {filterVisible && (
                                <div className='absolute top-full mt-2 left-0 bg-card text-primary shadow-xl border border-blue-200 rounded-lg z-50 min-w-80'>
                                    <div className='flex items-center justify-between px-3 py-1.5 border-b border-blue-200'>
                                        <div className='text-xs font-semibold'>
                                            Filters
                                        </div>
                                        <div className='flex items-center gap-2'>
                                            <button
                                                onClick={handleClearFilters}
                                                className='text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 transition-colors'
                                            >
                                                Clear All
                                            </button>
                                            <button
                                                onClick={handleApplyFilters}
                                                className='text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 transition-colors'
                                            >
                                                Apply
                                            </button>
                                        </div>
                                    </div>
                                    <div className='p-2'>
                                        <div className='space-y-2'>
                                            {/* First Name Filter */}
                                            <div>
                                                <label className='block text-xs font-medium text-gray-700 mb-1'>
                                                    First Name
                                                </label>
                                                <div className='relative'>
                                                    <input
                                                        type='text'
                                                        value={filterForm.firstName}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            setFilterForm({
                                                                ...filterForm,
                                                                firstName: value,
                                                            });
                                                            
                                                            // Reset cleared flag when user starts typing again
                                                            filterClearedRef.current = false;
                                                            
                                                            // Filter first names
                                                            const filtered = dropdownOptions.firstNames.filter(firstName =>
                                                                firstName.name.toLowerCase().includes(value.toLowerCase())
                                                            );
                                                            setFilteredFirstNames(filtered);
                                                            setShowFirstNameSuggestions(value.length > 0 && filtered.length > 0);
                                                            setSelectedFirstNameIndex(-1);
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'ArrowDown') {
                                                                e.preventDefault();
                                                                setSelectedFirstNameIndex(prev => 
                                                                    prev < filteredFirstNames.length - 1 ? prev + 1 : prev
                                                                );
                                                            } else if (e.key === 'ArrowUp') {
                                                                e.preventDefault();
                                                                setSelectedFirstNameIndex(prev => prev > 0 ? prev - 1 : -1);
                                                            } else if (e.key === 'Enter' && selectedFirstNameIndex >= 0) {
                                                                e.preventDefault();
                                                                const selected = filteredFirstNames[selectedFirstNameIndex];
                                                                setFilterForm({
                                                                    ...filterForm,
                                                                    firstName: selected.name,
                                                                });
                                                                setShowFirstNameSuggestions(false);
                                                                setSelectedFirstNameIndex(-1);
                                                            } else if (e.key === 'Escape') {
                                                                setShowFirstNameSuggestions(false);
                                                                setSelectedFirstNameIndex(-1);
                                                            }
                                                        }}
                                                        onBlur={() => {
                                                            setTimeout(() => setShowFirstNameSuggestions(false), 150);
                                                        }}
                                                        onFocus={() => {
                                                            if (filterForm.firstName && filteredFirstNames.length > 0) {
                                                                setShowFirstNameSuggestions(true);
                                                            }
                                                        }}
                                                        className='w-full pl-2 pr-8 py-1 text-sm border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded bg-white'
                                                    />
                                                    {showFirstNameSuggestions && (
                                                        <div className='filter-suggestions-dropdown absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto'>
                                                            {filteredFirstNames.map((firstName, index) => (
                                                                <div
                                                                    key={firstName.id}
                                                                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${
                                                                        index === selectedFirstNameIndex ? 'bg-blue-100' : ''
                                                                    }`}
                                                                    onMouseDown={(e) => {
                                                                        e.preventDefault();
                                                                        setFilterForm({
                                                                            ...filterForm,
                                                                            firstName: firstName.name,
                                                                        });
                                                                        setShowFirstNameSuggestions(false);
                                                                        setSelectedFirstNameIndex(-1);
                                                                    }}
                                                                >
                                                                    {firstName.name}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Last Name Filter */}
                                            <div>
                                                <label className='block text-xs font-medium text-gray-700 mb-1'>
                                                    Last Name
                                                </label>
                                                <div className='relative'>
                                                    <input
                                                        type='text'
                                                        value={filterForm.lastName}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            setFilterForm({
                                                                ...filterForm,
                                                                lastName: value,
                                                            });
                                                            
                                                            // Reset cleared flag when user starts typing again
                                                            filterClearedRef.current = false;
                                                            
                                                            // Filter last names
                                                            const filtered = dropdownOptions.lastNames.filter(lastName =>
                                                                lastName.name.toLowerCase().includes(value.toLowerCase())
                                                            );
                                                            setFilteredLastNames(filtered);
                                                            setShowLastNameSuggestions(value.length > 0 && filtered.length > 0);
                                                            setSelectedLastNameIndex(-1);
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'ArrowDown') {
                                                                e.preventDefault();
                                                                setSelectedLastNameIndex(prev => 
                                                                    prev < filteredLastNames.length - 1 ? prev + 1 : prev
                                                                );
                                                            } else if (e.key === 'ArrowUp') {
                                                                e.preventDefault();
                                                                setSelectedLastNameIndex(prev => prev > 0 ? prev - 1 : -1);
                                                            } else if (e.key === 'Enter' && selectedLastNameIndex >= 0) {
                                                                e.preventDefault();
                                                                const selected = filteredLastNames[selectedLastNameIndex];
                                                                setFilterForm({
                                                                    ...filterForm,
                                                                    lastName: selected.name,
                                                                });
                                                                setShowLastNameSuggestions(false);
                                                                setSelectedLastNameIndex(-1);
                                                            } else if (e.key === 'Escape') {
                                                                setShowLastNameSuggestions(false);
                                                                setSelectedLastNameIndex(-1);
                                                            }
                                                        }}
                                                        onBlur={() => {
                                                            setTimeout(() => setShowLastNameSuggestions(false), 150);
                                                        }}
                                                        onFocus={() => {
                                                            if (filterForm.lastName && filteredLastNames.length > 0) {
                                                                setShowLastNameSuggestions(true);
                                                            }
                                                        }}
                                                        className='w-full pl-2 pr-8 py-1 text-sm border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded bg-white'
                                                    />
                                                    {showLastNameSuggestions && (
                                                        <div className='filter-suggestions-dropdown absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto'>
                                                            {filteredLastNames.map((lastName, index) => (
                                                                <div
                                                                    key={lastName.id}
                                                                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${
                                                                        index === selectedLastNameIndex ? 'bg-blue-100' : ''
                                                                    }`}
                                                                    onMouseDown={(e) => {
                                                                        e.preventDefault();
                                                                        setFilterForm({
                                                                            ...filterForm,
                                                                            lastName: lastName.name,
                                                                        });
                                                                        setShowLastNameSuggestions(false);
                                                                        setSelectedLastNameIndex(-1);
                                                                    }}
                                                                >
                                                                    {lastName.name}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Email Address Filter */}
                                            <div>
                                                <label className='block text-xs font-medium text-gray-700 mb-1'>
                                                    Email Address
                                                </label>
                                                <div className='relative'>
                                                    <input
                                                        type='text'
                                                        value={filterForm.emailAddress}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            setFilterForm({
                                                                ...filterForm,
                                                                emailAddress: value,
                                                            });
                                                            
                                                            // Reset cleared flag when user starts typing again
                                                            filterClearedRef.current = false;
                                                            
                                                            // Filter emails
                                                            const filtered = dropdownOptions.emails.filter(email =>
                                                                email.name.toLowerCase().includes(value.toLowerCase())
                                                            );
                                                            setFilteredEmails(filtered);
                                                            setShowEmailSuggestions(value.length > 0 && filtered.length > 0);
                                                            setSelectedEmailIndex(-1);
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'ArrowDown') {
                                                                e.preventDefault();
                                                                setSelectedEmailIndex(prev => 
                                                                    prev < filteredEmails.length - 1 ? prev + 1 : prev
                                                                );
                                                            } else if (e.key === 'ArrowUp') {
                                                                e.preventDefault();
                                                                setSelectedEmailIndex(prev => prev > 0 ? prev - 1 : -1);
                                                            } else if (e.key === 'Enter' && selectedEmailIndex >= 0) {
                                                                e.preventDefault();
                                                                const selected = filteredEmails[selectedEmailIndex];
                                                                setFilterForm({
                                                                    ...filterForm,
                                                                    emailAddress: selected.name,
                                                                });
                                                                setShowEmailSuggestions(false);
                                                                setSelectedEmailIndex(-1);
                                                            } else if (e.key === 'Escape') {
                                                                setShowEmailSuggestions(false);
                                                                setSelectedEmailIndex(-1);
                                                            }
                                                        }}
                                                        onBlur={() => {
                                                            setTimeout(() => setShowEmailSuggestions(false), 150);
                                                        }}
                                                        onFocus={() => {
                                                            if (filterForm.emailAddress && filteredEmails.length > 0) {
                                                                setShowEmailSuggestions(true);
                                                            }
                                                        }}
                                                        className='w-full pl-2 pr-8 py-1 text-sm border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded bg-white'
                                                    />
                                                    {showEmailSuggestions && (
                                                        <div className='filter-suggestions-dropdown absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto'>
                                                            {filteredEmails.map((email, index) => (
                                                                <div
                                                                    key={email.id}
                                                                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${
                                                                        index === selectedEmailIndex ? 'bg-blue-100' : ''
                                                                    }`}
                                                                    onMouseDown={(e) => {
                                                                        e.preventDefault();
                                                                        setFilterForm({
                                                                            ...filterForm,
                                                                            emailAddress: email.name,
                                                                        });
                                                                        setShowEmailSuggestions(false);
                                                                        setSelectedEmailIndex(-1);
                                                                    }}
                                                                >
                                                                    {email.name}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Status Filter */}
                                            <div>
                                                <label className='block text-xs font-medium text-gray-700 mb-1'>
                                                    Status
                                                </label>
                                                <div className='relative'>
                                                    <select
                                                        value={filterForm.status}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            setFilterForm({
                                                                ...filterForm,
                                                                status: value,
                                                            });
                                                            
                                                            // Reset cleared flag when user selects a status
                                                            filterClearedRef.current = false;
                                                        }}
                                                        className='w-full pl-2 pr-8 py-1 text-sm border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded bg-white'
                                                    >
                                                        <option value=''>All Statuses</option>
                                                        <option value='ACTIVE'>Active</option>
                                                        <option value='INACTIVE'>Inactive</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sort Button */}
                        <div ref={sortRef} className='relative'>
                            <button
                                className={`group relative flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-medium transition-all duration-300 transform hover:scale-105 ${
                                    sortOpen || (sortColumn && sortDirection && (sortDirection === 'asc' || sortDirection === 'desc'))
                                        ? 'border-green-300 bg-green-50 text-green-600 shadow-green-200 shadow-lg'
                                        : 'border-blue-200 bg-white text-gray-600 hover:border-green-200 hover:bg-green-50 hover:text-green-600 hover:shadow-lg'
                                }`}
                                title='Sort'
                                onClick={() =>
                                    sortOpen
                                        ? closeAllDialogs()
                                        : toggleDialog('sort')
                                }
                            >
                                <ArrowsUpDownIcon className={`h-4 w-4 transition-transform duration-300 ${
                                    sortOpen
                                        ? 'rotate-180'
                                        : 'group-hover:rotate-180'
                                }`} />
                                <span className='text-sm'>Sort</span>
                                {sortColumn && sortDirection && (sortDirection === 'asc' || sortDirection === 'desc') && (
                                    <div className='absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-bounce'></div>
                                )}
                                <div className='absolute inset-0 rounded-lg bg-gradient-to-r from-green-400 to-blue-400 opacity-0 group-hover:opacity-10 transition-opacity duration-300 -z-10'></div>
                            </button>
                            {sortOpen && (
                                <div className='absolute left-0 top-full z-50 mt-2 w-[260px] rounded-lg bg-card text-primary shadow-xl border border-blue-200'>
                                    <div className='flex items-center justify-between px-3 py-2 border-b border-blue-200'>
                                        <div className='text-xs font-semibold'>
                                            Sort
                                        </div>
                                        {sortColumn && (
                                            <button
                                                onClick={clearSorting}
                                                className='text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 transition-colors'
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                    <div className='p-3'>
                                        <div className='space-y-3'>
                                            {/* Column Selection */}
                                            <div>
                                                <label className='block text-xs font-medium text-gray-700 mb-1'>
                                                    Column
                                                </label>
                                                <div className='relative'>
                                                    <select
                                                        value={sortColumn}
                                                        onChange={(e) => {
                                                            const newColumn = e.target.value;
                                                            setSortColumn(newColumn);
                                                            // Don't apply sorting here - wait for direction selection
                                                        }}
                                                        className='w-full pl-2 pr-8 py-1.5 text-sm border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded bg-white'
                                                    >
                                                        <option value=''>Select column...</option>
                                                        {sortableCols.map((col) => (
                                                            <option key={col} value={col}>
                                                                {columnLabels[col]}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Direction Selection */}
                                            <div>
                                                <label className='block text-xs font-medium text-gray-700 mb-1'>
                                                    Direction
                                                </label>
                                                <div className='relative'>
                                                    <select
                                                        value={sortDirection}
                                                        onChange={(e) => {
                                                            const newDirection = e.target.value as 'asc' | 'desc' | '';
                                                            setSortDirection(newDirection);
                                                            // Only apply sorting if both column and valid direction are selected
                                                            if (sortColumn && (newDirection === 'asc' || newDirection === 'desc')) {
                                                                applySorting(sortColumn, newDirection);
                                                            }
                                                        }}
                                                        className='w-full pl-2 pr-8 py-1.5 text-sm border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded bg-white'
                                                    >
                                                        <option value=''>Select direction...</option>
                                                        <option value='asc'>Ascending</option>
                                                        <option value='desc'>Descending</option>
                                                    </select>
                                                </div>
                                            </div>


                                            {/* Current Sort Display */}
                                            {sortColumn && sortDirection && (sortDirection === 'asc' || sortDirection === 'desc') && (
                                                <div className='mt-1 p-2 bg-blue-50 rounded border text-xs'>
                                                    <span className='font-medium text-blue-800'>
                                                        {columnLabels[sortColumn]} ({sortDirection === 'asc' ? 'Asc' : 'Desc'})
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Hide Columns Button */}
                        <div ref={hideRef} className='relative'>
                            <button
                                className={`group relative flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-medium transition-all duration-300 transform hover:scale-105 ${
                                    hideOpen || visibleCols.length < allCols.length
                                        ? 'border-red-300 bg-red-50 text-red-600 shadow-red-200 shadow-lg'
                                        : 'border-blue-200 bg-white text-gray-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600 hover:shadow-lg'
                                }`}
                                onClick={() =>
                                    hideOpen
                                        ? closeAllDialogs()
                                        : toggleDialog('hide')
                                }
                            >
                                <EyeSlashIcon className='h-4 w-4 transition-transform duration-300 group-hover:scale-110' />
                                <span className='text-sm'>Show/Hide</span>
                                {visibleCols.length < allCols.length && (
                                    <div className='absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-bounce'></div>
                                )}
                            </button>
                            {hideOpen && (
                                <div className='absolute left-0 top-full z-50 mt-2 w-[280px] rounded-lg bg-card text-primary shadow-xl border border-blue-200'>
                                    <div className='flex items-center justify-between px-3 py-2 border-b border-blue-200'>
                                        <div className='text-xs font-semibold'>
                                            Displayed Columns
                                        </div>
                                    </div>
                                    <div className='p-3'>
                                        <div className='space-y-3'>
                                            <div>
                                                <div className='relative'>
                                                    <input
                                                        value={hideQuery}
                                                        onChange={(e) =>
                                                            setHideQuery(e.target.value)
                                                        }
                                                        className='w-full pl-2 pr-8 py-1.5 text-sm border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded bg-white'
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Columns List */}
                                        <div className='max-h-40 overflow-auto divide-y divide-light'>
                                            {allCols
                                                .filter((c) =>
                                                    c
                                                        .toLowerCase()
                                                        .includes(
                                                            hideQuery.toLowerCase(),
                                                        ),
                                                )
                                                .map((c) => (
                                                    <label
                                                        key={c}
                                                        className='flex items-center justify-between py-1.5'
                                                    >
                                                        <span className='text-sm capitalize'>
                                                            {c ===
                                                            'firstName'
                                                                ? 'First Name'
                                                                : c === 'lastName'
                                                                ? 'Last Name'
                                                                : c === 'emailAddress'
                                                                ? 'Email Address'
                                                                : c === 'startDate'
                                                                ? 'Start Date'
                                                                : c === 'endDate'
                                                                ? 'End Date'
                                                                : c}
                                                        </span>
                                                        <input
                                                            type='checkbox'
                                                            checked={visibleCols.includes(
                                                                c as ColumnType,
                                                            )}
                                                            onChange={(e) => {
                                                                const checked =
                                                                    e.target
                                                                        .checked;
                                                                setVisibleCols(
                                                                    (prev) => {
                                                                        if (
                                                                            checked
                                                                        )
                                                                            return Array.from(
                                                                                new Set(
                                                                                    [
                                                                                        ...prev,
                                                                                        c as ColumnType,
                                                                                    ],
                                                                                ),
                                                                            );
                                                                        return prev.filter(
                                                                            (
                                                                                x,
                                                                            ) =>
                                                                                x !==
                                                                                c,
                                                                        );
                                                                    },
                                                                );
                                                            }}
                                                        />
                                                    </label>
                                                ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Group By Button */}
                        <div
                            ref={groupRef}
                            className='relative flex items-center'
                        >
                            <button
                                className={`group relative flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-medium transition-all duration-300 transform hover:scale-105 ${
                                    groupOpen || ActiveGroupLabel !== 'None'
                                        ? 'border-orange-300 bg-orange-50 text-orange-600 shadow-orange-200 shadow-lg'
                                        : 'border-blue-200 bg-white text-gray-600 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 hover:shadow-lg'
                                }`}
                                onClick={() =>
                                    groupOpen
                                        ? closeAllDialogs()
                                        : toggleDialog('group')
                                }
                            >
                                <RectangleStackIcon className='h-4 w-4 transition-transform duration-300 group-hover:scale-110' />
                                <span className='text-sm'>Group by</span>
                                {ActiveGroupLabel !== 'None' && (
                                    <div className='absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-bounce'></div>
                                )}
                            </button>
                            {groupOpen && (
                                <div className='absolute left-0 top-full z-50 mt-2 w-[260px] rounded-lg bg-card text-primary shadow-xl border border-blue-200'>
                                    <div className='flex items-center justify-between px-3 py-2 border-b border-blue-200'>
                                        <div className='text-xs font-semibold'>
                                            Group by
                                        </div>
                                        {ActiveGroupLabel !== 'None' && (
                                            <button
                                                onClick={clearGroupBy}
                                                className='text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 transition-colors'
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                    <div className='p-3'>
                                        <div className='space-y-3'>
                                            <div>
                                                <label className='block text-xs font-medium text-gray-700 mb-1'>
                                                    Column
                                                </label>
                                                <div className='relative'>
                                                    <select
                                                        value={ActiveGroupLabel === 'None' ? '' : ActiveGroupLabel}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            setGroupByFromLabel(value || 'None');
                                                        }}
                                                        className='w-full pl-2 pr-8 py-1.5 text-sm border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded bg-white'
                                                    >
                                                        <option value=''>Select column...</option>
                                                        <option value='First Name'>First Name</option>
                                                        <option value='Last Name'>Last Name</option>
                                                        <option value='Email Address'>Email Address</option>
                                                        <option value='Status'>Status</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Current Group Display */}
                                            {ActiveGroupLabel !== 'None' && (
                                                <div className='mt-1 p-2 bg-orange-50 rounded border text-xs'>
                                                    <span className='font-medium text-orange-800'>
                                                        Grouped by: {ActiveGroupLabel}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Save Button */}
                        <button
                            onClick={handleSaveAll}
                            disabled={isLoading || isAutoSaving}
                            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-md shadow-sm transition-all duration-300 relative overflow-hidden ${
                                isLoading || isAutoSaving
                                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                    : showAutoSaveSuccess
                                    ? 'bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 text-white shadow-lg animate-pulse'
                                    : autoSaveCountdown
                                    ? 'bg-gradient-to-r from-blue-300 to-blue-500 text-white shadow-md'
                                    : 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-md'
                            }`}
                            title={isAutoSaving ? "Auto-saving..." : autoSaveCountdown ? `Auto-saving in ${autoSaveCountdown}s` : "Save all unsaved entries"}
                        >
                            {/* Progress bar animation for auto-save countdown */}
                            {autoSaveCountdown && (
                                <div className="absolute inset-0 bg-blue-200/30 rounded-md overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-1000 ease-linear"
                                        style={{
                                            width: autoSaveCountdown ? `${((10 - autoSaveCountdown) / 10) * 100}%` : '0%'
                                        }}
                                    ></div>
                                </div>
                            )}
                            
                            {/* Auto-save success wave animation */}
                            {showAutoSaveSuccess && (
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-ping"></div>
                            )}
                            
                            {isAutoSaving ? (
                                <div className='h-4 w-4 animate-spin'>
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
                            ) : (
                                <BookmarkIcon className='h-4 w-4 relative z-10' />
                            )}
                            <span className='text-sm relative z-10'>
                                {isAutoSaving ? 'Auto-saving...' : autoSaveCountdown ? `Save (${autoSaveCountdown}s)` : 'Save'}
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className='flex-1 p-3 overflow-hidden'>
                <div className='h-full space-y-3'>
                    {/* Account Details Table - Copied from Manage Accounts */}
                    <div className='bg-card border border-light rounded-lg p-3 h-full flex flex-col'>
                        {/* <div className='mb-4'>
                            <h2 className='text-lg font-semibold text-primary'>
                                Enterprise Account Details
                            </h2>
                            <p className='text-sm text-secondary mt-1'>
                                Complete account information with all features
                                from the Manage Accounts screen.
                            </p>
                        </div> */}

                        {isLoading ? (
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
                                        Loading Manage Users configurations
                                    </h3>
                                    <p className='mt-2 text-sm text-slate-500'>
                                        Please wait while we fetch your
                                        user management data...
                                    </p>
                                </div>
                            </div>
                        ) : accounts.length === 0 ? (
                            // Empty State
                            <div className='bg-white rounded-lg border border-slate-200 p-12 text-center'>
                                <div className='mx-auto max-w-md'>
                                    <svg
                                        className='mx-auto h-12 w-12 text-slate-400'
                                        fill='none'
                                        viewBox='0 0 24 24'
                                        stroke='currentColor'
                                        aria-hidden='true'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h6m-6 4h6m-6 4h6m-6 4h6'
                                        />
                                    </svg>
                                    <h3 className='mt-4 text-lg font-semibold text-slate-900'>
                                        No Users Configured
                                    </h3>
                                    <p className='mt-2 text-sm text-slate-500'>
                                        No users have been created yet. Create a new user to get started.
                                    </p>
                                    <div className='mt-6'>
                                        <button
                                            onClick={() => {
                                                // Clear any pending autosave to prevent blank rows from being saved
                                                if (autoSaveTimerRef.current) {
                                                    clearTimeout(autoSaveTimerRef.current);
                                                    autoSaveTimerRef.current = null;
                                                }
                                                if (countdownIntervalRef.current) {
                                                    clearInterval(countdownIntervalRef.current);
                                                    countdownIntervalRef.current = null;
                                                }
                                                setAutoSaveCountdown(null);
                                                setIsAutoSaving(false);
                                                
                                                // Trigger the "New Enterprise" action
                                                const newId = `tmp-${Date.now()}`;
                                                const blank = {
                                                    id: newId,
                                                    enterprise: '',
                                                    product: '',
                                                    services: '',
                                                } as any;
                                                setAccounts([blank]);
                                            }}
                                            className='inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
                                        >
                                            <PlusIcon className='-ml-1 mr-2 h-5 w-5' />
                                            Create New User
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : visibleCols.length === 0 ? (
                            // Empty State for Hidden Columns
                            <div className='bg-white rounded-lg border border-slate-200 p-12 text-center'>
                                <div className='mx-auto max-w-md'>
                                    <svg
                                        className='mx-auto h-12 w-12 text-slate-400'
                                        fill='none'
                                        viewBox='0 0 24 24'
                                        stroke='currentColor'
                                        aria-hidden='true'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21'
                                        />
                                    </svg>
                                    <h3 className='mt-4 text-lg font-semibold text-slate-900'>
                                        All Columns Hidden
                                    </h3>
                                    <p className='mt-2 text-sm text-slate-500'>
                                        All table columns are currently hidden. Click the button below to show all columns.
                                    </p>
                                    <div className='mt-6'>
                                        <button
                                            onClick={showAllColumns}
                                            className='inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
                                        >
                                            <EyeIcon className='-ml-1 mr-2 h-5 w-5' />
                                            Show All Columns
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className='flex-1 overflow-auto'>
                                <ManageUsersTable
                                    ref={accountsTableRef}
                                    isAIInsightsPanelOpen={!isAIPanelCollapsed}
                                    rows={processedConfigs.map<AccountRow>(
                                        (a: any) => ({
                                            id: a.id || '',
                                            firstName: a.firstName || '',
                                            middleName: a.middleName || '',
                                            lastName: a.lastName || '',
                                            emailAddress: a.emailAddress || '',
                                            status: a.status || 'ACTIVE',
                                            startDate: a.startDate || '',
                                            endDate: a.endDate || '',
                                            password: a.password || '',
                                            technicalUser: a.technicalUser || false,
                                            assignedUserGroups: a.assignedUserGroups || [],
                                        }),
                                    )}
                                    onEdit={(id) => {
                                        const cfg = accounts.find(
                                            (x) => x.id === id,
                                        );
                                        if (cfg) {
                                            setEditingConfig(cfg);
                                            setShowCreateForm(true);
                                        }
                                    }}
                                    onDelete={(id) => {
                                        startRowCompressionAnimation(id);
                                    }}
                                    visibleColumns={visibleCols}
                                    highlightQuery={searchTerm}
                                    groupByExternal={groupByProp as 'none' | 'firstName' | 'lastName' | 'emailAddress' | 'status'}
                                    onAddNewRow={handleAddNewRow}
                                    hideRowExpansion={false}
                                    customColumnLabels={{
                                        technicalUser: 'Technical User',
                                    }}
                                    enableDropdownChips={true}
                                    dropdownOptions={dropdownOptions}
                                    onShowStartDateProtectionModal={handleShowStartDateProtectionModal}
                                    onUpdateField={async (rowId, field, value) => {
                                        console.log('🔄 onUpdateField called:', {
                                            rowId,
                                            field,
                                            value,
                                            isTemporary: rowId.startsWith('tmp-'),
                                            isLicenseField: field === 'licenses',
                                        });

                                        // Handle license updates differently
                                        if (field === 'licenses') {
                                            console.log('📄 License update detected for row:', rowId, 'New licenses:', value);
                                            
                                            // Update the account with new licenses
                                            setAccounts((prev) => {
                                                const updated = prev.map((account) =>
                                                    account.id === rowId
                                                        ? {
                                                              ...account,
                                                              licenses: value,
                                                              updatedAt: new Date().toISOString()
                                                          }
                                                        : account,
                                                );
                                                return sortConfigsByDisplayOrder(updated);
                                            });

                                            // For existing rows, trigger auto-save timer for license changes
                                            // But only if the licenses contain actual data (not empty licenses)
                                            if (!rowId.startsWith('tmp-')) {
                                                const hasValidLicenseData = Array.isArray(value) && value.some((license: any) => 
                                                    license.name?.trim() || license.type?.trim() || license.status?.trim()
                                                );
                                                
                                                if (hasValidLicenseData) {
                                                    console.log('🔄 Triggering auto-save timer for license change on existing account:', rowId);
                                                    
                                                    // Add to modified records set
                                                    setModifiedExistingRecords(prev => {
                                                        const newSet = new Set(prev);
                                                        newSet.add(rowId);
                                                        return newSet;
                                                    });
                                                    modifiedExistingRecordsRef.current.add(rowId);
                                                    
                                                    // Trigger auto-save timer for visual feedback
                                                    debouncedAutoSave();
                                                } else {
                                                    console.log('❌ Not triggering auto-save for empty license data:', rowId);
                                                }
                                            } else {
                                                // For temporary rows, check if the main row is complete before triggering auto-save
                                                const account = accounts.find((a) => a.id === rowId);
                                                if (account) {
                                                    const hasAccountName = account.accountName?.trim();
                                                    const hasMasterAccount = account.masterAccount?.trim();
                                                    const hasCloudType = account.cloudType?.trim();
                                                    const hasAddress = account.address?.trim();
                                                    
                                                    if (hasAccountName && hasMasterAccount && hasCloudType && hasAddress) {
                                                        console.log('✅ License change on complete temporary account, starting auto-save timer...');
                                                        debouncedAutoSave();
                                                    }
                                                }
                                            }
                                            
                                            // Save to localStorage for immediate persistence
                                            const updatedAccounts = accounts.map(acc => 
                                                acc.id === rowId 
                                                    ? { ...acc, licenses: value, updatedAt: new Date().toISOString() }
                                                    : acc
                                            );
                                            saveAccountsToStorage(updatedAccounts);
                                            console.log(`💾 Saved license changes for account ${rowId} to localStorage`);
                                            return;
                                        }

                                        // Store pending changes separately to preserve user input during data reloads
                                        setPendingLocalChanges(prev => ({
                                            ...prev,
                                            [rowId]: {
                                                ...prev[rowId],
                                                [field]: value
                                            }
                                        }));

                                        // Also update main state for immediate responsiveness
                                        setAccounts((prev) => {
                                            const updated = prev.map((account) =>
                                                account.id === rowId
                                                    ? {
                                                          ...account,
                                                          [field]: value,
                                                          updatedAt: new Date().toISOString()
                                                      }
                                                    : account,
                                            );
                                            // Maintain display order during updates
                                            return sortConfigsByDisplayOrder(updated);
                                        });

                                        // For new rows (temporary IDs), check if we can auto-save
                                        if (rowId.startsWith('tmp-')) {
                                            console.log('🔄 Updating temporary user row:', rowId, field, field === 'password' ? '***' : value);

                                            // Check if all required fields are filled for auto-save
                                            const updatedUser = accounts.find((a) => a.id === rowId);
                                            if (updatedUser) {
                                                // Apply the current update to check completeness
                                                const userWithUpdate = {
                                                    ...updatedUser,
                                                    [field]: value,
                                                };

                                                // Check if we have all required user management fields
                                                const hasFirstName = userWithUpdate.firstName?.trim();
                                                const hasLastName = userWithUpdate.lastName?.trim();
                                                const hasValidEmail = userWithUpdate.emailAddress?.trim() && isValidEmail(userWithUpdate.emailAddress);
                                                const hasStartDate = userWithUpdate.startDate?.trim();
                                                const hasPassword = userWithUpdate.password?.trim();

                                                console.log('🔍 Temporary user auto-save check:', {
                                                    rowId,
                                                    field,
                                                    hasFirstName: !!hasFirstName,
                                                    hasLastName: !!hasLastName,
                                                    hasValidEmail: !!hasValidEmail,
                                                    hasStartDate: !!hasStartDate,
                                                    hasPassword: !!hasPassword,
                                                    isComplete: !!(hasFirstName && hasLastName && hasValidEmail && hasStartDate && hasPassword),
                                                });

                                                // Trigger debounced auto-save if all required fields are filled
                                                if (hasFirstName && hasLastName && hasValidEmail && hasStartDate && hasPassword) {
                                                    console.log('✅ All required user fields filled, starting auto-save timer...');
                                                    
                                                    // Clear validation errors for this row since it's now complete
                                                    if (showValidationErrors) {
                                                        // Remove this row from incomplete rows since it's now complete
                                                        setIncompleteRows(prev => {
                                                            const updated = prev.filter(id => id !== rowId);
                                                            console.log(`✅ Removed temporary row ${rowId} from incomplete highlighting - remaining:`, updated);
                                                            
                                                            // If no more incomplete rows, clear validation errors
                                                            if (updated.length === 0) {
                                                                console.log('🎉 All validation issues resolved - clearing validation errors');
                                                                setShowValidationErrors(false);
                                                                setExternalFieldErrors({});
                                                            }
                                                            
                                                            return updated;
                                                        });
                                                    }
                                                    
                                                    debouncedAutoSave();
                                                } else {
                                                    console.log('ℹ️ Temporary user incomplete - will save to localStorage as draft');
                                                }
                                            }
                                            return;
                                        }

                                        // For existing rows, trigger auto-save timer for visual feedback
                                        if (!rowId.startsWith('tmp-')) {
                                            const account = accounts.find((a) => a.id === rowId);
                                            if (account) {
                                                const updatedAccount = { ...account, [field]: value };
                                                
                                                // Check if all required fields are present and not empty (for user management)
                                                const hasFirstName = updatedAccount.firstName?.trim();
                                                const hasLastName = updatedAccount.lastName?.trim();
                                                const hasValidEmail = updatedAccount.emailAddress?.trim() && isValidEmail(updatedAccount.emailAddress);
                                                const hasStartDate = updatedAccount.startDate?.trim();
                                                const hasPassword = updatedAccount.password?.trim();
                                                
                                                console.log('🔍 Existing user field update:', {
                                                    rowId,
                                                    field,
                                                    value: field === 'password' ? '***' : value,
                                                    hasFirstName: !!hasFirstName,
                                                    hasLastName: !!hasLastName,
                                                    hasValidEmail: !!hasValidEmail,
                                                    hasStartDate: !!hasStartDate,
                                                    hasPassword: !!hasPassword,
                                                    isComplete: !!(hasFirstName && hasLastName && hasValidEmail && hasStartDate && hasPassword),
                                                });
                                                
                                                // Always add to modified set for any field change on existing user
                                                setModifiedExistingRecords(prev => {
                                                    const newSet = new Set(prev);
                                                    newSet.add(rowId);
                                                    return newSet;
                                                });
                                                modifiedExistingRecordsRef.current.add(rowId);
                                                console.log(`➕ Added existing user ${rowId} to modified set (field: ${field})`);
                                                
                                                // Trigger auto-save if all fields are complete
                                                if (hasFirstName && hasLastName && hasValidEmail && hasStartDate && hasPassword) {
                                                    console.log('🔄 Triggering auto-save timer for complete existing user:', rowId);
                                                    
                                                    // Clear validation errors for this row since it's now complete
                                                    if (showValidationErrors) {
                                                        // Remove this row from incomplete rows since it's now complete
                                                        setIncompleteRows(prev => {
                                                            const updated = prev.filter(id => id !== rowId);
                                                            console.log(`✅ Removed row ${rowId} from incomplete highlighting - remaining:`, updated);
                                                            
                                                            // If no more incomplete rows, clear validation errors
                                                            if (updated.length === 0) {
                                                                console.log('🎉 All validation issues resolved - clearing validation errors');
                                                                setShowValidationErrors(false);
                                                                setExternalFieldErrors({});
                                                            }
                                                            
                                                            return updated;
                                                        });
                                                    }
                                                    
                                                    // Trigger auto-save timer for visual feedback
                                                    debouncedAutoSave();
                                                } else {
                                                    console.log('ℹ️ Incomplete existing user - will save to database on manual save:', rowId);
                                                }
                                            }
                                        }

                                        // Save to localStorage only for temporary in-progress changes
                                        // Database records will be saved via API on manual save
                                        if (String(rowId).startsWith('tmp-')) {
                                        const updatedAccounts = accounts.map(acc => 
                                            acc.id === rowId 
                                                ? { ...acc, [field]: value, updatedAt: new Date().toISOString() }
                                                : acc
                                        );
                                        saveAccountsToStorage(updatedAccounts);
                                            console.log(`💾 Saved temporary account ${rowId} field ${field} to localStorage (draft)`);
                                        } else {
                                            console.log(`ℹ️ Skipping localStorage save for non-temporary account ${rowId} - will save to database on manual save`);
                                        }
                                    }}
                                    compressingRowId={compressingRowId}
                                    foldingRowId={foldingRowId}
                                    compressingLicenseId={compressingLicenseId}
                                    foldingLicenseId={foldingLicenseId}
                                    onLicenseValidationChange={handleLicenseValidationChange}
                                    onLicenseDelete={startLicenseCompressionAnimation}
                                    incompleteRowIds={showValidationErrors ? incompleteRows : []}
                                    showValidationErrors={showValidationErrors}
                                    externalFieldErrors={externalFieldErrors}
                                    hasBlankRow={hasBlankRow()}
                                    onOpenUserGroupModal={handleOpenUserGroupModal}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Navigation Warning Modal */}
            {showNavigationWarning && (
                <ConfirmModal
                    open={showNavigationWarning}
                    title="Unsaved Changes"
                    message="You have unsaved changes that will be lost if you leave. Are you sure you want to continue?"
                    confirmText="Leave Anyway"
                    cancelText="Stay Here"
                    onConfirm={() => {
                        console.log('🔄 User confirmed navigation - clearing states and executing navigation');
                        setShowNavigationWarning(false);
                        
                        // Clear all unsaved states IMMEDIATELY
                        setIncompleteRows([]);
                        setHasUnsavedChanges(false);
                        setPreventNavigation(false);
                        setUserConfirmedLeave(true);
                        
                        // Execute navigation immediately after state update
                        if (pendingNavigationUrl) {
                            console.log('🔄 Executing pending navigation to:', pendingNavigationUrl);
                            // Clear the pending URL first
                            const targetUrl = pendingNavigationUrl;
                            setPendingNavigationUrl(null);
                            
                            // Use setTimeout to ensure state updates are processed first
                            setTimeout(() => {
                                if (originalRouterRef.current) {
                                    originalRouterRef.current.push(targetUrl);
                                } else {
                                    // Fallback: router should now allow navigation since userConfirmedLeave is true
                                    router.push(targetUrl);
                                }
                            }, 0);
                        } else if (pendingNavigation) {
                            // Fallback for legacy navigation handling
                            const navFn = pendingNavigation;
                            setPendingNavigation(null);
                            setTimeout(() => {
                                navFn();
                            }, 0);
                        }
                    }}
                    onCancel={() => {
                        setShowNavigationWarning(false);
                        setPendingNavigationUrl(null);
                        setPendingNavigation(null);
                        setPreventNavigation(false);
                    }}
                />
            )}

            {/* Delete Confirmation Modal - match Manage Accounts styling */}
            {showDeleteConfirmation && (
                <div className='fixed inset-0 z-50 overflow-y-auto'>
                    <div className='flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0'>
                        <div
                            className='fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity'
                            onClick={handleDeleteCancel}
                        ></div>

                        <motion.div
                            className='relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6'
                            initial={{opacity: 0, scale: 0.9}}
                            animate={{opacity: 1, scale: 1}}
                            exit={{opacity: 0, scale: 0.9}}
                            transition={{duration: 0.2}}
                        >
                            <div className='sm:flex sm:items-start'>
                                <div className='mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10'>
                                    <svg
                                        className='h-6 w-6 text-red-600'
                                        fill='none'
                                        viewBox='0 0 24 24'
                                        strokeWidth='1.5'
                                        stroke='currentColor'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                                        />
                                    </svg>
                                </div>
                                <div className='mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left'>
                                    <div className='mt-2'>
                                        <p className='text-sm text-gray-900'>
                                            {deleteType === 'account' 
                                                ? 'Are you sure you want to delete this user?'
                                                : 'Are you sure you want to delete this license details?'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className='mt-5 sm:mt-4 sm:flex sm:flex-row-reverse'>
                                <button
                                    type='button'
                                    disabled={deletingRow}
                                    className='inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto'
                                    onClick={handleDeleteConfirm}
                                >
                                    {deletingRow ? (
                                        <>
                                            <svg
                                                className='animate-spin -ml-1 mr-2 h-4 w-4 text-white'
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
                                            {deleteType === 'license' ? 'Deleting License...' : 'Deleting...'}
                                        </>
                                    ) : (
                                        'Yes'
                                    )}
                                </button>
                                <button
                                    type='button'
                                    disabled={deletingRow}
                                    className='mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed sm:mt-0 sm:w-auto'
                                    onClick={handleDeleteCancel}
                                >
                                    No
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </div>
            )}

            {/* Start Date Protection Modal */}
            {showStartDateProtectionModal && (
                <ConfirmModal
                    open={showStartDateProtectionModal}
                    title="Information"
                    message={startDateProtectionMessage}
                    confirmText="OK"
                    cancelText=""
                    loading={false}
                    loadingText=""
                    onConfirm={handleStartDateProtectionClose}
                    onCancel={handleStartDateProtectionClose}
                />
            )}

            {/* Blue-themed Notification Component - Positioned above Save button */}
            {showNotification && (
                <motion.div
                    initial={{opacity: 0, y: -50, scale: 0.9}}
                    animate={{opacity: 1, y: 0, scale: 1}}
                    exit={{opacity: 0, y: -50, scale: 0.9}}
                    transition={{duration: 0.3, ease: 'easeOut'}}
                    className={`fixed z-50 max-w-sm notification-above-save ${isAIPanelCollapsed ? 'ai-panel-collapsed' : ''}`}
                    style={{
                        // Position well above the toolbar with significant spacing
                        // Header height (~80px) + more gap above toolbar (40px)
                        top: '40px'
                        // Right positioning handled by CSS classes for consistency
                    }}
                >
                    <div className='bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500 rounded-lg shadow-lg relative'>
                        {/* Small arrow pointing down to indicate relation to Save button - positioned more to the right */}
                        <div className='absolute -bottom-2 right-12 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-blue-100'></div>
                        <div className='p-4'>
                            <div className='flex items-start'>
                                <div className='flex-shrink-0'>
                                    <svg
                                        className='h-5 w-5 text-blue-600'
                                        fill='currentColor'
                                        viewBox='0 0 20 20'
                                    >
                                        <path
                                            fillRule='evenodd'
                                            d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                                            clipRule='evenodd'
                                        />
                                    </svg>
                                </div>
                                <div className='ml-3 flex-1'>
                                    <p className='text-sm font-medium text-blue-800'>
                                        {notificationMessage}
                                    </p>
                                </div>
                                <div className='ml-4 flex-shrink-0 flex'>
                                    <button
                                        className='inline-flex text-blue-400 hover:text-blue-600 focus:outline-none focus:text-blue-600 transition-colors duration-200'
                                        onClick={() =>
                                            setShowNotification(false)
                                        }
                                    >
                                        <svg
                                            className='h-5 w-5'
                                            fill='currentColor'
                                            viewBox='0 0 20 20'
                                        >
                                            <path
                                                fillRule='evenodd'
                                                d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
                                                clipRule='evenodd'
                                            />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                        {/* Animated progress bar */}
                        <div className='bg-blue-200 h-1'>
                            <motion.div
                                initial={{width: '100%'}}
                                animate={{width: '0%'}}
                                transition={{duration: 3, ease: 'linear'}}
                                className='bg-blue-500 h-full'
                            />
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Validation Modal */}
            {showValidationModal && (
                <div className='fixed inset-0 z-50 overflow-y-auto'>
                    <div className='flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0'>
                        <div
                            className='fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity'
                            onClick={() => {
                                setShowValidationModal(false);
                                setShowValidationErrors(true);
                            }}
                        ></div>

                        <div className='relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6'>
                            <div className='sm:flex sm:items-start'>
                                <div className='mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10'>
                                    <svg
                                        className='h-6 w-6 text-yellow-600'
                                        fill='none'
                                        viewBox='0 0 24 24'
                                        stroke='currentColor'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z'
                                        />
                                    </svg>
                                </div>
                                <div className='mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left'>
                                    <h3 className='text-lg font-medium leading-6 text-gray-900'>
                                        Fill Required Fields
                                    </h3>
                                    <div className='mt-2'>
                                        <p className='text-sm text-gray-500 whitespace-pre-line'>
                                            {validationMessage}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className='mt-5 sm:mt-4 sm:flex sm:flex-row-reverse'>
                                <button
                                    type='button'
                                    onClick={() => {
                                        setShowValidationModal(false);
                                        setShowValidationErrors(true);
                                        // The incompleteRows state already contains the IDs of rows that failed validation
                                        console.log('✅ Validation modal dismissed - enabling row highlighting for incomplete rows:', incompleteRows);
                                    }}
                                    className='mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto'
                                >
                                    OK
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Assigned User Group Modal */}
            {showUserGroupModal && selectedUserForGroups && (
                <AssignedUserGroupModal
                    stackLevel={0}
                    isOpen={showUserGroupModal}
                    onClose={handleCloseUserGroupModal}
                    onSave={handleSaveUserGroups}
                    onRolesUpdated={handleRolesUpdated}
                    firstName={selectedUserForGroups.firstName || ''}
                    lastName={selectedUserForGroups.lastName || ''}
                    emailAddress={selectedUserForGroups.emailAddress || ''}
                    userId={selectedUserForGroups.id}
                    initialUserGroups={(() => {
                        // assignedUserGroups can be an array of strings OR UserGroup objects
                        const groups = selectedUserForGroups.assignedUserGroups || [];
                        console.log('🎯 Mapping initialUserGroups from:', groups);
                        
                        const mapped = groups.map((item: any) => {
                            // If it's already a UserGroup object with all properties, use it
                            if (typeof item === 'object' && item !== null && 'id' in item) {
                                console.log('✅ Found existing UserGroup object:', item);
                                // Backend might return 'name' instead of 'groupName', so normalize it
                                // Since this is loaded from database, mark as isFromDatabase: true
                                return {
                                    id: item.id || generateId(),
                                    groupId: item.groupId || item.id,
                                    groupName: item.groupName || item.name || '',
                                    description: item.description || '',
                                    entity: item.entity || '',
                                    product: item.product || '',
                                    service: item.service || '',
                                    roles: item.roles || '',
                                    assignedRoles: Array.isArray(item.assignedRoles) ? item.assignedRoles : [],
                                    isFromDatabase: true // Always true for groups loaded from saved user
                                } as UserGroup;
                            }
                            
                            // If it's an object without id, add one
                            if (typeof item === 'object' && item !== null) {
                                console.log('⚙️ Adding id to UserGroup object:', item);
                                const normalizedId = item.id || generateId();
                                return {
                                    id: normalizedId,
                                    groupId: item.groupId || normalizedId,
                                    groupName: item.groupName || item.name || '',
                                    description: item.description || '',
                                    entity: item.entity || '',
                                    product: item.product || '',
                                    service: item.service || '',
                                    roles: item.roles || '',
                                    assignedRoles: Array.isArray(item.assignedRoles) ? item.assignedRoles : []
                                } as UserGroup;
                            }
                            
                            // If it's a string (legacy format), convert to UserGroup
                            console.log('🔄 Converting string to UserGroup:', item);
                            return {
                                id: generateId(),
                                groupId: undefined,
                                groupName: typeof item === 'string' ? item : '',
                                description: '',
                                entity: '',
                                product: '',
                                service: '',
                                roles: '',
                                assignedRoles: []
                            } as UserGroup;
                        });
                        
                        console.log('🎯 Mapped initialUserGroups:', mapped);
                        return mapped;
                    })()}
                    
                    selectedEnterprise={selectedEnterprise}
                    selectedEnterpriseId={selectedEnterpriseId}
                    selectedAccountId={selectedAccountId}
                    selectedAccountName={selectedAccountName}
                />
            )}
        </div>
    );
}
