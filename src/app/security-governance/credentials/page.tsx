'use client';

/**
 * ============================================================================
 * CREDENTIALS MANAGEMENT - API-BASED STORAGE
 * ============================================================================
 *
 * This file uses backend APIs for credentials CRUD operations:
 * - GET /api/credentials - List credentials
 * - GET /api/credentials/:id - Get single credential
 * - POST /api/credentials - Create credential
 * - PUT /api/credentials/:id - Update credential
 * - DELETE /api/credentials/:id - Delete credential
 * ============================================================================
 */

import React, {useState, useEffect, useCallback, useRef} from 'react';
import {motion} from 'framer-motion';
import {useRouter} from 'next/navigation';
import Image from 'next/image';
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
import ManageCredentialsTable, {
    CredentialRow,
} from '@/components/ManageCredentialsTable';
import ConnectorModal, {Connector} from '@/components/ConnectorModal';
import {api, API_BASE} from '@/utils/api';
import {generateId} from '@/utils/id-generator';

export default function ManageCredentials() {
    // Router for navigation interception
    const router = useRouter();

    // Debug: Track re-renders
    const renderCountRef = useRef(0);
    renderCountRef.current += 1;

    // ============================================================================
    // API-BASED CREDENTIALS CRUD OPERATIONS
    // ============================================================================

    // API response type
    interface ApiResponse {
        data?: any;
        error?: string;
        id?: string;
    }

    // Load credentials from backend API
    const loadCredentialsFromAPI = useCallback(
        async (
            accountId?: string,
            enterpriseId?: string,
        ): Promise<CredentialRow[]> => {
            if (!accountId) {
                console.log('⚠️ [API] Cannot load - missing accountId');
                return [];
            }
            try {
                const queryParams = new URLSearchParams({accountId});
                if (enterpriseId) {
                    queryParams.append('enterpriseId', enterpriseId);
                }

                console.log(
                    `🔍 [API] Loading credentials for account: ${accountId}, enterprise: ${enterpriseId}`,
                );
                const response = (await api.get(
                    `/api/credentials?${queryParams.toString()}`,
                )) as ApiResponse;

                if (response.error) {
                    console.error(
                        '❌ [API] Error loading credentials:',
                        response.error,
                    );
                    return [];
                }

                const credentials = response.data || response || [];
                console.log(
                    '📦 [API] Loaded credentials from API:',
                    credentials.length,
                    'rows',
                );
                return credentials;
            } catch (error) {
                console.error(
                    '❌ [API] Failed to load credentials from API:',
                    error,
                );
                return [];
            }
        },
        [],
    );

    // Create a new credential via API
    const createCredentialAPI = useCallback(
        async (
            credential: CredentialRow,
            accountId: string,
            enterpriseId?: string,
            enterpriseName?: string,
            accountName?: string,
        ): Promise<CredentialRow | null> => {
            try {
                const payload = {
                    credentialName: credential.credentialName,
                    description: credential.description || '',
                    entity: credential.entity,
                    product: credential.product || '',
                    service: credential.service || '',
                    connector:
                        credential.connectors?.[0]?.connector ||
                        credential.scope ||
                        '',
                    connectorIconName: credential.connectorIconName || '',
                    connectors: credential.connectors || [],
                    authenticationType:
                        credential.connectors?.[0]?.authenticationType || '',
                    scope: credential.scope || '',
                    status: 'Active',
                    accountId,
                    accountName: accountName || '',
                    enterpriseId: enterpriseId || '',
                    enterpriseName: enterpriseName || '',
                    createdBy:
                        typeof window !== 'undefined'
                            ? localStorage.getItem('userEmail') || ''
                            : '',
                };
                console.log(
                    `📦 [API] Creating credential: ${credential.credentialName}`,
                );
                console.log(
                    '📦 [API] Create payload:',
                    JSON.stringify(payload, null, 2),
                );
                const response = (await api.post(
                    '/api/credentials',
                    payload,
                )) as ApiResponse;

                if (response.error) {
                    console.error(
                        '❌ [API] Error creating credential:',
                        response.error,
                    );
                    return null;
                }

                console.log(
                    '✅ [API] Credential created successfully:',
                    response.id || response.data?.id,
                );

                // Dispatch event to notify other components
                window.dispatchEvent(
                    new CustomEvent('credentialsStorageChanged', {
                        detail: {accountId, enterpriseId},
                    }),
                );

                return response.data || response;
            } catch (error) {
                console.error('❌ [API] Failed to create credential:', error);
                return null;
            }
        },
        [],
    );

    // Update an existing credential via API
    const updateCredentialAPI = useCallback(
        async (
            credential: CredentialRow,
            accountId: string,
            enterpriseId?: string,
        ): Promise<CredentialRow | null> => {
            try {
                console.log(`📝 [API] Updating credential: ${credential.id}`);
                // Get enterpriseId from localStorage if not provided
                const effectiveEnterpriseId =
                    enterpriseId ||
                    (typeof window !== 'undefined'
                        ? localStorage.getItem('selectedEnterpriseId') || ''
                        : '');

                const payload = {
                    credentialName: credential.credentialName,
                    description: credential.description || '',
                    entity: credential.entity,
                    product: credential.product || '',
                    service: credential.service || '',
                    connector:
                        credential.connectors?.[0]?.connector ||
                        credential.scope ||
                        '',
                    connectorIconName: credential.connectorIconName || '',
                    connectors: credential.connectors || [],
                    authenticationType:
                        credential.connectors?.[0]?.authenticationType || '',
                    scope: credential.scope || '',
                    status: 'Active',
                    accountId,
                    enterpriseId: effectiveEnterpriseId,
                    updatedBy:
                        typeof window !== 'undefined'
                            ? localStorage.getItem('userEmail') || ''
                            : '',
                };
                console.log(
                    '📝 [API] Update payload:',
                    JSON.stringify(payload, null, 2),
                );
                const response = (await api.put(
                    `/api/credentials/${credential.id}?accountId=${accountId}&enterpriseId=${effectiveEnterpriseId}`,
                    payload,
                )) as ApiResponse;

                if (response.error) {
                    console.error(
                        '❌ [API] Error updating credential:',
                        response.error,
                    );
                    return null;
                }

                console.log(
                    '✅ [API] Credential updated successfully:',
                    credential.id,
                );
                return response.data || response;
            } catch (error) {
                console.error('❌ [API] Failed to update credential:', error);
                return null;
            }
        },
        [],
    );

    // Delete a credential via API
    const deleteCredentialAPI = useCallback(
        async (credentialId: string, accountId: string): Promise<boolean> => {
            try {
                console.log(`🗑️ [API] Deleting credential: ${credentialId}`);
                await api.del(
                    `/api/credentials/${credentialId}?accountId=${accountId}`,
                );

                console.log(
                    '✅ [API] Credential deleted successfully:',
                    credentialId,
                );
                return true;
            } catch (error) {
                console.error('❌ [API] Failed to delete credential:', error);
                return false;
            }
        },
        [],
    );
    // ============================================================================
    // END API-BASED CREDENTIALS CRUD OPERATIONS
    // ============================================================================

    // Credential data state
    const [credentials, setCredentials] = useState<CredentialRow[]>([]);

    // Track if we're currently loading to prevent overwriting localStorage during load
    const isLoadingRef = useRef(false);

    // Client-side display order tracking - independent of API timestamps
    const displayOrderRef = useRef<Map<string, number>>(new Map());

    // Function to sort configs by client-side display order for stable UI
    const sortConfigsByDisplayOrder = useCallback(
        (configs: CredentialRow[]) => {
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

    // Connector Modal state
    const [isConnectorModalOpen, setIsConnectorModalOpen] = useState(false);
    const [selectedRowForConnector, setSelectedRowForConnector] =
        useState<CredentialRow | null>(null);

    // Check for OAuth completion and reopen modal
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const checkOAuthCompletion = () => {
            const shouldReopenModal = localStorage.getItem(
                'githubOAuthShouldReopenModal',
            );
            const connectorId = localStorage.getItem('githubOAuthConnectorId');
            const credentialName = localStorage.getItem(
                'githubOAuthCredentialName',
            );

            if (shouldReopenModal === 'true' && connectorId && credentialName) {
                // Find the row that matches the credential name
                const matchingRow = credentials.find(
                    (row) => row.credentialName === credentialName,
                );

                if (matchingRow) {
                    console.log(
                        '🔄 [OAuth] Reopening modal for credential:',
                        credentialName,
                    );
                    setSelectedRowForConnector(matchingRow);
                    setIsConnectorModalOpen(true);
                }

                // Clean up the flag (but keep connectorId for modal to check status)
                localStorage.removeItem('githubOAuthShouldReopenModal');
            }
        };

        // Check immediately
        checkOAuthCompletion();

        // Also listen for messages from OAuth callback window
        const handleOAuthMessage = (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;

            if (
                event.data.type === 'GITHUB_OAUTH_SUCCESS' ||
                event.data.type === 'GITHUB_OAUTH_ERROR'
            ) {
                checkOAuthCompletion();
            }
        };

        window.addEventListener('message', handleOAuthMessage);
        return () => {
            window.removeEventListener('message', handleOAuthMessage);
        };
    }, [credentials]);
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
                    '🐛 [ManageCredentials Page] Loading localStorage values...',
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
                    '🐛 [ManageCredentials Page] localStorage values:',
                    {
                        selectedEnterpriseName: savedName,
                        selectedEnterpriseId: savedEnterpriseId,
                        selectedAccountId: savedAccountId,
                        selectedAccountName: savedAccountName,
                    },
                );

                // Only update state if values have actually changed to prevent unnecessary re-renders
                if (savedName !== selectedEnterprise) {
                    setSelectedEnterprise(savedName || '');
                }

                const newEnterpriseId =
                    savedEnterpriseId && savedEnterpriseId !== 'null'
                        ? savedEnterpriseId
                        : '';
                if (newEnterpriseId !== selectedEnterpriseId) {
                    setSelectedEnterpriseId(newEnterpriseId);
                }

                const newAccountId =
                    savedAccountId && savedAccountId !== 'null'
                        ? savedAccountId
                        : '';
                const newAccountName =
                    savedAccountName && savedAccountName !== 'null'
                        ? savedAccountName
                        : '';

                if (newAccountId !== selectedAccountId) {
                    setSelectedAccountId(newAccountId);
                }
                if (newAccountName !== selectedAccountName) {
                    setSelectedAccountName(newAccountName);
                }

                console.log(
                    '🐛 [ManageCredentials Page] Setting state values:',
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
    }, [
        selectedEnterprise,
        selectedEnterpriseId,
        selectedAccountId,
        selectedAccountName,
    ]);

    // Debug: Log current state values
    useEffect(() => {
        console.log('🐛 [ManageCredentials Page] State updated:', {
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
    const credentialsRef = useRef<CredentialRow[]>([]);
    const modifiedExistingRecordsRef = useRef<Set<string>>(new Set());
    const originalRouterRef = useRef<any>(null); // Store original router for navigation after confirmation
    const [isAutoSaving, setIsAutoSaving] = useState(false);
    const [showAutoSaveSuccess, setShowAutoSaveSuccess] = useState(false);
    const [autoSaveCountdown, setAutoSaveCountdown] = useState<number | null>(
        null,
    );
    const [modifiedExistingRecords, setModifiedExistingRecords] = useState<
        Set<string>
    >(new Set());

    // Update ref to track current credentials state
    useEffect(() => {
        credentialsRef.current = credentials;
    }, [credentials]);

    // Note: Auto-save to localStorage has been removed - credentials are now saved via API

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
        credentialNames: [] as Array<{id: string; name: string}>,
        descriptions: [] as Array<{id: string; name: string}>,
        entities: [] as Array<{id: string; name: string}>,
        products: [] as Array<{id: string; name: string}>,
        services: [] as Array<{id: string; name: string}>,
        scope: [] as Array<{id: string; name: string}>,
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
        | 'None'
        | 'Credential Name'
        | 'Description'
        | 'Workstream'
        | 'Product'
        | 'Service'
    >('None');

    type ColumnType =
        | 'credentialName'
        | 'description'
        | 'entity'
        | 'product'
        | 'service'
        | 'scope'
        | 'actions';

    const [visibleCols, setVisibleCols] = useState<ColumnType[]>([
        'credentialName',
        'description',
        'entity',
        'product',
        'service',
        'scope',
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
    // NOTE: API calls removed - credentials should use credential-specific APIs instead
    const loadDropdownOptions = useCallback(async () => {
        try {
            // API calls removed - credentials should use credential-specific APIs
            // Original APIs: /api/user-management/roles, /api/products, /api/services
            console.log(
                '⚠️ [Credentials] loadDropdownOptions called but APIs removed - use credential APIs instead',
            );

            // Extract unique credential names from current Credentials (local state only)
            const uniqueCredentialNames = Array.from(
                new Set(
                    credentials
                        .map((credential) => credential.credentialName)
                        .filter(Boolean),
                ),
            ).map((name, index) => ({
                id: `credentialName-${name}-${index}`,
                name: name,
            }));

            // Extract unique entities from current Credentials (local state only)
            const uniqueEntities = Array.from(
                new Set(
                    credentials
                        .map((credential) => credential.entity)
                        .filter(Boolean),
                ),
            ).map((name, index) => ({
                id: `entity-${name}-${index}`,
                name: name,
            }));

            setDropdownOptions({
                credentialNames: uniqueCredentialNames,
                descriptions: [],
                entities: uniqueEntities,
                products: [],
                services: [],
                scope: [],
            });
        } catch (error) {
            console.error('Failed to load dropdown options:', error);
            // Set empty dropdown options on error to prevent infinite loops
            setDropdownOptions({
                credentialNames: [],
                descriptions: [],
                entities: [],
                products: [],
                services: [],
                scope: [],
            });
        }
    }, [credentials]);

    // Helper function to close all dialogs
    const closeAllDialogs = () => {
        setFilterVisible(false);
        setSortOpen(false);
        setHideOpen(false);
        setGroupOpen(false);
    };

    // Function to toggle dialogs
    const toggleDialog = (dialogType: 'filter' | 'sort' | 'hide' | 'group') => {
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
                case 'group':
                    setGroupOpen(true);
                    break;
            }
        }, 10);
    };

    // Ref to track current filter form values for outside click handler
    const filterFormRef = useRef({
        credentialName: '',
        description: '',
        entity: '',
        product: '',
        service: '',
    });

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
                    !currentForm.credentialName &&
                    !currentForm.description &&
                    !currentForm.entity &&
                    !currentForm.product &&
                    !currentForm.service;

                if (filterClearedRef.current || isFilterEmpty) {
                    setFilterVisible(false);
                    filterClearedRef.current = false; // Reset flag
                }
            }

            // Close Sort, Hide, group panels immediately on outside click
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

        // Add event listener
        document.addEventListener('mousedown', handleClickOutside);

        // Cleanup
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [filterVisible, sortOpen, hideOpen, groupOpen]);

    // All available columns
    const allCols: ColumnType[] = [
        'credentialName',
        'description',
        'entity',
        'product',
        'service',
        'scope',
    ];

    // Columns available for sorting
    const sortableCols: ColumnType[] = [
        'credentialName',
        'description',
        'entity',
        'product',
        'service',
    ];

    // Column label mapping - exactly like Manage Users
    const columnLabels: Record<string, string> = {
        credentialName: 'Credential Name',
        description: 'Description',
        entity: 'Workstream',
        product: 'Product',
        service: 'Service',
        scope: 'Connector',
    };

    // Process Credential data with filtering, sorting, and search
    const processedConfigs = React.useMemo(() => {
        let filtered = [...credentials];

        // Apply search filter
        if (appliedSearchTerm.trim()) {
            filtered = filtered.filter((config) => {
                const searchLower = appliedSearchTerm.toLowerCase();
                return (
                    config.credentialName
                        ?.toLowerCase()
                        .includes(searchLower) ||
                    config.description?.toLowerCase().includes(searchLower) ||
                    config.entity?.toLowerCase().includes(searchLower) ||
                    config.product?.toLowerCase().includes(searchLower) ||
                    config.service?.toLowerCase().includes(searchLower) ||
                    config.scope?.toLowerCase().includes(searchLower)
                );
            });
        }

        // Apply filters
        if (activeFilters.credentialName) {
            filtered = filtered.filter((config) =>
                config.credentialName
                    ?.toLowerCase()
                    .includes(activeFilters.credentialName.toLowerCase()),
            );
        }
        if (activeFilters.description) {
            filtered = filtered.filter((config) =>
                config.description
                    ?.toLowerCase()
                    .includes(activeFilters.description.toLowerCase()),
            );
        }
        if (activeFilters.entity) {
            filtered = filtered.filter((config) =>
                config.entity
                    ?.toLowerCase()
                    .includes(activeFilters.entity.toLowerCase()),
            );
        }
        if (activeFilters.product) {
            filtered = filtered.filter((config) =>
                config.product
                    ?.toLowerCase()
                    .includes(activeFilters.product.toLowerCase()),
            );
        }
        if (activeFilters.service) {
            filtered = filtered.filter((config) =>
                config.service
                    ?.toLowerCase()
                    .includes(activeFilters.service.toLowerCase()),
            );
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
                    case 'credentialName':
                        valueA = (a.credentialName || '')
                            .toString()
                            .toLowerCase();
                        valueB = (b.credentialName || '')
                            .toString()
                            .toLowerCase();
                        break;
                    case 'description':
                        valueA = (a.description || '').toString().toLowerCase();
                        valueB = (b.description || '').toString().toLowerCase();
                        break;
                    case 'entity':
                        valueA = (a.entity || '').toString().toLowerCase();
                        valueB = (b.entity || '').toString().toLowerCase();
                        break;
                    case 'product':
                        valueA = (a.product || '').toString().toLowerCase();
                        valueB = (b.product || '').toString().toLowerCase();
                        break;
                    case 'service':
                        valueA = (a.service || '').toString().toLowerCase();
                        valueB = (b.service || '').toString().toLowerCase();
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
        credentials,
        appliedSearchTerm,
        activeFilters,
        sortColumn,
        sortDirection,
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
        setActiveGroupLabel(label as any);
        closeAllDialogs();
    };

    const clearGroupBy = () => {
        setActiveGroupLabel('None');
    };

    // Load Credentials from backend API
    const loadCredentials = useCallback(
        async (filters?: {
            accountId?: string | null;
            accountName?: string | null;
            enterpriseId?: string | null;
            enterpriseName?: string | null;
        }) => {
            setIsLoading(true);
            isLoadingRef.current = true;
            try {
                // Use filters if provided, otherwise use current state values
                const accountIdToUse = filters?.accountId || selectedAccountId;
                const enterpriseIdToUse =
                    filters?.enterpriseId || selectedEnterpriseId;

                if (!accountIdToUse) {
                    console.log(
                        '⚠️ [Credentials] Cannot load - missing accountId',
                    );
                    setCredentials([]);
                    setIsLoading(false);
                    return;
                }

                const loadedCredentials = await loadCredentialsFromAPI(
                    accountIdToUse,
                    enterpriseIdToUse || undefined,
                );
                setCredentials(loadedCredentials);
                console.log(
                    '📦 [Credentials] Loaded from API:',
                    loadedCredentials.length,
                    'rows for account:',
                    accountIdToUse,
                    'enterprise:',
                    enterpriseIdToUse,
                );
            } catch (error) {
                console.error('Failed to load Credentials:', error);
                setCredentials([]);
            } finally {
                setIsLoading(false);
                // Reset loading flag after a short delay to allow state to update
                setTimeout(() => {
                    isLoadingRef.current = false;
                }, 100);
            }
        },
        [loadCredentialsFromAPI, selectedAccountId, selectedEnterpriseId],
    );

    // Load Credentials on mount and whenever the selected account/enterprise changes.
    // This ensures that when the top-right account dropdown changes (and the enterprise
    // selection remains), the table refreshes automatically for that Account+Enterprise.
    useEffect(() => {
        // Don't run auto-refresh until initialization is complete
        if (!isInitialized) {
            console.log('🔄 [ManageCredentials] Waiting for initialization...');
            return;
        }

        // Read enterpriseId from localStorage (some other components keep the id there)
        const enterpriseId =
            typeof window !== 'undefined'
                ? window.localStorage.getItem('selectedEnterpriseId')
                : null;

        console.log(
            '🔄 [ManageCredentials] Loading Credentials with context:',
            {
                selectedAccountId,
                selectedAccountName,
                selectedEnterprise,
                enterpriseId,
                hasAccountId: !!selectedAccountId,
                hasEnterprise: !!(selectedEnterprise || enterpriseId),
                isInitialized,
            },
        );

        // Set loading flag
        isLoadingRef.current = true;

        // Clear existing data immediately when enterprise/account changes to prevent stale data
        setCredentials([]);

        // ONLY load data if account id exists
        const currentEnterpriseId = enterpriseId || selectedEnterpriseId;
        if (selectedAccountId) {
            // Load from API
            loadCredentials({
                accountId: selectedAccountId,
                accountName: selectedAccountName,
                enterpriseId: currentEnterpriseId,
                enterpriseName: selectedEnterprise,
            });
            return;
        }

        // Clear table and show message when required context is missing
        console.log(
            '⚠️ [ManageCredentials] Missing Account or Enterprise selection, clearing table',
        );
        setCredentials([]);
        setIsLoading(false);
        // Reset loading flag after a short delay
        setTimeout(() => {
            isLoadingRef.current = false;
        }, 100);

        // Show a notification to guide user (only after initialization to avoid false warnings)
        if (!selectedAccountId) {
            showBlueNotification(
                'Please select an Account from the top-right dropdown to view Credentials',
                5000,
                false,
            );
        }
        // Enterprise notification removed - enterprise is now auto-selected based on account licenses
    }, [
        selectedAccountId,
        selectedAccountName,
        selectedEnterprise,
        selectedEnterpriseId,
        isInitialized,
        loadCredentials,
    ]);

    // Load dropdown options whenever credentials changes - use a ref to prevent infinite loops
    const dropdownOptionsLoadedRef = useRef(false);
    const credentialsCountRef = useRef(0);
    useEffect(() => {
        if (
            !isLoading &&
            credentials.length > 0 &&
            (credentials.length !== credentialsCountRef.current ||
                !dropdownOptionsLoadedRef.current)
        ) {
            credentialsCountRef.current = credentials.length;
            dropdownOptionsLoadedRef.current = true;
            loadDropdownOptions();
        }
    }, [credentials.length, loadDropdownOptions, isLoading]);

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
        return credentials.some((credential) => {
            const isTemporary = String(credential.id).startsWith('tmp-');
            const isEmpty =
                !credential.credentialName &&
                !credential.entity &&
                !credential.product &&
                !credential.service;
            return isTemporary && isEmpty;
        });
    };

    // Function to validate incomplete rows and return validation details - exactly like Manage Users
    const validateIncompleteRows = () => {
        // Get all temporary (unsaved) rows
        const temporaryRows = credentials.filter((credential: any) =>
            String(credential.id).startsWith('tmp-'),
        );

        // Get all existing rows
        const existingRows = credentials.filter(
            (credential: any) => !String(credential.id).startsWith('tmp-'),
        );

        // Check for incomplete temporary rows (exclude completely blank rows)
        const incompleteTemporaryRows = temporaryRows.filter(
            (credential: any) => {
                const hascredentialName = credential.credentialName?.trim();
                const hasEntity = credential.entity?.trim();
                const hasProduct = credential.product?.trim();
                const hasService = credential.service?.trim();

                // Don't include completely blank rows (new rows that haven't been touched)
                const isCompletelyBlank =
                    !hascredentialName &&
                    !hasEntity &&
                    !hasProduct &&
                    !hasService;
                if (isCompletelyBlank) return false;

                // Row is incomplete if it has some data but not all required fields
                return (
                    !hascredentialName ||
                    !hasEntity ||
                    !hasProduct ||
                    !hasService
                );
            },
        );

        // Check for incomplete existing rows
        const incompleteExistingRows = existingRows.filter(
            (credential: any) => {
                const hascredentialName = credential.credentialName?.trim();
                const hasEntity = credential.entity?.trim();
                const hasProduct = credential.product?.trim();
                const hasService = credential.service?.trim();

                // Don't include completely blank rows
                const isCompletelyBlank =
                    !hascredentialName &&
                    !hasEntity &&
                    !hasProduct &&
                    !hasService;
                if (isCompletelyBlank) return false;

                // Row is incomplete if it has some data but not all required fields
                return (
                    !hascredentialName ||
                    !hasEntity ||
                    !hasProduct ||
                    !hasService
                );
            },
        );

        // Combine all incomplete rows
        const incompleteRows = [
            ...incompleteTemporaryRows,
            ...incompleteExistingRows,
        ];

        if (incompleteRows.length > 0) {
            const missingFields = new Set<string>();
            incompleteRows.forEach((credential) => {
                if (!credential.credentialName?.trim())
                    missingFields.add('Credential Name');
                if (!credential.entity?.trim()) missingFields.add('Workstream');
                if (!credential.product?.trim()) missingFields.add('Product');
                if (!credential.service?.trim()) missingFields.add('Service');
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

    // Handle adding new Credential row
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
            // Show notification instead of modal - exactly like Manage Users
            showBlueNotification(
                validation.message,
                5000,
                false, // No checkmark for error message
            );

            // Enable red border highlighting for incomplete rows
            setShowValidationErrors(true);
            setIncompleteRows(validation.incompleteRows.map((r: any) => r.id));

            return;
        }

        const newRole: CredentialRow = {
            id: `tmp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            credentialName: '',
            description: '',
            entity: '',
            product: '',
            service: '',
            scope: '',
        };

        // Add to end of array with display order
        displayOrderRef.current.set(newRole.id, Date.now());

        setCredentials([...credentials, newRole]);

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
            let updatedGroup: CredentialRow | null = null;
            setCredentials((prev) => {
                // Always create new array and new objects for React to detect changes
                return prev.map((credential) => {
                    if (credential.id === rowId) {
                        // Track if this is an existing record (not temporary)
                        if (!String(rowId).startsWith('tmp-')) {
                            setModifiedExistingRecords((prevModified) => {
                                const newSet = new Set(prevModified);
                                newSet.add(String(rowId));
                                return newSet;
                            });
                        }

                        // Create new object with updated field
                        updatedGroup = {...credential, [field]: value};
                        return updatedGroup;
                    }
                    return credential; // Return same reference for unchanged rows
                });
            });

            // Check if all mandatory fields are now filled for this row
            if (updatedGroup) {
                const hascredentialName =
                    (updatedGroup as any).credentialName?.trim() &&
                    (updatedGroup as any).credentialName.trim().length > 0;
                const hasEntity =
                    (updatedGroup as any).entity?.trim() &&
                    (updatedGroup as any).entity.trim().length > 0;
                const hasProduct =
                    (updatedGroup as any).product?.trim() &&
                    (updatedGroup as any).product.trim().length > 0;
                const hasService =
                    (updatedGroup as any).service?.trim() &&
                    (updatedGroup as any).service.trim().length > 0;

                const isComplete =
                    hascredentialName && hasEntity && hasProduct && hasService;

                console.log('🔍 Checking if row is complete after update:', {
                    rowId,
                    field,
                    value,
                    hascredentialName,
                    hasEntity,
                    hasProduct,
                    hasService,
                    isComplete,
                });

                // Only trigger autosave if all mandatory fields are filled
                if (isComplete && debouncedAutoSaveRef.current) {
                    console.log(
                        '✅ All mandatory fields filled - triggering autosave timer',
                    );
                    debouncedAutoSaveRef.current();
                } else {
                    console.log(
                        '⏸️ Not all mandatory fields filled - clearing autosave timer if exists',
                    );
                    // Clear autosave timer if row becomes incomplete
                    if (autoSaveTimerRef.current) {
                        clearTimeout(autoSaveTimerRef.current);
                        autoSaveTimerRef.current = null;
                        setAutoSaveCountdown(null);
                        if (countdownIntervalRef.current) {
                            clearInterval(countdownIntervalRef.current);
                            countdownIntervalRef.current = null;
                        }
                    }
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
            console.log('🗑️ Deleting Credential:', pendingDeleteRowId);

            // Add a small delay to show the loading state
            await new Promise((resolve) => setTimeout(resolve, 500));

            // Find the credential to be deleted for debugging
            const credentialToDelete = credentials.find(
                (g) => g.id === pendingDeleteRowId,
            );
            console.log('📄 Credential data to delete:', credentialToDelete);

            // Delete from database via API (only if not a temporary row)
            if (!String(pendingDeleteRowId).startsWith('tmp-')) {
                const success = await deleteCredentialAPI(
                    pendingDeleteRowId,
                    selectedAccountId,
                );
                if (!success) {
                    throw new Error('Failed to delete credential');
                }
            } else {
                console.log(
                    'ℹ️ Temporary row - only removing from frontend state',
                );
            }

            // Remove from local state
            setCredentials((prev) => {
                const updated = prev.filter(
                    (credential) => credential.id !== pendingDeleteRowId,
                );
                // Apply stable sorting to maintain display order
                return sortConfigsByDisplayOrder(updated);
            });

            console.log('✅ Credential deleted successfully');

            // Show success notification
            showBlueNotification('Successfully deleted 1 entries.');

            // Close modal and reset state
            setShowDeleteConfirmation(false);
            setPendingDeleteRowId(null);
            setCompressingRowId(null);
            setFoldingRowId(null);
        } catch (error) {
            console.error('❌ Failed to delete Credential:', error);
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
                'Failed to delete Credential. Please try again.',
                5000,
                false,
            );
        } finally {
            setDeletingRow(false);
        }
    };

    // Auto-save new Credential when all required fields are filled - exactly like Manage Users
    const autoSaveNewUserGroup = async (
        tempRowId: string,
        updatedGroup?: any,
    ) => {
        console.log(
            '🚀 autoSaveNewUserGroup function called with tempRowId:',
            tempRowId,
        );

        // Mark row as saving
        setSavingRows((prev) => new Set([...Array.from(prev), tempRowId]));

        // Use the provided updated credential or find it from current ref state
        const credential =
            updatedGroup ||
            credentialsRef.current.find((g) => g.id === tempRowId);
        if (!credential) {
            console.error('❌ Credential not found for auto-save:', tempRowId);
            setSavingRows((prev) => {
                const newSet = new Set(prev);
                newSet.delete(tempRowId);
                return newSet;
            });
            return;
        }

        console.log('💾 Auto-saving new Credential:', credential);

        // Check for duplicate entry (same credentialName + entity + product + service)
        const isDuplicate = credentialsRef.current.some(
            (existingCredential) => {
                // Skip the current temporary row being saved
                if (existingCredential.id === tempRowId) return false;

                // Check if all key fields match
                return (
                    existingCredential.credentialName?.toLowerCase().trim() ===
                        credential.credentialName?.toLowerCase().trim() &&
                    existingCredential.entity?.toLowerCase().trim() ===
                        credential.entity?.toLowerCase().trim() &&
                    existingCredential.product?.toLowerCase().trim() ===
                        credential.product?.toLowerCase().trim() &&
                    existingCredential.service?.toLowerCase().trim() ===
                        credential.service?.toLowerCase().trim()
                );
            },
        );

        if (isDuplicate) {
            console.error(
                '❌ Duplicate entry detected - Credential with same Credential Name, Workstream, Product, and Service already exists',
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
                `This combination of Credential Name (${credential.credentialName}), Workstream (${credential.entity}), Product (${credential.product}), and Service (${credential.service}) already exists in another row. Please use a different combination.`,
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

        // Create credential via API
        console.log(
            '📤 [AutoSave] Creating credential via API:',
            credential.credentialName,
        );

        const createdCredential = await createCredentialAPI(
            credential,
            selectedAccountId || '',
            selectedEnterpriseId || '',
            selectedEnterprise || '',
            selectedAccountName || '',
        );

        if (!createdCredential) {
            console.error('❌ [AutoSave] Failed to create credential via API');
            setSavingRows((prev) => {
                const newSet = new Set(prev);
                newSet.delete(tempRowId);
                return newSet;
            });
            return;
        }

        const newId =
            createdCredential.id || `group-${Date.now()}-${Math.random()}`;
        const oldDisplayOrder = displayOrderRef.current.get(tempRowId);

        console.log(
            '✅ [AutoSave] Credential created successfully with ID:',
            newId,
        );

        // Update the accounts state with the new ID
        setCredentials((prev) => {
            const updated = prev.map((g) =>
                g.id === tempRowId
                    ? {
                          ...g,
                          id: newId,
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString(),
                      }
                    : g,
            );
            // Apply stable sorting to maintain display order
            return sortConfigsByDisplayOrder(updated);
        });

        // Update selectedRowForConnector if it's pointing to the row that was just converted
        if (
            selectedRowForConnector &&
            selectedRowForConnector.id === tempRowId
        ) {
            setSelectedRowForConnector((prev) => {
                if (prev && prev.id === tempRowId) {
                    const updated = {
                        ...prev,
                        id: newId,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    };
                    console.log(
                        `🔄 [AutoSave] Updated selectedRowForConnector ID from ${tempRowId} to ${newId}`,
                    );
                    return updated;
                }
                return prev;
            });
        }

        // Update display order reference with the new ID
        if (oldDisplayOrder !== undefined) {
            displayOrderRef.current.delete(tempRowId); // Remove old reference
            displayOrderRef.current.set(newId, oldDisplayOrder); // Add new reference
            console.log(
                `📍 [AutoSave] Preserved display order ${oldDisplayOrder} for new credential ID ${newId}`,
            );
        }

        console.log('🎉 [AutoSave] Credential saved to DynamoDB successfully');

        // Clean up after successful save
        setSavingRows((prev) => {
            const newSet = new Set(prev);
            newSet.delete(tempRowId);
            return newSet;
        });
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
                const temporaryRows = credentialsRef.current.filter(
                    (credential) => {
                        const isTemp = String(credential.id).startsWith('tmp-');
                        if (!isTemp) return false;

                        // Be more strict about what constitutes a complete Credential row
                        const hascredentialName =
                            credential.credentialName?.trim() &&
                            credential.credentialName.trim().length > 0;
                        const hasEntity =
                            credential.entity?.trim() &&
                            credential.entity.trim().length > 0;
                        const hasProduct =
                            credential.product?.trim() &&
                            credential.product.trim().length > 0;
                        const hasService =
                            credential.service?.trim() &&
                            credential.service.trim().length > 0;

                        const isComplete =
                            hascredentialName &&
                            hasEntity &&
                            hasProduct &&
                            hasService;

                        if (isTemp && !isComplete) {
                            console.log(
                                `🚫 Skipping incomplete temporary Credential ${credential.id}:`,
                                {
                                    hascredentialName: !!hascredentialName,
                                    hasEntity: !!hasEntity,
                                    hasProduct: !!hasProduct,
                                    hasService: !!hasService,
                                    groupNameValue: credential.credentialName,
                                    entityValue: credential.entity,
                                    productValue: credential.product,
                                    serviceValue: credential.service,
                                },
                            );
                        }

                        return isComplete;
                    },
                );

                // Get all modified existing records that are still complete
                const modifiedRows = credentialsRef.current.filter(
                    (credential) => {
                        const isExisting = !String(credential.id).startsWith(
                            'tmp-',
                        );
                        const isModified =
                            modifiedExistingRecordsRef.current.has(
                                String(credential.id),
                            );

                        if (isExisting && isModified) {
                            // Double-check that the record still has all required fields
                            const hascredentialName =
                                credential.credentialName?.trim();
                            const hasEntity = credential.entity?.trim();
                            const hasProduct = credential.product?.trim();
                            const hasService = credential.service?.trim();

                            const isComplete =
                                hascredentialName &&
                                hasEntity &&
                                hasProduct &&
                                hasService;

                            console.log(
                                `🔍 Checking modified Credential ${credential.id}: isComplete=${isComplete}`,
                                {
                                    hascredentialName: !!hascredentialName,
                                    hasEntity: !!hasEntity,
                                    hasProduct: !!hasProduct,
                                    hasService: !!hasService,
                                    groupNameValue: credential.credentialName,
                                    entityValue: credential.entity,
                                    productValue: credential.product,
                                    serviceValue: credential.service,
                                },
                            );

                            return isComplete;
                        }

                        console.log(
                            `🔍 Checking Credential ${credential.id}: isExisting=${isExisting}, isModified=${isModified}`,
                        );
                        return false;
                    },
                );

                console.log(
                    `📊 Found ${temporaryRows.length} complete temporary Credentials to auto-save`,
                );
                console.log(
                    `📊 Found ${modifiedRows.length} modified existing Credentials to auto-save`,
                );

                // Check for orphaned records in modifiedExistingRecords
                const orphanedRecords = Array.from(
                    modifiedExistingRecordsRef.current,
                ).filter(
                    (recordId) =>
                        !credentialsRef.current.find(
                            (credential) => String(credential.id) === recordId,
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
                        '💾 Auto-saving Credentials after 10 seconds of inactivity...',
                        temporaryRows.map((r) => r.id),
                    );

                    let successCount = 0;
                    let failureCount = 0;

                    // Save new temporary Credentials
                    for (const tempRow of temporaryRows) {
                        console.log(`💾 Auto-saving Credential: ${tempRow.id}`);

                        // Reset duplicate flag before each save attempt
                        const duplicateFlagBefore =
                            duplicateDetectedRef.current;

                        try {
                            await autoSaveNewUserGroup(tempRow.id);

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
                                `❌ Failed to auto-save new Credential ${tempRow.id}:`,
                                error,
                            );
                            // Only count as failure if not a duplicate (duplicate modal already shown)
                            if (!duplicateDetectedRef.current) {
                                failureCount++;
                            }
                        }
                    }

                    // Save modified existing Credentials to database via API
                    for (const modifiedRow of modifiedRows) {
                        console.log(
                            `💾 Saving modified existing Credential: ${modifiedRow.id}`,
                        );
                        try {
                            // Check for duplicate entry (same credentialName + entity + product + service as another record)
                            const isDuplicate = credentialsRef.current.some(
                                (existingRole) => {
                                    // Skip the current row being updated
                                    if (existingRole.id === modifiedRow.id)
                                        return false;

                                    // Check if all key fields match with another existing record
                                    return (
                                        existingRole.credentialName
                                            ?.toLowerCase()
                                            .trim() ===
                                            modifiedRow.credentialName
                                                ?.toLowerCase()
                                                .trim() &&
                                        existingRole.entity
                                            ?.toLowerCase()
                                            .trim() ===
                                            modifiedRow.entity
                                                ?.toLowerCase()
                                                .trim() &&
                                        existingRole.product
                                            ?.toLowerCase()
                                            .trim() ===
                                            modifiedRow.product
                                                ?.toLowerCase()
                                                .trim() &&
                                        existingRole.service
                                            ?.toLowerCase()
                                            .trim() ===
                                            modifiedRow.service
                                                ?.toLowerCase()
                                                .trim()
                                    );
                                },
                            );

                            if (isDuplicate) {
                                console.error(
                                    `❌ Duplicate entry detected for autosave update: ${modifiedRow.credentialName}`,
                                );

                                // Mark that duplicate was detected (to suppress generic error notification)
                                duplicateDetectedRef.current = true;

                                // Show duplicate modal
                                setDuplicateMessage(
                                    `This combination of Credential Name (${modifiedRow.credentialName}), Workstream (${modifiedRow.entity}), Product (${modifiedRow.product}), and Service (${modifiedRow.service}) already exists in another row. Please use a different combination.`,
                                );
                                setShowDuplicateModal(true);

                                failureCount++;
                                continue; // Skip this row
                            }

                            // Update credential via API
                            console.log(
                                `📤 [AutoSave] Updating credential via API: ${modifiedRow.id}`,
                            );

                            const updatedCredential = await updateCredentialAPI(
                                modifiedRow,
                                selectedAccountId || '',
                                selectedEnterpriseId || '',
                            );

                            if (updatedCredential) {
                                console.log(
                                    `✅ Credential ${modifiedRow.id} updated in DynamoDB successfully`,
                                );
                                successCount++;
                            } else {
                                console.error(
                                    `❌ Failed to update credential ${modifiedRow.id} in DynamoDB`,
                                );
                                failureCount++;
                            }
                        } catch (error) {
                            console.error(
                                `❌ Failed to save modified Credential ${modifiedRow.id}:`,
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
                            '🔄 Reloading Credentials after successful autosave to update IDs...',
                        );
                        await loadCredentials({
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
                                userGroupsCount: credentialsRef.current.length,
                                hasTempRows: credentialsRef.current.some((g) =>
                                    String(g.id).startsWith('tmp-'),
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
        loadCredentials,
    ]);

    // Update the ref whenever debouncedAutoSave changes
    useEffect(() => {
        debouncedAutoSaveRef.current = debouncedAutoSave;
    }, [debouncedAutoSave]);

    // Function to check for unsaved changes - exactly like Manage Users
    const getUnsavedChanges = () => {
        const hasActiveTimer = !!autoSaveTimerRef.current;
        const hasModifiedRecords = modifiedExistingRecordsRef.current.size > 0;
        const hasTempRows = credentialsRef.current.some((credential: any) =>
            String(credential.id).startsWith('tmp-'),
        );

        const hasUnsavedChanges =
            hasActiveTimer || hasModifiedRecords || hasTempRows;

        console.log('🔍 [getUnsavedChanges] Check:', {
            hasActiveTimer,
            hasModifiedRecords,
            modifiedRecordsCount: modifiedExistingRecordsRef.current.size,
            hasTempRows,
            tempRowsIds: credentialsRef.current
                .filter((g) => String(g.id).startsWith('tmp-'))
                .map((g) => g.id),
            totalGroups: credentialsRef.current.length,
            hasUnsavedChanges,
        });

        return hasUnsavedChanges;
    };

    // Function to check for incomplete rows - exactly like Manage Users
    const getIncompleteRows = () => {
        const incompleteRows = credentials
            .filter((credential: any) => {
                const hascredentialName = credential.credentialName?.trim();
                const hasEntity = credential.entity?.trim();
                const hasProduct = credential.product?.trim();
                const hasService = credential.service?.trim();

                // Include completely blank rows only when validation is explicitly shown
                const isCompletelyBlank =
                    !hascredentialName &&
                    !hasEntity &&
                    !hasProduct &&
                    !hasService;
                if (isCompletelyBlank && !showValidationErrors) return false;

                // Row is incomplete if any required field is missing
                const isIncomplete =
                    !hascredentialName ||
                    !hasEntity ||
                    !hasProduct ||
                    !hasService;

                console.log('🔍 Row validation check:', {
                    id: credential.id,
                    hascredentialName,
                    hasEntity,
                    hasProduct,
                    hasService,
                    isIncomplete,
                });

                return isIncomplete;
            })
            .map((credential: any) => credential.id);

        // Only log when showValidationErrors is true to prevent infinite loops
        if (showValidationErrors && incompleteRows.length > 0) {
            console.log('🔍 getIncompleteRows result:', {
                incompleteRowIds: incompleteRows,
                totalGroups: credentials.length,
                showValidationErrors,
                sampleGroupIds: credentials.slice(0, 3).map((g) => g.id),
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
            '💾 Save all clicked - validating and saving Credentials...',
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
        const temporaryRows = credentials.filter((credential: any) =>
            String(credential.id).startsWith('tmp-'),
        );
        const existingRows = credentials.filter(
            (credential: any) => !String(credential.id).startsWith('tmp-'),
        );

        // Check for incomplete temporary rows (including completely blank rows) - exactly like Manage Users
        const incompleteTemporaryRows = temporaryRows.filter(
            (credential: any) => {
                const hascredentialName = credential.credentialName?.trim();
                const hasEntity = credential.entity?.trim();
                const hasProduct = credential.product?.trim();
                const hasService = credential.service?.trim();

                // Row is incomplete if any required field is missing (including completely blank rows)
                return (
                    !hascredentialName ||
                    !hasEntity ||
                    !hasProduct ||
                    !hasService
                );
            },
        );

        // Check for incomplete existing rows (including completely blank rows) - exactly like Manage Users
        const incompleteExistingRows = existingRows.filter(
            (credential: any) => {
                const hascredentialName = credential.credentialName?.trim();
                const hasEntity = credential.entity?.trim();
                const hasProduct = credential.product?.trim();
                const hasService = credential.service?.trim();

                // Row is incomplete if any required field is missing (including completely blank rows)
                return (
                    !hascredentialName ||
                    !hasEntity ||
                    !hasProduct ||
                    !hasService
                );
            },
        );

        // Combine all incomplete rows
        const incompleteRowsData = [
            ...incompleteTemporaryRows,
            ...incompleteExistingRows,
        ];

        // Get count of modified existing rows
        const modifiedExistingRowsCount = existingRows.filter(
            (credential: any) => modifiedExistingRecords.has(credential.id),
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
            incompleteRowsData.forEach((credential) => {
                console.log('📋 Checking credential:', {
                    id: credential.id,
                    credentialName: credential.credentialName || '(empty)',
                    entity: credential.entity || '(empty)',
                    product: credential.product || '(empty)',
                    service: credential.service || '(empty)',
                });

                // Check for missing fields
                if (!credential.credentialName?.trim())
                    allMissingFields.add('Credential Name');
                if (!credential.entity?.trim())
                    allMissingFields.add('Workstream');
                if (!credential.product?.trim())
                    allMissingFields.add('Product');
                if (!credential.service?.trim())
                    allMissingFields.add('Service');
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
                (credential: any) => {
                    const hascredentialName = credential.credentialName?.trim();
                    const hasEntity = credential.entity?.trim();
                    const hasProduct = credential.product?.trim();
                    const hasService = credential.service?.trim();
                    return (
                        hascredentialName &&
                        hasEntity &&
                        hasProduct &&
                        hasService
                    );
                },
            );

            console.log(
                '✅ Complete temporary rows to save:',
                completeTemporaryRows.length,
                completeTemporaryRows,
            );

            // Get complete modified existing rows
            const completeModifiedRows = existingRows.filter(
                (credential: any) => {
                    const hascredentialName = credential.credentialName?.trim();
                    const hasEntity = credential.entity?.trim();
                    const hasProduct = credential.product?.trim();
                    const hasService = credential.service?.trim();
                    const isModified = modifiedExistingRecords.has(
                        credential.id,
                    );
                    return (
                        hascredentialName &&
                        hasEntity &&
                        hasProduct &&
                        hasService &&
                        isModified
                    );
                },
            );

            console.log(
                '✅ Complete modified rows to save:',
                completeModifiedRows.length,
                completeModifiedRows,
            );

            let failedCount = 0;

            // Save temporary rows to database
            for (const tempGroup of completeTemporaryRows) {
                try {
                    // Check for duplicate entry (same credentialName + entity + product + service)
                    const isDuplicate = credentials.some(
                        (existingRole: any) => {
                            // Skip the current temporary row being saved
                            if (existingRole.id === tempGroup.id) return false;

                            // Check if all key fields match
                            return (
                                existingRole.credentialName
                                    ?.toLowerCase()
                                    .trim() ===
                                    tempGroup.credentialName
                                        ?.toLowerCase()
                                        .trim() &&
                                existingRole.entity?.toLowerCase().trim() ===
                                    tempGroup.entity?.toLowerCase().trim() &&
                                existingRole.product?.toLowerCase().trim() ===
                                    tempGroup.product?.toLowerCase().trim() &&
                                existingRole.service?.toLowerCase().trim() ===
                                    tempGroup.service?.toLowerCase().trim()
                            );
                        },
                    );

                    if (isDuplicate) {
                        console.error(
                            '❌ Duplicate entry detected for:',
                            tempGroup.credentialName,
                        );

                        // Mark that duplicate was detected
                        duplicateDetectedRef.current = true;

                        // Show duplicate modal
                        setDuplicateMessage(
                            `This combination of Credential Name (${tempGroup.credentialName}), Workstream (${tempGroup.entity}), Product (${tempGroup.product}), and Service (${tempGroup.service}) already exists in another row. Please use a different combination.`,
                        );
                        setShowDuplicateModal(true);

                        failedCount++;
                        continue; // Skip this row and continue with others
                    }

                    // Create credential via API
                    const createdCredential = await createCredentialAPI(
                        tempGroup,
                        selectedAccountId,
                        selectedEnterpriseId,
                        selectedEnterprise,
                        selectedAccountName,
                    );

                    if (createdCredential) {
                        // Update the row ID in state with the new ID from API
                        setCredentials((prev) => {
                            const updated = prev.map((g) =>
                                g.id === tempGroup.id
                                    ? {
                                          ...g,
                                          id: createdCredential.id,
                                      }
                                    : g,
                            );
                            // Update ref immediately so it's available for checks
                            credentialsRef.current = updated;
                            return updated;
                        });

                        savedCount++;
                        console.log(
                            '🎉 Credential created via API:',
                            createdCredential.id,
                        );
                    } else {
                        throw new Error('Failed to create credential');
                    }
                } catch (error) {
                    console.error('❌ Failed to save new Credential:', error);
                    failedCount++;
                }
            }

            // Save modified existing rows to database
            for (const modifiedRole of completeModifiedRows) {
                try {
                    // Check for duplicate entry (same credentialName + entity + product + service as another record)
                    const isDuplicate = credentials.some(
                        (existingRole: any) => {
                            // Skip the current row being updated
                            if (existingRole.id === modifiedRole.id)
                                return false;

                            // Check if all key fields match with another existing record
                            return (
                                existingRole.credentialName
                                    ?.toLowerCase()
                                    .trim() ===
                                    modifiedRole.credentialName
                                        ?.toLowerCase()
                                        .trim() &&
                                existingRole.entity?.toLowerCase().trim() ===
                                    modifiedRole.entity?.toLowerCase().trim() &&
                                existingRole.product?.toLowerCase().trim() ===
                                    modifiedRole.product
                                        ?.toLowerCase()
                                        .trim() &&
                                existingRole.service?.toLowerCase().trim() ===
                                    modifiedRole.service?.toLowerCase().trim()
                            );
                        },
                    );

                    if (isDuplicate) {
                        console.error(
                            '❌ Duplicate entry detected for update:',
                            modifiedRole.credentialName,
                        );

                        // Mark that duplicate was detected
                        duplicateDetectedRef.current = true;

                        // Show duplicate modal
                        setDuplicateMessage(
                            `This combination of Credential Name (${modifiedRole.credentialName}), Workstream (${modifiedRole.entity}), Product (${modifiedRole.product}), and Service (${modifiedRole.service}) already exists in another row. Please use a different combination.`,
                        );
                        setShowDuplicateModal(true);

                        failedCount++;
                        continue; // Skip this row and continue with others
                    }

                    // Update credential via API
                    const updatedCredential = await updateCredentialAPI(
                        modifiedRole,
                        selectedAccountId,
                        selectedEnterpriseId,
                    );

                    if (updatedCredential) {
                        // Credential updated successfully
                        savedCount++;
                        console.log(
                            '🎉 Credential updated via API:',
                            modifiedRole.id,
                        );
                    } else {
                        throw new Error('Failed to update credential');
                    }
                } catch (error) {
                    console.error('❌ Failed to update Credential:', error);
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

                // Data is already saved via API, no need to reload
                console.log('✅ Save complete - credentials saved via API');
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
        credentialName: '',
        description: '',
        entity: '',
        product: '',
        service: '',
    });

    // Update filterFormRef whenever filterForm changes
    useEffect(() => {
        filterFormRef.current = filterForm;
    }, [filterForm]);

    // Track if Clear All was clicked to allow closing filter panel on outside click
    const filterClearedRef = useRef(false);

    // Filter dropdown suggestions state - exactly like Manage Users
    const [showGroupNameSuggestions, setShowGroupNameSuggestions] =
        useState(false);
    const [showEntitySuggestions, setShowEntitySuggestions] = useState(false);
    const [showProductSuggestions, setShowProductSuggestions] = useState(false);
    const [showServiceSuggestions, setShowServiceSuggestions] = useState(false);

    const [filteredGroupNames, setFilteredGroupNames] = useState<
        Array<{id: string; name: string}>
    >([]);
    const [filteredEntities, setFilteredEntities] = useState<
        Array<{id: string; name: string}>
    >([]);
    const [filteredProducts, setFilteredProducts] = useState<
        Array<{id: string; name: string}>
    >([]);
    const [filteredServices, setFilteredServices] = useState<
        Array<{id: string; name: string}>
    >([]);

    const [selectedGroupNameIndex, setSelectedGroupNameIndex] = useState(-1);
    const [selectedEntityIndex, setSelectedEntityIndex] = useState(-1);
    const [selectedProductIndex, setSelectedProductIndex] = useState(-1);
    const [selectedServiceIndex, setSelectedServiceIndex] = useState(-1);

    // Apply and clear filter handlers
    const handleApplyFilters = () => {
        const filters: Record<string, any> = {};
        if (filterForm.credentialName)
            filters.credentialName = filterForm.credentialName;
        if (filterForm.description)
            filters.description = filterForm.description;
        if (filterForm.entity) filters.entity = filterForm.entity;
        if (filterForm.product) filters.product = filterForm.product;
        if (filterForm.service) filters.service = filterForm.service;

        setActiveFilters(filters);
        closeAllDialogs();

        // Reset the cleared flag when panel is closed via Apply
        filterClearedRef.current = false;
    };

    const handleClearFilters = () => {
        setFilterForm({
            credentialName: '',
            description: '',
            entity: '',
            product: '',
            service: '',
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
                        Manage Credentials
                    </h1>
                    <p className='mt-2 text-sm text-slate-600 leading-relaxed'>
                        Securely store, manage, and govern enterprise
                        credentials including API keys, tokens, and
                        authentication secrets.
                    </p>
                </div>
            </div>

            {/* Toolbar Section */}
            <div className='bg-sap-light-gray px-3 py-3 text-primary border-y border-light'>
                <div className='flex items-center justify-between gap-3'>
                    <div className='flex items-center gap-3 flex-wrap'>
                        {/* Create New Credential Button */}
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
                                    : 'Create New Credential'}
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
                                            {/* Credential Name Filter */}
                                            <div>
                                                <label className='block text-xs font-medium text-gray-700 mb-1'>
                                                    Credential Name
                                                </label>
                                                <div className='relative'>
                                                    <input
                                                        type='text'
                                                        value={
                                                            filterForm.credentialName
                                                        }
                                                        onChange={(e) => {
                                                            const value =
                                                                e.target.value;
                                                            setFilterForm({
                                                                ...filterForm,
                                                                credentialName:
                                                                    value,
                                                            });

                                                            // Reset cleared flag when user starts typing again
                                                            filterClearedRef.current =
                                                                false;

                                                            // Filter credential names
                                                            const filtered = (
                                                                dropdownOptions.credentialNames ||
                                                                []
                                                            ).filter(
                                                                (
                                                                    credentialName,
                                                                ) =>
                                                                    credentialName.name
                                                                        .toLowerCase()
                                                                        .includes(
                                                                            value.toLowerCase(),
                                                                        ),
                                                            );
                                                            setFilteredGroupNames(
                                                                filtered,
                                                            );
                                                            setShowGroupNameSuggestions(
                                                                value.length >
                                                                    0 &&
                                                                    filtered.length >
                                                                        0,
                                                            );
                                                            setSelectedGroupNameIndex(
                                                                -1,
                                                            );
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (
                                                                e.key ===
                                                                'ArrowDown'
                                                            ) {
                                                                e.preventDefault();
                                                                setSelectedGroupNameIndex(
                                                                    (prev) =>
                                                                        prev <
                                                                        filteredGroupNames.length -
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
                                                                setSelectedGroupNameIndex(
                                                                    (prev) =>
                                                                        prev > 0
                                                                            ? prev -
                                                                              1
                                                                            : -1,
                                                                );
                                                            } else if (
                                                                e.key ===
                                                                    'Enter' &&
                                                                selectedGroupNameIndex >=
                                                                    0
                                                            ) {
                                                                e.preventDefault();
                                                                const selected =
                                                                    filteredGroupNames[
                                                                        selectedGroupNameIndex
                                                                    ];
                                                                setFilterForm({
                                                                    ...filterForm,
                                                                    credentialName:
                                                                        selected.name,
                                                                });
                                                                setShowGroupNameSuggestions(
                                                                    false,
                                                                );
                                                                setSelectedGroupNameIndex(
                                                                    -1,
                                                                );
                                                            } else if (
                                                                e.key ===
                                                                'Escape'
                                                            ) {
                                                                setShowGroupNameSuggestions(
                                                                    false,
                                                                );
                                                                setSelectedGroupNameIndex(
                                                                    -1,
                                                                );
                                                            }
                                                        }}
                                                        onBlur={() => {
                                                            setTimeout(
                                                                () =>
                                                                    setShowGroupNameSuggestions(
                                                                        false,
                                                                    ),
                                                                150,
                                                            );
                                                        }}
                                                        onFocus={() => {
                                                            if (
                                                                filterForm.credentialName &&
                                                                filteredGroupNames.length >
                                                                    0
                                                            ) {
                                                                setShowGroupNameSuggestions(
                                                                    true,
                                                                );
                                                            }
                                                        }}
                                                        className='w-full pl-2 pr-8 py-1 text-sm border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded bg-white'
                                                    />
                                                    {showGroupNameSuggestions && (
                                                        <div className='filter-suggestions-dropdown absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto'>
                                                            {filteredGroupNames.map(
                                                                (
                                                                    credentialName,
                                                                    index,
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            credentialName.id
                                                                        }
                                                                        className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${
                                                                            index ===
                                                                            selectedGroupNameIndex
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
                                                                                    credentialName:
                                                                                        credentialName.name,
                                                                                },
                                                                            );
                                                                            setShowGroupNameSuggestions(
                                                                                false,
                                                                            );
                                                                            setSelectedGroupNameIndex(
                                                                                -1,
                                                                            );
                                                                        }}
                                                                    >
                                                                        {
                                                                            credentialName.name
                                                                        }
                                                                    </div>
                                                                ),
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Description Filter */}
                                            <div>
                                                <label className='block text-xs font-medium text-gray-700 mb-1'>
                                                    Description
                                                </label>
                                                <div className='relative'>
                                                    <input
                                                        type='text'
                                                        value={
                                                            filterForm.description
                                                        }
                                                        onChange={(e) => {
                                                            const value =
                                                                e.target.value;
                                                            setFilterForm({
                                                                ...filterForm,
                                                                description:
                                                                    value,
                                                            });
                                                            filterClearedRef.current =
                                                                false;
                                                        }}
                                                        className='w-full pl-2 pr-8 py-1 text-sm border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded bg-white'
                                                    />
                                                </div>
                                            </div>

                                            {/* Entity Filter */}
                                            <div>
                                                <label className='block text-xs font-medium text-gray-700 mb-1'>
                                                    Workstream
                                                </label>
                                                <div className='relative'>
                                                    <input
                                                        type='text'
                                                        value={
                                                            filterForm.entity
                                                        }
                                                        onChange={(e) => {
                                                            const value =
                                                                e.target.value;
                                                            setFilterForm({
                                                                ...filterForm,
                                                                entity: value,
                                                            });

                                                            // Reset cleared flag when user starts typing again
                                                            filterClearedRef.current =
                                                                false;

                                                            // Filter entities
                                                            const filtered = (
                                                                dropdownOptions.entities ||
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
                                                                    entity: selected.name,
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
                                                                filterForm.entity &&
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
                                                                                    entity: entity.name,
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

                                            {/* Product Filter */}
                                            <div>
                                                <label className='block text-xs font-medium text-gray-700 mb-1'>
                                                    Product
                                                </label>
                                                <div className='relative'>
                                                    <input
                                                        type='text'
                                                        value={
                                                            filterForm.product
                                                        }
                                                        onChange={(e) => {
                                                            const value =
                                                                e.target.value;
                                                            setFilterForm({
                                                                ...filterForm,
                                                                product: value,
                                                            });

                                                            // Reset cleared flag when user starts typing again
                                                            filterClearedRef.current =
                                                                false;

                                                            // Filter products
                                                            const filtered = (
                                                                dropdownOptions.products ||
                                                                []
                                                            ).filter(
                                                                (product) =>
                                                                    product.name
                                                                        .toLowerCase()
                                                                        .includes(
                                                                            value.toLowerCase(),
                                                                        ),
                                                            );
                                                            setFilteredProducts(
                                                                filtered,
                                                            );
                                                            setShowProductSuggestions(
                                                                value.length >
                                                                    0 &&
                                                                    filtered.length >
                                                                        0,
                                                            );
                                                            setSelectedProductIndex(
                                                                -1,
                                                            );
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (
                                                                e.key ===
                                                                'ArrowDown'
                                                            ) {
                                                                e.preventDefault();
                                                                setSelectedProductIndex(
                                                                    (prev) =>
                                                                        prev <
                                                                        filteredProducts.length -
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
                                                                setSelectedProductIndex(
                                                                    (prev) =>
                                                                        prev > 0
                                                                            ? prev -
                                                                              1
                                                                            : -1,
                                                                );
                                                            } else if (
                                                                e.key ===
                                                                    'Enter' &&
                                                                selectedProductIndex >=
                                                                    0
                                                            ) {
                                                                e.preventDefault();
                                                                const selected =
                                                                    filteredProducts[
                                                                        selectedProductIndex
                                                                    ];
                                                                setFilterForm({
                                                                    ...filterForm,
                                                                    product:
                                                                        selected.name,
                                                                });
                                                                setShowProductSuggestions(
                                                                    false,
                                                                );
                                                                setSelectedProductIndex(
                                                                    -1,
                                                                );
                                                            } else if (
                                                                e.key ===
                                                                'Escape'
                                                            ) {
                                                                setShowProductSuggestions(
                                                                    false,
                                                                );
                                                                setSelectedProductIndex(
                                                                    -1,
                                                                );
                                                            }
                                                        }}
                                                        onBlur={() => {
                                                            setTimeout(
                                                                () =>
                                                                    setShowProductSuggestions(
                                                                        false,
                                                                    ),
                                                                150,
                                                            );
                                                        }}
                                                        onFocus={() => {
                                                            if (
                                                                filterForm.product &&
                                                                filteredProducts.length >
                                                                    0
                                                            ) {
                                                                setShowProductSuggestions(
                                                                    true,
                                                                );
                                                            }
                                                        }}
                                                        className='w-full pl-2 pr-8 py-1 text-sm border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded bg-white'
                                                    />
                                                    {showProductSuggestions && (
                                                        <div className='filter-suggestions-dropdown absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto'>
                                                            {filteredProducts.map(
                                                                (
                                                                    product,
                                                                    index,
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            product.id
                                                                        }
                                                                        className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${
                                                                            index ===
                                                                            selectedProductIndex
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
                                                                                    product:
                                                                                        product.name,
                                                                                },
                                                                            );
                                                                            setShowProductSuggestions(
                                                                                false,
                                                                            );
                                                                            setSelectedProductIndex(
                                                                                -1,
                                                                            );
                                                                        }}
                                                                    >
                                                                        {
                                                                            product.name
                                                                        }
                                                                    </div>
                                                                ),
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Service Filter */}
                                            <div>
                                                <label className='block text-xs font-medium text-gray-700 mb-1'>
                                                    Service
                                                </label>
                                                <div className='relative'>
                                                    <input
                                                        type='text'
                                                        value={
                                                            filterForm.service
                                                        }
                                                        onChange={(e) => {
                                                            const value =
                                                                e.target.value;
                                                            setFilterForm({
                                                                ...filterForm,
                                                                service: value,
                                                            });

                                                            // Reset cleared flag when user starts typing again
                                                            filterClearedRef.current =
                                                                false;

                                                            // Filter services
                                                            const filtered = (
                                                                dropdownOptions.services ||
                                                                []
                                                            ).filter(
                                                                (service) =>
                                                                    service.name
                                                                        .toLowerCase()
                                                                        .includes(
                                                                            value.toLowerCase(),
                                                                        ),
                                                            );
                                                            setFilteredServices(
                                                                filtered,
                                                            );
                                                            setShowServiceSuggestions(
                                                                value.length >
                                                                    0 &&
                                                                    filtered.length >
                                                                        0,
                                                            );
                                                            setSelectedServiceIndex(
                                                                -1,
                                                            );
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (
                                                                e.key ===
                                                                'ArrowDown'
                                                            ) {
                                                                e.preventDefault();
                                                                setSelectedServiceIndex(
                                                                    (prev) =>
                                                                        prev <
                                                                        filteredServices.length -
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
                                                                setSelectedServiceIndex(
                                                                    (prev) =>
                                                                        prev > 0
                                                                            ? prev -
                                                                              1
                                                                            : -1,
                                                                );
                                                            } else if (
                                                                e.key ===
                                                                    'Enter' &&
                                                                selectedServiceIndex >=
                                                                    0
                                                            ) {
                                                                e.preventDefault();
                                                                const selected =
                                                                    filteredServices[
                                                                        selectedServiceIndex
                                                                    ];
                                                                setFilterForm({
                                                                    ...filterForm,
                                                                    service:
                                                                        selected.name,
                                                                });
                                                                setShowServiceSuggestions(
                                                                    false,
                                                                );
                                                                setSelectedServiceIndex(
                                                                    -1,
                                                                );
                                                            } else if (
                                                                e.key ===
                                                                'Escape'
                                                            ) {
                                                                setShowServiceSuggestions(
                                                                    false,
                                                                );
                                                                setSelectedServiceIndex(
                                                                    -1,
                                                                );
                                                            }
                                                        }}
                                                        onBlur={() => {
                                                            setTimeout(
                                                                () =>
                                                                    setShowServiceSuggestions(
                                                                        false,
                                                                    ),
                                                                150,
                                                            );
                                                        }}
                                                        onFocus={() => {
                                                            if (
                                                                filterForm.service &&
                                                                filteredServices.length >
                                                                    0
                                                            ) {
                                                                setShowServiceSuggestions(
                                                                    true,
                                                                );
                                                            }
                                                        }}
                                                        className='w-full pl-2 pr-8 py-1 text-sm border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded bg-white'
                                                    />
                                                    {showServiceSuggestions && (
                                                        <div className='filter-suggestions-dropdown absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto'>
                                                            {filteredServices.map(
                                                                (
                                                                    service,
                                                                    index,
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            service.id
                                                                        }
                                                                        className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${
                                                                            index ===
                                                                            selectedServiceIndex
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
                                                                                    service:
                                                                                        service.name,
                                                                                },
                                                                            );
                                                                            setShowServiceSuggestions(
                                                                                false,
                                                                            );
                                                                            setSelectedServiceIndex(
                                                                                -1,
                                                                            );
                                                                        }}
                                                                    >
                                                                        {
                                                                            service.name
                                                                        }
                                                                    </div>
                                                                ),
                                                            )}
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
                                                        <option value='Credential Name'>
                                                            Credential Name
                                                        </option>
                                                        <option value='Description'>
                                                            Description
                                                        </option>
                                                        <option value='Workstream'>
                                                            Workstream
                                                        </option>
                                                        <option value='Product'>
                                                            Product
                                                        </option>
                                                        <option value='Service'>
                                                            Service
                                                        </option>
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Current group Display */}
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
                </div>
            </div>

            {/* Content Area */}
            <div className='flex-1 p-3 overflow-hidden'>
                <div className='h-full space-y-3'>
                    {/* Credentials Table */}
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
                                        Loading Manage Credentials
                                        configurations
                                    </h3>
                                    <p className='mt-2 text-sm text-slate-500'>
                                        Please wait while we fetch your
                                        credential management data...
                                    </p>
                                </div>
                            </div>
                        ) : credentials.length === 0 && !isLoading ? (
                            // Empty State - No Credentials - exactly like AssignedUserGroupModal
                            <div className='bg-white rounded-lg border border-slate-200 p-12 text-center'>
                                <div className='mx-auto max-w-md'>
                                    <div className='mb-6 flex justify-center'>
                                        <Image
                                            src='/images/Infographics/SG-no-credentials-yet.jpg'
                                            alt='No Credentials Configured'
                                            width={400}
                                            height={300}
                                            className='mx-auto object-contain'
                                        />
                                    </div>
                                    <h3 className='mt-4 text-lg font-semibold text-slate-900'>
                                        No Credentials Configured
                                    </h3>
                                    <p className='mt-2 text-sm text-slate-500'>
                                        No credentials have been created yet for
                                        the selected Account and Enterprise
                                        combination. Create a new credential to
                                        get started.
                                    </p>
                                    <div className='mt-6'>
                                        <button
                                            onClick={handleAddNewRow}
                                            className='inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
                                        >
                                            <PlusIcon className='-ml-1 mr-2 h-5 w-5' />
                                            Create New Credential
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
                                <ManageCredentialsTable
                                    rows={processedConfigs}
                                    onEdit={(id: string) =>
                                        console.log('Edit credential:', id)
                                    }
                                    onDelete={handleDeleteClick}
                                    highlightQuery={appliedSearchTerm}
                                    compressingRowId={compressingRowId}
                                    foldingRowId={foldingRowId}
                                    groupByExternal={
                                        ActiveGroupLabel === 'Credential Name'
                                            ? 'credentialName'
                                            : ActiveGroupLabel === 'Description'
                                            ? 'description'
                                            : ActiveGroupLabel === 'Workstream'
                                            ? 'entity'
                                            : ActiveGroupLabel === 'Product'
                                            ? 'product'
                                            : ActiveGroupLabel === 'Service'
                                            ? 'service'
                                            : 'none'
                                    }
                                    onGroupByChange={(g: string) => {
                                        setActiveGroupLabel(
                                            g === 'credentialName'
                                                ? 'Credential Name'
                                                : g === 'description'
                                                ? 'Description'
                                                : g === 'entity'
                                                ? 'Workstream'
                                                : g === 'product'
                                                ? 'Product'
                                                : g === 'service'
                                                ? 'Service'
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
                                    customColumnLabels={columnLabels}
                                    selectedEnterprise={selectedEnterprise}
                                    selectedEnterpriseId={
                                        typeof window !== 'undefined'
                                            ? window.localStorage.getItem(
                                                  'selectedEnterpriseId',
                                              ) || ''
                                            : ''
                                    }
                                    selectedAccountId={
                                        typeof window !== 'undefined'
                                            ? window.localStorage.getItem(
                                                  'selectedAccountId',
                                              ) || ''
                                            : ''
                                    }
                                    selectedAccountName={
                                        typeof window !== 'undefined'
                                            ? window.localStorage.getItem(
                                                  'selectedAccountName',
                                              ) || ''
                                            : ''
                                    }
                                    onOpenScopeModal={(row: CredentialRow) => {
                                        setSelectedRowForConnector(row);
                                        setIsConnectorModalOpen(true);
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
                    key={`notification-${
                        isAIPanelCollapsed ? 'collapsed' : 'expanded'
                    }`}
                    initial={{opacity: 0, y: -50, scale: 0.9}}
                    animate={{opacity: 1, y: 0, scale: 1}}
                    exit={{opacity: 0, y: -50, scale: 0.9}}
                    transition={{duration: 0.3, ease: 'easeOut'}}
                    className='fixed z-50 max-w-sm'
                    style={{
                        // Position well above the toolbar with significant spacing
                        // Header height (~80px) + more gap above toolbar (40px)
                        top: '40px',
                        // Right positioning: 320px when expanded (300px panel + 20px margin), 84px when collapsed (64px panel + 20px margin)
                        right: isAIPanelCollapsed ? '84px' : '320px',
                        transition: 'right 0.3s ease-out',
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
                                            Credential?
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

            {/* Connector Modal */}
            {selectedRowForConnector &&
                (() => {
                    // Get the latest row from credentials to ensure we have the most up-to-date data
                    const latestRow =
                        credentials.find(
                            (row) => row.id === selectedRowForConnector.id,
                        ) || selectedRowForConnector;

                    return (
                        <ConnectorModal
                            isOpen={isConnectorModalOpen}
                            onClose={() => {
                                setIsConnectorModalOpen(false);
                                setSelectedRowForConnector(null);
                            }}
                            onSave={async (connectors: Connector[]) => {
                                // Handle bulk save
                                console.log(
                                    '💾 [Credentials Page] Bulk saving connectors:',
                                    connectors,
                                );

                                if (latestRow && connectors.length > 0) {
                                    const updatedRow = {
                                        ...latestRow,
                                        connectorIconName:
                                            connectors[0].connectorIconName ||
                                            latestRow.connectorIconName,
                                        connectors: connectors,
                                        updatedAt: new Date().toISOString(),
                                    };

                                    // Update local state
                                    setCredentials((prev) =>
                                        prev.map((row) =>
                                            row.id === latestRow.id
                                                ? updatedRow
                                                : row,
                                        ),
                                    );
                                    setSelectedRowForConnector(updatedRow);

                                    // Save to DynamoDB if not a temp row
                                    if (!latestRow.id.startsWith('tmp-')) {
                                        try {
                                            const result =
                                                await updateCredentialAPI(
                                                    updatedRow,
                                                    selectedAccountId || '',
                                                    selectedEnterpriseId || '',
                                                );
                                            if (result) {
                                                console.log(
                                                    '✅ Connectors saved to DynamoDB',
                                                );
                                                showBlueNotification(
                                                    'Connectors saved successfully',
                                                );
                                            } else {
                                                console.error(
                                                    '❌ Failed to save connectors',
                                                );
                                                showBlueNotification(
                                                    'Failed to save connectors',
                                                    3000,
                                                    false,
                                                );
                                            }
                                        } catch (error) {
                                            console.error(
                                                '❌ Error saving connectors:',
                                                error,
                                            );
                                            showBlueNotification(
                                                'Error saving connectors',
                                                3000,
                                                false,
                                            );
                                        }
                                    }
                                }
                            }}
                            onSaveIndividual={async (
                                connectors: Connector[],
                            ) => {
                                // Handle individual save
                                console.log(
                                    '💾 [Credentials Page] Saving individual connector:',
                                    connectors,
                                );
                                // Update the row with the connector icon name and full connector data
                                if (latestRow && connectors.length > 0) {
                                    const updatedRow = {
                                        ...latestRow,
                                        connectorIconName:
                                            connectors[0].connectorIconName ||
                                            latestRow.connectorIconName,
                                        connectors: connectors, // Store full connector data
                                        updatedAt: new Date().toISOString(), // Update timestamp
                                    };
                                    console.log(
                                        '💾 [Credentials Page] Updated row with connectors:',
                                        updatedRow.id,
                                        'connectors count:',
                                        updatedRow.connectors?.length || 0,
                                    );
                                    console.log(
                                        '💾 [Credentials Page] Connector details:',
                                        JSON.stringify(
                                            updatedRow.connectors,
                                            null,
                                            2,
                                        ),
                                    );

                                    // Update local state first
                                    setCredentials((prev) => {
                                        // Find the row by ID (handles both temp and permanent IDs)
                                        const rowIndex = prev.findIndex(
                                            (row) => row.id === latestRow.id,
                                        );
                                        if (rowIndex === -1) {
                                            console.warn(
                                                '⚠️ [Credentials Page] Row not found in credentials state:',
                                                latestRow.id,
                                            );
                                            console.log(
                                                '🔍 [Credentials Page] Available row IDs:',
                                                prev.map((r) => r.id),
                                            );
                                            // Try to find by credentialName as fallback
                                            const fallbackIndex =
                                                prev.findIndex(
                                                    (row) =>
                                                        row.credentialName ===
                                                        latestRow.credentialName,
                                                );
                                            if (fallbackIndex !== -1) {
                                                console.log(
                                                    '✅ [Credentials Page] Found row by credentialName fallback',
                                                );
                                                const updated = [...prev];
                                                updated[fallbackIndex] = {
                                                    ...updated[fallbackIndex],
                                                    ...updatedRow,
                                                };
                                                return updated;
                                            }
                                            // If still not found, add the row
                                            console.log(
                                                '➕ [Credentials Page] Adding row as it was not found in state',
                                            );
                                            const updated = [
                                                ...prev,
                                                updatedRow,
                                            ];
                                            return updated;
                                        }
                                        const updated = prev.map((row) =>
                                            row.id === latestRow.id
                                                ? updatedRow
                                                : row,
                                        );
                                        return updated;
                                    });
                                    // Update selectedRowForConnector to the latest row
                                    setSelectedRowForConnector(updatedRow);

                                    // Save to DynamoDB via API - only if this is not a temp row
                                    if (!latestRow.id.startsWith('tmp-')) {
                                        console.log(
                                            '📤 [Credentials Page] Saving connector data to DynamoDB...',
                                        );
                                        try {
                                            const result =
                                                await updateCredentialAPI(
                                                    updatedRow,
                                                    selectedAccountId || '',
                                                    selectedEnterpriseId || '',
                                                );
                                            if (result) {
                                                console.log(
                                                    '✅ [Credentials Page] Connector saved to DynamoDB successfully',
                                                );
                                                showBlueNotification(
                                                    'Connector saved successfully',
                                                );
                                            } else {
                                                console.error(
                                                    '❌ [Credentials Page] Failed to save connector to DynamoDB',
                                                );
                                                showBlueNotification(
                                                    'Failed to save connector',
                                                    3000,
                                                    false,
                                                );
                                            }
                                        } catch (error) {
                                            console.error(
                                                '❌ [Credentials Page] Error saving connector:',
                                                error,
                                            );
                                            showBlueNotification(
                                                'Error saving connector',
                                                3000,
                                                false,
                                            );
                                        }
                                    } else {
                                        console.log(
                                            '⏳ [Credentials Page] Temp row - connector will be saved when credential is saved',
                                        );
                                    }
                                }
                            }}
                            credentialName={latestRow.credentialName || ''}
                            initialConnectors={(() => {
                                const savedConnectors =
                                    latestRow.connectors || [];
                                console.log(
                                    '📥 [Credentials Page] Loading initialConnectors for row:',
                                    latestRow.id,
                                    'connectors:',
                                    savedConnectors.length,
                                );
                                return savedConnectors;
                            })()}
                            key={latestRow.id} // Force remount when different row is selected
                            selectedEnterprise={selectedEnterprise}
                            selectedEnterpriseId={
                                typeof window !== 'undefined'
                                    ? window.localStorage.getItem(
                                          'selectedEnterpriseId',
                                      ) || ''
                                    : ''
                            }
                            selectedAccountId={
                                typeof window !== 'undefined'
                                    ? window.localStorage.getItem(
                                          'selectedAccountId',
                                      ) || ''
                                    : ''
                            }
                            selectedAccountName={
                                typeof window !== 'undefined'
                                    ? window.localStorage.getItem(
                                          'selectedAccountName',
                                      ) || ''
                                    : ''
                            }
                            workstream={latestRow.entity || ''}
                            product={latestRow.product || ''}
                            service={latestRow.service || ''}
                        />
                    );
                })()}
        </div>
    );
}
