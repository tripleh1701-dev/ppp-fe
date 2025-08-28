'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useMemo} from 'react';
import {Icon} from './Icons';

interface BreadcrumbItem {
    label: string;
    href: string;
    isLast?: boolean;
    icon?: string;
}

interface BreadcrumbsProps {
    username?: string;
    sidebarCollapsed?: boolean;
    isMobile?: boolean; // Mobile responsiveness flag
}

const pathMapping: {[key: string]: {label: string; icon?: string}} = {
    '': {label: 'Overview', icon: 'grid'},
    inbox: {label: 'My Inbox', icon: 'mail'},
    dashboard: {label: 'Dashboard', icon: 'chart'},
    pipelines: {label: 'Pipelines', icon: 'bolt'},
    builds: {label: 'Builds', icon: 'flask'},
    'access-control': {label: 'Access Control', icon: 'lock'},
    'account-settings': {label: 'Account Settings', icon: 'gear'},
    'enterprise-configuration': {
        label: 'Enterprise Configuration',
        icon: 'template',
    },
    'manage-accounts': {label: 'Manage Accounts', icon: 'users'},
    'manage-users': {label: 'Manage Users', icon: 'users'},
    'manage-user-groups': {label: 'Manage User Groups', icon: 'users'},
    'manage-roles': {label: 'Manage Roles', icon: 'shield'},
    'role-user-hierarchy': {label: 'Role-User Hierarchy', icon: 'hierarchy'},
    'business-unit-settings': {
        label: 'Business Unit Settings',
        icon: 'hierarchy',
    },
    'global-settings': {label: 'Global Settings', icon: 'globe'},
    'security-governance': {label: 'Security & Governance', icon: 'shield'},
    monitoring: {label: 'Monitoring', icon: 'chart'},
    templates: {label: 'Pipeline Templates', icon: 'template'},
};

export default function Breadcrumbs({
    username,
    sidebarCollapsed = false,
    isMobile = false,
}: BreadcrumbsProps) {
    const pathname = usePathname();

    const breadcrumbs = useMemo(() => {
        const items: BreadcrumbItem[] = [];

        // Add account username at the front if provided
        if (username) {
            items.push({
                label: `Account: ${username}`,
                href: '/account-settings',
                isLast: false,
            });
        }

        if (pathname === '/') {
            items.push({
                label: 'Overview',
                href: '/',
                isLast: true,
                icon: pathMapping['']?.icon,
            });
            return items;
        }

        const segments = pathname.split('/').filter(Boolean);

        // Add home
        items.push({
            label: 'Overview',
            href: '/',
            isLast: false,
            icon: pathMapping['']?.icon,
        });

        // Add intermediate paths
        let currentPath = '';
        segments.forEach((segment, index) => {
            currentPath += `/${segment}`;
            const isLast = index === segments.length - 1;

            const node = pathMapping[segment];
            items.push({
                label: node?.label || segment,
                href: currentPath,
                isLast,
                icon: node?.icon,
            });
        });

        return items;
    }, [pathname, username]);

    // Mobile breadcrumbs - simplified version
    if (isMobile) {
        const currentBreadcrumb = breadcrumbs[breadcrumbs.length - 1];
        return (
            <div className='bg-white border-b border-slate-200 px-3 py-2 lg:hidden'>
                <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-2 min-w-0'>
                        {currentBreadcrumb?.icon && (
                            <Icon
                                name={currentBreadcrumb.icon}
                                className='w-3.5 h-3.5 text-slate-500 flex-shrink-0'
                            />
                        )}
                        <h1 className='text-[13px] font-medium text-slate-900 truncate'>
                            {currentBreadcrumb?.label || 'Page'}
                        </h1>
                    </div>
                    <button
                        onClick={() => window.history.back()}
                        className='p-1 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors duration-200'
                        aria-label="Go back"
                    >
                        <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
                        </svg>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className='bg-white border-b border-slate-200 px-3 py-2 hidden lg:block'>
            <nav className='flex items-center space-x-1.5' aria-label='Breadcrumb'>
                {breadcrumbs.map((item, index) => (
                    <div key={item.href} className='flex items-center space-x-2'>
                        {index > 0 && (
                            <svg
                                className='w-3.5 h-3.5 text-slate-400 flex-shrink-0'
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
                        )}
                        
                        {item.isLast ? (
                            <div className='flex items-center space-x-1.5'>
                                {item.icon && (
                                    <Icon
                                        name={item.icon}
                                        className='w-3.5 h-3.5 text-slate-500 flex-shrink-0'
                                    />
                                )}
                                <span className='text-[13px] font-medium text-slate-900 truncate'>
                                    {item.label}
                                </span>
                            </div>
                        ) : (
                            <Link
                                href={item.href}
                                className='flex items-center space-x-1.5 text-[13px] text-slate-600 hover:text-slate-900 transition-colors duration-200 hover:bg-slate-100 px-1.5 py-0.5 rounded-md group'
                            >
                                {item.icon && (
                                    <Icon
                                        name={item.icon}
                                        className='w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 flex-shrink-0 transition-colors duration-200'
                                    />
                                )}
                                <span className='truncate max-w-[180px]'>{item.label}</span>
                            </Link>
                        )}
                    </div>
                ))}
            </nav>
        </div>
    );
}
