'use client';

import {useEffect, useMemo, useRef, useState, useCallback} from 'react';
import {useRouter} from 'next/navigation';
import ConfirmModal from '@/components/ConfirmModal';
import {motion, AnimatePresence} from 'framer-motion';
// @ts-ignore
import * as XLSX from 'xlsx';
import {
    EllipsisVerticalIcon,
    EyeIcon,
    PencilSquareIcon,
    TrashIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    ArrowsUpDownIcon,
    Squares2X2Icon,
    BookmarkIcon,
    ShieldCheckIcon,
    InformationCircleIcon,
    XMarkIcon,
    GlobeAltIcon,
} from '@heroicons/react/24/outline';
import EnterpriseConfigTable, {
    EnterpriseConfigRow,
} from '@/components/EnterpriseConfigTable';

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
    createdAt?: string;
    updatedAt?: string;
}

// Reusable trash button
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
            id='environment-trash-target'
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

export default function EnvironmentsPage() {
    const router = useRouter();
    const [environments, setEnvironments] = useState<EnvironmentRecord[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const [showSearchBar, setShowSearchBar] = useState(false);
    const [showCreatePanel, setShowCreatePanel] = useState(false);
    const [editingEnvironment, setEditingEnvironment] =
        useState<EnvironmentRecord | null>(null);
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

    // Load environments from API
    const loadEnvironments = useCallback(async () => {
        try {
            setLoading(true);
            const apiBase =
                process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
            const response = await fetch(`${apiBase}/api/environments`);

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
    }, [loadEnvironments]);

    // Filter environments based on search
    const filteredEnvironments = useMemo(() => {
        if (!search.trim()) return environments;
        const lowerSearch = search.toLowerCase();
        return environments.filter(
            (env) =>
                env.environmentName.toLowerCase().includes(lowerSearch) ||
                env.details.toLowerCase().includes(lowerSearch) ||
                env.deploymentType.toLowerCase().includes(lowerSearch) ||
                env.status.toLowerCase().includes(lowerSearch),
        );
    }, [environments, search]);

    // Convert environments to table rows
    const tableRows: EnterpriseConfigRow[] = useMemo(() => {
        return filteredEnvironments.map((env) => {
            // Format status badge
            const statusBadge = env.status || 'PENDING';
            const statusColors = {
                ACTIVE: '🟢',
                INACTIVE: '⚪',
                PENDING: '🟡',
            };
            const statusText = `${
                statusColors[statusBadge as keyof typeof statusColors]
            } ${statusBadge}`;

            // Format connectivity badge
            const connectivity = env.testConnectivity || 'Not Tested';
            const connectivityColors = {
                Success: '✅',
                Failed: '❌',
                Pending: '⏳',
                'Not Tested': '⚪',
            };
            const connectivityText = `${
                connectivityColors[
                    connectivity as keyof typeof connectivityColors
                ]
            } ${connectivity}`;

            return {
                id: env.id,
                enterprise: env.environmentName,
                product: `${env.details} | ${connectivityText} | ${statusText}`,
                services: env.deploymentType,
                status: env.status,
                testConnectivity: env.testConnectivity,
                url: env.url,
                credentialName: env.credentialName,
                tags: env.tags,
                environmentType: env.environmentType,
            };
        });
    }, [filteredEnvironments]);

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

                showSaveNotification('Environment deleted successfully');
                await loadEnvironments();
            } catch (error) {
                console.error('Error deleting environment:', error);
                showSaveNotification('Failed to delete environment');
            } finally {
                setPendingDeleteId(null);
            }
        },
        [loadEnvironments, showSaveNotification],
    );

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

    const handleCreateEnvironment = useCallback(() => {
        setEditingEnvironment(null);
        setShowCreatePanel(true);
    }, []);

    const handleClosePanel = useCallback(() => {
        setShowCreatePanel(false);
        setEditingEnvironment(null);
    }, []);

    const handleEnvironmentSaved = useCallback(() => {
        setShowCreatePanel(false);
        setEditingEnvironment(null);
        loadEnvironments();
        showSaveNotification('Environment saved successfully');
    }, [loadEnvironments, showSaveNotification]);

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
            <div className='bg-white border-b border-slate-200 px-8 py-6'>
                <div className='flex items-start justify-between'>
                    <div>
                        <h1 className='text-3xl font-bold text-slate-900 flex items-center gap-3'>
                            <GlobeAltIcon className='w-8 h-8 text-blue-600' />
                            Environments
                        </h1>
                        <p className='mt-2 text-sm text-slate-600'>
                            Manage deployment environments and test connectivity
                        </p>
                    </div>
                </div>
            </div>

            {/* Separator */}
            <div className='h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent' />

            {/* Toolbar */}
            <div className='bg-white border-b border-slate-200 px-8 py-4'>
                <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                        {/* Create Environment Button */}
                        <motion.button
                            onClick={handleCreateEnvironment}
                            className='inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg'
                            whileHover={{scale: 1.02}}
                            whileTap={{scale: 0.98}}
                        >
                            <PlusIcon className='w-5 h-5' />
                            <span className='font-medium'>
                                Create Environment
                            </span>
                        </motion.button>

                        {/* Action Buttons */}
                        <motion.button
                            onClick={() => setShowSearchBar(!showSearchBar)}
                            className='inline-flex items-center justify-center w-10 h-10 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 transition-colors'
                            whileHover={{scale: 1.05}}
                            whileTap={{scale: 0.95}}
                            title='Search'
                        >
                            <MagnifyingGlassIcon className='w-5 h-5 text-slate-600' />
                        </motion.button>

                        <motion.button
                            className='inline-flex items-center justify-center w-10 h-10 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 transition-colors'
                            whileHover={{scale: 1.05}}
                            whileTap={{scale: 0.95}}
                            title='Filter'
                        >
                            <FunnelIcon className='w-5 h-5 text-slate-600' />
                        </motion.button>

                        <motion.button
                            className='inline-flex items-center justify-center w-10 h-10 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 transition-colors'
                            whileHover={{scale: 1.05}}
                            whileTap={{scale: 0.95}}
                            title='Sort'
                        >
                            <ArrowsUpDownIcon className='w-5 h-5 text-slate-600' />
                        </motion.button>

                        <motion.button
                            className='inline-flex items-center justify-center w-10 h-10 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 transition-colors'
                            whileHover={{scale: 1.05}}
                            whileTap={{scale: 0.95}}
                            title='Group'
                        >
                            <Squares2X2Icon className='w-5 h-5 text-slate-600' />
                        </motion.button>

                        <ToolbarTrashButton onClick={() => {}} />
                    </div>

                    {/* Search Bar */}
                    {showSearchBar && (
                        <motion.div
                            initial={{opacity: 0, width: 0}}
                            animate={{opacity: 1, width: 'auto'}}
                            exit={{opacity: 0, width: 0}}
                            className='flex items-center gap-2'
                        >
                            <input
                                type='text'
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder='Search environments...'
                                className='px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                            />
                            <button
                                onClick={() => {
                                    setSearch('');
                                    setShowSearchBar(false);
                                }}
                                className='p-2 hover:bg-slate-100 rounded-lg transition-colors'
                            >
                                <XMarkIcon className='w-5 h-5 text-slate-600' />
                            </button>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className='flex-1 overflow-auto px-8 py-6'>
                {loading ? (
                    <div className='flex items-center justify-center h-full'>
                        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600' />
                    </div>
                ) : (
                    <EnterpriseConfigTable
                        rows={tableRows}
                        onEdit={handleEdit}
                        onDelete={(id: string) => setPendingDeleteId(id)}
                        title='Environments'
                        groupByExternal='none'
                        onGroupByChange={() => {}}
                        hideControls={false}
                        visibleColumns={['enterprise', 'product', 'services']}
                        highlightQuery=''
                        customColumnLabels={{
                            enterprise: 'Environment Name',
                            product: 'Details',
                            services: 'Deployment Type',
                        }}
                    />
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                open={!!pendingDeleteId}
                onCancel={() => setPendingDeleteId(null)}
                onConfirm={() =>
                    pendingDeleteId && handleDelete(pendingDeleteId)
                }
                title='Delete Environment'
                message='Are you sure you want to delete this environment? This action cannot be undone.'
                confirmText='Delete'
                cancelText='Cancel'
            />

            {/* Environment Creation/Edit Panel */}
            {showCreatePanel && (
                <EnvironmentSlidingPanel
                    isOpen={showCreatePanel}
                    onClose={handleClosePanel}
                    onSave={handleEnvironmentSaved}
                    editingEnvironment={editingEnvironment}
                />
            )}
        </div>
    );
}

// Environment Sliding Panel Component
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

    const steps = ['Overview', 'Details', 'Credentials', 'Connection Test'];

    const handleInputChange = (field: string, value: any) => {
        setFormData((prev) => ({...prev, [field]: value}));
    };

    const handleAddTag = () => {
        if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
            handleInputChange('tags', [...formData.tags, tagInput.trim()]);
            setTagInput('');
        }
    };

    const handleRemoveTag = (tag: string) => {
        handleInputChange(
            'tags',
            formData.tags.filter((t) => t !== tag),
        );
    };

    const handleTestConnection = async () => {
        setTestingConnection(true);
        setConnectionResult(null);

        try {
            // Simulate connection test
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Validate that we have all required fields
            if (!formData.url || !formData.credentialName) {
                setConnectionResult('failed');
                return;
            }

            // Simulate success
            setConnectionResult('success');
        } catch (error) {
            setConnectionResult('failed');
        } finally {
            setTestingConnection(false);
        }
    };

    const handleSaveAndContinue = async () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleFinish = async () => {
        try {
            const apiBase =
                process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
            const method = editingEnvironment ? 'PUT' : 'POST';
            const url = editingEnvironment
                ? `${apiBase}/api/environments/${editingEnvironment.id}`
                : `${apiBase}/api/environments`;

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
            };

            const response = await fetch(url, {
                method,
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

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 ${
                    isOpen ? 'opacity-40' : 'opacity-0 pointer-events-none'
                }`}
                onClick={onClose}
            />

            {/* Sliding Panel */}
            <div
                className={`fixed right-0 top-0 h-full w-[1100px] shadow-2xl transform transition-transform duration-300 z-50 flex ${
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                {/* Left Sidebar - Dark Blue with Steps */}
                <div className='w-[370px] bg-gradient-to-b from-[#0f172a] to-[#1e293b] text-white flex flex-col'>
                    {/* GitHub Logo and Title */}
                    <div className='p-6 border-b border-white/10'>
                        <div className='flex items-center gap-3'>
                            <div className='w-12 h-12 bg-white rounded-lg flex items-center justify-center'>
                                <GlobeAltIcon className='w-8 h-8 text-slate-800' />
                            </div>
                            <span className='text-xl font-semibold'>
                                Environment
                            </span>
                        </div>
                    </div>

                    {/* Steps Navigation */}
                    <div className='flex-1 p-6'>
                        <div className='space-y-6'>
                            {steps.map((step, index) => (
                                <div key={step} className='relative'>
                                    {/* Connecting Line */}
                                    {index < steps.length - 1 && (
                                        <div className='absolute left-[19px] top-10 w-0.5 h-12 bg-blue-500/30' />
                                    )}

                                    <div className='flex items-start gap-4'>
                                        {/* Step Number Circle */}
                                        <div
                                            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                                                index === currentStep
                                                    ? 'bg-blue-500 text-white ring-4 ring-blue-500/30'
                                                    : index < currentStep
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-slate-700 text-slate-400 border-2 border-slate-600'
                                            }`}
                                        >
                                            {index + 1}
                                        </div>

                                        {/* Step Info */}
                                        <div className='flex-1 pt-1'>
                                            <div className='text-xs text-slate-400 uppercase tracking-wider mb-1'>
                                                STEP {index + 1}
                                            </div>
                                            <div
                                                className={`font-medium ${
                                                    index === currentStep
                                                        ? 'text-white'
                                                        : index < currentStep
                                                        ? 'text-blue-300'
                                                        : 'text-slate-500'
                                                }`}
                                            >
                                                {step}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Decorative Bottom Element */}
                    <div className='p-6'>
                        <div className='w-32 h-32 rounded-full bg-blue-500/10 blur-2xl' />
                    </div>
                </div>

                {/* Right Content Area - White */}
                <div className='flex-1 bg-white flex flex-col'>
                    {/* Header */}
                    <div className='border-b border-slate-200 px-8 py-6'>
                        <div className='flex items-center justify-between'>
                            <div>
                                <h2 className='text-2xl font-semibold text-slate-900'>
                                    {steps[currentStep]}
                                </h2>
                                <p className='text-sm text-slate-600 mt-1'>
                                    {currentStep === 0 &&
                                        'Basic connector information and settings'}
                                    {currentStep === 1 &&
                                        'Configure environment details'}
                                    {currentStep === 2 &&
                                        'Set up authentication credentials'}
                                    {currentStep === 3 &&
                                        'Test your connection'}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className='p-2 hover:bg-slate-100 rounded-lg transition-colors'
                            >
                                <XMarkIcon className='w-6 h-6 text-slate-600' />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className='flex-1 overflow-y-auto p-8'>
                        {/* Step 1: Overview */}
                        {currentStep === 0 && (
                            <div className='space-y-6 max-w-2xl'>
                                <div>
                                    <label className='block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2'>
                                        Name
                                        <span className='text-red-500'>*</span>
                                        <InformationCircleIcon className='w-4 h-4 text-slate-400' />
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
                                        className='w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                        placeholder='Enter environment name'
                                    />
                                </div>

                                <div>
                                    <label className='block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2'>
                                        Description
                                        <InformationCircleIcon className='w-4 h-4 text-slate-400' />
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
                                        className='w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                        placeholder='Enter environment description'
                                    />
                                </div>

                                <div>
                                    <label className='block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2'>
                                        Tags
                                        <InformationCircleIcon className='w-4 h-4 text-slate-400' />
                                    </label>
                                    <input
                                        type='text'
                                        value={tagInput}
                                        onChange={(e) =>
                                            setTagInput(e.target.value)
                                        }
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddTag();
                                            }
                                        }}
                                        className='w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                        placeholder='Add tags (press Enter)'
                                    />
                                    <div className='flex flex-wrap gap-2 mt-3'>
                                        {formData.tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className='inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm'
                                            >
                                                {tag}
                                                <button
                                                    onClick={() =>
                                                        handleRemoveTag(tag)
                                                    }
                                                    className='hover:bg-blue-200 rounded-full p-0.5'
                                                >
                                                    <XMarkIcon className='w-4 h-4' />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Details */}
                        {currentStep === 1 && (
                            <div className='space-y-6 max-w-2xl'>
                                <div>
                                    <label className='block text-sm font-medium text-slate-700 mb-2'>
                                        Deployment Type
                                    </label>
                                    <div className='grid grid-cols-2 gap-4'>
                                        {['Integration', 'Extension'].map(
                                            (type) => (
                                                <button
                                                    key={type}
                                                    onClick={() =>
                                                        handleInputChange(
                                                            'deploymentType',
                                                            type,
                                                        )
                                                    }
                                                    className={`p-4 border-2 rounded-lg transition-all ${
                                                        formData.deploymentType ===
                                                        type
                                                            ? 'border-blue-600 bg-blue-50'
                                                            : 'border-slate-300 hover:border-slate-400'
                                                    }`}
                                                >
                                                    <span className='font-medium text-slate-900'>
                                                        {type}
                                                    </span>
                                                </button>
                                            ),
                                        )}
                                    </div>
                                </div>

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
                                                    className={`p-6 border-2 rounded-lg transition-all ${
                                                        formData.environmentType ===
                                                        type
                                                            ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200'
                                                            : 'border-slate-300 hover:border-slate-400'
                                                    }`}
                                                >
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
                            <div className='space-y-6 max-w-2xl'>
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
                            <div className='space-y-6 max-w-2xl'>
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
                    <div className='border-t border-slate-200 px-8 py-4 bg-white'>
                        <div className='flex items-center justify-between'>
                            <div className='text-sm text-slate-600'>
                                Step {currentStep + 1} of {steps.length}
                            </div>

                            <div className='flex items-center gap-3'>
                                {currentStep < steps.length - 1 ? (
                                    <button
                                        onClick={handleSaveAndContinue}
                                        disabled={
                                            (currentStep === 0 &&
                                                !formData.name) ||
                                            (currentStep === 2 &&
                                                !formData.credentialName)
                                        }
                                        className='px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed font-medium'
                                    >
                                        Next
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleFinish}
                                        disabled={!connectionResult}
                                        className='px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed font-medium'
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
