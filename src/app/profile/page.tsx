'use client';

import {useState, useEffect} from 'react';
import {getCurrentUser} from '@/utils/auth';
import {
    User,
    Mail,
    Lock,
    Users,
    Shield,
    Globe,
    Clock,
    Bell,
    Activity,
    Settings,
    Database,
    Calendar,
    MapPin,
    Phone,
    Building,
} from 'lucide-react';

export default function ProfilePage() {
    const [currentUser, setCurrentUser] = useState({
        firstName: '',
        lastName: '',
        email: '',
        role: 'User',
    });
    const [isEditingName, setIsEditingName] = useState(false);
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [pipelineNotifications, setPipelineNotifications] = useState(true);
    const [deploymentNotifications, setDeploymentNotifications] =
        useState(true);

    useEffect(() => {
        const user = getCurrentUser();
        if (user) {
            setCurrentUser({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
                role: user.role || 'User',
            });
        }
    }, []);

    const getUserInitials = (firstName: string, lastName: string) => {
        const firstInitial = firstName?.charAt(0)?.toUpperCase() || '';
        const lastInitial = lastName?.charAt(0)?.toUpperCase() || '';
        return `${firstInitial}${lastInitial}`;
    };

    const handleNameEdit = () => {
        setIsEditingName(true);
    };

    const handleNameSave = () => {
        setIsEditingName(false);
        // TODO: Save to backend
    };

    return (
        <div className='h-full overflow-auto bg-secondary'>
            <div className='max-w-7xl mx-auto p-6'>
                {/* Header Section */}
                <div className='bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden'>
                    {/* Top Banner */}
                    <div className='h-24 bg-gradient-to-r from-[#1e3a8a] via-[#1e40af] to-[#1e3a8a]'></div>

                    {/* Profile Info */}
                    <div className='px-6 pb-6'>
                        <div className='flex items-start -mt-12 mb-4'>
                            <div className='w-24 h-24 bg-gradient-to-r from-[#0171EC] to-[#05E9FE] rounded-full flex items-center justify-center shadow-xl border-4 border-white'>
                                <span className='text-white font-bold text-3xl'>
                                    {getUserInitials(
                                        currentUser.firstName,
                                        currentUser.lastName,
                                    )}
                                </span>
                            </div>
                        </div>

                        <div className='flex items-center gap-2 mb-1'>
                            {isEditingName ? (
                                <div className='flex items-center gap-2'>
                                    <input
                                        type='text'
                                        value={currentUser.firstName}
                                        onChange={(e) =>
                                            setCurrentUser({
                                                ...currentUser,
                                                firstName: e.target.value,
                                            })
                                        }
                                        className='px-2 py-1 border border-slate-300 rounded text-2xl font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500'
                                        placeholder='First Name'
                                    />
                                    <input
                                        type='text'
                                        value={currentUser.lastName}
                                        onChange={(e) =>
                                            setCurrentUser({
                                                ...currentUser,
                                                lastName: e.target.value,
                                            })
                                        }
                                        className='px-2 py-1 border border-slate-300 rounded text-2xl font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500'
                                        placeholder='Last Name'
                                    />
                                    <button
                                        onClick={handleNameSave}
                                        className='px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors'
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={() => setIsEditingName(false)}
                                        className='px-3 py-1 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 transition-colors'
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <h1 className='text-2xl font-semibold text-slate-900'>
                                        {currentUser.firstName}{' '}
                                        {currentUser.lastName}
                                    </h1>
                                    <button
                                        onClick={handleNameEdit}
                                        className='p-1 hover:bg-slate-100 rounded transition-colors'
                                        title='Edit name'
                                    >
                                        <svg
                                            className='w-4 h-4 text-slate-400 hover:text-slate-600'
                                            fill='none'
                                            stroke='currentColor'
                                            viewBox='0 0 24 24'
                                        >
                                            <path
                                                strokeLinecap='round'
                                                strokeLinejoin='round'
                                                strokeWidth={2}
                                                d='M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z'
                                            />
                                        </svg>
                                    </button>
                                </>
                            )}
                        </div>
                        <div className='flex items-center gap-3'>
                            <p className='text-slate-600 text-sm'>
                                {currentUser.role}
                            </p>
                            <span className='text-slate-300'>•</span>
                            <p className='text-slate-500 text-xs'>
                                Member since{' '}
                                {new Date().toLocaleDateString('en-US', {
                                    month: 'long',
                                    year: 'numeric',
                                })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                <div className='mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6'>
                    {/* Left Sidebar */}
                    <div className='lg:col-span-1 space-y-6'>
                        {/* Basic Information */}
                        <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-6'>
                            <h2 className='text-lg font-semibold text-slate-900 mb-4'>
                                Basic Information
                            </h2>

                            <div className='space-y-4'>
                                <div className='flex items-start gap-3'>
                                    <Mail className='w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0' />
                                    <div className='flex-1 min-w-0'>
                                        <p className='text-xs text-slate-500 mb-0.5'>
                                            Email
                                        </p>
                                        <p className='text-sm text-slate-700 break-words'>
                                            {currentUser.email}
                                        </p>
                                    </div>
                                </div>

                                <div className='flex items-start gap-3'>
                                    <Shield className='w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0' />
                                    <div className='flex-1 min-w-0'>
                                        <p className='text-xs text-slate-500 mb-0.5'>
                                            Role
                                        </p>
                                        <p className='text-sm text-slate-700'>
                                            {currentUser.role}
                                        </p>
                                    </div>
                                </div>

                                <div className='border-t border-slate-200 pt-4 mt-4 space-y-3'>
                                    <button className='flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors'>
                                        <Lock className='w-4 h-4' />
                                        Change Password
                                    </button>

                                    <button className='flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors'>
                                        <Users className='w-4 h-4' />
                                        Switch Account
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Security */}
                        <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-6'>
                            <h2 className='text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2'>
                                <Shield className='w-5 h-5 text-slate-600' />
                                Security
                            </h2>
                            <div className='space-y-4'>
                                <div className='flex items-center justify-between'>
                                    <div>
                                        <p className='text-sm font-medium text-slate-700'>
                                            Two-Factor Authentication
                                        </p>
                                        <p className='text-xs text-slate-500 mt-0.5'>
                                            Add an extra layer of security
                                        </p>
                                    </div>
                                    <button
                                        onClick={() =>
                                            setTwoFactorEnabled(
                                                !twoFactorEnabled,
                                            )
                                        }
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                            twoFactorEnabled
                                                ? 'bg-blue-600'
                                                : 'bg-slate-300'
                                        }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                twoFactorEnabled
                                                    ? 'translate-x-6'
                                                    : 'translate-x-1'
                                            }`}
                                        />
                                    </button>
                                </div>
                                <div className='pt-3 border-t border-slate-200'>
                                    <div className='flex items-start gap-3'>
                                        <Clock className='w-4 h-4 text-slate-500 mt-0.5' />
                                        <div>
                                            <p className='text-xs text-slate-500 mb-0.5'>
                                                Last Login
                                            </p>
                                            <p className='text-sm text-slate-700'>
                                                {new Date().toLocaleString(
                                                    'en-US',
                                                    {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    },
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Account Details */}
                        <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-6'>
                            <h2 className='text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2'>
                                <Database className='w-5 h-5 text-slate-600' />
                                Account Details
                            </h2>
                            <div className='space-y-3'>
                                <div className='flex items-start gap-3'>
                                    <Building className='w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0' />
                                    <div className='flex-1 min-w-0'>
                                        <p className='text-xs text-slate-500 mb-0.5'>
                                            Organization
                                        </p>
                                        <p className='text-sm text-slate-700'>
                                            Systiva
                                        </p>
                                    </div>
                                </div>
                                <div className='flex items-start gap-3'>
                                    <Calendar className='w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0' />
                                    <div className='flex-1 min-w-0'>
                                        <p className='text-xs text-slate-500 mb-0.5'>
                                            Account Created
                                        </p>
                                        <p className='text-sm text-slate-700'>
                                            {new Date().toLocaleDateString(
                                                'en-US',
                                                {
                                                    month: 'long',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                },
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <div className='flex items-start gap-3'>
                                    <Globe className='w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0' />
                                    <div className='flex-1 min-w-0'>
                                        <p className='text-xs text-slate-500 mb-0.5'>
                                            Timezone
                                        </p>
                                        <p className='text-sm text-slate-700'>
                                            {
                                                Intl.DateTimeFormat().resolvedOptions()
                                                    .timeZone
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Notifications */}
                        <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-6'>
                            <h2 className='text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2'>
                                <Bell className='w-5 h-5 text-slate-600' />
                                Notification Preferences
                            </h2>
                            <div className='space-y-4'>
                                <div className='flex items-center justify-between'>
                                    <div>
                                        <p className='text-sm font-medium text-slate-700'>
                                            Email Notifications
                                        </p>
                                        <p className='text-xs text-slate-500 mt-0.5'>
                                            Receive updates via email
                                        </p>
                                    </div>
                                    <button
                                        onClick={() =>
                                            setEmailNotifications(
                                                !emailNotifications,
                                            )
                                        }
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                            emailNotifications
                                                ? 'bg-blue-600'
                                                : 'bg-slate-300'
                                        }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                emailNotifications
                                                    ? 'translate-x-6'
                                                    : 'translate-x-1'
                                            }`}
                                        />
                                    </button>
                                </div>
                                <div className='flex items-center justify-between'>
                                    <div>
                                        <p className='text-sm font-medium text-slate-700'>
                                            Pipeline Updates
                                        </p>
                                        <p className='text-xs text-slate-500 mt-0.5'>
                                            Get notified on pipeline status
                                        </p>
                                    </div>
                                    <button
                                        onClick={() =>
                                            setPipelineNotifications(
                                                !pipelineNotifications,
                                            )
                                        }
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                            pipelineNotifications
                                                ? 'bg-blue-600'
                                                : 'bg-slate-300'
                                        }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                pipelineNotifications
                                                    ? 'translate-x-6'
                                                    : 'translate-x-1'
                                            }`}
                                        />
                                    </button>
                                </div>
                                <div className='flex items-center justify-between'>
                                    <div>
                                        <p className='text-sm font-medium text-slate-700'>
                                            Deployment Alerts
                                        </p>
                                        <p className='text-xs text-slate-500 mt-0.5'>
                                            Alerts for deployment events
                                        </p>
                                    </div>
                                    <button
                                        onClick={() =>
                                            setDeploymentNotifications(
                                                !deploymentNotifications,
                                            )
                                        }
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                            deploymentNotifications
                                                ? 'bg-blue-600'
                                                : 'bg-slate-300'
                                        }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                deploymentNotifications
                                                    ? 'translate-x-6'
                                                    : 'translate-x-1'
                                            }`}
                                        />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className='lg:col-span-2'>
                        <div className='bg-white rounded-xl shadow-sm border border-slate-200'>
                            {/* Tabs */}
                            <div className='border-b border-slate-200'>
                                <div className='px-6'>
                                    <button className='px-4 py-3 text-sm font-medium text-blue-600 border-b-2 border-blue-600'>
                                        Overview
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className='p-6'>
                                {/* My Projects */}
                                <div className='mb-8'>
                                    <div className='flex items-center justify-between mb-4'>
                                        <h3 className='text-base font-semibold text-slate-900'>
                                            My Projects
                                        </h3>
                                        <span className='px-2 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded'>
                                            7
                                        </span>
                                    </div>

                                    <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4'>
                                        {[
                                            'knk',
                                            'bbb',
                                            'as',
                                            'csc',
                                            'gsgdg',
                                            'aea',
                                            '+1 more',
                                        ].map((project, index) => (
                                            <div
                                                key={index}
                                                className={`p-4 rounded-lg border ${
                                                    index === 1
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : 'border-slate-200 hover:border-slate-300'
                                                } flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors`}
                                            >
                                                <div
                                                    className={`w-10 h-10 ${
                                                        index === 1
                                                            ? 'bg-blue-500'
                                                            : index === 4
                                                            ? 'bg-green-500'
                                                            : 'bg-slate-300'
                                                    } rounded flex items-center justify-center`}
                                                >
                                                    <svg
                                                        className='w-6 h-6 text-white'
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
                                                </div>
                                                <span className='text-sm font-medium text-slate-700'>
                                                    {project}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Connect to Provider */}
                                <div className='mb-8'>
                                    <h3 className='text-base font-semibold text-slate-900 mb-4'>
                                        Connect to a Provider
                                    </h3>
                                    <button className='px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors'>
                                        Select a Provider ▼
                                    </button>
                                </div>

                                {/* Access Tokens */}
                                <div className='mb-8'>
                                    <h3 className='text-base font-semibold text-slate-900 mb-4'>
                                        Access tokens for providers
                                    </h3>
                                    <p className='text-sm text-slate-500'>
                                        No access token for any git provider
                                        found for the current user.
                                    </p>
                                </div>

                                {/* API Keys */}
                                <div className='mb-8'>
                                    <h3 className='text-base font-semibold text-slate-900 mb-4'>
                                        My API Keys
                                    </h3>
                                    <p className='text-sm text-slate-500 mb-4'>
                                        No API Keys
                                    </p>
                                    <button className='text-sm text-blue-600 hover:text-blue-700 font-medium'>
                                        + API Key
                                    </button>
                                </div>

                                {/* Recent Activity */}
                                <div className='mb-8'>
                                    <h3 className='text-base font-semibold text-slate-900 mb-4 flex items-center gap-2'>
                                        <Activity className='w-5 h-5 text-slate-600' />
                                        Recent Activity
                                    </h3>
                                    <div className='space-y-3'>
                                        {[
                                            {
                                                action: 'Deployed pipeline',
                                                target: 'Production Environment',
                                                time: '2 hours ago',
                                                status: 'success',
                                            },
                                            {
                                                action: 'Created integration',
                                                target: 'Sales Order API',
                                                time: '5 hours ago',
                                                status: 'success',
                                            },
                                            {
                                                action: 'Updated configuration',
                                                target: 'Dev Stage Settings',
                                                time: '1 day ago',
                                                status: 'info',
                                            },
                                            {
                                                action: 'Pipeline build failed',
                                                target: 'QA Environment',
                                                time: '2 days ago',
                                                status: 'error',
                                            },
                                            {
                                                action: 'Added team member',
                                                target: 'DevOps Team',
                                                time: '3 days ago',
                                                status: 'info',
                                            },
                                        ].map((activity, index) => (
                                            <div
                                                key={index}
                                                className='flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100'
                                            >
                                                <div
                                                    className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                                                        activity.status ===
                                                        'success'
                                                            ? 'bg-green-500'
                                                            : activity.status ===
                                                              'error'
                                                            ? 'bg-red-500'
                                                            : 'bg-blue-500'
                                                    }`}
                                                />
                                                <div className='flex-1 min-w-0'>
                                                    <p className='text-sm text-slate-900'>
                                                        <span className='font-medium'>
                                                            {activity.action}
                                                        </span>{' '}
                                                        <span className='text-slate-600'>
                                                            · {activity.target}
                                                        </span>
                                                    </p>
                                                    <p className='text-xs text-slate-500 mt-0.5'>
                                                        {activity.time}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button className='mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium'>
                                        View all activity →
                                    </button>
                                </div>

                                {/* Usage Statistics */}
                                <div>
                                    <h3 className='text-base font-semibold text-slate-900 mb-4 flex items-center gap-2'>
                                        <Settings className='w-5 h-5 text-slate-600' />
                                        Usage Statistics
                                    </h3>
                                    <div className='grid grid-cols-2 gap-4'>
                                        <div className='p-4 rounded-lg bg-blue-50 border border-blue-100'>
                                            <p className='text-xs text-blue-600 font-medium mb-1'>
                                                Deployments
                                            </p>
                                            <p className='text-2xl font-bold text-blue-700'>
                                                42
                                            </p>
                                            <p className='text-xs text-blue-600 mt-1'>
                                                This month
                                            </p>
                                        </div>
                                        <div className='p-4 rounded-lg bg-green-50 border border-green-100'>
                                            <p className='text-xs text-green-600 font-medium mb-1'>
                                                Success Rate
                                            </p>
                                            <p className='text-2xl font-bold text-green-700'>
                                                94%
                                            </p>
                                            <p className='text-xs text-green-600 mt-1'>
                                                Last 30 days
                                            </p>
                                        </div>
                                        <div className='p-4 rounded-lg bg-purple-50 border border-purple-100'>
                                            <p className='text-xs text-purple-600 font-medium mb-1'>
                                                Integrations
                                            </p>
                                            <p className='text-2xl font-bold text-purple-700'>
                                                12
                                            </p>
                                            <p className='text-xs text-purple-600 mt-1'>
                                                Active
                                            </p>
                                        </div>
                                        <div className='p-4 rounded-lg bg-amber-50 border border-amber-100'>
                                            <p className='text-xs text-amber-600 font-medium mb-1'>
                                                Build Time
                                            </p>
                                            <p className='text-2xl font-bold text-amber-700'>
                                                3.2m
                                            </p>
                                            <p className='text-xs text-amber-600 mt-1'>
                                                Avg. duration
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
