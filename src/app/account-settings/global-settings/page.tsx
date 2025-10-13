'use client';

import {useEffect, useMemo, useRef, useState, useCallback} from 'react';
import {createPortal} from 'react-dom';
import {api} from '@/utils/api';
import {Icon} from '@/components/Icons';
import ConfirmModal from '@/components/ConfirmModal';
import TrashButton from '@/components/TrashButton';
import SearchSelect from '@/components/SearchSelect';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {
    PlusIcon,
    MagnifyingGlassIcon,
    ArrowsUpDownIcon,
    EyeSlashIcon,
    RectangleStackIcon,
    BookmarkIcon,
} from '@heroicons/react/24/outline';
import GlobalSettingsTableV2, {
    GlobalSettingsRow,
} from '@/components/GlobalSettingsTableV2';

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
    {id: 'acc-1001', accountName: 'Systiva Corp'},
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
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    // Inline create panel state
    // HARDCODED TEST DATA - Set to true to show entities by default
    const [inlineOpen, setInlineOpen] = useState(true);
    const [accounts, setAccounts] = useState<
        Array<{id: string; accountName: string}>
    >([]);
    const [enterprises, setEnterprises] = useState<
        Array<{id: string; name: string}>
    >([]);
    // Load account and enterprise from breadcrumb selections
    const [accountId, setAccountId] = useState('');
    const [accountName, setAccountName] = useState('');
    const [enterpriseId, setEnterpriseId] = useState('');
    const [enterpriseName, setEnterpriseName] = useState('');
    const [entityOptions, setEntityOptions] = useState<string[]>([]);
    const [selectedEntities, setSelectedEntities] = useState<string[]>([]);
    const [entitiesLoading, setEntitiesLoading] = useState(false);

    // Load account and enterprise from localStorage and API
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
                setAccounts(accountsList);
                setEnterprises(enterprisesList);

                // Auto-open inline panel if account and enterprise are selected
                if (resolvedAccId && resolvedEntId) {
                    setInlineOpen(true);
                }
            } catch {
            } finally {
                setSelectionResolving(false);
            }
        })();
    }, []);

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
            <div className='bg-card border-b border-light px-3 py-2'>
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

            {/* Inline entity view uses account/enterprise from breadcrumb automatically */}
            <div className='mt-2 mb-2 px-3'>
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
                {items.length === 0 ? null : (
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
                                {items.map((item: GlobalSetting) => (
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
                                                {item.entities.map(
                                                    (
                                                        e: string,
                                                        idx: number,
                                                    ) => (
                                                        <span
                                                            key={idx}
                                                            className='inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border bg-blue-50 text-blue-700 border-blue-200'
                                                        >
                                                            {e}
                                                        </span>
                                                    ),
                                                )}
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
                                                onConfigure={() =>
                                                    router.push(
                                                        `/account-settings/global-settings/${item.id}`,
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
                    if (
                        !pendingDeleteId ||
                        !accountId ||
                        !accountName ||
                        !enterpriseId
                    )
                        return;
                    try {
                        console.log(`🗑️ Deleting entity: ${pendingDeleteId}`);

                        // Delete from DynamoDB
                        await api.del(
                            `/api/global-settings/${encodeURIComponent(
                                pendingDeleteId,
                            )}?accountId=${encodeURIComponent(
                                accountId,
                            )}&accountName=${encodeURIComponent(
                                accountName,
                            )}&enterpriseId=${encodeURIComponent(
                                enterpriseId,
                            )}`,
                        );

                        console.log('✅ Entity deleted successfully');

                        // Page will refresh automatically
                    } catch (error) {
                        console.error('❌ Error deleting entity:', error);
                        alert('Failed to delete entity. Please try again.');
                    }
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

    // Entities loaded from DynamoDB
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

    // Toolbar controls state
    type ColumnType = 'account' | 'enterprise' | 'entity' | 'configuration';
    const [showSearchBar, setShowSearchBar] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [appliedSearchTerm, setAppliedSearchTerm] = useState('');
    const [filterVisible, setFilterVisible] = useState(false);
    const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
    const [filterForm, setFilterForm] = useState({
        account: '',
        enterprise: '',
        entity: '',
        configuration: '',
    });
    const [sortOpen, setSortOpen] = useState(false);
    const [sortColumn, setSortColumn] = useState('');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | ''>('');
    const [hideOpen, setHideOpen] = useState(false);
    const [hideQuery, setHideQuery] = useState('');
    const [groupOpen, setGroupOpen] = useState(false);
    const [ActiveGroupLabel, setActiveGroupLabel] = useState<
        'None' | 'Account' | 'Enterprise' | 'Entity' | 'Configuration'
    >('None');
    const [visibleCols, setVisibleCols] = useState<ColumnType[]>([
        'account',
        'enterprise',
        'entity',
        'configuration',
    ]);

    // Track configured entities
    const [configuredEntities, setConfiguredEntities] = useState<Set<string>>(
        new Set(),
    );

    // Delete animation states
    const [compressingRowId, setCompressingRowId] = useState<string | null>(
        null,
    );
    const [foldingRowId, setFoldingRowId] = useState<string | null>(null);

    // Auto-save state
    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const [isAutoSaving, setIsAutoSaving] = useState(false);
    const [showAutoSaveSuccess, setShowAutoSaveSuccess] = useState(false);
    const [autoSaveCountdown, setAutoSaveCountdown] = useState<number | null>(
        null,
    );

    // Refs for dropdowns
    const searchRef = useRef<HTMLDivElement>(null);
    const filterRef = useRef<HTMLDivElement>(null);
    const sortRef = useRef<HTMLDivElement>(null);
    const hideRef = useRef<HTMLDivElement>(null);
    const groupRef = useRef<HTMLDivElement>(null);

    const allCols: ColumnType[] = [
        'account',
        'enterprise',
        'entity',
        'configuration',
    ];
    const columnLabels: Record<string, string> = {
        account: 'Account',
        enterprise: 'Enterprise',
        entity: 'Entity',
        configuration: 'Configuration',
    };

    const loadEntities = async () => {
        if (!accountId || !accountName || !enterpriseId) {
            console.log('⚠️ Missing account or enterprise info, skipping load');
            setOptions([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            console.log(
                `📋 Loading global settings entities for account: ${accountId}, enterprise: ${enterpriseId}`,
            );

            // Load entities from DynamoDB via the new API
            const entities = await api.get<
                Array<{
                    id: string;
                    accountId: string;
                    accountName: string;
                    enterpriseId: string;
                    enterpriseName: string;
                    entityName: string;
                    configuration: {
                        plan: string[];
                        code: string[];
                        build: string[];
                        test: string[];
                        release: string[];
                        deploy: string[];
                        others: string[];
                    };
                }>
            >(
                `/api/global-settings?accountId=${encodeURIComponent(
                    accountId,
                )}&accountName=${encodeURIComponent(
                    accountName,
                )}&enterpriseId=${encodeURIComponent(enterpriseId)}`,
            );

            console.log(`✅ Loaded ${entities.length} entities from DynamoDB`);

            if (!entities || entities.length === 0) {
                console.log('ℹ️ No entities found, showing empty state');
                setOptions([]);
                setPicked({});
                setSelectionsByEntity({});
                setLoading(false);
                return;
            }

            // Extract entity names and configurations
            const entityNames = entities.map((e) => e.entityName);
            const selections: Record<string, CategorySelections> = {};
            const picked: Record<string, boolean> = {};

            entities.forEach((entity) => {
                selections[entity.entityName] = entity.configuration;
                picked[entity.entityName] = true;
            });

            setOptions(entityNames);
            setPicked(picked);
            setSelectionsByEntity(selections);

            // Mark configured entities
            const configured = new Set<string>();
            entities.forEach((entity) => {
                const toolCount = Object.values(entity.configuration).reduce(
                    (sum, arr) => sum + arr.length,
                    0,
                );
                if (toolCount > 0) {
                    configured.add(entity.entityName);
                }
            });
            setConfiguredEntities(configured);
        } catch (error) {
            console.error('❌ Error loading entities:', error);
            setOptions([]);
            setPicked({});
            setSelectionsByEntity({});
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (accountId && enterpriseId) {
            loadEntities().catch(() => {});
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accountId, enterpriseId, enterpriseName]);

    // Toolbar handlers
    const closeAllDialogs = () => {
        setFilterVisible(false);
        setSortOpen(false);
        setHideOpen(false);
        setGroupOpen(false);
    };

    const toggleDialog = (dialog: 'filter' | 'sort' | 'hide' | 'group') => {
        closeAllDialogs();
        switch (dialog) {
            case 'filter':
                setFilterVisible(true);
                break;
            case 'sort':
                setSortOpen(true);
                break;
            case 'hide':
                setHideOpen(true);
                break;
            case 'group':
                setGroupOpen(true);
                break;
        }
    };

    const handleClearFilters = () => {
        setFilterForm({
            account: '',
            enterprise: '',
            entity: '',
            configuration: '',
        });
        setActiveFilters({});
    };

    const handleApplyFilters = () => {
        setActiveFilters({...filterForm});
        setFilterVisible(false);
    };

    const applySorting = (column: string, direction: 'asc' | 'desc') => {
        // Sort logic will be handled in the component
        setSortOpen(false);
    };

    const clearSorting = () => {
        setSortColumn('');
        setSortDirection('');
    };

    const setGroupByFromLabel = (label: string) => {
        setActiveGroupLabel(label as any);
        setGroupOpen(false);
    };

    // Row squeeze animation sequence for delete
    const startRowCompressionAnimation = async (entityName: string) => {
        console.log('🎬 Starting squeeze animation for entity:', entityName);
        const rowId = `entity-${entityName}`;

        // Step 1: Squeeze the row horizontally with animation
        setCompressingRowId(rowId);

        // Wait for squeeze animation
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Step 2: Fade out the row
        setFoldingRowId(rowId);
        setCompressingRowId(null);

        // Wait for fade animation
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Step 3: Show confirmation modal
        onRequestDelete(entityName);
        setFoldingRowId(null);
    };

    const handleSaveAll = async () => {
        if (
            isAutoSaving ||
            !accountId ||
            !accountName ||
            !enterpriseId ||
            !enterpriseName
        ) {
            console.log('⚠️ Missing account/enterprise info or already saving');
            return;
        }

        setIsAutoSaving(true);
        setAutoSaveCountdown(null);

        try {
            console.log('💾 Saving all entities to DynamoDB...');

            // Prepare entities for batch save
            const entitiesToSave = options.map((entityName) => ({
                entityName,
                configuration: selectionsByEntity[entityName] || {
                    plan: [],
                    code: [],
                    build: [],
                    test: [],
                    release: [],
                    deploy: [],
                    others: [],
                },
            }));

            // Call batch-save API
            await api.post('/api/global-settings/batch-save', {
                accountId,
                accountName,
                enterpriseId,
                enterpriseName,
                entities: entitiesToSave,
            });

            console.log('✅ All entities saved successfully');

            // Show success animation
            setShowAutoSaveSuccess(true);
            setTimeout(() => {
                setShowAutoSaveSuccess(false);
            }, 2000);

            // Reload entities to ensure consistency
            await loadEntities();
        } catch (error) {
            console.error('❌ Error saving:', error);
            alert('Failed to save entities. Please try again.');
        } finally {
            setIsAutoSaving(false);
        }
    };

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                searchRef.current &&
                !searchRef.current.contains(event.target as Node) &&
                filterRef.current &&
                !filterRef.current.contains(event.target as Node) &&
                sortRef.current &&
                !sortRef.current.contains(event.target as Node) &&
                hideRef.current &&
                !hideRef.current.contains(event.target as Node) &&
                groupRef.current &&
                !groupRef.current.contains(event.target as Node)
            ) {
                closeAllDialogs();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

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

    return (
        <>
            {/* Toolbar with all action buttons */}
            <div className='bg-card border-b border-light py-2'>
                <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                        {/* Create New Entity Button */}
                        <button
                            onClick={async () => {
                                if (
                                    !accountId ||
                                    !accountName ||
                                    !enterpriseId ||
                                    !enterpriseName
                                ) {
                                    alert(
                                        'Please select an account and enterprise first',
                                    );
                                    return;
                                }

                                const entityName = prompt('Enter entity name:');
                                if (!entityName || !entityName.trim()) return;

                                const trimmedName = entityName.trim();

                                // Check if entity already exists
                                if (options.includes(trimmedName)) {
                                    alert(
                                        'Entity with this name already exists',
                                    );
                                    return;
                                }

                                try {
                                    setLoading(true);
                                    console.log(
                                        `🆕 Creating new entity: ${trimmedName}`,
                                    );

                                    // Create entity in DynamoDB
                                    await api.post('/api/global-settings', {
                                        accountId,
                                        accountName,
                                        enterpriseId,
                                        enterpriseName,
                                        entityName: trimmedName,
                                        configuration: {
                                            plan: [],
                                            code: [],
                                            build: [],
                                            test: [],
                                            release: [],
                                            deploy: [],
                                            others: [],
                                        },
                                    });

                                    console.log(
                                        '✅ Entity created successfully',
                                    );

                                    // Reload entities to reflect the change
                                    await loadEntities();
                                } catch (error) {
                                    console.error(
                                        '❌ Error creating entity:',
                                        error,
                                    );
                                    alert(
                                        'Failed to create entity. Please try again.',
                                    );
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            disabled={loading}
                            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-md shadow-sm ${
                                loading
                                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                    : 'bg-primary-600 text-white hover:bg-primary-700'
                            }`}
                        >
                            {loading ? (
                                <div className='h-4 w-4 animate-spin'>
                                    <svg
                                        className='h-full w-full'
                                        fill='none'
                                        viewBox='0 0 24 24'
                                    >
                                        <circle
                                            className='opacity-25'
                                            cx='12'
                                            cy='12'
                                            r='10'
                                            stroke='currentColor'
                                            strokeWidth='4'
                                        />
                                        <path
                                            className='opacity-75'
                                            fill='currentColor'
                                            d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                                        />
                                    </svg>
                                </div>
                            ) : (
                                <PlusIcon className='h-4 w-4' />
                            )}
                            <span className='text-sm'>
                                {loading ? 'Loading...' : 'Create New Entity'}
                            </span>
                        </button>

                        {/* Search Input - Always Visible */}
                        <div ref={searchRef} className='flex items-center'>
                            <div className='relative w-60'>
                                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                                    <MagnifyingGlassIcon className='h-5 w-5 text-secondary' />
                                </div>
                                <input
                                    type='text'
                                    placeholder='Global Search'
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setAppliedSearchTerm(e.target.value);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            setAppliedSearchTerm(searchTerm);
                                        }
                                    }}
                                    className='search-placeholder block w-full pl-10 pr-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-sm'
                                    style={{fontSize: '14px'}}
                                />
                                {appliedSearchTerm && (
                                    <button
                                        onClick={() => {
                                            setSearchTerm('');
                                            setAppliedSearchTerm('');
                                        }}
                                        className='absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600'
                                        title='Clear search'
                                    >
                                        <svg
                                            className='h-4 w-4'
                                            fill='none'
                                            viewBox='0 0 24 24'
                                            stroke='currentColor'
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
                        </div>

                        {/* Filter Button */}
                        <div ref={filterRef} className='relative'>
                            <button
                                onClick={() =>
                                    filterVisible
                                        ? closeAllDialogs()
                                        : toggleDialog('filter')
                                }
                                className={`group relative flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-medium transition-all duration-300 transform hover:scale-105 ${
                                    filterVisible ||
                                    Object.keys(activeFilters).length > 0
                                        ? 'border-purple-300 bg-purple-50 text-purple-600 shadow-purple-200 shadow-lg'
                                        : 'border-blue-200 bg-white text-gray-600 hover:border-purple-200 hover:bg-purple-50 hover:text-purple-600 hover:shadow-lg'
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
                            </button>

                            {/* Filter Dropdown */}
                            {filterVisible && (
                                <div className='absolute top-full mt-2 left-0 bg-card text-primary shadow-xl border border-blue-200 rounded-lg z-50 min-w-80'>
                                    <div className='flex items-center justify-between px-3 py-1.5 border-b border-blue-200'>
                                        <div className='text-xs font-semibold'>
                                            Filters
                                        </div>
                                        <div className='flex items-center gap-2'>
                                            <button
                                                onClick={handleClearFilters}
                                                className='text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 transition-colors'
                                            >
                                                Clear All
                                            </button>
                                            <button
                                                onClick={handleApplyFilters}
                                                className='text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 transition-colors'
                                            >
                                                Apply
                                            </button>
                                        </div>
                                    </div>
                                    <div className='p-2'>
                                        <div className='space-y-2'>
                                            {/* Account Filter */}
                                            <div>
                                                <label className='block text-xs font-medium text-gray-700 mb-1'>
                                                    Account
                                                </label>
                                                <div className='relative'>
                                                    <input
                                                        type='text'
                                                        value={
                                                            filterForm.account
                                                        }
                                                        onChange={(e) =>
                                                            setFilterForm({
                                                                ...filterForm,
                                                                account:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        }
                                                        className='w-full pl-2 pr-8 py-1 text-sm border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded bg-white'
                                                    />
                                                </div>
                                            </div>

                                            {/* Enterprise Filter */}
                                            <div>
                                                <label className='block text-xs font-medium text-gray-700 mb-1'>
                                                    Enterprise
                                                </label>
                                                <div className='relative'>
                                                    <input
                                                        type='text'
                                                        value={
                                                            filterForm.enterprise
                                                        }
                                                        onChange={(e) =>
                                                            setFilterForm({
                                                                ...filterForm,
                                                                enterprise:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        }
                                                        className='w-full pl-2 pr-8 py-1 text-sm border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded bg-white'
                                                    />
                                                </div>
                                            </div>

                                            {/* Entity Filter */}
                                            <div>
                                                <label className='block text-xs font-medium text-gray-700 mb-1'>
                                                    Entity
                                                </label>
                                                <div className='relative'>
                                                    <input
                                                        type='text'
                                                        value={
                                                            filterForm.entity
                                                        }
                                                        onChange={(e) =>
                                                            setFilterForm({
                                                                ...filterForm,
                                                                entity: e.target
                                                                    .value,
                                                            })
                                                        }
                                                        className='w-full pl-2 pr-8 py-1 text-sm border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded bg-white'
                                                    />
                                                </div>
                                            </div>

                                            {/* Configuration Filter */}
                                            <div>
                                                <label className='block text-xs font-medium text-gray-700 mb-1'>
                                                    Configuration
                                                </label>
                                                <div className='relative'>
                                                    <input
                                                        type='text'
                                                        value={
                                                            filterForm.configuration
                                                        }
                                                        onChange={(e) =>
                                                            setFilterForm({
                                                                ...filterForm,
                                                                configuration:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        }
                                                        className='w-full pl-2 pr-8 py-1 text-sm border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded bg-white'
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sort Button */}
                        <div ref={sortRef} className='relative'>
                            <button
                                className={`group relative flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-medium transition-all duration-300 transform hover:scale-105 ${
                                    sortOpen ||
                                    (sortColumn &&
                                        sortDirection &&
                                        (sortDirection === 'asc' ||
                                            sortDirection === 'desc'))
                                        ? 'border-green-300 bg-green-50 text-green-600 shadow-green-200 shadow-lg'
                                        : 'border-blue-200 bg-white text-gray-600 hover:border-green-200 hover:bg-green-50 hover:text-green-600 hover:shadow-lg'
                                }`}
                                title='Sort'
                                onClick={() =>
                                    sortOpen
                                        ? closeAllDialogs()
                                        : toggleDialog('sort')
                                }
                            >
                                <ArrowsUpDownIcon
                                    className={`h-4 w-4 transition-transform duration-300 ${
                                        sortOpen
                                            ? 'rotate-180'
                                            : 'group-hover:rotate-180'
                                    }`}
                                />
                                <span className='text-sm'>Sort</span>
                                {sortColumn &&
                                    sortDirection &&
                                    (sortDirection === 'asc' ||
                                        sortDirection === 'desc') && (
                                        <div className='absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-bounce'></div>
                                    )}
                                <div className='absolute inset-0 rounded-lg bg-gradient-to-r from-green-400 to-blue-400 opacity-0 group-hover:opacity-10 transition-opacity duration-300 -z-10'></div>
                            </button>
                            {sortOpen && (
                                <div className='absolute left-0 top-full z-50 mt-2 w-[260px] rounded-lg bg-card text-primary shadow-xl border border-blue-200'>
                                    <div className='flex items-center justify-between px-3 py-2 border-b border-blue-200'>
                                        <div className='text-xs font-semibold'>
                                            Sort
                                        </div>
                                        {sortColumn && (
                                            <button
                                                onClick={clearSorting}
                                                className='text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 transition-colors'
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                    <div className='p-3'>
                                        <div className='space-y-3'>
                                            {/* Column Selection */}
                                            <div>
                                                <label className='block text-xs font-medium text-gray-700 mb-1'>
                                                    Column
                                                </label>
                                                <div className='relative'>
                                                    <select
                                                        value={sortColumn}
                                                        onChange={(e) => {
                                                            const newColumn =
                                                                e.target.value;
                                                            setSortColumn(
                                                                newColumn,
                                                            );
                                                        }}
                                                        className='w-full pl-2 pr-8 py-1.5 text-sm border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded bg-white'
                                                    >
                                                        <option value=''>
                                                            Select column...
                                                        </option>
                                                        {allCols.map((col) => (
                                                            <option
                                                                key={col}
                                                                value={col}
                                                            >
                                                                {
                                                                    columnLabels[
                                                                        col
                                                                    ]
                                                                }
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Direction Selection */}
                                            <div>
                                                <label className='block text-xs font-medium text-gray-700 mb-1'>
                                                    Direction
                                                </label>
                                                <div className='relative'>
                                                    <select
                                                        value={sortDirection}
                                                        onChange={(e) => {
                                                            const newDirection =
                                                                e.target
                                                                    .value as
                                                                    | 'asc'
                                                                    | 'desc'
                                                                    | '';
                                                            setSortDirection(
                                                                newDirection,
                                                            );
                                                            if (
                                                                sortColumn &&
                                                                (newDirection ===
                                                                    'asc' ||
                                                                    newDirection ===
                                                                        'desc')
                                                            ) {
                                                                applySorting(
                                                                    sortColumn,
                                                                    newDirection,
                                                                );
                                                            }
                                                        }}
                                                        className='w-full pl-2 pr-8 py-1.5 text-sm border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded bg-white'
                                                    >
                                                        <option value=''>
                                                            Select direction...
                                                        </option>
                                                        <option value='asc'>
                                                            Ascending
                                                        </option>
                                                        <option value='desc'>
                                                            Descending
                                                        </option>
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Current Sort Display */}
                                            {sortColumn &&
                                                sortDirection &&
                                                (sortDirection === 'asc' ||
                                                    sortDirection ===
                                                        'desc') && (
                                                    <div className='mt-1 p-2 bg-blue-50 rounded border text-xs'>
                                                        <span className='font-medium text-blue-800'>
                                                            {
                                                                columnLabels[
                                                                    sortColumn
                                                                ]
                                                            }{' '}
                                                            (
                                                            {sortDirection ===
                                                            'asc'
                                                                ? 'Asc'
                                                                : 'Desc'}
                                                            )
                                                        </span>
                                                    </div>
                                                )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Hide Columns Button */}
                        <div ref={hideRef} className='relative'>
                            <button
                                className={`group relative flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-medium transition-all duration-300 transform hover:scale-105 ${
                                    hideOpen ||
                                    visibleCols.length < allCols.length
                                        ? 'border-red-300 bg-red-50 text-red-600 shadow-red-200 shadow-lg'
                                        : 'border-blue-200 bg-white text-gray-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600 hover:shadow-lg'
                                }`}
                                onClick={() =>
                                    hideOpen
                                        ? closeAllDialogs()
                                        : toggleDialog('hide')
                                }
                            >
                                <EyeSlashIcon className='h-4 w-4 transition-transform duration-300 group-hover:scale-110' />
                                <span className='text-sm'>Show/Hide</span>
                                {visibleCols.length < allCols.length && (
                                    <div className='absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-bounce'></div>
                                )}
                            </button>
                            {hideOpen && (
                                <div className='absolute left-0 top-full z-50 mt-2 w-[280px] rounded-lg bg-card text-primary shadow-xl border border-blue-200'>
                                    <div className='flex items-center justify-between px-3 py-2 border-b border-blue-200'>
                                        <div className='text-xs font-semibold'>
                                            Displayed Columns
                                        </div>
                                    </div>
                                    <div className='p-3'>
                                        <div className='space-y-3'>
                                            <div>
                                                <div className='relative'>
                                                    <input
                                                        value={hideQuery}
                                                        onChange={(e) =>
                                                            setHideQuery(
                                                                e.target.value,
                                                            )
                                                        }
                                                        className='w-full pl-2 pr-8 py-1.5 text-sm border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded bg-white'
                                                        placeholder='Search columns...'
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Columns List */}
                                        <div className='max-h-40 overflow-auto divide-y divide-light'>
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
                                                        className='flex items-center justify-between py-1.5'
                                                    >
                                                        <span className='text-sm capitalize'>
                                                            {columnLabels[c]}
                                                        </span>
                                                        <input
                                                            type='checkbox'
                                                            checked={visibleCols.includes(
                                                                c as ColumnType,
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
                                                                                        c as ColumnType,
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

                        {/* Group By Button */}
                        <div
                            ref={groupRef}
                            className='relative flex items-center'
                        >
                            <button
                                className={`group relative flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-medium transition-all duration-300 transform hover:scale-105 ${
                                    groupOpen || ActiveGroupLabel !== 'None'
                                        ? 'border-orange-300 bg-orange-50 text-orange-600 shadow-orange-200 shadow-lg'
                                        : 'border-blue-200 bg-white text-gray-600 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 hover:shadow-lg'
                                }`}
                                onClick={() =>
                                    groupOpen
                                        ? closeAllDialogs()
                                        : toggleDialog('group')
                                }
                            >
                                <RectangleStackIcon className='h-4 w-4 transition-transform duration-300 group-hover:scale-110' />
                                <span className='text-sm'>Group by</span>
                                {ActiveGroupLabel !== 'None' && (
                                    <div className='absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-bounce'></div>
                                )}
                            </button>
                            {groupOpen && (
                                <div className='absolute left-0 top-full z-50 mt-2 w-[240px] rounded-lg bg-card text-primary shadow-xl border border-blue-200'>
                                    <div className='flex items-center justify-between px-3 py-2 border-b border-blue-200'>
                                        <div className='text-xs font-semibold'>
                                            Group by
                                        </div>
                                    </div>
                                    <div className='p-3'>
                                        <div className='space-y-3'>
                                            <div>
                                                <div className='relative'>
                                                    <select
                                                        value={ActiveGroupLabel}
                                                        onChange={(e) =>
                                                            setGroupByFromLabel(
                                                                e.target.value,
                                                            )
                                                        }
                                                        className='w-full pl-2 pr-8 py-1.5 text-sm border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded bg-white'
                                                    >
                                                        <option>None</option>
                                                        <option>Account</option>
                                                        <option>
                                                            Enterprise
                                                        </option>
                                                        <option>Entity</option>
                                                        <option>
                                                            Configuration
                                                        </option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Save Button */}
                        <button
                            onClick={handleSaveAll}
                            disabled={loading || isAutoSaving}
                            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-md shadow-sm transition-all duration-300 relative overflow-hidden ${
                                loading || isAutoSaving
                                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                    : showAutoSaveSuccess
                                    ? 'bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 text-white shadow-lg animate-pulse'
                                    : autoSaveCountdown
                                    ? 'bg-gradient-to-r from-blue-300 to-blue-500 text-white shadow-md'
                                    : 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-md'
                            }`}
                            title={
                                isAutoSaving
                                    ? 'Auto-saving...'
                                    : autoSaveCountdown
                                    ? `Auto-saving in ${autoSaveCountdown}s`
                                    : 'Save all unsaved entries'
                            }
                        >
                            {/* Progress bar animation for auto-save countdown */}
                            {autoSaveCountdown && (
                                <div className='absolute inset-0 bg-blue-200/30 rounded-md overflow-hidden'>
                                    <div
                                        className='h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-1000 ease-linear'
                                        style={{
                                            width: autoSaveCountdown
                                                ? `${
                                                      ((10 -
                                                          autoSaveCountdown) /
                                                          10) *
                                                      100
                                                  }%`
                                                : '0%',
                                        }}
                                    ></div>
                                </div>
                            )}

                            {/* Auto-save success wave animation */}
                            {showAutoSaveSuccess && (
                                <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-ping'></div>
                            )}

                            {isAutoSaving ? (
                                <div className='h-4 w-4 animate-spin'>
                                    <svg
                                        className='h-full w-full'
                                        fill='none'
                                        viewBox='0 0 24 24'
                                    >
                                        <circle
                                            className='opacity-25'
                                            cx='12'
                                            cy='12'
                                            r='10'
                                            stroke='currentColor'
                                            strokeWidth='4'
                                        />
                                        <path
                                            className='opacity-75'
                                            fill='currentColor'
                                            d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                                        />
                                    </svg>
                                </div>
                            ) : (
                                <BookmarkIcon className='h-4 w-4 relative z-10' />
                            )}
                            <span className='text-sm relative z-10'>
                                {isAutoSaving
                                    ? 'Auto-saving...'
                                    : autoSaveCountdown
                                    ? `Save (${autoSaveCountdown}s)`
                                    : 'Save'}
                            </span>
                        </button>

                        {/* Copy Settings Button */}
                        {options.length > 1 && (
                            <button
                                onClick={() => {
                                    if (options.length <= 1) return;
                                    setCopyFrom(options[0]);
                                    const targets: Record<string, boolean> = {};
                                    options
                                        .filter((x) => x !== options[0])
                                        .forEach((x) => (targets[x] = true));
                                    setCopyTargets(targets);
                                    setCopyOpen(true);
                                }}
                                className='inline-flex items-center gap-2 px-3 py-2 rounded-md shadow-sm bg-white hover:bg-slate-50 border border-slate-300 hover:border-blue-400 text-slate-700 hover:text-blue-700 transition-all duration-200'
                            >
                                <svg
                                    className='w-4 h-4'
                                    viewBox='0 0 24 24'
                                    fill='none'
                                    stroke='currentColor'
                                    strokeWidth='1.8'
                                >
                                    <rect
                                        x='9'
                                        y='9'
                                        width='11'
                                        height='11'
                                        rx='2'
                                    />
                                    <rect
                                        x='4'
                                        y='4'
                                        width='11'
                                        height='11'
                                        rx='2'
                                    />
                                </svg>
                                <span className='text-sm'>Copy settings</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
            <div className='flex-1 overflow-auto'>
                {options.length === 0 ? (
                    <div className='flex flex-col items-center justify-center py-16 px-4'>
                        <div className='w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4'>
                            <svg
                                className='w-8 h-8 text-blue-500'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4'
                                />
                            </svg>
                        </div>
                        <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                            No entities yet
                        </h3>
                        <p className='text-sm text-gray-600 text-center max-w-md mb-4'>
                            Get started by creating your first entity. Entities
                            help you organize and configure tools for different
                            departments or business units.
                        </p>
                        <button
                            onClick={async () => {
                                if (
                                    !accountId ||
                                    !accountName ||
                                    !enterpriseId ||
                                    !enterpriseName
                                ) {
                                    alert(
                                        'Please select an account and enterprise first',
                                    );
                                    return;
                                }

                                const entityName = prompt('Enter entity name:');
                                if (!entityName || !entityName.trim()) return;

                                const trimmedName = entityName.trim();

                                try {
                                    setLoading(true);
                                    console.log(
                                        `🆕 Creating new entity: ${trimmedName}`,
                                    );

                                    await api.post('/api/global-settings', {
                                        accountId,
                                        accountName,
                                        enterpriseId,
                                        enterpriseName,
                                        entityName: trimmedName,
                                        configuration: {
                                            plan: [],
                                            code: [],
                                            build: [],
                                            test: [],
                                            release: [],
                                            deploy: [],
                                            others: [],
                                        },
                                    });

                                    console.log(
                                        '✅ Entity created successfully',
                                    );
                                    await loadEntities();
                                } catch (error) {
                                    console.error(
                                        '❌ Error creating entity:',
                                        error,
                                    );
                                    alert(
                                        'Failed to create entity. Please try again.',
                                    );
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            className='inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
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
                                    d='M12 4v16m8-8H4'
                                />
                            </svg>
                            Create Your First Entity
                        </button>
                    </div>
                ) : (
                    <GlobalSettingsTableV2
                        rows={options.map((entity) => {
                            const entitySelections =
                                selectionsByEntity[entity] || {};
                            const toolCount = Object.values(
                                entitySelections,
                            ).reduce(
                                (sum: number, arr: string[]) =>
                                    sum + arr.length,
                                0,
                            );
                            const isConfigured =
                                toolCount > 0 || configuredEntities.has(entity);
                            return {
                                id: `entity-${entity}`,
                                account: accountName,
                                enterprise: enterpriseName,
                                entity,
                                configuration:
                                    toolCount > 0
                                        ? `${toolCount} tools selected`
                                        : 'Not configured',
                                configurationDetails: entitySelections,
                                isConfigured,
                            };
                        })}
                        onEdit={(rowId: string) => {
                            const entity = options.find(
                                (e) => `entity-${e}` === rowId,
                            );
                            if (entity) {
                                setPicked((p) => ({
                                    ...p,
                                    [entity]: true,
                                }));
                                setSelectionsByEntity((prev) => ({
                                    ...prev,
                                    [entity]: prev[entity] || {},
                                }));
                                setConfigureEntity(entity);
                            }
                        }}
                        onDelete={(rowId: string) => {
                            const entity = options.find(
                                (e) => `entity-${e}` === rowId,
                            );
                            if (entity) {
                                startRowCompressionAnimation(entity);
                            }
                        }}
                        visibleColumns={visibleCols as any}
                        hideRowExpansion={true}
                        enableInlineEditing={false}
                        externalSortColumn={sortColumn}
                        externalSortDirection={
                            sortDirection as 'asc' | 'desc' | ''
                        }
                        compressingRowId={compressingRowId}
                        foldingRowId={foldingRowId}
                    />
                )}
            </div>
            <div className='mt-2 rounded-md border border-blue-200 bg-blue-50 p-2 text-[12px] text-blue-700'>
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
                                                                        const Active =
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
                                                                                    Active
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
                                                                                {Active && (
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
                                onClick={() => {
                                    if (configureEntity) {
                                        setConfiguredEntities((prev) =>
                                            new Set(prev).add(configureEntity),
                                        );
                                    }
                                    setConfigureEntity(null);
                                }}
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
