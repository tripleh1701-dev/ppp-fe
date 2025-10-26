'use client';

import React, {useState, useEffect, useRef, useCallback} from 'react';
import {motion} from 'framer-motion';
import {
    PlusIcon,
    MagnifyingGlassIcon,
    ArrowsUpDownIcon,
    EyeSlashIcon,
    RectangleStackIcon,
    BookmarkIcon,
    ChevronDownIcon,
} from '@heroicons/react/24/outline';
import {useRouter} from 'next/navigation';
import {api} from '@/utils/api';
import PipelineCanvasTable, {
    PipelineCanvasRow,
} from '@/components/PipelineCanvasTable';

export default function PipelineCanvasSummary() {
    console.log('🏗️ PipelineCanvasSummary component mounting...');

    const router = useRouter();

    // Debug: Track re-renders
    const renderCountRef = useRef(0);
    renderCountRef.current += 1;

    // Enterprise configuration data state
    const [pipelineCanvass, setPipelineCanvass] = useState<any[]>([]);

    // Client-side display order tracking - independent of API timestamps
    const displayOrderRef = useRef<Map<string, number>>(new Map());

    // Function to sort configs by client-side display order for stable UI
    const sortConfigsByDisplayOrder = useCallback((configs: any[]) => {
        return [...configs].sort((a, b) => {
            const orderA =
                displayOrderRef.current.get(a.id) ?? Number.MAX_SAFE_INTEGER;
            const orderB =
                displayOrderRef.current.get(b.id) ?? Number.MAX_SAFE_INTEGER;
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
    const [deletingRow, setDeletingRow] = useState(false);

    // Auto-save related state - use useRef to persist through re-renders
    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const pipelineCanvassRef = useRef<any[]>([]);
    const modifiedExistingRecordsRef = useRef<Set<string>>(new Set());
    const [isAutoSaving, setIsAutoSaving] = useState(false);
    const [showAutoSaveSuccess, setShowAutoSaveSuccess] = useState(false);
    const [autoSaveCountdown, setAutoSaveCountdown] = useState<number | null>(
        null,
    );
    const [modifiedExistingRecords, setModifiedExistingRecords] = useState<
        Set<string>
    >(new Set());

    // Debug auto-save state
    console.log(
        `🔄 Render #${renderCountRef.current} - Auto-save timer exists:`,
        !!autoSaveTimerRef.current,
        'Countdown:',
        autoSaveCountdown,
    );

    // Update ref to track current pipelineCanvass state
    useEffect(() => {
        pipelineCanvassRef.current = pipelineCanvass;
    }, [pipelineCanvass]);

    // Update ref to track current modifiedExistingRecords state
    useEffect(() => {
        modifiedExistingRecordsRef.current = modifiedExistingRecords;
    }, [modifiedExistingRecords]);

    // State to track user's pending local changes that haven't been saved yet
    const [pendingLocalChanges, setPendingLocalChanges] = useState<
        Record<string, any>
    >({});

    // State to track AI panel collapse state for notification positioning
    const [isAIPanelCollapsed, setIsAIPanelCollapsed] = useState(false);

    // Row animation states
    const [compressingRowId, setCompressingRowId] = useState<string | null>(
        null,
    );
    const [foldingRowId, setFoldingRowId] = useState<string | null>(null);

    // Dropdown options for chips
    const [dropdownOptions, setDropdownOptions] = useState({
        pipelineNames: [] as Array<{id: string; name: string}>,
        details: [] as Array<{id: string; name: string}>,
        services: [] as Array<{id: string; name: string}>,
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
    const [createDropdownOpen, setCreateDropdownOpen] = useState(false);
    const [ActiveGroupLabel, setActiveGroupLabel] = useState<
        'None' | 'Pipeline Name' | 'Service' | 'Status'
    >('None');
    const [visibleCols, setVisibleCols] = useState<ColumnType[]>([
        'pipelineName',
        'details',
        'service',
        'status',
        'lastUpdated',
        'createdBy',
        'actions',
    ]);

    // Refs for dropdowns
    const searchRef = useRef<HTMLDivElement>(null);
    const filterRef = useRef<HTMLDivElement>(null);
    const sortRef = useRef<HTMLDivElement>(null);
    const hideRef = useRef<HTMLDivElement>(null);
    const groupRef = useRef<HTMLDivElement>(null);
    const createDropdownRef = useRef<HTMLDivElement>(null);

    // Helper function to show notifications
    const showBlueNotification = (message: string, duration: number = 3000) => {
        console.log(
            '📢 Showing notification:',
            message,
            'AI Panel Collapsed:',
            isAIPanelCollapsed,
        );
        setNotificationMessage(message);
        setShowNotification(true);
        setTimeout(() => {
            setShowNotification(false);
        }, duration);
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

            // If click is outside all dialogs, close them (search remains open)
            if (
                isOutsideFilter &&
                isOutsideSort &&
                isOutsideHide &&
                isOutsideGroup
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

    // Listen for sort changes from the PipelineCanvasTable
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
        | 'pipelineName'
        | 'details'
        | 'service'
        | 'status'
        | 'lastUpdated'
        | 'createdBy'
        | 'actions';
    const allCols: ColumnType[] = [
        'pipelineName',
        'details',
        'service',
        'status',
        'lastUpdated',
        'createdBy',
        'actions',
    ];

    // Process enterprise config data with filtering, sorting, and search
    const processedConfigs = React.useMemo(() => {
        let filtered = [...pipelineCanvass];

        // Apply search filter
        if (appliedSearchTerm.trim()) {
            filtered = filtered.filter((config) => {
                const searchLower = appliedSearchTerm.toLowerCase();
                return (
                    config.enterprise?.toLowerCase().includes(searchLower) ||
                    config.enterpriseName
                        ?.toLowerCase()
                        .includes(searchLower) ||
                    config.product?.toLowerCase().includes(searchLower) ||
                    config.productName?.toLowerCase().includes(searchLower) ||
                    config.services?.toLowerCase().includes(searchLower) ||
                    config.serviceName?.toLowerCase().includes(searchLower)
                );
            });
        }

        // Apply filters
        if (activeFilters.enterprise) {
            filtered = filtered.filter(
                (config) => config.enterprise === activeFilters.enterprise,
            );
        }
        if (activeFilters.product) {
            filtered = filtered.filter(
                (config) => config.product === activeFilters.product,
            );
        }
        if (activeFilters.services && activeFilters.services.length > 0) {
            filtered = filtered.filter((config) => {
                const configServices = config.services?.split(', ') || [];
                return activeFilters.services.some((service: string) =>
                    configServices.includes(service),
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
                    case 'pipelineName':
                        valueA = (a.enterprise || a.enterpriseName || '')
                            .toString()
                            .toLowerCase();
                        valueB = (b.enterprise || b.enterpriseName || '')
                            .toString()
                            .toLowerCase();
                        break;
                    case 'details':
                        valueA = (a.product || a.productName || '')
                            .toString()
                            .toLowerCase();
                        valueB = (b.product || b.productName || '')
                            .toString()
                            .toLowerCase();
                        break;
                    case 'service':
                        valueA = (a.services || a.serviceName || '')
                            .toString()
                            .toLowerCase();
                        valueB = (b.services || b.serviceName || '')
                            .toString()
                            .toLowerCase();
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
        pipelineCanvass,
        appliedSearchTerm,
        activeFilters,
        // Create a stable sort key that only changes when both column and direction are set
        sortColumn && sortDirection ? `${sortColumn}-${sortDirection}` : '',
    ]);

    // Helper functions for filter management
    const applyFilters = (filters: Record<string, any>) => {
        setActiveFilters(filters);
        closeAllDialogs();
    };

    // Column label mapping
    const columnLabels: Record<string, string> = {
        pipelineName: 'Pipeline Name',
        details: 'Details',
        service: 'Service',
        status: 'Status',
        lastUpdated: 'Last Updated',
        createdBy: 'Created By',
        actions: 'Actions',
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

    const clearAllFilters = () => {
        setActiveFilters({});
        closeAllDialogs();
    };

    // Filter form state
    const [filterForm, setFilterForm] = useState({
        enterprise: '',
        product: '',
        services: '',
    });

    const handleApplyFilters = () => {
        const newFilters: Record<string, any> = {};

        if (filterForm.enterprise.trim()) {
            newFilters.enterprise = filterForm.enterprise.trim();
        }
        if (filterForm.product.trim()) {
            newFilters.product = filterForm.product.trim();
        }
        if (filterForm.services.trim()) {
            newFilters.services = filterForm.services
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);
        }

        setActiveFilters(newFilters);
        closeAllDialogs();
    };

    const handleClearFilters = () => {
        setFilterForm({enterprise: '', product: '', services: ''});
        setActiveFilters({});
        closeAllDialogs();
    };

    const setGroupByFromLabel = (label: string) => {
        const l = label as 'None' | 'Pipeline Name' | 'Service' | 'Status';
        setActiveGroupLabel(l);
    };

    const groupByProp =
        ActiveGroupLabel === 'Pipeline Name'
            ? 'pipelineName'
            : ActiveGroupLabel === 'Service'
            ? 'service'
            : ActiveGroupLabel === 'Status'
            ? 'status'
            : 'none';

    // Load dropdown options from API
    const loadDropdownOptions = async () => {
        try {
            const [pipelineNamesRes, detailsRes, servicesRes] =
                await Promise.all([
                    api.get<Array<{id: string; name: string}>>(
                        '/api/pipelines',
                    ),
                    api.get<Array<{id: string; name: string}>>(
                        '/api/pipeline-details',
                    ),
                    api.get<Array<{id: string; name: string}>>(
                        '/api/pipeline-services',
                    ),
                ]);

            setDropdownOptions({
                pipelineNames: pipelineNamesRes || [],
                details: detailsRes || [],
                services: servicesRes || [],
            });
        } catch (error) {
            console.error('Failed to load dropdown options:', error);
        }
    };

    // Create missing entities (pipeline names, details, services) when they don't exist
    const createMissingEntities = async (
        pipelineName: string,
        details: string,
        serviceNames: string[],
        existingPipelineName?: any,
        existingDetails?: any,
        existingServices?: any[],
    ) => {
        const result = {
            pipelineName: existingPipelineName,
            details: existingDetails,
            services: existingServices || [],
        };

        try {
            // Reload dropdown options first to ensure we have the latest data
            await loadDropdownOptions();

            // Re-check if entities exist after reload
            let foundPipelineName =
                existingPipelineName ||
                dropdownOptions.pipelineNames.find(
                    (e) => e.name === pipelineName,
                );
            let foundDetails =
                existingDetails ||
                dropdownOptions.details.find((p) => p.name === details);
            let foundServices = serviceNames
                .map((serviceName) =>
                    dropdownOptions.services.find(
                        (s) => s.name === serviceName,
                    ),
                )
                .filter(Boolean);

            // Create pipeline name if still missing
            if (!foundPipelineName && pipelineName) {
                console.log('🏢 Creating new pipeline name:', pipelineName);
                const newPipelineName = await api.post<{
                    id: string;
                    name: string;
                }>('/api/pipelines', {name: pipelineName});
                if (newPipelineName) {
                    foundPipelineName = newPipelineName;
                    // Update dropdown options
                    setDropdownOptions((prev) => ({
                        ...prev,
                        pipelineNames: [...prev.pipelineNames, newPipelineName],
                    }));
                }
            }

            // Create details if still missing
            if (!foundDetails && details) {
                console.log('📦 Creating new details:', details);
                const newDetails = await api.post<{id: string; name: string}>(
                    '/api/pipeline-details',
                    {name: details},
                );
                if (newDetails) {
                    foundDetails = newDetails;
                    // Update dropdown options
                    setDropdownOptions((prev) => ({
                        ...prev,
                        details: [...prev.details, newDetails],
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
                    }>('/api/pipeline-services', {
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
            result.pipelineName = foundPipelineName;
            result.details = foundDetails;
            result.services = foundServices;

            console.log('✅ Entity creation completed:', {
                pipelineName: result.pipelineName?.name,
                details: result.details?.name,
                services: result.services.map((s) => s?.name).filter(Boolean),
            });

            return result;
        } catch (error) {
            console.error('❌ Error creating missing entities:', error);
            return result;
        }
    };

    // Auto-save new row when all required fields are filled
    const autoSaveNewRow = async (tempRowId: string, updatedAccount?: any) => {
        try {
            console.log(
                '🚀 autoSaveNewRow function called with tempRowId:',
                tempRowId,
            );

            // Mark row as saving
            setSavingRows((prev) => new Set([...Array.from(prev), tempRowId]));

            // Use the provided updated config or find it from current ref state
            const config =
                updatedAccount ||
                pipelineCanvassRef.current.find((a) => a.id === tempRowId);
            if (!config) {
                console.error('❌ Config not found for auto-save:', tempRowId);
                console.log(
                    '📋 Available configs from ref:',
                    pipelineCanvassRef.current.map((a) => ({
                        id: a.id,
                        enterprise: a.enterprise,
                        product: a.product,
                        services: a.services,
                    })),
                );
                setSavingRows((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(tempRowId);
                    return newSet;
                });
                return;
            }

            console.log('💾 Auto-saving new row:', config);
            console.log('📊 Current dropdown options:', dropdownOptions);
            console.log(
                '🔄 Using updated config data:',
                updatedAccount ? 'YES' : 'NO',
            );

            // Find the enterprise, product, and service IDs from dropdown options
            const enterpriseName = config.enterprise;
            const productName = config.product;

            // Debug the raw service value
            const rawServiceValue = config.services || '';
            console.log(
                '🔍 Raw service value:',
                rawServiceValue,
                'Type:',
                typeof rawServiceValue,
            );
            console.log('🔍 Full config object:', config);

            const serviceNames = rawServiceValue.split(', ').filter(Boolean);

            console.log('🔍 Parsed service names:', serviceNames);

            let pipelineNameEntity = dropdownOptions.pipelineNames.find(
                (e) => e.name === enterpriseName,
            );
            let detailsEntity = dropdownOptions.details.find(
                (p) => p.name === productName,
            );
            let services = serviceNames
                .map((serviceName: string) =>
                    dropdownOptions.services.find(
                        (s: any) => s.name === serviceName,
                    ),
                )
                .filter(Boolean);

            console.log('🔍 Debug - Looking for IDs:', {
                enterpriseName,
                productName,
                serviceNames,
                availablePipelineNames: dropdownOptions.pipelineNames.map(
                    (e) => e.name,
                ),
                availableDetails: dropdownOptions.details.map((p) => p.name),
                availableServices: dropdownOptions.services.map((s) => s.name),
                foundPipelineName: pipelineNameEntity,
                foundDetails: detailsEntity,
                foundServices: services,
            });

            if (
                !pipelineNameEntity ||
                !detailsEntity ||
                services.length === 0
            ) {
                console.error('❌ Missing required IDs for auto-save:', {
                    pipelineName: pipelineNameEntity?.id,
                    details: detailsEntity?.id,
                    services: services.map((s: any) => s?.id),
                    missingPipelineName: !pipelineNameEntity,
                    missingDetails: !detailsEntity,
                    missingServices: services.length === 0,
                });

                console.log('🔧 Creating missing entities...');

                // Create missing entities (this will handle both empty dropdown and missing specific entities)
                const createdEntities = await createMissingEntities(
                    enterpriseName,
                    productName,
                    serviceNames,
                    pipelineNameEntity, // Pass existing found entities (could be null)
                    detailsEntity,
                    services,
                );

                if (
                    !createdEntities.pipelineName ||
                    !createdEntities.details ||
                    createdEntities.services.length === 0
                ) {
                    console.error(
                        '❌ Failed to create missing entities, cannot auto-save',
                    );
                    setSavingRows((prev) => {
                        const newSet = new Set(prev);
                        newSet.delete(tempRowId);
                        return newSet;
                    });
                    return;
                }

                // Update the variables for the rest of the function
                pipelineNameEntity = createdEntities.pipelineName;
                detailsEntity = createdEntities.details;
                services = createdEntities.services;
            }

            // Check if a record with the same enterprise + product already exists using ref
            const existingRecord = pipelineCanvassRef.current.find((cfg) => {
                const cfgEnterprise = cfg.enterprise || cfg.enterpriseName;
                const cfgProduct = cfg.product || cfg.productName;
                return (
                    cfgEnterprise === enterpriseName &&
                    cfgProduct === productName &&
                    !cfg.id.toString().startsWith('tmp-') // Exclude temporary rows
                );
            });

            if (existingRecord) {
                console.log(
                    '🔄 Found existing record for same Enterprise + Product:',
                    {
                        existingId: existingRecord.id,
                        enterprise: enterpriseName,
                        product: productName,
                        newServices: serviceNames,
                        existingServices:
                            existingRecord.services
                                ?.split(', ')
                                .filter(Boolean) || [],
                    },
                );

                // Merge services: combine existing services with new ones (avoid duplicates)
                const existingServices =
                    existingRecord.services?.split(', ').filter(Boolean) || [];
                const allServices = Array.from(
                    new Set([...existingServices, ...serviceNames]),
                );

                console.log('🔄 Merging services:', {
                    existing: existingServices,
                    new: serviceNames,
                    merged: allServices,
                });

                // Find service IDs for all merged services
                const mergedServiceObjects = allServices
                    .map((serviceName: string) =>
                        dropdownOptions.services.find(
                            (s: any) => s.name === serviceName,
                        ),
                    )
                    .filter(Boolean);

                const linkageData = {
                    pipelineNameId: pipelineNameEntity!.id,
                    detailsId: detailsEntity!.id,
                    serviceIds: mergedServiceObjects.map((s: any) => s!.id),
                };

                console.log(
                    '📤 Updating existing pipeline linkage:',
                    linkageData,
                );

                // Update the existing record via PUT
                const updatedLinkage = await api.put(
                    `/api/pipeline-canvas/${existingRecord.id}`,
                    linkageData,
                );

                console.log('📥 Update API Response:', updatedLinkage);

                if (updatedLinkage) {
                    console.log(
                        '✅ Services merged into existing record successfully',
                    );

                    // Update the existing record in local state with merged services
                    setPipelineCanvass(
                        (prev) =>
                            prev
                                .map((cfg) => {
                                    if (cfg.id === existingRecord.id) {
                                        // Update existing record with merged services
                                        return {
                                            ...cfg,
                                            services: allServices.join(', '),
                                        };
                                    }
                                    return cfg;
                                })
                                .filter((cfg) => cfg.id !== tempRowId), // Remove the temporary row
                    );

                    console.log(
                        '🎉 Services successfully merged into existing enterprise configuration!',
                    );
                }
            } else {
                // No existing record found, create new one
                const linkageData = {
                    pipelineNameId: pipelineNameEntity!.id,
                    detailsId: detailsEntity!.id,
                    serviceIds: services.map((s: any) => s!.id),
                };

                console.log('📤 Creating new pipeline:', linkageData);

                const createdLinkage = await api.post(
                    '/api/pipeline-canvas',
                    linkageData,
                );

                console.log('📥 API Response:', createdLinkage);

                if (createdLinkage) {
                    console.log('✅ Auto-save successful:', createdLinkage);

                    // Preserve display order for the new ID
                    const oldDisplayOrder =
                        displayOrderRef.current.get(tempRowId);
                    const newId = (createdLinkage as any).id;

                    // Update the config with the real ID from the backend
                    setPipelineCanvass((prev) => {
                        const updated = prev.map((cfg) =>
                            cfg.id === tempRowId ? {...cfg, id: newId} : cfg,
                        );
                        // Apply stable sorting to maintain display order
                        return sortConfigsByDisplayOrder(updated);
                    });

                    // Update display order reference with the new ID
                    if (oldDisplayOrder !== undefined) {
                        displayOrderRef.current.delete(tempRowId); // Remove old reference
                        displayOrderRef.current.set(newId, oldDisplayOrder); // Add new reference
                        console.log(
                            `📍 Preserved display order ${oldDisplayOrder} for new ID ${newId}`,
                        );
                    }

                    // Show success feedback
                    console.log(
                        '🎉 New enterprise configuration saved automatically!',
                    );
                }
            }
        } catch (error) {
            console.error('❌ Auto-save failed:', error);
            // You could add a toast notification here to inform the user
        } finally {
            // Remove from saving state
            setSavingRows((prev) => {
                const newSet = new Set(Array.from(prev));
                newSet.delete(tempRowId);
                return newSet;
            });
        }
    };

    // Handle new item creation from dropdowns
    const handleNewItemCreated = (
        type: 'pipelineNames' | 'details' | 'service',
        item: {id: string; name: string},
    ) => {
        // Map 'service' to 'services' for internal state
        const stateKey =
            type === 'service'
                ? 'services'
                : type === 'pipelineNames'
                ? 'pipelineNames'
                : 'details';
        console.log('🆕 New item created:', type, item);

        // Update dropdown options with the new item
        setDropdownOptions((prev) => ({
            ...prev,
            [stateKey]: [...prev[stateKey], item],
        }));
    };

    // Test function to manually create a linkage
    const testManualLinkageCreation = async () => {
        try {
            console.log('🧪 Testing manual linkage creation...');

            // Get the first available pipeline name, details, and service
            const pipelineName = dropdownOptions.pipelineNames[0];
            const details = dropdownOptions.details[0];
            const service = dropdownOptions.services[0];

            if (!pipelineName || !details || !service) {
                console.error('❌ Missing required items for test:', {
                    pipelineName: !!pipelineName,
                    details: !!details,
                    service: !!service,
                });
                return;
            }

            const testLinkage = {
                pipelineNameId: pipelineName.id,
                detailsId: details.id,
                serviceIds: [service.id],
            };

            console.log('📤 Creating test pipeline:', testLinkage);

            const result = await api.post('/api/pipeline-canvas', testLinkage);
            console.log('✅ Test linkage created successfully:', result);
        } catch (error) {
            console.error('❌ Test linkage creation failed:', error);
        }
    };

    // Function to check if there's a completely blank row
    const hasBlankRow = () => {
        return pipelineCanvass.some((config) => {
            const isTemporary = String(config.id).startsWith('tmp-');
            const isEmpty =
                !config.enterprise && !config.product && !config.services;
            return isTemporary && isEmpty;
        });
    };

    // Function to validate incomplete rows and return validation details
    const validateIncompleteRows = () => {
        const effectiveConfigs = getEffectivePipelineCanvass();

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
            const hasEnterprise = (
                config.enterprise || config.enterpriseName
            )?.trim();
            const hasProduct = (config.product || config.productName)?.trim();
            const hasServices = (config.services || config.serviceName)?.trim();

            // Don't include completely blank rows (new rows that haven't been touched)
            const isCompletelyBlank =
                !hasEnterprise && !hasProduct && !hasServices;
            if (isCompletelyBlank) return false;

            // Row is incomplete if it has some data but not all required fields
            return !hasEnterprise || !hasProduct || !hasServices;
        });

        // Check for incomplete existing rows (exclude completely blank rows)
        const incompleteExistingRows = existingRows.filter((config: any) => {
            const hasEnterprise = (
                config.enterprise || config.enterpriseName
            )?.trim();
            const hasProduct = (config.product || config.productName)?.trim();
            const hasServices = (config.services || config.serviceName)?.trim();

            // Don't include completely blank rows (existing rows shouldn't be blank, but just in case)
            const isCompletelyBlank =
                !hasEnterprise && !hasProduct && !hasServices;
            if (isCompletelyBlank) return false;

            // Row is incomplete if it has some data but not all required fields
            return !hasEnterprise || !hasProduct || !hasServices;
        });

        // Combine all incomplete rows
        const incompleteRows = [
            ...incompleteTemporaryRows,
            ...incompleteExistingRows,
        ];

        if (incompleteRows.length > 0) {
            const missingFields = new Set<string>();
            incompleteRows.forEach((config) => {
                if (!(config.enterprise || config.enterpriseName)?.trim())
                    missingFields.add('Enterprise');
                if (!(config.product || config.productName)?.trim())
                    missingFields.add('Product');
                if (!(config.services || config.serviceName)?.trim())
                    missingFields.add('Services');
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
    const getEffectivePipelineCanvass = useCallback(() => {
        return pipelineCanvass.map((config) => {
            const pendingChanges = pendingLocalChanges[config.id];
            if (pendingChanges) {
                console.log(
                    `🔄 Applying pending changes to record ${config.id}:`,
                    pendingChanges,
                );
                // Apply pending changes, ensuring field names match the config structure
                const mergedConfig = {...config};
                Object.keys(pendingChanges).forEach((key) => {
                    const value = pendingChanges[key];
                    // Apply the change directly to the config
                    mergedConfig[key] = value;

                    // Also handle alternate field names for consistency
                    if (key === 'pipelineName') {
                        mergedConfig.enterpriseName = value;
                    } else if (key === 'details') {
                        mergedConfig.productName = value;
                    } else if (key === 'service') {
                        mergedConfig.serviceName = value;
                    }
                });
                console.log(`✅ Merged config for ${config.id}:`, {
                    original: config,
                    pending: pendingChanges,
                    merged: mergedConfig,
                });
                return mergedConfig;
            }
            return config;
        });
    }, [pipelineCanvass, pendingLocalChanges]);

    // Function to check for incomplete rows
    const getIncompleteRows = () => {
        const effectiveConfigs = getEffectivePipelineCanvass();

        return effectiveConfigs
            .filter((config: any) => {
                const hasEnterprise = (
                    config.enterprise || config.enterpriseName
                )?.trim();
                const hasProduct = (
                    config.product || config.productName
                )?.trim();
                const hasServices = (
                    config.services || config.serviceName
                )?.trim();

                // When validation errors are being shown, include completely blank rows for highlighting
                // Otherwise, don't include completely blank rows (new rows that haven't been touched)
                const isCompletelyBlank =
                    !hasEnterprise && !hasProduct && !hasServices;
                if (isCompletelyBlank && !showValidationErrors) return false;

                // Row is incomplete if it has some data but not all required fields, OR if it's completely blank and validation is active
                return !hasEnterprise || !hasProduct || !hasServices;
            })
            .map((config: any) => config.id);
    };

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
                const temporaryRows = pipelineCanvassRef.current.filter(
                    (config) => {
                        const isTemp = String(config.id).startsWith('tmp-');
                        if (!isTemp) return false;

                        // Be more strict about what constitutes a complete row
                        const hasEnterprise =
                            config.enterprise?.trim() &&
                            config.enterprise.trim().length > 0;
                        const hasProduct =
                            config.product?.trim() &&
                            config.product.trim().length > 0;
                        const hasServices =
                            config.services?.trim() &&
                            config.services.trim().length > 0;

                        const isComplete =
                            hasEnterprise && hasProduct && hasServices;

                        if (isTemp && !isComplete) {
                            console.log(
                                `🚫 Skipping incomplete temporary row ${config.id}:`,
                                {
                                    hasEnterprise: !!hasEnterprise,
                                    hasProduct: !!hasProduct,
                                    hasServices: !!hasServices,
                                    enterpriseValue: config.enterprise,
                                    productValue: config.product,
                                    servicesValue: config.services,
                                },
                            );
                        }

                        return isComplete;
                    },
                );

                // Get all modified existing records that are still complete
                const modifiedRows = pipelineCanvassRef.current.filter(
                    (config) => {
                        const isExisting = !String(config.id).startsWith(
                            'tmp-',
                        );
                        const isModified =
                            modifiedExistingRecordsRef.current.has(
                                String(config.id),
                            );

                        if (isExisting && isModified) {
                            // Double-check that the record still has all required fields
                            const hasEnterprise = (
                                config.enterprise || config.enterpriseName
                            )?.trim();
                            const hasProduct = (
                                config.product || config.productName
                            )?.trim();

                            // Enhanced services validation for timer
                            const servicesValue =
                                config.services || config.serviceName || '';
                            const hasServices = (() => {
                                if (typeof servicesValue === 'string') {
                                    return servicesValue.trim().length > 0;
                                } else if (Array.isArray(servicesValue)) {
                                    return servicesValue.length > 0;
                                }
                                return false;
                            })();

                            const isComplete =
                                hasEnterprise && hasProduct && hasServices;

                            console.log(
                                `🔍 Checking modified record ${config.id}: isComplete=${isComplete}`,
                                {
                                    hasEnterprise: !!hasEnterprise,
                                    hasProduct: !!hasProduct,
                                    hasServices: !!hasServices,
                                    servicesValue: servicesValue,
                                    servicesValueType: typeof servicesValue,
                                },
                            );

                            return isComplete;
                        }

                        console.log(
                            `🔍 Checking record ${config.id}: isExisting=${isExisting}, isModified=${isModified}`,
                        );
                        return false;
                    },
                );

                console.log(
                    `📊 Found ${temporaryRows.length} complete temporary rows to auto-save`,
                );
                console.log(
                    `📊 Found ${modifiedRows.length} modified existing rows to auto-save`,
                );
                console.log(
                    '🔍 Current modifiedExistingRecords set (from ref):',
                    Array.from(modifiedExistingRecordsRef.current),
                );
                console.log(
                    '🔍 All current configs:',
                    pipelineCanvassRef.current.map((c) => ({
                        id: c.id,
                        isTemp: String(c.id).startsWith('tmp-'),
                        isModified: modifiedExistingRecordsRef.current.has(
                            String(c.id),
                        ),
                        enterprise: c.enterprise,
                        product: c.product,
                        services: c.services,
                        hasEnterprise: !!(
                            c.enterprise || c.enterpriseName
                        )?.trim(),
                        hasProduct: !!(c.product || c.productName)?.trim(),
                        hasServices: !!(c.services || c.serviceName)?.trim(),
                    })),
                );

                // Check for orphaned records in modifiedExistingRecords
                const orphanedRecords = Array.from(
                    modifiedExistingRecordsRef.current,
                ).filter(
                    (recordId) =>
                        !pipelineCanvassRef.current.find(
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
                        '� Auto-saving rows after 10 seconds of inactivity...',
                        temporaryRows.map((r) => r.id),
                    );

                    for (const tempRow of temporaryRows) {
                        console.log(`💾 Auto-saving row: ${tempRow.id}`);
                        await autoSaveNewRow(tempRow.id);
                    }

                    // Save modified existing rows - they're already saved via immediate API calls
                    // but we still want to show the success animation
                    for (const modifiedRow of modifiedRows) {
                        console.log(
                            `💾 Modified existing row already saved: ${modifiedRow.id}`,
                        );
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
                            ? `✅ Auto-saved ${temporaryRows.length} new and ${modifiedRows.length} updated entries`
                            : temporaryRows.length > 0
                            ? `✅ Auto-saved ${temporaryRows.length} new entries`
                            : `✅ Auto-saved ${modifiedRows.length} updated entries`;

                    showBlueNotification(message);

                    setTimeout(() => {
                        console.log('✨ Hiding auto-save success animation');
                        setShowAutoSaveSuccess(false);
                    }, 3000); // Show for 3 seconds

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
            const temporaryRows = pipelineCanvassRef.current.filter(
                (config) => {
                    const isTemp = String(config.id).startsWith('tmp-');
                    if (!isTemp) return false;

                    const hasEnterprise = config.enterprise?.trim();
                    const hasProduct = config.product?.trim();
                    const hasServices = config.services?.trim();

                    return hasEnterprise && hasProduct && hasServices;
                },
            );

            // Get all modified existing records that are still complete
            const modifiedRows = pipelineCanvassRef.current.filter((config) => {
                const isExisting = !String(config.id).startsWith('tmp-');
                const isModified = modifiedExistingRecordsRef.current.has(
                    String(config.id),
                );

                if (isExisting && isModified) {
                    // Double-check that the record still has all required fields
                    const hasEnterprise = (
                        config.enterprise || config.enterpriseName
                    )?.trim();
                    const hasProduct = (
                        config.product || config.productName
                    )?.trim();

                    // Enhanced services validation
                    const servicesValue =
                        config.services || config.serviceName || '';
                    const hasServices = (() => {
                        if (typeof servicesValue === 'string') {
                            return servicesValue.trim().length > 0;
                        } else if (Array.isArray(servicesValue)) {
                            return servicesValue.length > 0;
                        }
                        return false;
                    })();

                    const isComplete =
                        hasEnterprise && hasProduct && hasServices;

                    console.log(
                        `🔍 Checking modified record ${config.id}: isComplete=${isComplete}`,
                        {
                            hasEnterprise: !!hasEnterprise,
                            hasProduct: !!hasProduct,
                            hasServices: !!hasServices,
                            servicesValue: servicesValue,
                            servicesValueType: typeof servicesValue,
                        },
                    );

                    return isComplete;
                }

                console.log(
                    `🔍 Checking record ${config.id}: isExisting=${isExisting}, isModified=${isModified}`,
                );
                return false;
            });

            console.log(
                `📊 Found ${temporaryRows.length} complete temporary rows to auto-save`,
            );
            console.log(
                `📊 Found ${modifiedRows.length} modified existing rows to auto-save`,
            );
            console.log(
                '🔍 Current modifiedExistingRecords set (from ref):',
                Array.from(modifiedExistingRecordsRef.current),
            );

            const totalRowsToSave = temporaryRows.length + modifiedRows.length;
            if (totalRowsToSave > 0) {
                console.log(
                    '💾 Auto-saving rows...',
                    temporaryRows.map((r) => r.id),
                );

                for (const tempRow of temporaryRows) {
                    console.log(`💾 Auto-saving row: ${tempRow.id}`);
                    await autoSaveNewRow(tempRow.id);
                }

                // Save modified existing rows - they're already saved via immediate API calls
                // but we still want to show the success animation
                for (const modifiedRow of modifiedRows) {
                    console.log(
                        `💾 Modified existing row already saved: ${modifiedRow.id}`,
                    );
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
        const effectiveConfigs = getEffectivePipelineCanvass();

        console.log(
            '💾 Save button clicked - effective pipelineCanvass state:',
        );
        effectiveConfigs.forEach((c: any, index: number) => {
            console.log(`  Record ${index + 1}:`, {
                id: c.id,
                enterprise: c.enterprise || c.enterpriseName,
                product: c.product || c.productName,
                services: c.services || c.serviceName,
                hasEnterprise: !!(c.enterprise || c.enterpriseName)?.trim(),
                hasProduct: !!(c.product || c.productName)?.trim(),
                hasServices: !!(c.services || c.serviceName)?.trim(),
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
        localStorage.removeItem('enterpriseAutoSave');
        console.log(
            '🧹 Cleared auto-save data from localStorage due to manual save',
        );

        // Clear any pending auto-save data from localStorage
        localStorage.removeItem('enterpriseAutoSave');
        console.log(
            '🧹 Cleared auto-save data from localStorage due to manual save',
        );

        // Get all temporary (unsaved) rows using effective configs
        const temporaryRows = effectiveConfigs.filter((config: any) =>
            String(config.id).startsWith('tmp-'),
        );

        // Get all existing rows that might have incomplete data using effective configs
        const existingRows = effectiveConfigs.filter(
            (config: any) => !String(config.id).startsWith('tmp-'),
        );

        // Check for incomplete temporary rows (including completely blank ones)
        const incompleteTemporaryRows = temporaryRows.filter((config: any) => {
            const hasEnterprise = (
                config.enterprise || config.enterpriseName
            )?.trim();
            const hasProduct = (config.product || config.productName)?.trim();
            const hasServices = (config.services || config.serviceName)?.trim();

            return !hasEnterprise || !hasProduct || !hasServices;
        });

        // Check for incomplete existing rows (including completely blank ones)
        const incompleteExistingRows = existingRows.filter((config: any) => {
            const hasEnterprise = (
                config.enterprise || config.enterpriseName
            )?.trim();
            const hasProduct = (config.product || config.productName)?.trim();
            const hasServices = (config.services || config.serviceName)?.trim();

            return !hasEnterprise || !hasProduct || !hasServices;
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
                enterprise: r.enterprise || r.enterpriseName,
                product: r.product || r.productName,
                services: r.services || r.serviceName,
                hasEnterprise: !!(r.enterprise || r.enterpriseName)?.trim(),
                hasProduct: !!(r.product || r.productName)?.trim(),
                hasServices: !!(r.services || r.serviceName)?.trim(),
            })),
            incompleteExistingRows: incompleteExistingRows.map((r: any) => ({
                id: r.id,
                enterprise: r.enterprise,
                product: r.product,
                services: r.services,
            })),
        });

        if (
            temporaryRows.length === 0 &&
            incompleteExistingRows.length === 0 &&
            !hasPendingChanges
        ) {
            showBlueNotification('No unsaved entries to save.');
            return;
        }

        if (incompleteRows.length > 0) {
            const missingFields = new Set<string>();
            incompleteRows.forEach((config) => {
                if (!(config.enterprise || config.enterpriseName)?.trim())
                    missingFields.add('Enterprise');
                if (!(config.product || config.productName)?.trim())
                    missingFields.add('Product');
                if (!(config.services || config.serviceName)?.trim())
                    missingFields.add('Services');
            });

            const incompleteCount = incompleteRows.length;
            const temporaryCount = incompleteTemporaryRows.length;
            const existingCount = incompleteExistingRows.length;

            let message = `Found ${incompleteCount} incomplete record${
                incompleteCount > 1 ? 's' : ''
            }.\nMissing required fields: ${Array.from(missingFields).join(
                ', ',
            )}`;

            setValidationMessage(message);
            setShowValidationErrors(true); // Enable red border highlighting for validation errors
            setShowValidationModal(true);
            return;
        }

        // Save all complete temporary rows and handle pending changes
        try {
            let savedCount = 0;
            const completeTemporaryRows = temporaryRows.filter(
                (config: any) => {
                    const hasEnterprise = (
                        config.enterprise || config.enterpriseName
                    )?.trim();
                    const hasProduct = (
                        config.product || config.productName
                    )?.trim();
                    const hasServices = (
                        config.services || config.serviceName
                    )?.trim();
                    return hasEnterprise && hasProduct && hasServices;
                },
            );

            // Save temporary rows
            for (const tempRow of completeTemporaryRows) {
                await autoSaveNewRow(tempRow.id);
                savedCount++;
            }

            // Handle pending changes from modified existing records
            if (hasActiveAutoSave || hasModifiedExistingRecords) {
                console.log(
                    '💾 Manual save triggered - processing pending changes immediately',
                );

                // Trigger the auto-save process immediately instead of waiting for timer
                const pendingSavedCount = await executeAutoSave();

                if (pendingSavedCount > 0) {
                    savedCount += pendingSavedCount;
                }
            }

            if (savedCount > 0) {
                showBlueNotification(
                    `Successfully saved ${savedCount} entries.`,
                );
                setShowValidationErrors(false); // Clear validation errors on successful save
            } else if (hasPendingChanges) {
                showBlueNotification('Pending changes saved successfully.');
                setShowValidationErrors(false); // Clear validation errors on successful save
            } else {
                showBlueNotification('No complete entries to save.');
            }
        } catch (error) {
            console.error('Failed to save entries:', error);
            showBlueNotification(
                'Failed to save some entries. Please try again.',
            );
        }
    };

    // Navigation warning handler
    const handleNavigationAttempt = (navigationFn: () => void) => {
        const incomplete = getIncompleteRows();
        if (incomplete.length > 0) {
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
            const incomplete = getIncompleteRows();

            // Check for pending auto-save and execute synchronously
            const storedData = localStorage.getItem('enterpriseAutoSave');
            if (storedData) {
                console.log('⚠️ Pending auto-save detected on page unload');
                // We can't await in beforeunload, but we can trigger the save
                // The user will see a warning if there are incomplete rows
            }

            if (incomplete.length > 0) {
                e.preventDefault();
                e.returnValue =
                    'You have incomplete enterprise configurations. Your changes will be lost if you leave.';
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

                        const temporaryRows = pipelineCanvassRef.current.filter(
                            (config) => {
                                const isTemp = String(config.id).startsWith(
                                    'tmp-',
                                );
                                if (!isTemp) return false;

                                const hasEnterprise = config.enterprise?.trim();
                                const hasProduct = config.product?.trim();
                                const hasServices = config.services?.trim();

                                return (
                                    hasEnterprise && hasProduct && hasServices
                                );
                            },
                        );

                        let savedCount = 0;
                        for (const tempRow of temporaryRows) {
                            try {
                                await autoSaveNewRow(tempRow.id);
                                savedCount++;
                            } catch (error) {
                                console.error(
                                    `❌ Failed to auto-save row ${tempRow.id}:`,
                                    error,
                                );
                            }
                        }

                        if (savedCount > 0) {
                            showBlueNotification(
                                `✅ Auto-saved ${savedCount} entries before leaving page`,
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
    }, [pipelineCanvass]);

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
        (window as any).testLinkageCreation = testManualLinkageCreation;
        (window as any).addTestRow = () => {
            const newId = `tmp-${Date.now()}`;
            const testRow = {
                id: newId,
                enterprise: '',
                product: '',
                services: '',
            } as any;
            setPipelineCanvass((prev) => {
                const updated = [...prev, testRow];
                // Apply stable sorting to maintain display order
                return sortConfigsByDisplayOrder(updated);
            });
            console.log('🧪 Added test row:', newId);
        };
        (window as any).testAutoSave = (tempRowId?: string) => {
            const rowId = tempRowId || `tmp-${Date.now()}`;
            console.log('🧪 Testing auto-save for row:', rowId);
            autoSaveNewRow(rowId);
        };
        (window as any).showPipelines = () => {
            console.log('📋 Current pipelines:', pipelineCanvass);
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
                rowId ||
                (pipelineCanvass.length > 0
                    ? pipelineCanvass[0].id
                    : 'test-id');
            console.log('🧪 Testing animation for row:', testRowId);
            startRowCompressionAnimation(testRowId);
        };
    }

    // Handle dropdown option updates (edit/delete)
    const handleDropdownOptionUpdate = async (
        type: 'pipelineNames' | 'details' | 'service',
        action: 'update' | 'delete',
        oldName: string,
        newName?: string,
    ) => {
        // Map 'service' to 'services' for internal state
        const stateKey =
            type === 'service'
                ? 'services'
                : type === 'pipelineNames'
                ? 'pipelineNames'
                : 'details';

        console.log(`🔄 Updating ${type} - ${action}:`, {oldName, newName});

        // Update dropdown options
        if (action === 'update' && newName) {
            setDropdownOptions((prev) => {
                const updated = {
                    ...prev,
                    [stateKey]: prev[stateKey].map((item) =>
                        item.name === oldName ? {...item, name: newName} : item,
                    ),
                };
                console.log(
                    `✅ Updated dropdown options for ${type}:`,
                    updated[stateKey],
                );
                return updated;
            });
        } else if (action === 'delete') {
            setDropdownOptions((prev) => {
                const updated = {
                    ...prev,
                    [stateKey]: prev[stateKey].filter(
                        (item) => item.name !== oldName,
                    ),
                };
                console.log(
                    `🗑️ Removed from dropdown options for ${type}:`,
                    updated[stateKey],
                );
                return updated;
            });
        }

        // Update all affected rows in the table
        setPipelineCanvass((prev) => {
            let updatedCount = 0;
            const updatedConfigs = prev.map((config: any) => {
                const updatedConfig = {...config};
                let wasUpdated = false;

                if (type === 'pipelineNames') {
                    if (updatedConfig.pipelineName === oldName) {
                        if (action === 'update' && newName) {
                            updatedConfig.pipelineName = newName;
                            wasUpdated = true;
                        } else if (action === 'delete') {
                            updatedConfig.pipelineName = '';
                            wasUpdated = true;
                        }
                    }
                } else if (type === 'details') {
                    if (updatedConfig.details === oldName) {
                        if (action === 'update' && newName) {
                            updatedConfig.details = newName;
                            wasUpdated = true;
                        } else if (action === 'delete') {
                            updatedConfig.details = '';
                            wasUpdated = true;
                        }
                    }
                } else if (type === 'service') {
                    // Services are stored in services field as comma-separated values
                    if (updatedConfig.services) {
                        const services = updatedConfig.services
                            .split(', ')
                            .filter(Boolean);
                        if (services.includes(oldName)) {
                            if (action === 'update' && newName) {
                                const updatedServices = services.map(
                                    (s: string) =>
                                        s === oldName ? newName : s,
                                );
                                updatedConfig.services =
                                    updatedServices.join(', ');
                                wasUpdated = true;
                            } else if (action === 'delete') {
                                const updatedServices = services.filter(
                                    (s: string) => s !== oldName,
                                );
                                updatedConfig.services =
                                    updatedServices.join(', ');
                                wasUpdated = true;
                            }
                        }
                    }
                }

                if (wasUpdated) {
                    updatedCount++;
                }

                return updatedConfig;
            });

            console.log(
                `📊 Updated ${updatedCount} table rows for ${type} ${action}`,
            );
            // Apply stable sorting to maintain display order
            return sortConfigsByDisplayOrder(updatedConfigs);
        });

        // Force table re-render by incrementing version
        setTableVersion((prev) => prev + 1);

        // Force a small delay to ensure state updates are processed
        await new Promise((resolve) => setTimeout(resolve, 50));
        console.log(`✨ Completed ${type} ${action} update`);
    };

    // Load enterprise-product-service linkages from API

    // Load data on component mount
    useEffect(() => {
        let mounted = true; // Prevent state updates if component unmounted

        (async () => {
            try {
                setIsLoading(true);
                console.log('🔄 Loading pipeline canvas data...');

                // Get account and enterprise from localStorage for filtering
                const accountId =
                    window.localStorage.getItem('selectedAccountId');
                const accountName = window.localStorage.getItem(
                    'selectedAccountName',
                );
                const enterpriseId = window.localStorage.getItem(
                    'selectedEnterpriseId',
                );

                // Build API URL with optional filters
                let apiUrl = '/api/pipeline-canvas';
                if (accountId && accountName) {
                    apiUrl += `?accountId=${accountId}&accountName=${encodeURIComponent(
                        accountName,
                    )}`;
                    if (enterpriseId) {
                        apiUrl += `&enterpriseId=${enterpriseId}`;
                    }
                }

                console.log(`🔍 Fetching pipelines from: ${apiUrl}`);

                // Load both pipeline data and dropdown options in parallel
                const [pipelinesRes] = await Promise.all([
                    api.get<
                        Array<{
                            id: string;
                            pipelineName: string;
                            details: string;
                            service: string;
                            entity: string;
                            status: string;
                            lastUpdated: string;
                            createdAt: string;
                            updatedAt: string;
                            accountId?: string;
                            accountName?: string;
                            enterpriseId?: string;
                            enterpriseName?: string;
                            yamlContent?: string;
                            createdBy?: string;
                        }>
                    >(apiUrl),
                    loadDropdownOptions(),
                ]);

                // Only update state if component is still mounted
                if (!mounted) {
                    console.log(
                        '⚠️ Component unmounted during data load, skipping state update',
                    );
                    return;
                }

                console.log('📊 Loaded pipelines:', pipelinesRes?.length || 0);

                if (!pipelinesRes || pipelinesRes.length === 0) {
                    console.log('ℹ️ No pipelines found');
                    setPipelineCanvass([]);
                    setIsLoading(false);
                    // Don't return here - dropdown options are still loaded and ready for new records
                    return;
                }

                // Transform pipeline data to PipelineCanvasRow format
                const transformedConfigs = pipelinesRes
                    .map((pipeline, index) => ({
                        id: pipeline.id,
                        pipelineName: pipeline.pipelineName || '',
                        details: pipeline.details || '',
                        service: pipeline.service || '',
                        status: pipeline.status || '',
                        lastUpdated: pipeline.lastUpdated || '',
                        createdBy: pipeline.createdBy || '',
                        // Store creation time and display order for stable sorting
                        createdAt: pipeline.createdAt,
                        updatedAt: pipeline.updatedAt,
                        displayOrder: index, // Preserve original API order
                    }))
                    // Sort by creation time first, then by display order for stable ordering
                    .sort((a, b) => {
                        const timeA = new Date(a.createdAt).getTime();
                        const timeB = new Date(b.createdAt).getTime();
                        if (timeA !== timeB) {
                            return timeA - timeB;
                        }
                        // If creation times are equal, use display order
                        return a.displayOrder - b.displayOrder;
                    });

                // Initialize client-side display order tracking
                transformedConfigs.forEach((config, index) => {
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
                    sortConfigsByDisplayOrder(transformedConfigs);

                // Only set initial state if no configs exist yet (to prevent overwriting user changes)
                setPipelineCanvass((prevConfigs) => {
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

                console.log('✅ Pipelines loaded and transformed successfully');
            } catch (error) {
                console.error('❌ Failed to load pipelines:', error);
                if (mounted) {
                    setPipelineCanvass([]);
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

    // Force table re-render when configs data changes
    useEffect(() => {
        console.log(
            '📋 Enterprise configs data changed, current count:',
            pipelineCanvass.length,
        );
        console.log(
            '📋 Current enterprise configs state:',
            pipelineCanvass.map((c) => ({
                id: c.id,
                enterprise: c.enterprise || c.enterpriseName,
                product: c.product || c.productName,
                services: c.services || c.serviceName,
                hasProduct: !!(c.product || c.productName)?.trim(),
                displayOrder: displayOrderRef.current.get(c.id),
            })),
        );
    }, [pipelineCanvass]);

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
        setShowDeleteConfirmation(true);
        setFoldingRowId(null);
    };

    // Handle delete confirmation
    const handleDeleteConfirm = async () => {
        if (!pendingDeleteRowId) return;

        setDeletingRow(true);
        try {
            console.log('🗑️ Deleting pipeline:', pendingDeleteRowId);

            // Call the backend delete API
            await api.del(`/api/pipeline-canvas/${pendingDeleteRowId}`);

            // Remove from local state
            setPipelineCanvass((prev) => {
                const updated = prev.filter(
                    (config) => config.id !== pendingDeleteRowId,
                );
                // Apply stable sorting to maintain display order
                return sortConfigsByDisplayOrder(updated);
            });

            console.log('✅ Pipeline deleted successfully');

            // Close modal and reset state
            setShowDeleteConfirmation(false);
            setPendingDeleteRowId(null);

            // Trigger table re-render
            setTableVersion((prev) => prev + 1);
        } catch (error) {
            console.error('❌ Failed to delete pipeline:', error);
            // Show error notification using the blue notification system
            showBlueNotification(
                'Failed to delete the pipeline. Please try again.',
                5000, // Show for 5 seconds for error messages
            );
        } finally {
            setDeletingRow(false);
        }
    };

    const handleDeleteCancel = () => {
        setShowDeleteConfirmation(false);
        setPendingDeleteRowId(null);
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
            );
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
        const blank = {
            id: newId,
            enterprise: '',
            product: '',
            services: '',
        } as any;
        setPipelineCanvass((prev) => {
            const updated = [...prev, blank];
            // Apply stable sorting to maintain display order
            return sortConfigsByDisplayOrder(updated);
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

    return (
        <div className='h-full bg-secondary flex flex-col'>
            {/* Header Section */}
            <div className='bg-white px-3 py-4 border-b border-slate-200'>
                <div className='w-full'>
                    <h1 className='text-2xl font-bold text-slate-900'>
                        Pipeline Canvas
                    </h1>
                    <p className='mt-2 text-sm text-slate-600 leading-relaxed'>
                        Create, manage, and monitor your CI/CD pipelines. Build
                        custom pipelines or choose from pre-built templates to
                        streamline your deployment workflows.
                    </p>
                </div>
            </div>

            {/* Toolbar Section */}
            <div className='bg-sap-light-gray px-3 py-3 text-primary border-y border-light'>
                <div className='flex items-center justify-between gap-3'>
                    <div className='flex items-center gap-3 flex-wrap'>
                        {/* Create Pipeline Dropdown Button */}
                        <div ref={createDropdownRef} className='relative'>
                            <button
                                onClick={() =>
                                    setCreateDropdownOpen(!createDropdownOpen)
                                }
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
                                        : 'Create Pipeline'}
                                </span>
                                <ChevronDownIcon className='h-4 w-4' />
                            </button>

                            {createDropdownOpen && !isLoading && (
                                <div className='absolute left-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-50'>
                                    <div className='py-1'>
                                        <button
                                            onClick={() => {
                                                setCreateDropdownOpen(false);
                                                router.push(
                                                    '/pipelines/canvas',
                                                );
                                            }}
                                            className='w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2'
                                        >
                                            <PlusIcon className='h-4 w-4' />
                                            <span>Create Pipeline</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setCreateDropdownOpen(false);
                                                router.push(
                                                    '/pipelines/canvas',
                                                );
                                            }}
                                            className='w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2'
                                        >
                                            <BookmarkIcon className='h-4 w-4' />
                                            <span>Choose from Template</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setCreateDropdownOpen(false);
                                                router.push(
                                                    '/pipelines/canvas',
                                                );
                                            }}
                                            className='w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2'
                                        >
                                            <RectangleStackIcon className='h-4 w-4' />
                                            <span>New Template</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

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
                                            {/* Enterprise Filter */}
                                            <div>
                                                <label className='block text-xs font-medium text-gray-700 mb-1'>
                                                    Enterprise
                                                </label>
                                                <div className='relative'>
                                                    <input
                                                        type='text'
                                                        value={
                                                            filterForm.enterprise
                                                        }
                                                        onChange={(e) =>
                                                            setFilterForm({
                                                                ...filterForm,
                                                                enterprise:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        }
                                                        className='w-full pl-2 pr-8 py-1 text-sm border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded bg-white'
                                                    />
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
                                                        onChange={(e) =>
                                                            setFilterForm({
                                                                ...filterForm,
                                                                product:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        }
                                                        className='w-full pl-2 pr-8 py-1 text-sm border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded bg-white'
                                                    />
                                                </div>
                                            </div>

                                            {/* Services Filter */}
                                            <div>
                                                <label className='block text-xs font-medium text-gray-700 mb-1'>
                                                    Services
                                                </label>
                                                <div className='relative'>
                                                    <input
                                                        type='text'
                                                        value={
                                                            filterForm.services
                                                        }
                                                        onChange={(e) =>
                                                            setFilterForm({
                                                                ...filterForm,
                                                                services:
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
                                                        {allCols.map((col) => (
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
                                                            {c ===
                                                            'pipelineName'
                                                                ? 'Enterprise'
                                                                : c ===
                                                                  'details'
                                                                ? 'Product'
                                                                : c ===
                                                                  'service'
                                                                ? 'Services'
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
                                <div className='absolute left-0 top-full z-50 mt-2 w-[240px] rounded-lg bg-card text-primary shadow-xl border border-blue-200'>
                                    <div className='flex items-center justify-between px-3 py-2 border-b border-blue-200'>
                                        <div className='text-xs font-semibold'>
                                            Group by
                                        </div>
                                    </div>
                                    <div className='p-3'>
                                        <div className='space-y-3'>
                                            <div>
                                                <div className='relative'>
                                                    <select
                                                        value={ActiveGroupLabel}
                                                        onChange={(e) =>
                                                            setGroupByFromLabel(
                                                                e.target.value,
                                                            )
                                                        }
                                                        className='w-full pl-2 pr-8 py-1.5 text-sm border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded bg-white'
                                                    >
                                                        <option>None</option>
                                                        <option>
                                                            Enterprise
                                                        </option>
                                                        <option>Product</option>
                                                        <option>
                                                            Services
                                                        </option>
                                                    </select>
                                                </div>
                                            </div>
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
                                        Loading Pipeline Canvass
                                    </h3>
                                    <p className='mt-2 text-sm text-slate-500'>
                                        Please wait while we fetch your
                                        enterprise-product-service linkages...
                                    </p>
                                </div>
                            </div>
                        ) : pipelineCanvass.length === 0 ? (
                            // Empty State
                            <div className='bg-white rounded-lg border border-slate-200 p-12 text-center'>
                                <div className='mx-auto max-w-md'>
                                    <svg
                                        className='mx-auto h-16 w-16 text-slate-400'
                                        fill='none'
                                        viewBox='0 0 24 24'
                                        stroke='currentColor'
                                        aria-hidden='true'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={1.5}
                                            d='M3.5 12c0-2 1.5-3.5 3.5-3.5s3.5 1.5 3.5 3.5-1.5 3.5-3.5 3.5S3.5 14 3.5 12z M13.5 12c0 2 1.5 3.5 3.5 3.5s3.5-1.5 3.5-3.5-1.5-3.5-3.5-3.5-3.5 1.5-3.5 3.5z'
                                        />
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={1.5}
                                            d='M10.5 12c0-1.8 1.2-3.2 2.5-3.5 M13.5 12c0 1.8-1.2 3.2-2.5 3.5'
                                        />
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M8 12h8'
                                        />
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M14 9.5l2.5 2.5-2.5 2.5'
                                        />
                                    </svg>
                                    <h3 className='mt-4 text-lg font-semibold text-slate-900'>
                                        No Pipelines Yet
                                    </h3>
                                    <p className='mt-2 text-sm text-slate-500'>
                                        Get started by creating your first CI/CD
                                        pipeline. Build custom workflows or
                                        choose from our pre-built templates to
                                        automate your deployment process.
                                    </p>
                                    <div className='mt-6'>
                                        <button
                                            onClick={() => {
                                                router.push(
                                                    '/pipelines/canvas',
                                                );
                                            }}
                                            className='inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
                                        >
                                            <PlusIcon className='-ml-1 mr-2 h-5 w-5' />
                                            Create Your First Pipeline
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className='flex-1 overflow-auto'>
                                <PipelineCanvasTable
                                    // title='Account Details'
                                    hideRowExpansion={true}
                                    customColumnLabels={{
                                        enterprise: 'Enterprise',
                                        product: 'Product',
                                        services: 'Services',
                                    }}
                                    enableDropdownChips={true}
                                    enableInlineEditing={true}
                                    dropdownOptions={dropdownOptions}
                                    onDropdownOptionUpdate={
                                        handleDropdownOptionUpdate
                                    }
                                    onNewItemCreated={handleNewItemCreated}
                                    incompleteRowIds={getIncompleteRows()}
                                    showValidationErrors={showValidationErrors}
                                    hasBlankRow={hasBlankRow()}
                                    compressingRowId={compressingRowId}
                                    foldingRowId={foldingRowId}
                                    externalSortColumn={sortColumn}
                                    externalSortDirection={
                                        sortDirection as 'asc' | 'desc' | ''
                                    }
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
                                            },
                                        );

                                        // Store pending changes separately to preserve user input during data reloads
                                        setPendingLocalChanges((prev) => ({
                                            ...prev,
                                            [rowId]: {
                                                ...prev[rowId],
                                                [field]: value,
                                            },
                                        }));

                                        // Also update main state for immediate responsiveness (but this may get overwritten)
                                        setPipelineCanvass((prev) => {
                                            const updated = prev.map((config) =>
                                                config.id === rowId
                                                    ? {
                                                          ...config,
                                                          [field]: value,
                                                      }
                                                    : config,
                                            );
                                            // Maintain display order during updates
                                            return sortConfigsByDisplayOrder(
                                                updated,
                                            );
                                        });

                                        // Update local state immediately for responsiveness
                                        try {
                                            const config = pipelineCanvass.find(
                                                (a) => a.id === rowId,
                                            );
                                            if (!config) return;

                                            let updateData: any = {};

                                            if (field === 'pipelineName') {
                                                // Pipeline Name field updated
                                                updateData.pipelineName = value;
                                            } else if (field === 'details') {
                                                // Details field updated
                                                updateData.details = value;
                                            } else if (field === 'service') {
                                                // Service field updated
                                                updateData.service = value;
                                            } else if (field === 'status') {
                                                // Status field updated
                                                updateData.status = value;
                                            } else if (
                                                field === 'lastUpdated'
                                            ) {
                                                // Last Updated field updated
                                                updateData.lastUpdated = value;
                                            }

                                            // For new rows (temporary IDs), check if we can auto-save
                                            if (rowId.startsWith('tmp-')) {
                                                console.log(
                                                    '🔄 Updating temporary row:',
                                                    rowId,
                                                    field,
                                                    value,
                                                );

                                                // Check if all required fields are filled for auto-save
                                                const updatedConfig =
                                                    pipelineCanvass.find(
                                                        (a) => a.id === rowId,
                                                    );
                                                if (updatedConfig) {
                                                    // Apply the current update to check completeness
                                                    const configWithUpdate = {
                                                        ...updatedConfig,
                                                        [field]: value,
                                                    };

                                                    // Check if we have enterprise, product, and at least one service
                                                    const hasEnterprise =
                                                        configWithUpdate.enterprise ||
                                                        configWithUpdate.enterpriseName;
                                                    const hasProduct =
                                                        configWithUpdate.product ||
                                                        configWithUpdate.productName;
                                                    const hasServices =
                                                        configWithUpdate.services ||
                                                        configWithUpdate.serviceName;

                                                    console.log(
                                                        '🔍 Auto-save check:',
                                                        {
                                                            rowId,
                                                            field,
                                                            value,
                                                            configWithUpdate,
                                                            hasEnterprise,
                                                            hasProduct,
                                                            hasServices,
                                                            willTriggerDebouncedSave:
                                                                hasEnterprise &&
                                                                hasProduct &&
                                                                hasServices,
                                                        },
                                                    );

                                                    // Trigger debounced auto-save instead of immediate save
                                                    if (
                                                        hasEnterprise &&
                                                        hasProduct &&
                                                        hasServices
                                                    ) {
                                                        console.log(
                                                            '✅ All required fields filled, starting 10-second auto-save timer...',
                                                        );

                                                        // Clear validation errors for this row since it's now complete
                                                        if (
                                                            showValidationErrors
                                                        ) {
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
                                                                hasEnterprise,
                                                                hasProduct,
                                                                hasServices,
                                                                enterpriseValue:
                                                                    configWithUpdate.enterprise ||
                                                                    configWithUpdate.enterpriseName,
                                                                productValue:
                                                                    configWithUpdate.product ||
                                                                    configWithUpdate.productName,
                                                                servicesValue:
                                                                    configWithUpdate.services ||
                                                                    configWithUpdate.serviceName,
                                                            },
                                                        );
                                                    }
                                                }
                                                return;
                                            }

                                            // For existing rows, check if we should trigger auto-save timer
                                            if (!rowId.startsWith('tmp-')) {
                                                // Create updated config with the new value to check completeness
                                                const config =
                                                    pipelineCanvass.find(
                                                        (a) => a.id === rowId,
                                                    );
                                                if (config) {
                                                    const updatedConfig = {
                                                        ...config,
                                                        [field]: value,
                                                    };

                                                    // Check if all required fields are present and not empty
                                                    // Only check the updated value for the field being modified to avoid stale data
                                                    let hasEnterprise,
                                                        hasProduct,
                                                        hasServices;

                                                    if (
                                                        field === 'pipelineName'
                                                    ) {
                                                        hasEnterprise =
                                                            updatedConfig.enterprise?.trim();
                                                    } else {
                                                        hasEnterprise = (
                                                            updatedConfig.enterprise ||
                                                            updatedConfig.enterpriseName
                                                        )?.trim();
                                                    }

                                                    if (field === 'details') {
                                                        hasProduct =
                                                            updatedConfig.product?.trim();
                                                    } else {
                                                        hasProduct = (
                                                            updatedConfig.product ||
                                                            updatedConfig.productName
                                                        )?.trim();
                                                    }

                                                    // More robust services validation - only check the field that's being updated
                                                    let servicesValue;
                                                    if (field === 'service') {
                                                        servicesValue =
                                                            updatedConfig.services ||
                                                            '';
                                                    } else {
                                                        servicesValue =
                                                            updatedConfig.services ||
                                                            updatedConfig.serviceName ||
                                                            '';
                                                    }

                                                    hasServices = (() => {
                                                        if (
                                                            typeof servicesValue ===
                                                            'string'
                                                        ) {
                                                            const trimmed =
                                                                servicesValue.trim();
                                                            console.log(
                                                                '🔍 Services validation (string):',
                                                                {
                                                                    original:
                                                                        servicesValue,
                                                                    trimmed:
                                                                        trimmed,
                                                                    length: trimmed.length,
                                                                    hasServices:
                                                                        trimmed.length >
                                                                        0,
                                                                },
                                                            );
                                                            return (
                                                                trimmed.length >
                                                                0
                                                            );
                                                        } else if (
                                                            Array.isArray(
                                                                servicesValue,
                                                            )
                                                        ) {
                                                            console.log(
                                                                '🔍 Services validation (array):',
                                                                {
                                                                    array: servicesValue,
                                                                    length: servicesValue.length,
                                                                    hasServices:
                                                                        servicesValue.length >
                                                                        0,
                                                                },
                                                            );
                                                            return (
                                                                servicesValue.length >
                                                                0
                                                            );
                                                        }
                                                        console.log(
                                                            '🔍 Services validation (other):',
                                                            {
                                                                value: servicesValue,
                                                                type: typeof servicesValue,
                                                                hasServices:
                                                                    false,
                                                            },
                                                        );
                                                        return false;
                                                    })();

                                                    console.log(
                                                        '🔍 Existing record auto-save check:',
                                                        {
                                                            rowId,
                                                            field,
                                                            value,
                                                            updatedConfigServices:
                                                                updatedConfig.services,
                                                            updatedConfigServiceName:
                                                                updatedConfig.serviceName,
                                                            servicesValue:
                                                                servicesValue,
                                                            servicesValueType:
                                                                typeof servicesValue,
                                                            fieldBeingUpdated:
                                                                field,
                                                            hasEnterprise:
                                                                !!hasEnterprise,
                                                            hasProduct:
                                                                !!hasProduct,
                                                            hasServices:
                                                                !!hasServices,
                                                            willTriggerAutoSave:
                                                                !!(
                                                                    hasEnterprise &&
                                                                    hasProduct &&
                                                                    hasServices
                                                                ),
                                                            enterpriseCheck: {
                                                                field:
                                                                    field ===
                                                                    'pipelineName'
                                                                        ? 'UPDATING'
                                                                        : 'existing',
                                                                value: hasEnterprise,
                                                            },
                                                            productCheck: {
                                                                field:
                                                                    field ===
                                                                    'details'
                                                                        ? 'UPDATING'
                                                                        : 'existing',
                                                                value: hasProduct,
                                                            },
                                                            servicesCheck: {
                                                                field:
                                                                    field ===
                                                                    'service'
                                                                        ? 'UPDATING'
                                                                        : 'existing',
                                                                value: hasServices,
                                                                rawValue:
                                                                    servicesValue,
                                                            },
                                                        },
                                                    );

                                                    // Only trigger auto-save if all fields are complete
                                                    if (
                                                        hasEnterprise &&
                                                        hasProduct &&
                                                        hasServices
                                                    ) {
                                                        console.log(
                                                            '🔄 Triggering auto-save timer for complete existing record:',
                                                            rowId,
                                                        );

                                                        // Clear validation errors for this row since it's now complete
                                                        if (
                                                            showValidationErrors
                                                        ) {
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
                                                                return newSet;
                                                            },
                                                        );
                                                        // Trigger auto-save timer for visual feedback
                                                        debouncedAutoSave();
                                                    } else {
                                                        console.log(
                                                            '❌ Not triggering auto-save for incomplete existing record:',
                                                            rowId,
                                                            {
                                                                hasEnterprise:
                                                                    !!hasEnterprise,
                                                                hasProduct:
                                                                    !!hasProduct,
                                                                hasServices:
                                                                    !!hasServices,
                                                            },
                                                        );
                                                        // Remove from modified records set if it was there
                                                        setModifiedExistingRecords(
                                                            (prev) => {
                                                                const newSet =
                                                                    new Set(
                                                                        prev,
                                                                    );
                                                                const wasRemoved =
                                                                    newSet.delete(
                                                                        rowId,
                                                                    );
                                                                console.log(
                                                                    `🧹 Removing incomplete record ${rowId} from modified set: ${
                                                                        wasRemoved
                                                                            ? 'removed'
                                                                            : 'not found'
                                                                    }`,
                                                                );
                                                                console.log(
                                                                    `🧹 Modified set after removal:`,
                                                                    Array.from(
                                                                        newSet,
                                                                    ),
                                                                );
                                                                return newSet;
                                                            },
                                                        );

                                                        // Exit early - do not proceed with API call for incomplete record
                                                        console.log(
                                                            `🛑 Skipping API call for incomplete record: ${rowId}`,
                                                        );
                                                        return;
                                                    }
                                                }
                                            }

                                            // For existing rows, attempt to update via API
                                            console.log(
                                                '🔄 Updating pipeline:',
                                                rowId,
                                                updateData,
                                            );

                                            // Update the pipeline via API
                                            try {
                                                const config =
                                                    pipelineCanvass.find(
                                                        (a) => a.id === rowId,
                                                    );
                                                if (config) {
                                                    // Create updated config with the new value
                                                    const updatedConfig = {
                                                        ...config,
                                                        [field]: value,
                                                    };

                                                    // Find the IDs for the current values (use updated config)
                                                    const enterpriseName =
                                                        updatedConfig.enterprise ||
                                                        updatedConfig.enterpriseName;
                                                    const productName =
                                                        updatedConfig.product ||
                                                        updatedConfig.productName;
                                                    // Use field-specific value to avoid stale data from alternate field names
                                                    const rawServiceValue =
                                                        field === 'service'
                                                            ? updatedConfig.services
                                                            : field ===
                                                              'serviceName'
                                                            ? updatedConfig.serviceName
                                                            : updatedConfig.services ||
                                                              updatedConfig.serviceName ||
                                                              '';

                                                    const serviceNames =
                                                        rawServiceValue
                                                            .split(', ')
                                                            .filter(Boolean);

                                                    console.log(
                                                        '🔍 Service update debug:',
                                                        {
                                                            field,
                                                            oldRawServiceValue:
                                                                config.services ||
                                                                config.serviceName ||
                                                                '',
                                                            newRawServiceValue:
                                                                rawServiceValue,
                                                            serviceNames,
                                                            serviceCount:
                                                                serviceNames.length,
                                                        },
                                                    );

                                                    // Check if Enterprise or Product changed - this might create a duplicate
                                                    const oldEnterpriseName =
                                                        config.enterprise ||
                                                        config.enterpriseName;
                                                    const oldProductName =
                                                        config.product ||
                                                        config.productName;

                                                    if (
                                                        (field ===
                                                            'pipelineName' &&
                                                            enterpriseName !==
                                                                oldEnterpriseName) ||
                                                        (field === 'details' &&
                                                            productName !==
                                                                oldProductName)
                                                    ) {
                                                        // Check if the new Enterprise + Product combination already exists
                                                        const duplicateRecord =
                                                            pipelineCanvass.find(
                                                                (cfg) => {
                                                                    const cfgEnterprise =
                                                                        cfg.enterprise ||
                                                                        cfg.enterpriseName;
                                                                    const cfgProduct =
                                                                        cfg.product ||
                                                                        cfg.productName;
                                                                    return (
                                                                        cfgEnterprise ===
                                                                            enterpriseName &&
                                                                        cfgProduct ===
                                                                            productName &&
                                                                        cfg.id !==
                                                                            rowId && // Different record
                                                                        !cfg.id
                                                                            .toString()
                                                                            .startsWith(
                                                                                'tmp-',
                                                                            ) // Not temporary
                                                                    );
                                                                },
                                                            );

                                                        if (duplicateRecord) {
                                                            console.log(
                                                                '⚠️ Enterprise + Product change would create duplicate:',
                                                                {
                                                                    currentId:
                                                                        rowId,
                                                                    duplicateId:
                                                                        duplicateRecord.id,
                                                                    enterprise:
                                                                        enterpriseName,
                                                                    product:
                                                                        productName,
                                                                },
                                                            );

                                                            // Merge services into the existing duplicate record
                                                            const existingServices =
                                                                duplicateRecord.services
                                                                    ?.split(
                                                                        ', ',
                                                                    )
                                                                    .filter(
                                                                        Boolean,
                                                                    ) || [];
                                                            const currentServices =
                                                                config.services
                                                                    ?.split(
                                                                        ', ',
                                                                    )
                                                                    .filter(
                                                                        Boolean,
                                                                    ) || [];
                                                            const allServices =
                                                                Array.from(
                                                                    new Set([
                                                                        ...existingServices,
                                                                        ...currentServices,
                                                                    ]),
                                                                );

                                                            // Update the duplicate record with merged services
                                                            const mergedServiceObjects =
                                                                allServices
                                                                    .map(
                                                                        (
                                                                            serviceName: string,
                                                                        ) =>
                                                                            dropdownOptions.services.find(
                                                                                (
                                                                                    s: any,
                                                                                ) =>
                                                                                    s.name ===
                                                                                    serviceName,
                                                                            ),
                                                                    )
                                                                    .filter(
                                                                        Boolean,
                                                                    );

                                                            const pipelineNameEntity =
                                                                dropdownOptions.pipelineNames.find(
                                                                    (e) =>
                                                                        e.name ===
                                                                        enterpriseName,
                                                                );
                                                            const detailsEntity =
                                                                dropdownOptions.details.find(
                                                                    (p) =>
                                                                        p.name ===
                                                                        productName,
                                                                );

                                                            if (
                                                                pipelineNameEntity &&
                                                                detailsEntity &&
                                                                mergedServiceObjects.length >
                                                                    0
                                                            ) {
                                                                const linkageData =
                                                                    {
                                                                        pipelineNameId:
                                                                            pipelineNameEntity.id,
                                                                        detailsId:
                                                                            detailsEntity.id,
                                                                        serviceIds:
                                                                            mergedServiceObjects.map(
                                                                                (
                                                                                    s: any,
                                                                                ) =>
                                                                                    s!
                                                                                        .id,
                                                                            ),
                                                                    };

                                                                // Update the existing duplicate record
                                                                await api.put(
                                                                    `/api/pipeline-canvas/${duplicateRecord.id}`,
                                                                    linkageData,
                                                                );

                                                                // Delete the current record since it's now merged
                                                                await api.del(
                                                                    `/api/pipeline-canvas/${rowId}`,
                                                                );

                                                                // Update local state: merge into duplicate and remove current
                                                                setPipelineCanvass(
                                                                    (prev) => {
                                                                        const updated =
                                                                            prev
                                                                                .map(
                                                                                    (
                                                                                        cfg,
                                                                                    ) => {
                                                                                        if (
                                                                                            cfg.id ===
                                                                                            duplicateRecord.id
                                                                                        ) {
                                                                                            return {
                                                                                                ...cfg,
                                                                                                services:
                                                                                                    allServices.join(
                                                                                                        ', ',
                                                                                                    ),
                                                                                            };
                                                                                        }
                                                                                        return cfg;
                                                                                    },
                                                                                )
                                                                                .filter(
                                                                                    (
                                                                                        cfg,
                                                                                    ) =>
                                                                                        cfg.id !==
                                                                                        rowId,
                                                                                );
                                                                        // Apply stable sorting to maintain display order
                                                                        return sortConfigsByDisplayOrder(
                                                                            updated,
                                                                        );
                                                                    },
                                                                );

                                                                console.log(
                                                                    '✅ Records merged successfully, duplicate removed',
                                                                );
                                                                return; // Exit early, no need to continue with normal update
                                                            }
                                                        }
                                                    }

                                                    const pipelineNameEntity =
                                                        dropdownOptions.pipelineNames.find(
                                                            (e) =>
                                                                e.name ===
                                                                enterpriseName,
                                                        );
                                                    const detailsEntity =
                                                        dropdownOptions.details.find(
                                                            (p) =>
                                                                p.name ===
                                                                productName,
                                                        );
                                                    const services =
                                                        serviceNames
                                                            .map(
                                                                (
                                                                    serviceName: string,
                                                                ) =>
                                                                    dropdownOptions.services.find(
                                                                        (
                                                                            s: any,
                                                                        ) =>
                                                                            s.name ===
                                                                            serviceName,
                                                                    ),
                                                            )
                                                            .filter(Boolean);

                                                    if (
                                                        pipelineNameEntity &&
                                                        detailsEntity &&
                                                        services.length > 0
                                                    ) {
                                                        const linkageUpdateData =
                                                            {
                                                                pipelineNameId:
                                                                    pipelineNameEntity.id,
                                                                detailsId:
                                                                    detailsEntity.id,
                                                                serviceIds:
                                                                    services.map(
                                                                        (
                                                                            s: any,
                                                                        ) =>
                                                                            s!
                                                                                .id,
                                                                    ),
                                                            };

                                                        console.log(
                                                            '📤 Updating pipeline via API:',
                                                            linkageUpdateData,
                                                        );

                                                        try {
                                                            // Try to update first
                                                            await api.put(
                                                                `/api/pipeline-canvas/${rowId}`,
                                                                linkageUpdateData,
                                                            );
                                                            console.log(
                                                                '✅ Pipeline updated successfully',
                                                            );
                                                        } catch (updateError: any) {
                                                            // If update fails with 404, try to create a new record
                                                            if (
                                                                updateError.message?.includes(
                                                                    '404',
                                                                ) ||
                                                                updateError.message?.includes(
                                                                    'Record not found',
                                                                )
                                                            ) {
                                                                console.log(
                                                                    '🔄 Record not found, creating new pipeline instead...',
                                                                );
                                                                try {
                                                                    const newLinkage =
                                                                        await api.post(
                                                                            '/api/pipeline-canvas',
                                                                            linkageUpdateData,
                                                                        );
                                                                    console.log(
                                                                        '✅ New pipeline created successfully:',
                                                                        newLinkage,
                                                                    );

                                                                    // Update the local account with the new linkage ID
                                                                    if (
                                                                        newLinkage &&
                                                                        (
                                                                            newLinkage as any
                                                                        ).id
                                                                    ) {
                                                                        const newId =
                                                                            (
                                                                                newLinkage as any
                                                                            )
                                                                                .id;
                                                                        console.log(
                                                                            '🔄 Updating record ID from',
                                                                            rowId,
                                                                            'to',
                                                                            newId,
                                                                        );

                                                                        // Transfer modified record tracking from old ID to new ID
                                                                        if (
                                                                            modifiedExistingRecordsRef.current.has(
                                                                                rowId,
                                                                            )
                                                                        ) {
                                                                            console.log(
                                                                                '🔄 Transferring modified record tracking from old ID to new ID',
                                                                            );
                                                                            modifiedExistingRecordsRef.current.delete(
                                                                                rowId,
                                                                            );
                                                                            modifiedExistingRecordsRef.current.add(
                                                                                newId,
                                                                            );
                                                                            console.log(
                                                                                '✅ Modified records tracking updated:',
                                                                                Array.from(
                                                                                    modifiedExistingRecordsRef.current,
                                                                                ),
                                                                            );
                                                                        }

                                                                        // Transfer client-side display order from old ID to new ID
                                                                        const oldDisplayOrder =
                                                                            displayOrderRef.current.get(
                                                                                rowId,
                                                                            );
                                                                        if (
                                                                            oldDisplayOrder !==
                                                                            undefined
                                                                        ) {
                                                                            displayOrderRef.current.delete(
                                                                                rowId,
                                                                            );
                                                                            displayOrderRef.current.set(
                                                                                newId,
                                                                                oldDisplayOrder,
                                                                            );
                                                                            console.log(
                                                                                '🔄 Transferred display order',
                                                                                oldDisplayOrder,
                                                                                'from',
                                                                                rowId,
                                                                                'to',
                                                                                newId,
                                                                            );
                                                                        }

                                                                        setPipelineCanvass(
                                                                            (
                                                                                prev,
                                                                            ) => {
                                                                                const updated =
                                                                                    prev.map(
                                                                                        (
                                                                                            cfg,
                                                                                        ) =>
                                                                                            cfg.id ===
                                                                                            rowId
                                                                                                ? {
                                                                                                      ...cfg,
                                                                                                      id: newId,
                                                                                                      // Preserve display order and timestamps
                                                                                                      displayOrder:
                                                                                                          cfg.displayOrder ||
                                                                                                          oldDisplayOrder ||
                                                                                                          0,
                                                                                                      createdAt:
                                                                                                          cfg.createdAt ||
                                                                                                          new Date().toISOString(),
                                                                                                      updatedAt:
                                                                                                          (
                                                                                                              newLinkage as any
                                                                                                          )
                                                                                                              .updatedAt ||
                                                                                                          new Date().toISOString(),
                                                                                                  }
                                                                                                : cfg,
                                                                                    );
                                                                                // Apply stable sorting to maintain display order
                                                                                return sortConfigsByDisplayOrder(
                                                                                    updated,
                                                                                );
                                                                            },
                                                                        );
                                                                    }
                                                                } catch (createError) {
                                                                    console.error(
                                                                        '❌ Failed to create new pipeline:',
                                                                        createError,
                                                                    );
                                                                    throw createError;
                                                                }
                                                            } else {
                                                                throw updateError;
                                                            }
                                                        }
                                                    } else {
                                                        console.warn(
                                                            '⚠️ Cannot update linkage - missing required IDs:',
                                                            {
                                                                pipelineName:
                                                                    pipelineNameEntity?.id,
                                                                details:
                                                                    detailsEntity?.id,
                                                                services:
                                                                    services.map(
                                                                        (
                                                                            s: any,
                                                                        ) =>
                                                                            s?.id,
                                                                    ),
                                                            },
                                                        );
                                                    }
                                                }
                                            } catch (apiError) {
                                                console.error(
                                                    '❌ Failed to update pipeline via API:',
                                                    apiError,
                                                );
                                            }
                                        } catch (error) {
                                            console.error(
                                                '❌ Failed to update pipeline:',
                                                error,
                                            );
                                            // Optionally revert the local state change on error
                                        }
                                    }}
                                    rows={processedConfigs.map<PipelineCanvasRow>(
                                        (a: any) => ({
                                            id: a.id || '',
                                            pipelineName:
                                                a.pipelineName ||
                                                a.enterpriseName ||
                                                a.enterprise ||
                                                '',
                                            details:
                                                a.details ||
                                                a.productName ||
                                                a.product ||
                                                '',
                                            service:
                                                a.service ||
                                                a.services ||
                                                a.serviceName ||
                                                '',
                                            status: a.status || '',
                                            lastUpdated: a.lastUpdated || '',
                                            createdBy: a.createdBy || '',
                                        }),
                                    )}
                                    onEdit={(id) => {
                                        const cfg = pipelineCanvass.find(
                                            (x) => x.id === id,
                                        );
                                        if (cfg) {
                                            setEditingConfig(cfg);
                                            setShowCreateForm(true);
                                        }
                                    }}
                                    onDelete={(id) => {
                                        // Trigger the delete confirmation flow
                                        startRowCompressionAnimation(id);
                                    }}
                                    visibleColumns={visibleCols}
                                    highlightQuery={searchTerm}
                                    groupByExternal={groupByProp}
                                    onShowAllColumns={showAllColumns}
                                    onAddNewRow={handleAddNewRow}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Navigation Warning Modal */}
            {showNavigationWarning && (
                <div className='fixed inset-0 z-50 overflow-y-auto'>
                    <div className='flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0'>
                        <div
                            className='fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity'
                            onClick={() => setShowNavigationWarning(false)}
                        ></div>

                        <div className='relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6'>
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
                                            d='M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z'
                                        />
                                    </svg>
                                </div>
                                <div className='mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left'>
                                    <h3 className='text-base font-semibold leading-6 text-gray-900'>
                                        Incomplete Pipeline Canvass
                                    </h3>
                                    <div className='mt-2'>
                                        <p className='text-sm text-gray-500'>
                                            You have {incompleteRows.length}{' '}
                                            incomplete enterprise configuration
                                            {incompleteRows.length > 1
                                                ? 's'
                                                : ''}{' '}
                                            with missing mandatory fields. These
                                            records won&apos;t be saved unless
                                            you complete all required fields
                                            (Enterprise, Product, and Services).
                                        </p>
                                        <p className='text-sm text-gray-500 mt-2'>
                                            Do you want to continue and lose
                                            these changes?
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className='mt-5 sm:mt-4 sm:flex sm:flex-row-reverse'>
                                <button
                                    type='button'
                                    className='inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto'
                                    onClick={() => {
                                        setShowNavigationWarning(false);
                                        if (pendingNavigation) {
                                            pendingNavigation();
                                            setPendingNavigation(null);
                                        }
                                    }}
                                >
                                    Continue & Lose Changes
                                </button>
                                <button
                                    type='button'
                                    className='mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto'
                                    onClick={() => {
                                        setShowNavigationWarning(false);
                                        setPendingNavigation(null);
                                    }}
                                >
                                    Stay & Complete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
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
                                // Force re-render by updating table version
                                setTableVersion((prev) => prev + 1);
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
                                        // Force re-render by updating table version
                                        setTableVersion((prev) => prev + 1);
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
                                            Are you sure you want to delete this
                                            enterprise configuration?
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
        </div>
    );
}
