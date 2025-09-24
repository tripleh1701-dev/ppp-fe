'use client';

import {useState, useEffect, useCallback, useMemo} from 'react';
import Link from 'next/link';
import {usePathname, useRouter} from 'next/navigation';
import AccountSettingsPanel from './AccountSettingsPanel';
import AccessControlPanel from './AccessControlPanel';
import {motion} from 'framer-motion';

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
    isMobile?: boolean;
}

export default function NavigationSidebar({
    isCollapsed = false,
    onToggleCollapse,
    isMobile = false,
}: NavigationSidebarProps) {
    const pathname = usePathname();
    const currentPath = pathname ?? '/';
    const router = useRouter();
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);
    const [isAccountSettingsOpen, setIsAccountSettingsOpen] = useState(false);
    const [isAccessControlOpen, setIsAccessControlOpen] = useState(false);
    const [previousPathname, setPreviousPathname] = useState(currentPath);

    // Current user data loaded from authentication context/API
    const currentUser = {
        firstName: '',
        lastName: '',
        emailAddress: '',
    };

    // Function to generate user initials
    const getUserInitials = (firstName: string, lastName: string) => {
        const firstInitial = firstName?.charAt(0)?.toUpperCase() || '';
        const lastInitial = lastName?.charAt(0)?.toUpperCase() || '';
        return firstInitial + lastInitial || 'U'; // Fallback to 'U' for User
    };

    // NEW: Track active menu by click
    const [activeMenuId, setActiveMenuId] = useState<string>('overview');

    // Memoize navigation items to prevent unnecessary re-renders
    const memoizedNavigationItems = useMemo(() => navigationItems, []);

    // Prefetch routes for faster navigation
    useEffect(() => {
        memoizedNavigationItems.forEach((item) => {
            if (item.href !== '/') {
                router.prefetch(item.href);
            }
        });
    }, [router, memoizedNavigationItems]);

    // Set active menu on initial load or route change
    useEffect(() => {
        // Find the first matching menu item for the current path
        const found = memoizedNavigationItems.find(
            (item) =>
                currentPath === item.href ||
                (item.href !== '/' && currentPath.startsWith(item.href)),
        );
        if (found) {
            setActiveMenuId(found.id);
        }
    }, [currentPath, memoizedNavigationItems]);

    // Close panels when navigating to a different page
    useEffect(() => {
        if (currentPath !== previousPathname) {
            if (isAccountSettingsOpen) setIsAccountSettingsOpen(false);
            if (isAccessControlOpen) setIsAccessControlOpen(false);
        }
        setPreviousPathname(currentPath);
    }, [
        currentPath,
        previousPathname,
        isAccountSettingsOpen,
        isAccessControlOpen,
    ]);

    // Handle mobile close on navigation
    const handleNavigation = useCallback(
        (href: string) => {
            if (isMobile && onToggleCollapse) {
                onToggleCollapse();
            }

            router.push(href);
        },
        [isMobile, onToggleCollapse, router],
    );

    // Updated click handler to ensure only one panel is open at a time
    const handleItemClick = useCallback(
        (item: NavigationItem) => {
            setActiveMenuId(item.id);

            if (item.id === 'account-settings') {
                setIsAccountSettingsOpen(true);
                setIsAccessControlOpen(false); // <-- close other panel
                if (isMobile && onToggleCollapse) onToggleCollapse();
                return;
            }
            if (item.id === 'access-control') {
                setIsAccessControlOpen(true);
                setIsAccountSettingsOpen(false); // <-- close other panel
                if (isMobile && onToggleCollapse) onToggleCollapse();
                return;
            }
            // Close both panels when clicking any other menu
            setIsAccountSettingsOpen(false);
            setIsAccessControlOpen(false);
            handleNavigation(item.href);
        },
        [isMobile, onToggleCollapse, handleNavigation],
    );

    // Memoize the hover handlers
    const handleMouseEnter = useCallback((itemId: string) => {
        setHoveredItem(itemId);
    }, []);

    const handleMouseLeave = useCallback(() => {
        setHoveredItem(null);
    }, []);

    return (
        <>
            <motion.div
                className={`h-full flex flex-col backdrop-blur-xl relative overflow-visible z-30 ${
                    isMobile ? 'fixed left-0 top-0 z-50 h-screen' : 'relative'
                }`}
                style={{
                    backgroundColor: '#0a1a2f',
                    backgroundImage: 'url(/images/logos/sidebar.png)',
                    backgroundSize: 'contain',
                    backgroundPosition: 'center bottom',
                    backgroundRepeat: 'no-repeat',
                }}
                animate={{width: isCollapsed ? 48 : 200}}
                initial={false}
                transition={{type: 'tween', duration: 0.18, ease: 'easeOut'}}
            >
                {/* Curved Right Edge / Boundary removed to eliminate white border */}

                {/* Minimal Collapse Handle (middle, outside) */}
                {!isMobile && (
                    <div className='absolute -right-4 bottom-20 -translate-y-1/2 z-40 pointer-events-auto group'>
                        <button
                            onClick={onToggleCollapse}
                            className='relative w-8 h-8 rounded-full bg-brand-gradient text-white transition-all duration-200 flex items-center justify-center shadow-lg ring-2 ring-white/40 hover:shadow-xl hover:scale-110 opacity-100'
                            aria-label={
                                isCollapsed
                                    ? 'Expand sidebar'
                                    : 'Collapse sidebar'
                            }
                            title={isCollapsed ? 'Expand' : 'Collapse'}
                        >
                            <svg
                                className={`w-3.5 h-3.5 text-white transition-transform duration-300 ${
                                    isCollapsed ? 'rotate-180' : ''
                                }`}
                                viewBox='0 0 24 24'
                                fill='none'
                                stroke='currentColor'
                                strokeWidth='2.5'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                            >
                                <polyline
                                    className='arrow-shift'
                                    points='15 18 9 12 15 6'
                                ></polyline>
                            </svg>
                            <style jsx>{`
                                .group:hover .arrow-shift {
                                    animation: nudge 1.2s ease-in-out infinite;
                                }
                                @keyframes nudge {
                                    0%,
                                    100% {
                                        transform: translateX(0);
                                    }
                                    50% {
                                        transform: translateX(-1.5px);
                                    }
                                }
                            `}</style>
                        </button>
                    </div>
                )}

                {/* Header */}
                <div className='px-3 py-3 flex items-center justify-between'>
                    {!isCollapsed && (
                        <Link
                            href='/'
                            className='flex items-center space-x-3 hover:opacity-80 transition-opacity duration-200'
                        >
                            <img
                                src='/images/logos/logo.svg'
                                alt='Systiva Logo'
                                className='w-11 h-11 object-contain'
                            />
                            <div className='min-w-0'>
                                <h2 className='text-xl font-bold text-white truncate drop-shadow-lg'>
                                    Systiva
                                </h2>
                                <p className='text-xs text-slate-300 truncate drop-shadow-md'>
                                    Enterprise CI/CD Platform
                                </p>
                            </div>
                        </Link>
                    )}
                    {isCollapsed && (
                        <Link
                            href='/'
                            className='flex justify-center w-full hover:opacity-80 transition-opacity duration-200'
                        >
                            <img
                                src='/images/logos/logo.svg'
                                alt='Systiva Logo'
                                className='w-11 h-11 object-contain'
                            />
                        </Link>
                    )}

                    {/* Mobile close button */}
                    {isMobile && (
                        <button
                            onClick={onToggleCollapse}
                            className='p-2 rounded-lg text-white hover:text-white hover:bg-white/20 transition-colors duration-200 backdrop-blur-sm'
                            aria-label='Close sidebar'
                        >
                            <svg
                                className='w-5 h-5'
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
                    )}
                </div>

                {/* Navigation Items */}
                <nav className='flex-1 py-4 overflow-y-auto scrollbar-hide relative'>
                    {/* Semi-transparent overlay for better text readability */}
                    <div className='absolute inset-0 bg-black/20 pointer-events-none'></div>

                    <div className='space-y-1 px-3 relative z-10'>
                        {memoizedNavigationItems
                            .slice(0, 3)
                            .map((item, index) => {
                                const isActive = activeMenuId === item.id;

                                return (
                                    <div key={item.id} className='relative'>
                                        <button
                                            onClick={() =>
                                                handleItemClick(item)
                                            }
                                            className={`flex ${
                                                isCollapsed
                                                    ? 'justify-center px-0'
                                                    : 'items-center space-x-3 px-3'
                                            } py-2.5 text-sm font-medium transition-all duration-200 w-full ${
                                                isActive
                                                    ? 'bg-primary-600 text-white shadow-lg backdrop-blur-sm'
                                                    : 'text-white hover:bg-white/20 hover:text-white backdrop-blur-sm'
                                            }`}
                                            onMouseEnter={() =>
                                                handleMouseEnter(item.id)
                                            }
                                            onMouseLeave={handleMouseLeave}
                                        >
                                            <svg
                                                className={`w-5 h-5 ${
                                                    isCollapsed
                                                        ? ''
                                                        : 'flex-shrink-0'
                                                }`}
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
                                            {!isCollapsed && (
                                                <span className='truncate drop-shadow-sm'>
                                                    {item.label}
                                                </span>
                                            )}
                                        </button>

                                        {/* Enhanced tooltips for collapsed sidebar */}
                                        {isCollapsed &&
                                            hoveredItem === item.id && (
                                                <div className='absolute left-full ml-2 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg whitespace-nowrap z-50 shadow-xl border border-slate-600'>
                                                    {item.label}
                                                    <div className='absolute left-0 top-1/2 -translate-y-1/2 -ml-1 w-2 h-2 bg-slate-800 transform rotate-45 border-l border-b border-slate-600'></div>
                                                </div>
                                            )}

                                        {/* Add separator after Dashboard section (index 1) */}
                                        {index === 1 && (
                                            <div className='my-3 px-3'>
                                                <div className='h-px bg-white/20'></div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                    </div>

                    {/* Secondary Navigation Items */}
                    <div className='space-y-1 px-3 relative z-10'>
                        {memoizedNavigationItems.slice(3).map((item) => {
                            const isActive = activeMenuId === item.id;

                            return (
                                <div key={item.id} className='relative'>
                                    <button
                                        onClick={() => handleItemClick(item)}
                                        className={`flex ${
                                            isCollapsed
                                                ? 'justify-center px-0'
                                                : 'items-center space-x-3 px-3'
                                        } py-2.5 text-sm font-medium transition-all duration-200 w-full ${
                                            isActive
                                                ? 'bg-primary-600 text-white shadow-lg backdrop-blur-sm'
                                                : 'text-white hover:bg-white/20 hover:text-white backdrop-blur-sm'
                                        }`}
                                        onMouseEnter={() =>
                                            handleMouseEnter(item.id)
                                        }
                                        onMouseLeave={handleMouseLeave}
                                    >
                                        <svg
                                            className={`w-5 h-5 ${
                                                isCollapsed
                                                    ? ''
                                                    : 'flex-shrink-0'
                                            }`}
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
                                        {!isCollapsed && (
                                            <span className='truncate drop-shadow-sm'>
                                                {item.label}
                                            </span>
                                        )}
                                    </button>

                                    {/* Enhanced tooltips for collapsed sidebar */}
                                    {isCollapsed && hoveredItem === item.id && (
                                        <div className='absolute left-full ml-2 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg whitespace-nowrap z-50 shadow-xl border border-slate-600'>
                                            {item.label}
                                            <div className='absolute left-0 top-1/2 -translate-y-1/2 -ml-1 w-2 h-2 bg-slate-800 transform rotate-45 border-l border-b border-slate-600'></div>
                                        </div>
                                    )}

                                    {/* Add separator after Builds section */}
                                    {item.id === 'builds' && (
                                        <div className='my-3 px-3'>
                                            <div className='h-px bg-white/20'></div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </nav>

                {/* Footer */}

                <div
                    className={`border-t border-white/10 bg-black/10 backdrop-blur-sm ${
                        isCollapsed ? 'p-2' : 'p-4'
                    }`}
                >
                    {/* Keep only profile here to avoid duplicates of settings/access */}
                    <div className='mt-2'>
                        <div
                            className={`flex items-center ${
                                isCollapsed ? 'justify-center' : 'space-x-3'
                            } relative`}
                            onMouseEnter={() =>
                                isCollapsed && setHoveredItem('user-profile')
                            }
                            onMouseLeave={() => setHoveredItem(null)}
                        >
                            <div className='w-10 h-10 bg-gradient-to-r from-[#0171EC] to-[#05E9FE] rounded-full flex items-center justify-center shadow-lg flex-shrink-0'>
                                <span className='text-white font-semibold text-sm'>
                                    {getUserInitials(
                                        currentUser.firstName,
                                        currentUser.lastName,
                                    )}
                                </span>
                            </div>
                            {!isCollapsed && (
                                <div className='min-w-0 flex-1'>
                                    <p className='text-sm font-medium text-white truncate drop-shadow-sm'>
                                        {currentUser.firstName}{' '}
                                        {currentUser.lastName}
                                    </p>
                                    <p className='text-xs text-slate-200 truncate drop-shadow-sm'>
                                        {currentUser.emailAddress}
                                    </p>
                                </div>
                            )}

                            {/* Enhanced tooltip for collapsed sidebar */}
                            {isCollapsed && hoveredItem === 'user-profile' && (
                                <div className='absolute left-full ml-2 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg whitespace-nowrap z-50 shadow-xl border border-slate-600'>
                                    <div>
                                        <div className='font-medium'>
                                            Nihar Sharma
                                        </div>
                                        <div className='text-xs text-slate-300'>
                                            Administrator
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Account Settings Panel */}
            {isAccountSettingsOpen && (
                <AccountSettingsPanel
                    isOpen={isAccountSettingsOpen}
                    onClose={() => setIsAccountSettingsOpen(false)}
                    sidebarWidth={isCollapsed ? 48 : 208}
                />
            )}

            {/* Access Control Panel */}
            {isAccessControlOpen && (
                <AccessControlPanel
                    isOpen={isAccessControlOpen}
                    onClose={() => setIsAccessControlOpen(false)}
                    sidebarWidth={isCollapsed ? 48 : 208}
                />
            )}
        </>
    );
}
