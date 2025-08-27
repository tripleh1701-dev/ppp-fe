'use client';

import {useState, useEffect} from 'react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import AccountSettingsPanel from './AccountSettingsPanel';
import AccessControlPanel from './AccessControlPanel';

interface NavigationItem {
    id: string;
    label: string;
    icon: string;
    href: string;
    description?: string;
}

const navigationItems: NavigationItem[] = [
    {
        id: 'overview',
        label: 'Overview',
        icon: 'overview',
        href: '/',
        description: 'Project overview and summary',
    },
    {
        id: 'inbox',
        label: 'My Inbox',
        icon: 'inbox',
        href: '/inbox',
        description: 'Notifications and pending actions',
    },
    {
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'dashboard',
        href: '/dashboard',
        description: 'Analytics and project insights',
    },
    {
        id: 'pipelines',
        label: 'Pipelines',
        icon: 'pipelines',
        href: '/pipelines',
        description: 'CI/CD pipeline management',
    },
    {
        id: 'builds',
        label: 'Builds',
        icon: 'builds',
        href: '/builds',
        description: 'Build history and artifacts',
    },
    {
        id: 'access-control',
        label: 'Access Control',
        icon: 'security',
        href: '/access-control',
        description: 'User permissions and roles',
    },
    {
        id: 'account-settings',
        label: 'Account Settings',
        icon: 'settings',
        href: '/account-settings',
        description: 'Profile and account configuration',
    },
    {
        id: 'security-governance',
        label: 'Security & Governance',
        icon: 'shield',
        href: '/security-governance',
        description: 'Security policies and compliance',
    },
    {
        id: 'monitoring',
        label: 'Monitoring',
        icon: 'monitoring',
        href: '/monitoring',
        description: 'System monitoring and alerts',
    },
];

const getIconSvg = (iconName: string) => {
    const iconMap: {[key: string]: string} = {
        overview: `<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />`,
        inbox: `<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />`,
        dashboard: `<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />`,
        pipelines: `<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />`,
        builds: `<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />`,
        security: `<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />`,
        settings: `<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />`,
        shield: `<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />`,
        monitoring: `<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />`,
    };
    return iconMap[iconName] || iconMap.overview;
};

interface NavigationSidebarProps {
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
}

export default function NavigationSidebar({
    isCollapsed = false,
    onToggleCollapse,
}: NavigationSidebarProps) {
    const pathname = usePathname();
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);
    const [isAccountSettingsOpen, setIsAccountSettingsOpen] = useState(false);
    const [previousPathname, setPreviousPathname] = useState(pathname);
    const [isAccessControlOpen, setIsAccessControlOpen] = useState(false);

    // Close Account Settings panel when navigating to a different page
    useEffect(() => {
        if (pathname !== previousPathname) {
            if (isAccountSettingsOpen) setIsAccountSettingsOpen(false);
            if (isAccessControlOpen) setIsAccessControlOpen(false);
        }
        setPreviousPathname(pathname);
    }, [
        pathname,
        previousPathname,
        isAccountSettingsOpen,
        isAccessControlOpen,
    ]);

    return (
        <>
            <div
                className={`${
                    isCollapsed ? 'w-16' : 'w-64'
                } bg-dark h-full flex flex-col transition-all duration-300 ease-in-out border-r border-slate-700/50 backdrop-blur-xl`}
            >
                {/* Header */}
                <div className='p-4 border-b border-slate-700/50'>
                    {!isCollapsed && (
                        <div className='flex items-center space-x-3'>
                            <div className='w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg'>
                                <svg
                                    className='w-6 h-6 text-white'
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2.5}
                                        d='M13 10V3L4 14h7v7l9-11h-7z'
                                    />
                                </svg>
                            </div>
                            <div>
                                <h2 className='text-lg font-bold text-inverse'>
                                    DevOps Studio
                                </h2>
                                <p className='text-xs text-slate-400'>
                                    Enterprise CI/CD Platform
                                </p>
                            </div>
                        </div>
                    )}
                    {isCollapsed && (
                        <div className='flex justify-center'>
                            <div className='w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg'>
                                <svg
                                    className='w-6 h-6 text-white'
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2.5}
                                        d='M13 10V3L4 14h7v7l9-11h-7z'
                                    />
                                </svg>
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation Items */}
                <nav className='flex-1 py-4'>
                    <div className='space-y-1 px-3'>
                        {navigationItems.slice(0, 3).map((item) => {
                            const isActive =
                                !isAccountSettingsOpen && // Don't highlight other items when Account Settings is open
                                (pathname === item.href ||
                                    (item.href !== '/' &&
                                        pathname.startsWith(item.href)));

                            return (
                                <div key={item.id} className='relative'>
                                    <button
                                        className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                                            isActive
                                                ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border-r-2 border-indigo-500 shadow-sm'
                                                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                                        }`}
                                        onClick={() => {
                                            if (item.id === 'access-control') {
                                                setIsAccessControlOpen(true);
                                            } else {
                                                window.location.href =
                                                    item.href;
                                            }
                                        }}
                                        onMouseEnter={() =>
                                            setHoveredItem(item.id)
                                        }
                                        onMouseLeave={() =>
                                            setHoveredItem(null)
                                        }
                                    >
                                        <div
                                            className={`w-5 h-5 ${
                                                isActive
                                                    ? 'text-indigo-300'
                                                    : 'text-slate-400'
                                            }`}
                                        >
                                            <svg
                                                fill='none'
                                                stroke='currentColor'
                                                viewBox='0 0 24 24'
                                            >
                                                <g
                                                    dangerouslySetInnerHTML={{
                                                        __html: getIconSvg(
                                                            item.icon,
                                                        ),
                                                    }}
                                                />
                                            </svg>
                                        </div>
                                        {!isCollapsed && (
                                            <span className='flex-1 text-left'>
                                                {item.label}
                                            </span>
                                        )}
                                        {!isCollapsed && isActive && (
                                            <div className='w-2 h-2 bg-indigo-400 rounded-full shadow-sm'></div>
                                        )}
                                    </button>

                                    {/* Tooltip for collapsed state */}
                                    {isCollapsed && hoveredItem === item.id && (
                                        <div className='absolute left-full top-0 ml-2 px-3 py-2 bg-slate-800 text-white text-sm rounded-xl shadow-xl z-50 whitespace-nowrap border border-slate-700'>
                                            {item.label}
                                            <div className='absolute top-2 -left-1 w-2 h-2 bg-slate-800 transform rotate-45 border-l border-b border-slate-700'></div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Divider */}
                    {!isCollapsed && (
                        <div className='mx-3 my-4 border-t border-slate-700/50'></div>
                    )}

                    {/* Main Navigation */}
                    <div className='space-y-1 px-3'>
                        {navigationItems.slice(3, 5).map((item) => {
                            const isActive =
                                !isAccountSettingsOpen && // Don't highlight other items when Account Settings is open
                                (pathname === item.href ||
                                    (item.href !== '/' &&
                                        pathname.startsWith(item.href)));

                            return (
                                <div key={item.id} className='relative'>
                                    <Link
                                        href={item.href}
                                        className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                                            isActive
                                                ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border-r-2 border-indigo-500 shadow-sm'
                                                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                                        }`}
                                        onMouseEnter={() =>
                                            setHoveredItem(item.id)
                                        }
                                        onMouseLeave={() =>
                                            setHoveredItem(null)
                                        }
                                    >
                                        <div
                                            className={`w-5 h-5 ${
                                                isActive
                                                    ? 'text-indigo-300'
                                                    : 'text-slate-400'
                                            }`}
                                        >
                                            <svg
                                                fill='none'
                                                stroke='currentColor'
                                                viewBox='0 0 24 24'
                                            >
                                                <g
                                                    dangerouslySetInnerHTML={{
                                                        __html: getIconSvg(
                                                            item.icon,
                                                        ),
                                                    }}
                                                />
                                            </svg>
                                        </div>
                                        {!isCollapsed && (
                                            <span className='flex-1'>
                                                {item.label}
                                            </span>
                                        )}
                                        {!isCollapsed && isActive && (
                                            <div className='w-2 h-2 bg-indigo-400 rounded-full shadow-sm'></div>
                                        )}
                                    </Link>

                                    {/* Tooltip for collapsed state */}
                                    {isCollapsed && hoveredItem === item.id && (
                                        <div className='absolute left-full top-0 ml-2 px-3 py-2 bg-slate-800 text-white text-sm rounded-xl shadow-xl z-50 whitespace-nowrap border border-slate-700'>
                                            {item.label}
                                            <div className='absolute top-2 -left-1 w-2 h-2 bg-slate-800 transform rotate-45 border-l border-b border-slate-700'></div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Another Divider */}
                    {!isCollapsed && (
                        <div className='mx-3 my-4 border-t border-slate-700/50'></div>
                    )}

                    {/* Security & Management */}
                    <div className='space-y-1 px-3'>
                        {navigationItems.slice(5).map((item) => {
                            const isActive =
                                !isAccountSettingsOpen && // Don't highlight other items when Account Settings is open
                                (pathname === item.href ||
                                    (item.href !== '/' &&
                                        pathname.startsWith(item.href)));

                            // Special handling for Account Settings
                            if (item.id === 'account-settings') {
                                return (
                                    <div key={item.id} className='relative'>
                                        <button
                                            onClick={() =>
                                                setIsAccountSettingsOpen(true)
                                            }
                                            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                                                isAccountSettingsOpen
                                                    ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border-r-2 border-indigo-500 shadow-sm'
                                                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                                            }`}
                                            onMouseEnter={() =>
                                                setHoveredItem(item.id)
                                            }
                                            onMouseLeave={() =>
                                                setHoveredItem(null)
                                            }
                                        >
                                            <div
                                                className={`w-5 h-5 ${
                                                    isAccountSettingsOpen
                                                        ? 'text-indigo-300'
                                                        : 'text-slate-400'
                                                }`}
                                            >
                                                <svg
                                                    fill='none'
                                                    stroke='currentColor'
                                                    viewBox='0 0 24 24'
                                                >
                                                    <g
                                                        dangerouslySetInnerHTML={{
                                                            __html: getIconSvg(
                                                                item.icon,
                                                            ),
                                                        }}
                                                    />
                                                </svg>
                                            </div>
                                            {!isCollapsed && (
                                                <span className='flex-1 text-left'>
                                                    {item.label}
                                                </span>
                                            )}
                                            {!isCollapsed &&
                                                isAccountSettingsOpen && (
                                                    <div className='w-2 h-2 bg-indigo-400 rounded-full shadow-sm'></div>
                                                )}
                                        </button>

                                        {/* Tooltip for collapsed state */}
                                        {isCollapsed &&
                                            hoveredItem === item.id && (
                                                <div className='absolute left-full top-0 ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg z-50 whitespace-nowrap'>
                                                    {item.label}
                                                    <div className='absolute top-2 -left-1 w-2 h-2 bg-gray-900 transform rotate-45'></div>
                                                </div>
                                            )}
                                    </div>
                                );
                            }

                            // Special handling for Access Control (open panel instead of navigating)
                            if (item.id === 'access-control') {
                                return (
                                    <div key={item.id} className='relative'>
                                        <button
                                            onClick={() =>
                                                setIsAccessControlOpen(true)
                                            }
                                            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                                                isAccessControlOpen
                                                    ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border-r-2 border-indigo-500 shadow-sm'
                                                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                                            }`}
                                            onMouseEnter={() =>
                                                setHoveredItem(item.id)
                                            }
                                            onMouseLeave={() =>
                                                setHoveredItem(null)
                                            }
                                        >
                                            <div
                                                className={`w-5 h-5 ${
                                                    isAccessControlOpen
                                                        ? 'text-indigo-300'
                                                        : 'text-slate-400'
                                                }`}
                                            >
                                                <svg
                                                    fill='none'
                                                    stroke='currentColor'
                                                    viewBox='0 0 24 24'
                                                >
                                                    <g
                                                        dangerouslySetInnerHTML={{
                                                            __html: getIconSvg(
                                                                item.icon,
                                                            ),
                                                        }}
                                                    />
                                                </svg>
                                            </div>
                                            {!isCollapsed && (
                                                <span className='flex-1 text-left'>
                                                    {item.label}
                                                </span>
                                            )}
                                            {!isCollapsed &&
                                                isAccessControlOpen && (
                                                    <div className='w-2 h-2 bg-indigo-400 rounded-full shadow-sm'></div>
                                                )}
                                        </button>

                                        {/* Tooltip for collapsed state */}
                                        {isCollapsed &&
                                            hoveredItem === item.id && (
                                                <div className='absolute left-full top-0 ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg z-50 whitespace-nowrap'>
                                                    {item.label}
                                                    <div className='absolute top-2 -left-1 w-2 h-2 bg-gray-900 transform rotate-45'></div>
                                                </div>
                                            )}
                                    </div>
                                );
                            }

                            // Regular navigation items
                            return (
                                <div key={item.id} className='relative'>
                                    <Link
                                        href={item.href}
                                        className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                                            isActive
                                                ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border-r-2 border-indigo-500 shadow-sm'
                                                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                                        }`}
                                        onMouseEnter={() =>
                                            setHoveredItem(item.id)
                                        }
                                        onMouseLeave={() =>
                                            setHoveredItem(null)
                                        }
                                    >
                                        <div
                                            className={`w-5 h-5 ${
                                                isActive
                                                    ? 'text-indigo-300'
                                                    : 'text-slate-400'
                                            }`}
                                        >
                                            <svg
                                                fill='none'
                                                stroke='currentColor'
                                                viewBox='0 0 24 24'
                                            >
                                                <g
                                                    dangerouslySetInnerHTML={{
                                                        __html: getIconSvg(
                                                            item.icon,
                                                        ),
                                                    }}
                                                />
                                            </svg>
                                        </div>
                                        {!isCollapsed && (
                                            <span className='flex-1'>
                                                {item.label}
                                            </span>
                                        )}
                                        {!isCollapsed && isActive && (
                                            <div className='w-2 h-2 bg-indigo-400 rounded-full shadow-sm'></div>
                                        )}
                                    </Link>

                                    {/* Tooltip for collapsed state */}
                                    {isCollapsed && hoveredItem === item.id && (
                                        <div className='absolute left-full top-0 ml-2 px-3 py-2 bg-slate-800 text-white text-sm rounded-xl shadow-xl z-50 whitespace-nowrap border border-slate-700'>
                                            {item.label}
                                            <div className='absolute top-2 -left-1 w-2 h-2 bg-slate-800 transform rotate-45 border-l border-b border-slate-700'></div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </nav>

                {/* User Section at Bottom - Harness.io style */}
                {!isCollapsed && (
                    <div className='px-3 py-3 border-t border-gray-200'>
                        <button
                            onClick={() => setIsAccountSettingsOpen(true)}
                            className='w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer group'
                        >
                            <div className='w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center group-hover:shadow-lg transition-shadow'>
                                <span className='text-white text-sm font-semibold'>
                                    T
                                </span>
                            </div>
                            <div className='flex-1 min-w-0 text-left'>
                                <p className='text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors'>
                                    Tushar
                                </p>
                                <p className='text-xs text-gray-500 truncate'>
                                    Tushar@company.com
                                </p>
                            </div>
                            <div className='w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors'>
                                <svg
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M9 5l7 7-7 7'
                                    />
                                </svg>
                            </div>
                        </button>
                    </div>
                )}

                {/* Toggle Button */}
                <div className='p-3 border-t border-gray-200'>
                    <button
                        onClick={onToggleCollapse}
                        className='w-full flex items-center justify-center px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200'
                    >
                        <svg
                            className={`w-5 h-5 transform transition-transform duration-200 ${
                                isCollapsed ? 'rotate-180' : ''
                            }`}
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M11 19l-7-7 7-7m8 14l-7-7 7-7'
                            />
                        </svg>
                        {!isCollapsed && (
                            <span className='ml-2 text-sm'>Collapse</span>
                        )}
                    </button>
                </div>
            </div>

            {/* Account Settings Panel */}
            <AccountSettingsPanel
                isOpen={isAccountSettingsOpen}
                onClose={() => setIsAccountSettingsOpen(false)}
            />
            <AccessControlPanel
                isOpen={isAccessControlOpen}
                onClose={() => setIsAccessControlOpen(false)}
            />
        </>
    );
}
