'use client';

import {useEffect, useMemo, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {api} from '@/utils/api';
import {Icon} from '@/components/Icons';
import ConfirmModal from '@/components/ConfirmModal';
import TrashButton from '@/components/TrashButton';
import SearchSelect from '@/components/SearchSelect';
import Link from 'next/link';
import {useRouter} from 'next/navigation';

interface GlobalSetting {
    id: string;
    accountId: string;
    accountName: string;
    enterpriseName: string;
    entities: string[]; // selected entities like Finance, Payroll, People
    categories: {
        plan: string[];
        code: string[];
        build: string[];
        test: string[];
        release: string[];
        deploy: string[];
        others: string[];
    };
}

const STORAGE_KEY = 'global-settings';

const DEFAULT_ACCOUNTS: {id: string; accountName: string}[] = [
    {id: 'acc-1001', accountName: 'acme Corp'},
    {id: 'acc-1002', accountName: 'Globex Ltd'},
    {id: 'acc-1003', accountName: 'Initech'},
];

// Color palette for entity chips; deterministic by entity name
const ENTITY_CHIP_PALETTE: Array<{bg: string; text: string; border: string}> = [
    {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
    },
    {bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200'},
    {bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200'},
    {bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200'},
    {bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200'},
    {bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200'},
    {bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200'},
    {
        bg: 'bg-fuchsia-50',
        text: 'text-fuchsia-700',
        border: 'border-fuchsia-200',
    },
];
function getEntityChipClasses(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++)
        hash = (hash * 31 + name.charCodeAt(i)) | 0;
    const idx = Math.abs(hash) % ENTITY_CHIP_PALETTE.length;
    const c = ENTITY_CHIP_PALETTE[idx];
    return `${c.bg} ${c.text} ${c.border}`;
}

export default function GlobalSettingsPage() {
    const router = useRouter();
    const [items, setItems] = useState<GlobalSetting[]>([]);
    const [search, setSearch] = useState('');
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    // Toolbar state (collapsible search + menus)
    const [showSearch, setShowSearch] = useState(false);
    const [sortOpen, setSortOpen] = useState(false);
    const [hideOpen, setHideOpen] = useState(false);
    const [groupOpen, setGroupOpen] = useState(false);
    const sortRef = useRef<HTMLDivElement>(null);
    const hideRef = useRef<HTMLDivElement>(null);
    const groupRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const [hideQuery, setHideQuery] = useState('');
    const [activeGroup, setActiveGroup] = useState<
        'None' | 'Enterprise' | 'Account'
    >('None');
    // Inline create panel state
    const [inlineOpen, setInlineOpen] = useState(false);
    const [accounts, setAccounts] = useState<
        Array<{id: string; accountName: string}>
    >([]);
    const [enterprises, setEnterprises] = useState<
        Array<{id: string; name: string}>
    >([]);
    const [accountId, setAccountId] = useState('');
    const [accountName, setAccountName] = useState('');
    const [enterpriseId, setEnterpriseId] = useState('');
    const [enterpriseName, setEnterpriseName] = useState('');
    const [entityOptions, setEntityOptions] = useState<string[]>([]);
    const [selectedEntities, setSelectedEntities] = useState<string[]>([]);
    const [entitiesLoading, setEntitiesLoading] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const data = await api.get<GlobalSetting[]>(
                    '/api/global-settings',
                );
                setItems(Array.isArray(data) ? data : []);
                if (!data || (Array.isArray(data) && data.length === 0)) {
                    setInlineOpen(true);
                }
            } catch {
                setItems([]);
            }
        })();
    }, []);

    // Auto-hydrate Account/Enterprise from breadcrumb selections (stored in localStorage)
    const [selectionResolving, setSelectionResolving] = useState(true);
    useEffect(() => {
        (async () => {
            try {
                const savedAccId =
                    typeof window !== 'undefined'
                        ? window.localStorage.getItem('selectedAccountId') || ''
                        : '';
                const savedEntId =
                    typeof window !== 'undefined'
                        ? window.localStorage.getItem('selectedEnterpriseId') ||
                          ''
                        : '';
                const savedAccName =
                    typeof window !== 'undefined'
                        ? window.localStorage.getItem('selectedAccountName') ||
                          ''
                        : '';
                const savedEntName =
                    typeof window !== 'undefined'
                        ? window.localStorage.getItem(
                              'selectedEnterpriseName',
                          ) || ''
                        : '';

                const [accs, ents] = await Promise.all([
                    api
                        .get<Array<{id: string; accountName: string}>>(
                            '/api/accounts',
                        )
                        .catch(() => [] as any),
                    api
                        .get<Array<{id: string; name: string}>>(
                            '/api/enterprises',
                        )
                        .catch(() => [] as any),
                ]);

                const accountsList = accs || [];
                const enterprisesList = ents || [];

                const resolvedAccId =
                    savedAccId ||
                    (savedAccName
                        ? String(
                              (
                                  accountsList.find(
                                      (a: any) =>
                                          a.accountName === savedAccName,
                                  ) || {id: ''}
                              ).id,
                          )
                        : '') ||
                    (accountsList.length === 1
                        ? String(accountsList[0].id)
                        : '');

                const resolvedEntId =
                    savedEntId ||
                    (savedEntName
                        ? String(
                              (
                                  enterprisesList.find(
                                      (e: any) => e.name === savedEntName,
                                  ) || {id: ''}
                              ).id,
                          )
                        : '') ||
                    (enterprisesList.length === 1
                        ? String(enterprisesList[0].id)
                        : '');

                const acc = accountsList.find(
                    (a: any) => String(a.id) === String(resolvedAccId),
                );
                const ent = enterprisesList.find(
                    (e: any) => String(e.id) === String(resolvedEntId),
                );

                setAccountId(resolvedAccId);
                setAccountName(acc?.accountName || savedAccName || '');
                setEnterpriseId(resolvedEntId);
                setEnterpriseName(ent?.name || savedEntName || '');
            } catch {
            } finally {
                setSelectionResolving(false);
            }
        })();
    }, []);

    useEffect(() => {
        const onDoc = (e: MouseEvent) => {
            const t = e.target as Node;
            if (sortOpen && sortRef.current && !sortRef.current.contains(t))
                setSortOpen(false);
            if (hideOpen && hideRef.current && !hideRef.current.contains(t))
                setHideOpen(false);
            if (groupOpen && groupRef.current && !groupRef.current.contains(t))
                setGroupOpen(false);
            if (
                showSearch &&
                searchContainerRef.current &&
                !searchContainerRef.current.contains(t)
            )
                setShowSearch(false);
        };
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, [sortOpen, hideOpen, groupOpen, showSearch]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return items;
        return items.filter(
            (i) =>
                i.enterpriseName.toLowerCase().includes(q) ||
                i.accountName.toLowerCase().includes(q) ||
                i.entities.some((e) => e.toLowerCase().includes(q)),
        );
    }, [items, search]);

    // Hoverable configuration pill for main list rows
    const LIST_CATEGORY_COLORS: Record<string, string> = {
        plan: '#6366F1',
        code: '#22C55E',
        build: '#F59E0B',
        test: '#06B6D4',
        release: '#EC4899',
        deploy: '#8B5CF6',
        others: '#64748B',
    };
    const LIST_CATEGORY_ORDER = [
        'plan',
        'code',
        'build',
        'test',
        'release',
        'deploy',
        'others',
    ];
    function GSPill({
        categories,
        label,
    }: {
        categories: GlobalSetting['categories'];
        label: string;
    }) {
        const total = LIST_CATEGORY_ORDER.reduce(
            (acc, key) =>
                acc +
                (categories?.[key as keyof typeof categories]?.length || 0),
            0,
        );
        const stateLabel = total === 0 ? 'Pending' : 'Configured';
        const stateClass =
            total === 0
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200';
        const [open, setOpen] = useState(false);
        const [coords, setCoords] = useState<{
            top: number;
            left: number;
        } | null>(null);
        const closeTimer = useRef<number | null>(null);
        const clearCloseTimer = () => {
            if (closeTimer.current !== null) {
                window.clearTimeout(closeTimer.current);
                closeTimer.current = null;
            }
        };
        const scheduleClose = () => {
            clearCloseTimer();
            closeTimer.current = window.setTimeout(() => setOpen(false), 180);
        };
        const entries = LIST_CATEGORY_ORDER.map((cat) => ({
            cat,
            count: categories?.[cat as keyof typeof categories]?.length || 0,
        }));
        const sum = entries.reduce((a, b) => a + b.count, 0) || 1;
        return (
            <>
                <span
                    onMouseEnter={(e) => {
                        clearCloseTimer();
                        const left = Math.min(
                            Math.max(12, e.clientX + 8),
                            window.innerWidth - 380,
                        );
                        const top = Math.min(
                            e.clientY + 12,
                            window.innerHeight - 220,
                        );
                        setCoords({top, left});
                        setOpen(true);
                    }}
                    onMouseLeave={scheduleClose}
                    onClick={(e) => {
                        const left = Math.min(
                            Math.max(12, e.clientX + 8),
                            window.innerWidth - 380,
                        );
                        const top = Math.min(
                            e.clientY + 12,
                            window.innerHeight - 220,
                        );
                        setCoords({top, left});
                        setOpen((v) => !v);
                    }}
                    onTouchStart={(e) => {
                        clearCloseTimer();
                        const touch = e.touches[0];
                        const left = Math.min(
                            Math.max(12, touch.clientX + 8),
                            window.innerWidth - 380,
                        );
                        const top = Math.min(
                            touch.clientY + 12,
                            window.innerHeight - 220,
                        );
                        setCoords({top, left});
                        setOpen(true);
                    }}
                    role='button'
                    aria-expanded={open}
                    className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full text-xs font-medium border ${stateClass} cursor-pointer group-hover:ring-2 group-hover:ring-indigo-200 group-hover:border-indigo-300`}
                >
                    <span>{stateLabel}</span>
                    <span className='inline-block h-1 w-1 rounded-full bg-slate-300'></span>
                    <span>{total} selected</span>
                </span>
                {open && coords && (
                    <div
                        style={{
                            position: 'fixed',
                            top: coords.top,
                            left: coords.left,
                            zIndex: 1000,
                        }}
                        className='rounded-xl border border-slate-200 bg-white shadow-2xl p-4 w-[360px] whitespace-normal break-words'
                        onMouseEnter={clearCloseTimer}
                        onMouseLeave={scheduleClose}
                    >
                        <div className='mb-2 text-xs font-semibold text-secondary'>
                            Selections for {label}
                        </div>
                        {total === 0 ? (
                            <div className='rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-sm leading-relaxed whitespace-normal break-words p-3'>
                                No settings configured yet. Click Configure to
                                select tools per category.
                            </div>
                        ) : (
                            <>
                                <div className='mb-3 h-2 w-full overflow-hidden rounded-full bg-slate-100'>
                                    <div className='flex h-full w-full'>
                                        {entries.map(({cat, count}) => {
                                            const width = `${Math.max(
                                                0,
                                                Math.round((count / sum) * 100),
                                            )}%`;
                                            return (
                                                <div
                                                    key={cat}
                                                    title={`${cat}: ${count}`}
                                                    style={{
                                                        width,
                                                        backgroundColor:
                                                            LIST_CATEGORY_COLORS[
                                                                cat
                                                            ],
                                                    }}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className='grid grid-cols-2 gap-3'>
                                    {entries.map(({cat, count}) => (
                                        <div
                                            key={cat}
                                            className='rounded-lg border border-slate-200 p-2'
                                        >
                                            <div className='mb-1 flex items-center justify-between'>
                                                <div className='text-xs font-semibold capitalize text-primary'>
                                                    {cat}
                                                </div>
                                                <div className='text-[10px] text-secondary'>
                                                    {count}
                                                </div>
                                            </div>
                                            {count === 0 ? (
                                                <div className='text-[11px] text-secondary'>
                                                    None
                                                </div>
                                            ) : null}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </>
        );
    }

    return (
        <div className='h-full bg-secondary flex flex-col'>
            <style jsx global>{`
                @keyframes modal-fade {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }
                @keyframes modal-slide {
                    from {
                        transform: translateX(24px);
                        opacity: 0.98;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                .animate-modal-fade {
                    animation: modal-fade 180ms ease-out both;
                }
                .animate-modal-slide {
                    animation: modal-slide 220ms cubic-bezier(0.2, 0.8, 0.2, 1)
                        both;
                }
                @keyframes row-enter {
                    from {
                        opacity: 0;
                        transform: translateY(6px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-row {
                    animation: row-enter 220ms ease-out both;
                }
                @keyframes curlFold {
                    0% {
                        opacity: 0;
                        transform: translate(4px, -4px) rotate(45deg) scale(0.6);
                    }
                    100% {
                        opacity: 1;
                        transform: translate(0, 0) rotate(45deg) scale(1);
                    }
                }
                .gs-chip {
                    position: relative;
                    overflow: hidden;
                }
                .gs-chip::after {
                    content: '';
                    position: absolute;
                    inset: -30% auto auto -30%;
                    right: -30%;
                    bottom: auto;
                    background: radial-gradient(
                        ellipse at center,
                        rgba(79, 70, 229, 0.16),
                        rgba(79, 70, 229, 0) 60%
                    );
                    opacity: 0;
                    transform: scale(0.2);
                    transition: opacity 220ms ease, transform 220ms ease;
                    pointer-events: none;
                }
                .gs-chip:hover::after {
                    opacity: 1;
                    transform: scale(1);
                }
                .gs-chip-selected {
                    box-shadow: 0 14px 36px -16px rgba(79, 70, 229, 0.45),
                        0 1px 3px rgba(2, 6, 23, 0.12);
                }
                /* Top-right corner tick ribbon */
                .gs-corner-check {
                    position: absolute;
                    top: 0;
                    right: 0;
                    width: 24px;
                    height: 24px;
                    background: #1d4ed8; /* blue-700 */
                    clip-path: polygon(100% 0, 100% 100%, 0 0);
                    pointer-events: none;
                    z-index: 2;
                    overflow: hidden;
                }
                .gs-corner-check svg {
                    position: absolute;
                    top: 10px;
                    right: 6px;
                    width: 9px;
                    height: 9px;
                    color: #fff;
                }
                .gs-corner-check-svg {
                    position: absolute;
                    top: 0;
                    right: 0;
                    width: 24px;
                    height: 24px;
                    pointer-events: none;
                    z-index: 2;
                    display: block;
                }
                .gs-curl {
                    position: absolute;
                    top: 0;
                    right: 0;
                    width: 18px;
                    height: 18px;
                    background: linear-gradient(
                        135deg,
                        rgba(255, 255, 255, 0) 0%,
                        rgba(99, 102, 241, 0.35) 55%,
                        rgba(79, 70, 229, 0.7) 100%
                    );
                    clip-path: polygon(0 0, 100% 0, 100% 100%);
                    border-top-right-radius: 10px;
                    box-shadow: 0 1px 2px rgba(2, 6, 23, 0.18);
                    border-left: 1px solid rgba(79, 70, 229, 0.2);
                    border-top: 1px solid rgba(79, 70, 229, 0.2);
                    animation: curlFold 420ms ease-out;
                    pointer-events: none;
                }
                .gs-tilt {
                    transform: translateY(-1px) scale(1.02) rotate(-0.6deg);
                }
                @keyframes rippleScale {
                    from {
                        opacity: 0.35;
                        transform: translate(-50%, -50%) scale(0.2);
                    }
                    to {
                        opacity: 0;
                        transform: translate(-50%, -50%) scale(2.4);
                    }
                }
                .gs-ripple {
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    width: 46px;
                    height: 46px;
                    border-radius: 9999px;
                    background: radial-gradient(
                        circle,
                        rgba(99, 102, 241, 0.25) 0%,
                        rgba(99, 102, 241, 0.15) 40%,
                        rgba(99, 102, 241, 0) 60%
                    );
                    transform: translate(-50%, -50%) scale(0.2);
                    animation: rippleScale 520ms ease-out forwards;
                    pointer-events: none;
                }
            `}</style>
            <style>{`
                /* Compact table tweaks to mirror Accounts/Monday-like grid */
                .compact-table table { border-spacing: 0; width: 100%; }
                .compact-table thead th { background: #fff; }
                .compact-table th, .compact-table td { border-right: 1px solid #e2e8f0; }
                .compact-table th:last-child, .compact-table td:last-child { border-right: none; }
                .header-cell { display:flex; align-items:center; justify-content:space-between; gap:8px; }
                .header-ellipsis { display:inline-flex; align-items:center; justify-content:center; width:24px; height:24px; border-radius:9999px; color:#64748B; }
                .header-ellipsis:hover { background:#eef2ff; color:#4338ca; }
                .add-inline-row { color:#64748B; }
                .add-inline-row:hover { color:#0f172a; }
            `}</style>
            <style>{`
                /* Row hover color without overlay so dropdown stays on top */
                .row-hover-safe { position: relative; }
                .row-hover-safe:hover { background-color: rgba(99,102,241,0.08); }
                .row-hover-safe .actions-cell { position: relative; z-index: 20; }
            `}</style>
            <div className='bg-card border-b border-light px-6 py-4'>
                <div className='flex items-center justify-between'>
                    <div>
                        <h1 className='text-xl font-bold text-primary'>
                            Global Settings
                        </h1>
                        <p className='text-sm text-secondary mt-1'>
                            System-wide configuration
                        </p>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className='bg-card border-b border-light px-6 py-3'>
                <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                        {/* Search chip + expandable input */}
                        <div
                            ref={searchContainerRef}
                            className='flex items-center gap-2'
                        >
                            <button
                                onClick={() => setShowSearch((s) => !s)}
                                className='relative inline-flex items-center gap-2 px-2 py-2 rounded text-slate-600 hover:text-slate-900'
                                title='Search'
                            >
                                <svg
                                    className='h-4 w-4'
                                    viewBox='0 0 24 24'
                                    fill='none'
                                    stroke='currentColor'
                                >
                                    <circle cx='11' cy='11' r='7'></circle>
                                    <line
                                        x1='21'
                                        y1='21'
                                        x2='16.65'
                                        y2='16.65'
                                    ></line>
                                </svg>
                                <span className='text-sm'>Search</span>
                            </button>
                            <div
                                className={`relative overflow-hidden transition-all duration-300 ${
                                    showSearch
                                        ? 'w-64 opacity-100'
                                        : 'w-0 opacity-0'
                                }`}
                            >
                                <input
                                    ref={searchRef}
                                    type='text'
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Escape') setSearch('');
                                    }}
                                    placeholder='Search global settings...'
                                    className='w-64 pr-7 px-3 py-2 text-sm rounded-md border border-light bg-white text-slate-700 placeholder-slate-400 shadow-sm'
                                />
                            </div>
                        </div>
                        {/* Filter placeholder */}
                        <button className='inline-flex items-center gap-2 px-2 py-2 rounded text-slate-600 hover:text-slate-900'>
                            <span className='text-sm'>Filter</span>
                        </button>
                        {/* Sort/Hide/Group dropdowns */}
                        <div ref={sortRef} className='relative'>
                            <button
                                className='relative inline-flex items-center gap-2 px-2 py-2 rounded text-slate-600 hover:text-slate-900'
                                title='Sort'
                                onClick={() => setSortOpen((v) => !v)}
                            >
                                <svg
                                    className='h-4 w-4'
                                    viewBox='0 0 24 24'
                                    fill='none'
                                    stroke='currentColor'
                                >
                                    <path d='M8 7v10M8 17l-2-2m2 2l2-2' />
                                    <path d='M16 17V7m0 0l-2 2m2-2l2 2' />
                                </svg>
                                <span className='text-sm'>Sort</span>
                            </button>
                            {sortOpen && (
                                <div className='absolute left-0 top-full z-50 mt-2 w-[260px] rounded-lg bg-card text-primary shadow-xl border border-light'>
                                    <div className='px-4 py-2.5 border-b border-light text-sm font-semibold'>
                                        Sort by
                                    </div>
                                    <div className='p-3 space-y-2 text-sm text-secondary'>
                                        <div>Feature coming soon</div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div ref={hideRef} className='relative'>
                            <button
                                className='relative inline-flex items-center gap-2 px-2 py-2 rounded text-slate-600 hover:text-slate-900'
                                onClick={() => setHideOpen((v) => !v)}
                            >
                                <svg
                                    className='h-4 w-4'
                                    viewBox='0 0 24 24'
                                    fill='none'
                                    stroke='currentColor'
                                >
                                    <path d='M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z' />
                                    <circle cx='12' cy='12' r='3' />
                                    <path d='M2 2l20 20' />
                                </svg>
                                <span className='text-sm'>Hide</span>
                            </button>
                            {hideOpen && (
                                <div className='absolute left-0 top-full z-50 mt-2 w-[260px] rounded-lg bg-card text-primary shadow-xl border border-light'>
                                    <div className='px-4 py-2.5 border-b border-light text-sm font-semibold'>
                                        Hide columns
                                    </div>
                                    <div className='p-3 text-sm text-secondary'>
                                        Feature coming soon
                                    </div>
                                </div>
                            )}
                        </div>
                        <div ref={groupRef} className='relative'>
                            <button
                                className='relative inline-flex items-center gap-2 px-2 py-2 rounded text-slate-600 hover:text-slate-900'
                                onClick={() => setGroupOpen((v) => !v)}
                            >
                                <svg
                                    className='h-4 w-4'
                                    viewBox='0 0 24 24'
                                    fill='none'
                                    stroke='currentColor'
                                >
                                    <rect
                                        x='3'
                                        y='3'
                                        width='8'
                                        height='8'
                                        rx='2'
                                    />
                                    <rect
                                        x='13'
                                        y='3'
                                        width='8'
                                        height='8'
                                        rx='2'
                                    />
                                    <rect
                                        x='3'
                                        y='13'
                                        width='8'
                                        height='8'
                                        rx='2'
                                    />
                                </svg>
                                <span className='text-sm'>Group by</span>
                            </button>
                            {groupOpen && (
                                <div className='absolute left-0 top-full z-50 mt-2 w-[260px] rounded-lg bg-card text-primary shadow-xl border border-light'>
                                    <div className='px-4 py-2.5 border-b border-light text-sm font-semibold'>
                                        Group by
                                    </div>
                                    <div className='p-3'>
                                        <select
                                            value={activeGroup}
                                            onChange={(e) =>
                                                setActiveGroup(
                                                    e.target.value as any,
                                                )
                                            }
                                            className='w-full bg-white border border-light rounded-md px-2.5 py-1.5 text-sm'
                                        >
                                            <option>None</option>
                                            <option>Enterprise</option>
                                            <option>Account</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <TrashButton id='gs-trash-target' />
                </div>
            </div>

            {/* Inline entity view uses account/enterprise from breadcrumb automatically */}
            <div className='mt-6 mb-6 px-6'>
                {selectionResolving ? (
                    <div className='text-sm text-secondary'>
                        Loading selection from breadcrumb…
                    </div>
                ) : accountId && enterpriseName ? (
                    <div>
                        <label className='block text-sm font-semibold text-primary mb-2'>
                            Entities
                        </label>
                        <InlineEntities
                            accountId={accountId}
                            accountName={accountName}
                            enterpriseId={enterpriseId}
                            enterpriseName={enterpriseName}
                            onCreated={async () => {
                                const data = await api.get<GlobalSetting[]>(
                                    '/api/global-settings',
                                );
                                setItems(Array.isArray(data) ? data : []);
                            }}
                            onRequestDelete={(entity) =>
                                setPendingDeleteId(entity)
                            }
                        />
                    </div>
                ) : (
                    <div className='text-sm text-secondary'>
                        Missing account/enterprise selection. Please pick them
                        in the breadcrumb.
                    </div>
                )}
            </div>

            <div className='flex-1 p-6'>
                {filtered.length === 0 ? null : (
                    <div className='overflow-x-auto bg-white border border-slate-200 rounded-2xl shadow-sm'>
                        <table className='min-w-full divide-y divide-slate-100'>
                            <thead className='bg-tertiary/40'>
                                <tr>
                                    <th className='px-6 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider'>
                                        Enterprise
                                    </th>
                                    <th className='px-6 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider'>
                                        Account
                                    </th>
                                    <th className='px-6 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider'>
                                        Entities
                                    </th>
                                    <th className='px-6 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider'>
                                        Configuration
                                    </th>
                                    <th className='px-6 py-3 text-right text-xs font-semibold text-secondary uppercase tracking-wider'>
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-slate-100'>
                                {filtered.map((item) => (
                                    <tr
                                        key={item.id}
                                        className='group transition-all duration-200 row-hover-safe'
                                    >
                                        <td className='px-6 py-4 whitespace-nowrap text-sm text-primary'>
                                            {item.enterpriseName}
                                        </td>
                                        <td className='px-6 py-4 whitespace-nowrap text-sm text-primary'>
                                            {item.accountName}
                                        </td>
                                        <td className='px-6 py-4'>
                                            <div className='flex flex-wrap gap-2'>
                                                {item.entities.map((e, idx) => (
                                                    <span
                                                        key={idx}
                                                        className='inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border bg-blue-50 text-blue-700 border-blue-200'
                                                    >
                                                        {e}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className='px-6 py-4 whitespace-nowrap text-sm'>
                                            <GSPill
                                                categories={item.categories}
                                                label={item.enterpriseName}
                                            />
                                        </td>
                                        <td className='px-6 py-4 whitespace-nowrap text-right text-sm'>
                                            <RowActions
                                                onView={() =>
                                                    router.push(
                                                        `/account-settings/global-settings/${item.id}`,
                                                    )
                                                }
                                                onEdit={() =>
                                                    router.push(
                                                        `/account-settings/global-settings/${item.id}?edit=1`,
                                                    )
                                                }
                                                onDelete={() =>
                                                    setPendingDeleteId(item.id)
                                                }
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            <ConfirmModal
                open={pendingDeleteId !== null}
                title='Confirm delete'
                message={`Delete entity "${
                    pendingDeleteId || ''
                }"?\n\nThis action can't be undone.`}
                onCancel={() => setPendingDeleteId(null)}
                onConfirm={async () => {
                    if (!pendingDeleteId) return;
                    try {
                        // Fetch existing BU rows, remove the entity, and update (PUT)
                        const buUrl = `/api/business-units?accountId=${encodeURIComponent(
                            accountId,
                        )}&enterpriseId=${encodeURIComponent(enterpriseId)}`;
                        const rows = await api.get<
                            Array<{id: number; entities: string}>
                        >(buUrl);
                        if (Array.isArray(rows) && rows.length > 0) {
                            const raw = String(rows[0].entities || '').trim();
                            let current: string[] = [];
                            if (raw.startsWith('{') && raw.endsWith('}')) {
                                const inner = raw.slice(1, -1);
                                current = inner
                                    .split(',')
                                    .map((s) => s.trim().replace(/^"|"$/g, ''))
                                    .filter(Boolean);
                            } else if (raw.startsWith('[')) {
                                try {
                                    const arr = JSON.parse(raw);
                                    if (Array.isArray(arr))
                                        current = arr.map((x: any) =>
                                            String(x),
                                        );
                                } catch {}
                            } else if (raw) {
                                current = [raw];
                            }
                            const next = current.filter(
                                (x) => x !== pendingDeleteId,
                            );
                            const formatEntities = (list: string[]) =>
                                `{${list
                                    .map((x) => `"${x.replace(/\"/g, '\\"')}"`)
                                    .join(',')}}`;
                            await api.put('/api/business-units', {
                                id: rows[0].id,
                                clientId: Number(accountId) || accountId,
                                enterpriseId:
                                    Number(enterpriseId) || enterpriseId,
                                entities: formatEntities(next),
                            } as any);
                        }
                        // refresh inline entities
                        await (async () => {
                            const buUrl2 = `/api/business-units?accountId=${encodeURIComponent(
                                accountId,
                            )}&enterpriseId=${encodeURIComponent(
                                enterpriseId,
                            )}`;
                            const buRows = await api.get<
                                Array<{entities: string}>
                            >(buUrl2);
                            const aggregated: string[] = [];
                            const addFromRaw = (rawIn: string) => {
                                const raw = String(rawIn || '').trim();
                                if (!raw) return;
                                if (raw.startsWith('{') && raw.endsWith('}')) {
                                    const inner = raw.slice(1, -1);
                                    inner
                                        .split(',')
                                        .map((s) =>
                                            s.trim().replace(/^"|"$/g, ''),
                                        )
                                        .filter(Boolean)
                                        .forEach((e) => aggregated.push(e));
                                } else if (raw.startsWith('[')) {
                                    try {
                                        const arr = JSON.parse(raw);
                                        if (Array.isArray(arr))
                                            arr.forEach((e: any) =>
                                                aggregated.push(String(e)),
                                            );
                                    } catch {}
                                } else if (raw) aggregated.push(raw);
                            };
                            if (Array.isArray(buRows))
                                buRows.forEach((r: any) =>
                                    addFromRaw(r.entities),
                                );
                            const list = Array.from(new Set(aggregated));
                            setOptions(list.length ? list : ['Default']);
                        })();
                    } catch {}
                    setPendingDeleteId(null);
                }}
            />
        </div>
    );
}

function RowActions({
    onConfigure,
    onDelete,
}: {
    onConfigure: () => void;
    onDelete: () => void;
}) {
    const [open, setOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const [coords, setCoords] = useState<{
        top: number;
        left: number;
        openUp: boolean;
    } | null>(null);

    useEffect(() => {
        if (!open) return;
        const handleGlobal = (e: MouseEvent) => {
            const target = e.target as Node;
            if (buttonRef.current && buttonRef.current.contains(target)) return;
            if (menuRef.current && menuRef.current.contains(target)) return;
            setOpen(false);
        };
        const handleScrollResize = () => setOpen(false);
        window.addEventListener('click', handleGlobal);
        window.addEventListener('scroll', handleScrollResize, true);
        window.addEventListener('resize', handleScrollResize);
        return () => {
            window.removeEventListener('click', handleGlobal);
            window.removeEventListener('scroll', handleScrollResize, true);
            window.removeEventListener('resize', handleScrollResize);
        };
    }, [open]);

    return (
        <div
            className={`relative inline-block text-left ${
                open ? 'z-[9999]' : ''
            }`}
        >
            <button
                ref={buttonRef}
                onClick={() => setOpen((v) => !v)}
                className='h-9 w-9 inline-flex items-center justify-center rounded-full border border-indigo-200 text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 shadow-sm'
                aria-label='Row actions'
            >
                <svg
                    className='w-5 h-5'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                >
                    <circle cx='12' cy='5' r='1.6' />
                    <circle cx='12' cy='12' r='1.6' />
                    <circle cx='12' cy='19' r='1.6' />
                </svg>
            </button>
            {open && (
                <div
                    ref={menuRef}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    className='absolute right-0 top-full mt-2 w-44 rounded-xl shadow-2xl bg-white border border-slate-200 ring-1 ring-black/5 focus:outline-none p-1 z-[100000] pointer-events-auto'
                >
                    <div className='py-2'>
                        <button
                            onClick={() => {
                                setOpen(false);
                                onConfigure();
                            }}
                            className='w-full px-4 py-2 text-left text-sm text-primary hover:bg-slate-50 flex items-center gap-3'
                        >
                            <svg
                                className='w-5 h-5 text-slate-600'
                                viewBox='0 0 24 24'
                                fill='none'
                                stroke='currentColor'
                            >
                                <path d='M4 13h16' strokeWidth='2' />
                                <path d='M12 3v18' strokeWidth='2' />
                            </svg>
                            Configure
                        </button>
                        <button
                            onClick={() => {
                                setOpen(false);
                                onDelete();
                            }}
                            className='w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3'
                        >
                            <svg
                                className='w-5 h-5 text-red-600'
                                viewBox='0 0 24 24'
                                fill='none'
                                stroke='currentColor'
                            >
                                <path d='M3 6h18' strokeWidth='2' />
                                <path
                                    d='M8 6v12a2 2 0 002 2h4a2 2 0 002-2V6'
                                    strokeWidth='2'
                                />
                                <path d='M10 11v6M14 11v6' strokeWidth='2' />
                            </svg>
                            Delete
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function InlineEntities({
    accountId,
    accountName,
    enterpriseId,
    enterpriseName,
    onCreated,
    onRequestDelete,
}: {
    accountId: string;
    accountName: string;
    enterpriseId: string;
    enterpriseName: string;
    onCreated: () => void;
    onRequestDelete: (entity: string) => void;
}) {
    // Advanced configuration constants
    type CategorySelections = Record<string, string[]>;
    const CATEGORY_OPTIONS: Record<string, string[]> = {
        plan: ['Jira', 'Azure DevOps', 'Trello', 'Asana', 'Other'],
        code: [
            'GitHub',
            'GitLab',
            'Azure Repos',
            'Bitbucket',
            'SonarQube',
            'Other',
        ],
        build: [
            'Jenkins',
            'GitHub Actions',
            'CircleCI',
            'AWS CodeBuild',
            'Google Cloud Build',
            'Azure DevOps',
            'Other',
        ],
        test: ['Cypress', 'Selenium', 'Jest', 'Tricentis Tosca', 'Other'],
        release: ['Argo CD', 'ServiceNow', 'Azure DevOps', 'Other'],
        deploy: [
            'Kubernetes',
            'Helm',
            'Terraform',
            'Ansible',
            'Docker',
            'AWS CodePipeline',
            'Other',
        ],
        others: ['Prometheus', 'Grafana', 'Slack', 'Other'],
    };
    const OPTION_ICON: Record<string, {name: string}> = {
        Jira: {name: 'jira'},
        GitHub: {name: 'github'},
        'GitHub Actions': {name: 'github'},
        GitLab: {name: 'gitlab'},
        'Azure Repos': {name: 'azure'},
        'Azure DevOps': {name: 'azdo'},
        Bitbucket: {name: 'bitbucket'},
        'AWS CodeBuild': {name: 'aws'},
        'Google Cloud Build': {name: 'cloudbuild'},
        'AWS CodePipeline': {name: 'codepipeline'},
        CircleCI: {name: 'circleci'},
        Cypress: {name: 'cypress'},
        Selenium: {name: 'selenium'},
        Jest: {name: 'jest'},
        'Argo CD': {name: 'argo'},
        ServiceNow: {name: 'slack'},
        Kubernetes: {name: 'kubernetes'},
        Helm: {name: 'helm'},
        Terraform: {name: 'terraform'},
        Ansible: {name: 'ansible'},
        Docker: {name: 'docker'},
        Prometheus: {name: 'prometheus'},
        Grafana: {name: 'grafana'},
        SonarQube: {name: 'sonarqube'},
        Slack: {name: 'slack'},
        Other: {name: 'maven'},
    };
    const CATEGORY_COLORS: Record<string, string> = {
        plan: '#6366F1',
        code: '#22C55E',
        build: '#F59E0B',
        test: '#06B6D4',
        release: '#EC4899',
        deploy: '#8B5CF6',
        others: '#64748B',
    };

    const [options, setOptions] = useState<string[]>([]);
    const [picked, setPicked] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(false);
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    // Advanced UI state
    const [configureEntity, setConfigureEntity] = useState<string | null>(null);
    const [selectionsByEntity, setSelectionsByEntity] = useState<
        Record<string, CategorySelections>
    >({});
    const [copyOpen, setCopyOpen] = useState(false);
    const [copyFrom, setCopyFrom] = useState<string>('');
    const [copyTargets, setCopyTargets] = useState<Record<string, boolean>>({});
    const [newEntity, setNewEntity] = useState('');
    const [savingEntity, setSavingEntity] = useState(false);
    const defaultKey = `gs_virtual_default_${accountId}_${enterpriseId}`;
    const [hasVirtualDefault, setHasVirtualDefault] = useState<boolean>(() => {
        try {
            return window.localStorage.getItem(defaultKey) === '1';
        } catch {
            return false;
        }
    });

    const loadEntities = async () => {
        setLoading(true);
        try {
            // First check if backend has BU settings via /api/business-units
            const buUrl = `/api/business-units?accountId=${encodeURIComponent(
                accountId,
            )}&enterpriseId=${encodeURIComponent(enterpriseId)}`;
            const buRows = await api.get<
                Array<{
                    id: number;
                    clientId: number;
                    enterpriseId: number;
                    entities: string;
                    creationDate: string;
                }>
            >(buUrl);
            const parsedFromBU: string[] = [];
            if (Array.isArray(buRows) && buRows.length > 0) {
                const addFromRaw = (rawIn: string) => {
                    const raw = String(rawIn || '').trim();
                    if (!raw) return;
                    if (raw.startsWith('{') && raw.endsWith('}')) {
                        const inner = raw.slice(1, -1);
                        inner
                            .split(',')
                            .map((s) => s.trim().replace(/^\"|\"$/g, ''))
                            .filter(Boolean)
                            .forEach((e) => parsedFromBU.push(e));
                    } else if (raw.startsWith('[')) {
                        try {
                            const arr = JSON.parse(raw);
                            if (Array.isArray(arr))
                                arr.forEach((e) =>
                                    parsedFromBU.push(String(e)),
                                );
                        } catch {}
                    } else if (raw) {
                        parsedFromBU.push(raw);
                    }
                };
                buRows.forEach((row: any) => addFromRaw(row.entities));
            }

            let list: string[] = parsedFromBU;
            if (list.length === 0) {
                // Fallback to derived entities endpoint used elsewhere
                const qs = new URLSearchParams(
                    Object.fromEntries(
                        Object.entries({
                            accountId,
                            enterpriseId,
                            enterpriseName,
                        }).filter(([, v]) => !!v),
                    ),
                ).toString();
                const ents = await api.get<string[]>(
                    `/api/business-units/entities?${qs}`,
                );
                list = Array.isArray(ents) ? ents : [];
            }

            // If empty first-time, add virtual Default and remember it
            if (list.length === 0) {
                list = ['Default'];
                const full: CategorySelections = {} as any;
                Object.entries(CATEGORY_OPTIONS).forEach(([cat, opts]) => {
                    (full as any)[cat] = [...opts];
                });
                setSelectionsByEntity({Default: full});
                setPicked({Default: true});
                setOptions(list);
                setHasVirtualDefault(true);
                try {
                    window.localStorage.setItem(defaultKey, '1');
                } catch {}
                return;
            }

            // If we previously showed Default, keep it alongside new entities
            if (hasVirtualDefault) {
                list = Array.from(new Set([...list, 'Default']));
            }

            // Deduplicate and sort for stable UI
            list = Array.from(new Set(list));
            setOptions(list);
            const init: Record<string, boolean> = {};
            list.forEach((e) => (init[e] = true));
            setPicked(init);
        } catch {
            setOptions([]);
            setPicked({});
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        loadEntities().catch(() => {});
    }, [accountId, enterpriseId, enterpriseName]);

    const toggle = (name: string) =>
        setPicked((p) => ({...p, [name]: !p[name]}));

    const toggleEntitySelection = (
        entity: string,
        category: string,
        option: string,
    ) => {
        setSelectionsByEntity((prev) => {
            const byEntity = {...prev};
            const current = byEntity[entity]?.[category] || [];
            const exists = current.includes(option);
            const next = exists
                ? current.filter((o) => o !== option)
                : [...current, option];
            byEntity[entity] = {
                ...(byEntity[entity] || {}),
                [category]: next,
            };
            return byEntity;
        });
    };

    // Hoverable summary pill for Pending/Configured state
    const SelectionPill = ({entity}: {entity: string}) => {
        const s = selectionsByEntity[entity] || {};
        const total = Object.values(s).reduce(
            (acc, arr) => acc + ((arr as unknown as string[])?.length || 0),
            0,
        );
        const entries = Object.entries(CATEGORY_OPTIONS).map(([cat]) => ({
            cat,
            count: ((s as any)[cat] || []).length,
        }));
        const sum = entries.reduce((a, b) => a + b.count, 0) || 1;
        const [open, setOpen] = useState(false);
        const [coords, setCoords] = useState<{
            top: number;
            left: number;
        } | null>(null);
        const closeTimer = useRef<number | null>(null);
        const clearCloseTimer = () => {
            if (closeTimer.current !== null) {
                window.clearTimeout(closeTimer.current);
                closeTimer.current = null;
            }
        };
        const scheduleClose = () => {
            clearCloseTimer();
            closeTimer.current = window.setTimeout(() => setOpen(false), 180);
        };
        const stateLabel = total === 0 ? 'Pending' : 'Configured';
        const stateClass =
            total === 0
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200';
        return (
            <>
                <span
                    onMouseEnter={(e) => {
                        clearCloseTimer();
                        const left = Math.min(
                            Math.max(12, e.clientX + 8),
                            window.innerWidth - 380,
                        );
                        const top = Math.min(
                            e.clientY + 12,
                            window.innerHeight - 220,
                        );
                        setCoords({top, left});
                        setOpen(true);
                    }}
                    onMouseLeave={scheduleClose}
                    onClick={(e) => {
                        const left = Math.min(
                            Math.max(12, e.clientX + 8),
                            window.innerWidth - 380,
                        );
                        const top = Math.min(
                            e.clientY + 12,
                            window.innerHeight - 220,
                        );
                        setCoords({top, left});
                        setOpen((v) => !v);
                    }}
                    onTouchStart={(e) => {
                        clearCloseTimer();
                        const touch = e.touches[0];
                        const left = Math.min(
                            Math.max(12, touch.clientX + 8),
                            window.innerWidth - 380,
                        );
                        const top = Math.min(
                            touch.clientY + 12,
                            window.innerHeight - 220,
                        );
                        setCoords({top, left});
                        setOpen(true);
                    }}
                    role='button'
                    aria-expanded={open}
                    className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full text-xs font-medium border ${stateClass} cursor-pointer`}
                >
                    <span>{stateLabel}</span>
                    <span className='inline-block h-1 w-1 rounded-full bg-slate-300'></span>
                    <span>{total} selected</span>
                    <button
                        type='button'
                        aria-label='View selections'
                        onClick={(e) => {
                            e.stopPropagation();
                            const left = Math.min(
                                Math.max(12, e.clientX + 8),
                                window.innerWidth - 380,
                            );
                            const top = Math.min(
                                e.clientY + 12,
                                window.innerHeight - 220,
                            );
                            setCoords({top, left});
                            setOpen(true);
                        }}
                        className='ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:text-indigo-600 hover:border-indigo-300'
                        title='View selections'
                    >
                        <svg
                            className='h-3.5 w-3.5'
                            viewBox='0 0 24 24'
                            fill='none'
                            stroke='currentColor'
                            strokeWidth='2'
                        >
                            <circle cx='12' cy='12' r='9' />
                            <path d='M12 8v.01M11 12h1v4h1' />
                        </svg>
                    </button>
                </span>
                {open &&
                    coords &&
                    createPortal(
                        <div
                            style={{
                                position: 'fixed',
                                top: coords.top,
                                left: coords.left,
                                zIndex: 10000,
                            }}
                            className='rounded-xl border border-slate-200 bg-white shadow-2xl p-4 w-auto min-w-[360px] max-w-[500px] whitespace-normal break-words'
                            onMouseEnter={clearCloseTimer}
                            onMouseLeave={scheduleClose}
                        >
                            <div className='mb-2 text-xs font-semibold text-secondary'>
                                Selections for {entity}
                            </div>
                            {total === 0 ? (
                                <div className='rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-sm leading-relaxed whitespace-normal break-words p-3'>
                                    No settings configured yet for {entity}.
                                    Click Configure to select tools per
                                    category.
                                </div>
                            ) : (
                                <>
                                    <div className='mb-3 h-2 w-full overflow-hidden rounded-full bg-slate-100'>
                                        <div className='flex h-full w-full'>
                                            {entries.map(({cat, count}) => {
                                                const width = `${Math.max(
                                                    0,
                                                    Math.round(
                                                        (count / sum) * 100,
                                                    ),
                                                )}%`;
                                                return (
                                                    <div
                                                        key={cat}
                                                        title={`${cat}: ${count}`}
                                                        style={{
                                                            width,
                                                            backgroundColor:
                                                                CATEGORY_COLORS[
                                                                    cat
                                                                ],
                                                        }}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div className='grid grid-cols-2 gap-3'>
                                        {Object.entries(CATEGORY_OPTIONS).map(
                                            ([cat]) => {
                                                const list =
                                                    (s as any)[cat] || [];
                                                return (
                                                    <div
                                                        key={cat}
                                                        className='rounded-lg border border-slate-200 p-2'
                                                    >
                                                        <div className='mb-1 flex items-center justify-between'>
                                                            <div className='text-xs font-semibold capitalize text-primary'>
                                                                {cat}
                                                            </div>
                                                            <div className='text-[10px] text-secondary'>
                                                                {list.length}
                                                            </div>
                                                        </div>
                                                        {list.length === 0 ? (
                                                            <div className='text-[11px] text-secondary'>
                                                                None
                                                            </div>
                                                        ) : (
                                                            <div className='flex flex-wrap gap-1'>
                                                                {list.map(
                                                                    (
                                                                        tool: string,
                                                                    ) => (
                                                                        <span
                                                                            key={
                                                                                tool
                                                                            }
                                                                            className='inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-primary'
                                                                        >
                                                                            <Icon
                                                                                name={
                                                                                    OPTION_ICON[
                                                                                        tool
                                                                                    ]
                                                                                        ?.name ||
                                                                                    'git'
                                                                                }
                                                                                size={
                                                                                    12
                                                                                }
                                                                            />
                                                                            {
                                                                                tool
                                                                            }
                                                                        </span>
                                                                    ),
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            },
                                        )}
                                    </div>
                                </>
                            )}
                        </div>,
                        document.body,
                    )}
            </>
        );
    };
    const save = async () => {
        const entities = Object.entries(picked)
            .filter(([, v]) => v)
            .map(([k]) => k);
        if (!accountId || !enterpriseName || entities.length === 0) return;
        await api.post('/api/global-settings', {
            accountId,
            accountName,
            enterpriseName,
            entities,
            categories: {
                plan: [],
                code: [],
                build: [],
                test: [],
                release: [],
                deploy: [],
                others: [],
            },
        });
        onCreated();
    };

    if (loading)
        return <div className='text-sm text-secondary'>Loading entities…</div>;
    if (options.length === 0)
        return (
            <div className='text-sm text-secondary'>
                No entities found for this selection.
            </div>
        );

    return (
        <>
            <div className='mb-3 flex items-center gap-2'>
                <input
                    value={newEntity}
                    onChange={(e) => setNewEntity(e.target.value)}
                    placeholder='Add entity (comma-separated for multiple)'
                    className='w-64 px-3 py-2 border border-light rounded-lg bg-card text-primary'
                />
                <button
                    disabled={savingEntity || !newEntity.trim()}
                    onClick={async () => {
                        if (!newEntity.trim()) return;
                        setSavingEntity(true);
                        try {
                            // Parse comma-separated list and normalize unique values
                            const toAdd = Array.from(
                                new Set(
                                    newEntity
                                        .split(',')
                                        .map((s) => s.trim())
                                        .filter(Boolean),
                                ),
                            );
                            if (toAdd.length === 0) return;

                            // Check existing BU row for this account & enterprise
                            const buUrl = `/api/business-units?accountId=${encodeURIComponent(
                                accountId,
                            )}&enterpriseId=${encodeURIComponent(
                                enterpriseId,
                            )}`;
                            const existing = await api.get<
                                Array<{
                                    id: number;
                                    entities: string;
                                }>
                            >(buUrl);

                            const formatEntities = (list: string[]) =>
                                `{${list
                                    .map((x) => `"${x.replace(/"/g, '\\"')}"`)
                                    .join(',')}}`;

                            if (
                                Array.isArray(existing) &&
                                existing.length > 0
                            ) {
                                const raw = String(
                                    existing[0].entities || '',
                                ).trim();
                                let current: string[] = [];
                                if (raw.startsWith('{') && raw.endsWith('}')) {
                                    const inner = raw.slice(1, -1);
                                    current = inner
                                        .split(',')
                                        .map((s) =>
                                            s.trim().replace(/^"|"$/g, ''),
                                        )
                                        .filter(Boolean);
                                } else if (raw.startsWith('[')) {
                                    try {
                                        const arr = JSON.parse(raw);
                                        if (Array.isArray(arr))
                                            current = arr.map((x) => String(x));
                                    } catch {}
                                } else if (raw) {
                                    current = [raw];
                                }
                                const merged = Array.from(
                                    new Set([...current, ...toAdd]),
                                );
                                const payload = {
                                    id: existing[0].id,
                                    clientId: Number(accountId) || accountId,
                                    enterpriseId:
                                        Number(enterpriseId) || enterpriseId,
                                    entities: formatEntities(merged),
                                } as any;
                                await api.put('/api/business-units', payload);
                            } else {
                                const payload = {
                                    clientId: Number(accountId) || accountId,
                                    enterpriseId:
                                        Number(enterpriseId) || enterpriseId,
                                    entities: formatEntities(toAdd),
                                } as any;
                                await api.post('/api/business-units', payload);
                            }
                            setNewEntity('');
                            await loadEntities();
                        } catch {
                        } finally {
                            setSavingEntity(false);
                        }
                    }}
                    className='inline-flex items-center px-3 py-2 rounded-lg bg-primary text-inverse hover:bg-primary-dark disabled:opacity-50'
                >
                    + Add Entity
                </button>
                {options.length > 1 && (
                    <button
                        onClick={() => {
                            if (options.length <= 1) return;
                            setCopyFrom(options[0]);
                            const targets: Record<string, boolean> = {};
                            (options || [])
                                .filter((x) => x !== options[0])
                                .forEach((x) => (targets[x] = true));
                            setCopyTargets(targets);
                            setCopyOpen(true);
                        }}
                        className='inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-inverse hover:bg-primary-dark shadow-sm'
                    >
                        <svg
                            className='w-4 h-4'
                            viewBox='0 0 24 24'
                            fill='none'
                            stroke='currentColor'
                            strokeWidth='1.8'
                        >
                            <rect x='9' y='9' width='11' height='11' rx='2' />
                            <rect x='4' y='4' width='11' height='11' rx='2' />
                        </svg>
                        Copy settings
                    </button>
                )}
            </div>
            <div className='rounded-md border border-slate-200 bg-white shadow-sm compact-table safari-tight'>
                <table className='min-w-full'>
                    <thead>
                        <tr className='bg-white'>
                            <th className='px-3 py-2 text-left text-[12px] font-semibold text-slate-700 border-b border-slate-200 hover:bg-slate-50'>
                                Account
                            </th>
                            <th className='px-3 py-2 text-left text-[12px] font-semibold text-slate-700 border-b border-slate-200 hover:bg-slate-50'>
                                Enterprise
                            </th>
                            <th className='px-3 py-2 text-left text-[12px] font-semibold text-slate-700 border-b border-slate-200 hover:bg-slate-50'>
                                Entity
                            </th>
                            <th className='px-3 py-2 text-left text-[12px] font-semibold text-slate-700 border-b border-slate-200 hover:bg-slate-50'>
                                Configuration
                            </th>
                            <th className='px-3 py-2 text-right text-[12px] font-semibold text-slate-700 border-b border-slate-200 hover:bg-slate-50'>
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className='divide-y divide-slate-200 text-[12px] text-slate-800'>
                        {options.map((e, idx) => (
                            <tr
                                key={e}
                                draggable
                                onDragStart={(ev) => {
                                    setDragIndex(idx);
                                    try {
                                        ev.dataTransfer.setData(
                                            'text/plain',
                                            String(idx),
                                        );
                                    } catch {}
                                    ev.dataTransfer.effectAllowed = 'move';
                                }}
                                onDragOver={(ev) => ev.preventDefault()}
                                onDrop={(ev) => {
                                    ev.preventDefault();
                                    const from = dragIndex;
                                    const to = idx;
                                    if (from === null || from === to) return;
                                    setOptions((prev) => {
                                        const next = prev.slice();
                                        const [moved] = next.splice(from, 1);
                                        next.splice(to, 0, moved);
                                        return next;
                                    });
                                    setDragIndex(null);
                                }}
                                className={`transition-all duration-200 row-hover-safe animate-row ${
                                    dragIndex === idx ? 'opacity-70' : ''
                                }`}
                                style={{
                                    animationDelay: `${idx * 40}ms`,
                                    cursor: 'move',
                                }}
                            >
                                <td className='px-3 py-2 whitespace-nowrap text-[12px] text-slate-800 border-r border-slate-200'>
                                    <span className='inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs text-sky-700'>
                                        {accountName}
                                    </span>
                                </td>
                                <td className='px-3 py-2 whitespace-nowrap text-[12px] text-slate-800 border-r border-slate-200'>
                                    <span className='inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs text-indigo-700'>
                                        {enterpriseName}
                                    </span>
                                </td>
                                <td className='px-3 py-2 whitespace-nowrap text-[12px] text-slate-800 border-r border-slate-200'>
                                    <span
                                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${getEntityChipClasses(
                                            e,
                                        )}`}
                                    >
                                        {e}
                                    </span>
                                </td>
                                <td className='px-3 py-2 whitespace-nowrap text-[12px] border-r border-slate-200'>
                                    <SelectionPill entity={e} />
                                </td>
                                <td className='px-3 py-2 whitespace-nowrap text-right text-[12px] actions-cell'>
                                    <RowActions
                                        onConfigure={() => {
                                            setPicked((p) => ({
                                                ...p,
                                                [e]: true,
                                            }));
                                            setSelectionsByEntity((prev) => ({
                                                ...prev,
                                                [e]: prev[e] || {},
                                            }));
                                            setConfigureEntity(e);
                                        }}
                                        onDelete={() => onRequestDelete(e)}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div
                    className='col-span-full flex items-center gap-2 px-3 py-2 text-[12px] text-slate-500 border-t border-dashed border-slate-300 cursor-pointer hover:text-slate-700'
                    onClick={() => {
                        const input = document.querySelector<HTMLInputElement>(
                            'input[placeholder="Add entity (comma-separated for multiple)"]',
                        );
                        input?.focus();
                    }}
                    title='Add new row'
                >
                    <svg
                        className='w-3.5 h-3.5'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                    >
                        <path d='M4 12h16M12 4v16' strokeWidth='2' />
                    </svg>
                    <span>Add new row</span>
                </div>
            </div>
            <div className='mx-6 mt-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-[12px] text-slate-700'>
                Tip: Configure one entity, then click &quot;Copy settings&quot;
                to replicate its selections to other entities.
            </div>
            {configureEntity && (
                <div className='fixed inset-0 z-50 flex items-end md:items-center justify-center p-4'>
                    <div className='absolute inset-0 bg-black/50 animate-modal-fade'></div>
                    <div className='relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-light overflow-hidden animate-modal-slide'>
                        <div className='px-6 py-4 border-b border-light flex items-center justify-between'>
                            <div>
                                <div className='text-sm text-secondary'>
                                    Configure entity
                                </div>
                                <h3 className='text-lg font-bold text-primary'>
                                    {configureEntity}
                                </h3>
                            </div>
                            <button
                                onClick={() => setConfigureEntity(null)}
                                className='h-10 w-10 inline-flex items-center justify-center rounded-full border border-light text-secondary hover:bg-slate-100'
                                aria-label='Close'
                            >
                                <svg
                                    className='w-5 h-5'
                                    viewBox='0 0 24 24'
                                    fill='none'
                                    stroke='currentColor'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth='2'
                                        d='M6 18L18 6M6 6l12 12'
                                    />
                                </svg>
                            </button>
                        </div>
                        <div className='p-6 space-y-6 max-h-[70vh] overflow-y-auto'>
                            <div className='rounded-2xl border border-slate-200 overflow-hidden bg-white'>
                                <table className='min-w-full divide-y divide-slate-100'>
                                    <thead className='bg-tertiary/40'>
                                        <tr>
                                            <th className='px-6 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider'>
                                                Category
                                            </th>
                                            <th className='px-6 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider'>
                                                Tools
                                            </th>
                                            <th className='px-6 py-3 text-right text-xs font-semibold text-secondary uppercase tracking-wider'>
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className='divide-y divide-slate-100'>
                                        {Object.entries(CATEGORY_OPTIONS).map(
                                            ([category, options]) => {
                                                const selected =
                                                    selectionsByEntity[
                                                        configureEntity || ''
                                                    ]?.[category] || [];
                                                const isSelected = (
                                                    opt: string,
                                                ) => selected.includes(opt);
                                                return (
                                                    <tr
                                                        key={category}
                                                        className='align-top'
                                                    >
                                                        <td className='px-6 py-4 whitespace-nowrap text-sm font-semibold capitalize text-primary'>
                                                            {category}
                                                        </td>
                                                        <td className='px-6 py-4'>
                                                            <div className='flex flex-wrap gap-3'>
                                                                {options.map(
                                                                    (opt) => {
                                                                        const active =
                                                                            isSelected(
                                                                                opt,
                                                                            );
                                                                        return (
                                                                            <button
                                                                                key={
                                                                                    opt
                                                                                }
                                                                                type='button'
                                                                                onClick={(
                                                                                    e,
                                                                                ) => {
                                                                                    const btn =
                                                                                        e.currentTarget;
                                                                                    const ripple =
                                                                                        document.createElement(
                                                                                            'span',
                                                                                        );
                                                                                    ripple.className =
                                                                                        'gs-ripple';
                                                                                    btn.appendChild(
                                                                                        ripple,
                                                                                    );
                                                                                    setTimeout(
                                                                                        () => {
                                                                                            try {
                                                                                                btn.removeChild(
                                                                                                    ripple,
                                                                                                );
                                                                                            } catch {}
                                                                                        },
                                                                                        560,
                                                                                    );
                                                                                    toggleEntitySelection(
                                                                                        configureEntity as string,
                                                                                        category,
                                                                                        opt,
                                                                                    );
                                                                                }}
                                                                                className={`relative inline-flex items-center gap-2 rounded-none border px-3 py-2 text-sm transition-colors duration-150 ${
                                                                                    active
                                                                                        ? 'bg-blue-50 text-primary border-blue-500'
                                                                                        : 'bg-white text-primary border-slate-300 hover:border-blue-400 hover:bg-blue-50/30'
                                                                                }`}
                                                                            >
                                                                                <div className='h-6 w-6 flex items-center justify-center'>
                                                                                    <Icon
                                                                                        name={
                                                                                            OPTION_ICON[
                                                                                                opt
                                                                                            ]
                                                                                                ?.name ||
                                                                                            'git'
                                                                                        }
                                                                                        size={
                                                                                            20
                                                                                        }
                                                                                        className='text-primary'
                                                                                    />
                                                                                </div>
                                                                                <span>
                                                                                    {
                                                                                        opt
                                                                                    }
                                                                                </span>
                                                                                {active && (
                                                                                    <svg
                                                                                        className='gs-corner-check-svg'
                                                                                        viewBox='0 0 24 24'
                                                                                        aria-hidden='true'
                                                                                    >
                                                                                        <polygon
                                                                                            points='24,0 24,24 8,0'
                                                                                            fill='#1d4ed8'
                                                                                        />
                                                                                        <path
                                                                                            d='M10 11 L13 14 L19 8'
                                                                                            fill='none'
                                                                                            stroke='white'
                                                                                            strokeWidth='2.6'
                                                                                            strokeLinecap='round'
                                                                                            strokeLinejoin='round'
                                                                                        />
                                                                                    </svg>
                                                                                )}
                                                                            </button>
                                                                        );
                                                                    },
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className='px-6 py-4 whitespace-nowrap text-right'>
                                                            <div className='inline-flex gap-2'>
                                                                <button
                                                                    className='inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-light bg-white hover:bg-slate-50'
                                                                    onClick={() => {
                                                                        options.forEach(
                                                                            (
                                                                                opt,
                                                                            ) => {
                                                                                if (
                                                                                    !isSelected(
                                                                                        opt,
                                                                                    )
                                                                                ) {
                                                                                    toggleEntitySelection(
                                                                                        configureEntity as string,
                                                                                        category,
                                                                                        opt,
                                                                                    );
                                                                                }
                                                                            },
                                                                        );
                                                                    }}
                                                                >
                                                                    <svg
                                                                        className='w-3.5 h-3.5'
                                                                        viewBox='0 0 24 24'
                                                                        fill='none'
                                                                        stroke='currentColor'
                                                                    >
                                                                        <path d='M4 4h16v4H4z' />
                                                                        <path d='M4 10h12v4H4z' />
                                                                        <path d='M4 16h8v4H4z' />
                                                                    </svg>
                                                                    Select All
                                                                </button>
                                                                <button
                                                                    className='inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-light bg-white hover:bg-slate-50'
                                                                    onClick={() => {
                                                                        options.forEach(
                                                                            (
                                                                                opt,
                                                                            ) => {
                                                                                if (
                                                                                    isSelected(
                                                                                        opt,
                                                                                    )
                                                                                ) {
                                                                                    toggleEntitySelection(
                                                                                        configureEntity as string,
                                                                                        category,
                                                                                        opt,
                                                                                    );
                                                                                }
                                                                            },
                                                                        );
                                                                    }}
                                                                >
                                                                    <svg
                                                                        className='w-3.5 h-3.5'
                                                                        viewBox='0 0 24 24'
                                                                        fill='none'
                                                                        stroke='currentColor'
                                                                    >
                                                                        <path d='M3 6h18' />
                                                                        <path d='M8 6l1-2h6l1 2' />
                                                                        <path d='M6 10v7a2 2 0 002 2h8a2 2 0 002-2v-7' />
                                                                        <path d='M10 12v5M14 12v5' />
                                                                    </svg>
                                                                    Clear
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            },
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className='px-6 py-4 border-t border-light flex items-center justify-end gap-3 bg-white'>
                            <button
                                onClick={() => setConfigureEntity(null)}
                                className='px-4 py-2 text-sm font-medium text-inverse bg-primary hover:bg-primary-dark rounded-lg transition-all duration-200'
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {copyOpen && (
                <div className='fixed inset-0 z-50 flex items-end md:items-center justify-center p-4'>
                    <div className='absolute inset-0 bg-black/50'></div>
                    <div className='relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-light overflow-hidden'>
                        <div className='px-6 py-4 border-b border-light'>
                            <h3 className='text-lg font-bold text-primary'>
                                Copy settings across entities
                            </h3>
                            <p className='text-sm text-secondary mt-1'>
                                Select a source entity and the target entities
                                to receive the same settings.
                            </p>
                        </div>
                        <div className='p-6 space-y-6'>
                            <div>
                                <label className='block text-sm font-semibold text-primary mb-2'>
                                    Source entity
                                </label>
                                <select
                                    value={copyFrom}
                                    onChange={(ev) =>
                                        setCopyFrom(ev.target.value)
                                    }
                                    className='block w-full px-3 py-2.5 border border-light rounded-lg bg-card text-primary'
                                >
                                    <option value=''>Select source</option>
                                    {options.map((name) => (
                                        <option key={name} value={name}>
                                            {name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className='block text-sm font-semibold text-primary mb-2'>
                                    Target entities
                                </label>
                                <div className='flex flex-wrap gap-3'>
                                    {options
                                        .filter((x) => x !== copyFrom)
                                        .map((name) => (
                                            <label
                                                key={name}
                                                className='inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-tertiary border-light text-primary'
                                            >
                                                <input
                                                    type='checkbox'
                                                    checked={
                                                        !!copyTargets[name]
                                                    }
                                                    onChange={(ev) =>
                                                        setCopyTargets((p) => ({
                                                            ...p,
                                                            [name]: ev.target
                                                                .checked,
                                                        }))
                                                    }
                                                />
                                                <span className='text-sm'>
                                                    {name}
                                                </span>
                                            </label>
                                        ))}
                                </div>
                            </div>
                        </div>
                        <div className='px-6 py-4 border-t border-light flex items-center justify-end gap-3 bg-white'>
                            <button
                                onClick={() => setCopyOpen(false)}
                                className='px-4 py-2 text-sm font-medium text-secondary bg-tertiary hover:bg-slate-200 rounded-lg'
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (!copyFrom) return;
                                    setSelectionsByEntity((prev) => {
                                        const src = prev[copyFrom] || {};
                                        const next = {...prev};
                                        Object.entries(copyTargets)
                                            .filter(([, v]) => v)
                                            .forEach(([target]) => {
                                                if (target === copyFrom) return;
                                                next[target] = JSON.parse(
                                                    JSON.stringify(src),
                                                );
                                            });
                                        return next;
                                    });
                                    setCopyOpen(false);
                                    setCopyTargets({});
                                }}
                                disabled={
                                    !copyFrom ||
                                    !Object.values(copyTargets).some(Boolean)
                                }
                                className='px-4 py-2 text-sm font-medium text-inverse bg-primary hover:bg-primary-dark disabled:opacity-50 rounded-lg'
                            >
                                Copy
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
