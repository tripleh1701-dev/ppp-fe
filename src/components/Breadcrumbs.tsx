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

    // Only hide if no items at all, or only username without other navigation
    if (breadcrumbs.length === 0 || (breadcrumbs.length === 1 && !username)) {
        return null;
    }

    return (
        <>
            <div className='bg-white/90 backdrop-blur border-b border-slate-200 px-6 py-3 shadow-sm sticky top-0 z-30'>
                <div className='flex items-center justify-between'>
                    <nav className='flex items-center flex-wrap gap-1 text-sm'>
                        {breadcrumbs.map((item, index) => (
                            <div
                                key={item.href}
                                className='flex items-center gap-1'
                            >
                                {index > 0 && (
                                    <svg
                                        className='w-3.5 h-3.5 text-slate-400'
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
                                    <span className='inline-flex items-center gap-2 text-slate-800 font-semibold px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100'>
                                        {item.icon && (
                                            <Icon
                                                name={item.icon}
                                                size={16}
                                                className='text-indigo-600'
                                            />
                                        )}
                                        {item.label}
                                    </span>
                                ) : (
                                    <Link
                                        href={item.href}
                                        className='inline-flex items-center gap-2 text-slate-600 hover:text-indigo-700 px-2 py-1 rounded-md hover:bg-indigo-50 transition-colors font-medium'
                                    >
                                        {item.icon && (
                                            <Icon
                                                name={item.icon}
                                                size={14}
                                                className='text-slate-500'
                                            />
                                        )}
                                        {item.label}
                                    </Link>
                                )}
                            </div>
                        ))}
                    </nav>

                    {/* Account Settings Button */}
                    <div className='flex items-center space-x-4'>
                        {/* Account Settings button removed - available in sidebar */}
                    </div>
                </div>
            </div>
        </>
    );
}
