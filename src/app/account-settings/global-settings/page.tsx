'use client';

import React, {useState, useEffect, useCallback, useRef} from 'react';
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
import {X, Settings, XCircle} from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';
import GlobalSettingsTable, {
    GlobalSettingsRow,
} from '@/components/GlobalSettingsTable';
import {api, API_BASE} from '@/utils/api';
import {generateId} from '@/utils/id-generator';
import {Icon} from '@/components/Icons';
import {AnimatePresence} from 'framer-motion';

export default function ManageGlobalSettings() {
    // Router for navigation interception
    const router = useRouter();

    // Debug: Track re-renders
    const renderCountRef = useRef(0);
    renderCountRef.current += 1;

    // Global Settings data state
    const [globalSettings, setGlobalSettings] = useState<GlobalSettingsRow[]>(
        [],
    );

    // Client-side display order tracking - independent of API timestamps
    const displayOrderRef = useRef<Map<string, number>>(new Map());

    // Function to sort configs by client-side display order for stable UI
    const sortConfigsByDisplayOrder = useCallback(
        (configs: GlobalSettingsRow[]) => {
            return [...configs].sort((a, b) => {
                const orderA =
                    displayOrderRef.current.get(a.id) ??
                    Number.MAX_SAFE_INTEGER;
                const orderB =
                    displayOrderRef.current.get(b.id) ??
                    Number.MAX_SAFE_INTEGER;
                return orderA - orderB;
            });
        },
        [],
    );

    const [isLoading, setIsLoading] = useState(true);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const [savingRows, setSavingRows] = useState<Set<string>>(new Set());

    // Notification state
    const [notificationMessage, setNotificationMessage] = useState<string>('');
    const [showNotification, setShowNotification] = useState(false);

    // Delete confirmation modal state
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [showValidationModal, setShowValidationModal] = useState(false);
    const [showValidationErrors, setShowValidationErrors] = useState(false);
    const [validationMessage, setValidationMessage] = useState('');
    const [incompleteRows, setIncompleteRows] = useState<string[]>([]);
    const [externalFieldErrors, setExternalFieldErrors] = useState<{
        [key: string]: Record<string, string>;
    }>({});

    // Duplicate entry modal state
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);
    const [duplicateMessage, setDuplicateMessage] = useState('');
    const duplicateDetectedRef = useRef(false); // Track if duplicate was detected during autosave

    // Navigation warning state - exactly like Manage Users
    const [showNavigationWarning, setShowNavigationWarning] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState<
        (() => void) | null
    >(null);
    const [pendingNavigationUrl, setPendingNavigationUrl] = useState<
        string | null
    >(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [preventNavigation, setPreventNavigation] = useState(false);
    const [userConfirmedLeave, setUserConfirmedLeave] = useState(false);

    // Configuration panel state
    const [isConfigurationPanelOpen, setIsConfigurationPanelOpen] =
        useState(false);
    const [configPanelEntity, setConfigPanelEntity] =
        useState<GlobalSettingsRow | null>(null);
    const [accounts, setAccounts] = useState<
        Array<{id: string; accountName: string}>
    >([]);
    const [enterprises, setEnterprises] = useState<
        Array<{id: string; name: string}>
    >([]);
    const [configForm, setConfigForm] = useState<{
        accountId: string;
        accountName: string;
        enterpriseId: string;
        enterpriseName: string;
        workstreams: string[];
        selections: Record<string, string[]>;
    }>({
        accountId: '',
        accountName: '',
        enterpriseId: '',
        enterpriseName: '',
        workstreams: [],
        selections: {},
    });
    // Track if panel data has been loaded to prevent reloading when globalSettings changes
    const configPanelDataLoadedRef = useRef<string | null>(null);
    // Track unsaved changes in configuration panel (using ref for async callbacks)
    const hasConfigUnsavedChangesRef = useRef(false);
    const [hasConfigUnsavedChanges, setHasConfigUnsavedChangesState] =
        useState(false);
    // Wrapper to update both state and ref
    const setHasConfigUnsavedChanges = (value: boolean) => {
        hasConfigUnsavedChangesRef.current = value;
        setHasConfigUnsavedChangesState(value);
    };
    const [showConfigUnsavedChangesDialog, setShowConfigUnsavedChangesDialog] =
        useState(false);
    const [originalConfigSelections, setOriginalConfigSelections] = useState<
        Record<string, string[]>
    >({});
    const [isSavingConfig, setIsSavingConfig] = useState(false);
    // Global search for configuration panel
    const [configSearchTerm, setConfigSearchTerm] = useState('');
    const [appliedConfigSearchTerm, setAppliedConfigSearchTerm] = useState('');

    // Initialize state with localStorage values to prevent initial empty state
    const initializeFromLocalStorage = () => {
        if (typeof window === 'undefined')
            return {
                enterprise: '',
                enterpriseId: '',
                accountId: '',
                accountName: '',
            };

        try {
            const savedName = window.localStorage.getItem(
                'selectedEnterpriseName',
            );
            const savedEnterpriseId = window.localStorage.getItem(
                'selectedEnterpriseId',
            );
            const savedAccountId =
                window.localStorage.getItem('selectedAccountId');
            const savedAccountName = window.localStorage.getItem(
                'selectedAccountName',
            );

            return {
                enterprise: savedName || '',
                enterpriseId:
                    savedEnterpriseId && savedEnterpriseId !== 'null'
                        ? savedEnterpriseId
                        : '',
                accountId:
                    savedAccountId && savedAccountId !== 'null'
                        ? savedAccountId
                        : '',
                accountName:
                    savedAccountName && savedAccountName !== 'null'
                        ? savedAccountName
                        : '',
            };
        } catch (error) {
            console.warn('Failed to initialize from localStorage:', error);
            return {
                enterprise: '',
                enterpriseId: '',
                accountId: '',
                accountName: '',
            };
        }
    };

    const initialValues = initializeFromLocalStorage();

    // Selected Enterprise from top right corner
    const [selectedEnterprise, setSelectedEnterprise] = useState<string>(
        initialValues.enterprise,
    );
    const [selectedEnterpriseId, setSelectedEnterpriseId] = useState<string>(
        initialValues.enterpriseId,
    );

    // Selected Account from top right corner
    const [selectedAccountId, setSelectedAccountId] = useState<string>(
        initialValues.accountId,
    );
    const [selectedAccountName, setSelectedAccountName] = useState<string>(
        initialValues.accountName,
    );

    // Track if we've completed initial localStorage loading to prevent premature auto-refresh
    const [isInitialized, setIsInitialized] = useState<boolean>(false);

    // Load selected enterprise from localStorage and listen for changes
    useEffect(() => {
        const loadSelectedEnterprise = () => {
            try {
                console.log(
                    '🐛 [ManageglobalSettings Page] Loading localStorage values...',
                );

                const savedName = window.localStorage.getItem(
                    'selectedEnterpriseName',
                );
                const savedEnterpriseId = window.localStorage.getItem(
                    'selectedEnterpriseId',
                );
                const savedAccountId =
                    window.localStorage.getItem('selectedAccountId');
                const savedAccountName = window.localStorage.getItem(
                    'selectedAccountName',
                );

                console.log(
                    '🐛 [ManageglobalSettings Page] localStorage values:',
                    {
                        selectedEnterpriseName: savedName,
                        selectedEnterpriseId: savedEnterpriseId,
                        selectedAccountId: savedAccountId,
                        selectedAccountName: savedAccountName,
                    },
                );

                // Use functional updates to avoid dependency on current state values
                setSelectedEnterprise((prev) => {
                    const newValue = savedName || '';
                    if (newValue !== prev) {
                        return newValue;
                    }
                    return prev;
                });

                const newEnterpriseId =
                    savedEnterpriseId && savedEnterpriseId !== 'null'
                        ? savedEnterpriseId
                        : '';
                setSelectedEnterpriseId((prev) => {
                    if (newEnterpriseId !== prev) {
                        return newEnterpriseId;
                    }
                    return prev;
                });

                const newAccountId =
                    savedAccountId && savedAccountId !== 'null'
                        ? savedAccountId
                        : '';
                setSelectedAccountId((prev) => {
                    if (newAccountId !== prev) {
                        return newAccountId;
                    }
                    return prev;
                });

                const newAccountName =
                    savedAccountName && savedAccountName !== 'null'
                        ? savedAccountName
                        : '';
                setSelectedAccountName((prev) => {
                    if (newAccountName !== prev) {
                        return newAccountName;
                    }
                    return prev;
                });

                console.log(
                    '🐛 [ManageglobalSettings Page] Setting state values:',
                    {
                        enterprise: savedName || '',
                        enterpriseId: newEnterpriseId,
                        accountId: newAccountId,
                        accountName: newAccountName,
                    },
                );

                // Mark as initialized after first load
                setIsInitialized(true);
            } catch (error) {
                console.warn(
                    'Failed to load selected enterprise/account:',
                    error,
                );
                setIsInitialized(true); // Still mark as initialized even on error
            }
        };

        // Load on mount
        loadSelectedEnterprise();

        // Listen for enterprise and account changes
        const handleEnterpriseChange = () => {
            loadSelectedEnterprise();
        };

        const handleAccountChange = () => {
            loadSelectedEnterprise(); // This function loads both account and enterprise values
        };

        window.addEventListener('enterpriseChanged', handleEnterpriseChange);
        window.addEventListener('accountChanged', handleAccountChange);
        window.addEventListener('storage', handleEnterpriseChange);

        return () => {
            window.removeEventListener(
                'enterpriseChanged',
                handleEnterpriseChange,
            );
            window.removeEventListener('accountChanged', handleAccountChange);
            window.removeEventListener('storage', handleEnterpriseChange);
        };
    }, []); // Empty dependency array - only run on mount and when events fire

    // Debug: Log current state values
    useEffect(() => {
        console.log('🐛 [ManageglobalSettings Page] State updated:', {
            selectedEnterprise,
            selectedEnterpriseId,
            selectedAccountId,
            selectedAccountName,
        });
    }, [
        selectedEnterprise,
        selectedEnterpriseId,
        selectedAccountId,
        selectedAccountName,
    ]);

    const [pendingDeleteRowId, setPendingDeleteRowId] = useState<string | null>(
        null,
    );
    const [deletingRow, setDeletingRow] = useState(false);

    // Auto-save related state - use useRef to persist through re-renders
    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const globalSettingsRef = useRef<GlobalSettingsRow[]>([]);
    const modifiedExistingRecordsRef = useRef<Set<string>>(new Set());
    const originalRouterRef = useRef<any>(null); // Store original router for navigation after confirmation
    // Track original workstream names for existing records to enable proper updates when workstream name is changed
    const originalEntityNamesRef = useRef<Map<string, string>>(new Map());
    // Track last loaded account+enterprise combination to prevent duplicate API calls
    const lastLoadedCombinationRef = useRef<string>('');
    const loadDataTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [isAutoSaving, setIsAutoSaving] = useState(false);
    const [showAutoSaveSuccess, setShowAutoSaveSuccess] = useState(false);
    const [autoSaveCountdown, setAutoSaveCountdown] = useState<number | null>(
        null,
    );
    const [modifiedExistingRecords, setModifiedExistingRecords] = useState<
        Set<string>
    >(new Set());

    // Update ref to track current globalSettings state
    useEffect(() => {
        globalSettingsRef.current = globalSettings;
    }, [globalSettings]);

    // Update ref to track current modifiedExistingRecords state
    useEffect(() => {
        modifiedExistingRecordsRef.current = modifiedExistingRecords;
    }, [modifiedExistingRecords]);

    // State to track AI panel collapse state for notification positioning
    const [isAIPanelCollapsed, setIsAIPanelCollapsed] = useState(false);

    // Row animation states
    const [compressingRowId, setCompressingRowId] = useState<string | null>(
        null,
    );
    const [foldingRowId, setFoldingRowId] = useState<string | null>(null);

    // Dropdown options for chips and filters
    const [dropdownOptions, setDropdownOptions] = useState({
        accounts: [] as Array<{id: string; name: string}>,
        enterprises: [] as Array<{id: string; name: string}>,
        workstreams: [] as Array<{id: string; name: string}>,
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
        'None' | 'Workstream Name' | 'Configuration'
    >('None');
    const [groupBySelectedTools, setGroupBySelectedTools] = useState<string[]>(
        [],
    );
    const [showGroupByToolsDropdown, setShowGroupByToolsDropdown] =
        useState(false);
    const [groupByToolsQuery, setGroupByToolsQuery] = useState('');

    type ColumnType =
        | 'account'
        | 'enterprise'
        | 'workstream'
        | 'configuration'
        | 'actions';

    const [visibleCols, setVisibleCols] = useState<ColumnType[]>([
        'workstream',
        'account',
        'enterprise',
        'configuration',
    ]);

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
    const loadDropdownOptions = useCallback(async () => {
        try {
            const [rolesRes, productsRes, servicesRes] = await Promise.all([
                api.get<Array<{id: string; name: string; roleName?: string}>>(
                    '/api/user-management/roles',
                ),
                api.get<Array<{id: string; name: string}>>('/api/products'),
                api.get<Array<{id: string; name: string}>>('/api/services'),
            ]).catch((errors) => {
                console.warn('Some API endpoints failed:', errors);
                return [[], [], []];
            });

            // Extract unique workstreams from current Global Settings
            const uniqueWorkstreams = Array.from(
                new Set(
                    globalSettings
                        .map((setting) => setting.workstream)
                        .filter(Boolean),
                ),
            ).map((name, index) => ({
                id: `workstream-${name}-${index}`,
                name: name,
            }));

            setDropdownOptions({
                accounts: [],
                enterprises: [],
                workstreams: uniqueWorkstreams,
            });
        } catch (error) {
            console.error('Failed to load dropdown options:', error);
            // Set empty dropdown options on error to prevent infinite loops
            setDropdownOptions({
                accounts: [],
                enterprises: [],
                workstreams: [],
            });
        }
    }, [globalSettings]);

    // Helper function to close all dialogs
    const closeAllDialogs = () => {
        setFilterVisible(false);
        setSortOpen(false);
        setHideOpen(false);
        setGroupOpen(false);
    };

    // Function to toggle dialogs
    const toggleDialog = (dialogType: 'filter' | 'sort' | 'hide' | 'role') => {
        closeAllDialogs();
        setTimeout(() => {
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
                case 'role':
                    setGroupOpen(true);
                    break;
            }
        }, 10);
    };

    // Ref to track current filter form values for outside click handler
    const filterFormRef = useRef({
        account: '',
        enterprise: '',
        workstream: '',
        selectedTools: [] as string[],
    });

    // Filter dropdown suggestions state (declared early for use in useEffect)
    const [showSelectedToolsDropdown, setShowSelectedToolsDropdown] =
        useState(false);

    // Click outside handler to close toolbar dialogs
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
            const isOutsideFilter =
                filterRef.current && !filterRef.current.contains(target);
            const isOutsideSort =
                sortRef.current && !sortRef.current.contains(target);
            const isOutsideHide =
                hideRef.current && !hideRef.current.contains(target);
            const isOutsideGroup =
                groupRef.current && !groupRef.current.contains(target);

            // Close Filter panel if:
            // 1. Clear All was clicked, OR
            // 2. All filter fields are empty (no values entered)
            if (filterVisible && isOutsideFilter) {
                const currentForm = filterFormRef.current;
                const isFilterEmpty =
                    !currentForm.account &&
                    !currentForm.enterprise &&
                    !currentForm.workstream &&
                    (!currentForm.selectedTools ||
                        currentForm.selectedTools.length === 0);

                if (filterClearedRef.current || isFilterEmpty) {
                    setFilterVisible(false);
                    filterClearedRef.current = false; // Reset flag
                }
            }

            // Close tools dropdown on outside click
            if (showSelectedToolsDropdown && isOutsideFilter) {
                setShowSelectedToolsDropdown(false);
                setSelectedToolsQuery(''); // Clear search when closing
            }

            // Close Sort, Hide, role panels immediately on outside click
            if (sortOpen && isOutsideSort) {
                setSortOpen(false);
            }
            if (hideOpen && isOutsideHide) {
                setHideOpen(false);
            }
            if (groupOpen && isOutsideGroup) {
                setGroupOpen(false);
                setShowGroupByToolsDropdown(false);
                setGroupByToolsQuery('');
            }
            // Close group by tools dropdown on outside click
            if (showGroupByToolsDropdown && isOutsideGroup) {
                setShowGroupByToolsDropdown(false);
                setGroupByToolsQuery('');
            }
        };

        // Add event listener
        document.addEventListener('mousedown', handleClickOutside);

        // Cleanup
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [
        filterVisible,
        sortOpen,
        hideOpen,
        groupOpen,
        showSelectedToolsDropdown,
        showGroupByToolsDropdown,
    ]);

    // All available columns
    const allCols: ColumnType[] = [
        'workstream',
        'account',
        'enterprise',
        'configuration',
    ];

    // Columns available for sorting
    const sortableCols: ColumnType[] = ['workstream'];

    // Column label mapping
    const columnLabels: Record<string, string> = {
        account: 'Account',
        enterprise: 'Enterprise',
        workstream: 'Workstream Name',
        configuration: 'Configuration',
    };

    // Process Global Settings data with filtering, sorting, and search
    const processedConfigs = React.useMemo(() => {
        // Ensure all rows have account and enterprise prepopulated from selected values
        let filtered = globalSettings.map((setting) => ({
            ...setting,
            account: setting.account || selectedAccountName || '',
            enterprise: setting.enterprise || selectedEnterprise || '',
        }));

        // Apply search filter
        if (appliedSearchTerm.trim()) {
            filtered = filtered.filter((config) => {
                const searchLower = appliedSearchTerm.toLowerCase();
                return (
                    config.account?.toLowerCase().includes(searchLower) ||
                    config.enterprise?.toLowerCase().includes(searchLower) ||
                    config.workstream?.toLowerCase().includes(searchLower) ||
                    config.configuration?.toLowerCase().includes(searchLower)
                );
            });
        }

        // Apply filters
        if (activeFilters.account) {
            filtered = filtered.filter((config) =>
                config.account
                    ?.toLowerCase()
                    .includes(activeFilters.account.toLowerCase()),
            );
        }
        if (activeFilters.enterprise) {
            filtered = filtered.filter((config) =>
                config.enterprise
                    ?.toLowerCase()
                    .includes(activeFilters.enterprise.toLowerCase()),
            );
        }
        if (activeFilters.workstream) {
            filtered = filtered.filter((config) =>
                config.workstream
                    ?.toLowerCase()
                    .includes(activeFilters.workstream.toLowerCase()),
            );
        }
        if (
            activeFilters.selectedTools &&
            Array.isArray(activeFilters.selectedTools) &&
            activeFilters.selectedTools.length > 0
        ) {
            filtered = filtered.filter((config) => {
                // Get the configuration details from the row
                const configDetails =
                    config.configurationDetails ||
                    (config as any).categories ||
                    {};
                // Flatten all selected tools from all categories
                const allSelectedTools = Object.values(
                    configDetails,
                ).flat() as string[];
                // Check if any of the selected filter tools match any tool in the configuration
                return activeFilters.selectedTools.some((filterTool: string) =>
                    allSelectedTools.some(
                        (configTool: string) =>
                            configTool.toLowerCase() ===
                            filterTool.toLowerCase(),
                    ),
                );
            });
        }

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
                    case 'account':
                        valueA = (a.account || '').toString().toLowerCase();
                        valueB = (b.account || '').toString().toLowerCase();
                        break;
                    case 'enterprise':
                        valueA = (a.enterprise || '').toString().toLowerCase();
                        valueB = (b.enterprise || '').toString().toLowerCase();
                        break;
                    case 'workstream':
                        valueA = (a.workstream || '').toString().toLowerCase();
                        valueB = (b.workstream || '').toString().toLowerCase();
                        break;
                    case 'configuration':
                        valueA = (a.configuration || '')
                            .toString()
                            .toLowerCase();
                        valueB = (b.configuration || '')
                            .toString()
                            .toLowerCase();
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
        globalSettings,
        appliedSearchTerm,
        activeFilters,
        sortColumn,
        sortDirection,
        selectedAccountName,
        selectedEnterprise,
    ]);

    // Helper functions for filter management
    const applyFilters = (filters: Record<string, any>) => {
        setActiveFilters(filters);
        closeAllDialogs();
    };

    const clearFilters = () => {
        setActiveFilters({});
    };

    const applySort = (column: string, direction: 'asc' | 'desc') => {
        setSortColumn(column);
        setSortDirection(direction);
    };

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

    const clearSort = () => {
        clearSorting();
    };

    const setGroupByFromLabel = (label: string) => {
        if (
            label === 'Workstream Name' ||
            label === 'None' ||
            label === 'Configuration'
        ) {
            setActiveGroupLabel(
                label as 'Workstream Name' | 'None' | 'Configuration',
            );
            if (
                label === 'Configuration' &&
                groupBySelectedTools.length === 0
            ) {
                // Don't close if no tools selected yet
                return;
            }
        } else {
            setActiveGroupLabel('None');
        }
        closeAllDialogs();
    };

    const clearGroupBy = () => {
        setActiveGroupLabel('None');
        setGroupBySelectedTools([]);
        setGroupByToolsQuery('');
    };

    // Load User Roles from database. Accept optional filters so we can request groups
    // for a specific account/enterprise combination: { accountId, accountName, enterpriseId, enterpriseName }
    const loadGlobalSettings = useCallback(
        async (filters?: {
            accountId?: string | null;
            accountName?: string | null;
            enterpriseId?: string | null;
            enterpriseName?: string | null;
        }) => {
            setIsLoading(true);
            try {
                let url = '/api/global-settings';

                // Add account/enterprise filtering parameters if provided
                if (
                    filters &&
                    (filters.accountId ||
                        filters.accountName ||
                        filters.enterpriseId ||
                        filters.enterpriseName)
                ) {
                    const params = new URLSearchParams();

                    if (filters.accountId) {
                        params.append('accountId', filters.accountId);
                    }
                    if (filters.accountName) {
                        params.append('accountName', filters.accountName);
                    }
                    if (filters.enterpriseId) {
                        params.append('enterpriseId', filters.enterpriseId);
                    }
                    if (filters.enterpriseName) {
                        params.append('enterpriseName', filters.enterpriseName);
                    }

                    url += `?${params.toString()}`;
                }

                console.log('🌐 [API Call] Making request to:', url);
                console.log('🔍 [API Call] Filters applied:', filters);
                console.log(
                    '🌐 [API Call] Full URL being called:',
                    `${API_BASE || 'http://localhost:3000'}${url}`,
                );

                // Clear original workstream names ref when loading new data to avoid stale entries
                originalEntityNamesRef.current.clear();

                const response = await api.get<any>(url);

                console.log('📥 [API Response] Raw response:', response);
                console.log(
                    '📥 [API Response] Response type:',
                    typeof response,
                );
                console.log(
                    '📥 [API Response] Response keys:',
                    response ? Object.keys(response) : 'null',
                );

                let settingsData = response;
                console.log(
                    '🔄 [API Processing] Initial settingsData:',
                    settingsData,
                );

                if (
                    response &&
                    typeof response === 'object' &&
                    'data' in response
                ) {
                    settingsData = response.data;
                    console.log(
                        '🔄 [API Processing] Extracted data property:',
                        settingsData,
                    );
                    if (
                        settingsData &&
                        typeof settingsData === 'object' &&
                        'settings' in settingsData
                    ) {
                        settingsData = settingsData.settings;
                        console.log(
                            '🔄 [API Processing] Extracted settings property:',
                            settingsData,
                        );
                    }
                }

                console.log(
                    '🔄 [API Processing] Final settingsData:',
                    settingsData,
                );
                console.log(
                    '🔄 [API Processing] settingsData is array?',
                    Array.isArray(settingsData),
                );
                console.log(
                    '🔄 [API Processing] settingsData length:',
                    Array.isArray(settingsData) ? settingsData.length : 'N/A',
                );

                if (settingsData && Array.isArray(settingsData)) {
                    console.log(
                        '🔍 [API Processing] Raw settings data from API:',
                        JSON.stringify(settingsData, null, 2),
                    );

                    const formattedSettings: GlobalSettingsRow[] =
                        settingsData.map((setting: any, index: number) => {
                            console.log(
                                `🔍 [API Processing] Processing setting ${index}:`,
                                {
                                    id: setting.id,
                                    account:
                                        setting.account || setting.accountName,
                                    enterprise:
                                        setting.enterprise ||
                                        setting.enterpriseName,
                                    workstream:
                                        setting.workstream ||
                                        setting.workstreamName,
                                    configuration: setting.configuration,
                                    configurationDetails:
                                        setting.configurationDetails,
                                    rawSetting: setting,
                                },
                            );

                            // Calculate configuration field value from configurationDetails (matching backup file logic)
                            // API may return configuration as an object (categories) or as a string, or as categories/configurationDetails
                            const configurationDetails =
                                setting.configurationDetails ||
                                setting.categories ||
                                (typeof setting.configuration === 'object' &&
                                setting.configuration !== null
                                    ? setting.configuration
                                    : {});
                            const toolCount = Object.values(
                                configurationDetails,
                            ).reduce(
                                (sum: number, arr: any) =>
                                    sum + (Array.isArray(arr) ? arr.length : 0),
                                0,
                            );
                            const configuration =
                                toolCount > 0
                                    ? `${toolCount} tools selected`
                                    : 'Not configured';

                            const newSetting: GlobalSettingsRow = {
                                id: setting.id?.toString() || generateId(),
                                account:
                                    setting.account ||
                                    setting.accountName ||
                                    filters?.accountName ||
                                    selectedAccountName ||
                                    '',
                                accountId:
                                    setting.accountId ||
                                    filters?.accountId ||
                                    selectedAccountId ||
                                    '',
                                enterprise:
                                    setting.enterprise ||
                                    setting.enterpriseName ||
                                    filters?.enterpriseName ||
                                    selectedEnterprise ||
                                    '',
                                enterpriseId:
                                    setting.enterpriseId ||
                                    filters?.enterpriseId ||
                                    selectedEnterpriseId ||
                                    '',
                                workstream:
                                    setting.workstream ||
                                    setting.workstreamName ||
                                    '',
                                configuration: configuration,
                                configurationDetails: configurationDetails,
                                isConfigured:
                                    toolCount > 0 ||
                                    setting.isConfigured ||
                                    false,
                            };

                            console.log(
                                `✅ [API Processing] Formatted setting ${index}:`,
                                newSetting,
                            );

                            // Track display order
                            displayOrderRef.current.set(newSetting.id, index);

                            // Store original workstream name for existing records (not temporary ones)
                            if (
                                !String(newSetting.id).startsWith('tmp-') &&
                                !String(newSetting.id).startsWith('setting-')
                            ) {
                                originalEntityNamesRef.current.set(
                                    newSetting.id,
                                    newSetting.workstream,
                                );
                            }

                            return newSetting;
                        });

                    console.log(
                        '✅ [API Processing] Setting Global Settings:',
                        formattedSettings,
                    );
                    setGlobalSettings(formattedSettings);
                } else {
                    console.log(
                        '❌ [API Processing] No valid settings data found - setting empty array',
                    );
                    setGlobalSettings([]);
                }
            } catch (error) {
                console.error('Failed to load Global Settings:', error);
                setGlobalSettings([]);

                // Provide specific error feedback based on error type
                let errorMessage = 'Failed to load Global Settings';
                if (error && typeof error === 'object') {
                    const err = error as any;
                    if (err.response?.status === 500) {
                        errorMessage =
                            'Server error: Unable to load Global Settings. Please try again or contact support.';
                    } else if (err.response?.status === 404) {
                        errorMessage =
                            'No Global Settings found for the selected Account and Enterprise combination.';
                    } else if (err.response?.status === 403) {
                        errorMessage =
                            'Access denied: You do not have permission to view Global Settings for this Account and Enterprise.';
                    } else if (err.message) {
                        errorMessage = `Failed to load Global Settings: ${err.message}`;
                    }
                }

                // Only show notification on first load failure. Use ref to get latest value.
                if ((globalSettingsRef.current?.length || 0) === 0) {
                    showBlueNotification(errorMessage, 5000, false);
                }
            } finally {
                setIsLoading(false);
            }
        },
        [],
    );

    // Load Global Settings on mount and whenever the selected account/enterprise changes.
    // This ensures that when the top-right account dropdown changes (and the enterprise
    // selection remains), the table refreshes automatically for that Account+Enterprise.
    // ALWAYS requires both Account and Enterprise to be selected.
    useEffect(() => {
        // Clear any pending timeout
        if (loadDataTimeoutRef.current) {
            clearTimeout(loadDataTimeoutRef.current);
            loadDataTimeoutRef.current = null;
        }

        // Don't run auto-refresh until localStorage initialization is complete
        if (!isInitialized) {
            console.log(
                '🔄 [ManageGlobalSettings] Waiting for initialization...',
            );
            return;
        }

        // Debounce the load to handle rapid state updates from multiple events
        loadDataTimeoutRef.current = setTimeout(() => {
            // Read enterpriseId from localStorage (some other components keep the id there)
            const enterpriseId =
                typeof window !== 'undefined'
                    ? window.localStorage.getItem('selectedEnterpriseId')
                    : null;

            // Create a unique key for the current account+enterprise combination
            const currentCombination = `${selectedAccountId || ''}_${
                enterpriseId || selectedEnterpriseId || ''
            }`;

            // Skip if this combination was already loaded (prevents duplicate API calls)
            if (
                currentCombination === lastLoadedCombinationRef.current &&
                currentCombination !== ''
            ) {
                console.log(
                    '⏭️ [ManageGlobalSettings] Skipping duplicate load for combination:',
                    currentCombination,
                );
                return;
            }

            console.log(
                '🔄 [ManageGlobalSettings] Loading Global Settings with context:',
                {
                    selectedAccountId,
                    selectedAccountName,
                    selectedEnterprise,
                    enterpriseId,
                    hasAccountId: !!selectedAccountId,
                    hasEnterprise: !!(selectedEnterprise || enterpriseId),
                    isInitialized,
                    currentCombination,
                    lastLoaded: lastLoadedCombinationRef.current,
                },
            );

            // Clear existing data immediately when enterprise/account changes to prevent stale data
            setGlobalSettings([]);

            // ONLY load data if both account id and enterprise selection exist
            if (selectedAccountId && (selectedEnterprise || enterpriseId)) {
                console.log(
                    '✅ [ManageGlobalSettings] Both Account and Enterprise selected, loading filtered data',
                );

                // Update the last loaded combination before making the API call
                lastLoadedCombinationRef.current = currentCombination;

                loadGlobalSettings({
                    accountId: selectedAccountId,
                    accountName: selectedAccountName || null,
                    enterpriseId: enterpriseId || null,
                    enterpriseName: selectedEnterprise || null,
                });
                return;
            }

            // Clear table and show message when required context is missing
            console.log(
                '⚠️ [ManageGlobalSettings] Missing Account or Enterprise selection, clearing table',
            );
            setGlobalSettings([]);
            setIsLoading(false);

            // Reset the last loaded combination when clearing
            lastLoadedCombinationRef.current = '';

            // Show a notification to guide user (only after initialization to avoid false warnings)
            if (!selectedAccountId) {
                showBlueNotification(
                    'Please select an Account from the top-right dropdown to view User Roles',
                    5000,
                    false,
                );
            }
            // Enterprise notification removed - enterprise is now auto-selected based on account licenses
        }, 100); // 100ms debounce to batch rapid state updates

        // Cleanup timeout on unmount or when dependencies change
        return () => {
            if (loadDataTimeoutRef.current) {
                clearTimeout(loadDataTimeoutRef.current);
                loadDataTimeoutRef.current = null;
            }
        };
    }, [
        selectedAccountId,
        selectedAccountName,
        selectedEnterprise,
        selectedEnterpriseId,
        isInitialized,
        loadGlobalSettings,
    ]);

    // Load dropdown options whenever globalSettings changes - use a ref to prevent infinite loops
    const dropdownOptionsLoadedRef = useRef(false);
    const globalSettingsCountRef = useRef(0);
    useEffect(() => {
        if (
            !isLoading &&
            globalSettings.length > 0 &&
            (globalSettings.length !== globalSettingsCountRef.current ||
                !dropdownOptionsLoadedRef.current)
        ) {
            globalSettingsCountRef.current = globalSettings.length;
            dropdownOptionsLoadedRef.current = true;
            loadDropdownOptions();
        }
    }, [globalSettings.length, loadDropdownOptions, isLoading]);

    // Clear auto-save timer on component unmount - exactly like Manage Users
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

    // Effect to detect AI panel collapse state by observing its width - exactly like Manage Users
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

    // Function to check if there's a blank row - exactly like Manage Users
    const hasBlankRow = () => {
        return globalSettings.some((setting) => {
            const isTemporary = String(setting.id).startsWith('tmp-');
            const isEmpty = !setting.workstream;
            return isTemporary && isEmpty;
        });
    };

    // Function to validate incomplete rows and return validation details - exactly like Manage Users
    const validateIncompleteRows = () => {
        // Get all temporary (unsaved) rows
        const temporaryRows = globalSettings.filter((role: any) =>
            String(role.id).startsWith('tmp-'),
        );

        // Get all existing rows
        const existingRows = globalSettings.filter(
            (role: any) => !String(role.id).startsWith('tmp-'),
        );

        // Check for incomplete temporary rows
        // In Global Settings, Entity Name is the only mandatory field
        // A row is incomplete if Entity Name is missing
        // Note: We want to catch ALL temporary rows without Entity Name, including completely blank ones
        // because hasBlankRow() only prevents adding if there's ONE blank row, but we want to prevent
        // adding if there are ANY incomplete rows (including multiple blank rows)
        const incompleteTemporaryRows = temporaryRows.filter((setting: any) => {
            const hasEntity = setting.workstream?.trim();
            // Any temporary row without Entity Name is incomplete
            return !hasEntity;
        });

        // Check for incomplete existing rows
        // Existing rows should always have Entity Name, but check anyway
        const incompleteExistingRows = existingRows.filter((setting: any) => {
            const hasEntity = setting.workstream?.trim();
            // If Entity Name is missing, it's incomplete
            return !hasEntity;
        });

        // Combine all incomplete rows
        const incompleteRows = [
            ...incompleteTemporaryRows,
            ...incompleteExistingRows,
        ];

        if (incompleteRows.length > 0) {
            const missingFields = new Set<string>();
            incompleteRows.forEach((setting) => {
                if (!setting.workstream?.trim())
                    missingFields.add('Workstream Name');
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

    // Handle adding new User Role row
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

        // Check for incomplete rows before adding new row
        const validation = validateIncompleteRows();
        if (validation.hasIncomplete) {
            // Show validation modal - exactly like Manage User Roles
            setValidationMessage(validation.message);
            setShowValidationErrors(true);
            setIncompleteRows(validation.incompleteRows.map((r: any) => r.id));
            setShowValidationModal(true);

            return;
        }

        const newRole: GlobalSettingsRow = {
            id: `tmp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            account: selectedAccountName || '',
            accountId: selectedAccountId || '',
            enterprise: selectedEnterprise || '',
            enterpriseId: selectedEnterpriseId || '',
            workstream: '',
            configuration: '',
            configurationDetails: {},
            isConfigured: false,
        };

        // Add to end of array with display order
        displayOrderRef.current.set(newRole.id, Date.now());

        setGlobalSettings([...globalSettings, newRole]);

        // Clear validation errors when adding a new row to ensure new rows start with normal styling
        if (showValidationErrors) {
            setShowValidationErrors(false);
            setExternalFieldErrors({});
        }

        console.log('➕ Added new blank row:', newRole.id);
    };

    // Ref to store the autosave function
    const debouncedAutoSaveRef = useRef<(() => void) | null>(null);

    // Handle field updates
    const handleUpdateField = useCallback(
        (rowId: string, field: string, value: any) => {
            console.log('🔄 handleUpdateField called:', {rowId, field, value});

            // First, update the state
            let updatedGroup: GlobalSettingsRow | null = null;
            setGlobalSettings((prev) => {
                // Always create new array and new objects for React to detect changes
                return prev.map((setting) => {
                    if (setting.id === rowId) {
                        // Track if this is an existing record (not temporary)
                        if (!String(rowId).startsWith('tmp-')) {
                            setModifiedExistingRecords((prevModified) => {
                                const newSet = new Set(prevModified);
                                newSet.add(String(rowId));
                                return newSet;
                            });
                        }

                        // Create new object with updated field
                        updatedGroup = {...setting, [field]: value};

                        // If configurationDetails was updated, recalculate configuration field (matching backup file logic)
                        if (field === 'configurationDetails' && updatedGroup) {
                            const configurationDetails = value || {};
                            const toolCount = Object.values(
                                configurationDetails,
                            ).reduce(
                                (sum: number, arr: any) =>
                                    sum + (Array.isArray(arr) ? arr.length : 0),
                                0,
                            );
                            updatedGroup.configuration =
                                toolCount > 0
                                    ? `${toolCount} tools selected`
                                    : 'Not configured';
                            updatedGroup.isConfigured = toolCount > 0;
                        }

                        return updatedGroup;
                    }
                    return setting; // Return same reference for unchanged rows
                });
            });

            // Check if all mandatory fields are now filled for this row
            if (updatedGroup) {
                // For global settings, only Entity Name is mandatory
                const hasEntity =
                    (updatedGroup as any).workstream?.trim() &&
                    (updatedGroup as any).workstream.trim().length > 0;

                const isComplete = hasEntity;

                console.log('🔍 Checking if row is complete after update:', {
                    rowId,
                    field,
                    value,
                    hasEntity,
                    isComplete,
                });

                // Don't trigger autosave when workstream name is entered
                // Autosave will be triggered only after:
                // 1. Saving configuration in the modal (coming back to main screen)
                // 2. Manually clicking save button
                // Clear autosave timer if row becomes incomplete
                if (!isComplete) {
                    console.log(
                        '⏸️ Not all mandatory fields filled - clearing autosave timer if exists',
                    );
                    if (autoSaveTimerRef.current) {
                        clearTimeout(autoSaveTimerRef.current);
                        autoSaveTimerRef.current = null;
                        setAutoSaveCountdown(null);
                        if (countdownIntervalRef.current) {
                            clearInterval(countdownIntervalRef.current);
                            countdownIntervalRef.current = null;
                        }
                    }
                } else {
                    console.log(
                        '✅ All mandatory fields filled - autosave will trigger after saving configuration in modal',
                    );
                }
            }
        },
        [],
    );

    // Row squeeze animation sequence - exactly like Manage Users
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
        setShowDeleteConfirmation(true);
        setFoldingRowId(null);
    };

    // Handle delete confirmation
    const handleDeleteClick = (groupId: string) => {
        startRowCompressionAnimation(groupId);
    };

    const confirmDelete = async () => {
        if (!pendingDeleteRowId) return;

        setDeletingRow(true);
        try {
            console.log('🗑️ Deleting User Role:', pendingDeleteRowId);

            // Add a small delay to show the loading state
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Find the role to be deleted for debugging
            const settingToDelete = globalSettings.find(
                (s) => s.id === pendingDeleteRowId,
            );
            console.log('📄 Global Setting data to delete:', settingToDelete);

            // Delete from database via API (only if not a temporary row)
            if (
                !String(pendingDeleteRowId).startsWith('tmp-') &&
                settingToDelete
            ) {
                try {
                    // Build delete URL with query parameters
                    const deleteParams = new URLSearchParams();
                    if (selectedAccountId)
                        deleteParams.append('accountId', selectedAccountId);
                    if (selectedAccountName)
                        deleteParams.append('accountName', selectedAccountName);
                    if (selectedEnterpriseId)
                        deleteParams.append(
                            'enterpriseId',
                            selectedEnterpriseId,
                        );
                    if (selectedEnterprise)
                        deleteParams.append(
                            'enterpriseName',
                            selectedEnterprise,
                        );

                    const deleteUrl = `/api/global-settings/${
                        settingToDelete.workstream
                    }?${deleteParams.toString()}`;
                    console.log(
                        '🗑️ Deleting Global Setting with URL:',
                        deleteUrl,
                    );

                    await api.del(deleteUrl);
                    console.log(
                        '✅ Global Setting deleted from database via API',
                    );
                } catch (error) {
                    console.error(
                        '❌ Error deleting Global Setting from database:',
                        error,
                    );
                    throw new Error(
                        'Failed to delete Global Setting from database',
                    );
                }
            } else {
                console.log(
                    'ℹ️ Temporary row - only removing from frontend state and localStorage',
                );
                // Remove temporary row from localStorage if needed
                const storedGroups = localStorage.getItem('user-groups-data');
                if (storedGroups) {
                    try {
                        const groupsData = JSON.parse(storedGroups);
                        const updatedGroupsData = groupsData.filter(
                            (g: any) => g.id !== pendingDeleteRowId,
                        );
                        localStorage.setItem(
                            'user-groups-data',
                            JSON.stringify(updatedGroupsData),
                        );
                        console.log(
                            '✅ Temporary User Role deleted from localStorage',
                        );
                    } catch (error) {
                        console.error('Error updating localStorage:', error);
                    }
                }
            }

            // Remove from local state
            setGlobalSettings((prev) => {
                const updated = prev.filter(
                    (role) => role.id !== pendingDeleteRowId,
                );
                // Apply stable sorting to maintain display order
                return sortConfigsByDisplayOrder(updated);
            });

            console.log('✅ Global Setting deleted successfully');

            // Show success notification
            showBlueNotification('Successfully deleted 1 entries.');

            // Close modal and reset state
            setShowDeleteConfirmation(false);
            setPendingDeleteRowId(null);
            setCompressingRowId(null);
            setFoldingRowId(null);
        } catch (error) {
            console.error('❌ Failed to delete Global Setting:', error);
            console.error('❌ Full error details:', {
                error,
                pendingDeleteRowId,
                storageType: 'database',
            });

            // Log the specific error message if available
            if (error instanceof Error) {
                console.error('❌ Error message:', error.message);
            }

            // Show error notification
            showBlueNotification(
                'Failed to delete Global Setting. Please try again.',
                5000,
                false,
            );
        } finally {
            setDeletingRow(false);
        }
    };

    // Auto-save new User Role when all required fields are filled - exactly like Manage Users
    const autoSaveNewGlobalSetting = async (
        tempRowId: string,
        updatedSetting?: any,
    ) => {
        console.log(
            '🚀 autoSaveNewGlobalSetting function called with tempRowId:',
            tempRowId,
        );

        // Mark row as saving
        setSavingRows((prev) => new Set([...Array.from(prev), tempRowId]));

        // Use the provided updated setting or find it from current ref state
        const setting =
            updatedSetting ||
            globalSettingsRef.current.find((g) => g.id === tempRowId);
        if (!setting) {
            console.error(
                '❌ Global Setting not found for auto-save:',
                tempRowId,
            );
            setSavingRows((prev) => {
                const newSet = new Set(prev);
                newSet.delete(tempRowId);
                return newSet;
            });
            return;
        }

        console.log('💾 Auto-saving new Global Setting:', setting);

        // Check for duplicate entry (same workstream name for the same account and enterprise)
        const isDuplicate = globalSettingsRef.current.some(
            (existingSetting) => {
                // Skip the current temporary row being saved
                if (existingSetting.id === tempRowId) return false;

                // Check if workstream name matches for the same account and enterprise
                return (
                    existingSetting.workstream?.toLowerCase().trim() ===
                        setting.workstream?.toLowerCase().trim() &&
                    existingSetting.account?.toLowerCase().trim() ===
                        setting.account?.toLowerCase().trim() &&
                    existingSetting.enterprise?.toLowerCase().trim() ===
                        setting.enterprise?.toLowerCase().trim()
                );
            },
        );

        if (isDuplicate) {
            console.error(
                '❌ Duplicate entry detected - Global Setting with same Entity Name, Account, and Enterprise already exists',
            );

            // Mark that duplicate was detected (to suppress generic error notification)
            duplicateDetectedRef.current = true;

            // Clear autosave timer and countdown
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
                autoSaveTimerRef.current = null;
            }
            if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
            }
            setAutoSaveCountdown(null);
            setIsAutoSaving(false);

            // Show duplicate modal
            setDuplicateMessage(
                `This combination of Workstream Name (${setting.workstream}), Account (${setting.account}), and Enterprise (${setting.enterprise}) already exists in another row. Please use a different combination.`,
            );
            setShowDuplicateModal(true);

            // Don't save the duplicate - return early instead of throwing error
            setSavingRows((prev) => {
                const newSet = new Set(prev);
                newSet.delete(tempRowId);
                return newSet;
            });
            return; // Exit early without saving
        }

        // Check if a setting with this workstream name already exists in the database (created via + Add button)
        console.log(
            '🔍 [AutoSave] Checking if setting exists in database:',
            setting.workstream,
        );
        const checkQueryParams = new URLSearchParams();
        checkQueryParams.append('workstreamName', setting.workstream);
        if (selectedAccountId)
            checkQueryParams.append('accountId', selectedAccountId);
        if (selectedAccountName)
            checkQueryParams.append('accountName', selectedAccountName);
        if (selectedEnterpriseId)
            checkQueryParams.append('enterpriseId', selectedEnterpriseId);
        if (selectedEnterprise)
            checkQueryParams.append('enterpriseName', selectedEnterprise);

        try {
            const existingSettingsResponse = await api.get<any[]>(
                `/api/global-settings?${checkQueryParams.toString()}`,
            );
            console.log(
                '📦 [AutoSave] Existing settings response:',
                existingSettingsResponse,
            );

            const existingSettingsArray = Array.isArray(
                existingSettingsResponse,
            )
                ? existingSettingsResponse
                : [];
            const exactMatch = existingSettingsArray.find(
                (s: any) =>
                    (s.workstreamName || s.workstream)?.toLowerCase().trim() ===
                    setting.workstream.toLowerCase().trim(),
            );

            if (exactMatch) {
                // setting already exists (created via + Add button), UPDATE it with the filled fields
                console.log(
                    '✅ [AutoSave] Found existing setting created via + Add, updating with fields:',
                    exactMatch.id,
                );
                // API stores categories in 'configuration' field as an object
                const categoriesData =
                    setting.configurationDetails ||
                    setting.categories ||
                    (typeof setting.configuration === 'object' &&
                    setting.configuration !== null
                        ? setting.configuration
                        : {});
                const updateData = {
                    workstreamName: setting.workstream, // Send workstream name
                    workstreams: [setting.workstream], // Also send as workstreams array (like detail page does)
                    configuration: categoriesData, // API stores categories in 'configuration' field as object
                    configurationDetails: categoriesData,
                    categories: categoriesData, // Also save as categories for compatibility
                    accountId: selectedAccountId,
                    accountName: selectedAccountName,
                    enterpriseId: selectedEnterpriseId,
                    enterpriseName: selectedEnterprise,
                };

                console.log(
                    '📦 [AutoSave] Updating setting with data:',
                    updateData,
                );
                try {
                    // Use record ID in the URL path (like the detail page does) to allow workstream name updates
                    await api.put(
                        `/api/global-settings/${exactMatch.id}`,
                        updateData,
                    );
                } catch (error: any) {
                    // Backend may return empty response - this is okay if the error is JSON parsing related
                    if (
                        error?.message?.includes('Unexpected end of JSON input')
                    ) {
                        console.log(
                            '⚠️ [AutoSave] Backend returned empty response - treating as success',
                        );
                    } else {
                        throw error; // Re-throw if it's a different error
                    }
                }

                // Get the display order before updating
                const oldDisplayOrder = displayOrderRef.current.get(tempRowId);

                // Update the row ID in state to use the real database ID
                setGlobalSettings((prev) => {
                    const updated = prev.map((g) =>
                        g.id === tempRowId
                            ? {
                                  ...g,
                                  id: exactMatch.id,
                                  updatedAt: new Date().toISOString(),
                              }
                            : g,
                    );
                    // Apply stable sorting to maintain display order
                    return sortConfigsByDisplayOrder(updated);
                });

                // Update display order reference with the new ID
                if (oldDisplayOrder !== undefined) {
                    displayOrderRef.current.delete(tempRowId); // Remove old reference
                    displayOrderRef.current.set(exactMatch.id, oldDisplayOrder); // Add new reference
                    console.log(
                        `📍 [AutoSave] Preserved display order ${oldDisplayOrder} for updated setting ID ${exactMatch.id}`,
                    );
                }

                // Store original workstream name for the updated record
                originalEntityNamesRef.current.set(
                    exactMatch.id,
                    setting.workstream,
                );
                console.log(
                    `📍 [AutoSave] Stored original workstream name for updated record ${exactMatch.id}:`,
                    setting.workstream,
                );

                console.log(
                    '✅ [AutoSave] Updated existing setting with filled fields:',
                    exactMatch.id,
                );

                // Clean up after successful update
                setSavingRows((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(tempRowId);
                    return newSet;
                });
            } else {
                // setting doesn't exist, CREATE it
                const newId = `setting-${Date.now()}-${Math.random()}`;
                // API stores categories in 'configuration' field as an object
                const categoriesData =
                    setting.configurationDetails ||
                    setting.categories ||
                    (typeof setting.configuration === 'object' &&
                    setting.configuration !== null
                        ? setting.configuration
                        : {});
                const settingData = {
                    workstreamName: setting.workstream, // API expects workstreamName
                    configuration: categoriesData, // API stores categories in 'configuration' field as object
                    configurationDetails: categoriesData,
                    categories: categoriesData, // Also save as categories for compatibility
                    accountId: selectedAccountId,
                    accountName: selectedAccountName,
                    enterpriseId: selectedEnterpriseId,
                    enterpriseName: selectedEnterprise,
                };

                console.log(
                    '📡 [AutoSave] Calling API POST /api/global-settings with data:',
                    settingData,
                );
                const savedSetting = (await api.post(
                    '/api/global-settings',
                    settingData,
                )) as any;
                console.log(
                    '📥 [AutoSave] API Response received:',
                    savedSetting,
                );
                console.log(
                    '📥 [AutoSave] API Response type:',
                    typeof savedSetting,
                );
                console.log(
                    '📥 [AutoSave] API Response has id?',
                    savedSetting?.id,
                );

                const savedSettingId = savedSetting?.id || newId;
                console.log(
                    '🆔 [AutoSave] Using saved setting ID:',
                    savedSettingId,
                );

                // Verify the API actually returned a real ID from the database
                if (!savedSetting?.id) {
                    console.error(
                        '⚠️ [AutoSave] WARNING: API did not return an ID. Response:',
                        savedSetting,
                    );
                    showBlueNotification(
                        'Failed to save Global Setting - API did not return a valid ID. Please try again.',
                        5000,
                        false,
                    );
                    setSavingRows((prev) => {
                        const newSet = new Set(prev);
                        newSet.delete(tempRowId);
                        return newSet;
                    });
                    return;
                }

                // Get the display order before updating
                const oldDisplayOrder = displayOrderRef.current.get(tempRowId);

                // Update the accounts state with the new ID
                setGlobalSettings((prev) => {
                    const updated = prev.map((s) =>
                        s.id === tempRowId
                            ? {
                                  ...s,
                                  id: savedSettingId,
                                  createdAt: new Date().toISOString(),
                                  updatedAt: new Date().toISOString(),
                              }
                            : s,
                    );
                    // Apply stable sorting to maintain display order
                    return sortConfigsByDisplayOrder(updated);
                });

                // Update display order reference with the new ID
                if (oldDisplayOrder !== undefined) {
                    displayOrderRef.current.delete(tempRowId); // Remove old reference
                    displayOrderRef.current.set(
                        savedSettingId,
                        oldDisplayOrder,
                    ); // Add new reference
                    console.log(
                        `📍 [AutoSave] Preserved display order ${oldDisplayOrder} for new Global Setting ID ${savedSettingId}`,
                    );
                }

                // Store original workstream name for the newly created record
                originalEntityNamesRef.current.set(
                    savedSettingId,
                    setting.workstream,
                );
                console.log(
                    `📍 [AutoSave] Stored original workstream name for new record ${savedSettingId}:`,
                    setting.workstream,
                );

                console.log(
                    '🎉 [AutoSave] New Global Setting saved successfully to database with ID:',
                    savedSettingId,
                );

                // Clean up after successful save
                setSavingRows((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(tempRowId);
                    return newSet;
                });
            }
        } catch (apiError) {
            console.error(
                '❌ [AutoSave] Failed to save Global Setting to database:',
                apiError,
            );
            console.error(
                '❌ [AutoSave] Error details:',
                JSON.stringify(apiError, null, 2),
            );

            // Show error notification instead of throwing
            showBlueNotification(
                'Failed to auto-save Global Setting. Please try saving manually.',
                5000,
                false,
            );

            // Clean up saving state
            setSavingRows((prev) => {
                const newSet = new Set(prev);
                newSet.delete(tempRowId);
                return newSet;
            });
        }
    };

    // Debounced auto-save function with countdown - exactly like Manage Users
    const debouncedAutoSave = useCallback(async () => {
        console.log(
            '🕐 debouncedAutoSave called - clearing existing timer and starting new one',
        );

        // Clear existing timer
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
            clearInterval(countdownIntervalRef.current!);
        }

        // Clear validation errors when auto-save timer starts (user is actively editing)
        if (showValidationErrors) {
            console.log(
                '🧹 Clearing validation errors as user is actively editing',
            );
            setShowValidationErrors(false);
            setExternalFieldErrors({});
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

                // Clear the timer ref immediately since it's now executing - prevents navigation warning
                autoSaveTimerRef.current = null;
                console.log(
                    '✅ Cleared autoSaveTimerRef - navigation should be allowed during autosave execution',
                );

                // Reset duplicate detection flag at the start of each autosave
                duplicateDetectedRef.current = false;

                setIsAutoSaving(true);
                setAutoSaveCountdown(null);
                clearInterval(countdownIntervalRef.current!);
                countdownIntervalRef.current = null;

                // Get all temporary (unsaved) rows that are complete using current ref
                const temporaryRows = globalSettingsRef.current.filter(
                    (setting) => {
                        const isTemp = String(setting.id).startsWith('tmp-');
                        if (!isTemp) return false;

                        // Check if Global Setting row is complete (has Entity Name)
                        const hasEntity =
                            setting.workstream?.trim() &&
                            setting.workstream.trim().length > 0;

                        const isComplete = hasEntity;

                        if (isTemp && !isComplete) {
                            console.log(
                                `🚫 Skipping incomplete temporary Global Setting ${setting.id}:`,
                                {
                                    hasEntity: !!hasEntity,
                                    workstreamValue: setting.workstream,
                                },
                            );
                        }

                        return isComplete;
                    },
                );

                // Get all modified existing records that are still complete
                const modifiedRows = globalSettingsRef.current.filter(
                    (setting) => {
                        const isExisting = !String(setting.id).startsWith(
                            'tmp-',
                        );
                        const isModified =
                            modifiedExistingRecordsRef.current.has(
                                String(setting.id),
                            );

                        if (isExisting && isModified) {
                            // Double-check that the record still has all required fields
                            const hasEntity = setting.workstream?.trim();

                            const isComplete = hasEntity;

                            console.log(
                                `🔍 Checking modified Global Setting ${setting.id}: isComplete=${isComplete}`,
                                {
                                    hasEntity: !!hasEntity,
                                    workstreamValue: setting.workstream,
                                },
                            );

                            return isComplete;
                        }

                        console.log(
                            `🔍 Checking Global Setting ${setting.id}: isExisting=${isExisting}, isModified=${isModified}`,
                        );
                        return false;
                    },
                );

                console.log(
                    `📊 Found ${temporaryRows.length} complete temporary Global Settings to auto-save`,
                );
                console.log(
                    `📊 Found ${modifiedRows.length} modified existing Global Settings to auto-save`,
                );

                // Check for orphaned records in modifiedExistingRecords
                const orphanedRecords = Array.from(
                    modifiedExistingRecordsRef.current,
                ).filter(
                    (recordId) =>
                        !globalSettingsRef.current.find(
                            (setting) => String(setting.id) === recordId,
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
                        '💾 Auto-saving Global Settings after 10 seconds of inactivity...',
                        temporaryRows.map((r) => r.id),
                    );

                    let successCount = 0;
                    let failureCount = 0;

                    // Save new temporary Global Settings
                    for (const tempRow of temporaryRows) {
                        console.log(
                            `💾 Auto-saving Global Setting: ${tempRow.id}`,
                        );

                        // Reset duplicate flag before each save attempt
                        const duplicateFlagBefore =
                            duplicateDetectedRef.current;

                        try {
                            await autoSaveNewGlobalSetting(tempRow.id);

                            // Check if duplicate was detected during save
                            if (
                                !duplicateDetectedRef.current ||
                                duplicateFlagBefore ===
                                    duplicateDetectedRef.current
                            ) {
                                // Only count as success if no duplicate was detected
                                successCount++;
                            } else {
                                // Duplicate detected - don't count as success or failure
                                console.log(
                                    'ℹ️ Duplicate detected - not counting as success or failure',
                                );
                            }
                        } catch (error) {
                            console.error(
                                `❌ Failed to auto-save new Global Setting ${tempRow.id}:`,
                                error,
                            );
                            // Only count as failure if not a duplicate (duplicate modal already shown)
                            if (!duplicateDetectedRef.current) {
                                failureCount++;
                            }
                        }
                    }

                    // Save modified existing User Roles to database via API
                    for (const modifiedRow of modifiedRows) {
                        console.log(
                            `💾 Saving modified existing User Role: ${modifiedRow.id}`,
                        );
                        try {
                            // Check for duplicate entry (same roleName + entity + product + service as another record)
                            const isDuplicate = globalSettingsRef.current.some(
                                (existingSetting) => {
                                    // Skip the current row being updated
                                    if (existingSetting.id === modifiedRow.id)
                                        return false;

                                    // Check if workstream name matches for the same account and enterprise
                                    return (
                                        existingSetting.workstream
                                            ?.toLowerCase()
                                            .trim() ===
                                            modifiedRow.workstream
                                                ?.toLowerCase()
                                                .trim() &&
                                        existingSetting.account
                                            ?.toLowerCase()
                                            .trim() ===
                                            modifiedRow.account
                                                ?.toLowerCase()
                                                .trim() &&
                                        existingSetting.enterprise
                                            ?.toLowerCase()
                                            .trim() ===
                                            modifiedRow.enterprise
                                                ?.toLowerCase()
                                                .trim()
                                    );
                                },
                            );

                            if (isDuplicate) {
                                console.error(
                                    `❌ Duplicate entry detected for autosave update: ${modifiedRow.workstream}`,
                                );

                                // Mark that duplicate was detected (to suppress generic error notification)
                                duplicateDetectedRef.current = true;

                                // Show duplicate modal
                                setDuplicateMessage(
                                    `This combination of Workstream Name (${modifiedRow.workstream}), Account (${modifiedRow.account}), and Enterprise (${modifiedRow.enterprise}) already exists in another row. Please use a different combination.`,
                                );
                                setShowDuplicateModal(true);

                                failureCount++;
                                continue; // Skip this row
                            }

                            // Get the original workstream name for this record (before any edits)
                            const originalEntityName =
                                originalEntityNamesRef.current.get(
                                    modifiedRow.id,
                                ) || modifiedRow.workstream;
                            const entityNameChanged =
                                modifiedRow.workstream !== originalEntityName;
                            console.log(
                                '🔍 [AutoSave Update] Original workstream name:',
                                originalEntityName,
                                'New workstream name:',
                                modifiedRow.workstream,
                                'Changed:',
                                entityNameChanged,
                            );

                            // API stores categories in 'configuration' field as an object
                            const categoriesData =
                                modifiedRow.configurationDetails ||
                                (modifiedRow as any).categories ||
                                (typeof modifiedRow.configuration ===
                                    'object' &&
                                modifiedRow.configuration !== null
                                    ? modifiedRow.configuration
                                    : {});

                            // Use record ID in the URL path (like the detail page does) to allow workstream name updates
                            // Send NEW workstream name in the payload so the backend can update it
                            await api.put(
                                `/api/global-settings/${modifiedRow.id}`,
                                {
                                    workstreamName: modifiedRow.workstream, // Send NEW workstream name
                                    workstreams: [modifiedRow.workstream], // Also send as workstreams array (like detail page does)
                                    configuration: categoriesData, // API stores categories in 'configuration' field as object
                                    configurationDetails: categoriesData,
                                    categories: categoriesData, // Also save as categories for compatibility
                                    accountId: selectedAccountId,
                                    accountName: selectedAccountName,
                                    enterpriseId: selectedEnterpriseId,
                                    enterpriseName: selectedEnterprise,
                                },
                            );

                            // Update the stored original workstream name to the new one after successful update
                            if (entityNameChanged) {
                                originalEntityNamesRef.current.set(
                                    modifiedRow.id,
                                    modifiedRow.workstream,
                                );
                                console.log(
                                    '✅ [AutoSave Update] Updated original workstream name reference from',
                                    originalEntityName,
                                    'to',
                                    modifiedRow.workstream,
                                );
                            }

                            console.log(
                                `✅ Modified Global Setting ${modifiedRow.id} saved successfully`,
                            );
                            successCount++;
                        } catch (error) {
                            console.error(
                                `❌ Failed to save modified Global Setting ${modifiedRow.id}:`,
                                error,
                            );
                            failureCount++;
                        }
                    }

                    // Clear the modified records tracking only if all saves succeeded
                    if (failureCount === 0) {
                        setModifiedExistingRecords(new Set());
                        modifiedExistingRecordsRef.current = new Set();
                        console.log(
                            '✅ Cleared modifiedExistingRecords - no more unsaved changes',
                        );
                    }

                    // Show appropriate notification based on results
                    // Don't show any notification if duplicate modal was shown
                    if (
                        duplicateDetectedRef.current &&
                        successCount === 0 &&
                        failureCount === 0
                    ) {
                        // Only duplicate detected - modal already shown, no notification needed
                        console.log(
                            'ℹ️ Duplicate detected - modal shown, skipping all notifications',
                        );
                    } else if (
                        successCount > 0 &&
                        failureCount === 0 &&
                        !duplicateDetectedRef.current
                    ) {
                        // All succeeded and no duplicates
                        console.log(
                            '✨ Showing auto-save success animation for all entries',
                        );
                        setShowAutoSaveSuccess(true);

                        const message =
                            temporaryRows.length > 0 && modifiedRows.length > 0
                                ? `Auto-saved ${temporaryRows.length} new and ${modifiedRows.length} updated entries`
                                : temporaryRows.length > 0
                                ? `Auto-saved ${temporaryRows.length} new entries`
                                : `Auto-saved ${modifiedRows.length} updated entries`;

                        showBlueNotification(message);

                        setTimeout(() => {
                            console.log(
                                '✨ Hiding auto-save success animation',
                            );
                            setShowAutoSaveSuccess(false);
                        }, 3000);

                        console.log(
                            `✅ Auto-saved ${successCount} entries successfully`,
                        );

                        // Reload data from backend to get real IDs and clear unsaved state - exactly like Manage Users
                        console.log(
                            '🔄 Reloading User Roles after successful autosave to update IDs...',
                        );
                        await loadGlobalSettings({
                            accountId: selectedAccountId,
                            accountName: selectedAccountName,
                            enterpriseId: selectedEnterpriseId,
                            enterpriseName: selectedEnterprise,
                        });

                        console.log(
                            '✅ Reload complete after autosave - checking state:',
                            {
                                autoSaveTimerRef: autoSaveTimerRef.current,
                                modifiedRecordsSize:
                                    modifiedExistingRecordsRef.current.size,
                                userGroupsCount:
                                    globalSettingsRef.current.length,
                                hasTempRows: globalSettingsRef.current.some(
                                    (g) => String(g.id).startsWith('tmp-'),
                                ),
                            },
                        );
                    } else if (
                        successCount > 0 &&
                        failureCount > 0 &&
                        !duplicateDetectedRef.current
                    ) {
                        // Partial success and no duplicates
                        console.warn(
                            `⚠️ Auto-save partial: ${successCount} succeeded, ${failureCount} failed`,
                        );
                        showBlueNotification(
                            `Partially saved: ${successCount} succeeded, ${failureCount} failed. Please try saving manually.`,
                            8000,
                            false,
                        );
                    } else if (
                        failureCount > 0 &&
                        !duplicateDetectedRef.current
                    ) {
                        // All failed (but not due to duplicate)
                        console.error(
                            `❌ All auto-save attempts failed: ${failureCount} errors`,
                        );
                        showBlueNotification(
                            `Failed to auto-save changes. Please save manually.`,
                            8000,
                            false,
                        );
                    }

                    // Reload data immediately after autosave completes to reflect new changes
                    if (successCount > 0) {
                        console.log(
                            '🔄 Reloading data immediately after autosave to reflect new changes...',
                        );
                        loadGlobalSettings({
                            accountId: selectedAccountId,
                            accountName: selectedAccountName,
                            enterpriseId: selectedEnterpriseId,
                            enterpriseName: selectedEnterprise,
                        });
                    }
                } else {
                    console.log('ℹ️ No complete rows to auto-save');
                }

                setIsAutoSaving(false);
            } catch (error) {
                console.error('❌ Auto-save error:', error);
                setIsAutoSaving(false);
            }
        }, 10000); // 10 seconds

        autoSaveTimerRef.current = timer;
    }, [
        selectedAccountId,
        selectedAccountName,
        selectedEnterpriseId,
        selectedEnterprise,
        showValidationErrors,
        loadGlobalSettings,
    ]);

    // Update the ref whenever debouncedAutoSave changes
    useEffect(() => {
        debouncedAutoSaveRef.current = debouncedAutoSave;
    }, [debouncedAutoSave]);

    // Function to check for unsaved changes - exactly like Manage Users
    const getUnsavedChanges = () => {
        const hasActiveTimer = !!autoSaveTimerRef.current;
        const hasModifiedRecords = modifiedExistingRecordsRef.current.size > 0;
        const hasTempRows = globalSettingsRef.current.some((role: any) =>
            String(role.id).startsWith('tmp-'),
        );

        const hasUnsavedChanges =
            hasActiveTimer || hasModifiedRecords || hasTempRows;

        console.log('🔍 [getUnsavedChanges] Check:', {
            hasActiveTimer,
            hasModifiedRecords,
            modifiedRecordsCount: modifiedExistingRecordsRef.current.size,
            hasTempRows,
            tempRowsIds: globalSettingsRef.current
                .filter((g) => String(g.id).startsWith('tmp-'))
                .map((g) => g.id),
            totalGroups: globalSettingsRef.current.length,
            hasUnsavedChanges,
        });

        return hasUnsavedChanges;
    };

    // Function to check for incomplete rows - exactly like Manage Users
    const getIncompleteRows = () => {
        const incompleteRows = globalSettings
            .filter((role: any) => {
                const hasEntity = role.workstream?.trim();

                // Include completely blank rows only when validation is explicitly shown
                const isCompletelyBlank = !hasEntity;
                if (isCompletelyBlank && !showValidationErrors) return false;

                // Row is incomplete if any required field is missing
                const isIncomplete = !hasEntity;

                console.log('🔍 Row validation check:', {
                    id: role.id,
                    hasEntity,
                    isIncomplete,
                });

                return isIncomplete;
            })
            .map((role: any) => role.id);

        // Only log when showValidationErrors is true to prevent infinite loops
        if (showValidationErrors && incompleteRows.length > 0) {
            console.log('🔍 getIncompleteRows result:', {
                incompleteRowIds: incompleteRows,
                totalGroups: globalSettings.length,
                showValidationErrors,
                sampleGroupIds: globalSettings.slice(0, 3).map((g) => g.id),
            });
        }

        return incompleteRows;
    };

    // Router interception for navigation prevention - exactly like Manage Users
    useEffect(() => {
        // Store reference to original methods
        const originalPush = router.push;
        const originalReplace = router.replace;

        // Store original router for use in navigation confirmation
        originalRouterRef.current = {
            push: originalPush,
            replace: originalReplace,
        };

        // Override router.push to intercept navigation
        router.push = (href: string, options?: any) => {
            // Allow navigation to configuration detail page without showing unsaved changes modal
            if (
                typeof href === 'string' &&
                href.includes('/account-settings/global-settings/') &&
                href.includes('?edit=1')
            ) {
                return originalPush(href, options);
            }

            // Check for unsaved changes but allow navigation if user has confirmed
            const currentUnsavedChanges = getUnsavedChanges();
            const currentIncompleteRows = getIncompleteRows();

            if (
                typeof href === 'string' &&
                (currentUnsavedChanges || currentIncompleteRows.length > 0) &&
                !userConfirmedLeave
            ) {
                console.log('🚨 Navigation intercepted - push method:', {
                    hasUnsavedChanges: currentUnsavedChanges,
                    incompleteRows: currentIncompleteRows.length,
                    modifiedExistingRecords: Array.from(
                        modifiedExistingRecordsRef.current,
                    ),
                    userConfirmedLeave,
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
            // Allow navigation to configuration detail page without showing unsaved changes modal
            if (
                typeof href === 'string' &&
                href.includes('/account-settings/global-settings/') &&
                href.includes('?edit=1')
            ) {
                return originalReplace(href, options);
            }

            // Check for unsaved changes but allow navigation if user has confirmed
            const currentUnsavedChanges = getUnsavedChanges();
            const currentIncompleteRows = getIncompleteRows();

            if (
                typeof href === 'string' &&
                (currentUnsavedChanges || currentIncompleteRows.length > 0) &&
                !userConfirmedLeave
            ) {
                console.log('🚨 Navigation intercepted - replace method:', {
                    hasUnsavedChanges: currentUnsavedChanges,
                    incompleteRows: currentIncompleteRows.length,
                    modifiedExistingRecords: Array.from(
                        modifiedExistingRecordsRef.current,
                    ),
                    userConfirmedLeave,
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

            if (
                (currentUnsavedChanges || currentIncompleteRows.length > 0) &&
                !userConfirmedLeave
            ) {
                event.preventDefault();
                // Push current state back to prevent navigation
                window.history.pushState(null, '', window.location.href);
                setIncompleteRows(currentIncompleteRows);
                setShowNavigationWarning(true);
            }
        };

        // Add history listener for browser navigation
        window.addEventListener('popstate', handlePopState);

        // Cleanup on unmount
        return () => {
            router.push = originalPush;
            router.replace = originalReplace;
            window.removeEventListener('popstate', handlePopState);
        };
    }, [router, userConfirmedLeave]);

    // Handle search
    const handleSearch = () => {
        setAppliedSearchTerm(searchTerm);
    };

    const handleSearchKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    // Handle save all - exactly like Manage Users
    const handleSaveAll = async () => {
        console.log(
            '💾 Save all clicked - validating and saving User Roles...',
        );

        // Reset duplicate detection flag at the start of manual save
        duplicateDetectedRef.current = false;

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

        // Get temporary (unsaved) and existing rows
        const temporaryRows = globalSettings.filter((role: any) =>
            String(role.id).startsWith('tmp-'),
        );
        const existingRows = globalSettings.filter(
            (role: any) => !String(role.id).startsWith('tmp-'),
        );

        // Check for incomplete temporary rows (including completely blank rows) - exactly like Manage User Roles
        const incompleteTemporaryRows = temporaryRows.filter((setting: any) => {
            const hasEntity = setting.workstream?.trim();

            // Row is incomplete if Entity Name (mandatory field) is missing (including completely blank rows)
            return !hasEntity;
        });

        // Check for incomplete existing rows (including completely blank rows) - exactly like Manage User Roles
        const incompleteExistingRows = existingRows.filter((setting: any) => {
            const hasEntity = setting.workstream?.trim();

            // Row is incomplete if Entity Name (mandatory field) is missing (including completely blank rows)
            return !hasEntity;
        });

        // Combine all incomplete rows
        const incompleteRowsData = [
            ...incompleteTemporaryRows,
            ...incompleteExistingRows,
        ];

        // Get count of modified existing rows
        const modifiedExistingRowsCount = existingRows.filter((role: any) =>
            modifiedExistingRecords.has(role.id),
        ).length;

        if (temporaryRows.length === 0 && modifiedExistingRowsCount === 0) {
            showBlueNotification('No unsaved entries to save.', 3000, false);
            return;
        }

        if (incompleteRowsData.length > 0) {
            const allMissingFields = new Set<string>();

            console.log(
                '🔍 Checking missing fields for incomplete rows:',
                incompleteRowsData,
            );
            incompleteRowsData.forEach((setting) => {
                console.log('📋 Checking setting:', {
                    id: setting.id,
                    workstream: setting.workstream || '(empty)',
                });

                // Check for missing fields
                if (!setting.workstream?.trim())
                    allMissingFields.add('Workstream Name');
            });

            console.log('📝 All missing fields:', Array.from(allMissingFields));

            const incompleteCount = incompleteRowsData.length;
            const message = `Found ${incompleteCount} incomplete record${
                incompleteCount > 1 ? 's' : ''
            }.\nMissing required fields: ${Array.from(allMissingFields).join(
                ', ',
            )}`;

            setValidationMessage(message);
            setShowValidationErrors(true); // Enable red border highlighting for validation errors

            // Set incomplete row IDs for highlighting
            const incompleteRowIds = incompleteRowsData.map((r) => r.id);
            console.log(
                '🎯 Setting incomplete row IDs for highlighting:',
                incompleteRowIds,
            );
            setIncompleteRows(incompleteRowIds); // Store incomplete row IDs for highlighting

            setShowValidationModal(true);
            return;
        }

        // Save all complete temporary rows
        try {
            let savedCount = 0;
            const completeTemporaryRows = temporaryRows.filter(
                (setting: any) => {
                    const hasEntity = setting.workstream?.trim();
                    return hasEntity;
                },
            );

            console.log(
                '✅ Complete temporary rows to save:',
                completeTemporaryRows.length,
                completeTemporaryRows,
            );

            // Get complete modified existing rows
            const completeModifiedRows = existingRows.filter((setting: any) => {
                const hasEntity = setting.workstream?.trim();
                const isModified = modifiedExistingRecords.has(setting.id);
                return hasEntity && isModified;
            });

            console.log(
                '✅ Complete modified rows to save:',
                completeModifiedRows.length,
                completeModifiedRows,
            );

            let failedCount = 0;

            // Save temporary rows to database
            for (const tempGroup of completeTemporaryRows) {
                try {
                    // Check for duplicate entry (same entity + account + enterprise)
                    const isDuplicate = globalSettings.some(
                        (existingSetting: any) => {
                            // Skip the current temporary row being saved
                            if (existingSetting.id === tempGroup.id)
                                return false;

                            // Check if workstream name matches for the same account and enterprise
                            return (
                                existingSetting.workstream
                                    ?.toLowerCase()
                                    .trim() ===
                                    tempGroup.workstream
                                        ?.toLowerCase()
                                        .trim() &&
                                existingSetting.account
                                    ?.toLowerCase()
                                    .trim() ===
                                    tempGroup.account?.toLowerCase().trim() &&
                                existingSetting.enterprise
                                    ?.toLowerCase()
                                    .trim() ===
                                    tempGroup.enterprise?.toLowerCase().trim()
                            );
                        },
                    );

                    if (isDuplicate) {
                        console.error(
                            '❌ Duplicate entry detected for:',
                            tempGroup.workstream,
                        );

                        // Mark that duplicate was detected
                        duplicateDetectedRef.current = true;

                        // Show duplicate modal
                        setDuplicateMessage(
                            `This combination of Workstream Name (${tempGroup.workstream}), Account (${tempGroup.account}), and Enterprise (${tempGroup.enterprise}) already exists in another row. Please use a different combination.`,
                        );
                        setShowDuplicateModal(true);

                        failedCount++;
                        continue; // Skip this row and continue with others
                    }

                    // Check if a setting with this workstream name already exists in the database (created via + Add button)
                    console.log(
                        '🔍 Checking if setting exists in database:',
                        tempGroup.workstream,
                    );
                    const queryParams = new URLSearchParams();
                    queryParams.append('workstreamName', tempGroup.workstream);
                    if (selectedAccountId)
                        queryParams.append('accountId', selectedAccountId);
                    if (selectedAccountName)
                        queryParams.append('accountName', selectedAccountName);
                    if (selectedEnterpriseId)
                        queryParams.append(
                            'enterpriseId',
                            selectedEnterpriseId,
                        );
                    if (selectedEnterprise)
                        queryParams.append(
                            'enterpriseName',
                            selectedEnterprise,
                        );

                    const existingSettingsResponse = await api.get<any[]>(
                        `/api/global-settings?${queryParams.toString()}`,
                    );
                    console.log(
                        '📦 Existing settings response:',
                        existingSettingsResponse,
                    );

                    const existingSettingsArray = Array.isArray(
                        existingSettingsResponse,
                    )
                        ? existingSettingsResponse
                        : [];
                    const exactMatch = existingSettingsArray.find(
                        (s: any) =>
                            (s.workstreamName || s.workstream)
                                ?.toLowerCase()
                                .trim() ===
                            tempGroup.workstream.toLowerCase().trim(),
                    );

                    if (exactMatch) {
                        // setting already exists (created via + Add button), UPDATE it with the filled fields
                        console.log(
                            '✅ Found existing setting created via + Add, updating with fields:',
                            exactMatch.id,
                        );

                        // Preserve existing configuration from database if local state doesn't have it
                        // API stores categories in 'configuration' field as an object
                        const existingCategories =
                            (exactMatch as any).categories ||
                            exactMatch.configurationDetails ||
                            (typeof exactMatch.configuration === 'object' &&
                            exactMatch.configuration !== null &&
                            !Array.isArray(exactMatch.configuration)
                                ? exactMatch.configuration
                                : {});
                        const localCategories =
                            tempGroup.configurationDetails ||
                            (tempGroup as any).categories ||
                            (typeof tempGroup.configuration === 'object' &&
                            tempGroup.configuration !== null &&
                            !Array.isArray(tempGroup.configuration)
                                ? tempGroup.configuration
                                : {});

                        // Use local configuration if it exists and has data, otherwise preserve existing from database
                        const categoriesToSave =
                            Object.keys(localCategories).length > 0
                                ? localCategories
                                : existingCategories;

                        const updateData = {
                            workstreamName: tempGroup.workstream, // Send workstream name
                            workstreams: [tempGroup.workstream], // Also send as workstreams array (like detail page does)
                            configuration: categoriesToSave, // API stores categories in 'configuration' field as object
                            configurationDetails: categoriesToSave,
                            categories: categoriesToSave, // Also save as categories for compatibility
                            accountId: tempGroup.accountId || selectedAccountId,
                            accountName:
                                tempGroup.account || selectedAccountName,
                            enterpriseId:
                                tempGroup.enterpriseId || selectedEnterpriseId,
                            enterpriseName:
                                tempGroup.enterprise || selectedEnterprise,
                        };

                        console.log(
                            '📦 Updating setting with data (preserving existing configuration):',
                            updateData,
                        );
                        // Use record ID in the URL path (like the detail page does) to allow workstream name updates
                        await api.put(
                            `/api/global-settings/${exactMatch.id}`,
                            updateData,
                        );

                        // Update the row ID in state to use the real database ID
                        setGlobalSettings((prev) =>
                            prev.map((g) =>
                                g.id === tempGroup.id
                                    ? {
                                          ...g,
                                          id: exactMatch.id,
                                          updatedAt: new Date().toISOString(),
                                      }
                                    : g,
                            ),
                        );

                        // Store original workstream name for the updated record
                        originalEntityNamesRef.current.set(
                            exactMatch.id,
                            tempGroup.workstream,
                        );
                        console.log(
                            `📍 [Manual Save] Stored original workstream name for updated record ${exactMatch.id}:`,
                            tempGroup.workstream,
                        );

                        savedCount++;
                        console.log(
                            '✅ Updated existing setting with filled fields:',
                            exactMatch.id,
                        );
                    } else {
                        // setting doesn't exist, CREATE it
                        const newId = `setting-${Date.now()}-${Math.random()}`;
                        // API stores categories in 'configuration' field as an object
                        const categoriesData =
                            tempGroup.configurationDetails ||
                            (tempGroup as any).categories ||
                            (typeof tempGroup.configuration === 'object' &&
                            tempGroup.configuration !== null &&
                            !Array.isArray(tempGroup.configuration)
                                ? tempGroup.configuration
                                : {});
                        const settingData = {
                            workstreamName: tempGroup.workstream, // API expects entityName
                            configuration: categoriesData, // API stores categories in 'configuration' field as object
                            configurationDetails: categoriesData,
                            categories: categoriesData, // Also save as categories for compatibility
                            accountId: tempGroup.accountId || selectedAccountId,
                            accountName:
                                tempGroup.account || selectedAccountName,
                            enterpriseId:
                                tempGroup.enterpriseId || selectedEnterpriseId,
                            enterpriseName:
                                tempGroup.enterprise || selectedEnterprise,
                        };

                        console.log(
                            '💾 Creating new Global Setting:',
                            settingData,
                        );
                        const savedSetting = (await api.post(
                            '/api/global-settings',
                            settingData,
                        )) as any;
                        const savedSettingId = savedSetting?.id || newId;

                        // Update the row ID in state
                        setGlobalSettings((prev) =>
                            prev.map((g) =>
                                g.id === tempGroup.id
                                    ? {
                                          ...g,
                                          id: savedSettingId,
                                          createdAt: new Date().toISOString(),
                                          updatedAt: new Date().toISOString(),
                                      }
                                    : g,
                            ),
                        );

                        // Store original workstream name for the newly created record
                        originalEntityNamesRef.current.set(
                            savedSettingId,
                            tempGroup.workstream,
                        );
                        console.log(
                            `📍 [Manual Save] Stored original workstream name for new record ${savedSettingId}:`,
                            tempGroup.workstream,
                        );

                        savedCount++;
                        console.log(
                            '🎉 New Global Setting saved successfully!',
                        );
                    }
                } catch (error) {
                    console.error(
                        '❌ Failed to save new Global Setting:',
                        error,
                    );
                    failedCount++;
                }
            }

            // Save modified existing rows to database
            for (const modifiedSetting of completeModifiedRows) {
                try {
                    // Check for duplicate entry (same entity + account + enterprise as another record)
                    const isDuplicate = globalSettings.some(
                        (existingSetting: any) => {
                            // Skip the current row being updated
                            if (existingSetting.id === modifiedSetting.id)
                                return false;

                            // Check if workstream name matches for the same account and enterprise
                            return (
                                existingSetting.workstream
                                    ?.toLowerCase()
                                    .trim() ===
                                    modifiedSetting.workstream
                                        ?.toLowerCase()
                                        .trim() &&
                                existingSetting.account
                                    ?.toLowerCase()
                                    .trim() ===
                                    modifiedSetting.account
                                        ?.toLowerCase()
                                        .trim() &&
                                existingSetting.enterprise
                                    ?.toLowerCase()
                                    .trim() ===
                                    modifiedSetting.enterprise
                                        ?.toLowerCase()
                                        .trim()
                            );
                        },
                    );

                    if (isDuplicate) {
                        console.error(
                            '❌ Duplicate entry detected for update:',
                            modifiedSetting.workstream,
                        );

                        // Mark that duplicate was detected
                        duplicateDetectedRef.current = true;

                        // Show duplicate modal
                        setDuplicateMessage(
                            `This combination of Workstream Name (${modifiedSetting.workstream}), Account (${modifiedSetting.account}), and Enterprise (${modifiedSetting.enterprise}) already exists in another row. Please use a different combination.`,
                        );
                        setShowDuplicateModal(true);

                        failedCount++;
                        continue; // Skip this row and continue with others
                    }

                    // Get the original workstream name for this record (before any edits)
                    const originalEntityName =
                        originalEntityNamesRef.current.get(
                            modifiedSetting.id,
                        ) || modifiedSetting.workstream;
                    const entityNameChanged =
                        modifiedSetting.workstream !== originalEntityName;
                    console.log(
                        '🔍 [Update] Original workstream name:',
                        originalEntityName,
                        'New workstream name:',
                        modifiedSetting.workstream,
                        'Changed:',
                        entityNameChanged,
                    );

                    // Preserve existing configuration from database if local state doesn't have it
                    // First, fetch the current setting from database using record ID to preserve its configuration
                    let existingConfig = {};
                    try {
                        const currentSetting = await api.get<any>(
                            `/api/global-settings/${
                                modifiedSetting.id
                            }?accountId=${
                                modifiedSetting.accountId ||
                                selectedAccountId ||
                                ''
                            }&accountName=${
                                modifiedSetting.account ||
                                selectedAccountName ||
                                ''
                            }&enterpriseId=${
                                modifiedSetting.enterpriseId ||
                                selectedEnterpriseId ||
                                ''
                            }&enterpriseName=${
                                modifiedSetting.enterprise ||
                                selectedEnterprise ||
                                ''
                            }`,
                        );
                        if (currentSetting) {
                            existingConfig =
                                (currentSetting as any).categories ||
                                currentSetting.configurationDetails ||
                                (typeof currentSetting.configuration ===
                                    'object' &&
                                currentSetting.configuration !== null &&
                                !Array.isArray(currentSetting.configuration)
                                    ? currentSetting.configuration
                                    : {});
                        }
                    } catch (error) {
                        console.log(
                            '⚠️ Could not fetch existing configuration using ID, trying with workstream name...',
                        );
                        // Fallback to using workstream name if ID-based fetch fails
                        try {
                            const currentSetting = await api.get<any>(
                                `/api/global-settings/${encodeURIComponent(
                                    originalEntityName,
                                )}?accountId=${
                                    modifiedSetting.accountId ||
                                    selectedAccountId ||
                                    ''
                                }&accountName=${
                                    modifiedSetting.account ||
                                    selectedAccountName ||
                                    ''
                                }&enterpriseId=${
                                    modifiedSetting.enterpriseId ||
                                    selectedEnterpriseId ||
                                    ''
                                }&enterpriseName=${
                                    modifiedSetting.enterprise ||
                                    selectedEnterprise ||
                                    ''
                                }`,
                            );
                            if (currentSetting) {
                                existingConfig =
                                    (currentSetting as any).categories ||
                                    currentSetting.configurationDetails ||
                                    (typeof currentSetting.configuration ===
                                        'object' &&
                                    currentSetting.configuration !== null &&
                                    !Array.isArray(currentSetting.configuration)
                                        ? currentSetting.configuration
                                        : {});
                            }
                        } catch (fallbackError) {
                            console.log(
                                '⚠️ Could not fetch existing configuration, will use local state',
                            );
                        }
                    }

                    // API stores categories in 'configuration' field as an object
                    const localCategories =
                        modifiedSetting.configurationDetails ||
                        (modifiedSetting as any).categories ||
                        (typeof modifiedSetting.configuration === 'object' &&
                        modifiedSetting.configuration !== null &&
                        !Array.isArray(modifiedSetting.configuration)
                            ? modifiedSetting.configuration
                            : {});

                    // Use local configuration if it exists and has data, otherwise preserve existing from database
                    const categoriesToSave =
                        Object.keys(localCategories).length > 0
                            ? localCategories
                            : existingConfig;

                    const settingData = {
                        workstreamName: modifiedSetting.workstream, // Send NEW workstream name
                        workstreams: [modifiedSetting.workstream], // Also send as workstreams array (like detail page does)
                        configuration: categoriesToSave, // API stores categories in 'configuration' field as object
                        configurationDetails: categoriesToSave,
                        categories: categoriesToSave, // Also save as categories for compatibility
                        accountId:
                            modifiedSetting.accountId || selectedAccountId,
                        accountName:
                            modifiedSetting.account || selectedAccountName,
                        enterpriseId:
                            modifiedSetting.enterpriseId ||
                            selectedEnterpriseId,
                        enterpriseName:
                            modifiedSetting.enterprise || selectedEnterprise,
                    };

                    console.log(
                        '💾 Updating existing Global Setting using record ID:',
                        modifiedSetting.id,
                        'with new workstream name in payload:',
                        modifiedSetting.workstream,
                    );
                    // Use record ID in the URL path (like the detail page does) to allow workstream name updates
                    // Send NEW workstream name in the payload so the backend can update it
                    await api.put(
                        `/api/global-settings/${modifiedSetting.id}`,
                        settingData,
                    );

                    // Update the stored original workstream name to the new one after successful update
                    if (entityNameChanged) {
                        originalEntityNamesRef.current.set(
                            modifiedSetting.id,
                            modifiedSetting.workstream,
                        );
                        console.log(
                            '✅ [Update] Updated original workstream name reference from',
                            originalEntityName,
                            'to',
                            modifiedSetting.workstream,
                        );
                    }

                    // Update the row's updatedAt timestamp in state
                    setGlobalSettings((prev) =>
                        prev.map((s) =>
                            s.id === modifiedSetting.id
                                ? {...s, updatedAt: new Date().toISOString()}
                                : s,
                        ),
                    );

                    savedCount++;
                    console.log(
                        '🎉 Existing Global Setting updated successfully!',
                    );
                } catch (error) {
                    console.error('❌ Failed to update Global Setting:', error);
                    console.error(
                        '❌ Error details:',
                        error instanceof Error
                            ? error.message
                            : JSON.stringify(error, null, 2),
                    );
                    failedCount++;
                }
            }

            // Clear the modified records tracking after successful saves
            if (completeModifiedRows.length > 0 && failedCount === 0) {
                setModifiedExistingRecords(new Set());
                console.log('✨ Cleared modified records tracking');
            }

            if (savedCount > 0 && failedCount === 0) {
                const newCount = completeTemporaryRows.length;
                const updatedCount = completeModifiedRows.length;
                const message =
                    newCount > 0 && updatedCount > 0
                        ? `Successfully saved ${newCount} new and ${updatedCount} updated entries.`
                        : newCount > 0
                        ? `Successfully saved ${newCount} new entries.`
                        : `Successfully saved ${updatedCount} updated entries.`;

                showBlueNotification(message);
                setShowValidationErrors(false); // Clear validation errors on successful save
                setExternalFieldErrors({});
                setIncompleteRows([]);

                // Reload data from backend to get real IDs and clear unsaved state - exactly like Manage Users
                console.log(
                    '🔄 Reloading User Roles after successful manual save to update IDs...',
                );
                await loadGlobalSettings({
                    accountId: selectedAccountId,
                    accountName: selectedAccountName,
                    enterpriseId: selectedEnterpriseId,
                    enterpriseName: selectedEnterprise,
                });

                console.log(
                    '✅ Reload complete after manual save - checking state:',
                    {
                        autoSaveTimerRef: autoSaveTimerRef.current,
                        modifiedRecordsSize:
                            modifiedExistingRecordsRef.current.size,
                        userGroupsCount: globalSettingsRef.current.length,
                        hasTempRows: globalSettingsRef.current.some((g) =>
                            String(g.id).startsWith('tmp-'),
                        ),
                    },
                );
            } else if (
                duplicateDetectedRef.current &&
                savedCount === 0 &&
                failedCount === 0
            ) {
                // Only duplicate detected - modal already shown, no notification needed
                console.log(
                    'ℹ️ Duplicate modal shown - skipping all notifications',
                );
            } else if (savedCount > 0 && failedCount > 0) {
                // Don't show notification if duplicate modal was shown
                if (!duplicateDetectedRef.current) {
                    showBlueNotification(
                        `Partially saved: ${savedCount} succeeded, ${failedCount} failed. Please check console for errors.`,
                        5000,
                        false,
                    );
                }
            } else if (failedCount > 0 && !duplicateDetectedRef.current) {
                // Only show error notification if duplicate modal was NOT shown
                showBlueNotification(
                    `Failed to save ${failedCount} entries. Please check console for errors.`,
                    5000,
                    false,
                );
            } else if (
                savedCount === 0 &&
                failedCount === 0 &&
                !duplicateDetectedRef.current
            ) {
                // No failures and no duplicates - just nothing to save
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

    // Filter form state
    const [filterForm, setFilterForm] = useState({
        account: '',
        enterprise: '',
        workstream: '',
        selectedTools: [] as string[],
    });

    // Get all available tools from all categories
    const getAllTools = () => {
        const toolCategories = {
            plan: ['Jira', 'Azure DevOps', 'Trello', 'Asana', 'Other'],
            code: [
                'GitHub',
                'GitLab',
                'Azure Repos',
                'Bitbucket',
                'SonarQube',
                'Other',
            ],
            build: [
                'Jenkins',
                'GitHub Actions',
                'CircleCI',
                'AWS CodeBuild',
                'Google Cloud Build',
                'Azure DevOps',
                'Other',
            ],
            test: ['Cypress', 'Selenium', 'Jest', 'Tricentis Tosca', 'Other'],
            release: ['Argo CD', 'ServiceNow', 'Azure DevOps', 'Other'],
            deploy: [
                'Kubernetes',
                'Helm',
                'Terraform',
                'Ansible',
                'Docker',
                'AWS CodePipeline',
                'Cloud Foundry',
                'Other',
            ],
            others: ['Prometheus', 'Grafana', 'Slack', 'Other'],
        };
        // Flatten, remove duplicates, and sort
        const allTools = Array.from(
            new Set(Object.values(toolCategories).flat()),
        );
        return allTools.sort();
    };

    // Update filterFormRef whenever filterForm changes
    useEffect(() => {
        filterFormRef.current = filterForm;
    }, [filterForm]);

    // Track if Clear All was clicked to allow closing filter panel on outside click
    const filterClearedRef = useRef(false);

    // Filter dropdown suggestions state
    const [showAccountSuggestions, setShowAccountSuggestions] = useState(false);
    const [showEnterpriseSuggestions, setShowEnterpriseSuggestions] =
        useState(false);
    const [showEntitySuggestions, setShowEntitySuggestions] = useState(false);
    const [selectedToolsQuery, setSelectedToolsQuery] = useState('');

    const [filteredAccounts, setFilteredAccounts] = useState<
        Array<{id: string; name: string}>
    >([]);
    const [filteredEnterprises, setFilteredEnterprises] = useState<
        Array<{id: string; name: string}>
    >([]);
    const [filteredEntities, setFilteredEntities] = useState<
        Array<{id: string; name: string}>
    >([]);

    const [selectedAccountIndex, setSelectedAccountIndex] = useState(-1);
    const [selectedEnterpriseIndex, setSelectedEnterpriseIndex] = useState(-1);
    const [selectedEntityIndex, setSelectedEntityIndex] = useState(-1);

    // Apply and clear filter handlers
    const handleApplyFilters = () => {
        const filters: Record<string, any> = {};
        if (filterForm.account) filters.account = filterForm.account;
        if (filterForm.enterprise) filters.enterprise = filterForm.enterprise;
        if (filterForm.workstream) filters.workstream = filterForm.workstream;
        if (filterForm.selectedTools && filterForm.selectedTools.length > 0)
            filters.selectedTools = filterForm.selectedTools;

        setActiveFilters(filters);
        closeAllDialogs();

        // Reset the cleared flag when panel is closed via Apply
        filterClearedRef.current = false;
    };

    const handleClearFilters = () => {
        setFilterForm({
            account: '',
            enterprise: '',
            workstream: '',
            selectedTools: [],
        });
        setActiveFilters({});

        // Mark that filters were cleared - allow closing on outside click
        filterClearedRef.current = true;
    };

    // Handler to show all columns
    const handleShowAllColumns = () => {
        setVisibleCols(allCols);
    };

    return (
        <div className='h-full bg-secondary flex flex-col'>
            {/* Header Section */}
            <div className='bg-white px-3 py-4 border-b border-slate-200'>
                <div className='w-full'>
                    <h1 className='text-2xl font-bold text-slate-900'>
                        Global Settings
                    </h1>
                    <p className='mt-2 text-sm text-slate-600 leading-relaxed'>
                        Configure system-wide settings and tool selections for
                        accounts, enterprises, and workstreams.
                    </p>
                </div>
            </div>

            {/* Toolbar Section */}
            <div className='bg-sap-light-gray px-3 py-3 text-primary border-y border-light'>
                <div className='flex items-center justify-between gap-3'>
                    <div className='flex items-center gap-3 flex-wrap'>
                        {/* Create New Entity Button */}
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
                                    : 'Create New Workstream'}
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
                        <div ref={filterRef} className='relative'>
                            <button
                                onClick={() =>
                                    filterVisible
                                        ? closeAllDialogs()
                                        : toggleDialog('filter')
                                }
                                className={`role relative flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-medium transition-all duration-300 transform hover:scale-105 ${
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
                                                    Workstream
                                                </label>
                                                <div className='relative'>
                                                    <input
                                                        type='text'
                                                        value={
                                                            filterForm.workstream
                                                        }
                                                        onChange={(e) => {
                                                            const value =
                                                                e.target.value;
                                                            setFilterForm({
                                                                ...filterForm,
                                                                workstream:
                                                                    value,
                                                            });

                                                            // Reset cleared flag when user starts typing again
                                                            filterClearedRef.current =
                                                                false;

                                                            // Filter workstreams
                                                            const filtered = (
                                                                dropdownOptions.workstreams ||
                                                                []
                                                            ).filter((entity) =>
                                                                entity.name
                                                                    .toLowerCase()
                                                                    .includes(
                                                                        value.toLowerCase(),
                                                                    ),
                                                            );
                                                            setFilteredEntities(
                                                                filtered,
                                                            );
                                                            setShowEntitySuggestions(
                                                                value.length >
                                                                    0 &&
                                                                    filtered.length >
                                                                        0,
                                                            );
                                                            setSelectedEntityIndex(
                                                                -1,
                                                            );
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (
                                                                e.key ===
                                                                'ArrowDown'
                                                            ) {
                                                                e.preventDefault();
                                                                setSelectedEntityIndex(
                                                                    (prev) =>
                                                                        prev <
                                                                        filteredEntities.length -
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
                                                                setSelectedEntityIndex(
                                                                    (prev) =>
                                                                        prev > 0
                                                                            ? prev -
                                                                              1
                                                                            : -1,
                                                                );
                                                            } else if (
                                                                e.key ===
                                                                    'Enter' &&
                                                                selectedEntityIndex >=
                                                                    0
                                                            ) {
                                                                e.preventDefault();
                                                                const selected =
                                                                    filteredEntities[
                                                                        selectedEntityIndex
                                                                    ];
                                                                setFilterForm({
                                                                    ...filterForm,
                                                                    workstream:
                                                                        selected.name,
                                                                });
                                                                setShowEntitySuggestions(
                                                                    false,
                                                                );
                                                                setSelectedEntityIndex(
                                                                    -1,
                                                                );
                                                            } else if (
                                                                e.key ===
                                                                'Escape'
                                                            ) {
                                                                setShowEntitySuggestions(
                                                                    false,
                                                                );
                                                                setSelectedEntityIndex(
                                                                    -1,
                                                                );
                                                            }
                                                        }}
                                                        onBlur={() => {
                                                            setTimeout(
                                                                () =>
                                                                    setShowEntitySuggestions(
                                                                        false,
                                                                    ),
                                                                150,
                                                            );
                                                        }}
                                                        onFocus={() => {
                                                            if (
                                                                filterForm.workstream &&
                                                                filteredEntities.length >
                                                                    0
                                                            ) {
                                                                setShowEntitySuggestions(
                                                                    true,
                                                                );
                                                            }
                                                        }}
                                                        className='w-full pl-2 pr-8 py-1 text-sm border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded bg-white'
                                                    />
                                                    {showEntitySuggestions && (
                                                        <div className='filter-suggestions-dropdown absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto'>
                                                            {filteredEntities.map(
                                                                (
                                                                    entity,
                                                                    index,
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            entity.id
                                                                        }
                                                                        className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${
                                                                            index ===
                                                                            selectedEntityIndex
                                                                                ? 'bg-blue-100'
                                                                                : ''
                                                                        }`}
                                                                        onMouseDown={(
                                                                            e,
                                                                        ) => {
                                                                            e.preventDefault();
                                                                            setFilterForm(
                                                                                {
                                                                                    ...filterForm,
                                                                                    workstream:
                                                                                        entity.name,
                                                                                },
                                                                            );
                                                                            setShowEntitySuggestions(
                                                                                false,
                                                                            );
                                                                            setSelectedEntityIndex(
                                                                                -1,
                                                                            );
                                                                        }}
                                                                    >
                                                                        {
                                                                            entity.name
                                                                        }
                                                                    </div>
                                                                ),
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Selected Tools Filter */}
                                            <div>
                                                <label className='block text-xs font-medium text-gray-700 mb-1'>
                                                    Selected Tools
                                                </label>
                                                <div className='relative'>
                                                    <div
                                                        onClick={() => {
                                                            setShowSelectedToolsDropdown(
                                                                !showSelectedToolsDropdown,
                                                            );
                                                            if (
                                                                !showSelectedToolsDropdown
                                                            ) {
                                                                setSelectedToolsQuery(
                                                                    '',
                                                                ); // Clear search when opening
                                                            }
                                                            filterClearedRef.current =
                                                                false;
                                                        }}
                                                        className='w-full pl-2 pr-8 py-1 text-sm border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded bg-white cursor-pointer min-h-[32px] flex items-center flex-wrap gap-1'
                                                    >
                                                        {filterForm.selectedTools &&
                                                        filterForm.selectedTools
                                                            .length > 0 ? (
                                                            filterForm.selectedTools.map(
                                                                (tool) => (
                                                                    <span
                                                                        key={
                                                                            tool
                                                                        }
                                                                        className='inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs'
                                                                    >
                                                                        {tool}
                                                                        <button
                                                                            onClick={(
                                                                                e,
                                                                            ) => {
                                                                                e.stopPropagation();
                                                                                setFilterForm(
                                                                                    {
                                                                                        ...filterForm,
                                                                                        selectedTools:
                                                                                            filterForm.selectedTools.filter(
                                                                                                (
                                                                                                    t,
                                                                                                ) =>
                                                                                                    t !==
                                                                                                    tool,
                                                                                            ),
                                                                                    },
                                                                                );
                                                                            }}
                                                                            className='hover:text-blue-600'
                                                                        >
                                                                            <X className='h-3 w-3' />
                                                                        </button>
                                                                    </span>
                                                                ),
                                                            )
                                                        ) : (
                                                            <span className='text-gray-400'>
                                                                Select tools...
                                                            </span>
                                                        )}
                                                    </div>
                                                    {showSelectedToolsDropdown && (
                                                        <div className='absolute left-0 top-full z-50 mt-2 w-[280px] rounded-lg bg-card text-primary shadow-xl border border-blue-200'>
                                                            <div className='flex items-center justify-between px-3 py-2 border-b border-blue-200'>
                                                                <div className='text-xs font-semibold'>
                                                                    Selected
                                                                    Tools
                                                                </div>
                                                            </div>
                                                            <div className='p-3'>
                                                                <div className='space-y-3'>
                                                                    <div>
                                                                        <div className='relative'>
                                                                            <input
                                                                                value={
                                                                                    selectedToolsQuery
                                                                                }
                                                                                onChange={(
                                                                                    e,
                                                                                ) =>
                                                                                    setSelectedToolsQuery(
                                                                                        e
                                                                                            .target
                                                                                            .value,
                                                                                    )
                                                                                }
                                                                                className='w-full pl-2 pr-8 py-1.5 text-sm border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded bg-white'
                                                                                placeholder='Search tools...'
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Tools List */}
                                                                <div className='max-h-40 overflow-auto divide-y divide-light mt-2'>
                                                                    {getAllTools()
                                                                        .filter(
                                                                            (
                                                                                tool,
                                                                            ) =>
                                                                                tool
                                                                                    .toLowerCase()
                                                                                    .includes(
                                                                                        selectedToolsQuery.toLowerCase(),
                                                                                    ),
                                                                        )
                                                                        .map(
                                                                            (
                                                                                tool,
                                                                            ) => {
                                                                                const isSelected =
                                                                                    filterForm.selectedTools?.includes(
                                                                                        tool,
                                                                                    ) ||
                                                                                    false;
                                                                                return (
                                                                                    <label
                                                                                        key={
                                                                                            tool
                                                                                        }
                                                                                        className='flex items-center justify-between py-1.5 cursor-pointer hover:bg-blue-50'
                                                                                    >
                                                                                        <span className='text-sm'>
                                                                                            {
                                                                                                tool
                                                                                            }
                                                                                        </span>
                                                                                        <input
                                                                                            type='checkbox'
                                                                                            checked={
                                                                                                isSelected
                                                                                            }
                                                                                            onChange={(
                                                                                                e,
                                                                                            ) => {
                                                                                                const checked =
                                                                                                    e
                                                                                                        .target
                                                                                                        .checked;
                                                                                                const currentTools =
                                                                                                    filterForm.selectedTools ||
                                                                                                    [];
                                                                                                if (
                                                                                                    checked
                                                                                                ) {
                                                                                                    setFilterForm(
                                                                                                        {
                                                                                                            ...filterForm,
                                                                                                            selectedTools:
                                                                                                                Array.from(
                                                                                                                    new Set(
                                                                                                                        [
                                                                                                                            ...currentTools,
                                                                                                                            tool,
                                                                                                                        ],
                                                                                                                    ),
                                                                                                                ),
                                                                                                        },
                                                                                                    );
                                                                                                } else {
                                                                                                    setFilterForm(
                                                                                                        {
                                                                                                            ...filterForm,
                                                                                                            selectedTools:
                                                                                                                currentTools.filter(
                                                                                                                    (
                                                                                                                        t,
                                                                                                                    ) =>
                                                                                                                        t !==
                                                                                                                        tool,
                                                                                                                ),
                                                                                                        },
                                                                                                    );
                                                                                                }
                                                                                            }}
                                                                                            className='rounded border-blue-300 text-blue-600 focus:ring-blue-500'
                                                                                        />
                                                                                    </label>
                                                                                );
                                                                            },
                                                                        )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
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
                                className={`role relative flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-medium transition-all duration-300 transform hover:scale-105 ${
                                    sortOpen || sortColumn
                                        ? 'border-green-300 bg-green-50 text-green-600 shadow-green-200 shadow-lg'
                                        : 'border-blue-200 bg-white text-gray-600 hover:border-green-200 hover:bg-green-50 hover:text-green-600 hover:shadow-lg'
                                }`}
                                onClick={() =>
                                    sortOpen
                                        ? closeAllDialogs()
                                        : toggleDialog('sort')
                                }
                            >
                                <ArrowsUpDownIcon className='h-4 w-4 transition-transform duration-300 group-hover:scale-110' />
                                <span className='text-sm'>Sort</span>
                                {sortColumn && (
                                    <div className='absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-bounce'></div>
                                )}
                            </button>
                            {sortOpen && (
                                <div className='absolute left-0 top-full z-50 mt-2 w-[260px] rounded-lg bg-card text-primary shadow-xl border border-blue-200'>
                                    <div className='flex items-center justify-between px-3 py-2 border-b border-blue-200'>
                                        <div className='text-xs font-semibold'>
                                            Sort by
                                        </div>
                                        {sortColumn && (
                                            <button
                                                onClick={clearSort}
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
                                                        value={sortColumn}
                                                        onChange={(e) =>
                                                            setSortColumn(
                                                                e.target.value,
                                                            )
                                                        }
                                                        className='w-full pl-2 pr-8 py-1.5 text-sm border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded bg-white'
                                                    >
                                                        <option value=''>
                                                            Select column...
                                                        </option>
                                                        {sortableCols.map(
                                                            (c) => (
                                                                <option
                                                                    key={c}
                                                                    value={c}
                                                                >
                                                                    {
                                                                        columnLabels[
                                                                            c
                                                                        ]
                                                                    }
                                                                </option>
                                                            ),
                                                        )}
                                                    </select>
                                                </div>
                                            </div>

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
                                                            Ascending (A-Z, 0-9)
                                                        </option>
                                                        <option value='desc'>
                                                            Descending (Z-A,
                                                            9-0)
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
                                className={`role relative flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-medium transition-all duration-300 transform hover:scale-105 ${
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
                                        <div className='max-h-40 overflow-auto divide-y divide-light mt-2'>
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
                                                        className='flex items-center justify-between py-1.5 cursor-pointer hover:bg-blue-50'
                                                    >
                                                        <span className='text-sm'>
                                                            {columnLabels[c] ||
                                                                c}
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
                                                            className='rounded border-blue-300 text-blue-600 focus:ring-blue-500'
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
                                className={`role relative flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-medium transition-all duration-300 transform hover:scale-105 ${
                                    groupOpen || ActiveGroupLabel !== 'None'
                                        ? 'border-orange-300 bg-orange-50 text-orange-600 shadow-orange-200 shadow-lg'
                                        : 'border-blue-200 bg-white text-gray-600 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 hover:shadow-lg'
                                }`}
                                onClick={() =>
                                    groupOpen
                                        ? closeAllDialogs()
                                        : toggleDialog('role')
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
                                                            if (
                                                                value ===
                                                                'Configuration'
                                                            ) {
                                                                setActiveGroupLabel(
                                                                    'Configuration',
                                                                );
                                                            } else {
                                                                setGroupByFromLabel(
                                                                    value ||
                                                                        'None',
                                                                );
                                                            }
                                                        }}
                                                        className='w-full pl-2 pr-8 py-1.5 text-sm border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded bg-white'
                                                    >
                                                        <option value=''>
                                                            Select column...
                                                        </option>
                                                        <option value='Workstream Name'>
                                                            Workstream Name
                                                        </option>
                                                        <option value='Configuration'>
                                                            Configuration
                                                        </option>
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Selected Tools Filter - shown when Configuration is chosen */}
                                            {ActiveGroupLabel ===
                                                'Configuration' && (
                                                <div>
                                                    <label className='block text-xs font-medium text-gray-700 mb-1'>
                                                        Selected Tools
                                                    </label>
                                                    <div className='relative'>
                                                        <div
                                                            onClick={() => {
                                                                setShowGroupByToolsDropdown(
                                                                    !showGroupByToolsDropdown,
                                                                );
                                                                if (
                                                                    !showGroupByToolsDropdown
                                                                ) {
                                                                    setGroupByToolsQuery(
                                                                        '',
                                                                    );
                                                                }
                                                            }}
                                                            className='w-full pl-2 pr-8 py-1 text-sm border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded bg-white cursor-pointer min-h-[32px] flex items-center flex-wrap gap-1'
                                                        >
                                                            {groupBySelectedTools &&
                                                            groupBySelectedTools.length >
                                                                0 ? (
                                                                groupBySelectedTools.map(
                                                                    (tool) => (
                                                                        <span
                                                                            key={
                                                                                tool
                                                                            }
                                                                            className='inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs'
                                                                        >
                                                                            {
                                                                                tool
                                                                            }
                                                                            <button
                                                                                onClick={(
                                                                                    e,
                                                                                ) => {
                                                                                    e.stopPropagation();
                                                                                    setGroupBySelectedTools(
                                                                                        groupBySelectedTools.filter(
                                                                                            (
                                                                                                t,
                                                                                            ) =>
                                                                                                t !==
                                                                                                tool,
                                                                                        ),
                                                                                    );
                                                                                }}
                                                                                className='hover:text-blue-600'
                                                                            >
                                                                                <X className='h-3 w-3' />
                                                                            </button>
                                                                        </span>
                                                                    ),
                                                                )
                                                            ) : (
                                                                <span className='text-gray-400'>
                                                                    Select
                                                                    tools...
                                                                </span>
                                                            )}
                                                        </div>
                                                        {showGroupByToolsDropdown && (
                                                            <div className='absolute left-0 top-full z-50 mt-2 w-[280px] rounded-lg bg-card text-primary shadow-xl border border-blue-200'>
                                                                <div className='flex items-center justify-between px-3 py-2 border-b border-blue-200'>
                                                                    <div className='text-xs font-semibold'>
                                                                        Selected
                                                                        Tools
                                                                    </div>
                                                                </div>
                                                                <div className='p-3'>
                                                                    <div className='space-y-3'>
                                                                        <div>
                                                                            <div className='relative'>
                                                                                <input
                                                                                    value={
                                                                                        groupByToolsQuery
                                                                                    }
                                                                                    onChange={(
                                                                                        e,
                                                                                    ) =>
                                                                                        setGroupByToolsQuery(
                                                                                            e
                                                                                                .target
                                                                                                .value,
                                                                                        )
                                                                                    }
                                                                                    className='w-full pl-2 pr-8 py-1.5 text-sm border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded bg-white'
                                                                                    placeholder='Search tools...'
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Tools List */}
                                                                    <div className='max-h-40 overflow-auto divide-y divide-light mt-2'>
                                                                        {getAllTools()
                                                                            .filter(
                                                                                (
                                                                                    tool,
                                                                                ) =>
                                                                                    tool
                                                                                        .toLowerCase()
                                                                                        .includes(
                                                                                            groupByToolsQuery.toLowerCase(),
                                                                                        ),
                                                                            )
                                                                            .map(
                                                                                (
                                                                                    tool,
                                                                                ) => {
                                                                                    const isSelected =
                                                                                        groupBySelectedTools?.includes(
                                                                                            tool,
                                                                                        ) ||
                                                                                        false;
                                                                                    return (
                                                                                        <label
                                                                                            key={
                                                                                                tool
                                                                                            }
                                                                                            className='flex items-center justify-between py-1.5 cursor-pointer hover:bg-blue-50'
                                                                                        >
                                                                                            <span className='text-sm'>
                                                                                                {
                                                                                                    tool
                                                                                                }
                                                                                            </span>
                                                                                            <input
                                                                                                type='checkbox'
                                                                                                checked={
                                                                                                    isSelected
                                                                                                }
                                                                                                onChange={(
                                                                                                    e,
                                                                                                ) => {
                                                                                                    const checked =
                                                                                                        e
                                                                                                            .target
                                                                                                            .checked;
                                                                                                    const currentTools =
                                                                                                        groupBySelectedTools ||
                                                                                                        [];
                                                                                                    if (
                                                                                                        checked
                                                                                                    ) {
                                                                                                        setGroupBySelectedTools(
                                                                                                            Array.from(
                                                                                                                new Set(
                                                                                                                    [
                                                                                                                        ...currentTools,
                                                                                                                        tool,
                                                                                                                    ],
                                                                                                                ),
                                                                                                            ),
                                                                                                        );
                                                                                                    } else {
                                                                                                        setGroupBySelectedTools(
                                                                                                            currentTools.filter(
                                                                                                                (
                                                                                                                    t,
                                                                                                                ) =>
                                                                                                                    t !==
                                                                                                                    tool,
                                                                                                            ),
                                                                                                        );
                                                                                                    }
                                                                                                }}
                                                                                                className='rounded border-blue-300 text-blue-600 focus:ring-blue-500'
                                                                                            />
                                                                                        </label>
                                                                                    );
                                                                                },
                                                                            )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Current role Display */}
                                            {ActiveGroupLabel !== 'None' && (
                                                <div className='mt-1 p-2 bg-orange-50 rounded border text-xs'>
                                                    <span className='font-medium text-orange-800'>
                                                        Grouped by:{' '}
                                                        {ActiveGroupLabel ===
                                                            'Configuration' &&
                                                        groupBySelectedTools.length >
                                                            0
                                                            ? `${ActiveGroupLabel} (${
                                                                  groupBySelectedTools.length
                                                              } tool${
                                                                  groupBySelectedTools.length >
                                                                  1
                                                                      ? 's'
                                                                      : ''
                                                              })`
                                                            : ActiveGroupLabel}
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
                </div>
            </div>

            {/* Content Area */}
            <div className='flex-1 p-3 overflow-hidden'>
                <div className='h-full space-y-3'>
                    {/* User Roles Table */}
                    <div className='bg-card border border-light rounded-lg p-3 h-full flex flex-col'>
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
                                        Loading Global Settings configurations
                                    </h3>
                                    <p className='mt-2 text-sm text-slate-500'>
                                        Please wait while we fetch your Global
                                        Settings data...
                                    </p>
                                </div>
                            </div>
                        ) : globalSettings.length === 0 && !isLoading ? (
                            // Empty State - No User Roles - exactly like AssignedUserGroupModal
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
                                        No Workstream Configured
                                    </h3>
                                    <p className='mt-2 text-sm text-slate-500'>
                                        No workstreams have been created yet for
                                        the selected Account and Enterprise
                                        combination. Create a new workstream to
                                        get started.
                                    </p>
                                    <div className='mt-6'>
                                        <button
                                            onClick={handleAddNewRow}
                                            className='inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
                                        >
                                            <PlusIcon className='-ml-1 mr-2 h-5 w-5' />
                                            Create New Workstream
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
                                            onClick={handleShowAllColumns}
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
                                <GlobalSettingsTable
                                    rows={processedConfigs}
                                    onEdit={(id: string) =>
                                        console.log('Edit role:', id)
                                    }
                                    onDelete={handleDeleteClick}
                                    highlightQuery={appliedSearchTerm}
                                    compressingRowId={compressingRowId}
                                    foldingRowId={foldingRowId}
                                    groupByExternal={
                                        ActiveGroupLabel === 'Configuration' &&
                                        groupBySelectedTools.length > 0
                                            ? 'selectedTools'
                                            : ActiveGroupLabel ===
                                              'Workstream Name'
                                            ? 'workstreamName'
                                            : 'none'
                                    }
                                    groupBySelectedTools={
                                        ActiveGroupLabel === 'Configuration'
                                            ? groupBySelectedTools
                                            : []
                                    }
                                    onGroupByChange={(g: string) => {
                                        setActiveGroupLabel(
                                            g === 'selectedTools'
                                                ? 'Configuration'
                                                : g === 'workstreamName'
                                                ? 'Workstream Name'
                                                : 'None',
                                        );
                                    }}
                                    incompleteRowIds={
                                        showValidationErrors
                                            ? incompleteRows
                                            : []
                                    }
                                    showValidationErrors={showValidationErrors}
                                    externalFieldErrors={externalFieldErrors}
                                    onAddNewRow={handleAddNewRow}
                                    enableDropdownChips={true}
                                    dropdownOptions={dropdownOptions}
                                    onUpdateField={handleUpdateField}
                                    onDuplicateDetected={(message: string) => {
                                        duplicateDetectedRef.current = true;
                                        setDuplicateMessage(message);
                                        setShowDuplicateModal(true);
                                    }}
                                    visibleColumns={visibleCols}
                                    externalSortColumn={sortColumn}
                                    externalSortDirection={sortDirection}
                                    onSortChange={(
                                        column: string,
                                        direction: string,
                                    ) => {
                                        setSortColumn(column);
                                        setSortDirection(
                                            direction as '' | 'asc' | 'desc',
                                        );
                                    }}
                                    onShowAllColumns={handleShowAllColumns}
                                    selectedEnterpriseName={selectedEnterprise}
                                    selectedEnterpriseId={selectedEnterpriseId}
                                    selectedAccountId={selectedAccountId}
                                    selectedAccountName={selectedAccountName}
                                    onOpenConfigurationModal={async (row) => {
                                        // Open configuration panel
                                        if (row.workstream) {
                                            // Cancel autosave timer when opening configuration panel
                                            if (autoSaveTimerRef.current) {
                                                console.log(
                                                    '🛑 Configuration panel opened - clearing auto-save timer',
                                                );
                                                clearTimeout(
                                                    autoSaveTimerRef.current,
                                                );
                                                autoSaveTimerRef.current = null;
                                                setAutoSaveCountdown(null);
                                                if (
                                                    countdownIntervalRef.current
                                                ) {
                                                    clearInterval(
                                                        countdownIntervalRef.current,
                                                    );
                                                    countdownIntervalRef.current =
                                                        null;
                                                }
                                            }

                                            setConfigPanelEntity(row);

                                            // Mark that we're loading data for this entity
                                            const currentEntityId = `${row.workstream}-${row.id}`;
                                            configPanelDataLoadedRef.current =
                                                currentEntityId;

                                            // Pre-populate form immediately with row's configurationDetails to show selections right away
                                            const rowCategories =
                                                row.configurationDetails ||
                                                (typeof row.configuration ===
                                                    'object' &&
                                                row.configuration !== null &&
                                                !Array.isArray(
                                                    row.configuration,
                                                )
                                                    ? row.configuration
                                                    : {});
                                            console.log(
                                                '🔍 [Config Panel] Pre-populating with row categories:',
                                                rowCategories,
                                            );
                                            setConfigForm({
                                                accountId:
                                                    selectedAccountId || '',
                                                accountName:
                                                    selectedAccountName || '',
                                                enterpriseId:
                                                    selectedEnterpriseId || '',
                                                enterpriseName:
                                                    selectedEnterprise || '',
                                                workstreams: [row.workstream],
                                                selections: rowCategories,
                                            });
                                            // Set original selections to track changes
                                            setOriginalConfigSelections(
                                                JSON.parse(
                                                    JSON.stringify(
                                                        rowCategories,
                                                    ),
                                                ),
                                            );
                                            setHasConfigUnsavedChanges(false);

                                            // Open panel after pre-populating
                                            setIsConfigurationPanelOpen(true);

                                            // Load accounts and enterprises
                                            try {
                                                const [accs, ents] =
                                                    await Promise.all([
                                                        api.get<
                                                            Array<{
                                                                id: string;
                                                                accountName: string;
                                                            }>
                                                        >('/api/accounts'),
                                                        api.get<
                                                            Array<{
                                                                id: string;
                                                                name: string;
                                                            }>
                                                        >('/api/enterprises'),
                                                    ]);
                                                setAccounts(accs || []);
                                                setEnterprises(ents || []);

                                                // Try to load existing configuration
                                                try {
                                                    // Use original workstream name from ref if available (for edited but unsaved workstream names)
                                                    // This ensures we fetch the correct configuration even if the workstream name was changed locally
                                                    const originalEntityName =
                                                        originalEntityNamesRef.current.get(
                                                            row.id,
                                                        );
                                                    const entityNameToUse =
                                                        originalEntityName ||
                                                        row.workstream;
                                                    console.log(
                                                        '🔍 [Config Panel] Using workstream name for API call:',
                                                        {
                                                            rowId: row.id,
                                                            currentEntityName:
                                                                row.workstream,
                                                            originalEntityName:
                                                                originalEntityName,
                                                            entityNameToUse:
                                                                entityNameToUse,
                                                        },
                                                    );

                                                    const entityName =
                                                        encodeURIComponent(
                                                            entityNameToUse,
                                                        );
                                                    // Include filter parameters to ensure we get the correct data
                                                    const filterParams =
                                                        new URLSearchParams({
                                                            accountId:
                                                                selectedAccountId ||
                                                                '',
                                                            accountName:
                                                                selectedAccountName ||
                                                                '',
                                                            enterpriseId:
                                                                selectedEnterpriseId ||
                                                                '',
                                                            enterpriseName:
                                                                selectedEnterprise ||
                                                                '',
                                                        });
                                                    const response =
                                                        await api.get<any>(
                                                            `/api/global-settings/${entityName}?${filterParams.toString()}`,
                                                        );
                                                    console.log(
                                                        '🔍 [Config Panel] Loading existing configuration response:',
                                                        response,
                                                    );

                                                    // Handle both array and object responses
                                                    // Match by record ID first, then by workstream name and account/enterprise
                                                    const existing =
                                                        Array.isArray(response)
                                                            ? response.find(
                                                                  (item: any) =>
                                                                      item.id ===
                                                                          row.id || // Match by ID first (most reliable)
                                                                      (item.workstreamName ===
                                                                          entityNameToUse &&
                                                                          item.accountId ===
                                                                              selectedAccountId &&
                                                                          item.enterpriseId ===
                                                                              selectedEnterpriseId),
                                                              ) || response[0]
                                                            : response;

                                                    console.log(
                                                        '🔍 [Config Panel] Using existing config:',
                                                        existing,
                                                    );

                                                    // Load categories from either categories, configurationDetails, or configuration field (API may return configuration as object)
                                                    const loadedCategories =
                                                        existing?.categories ||
                                                        existing?.configurationDetails ||
                                                        (typeof existing?.configuration ===
                                                            'object' &&
                                                        existing?.configuration !==
                                                            null &&
                                                        !Array.isArray(
                                                            existing?.configuration,
                                                        )
                                                            ? existing.configuration
                                                            : {});

                                                    console.log(
                                                        '🔍 [Config Panel] Loaded categories:',
                                                        loadedCategories,
                                                    );
                                                    console.log(
                                                        '🔍 [Config Panel] Category keys:',
                                                        Object.keys(
                                                            loadedCategories,
                                                        ),
                                                    );

                                                    // Only update if we got valid data from API (existing is not undefined)
                                                    // AND we're still loading for the same entity (prevent race conditions)
                                                    // AND if the user hasn't made any unsaved changes yet (check ref for async safety)
                                                    if (
                                                        existing &&
                                                        Object.keys(
                                                            loadedCategories,
                                                        ).length > 0 &&
                                                        configPanelDataLoadedRef.current ===
                                                            currentEntityId &&
                                                        !hasConfigUnsavedChangesRef.current
                                                    ) {
                                                        console.log(
                                                            '✅ [Config Panel] Setting form with loaded categories',
                                                        );
                                                        setConfigForm({
                                                            accountId:
                                                                existing?.accountId ||
                                                                selectedAccountId ||
                                                                '',
                                                            accountName:
                                                                existing?.accountName ||
                                                                selectedAccountName ||
                                                                '',
                                                            enterpriseId:
                                                                existing?.enterpriseId ||
                                                                selectedEnterpriseId ||
                                                                '',
                                                            enterpriseName:
                                                                existing?.enterpriseName ||
                                                                selectedEnterprise ||
                                                                '',
                                                            workstreams:
                                                                existing?.workstreams || [
                                                                    row.workstream,
                                                                ],
                                                            selections:
                                                                loadedCategories,
                                                        });
                                                        // Set original selections to track changes
                                                        setOriginalConfigSelections(
                                                            JSON.parse(
                                                                JSON.stringify(
                                                                    loadedCategories,
                                                                ),
                                                            ),
                                                        );
                                                        setHasConfigUnsavedChanges(
                                                            false,
                                                        );
                                                        console.log(
                                                            '✅ [Config Panel] Form state set, selections:',
                                                            loadedCategories,
                                                        );
                                                    } else if (!existing) {
                                                        console.log(
                                                            '⚠️ [Config Panel] No existing config found in API, keeping pre-populated data',
                                                        );
                                                        // Keep the pre-populated data from row (already set above)
                                                    } else if (
                                                        configPanelDataLoadedRef.current !==
                                                        currentEntityId
                                                    ) {
                                                        console.log(
                                                            '⚠️ [Config Panel] Skipping form update - entity ID mismatch',
                                                        );
                                                    } else {
                                                        console.log(
                                                            '⚠️ [Config Panel] Skipping form update - user has unsaved changes',
                                                        );
                                                    }
                                                } catch (error) {
                                                    console.log(
                                                        '⚠️ [Config Panel] No existing config found in API, keeping pre-populated data:',
                                                        error,
                                                    );
                                                    // Keep the pre-populated data from row (already set above)
                                                }
                                            } catch (error) {
                                                console.error(
                                                    'Error loading configuration data:',
                                                    error,
                                                );
                                            }
                                        } else {
                                            showBlueNotification(
                                                'Please enter a workstream name before configuring it.',
                                                3000,
                                                false,
                                            );
                                        }
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Blue-themed Notification Component - Positioned above Save button - exactly like Manage Users */}
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

            {/* Validation Modal - exactly like Manage Users */}
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
                                        console.log(
                                            '✅ Validation modal dismissed - enabling row highlighting for incomplete rows:',
                                            incompleteRows,
                                        );
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

            {/* Duplicate Entry Modal - exactly like Validation Modal */}
            {showDuplicateModal && (
                <div className='fixed inset-0 z-50 overflow-y-auto'>
                    <div className='flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0'>
                        <div
                            className='fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity'
                            onClick={() => {
                                setShowDuplicateModal(false);
                                duplicateDetectedRef.current = false; // Reset flag
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
                                        Duplicate Entry Detected
                                    </h3>
                                    <div className='mt-2'>
                                        <p className='text-sm text-gray-500 whitespace-pre-line'>
                                            {duplicateMessage}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className='mt-5 sm:mt-4 sm:flex sm:flex-row-reverse'>
                                <button
                                    type='button'
                                    onClick={() => {
                                        setShowDuplicateModal(false);
                                        duplicateDetectedRef.current = false; // Reset flag
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

            {/* Delete Confirmation Modal - match Manage Users styling */}
            {showDeleteConfirmation && (
                <div className='fixed inset-0 z-50 overflow-y-auto'>
                    <div className='flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0'>
                        <div
                            className='fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity'
                            onClick={() => {
                                setPendingDeleteRowId(null);
                                setShowDeleteConfirmation(false);
                                setCompressingRowId(null);
                                setFoldingRowId(null);
                            }}
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
                                            Are you sure you want to delete this
                                            Workstream?
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className='mt-5 sm:mt-4 sm:flex sm:flex-row-reverse'>
                                <button
                                    type='button'
                                    disabled={deletingRow}
                                    className='inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto'
                                    onClick={confirmDelete}
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
                                            Deleting...
                                        </>
                                    ) : (
                                        'Yes'
                                    )}
                                </button>
                                <button
                                    type='button'
                                    disabled={deletingRow}
                                    className='mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed sm:mt-0 sm:w-auto'
                                    onClick={() => {
                                        setPendingDeleteRowId(null);
                                        setShowDeleteConfirmation(false);
                                        setCompressingRowId(null);
                                        setFoldingRowId(null);
                                    }}
                                >
                                    No
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </div>
            )}

            {/* Configuration Panel */}
            <AnimatePresence>
                {isConfigurationPanelOpen && configPanelEntity && (
                    <div className='fixed inset-0 z-[9999] overflow-hidden'>
                        {/* Backdrop */}
                        <div
                            className='absolute inset-0 bg-black bg-opacity-50'
                            onClick={() => {
                                if (hasConfigUnsavedChanges) {
                                    setShowConfigUnsavedChangesDialog(true);
                                } else {
                                    setIsConfigurationPanelOpen(false);
                                    configPanelDataLoadedRef.current = null;
                                }
                            }}
                        />

                        {/* Modal Panel */}
                        <motion.div
                            className='absolute right-0 top-0 h-screen w-[920px] shadow-2xl border-l border-gray-200 flex overflow-hidden pointer-events-auto bg-white'
                            initial={{x: '100%'}}
                            animate={{x: 0}}
                            exit={{x: '100%'}}
                            transition={{
                                type: 'spring',
                                stiffness: 300,
                                damping: 30,
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Left Panel - Sidebar Image */}
                            <div className='w-10 bg-slate-800 text-white flex flex-col relative h-screen'>
                                <img
                                    src='/images/logos/sidebar.png'
                                    alt='Sidebar'
                                    className='w-full h-full object-cover'
                                />

                                {/* Middle Text - Rotated and Bold */}
                                <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -rotate-90 origin-center z-10'>
                                    <div className='flex items-center space-x-2 text-sm font-bold text-white whitespace-nowrap tracking-wide'>
                                        <Settings className='h-4 w-4' />
                                        <span>Configure Tools</span>
                                    </div>
                                </div>
                            </div>

                            {/* Main Content */}
                            <div className='flex-1 flex flex-col bg-white overflow-auto'>
                                {/* Header */}
                                <div className='bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 px-6 py-4 border-b border-blue-500/20 flex-shrink-0'>
                                    <div className='flex items-center justify-between'>
                                        <div>
                                            <p className='text-blue-100 text-base'>
                                                Configure Global Settings
                                            </p>
                                        </div>
                                        <div className='flex items-center space-x-2'>
                                            <button
                                                onClick={() => {
                                                    if (
                                                        hasConfigUnsavedChanges
                                                    ) {
                                                        setShowConfigUnsavedChangesDialog(
                                                            true,
                                                        );
                                                    } else {
                                                        setIsConfigurationPanelOpen(
                                                            false,
                                                        );
                                                        configPanelDataLoadedRef.current =
                                                            null;
                                                    }
                                                }}
                                                className='p-2 text-white/70 hover:text-white hover:bg-white/10 transition-colors rounded-lg'
                                            >
                                                <X className='h-5 w-5' />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Entity Info */}
                                    <div className='mt-4 flex gap-3'>
                                        <div className='flex-1 max-w-xs'>
                                            <div className='text-blue-100 text-sm font-medium mb-1'>
                                                Workstream Name
                                            </div>
                                            <div className='bg-white/10 rounded px-2 py-1 backdrop-blur-sm border border-white/20 min-h-[28px] flex items-center'>
                                                <div className='text-white font-medium truncate text-xs'>
                                                    {configPanelEntity.workstream ||
                                                        '\u00A0'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className='flex-1 max-w-xs'>
                                            <div className='text-blue-100 text-sm font-medium mb-1'>
                                                Account
                                            </div>
                                            <div className='bg-white/10 rounded px-2 py-1 backdrop-blur-sm border border-white/20 min-h-[28px] flex items-center'>
                                                <div className='text-white font-medium truncate text-xs'>
                                                    {configPanelEntity.account ||
                                                        '\u00A0'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className='flex-1'>
                                            <div className='text-blue-100 text-sm font-medium mb-1'>
                                                Enterprise
                                            </div>
                                            <div className='bg-white/10 rounded px-2 py-1 backdrop-blur-sm border border-white/20 min-h-[28px] flex items-center'>
                                                <div className='text-white font-medium truncate text-xs'>
                                                    {configPanelEntity.enterprise ||
                                                        '\u00A0'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Selected Tools Count */}
                                    <div className='mt-3'>
                                        <div className='text-blue-100 text-sm'>
                                            Selected Tools:{' '}
                                            <span className='font-semibold text-white'>
                                                {Object.values(
                                                    configForm.selections,
                                                ).reduce(
                                                    (sum: number, arr: any) =>
                                                        sum +
                                                        (Array.isArray(arr)
                                                            ? arr.length
                                                            : 0),
                                                    0,
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Toolbar - Global Search and Save Button at Top */}
                                <div className='p-4 border-b border-gray-200 bg-white flex-shrink-0'>
                                    <div className='flex items-center justify-between gap-4'>
                                        {/* Left side - Global Search */}
                                        <div className='flex items-center'>
                                            <div className='relative w-80'>
                                                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                                                    <MagnifyingGlassIcon className='h-5 w-5 text-secondary' />
                                                </div>
                                                <input
                                                    type='text'
                                                    placeholder='Global Search'
                                                    value={configSearchTerm}
                                                    onChange={(e) => {
                                                        setConfigSearchTerm(
                                                            e.target.value,
                                                        );
                                                        setAppliedConfigSearchTerm(
                                                            e.target.value,
                                                        );
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            setAppliedConfigSearchTerm(
                                                                configSearchTerm,
                                                            );
                                                        }
                                                    }}
                                                    className='search-placeholder block w-full pl-10 pr-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-sm'
                                                    style={{fontSize: '14px'}}
                                                />
                                                {appliedConfigSearchTerm && (
                                                    <button
                                                        onClick={() => {
                                                            setConfigSearchTerm(
                                                                '',
                                                            );
                                                            setAppliedConfigSearchTerm(
                                                                '',
                                                            );
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

                                        {/* Right side - Save Button */}
                                        <div className='flex items-center gap-3'>
                                            <button
                                                onClick={async () => {
                                                    if (!configPanelEntity)
                                                        return;
                                                    const entityName =
                                                        configPanelEntity.workstream;
                                                    const toolCount =
                                                        Object.values(
                                                            configForm.selections,
                                                        ).reduce(
                                                            (
                                                                sum: number,
                                                                arr: any,
                                                            ) =>
                                                                sum +
                                                                (Array.isArray(
                                                                    arr,
                                                                )
                                                                    ? arr.length
                                                                    : 0),
                                                            0,
                                                        );
                                                    // API stores categories in 'configuration' field as an object, not as 'categories'
                                                    const saveData = {
                                                        workstreamName:
                                                            entityName, // API expects entityName
                                                        accountId:
                                                            configForm.accountId,
                                                        accountName:
                                                            configForm.accountName ||
                                                            accounts.find(
                                                                (a) =>
                                                                    a.id ===
                                                                    configForm.accountId,
                                                            )?.accountName ||
                                                            '',
                                                        enterpriseId:
                                                            configForm.enterpriseId,
                                                        enterpriseName:
                                                            configForm.enterpriseName,
                                                        workstreams:
                                                            configForm.workstreams.includes(
                                                                entityName,
                                                            )
                                                                ? configForm.workstreams
                                                                : [
                                                                      ...configForm.workstreams,
                                                                      entityName,
                                                                  ],
                                                        configuration:
                                                            configForm.selections, // API stores categories in 'configuration' field as object
                                                        categories:
                                                            configForm.selections, // Also save as categories for compatibility
                                                        configurationDetails:
                                                            configForm.selections, // Also save as configurationDetails for compatibility
                                                    };
                                                    setIsSavingConfig(true);
                                                    try {
                                                        // Use record ID if it exists and is not a temporary ID, otherwise use workstream name
                                                        const recordId =
                                                            configPanelEntity.id &&
                                                            !String(
                                                                configPanelEntity.id,
                                                            ).startsWith('tmp-')
                                                                ? configPanelEntity.id
                                                                : null;

                                                        let saveResult;
                                                        if (recordId) {
                                                            // Existing record - use ID in URL
                                                            try {
                                                                saveResult =
                                                                    await api.put(
                                                                        `/api/global-settings/${recordId}`,
                                                                        saveData,
                                                                    );
                                                            } catch (updateError: any) {
                                                                // If PUT fails, try POST as fallback
                                                                if (
                                                                    updateError?.message?.includes(
                                                                        '404',
                                                                    ) ||
                                                                    updateError?.message?.includes(
                                                                        'not found',
                                                                    )
                                                                ) {
                                                                    console.log(
                                                                        '⚠️ Record not found with ID, creating new record',
                                                                    );
                                                                    saveResult =
                                                                        await api.post(
                                                                            '/api/global-settings',
                                                                            saveData,
                                                                        );
                                                                } else {
                                                                    throw updateError;
                                                                }
                                                            }
                                                        } else {
                                                            // New record - try PUT with workstream name first, fallback to POST
                                                            try {
                                                                saveResult =
                                                                    await api.put(
                                                                        `/api/global-settings/${encodeURIComponent(
                                                                            entityName,
                                                                        )}`,
                                                                        saveData,
                                                                    );
                                                            } catch (updateError: any) {
                                                                if (
                                                                    updateError?.message?.includes(
                                                                        '404',
                                                                    ) ||
                                                                    updateError?.message?.includes(
                                                                        'not found',
                                                                    )
                                                                ) {
                                                                    saveResult =
                                                                        await api.post(
                                                                            '/api/global-settings',
                                                                            saveData,
                                                                        );
                                                                } else {
                                                                    throw updateError;
                                                                }
                                                            }
                                                        }

                                                        // Handle empty response (some APIs return 200 OK with empty body)
                                                        // The api utility should handle this, but we'll ensure we don't fail on undefined
                                                        if (
                                                            saveResult ===
                                                                undefined ||
                                                            saveResult === null
                                                        ) {
                                                            console.log(
                                                                '✅ Save successful (empty response)',
                                                            );
                                                        }

                                                        // Extract the saved record ID from the response (if available)
                                                        const savedRecordId =
                                                            saveResult &&
                                                            typeof saveResult ===
                                                                'object' &&
                                                            'id' in saveResult
                                                                ? (
                                                                      saveResult as any
                                                                  ).id
                                                                : null;
                                                        const isNewRecord =
                                                            configPanelEntity.id &&
                                                            String(
                                                                configPanelEntity.id,
                                                            ).startsWith(
                                                                'tmp-',
                                                            );

                                                        // Update the local state IMMEDIATELY to reflect changes in hover panel
                                                        // This ensures the configuration icon shows updated tools right away
                                                        setGlobalSettings(
                                                            (prev) => {
                                                                const updated =
                                                                    prev.map(
                                                                        (
                                                                            row,
                                                                        ) => {
                                                                            if (
                                                                                row.id ===
                                                                                    configPanelEntity.id ||
                                                                                row.workstream ===
                                                                                    entityName
                                                                            ) {
                                                                                // Update configuration details and configuration field
                                                                                const updatedRow =
                                                                                    {
                                                                                        ...row,
                                                                                        configuration:
                                                                                            toolCount >
                                                                                            0
                                                                                                ? `${toolCount} tools selected`
                                                                                                : 'Not configured',
                                                                                        configurationDetails:
                                                                                            configForm.selections, // This is what the hover panel reads
                                                                                        isConfigured:
                                                                                            toolCount >
                                                                                            0,
                                                                                        account:
                                                                                            configForm.accountName ||
                                                                                            row.account,
                                                                                        enterprise:
                                                                                            configForm.enterpriseName ||
                                                                                            row.enterprise,
                                                                                    };

                                                                                console.log(
                                                                                    '🔄 [Config Save] Updating row configuration immediately:',
                                                                                    {
                                                                                        rowId: row.id,
                                                                                        workstream:
                                                                                            entityName,
                                                                                        toolCount,
                                                                                        configurationDetails:
                                                                                            configForm.selections,
                                                                                    },
                                                                                );

                                                                                // If this was a new record and we got an ID from the save, update the ID
                                                                                if (
                                                                                    isNewRecord &&
                                                                                    savedRecordId
                                                                                ) {
                                                                                    console.log(
                                                                                        '🔄 Updating temporary row ID from',
                                                                                        configPanelEntity.id,
                                                                                        'to',
                                                                                        savedRecordId,
                                                                                    );
                                                                                    // Update original workstream names ref with new ID
                                                                                    originalEntityNamesRef.current.delete(
                                                                                        configPanelEntity.id,
                                                                                    );
                                                                                    originalEntityNamesRef.current.set(
                                                                                        savedRecordId,
                                                                                        entityName,
                                                                                    );
                                                                                    return {
                                                                                        ...updatedRow,
                                                                                        id: savedRecordId,
                                                                                    };
                                                                                }

                                                                                return updatedRow;
                                                                            }
                                                                            return row;
                                                                        },
                                                                    );

                                                                // Update the ref immediately to keep it in sync with state
                                                                // This ensures autosave and other functions see the updated configuration
                                                                globalSettingsRef.current =
                                                                    updated;

                                                                // Force a re-render by returning a new array reference
                                                                return updated;
                                                            },
                                                        );

                                                        // The save has already been completed above (PUT/POST), so the record is in the database
                                                        // For existing records, remove from modified records since we just saved it
                                                        if (
                                                            configPanelEntity.id &&
                                                            !String(
                                                                configPanelEntity.id,
                                                            ).startsWith('tmp-')
                                                        ) {
                                                            // Remove from modified records since we just saved it
                                                            setModifiedExistingRecords(
                                                                (prev) => {
                                                                    const newSet =
                                                                        new Set(
                                                                            prev,
                                                                        );
                                                                    newSet.delete(
                                                                        String(
                                                                            configPanelEntity.id,
                                                                        ),
                                                                    );
                                                                    return newSet;
                                                                },
                                                            );
                                                        } else if (
                                                            isNewRecord &&
                                                            savedRecordId
                                                        ) {
                                                            // For new records that were just saved, the record is already in the database
                                                            // Remove the temporary ID from modified records
                                                            setModifiedExistingRecords(
                                                                (prev) => {
                                                                    const newSet =
                                                                        new Set(
                                                                            prev,
                                                                        );
                                                                    newSet.delete(
                                                                        String(
                                                                            configPanelEntity.id,
                                                                        ),
                                                                    );
                                                                    return newSet;
                                                                },
                                                            );
                                                            // Note: The record is already saved, so autosave won't find it as a temporary row
                                                            // This is expected and correct behavior
                                                        }

                                                        // Update original selections to reflect saved state
                                                        setOriginalConfigSelections(
                                                            JSON.parse(
                                                                JSON.stringify(
                                                                    configForm.selections,
                                                                ),
                                                            ),
                                                        );
                                                        setHasConfigUnsavedChanges(
                                                            false,
                                                        );

                                                        showBlueNotification(
                                                            'Configuration saved successfully',
                                                            3000,
                                                            true,
                                                        );

                                                        // Small delay before closing modal to ensure state update propagates and hover panel updates
                                                        // This ensures the configuration icon shows the updated tools immediately
                                                        setTimeout(() => {
                                                            // Close panel and clear the loaded entity ref
                                                            setIsConfigurationPanelOpen(
                                                                false,
                                                            );
                                                            configPanelDataLoadedRef.current =
                                                                null;
                                                        }, 100); // Small delay to ensure React re-renders with updated state

                                                        // After saving configuration, trigger autosave for both new and existing records
                                                        // This ensures any additional changes (like workstream name changes) are also saved
                                                        // The configuration is already saved via PUT/POST, but autosave will handle other field changes
                                                        setTimeout(() => {
                                                            // Find the row to trigger autosave for
                                                            setGlobalSettings(
                                                                (prev) => {
                                                                    const rowToSave =
                                                                        prev.find(
                                                                            (
                                                                                r,
                                                                            ) => {
                                                                                if (
                                                                                    !r.workstream ||
                                                                                    !r.workstream.trim()
                                                                                )
                                                                                    return false;

                                                                                // For new records, look for saved ID or temp ID
                                                                                if (
                                                                                    isNewRecord
                                                                                ) {
                                                                                    if (
                                                                                        savedRecordId &&
                                                                                        r.id ===
                                                                                            savedRecordId
                                                                                    )
                                                                                        return true;
                                                                                    if (
                                                                                        !savedRecordId
                                                                                    ) {
                                                                                        return (
                                                                                            r.id ===
                                                                                                configPanelEntity.id ||
                                                                                            r.workstream ===
                                                                                                entityName
                                                                                        );
                                                                                    }
                                                                                } else {
                                                                                    // For existing records, look for the record ID or workstream name
                                                                                    return (
                                                                                        r.id ===
                                                                                            configPanelEntity.id ||
                                                                                        r.workstream ===
                                                                                            entityName
                                                                                    );
                                                                                }

                                                                                return false;
                                                                            },
                                                                        );

                                                                    if (
                                                                        rowToSave &&
                                                                        debouncedAutoSaveRef.current
                                                                    ) {
                                                                        console.log(
                                                                            '🔄 Configuration saved - triggering autosave timer to save any additional changes:',
                                                                            rowToSave.workstream,
                                                                        );
                                                                        debouncedAutoSaveRef.current();
                                                                    }

                                                                    // Return unchanged state - we're just triggering autosave
                                                                    return prev;
                                                                },
                                                            );
                                                        }, 300);

                                                        // Reload data after configuration save to reflect changes
                                                        // For new records, wait for autosave to complete (which will save workstream name)
                                                        // For existing records, reload immediately
                                                        if (isNewRecord) {
                                                            // For new records, don't reload immediately - wait for autosave to complete
                                                            // The autosave will save the workstream name, and then reload after completion
                                                            console.log(
                                                                '🔄 New record - skipping immediate reload, will reload after autosave completes',
                                                            );
                                                        } else {
                                                            // For existing records, reload immediately to show latest data
                                                            console.log(
                                                                '🔄 Reloading data immediately after configuration save...',
                                                            );
                                                            setTimeout(() => {
                                                                loadGlobalSettings(
                                                                    {
                                                                        accountId:
                                                                            configForm.accountId ||
                                                                            selectedAccountId,
                                                                        accountName:
                                                                            configForm.accountName ||
                                                                            selectedAccountName,
                                                                        enterpriseId:
                                                                            configForm.enterpriseId ||
                                                                            selectedEnterpriseId,
                                                                        enterpriseName:
                                                                            configForm.enterpriseName ||
                                                                            selectedEnterprise,
                                                                    },
                                                                );
                                                            }, 500); // Small delay to ensure state update and modal close complete
                                                        }
                                                    } catch (error) {
                                                        console.error(
                                                            'Error saving configuration:',
                                                            error,
                                                        );
                                                        showBlueNotification(
                                                            'Failed to save configuration',
                                                            3000,
                                                            false,
                                                        );
                                                    } finally {
                                                        setIsSavingConfig(
                                                            false,
                                                        );
                                                    }
                                                }}
                                                disabled={isSavingConfig}
                                                className={`flex items-center space-x-2 px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors shadow-sm ${
                                                    isSavingConfig
                                                        ? 'bg-blue-400 cursor-not-allowed'
                                                        : 'bg-blue-600 hover:bg-blue-700'
                                                }`}
                                            >
                                                <BookmarkIcon className='h-4 w-4' />
                                                <span>
                                                    {isSavingConfig
                                                        ? 'Saving...'
                                                        : 'Save'}
                                                </span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className='flex-1 bg-gray-50 overflow-hidden'>
                                        <div className='h-full overflow-y-auto px-6 py-6'>
                                            <div className='space-y-4'>
                                                <div className='flex flex-col gap-4'>
                                                    {(() => {
                                                        // Debug: Log current selections when rendering
                                                        console.log(
                                                            '🔍 [Config Panel] Rendering with selections:',
                                                            configForm.selections,
                                                        );
                                                        console.log(
                                                            '🔍 [Config Panel] Selections keys:',
                                                            Object.keys(
                                                                configForm.selections,
                                                            ),
                                                        );
                                                        return null;
                                                    })()}
                                                    {
                                                        Object.entries({
                                                            plan: [
                                                                'Jira',
                                                                'Azure DevOps',
                                                                'Trello',
                                                                'Asana',
                                                                'Other',
                                                            ],
                                                            code: [
                                                                'GitHub',
                                                                'GitLab',
                                                                'Azure Repos',
                                                                'Bitbucket',
                                                                'SonarQube',
                                                                'Other',
                                                            ],
                                                            build: [
                                                                'Jenkins',
                                                                'GitHub Actions',
                                                                'CircleCI',
                                                                'AWS CodeBuild',
                                                                'Google Cloud Build',
                                                                'Azure DevOps',
                                                                'Other',
                                                            ],
                                                            test: [
                                                                'Cypress',
                                                                'Selenium',
                                                                'Jest',
                                                                'Tricentis Tosca',
                                                                'Other',
                                                            ],
                                                            release: [
                                                                'Argo CD',
                                                                'ServiceNow',
                                                                'Azure DevOps',
                                                                'Other',
                                                            ],
                                                            deploy: [
                                                                'Kubernetes',
                                                                'Helm',
                                                                'Terraform',
                                                                'Ansible',
                                                                'Docker',
                                                                'AWS CodePipeline',
                                                                'Cloud Foundry',
                                                                'Other',
                                                            ],
                                                            others: [
                                                                'Prometheus',
                                                                'Grafana',
                                                                'Slack',
                                                                'Other',
                                                            ],
                                                        })
                                                            .filter(
                                                                ([
                                                                    category,
                                                                    options,
                                                                ]) => {
                                                                    // Filter categories based on search term
                                                                    if (
                                                                        !appliedConfigSearchTerm
                                                                    )
                                                                        return true;
                                                                    const searchLower =
                                                                        appliedConfigSearchTerm.toLowerCase();
                                                                    // Show category if category name or any tool name matches
                                                                    return (
                                                                        category
                                                                            .toLowerCase()
                                                                            .includes(
                                                                                searchLower,
                                                                            ) ||
                                                                        options.some(
                                                                            (
                                                                                opt,
                                                                            ) =>
                                                                                opt
                                                                                    .toLowerCase()
                                                                                    .includes(
                                                                                        searchLower,
                                                                                    ),
                                                                        )
                                                                    );
                                                                },
                                                            )
                                                            .map(
                                                                ([
                                                                    category,
                                                                    options,
                                                                ]) => {
                                                                    // Filter options within category based on search term
                                                                    const filteredOptions =
                                                                        !appliedConfigSearchTerm
                                                                            ? options
                                                                            : options.filter(
                                                                                  (
                                                                                      opt,
                                                                                  ) =>
                                                                                      opt
                                                                                          .toLowerCase()
                                                                                          .includes(
                                                                                              appliedConfigSearchTerm.toLowerCase(),
                                                                                          ) ||
                                                                                      category
                                                                                          .toLowerCase()
                                                                                          .includes(
                                                                                              appliedConfigSearchTerm.toLowerCase(),
                                                                                          ),
                                                                              );

                                                                    // Don't render category if no options match
                                                                    if (
                                                                        filteredOptions.length ===
                                                                        0
                                                                    )
                                                                        return null;

                                                                    const OPTION_ICON: Record<
                                                                        string,
                                                                        {
                                                                            name: string;
                                                                        }
                                                                    > = {
                                                                        Jira: {
                                                                            name: 'jira',
                                                                        },
                                                                        'Azure DevOps':
                                                                            {
                                                                                name: 'azdo',
                                                                            },
                                                                        Trello: {
                                                                            name: 'trello',
                                                                        },
                                                                        Asana: {
                                                                            name: 'asana',
                                                                        },
                                                                        GitHub: {
                                                                            name: 'github',
                                                                        },
                                                                        'GitHub Actions':
                                                                            {
                                                                                name: 'github',
                                                                            },
                                                                        GitLab: {
                                                                            name: 'gitlab',
                                                                        },
                                                                        'Azure Repos':
                                                                            {
                                                                                name: 'azure',
                                                                            },
                                                                        Bitbucket:
                                                                            {
                                                                                name: 'bitbucket',
                                                                            },
                                                                        SonarQube:
                                                                            {
                                                                                name: 'sonarqube',
                                                                            },
                                                                        Jenkins:
                                                                            {
                                                                                name: 'jenkins',
                                                                            },
                                                                        CircleCI:
                                                                            {
                                                                                name: 'circleci',
                                                                            },
                                                                        'AWS CodeBuild':
                                                                            {
                                                                                name: 'aws',
                                                                            },
                                                                        'Google Cloud Build':
                                                                            {
                                                                                name: 'cloudbuild',
                                                                            },
                                                                        Cypress:
                                                                            {
                                                                                name: 'cypress',
                                                                            },
                                                                        Selenium:
                                                                            {
                                                                                name: 'selenium',
                                                                            },
                                                                        Jest: {
                                                                            name: 'jest',
                                                                        },
                                                                        'Tricentis Tosca':
                                                                            {
                                                                                name: 'jest',
                                                                            },
                                                                        'Argo CD':
                                                                            {
                                                                                name: 'argo',
                                                                            },
                                                                        ServiceNow:
                                                                            {
                                                                                name: 'slack',
                                                                            },
                                                                        Kubernetes:
                                                                            {
                                                                                name: 'kubernetes',
                                                                            },
                                                                        Helm: {
                                                                            name: 'helm',
                                                                        },
                                                                        Terraform:
                                                                            {
                                                                                name: 'terraform',
                                                                            },
                                                                        Ansible:
                                                                            {
                                                                                name: 'ansible',
                                                                            },
                                                                        Docker: {
                                                                            name: 'docker',
                                                                        },
                                                                        'AWS CodePipeline':
                                                                            {
                                                                                name: 'codepipeline',
                                                                            },
                                                                        'Cloud Foundry':
                                                                            {
                                                                                name: 'cloudfoundry',
                                                                            },
                                                                        Prometheus:
                                                                            {
                                                                                name: 'prometheus',
                                                                            },
                                                                        Grafana:
                                                                            {
                                                                                name: 'grafana',
                                                                            },
                                                                        Slack: {
                                                                            name: 'slack',
                                                                        },
                                                                        Other: {
                                                                            name: 'maven',
                                                                        },
                                                                    };

                                                                    return (
                                                                        <div
                                                                            key={
                                                                                category
                                                                            }
                                                                            className='relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-3 shadow-md'
                                                                        >
                                                                            <div className='mb-2 flex items-center justify-between'>
                                                                                <div className='text-sm font-semibold capitalize text-primary'>
                                                                                    {
                                                                                        category
                                                                                    }
                                                                                </div>
                                                                                <div className='text-xs text-secondary'>
                                                                                    {
                                                                                        (
                                                                                            configForm
                                                                                                .selections[
                                                                                                category
                                                                                            ] ||
                                                                                            []
                                                                                        )
                                                                                            .length
                                                                                    }{' '}
                                                                                    selected
                                                                                </div>
                                                                            </div>
                                                                            <div className='flex flex-wrap gap-3'>
                                                                                {options.map(
                                                                                    (
                                                                                        opt,
                                                                                    ) => {
                                                                                        const categorySelections =
                                                                                            configForm
                                                                                                .selections[
                                                                                                category
                                                                                            ] ||
                                                                                            [];
                                                                                        const isSelected =
                                                                                            categorySelections.includes(
                                                                                                opt,
                                                                                            );
                                                                                        // Debug: Log selection check for first option of each category
                                                                                        if (
                                                                                            opt ===
                                                                                            options[0]
                                                                                        ) {
                                                                                            console.log(
                                                                                                `🔍 [Config Panel] Category "${category}": selections=${JSON.stringify(
                                                                                                    categorySelections,
                                                                                                )}, checking "${opt}", isSelected=${isSelected}`,
                                                                                            );
                                                                                        }
                                                                                        return (
                                                                                            <button
                                                                                                key={
                                                                                                    opt
                                                                                                }
                                                                                                type='button'
                                                                                                onClick={() => {
                                                                                                    setConfigForm(
                                                                                                        (
                                                                                                            prev,
                                                                                                        ) => {
                                                                                                            const current =
                                                                                                                prev
                                                                                                                    .selections[
                                                                                                                    category
                                                                                                                ] ||
                                                                                                                [];
                                                                                                            const next =
                                                                                                                current.includes(
                                                                                                                    opt,
                                                                                                                )
                                                                                                                    ? current.filter(
                                                                                                                          (
                                                                                                                              x,
                                                                                                                          ) =>
                                                                                                                              x !==
                                                                                                                              opt,
                                                                                                                      )
                                                                                                                    : [
                                                                                                                          ...current,
                                                                                                                          opt,
                                                                                                                      ];
                                                                                                            return {
                                                                                                                ...prev,
                                                                                                                selections:
                                                                                                                    {
                                                                                                                        ...prev.selections,
                                                                                                                        [category]:
                                                                                                                            next,
                                                                                                                    },
                                                                                                            };
                                                                                                        },
                                                                                                    );
                                                                                                    // Mark as having unsaved changes
                                                                                                    setHasConfigUnsavedChanges(
                                                                                                        true,
                                                                                                    );
                                                                                                }}
                                                                                                className={`group relative flex flex-col items-center gap-1.5 rounded-xl border px-3 py-2 text-center transition-all duration-200 ${
                                                                                                    isSelected
                                                                                                        ? 'bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300 text-blue-900 border-blue-400 shadow-md'
                                                                                                        : 'bg-white/90 text-primary border-slate-200 hover:bg-white hover:shadow'
                                                                                                }`}
                                                                                            >
                                                                                                {/* Checkmark icon in top right corner */}
                                                                                                {isSelected && (
                                                                                                    <div className='absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-sm'>
                                                                                                        <svg
                                                                                                            className='h-3 w-3 text-blue-600'
                                                                                                            fill='none'
                                                                                                            viewBox='0 0 24 24'
                                                                                                            stroke='currentColor'
                                                                                                            strokeWidth={
                                                                                                                3
                                                                                                            }
                                                                                                        >
                                                                                                            <path
                                                                                                                strokeLinecap='round'
                                                                                                                strokeLinejoin='round'
                                                                                                                d='M5 13l4 4L19 7'
                                                                                                            />
                                                                                                        </svg>
                                                                                                    </div>
                                                                                                )}
                                                                                                <div
                                                                                                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                                                                                                        isSelected
                                                                                                            ? 'bg-white/40'
                                                                                                            : 'bg-slate-50'
                                                                                                    }`}
                                                                                                >
                                                                                                    <Icon
                                                                                                        name={
                                                                                                            OPTION_ICON[
                                                                                                                opt
                                                                                                            ]
                                                                                                                ?.name ||
                                                                                                            'git'
                                                                                                        }
                                                                                                        size={
                                                                                                            24
                                                                                                        }
                                                                                                        className={
                                                                                                            isSelected
                                                                                                                ? 'text-blue-700'
                                                                                                                : 'text-primary'
                                                                                                        }
                                                                                                    />
                                                                                                </div>
                                                                                                <div
                                                                                                    className={`text-xs font-medium ${
                                                                                                        isSelected
                                                                                                            ? 'text-blue-900'
                                                                                                            : ''
                                                                                                    }`}
                                                                                                >
                                                                                                    {
                                                                                                        opt
                                                                                                    }
                                                                                                </div>
                                                                                            </button>
                                                                                        );
                                                                                    },
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                },
                                                            )
                                                            .filter(Boolean) // Remove null entries from filtered categories
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Unsaved Changes Confirmation Dialog for Configuration Panel */}
            <AnimatePresence>
                {showConfigUnsavedChangesDialog && (
                    <motion.div
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        exit={{opacity: 0}}
                        className='fixed inset-0 z-[10000] flex items-center justify-center p-4 pointer-events-auto'
                    >
                        <div className='absolute inset-0 bg-black bg-opacity-60' />
                        <motion.div
                            initial={{scale: 0.95, opacity: 0}}
                            animate={{scale: 1, opacity: 1}}
                            exit={{scale: 0.95, opacity: 0}}
                            className='relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6'
                        >
                            <div className='flex items-center space-x-3 mb-4'>
                                <div className='p-2 bg-amber-100 rounded-full'>
                                    <XCircle className='h-5 w-5 text-amber-600' />
                                </div>
                                <h3 className='text-lg font-semibold text-slate-900'>
                                    Unsaved Changes
                                </h3>
                            </div>

                            <p className='text-slate-600 mb-6'>
                                You have unsaved changes. Would you like to save
                                them before closing?
                            </p>

                            <div className='flex justify-end space-x-3'>
                                <button
                                    onClick={() => {
                                        setHasConfigUnsavedChanges(false);
                                        setShowConfigUnsavedChangesDialog(
                                            false,
                                        );
                                        setIsConfigurationPanelOpen(false);
                                        configPanelDataLoadedRef.current = null;
                                    }}
                                    className='px-4 py-2 text-slate-600 hover:text-slate-800 font-medium transition-colors'
                                >
                                    No, Discard
                                </button>
                                <button
                                    onClick={() => {
                                        setShowConfigUnsavedChangesDialog(
                                            false,
                                        );
                                    }}
                                    className='px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors'
                                >
                                    Yes, Keep Editing
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Navigation Warning Modal - exactly like Manage Users */}
            {showNavigationWarning && (
                <ConfirmModal
                    open={showNavigationWarning}
                    title='Unsaved Changes'
                    message='You have unsaved changes that will be lost if you leave. Are you sure you want to continue?'
                    confirmText='Leave Anyway'
                    cancelText='Stay Here'
                    onConfirm={() => {
                        console.log(
                            '🔄 User confirmed navigation - clearing states and executing navigation',
                        );
                        setShowNavigationWarning(false);

                        // Clear all unsaved states IMMEDIATELY
                        setIncompleteRows([]);
                        setHasUnsavedChanges(false);
                        setPreventNavigation(false);
                        setUserConfirmedLeave(true);

                        // Execute navigation immediately after state update
                        if (pendingNavigationUrl) {
                            console.log(
                                '🔄 Executing pending navigation to:',
                                pendingNavigationUrl,
                            );
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
        </div>
    );
}
