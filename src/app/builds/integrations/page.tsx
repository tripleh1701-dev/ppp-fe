'use client';

import React, {useState, useEffect, useRef} from 'react';
import {motion} from 'framer-motion';
import {
    PlusIcon,
    MagnifyingGlassIcon,
    ArrowsUpDownIcon,
    EyeSlashIcon,
    RectangleStackIcon,
    BookmarkIcon,
} from '@heroicons/react/24/outline';
import BuildsTable, {BuildRow} from '@/components/BuildsTable';
import BuildDetailPanel from '@/components/BuildDetailPanel';
import PipelineCanvas from '@/components/PipelineCanvas';
import {api} from '@/utils/api';

export default function Integrations() {
    // Build data state
    const [builds, setBuilds] = useState<BuildRow[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);

    // Account & Enterprise context
    const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
        null,
    );
    const [selectedAccountName, setSelectedAccountName] = useState<
        string | null
    >(null);
    const [selectedEnterpriseId, setSelectedEnterpriseId] = useState<
        string | null
    >(null);
    const [selectedEnterpriseName, setSelectedEnterpriseName] = useState<
        string | null
    >(null);

    // Dropdown options for pipeline and entity
    const [pipelineOptions, setPipelineOptions] = useState<
        Array<{id: string; name: string}>
    >([]);
    const [entityOptions, setEntityOptions] = useState<
        Array<{id: string; name: string}>
    >([]);
    const [loadingPipelines, setLoadingPipelines] = useState(false);
    const [loadingEntities, setLoadingEntities] = useState(false);

    // Search and filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [appliedSearchTerm, setAppliedSearchTerm] = useState('');
    const [filterVisible, setFilterVisible] = useState(false);
    const [sortOpen, setSortOpen] = useState(false);
    const [hideOpen, setHideOpen] = useState(false);
    const [groupOpen, setGroupOpen] = useState(false);

    // Notification state
    const [notificationMessage, setNotificationMessage] = useState<string>('');
    const [showNotification, setShowNotification] = useState(false);

    // Auto-save related state
    const [isAutoSaving, setIsAutoSaving] = useState(false);
    const [showAutoSaveSuccess, setShowAutoSaveSuccess] = useState(false);
    const [autoSaveCountdown, setAutoSaveCountdown] = useState<number | null>(
        null,
    );

    // Build detail panel state
    const [selectedBuildRowId, setSelectedBuildRowId] = useState<string | null>(
        null,
    );
    const [showExecutionPanel, setShowExecutionPanel] = useState(false);
    const [panelWidth, setPanelWidth] = useState(40); // Percentage width of detail panel
    const [executionPanelWidth, setExecutionPanelWidth] = useState(35); // Percentage width of execution panel
    const [isDragging, setIsDragging] = useState(false);
    const [isDraggingSeparator2, setIsDraggingSeparator2] = useState(false);
    const [activeExecutionTab, setActiveExecutionTab] = useState<
        'status' | 'artifact' | 'build'
    >('status');
    const [selectedStage, setSelectedStage] = useState<string | null>(null);

    // Current build execution data
    const [currentExecution, setCurrentExecution] = useState<any>(null);
    const [loadingExecution, setLoadingExecution] = useState(false);

    // Refs for click outside detection
    const searchRef = useRef<HTMLDivElement>(null);
    const filterRef = useRef<HTMLDivElement>(null);
    const sortRef = useRef<HTMLDivElement>(null);
    const hideRef = useRef<HTMLDivElement>(null);
    const groupRef = useRef<HTMLDivElement>(null);

    // Auto-save timer refs
    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const buildsRef = useRef<BuildRow[]>([]);

    // Update ref to track current builds state
    useEffect(() => {
        buildsRef.current = builds;
    }, [builds]);

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

    // Load account and enterprise context from breadcrumb
    useEffect(() => {
        const loadAccountContext = () => {
            if (typeof window !== 'undefined') {
                const accountId =
                    window.localStorage.getItem('selectedAccountId');
                const accountName = window.localStorage.getItem(
                    'selectedAccountName',
                );
                const enterpriseId = window.localStorage.getItem(
                    'selectedEnterpriseId',
                );
                const enterpriseName = window.localStorage.getItem(
                    'selectedEnterpriseName',
                );
                setSelectedAccountId(accountId);
                setSelectedAccountName(accountName);
                setSelectedEnterpriseId(enterpriseId);
                setSelectedEnterpriseName(enterpriseName);
            }
        };

        loadAccountContext();

        // Listen for changes
        window.addEventListener('accountChanged', loadAccountContext);
        window.addEventListener('enterpriseChanged', loadAccountContext);

        return () => {
            window.removeEventListener('accountChanged', loadAccountContext);
            window.removeEventListener('enterpriseChanged', loadAccountContext);
        };
    }, []);

    // Load pipelines and entities when account/enterprise changes
    useEffect(() => {
        if (selectedAccountId && selectedAccountName && selectedEnterpriseId) {
            loadPipelines();
            loadEntities();
        }
    }, [selectedAccountId, selectedAccountName, selectedEnterpriseId]);

    const loadPipelines = async () => {
        setLoadingPipelines(true);
        try {
            // Fetch pipelines from API based on account & enterprise
            const response = await api.get<
                Array<{id: string; pipelineName: string}>
            >(
                `/api/pipeline-canvas?accountId=${selectedAccountId}&accountName=${encodeURIComponent(
                    selectedAccountName || '',
                )}&enterpriseId=${selectedEnterpriseId}`,
            );

            console.log(
                `✅ Loaded ${response.length} pipelines for account: ${selectedAccountName}`,
                response,
            );

            // Map to dropdown format
            const pipelines = response.map((p: any) => ({
                id: p.id,
                name: p.pipelineName || p.name || 'Unnamed Pipeline',
            }));

            setPipelineOptions(pipelines);
        } catch (error) {
            console.error('❌ Error loading pipelines:', error);
            setPipelineOptions([]);
        } finally {
            setLoadingPipelines(false);
        }
    };

    const loadEntities = async () => {
        setLoadingEntities(true);
        try {
            // Fetch entities from Global Settings API based on account & enterprise
            const response = await api.get<
                Array<{
                    id?: string;
                    entityName: string;
                    enterprise?: string;
                    product?: string;
                    services?: string[];
                }>
            >(
                `/api/global-settings?accountId=${selectedAccountId}&accountName=${encodeURIComponent(
                    selectedAccountName || '',
                )}&enterpriseId=${selectedEnterpriseId}`,
            );

            console.log(
                `✅ Loaded ${response.length} entities for account: ${selectedAccountName}, enterprise: ${selectedEnterpriseId}`,
                response,
            );

            // Map to dropdown format - extract unique entity names
            const entities = response
                .filter((item: any) => item.entityName)
                .map((item: any) => ({
                    id: item.id || item.entityName,
                    name: item.entityName,
                }))
                // Remove duplicates
                .filter(
                    (entity, index, self) =>
                        index === self.findIndex((e) => e.name === entity.name),
                );

            console.log(
                `✅ Mapped to ${entities.length} unique entity options:`,
                entities,
            );

            setEntityOptions(entities);
        } catch (error) {
            console.error('❌ Error loading entities:', error);
            setEntityOptions([]);
        } finally {
            setLoadingEntities(false);
        }
    };

    // Load builds data
    useEffect(() => {
        loadBuilds();
    }, []);

    const loadBuilds = async () => {
        setIsLoading(true);
        try {
            // TODO: Replace with actual API call
            // const data = await api.get('/api/builds/integrations');
            // setBuilds(data);

            // Sample data for testing
            const sampleBuilds: BuildRow[] = [
                {
                    id: '1',
                    buildName: 'FioriAppName',
                    description: 'Main application build',
                    entity: 'Private Cloud',
                    pipeline: 'Production Pipeline',
                    status: 'Active',
                    artifact: 'v1.2.3',
                    build: '',
                    stages: [],
                    isTemporary: false,
                },
                {
                    id: '2',
                    buildName: 'BackendAPI',
                    description: 'Backend service',
                    entity: 'Public Cloud',
                    pipeline: 'Dev Pipeline',
                    status: 'Active',
                    artifact: 'v2.0.1',
                    build: '',
                    stages: [],
                    isTemporary: false,
                },
            ];
            setBuilds(sampleBuilds);
        } catch (error) {
            console.error('Error loading builds:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle adding new build row
    const handleAddNewBuild = () => {
        const newBuild: BuildRow = {
            id: `temp-${Date.now()}`,
            buildName: '',
            description: '',
            entity: '',
            pipeline: '',
            status: '',
            artifact: '',
            build: '',
            stages: [
                {
                    id: `stage-dev-${Date.now()}`,
                    name: 'Dev Stage',
                    status: '',
                    deployedAt: '',
                },
                {
                    id: `stage-qa-${Date.now() + 1}`,
                    name: 'QA Stage',
                    status: '',
                    deployedAt: '',
                },
                {
                    id: `stage-prod-${Date.now() + 2}`,
                    name: 'Production Stage',
                    status: '',
                    deployedAt: '',
                },
            ],
            isTemporary: true,
        };
        setBuilds([newBuild, ...builds]);
        setShowCreateForm(true);
    };

    // Helper function to close all dialogs
    const closeAllDialogs = () => {
        setFilterVisible(false);
        setSortOpen(false);
        setHideOpen(false);
        setGroupOpen(false);
    };

    // Helper function to toggle a specific dialog
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

    // Show notification
    const showBlueNotification = (message: string, duration = 3000) => {
        setNotificationMessage(message);
        setShowNotification(true);
        setTimeout(() => {
            setShowNotification(false);
        }, duration);
    };

    // Handle build detail panel
    const handleBuildDetailClick = (rowId: string) => {
        setSelectedBuildRowId(rowId);

        // Collapse sidebar and AI panel when opening build detail
        const collapseSidebarEvent = new CustomEvent('collapseSidebar');
        const collapseAIPanelEvent = new CustomEvent('collapseAIPanel');
        window.dispatchEvent(collapseSidebarEvent);
        window.dispatchEvent(collapseAIPanelEvent);

        // Load build execution data
        loadBuildExecution(rowId);
    };

    const handleCloseBuildDetail = () => {
        setSelectedBuildRowId(null);
        setCurrentExecution(null);
        setShowExecutionPanel(false);

        // Optionally expand sidebar and AI panel when closing build detail
        const expandSidebarEvent = new CustomEvent('expandSidebar');
        const expandAIPanelEvent = new CustomEvent('expandAIPanel');
        window.dispatchEvent(expandSidebarEvent);
        window.dispatchEvent(expandAIPanelEvent);
    };

    // Load build execution data from API
    const loadBuildExecution = async (buildId: string) => {
        if (!selectedAccountId || !selectedAccountName) {
            console.warn('Cannot load build execution without account context');
            return;
        }

        setLoadingExecution(true);
        try {
            const response = await api.get(
                `/api/build-executions/latest?accountId=${selectedAccountId}&accountName=${encodeURIComponent(
                    selectedAccountName,
                )}&buildId=${buildId}`,
            );

            console.log('✅ Loaded build execution:', response);
            setCurrentExecution(response);
        } catch (error) {
            console.error('❌ Error loading build execution:', error);
            // Set default/empty execution data if none exists
            setCurrentExecution(null);
        } finally {
            setLoadingExecution(false);
        }
    };

    // Get build count for a row (mock data - replace with actual logic)
    const getBuildCount = (rowId: string): number => {
        // TODO: Replace with actual API call or data lookup
        // Mock data for demonstration
        const buildCounts: Record<string, number> = {
            '1': 3,
            '2': 5,
        };
        return buildCounts[rowId] || 0;
    };

    // Get selected build row
    const selectedBuildRow = builds.find((b) => b.id === selectedBuildRowId);

    // Handle separator drag for resizing panels
    const handleSeparatorMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleSeparator2MouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDraggingSeparator2(true);
    };

    useEffect(() => {
        if (!isDragging) {
            document.body.style.cursor = '';
            return;
        }

        // Set cursor globally while dragging
        document.body.style.cursor = 'col-resize';

        const handleMouseMove = (e: MouseEvent) => {
            const container = document.getElementById('content-container');
            if (!container) return;

            const containerRect = container.getBoundingClientRect();
            const containerWidth = containerRect.width;
            const mouseX = e.clientX - containerRect.left;

            if (showExecutionPanel) {
                // 3-column layout: dragging separator between table and detail panel
                // Calculate total width from separator to right edge
                const totalRightWidth =
                    ((containerWidth - mouseX) / containerWidth) * 100;
                // Detail panel width = total right width - execution panel width
                const newPanelWidth = totalRightWidth - executionPanelWidth;

                const minPanelWidth = 15;
                const maxPanelWidth = 100 - executionPanelWidth - 15;
                const constrainedWidth = Math.min(
                    Math.max(newPanelWidth, minPanelWidth),
                    maxPanelWidth,
                );
                setPanelWidth(constrainedWidth);
            } else {
                // 2-column layout
                const newPanelWidth =
                    ((containerWidth - mouseX) / containerWidth) * 100;
                const constrainedWidth = Math.min(
                    Math.max(newPanelWidth, 20),
                    70,
                );
                setPanelWidth(constrainedWidth);
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            document.body.style.cursor = '';
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
        };
    }, [isDragging, showExecutionPanel, executionPanelWidth]);

    useEffect(() => {
        if (!isDraggingSeparator2) {
            document.body.style.cursor = '';
            return;
        }

        document.body.style.cursor = 'col-resize';

        const handleMouseMove = (e: MouseEvent) => {
            const container = document.getElementById('content-container');
            if (!container) return;

            const containerRect = container.getBoundingClientRect();
            const containerWidth = containerRect.width;
            const mouseX = e.clientX - containerRect.left;

            // Calculate where separator 1 is positioned
            const tableWidth = 100 - panelWidth - executionPanelWidth;
            const separator1Position = (tableWidth / 100) * containerWidth;

            // Calculate new widths based on mouse position
            const newPanelWidth =
                ((mouseX - separator1Position) / containerWidth) * 100;
            const newExecutionPanelWidth =
                ((containerWidth - mouseX) / containerWidth) * 100;

            // Ensure both panels stay within constraints
            const minWidth = 15;
            const maxPanelWidth = 100 - tableWidth - minWidth;
            const maxExecutionWidth = 100 - tableWidth - minWidth;

            const constrainedPanelWidth = Math.min(
                Math.max(newPanelWidth, minWidth),
                maxPanelWidth,
            );
            const constrainedExecutionWidth = Math.min(
                Math.max(newExecutionPanelWidth, minWidth),
                maxExecutionWidth,
            );

            // Only update if the total doesn't exceed available space
            if (
                constrainedPanelWidth + constrainedExecutionWidth <=
                100 - tableWidth
            ) {
                setPanelWidth(constrainedPanelWidth);
                setExecutionPanelWidth(constrainedExecutionWidth);
            }
        };

        const handleMouseUp = () => {
            setIsDraggingSeparator2(false);
            document.body.style.cursor = '';
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
        };
    }, [isDraggingSeparator2, panelWidth]);

    // Debounced auto-save function
    const debouncedAutoSave = async () => {
        console.log(
            '🕐 debouncedAutoSave called - clearing existing timer and starting new one',
        );

        // Clear existing timer and countdown
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
            autoSaveTimerRef.current = null;
        }
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
        }

        // Start countdown from 10 seconds
        setAutoSaveCountdown(10);
        const countdownInterval = setInterval(() => {
            setAutoSaveCountdown((prev) => {
                if (prev && prev > 1) {
                    return prev - 1;
                }
                return prev;
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
                const temporaryRows = buildsRef.current.filter((build) => {
                    const isTemp =
                        String(build.id).startsWith('temp-') ||
                        build.isTemporary;
                    if (!isTemp) return false;

                    // Check if row has minimum required fields
                    const hasBuildName =
                        build.buildName?.trim() &&
                        build.buildName.trim().length > 0;
                    const hasEntity =
                        build.entity?.trim() && build.entity.trim().length > 0;
                    const hasPipeline =
                        build.pipeline?.trim() &&
                        build.pipeline.trim().length > 0;

                    const isComplete = hasBuildName && hasEntity && hasPipeline;

                    if (isTemp && !isComplete) {
                        console.log(
                            `🚫 Skipping incomplete temporary row ${build.id}:`,
                            {
                                hasBuildName: !!hasBuildName,
                                hasEntity: !!hasEntity,
                                hasPipeline: !!hasPipeline,
                            },
                        );
                    }

                    return isComplete;
                });

                console.log(
                    `📝 Found ${temporaryRows.length} complete temporary rows to auto-save`,
                );

                if (temporaryRows.length === 0) {
                    console.log(
                        '✅ No complete temporary rows to save - skipping auto-save',
                    );
                    setIsAutoSaving(false);
                    return 0;
                }

                // Save each temporary row
                let savedCount = 0;
                for (const row of temporaryRows) {
                    try {
                        console.log(`💾 Auto-saving temporary row ${row.id}`);
                        // TODO: Implement actual API call to save build
                        // await api.post('/api/builds/integrations', row);
                        savedCount++;
                    } catch (error) {
                        console.error(
                            `❌ Failed to auto-save row ${row.id}:`,
                            error,
                        );
                    }
                }

                if (savedCount > 0) {
                    console.log(
                        `✅ Auto-save completed: ${savedCount} row(s) saved`,
                    );
                    setShowAutoSaveSuccess(true);
                    setTimeout(() => setShowAutoSaveSuccess(false), 2000);
                    showBlueNotification(
                        `Auto-saved ${savedCount} build(s) successfully`,
                    );
                }

                return savedCount;
            } catch (error) {
                console.error('❌ Auto-save failed:', error);
                throw error;
            } finally {
                setIsAutoSaving(false);
            }
        }, 10000);

        autoSaveTimerRef.current = timer;
    };

    // Handle manual save
    const handleManualSave = async () => {
        console.log('💾 Save button clicked - saving all builds');

        // Clear auto-save timer since user is manually saving
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
            autoSaveTimerRef.current = null;
        }
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
        }
        setAutoSaveCountdown(null);

        try {
            setIsAutoSaving(true);

            // Get all temporary (unsaved) rows
            const temporaryRows = buildsRef.current.filter(
                (build) =>
                    String(build.id).startsWith('temp-') || build.isTemporary,
            );

            if (temporaryRows.length === 0) {
                showBlueNotification('No unsaved changes to save.');
                return;
            }

            // Save each temporary row
            let savedCount = 0;
            for (const row of temporaryRows) {
                try {
                    console.log(`💾 Saving row ${row.id}`);
                    // TODO: Implement actual API call to save build
                    // await api.post('/api/builds/integrations', row);
                    savedCount++;
                } catch (error) {
                    console.error(`❌ Failed to save row ${row.id}:`, error);
                }
            }

            if (savedCount > 0) {
                setShowAutoSaveSuccess(true);
                setTimeout(() => setShowAutoSaveSuccess(false), 2000);
                showBlueNotification(
                    `Successfully saved ${savedCount} build(s).`,
                );
            }
        } catch (error) {
            console.error('❌ Save failed:', error);
            showBlueNotification('Failed to save changes. Please try again.');
        } finally {
            setIsAutoSaving(false);
        }
    };

    // Close dialogs when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const isOutsideFilter =
                filterRef.current &&
                !filterRef.current.contains(event.target as Node);
            const isOutsideSort =
                sortRef.current &&
                !sortRef.current.contains(event.target as Node);
            const isOutsideHide =
                hideRef.current &&
                !hideRef.current.contains(event.target as Node);
            const isOutsideGroup =
                groupRef.current &&
                !groupRef.current.contains(event.target as Node);

            const isOutsideAll =
                isOutsideFilter &&
                isOutsideSort &&
                isOutsideHide &&
                isOutsideGroup;

            if (isOutsideAll) {
                closeAllDialogs();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [closeAllDialogs]);

    return (
        <div
            className={`h-full bg-secondary flex flex-col ${
                isDragging ? 'select-none' : ''
            }`}
        >
            {/* Header Section */}
            <div className='bg-white px-3 py-4 border-b border-slate-200'>
                <div className='w-full'>
                    <h1 className='text-2xl font-bold text-slate-900'>
                        Build Integrations
                    </h1>
                    <p className='mt-2 text-sm text-slate-600 leading-relaxed'>
                        Create, manage, and monitor build integrations across
                        your development pipeline. Track build status,
                        artifacts, and deployments.
                    </p>
                </div>
            </div>

            {/* Toolbar Section */}
            <div className='bg-sap-light-gray px-3 py-3 text-primary border-y border-light'>
                <div className='flex items-center justify-between gap-3'>
                    <div className='flex items-center gap-3 flex-wrap'>
                        {/* Create Job Button */}
                        <button
                            onClick={handleAddNewBuild}
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
                                {isLoading ? 'Loading...' : 'Create Job'}
                            </span>
                        </button>

                        {/* Search Input */}
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
                                    className='block w-full pl-10 pr-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-sm'
                                />
                                {appliedSearchTerm && (
                                    <button
                                        onClick={() => {
                                            setSearchTerm('');
                                            setAppliedSearchTerm('');
                                        }}
                                        className='absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600'
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
                                className={`group relative flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-medium transition-all duration-300 transform hover:scale-105 ${
                                    filterVisible
                                        ? 'border-purple-300 bg-purple-50 text-purple-600 shadow-purple-200 shadow-lg'
                                        : 'border-blue-200 bg-white text-gray-600 hover:border-purple-200 hover:bg-purple-50 hover:text-purple-600 hover:shadow-lg'
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
                            </button>

                            {/* Filter Dropdown */}
                            {filterVisible && (
                                <div className='absolute top-full mt-2 left-0 bg-white shadow-xl border border-blue-200 rounded-lg z-50 min-w-80 p-4'>
                                    <div className='text-sm text-gray-500'>
                                        Filter options will be added here
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
                                className='group relative flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-blue-200 bg-white text-gray-600 font-medium hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 transition-all duration-300 transform hover:scale-105'
                            >
                                <ArrowsUpDownIcon className='w-4 h-4' />
                                <span className='text-sm'>Sort</span>
                            </button>
                        </div>

                        {/* Show/Hide Button */}
                        <div ref={hideRef} className='relative'>
                            <button
                                onClick={() =>
                                    hideOpen
                                        ? closeAllDialogs()
                                        : toggleDialog('hide')
                                }
                                className='group relative flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-blue-200 bg-white text-gray-600 font-medium hover:border-green-300 hover:bg-green-50 hover:text-green-600 transition-all duration-300 transform hover:scale-105'
                            >
                                <EyeSlashIcon className='w-4 h-4' />
                                <span className='text-sm'>Show/Hide</span>
                            </button>
                        </div>

                        {/* Group By Button */}
                        <div ref={groupRef} className='relative'>
                            <button
                                onClick={() =>
                                    groupOpen
                                        ? closeAllDialogs()
                                        : toggleDialog('group')
                                }
                                className='group relative flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-blue-200 bg-white text-gray-600 font-medium hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 transition-all duration-300 transform hover:scale-105'
                            >
                                <RectangleStackIcon className='w-4 h-4' />
                                <span className='text-sm'>Group By</span>
                            </button>
                        </div>

                        {/* Save Button */}
                        <button
                            onClick={handleManualSave}
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

                    {/* Right Side Actions */}
                    <div className='flex items-center gap-3'>
                        {/* Placeholder for future actions */}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div
                id='content-container'
                className='flex-1 p-3 overflow-hidden flex gap-0'
            >
                {/* Main Table Area */}
                <motion.div
                    className='h-full bg-card border border-light rounded-lg p-3 flex flex-col'
                    style={{
                        width: selectedBuildRowId
                            ? showExecutionPanel
                                ? `${100 - panelWidth - executionPanelWidth}%`
                                : `${100 - panelWidth}%`
                            : '100%',
                    }}
                    initial={{width: '100%'}}
                    animate={
                        !isDragging && !isDraggingSeparator2
                            ? {
                                  width: selectedBuildRowId
                                      ? showExecutionPanel
                                          ? `${
                                                100 -
                                                panelWidth -
                                                executionPanelWidth
                                            }%`
                                          : `${100 - panelWidth}%`
                                      : '100%',
                              }
                            : {}
                    }
                    transition={{
                        duration: 0.4,
                        ease: [0.4, 0, 0.2, 1],
                    }}
                >
                    {builds.length === 0 && !isLoading ? (
                        /* Empty State */
                        <div className='flex-1 flex items-center justify-center'>
                            <div className='text-center'>
                                <div className='w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                                    <svg
                                        className='w-10 h-10 text-blue-600'
                                        fill='none'
                                        stroke='currentColor'
                                        viewBox='0 0 24 24'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
                                        />
                                    </svg>
                                </div>
                                <h3 className='text-xl font-semibold text-gray-900 mb-2'>
                                    No builds yet
                                </h3>
                                <p className='text-gray-600 mb-4 max-w-md mx-auto'>
                                    Get started by creating your first build
                                    integration. Click the &quot;Create
                                    Job&quot; button above to begin.
                                </p>
                                <button
                                    onClick={handleAddNewBuild}
                                    className='inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700'
                                >
                                    <PlusIcon className='h-5 w-5' />
                                    <span>Create Your First Job</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Builds Table */
                        <BuildsTable
                            rows={builds}
                            onEdit={(id) => {
                                console.log('Edit build:', id);
                            }}
                            onDelete={(id) => {
                                setBuilds(builds.filter((b) => b.id !== id));
                            }}
                            onBuildDetailClick={handleBuildDetailClick}
                            getBuildCount={getBuildCount}
                            onUpdateField={(rowId, key, value) => {
                                console.log('🔄 onUpdateField called:', {
                                    rowId,
                                    key,
                                    value,
                                });

                                // Update local state immediately for responsiveness
                                setBuilds((prev) =>
                                    prev.map((b) =>
                                        b.id === rowId
                                            ? {...b, [key]: value}
                                            : b,
                                    ),
                                );

                                // For temporary rows, check if we should trigger auto-save
                                if (String(rowId).startsWith('temp-')) {
                                    console.log(
                                        '🔄 Updating temporary row:',
                                        rowId,
                                        key,
                                        value,
                                    );

                                    // Check if all required fields are filled for auto-save
                                    const updatedBuild = buildsRef.current.find(
                                        (b) => b.id === rowId,
                                    );
                                    if (updatedBuild) {
                                        // Apply the current update to check completeness
                                        const buildWithUpdate = {
                                            ...updatedBuild,
                                            [key]: value,
                                        };

                                        // Check if we have minimum required fields
                                        const hasBuildName =
                                            buildWithUpdate.buildName?.trim();
                                        const hasEntity =
                                            buildWithUpdate.entity?.trim();
                                        const hasPipeline =
                                            buildWithUpdate.pipeline?.trim();

                                        console.log('🔍 Auto-save check:', {
                                            rowId,
                                            key,
                                            value,
                                            hasBuildName: !!hasBuildName,
                                            hasEntity: !!hasEntity,
                                            hasPipeline: !!hasPipeline,
                                            willTriggerDebouncedSave:
                                                hasBuildName &&
                                                hasEntity &&
                                                hasPipeline,
                                        });

                                        // Trigger debounced auto-save if all required fields are filled
                                        if (
                                            hasBuildName &&
                                            hasEntity &&
                                            hasPipeline
                                        ) {
                                            console.log(
                                                '✅ All required fields filled, starting 10-second auto-save timer...',
                                            );
                                            debouncedAutoSave();
                                        } else {
                                            console.log(
                                                '❌ Auto-save conditions not met',
                                            );
                                        }
                                    }
                                }
                            }}
                            highlightQuery={appliedSearchTerm}
                            enableInlineEditing={true}
                            hideRowExpansion={false}
                            enableDropdownChips={true}
                            dropdownOptions={{
                                pipelines: pipelineOptions,
                                entities: entityOptions,
                                buildNames: [],
                            }}
                        />
                    )}
                </motion.div>

                {/* Animated Column Separator - Draggable */}
                {selectedBuildRowId && (
                    <motion.div
                        initial={{opacity: 0, scaleY: 0}}
                        animate={{opacity: 1, scaleY: 1}}
                        exit={{opacity: 0, scaleY: 0}}
                        transition={{duration: 0.3, ease: 'easeOut'}}
                        onMouseDown={handleSeparatorMouseDown}
                        className={`relative group flex items-center justify-center ${
                            isDragging
                                ? 'cursor-col-resize'
                                : 'cursor-col-resize hover:cursor-col-resize'
                        }`}
                        style={{
                            minHeight: '100%',
                            width: '20px',
                        }}
                    >
                        {/* Left border line */}
                        <div
                            className={`absolute left-0 w-px h-full bg-blue-500 transition-all ${
                                isDragging
                                    ? 'bg-blue-600 shadow-lg'
                                    : 'group-hover:bg-blue-600'
                            }`}
                        />

                        {/* Right border line */}
                        <div
                            className={`absolute right-0 w-px h-full bg-blue-500 transition-all ${
                                isDragging
                                    ? 'bg-blue-600 shadow-lg'
                                    : 'group-hover:bg-blue-600'
                            }`}
                        />

                        {/* Center grip handle with dots */}
                        <div
                            className={`relative z-10 flex flex-col items-center justify-center gap-1 px-1 py-3 rounded transition-all ${
                                isDragging
                                    ? 'bg-blue-100 scale-110'
                                    : 'bg-transparent group-hover:bg-blue-50 group-hover:scale-105'
                            }`}
                        >
                            <div
                                className={`w-1 h-1 rounded-full transition-colors ${
                                    isDragging
                                        ? 'bg-blue-600'
                                        : 'bg-blue-400 group-hover:bg-blue-600'
                                }`}
                            ></div>
                            <div
                                className={`w-1 h-1 rounded-full transition-colors ${
                                    isDragging
                                        ? 'bg-blue-600'
                                        : 'bg-blue-400 group-hover:bg-blue-600'
                                }`}
                            ></div>
                            <div
                                className={`w-1 h-1 rounded-full transition-colors ${
                                    isDragging
                                        ? 'bg-blue-600'
                                        : 'bg-blue-400 group-hover:bg-blue-600'
                                }`}
                            ></div>
                        </div>

                        {/* Hover hint text */}
                        <div
                            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-8 pointer-events-none transition-opacity ${
                                isDragging
                                    ? 'opacity-0'
                                    : 'opacity-0 group-hover:opacity-100'
                            }`}
                        >
                            <div className='bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap'>
                                Drag to resize
                            </div>
                        </div>

                        {/* Invisible wider hit area for easier grabbing */}
                        <div className='absolute inset-0 -left-3 -right-3' />
                    </motion.div>
                )}

                {/* Build Detail Panel */}
                {selectedBuildRowId && selectedBuildRow && (
                    <motion.div
                        initial={{x: '100%', opacity: 0}}
                        animate={
                            !isDragging && !isDraggingSeparator2
                                ? {
                                      x: 0,
                                      opacity: 1,
                                      width: `${panelWidth}%`,
                                  }
                                : {x: 0, opacity: 1}
                        }
                        exit={{x: '100%', opacity: 0}}
                        transition={{
                            duration: 0.4,
                            ease: [0.4, 0, 0.2, 1],
                        }}
                        className='h-full bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden'
                        style={{
                            width: `${panelWidth}%`,
                        }}
                    >
                        <BuildDetailPanel
                            buildRow={selectedBuildRow}
                            onClose={handleCloseBuildDetail}
                            onRunBuild={() => setShowExecutionPanel(true)}
                        />
                    </motion.div>
                )}

                {/* Second Column Separator - Between Detail and Execution Panel */}
                {selectedBuildRowId && showExecutionPanel && (
                    <motion.div
                        initial={{opacity: 0, scaleY: 0}}
                        animate={{opacity: 1, scaleY: 1}}
                        exit={{opacity: 0, scaleY: 0}}
                        transition={{duration: 0.3, ease: 'easeOut'}}
                        onMouseDown={handleSeparator2MouseDown}
                        className={`relative group flex items-center justify-center ${
                            isDraggingSeparator2
                                ? 'cursor-col-resize'
                                : 'cursor-col-resize hover:cursor-col-resize'
                        }`}
                        style={{
                            minHeight: '100%',
                            width: '20px',
                        }}
                    >
                        {/* Left border line */}
                        <div
                            className={`absolute left-0 w-px h-full bg-green-500 transition-all ${
                                isDraggingSeparator2
                                    ? 'bg-green-600 shadow-lg'
                                    : 'group-hover:bg-green-600'
                            }`}
                        />

                        {/* Right border line */}
                        <div
                            className={`absolute right-0 w-px h-full bg-green-500 transition-all ${
                                isDraggingSeparator2
                                    ? 'bg-green-600 shadow-lg'
                                    : 'group-hover:bg-green-600'
                            }`}
                        />

                        {/* Center grip handle with dots */}
                        <div
                            className={`relative z-10 flex flex-col items-center justify-center gap-1 px-1 py-3 rounded transition-all ${
                                isDraggingSeparator2
                                    ? 'bg-green-100 scale-110'
                                    : 'bg-transparent group-hover:bg-green-50 group-hover:scale-105'
                            }`}
                        >
                            <div
                                className={`w-1 h-1 rounded-full transition-colors ${
                                    isDraggingSeparator2
                                        ? 'bg-green-600'
                                        : 'bg-green-400 group-hover:bg-green-600'
                                }`}
                            ></div>
                            <div
                                className={`w-1 h-1 rounded-full transition-colors ${
                                    isDraggingSeparator2
                                        ? 'bg-green-600'
                                        : 'bg-green-400 group-hover:bg-green-600'
                                }`}
                            ></div>
                            <div
                                className={`w-1 h-1 rounded-full transition-colors ${
                                    isDraggingSeparator2
                                        ? 'bg-green-600'
                                        : 'bg-green-400 group-hover:bg-green-600'
                                }`}
                            ></div>
                        </div>

                        {/* Hover hint text */}
                        <div
                            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-8 pointer-events-none transition-opacity ${
                                isDraggingSeparator2
                                    ? 'opacity-0'
                                    : 'opacity-0 group-hover:opacity-100'
                            }`}
                        >
                            <div className='bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap'>
                                Drag to resize
                            </div>
                        </div>

                        {/* Invisible wider hit area for easier grabbing */}
                        <div className='absolute inset-0 -left-3 -right-3' />
                    </motion.div>
                )}

                {/* Build Execution Panel */}
                {selectedBuildRowId && showExecutionPanel && (
                    <motion.div
                        initial={{x: '100%', opacity: 0}}
                        animate={
                            !isDraggingSeparator2
                                ? {
                                      x: 0,
                                      opacity: 1,
                                      width: `${executionPanelWidth}%`,
                                  }
                                : {x: 0, opacity: 1}
                        }
                        exit={{x: '100%', opacity: 0}}
                        transition={{
                            duration: 0.4,
                            ease: [0.4, 0, 0.2, 1],
                        }}
                        className='h-full bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden'
                        style={{
                            width: `${executionPanelWidth}%`,
                        }}
                    >
                        {/* Build Execution Content */}
                        <div className='h-full flex flex-col bg-white'>
                            <div className='flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50'>
                                <h2 className='text-base font-semibold text-gray-900'>
                                    Build #3 Stages
                                </h2>
                                <button
                                    onClick={() => setShowExecutionPanel(false)}
                                    className='p-1.5 text-gray-500 hover:bg-gray-200 rounded transition-colors'
                                    title='Close'
                                >
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
                                            d='M6 18L18 6M6 6l12 12'
                                        />
                                    </svg>
                                </button>
                            </div>

                            {/* Tab Navigation */}
                            <div className='flex border-b border-gray-200 bg-white'>
                                <button
                                    onClick={() =>
                                        setActiveExecutionTab('status')
                                    }
                                    className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors overflow-hidden ${
                                        activeExecutionTab === 'status'
                                            ? 'text-blue-600 bg-blue-50/30'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                >
                                    {activeExecutionTab === 'status' && (
                                        <div className='absolute left-0 top-0 bottom-0 w-1 bg-blue-600 z-10'></div>
                                    )}
                                    <svg
                                        className='w-5 h-5 relative z-20'
                                        fill='none'
                                        stroke='currentColor'
                                        viewBox='0 0 24 24'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'
                                        />
                                    </svg>
                                    <span className='relative z-20'>
                                        Status
                                    </span>
                                </button>
                                <button
                                    onClick={() =>
                                        setActiveExecutionTab('artifact')
                                    }
                                    className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors overflow-hidden ${
                                        activeExecutionTab === 'artifact'
                                            ? 'text-blue-600 bg-blue-50/30'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                >
                                    {activeExecutionTab === 'artifact' && (
                                        <div className='absolute left-0 top-0 bottom-0 w-1 bg-blue-600 z-10'></div>
                                    )}
                                    <svg
                                        className='w-5 h-5 relative z-20'
                                        fill='none'
                                        stroke='currentColor'
                                        viewBox='0 0 24 24'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
                                        />
                                    </svg>
                                    <span className='relative z-20'>
                                        Artifact
                                    </span>
                                </button>
                                <button
                                    onClick={() =>
                                        setActiveExecutionTab('build')
                                    }
                                    className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors overflow-hidden ${
                                        activeExecutionTab === 'build'
                                            ? 'text-blue-600 bg-blue-50/30'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                >
                                    {activeExecutionTab === 'build' && (
                                        <div className='absolute left-0 top-0 bottom-0 w-1 bg-blue-600 z-10'></div>
                                    )}
                                    <svg
                                        className='w-5 h-5 relative z-20'
                                        fill='none'
                                        stroke='currentColor'
                                        viewBox='0 0 24 24'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
                                        />
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                                        />
                                    </svg>
                                    <span className='relative z-20'>Build</span>
                                </button>
                            </div>

                            <div className='flex-1 overflow-y-auto flex flex-col'>
                                {/* Status Tab Content */}
                                {activeExecutionTab === 'status' && (
                                    <>
                                        {/* Action Buttons at Top */}
                                        <div className='px-4 pt-4 pb-3 border-b border-gray-200 bg-white sticky top-0 z-10'>
                                            <div className='flex flex-wrap gap-2 mb-3'>
                                                <button className='flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors'>
                                                    <svg
                                                        className='w-3.5 h-3.5'
                                                        fill='none'
                                                        stroke='currentColor'
                                                        viewBox='0 0 24 24'
                                                    >
                                                        <path
                                                            strokeLinecap='round'
                                                            strokeLinejoin='round'
                                                            strokeWidth={2}
                                                            d='M15 13l-3 3m0 0l-3-3m3 3V8m0 13a9 9 0 110-18 9 9 0 010 18z'
                                                        />
                                                    </svg>
                                                    Show Full Log
                                                </button>
                                                <button className='flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition-colors'>
                                                    <svg
                                                        className='w-3.5 h-3.5'
                                                        fill='none'
                                                        stroke='currentColor'
                                                        viewBox='0 0 24 24'
                                                    >
                                                        <path
                                                            strokeLinecap='round'
                                                            strokeLinejoin='round'
                                                            strokeWidth={2}
                                                            d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4'
                                                        />
                                                    </svg>
                                                    Download
                                                </button>
                                                <button className='px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition-colors'>
                                                    SonarQube
                                                </button>
                                                <button className='px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition-colors'>
                                                    Tricentis Tosca
                                                </button>
                                            </div>
                                        </div>

                                        {/* Build Info Summary */}
                                        <div className='px-4 py-3 bg-blue-50/30 border-b border-blue-100'>
                                            {loadingExecution ? (
                                                <div className='text-center py-4'>
                                                    <div className='inline-block w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin'></div>
                                                    <p className='text-xs text-gray-500 mt-2'>
                                                        Loading execution
                                                        data...
                                                    </p>
                                                </div>
                                            ) : currentExecution ? (
                                                <div className='grid grid-cols-2 gap-x-4 gap-y-2 text-xs'>
                                                    <div>
                                                        <span className='text-gray-500'>
                                                            Build ID:
                                                        </span>
                                                        <p className='text-gray-900 font-mono text-[10px]'>
                                                            {currentExecution.id ||
                                                                'N/A'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className='text-gray-500'>
                                                            Triggered by:
                                                        </span>
                                                        <p className='text-gray-900 font-medium'>
                                                            {currentExecution.triggeredBy ||
                                                                'System'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className='text-gray-500'>
                                                            Total Duration:
                                                        </span>
                                                        <p className='text-gray-900 font-medium'>
                                                            {currentExecution.duration ||
                                                                'N/A'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className='text-gray-500'>
                                                            Status:
                                                        </span>
                                                        <p className='flex items-center gap-1'>
                                                            <span
                                                                className={`inline-block w-2 h-2 rounded-full ${
                                                                    currentExecution.status ===
                                                                    'success'
                                                                        ? 'bg-blue-500'
                                                                        : currentExecution.status ===
                                                                          'failed'
                                                                        ? 'bg-red-500'
                                                                        : currentExecution.status ===
                                                                          'running'
                                                                        ? 'bg-blue-400'
                                                                        : 'bg-gray-400'
                                                                }`}
                                                            ></span>
                                                            <span
                                                                className={`font-semibold ${
                                                                    currentExecution.status ===
                                                                    'success'
                                                                        ? 'text-blue-600'
                                                                        : currentExecution.status ===
                                                                          'failed'
                                                                        ? 'text-red-600'
                                                                        : currentExecution.status ===
                                                                          'running'
                                                                        ? 'text-blue-600'
                                                                        : 'text-gray-600'
                                                                }`}
                                                            >
                                                                {currentExecution.status
                                                                    ?.charAt(0)
                                                                    .toUpperCase() +
                                                                    currentExecution.status?.slice(
                                                                        1,
                                                                    ) ||
                                                                    'Unknown'}
                                                            </span>
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className='text-center py-4 text-xs text-gray-500'>
                                                    No execution data available
                                                </div>
                                            )}
                                        </div>

                                        {/* Interactive Pipeline Canvas */}
                                        <div className='flex-1 overflow-y-auto'>
                                            <PipelineCanvas
                                                selectedStage={selectedStage}
                                                onStageClick={setSelectedStage}
                                            />
                                        </div>

                                        {/* Real-time Metrics */}
                                        <div className='px-4 py-3 bg-blue-50/30 border-t border-blue-100'>
                                            <h4 className='text-xs font-semibold text-gray-700 mb-2'>
                                                Live Metrics
                                            </h4>
                                            <div className='grid grid-cols-3 gap-3 text-xs'>
                                                <div className='bg-white p-2 rounded border border-gray-200'>
                                                    <div className='text-gray-500 mb-1'>
                                                        CPU Usage
                                                    </div>
                                                    <div className='flex items-center gap-2'>
                                                        <div className='flex-1 bg-blue-100 rounded-full h-1.5'>
                                                            <div
                                                                className='bg-blue-600 h-1.5 rounded-full'
                                                                style={{
                                                                    width: '45%',
                                                                }}
                                                            ></div>
                                                        </div>
                                                        <span className='text-gray-900 font-semibold text-[10px]'>
                                                            45%
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className='bg-white p-2 rounded border border-gray-200'>
                                                    <div className='text-gray-500 mb-1'>
                                                        Memory
                                                    </div>
                                                    <div className='flex items-center gap-2'>
                                                        <div className='flex-1 bg-blue-100 rounded-full h-1.5'>
                                                            <div
                                                                className='bg-blue-500 h-1.5 rounded-full'
                                                                style={{
                                                                    width: '62%',
                                                                }}
                                                            ></div>
                                                        </div>
                                                        <span className='text-gray-900 font-semibold text-[10px]'>
                                                            62%
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className='bg-white p-2 rounded border border-gray-200'>
                                                    <div className='text-gray-500 mb-1'>
                                                        Network
                                                    </div>
                                                    <div className='flex items-center gap-2'>
                                                        <div className='flex-1 bg-blue-100 rounded-full h-1.5'>
                                                            <div
                                                                className='bg-blue-400 h-1.5 rounded-full'
                                                                style={{
                                                                    width: '28%',
                                                                }}
                                                            ></div>
                                                        </div>
                                                        <span className='text-gray-900 font-semibold text-[10px]'>
                                                            28%
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Test Results Summary (if applicable) */}
                                        <div className='px-4 py-3 border-t border-gray-200 bg-white d-none'>
                                            <h4 className='text-xs font-semibold text-gray-700 mb-2'>
                                                Test Results
                                            </h4>
                                            <div className='flex items-center gap-4 text-xs'>
                                                <div className='flex items-center gap-1.5'>
                                                    <span className='w-2 h-2 bg-blue-500 rounded-full'></span>
                                                    <span className='text-gray-500'>
                                                        Passed:
                                                    </span>
                                                    <span className='text-blue-700 font-semibold'>
                                                        124
                                                    </span>
                                                </div>
                                                <div className='flex items-center gap-1.5'>
                                                    <span className='w-2 h-2 bg-red-500 rounded-full'></span>
                                                    <span className='text-gray-500'>
                                                        Failed:
                                                    </span>
                                                    <span className='text-gray-900 font-semibold'>
                                                        3
                                                    </span>
                                                </div>
                                                <div className='flex items-center gap-1.5'>
                                                    <span className='w-2 h-2 bg-blue-300 rounded-full'></span>
                                                    <span className='text-gray-500'>
                                                        Skipped:
                                                    </span>
                                                    <span className='text-gray-900 font-semibold'>
                                                        8
                                                    </span>
                                                </div>
                                                <div className='ml-auto'>
                                                    <span className='text-gray-500'>
                                                        Coverage:
                                                    </span>
                                                    <span className='text-gray-900 font-semibold ml-1'>
                                                        87.5%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Artifact Tab Content */}
                                {activeExecutionTab === 'artifact' && (
                                    <div className='space-y-4'>
                                        <div className='flex items-center justify-between'>
                                            <h3 className='text-sm font-semibold text-gray-700'>
                                                Build Artifacts
                                            </h3>
                                            <span className='text-xs text-gray-500'>
                                                3 items
                                            </span>
                                        </div>

                                        <div className='space-y-2'>
                                            {/* Artifact 1 */}
                                            <div className='flex items-center gap-3 p-3 bg-blue-50/30 rounded-lg hover:bg-blue-50 transition-colors'>
                                                <div className='flex-shrink-0 w-10 h-10 bg-blue-100 rounded flex items-center justify-center'>
                                                    <svg
                                                        className='w-5 h-5 text-blue-600'
                                                        fill='none'
                                                        stroke='currentColor'
                                                        viewBox='0 0 24 24'
                                                    >
                                                        <path
                                                            strokeLinecap='round'
                                                            strokeLinejoin='round'
                                                            strokeWidth={2}
                                                            d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                                                        />
                                                    </svg>
                                                </div>
                                                <div className='flex-1 min-w-0'>
                                                    <p className='text-sm font-medium text-gray-900 truncate'>
                                                        build-artifact-v1.2.3.zip
                                                    </p>
                                                    <p className='text-xs text-gray-500'>
                                                        2.4 MB • 5 mins ago
                                                    </p>
                                                </div>
                                                <button className='flex-shrink-0 p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors'>
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
                                                            d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4'
                                                        />
                                                    </svg>
                                                </button>
                                            </div>

                                            {/* Artifact 2 */}
                                            <div className='flex items-center gap-3 p-3 bg-blue-50/30 rounded-lg hover:bg-blue-50 transition-colors'>
                                                <div className='flex-shrink-0 w-10 h-10 bg-blue-100 rounded flex items-center justify-center'>
                                                    <svg
                                                        className='w-5 h-5 text-blue-600'
                                                        fill='none'
                                                        stroke='currentColor'
                                                        viewBox='0 0 24 24'
                                                    >
                                                        <path
                                                            strokeLinecap='round'
                                                            strokeLinejoin='round'
                                                            strokeWidth={2}
                                                            d='M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z'
                                                        />
                                                    </svg>
                                                </div>
                                                <div className='flex-1 min-w-0'>
                                                    <p className='text-sm font-medium text-gray-900 truncate'>
                                                        test-results.xml
                                                    </p>
                                                    <p className='text-xs text-gray-500'>
                                                        124 KB • 5 mins ago
                                                    </p>
                                                </div>
                                                <button className='flex-shrink-0 p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors'>
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
                                                            d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4'
                                                        />
                                                    </svg>
                                                </button>
                                            </div>

                                            {/* Artifact 3 */}
                                            <div className='flex items-center gap-3 p-3 bg-blue-50/30 rounded-lg hover:bg-blue-50 transition-colors'>
                                                <div className='flex-shrink-0 w-10 h-10 bg-blue-100 rounded flex items-center justify-center'>
                                                    <svg
                                                        className='w-5 h-5 text-blue-600'
                                                        fill='none'
                                                        stroke='currentColor'
                                                        viewBox='0 0 24 24'
                                                    >
                                                        <path
                                                            strokeLinecap='round'
                                                            strokeLinejoin='round'
                                                            strokeWidth={2}
                                                            d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                                                        />
                                                    </svg>
                                                </div>
                                                <div className='flex-1 min-w-0'>
                                                    <p className='text-sm font-medium text-gray-900 truncate'>
                                                        deployment-manifest.yaml
                                                    </p>
                                                    <p className='text-xs text-gray-500'>
                                                        8 KB • 5 mins ago
                                                    </p>
                                                </div>
                                                <button className='flex-shrink-0 p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors'>
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
                                                            d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4'
                                                        />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>

                                        <div className='mt-6 pt-4 border-t border-gray-200'>
                                            <button className='w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors'>
                                                Download All Artifacts
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Build Tab Content */}
                                {activeExecutionTab === 'build' && (
                                    <div className='space-y-4'>
                                        <div>
                                            <h3 className='text-sm font-semibold text-gray-700 mb-3'>
                                                Build Information
                                            </h3>
                                            <div className='bg-blue-50/30 rounded-lg p-4 space-y-3'>
                                                <div className='grid grid-cols-2 gap-4'>
                                                    <div>
                                                        <span className='text-xs text-gray-500'>
                                                            Build Number
                                                        </span>
                                                        <p className='text-sm font-semibold text-gray-900'>
                                                            #3
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className='text-xs text-gray-500'>
                                                            Branch
                                                        </span>
                                                        <p className='text-sm font-semibold text-gray-900'>
                                                            main
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className='text-xs text-gray-500'>
                                                            Commit
                                                        </span>
                                                        <p className='text-sm font-mono text-gray-900'>
                                                            a1b2c3d
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className='text-xs text-gray-500'>
                                                            Duration
                                                        </span>
                                                        <p className='text-sm font-semibold text-gray-900'>
                                                            3 min 28s
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className='text-sm font-semibold text-gray-700 mb-3'>
                                                Environment Variables
                                            </h3>
                                            <div className='bg-blue-50/30 rounded-lg p-4'>
                                                <div className='space-y-2 text-xs font-mono'>
                                                    <div className='flex items-center justify-between'>
                                                        <span className='text-gray-600'>
                                                            NODE_ENV
                                                        </span>
                                                        <span className='text-blue-700 font-medium'>
                                                            production
                                                        </span>
                                                    </div>
                                                    <div className='flex items-center justify-between'>
                                                        <span className='text-gray-600'>
                                                            API_URL
                                                        </span>
                                                        <span className='text-blue-700 font-medium'>
                                                            https://api.example.com
                                                        </span>
                                                    </div>
                                                    <div className='flex items-center justify-between'>
                                                        <span className='text-gray-600'>
                                                            BUILD_ID
                                                        </span>
                                                        <span className='text-blue-700 font-medium'>
                                                            cd36c104-5940
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className='text-sm font-semibold text-gray-700 mb-3'>
                                                Build Configuration
                                            </h3>
                                            <div className='bg-blue-50/30 rounded-lg p-4'>
                                                <pre className='text-xs font-mono text-blue-700 overflow-x-auto'>
                                                    {`{
  "name": "build-job",
  "version": "1.2.3",
  "environment": "production",
  "deployment": "automatic"
}`}
                                                </pre>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Notification Component */}
            {showNotification && (
                <motion.div
                    initial={{opacity: 0, y: -50, scale: 0.9}}
                    animate={{opacity: 1, y: 0, scale: 1}}
                    exit={{opacity: 0, y: -50, scale: 0.9}}
                    transition={{duration: 0.3, ease: 'easeOut'}}
                    className='fixed z-50 max-w-sm'
                    style={{top: '40px', right: '20px'}}
                >
                    <div className='bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500 rounded-lg shadow-lg'>
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
                                            d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
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
                                        className='inline-flex text-blue-400 hover:text-blue-600'
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
