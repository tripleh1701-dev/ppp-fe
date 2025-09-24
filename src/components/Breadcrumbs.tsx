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
}

interface BreadcrumbsProps {
    sidebarCollapsed?: boolean;
    isMobile?: boolean; // Mobile responsiveness flag
}

const pathMapping: {[key: string]: {label: string; icon?: string}} = {
    '': {label: 'Overview', icon: 'grid'},
    inbox: {label: 'My Inbox', icon: 'mail'},
    dashboard: {label: 'Dashboard', icon: 'chart'},
    pipelines: {label: 'Pipelines', icon: 'bolt'},
    canvas: {label: 'Canvas', icon: 'template'},
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
        // For pipelines/canvas paths, start from Pipelines instead of Overview
        const isAccountSettingsPath = segments[0] === 'account-settings';
        const isPipelineCanvasPath =
            segments[0] === 'pipelines' && segments[1] === 'canvas';

        if (!isAccountSettingsPath && !isPipelineCanvasPath) {
            // Add home for non-account-settings and non-pipeline-canvas paths
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
                    setSelectedAccountId(mapped[0].id);
                    try {
                        window.localStorage.setItem(
                            'selectedAccountId',
                            mapped[0].id,
                        );
                        window.localStorage.setItem(
                            'selectedAccountName',
                            mapped[0].name,
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

    useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            const target = e.target as Node;
            if (
                accountBtnRef.current &&
                !accountBtnRef.current.contains(target)
            )
                setAccountMenuOpen(false);
            if (
                enterpriseBtnRef.current &&
                !enterpriseBtnRef.current.contains(target)
            )
                setEnterpriseMenuOpen(false);
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
        } catch {}
    };
    const updateEnterprise = (id: string) => {
        setSelectedEnterpriseId(id);
        try {
            window.localStorage.setItem('selectedEnterpriseId', id);
            const ent = enterprises.find((e) => e.id === id);
            if (ent)
                window.localStorage.setItem('selectedEnterpriseName', ent.name);
        } catch {}
    };

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
                <div className='mt-1 flex items-center justify-end gap-3'>
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
        <div className='bg-white border-b border-slate-200 px-3 py-2 hidden lg:block'>
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
                                    {item.icon && (
                                        <Icon
                                            name={item.icon}
                                            className='w-3.5 h-3.5 text-slate-500 flex-shrink-0'
                                        />
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
                                    {item.icon && (
                                        <Icon
                                            name={item.icon}
                                            className='w-3.5 h-3.5 text-slate-400 group-hover:text-primary flex-shrink-0 transition-colors duration-200'
                                        />
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
                                    {item.icon && (
                                        <Icon
                                            name={item.icon}
                                            className='w-3.5 h-3.5 text-slate-400 group-hover:text-primary flex-shrink-0 transition-colors duration-200'
                                        />
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
                                className='group inline-flex items-center gap-1.5 text-[12px] text-slate-700 hover:bg-slate-100 px-2 py-1 rounded-md border border-slate-200 hover:border-primary/30 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20'
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
                                    className='absolute right-0 mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 origin-top-right animate-[scaleIn_120ms_ease-out]'
                                    role='listbox'
                                >
                                    <ul className='max-h-64 overflow-auto py-2'>
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
                                                    className={`w-full text-left px-3 py-2 text-[12px] rounded-md transition-all duration-150 hover:bg-gradient-to-r hover:from-primary/8 hover:to-indigo-50 hover:translate-x-[1px] ${
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
                                className='group inline-flex items-center gap-1.5 text-[12px] text-slate-700 hover:bg-slate-100 px-2 py-1 rounded-md border border-slate-200 hover:border-primary/30 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20'
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
                                    className='absolute right-0 mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 origin-top-right animate-[scaleIn_120ms_ease-out]'
                                    role='listbox'
                                >
                                    <ul className='max-h-64 overflow-auto py-2'>
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
                                                    className={`w-full text-left px-3 py-2 text-[12px] rounded-md transition-all duration-150 hover:bg-gradient-to-r hover:from-primary/8 hover:to-indigo-50 hover:translate-x-[1px] ${
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
