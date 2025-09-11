'use client';

import {useEffect, useMemo, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {Pin, PinOff} from 'lucide-react';
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
    const [trashHot, setTrashHot] = useState(false);
    const [visibleCols, setVisibleCols] = useState<
        Array<'enterprise' | 'account' | 'entities'>
    >(['enterprise', 'account', 'entities']);
    const [hideQuery, setHideQuery] = useState('');
    const [ActiveGroup, setActiveGroup] = useState<
        'None' | 'Enterprise' | 'Account'
    >('None');

    // Inline draft rows for quick-create
    type DraftBU = {
        key: string;
        accountId: string;
        enterpriseId: string;
        entities: string[];
    };
    const [addingRows, setAddingRows] = useState<DraftBU[]>([]);
    const saveTimersRef = useRef<Record<string, any>>({});
    const addingSavingRef = useRef<Set<string>>(new Set());

    const addDraftRow = () => {
        setAddingRows((prev) => [
            ...prev,
            {
                key: `draft-${Date.now()}-${Math.random()
                    .toString(36)
                    .slice(2)}`,
                accountId: '',
                enterpriseId: '',
                entities: [],
            },
        ]);
    };

    const loadAll = async () => {
        const [bus, acc, ent] = await Promise.all([
            api.get<any[]>('/api/business-units'),
            api.get<AccountMinimal[]>('/api/accounts'),
            api.get<EnterpriseMinimal[]>('/api/enterprises'),
        ]);
        // Transform business units data to parse entities from JSON string to array
        const transformedBus = bus.map((item) => ({
            ...item,
            id: String(item.id),
            accountId: String(item.clientId || ''),
            accountName: item.accountName || '',
            enterpriseId: String(item.enterpriseId || ''),
            enterpriseName: item.enterpriseName || '',
            // Parse entities from JSON string to array
            entities: (() => {
                try {
                    if (!item.entities) return [];
                    const parsed = JSON.parse(item.entities);
                    // Handle different formats - could be object with keys or array
                    if (Array.isArray(parsed)) return parsed;
                    if (typeof parsed === 'object') return Object.keys(parsed);
                    return [];
                } catch (e) {
                    console.error('Failed to parse entities:', e);
                    return [];
                }
            })(),
        }));
        setItems(transformedBus);
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
                            Create and manage business unit configurations — map
                            each Account to an Enterprise and define one or more
                            Entities that scope permissions, workflows, and
                            reporting.
                        </p>
                    </div>
                </div>
            </div>

            <div className='bg-card border-b border-light px-6 py-4'>
                <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                        <button
                            onClick={() => {
                                addDraftRow();
                            }}
                            className='inline-flex items-center px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-inverse bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200'
                        >
                            <PlusIcon className='h-5 w-5 mr-2' />
                            Create New BU Settings
                        </button>
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
                                                value={ActiveGroup}
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
                        className={`inline-flex items-center justify-center h-9 w-9 rounded-full border ${
                            trashHot
                                ? 'border-rose-300 text-rose-700 bg-rose-50'
                                : 'border-light text-secondary hover:text-red-600 hover:bg-red-50'
                        }`}
                        title='Trash (drag rows here)'
                        onDragOver={(e) => {
                            e.preventDefault();
                            setTrashHot(true);
                        }}
                        onDragEnter={(e) => {
                            e.preventDefault();
                            setTrashHot(true);
                        }}
                        onDragLeave={() => setTrashHot(false)}
                        onDrop={(e) => {
                            e.preventDefault();
                            setTrashHot(false);
                            try {
                                let idStr: string | null = null;
                                const json =
                                    e.dataTransfer.getData('application/json');
                                if (json) {
                                    const payload = JSON.parse(json);
                                    if (payload && payload.id)
                                        idStr = String(payload.id);
                                }
                                if (!idStr) {
                                    const txt =
                                        e.dataTransfer.getData('text/plain');
                                    if (txt) idStr = txt.trim();
                                }
                                if (idStr) setPendingDeleteId(idStr);
                            } catch {}
                        }}
                    >
                        <TrashIcon className='w-5 h-5' />
                    </button>
                </div>
            </div>

            <div className='flex-1 p-6'>
                {filtered.length === 0 && addingRows.length === 0 ? (
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
                        <table
                            className='min-w-full divide-y divide-slate-100'
                            style={{tableLayout: 'fixed'}}
                        >
                            <colgroup>
                                <col style={{width: '32%'}} />
                                <col style={{width: '32%'}} />
                                <col style={{width: '36%'}} />
                            </colgroup>
                            <thead className='bg-tertiary/40'>
                                <tr>
                                    {visibleCols.includes('enterprise') && (
                                        <th className='px-6 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider sticky left-0 z-10 bg-tertiary/40'>
                                            <span className='inline-flex items-center gap-1'>
                                                Enterprise
                                                <span className='inline-block ml-1 text-slate-400'></span>
                                            </span>
                                        </th>
                                    )}
                                    {visibleCols.includes('account') && (
                                        <th className='px-6 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider'>
                                            <span className='inline-flex items-center gap-1'>
                                                Account
                                                <span className='inline-block ml-1 text-slate-400'></span>
                                            </span>
                                        </th>
                                    )}
                                    {visibleCols.includes('entities') && (
                                        <th className='px-6 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider'>
                                            <span className='inline-flex items-center gap-1'>
                                                Entities
                                                <span className='inline-block ml-1 text-slate-400'></span>
                                            </span>
                                        </th>
                                    )}
                                    {/* Actions column removed */}
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-slate-100'>
                                {addingRows.map((d) => (
                                    <DraftRow
                                        key={d.key}
                                        draft={d}
                                        accounts={accounts}
                                        enterprises={enterprises}
                                        onChange={(next) =>
                                            setAddingRows((prev) =>
                                                prev.map((r) =>
                                                    r.key === d.key ? next : r,
                                                ),
                                            )
                                        }
                                        onCancel={() =>
                                            setAddingRows((prev) =>
                                                prev.filter(
                                                    (r) => r.key !== d.key,
                                                ),
                                            )
                                        }
                                        onSaved={async () => {
                                            await loadAll();
                                            setAddingRows((prev) =>
                                                prev.filter(
                                                    (r) => r.key !== d.key,
                                                ),
                                            );
                                        }}
                                    />
                                ))}
                                <tr>
                                    <td className='px-6 py-3' colSpan={3}>
                                        <button
                                            onClick={() => addDraftRow()}
                                            className='w-full flex items-center gap-2 px-3 py-2 text-[12px] text-slate-600 border border-dashed border-slate-300 rounded-md bg-slate-50/40 hover:bg-slate-100'
                                        >
                                            <span className='inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300'>
                                                +
                                            </span>
                                            <span>Add new row</span>
                                        </button>
                                    </td>
                                </tr>
                                {filtered.map((item) => (
                                    <tr
                                        key={item.id}
                                        className='transition-all duration-200 hover:bg-indigo-50/40 hover:shadow-[0_2px_12px_-6px_rgba(79,70,229,0.35)]'
                                    >
                                        {visibleCols.includes('enterprise') && (
                                            <td className='px-6 py-4 whitespace-nowrap text-sm text-primary'>
                                                <div
                                                    draggable
                                                    onDragStart={(e) => {
                                                        try {
                                                            e.dataTransfer.effectAllowed =
                                                                'move';
                                                            e.dataTransfer.setData(
                                                                'application/json',
                                                                JSON.stringify({
                                                                    id: item.id,
                                                                }),
                                                            );
                                                            e.dataTransfer.setData(
                                                                'text/plain',
                                                                String(item.id),
                                                            );
                                                            const ghost =
                                                                document.createElement(
                                                                    'div',
                                                                );
                                                            ghost.style.width =
                                                                '0px';
                                                            ghost.style.height =
                                                                '0px';
                                                            document.body.appendChild(
                                                                ghost,
                                                            );
                                                            e.dataTransfer.setDragImage(
                                                                ghost,
                                                                0,
                                                                0,
                                                            );
                                                            setTimeout(() => {
                                                                try {
                                                                    document.body.removeChild(
                                                                        ghost,
                                                                    );
                                                                } catch {}
                                                            }, 0);
                                                        } catch {}
                                                    }}
                                                    className='inline-flex items-center cursor-grab Active:cursor-grabbing select-none'
                                                    title='Drag to trash to delete'
                                                >
                                                    <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-700 border border-slate-300'>
                                                        {item.enterpriseName}
                                                    </span>
                                                </div>
                                            </td>
                                        )}
                                        {visibleCols.includes('account') && (
                                            <td className='px-6 py-4 whitespace-nowrap text-sm text-primary'>
                                                <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-700 border border-slate-300'>
                                                    {item.accountName}
                                                </span>
                                            </td>
                                        )}
                                        {visibleCols.includes('entities') && (
                                            <td className='px-6 py-4'>
                                                <div className='flex flex-wrap gap-1.5'>
                                                    {Array.isArray(
                                                        item.entities,
                                                    )
                                                        ? item.entities.map(
                                                              (e, idx) => (
                                                                  <span
                                                                      key={idx}
                                                                      className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-sky-50 text-sky-700 border border-sky-200'
                                                                  >
                                                                      {e}
                                                                  </span>
                                                              ),
                                                          )
                                                        : null}
                                                </div>
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

function DraftRow({
    draft,
    accounts,
    enterprises,
    onChange,
    onCancel,
    onSaved,
}: {
    draft: {
        key: string;
        accountId: string;
        enterpriseId: string;
        entities: string[];
    };
    accounts: AccountMinimal[];
    enterprises: EnterpriseMinimal[];
    onChange: (next: {
        key: string;
        accountId: string;
        enterpriseId: string;
        entities: string[];
    }) => void;
    onCancel: () => void;
    onSaved: () => void;
}) {
    const [entityInput, setEntityInput] = useState('');
    const [showEntityAdder, setShowEntityAdder] = useState(false);
    const canSave =
        draft.accountId && draft.enterpriseId && draft.entities.length > 0;

    const addEntity = () => {
        const v = entityInput.trim();
        if (!v) return;
        if (!draft.entities.includes(v))
            onChange({...draft, entities: [...draft.entities, v]});
        setEntityInput('');
        setShowEntityAdder(false);
    };
    const removeEntity = (name: string) =>
        onChange({
            ...draft,
            entities: draft.entities.filter((e) => e !== name),
        });

    const [saving, setSaving] = useState(false);
    // Debounced autosave on valid draft changes
    useEffect(() => {
        if (!canSave) return;
        const t = setTimeout(async () => {
            if (saving) return;
            setSaving(true);
            try {
                const accountName =
                    accounts.find((a) => a.id === draft.accountId)
                        ?.accountName || '';
                const ent = enterprises.find(
                    (e) => e.id === draft.enterpriseId,
                );
                const accIdNumeric = /^\d+$/.test(draft.accountId)
                    ? Number(draft.accountId)
                    : undefined;
                const entIdNumeric = /^\d+$/.test(draft.enterpriseId)
                    ? Number(draft.enterpriseId)
                    : undefined;
                const payload: any = {
                    accountName,
                    enterpriseName: ent?.name || '',
                    entities: draft.entities,
                };
                if (accIdNumeric !== undefined)
                    payload.accountId = accIdNumeric;
                if (entIdNumeric !== undefined)
                    payload.enterpriseId = entIdNumeric;
                await api.post('/api/business-units', payload);
                await onSaved();
            } catch {
            } finally {
                setSaving(false);
            }
        }, 700);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [draft.accountId, draft.enterpriseId, JSON.stringify(draft.entities)]);
    // Compact searchable dropdown used for enterprise/account, matching UX across app
    const Dropdown = ({
        placeholder,
        options,
        value,
        onPick,
        searchLabel,
    }: {
        placeholder: string;
        options: {id: string; name: string}[];
        value: string;
        onPick: (id: string) => void;
        searchLabel: string;
    }) => {
        const [open, setOpen] = useState(false);
        const [query, setQuery] = useState('');
        const [pos, setPos] = useState<{
            top: number;
            left: number;
            width: number;
        } | null>(null);
        const anchorRef = useRef<HTMLDivElement>(null);
        const dropdownRef = useRef<HTMLDivElement>(null);
        const filtered = useMemo(
            () =>
                options.filter((o) =>
                    query
                        ? o.name.toLowerCase().includes(query.toLowerCase())
                        : true,
                ),
            [options, query],
        );
        useEffect(() => {
            const onDoc = (e: MouseEvent) => {
                const t = e.target as Node;
                if (
                    !anchorRef.current?.contains(t) &&
                    !dropdownRef.current?.contains(t)
                )
                    setOpen(false);
            };
            document.addEventListener('click', onDoc, true);
            return () => document.removeEventListener('click', onDoc, true);
        }, []);
        useEffect(() => {
            if (!open) return;
            const rect = anchorRef.current?.getBoundingClientRect();
            if (rect) {
                const ddWidth = 220;
                const left = Math.max(
                    8,
                    Math.min(window.innerWidth - ddWidth - 8, rect.left),
                );
                setPos({top: rect.bottom + 8, left, width: ddWidth});
            }
        }, [open]);
        const currentLabel = options.find((o) => o.id === value)?.name;
        return (
            <div ref={anchorRef} className='relative'>
                <button
                    onClick={() => setOpen((v) => !v)}
                    className='w-full text-left px-3 py-1.5 text-[12px] rounded-md border border-slate-300 bg-white hover:bg-slate-50'
                >
                    {currentLabel || placeholder}
                </button>
                {open &&
                    pos &&
                    createPortal(
                        <div
                            ref={dropdownRef}
                            className='z-[9999] rounded-xl border border-slate-200 bg-white shadow-2xl'
                            style={{
                                position: 'fixed',
                                top: pos.top,
                                left: pos.left,
                                width: pos.width,
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                            role='listbox'
                            aria-label={`${searchLabel} options`}
                        >
                            <div className='p-2 border-b border-slate-200'>
                                <input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder={`Search ${searchLabel}`}
                                    className='w-full rounded border border-slate-300 px-2.5 py-1 text-[12px]'
                                />
                            </div>
                            <div className='max-h-60 overflow-auto p-2 space-y-1.5'>
                                {filtered.map((o, idx) => (
                                    <button
                                        key={o.id}
                                        onClick={() => {
                                            onPick(o.id);
                                            setOpen(false);
                                        }}
                                        className={`w-full rounded-md px-2.5 py-2 text-[12px] text-white ${
                                            [
                                                'bg-sky-500 hover:bg-sky-400',
                                                'bg-emerald-500 hover:bg-emerald-400',
                                                'bg-amber-500 hover:bg-amber-400',
                                                'bg-violet-500 hover:bg-violet-400',
                                                'bg-rose-500 hover:bg-rose-400',
                                            ][idx % 5]
                                        }`}
                                    >
                                        {o.name}
                                    </button>
                                ))}
                            </div>
                        </div>,
                        document.body,
                    )}
            </div>
        );
    };

    return (
        <tr className='bg-indigo-50/30'>
            <td className='px-6 py-3'>
                <Dropdown
                    placeholder='Select enterprise'
                    options={enterprises.map((e: any) => ({
                        id: String(e.numericId ?? e.id),
                        name: e.name,
                    }))}
                    value={draft.enterpriseId}
                    onPick={(id) => onChange({...draft, enterpriseId: id})}
                    searchLabel='enterprises'
                />
            </td>
            <td className='px-6 py-3'>
                <Dropdown
                    placeholder='Select account'
                    options={accounts.map((a: any) => ({
                        id: String(a.numericId ?? a.id),
                        name: a.accountName,
                    }))}
                    value={draft.accountId}
                    onPick={(id) => onChange({...draft, accountId: id})}
                    searchLabel='accounts'
                />
            </td>
            <td className='px-6 py-3'>
                <div className='flex items-center justify-between gap-3'>
                    <div className='flex flex-wrap gap-1.5'>
                        {draft.entities.map((e, idx) => (
                            <span
                                key={`${draft.key}-${idx}`}
                                className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-200'
                            >
                                {e}
                                <button
                                    className='ml-0.5 text-indigo-700/70 hover:text-indigo-900'
                                    onClick={() => removeEntity(e)}
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                    <div className='shrink-0 flex items-center'>
                        {showEntityAdder ? (
                            <div className='flex items-center gap-2'>
                                <input
                                    value={entityInput}
                                    onChange={(e) =>
                                        setEntityInput(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') addEntity();
                                        if (e.key === 'Escape') {
                                            setShowEntityAdder(false);
                                            setEntityInput('');
                                        }
                                    }}
                                    placeholder='Enter entity name'
                                    className='w-44 rounded border border-light px-2 py-1 text-sm'
                                />
                                <button
                                    onClick={addEntity}
                                    className='px-2 py-1 rounded bg-violet-600 text-white text-sm'
                                >
                                    Add
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowEntityAdder(true)}
                                className='inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50 shadow-sm'
                                title='Add entity'
                            >
                                +
                            </button>
                        )}
                    </div>
                </div>
            </td>
            {/* Actions column removed; autosave handles persistence */}
        </tr>
    );
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
