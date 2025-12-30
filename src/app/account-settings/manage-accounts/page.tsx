'use client';

import {useRouter} from 'next/navigation';

// Extend window interface for license deletion completion
declare global {
    interface Window {
        completeLicenseDeletion?: () => void;
    }
}

import React, {useState, useEffect, useRef, useCallback} from 'react';
import {motion} from 'framer-motion';
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
import AccountsTable, {AccountRow} from '@/components/AccountsTable';
import AddressModal from '@/components/AddressModal';
import TechnicalUserModal, {
    TechnicalUser,
} from '@/components/TechnicalUserModal';
import {api, fetchExternalAccounts, onboardAccount} from '@/utils/api';

// Helper function to safely trim strings - handles null, undefined, numbers, objects
const safeTrim = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number') return String(value);
    return String(value).trim();
};

// Helper to check if a value is non-empty after trimming
const hasValue = (value: any): boolean => {
    return safeTrim(value).length > 0;
};

export default function ManageAccounts() {
    // Component mounting debug (temporarily disabled)
    // console.log('🏗️ ManageAccounts component mounting...');

    // Router for navigation interception
    const router = useRouter();

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
            const orderA =
                displayOrderRef.current.get(a.id) ?? Number.MAX_SAFE_INTEGER;
            const orderB =
                displayOrderRef.current.get(b.id) ?? Number.MAX_SAFE_INTEGER;

            // If both have the same order (especially MAX_SAFE_INTEGER), use ID for stable sort
            if (orderA === orderB) {
                return a.id.localeCompare(b.id);
            }

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

    // Notification state
    const [notificationMessage, setNotificationMessage] = useState<string>('');
    const [showNotification, setShowNotification] = useState(false);

    // Delete confirmation modal state
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [showValidationModal, setShowValidationModal] = useState(false);
    const [showValidationErrors, setShowValidationErrors] = useState(false);
    const [validationMessage, setValidationMessage] = useState('');
    const [pendingDeleteRowId, setPendingDeleteRowId] = useState<string | null>(
        null,
    );
    const [pendingDeleteLicenseId, setPendingDeleteLicenseId] = useState<
        string | null
    >(null);
    const [deleteType, setDeleteType] = useState<'account' | 'license'>(
        'account',
    );
    const [deletingRow, setDeletingRow] = useState(false);

    // Auto-save related state - use useRef to persist through re-renders
    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const accountsRef = useRef<any[]>([]);
    const modifiedExistingRecordsRef = useRef<Set<string>>(new Set());
    const [isAutoSaving, setIsAutoSaving] = useState(false);
    const [showAutoSaveSuccess, setShowAutoSaveSuccess] = useState(false);
    const [autoSaveCountdown, setAutoSaveCountdown] = useState<number | null>(
        null,
    );
    const [tableRefreshKey, setTableRefreshKey] = useState(0);
    const [modifiedExistingRecords, setModifiedExistingRecords] = useState<
        Set<string>
    >(new Set());

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

    // State to track user's pending local changes that haven't been saved yet
    const [pendingLocalChanges, setPendingLocalChanges] = useState<
        Record<string, any>
    >({});

    // Enhanced unsaved changes detection
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [preventNavigation, setPreventNavigation] = useState(false);
    const [pendingNavigationUrl, setPendingNavigationUrl] = useState<
        string | null
    >(null);
    const [userConfirmedLeave, setUserConfirmedLeave] = useState(false);

    // State to track AI panel collapse state for notification positioning
    const [isAIPanelCollapsed, setIsAIPanelCollapsed] = useState(false);

    // Row animation states
    const [compressingRowId, setCompressingRowId] = useState<string | null>(
        null,
    );
    const [foldingRowId, setFoldingRowId] = useState<string | null>(null);

    // License animation states
    const [compressingLicenseId, setCompressingLicenseId] = useState<
        string | null
    >(null);
    const [foldingLicenseId, setFoldingLicenseId] = useState<string | null>(
        null,
    );

    // Address modal state
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [selectedAccountForAddress, setSelectedAccountForAddress] = useState<{
        id: string;
        accountName: string;
        masterAccount: string;
        address: string;
        addressData?: any;
    } | null>(null);

    // Technical User modal state
    const [isTechnicalUserModalOpen, setIsTechnicalUserModalOpen] =
        useState(false);
    const [
        selectedAccountForTechnicalUser,
        setSelectedAccountForTechnicalUser,
    ] = useState<{
        id: string;
        accountName: string;
        masterAccount: string;
        technicalUsers: TechnicalUser[];
    } | null>(null);

    // Dropdown options for chips
    const [dropdownOptions, setDropdownOptions] = useState({
        enterprises: [] as Array<{id: string; name: string}>,
        products: [] as Array<{id: string; name: string}>,
        services: [] as Array<{id: string; name: string}>,
        accountNames: [] as Array<{id: string; name: string}>,
        masterAccounts: [] as Array<{id: string; name: string}>,
        cloudTypes: [
            {id: 'private-cloud', name: 'Private Cloud'},
            {id: 'public-cloud', name: 'Public Cloud'},
        ] as Array<{id: string; name: string}>,
        addresses: [] as Array<{id: string; name: string}>,
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
        'None' | 'Account' | 'Master Account' | 'Cloud Type'
    >('None');
    const [visibleCols, setVisibleCols] = useState<ColumnType[]>([
        'accountName',
        'masterAccount',
        'cloudType',
        'address',
        'technicalUser',
    ]);

    // License validation state
    const [hasIncompleteLicenses, setHasIncompleteLicenses] = useState(false);
    const [incompleteLicenseRows, setIncompleteLicenseRows] = useState<
        string[]
    >([]);

    // Refs for dropdowns
    const searchRef = useRef<HTMLDivElement>(null);
    const filterRef = useRef<HTMLDivElement>(null);
    const sortRef = useRef<HTMLDivElement>(null);
    const hideRef = useRef<HTMLDivElement>(null);
    const groupRef = useRef<HTMLDivElement>(null);

    // Helper function to show notifications
    const showBlueNotification = (
        message: string,
        duration: number = 3000,
        showCheckmark: boolean = true,
    ) => {
        console.log(
            '📢 Showing notification:',
            message,
            'AI Panel Collapsed:',
            isAIPanelCollapsed,
        );
        setNotificationMessage(showCheckmark ? `✅ ${message}` : message);
        setShowNotification(true);
        setTimeout(() => {
            setShowNotification(false);
        }, duration);
    };

    // Load dropdown options from API
    const loadDropdownOptions = async () => {
        try {
            const [enterprisesRes, productsRes, servicesRes] =
                await Promise.all([
                    api.get<Array<{id: string; name: string}>>(
                        '/api/enterprises',
                    ),
                    api.get<Array<{id: string; name: string}>>('/api/products'),
                    api.get<Array<{id: string; name: string}>>('/api/services'),
                ]);

            // Extract unique account names from existing accounts
            const uniqueAccountNames = Array.from(
                new Set(
                    accounts
                        .map((account) => account.accountName)
                        .filter(Boolean),
                ),
            ).map((name, index) => ({
                id: `account-${name}-${index}`,
                name: name,
            }));

            // Extract unique master account names from existing accounts
            const uniqueMasterAccounts = Array.from(
                new Set(
                    accounts
                        .map((account) => account.masterAccount)
                        .filter(Boolean),
                ),
            ).map((name, index) => ({
                id: `master-${name}-${index}`,
                name: name,
            }));

            setDropdownOptions({
                enterprises: enterprisesRes || [],
                products: productsRes || [],
                services: servicesRes || [],
                accountNames: uniqueAccountNames,
                masterAccounts: uniqueMasterAccounts,
                cloudTypes: [
                    {id: 'private-cloud', name: 'Private Cloud'},
                    {id: 'public-cloud', name: 'Public Cloud'},
                ],
                addresses: [],
            });
        } catch (error) {
            console.error('Failed to load dropdown options:', error);
        }
    };

    // Helper function to close all dialogs
    const closeAllDialogs = () => {
        setFilterVisible(false);
        setSortOpen(false);
        setHideOpen(false);
        setGroupOpen(false);
    };

    // Click-outside behavior to close dialogs
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;

            // Check if any dialog is open (excluding search since it's always visible)
            if (!filterVisible && !sortOpen && !hideOpen && !groupOpen) {
                return; // No dialog is open, nothing to do
            }

            // Check if click is outside all dialog containers (excluding search)
            const isOutsideFilter =
                filterRef.current && !filterRef.current.contains(target);
            const isOutsideSort =
                sortRef.current && !sortRef.current.contains(target);
            const isOutsideHide =
                hideRef.current && !hideRef.current.contains(target);
            const isOutsideGroup =
                groupRef.current && !groupRef.current.contains(target);

            // Check if click is on a filter suggestion dropdown
            const isOnFilterSuggestion = (target as Element).closest(
                '.filter-suggestions-dropdown',
            );

            // If click is outside all dialogs and not on a filter suggestion, close them (search remains open)
            if (
                isOutsideFilter &&
                isOutsideSort &&
                isOutsideHide &&
                isOutsideGroup &&
                !isOnFilterSuggestion
            ) {
                closeAllDialogs();
            }
        };

        // Add event listener
        document.addEventListener('mousedown', handleClickOutside);

        // Cleanup
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [filterVisible, sortOpen, hideOpen, groupOpen]);

    // Listen for sort changes from the AccountsTable
    useEffect(() => {
        const handleTableSortChange = (event: CustomEvent) => {
            const {column, direction} = event.detail;

            // Update the Sort panel state to reflect the table's sort change
            setSortColumn(column);
            setSortDirection(direction);
        };

        // Add event listener for custom enterprise table sort events
        document.addEventListener(
            'enterpriseTableSortChange',
            handleTableSortChange as EventListener,
        );

        // Cleanup
        return () => {
            document.removeEventListener(
                'enterpriseTableSortChange',
                handleTableSortChange as EventListener,
            );
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
    type ColumnType =
        | 'accountName'
        | 'masterAccount'
        | 'cloudType'
        | 'address'
        | 'technicalUser';
    const allCols: ColumnType[] = [
        'accountName',
        'masterAccount',
        'cloudType',
        'address',
        'technicalUser',
    ];

    // Columns available in toolbar panels (excludes address and technicalUser)
    const toolbarCols: ColumnType[] = [
        'accountName',
        'masterAccount',
        'cloudType',
    ];

    // Process account data with filtering, sorting, and search
    const processedConfigs = React.useMemo(() => {
        let filtered = [...accounts];

        // Apply search filter
        if (appliedSearchTerm.trim()) {
            filtered = filtered.filter((config) => {
                const searchLower = appliedSearchTerm.toLowerCase();
                return (
                    config.accountName?.toLowerCase().includes(searchLower) ||
                    config.address?.toLowerCase().includes(searchLower) ||
                    config.firstName?.toLowerCase().includes(searchLower) ||
                    config.lastName?.toLowerCase().includes(searchLower)
                );
            });
        }

        // Apply filters
        if (activeFilters.accountName) {
            filtered = filtered.filter(
                (config) => config.accountName === activeFilters.accountName,
            );
        }
        if (activeFilters.masterAccount) {
            filtered = filtered.filter(
                (config) =>
                    config.masterAccount === activeFilters.masterAccount,
            );
        }
        if (activeFilters.cloudType) {
            filtered = filtered.filter(
                (config) => config.cloudType === activeFilters.cloudType,
            );
        }
        // Address filter removed from UI but data processing remains intact

        // Apply sorting only when both column and direction are explicitly set
        if (
            sortColumn &&
            sortDirection &&
            (sortDirection === 'asc' || sortDirection === 'desc')
        ) {
            filtered.sort((a, b) => {
                let valueA = '';
                let valueB = '';

                switch (sortColumn) {
                    case 'accountName':
                        valueA = (a.accountName || '').toString().toLowerCase();
                        valueB = (b.accountName || '').toString().toLowerCase();
                        break;
                    case 'masterAccount':
                        valueA = (a.masterAccount || '')
                            .toString()
                            .toLowerCase();
                        valueB = (b.masterAccount || '')
                            .toString()
                            .toLowerCase();
                        break;
                    case 'cloudType':
                        valueA = (a.cloudType || '').toString().toLowerCase();
                        valueB = (b.cloudType || '').toString().toLowerCase();
                        break;
                    case 'address':
                        valueA = (a.address || '').toString().toLowerCase();
                        valueB = (b.address || '').toString().toLowerCase();
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
        // Create a stable sort key that only changes when both column and direction are set
        sortColumn && sortDirection ? `${sortColumn}-${sortDirection}` : '',
    ]);

    // Memoize the rows to avoid creating new objects on every render
    const accountTableRows = React.useMemo(() => {
        return processedConfigs.map<AccountRow>((a: any, index: number) => {
            // Use the actual data from processedConfigs first
            let actualAddresses = a.addresses || [];
            let actualTechnicalUsers = a.technicalUsers || [];
            let actualAddressData = a.addressData;

            const rowData = {
                id: a.id || '',
                accountName: a.accountName || '',
                masterAccount: a.masterAccount || '',
                cloudType: a.cloudType || '',
                email: a.email || '',
                phone: a.phone || '',
                address: a.address || '',
                addresses: actualAddresses,
                addressData: actualAddressData,
                technicalUsers: actualTechnicalUsers,
                licenses: a.licenses || [],
            };

            return rowData;
        });
    }, [processedConfigs]);

    // Helper functions for filter management
    const applyFilters = (filters: Record<string, any>) => {
        setActiveFilters(filters);
        closeAllDialogs();
    };

    // Column label mapping
    const columnLabels: Record<string, string> = {
        accountName: 'Account',
        masterAccount: 'Master Account',
        cloudType: 'Cloud Type',
        address: 'Address',
        technicalUser: 'Technical User',
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

    // Filter form state
    const [filterForm, setFilterForm] = useState({
        accountName: '',
        masterAccount: '',
        cloudType: '',
    });

    // Autocomplete states
    const [showAccountSuggestions, setShowAccountSuggestions] = useState(false);
    const [showMasterAccountSuggestions, setShowMasterAccountSuggestions] =
        useState(false);
    const [filteredAccountNames, setFilteredAccountNames] = useState<
        Array<{id: string; name: string}>
    >([]);
    const [filteredMasterAccounts, setFilteredMasterAccounts] = useState<
        Array<{id: string; name: string}>
    >([]);
    const [selectedAccountIndex, setSelectedAccountIndex] = useState(-1);
    const [selectedMasterAccountIndex, setSelectedMasterAccountIndex] =
        useState(-1);

    const handleApplyFilters = () => {
        const newFilters: Record<string, any> = {};

        if (filterForm.accountName.trim()) {
            newFilters.accountName = filterForm.accountName.trim();
        }
        if (filterForm.masterAccount.trim()) {
            newFilters.masterAccount = filterForm.masterAccount.trim();
        }
        if (filterForm.cloudType.trim()) {
            newFilters.cloudType = filterForm.cloudType.trim();
        }

        setActiveFilters(newFilters);
        closeAllDialogs();
    };

    const handleClearFilters = () => {
        setFilterForm({accountName: '', masterAccount: '', cloudType: ''});
        setActiveFilters({});
        closeAllDialogs();
    };

    const setGroupByFromLabel = (label: string) => {
        const l = label as 'None' | 'Account' | 'Master Account' | 'Cloud Type';
        setActiveGroupLabel(l);
    };

    const groupByProp =
        ActiveGroupLabel === 'Account'
            ? 'accountName'
            : ActiveGroupLabel === 'Master Account'
            ? 'masterAccount'
            : ActiveGroupLabel === 'Cloud Type'
            ? 'cloudType'
            : 'none';

    // Helper function to save accounts via API (replaced localStorage)
    const saveAccountsToStorage = async (accountsData: any[]) => {
        try {
            // Filter out temporary rows before saving to localStorage
            const persistentAccountsData = accountsData.filter(
                (account: any) => {
                const isTemporary = String(account.id).startsWith('tmp-');
                if (isTemporary) {
                        console.log(
                            '🧹 Not saving temporary row to localStorage:',
                            account.id,
                        );
                }
                return !isTemporary;
                },
            );

            // Save to localStorage for now (until proper API implementation)
            localStorage.setItem(
                'accountsData',
                JSON.stringify(persistentAccountsData),
            );
            console.log(
                '💾 Saved accounts to localStorage:',
                persistentAccountsData.length,
                'persistent accounts',
                `(filtered out ${
                    accountsData.length - persistentAccountsData.length
                } temporary rows)`,
            );
        } catch (error) {
            console.error('Error in saveAccountsToStorage:', error);
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
                    (e: {id: string; name: string}) =>
                        e.name === enterpriseName,
                );
            let foundProduct =
                existingProduct ||
                dropdownOptions.products.find(
                    (p: {id: string; name: string}) => p.name === productName,
                );
            let foundServices = serviceNames
                .map((serviceName) =>
                    dropdownOptions.services.find(
                        (s: {id: string; name: string}) =>
                            s.name === serviceName,
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

    // Auto-save new account when all required fields are filled
    const autoSaveNewAccount = async (
        tempRowId: string,
        updatedAccount?: any,
    ) => {
        try {
            console.log(
                '🚀 autoSaveNewAccount function called with tempRowId:',
                tempRowId,
            );

            // Mark row as saving
            setSavingRows((prev) => new Set([...Array.from(prev), tempRowId]));

            // Use the provided updated account or find it from current ref state
            const account =
                updatedAccount ||
                accountsRef.current.find((a) => a.id === tempRowId);
            if (!account) {
                console.error('❌ Account not found for auto-save:', tempRowId);
                console.log(
                    '📋 Available accounts from ref:',
                    accountsRef.current.map((a) => ({
                        id: a.id,
                        accountName: a.accountName,
                        address: a.address,
                    })),
                );
                setSavingRows((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(tempRowId);
                    return newSet;
                });
                return;
            }

            console.log('💾 Auto-saving new account:', account);

            // Map cloudType display value back to subscriptionTier for API
            const mapCloudTypeToSubscriptionTier = (
                cloudType: string,
            ): string => {
                if (!cloudType) return '';
                const lowerType = cloudType.toLowerCase();
                if (lowerType.includes('private')) {
                    return 'private';
                } else if (
                    lowerType.includes('public') ||
                    lowerType.includes('platform')
                ) {
                    return 'public';
                }
                return cloudType; // Return original if not recognized
            };

            // Build address details from account data
            const addressDetails = account.addresses?.[0]
                ? {
                      addressLine1:
                          account.addresses[0].addressLine1 ||
                          account.addresses[0].street ||
                          '',
                      addressLine2: account.addresses[0].addressLine2 || '',
                      city: account.addresses[0].city || '',
                      state: account.addresses[0].state || '',
                      zipCode:
                          account.addresses[0].zipCode ||
                          account.addresses[0].postalCode ||
                          '',
                      country:
                          account.addresses[0].country || account.country || '',
                  }
                : undefined;

            // Build technical user from account data
            const technicalUser = account.technicalUsers?.[0]
                ? {
                      firstName: account.technicalUsers[0].firstName || '',
                      middleName: account.technicalUsers[0].middleName || '',
                      lastName: account.technicalUsers[0].lastName || '',
                      adminUsername:
                          account.technicalUsers[0].adminUsername ||
                          account.technicalUsers[0].username ||
                          '',
                      adminEmail:
                          account.technicalUsers[0].adminEmail ||
                          account.technicalUsers[0].email ||
                          '',
                      adminPassword:
                          account.technicalUsers[0].adminPassword || '',
                      assignedUserGroup:
                          account.technicalUsers[0].assignedUserGroup || '',
                      assignedRole:
                          account.technicalUsers[0].assignedRole || '',
                      assignmentStartDate:
                          account.technicalUsers[0].assignmentStartDate || '',
                      assignmentEndDate:
                          account.technicalUsers[0].assignmentEndDate || '',
                      status: account.technicalUsers[0].status || 'Active',
                      createdBy: account.technicalUsers[0].createdBy || 'admin',
                  }
                : undefined;

            // Build onboard payload for external Admin Portal API
            const onboardPayload = {
                accountName: account.accountName || '',
                masterAccount:
                    account.masterAccount || account.accountName || '',
                subscriptionTier: mapCloudTypeToSubscriptionTier(
                    account.cloudType || '',
                ),
                ...(addressDetails && {addressDetails}),
                ...(technicalUser && {technicalUser}),
            };

            console.log(
                '💾 Creating new account via External Admin Portal API:',
                onboardPayload,
            );

            // Call external Admin Portal API to onboard account
            const apiResponse = await onboardAccount(onboardPayload);

            // Extract account ID from response - handle different response structures
            // API may return: { accountId: "..." } or { data: { accountId: "..." } }
            const newId =
                apiResponse.accountId ||
                apiResponse.data?.accountId ||
                apiResponse.data?.account?.accountId ||
                apiResponse.id ||
                apiResponse.SK ||
                tempRowId; // Fallback to temp ID if no ID returned

            console.log(
                '✅ Account saved via External Admin Portal API with ID:',
                newId,
            );
            console.log('📊 Full API response:', apiResponse);

            // Preserve display order for the new ID
            const oldDisplayOrder = displayOrderRef.current.get(tempRowId);

            // Update the account with the real ID
            setAccounts((prev) => {
                const updated = prev.map((acc) =>
                    acc.id === tempRowId
                        ? {
                              ...acc,
                              id: newId,
                              createdAt:
                                  apiResponse.data?.createdAt ||
                                  apiResponse.data?.registeredOn ||
                                  apiResponse.createdAt ||
                                  new Date().toISOString(),
                              updatedAt:
                                  apiResponse.data?.updatedAt ||
                                  apiResponse.data?.lastModified ||
                                  apiResponse.updatedAt ||
                                  new Date().toISOString(),
                          }
                        : acc,
                );
                // Apply stable sorting to maintain display order
                const sortedUpdated = sortConfigsByDisplayOrder(updated);

                // Save to localStorage to persist the converted account
                saveAccountsToStorage(sortedUpdated);
                console.log('💾 Saved converted account to localStorage');

                return sortedUpdated;
            });

            // Update display order reference with the new ID
            if (oldDisplayOrder !== undefined) {
                displayOrderRef.current.delete(tempRowId); // Remove old reference
                displayOrderRef.current.set(newId, oldDisplayOrder); // Add new reference
                console.log(
                    `📍 Preserved display order ${oldDisplayOrder} for new account ID ${newId}`,
                );
            }

            console.log(' New account saved automatically!');
        } catch (error) {
            console.error(' Auto-save failed:', error);
        } finally {
            // Remove from saving state
            setSavingRows((prev) => {
                const newSet = new Set(Array.from(prev));
                newSet.delete(tempRowId);
                return newSet;
            });
        }
    };

    // Function to check if there's a completely blank row
    const hasBlankRow = () => {
        return accounts.some((config) => {
            const isTemporary = String(config.id).startsWith('tmp-');
            const isEmpty =
                !config.accountName &&
                !config.masterAccount &&
                !config.cloudType &&
                !config.address;
            return isTemporary && isEmpty;
        });
    };

    // Function to validate incomplete rows and return validation details
    const validateIncompleteRows = () => {
        const effectiveConfigs = getEffectiveAccounts();

        // Get all temporary (unsaved) rows using effective configs
        const temporaryRows = effectiveConfigs.filter((config: any) =>
            String(config.id).startsWith('tmp-'),
        );

        // Get all existing rows that might have incomplete data using effective configs
        const existingRows = effectiveConfigs.filter(
            (config: any) => !String(config.id).startsWith('tmp-'),
        );

        // Check for incomplete temporary rows (exclude completely blank rows)
        const incompleteTemporaryRows = temporaryRows.filter((config: any) => {
            const hasAccountName = hasValue(config.accountName);
            const hasMasterAccount = hasValue(config.masterAccount);
            const hasCloudType = hasValue(config.cloudType);

            // Don't include completely blank rows (new rows that haven't been touched)
            const isCompletelyBlank =
                !hasAccountName && !hasMasterAccount && !hasCloudType;
            if (isCompletelyBlank) return false;

            // Row is incomplete if it has some data but not all required fields (Account Name, Master Account, Cloud Type)
            return !hasAccountName || !hasMasterAccount || !hasCloudType;
        });

        // Check for incomplete existing rows (exclude completely blank rows)
        const incompleteExistingRows = existingRows.filter((config: any) => {
            const hasAccountName = hasValue(config.accountName);
            const hasMasterAccount = hasValue(config.masterAccount);
            const hasCloudType = hasValue(config.cloudType);

            // Don't include completely blank rows (existing rows shouldn't be blank, but just in case)
            const isCompletelyBlank =
                !hasAccountName && !hasMasterAccount && !hasCloudType;
            if (isCompletelyBlank) return false;

            // Row is incomplete if it has some data but not all required fields (Account Name, Master Account, Cloud Type)
            return !hasAccountName || !hasMasterAccount || !hasCloudType;
        });

        // Combine all incomplete rows
        const incompleteRows = [
            ...incompleteTemporaryRows,
            ...incompleteExistingRows,
        ];

        if (incompleteRows.length > 0) {
            const missingFields = new Set<string>();
            incompleteRows.forEach((config) => {
                if (!hasValue(config.accountName))
                    missingFields.add('Account Name');
                if (!hasValue(config.masterAccount))
                    missingFields.add('Master Account');
                if (!hasValue(config.cloudType)) missingFields.add('Cloud Type');
            });

            const incompleteCount = incompleteRows.length;
            const message = `Found ${incompleteCount} incomplete record${
                incompleteCount > 1 ? 's' : ''
            }. Please complete all required fields (${Array.from(
                missingFields,
            ).join(', ')}) before adding a new row.`;

            return {
                hasIncomplete: true,
                incompleteRows,
                message,
            };
        }

        return {
            hasIncomplete: false,
            incompleteRows: [],
            message: '',
        };
    };

    // Debounced auto-save function with countdown
    // Function to merge server data with pending local changes
    const getEffectiveAccounts = useCallback(() => {
        return accounts.map((config) => {
            const pendingChanges = pendingLocalChanges[config.id];
            if (pendingChanges) {
                // Apply pending changes, ensuring field names match the config structure
                const mergedConfig = {...config};
                Object.keys(pendingChanges).forEach((key) => {
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
                return mergedConfig;
            }
            return config;
        });
    }, [accounts, pendingLocalChanges]);

    // Memoized license validation change handler to prevent infinite re-renders
    const handleLicenseValidationChange = useCallback(
        (hasIncomplete: boolean, incompleteRows: string[]) => {
            setHasIncompleteLicenses(hasIncomplete);
            setIncompleteLicenseRows(incompleteRows);
        },
        [],
    );

    // Function to check for incomplete rows
    const getIncompleteRows = () => {
        const effectiveConfigs = getEffectiveAccounts();

        const incompleteRows = effectiveConfigs
            .filter((config: any) => {
                const hasAccountName = hasValue(config.accountName);
                const hasMasterAccount = hasValue(config.masterAccount);
                const hasCloudType = hasValue(config.cloudType);

                // Check if this account has incomplete licenses
                const hasIncompleteLicenses =
                    config.licenses &&
                    config.licenses.length > 0 &&
                    config.licenses.some((license: any) => {
                        const hasEnterprise = hasValue(license.enterprise);
                        const hasProduct = hasValue(license.product);
                        const hasService = hasValue(license.service);
                        const hasLicenseStartDate = hasValue(
                            license.licenseStartDate,
                        );
                        const hasLicenseEndDate = hasValue(
                            license.licenseEndDate,
                        );
                        const hasNumberOfUsers = hasValue(
                            license.numberOfUsers,
                        );
                        const hasValidNoticePeriod =
                            !license.renewalNotice ||
                            hasValue(license.noticePeriodDays);

                        return (
                            !hasEnterprise ||
                            !hasProduct ||
                            !hasService ||
                            !hasLicenseStartDate ||
                            !hasLicenseEndDate ||
                            !hasNumberOfUsers ||
                            !hasValidNoticePeriod
                        );
                    });

                // When validation errors are being shown, include completely blank rows for highlighting
                // Otherwise, don't include completely blank rows (new rows that haven't been touched)
                const isCompletelyBlank =
                    !hasAccountName && !hasMasterAccount && !hasCloudType;
                if (
                    isCompletelyBlank &&
                    !showValidationErrors &&
                    !hasIncompleteLicenses
                )
                    return false;

                // Row is incomplete if:
                // 1. It has some data but not all required main fields (Account Name, Master Account, Cloud Type), OR
                // 2. It's completely blank and validation is active, OR
                // 3. It has incomplete license data
                const isIncomplete =
                    !hasAccountName ||
                    !hasMasterAccount ||
                    !hasCloudType ||
                    hasIncompleteLicenses;

                return isIncomplete;
            })
            .map((config: any) => config.id);

        // Only log when showValidationErrors is true to prevent infinite loops
        if (showValidationErrors && incompleteRows.length > 0) {
            console.log('🔍 getIncompleteRows result:', {
                incompleteRowIds: incompleteRows,
                totalConfigs: effectiveConfigs.length,
                showValidationErrors,
                sampleConfigIds: effectiveConfigs.slice(0, 3).map((c) => c.id),
            });
        }

        return incompleteRows;
    };

    // Enhanced function to detect any unsaved changes including partial data
    const getUnsavedChanges = useCallback(() => {
        const effectiveConfigs = getEffectiveAccounts();

        // Check for any rows with partial data that would be lost
        const hasPartialData = effectiveConfigs.some((config: any) => {
            const hasAccountName = hasValue(config.accountName);
            const hasMasterAccount = hasValue(config.masterAccount);
            const hasCloudType = hasValue(config.cloudType);
            const hasAddress = hasValue(config.address);
            const hasTechnicalUsers =
                config.technicalUsers && config.technicalUsers.length > 0;

            // Check if it's a new row (temporary ID) with any data
            const isNewRow = String(config.id).startsWith('tmp-');
            const hasAnyData =
                hasAccountName ||
                hasMasterAccount ||
                hasCloudType ||
                hasAddress ||
                hasTechnicalUsers;

            // If it's a new row with any data, it's unsaved
            if (isNewRow && hasAnyData) {
                console.log('🔍 Found unsaved new row:', config.id, {
                    hasAccountName: !!hasAccountName,
                    hasMasterAccount: !!hasMasterAccount,
                    hasCloudType: !!hasCloudType,
                    hasAddress: !!hasAddress,
                    hasTechnicalUsers: !!hasTechnicalUsers,
                });
                return true;
            }

            // Check for incomplete existing rows that have been modified
            const isIncomplete =
                hasAnyData &&
                (!hasAccountName || !hasMasterAccount || !hasCloudType);
            if (isIncomplete) {
                console.log('🔍 Found incomplete existing row:', config.id);
            }
            return isIncomplete;
        });

        // Check for pending local changes
        const hasPendingChanges = Object.keys(pendingLocalChanges).length > 0;

        // Check for modified existing records
        const hasModifiedRecords = modifiedExistingRecords.size > 0;

        console.log('🔍 Unsaved changes check:', {
            hasPartialData,
            hasPendingChanges,
            hasModifiedRecords,
            pendingLocalChangesKeys: Object.keys(pendingLocalChanges),
            modifiedExistingRecordsArray: Array.from(modifiedExistingRecords),
        });

        return hasPartialData || hasPendingChanges || hasModifiedRecords;
    }, [getEffectiveAccounts, pendingLocalChanges, modifiedExistingRecords]);

    // Track unsaved changes - place after getUnsavedChanges is defined
    useEffect(() => {
        const hasChanges = getUnsavedChanges();
        setHasUnsavedChanges(hasChanges);
        setPreventNavigation(hasChanges);
    }, [getUnsavedChanges]);

    const debouncedAutoSave = async () => {
        console.log(
            '🕐 debouncedAutoSave called - clearing existing timer and starting new one',
        );

        // Clear existing timer
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
            clearInterval(countdownIntervalRef.current!);
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
                clearInterval(countdownIntervalRef.current!);

                // Get all temporary (unsaved) rows that are complete using current ref
                const temporaryRows = accountsRef.current.filter((config) => {
                    const isTemp = String(config.id).startsWith('tmp-');
                    if (!isTemp) return false;

                    // Be more strict about what constitutes a complete account row
                    const hasAccountName =
                        hasValue(config.accountName) &&
                        safeTrim(config.accountName).length > 0;
                    const hasAddress =
                        hasValue(config.address) &&
                        safeTrim(config.address).length > 0;

                    const isComplete = hasAccountName && hasAddress;

                    if (isTemp && !isComplete) {
                        console.log(
                            `🚫 Skipping incomplete temporary account ${config.id}:`,
                            {
                                hasAccountName: !!hasAccountName,
                                hasAddress: !!hasAddress,
                                accountNameValue: config.accountName,
                                addressValue: config.address,
                            },
                        );
                    }

                    return isComplete;
                });

                // Get all modified existing records that are still complete
                const modifiedRows = accountsRef.current.filter((config) => {
                    const isExisting = !String(config.id).startsWith('tmp-');
                    const isModified = modifiedExistingRecordsRef.current.has(
                        String(config.id),
                    );

                    if (isExisting && isModified) {
                        // Double-check that the record still has all required fields
                        const hasAccountName = hasValue(config.accountName);
                        const hasMasterAccount = hasValue(config.masterAccount);
                        const hasCloudType = hasValue(config.cloudType);
                        const hasAddress = hasValue(config.address);

                        const isComplete =
                            hasAccountName &&
                            hasMasterAccount &&
                            hasCloudType &&
                            hasAddress;

                        console.log(
                            `🔍 Checking modified account ${config.id}: isComplete=${isComplete}`,
                            {
                                hasAccountName: !!hasAccountName,
                                hasMasterAccount: !!hasMasterAccount,
                                hasCloudType: !!hasCloudType,
                                hasAddress: !!hasAddress,
                                accountNameValue: config.accountName,
                                masterAccountValue: config.masterAccount,
                                cloudTypeValue: config.cloudType,
                                addressValue: config.address,
                            },
                        );

                        return isComplete;
                    }

                    console.log(
                        `🔍 Checking account ${config.id}: isExisting=${isExisting}, isModified=${isModified}`,
                    );
                    return false;
                });

                console.log(
                    `📊 Found ${temporaryRows.length} complete temporary accounts to auto-save`,
                );
                console.log(
                    `📊 Found ${modifiedRows.length} modified existing accounts to auto-save`,
                );
                console.log(
                    '🔍 Current modifiedExistingRecords set (from ref):',
                    Array.from(modifiedExistingRecordsRef.current),
                );
                console.log(
                    '🔍 All current accounts:',
                    accountsRef.current.map((c) => ({
                        id: c.id,
                        isTemp: String(c.id).startsWith('tmp-'),
                        isModified: modifiedExistingRecordsRef.current.has(
                            String(c.id),
                        ),
                        accountName: c.accountName,
                        address: c.address,
                        hasAccountName: !!hasValue(c.accountName),
                        hasAddress: !!hasValue(c.address),
                    })),
                );

                // Check for orphaned records in modifiedExistingRecords
                const orphanedRecords = Array.from(
                    modifiedExistingRecordsRef.current,
                ).filter(
                    (recordId) =>
                        !accountsRef.current.find(
                            (config) => String(config.id) === recordId,
                        ),
                );
                if (orphanedRecords.length > 0) {
                    console.log(
                        '⚠️ Found orphaned records in modifiedExistingRecords:',
                        orphanedRecords,
                    );
                    console.log(
                        '🧹 Cleaning up orphaned records from modified set',
                    );
                    setModifiedExistingRecords((prev) => {
                        const newSet = new Set(prev);
                        orphanedRecords.forEach((recordId) =>
                            newSet.delete(recordId),
                        );
                        return newSet;
                    });
                    // Update the ref immediately for this operation
                    const cleanedSet = new Set(
                        modifiedExistingRecordsRef.current,
                    );
                    orphanedRecords.forEach((recordId) =>
                        cleanedSet.delete(recordId),
                    );
                    modifiedExistingRecordsRef.current = cleanedSet;
                }

                const totalRowsToSave =
                    temporaryRows.length + modifiedRows.length;
                if (totalRowsToSave > 0) {
                    console.log(
                        '💾 Auto-saving accounts after 10 seconds of inactivity...',
                        temporaryRows.map((r) => r.id),
                    );

                    for (const tempRow of temporaryRows) {
                        console.log(`💾 Auto-saving account: ${tempRow.id}`);
                        await autoSaveNewAccount(tempRow.id);
                    }

                    // Save modified existing accounts via API
                    const apiBase =
                        process.env.NEXT_PUBLIC_API_BASE ||
                        'http://localhost:4000';
                    for (const modifiedRow of modifiedRows) {
                        console.log(
                            `💾 Saving modified existing account: ${modifiedRow.id}`,
                        );
                        try {
                            // Transform licenses from frontend format to backend format
                            const transformedLicenses = (
                                modifiedRow.licenses || []
                            ).map((license: any) => ({
                                enterprise: license.enterprise || '',
                                product: license.product || '',
                                service: license.service || '',
                                licenseStart:
                                    license.licenseStartDate ||
                                    license.licenseStart ||
                                    '',
                                licenseEnd:
                                    license.licenseEndDate ||
                                    license.licenseEnd ||
                                    '',
                                users:
                                    license.numberOfUsers ||
                                    license.users ||
                                    '',
                                renewalNotice: license.renewalNotice || false,
                                noticePeriod: parseInt(
                                    license.noticePeriodDays ||
                                        license.noticePeriod ||
                                        '0',
                                    10,
                                ),
                                contacts:
                                    license.contactDetails ||
                                    license.contacts ||
                                    [],
                            }));

                            const response = await fetch(
                                `${apiBase}/api/accounts`,
                                {
                                    method: 'PUT',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                        id: modifiedRow.id,
                                        accountName:
                                            modifiedRow.accountName || '',
                                        masterAccount:
                                            modifiedRow.masterAccount || '',
                                        cloudType: modifiedRow.cloudType || '',
                                        address: modifiedRow.address || '',
                                        country: modifiedRow.country || '',
                                        addresses: modifiedRow.addresses || [],
                                        licenses: transformedLicenses,
                                    }),
                                },
                            );

                            if (!response.ok) {
                                throw new Error('Failed to update account');
                            }

                            console.log(
                                `✅ Modified account ${modifiedRow.id} saved via API`,
                            );
                        } catch (error) {
                            console.error(
                                'Error updating account via API:',
                                error,
                            );
                        }
                    }

                    // Clear the modified records set (including any incomplete records that were filtered out)
                    const modifiedRecordIds = modifiedRows.map((row) =>
                        String(row.id),
                    );
                    console.log(
                        '🧹 Clearing modified records set. Keeping only complete records:',
                        modifiedRecordIds,
                    );
                    setModifiedExistingRecords(new Set());

                    // Show success animation for all auto-saved entries
                    console.log(
                        '✨ Showing auto-save success animation for all entries',
                    );
                    setShowAutoSaveSuccess(true);

                    // Also show notification
                    const message =
                        temporaryRows.length > 0 && modifiedRows.length > 0
                            ? `Auto-saved ${temporaryRows.length} new and ${modifiedRows.length} updated entries`
                            : temporaryRows.length > 0
                            ? `Auto-saved ${temporaryRows.length} new entries`
                            : `Auto-saved ${modifiedRows.length} updated entries`;

                    showBlueNotification(message);

                    setTimeout(() => {
                        console.log('✨ Hiding auto-save success animation');
                        setShowAutoSaveSuccess(false);
                    }, 3000); // Show for 3 seconds

                    // Clear unsaved changes state after successful auto-save
                    console.log(
                        '🧹 Clearing unsaved changes state after successful auto-save',
                    );
                    console.log(
                        '🧹 Before clearing - pendingLocalChanges:',
                        Object.keys(pendingLocalChanges),
                    );
                    console.log(
                        '🧹 Before clearing - modifiedExistingRecords:',
                        Array.from(modifiedExistingRecords),
                    );
                    console.log(
                        '🧹 Before clearing - hasUnsavedChanges:',
                        hasUnsavedChanges,
                    );

                    setPendingLocalChanges({});
                    setHasUnsavedChanges(false);

                    console.log(
                        '🧹 After clearing - all unsaved state should be clear',
                    );

                    console.log(
                        `✅ Auto-saved ${totalRowsToSave} entries successfully`,
                    );
                } else {
                    console.log('ℹ️ No rows found to auto-save');
                }
            } catch (error) {
                console.error('❌ Auto-save failed:', error);
            } finally {
                setIsAutoSaving(false);
            }
        }, 10000); // 10 seconds delay

        autoSaveTimerRef.current = timer;
        console.log('⏰ Auto-save timer set for 10 seconds');
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

                const hasAccountName = hasValue(config.accountName);
                const hasMasterAccount = hasValue(config.masterAccount);
                const hasCloudType = hasValue(config.cloudType);

                return hasAccountName && hasMasterAccount && hasCloudType;
            });

            // Get all modified existing records that are still complete
            const modifiedRows = accountsRef.current.filter((config) => {
                const isExisting = !String(config.id).startsWith('tmp-');
                const isModified = modifiedExistingRecordsRef.current.has(
                    String(config.id),
                );

                if (isExisting && isModified) {
                    // Double-check that the record still has all required fields
                    const hasAccountName = hasValue(config.accountName);
                    const hasMasterAccount = hasValue(config.masterAccount);
                    const hasCloudType = hasValue(config.cloudType);

                    const isComplete =
                        hasAccountName && hasMasterAccount && hasCloudType;

                    console.log(
                        `🔍 Checking modified account ${config.id}: isComplete=${isComplete}`,
                        {
                            hasAccountName: !!hasAccountName,
                            hasMasterAccount: !!hasMasterAccount,
                            hasCloudType: !!hasCloudType,
                            accountNameValue: config.accountName,
                            masterAccountValue: config.masterAccount,
                            cloudTypeValue: config.cloudType,
                            addressValue: config.address,
                        },
                    );

                    return isComplete;
                }

                console.log(
                    `🔍 Checking account ${config.id}: isExisting=${isExisting}, isModified=${isModified}`,
                );
                return false;
            });

            console.log(
                `📊 Found ${temporaryRows.length} complete temporary accounts to auto-save`,
            );
            console.log(
                `📊 Found ${modifiedRows.length} modified existing accounts to auto-save`,
            );
            console.log(
                '🔍 Current modifiedExistingRecords set (from ref):',
                Array.from(modifiedExistingRecordsRef.current),
            );

            const totalRowsToSave = temporaryRows.length + modifiedRows.length;
            if (totalRowsToSave > 0) {
                console.log(
                    '💾 Auto-saving accounts...',
                    temporaryRows.map((r) => r.id),
                );

                for (const tempRow of temporaryRows) {
                    console.log(`💾 Auto-saving account: ${tempRow.id}`);
                    await autoSaveNewAccount(tempRow.id);
                }

                // Save modified existing accounts via API
                const apiBase =
                    process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
                for (const modifiedRow of modifiedRows) {
                    console.log(
                        `💾 Saving modified existing account: ${modifiedRow.id}`,
                    );
                    try {
                        // Transform licenses from frontend format to backend format
                        const transformedLicenses = (
                            modifiedRow.licenses || []
                        ).map((license: any) => ({
                            enterprise: license.enterprise || '',
                            product: license.product || '',
                            service: license.service || '',
                            licenseStart:
                                license.licenseStartDate ||
                                license.licenseStart ||
                                '',
                            licenseEnd:
                                license.licenseEndDate ||
                                license.licenseEnd ||
                                '',
                            users: license.numberOfUsers || license.users || '',
                            renewalNotice: license.renewalNotice || false,
                            noticePeriod: parseInt(
                                license.noticePeriodDays ||
                                    license.noticePeriod ||
                                    '0',
                                10,
                            ),
                            contacts:
                                license.contactDetails ||
                                license.contacts ||
                                [],
                        }));

                        const response = await fetch(
                            `${apiBase}/api/accounts`,
                            {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    id: modifiedRow.id,
                                    accountName: modifiedRow.accountName || '',
                                    masterAccount:
                                        modifiedRow.masterAccount || '',
                                    cloudType: modifiedRow.cloudType || '',
                                    address: modifiedRow.address || '',
                                    country: modifiedRow.country || '',
                                    addresses: modifiedRow.addresses || [],
                                    licenses: transformedLicenses,
                                }),
                            },
                        );

                        if (!response.ok) {
                            throw new Error('Failed to update account');
                        }

                        console.log(
                            `✅ Modified account ${modifiedRow.id} saved via API`,
                        );
                    } catch (error) {
                        console.error('Error updating account via API:', error);
                    }
                }

                // Clear the modified records set
                const modifiedRecordIds = modifiedRows.map((row) =>
                    String(row.id),
                );
                console.log(
                    '🧹 Clearing modified records set. Keeping only complete records:',
                    modifiedRecordIds,
                );
                setModifiedExistingRecords(new Set());

                // Show success animation for all auto-saved entries
                console.log(
                    '✨ Showing auto-save success animation for all entries',
                );
                setShowAutoSaveSuccess(true);

                setTimeout(() => {
                    console.log('✨ Hiding auto-save success animation');
                    setShowAutoSaveSuccess(false);
                }, 3000); // Show for 3 seconds

                // Clear unsaved changes state after successful auto-save
                console.log(
                    '🧹 Clearing unsaved changes state after successful auto-save',
                );
                console.log(
                    '🧹 Before clearing - pendingLocalChanges:',
                    Object.keys(pendingLocalChanges),
                );
                console.log(
                    '🧹 Before clearing - modifiedExistingRecords:',
                    Array.from(modifiedExistingRecords),
                );
                console.log(
                    '🧹 Before clearing - hasUnsavedChanges:',
                    hasUnsavedChanges,
                );

                setPendingLocalChanges({});
                setHasUnsavedChanges(false);

                console.log(
                    '🧹 After clearing - all unsaved state should be clear',
                );

                console.log(
                    `✅ Auto-saved ${totalRowsToSave} entries successfully`,
                );
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
        console.log('🚀 ========================================');
        console.log('🚀 SAVE BUTTON CLICKED - handleSaveAll');
        console.log('🚀 ========================================');

        console.log('📊 Current state before save:', {
            accountsCount: accounts.length,
            modifiedExistingRecordsSize:
                modifiedExistingRecordsRef.current.size,
            modifiedExistingRecordsArray: Array.from(
                modifiedExistingRecordsRef.current,
            ),
            pendingLocalChangesKeys: Object.keys(pendingLocalChanges),
            pendingLocalChangesValues: pendingLocalChanges,
            hasUnsavedChanges,
            preventNavigation,
        });
        const effectiveConfigs = getEffectiveAccounts();

        // Get current license state from AccountsTable to ensure we have the latest data
        const currentLicenseState =
            accountsTableRef.current?.getCurrentLicenseState?.() || {};

        console.log(
            '📋 Current license state from AccountsTable:',
            currentLicenseState,
        );
        console.log(
            '📋 License state breakdown:',
            Object.keys(currentLicenseState).map((rowId) => ({
            rowId,
            licenseCount: currentLicenseState[rowId]?.length || 0,
                licenses: currentLicenseState[rowId],
            })),
        );

        // Update effectiveConfigs with current license state
        const configsWithCurrentLicenses = effectiveConfigs.map(
            (config: any) => {
                const currentLicenses = currentLicenseState[config.id];
                if (currentLicenses) {
                    console.log(
                        `📋 Updating config ${config.id} with ${currentLicenses.length} licenses`,
                    );
                    return {...config, licenses: currentLicenses};
                }
                console.log(`📋 No licenses found for config ${config.id}`);
                return config;
            },
        );

        console.log('💾 Save button clicked - effective accounts state:');
        configsWithCurrentLicenses.forEach((c: any, index: number) => {
            console.log(`  Record ${index + 1}:`, {
                id: c.id,
                enterprise: c.enterprise || c.enterpriseName,
                product: c.product || c.productName,
                services: c.services || c.serviceName,
                hasEnterprise: !!hasValue(c.enterprise || c.enterpriseName),
                hasProduct: !!hasValue(c.product || c.productName),
                hasServices: !!hasValue(c.services || c.serviceName),
                hasPendingChanges: !!pendingLocalChanges[c.id],
            });
        });

        // Clear auto-save timer since user is manually saving
        if (autoSaveTimerRef.current) {
            console.log('🛑 Manual save clicked - clearing auto-save timer');
            clearTimeout(autoSaveTimerRef.current);
            autoSaveTimerRef.current = null;
            setAutoSaveCountdown(null);
            if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
            }
        }

        // Clear any pending auto-save data from localStorage
        localStorage.removeItem('accountsAutoSave');
        console.log(
            '🧹 Cleared auto-save data from localStorage due to manual save',
        );

        // Get all temporary (unsaved) rows using effective configs with current licenses
        const temporaryRows = configsWithCurrentLicenses.filter((config: any) =>
            String(config.id).startsWith('tmp-'),
        );

        // Get all existing rows that might have incomplete data using effective configs with current licenses
        const existingRows = configsWithCurrentLicenses.filter(
            (config: any) => !String(config.id).startsWith('tmp-'),
        );

        // Check for incomplete temporary rows (including completely blank ones)
        const incompleteTemporaryRows = temporaryRows.filter((config: any) => {
            const hasAccountName = hasValue(config.accountName);
            const hasMasterAccount = hasValue(config.masterAccount);
            const hasCloudType = hasValue(config.cloudType);

            return !hasAccountName || !hasMasterAccount || !hasCloudType;
        });

        // Check for incomplete existing rows (including completely blank ones)
        const incompleteExistingRows = existingRows.filter((config: any) => {
            const hasAccountName = hasValue(config.accountName);
            const hasMasterAccount = hasValue(config.masterAccount);
            const hasCloudType = hasValue(config.cloudType);

            return !hasAccountName || !hasMasterAccount || !hasCloudType;
        });

        // Combine all incomplete rows
        const incompleteRows = [
            ...incompleteTemporaryRows,
            ...incompleteExistingRows,
        ];

        // Check if there are any pending changes (auto-save timer or modified records)
        const hasActiveAutoSave = autoSaveTimerRef.current !== null;
        const hasModifiedExistingRecords =
            modifiedExistingRecordsRef.current.size > 0;
        const hasPendingChanges =
            hasActiveAutoSave || hasModifiedExistingRecords;

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
                hasAccountName: !!hasValue(r.accountName),
                hasEmail: !!hasValue(r.email),
                hasPhone: !!hasValue(r.phone),
            })),
            incompleteExistingRows: incompleteExistingRows.map((r: any) => ({
                id: r.id,
                accountName: r.accountName,
                email: r.email,
                phone: r.phone,
            })),
        });

        // Check for incomplete licenses in real-time by examining current data
        const currentIncompleteLicenseData: string[] = [];
        const allLicenseMissingFields = new Set<string>();
        let singleLicenseSpecificFields = new Set<string>();
        let hasSingleIncompleteAccount = false;

        const currentHasIncompleteLicenses = configsWithCurrentLicenses.some(
            (config: any) => {
                if (config.licenses && config.licenses.length > 0) {
                    const hasIncompleteInThisRow = config.licenses.some(
                        (license: any) => {
                            const hasEnterprise = hasValue(license.enterprise);
                            const hasProduct = hasValue(license.product);
                            const hasService = hasValue(license.service);
                            const hasLicenseStartDate = hasValue(
                                license.licenseStartDate,
                            );
                            const hasLicenseEndDate = hasValue(
                                license.licenseEndDate,
                            );
                            const hasNumberOfUsers = hasValue(
                                license.numberOfUsers,
                            );
                            const hasValidNoticePeriod =
                                !license.renewalNotice ||
                                hasValue(license.noticePeriodDays);

                            return (
                                !hasEnterprise ||
                                !hasProduct ||
                                !hasService ||
                                !hasLicenseStartDate ||
                                !hasLicenseEndDate ||
                                !hasNumberOfUsers ||
                                !hasValidNoticePeriod
                            );
                        },
                    );
                    if (hasIncompleteInThisRow) {
                        currentIncompleteLicenseData.push(config.id);
                    }
                    return hasIncompleteInThisRow;
                }
                return false;
            },
        );

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
                    const incompleteLicenses = config.licenses.filter(
                        (license: any) => {
                            const hasEnterprise = hasValue(license.enterprise);
                            const hasProduct = hasValue(license.product);
                            const hasService = hasValue(license.service);
                            const hasLicenseStartDate = hasValue(
                                license.licenseStartDate,
                            );
                            const hasLicenseEndDate = hasValue(
                                license.licenseEndDate,
                            );
                            const hasNumberOfUsers = hasValue(
                                license.numberOfUsers,
                            );
                            const hasValidNoticePeriod =
                                !license.renewalNotice ||
                                hasValue(license.noticePeriodDays);

                            return (
                                !hasEnterprise ||
                                !hasProduct ||
                                !hasService ||
                                !hasLicenseStartDate ||
                                !hasLicenseEndDate ||
                                !hasNumberOfUsers ||
                                !hasValidNoticePeriod
                            );
                        },
                    );

                    if (incompleteLicenses.length > 0) {
                        accountsWithIncompleteLicenses.push({
                            accountId: config.id,
                            accountName: config.accountName || '',
                            totalLicenses: config.licenses.length,
                            incompleteLicenses: incompleteLicenses.length,
                        });

                        incompleteLicenses.forEach((license: any) => {
                            const hasEnterprise = hasValue(license.enterprise);
                            const hasProduct = hasValue(license.product);
                            const hasService = hasValue(license.service);
                            const hasLicenseStartDate = hasValue(
                                license.licenseStartDate,
                            );
                            const hasLicenseEndDate = hasValue(
                                license.licenseEndDate,
                            );
                            const hasNumberOfUsers = hasValue(
                                license.numberOfUsers,
                            );
                            const hasValidNoticePeriod =
                                !license.renewalNotice ||
                                hasValue(license.noticePeriodDays);

                            if (!hasEnterprise)
                                allLicenseMissingFields.add('Enterprise');
                            if (!hasProduct)
                                allLicenseMissingFields.add('Product');
                            if (!hasService)
                                allLicenseMissingFields.add('Service');
                            if (!hasLicenseStartDate)
                                allLicenseMissingFields.add(
                                    'License Start Date',
                                );
                            if (!hasLicenseEndDate)
                                allLicenseMissingFields.add('License End Date');
                            if (!hasNumberOfUsers)
                                allLicenseMissingFields.add('No. of Users');
                            if (!hasValidNoticePeriod)
                                allLicenseMissingFields.add(
                                    'Notice Period (days)',
                                );
                        });
                    }
                }
            });

            // Check if there's only one account with exactly one incomplete license
            if (
                accountsWithIncompleteLicenses.length === 1 &&
                accountsWithIncompleteLicenses[0].totalLicenses === 1 &&
                accountsWithIncompleteLicenses[0].incompleteLicenses === 1
            ) {
                hasSingleIncompleteAccount = true;
                singleLicenseSpecificFields = new Set(allLicenseMissingFields);
            }
        }

        console.log('🔍 License validation check:', {
            totalConfigs: configsWithCurrentLicenses.length,
            configsWithLicenses: configsWithCurrentLicenses.filter(
                (c) => c.licenses?.length > 0,
            ).length,
            currentHasIncompleteLicenses,
            allLicenseMissingFields: Array.from(allLicenseMissingFields),
            singleLicenseSpecificFields: Array.from(
                singleLicenseSpecificFields,
            ),
            hasSingleIncompleteAccount,
            incompleteLicenseAccountCount: currentIncompleteLicenseData.length,
            incompleteLicenseAccounts: currentIncompleteLicenseData,
            detailedLicenseCheck: configsWithCurrentLicenses
                .filter((c) => c.licenses?.length > 0)
                .map((c) => ({
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
                        hasEnterprise: !!hasValue(l.enterprise),
                        hasProduct: !!hasValue(l.product),
                        hasService: !!hasValue(l.service),
                        hasLicenseStartDate: !!hasValue(l.licenseStartDate),
                        hasLicenseEndDate: !!hasValue(l.licenseEndDate),
                        hasNumberOfUsers: !!hasValue(l.numberOfUsers),
                        hasValidNoticePeriod:
                            !l.renewalNotice || !!hasValue(l.noticePeriodDays),
                        isComplete: !!(
                            hasValue(l.enterprise) &&
                            hasValue(l.product) &&
                            hasValue(l.service) &&
                            hasValue(l.licenseStartDate) &&
                            hasValue(l.licenseEndDate) &&
                            hasValue(l.numberOfUsers) &&
                            (!l.renewalNotice || hasValue(l.noticePeriodDays))
                        ),
                    })),
                })),
        });

        if (
            temporaryRows.length === 0 &&
            incompleteExistingRows.length === 0 &&
            !hasPendingChanges &&
            !currentHasIncompleteLicenses
        ) {
            showBlueNotification('No unsaved entries to save.', 3000, false);
            return;
        }

        if (incompleteRows.length > 0 || currentHasIncompleteLicenses) {
            const allMissingFields = new Set<string>();
            let totalIncompleteCount = 0;

            // Check main row field issues
            if (incompleteRows.length > 0) {
                incompleteRows.forEach((config) => {
                    if (!hasValue(config.accountName))
                        allMissingFields.add('Account');
                    if (!hasValue(config.masterAccount))
                        allMissingFields.add('Master Account');
                    if (!hasValue(config.cloudType))
                        allMissingFields.add('Cloud Type');
                });
                totalIncompleteCount += incompleteRows.length;
            }

            // Check license field issues using real-time data with specific missing fields
            if (currentHasIncompleteLicenses) {
                if (hasSingleIncompleteAccount) {
                    // Single license subrow - show specific field names
                    singleLicenseSpecificFields.forEach((field) =>
                        allMissingFields.add(field),
                    );
                } else {
                    // Multiple license subrows - use generic message
                    allMissingFields.add('License fields');
                }
                totalIncompleteCount += currentIncompleteLicenseData.length;
            }

            // Create comprehensive validation message
            let message = '';
            if (incompleteRows.length > 0 && currentHasIncompleteLicenses) {
                if (hasSingleIncompleteAccount) {
                    message = `Found ${
                        incompleteRows.length
                    } incomplete record${
                        incompleteRows.length > 1 ? 's' : ''
                    } and incomplete licenses in ${
                        currentIncompleteLicenseData.length
                    } account${
                        currentIncompleteLicenseData.length > 1 ? 's' : ''
                    }.\nMissing required fields: ${Array.from(
                        allMissingFields,
                    ).join(', ')}`;
                } else {
                    message = `Found ${
                        incompleteRows.length
                    } incomplete record${
                        incompleteRows.length > 1 ? 's' : ''
                    } and incomplete licenses in ${
                        currentIncompleteLicenseData.length
                    } account${
                        currentIncompleteLicenseData.length > 1 ? 's' : ''
                    }.\nSome required fields are missing.`;
                }
            } else if (incompleteRows.length > 0) {
                message = `Found ${incompleteRows.length} incomplete record${
                    incompleteRows.length > 1 ? 's' : ''
                }.\nMissing required fields: ${Array.from(
                    allMissingFields,
                ).join(', ')}`;
            } else if (currentHasIncompleteLicenses) {
                if (hasSingleIncompleteAccount) {
                    message = `Found incomplete licenses in ${
                        currentIncompleteLicenseData.length
                    } account${
                        currentIncompleteLicenseData.length > 1 ? 's' : ''
                    }.\nMissing required fields: ${Array.from(
                        allMissingFields,
                    ).join(', ')}`;
                } else {
                    message = `Found incomplete licenses in ${
                        currentIncompleteLicenseData.length
                    } account${
                        currentIncompleteLicenseData.length > 1 ? 's' : ''
                    }.\nSome required fields are missing.`;
                }
            }

            setValidationMessage(message);
            setShowValidationErrors(true); // Enable red border highlighting for validation errors

            console.log('📝 Final validation message and counts:', {
                message,
                incompleteMainRows: incompleteRows.length,
                incompleteLicenseAccounts: currentIncompleteLicenseData.length,
                hasSingleIncompleteAccount,
                totalIncompleteCount,
                allMissingFieldsArray: Array.from(allMissingFields),
            });
            setShowValidationModal(true);
            return;
        }

        // Save all complete temporary rows and handle pending changes
        try {
            let savedCount = 0;
            const completeTemporaryRows = temporaryRows.filter(
                (config: any) => {
                    const hasAccountName = hasValue(config.accountName);
                    const hasMasterAccount = hasValue(config.masterAccount);
                    const hasCloudType = hasValue(config.cloudType);
                    return hasAccountName && hasMasterAccount && hasCloudType;
                },
            );

            // Save temporary rows
            for (const tempRow of completeTemporaryRows) {
                // Find the corresponding row with current license data
                const tempRowWithLicenses =
                    configsWithCurrentLicenses.find(
                        (config) => config.id === tempRow.id,
                    ) || tempRow;
                console.log(
                    `💾 Saving temporary row ${tempRow.id} with current license data:`,
                    tempRowWithLicenses.licenses?.length || 0,
                    'licenses',
                );

                await autoSaveNewAccount(tempRow.id, tempRowWithLicenses);
                savedCount++;
            }

            // IMPORTANT: Clean up phantom modified records before processing
            console.log(
                '🧹 Cleaning up phantom modified records before save...',
            );
            console.log(
                '🔍 Current modifiedExistingRecords:',
                Array.from(modifiedExistingRecordsRef.current),
            );
            console.log(
                '🔍 Current pendingLocalChanges:',
                Object.keys(pendingLocalChanges),
            );
            console.log(
                '🔍 Detailed pendingLocalChanges:',
                pendingLocalChanges,
            );

            // Filter out records that don't actually have pending changes
            const actuallyModifiedRecords = Array.from(
                modifiedExistingRecordsRef.current,
            ).filter((recordId) => {
                const hasPendingChanges =
                    pendingLocalChanges[recordId] &&
                    Object.keys(pendingLocalChanges[recordId]).length > 0;

                // CRITICAL FIX: Also check if this record has license changes
                const currentLicenseState =
                    accountsTableRef.current?.getCurrentLicenseState?.() || {};
                const hasLicenseChanges =
                    currentLicenseState[recordId] &&
                    currentLicenseState[recordId].length > 0;

                // Find the original account to compare license counts
                const originalAccount = configsWithCurrentLicenses.find(
                    (config) => config.id === recordId,
                );
                const originalLicenseCount =
                    originalAccount?.licenses?.length || 0;
                const currentLicenseCount =
                    currentLicenseState[recordId]?.length || 0;
                const hasLicenseCountChanged =
                    currentLicenseCount !== originalLicenseCount;

                console.log(`🔍 Checking record ${recordId}:`, {
                    hasPendingChanges,
                    pendingChanges: pendingLocalChanges[recordId],
                    hasLicenseChanges,
                    hasLicenseCountChanged,
                    originalLicenseCount,
                    currentLicenseCount,
                });

                const shouldKeep =
                    hasPendingChanges ||
                    hasLicenseChanges ||
                    hasLicenseCountChanged;
                if (!shouldKeep) {
                    console.log(
                        `❌ Removing phantom modified record: ${recordId} (no pending changes or license changes)`,
                    );
                } else if (hasLicenseChanges || hasLicenseCountChanged) {
                    console.log(
                        `✅ Keeping record ${recordId} due to license changes`,
                    );
                }
                return shouldKeep;
            });

            // Update the sets to only contain actually modified records
            if (
                actuallyModifiedRecords.length !==
                modifiedExistingRecordsRef.current.size
            ) {
                const cleanedSet = new Set(actuallyModifiedRecords);
                setModifiedExistingRecords(cleanedSet);
                modifiedExistingRecordsRef.current = cleanedSet;
                console.log(
                    '🧹 Cleaned up phantom records, new count:',
                    cleanedSet.size,
                );
            }

            // Re-check hasModifiedExistingRecords after cleanup
            const hasActualModifiedRecords = actuallyModifiedRecords.length > 0;

            // Handle pending changes from modified existing records
            if (hasActiveAutoSave || hasActualModifiedRecords) {
                console.log(
                    '💾 Manual save triggered - processing pending changes immediately',
                    {
                        hasActiveAutoSave,
                        hasActualModifiedRecords,
                        actuallyModifiedRecordsCount:
                            actuallyModifiedRecords.length,
                    },
                );

                // Only proceed if there are actual changes
                if (
                    hasActiveAutoSave ||
                    actuallyModifiedRecords.length > 0 ||
                    Object.keys(pendingLocalChanges).length > 0
                ) {
                    // CRITICAL FIX: Update accountsRef with current license state before calling executeAutoSave
                    console.log(
                        '🔄 Updating accountsRef with current license state before save...',
                    );
                    accountsRef.current = configsWithCurrentLicenses;
                    console.log(
                        '✅ Updated accountsRef with current license data',
                    );

                    // Also update the main accounts state to ensure consistency
                    setAccounts(configsWithCurrentLicenses);
                    console.log(
                        '✅ Updated main accounts state with current license data',
                    );

                    // Trigger the auto-save process immediately instead of waiting for timer
                    const pendingSavedCount = await executeAutoSave();

                    if (pendingSavedCount > 0) {
                        savedCount += pendingSavedCount;
                    }
                } else {
                    console.log('❌ No actual changes found after cleanup');
                }
            }

            if (savedCount > 0) {
                console.log(
                    '🎉 About to show success notification for savedCount:',
                    savedCount,
                );
                console.log('🎉 Breaking down savedCount:', {
                    completeTemporaryRowsCount: completeTemporaryRows.length,
                    actualPendingSavedCount:
                        savedCount - completeTemporaryRows.length,
                });

                // Only show notification if we actually saved something meaningful
                if (
                    completeTemporaryRows.length > 0 ||
                    actuallyModifiedRecords.length > 0
                ) {
                    showBlueNotification(
                        `Successfully saved ${savedCount} entries.`,
                    );
                } else {
                    console.log(
                        '❌ Not showing notification - no actual changes were saved',
                    );
                }

                setShowValidationErrors(false); // Clear validation errors on successful save

                // Clear all unsaved changes state after successful save
                setPendingLocalChanges({});
                setModifiedExistingRecords(new Set());
                setHasUnsavedChanges(false);
                setPreventNavigation(false);

                // Update localStorage with the current state including license data
                await saveAccountsToStorage(configsWithCurrentLicenses);
                console.log(
                    '💾 Updated localStorage with current license data after manual save',
                );

                console.log(
                    '🧹 Cleared all unsaved changes state after successful save',
                );
            } else if (hasPendingChanges) {
                showBlueNotification('Pending changes saved successfully.');
                setShowValidationErrors(false); // Clear validation errors on successful save

                // Clear all unsaved changes state after successful save
                setPendingLocalChanges({});
                setModifiedExistingRecords(new Set());
                setHasUnsavedChanges(false);
                setPreventNavigation(false);

                // Update localStorage with the current state including license data
                await saveAccountsToStorage(configsWithCurrentLicenses);
                console.log(
                    '💾 Updated localStorage with current license data after pending changes save',
                );

                console.log(
                    '🧹 Cleared all unsaved changes state after saving pending changes',
                );
            } else {
                showBlueNotification(
                    'No complete entries to save.',
                    3000,
                    false,
                );
            }
        } catch (error) {
            console.error('Failed to save entries:', error);
            showBlueNotification(
                'Failed to save some entries. Please try again.',
                3000,
                false,
            );
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
            autoSaveTimerActive: !!autoSaveTimerRef.current,
            effectiveAccounts: getEffectiveAccounts().map((acc) => ({
                id: acc.id,
                accountName: acc.accountName,
                masterAccount: acc.masterAccount,
                cloudType: acc.cloudType,
                licensesCount: acc.licenses?.length || 0,
                licensesComplete:
                    acc.licenses?.every((license: any) => {
                        const hasEnterprise = hasValue(license.enterprise);
                        const hasProduct = hasValue(license.product);
                        const hasService = hasValue(license.service);
                        const hasLicenseStartDate = hasValue(
                            license.licenseStartDate,
                        );
                        const hasLicenseEndDate = hasValue(
                            license.licenseEndDate,
                        );
                        const hasNumberOfUsers = hasValue(
                            license.numberOfUsers,
                        );
                        const hasValidNoticePeriod =
                            !license.renewalNotice ||
                            hasValue(license.noticePeriodDays);

                        return (
                            hasEnterprise &&
                            hasProduct &&
                            hasService &&
                            hasLicenseStartDate &&
                            hasLicenseEndDate &&
                            hasNumberOfUsers &&
                            hasValidNoticePeriod
                        );
                    }) || true,
            })),
        });

        if (incomplete.length > 0 || hasChanges) {
            setIncompleteRows(incomplete);
            setPendingNavigation(() => navigationFn);
            setShowNavigationWarning(true);
        } else {
            navigationFn();
        }
    };

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
                const message =
                    incomplete.length > 0
                    ? 'You have incomplete account configurations. Your changes will be lost if you leave.'
                    : 'You have unsaved changes. Your changes will be lost if you leave.';
                e.returnValue = message;
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
                    console.log(
                        '⚡ Executing auto-save due to page visibility change',
                    );
                    // Execute auto-save inline since we can't access the function
                    try {
                        setIsAutoSaving(true);

                        const temporaryRows = accountsRef.current.filter(
                            (config) => {
                                const isTemp = String(config.id).startsWith(
                                    'tmp-',
                                );
                                if (!isTemp) return false;

                                const hasAccountName =
                                    hasValue(config.accountName);
                                const hasMasterAccount =
                                    hasValue(config.masterAccount);
                                const hasCloudType = hasValue(config.cloudType);

                                return (
                                    hasAccountName &&
                                    hasMasterAccount &&
                                    hasCloudType
                                );
                            },
                        );

                        let savedCount = 0;
                        for (const tempRow of temporaryRows) {
                            try {
                                await autoSaveNewAccount(tempRow.id);
                                savedCount++;
                            } catch (error) {
                                console.error(
                                    `❌ Failed to auto-save account ${tempRow.id}:`,
                                    error,
                                );
                            }
                        }

                        if (savedCount > 0) {
                            showBlueNotification(
                                `Auto-saved ${savedCount} entries before leaving page`,
                            );
                            console.log(
                                `✅ Auto-saved ${savedCount} entries on page hide`,
                            );
                        }

                        localStorage.removeItem('enterpriseAutoSave');
                    } catch (error) {
                        console.error(
                            '❌ Auto-save on visibility change failed:',
                            error,
                        );
                    } finally {
                        setIsAutoSaving(false);
                    }
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener(
                'visibilitychange',
                handleVisibilityChange,
            );
        };
    }, [accounts, userConfirmedLeave]);

    // Router navigation guard
    useEffect(() => {
        // Override the router.push method to intercept navigation
        const originalPush = router.push;
        const originalReplace = router.replace;

        router.push = (href: string, options?: any) => {
            if (
                typeof href === 'string' &&
                (hasUnsavedChanges || getIncompleteRows().length > 0) &&
                !userConfirmedLeave
            ) {
                console.log('🚨 Navigation intercepted - push method:', {
                    hasUnsavedChanges,
                    incompleteRows: getIncompleteRows().length,
                    pendingLocalChanges: Object.keys(pendingLocalChanges),
                    modifiedExistingRecords: Array.from(
                        modifiedExistingRecords,
                    ),
                    userConfirmedLeave,
                });
                const incomplete = getIncompleteRows();
                if (incomplete.length > 0 || hasUnsavedChanges) {
                    setIncompleteRows(incomplete);
                    setPendingNavigationUrl(href);
                    setShowNavigationWarning(true);
                    return Promise.resolve(true); // Return resolved promise to prevent error
                }
            }
            return originalPush(href, options);
        };

        router.replace = (href: string, options?: any) => {
            if (
                typeof href === 'string' &&
                (hasUnsavedChanges || getIncompleteRows().length > 0) &&
                !userConfirmedLeave
            ) {
                console.log('🚨 Navigation intercepted - replace method:', {
                    hasUnsavedChanges,
                    incompleteRows: getIncompleteRows().length,
                    pendingLocalChanges: Object.keys(pendingLocalChanges),
                    modifiedExistingRecords: Array.from(
                        modifiedExistingRecords,
                    ),
                    userConfirmedLeave,
                });
                const incomplete = getIncompleteRows();
                if (incomplete.length > 0 || hasUnsavedChanges) {
                    setIncompleteRows(incomplete);
                    setPendingNavigationUrl(href);
                    setShowNavigationWarning(true);
                    return Promise.resolve(true); // Return resolved promise to prevent error
                }
            }
            return originalReplace(href, options);
        };

        // Handle browser history navigation (back/forward buttons)
        const handlePopState = (event: PopStateEvent) => {
            if (
                (hasUnsavedChanges || getIncompleteRows().length > 0) &&
                !userConfirmedLeave
            ) {
                event.preventDefault();
                // Push current state back to prevent navigation
                window.history.pushState(null, '', window.location.href);
                const incomplete = getIncompleteRows();
                setIncompleteRows(incomplete);
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
    }, [router, hasUnsavedChanges, getIncompleteRows, userConfirmedLeave]);

    // Effect to detect AI panel collapse state by observing its width
    useEffect(() => {
        const detectAIPanelState = () => {
            // Look for the AI panel by finding the motion.div with width animations
            const aiPanel = document.querySelector(
                '[class*="w-\\[300px\\]"], [class*="w-16"]',
            ) as HTMLElement;
            if (aiPanel) {
                const computedStyle = window.getComputedStyle(aiPanel);
                const width = parseInt(computedStyle.width);
                const isCollapsed = width <= 80; // 64px + some margin for safety
                setIsAIPanelCollapsed(isCollapsed);
                console.log(
                    '🤖 AI Panel width detected:',
                    width,
                    'Collapsed:',
                    isCollapsed,
                );
            }
        };

        // Create a ResizeObserver to watch for AI panel width changes
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const width = entry.contentRect.width;
                const isCollapsed = width <= 80;
                setIsAIPanelCollapsed(isCollapsed);
                console.log(
                    '🤖 AI Panel resized to:',
                    width,
                    'Collapsed:',
                    isCollapsed,
                );
            }
        });

        // Find and observe the AI panel
        const findAndObserveAIPanel = () => {
            // Look for the AI panel container
            const aiPanelContainer = document.querySelector(
                '.order-1.lg\\:order-2',
            ) as HTMLElement;
            if (aiPanelContainer) {
                const aiPanel = aiPanelContainer.querySelector(
                    'div',
                ) as HTMLElement;
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

    // Load data on component mount
    useEffect(() => {
        let mounted = true; // Prevent state updates if component unmounted

        (async () => {
            try {
                setIsLoading(true);
                console.log('🔄 Loading enterprise linkages...');

                // Clear any existing unsaved changes state on component mount
                console.log(
                    '🧹 Clearing unsaved changes state on component mount',
                );
                setPendingLocalChanges({});
                setModifiedExistingRecords(new Set());
                setHasUnsavedChanges(false);
                setPreventNavigation(false);

                // Also clear the refs
                modifiedExistingRecordsRef.current = new Set();
                console.log('🧹 Cleared all refs and state on mount');

                // Load accounts data from External Admin Portal API
                console.log(
                    '🔄 Loading accounts from External Admin Portal API...',
                );

                const apiBase =
                    process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
                let accountsData = [];

                try {
                    // First, try to fetch from external Admin Portal API
                    console.log(
                        '🌐 Calling external Admin Portal API for accounts...',
                        );
                    const externalAccounts = await fetchExternalAccounts();

                    console.log(
                        '📊 Loaded accounts from External Admin Portal API:',
                        externalAccounts?.length || 0,
                    );
                    console.log(
                        '📊 External API response (first account):',
                        externalAccounts?.[0],
                    );

                    // Deduplicate accounts by ID to handle API returning duplicates
                    const uniqueAccountsMap = new Map();
                    const rawAccounts = externalAccounts || [];

                    for (const account of rawAccounts) {
                        if (!uniqueAccountsMap.has(account.id)) {
                            uniqueAccountsMap.set(account.id, account);
                        } else {
                            console.log(
                                `🔄 Skipping duplicate account: ${account.accountName} (${account.id})`,
                            );
                        }
                    }

                    const uniqueAccounts = Array.from(
                        uniqueAccountsMap.values(),
                    );
                    console.log(
                        `📊 After deduplication: ${rawAccounts.length} → ${uniqueAccounts.length} accounts`,
                    );

                    // Ensure all accounts have required fields
                    // Note: External API mapping already done in fetchExternalAccounts:
                    // - accountName → accountName (displayed as "Account" column)
                    // - accountName → masterAccount (same value per requirement)
                    // - subscriptionTier → cloudType
                    accountsData = uniqueAccounts.map((account: any) => {
                        console.log(
                            `📊 Account ${account.accountName} addresses:`,
                            account.addresses,
                        );
                        console.log(
                            `📊 Account ${account.accountName} technicalUsers:`,
                            account.technicalUsers,
                        );
                        console.log(
                            `🔍 Account ${account.accountName} technicalUsers details:`,
                            {
                                count: (account.technicalUsers || []).length,
                                users: account.technicalUsers || [],
                                allFields: Object.keys(account),
                            },
                        );
                        return {
                            ...account,
                            // masterAccount already mapped from accountName in fetchExternalAccounts
                            masterAccount:
                                account.masterAccount ||
                                account.accountName ||
                                '',
                            // cloudType already mapped from subscriptionTier in fetchExternalAccounts
                            cloudType: account.cloudType || '',
                            country: account.country || '',
                            addresses: account.addresses || [],
                            technicalUsers: account.technicalUsers || [],
                            // Transform license field names from backend to frontend format
                            licenses: (account.licenses || []).map(
                                (license: any) => {
                                    console.log(
                                        `📋 Processing license ${license.id} for account ${account.accountName}`,
                                    );

                                    // Create a stable license identifier based on business properties
                                    // instead of relying on potentially unstable API-generated IDs
                                    const stableLicenseKey = `${account.id}-${
                                        license.enterprise || ''
                                    }-${license.product || ''}-${
                                        license.service || ''
                                    }`;

                                    return {
                                    id: license.id, // Keep original ID for API operations
                                    stableId: stableLicenseKey, // Add stable identifier for localStorage
                                    enterprise: license.enterprise || '',
                                    product: license.product || '',
                                    service: license.service || '',
                                    licenseStartDate:
                                        license.licenseStart ||
                                        license.licenseStartDate ||
                                        '',
                                    licenseEndDate:
                                        license.licenseEnd ||
                                        license.licenseEndDate ||
                                        '',
                                    numberOfUsers:
                                        license.users ||
                                        license.numberOfUsers ||
                                        '',
                                    contactDetails: (() => {
                                        // Handle different contact data structures from API
                                        let contactDetails;

                                        if (license.contactDetails) {
                                            // Direct contactDetails object
                                                contactDetails =
                                                    license.contactDetails;
                                        } else if (license.contacts) {
                                            // contacts might be an array, take first item
                                                if (
                                                    Array.isArray(
                                                        license.contacts,
                                                    ) &&
                                                    license.contacts.length > 0
                                                ) {
                                                    contactDetails =
                                                        license.contacts[0];
                                                } else if (
                                                    typeof license.contacts ===
                                                    'object'
                                                ) {
                                                // contacts is an object
                                                    contactDetails =
                                                        license.contacts;
                                            } else {
                                                contactDetails = {
                                                    id: '',
                                                    name: '',
                                                    email: '',
                                                    phone: '',
                                                    department: '',
                                                    designation: '',
                                                };
                                            }
                                        } else {
                                            // No contact data, create empty structure
                                            contactDetails = {
                                                id: '',
                                                name: '',
                                                email: '',
                                                phone: '',
                                                department: '',
                                                designation: '',
                                            };
                                        }

                                        // Check localStorage for contact data using stable ID
                                        const contactKey = `contact-${stableLicenseKey}`;
                                        try {
                                                const savedContact =
                                                    localStorage.getItem(
                                                        contactKey,
                                                    );
                                            if (savedContact) {
                                                    const parsedContact =
                                                        JSON.parse(
                                                            savedContact,
                                                        );
                                                    console.log(
                                                        `📞 Found saved contact data for stable key ${contactKey}:`,
                                                        parsedContact,
                                                    );
                                                    contactDetails = {
                                                        ...contactDetails,
                                                        ...parsedContact,
                                                    };
                                            }
                                        } catch (error) {
                                                console.warn(
                                                    `⚠️ Error loading saved contact for ${contactKey}:`,
                                                    error,
                                                );
                                        }

                                        // Debug log for contact details
                                            console.log(
                                                `📞 Contact details processing for license ${license.id}:`,
                                                {
                                                    rawContactDetails:
                                                        license.contactDetails,
                                                    rawContacts:
                                                        license.contacts,
                                                    processedContactDetails:
                                                        contactDetails,
                                                    hasContactData: !!(
                                                        contactDetails.name ||
                                                        contactDetails.email
                                                    ),
                                                    stableLicenseKey:
                                                        stableLicenseKey,
                                                },
                                            );

                                        return contactDetails;
                                    })(),
                                    renewalNotice:
                                        license.renewalNotice || false,
                                    noticePeriodDays:
                                        license.noticePeriod?.toString() ||
                                        license.noticePeriodDays ||
                                        '',
                                    };
                                },
                            ),
                        };
                    });
                } catch (error) {
                    console.error(
                        '❌ Error fetching accounts from API:',
                        error,
                    );
                    accountsData = [];
                }

                // Check localStorage for more recent data
                let localStorageAccountsData = [];
                try {
                    const localStorageData =
                        localStorage.getItem('accountsData');
                    if (localStorageData) {
                        const parsedLocalData = JSON.parse(localStorageData);
                        console.log(
                            '📊 Found localStorage accounts:',
                            parsedLocalData?.length || 0,
                        );

                        // Get localStorage data for merging with API data
                        if (parsedLocalData && parsedLocalData.length > 0) {
                            console.log(
                                '📊 Found localStorage data for merging',
                            );

                            // Filter out temporary rows from localStorage - they should not persist across sessions
                            localStorageAccountsData = parsedLocalData.filter(
                                (account: any) => {
                                    const isTemporary = String(
                                        account.id,
                                    ).startsWith('tmp-');
                                if (isTemporary) {
                                        console.log(
                                            '🧹 Filtering out temporary row from localStorage:',
                                            account.id,
                                        );
                                }
                                return !isTemporary;
                                },
                            );

                            console.log('📊 After filtering temp rows:', {
                                originalCount: parsedLocalData.length,
                                filteredCount: localStorageAccountsData.length,
                                removedTempRows:
                                    parsedLocalData.length -
                                    localStorageAccountsData.length,
                            });
                        }
                    }
                } catch (error) {
                    console.error('❌ Error loading from localStorage:', error);
                }

                // Merge API data with localStorage data (API takes priority for license data)
                if (localStorageAccountsData.length > 0) {
                    console.log('📊 Merging API data with localStorage data');
                    const mergedData = [...accountsData];

                    // Update accounts that exist in localStorage with localStorage data
                    localStorageAccountsData.forEach((localAccount: any) => {
                        const apiAccountIndex = mergedData.findIndex(
                            (acc) => acc.id === localAccount.id,
                        );
                        if (apiAccountIndex >= 0) {
                            // Smart merge: use API licenses as primary (to preserve deletions), but merge with localStorage for edits
                            const apiAccount = mergedData[apiAccountIndex];
                            const localLicenses = localAccount.licenses || [];
                            const apiLicenses = apiAccount.licenses || [];

                            console.log(
                                `🔍 Merging licenses for ${localAccount.accountName}:`,
                                {
                                    apiLicenseIds: apiLicenses.map(
                                        (l: any) => l.id,
                                    ),
                                    localLicenseIds: localLicenses.map(
                                        (l: any) => l.id,
                                    ),
                                apiLicensesCount: apiLicenses.length,
                                    localLicensesCount: localLicenses.length,
                                },
                            );

                            // IMPORTANT: Use API licenses as the base to ensure deletions are respected
                            // Only merge in localStorage changes for licenses that still exist in the API
                            const mergedLicenses = apiLicenses.map(
                                (apiLicense: any) => {
                                // Find matching local license using stable identifier first, then fallback to other methods
                                    const matchingLocalLicense =
                                        localLicenses.find(
                                            (localLicense: any) => {
                                    // Try stable ID first (if both have it)
                                                if (
                                                    apiLicense.stableId &&
                                                    localLicense.stableId
                                                ) {
                                                    return (
                                                        apiLicense.stableId ===
                                                        localLicense.stableId
                                                    );
                                    }
                                    // Try to match by API ID
                                                if (
                                                    apiLicense.id ===
                                                    localLicense.id
                                                ) {
                                        return true;
                                    }
                                    // Fallback to content similarity
                                                return (
                                                    apiLicense.enterprise ===
                                                        localLicense.enterprise &&
                                                    apiLicense.product ===
                                                        localLicense.product &&
                                                    apiLicense.service ===
                                                        localLicense.service
                                                );
                                            },
                                        );

                                if (matchingLocalLicense) {
                                    // Merge localStorage edits into API data (but preserve API structure)
                                    return {
                                        ...apiLicense, // API data as base
                                        // Only merge specific fields that might have been edited locally
                                            enterprise:
                                                matchingLocalLicense.enterprise ||
                                                apiLicense.enterprise,
                                            product:
                                                matchingLocalLicense.product ||
                                                apiLicense.product,
                                            service:
                                                matchingLocalLicense.service ||
                                                apiLicense.service,
                                            licenseStartDate:
                                                matchingLocalLicense.licenseStartDate ||
                                                apiLicense.licenseStartDate ||
                                                apiLicense.licenseStart,
                                            licenseEndDate:
                                                matchingLocalLicense.licenseEndDate ||
                                                apiLicense.licenseEndDate ||
                                                apiLicense.licenseEnd,
                                            numberOfUsers:
                                                matchingLocalLicense.numberOfUsers ||
                                                apiLicense.numberOfUsers ||
                                                apiLicense.users,
                                            renewalNotice:
                                                matchingLocalLicense.renewalNotice !==
                                                undefined
                                                    ? matchingLocalLicense.renewalNotice
                                                    : apiLicense.renewalNotice,
                                            noticePeriodDays:
                                                matchingLocalLicense.noticePeriodDays ||
                                                apiLicense.noticePeriodDays ||
                                                apiLicense.noticePeriod,
                                        // Handle contact details with preference for API data (database) as source of truth
                                        contactDetails: (() => {
                                                const apiContactDetails =
                                                    apiLicense.contactDetails ||
                                                    (Array.isArray(
                                                        apiLicense.contacts,
                                                    ) &&
                                                    apiLicense.contacts.length >
                                                        0
                                                        ? apiLicense.contacts[0]
                                                        : apiLicense.contacts);

                                            // Always prefer API data if it has meaningful contact information
                                                if (
                                                    apiContactDetails &&
                                                    (apiContactDetails.name ||
                                                        apiContactDetails.email)
                                                ) {
                                                    console.log(
                                                        `📞 Using API contact data for license ${apiLicense.id} (database source of truth):`,
                                                        apiContactDetails,
                                                    );
                                                return apiContactDetails;
                                            }

                                            // Only use stable localStorage as fallback when API has no meaningful contact data
                                            if (apiLicense.stableId) {
                                                const stableKey = `contact-${apiLicense.stableId}`;
                                                    const savedContactData =
                                                        localStorage.getItem(
                                                            stableKey,
                                                        );

                                                if (savedContactData) {
                                                    try {
                                                            const parsedContactData =
                                                                JSON.parse(
                                                                    savedContactData,
                                                                );
                                                            console.log(
                                                                `📞 Using stable localStorage contact data as fallback for license ${apiLicense.id} (key: ${stableKey}):`,
                                                                parsedContactData,
                                                            );
                                                        return parsedContactData;
                                                    } catch (error) {
                                                            console.error(
                                                                `❌ Error parsing stable contact data for ${stableKey}:`,
                                                                error,
                                                            );
                                                    }
                                                }
                                            }

                                            // Legacy localStorage fallback
                                                const localContactDetails =
                                                    matchingLocalLicense?.contactDetails;
                                                if (
                                                    localContactDetails &&
                                                    (localContactDetails.name ||
                                                        localContactDetails.email)
                                                ) {
                                                    console.log(
                                                        `📞 Using legacy localStorage contact data as fallback for license ${apiLicense.id}:`,
                                                        localContactDetails,
                                                    );
                                                return localContactDetails;
                                            }

                                            // Return empty contact structure if no data available
                                                if (
                                                    apiContactDetails &&
                                                    (apiContactDetails.name ||
                                                        apiContactDetails.email)
                                                ) {
                                                    console.log(
                                                        `📞 Using API contact data for license ${apiLicense.id}:`,
                                                        apiContactDetails,
                                                    );
                                                return apiContactDetails;
                                            }

                                            // Default empty structure
                                            return {
                                                id: '',
                                                name: '',
                                                email: '',
                                                phone: '',
                                                department: '',
                                                designation: '',
                                            };
                                            })(),
                                    };
                                }

                                // No localStorage counterpart - use API data as-is
                                return apiLicense;
                                },
                            );

                            console.log(
                                `📊 License merge for ${localAccount.accountName}: API(${apiLicenses.length}) → Merged(${mergedLicenses.length})`,
                            );
                            console.log(
                                `🔍 Merged license IDs:`,
                                mergedLicenses.map((l: any) => l.id),
                            );

                            // Check for duplicate IDs in merged licenses
                            const mergedLicenseIds = mergedLicenses.map(
                                (l: any) => l.id,
                            );
                            const uniqueMergedIds = Array.from(
                                new Set(mergedLicenseIds),
                            );
                            if (
                                mergedLicenseIds.length !==
                                uniqueMergedIds.length
                            ) {
                                console.error(
                                    `❌ Duplicate license IDs after merge for ${localAccount.accountName}:`,
                                    {
                                    total: mergedLicenseIds.length,
                                    unique: uniqueMergedIds.length,
                                        duplicates: mergedLicenseIds.filter(
                                            (id: any, index: number) =>
                                                mergedLicenseIds.indexOf(id) !==
                                                index,
                                        ),
                                    },
                                );
                            }

                            mergedData[apiAccountIndex] = {
                                ...mergedData[apiAccountIndex], // API data as base
                                ...localAccount, // localStorage data for account-level fields
                                licenses: mergedLicenses, // Use API-primary merged licenses
                                // Ensure critical fields from API are preserved
                                createdAt:
                                    mergedData[apiAccountIndex].createdAt ||
                                    localAccount.createdAt,
                                updatedAt:
                                    localAccount.updatedAt ||
                                    mergedData[apiAccountIndex].updatedAt,
                            };
                            console.log(
                                `📊 Merged localStorage data for account: ${localAccount.accountName}`,
                            );
                        } else {
                            // Account exists in localStorage but not in API - this means it was deleted from database
                            // Do NOT re-add it to prevent deleted accounts from reappearing
                            console.log(
                                `🗑️ Account "${localAccount.accountName}" exists in localStorage but not in API - it was likely deleted. Not re-adding.`,
                            );
                        }
                    });

                    // Clean up localStorage by removing accounts that no longer exist in the database
                    const accountsToRemoveFromLocalStorage =
                        localStorageAccountsData
                            .filter(
                                (localAccount: any) =>
                                    !mergedData.find(
                                        (acc) => acc.id === localAccount.id,
                                    ),
                            )
                        .map((localAccount: any) => localAccount.id);

                    if (accountsToRemoveFromLocalStorage.length > 0) {
                        console.log(
                            `🧹 Cleaning up ${accountsToRemoveFromLocalStorage.length} deleted accounts from localStorage`,
                        );
                        const cleanedLocalStorageData =
                            localStorageAccountsData.filter(
                                (localAccount: any) =>
                                    !accountsToRemoveFromLocalStorage.includes(
                                        localAccount.id,
                                    ),
                        );

                        // Update localStorage with cleaned data
                        try {
                            localStorage.setItem(
                                'accountsData',
                                JSON.stringify(cleanedLocalStorageData),
                            );
                            console.log(
                                `✅ Updated localStorage: removed ${accountsToRemoveFromLocalStorage.length} deleted accounts`,
                            );
                        } catch (error) {
                            console.error(
                                '❌ Error updating localStorage during cleanup:',
                                error,
                            );
                        }
                    }

                    accountsData = mergedData;
                    console.log('📊 Using merged data (API + localStorage)');
                }

                // Only update state if component is still mounted
                if (!mounted) {
                    console.log(
                        '⚠️ Component unmounted during data load, skipping state update',
                    );
                    return;
                }

                console.log('📊 Loaded accounts:', accountsData?.length || 0);

                if (!accountsData || accountsData.length === 0) {
                    console.log('ℹ️ No accounts found');
                    setAccounts([]);
                    setIsLoading(false);
                    return;
                }

                // Fetch technical users for each account from /api/users endpoint
                // This ensures technical users are always up-to-date from the API
                // Skip fetching if localStorage has recent technical user data
                console.log('🔄 Fetching technical users for all accounts...');
                console.log(
                    `📊 Processing ${accountsData.length} unique accounts for technical users`,
                );
                const accountsWithTechnicalUsers: any[] = [];
                let skipCount = 0;
                let fetchCount = 0;

                for (let i = 0; i < accountsData.length; i++) {
                    const account = accountsData[i];

                    // Check if localStorage already has technical users for this account
                    const localStorageData = localStorageAccountsData.find(
                        (localAccount: any) => localAccount.id === account.id,
                    );

                    if (
                        localStorageData &&
                        localStorageData.technicalUsers &&
                        localStorageData.technicalUsers.length > 0
                    ) {
                        console.log(
                            `👤 Using localStorage technical users for ${account.accountName} (${localStorageData.technicalUsers.length} users)`,
                        );
                        accountsWithTechnicalUsers.push({
                            ...account,
                            technicalUsers: localStorageData.technicalUsers,
                        });
                        skipCount++;
                        continue;
                    }

                    try {
                        fetchCount++;
                        console.log(
                            `👤 Fetching technical users for account: ${account.accountName} (${account.id})`,
                        );
                        const techUsersResponse = await fetch(
                            `${apiBase}/api/users?accountId=${
                                account.id
                            }&accountName=${encodeURIComponent(
                                account.accountName,
                            )}`,
                        );

                        let technicalUsers: any[] = [];
                        if (techUsersResponse.ok) {
                            const allUsers = await techUsersResponse.json();
                            technicalUsers = allUsers.filter(
                                (u: any) => u.technicalUser === true,
                            );
                            console.log(
                                `👤 Found ${technicalUsers.length} technical users for ${account.accountName}`,
                            );
                        } else {
                            console.warn(
                                `⚠️ Technical users API response not OK for ${account.accountName}:`,
                                techUsersResponse.status,
                            );
                        }

                        // Merge technical users from API with account data
                        // If account has localStorage technical users, prioritize API data for consistency
                        accountsWithTechnicalUsers.push({
                            ...account,
                            technicalUsers, // Always use API data for technical users
                        });
                    } catch (error) {
                        console.warn(
                            `⚠️ Could not fetch technical users for account ${account.accountName}:`,
                            error,
                        );
                        // If API fails, fall back to localStorage technical users if available
                        accountsWithTechnicalUsers.push({
                            ...account,
                            technicalUsers: account.technicalUsers || [],
                        });
                    }

                    // Add a small delay between requests to avoid rate limiting
                    if (i < accountsData.length - 1) {
                        await new Promise((resolve) =>
                            setTimeout(resolve, 100),
                        );
                    }
                }

                console.log(
                    `📊 Technical user fetching summary: skipped ${skipCount}, fetched ${fetchCount}, total ${accountsData.length}`,
                );

                // Transform account data to AccountRow format
                const transformedAccounts = accountsWithTechnicalUsers
                    .map((account: any, index: number) => {
                        const addressData =
                            account.addresses && account.addresses.length > 0
                                ? account.addresses[0]
                                : null;

                        // Construct formatted address string from addressData if not provided
                        let formattedAddress = account.address || '';
                        if (!formattedAddress && addressData) {
                            formattedAddress = `${
                                addressData.addressLine1 || ''
                            }, ${addressData.city || ''}, ${
                                addressData.state || ''
                            } ${addressData.zipCode || ''}`
                                .trim()
                                .replace(/,\s*,/g, ',')
                                .replace(/,\s*$/, '')
                                .replace(/^\s*,\s*/, '');
                        }

                        console.log(
                            `📊 Transformed account ${account.accountName}:`,
                            {
                                addressData,
                                formattedAddress,
                                technicalUsersCount:
                                    account.technicalUsers?.length || 0,
                            },
                        );
                        return {
                            id: account.id,
                            accountName: account.accountName || '',
                            masterAccount: account.masterAccount || '',
                            cloudType: account.cloudType || '',
                            address: formattedAddress,
                            country: account.country || '',
                            email: account.email || '',
                            phone: account.phone || '',
                            addresses: account.addresses || [],
                            addressData: addressData,
                            licenses: account.licenses || [],
                            technicalUsers: account.technicalUsers || [],
                            technicalUsername: account.technicalUsername || '',
                            technicalUserId: account.technicalUserId || '',
                            // Store creation time and display order for stable sorting
                            createdAt: account.createdAt,
                            updatedAt: account.updatedAt,
                            displayOrder: index, // Preserve original order
                        };
                    })
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

                console.log(
                    '📊 Applied stable sorting by creation time and display order to maintain row order',
                );
                console.log(
                    '📊 Initialized client-side display order tracking:',
                    Object.fromEntries(displayOrderRef.current),
                );

                // Apply final stable sort by display order
                const finalSortedConfigs =
                    sortConfigsByDisplayOrder(transformedAccounts);

                // Only set initial state if no configs exist yet (to prevent overwriting user changes)
                setAccounts((prevConfigs) => {
                    // If user has already added temporary rows, preserve them
                    const hasTemporaryRows = prevConfigs.some((config) =>
                        String(config.id).startsWith('tmp-'),
                    );
                    if (hasTemporaryRows) {
                        console.log(
                            '⚠️ Preserving temporary rows, not overwriting with API data',
                        );
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
    }, []); // Empty dependency array - only run once on mount

    // Force table re-render when accounts data changes
    useEffect(() => {
        // Data change effect - update logic as needed

        // Update dropdown options when accounts change
        if (accounts.length > 0) {
            loadDropdownOptions();
        }
    }, [accounts]);

    // Ref for AccountsTable to access its methods
    const accountsTableRef = useRef<any>(null);

    // Expand all rows function
    const expandAllRows = () => {
        if (accountsTableRef.current) {
            accountsTableRef.current.expandAllRows();
        }
    };

    // Collapse all rows function
    const collapseAllRows = () => {
        if (accountsTableRef.current) {
            accountsTableRef.current.collapseAllRows();
        }
    };

    // Function to delete license from the table
    const deleteLicenseFromTable = async (licenseId: string) => {
        console.log('🗑️ Deleting license from all accounts:', licenseId);

        let accountIdToUpdate: string | null = null;

        // Find which account contains this license
        const targetAccount = accounts.find(
            (account) =>
                account.licenses &&
                account.licenses.some(
                    (license: any) => license.id === licenseId,
                ),
        );

        if (!targetAccount) {
            console.error(`❌ License ${licenseId} not found in any account`);
            throw new Error(`License ${licenseId} not found in any account`);
        }

        accountIdToUpdate = targetAccount.id;
        console.log(
            `🎯 Found license ${licenseId} in account ${accountIdToUpdate}`,
        );
        console.log(
            `📊 Account ${targetAccount.accountName} has ${targetAccount.licenses.length} licenses before deletion`,
        );

        // Delete from database first
        try {
            const apiBase =
                process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

            // Get the updated account data with license removed
            const updatedLicenses = targetAccount.licenses.filter(
                (license: any) => license.id !== licenseId,
            );
            console.log(
                `📊 After filtering: ${updatedLicenses.length} licenses remaining`,
            );

            // Transform licenses to backend format
            const transformedLicenses = updatedLicenses.map((license: any) => ({
                id: license.id,
                enterprise: license.enterprise || '',
                product: license.product || '',
                service: license.service || '',
                licenseStart:
                    license.licenseStartDate || license.licenseStart || '',
                licenseEnd: license.licenseEndDate || license.licenseEnd || '',
                users: license.numberOfUsers || license.users || '',
                renewalNotice: license.renewalNotice || false,
                noticePeriod: parseInt(
                    license.noticePeriodDays || license.noticePeriod || '0',
                    10,
                ),
                contacts: license.contactDetails || license.contacts || [],
            }));

            console.log(
                `🔄 Making API call to update account ${targetAccount.id}...`,
            );
            const response = await fetch(`${apiBase}/api/accounts`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: targetAccount.id,
                    accountName: targetAccount.accountName || '',
                    masterAccount: targetAccount.masterAccount || '',
                    cloudType: targetAccount.cloudType || '',
                    address: targetAccount.address || '',
                    country: targetAccount.country || '',
                    addresses: targetAccount.addresses || [],
                    licenses: transformedLicenses, // Updated licenses without the deleted one
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ API response error:`, {
                    status: response.status,
                    statusText: response.statusText,
                    errorText,
                });
                throw new Error(
                    `Failed to delete license from database: ${response.statusText} - ${errorText}`,
                );
            }

            const responseData = await response.json();
            console.log(
                `✅ License ${licenseId} deleted from database via API:`,
                responseData,
            );
        } catch (error) {
            console.error('❌ Error deleting license from database:', error);
            throw new Error(
                `Failed to delete license from database: ${
                    error instanceof Error ? error.message : String(error)
                }`,
            );
        }

        // Update local state after successful database deletion
        setAccounts((prevAccounts) => {
            const updatedAccounts = prevAccounts.map((account) => {
                if (account.licenses && account.licenses.length > 0) {
                    // Remove the license from this account if it exists
                    const updatedLicenses = account.licenses.filter(
                        (license: any) => license.id !== licenseId,
                    );
                    if (updatedLicenses.length !== account.licenses.length) {
                        console.log(
                            `🗑️ Removing license ${licenseId} from account ${account.id} (local state)`,
                        );
                        return {...account, licenses: updatedLicenses};
                    }
                }
                return account;
            });

            // Update localStorage with the modified accounts immediately
            try {
                const filteredAccounts = updatedAccounts.filter(
                    (account: any) => {
                        const isTemporary = String(account.id).startsWith(
                            'tmp-',
                        );
                    return !isTemporary;
                    },
                );

                localStorage.setItem(
                    'accountsData',
                    JSON.stringify(filteredAccounts),
                );
                console.log(
                    `✅ License ${licenseId} deleted from accounts and localStorage (${filteredAccounts.length} accounts saved)`,
                );
            } catch (error) {
                console.error(
                    '❌ Error updating localStorage after license deletion:',
                    error,
                );
            }

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
                await new Promise((resolve) => setTimeout(resolve, 1000));

                // Find the account to be deleted for debugging
                const accountToDelete = accounts.find(
                    (acc) => acc.id === pendingDeleteRowId,
                );
                console.log('📄 Account data to delete:', accountToDelete);

                // Delete via API - use offboard endpoint for infrastructure deprovisioning
                let apiBase =
                    process.env.NEXT_PUBLIC_API_BASE_URL ||
                    process.env.NEXT_PUBLIC_API_BASE ||
                    'http://localhost:4000';
                // Clean up base URL to construct proper endpoint
                if (apiBase.endsWith('/api/v1')) {
                    apiBase = apiBase.slice(0, -7);
                } else if (apiBase.endsWith('/api')) {
                    apiBase = apiBase.slice(0, -4);
                }
                // Use offboard endpoint to trigger infrastructure deprovisioning
                // Construct the correct URL: /api/v1/app/api/accounts/offboard?accountId={id}
                const offboardUrl = `${apiBase}/api/v1/app/api/accounts/offboard?accountId=${pendingDeleteRowId}`;
                console.log('🗑️ Offboard URL:', offboardUrl);

                try {
                    const token = localStorage.getItem('systiva_auth_token');
                    const response = await fetch(offboardUrl, {
                            method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(token
                                ? {Authorization: `Bearer ${token}`}
                                : {}),
                        },
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error(
                            '❌ Offboard failed:',
                            response.status,
                            errorText,
                        );
                        throw new Error(
                            `Failed to offboard account: ${response.status}`,
                        );
                    }

                    const offboardResult = await response.json().catch(() => ({}));
                    console.log('✅ Account offboarded via API:', offboardResult);
                } catch (error) {
                    console.error('Error offboarding account via API:', error);
                    throw new Error('Failed to offboard account');
                }

                // Remove from local state
                setAccounts((prev) => {
                    const updated = prev.filter(
                        (config) => config.id !== pendingDeleteRowId,
                    );
                    // Apply stable sorting to maintain display order
                    const sortedUpdated = sortConfigsByDisplayOrder(updated);

                    // Update localStorage to persist the deletion
                    saveAccountsToStorage(sortedUpdated);

                    return sortedUpdated;
                });

                console.log('✅ Account deleted successfully');
            } else if (deleteType === 'license') {
                console.log('🗑️ Deleting license:', pendingDeleteLicenseId);

                // Find the row that contains this license and delete it
                if (pendingDeleteLicenseId) {
                    // Add a small delay to show the loading state
                    await new Promise((resolve) => setTimeout(resolve, 1200));

                    try {
                        // Delete license from database and local state
                        await deleteLicenseFromTable(pendingDeleteLicenseId);

                        // Call the completion function directly via ref for UI cleanup
                        if (
                            accountsTableRef.current &&
                            accountsTableRef.current.completeLicenseDeletion
                        ) {
                            accountsTableRef.current.completeLicenseDeletion();
                        }

                        console.log('✅ License deletion confirmed');
                    } catch (error) {
                        console.error('Error deleting license:', error);
                        throw new Error(
                            'Failed to delete license from database',
                        );
                    }
                }
            }

            // Show success notification
            const deletedItemName =
                deleteType === 'account' ? 'account' : 'license';
            showBlueNotification(`Successfully deleted 1 ${deletedItemName}.`);

            // Clear all unsaved changes state after successful deletion
            setPendingLocalChanges({});
            setModifiedExistingRecords(new Set());
            setHasUnsavedChanges(false);
            setPreventNavigation(false);
            console.log(
                '🧹 Cleared all unsaved changes state after successful deletion',
            );

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
                storageType: 'localStorage',
            });

            // Log the specific error message if available
            if (error instanceof Error) {
                console.error('❌ Error message:', error.message);
            }

            // Show error notification using the blue notification system
            showBlueNotification(
                `Failed to delete the ${deleteType}. Please try again.`,
                5000, // Show for 5 seconds for error messages
            );
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
                false, // No checkmark for error message
            );
            return;
        }

        // Check for incomplete licenses
        if (hasIncompleteLicenses) {
            setValidationMessage(
                'Please complete all license fields before adding a new row.',
            );
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
        const newAccount = {
            id: newId,
            accountName: '',
            masterAccount: '',
            cloudType: '',
            country: '',
            email: '',
            phone: '',
            address: '',
            addresses: [],
            licenses: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        } as any;

        setAccounts((prev) => {
            const updated = [...prev, newAccount];
            // Apply stable sorting to maintain display order
            const sorted = sortConfigsByDisplayOrder(updated);
            // Also save to localStorage
            saveAccountsToStorage(sorted);
            return sorted;
        });

        // Clear validation errors when adding a new row to ensure new rows start with normal styling
        if (showValidationErrors) {
            setShowValidationErrors(false);
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

    // Address modal functions
    const handleOpenAddressModal = (row: AccountRow) => {
        console.log('📍 Opening address modal for row:', {
            id: row.id,
            accountName: row.accountName,
            addressData: (row as any).addressData,
            addresses: (row as any).addresses,
        });

        // Get the most current data from accounts state instead of using potentially stale row data
        const currentAccount = accounts.find((acc) => acc.id === row.id);
        console.log('📍 Current account data from state:', {
            id: currentAccount?.id,
            accountName: currentAccount?.accountName,
            addressData: currentAccount?.addressData,
            addresses: currentAccount?.addresses,
        });

        setSelectedAccountForAddress({
            id: row.id,
            accountName: currentAccount?.accountName || row.accountName || '',
            masterAccount:
                currentAccount?.masterAccount || row.masterAccount || '',
            address: currentAccount?.address || row.address || '',
            addressData:
                currentAccount?.addressData || (row as any).addressData,
            addresses: currentAccount?.addresses || (row as any).addresses,
        } as any);

        // Debug: Log what we're setting as selectedAccountForAddress
        console.log('📍 Setting selectedAccountForAddress with:', {
            id: row.id,
            addresses: currentAccount?.addresses || (row as any).addresses,
            addressData:
                currentAccount?.addressData || (row as any).addressData,
        });
        setIsAddressModalOpen(true);
    };

    const handleCloseAddressModal = () => {
        setIsAddressModalOpen(false);
        setSelectedAccountForAddress(null);

        // 🔄 Force table re-render to ensure address icons update immediately
        console.log('🔄 Forcing table re-render after modal close');
        setAccounts((prevAccounts) => [...prevAccounts]);
    };

    const handleSaveAddresses = async (addresses: any[]) => {
        if (!selectedAccountForAddress) return;

        const accountId = selectedAccountForAddress.id;
        const addressData = addresses.length > 0 ? addresses[0] : null;

        console.log(
            '💾 Saving addresses for account:',
            accountId,
            'Addresses:',
            addresses,
        );

        // Format address string
        const formattedAddressString =
            addresses.length > 0
                ? `${addresses[0].addressLine1 || ''}, ${
                      addresses[0].city || ''
                  }, ${addresses[0].state || ''} ${addresses[0].zipCode || ''}`
                      .trim()
                      .replace(/,\s*,/g, ',')
                      .replace(/,\s*$/, '')
                      .replace(/^\s*,\s*/, '')
            : '';

        // Update local state
        setAccounts((prev) => {
            const updated = prev.map((account) =>
                account.id === accountId
                    ? {
                          ...account,
                          addresses: addresses,
                          address: formattedAddressString,
                          addressData:
                              addresses.length > 0 ? addresses[0] : null,
                          updatedAt: new Date().toISOString(),
                      }
                    : account,
            );
            const sorted = sortConfigsByDisplayOrder(updated);
            saveAccountsToStorage(sorted);
            return sorted;
        });

        handleCloseAddressModal();
    };

    const handleSaveIndividualAddress = async (addresses: any[]) => {
        if (!selectedAccountForAddress) return;

        const accountId = selectedAccountForAddress.id;
        const addressData = addresses.length > 0 ? addresses[0] : null;

        console.log(
            '💾 Saving individual address for account:',
            accountId,
            'Addresses:',
            addresses,
        );

        // Format address string - use primary address if available, otherwise first address
        const primaryAddress =
            addresses.find((addr) => addr.isPrimary) || addresses[0];
        const formattedAddressString = primaryAddress
            ? `${primaryAddress.addressLine1 || ''}, ${
                  primaryAddress.city || ''
              }, ${primaryAddress.state || ''} ${primaryAddress.zipCode || ''}`
                  .trim()
                  .replace(/,\s*,/g, ',')
                  .replace(/,\s*$/, '')
                  .replace(/^\s*,\s*/, '')
            : '';

        console.log('📍 Individual save - Address formatting:', {
            addressesLength: addresses.length,
            primaryAddress: primaryAddress,
            formattedAddressString: formattedAddressString,
        });

        try {
            // Save to backend API first
            const apiBase =
                process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

            // Get the current account data to preserve other fields
            const currentAccount = accounts.find((acc) => acc.id === accountId);
            if (!currentAccount) {
                console.error(
                    '❌ Current account not found for individual save',
                );
                return;
            }

            const response = await fetch(`${apiBase}/api/accounts`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: accountId,
                    accountName: currentAccount.accountName || '',
                    masterAccount: currentAccount.masterAccount || '',
                    cloudType: currentAccount.cloudType || '',
                    address: formattedAddressString,
                    country: currentAccount.country || '',
                    addresses: addresses,
                    licenses: currentAccount.licenses || [],
                }),
            });

            if (!response.ok) {
                throw new Error(
                    `Failed to save address to API: ${response.statusText}`,
                );
            }

            console.log('✅ Individual address saved to API successfully');
        } catch (error) {
            console.error('❌ Error saving individual address to API:', error);
            // Continue with local save even if API fails
        }

        // Update local state (same logic as handleSaveAddresses but without closing modal)
        setAccounts((prev) => {
            const updated = prev.map((account) =>
                account.id === accountId
                    ? {
                          ...account,
                          addresses: addresses,
                          address:
                              formattedAddressString ||
                              (primaryAddress?.addressLine1
                                  ? 'Address Configured'
                                  : ''),
                          addressData: primaryAddress || null,
                          updatedAt: new Date().toISOString(),
                      }
                    : account,
            );
            const sorted = sortConfigsByDisplayOrder(updated);
            saveAccountsToStorage(sorted);

            // Debug: Log the updated account data
            const updatedAccount = updated.find((acc) => acc.id === accountId);
            console.log('📍 Individual save - Updated account in state:', {
                id: updatedAccount?.id,
                addresses: updatedAccount?.addresses,
                addressData: updatedAccount?.addressData,
                address: updatedAccount?.address,
                formattedAddressString: formattedAddressString,
            });

            return sorted;
        });

        // CRITICAL: Update selectedAccountForAddress to reflect the new address data
        // This ensures the modal displays the saved addresses correctly
        setSelectedAccountForAddress((prev) => {
            if (!prev) return prev;

            const updatedSelected = {
                ...prev,
                addresses: addresses,
                address:
                    formattedAddressString ||
                    (primaryAddress?.addressLine1 ? 'Address Configured' : ''),
                addressData: primaryAddress || null,
            };

            console.log(
                '📍 Individual save - Updated selectedAccountForAddress:',
                {
                id: updatedSelected.id,
                addresses: updatedSelected.addresses,
                addressData: updatedSelected.addressData,
                    address: updatedSelected.address,
                },
            );

            return updatedSelected;
        });

        // Force table re-render by incrementing refresh key
        // This ensures the table component re-renders with updated address data
        setTableRefreshKey((prev) => prev + 1);

        // Note: Do NOT call handleCloseAddressModal() here - keep modal open
    };

    // Technical User modal functions
    const handleOpenTechnicalUserModal = (row: AccountRow) => {
        console.log('👤 Opening technical user modal for row:', {
            id: row.id,
            accountName: row.accountName,
            technicalUsers: (row as any).technicalUsers,
            technicalUsername: (row as any).technicalUsername,
            technicalUserId: (row as any).technicalUserId,
            allKeys: Object.keys(row),
        });

        // Get the most current data from accounts state instead of using potentially stale row data
        const currentAccount = accounts.find((acc) => acc.id === row.id);
        console.log('👤 Current account data from state:', {
            id: currentAccount?.id,
            accountName: currentAccount?.accountName,
            technicalUsers: currentAccount?.technicalUsers,
        });

        setSelectedAccountForTechnicalUser({
            id: row.id,
            accountName: row.accountName || '',
            masterAccount: row.masterAccount || '',
            technicalUsers:
                currentAccount?.technicalUsers ||
                (row as any).technicalUsers ||
                [],
        });
        setIsTechnicalUserModalOpen(true);
    };

    const handleCloseTechnicalUserModal = () => {
        setIsTechnicalUserModalOpen(false);
        setSelectedAccountForTechnicalUser(null);

        // 🔄 Force table re-render to ensure technical user icons update immediately
        console.log(
            '🔄 Forcing table re-render after technical user modal close',
        );
        setAccounts((prevAccounts) => [...prevAccounts]);
    };

    const handleSaveTechnicalUsers = async (users: TechnicalUser[]) => {
        if (!selectedAccountForTechnicalUser) return;

        console.log(
            '💾 Saving technical users for account:',
            selectedAccountForTechnicalUser.id,
            'Users:',
            users,
        );

        try {
            // Skip API call for temporary accounts (not yet in database)
            if (!selectedAccountForTechnicalUser.id.startsWith('tmp-')) {
                // Save to backend API first
                const apiBase =
                    process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

                // Get the current account data to preserve other fields
                const currentAccount = accounts.find(
                    (acc) => acc.id === selectedAccountForTechnicalUser.id,
                );
                if (!currentAccount) {
                    console.error(
                        '❌ Current account not found for technical user save',
                    );
                    return;
                }

                const requestData = {
                    id: selectedAccountForTechnicalUser.id,
                    accountName: currentAccount.accountName || '',
                    masterAccount: currentAccount.masterAccount || '',
                    cloudType: currentAccount.cloudType || '',
                    address: currentAccount.address || '',
                    country: currentAccount.country || '',
                    addresses: currentAccount.addresses || [],
                    licenses: currentAccount.licenses || [],
                    technicalUsers: users,
                };

                console.log('🔍 Bulk Technical User API Request Data:', {
                    url: `${apiBase}/api/accounts`,
                    method: 'PUT',
                    data: requestData,
                    technicalUsers: users,
                    userCount: users.length,
                });

                const response = await fetch(`${apiBase}/api/accounts`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestData),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('❌ API Error Response:', {
                        status: response.status,
                        statusText: response.statusText,
                        errorText: errorText,
                    });
                    throw new Error(
                        `Failed to save technical users to API: ${response.statusText} - ${errorText}`,
                    );
                }

                const responseData = await response.json();
                console.log('✅ Technical users saved to API successfully', {
                    response: responseData,
                    technicalUsersInResponse:
                        responseData?.technicalUsers || 'Not present',
                    willRefetchFromUsersAPI:
                        'Technical users will be refreshed from /api/users on next page load',
                });
            } else {
                console.log(
                    '⏭️ Skipping API save for temporary account:',
                    selectedAccountForTechnicalUser.id,
                );
            }
        } catch (error) {
            console.error('❌ Error saving technical users to API:', error);
            // Continue with local save even if API fails
        }

        // Update local state
        setAccounts((prev) => {
            const updated = prev.map((account) =>
                account.id === selectedAccountForTechnicalUser.id
                    ? {
                          ...account,
                          technicalUsers: users,
                          updatedAt: new Date().toISOString(),
                      }
                    : account,
            );
            const sorted = sortConfigsByDisplayOrder(updated);
            saveAccountsToStorage(sorted);
            return sorted;
        });

        // Force table refresh for blue dot visibility
        setTableRefreshKey((prev) => prev + 1);

        handleCloseTechnicalUserModal();
    };

    const handleSaveIndividualTechnicalUser = async (
        users: TechnicalUser[],
    ) => {
        if (!selectedAccountForTechnicalUser) return;

        console.log(
            '💾 Saving individual technical user for account:',
            selectedAccountForTechnicalUser.id,
            'Users:',
            users,
        );

        // Helper function to check if a user should be inactive based on end date
        const shouldBeInactive = (
            endDate: string | null | undefined,
        ): boolean => {
            if (!endDate) return false;
            const currentDate = new Date();
            const userEndDate = new Date(endDate);
            return userEndDate < currentDate;
        };

        // Validate and update user status based on end date before saving
        const validatedUsers = users.map((user) => {
            if (shouldBeInactive(user.endDate) && user.status === true) {
                console.log(
                    `🔄 Auto-setting user ${user.firstName} ${user.lastName} to Inactive due to expired end date: ${user.endDate}`,
                );
                return {
                    ...user,
                    status: false, // false = Inactive
                };
            }
            return user;
        });

        try {
            // Skip API call for temporary accounts (not yet in database)
            if (!selectedAccountForTechnicalUser.id.startsWith('tmp-')) {
                // Save to backend API first
                const apiBase =
                    process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

                // Get the current account data to preserve other fields
                const currentAccount = accounts.find(
                    (acc) => acc.id === selectedAccountForTechnicalUser.id,
                );
                if (!currentAccount) {
                    console.error(
                        '❌ Current account not found for individual technical user save',
                    );
                    return;
                }

                const requestData = {
                    id: selectedAccountForTechnicalUser.id,
                    accountName: currentAccount.accountName || '',
                    masterAccount: currentAccount.masterAccount || '',
                    cloudType: currentAccount.cloudType || '',
                    address: currentAccount.address || '',
                    country: currentAccount.country || '',
                    addresses: currentAccount.addresses || [],
                    licenses: currentAccount.licenses || [],
                    technicalUsers: validatedUsers, // Use validated users with corrected status
                };

                console.log('🔍 Individual Technical User API Request Data:', {
                    url: `${apiBase}/api/accounts`,
                    method: 'PUT',
                    data: requestData,
                    technicalUsers: validatedUsers, // Show validated users in log
                    userCount: validatedUsers.length,
                });

                const response = await fetch(`${apiBase}/api/accounts`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestData),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('❌ Individual API Error Response:', {
                        status: response.status,
                        statusText: response.statusText,
                        errorText: errorText,
                    });
                    throw new Error(
                        `Failed to save technical user to API: ${response.statusText} - ${errorText}`,
                    );
                }

                const responseData = await response.json();
                console.log(
                    '✅ Individual technical user saved to API successfully',
                    {
                    response: responseData,
                        technicalUsersInResponse:
                            responseData?.technicalUsers || 'Not present',
                        willRefetchFromUsersAPI:
                            'Technical users will be refreshed from /api/users on next page load',
                    },
                );
            } else {
                console.log(
                    '⏭️ Skipping API save for temporary account:',
                    selectedAccountForTechnicalUser.id,
                );
            }
        } catch (error) {
            console.error(
                '❌ Error saving individual technical user to API:',
                error,
            );
            // Continue with local save even if API fails
        }

        // Update local state
        setAccounts((prev) => {
            const updated = prev.map((account) =>
                account.id === selectedAccountForTechnicalUser.id
                    ? {
                          ...account,
                          technicalUsers: validatedUsers, // Use validated users in local state
                          updatedAt: new Date().toISOString(),
                      }
                    : account,
            );
            const sorted = sortConfigsByDisplayOrder(updated);
            saveAccountsToStorage(sorted);
            return sorted;
        });

        // Force table refresh for immediate blue dot visibility
        setTableRefreshKey((prev) => prev + 1);

        showBlueNotification('Technical user saved successfully');
    };

    return (
        <div className='h-full bg-secondary flex flex-col'>
            {/* Header Section */}
            <div className='bg-white px-3 py-4 border-b border-slate-200'>
                <div className='w-full'>
                    <h1 className='text-2xl font-bold text-slate-900'>
                        Manage Accounts
                    </h1>
                    <p className='mt-2 text-sm text-slate-600 leading-relaxed'>
                        Build, manage, and connect customer accounts to
                        enterprise offerings through a unified data framework.
                    </p>
                </div>
            </div>

            {/* Toolbar Section */}
            <div className='bg-sap-light-gray px-3 py-3 text-primary border-y border-light'>
                <div className='flex items-center justify-between gap-3'>
                    <div className='flex items-center gap-3 flex-wrap'>
                        {/* Create New Enterprise Button */}
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
                                {isLoading
                                    ? 'Loading...'
                                    : 'Create New Account'}
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
                                    style={{fontSize: '14px'}}
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
                                        <svg
                                            className='h-4 w-4'
                                            fill='none'
                                            viewBox='0 0 24 24'
                                            stroke='currentColor'
                                        >
                                            <path
                                                strokeLinecap='round'
                                                strokeLinejoin='round'
                                                strokeWidth={2}
                                                d='M6 18L18 6M6 6l12 12'
                                            />
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
                                            {/* Account Filter */}
                                            <div>
                                                <label className='block text-xs font-medium text-gray-700 mb-1'>
                                                    Account
                                                </label>
                                                <div className='relative'>
                                                    <input
                                                        type='text'
                                                        value={
                                                            filterForm.accountName
                                                        }
                                                        onChange={(e) => {
                                                            const value =
                                                                e.target.value;
                                                            console.log(
                                                                '🔍 Account filter onChange:',
                                                                {
                                                                value,
                                                                    dropdownOptionsLength:
                                                                        dropdownOptions
                                                                            .accountNames
                                                                            .length,
                                                                    availableAccountNames:
                                                                        dropdownOptions.accountNames.map(
                                                                            (
                                                                                a,
                                                                            ) =>
                                                                                a.name,
                                                                        ),
                                                                },
                                                            );

                                                            setFilterForm({
                                                                ...filterForm,
                                                                accountName:
                                                                    value,
                                                            });

                                                            // Filter account names and ensure uniqueness
                                                            const filtered =
                                                                dropdownOptions.accountNames.filter(
                                                                    (account) =>
                                                                        account.name
                                                                            .toLowerCase()
                                                                            .includes(
                                                                                value.toLowerCase(),
                                                                            ),
                                                            );
                                                            console.log(
                                                                '🔍 Filtered accounts:',
                                                                filtered.map(
                                                                    (a) =>
                                                                        a.name,
                                                                ),
                                                            );

                                                            // Remove duplicates based on name
                                                            const uniqueFiltered =
                                                                filtered.filter(
                                                                    (
                                                                        account,
                                                                        index,
                                                                        self,
                                                                    ) =>
                                                                        index ===
                                                                        self.findIndex(
                                                                            (
                                                                                a,
                                                                            ) =>
                                                                                a.name ===
                                                                                account.name,
                                                                        ),
                                                            );
                                                            setFilteredAccountNames(
                                                                uniqueFiltered,
                                                            );

                                                            const shouldShow =
                                                                value.length >
                                                                    0 &&
                                                                filtered.length >
                                                                    0;
                                                            console.log(
                                                                '🔍 Should show suggestions:',
                                                                shouldShow,
                                                                {
                                                                    valueLength:
                                                                        value.length,
                                                                    filteredLength:
                                                                        filtered.length,
                                                                },
                                                            );
                                                            setShowAccountSuggestions(
                                                                shouldShow,
                                                            );
                                                            setSelectedAccountIndex(
                                                                -1,
                                                            );
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (
                                                                e.key ===
                                                                'ArrowDown'
                                                            ) {
                                                                e.preventDefault();
                                                                setSelectedAccountIndex(
                                                                    (prev) =>
                                                                        prev <
                                                                        filteredAccountNames.length -
                                                                            1
                                                                            ? prev +
                                                                              1
                                                                            : prev,
                                                                );
                                                            } else if (
                                                                e.key ===
                                                                'ArrowUp'
                                                            ) {
                                                                e.preventDefault();
                                                                setSelectedAccountIndex(
                                                                    (prev) =>
                                                                        prev > 0
                                                                            ? prev -
                                                                              1
                                                                            : -1,
                                                                );
                                                            } else if (
                                                                e.key ===
                                                                    'Enter' &&
                                                                selectedAccountIndex >=
                                                                    0
                                                            ) {
                                                                e.preventDefault();
                                                                const selected =
                                                                    filteredAccountNames[
                                                                        selectedAccountIndex
                                                                    ];
                                                                setFilterForm({
                                                                    ...filterForm,
                                                                    accountName:
                                                                        selected.name,
                                                                });
                                                                setShowAccountSuggestions(
                                                                    false,
                                                                );
                                                                setSelectedAccountIndex(
                                                                    -1,
                                                                );
                                                            } else if (
                                                                e.key ===
                                                                'Escape'
                                                            ) {
                                                                setShowAccountSuggestions(
                                                                    false,
                                                                );
                                                                setSelectedAccountIndex(
                                                                    -1,
                                                                );
                                                            }
                                                        }}
                                                        onBlur={() => {
                                                            // Delay hiding suggestions to allow clicking
                                                            setTimeout(
                                                                () =>
                                                                    setShowAccountSuggestions(
                                                                        false,
                                                                    ),
                                                                150,
                                                            );
                                                        }}
                                                        onFocus={() => {
                                                            if (
                                                                filterForm.accountName &&
                                                                filteredAccountNames.length >
                                                                    0
                                                            ) {
                                                                setShowAccountSuggestions(
                                                                    true,
                                                                );
                                                            }
                                                        }}
                                                        className='w-full pl-2 pr-8 py-1 text-sm border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded bg-white'
                                                    />
                                                    {showAccountSuggestions && (
                                                        <div className='filter-suggestions-dropdown absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto'>
                                                            {filteredAccountNames.map(
                                                                (
                                                                    account,
                                                                    index,
                                                                ) => (
                                                                <div
                                                                        key={
                                                                            account.id
                                                                        }
                                                                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${
                                                                            index ===
                                                                            selectedAccountIndex
                                                                                ? 'bg-blue-100'
                                                                                : ''
                                                                    }`}
                                                                        onMouseDown={(
                                                                            e,
                                                                        ) => {
                                                                        e.preventDefault(); // Prevent input blur
                                                                            setFilterForm(
                                                                                {
                                                                            ...filterForm,
                                                                                    accountName:
                                                                                        account.name,
                                                                                },
                                                                            );
                                                                            setShowAccountSuggestions(
                                                                                false,
                                                                            );
                                                                            setSelectedAccountIndex(
                                                                                -1,
                                                                            );
                                                                    }}
                                                                >
                                                                        {
                                                                            account.name
                                                                        }
                                                                </div>
                                                                ),
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Master Account Filter */}
                                            <div>
                                                <label className='block text-xs font-medium text-gray-700 mb-1'>
                                                    Master Account
                                                </label>
                                                <div className='relative'>
                                                    <input
                                                        type='text'
                                                        value={
                                                            filterForm.masterAccount
                                                        }
                                                        onChange={(e) => {
                                                            const value =
                                                                e.target.value;
                                                            console.log(
                                                                '🔍 Master Account filter onChange:',
                                                                {
                                                                value,
                                                                    dropdownOptionsLength:
                                                                        dropdownOptions
                                                                            .masterAccounts
                                                                            .length,
                                                                    availableMasterAccounts:
                                                                        dropdownOptions.masterAccounts.map(
                                                                            (
                                                                                m,
                                                                            ) =>
                                                                                m.name,
                                                                        ),
                                                                },
                                                            );

                                                            setFilterForm({
                                                                ...filterForm,
                                                                masterAccount:
                                                                    value,
                                                            });

                                                            // Filter master account names and ensure uniqueness
                                                            const filtered =
                                                                dropdownOptions.masterAccounts.filter(
                                                                    (master) =>
                                                                        master.name
                                                                            .toLowerCase()
                                                                            .includes(
                                                                                value.toLowerCase(),
                                                                            ),
                                                            );
                                                            console.log(
                                                                '🔍 Filtered master accounts:',
                                                                filtered.map(
                                                                    (m) =>
                                                                        m.name,
                                                                ),
                                                            );

                                                            // Remove duplicates based on name
                                                            const uniqueFiltered =
                                                                filtered.filter(
                                                                    (
                                                                        master,
                                                                        index,
                                                                        self,
                                                                    ) =>
                                                                        index ===
                                                                        self.findIndex(
                                                                            (
                                                                                m,
                                                                            ) =>
                                                                                m.name ===
                                                                                master.name,
                                                                        ),
                                                            );
                                                            setFilteredMasterAccounts(
                                                                uniqueFiltered,
                                                            );

                                                            const shouldShow =
                                                                value.length >
                                                                    0 &&
                                                                filtered.length >
                                                                    0;
                                                            console.log(
                                                                '🔍 Should show master account suggestions:',
                                                                shouldShow,
                                                                {
                                                                    valueLength:
                                                                        value.length,
                                                                    filteredLength:
                                                                        filtered.length,
                                                                },
                                                            );
                                                            setShowMasterAccountSuggestions(
                                                                shouldShow,
                                                            );
                                                            setSelectedMasterAccountIndex(
                                                                -1,
                                                            );
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (
                                                                e.key ===
                                                                'ArrowDown'
                                                            ) {
                                                                e.preventDefault();
                                                                setSelectedMasterAccountIndex(
                                                                    (prev) =>
                                                                        prev <
                                                                        filteredMasterAccounts.length -
                                                                            1
                                                                            ? prev +
                                                                              1
                                                                            : prev,
                                                                );
                                                            } else if (
                                                                e.key ===
                                                                'ArrowUp'
                                                            ) {
                                                                e.preventDefault();
                                                                setSelectedMasterAccountIndex(
                                                                    (prev) =>
                                                                        prev > 0
                                                                            ? prev -
                                                                              1
                                                                            : -1,
                                                                );
                                                            } else if (
                                                                e.key ===
                                                                    'Enter' &&
                                                                selectedMasterAccountIndex >=
                                                                    0
                                                            ) {
                                                                e.preventDefault();
                                                                const selected =
                                                                    filteredMasterAccounts[
                                                                        selectedMasterAccountIndex
                                                                    ];
                                                                setFilterForm({
                                                                    ...filterForm,
                                                                    masterAccount:
                                                                        selected.name,
                                                                });
                                                                setShowMasterAccountSuggestions(
                                                                    false,
                                                                );
                                                                setSelectedMasterAccountIndex(
                                                                    -1,
                                                                );
                                                            } else if (
                                                                e.key ===
                                                                'Escape'
                                                            ) {
                                                                setShowMasterAccountSuggestions(
                                                                    false,
                                                                );
                                                                setSelectedMasterAccountIndex(
                                                                    -1,
                                                                );
                                                            }
                                                        }}
                                                        onBlur={() => {
                                                            // Delay hiding suggestions to allow clicking
                                                            setTimeout(
                                                                () =>
                                                                    setShowMasterAccountSuggestions(
                                                                        false,
                                                                    ),
                                                                150,
                                                            );
                                                        }}
                                                        onFocus={() => {
                                                            if (
                                                                filterForm.masterAccount &&
                                                                filteredMasterAccounts.length >
                                                                    0
                                                            ) {
                                                                setShowMasterAccountSuggestions(
                                                                    true,
                                                                );
                                                            }
                                                        }}
                                                        className='w-full pl-2 pr-8 py-1 text-sm border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded bg-white'
                                                    />
                                                    {showMasterAccountSuggestions && (
                                                        <div className='filter-suggestions-dropdown absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto'>
                                                            {filteredMasterAccounts.map(
                                                                (
                                                                    master,
                                                                    index,
                                                                ) => (
                                                                <div
                                                                        key={
                                                                            master.id
                                                                        }
                                                                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${
                                                                            index ===
                                                                            selectedMasterAccountIndex
                                                                                ? 'bg-blue-100'
                                                                                : ''
                                                                    }`}
                                                                        onMouseDown={(
                                                                            e,
                                                                        ) => {
                                                                        e.preventDefault(); // Prevent input blur
                                                                            setFilterForm(
                                                                                {
                                                                            ...filterForm,
                                                                                    masterAccount:
                                                                                        master.name,
                                                                                },
                                                                            );
                                                                            setShowMasterAccountSuggestions(
                                                                                false,
                                                                            );
                                                                            setSelectedMasterAccountIndex(
                                                                                -1,
                                                                            );
                                                                    }}
                                                                >
                                                                        {
                                                                            master.name
                                                                        }
                                                                </div>
                                                                ),
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Cloud Type Filter */}
                                            <div>
                                                <label className='block text-xs font-medium text-gray-700 mb-1'>
                                                    Cloud Type
                                                </label>
                                                <div className='relative'>
                                                    <input
                                                        type='text'
                                                        value={
                                                            filterForm.cloudType
                                                        }
                                                        onChange={(e) =>
                                                            setFilterForm({
                                                                ...filterForm,
                                                                cloudType:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        }
                                                        className='w-full pl-2 pr-8 py-1 text-sm border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded bg-white'
                                                    />
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
                                    sortOpen ||
                                    (sortColumn &&
                                        sortDirection &&
                                        (sortDirection === 'asc' ||
                                            sortDirection === 'desc'))
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
                                <ArrowsUpDownIcon
                                    className={`h-4 w-4 transition-transform duration-300 ${
                                        sortOpen
                                            ? 'rotate-180'
                                            : 'group-hover:rotate-180'
                                    }`}
                                />
                                <span className='text-sm'>Sort</span>
                                {sortColumn &&
                                    sortDirection &&
                                    (sortDirection === 'asc' ||
                                        sortDirection === 'desc') && (
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
                                                            const newColumn =
                                                                e.target.value;
                                                            setSortColumn(
                                                                newColumn,
                                                            );
                                                            // Don't apply sorting here - wait for direction selection
                                                        }}
                                                        className='w-full pl-2 pr-8 py-1.5 text-sm border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded bg-white'
                                                    >
                                                        <option value=''>
                                                            Select column...
                                                            </option>
                                                        {toolbarCols.map(
                                                            (col) => (
                                                                <option
                                                                    key={col}
                                                                    value={col}
                                                                >
                                                                    {
                                                                        columnLabels[
                                                                            col
                                                                        ]
                                                                    }
                                                                </option>
                                                            ),
                                                        )}
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
                                                            const newDirection =
                                                                e.target
                                                                    .value as
                                                                    | 'asc'
                                                                    | 'desc'
                                                                    | '';
                                                            setSortDirection(
                                                                newDirection,
                                                            );
                                                            // Only apply sorting if both column and valid direction are selected
                                                            if (
                                                                sortColumn &&
                                                                (newDirection ===
                                                                    'asc' ||
                                                                    newDirection ===
                                                                        'desc')
                                                            ) {
                                                                applySorting(
                                                                    sortColumn,
                                                                    newDirection,
                                                                );
                                                            }
                                                        }}
                                                        className='w-full pl-2 pr-8 py-1.5 text-sm border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded bg-white'
                                                    >
                                                        <option value=''>
                                                            Select direction...
                                                        </option>
                                                        <option value='asc'>
                                                            Ascending
                                                        </option>
                                                        <option value='desc'>
                                                            Descending
                                                        </option>
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Current Sort Display */}
                                            {sortColumn &&
                                                sortDirection &&
                                                (sortDirection === 'asc' ||
                                                    sortDirection ===
                                                        'desc') && (
                                                    <div className='mt-1 p-2 bg-blue-50 rounded border text-xs'>
                                                        <span className='font-medium text-blue-800'>
                                                            {
                                                                columnLabels[
                                                                    sortColumn
                                                                ]
                                                            }{' '}
                                                            (
                                                            {sortDirection ===
                                                            'asc'
                                                                ? 'Asc'
                                                                : 'Desc'}
                                                            )
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
                                    hideOpen ||
                                    visibleCols.length < allCols.length
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
                                                            setHideQuery(
                                                                e.target.value,
                                                            )
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
                                                            {c === 'accountName'
                                                                ? 'Account'
                                                                : c ===
                                                                  'address'
                                                                ? 'Address'
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
                                                        value={
                                                            ActiveGroupLabel ===
                                                            'None'
                                                                ? ''
                                                                : ActiveGroupLabel
                                                        }
                                                        onChange={(e) => {
                                                            const value =
                                                                e.target.value;
                                                            setGroupByFromLabel(
                                                                value || 'None',
                                                            );
                                                        }}
                                                        className='w-full pl-2 pr-8 py-1.5 text-sm border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded bg-white'
                                                    >
                                                        <option value=''>
                                                            Select column...
                                                        </option>
                                                        <option value='Account'>
                                                            Account
                                                        </option>
                                                        <option value='Master Account'>
                                                            Master Account
                                                        </option>
                                                        <option value='Cloud Type'>
                                                            Cloud Type
                                                        </option>
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Current Group Display */}
                                            {ActiveGroupLabel !== 'None' && (
                                                <div className='mt-1 p-2 bg-orange-50 rounded border text-xs'>
                                                    <span className='font-medium text-orange-800'>
                                                        Grouped by:{' '}
                                                        {ActiveGroupLabel}
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
                            title={
                                isAutoSaving
                                    ? 'Auto-saving...'
                                    : autoSaveCountdown
                                    ? `Auto-saving in ${autoSaveCountdown}s`
                                    : 'Save all unsaved entries'
                            }
                        >
                            {/* Progress bar animation for auto-save countdown */}
                            {autoSaveCountdown && (
                                <div className='absolute inset-0 bg-blue-200/30 rounded-md overflow-hidden'>
                                    <div
                                        className='h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-1000 ease-linear'
                                        style={{
                                            width: autoSaveCountdown
                                                ? `${
                                                      ((10 -
                                                          autoSaveCountdown) /
                                                          10) *
                                                      100
                                                  }%`
                                                : '0%',
                                        }}
                                    ></div>
                                </div>
                            )}

                            {/* Auto-save success wave animation */}
                            {showAutoSaveSuccess && (
                                <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-ping'></div>
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
                                {isAutoSaving
                                    ? 'Auto-saving...'
                                    : autoSaveCountdown
                                    ? `Save (${autoSaveCountdown}s)`
                                    : 'Save'}
                            </span>
                        </button>
                    </div>

                    {/* Right side buttons - Expand/Collapse at extreme right */}
                    <div className='flex items-center gap-2'>
                        {/* Expand All Button */}
                        <button
                            onClick={expandAllRows}
                            className='group relative flex items-center justify-center p-2 rounded-lg border-2 font-medium transition-all duration-300 transform hover:scale-105 border-emerald-300 bg-emerald-50 text-emerald-600 hover:border-emerald-400 hover:bg-emerald-100 hover:shadow-lg'
                            title='Expand All Accounts'
                        >
                            <svg
                                className='h-4 w-4 transition-transform duration-300 group-hover:scale-110'
                                fill='none'
                                stroke='currentColor'
                                strokeWidth='1.5'
                                viewBox='0 0 16 16'
                            >
                                {/* Top-left arrow */}
                                <path
                                    d='M2 2 L6 6 M2 2 L2 6 M2 2 L6 2'
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                />
                                {/* Top-right arrow */}
                                <path
                                    d='M14 2 L10 6 M14 2 L14 6 M14 2 L10 2'
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                />
                                {/* Bottom-left arrow */}
                                <path
                                    d='M2 14 L6 10 M2 14 L2 10 M2 14 L6 14'
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                />
                                {/* Bottom-right arrow */}
                                <path
                                    d='M14 14 L10 10 M14 14 L14 10 M14 14 L10 14'
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                />
                            </svg>
                        </button>

                        {/* Collapse All Button */}
                        <button
                            onClick={collapseAllRows}
                            className='group relative flex items-center justify-center p-2 rounded-lg border-2 font-medium transition-all duration-300 transform hover:scale-105 border-blue-300 bg-blue-50 text-blue-600 hover:border-blue-400 hover:bg-blue-100 hover:shadow-lg'
                            title='Collapse All Accounts'
                        >
                            <svg
                                className='h-4 w-4 transition-transform duration-300 group-hover:scale-110'
                                fill='none'
                                stroke='currentColor'
                                strokeWidth='1.5'
                                viewBox='0 0 16 16'
                            >
                                {/* Top-left arrow pointing inward */}
                                <path
                                    d='M6 6 L2 2 M6 6 L6 2 M6 6 L2 6'
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                />
                                {/* Top-right arrow pointing inward */}
                                <path
                                    d='M10 6 L14 2 M10 6 L10 2 M10 6 L14 6'
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                />
                                {/* Bottom-left arrow pointing inward */}
                                <path
                                    d='M6 10 L2 14 M6 10 L6 14 M6 10 L2 10'
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                />
                                {/* Bottom-right arrow pointing inward */}
                                <path
                                    d='M10 10 L14 14 M10 10 L10 14 M10 10 L14 10'
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                />
                            </svg>
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
                                        Loading Manage Accounts configurations
                                    </h3>
                                    <p className='mt-2 text-sm text-slate-500'>
                                        Please wait while we fetch your account
                                        management data...
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
                                        No Accounts Configured
                                    </h3>
                                    <p className='mt-2 text-sm text-slate-500'>
                                        No accounts have been configured yet.
                                        Create an account configuration to get
                                        started.
                                    </p>
                                    <div className='mt-6'>
                                        <button
                                            onClick={() => {
                                                // Clear any pending autosave to prevent blank rows from being saved
                                                if (autoSaveTimerRef.current) {
                                                    clearTimeout(
                                                        autoSaveTimerRef.current,
                                                    );
                                                    autoSaveTimerRef.current =
                                                        null;
                                                }
                                                if (
                                                    countdownIntervalRef.current
                                                ) {
                                                    clearInterval(
                                                        countdownIntervalRef.current,
                                                    );
                                                    countdownIntervalRef.current =
                                                        null;
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
                                            Create New Account
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
                                        All table columns are currently hidden.
                                        Click the button below to show all
                                        columns.
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
                                <AccountsTable
                                    key={tableRefreshKey}
                                    ref={accountsTableRef}
                                    isAIInsightsPanelOpen={!isAIPanelCollapsed}
                                    rows={accountTableRows}
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
                                    groupByExternal={
                                        groupByProp as
                                            | 'none'
                                            | 'accountName'
                                            | 'masterAccount'
                                            | 'cloudType'
                                            | 'address'
                                    }
                                    onAddNewRow={handleAddNewRow}
                                    hideRowExpansion={false}
                                    customColumnLabels={{
                                        accountName: 'Account',
                                        email: 'Master Account',
                                        phone: 'Country',
                                        technicalUser: 'Technical User',
                                    }}
                                    enableDropdownChips={true}
                                    dropdownOptions={dropdownOptions}
                                    onUpdateField={async (
                                        rowId,
                                        field,
                                        value,
                                    ) => {
                                        console.log(
                                            '🔄 onUpdateField called:',
                                            {
                                                rowId,
                                                field,
                                                value,
                                                isTemporary:
                                                    rowId.startsWith('tmp-'),
                                                isLicenseField:
                                                    field === 'licenses',
                                            },
                                        );

                                        // Handle license updates differently
                                        if (field === 'licenses') {
                                            console.log(
                                                '📄 License update detected for row:',
                                                rowId,
                                                'New licenses:',
                                                value,
                                            );

                                            // Update the account with new licenses
                                            setAccounts((prev) => {
                                                const updated = prev.map(
                                                    (account) =>
                                                        account.id === rowId
                                                            ? {
                                                                  ...account,
                                                                  licenses:
                                                                      value,
                                                                  updatedAt:
                                                                      new Date().toISOString(),
                                                              }
                                                            : account,
                                                );
                                                // Don't sort during license updates to prevent phantom changes
                                                // Sorting will happen during save operations instead
                                                return updated;
                                            });

                                            // For existing rows, trigger auto-save timer for license changes
                                            // But only if the licenses are complete (not just partially filled)
                                            if (!rowId.startsWith('tmp-')) {
                                                const hasCompleteLicenseData =
                                                    Array.isArray(value) &&
                                                    value.length > 0 &&
                                                    value.every(
                                                        (license: any) => {
                                                            const hasEnterprise =
                                                                hasValue(
                                                                    license.enterprise,
                                                                );
                                                            const hasProduct =
                                                                hasValue(
                                                                    license.product,
                                                                );
                                                            const hasService =
                                                                hasValue(
                                                                    license.service,
                                                                );
                                                            const hasLicenseStartDate =
                                                                hasValue(
                                                                    license.licenseStartDate,
                                                                );
                                                            const hasLicenseEndDate =
                                                                hasValue(
                                                                    license.licenseEndDate,
                                                                );
                                                            const hasNumberOfUsers =
                                                                hasValue(
                                                                    license.numberOfUsers,
                                                                );
                                                            const hasValidNoticePeriod =
                                                                !license.renewalNotice ||
                                                                hasValue(
                                                                    license.noticePeriodDays,
                                                                );

                                                            return (
                                                                hasEnterprise &&
                                                                hasProduct &&
                                                                hasService &&
                                                                hasLicenseStartDate &&
                                                                hasLicenseEndDate &&
                                                                hasNumberOfUsers &&
                                                                hasValidNoticePeriod
                                                            );
                                                        },
                                                    );

                                                console.log(
                                                    '📊 License completeness check:',
                                                    {
                                                    rowId,
                                                    hasCompleteLicenseData,
                                                        licensesCount:
                                                            Array.isArray(value)
                                                                ? value.length
                                                                : 0,
                                                        licenses: value,
                                                    },
                                                );

                                                if (hasCompleteLicenseData) {
                                                    console.log(
                                                        '🔄 Triggering auto-save timer for complete license data on existing account:',
                                                        rowId,
                                                    );

                                                    // Check if licenses actually changed before marking as modified
                                                    const currentAccount =
                                                        accounts.find(
                                                            (a) =>
                                                                a.id === rowId,
                                                        );
                                                    const oldLicenses =
                                                        JSON.stringify(
                                                            currentAccount?.licenses ||
                                                                [],
                                                        );
                                                    const newLicenses =
                                                        JSON.stringify(value);
                                                    const hasLicenseChanged =
                                                        oldLicenses !==
                                                        newLicenses;

                                                    console.log(
                                                        '🔍 License change check:',
                                                        {
                                                        rowId,
                                                        hasLicenseChanged,
                                                            oldCount:
                                                                currentAccount
                                                                    ?.licenses
                                                                    ?.length ||
                                                                0,
                                                            newCount:
                                                                Array.isArray(
                                                                    value,
                                                                )
                                                                    ? value.length
                                                                    : 0,
                                                        },
                                                    );

                                                    if (hasLicenseChanged) {
                                                        // Add to modified records set
                                                        setModifiedExistingRecords(
                                                            (prev) => {
                                                                const newSet =
                                                                    new Set(
                                                                        prev,
                                                                    );
                                                                newSet.add(
                                                                    rowId,
                                                                );
                                                                console.log(
                                                                    '✅ Added to modified records (license changed):',
                                                                    rowId,
                                                                );
                                                                return newSet;
                                                            },
                                                        );

                                                        // Trigger auto-save timer for visual feedback
                                                        debouncedAutoSave();
                                                    } else {
                                                        console.log(
                                                            '❌ Not adding to modified records (license unchanged):',
                                                            rowId,
                                                        );
                                                    }
                                                } else {
                                                    console.log(
                                                        '❌ Not triggering auto-save for incomplete license data:',
                                                        rowId,
                                                    );

                                                    // Remove from modified records if license is incomplete
                                                    setModifiedExistingRecords(
                                                        (prev) => {
                                                            const newSet =
                                                                new Set(prev);
                                                            newSet.delete(
                                                                rowId,
                                                            );
                                                            return newSet;
                                                        },
                                                    );
                                                }
                                            } else {
                                                // For temporary rows, check if the main row is complete before triggering auto-save
                                                const account = accounts.find(
                                                    (a) => a.id === rowId,
                                                );
                                                if (account) {
                                                    const hasAccountName =
                                                        hasValue(account.accountName);
                                                    const hasMasterAccount =
                                                        hasValue(account.masterAccount);
                                                    const hasCloudType =
                                                        hasValue(account.cloudType);
                                                    const hasAddress =
                                                        hasValue(account.address);

                                                    if (
                                                        hasAccountName &&
                                                        hasMasterAccount &&
                                                        hasCloudType &&
                                                        hasAddress
                                                    ) {
                                                        console.log(
                                                            '✅ License change on complete temporary account, starting auto-save timer...',
                                                        );
                                                        debouncedAutoSave();
                                                    }
                                                }
                                            }

                                            // Save to localStorage for immediate persistence
                                            const updatedAccounts =
                                                accounts.map((acc) =>
                                                    acc.id === rowId
                                                        ? {
                                                              ...acc,
                                                              licenses: value,
                                                              updatedAt:
                                                                  new Date().toISOString(),
                                                          }
                                                        : acc,
                                                );
                                            saveAccountsToStorage(
                                                updatedAccounts,
                                            );
                                            console.log(
                                                `💾 Saved license changes for account ${rowId} to localStorage`,
                                            );
                                            return;
                                        }

                                        // Store pending changes separately to preserve user input during data reloads
                                        setPendingLocalChanges((prev) => ({
                                            ...prev,
                                            [rowId]: {
                                                ...prev[rowId],
                                                [field]: value,
                                            },
                                        }));

                                        // Also update main state for immediate responsiveness
                                        setAccounts((prev) => {
                                            const updated = prev.map(
                                                (account) =>
                                                    account.id === rowId
                                                        ? {
                                                              ...account,
                                                              [field]: value,
                                                              updatedAt:
                                                                  new Date().toISOString(),
                                                          }
                                                        : account,
                                            );
                                            // Don't sort during individual field updates to prevent phantom changes
                                            // Sorting will happen during save operations instead
                                            return updated;
                                        });

                                        // For new rows (temporary IDs), check if we can auto-save
                                        if (rowId.startsWith('tmp-')) {
                                            console.log(
                                                '🔄 Updating temporary row:',
                                                rowId,
                                                field,
                                                value,
                                            );

                                            // Check if all required fields are filled for auto-save
                                            const updatedAccount =
                                                accounts.find(
                                                    (a) => a.id === rowId,
                                                );
                                            if (updatedAccount) {
                                                // Apply the current update to check completeness
                                                const accountWithUpdate = {
                                                    ...updatedAccount,
                                                    [field]: value,
                                                };

                                                // Check if we have all required fields
                                                const hasAccountName =
                                                    hasValue(accountWithUpdate.accountName);
                                                const hasMasterAccount =
                                                    hasValue(accountWithUpdate.masterAccount);
                                                const hasCloudType =
                                                    hasValue(accountWithUpdate.cloudType);
                                                const hasAddress =
                                                    hasValue(accountWithUpdate.address);

                                                console.log(
                                                    '🔍 Auto-save check:',
                                                    {
                                                        rowId,
                                                        field,
                                                        value,
                                                        accountWithUpdate,
                                                        hasAccountName,
                                                        hasMasterAccount,
                                                        hasCloudType,
                                                        hasAddress,
                                                        willTriggerDebouncedSave:
                                                            hasAccountName &&
                                                            hasMasterAccount &&
                                                            hasCloudType &&
                                                            hasAddress,
                                                    },
                                                );

                                                // Trigger debounced auto-save if all required fields are filled
                                                if (
                                                    hasAccountName &&
                                                    hasMasterAccount &&
                                                    hasCloudType &&
                                                    hasAddress
                                                ) {
                                                    console.log(
                                                        '✅ All required account fields filled, starting 10-second auto-save timer...',
                                                    );

                                                    // Clear validation errors for this row since it's now complete
                                                    if (showValidationErrors) {
                                                        const currentIncompleteRows =
                                                            getIncompleteRows();
                                                        if (
                                                            !currentIncompleteRows.includes(
                                                                rowId,
                                                            )
                                                        ) {
                                                            // This row is no longer incomplete, check if all rows are complete
                                                            const remainingIncompleteRows =
                                                                currentIncompleteRows.filter(
                                                                    (id) =>
                                                                        id !==
                                                                        rowId,
                                                                );
                                                            if (
                                                                remainingIncompleteRows.length ===
                                                                0
                                                            ) {
                                                                // All rows are now complete, clear validation errors
                                                                setShowValidationErrors(
                                                                    false,
                                                                );
                                                            }
                                                        }
                                                    }

                                                    debouncedAutoSave();
                                                } else {
                                                    console.log(
                                                        '❌ Auto-save conditions not met:',
                                                        {
                                                            hasAccountName,
                                                            hasMasterAccount,
                                                            hasCloudType,
                                                            hasAddress,
                                                            accountNameValue:
                                                                accountWithUpdate.accountName,
                                                            masterAccountValue:
                                                                accountWithUpdate.masterAccount,
                                                            cloudTypeValue:
                                                                accountWithUpdate.cloudType,
                                                            addressValue:
                                                                accountWithUpdate.address,
                                                        },
                                                    );
                                                }
                                            }
                                            return;
                                        }

                                        // For existing rows, trigger auto-save timer for visual feedback
                                        if (!rowId.startsWith('tmp-')) {
                                            const account = accounts.find(
                                                (a) => a.id === rowId,
                                            );
                                            if (account) {
                                                const updatedAccount = {
                                                    ...account,
                                                    [field]: value,
                                                };

                                                // Check if all required fields are present and not empty
                                                const hasAccountName =
                                                    hasValue(updatedAccount.accountName);
                                                const hasMasterAccount =
                                                    hasValue(updatedAccount.masterAccount);
                                                const hasCloudType =
                                                    hasValue(updatedAccount.cloudType);
                                                const hasAddress =
                                                    hasValue(updatedAccount.address);

                                                console.log(
                                                    '🔍 Existing account auto-save check:',
                                                    {
                                                        rowId,
                                                        field,
                                                        value,
                                                        hasAccountName:
                                                            !!hasAccountName,
                                                        hasMasterAccount:
                                                            !!hasMasterAccount,
                                                        hasCloudType:
                                                            !!hasCloudType,
                                                        hasAddress:
                                                            !!hasAddress,
                                                        willTriggerAutoSave: !!(
                                                            hasAccountName &&
                                                            hasMasterAccount &&
                                                            hasCloudType &&
                                                            hasAddress
                                                        ),
                                                    },
                                                );

                                                // Only trigger auto-save if all fields are complete
                                                if (
                                                    hasAccountName &&
                                                    hasMasterAccount &&
                                                    hasCloudType &&
                                                    hasAddress
                                                ) {
                                                    console.log(
                                                        '🔄 Triggering auto-save timer for complete existing account:',
                                                        rowId,
                                                    );

                                                    // Clear validation errors for this row since it's now complete
                                                    if (showValidationErrors) {
                                                        const currentIncompleteRows =
                                                            getIncompleteRows();
                                                        if (
                                                            !currentIncompleteRows.includes(
                                                                rowId,
                                                            )
                                                        ) {
                                                            // This row is no longer incomplete, check if all rows are complete
                                                            const remainingIncompleteRows =
                                                                currentIncompleteRows.filter(
                                                                    (id) =>
                                                                        id !==
                                                                        rowId,
                                                                );
                                                            if (
                                                                remainingIncompleteRows.length ===
                                                                0
                                                            ) {
                                                                // All rows are now complete, clear validation errors
                                                                setShowValidationErrors(
                                                                    false,
                                                                );
                                                            }
                                                        }
                                                    }

                                                    // Add to modified records set ONLY if value actually changed
                                                    const oldValue =
                                                        account[
                                                            field as keyof typeof account
                                                        ];
                                                    const hasValueChanged =
                                                        oldValue !== value;

                                                    console.log(
                                                        '🔍 Value change check:',
                                                        {
                                                        rowId,
                                                        field,
                                                        oldValue,
                                                        newValue: value,
                                                            hasValueChanged,
                                                        },
                                                    );

                                                    if (hasValueChanged) {
                                                        setModifiedExistingRecords(
                                                            (prev) => {
                                                                const newSet =
                                                                    new Set(
                                                                        prev,
                                                                    );
                                                                newSet.add(
                                                                    rowId,
                                                                );
                                                                console.log(
                                                                    '✅ Added to modified records (value changed):',
                                                                    rowId,
                                                                );
                                                                return newSet;
                                                            },
                                                        );
                                                        // Trigger auto-save timer for visual feedback
                                                        debouncedAutoSave();
                                                    } else {
                                                        console.log(
                                                            '❌ Not adding to modified records (value unchanged):',
                                                            rowId,
                                                        );
                                                    }
                                                } else {
                                                    console.log(
                                                        '❌ Not triggering auto-save for incomplete existing account:',
                                                        rowId,
                                                        {
                                                            hasAccountName:
                                                                !!hasAccountName,
                                                            hasMasterAccount:
                                                                !!hasMasterAccount,
                                                            hasCloudType:
                                                                !!hasCloudType,
                                                            hasAddress:
                                                                !!hasAddress,
                                                        },
                                                    );
                                                    // Remove from modified records set if it was there
                                                    setModifiedExistingRecords(
                                                        (prev) => {
                                                            const newSet =
                                                                new Set(prev);
                                                            const wasRemoved =
                                                                newSet.delete(
                                                                    rowId,
                                                                );
                                                            console.log(
                                                                `🧹 Removing incomplete account ${rowId} from modified set: ${
                                                                    wasRemoved
                                                                        ? 'removed'
                                                                        : 'not found'
                                                                }`,
                                                            );
                                                            return newSet;
                                                        },
                                                    );

                                                    // Save immediately to localStorage for existing records
                                                    const updatedAccounts =
                                                        accounts.map((acc) =>
                                                            acc.id === rowId
                                                                ? {
                                                                      ...acc,
                                                                      [field]:
                                                                          value,
                                                                      updatedAt:
                                                                          new Date().toISOString(),
                                                                  }
                                                                : acc,
                                                        );
                                                    saveAccountsToStorage(
                                                        updatedAccounts,
                                                    );
                                                    console.log(
                                                        `💾 Saved incomplete account ${rowId} to localStorage`,
                                                    );
                                                    return;
                                                }
                                            }
                                        }

                                        // Save to localStorage for immediate persistence
                                        const updatedAccounts = accounts.map(
                                            (acc) =>
                                                acc.id === rowId
                                                    ? {
                                                          ...acc,
                                                          [field]: value,
                                                          updatedAt:
                                                              new Date().toISOString(),
                                                      }
                                                    : acc,
                                        );
                                        saveAccountsToStorage(updatedAccounts);
                                        console.log(
                                            `💾 Saved account ${rowId} field ${field} to localStorage`,
                                        );
                                    }}
                                    compressingRowId={compressingRowId}
                                    foldingRowId={foldingRowId}
                                    compressingLicenseId={compressingLicenseId}
                                    foldingLicenseId={foldingLicenseId}
                                    onLicenseValidationChange={
                                        handleLicenseValidationChange
                                    }
                                    onLicenseDelete={
                                        startLicenseCompressionAnimation
                                    }
                                    incompleteRowIds={getIncompleteRows()}
                                    showValidationErrors={showValidationErrors}
                                    hasBlankRow={hasBlankRow()}
                                    onOpenAddressModal={handleOpenAddressModal}
                                    onOpenTechnicalUserModal={
                                        handleOpenTechnicalUserModal
                                    }
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
                    title='Unsaved Changes'
                    message={
                        incompleteRows.length > 0
                            ? `You have ${
                                  incompleteRows.length
                              } incomplete account ${
                                  incompleteRows.length === 1
                                      ? 'entry'
                                      : 'entries'
                              }. Your changes will be lost if you leave.`
                            : 'You have unsaved changes that will be lost if you leave.'
                    }
                    confirmText='Leave Anyway'
                    cancelText='Stay Here'
                    onConfirm={() => {
                        console.log('🚀 Leave Anyway clicked', {
                            pendingNavigation,
                            pendingNavigationUrl,
                        });
                        setShowNavigationWarning(false);
                        setIncompleteRows([]);

                        // Set flag to prevent beforeunload warning
                        setUserConfirmedLeave(true);

                        // Clear unsaved changes state to allow navigation
                        setHasUnsavedChanges(false);
                        setPreventNavigation(false);

                        // Execute navigation with a delay to ensure state updates
                        setTimeout(() => {
                            if (pendingNavigation) {
                                console.log(
                                    '🚀 Executing pendingNavigation function',
                                );
                                pendingNavigation();
                                setPendingNavigation(null);
                            } else if (pendingNavigationUrl) {
                                console.log(
                                    '🚀 Navigating to pendingNavigationUrl:',
                                    pendingNavigationUrl,
                                );
                                // Use router.push instead of window.location.href
                                router.push(pendingNavigationUrl);
                                setPendingNavigationUrl(null);
                            }
                            // Reset the flag after navigation attempt
                            setTimeout(
                                () => setUserConfirmedLeave(false),
                                1000,
                            );
                        }, 50);
                    }}
                    onCancel={() => {
                        setShowNavigationWarning(false);
                        setPendingNavigation(null);
                        setPendingNavigationUrl(null);
                        setUserConfirmedLeave(false);
                    }}
                />
            )}

            {/* Delete Confirmation Modal */}
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
                                                ? 'Are you sure you want to delete this account?'
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
                                            {deleteType === 'license'
                                                ? 'Deleting License...'
                                                : 'Deleting...'}
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

            {/* Blue-themed Notification Component - Positioned above Save button */}
            {showNotification && (
                <motion.div
                    initial={{opacity: 0, y: -50, scale: 0.9}}
                    animate={{opacity: 1, y: 0, scale: 1}}
                    exit={{opacity: 0, y: -50, scale: 0.9}}
                    transition={{duration: 0.3, ease: 'easeOut'}}
                    className={`fixed z-50 max-w-sm notification-above-save ${
                        isAIPanelCollapsed ? 'ai-panel-collapsed' : ''
                    }`}
                    style={{
                        // Position well above the toolbar with significant spacing
                        // Header height (~80px) + more gap above toolbar (40px)
                        top: '40px',
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

            {/* Address Modal */}
            {selectedAccountForAddress &&
                (() => {
                    const initialAddresses = (() => {
                        // Check if we have an addresses array
                        if (
                            (selectedAccountForAddress as any).addresses &&
                            Array.isArray(
                                (selectedAccountForAddress as any).addresses,
                            )
                        ) {
                            return (selectedAccountForAddress as any).addresses;
                        }
                        // Check if we have addressData object that needs to be converted to array
                        if ((selectedAccountForAddress as any).addressData) {
                            return [
                                (selectedAccountForAddress as any).addressData,
                            ];
                        }
                        // No address data found
                        return [];
                    })();
                    console.log(
                        '📍 Rendering AddressModal with initialAddresses:',
                        initialAddresses,
                        'Raw data:',
                        {
                            addresses: (selectedAccountForAddress as any)
                                .addresses,
                            addressData: (selectedAccountForAddress as any)
                                .addressData,
                        },
                    );
                    return (
                        <AddressModal
                            isOpen={isAddressModalOpen}
                            onClose={handleCloseAddressModal}
                            onSave={handleSaveAddresses}
                            onSaveIndividual={handleSaveIndividualAddress}
                            accountName={selectedAccountForAddress.accountName}
                            masterAccount={
                                selectedAccountForAddress.masterAccount
                            }
                            initialAddresses={initialAddresses}
                        />
                    );
                })()}

            {/* Technical User Modal */}
            {selectedAccountForTechnicalUser && (
                <TechnicalUserModal
                    isOpen={isTechnicalUserModalOpen}
                    onClose={handleCloseTechnicalUserModal}
                    onSave={handleSaveTechnicalUsers}
                    onSaveIndividual={handleSaveIndividualTechnicalUser}
                    accountName={selectedAccountForTechnicalUser.accountName}
                    masterAccount={
                        selectedAccountForTechnicalUser.masterAccount
                    }
                    initialUsers={(() => {
                        const users =
                            selectedAccountForTechnicalUser.technicalUsers ||
                            [];
                        console.log(
                            '👤 Rendering TechnicalUserModal with initialUsers:',
                            users,
                            'Raw data:',
                            selectedAccountForTechnicalUser,
                        );
                        return users;
                    })()}
                />
            )}
        </div>
    );
}
