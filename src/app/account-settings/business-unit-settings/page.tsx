'use client';

import {useEffect, useMemo, useRef, useState} from 'react';
import ConfirmModal from '@/components/ConfirmModal';
import {
    PlusIcon,
    MagnifyingGlassIcon,
    ArrowsUpDownIcon,
    EyeSlashIcon,
    RectangleStackIcon,
    EllipsisVerticalIcon,
    EyeIcon,
    PencilSquareIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';
import {api} from '@/utils/api';

interface BUSetting {
    id: string;
    accountId: string;
    accountName: string;
    enterpriseId?: string;
    enterpriseName: string;
    entities: string[];
}

interface AccountMinimal {
    id: string;
    accountName: string;
}

interface EnterpriseMinimal {
    id: string;
    name: string;
}

export default function BusinessUnitSettingsPage() {
    const [items, setItems] = useState<BUSetting[]>([]);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<BUSetting | null>(null);
    const [viewing, setViewing] = useState<BUSetting | null>(null);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

    // For dropdown options
    const [accounts, setAccounts] = useState<AccountMinimal[]>([]);
    const [enterprises, setEnterprises] = useState<EnterpriseMinimal[]>([]);

    // Toolbar interactivity (match Accounts/Enterprise UX)
    const [sortOpen, setSortOpen] = useState(false);
    const [hideOpen, setHideOpen] = useState(false);
    const [groupOpen, setGroupOpen] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const sortRef = useRef<HTMLDivElement>(null);
    const hideRef = useRef<HTMLDivElement>(null);
    const groupRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const [visibleCols, setVisibleCols] = useState<
        Array<'enterprise' | 'account' | 'entities' | 'actions'>
    >(['enterprise', 'account', 'entities', 'actions']);
    const [hideQuery, setHideQuery] = useState('');
    const [activeGroup, setActiveGroup] = useState<
        'None' | 'Enterprise' | 'Account'
    >('None');

    const loadAll = async () => {
        const [bus, acc, ent] = await Promise.all([
            api.get<BUSetting[]>('/api/business-units'),
            api.get<AccountMinimal[]>('/api/accounts'),
            api.get<EnterpriseMinimal[]>('/api/enterprises'),
        ]);
        setItems(bus);
        setAccounts(acc);
        setEnterprises(ent);
    };

    useEffect(() => {
        loadAll().catch(() => {});
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

    const handleSave = async (data: Omit<BUSetting, 'id'>, id?: string) => {
        if (id) {
            await api.put<BUSetting>('/api/business-units', {...data, id});
        } else {
            await api.post<BUSetting>('/api/business-units', data);
        }
        await loadAll();
        setShowForm(false);
        setEditing(null);
    };

    const handleDelete = (id: string) => {
        setPendingDeleteId(id);
    };

    return (
        <div className='h-full bg-secondary flex flex-col'>
            <div className='bg-card border-b border-light px-6 py-4'>
                <div className='flex items-center justify-between'>
                    <div>
                        <h1 className='text-xl font-bold text-primary'>
                            Business Unit Settings
                        </h1>
                        <p className='text-sm text-secondary mt-1'>
                            Create and manage business unit configurations
                        </p>
                    </div>
                </div>
            </div>

            <div className='bg-card border-b border-light px-6 py-4'>
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
                                <MagnifyingGlassIcon className='h-4 w-4' />
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
                                    placeholder='Search BU settings...'
                                    className='w-64 pr-7 px-3 py-2 text-sm rounded-md border border-light bg-white text-slate-700 placeholder-slate-400 shadow-sm'
                                />
                            </div>
                        </div>
                        {/* Filter placeholder */}
                        <button className='inline-flex items-center gap-2 px-2 py-2 rounded text-slate-600 hover:text-slate-900'>
                            <span className='text-sm'>Filter</span>
                        </button>
                        {/* Anchored Sort/Hide/Group */}
                        <div className='flex items-center gap-3 ml-2'>
                            <div ref={sortRef} className='relative'>
                                <button
                                    className='relative inline-flex items-center gap-2 px-2 py-2 rounded text-slate-600 hover:text-slate-900'
                                    title='Sort'
                                    onClick={() => setSortOpen((v) => !v)}
                                >
                                    <ArrowsUpDownIcon className='h-4 w-4' />
                                    <span className='text-sm'>Sort</span>
                                </button>
                                {sortOpen && (
                                    <div className='absolute left-0 top-full z-50 mt-2 w-[320px] rounded-lg bg-card text-primary shadow-xl border border-light'>
                                        <div className='px-4 py-2.5 border-b border-light text-sm font-semibold'>
                                            Sort by
                                        </div>
                                        <div className='p-3 space-y-2'>
                                            <div className='text-xs text-secondary'>
                                                Sorting is not applied yet (UI
                                                only)
                                            </div>
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
                                </button>
                                {hideOpen && (
                                    <div className='absolute left-0 top-full z-50 mt-2 w-[320px] rounded-lg bg-card text-primary shadow-xl border border-light'>
                                        <div className='flex items-center justify-between px-4 py-2.5 border-b border-light'>
                                            <div className='text-sm font-semibold'>
                                                Hide columns
                                            </div>
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
                                                {(
                                                    [
                                                        'enterprise',
                                                        'account',
                                                        'entities',
                                                        'actions',
                                                    ] as const
                                                )
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
                                                                {c ===
                                                                'entities'
                                                                    ? 'Entities'
                                                                    : c}
                                                            </span>
                                                            <input
                                                                type='checkbox'
                                                                checked={visibleCols.includes(
                                                                    c,
                                                                )}
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    const checked =
                                                                        e.target
                                                                            .checked;
                                                                    setVisibleCols(
                                                                        (
                                                                            prev,
                                                                        ) => {
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
                            <div ref={groupRef} className='relative'>
                                <button
                                    className='relative inline-flex items-center gap-2 px-2 py-2 rounded text-slate-600 hover:text-slate-900'
                                    onClick={() => setGroupOpen((v) => !v)}
                                >
                                    <RectangleStackIcon className='h-4 w-4' />
                                    <span className='text-sm'>Group by</span>
                                </button>
                                {groupOpen && (
                                    <div className='absolute left-0 top-full z-50 mt-2 w-[320px] rounded-lg bg-card text-primary shadow-xl border border-light'>
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
                    </div>
                    <button
                        onClick={() => {
                            setEditing(null);
                            setShowForm(true);
                        }}
                        className='inline-flex items-center ml-3 px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-inverse bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200'
                    >
                        <PlusIcon className='h-5 w-5 mr-2' />
                        Create New BU Settings
                    </button>
                </div>
            </div>

            <div className='flex-1 p-6'>
                {filtered.length === 0 ? (
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
                                    d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16'
                                />
                            </svg>
                        </div>
                        <h3 className='text-lg font-medium text-primary mb-2'>
                            No business unit settings yet
                        </h3>
                        <p className='text-secondary'>
                            Create your first BU settings to get started.
                        </p>
                    </div>
                ) : (
                    <div className='overflow-x-auto bg-white border border-slate-200 rounded-2xl shadow-sm'>
                        <table className='min-w-full divide-y divide-slate-100'>
                            <thead className='bg-tertiary/40'>
                                <tr>
                                    {visibleCols.includes('enterprise') && (
                                        <th className='px-6 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider'>
                                            Enterprise
                                        </th>
                                    )}
                                    {visibleCols.includes('account') && (
                                        <th className='px-6 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider'>
                                            Account
                                        </th>
                                    )}
                                    {visibleCols.includes('entities') && (
                                        <th className='px-6 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider'>
                                            Entities
                                        </th>
                                    )}
                                    {visibleCols.includes('actions') && (
                                        <th className='px-6 py-3 text-right text-xs font-semibold text-secondary uppercase tracking-wider'>
                                            Actions
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-slate-100'>
                                {filtered.map((item) => (
                                    <tr
                                        key={item.id}
                                        className='transition-all duration-200 hover:bg-indigo-50/40 hover:shadow-[0_2px_12px_-6px_rgba(79,70,229,0.35)]'
                                    >
                                        {visibleCols.includes('enterprise') && (
                                            <td className='px-6 py-4 whitespace-nowrap text-sm text-primary'>
                                                {item.enterpriseName}
                                            </td>
                                        )}
                                        {visibleCols.includes('account') && (
                                            <td className='px-6 py-4 whitespace-nowrap text-sm text-primary'>
                                                {item.accountName}
                                            </td>
                                        )}
                                        {visibleCols.includes('entities') && (
                                            <td className='px-6 py-4'>
                                                <div className='flex flex-wrap gap-2'>
                                                    {item.entities.map(
                                                        (e, idx) => (
                                                            <span
                                                                key={idx}
                                                                className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border ${colorClass(
                                                                    idx,
                                                                )}`}
                                                            >
                                                                {e}
                                                            </span>
                                                        ),
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                        {visibleCols.includes('actions') && (
                                            <td className='px-6 py-4 whitespace-nowrap text-right text-sm'>
                                                <ActionsMenu
                                                    onView={() =>
                                                        setViewing(item)
                                                    }
                                                    onEdit={() => {
                                                        setEditing(item);
                                                        setShowForm(true);
                                                    }}
                                                    onDelete={() =>
                                                        handleDelete(item.id)
                                                    }
                                                />
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showForm && (
                <CreateOrEditModal
                    onCancel={() => {
                        setShowForm(false);
                        setEditing(null);
                    }}
                    onSave={(data) => handleSave(data, editing?.id)}
                    accounts={accounts}
                    enterprises={enterprises}
                    initialValue={editing ?? undefined}
                />
            )}

            {viewing && (
                <ViewDetailsModal
                    item={viewing}
                    onClose={() => setViewing(null)}
                />
            )}

            <ConfirmModal
                open={pendingDeleteId !== null}
                title='Confirm delete'
                message={`Delete ${(() => {
                    const t = items.find((i) => i.id === pendingDeleteId);
                    return t
                        ? `${t.enterpriseName} - ${t.accountName}`
                        : 'this record';
                })()}?\n\nThis action can’t be undone. The item will be permanently removed.`}
                onCancel={() => setPendingDeleteId(null)}
                onConfirm={async () => {
                    if (!pendingDeleteId) return;
                    await api.del(`/api/business-units/${pendingDeleteId}`);
                    await loadAll();
                    setPendingDeleteId(null);
                }}
            />
        </div>
    );
}

function colorClass(index: number): string {
    const classes = [
        'bg-blue-50 text-blue-700 border-blue-200',
        'bg-emerald-50 text-emerald-700 border-emerald-200',
        'bg-amber-50 text-amber-700 border-amber-200',
        'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
        'bg-cyan-50 text-cyan-700 border-cyan-200',
        'bg-rose-50 text-rose-700 border-rose-200',
    ];
    return classes[index % classes.length];
}

interface CreateOrEditModalProps {
    onSave: (data: Omit<BUSetting, 'id'>) => void;
    onCancel: () => void;
    accounts: AccountMinimal[];
    enterprises: EnterpriseMinimal[];
    initialValue?: BUSetting;
}

function CreateOrEditModal({
    onSave,
    onCancel,
    accounts,
    enterprises,
    initialValue,
}: CreateOrEditModalProps) {
    const [accountId, setAccountId] = useState(initialValue?.accountId || '');
    const [enterpriseName, setEnterpriseName] = useState(
        initialValue?.enterpriseName || '',
    );
    const [enterpriseId, setEnterpriseId] = useState(
        initialValue?.enterpriseId || '',
    );
    const [entities, setEntities] = useState<string[]>(
        initialValue?.entities || [],
    );
    const [entityInput, setEntityInput] = useState('');
    const [loadingAcc, setLoadingAcc] = useState(false);
    const [loadingEnt, setLoadingEnt] = useState(false);
    const [accOptions, setAccOptions] = useState<AccountMinimal[]>(accounts);
    const [entOptions, setEntOptions] =
        useState<EnterpriseMinimal[]>(enterprises);

    const accountName = useMemo(() => {
        return accOptions.find((a) => a.id === accountId)?.accountName || '';
    }, [accOptions, accountId]);

    useEffect(() => {
        // Refresh options when modal opens
        const fetchAcc = async () => {
            setLoadingAcc(true);
            try {
                const list = await api.get<AccountMinimal[]>('/api/accounts');
                setAccOptions(list || []);
            } catch {
                setAccOptions([]);
            } finally {
                setLoadingAcc(false);
            }
        };
        const fetchEnt = async () => {
            setLoadingEnt(true);
            try {
                const list = await api.get<EnterpriseMinimal[]>(
                    '/api/enterprises',
                );
                setEntOptions(list || []);
            } catch {
                setEntOptions([]);
            } finally {
                setLoadingEnt(false);
            }
        };
        fetchAcc().catch(() => {});
        fetchEnt().catch(() => {});
    }, []);

    const canSave =
        accountId && (enterpriseId || enterpriseName) && entities.length > 0;

    const addEntity = () => {
        const value = entityInput.trim();
        if (value && !entities.includes(value)) {
            setEntities([...entities, value]);
        }
        setEntityInput('');
    };

    const removeEntity = (name: string) => {
        setEntities(entities.filter((e) => e !== name));
    };

    return (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 p-4'>
            <div className='bg-card rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto'>
                <div className='px-6 py-4 border-b border-light'>
                    <h3 className='text-lg font-bold text-primary'>
                        {initialValue
                            ? 'Edit BU Settings'
                            : 'Create New BU Settings'}
                    </h3>
                </div>

                <div className='p-6 space-y-6'>
                    {/* Select account dropdown */}
                    <div>
                        <label className='block text-sm font-semibold text-primary mb-2'>
                            Select Account
                        </label>
                        <select
                            value={accountId}
                            onChange={(e) => setAccountId(e.target.value)}
                            className='block w-full px-3 py-2.5 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-brand bg-card text-primary'
                        >
                            <option value=''>Select an account</option>
                            {accOptions.map((a) => (
                                <option key={a.id} value={a.id}>
                                    {a.accountName}
                                </option>
                            ))}
                        </select>
                        {loadingAcc && (
                            <div className='text-xs text-secondary mt-1'>
                                Loading accounts…
                            </div>
                        )}
                        {accOptions.length === 0 && !loadingAcc && (
                            <div className='text-xs text-secondary mt-1'>
                                No accounts found.{' '}
                                <a
                                    href='/account-settings/manage-accounts'
                                    className='text-brand hover:text-brand-dark underline'
                                >
                                    Create a new account
                                </a>
                                .
                            </div>
                        )}
                    </div>

                    {/* Select enterprise dropdown */}
                    <div>
                        <label className='block text-sm font-semibold text-primary mb-2'>
                            Select Enterprise
                        </label>
                        <select
                            value={enterpriseId}
                            onChange={(e) => {
                                const id = e.target.value;
                                setEnterpriseId(id);
                                const ent = entOptions.find((x) => x.id === id);
                                setEnterpriseName(ent?.name || '');
                            }}
                            className='block w-full px-3 py-2.5 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-brand bg-card text-primary'
                        >
                            <option value=''>Select an enterprise</option>
                            {entOptions.map((e) => (
                                <option key={e.id} value={e.id}>
                                    {e.name}
                                </option>
                            ))}
                        </select>
                        {loadingEnt && (
                            <div className='text-xs text-secondary mt-1'>
                                Loading enterprises…
                            </div>
                        )}
                        {entOptions.length === 0 && !loadingEnt && (
                            <div className='text-xs text-secondary mt-1'>
                                No enterprises found.{' '}
                                <a
                                    href='/account-settings/enterprise-configuration'
                                    className='text-brand hover:text-brand-dark underline'
                                >
                                    Create a new enterprise
                                </a>
                                .
                            </div>
                        )}
                    </div>

                    {/* Entities input */}
                    <div>
                        <label className='block text-sm font-semibold text-primary mb-2'>
                            Entities
                        </label>
                        <div className='flex space-x-2'>
                            <input
                                type='text'
                                value={entityInput}
                                onChange={(e) => setEntityInput(e.target.value)}
                                placeholder='e.g., Finance, People, HR'
                                className='flex-1 block px-3 py-2.5 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-brand bg-card text-primary placeholder-secondary'
                            />
                            <button
                                type='button'
                                onClick={addEntity}
                                className='px-4 py-2.5 border border-primary bg-primary-light text-brand rounded-lg hover:bg-primary-light/80 transition-colors duration-200'
                            >
                                + Add new entity
                            </button>
                        </div>

                        {/* Entity chips */}
                        <div className='flex flex-wrap gap-2 mt-3'>
                            {entities.map((name, idx) => (
                                <span
                                    key={name}
                                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${colorClass(
                                        idx,
                                    )}`}
                                >
                                    {name}
                                    <button
                                        onClick={() => removeEntity(name)}
                                        className='ml-2 text-brand hover:text-red-600'
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                            {entities.length === 0 && (
                                <span className='text-sm text-secondary italic'>
                                    No entities added
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className='px-6 py-4 border-t border-light flex justify-end space-x-3'>
                    <button
                        onClick={onCancel}
                        className='px-4 py-2 text-sm font-medium text-secondary bg-tertiary hover:bg-slate-200 rounded-lg transition-colors duration-200'
                    >
                        Discard
                    </button>
                    <button
                        onClick={() =>
                            onSave({
                                accountId,
                                accountName,
                                enterpriseId,
                                enterpriseName,
                                entities,
                            })
                        }
                        disabled={!canSave}
                        className='px-4 py-2 text-sm font-medium text-inverse bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all duration-200'
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}

function ViewDetailsModal({
    item,
    onClose,
}: {
    item: BUSetting;
    onClose: () => void;
}) {
    return (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 p-4'>
            <div className='bg-card rounded-xl shadow-xl w-full max-w-xl max-h-[80vh] overflow-y-auto'>
                <div className='px-6 py-4 border-b border-light flex items-center justify-between'>
                    <h3 className='text-lg font-bold text-primary'>
                        View BU Settings
                    </h3>
                    <button
                        onClick={onClose}
                        className='text-secondary hover:text-primary'
                    >
                        ×
                    </button>
                </div>
                <div className='p-6 space-y-4'>
                    <div>
                        <div className='text-xs font-semibold text-secondary uppercase tracking-wider mb-1'>
                            Enterprise
                        </div>
                        <div className='text-primary'>
                            {item.enterpriseName}
                        </div>
                    </div>
                    <div>
                        <div className='text-xs font-semibold text-secondary uppercase tracking-wider mb-1'>
                            Account
                        </div>
                        <div className='text-primary'>{item.accountName}</div>
                    </div>
                    <div>
                        <div className='text-xs font-semibold text-secondary uppercase tracking-wider mb-1'>
                            Entities
                        </div>
                        <div className='flex flex-wrap gap-2'>
                            {item.entities.map((e, idx) => (
                                <span
                                    key={idx}
                                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border ${colorClass(
                                        idx,
                                    )}`}
                                >
                                    {e}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
                <div className='px-6 py-4 border-t border-light flex justify-end'>
                    <button
                        onClick={onClose}
                        className='px-4 py-2 text-sm font-medium text-inverse bg-primary hover:bg-primary-dark rounded-lg transition-all duration-200'
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

function ActionsMenu({
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
        const menuHeight = 160; // approximate
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
                className='p-2 rounded-full hover:bg-tertiary/60 border border-light'
                aria-label='Actions'
            >
                <EllipsisVerticalIcon className='w-5 h-5 text-secondary' />
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
                    className={`w-40 rounded-md shadow-lg bg-card border border-light ring-1 ring-black ring-opacity-5 focus:outline-none`}
                >
                    <div className='py-1'>
                        <button
                            onClick={() => {
                                setOpen(false);
                                onView();
                            }}
                            className='w-full px-4 py-2 text-left text-sm text-primary hover:bg-tertiary/50 flex items-center'
                        >
                            <EyeIcon className='w-4 h-4 mr-2' />
                            View
                        </button>
                        <button
                            onClick={() => {
                                setOpen(false);
                                onEdit();
                            }}
                            className='w-full px-4 py-2 text-left text-sm text-primary hover:bg-tertiary/50 flex items-center'
                        >
                            <PencilSquareIcon className='w-4 h-4 mr-2' />
                            Edit
                        </button>
                        <button
                            onClick={() => {
                                setOpen(false);
                                onDelete();
                            }}
                            className='w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center'
                        >
                            <TrashIcon className='w-4 h-4 mr-2' />
                            Delete
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
