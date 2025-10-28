'use client';

import {useEffect, useMemo, useRef, useState, useCallback} from 'react';
import ConfirmModal from '@/components/ConfirmModal';
import {motion} from 'framer-motion';
import EmptyState from '@/components/EmptyState';
// @ts-ignore
import * as XLSX from 'xlsx';
import ReusableTableComponent from '@/components/reusable/ReusableTableComponent';
import CredentialManager_tableConfig from '@/config/CredentialManager_tableConfig';
import {
    EllipsisVerticalIcon,
    EyeIcon,
    PencilSquareIcon,
    TrashIcon,
    KeyIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    ArrowsUpDownIcon,
    Squares2X2Icon,
    BookmarkIcon,
    ShieldCheckIcon,
    InformationCircleIcon,
} from '@heroicons/react/24/outline';

interface CredentialRecord {
    id: string;
    credentialName: string;
    description: string;
    entity: string;
    connector: string;
    authenticationType:
        | 'API_KEY'
        | 'OAUTH'
        | 'BASIC_AUTH'
        | 'TOKEN'
        | 'CERTIFICATE';
    lastUpdated: string;
    createdAt: string;
    createdBy: string;
}

// Reusable trash button (copied from manage users)
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
            id='credential-trash-target'
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
        >
            <TrashIcon
                className={`w-5 h-5 transition-colors duration-300 ${
                    over ? 'text-white' : 'text-red-600 group-hover:text-white'
                }`}
            />
            <style jsx>{`
                .drag-over {
                    animation: trashBounce 0.6s ease-in-out infinite;
                }
                @keyframes trashBounce {
                    0%,
                    100% {
                        transform: scale(1.1) translateY(0);
                    }
                    50% {
                        transform: scale(1.1) translateY(-4px);
                    }
                }
            `}</style>
        </motion.button>
    );
}

export default function CredentialManager() {
    const [credentials, setCredentials] = useState<CredentialRecord[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const [showSearchBar, setShowSearchBar] = useState(false);
    const [showCreateInline, setShowCreateInline] = useState(false);
    const [showCredentialTable, setShowCredentialTable] = useState(false);
    const [tableData, setTableData] = useState<any[]>([]);
    const [saveNotifications, setSaveNotifications] = useState<
        Array<{id: string; message: string; timestamp: number}>
    >([]);

    // Function to show save notification
    const showSaveNotification = useCallback((message: string) => {
        const id = Date.now().toString();
        const notification = {
            id,
            message,
            timestamp: Date.now(),
        };

        setSaveNotifications((prev) => [...prev, notification]);

        // Auto-remove notification after 3 seconds
        setTimeout(() => {
            setSaveNotifications((prev) => prev.filter((n) => n.id !== id));
        }, 3000);
    }, []);

    // Load credentials from API
    const loadCredentials = useCallback(async () => {
        try {
            setLoading(true);
            const apiBase =
                process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
            const response = await fetch(`${apiBase}/api/credentials`);

            if (!response.ok) {
                throw new Error(
                    `Failed to fetch credentials: ${response.status}`,
                );
            }

            const credentialsData = await response.json();
            setCredentials(credentialsData);
            setTableData(credentialsData);
        } catch (error) {
            console.error('Error loading credentials:', error);
            setCredentials([]);
            setTableData([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCredentials();
    }, []); // Empty dependency array to load only once

    // Handle create credential - navigate to create form
    const handleCreateCredential = useCallback(() => {
        console.log('➕ Creating new credential...');
        // TODO: Navigate to credential creation form or modal
        // For now, just show the table
        setShowCredentialTable(true);
    }, []);

    // Confirm delete
    const confirmDelete = useCallback(() => {
        if (pendingDeleteId) {
            console.log('✅ Confirmed delete for credential:', pendingDeleteId);
            setCredentials((prev) =>
                prev.filter((c) => c.id !== pendingDeleteId),
            );
            setTableData((prev) =>
                prev.filter((c) => c.id !== pendingDeleteId),
            );
            setPendingDeleteId(null);
            showSaveNotification('Credential deleted successfully');
        }
    }, [pendingDeleteId, showSaveNotification]);

    // Handle table data changes
    const handleTableDataChange = useCallback((newData: any[]) => {
        console.log('📊 Table data changed:', newData);
        setTableData(newData);

        // Convert to credential format
        const credentialData = newData.map((item) => ({
            id: item.id || `tmp-${Date.now()}`,
            credentialName: item.credentialName || '',
            description: item.description || '',
            entity: item.entity || '',
            connector: item.connector || '',
            authenticationType: item.authenticationType || 'API_KEY',
            lastUpdated: item.lastUpdated || new Date().toISOString(),
            createdAt: item.createdAt || new Date().toISOString(),
            createdBy: item.createdBy || 'current-user',
        }));

        setCredentials(credentialData);
    }, []);

    return (
        <div className='h-full bg-white flex flex-col relative -mx-4 -my-3'>
            {/* Save Notifications */}
            <div
                style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    zIndex: 10000,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                }}
            >
                {saveNotifications.map((notification, index) => (
                    <div
                        key={notification.id}
                        className='save-notification-toast'
                        style={{
                            animationDelay: `${index * 100}ms`,
                        }}
                    >
                        {notification.message}
                    </div>
                ))}
            </div>

            {/* Header */}
            <div className='bg-white border-b border-gray-200 px-8 py-3'>
                <div>
                    <h1 className='text-xl font-bold text-gray-900'>
                        Credential Manager
                    </h1>
                    <p className='text-sm text-gray-600 mt-0.5'>
                        Enterprise credential vault for secure API keys and
                        authentication tokens
                    </p>
                </div>
            </div>

            {/* Action Bar */}
            <div className='bg-white border-b border-gray-200 px-8 py-3'>
                <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-2'>
                        {/* Create Credential Button */}
                        <motion.button
                            onClick={handleCreateCredential}
                            className='inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm text-sm font-medium'
                            whileHover={{scale: 1.02}}
                            whileTap={{scale: 0.98}}
                        >
                            <PlusIcon className='w-4 h-4 mr-2' />
                            New Credential
                        </motion.button>

                        {/* Search Button */}
                        <motion.button
                            onClick={() => setShowSearchBar(!showSearchBar)}
                            className={`inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium transition-colors duration-200 ${
                                showSearchBar
                                    ? 'bg-blue-50 text-blue-700 border-blue-300'
                                    : 'bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                            whileHover={{scale: 1.02}}
                            whileTap={{scale: 0.98}}
                        >
                            <MagnifyingGlassIcon className='w-4 h-4 mr-1' />
                            Search
                        </motion.button>

                        {/* Filter Button */}
                        <motion.button
                            className='inline-flex items-center px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 transition-colors duration-200 text-sm font-medium'
                            whileHover={{scale: 1.02}}
                            whileTap={{scale: 0.98}}
                        >
                            <FunnelIcon className='w-4 h-4 mr-1' />
                            Filter
                        </motion.button>

                        {/* Sort Button */}
                        <motion.button
                            className='inline-flex items-center px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 transition-colors duration-200 text-sm font-medium'
                            whileHover={{scale: 1.02}}
                            whileTap={{scale: 0.98}}
                        >
                            <ArrowsUpDownIcon className='w-4 h-4 mr-1' />
                            Sort
                        </motion.button>

                        {/* Hide Button */}
                        <motion.button
                            className='inline-flex items-center px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 transition-colors duration-200 text-sm font-medium'
                            whileHover={{scale: 1.02}}
                            whileTap={{scale: 0.98}}
                        >
                            <Squares2X2Icon className='w-4 h-4 mr-1' />
                            Hide
                        </motion.button>

                        {/* Group By Button */}
                        <motion.button
                            className='inline-flex items-center px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 transition-colors duration-200 text-sm font-medium'
                            whileHover={{scale: 1.02}}
                            whileTap={{scale: 0.98}}
                        >
                            <Squares2X2Icon className='w-4 h-4 mr-1' />
                            Group by
                        </motion.button>

                        {/* Views Button */}
                        <motion.button
                            className='inline-flex items-center px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 transition-colors duration-200 text-sm font-medium'
                            whileHover={{scale: 1.02}}
                            whileTap={{scale: 0.98}}
                        >
                            Views
                        </motion.button>

                        {/* More Options */}
                        <motion.button
                            className='inline-flex items-center px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 transition-colors duration-200 text-sm font-medium'
                            whileHover={{scale: 1.02}}
                            whileTap={{scale: 0.98}}
                        >
                            <EllipsisVerticalIcon className='w-4 h-4' />
                        </motion.button>

                        {/* Trash Button */}
                        <ToolbarTrashButton
                            onClick={() => console.log('Trash clicked')}
                        />
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className='flex-1 overflow-hidden bg-white'>
                {loading ? (
                    // Loading State - Same as Enterprise Configuration
                    <div className='bg-white rounded-lg border border-slate-200 p-12 text-center'>
                        <div className='mx-auto max-w-md'>
                            <div className='mx-auto h-12 w-12 text-blue-600 animate-spin'>
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
                                Loading Credential Manager
                            </h3>
                            <p className='mt-2 text-sm text-slate-500'>
                                Please wait while we fetch your credentials...
                            </p>
                        </div>
                    </div>
                ) : credentials.length === 0 ? (
                    <EmptyState
                        title="No Credentials Yet"
                        description="Add your first credential to securely store and manage API keys, tokens, and authentication information."
                        imagePath="/images/Infographics/SG-no-credentials-yet.jpg"
                        actionButton={{
                            label: "Add Credential",
                            onClick: handleCreateCredential
                        }}
                    />
                ) : (
                    /* Reusable Table Component */
                    <div className='h-full w-full overflow-hidden px-4'>
                        <ReusableTableComponent
                            config={
                                {
                                    ...CredentialManager_tableConfig,
                                    initialData: tableData,
                                    currentUser: {
                                        accountId: 3,
                                        enterpriseId: 1,
                                        userId: 'current-user',
                                        userName: 'Current User',
                                    },
                                    breadcrumbData: {
                                        accountId: 3,
                                        enterpriseId: 1,
                                    },
                                } as any
                            }
                        />
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {pendingDeleteId && (
                <ConfirmModal
                    open={!!pendingDeleteId}
                    onCancel={() => setPendingDeleteId(null)}
                    onConfirm={confirmDelete}
                    title='Delete Credential'
                    message='Are you sure you want to delete this credential? This action cannot be undone.'
                    confirmText='Delete'
                    cancelText='Cancel'
                />
            )}

            {/* CSS for save notifications */}
            <style jsx>{`
                .save-notification-toast {
                    background: linear-gradient(
                        135deg,
                        #10b981 0%,
                        #059669 100%
                    );
                    color: white;
                    padding: 12px 16px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    font-size: 14px;
                    font-weight: 500;
                    animation: slideInFromRight 0.3s ease-out forwards;
                    max-width: 300px;
                    word-wrap: break-word;
                }

                @keyframes slideInFromRight {
                    from {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
            `}</style>
        </div>
    );
}
