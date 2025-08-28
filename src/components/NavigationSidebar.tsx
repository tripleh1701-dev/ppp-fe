'use client';

import {useState, useEffect} from 'react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
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

    // Handle mobile close on navigation
    const handleNavigation = (href: string) => {
        if (isMobile && onToggleCollapse) {
            onToggleCollapse();
        }
    };

    return (
        <>
            <motion.div
                className={`h-full flex flex-col backdrop-blur-xl relative overflow-visible z-30 ${
                    isMobile ? 'fixed left-0 top-0 z-50 h-screen' : 'relative'
                }`}
                style={{
                    backgroundImage: 'url(/images/logos/systiva-sidebar.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                }}
                animate={{ width: isCollapsed ? 48 : 208 }}
                initial={false}
                transition={{ type: 'tween', duration: 0.18, ease: 'easeOut' }}
            >
                {/* Curved Right Edge / Boundary (hidden when collapsed) */}
                {!isCollapsed && (
                    <div className='absolute right-0 top-0 h-full pointer-events-none z-10'>
                        <div className='w-3 h-full bg-white/24 rounded-l-2xl shadow-[inset_0_0_12px_rgba(255,255,255,0.35)] transition-all duration-300'></div>
                        <div className='absolute right-0 top-0 w-1.5 h-full bg-gradient-to-b from-[#05E9FE]/80 via-transparent to-[#0171EC]/80 rounded-l-2xl'></div>
                    </div>
                )}
                
                {/* Minimal Collapse Handle (bottom, outside) */}
                {!isMobile && (
                    <div className='absolute -right-4 bottom-7 z-40 pointer-events-auto group'>
                        <button
                            onClick={onToggleCollapse}
                            className={`relative w-8 h-8 rounded-full bg-brand-gradient text-white transition-all duration-200 flex items-center justify-center shadow-lg ring-2 ring-white/40 hover:shadow-xl ${
                                isCollapsed ? 'opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100' : 'opacity-100'
                            }`}
                            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
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
                                <polyline className='arrow-shift' points='15 18 9 12 15 6'></polyline>
                            </svg>
                            <style jsx>{`
                                .group:hover .arrow-shift { animation: nudge 1.2s ease-in-out infinite; }
                                @keyframes nudge { 0%,100%{ transform: translateX(0);} 50%{ transform: translateX(-1.5px);} }
                            `}</style>
                        </button>
                    </div>
                )}

                {/* Header */}
                <div className='px-3 py-3 border-b border-white/20 flex items-center justify-between bg-black/30 backdrop-blur-sm'>
                    {!isCollapsed && (
                        <div className='flex items-center space-x-3'>
                            <div className='w-9 h-9 rounded-xl flex items-center justify-center shadow-lg overflow-hidden bg-white/10 backdrop-blur-sm'>
                                <img
                                    src="/images/logos/systiva-logo.svg"
                                    alt="Systiva Logo"
                                    className="w-full h-full object-contain p-1"
                                />
                            </div>
                            <div className='min-w-0'>
                                <h2 className='text-base font-bold text-white truncate drop-shadow-lg'>
                                    Systiva
                                </h2>
                                <p className='text-[11px] text-slate-200 truncate drop-shadow-md'>
                                    Enterprise CI/CD Platform
                                </p>
                            </div>
                        </div>
                    )}
                    {isCollapsed && (
                        <div className='flex justify-center w-full'>
                            <div className='w-9 h-9 rounded-xl flex items-center justify-center shadow-lg overflow-hidden bg-white/10 backdrop-blur-sm'>
                                <img
                                    src="/images/logos/systiva-logo.svg"
                                    alt="Systiva Logo"
                                    className="w-full h-full object-contain p-1"
                                />
                            </div>
                        </div>
                    )}
                    
                    {/* Mobile close button */}
                    {isMobile && (
                        <button
                            onClick={onToggleCollapse}
                            className='p-2 rounded-lg text-white hover:text-white hover:bg-white/20 transition-colors duration-200 backdrop-blur-sm'
                            aria-label="Close sidebar"
                        >
                            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Navigation Items */}
                <nav className='flex-1 py-4 overflow-y-auto scrollbar-hide relative'>
                    {/* Semi-transparent overlay for better text readability */}
                    <div className='absolute inset-0 bg-black/20 pointer-events-none'></div>
                    
                    <div className='space-y-1 px-3 relative z-10'>
                        {navigationItems.slice(0, 3).map((item, index) => {
                            const isActive =
                                !isAccountSettingsOpen &&
                                (pathname === item.href ||
                                    (item.href !== '/' && pathname.startsWith(item.href)));

                            const onItemClick = () => {
                                if (item.id === 'account-settings') {
                                    setIsAccountSettingsOpen(true);
                                    if (isMobile && onToggleCollapse) onToggleCollapse();
                                    return;
                                }
                                if (item.id === 'access-control') {
                                    setIsAccessControlOpen(true);
                                    if (isMobile && onToggleCollapse) onToggleCollapse();
                                    return;
                                }
                                handleNavigation(item.href);
                            };

                            return (
                                <div key={item.id} className='relative'>
                                    <button
                                        onClick={onItemClick}
                                        className={`flex ${isCollapsed ? 'justify-center px-0' : 'items-center space-x-3 px-3'} py-2.5 rounded-xl text-sm font-medium transition-all duration-200 w-full ${
                                            isActive
                                                ? 'bg-gradient-to-r from-[#0171EC]/40 to-[#05E9FE]/40 text-white border-r-2 border-[#05E9FE] shadow-lg backdrop-blur-sm'
                                                : 'text-white hover:bg-white/20 hover:text-white backdrop-blur-sm'
                                        }`}
                                        onMouseEnter={() => setHoveredItem(item.id)}
                                        onMouseLeave={() => setHoveredItem(null)}
                                        >
                                            <svg
                                            className={`w-5 h-5 ${isCollapsed ? '' : 'flex-shrink-0'}`}
                                                fill='none'
                                                stroke='currentColor'
                                                viewBox='0 0 24 24'
                                            >
                                            <g dangerouslySetInnerHTML={{__html: getIconSvg(item.icon)}} />
                                            </svg>
                                        {!isCollapsed && (
                                            <span className='truncate drop-shadow-sm'>{item.label}</span>
                                        )}
                                    </button>

                                    {isCollapsed && hoveredItem === item.id && (
                                        <div className='absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded-md whitespace-nowrap z-50 shadow-lg'>
                                            {item.label}
                                        </div>
                                    )}
                                    
                                    {index === 2 && (
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
                        {navigationItems.slice(3).map((item) => {
                            const isActive =
                                !isAccountSettingsOpen &&
                                (pathname === item.href ||
                                    (item.href !== '/' && pathname.startsWith(item.href)));

                            const onItemClick = () => {
                            if (item.id === 'account-settings') {
                                    setIsAccountSettingsOpen(true);
                                    if (isMobile && onToggleCollapse) onToggleCollapse();
                                    return;
                                }
                                if (item.id === 'access-control') {
                                    setIsAccessControlOpen(true);
                                    if (isMobile && onToggleCollapse) onToggleCollapse();
                                    return;
                                }
                                handleNavigation(item.href);
                            };

                                return (
                                    <div key={item.id} className='relative'>
                                        <button
                                        onClick={onItemClick}
                                        className={`flex ${isCollapsed ? 'justify-center px-0' : 'items-center space-x-3 px-3'} py-2.5 rounded-xl text-sm font-medium transition-all duration-200 w-full ${
                                            isActive
                                                ? 'bg-gradient-to-r from-[#0171EC]/40 to-[#05E9FE]/40 text-white border-r-2 border-[#05E9FE] shadow-lg backdrop-blur-sm'
                                                : 'text-white hover:bg-white/20 hover:text-white backdrop-blur-sm'
                                        }`}
                                        onMouseEnter={() => setHoveredItem(item.id)}
                                        onMouseLeave={() => setHoveredItem(null)}
                                            >
                                                <svg
                                            className={`w-5 h-5 ${isCollapsed ? '' : 'flex-shrink-0'}`}
                                                    fill='none'
                                                    stroke='currentColor'
                                                    viewBox='0 0 24 24'
                                                >
                                            <g dangerouslySetInnerHTML={{__html: getIconSvg(item.icon)}} />
                                                </svg>
                                            {!isCollapsed && (
                                            <span className='truncate drop-shadow-sm'>{item.label}</span>
                                                )}
                                        </button>

                                    {isCollapsed && hoveredItem === item.id && (
                                        <div className='absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded-md whitespace-nowrap z-50 shadow-lg'>
                                            {item.label}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </nav>

                {/* Footer */}
                <div className='p-4 border-t border-white/20 bg-black/20 backdrop-blur-sm'>
                    {/* Keep only profile here to avoid duplicates of settings/access */}
                    <div className='mt-2'>
                        <div className='flex items-center space-x-3'>
                            <div className='w-10 h-10 bg-gradient-to-r from-[#0171EC] to-[#05E9FE] rounded-full flex items-center justify-center shadow-lg'>
                                <svg
                                    className='w-5 h-5 text-white'
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                                    />
                                </svg>
                            </div>
                            {!isCollapsed && (
                                <div className='min-w-0 flex-1'>
                                    <p className='text-sm font-medium text-white truncate drop-shadow-sm'>
                                        Tushar
                                    </p>
                                    <p className='text-xs text-slate-200 truncate drop-shadow-sm'>
                                        Administrator
                                    </p>
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
            />
            )}

            {/* Access Control Panel */}
            {isAccessControlOpen && (
            <AccessControlPanel
                isOpen={isAccessControlOpen}
                onClose={() => setIsAccessControlOpen(false)}
            />
            )}
        </>
    );
}
