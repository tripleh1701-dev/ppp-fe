'use client';

import {useEffect, useMemo, useRef, useState} from 'react';
import {api} from '@/utils/api';
import ConfirmModal from '@/components/ConfirmModal';
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
    {id: 'acc-1001', accountName: 'Acme Corp'},
    {id: 'acc-1002', accountName: 'Globex Ltd'},
    {id: 'acc-1003', accountName: 'Initech'},
];

export default function GlobalSettingsPage() {
    const router = useRouter();
    const [items, setItems] = useState<GlobalSetting[]>([]);
    const [search, setSearch] = useState('');
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const data = await api.get<GlobalSetting[]>(
                    '/api/global-settings',
                );
                setItems(Array.isArray(data) ? data : []);
            } catch {
                setItems([]);
            }
        })();
    }, []);

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

    return (
        <div className='h-full bg-secondary flex flex-col'>
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
                    <button
                        onClick={() =>
                            router.push('/account-settings/global-settings/new')
                        }
                        className='inline-flex items-center px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-inverse bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200'
                    >
                        Create Global Settings
                    </button>
                </div>
            </div>

            <div className='bg-card border-b border-light px-6 py-4'>
                <div className='relative flex-1 max-w-md'>
                    <input
                        type='text'
                        placeholder='Search global settings...'
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className='block w-full px-3 py-2.5 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-brand bg-card text-primary placeholder-secondary'
                    />
                </div>
            </div>

            <div className='flex-1 p-6'>
                {filtered.length === 0 ? (
                    <div className='text-center py-16'>
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
                                    d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16'
                                />
                            </svg>
                        </div>
                        <h3 className='text-lg font-medium text-primary mb-1'>
                            No global settings yet
                        </h3>
                        <p className='text-secondary'>
                            Create your first global settings to get started.
                        </p>
                    </div>
                ) : (
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
                                    <th className='px-6 py-3 text-right text-xs font-semibold text-secondary uppercase tracking-wider'>
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-slate-100'>
                                {filtered.map((item) => (
                                    <tr
                                        key={item.id}
                                        className='transition-all duration-200 hover:bg-indigo-50/40 hover:shadow-[0_2px_12px_-6px_rgba(79,70,229,0.35)]'
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
                message={`Delete this global setting?\n\nThis action can’t be undone.`}
                onCancel={() => setPendingDeleteId(null)}
                onConfirm={async () => {
                    if (!pendingDeleteId) return;
                    await api.del(`/api/global-settings/${pendingDeleteId}`);
                    const data = await api.get<GlobalSetting[]>(
                        `/api/global-settings`,
                    );
                    setItems(Array.isArray(data) ? data : []);
                    setPendingDeleteId(null);
                }}
            />
        </div>
    );
}

function RowActions({
    onView,
    onEdit,
    onDelete,
}: {
    onView: () => void;
    onEdit: () => void;
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
        const el = buttonRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const menuHeight = 128; // approx
        const menuWidth = 160; // w-40
        const spaceBelow = window.innerHeight - rect.bottom;
        const openUp = spaceBelow < menuHeight + 12;
        const top = openUp
            ? Math.max(8, rect.top - menuHeight - 8)
            : rect.bottom + 8;
        const left = Math.max(
            8,
            Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8),
        );
        setCoords({top, left, openUp});

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
        <div className='relative inline-block text-left'>
            <button
                ref={buttonRef}
                onClick={() => setOpen((v) => !v)}
                className='h-10 w-10 inline-flex items-center justify-center rounded-full border border-indigo-200 text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 shadow-sm'
                aria-label='Actions'
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
                        d='M12 6.75a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0 7.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0 7.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z'
                    />
                </svg>
            </button>
            {open && coords && (
                <div
                    ref={menuRef}
                    style={{
                        position: 'fixed',
                        top: coords.top,
                        left: coords.left,
                        zIndex: 60,
                    }}
                    className='w-56 rounded-xl shadow-2xl bg-white border border-slate-200 ring-1 ring-black/5 focus:outline-none p-1'
                >
                    <div className='py-2'>
                        <button
                            onClick={() => {
                                setOpen(false);
                                onView();
                            }}
                            className='w-full px-4 py-2 text-left text-sm text-primary hover:bg-slate-50 flex items-center gap-3'
                        >
                            <svg
                                className='w-5 h-5 text-slate-600'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                                />
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                                />
                            </svg>
                            View
                        </button>
                        <button
                            onClick={() => {
                                setOpen(false);
                                onEdit();
                            }}
                            className='w-full px-4 py-2 text-left text-sm text-primary hover:bg-slate-50 flex items-center gap-3'
                        >
                            <svg
                                className='w-5 h-5 text-slate-600'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z'
                                />
                            </svg>
                            Edit
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
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m-7 0h10'
                                />
                            </svg>
                            Delete
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
