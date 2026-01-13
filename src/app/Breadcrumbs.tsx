'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useEffect, useMemo, useRef, useState} from 'react';
import {Icon} from '@/components/Icons';
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
    integrations: {label: 'Integrations', icon: 'flask'},
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
    const [allAccountsData, setAllAccountsData] = useState<any[]>([]); // Store full account data for filtering
    const [enterprises, setEnterprises] = useState<
        Array<{id: string; name: string}>
    >([]);
    const [allEnterprises, setAllEnterprises] = useState<
        Array<{id: string; name: string}>
    >([]); // Store all enterprises for filtering
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
        segments.forEach((segment: string, index: number) => {
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

    // Load accounts, enterprises, and user preferences from backend (DynamoDB, not localStorage)
    useEffect(() => {
        let mounted = true;

        // First, try to load saved preferences from backend API
        const loadSavedPreferences = async (): Promise<{
            accountId?: string;
            accountName?: string;
            enterpriseId?: string;
            enterpriseName?: string;
        }> => {
            try {
                const response = await api.get<any>(
                    '/api/user-preferences/current-context',
                );
                if (response?.accountId && response?.enterpriseId) {
                    console.log(
                        '📦 [Breadcrumbs] Loaded preferences from DynamoDB:',
                        response,
                    );
                    // Also save to localStorage for backward compatibility with other components
                    if (typeof window !== 'undefined') {
                        if (response.accountId)
                            window.localStorage.setItem(
                                'selectedAccountId',
                                response.accountId,
                            );
                        if (response.accountName)
                            window.localStorage.setItem(
                                'selectedAccountName',
                                response.accountName,
                            );
                        if (response.enterpriseId)
                            window.localStorage.setItem(
                                'selectedEnterpriseId',
                                response.enterpriseId,
                            );
                        if (response.enterpriseName)
                            window.localStorage.setItem(
                                'selectedEnterpriseName',
                                response.enterpriseName,
                            );
                        console.log(
                            '✅ [Breadcrumbs] Synced preferences to localStorage:',
                            response,
                        );
                        // Dispatch events so other components can react
                        window.dispatchEvent(new CustomEvent('accountChanged'));
                        window.dispatchEvent(
                            new CustomEvent('enterpriseChanged'),
                        );
                    }
                    return {
                        accountId: response.accountId,
                        accountName: response.accountName,
                        enterpriseId: response.enterpriseId,
                        enterpriseName: response.enterpriseName,
                    };
                }
            } catch (error) {
                console.log(
                    '⚠️ [Breadcrumbs] Could not load preferences from backend',
                );
            }
            return {};
        };

        (async () => {
            // Load preferences first
            const savedPrefs = await loadSavedPreferences();

            try {
                console.log('🔄 Loading accounts for breadcrumb...');
                const rawList = await api.get<any>('/api/accounts');
                if (!mounted) return;

                // Handle various response formats
                let list: any[] = [];
                if (Array.isArray(rawList)) {
                    list = rawList;
                } else if (
                    rawList?.data?.accounts &&
                    Array.isArray(rawList.data.accounts)
                ) {
                    list = rawList.data.accounts;
                } else if (
                    rawList?.accounts &&
                    Array.isArray(rawList.accounts)
                ) {
                    list = rawList.accounts;
                } else if (rawList?.data && Array.isArray(rawList.data)) {
                    list = rawList.data;
                }

                console.log('📦 [Breadcrumbs] Accounts loaded:', list.length);

                // Store full account data for enterprise filtering (includes licenses)
                setAllAccountsData(list || []);

                const mapped = (list || []).map((a: any) => ({
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

                // If no accounts exist, clear selection
                if (mapped.length === 0) {
                    console.log(
                        '⚠️ No accounts found, clearing account selection',
                    );
                    setSelectedAccountId(undefined);
                    return;
                }

                // Initialize selection from backend preferences or default
                const exists =
                    savedPrefs.accountId &&
                    mapped.some((x) => x.id === savedPrefs.accountId);
                if (exists) {
                    setSelectedAccountId(savedPrefs.accountId);
                } else if (mapped.length > 0) {
                    // Default to Systiva if it exists, otherwise first account
                    const systivaAccount = mapped.find(
                        (x) => x.name.toLowerCase() === 'systiva',
                    );
                    const defaultAccount = systivaAccount || mapped[0];
                    setSelectedAccountId(defaultAccount.id);
                    // Save default to localStorage for components that read from it
                    if (typeof window !== 'undefined') {
                        window.localStorage.setItem(
                            'selectedAccountId',
                            defaultAccount.id,
                        );
                        window.localStorage.setItem(
                            'selectedAccountName',
                            defaultAccount.name,
                        );
                        console.log(
                            '✅ [Breadcrumbs] Saved default account to localStorage:',
                            defaultAccount,
                        );
                        window.dispatchEvent(new CustomEvent('accountChanged'));
                    }
                }
            } catch {}
        })();
        (async () => {
            // Load preferences first
            const savedPrefs = await loadSavedPreferences();

            try {
                const rawEnterprises = await api.get<any>('/api/enterprises');
                if (!mounted) return;

                // Handle various response formats
                let list: Array<{id: string; name: string}> = [];
                if (Array.isArray(rawEnterprises)) {
                    list = rawEnterprises;
                } else if (
                    rawEnterprises?.data?.enterprises &&
                    Array.isArray(rawEnterprises.data.enterprises)
                ) {
                    list = rawEnterprises.data.enterprises;
                } else if (
                    rawEnterprises?.enterprises &&
                    Array.isArray(rawEnterprises.enterprises)
                ) {
                    list = rawEnterprises.enterprises;
                } else if (
                    rawEnterprises?.data &&
                    Array.isArray(rawEnterprises.data)
                ) {
                    list = rawEnterprises.data;
                }

                console.log(
                    '📦 [Breadcrumbs] Enterprises loaded:',
                    list.length,
                );

                const mapped = (list || []).map(
                    (e: {id: string; name: string}) => ({
                        id: String(e.id),
                        name: e.name,
                    }),
                );
                setAllEnterprises(mapped); // Store all enterprises
                setEnterprises(mapped); // Initially show all

                // Initialize selection from backend preferences or default
                const exists =
                    savedPrefs.enterpriseId &&
                    mapped.some((x) => x.id === savedPrefs.enterpriseId);
                if (exists) {
                    setSelectedEnterpriseId(savedPrefs.enterpriseId);
                } else if (mapped.length > 0) {
                    const defaultEnterprise = mapped[0];
                    setSelectedEnterpriseId(defaultEnterprise.id);
                    // Save default to localStorage for components that read from it
                    if (typeof window !== 'undefined') {
                        window.localStorage.setItem(
                            'selectedEnterpriseId',
                            defaultEnterprise.id,
                        );
                        window.localStorage.setItem(
                            'selectedEnterpriseName',
                            defaultEnterprise.name,
                        );
                        console.log(
                            '✅ [Breadcrumbs] Saved default enterprise to localStorage:',
                            defaultEnterprise,
                        );
                        window.dispatchEvent(
                            new CustomEvent('enterpriseChanged'),
                        );
                    }
                }
            } catch {}
        })();
        return () => {
            mounted = false;
        };
    }, []);

    // Filter enterprises based on selected account's licenses
    useEffect(() => {
        const filterEnterprisesByAccount = () => {
            if (!selectedAccountId || allEnterprises.length === 0) {
                // If no account selected or no enterprises loaded, show all
                setEnterprises(allEnterprises);
                return;
            }

            // Use cached account data instead of making another API call
            if (allAccountsData.length === 0) {
                console.log(
                    '⏳ [Breadcrumbs] Waiting for accounts data to load...',
                );
                setEnterprises(allEnterprises);
                return;
            }

            console.log(
                '🔍 [Breadcrumbs] Filtering enterprises for account:',
                selectedAccountId,
            );

            // Find the selected account from cached data
            const selectedAccount = allAccountsData.find(
                (acc: any) =>
                    String(acc.id || acc.accountId) === selectedAccountId,
            );

            console.log(
                '🔍 [Breadcrumbs] Selected account data:',
                selectedAccount,
            );

            const enterpriseIds = new Set<string>();

            // Check for licenses in the account data
            if (selectedAccount) {
                // Check for licenses array
                const licenses =
                    selectedAccount.licenses ||
                    selectedAccount.accountLicenses ||
                    [];
                console.log('📦 [Breadcrumbs] Account licenses:', licenses);

                if (Array.isArray(licenses) && licenses.length > 0) {
                    licenses.forEach((license: any) => {
                        // Try to get enterprise ID directly
                        if (license.enterpriseId) {
                            enterpriseIds.add(String(license.enterpriseId));
                        }
                        // Or match enterprise NAME to get the ID
                        else if (license.enterprise) {
                            const matchedEnterprise = allEnterprises.find(
                                (ent: {id: string; name: string}) =>
                                    ent.name.toLowerCase() ===
                                    String(license.enterprise).toLowerCase(),
                            );
                            if (matchedEnterprise) {
                                enterpriseIds.add(matchedEnterprise.id);
                                console.log(
                                    `✅ [Breadcrumbs] Matched enterprise "${license.enterprise}" to ID: ${matchedEnterprise.id}`,
                                );
                            }
                        }
                    });
                }

                // Also check direct enterpriseId field
                if (selectedAccount.enterpriseId) {
                    enterpriseIds.add(String(selectedAccount.enterpriseId));
                }
            }

            console.log(
                '🔍 [Breadcrumbs] Enterprise IDs from licenses:',
                Array.from(enterpriseIds),
            );
            console.log(
                '🔍 [Breadcrumbs] License count for account:',
                selectedAccount?.licenses?.length || 0,
            );

            // Filter allEnterprises to only show those with licenses for this account
            // If account has no licenses, show all enterprises (not empty list)
            const filtered =
                enterpriseIds.size > 0
                    ? allEnterprises.filter((ent: {id: string; name: string}) =>
                          enterpriseIds.has(ent.id),
                      )
                    : allEnterprises; // Show all if no license filtering

            console.log(
                `✅ [Breadcrumbs] Filtered enterprises: ${filtered.length} of ${allEnterprises.length}`,
            );
            console.log(
                `📋 [Breadcrumbs] Account "${
                    selectedAccount?.accountName || selectedAccount?.name
                }" has ${enterpriseIds.size} licensed enterprises`,
            );

            setEnterprises(filtered);

            // If no enterprises available, clear selection
            if (filtered.length === 0) {
                console.log(
                    '⚠️ [Breadcrumbs] No enterprises available for this account, clearing selection',
                );
                setSelectedEnterpriseId(undefined);
                // Clear enterprise from localStorage
                if (typeof window !== 'undefined') {
                    window.localStorage.removeItem('selectedEnterpriseId');
                    window.localStorage.removeItem('selectedEnterpriseName');
                    window.dispatchEvent(new CustomEvent('enterpriseChanged'));
                }
                // Dispatch context change event
                const currentAccount = accounts.find(
                    (a: {id: string; name: string}) =>
                        a.id === selectedAccountId,
                );
                window.dispatchEvent(
                    new CustomEvent('breadcrumbContextChanged', {
                        detail: {
                            accountId: selectedAccountId,
                            accountName: currentAccount?.name,
                            enterpriseId: undefined,
                            enterpriseName: undefined,
                        },
                    }),
                );
            }
            // If enterprises available, ensure one is selected
            else if (
                !selectedEnterpriseId ||
                !filtered.some(
                    (e: {id: string; name: string}) =>
                        e.id === selectedEnterpriseId,
                )
            ) {
                console.log(
                    '⚠️ [Breadcrumbs] Auto-selecting first available enterprise:',
                    filtered[0].name,
                );
                setSelectedEnterpriseId(filtered[0].id);
                // Save to backend and dispatch context change event
                const currentAccount = accounts.find(
                    (a: {id: string; name: string}) =>
                        a.id === selectedAccountId,
                );
                if (selectedAccountId && currentAccount) {
                    saveContextToBackend(
                        selectedAccountId,
                        currentAccount.name,
                        filtered[0].id,
                        filtered[0].name,
                    );
                }
                window.dispatchEvent(
                    new CustomEvent('breadcrumbContextChanged', {
                        detail: {
                            accountId: selectedAccountId,
                            accountName: currentAccount?.name,
                            enterpriseId: filtered[0].id,
                            enterpriseName: filtered[0].name,
                        },
                    }),
                );
            } else {
                console.log(
                    '✅ [Breadcrumbs] Current enterprise is valid for this account:',
                    selectedEnterpriseId,
                );
            }
        };

        filterEnterprisesByAccount();
    }, [
        selectedAccountId,
        allEnterprises,
        allAccountsData,
        selectedEnterpriseId,
    ]);

    const accountMenuRef = useRef<HTMLDivElement | null>(null);
    const enterpriseMenuRef = useRef<HTMLDivElement | null>(null);

    // Listen for requestBreadcrumbContext events from other components
    useEffect(() => {
        const handleContextRequest = () => {
            // Dispatch current context to requesting components
            const acc = accounts.find(
                (a: {id: string; name: string}) => a.id === selectedAccountId,
            );
            const ent = enterprises.find(
                (e: {id: string; name: string}) =>
                    e.id === selectedEnterpriseId,
            );

            if (selectedAccountId && selectedEnterpriseId) {
                window.dispatchEvent(
                    new CustomEvent('breadcrumbContextChanged', {
                        detail: {
                            accountId: selectedAccountId,
                            accountName: acc?.name,
                            enterpriseId: selectedEnterpriseId,
                            enterpriseName: ent?.name,
                        },
                    }),
                );
            }
        };

        window.addEventListener(
            'requestBreadcrumbContext',
            handleContextRequest,
        );
        return () => {
            window.removeEventListener(
                'requestBreadcrumbContext',
                handleContextRequest,
            );
        };
    }, [selectedAccountId, selectedEnterpriseId, accounts, enterprises]);

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
        () =>
            accounts.find(
                (a: {id: string; name: string}) => a.id === selectedAccountId,
            ),
        [accounts, selectedAccountId],
    );
    const selectedEnterprise = useMemo(
        () =>
            enterprises.find(
                (e: {id: string; name: string}) =>
                    e.id === selectedEnterpriseId,
            ),
        [enterprises, selectedEnterpriseId],
    );

    // Save context to backend API (DynamoDB) AND localStorage for backward compatibility
    const saveContextToBackend = async (
        accountId: string,
        accountName: string,
        enterpriseId: string,
        enterpriseName: string,
    ) => {
        // Save to localStorage for components that still read from it
        if (typeof window !== 'undefined') {
            window.localStorage.setItem('selectedAccountId', accountId);
            window.localStorage.setItem('selectedAccountName', accountName);
            window.localStorage.setItem('selectedEnterpriseId', enterpriseId);
            window.localStorage.setItem(
                'selectedEnterpriseName',
                enterpriseName,
            );
            console.log('✅ Saved context to localStorage:', {
                accountId,
                accountName,
                enterpriseId,
                enterpriseName,
            });

            // Dispatch events to notify listening components
            window.dispatchEvent(new CustomEvent('accountChanged'));
            window.dispatchEvent(new CustomEvent('enterpriseChanged'));
        }

        // Also save to backend API (DynamoDB)
        try {
            await api.post('/api/user-preferences/current-context', {
                accountId,
                accountName,
                enterpriseId,
                enterpriseName,
            });
            console.log('✅ Saved context to DynamoDB');
        } catch (error) {
            console.log('⚠️ Failed to save context to backend:', error);
        }
    };

    const updateAccount = (id: string, skipEnterpriseSync = false) => {
        setSelectedAccountId(id);
        const acc = accounts.find(
            (a: {id: string; name: string}) => a.id === id,
        );

        // Dispatch custom event to notify other components (WorkflowBuilder listens to this)
        const currentEnterprise = enterprises.find(
            (e: {id: string; name: string}) => e.id === selectedEnterpriseId,
        );
        window.dispatchEvent(
            new CustomEvent('breadcrumbContextChanged', {
                detail: {
                    accountId: id,
                    accountName: acc?.name,
                    enterpriseId: selectedEnterpriseId,
                    enterpriseName: currentEnterprise?.name,
                },
            }),
        );

        // Save to backend API (DynamoDB)
        if (acc && selectedEnterpriseId && currentEnterprise) {
            saveContextToBackend(
                id,
                acc.name,
                selectedEnterpriseId,
                currentEnterprise.name,
            );
        }

        // Auto-select "Global" enterprise when "Systiva" account is selected (case insensitive)
        if (!skipEnterpriseSync && acc?.name?.toLowerCase() === 'systiva') {
            const globalEnterprise = enterprises.find(
                (e: {id: string; name: string}) =>
                    e.name?.toLowerCase() === 'global',
            );
            if (
                globalEnterprise &&
                globalEnterprise.id !== selectedEnterpriseId
            ) {
                console.log(
                    '🔄 Auto-selecting Global enterprise for Systiva account',
                );
                updateEnterprise(globalEnterprise.id, true); // Skip account sync to avoid loop
            }
        }
    };

    const updateEnterprise = (id: string, skipAccountSync = false) => {
        setSelectedEnterpriseId(id);
        const ent = enterprises.find(
            (e: {id: string; name: string}) => e.id === id,
        );

        // Dispatch custom event to notify other components (WorkflowBuilder listens to this)
        const currentAccount = accounts.find(
            (a: {id: string; name: string}) => a.id === selectedAccountId,
        );
        window.dispatchEvent(
            new CustomEvent('breadcrumbContextChanged', {
                detail: {
                    accountId: selectedAccountId,
                    accountName: currentAccount?.name,
                    enterpriseId: id,
                    enterpriseName: ent?.name,
                },
            }),
        );

        // Save to backend API (DynamoDB)
        if (selectedAccountId && currentAccount && ent) {
            saveContextToBackend(
                selectedAccountId,
                currentAccount.name,
                id,
                ent.name,
            );
        }

        // Auto-select "Systiva" account when "Global" enterprise is selected (case insensitive)
        if (!skipAccountSync && ent?.name?.toLowerCase() === 'global') {
            const systivaAccount = accounts.find(
                (a: {id: string; name: string}) =>
                    a.name?.toLowerCase() === 'systiva',
            );
            if (systivaAccount && systivaAccount.id !== selectedAccountId) {
                console.log(
                    '🔄 Auto-selecting Systiva account for Global enterprise',
                );
                updateAccount(systivaAccount.id, true); // Skip enterprise sync to avoid loop
            }
        }
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
                    {breadcrumbs.map((item: BreadcrumbItem, index: number) => (
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
                                    onClick={(e: React.MouseEvent) => {
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
                    {/* Account Selector - Always show dropdown if accounts exist */}
                    <div className='relative'>
                        {accounts.length === 0 ? (
                            <div className='inline-flex items-center gap-1.5 text-[12px] text-slate-400'>
                                <Icon name='account' className='w-3.5 h-3.5' />
                                <span>No accounts</span>
                            </div>
                        ) : (
                            <button
                                ref={accountBtnRef}
                                onClick={() =>
                                    setAccountMenuOpen((v: boolean) => !v)
                                }
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
                        {accountMenuOpen && accounts.length > 0 && (
                            <div
                                ref={accountMenuRef}
                                className='absolute right-0 mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 origin-top-right animate-[scaleIn_120ms_ease-out]'
                                role='listbox'
                            >
                                <ul className='max-h-64 overflow-auto py-1'>
                                    {accounts.map(
                                        (a: {id: string; name: string}) => (
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
                                        ),
                                    )}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Enterprise Selector - Always show dropdown if enterprises exist */}
                    <div className='relative'>
                        {enterprises.length === 0 ? (
                            <div className='inline-flex items-center gap-1.5 text-[12px] text-slate-400'>
                                <Icon
                                    name='enterprise'
                                    className='w-3.5 h-3.5'
                                />
                                <span>No enterprises</span>
                            </div>
                        ) : (
                            <button
                                ref={enterpriseBtnRef}
                                onClick={() =>
                                    setEnterpriseMenuOpen((v: boolean) => !v)
                                }
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
                        {enterpriseMenuOpen && enterprises.length > 0 && (
                            <div
                                ref={enterpriseMenuRef}
                                className='absolute right-0 mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 origin-top-right animate-[scaleIn_120ms_ease-out]'
                                role='listbox'
                            >
                                <ul className='max-h-64 overflow-auto py-1'>
                                    {enterprises.map(
                                        (e: {id: string; name: string}) => (
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
                                        ),
                                    )}
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
