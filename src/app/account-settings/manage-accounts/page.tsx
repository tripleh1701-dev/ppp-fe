'use client';

import {useState, useEffect, useMemo, useRef} from 'react';
import {
    PlusIcon,
    MagnifyingGlassIcon,
    UserCircleIcon,
    FunnelIcon,
    ArrowsUpDownIcon,
    EyeSlashIcon,
    RectangleStackIcon,
} from '@heroicons/react/24/outline';
import ConfirmModal from '@/components/ConfirmModal';
import AccountsTable, {AccountRow} from '@/components/AccountsTable';
import {api} from '@/utils/api';
// Reusable trash button (same visuals/behavior)
function ToolbarTrashButton({
    onClick,
    bounce = false,
}: {
    onClick?: () => void;
    bounce?: boolean;
}) {
    const [over, setOver] = useState(false);
    return (
        <button
            id='accounts-trash-target'
            type='button'
            onClick={onClick}
            aria-label='Trash'
            aria-dropeffect='move'
            className={`relative ml-3 inline-flex items-center justify-center w-10 h-10 rounded-full border shadow-sm transition-all duration-200 group ${
                over
                    ? 'bg-rose-50 border-rose-200 ring-4 ring-rose-300/50 scale-105'
                    : 'bg-white border-light hover:shadow-md'
            } ${over ? 'drag-over' : ''}`}
            title='Trash'
            onDragOver={(e) => {
                e.preventDefault();
                try {
                    e.dataTransfer.dropEffect = 'move';
                } catch {}
                if (!over) setOver(true);
            }}
            onDragEnter={() => setOver(true)}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => {
                setOver(false);
                try {
                    const json = e.dataTransfer.getData('application/json');
                    if (!json) return;
                    const payload = JSON.parse(json);
                    const rowId = payload?.rowId as string | undefined;
                    if (!rowId) return;
                    const event = new CustomEvent('accounts-row-drop-trash', {
                        detail: {rowId},
                    });
                    window.dispatchEvent(event);
                } catch {}
            }}
        >
            <svg
                viewBox='0 0 24 24'
                className={`w-5 h-5 text-primary/80 transition-colors duration-300 group-hover:text-primary group-hover:rotate-12 group-hover:scale-110 ${
                    bounce ? 'trash-bounce' : ''
                }`}
                fill='none'
                stroke='url(#trash-gradient)'
                strokeWidth='1.8'
                strokeLinecap='round'
                strokeLinejoin='round'
            >
                <defs>
                    <linearGradient
                        id='trash-gradient'
                        x1='0'
                        y1='0'
                        x2='1'
                        y2='1'
                    >
                        <stop offset='0%' stopColor='#60A5FA' />
                        <stop offset='40%' stopColor='#10B981' />
                        <stop offset='75%' stopColor='#F59E0B' />
                        <stop offset='100%' stopColor='#8B5CF6' />
                    </linearGradient>
                </defs>
                <path d='M3 6h18' />
                <path className='trash-lid' d='M8 6l1-2h6l1 2' />
                <path d='M6 6l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13' />
                <path d='M10 10v7M14 10v7' />
            </svg>
            <span
                className={`pointer-events-none absolute -top-9 right-0 whitespace-nowrap rounded-md bg-slate-900 text-white text-xs px-2 py-1 shadow-lg transition-opacity duration-200 ${
                    over ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
            >
                Drag a row here to delete
            </span>
            <style jsx>{`
                .trash-lid {
                    transform-box: fill-box;
                    transform-origin: 60% 30%;
                }
                .group:hover .trash-lid,
                .drag-over .trash-lid {
                    animation: trash-lid-wiggle 0.55s ease-in-out;
                }
                @keyframes trash-lid-wiggle {
                    0% {
                        transform: rotate(0deg) translateY(0);
                    }
                    35% {
                        transform: rotate(-16deg) translateY(-1px);
                    }
                    65% {
                        transform: rotate(-6deg) translateY(-0.5px);
                    }
                    100% {
                        transform: rotate(0deg) translateY(0);
                    }
                }
            `}</style>
        </button>
    );
}

// Geo helpers using backend endpoints
const fetchCountries = () => api.get<string[]>('/api/geo/countries');
const fetchStates = (country: string) =>
    api.get<string[]>(`/api/geo/states?${new URLSearchParams({country})}`);
const fetchCities = (country: string, state: string) =>
    api.get<string[]>(
        `/api/geo/cities?${new URLSearchParams({country, state})}`,
    );

interface TechnicalUser {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
}

interface LicenseService {
    id: string;
    name: string;
    category: string;
    subcategories?: string[];
}

interface Account {
    id: string;
    accountName: string;
    masterAccount: string;
    firstName: string;
    middleName: string;
    lastName: string;
    email: string;
    phone: string;
    status?: 'Active' | 'Inactive' | '';
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
    technicalUsername: string;
    technicalUserDetails?: TechnicalUser;
    enterpriseName: string;
    enterpriseId?: string;
    productName?: string;
    serviceName?: string;
    platform: string;
    services: {
        service: string;
        category: string;
        licenseDate: string;
        expirationDate: string;
        users: number;
        renewalNotice: boolean;
        renewalNoticePeriod?: number;
    }[];
}

// Mock data for technical users (from access control)
const mockTechnicalUsers: TechnicalUser[] = [
    {
        id: '1',
        username: 'TUSER001',
        email: 'tuser001@company.com',
        firstName: 'Technical',
        lastName: 'User One',
    },
    {
        id: '2',
        username: 'TUSER002',
        email: 'tuser002@company.com',
        firstName: 'Technical',
        lastName: 'User Two',
    },
    {
        id: '3',
        username: 'DEVOPS01',
        email: 'devops01@company.com',
        firstName: 'DevOps',
        lastName: 'Admin',
    },
    {
        id: '4',
        username: 'SYSADMIN',
        email: 'sysadmin@company.com',
        firstName: 'System',
        lastName: 'Administrator',
    },
];

// Mock data for services
const mockServices: LicenseService[] = [
    {
        id: '1',
        name: 'DevOps',
        category: 'Development',
        subcategories: ['CI/CD', 'Pipeline Management', 'Code Quality'],
    },
    {
        id: '2',
        name: 'Integration Hub',
        category: 'Integration',
        subcategories: [
            'API Management',
            'Data Integration',
            'Event Processing',
        ],
    },
    {
        id: '3',
        name: 'All Services',
        category: 'Complete',
        subcategories: ['Full Access', 'Premium Support', 'Advanced Features'],
    },
    {
        id: '4',
        name: 'Analytics',
        category: 'Analytics',
        subcategories: ['Reporting', 'Dashboards', 'Data Visualization'],
    },
    {
        id: '5',
        name: 'Security Suite',
        category: 'Security',
        subcategories: ['Identity Management', 'Access Control', 'Audit Logs'],
    },
];

function HideColumnsButton() {
    return (
        <button
            title='Hide columns'
            className='inline-flex items-center px-2 py-2 rounded-md border border-light text-primary hover:bg-slate-100'
        >
            <span className='w-4 h-4'>👁️</span>
        </button>
    );
}

function GroupByButton({
    Active,
    onSelect,
}: {
    Active: 'None' | 'Enterprise' | 'Product' | 'Service';
    onSelect: (g: 'None' | 'Enterprise' | 'Product' | 'Service') => void;
}) {
    return (
        <div className='relative'>
            <button
                title='Group by'
                className='inline-flex items-center px-2 py-2 rounded-md border border-light text-primary hover:bg-slate-100'
            >
                <span className='w-4 h-4'>▦</span>
            </button>
        </div>
    );
}

export default function ManageAccounts() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const searchRef = useRef<HTMLInputElement>(null);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const sortRef = useRef<HTMLDivElement>(null);
    const hideRef = useRef<HTMLDivElement>(null);
    const groupRef = useRef<HTMLDivElement>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [editingData, setEditingData] = useState<Partial<Account> | null>(
        null,
    );
    const [ActiveGroupLabel, setActiveGroupLabel] = useState(
        'None' as 'None' | 'Enterprise' | 'Product' | 'Service',
    );
    const [sortOpen, setSortOpen] = useState(false);
    const [sortColumn, setSortColumn] = useState<
        | 'accountName'
        | 'masterAccount'
        | 'email'
        | 'phone'
        | 'enterpriseName'
        | 'productName'
        | 'serviceName'
        | 'status'
        | ''
    >('');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [sortRules, setSortRules] = useState<
        {column: typeof sortColumn; dir: 'asc' | 'desc'}[]
    >([]);
    const [viewsOpen, setViewsOpen] = useState(false);
    const [ActiveViewId, setActiveViewId] = useState<string | null>(null);
    const [hideOpen, setHideOpen] = useState(false);
    const [hideQuery, setHideQuery] = useState('');
    const [groupOpen, setGroupOpen] = useState(false);
    const [dropDelete, setDropDelete] = useState<{
        rowId: string;
        title: string;
    } | null>(null);
    const [trashBounce, setTrashBounce] = useState(false);

    // New state for animated buttons (copied from manage users and enterprise config)
    const [showSearchBar, setShowSearchBar] = useState(false);
    const [filterVisible, setFilterVisible] = useState(false);
    const [sortVisible, setSortVisible] = useState(false);
    const [hideColumnsVisible, setHideColumnsVisible] = useState(false);
    const [groupByVisible, setGroupByVisible] = useState(false);

    // State for filtering and sorting
    const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
    const [sortConfig, setSortConfig] = useState<{
        column: string;
        direction: 'asc' | 'desc';
    } | null>(null);
    const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
    const allCols: (
        | 'masterAccount'
        | 'accountName'
        | 'country'
        | 'addressLine1'
        | 'addressLine2'
        | 'city'
        | 'state'
        | 'pincode'
        | 'actions'
    )[] = [
        'masterAccount',
        'accountName',
        'country',
        'addressLine1',
        'addressLine2',
        'city',
        'state',
        'pincode',
        'actions',
    ];

    // Close dropdowns when clicking outside their containers
    useEffect(() => {
        const onDoc = (e: MouseEvent) => {
            const t = e.target as Node;
            if (sortOpen && sortRef.current && !sortRef.current.contains(t)) {
                setSortOpen(false);
            }
            if (hideOpen && hideRef.current && !hideRef.current.contains(t)) {
                setHideOpen(false);
            }
            if (
                groupOpen &&
                groupRef.current &&
                !groupRef.current.contains(t)
            ) {
                setGroupOpen(false);
            }
        };
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, [sortOpen, hideOpen, groupOpen]);
    const setGroupByFromLabel = (label: string) => {
        const l = label as 'None' | 'Enterprise' | 'Product' | 'Service';
        setActiveGroupLabel(l);
    };
    const groupByProp =
        ActiveGroupLabel === 'Enterprise'
            ? 'enterpriseName'
            : ActiveGroupLabel === 'Product'
            ? 'productName'
            : ActiveGroupLabel === 'Service'
            ? 'serviceName'
            : 'none';

    // Handler functions for new action buttons (copied from manage users and enterprise config)
    const handleSortNew = (column: string) => {
        setSortConfig((prev) => {
            if (prev?.column === column) {
                return {
                    column,
                    direction: prev.direction === 'asc' ? 'desc' : 'asc',
                };
            }
            return {column, direction: 'asc'};
        });
        setSortVisible(false);
    };

    const handleFilter = (column: string, value: any) => {
        setActiveFilters((prev) => ({
            ...prev,
            [column]: value,
        }));
    };

    const clearFilters = () => {
        setActiveFilters({});
    };

    const toggleColumnVisibility = (columnId: string) => {
        setHiddenColumns((prev) => {
            if (prev.includes(columnId)) {
                return prev.filter((id) => id !== columnId);
            } else {
                return [...prev, columnId];
            }
        });
    };

    const handleGroupByNew = (groupByColumn: string) => {
        setActiveGroupLabel((prev) =>
            prev === groupByColumn ? 'None' : (groupByColumn as any),
        );
    };

    // Load accounts - backend now embeds address/technical/licenses in details
    const loadAccounts = async () => {
        const list = await api.get<any[]>('/api/accounts');
        setAccounts(list);
    };

    useEffect(() => {
        loadAccounts().catch(() => {});
    }, []);

    useEffect(() => {
        const onDropEvent = (e: any) => {
            try {
                const rowId = e?.detail?.rowId as string | undefined;
                if (!rowId) return;
                const account = accounts.find(
                    (a) => String(a.id) === String(rowId),
                );
                const title = account
                    ? `Delete account “${account.accountName || account.id}”?`
                    : 'Delete this account?';
                setDropDelete({rowId: String(rowId), title});
            } catch {}
        };
        window.addEventListener('accounts-row-drop-trash', onDropEvent);
        return () =>
            window.removeEventListener('accounts-row-drop-trash', onDropEvent);
    }, [accounts]);

    useEffect(() => {
        if (showSearch) {
            setTimeout(() => searchRef.current?.focus(), 50);
        }
    }, [showSearch]);

    useEffect(() => {
        const onClickAway = (e: MouseEvent) => {
            if (
                searchContainerRef.current &&
                !searchContainerRef.current.contains(e.target as Node)
            ) {
                setShowSearch(false);
            }
        };
        document.addEventListener('mousedown', onClickAway);
        return () => document.removeEventListener('mousedown', onClickAway);
    }, []);

    const filteredAccounts = accounts.filter((account) => {
        const q = searchTerm.trim().toLowerCase();
        if (!q) return true;
        const contact = `${account.firstName || ''} ${
            account.lastName || ''
        }`.toLowerCase();
        const enterprise = (account.enterpriseName || '').toLowerCase();
        const product = (
            (account.services || [])[0]?.service || ''
        ).toLowerCase();
        const service = (
            (account.services || [])[0]?.category || ''
        ).toLowerCase();
        return (
            (account.accountName || '').toLowerCase().includes(q) ||
            (account.email || '').toLowerCase().includes(q) ||
            (account.phone || '').toLowerCase().includes(q) ||
            contact.includes(q) ||
            enterprise.includes(q) ||
            product.includes(q) ||
            service.includes(q)
        );
    });

    // View state
    const [visibleCols, setVisibleCols] = useState<
        (
            | 'masterAccount'
            | 'accountName'
            | 'country'
            | 'addressLine1'
            | 'addressLine2'
            | 'city'
            | 'state'
            | 'pincode'
            | 'actions'
        )[]
    >([
        'masterAccount',
        'accountName',
        'country',
        'addressLine1',
        'addressLine2',
        'city',
        'state',
        'pincode',
        'actions',
    ]);
    const [views, setViews] = useState<any[]>([]);
    const currentUserId = 'demo-user';
    const screenKey = 'manage-accounts';
    const isCustomViewActive = useMemo(() => {
        const v = views.find((x) => x.id === ActiveViewId);
        return !!v && !v.isDefault;
    }, [views, ActiveViewId]);
    useEffect(() => {
        (async () => {
            try {
                const v = await api.get<any[]>(
                    `/api/views?userId=${encodeURIComponent(
                        currentUserId,
                    )}&screen=${encodeURIComponent(screenKey)}`,
                );
                setViews(v || []);
                const def = (v || []).find((x) => x.isDefault);
                if (def?.config) {
                    applyView(def.config);
                    setActiveViewId(def.id || null);
                }
            } catch {}
        })();
    }, []);

    const applyView = (cfg: any) => {
        if (!cfg) return;
        if (Array.isArray(cfg.sortRules) && cfg.sortRules.length > 0) {
            setSortRules(cfg.sortRules);
            setSortColumn(cfg.sortRules[0].column || '');
            setSortDirection(cfg.sortRules[0].dir || 'asc');
        } else {
            if (cfg.sort?.column) setSortColumn(cfg.sort.column);
            if (cfg.sort?.dir) setSortDirection(cfg.sort.dir);
        }
        if (cfg.group) setGroupByFromLabel(cfg.group);
        if (Array.isArray(cfg.columns)) setVisibleCols(cfg.columns as any);
    };

    const saveCurrentView = async (name: string, makeDefault = false) => {
        const config = {
            sort: {column: sortColumn, dir: sortDirection},
            sortRules,
            group: ActiveGroupLabel,
            columns: visibleCols,
        };
        await api.post('/api/views', {
            userId: currentUserId,
            screen: screenKey,
            name,
            isDefault: makeDefault,
            config,
        });
        const v = await api.get<any[]>(
            `/api/views?userId=${encodeURIComponent(
                currentUserId,
            )}&screen=${encodeURIComponent(screenKey)}`,
        );
        setViews(v || []);
        // try set Active view id by name
        const found = (v || []).find((x) => x.name === name);
        setActiveViewId(found?.id || null);
    };

    const resetToDefaultView = () => {
        const def = views.find((x) => x.isDefault);
        if (def?.config) {
            applyView(def.config);
            setActiveViewId(def.id || null);
            return;
        }
        // Fallback to standard
        setSortRules([]);
        setSortColumn('');
        setSortDirection('asc');
        setActiveGroupLabel('None');
        setVisibleCols([
            'masterAccount',
            'accountName',
            'country',
            'addressLine1',
            'addressLine2',
            'city',
            'state',
            'pincode',
            'actions',
        ] as any);
        setActiveViewId(null);
    };

    const sortedAccounts = useMemo(() => {
        const rules = sortRules.length
            ? sortRules
            : sortColumn
            ? [{column: sortColumn, dir: sortDirection}]
            : [];
        if (rules.length === 0) return filteredAccounts;
        const copy = [...filteredAccounts];
        const getter = (col: typeof sortColumn, a: Account): string => {
            switch (col) {
                case 'accountName':
                    return a.accountName || '';
                case 'masterAccount':
                    return a.masterAccount || '';
                case 'email':
                    return a.email || '';
                case 'phone':
                    return a.phone || '';
                case 'enterpriseName':
                    return a.enterpriseName || a.enterpriseId || '';
                case 'productName':
                    return (a.services || [])[0]?.service || '';
                case 'serviceName':
                    return (a.services || [])[0]?.category || '';
                case 'status':
                    return a.status || '';
                default:
                    return '';
            }
        };
        copy.sort((a, b) => {
            for (const r of rules) {
                const av = getter(r.column, a);
                const bv = getter(r.column, b);
                const comp = av.localeCompare(bv, undefined, {
                    numeric: true,
                    sensitivity: 'base',
                });
                if (comp !== 0) return r.dir === 'asc' ? comp : -comp;
            }
            return 0;
        });
        return copy;
    }, [filteredAccounts, sortColumn, sortDirection, sortRules]);

    const addAccount = async (account: Omit<Account, 'id'>) => {
        await api.post<Account>('/api/accounts', account);
        await loadAccounts();
        setShowCreateForm(false);
    };

    const deleteAccount = (id: string) => {
        setPendingDeleteId(id);
    };

    return (
        <div className='h-full bg-secondary flex flex-col'>
            {/* Header Section */}
            <div className='bg-card border-b border-light px-6 py-4'>
                <div className='flex items-center justify-between'>
                    <div>
                        <h1 className='text-xl font-bold text-primary'>
                            Manage Accounts
                        </h1>
                        <div className='flex items-center space-x-4 mt-1'>
                            <p className='text-sm text-secondary'>
                                Manage enterprise accounts, contacts and
                                licensing at scale. Create, edit, and remove
                                accounts; assign enterprises, platforms and
                                services; track status, contact details and
                                usage; and organize efficiently with the
                                draggable, sortable table and quick actions.
                            </p>
                        </div>
                    </div>
                    <div className='flex items-center'></div>
                </div>
            </div>

            {/* Toolbar Section */}
            <div className='bg-sap-light-gray px-6 py-3 text-primary border-y border-light'>
                <div className='flex items-center justify-between gap-3'>
                    <div className='flex items-center gap-3 flex-wrap'>
                        <button
                            onClick={() => {
                                const newId = `tmp-${Date.now()}`;
                                const blank = {
                                    id: newId,
                                    accountName: '',
                                    firstName: '',
                                    lastName: '',
                                    email: '',
                                    phone: '',
                                    status: '',
                                    servicesCount: 0,
                                    enterpriseName: '',
                                    productName: '',
                                    serviceName: '',
                                    address: {
                                        addressLine1: '',
                                        addressLine2: '',
                                        country: '',
                                        state: '',
                                        city: '',
                                        pincode: '',
                                    },
                                    technical: {username: '', email: ''},
                                    licenses: [
                                        {
                                            enterprise: '',
                                            product: '',
                                            service: '',
                                            licenseStart: '',
                                            licenseEnd: '',
                                            users: 0,
                                            renewalNotice: false,
                                            noticeDays: 0,
                                        },
                                    ],
                                } as any;
                                setAccounts((prev) => [...prev, blank]);
                                // scroll to bottom where the new row is rendered
                                setTimeout(() => {
                                    window.scrollTo({
                                        top: document.body.scrollHeight,
                                        behavior: 'smooth',
                                    });
                                }, 0);
                            }}
                            className='inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700 shadow-sm'
                        >
                            <PlusIcon className='h-4 w-4' />
                            <span className='text-sm'>New Account</span>
                        </button>
                        {/* Search Button */}
                        <div className='flex items-center'>
                            {showSearchBar && (
                                <div className='relative w-72 mr-3'>
                                    <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                                        <MagnifyingGlassIcon className='h-5 w-5 text-secondary' />
                                    </div>
                                    <input
                                        type='text'
                                        placeholder='Search accounts...'
                                        value={searchTerm}
                                        onChange={(e) =>
                                            setSearchTerm(e.target.value)
                                        }
                                        className='block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400'
                                        autoFocus
                                    />
                                </div>
                            )}
                            <button
                                onClick={() => setShowSearchBar((v) => !v)}
                                className={`group relative flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-medium transition-all duration-300 transform hover:scale-105 ${
                                    showSearchBar
                                        ? 'border-blue-300 bg-blue-50 text-blue-600 shadow-blue-200 shadow-lg'
                                        : 'border-gray-200 bg-white text-gray-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 hover:shadow-lg'
                                }`}
                            >
                                <svg
                                    className={`w-4 h-4 transition-transform duration-300 ${
                                        showSearchBar
                                            ? 'rotate-90'
                                            : 'group-hover:scale-110'
                                    }`}
                                    fill='none'
                                    viewBox='0 0 24 24'
                                    stroke='currentColor'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                                    />
                                </svg>
                                <span className='text-sm'>Search</span>
                                {showSearchBar && (
                                    <div className='absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-blue-500 rounded-full animate-pulse'></div>
                                )}
                            </button>
                        </div>
                        {/* Filter Button */}
                        <div className='relative'>
                            <button
                                onClick={() => setFilterVisible(!filterVisible)}
                                className={`group relative flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-medium transition-all duration-300 transform hover:scale-105 ${
                                    filterVisible ||
                                    Object.keys(activeFilters).length > 0
                                        ? 'border-purple-300 bg-purple-50 text-purple-600 shadow-purple-200 shadow-lg'
                                        : 'border-gray-200 bg-white text-gray-600 hover:border-purple-200 hover:bg-purple-50 hover:text-purple-600 hover:shadow-lg'
                                }`}
                            >
                                <svg
                                    className='w-4 h-4 transition-transform duration-300 group-hover:scale-110'
                                    fill='none'
                                    viewBox='0 0 24 24'
                                    stroke='currentColor'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z'
                                    />
                                </svg>
                                <span className='text-sm'>Filter</span>
                                {Object.keys(activeFilters).length > 0 && (
                                    <div className='absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full animate-bounce'></div>
                                )}
                                <div className='absolute inset-0 rounded-lg bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 group-hover:opacity-10 transition-opacity duration-300 -z-10'></div>
                            </button>

                            {/* Filter Dropdown */}
                            {filterVisible && (
                                <div className='absolute top-full mt-2 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-80'>
                                    <div className='p-4'>
                                        <div className='text-sm font-medium text-gray-700 mb-3'>
                                            Apply Filters:
                                        </div>

                                        {/* Account Name Filter */}
                                        <div className='mb-3'>
                                            <label className='block text-xs font-medium text-gray-600 mb-1'>
                                                Account Name:
                                            </label>
                                            <input
                                                type='text'
                                                value={
                                                    activeFilters.accountName ||
                                                    ''
                                                }
                                                onChange={(e) =>
                                                    handleFilter(
                                                        'accountName',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder='Search by account name...'
                                                className='w-full p-2 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                                            />
                                        </div>

                                        {/* Master Account Filter */}
                                        <div className='mb-3'>
                                            <label className='block text-xs font-medium text-gray-600 mb-1'>
                                                Master Account:
                                            </label>
                                            <input
                                                type='text'
                                                value={
                                                    activeFilters.masterAccount ||
                                                    ''
                                                }
                                                onChange={(e) =>
                                                    handleFilter(
                                                        'masterAccount',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder='Search by master account...'
                                                className='w-full p-2 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                                            />
                                        </div>

                                        {/* Country Filter */}
                                        <div className='mb-4'>
                                            <label className='block text-xs font-medium text-gray-600 mb-1'>
                                                Country:
                                            </label>
                                            <input
                                                type='text'
                                                value={
                                                    activeFilters.country || ''
                                                }
                                                onChange={(e) =>
                                                    handleFilter(
                                                        'country',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder='Search by country...'
                                                className='w-full p-2 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                                            />
                                        </div>

                                        {/* Action Buttons */}
                                        <div className='flex gap-2'>
                                            <button
                                                onClick={clearFilters}
                                                className='px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded border border-red-200'
                                            >
                                                Clear All
                                            </button>
                                            <button
                                                onClick={() =>
                                                    setFilterVisible(false)
                                                }
                                                className='px-3 py-1 text-sm text-purple-600 hover:bg-purple-50 rounded border border-purple-200'
                                            >
                                                Apply
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div ref={sortRef} className='relative'>
                            <button
                                className='relative inline-flex items-center gap-2 px-2 py-2 rounded text-slate-600 hover:text-slate-900'
                                title='Sort'
                                onClick={() => setSortOpen((v) => !v)}
                            >
                                <ArrowsUpDownIcon className='h-4 w-4' />
                                <span className='text-sm'>Sort</span>
                                {(sortRules.length > 0 || !!sortColumn) && (
                                    <span className='absolute -right-1 -top-0.5 h-2 w-2 rounded-full bg-primary-600 animate-pulse'></span>
                                )}
                            </button>
                            {sortOpen && (
                                <div className='absolute left-0 top-full z-50 mt-2 w-[420px] rounded-lg bg-card text-primary shadow-xl border border-light'>
                                    <div className='flex items-center justify-between px-4 py-2.5 border-b border-light'>
                                        <div className='text-sm font-semibold'>
                                            Sort by
                                        </div>
                                        <button
                                            className={`text-xs px-3 py-1 rounded-md ${
                                                sortRules.length > 0 ||
                                                sortColumn
                                                    ? 'bg-primary text-inverse hover:bg-primary-dark'
                                                    : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                                            }`}
                                            disabled={
                                                !sortRules.length && !sortColumn
                                            }
                                            onClick={() =>
                                                saveCurrentView('Custom', false)
                                            }
                                        >
                                            Save to this view
                                        </button>
                                    </div>
                                    <div className='p-3 space-y-2'>
                                        <div className='flex gap-2 items-center'>
                                            <select
                                                value={sortColumn}
                                                onChange={(e) =>
                                                    setSortColumn(
                                                        e.target.value as any,
                                                    )
                                                }
                                                className='flex-1 bg-white border border-light rounded-md px-2.5 py-1.5 text-sm'
                                            >
                                                <option value=''>
                                                    Choose column
                                                </option>
                                                <option value='accountName'>
                                                    Account
                                                </option>
                                                <option value='masterAccount'>
                                                    Master Account
                                                </option>
                                                <option value='email'>
                                                    Email
                                                </option>
                                                <option value='phone'>
                                                    Phone
                                                </option>
                                                <option value='enterpriseName'>
                                                    Enterprise
                                                </option>
                                                <option value='productName'>
                                                    Product
                                                </option>
                                                <option value='serviceName'>
                                                    Service
                                                </option>
                                                <option value='status'>
                                                    Status
                                                </option>
                                            </select>
                                            <div className='shrink-0 inline-flex rounded-md border border-light overflow-hidden'>
                                                <button
                                                    className={`px-2.5 py-1.5 text-xs ${
                                                        sortDirection === 'asc'
                                                            ? 'bg-slate-100 text-primary'
                                                            : 'bg-white text-secondary'
                                                    }`}
                                                    onClick={() =>
                                                        setSortDirection('asc')
                                                    }
                                                >
                                                    Asc
                                                </button>
                                                <button
                                                    className={`px-2.5 py-1.5 text-xs border-l border-light ${
                                                        sortDirection === 'desc'
                                                            ? 'bg-slate-100 text-primary'
                                                            : 'bg-white text-secondary'
                                                    }`}
                                                    onClick={() =>
                                                        setSortDirection('desc')
                                                    }
                                                >
                                                    Desc
                                                </button>
                                            </div>
                                        </div>
                                        {sortRules.map((r, idx) => (
                                            <div
                                                key={idx}
                                                className='flex gap-2 items-center'
                                            >
                                                <select
                                                    value={r.column}
                                                    onChange={(e) => {
                                                        const next = [
                                                            ...sortRules,
                                                        ];
                                                        next[idx] = {
                                                            ...next[idx],
                                                            column: e.target
                                                                .value as any,
                                                        };
                                                        setSortRules(next);
                                                    }}
                                                    className='flex-1 bg-white border border-light rounded-md px-2.5 py-1.5 text-sm'
                                                >
                                                    <option value='accountName'>
                                                        Account
                                                    </option>
                                                    <option value='masterAccount'>
                                                        Master Account
                                                    </option>
                                                    <option value='email'>
                                                        Email
                                                    </option>
                                                    <option value='phone'>
                                                        Phone
                                                    </option>
                                                    <option value='enterpriseName'>
                                                        Enterprise
                                                    </option>
                                                    <option value='productName'>
                                                        Product
                                                    </option>
                                                    <option value='serviceName'>
                                                        Service
                                                    </option>
                                                    <option value='status'>
                                                        Status
                                                    </option>
                                                </select>
                                                <div className='shrink-0 inline-flex rounded-md border border-light overflow-hidden'>
                                                    <button
                                                        className={`px-2.5 py-1.5 text-xs ${
                                                            r.dir === 'asc'
                                                                ? 'bg-slate-100 text-primary'
                                                                : 'bg-white text-secondary'
                                                        }`}
                                                        onClick={() => {
                                                            const next = [
                                                                ...sortRules,
                                                            ];
                                                            next[idx] = {
                                                                ...next[idx],
                                                                dir: 'asc',
                                                            };
                                                            setSortRules(next);
                                                        }}
                                                    >
                                                        Asc
                                                    </button>
                                                    <button
                                                        className={`px-2.5 py-1.5 text-xs border-l border-light ${
                                                            r.dir === 'desc'
                                                                ? 'bg-slate-100 text-primary'
                                                                : 'bg-white text-secondary'
                                                        }`}
                                                        onClick={() => {
                                                            const next = [
                                                                ...sortRules,
                                                            ];
                                                            next[idx] = {
                                                                ...next[idx],
                                                                dir: 'desc',
                                                            };
                                                            setSortRules(next);
                                                        }}
                                                    >
                                                        Desc
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        <button
                                            onClick={() =>
                                                setSortRules((s) => [
                                                    ...s,
                                                    {
                                                        column: 'accountName',
                                                        dir: 'asc',
                                                    },
                                                ])
                                            }
                                            className='text-xs text-secondary hover:text-primary'
                                        >
                                            + New sort
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div ref={hideRef} className='relative'>
                            <button
                                className='relative inline-flex items-center gap-2 px-2 py-2 rounded text-slate-600 hover:text-slate-900'
                                onClick={() => setHideOpen((v) => !v)}
                            >
                                <EyeSlashIcon className='h-4 w-4' />
                                <span className='text-sm'>Hide</span>
                                {visibleCols.length < allCols.length && (
                                    <span className='absolute -right-1 -top-0.5 h-2 w-2 rounded-full bg-primary-600 animate-pulse'></span>
                                )}
                            </button>
                            {hideOpen && (
                                <div className='absolute left-0 top-full z-50 mt-2 w-[420px] rounded-lg bg-card text-primary shadow-xl border border-light'>
                                    <div className='flex items-center justify-between px-4 py-2.5 border-b border-light'>
                                        <div className='text-sm font-semibold'>
                                            Hide columns
                                        </div>
                                        <button
                                            className={`text-xs px-3 py-1 rounded-md ${
                                                visibleCols.length > 0
                                                    ? 'bg-primary text-inverse hover:bg-primary-dark'
                                                    : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                                            }`}
                                            disabled={visibleCols.length === 0}
                                            onClick={() =>
                                                saveCurrentView('Custom', false)
                                            }
                                        >
                                            Save to this view
                                        </button>
                                    </div>
                                    <div className='p-3 space-y-2'>
                                        <input
                                            value={hideQuery}
                                            onChange={(e) =>
                                                setHideQuery(e.target.value)
                                            }
                                            placeholder='Search columns'
                                            className='w-full bg-white border border-light rounded-md px-2.5 py-1.5 text-sm'
                                        />
                                        <div className='max-h-56 overflow-auto divide-y divide-light'>
                                            {allCols
                                                .filter((c) =>
                                                    c
                                                        .toLowerCase()
                                                        .includes(
                                                            hideQuery.toLowerCase(),
                                                        ),
                                                )
                                                .map((c) => (
                                                    <label
                                                        key={c}
                                                        className='flex items-center justify-between py-2'
                                                    >
                                                        <span className='text-sm capitalize'>
                                                            {c === 'accountName'
                                                                ? 'Account'
                                                                : c ===
                                                                  'country'
                                                                ? 'Country'
                                                                : c ===
                                                                  'addressLine1'
                                                                ? 'Address Line 1'
                                                                : c ===
                                                                  'addressLine2'
                                                                ? 'Address Line 2'
                                                                : c === 'city'
                                                                ? 'City'
                                                                : c === 'state'
                                                                ? 'State'
                                                                : c ===
                                                                  'pincode'
                                                                ? 'PIN/ZIP'
                                                                : c}
                                                        </span>
                                                        <input
                                                            type='checkbox'
                                                            checked={visibleCols.includes(
                                                                c,
                                                            )}
                                                            onChange={(e) => {
                                                                const checked =
                                                                    e.target
                                                                        .checked;
                                                                setVisibleCols(
                                                                    (prev) => {
                                                                        if (
                                                                            checked
                                                                        )
                                                                            return Array.from(
                                                                                new Set(
                                                                                    [
                                                                                        ...prev,
                                                                                        c,
                                                                                    ],
                                                                                ),
                                                                            );
                                                                        return prev.filter(
                                                                            (
                                                                                x,
                                                                            ) =>
                                                                                x !==
                                                                                c,
                                                                        );
                                                                    },
                                                                );
                                                            }}
                                                        />
                                                    </label>
                                                ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div
                            ref={groupRef}
                            className='relative flex items-center'
                        >
                            <button
                                className='relative inline-flex items-center gap-2 px-2 py-2 rounded text-slate-600 hover:text-slate-900'
                                onClick={() => setGroupOpen((v) => !v)}
                            >
                                <RectangleStackIcon className='h-4 w-4' />
                                <span className='text-sm'>Group by</span>
                                {ActiveGroupLabel !== 'None' && (
                                    <span className='absolute -right-1 -top-0.5 h-2 w-2 rounded-full bg-primary-600 animate-pulse'></span>
                                )}
                            </button>
                            {groupOpen && (
                                <div className='absolute left-0 top-full z-50 mt-2 w-[420px] rounded-lg bg-card text-primary shadow-xl border border-light'>
                                    <div className='flex items-center justify-between px-4 py-2.5 border-b border-light'>
                                        <div className='text-sm font-semibold'>
                                            Group by
                                        </div>
                                        <button
                                            className={`text-xs px-3 py-1 rounded-md bg-primary text-inverse hover:bg-primary-dark`}
                                            onClick={() =>
                                                saveCurrentView('Custom', false)
                                            }
                                        >
                                            Save to this view
                                        </button>
                                    </div>
                                    <div className='p-3 space-y-2'>
                                        <select
                                            value={ActiveGroupLabel}
                                            onChange={(e) =>
                                                setGroupByFromLabel(
                                                    e.target.value,
                                                )
                                            }
                                            className='w-full bg-white border border-light rounded-md px-2.5 py-1.5 text-sm'
                                        >
                                            <option>None</option>
                                            <option>Enterprise</option>
                                            <option>Product</option>
                                            <option>Service</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                        {/* Views switcher */}
                        <div className='relative'>
                            <button
                                onClick={() => setViewsOpen((v) => !v)}
                                className='relative inline-flex items-center gap-2 px-2 py-2 rounded text-slate-600 hover:text-slate-900'
                            >
                                <span className='text-sm'>Views</span>
                                {isCustomViewActive && (
                                    <span className='absolute -right-1 -top-0.5 h-2 w-2 rounded-full bg-[#1677ff] animate-pulse'></span>
                                )}
                            </button>
                            {viewsOpen && (
                                <div className='absolute z-10 mt-2 w-56 rounded-md border border-light bg-card shadow-md'>
                                    <button
                                        className='w-full text-left px-3 py-2 text-sm hover:bg-slate-50'
                                        onClick={() => {
                                            resetToDefaultView();
                                            setViewsOpen(false);
                                        }}
                                    >
                                        Default view
                                    </button>
                                    {(views || []).map((v) => (
                                        <button
                                            key={v.id}
                                            className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 ${
                                                ActiveViewId === v.id
                                                    ? 'text-brand'
                                                    : ''
                                            }`}
                                            onClick={() => {
                                                if (v.config)
                                                    applyView(v.config);
                                                setActiveViewId(v.id);
                                                setViewsOpen(false);
                                            }}
                                        >
                                            {v.name || 'Custom view'}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button className='inline-flex items-center gap-2 px-2 py-2 rounded text-slate-600 hover:text-slate-900'>
                            <span className='text-xl leading-none'>…</span>
                        </button>
                        <ToolbarTrashButton
                            onClick={() => {}}
                            bounce={trashBounce}
                        />
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className='flex-1 p-6'>
                {showCreateForm ? (
                    <CreateAccountForm
                        onSave={addAccount}
                        onCancel={() => setShowCreateForm(false)}
                        technicalUsers={mockTechnicalUsers}
                        services={mockServices}
                        mode='create'
                    />
                ) : editingAccount ? (
                    <CreateAccountForm
                        onSave={async (payload) => {
                            await api.put<Account>('/api/accounts', {
                                id: editingAccount.id,
                                ...payload,
                            });
                            await loadAccounts();
                            setEditingAccount(null);
                            setEditingData(null);
                        }}
                        onCancel={() => {
                            setEditingAccount(null);
                            setEditingData(null);
                        }}
                        technicalUsers={mockTechnicalUsers}
                        services={mockServices}
                        initialData={editingData || editingAccount}
                        mode='edit'
                    />
                ) : (
                    <div className='space-y-6'>
                        {sortedAccounts.length === 0 ? (
                            <div className='text-center py-12'>
                                <div className='w-16 h-16 bg-tertiary rounded-full flex items-center justify-center mx-auto mb-4'>
                                    <svg
                                        className='w-8 h-8 text-secondary'
                                        fill='none'
                                        stroke='currentColor'
                                        viewBox='0 0 24 24'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z'
                                        />
                                    </svg>
                                </div>
                                <h3 className='text-lg font-medium text-primary mb-2'>
                                    You have no accounts yet
                                </h3>
                                <p className='text-secondary'>
                                    Create your first account to get started
                                    with user management.
                                </p>
                            </div>
                        ) : (
                            <div className='bg-card rounded-xl border border-light p-3'>
                                <style jsx>{`
                                    @keyframes trash-bounce-keyframes {
                                        0%,
                                        100% {
                                            transform: translateY(0);
                                        }
                                        30% {
                                            transform: translateY(-6%);
                                        }
                                        60% {
                                            transform: translateY(0);
                                        }
                                    }
                                    .trash-bounce {
                                        animation: trash-bounce-keyframes 0.6s
                                            ease-out 1;
                                    }
                                `}</style>
                                <ConfirmModal
                                    open={!!dropDelete}
                                    title='Confirm delete'
                                    message={
                                        dropDelete?.title || 'Delete this item?'
                                    }
                                    onCancel={() => setDropDelete(null)}
                                    onConfirm={async () => {
                                        try {
                                            if (!dropDelete) return;
                                            const id = dropDelete.rowId;
                                            await api.del(
                                                `/api/accounts/${id}`,
                                            );
                                            setDropDelete(null);
                                            setTrashBounce(true);
                                            setTimeout(
                                                () => setTrashBounce(false),
                                                700,
                                            );
                                            await loadAccounts();
                                        } catch {
                                            setDropDelete(null);
                                        }
                                    }}
                                />
                                <AccountsTable
                                    title='Account Details'
                                    rows={sortedAccounts.map<AccountRow>(
                                        (a: any) => ({
                                            id: a.id || '',
                                            globalClientName:
                                                a.globalClientName ||
                                                a.clientName ||
                                                '',
                                            accountName: a.accountName,
                                            firstName: a.firstName || '',
                                            lastName: a.lastName || '',
                                            email: a.email || '',
                                            phone: a.phone || '',
                                            status: a.status || 'Active',
                                            servicesCount:
                                                a.services?.length || 0,
                                            enterpriseName:
                                                a.enterpriseName ||
                                                a.enterpriseId ||
                                                '',
                                            servicesSummary: (a.services || [])
                                                .map(
                                                    (s: any) =>
                                                        `${s.service} • ${s.category}`,
                                                )
                                                .join(','),
                                            productName: a.productName || '',
                                            serviceName: a.serviceName || '',
                                            address: {
                                                addressLine1:
                                                    a.address?.addressLine1 ||
                                                    '',
                                                addressLine2:
                                                    a.address?.addressLine2 ||
                                                    '',
                                                country:
                                                    a.address?.country || '',
                                                state: a.address?.state || '',
                                                city: a.address?.city || '',
                                                pincode:
                                                    a.address?.pincode || '',
                                                ...(a.address?.id
                                                    ? {id: a.address.id}
                                                    : {}),
                                            },
                                            technical: {
                                                username:
                                                    a.technical?.username || '',
                                                email: a.technical?.email || '',
                                                ...(a.technical?.id
                                                    ? {id: a.technical.id}
                                                    : {}),
                                            },
                                            licenses: (() => {
                                                const svc = Array.isArray(
                                                    a.services,
                                                )
                                                    ? a.services
                                                    : [];
                                                const lcs = Array.isArray(
                                                    a.licenses,
                                                )
                                                    ? a.licenses
                                                    : [];
                                                const max = Math.max(
                                                    svc.length,
                                                    lcs.length,
                                                );
                                                const out: any[] = [];
                                                for (let i = 0; i < max; i++) {
                                                    const s: any = svc[i] || {};
                                                    const l: any = lcs[i] || {};
                                                    out.push({
                                                        id: l.id || s.id,
                                                        enterprise:
                                                            s.enterprise ||
                                                            l.enterprise ||
                                                            a.enterpriseName ||
                                                            '',
                                                        product:
                                                            s.product || '',
                                                        service:
                                                            s.service ||
                                                            s.category ||
                                                            '',
                                                        licenseStart:
                                                            l.licenseStart ||
                                                            l.licenseDate ||
                                                            s.licenseDate ||
                                                            l.start_date ||
                                                            '',
                                                        licenseEnd:
                                                            l.licenseEnd ||
                                                            l.expirationDate ||
                                                            s.expirationDate ||
                                                            l.end_date ||
                                                            '',
                                                        users:
                                                            l.users ??
                                                            s.users ??
                                                            l.num_users,
                                                        renewalNotice:
                                                            typeof l.renewalNotice ===
                                                            'boolean'
                                                                ? l.renewalNotice
                                                                : !!l.renewalNotice,
                                                        noticeDays:
                                                            l.noticeDays ??
                                                            l.renewalNoticePeriod ??
                                                            s.renewalNoticePeriod,
                                                        contacts: Array.isArray(
                                                            l.contacts,
                                                        )
                                                            ? l.contacts.map(
                                                                  (c: any) => ({
                                                                      contact:
                                                                          c.contact ||
                                                                          c.name ||
                                                                          '',
                                                                      title:
                                                                          c.title ||
                                                                          c.role ||
                                                                          '',
                                                                      email:
                                                                          c.email ||
                                                                          '',
                                                                      phone:
                                                                          c.phone ||
                                                                          c.mobile ||
                                                                          '',
                                                                  }),
                                                              )
                                                            : [],
                                                    });
                                                }
                                                return out;
                                            })(),
                                        }),
                                    )}
                                    groupByExternal={groupByProp}
                                    onGroupByChange={() => {}}
                                    hideControls
                                    onEdit={(id) => {
                                        const acc = accounts.find(
                                            (x) => x.id === id,
                                        );
                                        if (acc) {
                                            setEditingAccount(acc);
                                            setShowCreateForm(true);
                                        }
                                    }}
                                    onDelete={(id) => {
                                        setPendingDeleteId(id);
                                    }}
                                    visibleColumns={visibleCols}
                                    highlightQuery={searchTerm}
                                    onQuickAddRow={async () => {
                                        const newId = `tmp-${Date.now()}`;
                                        const blank = {
                                            id: newId,
                                            accountName: '',
                                            firstName: '',
                                            lastName: '',
                                            email: '',
                                            phone: '',
                                            status: '',
                                            servicesCount: 0,
                                            enterpriseName: '',
                                            productName: '',
                                            serviceName: '',
                                            address: {
                                                addressLine1: '',
                                                addressLine2: '',
                                                country: '',
                                                state: '',
                                                city: '',
                                                pincode: '',
                                            },
                                            technical: {
                                                username: '',
                                                email: '',
                                            },
                                            licenses: [
                                                {
                                                    enterprise: '',
                                                    product: '',
                                                    service: '',
                                                    licenseStart: '',
                                                    licenseEnd: '',
                                                    users: 0,
                                                    renewalNotice: false,
                                                    noticeDays: 0,
                                                },
                                            ],
                                        } as any;
                                        setAccounts((prev) => [...prev, blank]);
                                        // Smooth scroll to the new row for visibility
                                        setTimeout(() => {
                                            const el = document.querySelector(
                                                `[data-account-id="${newId}"]`,
                                            );
                                            if (el) {
                                                el.scrollIntoView({
                                                    behavior: 'smooth',
                                                    block: 'center',
                                                });
                                            }
                                        }, 50);
                                    }}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
            {false && sortOpen && (
                <div className='fixed inset-0 z-50'>
                    <div
                        className='absolute inset-0 bg-black/20'
                        onClick={() => setSortOpen(false)}
                    />
                    <div className='absolute left-6 top-[110px] animate-slide-in-right'>
                        <div className='w-[420px] rounded-lg bg-card text-primary shadow-xl border border-light'>
                            <div className='flex items-center justify-between px-4 py-2.5 border-b border-light'>
                                <div className='text-sm font-semibold'>
                                    Sort by
                                </div>
                                <button
                                    className={`text-xs px-3 py-1 rounded-md ${
                                        sortRules.length > 0 || sortColumn
                                            ? 'bg-primary text-inverse hover:bg-primary-dark'
                                            : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                                    }`}
                                    disabled={!sortRules.length && !sortColumn}
                                    onClick={() =>
                                        saveCurrentView('Custom', false)
                                    }
                                >
                                    Save to this view
                                </button>
                            </div>
                            <div className='p-3 space-y-2'>
                                {/* Primary rule */}
                                <div className='flex gap-2 items-center'>
                                    <select
                                        value={sortColumn}
                                        onChange={(e) =>
                                            setSortColumn(e.target.value as any)
                                        }
                                        className='flex-1 bg-white border border-light rounded-md px-2.5 py-1.5 text-sm'
                                    >
                                        <option value=''>Choose column</option>
                                        <option value='accountName'>
                                            Account
                                        </option>
                                        <option value='masterAccount'>
                                            Master Account
                                        </option>
                                        <option value='email'>Email</option>
                                        <option value='phone'>Phone</option>
                                        <option value='enterpriseName'>
                                            Enterprise
                                        </option>
                                        <option value='productName'>
                                            Product
                                        </option>
                                        <option value='serviceName'>
                                            Service
                                        </option>
                                        <option value='status'>Status</option>
                                    </select>
                                    <div className='shrink-0 inline-flex rounded-md border border-light overflow-hidden'>
                                        <button
                                            className={`px-2.5 py-1.5 text-xs ${
                                                sortDirection === 'asc'
                                                    ? 'bg-slate-100 text-primary'
                                                    : 'bg-white text-secondary'
                                            }`}
                                            onClick={() =>
                                                setSortDirection('asc')
                                            }
                                        >
                                            Asc
                                        </button>
                                        <button
                                            className={`px-2.5 py-1.5 text-xs border-l border-light ${
                                                sortDirection === 'desc'
                                                    ? 'bg-slate-100 text-primary'
                                                    : 'bg-white text-secondary'
                                            }`}
                                            onClick={() =>
                                                setSortDirection('desc')
                                            }
                                        >
                                            Desc
                                        </button>
                                    </div>
                                </div>

                                {/* Additional rules */}
                                {sortRules.map((r, idx) => (
                                    <div
                                        key={idx}
                                        className='flex gap-2 items-center'
                                    >
                                        <select
                                            value={r.column}
                                            onChange={(e) => {
                                                const next = [...sortRules];
                                                next[idx] = {
                                                    ...next[idx],
                                                    column: e.target
                                                        .value as any,
                                                };
                                                setSortRules(next);
                                            }}
                                            className='flex-1 bg-white border border-light rounded-md px-2.5 py-1.5 text-sm'
                                        >
                                            <option value='accountName'>
                                                Account
                                            </option>
                                            <option value='masterAccount'>
                                                Master Account
                                            </option>
                                            <option value='email'>Email</option>
                                            <option value='phone'>Phone</option>
                                            <option value='enterpriseName'>
                                                Enterprise
                                            </option>
                                            <option value='productName'>
                                                Product
                                            </option>
                                            <option value='serviceName'>
                                                Service
                                            </option>
                                            <option value='status'>
                                                Status
                                            </option>
                                        </select>
                                        <div className='shrink-0 inline-flex rounded-md border border-light overflow-hidden'>
                                            <button
                                                className={`px-2.5 py-1.5 text-xs ${
                                                    r.dir === 'asc'
                                                        ? 'bg-slate-100 text-primary'
                                                        : 'bg-white text-secondary'
                                                }`}
                                                onClick={() => {
                                                    const next = [...sortRules];
                                                    next[idx] = {
                                                        ...next[idx],
                                                        dir: 'asc',
                                                    };
                                                    setSortRules(next);
                                                }}
                                            >
                                                Asc
                                            </button>
                                            <button
                                                className={`px-2.5 py-1.5 text-xs border-l border-light ${
                                                    r.dir === 'desc'
                                                        ? 'bg-slate-100 text-primary'
                                                        : 'bg-white text-secondary'
                                                }`}
                                                onClick={() => {
                                                    const next = [...sortRules];
                                                    next[idx] = {
                                                        ...next[idx],
                                                        dir: 'desc',
                                                    };
                                                    setSortRules(next);
                                                }}
                                            >
                                                Desc
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                <button
                                    onClick={() =>
                                        setSortRules((s) => [
                                            ...s,
                                            {column: 'accountName', dir: 'asc'},
                                        ])
                                    }
                                    className='text-xs text-secondary hover:text-primary'
                                >
                                    + New sort
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <ConfirmModal
                open={pendingDeleteId !== null}
                title='Confirm delete'
                message={`Delete ${(() => {
                    const t = accounts.find((a) => a.id === pendingDeleteId);
                    return t ? t.accountName : 'this account';
                })()}?\n\nThis action can't be undone. The item will be permanently removed.`}
                onCancel={() => setPendingDeleteId(null)}
                onConfirm={async () => {
                    if (!pendingDeleteId) return;
                    await api.del(`/api/accounts/${pendingDeleteId}`);
                    await loadAccounts();
                    setPendingDeleteId(null);
                }}
            />
            {false && hideOpen && (
                <div className='fixed inset-0 z-50'>
                    <div
                        className='absolute inset-0 bg-black/20'
                        onClick={() => setHideOpen(false)}
                    />
                    <div className='absolute left-6 top-[160px] animate-slide-in-right'>
                        <div className='w-[420px] rounded-lg bg-card text-primary shadow-xl border border-light'>
                            <div className='flex items-center justify-between px-4 py-2.5 border-b border-light'>
                                <div className='text-sm font-semibold'>
                                    Hide columns
                                </div>
                                <button
                                    className={`text-xs px-3 py-1 rounded-md ${
                                        visibleCols.length > 0
                                            ? 'bg-primary text-inverse hover:bg-primary-dark'
                                            : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                                    }`}
                                    disabled={visibleCols.length === 0}
                                    onClick={() =>
                                        saveCurrentView('Custom', false)
                                    }
                                >
                                    Save to this view
                                </button>
                            </div>
                            <div className='p-3 space-y-2'>
                                <input
                                    value={hideQuery}
                                    onChange={(e) =>
                                        setHideQuery(e.target.value)
                                    }
                                    placeholder='Search columns'
                                    className='w-full bg-white border border-light rounded-md px-2.5 py-1.5 text-sm'
                                />
                                <div className='max-h-56 overflow-auto divide-y divide-light'>
                                    {allCols
                                        .filter((c) =>
                                            c
                                                .toLowerCase()
                                                .includes(
                                                    hideQuery.toLowerCase(),
                                                ),
                                        )
                                        .map((c) => (
                                            <label
                                                key={c}
                                                className='flex items-center justify-between py-2'
                                            >
                                                <span className='text-sm capitalize'>
                                                    {c === 'accountName'
                                                        ? 'Account'
                                                        : c === 'country'
                                                        ? 'Country'
                                                        : c === 'addressLine1'
                                                        ? 'Address Line 1'
                                                        : c === 'addressLine2'
                                                        ? 'Address Line 2'
                                                        : c === 'city'
                                                        ? 'City'
                                                        : c === 'state'
                                                        ? 'State'
                                                        : c === 'pincode'
                                                        ? 'PIN/ZIP'
                                                        : c}
                                                </span>
                                                <input
                                                    type='checkbox'
                                                    checked={visibleCols.includes(
                                                        c,
                                                    )}
                                                    onChange={(e) => {
                                                        const checked =
                                                            e.target.checked;
                                                        setVisibleCols(
                                                            (prev) => {
                                                                if (checked)
                                                                    return Array.from(
                                                                        new Set(
                                                                            [
                                                                                ...prev,
                                                                                c,
                                                                            ],
                                                                        ),
                                                                    );
                                                                return prev.filter(
                                                                    (x) =>
                                                                        x !== c,
                                                                );
                                                            },
                                                        );
                                                    }}
                                                />
                                            </label>
                                        ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {false && groupOpen && (
                <div className='fixed inset-0 z-50'>
                    <div
                        className='absolute inset-0 bg-black/20'
                        onClick={() => setGroupOpen(false)}
                    />
                    <div className='absolute left-6 top-[210px] animate-slide-in-right'>
                        <div className='w-[420px] rounded-lg bg-card text-primary shadow-xl border border-light'>
                            <div className='flex items-center justify-between px-4 py-2.5 border-b border-light'>
                                <div className='text-sm font-semibold'>
                                    Group by
                                </div>
                                <button
                                    className={`text-xs px-3 py-1 rounded-md bg-primary text-inverse hover:bg-primary-dark`}
                                    onClick={() =>
                                        saveCurrentView('Custom', false)
                                    }
                                >
                                    Save to this view
                                </button>
                            </div>
                            <div className='p-3 space-y-2'>
                                <select
                                    value={ActiveGroupLabel}
                                    onChange={(e) =>
                                        setGroupByFromLabel(e.target.value)
                                    }
                                    className='w-full bg-white border border-light rounded-md px-2.5 py-1.5 text-sm'
                                >
                                    <option>None</option>
                                    <option>Enterprise</option>
                                    <option>Product</option>
                                    <option>Service</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

interface CreateAccountFormProps {
    onSave: (account: Omit<Account, 'id'>) => void;
    onCancel: () => void;
    technicalUsers: TechnicalUser[];
    services: LicenseService[];
    initialData?: Partial<Account>;
    mode?: 'create' | 'edit';
}

function CreateAccountForm({
    onSave,
    onCancel,
    technicalUsers,
    services,
    initialData,
    mode = 'create',
}: CreateAccountFormProps) {
    const [currentTab, setCurrentTab] = useState<
        'account' | 'technical' | 'license'
    >('account');
    const [accountData, setAccountData] = useState<Partial<Account>>({
        accountName: initialData?.accountName || '',
        firstName: initialData?.firstName || '',
        middleName: initialData?.middleName || '',
        lastName: initialData?.lastName || '',
        email: initialData?.email || '',
        phone: initialData?.phone || '',
        status: (initialData?.status as 'Active' | 'Inactive' | '') || '',
        addressLine1: initialData?.addressLine1 || '',
        addressLine2: initialData?.addressLine2 || '',
        city: initialData?.city || '',
        state: initialData?.state || '',
        country: initialData?.country || '',
        pincode: initialData?.pincode || '',
        technicalUsername: initialData?.technicalUsername || '',
        enterpriseName: initialData?.enterpriseName || '',
        enterpriseId: initialData?.enterpriseId || '',
        platform: initialData?.platform || 'Oracle',
        services: initialData?.services || [],
    });

    const [isAccountTabComplete, setIsAccountTabComplete] = useState(false);
    const [isTechnicalTabComplete, setIsTechnicalTabComplete] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const isLicenseTabComplete = useMemo(
        () => (accountData.services?.length || 0) > 0,
        [accountData.services],
    );

    const validateAccount = (a: Partial<Account>): Record<string, string> => {
        const e: Record<string, string> = {};
        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRe = /^[+]?[-0-9()\s]{7,20}$/;
        const pinReByCountry: Record<string, RegExp> = {
            India: /^[1-9][0-9]{5}$/,
            USA: /^\d{5}(-\d{4})?$/,
        };
        if (!a.accountName) e.accountName = 'Account name is required';
        if (!a.firstName) e.firstName = 'First name is required';
        if (!a.lastName) e.lastName = 'Last name is required';
        if (!a.email || !emailRe.test(a.email))
            e.email = 'Valid email is required';
        if (!a.phone || !phoneRe.test(a.phone))
            e.phone = 'Valid phone is required';
        if (!a.addressLine1) e.addressLine1 = 'Address Line 1 is required';
        if (!a.country) e.country = 'Country is required';
        if (!a.state) e.state = 'State is required';
        if (!a.city) e.city = 'City is required';
        if (!a.pincode) e.pincode = 'PIN/ZIP is required';
        const pinRe =
            a.country && pinReByCountry[a.country]
                ? pinReByCountry[a.country]
                : /^.{3,10}$/;
        if (a.pincode && !pinRe.test(a.pincode))
            e.pincode = `Invalid code for ${a.country || 'country'}`;
        return e;
    };

    // Validate Account Details tab
    useEffect(() => {
        const e = validateAccount(accountData);
        setErrors(e);
        setIsAccountTabComplete(Object.keys(e).length === 0);
    }, [accountData]);

    // Validate Technical Details tab
    useEffect(() => {
        const isComplete = !!accountData.technicalUsername;
        setIsTechnicalTabComplete(isComplete);
    }, [accountData.technicalUsername]);

    const handleSave = () => {
        const payload: Omit<Account, 'id'> = {
            accountName: accountData.accountName!,
            masterAccount: accountData.masterAccount || '',
            firstName: accountData.firstName!,
            middleName: accountData.middleName || '',
            lastName: accountData.lastName!,
            email: accountData.email!,
            phone: accountData.phone!,
            status: (accountData.status as 'Active' | 'Inactive' | '') || '',
            addressLine1: accountData.addressLine1!,
            addressLine2: accountData.addressLine2 || '',
            city: accountData.city!,
            state: accountData.state!,
            country: accountData.country!,
            pincode: accountData.pincode!,
            technicalUsername: accountData.technicalUsername!,
            technicalUserDetails: accountData.technicalUserDetails,
            enterpriseName: accountData.enterpriseName || '',
            enterpriseId: accountData.enterpriseId || '',
            platform: accountData.platform || '',
            services: accountData.services || [],
        };
        onSave(payload);
    };

    const canMoveToNext = () => {
        if (currentTab === 'account') return isAccountTabComplete;
        if (currentTab === 'technical') return isTechnicalTabComplete;
        return true;
    };

    return (
        <div className='max-w-6xl mx-auto h-[85vh] overflow-hidden'>
            <div className='bg-card rounded-xl border border-light shadow-lg flex flex-col h-full'>
                {/* Form Header */}
                <div className='px-6 py-4 border-b border-light bg-gradient-to-r from-slate-50 to-white rounded-t-xl'>
                    <div className='flex items-center justify-between'>
                        <h2 className='text-lg font-bold text-primary'>
                            {mode === 'edit'
                                ? 'Edit Account'
                                : 'Create New Account'}
                        </h2>
                        <div className='flex space-x-3'>
                            <button
                                onClick={onCancel}
                                className='px-4 py-2 text-sm font-medium text-secondary bg-tertiary hover:bg-slate-200 rounded-lg transition-colors duration-200'
                            >
                                Discard
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={
                                    !isAccountTabComplete ||
                                    !isTechnicalTabComplete
                                }
                                className='px-4 py-2 text-sm font-medium text-inverse bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all duration-200'
                            >
                                {mode === 'edit'
                                    ? 'Update Account'
                                    : 'Save Account'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className='px-6 py-4 border-b border-light bg-tertiary/30'>
                    <div className='flex space-x-1'>
                        <TabButton
                            label='Account Details'
                            isActive={currentTab === 'account'}
                            isComplete={isAccountTabComplete}
                            onClick={() => setCurrentTab('account')}
                        />
                        <TabButton
                            label='Technical Details'
                            isActive={currentTab === 'technical'}
                            isComplete={isTechnicalTabComplete}
                            onClick={() => setCurrentTab('technical')}
                            disabled={!isAccountTabComplete}
                        />
                        <TabButton
                            label='License Details'
                            isActive={currentTab === 'license'}
                            isComplete={isLicenseTabComplete}
                            onClick={() => setCurrentTab('license')}
                            disabled={
                                !isAccountTabComplete || !isTechnicalTabComplete
                            }
                        />
                    </div>
                </div>

                {/* Tab Content */}
                <div className='p-6 flex-1 overflow-y-auto'>
                    {currentTab === 'account' && (
                        <AccountDetailsTab
                            data={accountData}
                            onChange={setAccountData}
                            errors={errors}
                        />
                    )}

                    {currentTab === 'technical' && (
                        <TechnicalDetailsTab
                            data={accountData}
                            onChange={setAccountData}
                            technicalUsers={technicalUsers}
                        />
                    )}

                    {currentTab === 'license' && (
                        <LicenseDetailsTab
                            data={accountData}
                            onChange={setAccountData}
                            services={services}
                        />
                    )}
                </div>

                {/* Navigation Footer */}
                <div className='px-6 py-4 border-t border-light bg-slate-50 rounded-b-xl flex justify-between'>
                    <button
                        onClick={() => {
                            if (currentTab === 'technical')
                                setCurrentTab('account');
                            if (currentTab === 'license')
                                setCurrentTab('technical');
                        }}
                        disabled={currentTab === 'account'}
                        className='px-4 py-2 text-sm font-medium text-secondary bg-white border border-light rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200'
                    >
                        Previous
                    </button>

                    <button
                        onClick={() => {
                            if (currentTab === 'account' && canMoveToNext())
                                setCurrentTab('technical');
                            if (currentTab === 'technical' && canMoveToNext())
                                setCurrentTab('license');
                        }}
                        disabled={!canMoveToNext() || currentTab === 'license'}
                        className='px-4 py-2 text-sm font-medium text-inverse bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all duration-200'
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}

interface TabButtonProps {
    label: string;
    isActive: boolean;
    isComplete: boolean;
    onClick: () => void;
    disabled?: boolean;
}

function TabButton({
    label,
    isActive,
    isComplete,
    onClick,
    disabled = false,
}: TabButtonProps) {
    const base = isActive
        ? 'bg-card text-brand shadow-md border border-primary/20'
        : disabled
        ? 'text-tertiary cursor-not-allowed'
        : 'text-secondary hover:text-primary hover:bg-card/50';

    const completeRing = isComplete
        ? 'ring-2 ring-green-500 ring-offset-1'
        : '';

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${base} ${completeRing}`}
        >
            <span
                className={`inline-block w-2.5 h-2.5 rounded-full ${
                    isComplete ? 'bg-green-500' : 'bg-slate-300'
                }`}
            ></span>
            <span className='text-sm'>{label}</span>
        </button>
    );
}

interface AccountDetailsTabProps {
    data: Partial<Account>;
    onChange: (data: Partial<Account>) => void;
    errors?: Record<string, string>;
}

function AccountDetailsTab({
    data,
    onChange,
    errors = {},
}: AccountDetailsTabProps) {
    const updateField = (field: keyof Account, value: string) => {
        onChange({...data, [field]: value});
    };

    const [countries, setCountries] = useState<string[]>([]);
    const [states, setStates] = useState<string[]>([]);
    const [cities, setCities] = useState<string[]>([]);

    useEffect(() => {
        fetchCountries()
            .then(setCountries)
            .catch(() => setCountries([]));
    }, []);

    useEffect(() => {
        if (!data.country) {
            setStates([]);
            setCities([]);
            return;
        }
        fetchStates(data.country)
            .then((lst) => {
                setStates(lst);
                if (!lst.includes(data.state || '')) {
                    onChange({...data, state: '', city: ''});
                }
            })
            .catch(() => setStates([]));
    }, [data.country]);

    useEffect(() => {
        if (!data.country || !data.state) {
            setCities([]);
            return;
        }
        fetchCities(data.country, data.state)
            .then((lst) => {
                setCities(lst);
                if (!lst.includes(data.city || '')) {
                    onChange({...data, city: ''});
                }
            })
            .catch(() => setCities([]));
    }, [data.country, data.state]);

    return (
        <div className='space-y-8'>
            {/* General Details */}
            <div>
                <h3 className='text-lg font-semibold text-primary mb-4'>
                    General Details
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div className='md:col-span-2'>
                        <label className='block text-sm font-semibold text-primary mb-2'>
                            Account Name *
                        </label>
                        <input
                            type='text'
                            value={data.accountName || ''}
                            onChange={(e) =>
                                updateField('accountName', e.target.value)
                            }
                            placeholder='Enter account name'
                            className={`block w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 bg-card text-primary placeholder-secondary ${
                                errors.accountName
                                    ? 'border-red-400 focus:ring-red-200'
                                    : 'border-light focus:ring-primary/20 focus:border-brand'
                            }`}
                        />
                        {errors.accountName && (
                            <p className='text-xs text-red-600 mt-1'>
                                {errors.accountName}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className='block text-sm font-semibold text-primary mb-2'>
                            First Name *
                        </label>
                        <input
                            type='text'
                            value={data.firstName || ''}
                            onChange={(e) =>
                                updateField('firstName', e.target.value)
                            }
                            placeholder='First name'
                            className={`block w-full px-4 py-3 border rounded-lg focus:outline-none bg-card text-primary placeholder-secondary ${
                                errors.firstName
                                    ? 'border-red-400 focus:ring-red-200'
                                    : 'border-light focus:ring-primary/20 focus:border-brand'
                            }`}
                        />
                        {errors.firstName && (
                            <p className='text-xs text-red-600 mt-1'>
                                {errors.firstName}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className='block text-sm font-semibold text-primary mb-2'>
                            Middle Name
                        </label>
                        <input
                            type='text'
                            value={data.middleName || ''}
                            onChange={(e) =>
                                updateField('middleName', e.target.value)
                            }
                            placeholder='Middle name'
                            className='block w-full px-4 py-3 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-brand bg-card text-primary placeholder-secondary'
                        />
                    </div>

                    <div>
                        <label className='block text-sm font-semibold text-primary mb-2'>
                            Last Name *
                        </label>
                        <input
                            type='text'
                            value={data.lastName || ''}
                            onChange={(e) =>
                                updateField('lastName', e.target.value)
                            }
                            placeholder='Last name'
                            className={`block w-full px-4 py-3 border rounded-lg focus:outline-none bg-card text-primary placeholder-secondary ${
                                errors.lastName
                                    ? 'border-red-400 focus:ring-red-200'
                                    : 'border-light focus:ring-primary/20 focus:border-brand'
                            }`}
                        />
                        {errors.lastName && (
                            <p className='text-xs text-red-600 mt-1'>
                                {errors.lastName}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className='block text-sm font-semibold text-primary mb-2'>
                            Email Address *
                        </label>
                        <input
                            type='email'
                            value={data.email || ''}
                            onChange={(e) =>
                                updateField('email', e.target.value)
                            }
                            placeholder='email@company.com'
                            className={`block w-full px-4 py-3 border rounded-lg focus:outline-none bg-card text-primary placeholder-secondary ${
                                errors.email
                                    ? 'border-red-400 focus:ring-red-200'
                                    : 'border-light focus:ring-primary/20 focus:border-brand'
                            }`}
                        />
                        {errors.email && (
                            <p className='text-xs text-red-600 mt-1'>
                                {errors.email}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className='block text-sm font-semibold text-primary mb-2'>
                            Phone Number *
                        </label>
                        <input
                            type='tel'
                            value={data.phone || ''}
                            onChange={(e) =>
                                updateField('phone', e.target.value)
                            }
                            placeholder='+1 (555) 123-4567'
                            className={`block w-full px-4 py-3 border rounded-lg focus:outline-none bg-card text-primary placeholder-secondary ${
                                errors.phone
                                    ? 'border-red-400 focus:ring-red-200'
                                    : 'border-light focus:ring-primary/20 focus:border-brand'
                            }`}
                        />
                        {errors.phone && (
                            <p className='text-xs text-red-600 mt-1'>
                                {errors.phone}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className='block text-sm font-semibold text-primary mb-2'>
                            Status
                        </label>
                        <div className='flex items-center space-x-4'>
                            <label className='flex items-center'>
                                <input
                                    type='radio'
                                    name='status'
                                    value='Active'
                                    checked={data.status === 'Active'}
                                    onChange={(e) =>
                                        updateField(
                                            'status',
                                            e.target.value as
                                                | 'Active'
                                                | 'Inactive',
                                        )
                                    }
                                    className='mr-2'
                                />
                                <span className='text-sm text-primary'>
                                    Active
                                </span>
                            </label>
                            <label className='flex items-center'>
                                <input
                                    type='radio'
                                    name='status'
                                    value='Inactive'
                                    checked={data.status === 'Inactive'}
                                    onChange={(e) =>
                                        updateField(
                                            'status',
                                            e.target.value as
                                                | 'Active'
                                                | 'Inactive',
                                        )
                                    }
                                    className='mr-2'
                                />
                                <span className='text-sm text-primary'>
                                    Inactive
                                </span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Address Details */}
            <div>
                <h3 className='text-lg font-semibold text-primary mb-4'>
                    Address Details
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div className='md:col-span-2'>
                        <label className='block text-sm font-semibold text-primary mb-2'>
                            Address Line 1 *
                        </label>
                        <input
                            type='text'
                            value={data.addressLine1 || ''}
                            onChange={(e) =>
                                updateField('addressLine1', e.target.value)
                            }
                            placeholder='Street address, P.O. box, company name'
                            className={`block w-full px-4 py-3 border rounded-lg focus:outline-none bg-card text-primary placeholder-secondary ${
                                errors.addressLine1
                                    ? 'border-red-400 focus:ring-red-200'
                                    : 'border-light focus:ring-primary/20 focus:border-brand'
                            }`}
                        />
                        {errors.addressLine1 && (
                            <p className='text-xs text-red-600 mt-1'>
                                {errors.addressLine1}
                            </p>
                        )}
                    </div>

                    <div className='md:col-span-2'>
                        <label className='block text-sm font-semibold text-primary mb-2'>
                            Address Line 2
                        </label>
                        <input
                            type='text'
                            value={data.addressLine2 || ''}
                            onChange={(e) =>
                                updateField('addressLine2', e.target.value)
                            }
                            placeholder='Apartment, suite, unit, building, floor, etc.'
                            className='block w-full px-4 py-3 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-brand bg-card text-primary placeholder-secondary'
                        />
                    </div>

                    <div>
                        <label className='block text-sm font-semibold text-primary mb-2'>
                            City *
                        </label>
                        <select
                            value={data.city || ''}
                            onChange={(e) =>
                                updateField('city', e.target.value)
                            }
                            disabled={cities.length === 0}
                            className={`block w-full px-4 py-3 border rounded-lg focus:outline-none bg-card text-primary ${
                                errors.city
                                    ? 'border-red-400 focus:ring-red-200'
                                    : 'border-light focus:ring-primary/20 focus:border-brand'
                            }`}
                        >
                            <option value=''>Select city</option>
                            {cities.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>
                        {errors.city && (
                            <p className='text-xs text-red-600 mt-1'>
                                {errors.city}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className='block text-sm font-semibold text-primary mb-2'>
                            State *
                        </label>
                        <select
                            value={data.state || ''}
                            onChange={(e) => {
                                const v = e.target.value;
                                onChange({...data, state: v, city: ''});
                            }}
                            disabled={states.length === 0}
                            className={`block w-full px-4 py-3 border rounded-lg focus:outline-none bg-card text-primary ${
                                errors.state
                                    ? 'border-red-400 focus:ring-red-200'
                                    : 'border-light focus:ring-primary/20 focus:border-brand'
                            }`}
                        >
                            <option value=''>Select state</option>
                            {states.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                        {errors.state && (
                            <p className='text-xs text-red-600 mt-1'>
                                {errors.state}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className='block text-sm font-semibold text-primary mb-2'>
                            Country *
                        </label>
                        <select
                            value={data.country || ''}
                            onChange={(e) => {
                                const v = e.target.value;
                                onChange({
                                    ...data,
                                    country: v,
                                    state: '',
                                    city: '',
                                });
                            }}
                            className={`block w-full px-4 py-3 border rounded-lg focus:outline-none bg-card text-primary ${
                                errors.country
                                    ? 'border-red-400 focus:ring-red-200'
                                    : 'border-light focus:ring-primary/20 focus:border-brand'
                            }`}
                        >
                            <option value=''>Select country</option>
                            {countries.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>
                        {errors.country && (
                            <p className='text-xs text-red-600 mt-1'>
                                {errors.country}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className='block text-sm font-semibold text-primary mb-2'>
                            Pin Code *
                        </label>
                        <input
                            type='text'
                            value={data.pincode || ''}
                            onChange={(e) =>
                                updateField('pincode', e.target.value)
                            }
                            placeholder='Pin code'
                            className={`block w-full px-4 py-3 border rounded-lg focus:outline-none bg-card text-primary placeholder-secondary ${
                                errors.pincode
                                    ? 'border-red-400 focus:ring-red-200'
                                    : 'border-light focus:ring-primary/20 focus:border-brand'
                            }`}
                        />
                        {errors.pincode && (
                            <p className='text-xs text-red-600 mt-1'>
                                {errors.pincode}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

interface TechnicalDetailsTabProps {
    data: Partial<Account>;
    onChange: (data: Partial<Account>) => void;
    technicalUsers: TechnicalUser[];
}

function TechnicalDetailsTab({
    data,
    onChange,
    technicalUsers,
}: TechnicalDetailsTabProps) {
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [userSearch, setUserSearch] = useState('');

    const filteredUsers = technicalUsers.filter(
        (user) =>
            user.username.toLowerCase().includes(userSearch.toLowerCase()) ||
            user.email.toLowerCase().includes(userSearch.toLowerCase()) ||
            `${user.firstName} ${user.lastName}`
                .toLowerCase()
                .includes(userSearch.toLowerCase()),
    );

    const selectedUser = technicalUsers.find(
        (user) => user.username === data.technicalUsername,
    );

    const updateField = (field: keyof Account, value: string) => {
        onChange({...data, [field]: value});
    };

    const selectUser = (user: TechnicalUser) => {
        onChange({
            ...data,
            technicalUsername: user.username,
            technicalUserDetails: user,
        });
        setShowUserDropdown(false);
        setUserSearch('');
    };

    return (
        <div className='space-y-8'>
            <div>
                <h3 className='text-lg font-semibold text-primary mb-4'>
                    Technical Details
                </h3>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    {/* Technical User Selection */}
                    <div className='md:col-span-2'>
                        <label className='block text-sm font-semibold text-primary mb-2'>
                            Technical User Name (TUSER) *
                        </label>
                        <div className='relative'>
                            <div className='flex space-x-3'>
                                <div className='flex-1 relative'>
                                    <input
                                        type='text'
                                        value={data.technicalUsername || ''}
                                        onChange={(e) => {
                                            updateField(
                                                'technicalUsername',
                                                e.target.value,
                                            );
                                            setUserSearch(e.target.value);
                                            setShowUserDropdown(true);
                                        }}
                                        onFocus={() =>
                                            setShowUserDropdown(true)
                                        }
                                        placeholder='Search and select technical user'
                                        className='block w-full px-4 py-3 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-brand bg-card text-primary placeholder-secondary'
                                    />

                                    {showUserDropdown && (
                                        <div className='absolute z-10 w-full mt-1 bg-card border border-light rounded-lg shadow-lg max-h-60 overflow-auto'>
                                            {filteredUsers.map((user) => (
                                                <button
                                                    key={user.id}
                                                    onClick={() =>
                                                        selectUser(user)
                                                    }
                                                    className='w-full px-4 py-3 text-left hover:bg-tertiary/50 transition-colors duration-200 border-b border-light last:border-b-0'
                                                >
                                                    <div className='font-medium text-primary'>
                                                        {user.username}
                                                    </div>
                                                    <div className='text-sm text-secondary'>
                                                        {user.firstName}{' '}
                                                        {user.lastName}
                                                    </div>
                                                    <div className='text-xs text-tertiary'>
                                                        {user.email}
                                                    </div>
                                                </button>
                                            ))}
                                            {filteredUsers.length === 0 && (
                                                <div className='px-4 py-3 text-secondary text-center'>
                                                    No users found
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <button
                                    type='button'
                                    className='px-4 py-3 border border-primary bg-primary-light text-brand rounded-lg hover:bg-primary-light/80 transition-colors duration-200'
                                >
                                    + Add New TUSER
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Auto-populated fields when user is selected */}
                    {selectedUser && (
                        <div className='md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-green-50 border border-green-200 rounded-lg'>
                            <div>
                                <label className='block text-sm font-semibold text-primary mb-2'>
                                    Email Address (Auto-filled)
                                </label>
                                <input
                                    type='email'
                                    value={selectedUser.email}
                                    readOnly
                                    className='block w-full px-4 py-3 border border-green-300 rounded-lg bg-green-50 text-primary'
                                />
                            </div>
                            <div>
                                <label className='block text-sm font-semibold text-primary mb-2'>
                                    First Name (Auto-filled)
                                </label>
                                <input
                                    type='text'
                                    value={selectedUser.firstName}
                                    readOnly
                                    className='block w-full px-4 py-3 border border-green-300 rounded-lg bg-green-50 text-primary'
                                />
                            </div>
                        </div>
                    )}

                    {/* Removed Enterprise Name and Platform from Technical tab per requirements */}
                </div>
            </div>
        </div>
    );
}

interface LicenseDetailsTabProps {
    data: Partial<Account>;
    onChange: (data: Partial<Account>) => void;
    services: LicenseService[];
}

function LicenseDetailsTab({data, onChange, services}: LicenseDetailsTabProps) {
    const [showAddServiceModal, setShowAddServiceModal] = useState(false);
    const [enterprises, setEnterprises] = useState<
        {id: string; name: string}[]
    >([]);
    const [selectedEnterpriseId, setSelectedEnterpriseId] = useState(
        data.enterpriseId || '',
    );
    const [selectedEnterpriseName, setSelectedEnterpriseName] = useState(
        data.enterpriseName || '',
    );

    const addService = (serviceData: any) => {
        const updatedServices = [...(data.services || []), serviceData];
        onChange({...data, services: updatedServices});
        setShowAddServiceModal(false);
    };

    const removeService = (index: number) => {
        const updatedServices = (data.services || []).filter(
            (_, i) => i !== index,
        );
        onChange({...data, services: updatedServices});
    };

    useEffect(() => {
        api.get<{id: string; name: string}[]>(`/api/enterprises`)
            .then((rows) => {
                setEnterprises(rows || []);
            })
            .catch(() => setEnterprises([]));
    }, []);

    useEffect(() => {
        onChange({
            ...data,
            enterpriseId: selectedEnterpriseId,
            enterpriseName: selectedEnterpriseName,
        });
    }, [selectedEnterpriseId, selectedEnterpriseName]);

    return (
        <div className='space-y-8'>
            <div>
                <div className='flex items-center justify-between mb-6'>
                    <h3 className='text-lg font-semibold text-primary'>
                        Services
                    </h3>
                    <button
                        onClick={() => setShowAddServiceModal(true)}
                        className='inline-flex items-center px-4 py-2 border border-primary bg-primary-light text-brand rounded-lg hover:bg-primary-light/80 transition-colors duration-200'
                    >
                        <PlusIcon className='w-4 h-4 mr-2' />
                        Add Service
                    </button>
                </div>

                {/* Enterprise selection */}
                <div className='mb-6 grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div>
                        <label className='block text-sm font-semibold text-primary mb-2'>
                            Enterprise
                        </label>
                        <select
                            value={selectedEnterpriseId}
                            onChange={(e) => {
                                const id = e.target.value;
                                setSelectedEnterpriseId(id);
                                const ent = enterprises.find(
                                    (x) => x.id === id,
                                );
                                setSelectedEnterpriseName(ent?.name || '');
                            }}
                            className='block w-full px-3 py-2.5 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-brand bg-card text-primary'
                        >
                            <option value=''>Select enterprise</option>
                            {enterprises.map((e) => (
                                <option key={e.id} value={e.id}>
                                    {e.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {(data.services || []).length === 0 ? (
                    <div className='border-2 border-dashed border-light rounded-lg p-8 text-center'>
                        <div className='text-secondary'>
                            No services added yet
                        </div>
                        <button
                            onClick={() => setShowAddServiceModal(true)}
                            className='mt-2 text-brand hover:text-brand-dark font-medium'
                        >
                            Add your first service
                        </button>
                    </div>
                ) : (
                    <div className='space-y-4'>
                        {(data.services || []).map((service, index) => (
                            <div
                                key={index}
                                className='border border-light rounded-lg p-4 bg-card'
                            >
                                <div className='flex items-start justify-between'>
                                    <div className='flex-1'>
                                        <h4 className='font-semibold text-primary'>
                                            {service.service}
                                        </h4>
                                        <p className='text-sm text-secondary'>
                                            {service.category}
                                        </p>
                                        <div className='mt-2 grid grid-cols-2 gap-4 text-sm'>
                                            <div>
                                                <span className='text-tertiary'>
                                                    License Date:
                                                </span>
                                                <span className='ml-2 text-primary'>
                                                    {service.licenseDate}
                                                </span>
                                            </div>
                                            <div>
                                                <span className='text-tertiary'>
                                                    Expiration:
                                                </span>
                                                <span className='ml-2 text-primary'>
                                                    {service.expirationDate}
                                                </span>
                                            </div>
                                            <div>
                                                <span className='text-tertiary'>
                                                    Users:
                                                </span>
                                                <span className='ml-2 text-primary'>
                                                    {service.users}
                                                </span>
                                            </div>
                                            <div>
                                                <span className='text-tertiary'>
                                                    Renewal Notice:
                                                </span>
                                                <span className='ml-2 text-primary'>
                                                    {service.renewalNotice
                                                        ? `Yes (${service.renewalNoticePeriod} days)`
                                                        : 'No'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeService(index)}
                                        className='text-red-500 hover:text-red-600 p-1'
                                    >
                                        <svg
                                            className='w-4 h-4'
                                            fill='none'
                                            stroke='currentColor'
                                            viewBox='0 0 24 24'
                                        >
                                            <path
                                                strokeLinecap='round'
                                                strokeLinejoin='round'
                                                strokeWidth={2}
                                                d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                                            />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showAddServiceModal && (
                <AddServiceModal
                    services={services}
                    onSave={addService}
                    onCancel={() => setShowAddServiceModal(false)}
                />
            )}
        </div>
    );
}

interface AddServiceModalProps {
    services: LicenseService[];
    onSave: (serviceData: any) => void;
    onCancel: () => void;
}

function AddServiceModal({services, onSave, onCancel}: AddServiceModalProps) {
    const [selectedService, setSelectedService] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [licenseDate, setLicenseDate] = useState('');
    const [expirationDate, setExpirationDate] = useState('');
    const [users, setUsers] = useState('');
    const [renewalNotice, setRenewalNotice] = useState(false);
    const [renewalNoticePeriod, setRenewalNoticePeriod] = useState('30');
    const [dbServices, setDbServices] = useState<
        {id: string; product_name: string; service_name: string}[]
    >([]);

    useEffect(() => {
        // Load distinct product/service names from backend
        api.get<any[]>(`/api/enterprises`)
            .then((rows) => {
                // Flatten services from response if provided; otherwise, fallback to given services prop
                const flat: {
                    id: string;
                    product_name: string;
                    service_name: string;
                }[] = [];
                for (const ent of rows || []) {
                    for (const prod of ent.services || []) {
                        for (const svc of prod.categories || []) {
                            flat.push({
                                id: `${ent.id}-${prod.name}-${svc}`,
                                product_name: prod.name,
                                service_name: svc,
                            });
                        }
                    }
                }
                setDbServices(flat);
            })
            .catch(() => setDbServices([]));
    }, []);

    const productNames = Array.from(
        new Set(dbServices.map((x) => x.product_name)),
    );
    const categories = selectedService
        ? Array.from(
              new Set(
                  dbServices
                      .filter((x) => x.product_name === selectedService)
                      .map((x) => x.service_name),
              ),
          )
        : [];

    const handleSave = () => {
        if (
            selectedService &&
            selectedCategory &&
            licenseDate &&
            expirationDate &&
            users
        ) {
            onSave({
                service: selectedService,
                category: selectedCategory,
                licenseDate,
                expirationDate,
                users: parseInt(users),
                renewalNotice,
                renewalNoticePeriod: renewalNotice
                    ? parseInt(renewalNoticePeriod)
                    : undefined,
            });
        }
    };

    return (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
            <div className='bg-card rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto'>
                <div className='px-6 py-4 border-b border-light'>
                    <h3 className='text-lg font-bold text-primary'>
                        Add Service
                    </h3>
                </div>

                <div className='p-6 space-y-4'>
                    {/* Service Selection */}
                    <div>
                        <label className='block text-sm font-semibold text-primary mb-2'>
                            Select Product *
                        </label>
                        <select
                            value={selectedService}
                            onChange={(e) => {
                                setSelectedService(e.target.value);
                                setSelectedCategory('');
                            }}
                            className='block w-full px-3 py-2.5 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-brand bg-card text-primary'
                        >
                            <option value=''>Select a product</option>
                            {productNames.map((p) => (
                                <option key={p} value={p}>
                                    {p}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Category Selection */}
                    {selectedService && (
                        <div>
                            <label className='block text-sm font-semibold text-primary mb-2'>
                                Select Service *
                            </label>
                            <select
                                value={selectedCategory}
                                onChange={(e) =>
                                    setSelectedCategory(e.target.value)
                                }
                                className='block w-full px-3 py-2.5 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-brand bg-card text-primary'
                            >
                                <option value=''>Select a category</option>
                                {categories.map((category, index) => (
                                    <option key={index} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* License Date */}
                    {selectedCategory && (
                        <>
                            <div>
                                <label className='block text-sm font-semibold text-primary mb-2'>
                                    License Date *
                                </label>
                                <input
                                    type='date'
                                    value={licenseDate}
                                    onChange={(e) =>
                                        setLicenseDate(e.target.value)
                                    }
                                    className='block w-full px-3 py-2.5 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-brand bg-card text-primary'
                                />
                            </div>

                            <div>
                                <label className='block text-sm font-semibold text-primary mb-2'>
                                    Expiration Date *
                                </label>
                                <input
                                    type='date'
                                    value={expirationDate}
                                    onChange={(e) =>
                                        setExpirationDate(e.target.value)
                                    }
                                    className='block w-full px-3 py-2.5 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-brand bg-card text-primary'
                                />
                            </div>

                            <div>
                                <label className='block text-sm font-semibold text-primary mb-2'>
                                    Number of Users *
                                </label>
                                <input
                                    type='number'
                                    value={users}
                                    onChange={(e) => setUsers(e.target.value)}
                                    placeholder='Number of users'
                                    className='block w-full px-3 py-2.5 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-brand bg-card text-primary placeholder-secondary'
                                />
                            </div>

                            <div>
                                <label className='flex items-center'>
                                    <input
                                        type='checkbox'
                                        checked={renewalNotice}
                                        onChange={(e) =>
                                            setRenewalNotice(e.target.checked)
                                        }
                                        className='mr-3 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded'
                                    />
                                    <span className='text-sm font-semibold text-primary'>
                                        Renewal Notice Period
                                    </span>
                                </label>
                            </div>

                            {renewalNotice && (
                                <div>
                                    <label className='block text-sm font-semibold text-primary mb-2'>
                                        Notice Period (Days)
                                    </label>
                                    <input
                                        type='number'
                                        value={renewalNoticePeriod}
                                        onChange={(e) =>
                                            setRenewalNoticePeriod(
                                                e.target.value,
                                            )
                                        }
                                        placeholder='Days before expiration'
                                        className='block w-full px-3 py-2.5 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-brand bg-card text-primary placeholder-secondary'
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className='px-6 py-4 border-t border-light flex justify-end space-x-3'>
                    <button
                        onClick={onCancel}
                        className='px-4 py-2 text-sm font-medium text-secondary bg-tertiary hover:bg-slate-200 rounded-lg transition-colors duration-200'
                    >
                        Discard
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={
                            !selectedService ||
                            !selectedCategory ||
                            !licenseDate ||
                            !expirationDate ||
                            !users
                        }
                        className='px-4 py-2 text-sm font-medium text-inverse bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all duration-200'
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}

interface AccountCardProps {
    account: Account;
    onEdit: () => void;
    onDelete: (id: string) => void;
}

function AccountCard({account, onEdit, onDelete}: AccountCardProps) {
    return (
        <div className='relative overflow-hidden group rounded-2xl border border-slate-200 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:ring-2 hover:ring-indigo-300/50'>
            {/* Background Decorations */}
            <div className='pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-gradient-to-br from-fuchsia-200/40 to-sky-200/50 blur-2xl group-hover:scale-110 group-hover:opacity-90 transition-all duration-500'></div>
            <div className='pointer-events-none absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-gradient-to-tr from-emerald-200/40 to-blue-200/50 blur-2xl group-hover:scale-110 group-hover:opacity-90 transition-all duration-500'></div>

            {/* Header */}
            <div className='relative z-10 mb-4 flex items-start justify-between'>
                <div className='flex-1'>
                    <div className='mb-2 flex items-center space-x-3'>
                        <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 shadow-lg transition-all duration-300 group-hover:shadow-emerald-300/40 group-hover:brightness-110'>
                            <svg
                                className='h-5 w-5 text-white'
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
                        <div>
                            <h3 className='text-lg font-bold text-slate-900 transition-colors duration-200 group-hover:text-emerald-600'>
                                {account.accountName}
                            </h3>
                            <p className='text-sm font-medium text-slate-500'>
                                {account.firstName} {account.lastName}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons (always visible) */}
                <div className='flex space-x-2'>
                    <button
                        onClick={onEdit}
                        className='rounded-xl border border-transparent p-2.5 text-slate-400 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600 hover:shadow-md'
                        title='Edit account'
                    >
                        <svg
                            className='h-4 w-4'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                            />
                        </svg>
                    </button>
                    <button
                        onClick={() => onDelete(account.id)}
                        className='rounded-xl border border-transparent p-2.5 text-slate-400 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50 hover:text-red-600 hover:shadow-md'
                        title='Delete account'
                    >
                        <svg
                            className='h-4 w-4'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                            />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Account Info */}
            <div className='mb-4 space-y-3'>
                <div className='flex items-center space-x-2 text-sm'>
                    <svg
                        className='h-4 w-4 text-slate-400'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                    >
                        <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
                        />
                    </svg>
                    <span className='text-slate-600'>{account.email}</span>
                </div>
                <div className='flex items-center space-x-2 text-sm'>
                    <svg
                        className='h-4 w-4 text-slate-400'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                    >
                        <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z'
                        />
                    </svg>
                    <span className='text-slate-600'>{account.phone}</span>
                </div>
                {account.technicalUsername && (
                    <div className='flex items-center space-x-2 text-sm'>
                        <svg
                            className='h-4 w-4 text-slate-400'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4'
                            />
                        </svg>
                        <span className='text-slate-600'>
                            {account.technicalUsername}
                        </span>
                    </div>
                )}
            </div>

            {/* Status and Services */}
            <div className='flex items-center justify-between border-t border-slate-100 pt-4'>
                <div className='flex items-center space-x-2'>
                    <div
                        className={`h-2.5 w-2.5 rounded-full shadow-sm ${
                            account.status === 'Active'
                                ? 'bg-emerald-400 animate-pulse'
                                : 'bg-slate-400'
                        }`}
                    ></div>
                    <span className='text-sm font-medium capitalize text-slate-600'>
                        {account.status}
                    </span>
                </div>
                <div className='flex items-center space-x-1 rounded-full bg-white/70 px-2 py-1 shadow-sm ring-1 ring-slate-200 backdrop-blur-sm'>
                    <svg
                        className='h-4 w-4 text-slate-400'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                    >
                        <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z'
                        />
                    </svg>
                    <span className='text-sm text-slate-500 font-medium'>
                        {account.services?.length ?? 0} service
                        {(account.services?.length ?? 0) !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>
        </div>
    );
}
