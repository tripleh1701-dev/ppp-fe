'use client';

import {useEffect, useMemo, useRef, useState, useCallback} from 'react';
import {useRouter} from 'next/navigation';
import ConfirmModal from '@/components/ConfirmModal';
import {motion, AnimatePresence} from 'framer-motion';
import {
    PlusIcon,
    MagnifyingGlassIcon,
    ArrowsUpDownIcon,
    EyeSlashIcon,
    RectangleStackIcon,
    BookmarkIcon,
    ShieldCheckIcon,
    XMarkIcon,
    GlobeAltIcon,
} from '@heroicons/react/24/outline';
import EnvironmentsTable, {
    EnvironmentRow,
} from '@/components/EnvironmentsTable';

interface EnvironmentRecord {
    id: string;
    environmentName: string;
    details: string;
    deploymentType: 'Integration' | 'Extension';
    testConnectivity: 'Success' | 'Failed' | 'Pending' | 'Not Tested';
    status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
    url?: string;
    credentialName?: string;
    tags?: string[];
    environmentType?: 'Preproduction' | 'Production';
    accountId?: string;
    enterpriseId?: string;
    createdAt?: string;
    updatedAt?: string;
}

type ColumnType =
    | 'environmentName'
    | 'details'
    | 'deploymentType'
    | 'testConnectivity'
    | 'status';

export default function EnvironmentsPage() {
    const router = useRouter();
    const [environments, setEnvironments] = useState<EnvironmentRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const [showCreatePanel, setShowCreatePanel] = useState(false);
    const [editingEnvironment, setEditingEnvironment] =
        useState<EnvironmentRecord | null>(null);
    const [saveNotifications, setSaveNotifications] = useState<
        Array<{id: string; message: string; timestamp: number}>
    >([]);

    // Toolbar controls state
    const [searchTerm, setSearchTerm] = useState('');
    const [appliedSearchTerm, setAppliedSearchTerm] = useState('');
    const [filterVisible, setFilterVisible] = useState(false);
    const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
    const [sortOpen, setSortOpen] = useState(false);
    const [sortColumn, setSortColumn] = useState('');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | ''>('');
    const [hideOpen, setHideOpen] = useState(false);
    const [groupOpen, setGroupOpen] = useState(false);
    const [activeGroupLabel, setActiveGroupLabel] = useState<
        'None' | 'Environment Name' | 'Deployment Type' | 'Status'
    >('None');
    const [visibleCols, setVisibleCols] = useState<ColumnType[]>([
        'environmentName',
        'details',
        'deploymentType',
        'testConnectivity',
        'status',
    ]);

    // Refs for dropdowns
    const filterRef = useRef<HTMLDivElement>(null);
    const sortRef = useRef<HTMLDivElement>(null);
    const hideRef = useRef<HTMLDivElement>(null);
    const groupRef = useRef<HTMLDivElement>(null);

    // Modal states
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [pendingDeleteRowId, setPendingDeleteRowId] = useState<string | null>(
        null,
    );
    const [deletingRow, setDeletingRow] = useState(false);
    const [compressingRowId, setCompressingRowId] = useState<string | null>(
        null,
    );
    const [foldingRowId, setFoldingRowId] = useState<string | null>(null);

    // Function to show save notification
    const showBlueNotification = useCallback((message: string) => {
        const id = Date.now().toString();
        const notification = {
            id,
            message,
            timestamp: Date.now(),
        };

        setSaveNotifications((prev) => [...prev, notification]);

        setTimeout(() => {
            setSaveNotifications((prev) => prev.filter((n) => n.id !== id));
        }, 3000);
    }, []);

    // Load environments from API
    const loadEnvironments = useCallback(async () => {
        try {
            setLoading(true);
            const apiBase =
                process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

            const accountId =
                typeof window !== 'undefined'
                    ? window.localStorage.getItem('selectedAccountId')
                    : null;
            const enterpriseId =
                typeof window !== 'undefined'
                    ? window.localStorage.getItem('selectedEnterpriseId')
                    : null;

            const params = new URLSearchParams();
            if (accountId && accountId !== 'null') {
                params.append('accountId', accountId);
            }
            if (enterpriseId && enterpriseId !== 'null') {
                params.append('enterpriseId', enterpriseId);
            }

            const url = `${apiBase}/api/environments${
                params.toString() ? `?${params.toString()}` : ''
            }`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(
                    `Failed to fetch environments: ${response.status}`,
                );
            }

            const environmentsData = await response.json();
            setEnvironments(environmentsData);
        } catch (error) {
            console.error('Error loading environments:', error);
            setEnvironments([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadEnvironments();

        const handleAccountChange = () => {
            loadEnvironments();
        };

        window.addEventListener('accountChanged', handleAccountChange);
        window.addEventListener('enterpriseChanged', handleAccountChange);

        return () => {
            window.removeEventListener('accountChanged', handleAccountChange);
            window.removeEventListener(
                'enterpriseChanged',
                handleAccountChange,
            );
        };
    }, [loadEnvironments]);

    // Helper function to close all dialogs
    const closeAllDialogs = () => {
        setFilterVisible(false);
        setSortOpen(false);
        setHideOpen(false);
        setGroupOpen(false);
    };

    // Toggle dialog function
    const toggleDialog = (dialog: 'filter' | 'sort' | 'hide' | 'group') => {
        closeAllDialogs();
        switch (dialog) {
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

    // Click-outside behavior to close dialogs
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;

            if (!filterVisible && !sortOpen && !hideOpen && !groupOpen) {
                return;
            }

            const isOutsideFilter =
                filterRef.current && !filterRef.current.contains(target);
            const isOutsideSort =
                sortRef.current && !sortRef.current.contains(target);
            const isOutsideHide =
                hideRef.current && !hideRef.current.contains(target);
            const isOutsideGroup =
                groupRef.current && !groupRef.current.contains(target);

            if (
                isOutsideFilter &&
                isOutsideSort &&
                isOutsideHide &&
                isOutsideGroup
            ) {
                closeAllDialogs();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [filterVisible, sortOpen, hideOpen, groupOpen]);

    // Convert environments to table rows
    const tableRows: EnvironmentRow[] = useMemo(() => {
        let filteredEnvironments = environments;

        // Apply search filter
        if (appliedSearchTerm.trim()) {
            const lowerSearch = appliedSearchTerm.toLowerCase();
            filteredEnvironments = filteredEnvironments.filter(
            (env) =>
                env.environmentName.toLowerCase().includes(lowerSearch) ||
                env.details.toLowerCase().includes(lowerSearch) ||
                env.deploymentType.toLowerCase().includes(lowerSearch) ||
                env.status.toLowerCase().includes(lowerSearch),
        );
        }

        // Apply active filters
        if (activeFilters.status && activeFilters.status.length > 0) {
            filteredEnvironments = filteredEnvironments.filter((env) =>
                activeFilters.status.includes(env.status),
            );
        }
        if (
            activeFilters.deploymentType &&
            activeFilters.deploymentType.length > 0
        ) {
            filteredEnvironments = filteredEnvironments.filter((env) =>
                activeFilters.deploymentType.includes(env.deploymentType),
            );
        }
        if (
            activeFilters.testConnectivity &&
            activeFilters.testConnectivity.length > 0
        ) {
            filteredEnvironments = filteredEnvironments.filter((env) =>
                activeFilters.testConnectivity.includes(env.testConnectivity),
            );
        }

        return filteredEnvironments.map((env) => {
            // Format connectivity badge
            const connectivity = env.testConnectivity || 'Not Tested';
            const connectivityColors = {
                Success: '✅',
                Failed: '❌',
                Pending: '⏳',
                'Not Tested': '⚪',
            };
            const connectivityIcon =
                connectivityColors[
                    connectivity as keyof typeof connectivityColors
                ];

            // Format status badge
            const statusColors = {
                ACTIVE: '🟢',
                INACTIVE: '⚪',
                PENDING: '🟡',
            };
            const statusIcon =
                statusColors[env.status as keyof typeof statusColors];

            return {
                id: env.id,
                environmentName: env.environmentName || '',
                details: env.details || '',
                deploymentType: env.deploymentType || '',
                testConnectivity: `${connectivityIcon} ${connectivity}`,
                status: `${statusIcon} ${env.status}`,
            };
        });
    }, [environments, appliedSearchTerm, activeFilters]);

    // Handle delete
    const handleDelete = useCallback(
        async (id: string) => {
            try {
                const apiBase =
                    process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
                const response = await fetch(
                    `${apiBase}/api/environments/${id}`,
                    {
                        method: 'DELETE',
                    },
                );

                if (!response.ok) {
                    throw new Error('Failed to delete environment');
                }

                showBlueNotification('Environment deleted successfully');
                await loadEnvironments();
            } catch (error) {
                console.error('Error deleting environment:', error);
                showBlueNotification('Failed to delete environment');
            } finally {
                setPendingDeleteId(null);
                setShowDeleteConfirmation(false);
                setPendingDeleteRowId(null);
            }
        },
        [loadEnvironments, showBlueNotification],
    );

    // Start row compression animation
    const startRowCompressionAnimation = (rowId: string) => {
        setPendingDeleteRowId(rowId);
        setCompressingRowId(rowId);

        setTimeout(() => {
            setCompressingRowId(null);
            setFoldingRowId(rowId);

            setTimeout(() => {
                setFoldingRowId(null);
                setShowDeleteConfirmation(true);
            }, 400);
        }, 500);
    };

    // Handle delete confirm
    const handleDeleteConfirm = async () => {
        if (!pendingDeleteRowId) return;

        setDeletingRow(true);

        setTimeout(async () => {
            await handleDelete(pendingDeleteRowId);
            setDeletingRow(false);
        }, 800);
    };

    // Handle delete cancel
    const handleDeleteCancel = () => {
        setShowDeleteConfirmation(false);
        setPendingDeleteRowId(null);
    };

    // Handle add new row
    const handleAddNewRow = () => {
        setEditingEnvironment(null);
        setShowCreatePanel(true);
    };

    // Handle edit
    const handleEdit = useCallback(
        (id: string) => {
            const env = environments.find((e) => e.id === id);
            if (env) {
                setEditingEnvironment(env);
                setShowCreatePanel(true);
            }
        },
        [environments],
    );

    // Handle update field
    const handleUpdateField = useCallback(
        async (rowId: string, field: string, value: any) => {
            try {
                const apiBase =
                    process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

                const environment = environments.find((e) => e.id === rowId);
                if (!environment) return;

                // Direct field mapping (fields match EnvironmentRecord)
                const updatedEnvironment = {
                    ...environment,
                    [field]: value,
                };

                const response = await fetch(
                    `${apiBase}/api/environments/${rowId}`,
                    {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(updatedEnvironment),
                    },
                );

                if (!response.ok) {
                    throw new Error('Failed to update environment');
                }

                await loadEnvironments();
                showBlueNotification('Environment updated successfully');
            } catch (error) {
                console.error('Error updating environment:', error);
                showBlueNotification('Failed to update environment');
            }
        },
        [environments, loadEnvironments, showBlueNotification],
    );

    // Handle clear filters
    const handleClearFilters = () => {
        setActiveFilters({});
    };

    // Handle apply filters
    const handleApplyFilters = () => {
        setFilterVisible(false);
    };

    // Handle sort
    const handleSort = (column: string, direction: 'asc' | 'desc') => {
        setSortColumn(column);
        setSortDirection(direction);
    };

    // Handle clear sort
    const handleClearSort = () => {
        setSortColumn('');
        setSortDirection('');
        // Dispatch event to clear table sorting
        window.dispatchEvent(new Event('clearTableSorting'));
    };

    // Listen for sort changes from the table
    useEffect(() => {
        const handleTableSortChange = (event: any) => {
            const {column, direction} = event.detail;
            setSortColumn(column);
            setSortDirection(direction);
        };

        document.addEventListener(
            'enterpriseTableSortChange',
            handleTableSortChange,
        );

        return () => {
            document.removeEventListener(
                'enterpriseTableSortChange',
                handleTableSortChange,
            );
        };
    }, []);

    // Handle show/hide columns
    const toggleColumn = (col: ColumnType) => {
        setVisibleCols((prev) =>
            prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col],
        );
    };

    const showAllColumns = () => {
        setVisibleCols([
            'environmentName',
            'details',
            'deploymentType',
            'testConnectivity',
            'status',
        ]);
    };

    // Handle group by
    const handleGroupBy = (
        group: 'None' | 'Environment Name' | 'Deployment Type' | 'Status',
    ) => {
        setActiveGroupLabel(group);
        setGroupOpen(false);
    };

    // Map group label to table field
    const groupByProp =
        activeGroupLabel === 'None'
            ? 'none'
            : activeGroupLabel === 'Environment Name'
            ? 'environmentName'
            : activeGroupLabel === 'Deployment Type'
            ? 'deploymentType'
            : activeGroupLabel === 'Status'
            ? 'status'
            : 'none';

    // Handle save
    const handleSave = async () => {
        showBlueNotification('All changes have been auto-saved');
    };

    return (
        <div className='flex flex-col h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'>
            {/* Save Notifications */}
            <AnimatePresence>
                {saveNotifications.map((notification) => (
                    <motion.div
                        key={notification.id}
                        initial={{opacity: 0, y: -50, x: '-50%'}}
                        animate={{opacity: 1, y: 0, x: '-50%'}}
                        exit={{opacity: 0, y: -50, x: '-50%'}}
                        className='fixed top-4 left-1/2 transform z-50 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2'
                    >
                        <ShieldCheckIcon className='w-5 h-5' />
                        <span className='font-medium'>
                            {notification.message}
                        </span>
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Header */}
            <div className='bg-white border-b border-slate-200 px-6 py-2'>
                <div className='flex items-start justify-between'>
                    <div>
                        <h1 className='text-3xl font-bold text-slate-900'>
                            Environments
                        </h1>
                        <p className='mt-2 text-sm text-slate-600 leading-relaxed'>
                            Manage and monitor your deployment environments
                            across integration and extension systems.
                        </p>
                    </div>
                </div>
            </div>

            {/* Toolbar Section */}
            <div className='bg-white border-b border-slate-200 px-6 py-3'>
                <div className='flex items-center justify-between gap-3'>
                    <div className='flex items-center gap-3 flex-wrap'>
                        {/* Create New Environment Button */}
                        <button
                            onClick={handleAddNewRow}
                            disabled={loading}
                            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-md shadow-sm ${
                                loading
                                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                        >
                            <PlusIcon className='h-4 w-4' />
                            <span className='text-sm'>
                                {loading
                                    ? 'Loading...'
                                    : 'Create New Environment'}
                            </span>
                        </button>

                        {/* Search Input */}
                        <div className='flex items-center'>
                            <div className='relative w-60'>
                                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                                    <MagnifyingGlassIcon className='h-5 w-5 text-gray-400' />
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
                                    className='block w-full pl-10 pr-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-sm'
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
                                        <XMarkIcon className='h-4 w-4' />
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
                                className={`group relative flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-medium transition-all duration-300 ${
                                    filterVisible ||
                                    Object.keys(activeFilters).length > 0
                                        ? 'border-purple-300 bg-purple-50 text-purple-600 shadow-purple-200 shadow-lg'
                                        : 'border-blue-200 bg-white text-gray-600 hover:border-purple-200 hover:bg-purple-50 hover:text-purple-600'
                                }`}
                            >
                                <svg
                                    className='w-4 h-4'
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
                                    <div className='absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full'></div>
                                )}
                            </button>

                            {/* Filter Dropdown */}
                            {filterVisible && (
                                <div className='absolute top-full mt-2 left-0 bg-white shadow-xl border border-blue-200 rounded-lg z-50 min-w-80'>
                                    <div className='flex items-center justify-between px-3 py-1.5 border-b border-blue-200'>
                                        <div className='text-xs font-semibold'>
                                            Filters
                                        </div>
                                        <div className='flex items-center gap-2'>
                                            <button
                                                onClick={handleClearFilters}
                                                className='text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded bg-blue-50 hover:bg-blue-100'
                                            >
                                                Clear All
                                            </button>
                                            <button
                                                onClick={handleApplyFilters}
                                                className='text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded bg-blue-50 hover:bg-blue-100'
                                            >
                                                Apply
                                            </button>
                                        </div>
                                    </div>
                                    <div className='p-3 space-y-3 max-h-96 overflow-y-auto'>
                                        {/* Status Filter */}
                                        <div>
                                            <div className='text-xs font-medium mb-1'>
                                                Status
                                            </div>
                                            <div className='space-y-1'>
                                                {[
                                                    'ACTIVE',
                                                    'INACTIVE',
                                                    'PENDING',
                                                ].map((status) => (
                                                    <label
                                                        key={status}
                                                        className='flex items-center gap-2 text-sm'
                                                    >
                                                        <input
                                                            type='checkbox'
                                                            checked={
                                                                activeFilters.status?.includes(
                                                                    status,
                                                                ) || false
                                                            }
                                                            onChange={(e) => {
                                                                const checked =
                                                                    e.target
                                                                        .checked;
                                                                setActiveFilters(
                                                                    (prev) => {
                                                                        const current =
                                                                            prev.status ||
                                                                            [];
                                                                        return {
                                                                            ...prev,
                                                                            status: checked
                                                                                ? [
                                                                                      ...current,
                                                                                      status,
                                                                                  ]
                                                                                : current.filter(
                                                                                      (
                                                                                          s: string,
                                                                                      ) =>
                                                                                          s !==
                                                                                          status,
                                                                                  ),
                                                                        };
                                                                    },
                                                                );
                                                            }}
                                                            className='rounded'
                                                        />
                                                        {status}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Deployment Type Filter */}
                                        <div>
                                            <div className='text-xs font-medium mb-1'>
                                                Deployment Type
                                            </div>
                                            <div className='space-y-1'>
                                                {[
                                                    'Integration',
                                                    'Extension',
                                                ].map((type) => (
                                                    <label
                                                        key={type}
                                                        className='flex items-center gap-2 text-sm'
                                                    >
                                                        <input
                                                            type='checkbox'
                                                            checked={
                                                                activeFilters.deploymentType?.includes(
                                                                    type,
                                                                ) || false
                                                            }
                                                            onChange={(e) => {
                                                                const checked =
                                                                    e.target
                                                                        .checked;
                                                                setActiveFilters(
                                                                    (prev) => {
                                                                        const current =
                                                                            prev.deploymentType ||
                                                                            [];
                                                                        return {
                                                                            ...prev,
                                                                            deploymentType:
                                                                                checked
                                                                                    ? [
                                                                                          ...current,
                                                                                          type,
                                                                                      ]
                                                                                    : current.filter(
                                                                                          (
                                                                                              t: string,
                                                                                          ) =>
                                                                                              t !==
                                                                                              type,
                                                                                      ),
                                                                        };
                                                                    },
                                                                );
                                                            }}
                                                            className='rounded'
                                                        />
                                                        {type}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Test Connectivity Filter */}
                                        <div>
                                            <div className='text-xs font-medium mb-1'>
                                                Test Connectivity
                                            </div>
                                            <div className='space-y-1'>
                                                {[
                                                    'Success',
                                                    'Failed',
                                                    'Pending',
                                                    'Not Tested',
                                                ].map((status) => (
                                                    <label
                                                        key={status}
                                                        className='flex items-center gap-2 text-sm'
                                                    >
                                                        <input
                                                            type='checkbox'
                                                            checked={
                                                                activeFilters.testConnectivity?.includes(
                                                                    status,
                                                                ) || false
                                                            }
                                                            onChange={(e) => {
                                                                const checked =
                                                                    e.target
                                                                        .checked;
                                                                setActiveFilters(
                                                                    (prev) => {
                                                                        const current =
                                                                            prev.testConnectivity ||
                                                                            [];
                                                                        return {
                                                                            ...prev,
                                                                            testConnectivity:
                                                                                checked
                                                                                    ? [
                                                                                          ...current,
                                                                                          status,
                                                                                      ]
                                                                                    : current.filter(
                                                                                          (
                                                                                              s: string,
                                                                                          ) =>
                                                                                              s !==
                                                                                              status,
                                                                                      ),
                                                                        };
                                                                    },
                                                                );
                                                            }}
                                                            className='rounded'
                                                        />
                                                        {status}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                    </div>

                        {/* Sort Button */}
                        <div ref={sortRef} className='relative'>
                            <button
                                onClick={() =>
                                    sortOpen
                                        ? closeAllDialogs()
                                        : toggleDialog('sort')
                                }
                                className={`group flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-medium transition-all duration-300 ${
                                    sortOpen || sortColumn
                                        ? 'border-green-300 bg-green-50 text-green-600 shadow-green-200 shadow-lg'
                                        : 'border-blue-200 bg-white text-gray-600 hover:border-green-200 hover:bg-green-50 hover:text-green-600'
                                }`}
                            >
                                <ArrowsUpDownIcon className='w-4 h-4' />
                                <span className='text-sm'>Sort</span>
                                {sortColumn && (
                                    <div className='absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full'></div>
                                )}
                            </button>

                            {/* Sort Dropdown */}
                            {sortOpen && (
                                <div className='absolute top-full mt-2 left-0 bg-white shadow-xl border border-blue-200 rounded-lg z-50 w-64'>
                                    <div className='flex items-center justify-between px-3 py-1.5 border-b border-blue-200'>
                                        <div className='text-xs font-semibold'>
                                            Sort
                                        </div>
                                        <button
                                            onClick={handleClearSort}
                                            className='text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded bg-blue-50 hover:bg-blue-100'
                                        >
                                            Clear
                                        </button>
                                    </div>
                                    <div className='p-3 space-y-2'>
                                        {[
                                            {
                                                label: 'Environment Name',
                                                value: 'environmentName',
                                            },
                                            {
                                                label: 'Details',
                                                value: 'details',
                                            },
                                            {
                                                label: 'Deployment Type',
                                                value: 'deploymentType',
                                            },
                                            {
                                                label: 'Status',
                                                value: 'status',
                                            },
                                        ].map((option) => (
                                            <div
                                                key={option.value}
                                                className='flex items-center justify-between'
                                            >
                                                <span className='text-sm'>
                                                    {option.label}
                                                </span>
                                                <div className='flex gap-1'>
                                                    <button
                                                        onClick={() =>
                                                            handleSort(
                                                                option.value,
                                                                'asc',
                                                            )
                                                        }
                                                        className={`px-2 py-1 text-xs rounded ${
                                                            sortColumn ===
                                                                option.value &&
                                                            sortDirection ===
                                                                'asc'
                                                                ? 'bg-green-500 text-white'
                                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                        }`}
                                                    >
                                                        ↑
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleSort(
                                                                option.value,
                                                                'desc',
                                                            )
                                                        }
                                                        className={`px-2 py-1 text-xs rounded ${
                                                            sortColumn ===
                                                                option.value &&
                                                            sortDirection ===
                                                                'desc'
                                                                ? 'bg-green-500 text-white'
                                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                        }`}
                                                    >
                                                        ↓
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Show/Hide Button */}
                        <div ref={hideRef} className='relative'>
                            <button
                                onClick={() =>
                                    hideOpen
                                        ? closeAllDialogs()
                                        : toggleDialog('hide')
                                }
                                className={`group flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-medium transition-all duration-300 ${
                                    hideOpen
                                        ? 'border-orange-300 bg-orange-50 text-orange-600 shadow-orange-200 shadow-lg'
                                        : 'border-blue-200 bg-white text-gray-600 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600'
                                }`}
                            >
                                <EyeSlashIcon className='w-4 h-4' />
                                <span className='text-sm'>Show/Hide</span>
                            </button>

                            {/* Show/Hide Dropdown */}
                            {hideOpen && (
                                <div className='absolute top-full mt-2 left-0 bg-white shadow-xl border border-blue-200 rounded-lg z-50 w-64'>
                                    <div className='flex items-center justify-between px-3 py-1.5 border-b border-blue-200'>
                                        <div className='text-xs font-semibold'>
                                            Show/Hide Columns
                                        </div>
                                    </div>
                                    <div className='p-3 space-y-2'>
                                        {[
                                            {
                                                label: 'Environment Name',
                                                value: 'environmentName' as ColumnType,
                                            },
                                            {
                                                label: 'Details',
                                                value: 'details' as ColumnType,
                                            },
                                            {
                                                label: 'Deployment Type',
                                                value: 'deploymentType' as ColumnType,
                                            },
                                            {
                                                label: 'Test Connectivity',
                                                value: 'testConnectivity' as ColumnType,
                                            },
                                            {
                                                label: 'Status',
                                                value: 'status' as ColumnType,
                                            },
                                        ].map((option) => (
                                            <label
                                                key={option.value}
                                                className='flex items-center gap-2 text-sm cursor-pointer'
                        >
                            <input
                                                    type='checkbox'
                                                    checked={visibleCols.includes(
                                                        option.value,
                                                    )}
                                                    onChange={() =>
                                                        toggleColumn(
                                                            option.value,
                                                        )
                                                    }
                                                    className='rounded'
                                                />
                                                {option.label}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Group by Button */}
                        <div ref={groupRef} className='relative'>
                            <button
                                onClick={() =>
                                    groupOpen
                                        ? closeAllDialogs()
                                        : toggleDialog('group')
                                }
                                className={`group flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-medium transition-all duration-300 ${
                                    groupOpen || activeGroupLabel !== 'None'
                                        ? 'border-pink-300 bg-pink-50 text-pink-600 shadow-pink-200 shadow-lg'
                                        : 'border-blue-200 bg-white text-gray-600 hover:border-pink-200 hover:bg-pink-50 hover:text-pink-600'
                                }`}
                            >
                                <RectangleStackIcon className='w-4 h-4' />
                                <span className='text-sm'>Group by</span>
                                {activeGroupLabel !== 'None' && (
                                    <div className='absolute -top-1 -right-1 w-3 h-3 bg-pink-500 rounded-full'></div>
                                )}
                            </button>

                            {/* Group by Dropdown */}
                            {groupOpen && (
                                <div className='absolute top-full mt-2 left-0 bg-white shadow-xl border border-blue-200 rounded-lg z-50 w-64'>
                                    <div className='px-3 py-1.5 border-b border-blue-200'>
                                        <div className='text-xs font-semibold'>
                                            Group By
                                        </div>
                                    </div>
                                    <div className='p-2'>
                                        {[
                                            'None',
                                            'Environment Name',
                                            'Deployment Type',
                                            'Status',
                                        ].map((option) => (
                                            <button
                                                key={option}
                                                onClick={() =>
                                                    handleGroupBy(
                                                        option as typeof activeGroupLabel,
                                                    )
                                                }
                                                className={`w-full text-left px-3 py-2 text-sm rounded ${
                                                    activeGroupLabel === option
                                                        ? 'bg-pink-500 text-white'
                                                        : 'hover:bg-gray-100'
                                                }`}
                                            >
                                                {option}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Save Button */}
                        <button
                            onClick={handleSave}
                            className='flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium shadow-sm'
                        >
                            <BookmarkIcon className='w-4 h-4' />
                            <span className='text-sm'>Save</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className='flex-1 overflow-hidden'>
                {loading ? (
                    <div className='flex items-center justify-center h-full'>
                        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600' />
                    </div>
                ) : environments.length === 0 ? (
                    <div className='flex items-start justify-center h-full pt-20'>
                        <div className='text-center max-w-md'>
                            <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 mb-4'>
                                <GlobeAltIcon className='h-8 w-8 text-slate-400' />
                            </div>
                            <h3 className='text-lg font-semibold text-slate-900 mb-2'>
                                No Environments
                            </h3>
                            <p className='text-sm text-slate-500 mb-6'>
                                Get started by creating your first deployment
                                environment. Environments help you manage and
                                monitor your integration and extension systems.
                            </p>
                            <button
                                onClick={() => setShowCreatePanel(true)}
                                className='inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors'
                            >
                                <svg
                                    className='w-5 h-5'
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
                                Create New Environment
                            </button>
                        </div>
                    </div>
                ) : (
                    <EnvironmentsTable
                        rows={tableRows}
                        onEdit={handleEdit}
                        onDelete={startRowCompressionAnimation}
                        onUpdateField={handleUpdateField}
                        visibleColumns={visibleCols}
                        highlightQuery={appliedSearchTerm}
                        groupByExternal={groupByProp as any}
                        onShowAllColumns={showAllColumns}
                        onAddNewRow={handleAddNewRow}
                        compressingRowId={compressingRowId}
                        foldingRowId={foldingRowId}
                        externalSortColumn={sortColumn}
                        externalSortDirection={sortDirection as 'asc' | 'desc'}
                    />
                )}
            </div>

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
                                            environment?
                                        </p>
                                        <p className='text-sm text-gray-500 mt-2'>
                                            This action cannot be undone.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className='mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-2'>
                                <button
                                    type='button'
                                    onClick={handleDeleteConfirm}
                                    disabled={deletingRow}
                                    className='inline-flex w-full justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:bg-red-400 sm:w-auto'
                                >
                                    {deletingRow ? (
                                        <span className='flex items-center gap-2'>
                                            <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white' />
                                            Deleting...
                                        </span>
                                    ) : (
                                        'Delete'
                                    )}
                                </button>
                                <button
                                    type='button'
                                    onClick={handleDeleteCancel}
                                    disabled={deletingRow}
                                    className='mt-3 inline-flex w-full justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:bg-gray-100 sm:mt-0 sm:w-auto'
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </div>
            )}

            {/* Create/Edit Panel - Keep existing implementation */}
                <EnvironmentSlidingPanel
                    isOpen={showCreatePanel}
                onClose={() => {
                    setShowCreatePanel(false);
                    setEditingEnvironment(null);
                }}
                onSave={() => {
                    loadEnvironments();
                    setShowCreatePanel(false);
                    setEditingEnvironment(null);
                }}
                    editingEnvironment={editingEnvironment}
                />
        </div>
    );
}

// Environment Sliding Panel Component - Keep existing implementation from original file
interface EnvironmentSlidingPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    editingEnvironment: EnvironmentRecord | null;
}

function EnvironmentSlidingPanel({
    isOpen,
    onClose,
    onSave,
    editingEnvironment,
}: EnvironmentSlidingPanelProps) {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState({
        deploymentType: editingEnvironment?.deploymentType || 'Integration',
        name: editingEnvironment?.environmentName || '',
        tags: editingEnvironment?.tags || [],
        environmentType: editingEnvironment?.environmentType || '',
        url: editingEnvironment?.url || '',
        credentialName: editingEnvironment?.credentialName || '',
        details: editingEnvironment?.details || '',
    });
    const [tagInput, setTagInput] = useState('');
    const [testingConnection, setTestingConnection] = useState(false);
    const [connectionResult, setConnectionResult] = useState<
        'success' | 'failed' | null
    >(null);

    // Get account and enterprise context from localStorage
    const [accountId, setAccountId] = useState<string | null>(null);
    const [accountName, setAccountName] = useState<string | null>(null);
    const [enterpriseId, setEnterpriseId] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const accId = window.localStorage.getItem('selectedAccountId');
            const accName = window.localStorage.getItem('selectedAccountName');
            const entId = window.localStorage.getItem('selectedEnterpriseId');
            setAccountId(accId);
            setAccountName(accName);
            setEnterpriseId(entId);
        }
    }, []);

    useEffect(() => {
        if (editingEnvironment) {
            setFormData({
                deploymentType:
                    editingEnvironment.deploymentType || 'Integration',
                name: editingEnvironment.environmentName || '',
                tags: editingEnvironment.tags || [],
                environmentType: editingEnvironment.environmentType || '',
                url: editingEnvironment.url || '',
                credentialName: editingEnvironment.credentialName || '',
                details: editingEnvironment.details || '',
            });
        } else {
            setFormData({
                deploymentType: 'Integration',
                name: '',
                tags: [],
                environmentType: '',
                url: '',
                credentialName: '',
                details: '',
            });
        }
        setCurrentStep(0);
        setConnectionResult(null);
    }, [editingEnvironment, isOpen]);

    const steps = [
        {title: 'Overview', label: 'STEP 1'},
        {title: 'Details', label: 'STEP 2'},
        {title: 'Credentials', label: 'STEP 3'},
        {title: 'Connection Test', label: 'STEP 4'},
    ];

    const handleInputChange = (field: string, value: any) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleAddTag = () => {
        if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
            setFormData((prev) => ({
                ...prev,
                tags: [...prev.tags, tagInput.trim()],
            }));
            setTagInput('');
        }
    };

    const handleRemoveTag = (tag: string) => {
        setFormData((prev) => ({
            ...prev,
            tags: prev.tags.filter((t) => t !== tag),
        }));
    };

    const handleTestConnection = async () => {
        setTestingConnection(true);
        setTimeout(() => {
            setConnectionResult('success');
            setTestingConnection(false);
        }, 2000);
    };

    const handleSaveAndContinue = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleFinish = async () => {
        try {
            const apiBase =
                process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

            // Determine the correct account name based on selection
            let finalAccountName = accountName;
            let finalAccountId = accountId;

            console.log('📋 Account selection:', {
                accountName,
                accountId,
                enterpriseId,
            });

            // If account is "Systiva" or "No account selected" or null, use SYSTIVA
            if (
                !accountName ||
                accountName === 'Systiva' ||
                accountName === 'No account selected'
            ) {
                finalAccountName = 'SYSTIVA';
                finalAccountId = 'systiva';
                console.log('✅ Using default SYSTIVA account');
            } else {
                console.log(`✅ Using selected account: ${finalAccountName}`);
            }

            const payload = {
                environmentName: formData.name,
                details: formData.details,
                deploymentType: formData.deploymentType,
                testConnectivity:
                    connectionResult === 'success' ? 'Success' : 'Failed',
                status: 'ACTIVE',
                url: formData.url,
                credentialName: formData.credentialName,
                tags: formData.tags,
                environmentType: formData.environmentType,
                accountId: finalAccountId,
                accountName: finalAccountName,
                enterpriseId: enterpriseId,
            };

            const url = editingEnvironment
                ? `${apiBase}/api/environments/${editingEnvironment.id}`
                : `${apiBase}/api/environments`;

            const response = await fetch(url, {
                method: editingEnvironment ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error('Failed to save environment');
            }

            onSave();
        } catch (error) {
            console.error('Error saving environment:', error);
        }
    };

    if (!isOpen) return null;

    const stepTitles = [
        'Overview',
        'Details',
        'Credentials',
        'Connection Test',
    ];
    const stepDescriptions = [
        'Basic connector information and settings',
        'Environment configuration and setup',
        'Authentication and security settings',
        'Verify and test your connection',
    ];

    return (
        <>
            <div
                className='fixed inset-0 bg-black bg-opacity-50 z-40'
                onClick={onClose}
            />
            <div className='fixed inset-y-0 right-0 w-[650px] bg-white shadow-2xl z-50 flex'>
                {/* Left Sidebar - Dark Blue */}
                <div
                    className='w-[280px] relative flex flex-col'
                    style={{
                        backgroundImage: 'url(/images/logos/sidebar.png)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                    }}
                >
                    {/* Environment Title */}
                    <div className='px-6 py-5 border-b border-white/10'>
                        <h2 className='text-lg font-semibold text-white'>
                            New Environment
                        </h2>
                        <p className='text-xs text-slate-300 mt-1'>
                            Configure deployment settings
                        </p>
                    </div>

                    {/* Step Navigation */}
                    <div className='flex-1 px-6 py-6'>
                        <div className='space-y-1'>
                            {steps.map((step, index) => (
                                <div key={index} className='flex items-start'>
                                    <div className='flex flex-col items-center mr-4'>
                                        {/* Circle */}
                                        <div
                                            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all ${
                                                index === currentStep
                                                    ? 'bg-[#2563eb] border-[#2563eb] text-white'
                                                    : index < currentStep
                                                    ? 'bg-[#1e40af] border-[#1e40af] text-white'
                                                    : 'bg-transparent border-[#374469] text-[#6b7592]'
                                            }`}
                                        >
                                            {index + 1}
                                        </div>
                                        {/* Connecting Line */}
                                        {index < steps.length - 1 && (
                                            <div
                                                className={`w-0.5 h-12 mt-1 ${
                                                    index < currentStep
                                                        ? 'bg-[#1e40af]'
                                                        : 'bg-[#374469]'
                                                }`}
                                            />
                                        )}
                                            </div>
                                    <div className='pt-2 flex-1'>
                                        <div
                                            className={`text-xs font-semibold mb-1 ${
                                                index === currentStep
                                                    ? 'text-[#60a5fa]'
                                                    : 'text-[#6b7592]'
                                            }`}
                                        >
                                            {step.label}
                                        </div>
                                        <div
                                            className={`text-sm font-medium ${
                                                    index === currentStep
                                                        ? 'text-white'
                                                        : index < currentStep
                                                    ? 'text-[#94a3b8]'
                                                    : 'text-[#6b7592]'
                                                }`}
                                            >
                                            {step.title}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Content Area - White */}
                <div className='flex-1 flex flex-col'>
                    {/* Close Button */}
                    <div className='absolute top-6 right-6 z-10'>
                            <button
                                onClick={onClose}
                                className='p-2 hover:bg-slate-100 rounded-lg transition-colors'
                            >
                                <XMarkIcon className='w-6 h-6 text-slate-600' />
                            </button>
                    </div>

                    {/* Content */}
                    <div className='flex-1 overflow-y-auto px-6 py-6'>
                        {/* Step Header */}
                        <div className='mb-6'>
                            <h1 className='text-2xl font-semibold text-slate-900 mb-1'>
                                {stepTitles[currentStep]}
                            </h1>
                            <p className='text-slate-600 text-sm'>
                                {stepDescriptions[currentStep]}
                            </p>
                        </div>

                        {/* Step 1: Overview */}
                        {currentStep === 0 && (
                            <div className='space-y-4'>
                                <div>
                                    <label className='flex items-center gap-2 text-sm font-medium text-slate-900 mb-3'>
                                        Name{' '}
                                        <span className='text-red-500'>*</span>
                                        <svg
                                            className='w-4 h-4 text-slate-400'
                                            fill='none'
                                            stroke='currentColor'
                                            viewBox='0 0 24 24'
                                        >
                                            <path
                                                strokeLinecap='round'
                                                strokeLinejoin='round'
                                                strokeWidth={2}
                                                d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                                            />
                                        </svg>
                                    </label>
                                    <input
                                        type='text'
                                        value={formData.name}
                                        onChange={(e) =>
                                            handleInputChange(
                                                'name',
                                                e.target.value,
                                            )
                                        }
                                        className='w-full px-4 py-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm'
                                        placeholder=''
                                    />
                                </div>

                                <div>
                                    <label className='flex items-center gap-2 text-sm font-medium text-slate-900 mb-3'>
                                        Description
                                        <svg
                                            className='w-4 h-4 text-slate-400'
                                            fill='none'
                                            stroke='currentColor'
                                            viewBox='0 0 24 24'
                                        >
                                            <path
                                                strokeLinecap='round'
                                                strokeLinejoin='round'
                                                strokeWidth={2}
                                                d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                                            />
                                        </svg>
                                    </label>
                                    <textarea
                                        value={formData.details}
                                        onChange={(e) =>
                                            handleInputChange(
                                                'details',
                                                e.target.value,
                                            )
                                        }
                                        rows={4}
                                        className='w-full px-4 py-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm'
                                        placeholder=''
                                    />
                                </div>

                                <div>
                                    <label className='flex items-center gap-2 text-sm font-medium text-slate-900 mb-3'>
                                        Tags
                                        <svg
                                            className='w-4 h-4 text-slate-400'
                                            fill='none'
                                            stroke='currentColor'
                                            viewBox='0 0 24 24'
                                        >
                                            <path
                                                strokeLinecap='round'
                                                strokeLinejoin='round'
                                                strokeWidth={2}
                                                d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                                            />
                                        </svg>
                                    </label>
                                    <div className='flex gap-2 mb-3'>
                                    <input
                                        type='text'
                                        value={tagInput}
                                        onChange={(e) =>
                                            setTagInput(e.target.value)
                                        }
                                            onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddTag();
                                            }
                                        }}
                                            className='flex-1 px-4 py-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm'
                                            placeholder=''
                                        />
                                        <button
                                            onClick={handleAddTag}
                                            className='px-6 py-3 bg-slate-200 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-300 transition-colors'
                                        >
                                            Add
                                        </button>
                                    </div>
                                    <div className='flex flex-wrap gap-2'>
                                        {formData.tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className='inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded text-sm'
                                            >
                                                {tag}
                                                <button
                                                    onClick={() =>
                                                        handleRemoveTag(tag)
                                                    }
                                                    className='hover:text-blue-900'
                                                >
                                                    <XMarkIcon className='w-3.5 h-3.5' />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Environment */}
                        {currentStep === 1 && (
                            <div className='space-y-4'>
                                <div>
                                    <label className='block text-sm font-medium text-slate-700 mb-2'>
                                        Environment Type
                                    </label>
                                    <div className='grid grid-cols-2 gap-4'>
                                        {['Preproduction', 'Production'].map(
                                            (type) => (
                                                <button
                                                    key={type}
                                                    onClick={() =>
                                                        handleInputChange(
                                                            'environmentType',
                                                            type,
                                                        )
                                                    }
                                                    className={`relative px-6 py-8 border-2 rounded-lg transition-all ${
                                                        formData.environmentType ===
                                                        type
                                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                            : 'border-slate-300 hover:border-slate-400'
                                                    }`}
                                                >
                                                    {formData.environmentType ===
                                                        type && (
                                                        <div className='absolute top-2 right-2'>
                                                            <svg
                                                                className='w-5 h-5 text-blue-600'
                                                                fill='currentColor'
                                                                viewBox='0 0 20 20'
                                                            >
                                                                <path
                                                                    fillRule='evenodd'
                                                                    d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                                                                    clipRule='evenodd'
                                                                />
                                                            </svg>
                                                        </div>
                                                    )}
                                                    <div className='text-center'>
                                                        <div className='font-semibold text-slate-900 mb-1'>
                                                            {type}
                                                        </div>
                                                        <div className='text-xs text-slate-600'>
                                                            {type ===
                                                            'Preproduction'
                                                                ? 'Testing & staging'
                                                                : 'Live production'}
                                                        </div>
                                                    </div>
                                                </button>
                                            ),
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className='block text-sm font-medium text-slate-700 mb-2'>
                                        URL
                                    </label>
                                    <input
                                        type='text'
                                        value={formData.url}
                                        onChange={(e) =>
                                            handleInputChange(
                                                'url',
                                                e.target.value,
                                            )
                                        }
                                        className='w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                        placeholder='https://example.com'
                                    />
                                </div>
                            </div>
                        )}

                        {/* Step 3: Credentials */}
                        {currentStep === 2 && (
                            <div className='space-y-4'>
                                <div>
                                    <label className='block text-sm font-medium text-slate-700 mb-2'>
                                        Credential Name
                                    </label>
                                    <div className='flex gap-2'>
                                        <input
                                            type='text'
                                            value={formData.credentialName}
                                            onChange={(e) =>
                                                handleInputChange(
                                                    'credentialName',
                                                    e.target.value,
                                                )
                                            }
                                            className='flex-1 px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                            placeholder='Select or enter credential'
                                        />
                                        <button
                                            onClick={() =>
                                                router.push(
                                                    '/security-governance/credentials',
                                                )
                                            }
                                            className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2'
                                        >
                                            <PlusIcon className='w-5 h-5' />
                                            Create Credential
                                        </button>
                                    </div>
                                    <p className='text-sm text-slate-500 mt-2'>
                                        Select an existing credential or create
                                        a new one to authenticate with this
                                        environment
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Connection Test */}
                        {currentStep === 3 && (
                            <div className='space-y-4'>
                                <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                                    <h3 className='font-medium text-blue-900 mb-2'>
                                        Connection Test
                                    </h3>
                                    <p className='text-sm text-blue-700'>
                                        Test the connection to validate
                                        authentication and permissions
                                    </p>
                                </div>

                                <div className='space-y-4'>
                                    <div className='bg-slate-50 rounded-lg p-4 space-y-2'>
                                        <div className='flex justify-between text-sm'>
                                            <span className='text-slate-600'>
                                                URL:
                                            </span>
                                            <span className='font-medium text-slate-900'>
                                                {formData.url || 'Not set'}
                                            </span>
                                        </div>
                                        <div className='flex justify-between text-sm'>
                                            <span className='text-slate-600'>
                                                Credential:
                                            </span>
                                            <span className='font-medium text-slate-900'>
                                                {formData.credentialName ||
                                                    'Not set'}
                                            </span>
                                        </div>
                                        <div className='flex justify-between text-sm'>
                                            <span className='text-slate-600'>
                                                Environment Type:
                                            </span>
                                            <span className='font-medium text-slate-900'>
                                                {formData.environmentType ||
                                                    'Not set'}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleTestConnection}
                                        disabled={
                                            testingConnection ||
                                            !formData.url ||
                                            !formData.credentialName
                                        }
                                        className='w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2'
                                    >
                                        {testingConnection ? (
                                            <>
                                                <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white' />
                                                Testing Connection...
                                            </>
                                        ) : (
                                            'Test Connection'
                                        )}
                                    </button>

                                    {connectionResult && (
                                        <div
                                            className={`p-4 rounded-lg ${
                                                connectionResult === 'success'
                                                    ? 'bg-green-50 border border-green-200'
                                                    : 'bg-red-50 border border-red-200'
                                            }`}
                                        >
                                            <div className='flex items-center gap-2'>
                                                {connectionResult ===
                                                'success' ? (
                                                    <>
                                                        <ShieldCheckIcon className='w-5 h-5 text-green-600' />
                                                        <span className='font-medium text-green-900'>
                                                            Connection
                                                            Successful
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <XMarkIcon className='w-5 h-5 text-red-600' />
                                                        <span className='font-medium text-red-900'>
                                                            Connection Failed
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                            <p
                                                className={`text-sm mt-1 ${
                                                    connectionResult ===
                                                    'success'
                                                        ? 'text-green-700'
                                                        : 'text-red-700'
                                                }`}
                                            >
                                                {connectionResult === 'success'
                                                    ? 'Authentication and permissions validated successfully'
                                                    : 'Failed to validate authentication or permissions'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className='border-t border-slate-200 px-6 py-4 bg-slate-50'>
                        <div className='flex items-center justify-between'>
                            <div className='text-sm text-slate-600 font-medium'>
                                Step {currentStep + 1} of {steps.length}
                            </div>

                            <div className='flex items-center gap-3'>
                                {currentStep > 0 && (
                                    <button
                                        onClick={() =>
                                            setCurrentStep(currentStep - 1)
                                        }
                                        className='px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 font-medium transition-colors'
                                    >
                                        Back
                                    </button>
                                )}
                                {currentStep < steps.length - 1 ? (
                                    <button
                                        onClick={handleSaveAndContinue}
                                        disabled={
                                            (currentStep === 0 &&
                                                !formData.name) ||
                                            (currentStep === 2 &&
                                                !formData.credentialName)
                                        }
                                        className='px-8 py-2.5 bg-[#2563eb] text-white rounded-lg hover:bg-[#1e40af] disabled:bg-slate-300 disabled:cursor-not-allowed font-medium transition-colors shadow-sm'
                                    >
                                        Next
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleFinish}
                                        disabled={
                                            connectionResult !== 'success'
                                        }
                                        className='px-8 py-2.5 bg-[#2563eb] text-white rounded-lg hover:bg-[#1e40af] disabled:bg-slate-300 disabled:cursor-not-allowed font-medium transition-colors shadow-sm'
                                    >
                                        Finish
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
