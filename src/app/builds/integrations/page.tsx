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
import {api} from '@/utils/api';

export default function Integrations() {
    // Build data state
    const [builds, setBuilds] = useState<BuildRow[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);

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

    // Refs for click outside detection
    const searchRef = useRef<HTMLDivElement>(null);
    const filterRef = useRef<HTMLDivElement>(null);
    const sortRef = useRef<HTMLDivElement>(null);
    const hideRef = useRef<HTMLDivElement>(null);
    const groupRef = useRef<HTMLDivElement>(null);

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
            setBuilds([]);
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

    // Handle manual save
    const handleManualSave = async () => {
        // TODO: Implement save logic
        showBlueNotification('Successfully saved all changes.');
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
    }, []);

    return (
        <div className='h-full bg-secondary flex flex-col'>
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
                        {/* Create Build Button */}
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
                                {isLoading ? 'Loading...' : 'Create Build'}
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
                    </div>

                    {/* Right Side Actions */}
                    <div className='flex items-center gap-3'>
                        {/* Auto-Save Status */}
                        {isAutoSaving && (
                            <div className='flex items-center gap-2 text-sm text-gray-600'>
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
                                <span>Auto-saving...</span>
                            </div>
                        )}

                        {autoSaveCountdown !== null && (
                            <div className='text-sm text-gray-600'>
                                Auto-save in {autoSaveCountdown}s
                            </div>
                        )}

                        {/* Save Button */}
                        <button
                            onClick={handleManualSave}
                            className='inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-green-400 bg-green-500 text-white font-medium hover:bg-green-600 transition-all duration-300 transform hover:scale-105 shadow-md'
                        >
                            <BookmarkIcon className='w-4 h-4' />
                            <span className='text-sm'>Save</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className='flex-1 p-3 overflow-hidden'>
                <div className='h-full bg-card border border-light rounded-lg p-3 flex flex-col'>
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
                                    integration. Click the &quot;Create Build&quot; button
                                    above to begin.
                                </p>
                                <button
                                    onClick={handleAddNewBuild}
                                    className='inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700'
                                >
                                    <PlusIcon className='h-5 w-5' />
                                    <span>Create Your First Build</span>
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
                            onUpdateField={(rowId, key, value) => {
                                setBuilds((prev) =>
                                    prev.map((b) =>
                                        b.id === rowId
                                            ? {...b, [key]: value}
                                            : b,
                                    ),
                                );
                            }}
                            highlightQuery={appliedSearchTerm}
                            enableInlineEditing={true}
                            hideRowExpansion={false}
                        />
                    )}
                </div>
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
