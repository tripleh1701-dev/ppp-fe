'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useEffect, useMemo, useRef, useState} from 'react';
import {Icon} from './Icons';
import {api} from '@/utils/api';
import AccountSettingsPanel from './AccountSettingsPanel';

interface BreadcrumbItem {
    label: string;
    href: string;
    isLast?: boolean;
    icon?: string;
    customIcon?: React.ReactNode;
}

interface BreadcrumbsProps {
    sidebarCollapsed?: boolean;
    isMobile?: boolean; // Mobile responsiveness flag
}

const pathMapping: {
    [key: string]: {label: string; icon?: string; customIcon?: React.ReactNode};
} = {
    '': {label: 'Overview', icon: 'grid'},
    inbox: {label: 'My Inbox', icon: 'mail'},
    dashboard: {label: 'Dashboard', icon: 'chart'},
    pipelines: {
        label: 'Pipelines',
        icon: 'custom',
        customIcon: (
            <svg
                className='w-4 h-4'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
            >
                {/* Connected boxes representing pipeline stages */}
                <rect
                    x='3'
                    y='9'
                    width='5'
                    height='6'
                    rx='1'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={1.8}
                    fill='none'
                />
                <rect
                    x='16'
                    y='9'
                    width='5'
                    height='6'
                    rx='1'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={1.8}
                    fill='none'
                />
                {/* Connecting line with arrow */}
                <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={1.8}
                    d='M8 12h8'
                />
                <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={1.8}
                    d='M14 10l2 2-2 2'
                />
                {/* Small download/connection node at bottom */}
                <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={1.8}
                    d='M12 15v3'
                />
                <rect
                    x='10.5'
                    y='18'
                    width='3'
                    height='3'
                    rx='0.5'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={1.8}
                    fill='none'
                />
            </svg>
        ),
    },
    canvas: {
        label: 'Canvas',
        icon: 'custom',
        customIcon: (
            <svg
                className='w-4 h-4'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                viewBox='0 0 24 24'
            >
                <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z'
                />
            </svg>
        ),
    },
    summary: {
        label: 'Pipeline Canvas',
        icon: 'custom',
        customIcon: (
            <svg
                className='w-4 h-4'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                viewBox='0 0 24 24'
            >
                {/* Canvas/Artboard frame */}
                <rect
                    x='3'
                    y='3'
                    width='18'
                    height='18'
                    rx='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                />
                {/* Connected nodes representing workflow */}
                <circle cx='8' cy='8' r='1.5' fill='currentColor' />
                <circle cx='16' cy='8' r='1.5' fill='currentColor' />
                <circle cx='12' cy='16' r='1.5' fill='currentColor' />
                {/* Connection lines */}
                <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='1.5'
                    d='M9.5 8.5L11 15'
                    opacity='0.6'
                />
                <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='1.5'
                    d='M14.5 8.5L13 15'
                    opacity='0.6'
                />
            </svg>
        ),
    },
    builds: {label: 'Builds', icon: 'flask'},
    'access-control': {label: 'Access Control', icon: 'lock'},
    'account-settings': {label: 'Account Settings', icon: 'gear'},
    'enterprise-configuration': {
        label: 'Enterprise Configuration',
        icon: 'custom',
        customIcon: (
            <svg
                className='w-4 h-4'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                viewBox='0 0 24 24'
            >
                <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01'
                />
            </svg>
        ),
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
    credentials: {
        label: 'Credential Manager',
        icon: 'custom',
        customIcon: (
            <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 24 24'>
                <path d='M12 1L3 5v6c0 5.55 3.84 9.739 9 11 5.16-1.261 9-5.45 9-11V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z' />
            </svg>
        ),
    },
    connectors: {
        label: 'Connectors',
        icon: 'custom',
        customIcon: (
            <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 24 24'>
                <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z' />
                <circle cx='8' cy='12' r='2' />
                <circle cx='16' cy='12' r='2' />
                <path d='M10 12h4' />
            </svg>
        ),
    },
    environments: {
        label: 'Environments',
        icon: 'custom',
        customIcon: (
            <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 24 24'>
                <path d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' />
                <circle
                    cx='12'
                    cy='12'
                    r='3'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='1.5'
                />
                <path
                    d='M12 1v6m0 10v6m11-7h-6M6 12H0'
                    stroke='currentColor'
                    strokeWidth='1'
                    opacity='0.6'
                />
            </svg>
        ),
    },
    webhooks: {
        label: 'Webhooks',
        icon: 'custom',
        customIcon: (
            <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 24 24'>
                <path d='M10 15l4-4-4-4v3H3v2h7v3z' />
                <path d='M21 12l-4 4v-3h-7v-2h7V8l4 4z' opacity='0.7' />
                <circle cx='12' cy='12' r='1.5' />
                <path
                    d='M12 8.5c-1.93 0-3.5 1.57-3.5 3.5s1.57 3.5 3.5 3.5 3.5-1.57 3.5-3.5-1.57-3.5-3.5-3.5z'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='1'
                    opacity='0.4'
                />
            </svg>
        ),
    },
    notifications: {
        label: 'Notifications',
        icon: 'custom',
        customIcon: (
            <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 24 24'>
                <path d='M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z' />
                <circle
                    cx='18'
                    cy='8'
                    r='3'
                    fill='currentColor'
                    opacity='0.8'
                />
                <circle cx='18' cy='8' r='1.5' fill='white' />
            </svg>
        ),
    },
    'linting-rules': {
        label: 'Linting Rules',
        icon: 'custom',
        customIcon: (
            <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 24 24'>
                <path d='M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z' />
                <path
                    d='M10,12L8,14L10,16M14,12L16,14L14,16'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='1.5'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                />
                <circle
                    cx='16'
                    cy='6'
                    r='2'
                    fill='currentColor'
                    opacity='0.8'
                />
                <path
                    d='M15 6h2'
                    stroke='white'
                    strokeWidth='1'
                    strokeLinecap='round'
                />
            </svg>
        ),
    },
    monitoring: {label: 'Monitoring', icon: 'chart'},
    templates: {label: 'Pipeline Templates', icon: 'template'},
    profile: {
        label: 'Profile',
        icon: 'custom',
        customIcon: (
            <svg
                className='w-4 h-4'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                viewBox='0 0 24 24'
            >
                <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                />
            </svg>
        ),
    },
    'privacy-policy': {
        label: 'Privacy Policy',
        icon: 'custom',
        customIcon: (
            <svg
                className='w-4 h-4'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                viewBox='0 0 24 24'
            >
                <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                />
            </svg>
        ),
    },
};

export default function Breadcrumbs({
    sidebarCollapsed = false,
    isMobile = false,
}: BreadcrumbsProps) {
    const pathname = usePathname();
    const [accounts, setAccounts] = useState<Array<{id: string; name: string}>>(
        [],
    );
    const [enterprises, setEnterprises] = useState<
        Array<{id: string; name: string}>
    >([]);
    const [selectedAccountId, setSelectedAccountId] = useState<
        string | undefined
    >(undefined);
    const [selectedEnterpriseId, setSelectedEnterpriseId] = useState<
        string | undefined
    >(undefined);
    const [accountMenuOpen, setAccountMenuOpen] = useState(false);
    const [enterpriseMenuOpen, setEnterpriseMenuOpen] = useState(false);
    const [accountSettingsPanelOpen, setAccountSettingsPanelOpen] =
        useState(false);
    const accountBtnRef = useRef<HTMLButtonElement | null>(null);
    const enterpriseBtnRef = useRef<HTMLButtonElement | null>(null);

    const breadcrumbs = useMemo(() => {
        const items: BreadcrumbItem[] = [];

        const pathValue = pathname ?? '/';

        if (pathValue === '/') {
            items.push({
                label: 'Overview',
                href: '/',
                isLast: true,
                icon: pathMapping['']?.icon,
            });
            return items;
        }

        const segments = pathValue.split('/').filter(Boolean);

        // For account-settings paths, start from Account Settings instead of Overview
        // For pipelines/canvas or pipelines/summary paths, start from Pipelines instead of Overview
        // For security-governance paths, start from Security & Governance instead of Overview
        // For access-control paths, start from Access Control instead of Overview
        const isAccountSettingsPath = segments[0] === 'account-settings';
        const isPipelineSubPath =
            segments[0] === 'pipelines' &&
            (segments[1] === 'canvas' || segments[1] === 'summary');
        const isSecurityGovernancePath = segments[0] === 'security-governance';
        const isAccessControlPath = segments[0] === 'access-control';

        if (
            !isAccountSettingsPath &&
            !isPipelineSubPath &&
            !isSecurityGovernancePath &&
            !isAccessControlPath
        ) {
            // Add home for paths that should start from Overview
            items.push({
                label: 'Overview',
                href: '/',
                isLast: false,
                icon: pathMapping['']?.icon,
            });
        }

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
                customIcon: node?.customIcon,
            });
        });

        return items;
    }, [pathname]);

    // Load accounts and enterprises
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                // Skip loading accounts on enterprise configuration page
                if (
                    typeof window !== 'undefined' &&
                    window.location.pathname.includes(
                        '/enterprise-configuration',
                    )
                ) {
                    console.log(
                        '🔄 Skipping accounts load on enterprise configuration page',
                    );
                    return;
                }

                const list = await api.get<any[]>('/api/accounts');
                if (!mounted) return;
                const mapped = (list || []).map((a) => ({
                    id: String(
                        a.id ??
                            a.accountId ??
                            a.account_id ??
                            a.uuid ??
                            a.name ??
                            Math.random(),
                    ),
                    name: String(a.accountName ?? a.name ?? 'Unnamed Account'),
                }));
                setAccounts(mapped);

                // If no accounts exist, clear localStorage
                if (mapped.length === 0) {
                    console.log(
                        '⚠️ No accounts found, clearing account selection',
                    );
                    setSelectedAccountId(undefined);
                    try {
                        window.localStorage.removeItem('selectedAccountId');
                        window.localStorage.removeItem('selectedAccountName');
                    } catch {}
                    return;
                }

                // Initialize selection
                const savedId =
                    typeof window !== 'undefined'
                        ? window.localStorage.getItem('selectedAccountId') ||
                          undefined
                        : undefined;
                const exists = savedId && mapped.some((x) => x.id === savedId);
                if (exists) {
                    setSelectedAccountId(savedId);
                    try {
                        const acc = mapped.find((x) => x.id === savedId);
                        window.localStorage.setItem(
                            'selectedAccountId',
                            savedId,
                        );
                        if (acc)
                            window.localStorage.setItem(
                                'selectedAccountName',
                                acc.name,
                            );
                    } catch {}
                } else if (mapped.length > 0) {
                    // Default to Systiva if it exists, otherwise first account
                    const systivaAccount = mapped.find(
                        (x) => x.name.toLowerCase() === 'systiva',
                    );
                    const defaultAccount = systivaAccount || mapped[0];

                    setSelectedAccountId(defaultAccount.id);
                    try {
                        window.localStorage.setItem(
                            'selectedAccountId',
                            defaultAccount.id,
                        );
                        window.localStorage.setItem(
                            'selectedAccountName',
                            defaultAccount.name,
                        );
                    } catch {}
                }
            } catch {}
        })();
        (async () => {
            try {
                const list = await api.get<Array<{id: string; name: string}>>(
                    '/api/enterprises',
                );
                if (!mounted) return;
                const mapped = (list || []).map((e) => ({
                    id: String(e.id),
                    name: e.name,
                }));
                setEnterprises(mapped);
                const savedId =
                    typeof window !== 'undefined'
                        ? window.localStorage.getItem('selectedEnterpriseId') ||
                          undefined
                        : undefined;
                const exists = savedId && mapped.some((x) => x.id === savedId);
                if (exists) {
                    setSelectedEnterpriseId(savedId);
                    try {
                        const ent = mapped.find((x) => x.id === savedId);
                        window.localStorage.setItem(
                            'selectedEnterpriseId',
                            savedId,
                        );
                        if (ent)
                            window.localStorage.setItem(
                                'selectedEnterpriseName',
                                ent.name,
                            );
                    } catch {}
                } else if (mapped.length > 0) {
                    setSelectedEnterpriseId(mapped[0].id);
                    try {
                        window.localStorage.setItem(
                            'selectedEnterpriseId',
                            mapped[0].id,
                        );
                        window.localStorage.setItem(
                            'selectedEnterpriseName',
                            mapped[0].name,
                        );
                    } catch {}
                }
            } catch {}
        })();
        return () => {
            mounted = false;
        };
    }, []);

    const accountMenuRef = useRef<HTMLDivElement | null>(null);
    const enterpriseMenuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            const target = e.target as Node;
            // Check if click is outside account button AND account menu
            if (
                accountBtnRef.current &&
                !accountBtnRef.current.contains(target) &&
                accountMenuRef.current &&
                !accountMenuRef.current.contains(target)
            ) {
                setAccountMenuOpen(false);
            }
            // Check if click is outside enterprise button AND enterprise menu
            if (
                enterpriseBtnRef.current &&
                !enterpriseBtnRef.current.contains(target) &&
                enterpriseMenuRef.current &&
                !enterpriseMenuRef.current.contains(target)
            ) {
                setEnterpriseMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, []);

    const selectedAccount = useMemo(
        () => accounts.find((a) => a.id === selectedAccountId),
        [accounts, selectedAccountId],
    );
    const selectedEnterprise = useMemo(
        () => enterprises.find((e) => e.id === selectedEnterpriseId),
        [enterprises, selectedEnterpriseId],
    );

    const updateAccount = (id: string) => {
        setSelectedAccountId(id);
        try {
            window.localStorage.setItem('selectedAccountId', id);
            const acc = accounts.find((a) => a.id === id);
            if (acc)
                window.localStorage.setItem('selectedAccountName', acc.name);

            // Dispatch custom event to notify other components
            window.dispatchEvent(
                new CustomEvent('accountChanged', {
                    detail: {id, name: acc?.name},
                }),
            );
        } catch {}
    };
    const updateEnterprise = (id: string) => {
        setSelectedEnterpriseId(id);
        try {
            window.localStorage.setItem('selectedEnterpriseId', id);
            const ent = enterprises.find((e) => e.id === id);
            if (ent)
                window.localStorage.setItem('selectedEnterpriseName', ent.name);

            // Dispatch custom event to notify other components
            window.dispatchEvent(
                new CustomEvent('enterpriseChanged', {
                    detail: {id, name: ent?.name},
                }),
            );
        } catch {}
    };

    // Mobile breadcrumbs - simplified version
    if (isMobile) {
        const currentBreadcrumb = breadcrumbs[breadcrumbs.length - 1];
        return (
            <div className='bg-white border-b border-slate-200 px-3 py-1 lg:hidden'>
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
                        aria-label='Go back'
                    >
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
                                d='M15 19l-7-7 7-7'
                            />
                        </svg>
                    </button>
                </div>
                <div className='mt-0.5 flex items-center justify-end gap-3'>
                    <div className='flex items-center gap-1.5 text-[11px] text-slate-700'>
                        <Icon
                            name='account'
                            className='w-3.5 h-3.5 text-slate-500'
                        />
                        <span className='truncate max-w-[140px]'>
                            {selectedAccount?.name || 'No accounts'}
                        </span>
                    </div>
                    <div className='flex items-center gap-1.5 text-[11px] text-slate-500'>
                        <Icon
                            name='enterprise'
                            className='w-3.5 h-3.5 text-slate-400'
                        />
                        <span className='truncate max-w-[140px]'>
                            {selectedEnterprise?.name || 'No enterprises'}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className='bg-white border-b border-slate-200 px-3 py-1 hidden lg:block'>
            <div className='flex items-center'>
                <nav
                    className='flex items-center space-x-1.5'
                    aria-label='Breadcrumb'
                >
                    {breadcrumbs.map((item, index) => (
                        <div
                            key={item.href}
                            className='flex items-center space-x-2'
                        >
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
                                    {item.customIcon ? (
                                        <div className='text-slate-500 flex-shrink-0'>
                                            {item.customIcon}
                                        </div>
                                    ) : (
                                        item.icon && (
                                            <Icon
                                                name={item.icon}
                                                className='w-3.5 h-3.5 text-slate-500 flex-shrink-0'
                                            />
                                        )
                                    )}
                                    <span className='text-[13px] font-semibold text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-500 truncate'>
                                        {item.label}
                                    </span>
                                </div>
                            ) : item.label === 'Account Settings' ? (
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setAccountSettingsPanelOpen(true);
                                    }}
                                    className='flex items-center space-x-1.5 text-[13px] text-slate-600 transition-colors duration-200 hover:bg-slate-100 px-1.5 py-0.5 rounded-md group'
                                >
                                    {item.customIcon ? (
                                        <div className='text-slate-400 group-hover:text-primary flex-shrink-0 transition-colors duration-200'>
                                            {item.customIcon}
                                        </div>
                                    ) : (
                                        item.icon && (
                                            <Icon
                                                name={item.icon}
                                                className='w-3.5 h-3.5 text-slate-400 group-hover:text-primary flex-shrink-0 transition-colors duration-200'
                                            />
                                        )
                                    )}
                                    <span className='truncate max-w-[180px] group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-primary group-hover:to-indigo-500 transition-colors duration-200'>
                                        {item.label}
                                    </span>
                                </button>
                            ) : (
                                <Link
                                    href={item.href}
                                    className='flex items-center space-x-1.5 text-[13px] text-slate-600 transition-colors duration-200 hover:bg-slate-100 px-1.5 py-0.5 rounded-md group'
                                >
                                    {item.customIcon ? (
                                        <div className='text-slate-400 group-hover:text-primary flex-shrink-0 transition-colors duration-200'>
                                            {item.customIcon}
                                        </div>
                                    ) : (
                                        item.icon && (
                                            <Icon
                                                name={item.icon}
                                                className='w-3.5 h-3.5 text-slate-400 group-hover:text-primary flex-shrink-0 transition-colors duration-200'
                                            />
                                        )
                                    )}
                                    <span className='truncate max-w-[180px] group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-primary group-hover:to-indigo-500 transition-colors duration-200'>
                                        {item.label}
                                    </span>
                                </Link>
                            )}
                        </div>
                    ))}
                </nav>

                {/* Right aligned selections */}
                <div className='ml-auto flex items-center gap-3'>
                    {/* Account Selector */}
                    <div className='relative'>
                        {accounts.length === 0 ? (
                            <div className='inline-flex items-center gap-1.5 text-[12px] text-slate-400'>
                                <Icon name='account' className='w-3.5 h-3.5' />
                                <span>No accounts</span>
                            </div>
                        ) : accounts.length === 1 ? (
                            <div className='inline-flex items-center gap-1.5 text-[12px]'>
                                <Icon
                                    name='account'
                                    className='w-3.5 h-3.5 text-slate-500'
                                />
                                <span className='text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-500'>
                                    {accounts[0].name}
                                </span>
                            </div>
                        ) : (
                            <button
                                ref={accountBtnRef}
                                onClick={() => setAccountMenuOpen((v) => !v)}
                                className='group inline-flex items-center gap-1.5 text-[12px] text-slate-700 hover:bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 hover:border-primary/30 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20'
                                aria-haspopup='listbox'
                                aria-expanded={accountMenuOpen}
                            >
                                <Icon
                                    name='account'
                                    className='w-4 h-4 text-slate-600 group-hover:text-primary transition-colors duration-200'
                                />
                                <span className='truncate max-w-[180px] group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-primary group-hover:to-indigo-500 transition-colors duration-200'>
                                    {selectedAccount?.name || 'Select account'}
                                </span>
                                <svg
                                    className='w-3 h-3 text-slate-500'
                                    viewBox='0 0 20 20'
                                    fill='currentColor'
                                >
                                    <path
                                        fillRule='evenodd'
                                        d='M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z'
                                        clipRule='evenodd'
                                    />
                                </svg>
                            </button>
                        )}
                        {accountMenuOpen &&
                            accounts.length > 1 &&
                            selectedAccountId && (
                                <div
                                    ref={accountMenuRef}
                                    className='absolute right-0 mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 origin-top-right animate-[scaleIn_120ms_ease-out]'
                                    role='listbox'
                                >
                                    <ul className='max-h-64 overflow-auto py-1'>
                                        {accounts.map((a) => (
                                            <li key={a.id}>
                                                <button
                                                    onClick={() => {
                                                        if (
                                                            a.id !==
                                                            selectedAccountId
                                                        ) {
                                                            updateAccount(a.id);
                                                            // Ensure enterprise stays selected; consumers rely on localStorage
                                                        }
                                                        setAccountMenuOpen(
                                                            false,
                                                        );
                                                    }}
                                                    className={`w-full text-left px-3 py-1.5 text-[12px] rounded-md transition-all duration-150 hover:bg-gradient-to-r hover:from-primary/8 hover:to-indigo-50 hover:translate-x-[1px] ${
                                                        selectedAccountId ===
                                                        a.id
                                                            ? 'text-primary-700 bg-gradient-to-r from-primary/12 to-indigo-50 font-semibold'
                                                            : 'text-slate-700'
                                                    }`}
                                                    role='option'
                                                    aria-selected={
                                                        selectedAccountId ===
                                                        a.id
                                                    }
                                                >
                                                    {a.name}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                    </div>

                    {/* Enterprise Selector */}
                    <div className='relative'>
                        {enterprises.length === 0 ? (
                            <div className='inline-flex items-center gap-1.5 text-[12px] text-slate-400'>
                                <Icon
                                    name='enterprise'
                                    className='w-3.5 h-3.5'
                                />
                                <span>No enterprises</span>
                            </div>
                        ) : enterprises.length === 1 ? (
                            <div className='inline-flex items-center gap-1.5 text-[12px]'>
                                <Icon
                                    name='enterprise'
                                    className='w-3.5 h-3.5 text-slate-400'
                                />
                                <span className='text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-500'>
                                    {enterprises[0].name}
                                </span>
                            </div>
                        ) : (
                            <button
                                ref={enterpriseBtnRef}
                                onClick={() => setEnterpriseMenuOpen((v) => !v)}
                                className='group inline-flex items-center gap-1.5 text-[12px] text-slate-700 hover:bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 hover:border-primary/30 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20'
                                aria-haspopup='listbox'
                                aria-expanded={enterpriseMenuOpen}
                            >
                                <Icon
                                    name='enterprise'
                                    className='w-4 h-4 text-primary transition-colors duration-200'
                                />
                                <span className='truncate max-w-[180px] text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-500 transition-colors duration-200'>
                                    {selectedEnterprise?.name ||
                                        'Select enterprise'}
                                </span>
                                <svg
                                    className='w-3 h-3 text-slate-500'
                                    viewBox='0 0 20 20'
                                    fill='currentColor'
                                >
                                    <path
                                        fillRule='evenodd'
                                        d='M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z'
                                        clipRule='evenodd'
                                    />
                                </svg>
                            </button>
                        )}
                        {enterpriseMenuOpen &&
                            enterprises.length > 1 &&
                            selectedEnterpriseId && (
                                <div
                                    ref={enterpriseMenuRef}
                                    className='absolute right-0 mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 origin-top-right animate-[scaleIn_120ms_ease-out]'
                                    role='listbox'
                                >
                                    <ul className='max-h-64 overflow-auto py-1'>
                                        {enterprises.map((e) => (
                                            <li key={e.id}>
                                                <button
                                                    onClick={() => {
                                                        if (
                                                            e.id !==
                                                            selectedEnterpriseId
                                                        ) {
                                                            updateEnterprise(
                                                                e.id,
                                                            );
                                                        }
                                                        setEnterpriseMenuOpen(
                                                            false,
                                                        );
                                                    }}
                                                    className={`w-full text-left px-3 py-1.5 text-[12px] rounded-md transition-all duration-150 hover:bg-gradient-to-r hover:from-primary/8 hover:to-indigo-50 hover:translate-x-[1px] ${
                                                        selectedEnterpriseId ===
                                                        e.id
                                                            ? 'text-primary-700 bg-gradient-to-r from-primary/12 to-indigo-50 font-semibold'
                                                            : 'text-slate-700'
                                                    }`}
                                                    role='option'
                                                    aria-selected={
                                                        selectedEnterpriseId ===
                                                        e.id
                                                    }
                                                >
                                                    {e.name}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                    </div>
                </div>
            </div>

            {/* Account Settings Panel */}
            <AccountSettingsPanel
                isOpen={accountSettingsPanelOpen}
                onClose={() => setAccountSettingsPanelOpen(false)}
                sidebarWidth={sidebarCollapsed ? 64 : 256}
            />
        </div>
    );
}
